import mongoose from "mongoose";

export const INTERVIEW_ROUNDS = ["Technical", "HR", "Managerial", "Other"];
export const INTERVIEW_TYPES = ["Online", "Phone", "In-person"];
export const INTERVIEW_STATUSES = [
    "Scheduled",
    "Confirmed",
    "Reschedule Requested",
    "Cancelled",
    "Completed"
];

const interviewSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: [true, "Application reference is required"],
            index: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: [true, "Job reference is required"],
            index: true,
        },
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recruiter reference is required"],
            index: true,
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Candidate reference is required"],
            index: true,
        },
        round: {
            type: String,
            enum: {
                values: INTERVIEW_ROUNDS,
                message: `{VALUE} is not a valid interview round. Allowed: ${INTERVIEW_ROUNDS.join(", ")}`,
            },
            required: [true, "Interview round is required"],
            default: "Technical",
        },
        roundNumber: {
            type: Number,
            default: 1,
            min: [1, "Round number must be at least 1"],
        },
        interviewType: {
            type: String,
            enum: {
                values: INTERVIEW_TYPES,
                message: `{VALUE} is not a valid interview type. Allowed: ${INTERVIEW_TYPES.join(", ")}`,
            },
            required: [true, "Interview type is required"],
            default: "Online",
        },
        scheduledDate: {
            type: Date,
            required: [true, "Scheduled date and time is required"],
            index: true,
        },
        duration: {
            type: Number,
            required: [true, "Duration in minutes is required"],
            min: [5, "Duration must be at least 5 minutes"],
            max: [480, "Duration cannot exceed 480 minutes (8 hours)"],
            default: 45,
        },
        meetingUrl: {
            type: String,
            trim: true,
            default: "",
        },
        venue: {
            type: String,
            trim: true,
            default: "",
        },
        instructions: {
            type: String,
            trim: true,
            default: "",
        },
        feedback: {
            type: String,
            trim: true,
            default: "",
        },
        rescheduleReason: {
            type: String,
            trim: true,
            default: "",
        },
        proposedDate: {
            type: Date,
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: "",
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        completedAt: {
            type: Date,
        },
        rescheduledAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: {
                values: INTERVIEW_STATUSES,
                message: `{VALUE} is not a valid interview status. Allowed: ${INTERVIEW_STATUSES.join(", ")}`,
            },
            default: "Scheduled",
            index: true,
        },
    },
    { timestamps: true }
);

// Compound indexes for high-performance querying
// 1. All interview rounds for an application in round & scheduled order
interviewSchema.index({ application: 1, roundNumber: 1, scheduledDate: 1 });

// 2. Candidate queries (e.g., upcoming/past interviews by status)
interviewSchema.index({ candidate: 1, scheduledDate: -1, status: 1 });

// 3. Recruiter queries (e.g., upcoming/past interviews by status)
interviewSchema.index({ recruiter: 1, scheduledDate: -1, status: 1 });

// 4. Job-level interview queries
interviewSchema.index({ job: 1, scheduledDate: -1 });

export const Interview = mongoose.model("Interview", interviewSchema);
