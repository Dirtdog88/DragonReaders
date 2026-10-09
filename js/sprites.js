// Pixel art, drawn in code. Each sprite is 16x16, one character per pixel.
// '.' is transparent; other characters map to colors in PALETTE.

export const TILE = 16;

const PALETTE = {
  k: '#1d1426', // outline
  s: '#f2c9a0', // skin
  h: '#7a4a26', // hair
  r: '#d94848', // tunic
  b: '#3b5bab', // pants
  y: '#f5c542', // gold
  w: '#ffffff', // white
  p: '#6a3fa0', // wizard purple
  g: '#9aa0a6', // grey
};

const PLAYER_DOWN = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '...kskssssksk...',
  '...kssssssssk...',
  '....kssssssk....',
  '...krrrrrrrrk...',
  '..ksrrrrrrrrsk..',
  '..ksrrryyrrrsk..',
  '...kbbbbbbbbk...',
  '...kbbbkkbbbk...',
  '...kkkk..kkkk...',
  '................',
];

const PLAYER_UP = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '....khhhhhhk....',
  '...krrrrrrrrk...',
  '..ksrrrrrrrrsk..',
  '..ksrrrrrrrrsk..',
  '...kbbbbbbbbk...',
  '...kbbbkkbbbk...',
  '...kkkk..kkkk...',
  '................',
];

const PLAYER_LEFT = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...kssssshhhk...',
  '...ksksssshhk...',
  '...kssssssshk...',
  '....kssssssk....',
  '...krrrrrrrrk...',
  '...krrrrrrrrk...',
  '...krrsrrrrrk...',
  '...kbbbbbbbbk...',
  '...kbbbkkbbbk...',
  '...kkkk..kkkk...',
  '................',
];

// Second walking frame: legs swap.
const LEGS_B = [
  '...kbbbbbbbbk...',
  '....kbbkkbbk....',
  '....kkk..kkk....',
];

const KING = [
  '................',
  '....y..yy..y....',
  '....yyyyyyyy....',
  '....yryjjyry....',
  '...kssssssssk...',
  '...kskssssksk...',
  '...kswwsswwsk...',
  '..kpwwwwwwwwpk..',
  '..kppwwwwwwppk..',
  '..kpppwwwwpppk..',
  '..kppppyyppppk..',
  '..kppppyyppppk..',
  '..kwwwwwwwwwwk..',
  '..kppppppppppk..',
  '..kkkkkkkkkkkk..',
  '................',
];

const GRIFFITH = [
  '.......kk.......',
  '......kppk......',
  '.....kppppk.....',
  '....kppppppk....',
  '..kkkkkkkkkkkk..',
  '...kssssssssk...',
  '...kskssssksk...',
  '...kwwwwwwwwk...',
  '..kpwwwwwwwwpk..',
  '..kppwwwwwwppk..',
  '..kpppwwwwpppk..',
  '..kppppppppppk..',
  '..kpppyyyypppk..',
  '..kppppppppppk..',
  '..kkkkkkkkkkkk..',
  '................',
];

function mirror(rows) {
  return rows.map((r) => r.split('').reverse().join(''));
}

function withLegsB(rows) {
  return [...rows.slice(0, 12), ...LEGS_B, rows[15]];
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function paint(rows, colors = {}) {
  const c = makeCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = colors[ch] || PALETTE[ch] || '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return c;
}

// player[dir][frame]
export function buildPlayerSprites() {
  const right = mirror(PLAYER_LEFT);
  const dirs = { down: PLAYER_DOWN, up: PLAYER_UP, left: PLAYER_LEFT, right };
  const out = {};
  for (const [dir, rows] of Object.entries(dirs)) {
    out[dir] = [paint(rows), paint(withLegsB(rows))];
  }
  return out;
}

// Other Dragon Masters reuse the player's shape with their own colors.
export function buildNpcSprites() {
  return {
    griffith: paint(GRIFFITH),
    king: paint(KING, { p: '#b3202a', w: '#ffffff', j: '#3b5bab' }),
    // The evil wizard: Griffith's shape in dark robes with a red belt.
    maldred: paint(GRIFFITH, { p: '#3a1d4a', w: '#24102e', y: '#b3202a', s: '#9fb59a' }),
    ana: paint(PLAYER_DOWN, { h: '#3b2414', r: '#f2a900', b: '#7a4a26' }),
    bo: paint(PLAYER_DOWN, { h: '#2b2b3a', r: '#2f7fd1', b: '#1d4f8a' }),
  };
}

// ---------- Tiles ----------
// Small seeded random so tile details look varied but never flicker.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function grassBase(ctx, seed) {
  ctx.fillStyle = '#8bd16a';
  ctx.fillRect(0, 0, TILE, TILE);
  const r = rng(seed);
  ctx.fillStyle = '#74bd55';
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(r() * 14) + 1;
    const y = Math.floor(r() * 14) + 1;
    ctx.fillRect(x, y, 1, 2);
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }
}

