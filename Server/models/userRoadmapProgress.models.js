import mongoose from "mongoose";

export const PROGRESS_STATUSES = [
    "Not Started",
    "In Progress",
    "Completed",
    "Paused"
];

export const CONFIDENCE_LEVELS = [
    "Need Revision",
    "Confident",
    "Mastered"
];

const completedTopicEntrySchema = new mongoose.Schema(
    {
        topicId: {
            type: String,
            required: [true, "Stable topicId is required"],
            trim: true,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
        confidenceLevel: {
            type: String,
            enum: CONFIDENCE_LEVELS,
            default: "Confident",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: false }
);

const topicNoteSchema = new mongoose.Schema(
    {
        topicId: {
            type: String,
            required: [true, "Stable topicId is required for note"],
            trim: true,
        },
        note: {
            type: String,
            trim: true,
            default: "",
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const userRoadmapProgressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },
        roadmap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Roadmap",
            required: [true, "Roadmap reference is required"],
            index: true,
        },
        roadmapVersion: {
            type: Number,
            required: true,
            default: 1,
        },
        completedTopics: {
            type: [completedTopicEntrySchema],
            default: [],
        },
        topicNotes: {
            type: [topicNoteSchema],
            default: [],
        },
        completedStages: {
            type: [String], // Array of completed stageId strings
            default: [],
        },
        overallProgressPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        completedTopicsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalTopicsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: {
                values: PROGRESS_STATUSES,
                message: `{VALUE} is not a valid progress status`,
            },
            default: "In Progress",
            index: true,
        },
        lastActiveTopicId: {
            type: String,
            trim: true,
            default: "",
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        lastStudiedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Unique compound index: One independent progress record per user per roadmap
userRoadmapProgressSchema.index({ user: 1, roadmap: 1 }, { unique: true });
userRoadmapProgressSchema.index({ user: 1, status: 1 });
userRoadmapProgressSchema.index({ roadmap: 1, status: 1 });

/**
 * Recalculates progress safely against the given Roadmap document.
 * Safe evolution:
 * - If new topics were added to the roadmap, existing completed topics remain untouched.
 * - Progress is re-indexed against active topics without losing user history.
 */
userRoadmapProgressSchema.methods.recalculateProgress = function (roadmap) {
    if (!roadmap) return;

    const allActiveTopicIds = roadmap.getAllTopicIds ? roadmap.getAllTopicIds() : [];
    const activeSet = new Set(allActiveTopicIds);

    // Keep completed topics that belong to active topics (or retain legacy topics if still valid)
    const validCompleted = this.completedTopics.filter((entry) => activeSet.has(entry.topicId));

    this.totalTopicsCount = allActiveTopicIds.length;
    this.completedTopicsCount = validCompleted.length;
    this.roadmapVersion = roadmap.version || this.roadmapVersion;

    if (this.totalTopicsCount > 0) {
        this.overallProgressPercentage = Math.min(
            100,
            Math.round((this.completedTopicsCount / this.totalTopicsCount) * 100)
        );
    } else {
        this.overallProgressPercentage = 0;
    }

    // Compute completed stage IDs
    const completedStageIds = [];
    if (roadmap.stages && Array.isArray(roadmap.stages)) {
        for (const stage of roadmap.stages) {
            const stageTopics = (stage.topics || []).filter((t) => !t.isDeprecated && t.topicId);
            if (
                stageTopics.length > 0 &&
                stageTopics.every((t) => this.completedTopics.some((ct) => ct.topicId === t.topicId))
            ) {
                completedStageIds.push(stage.stageId);
            }
        }
    }
    this.completedStages = completedStageIds;

    if (this.overallProgressPercentage === 100 && this.status !== "Completed") {
        this.status = "Completed";
        this.completedAt = new Date();
    } else if (this.overallProgressPercentage < 100 && this.status === "Completed") {
        this.status = "In Progress";
        this.completedAt = null;
    }

    this.lastStudiedAt = new Date();
    return this;
};

// Virtual and method aliases for backwards and cross-convention compatibility
userRoadmapProgressSchema.methods.syncWithRoadmap = function (roadmap) {
    return this.recalculateProgress(roadmap);
};

userRoadmapProgressSchema.virtual("completionPercentage").get(function () {
    return this.overallProgressPercentage || 0;
});

userRoadmapProgressSchema.set("toJSON", { virtuals: true });
userRoadmapProgressSchema.set("toObject", { virtuals: true });

export const UserRoadmapProgress = mongoose.model(
    "UserRoadmapProgress",
    userRoadmapProgressSchema
);
