// Small side-scrolling engine shared by the Kirby and Spidey adventures:
// touch controls (◀ ▶ A B), tile levels built from a short recipe, simple
// physics with tile collisions, and a camera.

import { fitPixelCanvas } from './screen.js';

export const TILE = 16;
export const VIEW_W = 256;
export const VIEW_H = 144;
export const ROWS = 9;

// ---------------------------------------------------------------- Controls

// Buttons are any element with data-key="left|right|a|b|drop" inside `root`.
// Keyboard: arrows to move, Z/space = A, X = B.
export function createControls(root) {
  const held = new Set();
  const pressed = new Set(); // went down since last frame
  const pointers = new Map();

  const down = (k) => { if (!held.has(k)) pressed.add(k); held.add(k); paint(); };
  const up = (k) => { held.delete(k); paint(); };
  const buttons = [...root.querySelectorAll('[data-key]')];
  function paint() {
    buttons.forEach((b) => b.classList.toggle('pressed', held.has(b.dataset.key)));
  }

  for (const b of buttons) {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, b.dataset.key);
      down(b.dataset.key);
    });
    const end = (e) => {
      const k = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (k && ![...pointers.values()].includes(k)) up(k);
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'a', ' ': 'a', z: 'a', x: 'b', c: 'drop' };
  window.addEventListener('keydown', (e) => {
    const k = KEYS[e.key];
    if (k) { e.preventDefault(); down(k); }
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYS[e.key];
    if (k) up(k);
  });

  return {
    held: (k) => held.has(k),
    // True once per press.
    take: (k) => {
      const v = pressed.has(k);
      pressed.delete(k);
      return v;
    },
    clear() {
      held.clear();
      pressed.clear();
      pointers.clear();
      paint();
    },
  };
}

// ---------------------------------------------------------------- Levels

// Build a level from a recipe so every row is the same length.
//   ground: [[x, len, top]] solid columns from row `top` down (default top 7)
//   plats:  [[x, row, len, ch]] floating platforms
//   put:    [[x, row, ch]] single tiles (blocks, doors, items, enemies...)
export function buildLevel({ width, ground = [[0, null, 7]], plats = [], put = [], fill = '#' }) {
  const g = Array.from({ length: ROWS }, () => Array(width).fill('.'));
  for (const [x, len, top = 7] of ground) {
    const n = len ?? width - x;
    for (let c = x; c < x + n && c < width; c++) for (let r = top; r < ROWS; r++) g[r][c] = fill;
  }
  for (const [x, row, len, ch = '='] of plats) for (let c = x; c < x + len; c++) g[row][c] = ch;
  for (const [x, row, ch] of put) g[row][x] = ch;
  return g;
}

// Pull marker characters (enemies, items, start...) out of the grid into a list.
export function extract(grid, chars) {
  const found = [];
  grid.forEach((row, r) => row.forEach((ch, c) => {
    if (chars.includes(ch)) {
      found.push({ ch, x: c * TILE, y: r * TILE, col: c, row: r });
      row[c] = '.';
    }
  }));
  return found;
}

export function tileAt(grid, col, row) {
  if (row < 0) return '.';
  if (row >= ROWS || col < 0 || col >= grid[0].length) return row >= ROWS ? '.' : '#';
  return grid[row][col];
}

// ---------------------------------------------------------------- Physics

export const GRAVITY = 0.32;
export const MAX_FALL = 5;

// Move a body {x, y, w, h, vx, vy} through the grid; solid(ch) says what blocks.
// Sets body.onGround and returns the tiles it bumped into. A big move (a slow
// frame) is taken in steps smaller than a tile so nothing passes through walls.
export function moveBody(b, grid, solid, f = 1) {
  const biggest = Math.max(Math.abs(b.vx * f), Math.abs(b.vy * f));
  if (biggest <= TILE - 2) return moveStep(b, grid, solid, f);
  const n = Math.ceil(biggest / (TILE - 2));
  const bumps = [];
  for (let i = 0; i < n; i++) bumps.push(...moveStep(b, grid, solid, f / n));
  return bumps;
}

function moveStep(b, grid, solid, f) {
  const bumps = [];
  b.onGround = false;
  // Horizontal
  b.x += b.vx * f;
  if (b.vx !== 0) {
    const edge = b.vx > 0 ? b.x + b.w - 0.01 : b.x;
    const col = Math.floor(edge / TILE);
    for (let r = Math.floor(b.y / TILE); r <= Math.floor((b.y + b.h - 0.01) / TILE); r++) {
      const ch = tileAt(grid, col, r);
      if (solid(ch)) {
        bumps.push({ ch, col, row: r, side: b.vx > 0 ? 'right' : 'left' });
        b.x = b.vx > 0 ? col * TILE - b.w : (col + 1) * TILE;
        b.hitWall = true;
        break;
      }
    }
  }
  // Vertical
  b.y += b.vy * f;
  const edgeY = b.vy >= 0 ? b.y + b.h - 0.01 : b.y;
  const row = Math.floor(edgeY / TILE);
  for (let c = Math.floor(b.x / TILE); c <= Math.floor((b.x + b.w - 0.01) / TILE); c++) {
    const ch = tileAt(grid, c, row);
    if (solid(ch)) {
      bumps.push({ ch, col: c, row, side: b.vy >= 0 ? 'down' : 'up' });
      if (b.vy >= 0) {
        b.y = row * TILE - b.h;
        b.onGround = true;
      } else {
        b.y = (row + 1) * TILE;
      }
      b.vy = 0;
      break;
    }
  }
  return bumps;
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Keep the hero a little left of center; never show past the level's ends.
export function cameraX(heroX, grid) {
  const max = grid[0].length * TILE - VIEW_W;
  return Math.max(0, Math.min(max, Math.round(heroX - VIEW_W * 0.4)));
}

// Fit the canvas into its box at the biggest size that keeps the shape.
export function fitCanvas(canvas, box) {
  const fit = () => {
    const r = box.getBoundingClientRect();
    // Leave room for the 6px border on each side.
    fitPixelCanvas(canvas, r.width - 12, r.height - 12);
  };
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
  fit();
  return fit;
}
