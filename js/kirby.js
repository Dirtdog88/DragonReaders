// Kirby Adventure: run, jump and float through Dream Land. B inhales an enemy
// and Kirby copies its power; with a power, B uses it. Three Star Doors per level
// open with a sight word (heard, not shown). Each level ends at a treasure block.

import { speak } from './speech.js';
import { drawKirby, kirbyCanvas, enemyCanvas, ABILITIES } from './art.js';
import {
  TILE, VIEW_W, VIEW_H, GRAVITY, MAX_FALL,
  createControls, buildLevel, extract, tileAt, moveBody, overlap, cameraX, fitCanvas,
} from './platform.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'arcade-kirby-v1';
const ENEMY_CHARS = 'fispgbow'; // fire ice sword spark (g)stone beam (o)bomb wing
const ENEMY_POWER = { f: 'fire', i: 'ice', s: 'sword', p: 'spark', g: 'stone', b: 'beam', o: 'bomb', w: 'wing' };

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
// Three words that all start with different letters (no is/it/in side by side).
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

// ---------------------------------------------------------------- Levels
// Rows 0-8; ground top is row 7. D = Star Door (2 tall), T = treasure,
// * = star, ? = star block, B = brick, I = ice (only Fire melts it), S = start.

// Doors fill the whole column so he can't float over them.
const door = (x) => [0, 1, 2, 3, 4, 5, 6].map((r) => [x, r, 'D']);
const LEVELS = [
  {
    name: 'Green Greens',
    theme: 'grass',
    width: 84,
    ground: [[0, 18], [21, 21], [45, 39]],
    plats: [[8, 4, 4, '='], [27, 4, 5, '='], [52, 4, 4, '='], [60, 3, 4, '=']],
    put: [
      [2, 6, 'S'], ...door(14), ...door(38), ...door(66),
      [5, 6, 'f'], [11, 6, 'i'], [24, 6, 's'], [33, 2, 'w'], [48, 6, 'p'], [56, 6, 'g'], [70, 6, 'b'], [74, 6, 'o'],
      [9, 3, '*'], [10, 3, '*'], [28, 3, '*'], [29, 3, '*'], [30, 3, '*'], [53, 3, '*'], [62, 2, '*'], [63, 2, 'I'],
      [22, 4, '?'], [47, 4, '?'], [43, 3, '*'], [19, 4, '*'], [80, 6, 'T'],
    ],
  },
  {
    name: 'Cloud Kingdom',
    theme: 'cloud',
    width: 84,
    ground: [[0, 10], [16, 8], [30, 6], [42, 12], [60, 6], [72, 12]],
    plats: [[10, 5, 4, '='], [24, 4, 4, '='], [36, 5, 4, '='], [54, 4, 4, '='], [66, 5, 4, '=']],
    put: [
      [2, 6, 'S'], ...door(19), ...door(46), ...door(74),
      [6, 6, 'w'], [12, 4, 'o'], [17, 6, 'b'], [26, 3, 'i'], [33, 6, 'f'], [44, 6, 'g'], [51, 3, 'w'], [62, 6, 's'], [68, 4, 'p'],
      [11, 4, '*'], [12, 3, '*'], [25, 3, '*'], [37, 4, '*'], [38, 4, '*'], [55, 3, '*'], [67, 4, '*'],
      [31, 4, '?'], [49, 4, 'B'], [50, 4, '?'], [80, 6, 'T'],
    ],
  },
  {
    name: 'Castle',
    theme: 'castle',
    width: 84,
    ground: [[0, 24], [27, 22], [52, 32]],
    plats: [[7, 4, 3, 'B'], [15, 3, 4, 'B'], [30, 4, 5, 'B'], [44, 4, 3, 'B'], [57, 3, 5, 'B']],
    put: [
      [2, 6, 'S'], ...door(20), ...door(41), ...door(70),
      [6, 6, 'g'], [12, 6, 'f'], [17, 2, 'b'], [29, 6, 'i'], [35, 6, 'p'], [46, 3, 's'], [55, 6, 'o'], [60, 2, 'w'], [76, 6, 'f'],
      [8, 3, '*'], [16, 2, '*'], [17, 1, '*'], [31, 3, '*'], [33, 3, '*'], [58, 2, '*'], [60, 1, '*'], [25, 4, '*'],
      [10, 4, '?'], [48, 4, '?'], [64, 6, 'I'], [64, 5, 'I'], [65, 6, '*'], [80, 6, 'T'],
    ],
  },
];

