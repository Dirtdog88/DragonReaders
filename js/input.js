// Touch D-pad + A button, with keyboard arrows / space as a fallback for computers.

const KEY_DIRS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

export function createInput() {
  const keyHeld = new Set();
  const pointers = new Map(); // pointerId -> dir (touch can slide between arrows)
  let order = []; // directions in the order they were pressed
  let aPressed = false;

  const isHeld = (dir) => keyHeld.has(dir) || [...pointers.values()].includes(dir);
  const pressed = (dir) => { order = order.filter((d) => d !== dir); order.push(dir); };

  const dpad = document.getElementById('dpad');
  const buttons = [...dpad.querySelectorAll('.dpad-btn')];
  const paint = () => buttons.forEach((b) => b.classList.toggle('pressed', isHeld(b.dataset.dir)));

  const onPointer = (e) => {
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const dir = el && el.dataset ? el.dataset.dir : undefined;
    if (dir === pointers.get(e.pointerId)) return;
    if (dir) { pointers.set(e.pointerId, dir); pressed(dir); } else pointers.delete(e.pointerId);
    paint();
  };
  const onPointerEnd = (e) => { pointers.delete(e.pointerId); paint(); };

  dpad.addEventListener('pointerdown', (e) => { dpad.setPointerCapture(e.pointerId); onPointer(e); });
  dpad.addEventListener('pointermove', (e) => { if (pointers.has(e.pointerId)) onPointer(e); });
  dpad.addEventListener('pointerup', onPointerEnd);
  dpad.addEventListener('pointercancel', onPointerEnd);

  document.getElementById('btn-a').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    aPressed = true;
  });

  window.addEventListener('keydown', (e) => {
    const dir = KEY_DIRS[e.key];
    if (dir) { keyHeld.add(dir); pressed(dir); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') { aPressed = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEY_DIRS[e.key];
    if (dir) keyHeld.delete(dir);
  });

  return {
    // The most recently pressed direction that is still held.
    direction() {
      for (let i = order.length - 1; i >= 0; i--) if (isHeld(order[i])) return order[i];
      return undefined;
    },
    // True once per A press.
    takeA() {
      const v = aPressed;
      aPressed = false;
      return v;
    },
    clear() {
      keyHeld.clear();
      pointers.clear();
      aPressed = false;
      paint();
    },
  };
}
