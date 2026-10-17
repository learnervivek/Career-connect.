import React, { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    MoreHorizontal,
    CalendarPlus,
    Calendar,
    Clock,
    Video,
    MapPin,
    CheckCircle2,
    History,
    MessageSquare,
    Loader2,
    Search,
    Sparkles,
    XCircle,
    Send,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import axios from 'axios';
import { APPLICANT_API_END_POINT } from '@/utils/constant';
import { setAllApplicants } from '@/redux/applicationSlice';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import ApplicationTimelineModal from '../ApplicationTimelineModal';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STATUSES = [
    { value: 'under review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview scheduled', label: 'Interview Scheduled' },
    { value: 'selected', label: 'Selected / Offer' },
    { value: 'rejected', label: 'Rejected' },
];

const JobApplicantsTable = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { allApplicants } = useSelector((store) => store.application);

    // Modal state for scheduling interview
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    // Modal state for viewing history
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyApplication, setHistoryApplication] = useState(null);

    // Status Update Dialog state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [targetApplication, setTargetApplication] = useState(null);
    const [targetStatus, setTargetStatus] = useState('under review');
    const [candidateMessage, setCandidateMessage] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleOpenStatusModal = (application, initialStatus = null) => {
        setTargetApplication(application);
        setTargetStatus(initialStatus || application.status?.toLowerCase() || 'under review');
        setCandidateMessage('');
        setStatusModalOpen(true);
    };

    const handleConfirmStatusUpdate = async () => {
        if (!targetApplication) return;
        setUpdatingStatus(true);
        try {
            const response = await axios.patch(
                `${APPLICANT_API_END_POINT}/${targetApplication._id}/status`,
                {
                    status: targetStatus,
                    message: candidateMessage.trim(),
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Status updated successfully');

                // Update Redux state directly so UI reflects change immediately
                if (allApplicants && allApplicants.applications) {
                    const updatedApps = allApplicants.applications.map((app) => {
                        if (app._id === targetApplication._id) {
                            const newHistory = [
                                ...(app.statusHistory || []),
                                {
                                    status: targetStatus,
                                    message: candidateMessage.trim(),
                                    timestamp: new Date(),
                                    changedByRole: 'recruiter',
                                },
                            ];
                            return {
                                ...app,
                                status: targetStatus,
                                statusHistory: newHistory,
                            };
                        }
                        return app;
                    });
                    dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }));
                }

                setStatusModalOpen(false);
                setTargetApplication(null);
                setCandidateMessage('');
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleOpenScheduleModal = (application) => {
        const appWithJob = {
            ...application,
            job: {
                _id: allApplicants?._id,
                title: allApplicants?.title,
                company: allApplicants?.company,
            },
        };
        setSelectedApplication(appWithJob);
        setScheduleModalOpen(true);
    };

    const handleOpenHistoryModal = (application) => {
        const appWithJob = {
            ...application,
            job: {
                _id: allApplicants?._id,
                title: allApplicants?.title,
                company: allApplicants?.company,
            },
        };
        setHistoryApplication(appWithJob);
        setHistoryModalOpen(true);
    };

    const handleInterviewScheduled = (newInterview) => {
        if (allApplicants && allApplicants.applications) {
            const updatedApps = allApplicants.applications.map((app) => {
                if (app._id === newInterview.application) {
                    const existingInterviews = app.interviews || [];
                    return {
                        ...app,
                        status: 'shortlisted',
                        interviews: [...existingInterviews, newInterview],
                    };
                }
                return app;
            });
            dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }));
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'under review':
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs gap-1">
                        <Search className="w-3 h-3 text-amber-600" />
                        Under Review
                    </Badge>
                );
            case 'shortlisted':
            case 'accepted':
                return (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border border-purple-200 text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        Shortlisted
                    </Badge>
                );
            case 'interview scheduled':
                return (
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-xs gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        Interview Scheduled
                    </Badge>
                );
            case 'selected':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Selected
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200 text-xs gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        Applied
                    </Badge>
                );
        }
    };

    const getInterviewStatusColor = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'Reschedule Requested':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Completed':
                return 'text-purple-700 bg-purple-50 border-purple-200';
            case 'Cancelled':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-blue-700 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-2 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">
                    Applicant Pipeline ({allApplicants?.applications?.length || 0})
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/admin/interviews')}
                    className="text-xs text-[#6A38C2] border-purple-200 hover:bg-purple-50 cursor-pointer flex items-center gap-1.5"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    View All Scheduled Interviews
                </Button>
            </div>

            <Table>
                <TableCaption>A list of candidates who applied for this role</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Application Status</TableHead>
                        <TableHead>Interview Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allApplicants && allApplicants?.applications?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                                No applicants found for this job listing.
                            </TableCell>
                        </TableRow>
                    ) : (
                        allApplicants &&
                        allApplicants?.applications?.map((item) => {
                            const currentStatus = item.status?.toLowerCase();
                            const isShortlisted = currentStatus === 'shortlisted' || currentStatus === 'accepted';
                            const hasInterviews = item.interviews && item.interviews.length > 0;
                            const latestInterview = hasInterviews
                                ? item.interviews[item.interviews.length - 1]
                                : null;

                            return (
                                <TableRow key={item._id} className="hover:bg-gray-50/70 transition">
                                    <TableCell className="font-medium text-gray-900">
                                        <div>
                                            <span className="font-semibold">{item?.applicant?.fullname || 'Applicant'}</span>
                                            {item.applicationRef && (
                                                <span className="block font-mono text-[11px] text-gray-400">
                                                    {item.applicationRef}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-xs">
                                        {item?.applicant?.email}
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-xs">
                                        {item?.applicant?.phoneNumber || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {item?.applicant?.profile?.resume ? (
                                            <a
                                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-xs font-medium"
                                                href={item.applicant?.profile?.resume}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {item.applicant?.profile?.resumeOriginalName || 'View Resume'}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs">NA</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isShortlisted || currentStatus === 'interview scheduled' ? (
                                            hasInterviews ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[11px] font-medium border ${getInterviewStatusColor(
                                                            latestInterview?.status
                                                        )}`}
                                                    >
                                                        R{latestInterview?.roundNumber || item.interviews.length}: {latestInterview?.round} ({latestInterview?.status})
                                                    </Badge>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenScheduleModal(item)}
                                                        className="text-[11px] text-[#6A38C2] hover:text-[#5b30a6] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                                                    >
                                                        <CalendarPlus className="w-3 h-3" />
                                                        + Next Round
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenScheduleModal(item)}
                                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-7 px-2.5 cursor-pointer flex items-center gap-1"
                                                >
                                                    <CalendarPlus className="w-3.5 h-3.5" />
                                                    Schedule Interview
                                                </Button>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                {currentStatus === 'rejected'
                                                    ? 'Rejected'
                                                    : currentStatus === 'selected'
                                                    ? 'Selected'
                                                    : 'Shortlist to schedule'}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                        {item?.createdAt ? item.createdAt.split('T')[0] : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-52 p-2" align="end">
                                                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                                                    Update Status
                                                </div>
                                                {PIPELINE_STATUSES.map((statusObj) => {
                                                    const isCurrent =
                                                        currentStatus === statusObj.value ||
                                                        (statusObj.value === 'shortlisted' && currentStatus === 'accepted');

                                                    return (
                                                        <div
                                                            key={statusObj.value}
                                                            onClick={() => handleOpenStatusModal(item, statusObj.value)}
                                                            className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition ${
                                                                isCurrent
                                                                    ? 'bg-purple-50 text-[#6A38C2] font-semibold'
                                                                    : 'hover:bg-gray-100 text-gray-700'
                                                            }`}
                                                        >
                                                            <span>Mark {statusObj.label}</span>
                                                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#6A38C2]" />}
                                                        </div>
                                                    );
                                                })}

                                                <div className="border-t border-gray-100 my-1"></div>

                                                <div
                                                    onClick={() => handleOpenHistoryModal(item)}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                                                >
                                                    <History className="w-3.5 h-3.5 text-[#6A38C2]" />
                                                    <span>View Status History</span>
                                                </div>

                                                {isShortlisted && (
                                                    <div
                                                        onClick={() => handleOpenScheduleModal(item)}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-[#6A38C2] hover:bg-purple-50 font-medium cursor-pointer"
                                                    >
                                                        <CalendarPlus className="w-3.5 h-3.5" />
                                                        <span>Schedule Interview</span>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* Recruiter Status Update Dialog with candidate message */}
            <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">
                            Update Applicant Status
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Updating status for candidate{' '}
                            <strong>{targetApplication?.applicant?.fullname}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                New Pipeline Status
                            </Label>
                            <Select value={targetStatus} onValueChange={setTargetStatus}>
                                <SelectTrigger className="w-full text-xs h-9">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PIPELINE_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value} className="text-xs">
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs font-semibold text-gray-700 block">
                                    Candidate-Visible Message (Optional)
                                </Label>
                                <span className="text-[11px] text-gray-400">Included in notification email</span>
                            </div>
                            <textarea
                                rows={3}
                                placeholder={
                                    targetStatus === 'shortlisted'
                                        ? 'e.g. Next step is a 45-minute technical screen...'
                                        : targetStatus === 'rejected'
                                        ? 'e.g. We decided to proceed with candidates having more Kubernetes experience...'
                                        : 'Optional message for candidate...'
                                }
                                value={candidateMessage}
                                onChange={(e) => setCandidateMessage(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6A38C2]/20 focus:border-[#6A38C2]"
                            />
                        </div>

                        {/* Live Email Notification Explainer */}
                        <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-xs text-purple-900">
                            <div className="flex items-start gap-2">
                                <Send className="w-3.5 h-3.5 text-[#6A38C2] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block text-[11px]">Automated Email Notification</span>
                                    <p className="text-[11px] text-purple-700 mt-0.5">
                                        {targetStatus === 'shortlisted'
                                            ? 'An "Application Update" email will be sent informing the candidate they have been shortlisted.'
                                            : targetStatus === 'selected'
                                            ? 'An "Application Selection" congratulations email will be delivered to the candidate.'
                                            : targetStatus === 'rejected'
                                            ? 'A respectful "Application Status Update" email will be sent with your feedback.'
                                            : 'The candidate will receive a notification of this status update.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingStatus}
                            onClick={() => setStatusModalOpen(false)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={updatingStatus}
                            onClick={handleConfirmStatusUpdate}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs gap-1.5"
                        >
                            {updatingStatus ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status & Notify'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Interview Modal */}
            <ScheduleInterviewModal
                isOpen={scheduleModalOpen}
                onClose={() => {
                    setScheduleModalOpen(false);
                    setSelectedApplication(null);
                }}
                application={selectedApplication}
                onInterviewScheduled={handleInterviewScheduled}
            />

            {/* Recruiter History View Modal */}
            <ApplicationTimelineModal
                isOpen={historyModalOpen}
                onClose={() => {
                    setHistoryModalOpen(false);
                    setHistoryApplication(null);
                }}
                application={historyApplication}
                isRecruiterView={true}
            />
        </div>
    );
};

export default JobApplicantsTable;
