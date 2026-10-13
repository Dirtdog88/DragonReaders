# Recorded letter sounds

Pumpkin Patch says each letter's sound when a pumpkin is tapped. With no
recordings it uses the iPad voice, which can only approximate sounds
("kuh" for k adds an "uh" that makes blending harder).

To use real recordings:

1. Record one short clip per letter: just the sound, no "uh" after stops
   (k, t, p, b, d, g), held sounds for m, n, s, f, l, r, z, v.
   Voice Memos on an iPhone is fine; export as .m4a, or convert to .mp3.
2. Name the files by letter: `a.mp3`, `b.mp3`, ... (or `.m4a`).
3. Put them in this folder and list them in `manifest.json`, for example:

   ["a.mp3", "b.mp3", "c.mp3", "t.mp3"]

Letters not listed keep using the voice. The game caches the clips for
offline play the first time it loads them.
