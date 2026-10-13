// Chiptune sound effects made with Web Audio (no sound files), so they work
// offline and match the Game Boy look. Every effect is a no-op until the first
// tap unlocks audio, and when sound is off.

import { audioContext, masterGain, sfxOn } from './audio.js';

function live() {
  const ctx = audioContext();
  return ctx && sfxOn() ? ctx : null;
}

// One note: frequency f, sliding to `to` over `t` seconds.
function tone({ f = 440, to = null, type = 'square', t = 0.1, vol = 0.18, delay = 0, attack = 0.005 }) {
  const ctx = live();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + t);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + t);
  o.connect(g).connect(masterGain());
  o.start(now);
  o.stop(now + t + 0.03);
}

let noiseBuf = null;
function noise({ t = 0.15, vol = 0.2, delay = 0, from = 1200, to = 200, type = 'bandpass' }) {
  const ctx = live();
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const now = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(from, now);
  filt.frequency.exponentialRampToValueAtTime(to, now + t);
  filt.Q.value = 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + t);
  src.connect(filt).connect(g).connect(masterGain());
  src.start(now);
  src.stop(now + t + 0.03);
}

const arp = (notes, step = 0.07, t = 0.12, vol = 0.16, type = 'square') =>
  notes.forEach((f, i) => tone({ f, t, vol, delay: i * step, type }));

export const sfx = {
  // Taps and menus
  select: () => tone({ f: 880, t: 0.05, vol: 0.1 }),
  talk: () => tone({ f: 660, t: 0.04, vol: 0.08, type: 'triangle' }),
  // Answers
  right: () => arp([523, 659, 784, 1047]),
  wrong: () => tone({ f: 220, to: 140, type: 'triangle', t: 0.28, vol: 0.16 }),
  hint: () => tone({ f: 1047, t: 0.08, vol: 0.08, type: 'sine' }),
  // Dragon Readers
  catch: () => { arp([523, 659, 784, 1047, 1319], 0.08, 0.2); noise({ t: 0.4, vol: 0.06, from: 4000, to: 800, delay: 0.3 }); },
  flash: () => tone({ f: 1200, to: 2400, t: 0.12, vol: 0.08 }),
  warp: () => { tone({ f: 600, to: 150, type: 'triangle', t: 0.25, vol: 0.12 }); tone({ f: 150, to: 600, type: 'triangle', t: 0.25, vol: 0.12, delay: 0.25 }); },
  shield: () => noise({ t: 0.35, vol: 0.14, from: 3000, to: 300 }),
  laugh: () => arp([330, 294, 262], 0.12, 0.14, 0.12, 'triangle'),
  fanfare: () => arp([523, 523, 523, 659, 784, 1047], 0.11, 0.22, 0.16),
  // Platformers
  jump: () => tone({ f: 320, to: 760, t: 0.14, vol: 0.14 }),
  puff: () => tone({ f: 500, to: 900, t: 0.08, vol: 0.08, type: 'sine' }),
  coin: () => { tone({ f: 988, t: 0.06, vol: 0.14 }); tone({ f: 1319, t: 0.2, vol: 0.14, delay: 0.06 }); },
  door: () => { tone({ f: 300, to: 1200, t: 0.4, vol: 0.12 }); arp([784, 988, 1175, 1568], 0.06, 0.18, 0.1); },
  block: () => tone({ f: 200, to: 90, type: 'square', t: 0.1, vol: 0.14 }),
  breakBlock: () => noise({ t: 0.18, vol: 0.18, from: 2000, to: 300 }),
  power: () => arp([392, 523, 659, 784, 1047], 0.06, 0.25, 0.15),
  drop: () => tone({ f: 500, to: 200, type: 'triangle', t: 0.2, vol: 0.1 }),
  inhale: () => noise({ t: 0.2, vol: 0.05, from: 500, to: 2500, type: 'lowpass' }),
  attack: () => noise({ t: 0.12, vol: 0.12, from: 3000, to: 800 }),
  bomb: () => { noise({ t: 0.45, vol: 0.25, from: 900, to: 60, type: 'lowpass' }); tone({ f: 90, to: 40, type: 'triangle', t: 0.4, vol: 0.2 }); },
  oof: () => tone({ f: 200, to: 90, type: 'triangle', t: 0.22, vol: 0.16 }),
  whoa: () => tone({ f: 700, to: 180, type: 'triangle', t: 0.35, vol: 0.14 }),
  thwip: () => { noise({ t: 0.09, vol: 0.14, from: 4000, to: 1200, type: 'highpass' }); tone({ f: 1400, to: 500, type: 'sine', t: 0.08, vol: 0.08 }); },
  zip: () => tone({ f: 400, to: 1500, type: 'sawtooth', t: 0.18, vol: 0.06 }),
  climb: () => tone({ f: 500, t: 0.03, vol: 0.05, type: 'triangle' }),
  wrap: () => { noise({ t: 0.15, vol: 0.1, from: 3000, to: 600, type: 'highpass' }); tone({ f: 700, t: 0.08, vol: 0.08, delay: 0.1 }); },
  saved: () => arp([659, 784, 1047, 1319], 0.08, 0.25, 0.16),
  clear: () => arp([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 0.3, 0.16),
  // Halloween
  knock: () => { tone({ f: 180, t: 0.05, vol: 0.14, type: 'triangle' }); tone({ f: 180, t: 0.05, vol: 0.14, type: 'triangle', delay: 0.14 }); },
  candy: () => arp([1047, 1319, 1568], 0.06, 0.15, 0.14),
  pop: () => tone({ f: 500, to: 950, type: 'sine', t: 0.07, vol: 0.12 }),
};
