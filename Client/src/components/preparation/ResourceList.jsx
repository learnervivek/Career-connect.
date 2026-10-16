import React from "react";
import { Badge } from "../ui/badge";
import {
    ExternalLink,
    BookOpen,
    Video,
    FileCode,
    Code2,
    CheckCircle2,
    Globe,
    Terminal,
    Sparkles,
    Bookmark,
    Building2,
    Users,
    Clock,
    ShieldCheck,
    AlertTriangle,
    Layers,
    FileSpreadsheet,
    Laptop,
} from "lucide-react";
import { getSafeExternalLinkProps } from "./safeLink";

const getResourceIcon = (type) => {
    switch (type) {
        case "Video":
            return <Video className="size-4 text-rose-500" />;
        case "Interactive Practice":
            return <Terminal className="size-4 text-emerald-500" />;
        case "Documentation":
            return <FileCode className="size-4 text-blue-500" />;
        case "Practice Sheet":
            return <FileSpreadsheet className="size-4 text-teal-600" />;
        case "External Coding Platform":
            return <Laptop className="size-4 text-indigo-600" />;
        case "Code Repository":
            return <Code2 className="size-4 text-purple-500" />;
        case "Article":
        case "Guide":
        default:
            return <BookOpen className="size-4 text-amber-500" />;
    }
};

const getSourceBadge = (sourceType, isOfficial, provider) => {
    if (isOfficial || sourceType === "Official Company") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs">
                <Building2 className="size-3 text-blue-600" />
                <span>Official Company</span>
            </span>
        );
    }

    if (sourceType === "Community Contributed") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Users className="size-3 text-emerald-600" />
                <span>Community Contributed</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            <Globe className="size-3 text-purple-600" />
            <span>{provider || "Curated Platform"}</span>
        </span>
    );
};

const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

const formatVerifiedDate = (dateStr) => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
        return null;
    }
};

