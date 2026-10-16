import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    ExternalLink,
    CheckCircle2,
    RotateCcw,
    AlertCircle,
    Building,
    PhoneCall,
    Loader2,
    CalendarX,
    Bell,
    FileText,
    RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import CandidateRequestRescheduleModal from './CandidateRequestRescheduleModal';

const CandidateInterviews = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [confirmingId, setConfirmingId] = useState(null);

    // Modal state for reschedule request
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);

    const fetchInterviews = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${INTERVIEW_API_END_POINT}/candidate`, {
                withCredentials: true,
            });
            if (response.data.success) {
                setInterviews(response.data.interviews || []);
            } else {
                setError(response.data.message || 'Failed to load interviews');
            }
        } catch (err) {
            console.error('Failed to fetch candidate interviews:', err);
            setError(err.response?.data?.message || 'Failed to fetch scheduled interviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    // Local timezone date & time formatter
    const formatDateTime = (dateString) => {
        if (!dateString) return 'TBD';
        const d = new Date(dateString);
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Categorization logic
    const categorized = useMemo(() => {
        const now = new Date();
        const awaiting = [];
        const upcoming = [];
        const rescheduleRequested = [];
        const pastAndCancelled = [];

        interviews.forEach((item) => {
            const date = new Date(item.scheduledDate);
            const isFuture = date >= now;

            if (item.status === 'Cancelled' || item.status === 'Completed' || (!isFuture && item.status !== 'Reschedule Requested')) {
                pastAndCancelled.push(item);
            } else if (item.status === 'Reschedule Requested') {
                rescheduleRequested.push(item);
            } else if (item.status === 'Scheduled' && isFuture) {
                awaiting.push(item);
            } else if (item.status === 'Confirmed' && isFuture) {
                upcoming.push(item);
            } else {
                pastAndCancelled.push(item);
            }
        });

        return {
            awaiting,
            upcoming,
            rescheduleRequested,
            pastAndCancelled,
        };
    }, [interviews]);

    // Active displayed interviews based on selected tab
    const displayedInterviews = useMemo(() => {
        switch (activeTab) {
            case 'Awaiting Confirmation':
                return categorized.awaiting;
            case 'Upcoming':
                return categorized.upcoming;
            case 'Reschedule Requested':
                return categorized.rescheduleRequested;
            case 'Past & Cancelled':
                return categorized.pastAndCancelled;
            case 'All':
            default:
                return interviews;
        }
    }, [activeTab, categorized, interviews]);

    // Action: Candidate confirms invitation
    const handleConfirm = async (interviewId) => {
        setConfirmingId(interviewId);
        try {
            const response = await axios.patch(
                `${INTERVIEW_API_END_POINT}/${interviewId}/confirm`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Interview invitation confirmed! 🎉');
                // Update local state
                setInterviews(prev =>
                    prev.map(i => (i._id === interviewId ? { ...i, status: 'Confirmed' } : i))
                );
            }
        } catch (err) {
            console.error('Error confirming interview:', err);
            toast.error(err.response?.data?.message || 'Failed to confirm interview');
        } finally {
            setConfirmingId(null);
        }
    };

    const handleRescheduleUpdated = (updated) => {
        setInterviews(prev => prev.map(i => (i._id === updated._id ? updated : i)));
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Scheduled':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200">Awaiting Your Confirmation</Badge>;
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

    return (
        <div className="space-y-6">
            {/* Action Notice if Candidate has interviews awaiting confirmation */}
            {categorized.awaiting.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">
                                You have {categorized.awaiting.length} interview invitation{categorized.awaiting.length > 1 ? 's' : ''} awaiting confirmation
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Please review the scheduled times and confirm your attendance so recruiters can prepare.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setActiveTab('Awaiting Confirmation')}
                        className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs shrink-0 cursor-pointer"
                    >
                        Review Now
                    </Button>
                </div>
            )}

            {/* Filter Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
                {[
                    { label: 'All', count: interviews.length },
                    { label: 'Upcoming', count: categorized.upcoming.length },
                    {
                        label: 'Awaiting Confirmation',
                        count: categorized.awaiting.length,
                        alert: categorized.awaiting.length > 0
                    },
                    { label: 'Reschedule Requested', count: categorized.rescheduleRequested.length },
                    { label: 'Past & Cancelled', count: categorized.pastAndCancelled.length }
                ].map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === tab.label
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${activeTab === tab.label
                            ? 'bg-purple-500 text-white'
                            : tab.alert
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}

                <button
                    onClick={fetchInterviews}
                    disabled={loading}
                    title="Refresh interviews"
                    className="ml-auto p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={fetchInterviews} className="text-xs">
                        Retry
                    </Button>
                </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2].map((n) => (
                        <div key={n} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs animate-pulse space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-5 w-40 bg-gray-200 rounded"></div>
                                <div className="h-5 w-24 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="h-4 w-60 bg-gray-100 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && displayedInterviews.length === 0 && (
                <div className="py-14 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
                    <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-800">No interviews found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                        {activeTab === 'Awaiting Confirmation'
                            ? "You don't have any interviews awaiting your confirmation right now."
                            : activeTab === 'Upcoming'
                                ? "You have no upcoming confirmed interviews."
                                : activeTab === 'Reschedule Requested'
                                    ? "No active reschedule requests."
                                    : "When recruiters schedule an interview for your applications, they will appear here with dates, meeting links, and preparation guidance."}
                    </p>
                </div>
            )}

            {/* Interview Cards List */}
            {!loading && !error && displayedInterviews.length > 0 && (
                <div className="space-y-4">
                    {displayedInterviews.map((item) => {
                        const isOnline = item.interviewType === 'Online';
                        const isInPerson = item.interviewType === 'In-person';
                        const isPhone = item.interviewType === 'Phone';
                        const isScheduled = item.status === 'Scheduled';
                        const isConfirmed = item.status === 'Confirmed';
                        const isCancelled = item.status === 'Cancelled';
                        const isRescheduleReq = item.status === 'Reschedule Requested';
                        const isAwaitingAction = isScheduled;

                        return (
                            <div
                                key={item._id}
                                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${isAwaitingAction
                                    ? 'border-purple-200 ring-2 ring-purple-100'
                                    : isCancelled
                                        ? 'border-red-100 bg-red-50/20'
                                        : 'border-gray-100'
                                    }`}
                            >
                                <div className="p-5 sm:p-6 space-y-4">
                                    {/* Header Row: Company, Role & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                                                {item.job?.company?.logo ? (
                                                    <img
                                                        src={item.job.company.logo}
                                                        alt="Company Logo"
                                                        className="w-8 h-8 object-contain rounded-lg"
                                                    />
                                                ) : (
                                                    <Building className="w-5 h-5 text-[#6A38C2]" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                                                        {item.job?.title || 'Job Interview'}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs font-semibold border-purple-200 text-[#6A38C2]">
                                                        R{item.roundNumber}: {item.round}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                    {item.job?.company?.companyName || item.job?.company?.name || 'Hiring Company'}
                                                    {item.job?.location ? ` • ${item.job.location}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="self-start sm:self-auto">
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>

                                    {/* Date, Time, Duration & Format Badges */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-xl text-xs text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#6A38C2] shrink-0" />
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Date & Time</span>
                                                <span className="font-semibold text-gray-900">{formatDateTime(item.scheduledDate)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Duration</span>
                                                <span className="font-semibold text-gray-900">{item.duration || 45} Minutes</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isOnline ? (
                                                <Video className="w-4 h-4 text-blue-600 shrink-0" />
                                            ) : isInPerson ? (
                                                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                                            ) : (
                                                <PhoneCall className="w-4 h-4 text-purple-600 shrink-0" />
                                            )}
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Format</span>
                                                <span className="font-semibold text-gray-900">{item.interviewType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meeting Link or Physical Venue Card */}
                                    {isOnline && item.meetingUrl && (
                                        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2 text-blue-900">
                                                <Video className="w-4 h-4 text-blue-600 shrink-0" />
                                                <div>
                                                    <span className="font-bold block">Online Meeting Link:</span>
                                                    <span className="text-gray-600 truncate max-w-sm block">{item.meetingUrl}</span>
                                                </div>
                                            </div>
                                            <a
                                                href={item.meetingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition shrink-0"
                                            >
                                                <span>Join Interview</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    )}

                                    {isInPerson && (
                                        <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                                            <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold block">In-person Venue:</span>
                                                <span className="text-gray-700">{item.venue || 'Venue address will be confirmed by recruiter'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {isPhone && (
                                        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-950">
                                            <PhoneCall className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold block">Phone Interview:</span>
                                                <span className="text-gray-700">The interviewer will call you at your registered phone number.</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Instructions Callout */}
                                    {item.instructions && (
                                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                Preparation & Instructions:
                                            </span>
                                            <p className="text-gray-600 whitespace-pre-line pl-5">{item.instructions}</p>
                                        </div>
                                    )}

                                    {/* Cancellation Details Callout */}
                                    {isCancelled && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1 text-red-900">
                                            <span className="font-bold flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                                Interview Cancelled
                                            </span>
                                            <p className="text-red-700 pl-5">
                                                {item.cancellationReason
                                                    ? `Reason: ${item.cancellationReason}`
                                                    : 'This interview has been cancelled by the recruiter.'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Reschedule Request Notice */}
                                    {isRescheduleReq && item.rescheduleReason && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                                            <span className="font-bold flex items-center gap-1.5">
                                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                                Reschedule Request Sent:
                                            </span>
                                            <p className="italic pl-5">"{item.rescheduleReason}"</p>
                                            {item.proposedDate && (
                                                <p className="text-[11px] text-amber-800 pl-5">
                                                    Suggested alternative: {formatDateTime(item.proposedDate)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Recruiter Contact & Action Buttons */}
                                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div className="text-gray-500">
                                            Interviewer: <strong className="text-gray-800">{item.recruiter?.fullname || 'Recruiter'}</strong>
                                            {item.recruiter?.email && <span className="text-gray-400"> ({item.recruiter.email})</span>}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {/* Confirm invitation button */}
                                            {isScheduled && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConfirm(item._id)}
                                                    disabled={confirmingId === item._id}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                >
                                                    {confirmingId === item._id ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Confirming...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Confirm Attendance
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {/* Request reschedule button */}
                                            {(isScheduled || isConfirmed) && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedInterview(item);
                                                        setRescheduleModalOpen(true);
                                                    }}
                                                    className="text-xs h-8 px-3 border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Request Reschedule
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reschedule Request Modal */}
            <CandidateRequestRescheduleModal
                isOpen={rescheduleModalOpen}
                onClose={() => {
                    setRescheduleModalOpen(false);
                    setSelectedInterview(null);
                }}
                interview={selectedInterview}
                onRescheduleRequested={handleRescheduleUpdated}
            />
        </div>
    );
};

export default CandidateInterviews;
