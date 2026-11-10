# Playtest report

108 AI-vs-AI games after the Overcharge price change. 12 seeds, every pairing of easy, normal, and hard. Nothing unfinished, nothing thrown, no desync on the repeated mirrors.

## What changed

- The first Overcharge on a tower costs **36** gold. Each later purchase on that same tower costs **28** more: 36, then 64, then 92. The boost lasts **8** seconds. The tower cannot buy it again for **30** seconds. The panel shows that tower's price.
- Easy still almost never buys it. Normal and Hard buy it when a shot will land, when a rook, bishop, or Queen is about to launch its first charge, or when the King is badly hurt. They keep a gold reserve. A third charge on the same tower is only bought when the bank is already at 100, so a full purse is spent instead of sitting on the cap.
- The host publishes the position when the King falls, not only while the match is still running. A guest who drops the listener and comes back reads that snapshot. A restarted command listener does not replay orders it already had, so gold is not spent twice.
- Online matches can be played against the local Firebase emulators with `npm run dev:emulators` and `?emulators=1`. That path is off unless the page is on localhost and the flag is set.

## Batch

| Matchup | Wins | Mean length | Gold at cap |
| --- | --- | --- | --- |
| Easy vs Easy | White 8, Black 4 | 187s (3.1 min), wave 11.7 | 81% |
| Normal vs Normal | White 8, Black 4 | 212s (3.5 min), wave 13.4 | 36% |
| Hard vs Hard | White 6, Black 6 | 222s (3.7 min), wave 14.2 | 28% |
| Normal vs Easy, both seats | Normal 24, Easy 0 | 110–111s | 40–42% |
| Hard vs Easy, both seats | Hard 24, Easy 0 | 112–114s | 33–34% |
| Hard vs Normal, both seats | Hard 21, Normal 3 | 193–200s | 31–32% |

Ordering holds. Hard beats Normal in 21 of 24. Normal and Hard both beat Easy in all 24. Hard mirrors are 6–6. Normal mirrors are 8–4 White. Easy mirrors are 8–4 White.

One Easy mirror, seed 7, ran 340 seconds. Every other game finished in under five minutes. The cross-tier games stay near 110 seconds.

Gold spent is **96%** of gold gained. Overcharges: **1,096**, **10.1 per game**. The previous batch, with a flat 16 gold and a 12 second cooldown, bought it **86 times a game**. Repairs: **1,159**, about 11 per game. Blast 280, Blessing 2,104, Heal 31.

Time at the 120 gold cap is **40%** of side-ticks. Easy vs Easy is **81%** of that, because Easy still does not reach level 3 and has nothing priced for the spare gold. Hard vs Hard, which does buy the charges, is at **28%**.

## For Jack

- Easy's gold cap is the remaining float. Overcharge cannot drain it until a tower is level 3, and Easy does not get there.
- Hard vs Normal is 21–3. Hard buys the charge more often once towers are level 3. The price still climbs, so it is not the old every-cooldown purchase.
