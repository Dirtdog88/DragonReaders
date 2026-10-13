// Background music: short chiptune loops played by a tiny step sequencer on
// Web Audio (no sound files). Each track is a few voices; every token is an
// eighth note, '-' is a rest and '_' holds the previous note.

import { audioContext, masterGain, onAudioReady, musicOn, onSoundChange } from './audio.js';

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function hz(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 0;
  const n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((n - 69) / 12);
}

// "C5 _ E5 - | G5 ..." -> [{ at, f, len }] in eighths, plus the loop length.
function parse(seq) {
  const tokens = seq.split(/\s+/).filter((t) => t && t !== '|');
  const notes = [];
  tokens.forEach((t, i) => {
    if (t === '-') return;
    if (t === '_') { if (notes.length) notes[notes.length - 1].len++; return; }
    notes.push({ at: i, f: hz(t), len: 1 });
  });
  return { notes, length: tokens.length };
}

const TRACKS = {
  arcade: { bpm: 130, voices: [
    { type: 'square', vol: 0.04, seq: 'C5 E5 G5 C6 G5 E5 C5 - | D5 F5 A5 D6 A5 F5 D5 - | E5 G5 B5 E6 B5 G5 E5 - | G5 _ F5 _ E5 _ D5 _' },
    { type: 'triangle', vol: 0.07, seq: 'C3 - G2 - C3 - G2 - | D3 - A2 - D3 - A2 - | E3 - B2 - E3 - B2 - | G2 - G2 - G2 - B2 -' },
  ] },
  castle: { bpm: 116, voices: [
    { type: 'square', vol: 0.035, seq: 'E5 _ G5 _ A5 G5 E5 D5 | C5 _ D5 _ E5 _ - - | E5 _ G5 _ A5 G5 E5 D5 | C5 _ D5 _ C5 _ - - | G5 _ A5 G5 E5 _ D5 C5 | D5 _ E5 D5 C5 _ A4 G4 | C5 _ E5 _ G5 _ E5 D5 | C5 _ _ _ - - - -' },
    { type: 'triangle', vol: 0.07, seq: 'C3 - C3 - G2 - G2 - | A2 - A2 - E2 - E2 - | F2 - F2 - C3 - C3 - | G2 - G2 - G2 - B2 - | C3 - C3 - G2 - G2 - | A2 - A2 - E2 - E2 - | F2 - F2 - C3 - C3 - | G2 - G2 - G2 - B2 -' },
  ] },
  cave: { bpm: 92, voices: [
    { type: 'triangle', vol: 0.06, seq: 'A4 _ _ _ C5 _ B4 _ | A4 _ _ _ - - - - | E5 _ _ _ D5 _ C5 _ | B4 _ _ _ - - - - | A4 _ C5 _ E5 _ _ _ | D5 _ C5 _ B4 _ _ _ | C5 _ B4 _ A4 _ _ _ | - - - - - - - -' },
    { type: 'sine', vol: 0.09, seq: 'A2 _ _ _ _ _ _ _ | A2 _ _ _ _ _ _ _ | F2 _ _ _ _ _ _ _ | E2 _ _ _ _ _ _ _ | A2 _ _ _ _ _ _ _ | D2 _ _ _ _ _ _ _ | E2 _ _ _ _ _ _ _ | E2 _ _ _ _ _ _ _' },
  ] },
  volcano: { bpm: 150, voices: [
    { type: 'square', vol: 0.035, seq: 'D5 D5 F5 D5 A5 _ G5 F5 | E5 E5 G5 E5 A5 _ G5 E5 | D5 D5 F5 D5 A5 _ C6 _ | A5 _ G5 _ F5 _ E5 _ | D5 D5 F5 D5 A5 _ G5 F5 | E5 E5 G5 E5 Bb5 _ A5 G5 | A5 _ F5 _ D5 _ F5 _ | D5 _ _ _ - - - -' },
    { type: 'sawtooth', vol: 0.035, seq: 'D2 D2 D3 D2 D2 D2 D3 D2 | A2 A2 A3 A2 A2 A2 A3 A2 | D2 D2 D3 D2 D2 D2 D3 D2 | A2 A2 A3 A2 C3 C3 C3 C3 | D2 D2 D3 D2 D2 D2 D3 D2 | A2 A2 A3 A2 Bb2 Bb2 Bb3 Bb2 | A2 A2 A3 A2 A2 A2 A3 A2 | D2 D2 D3 D2 D2 _ _ _' },
  ] },
  dreamland: { bpm: 144, voices: [
    { type: 'square', vol: 0.035, seq: 'A5 _ C6 _ A5 G5 F5 _ | G5 _ A5 G5 F5 _ - - | A5 _ C6 _ A5 G5 F5 _ | G5 _ F5 _ E5 _ - - | F5 G5 A5 _ C6 _ A5 _ | Bb5 _ A5 G5 F5 _ - - | G5 A5 Bb5 _ A5 _ G5 _ | F5 _ _ _ - - - -' },
    { type: 'triangle', vol: 0.07, seq: 'F2 - F3 - C3 - F3 - | Bb2 - Bb3 - C3 - C3 - | F2 - F3 - C3 - F3 - | C3 - C3 - C3 - E3 - | F2 - F3 - A2 - A3 - | Bb2 - Bb3 - C3 - C3 - | Bb2 - Bb3 - C3 - C3 - | F2 - F3 - F2 - - -' },
  ] },
  city: { bpm: 126, voices: [
    { type: 'triangle', vol: 0.06, seq: 'G4 _ B4 _ D5 _ F5 D5 | B4 _ D5 _ G5 _ - - | F5 _ D5 _ B4 _ G4 _ | A4 _ B4 _ D5 _ - - | G4 _ B4 _ D5 _ F5 D5 | E5 _ D5 _ B4 _ - - | C5 _ B4 _ A4 _ F4 _ | G4 _ _ _ - - - -' },
    { type: 'square', vol: 0.025, seq: 'G2 - G2 D3 G2 - F3 D3 | G2 - G2 D3 G2 - F3 D3 | F2 - F2 C3 F2 - F2 C3 | D2 - D2 A2 D2 - D2 A2 | G2 - G2 D3 G2 - F3 D3 | E2 - E2 B2 E2 - E2 B2 | C2 - C2 G2 C2 - C2 G2 | D2 - D2 A2 D2 - D2 A2' },
  ] },
  spooky: { bpm: 100, voices: [
    { type: 'triangle', vol: 0.06, seq: 'E5 _ _ G5 _ _ B4 _ | _ _ _ - - - C5 _ | B4 _ _ A4 _ _ G4 _ | _ _ _ - - - F#4 _ | E5 _ _ G5 _ _ B4 _ | _ _ _ - - - C5 _ | B4 _ _ E5 _ _ D#5 _ | E5 _ _ _ _ _ - -' },
    { type: 'sine', vol: 0.09, seq: 'E2 _ _ E2 _ _ E2 _ | _ _ _ B2 _ _ B2 _ | C2 _ _ C2 _ _ C2 _ | _ _ _ B2 _ _ B2 _ | E2 _ _ E2 _ _ E2 _ | _ _ _ A2 _ _ A2 _ | B2 _ _ B2 _ _ B2 _ | E2 _ _ _ _ _ - -' },
  ] },
};

