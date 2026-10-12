// Spidey Math: swing across the city by solving little addition problems.
// Every problem comes with bugs to count (tap one to count it), so he can
// always work it out. Sums to 5 first, then to 10, then dots instead of bugs.

import { speak } from './speech.js';
import { spideySprite } from './spidey.js';
import { spookyPic } from './art.js';

const $ = (id) => document.getElementById(id);
const W = 128;
const H = 72;
const ROOFS = 8; // problems per round
const GAP = 80; // distance between rooftops
const SAVE_KEY = 'arcade-math-v1';

// ---------------------------------------------------------------- Save

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {};
  } catch {
    return {};
  }
}
const save = Object.assign({ badges: 0, stage: 0, facts: {} }, loadSave());
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

// Stage 0: sums up to 5. Stage 1: up to 10 (each part up to 5). Stage 2: same, with dots.
function problems(stage) {
  const max = stage === 0 ? 5 : 10;
  const all = [];
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) if (a + b <= max) all.push([a, b]);
  shuffle(all);
  // Never the same problem twice in a row.
  const out = [];
  while (out.length < ROOFS) out.push(...shuffle([...all]));
  return out.slice(0, ROOFS);
}

// The answer and its two closest neighbors, so he has to really count.
function numberChoices(sum) {
  const near = [sum - 1, sum + 1, sum + 2, sum - 2].filter((n) => n >= 1 && n <= 11);
  return shuffle([sum, near[0], near[1]]);
}

// ---------------------------------------------------------------- City scene

const canvas = $('scene');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function roofTop(i) {
  return 44 + ((i * 7) % 3) * 5;
}

function drawCity(s) {
  const { clock } = s;
  // Sunset sky
  ['#ff9a5a', '#f26b6b', '#c2457a', '#7a3a7a'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * 14, W, 15);
  });
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(96, 40, 12, 0, Math.PI * 2); ctx.fill();

  // Camera follows Spidey from roof to roof
  const k = s.phase === 'swing' ? Math.min(1, s.t / 1100) : 0;
  const ease = k * k * (3 - 2 * k);
  const cam = (s.roof + ease) * GAP;

  // Far skyline (moves slower)
  ctx.fillStyle = '#4a2a5a';
  for (let i = -1; i < 14; i++) {
    const x = Math.round(i * 22 - (cam * 0.4) % 22);
    const h = 18 + ((i * 13 + Math.floor(cam * 0.4 / 22)) % 4) * 6;
    ctx.fillRect(x, H - h - 8, 18, h);
  }

  // Rooftops he swings between
  for (let i = s.roof - 1; i <= s.roof + 2; i++) {
    const x = Math.round(i * GAP - cam + 6);
    const top = roofTop(i);
    ctx.fillStyle = '#2a1f4a';
    ctx.fillRect(x, top, 40, H - top);
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(x - 2, top - 2, 44, 3);
    ctx.fillStyle = '#ffd23f';
    for (let wy = top + 5; wy < H - 4; wy += 7) {
      for (let wx = x + 4; wx < x + 36; wx += 8) {
        if ((wx + wy + i) % 3) ctx.fillRect(wx, wy, 4, 3);
      }
    }
    // The last roof of the round has a flag
    if (i === ROOFS) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 18, top - 14, 1, 12);
      ctx.fillStyle = '#d62f2f';
      ctx.fillRect(x + 19, top - 14, 8, 5);
    }
  }

  // Spidey: standing on the roof, or swinging on a web line to the next one
  const sp = spideySprite();
  let sx = 18;
  let sy = roofTop(s.roof) - 16;
  if (s.phase === 'swing') {
    const fromY = roofTop(s.roof) - 16;
    const toY = roofTop(s.roof + 1) - 16;
    // Web anchored high up, halfway between this roof and the next.
    const ax = Math.round((s.roof + 0.5) * GAP + 26 - cam);
    sy = Math.round(fromY + (toY - fromY) * k + Math.sin(k * Math.PI) * 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx + 8, sy + 2); ctx.lineTo(ax, 0); ctx.stroke();
  }
  const bob = s.phase === 'ask' ? Math.round(Math.sin(clock / 400)) : 0;
  ctx.drawImage(sp, sx, sy + bob, 16, 16);

  if (s.phase === 'saved') {
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 10; i++) {
      const a = clock / 300 + (i / 10) * Math.PI * 2;
      ctx.fillRect(Math.round(sx + 8 + Math.cos(a) * 16), Math.round(sy + 8 + Math.sin(a) * 12), 2, 2);
    }
  }
}

// ---------------------------------------------------------------- Round

let s = null;
let raf = 0;
let last = 0;

function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  if (s) {
    s.t += dt;
    s.clock += dt;
    drawCity(s);
  }
  raf = requestAnimationFrame(loop);
}

function renderBadges() {
  $('badge-count').textContent = `\u{1F3C5} ${save.badges}`;
}

