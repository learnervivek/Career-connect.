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
import { Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const CompleteInterviewModal = ({ isOpen, onClose, interview, onInterviewCompleted }) => {
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleComplete = async () => {
        setSubmitting(true);
        setError('');
        try {
            const response = await axios.patch(
                `${INTERVIEW_API_END_POINT}/${interview._id}/complete`,
                { feedback: feedback.trim() },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Interview marked as completed');
                if (onInterviewCompleted) {
                    onInterviewCompleted(response.data.interview);
                }
                setFeedback('');
                onClose();
            } else {
                setError(response.data.message || 'Failed to complete interview');
            }
        } catch (err) {
            console.error('Complete interview error:', err);
            const msg = err.response?.data?.message || 'Failed to mark interview as completed';
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
                    <DialogTitle className="text-lg font-bold text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Complete Interview Round
                    </DialogTitle>
                    <DialogDescription>
                        Mark the <strong>{interview?.round || 'interview'}</strong> round with <strong>{interview?.candidate?.fullname || 'the candidate'}</strong> as completed.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-2 py-1">
                    <Label htmlFor="interviewFeedback" className="text-xs font-semibold text-gray-700">
                        Interview Assessment & Feedback (Optional)
                    </Label>
                    <textarea
                        id="interviewFeedback"
                        rows={3}
                        placeholder="e.g. Strong problem-solving skills, communicated clearly, recommend advancing to HR round..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
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
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={handleComplete}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white cursor-pointer flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Mark as Completed'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CompleteInterviewModal;
