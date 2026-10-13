// Shared audio setup: one Web Audio context unlocked by the first tap, and the
// sound setting (all / no music / silent) saved on the device. The voice that
// reads words is never muted; it is the point of the games.

import { warmUp } from './speech.js';

const KEY = 'arcade-sound';
export const LEVELS = ['all', 'sfx', 'off'];
const ICONS = { all: '\u{1F50A}', sfx: '\u{1F508}', off: '\u{1F507}' };
const LABELS = { all: 'Sound on', sfx: 'Music off', off: 'Sound off' };

let level = loadLevel();
let ctx = null;
let master = null;
const readyFns = [];
const changeFns = [];

function loadLevel() {
  try {
    const v = localStorage.getItem(KEY);
    return LEVELS.includes(v) ? v : 'all';
  } catch {
    return 'all';
  }
}

export function soundLevel() { return level; }
export function sfxOn() { return level !== 'off'; }
export function musicOn() { return level === 'all'; }

export function setSoundLevel(l) {
  level = l;
  try { localStorage.setItem(KEY, l); } catch { /* not fatal */ }
  for (const f of changeFns) f(l);
}
export function onSoundChange(f) { changeFns.push(f); }

export function audioContext() { return ctx; }
export function masterGain() { return master; }
export function onAudioReady(f) { if (ctx) f(ctx, master); else readyFns.push(f); }

function create() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  for (const f of readyFns) f(ctx, master);
}

// Browsers only let sound start after a tap or key press.
function unlock() {
  create();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  warmUp();
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend?.();
  else ctx.resume?.();
});

// A button that cycles sound on -> music off -> sound off. Appended to `host`.
export function mountSoundButton(host = document.body) {
  const b = document.createElement('button');
  b.className = 'sound-btn';
  b.type = 'button';
  const paint = () => {
    b.textContent = ICONS[level];
    b.setAttribute('aria-label', LABELS[level]);
    b.title = LABELS[level];
  };
  b.addEventListener('click', () => {
    setSoundLevel(LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length]);
    paint();
  });
  paint();
  host.appendChild(b);
  return b;
}
