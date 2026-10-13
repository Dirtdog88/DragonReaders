// Letter sounds for blending (c... a... t). A recorded clip is used when one
// exists at audio/letters/<letter>.mp3 (or .m4a); otherwise the device voice
// says a spelled-out approximation. See README for how to add recordings.

import { speak, hush } from './speech.js';
import { sfxOn } from './audio.js';

const BASE = 'audio/letters/';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// The voice reads letter names, so each letter gets a spelled-out sound.
// These are approximations; recordings are better (the voice adds an "uh"
// after stops like k and t, which makes blending harder).
export const SOUNDS = {
  a: 'a', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih',
  j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'o', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss',
  t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
};

const clips = new Map(); // letter -> Audio

// audio/letters/manifest.json lists the recordings that exist, e.g. ["a.mp3", "b.mp3"].
async function loadClips() {
  try {
    const res = await fetch(`${BASE}manifest.json`);
    if (!res.ok) return;
    const files = await res.json();
    if (!Array.isArray(files)) return;
    await Promise.all(files.map(async (name) => {
      const letter = String(name).split('.')[0].toLowerCase();
      if (!LETTERS.includes(letter)) return;
      try {
        const clip = await fetch(BASE + name);
        if (!clip.ok) return;
        const a = new Audio(URL.createObjectURL(await clip.blob()));
        a.preload = 'auto';
        clips.set(letter, a);
      } catch {
        // Missing or offline: the voice fills in.
      }
    }));
  } catch {
    // No manifest: the voice is used for every letter.
  }
}

let loading = null;
export function loadLetterSounds() {
  loading ??= loadClips();
  return loading;
}

export function hasClip(letter) {
  return clips.has(letter);
}

// Says one letter's sound. Returns roughly how long it takes, in ms.
export function sayLetterSound(letter) {
  const clip = clips.get(letter);
  if (clip && sfxOn()) {
    hush();
    try {
      clip.currentTime = 0;
      clip.play();
    } catch {
      speak(SOUNDS[letter] || letter, { rate: 0.7, now: true });
    }
    return Math.max(500, (clip.duration || 0.6) * 1000);
  }
  speak(SOUNDS[letter] || letter, { rate: 0.7, now: true });
  return 750;
}
