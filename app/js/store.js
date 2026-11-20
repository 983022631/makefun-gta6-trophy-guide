// Progress store: earned trophies and settings live in this browser only (localStorage),
// and move between browsers as an exported JSON file. No network, no account.
export const PROGRESS_KEY = 'gta6-trophy-progress-v1';
export const SETTINGS_KEY = 'gta6-trophy-settings-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { spoiler: Boolean(parsed && parsed.spoiler) };
  } catch {
    return { spoiler: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Exported file format: { app, version, earned: [names], spoiler, exportedAt }.
export function exportFile(earned, spoiler) {
  const payload = {
    app: 'gta6-trophy-guide',
    version: 1,
    earned: [...earned],
    spoiler: Boolean(spoiler),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Import: keep only names the trophy list actually holds; anything else is ignored.
export async function importFile(file, knownNames) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('Not a progress file: no earned list found.');
  const known = new Set(knownNames);
  const earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
  const spoiler = Boolean(parsed && typeof parsed === 'object' && parsed.spoiler);
  return { earned, spoiler, kept: earned.size, dropped: names.length - earned.size };
}
