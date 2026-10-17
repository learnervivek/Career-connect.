import { Application, APPLICATION_STATUSES } from "../models/application.models.js";
import { Job } from "../models/job.models.js";
import { User } from "../models/user.model.js";
import {
    notifyApplicationSubmitted,
    notifyApplicationStatusChanged,
} from "../services/notificationService.js";

const CANDIDATE_SAFE_FIELDS = "fullname email phoneNumber profile";

/**
 * Normalizes status string for search and comparison.
 */
const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase().trim();
    if (s === "pending") return "applied";
    if (s === "accepted") return "shortlisted";
    return s;
};

// ─── CANDIDATE ENDPOINTS ────────────────────────────────────────────────────

/**
 * POST /api/v1/application/apply/:id
 * Candidate applies for a job listing.
 */
export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required",
                success: false,
            });
        }

        // 1. Check if user has already applied for this job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false,
            });
        }

        // 2. Check if the job exists
        const job = await Job.findById(jobId).populate("company");
        if (!job) {
            return res.status(404).json({
                message: "Job not exists",
                success: false,
            });
        }

        // 3. Fetch candidate information for confirmation email
        const candidate = await User.findById(userId).select("fullname email phoneNumber");
        if (!candidate) {
            return res.status(404).json({
                message: "Candidate profile not found",
                success: false,
            });
        }

        // 4. Generate unique application reference code
        const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const applicationRef = `APP-${Date.now().toString(36).toUpperCase()}-${refSuffix}`;

        // 5. Create new application with initial status history
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId,
            status: "applied",
            applicationRef,
            statusHistory: [
                {
                    status: "applied",
                    changedBy: userId,
                    changedByRole: "student",
                    message: "Application submitted successfully",
                    timestamp: new Date(),
                },
            ],
        });

        // 6. Link application to job
        job.applications.push(newApplication._id);
        await job.save();

        // 7. Trigger async in-app & email notification (never blocks response)
        notifyApplicationSubmitted({
            application: newApplication,
            candidate,
            job,
            company: job.company,
        }).catch((err) => {
            console.error("[ApplicationController] Notification error on apply:", err.message);
        });

        return res.status(201).json({
            message: "Application created successfully",
            application: newApplication,
            success: true,
        });
    } catch (error) {
        console.error("Error in applyJob:", error);
        return res.status(500).json({
            message: "Internal server error while submitting application",
            success: false,
        });
    }
};

/**
 * GET /api/v1/application/get
 * GET /api/v1/application/my-applications
 * Retrieve applications for the authenticated candidate with search, status filtering, date range, and sorting.
 */
export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;
        const {
            status,
            search,
            company,
            startDate,
            endDate,
            sortBy = "createdAt",
            sortOrder = "desc",
            page,
            limit,
        } = req.query;

        // Build query matching the candidate's applications
        const query = { applicant: userId };

        // Status filter (support synonyms: pending <-> applied, accepted <-> shortlisted)
        if (status && status !== "all") {
            const normalized = normalizeStatus(status);
            if (normalized === "applied") {
                query.status = { $in: ["applied", "pending"] };
            } else if (normalized === "shortlisted") {
                query.status = { $in: ["shortlisted", "accepted"] };
            } else {
                query.status = new RegExp(`^${normalized}$`, "i");
            }
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Sort configuration
        const sortOptions = {};
        const direction = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "lastUpdated" || sortBy === "updatedAt") {
            sortOptions.updatedAt = direction;
        } else {
            sortOptions.createdAt = direction;
        }

        // Fetch applications with populated job, company, and interviews
        let applications = await Application.find(query)
            .sort(sortOptions)
            .populate({
                path: "job",
                populate: {
                    path: "company",
                },
            })
            .populate({
                path: "interviews",
                options: { sort: { roundNumber: 1, scheduledDate: 1 } },
            })
            .populate({
                path: "statusHistory.changedBy",
                select: "fullname role",
            })
            .lean();

        if (!applications) {
            applications = [];
        }

        // Search filter (in-memory filtering across populated job title & company name)
        if (search && search.trim() !== "") {
            const queryTerm = search.trim().toLowerCase();
            applications = applications.filter((app) => {
                const jobTitle = app.job?.title?.toLowerCase() || "";
                const companyName = app.job?.company?.companyName?.toLowerCase() || "";
                const refCode = app.applicationRef?.toLowerCase() || "";
                return (
                    jobTitle.includes(queryTerm) ||
                    companyName.includes(queryTerm) ||
                    refCode.includes(queryTerm)
                );
            });
        }

        // Company filter by name or ID
        if (company && company !== "all") {
            applications = applications.filter((app) => {
                const compId = app.job?.company?._id?.toString() || "";
                const compName = app.job?.company?.companyName?.toLowerCase() || "";
                return compId === company || compName.includes(company.toLowerCase());
            });
        }

        // Synthesize statusHistory for older records if empty
        applications = applications.map((app) => {
            if (!app.statusHistory || app.statusHistory.length === 0) {
                app.statusHistory = [
                    {
                        status: app.status || "applied",
                        changedByRole: "student",
                        message: "Application submitted successfully",
                        timestamp: app.createdAt,
                    },
                ];
            }
            if (!app.applicationRef) {
                app.applicationRef = `APP-${app._id.toString().slice(-6).toUpperCase()}`;
            }
            return app;
        });

        // Pagination handling if requested
        const total = applications.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10);

        let paginatedApplications = applications;
        let totalPages = 1;

        if (limitNum && limitNum > 0) {
            totalPages = Math.ceil(total / limitNum) || 1;
            const skip = (pageNum - 1) * limitNum;
            paginatedApplications = applications.slice(skip, skip + limitNum);
        }

        return res.status(200).json({
            success: true,
            application: paginatedApplications, // backward-compatible key
            applications: paginatedApplications,
            total,
            page: pageNum,
            totalPages,
        });
    } catch (error) {
        console.error("Error in getAppliedJobs:", error);
        return res.status(500).json({
            message: "Failed to fetch applied jobs",
            success: false,
        });
    }
};

