// The Dragon Book: all 14 dragons in book order. Caught ones are shown in color
// and can be tapped to read their word; the rest are dark shadows.

import { DRAGONS, DRAGON_SIZE, dragonSprite } from './dragons.js';
import { speak } from './speech.js';

const $ = (id) => document.getElementById(id);

export function createBook({ getCaught, onClose }) {
  const el = $('book');
  const grid = $('book-grid');
  const detail = $('book-detail');
  let current = null;

  function open() {
    const caught = getCaught();
    const ordered = [...DRAGONS].sort((a, b) => a.book - b.book);
    $('book-count').textContent = `${caught.length} / ${DRAGONS.length}`;
    grid.innerHTML = '';
    for (const d of ordered) {
      const has = caught.includes(d.id);
      const cell = document.createElement('button');
      cell.className = `book-cell${has ? '' : ' unknown'}`;
      cell.disabled = !has;
      const c = document.createElement('canvas');
      c.width = c.height = DRAGON_SIZE;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(has ? dragonSprite(d).normal : dragonSprite(d).dark, 0, 0);
      const label = document.createElement('span');
      label.textContent = has ? d.name : '?';
      cell.append(c, label);
      if (has) cell.addEventListener('click', () => showDetail(d));
      grid.appendChild(cell);
    }
    detail.hidden = true;
    el.hidden = false;
  }

  function showDetail(d) {
    current = d;
    const ctx = $('detail-canvas').getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, DRAGON_SIZE, DRAGON_SIZE);
    ctx.drawImage(dragonSprite(d).normal, 0, 0);
    $('detail-name').textContent = d.name;
    $('detail-type').textContent = `${d.type} Dragon`;
    $('detail-word').textContent = d.word;
    detail.hidden = false;
  }

  $('detail-speak').addEventListener('click', () => { if (current) speak(current.word); });
  $('detail-close').addEventListener('click', () => { detail.hidden = true; current = null; });
  $('book-close').addEventListener('click', () => {
    el.hidden = true;
    onClose?.();
  });

  return { open, isOpen: () => !el.hidden };
}
