import React, { useState } from "react";
import { Badge } from "../ui/badge";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle2,
    Circle,
    Layers,
    AlertCircle,
    Sparkles,
    Loader2,
} from "lucide-react";
import ResourceList from "./ResourceList";
import TopicNotesEditor from "./TopicNotesEditor";

const getImportanceBadge = (importance) => {
    switch (importance) {
        case "Core / Must Know":
            return (
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Core / Must Know
                </span>
            );
        case "High Frequency":
            return (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    High Frequency
                </span>
            );
        case "Advanced / Bonus":
            return (
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                    Advanced
                </span>
            );
        default:
            return null;
    }
};

const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
        case "Easy":
            return (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Easy
                </span>
            );
        case "Hard":
            return (
                <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    Hard
                </span>
            );
        case "Medium":
        default:
            return (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Medium
                </span>
            );
    }
};

const RoadmapStage = ({
    stage,
    stageNumber,
    completedTopicIds = [],
    onToggleTopic,
    updatingTopicId,
    isAuthenticated,
    bookmarkedResourceIds = [],
    onToggleBookmark,
    topicNotes = {},
    onSaveTopicNote,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const topics = stage.topics || [];
    const completedCountInStage = topics.filter((t) =>
        completedTopicIds.includes(t.topicId)
    ).length;

    const isStageFullyComplete =
        topics.length > 0 && completedCountInStage === topics.length;

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-gray-300">
            {/* Stage Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-gray-50/80 to-white hover:from-purple-50/40 hover:to-white transition-colors"
            >
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div
                        className={`size-9 sm:size-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                            isStageFullyComplete
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-[#6A38C2]/10 text-[#6A38C2] border border-[#6A38C2]/20"
                        }`}
                    >
                        {isStageFullyComplete ? (
                            <CheckCircle2 className="size-5" />
                        ) : (
                            <span>{stageNumber}</span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#6A38C2]">
                                Stage {stageNumber}
                            </span>
                            {stage.estimatedWeeks && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                    <Clock className="size-3 text-gray-400" />
                                    {stage.estimatedWeeks} {stage.estimatedWeeks === 1 ? "Week" : "Weeks"}
                                </span>
                            )}
                            {topics.length > 0 && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    isStageFullyComplete
                                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                        : completedCountInStage > 0
                                        ? "text-purple-700 bg-purple-50 border border-purple-200"
                                        : "text-gray-500 bg-gray-100"
                                }`}>
                                    {completedCountInStage}/{topics.length} topics completed ({topics.length > 0 ? Math.round((completedCountInStage / topics.length) * 100) : 0}%)
                                </span>
                            )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
                            {stage.title}
                        </h3>

                        {stage.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                                {stage.description}
                            </p>
                        )}

                        {/* Stage progress mini bar */}
                        {topics.length > 0 && (
                            <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isStageFullyComplete ? "bg-emerald-600" : "bg-[#6A38C2]"
                                    }`}
                                    style={{
                                        width: `${Math.round((completedCountInStage / topics.length) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                        type="button"
                        aria-label={isExpanded ? "Collapse stage" : "Expand stage"}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="size-5" />
                        ) : (
                            <ChevronDown className="size-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Topics Body */}
            {isExpanded && (
                <div className="divide-y divide-gray-100 p-3 sm:p-5 bg-white space-y-4">
                    {topics.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                            No topics listed for this stage yet.
                        </div>
                    ) : (
                        topics.map((topic, index) => {
                            const isCompleted = completedTopicIds.includes(topic.topicId);
                            const isUpdating = updatingTopicId === topic.topicId;
                            const topicNote =
                                topic.userNote ||
                                topicNotes[topic.topicId] ||
                                "";

                            return (
                                <div
                                    key={topic.topicId || index}
                                    className={`pt-4 first:pt-0 pb-4 last:pb-0 transition-colors rounded-lg p-3 ${
                                        isCompleted
                                            ? "bg-emerald-50/40 border border-emerald-100"
                                            : "hover:bg-gray-50/60"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            {/* Completion Checkbox */}
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => {
                                                    if (onToggleTopic) {
                                                        onToggleTopic(topic.topicId, !isCompleted);
                                                    }
                                                }}
                                                title={
                                                    isAuthenticated
                                                        ? isCompleted
                                                            ? "Mark incomplete"
                                                            : "Mark topic completed"
                                                        : "Log in to track your completion progress"
                                                }
                                                className={`mt-0.5 shrink-0 rounded-full transition-all focus:outline-hidden ${
                                                    isCompleted
                                                        ? "text-emerald-600 hover:text-emerald-700"
                                                        : "text-gray-300 hover:text-gray-500"
                                                }`}
                                            >
                                                {isUpdating ? (
                                                    <Loader2 className="size-5 animate-spin text-[#6A38C2]" />
                                                ) : isCompleted ? (
                                                    <CheckCircle2 className="size-5 fill-emerald-100 text-emerald-600" />
                                                ) : (
                                                    <Circle className="size-5" />
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <span className="text-xs font-mono font-medium text-gray-400">
                                                        #{index + 1}
                                                    </span>
                                                    <h4
                                                        className={`text-sm sm:text-base font-semibold ${
                                                            isCompleted
                                                                ? "line-through text-gray-500"
                                                                : "text-gray-900"
                                                        }`}
                                                    >
                                                        {topic.title}
                                                    </h4>
                                                    {getImportanceBadge(topic.importance)}
                                                    {getDifficultyBadge(topic.difficulty)}
                                                    {topic.estimatedHours && (
                                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                                            ~{topic.estimatedHours}h prep
                                                        </span>
                                                    )}
                                                </div>

                                                {topic.description && (
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                                                        {topic.description}
                                                    </p>
                                                )}

                                                {/* Personal Topic Note */}
                                                <TopicNotesEditor
                                                    topicId={topic.topicId}
                                                    initialNote={topicNote}
                                                    onSaveNote={onSaveTopicNote}
                                                    isAuthenticated={isAuthenticated}
                                                />

                                                {/* Resources & Problems */}
                                                <ResourceList
                                                    resources={topic.resources}
                                                    practiceProblems={topic.practiceProblems}
                                                    bookmarkedResourceIds={bookmarkedResourceIds}
                                                    onToggleBookmark={onToggleBookmark}
                                                    isAuthenticated={isAuthenticated}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default RoadmapStage;
