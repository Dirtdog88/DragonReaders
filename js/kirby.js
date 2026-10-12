// Kirby Words: hear a sight word ("Find the!"), tap the enemy carrying it, and
// Kirby inhales it and copies its power. Each level ends with Kirby using his
// power to bust open a treasure block. Practices sight words.

import { speak } from './speech.js';
import { drawKirby, kirbyCanvas, enemyCanvas, ABILITIES } from './art.js';

const $ = (id) => document.getElementById(id);
const W = 128;
const H = 96;
const PER_LEVEL = 6;
const SAVE_KEY = 'arcade-kirby-v1';
const LANES = [20, 48, 76]; // enemy rows (y centers)
const EX = 94; // enemy x
const KX = 6; // Kirby x
const KY = 32; // Kirby y

// Sight words, unlocked in tiers as he clears levels.
const TIERS = [
  ['the', 'a', 'I', 'is', 'see', 'go', 'can', 'and'],
  ['to', 'we', 'up', 'my', 'look', 'you', 'it', 'in'],
  ['play', 'run', 'big', 'red', 'not', 'me', 'said', 'here'],
];

// ---------------------------------------------------------------- Save

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {};
  } catch {
    return {};
  }
}
const save = Object.assign({ stars: 0, levels: 0, abilities: [], ability: null, words: {} }, loadSave());
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* not fatal */ }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function wordPool() {
  const tiers = save.levels >= 4 ? 3 : save.levels >= 2 ? 2 : 1;
  return TIERS.slice(0, tiers).flat();
}

// The right word plus two others that start with different letters, so
// look-alikes (is/it/in, a/and) never sit side by side.
function wordChoices(answer, pool) {
  const first = (w) => w[0].toLowerCase();
  const picked = [];
  for (const w of shuffle(pool.filter((p) => p !== answer))) {
    if (picked.length === 2) break;
    if (first(w) === first(answer) || picked.some((p) => first(p) === first(w))) continue;
    picked.push(w);
  }
  return shuffle([answer, ...picked]);
}

// ---------------------------------------------------------------- Scene

const canvas = $('sky');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const CLOUDS = [[10, 12, 10], [60, 24, 8], [100, 8, 12], [140, 30, 9]];

