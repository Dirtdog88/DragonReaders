// Spidey City: run along the rooftops, jump, climb walls and zip on webs.
// B shoots a web (wraps robot bugs) or, in the air, zips Spidey up and forward.
// Three rescues per level each ask a little addition problem, with robot bugs
// to count. Sums to 5 first, then to 10, then dots instead of bugs.

import { speak } from './speech.js';
import { spideySprite } from './spidey.js';
import { spookyPic } from './art.js';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { mountSoundButton } from './audio.js';
import { burstStars } from './fx.js';
import './offline.js';
import {
  TILE, VIEW_W, VIEW_H, GRAVITY, MAX_FALL,
  createControls, buildLevel, tileAt, moveBody, overlap, cameraX, fitCanvas,
} from './platform.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'arcade-math-v1';

// ---------------------------------------------------------------- Save

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {};
  } catch {
    return {};
  }
}
const save = Object.assign({ badges: 0, stage: 0, streak: 0, tokens: 0, levels: 0, facts: {} }, loadSave());
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
function problems(stage, n) {
  const max = stage === 0 ? 5 : 10;
  const all = [];
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) if (a + b <= max) all.push([a, b]);
  return shuffle(all).slice(0, n);
}

// The answer and its two closest neighbors, so he has to really count.
function numberChoices(sum) {
  const near = [sum - 1, sum + 1, sum + 2, sum - 2].filter((n) => n >= 1 && n <= 11);
  return shuffle([sum, near[0], near[1]]);
}

// ---------------------------------------------------------------- Levels
// Buildings are [x, width, roof row]. Rescues stand on a roof and block the
// way until he solves the problem. The last building is the tallest: the goal.

const LEVELS = [
  {
    name: 'Sunset City',
    sky: ['#ff9a5a', '#f26b6b', '#c2457a'],
    far: '#7a3a7a',
    buildings: [[0, 12, 6], [14, 10, 5], [26, 8, 6], [36, 12, 4], [50, 10, 6], [62, 6, 5], [70, 8, 6], [80, 10, 2]],
    rescues: [[19, 'kitten'], [42, 'balloon'], [65, 'bus']],
    bots: [9, 29, 46, 56, 74],
    tokens: [[5, 1], [6, 1], [13, 2], [22, 1], [25, 3], [31, 1], [35, 3], [39, 2], [40, 2], [49, 3], [54, 1], [61, 3], [69, 3], [75, 1]],
  },
  {
    name: 'Night City',
    sky: ['#1a1446', '#2a1f5a', '#3a2a6a'],
    far: '#14102e',
    moon: true,
    buildings: [[0, 10, 6], [13, 8, 5], [24, 6, 6], [33, 10, 4], [46, 8, 6], [57, 9, 5], [69, 7, 6], [79, 11, 2]],
    rescues: [[16, 'balloon'], [38, 'kitten'], [61, 'bus']],
    bots: [7, 19, 27, 41, 50, 64, 73],
    tokens: [[4, 1], [11, 3], [12, 3], [22, 3], [26, 1], [31, 3], [36, 1], [44, 3], [51, 1], [55, 3], [67, 3], [72, 1], [77, 3]],
  },
  {
    name: 'Morning City',
    sky: ['#7ec8ff', '#a8dcff', '#d0eeff'],
    far: '#8aa8c8',
    buildings: [[0, 10, 6], [12, 8, 3], [22, 10, 6], [35, 8, 2], [45, 10, 5], [58, 6, 3], [66, 10, 6], [79, 11, 1]],
    rescues: [[15, 'kitten'], [48, 'bus'], [70, 'balloon']],
    bots: [6, 17, 26, 30, 39, 52, 73],
    tokens: [[5, 1], [11, 1], [14, 1], [21, 2], [27, 1], [33, 2], [37, 1], [44, 1], [50, 1], [56, 3], [61, 1], [64, 2], [76, 3]],
  },
];

