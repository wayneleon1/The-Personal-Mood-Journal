import { loadEntries, saveEntries } from "./storage.js";
import { Mood } from "./types.js";
import { renderEntries, clearForm, setFormData, setEditMode, getEditingId, bindFormSubmit, bindFilterChange, initUI, } from "./ui.js";
// ---------- Generic utility ----------
export function findByProperty(list, key, value) {
    return list.find((item) => item[key] === value);
}
// ---------- State ----------
let entries = [];
let currentFilter = null;
// ---------- Helper: get filtered entries ----------
function getFilteredEntries() {
    if (!currentFilter)
        return [...entries];
    return entries.filter((entry) => entry.mood === currentFilter);
}
// ---------- Core mutations ----------
export function addEntry(partial) {
    const newEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...partial,
    };
    entries = [newEntry, ...entries];
    saveEntries(entries);
    refreshUI();
}
export function updateEntry(id, updates) {
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1)
        return;
    // Fixed: was accidentally commented out, causing edits to be silently dropped
    entries[index] = { ...entries[index], ...updates };
    saveEntries(entries);
    refreshUI();
}
export function deleteEntry(id) {
    entries = entries.filter((e) => e.id !== id);
    saveEntries(entries);
    refreshUI();
}
export function setFilter(mood) {
    currentFilter = mood;
    refreshUI();
}
// ---------- UI refresh ----------
function refreshUI() {
    const filtered = getFilteredEntries();
    renderEntries(filtered, handleEdit, handleDelete);
}
// ---------- Event handlers ----------
function handleEdit(id) {
    const entry = findByProperty(entries, "id", id);
    if (!entry)
        return;
    setFormData({
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
    });
    setEditMode(id);
}
function handleDelete(id) {
    deleteEntry(id);
    // If we were editing the deleted entry, reset edit mode
    if (getEditingId() === id) {
        setEditMode(null);
        clearForm();
    }
}
function handleFormSubmit(data) {
    const editingId = getEditingId();
    if (editingId) {
        updateEntry(editingId, data);
        setEditMode(null);
    }
    else {
        addEntry(data);
    }
    clearForm();
}
// ---------- Initialization ----------
export function init() {
    initUI();
    entries = loadEntries();
    refreshUI();
    bindFormSubmit(handleFormSubmit);
    bindFilterChange(setFilter);
}
//# sourceMappingURL=journal.js.map