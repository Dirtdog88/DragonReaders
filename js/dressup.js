// King Roland's dress-up room: tap items to put them on the king, Mr. Potato Head
// style. One item per group. Each tile has a picture and a short word (spoken on tap).
// "King's wish" asks for an item in a short sentence for a little reading practice.

import { dragonSprite, dragonById, pixelate } from './dragons.js';
import { speak } from './speech.js';

const S = 64; // the king is drawn on a 64x64 pixel canvas
const $ = (id) => document.getElementById(id);

const SKIN = '#f2c9a0';
const SHIRT = '#e8e0d0';
const INK = '#1d1426';

// ---------------------------------------------------------------- Drawing helpers

function layer() {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  return c;
}

function tools(x) {
  return {
    ell(cx, cy, rx, ry, col) {
      x.fillStyle = col;
      x.beginPath();
      x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      x.fill();
    },
    poly(pts, col) {
      x.fillStyle = col;
      x.beginPath();
      pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
      x.closePath();
      x.fill();
    },
    rect(px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    },
    line(pts, w, col) {
      x.strokeStyle = col;
      x.lineWidth = w;
      x.lineCap = 'round';
      x.beginPath();
      pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
      x.stroke();
    },
    clear(px, py, w, h) {
      x.clearRect(px, py, w, h);
    },
    dot(px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    },
  };
}

// Draw shapes, snap them to the palette and outline them (same look as the dragons),
// then add any crisp pixel details.
function art(draw, pal, details) {
  const c = layer();
  const x = c.getContext('2d');
  draw(tools(x));
  if (pal) pixelate(x, S, pal);
  details?.(tools(x));
  return c;
}

// ---------------------------------------------------------------- The king

const BASE = {
  body: () => art((t) => {
    t.ell(16, 46, 5, 10, SHIRT);
    t.ell(48, 46, 5, 10, SHIRT);
    t.poly([[20, 33], [44, 33], [50, 64], [14, 64]], SHIRT);
  }, [SHIRT]),
  head: () => art((t) => {
    t.ell(21, 24, 2.5, 3.5, SKIN);
    t.ell(43, 24, 2.5, 3.5, SKIN);
    t.ell(32, 23, 11, 12, SKIN);
    t.ell(22, 17, 3, 4, '#d8d2c4'); // gray hair tufts
    t.ell(42, 17, 3, 4, '#d8d2c4');
  }, [SKIN, '#d8d2c4'], (t) => {
    t.dot(27, 21, 2, 3, INK); // eyes
    t.dot(35, 21, 2, 3, INK);
    t.dot(24, 26, 3, 2, '#f2a0a0'); // rosy cheeks
    t.dot(37, 26, 3, 2, '#f2a0a0');
    t.dot(29, 30, 6, 1, INK); // smile
    t.dot(28, 29, 1, 1, INK);
    t.dot(35, 29, 1, 1, INK);
  }),
  hands: () => art((t) => {
    t.ell(16, 56, 3.5, 3.5, SKIN);
    t.ell(48, 56, 3.5, 3.5, SKIN);
  }, [SKIN]),
};

// ---------------------------------------------------------------- Items

export const CATEGORIES = [
  { id: 'hat', word: 'hats', icon: '\u{1F451}' },
  { id: 'face', word: 'face', icon: '\u{1F453}' },
  { id: 'clothes', word: 'clothes', icon: '\u{1F455}' },
  { id: 'fun', word: 'fun', icon: '\u{1F9F8}' },
];

