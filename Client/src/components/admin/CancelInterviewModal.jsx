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
import { Label } from '../ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const CancelInterviewModal = ({ isOpen, onClose, interview, onInterviewCancelled }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleCancel = async () => {
        setSubmitting(true);
        setError('');
        try {
            const response = await axios.patch(
                `${INTERVIEW_API_END_POINT}/${interview._id}/cancel`,
                { cancellationReason: reason.trim() },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Interview cancelled successfully');
                if (onInterviewCancelled) {
                    onInterviewCancelled(response.data.interview);
                }
                setReason('');
                onClose();
            } else {
                setError(response.data.message || 'Failed to cancel interview');
            }
        } catch (err) {
            console.error('Cancel interview error:', err);
            const msg = err.response?.data?.message || 'Failed to cancel interview';
            setError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Cancel Interview
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel the <strong>{interview?.round || 'interview'}</strong> round with <strong>{interview?.candidate?.fullname || 'the candidate'}</strong>? This action will notify the candidate.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-2 py-1">
                    <Label htmlFor="cancelReason" className="text-xs font-semibold text-gray-700">
                        Reason for Cancellation (Optional)
                    </Label>
                    <textarea
                        id="cancelReason"
                        rows={3}
                        placeholder="e.g. Position filled, scheduling conflict, candidate request..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                        className="cursor-pointer"
                    >
                        Go Back
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="cursor-pointer flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            'Confirm Cancellation'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CancelInterviewModal;
