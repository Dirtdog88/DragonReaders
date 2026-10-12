# Reading Arcade: plan (2026-10-12)

The games are helping him sound out words and are replacing less useful screen time. Next: an arcade-style
home page where he picks a game, with Dragon Readers as one cabinet and two new games, each practicing the next
reading skill.

## Decisions

| Topic | Decision |
|---|---|
| Link | Same link: https://dirtdog88.github.io/DragonReaders/ opens the arcade. Home-screen icon and saves keep working. |
| Halloween game skill | **Blending**: tap each letter to hear its sound (c…a…t), then pick the matching picture. |
| Kirby | Named **Kirby**, drawn in original pixel art (round pink puffball). Same approach as Spidey. |
| Kirby game skill | **Sight words** (the, is, a, see, go, can, and…). |

## The games

| Game | Skill | How it plays |
|---|---|---|
| Dragon Readers (built) | Letter sounds, picture → word | Catch dragons by reading the word that matches them. |
| Halloween: Pumpkin Patch | Blending CVC words | Trick-or-treat down a spooky street. Each door shows a word on glowing letter pumpkins; tap each to hear its sound, then pick the picture (cat, bat, hat, web, rat, bug, pot, fog) to get candy. Friendly monsters, no scares. |
| Kirby: Dream Land Words | Sight words | Kirby floats through the sky. "Find **the**!" Each sight word floats on an enemy; he taps the right one, Kirby inhales it and **copies its power** (see below). Wrong enemies get spat out harmlessly. |

## Kirby copy abilities (added 2026-10-12)

His favorite part of Kirby is absorbing powers, so it drives the game:

- Inhaling the right word-enemy turns Kirby into that power: new look and color, star burst, and the power's name pops up and is spoken ("Fire!").
- 8 abilities: Fire (flame crown), Ice (frosty cap), Sword (green cap + sword), Spark (lightning spikes), Stone (turns to rock), Beam (jester hat), Bomb (black cap), Wing (feathered headband).
- Each level ends at a treasure block that Kirby breaks with whatever power he is holding (melt, slash, zap, smash) for a shower of stars.
- **Ability Book:** a collection card for every power copied, with its name to read.

## Arcade home page

- Retro arcade hall with a glowing pixel-art cabinet for each game: big picture, one-word label.
- Each cabinet shows progress (dragons caught, candy collected, stars).
- Every game has a ⌂ button back to the arcade.
- Shared across games: the spoken voice, touch controls, the "no confusing choices" rules, gentle retry and saving.

## Build order (check in after each)

1. [x] Arcade home page; Dragon Readers moved to `dragon.html` (saves kept).
2. [x] Halloween: Pumpkin Patch (`halloween.html`).
3. [x] Kirby Words (`kirby.html`).

## Built (2026-10-12)

- **Arcade** (`index.html`, `js/arcade.js`, `css/arcade.css`): neon hall with three cabinets (dragons, pumpkins, Kirby), each showing progress from that game's save.
- **Pumpkin Patch** (`halloween.html`, `js/halloween.js`): 8 doors a night. Letters sit on pumpkins; tapping one says its sound (the iPad voice reads letter names, so sounds are spelled out: "kuh", "aah", "tuh"). 🔊 says all the sounds in turn. Picture choices are the word, one rhyme (only the first sound differs) and one other. Wrong pick: fades, sounds replay, and after two misses the answer pulses. Candy count saved.
- **Kirby Words** (`kirby.html`, `js/kirby.js`): 6 words a level, heard not shown ("Find... the!"), so it is real sight-word recognition. The three choices always start with different letters. Every right catch transforms Kirby; a new power appears now and then (always on a level's last word), so the Ability Book fills over a few levels. Levels end with Kirby using his power on a treasure block. Word tiers unlock at 2 and 4 levels cleared.
- **Shared art** (`js/art.js`) and styles (`css/games.css`). Every game has a ⌂ button back to the arcade.

## Spidey Math (added 2026-10-12)

- `math.html`, `js/math.js`, `css/math.css`; a fourth arcade cabinet ("Spidey", 🏅 badges).
- Spidey swings across city rooftops at sunset; each roof is an addition problem (1 + 1 = ?) with bugs under each number. Tapping a bug counts it aloud ("one… two…").
- Three number buttons: the answer and its two nearest neighbors. Wrong: fades, "Let's count!", the bugs count themselves aloud; after two misses the answer pulses. Right: the answer fills in, "1 plus 1 is 2!", and Spidey swings to the next roof.
- 8 problems a round, then "You saved the city!" and a city badge.
- Sums to 5 first; a round with 2 or fewer slips moves up to sums to 10, then to dots instead of bugs. Adding only for now.

## More playing, short learning breaks (added 2026-10-12)

Feedback: he wants more walking around and playing, with learning in between. Kirby and Spidey are now side-scrollers (they replace the quiz versions). Saves carry over.

- **Shared engine** (`js/platform.js`): ◀ ▶ A B touch buttons (keyboard: arrows, Z/space, X, C), tile levels built from a short recipe, gravity and tile collisions, camera. Shared layout styles live in `css/games.css`.
- **Kirby Adventure** (`kirby.html`, `js/kirby.js`): walk, jump and puff up to fly (hold A to float down). B inhales an enemy, and Kirby copies its power right away (8 powers). With a power, B uses it (fire/ice/beam breath, sword slash, spark ring, bomb throw, wing dash, stone drop); Fire is the only power that melts ice blocks. ⟲ drops the power so he can inhale a new one. 3 Star Doors a level (full height, so he can't fly over) open by finding a heard sight word: 3 choices, gentle retry, hint after two misses, +3 stars. A treasure block at the end gives the level's stars. Pits pop him back to safety, and enemy bumps just knock him back. 3 levels: Green Greens, Cloud Kingdom, Castle. The Ability Book stays.
- **Spidey City** (`math.html`, `js/math.js`): run along rooftops, A jumps, run into a wall to climb it. B shoots a web on the ground (wraps robot bugs, +1 token), or zips him up and forward in the air (twice a jump). 3 rescues a level (kitten, balloon, bus) block the way until a math card is solved: a + b with robot bugs to count, 3 number buttons, "Let's count!" on a miss, hint after two misses, +3 tokens. Climb the tallest building to "You saved the city!" and a badge. Sums to 5, then to 10, then dots: he moves up after two levels in a row with at most one slip. 3 levels: Sunset, Night, Morning. Falls are caught by a web.
- No losing anywhere.
