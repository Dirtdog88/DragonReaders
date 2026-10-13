// Pixel canvases are scaled by a whole number of device pixels, so every game
// pixel is the same size on screen (no shimmer while walking) and crisp on
// retina screens. The canvas keeps its small backing store; CSS does the rest.

export function fitPixelCanvas(canvas, availW, availH) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;
  const raw = Math.min((availW * dpr) / w, (availH * dpr) / h);
  const scale = raw >= 1 ? Math.floor(raw) : Math.max(0.25, raw);
  canvas.style.width = `${(w * scale) / dpr}px`;
  canvas.style.height = `${(h * scale) / dpr}px`;
  return scale;
}

// Fit on every resize; `avail()` returns [width, height] in CSS pixels.
export function keepFit(canvas, avail) {
  const fit = () => fitPixelCanvas(canvas, ...avail());
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  fit();
  return fit;
}
