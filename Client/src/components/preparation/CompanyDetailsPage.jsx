import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import RoadmapCard from "./RoadmapCard";
import { Button } from "../ui/button";
import {
    ChevronRight,
    ArrowLeft,
    Building2,
    ExternalLink,
    MapPin,
    Globe,
    CheckCircle,
    Bookmark,
    Layers,
    BookOpen,
    AlertCircle,
    Sparkles,
    Briefcase,
    ShieldAlert,
} from "lucide-react";
import { PREPARATION_API_END_POINT } from "@/utils/constant";
import { getSafeExternalLinkProps } from "./safeLink";

const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const CompanyDetailsPage = () => {
    const { slugOrId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    const [company, setCompany] = useState(null);
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imgError, setImgError] = useState(false);
    const [isTargetLoading, setIsTargetLoading] = useState(false);

    const fetchCompanyDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `${PREPARATION_API_END_POINT}/companies/${slugOrId}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setCompany(res.data.company);
                setRoadmaps(res.data.roadmaps || []);
            } else {
                setError(res.data.message || "Failed to load company details");
            }
        } catch (err) {
            console.error("Failed to load company details:", err);
            setError(
                err.response?.data?.message ||
                    "Company details could not be found or are currently unavailable."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slugOrId) {
            fetchCompanyDetails();
        }
    }, [slugOrId]);

    const handleToggleTarget = async () => {
        if (!user) {
            toast.info("Please log in to bookmark target companies to your dashboard.");
            return;
        }
        if (!company) return;

        try {
            setIsTargetLoading(true);
            const res = await axios.post(
                `${PREPARATION_API_END_POINT}/targets/${company._id}`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setCompany((prev) => ({
                    ...prev,
                    isTargetCompany: res.data.isTargetCompany,
                }));
                toast.success(res.data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update target company status");
        } finally {
            setIsTargetLoading(false);
        }
    };

    const isProduct = company?.category === "Product & Technology";
    const officialCareersProps = getSafeExternalLinkProps(
        company?.officialCareersUrl || company?.careersUrl
    );
    const websiteProps = getSafeExternalLinkProps(company?.website);

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
                    <ChevronRight className="size-3.5 text-gray-400" />
                    <span className="text-gray-900 font-semibold truncate max-w-[200px]">
                        {company?.companyName || "Company Details"}
                    </span>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-[5%] lg:px-[10%] py-8">
                {/* Back button */}
                <button
                    type="button"
                    onClick={() => navigate("/preparation")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-6 cursor-pointer transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to All Companies</span>
                </button>

                {/* Loading Skeleton */}
                {loading && (
                    <div className="space-y-6 animate-pulse">
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-20 rounded-2xl bg-gray-200 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                                </div>
                            </div>
                            <div className="h-4 bg-gray-100 rounded w-full" />
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-56 bg-white border border-gray-200 rounded-2xl" />
                            <div className="h-56 bg-white border border-gray-200 rounded-2xl" />
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto my-12">
                        <AlertCircle className="size-10 text-rose-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-rose-900">Company Not Found</h3>
                        <p className="text-xs text-rose-700 mt-1">{error}</p>
                        <Button
                            onClick={() => navigate("/preparation")}
                            className="mt-5 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                        >
                            Return to Catalog
                        </Button>
                    </div>
                )}

                {/* Loaded Content */}
                {!loading && !error && company && (
                    <div className="space-y-8">
                        {/* Company Hero Profile Header */}
                        <div className="rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 right-0 h-1.5 ${
                                    isProduct ? "bg-purple-600" : "bg-blue-600"
                                }`}
                            />

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-start gap-4 sm:gap-6 min-w-0">
                                    {/* Company Logo */}
                                    <div className="size-20 sm:size-24 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                        {company.logo && !imgError ? (
                                            <img
                                                src={company.logo}
                                                alt={`${company.companyName} logo`}
                                                onError={() => setImgError(true)}
                                                className="size-full object-contain p-2 sm:p-3"
                                            />
                                        ) : (
                                            <div className="size-full flex items-center justify-center bg-gradient-to-br from-[#6A38C2]/10 to-[#6A38C2]/20 text-[#6A38C2] font-extrabold text-2xl">
                                                {getInitials(company.companyName)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Company Details & Badges */}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                                {company.companyName}
                                            </h1>
                                            <CheckCircle
                                                className="size-5 text-blue-500 shrink-0"
                                                title="Verified Enterprise Catalog"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span
                                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                                    isProduct
                                                        ? "text-purple-700 bg-purple-50 border-purple-200"
                                                        : "text-blue-700 bg-blue-50 border-blue-200"
                                                }`}
                                            >
                                                {company.category}
                                            </span>
                                            {company.tier && (
                                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                                    {company.tier}
                                                </span>
                                            )}
                                            {company.location && (
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="size-3.5 text-gray-400" />
                                                    {company.location}
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-3xl">
                                            {company.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons: Target Bookmark & Official Careers */}
                                <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0 pt-2">
                                    <Button
                                        onClick={handleToggleTarget}
                                        disabled={isTargetLoading}
                                        variant="outline"
                                        className={`gap-2 text-xs font-medium cursor-pointer ${
                                            company.isTargetCompany
                                                ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <Bookmark
                                            className={`size-4 ${
                                                company.isTargetCompany
                                                    ? "fill-amber-500 text-amber-500"
                                                    : "text-gray-400"
                                            }`}
                                        />
                                        <span>
                                            {company.isTargetCompany
                                                ? "Target Company Bookmarked"
                                                : "Bookmark as Target"}
                                        </span>
                                    </Button>

                                    {(company.officialCareersUrl || company.careersUrl) && (
                                        <a
                                            {...officialCareersProps}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-[#6A38C2] text-white text-xs font-semibold shadow-xs transition-colors"
                                        >
                                            <span>Official Careers Portal</span>
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    )}

                                    {company.website && (
                                        <a
                                            {...websiteProps}
                                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            <Globe className="size-3.5 text-gray-400" />
                                            <span>Corporate Site</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Hiring Tracks Banner */}
                            {company.hiringTracks && company.hiringTracks.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
                                        <Briefcase className="size-3.5 text-[#6A38C2]" />
                                        Documented Recruitment Tracks
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {company.hiringTracks.map((track, i) => (
                                            <span
                                                key={i}
                                                className="text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg"
                                            >
                                                {track}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Roadmaps Grid Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Layers className="size-5 text-[#6A38C2]" />
                                        Preparation Tracks & Roadmaps ({roadmaps.length})
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Select a preparation track to view the ordered stages, syllabus topics, and recommended study resources.
                                    </p>
                                </div>
                            </div>

                            {roadmaps.length === 0 ? (
                                <div className="p-10 rounded-2xl bg-white border border-gray-200 text-center">
                                    <BookOpen className="size-10 text-gray-300 mx-auto mb-2" />
                                    <h4 className="text-sm font-bold text-gray-800">
                                        No Active Roadmaps Found
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                        Curators are currently assembling structured preparation stages for this company. Check back shortly.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {roadmaps.map((roadmap) => (
                                        <RoadmapCard
                                            key={roadmap._id}
                                            roadmap={roadmap}
                                            companySlug={company.slug}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Indicative Disclaimer Notice Card */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3.5">
                            <ShieldAlert className="size-5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900 leading-relaxed">
                                <p className="font-semibold text-amber-950">
                                    Indicative Preparation Notice:
                                </p>
                                <p className="mt-0.5 text-amber-800">
                                    Recruitment rounds and examination formats may vary based on university placement drives, off-campus initiatives, or hiring cycles. All topics and tracks provided here represent recommended study outlines built from common industry entry-level technical standards, not official or guaranteed exam questions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default CompanyDetailsPage;