let current = null; // track name
let timer = 0;
let pos = 0;
let nextTime = 0;
let parsed = null;
let gain = null;

function voiceNote(ctx, v, f, start, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = v.type;
  o.frequency.setValueAtTime(f, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(v.vol, start + 0.012);
  g.gain.setValueAtTime(v.vol, Math.max(start + 0.012, start + dur - 0.04));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(gain);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function schedule() {
  const ctx = audioContext();
  if (!ctx || !parsed) return;
  const step = 60 / parsed.bpm / 2;
  while (nextTime < ctx.currentTime + 0.3) {
    for (const v of parsed.voices) {
      const at = pos % v.length;
      const n = v.notes.find((x) => x.at === at);
      if (n && n.f) voiceNote(ctx, v, n.f, nextTime, n.len * step * 0.95);
    }
    pos++;
    nextTime += step;
  }
}

function start() {
  const ctx = audioContext();
  if (!ctx || !current || timer || !musicOn()) return;
  const t = TRACKS[current];
  parsed = { bpm: t.bpm, voices: t.voices.map((v) => ({ ...v, ...parse(v.seq) })) };
  if (!gain) { gain = ctx.createGain(); gain.connect(masterGain()); }
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
  pos = 0;
  nextTime = ctx.currentTime + 0.05;
  schedule();
  timer = setInterval(schedule, 80);
}

function stop() {
  if (timer) { clearInterval(timer); timer = 0; }
  const ctx = audioContext();
  if (ctx && gain) {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
  }
  parsed = null;
}

export const music = {
  // Switch to a track (keeps playing if it is already the one on).
  play(name) {
    if (!TRACKS[name]) return;
    if (current === name && timer) return;
    stop();
    current = name;
    start();
  },
  stop() { current = null; stop(); },
};

onAudioReady(() => start());
onSoundChange(() => { if (musicOn()) start(); else stop(); });
document.addEventListener('visibilitychange', () => {
  // Scheduled notes are lost while hidden; restart cleanly when back.
  if (document.hidden) stop();
  else if (current) start();
});
