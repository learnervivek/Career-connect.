import React from "react";
import { Button } from "../../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

const ArchiveWarningModal = ({
    isOpen,
    onClose,
    company,
    activeRoadmaps = [],
    onConfirm,
    loading = false,
}) => {
    if (!company) return null;

    const hasActiveRoadmaps = activeRoadmaps.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-700 text-base font-bold">
                        <AlertTriangle className="size-5 text-rose-600 shrink-0" />
                        <span>Archive Company Confirmation</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs leading-relaxed text-gray-700">
                    <p>
                        Are you sure you want to archive{" "}
                        <strong className="text-gray-900">{company.companyName}</strong>?
                    </p>

                    {hasActiveRoadmaps ? (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                            <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                                <span>⚠️ Active Roadmaps Warning:</span>
                            </p>
                            <p>
                                This company currently has{" "}
                                <strong>{activeRoadmaps.length} active roadmap(s)</strong>:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 max-h-32 overflow-y-auto">
                                {activeRoadmaps.map((r) => (
                                    <li key={r._id || r.slug} className="truncate">
                                        {r.title} ({r.role})
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[11px] text-amber-800 italic pt-1">
                                Archiving this company will hide it and its tracks from the public catalog. Existing candidate completion records will remain safely preserved in MongoDB.
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            This company has no active roadmaps. It will be hidden from the public Preparation Hub catalog until restored.
                        </p>
                    )}
                </div>

                <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="text-xs h-8"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 gap-1.5"
                    >
                        {loading && <Loader2 className="size-3.5 animate-spin" />}
                        <span>Confirm Archive</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ArchiveWarningModal;
