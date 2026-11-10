# Playtest report

108 AI-vs-AI games after the King, repair, and Blast pass. 12 seeds, every pairing of easy, normal, and hard. Each side rolls on its own random stream, so White no longer spends Black's rolls by acting first. On a tick when both sides act, who goes first alternates. Nothing unfinished, nothing thrown, no desync on the repeated Normal mirrors.

## What changed

- The King has 720 life. A soldier's hit on the King is 15% of a normal hit (`KING_LEAK`), rounded, and at least 1. Other towers still take the full hit. In a Hard-vs-Easy trace the losing King dropped to 645 of 720 on wave 5, was still standing on wave 7, and fell at 117 seconds.
- Repair sits beside Upgrade. Cost is `ceil(missing life × 0.12)`, at least 4 gold. The tower then cannot be repaired for 8 seconds. A green flash marks the mend. The guest sends a repair command; the host applies it. Every difficulty repairs. Hard mends the King below 85% and any tower below 60% before it buys another upgrade. Easy and Normal wait until the wound is deeper. Once upgrades are done, any difficulty mends whatever is damaged, which is the gold sink at level 3.
- Blast's radius is 6 cells, up from 4, so it reaches the pawn line. Normal and Hard cast it before spending gold when enemies are already in that circle (1 enemy for Hard, 2 for Normal).
- The old shared random stream was the first-player bias: White's roll changed Black's next roll. Each side now has its own stream.

## Batch

| Matchup | Wins | Mean length |
| --- | --- | --- |
| Easy vs Easy | White 8, Black 4 | 187s (3.1 min), wave 11.7 |
| Normal vs Normal | White 8, Black 4 | 246s (4.1 min), wave 15.7 |
| Hard vs Hard | White 4, Black 8 | 257s (4.3 min), wave 16.3 |
| Normal vs Easy, both seats | Normal 24, Easy 0 | 114–115s, wave 6.8 |
| Hard vs Easy, both seats | Hard 24, Easy 0 | 113–114s, wave 6.7 |
| Hard vs Normal, both seats | Hard 21, Normal 3 | 237–251s, wave 15–16 |

Hard vs Easy was about 74 seconds before this pass. It is now about 114 seconds, and the King lives through the first leak. Mirror games sit at 3.1, 4.1, and 4.3 minutes. Normal and Hard mirrors are just past the 4 minute mark.

Gold spent is 93% of gold gained (182,516 of 195,761). Repairs: **1,430** in 108 games, **13.2 per game**. Mana spent is 87%. Spells: Blessing 2,490, Blast **221** (2.0 per game, up from 81 / 0.75), Heal 49. Heal dropped because Blast now fires first when the camp is touched. All six tower types still land hits. Bishop towers remain the highest tower damage because they shoot farthest.

About **49%** of side-ticks are at the 120 gold cap. Repair is used, and it does not keep up with 3 gold a second once a town is mostly level 3 and only one tower is wounded. The 8 second cooldown is longer than it takes to refill the cap.

## Sides

Mirrors are 8–4 White, 8–4 White, and 4–8 Black. Together that is 20 White and 16 Black. The old Hard-mirror result was 8–4 White when both sides shared one random stream and White always rolled first. That specific White advantage is gone: Hard mirrors now lean Black by the same 8–4 margin. On 12 games that split is still noise-sized, and it is no longer the same side every difficulty.

## For Jack

- Gold still reaches 120 for about half the match. The next sink that would matter is either slower income or a repeatable level-3 spend that is not gated on missing life (a brace, or a shorter repair cooldown on Hard only). Left alone so this batch stays the measurement.
- Normal and Hard mirrors run a little past 4 minutes. If that is too long, a slightly higher King leak (toward 0.2) shortens them without bringing Hard vs Easy back to a one-minute end.
- Heal is now the rare spell, because Blast answers the camp first. That is the trade for making Blast a real choice.
