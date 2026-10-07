// Progress is saved on the device. Storage can be blocked (private browsing),
// so every read and write is wrapped and the game still works without it.

const KEY = 'dragon-readers-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
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
    caught: [],
    createdAt: new Date().toISOString(),
  };
}
