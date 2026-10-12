// Spidey's Web Words: a picture, its word with one letter missing, and three
// letters to pick from. Starts with the first letter (easiest to hear), then
// the last letter, then the middle vowel as he gets better.

import { pixelate } from './dragons.js';
import { drawThumb } from './dressup.js';
import { speak } from './speech.js';

const $ = (id) => document.getElementById(id);
const W = 128;
const H = 96;
const P = 48; // picture canvas size
const ROUND = 8; // words per round
const INK = '#1d1426';

const CONSONANTS = 'bcdfghlmnprstwz'.split('');
const VOWELS = 'aeiou'.split('');
// Letters that look or sound alike never appear together.
const CLOSE = [['b', 'd'], ['m', 'n'], ['c', 'k'], ['s', 'z'], ['c', 's'], ['e', 'i'], ['p', 'b'], ['f', 'v']];
const tooClose = (a, b) => CLOSE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// ---------------------------------------------------------------- Pictures

function pic(draw, pal) {
  const c = document.createElement('canvas');
  c.width = c.height = P;
  const x = c.getContext('2d');
  const t = {
    ell(cx, cy, rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); },
    poly(pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); },
    rect(a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); },
    line(pts, w, col) { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); },
  };
  draw(t, x);
  if (pal) pixelate(x, P, pal);
  return c;
}

function fromItem(id) {
  return () => {
    const c = document.createElement('canvas');
    drawThumb(c, id);
    return c;
  };
}

// word, and how to draw its picture. Short words he has seen in the game.
const WORDS = [
  { word: 'sun', make: () => pic((t) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      t.line([[24 + Math.cos(a) * 14, 24 + Math.sin(a) * 14], [24 + Math.cos(a) * 21, 24 + Math.sin(a) * 21]], 3, '#ffb000');
    }
    t.ell(24, 24, 11, 11, '#ffd23f');
  }, ['#ffd23f', '#ffb000']) },
  { word: 'bud', make: () => pic((t) => {
    t.line([[24, 46], [24, 22]], 3, '#3d8a35');
    t.ell(17, 34, 6, 3, '#6cc25a');
    t.ell(31, 30, 6, 3, '#6cc25a');
    t.ell(24, 16, 7, 9, '#ff7eb6');
  }, ['#3d8a35', '#6cc25a', '#ff7eb6']) },
  { word: 'bug', make: () => pic((t) => {
    t.ell(24, 14, 6, 5, '#26232f');
    t.ell(24, 28, 14, 13, '#d62f2f');
  }, ['#26232f', '#d62f2f'], ), dots: true },
  { word: 'zap', make: () => pic((t) => {
    t.poly([[28, 2], [12, 26], [22, 26], [16, 46], [36, 18], [25, 18], [32, 2]], '#ffe14a');
  }, ['#ffe14a']) },
  { word: 'mud', make: () => pic((t) => {
    t.ell(24, 32, 21, 10, '#6b4423');
    t.ell(16, 30, 6, 3, '#8a5a2b');
    t.ell(32, 35, 5, 2.5, '#8a5a2b');
  }, ['#6b4423', '#8a5a2b']) },
  { word: 'web', make: () => pic((t, x) => {
    x.strokeStyle = '#e8ecf4';
    x.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      x.beginPath(); x.moveTo(24, 24); x.lineTo(24 + Math.cos(a) * 22, 24 + Math.sin(a) * 22); x.stroke();
    }
    for (const r of [6, 12, 18]) {
      x.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = 24 + Math.cos(a) * r;
        const py = 24 + Math.sin(a) * r;
        if (i) x.lineTo(px, py); else x.moveTo(px, py);
      }
      x.stroke();
    }
  }) },
  { word: 'hat', make: fromItem('tophat') },
  { word: 'cap', make: fromItem('cap') },
  { word: 'pot', make: fromItem('pot') },
  { word: 'wig', make: fromItem('wig') },
  { word: 'fish', make: fromItem('fish'), noLast: true }, // "sh" goes together, so only hide f or i
];

const pictures = new Map();
function pictureFor(entry) {
  if (!pictures.has(entry.word)) {
    const c = entry.make();
    if (entry.dots) {
      // Ladybug details on top of the outline.
      const x = c.getContext('2d');
      x.fillStyle = INK;
      for (const [a, b] of [[17, 24], [30, 24], [19, 33], [28, 33], [24, 20]]) x.fillRect(a, b, 3, 3);
      x.fillRect(23, 16, 2, 25);
    }
    pictures.set(entry.word, c);
  }
  return pictures.get(entry.word);
}

