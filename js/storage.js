// Progress is saved on the device. Storage can be blocked (private browsing),
// so every read and write is wrapped and the game still works without it.

// Each mode keeps its own progress (the words key predates modes).
const KEYS = { words: 'dragon-readers-save-v1', colors: 'dragon-readers-save-colors-v1' };
const MODE_KEY = 'dragon-readers-mode';

export function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'colors' ? 'colors' : 'words';
  } catch {
    return 'words';
  }
}

export function writeMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not fatal.
  }
}

export function loadSave(mode = 'words') {
  try {
    const raw = localStorage.getItem(KEYS[mode]);
    if (!raw) return null;
    const save = JSON.parse(raw);
    save.caught ??= [];
    save.catches ??= {};
    save.words ??= {};
    save.choices ??= 2;
    save.streak ??= 0;
    save.missStreak ??= 0;
    save.mode = mode;
    return save;
  } catch {
    return null;
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEYS[save.mode] || KEYS.words, JSON.stringify(save));
  } catch {
    // Not fatal: progress just won't persist this session.
  }
}

export function newSave(name, mode = 'words') {
  return {
    name,
    mode,
    map: 'bracken',
    x: null,
    y: null,
    dir: 'down',
    caught: [],   // dragon ids, in the order he caught them
    catches: {},  // dragon id -> times caught
    words: {},    // word -> { right, wrong } for tracking reading progress
    choices: 2,   // word buttons per capture (2 or 3)
    streak: 0,    // catches in a row with no wrong pick
    missStreak: 0, // catches in a row that needed a retry
    createdAt: new Date().toISOString(),
  };
}