const SOLID = new Set(['#', '=', '?', 'u', 'B', 'I', 'D']);
const solid = (ch) => SOLID.has(ch);

// ---------------------------------------------------------------- Tiles and art

const THEME = {
  grass: { sky: ['#9fd3ff', '#b8e2ff', '#d2edff'], top: '#6cc25a', dirt: '#c08a4a', dirtDark: '#9a6a34', hill: '#8fd47a' },
  cloud: { sky: ['#6aa8ff', '#8fc0ff', '#b8d8ff'], top: '#ffffff', dirt: '#e8ecf4', dirtDark: '#c4cad8', hill: '#d8e8ff' },
  castle: { sky: ['#5a4a7a', '#6a5a8a', '#7a6a9a'], top: '#9aa0a6', dirt: '#7a808b', dirtDark: '#5a5f6a', hill: '#4a3a6a' },
};

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTile(ctx, ch, x, y, grid, col, row, theme) {
  const th = THEME[theme];
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  if (ch === '#') {
    const top = !solid(tileAt(grid, col, row - 1));
    R(0, 0, 16, 16, th.dirt);
    R(2, 6, 3, 2, th.dirtDark);
    R(10, 11, 3, 2, th.dirtDark);
    if (theme === 'castle') { R(0, 7, 16, 1, th.dirtDark); R(8, 0, 1, 7, th.dirtDark); R(3, 8, 1, 8, th.dirtDark); }
    if (top) { R(0, 0, 16, 4, th.top); R(0, 4, 16, 1, '#1d1426'); }
  } else if (ch === '=') {
    R(0, 2, 16, 10, '#1d1426');
    R(1, 3, 14, 8, theme === 'grass' ? '#c08a4a' : '#ffffff');
    R(1, 3, 14, 3, theme === 'grass' ? '#6cc25a' : '#e8f4ff');
  } else if (ch === '?' || ch === 'u') {
    R(0, 0, 16, 16, '#1d1426');
    R(1, 1, 14, 14, ch === '?' ? '#f5c542' : '#9a6a34');
    if (ch === '?') { ctx.fillStyle = '#fff3a0'; star(ctx, x + 8, y + 8, 5); }
  } else if (ch === 'B') {
    R(0, 0, 16, 16, '#1d1426');
    R(1, 1, 14, 6, '#d9774a');
    R(1, 9, 6, 6, '#d9774a');
    R(9, 9, 6, 6, '#d9774a');
  } else if (ch === 'I') {
    R(0, 0, 16, 16, '#1d1426');
    R(1, 1, 14, 14, '#bfe8ff');
    R(3, 3, 4, 2, '#ffffff');
    R(4, 5, 2, 4, '#ffffff');
  } else if (ch === 'D') {
    if (row < 5) {
      // Star pillar above the door
      R(3, 0, 10, 16, '#1d1426');
      R(4, 0, 8, 16, '#c45a9a');
      R(6, 0, 2, 16, '#ff9fd0');
      return;
    }
    const isTop = row === 5;
    R(1, 0, 14, 16, '#1d1426');
    R(2, isTop ? 2 : 0, 12, isTop ? 14 : 16, '#ff7eb6');
    if (isTop) { ctx.fillStyle = '#ffe14a'; star(ctx, x + 8, y + 10, 5); }
    else R(10, 6, 2, 2, '#ffe14a');
  }
}

