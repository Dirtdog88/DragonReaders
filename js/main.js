import { TILE, buildPlayerSprites, buildNpcSprites, buildTiles } from './sprites.js';
import { MAPS, SOLID, ENCOUNTER_TILES, AREA_DONE_LINES, tileAt } from './maps.js';
import { createInput } from './input.js';
import { loadSave, writeSave, newSave } from './storage.js';
import { speak } from './speech.js';
import { pickWildDragon, wordChoices, dragonById, dragonsIn, areaDone, unlockedAreas } from './dragons.js';
import { createCapture } from './capture.js';

const VIEW_W = 160;
const VIEW_H = 144;
const STEP_MS = 200; // time to walk one tile
const MAX_NAME = 8;
const ENCOUNTER_CHANCE = 0.1; // per step in tall grass
const ENCOUNTER_GRACE = 3; // safe steps after an encounter
const FLASH_MS = 800;
const WARP_MS = 400; // fade out + in when walking to a new area
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const $ = (id) => document.getElementById(id);
const screens = { title: $('title-screen'), name: $('name-screen'), world: $('world-screen') };

const playerSprites = buildPlayerSprites();
const npcSprites = buildNpcSprites();
const tiles = buildTiles();
const input = createInput();

let save = loadSave();
let currentScreen = 'title';

function show(name) {
  currentScreen = name;
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  if (name === 'world') resize();
}

// ---------------------------------------------------------------- Title

function setupTitle() {
  $('title-screen').querySelector('.title-dragon').style.backgroundImage =
    `url(${playerSprites.down[0].toDataURL()})`;
  const cont = $('btn-continue');
  if (save) {
    cont.hidden = false;
    cont.textContent = `Play as ${save.name}`;
  }
  cont.addEventListener('click', () => startWorld());
  $('btn-new').addEventListener('click', () => openNameScreen());
}

// ---------------------------------------------------------------- Name entry

let typed = '';

function openNameScreen() {
  typed = '';
  renderName();
  show('name');
}

function renderName() {
  const slots = $('name-slots');
  slots.innerHTML = '';
  for (let i = 0; i < MAX_NAME; i++) {
    const s = document.createElement('div');
    s.className = 'name-slot';
    s.textContent = typed[i] || '';
    slots.appendChild(s);
  }
  $('btn-done').disabled = typed.length === 0;
}

function setupNameScreen() {
  const grid = $('letter-grid');
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const b = document.createElement('button');
    b.className = 'letter';
    b.textContent = letter;
    b.addEventListener('click', () => {
      if (typed.length >= MAX_NAME) return;
      typed += letter;
      speak(letter.toLowerCase(), { rate: 0.9 });
      renderName();
    });
    grid.appendChild(b);
  }
  $('btn-back').addEventListener('click', () => {
    if (!typed) { show('title'); return; }
    typed = typed.slice(0, -1);
    renderName();
  });
  $('btn-done').addEventListener('click', () => {
    if (!typed) return;
    const name = typed[0] + typed.slice(1).toLowerCase();
    save = newSave(name);
    writeSave(save);
    startWorld();
  });
}

// ---------------------------------------------------------------- World

const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let map = null;
let player = null;
let dialogue = null; // { lines, i }
let flash = null; // { t } while the screen flashes before an encounter
let warp = null; // { t, exit, moved } while fading to a new area
let stepsSinceEncounter = 0;

const capture = createCapture({
  onAnswer(word, right) {
    const stat = (save.words[word] ??= { right: 0, wrong: 0 });
    stat[right ? 'right' : 'wrong']++;
    writeSave(save);
  },
  onDone({ dragon, caught }) {
    if (caught) {
      const wasDone = areaDone(dragon.area, save.caught);
      if (!save.caught.includes(dragon.id)) save.caught.push(dragon.id);
      save.catches[dragon.id] = (save.catches[dragon.id] || 0) + 1;
      writeSave(save);
      // Caught the last one here: celebrate and open the next area.
      if (!wasDone && areaDone(dragon.area, save.caught)) openDialogue(AREA_DONE_LINES[dragon.area]);
    }
    stepsSinceEncounter = 0;
    input.clear();
  },
});

