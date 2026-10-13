# Reading Arcade

A small arcade of reading games for a beginning reader: **Dragon Readers** (letter sounds, read the word for the picture), **Pumpkin Patch** (blending sounds into words), **Kirby Adventure** (a side-scroller: inhale enemies to copy their powers, open Star Doors by finding sight words) and **Spidey City** (run, climb and web-swing across rooftops; each rescue is a little addition problem with robot bugs to count).

## Dragon Readers

A small Game Boy–style reading game for beginning readers, themed on the *Dragon Masters* books.
Walk around Bracken Castle and catch dragons by reading the word that matches them.

Plain HTML + JavaScript, no build step. To run locally: `python3 -m http.server` and open http://localhost:8000.

## Sound, music and offline

- Sound effects and music are made in code with Web Audio (`js/sfx.js`, `js/music.js`), so there are no sound files.
  The speaker button (top right of every page) cycles sound on, music off, sound off. The reading voice always stays on.
- Words are read by the device voice through a small queue (`js/speech.js`), so a new line never cuts off a word.
- Pumpkin Patch can use real recordings for letter sounds: see [audio/letters/README.md](audio/letters/README.md).
- A service worker (`sw.js`) caches every file, so the home-screen app opens with no network. The Andika font is self-hosted in `fonts/`.
  After a change that must reach devices right away, bump `VERSION` in `sw.js`.
- See [docs/2026-10-13-sound-and-graphics.md](docs/2026-10-13-sound-and-graphics.md) for the review and the changes it led to.

See [docs/2026-10-07-game-plan.md](docs/2026-10-07-game-plan.md) for the plan.

Fan-made for home use. Dragon Masters is by Tracey West (Scholastic); all art here is original.
