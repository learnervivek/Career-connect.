import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RotateCcw, Clock, AlertCircle, Loader2, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const CandidateRequestRescheduleModal = ({ isOpen, onClose, interview, onRescheduleRequested }) => {
    const getMinDateTimeString = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        return now.toISOString().substring(0, 16);
    };

    const [reason, setReason] = useState('');
    const [proposedDate, setProposedDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!reason || reason.trim().length < 5) {
            setError('Please provide a reason of at least 5 characters explaining why you need to reschedule.');
            return;
        }

        if (proposedDate) {
            const chosen = new Date(proposedDate).getTime();
            if (chosen <= Date.now()) {
                setError('Proposed date and time must be in the future.');
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                rescheduleReason: reason.trim(),
                ...(proposedDate ? { proposedDate: new Date(proposedDate).toISOString() } : {})
            };

            const response = await axios.patch(
                `${INTERVIEW_API_END_POINT}/${interview._id}/reschedule-request`,
                payload,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Reschedule request sent to recruiter');
                if (onRescheduleRequested) {
                    onRescheduleRequested(response.data.interview);
                }
                setReason('');
                setProposedDate('');
                onClose();
            } else {
                setError(response.data.message || 'Failed to submit reschedule request');
            }
        } catch (err) {
            console.error('Error submitting reschedule request:', err);
            const msg = err.response?.data?.message || 'Failed to request rescheduling';
            setError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setReason('');
        setProposedDate('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                        Request Interview Reschedule
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Ask the recruiter to reschedule your <strong>{interview?.round || 'interview'}</strong> round for{' '}
                        <strong>{interview?.job?.title || 'this role'}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {/* Notice banner */}
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                        Your current scheduled time remains active until the recruiter reviews your request and confirms a new time slot.
                    </p>
                </div>

                {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="candidateReason" className="text-xs font-semibold text-gray-700">
                            Reason for Rescheduling <span className="text-red-500">*</span>
                        </Label>
                        <textarea
                            id="candidateReason"
                            rows={3}
                            placeholder="e.g. Prior academic exam at this time, power outage, or illness. Please include times you are free..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            disabled={submitting}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                        />
                        <p className="text-[11px] text-gray-400">Minimum 5 characters</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proposedDate" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            Preferred Alternative Date & Time (Optional)
                        </Label>
                        <Input
                            id="proposedDate"
                            type="datetime-local"
                            min={getMinDateTimeString()}
                            value={proposedDate}
                            onChange={(e) => {
                                setProposedDate(e.target.value);
                                if (error) setError('');
                            }}
                            disabled={submitting}
                            className="text-xs"
                        />
                        <p className="text-[11px] text-gray-400">Suggest a date and time that works better for you</p>
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
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="w-4 h-4" />
                                    Send Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CandidateRequestRescheduleModal;
