// Pixel art for the arcade games (Kirby, Halloween). Same method as the dragons:
// draw simple shapes, snap to a palette, add a dark outline, then crisp details.

import { pixelate } from './dragons.js';

const INK = '#1d1426';

function tools(x) {
  return {
    ell(cx, cy, rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); },
    poly(pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); },
    rect(a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); },
    line(pts, w, col) { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); },
    clear(a, b, w, h) { x.clearRect(a, b, w, h); },
    dot(a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); },
  };
}

// size: square canvas; draw(t): shapes; pal: colors to snap to (null = no outline pass);
// details(t): crisp pixels drawn after the outline.
export function pix(size, draw, pal, details) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  draw(tools(x), x);
  if (pal) pixelate(x, size, pal);
  details?.(tools(x), x);
  return c;
}

const cache = new Map();
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

// ================================================================ Kirby

const PINK = '#ffa4c8';
const FEET = '#e0245e';

function kirbyBody() {
  return cached('kirby-body', () => pix(32, (t) => {
    t.ell(5, 19, 3.5, 3, PINK);
    t.ell(27, 16, 3.5, 3, PINK);
    t.ell(10, 28, 5.5, 3.2, FEET);
    t.ell(22, 28, 5.5, 3.2, FEET);
    t.ell(16, 17, 11, 10.5, PINK);
  }, [PINK, FEET], (t) => {
    t.dot(12, 11, 2, 6, '#1d2a6a');
    t.dot(18, 11, 2, 6, '#1d2a6a');
    t.dot(12, 11, 2, 2, '#ffffff');
    t.dot(18, 11, 2, 2, '#ffffff');
    t.dot(12, 15, 2, 1, '#3a5ad8');
    t.dot(18, 15, 2, 1, '#3a5ad8');
    t.dot(8, 18, 3, 1, '#ff6fa0');
    t.dot(21, 18, 3, 1, '#ff6fa0');
    t.dot(15, 19, 2, 1, '#b0204a');
  }));
}

// Inhaling: mouth wide open, cheeks puffed.
function kirbyInhale() {
  return cached('kirby-inhale', () => pix(32, (t) => {
    t.ell(10, 28, 5.5, 3.2, FEET);
    t.ell(22, 28, 5.5, 3.2, FEET);
    t.ell(16, 17, 12.5, 11, PINK);
  }, [PINK, FEET], (t) => {
    t.dot(10, 9, 2, 3, '#1d2a6a');
    t.dot(16, 9, 2, 3, '#1d2a6a');
    t.ell(22, 18, 5, 5, '#7a1030');
    t.ell(22, 20, 3, 2, '#ff6fa0');
  }));
}

// Copy abilities: a hat/look drawn over Kirby, plus what the power is called.
export const ABILITIES = [
  { id: 'fire', name: 'Fire', color: '#ff6b1a' },
  { id: 'ice', name: 'Ice', color: '#7fd8ff' },
  { id: 'sword', name: 'Sword', color: '#3fae4a' },
  { id: 'spark', name: 'Spark', color: '#ffe14a' },
  { id: 'stone', name: 'Stone', color: '#9a8a74' },
  { id: 'beam', name: 'Beam', color: '#d62f2f' },
  { id: 'bomb', name: 'Bomb', color: '#26232f' },
  { id: 'wing', name: 'Wing', color: '#ffffff' },
];

