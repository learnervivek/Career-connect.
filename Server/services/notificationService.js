import { Notification } from "../models/notification.models.js";
import { Application } from "../models/application.models.js";
import {
    sendInterviewInvitationEmail,
    sendInterviewConfirmedEmail,
    sendRescheduleRequestedEmail,
    sendInterviewRescheduledEmail,
    sendInterviewCancelledEmail,
    sendApplicationSubmittedEmail,
    sendApplicationShortlistedEmail,
    sendApplicationSelectedEmail,
    sendApplicationRejectedEmail,
    sendApplicationUnderReviewEmail,
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

/**
 * Dispatches in-app notification and email confirmation upon application submission.
 */
export const notifyApplicationSubmitted = async ({ application, candidate, job, company }) => {
    try {
        const companyName = company?.companyName || company?.name || job?.company?.companyName || "the hiring team";
        const appRef = application.applicationRef || `APP-${application._id.toString().slice(-6).toUpperCase()}`;

        // 1. Create In-App Notification for Candidate
        await Notification.create({
            recipient: candidate._id,
            title: "Application Submitted Successfully",
            message: `Your application for ${job.title} at ${companyName} (${appRef}) has been received.`,
            type: "APPLICATION_SUBMITTED",
            application: application._id,
            job: job._id,
            metadata: {
                applicationRef: appRef,
                jobTitle: job.title,
                companyName,
            },
        });

        // 2. Trigger asynchronous email notification (never blocks database save)
        sendApplicationSubmittedEmail({
            candidate,
            job,
            company,
            application,
            applicationRef: appRef,
        })
            .then(async (result) => {
                if (application._id) {
                    await Application.findByIdAndUpdate(application._id, {
                        $push: {
                            emailNotificationLogs: {
                                event: "APPLICATION_SUBMITTED",
                                status: "applied",
                                recipientEmail: candidate.email,
                                deliveryStatus: result?.simulated ? "simulated" : result?.success ? "sent" : "failed",
                                messageId: result?.messageId || "",
                                error: result?.error || "",
                                sentAt: new Date(),
                            },
                        },
                    }).catch(() => {});
                }
            })
            .catch((err) => {
                console.error("[NotificationService] Email delivery error (ApplicationSubmitted):", err.message);
            });
    } catch (error) {
        console.error("[NotificationService] Failed to create submission notification:", error.message);
    }
};

/**
 * Dispatches in-app notification and transactional status update email.
 */
export const notifyApplicationStatusChanged = async ({
    application,
    candidate,
    recruiter,
    job,
    company,
    oldStatus,
    newStatus,
    message = "",
}) => {
    try {
        const companyName = company?.companyName || company?.name || job?.company?.companyName || "the hiring team";
        const normalizedStatus = (newStatus || "").toLowerCase();

        let notifType = "APPLICATION_UNDER_REVIEW";
        let notifTitle = "Application Status Update";
        let notifMessage = `Your application for ${job.title} at ${companyName} has been updated to "${newStatus}".`;
        let emailDispatcher = null;

        if (normalizedStatus === "shortlisted" || normalizedStatus === "accepted") {
            notifType = "APPLICATION_SHORTLISTED";
            notifTitle = "Application Shortlisted! 🎉";
            notifMessage = `Great news! You have been shortlisted for ${job.title} at ${companyName}.`;
            emailDispatcher = () => sendApplicationShortlistedEmail({ candidate, job, company, application, message });
        } else if (normalizedStatus === "selected") {
            notifType = "APPLICATION_SELECTED";
            notifTitle = "Congratulations! Offer & Selection 🌟";
            notifMessage = `Congratulations! You have been selected for ${job.title} at ${companyName}!`;
            emailDispatcher = () => sendApplicationSelectedEmail({ candidate, job, company, application, message });
        } else if (normalizedStatus === "rejected") {
            notifType = "APPLICATION_REJECTED";
            notifTitle = "Application Status Update";
            notifMessage = `An update is available regarding your application for ${job.title} at ${companyName}.`;
            emailDispatcher = () => sendApplicationRejectedEmail({ candidate, job, company, application, rejectionReason: message });
        } else if (normalizedStatus === "under review") {
            notifType = "APPLICATION_UNDER_REVIEW";
            notifTitle = "Application Under Review";
            notifMessage = `Your application for ${job.title} at ${companyName} is now under review.`;
            emailDispatcher = () => sendApplicationUnderReviewEmail({ candidate, job, company, application, message });
        } else if (normalizedStatus === "withdrawn") {
            notifType = "APPLICATION_WITHDRAWN";
            notifTitle = "Application Withdrawn";
            notifMessage = `Your application for ${job.title} has been marked as withdrawn.`;
        }

        // 1. Create In-App Notification
        await Notification.create({
            recipient: candidate._id,
            sender: recruiter?._id,
            title: notifTitle,
            message: message ? `${notifMessage} Note: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"` : notifMessage,
            type: notifType,
            application: application._id,
            job: job._id,
            metadata: {
                oldStatus,
                newStatus,
                message,
            },
        });

        // 2. Trigger asynchronous email notification (never blocks DB response)
        if (emailDispatcher) {
            emailDispatcher()
                .then(async (result) => {
                    if (application._id) {
                        await Application.findByIdAndUpdate(application._id, {
                            $push: {
                                emailNotificationLogs: {
                                    event: `STATUS_CHANGED_TO_${normalizedStatus.toUpperCase().replace(/\s+/g, '_')}`,
                                    status: normalizedStatus,
                                    recipientEmail: candidate.email,
                                    deliveryStatus: result?.simulated ? "simulated" : result?.success ? "sent" : "failed",
                                    messageId: result?.messageId || "",
                                    error: result?.error || "",
                                    sentAt: new Date(),
                                },
                            },
                        }).catch(() => {});
                    }
                })
                .catch((err) => {
                    console.error("[NotificationService] Email delivery error (StatusChanged):", err.message);
                });
        }
    } catch (error) {
        console.error("[NotificationService] Failed to notify status change:", error.message);
    }
};

