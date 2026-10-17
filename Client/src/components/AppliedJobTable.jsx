import React, { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    Clock,
    Search,
    CheckCircle2,
    Calendar,
    Sparkles,
    XCircle,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    Building2,
} from 'lucide-react';
import ApplicationTimelineModal from './ApplicationTimelineModal';

const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'applied':
        case 'pending':
            return (
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    Applied
                </Badge>
            );
        case 'under review':
            return (
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <Search className="w-3 h-3 text-amber-500" />
                    Under Review
                </Badge>
            );
        case 'shortlisted':
        case 'accepted':
            return (
                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-500" />
                    Shortlisted
                </Badge>
            );
        case 'interview scheduled':
            return (
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    Interview Scheduled
                </Badge>
            );
        case 'selected':
            return (
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Selected
                </Badge>
            );
        case 'rejected':
            return (
                <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    Rejected
                </Badge>
            );
        case 'withdrawn':
            return (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs px-2.5 py-0.5 font-medium gap-1">
                    <AlertCircle className="w-3 h-3 text-slate-500" />
                    Withdrawn
                </Badge>
            );
        default:
            return (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-0.5 font-medium">
                    {status || 'Applied'}
                </Badge>
            );
    }
};

const AppliedJobTable = () => {
    const { allAppliedJobs } = useSelector((store) => store.job);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [timelineModalOpen, setTimelineModalOpen] = useState(false);

    const handleOpenTimeline = (app) => {
        setSelectedApplication(app);
        setTimelineModalOpen(true);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2">
                <span className="text-xs text-slate-500">
                    Showing your recent applications. For advanced search, filters, and interview coordination, use the dedicated tracking dashboard.
                </span>
                <Link
                    to="/my-applications"
                    className="inline-flex items-center gap-1.5 text-xs text-[#6A38C2] font-bold hover:underline shrink-0"
                >
                    Full Applications Dashboard
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            <Table>
                <TableCaption>A list of your applied jobs and real-time status</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ref ID</TableHead>
                        <TableHead>Date Applied</TableHead>
                        <TableHead>Job Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Timeline</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(!allAppliedJobs || allAppliedJobs.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                                You haven't applied to any jobs yet.{' '}
                                <Link to="/jobs" className="text-[#6A38C2] font-semibold hover:underline">
                                    Browse opportunities
                                </Link>
                            </TableCell>
                        </TableRow>
                    )}

                    {allAppliedJobs &&
                        allAppliedJobs.map((item) => (
                            <TableRow key={item._id} className="hover:bg-slate-50/70 transition">
                                <TableCell className="font-mono text-xs text-slate-400">
                                    {item.applicationRef || `APP-${item._id?.slice(-6).toUpperCase()}`}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600">
                                    {item.createdAt ? item.createdAt.split('T')[0] : '—'}
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900 text-xs sm:text-sm">
                                    {item.job?.title || 'Job Listing'}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                        {item.job?.company?.companyName || 'Company'}
                                    </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        onClick={() => handleOpenTimeline(item)}
                                        className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-7 px-2.5 rounded-lg cursor-pointer"
                                    >
                                        Track
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>

            {/* Timeline Dialog */}
            <ApplicationTimelineModal
                isOpen={timelineModalOpen}
                onClose={() => {
                    setTimelineModalOpen(false);
                    setSelectedApplication(null);
                }}
                application={selectedApplication}
            />
        </div>
    );
};

export default AppliedJobTable;
