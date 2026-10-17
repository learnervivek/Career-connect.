import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import RoadmapStage from "./RoadmapStage";
import { Button } from "../ui/button";
import {
    ChevronRight,
    ArrowLeft,
    Clock,
    Layers,
    BookOpen,
    CheckCircle2,
    Sparkles,
    ShieldAlert,
    ExternalLink,
    AlertCircle,
    Building2,
    Calendar,
    Award,
    PlayCircle,
    Loader2,
    Flame,
    Target,
    Bookmark,
    Filter,
    RotateCcw,
    SlidersHorizontal,
    Search,
} from "lucide-react";
import { PREPARATION_API_END_POINT, PROGRESS_API_END_POINT } from "@/utils/constant";
import { getSafeExternalLinkProps } from "./safeLink";

const RESOURCE_CATEGORIES = [
    "All",
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
];

const RESOURCE_TYPES = [
    "All",
    "Article",
    "Video",
    "Documentation",
    "Practice Sheet",
    "External Coding Platform",
    "Practice Problem",
    "Interactive Practice",
    "Cheatsheet",
    "Course",
];

const RESOURCE_SOURCES = [
    "All",
    "Official Company",
    "External Platform",
    "Community Contributed",
];

const RoadmapDetailsPage = () => {
    const { slugOrId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    const [roadmap, setRoadmap] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [bookmarkedResourceIds, setBookmarkedResourceIds] = useState([]);
    const [topicNotes, setTopicNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingTopicId, setUpdatingTopicId] = useState(null);
    const [isStarting, setIsStarting] = useState(false);

    // Multi-dimensional filters
    const [filterDifficulty, setFilterDifficulty] = useState("All");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [filterSource, setFilterSource] = useState("All");
    const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchRoadmap = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `${PREPARATION_API_END_POINT}/roadmaps/${slugOrId}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setRoadmap(res.data.roadmap);
                setUserProgress(res.data.userProgress || null);
                setBookmarkedResourceIds(res.data.userBookmarkedResourceIds || []);
                setTopicNotes(res.data.topicNotes || {});

                // If user is logged in, also fetch detailed stage progress from progress endpoint
                if (user) {
                    try {
                        const progRes = await axios.get(
                            `${PROGRESS_API_END_POINT}/${slugOrId}`,
                            { withCredentials: true }
                        );
                        if (progRes.data.success && progRes.data.progress) {
                            setUserProgress(progRes.data.progress);
                        }
                    } catch (pErr) {
                        // Non-critical: keep the populated userProgress from roadmap response
                    }
                }
            } else {
                setError(res.data.message || "Failed to load roadmap");
            }
        } catch (err) {
            console.error("Failed to load roadmap details:", err);
            setError(
                err.response?.data?.message ||
                    "This preparation roadmap could not be loaded or is unavailable."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slugOrId) {
            fetchRoadmap();
        }
    }, [slugOrId, user]);

    // Compute all topic IDs in this roadmap
    const allTopicIds = useMemo(() => {
        if (!roadmap?.stages) return [];
        const ids = [];
        roadmap.stages.forEach((stg) => {
            (stg.topics || []).forEach((t) => {
                if (t.topicId) ids.push(t.topicId);
            });
        });
        return ids;
    }, [roadmap]);

    const completedTopicIds = userProgress?.completedTopicIds || [];
    const completedCount = completedTopicIds.length;
    const totalTopicsCount = allTopicIds.length;
    const remainingCount = Math.max(0, totalTopicsCount - completedCount);
    const completionPercentage =
        totalTopicsCount > 0 ? Math.round((completedCount / totalTopicsCount) * 100) : 0;

    const isEnrolled = !!(
        userProgress?.isEnrolled ||
        (userProgress?.status && userProgress.status !== "Not Started") ||
        completedCount > 0
    );

    // Handle Start Roadmap explicitly
    const handleStartRoadmap = async () => {
        if (!user) {
            toast.info("Please log in to start and track your personal roadmap progress.");
            navigate("/login");
            return;
        }

        if (!roadmap?._id) return;

        try {
            setIsStarting(true);
            const res = await axios.post(
                `${PROGRESS_API_END_POINT}/${roadmap._id}/start`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setUserProgress(res.data.progress);
                toast.success("Roadmap started! Your progress is now being tracked.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to start roadmap");
        } finally {
            setIsStarting(false);
        }
    };

    // Handle topic toggle
    const handleToggleTopic = async (topicId, completed) => {
        if (!user) {
            toast.info("Please log in to track your personal roadmap progress.");
            navigate("/login");
            return;
        }

        if (!roadmap?._id) return;

        // Optimistic update
        const previousProgress = userProgress;
        const newCompletedIds = completed
            ? [...completedTopicIds, topicId]
            : completedTopicIds.filter((id) => id !== topicId);

        setUserProgress({
            ...(userProgress || {}),
            isEnrolled: true,
            status: newCompletedIds.length === totalTopicsCount ? "Completed" : "In Progress",
            completedTopicIds: newCompletedIds,
            completedTopicsCount: newCompletedIds.length,
            remainingTopicsCount: Math.max(0, totalTopicsCount - newCompletedIds.length),
            overallProgressPercentage:
                totalTopicsCount > 0
                    ? Math.round((newCompletedIds.length / totalTopicsCount) * 100)
                    : 0,
            completionPercentage:
                totalTopicsCount > 0
                    ? Math.round((newCompletedIds.length / totalTopicsCount) * 100)
                    : 0,
        });

        try {
            setUpdatingTopicId(topicId);
            const res = await axios.put(
                `${PROGRESS_API_END_POINT}/${roadmap._id}/topics/${topicId}`,
                { completed },
                { withCredentials: true }
            );

            if (res.data.success && res.data.progress) {
                setUserProgress(res.data.progress);
                toast.success(res.data.message);
            }
        } catch (err) {
            setUserProgress(previousProgress);
            toast.error(err.response?.data?.message || "Failed to update progress");
        } finally {
            setUpdatingTopicId(null);
        }
    };

    // Handle Resource Bookmark Toggle
    const handleToggleBookmark = async (resourceId, _title) => {
        if (!user) {
            toast.info("Please log in to bookmark learning resources.");
            navigate("/login");
            return;
        }

        const idStr = String(resourceId);
        const isCurrentlyBookmarked = bookmarkedResourceIds.includes(idStr);

        // Optimistic update
        const nextIds = isCurrentlyBookmarked
            ? bookmarkedResourceIds.filter((id) => id !== idStr)
            : [...bookmarkedResourceIds, idStr];

        setBookmarkedResourceIds(nextIds);

        try {
            const res = await axios.post(
                `${PREPARATION_API_END_POINT}/resources/${resourceId}/bookmark`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
            }
        } catch (err) {
            // Revert
            setBookmarkedResourceIds(bookmarkedResourceIds);
            toast.error(err.response?.data?.message || "Failed to update bookmark");
        }
    };

    // Handle Saving Topic Note
    const handleSaveTopicNote = async (topicId, note) => {
        if (!user) {
            toast.info("Please log in to save preparation notes.");
            navigate("/login");
            return;
        }

        try {
            const res = await axios.put(
                `${PROGRESS_API_END_POINT}/${roadmap._id}/topics/${topicId}/note`,
                { note },
                { withCredentials: true }
            );

            if (res.data.success) {
                setTopicNotes((prev) => ({
                    ...prev,
                    [topicId]: note,
                }));
                toast.success(note ? "Personal preparation note saved!" : "Note removed");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save note");
            throw err;
        }
    };

    // Filtered stages and topics computation
    const hasActiveFilters =
        filterDifficulty !== "All" ||
        filterCategory !== "All" ||
        filterType !== "All" ||
        filterSource !== "All" ||
        filterBookmarkedOnly;

    const resetFilters = () => {
        setFilterDifficulty("All");
        setFilterCategory("All");
        setFilterType("All");
        setFilterSource("All");
        setFilterBookmarkedOnly(false);
    };

    const filteredStages = useMemo(() => {
        if (!roadmap?.stages) return [];
        if (!hasActiveFilters) return roadmap.stages;

        return roadmap.stages
            .map((stage) => {
                const filteredTopics = (stage.topics || []).filter((topic) => {
                    // Topic difficulty filter
                    if (filterDifficulty !== "All" && topic.difficulty !== filterDifficulty) {
                        return false;
                    }

                    // Check resource criteria if resource filters active
                    const topicResources = topic.resources || [];
                    const matchesResourceFilter = topicResources.some((r) => {
                        if (!r || typeof r !== "object") return false;
                        const rId = String(r._id || r.id);

                        if (filterBookmarkedOnly && !bookmarkedResourceIds.includes(rId)) {
                            return false;
                        }

                        if (filterCategory !== "All" && r.category !== filterCategory) {
                            return false;
                        }

                        if (filterType !== "All" && r.type !== filterType) {
                            return false;
                        }

                        if (filterSource !== "All") {
                            if (filterSource === "Official Company" && !r.isOfficial && r.sourceType !== "Official Company") {
                                return false;
                            }
                            if (filterSource === "External Platform" && r.sourceType !== "External Platform") {
                                return false;
                            }
                            if (filterSource === "Community Contributed" && r.sourceType !== "Community Contributed") {
                                return false;
                            }
                        }

                        return true;
                    });

                    // If resource filters are active, only show topics that have matching resources
                    const hasResourceFilterActive =
                        filterCategory !== "All" ||
                        filterType !== "All" ||
                        filterSource !== "All" ||
                        filterBookmarkedOnly;

                    if (hasResourceFilterActive && !matchesResourceFilter) {
                        return false;
                    }

                    return true;
                });

                return {
                    ...stage,
                    topics: filteredTopics,
                };
            })
            .filter((stage) => stage.topics.length > 0);
    }, [
        roadmap,
        hasActiveFilters,
        filterDifficulty,
        filterCategory,
        filterType,
        filterSource,
        filterBookmarkedOnly,
        bookmarkedResourceIds,
    ]);

    const company = roadmap?.company;
    const officialCareersProps = getSafeExternalLinkProps(
        company?.officialCareersUrl || company?.careersUrl
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200/80 px-4 sm:px-[5%] lg:px-[10%] py-3">
                <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Link to="/" className="hover:text-gray-900 transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="size-3.5 text-gray-400" />
                    <Link to="/preparation" className="hover:text-gray-900 transition-colors">
                        Preparation Hub
                    </Link>
                    {company && (
                        <>
                            <ChevronRight className="size-3.5 text-gray-400" />
                            <Link
                                to={`/preparation/companies/${company.slug || company._id}`}
                                className="hover:text-gray-900 transition-colors"
                            >
                                {company.companyName}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="size-3.5 text-gray-400" />
                    <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-none">
                        {roadmap?.title || "Roadmap Details"}
                    </span>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-[5%] py-8">
                {/* Back Link */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            if (company?.slug) {
                                navigate(`/preparation/companies/${company.slug}`);
                            } else {
                                navigate("/preparation");
                            }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#6A38C2] transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to {company?.companyName || "Companies"} Tracks</span>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="space-y-6 animate-pulse">
                        <div className="h-44 bg-white rounded-2xl border border-gray-200" />
                        <div className="h-64 bg-white rounded-2xl border border-gray-200" />
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="p-8 bg-red-50/50 border border-red-200 rounded-2xl text-center">
                        <AlertCircle className="size-10 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-900 mb-1">
                            Roadmap Unavailable
                        </h3>
                        <p className="text-sm text-red-600 max-w-md mx-auto mb-5">
                            {error}
                        </p>
                        <Link to="/preparation">
                            <Button className="bg-[#6A38C2] hover:bg-[#592ea6] text-white">
                                Return to Company Hub
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Main Roadmap Content */}
                {!loading && !error && roadmap && (
                    <div className="space-y-8">
                        {/* Hero Header Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {company && (
                                            <span className="text-xs font-semibold text-[#6A38C2] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <Building2 className="size-3.5" />
                                                {company.companyName}
                                            </span>
                                        )}
                                        {roadmap.role && (
                                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                                {roadmap.role}
                                            </span>
                                        )}
                                        {roadmap.hiringTrack && (
                                            <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                                                {roadmap.hiringTrack}
                                            </span>
                                        )}
                                        {roadmap.difficulty && (
                                            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                                {roadmap.difficulty}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                        {roadmap.title}
                                    </h1>

                                    {roadmap.description && (
                                        <p className="text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
                                            {roadmap.description}
                                        </p>
                                    )}

                                    {/* Metadata Badges */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                                        {roadmap.estimatedDuration && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="size-4 text-gray-400" />
                                                <span>Duration: {roadmap.estimatedDuration}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="size-4 text-gray-400" />
                                            <span>
                                                {roadmap.stages?.length || 0} Stages • {totalTopicsCount} Topics
                                            </span>
                                        </div>
                                        {company?.officialCareersUrl && (
                                            <a
                                                {...officialCareersProps}
                                                className="inline-flex items-center gap-1 text-xs text-[#6A38C2] hover:underline font-medium"
                                            >
                                                <span>Official Careers Page</span>
                                                <ExternalLink className="size-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Enrollment CTA / Status */}
                                <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                                    {!isEnrolled ? (
                                        <Button
                                            onClick={handleStartRoadmap}
                                            disabled={isStarting}
                                            className="bg-[#6A38C2] hover:bg-[#592ea6] text-white font-semibold px-6 py-2.5 h-11 flex items-center justify-center gap-2 shadow-xs"
                                        >
                                            {isStarting ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <PlayCircle className="size-4" />
                                            )}
                                            <span>Start This Roadmap</span>
                                        </Button>
                                    ) : (
                                        <div className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                                            <div className="text-xs font-semibold text-[#6A38C2] flex items-center justify-center gap-1.5">
                                                <Flame className="size-3.5 fill-[#6A38C2]" />
                                                <span>Roadmap In Progress</span>
                                            </div>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                Tracking progress on your account
                                            </p>
                                        </div>
                                    )}

                                    <Link to="/my-preparation">
                                        <Button
                                            variant="outline"
                                            className="w-full text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50"
                                        >
                                            View My Preparation Hub
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Progress Bar Summary Card */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Target className="size-4 text-[#6A38C2]" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                                Your Roadmap Completion
                                            </span>
                                            <span
                                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    completionPercentage === 100
                                                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                                        : isEnrolled
                                                        ? "text-purple-700 bg-purple-50 border border-purple-200"
                                                        : "text-gray-500 bg-gray-100"
                                                }`}
                                            >
                                                {completionPercentage === 100
                                                    ? "Completed 🎉"
                                                    : isEnrolled
                                                    ? "In Progress"
                                                    : "Not Started"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {user
                                                ? isEnrolled
                                                    ? `${completedCount} of ${totalTopicsCount} topics completed • ${remainingCount} remaining`
                                                    : "Click 'Start This Roadmap' or check off any topic below to begin tracking."
                                                : "Log in to check off completed topics, track stages, and save progress."}
                                        </p>
                                    </div>

                                    {/* Progress Bar & Value */}
                                    <div className="flex items-center gap-3 w-full sm:w-72">
                                        <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#6A38C2] h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-[#6A38C2] shrink-0">
                                            {completionPercentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Dimensional Filter Bar */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="size-4 text-[#6A38C2]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Filter Topics & Learning Materials
                                    </span>
                                    {hasActiveFilters && (
                                        <span className="text-[11px] font-semibold bg-purple-100 text-[#6A38C2] px-2 py-0.5 rounded-full">
                                            Filters Active
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                        >
                                            <RotateCcw className="size-3" />
                                            <span>Reset Filters</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#6A38C2] hover:bg-purple-50 font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors"
                                    >
                                        <Filter className="size-3.5" />
                                        <span>{showFilters ? "Hide Filter Controls" : "Adjust Filters"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Collapsible Filter Selectors */}
                            {showFilters && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
                                    {/* Topic Difficulty */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Topic Difficulty
                                        </label>
                                        <select
                                            value={filterDifficulty}
                                            onChange={(e) => setFilterDifficulty(e.target.value)}
                                            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-hidden focus:border-[#6A38C2]"
                                        >
                                            <option value="All">All Difficulties</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Resource Category */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Resource Category
                                        </label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-hidden focus:border-[#6A38C2]"
                                        >
                                            {RESOURCE_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c === "All" ? "All Categories" : c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Resource Type */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Resource Type
                                        </label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-hidden focus:border-[#6A38C2]"
                                        >
                                            {RESOURCE_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t === "All" ? "All Types" : t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Provenance */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Resource Source
                                        </label>
                                        <select
                                            value={filterSource}
                                            onChange={(e) => setFilterSource(e.target.value)}
                                            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-hidden focus:border-[#6A38C2]"
                                        >
                                            {RESOURCE_SOURCES.map((s) => (
                                                <option key={s} value={s}>
                                                    {s === "All" ? "All Provenance Sources" : s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Bookmarked Only Toggle */}
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filterBookmarkedOnly}
                                                onChange={(e) => setFilterBookmarkedOnly(e.target.checked)}
                                                className="size-4 rounded text-[#6A38C2] focus:ring-[#6A38C2] border-gray-300"
                                            />
                                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                <Bookmark className="size-3 text-[#6A38C2]" />
                                                Saved Resources Only
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Indicative Syllabus Notice */}
                        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                            <ShieldAlert className="size-5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900 leading-relaxed">
                                <span className="font-semibold text-amber-950">Indicative Guide: </span>
                                {roadmap.indicativeNoticeText ||
                                    "This syllabus and round sequence reflect common industry technical standards for entry-level hiring. Actual interview rounds and question difficulty may vary per campus or off-campus recruitment drive."}
                            </div>
                        </div>

                        {/* Ordered Stages Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="size-5 text-[#6A38C2]" />
                                    <span>
                                        Preparation Stages ({filteredStages.length} of {roadmap.stages?.length || 0})
                                    </span>
                                </h2>
                                <span className="text-xs text-gray-500">
                                    Click any stage to expand or collapse topics
                                </span>
                            </div>

                            {filteredStages.length === 0 ? (
                                <div className="p-8 rounded-xl bg-white border border-gray-200 text-center text-sm text-gray-500 space-y-2">
                                    <Search className="size-8 text-gray-300 mx-auto" />
                                    <p className="font-medium text-gray-700">
                                        No topics match your current filter selection.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="text-xs text-[#6A38C2] font-semibold hover:underline"
                                    >
                                        Clear filters to see all preparation stages
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredStages.map((stage, idx) => (
                                        <RoadmapStage
                                            key={stage.stageId || idx}
                                            stage={stage}
                                            stageNumber={idx + 1}
                                            completedTopicIds={completedTopicIds}
                                            onToggleTopic={handleToggleTopic}
                                            updatingTopicId={updatingTopicId}
                                            isAuthenticated={!!user}
                                            bookmarkedResourceIds={bookmarkedResourceIds}
                                            onToggleBookmark={handleToggleBookmark}
                                            topicNotes={topicNotes}
                                            onSaveTopicNote={handleSaveTopicNote}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default RoadmapDetailsPage;
