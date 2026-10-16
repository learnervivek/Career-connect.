import { Interview, INTERVIEW_ROUNDS, INTERVIEW_TYPES, INTERVIEW_STATUSES } from "../models/interview.models.js";
import { Application } from "../models/application.models.js";
import { Job } from "../models/job.models.js";
import { User } from "../models/user.model.js";
import {
    notifyInterviewScheduled,
    notifyInterviewConfirmed,
    notifyRescheduleRequested,
    notifyInterviewRescheduled,
    notifyInterviewCancelled,
    notifyInterviewCompleted,
} from "../services/notificationService.js";

// ─── SAFE POPULATION PROJECTIONS ───────────────────────────────────────────
const CANDIDATE_SAFE_FIELDS = "fullname email phoneNumber profile.skills profile.resume profile.resumeOriginalName profile.profilePhoto";
const RECRUITER_SAFE_FIELDS = "fullname email phoneNumber profile.profilePhoto";
const JOB_SAFE_FIELDS = "title location jobType salary experienceLevel company";
const COMPANY_SAFE_FIELDS = "companyName name logo website location";

// ─── VALIDATION & CONFLICT HELPERS ─────────────────────────────────────────

/**
 * Validates a meeting URL format (must begin with http:// or https://)
 */
const isValidHttpUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
};

/**
 * Checks for overlapping active interviews (status: Scheduled or Confirmed)
 * for a specific user within a time window.
 */
const checkDoubleBooking = async ({ userId, userField, startTime, durationMinutes, excludeInterviewId = null }) => {
    const newStart = new Date(startTime).getTime();
    const newEnd = newStart + durationMinutes * 60 * 1000;

    // Search active interviews in an 8-hour radius around start
    const searchWindowStart = new Date(newStart - 8 * 60 * 60 * 1000);
    const searchWindowEnd = new Date(newEnd + 8 * 60 * 60 * 1000);

    const query = {
        [userField]: userId,
        status: { $in: ["Scheduled", "Confirmed"] },
        scheduledDate: { $gte: searchWindowStart, $lte: searchWindowEnd },
    };

    if (excludeInterviewId) {
        query._id = { $ne: excludeInterviewId };
    }

    const existingInterviews = await Interview.find(query).select("scheduledDate duration round roundNumber job");

    for (const interview of existingInterviews) {
        const existStart = new Date(interview.scheduledDate).getTime();
        const existEnd = existStart + (interview.duration || 45) * 60 * 1000;

        // Interval overlap: startA < endB && endA > startB
        if (newStart < existEnd && newEnd > existStart) {
            return interview;
        }
    }

    return null;
};

/**
 * Detects accidental duplicate submissions for the same application and round within a narrow timeframe.
 */
const checkDuplicateSubmission = async ({ applicationId, round, startTime, excludeInterviewId = null }) => {
    const targetTime = new Date(startTime).getTime();
    const windowStart = new Date(targetTime - 5 * 60 * 1000);
    const windowEnd = new Date(targetTime + 5 * 60 * 1000);

    const query = {
        application: applicationId,
        round,
        status: { $in: ["Scheduled", "Confirmed"] },
        scheduledDate: { $gte: windowStart, $lte: windowEnd },
    };

    if (excludeInterviewId) {
        query._id = { $ne: excludeInterviewId };
    }

    return await Interview.findOne(query);
};

// ─── CONTROLLERS ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/interviews
 * Recruiter schedules an interview round for an accepted application.
 */
