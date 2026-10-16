import React, { useState } from "react";
import {
    FileText,
    Edit3,
    Check,
    X,
    Loader2,
    Lock,
    Trash2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";

const TopicNotesEditor = ({
    topicId,
    initialNote = "",
    onSaveNote,
    isAuthenticated = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [note, setNote] = useState(initialNote || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(!!initialNote);

    const hasNote = Boolean(initialNote && initialNote.trim());

    const handleSave = async () => {
        if (!onSaveNote) return;
        try {
            setIsSaving(true);
            await onSaveNote(topicId, note.trim());
            setIsEditing(false);
            if (note.trim()) {
                setIsExpanded(true);
            }
        } catch (err) {
            console.error("Failed to save topic note:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNote(initialNote || "");
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!onSaveNote) return;
        try {
            setIsSaving(true);
            await onSaveNote(topicId, "");
            setNote("");
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to delete note:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="mt-2.5">
            {!isEditing && !hasNote && (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6A38C2] font-medium py-1 px-2 rounded-md hover:bg-purple-50/60 transition-colors"
                >
                    <Edit3 className="size-3 text-[#6A38C2]" />
                    <span>Add personal prep note</span>
                </button>
            )}

            {!isEditing && hasNote && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 text-xs shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                            <FileText className="size-3.5 text-amber-700" />
                            <span>My Preparation Notes</span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-amber-700/80 ml-1">
                                <Lock className="size-2.5" /> Private
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded transition-colors"
                                title="Edit personal note"
                            >
                                <Edit3 className="size-3" />
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Remove note"
                            >
                                <Trash2 className="size-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 text-amber-700 hover:text-amber-900 rounded transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronUp className="size-3.5" />
                                ) : (
                                    <ChevronDown className="size-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {isExpanded && (
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mt-1 font-mono text-[11px] bg-white/70 p-2 rounded-lg border border-amber-100">
                            {initialNote}
                        </p>
                    )}
                </div>
            )}

            {isEditing && (
                <div className="rounded-xl border border-purple-200 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span className="flex items-center gap-1 text-[#6A38C2]">
                            <Edit3 className="size-3.5" />
                            {hasNote ? "Edit Personal Note" : "Add Personal Topic Note"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {note.length} / 1000 characters • strictly private
                        </span>
                    </div>

                    <textarea
                        value={note}
                        maxLength={1000}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Write key formulas, problem patterns, company-specific interview tips, or personal reminders..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6A38C2] focus:ring-1 focus:ring-[#6A38C2] font-mono leading-relaxed"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            onClick={handleCancel}
                            className="h-7 text-xs px-2.5 text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            onClick={handleSave}
                            className="h-7 text-xs px-3 bg-[#6A38C2] hover:bg-[#592ea6] text-white flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : (
                                <Check className="size-3" />
                            )}
                            <span>Save Note</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopicNotesEditor;
