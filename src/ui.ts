import type { JournalEntry } from "./types.js";
import { Mood } from "./types.js";

// DOM references

const form = document.getElementById("entry-form") as HTMLFormElement;
const titleInput = document.getElementById("title") as HTMLInputElement;
const contentInput = document.getElementById("content") as HTMLTextAreaElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const entriesContainer = document.getElementById(
  "entries-container",
) as HTMLDivElement;
const emptyState = document.getElementById("entries-empty") as HTMLDivElement;
const filterSelect = document.getElementById(
  "filter-mood",
) as HTMLSelectElement;
const legacyMoodSelect = document.getElementById(
  "mood",
) as HTMLSelectElement | null;
const toastEl = document.getElementById("toast") as HTMLDivElement;

// Theme toggle

export function initTheme(): void {
  const root = document.documentElement;
  const toggleBtn = document.getElementById(
    "theme-toggle",
  ) as HTMLButtonElement | null;

  // Resolve initial theme: saved preference → system preference → light
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial =
    saved === "dark" || saved === "light"
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

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(
  msg: string,
  type: "success" | "error" = "success",
): void {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast toast--${type} toast--show`;
  toastTimer = setTimeout(() => {
    toastEl.className = "toast";
    toastTimer = null;
  }, 2800);
}

// Mood radio picker helpers

function getMoodRadioValue(): Mood {
  const checked = form.querySelector<HTMLInputElement>(
    'input[name="mood"]:checked',
  );
  return (checked?.value as Mood) ?? Mood.HAPPY;
}

function setMoodRadioValue(mood: Mood): void {
  // Explicitly uncheck all first — programmatic .checked = true doesn't
  // automatically trigger the browser's radio-group deselection of siblings.
  form.querySelectorAll<HTMLInputElement>('input[name="mood"]').forEach((r) => {
    r.checked = false;
  });

  const target = form.querySelector<HTMLInputElement>(
    `input[name="mood"][value="${mood}"]`,
  );
  if (target) {
    target.checked = true;
    if (legacyMoodSelect) legacyMoodSelect.value = mood;
  }
}

function clearMoodRadio(): void {
  // Always reset to Happy so the picker has a visible default after submit
  setMoodRadioValue(Mood.HAPPY);
}

// Sync radio changes → hidden select (kept for any external listeners)
function bindMoodRadioSync(): void {
  form
    .querySelectorAll<HTMLInputElement>('input[name="mood"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        if (legacyMoodSelect) legacyMoodSelect.value = radio.value;
      });
    });
}

// Filter chips

function bindFilterChips(): void {
  const chips = document.querySelectorAll<HTMLButtonElement>(".chip");

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

export function clearForm(): void {
  titleInput.value = "";
  contentInput.value = "";
  clearMoodRadio();
}

export function setFormData(entry: {
  title: string;
  content: string;
  mood: Mood;
}): void {
  titleInput.value = entry.title;
  contentInput.value = entry.content;
  setMoodRadioValue(entry.mood);
}

export function getFormData(): {
  title: string;
  content: string;
  mood: Mood;
} | null {
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

let editingId: string | null = null;

export function setEditMode(id: string | null): void {
  editingId = id;
  const btnLabel = submitBtn.querySelector("span:last-child");
  if (btnLabel) {
    btnLabel.textContent = id ? "Update Entry" : "Save Entry";
  }
}

export function getEditingId(): string | null {
  return editingId;
}

// Render entries

const MOOD_EMOJI: Record<Mood, string> = {
  [Mood.HAPPY]: "😊",
  [Mood.SAD]: "😔",
  [Mood.MOTIVATED]: "💪",
  [Mood.STRESSED]: "😰",
  [Mood.CALM]: "😌",
};

export function renderEntries(
  entries: JournalEntry[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
): void {
  if (entries.length === 0) {
    entriesContainer.innerHTML = "";
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  entriesContainer.innerHTML = entries
    .map(
      (entry) => `
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
      </div>`,
    )
    .join("");

  entriesContainer
    .querySelectorAll<HTMLButtonElement>(".edit-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id) onEdit(id);
      });
    });

  entriesContainer
    .querySelectorAll<HTMLButtonElement>(".delete-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id && confirm("Are you sure you want to delete this entry?")) {
          onDelete(id);
        }
      });
    });
}

// Event binders

export function bindFormSubmit(
  handler: (entry: { title: string; content: string; mood: Mood }) => void,
): void {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData();
    if (data) {
      handler(data);
      showToast("Entry saved ✓");
    }
  });
}

export function bindFilterChange(handler: (mood: Mood | null) => void): void {
  filterSelect.addEventListener("change", () => {
    const value = filterSelect.value;
    handler(value === "all" ? null : (value as Mood));
  });
}

// Init — call once from journal.ts

export function initUI(): void {
  initTheme();
  bindMoodRadioSync();
  bindFilterChips();
}

// XSS protection

function escapeHtml(str: string): string {
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
