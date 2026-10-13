# Review, sound and graphics (2026-10-13)

A review of the whole arcade (every page driven in headless Chromium, no runtime errors), then the fixes
and improvements it led to.

## Bugs found and fixed

| Bug | Fix |
|---|---|
| No offline support (plan step 5 open; font loaded from Google) | `sw.js` caches every file; Andika is self-hosted in `fonts/`. |
| Letter sounds spelled for the voice ("kuh", "aah") are poor phonics | `js/letters.js` plays recordings from `audio/letters/` when present, voice as fallback. |
| Every spoken line cancelled the one before ("Oof!" cut off "Fire!") | `js/speech.js` queues lines; `{ now: true }` only for taps where the latest matters. "Thwip!", "Oof!", "Whoa!" are sound effects now. |
| Uneven pixels on iPad (non-integer canvas scale) | `js/screen.js` scales every pixel canvas by a whole number of device pixels. |
| New Game wiped the save with no warning | "Start over?" panel on the title screen. |
| Kirby's Castle platforms were breakable bricks | Platforms are stone (`=`), bricks (`B`) stay smashable. |
| Colors mode: Kepri could only ever pair with blue | orange/brown no longer counted as too close. |
| Web Words: a stale timer after close and reopen | Timer tracked and cleared. |
| Fast falls could pass through a thin platform on a slow frame | `moveBody` moves in steps smaller than a tile. |

## Sound

- `js/audio.js`: one Web Audio context, unlocked by the first tap; sound setting saved on device (all / music off / silent);
  speaker button added to every page. The voice is never muted.
- `js/sfx.js`: chiptune effects (jump, coin, catch, right/wrong, door, power, bomb, web, candy...), synthesized, no files.
- `js/music.js`: step sequencer with a loop per place: arcade, castle, cave, volcano/tower, Dream Land, city, spooky.
- Letter recordings: drop clips into `audio/letters/` and list them in `manifest.json` (see the README there).

## Graphics

- Whole-pixel scaling everywhere (world, capture, Web Words, Pumpkin Patch, Kirby, Spidey), crisp on retina.
- Dragons have a second frame: wings flap, serpents sway (on the capture screen).
- Kirby: feet shuffle while walking, squash on take-off and landing, stretch while rising. Enemies bob.
- Spidey: legs shuffle while running, leans into jumps.
- NPCs give a tiny idle hop now and then.
- Right answers burst stars from the button (`js/fx.js`); the screen shakes when the Dragon Stone pulls a dragon in.

## Not done

- No real recordings yet: the voice still approximates letter sounds until clips are added.
- World tiles (grass and water edges, shadows) are unchanged.
- Test on the iPad: the sound unlock on the first tap and the home-screen offline start need a real device check.
