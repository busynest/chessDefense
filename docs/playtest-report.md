# Playtest report

108 AI-vs-AI matches on the deterministic engine, then a human game against Normal in Chrome. The batch covers easy, normal, and hard, mirrored and crossed, 12 seeds each. White acts before Black on a shared tick. A match still running at 6000 ticks (10 minutes) would be unfinished. The engine has no stalemate result. Re-running three Normal mirrors produced the same final fingerprint. No match threw.

## Ranked findings

1. **Hard was strictly worse than Easy and Normal.** Hard won 0 of 48 games against an easier opponent (Easy beat Hard 24/24, Normal beat Hard 24/24). Hard walled its own deployment rank down to a one-cell gap, and a tower only looked for a spawn on its own file, so most of Hard's towers never deployed. Soldiers also stopped to hit any wall within one cell, so that legal gap did not carry an army. Hard then walked pieces forward into the enemy wave. Mirror games were close to even. This was the highest-impact bug.

2. **Matches end while most of the board is still standing.** Mean length was wave 3.3–3.8 and 49–61 seconds. The winner kept about 12.8 towers and the loser about 4.4, out of 16. Iron Cannons dealt 236,331 damage and 6,239 kills, against 91,780 / 2,138 for archers, the next unit. The chess layer barely comes into play. A human Normal game ended the same way: White won on wave 3 at about 49 seconds after one pawn move and a failed wall.

3. **Knight towers did not fight.** Across 108 games the knight aura landed 4 hits and 32 damage. Range 1 only reaches a soldier standing on the tower. Knights were also the second-most-common first death (33 games), behind pawns (75).

4. **Blast almost never happened.** 20 casts, 920 damage, 9 kills, against 301 Blessings and 386 Heals. The AI healed whenever any friendly tower was under half health, which is true for almost the whole match, so Blast never got a turn. The spell is not useless in the rules. The computer would not cast it.

5. **Gold and mana sat on the cap.** Each side gained about 580 gold and spent 250 (43%). About 151 ticks per side, roughly 15 seconds of a one-minute game, were spent at the 400 gold cap. Mana was the same shape: 207 gained, 87 spent, 134 ticks at the 160 cap. Income was 10 gold and 5 mana a second. Once the cap is reached, another wall or move is free relative to a player who is still saving.

6. **The opening does not teach the win or the walls.** The menu says the armies do not move like chess. The old banner said the first wave had not marched. It did not say that the King tower is the target. The build lasted 12 seconds. Clicking a tower and then a green square works, and the highlights are readable. Placing a wall is not: the button is easy to miss, a click on a tower cell only flashes "A tower stands on that cell," and the next AI banner replaces it. On a phone the panel sat above the board, so White's back rank started below the fold during that 12 second build.

7. **The board read as a pale grid.** Light squares were a flat tan and the towers sat in a small inset, so the pieces looked like icons on graph paper. That matches the art note from the previous pass.

8. **Nothing failed to finish.** 0 draws, 0 unfinished matches, 0 exceptions, 0 desyncs. Headless Chrome held 60–61 fps through wave 3 with about 38 soldiers. The only console errors are the known Firebase Installations and Analytics 400s from the existing API key, plus Lit's dev-mode notice.

## Human game

Versus Normal, desktop, 1440×1100. The goal was not obvious until the victory line. The 12 second build was gone before a wall was placed successfully. One pawn step was legal and the green squares were clear. Gold reached 400 and mana 160 during wave 2 and stayed there. White won on wave 3 without a plan. Performance held at 60 fps. The same panel and the same short clock are what a Hard game would have shown. The batch is what showed that Hard was the easier opponent.

## What changed

Bugs:

- A living tower deploys on the nearest open cell ahead of it, not only on its own file. A wall in front of a pawn no longer silences that pawn.
- Soldiers follow an open path. They break a wall when it blocks every route, instead of stopping for every wall beside the lane. A one-cell gap is a route again.
- Hard leaves a three-cell lane, same as the other difficulties, and will not step a piece into soldiers that are already within three cells. It still acts every 1.2 seconds and still builds more walls.
- Blast is considered before Heal, and Heal waits until a tower is under 40% life.

Balance, in `units.ts`, with the batch re-run below:

- Knight aura range 1 to 2, damage 8 to 6. A knight tower should shoot into the square in front of it. At the old range it did not shoot at all.
- Iron Cannon strength 18 to 14 and range 6 to 5. Cannons were almost half of all soldier damage and were ending the King fight by wave 3.
- Income 10 gold and 5 mana a second to 8 and 4. The caps were being reached mid-wave 2, so later choices were free.
- Build phase 12 seconds to 18. Twelve seconds was not enough to read the panel, select a tower, and place a wall.