function drawSky(clock) {
  ctx.fillStyle = '#9fd3ff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c8ecff';
  ctx.fillRect(0, 50, W, 30);
  ctx.fillStyle = '#ffffff';
  for (const [cx, cy, r] of CLOUDS) {
    const x = ((cx - clock / 60) % 170 + 170) % 170 - 20;
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.arc(x + r, cy + 2, r * 0.8, 0, Math.PI * 2); ctx.arc(x - r, cy + 3, r * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  // Rolling green hills
  ctx.fillStyle = '#6cc25a';
  for (let i = -1; i < 5; i++) {
    const x = i * 40 - ((clock / 30) % 40);
    ctx.beginPath(); ctx.arc(x + 20, 100, 26, Math.PI, 0); ctx.fill();
  }
  ctx.fillStyle = '#3d8a35';
  ctx.fillRect(0, 92, W, 4);
}

// ---------------------------------------------------------------- Game

let s = null;
let raf = 0;
let last = 0;

function lerp(a, b, k) { return a + (b - a) * k; }

function draw() {
  const { t, clock } = s;
  drawSky(clock);
  const bob = Math.round(Math.sin(clock / 350) * 2);

  // Enemies
  s.enemies.forEach((e, i) => {
    if (e.gone) return;
    let x = EX;
    let y = LANES[i] - 12;
    let size = 24;
    if (s.phase === 'enter') x = EX + Math.round((1 - Math.min(1, t / 500)) * 40);
    if (i === s.target && (s.phase === 'inhale' || s.phase === 'spit')) {
      const k = s.phase === 'inhale' ? Math.min(1, t / 550) : 1 - Math.min(1, t / 450);
      const reach = s.phase === 'spit' || !s.right ? 0.55 : 1; // wrong ones only get halfway
      const kk = k * reach;
      x = Math.round(lerp(EX, KX + 20, kk));
      y = Math.round(lerp(LANES[i] - 12, KY + 6, kk));
      size = Math.max(4, Math.round(24 * (1 - kk * 0.7)));
    }
    const wob = s.phase === 'ask' ? Math.round(Math.sin(clock / 300 + i) * 2) : 0;
    ctx.drawImage(enemyCanvas(e.ability), x + (24 - size) / 2, y + wob + (24 - size) / 2, size, size);
  });

  // Wind lines while inhaling
  if (s.phase === 'inhale') {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const k = ((clock / 200 + i / 6) % 1);
      const lx = lerp(EX - 6, KX + 30, k);
      const ly = lerp(LANES[s.target], KY + 18, k) + (i % 3 - 1) * 6;
      ctx.fillRect(Math.round(lx), Math.round(ly), 6, 1);
    }
  }

  // Treasure block at the end of the level
  if (s.phase === 'finisher' || s.phase === 'clear') drawFinisher(t, clock);

  // Kirby
  const inhale = s.phase === 'inhale';
  let kx = KX;
  let ky = KY + bob;
  if (s.phase === 'finisher') ({ kx, ky } = finisherKirby(t, kx, ky));
  if (s.phase === 'power' && Math.floor(t / 90) % 2 === 0 && t < 500) {
    // Transform flash
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(kx + 16, ky + 17, 15, 0, Math.PI * 2); ctx.fill();
  } else if (s.stoneDrop && s.phase === 'finisher') {
    // Stone Kirby is a heavy rock
    ctx.fillStyle = '#1d1426';
    ctx.beginPath(); ctx.arc(kx + 16, ky + 18, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a8a74';
    ctx.beginPath(); ctx.arc(kx + 16, ky + 18, 12, 0, Math.PI * 2); ctx.fill();
  } else {
    drawKirby(ctx, kx, ky, s.ability, { inhale });
  }

  // Spit star when a wrong enemy gets spat back out
  if (s.phase === 'spit') {
    const k = Math.min(1, t / 450);
    ctx.fillStyle = '#ffe14a';
    const sx = lerp(KX + 26, EX, k);
    const sy = lerp(KY + 16, LANES[s.target], k);
    star(sx, sy, 4);
  }

  // Sparkles around a fresh power
  if (s.phase === 'power') {
    ctx.fillStyle = '#ffe14a';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t / 300;
      const r = 14 + t / 40;
      star(kx + 16 + Math.cos(a) * r, ky + 17 + Math.sin(a) * r, 2);
    }
  }
}

function star(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------- Finisher

const BX = 86; // treasure block
const BY = 34;

function finisherKirby(t, kx, ky) {
  const ab = s.ability;
  if (ab === 'sword' || ab === 'wing') {
    // Dash across and back
    const k = t < 900 ? Math.sin(Math.min(1, t / 900) * Math.PI) : 0;
    return { kx: Math.round(kx + k * 60), ky };
  }
  if (ab === 'stone') {
    // Jump up over the block, then drop on it
    if (t < 500) return { kx: Math.round(lerp(kx, BX, t / 500)), ky: Math.round(lerp(ky, 0, t / 500)) };
    if (t < 800) return { kx: BX, ky: Math.round(lerp(0, BY - 6, (t - 500) / 300)) };
    return { kx: BX, ky: BY - 6 };
  }
  return { kx, ky };
}

function drawFinisher(t, clock) {
  const broken = t > 1100 || s.phase === 'clear';
  const ab = s.ability;
  const color = ABILITIES.find((a) => a.id === ab)?.color || '#ffe14a';
  if (!broken) {
    // Golden block with a star
    const shake = t > 700 ? Math.round(Math.sin(t / 20) * 2) : 0;
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(BX - 1 + shake, BY - 1, 34, 34);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(BX + shake, BY, 32, 32);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(BX + shake, BY + 28, 32, 4);
    ctx.fillStyle = '#fff3a0';
    star(BX + 16 + shake, BY + 15, 9);
  }
  // The power hitting the block
  if (t > 150 && t < 1100) {
    const k = (t - 150) / 950;
    ctx.fillStyle = color;
    if (['fire', 'ice', 'beam', 'spark'].includes(ab)) {
      for (let i = 0; i < 14; i++) {
        const f = (k * 3 + i / 14) % 1;
        const x = lerp(KX + 30, BX + 8, f);
        const y = KY + 17 + Math.sin(f * 10 + i) * (ab === 'beam' ? 8 : 4) + (i % 3 - 1) * 3;
        ctx.fillRect(Math.round(x), Math.round(y), ab === 'spark' ? 2 : 4, ab === 'spark' ? 5 : 3);
      }
      if (ab === 'spark' && Math.floor(t / 80) % 2) {
        ctx.strokeStyle = '#ffe14a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(BX + 4, BY - 6); ctx.lineTo(BX + 14, BY + 12); ctx.lineTo(BX + 8, BY + 18); ctx.lineTo(BX + 26, BY + 38); ctx.stroke();
      }
    } else if (ab === 'bomb') {
      const f = Math.min(1, k * 1.6);
      const x = lerp(KX + 26, BX + 16, f);
      const y = lerp(KY + 16, BY + 16, f) - Math.sin(f * Math.PI) * 30;
      if (f < 1) {
        ctx.fillStyle = '#26232f';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#ff8c1a';
        ctx.beginPath(); ctx.arc(BX + 16, BY + 16, 10 + (k - 0.62) * 50, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe14a';
        ctx.beginPath(); ctx.arc(BX + 16, BY + 16, 6 + (k - 0.62) * 30, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ab === 'sword') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) ctx.fillRect(BX - 4 + i * 6, BY + 4 + i * 10, 36, 2);
    } else if (ab === 'wing') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(lerp(KX, BX + 30, (k + i / 6) % 1)), KY + 8 + i * 3, 4, 2);
    }
  }
  // Burst of stars when it breaks
  if (broken) {
    const k = Math.min(1, (s.phase === 'clear' ? 1100 : t - 1100) / 700);
    ctx.fillStyle = '#ffe14a';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + clock / 900;
      star(BX + 16 + Math.cos(a) * (6 + k * 30), BY + 16 + Math.sin(a) * (6 + k * 26), 3);
    }
  }
}

