import mongoose from "mongoose";

const userResourceBookmarkSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required for bookmark"],
            index: true,
        },
        resource: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PreparationResource",
            required: [true, "Resource reference is required for bookmark"],
            index: true,
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

// Unique compound index: A user can bookmark a specific resource at most once
userResourceBookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });
userResourceBookmarkSchema.index({ user: 1, createdAt: -1 });

export const UserResourceBookmark = mongoose.model(
    "UserResourceBookmark",
    userResourceBookmarkSchema
);
