import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../shared/Navbar';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    ExternalLink,
    Search,
    RotateCcw,
    XCircle,
    CheckCircle2,
    AlertCircle,
    Loader2,
    CalendarX,
    Filter,
    PhoneCall
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import RescheduleInterviewModal from './RescheduleInterviewModal';
import CancelInterviewModal from './CancelInterviewModal';
import CompleteInterviewModal from './CompleteInterviewModal';
import { useNavigate } from 'react-router-dom';

const RecruiterInterviews = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [activeInterview, setActiveInterview] = useState(null);

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${INTERVIEW_API_END_POINT}/recruiter`, {
                withCredentials: true,
            });
            if (response.data.success) {
                setInterviews(response.data.interviews || []);
            }
        } catch (error) {
            console.error('Failed to fetch recruiter interviews:', error);
            toast.error(error.response?.data?.message || 'Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    // Helper: format date & time nicely
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter logic
    const filteredInterviews = useMemo(() => {
        return interviews.filter((item) => {
            // Tab filter
            const now = new Date();
            const schedDate = new Date(item.scheduledDate);

            if (activeTab === 'Upcoming') {
                if (schedDate < now || item.status === 'Cancelled' || item.status === 'Completed') return false;
            } else if (activeTab === 'Reschedule Requested') {
                if (item.status !== 'Reschedule Requested') return false;
            } else if (activeTab === 'Scheduled') {
                if (item.status !== 'Scheduled') return false;
            } else if (activeTab === 'Confirmed') {
                if (item.status !== 'Confirmed') return false;
            } else if (activeTab === 'Completed') {
                if (item.status !== 'Completed') return false;
            } else if (activeTab === 'Cancelled') {
                if (item.status !== 'Cancelled') return false;
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const candidateName = item.candidate?.fullname?.toLowerCase() || '';
                const candidateEmail = item.candidate?.email?.toLowerCase() || '';
                const jobTitle = item.job?.title?.toLowerCase() || '';
                const round = item.round?.toLowerCase() || '';
                return candidateName.includes(term) || candidateEmail.includes(term) || jobTitle.includes(term) || round.includes(term);
            }

            return true;
        });
    }, [interviews, activeTab, searchTerm]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Scheduled':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200">Scheduled</Badge>;
            case 'Confirmed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">Confirmed</Badge>;
            case 'Reschedule Requested':
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300">Reschedule Requested</Badge>;
            case 'Completed':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border border-purple-200">Completed</Badge>;
            case 'Cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">Cancelled</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleInterviewUpdated = (updated) => {
        setInterviews(prev => prev.map(inv => inv._id === updated._id ? updated : inv));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Scheduled Interviews
                            </h1>
                            <Badge className="bg-[#6A38C2] text-white hover:bg-[#6A38C2]">
                                {interviews.length} Total
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage candidate interview rounds, reschedule, join meetings, and track statuses.
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate('/admin/jobs')}
                        variant="outline"
                        className="cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                    >
                        <Calendar className="w-4 h-4 text-[#6A38C2]" />
                        Schedule from Applicants
                    </Button>
                </div>

                {/* Filters & Search */}
                <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-lg">
                        {['All', 'Upcoming', 'Reschedule Requested', 'Confirmed', 'Scheduled', 'Completed', 'Cancelled'].map((tab) => {
                            const count = tab === 'All' ? interviews.length : interviews.filter(i => {
                                if (tab === 'Upcoming') return new Date(i.scheduledDate) >= new Date() && i.status !== 'Cancelled' && i.status !== 'Completed';
                                return i.status === tab;
                            }).length;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                                        }`}
                                >
                                    <span>{tab}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab ? 'bg-purple-100 text-[#6A38C2]' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <Input
                            placeholder="Search candidate, job, round..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-xs bg-white"
                        />
                    </div>
                </div>

                {/* Content Table / Cards */}
                <div className="mt-6 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2]" />
                            <p className="text-sm">Loading interviews...</p>
                        </div>
                    ) : filteredInterviews.length === 0 ? (
                        <div className="py-16 px-4 text-center">
                            <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-gray-800">No interviews found</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                                {interviews.length === 0
                                    ? "You haven't scheduled any candidate interviews yet. Go to your Job Applicants to shortlist and schedule."
                                    : "No interviews match the selected filter criteria."}
                            </p>
                            {interviews.length === 0 && (
                                <Button
                                    onClick={() => navigate('/admin/jobs')}
                                    className="mt-4 bg-[#6A38C2] hover:bg-[#5b30a6] text-white cursor-pointer"
                                >
                                    View Job Applicants
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow>
                                        <TableHead className="w-[200px]">Candidate</TableHead>
                                        <TableHead>Job Role</TableHead>
                                        <TableHead>Round</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Type & Link</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInterviews.map((item) => {
                                        const isActionable = item.status !== 'Cancelled' && item.status !== 'Completed';

                                        return (
                                            <TableRow key={item._id} className="hover:bg-gray-50/60 transition">
                                                {/* Candidate */}
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 text-sm">
                                                            {item.candidate?.fullname || 'Candidate'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{item.candidate?.email}</span>
                                                        {item.candidate?.phoneNumber && (
                                                            <span className="text-xs text-gray-400">{item.candidate?.phoneNumber}</span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Job */}
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {item.job?.title || 'Job Listing'}
                                                    </span>
                                                </TableCell>

                                                {/* Round */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-xs font-medium">
                                                            R{item.roundNumber}: {item.round}
                                                        </Badge>
                                                    </div>
                                                </TableCell>

                                                {/* Date & Time */}
                                                <TableCell>
                                                    <div className="flex flex-col text-xs text-gray-700">
                                                        <span className="font-medium flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            {formatDateTime(item.scheduledDate)}
                                                        </span>
                                                        <span className="text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3" />
                                                            {item.duration || 45} mins
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Type & Meeting Link / Venue */}
                                                <TableCell>
                                                    <div className="text-xs">
                                                        {item.interviewType === 'Online' && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                                {item.meetingUrl ? (
                                                                    <a
                                                                        href={item.meetingUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                                                                    >
                                                                        Join Link <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400">Online</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.interviewType === 'Phone' && (
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
                                                                <span>Phone Interview</span>
                                                            </div>
                                                        )}
                                                        {item.interviewType === 'In-person' && (
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                <span className="truncate max-w-[140px]" title={item.venue}>
                                                                    {item.venue || 'In-person'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {getStatusBadge(item.status)}
                                                        {item.status === 'Reschedule Requested' && item.rescheduleReason && (
                                                            <span className="text-[10px] text-amber-700 italic max-w-[150px] truncate" title={item.rescheduleReason}>
                                                                Reason: "{item.rescheduleReason}"
                                                            </span>
                                                        )}
                                                        {item.status === 'Cancelled' && item.cancellationReason && (
                                                            <span className="text-[10px] text-red-600 italic max-w-[150px] truncate" title={item.cancellationReason}>
                                                                Reason: "{item.cancellationReason}"
                                                            </span>
                                                        )}
                                                        {item.status === 'Completed' && item.feedback && (
                                                            <span className="text-[10px] text-purple-600 italic max-w-[150px] truncate" title={item.feedback}>
                                                                Feedback: "{item.feedback}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isActionable && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setActiveInterview(item);
                                                                        setRescheduleModalOpen(true);
                                                                    }}
                                                                    className="h-7 text-xs px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200 cursor-pointer flex items-center gap-1"
                                                                    title="Reschedule Interview"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                    Reschedule
                                                                </Button>

                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setActiveInterview(item);
                                                                        setCompleteModalOpen(true);
                                                                    }}
                                                                    className="h-7 text-xs px-2 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 cursor-pointer flex items-center gap-1"
                                                                    title="Mark as Completed"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Complete
                                                                </Button>

                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setActiveInterview(item);
                                                                        setCancelModalOpen(true);
                                                                    }}
                                                                    className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer flex items-center gap-1"
                                                                    title="Cancel Interview"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {!isActionable && (
                                                            <span className="text-xs text-gray-400 italic">No actions</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <RescheduleInterviewModal
                isOpen={rescheduleModalOpen}
                onClose={() => {
                    setRescheduleModalOpen(false);
                    setActiveInterview(null);
                }}
                interview={activeInterview}
                onInterviewUpdated={handleInterviewUpdated}
            />

            <CancelInterviewModal
                isOpen={cancelModalOpen}
                onClose={() => {
                    setCancelModalOpen(false);
                    setActiveInterview(null);
                }}
                interview={activeInterview}
                onInterviewCancelled={handleInterviewUpdated}
            />

            <CompleteInterviewModal
                isOpen={completeModalOpen}
                onClose={() => {
                    setCompleteModalOpen(false);
                    setActiveInterview(null);
                }}
                interview={activeInterview}
                onInterviewCompleted={handleInterviewUpdated}
            />
        </div>
    );
};

export default RecruiterInterviews;
