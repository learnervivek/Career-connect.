import mongoose from "mongoose";

export const RESOURCE_CATEGORIES = [
    "DSA",
    "Aptitude",
    "SQL",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "Programming",
    "System Design",
    "HR Preparation",
    "Core CS",
    "Other"
];

export const RESOURCE_TYPES = [
    "Article",
    "Video",
    "Documentation",
    "Practice Sheet",
    "External Coding Platform",
    "Practice Problem",
    "Interactive Practice",
    "Cheatsheet",
    "Course",
    "Interview Experience",
    "Book",
    "Other"
];

export const RESOURCE_SOURCE_TYPES = [
    "Official Company",
    "External Platform",
    "Community Contributed"
];

export const RESOURCE_DIFFICULTIES = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "All Levels"
];

export const RESOURCE_STATUSES = [
    "Active",
    "Deprecated",
    "Under Review",
    "Obsolete"
];

const preparationResourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Resource title is required"],
            trim: true,
            index: true,
        },
        url: {
            type: String,
            required: [true, "Resource URL is required"],
            trim: true,
            match: [
                /^https?:\/\/.+/,
                "Resource URL must begin with http:// or https://",
            ],
            index: true,
        },
        category: {
            type: String,
            enum: {
                values: RESOURCE_CATEGORIES,
                message: `{VALUE} is not a supported resource category`,
            },
            default: "Core CS",
            index: true,
        },
        type: {
            type: String,
            enum: {
                values: RESOURCE_TYPES,
                message: `{VALUE} is not a supported resource type`,
            },
            required: [true, "Resource type is required"],
            index: true,
        },
        sourceType: {
            type: String,
            enum: {
                values: RESOURCE_SOURCE_TYPES,
                message: `{VALUE} is not a supported source type`,
            },
            default: "External Platform",
            index: true,
        },
        isOfficial: {
            type: Boolean,
            default: false,
            index: true,
        },
        provider: {
            type: String,
            trim: true,
            default: "Community / Web",
            index: true,
        },
        isFree: {
            type: Boolean,
            default: true,
        },
        estimatedTimeMinutes: {
            type: Number,
            min: [1, "Estimated time must be at least 1 minute"],
            default: 30,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        difficulty: {
            type: String,
            enum: {
                values: RESOURCE_DIFFICULTIES,
                message: `{VALUE} is not a valid difficulty level`,
            },
            default: "All Levels",
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: RESOURCE_STATUSES,
                message: `{VALUE} is not a valid resource status`,
            },
            default: "Active",
            index: true,
        },
        lastVerifiedDate: {
            type: Date,
            default: Date.now,
            index: true,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for fast catalog searches and filtering
preparationResourceSchema.index({ category: 1, status: 1 });
preparationResourceSchema.index({ type: 1, status: 1 });
preparationResourceSchema.index({ sourceType: 1, status: 1 });
preparationResourceSchema.index({ difficulty: 1, status: 1 });

export const PreparationResource = mongoose.model(
    "PreparationResource",
    preparationResourceSchema
);
