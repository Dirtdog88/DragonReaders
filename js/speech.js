// Spoken words use the device's built-in voice (works offline on iPad).
// Lines go through a small queue so a new line never cuts off the word being
// read. speak(text, { now }) jumps the queue for taps where the latest matters
// (a letter tapped, a wrong word); { low } only speaks when nothing else is.

let voice = null;
const queue = [];
let current = null;
let watchdog = 0;
let warmed = false;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.startsWith('en'));
  // Prefer a clear US English voice when one exists.
  voice = voices.find((v) => /samantha|allison|ava|google us english/i.test(v.name))
    || voices.find((v) => v.lang === 'en-US')
    || voices[0]
    || null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

// iPad only lets speech start from a tap; an empty line on the first tap unlocks it.
export function warmUp() {
  if (warmed || !('speechSynthesis' in window)) return;
  warmed = true;
  if (current || queue.length) return;
  try { speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch { /* not fatal */ }
}

function pump() {
  if (current || !queue.length || !('speechSynthesis' in window)) return;
  const item = queue.shift();
  const u = new SpeechSynthesisUtterance(item.text);
  if (voice) u.voice = voice;
  u.rate = item.rate;
  u.pitch = 1.05;
  current = u;
  const done = () => {
    if (current !== u) return;
    current = null;
    clearTimeout(watchdog);
    setTimeout(pump, 60);
  };
  u.onend = done;
  u.onerror = done;
  // Some browsers never fire onend for a cancelled line; move on anyway.
  watchdog = setTimeout(done, 1500 + (item.text.length * 110) / item.rate);
  speechSynthesis.speak(u);
}

export function hush() {
  if (!('speechSynthesis' in window)) return;
  queue.length = 0;
  if (current) {
    current = null;
    clearTimeout(watchdog);
  }
  speechSynthesis.cancel();
}

export function speak(text, { rate = 0.8, now = false, low = false } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  if (low && (current || queue.length)) return;
  if (now) {
    hush();
    queue.push({ text, rate });
    // Speaking right after cancel() can be dropped; give it a moment.
    setTimeout(pump, 40);
    return;
  }
  if (queue.length >= 2) queue.shift(); // never build up a backlog
  queue.push({ text, rate });
  pump();
}

export function speaking() {
  return !!current || queue.length > 0;
}
