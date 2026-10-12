// Arcade home page: draws each cabinet's art and shows progress from each game's save.

import { dragonSprite, dragonById, DRAGONS } from './dragons.js';
import { pumpkinCanvas, kirbyCanvas, ABILITIES } from './art.js';

const $ = (id) => document.getElementById(id);

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function paint(id, src) {
  const c = $(id);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, c.width, c.height);
}

paint('art-dragon', dragonSprite(dragonById('vulcan')).normal);
paint('art-spooky', pumpkinCanvas());

const kirby = read('arcade-kirby-v1');
// Show Kirby wearing his latest power.
paint('art-kirby', kirbyCanvas(kirby?.ability || null));

// Dragon Readers keeps one save per mode; show the further one.
const caught = Math.max(
  read('dragon-readers-save-v1')?.caught?.length || 0,
  read('dragon-readers-save-colors-v1')?.caught?.length || 0,
);
$('prog-dragon').textContent = `\u{1F409} ${caught} / ${DRAGONS.length}`;

const spooky = read('arcade-halloween-v1');
$('prog-spooky').textContent = `\u{1F36C} ${spooky?.candy || 0}`;

$('prog-kirby').textContent = `✨ ${kirby?.abilities?.length || 0} / ${ABILITIES.length}`;