const TILE_PAINTERS = {
  '.': (ctx) => grassBase(ctx, 7),
  G: (ctx) => {
    ctx.fillStyle = '#3f9a3a';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#2b7a2a';
    for (let x = 0; x < TILE; x += 4) {
      for (const y of [3, 11]) {
        ctx.fillRect(x, y, 1, 4);
        ctx.fillRect(x + 1, y - 1, 1, 5);
        ctx.fillRect(x + 2, y + 1, 1, 3);
      }
    }
    ctx.fillStyle = '#5cbf4f';
    for (let x = 1; x < TILE; x += 4) {
      ctx.fillRect(x, 2, 1, 1);
      ctx.fillRect(x, 10, 1, 1);
    }
  },
  T: (ctx) => {
    grassBase(ctx, 3);
    ctx.fillStyle = '#6b3f1f';
    ctx.fillRect(6, 11, 4, 5);
    ctx.fillStyle = '#1f5e2a';
    ctx.beginPath();
    ctx.arc(8, 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d3a';
    ctx.beginPath();
    ctx.arc(7, 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.fillRect(4, 3, 3, 2);
  },
  '=': (ctx) => {
    ctx.fillStyle = '#e8d49a';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#cdb67a';
    const r = rng(11);
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 2, 1);
    }
  },
  '~': (ctx, frame) => {
    ctx.fillStyle = '#4aa3df';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#a8dcff';
    const o = frame ? 4 : 0;
    ctx.fillRect((2 + o) % 16, 4, 4, 1);
    ctx.fillRect((10 + o) % 16, 11, 4, 1);
  },
  '#': (ctx) => {
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#6e7378';
    for (let y = 0; y < TILE; y += 4) {
      ctx.fillRect(0, y, TILE, 1);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < TILE; x += 8) ctx.fillRect(x, y, 1, 4);
    }
  },
  B: (ctx) => {
    // Battlements along the top of the castle.
    TILE_PAINTERS['#'](ctx);
    ctx.fillStyle = '#8bd16a';
    ctx.fillRect(0, 0, TILE, 4);
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, 0, 5, 4);
    ctx.fillRect(10, 0, 5, 4);
  },
  H: (ctx) => {
    TILE_PAINTERS['#'](ctx);
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(5, 3, 6, 9);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(6, 4, 4, 7);
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(7, 4, 1, 7);
    ctx.fillRect(6, 7, 4, 1);
  },
  D: (ctx) => {
    TILE_PAINTERS['#'](ctx);
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(1, 2, 15, 14);
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(2, 3, 13, 13);
    ctx.fillStyle = '#5a3418';
    for (let x = 5; x < 15; x += 4) ctx.fillRect(x, 3, 1, 13);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(12, 9, 2, 2);
  },
  f: (ctx) => {
    grassBase(ctx, 9);
    const flowers = [[3, 4, '#ff6b6b'], [10, 3, '#ffd93d'], [6, 10, '#ffffff'], [12, 12, '#ff6b6b']];
    for (const [x, y, c] of flowers) {
      ctx.fillStyle = c;
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(x, y, 1, 1);
    }
  },
  R: (ctx) => {
    grassBase(ctx, 13);
    ctx.fillStyle = '#5f6368';
    ctx.beginPath();
    ctx.ellipse(8, 9, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9aa0a6';
    ctx.beginPath();
    ctx.ellipse(7, 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4c8cc';
    ctx.fillRect(5, 6, 3, 2);
  },
};

Object.assign(TILE_PAINTERS, {
  W: (ctx) => {
    ctx.fillStyle = '#2a2433';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#3d344b';
    ctx.fillRect(1, 2, 6, 4);
    ctx.fillRect(9, 9, 6, 4);
    ctx.fillStyle = '#4e4560';
    ctx.fillRect(2, 2, 3, 1);
    ctx.fillRect(10, 9, 3, 1);
  },
  ',': (ctx) => {
    ctx.fillStyle = '#4a4458';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#56506a';
    const r = rng(17);
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1);
  },
  g: (ctx, frame) => {
    ctx.fillStyle = '#3a3448';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#6a6280';
    for (let y = 1; y < TILE; y += 4) {
      for (let x = (y % 8 === 1 ? 1 : 3); x < TILE; x += 4) ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = frame ? '#9fd3ff' : '#c9a0e8';
    ctx.fillRect(5, 6, 1, 1);
    ctx.fillRect(12, 13, 1, 1);
  },
  C: (ctx, frame) => {
    TILE_PAINTERS[','](ctx);
    ctx.fillStyle = frame ? '#7fd8ff' : '#5fb4ff';
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(13, 8);
    ctx.lineTo(8, 15);
    ctx.lineTo(3, 8);
    ctx.fill();
    ctx.fillStyle = '#e6f7ff';
    ctx.fillRect(7, 4, 2, 5);
  },
});

Object.assign(TILE_PAINTERS, {
  X: (ctx) => {
    ctx.fillStyle = '#2b1a3a';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#1d1426';
    for (let y = 0; y < TILE; y += 4) {
      ctx.fillRect(0, y, TILE, 1);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < TILE; x += 8) ctx.fillRect(x, y, 1, 4);
    }
  },
  x: (ctx) => {
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#33253f';
    ctx.fillRect(0, 7, TILE, 1);
    ctx.fillRect(7, 0, 1, 7);
    ctx.fillRect(15, 8, 1, 8);
  },
  r: (ctx) => {
    ctx.fillStyle = '#8e1b2a';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#b3202a';
    ctx.fillRect(2, 0, 12, TILE);
    ctx.fillStyle = '#f5c542';
    for (let y = 2; y < TILE; y += 6) ctx.fillRect(7, y, 2, 2);
  },
  F: (ctx, frame) => {
    TILE_PAINTERS.X(ctx);
    ctx.fillStyle = '#5e3b1a';
    ctx.fillRect(7, 8, 2, 6);
    ctx.fillStyle = frame ? '#ffb000' : '#e03b1f';
    ctx.fillRect(6, 3, 4, 5);
    ctx.fillStyle = '#fff3a0';
    ctx.fillRect(7, frame ? 4 : 5, 2, 2);
  },
});

