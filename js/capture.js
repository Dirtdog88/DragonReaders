// The capture screen: a wild dragon appears with a visual clue, and the player
// taps the word that matches it.

import { dragonSprite, DRAGON_SIZE } from './dragons.js';
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
};

function drawBackground(ctx) {
  const bands = ['#cfe9ff', '#bfe1fd', '#afd9fa'];
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, (i * GROUND_Y) / 3, W, GROUND_Y / 3 + 1);
  });
  ctx.fillStyle = '#8bd16a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#74bd55';
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

  function start(dragon, choices) {
    s = {
      dragon,
      sprite: dragonSprite(dragon),
      effect: EFFECTS[dragon.effect] || {},
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
    for (const word of choices) {
      const b = document.createElement('button');
      b.className = 'word-btn';
      b.textContent = word;
      b.dataset.word = word;
      b.addEventListener('click', () => choose(word, b));
      wordsEl.appendChild(b);
    }
    resultEl.hidden = true;
    el.hidden = false;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function choose(word, btn) {
    if (!s || s.phase !== 'choose') return;
    const right = word === s.dragon.word;
    onAnswer?.(s.dragon.word, right);
    if (right) {
      btn.classList.remove('hint');
      btn.classList.add('right');
      wordsEl.querySelectorAll('.word-btn').forEach((b) => { b.disabled = true; });
      speak(word);
      s.phase = 'catch';
      s.t = 0;
    } else {
      // Gentle retry: fade the wrong word, say and highlight the right one.
      btn.classList.add('wrong');
      btn.disabled = true;
      s.wiggle = 500;
      s.mistakes++;
      wordsEl.querySelector(`[data-word="${s.dragon.word}"]`)?.classList.add('hint');
      speak(s.dragon.word);
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

  function finish(caught) {
    cancelAnimationFrame(raf);
    el.hidden = true;
    const result = { dragon: s.dragon, caught, mistakes: s.mistakes };
    s = null;
    onDone(result);
  }

  $('capture-run').addEventListener('click', () => {
    if (s && (s.phase === 'appear' || s.phase === 'choose')) finish(false);
  });
  $('result-ok').addEventListener('click', () => {
    if (s && s.phase === 'result') finish(true);
  });

  function update(dt) {
    s.t += dt;
    s.clock += dt;
    s.wiggle = Math.max(0, s.wiggle - dt);
    if (s.phase === 'appear' && s.t >= APPEAR_MS) {
      s.phase = 'choose';
      wordsEl.classList.add('shown');
    }
    if (s.phase === 'catch' && s.t >= CATCH_MS) showResult();

    const fx = s.effect;
    const caughtAlready = s.phase === 'catch' || s.phase === 'result';
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
      if (p.life < p.max && p.y < H + 4) next.push(p);
    }
    s.particles = next;
  }

  function draw() {
    const { t, clock } = s;
    drawBackground(ctx);
    s.effect.back?.(ctx, clock);

    let x = DX;
    let y = DY;
    if (s.phase === 'appear') x = DX + Math.round((1 - t / APPEAR_MS) * 90);
    if (s.wiggle > 0) x += Math.round(Math.sin(s.wiggle * 0.06) * 3);

    if (s.phase === 'appear' || s.phase === 'choose') {
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
      ctx.fillStyle = fx.color ? fx.color(f, p) : '#ffffff';
      const sz = fx.size ? fx.size(f, p) : 1;
      const [w, h] = Array.isArray(sz) ? sz : [sz, sz];
      ctx.fillRect(Math.round(p.x), Math.round(p.y), w, h);
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

  function loop(now) {
    if (!s) return;
    const dt = Math.min(50, now - last);
    last = now;
    update(dt);
    if (!s) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  return { start, isActive: () => !!s };
}