/**
 * GET /api/v1/application/:id
 * Retrieve single application with populated job, company, timeline, and interviews.
 * Authorized for candidate (applicant) or recruiter (job creator) or admin.
 */
export const getApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;

        const application = await Application.findById(applicationId)
            .populate({
                path: "job",
                populate: {
                    path: "company",
                },
            })
            .populate({
                path: "applicant",
                select: CANDIDATE_SAFE_FIELDS,
            })
            .populate({
                path: "interviews",
                options: { sort: { roundNumber: 1, scheduledDate: 1 } },
            })
            .populate({
                path: "statusHistory.changedBy",
                select: "fullname role",
            });

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Authorization check: User must be applicant, job creator recruiter, or admin
        const isApplicant = application.applicant?._id?.toString() === userId.toString();
        const isJobRecruiter = application.job?.created_by?.toString() === userId.toString();

        const currentUser = await User.findById(userId).select("role");
        const isAdmin = currentUser?.role === "admin";

        if (!isApplicant && !isJobRecruiter && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to view this application",
                success: false,
            });
        }

        // Synthesize statusHistory if empty
        if (!application.statusHistory || application.statusHistory.length === 0) {
            application.statusHistory = [
                {
                    status: application.status || "applied",
                    changedByRole: "student",
                    message: "Application submitted successfully",
                    timestamp: application.createdAt,
                },
            ];
        }

        return res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error("Error in getApplicationById:", error);
        return res.status(500).json({
            message: "Failed to retrieve application details",
            success: false,
        });
    }
};

/**
 * GET /api/v1/application/:id/history
 * Retrieve chronological status history and timeline for an application.
 */
export const getApplicationHistory = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;

        const application = await Application.findById(applicationId)
            .populate("job", "title created_by")
            .populate({
                path: "statusHistory.changedBy",
                select: "fullname role",
            });

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Authorization check
        const isApplicant = application.applicant?.toString() === userId.toString();
        const isJobRecruiter = application.job?.created_by?.toString() === userId.toString();
        const currentUser = await User.findById(userId).select("role");
        const isAdmin = currentUser?.role === "admin";

        if (!isApplicant && !isJobRecruiter && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to view this application history",
                success: false,
            });
        }

        let history = application.statusHistory || [];
        if (history.length === 0) {
            history = [
                {
                    status: application.status || "applied",
                    changedByRole: "student",
                    message: "Application submitted successfully",
                    timestamp: application.createdAt,
                },
            ];
        }

        return res.status(200).json({
            success: true,
            currentStatus: application.status,
            applicationRef: application.applicationRef,
            statusHistory: history,
        });
    } catch (error) {
        console.error("Error in getApplicationHistory:", error);
        return res.status(500).json({
            message: "Failed to retrieve application history",
            success: false,
        });
    }
};

/**
 * POST /api/v1/application/:id/withdraw
 * Candidate withdraws their own job application.
 */
export const withdrawApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;
        const { reason } = req.body;

        const application = await Application.findById(applicationId)
            .populate("job")
            .populate("applicant", CANDIDATE_SAFE_FIELDS);

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Only the candidate applicant can withdraw
        if (application.applicant?._id?.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You can only withdraw your own applications",
                success: false,
            });
        }

        // Cannot withdraw if already terminal
        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Cannot withdraw an application that has already been marked as rejected",
                success: false,
            });
        }
        if (application.status === "selected") {
            return res.status(400).json({
                message: "Cannot withdraw an application after selection/offer stage. Please reach out to the recruiter directly.",
                success: false,
            });
        }
        if (application.status === "withdrawn") {
            return res.status(400).json({
                message: "This application has already been withdrawn",
                success: false,
            });
        }

        const oldStatus = application.status;
        application.status = "withdrawn";
        application.statusHistory.push({
            status: "withdrawn",
            changedBy: userId,
            changedByRole: "student",
            message: reason?.trim() || "Application withdrawn by candidate",
            timestamp: new Date(),
        });

        await application.save();

        return res.status(200).json({
            message: "Application withdrawn successfully",
            application,
            success: true,
        });
    } catch (error) {
        console.error("Error in withdrawApplication:", error);
        return res.status(500).json({
            message: "Failed to withdraw application",
            success: false,
        });
    }
};

