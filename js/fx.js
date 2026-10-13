// Little HTML effects shared by the games: a burst of stars from an element
// on a right answer, and a quick shake on a wrong one.

export function burstStars(el, { n = 8, emoji = '⭐', size = 32 } = {}) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 70 + Math.random() * 60;
    const s = document.createElement('span');
    s.className = 'fx-star';
    s.textContent = emoji;
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    s.style.fontSize = `${size}px`;
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d - 30}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
}

export function shake(el) {
  if (!el) return;
  el.classList.remove('fx-shake');
  void el.offsetWidth;
  el.classList.add('fx-shake');
  setTimeout(() => el.classList.remove('fx-shake'), 450);
}
