// Progress is saved on the device. Storage can be blocked (private browsing),
// so every read and write is wrapped and the game still works without it.

const KEY = 'dragon-readers-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    save.caught ??= [];
    save.catches ??= {};
    save.words ??= {};
    return save;
  } catch {
    return null;
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Not fatal: progress just won't persist this session.
  }
}

export function newSave(name) {
  return {
    name,
    map: 'bracken',
    x: null,
    y: null,
    dir: 'down',
    caught: [],   // dragon ids, in the order he caught them
    catches: {},  // dragon id -> times caught
    words: {},    // word -> { right, wrong } for tracking reading progress
    createdAt: new Date().toISOString(),
  };
}