function drawBackground(ctx, cam, clock, theme) {
  const th = THEME[theme];
  th.sky.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 48, VIEW_W, 49); });
  // Far hills or castle towers move slower than the ground.
  ctx.fillStyle = th.hill;
  for (let i = -1; i < 8; i++) {
    const x = i * 48 - ((cam * 0.3) % 48);
    if (theme === 'castle') ctx.fillRect(x + 8, 60, 22, 90);
    else { ctx.beginPath(); ctx.arc(x + 24, 120, 30, Math.PI, 0); ctx.fill(); }
  }
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 70 - cam * 0.15 - clock / 80) % 330 + 330) % 330 - 40;
    const y = 14 + (i % 3) * 14;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.arc(x + 9, y + 2, 6, 0, Math.PI * 2); ctx.arc(x - 9, y + 3, 5, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------- Game state

const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
fitCanvas(canvas, $('screen-box'));
const pad = createControls(document.body);

let g = null; // the running level
let raf = 0;
let last = 0;

function startLevel() {
  const def = LEVELS[save.levels % LEVELS.length];
  const grid = buildLevel({ width: def.width, ground: def.ground.map(([x, len]) => [x, len, 7]), plats: def.plats, put: def.put });
  const marks = extract(grid, `S*T${ENEMY_CHARS}`);
  const start = marks.find((m) => m.ch === 'S') || { x: 32, y: 96 };
  g = {
    def,
    grid,
    clock: 0,
    kirby: { x: start.x, y: start.y - 8, w: 20, h: 22, vx: 0, vy: 0, face: 1, puffs: 0, hurt: 0, attack: 0, dash: 0, safe: { x: start.x, y: start.y - 8 } },
    ability: save.ability,
    enemies: marks.filter((m) => ENEMY_CHARS.includes(m.ch)).map((m) => ({
      type: ENEMY_POWER[m.ch], x: m.x, y: m.y - 2, w: 18, h: 18, vx: -0.35, vy: 0, baseY: m.y, alive: true, fly: m.ch === 'w',
    })),
    items: marks.filter((m) => m.ch === '*').map((m) => ({ x: m.x + 2, y: m.y + 2, w: 12, h: 12, got: false })),
    treasure: marks.find((m) => m.ch === 'T'),
    effects: [], // particles
    bombs: [],
    got: 0,
    doorsOpen: 0,
    paused: false,
    phase: 'play',
  };
  $('clear').hidden = true;
  $('start').hidden = true;
  pad.clear();
  renderHud();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function renderHud() {
  $('hud-stars').textContent = `⭐ ${save.stars + (g?.got || 0)}`;
  const ab = ABILITIES.find((a) => a.id === g?.ability);
  $('hud-power').textContent = ab ? ab.name : '';
}

function popText(text) {
  const pop = $('power-pop');
  pop.hidden = true;
  void pop.offsetWidth;
  pop.textContent = text;
  pop.hidden = false;
  setTimeout(() => { pop.hidden = true; }, 1200);
}

function burst(x, y, color, n = 10, speed = 1.5) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.effects.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 500, color, star: true });
  }
}

function gainPower(type) {
  g.ability = type;
  save.ability = type;
  if (!save.abilities.includes(type)) save.abilities.push(type);
  writeSave();
  const ab = ABILITIES.find((a) => a.id === type);
  popText(`${ab.name}!`);
  speak(`${ab.name}!`);
  burst(g.kirby.x + 10, g.kirby.y + 10, '#ffe14a', 12, 1.2);
  renderHud();
}

// ---------------------------------------------------------------- Update

