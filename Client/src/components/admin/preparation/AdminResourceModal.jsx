import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../ui/dialog";
import { Loader2, BookOpen, ExternalLink, AlertCircle, ShieldCheck } from "lucide-react";
import { ADMIN_PREPARATION_API_END_POINT } from "@/utils/constant";

const RESOURCE_CATEGORIES = [
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
    "Other",
];

const RESOURCE_TYPES = [
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
    "Other",
];

const RESOURCE_SOURCE_TYPES = [
    "Official Company",
    "External Platform",
    "Community Contributed",
];

const RESOURCE_STATUSES = [
    "Active",
    "Deprecated",
    "Obsolete",
];

const AdminResourceModal = ({ isOpen, onClose, onSaved, resource = null }) => {
    const isEditing = Boolean(resource?._id);

    const [formData, setFormData] = useState({
        title: "",
        url: "",
        category: "Core CS",
        type: "Article",
        sourceType: "External Platform",
        provider: "",
        isOfficial: false,
        isFree: true,
        difficulty: "Intermediate",
        estimatedTimeMinutes: 30,
        description: "",
        status: "Active",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (resource) {
            setFormData({
                title: resource.title || "",
                url: resource.url || "",
                category: resource.category || "Core CS",
                type: resource.type || "Article",
                sourceType: resource.sourceType || (resource.isOfficial ? "Official Company" : "External Platform"),
                provider: resource.provider || "",
                isOfficial: Boolean(resource.isOfficial),
                isFree: resource.isFree !== undefined ? Boolean(resource.isFree) : true,
                difficulty: resource.difficulty || "Intermediate",
                estimatedTimeMinutes: resource.estimatedTimeMinutes || 30,
                description: resource.description || "",
                status: resource.status || "Active",
            });
        } else {
            setFormData({
                title: "",
                url: "",
                category: "Core CS",
                type: "Article",
                sourceType: "External Platform",
                provider: "",
                isOfficial: false,
                isFree: true,
                difficulty: "Intermediate",
                estimatedTimeMinutes: 30,
                description: "",
                status: "Active",
            });
        }
        setError("");
    }, [resource, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            // Sync isOfficial with sourceType if changed
            if (name === "sourceType") {
                next.isOfficial = value === "Official Company";
            }
            if (name === "isOfficial" && checked) {
                next.sourceType = "Official Company";
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.title.trim()) {
            setError("Resource title is required");
            return;
        }

        if (!formData.url.trim() || !/^https?:\/\//i.test(formData.url.trim())) {
            setError("Valid resource URL starting with http:// or https:// is required");
            return;
        }

        try {
            setLoading(true);

            if (isEditing) {
                const res = await axios.put(
                    `${ADMIN_PREPARATION_API_END_POINT}/resources/${resource._id}`,
                    formData,
                    { withCredentials: true }
                );

                if (res.data.success) {
                    toast.success(res.data.message || "Resource updated successfully");
                    onSaved(res.data.resource);
                    onClose();
                } else {
                    setError(res.data.message || "Failed to update resource");
                }
            } else {
                const res = await axios.post(
                    `${ADMIN_PREPARATION_API_END_POINT}/resources`,
                    formData,
                    { withCredentials: true }
                );

                if (res.data.success) {
                    toast.success(res.data.message || "Resource created successfully");
                    onSaved(res.data.resource);
                    onClose();
                } else {
                    setError(res.data.message || "Failed to create resource");
                }
            }
        } catch (err) {
            console.error("Save resource error:", err);
            setError(err.response?.data?.message || "Failed to save resource");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <BookOpen className="size-4 text-[#6A38C2]" />
                        <span>{isEditing ? "Edit Learning Resource" : "Add Curated Learning Resource"}</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="resTitle" className="text-xs font-semibold">
                            Resource Title *
                        </Label>
                        <Input
                            id="resTitle"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Striver's A2Z DSA Sheet"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="resUrl" className="text-xs font-semibold">
                            Canonical Resource URL *
                        </Label>
                        <Input
                            id="resUrl"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            placeholder="https://takeuforward.org/strivers-a2z-dsa-course/..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="resCategory" className="text-xs font-semibold">
                                Category *
                            </Label>
                            <select
                                id="resCategory"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-2.5 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                            >
                                {RESOURCE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="resType" className="text-xs font-semibold">
                                Format Type *
                            </Label>
                            <select
                                id="resType"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-2.5 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                            >
                                {RESOURCE_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="resSourceType" className="text-xs font-semibold">
                                Source Provenance *
                            </Label>
                            <select
                                id="resSourceType"
                                name="sourceType"
                                value={formData.sourceType}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-2.5 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                            >
                                {RESOURCE_SOURCE_TYPES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="resProvider" className="text-xs font-semibold">
                                Provider Name
                            </Label>
                            <Input
                                id="resProvider"
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                placeholder="e.g. GeeksforGeeks, takeUforward, LeetCode"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="resDiff" className="text-xs font-semibold">
                                Difficulty
                            </Label>
                            <select
                                id="resDiff"
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-2.5 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="All Levels">All Levels</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="resDuration" className="text-xs font-semibold">
                                Est. Prep (Mins)
                            </Label>
                            <Input
                                id="resDuration"
                                name="estimatedTimeMinutes"
                                type="number"
                                min={1}
                                value={formData.estimatedTimeMinutes}
                                onChange={handleChange}
                                placeholder="45"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="resStatus" className="text-xs font-semibold">
                                Catalog Status
                            </Label>
                            <select
                                id="resStatus"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-2.5 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                            >
                                {RESOURCE_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="resDesc" className="text-xs font-semibold">
                            Summary & Key Learning Objectives
                        </Label>
                        <Input
                            id="resDesc"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief context on what candidates will learn..."
                        />
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                name="isFree"
                                checked={formData.isFree}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-[#6A38C2]"
                            />
                            <span>100% Free Resource</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                name="isOfficial"
                                checked={formData.isOfficial}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-[#6A38C2]"
                            />
                            <span>Official Documentation</span>
                        </label>
                    </div>

                    <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="text-xs h-8"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-8 gap-1.5"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            <span>{isEditing ? "Save Changes" : "Create Resource"}</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminResourceModal;