const HATS = {
  fire: () => pix(32, (t) => {
    t.poly([[7, 9], [9, 1], [12, 6], [16, -1], [20, 6], [23, 1], [25, 9], [16, 11]], '#ff3b1a');
    t.poly([[10, 9], [12, 4], [14, 7], [16, 2], [18, 7], [20, 4], [22, 9], [16, 10]], '#ffb000');
  }, ['#ff3b1a', '#ffb000'], (t) => t.dot(15, 6, 2, 3, '#fff3a0')),
  ice: () => pix(32, (t) => {
    t.rect(7, 6, 18, 4, '#bfe8ff');
    for (const x of [8, 13, 18, 23]) t.poly([[x - 2, 7], [x, 0], [x + 2, 7]], '#7fd8ff');
  }, ['#bfe8ff', '#7fd8ff'], (t) => t.dot(9, 7, 14, 1, '#ffffff')),
  sword: () => pix(32, (t) => {
    t.poly([[5, 11], [9, 2], [18, 0], [27, 4], [31, 12], [26, 9], [20, 7], [12, 8]], '#3fae4a');
    t.rect(6, 9, 20, 2.5, '#f5c542');
    t.rect(28, 6, 2.5, 14, '#d8dce2');
    t.rect(26, 19, 7, 2, '#f5c542');
  }, ['#3fae4a', '#f5c542', '#d8dce2']),
  spark: () => pix(32, (t) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x1 = 16 + Math.cos(a) * 11;
      const y1 = 17 + Math.sin(a) * 10.5;
      t.poly([[x1 - Math.sin(a) * 2, y1 + Math.cos(a) * 2], [16 + Math.cos(a) * 16, 17 + Math.sin(a) * 15], [x1 + Math.sin(a) * 2, y1 - Math.cos(a) * 2]], '#ffe14a');
    }
    t.ell(16, 5, 2.5, 2.5, '#ff8c1a');
  }, ['#ffe14a', '#ff8c1a']),
  stone: () => pix(32, (t) => {
    t.rect(6, 8, 21, 3, '#ff8c1a');
    t.poly([[4, 7], [7, 9], [3, 12]], '#ff8c1a');
  }, ['#ff8c1a']),
  beam: () => pix(32, (t) => {
    t.poly([[7, 10], [4, 2], [14, 7]], '#d62f2f');
    t.poly([[25, 10], [28, 2], [18, 7]], '#f5c542');
    t.rect(7, 7, 18, 4, '#d62f2f');
    t.rect(16, 7, 9, 4, '#f5c542');
    t.ell(4, 2, 2, 2, '#f5c542');
    t.ell(28, 2, 2, 2, '#d62f2f');
  }, ['#d62f2f', '#f5c542']),
  bomb: () => pix(32, (t) => {
    t.ell(16, 8, 10, 6, '#26232f');
    t.clear(0, 9, 32, 4);
    t.rect(6, 8, 20, 2.5, '#ffffff');
    t.ell(29, 22, 3.5, 3.5, '#26232f');
  }, ['#26232f', '#ffffff'], (t) => t.dot(30, 17, 1, 2, '#ffb000')),
  wing: () => pix(32, (t) => {
    t.rect(6, 8, 20, 2.5, '#d62f2f');
    t.ell(10, 2, 2.5, 6, '#ffffff');
    t.ell(6, 4, 2, 5, '#ffffff');
  }, ['#d62f2f', '#ffffff']),
};

// Kirby with an ability (or plain). opts.inhale = mouth open.
export function drawKirby(ctx, x, y, ability = null, opts = {}) {
  ctx.drawImage(opts.inhale ? kirbyInhale() : kirbyBody(), x, y);
  if (ability && !opts.inhale) ctx.drawImage(cached(`hat-${ability}`, HATS[ability]), x, y);
}

export function kirbyCanvas(ability = null) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  drawKirby(x, 0, 0, ability);
  return c;
}

// ---------------------------------------------------------------- Enemies (24x24)

const eyes = (t, x1, x2, y) => { t.dot(x1, y, 2, 3, INK); t.dot(x2, y, 2, 3, INK); };