Clarity and art:

- The opening banner and a build-phase coach line state the goal, the move, and what the wall button does. How to play lists the wall gesture.
- On a narrow screen the board is above the panel.
- Light squares run from warm stone `#c4a882` into `#7a5340`, dark squares from `#6a4032` into `#241610`, with a bevel and a light grain. Towers extend past the square (`inset: -10% -4% 5%`) and carry a contact shadow. Health bars are one pixel taller.

## Before and after

Same 108-game set. Win rates are White's share of decided games. Hard's win rate in the cross table is the harder side.

| Matchup | Before | After |
| --- | --- | --- |
| Easy vs Easy | White 5–7, 58s, wave 3.5 | White 3–9, 66s, wave 3.4 |
| Normal vs Normal | White 7–5, 61s, wave 3.8 | White 6–6, 61s, wave 3.3 |
| Hard vs Hard | White 7–5, 58s, wave 3.4 | White 8–4, 49s, wave 2.6 |
| Easy vs Normal | White (Easy) 10–2 | White (Easy) 5–7 |
| Normal vs Easy | White (Normal) 1–11 | White (Normal) 8–4 |
| Easy vs Hard | Hard 0–12 | Hard 9–3 |
| Hard vs Easy | Hard 0–12 | Hard 10–2 |
| Normal vs Hard | Hard 0–12 | Hard 5–7 |
| Hard vs Normal | Hard 0–12 | Hard 8–4 |

Hard against an easier AI went from 0/48 to 32/48. Against Easy alone it is 19/24. Against Normal it is 13/24, so Hard is no longer a trap and it is not yet a clear step up from Normal.

| | Before | After |
| --- | --- | --- |
| Draws / unfinished / errors / desyncs | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Knight-tower hits | 4 | 378 |
| Cannon damage (share of soldier damage) | 236,331 (45%) | 160,966 (44%) |
| Blast casts | 20 (0.19 per game) | 76 (0.70 per game) |
| Blessing / Heal casts | 301 / 386 | 559 / 426 |
| Gold spent / gained | 0.43 | 0.39 |
| Mana spent / gained | 0.42 | 0.64 |
| Ticks at the gold cap, per side | 151 | 148 |
| Ticks at the mana cap, per side | 134 | 70 |
| Blocks placed / destroyed, per side | 15.7 / 13.6 | 4.0 / 0.07 |
| First tower to fall | Pawn in 75 games, knight in 33 | Pawn in 85 games, knight in 20 |
| Towers left, winner / loser | 12.8 / 4.4 | 9.6 / 3.1 |

Walls are no longer rebuilt all match. They stay up and shape the lane. That is why destroyed blocks fell from 13.6 per side to almost none. Cannon's share of damage barely moved. The King fight is still a wave-3 event.

Tests cover a walled file still deploying, a soldier walking a one-cell gap, and a soldier breaking a wall when every route is closed. `npm test` is 18/18.

## For Jack

These are pace and personality decisions, not bugs.

- **How long a match should be.** After the cannon trim, games are still over by wave 3 or 4, and the winner still has most of an army. Lengthening the King fight (more King life, slower cannons, or a softer wave scale) changes the feel of the whole game. It should be a chosen pace, not another quiet number.
- **Whether Hard should beat Normal.** Hard now wins about half of its games against Normal and about four fifths against Easy. It acts faster and builds more walls. It does not yet play a different plan. A Hard that protects the King, or that saves Blast for a real cluster, would make the difficulty label true.
- **Gold still reaches 400.** Cutting income from 10 to 8 a second did not move time-at-cap. The computer cannot spend gold as fast as it arrives, because moves have cooldowns and the wall budget is 2, 4, or 6. A lower cap, or gold that only arrives during the build, would make a move feel expensive. That is an economy redesign.
- **Easy mirrors favor Black, 9–3 after the fix.** Normal mirrors are 6–6. The board is symmetric and the batch is deterministic, so this is White moving first on Easy's slow clock, not a coin flip. It is small enough to leave until the difficulty plan is settled.
- **Blast is still rare** at 0.7 casts a game. The Queen sits on the back rank, and enemies are only in range once they have already reached the camp. A forward Queen, or a Blast that can be aimed, is a new verb. Left alone on purpose.
