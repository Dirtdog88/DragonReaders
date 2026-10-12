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

1. Arcade home page; move Dragon Readers into its own cabinet (saves kept).
2. Halloween: Pumpkin Patch (before Oct 31).
3. Kirby: Dream Land Words.