function update(f) {
  const k = g.kirby;
  g.clock += 16.7 * f;
  k.hurt = Math.max(0, k.hurt - 16.7 * f);
  k.attack = Math.max(0, k.attack - 16.7 * f);
  k.dash = Math.max(0, k.dash - 16.7 * f);

  // Moving
  const dir = (pad.held('right') ? 1 : 0) - (pad.held('left') ? 1 : 0);
  if (dir) k.face = dir;
  const inhaling = !g.ability && pad.held('b');
  const target = inhaling && k.onGround ? 0 : dir * 1.5;
  if (k.dash > 0) k.vx = k.face * 3.6;
  else k.vx += (target - k.vx) * 0.25 * f;

  // Jump on the ground, puff up in the air (Kirby can fly a little), float down.
  if (pad.take('a')) {
    if (k.onGround) { k.vy = -5; k.puffs = 0; } else if (k.puffs < 6) { k.vy = -2.6; k.puffs++; }
  }
  k.vy = Math.min(MAX_FALL, k.vy + GRAVITY * f);
  if (pad.held('a') && k.vy > 0.9 && !k.onGround) k.vy = 0.9;

  // Drop the power to inhale a new one
  if (pad.take('drop') && g.ability) {
    burst(k.x + 10, k.y + 4, '#ffffff', 8, 1);
    g.ability = null;
    save.ability = null;
    writeSave();
    renderHud();
  }

  // B: inhale, or use the power
  if (pad.take('b') && g.ability) usePower();
  if (inhaling) inhale();

  const bumps = moveBody(k, g.grid, solid, f);
  for (const b of bumps) {
    if (b.ch === '?' && b.side === 'up') hitBlock(b.col, b.row);
    if (b.ch === 'D' && (b.side === 'left' || b.side === 'right')) openDoor(b.col);
  }
  if (k.onGround) {
    k.puffs = 0;
    const under = tileAt(g.grid, Math.floor((k.x + k.w / 2) / TILE), Math.floor((k.y + k.h + 1) / TILE));
    if (solid(under)) k.safe = { x: k.x, y: k.y };
  }
  if (k.x < 0) k.x = 0;
  if (k.y < 0) { k.y = 0; k.vy = Math.max(0, k.vy); }
  // Fell into a gap: pop back to the last safe spot.
  if (k.y > VIEW_H + 40) {
    k.x = k.safe.x; k.y = k.safe.y - 4; k.vx = 0; k.vy = 0; k.hurt = 900;
  }

  // Power attack hitbox
  if (k.attack > 0) attackHits();

  // Enemies
  for (const e of g.enemies) {
    if (!e.alive) continue;
    if (e.pull) {
      // Being sucked toward Kirby's mouth
      const mx = k.x + (k.face > 0 ? k.w : -4);
      const my = k.y + 6;
      e.x += (mx - e.x) * 0.18 * f;
      e.y += (my - e.y) * 0.18 * f;
      if (Math.abs(mx - e.x) < 10 && Math.abs(my - e.y) < 12) {
        e.alive = false;
        gainPower(e.type);
      }
      e.pull = false;
      continue;
    }
    if (e.fly) {
      e.x += e.vx * f;
      e.y = e.baseY + Math.sin(g.clock / 500 + e.baseY) * 14;
      if (Math.abs(e.x - (e.home ??= e.x)) > 40) e.vx = -e.vx;
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * f);
      e.hitWall = false;
      moveBody(e, g.grid, solid, f);
      // Turn around at walls and ledges
      const ahead = tileAt(g.grid, Math.floor((e.x + (e.vx > 0 ? e.w + 2 : -2)) / TILE), Math.floor((e.y + e.h + 2) / TILE));
      if (e.hitWall || (e.onGround && !solid(ahead))) e.vx = -e.vx;
      if (e.y > VIEW_H + 40) e.alive = false;
    }
    // Bumping an enemy just knocks Kirby back a little.
    if (k.hurt <= 0 && k.dash <= 0 && overlap(k, e)) {
      k.vx = (k.x < e.x ? -1 : 1) * 2.5;
      k.vy = -2.5;
      k.hurt = 900;
      speak('Oof!');
    }
  }

  // Bombs he threw
  for (const b of g.bombs) {
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * f);
    b.x += b.vx * f;
    b.y += b.vy * f;
    b.t -= 16.7 * f;
    const hitGround = solid(tileAt(g.grid, Math.floor(b.x / TILE), Math.floor((b.y + 3) / TILE)));
    const hitEnemy = g.enemies.some((e) => e.alive && overlap({ x: b.x - 3, y: b.y - 3, w: 6, h: 6 }, e));
    if (b.t <= 0 || hitGround || hitEnemy) {
      b.done = true;
      blast({ x: b.x - 22, y: b.y - 22, w: 44, h: 44 }, 'bomb');
      burst(b.x, b.y, '#ff8c1a', 14, 2);
    }
  }
  g.bombs = g.bombs.filter((b) => !b.done);

  // Stars
  for (const it of g.items) {
    if (!it.got && overlap(k, it)) {
      it.got = true;
      g.got++;
      burst(it.x + 6, it.y + 6, '#ffe14a', 6, 1);
      renderHud();
    }
  }

  // Particles
  for (const p of g.effects) {
    p.x += p.vx * f;
    p.y += p.vy * f;
    p.life -= 16.7 * f;
  }
  g.effects = g.effects.filter((p) => p.life > 0);

  // Reached the treasure
  if (g.treasure && Math.abs(k.x - g.treasure.x) < 20 && Math.abs(k.y - g.treasure.y) < 30) finishLevel();
}

