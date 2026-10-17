import React from "react";
import { Link } from "react-router-dom";
import {
    Flame,
    ArrowRight,
    CheckCircle2,
    Clock,
    Layers,
    BookOpen,
    Target,
    Compass,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";

const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const ContinuePreparationCard = ({ continuePreparation, onExploreClick: _onExploreClick }) => {
    if (!continuePreparation) {
        return null;
    }

    const {
        roadmapId,
        roadmapSlug,
        roadmapTitle,
        role,
        hiringTrack,
        difficulty: _difficulty,
        company,
        completionPercentage = 0,
        completedTopicsCount = 0,
        totalTopicsCount = 0,
        nextTopic,
        incompleteTopics = [],
        totalIncompleteTopics = 0,
    } = continuePreparation;

    const roadmapTarget = `/preparation/roadmaps/${roadmapSlug || roadmapId}`;

    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-200/80 bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/50 p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left section: Active Track Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Company Logo or Fallback */}
                    <div className="size-14 sm:size-16 rounded-2xl bg-white border border-purple-100 p-2 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                        {company?.logo ? (
                            <img
                                src={company.logo}
                                alt={company.companyName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="font-bold text-base text-[#6A38C2]">
                                {getInitials(company?.companyName)}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white shadow-2xs">
                                <Flame className="size-3.5 fill-white text-white animate-pulse" />
                                Continue Preparation
                            </span>
                            {company?.companyName && (
                                <span className="text-xs font-semibold text-gray-700 bg-white/80 border border-gray-200 px-2.5 py-0.5 rounded-full">
                                    {company.companyName}
                                </span>
                            )}
                            {hiringTrack && (
                                <span className="text-xs text-gray-500 bg-gray-100/90 px-2 py-0.5 rounded-full">
                                    {hiringTrack}
                                </span>
                            )}
                        </div>

                        <Link
                            to={roadmapTarget}
                            className="group inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-gray-900 hover:text-[#6A38C2] transition-colors"
                        >
                            <span className="line-clamp-1">{roadmapTitle}</span>
                            <ArrowRight className="size-4 text-gray-400 group-hover:text-[#6A38C2] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>

                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                            Targeting <span className="font-semibold text-gray-900">{role || "Software Engineer"}</span>
                            {" "}• {completedTopicsCount} of {totalTopicsCount} topics completed ({completionPercentage}%)
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-2.5 flex items-center gap-3 max-w-md">
                            <div className="flex-1 bg-gray-200/90 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#6A38C2] to-indigo-600 transition-all duration-700"
                                    style={{ width: `${Math.min(100, Math.max(5, completionPercentage))}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#6A38C2]">
                                {completionPercentage}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right section: Next Up Topic & Primary CTA */}
                <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-purple-100">
                    {nextTopic && (
                        <div className="p-3 bg-white/90 rounded-xl border border-purple-100 sm:max-w-xs shadow-2xs">
                            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-purple-700 mb-0.5">
                                <Sparkles className="size-3 text-purple-600" />
                                <span>Next Up to Master</span>
                            </div>
                            <p className="text-xs font-bold text-gray-900 line-clamp-1" title={nextTopic.title}>
                                {nextTopic.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                {nextTopic.stageTitle && (
                                    <span className="truncate">{nextTopic.stageTitle}</span>
                                )}
                                {nextTopic.difficulty && (
                                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                                        {nextTopic.difficulty}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <Link to={roadmapTarget}>
                        <Button className="w-full sm:w-auto bg-[#6A38C2] hover:bg-[#592ea6] text-white font-semibold shadow-sm h-11 px-5 flex items-center justify-center gap-2">
                            <span>Resume Track</span>
                            <ChevronRight className="size-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Upcoming incomplete topics preview pills */}
            {incompleteTopics && incompleteTopics.length > 1 && (
                <div className="mt-4 pt-3 border-t border-purple-100/80 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Layers className="size-3.5 text-purple-500" />
                        Remaining topics preview:
                    </span>
                    {incompleteTopics.slice(0, 4).map((t, idx) => (
                        <Link
                            key={t.topicId || idx}
                            to={roadmapTarget}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200/80 text-gray-700 hover:border-[#6A38C2] hover:text-[#6A38C2] transition-colors"
                        >
                            <span className="size-1.5 rounded-full bg-purple-500" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{t.title}</span>
                            {t.difficulty && (
                                <span className="text-[10px] text-gray-400 font-mono">({t.difficulty})</span>
                            )}
                        </Link>
                    ))}
                    {totalIncompleteTopics > 4 && (
                        <Link
                            to={roadmapTarget}
                            className="text-xs font-semibold text-[#6A38C2] hover:underline ml-1"
                        >
                            +{totalIncompleteTopics - 4} more
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContinuePreparationCard;
