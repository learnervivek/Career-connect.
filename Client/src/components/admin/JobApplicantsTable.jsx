import React, { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MoreHorizontal, CalendarPlus, Calendar, Clock, Video, MapPin, CheckCircle2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import axios from 'axios';
import { APPLICANT_API_END_POINT } from '@/utils/constant';
import { setAllApplicants } from '@/redux/applicationSlice';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { useNavigate } from 'react-router-dom';

const shortListingStatus = ["Accepted", "Rejected"];

const JobApplicantsTable = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { allApplicants } = useSelector(store => store.application);

    // Modal state for scheduling interview
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    const statusHandler = async (status, id) => {
        try {
            const response = await axios.post(
                `${APPLICANT_API_END_POINT}/status/${id}/update`,
                { status: status.toLowerCase() },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message);

                // Update Redux state directly so UI reflects change immediately
                if (allApplicants && allApplicants.applications) {
                    const updatedApps = allApplicants.applications.map(app => {
                        if (app._id === id) {
                            return { ...app, status: status.toLowerCase() };
                        }
                        return app;
                    });
                    dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }));
                }
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleOpenScheduleModal = (application) => {
        // Construct clean application object for modal with job info
        const appWithJob = {
            ...application,
            job: {
                _id: allApplicants?._id,
                title: allApplicants?.title,
                company: allApplicants?.company,
            }
        };
        setSelectedApplication(appWithJob);
        setScheduleModalOpen(true);
    };

    const handleInterviewScheduled = (newInterview) => {
        // Update application's interviews in Redux
        if (allApplicants && allApplicants.applications) {
            const updatedApps = allApplicants.applications.map(app => {
                if (app._id === newInterview.application) {
                    const existingInterviews = app.interviews || [];
                    return {
                        ...app,
                        status: 'accepted', // ensure accepted
                        interviews: [...existingInterviews, newInterview],
                    };
                }
                return app;
            });
            dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }));
        }
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === 'accepted') {
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">Accepted</Badge>;
        }
        if (s === 'rejected') {
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">Rejected</Badge>;
        }
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200">Pending</Badge>;
    };

    const getInterviewStatusColor = (status) => {
        switch (status) {
            case 'Confirmed': return 'text-green-700 bg-green-50 border-green-200';
            case 'Reschedule Requested': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Completed': return 'text-purple-700 bg-purple-50 border-purple-200';
            case 'Cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-blue-700 bg-blue-50 border-blue-200';
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
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Application Status</TableHead>
                        <TableHead>Interview Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
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
                        allApplicants && allApplicants?.applications?.map((item) => {
                            const isAccepted = item.status?.toLowerCase() === 'accepted';
                            const hasInterviews = item.interviews && item.interviews.length > 0;
                            const latestInterview = hasInterviews ? item.interviews[item.interviews.length - 1] : null;

                            return (
                                <TableRow key={item._id} className="hover:bg-gray-50/70 transition">
                                    <TableCell className="font-medium text-gray-900">
                                        {item?.applicant?.fullname || 'Applicant'}
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
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                    <TableCell>
                                        {isAccepted ? (
                                            hasInterviews ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <div className="flex items-center gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[11px] font-medium border ${getInterviewStatusColor(latestInterview?.status)}`}
                                                        >
                                                            R{latestInterview?.roundNumber || item.interviews.length}: {latestInterview?.round} ({latestInterview?.status})
                                                        </Badge>
                                                    </div>
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
                                                {item.status?.toLowerCase() === 'rejected' ? 'Rejected' : 'Shortlist to schedule'}
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
                                            <PopoverContent className="w-44 p-2" align="end">
                                                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                                                    Application Status
                                                </div>
                                                {shortListingStatus?.map((status, index) => {
                                                    const isCurrent = item.status?.toLowerCase() === status.toLowerCase();
                                                    return (
                                                        <div
                                                            onClick={() => statusHandler(status, item._id)}
                                                            key={index}
                                                            className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition ${isCurrent
                                                                ? 'bg-purple-50 text-[#6A38C2] font-semibold'
                                                                : 'hover:bg-gray-100 text-gray-700'
                                                                }`}
                                                        >
                                                            <span>Mark {status}</span>
                                                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#6A38C2]" />}
                                                        </div>
                                                    );
                                                })}

                                                {isAccepted && (
                                                    <>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <div
                                                            onClick={() => handleOpenScheduleModal(item)}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-[#6A38C2] hover:bg-purple-50 font-medium cursor-pointer"
                                                        >
                                                            <CalendarPlus className="w-3.5 h-3.5" />
                                                            <span>Schedule Interview</span>
                                                        </div>
                                                    </>
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
        </div>
    );
};

export default JobApplicantsTable;
