// Dragon data and pixel-art generator.
// Dragons are drawn with simple shapes on a small 64x64 canvas, then snapped to a
// limited palette and outlined so they read as pixel art when scaled up.

export const DRAGON_SIZE = 64;

export const DRAGONS = [
  {
    id: 'worm', name: 'Worm', type: 'Earth', book: 1, master: 'Drake',
    word: 'mud', area: 'bracken', effect: 'mud', shape: 'serpent',
    colors: { main: '#8a5a2b', light: '#c49a6c', dark: '#5e3b1a', accent: '#5fd35f' },
  },
  {
    id: 'kepri', name: 'Kepri', type: 'Sun', book: 2, master: 'Ana',
    word: 'sun', area: 'bracken', effect: 'sun', shape: 'winged',
    colors: { main: '#f2a900', light: '#ffe58a', dark: '#c46a00', accent: '#ff6b00' },
  },
  {
    id: 'shu', name: 'Shu', type: 'Water', book: 3, master: 'Bo',
    word: 'wet', area: 'bracken', effect: 'wet', shape: 'serpent', fins: true,
    colors: { main: '#2f7fd1', light: '#9fd3ff', dark: '#1d4f8a', accent: '#ffffff' },
  },
  {
    id: 'vulcan', name: 'Vulcan', type: 'Fire', book: 4, master: 'Rori',
    word: 'hot', area: 'bracken', effect: 'hot', shape: 'winged',
    colors: { main: '#d62f2f', light: '#ffb36b', dark: '#8e1b1b', accent: '#ffd23f' },
  },
  // ---- Forest
  {
    id: 'zera', name: 'Zera', type: 'Poison', book: 5, master: 'Petra',
    word: 'gas', area: 'forest', effect: 'gas', shape: 'winged',
    colors: { main: '#7b3fa0', light: '#c9a0e8', dark: '#4a2266', accent: '#7dff6a' },
  },
  {
    id: 'lalo', name: 'Lalo', type: 'Lightning', book: 7, master: 'Carlos',
    word: 'zap', area: 'forest', effect: 'zap', shape: 'winged',
    colors: { main: '#2f4fb0', light: '#8fb0ff', dark: '#1a2a6a', accent: '#ffe14a' },
  },
  {
    id: 'neru', name: 'Neru', type: 'Thunder', book: 8, master: 'Eko',
    word: 'bam', area: 'forest', effect: 'bam', shape: 'winged',
    colors: { main: '#5a5f7a', light: '#a9aec8', dark: '#33364a', accent: '#ffe14a' },
  },
  {
    id: 'dayo', name: 'Dayo', type: 'Rainbow', book: 10, master: 'Obi',
    word: 'rainbow', area: 'forest', effect: 'rainbow', shape: 'winged',
    colors: { main: '#9b5de5', light: '#fee440', dark: '#00a6e0', accent: '#f15bb5' },
  },
  {
    id: 'fallyn', name: 'Fallyn', type: 'Spring', book: 14, master: 'Breen',
    word: 'bud', area: 'forest', effect: 'bud', shape: 'winged',
    colors: { main: '#6cc25a', light: '#d8f5b0', dark: '#3d8a35', accent: '#ff7eb6' },
  },
  // ---- Mountain cave
  {
    id: 'wati', name: 'Wati', type: 'Moon', book: 6, master: 'Heru',
    word: 'moon', area: 'cave', effect: 'moon', shape: 'winged',
    colors: { main: '#b8c0dc', light: '#eef2ff', dark: '#6b74a0', accent: '#4060ff' },
  },
  {
    id: 'frost', name: 'Frost', type: 'Ice', book: 9, master: 'Mina',
    word: 'ice', area: 'cave', effect: 'ice', shape: 'winged',
    colors: { main: '#a8dcf7', light: '#ffffff', dark: '#5fa3d0', accent: '#2f7fd1' },
  },
  {
    id: 'argent', name: 'Argent', type: 'Silver', book: 11, master: 'Jean',
    word: 'silver', area: 'cave', effect: 'silver', shape: 'winged',
    colors: { main: '#b9bec8', light: '#eef0f4', dark: '#7a808b', accent: '#3a7bd5' },
  },
  {
    id: 'hema', name: 'Hema', type: 'Gold', book: 12, master: 'Darma',
    word: 'gold', area: 'cave', effect: 'gold', shape: 'winged',
    colors: { main: '#e0b030', light: '#fff0a0', dark: '#a07010', accent: '#d62f2f' },
  },
  {
    id: 'naga', name: 'Naga', type: 'Earthquake', book: 13, master: 'Uri and Zelda',
    word: 'rock', area: 'cave', effect: 'rock', shape: 'winged', wings: false,
    colors: { main: '#8a7a66', light: '#c2b49a', dark: '#55493a', accent: '#ff8c1a' },
  },
];