function inhale() {
  const k = g.kirby;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const dx = (e.x + e.w / 2) - (k.x + k.w / 2);
    if (Math.sign(dx) === k.face && Math.abs(dx) < 70 && Math.abs(e.y - k.y) < 26) e.pull = true;
  }
  // Wind lines
  if (Math.random() < 0.5) {
    g.effects.push({ x: k.x + k.w / 2 + k.face * 60, y: k.y + 4 + Math.random() * 16, vx: -k.face * 3, vy: 0, life: 280, color: '#ffffff', line: true });
  }
}

function usePower() {
  const k = g.kirby;
  const ab = g.ability;
  k.attack = 380;
  if (ab === 'bomb') {
    g.bombs.push({ x: k.x + k.w / 2, y: k.y, vx: k.face * 2.4, vy: -3, t: 900 });
    k.attack = 0;
  } else if (ab === 'wing' || ab === 'sword') {
    if (ab === 'wing') k.dash = 300;
  } else if (ab === 'stone' && !k.onGround) {
    k.vy = 6;
  }
}

function attackBox() {
  const k = g.kirby;
  const ab = g.ability;
  const front = (w) => (k.face > 0 ? k.x + k.w : k.x - w);
  if (ab === 'fire' || ab === 'ice' || ab === 'beam') return { x: front(46), y: k.y - 2, w: 46, h: 22 };
  if (ab === 'sword') return { x: front(26), y: k.y - 8, w: 26, h: 30 };
  if (ab === 'spark') return { x: k.x - 14, y: k.y - 14, w: k.w + 28, h: k.h + 28 };
  if (ab === 'stone') return { x: k.x - 4, y: k.y, w: k.w + 8, h: k.h + 8 };
  if (ab === 'wing') return { x: k.x - 2, y: k.y, w: k.w + 4, h: k.h };
  return null;
}

function attackHits() {
  const box = attackBox();
  if (!box) return;
  const ab = g.ability;
  // Effect particles for each power
  const color = ABILITIES.find((a) => a.id === ab)?.color || '#ffffff';
  if (Math.random() < 0.8) {
    const k = g.kirby;
    g.effects.push({
      x: box.x + Math.random() * box.w, y: box.y + Math.random() * box.h,
      vx: ab === 'spark' ? 0 : k.face * 1.2, vy: (Math.random() - 0.5) * 0.8, life: 250, color: ab === 'bomb' ? '#ff8c1a' : color,
    });
  }
  blast(box, ab);
}

// Defeat enemies and break blocks inside a box.
function blast(box, ab) {
  for (const e of g.enemies) {
    if (e.alive && overlap(box, e)) {
      e.alive = false;
      g.got++;
      burst(e.x + 9, e.y + 9, '#ffffff', 8, 1.4);
      renderHud();
    }
  }
  for (let r = Math.floor(box.y / TILE); r <= Math.floor((box.y + box.h) / TILE); r++) {
    for (let c = Math.floor(box.x / TILE); c <= Math.floor((box.x + box.w) / TILE); c++) {
      const ch = tileAt(g.grid, c, r);
      if (ch === '?') hitBlock(c, r);
      else if (ch === 'B' || (ch === 'I' && ab === 'fire')) {
        g.grid[r][c] = '.';
        burst(c * TILE + 8, r * TILE + 8, ch === 'I' ? '#bfe8ff' : '#d9774a', 6, 1.2);
      }
    }
  }
}

// A star block gives a star.
function hitBlock(col, row) {
  if (g.grid[row][col] !== '?') return;
  g.grid[row][col] = 'u';
  g.items.push({ x: col * TILE + 2, y: (row - 1) * TILE + 2, w: 12, h: 12, got: false });
  burst(col * TILE + 8, row * TILE, '#ffe14a', 6, 1);
}

// ---------------------------------------------------------------- Star Door (sight word)

let quiz = null;

function openDoor(col) {
  if (quiz || g.phase !== 'play') return;
  g.phase = 'quiz';
  pad.clear();
  const pool = wordPool();
  const word = pool[Math.floor(Math.random() * pool.length)];
  quiz = { col, word, tries: 0 };
  const row = $('quiz-words');
  row.innerHTML = '';
  for (const w of wordChoices(word, pool)) {
    const b = document.createElement('button');
    b.className = 'quiz-btn';
    b.textContent = w;
    b.dataset.word = w;
    b.addEventListener('click', () => answer(w, b));
    row.appendChild(b);
  }
  $('quiz').hidden = false;
  setTimeout(sayWord, 300);
}

