import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
    Clock,
    Layers,
    BookOpen,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    ShieldAlert,
} from "lucide-react";

const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
        case "Beginner":
            return (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Beginner Friendly
                </span>
            );
        case "Advanced":
            return (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    Advanced Track
                </span>
            );
        case "Comprehensive":
            return (
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    Comprehensive
                </span>
            );
        case "Intermediate":
        default:
            return (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Intermediate
                </span>
            );
    }
};

const RoadmapCard = ({ roadmap }) => {
    const navigate = useNavigate();

    if (!roadmap) return null;

    const stagesCount = roadmap.stagesCount ?? (roadmap.stages?.length || 0);
    const topicsCount =
        roadmap.topicsCount ??
        (roadmap.stages
            ? roadmap.stages.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
            : 0);

    const progress = roadmap.userProgress;
    const completionPct = progress ? Math.round(progress.completionPercentage || 0) : null;

    const handleViewRoadmap = () => {
        navigate(`/preparation/roadmaps/${roadmap.slug || roadmap._id}`);
    };

    return (
        <div className="group rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-[#6A38C2]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
                {/* Top badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#6A38C2] bg-[#6A38C2]/10 px-2.5 py-0.5 rounded-full">
                            {roadmap.role || "Software Engineer"}
                        </span>
                        {roadmap.hiringTrack && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                {roadmap.hiringTrack}
                            </span>
                        )}
                    </div>
                    {getDifficultyBadge(roadmap.difficulty)}
                </div>

                {/* Title */}
                <h3
                    onClick={handleViewRoadmap}
                    className="text-lg font-bold text-gray-900 group-hover:text-[#6A38C2] cursor-pointer transition-colors line-clamp-2"
                >
                    {roadmap.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {roadmap.description}
                </p>

                {/* Progress bar if user has active progress */}
                {completionPct !== null && (
                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="size-3.5" /> Progress
                            </span>
                            <span>{completionPct}% Completed</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[#6A38C2] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom metadata & CTA */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1 font-medium">
                        <Clock className="size-3.5 text-gray-400" />
                        {roadmap.estimatedDuration || "8-10 Weeks"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                        <Layers className="size-3.5 text-gray-400" />
                        {stagesCount} {stagesCount === 1 ? "Stage" : "Stages"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="size-3.5 text-gray-400" />
                        {topicsCount} {topicsCount === 1 ? "Topic" : "Topics"}
                    </span>
                </div>

                <Button
                    onClick={handleViewRoadmap}
                    className="w-full bg-gray-900 hover:bg-[#6A38C2] text-white font-medium cursor-pointer transition-colors flex items-center justify-center gap-2 group-hover:bg-[#6A38C2]"
                >
                    <span>View Preparation Roadmap</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    );
};

export default RoadmapCard;