const RESCUE = {
  kitten: { title: 'Save the kitten!', thanks: 'Meow! Thank you!' },
  balloon: { title: 'Get the balloon!', thanks: 'Yay! My balloon!' },
  bus: { title: 'Stop the bus!', thanks: 'The bus is safe!' },
};

const solid = (ch) => ch === '#';

// Roof row of a column (first solid tile from the top).
function roofRow(grid, col) {
  for (let r = 0; r < grid.length; r++) if (solid(grid[r][col])) return r;
  return grid.length;
}

// ---------------------------------------------------------------- Art

const INK = '#1d1426';

// Robot bug: little gray dome with a red eye and wiggly legs. 16x12.
function drawBot(c, x, y, clock, wrapped) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(x + a, y + b, w, h); };
  if (wrapped) {
    R(1, 2, 14, 10, INK);
    R(2, 3, 12, 8, '#f4f4f4');
    R(4, 4, 8, 1, '#c8c8d8'); R(3, 7, 10, 1, '#c8c8d8'); R(6, 3, 1, 8, '#c8c8d8');
    return;
  }
  const step = Math.floor(clock / 120) % 2;
  R(2, 9 + step, 2, 3 - step, INK); R(7, 10 - step, 2, 2 + step, INK); R(12, 9 + step, 2, 3 - step, INK);
  R(1, 3, 14, 7, INK);
  R(3, 1, 10, 3, INK);
  R(2, 4, 12, 5, '#8a92a6');
  R(4, 2, 8, 2, '#a8b0c4');
  R(9, 4, 3, 3, '#ff3a3a');
  R(10, 4, 1, 1, '#ffffff');
  R(7, 0, 1, 2, INK);
}

// Bigger robot bug for the counting buttons.
let botCache = null;
function botCanvas() {
  if (botCache) return botCache;
  botCache = document.createElement('canvas');
  botCache.width = 16;
  botCache.height = 14;
  drawBot(botCache.getContext('2d'), 0, 1, 0, false);
  return botCache;
}

function drawBuildingTile(c, x, y, col, row, grid, colors) {
  const color = colors[col] || '#3a2a5a';
  const top = !solid(tileAt(grid, col, row - 1));
  c.fillStyle = color;
  c.fillRect(x, y, 16, 16);
  // Windows: lit or dark
  for (const [wx, wy] of [[3, 4], [10, 4], [3, 10], [10, 10]]) {
    c.fillStyle = (col * 7 + row * 3 + wx + wy) % 5 ? '#ffd23f' : '#1d1426';
    c.fillRect(x + wx, y + wy, 4, 3);
  }
  if (top) {
    c.fillStyle = INK;
    c.fillRect(x, y, 16, 3);
    c.fillStyle = '#8a8aa6';
    c.fillRect(x, y + 1, 16, 1);
  }
  // Dark edges where a building ends
  if (!solid(tileAt(grid, col - 1, row)) || col === 0) { c.fillStyle = INK; c.fillRect(x, y, 1, 16); }
  if (!solid(tileAt(grid, col + 1, row))) { c.fillStyle = INK; c.fillRect(x + 15, y, 1, 16); }
}