function beginEncounter(forceId) {
  flash = { t: 0, forceId };
  input.clear();
}

// How many words to choose from. Step 4 will grow this to 3 as he improves.
function choiceCount() {
  return 2;
}

function startWorld() {
  map = MAPS[save.map] || MAPS.bracken;
  const start = map.start;
  player = {
    x: save.x ?? start.x,
    y: save.y ?? start.y,
    dir: save.dir || start.dir,
    moving: false,
    t: 0,
    fromX: 0,
    fromY: 0,
    steps: 0,
  };
  input.clear();
  show('world');
  // First visit: Griffith greets the new Dragon Master.
  if (!save.metGriffith) {
    save.metGriffith = true;
    writeSave(save);
    const griffith = map.npcs.find((n) => n.id === 'griffith');
    if (griffith) openDialogue(griffith.lines);
  }
}

// Gatekeepers step aside once their area's dragons are all caught.
function visibleNpcs() {
  return map.npcs.filter((n) => !n.gate || !areaDone(n.gate, save.caught));
}

function npcAt(x, y) {
  return visibleNpcs().find((n) => n.x === x && n.y === y);
}

function talkTo(npc) {
  const vars = {};
  if (npc.gate) {
    const here = dragonsIn(npc.gate);
    vars.total = here.length;
    vars.count = here.filter((d) => save.caught.includes(d.id)).length;
  }
  openDialogue(npc.lines, vars);
}

function moveTo(mapId, x, y, dir) {
  map = MAPS[mapId];
  Object.assign(player, { x, y, dir, moving: false, t: 0 });
  Object.assign(save, { map: mapId, x, y, dir });
  writeSave(save);
}

function walkable(x, y) {
  return !SOLID.has(tileAt(map, x, y)) && !npcAt(x, y);
}

function openDialogue(lines, vars = {}) {
  const fill = (l) => l.replace(/\{(\w+)\}/g, (m, k) => (k === 'name' ? save.name : vars[k] ?? m));
  dialogue = { lines: lines.map(fill), i: 0 };
  renderDialogue();
}

function advanceDialogue() {
  if (!dialogue) return;
  dialogue.i++;
  if (dialogue.i >= dialogue.lines.length) dialogue = null;
  renderDialogue();
}

function renderDialogue() {
  const box = $('dialogue');
  box.hidden = !dialogue;
  if (dialogue) $('dialogue-text').textContent = dialogue.lines[dialogue.i];
}

$('dialogue').addEventListener('pointerdown', (e) => {
  if (e.target.closest('#dialogue-speak')) return;
  e.preventDefault();
  advanceDialogue();
});
$('dialogue-speak').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (dialogue) speak(dialogue.lines[dialogue.i]);
});