export const ENEMIES = {
  fire: () => pix(24, (t) => {
    t.poly([[5, 12], [8, 2], [12, 7], [16, 1], [19, 12]], '#ffb000');
    t.ell(12, 15, 8, 7, '#ff6b1a');
  }, ['#ffb000', '#ff6b1a'], (t) => eyes(t, 9, 14, 13)),
  ice: () => pix(24, (t) => {
    for (const x of [6, 12, 18]) t.poly([[x - 3, 10], [x, 1], [x + 3, 10]], '#bfe8ff');
    t.ell(12, 15, 8, 7, '#7fd8ff');
  }, ['#bfe8ff', '#7fd8ff'], (t) => eyes(t, 9, 14, 13)),
  sword: () => pix(24, (t) => {
    t.rect(19, 2, 2.5, 14, '#d8dce2');
    t.rect(16, 14, 8, 2, '#f5c542');
    t.ell(11, 15, 7.5, 7, '#9aa0a6');
    t.poly([[3, 12], [8, 3], [17, 6], [19, 11]], '#3fae4a');
  }, ['#d8dce2', '#f5c542', '#9aa0a6', '#3fae4a'], (t) => eyes(t, 8, 12, 14)),
  spark: () => pix(24, (t) => {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? 6 : 11;
      pts.push([12 + Math.cos(a) * r, 12 + Math.sin(a) * r]);
    }
    t.poly(pts, '#ffe14a');
    t.ell(12, 12, 6, 6, '#ffb000');
  }, ['#ffe14a', '#ffb000'], (t) => eyes(t, 9, 13, 10)),
  stone: () => pix(24, (t) => {
    t.poly([[3, 20], [2, 11], [7, 4], [16, 3], [22, 10], [21, 20]], '#9a8a74');
    t.ell(9, 8, 3, 2, '#b3a38a');
  }, ['#9a8a74', '#b3a38a'], (t) => eyes(t, 8, 14, 11)),
  beam: () => pix(24, (t) => {
    t.poly([[5, 9], [2, 1], [11, 6]], '#d62f2f');
    t.poly([[19, 9], [22, 1], [13, 6]], '#f5c542');
    t.ell(12, 15, 8, 7, '#9b5de5');
  }, ['#d62f2f', '#f5c542', '#9b5de5'], (t) => eyes(t, 9, 14, 13)),
  bomb: () => pix(24, (t) => {
    t.line([[15, 6], [18, 2]], 1.5, '#a07010');
    t.ell(12, 14, 8.5, 8, '#26232f');
  }, ['#26232f', '#a07010'], (t) => {
    t.dot(18, 0, 2, 2, '#ffb000');
    t.dot(8, 12, 2, 3, '#ffffff');
    t.dot(14, 12, 2, 3, '#ffffff');
  }),
  wing: () => pix(24, (t) => {
    t.ell(11, 14, 8, 6, '#3a8bff');
    t.poly([[7, 12], [2, 3], [14, 10]], '#9fd3ff');
    t.poly([[18, 13], [24, 15], [18, 17]], '#ffb000');
  }, ['#3a8bff', '#9fd3ff', '#ffb000'], (t) => t.dot(14, 11, 2, 2, INK)),
};

export function enemyCanvas(id) {
  return cached(`enemy-${id}`, ENEMIES[id]);
}

// ================================================================ Halloween

