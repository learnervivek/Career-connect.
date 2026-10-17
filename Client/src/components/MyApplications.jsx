import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './shared/Navbar';
import Footer from './shared/Footer';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Briefcase,
    Building2,
    Calendar,
    Clock,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Sparkles,
    AlertCircle,
    LayoutGrid,
    Table as TableIcon,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    MapPin,
    DollarSign,
    Video,
    Copy,
    Check,
    Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { APPLICANT_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationTimelineModal from './ApplicationTimelineModal';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'under review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview scheduled', label: 'Interview Scheduled' },
    { value: 'selected', label: 'Selected / Offer' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
];

const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'applied':
        case 'pending':
            return (
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    Applied
                </Badge>
            );
        case 'under review':
            return (
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <Search className="w-3 h-3 text-amber-500" />
                    Under Review
                </Badge>
            );
        case 'shortlisted':
        case 'accepted':
            return (
                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-500" />
                    Shortlisted
                </Badge>
            );
        case 'interview scheduled':
            return (
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    Interview Scheduled
                </Badge>
            );
        case 'selected':
            return (
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Selected
                </Badge>
            );
        case 'rejected':
            return (
                <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs px-2.5 py-1 font-medium gap-1">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    Rejected
                </Badge>
            );
        case 'withdrawn':
            return (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs px-2.5 py-1 font-medium gap-1">
                    <AlertCircle className="w-3 h-3 text-slate-500" />
                    Withdrawn
                </Badge>
            );
        default:
            return (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-1 font-medium">
                    {status || 'Applied'}
                </Badge>
            );
    }
};

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter and Sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

    // Modal state
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [timelineModalOpen, setTimelineModalOpen] = useState(false);

    const fetchApplications = async (showToast = false) => {
        try {
            if (showToast) setRefreshing(true);
            else setLoading(true);

            const res = await axios.get(`${APPLICANT_API_END_POINT}/my-applications`, {
                withCredentials: true,
            });

            if (res.data.success) {
                const list = res.data.applications || res.data.application || [];
                setApplications(list);
                if (showToast) {
                    toast.success('Applications refreshed');
                }
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            toast.error(error.response?.data?.message || 'Failed to load applications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    // Extract unique companies for filter dropdown
    const availableCompanies = useMemo(() => {
        const set = new Set();
        applications.forEach((app) => {
            const cName = app.job?.company?.companyName;
            if (cName) set.add(cName);
        });
        return Array.from(set).sort();
    }, [applications]);

    // Live Metrics
    const metrics = useMemo(() => {
        const total = applications.length;
        const review = applications.filter((a) => (a.status || '').toLowerCase() === 'under review').length;
        const shortlisted = applications.filter((a) =>
            ['shortlisted', 'accepted', 'interview scheduled'].includes((a.status || '').toLowerCase())
        ).length;
        const selected = applications.filter((a) => (a.status || '').toLowerCase() === 'selected').length;
        const rejected = applications.filter((a) => (a.status || '').toLowerCase() === 'rejected').length;
        return { total, review, shortlisted, selected, rejected };
    }, [applications]);

    // Filtering & Sorting
    const filteredApplications = useMemo(() => {
        let result = [...applications];

        // Search filter (job title, company, reference ID)
        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase().trim();
            result = result.filter((app) => {
                const title = app.job?.title?.toLowerCase() || '';
                const comp = app.job?.company?.companyName?.toLowerCase() || '';
                const ref = app.applicationRef?.toLowerCase() || '';
                return title.includes(query) || comp.includes(query) || ref.includes(query);
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((app) => {
                const s = (app.status || 'applied').toLowerCase();
                if (statusFilter === 'applied') return s === 'applied' || s === 'pending';
                if (statusFilter === 'shortlisted') return s === 'shortlisted' || s === 'accepted';
                return s === statusFilter;
            });
        }

        // Company filter
        if (companyFilter !== 'all') {
            result = result.filter((app) => app.job?.company?.companyName === companyFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (sortBy === 'updated') {
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            }
            return 0;
        });

        return result;
    }, [applications, searchTerm, statusFilter, companyFilter, sortBy]);

    const handleOpenTimeline = (application) => {
        setSelectedApplication(application);
        setTimelineModalOpen(true);
    };

    const handleApplicationUpdated = (updatedApp) => {
        setApplications((prev) =>
            prev.map((app) => (app._id === updatedApp._id ? { ...app, ...updatedApp } : app))
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/70 flex flex-col">
            <Navbar />

            {/* Header Hero */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
                                <Briefcase className="w-3.5 h-3.5" />
                                Candidate Job Tracker
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                My Job Applications
                            </h1>
                            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Track the real-time status of every position you've applied for, view recruiter timelines, interview invitations, and status notifications in one unified place.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => fetchApplications(true)}
                                variant="outline"
                                disabled={refreshing || loading}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9 cursor-pointer gap-2"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Link to="/jobs">
                                <Button className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-9 cursor-pointer gap-1.5 shadow-sm">
                                    <Search className="w-3.5 h-3.5" />
                                    Browse More Jobs
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Counter Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                            <span className="text-xs text-slate-300 font-medium">Total Applied</span>
                            <div className="text-2xl font-bold text-white mt-0.5">{metrics.total}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                            <span className="text-xs text-amber-300 font-medium">Under Review</span>
                            <div className="text-2xl font-bold text-amber-300 mt-0.5">{metrics.review}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                            <span className="text-xs text-purple-300 font-medium">Shortlisted</span>
                            <div className="text-2xl font-bold text-purple-300 mt-0.5">{metrics.shortlisted}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                            <span className="text-xs text-emerald-300 font-medium">Selected / Offers</span>
                            <div className="text-2xl font-bold text-emerald-300 mt-0.5">{metrics.selected}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 col-span-2 sm:col-span-1">
                            <span className="text-xs text-rose-300 font-medium">Rejected / Closed</span>
                            <div className="text-2xl font-bold text-rose-300 mt-0.5">{metrics.rejected}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                {/* Search & Filters Toolbar */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Search by job title, company, or reference ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 text-xs sm:text-sm h-10 border-slate-200 focus-visible:ring-[#6A38C2] rounded-xl"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px] h-10 text-xs border-slate-200 rounded-xl bg-slate-50/50">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Company Filter */}
                            {availableCompanies.length > 0 && (
                                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                                    <SelectTrigger className="w-[160px] h-10 text-xs border-slate-200 rounded-xl bg-slate-50/50">
                                        <SelectValue placeholder="Company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            All Companies
                                        </SelectItem>
                                        {availableCompanies.map((c) => (
                                            <SelectItem key={c} value={c} className="text-xs">
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Sort Filter */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[150px] h-10 text-xs border-slate-200 rounded-xl bg-slate-50/50">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest" className="text-xs">
                                        Newest Applied
                                    </SelectItem>
                                    <SelectItem value="updated" className="text-xs">
                                        Recently Updated
                                    </SelectItem>
                                    <SelectItem value="oldest" className="text-xs">
                                        Oldest
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* View Switcher */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        viewMode === 'cards'
                                            ? 'bg-white text-[#6A38C2] shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Cards View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        viewMode === 'table'
                                            ? 'bg-white text-[#6A38C2] shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Table View"
                                >
                                    <TableIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Indicators */}
                    {(searchTerm || statusFilter !== 'all' || companyFilter !== 'all') && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            <span>Active filters:</span>
                            {searchTerm && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                    Search: "{searchTerm}"
                                </Badge>
                            )}
                            {statusFilter !== 'all' && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                    Status: {statusFilter}
                                </Badge>
                            )}
                            {companyFilter !== 'all' && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                    Company: {companyFilter}
                                </Badge>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="text-xs text-[#6A38C2] font-semibold hover:underline ml-1 cursor-pointer"
                            >
                                Reset all
                            </button>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-3 bg-slate-100 rounded w-full" />
                                <div className="h-8 bg-slate-100 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : filteredApplications.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-xl mx-auto shadow-xs">
                        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6A38C2] flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {applications.length === 0 ? "You haven't applied to any jobs yet" : 'No applications match your filter'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
                            {applications.length === 0
                                ? 'Explore thousands of verified openings from top companies and kickstart your dream career.'
                                : 'Try adjusting your search criteria or clearing active filters to see your applications.'}
                        </p>
                        {applications.length === 0 ? (
                            <Link to="/jobs">
                                <Button className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs px-6 py-2 rounded-xl">
                                    Explore Open Jobs
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="text-xs"
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                ) : viewMode === 'cards' ? (
                    /* Cards Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filteredApplications.map((app) => {
                                const job = app.job || {};
                                const company = job.company || {};
                                const companyName = company.companyName || company.name || 'Company';
                                const initials = companyName.slice(0, 2).toUpperCase();
                                const hasInterviews = app.interviews && app.interviews.length > 0;
                                const latestInterview = hasInterviews
                                    ? app.interviews[app.interviews.length - 1]
                                    : null;
                                const appliedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                });
                                const updatedDate = new Date(app.updatedAt || app.createdAt).toLocaleDateString(
                                    'en-US',
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                    }
                                );

                                return (
                                    <motion.div
                                        key={app._id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                                    >
                                        <div className="p-5">
                                            {/* Header: Company Logo, Ref Code, and Status Badge */}
                                            <div className="flex items-start justify-between gap-3 mb-3.5">
                                                <div className="flex items-center gap-3">
                                                    {company.logo ? (
                                                        <img
                                                            src={company.logo}
                                                            alt={companyName}
                                                            className="w-11 h-11 rounded-xl object-contain border border-slate-100 p-1 bg-white shadow-2xs"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-semibold text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3 text-slate-400" />
                                                            {companyName}
                                                        </h4>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            {app.applicationRef || `APP-${app._id?.slice(-6).toUpperCase()}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>{getStatusBadge(app.status)}</div>
                                            </div>

                                            {/* Job Title */}
                                            <h3 className="font-bold text-base text-slate-900 group-hover:text-[#6A38C2] transition line-clamp-1 mb-2">
                                                {job.title || 'Position Title'}
                                            </h3>

                                            {/* Job Tags */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500">
                                                {job.location && (
                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        {job.location}
                                                    </span>
                                                )}
                                                {job.jobType && (
                                                    <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-medium">
                                                        {job.jobType}
                                                    </span>
                                                )}
                                                {job.salary && (
                                                    <span className="text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-md font-medium">
                                                        ₹{job.salary?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Connected Interview Highlight Banner */}
                                            {hasInterviews && latestInterview && (
                                                <div className="mb-4 bg-indigo-50/70 rounded-xl p-3 border border-indigo-100 text-xs">
                                                    <div className="flex items-center justify-between text-indigo-900 font-semibold mb-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                                                            Round {latestInterview.roundNumber || 1}: {latestInterview.round}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] bg-white text-indigo-700 border-indigo-200"
                                                        >
                                                            {latestInterview.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-slate-600 text-[11px] flex items-center justify-between mt-1">
                                                        <span>
                                                            {new Date(latestInterview.scheduledDate).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                        <Link
                                                            to="/interviews"
                                                            className="text-[#6A38C2] font-bold hover:underline"
                                                        >
                                                            View Details →
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Timeline Teaser / Last event */}
                                            {app.statusHistory && app.statusHistory.length > 0 && (
                                                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2 flex items-center justify-between">
                                                    <span className="truncate pr-2">
                                                        Last update: <strong className="text-slate-700 capitalize">{app.statusHistory[app.statusHistory.length - 1].status}</strong>
                                                    </span>
                                                    <span className="text-slate-400 shrink-0">{updatedDate}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-slate-400">
                                                Applied on {appliedDate}
                                            </span>

                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenTimeline(app)}
                                                className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-8 px-3 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                            >
                                                Track Timeline
                                                <ChevronRight className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4">Application Ref</th>
                                        <th className="py-3 px-4">Job Role</th>
                                        <th className="py-3 px-4">Company</th>
                                        <th className="py-3 px-4">Applied Date</th>
                                        <th className="py-3 px-4">Last Updated</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredApplications.map((app) => {
                                        const job = app.job || {};
                                        const company = job.company || {};
                                        const companyName = company.companyName || company.name || 'Company';
                                        const appliedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        });
                                        const updatedDate = new Date(app.updatedAt || app.createdAt).toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            }
                                        );

                                        return (
                                            <tr key={app._id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4 font-mono text-xs text-slate-500">
                                                    {app.applicationRef || `APP-${app._id?.slice(-6).toUpperCase()}`}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {job._id ? (
                                                        <Link
                                                            to={`/description/${job._id}`}
                                                            className="hover:text-[#6A38C2] hover:underline"
                                                        >
                                                            {job.title || 'Job Listing'}
                                                        </Link>
                                                    ) : (
                                                        job.title || 'Job Listing'
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                        {companyName}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">{appliedDate}</td>
                                                <td className="py-3 px-4 text-slate-500">{updatedDate}</td>
                                                <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenTimeline(app)}
                                                        className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-7 px-2.5 rounded-lg cursor-pointer"
                                                    >
                                                        Track Progress
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Application Timeline Modal */}
            <ApplicationTimelineModal
                isOpen={timelineModalOpen}
                onClose={() => {
                    setTimelineModalOpen(false);
                    setSelectedApplication(null);
                }}
                application={selectedApplication}
                onWithdrawSuccess={handleApplicationUpdated}
            />

            <Footer />
        </div>
    );
};

export default MyApplications;
