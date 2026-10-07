// Spoken words use the device's built-in voice (works offline on iPad).

let voice = null;

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

export function speak(text, { rate = 0.8 } = {}) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1.05;
  speechSynthesis.speak(u);
}
