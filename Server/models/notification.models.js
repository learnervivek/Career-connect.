import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_CONFIRMED",
    "RESCHEDULE_REQUESTED",
    "INTERVIEW_RESCHEDULED",
    "INTERVIEW_CANCELLED",
    "INTERVIEW_COMPLETED",
    "APPLICATION_SUBMITTED",
    "APPLICATION_UNDER_REVIEW",
    "APPLICATION_SHORTLISTED",
    "APPLICATION_INTERVIEW_SCHEDULED",
    "APPLICATION_SELECTED",
    "APPLICATION_REJECTED",
    "APPLICATION_WITHDRAWN",
];

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipient is required"],
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: [true, "Notification type is required"],
            index: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            index: true,
        },
        interview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
            index: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Compound index for querying user notifications in chronological order by read status
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