// ─── RECRUITER ENDPOINTS ───────────────────────────────────────────────────

/**
 * GET /api/v1/application/:id/applicants
 * Recruiter views all applicants for a job listing they created.
 */
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const recruiterId = req.id;

        const job = await Job.findById(jobId)
            .populate("company")
            .populate({
                path: "applications",
                options: { sort: { createdAt: -1 } },
                populate: [
                    { path: "applicant", select: CANDIDATE_SAFE_FIELDS },
                    { path: "interviews", options: { sort: { roundNumber: 1, scheduledDate: 1 } } },
                    { path: "statusHistory.changedBy", select: "fullname role" },
                ],
            });

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false,
            });
        }

        // Verify that the logged-in user is the job creator or an admin
        const currentUser = await User.findById(recruiterId).select("role");
        const isAdmin = currentUser?.role === "admin";
        if (job.created_by?.toString() !== recruiterId.toString() && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to view applicants for this job.",
                success: false,
            });
        }

        return res.status(200).json({
            job,
            success: true,
        });
    } catch (error) {
        console.error("Error in getApplicants:", error);
        return res.status(500).json({
            message: "Failed to fetch applicants",
            success: false,
        });
    }
};

/**
 * POST /api/v1/application/status/:id/update
 * PATCH /api/v1/application/:id/status
 * Recruiter or admin updates an application's status with an optional candidate-visible message.
 * Appends to statusHistory, prevents duplicate notifications, and dispatches email.
 */
export const updateStatus = async (req, res) => {
    try {
        const { status, message, rejectionReason, nextSteps } = req.body;
        const applicationId = req.params.id;
        const recruiterId = req.id;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                success: false,
            });
        }

        // Normalize status
        let targetStatus = status.toLowerCase().trim();
        // Support common aliases
        if (targetStatus === "accept") targetStatus = "accepted";
        if (targetStatus === "reject") targetStatus = "rejected";
        if (targetStatus === "shortlist") targetStatus = "shortlisted";

        if (!APPLICATION_STATUSES.includes(targetStatus)) {
            return res.status(400).json({
                message: `Invalid status '${status}'. Allowed statuses: ${APPLICATION_STATUSES.join(", ")}`,
                success: false,
            });
        }

        // 1. Fetch application with job, company, and candidate details
        const application = await Application.findById(applicationId)
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("applicant", "fullname email phoneNumber");

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // 2. Authorization check: recruiter must own the job or be admin
        const currentUser = await User.findById(recruiterId).select("role fullname email");
        const isAdmin = currentUser?.role === "admin";
        const jobCreatedBy = application.job?.created_by?.toString();

        if (jobCreatedBy !== recruiterId.toString() && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to update applications for jobs you did not create.",
                success: false,
            });
        }

        // 3. Permitted transition safeguards
        if (application.status === "withdrawn") {
            return res.status(400).json({
                message: "Cannot update status of an application that was withdrawn by the candidate.",
                success: false,
            });
        }

        // 4. Duplicate prevention / Idempotency check:
        // If status is identical and no new candidate message provided, return early without duplicate email
        const oldStatus = application.status;
        const candidateMessage = (message || rejectionReason || "").trim();

        if (oldStatus.toLowerCase() === targetStatus && !candidateMessage) {
            return res.status(200).json({
                message: `Application is already in '${targetStatus}' status`,
                application,
                success: true,
            });
        }

        // 5. Append new status history event
        application.status = targetStatus;
        if (!application.statusHistory) {
            application.statusHistory = [];
        }

        application.statusHistory.push({
            status: targetStatus,
            changedBy: recruiterId,
            changedByRole: currentUser?.role || "recruiter",
            message: candidateMessage,
            timestamp: new Date(),
        });

        // 6. Save changes to MongoDB FIRST (Ensures DB integrity before any network calls)
        await application.save();

        // 7. Dispatch in-app notification & transactional email asynchronously
        notifyApplicationStatusChanged({
            application,
            candidate: application.applicant,
            recruiter: currentUser,
            job: application.job,
            company: application.job?.company,
            oldStatus,
            newStatus: targetStatus,
            message: candidateMessage,
        }).catch((err) => {
            console.error("[ApplicationController] Notification error on status update:", err.message);
        });

        return res.status(200).json({
            message: "Status updated successfully",
            application,
            success: true,
        });
    } catch (error) {
        console.error("Error in updateStatus:", error);
        return res.status(500).json({
            message: "Internal server error while updating status",
            success: false,
        });
    }
};
