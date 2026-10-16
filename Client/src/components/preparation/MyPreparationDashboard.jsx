import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { Button } from "../ui/button";
import {
    Target,
    Layers,
    BookOpen,
    CheckCircle2,
    Clock,
    Building2,
    Trash2,
    ExternalLink,
    ArrowRight,
    Sparkles,
    TrendingUp,
    RefreshCw,
    AlertCircle,
    Bookmark,
    Award,
    Filter,
    Search,
    Globe,
    Users,
    ShieldCheck,
    FileCode,
    Video,
    FileSpreadsheet,
    Laptop,
    X,
} from "lucide-react";
import {
    MY_PREPARATION_API_END_POINT,
    MY_TARGET_COMPANIES_API_END_POINT,
    PREPARATION_API_END_POINT,
} from "@/utils/constant";
import ContinuePreparationCard from "./ContinuePreparationCard";
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

const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getPriorityBadge = (priority) => {
    switch (priority) {
        case "Dream":
            return (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="size-3 text-purple-600" /> Dream
                </span>
            );
        case "Safety":
            return (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Safety
                </span>
            );
        case "Target":
        default:
            return (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Target className="size-3 text-blue-600" /> Target
                </span>
            );
    }
};

const getResourceIcon = (type) => {
    switch (type) {
        case "Video":
            return <Video className="size-4 text-rose-500" />;
        case "Documentation":
            return <FileCode className="size-4 text-blue-500" />;
        case "Practice Sheet":
            return <FileSpreadsheet className="size-4 text-teal-600" />;
        case "External Coding Platform":
            return <Laptop className="size-4 text-indigo-600" />;
        default:
            return <BookOpen className="size-4 text-amber-500" />;
    }
};

const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

const MyPreparationDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState(null);
    const [continuePreparation, setContinuePreparation] = useState(null);
    const [targetCompanies, setTargetCompanies] = useState([]);
    const [activeRoadmaps, setActiveRoadmaps] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [activeTab, setActiveTab] = useState("roadmaps");
    const [roadmapFilter, setRoadmapFilter] = useState("All");
    const [deletingCompanyId, setDeletingCompanyId] = useState(null);

    // Bookmarks filters
    const [bookmarkSearch, setBookmarkSearch] = useState("");
    const [bookmarkCategory, setBookmarkCategory] = useState("All");
    const [unbookmarkingId, setUnbookmarkingId] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const [dashRes, bookmarksRes] = await Promise.all([
                axios.get(MY_PREPARATION_API_END_POINT, { withCredentials: true }),
                axios.get(`${PREPARATION_API_END_POINT}/my-resource-bookmarks`, {
                    withCredentials: true,
                }),
            ]);

            if (dashRes.data.success) {
                setSummary(dashRes.data.summary);
                setContinuePreparation(dashRes.data.continuePreparation || null);
                setTargetCompanies(dashRes.data.targetCompanies || []);
                setActiveRoadmaps(dashRes.data.activeRoadmaps || []);
            } else {
                setError(dashRes.data.message || "Failed to load preparation dashboard");
            }

            if (bookmarksRes.data.success) {
                setBookmarks(bookmarksRes.data.bookmarks || []);
            }
        } catch (err) {
            console.error("Failed to load preparation dashboard:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to load your personal preparation progress. Please log in or refresh."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchDashboardData();
    }, [user]);

    const handleRemoveTarget = async (companyId, companyName) => {
        try {
            setDeletingCompanyId(companyId);
            const res = await axios.delete(
                `${MY_TARGET_COMPANIES_API_END_POINT}/${companyId}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setTargetCompanies((prev) =>
                    prev.filter((t) => t.company?._id !== companyId && t.company?.slug !== companyId)
                );
                setSummary((prev) =>
                    prev
                        ? { ...prev, totalTargetCompanies: Math.max(0, prev.totalTargetCompanies - 1) }
                        : prev
                );
                toast.success(`${companyName || "Company"} removed from your target list`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove target company");
        } finally {
            setDeletingCompanyId(null);
        }
    };

    const handleRemoveBookmark = async (resourceId, title) => {
        try {
            setUnbookmarkingId(resourceId);
            const res = await axios.post(
                `${PREPARATION_API_END_POINT}/resources/${resourceId}/bookmark`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setBookmarks((prev) => prev.filter((b) => b.resource?._id !== resourceId));
                setSummary((prev) =>
                    prev
                        ? {
                              ...prev,
                              bookmarkedResourcesCount: Math.max(
                                  0,
                                  (prev.bookmarkedResourcesCount || 1) - 1
                              ),
                          }
                        : prev
                );
                toast.success(`Removed '${title}' from your saved bookmarks`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove bookmark");
        } finally {
            setUnbookmarkingId(null);
        }
    };

    const filteredRoadmaps = activeRoadmaps.filter((rm) => {
        if (roadmapFilter === "In Progress") return rm.status === "In Progress";
        if (roadmapFilter === "Completed") return rm.status === "Completed";
        return true;
    });

    const filteredBookmarks = useMemo(() => {
        return bookmarks.filter((b) => {
            if (!b.resource) return false;
            if (bookmarkCategory !== "All" && b.resource.category !== bookmarkCategory) {
                return false;
            }
            if (bookmarkSearch.trim()) {
                const q = bookmarkSearch.trim().toLowerCase();
                const titleMatch = b.resource.title?.toLowerCase().includes(q);
                const descMatch = b.resource.description?.toLowerCase().includes(q);
                const notesMatch = b.notes?.toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !notesMatch) return false;
            }
            return true;
        });
    }, [bookmarks, bookmarkCategory, bookmarkSearch]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            {/* Header Banner */}
            <div className="bg-gradient-to-b from-purple-50/80 via-white to-gray-50/50 border-b border-gray-200/80 pt-8 pb-10 px-4 sm:px-[5%] lg:px-[10%]">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6A38C2]/10 border border-[#6A38C2]/20 text-[#6A38C2] text-xs font-semibold mb-2">
                            <Sparkles className="size-3.5" />
                            <span>Candidate Preparation Center</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            My Preparation Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Track your active roadmaps, topic completion milestones, target enterprises, and bookmarked study resources.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDashboardData}
                            disabled={loading}
                            className="gap-1.5 text-xs h-9 cursor-pointer"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </Button>
                        <Button
                            onClick={() => navigate("/preparation")}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs font-medium gap-1.5 h-9 cursor-pointer"
                        >
                            <BookOpen className="size-3.5" />
                            <span>Explore Catalog</span>
                        </Button>
                    </div>
                </div>

                {/* Metrics Summary Grid */}
                {!loading && summary && (
                    <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
                        <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold mb-1">
                                <Target className="size-4" />
                                <span>Target Companies</span>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900">
                                {summary.totalTargetCompanies || 0}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Priority bucket</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 text-purple-600 text-xs font-semibold mb-1">
                                <Layers className="size-4" />
                                <span>Active Roadmaps</span>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900">
                                {summary.activeRoadmapsCount || 0}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">In progress</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-1">
                                <Award className="size-4" />
                                <span>Completed Tracks</span>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900">
                                {summary.completedRoadmapsCount || 0}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">100% prepared</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold mb-1">
                                <CheckCircle2 className="size-4" />
                                <span>Topics Mastered</span>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900">
                                {summary.totalTopicsCompleted || 0}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Completed topics</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 text-[#6A38C2] text-xs font-semibold mb-1">
                                <Bookmark className="size-4" />
                                <span>Saved Resources</span>
                            </div>
                            <p className="text-2xl font-extrabold text-[#6A38C2]">
                                {summary.bookmarkedResourcesCount || bookmarks.length}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Curated bookmarks</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-[5%] lg:px-[10%] py-8 space-y-8">
                {/* Continue Preparation Card if active track present */}
                {continuePreparation && (
                    <ContinuePreparationCard continuePreparation={continuePreparation} />
                )}

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 px-4 flex items-center gap-6 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("roadmaps")}
                        className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                            activeTab === "roadmaps"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Layers className="size-4" />
                        <span>Active Roadmaps ({activeRoadmaps.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("targets")}
                        className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                            activeTab === "targets"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Target className="size-4" />
                        <span>Target Companies ({targetCompanies.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("bookmarks")}
                        className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                            activeTab === "bookmarks"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Bookmark className="size-4" />
                        <span>Saved Resources ({bookmarks.length})</span>
                    </button>
                </div>

                {/* Loading Skeletons */}
                {loading && (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-32 bg-white border border-gray-200 rounded-2xl" />
                        <div className="h-32 bg-white border border-gray-200 rounded-2xl" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto my-12">
                        <AlertCircle className="size-10 text-rose-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-rose-900">Dashboard Unavailable</h3>
                        <p className="text-xs text-rose-700 mt-1">{error}</p>
                        <Button onClick={fetchDashboardData} className="mt-4 bg-rose-600 text-white text-xs">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Tab 1: Active Roadmaps */}
                {!loading && !error && activeTab === "roadmaps" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                My Preparation Tracks
                            </h2>
                            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                                {["All", "In Progress", "Completed"].map((filterOpt) => (
                                    <button
                                        key={filterOpt}
                                        type="button"
                                        onClick={() => setRoadmapFilter(filterOpt)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                            roadmapFilter === filterOpt
                                                ? "bg-white text-gray-900 shadow-2xs"
                                                : "text-gray-500 hover:text-gray-900"
                                        }`}
                                    >
                                        {filterOpt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredRoadmaps.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                                <BookOpen className="size-10 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-gray-800">
                                    No Active Roadmaps in this view
                                </h3>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                                    Explore entry-level roadmaps for TCS, Infosys, Wipro, Google, Microsoft, and more.
                                </p>
                                <Button
                                    onClick={() => navigate("/preparation")}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs"
                                >
                                    Browse Preparation Roadmaps
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredRoadmaps.map((item) => {
                                    const rm = item.roadmap;
                                    if (!rm) return null;
                                    const comp = rm.company;
                                    const isComplete = item.status === "Completed";

                                    return (
                                        <div
                                            key={item._id}
                                            className="p-5 rounded-2xl border border-gray-200/90 bg-white shadow-2xs hover:border-[#6A38C2]/40 hover:shadow-sm transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-xs text-[#6A38C2] shrink-0">
                                                            {comp?.logo ? (
                                                                <img
                                                                    src={comp.logo}
                                                                    alt={comp.companyName}
                                                                    className="w-full h-full object-contain p-1"
                                                                />
                                                            ) : (
                                                                getInitials(comp?.companyName)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-[11px] font-semibold text-gray-500 block truncate">
                                                                {comp?.companyName}
                                                            </span>
                                                            <h3 className="text-sm font-bold text-gray-900 truncate">
                                                                {rm.title}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                                            isComplete
                                                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                                                : "text-purple-700 bg-purple-50 border border-purple-200"
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 my-3">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                                                        {rm.role}
                                                    </span>
                                                    {rm.hiringTrack && (
                                                        <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                                                            {rm.hiringTrack}
                                                        </span>
                                                    )}
                                                    {rm.difficulty && (
                                                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                                                            {rm.difficulty}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                        <span className="font-medium text-gray-600">
                                                            {item.completedTopicsCount} of {item.totalTopicsCount} topics completed
                                                        </span>
                                                        <span className="font-bold text-[#6A38C2]">
                                                            {item.overallProgressPercentage}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                isComplete ? "bg-emerald-600" : "bg-[#6A38C2]"
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, item.overallProgressPercentage))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400">
                                                    {item.lastStudiedAt
                                                        ? `Last active: ${new Date(item.lastStudiedAt).toLocaleDateString()}`
                                                        : "Started recently"}
                                                </span>

                                                <Link to={`/preparation/roadmaps/${rm.slug || rm._id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs gap-1 border-gray-200 hover:border-[#6A38C2]/40 hover:text-[#6A38C2] cursor-pointer h-8"
                                                    >
                                                        <span>Continue Roadmap</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Target Companies */}
                {!loading && !error && activeTab === "targets" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                Priority Target Companies
                            </h2>
                            <Button
                                onClick={() => navigate("/preparation")}
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5 h-8 cursor-pointer"
                            >
                                <Target className="size-3.5 text-blue-600" />
                                <span>Add Target Companies</span>
                            </Button>
                        </div>

                        {targetCompanies.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                                <Target className="size-10 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-gray-800">
                                    No Target Companies Saved Yet
                                </h3>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                                    Star companies from the Preparation catalog to prioritize your recruitment focus.
                                </p>
                                <Button
                                    onClick={() => navigate("/preparation")}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs"
                                >
                                    Browse Preparation Companies
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {targetCompanies.map((t) => {
                                    const comp = t.company;
                                    if (!comp) return null;
                                    const isDeleting = deletingCompanyId === comp._id;

                                    return (
                                        <div
                                            key={t._id}
                                            className="p-5 rounded-2xl border border-gray-200/90 bg-white shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-10 rounded-xl bg-gray-50 border border-gray-200 p-1 flex items-center justify-center font-bold text-xs text-gray-700 shrink-0">
                                                            {comp?.logo ? (
                                                                <img
                                                                    src={comp.logo}
                                                                    alt={comp.companyName}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            ) : (
                                                                getInitials(comp?.companyName)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-bold text-gray-900 truncate">
                                                                {comp?.companyName}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {comp?.category}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {getPriorityBadge(t.priority)}
                                                </div>

                                                <div className="space-y-2 mt-4 text-xs">
                                                    <div className="flex items-center justify-between text-gray-600">
                                                        <span className="text-gray-400">Target Role:</span>
                                                        <span className="font-semibold text-gray-800">
                                                            {t.targetRole || "Software Engineer"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-gray-600">
                                                        <span className="text-gray-400">Prep Status:</span>
                                                        <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                            {t.preparationStatus || "Actively Preparing"}
                                                        </span>
                                                    </div>
                                                    {t.notes && (
                                                        <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg mt-2 italic">
                                                            "{t.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    disabled={isDeleting}
                                                    onClick={() => handleRemoveTarget(comp._id, comp.companyName)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove from target list"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>

                                                <Button
                                                    onClick={() => navigate(`/preparation/companies/${comp.slug || comp._id}`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs gap-1 cursor-pointer h-8"
                                                >
                                                    <span>View Tracks</span>
                                                    <ArrowRight className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Saved Learning Resources (Bookmarks) */}
                {!loading && !error && activeTab === "bookmarks" && (
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                    Saved Learning Resources ({bookmarks.length})
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Curated technical documentation, sheets, practice platforms, and official guides saved to your account.
                                </p>
                            </div>

                            {/* Search bar */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={bookmarkSearch}
                                    onChange={(e) => setBookmarkSearch(e.target.value)}
                                    placeholder="Search saved resources..."
                                    className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#6A38C2]"
                                />
                                {bookmarkSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setBookmarkSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {RESOURCE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setBookmarkCategory(cat)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        bookmarkCategory === cat
                                            ? "bg-[#6A38C2] text-white shadow-2xs"
                                            : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Bookmarks Grid */}
                        {filteredBookmarks.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                                <Bookmark className="size-10 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-gray-800">
                                    {bookmarks.length === 0
                                        ? "No Saved Resources Yet"
                                        : "No bookmarks match your search"}
                                </h3>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                                    Browse role roadmaps and click the bookmark icon on any guide, sheet, or platform to save it here for quick revision.
                                </p>
                                <Button
                                    onClick={() => navigate("/preparation")}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs"
                                >
                                    Explore Preparation Roadmaps
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredBookmarks.map((b) => {
                                    const res = b.resource;
                                    if (!res) return null;
                                    const safeProps = getSafeExternalLinkProps(res.url);
                                    const isDeleting = unbookmarkingId === res._id;
                                    const durationLabel = formatDuration(res.estimatedTimeMinutes);

                                    return (
                                        <div
                                            key={b._id}
                                            className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs hover:border-[#6A38C2]/40 hover:shadow-xs transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="p-1.5 rounded-lg bg-purple-50 border border-purple-100 shrink-0">
                                                        {getResourceIcon(res.type)}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                                            {res.category || "Core CS"}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={isDeleting}
                                                            onClick={() => handleRemoveBookmark(res._id, res.title)}
                                                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                            title="Remove bookmark"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                                                    {res.title}
                                                </h4>

                                                {res.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                        {res.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px] text-gray-500">
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {res.type || "Resource"}
                                                    </span>
                                                    {res.sourceType && (
                                                        <span className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                                            {res.sourceType}
                                                        </span>
                                                    )}
                                                    {durationLabel && (
                                                        <span className="inline-flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                                            <Clock className="size-2.5" />
                                                            {durationLabel}
                                                        </span>
                                                    )}
                                                    {res.isFree && (
                                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                                                            Free
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-400">
                                                    Saved on {new Date(b.createdAt).toLocaleDateString()}
                                                </span>

                                                <a
                                                    {...safeProps}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#6A38C2] hover:underline"
                                                >
                                                    <span>Open Resource</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default MyPreparationDashboard;
