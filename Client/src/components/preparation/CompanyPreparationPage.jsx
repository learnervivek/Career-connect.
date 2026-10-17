import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import CompanyCard from "./CompanyCard";
import ContinuePreparationCard from "./ContinuePreparationCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Search,
    Building2,
    Layers,
    Sparkles,
    RefreshCw,
    X,
    Briefcase,
    BookOpen,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { PREPARATION_API_END_POINT } from "@/utils/constant";

const CATEGORIES = [
    "All",
    "IT Services & Consulting",
    "Product & Technology",
];

const CompanyPreparationPage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    const [companies, setCompanies] = useState([]);
    const [continuePreparation, setContinuePreparation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [targetLoadingId, setTargetLoadingId] = useState(null);

    const fetchCompanies = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append("search", searchQuery.trim());
            if (selectedCategory && selectedCategory !== "All") {
                params.append("category", selectedCategory);
            }

            const res = await axios.get(
                `${PREPARATION_API_END_POINT}/companies?${params.toString()}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setCompanies(res.data.companies || []);
            } else {
                setError(res.data.message || "Failed to load preparation companies");
            }
        } catch (err) {
            console.error("Failed to load preparation companies:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to connect to the preparation hub server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchContinuePreparation = async () => {
        if (!user) {
            setContinuePreparation(null);
            return;
        }
        try {
            const res = await axios.get(`${PREPARATION_API_END_POINT}/continue`, {
                withCredentials: true,
            });
            if (res.data.success && res.data.hasActivePreparation) {
                setContinuePreparation(res.data.continuePreparation);
            } else {
                setContinuePreparation(null);
            }
        } catch {
            setContinuePreparation(null);
        }
    };

    useEffect(() => {
        if (user) {
            fetchContinuePreparation();
        } else {
            setContinuePreparation(null);
        }
    }, [user]);

    // Refetch when search query or category changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCompanies();
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory]);

    const handleToggleTarget = async (companyId) => {
        if (!user) {
            toast.info("Please log in to bookmark target companies to your dashboard.");
            return;
        }

        try {
            setTargetLoadingId(companyId);
            const res = await axios.post(
                `${PREPARATION_API_END_POINT}/targets/${companyId}`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setCompanies((prev) =>
                    prev.map((c) =>
                        c._id === companyId ? { ...c, isTargetCompany: res.data.isTargetCompany } : c
                    )
                );
                toast.success(res.data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update target company status");
        } finally {
            setTargetLoadingId(null);
        }
    };

    // Category counts summary
    const _categoryCounts = useMemo(() => {
        const itCount = companies.filter((c) => c.category === "IT Services & Consulting").length;
        const prodCount = companies.filter((c) => c.category === "Product & Technology").length;
        return {
            All: companies.length,
            "IT Services & Consulting": itCount,
            "Product & Technology": prodCount,
        };
    }, [companies]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-purple-50/70 via-white to-gray-50/50 border-b border-gray-200/80 pt-10 pb-12 px-4 sm:px-[5%] lg:px-[10%]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6A38C2]/10 border border-[#6A38C2]/20 text-[#6A38C2] text-xs font-semibold mb-4">
                        <Sparkles className="size-3.5" />
                        <span>Company Preparation Hub</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Master Your Next{" "}
                        <span className="text-[#6A38C2]">Tech & Consulting</span> Interview
                    </h1>

                    <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Explore structured, role-specific roadmaps, topic-by-topic breakdowns,
                        curated free learning resources, and entry-level hiring tracks for leading enterprises.
                    </p>

                    {/* Stats Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 max-w-2xl mx-auto">
                        <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <p className="text-2xl sm:text-3xl font-extrabold text-[#6A38C2]">15</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Top Enterprises</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <p className="text-2xl sm:text-3xl font-extrabold text-[#6A38C2]">17+</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Role Roadmaps</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <p className="text-2xl sm:text-3xl font-extrabold text-[#6A38C2]">50+</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Technical Topics</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
                            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Free Resources</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="max-w-3xl mx-auto mt-8 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by company name, technology, or hiring track (e.g. TCS NQT, Google, Qualcomm)..."
                            className="pl-10 pr-10 py-6 bg-white border-gray-200 shadow-sm rounded-xl text-sm focus-visible:ring-[#6A38C2]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-[#6A38C2] text-white shadow-sm"
                                            : "bg-white text-gray-700 border border-gray-200 hover:border-[#6A38C2]/40 hover:bg-purple-50/30"
                                    }`}
                                >
                                    {cat === "All" ? "All Companies" : cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-[5%] lg:px-[10%] py-10 space-y-8">
                {/* Continue Preparation Card if candidate has active track */}
                {continuePreparation && (
                    <div className="mb-2">
                        <ContinuePreparationCard continuePreparation={continuePreparation} />
                    </div>
                )}

                {/* Result header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Available Companies{" "}
                            {!loading && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({companies.length})
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Select a company to view available entry-level roles and preparation stages
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {user && (
                            <Button
                                onClick={() => navigate("/preparation/dashboard")}
                                className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs font-semibold gap-1.5 h-8 cursor-pointer shadow-xs"
                            >
                                <Sparkles className="size-3.5" />
                                <span>My Preparation</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchCompanies}
                            disabled={loading}
                            className="text-xs gap-1.5 h-8 cursor-pointer"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </Button>
                    </div>
                </div>

                {/* Error State */}
                {error && !loading && (
                    <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto my-12">
                        <AlertCircle className="size-8 text-rose-600 mx-auto mb-2" />
                        <h3 className="text-base font-bold text-rose-900">Unable to Load Catalog</h3>
                        <p className="text-xs text-rose-700 mt-1">{error}</p>
                        <Button
                            onClick={fetchCompanies}
                            className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Loading Skeletons */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div
                                key={n}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs animate-pulse space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-14 rounded-xl bg-gray-200 shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                                </div>
                                <div className="h-8 bg-gray-100 rounded-lg w-full mt-4" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && companies.length === 0 && (
                    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs max-w-lg mx-auto">
                        <Building2 className="size-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900">No Companies Found</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                            No companies matched your search query "{searchQuery}" in{" "}
                            {selectedCategory === "All" ? "all categories" : selectedCategory}.
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("All");
                            }}
                            className="mt-5 bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs cursor-pointer"
                        >
                            Reset All Filters
                        </Button>
                    </div>
                )}

                {/* Companies Grid */}
                {!loading && !error && companies.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <CompanyCard
                                key={company._id}
                                company={company}
                                onToggleTarget={handleToggleTarget}
                                isTargetLoading={targetLoadingId === company._id}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default CompanyPreparationPage;
