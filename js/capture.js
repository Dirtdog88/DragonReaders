// The capture screen: a wild dragon appears with a visual clue, and the player
// taps the word that matches it.

import { dragonSprite, DRAGON_SIZE, pixelate } from './dragons.js';
import { speak } from './speech.js';

const W = 128;
const H = 96;
const DX = 44; // where the dragon sits
const DY = 18;
const GROUND_Y = 60;
const GEM_X = DX + DRAGON_SIZE / 2;
const GEM_Y = 84;
const APPEAR_MS = 450;
const CATCH_MS = 1400;
// Battle against Maldred
const HIT_MS = 1300; // beam, impact, then the next dragon
const DEFEAT_MS = 1600;
const MX = 2; // where Maldred stands (left side, facing the dragon)
const MY = 30;
const M_SIZE = 48;

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- Clue effects
// Each effect can draw behind the dragon (back) and spawn particles in front of it.

const EFFECTS = {
  hot: {
    every: 20,
    spawn: () => ({ x: DX + 3, y: DY + 24 + rand(-2, 2), vx: -rand(0.04, 0.09), vy: rand(-0.025, 0.015), max: rand(450, 750) }),
    color: (f) => (f < 0.3 ? '#fff3a0' : f < 0.65 ? '#ffb000' : '#e03b1f'),
    size: (f) => (f < 0.35 ? 3 : f < 0.7 ? 2 : 1),
  },
  wet: {
    every: 45,
    spawn: () => ({ x: rand(DX - 6, DX + 70), y: 0, vx: -0.01, vy: 0.11, max: 2000, floor: rand(70, 86), drop: true }),
    color: (f, p) => (p.drop ? '#5fb4ff' : '#cfeaff'),
    size: (f, p) => (p.drop ? [1, 3] : 1),
    back(ctx) {
      ctx.fillStyle = '#5fb4ff';
      ctx.beginPath();
      ctx.ellipse(GEM_X, 80, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  mud: {
    every: 90,
    spawn: () => ({ x: rand(DX - 4, DX + 68), y: 80, vx: rand(-0.035, 0.035), vy: -rand(0.12, 0.2), g: 0.0004, max: 1400 }),
    color: () => '#3d2410',
    size: () => [4, 3],
    back(ctx) {
      ctx.fillStyle = '#6b4423';
      ctx.beginPath();
      ctx.ellipse(GEM_X, 80, 42, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7d5230';
      for (const [x, y] of [[50, 78], [70, 83], [92, 77], [100, 82], [60, 74]]) ctx.fillRect(x, y, 4, 2);
    },
  },
  sun: {
    every: 0,
    back(ctx, t) {
      const cx = DX + 46;
      const cy = DY + 6;
      ctx.fillStyle = '#fff0a0';
      ctx.beginPath();
      ctx.arc(cx, cy, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb000';
      const spin = t / 900;
      for (let i = 0; i < 12; i++) {
        const a = spin + (i / 12) * Math.PI * 2;
        for (let r = 22; r < 28; r += 2) {
          ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2);
        }
      }
    },
  },
  gas: {
    every: 90,
    spawn: () => ({ x: DX + 2, y: DY + 22, vx: -rand(0.012, 0.03), vy: -rand(0, 0.012), max: rand(1400, 1900) }),
    drawP(ctx, p, f) {
      ctx.fillStyle = f < 0.5 ? '#9be36b' : '#c4f29a';
      ctx.beginPath();
      ctx.arc(Math.round(p.x), Math.round(p.y), 2 + f * 6, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  zap: {
    theme: 'storm',
    front(ctx, t) {
      const cycle = 900;
      const phase = t % cycle;
      if (phase > 120 && phase < 170) return; // quick flicker; otherwise a bolt is always showing
      const n = Math.floor(t / cycle);
      if (phase < 60) {
        ctx.fillStyle = 'rgba(255, 255, 220, 0.35)';
        ctx.fillRect(0, 0, W, H);
      }
      // Jagged bolt from the sky to the ground beside the dragon
      let x = [26, 112, 34, 104][n % 4];
      const pts = [[x, 0]];
      for (let y = 10; y <= 78; y += 10) {
        x += ((n * 7 + y) % 3 - 1) * 5;
        pts.push([x, y]);
      }
      for (const [w, c] of [[4, '#ffe14a'], [2, '#ffffff']]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
    },
  },
  boom: {
    theme: 'storm',
    back(ctx) {
      ctx.fillStyle = '#4b5064';
      for (const [x, y, r] of [[8, 6, 14], [26, 10, 13], [44, 4, 12], [64, 8, 13], [84, 4, 12], [104, 9, 14], [122, 5, 12]]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    // Thunder shakes everything, then a shock ring rolls out across the ground.
    shake: (t) => (t % 1100 < 220 ? [Math.round(rand(-2, 2)), Math.round(rand(-2, 2))] : [0, 0]),
    front(ctx, t) {
      const phase = t % 1100;
      if (phase > 600) return;
      const k = phase / 600;
      ctx.strokeStyle = `rgba(255, 240, 160, ${1 - k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(GEM_X, 80, 10 + k * 50, 3 + k * 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  rainbow: {
    back(ctx) {
      const colors = ['#ff4d4d', '#ff9f1c', '#ffe14a', '#4cd964', '#3a8bff', '#9b5de5'];
      colors.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(GEM_X, 74, 56 - i * 3, Math.PI, 0);
        ctx.stroke();
      });
    },
  },
  bud: {
    every: 150,
    spawn: () => ({ x: rand(DX - 34, DX + 80), y: rand(68, 92), vx: 0, vy: 0, max: 2600 }),
    drawP(ctx, p, f) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      const grow = Math.min(1, f * 3);
      ctx.fillStyle = '#3d8a35';
      ctx.fillRect(x, y - Math.round(grow * 5), 1, Math.round(grow * 5));
      if (grow >= 1) {
        if (f < 0.5) {
          ctx.fillStyle = '#7bd36a'; // green bud
          ctx.fillRect(x - 1, y - 8, 3, 3);
        } else {
          ctx.fillStyle = '#ff7eb6'; // open flower
          ctx.fillRect(x - 3, y - 8, 7, 3);
          ctx.fillRect(x - 1, y - 10, 3, 7);
          ctx.fillStyle = '#ffe14a';
          ctx.fillRect(x, y - 7, 1, 1);
        }
      }
    },
  },
  moon: {
    theme: 'night',
    back(ctx, t) {
      for (let i = 0; i < 18; i++) {
        if ((Math.floor(t / 300) + i) % 5 === 0) continue; // twinkle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((i * 37) % W, (i * 23) % 50, 1, 1);
      }
      const mx = DX + 54;
      const my = DY + 2;
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath();
      ctx.arc(mx, my, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c2450';
      ctx.beginPath();
      ctx.arc(mx + 6, my - 4, 11, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  ice: {
    every: 70,
    spawn: () => ({ x: rand(0, W), y: 0, vx: 0, vy: rand(0.018, 0.03), max: 5000, seed: rand(0, 6) }),
    drawP(ctx, p) {
      ctx.fillStyle = '#ffffff';
      const x = Math.round(p.x + Math.sin(p.y / 8 + p.seed) * 3);
      const y = Math.round(p.y);
      ctx.fillRect(x, y, 2, 2);
    },
    back(ctx) {
      ctx.fillStyle = '#dff4ff';
      ctx.beginPath();
      ctx.ellipse(GEM_X, 80, 44, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bfe8ff';
      for (const x of [44, 56, 92, 104]) {
        ctx.beginPath();
        ctx.moveTo(x - 3, 82);
        ctx.lineTo(x + 3, 82);
        ctx.lineTo(x, 70);
        ctx.fill();
      }
    },
  },
  silver: {
    every: 55,
    spawn: () => ({ x: rand(DX - 10, DX + 70), y: rand(DY - 10, DY + 62), vx: 0, vy: 0, max: 700 }),
    drawP(ctx, p, f) {
      const r = Math.round(Math.sin(f * Math.PI) * 5);
      if (r < 1) return;
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - r, y, r * 2 + 1, 1);
      ctx.fillRect(x, y - r, 1, r * 2 + 1);
      ctx.fillStyle = '#dfe6f0';
      ctx.fillRect(x - 1, y - 1, 3, 3);
    },
  },
  gold: {
    every: 160,
    spawn: () => ({ x: rand(DX - 20, DX + 80), y: -4, vx: 0, vy: 0.04, max: 3000, floor: rand(74, 88), coin: true }),
    drawP(ctx, p, f, t) {
      const wide = Math.floor(t / 120 + p.x) % 2 === 0;
      const x = Math.round(p.x);
      const y = Math.round(Math.min(p.y, p.floor));
      ctx.fillStyle = '#a07010';
      ctx.fillRect(x - (wide ? 2 : 1), y - 2, wide ? 5 : 3, 5);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - (wide ? 1 : 0), y - 1, wide ? 3 : 1, 3);
    },
    back(ctx) {
      // Pile of coins on the ground
      for (const [x, y] of [[40, 84], [46, 82], [52, 85], [100, 83], [106, 85], [94, 86], [48, 79], [103, 80]]) {
        ctx.fillStyle = '#a07010';
        ctx.fillRect(x - 3, y - 2, 7, 4);
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(x - 2, y - 2, 5, 2);
      }
    },
  },
  rock: {
    theme: 'cave',
    every: 200,
    spawn: () => ({ x: rand(DX - 24, DX + 84), y: -6, vx: rand(-0.02, 0.02), vy: 0.02, g: 0.0003, max: 2500, floor: rand(76, 88), bounce: true }),
    shake: (t) => (t % 1300 < 260 ? [Math.round(rand(-2, 2)), 0] : [0, 0]),
    drawP(ctx, p) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.fillStyle = '#1d1426';
      ctx.fillRect(x - 5, y - 3, 10, 8);
      ctx.fillStyle = '#7a6a56';
      ctx.fillRect(x - 4, y - 2, 8, 6);
      ctx.fillStyle = '#b3a38a';
      ctx.fillRect(x - 3, y - 2, 4, 2);
    },
    back(ctx) {
      // Cracks in the ground
      ctx.strokeStyle = '#1d1426';
      ctx.lineWidth = 1;
      for (const pts of [[[30, 70], [36, 76], [33, 82], [40, 90]], [[110, 72], [104, 78], [108, 84], [100, 92]]]) {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
    },
  },
};

const THEMES = {
  day: { sky: ['#cfe9ff', '#bfe1fd', '#afd9fa'], ground: '#8bd16a', spot: '#74bd55' },
  storm: { sky: ['#7d8597', '#8e96a8', '#a0a8b8'], ground: '#6fa65a', spot: '#5d9149' },
  night: { sky: ['#141a3a', '#1c2450', '#263066'], ground: '#3d6b3a', spot: '#335c31' },
  cave: { sky: ['#2a2433', '#332b3f', '#3d344b'], ground: '#4a4458', spot: '#5a5368' },
  tower: { sky: ['#1a0f24', '#22142e', '#2b1a3a'], ground: '#3a2a4a', spot: '#4a3660' },
};

function drawBackground(ctx, theme) {
  const th = THEMES[theme] || THEMES.day;
  th.sky.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, (i * GROUND_Y) / 3, W, GROUND_Y / 3 + 1);
  });
  ctx.fillStyle = th.ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  if (theme === 'cave') {
    // Stalactites
    ctx.fillStyle = '#1d1426';
    for (const [x, len] of [[6, 12], [22, 7], [34, 15], [58, 6], [104, 13], [118, 8]]) {
      ctx.beginPath();
      ctx.moveTo(x - 4, 0);
      ctx.lineTo(x + 4, 0);
      ctx.lineTo(x, len);
      ctx.fill();
    }
  }
  ctx.fillStyle = th.spot;
  ctx.beginPath();
  ctx.ellipse(GEM_X, 80, 46, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The green Dragon Stone that catches the dragon.
function drawGem(ctx, x, y, t) {
  const glow = 6 + Math.sin(t / 120) * 2;
  ctx.fillStyle = 'rgba(120, 255, 140, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, glow + 4, 0, Math.PI * 2);
  ctx.fill();
  const rows = ['..kkkk..', '.kggggk.', 'kgGGgggk', 'kgGgggdk', 'kgggggdk', '.kgggdk.', '..kddk..', '...kk...'];
  const colors = { k: '#1d1426', g: '#3ccf5a', G: '#c8ffd0', d: '#1f8a3a' };
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(Math.round(x - 4 + rx), Math.round(y - 4 + ry), 1, 1);
    });
  });
}

// ---------------------------------------------------------------- Maldred

let maldredCache = null;

// The evil wizard, facing right toward the dragon. Drawn like the dragons:
// simple shapes snapped to a palette with a dark outline.
function maldredSprite() {
  if (maldredCache) return maldredCache;
  const c = document.createElement('canvas');
  c.width = c.height = M_SIZE;
  const x = c.getContext('2d');
  const shape = (pts, col) => {
    x.fillStyle = col;
    x.beginPath();
    pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.closePath();
    x.fill();
  };
  const oval = (cx, cy, rx, ry, col) => {
    x.fillStyle = col;
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
  };
  const ROBE = '#3a1d4a';
  const HAT = '#24102e';
  const RED = '#b3202a';
  const SKIN = '#9fb59a';
  const WOOD = '#5e3b1a';
  const ORB = '#d62fbf';
  x.fillStyle = WOOD;
  x.fillRect(37, 12, 3, 35); // staff
  shape([[15, 21], [29, 21], [37, 46], [7, 46]], ROBE);
  shape([[7, 42], [37, 42], [37, 46], [7, 46]], RED);
  x.fillStyle = RED;
  x.fillRect(14, 31, 17, 2); // belt
  oval(32, 28, 6, 3, ROBE); // arm reaching for the staff
  oval(37, 28, 2.5, 2.5, SKIN);
  oval(22, 18, 5.5, 5.5, SKIN); // face
  oval(22, 14, 13, 2.5, HAT); // brim
  shape([[12, 14], [32, 14], [25, 4], [30, 0], [20, 3]], HAT); // bent pointy hat
  oval(38, 9, 4.5, 4.5, ORB);
  pixelate(x, M_SIZE, [ROBE, HAT, RED, SKIN, WOOD, ORB]);
  x.fillStyle = '#ff2a2a';
  x.fillRect(20, 17, 2, 1); // glowing eyes
  x.fillRect(24, 17, 2, 1);
  x.fillStyle = '#1d1426';
  x.fillRect(20, 21, 5, 1); // frown
  x.fillStyle = '#ffffff';
  x.fillRect(37, 7, 1, 1); // orb shine

  const white = document.createElement('canvas');
  white.width = white.height = M_SIZE;
  const w = white.getContext('2d');
  w.drawImage(c, 0, 0);
  w.globalCompositeOperation = 'source-in';
  w.fillStyle = '#ffffff';
  w.fillRect(0, 0, M_SIZE, M_SIZE);
  maldredCache = { normal: c, white };
  return maldredCache;
}

function drawHearts(ctx, hearts, max) {
  const rows = ['.kk.kk.', 'kRRkRRk', 'kRRRRRk', '.kRRRk.', '..kRk..', '...k...'];
  for (let i = 0; i < max; i++) {
    const full = i < hearts;
    rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'k' ? '#1d1426' : full ? '#e8364a' : '#4a3a5c';
      ctx.fillRect(4 + i * 9 + rx, 4 + ry, 1, 1);
    }));
  }
}

// Gold trophy for the victory card (64x64).
function drawTrophy(ctx) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  ctx.clearRect(0, 0, 64, 64);
  R(14, 6, 36, 4, '#1d1426');
  R(16, 8, 32, 22, '#1d1426');
  R(18, 8, 28, 20, '#f5c542');
  R(20, 10, 6, 14, '#fff0a0');
  R(6, 10, 10, 3, '#1d1426'); R(6, 10, 3, 12, '#1d1426'); R(6, 20, 12, 3, '#1d1426'); // handles
  R(48, 10, 10, 3, '#1d1426'); R(55, 10, 3, 12, '#1d1426'); R(46, 20, 12, 3, '#1d1426');
  R(20, 28, 24, 4, '#1d1426'); R(22, 28, 20, 3, '#d9a520');
  R(28, 32, 8, 12, '#1d1426'); R(30, 32, 4, 12, '#d9a520');
  R(18, 44, 28, 4, '#1d1426'); R(20, 44, 24, 3, '#f5c542');
  R(14, 48, 36, 10, '#1d1426'); R(16, 50, 32, 6, '#7a2f1f');
  R(26, 14, 12, 8, '#d9a520'); // star-ish emblem
  R(30, 12, 4, 12, '#d9a520');
}

// ---------------------------------------------------------------- Screen

export function createCapture({ onDone, onAnswer }) {
  const el = $('capture');
  const canvas = $('capture-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const wordsEl = $('capture-words');
  const resultEl = $('capture-result');

  let s = null;
  let raf = 0;
  let last = 0;

  // battle = { hearts, max } turns this into a round against Maldred.
  function start(dragon, choices, answer, battle = null) {
    const fxTheme = (EFFECTS[dragon.effect] || {}).theme;
    s = {
      dragon,
      answer,
      battle: battle ? { ...battle } : null,
      hitApplied: false,
      sprite: dragonSprite(dragon),
      effect: EFFECTS[dragon.effect] || {},
      // Battles always happen inside Maldred's dark tower.
      theme: battle ? 'tower' : fxTheme || (dragon.area === 'cave' ? 'cave' : 'day'),
      phase: 'appear',
      t: 0,
      clock: 0,
      wiggle: 0,
      particles: [],
      spawnTimer: 0,
      mistakes: 0,
    };
    wordsEl.innerHTML = '';
    wordsEl.classList.remove('shown');
    wordsEl.classList.toggle('three', choices.length >= 3);
    for (const word of choices) {
      const b = document.createElement('button');
      b.className = 'word-btn';
      b.textContent = word;
      b.dataset.word = word;
      b.addEventListener('click', () => choose(word, b));
      wordsEl.appendChild(b);
    }
    // Run the effect for a moment first so the clue is already showing.
    for (let i = 0; i < 40; i++) stepParticles(50);
    resultEl.hidden = true;
    el.hidden = false;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function choose(word, btn) {
    if (!s || s.phase !== 'choose') return;
    const right = word === s.answer;
    onAnswer?.(s.answer, right);
    if (right) {
      btn.classList.remove('hint');
      btn.classList.add('right');
      wordsEl.querySelectorAll('.word-btn').forEach((b) => { b.disabled = true; });
      speak(word);
      s.phase = s.battle ? 'hit' : 'catch';
      s.t = 0;
    } else {
      // Gentle retry: fade the wrong word, say and highlight the right one.
      btn.classList.add('wrong');
      btn.disabled = true;
      s.wiggle = 500;
      s.mistakes++;
      wordsEl.querySelector(`[data-word="${s.answer}"]`)?.classList.add('hint');
      speak(s.answer);
    }
  }

  function showResult() {
    s.phase = 'result';
    const rc = $('result-canvas').getContext('2d');
    rc.imageSmoothingEnabled = false;
    rc.clearRect(0, 0, DRAGON_SIZE, DRAGON_SIZE);
    rc.drawImage(s.sprite.normal, 0, 0);
    $('result-text').textContent = `You got ${s.dragon.name}!`;
    $('result-type').textContent = `${s.dragon.type} Dragon`;
    resultEl.hidden = false;
    speak(`You got ${s.dragon.name}!`);
  }

  function showVictory() {
    s.phase = 'victory';
    drawTrophy($('result-canvas').getContext('2d'));
    $('result-text').textContent = 'You beat Maldred!';
    $('result-type').textContent = 'You are a Dragon Master!';
    resultEl.hidden = false;
    speak('You beat Maldred!');
  }

  function finish(caught) {
    cancelAnimationFrame(raf);
    el.hidden = true;
    const result = { dragon: s.dragon, caught, mistakes: s.mistakes };
    if (s.battle) {
      result.caught = false;
      result.battle = { hearts: s.battle.hearts, won: s.phase === 'victory', fled: s.phase === 'appear' || s.phase === 'choose' };
    }
    s = null;
    onDone(result);
  }

  $('capture-run').addEventListener('click', () => {
    if (s && (s.phase === 'appear' || s.phase === 'choose')) finish(false);
  });
  $('result-ok').addEventListener('click', () => {
    if (s && (s.phase === 'result' || s.phase === 'victory')) finish(true);
  });

  function update(dt) {
    s.t += dt;
    s.clock += dt;
    s.wiggle = Math.max(0, s.wiggle - dt);
    stepPhase();
    stepParticles(dt);
  }

  function stepPhase() {
    if (s.phase === 'appear' && s.t >= APPEAR_MS) {
      s.phase = 'choose';
      wordsEl.classList.add('shown');
    }
    if (s.phase === 'catch' && s.t >= CATCH_MS) showResult();
    if (s.phase === 'hit') {
      if (!s.hitApplied && s.t >= 500) {
        s.hitApplied = true;
        s.battle.hearts = Math.max(0, s.battle.hearts - 1);
      }
      if (s.t >= HIT_MS) {
        if (s.battle.hearts > 0) finish(false);
        else { s.phase = 'defeat'; s.t = 0; }
      }
    }
    if (s && s.phase === 'defeat' && s.t >= DEFEAT_MS) showVictory();
  }

  function stepParticles(dt) {
    const fx = s.effect;
    const caughtAlready = ['catch', 'result', 'defeat', 'victory'].includes(s.phase);
    if (fx.every && !caughtAlready) {
      s.spawnTimer += dt;
      while (s.spawnTimer >= fx.every) {
        s.spawnTimer -= fx.every;
        s.particles.push({ ...fx.spawn(), life: 0 });
      }
    }
    const next = [];
    for (const p of s.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.g) p.vy += p.g * dt;
      if (p.drop && p.y >= p.floor) {
        // Raindrop hits the ground: tiny splash.
        for (const vx of [-0.03, 0.03]) next.push({ x: p.x, y: p.floor, vx, vy: -0.03, g: 0.0003, life: 0, max: 200 });
        continue;
      }
      if (p.bounce && p.y >= p.floor && p.vy > 0) {
        p.y = p.floor;
        p.vy = Math.abs(p.vy) > 0.05 ? -p.vy * 0.4 : 0;
        p.g = p.vy ? p.g : 0;
      }
      if (p.coin && p.y >= p.floor) { p.y = p.floor; p.vy = 0; }
      if (p.life < p.max && p.y < H + 4) next.push(p);
    }
    s.particles = next;
  }

  function draw() {
    const { t, clock } = s;
    drawBackground(ctx, s.theme);
    s.effect.back?.(ctx, clock);

    let x = DX;
    let y = DY;
    if (s.phase === 'appear') x = DX + Math.round((1 - t / APPEAR_MS) * 90);
    if (s.wiggle > 0) x += Math.round(Math.sin(s.wiggle * 0.06) * 3);
    if (s.effect.shake && s.phase !== 'appear') {
      const [sx, sy] = s.effect.shake(clock);
      x += sx;
      y += sy;
    }

    if (s.battle) drawMaldred(t, clock);

    if (s.phase === 'appear' || s.phase === 'choose' || s.phase === 'hit' || s.phase === 'defeat' || s.phase === 'victory') {
      ctx.drawImage(s.sprite.normal, x, y);
    } else if (s.phase === 'catch') {
      if (t < 500) {
        ctx.drawImage(Math.floor(t / 80) % 2 ? s.sprite.white : s.sprite.normal, x, y);
      } else if (t < 1100) {
        // Shrink into the Dragon Stone.
        const k = (t - 500) / 600;
        const scale = 1 - k;
        const cx = DX + 32 + (GEM_X - DX - 32) * k;
        const cy = DY + 32 + (GEM_Y - DY - 32) * k;
        const size = Math.max(1, Math.round(DRAGON_SIZE * scale));
        ctx.drawImage(s.sprite.white, Math.round(cx - size / 2), Math.round(cy - size / 2), size, size);
      }
    }

    for (const p of s.particles) {
      const f = p.life / p.max;
      const fx = s.effect;
      if (fx.drawP) { fx.drawP(ctx, p, f, clock); continue; }
      ctx.fillStyle = fx.color ? fx.color(f, p) : '#ffffff';
      const sz = fx.size ? fx.size(f, p) : 1;
      const [w, h] = Array.isArray(sz) ? sz : [sz, sz];
      ctx.fillRect(Math.round(p.x), Math.round(p.y), w, h);
    }

    s.effect.front?.(ctx, clock);

    if (s.battle) {
      if (s.phase === 'hit' && t < 520) {
        // The dragon's power shoots from its mouth to Maldred.
        const k = Math.min(1, t / 350);
        const sx = DX + 4;
        const sy = DY + 24;
        const ex = sx + (MX + 26 - sx) * k;
        const ey = sy + (MY + 22 - sy) * k;
        for (const [wd, col] of [[7, '#1d1426'], [5, s.dragon.colors.main], [2, '#ffffff']]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = wd;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }
      if (s.phase === 'hit' && t >= 450 && t < 1000) {
        // Impact burst in the dragon's colors
        const k = (t - 450) / 550;
        const cols = [s.dragon.colors.main, s.dragon.colors.light, '#ffffff'];
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const r = 4 + k * 20;
          ctx.fillStyle = cols[i % 3];
          ctx.fillRect(Math.round(MX + 24 + Math.cos(a) * r), Math.round(MY + 22 + Math.sin(a) * r), 3, 3);
        }
      }
      drawHearts(ctx, s.battle.hearts, s.battle.max);
    }

    if (s.phase === 'catch' || s.phase === 'result') {
      drawGem(ctx, GEM_X, GEM_Y - 6, clock);
      if (t >= 1000) {
        ctx.fillStyle = '#fff6a0';
        for (let i = 0; i < 8; i++) {
          const a = clock / 300 + (i / 8) * Math.PI * 2;
          const r = 14 + Math.sin(clock / 150 + i) * 3;
          ctx.fillRect(Math.round(GEM_X + Math.cos(a) * r), Math.round(GEM_Y - 6 + Math.sin(a) * r * 0.7), 2, 2);
        }
      }
    }
  }

  function drawMaldred(t, clock) {
    const m = maldredSprite();
    let mx = MX;
    let my = MY + Math.round(Math.sin(clock / 400) * 1.5); // floats a little
    if (s.wiggle > 0) my -= Math.round(Math.abs(Math.sin(s.wiggle * 0.05)) * 4); // laughs at a wrong word
    if (s.phase === 'hit' && t >= 450 && t < 1000) {
      mx += Math.round(Math.sin(t * 0.2) * 3);
      ctx.drawImage(Math.floor(t / 70) % 2 ? m.white : m.normal, mx, my);
      return;
    }
    if (s.phase === 'defeat' || s.phase === 'victory') {
      // Spins away in a puff of purple smoke.
      const k = s.phase === 'victory' ? 1 : Math.min(1, t / (DEFEAT_MS - 300));
      const size = Math.round(M_SIZE * (1 - k));
      if (size > 1) ctx.drawImage(Math.floor(t / 90) % 2 ? m.white : m.normal, mx + (M_SIZE - size) / 2, my + (M_SIZE - size) / 2, size, size);
      ctx.fillStyle = '#9b5de5';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + clock / 500;
        const r = 6 + k * 22;
        ctx.beginPath();
        ctx.arc(MX + 24 + Math.cos(a) * r, MY + 24 + Math.sin(a) * r * 0.8, 3 + k * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    ctx.drawImage(m.normal, mx, my);
    if (s.phase === 'appear' || s.phase === 'choose') {
      // Magic shield until the right word breaks it
      ctx.strokeStyle = `rgba(214, 47, 191, ${0.45 + Math.sin(clock / 200) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(mx + 24, my + 26, 22, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function loop(now) {
    if (!s) return;
    const dt = Math.min(50, now - last);
    last = now;
    update(dt);
    if (!s) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  return { start, isActive: () => !!s, answer: () => s?.answer };
}