// ---------------------------------------------------------------- Flow

function renderTop() {
  $('star-count').textContent = `⭐ ${save.stars}`;
  const ab = ABILITIES.find((a) => a.id === s?.ability);
  $('power').textContent = ab ? ab.name : '';
  if (s) $('level-count').textContent = `${Math.min(s.i + 1, PER_LEVEL)} / ${PER_LEVEL}`;
}

function startLevel() {
  $('start').hidden = true;
  $('clear').hidden = true;
  $('level').hidden = false;
  const pool = wordPool();
  s = {
    words: shuffle([...pool]).slice(0, PER_LEVEL),
    pool,
    i: 0,
    t: 0,
    clock: 0,
    phase: 'enter',
    ability: save.ability,
    enemies: [],
    mistakes: 0,
  };
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  nextWord();
}

function nextWord() {
  s.word = s.words[s.i];
  s.tries = 0;
  const choices = wordChoices(s.word, s.pool);
  // He transforms every time; a power he hasn't copied yet turns up now and
  // then (and always on a level's last word) so the Ability Book fills over a few levels.
  const missing = shuffle(ABILITIES.map((a) => a.id).filter((id) => !save.abilities.includes(id)));
  const others = shuffle(ABILITIES.map((a) => a.id));
  const newOne = missing.length && (s.i === PER_LEVEL - 1 || Math.random() < 0.25);
  const rightPower = newOne ? missing[0] : others.find((id) => id !== s.ability && save.abilities.includes(id))
    || missing[0] || others.find((id) => id !== s.ability) || others[0];
  const rest = others.filter((id) => id !== rightPower);
  s.enemies = choices.map((w) => ({ word: w, ability: w === s.word ? rightPower : rest.shift() }));
  s.phase = 'enter';
  s.t = 0;
  renderBubbles();
  renderTop();
  setTimeout(() => {
    if (!s || s.phase !== 'enter') return;
    s.phase = 'ask';
    s.t = 0;
    sayWord();
  }, 550);
}

function sayWord() {
  if (s) speak(`Find... ${s.word}!`);
}

function renderBubbles() {
  const el = $('bubbles');
  el.innerHTML = '';
  s.enemies.forEach((e, i) => {
    const b = document.createElement('button');
    b.className = 'bubble';
    b.textContent = e.word;
    b.style.top = `${(LANES[i] / H) * 100}%`;
    b.dataset.word = e.word;
    b.addEventListener('click', () => choose(i, b));
    el.appendChild(b);
  });
}

