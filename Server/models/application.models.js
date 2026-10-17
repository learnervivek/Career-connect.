import mongoose from "mongoose";

export const APPLICATION_STATUSES = [
    "pending",
    "applied",
    "under review",
    "shortlisted",
    "accepted",
    "interview scheduled",
    "selected",
    "rejected",
    "withdrawn",
];

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: [true, "Status is required for history entry"],
            trim: true,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        changedByRole: {
            type: String,
            enum: ["student", "recruiter", "admin", "system"],
            default: "recruiter",
        },
        message: {
            type: String,
            trim: true,
            default: "",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true, timestamps: false }
);

const emailNotificationLogSchema = new mongoose.Schema(
    {
        event: {
            type: String,
            required: true,
        },
        status: {
            type: String,
        },
        recipientEmail: {
            type: String,
            required: true,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        deliveryStatus: {
            type: String,
            enum: ["sent", "simulated", "failed"],
            default: "sent",
        },
        messageId: {
            type: String,
        },
        error: {
            type: String,
        },
    },
    { _id: true, timestamps: false }
);

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: {
                values: APPLICATION_STATUSES,
                message: `{VALUE} is not a supported status.`,
            },
            default: "pending",
        },
        applicationRef: {
            type: String,
            trim: true,
            index: true,
        },
        statusHistory: [statusHistorySchema],
        emailNotificationLogs: [emailNotificationLogSchema],
        interviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Interview",
            },
        ],
    },
    { timestamps: true }
);

// Pre-save hook: auto-generate applicationRef if not present, and populate initial statusHistory if empty
applicationSchema.pre("save", function (next) {
    if (!this.applicationRef && this._id) {
        this.applicationRef = `APP-${this._id.toString().slice(-6).toUpperCase()}`;
    }

    if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
        this.statusHistory = [
            {
                status: this.status || "applied",
                changedBy: this.applicant,
                changedByRole: "student",
                message: "Application submitted successfully",
                timestamp: this.createdAt || new Date(),
            },
        ];
    }

    next();
});

// Indexes for high performance querying
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, createdAt: -1 });
applicationSchema.index({ status: 1 });

export const Application = mongoose.model("Application", applicationSchema);

