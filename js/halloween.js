// Pumpkin Patch: trick-or-treat down a street. Each door shows a word on letter
// pumpkins. Tap a pumpkin to hear its sound, blend the sounds, and pick the
// matching picture to get candy. Practices blending CVC words.

import { speak } from './speech.js';
import { buildPlayerSprites } from './sprites.js';
import { spookyPic, monsterCanvas, MONSTERS, pumpkinCanvas } from './art.js';

const $ = (id) => document.getElementById(id);
const W = 128;
const H = 96;
const DOORS = 8; // houses per night
const SAVE_KEY = 'arcade-halloween-v1';

const WORDS = ['cat', 'bat', 'hat', 'rat', 'web', 'bug', 'pot', 'fog', 'log', 'mug'];

// The iPad voice reads letter names, so each letter gets a spelled-out sound.
// Stretchy sounds are held (mmm), quick ones get a short "uh".
const SOUNDS = {
  a: 'aah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih',
  j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', r: 'rrr', s: 'sss',
  t: 'tuh', u: 'uh', w: 'wuh', z: 'zzz',
};

const HOUSE_COLORS = ['#3a2a6a', '#2a4a5a', '#4a2a4a', '#2a3a5a', '#4a3a2a', '#2a4a3a', '#3a2a5a', '#5a2a3a'];

// ---------------------------------------------------------------- Save

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || { candy: 0, nights: 0, words: {} };
  } catch {
    return { candy: 0, nights: 0, words: {} };
  }
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* not fatal */ }
}
const save = loadSave();
save.words ??= {};

// ---------------------------------------------------------------- Helpers

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One rhyming picture (only the first sound differs, so he has to blend)
// plus one different one.
function pictureChoices(word) {
  const others = WORDS.filter((w) => w !== word);
  const rhymes = shuffle(others.filter((w) => w.slice(1) === word.slice(1)));
  const rest = shuffle(others.filter((w) => !rhymes.includes(w)));
  const picks = [rhymes[0] || rest.shift(), rest[0]];
  return shuffle([word, ...picks]);
}

const player = buildPlayerSprites();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Scene

const canvas = $('scene');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const STARS = Array.from({ length: 22 }, (_, i) => [(i * 37) % W, (i * 19) % 40]);

function drawHouse(x, color, doorOpen) {
  // Body and roof
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, 34, 72, 48);
  ctx.fillStyle = '#1d1426';
  ctx.beginPath();
  ctx.moveTo(x - 2, 36); ctx.lineTo(x + 40, 12); ctx.lineTo(x + 82, 36);
  ctx.closePath();
  ctx.fill();
  // Glowing windows
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x + 12, 44, 12, 10);
  ctx.fillRect(x + 56, 44, 12, 10);
  ctx.fillStyle = '#1d1426';
  ctx.fillRect(x + 17, 44, 2, 10);
  ctx.fillRect(x + 61, 44, 2, 10);
  // Door
  ctx.fillStyle = doorOpen ? '#120a1a' : '#6b3f1f';
  ctx.fillRect(x + 32, 54, 16, 28);
  if (!doorOpen) {
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(x + 44, 68, 2, 2);
  }
  // Pumpkins on the step
  ctx.drawImage(pumpkinCanvas(), x + 14, 70, 12, 12);
  ctx.drawImage(pumpkinCanvas(), x + 54, 70, 12, 12);
}

function drawScene(state) {
  const { clock } = state;
  ctx.fillStyle = '#140d2a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c1438';
  ctx.fillRect(0, 30, W, 30);
  for (const [sx, sy] of STARS) {
    if ((Math.floor(clock / 400) + sx) % 7 === 0) continue; // twinkle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath(); ctx.arc(110, 14, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#140d2a';
  ctx.beginPath(); ctx.arc(114, 11, 7, 0, Math.PI * 2); ctx.fill();

  // Houses slide by while walking to the next door.
  const k = state.phase === 'walk' ? Math.min(1, state.t / 900) : 1;
  const x = 24 - Math.round(k * 0) + Math.round((1 - k) * 110);
  if (state.phase === 'walk' && state.door > 0) {
    drawHouse(24 - Math.round(k * 110), HOUSE_COLORS[(state.door - 1) % HOUSE_COLORS.length], false);
  }
  drawHouse(x, HOUSE_COLORS[state.door % HOUSE_COLORS.length], state.phase !== 'walk');

  // Grass and path
  ctx.fillStyle = '#1f3a24';
  ctx.fillRect(0, 82, W, 14);
  ctx.fillStyle = '#4a3a40';
  ctx.fillRect(0, 86, W, 4);

  // The monster at the door
  if (state.phase === 'ask' || state.phase === 'treat') {
    const m = monsterCanvas(state.monster);
    const pop = Math.min(1, state.t / 250);
    const bobY = Math.round(Math.sin(clock / 300) * 1.5);
    ctx.drawImage(m, x + 20, 34 + Math.round((1 - pop) * 20) + bobY);
  }

  // Our trick-or-treater, walking or waiting with a candy bag
  const walking = state.phase === 'walk' && k < 1;
  const frame = walking && Math.floor(clock / 150) % 2 ? 1 : 0;
  ctx.drawImage(player.right[frame], 6, 70 - (frame ? 1 : 0));
  ctx.fillStyle = '#ff8c1a';
  ctx.fillRect(20, 78, 5, 5);

  // Candy flying into the bag
  if (state.phase === 'treat') {
    const f = Math.min(1, state.t / 700);
    const cx = x + 40 + (22 - x - 40) * f;
    const cy = 50 + (78 - 50) * f - Math.sin(f * Math.PI) * 24;
    ctx.fillStyle = '#ff3b9a';
    ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 1, 5, 3);
    ctx.fillStyle = '#ffe14a';
    ctx.fillRect(Math.round(cx) - 4, Math.round(cy), 2, 1);
    ctx.fillRect(Math.round(cx) + 3, Math.round(cy), 2, 1);
  }
}

