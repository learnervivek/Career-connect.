import mongoose from "mongoose";

export const COMPANY_CATEGORIES = [
    "IT Services & Consulting",
    "Product & Technology",
    "Service-Based",
    "Product-Based",
    "Fintech",
    "Consulting",
    "E-commerce",
    "Semiconductor",
    "Telecommunications",
    "Conglomerate",
    "Other"
];

export const COMPANY_TIERS = [
    "Tier-1",
    "Tier-2",
    "Tier-3",
    "FAANG/MAMAA",
    "MNC",
    "Startup",
    "Other"
];

const companySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            unique: true,
            trim: true,
            index: true,
        },
        slug: {
            type: String,
            required: [true, "Company slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        category: {
            type: String,
            enum: {
                values: COMPANY_CATEGORIES,
                message: `{VALUE} is not a supported company category`,
            },
            default: "Product-Based",
            index: true,
        },
        tier: {
            type: String,
            enum: {
                values: COMPANY_TIERS,
                message: `{VALUE} is not a valid company tier`,
            },
            default: "MNC",
        },
        industry: {
            type: String,
            trim: true,
            default: "Information Technology",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        website: {
            type: String,
            trim: true,
            default: "",
        },
        careersUrl: {
            type: String,
            trim: true,
            default: "",
        },
        location: {
            type: String,
            trim: true,
            default: "",
        },
        headquarters: {
            type: String,
            trim: true,
            default: "",
        },
        logo: {
            type: String, // URL to company logo or SVG data URI
            trim: true,
            default: "",
        },
        hiringTracks: {
            type: [String],
            default: [],
        },
        isPreparationHubActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastVerifiedDate: {
            type: Date,
            default: Date.now,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional for admin/preparation hub seeded companies, populated for recruiter companies
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual reference to all Roadmaps belonging to this company
companySchema.virtual("roadmaps", {
    ref: "Roadmap",
    localField: "_id",
    foreignField: "company",
});

// Auto-generate slug from companyName if not explicitly provided
companySchema.pre("validate", function (next) {
    if (!this.slug && this.companyName) {
        this.slug = this.companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    next();
});

// Compound indexes for optimal querying in Preparation Hub
companySchema.index({ category: 1, isPreparationHubActive: 1 });
companySchema.index({ tier: 1, isPreparationHubActive: 1 });

export const Company = mongoose.model("Company", companySchema);
