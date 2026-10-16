import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    FileText,
    Loader2,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const TYPES = ['Online', 'Phone', 'In-person'];
const DURATION_PRESETS = [15, 30, 45, 60, 90];

const RescheduleInterviewModal = ({ isOpen, onClose, interview, onInterviewUpdated }) => {
    const getMinDateTimeString = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now.toISOString().substring(0, 16);
    };

    const [formData, setFormData] = useState({
        scheduledDate: '',
        duration: 45,
        interviewType: 'Online',
        meetingUrl: '',
        venue: '',
        instructions: '',
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (interview) {
            let initialDate = '';
            if (interview.scheduledDate) {
                try {
                    const d = new Date(interview.scheduledDate);
                    // Format for datetime-local
                    const offset = d.getTimezoneOffset() * 60000;
                    const localIso = new Date(d.getTime() - offset).toISOString().substring(0, 16);
                    initialDate = localIso;
                } catch (_) {
                    initialDate = '';
                }
            }

            setFormData({
                scheduledDate: initialDate,
                duration: interview.duration || 45,
                interviewType: interview.interviewType || 'Online',
                meetingUrl: interview.meetingUrl || '',
                venue: interview.venue || '',
                instructions: interview.instructions || '',
            });
            setErrors({});
            setServerError('');
        }
    }, [interview, isOpen]);

    const validate = () => {
        const newErrors = {};

        if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'New date and time are required';
        } else {
            const chosen = new Date(formData.scheduledDate).getTime();
            if (chosen <= Date.now()) {
                newErrors.scheduledDate = 'Rescheduled date and time must be in the future';
            }
        }

        const dur = Number(formData.duration);
        if (!dur || dur < 5 || dur > 480) {
            newErrors.duration = 'Duration must be between 5 and 480 minutes';
        }

        if (formData.interviewType === 'Online') {
            if (!formData.meetingUrl || !formData.meetingUrl.trim()) {
                newErrors.meetingUrl = 'Meeting link is required for online interviews';
            } else if (!/^https?:\/\/.+/i.test(formData.meetingUrl.trim())) {
                newErrors.meetingUrl = 'Must be a valid URL starting with https:// or http://';
            }
        }

        if (formData.interviewType === 'In-person') {
            if (!formData.venue || formData.venue.trim().length < 3) {
                newErrors.venue = 'Physical venue location is required (min 3 characters)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (serverError) setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                scheduledDate: new Date(formData.scheduledDate).toISOString(),
                duration: Number(formData.duration),
                interviewType: formData.interviewType,
                meetingUrl: formData.interviewType === 'Online' ? formData.meetingUrl.trim() : '',
                venue: formData.interviewType === 'In-person' ? formData.venue.trim() : '',
                instructions: formData.instructions.trim(),
            };

            const response = await axios.patch(
                `${INTERVIEW_API_END_POINT}/${interview._id}/reschedule`,
                payload,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Interview rescheduled successfully');
                if (onInterviewUpdated) {
                    onInterviewUpdated(response.data.interview);
                }
                onClose();
            } else {
                setServerError(response.data.message || 'Failed to reschedule interview');
            }
        } catch (error) {
            console.error('Error rescheduling interview:', error);
            const msg = error.response?.data?.message || 'Failed to reschedule interview';
            setServerError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                        Reschedule Interview
                    </DialogTitle>
                    <DialogDescription>
                        Update the date, time, or location details for {interview?.candidate?.fullname || 'the candidate'}.
                    </DialogDescription>
                </DialogHeader>

                {/* Candidate Reschedule Request Reason Banner */}
                {interview?.status === 'Reschedule Requested' && interview?.rescheduleReason && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            Candidate Requested Rescheduling:
                        </p>
                        <p className="italic pl-5">"{interview.rescheduleReason}"</p>
                    </div>
                )}

                {/* Server Error Alert Banner */}
                {serverError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>{serverError}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Date & Time + Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="rescheduleDate" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                New Date & Time <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="rescheduleDate"
                                type="datetime-local"
                                min={getMinDateTimeString()}
                                value={formData.scheduledDate}
                                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                                disabled={submitting}
                                className={errors.scheduledDate ? 'border-red-400' : ''}
                            />
                            {errors.scheduledDate && (
                                <p className="text-xs text-red-600">{errors.scheduledDate}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rescheduleDuration" className="text-xs font-semibold text-gray-700">
                                    Duration (Minutes) <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-1">
                                    {DURATION_PRESETS.map((m) => (
                                        <button
                                            type="button"
                                            key={m}
                                            onClick={() => handleChange('duration', m)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition ${Number(formData.duration) === m
                                                ? 'bg-[#6A38C2] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Input
                                id="rescheduleDuration"
                                type="number"
                                min="5"
                                max="480"
                                value={formData.duration}
                                onChange={(e) => handleChange('duration', e.target.value)}
                                disabled={submitting}
                                className={errors.duration ? 'border-red-400' : ''}
                            />
                            {errors.duration && <p className="text-xs text-red-600">{errors.duration}</p>}
                        </div>
                    </div>

                    {/* Interview Type */}
                    <div className="space-y-1.5">
                        <Label htmlFor="rescheduleType" className="text-xs font-semibold text-gray-700">
                            Interview Type
                        </Label>
                        <Select
                            value={formData.interviewType}
                            onValueChange={(val) => handleChange('interviewType', val)}
                            disabled={submitting}
                        >
                            <SelectTrigger id="rescheduleType" className="w-full">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Online Meeting URL */}
                    {formData.interviewType === 'Online' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rescheduleMeetingUrl" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <Video className="w-3.5 h-3.5 text-blue-600" />
                                Meeting URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="rescheduleMeetingUrl"
                                type="url"
                                placeholder="https://meet.google.com/xyz or Zoom link"
                                value={formData.meetingUrl}
                                onChange={(e) => handleChange('meetingUrl', e.target.value)}
                                disabled={submitting}
                                className={errors.meetingUrl ? 'border-red-400' : ''}
                            />
                            {errors.meetingUrl && <p className="text-xs text-red-600">{errors.meetingUrl}</p>}
                        </div>
                    )}

                    {/* In-person Venue */}
                    {formData.interviewType === 'In-person' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rescheduleVenue" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-600" />
                                Physical Venue Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="rescheduleVenue"
                                type="text"
                                placeholder="Office address or conference room"
                                value={formData.venue}
                                onChange={(e) => handleChange('venue', e.target.value)}
                                disabled={submitting}
                                className={errors.venue ? 'border-red-400' : ''}
                            />
                            {errors.venue && <p className="text-xs text-red-600">{errors.venue}</p>}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-1.5">
                        <Label htmlFor="rescheduleInstructions" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            Updated Instructions (Optional)
                        </Label>
                        <textarea
                            id="rescheduleInstructions"
                            rows={2}
                            value={formData.instructions}
                            onChange={(e) => handleChange('instructions', e.target.value)}
                            disabled={submitting}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <DialogFooter className="pt-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Rescheduling...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="w-4 h-4" />
                                    Save & Reschedule
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RescheduleInterviewModal;
