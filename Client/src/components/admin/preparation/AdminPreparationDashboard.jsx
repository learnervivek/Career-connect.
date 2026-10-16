import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "../../shared/Navbar";
import Footer from "../../shared/Footer";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import {
    Building2,
    Layers,
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    Archive,
    RotateCcw,
    ExternalLink,
    Search,
    Filter,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Sparkles,
    Eye,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";
import { ADMIN_PREPARATION_API_END_POINT } from "@/utils/constant";
import AdminCompanyModal from "./AdminCompanyModal";
import AdminRoadmapModal from "./AdminRoadmapModal";
import AdminResourceModal from "./AdminResourceModal";
import ArchiveWarningModal from "./ArchiveWarningModal";

const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const AdminPreparationDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    const [activeTab, setActiveTab] = useState("companies"); // 'companies', 'roadmaps', 'resources'

    // Data States
    const [companies, setCompanies] = useState([]);
    const [roadmaps, setRoadmaps] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and Filter States
    const [companySearch, setCompanySearch] = useState("");
    const [companyCategoryFilter, setCompanyCategoryFilter] = useState("All");
    const [companyStatusFilter, setCompanyStatusFilter] = useState("all"); // 'all', 'active', 'archived'

    const [roadmapSearch, setRoadmapSearch] = useState("");
    const [roadmapCompanyFilter, setRoadmapCompanyFilter] = useState("All");
    const [roadmapStatusFilter, setRoadmapStatusFilter] = useState("All"); // 'All', 'Published', 'Draft', 'Archived'

    // Resource Filter States
    const [resourceSearch, setResourceSearch] = useState("");
    const [resourceCategoryFilter, setResourceCategoryFilter] = useState("All");
    const [resourceStatusFilter, setResourceStatusFilter] = useState("All");

    // Modal States
    const [companyModalOpen, setCompanyModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
    const [selectedRoadmap, setSelectedRoadmap] = useState(null);
    const [preselectedCompanyId, setPreselectedCompanyId] = useState(null);

    const [resourceModalOpen, setResourceModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);

    const [archiveWarningOpen, setArchiveWarningOpen] = useState(false);
    const [companyToArchive, setCompanyToArchive] = useState(null);
    const [activeRoadmapsForWarning, setActiveRoadmapsForWarning] = useState([]);
    const [archivingLoading, setArchivingLoading] = useState(false);

    // Fetch initial data
    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${ADMIN_PREPARATION_API_END_POINT}/companies`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setCompanies(res.data.companies || []);
            }
        } catch (err) {
            console.error("Failed to fetch admin companies:", err);
            setError(err.response?.data?.message || "Failed to load companies");
        }
    };

    const fetchRoadmaps = async () => {
        try {
            const res = await axios.get(`${ADMIN_PREPARATION_API_END_POINT}/roadmaps`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setRoadmaps(res.data.roadmaps || []);
            }
        } catch (err) {
            console.error("Failed to fetch admin roadmaps:", err);
        }
    };

    const fetchResources = async () => {
        try {
            const res = await axios.get(`${ADMIN_PREPARATION_API_END_POINT}/resources`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setResources(res.data.resources || []);
            }
        } catch (err) {
            console.error("Failed to fetch admin resources:", err);
        }
    };

    const fetchAll = async () => {
        setLoading(true);
        setError("");
        await Promise.all([fetchCompanies(), fetchRoadmaps(), fetchResources()]);
        setLoading(false);
    };

    useEffect(() => {
        if (!user || user.role === "student") {
            navigate("/");
            return;
        }
        fetchAll();
    }, [user]);

    // Handle Company Archive Click (Checks for active roadmaps warning)
    const handleArchiveClick = async (company) => {
        try {
            const res = await axios.get(
                `${ADMIN_PREPARATION_API_END_POINT}/companies/${company._id}/check-archive`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setCompanyToArchive(company);
                setActiveRoadmapsForWarning(res.data.roadmaps || []);
                setArchiveWarningOpen(true);
            }
        } catch (err) {
            toast.error("Failed to verify active roadmaps for company");
        }
    };

    // Confirm Archive Company
    const handleConfirmArchive = async () => {
        if (!companyToArchive) return;
        try {
            setArchivingLoading(true);
            const res = await axios.patch(
                `${ADMIN_PREPARATION_API_END_POINT}/companies/${companyToArchive._id}/status`,
                { isPreparationHubActive: false },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                setCompanies((prev) =>
                    prev.map((c) =>
                        c._id === companyToArchive._id ? { ...c, isPreparationHubActive: false } : c
                    )
                );
                setArchiveWarningOpen(false);
                setCompanyToArchive(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to archive company");
        } finally {
            setArchivingLoading(false);
        }
    };

    // Restore Company
    const handleRestoreCompany = async (company) => {
        try {
            const res = await axios.patch(
                `${ADMIN_PREPARATION_API_END_POINT}/companies/${company._id}/status`,
                { isPreparationHubActive: true },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                setCompanies((prev) =>
                    prev.map((c) =>
                        c._id === company._id ? { ...c, isPreparationHubActive: true } : c
                    )
                );
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to restore company");
        }
    };

    // Quick toggle roadmap status (Published, Draft, Archived)
    const handleToggleRoadmapStatus = async (roadmapId, newStatus) => {
        try {
            const res = await axios.patch(
                `${ADMIN_PREPARATION_API_END_POINT}/roadmaps/${roadmapId}/status`,
                { publicationStatus: newStatus },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                setRoadmaps((prev) =>
                    prev.map((r) =>
                        r._id === roadmapId ? { ...r, publicationStatus: newStatus } : r
                    )
                );
                fetchCompanies(); // update counts
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update publication status");
        }
    };

    // Filtered Companies
    const filteredCompanies = useMemo(() => {
        return companies.filter((c) => {
            if (companyStatusFilter === "active" && !c.isPreparationHubActive) return false;
            if (companyStatusFilter === "archived" && c.isPreparationHubActive) return false;
            if (companyCategoryFilter !== "All" && c.category !== companyCategoryFilter) return false;
            if (companySearch.trim()) {
                const q = companySearch.toLowerCase();
                const matchName = c.companyName?.toLowerCase().includes(q);
                const matchSlug = c.slug?.toLowerCase().includes(q);
                const matchTrack = c.hiringTracks?.some((t) => t.toLowerCase().includes(q));
                if (!matchName && !matchSlug && !matchTrack) return false;
            }
            return true;
        });
    }, [companies, companySearch, companyCategoryFilter, companyStatusFilter]);

    // Filtered Roadmaps
    const filteredRoadmaps = useMemo(() => {
        return roadmaps.filter((r) => {
            if (roadmapCompanyFilter !== "All" && r.company?._id !== roadmapCompanyFilter) return false;
            if (roadmapStatusFilter !== "All" && r.publicationStatus !== roadmapStatusFilter) return false;
            if (roadmapSearch.trim()) {
                const q = roadmapSearch.toLowerCase();
                const matchTitle = r.title?.toLowerCase().includes(q);
                const matchRole = r.role?.toLowerCase().includes(q);
                const matchTrack = r.hiringTrack?.toLowerCase().includes(q);
                if (!matchTitle && !matchRole && !matchTrack) return false;
            }
            return true;
        });
    }, [roadmaps, roadmapSearch, roadmapCompanyFilter, roadmapStatusFilter]);

    // Filtered Resources
    const filteredResources = useMemo(() => {
        return resources.filter((res) => {
            if (resourceStatusFilter !== "All" && res.status !== resourceStatusFilter) return false;
            if (resourceCategoryFilter !== "All" && res.category !== resourceCategoryFilter) return false;
            if (resourceSearch.trim()) {
                const q = resourceSearch.toLowerCase();
                const matchTitle = res.title?.toLowerCase().includes(q);
                const matchDesc = res.description?.toLowerCase().includes(q);
                const matchProvider = res.provider?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchProvider) return false;
            }
            return true;
        });
    }, [resources, resourceSearch, resourceCategoryFilter, resourceStatusFilter]);

    const handleToggleResourceStatus = async (resourceId, status) => {
        try {
            const res = await axios.patch(
                `${ADMIN_PREPARATION_API_END_POINT}/resources/${resourceId}/status`,
                { status },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchResources();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update resource status");
        }
    };

    const handleVerifyResource = async (resourceId) => {
        try {
            const res = await axios.patch(
                `${ADMIN_PREPARATION_API_END_POINT}/resources/${resourceId}/verify`,
                {},
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message || "Resource verified and refreshed!");
                fetchResources();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to verify resource");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            {/* Admin Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-[5%] lg:px-[10%] pt-8 pb-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6A38C2] border border-purple-200 text-xs font-bold mb-2">
                            <Sparkles className="size-3.5" />
                            <span>Administrator Control Panel</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Company Preparation Hub Management
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Add and administer enterprise profiles, multi-stage preparation roadmaps, and verified learning resources.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchAll}
                            disabled={loading}
                            className="gap-1.5 text-xs h-9 cursor-pointer"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span>Sync</span>
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedCompany(null);
                                setCompanyModalOpen(true);
                            }}
                            className="bg-gray-900 hover:bg-[#6A38C2] text-white text-xs font-semibold gap-1.5 h-9 cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Add Company</span>
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedRoadmap(null);
                                setPreselectedCompanyId(null);
                                setRoadmapModalOpen(true);
                            }}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs font-semibold gap-1.5 h-9 cursor-pointer shadow-xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Create Roadmap</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setResourceModalOpen(true)}
                            className="text-xs font-semibold gap-1.5 h-9 cursor-pointer"
                        >
                            <BookOpen className="size-3.5 text-blue-600" />
                            <span>Add Resource</span>
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="max-w-7xl mx-auto flex items-center gap-6 mt-8 border-t border-gray-100 pt-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab("companies")}
                        className={`pb-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === "companies"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Building2 className="size-4" />
                        <span>Companies ({companies.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("roadmaps")}
                        className={`pb-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === "roadmaps"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Layers className="size-4" />
                        <span>Preparation Roadmaps ({roadmaps.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("resources")}
                        className={`pb-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === "resources"
                                ? "border-[#6A38C2] text-[#6A38C2]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <BookOpen className="size-4" />
                        <span>Learning Resources ({resources.length})</span>
                    </button>
                </div>
            </div>

            {/* Main Admin Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-[5%] lg:px-[10%] py-8">
                {/* Error Banner */}
                {error && !loading && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={fetchAll} className="h-7 text-xs">
                            Retry
                        </Button>
                    </div>
                )}

                {/* TAB 1: COMPANIES */}
                {activeTab === "companies" && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                <Input
                                    value={companySearch}
                                    onChange={(e) => setCompanySearch(e.target.value)}
                                    placeholder="Search companies by name, track, or slug..."
                                    className="pl-9 text-xs h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={companyCategoryFilter}
                                    onChange={(e) => setCompanyCategoryFilter(e.target.value)}
                                    className="text-xs h-9 px-3 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                                >
                                    <option value="All">All Categories</option>
                                    <option value="IT Services & Consulting">IT Services & Consulting</option>
                                    <option value="Product & Technology">Product & Technology</option>
                                </select>

                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                    {["all", "active", "archived"].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setCompanyStatusFilter(st)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                                                companyStatusFilter === st
                                                    ? "bg-white text-gray-900 shadow-2xs"
                                                    : "text-gray-500 hover:text-gray-900"
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Companies Table */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead className="w-14">Logo</TableHead>
                                        <TableHead>Company & Slug</TableHead>
                                        <TableHead>Category & Tier</TableHead>
                                        <TableHead className="text-center">Roadmaps</TableHead>
                                        <TableHead>Careers Portal</TableHead>
                                        <TableHead className="text-center">Catalog Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-400">
                                                Loading company records...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredCompanies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-500">
                                                No companies match your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCompanies.map((c) => {
                                            const stats = c.stats || { totalRoadmaps: 0, publishedRoadmaps: 0 };
                                            const isActive = c.isPreparationHubActive;

                                            return (
                                                <TableRow key={c._id} className="hover:bg-gray-50/50">
                                                    <TableCell>
                                                        <div className="size-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                            {c.logo ? (
                                                                <img
                                                                    src={c.logo}
                                                                    alt=""
                                                                    className="size-full object-contain p-1"
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-[#6A38C2]">
                                                                    {getInitials(c.companyName)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            {c.companyName}
                                                        </p>
                                                        <p className="text-xs font-mono text-gray-400 mt-0.5">
                                                            /{c.slug}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span
                                                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                                                c.category === "Product & Technology"
                                                                    ? "text-purple-700 bg-purple-50 border-purple-200"
                                                                    : "text-blue-700 bg-blue-50 border-blue-200"
                                                            }`}
                                                        >
                                                            {c.category}
                                                        </span>
                                                        {c.tier && (
                                                            <span className="text-[11px] text-gray-500 block mt-1">
                                                                {c.tier}
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="text-xs font-bold text-gray-900">
                                                            {stats.totalRoadmaps}
                                                        </span>
                                                        {stats.publishedRoadmaps > 0 && (
                                                            <span className="text-[11px] text-emerald-600 block">
                                                                {stats.publishedRoadmaps} published
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.officialCareersUrl || c.careersUrl ? (
                                                            <a
                                                                href={c.officialCareersUrl || c.careersUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-[#6A38C2] hover:underline flex items-center gap-1 max-w-[180px] truncate"
                                                            >
                                                                <span className="truncate">Careers Site</span>
                                                                <ExternalLink className="size-3 shrink-0" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">None</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span
                                                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                                                isActive
                                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                                    : "text-rose-700 bg-rose-50 border-rose-200"
                                                            }`}
                                                        >
                                                            {isActive ? "Active" : "Archived"}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedRoadmap(null);
                                                                    setPreselectedCompanyId(c._id);
                                                                    setRoadmapModalOpen(true);
                                                                }}
                                                                className="text-xs h-8 gap-1 cursor-pointer text-[#6A38C2] hover:bg-purple-50"
                                                                title="Create Roadmap for this company"
                                                            >
                                                                <Plus className="size-3" />
                                                                <span className="hidden sm:inline">Track</span>
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedCompany(c);
                                                                    setCompanyModalOpen(true);
                                                                }}
                                                                className="text-xs h-8 gap-1 cursor-pointer"
                                                                title="Edit Company Profile"
                                                            >
                                                                <Edit2 className="size-3" />
                                                                <span>Edit</span>
                                                            </Button>

                                                            {isActive ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleArchiveClick(c)}
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                    title="Archive Company (Hides from catalog)"
                                                                >
                                                                    <Archive className="size-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRestoreCompany(c)}
                                                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                                    title="Restore to Public Catalog"
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* TAB 2: ROADMAPS */}
                {activeTab === "roadmaps" && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                <Input
                                    value={roadmapSearch}
                                    onChange={(e) => setRoadmapSearch(e.target.value)}
                                    placeholder="Search roadmaps by title, role, or hiring track..."
                                    className="pl-9 text-xs h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={roadmapCompanyFilter}
                                    onChange={(e) => setRoadmapCompanyFilter(e.target.value)}
                                    className="text-xs h-9 px-3 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                                >
                                    <option value="All">All Companies</option>
                                    {companies.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.companyName}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                    {["All", "Published", "Draft", "Archived"].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setRoadmapStatusFilter(st)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                                roadmapStatusFilter === st
                                                    ? "bg-white text-gray-900 shadow-2xs"
                                                    : "text-gray-500 hover:text-gray-900"
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Roadmaps Table */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Roadmap Title & Role</TableHead>
                                        <TableHead className="text-center">Stages & Topics</TableHead>
                                        <TableHead>Duration & Diff</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-400">
                                                Loading roadmaps...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRoadmaps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-500">
                                                No roadmaps match your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRoadmaps.map((r) => {
                                            const comp = r.company;
                                            const status = r.publicationStatus || "Draft";

                                            return (
                                                <TableRow key={r._id} className="hover:bg-gray-50/50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-8 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {comp?.logo ? (
                                                                    <img src={comp.logo} alt="" className="size-full object-contain p-0.5" />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-[#6A38C2]">
                                                                        {getInitials(comp?.companyName)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="font-semibold text-xs text-gray-900 truncate max-w-[120px]">
                                                                {comp?.companyName}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <p className="font-bold text-gray-900 text-sm max-w-sm truncate">
                                                            {r.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-[#6A38C2] font-semibold">
                                                                {r.role}
                                                            </span>
                                                            {r.hiringTrack && (
                                                                <span className="text-[11px] text-gray-500">
                                                                    • {r.hiringTrack}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="text-xs font-bold text-gray-900">
                                                            {r.stagesCount} stages
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 block">
                                                            {r.topicsCount} topics
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="text-xs text-gray-700 block font-medium">
                                                            {r.estimatedDuration}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400">
                                                            {r.difficulty}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <select
                                                            value={status}
                                                            onChange={(e) =>
                                                                handleToggleRoadmapStatus(r._id, e.target.value)
                                                            }
                                                            className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-hidden ${
                                                                status === "Published"
                                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                                    : status === "Draft"
                                                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                                                    : "text-gray-600 bg-gray-100 border-gray-200"
                                                            }`}
                                                        >
                                                            <option value="Published">Published</option>
                                                            <option value="Draft">Draft</option>
                                                            <option value="Archived">Archived</option>
                                                        </select>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="text-xs font-mono text-gray-600">
                                                            v{r.version || 1}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedRoadmap(r);
                                                                    setRoadmapModalOpen(true);
                                                                }}
                                                                className="text-xs h-8 gap-1 cursor-pointer"
                                                            >
                                                                <Edit2 className="size-3" />
                                                                <span>Edit Stages</span>
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    navigate(`/preparation/roadmaps/${r.slug || r._id}`)
                                                                }
                                                                className="text-xs h-8 text-gray-500 hover:text-gray-900 cursor-pointer"
                                                                title="View Candidate Page"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* TAB 3: LEARNING RESOURCES */}
                {activeTab === "resources" && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                <Input
                                    value={resourceSearch}
                                    onChange={(e) => setResourceSearch(e.target.value)}
                                    placeholder="Search resources by title, description, or provider..."
                                    className="pl-9 text-xs h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={resourceCategoryFilter}
                                    onChange={(e) => setResourceCategoryFilter(e.target.value)}
                                    className="text-xs h-9 px-3 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                                >
                                    <option value="All">All Categories</option>
                                    <option value="DSA">DSA</option>
                                    <option value="Aptitude">Aptitude</option>
                                    <option value="SQL">SQL</option>
                                    <option value="DBMS">DBMS</option>
                                    <option value="Operating Systems">Operating Systems</option>
                                    <option value="Computer Networks">Computer Networks</option>
                                    <option value="Programming">Programming</option>
                                    <option value="System Design">System Design</option>
                                    <option value="HR Preparation">HR Preparation</option>
                                    <option value="Core CS">Core CS</option>
                                </select>

                                <select
                                    value={resourceStatusFilter}
                                    onChange={(e) => setResourceStatusFilter(e.target.value)}
                                    className="text-xs h-9 px-3 bg-white border border-gray-200 rounded-md focus:outline-hidden"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Obsolete">Obsolete Only</option>
                                    <option value="Deprecated">Deprecated Only</option>
                                </select>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedResource(null);
                                        setResourceModalOpen(true);
                                    }}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs gap-1.5 h-9"
                                >
                                    <Plus className="size-3.5" /> Add Resource
                                </Button>
                            </div>
                        </div>

                        {/* Resources Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredResources.map((res) => {
                                const isObsolete = res.status === "Obsolete";
                                const isDeprecated = res.status === "Deprecated";

                                return (
                                    <div
                                        key={res._id}
                                        className={`p-4 rounded-xl border bg-white shadow-2xs transition-all flex flex-col justify-between ${
                                            isObsolete
                                                ? "border-red-200 bg-red-50/20"
                                                : isDeprecated
                                                ? "border-amber-200 bg-amber-50/20"
                                                : "border-gray-200 hover:border-[#6A38C2]/40"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                                        {res.category || "Core CS"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {res.type}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        isObsolete
                                                            ? "text-red-700 bg-red-50 border-red-200"
                                                            : isDeprecated
                                                            ? "text-amber-700 bg-amber-50 border-amber-200"
                                                            : "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                    }`}
                                                >
                                                    {res.status || "Active"}
                                                </span>
                                            </div>

                                            <h4 className="font-bold text-gray-900 text-sm line-clamp-2">
                                                {res.title}
                                            </h4>

                                            {res.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {res.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px] text-gray-500">
                                                <span className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                                    {res.sourceType || "External Platform"}
                                                </span>
                                                {res.provider && (
                                                    <span className="text-gray-400 font-mono">
                                                        {res.provider}
                                                    </span>
                                                )}
                                                {res.isFree && (
                                                    <span className="text-emerald-700 font-semibold">
                                                        • Free
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                                            {/* Last Verified date */}
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span className="inline-flex items-center gap-1 text-gray-500">
                                                    <ShieldCheck className="size-3 text-emerald-600" />
                                                    Verified:{" "}
                                                    {res.lastVerifiedDate
                                                        ? new Date(res.lastVerifiedDate).toLocaleDateString()
                                                        : "Recently"}
                                                </span>

                                                <a
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#6A38C2] font-semibold hover:underline flex items-center gap-1 text-[11px]"
                                                >
                                                    <span>Open</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            </div>

                                            {/* Action buttons: Verify, Obsolete toggle, Edit */}
                                            <div className="flex items-center justify-between gap-1.5 pt-1">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleVerifyResource(res._id)}
                                                        className="h-7 text-[11px] px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                                        title="Confirm link is active & refresh verified timestamp"
                                                    >
                                                        <ShieldCheck className="size-3 mr-1" />
                                                        <span>Verify</span>
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleToggleResourceStatus(
                                                                res._id,
                                                                isObsolete ? "Active" : "Obsolete"
                                                            )
                                                        }
                                                        className={`h-7 text-[11px] px-2 ${
                                                            isObsolete
                                                                ? "text-emerald-700 hover:bg-emerald-50"
                                                                : "text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        }`}
                                                        title={
                                                            isObsolete
                                                                ? "Restore resource to active public status"
                                                                : "Mark resource obsolete to remove from candidate roadmaps"
                                                        }
                                                    >
                                                        <AlertTriangle className="size-3 mr-1" />
                                                        <span>{isObsolete ? "Restore" : "Obsolete"}</span>
                                                    </Button>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedResource(res);
                                                        setResourceModalOpen(true);
                                                    }}
                                                    className="h-7 text-[11px] px-2.5 border-gray-200"
                                                >
                                                    <Edit2 className="size-3 mr-1" />
                                                    <span>Edit</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AdminCompanyModal
                isOpen={companyModalOpen}
                onClose={() => setCompanyModalOpen(false)}
                company={selectedCompany}
                onSaved={() => {
                    fetchCompanies();
                }}
            />

            <AdminRoadmapModal
                isOpen={roadmapModalOpen}
                onClose={() => setRoadmapModalOpen(false)}
                roadmap={selectedRoadmap}
                companies={companies}
                preselectedCompanyId={preselectedCompanyId}
                onSaved={() => {
                    fetchRoadmaps();
                    fetchCompanies();
                }}
            />

            <AdminResourceModal
                isOpen={resourceModalOpen}
                onClose={() => {
                    setResourceModalOpen(false);
                    setSelectedResource(null);
                }}
                resource={selectedResource}
                onSaved={() => {
                    fetchResources();
                }}
            />

            <ArchiveWarningModal
                isOpen={archiveWarningOpen}
                onClose={() => setArchiveWarningOpen(false)}
                company={companyToArchive}
                activeRoadmaps={activeRoadmapsForWarning}
                onConfirm={handleConfirmArchive}
                loading={archivingLoading}
            />

            <Footer />
        </div>
    );
};

export default AdminPreparationDashboard;