function drawRescue(c, r, x, y, clock) {
  // x, y = bottom middle on the roof
  if (r.kind === 'kitten') {
    c.drawImage(spookyPic('cat'), x - 10, y - 20, 20, 20);
  } else if (r.kind === 'balloon') {
    // A kid reaching for a balloon caught on an antenna
    c.fillStyle = INK; c.fillRect(x + 4, y - 30, 1, 30);
    c.fillStyle = '#d62f2f';
    c.beginPath(); c.ellipse(x + 5, y - 36 + Math.sin(clock / 300) * 1.5, 5, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(x + 2, y - 39, 2, 2);
    c.fillStyle = '#ffcc99'; c.fillRect(x - 9, y - 16, 6, 6);
    c.fillStyle = '#3a8bff'; c.fillRect(x - 10, y - 10, 8, 7);
    c.fillStyle = INK; c.fillRect(x - 9, y - 3, 2, 3); c.fillRect(x - 5, y - 3, 2, 3);
    c.fillStyle = '#ffcc99'; c.fillRect(x - 3, y - 15, 4, 2);
  } else if (r.kind === 'bus') {
    // A bus teetering on the roof
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(clock / 250) * 0.06);
    c.fillStyle = INK; c.fillRect(-15, -15, 30, 13);
    c.fillStyle = '#ffd23f'; c.fillRect(-14, -14, 28, 11);
    c.fillStyle = '#9fd3ff';
    for (let i = 0; i < 4; i++) c.fillRect(-12 + i * 7, -12, 5, 4);
    c.fillStyle = INK; c.beginPath(); c.arc(-8, -2, 3, 0, Math.PI * 2); c.arc(8, -2, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  if (!r.done) {
    // "!" bubble
    const by = y - 52 + Math.sin(clock / 200) * 2;
    c.fillStyle = INK; c.fillRect(x - 6, by - 1, 12, 14);
    c.fillStyle = '#ffffff'; c.fillRect(x - 5, by, 10, 12);
    c.fillStyle = '#d62f2f'; c.fillRect(x - 1, by + 2, 2, 6); c.fillRect(x - 1, by + 9, 2, 2);
  }
}

function drawSky(c, def, cam, clock) {
  def.sky.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 48, VIEW_W, 49); });
  c.fillStyle = def.moon ? '#f4f0d0' : '#ffd23f';
  c.beginPath(); c.arc(200, 34, 14, 0, Math.PI * 2); c.fill();
  if (def.moon) {
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) c.fillRect((i * 53 + 11) % VIEW_W, (i * 29 + 5) % 70, 1, 1);
  }
  // Far skyline moves slower than the rooftops
  c.fillStyle = def.far;
  for (let i = -1; i < 14; i++) {
    const shift = Math.floor((cam * 0.4) / 22);
    const x = Math.round(i * 22 - ((cam * 0.4) % 22));
    const h = 18 + (((i + shift) * 13) % 4) * 6; // stays below the lowest roof
    c.fillRect(x, VIEW_H - h, 18, h);
  }
}

// ---------------------------------------------------------------- Game state

const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
fitCanvas(canvas, $('screen-box'));
const pad = createControls(document.body);

let g = null;
let raf = 0;
let last = 0;

function startLevel() {
  const def = LEVELS[save.levels % LEVELS.length];
  const width = 90;
  const grid = buildLevel({ width, ground: def.buildings.map(([x, len, top]) => [x, len, top]) });
  const palette = ['#3a2a5a', '#4a3060', '#2f3a66', '#5a2f4a'];
  const colors = [];
  def.buildings.forEach(([x, len], i) => { for (let c = x; c < x + len; c++) colors[c] = palette[i % palette.length]; });
  // Over a gap, use the nearest roof so the coin floats in his jump.
  const roofNear = (col) => [0, -1, 1, -2, 2, -3, 3].map((d) => roofRow(grid, col + d)).find((r) => r < grid.length) ?? 6;
  const onRoof = (col, up = 0) => (roofNear(col) - 1 - up) * TILE;
  const list = problems(save.stage, def.rescues.length);
  const startY = onRoof(2) - 6;
  g = {
    def,
    grid,
    colors,
    clock: 0,
    spidey: { x: 2 * TILE, y: startY, w: 14, h: 22, vx: 0, vy: 0, face: 1, zips: 0, hurt: 0, zip: 0, climb: false, safe: { x: 2 * TILE, y: startY } },
    bots: def.bots.map((col) => ({ x: col * TILE, y: onRoof(col) + 4, w: 16, h: 12, vx: -0.4, vy: 0, wrapped: false })),
    tokens: def.tokens.map(([col, up]) => ({ x: col * TILE + 3, y: onRoof(col, up) + 3, w: 10, h: 10, got: false })),
    rescues: def.rescues.map(([col, kind], i) => ({ col, kind, x: col * TILE, y: roofRow(grid, col) * TILE, done: false, gone: false, problem: list[i] })),
    goal: { x: (def.buildings.at(-1)[0] + 5) * TILE, y: def.buildings.at(-1)[2] * TILE },
    webs: [], // web shots
    effects: [],
    got: 0,
    mistakes: 0,
    phase: 'play',
  };
  $('start').hidden = true;
  $('done').hidden = true;
  pad.clear();
  renderHud();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function renderHud() {
  $('hud-badges').textContent = `\u{1F3C5} ${save.badges}`;
  $('hud-tokens').textContent = `\u{1FA99} ${save.tokens + (g?.got || 0)}`;
  $('hud-rescues').textContent = g ? `\u{1F6DF} ${g.rescues.filter((r) => r.done).length} / ${g.rescues.length}` : '';
}

function popText(text) {
  const pop = $('pop');
  pop.hidden = true;
  void pop.offsetWidth;
  pop.textContent = text;
  pop.hidden = false;
  setTimeout(() => { pop.hidden = true; }, 1200);
}

function burst(x, y, color, n = 10, speed = 1.5) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.effects.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 500, color });
  }
}

