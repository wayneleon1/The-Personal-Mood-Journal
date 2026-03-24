import { Mood } from "./types.js";
const STORAGE_KEY = "mood_journal";
// Type guard to validate stored data
function isValidEntry(entry) {
    return (typeof entry.id === "string" &&
        typeof entry.title === "string" &&
        typeof entry.content === "string" &&
        Object.values(Mood).includes(entry.mood) &&
        typeof entry.timestamp === "number");
}
function isValidJournal(data) {
    return Array.isArray(data) && data.every(isValidEntry);
}
export function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return isValidJournal(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
export function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
//# sourceMappingURL=storage.js.map