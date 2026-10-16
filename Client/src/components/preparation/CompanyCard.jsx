import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
    Building2,
    ArrowRight,
    CheckCircle,
    Layers,
    Bookmark,
    Sparkles,
    Briefcase,
} from "lucide-react";

const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const CompanyCard = ({ company, onToggleTarget, isTargetLoading = false }) => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    if (!company) return null;

    const roadmapsCount = company.roadmapsCount ?? (company.roadmaps?.length || 0);
    const hiringTracks = company.hiringTracks || [];

    const isProduct = company.category === "Product & Technology";

    const handleExplore = () => {
        navigate(`/preparation/companies/${company.slug || company._id}`);
    };

    return (
        <div className="group rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs hover:shadow-lg hover:border-[#6A38C2]/40 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle category accent stripe at top */}
            <div
                className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    isProduct ? "bg-purple-500" : "bg-blue-500"
                }`}
            />

            <div>
                {/* Header: Logo, Name, Target Bookmark */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        {/* Company Logo / Fallback */}
                        <div className="size-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:border-[#6A38C2]/30 transition-colors">
                            {company.logo && !imgError ? (
                                <img
                                    src={company.logo}
                                    alt={`${company.companyName} logo`}
                                    onError={() => setImgError(true)}
                                    className="size-full object-contain p-2"
                                />
                            ) : (
                                <div className="size-full flex items-center justify-center bg-gradient-to-br from-[#6A38C2]/10 to-[#6A38C2]/20 text-[#6A38C2] font-bold text-lg">
                                    {getInitials(company.companyName)}
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3
                                    onClick={handleExplore}
                                    className="text-lg font-bold text-gray-900 group-hover:text-[#6A38C2] cursor-pointer transition-colors truncate"
                                    title={company.companyName}
                                >
                                    {company.companyName}
                                </h3>
                                <CheckCircle className="size-4 text-blue-500 shrink-0" title="Verified MNC Profile" />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                        isProduct
                                            ? "text-purple-700 bg-purple-50 border-purple-200"
                                            : "text-blue-700 bg-blue-50 border-blue-200"
                                    }`}
                                >
                                    {company.category}
                                </span>
                                {company.tier && (
                                    <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {company.tier}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bookmark Target Company button */}
                    {onToggleTarget && (
                        <button
                            type="button"
                            disabled={isTargetLoading}
                            onClick={() => onToggleTarget(company._id)}
                            title={
                                company.isTargetCompany
                                    ? "Remove from target companies"
                                    : "Add to target companies"
                            }
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                                company.isTargetCompany
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <Bookmark
                                className={`size-4.5 ${
                                    company.isTargetCompany ? "fill-amber-500 text-amber-500" : ""
                                }`}
                            />
                        </button>
                    )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {company.description ||
                        "Explore specialized entry-level technical preparation tracks, curated topics, and interview roadmaps."}
                </p>

                {/* Hiring tracks tags */}
                {hiringTracks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Hiring Tracks
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {hiringTracks.slice(0, 3).map((track, i) => (
                                <span
                                    key={i}
                                    className="text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-md"
                                >
                                    {track}
                                </span>
                            ))}
                            {hiringTracks.length > 3 && (
                                <span className="text-[11px] text-gray-400 font-medium px-1 py-0.5">
                                    +{hiringTracks.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Tracks Count & Explore Button */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <Layers className="size-4 text-[#6A38C2]" />
                    <span>
                        {roadmapsCount} {roadmapsCount === 1 ? "Track Available" : "Tracks Available"}
                    </span>
                </div>

                <Button
                    onClick={handleExplore}
                    variant="outline"
                    className="border-gray-200 text-gray-800 hover:border-[#6A38C2] hover:bg-[#6A38C2] hover:text-white transition-all cursor-pointer text-xs font-medium px-3.5 py-1.5 h-8 gap-1.5 group-hover:border-[#6A38C2]"
                >
                    <span>View Roadmaps</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
            </div>
        </div>
    );
};

export default CompanyCard;