// ---------------------------------------------------------------- Update

function update(f) {
  const s = g.spidey;
  g.clock += 16.7 * f;
  s.hurt = Math.max(0, s.hurt - 16.7 * f);
  s.zip = Math.max(0, s.zip - 16.7 * f);

  const dir = (pad.held('right') ? 1 : 0) - (pad.held('left') ? 1 : 0);
  if (dir) s.face = dir;
  if (s.zip > 0) s.vx = s.face * 3.2;
  else s.vx += (dir * 1.9 - s.vx) * 0.3 * f;

  // A: jump (also hops off a wall he's climbing)
  if (pad.take('a') && (s.onGround || s.climb)) {
    s.vy = -5.6;
    s.zips = 0;
    sfx.jump();
  }
  // B: web shot on the ground, web zip in the air (twice per jump)
  if (pad.take('b')) {
    if (s.onGround) {
      g.webs.push({ x: s.x + s.w / 2, y: s.y + 8, vx: s.face * 4.5, life: 600 });
      sfx.thwip();
    } else if (s.zips < 2) {
      s.zips++;
      s.zip = 420;
      sfx.zip();
      s.vy = -4.2;
      s.anchor = { x: s.x + s.w / 2 + s.face * 50, y: 0 };
    }
  }

  s.vy = Math.min(MAX_FALL, s.vy + GRAVITY * f);
  // Climbing: holding toward a wall makes him crawl up it.
  if (s.climb && dir === s.wallDir) s.vy = -1.6;
  s.hitWall = false;
  const bumps = moveBody(s, g.grid, solid, f);
  const wall = bumps.find((b) => b.side === 'left' || b.side === 'right');
  s.climb = !!wall && !s.onGround && dir !== 0;
  if (wall) s.wallDir = wall.side === 'right' ? 1 : -1;
  // Starting a climb from the ground: a nudge up gets him off the roof.
  if (wall && s.onGround && dir !== 0) { s.vy = -1.6; s.climb = true; s.wallDir = dir; }

  if (s.onGround) {
    s.zips = 0;
    s.safe = { x: s.x, y: s.y };
  }
  if (s.x < 0) s.x = 0;
  if (s.y < 0) { s.y = 0; s.vy = Math.max(0, s.vy); }
  // Fell between buildings: a web catches him and puts him back.
  if (s.y > VIEW_H + 30) {
    s.x = s.safe.x; s.y = s.safe.y - 4; s.vx = 0; s.vy = 0; s.hurt = 900;
    sfx.whoa();
  }

  // Rescues block the way until solved.
  for (const r of g.rescues) {
    if (r.done) continue;
    const wallX = r.x - 6;
    if (s.x + s.w > wallX && s.x < r.x + 16) {
      s.x = wallX - s.w;
      s.vx = 0;
      if (g.phase === 'play') openRescue(r);
    }
    break; // only the next one matters
  }

  // Robot bugs walk back and forth on their roof.
  for (const b of g.bots) {
    if (b.wrapped) continue;
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * f);
    b.hitWall = false;
    moveBody(b, g.grid, solid, f);
    const ahead = tileAt(g.grid, Math.floor((b.x + (b.vx > 0 ? b.w + 2 : -2)) / TILE), Math.floor((b.y + b.h + 2) / TILE));
    if (b.hitWall || (b.onGround && !solid(ahead))) b.vx = -b.vx;
    if (s.hurt <= 0 && overlap(s, b)) {
      s.vx = (s.x < b.x ? -1 : 1) * 2.5;
      s.vy = -2.5;
      s.hurt = 900;
      sfx.oof();
    }
  }

  // Web shots
  for (const w of g.webs) {
    w.x += w.vx * f;
    w.life -= 16.7 * f;
    const hitBot = g.bots.find((b) => !b.wrapped && overlap({ x: w.x - 3, y: w.y - 3, w: 6, h: 6 }, b));
    if (hitBot) {
      hitBot.wrapped = true;
      g.got++;
      sfx.wrap();
      burst(hitBot.x + 8, hitBot.y + 6, '#ffffff', 10, 1.4);
      renderHud();
      w.life = 0;
    }
    if (solid(tileAt(g.grid, Math.floor(w.x / TILE), Math.floor(w.y / TILE)))) w.life = 0;
  }
  g.webs = g.webs.filter((w) => w.life > 0);

  // Tokens
  for (const t of g.tokens) {
    if (!t.got && overlap(s, t)) {
      t.got = true;
      g.got++;
      sfx.coin();
      burst(t.x + 5, t.y + 5, '#ffd23f', 6, 1);
      renderHud();
    }
  }

  for (const p of g.effects) {
    p.x += p.vx * f;
    p.y += p.vy * f;
    p.life -= 16.7 * f;
  }
  g.effects = g.effects.filter((p) => p.life > 0);

  // Reached the top of the tallest building
  if (s.onGround && s.x + s.w > g.goal.x - 8 && s.y < g.goal.y) finishLevel();
}