export const ITEMS = [
  // Hats
  { id: 'crown', cat: 'hat', word: 'crown', make: () => art((t) => {
    t.poly([[21, 14], [21, 6], [24, 0], [27, 6], [32, -1], [37, 6], [40, 0], [43, 6], [43, 14]], '#f5c542');
    t.rect(21, 11, 22, 3, '#b8860b');
  }, ['#f5c542', '#b8860b'], (t) => {
    t.dot(31, 7, 3, 3, '#d62f2f');
    t.dot(24, 8, 2, 2, '#3b5bab');
    t.dot(39, 8, 2, 2, '#3b5bab');
  }) },
  { id: 'tophat', cat: 'hat', word: 'hat', make: () => art((t) => {
    t.rect(23, -2, 18, 15, '#26232f');
    t.ell(32, 13, 15, 3, '#26232f');
    t.rect(23, 8, 18, 3, '#d62f2f');
  }, ['#26232f', '#d62f2f']) },
  { id: 'cap', cat: 'hat', word: 'cap', make: () => art((t) => {
    t.ell(32, 13, 12, 9, '#2f7fd1');
    t.clear(0, 13, S, 10);
    t.ell(45, 13, 9, 2.5, '#1d4f8a');
  }, ['#2f7fd1', '#1d4f8a'], (t) => t.dot(31, 4, 2, 2, '#ffffff')) },
  { id: 'wig', cat: 'hat', word: 'wig', make: () => art((t) => {
    for (const [cx, cy] of [[19, 22], [18, 15], [22, 8], [28, 4], [36, 4], [42, 8], [46, 15], [45, 22]]) t.ell(cx, cy, 5.5, 5.5, '#ff8c1a');
    t.ell(32, 12, 10, 4, '#ff8c1a');
  }, ['#ff8c1a']) },
  { id: 'pot', cat: 'hat', word: 'pot', make: () => art((t) => {
    t.rect(21, 1, 22, 12, '#9aa0a6');
    t.rect(19, 11, 26, 3, '#6e7378');
    t.rect(13, 4, 8, 3, '#6e7378');
    t.rect(43, 4, 8, 3, '#6e7378');
  }, ['#9aa0a6', '#6e7378'], (t) => t.dot(24, 3, 2, 7, '#c4c8cc')) },
  { id: 'chef', cat: 'hat', word: 'chef', make: () => art((t) => {
    t.ell(25, 5, 6, 6, '#ffffff');
    t.ell(32, 2, 7, 6, '#ffffff');
    t.ell(39, 5, 6, 6, '#ffffff');
    t.rect(23, 6, 18, 8, '#ffffff');
  }, ['#ffffff'], (t) => t.dot(23, 11, 18, 1, '#d8d2c4')) },

  // Faces
  { id: 'mustache', cat: 'face', word: 'mustache', make: () => art((t) => {
    t.ell(29, 28, 4.5, 2, '#5e3b1a');
    t.ell(35, 28, 4.5, 2, '#5e3b1a');
    t.ell(24.5, 26.5, 1.5, 1.5, '#5e3b1a');
    t.ell(39.5, 26.5, 1.5, 1.5, '#5e3b1a');
  }, ['#5e3b1a']) },
  { id: 'beard', cat: 'face', word: 'beard', make: () => art((t) => {
    t.ell(32, 33, 11, 9, '#ffffff');
    t.clear(28, 28, 8, 3);
  }, ['#ffffff']) },
  { id: 'glasses', cat: 'face', word: 'glasses', make: () => art((t) => {
    t.ell(27, 22, 4.5, 4, '#1d1d2a');
    t.ell(37, 22, 4.5, 4, '#1d1d2a');
    t.rect(30, 21, 4, 1.5, '#1d1d2a');
  }, ['#1d1d2a'], (t) => {
    t.dot(25, 20, 2, 1, '#ffffff');
    t.dot(35, 20, 2, 1, '#ffffff');
  }) },
  { id: 'patch', cat: 'face', word: 'patch', make: () => art((t) => {
    t.line([[20, 17], [44, 23]], 1.5, '#1d1d2a');
    t.ell(36, 22, 4, 3.5, '#1d1d2a');
  }, ['#1d1d2a']) },
  { id: 'nose', cat: 'face', word: 'nose', make: () => art((t) => {
    t.ell(32, 26, 3.5, 3.5, '#e8364a');
  }, ['#e8364a'], (t) => t.dot(31, 24, 1, 1, '#ffffff')) },
  { id: 'mask', cat: 'face', word: 'mask', make: () => art((t) => {
    t.rect(19, 18, 26, 7, '#1d1d2a');
    t.clear(26, 20, 4, 4);
    t.clear(34, 20, 4, 4);
  }, ['#1d1d2a']) },

  // Clothes
  { id: 'robe', cat: 'clothes', word: 'robe', make: () => art((t) => {
    t.ell(16, 46, 6, 11, '#b3202a');
    t.ell(48, 46, 6, 11, '#b3202a');
    t.poly([[19, 34], [45, 34], [52, 64], [12, 64]], '#b3202a');
    t.rect(29, 36, 6, 28, '#ffffff');
    t.ell(32, 36, 14, 4, '#ffffff');
  }, ['#b3202a', '#ffffff'], (t) => {
    for (const [px, py] of [[31, 42], [32, 49], [31, 56], [22, 36], [41, 36]]) t.dot(px, py, 1, 2, INK);
  }) },
  { id: 'cape', cat: 'clothes', word: 'cape', make: () => art((t) => {
    t.poly([[14, 36], [50, 36], [58, 64], [6, 64]], '#6a3fa0');
    t.poly([[25, 38], [39, 38], [42, 64], [22, 64]], '#3b5bab');
    t.ell(32, 37, 3, 2.5, '#f5c542');
  }, ['#6a3fa0', '#3b5bab', '#f5c542']) },
  { id: 'armor', cat: 'clothes', word: 'armor', make: () => art((t) => {
    t.poly([[19, 34], [45, 34], [50, 64], [14, 64]], '#b9bec8');
    t.ell(16, 39, 7, 5, '#9aa0a6');
    t.ell(48, 39, 7, 5, '#9aa0a6');
    t.ell(16, 49, 5, 7, '#b9bec8');
    t.ell(48, 49, 5, 7, '#b9bec8');
  }, ['#b9bec8', '#9aa0a6'], (t) => {
    t.dot(20, 46, 24, 1, '#6e7378');
    t.dot(18, 55, 28, 1, '#6e7378');
    t.dot(31, 36, 2, 28, '#6e7378');
    t.dot(26, 40, 2, 2, '#ffffff');
  }) },
  { id: 'shirt', cat: 'clothes', word: 'shirt', make: () => art((t) => {
    t.ell(16, 44, 6, 8, '#ffffff');
    t.ell(48, 44, 6, 8, '#ffffff');
    t.poly([[19, 34], [45, 34], [50, 64], [14, 64]], '#ffffff');
    for (let y = 36; y < 64; y += 5) t.rect(10, y, 44, 2.5, '#2f7fd1');
  }, ['#ffffff', '#2f7fd1']) },
  { id: 'tutu', cat: 'clothes', word: 'tutu', make: () => art((t) => {
    t.poly([[21, 34], [43, 34], [44, 50], [20, 50]], '#ff7eb6');
    const pts = [[18, 48]];
    for (let i = 0; i <= 10; i++) pts.push([8 + i * 4.8, i % 2 ? 62 : 57]);
    pts.push([46, 48]);
    t.poly(pts, '#ffc2dd');
  }, ['#ff7eb6', '#ffc2dd']) },

  // Fun stuff (held in his right hand)
  { id: 'sword', cat: 'fun', word: 'sword', make: () => art((t) => {
    t.poly([[47, 52], [47, 22], [49, 17], [51, 22], [51, 52]], '#d8dce2');
    t.rect(43, 51, 12, 3, '#f5c542');
    t.rect(48, 54, 2, 9, '#7a4a26');
  }, ['#d8dce2', '#f5c542', '#7a4a26'], (t) => t.dot(48, 24, 1, 26, '#ffffff')) },
  { id: 'wand', cat: 'fun', word: 'wand', make: () => art((t) => {
    t.line([[48, 60], [55, 38]], 2.5, '#5e3b1a');
    const star = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 3 : 7;
      star.push([56 + Math.cos(a) * r, 33 + Math.sin(a) * r]);
    }
    t.poly(star, '#ffe14a');
  }, ['#5e3b1a', '#ffe14a']) },
  { id: 'fish', cat: 'fun', word: 'fish', make: () => art((t) => {
    t.ell(51, 48, 9, 5.5, '#5fb4ff');
    t.poly([[58, 48], [64, 42], [64, 54]], '#2f7fd1');
  }, ['#5fb4ff', '#2f7fd1'], (t) => t.dot(45, 46, 2, 2, INK)) },
  { id: 'cone', cat: 'fun', word: 'cone', make: () => art((t) => {
    t.poly([[44, 52], [54, 52], [49, 64]], '#d9a55a');
    t.ell(49, 48, 6, 5, '#ff7eb6');
    t.ell(49, 41, 5, 4.5, '#7a4a26');
  }, ['#d9a55a', '#ff7eb6', '#7a4a26'], (t) => t.dot(48, 36, 2, 2, '#d62f2f')) },
  { id: 'bear', cat: 'fun', word: 'bear', make: () => art((t) => {
    t.ell(46, 37, 2.5, 2.5, '#a0703a');
    t.ell(56, 37, 2.5, 2.5, '#a0703a');
    t.ell(51, 43, 6, 5.5, '#a0703a');
    t.ell(51, 54, 6.5, 7, '#a0703a');
    t.ell(51, 45, 2.5, 2, '#e0c08a');
  }, ['#a0703a', '#e0c08a'], (t) => {
    t.dot(48, 41, 1, 1, INK);
    t.dot(53, 41, 1, 1, INK);
    t.dot(51, 44, 1, 1, INK);
  }) },
  { id: 'pet', cat: 'fun', word: 'dragon', make: () => {
    // A little Vulcan, using the real dragon art at half size.
    const c = layer();
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(dragonSprite(dragonById('vulcan')).normal, 36, 28, 32, 32);
    return c;
  } },
];