// Areas in the order they unlock.
export const AREAS = ['bracken', 'forest', 'cave'];

export function dragonsIn(area) {
  return DRAGONS.filter((d) => d.area === area);
}

export function areaDone(area, caught) {
  return dragonsIn(area).every((d) => caught.includes(d.id));
}

// An area is open once every area before it is complete.
export function unlockedAreas(caught) {
  const out = [];
  for (const a of AREAS) {
    out.push(a);
    if (!areaDone(a, caught)) break;
  }
  return out;
}

export function dragonById(id) {
  return DRAGONS.find((d) => d.id === id);
}

// ---------------------------------------------------------------- Art

const OUTLINE = '#1d1426';
const HORN = '#f3e7c9';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

function stroke(ctx, points, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Four-legged dragon, facing left. Wings unless wings === false.
function drawWinged(ctx, c, wings = true) {
  // Wing behind the body
  if (wings) {
    poly(ctx, [[36, 34], [43, 8], [50, 14], [57, 6], [61, 26], [48, 37]], c.dark);
    stroke(ctx, [[40, 33], [43, 9]], 2, c.main);
    stroke(ctx, [[44, 34], [50, 14]], 2, c.main);
    stroke(ctx, [[48, 35], [57, 7]], 2, c.main);
  } else {
    // Rocky ridge instead of wings
    for (const [x, y] of [[34, 32], [40, 31], [46, 33], [51, 37]]) poly(ctx, [[x - 4, y + 3], [x, y - 6], [x + 4, y + 3]], c.dark);
  }
  // Tail
  stroke(ctx, [[46, 47], [56, 50], [61, 44], [59, 35]], 6, c.main);
  poly(ctx, [[55, 35], [59, 26], [63, 35]], c.dark);
  // Back leg
  ellipse(ctx, 44, 50, 7, 7, c.main);
  ellipse(ctx, 42, 57, 6, 3, c.dark);
  // Body and belly
  ellipse(ctx, 35, 44, 14, 11, c.main);
  ellipse(ctx, 30, 47, 7, 8, c.light);
  // Front leg
  ellipse(ctx, 26, 53, 4, 6, c.main);
  ellipse(ctx, 24, 58, 5, 2.5, c.dark);
  // Neck, head, snout
  stroke(ctx, [[32, 38], [21, 25]], 10, c.main);
  ellipse(ctx, 18, 20, 9, 7.5, c.main);
  ellipse(ctx, 9, 23, 6.5, 4.5, c.main);
  // Horns
  poly(ctx, [[19, 14], [27, 3], [25, 15]], HORN);
  poly(ctx, [[23, 15], [33, 8], [28, 18]], HORN);
  // Back spikes
  poly(ctx, [[28, 33], [31, 28], [33, 34]], c.dark);
  poly(ctx, [[45, 37], [49, 33], [50, 39]], c.dark);
}

// Long snake-like dragon (Worm, Shu). Optional fins for water dragons.
function drawSerpent(ctx, c, fins) {
  // Body: a chain of circles from tail tip to neck, growing thicker.
  const path = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = 60 - t * 38 + Math.sin(t * Math.PI * 2) * 4;
    const y = 58 - t * 30 + Math.sin(t * Math.PI * 1.5) * 8;
    path.push([x, y, 2.5 + t * 6]);
  }
  if (fins) {
    for (const i of [14, 22, 30]) {
      const [x, y, r] = path[i];
      poly(ctx, [[x - 3, y - r + 1], [x + 3, y - r - 7], [x + 5, y - r + 2]], c.light);
    }
  }
  for (const [x, y, r] of path) ellipse(ctx, x, y + 1.5, r, r, c.light);
  for (const [x, y, r] of path) ellipse(ctx, x, y - 0.5, r * 0.9, r * 0.9, c.main);
  // Head
  ellipse(ctx, 18, 22, 10, 8, c.main);
  ellipse(ctx, 9, 26, 6.5, 5, c.main);
  if (fins) poly(ctx, [[20, 15], [30, 8], [28, 19]], c.light);
}