// ---------------------------------------------------------------- Rescue (math)

let q = null;

function bugEl(dot) {
  const b = document.createElement('button');
  b.className = dot ? 'bug dot' : 'bug';
  if (!dot) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 14;
    c.getContext('2d').drawImage(botCanvas(), 0, 0);
    b.appendChild(c);
  }
  b.setAttribute('aria-label', 'robot bug');
  return b;
}

function openRescue(r) {
  g.phase = 'quiz';
  pad.clear();
  const [a, b] = r.problem;
  q = { r, a, b, sum: a + b, counted: 0, tries: 0, pid: (q?.pid || 0) + 1, done: false };
  $('quiz-title').textContent = RESCUE[r.kind].title;
  const dots = save.stage >= 2;
  for (const [id, n] of [['group-a', a], ['group-b', b]]) {
    const el = $(id);
    el.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = n;
    const bugs = document.createElement('div');
    bugs.className = 'bugs';
    for (let i = 0; i < n; i++) {
      const bug = bugEl(dots);
      bug.addEventListener('click', () => countBug(bug));
      bugs.appendChild(bug);
    }
    el.append(num, bugs);
  }
  const ans = $('answer');
  ans.textContent = '';
  ans.classList.remove('filled');
  $('sum-row').textContent = '';
  const nums = $('numbers');
  nums.innerHTML = '';
  for (const n of numberChoices(q.sum)) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.dataset.n = n;
    btn.addEventListener('click', () => choose(n, btn));
    nums.appendChild(btn);
  }
  $('quiz').hidden = false;
  sfx.talk();
  speak(RESCUE[r.kind].title, { now: true });
  setTimeout(sayProblem, 1400);
}

// Tapping a bug counts it: "one", "two", "three"...
function countBug(el) {
  if (!q || el.classList.contains('counted')) return;
  el.classList.add('counted');
  q.counted++;
  sfx.hint();
  speak(String(q.counted), { rate: 0.9, now: true });
  if (q.counted === q.sum) $('sum-row').textContent = `${q.sum} in all!`;
}

