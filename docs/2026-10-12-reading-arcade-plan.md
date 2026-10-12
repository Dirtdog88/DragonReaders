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