// Pictures for the blending words (48x48).
export const SPOOKY_PICS = {
  cat: () => pix(48, (t) => {
    t.line([[34, 40], [44, 34], [42, 22]], 3, '#26232f');
    t.ell(24, 34, 11, 11, '#26232f');
    t.ell(24, 18, 9, 8, '#26232f');
    t.poly([[16, 14], [17, 4], [22, 11]], '#26232f');
    t.poly([[32, 14], [31, 4], [26, 11]], '#26232f');
  }, ['#26232f'], (t) => {
    t.dot(19, 16, 3, 3, '#7dff6a');
    t.dot(27, 16, 3, 3, '#7dff6a');
    t.dot(23, 21, 2, 1, '#ff7eb6');
  }),
  bat: () => pix(48, (t) => {
    t.poly([[24, 20], [4, 10], [8, 20], [2, 24], [10, 28], [24, 26]], '#4a2266');
    t.poly([[24, 20], [44, 10], [40, 20], [46, 24], [38, 28], [24, 26]], '#4a2266');
    t.ell(24, 23, 6, 7, '#26232f');
    t.poly([[19, 18], [20, 12], [23, 17]], '#26232f');
    t.poly([[29, 18], [28, 12], [25, 17]], '#26232f');
  }, ['#4a2266', '#26232f'], (t) => {
    t.dot(21, 21, 2, 2, '#ffe14a');
    t.dot(26, 21, 2, 2, '#ffe14a');
  }),
  hat: () => pix(48, (t) => {
    t.ell(24, 38, 21, 5, '#26232f');
    t.poly([[12, 38], [36, 38], [30, 14], [34, 4], [22, 12]], '#4a2266');
    t.rect(13, 31, 22, 4, '#7dff6a');
  }, ['#26232f', '#4a2266', '#7dff6a'], (t) => t.dot(22, 31, 4, 4, '#f5c542')),
  rat: () => pix(48, (t) => {
    t.line([[36, 32], [44, 28], [46, 18]], 2, '#ff9fb6');
    t.ell(24, 30, 13, 9, '#9aa0a6');
    t.ell(11, 26, 7, 6, '#9aa0a6');
    t.ell(13, 18, 4, 4, '#ff9fb6');
  }, ['#9aa0a6', '#ff9fb6'], (t) => {
    t.dot(8, 24, 2, 2, INK);
    t.dot(4, 27, 2, 2, '#ff7eb6');
  }),
  web: () => pix(48, (t, x) => {
    x.strokeStyle = '#e8ecf4';
    x.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      x.beginPath(); x.moveTo(24, 24); x.lineTo(24 + Math.cos(a) * 22, 24 + Math.sin(a) * 22); x.stroke();
    }
    for (const r of [7, 14, 21]) {
      x.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        if (i) x.lineTo(24 + Math.cos(a) * r, 24 + Math.sin(a) * r); else x.moveTo(24 + r, 24);
      }
      x.stroke();
    }
  }, null, (t) => {
    t.dot(23, 22, 3, 4, INK);
  }),
  bug: () => pix(48, (t) => {
    for (const y of [20, 26, 32]) { t.line([[14, y], [6, y + 4]], 2, '#26232f'); t.line([[34, y], [42, y + 4]], 2, '#26232f'); }
    t.ell(24, 28, 11, 12, '#3fae4a');
    t.ell(24, 13, 6, 5, '#26232f');
  }, ['#3fae4a', '#26232f'], (t) => {
    t.dot(23, 18, 2, 21, '#2b7a2a');
    t.dot(21, 11, 2, 2, '#ffffff');
    t.dot(26, 11, 2, 2, '#ffffff');
  }),
  pot: () => pix(48, (t) => {
    t.ell(14, 14, 4, 4, '#7dff6a');
    t.ell(30, 10, 5, 5, '#7dff6a');
    t.ell(24, 30, 17, 13, '#26232f');
    t.ell(24, 19, 16, 4, '#7dff6a');
    t.rect(10, 41, 4, 5, '#26232f');
    t.rect(34, 41, 4, 5, '#26232f');
  }, ['#26232f', '#7dff6a']),
  fog: () => pix(48, (t) => {
    for (const [x, y, r] of [[12, 24, 9], [24, 20, 12], [36, 24, 9], [18, 30, 9], [32, 30, 9]]) t.ell(x, y, r, r * 0.8, '#c4c8cc');
  }, ['#c4c8cc'], (t) => t.dot(14, 22, 20, 1, '#e8ecf4')),
  log: () => pix(48, (t) => {
    t.rect(6, 18, 34, 14, '#7a4a26');
    t.ell(40, 25, 6, 7, '#c49a6c');
    t.ell(6, 25, 6, 7, '#7a4a26');
  }, ['#7a4a26', '#c49a6c'], (t) => {
    t.dot(39, 24, 2, 2, '#7a4a26');
    t.dot(12, 22, 20, 1, '#5e3b1a');
    t.dot(14, 28, 16, 1, '#5e3b1a');
  }),
  mug: () => pix(48, (t) => {
    t.line([[34, 22], [42, 24], [40, 34], [34, 34]], 3, '#d62f2f');
    t.rect(12, 16, 22, 26, '#d62f2f');
    t.ell(23, 16, 11, 3, '#7a4a26');
  }, ['#d62f2f', '#7a4a26'], (t) => {
    t.dot(18, 6, 2, 6, '#e8ecf4');
    t.dot(26, 4, 2, 6, '#e8ecf4');
  }),
};

export function spookyPic(word) {
  return cached(`spooky-${word}`, SPOOKY_PICS[word]);
}