export const scheduleInterview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const {
            applicationId,
            round,
            roundNumber,
            interviewType,
            scheduledDate,
            duration,
            meetingUrl,
            venue,
            instructions,
            candidateId, // validated against application, never trusted alone
        } = req.body;

        // 1. Required field validations
        if (!applicationId) {
            return res.status(400).json({
                message: "Application ID is required",
                success: false,
            });
        }

        if (!scheduledDate) {
            return res.status(400).json({
                message: "Scheduled date and time is required",
                success: false,
            });
        }

        const parsedDate = new Date(scheduledDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format for scheduledDate",
                success: false,
            });
        }

        if (parsedDate.getTime() <= Date.now()) {
            return res.status(400).json({
                message: "Scheduled date and time must be in the future",
                success: false,
            });
        }

        // Validate duration
        const interviewDuration = duration ? Number(duration) : 45;
        if (isNaN(interviewDuration) || interviewDuration < 5 || interviewDuration > 480) {
            return res.status(400).json({
                message: "Duration must be a number between 5 and 480 minutes",
                success: false,
            });
        }

        // Validate round
        const selectedRound = round || "Technical";
        if (!INTERVIEW_ROUNDS.includes(selectedRound)) {
            return res.status(400).json({
                message: `Invalid round '${selectedRound}'. Allowed: ${INTERVIEW_ROUNDS.join(", ")}`,
                success: false,
            });
        }

        // Validate interview type
        const selectedType = interviewType || "Online";
        if (!INTERVIEW_TYPES.includes(selectedType)) {
            return res.status(400).json({
                message: `Invalid interview type '${selectedType}'. Allowed: ${INTERVIEW_TYPES.join(", ")}`,
                success: false,
            });
        }

        // Validate meetingUrl for Online interviews
        if (selectedType === "Online") {
            if (!meetingUrl || meetingUrl.trim() === "") {
                return res.status(400).json({
                    message: "A valid meeting URL is required for online interviews",
                    success: false,
                });
            }
            if (!isValidHttpUrl(meetingUrl.trim())) {
                return res.status(400).json({
                    message: "Meeting URL must start with http:// or https:// (e.g., https://meet.google.com/xyz)",
                    success: false,
                });
            }
        }

        // Validate venue for In-person interviews
        if (selectedType === "In-person") {
            if (!venue || venue.trim().length < 3) {
                return res.status(400).json({
                    message: "A physical venue address/location (minimum 3 characters) is required for in-person interviews",
                    success: false,
                });
            }
        }

        // 2. Fetch application and verify relations
        const application = await Application.findById(applicationId)
            .populate("job")
            .populate("applicant", CANDIDATE_SAFE_FIELDS);

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        if (!application.job) {
            return res.status(404).json({
                message: "Associated job not found",
                success: false,
            });
        }

        if (!application.applicant) {
            return res.status(404).json({
                message: "Associated candidate applicant not found",
                success: false,
            });
        }

        // 3. Ownership Verification (Never trust client-supplied recruiter/candidate IDs)
        const job = application.job;
        if (job.created_by.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to schedule interviews for this application. Only the recruiter who posted the job can schedule interviews.",
                success: false,
            });
        }

        // Candidate is strictly derived from application.applicant._id
        const actualCandidateId = application.applicant._id;
        if (candidateId && candidateId.toString() !== actualCandidateId.toString()) {
            return res.status(400).json({
                message: "Candidate ID supplied does not match the application applicant",
                success: false,
            });
        }

        // 4. Application Status Verification (Requirement 3)
        // Allow scheduling only for applications in an accepted/shortlisted state
        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Cannot schedule an interview for a rejected application.",
                success: false,
            });
        }

        if (application.status !== "accepted") {
            return res.status(400).json({
                message: `Interview can only be scheduled for accepted/shortlisted applications. Current status is '${application.status}'. Please shortlist the applicant first.`,
                success: false,
            });
        }

        // 5. Prevent accidental duplicate submissions
        const duplicate = await checkDuplicateSubmission({
            applicationId,
            round: selectedRound,
            startTime: parsedDate,
        });

        if (duplicate) {
            return res.status(409).json({
                message: "A duplicate interview for this application and round is already scheduled around this time",
                success: false,
            });
        }

        // 6. Prevent double-booking for candidate and recruiter
        const candidateConflict = await checkDoubleBooking({
            userId: actualCandidateId,
            userField: "candidate",
            startTime: parsedDate,
            durationMinutes: interviewDuration,
        });

        if (candidateConflict) {
            return res.status(409).json({
                message: `Double-booking conflict: The candidate already has an active interview scheduled around ${new Date(candidateConflict.scheduledDate).toLocaleTimeString()}`,
                success: false,
            });
        }

        const recruiterConflict = await checkDoubleBooking({
            userId: recruiterId,
            userField: "recruiter",
            startTime: parsedDate,
            durationMinutes: interviewDuration,
        });

        if (recruiterConflict) {
            return res.status(409).json({
                message: `Double-booking conflict: You already have another interview scheduled around ${new Date(recruiterConflict.scheduledDate).toLocaleTimeString()}`,
                success: false,
            });
        }

        // 7. Support multiple rounds: auto-increment roundNumber if not provided
        const existingRoundsCount = await Interview.countDocuments({ application: applicationId });
        const assignedRoundNumber = roundNumber ? Number(roundNumber) : existingRoundsCount + 1;

        // 8. Create Interview record
        const newInterview = await Interview.create({
            application: applicationId,
            job: job._id,
            recruiter: recruiterId,
            candidate: actualCandidateId,
            round: selectedRound,
            roundNumber: assignedRoundNumber,
            interviewType: selectedType,
            scheduledDate: parsedDate,
            duration: interviewDuration,
            meetingUrl: selectedType === "Online" ? meetingUrl.trim() : (meetingUrl?.trim() || ""),
            venue: selectedType === "In-person" ? venue.trim() : (venue?.trim() || ""),
            instructions: instructions?.trim() || "",
            status: "Scheduled",
        });

        // Push to application.interviews array
        if (!application.interviews) {
            application.interviews = [];
        }
        application.interviews.push(newInterview._id);
        await application.save();

        const populatedInterview = await Interview.findById(newInterview._id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Trigger in-app notification & asynchronous email
        notifyInterviewScheduled({
            interview: populatedInterview,
            candidate: populatedInterview.candidate,
            recruiter: populatedInterview.recruiter,
            job: populatedInterview.job,
        });

        return res.status(201).json({
            message: `Interview round ${assignedRoundNumber} (${selectedRound}) scheduled successfully`,
            interview: populatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error scheduling interview:", error);
        return res.status(500).json({
            message: error.message || "Failed to schedule interview",
            success: false,
        });
    }
};

/**
 * GET /api/v1/interviews/candidate
 * Authenticated candidate retrieves interviews scheduled for them.
 */
export const getCandidateInterviews = async (req, res) => {
    try {
        const candidateId = req.id;
        const { status, upcoming, page = 1, limit = 10 } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = { candidate: candidateId };

        if (status && INTERVIEW_STATUSES.includes(status)) {
            query.status = status;
        }

        if (upcoming === "true") {
            query.scheduledDate = { $gte: new Date() };
        } else if (upcoming === "false") {
            query.scheduledDate = { $lt: new Date() };
        }

        const total = await Interview.countDocuments(query);

        const interviews = await Interview.find(query)
            .sort({ scheduledDate: 1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            })
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate("application", "status createdAt");

        return res.status(200).json({
            message: interviews.length > 0 ? "Interviews retrieved successfully" : "No interviews found",
            count: interviews.length,
            total,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
            interviews,
            success: true,
        });

    } catch (error) {
        console.error("Error fetching candidate interviews:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch candidate interviews",
            success: false,
        });
    }
};

