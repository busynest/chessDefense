# Playtest report

The towers no longer move. This pass replaces the chess-move game with fixed tower-defense towers and remeasures it. 108 AI-vs-AI games, 12 seeds, every pairing of easy, normal, and hard. White acts before Black on a shared tick. Nothing unfinished, nothing thrown, and three repeated Normal mirrors matched. A human Normal game in Chrome confirmed the new panel.

## What a match feels like

Equal armies cancel in the middle, so a mirror is not a one-minute king snipe. Easy mirrors average **157 seconds, wave 9.5**. Normal mirrors average **138 seconds, wave 8.3**. Hard mirrors average **143 seconds, wave 8.7**. A mismatch is shorter because the side that upgrades pushes a wave through: Normal beats Easy in **76–81 seconds (wave 4–5)**, and Hard beats Normal in **123–127 seconds (wave 7–8)**. Hard against Easy is the short one, about **74 seconds**.

That mismatch is decisive. The winner of Normal vs Easy still has every tower (16) and the loser has about 4. The fight ends when the first real leak reaches the King, not after a long siege.

## Difficulty and sides

| Matchup | Result | Mean length |
| --- | --- | --- |
| Easy vs Easy | White 6, Black 6 | 157s, wave 9.5 |
| Normal vs Normal | White 5, Black 7 | 138s, wave 8.3 |
| Hard vs Hard | White 8, Black 4 | 143s, wave 8.7 |
| Normal vs Easy, both seats | Normal 24, Easy 0 | 76–81s |
| Hard vs Normal, both seats | Hard 21, Normal 3 | 123–127s |
| Hard vs Easy, both seats | Hard 24, Easy 0 | 74s |

Hard beats Normal in 21 of 24 games. Normal beats Easy in all 24. Easy mirrors are even. Normal mirrors are close (5–7). Hard mirrors lean White, 8–4.

## Towers, gold, spells

Every tower type lands hits. Bishop towers do the most tower damage because they shoot farthest (147,780). Queen 50,213, Rook 34,463, Knight 12,104, Pawn 8,741, King 3,947 direct. The King's larger effect is the damage aura, which is not in that last number. Soldier damage is still led by Iron Cannons, then archers, then peasants.

Gold spent is **91%** of gold gained. About **20%** of all side-ticks are spent at the 120 cap. Easy causes most of that: it rarely buys, so the gold sits. Normal and Hard spend on the best tower they can afford, and Hard buys twice when it has the gold. Mana spent is 85% of mana gained. Blessing is the common spell (1,427 casts). Heal 254. Blast 81.

Walls stay up. 789 were placed and 4 were destroyed. Pawns are still the first tower to fall, in every game that loses one.

## Human game

Versus Normal, desktop. The banner says the towers are fixed and names the King tower. The coach line says to tap a tower for its range and Upgrade. Tapping the a1 rook draws a dashed range ring and opens the panel: role, damage, range, cooldown, and Upgrade 34. The button spends gold and the banner announces the new level. A level 3 rook reads 14 damage, range 6.1, every 2.0s, with a gold trim and a cannon barrel. Wave 1 shows soldiers, shells, and arrows. Frame rate held at 61. The only console error is the known Firebase API-key 400. On a phone the board is above the panel, and the same level 3 stats remain readable.

## For Jack

- **Mismatch length.** Equal games land around two and a half minutes. A one-step difficulty gap can still end near 80 seconds, and the winner has not lost a tower. If that feels like a blowout, more King life makes the first leak a wound instead of the end. Left as a pace choice.
- **Hard mirrors lean White, 8–4.** Easy is 6–6 and Normal is 5–7. White acts first and spends the shared random draw first. Worth another look only if Hard-vs-Hard should be as flat as Easy.
- **Gold still reaches 120** for about a fifth of the match, mostly because Easy does not buy and because a winning side eventually runs out of towers to upgrade. A repair, paid in gold after level 3, would be a sink. It is a new verb, so it is not in this pass.
- **Blast stays the rare spell.** The Queen is on the back rank, so enemies enter Blast range only after they have already reached the camp.
