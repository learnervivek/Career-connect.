import React, { useState } from 'react';
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
import { Badge } from '../ui/badge';
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    FileText,
    Loader2,
    AlertCircle,
    User,
    Briefcase
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const ROUNDS = ['Technical', 'HR', 'Managerial', 'Other'];
const TYPES = ['Online', 'Phone', 'In-person'];
const DURATION_PRESETS = [15, 30, 45, 60, 90];

const ScheduleInterviewModal = ({ isOpen, onClose, application, onInterviewScheduled }) => {
    // Current min date-time for datetime-local (formatted as YYYY-MM-DDTHH:mm)
    const getMinDateTimeString = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5); // at least 5 mins in future
        const iso = now.toISOString();
        return iso.substring(0, 16);
    };

    const [formData, setFormData] = useState({
        round: 'Technical',
        interviewType: 'Online',
        scheduledDate: '',
        duration: 45,
        meetingUrl: '',
        venue: '',
        instructions: '',
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const applicant = application?.applicant;
    const job = application?.job;

    const validate = () => {
        const newErrors = {};

        if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'Date and time are required';
        } else {
            const chosen = new Date(formData.scheduledDate).getTime();
            if (chosen <= Date.now()) {
                newErrors.scheduledDate = 'Scheduled date and time must be in the future';
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
        // Clear field-specific error as user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (serverError) setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (!validate()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                applicationId: application?._id,
                round: formData.round,
                interviewType: formData.interviewType,
                scheduledDate: new Date(formData.scheduledDate).toISOString(),
                duration: Number(formData.duration),
                meetingUrl: formData.interviewType === 'Online' ? formData.meetingUrl.trim() : '',
                venue: formData.interviewType === 'In-person' ? formData.venue.trim() : '',
                instructions: formData.instructions.trim(),
            };

            const response = await axios.post(`${INTERVIEW_API_END_POINT}`, payload, {
                withCredentials: true,
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Interview scheduled successfully');
                if (onInterviewScheduled) {
                    onInterviewScheduled(response.data.interview);
                }
                handleClose();
            } else {
                setServerError(response.data.message || 'Failed to schedule interview');
                toast.error(response.data.message || 'Scheduling failed');
            }
        } catch (error) {
            console.error('Interview schedule error:', error);
            const msg = error.response?.data?.message || 'Failed to schedule interview. Please try again.';
            setServerError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return; // prevent closing during submission
        setFormData({
            round: 'Technical',
            interviewType: 'Online',
            scheduledDate: '',
            duration: 45,
            meetingUrl: '',
            venue: '',
            instructions: '',
        });
        setErrors({});
        setServerError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#6A38C2]" />
                        Schedule Candidate Interview
                    </DialogTitle>
                    <DialogDescription>
                        Set up an interview round for the shortlisted applicant.
                    </DialogDescription>
                </DialogHeader>

                {/* Candidate & Job Summary Card */}
                <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#6A38C2]" />
                        <span className="font-semibold text-gray-900">{applicant?.fullname || 'Candidate'}</span>
                        <span className="text-gray-500 text-xs">({applicant?.email})</span>
                    </div>
                    {job?.title && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                            <span>Role: <strong className="text-gray-900">{job.title}</strong></span>
                        </div>
                    )}
                </div>

                {/* Server Error Alert Banner */}
                {serverError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>{serverError}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Interview Round & Interview Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="round" className="text-xs font-semibold text-gray-700">
                                Interview Round <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.round}
                                onValueChange={(val) => handleChange('round', val)}
                                disabled={submitting}
                            >
                                <SelectTrigger id="round" className="w-full">
                                    <SelectValue placeholder="Select round" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROUNDS.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.round && <p className="text-xs text-red-600">{errors.round}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="interviewType" className="text-xs font-semibold text-gray-700">
                                Interview Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.interviewType}
                                onValueChange={(val) => handleChange('interviewType', val)}
                                disabled={submitting}
                            >
                                <SelectTrigger id="interviewType" className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.interviewType && <p className="text-xs text-red-600">{errors.interviewType}</p>}
                        </div>
                    </div>

                    {/* Row 2: Date & Time + Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="scheduledDate" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                Date & Time <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="scheduledDate"
                                type="datetime-local"
                                min={getMinDateTimeString()}
                                value={formData.scheduledDate}
                                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                                disabled={submitting}
                                className={errors.scheduledDate ? 'border-red-400 focus-visible:ring-red-400' : ''}
                            />
                            {errors.scheduledDate && (
                                <p className="text-xs text-red-600">{errors.scheduledDate}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="duration" className="text-xs font-semibold text-gray-700">
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
                                id="duration"
                                type="number"
                                min="5"
                                max="480"
                                value={formData.duration}
                                onChange={(e) => handleChange('duration', e.target.value)}
                                disabled={submitting}
                                placeholder="45"
                                className={errors.duration ? 'border-red-400' : ''}
                            />
                            {errors.duration && <p className="text-xs text-red-600">{errors.duration}</p>}
                        </div>
                    </div>

                    {/* Conditional Online Meeting URL */}
                    {formData.interviewType === 'Online' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="meetingUrl" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <Video className="w-3.5 h-3.5 text-blue-600" />
                                Meeting URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="meetingUrl"
                                type="url"
                                placeholder="https://meet.google.com/abc-defg-hij or Zoom link"
                                value={formData.meetingUrl}
                                onChange={(e) => handleChange('meetingUrl', e.target.value)}
                                disabled={submitting}
                                className={errors.meetingUrl ? 'border-red-400' : ''}
                            />
                            {errors.meetingUrl ? (
                                <p className="text-xs text-red-600">{errors.meetingUrl}</p>
                            ) : (
                                <p className="text-[11px] text-gray-400">Paste Google Meet, Zoom, or Microsoft Teams meeting link</p>
                            )}
                        </div>
                    )}

                    {/* Conditional In-person Venue */}
                    {formData.interviewType === 'In-person' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="venue" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-600" />
                                Physical Venue Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="venue"
                                type="text"
                                placeholder="e.g. 4th Floor, Building B, Tech Park, Bangalore"
                                value={formData.venue}
                                onChange={(e) => handleChange('venue', e.target.value)}
                                disabled={submitting}
                                className={errors.venue ? 'border-red-400' : ''}
                            />
                            {errors.venue && <p className="text-xs text-red-600">{errors.venue}</p>}
                        </div>
                    )}

                    {/* Additional Instructions */}
                    <div className="space-y-1.5">
                        <Label htmlFor="instructions" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            Additional Instructions (Optional)
                        </Label>
                        <textarea
                            id="instructions"
                            rows={3}
                            placeholder="e.g. Please bring an updated copy of your resume and keep code samples ready..."
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
                            onClick={handleClose}
                            disabled={submitting}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white flex items-center gap-2 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4" />
                                    Confirm & Schedule
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleInterviewModal;
