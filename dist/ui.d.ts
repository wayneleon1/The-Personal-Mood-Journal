import type { JournalEntry } from "./types.js";
import { Mood } from "./types.js";
export declare function initTheme(): void;
export declare function showToast(msg: string, type?: "success" | "error"): void;
export declare function clearForm(): void;
export declare function setFormData(entry: {
    title: string;
    content: string;
    mood: Mood;
}): void;
export declare function getFormData(): {
    title: string;
    content: string;
    mood: Mood;
} | null;
export declare function setEditMode(id: string | null): void;
export declare function getEditingId(): string | null;
export declare function renderEntries(entries: JournalEntry[], onEdit: (id: string) => void, onDelete: (id: string) => void): void;
export declare function bindFormSubmit(handler: (entry: {
    title: string;
    content: string;
    mood: Mood;
}) => void): void;
export declare function bindFilterChange(handler: (mood: Mood | null) => void): void;
export declare function initUI(): void;
//# sourceMappingURL=ui.d.ts.map