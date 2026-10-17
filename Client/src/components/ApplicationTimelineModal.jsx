import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    Search,
    Sparkles,
    Building2,
    MapPin,
    DollarSign,
    Briefcase,
    ExternalLink,
    Copy,
    Check,
    MessageSquare,
    AlertTriangle,
    Loader2,
    Video,
    UserCheck,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { APPLICANT_API_END_POINT } from '@/utils/constant';
import { Link } from 'react-router-dom';

const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'applied':
        case 'pending':
            return {
                label: 'Applied',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                icon: Clock,
                dotColor: 'bg-blue-500',
                description: 'Application successfully received by the hiring team.',
            };
        case 'under review':
            return {
                label: 'Under Review',
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: Search,
                dotColor: 'bg-amber-500',
                description: 'The recruiting team is actively reviewing your resume and profile.',
            };
        case 'shortlisted':
        case 'accepted':
            return {
                label: 'Shortlisted',
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                icon: CheckCircle2,
                dotColor: 'bg-purple-600',
                description: 'Your profile advanced to evaluation rounds. Interview coordination in progress.',
            };
        case 'interview scheduled':
            return {
                label: 'Interview Scheduled',
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                icon: Calendar,
                dotColor: 'bg-indigo-600',
                description: 'An interview round has been scheduled.',
            };
        case 'selected':
            return {
                label: 'Selected / Offer',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: Sparkles,
                dotColor: 'bg-emerald-500',
                description: 'Congratulations! You have been selected for this position.',
            };
        case 'rejected':
            return {
                label: 'Rejected',
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                icon: XCircle,
                dotColor: 'bg-rose-500',
                description: 'The company has decided to proceed with other candidates.',
            };
        case 'withdrawn':
            return {
                label: 'Withdrawn',
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: AlertTriangle,
                dotColor: 'bg-slate-400',
                description: 'You have withdrawn this application.',
            };
        default:
            return {
                label: status || 'Applied',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Clock,
                dotColor: 'bg-gray-400',
                description: 'Application recorded.',
            };
    }
};