function update(dt) {
  if (capture.isActive()) return;
  if (flash) {
    flash.t += dt;
    if (flash.t >= FLASH_MS) {
      const dragon = dragonById(flash.forceId) || pickWildDragon(map.id, save.caught);
      flash = null;
      capture.start(dragon, wordChoices(dragon, choiceCount(), unlockedAreas(save.caught)));
    }
    return;
  }
  if (warp) {
    warp.t += dt;
    if (!warp.moved && warp.t >= WARP_MS / 2) {
      const e = warp.exit;
      moveTo(e.to, e.tx, e.ty, e.dir);
      warp.moved = true;
    }
    if (warp.t >= WARP_MS) warp = null;
    return;
  }
  if (dialogue) {
    if (input.takeA()) advanceDialogue();
    return;
  }

  if (player.moving) {
    player.t += dt;
    if (player.t < STEP_MS) return;
    player.moving = false;
    player.steps++;
    save.x = player.x;
    save.y = player.y;
    save.dir = player.dir;
    writeSave(save);
    const exit = map.exits?.find((e) => e.x === player.x && e.y === player.y);
    if (exit) {
      warp = { t: 0, exit, moved: false };
      return;
    }
    if (ENCOUNTER_TILES.has(tileAt(map, player.x, player.y))) {
      stepsSinceEncounter++;
      if (stepsSinceEncounter > ENCOUNTER_GRACE && Math.random() < ENCOUNTER_CHANCE) {
        beginEncounter();
        return;
      }
    }
    // Fall through so holding a direction keeps walking without a pause.
  }

  if (input.takeA()) {
    const [dx, dy] = DIRS[player.dir];
    const npc = npcAt(player.x + dx, player.y + dy);
    if (npc) { talkTo(npc); return; }
  }

  const dir = input.direction();
  if (!dir) return;
  player.dir = dir;
  const [dx, dy] = DIRS[dir];
  if (walkable(player.x + dx, player.y + dy)) {
    player.fromX = player.x;
    player.fromY = player.y;
    player.x += dx;
    player.y += dy;
    player.moving = true;
    player.t = 0;
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function render(time) {
  const mapW = map.rows[0].length * TILE;
  const mapH = map.rows.length * TILE;

  // Player position in pixels (slides between tiles while walking).
  const k = player.moving ? player.t / STEP_MS : 1;
  const px = Math.round((player.moving ? player.fromX + (player.x - player.fromX) * k : player.x) * TILE);
  const py = Math.round((player.moving ? player.fromY + (player.y - player.fromY) * k : player.y) * TILE);

  const camX = clamp(px - 72, 0, mapW - VIEW_W);
  const camY = clamp(py - 64, 0, mapH - VIEW_H);
  const frame = Math.floor(time / 500) % 2;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const tx0 = Math.floor(camX / TILE);
  const ty0 = Math.floor(camY / TILE);
  for (let ty = ty0; ty <= ty0 + VIEW_H / TILE + 1; ty++) {
    for (let tx = tx0; tx <= tx0 + VIEW_W / TILE + 1; tx++) {
      const t = tiles[tileAt(map, tx, ty)] || tiles['.'];
      ctx.drawImage(t[frame], tx * TILE - camX, ty * TILE - camY);
    }
  }

  for (const npc of visibleNpcs()) {
    const s = npcSprites[npc.id];
    if (s) ctx.drawImage(s, npc.x * TILE - camX, npc.y * TILE - camY);
  }

  // Alternate legs on each step, like the old games.
  const walkFrame = player.moving && player.t < STEP_MS * 0.6 ? 1 : 0;
  const bob = walkFrame ? -1 : 0;
  ctx.drawImage(playerSprites[player.dir][walkFrame], px - camX, py - camY + bob);

  // Standing in tall grass hides your feet.
  const standTile = tileAt(map, Math.round(px / TILE), Math.round(py / TILE));
  if (standTile === 'G') {
    ctx.drawImage(tiles.G[frame], 0, 11, TILE, 5, px - camX, py - camY + 11, TILE, 5);
  }

  if (warp) {
    const k = warp.t < WARP_MS / 2 ? warp.t / (WARP_MS / 2) : 1 - (warp.t - WARP_MS / 2) / (WARP_MS / 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, k)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // Encounter flash: blink white, then wipe to black.
  if (flash) {
    if (flash.t < FLASH_MS - 250) {
      if (Math.floor(flash.t / 110) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    } else {
      const k = (flash.t - (FLASH_MS - 250)) / 250;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VIEW_W, Math.ceil(VIEW_H * k));
    }
  }
}

// Fit the pixel screen as large as possible between the controls.
function resize() {
  const portrait = window.innerHeight > window.innerWidth;
  const availW = portrait ? window.innerWidth - 48 : window.innerWidth - 2 * 200;
  const availH = portrait ? window.innerHeight * 0.58 : window.innerHeight - 48;
  const scale = Math.max(1, Math.min(availW / VIEW_W, availH / VIEW_H));
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', () => { if (currentScreen === 'world') resize(); });

let last = performance.now();
function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  if (currentScreen === 'world' && map && !capture.isActive()) {
    update(dt);
    if (!capture.isActive()) render(now);
  }
  requestAnimationFrame(loop);
}

// Testing helpers: open the game with ?debug in the address.
if (location.search.includes('debug')) {
  window.__dr = {
    encounter: beginEncounter,
    save: () => save,
    give(ids) { for (const id of ids) if (!save.caught.includes(id)) save.caught.push(id); writeSave(save); },
    warp(mapId, x, y) { moveTo(mapId, x, y, 'down'); },
  };
}

setupTitle();
setupNameScreen();
show('title');
requestAnimationFrame(loop);