function sayWord() {
  if (quiz) speak(`Find... ${quiz.word}!`);
}
$('quiz-say').addEventListener('click', sayWord);

async function answer(w, btn) {
  if (!quiz || quiz.done) return;
  const stat = (save.words[quiz.word] ??= { right: 0, wrong: 0 });
  if (w === quiz.word) {
    stat.right++;
    quiz.done = true;
    btn.classList.remove('hint');
    btn.classList.add('right');
    speak(`${quiz.word}! The door is open!`);
    await sleep(1200);
    // Open the door and give a big reward.
    for (let r = 0; r < g.grid.length; r++) if (g.grid[r][quiz.col] === 'D') g.grid[r][quiz.col] = '.';
    burst(quiz.col * TILE + 8, 6 * TILE, '#ff7eb6', 14, 1.8);
    g.got += 3;
    g.doorsOpen++;
    $('quiz').hidden = true;
    quiz = null;
    g.phase = 'play';
    renderHud();
  } else {
    stat.wrong++;
    quiz.tries++;
    btn.classList.add('wrong');
    btn.disabled = true;
    speak('Try again!');
    if (quiz.tries >= 2) $('quiz-words').querySelector(`[data-word="${quiz.word}"]`)?.classList.add('hint');
    setTimeout(sayWord, 900);
  }
  writeSave();
}

// ---------------------------------------------------------------- Level end

async function finishLevel() {
  if (g.phase !== 'play') return;
  g.phase = 'finish';
  pad.clear();
  const ab = ABILITIES.find((a) => a.id === g.ability);
  speak(ab ? `${ab.name} power!` : 'Yay!');
  // Kirby uses his power on the treasure block
  for (let i = 0; i < 6; i++) {
    burst(g.treasure.x + 8, g.treasure.y + 8, ab?.color || '#ffe14a', 10, 1 + i * 0.3);
    await sleep(180);
  }
  g.treasure = null;
  save.stars += g.got + 5;
  save.levels++;
  writeSave();
  const art = $('clear-art').getContext('2d');
  art.imageSmoothingEnabled = false;
  art.clearRect(0, 0, 32, 32);
  art.drawImage(kirbyCanvas(g.ability), 0, 0);
  $('clear-text').textContent = `${g.def.name}: you got ${g.got + 5} stars!`;
  $('clear').hidden = false;
  g.phase = 'clear';
  renderHud();
  speak('Level clear!');
}

// ---------------------------------------------------------------- Draw

function draw() {
  const k = g.kirby;
  const cam = cameraX(k.x, g.grid);
  drawBackground(ctx, cam, g.clock, g.def.theme);

  const c0 = Math.floor(cam / TILE);
  for (let r = 0; r < g.grid.length; r++) {
    for (let c = c0; c <= c0 + VIEW_W / TILE + 1; c++) {
      const ch = tileAt(g.grid, c, r);
      if (ch !== '.') drawTile(ctx, ch, c * TILE - cam, r * TILE, g.grid, c, r, g.def.theme);
    }
  }

  // Treasure block
  if (g.treasure) {
    const x = g.treasure.x - cam - 8;
    const y = g.treasure.y - 16;
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(x - 1, y - 1, 34, 34);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(x, y + 28, 32, 4);
    ctx.fillStyle = '#fff3a0';
    star(ctx, x + 16, y + 15, 9);
  }

  // Stars to collect
  ctx.fillStyle = '#ffe14a';
  for (const it of g.items) {
    if (!it.got) star(ctx, it.x + 6 - cam, it.y + 6 + Math.sin(g.clock / 250 + it.x) * 1.5, 6);
  }

  // Enemies
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const img = enemyCanvas(e.type);
    const ex = Math.round(e.x - cam - 3);
    const ey = Math.round(e.y - 6);
    if (e.vx > 0 && !e.fly) {
      ctx.save(); ctx.translate(ex + 24, ey); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
    } else ctx.drawImage(img, ex, ey);
  }

  if (k.attack > 0 && g.phase === 'play') drawAttack(cam);

  // Bombs
  ctx.fillStyle = '#26232f';
  for (const b of g.bombs) { ctx.beginPath(); ctx.arc(b.x - cam, b.y, 4, 0, Math.PI * 2); ctx.fill(); }

  // Kirby (blinks after a bump)
  if (!(k.hurt > 0 && Math.floor(g.clock / 80) % 2)) {
    const inhaling = !g.ability && pad.held('b') && g.phase === 'play';
    const kx = Math.round(k.x - cam - 6);
    const ky = Math.round(k.y - 9);
    if (k.face < 0) {
      ctx.save(); ctx.translate(kx + 32, ky); ctx.scale(-1, 1);
      drawKirby(ctx, 0, 0, g.ability, { inhale: inhaling });
      ctx.restore();
    } else drawKirby(ctx, kx, ky, g.ability, { inhale: inhaling });
  }

  // Particles
  for (const p of g.effects) {
    ctx.fillStyle = p.color;
    if (p.line) ctx.fillRect(Math.round(p.x - cam), Math.round(p.y), 6, 1);
    else if (p.star) star(ctx, p.x - cam, p.y, 2.5);
    else ctx.fillRect(Math.round(p.x - cam), Math.round(p.y), 3, 3);
  }
}