const ApplicationTimelineModal = ({
    isOpen,
    onClose,
    application,
    onWithdrawSuccess,
    isRecruiterView = false,
}) => {
    const [copied, setCopied] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [confirmWithdraw, setConfirmWithdraw] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');

    if (!application) return null;

    const currentStatus = application.status || 'applied';
    const statusCfg = getStatusConfig(currentStatus);
    const history = application.statusHistory || [];
    const job = application.job || {};
    const company = job.company || {};
    const companyName = company.companyName || company.name || 'Company';
    const refCode = application.applicationRef || `APP-${application._id?.toString().slice(-6).toUpperCase()}`;

    const handleCopyRef = () => {
        navigator.clipboard.writeText(refCode);
        setCopied(true);
        toast.success('Application Reference ID copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = async () => {
        setWithdrawing(true);
        try {
            const res = await axios.post(
                `${APPLICANT_API_END_POINT}/${application._id}/withdraw`,
                { reason: withdrawReason },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success('Application withdrawn successfully');
                setConfirmWithdraw(false);
                if (onWithdrawSuccess) {
                    onWithdrawSuccess(res.data.application);
                }
                onClose();
            }
        } catch (error) {
            console.error('Withdraw error:', error);
            toast.error(error.response?.data?.message || 'Failed to withdraw application');
        } finally {
            setWithdrawing(false);
        }
    };

    const isTerminal = ['rejected', 'selected', 'withdrawn'].includes(currentStatus.toLowerCase());

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-gray-100 shadow-xl">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 text-white p-6 sm:p-8 rounded-t-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/10 backdrop-blur-sm text-purple-200 border border-white/10">
                                Ref: {refCode}
                                <button
                                    onClick={handleCopyRef}
                                    className="ml-1 text-white/70 hover:text-white transition cursor-pointer"
                                    title="Copy reference code"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </span>
                            <Badge className={`${statusCfg.color} font-medium border text-xs px-2.5 py-1`}>
                                <statusCfg.icon className="w-3.5 h-3.5 mr-1" />
                                {statusCfg.label}
                            </Badge>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                            {job.title || 'Job Application'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                            <span className="flex items-center gap-1.5 font-medium text-white">
                                <Building2 className="w-4 h-4 text-purple-400" />
                                {companyName}
                            </span>
                            {job.location && (
                                <span className="flex items-center gap-1 text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {job.location}
                                </span>
                            )}
                            {job.jobType && (
                                <span className="flex items-center gap-1 text-slate-300">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                    {job.jobType}
                                </span>
                            )}
                            {job.salary && (
                                <span className="flex items-center gap-1 text-slate-300">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                    ₹{job.salary?.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                    {/* Progress Stepper for visual status milestone */}
                    <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-100">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                            Application Stage Overview
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {[
                                { name: 'Applied', key: ['applied', 'pending'] },
                                { name: 'Under Review', key: ['under review'] },
                                { name: 'Shortlisted', key: ['shortlisted', 'accepted', 'interview scheduled'] },
                                { name: currentStatus.toLowerCase() === 'rejected' ? 'Rejected' : currentStatus.toLowerCase() === 'withdrawn' ? 'Withdrawn' : 'Selected', key: ['selected', 'rejected', 'withdrawn'] },
                            ].map((step, idx) => {
                                const isCurrent = step.key.includes(currentStatus.toLowerCase());
                                const isPassed =
                                    (idx === 0 && true) ||
                                    (idx === 1 && ['under review', 'shortlisted', 'accepted', 'interview scheduled', 'selected'].includes(currentStatus.toLowerCase())) ||
                                    (idx === 2 && ['shortlisted', 'accepted', 'interview scheduled', 'selected'].includes(currentStatus.toLowerCase())) ||
                                    (idx === 3 && ['selected', 'rejected', 'withdrawn'].includes(currentStatus.toLowerCase()));

                                return (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                                                isCurrent
                                                    ? 'bg-[#6A38C2] text-white ring-4 ring-purple-100'
                                                    : isPassed
                                                    ? 'bg-purple-200 text-purple-800'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className={`font-medium ${isCurrent ? 'text-purple-700 font-bold' : isPassed ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {step.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chronological Status History Timeline */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#6A38C2]" />
                                Application Activity Timeline
                            </h3>
                            <span className="text-xs text-slate-500 font-medium">
                                {history.length} {history.length === 1 ? 'event' : 'events'} recorded
                            </span>
                        </div>

                        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            {history.map((event, index) => {
                                const eventCfg = getStatusConfig(event.status);
                                const isLatest = index === history.length - 1;
                                const eventDate = new Date(event.timestamp || Date.now()).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });

                                return (
                                    <div key={event._id || index} className="relative group">
                                        {/* Timeline Dot */}
                                        <div
                                            className={`absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                                                isLatest ? 'bg-[#6A38C2] ring-4 ring-purple-100' : 'bg-slate-300'
                                            }`}
                                        >
                                            <eventCfg.icon className="w-3 h-3 text-white" />
                                        </div>

                                        {/* Event Card */}
                                        <div
                                            className={`rounded-xl p-4 border transition-all ${
                                                isLatest
                                                    ? 'bg-purple-50/50 border-purple-200 shadow-xs'
                                                    : 'bg-white border-slate-100'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {eventCfg.label}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6A38C2] text-white">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {eventDate}
                                                </span>
                                            </div>

                                            {/* Note / Message if provided */}
                                            {event.message && (
                                                <div className="mt-2 text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200/80 flex items-start gap-2.5">
                                                    <MessageSquare className="w-4 h-4 text-[#6A38C2] shrink-0 mt-0.5" />
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold text-slate-800 text-[11px]">
                                                            {event.changedByRole === 'recruiter' || event.changedByRole === 'admin'
                                                                ? 'Message from Hiring Team'
                                                                : 'Candidate Note'}
                                                        </div>
                                                        <p className="italic text-slate-600 leading-relaxed">
                                                            "{event.message}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-2 text-[11px] text-slate-400">
                                                Updated by: {event.changedBy?.fullname || (event.changedByRole === 'student' ? 'Applicant' : 'Recruitment Team')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Associated Interviews Section */}
                    {application.interviews && application.interviews.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-100">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    Interview Rounds ({application.interviews.length})
                                </h4>
                                {!isRecruiterView && (
                                    <Link
                                        to="/interviews"
                                        className="text-xs text-[#6A38C2] font-semibold hover:underline flex items-center gap-1"
                                    >
                                        My Interview Dashboard
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>

                            <div className="space-y-3">
                                {application.interviews.map((iv) => {
                                    const ivDate = new Date(iv.scheduledDate).toLocaleString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={iv._id}
                                            className="bg-white p-3.5 rounded-xl border border-indigo-100/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-900">
                                                        Round {iv.roundNumber || 1}: {iv.round} ({iv.interviewType})
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-2 py-0.5 ${
                                                            iv.status === 'Confirmed'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : iv.status === 'Completed'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}
                                                    >
                                                        {iv.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-slate-500 flex items-center gap-3">
                                                    <span>{ivDate}</span>
                                                    <span>• {iv.duration} mins</span>
                                                </div>
                                            </div>

                                            {iv.meetingUrl && iv.interviewType === 'Online' && (
                                                <a
                                                    href={iv.meetingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                                                >
                                                    <Video className="w-3.5 h-3.5" />
                                                    Join Meeting
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Candidate Actions: Link to Job Description / Withdraw */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        {job._id ? (
                            <Link
                                to={`/description/${job._id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-semibold transition"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Full Job Posting
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Job listing no longer active</span>
                        )}

                        {!isRecruiterView && !isTerminal && (
                            <div>
                                {confirmWithdraw ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Reason (optional)"
                                            value={withdrawReason}
                                            onChange={(e) => setWithdrawReason(e.target.value)}
                                            className="text-xs border rounded-lg px-2.5 py-1.5 w-44"
                                        />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={withdrawing}
                                            onClick={handleWithdraw}
                                            className="text-xs h-8"
                                        >
                                            {withdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Withdraw'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setConfirmWithdraw(false)}
                                            className="text-xs h-8 text-slate-500"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setConfirmWithdraw(true)}
                                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                    >
                                        Withdraw Application
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationTimelineModal;