function startRound() {
  $('start').hidden = true;
  $('done').hidden = true;
  $('play').hidden = false;
  s = { list: problems(save.stage), roof: 0, t: 0, clock: 0, phase: 'ask', mistakes: 0 };
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  showProblem();
}

function bugEl(dot) {
  const b = document.createElement('button');
  b.className = dot ? 'bug dot' : 'bug';
  if (!dot) {
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(spookyPic('bug'), 0, 0);
    b.appendChild(c);
  }
  b.setAttribute('aria-label', 'bug');
  return b;
}

function showProblem() {
  const [a, b] = s.list[s.roof];
  s.a = a;
  s.b = b;
  s.sum = a + b;
  s.pid = (s.pid || 0) + 1; // lets an old count-along stop when the problem changes
  s.counted = 0;
  s.tries = 0;
  s.phase = 'ask';
  s.t = 0;
  $('roof-count').textContent = `${s.roof + 1} / ${ROOFS}`;
  const dots = save.stage >= 2;
  for (const [id, n] of [['group-a', a], ['group-b', b]]) {
    const g = $(id);
    g.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = n;
    const bugs = document.createElement('div');
    bugs.className = 'bugs';
    for (let i = 0; i < n; i++) {
      const el = bugEl(dots);
      el.addEventListener('click', () => countBug(el));
      bugs.appendChild(el);
    }
    g.append(num, bugs);
  }
  const ans = $('answer');
  ans.textContent = '';
  ans.classList.remove('filled');
  $('sum-row').textContent = '';
  const nums = $('numbers');
  nums.innerHTML = '';
  for (const n of numberChoices(s.sum)) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.dataset.n = n;
    btn.addEventListener('click', () => choose(n, btn));
    nums.appendChild(btn);
  }
}

// Tapping a bug counts it: "one", "two", "three"...
function countBug(el) {
  if (!s || el.classList.contains('counted')) return;
  el.classList.add('counted');
  s.counted++;
  speak(String(s.counted), { rate: 0.9 });
  if (s.counted === s.sum) $('sum-row').textContent = `${s.sum} in all!`;
}

// Count every bug out loud, one at a time.
async function countAll() {
  const me = s;
  const pid = s.pid;
  const bugs = [...document.querySelectorAll('.problem .bug')];
  bugs.forEach((b) => b.classList.remove('counted'));
  s.counted = 0;
  for (const b of bugs) {
    if (s !== me || s.pid !== pid || s.phase !== 'ask') return;
    countBug(b);
    await sleep(700);
  }
}

function sayProblem() {
  if (s) speak(`${s.a} plus ${s.b} is...`);
}
$('btn-hear').addEventListener('click', sayProblem);

async function choose(n, btn) {
  if (!s || s.phase !== 'ask') return;
  const key = `${s.a}+${s.b}`;
  const stat = (save.facts[key] ??= { right: 0, wrong: 0 });
  if (n === s.sum) {
    stat.right++;
    writeSave();
    btn.classList.remove('hint');
    btn.classList.add('right');
    $('numbers').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const ans = $('answer');
    ans.textContent = s.sum;
    ans.classList.add('filled');
    speak(`${s.a} plus ${s.b} is ${s.sum}!`);
    await sleep(900);
    if (!s) return;
    // Thwip! Swing to the next roof.
    s.phase = 'swing';
    s.t = 0;
    await sleep(1150);
    if (!s) return;
    s.roof++;
    if (s.roof >= ROOFS) finishRound();
    else showProblem();
  } else {
    stat.wrong++;
    writeSave();
    s.mistakes++;
    s.tries++;
    btn.classList.add('wrong');
    btn.disabled = true;
    speak("Let's count!");
    await sleep(900);
    await countAll();
    if (s && s.phase === 'ask' && s.tries >= 2) $('numbers').querySelector(`[data-n="${s.sum}"]`)?.classList.add('hint');
  }
}

function finishRound() {
  s.phase = 'saved';
  s.t = 0;
  save.badges++;
  // A round with only a couple of slips moves him up: sums to 10, then dots.
  if (s.mistakes <= 2 && save.stage < 2) save.stage++;
  writeSave();
  renderBadges();
  const art = $('done-art').getContext('2d');
  art.imageSmoothingEnabled = false;
  art.clearRect(0, 0, 32, 32);
  art.drawImage(spideySprite(), 0, 0);
  $('done-text').textContent = `You got a city badge! You have ${save.badges}.`;
  $('done').hidden = false;
  speak('You saved the city!');
}

$('btn-go').addEventListener('click', startRound);
$('btn-again').addEventListener('click', startRound);

const startArt = $('start-art').getContext('2d');
startArt.imageSmoothingEnabled = false;
startArt.drawImage(spideySprite(), 0, 0);
renderBadges();

// Testing helper: open with ?debug
if (location.search.includes('debug')) {
  window.__sm = { sum: () => s?.sum, phase: () => s?.phase, problem: () => s && `${s.a}+${s.b}`, save: () => save };
}
