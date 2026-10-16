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
import {
    Loader2,
    Layers,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    Edit3,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ShieldAlert,
    Clock,
    BookOpen,
} from "lucide-react";
import { ADMIN_PREPARATION_API_END_POINT } from "@/utils/constant";
import RoadmapStage from "../../preparation/RoadmapStage";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Comprehensive"];
const PUBLICATION_STATUSES = ["Draft", "Published", "Archived"];
const TOPIC_IMPORTANCES = ["Core / Must Know", "High Frequency", "Advanced / Bonus"];
const TOPIC_DIFFICULTIES = ["Easy", "Medium", "Hard"];

const AdminRoadmapModal = ({
    isOpen,
    onClose,
    roadmap = null,
    companies = [],
    preselectedCompanyId = null,
    onSaved,
}) => {
    const isEdit = !!roadmap?._id;
    const [viewMode, setViewMode] = useState("edit"); // 'edit' or 'preview'

    const [formData, setFormData] = useState({
        company: "",
        title: "",
        slug: "",
        role: "Software Engineer",
        hiringTrack: "General / Fresher",
        description: "",
        estimatedDuration: "8-10 Weeks",
        difficulty: "Intermediate",
        publicationStatus: "Draft",
        isIndicativeNotice: true,
        indicativeNoticeText:
            "This preparation roadmap reflects industry-standard entry-level patterns and candidate interview experience. It is an indicative learning guide and does not represent official company test guarantees.",
        version: 1,
        stages: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (roadmap) {
            setFormData({
                company: roadmap.company?._id || roadmap.company || preselectedCompanyId || "",
                title: roadmap.title || "",
                slug: roadmap.slug || "",
                role: roadmap.role || "Software Engineer",
                hiringTrack: roadmap.hiringTrack || "General / Fresher",
                description: roadmap.description || "",
                estimatedDuration: roadmap.estimatedDuration || "8-10 Weeks",
                difficulty: roadmap.difficulty || "Intermediate",
                publicationStatus: roadmap.publicationStatus || "Draft",
                isIndicativeNotice:
                    roadmap.isIndicativeNotice !== undefined ? roadmap.isIndicativeNotice : true,
                indicativeNoticeText:
                    roadmap.indicativeNoticeText ||
                    "This preparation roadmap reflects industry-standard entry-level patterns.",
                version: roadmap.version || 1,
                stages: Array.isArray(roadmap.stages)
                    ? JSON.parse(JSON.stringify(roadmap.stages))
                    : [],
            });
        } else {
            setFormData({
                company: preselectedCompanyId || (companies[0]?._id || ""),
                title: "",
                slug: "",
                role: "Software Engineer",
                hiringTrack: "General / Fresher",
                description: "",
                estimatedDuration: "8-10 Weeks",
                difficulty: "Intermediate",
                publicationStatus: "Draft",
                isIndicativeNotice: true,
                indicativeNoticeText:
                    "This preparation roadmap reflects industry-standard entry-level patterns and candidate interview experience.",
                version: 1,
                stages: [
                    {
                        stageId: `stg_${Date.now()}_1`,
                        title: "Stage 1: Core Fundamentals & Programming Logic",
                        order: 1,
                        description: "Foundational programming constructs, logic building, and problem solving.",
                        estimatedWeeks: 2,
                        topics: [
                            {
                                topicId: `top_${Date.now()}_1_1`,
                                title: "Data Structures & Control Flow",
                                order: 1,
                                description: "Arrays, strings, iteration, conditionals, and standard library data structures.",
                                difficulty: "Medium",
                                importance: "Core / Must Know",
                                estimatedHours: 6,
                                resources: [],
                                practiceProblems: [],
                            },
                        ],
                    },
                ],
            });
        }
        setViewMode("edit");
        setError("");
    }, [roadmap, isOpen, preselectedCompanyId, companies]);

    const handleFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Stage manipulation
    const handleAddStage = () => {
        const stageIndex = formData.stages.length + 1;
        const newStage = {
            stageId: `stg_${Date.now()}_${stageIndex}`,
            title: `Stage ${stageIndex}: New Preparation Stage`,
            order: stageIndex,
            description: "",
            estimatedWeeks: 2,
            topics: [],
        };
        setFormData((prev) => ({
            ...prev,
            stages: [...prev.stages, newStage],
        }));
    };

    const handleRemoveStage = (stgIdx) => {
        setFormData((prev) => ({
            ...prev,
            stages: prev.stages.filter((_, idx) => idx !== stgIdx),
        }));
    };

    const handleMoveStage = (stgIdx, direction) => {
        const targetIdx = stgIdx + direction;
        if (targetIdx < 0 || targetIdx >= formData.stages.length) return;
        const newStages = [...formData.stages];
        const temp = newStages[stgIdx];
        newStages[stgIdx] = newStages[targetIdx];
        newStages[targetIdx] = temp;
        // Update orders
        newStages.forEach((s, idx) => {
            s.order = idx + 1;
        });
        setFormData((prev) => ({ ...prev, stages: newStages }));
    };

    const handleStageChange = (stgIdx, field, value) => {
        setFormData((prev) => {
            const newStages = [...prev.stages];
            newStages[stgIdx] = { ...newStages[stgIdx], [field]: value };
            return { ...prev, stages: newStages };
        });
    };

    // Topic manipulation
    const handleAddTopic = (stgIdx) => {
        const stage = formData.stages[stgIdx];
        const topicIndex = (stage.topics?.length || 0) + 1;
        const newTopic = {
            topicId: `top_${Date.now()}_${stgIdx + 1}_${topicIndex}`,
            title: `Topic ${topicIndex}`,
            order: topicIndex,
            description: "",
            difficulty: "Medium",
            importance: "Core / Must Know",
            estimatedHours: 4,
            resources: [],
            practiceProblems: [],
        };

        setFormData((prev) => {
            const newStages = [...prev.stages];
            newStages[stgIdx] = {
                ...newStages[stgIdx],
                topics: [...(newStages[stgIdx].topics || []), newTopic],
            };
            return { ...prev, stages: newStages };
        });
    };

    const handleRemoveTopic = (stgIdx, topIdx) => {
        setFormData((prev) => {
            const newStages = [...prev.stages];
            newStages[stgIdx] = {
                ...newStages[stgIdx],
                topics: newStages[stgIdx].topics.filter((_, idx) => idx !== topIdx),
            };
            return { ...prev, stages: newStages };
        });
    };

    const handleTopicChange = (stgIdx, topIdx, field, value) => {
        setFormData((prev) => {
            const newStages = [...prev.stages];
            const newTopics = [...newStages[stgIdx].topics];
            newTopics[topIdx] = { ...newTopics[topIdx], [field]: value };
            newStages[stgIdx] = { ...newStages[stgIdx], topics: newTopics };
            return { ...prev, stages: newStages };
        });
    };

    // Save
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.company) {
            setError("Target company is required");
            return;
        }

        if (!formData.title.trim()) {
            setError("Roadmap title is required");
            return;
        }

        if (!formData.role.trim()) {
            setError("Target role is required");
            return;
        }

        if (!formData.description.trim()) {
            setError("Roadmap description is required");
            return;
        }

        try {
            setLoading(true);
            let res;
            if (isEdit) {
                res = await axios.put(
                    `${ADMIN_PREPARATION_API_END_POINT}/roadmaps/${roadmap._id}`,
                    formData,
                    { withCredentials: true }
                );
            } else {
                res = await axios.post(
                    `${ADMIN_PREPARATION_API_END_POINT}/roadmaps`,
                    formData,
                    { withCredentials: true }
                );
            }

            if (res.data.success) {
                toast.success(res.data.message);
                onSaved(res.data.roadmap);
                onClose();
            } else {
                setError(res.data.message || "Failed to save roadmap");
            }
        } catch (err) {
            console.error("Save roadmap error:", err);
            setError(err.response?.data?.message || "Failed to save roadmap profile");
        } finally {
            setLoading(false);
        }
    };

    const targetCompanyObj = companies.find((c) => c._id === formData.company);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Layers className="size-5 text-[#6A38C2]" />
                        <span>{isEdit ? `Edit Roadmap: ${roadmap?.title}` : "Create Preparation Roadmap"}</span>
                    </DialogTitle>

                    {/* Mode Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setViewMode("edit")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                viewMode === "edit"
                                    ? "bg-white text-gray-900 shadow-2xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            <Edit3 className="size-3.5" />
                            <span>Editor</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("preview")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                viewMode === "preview"
                                    ? "bg-white text-[#6A38C2] shadow-2xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            <Eye className="size-3.5" />
                            <span>Candidate Preview</span>
                        </button>
                    </div>
                </DialogHeader>

                {viewMode === "preview" ? (
                    /* LIVE CANDIDATE PREVIEW */
                    <div className="space-y-6 py-4">
                        <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-[#6A38C2]" />
                                <span className="text-xs font-bold text-purple-900">
                                    Live Candidate View Preview Mode
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-500">
                                Status:{" "}
                                <span className="text-[#6A38C2] uppercase">{formData.publicationStatus}</span>
                            </span>
                        </div>

                        {/* Roadmap Header Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-gray-800 bg-gray-100 px-3 py-0.5 rounded-full">
                                    {targetCompanyObj?.companyName || "Selected Company"}
                                </span>
                                <span className="text-xs font-semibold text-[#6A38C2] bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                                    {formData.role}
                                </span>
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                    {formData.hiringTrack}
                                </span>
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                    {formData.difficulty}
                                </span>
                            </div>

                            <h2 className="text-2xl font-extrabold text-gray-900">{formData.title}</h2>
                            <p className="text-sm text-gray-600 leading-relaxed">{formData.description}</p>

                            <div className="flex items-center gap-5 text-xs text-gray-500 pt-2">
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3.5 text-gray-400" />
                                    {formData.estimatedDuration}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Layers className="size-3.5 text-gray-400" />
                                    {formData.stages.length} Stages
                                </span>
                                <span className="flex items-center gap-1">
                                    <BookOpen className="size-3.5 text-gray-400" />
                                    {formData.stages.reduce((acc, s) => acc + (s.topics?.length || 0), 0)} Topics
                                </span>
                            </div>
                        </div>

                        {/* Indicative Notice Banner */}
                        {formData.isIndicativeNotice && (
                            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                                <ShieldAlert className="size-5 text-amber-700 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 leading-relaxed">
                                    <span className="font-semibold text-amber-950">Indicative Guide: </span>
                                    {formData.indicativeNoticeText}
                                </div>
                            </div>
                        )}

                        {/* Stages Preview */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-gray-900">
                                Preparation Stages ({formData.stages.length})
                            </h3>
                            {formData.stages.map((stg, idx) => (
                                <RoadmapStage
                                    key={stg.stageId || idx}
                                    stage={stg}
                                    stageNumber={idx + 1}
                                    completedTopicIds={[]}
                                    isAuthenticated={false}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* FORM EDITOR */
                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* General Metadata */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                General Track Information
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="company" className="text-xs font-semibold">
                                        Company *
                                    </Label>
                                    <select
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleFieldChange}
                                        disabled={isEdit}
                                        className="w-full text-xs h-9 px-3 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                                        required
                                    >
                                        <option value="">Select Company...</option>
                                        {companies.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.companyName} ({c.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-xs font-semibold">
                                        Roadmap Title *
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleFieldChange}
                                        placeholder="e.g. TCS Digital & Prime Software Development Preparation"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="role" className="text-xs font-semibold">
                                        Target Role *
                                    </Label>
                                    <Input
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFieldChange}
                                        placeholder="e.g. Software Engineer"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="hiringTrack" className="text-xs font-semibold">
                                        Hiring Track / Cadre
                                    </Label>
                                    <Input
                                        id="hiringTrack"
                                        name="hiringTrack"
                                        value={formData.hiringTrack}
                                        onChange={handleFieldChange}
                                        placeholder="e.g. Digital / Prime Cadre"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="slug" className="text-xs font-semibold">
                                        Slug (Optional, auto-generated)
                                    </Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleFieldChange}
                                        placeholder="e.g. tcs-digital-prime-sde"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs font-semibold">
                                    Roadmap Description *
                                </Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFieldChange}
                                    rows={2}
                                    placeholder="Detailed overview of technical skills, topics, and interview phases covered..."
                                    className="w-full text-xs p-3 border border-gray-200 bg-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="estimatedDuration" className="text-xs font-semibold">
                                        Duration
                                    </Label>
                                    <Input
                                        id="estimatedDuration"
                                        name="estimatedDuration"
                                        value={formData.estimatedDuration}
                                        onChange={handleFieldChange}
                                        placeholder="e.g. 8-10 Weeks"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="difficulty" className="text-xs font-semibold">
                                        Difficulty Level
                                    </Label>
                                    <select
                                        id="difficulty"
                                        name="difficulty"
                                        value={formData.difficulty}
                                        onChange={handleFieldChange}
                                        className="w-full text-xs h-9 px-3 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                                    >
                                        {DIFFICULTIES.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="publicationStatus" className="text-xs font-semibold">
                                        Publication Status
                                    </Label>
                                    <select
                                        id="publicationStatus"
                                        name="publicationStatus"
                                        value={formData.publicationStatus}
                                        onChange={handleFieldChange}
                                        className="w-full text-xs h-9 px-3 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                                    >
                                        {PUBLICATION_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="version" className="text-xs font-semibold">
                                        Roadmap Version
                                    </Label>
                                    <Input
                                        id="version"
                                        name="version"
                                        type="number"
                                        min="1"
                                        value={formData.version}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                            </div>

                            {/* Indicative Notice Configuration */}
                            <div className="pt-2 border-t border-gray-200/80 space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isIndicativeNotice"
                                        name="isIndicativeNotice"
                                        checked={formData.isIndicativeNotice}
                                        onChange={handleFieldChange}
                                        className="rounded border-gray-300 text-[#6A38C2] focus:ring-[#6A38C2]"
                                    />
                                    <Label htmlFor="isIndicativeNotice" className="text-xs font-semibold cursor-pointer">
                                        Display Indicative Syllabus Disclaimer Notice
                                    </Label>
                                </div>

                                {formData.isIndicativeNotice && (
                                    <Input
                                        id="indicativeNoticeText"
                                        name="indicativeNoticeText"
                                        value={formData.indicativeNoticeText}
                                        onChange={handleFieldChange}
                                        placeholder="Disclaimer text..."
                                        className="text-xs bg-white"
                                    />
                                )}
                            </div>
                        </div>

                        {/* STAGES & TOPICS BUILDER */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="size-4 text-[#6A38C2]" />
                                    <span>Stages & Topics Editor ({formData.stages.length} Stages)</span>
                                </h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddStage}
                                    className="gap-1.5 text-xs h-8 cursor-pointer border-[#6A38C2]/40 text-[#6A38C2] hover:bg-purple-50"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Add Stage</span>
                                </Button>
                            </div>

                            {formData.stages.map((stage, stgIdx) => (
                                <div
                                    key={stage.stageId || stgIdx}
                                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3"
                                >
                                    {/* Stage Title and Header */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="size-6 rounded-full bg-[#6A38C2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                                {stgIdx + 1}
                                            </span>
                                            <Input
                                                value={stage.title}
                                                onChange={(e) => handleStageChange(stgIdx, "title", e.target.value)}
                                                placeholder="Stage Title (e.g. Stage 1: Advanced Algorithms)"
                                                className="font-bold text-sm h-8"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <div className="flex items-center gap-1 mr-2">
                                                <span className="text-[11px] text-gray-400">Weeks:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={stage.estimatedWeeks || 2}
                                                    onChange={(e) =>
                                                        handleStageChange(
                                                            stgIdx,
                                                            "estimatedWeeks",
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    }
                                                    className="w-12 text-xs h-8 px-1 text-center border border-gray-200 rounded"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                disabled={stgIdx === 0}
                                                onClick={() => handleMoveStage(stgIdx, -1)}
                                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                                title="Move Stage Up"
                                            >
                                                <ChevronUp className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={stgIdx === formData.stages.length - 1}
                                                onClick={() => handleMoveStage(stgIdx, 1)}
                                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                                title="Move Stage Down"
                                            >
                                                <ChevronDown className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStage(stgIdx)}
                                                className="p-1 text-gray-400 hover:text-rose-600 ml-1"
                                                title="Remove Stage"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stage Description */}
                                    <Input
                                        value={stage.description || ""}
                                        onChange={(e) => handleStageChange(stgIdx, "description", e.target.value)}
                                        placeholder="Stage description or primary objectives..."
                                        className="text-xs h-8 text-gray-600"
                                    />

                                    {/* Topics List in Stage */}
                                    <div className="mt-2 pl-4 border-l-2 border-purple-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                                Topics ({stage.topics?.length || 0})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleAddTopic(stgIdx)}
                                                className="text-xs text-[#6A38C2] font-semibold hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="size-3" /> Add Topic
                                            </button>
                                        </div>

                                        {(stage.topics || []).map((topic, topIdx) => (
                                            <div
                                                key={topic.topicId || topIdx}
                                                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 space-y-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="text-[11px] font-mono text-gray-400">
                                                            #{topIdx + 1}
                                                        </span>
                                                        <Input
                                                            value={topic.title}
                                                            onChange={(e) =>
                                                                handleTopicChange(stgIdx, topIdx, "title", e.target.value)
                                                            }
                                                            placeholder="Topic Title (e.g. Graph Algorithms: BFS, DFS & Dijkstra)"
                                                            className="text-xs font-semibold h-7"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <select
                                                            value={topic.importance}
                                                            onChange={(e) =>
                                                                handleTopicChange(stgIdx, topIdx, "importance", e.target.value)
                                                            }
                                                            className="text-[11px] h-7 px-1.5 bg-white border border-gray-200 rounded"
                                                        >
                                                            {TOPIC_IMPORTANCES.map((imp) => (
                                                                <option key={imp} value={imp}>
                                                                    {imp}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            value={topic.difficulty}
                                                            onChange={(e) =>
                                                                handleTopicChange(stgIdx, topIdx, "difficulty", e.target.value)
                                                            }
                                                            className="text-[11px] h-7 px-1.5 bg-white border border-gray-200 rounded"
                                                        >
                                                            {TOPIC_DIFFICULTIES.map((d) => (
                                                                <option key={d} value={d}>
                                                                    {d}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTopic(stgIdx, topIdx)}
                                                            className="text-gray-400 hover:text-rose-600 p-1"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <Input
                                                    value={topic.description || ""}
                                                    onChange={(e) =>
                                                        handleTopicChange(stgIdx, topIdx, "description", e.target.value)
                                                    }
                                                    placeholder="Topic summary, key formulas or techniques..."
                                                    className="text-[11px] h-7 text-gray-600"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                                className="text-xs h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-9 gap-1.5 cursor-pointer"
                            >
                                {loading && <Loader2 className="size-3.5 animate-spin" />}
                                <span>{isEdit ? "Save Changes" : "Create Roadmap"}</span>
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AdminRoadmapModal;