// ---------------------------------------------------------------- Night

let state = null;
let raf = 0;
let last = 0;

function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  if (state) {
    state.clock += dt;
    state.t += dt;
    drawScene(state);
  }
  raf = requestAnimationFrame(loop);
}

function renderCandy() {
  $('candy-count').textContent = `\u{1F36C} ${save.candy}`;
}

async function startNight() {
  $('start').hidden = true;
  $('done').hidden = true;
  $('street').hidden = false;
  const words = shuffle([...WORDS]).slice(0, DOORS);
  const monsters = shuffle([...MONSTERS]);
  state = { door: 0, words, monsters, phase: 'walk', t: 0, clock: 0, got: 0 };
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  await nextDoor();
}

async function nextDoor() {
  const s = state;
  $('door-count').textContent = `${s.door + 1} / ${DOORS}`;
  $('pumpkins').classList.add('hidden');
  $('pictures').innerHTML = '';
  s.phase = 'walk';
  s.t = 0;
  await sleep(1000);
  if (state !== s) return;
  s.monster = s.monsters[s.door % s.monsters.length];
  s.phase = 'ask';
  s.t = 0;
  speak('Trick or treat!');
  showWord(s.words[s.door]);
}

function showWord(word) {
  const s = state;
  s.word = word;
  s.mistakes = 0;
  const row = $('pumpkins');
  row.innerHTML = '';
  [...word].forEach((letter) => {
    const b = document.createElement('button');
    b.className = 'pumpkin';
    b.textContent = letter;
    b.addEventListener('click', () => {
      b.classList.add('lit');
      setTimeout(() => b.classList.remove('lit'), 500);
      speak(SOUNDS[letter] || letter, { rate: 0.7 });
    });
    row.appendChild(b);
  });
  row.classList.remove('hidden');

  const pics = $('pictures');
  pics.innerHTML = '';
  for (const w of pictureChoices(word)) {
    const b = document.createElement('button');
    b.className = 'pic-btn';
    b.dataset.word = w;
    b.setAttribute('aria-label', 'picture');
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(spookyPic(w), 0, 0);
    b.appendChild(c);
    b.addEventListener('click', () => choose(w, b));
    pics.appendChild(b);
  }
}

// Say each sound with a pause, lighting each pumpkin in turn (c... a... t).
async function sayTheSounds() {
  const s = state;
  if (!s || s.phase !== 'ask') return;
  const btns = [...$('pumpkins').children];
  for (const [i, letter] of [...s.word].entries()) {
    if (state !== s || s.phase !== 'ask') return;
    btns[i]?.classList.add('lit');
    speak(SOUNDS[letter] || letter, { rate: 0.7 });
    await sleep(750);
    btns[i]?.classList.remove('lit');
  }
}
$('btn-sounds').addEventListener('click', sayTheSounds);

async function choose(word, btn) {
  const s = state;
  if (!s || s.phase !== 'ask') return;
  const stat = (save.words[s.word] ??= { right: 0, wrong: 0 });
  if (word === s.word) {
    stat.right++;
    btn.classList.remove('hint');
    btn.classList.add('right');
    $('pictures').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    speak(s.word);
    s.phase = 'treat';
    s.t = 0;
    s.got++;
    save.candy++;
    writeSave();
    renderCandy();
    await sleep(1500);
    if (state !== s) return;
    s.door++;
    if (s.door >= DOORS) finishNight();
    else nextDoor();
  } else {
    stat.wrong++;
    writeSave();
    s.mistakes++;
    btn.classList.add('wrong');
    btn.disabled = true;
    // Gentle retry: sound it out again, and after two misses show the answer.
    const row = $('pumpkins');
    row.classList.remove('nudge');
    void row.offsetWidth;
    row.classList.add('nudge');
    speak('Try again!');
    await sleep(900);
    if (state === s && s.phase === 'ask') {
      await sayTheSounds();
      if (s.mistakes >= 2) $('pictures').querySelector(`[data-word="${s.word}"]`)?.classList.add('hint');
    }
  }
}

function finishNight() {
  const s = state;
  s.phase = 'done';
  save.nights++;
  writeSave();
  const art = $('done-art').getContext('2d');
  art.imageSmoothingEnabled = false;
  art.clearRect(0, 0, 32, 32);
  art.drawImage(pumpkinCanvas(), 0, 0);
  $('done-text').textContent = `You got ${s.got} candy! You have ${save.candy} in all.`;
  $('done').hidden = false;
  speak('Happy Halloween!');
}

$('btn-go').addEventListener('click', startNight);
$('btn-again').addEventListener('click', startNight);

// Start screen
const startArt = $('start-art').getContext('2d');
startArt.imageSmoothingEnabled = false;
startArt.drawImage(pumpkinCanvas(), 0, 0);
renderCandy();

// Testing helper: open with ?debug
if (location.search.includes('debug')) {
  window.__pp = { word: () => state?.word, phase: () => state?.phase, save: () => save };
}