/**
 * GET /api/v1/interviews/recruiter
 * Authenticated recruiter retrieves interviews they manage.
 */
export const getRecruiterInterviews = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { status, jobId, upcoming, page = 1, limit = 10 } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const query = { recruiter: recruiterId };

        if (status && INTERVIEW_STATUSES.includes(status)) {
            query.status = status;
        }

        if (jobId) {
            query.job = jobId;
        }

        if (upcoming === "true") {
            query.scheduledDate = { $gte: new Date() };
        } else if (upcoming === "false") {
            query.scheduledDate = { $lt: new Date() };
        }

        const total = await Interview.countDocuments(query);

        const interviews = await Interview.find(query)
            .sort({ scheduledDate: 1 })
            .skip(skip)
            .limit(limitNum)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            })
            .populate("application", "status createdAt");

        return res.status(200).json({
            message: interviews.length > 0 ? "Interviews retrieved successfully" : "No interviews found",
            count: interviews.length,
            total,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
            interviews,
            success: true,
        });

    } catch (error) {
        console.error("Error fetching recruiter interviews:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch recruiter interviews",
            success: false,
        });
    }
};

/**
 * GET /api/v1/interviews/:id
 * Retrieve interview details after verifying access (recruiter or candidate).
 */
export const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const interview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: `${JOB_SAFE_FIELDS} requirements description`,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            })
            .populate("application", "status createdAt");

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // Access Verification: Only candidate or recruiter can view
        const isCandidate = interview.candidate._id.toString() === userId.toString();
        const isRecruiter = interview.recruiter._id.toString() === userId.toString();

        if (!isCandidate && !isRecruiter) {
            return res.status(403).json({
                message: "You are not authorized to view this interview",
                success: false,
            });
        }

        return res.status(200).json({
            interview,
            success: true,
        });

    } catch (error) {
        console.error("Error fetching interview by ID:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch interview",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/interviews/:id/confirm
 * Candidate confirms an invitation.
 */
export const confirmInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const candidateId = req.id;

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // 1. Ownership: only candidate can confirm
        if (interview.candidate.toString() !== candidateId.toString()) {
            return res.status(403).json({
                message: "Only the invited candidate can confirm this interview",
                success: false,
            });
        }

        // 2. Reject invalid transitions
        if (interview.status === "Confirmed") {
            return res.status(400).json({
                message: "Interview is already confirmed",
                success: false,
            });
        }

        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot confirm a cancelled interview",
                success: false,
            });
        }

        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Cannot confirm an already completed interview",
                success: false,
            });
        }

        // 3. Reject if scheduled date has already passed
        if (new Date(interview.scheduledDate).getTime() <= Date.now()) {
            return res.status(400).json({
                message: "Cannot confirm an interview whose scheduled date and time has already passed",
                success: false,
            });
        }

        interview.status = "Confirmed";
        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Notify recruiter of candidate confirmation
        notifyInterviewConfirmed({
            interview: updatedInterview,
            candidate: updatedInterview.candidate,
            recruiter: updatedInterview.recruiter,
            job: updatedInterview.job,
        });

        return res.status(200).json({
            message: "Interview invitation confirmed successfully",
            interview: updatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error confirming interview:", error);
        return res.status(500).json({
            message: error.message || "Failed to confirm interview",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/interviews/:id/reschedule-request
 * Candidate requests rescheduling.
 */
export const requestReschedule = async (req, res) => {
    try {
        const { id } = req.params;
        const candidateId = req.id;
        const { rescheduleReason, proposedDate } = req.body;

        if (!rescheduleReason || rescheduleReason.trim().length < 5) {
            return res.status(400).json({
                message: "A clear reschedule reason (at least 5 characters) is required",
                success: false,
            });
        }

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // 1. Ownership: only candidate can request
        if (interview.candidate.toString() !== candidateId.toString()) {
            return res.status(403).json({
                message: "Only the invited candidate can request rescheduling for this interview",
                success: false,
            });
        }

        // 2. Reject invalid transitions
        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot request rescheduling for a cancelled interview",
                success: false,
            });
        }

        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Cannot request rescheduling for an already completed interview",
                success: false,
            });
        }

        if (interview.status === "Reschedule Requested") {
            return res.status(400).json({
                message: "A reschedule request is already pending review for this interview",
                success: false,
            });
        }

        interview.status = "Reschedule Requested";
        interview.rescheduleReason = rescheduleReason.trim();
        if (proposedDate) {
            const parsedProposed = new Date(proposedDate);
            if (!isNaN(parsedProposed.getTime()) && parsedProposed.getTime() > Date.now()) {
                interview.proposedDate = parsedProposed;
            }
        }
        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Notify recruiter of candidate reschedule request
        notifyRescheduleRequested({
            interview: updatedInterview,
            candidate: updatedInterview.candidate,
            recruiter: updatedInterview.recruiter,
            job: updatedInterview.job,
            reason: rescheduleReason.trim(),
            proposedDate,
        });

        return res.status(200).json({
            message: "Reschedule request submitted successfully",
            interview: updatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error requesting interview reschedule:", error);
        return res.status(500).json({
            message: error.message || "Failed to submit reschedule request",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/interviews/:id/reschedule
 * Recruiter reschedules an interview with new date/time/details.
 */
export const rescheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const recruiterId = req.id;
        const {
            scheduledDate,
            duration,
            interviewType,
            meetingUrl,
            venue,
            instructions,
        } = req.body;

        if (!scheduledDate) {
            return res.status(400).json({
                message: "New scheduled date and time is required for rescheduling",
                success: false,
            });
        }

        const parsedDate = new Date(scheduledDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format for scheduledDate",
                success: false,
            });
        }

        if (parsedDate.getTime() <= Date.now()) {
            return res.status(400).json({
                message: "New scheduled date must be in the future",
                success: false,
            });
        }

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // 1. Ownership check: only the managing recruiter
        if (interview.recruiter.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to reschedule this interview",
                success: false,
            });
        }

        // 2. Reject invalid transitions
        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot reschedule a cancelled interview. Please schedule a new interview instead.",
                success: false,
            });
        }

        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Cannot reschedule an interview that has already been completed",
                success: false,
            });
        }

        const interviewDuration = duration ? Number(duration) : (interview.duration || 45);
        if (isNaN(interviewDuration) || interviewDuration < 5 || interviewDuration > 480) {
            return res.status(400).json({
                message: "Duration must be between 5 and 480 minutes",
                success: false,
            });
        }

        const selectedType = interviewType || interview.interviewType;
        if (!INTERVIEW_TYPES.includes(selectedType)) {
            return res.status(400).json({
                message: `Invalid interview type. Allowed: ${INTERVIEW_TYPES.join(", ")}`,
                success: false,
            });
        }

        // Validate meetingUrl for Online
        if (selectedType === "Online") {
            const urlToCheck = meetingUrl || interview.meetingUrl;
            if (!urlToCheck || urlToCheck.trim() === "") {
                return res.status(400).json({
                    message: "A meeting URL is required for online interviews",
                    success: false,
                });
            }
            if (!isValidHttpUrl(urlToCheck.trim())) {
                return res.status(400).json({
                    message: "Meeting URL must start with http:// or https://",
                    success: false,
                });
            }
        }

        // Validate venue for In-person
        if (selectedType === "In-person") {
            const venueToCheck = venue || interview.venue;
            if (!venueToCheck || venueToCheck.trim().length < 3) {
                return res.status(400).json({
                    message: "A physical venue address (minimum 3 characters) is required for in-person interviews",
                    success: false,
                });
            }
        }

        // 3. Conflict / Double-booking checks for new time slot
        const candidateConflict = await checkDoubleBooking({
            userId: interview.candidate,
            userField: "candidate",
            startTime: parsedDate,
            durationMinutes: interviewDuration,
            excludeInterviewId: id,
        });

        if (candidateConflict) {
            return res.status(409).json({
                message: `Double-booking conflict: The candidate already has an interview scheduled around ${new Date(candidateConflict.scheduledDate).toLocaleTimeString()}`,
                success: false,
            });
        }

        const recruiterConflict = await checkDoubleBooking({
            userId: recruiterId,
            userField: "recruiter",
            startTime: parsedDate,
            durationMinutes: interviewDuration,
            excludeInterviewId: id,
        });

        if (recruiterConflict) {
            return res.status(409).json({
                message: `Double-booking conflict: You already have another interview scheduled around ${new Date(recruiterConflict.scheduledDate).toLocaleTimeString()}`,
                success: false,
            });
        }

        // 4. Update interview document
        interview.scheduledDate = parsedDate;
        interview.duration = interviewDuration;
        interview.interviewType = selectedType;
        if (meetingUrl !== undefined) interview.meetingUrl = meetingUrl.trim();
        if (venue !== undefined) interview.venue = venue.trim();
        if (instructions !== undefined) interview.instructions = instructions.trim();
        interview.rescheduledAt = new Date();
        interview.status = "Scheduled"; // Reset status to Scheduled awaiting candidate confirmation

        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Notify candidate of updated schedule
        notifyInterviewRescheduled({
            interview: updatedInterview,
            candidate: updatedInterview.candidate,
            recruiter: updatedInterview.recruiter,
            job: updatedInterview.job,
        });

        return res.status(200).json({
            message: "Interview rescheduled successfully",
            interview: updatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error rescheduling interview:", error);
        return res.status(500).json({
            message: error.message || "Failed to reschedule interview",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/interviews/:id/cancel
 * Authorized user (recruiter or candidate) cancels an interview.
 */
export const cancelInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;
        const { cancellationReason } = req.body;

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // 1. Authorization: user must be recruiter or candidate
        const isCandidate = interview.candidate.toString() === userId.toString();
        const isRecruiter = interview.recruiter.toString() === userId.toString();

        if (!isCandidate && !isRecruiter) {
            return res.status(403).json({
                message: "You are not authorized to cancel this interview",
                success: false,
            });
        }

        // 2. Reject invalid transitions
        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Interview is already cancelled",
                success: false,
            });
        }

        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Cannot cancel an interview that has already been completed",
                success: false,
            });
        }

        interview.status = "Cancelled";
        interview.cancellationReason = cancellationReason?.trim() || (isRecruiter ? "Cancelled by recruiter" : "Cancelled by candidate");
        interview.cancelledBy = userId;

        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Notify the other party of interview cancellation
        notifyInterviewCancelled({
            interview: updatedInterview,
            candidate: updatedInterview.candidate,
            recruiter: updatedInterview.recruiter,
            job: updatedInterview.job,
            cancelledByUserId: userId,
            cancellationReason: interview.cancellationReason,
        });

        return res.status(200).json({
            message: "Interview has been cancelled successfully",
            interview: updatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error cancelling interview:", error);
        return res.status(500).json({
            message: error.message || "Failed to cancel interview",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/interviews/:id/complete
 * Authorized recruiter marks an interview completed and logs optional feedback.
 */
export const completeInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const recruiterId = req.id;
        const { feedback } = req.body;

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // 1. Ownership check: only managing recruiter can mark completed
        if (interview.recruiter.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                message: "Only the recruiter who posted the job can mark this interview as completed",
                success: false,
            });
        }

        // 2. Reject invalid transitions
        if (interview.status === "Completed") {
            return res.status(400).json({
                message: "Interview is already marked as completed",
                success: false,
            });
        }

        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot complete a cancelled interview",
                success: false,
            });
        }

        interview.status = "Completed";
        if (feedback && feedback.trim()) {
            interview.feedback = feedback.trim();
        }
        interview.completedAt = new Date();

        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        // Notify candidate of interview round completion
        notifyInterviewCompleted({
            interview: updatedInterview,
            candidate: updatedInterview.candidate,
            recruiter: updatedInterview.recruiter,
            job: updatedInterview.job,
            feedback,
        });

        return res.status(200).json({
            message: "Interview marked as completed successfully",
            interview: updatedInterview,
            success: true,
        });

    } catch (error) {
        console.error("Error completing interview:", error);
        return res.status(500).json({
            message: error.message || "Failed to mark interview as completed",
            success: false,
        });
    }
};

/**
 * GET /api/v1/interviews/application/:applicationId
 * Retrieves all rounds for a specific application.
 */
export const getInterviewsByApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.id;

        const application = await Application.findById(applicationId).populate("job");
        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Verify access: user must be candidate or recruiter
        const isApplicant = application.applicant.toString() === userId.toString();
        const isRecruiter = application.job?.created_by?.toString() === userId.toString();

        if (!isApplicant && !isRecruiter) {
            return res.status(403).json({
                message: "You are not authorized to view interviews for this application",
                success: false,
            });
        }

        const interviews = await Interview.find({ application: applicationId })
            .sort({ roundNumber: 1, scheduledDate: 1 })
            .populate("recruiter", RECRUITER_SAFE_FIELDS)
            .populate("candidate", CANDIDATE_SAFE_FIELDS)
            .populate({
                path: "job",
                select: JOB_SAFE_FIELDS,
                populate: { path: "company", select: COMPANY_SAFE_FIELDS },
            });

        return res.status(200).json({
            interviews,
            count: interviews.length,
            applicationStatus: application.status,
            success: true,
        });
    } catch (error) {
        console.error("Error fetching interviews for application:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch interviews",
            success: false,
        });
    }
};
