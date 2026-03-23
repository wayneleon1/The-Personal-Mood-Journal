import type { JournalEntry, Journal } from "./types.js";
import { Mood } from "./types.js";

const STORAGE_KEY = "mood_journal";

// Type guard to validate stored data
function isValidEntry(entry: any): entry is JournalEntry {
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.content === "string" &&
    Object.values(Mood).includes(entry.mood) &&
    typeof entry.timestamp === "number"
  );
}

function isValidJournal(data: any): data is Journal {
  return Array.isArray(data) && data.every(isValidEntry);
}

export function loadEntries(): Journal {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return isValidJournal(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Journal): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