// ---------------------------------------------------------------- Spidey art

let spideyCache = null;
// Spidey, drawn upright on a 32x32 canvas (hung upside down on screen).
export function spideySprite() {
  if (spideyCache) return spideyCache;
  const RED = '#d62f2f';
  const BLUE = '#2f4fb0';
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const ell = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
  ell(9, 19, 2.5, 6, BLUE);
  ell(23, 19, 2.5, 6, BLUE);
  ell(9, 25, 2, 2, RED);
  ell(23, 25, 2, 2, RED);
  x.fillStyle = BLUE;
  x.fillRect(12, 24, 3, 6);
  x.fillRect(17, 24, 3, 6);
  x.fillStyle = RED;
  x.beginPath(); x.moveTo(11, 15); x.lineTo(21, 15); x.lineTo(20, 25); x.lineTo(12, 25); x.closePath(); x.fill();
  x.fillRect(12, 28, 3, 3);
  x.fillRect(17, 28, 3, 3);
  ell(16, 8, 7, 8, RED);
  pixelate(x, 32, [RED, BLUE]);
  // Big white eyes with dark rims, web lines and the spider on his chest.
  x.fillStyle = INK;
  x.fillRect(10, 6, 5, 5); x.fillRect(17, 6, 5, 5);
  x.fillStyle = '#ffffff';
  x.fillRect(11, 7, 3, 3); x.fillRect(18, 7, 3, 3);
  x.fillStyle = '#7a1010';
  x.fillRect(16, 1, 1, 5); x.fillRect(16, 11, 1, 4);
  x.fillRect(11, 12, 10, 1);
  x.fillStyle = INK;
  x.fillRect(15, 18, 2, 3);
  x.fillRect(13, 18, 6, 1);
  x.fillRect(13, 20, 6, 1);
  spideyCache = c;
  return c;
}

// ---------------------------------------------------------------- Rounds

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Which letter to hide: stage 0 first only, 1 adds the last, 2 adds the middle.
function pickHole(entry, stage) {
  const n = entry.word.length;
  const spots = [0];
  if (stage >= 1 && !entry.noLast) spots.push(n - 1);
  if (stage >= 2) spots.push(1);
  return spots[Math.floor(Math.random() * spots.length)];
}

// Wrong letters never spell another word from the list (mud vs bud), so only one answer fits.
function letterChoices(entry, hole) {
  const answer = entry.word[hole];
  const spells = (l) => entry.word.slice(0, hole) + l + entry.word.slice(hole + 1);
  const known = new Set(WORDS.map((w) => w.word));
  const pool = (VOWELS.includes(answer) ? VOWELS : CONSONANTS)
    .filter((l) => l !== answer && !tooClose(l, answer) && !known.has(spells(l)));
  shuffle(pool);
  const picked = [];
  for (const l of pool) {
    if (picked.length === 2) break;
    if (picked.some((p) => tooClose(p, l))) continue;
    picked.push(l);
  }
  return shuffle([answer, ...picked]);
}

// ---------------------------------------------------------------- Screen