const ResourceList = ({
    resources = [],
    practiceProblems = [],
    bookmarkedResourceIds = [],
    onToggleBookmark,
    isAuthenticated = false,
}) => {
    const hasResources = Array.isArray(resources) && resources.length > 0;
    const hasProblems = Array.isArray(practiceProblems) && practiceProblems.length > 0;

    if (!hasResources && !hasProblems) {
        return null;
    }

    return (
        <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
            {/* Curated Learning Resources */}
            {hasResources && (
                <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-[#6A38C2]" />
                        Structured Learning Resources ({resources.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {resources.map((res, idx) => {
                            const isPopulated = res && typeof res === "object" && res.title;
                            if (!isPopulated) return null;

                            const resourceId = res._id || res.id;
                            const isBookmarked =
                                bookmarkedResourceIds &&
                                (bookmarkedResourceIds.includes(String(resourceId)) ||
                                    bookmarkedResourceIds.includes(resourceId));

                            const safeProps = getSafeExternalLinkProps(res.url);
                            const durationLabel = formatDuration(res.estimatedTimeMinutes);
                            const verifiedLabel = formatVerifiedDate(res.lastVerifiedDate);
                            const isObsolete = res.status === "Obsolete" || res.status === "Deprecated";

                            return (
                                <div
                                    key={resourceId || idx}
                                    className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                                        isObsolete
                                            ? "border-red-200 bg-red-50/40 opacity-75"
                                            : "border-gray-200/90 bg-white hover:border-[#6A38C2]/40 hover:shadow-sm"
                                    }`}
                                >
                                    <div>
                                        {/* Header Row: Icon, Title, External Link & Bookmark Button */}
                                        <div className="flex items-start justify-between gap-2">
                                            <a
                                                {...safeProps}
                                                className="flex items-start gap-2.5 min-w-0 flex-1 group/title"
                                                title={`Open '${res.title}' in a new tab`}
                                            >
                                                <span className="mt-0.5 shrink-0 p-1.5 bg-gray-50 rounded-lg border border-gray-100 group-hover/title:border-[#6A38C2]/30 transition-colors">
                                                    {getResourceIcon(res.type)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-900 group-hover/title:text-[#6A38C2] transition-colors line-clamp-1">
                                                            {res.title}
                                                        </p>
                                                        <ExternalLink className="size-3 text-gray-400 group-hover/title:text-[#6A38C2] shrink-0" />
                                                    </div>
                                                    {res.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                            {res.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </a>

                                            {/* Bookmark Toggle Action */}
                                            {onToggleBookmark && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onToggleBookmark(resourceId, res.title);
                                                    }}
                                                    title={
                                                        isBookmarked
                                                            ? "Remove from my bookmarks"
                                                            : "Save resource to my bookmarks"
                                                    }
                                                    aria-label={
                                                        isBookmarked
                                                            ? `Remove ${res.title} from bookmarks`
                                                            : `Bookmark ${res.title}`
                                                    }
                                                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                                        isBookmarked
                                                            ? "bg-purple-50 text-[#6A38C2] hover:bg-purple-100"
                                                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <Bookmark
                                                        className={`size-4 ${
                                                            isBookmarked ? "fill-[#6A38C2] text-[#6A38C2]" : ""
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        {/* Obsolete Warning Banner if marked obsolete */}
                                        {isObsolete && (
                                            <div className="mt-2 py-0.5 px-2 rounded bg-red-100/80 border border-red-200 flex items-center gap-1.5 text-[11px] font-medium text-red-800">
                                                <AlertTriangle className="size-3 text-red-600 shrink-0" />
                                                <span>Marked Obsolete / Content may be outdated</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Badges & Metadata */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                                        {/* Source provenance badge */}
                                        {getSourceBadge(res.sourceType, res.isOfficial, res.provider)}

                                        {/* Category badge */}
                                        {res.category && (
                                            <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                                {res.category}
                                            </span>
                                        )}

                                        {/* Resource type badge */}
                                        <span className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                            {res.type || "Resource"}
                                        </span>

                                        {/* Estimated Duration */}
                                        {durationLabel && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                <Clock className="size-2.5 text-gray-400" />
                                                {durationLabel}
                                            </span>
                                        )}

                                        {/* Free tag */}
                                        {res.isFree && (
                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                Free
                                            </span>
                                        )}

                                        {/* Difficulty */}
                                        {res.difficulty && res.difficulty !== "All Levels" && (
                                            <span className="text-[10px] text-gray-500 ml-auto">
                                                {res.difficulty}
                                            </span>
                                        )}

                                        {/* Verified stamp */}
                                        {verifiedLabel && (
                                            <span
                                                className="inline-flex items-center gap-1 text-[9px] text-gray-400 ml-auto"
                                                title={`Verified up-to-date in ${verifiedLabel}`}
                                            >
                                                <ShieldCheck className="size-3 text-emerald-500" />
                                                {verifiedLabel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Target Practice Problems */}
            {hasProblems && (
                <div className="mt-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                        <Code2 className="size-3.5 text-emerald-600" />
                        Target Practice Problems ({practiceProblems.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {practiceProblems.map((prob, idx) => {
                            const safeProps = getSafeExternalLinkProps(prob.url);
                            const diffColor =
                                prob.difficulty === "Easy"
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : prob.difficulty === "Hard"
                                    ? "text-rose-700 bg-rose-50 border-rose-200"
                                    : "text-amber-700 bg-amber-50 border-amber-200";

                            return (
                                <a
                                    key={prob._id || idx}
                                    {...safeProps}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#6A38C2]/40 hover:shadow-xs transition-all text-xs font-medium text-gray-800 group"
                                >
                                    <span className="group-hover:text-[#6A38C2] truncate max-w-[220px]">
                                        {prob.title}
                                    </span>
                                    <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${diffColor}`}
                                    >
                                        {prob.difficulty || "Medium"}
                                    </span>
                                    {prob.platform && (
                                        <span className="text-[10px] text-gray-400">
                                            {prob.platform}
                                        </span>
                                    )}
                                    <ExternalLink className="size-3 text-gray-400 group-hover:text-[#6A38C2]" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceList;