// A big, easy-to-see shape for each power while it's being used.
function drawAttack(cam) {
  const box = attackBox();
  if (!box) return;
  const k = g.kirby;
  const ab = g.ability;
  const color = ABILITIES.find((a) => a.id === ab)?.color || '#ffffff';
  const t = g.clock / 60;
  const x = box.x - cam;
  ctx.save();
  if (ab === 'fire' || ab === 'ice') {
    // Puffs of flame or frost that grow toward the front
    for (let i = 0; i < 6; i++) {
      const d = (i / 6) * box.w;
      const px = k.face > 0 ? x + d : x + box.w - d;
      const r = 4 + i * 1.6;
      const py = box.y + 11 + Math.sin(t + i) * 3;
      ctx.fillStyle = i % 2 ? color : (ab === 'fire' ? '#ffe14a' : '#ffffff');
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (ab === 'beam') {
    for (let i = 0; i < 5; i++) {
      const px = k.face > 0 ? x + i * 10 : x + box.w - i * 10;
      ctx.fillStyle = i % 2 ? '#ffe14a' : color;
      star(ctx, px, box.y + 11 + Math.sin(t * 2 + i) * 6, 4);
    }
  } else if (ab === 'sword') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    const cx = k.x + k.w / 2 - cam;
    ctx.beginPath();
    ctx.arc(cx, k.y + 10, 24, k.face > 0 ? -1.3 : Math.PI - 0.6, k.face > 0 ? 0.6 : Math.PI + 1.3);
    ctx.stroke();
  } else if (ab === 'spark') {
    ctx.strokeStyle = Math.floor(t) % 2 ? '#ffe14a' : '#ffffff';
    ctx.lineWidth = 2;
    const cx = k.x + k.w / 2 - cam;
    const cy = k.y + k.h / 2;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t;
      ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
      ctx.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    }
    ctx.stroke();
  } else if (ab === 'wing') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 1; i < 4; i++) ctx.fillRect(k.x - cam - k.face * i * 8, k.y + 4 + i * 4, 10, 2);
  }
  ctx.restore();
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

// ---------------------------------------------------------------- Ability Book and buttons

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
  if (g && g.phase === 'play') g.phase = 'book';
  $('book').hidden = false;
}
$('btn-book').addEventListener('click', openBook);
$('book-close').addEventListener('click', () => {
  $('book').hidden = true;
  if (g && g.phase === 'book') g.phase = 'play';
  pad.clear();
});
$('btn-play').addEventListener('click', startLevel);
$('btn-next').addEventListener('click', startLevel);

const startArt = $('start-art').getContext('2d');
startArt.imageSmoothingEnabled = false;
startArt.drawImage(kirbyCanvas(save.ability), 0, 0);
$('hud-stars').textContent = `⭐ ${save.stars}`;

// Testing helper: open with ?debug
if (location.search.includes('debug')) {
  window.__kb = {
    g: () => g,
    word: () => quiz?.word,
    save: () => save,
    warp: (x) => { g.kirby.x = x; g.kirby.y = 60; g.kirby.vy = 0; },
  };
}