// Friendly monsters who answer the doors (40x48).
const MONSTER_DRAW = {
  ghost: (t) => {
    t.poly([[6, 46], [6, 18], [20, 4], [34, 18], [34, 46], [29, 41], [24, 46], [20, 41], [15, 46], [11, 41]], '#f4f4f8');
  },
  pumpkin: (t) => {
    t.rect(13, 30, 14, 16, '#3fae4a');
    t.ell(20, 18, 15, 13, '#ff8c1a');
    t.rect(18, 2, 4, 6, '#3d8a35');
  },
  mummy: (t) => {
    t.ell(20, 14, 10, 11, '#e8e0c8');
    t.rect(10, 22, 20, 24, '#e8e0c8');
  },
  witch: (t) => {
    t.rect(10, 28, 20, 18, '#4a2266');
    t.ell(20, 24, 9, 9, '#7dd36a');
    t.ell(20, 16, 15, 3, '#26232f');
    t.poly([[11, 16], [29, 16], [22, 0]], '#26232f');
  },
  frank: (t) => {
    t.rect(8, 8, 24, 24, '#7dd36a');
    t.rect(8, 4, 24, 7, '#26232f');
    t.rect(10, 32, 20, 14, '#5a5f7a');
    t.rect(4, 22, 4, 4, '#9aa0a6');
    t.rect(32, 22, 4, 4, '#9aa0a6');
  },
};
const MONSTER_FACE = {
  ghost: (t) => { t.dot(14, 20, 3, 4, INK); t.dot(23, 20, 3, 4, INK); t.dot(17, 28, 6, 2, '#ff9fb6'); },
  pumpkin: (t) => {
    t.dot(12, 13, 4, 4, '#26232f'); t.dot(24, 13, 4, 4, '#26232f');
    t.dot(13, 22, 14, 2, '#26232f'); t.dot(15, 24, 2, 2, '#26232f'); t.dot(23, 24, 2, 2, '#26232f');
  },
  mummy: (t) => {
    for (let y = 8; y < 46; y += 5) t.dot(10, y, 20, 1, '#b8b09a');
    t.dot(15, 12, 3, 3, INK); t.dot(23, 12, 3, 3, INK);
  },
  witch: (t) => { t.dot(16, 22, 2, 2, INK); t.dot(22, 22, 2, 2, INK); t.dot(17, 27, 6, 1, '#b3202a'); },
  frank: (t) => {
    t.dot(13, 15, 4, 3, INK); t.dot(23, 15, 4, 3, INK);
    t.dot(14, 25, 12, 1, INK); t.dot(16, 24, 1, 3, INK); t.dot(20, 24, 1, 3, INK); t.dot(24, 24, 1, 3, INK);
  },
};
export const MONSTERS = Object.keys(MONSTER_DRAW);

export function monsterCanvas(id) {
  return cached(`monster-${id}`, () => {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 48;
    const x = c.getContext('2d');
    MONSTER_DRAW[id](tools(x));
    // pixelate expects a square; pad into a 48 canvas then crop back.
    const sq = document.createElement('canvas');
    sq.width = sq.height = 48;
    const sx = sq.getContext('2d');
    sx.drawImage(c, 4, 0);
    const pal = { ghost: ['#f4f4f8'], pumpkin: ['#3fae4a', '#ff8c1a', '#3d8a35'], mummy: ['#e8e0c8'], witch: ['#4a2266', '#7dd36a', '#26232f'], frank: ['#7dd36a', '#26232f', '#5a5f7a', '#9aa0a6'] }[id];
    pixelate(sx, 48, pal);
    const out = document.createElement('canvas');
    out.width = 40;
    out.height = 48;
    const ox = out.getContext('2d');
    ox.drawImage(sq, 4, 0, 40, 48, 0, 0, 40, 48);
    MONSTER_FACE[id](tools(ox));
    return out;
  });
}

// A jack-o'-lantern for the arcade cabinet (32x32).
export function pumpkinCanvas() {
  return cached('pumpkin', () => pix(32, (t) => {
    t.rect(14, 2, 4, 7, '#3d8a35');
    t.ell(10, 18, 8, 11, '#ff8c1a');
    t.ell(22, 18, 8, 11, '#ff8c1a');
    t.ell(16, 18, 9, 12, '#ffa53a');
  }, ['#3d8a35', '#ff8c1a', '#ffa53a'], (t) => {
    t.poly([[9, 14], [13, 14], [11, 10]], '#26232f');
    t.poly([[19, 14], [23, 14], [21, 10]], '#26232f');
    t.dot(9, 21, 14, 3, '#26232f');
    t.dot(12, 24, 2, 2, '#26232f');
    t.dot(18, 24, 2, 2, '#26232f');
    t.dot(11, 22, 2, 1, '#ffe14a');
  }));
}