async function choose(i, btn) {
  if (!s || s.phase !== 'ask') return;
  const e = s.enemies[i];
  const right = e.word === s.word;
  const stat = (save.words[s.word] ??= { right: 0, wrong: 0 });
  stat[right ? 'right' : 'wrong']++;
  s.target = i;
  s.right = right;
  s.phase = 'inhale';
  s.t = 0;
  btn.classList.add('gone');
  await sleep(600);
  if (!s) return;
  if (right) {
    // Swallowed! Copy its power.
    e.gone = true;
    s.ability = e.ability;
    save.ability = e.ability;
    if (!save.abilities.includes(e.ability)) save.abilities.push(e.ability);
    writeSave();
    const ab = ABILITIES.find((a) => a.id === e.ability);
    s.phase = 'power';
    s.t = 0;
    const pop = $('power-pop');
    pop.hidden = true;
    void pop.offsetWidth;
    pop.textContent = `${ab.name}!`;
    pop.hidden = false;
    speak(`${s.word}! ${ab.name}!`);
    renderTop();
    $('bubbles').querySelectorAll('.bubble').forEach((b) => b.classList.add('gone'));
    await sleep(1300);
    if (!s) return;
    pop.hidden = true;
    s.i++;
    if (s.i >= PER_LEVEL) finisher();
    else nextWord();
  } else {
    // Not that one: spit it back out and try again.
    s.mistakes++;
    s.tries++;
    s.phase = 'spit';
    s.t = 0;
    speak('Try again!');
    await sleep(480);
    if (!s) return;
    btn.classList.remove('gone');
    btn.classList.add('wrong');
    s.phase = 'ask';
    s.t = 0;
    if (s.tries >= 2) $('bubbles').querySelector(`[data-word="${s.word}"]`)?.classList.add('hint');
    setTimeout(sayWord, 500);
  }
}

async function finisher() {
  s.phase = 'finisher';
  s.t = 0;
  s.stoneDrop = s.ability === 'stone';
  s.enemies = [];
  $('bubbles').innerHTML = '';
  $('level-count').textContent = '';
  const ab = ABILITIES.find((a) => a.id === s.ability);
  speak(ab ? `${ab.name} power!` : 'Go!');
  await sleep(2000);
  if (!s) return;
  s.phase = 'clear';
  s.stoneDrop = false;
  const stars = Math.max(1, 3 - Math.floor(s.mistakes / 2));
  save.stars += stars;
  save.levels++;
  writeSave();
  renderTop();
  const art = $('clear-art').getContext('2d');
  art.imageSmoothingEnabled = false;
  art.clearRect(0, 0, 32, 32);
  art.drawImage(kirbyCanvas(s.ability), 0, 0);
  $('clear-stars').textContent = '⭐'.repeat(stars);
  $('clear').hidden = false;
  speak('Level clear!');
}

function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  if (s) {
    s.t += dt;
    s.clock += dt;
    draw();
  }
  raf = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- Ability Book

function openBook() {
  const grid = $('book-grid');
  grid.innerHTML = '';
  for (const ab of ABILITIES) {
    const has = save.abilities.includes(ab.id);
    const card = document.createElement('div');
    card.className = `ability-card${has ? '' : ' unknown'}`;
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    c.getContext('2d').drawImage(kirbyCanvas(ab.id), 0, 0);
    const label = document.createElement('span');
    label.textContent = has ? ab.name : '?';
    card.append(c, label);
    if (has) card.addEventListener('click', () => speak(ab.name));
    grid.appendChild(card);
  }
  $('book').hidden = false;
}

$('btn-book').addEventListener('click', openBook);
$('book-close').addEventListener('click', () => { $('book').hidden = true; });
$('btn-play').addEventListener('click', startLevel);
$('btn-next').addEventListener('click', startLevel);
$('btn-say').addEventListener('click', sayWord);

const startArt = $('start-art').getContext('2d');
startArt.imageSmoothingEnabled = false;
startArt.drawImage(kirbyCanvas(save.ability), 0, 0);
$('star-count').textContent = `⭐ ${save.stars}`;

// Testing helper: open with ?debug
if (location.search.includes('debug')) {
  window.__kb = { word: () => s?.word, phase: () => s?.phase, save: () => save, enemies: () => s?.enemies };
}
