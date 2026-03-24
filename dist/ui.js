import { Mood } from "./types.js";
// DOM references
const form = document.getElementById("entry-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const submitBtn = document.getElementById("submit-btn");
const entriesContainer = document.getElementById("entries-container");
const emptyState = document.getElementById("entries-empty");
const filterSelect = document.getElementById("filter-mood");
const legacyMoodSelect = document.getElementById("mood");
const toastEl = document.getElementById("toast");
// Theme toggle
export function initTheme() {
    const root = document.documentElement;
    const toggleBtn = document.getElementById("theme-toggle");
    // Resolve initial theme: saved preference → system preference → light
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved === "dark" || saved === "light"
        ? saved
        : prefersDark
            ? "dark"
            : "light";
    root.setAttribute("data-theme", initial);
    toggleBtn?.addEventListener("click", () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        const next = isDark ? "light" : "dark";
        root.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
    });
}
// Toast notifications
let toastTimer = null;
export function showToast(msg, type = "success") {
    if (toastTimer)
        clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className = `toast toast--${type} toast--show`;
    toastTimer = setTimeout(() => {
        toastEl.className = "toast";
        toastTimer = null;
    }, 2800);
}
// Mood radio picker helpers
function getMoodRadioValue() {
    const checked = form.querySelector('input[name="mood"]:checked');
    return checked?.value ?? Mood.HAPPY;
}
function setMoodRadioValue(mood) {
    // Explicitly uncheck all first — programmatic .checked = true doesn't
    // automatically trigger the browser's radio-group deselection of siblings.
    form.querySelectorAll('input[name="mood"]').forEach((r) => {
        r.checked = false;
    });
    const target = form.querySelector(`input[name="mood"][value="${mood}"]`);
    if (target) {
        target.checked = true;
        if (legacyMoodSelect)
            legacyMoodSelect.value = mood;
    }
}
function clearMoodRadio() {
    // Always reset to Happy so the picker has a visible default after submit
    setMoodRadioValue(Mood.HAPPY);
}
// Sync radio changes → hidden select (kept for any external listeners)
function bindMoodRadioSync() {
    form
        .querySelectorAll('input[name="mood"]')
        .forEach((radio) => {
        radio.addEventListener("change", () => {
            if (legacyMoodSelect)
                legacyMoodSelect.value = radio.value;
        });
    });
}
// Filter chips
function bindFilterChips() {
    const chips = document.querySelectorAll(".chip");
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.remove("chip--active"));
            chip.classList.add("chip--active");
            filterSelect.value = chip.dataset.mood ?? "all";
            filterSelect.dispatchEvent(new Event("change"));
        });
    });
}
// Public form API
export function clearForm() {
    titleInput.value = "";
    contentInput.value = "";
    clearMoodRadio();
}
export function setFormData(entry) {
    titleInput.value = entry.title;
    contentInput.value = entry.content;
    setMoodRadioValue(entry.mood);
}
export function getFormData() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const mood = getMoodRadioValue();
    if (!title || !content) {
        alert("Title and content are required");
        return null;
    }
    return { title, content, mood };
}
// Edit mode
let editingId = null;
export function setEditMode(id) {
    editingId = id;
    const btnLabel = submitBtn.querySelector("span:last-child");
    if (btnLabel) {
        btnLabel.textContent = id ? "Update Entry" : "Save Entry";
    }
}
export function getEditingId() {
    return editingId;
}
// Render entries
const MOOD_EMOJI = {
    [Mood.HAPPY]: "😊",
    [Mood.SAD]: "😔",
    [Mood.MOTIVATED]: "💪",
    [Mood.STRESSED]: "😰",
    [Mood.CALM]: "😌",
};
export function renderEntries(entries, onEdit, onDelete) {
    if (entries.length === 0) {
        entriesContainer.innerHTML = "";
        if (emptyState)
            emptyState.hidden = false;
        return;
    }
    if (emptyState)
        emptyState.hidden = true;
    entriesContainer.innerHTML = entries
        .map((entry) => `
      <div class="entry" data-id="${entry.id}" data-mood="${entry.mood}">
        <div class="entry-header">
          <h3>${escapeHtml(entry.title)}</h3>
          <span class="mood-badge ${entry.mood}">
            ${MOOD_EMOJI[entry.mood]} ${entry.mood}
          </span>
        </div>
        <p class="entry-content">${escapeHtml(entry.content)}</p>
        <div class="entry-footer">
          <span class="entry-date">${new Date(entry.timestamp).toLocaleString()}</span>
          <div class="entry-actions">
            <button class="edit-btn" data-id="${entry.id}">Edit</button>
            <button class="delete-btn" data-id="${entry.id}">Delete</button>
          </div>
        </div>
      </div>`)
        .join("");
    entriesContainer
        .querySelectorAll(".edit-btn")
        .forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (id)
                onEdit(id);
        });
    });
    entriesContainer
        .querySelectorAll(".delete-btn")
        .forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            if (id && confirm("Are you sure you want to delete this entry?")) {
                onDelete(id);
            }
        });
    });
}
// Event binders
export function bindFormSubmit(handler) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = getFormData();
        if (data) {
            handler(data);
            showToast("Entry saved ✓");
        }
    });
}
export function bindFilterChange(handler) {
    filterSelect.addEventListener("change", () => {
        const value = filterSelect.value;
        handler(value === "all" ? null : value);
    });
}
// Init — call once from journal.ts
export function initUI() {
    initTheme();
    bindMoodRadioSync();
    bindFilterChips();
}
// XSS protection
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => {
        switch (m) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return m;
        }
    });
}
//# sourceMappingURL=ui.js.map