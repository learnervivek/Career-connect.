import { Notification } from "../models/notification.models.js";
import {
    sendInterviewInvitationEmail,
    sendInterviewConfirmedEmail,
    sendRescheduleRequestedEmail,
    sendInterviewRescheduledEmail,
    sendInterviewCancelledEmail,
} from "../utils/emailService.js";

/**
 * Helper to dispatch notification in-app and trigger non-blocking email.
 */
export const notifyInterviewScheduled = async ({ interview, candidate, recruiter, job }) => {
    try {
        const formattedDate = new Date(interview.scheduledDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        // 1. Create In-App Notification for Candidate
        await Notification.create({
            recipient: candidate._id,
            sender: recruiter._id,
            title: "New Interview Scheduled",
            message: `You have been invited to a ${interview.round} interview for ${job.title} on ${formattedDate}.`,
            type: "INTERVIEW_SCHEDULED",
            interview: interview._id,
            job: job._id,
            metadata: {
                round: interview.round,
                interviewType: interview.interviewType,
                scheduledDate: interview.scheduledDate,
            },
        });

        // 2. Trigger asynchronous email notification (never blocks response)
        sendInterviewInvitationEmail({ candidate, recruiter, job, interview }).catch((err) => {
            console.error("[NotificationService] Email delivery error (InterviewScheduled):", err.message);
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create in-app notification:", error.message);
    }
};

export const notifyInterviewConfirmed = async ({ interview, candidate, recruiter, job }) => {
    try {
        const formattedDate = new Date(interview.scheduledDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        // In-App Notification for Recruiter
        await Notification.create({
            recipient: recruiter._id,
            sender: candidate._id,
            title: "Interview Confirmed",
            message: `${candidate.fullname} confirmed attendance for ${job.title} on ${formattedDate}.`,
            type: "INTERVIEW_CONFIRMED",
            interview: interview._id,
            job: job._id,
            metadata: {
                candidateName: candidate.fullname,
                scheduledDate: interview.scheduledDate,
            },
        });

        // Asynchronous email to recruiter
        sendInterviewConfirmedEmail({ recruiter, candidate, job, interview }).catch((err) => {
            console.error("[NotificationService] Email delivery error (InterviewConfirmed):", err.message);
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create confirmation notification:", error.message);
    }
};

export const notifyRescheduleRequested = async ({ interview, candidate, recruiter, job, reason, proposedDate }) => {
    try {
        // In-App Notification for Recruiter
        await Notification.create({
            recipient: recruiter._id,
            sender: candidate._id,
            title: "Reschedule Requested",
            message: `${candidate.fullname} requested to reschedule the interview for ${job.title}: "${reason.substring(0, 80)}${reason.length > 80 ? '...' : ''}"`,
            type: "RESCHEDULE_REQUESTED",
            interview: interview._id,
            job: job._id,
            metadata: {
                reason,
                proposedDate,
            },
        });

        // Asynchronous email to recruiter
        sendRescheduleRequestedEmail({ recruiter, candidate, job, interview, reason, proposedDate }).catch((err) => {
            console.error("[NotificationService] Email delivery error (RescheduleRequested):", err.message);
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create reschedule notification:", error.message);
    }
};

export const notifyInterviewRescheduled = async ({ interview, candidate, recruiter, job }) => {
    try {
        const formattedDate = new Date(interview.scheduledDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        // In-App Notification for Candidate
        await Notification.create({
            recipient: candidate._id,
            sender: recruiter._id,
            title: "Interview Rescheduled",
            message: `Your interview for ${job.title} has been rescheduled to ${formattedDate}. Please review and confirm.`,
            type: "INTERVIEW_RESCHEDULED",
            interview: interview._id,
            job: job._id,
            metadata: {
                scheduledDate: interview.scheduledDate,
                interviewType: interview.interviewType,
            },
        });

        // Asynchronous email to candidate
        sendInterviewRescheduledEmail({ candidate, recruiter, job, interview }).catch((err) => {
            console.error("[NotificationService] Email delivery error (InterviewRescheduled):", err.message);
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create reschedule notification:", error.message);
    }
};

export const notifyInterviewCancelled = async ({ interview, candidate, recruiter, job, cancelledByUserId, cancellationReason }) => {
    try {
        const isRecruiter = recruiter._id.toString() === cancelledByUserId.toString();
        const targetRecipient = isRecruiter ? candidate : recruiter;
        const actingUser = isRecruiter ? recruiter : candidate;

        // In-App Notification for other party
        await Notification.create({
            recipient: targetRecipient._id,
            sender: actingUser._id,
            title: "Interview Cancelled",
            message: `The ${interview.round} interview for ${job.title} has been cancelled by ${actingUser.fullname}. ${cancellationReason ? `Reason: "${cancellationReason}"` : ''}`,
            type: "INTERVIEW_CANCELLED",
            interview: interview._id,
            job: job._id,
            metadata: {
                cancellationReason,
            },
        });

        // Asynchronous email to target recipient
        sendInterviewCancelledEmail({
            toUser: targetRecipient,
            otherUser: actingUser,
            job,
            interview,
            cancellationReason,
        }).catch((err) => {
            console.error("[NotificationService] Email delivery error (InterviewCancelled):", err.message);
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create cancellation notification:", error.message);
    }
};

export const notifyInterviewCompleted = async ({ interview, candidate, recruiter, job, feedback }) => {
    try {
        // In-App Notification for Candidate
        await Notification.create({
            recipient: candidate._id,
            sender: recruiter._id,
            title: "Interview Completed",
            message: `Your ${interview.round} interview for ${job.title} has been marked as completed.`,
            type: "INTERVIEW_COMPLETED",
            interview: interview._id,
            job: job._id,
            metadata: {
                feedback,
            },
        });
    } catch (error) {
        console.error("[NotificationService] Failed to create completion notification:", error.message);
    }
};