// Count every bug out loud, one at a time.
async function countAll() {
  const me = q;
  const bugs = [...document.querySelectorAll('.problem .bug')];
  bugs.forEach((b) => b.classList.remove('counted'));
  q.counted = 0;
  for (const b of bugs) {
    if (q !== me || me.done) return;
    countBug(b);
    await sleep(700);
  }
}

function sayProblem() {
  if (q && !q.done) speak(`${q.a} plus ${q.b} is...`);
}
$('btn-hear').addEventListener('click', sayProblem);

async function choose(n, btn) {
  if (!q || q.done) return;
  const key = `${q.a}+${q.b}`;
  const stat = (save.facts[key] ??= { right: 0, wrong: 0 });
  if (n === q.sum) {
    stat.right++;
    writeSave();
    q.done = true;
    btn.classList.remove('hint');
    btn.classList.add('right');
    $('numbers').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const ans = $('answer');
    ans.textContent = q.sum;
    ans.classList.add('filled');
    sfx.right();
    burstStars(btn);
    speak(`${q.a} plus ${q.b} is ${q.sum}!`, { now: true });
    await sleep(1500);
    // Saved! Big reward and the way opens.
    const r = q.r;
    r.done = true;
    q = null;
    $('quiz').hidden = true;
    g.got += 3;
    burst(r.x + 8, r.y - 12, '#ffd23f', 16, 1.8);
    popText('Saved!');
    sfx.saved();
    speak(RESCUE[r.kind].thanks);
    g.phase = 'play';
    renderHud();
    setTimeout(() => { r.gone = true; }, 1600);
  } else {
    stat.wrong++;
    writeSave();
    g.mistakes++;
    q.tries++;
    btn.classList.add('wrong');
    btn.disabled = true;
    sfx.wrong();
    speak("Let's count!", { now: true });
    const me = q;
    await sleep(900);
    if (q !== me || me.done) return;
    await countAll();
    if (q === me && !me.done && me.tries >= 2) $('numbers').querySelector(`[data-n="${me.sum}"]`)?.classList.add('hint');
  }
}

// ---------------------------------------------------------------- Level end

async function finishLevel() {
  g.phase = 'finish';
  pad.clear();
  speak('You made it to the top!');
  for (let i = 0; i < 6; i++) {
    burst(g.spidey.x + 7, g.spidey.y, ['#ffd23f', '#d62f2f', '#3a8bff'][i % 3], 12, 1 + i * 0.3);
    await sleep(180);
  }
  save.badges++;
  save.tokens += g.got;
  save.levels++;
  // Two smooth levels in a row move him up: sums to 10, then dots.
  save.streak = g.mistakes <= 1 ? save.streak + 1 : 0;
  if (save.streak >= 2 && save.stage < 2) { save.stage++; save.streak = 0; }
  writeSave();
  const got = g.got;
  g.got = 0;
  renderHud();
  const art = $('done-art').getContext('2d');
  art.imageSmoothingEnabled = false;
  art.clearRect(0, 0, 32, 32);
  art.drawImage(spideySprite(), 0, 0);
  $('done-text').textContent = `${g.def.name}: ${got} tokens and a city badge! You have ${save.badges} badges.`;
  $('done').hidden = false;
  g.phase = 'done';
  sfx.clear();
  speak('You saved the city!');
}

// ---------------------------------------------------------------- Draw

