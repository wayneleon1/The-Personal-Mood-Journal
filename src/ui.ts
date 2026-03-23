import type { JournalEntry } from "./types.js";
import { Mood } from "./types.js";

// DOM element references
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

// --- Mood helpers (radio button picker) ---

function getMoodRadioValue(): Mood {
  const checked = form.querySelector<HTMLInputElement>(
    'input[name="mood"]:checked',
  );
  return (checked?.value as Mood) ?? Mood.HAPPY;
}

function setMoodRadioValue(mood: Mood): void {
  const radio = form.querySelector<HTMLInputElement>(
    `input[name="mood"][value="${mood}"]`,
  );
  if (radio) {
    radio.checked = true;
    // Keep the hidden select in sync for any legacy listeners
    const legacySelect = document.getElementById(
      "mood",
    ) as HTMLSelectElement | null;
    if (legacySelect) legacySelect.value = mood;
  }
}

function clearMoodRadio(): void {
  form.querySelectorAll<HTMLInputElement>('input[name="mood"]').forEach((r) => {
    r.checked = false;
  });
  const legacySelect = document.getElementById(
    "mood",
  ) as HTMLSelectElement | null;
  if (legacySelect) legacySelect.value = Mood.HAPPY;
}

// --- Public form API ---

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

// --- Edit mode ---

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

// --- Render entries ---

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

  const moodEmoji: Record<Mood, string> = {
    [Mood.HAPPY]: "😊",
    [Mood.SAD]: "😔",
    [Mood.MOTIVATED]: "💪",
    [Mood.STRESSED]: "😰",
    [Mood.CALM]: "😌",
  };

  entriesContainer.innerHTML = entries
    .map(
      (entry) => `
      <div class="entry" data-id="${entry.id}" data-mood="${entry.mood}">
        <div class="entry-header">
          <h3>${escapeHtml(entry.title)}</h3>
          <span class="mood-badge ${entry.mood}">
            ${moodEmoji[entry.mood]} ${entry.mood}
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
      </div>
    `,
    )
    .join("");

  // Attach event listeners
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) onEdit(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id && confirm("Are you sure you want to delete this entry?")) {
        onDelete(id);
      }
    });
  });
}

// --- Event binders ---

export function bindFormSubmit(
  handler: (entry: { title: string; content: string; mood: Mood }) => void,
): void {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData();
    if (data) handler(data);
  });
}

export function bindFilterChange(handler: (mood: Mood | null) => void): void {
  filterSelect.addEventListener("change", () => {
    const value = filterSelect.value;
    handler(value === "all" ? null : (value as Mood));
  });
}

// --- XSS protection ---
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
