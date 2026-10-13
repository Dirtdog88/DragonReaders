// Registers the service worker that keeps every file on the device, so the
// home-screen app opens with no network.

if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* not fatal */ });
  });
}