Object.assign(TILE_PAINTERS, {
  o: (ctx) => {
    ctx.fillStyle = '#c9c3b6';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#b8b1a2';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillRect(8, 8, 8, 8);
  },
  K: (ctx) => {
    TILE_PAINTERS['#'](ctx);
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(1, 1, 14, 15);
    ctx.fillStyle = '#b3202a';
    ctx.fillRect(2, 2, 12, 13);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(2, 2, 12, 2);
    ctx.fillRect(2, 2, 2, 13);
    ctx.fillRect(12, 2, 2, 13);
    ctx.fillRect(6, 0, 4, 2);
  },
  N: (ctx) => {
    TILE_PAINTERS['#'](ctx);
    ctx.fillStyle = '#1d1426';
    ctx.fillRect(3, 1, 10, 14);
    ctx.fillStyle = '#2f7fd1';
    ctx.fillRect(4, 2, 8, 11);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(7, 5, 2, 4);
    ctx.fillRect(4, 13, 2, 2);
    ctx.fillRect(10, 13, 2, 2);
  },
});

// tiles[char][frame] (two frames so water can shimmer)
export function buildTiles() {
  const out = {};
  for (const [ch, painter] of Object.entries(TILE_PAINTERS)) {
    out[ch] = [0, 1].map((frame) => {
      const c = makeCanvas(TILE, TILE);
      painter(c.getContext('2d'), frame);
      return c;
    });
  }
  return out;
}