export const DEFAULT_OUTFIT = { hat: 'crown', face: null, clothes: 'robe', fun: null };

const cache = new Map();
function itemLayer(id) {
  if (!cache.has(id)) cache.set(id, ITEMS.find((i) => i.id === id).make());
  return cache.get(id);
}

let baseCache = null;
function base() {
  baseCache ??= { body: BASE.body(), head: BASE.head(), hands: BASE.hands() };
  return baseCache;
}

// Draw the king wearing an outfit onto a 64x64 context.
export function drawKing(ctx, outfit) {
  const b = base();
  const put = (id) => { if (id) ctx.drawImage(itemLayer(id), 0, 0); };
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(b.body, 0, 0);
  put(outfit.clothes);
  ctx.drawImage(b.head, 0, 0);
  put(outfit.face);
  put(outfit.hat);
  put(outfit.fun);
  ctx.drawImage(b.hands, 0, 0);
}

// Crop an item to its pixels and fit it in a tile picture.
function drawThumb(canvas, id) {
  const src = itemLayer(id);
  const data = src.getContext('2d').getImageData(0, 0, S, S).data;
  let x0 = S; let y0 = S; let x1 = 0; let y1 = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3]) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
  }
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const size = Math.max(w, h);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, x0, y0, w, h, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
}

