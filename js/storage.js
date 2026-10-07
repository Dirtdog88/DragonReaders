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
    save.choices ??= 2;
    save.streak ??= 0;
    save.missStreak ??= 0;
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
    choices: 2,   // word buttons per capture (2 or 3)
    streak: 0,    // catches in a row with no wrong pick
    missStreak: 0, // catches in a row that needed a retry
    createdAt: new Date().toISOString(),
  };
}