// Snap every pixel to the palette (removes blurry edges), then add a dark outline.
function pixelate(ctx, size, palette) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const pal = palette.map(hexToRgb);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    let best = pal[0];
    let bestDist = Infinity;
    for (const p of pal) {
      const dist = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2;
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
  }
  const solid = (x, y) => x >= 0 && y >= 0 && x < size && y < size && d[(y * size + x) * 4 + 3] === 255;
  const edge = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    }
  }
  const o = hexToRgb(OUTLINE);
  for (const [x, y] of edge) {
    const i = (y * size + x) * 4;
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function drawFace(ctx, c, shape) {
  const eyeY = shape === 'serpent' ? 19 : 17;
  px(ctx, 14, eyeY, 4, 4, '#ffffff');
  px(ctx, 14, eyeY + 1, 2, 3, c.accent === '#ffffff' ? OUTLINE : c.accent);
  px(ctx, 14, eyeY + 2, 1, 1, OUTLINE);
  // Nostril and mouth
  const mouthY = shape === 'serpent' ? 28 : 25;
  px(ctx, 4, mouthY - 4, 1, 1, OUTLINE);
  px(ctx, 4, mouthY, 9, 1, OUTLINE);
}

const cache = new Map();

// Returns { normal, white, dark } canvases. `white` is a silhouette used for the catch flash.
export function dragonSprite(dragon) {
  if (cache.has(dragon.id)) return cache.get(dragon.id);
  const size = DRAGON_SIZE;
  const c = dragon.colors;
  const normal = document.createElement('canvas');
  normal.width = normal.height = size;
  const ctx = normal.getContext('2d');
  if (dragon.shape === 'serpent') drawSerpent(ctx, c, dragon.fins);
  else drawWinged(ctx, c, dragon.wings !== false);
  pixelate(ctx, size, [c.main, c.light, c.dark, HORN]);
  drawFace(ctx, c, dragon.shape);

  const white = document.createElement('canvas');
  white.width = white.height = size;
  const w = white.getContext('2d');
  w.drawImage(normal, 0, 0);
  w.globalCompositeOperation = 'source-in';
  w.fillStyle = '#ffffff';
  w.fillRect(0, 0, size, size);

  // Dark shadow for dragons not caught yet.
  const dark = document.createElement('canvas');
  dark.width = dark.height = size;
  const k = dark.getContext('2d');
  k.drawImage(normal, 0, 0);
  k.globalCompositeOperation = 'source-in';
  k.fillStyle = '#120c1a';
  k.fillRect(0, 0, size, size);

  const out = { normal, white, dark };
  cache.set(dragon.id, out);
  return out;
}

// ---------------------------------------------------------------- Encounters

// Uncaught dragons show up more often so he can fill his Dragon Book.
export function pickWildDragon(area, caught) {
  const pool = dragonsIn(area);
  const weighted = pool.flatMap((d) => (caught.includes(d.id) ? [d] : [d, d, d]));
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// The right word plus (count - 1) other dragon words, shuffled.
// Wrong words only come from areas he has reached, so tricky words show up later.
export function wordChoices(dragon, count, areas = AREAS) {
  const pool = DRAGONS.filter((d) => areas.includes(d.area)).map((d) => d.word);
  const others = [...new Set(pool)].filter((w) => w !== dragon.word);
  shuffle(others);
  return shuffle([dragon.word, ...others.slice(0, count - 1)]);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