// ---------------------------------------------------------------- Screen

export function createDressUp({ getOutfit, setOutfit, onClose }) {
  const el = $('dressup');
  const kingCanvas = $('du-king');
  const kctx = kingCanvas.getContext('2d');
  kctx.imageSmoothingEnabled = false;
  const tabsEl = $('du-tabs');
  const itemsEl = $('du-items');
  const wishEl = $('du-wish');
  let cat = 'hat';
  let wish = null; // item the king asked for

  function outfit() {
    return { ...DEFAULT_OUTFIT, ...getOutfit() };
  }

  function renderKing(pop) {
    drawKing(kctx, outfit());
    if (pop) {
      kingCanvas.classList.remove('pop');
      void kingCanvas.offsetWidth; // restart the animation
      kingCanvas.classList.add('pop');
    }
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    for (const c of CATEGORIES) {
      const b = document.createElement('button');
      b.className = `du-tab${c.id === cat ? ' selected' : ''}`;
      b.innerHTML = `<span class="du-tab-icon">${c.icon}</span><span>${c.word}</span>`;
      b.addEventListener('click', () => { cat = c.id; renderTabs(); renderItems(); });
      tabsEl.appendChild(b);
    }
  }

  function renderItems() {
    itemsEl.innerHTML = '';
    const worn = outfit();
    for (const item of ITEMS.filter((i) => i.cat === cat)) {
      const b = document.createElement('button');
      b.className = `du-item${worn[item.cat] === item.id ? ' worn' : ''}`;
      const pic = document.createElement('canvas');
      drawThumb(pic, item.id);
      const label = document.createElement('span');
      label.textContent = item.word;
      b.append(pic, label);
      b.addEventListener('click', () => toggle(item));
      itemsEl.appendChild(b);
    }
  }

  function toggle(item) {
    const o = outfit();
    o[item.cat] = o[item.cat] === item.id ? null : item.id;
    setOutfit(o);
    speak(item.word);
    renderKing(true);
    renderItems();
    if (wish && o[item.cat] === item.id) {
      if (item.id === wish.id) {
        wish = null;
        showBubble('Thank you!', true);
        setTimeout(() => speak('Thank you!'), 700);
        setTimeout(() => { if (!wish) wishEl.hidden = true; }, 2200);
      } else {
        wishEl.classList.remove('nope');
        void wishEl.offsetWidth;
        wishEl.classList.add('nope');
      }
    }
  }

  function showBubble(text, happy = false) {
    $('du-wish-text').textContent = text;
    wishEl.classList.toggle('happy', happy);
    wishEl.hidden = false;
  }

  function makeWish() {
    const o = outfit();
    const options = ITEMS.filter((i) => o[i.cat] !== i.id && i.id !== wish?.id);
    wish = options[Math.floor(Math.random() * options.length)];
    showBubble(`I want the ${wish.word}!`);
  }

  function randomOutfit() {
    const o = {};
    for (const c of CATEGORIES) {
      const choices = ITEMS.filter((i) => i.cat === c.id);
      // Usually wear something, sometimes nothing.
      o[c.id] = Math.random() < 0.85 ? choices[Math.floor(Math.random() * choices.length)].id : null;
    }
    setOutfit(o);
    renderKing(true);
    renderItems();
  }

  $('du-wish-btn').addEventListener('click', makeWish);
  $('du-wish-speak').addEventListener('click', () => speak($('du-wish-text').textContent));
  $('du-random').addEventListener('click', randomOutfit);
  $('du-close').addEventListener('click', () => {
    el.hidden = true;
    wish = null;
    wishEl.hidden = true;
    onClose?.();
  });

  function open() {
    cat = 'hat';
    wish = null;
    wishEl.hidden = true;
    renderTabs();
    renderItems();
    renderKing(false);
    el.hidden = false;
  }

  return { open, isOpen: () => !el.hidden };
}