export function createSpidey({ getProgress, setProgress, onDone }) {
  const el = $('spidey');
  const canvas = $('sp-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const wordEl = $('sp-word');
  const lettersEl = $('sp-letters');
  const resultEl = $('sp-result');
  let s = null;
  let raf = 0;
  let last = 0;

  function open() {
    const prog = getProgress();
    const words = shuffle([...WORDS]).slice(0, ROUND);
    s = { words, i: 0, stage: prog.stage || 0, mistakes: 0, clock: 0, swing: -1, phase: 'play' };
    resultEl.hidden = true;
    el.hidden = false;
    nextWord();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function nextWord() {
    const entry = s.words[s.i];
    s.entry = entry;
    s.hole = pickHole(entry, s.stage);
    s.answer = entry.word[s.hole];
    s.done = false;
    renderWord(false);
    lettersEl.innerHTML = '';
    for (const l of letterChoices(entry, s.hole)) {
      const b = document.createElement('button');
      b.className = 'sp-letter-btn';
      b.textContent = l;
      b.dataset.letter = l;
      b.addEventListener('click', () => choose(l, b));
      lettersEl.appendChild(b);
    }
    renderProgress();
  }

  function renderWord(filled) {
    wordEl.innerHTML = '';
    [...s.entry.word].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'sp-char';
      if (i === s.hole) {
        span.classList.add(filled ? 'filled' : 'blank');
        span.textContent = filled ? ch : '';
      } else {
        span.textContent = ch;
      }
      wordEl.appendChild(span);
    });
  }

  function renderProgress() {
    $('sp-progress').textContent = `${s.i + 1} / ${ROUND}`;
  }

  function choose(letter, btn) {
    if (!s || s.done || s.phase !== 'play') return;
    if (letter === s.answer) {
      s.done = true;
      btn.classList.add('right');
      lettersEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      renderWord(true);
      s.swing = 0; // Spidey swings and webs the letter in
      speak(s.entry.word);
      setTimeout(() => {
        if (!s) return;
        s.i++;
        if (s.i >= ROUND) finishRound();
        else nextWord();
      }, 1500);
    } else {
      s.mistakes++;
      btn.classList.add('wrong');
      btn.disabled = true;
      lettersEl.querySelector(`[data-letter="${s.answer}"]`)?.classList.add('hint');
      speak('Try again!');
    }
  }

  function finishRound() {
    s.phase = 'won';
    const prog = getProgress();
    const wins = (prog.wins || 0) + 1;
    // Move on to harder letters after a round with only a couple of slips.
    const stage = s.mistakes <= 2 ? Math.min(2, (prog.stage || 0) + 1) : prog.stage || 0;
    setProgress({ wins, stage });
    const rc = $('sp-result-canvas').getContext('2d');
    rc.imageSmoothingEnabled = false;
    rc.clearRect(0, 0, 32, 32);
    rc.drawImage(spideySprite(), 0, 0);
    resultEl.hidden = false;
    speak('You fixed the web!');
  }

  function close() {
    cancelAnimationFrame(raf);
    el.hidden = true;
    const won = s?.phase === 'won';
    s = null;
    onDone?.({ won });
  }

  $('sp-close').addEventListener('click', close);
  $('sp-result-ok').addEventListener('click', close);

  function draw() {
    const t = s.clock;
    ctx.fillStyle = '#1c2450';
    ctx.fillRect(0, 0, W, H);
    // Big web behind everything
    ctx.strokeStyle = 'rgba(232, 236, 244, 0.35)';
    ctx.lineWidth = 1;
    const cx = 52;
    const cy = 46;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90); ctx.stroke();
    }
    for (const r of [10, 20, 30, 40, 52, 66]) {
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    // The picture, big and centered on the web
    const p = pictureFor(s.entry);
    const size = 56;
    const scale = Math.min(size / p.width, size / p.height);
    const pw = Math.round(p.width * scale);
    const ph = Math.round(p.height * scale);
    ctx.fillStyle = 'rgba(253, 246, 227, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(p, Math.round(cx - pw / 2), Math.round(cy - ph / 2), pw, ph);

    // Spidey hangs upside down on his thread and swings on a right answer.
    let sx = 104 + Math.sin(t / 600) * 3;
    let sy = 30;
    if (s.swing >= 0) {
      const k = Math.min(1, s.swing / 700);
      const arc = Math.sin(k * Math.PI);
      sx -= arc * 40;
      sy += arc * 26;
    }
    ctx.strokeStyle = '#e8ecf4';
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, sy - 14); ctx.stroke();
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    ctx.scale(1, -1);
    ctx.drawImage(spideySprite(), -16, -16);
    ctx.restore();
    if (s.swing >= 0 && s.swing < 700) {
      // Thwip! A web line toward the word.
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx - 6, sy + 6); ctx.lineTo(cx, H); ctx.stroke();
    }
    if (s.phase === 'won') {
      ctx.fillStyle = '#ffe14a';
      for (let i = 0; i < 10; i++) {
        const a = t / 300 + (i / 10) * Math.PI * 2;
        ctx.fillRect(Math.round(sx + Math.cos(a) * 20), Math.round(sy + Math.sin(a) * 20), 2, 2);
      }
    }
  }

  function loop(now) {
    if (!s) return;
    const dt = Math.min(50, now - last);
    last = now;
    s.clock += dt;
    if (s.swing >= 0) {
      s.swing += dt;
      if (s.swing > 900) s.swing = -1;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  return { open, isOpen: () => !el.hidden, answer: () => s?.answer };
}

// World sprite: Spidey hanging upside down (16x16), for the castle grounds.
export function spideyWorldSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.translate(0, 16);
  x.scale(1, -1);
  x.drawImage(spideySprite(), 0, 0, 32, 32, 0, 0, 16, 16);
  return c;
}