function draw() {
  const s = g.spidey;
  const cam = cameraX(s.x, g.grid);
  drawSky(ctx, g.def, cam, g.clock);

  const c0 = Math.floor(cam / TILE);
  for (let r = 0; r < g.grid.length; r++) {
    for (let c = c0; c <= c0 + VIEW_W / TILE + 1; c++) {
      if (solid(tileAt(g.grid, c, r)) && c < g.grid[0].length) drawBuildingTile(ctx, c * TILE - cam, r * TILE, c, r, g.grid, g.colors);
    }
  }

  // Goal flag on the tallest building
  const fx = g.goal.x - cam;
  ctx.fillStyle = INK; ctx.fillRect(fx, g.goal.y - 30, 2, 30);
  ctx.fillStyle = '#d62f2f'; ctx.fillRect(fx + 2, g.goal.y - 30, 14, 9);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(fx + 7, g.goal.y - 27, 4, 3);

  for (const r of g.rescues) if (!r.gone) drawRescue(ctx, r, r.x + 8 - cam, r.y, g.clock);

  // Tokens: spinning gold coins
  for (const t of g.tokens) {
    if (t.got) continue;
    const w = Math.max(2, Math.abs(Math.cos(g.clock / 250 + t.x)) * 10);
    ctx.fillStyle = INK; ctx.fillRect(Math.round(t.x + 5 - w / 2 - cam) - 1, t.y - 1, Math.round(w) + 2, 12);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(Math.round(t.x + 5 - w / 2 - cam), t.y, Math.round(w), 10);
  }

  for (const b of g.bots) drawBot(ctx, Math.round(b.x - cam), Math.round(b.y), g.clock, b.wrapped);

  // Web shots
  ctx.fillStyle = '#ffffff';
  for (const w of g.webs) {
    ctx.fillRect(Math.round(w.x - cam - w.vx * 3), Math.round(w.y), Math.round(Math.abs(w.vx) * 3), 1);
    ctx.fillRect(Math.round(w.x - cam) - 2, Math.round(w.y) - 2, 5, 5);
  }

  // Web line while zipping
  if (s.zip > 0 && s.anchor) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s.x + s.w / 2 - cam, s.y + 4); ctx.lineTo(s.anchor.x - cam, s.anchor.y); ctx.stroke();
  }

  // Spidey (blinks after a bump), leaning while climbing
  if (!(s.hurt > 0 && Math.floor(g.clock / 80) % 2)) {
    const running = s.onGround && Math.abs(s.vx) > 0.3;
    const run = running ? Math.round(Math.sin(g.clock / 60)) : 0;
    const step = running ? (Math.floor(g.clock / 100) % 2 ? 1 : -1) : 0;
    const sx = Math.round(s.x - cam - 5);
    const sy = Math.round(s.y - 1 + run);
    const img = spideySprite();
    ctx.save();
    ctx.translate(sx + 12, sy + 12);
    if (s.climb) ctx.rotate(-s.wallDir * 0.35);
    else if (!s.onGround) ctx.rotate(s.face * Math.max(-0.25, Math.min(0.25, s.vy / 16))); // leans into jumps
    // Body, then the legs shuffling while he runs.
    ctx.drawImage(img, 0, 0, 32, 23, -12, -12, 24, 17);
    ctx.drawImage(img, 0, 23, 32, 9, -12 + step, 5, 24, 7);
    ctx.restore();
  }

  for (const p of g.effects) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - cam), Math.round(p.y), 3, 3);
  }
}

function loop(now) {
  const f = Math.min(3, (now - last) / 16.7);
  last = now;
  if (g) {
    if (g.phase === 'play') update(f);
    else g.clock += 16.7 * f;
    draw();
  }
  raf = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- Start

$('btn-go').addEventListener('click', () => { sfx.select(); startLevel(); });
$('btn-again').addEventListener('click', () => { sfx.select(); startLevel(); });

const startArt = $('start-art').getContext('2d');
startArt.imageSmoothingEnabled = false;
startArt.drawImage(spideySprite(), 0, 0);
renderHud();
mountSoundButton(document.querySelector('.top-right'));
music.play('city');

// Testing helper: open with ?debug
if (location.search.includes('debug')) {
  window.__sm = {
    g: () => g,
    sum: () => q?.sum,
    problem: () => q && `${q.a}+${q.b}`,
    phase: () => g?.phase,
    save: () => save,
    warp: (x) => { g.spidey.x = x; g.spidey.y = 0; g.spidey.vy = 0; },
  };
}
