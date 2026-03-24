import type { JournalEntry } from "./types.js";
import { Mood } from "./types.js";
export declare function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined;
export declare function addEntry(partial: Omit<JournalEntry, "id" | "timestamp">): void;
export declare function updateEntry(id: string, updates: Partial<Omit<JournalEntry, "id" | "timestamp">>): void;
export declare function deleteEntry(id: string): void;
export declare function setFilter(mood: Mood | null): void;
export declare function init(): void;
//# sourceMappingURL=journal.d.ts.map