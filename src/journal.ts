import { loadEntries, saveEntries } from "./storage.js";
import type { JournalEntry, Journal } from "./types.js";
import { Mood } from "./types.js";

import {
  renderEntries,
  clearForm,
  setFormData,
  setEditMode,
  getEditingId,
  bindFormSubmit,
  bindFilterChange,
} from "./ui.js";

// ---------- Generic utility ----------
export function findByProperty<T>(
  list: T[],
  key: keyof T,
  value: T[keyof T],
): T | undefined {
  return list.find((item) => item[key] === value);
}

// ---------- State ----------
let entries: Journal = [];
let currentFilter: Mood | null = null;

// ---------- Helper: get filtered entries ----------
function getFilteredEntries(): Journal {
  if (!currentFilter) return [...entries];
  return entries.filter((entry) => entry.mood === currentFilter);
}

// ---------- Core mutations ----------
export function addEntry(
  partial: Omit<JournalEntry, "id" | "timestamp">,
): void {
  const newEntry: JournalEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...partial,
  };
  entries = [newEntry, ...entries];
  saveEntries(entries);
  refreshUI();
}

export function updateEntry(
  id: string,
  updates: Partial<Omit<JournalEntry, "id" | "timestamp">>,
): void {
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return;

  // Fixed: was accidentally commented out, causing edits to be silently dropped

  entries[index] = { ...entries[index], ...updates };
  saveEntries(entries);
  refreshUI();
}

export function deleteEntry(id: string): void {
  entries = entries.filter((e) => e.id !== id);
  saveEntries(entries);
  refreshUI();
}

export function setFilter(mood: Mood | null): void {
  currentFilter = mood;
  refreshUI();
}

// ---------- UI refresh ----------
function refreshUI(): void {
  const filtered = getFilteredEntries();
  renderEntries(filtered, handleEdit, handleDelete);
}

// ---------- Event handlers ----------
function handleEdit(id: string): void {
  const entry = findByProperty(entries, "id", id);
  if (!entry) return;

  setFormData({
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
  });
  setEditMode(id);
}

function handleDelete(id: string): void {
  deleteEntry(id);
  // If we were editing the deleted entry, reset edit mode
  if (getEditingId() === id) {
    setEditMode(null);
    clearForm();
  }
}

function handleFormSubmit(data: {
  title: string;
  content: string;
  mood: Mood;
}): void {
  const editingId = getEditingId();
  if (editingId) {
    updateEntry(editingId, data);
    setEditMode(null);
  } else {
    addEntry(data);
  }
  clearForm();
}

// ---------- Initialization ----------
export function init(): void {
  entries = loadEntries();
  refreshUI();
  bindFormSubmit(handleFormSubmit);
  bindFilterChange(setFilter);
}
