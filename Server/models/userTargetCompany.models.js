import mongoose from "mongoose";

export const TARGET_PRIORITIES = [
    "Dream",
    "Target",
    "Safety"
];

export const TARGET_PREPARATION_STATUSES = [
    "Researching",
    "Actively Preparing",
    "Applied",
    "Interview Scheduled",
    "Offer Received",
    "Archived"
];

const userTargetCompanySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company reference is required"],
            index: true,
        },
        priority: {
            type: String,
            enum: {
                values: TARGET_PRIORITIES,
                message: `{VALUE} is not a valid target priority. Allowed: ${TARGET_PRIORITIES.join(", ")}`,
            },
            default: "Target",
            index: true,
        },
        targetRole: {
            type: String,
            trim: true,
            default: "Software Engineer",
        },
        targetHiringTrack: {
            type: String,
            trim: true,
            default: "General",
        },
        targetDate: {
            type: Date,
        },
        preparationStatus: {
            type: String,
            enum: {
                values: TARGET_PREPARATION_STATUSES,
                message: `{VALUE} is not a valid preparation status. Allowed: ${TARGET_PREPARATION_STATUSES.join(", ")}`,
            },
            default: "Actively Preparing",
            index: true,
        },
        activeRoadmap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Roadmap",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Unique compound index: A user can only target a given company once
userTargetCompanySchema.index({ user: 1, company: 1 }, { unique: true });
userTargetCompanySchema.index({ user: 1, priority: 1 });
userTargetCompanySchema.index({ user: 1, preparationStatus: 1 });

export const UserTargetCompany = mongoose.model(
    "UserTargetCompany",
    userTargetCompanySchema
);
