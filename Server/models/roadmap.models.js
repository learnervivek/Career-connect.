import mongoose from "mongoose";

export const ROADMAP_DIFFICULTIES = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Comprehensive"
];

export const ROADMAP_PUBLICATION_STATUSES = [
    "Draft",
    "Published",
    "Archived"
];

export const TOPIC_IMPORTANCE = [
    "Core / Must Know",
    "High Frequency",
    "Advanced / Bonus"
];

export const PROBLEM_PLATFORMS = [
    "LeetCode",
    "GeeksforGeeks",
    "HackerRank",
    "CodeStudio",
    "CodeChef",
    "Other"
];

// Practice problem subdocument
const practiceProblemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Problem title is required"],
            trim: true,
        },
        url: {
            type: String,
            required: [true, "Problem URL is required"],
            trim: true,
            match: [/^https?:\/\/.+/, "Problem URL must begin with http:// or https://"],
        },
        platform: {
            type: String,
            enum: PROBLEM_PLATFORMS,
            default: "LeetCode",
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },
    },
    { _id: true }
);

// Topic subdocument with STABLE UNIQUE IDENTIFIER (topicId)
const topicSchema = new mongoose.Schema(
    {
        topicId: {
            type: String,
            required: [true, "Stable topicId is required"],
            trim: true,
            // Stable identifier invariant: User progress binds to this topicId,
            // so topic title, descriptions, and resources can evolve safely.
        },
        title: {
            type: String,
            required: [true, "Topic title is required"],
            trim: true,
        },
        order: {
            type: Number,
            required: [true, "Topic display order is required"],
            min: 1,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },
        importance: {
            type: String,
            enum: TOPIC_IMPORTANCE,
            default: "Core / Must Know",
        },
        estimatedHours: {
            type: Number,
            min: 0.5,
            default: 4,
        },
        resources: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PreparationResource",
            },
        ],
        practiceProblems: {
            type: [practiceProblemSchema],
            default: [],
        },
        isDeprecated: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true }
);

// Stage subdocument
const stageSchema = new mongoose.Schema(
    {
        stageId: {
            type: String,
            required: [true, "Stable stageId is required"],
            trim: true,
        },
        title: {
            type: String,
            required: [true, "Stage title is required"],
            trim: true,
        },
        order: {
            type: Number,
            required: [true, "Stage order is required"],
            min: 1,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        estimatedWeeks: {
            type: Number,
            min: 1,
            default: 2,
        },
        topics: {
            type: [topicSchema],
            default: [],
        },
    },
    { _id: true }
);

const roadmapSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company reference is required"],
            index: true,
        },
        title: {
            type: String,
            required: [true, "Roadmap title is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, "Roadmap slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        role: {
            type: String,
            required: [true, "Target role is required"],
            trim: true,
            index: true,
        },
        hiringTrack: {
            type: String,
            trim: true,
            default: "General / Fresher",
        },
        description: {
            type: String,
            required: [true, "Roadmap description is required"],
            trim: true,
        },
        estimatedDuration: {
            type: String,
            required: [true, "Estimated preparation duration is required"],
            trim: true,
            default: "8-10 Weeks",
        },
        estimatedDurationWeeks: {
            type: Number,
            min: 1,
            default: 8,
        },
        difficulty: {
            type: String,
            enum: {
                values: ROADMAP_DIFFICULTIES,
                message: `{VALUE} is not a valid roadmap difficulty`,
            },
            default: "Intermediate",
            index: true,
        },
        stages: {
            type: [stageSchema],
            default: [],
        },
        resourceLinks: [
            {
                title: { type: String, trim: true },
                url: { type: String, trim: true },
                type: { type: String, trim: true, default: "General Link" },
            },
        ],
        publicationStatus: {
            type: String,
            enum: {
                values: ROADMAP_PUBLICATION_STATUSES,
                message: `{VALUE} is not a valid publication status`,
            },
            default: "Published",
            index: true,
        },
        version: {
            type: Number,
            default: 1,
            min: 1,
        },
        lastVerifiedDate: {
            type: Date,
            default: Date.now,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Auto-generate slug from title and role if not supplied
roadmapSchema.pre("validate", function (next) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    next();
});

// Helper method: returns array of all active stable topicIds in order
roadmapSchema.methods.getAllTopicIds = function () {
    const topicIds = [];
    if (!this.stages || !Array.isArray(this.stages)) return topicIds;

    const sortedStages = [...this.stages].sort((a, b) => a.order - b.order);
    for (const stage of sortedStages) {
        if (stage.topics && Array.isArray(stage.topics)) {
            const sortedTopics = [...stage.topics].sort((a, b) => a.order - b.order);
            for (const topic of sortedTopics) {
                if (!topic.isDeprecated && topic.topicId) {
                    topicIds.push(topic.topicId);
                }
            }
        }
    }
    return topicIds;
};

// Helper method: returns total active topics count
roadmapSchema.methods.getTotalTopicsCount = function () {
    return this.getAllTopicIds().length;
};

// Compound indexes for optimal querying
roadmapSchema.index({ company: 1, publicationStatus: 1 });
roadmapSchema.index({ company: 1, role: 1, hiringTrack: 1 });
roadmapSchema.index({ role: 1, difficulty: 1 });

export const Roadmap = mongoose.model("Roadmap", roadmapSchema);
