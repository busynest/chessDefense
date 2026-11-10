# Polish review

Played on 10 Nov 2026 in Chrome. Desktop was 1440×1100. The phone profile was 390×844. I went through the menu, the first-match tutorial, a live Easy opening, the wall tool, a fast-forwarded match that reached a result, and the phone layout with the board and the controls. The online host/guest path was checked with the emulator match, not by sitting through two full browser games. No page errors on the desktop session.

Scores are against a finished, polished indie tower-defense game. 10 means I would ship it. 1 means the piece is missing or hostile.

## Before

| Category | Score | What I actually saw |
| --- | --- | --- |
| Core fun / pacing | 5 | The first wave is a real fight. Mirrors then grind. The last 108-game batch had Easy vs Easy at a 305s mean and an 481s longest game, with Easy gold sitting at the cap 74% of the time. There is no late-game turn. |
| Clarity / onboarding | 5 | A six-step tutorial exists and the banner says the towers are fixed. Step 1 said "tap a pawn" and did not select one, so the range ring it describes was not on screen. Targeting, walls, and Overcharge were a paragraph under the gold. A new player can win without learning to aim. |
| Game feel / juice | 3 | Soldiers bob. A banner announces the wave. Sound is two oscillator notes for the wave and the victory. Towers lose life with no number, no flinch, and no hit sound. |
| Visual polish | 7 | The board, pieces, and mountain backdrop are original and consistent. The menu is calm. The HUD is a stack of similar buttons, not an ugly one. |
| UI / HUD, desktop | 6 | Everything you need is in the left panel and the type is readable. Wall count is printed twice. The panel is long before you are told what matters. |
| UI / HUD, phone | 4 | The board sits on top and is large enough. Every decision was below it. Blessing, Heal, and Blast started around y=995 on an 844px screen. The header crammed Settings, Feedback, and Login into one row. Touch targets were 44px. |
| AI / difficulty curve | 5 | Easy loses to Normal and Hard, and Hard beats Normal. That curve is real. The opponents are the same script at different speeds. Easy bought at most a handful of walls and then banked gold. |
| Balance | 5 | Cross-tier games end. Mirrors do not. The 36-wall cap is unused by the AI, which stopped around 4 or 5. King hits at 15% make a stalled end last. |
| Online | 6 | Host, guest, code, abandon, and snapshots work in the emulator test. There is no rematch for an online game and no ready check. I did not feel a long live match in two windows this pass. |
| Performance | 6 | An unthrottled wave-6 frame was about 17ms average, 33ms at the 95th percentile, with 39 soldiers. Late waves animate every soldier on a loop. I did not get a clean 4× CPU throttle number before the fixes. |
| Accessibility | 4 | Keyboard covers pause, walls, target, upgrade, repair, overcharge, and the three spells, and that list is easy to miss. Reduced motion turns the animations off. Teams are light versus dark, with red and blue flags. No second cue for colorblind players. |
| Stability | 8 | The suite was green and the review session logged no page errors. I did not hit a crash. |
| Completeness | 6 | Menu, settings, pause, mute, results, local history, about, how to play, and a service worker are all there. The result was one line: winner, wave, time, towers left. |

**Overall before: 5.** The rules are a game. The presentation is a handsome prototype. Pacing, feedback, and the phone are what keep it off a finished shelf.

Ranked gaps, most felt first:

1. Mirrors drag past five minutes with no escalation.
2. Easy banks gold and never builds a maze worth walking through.
3. A new player is not shown the range, the target, or Overcharge.
4. Hits do not read. No number, no sound.
5. On a phone you cannot watch the board and cast at the same time.
6. The result screen does not tell you what happened.
7. Teams are not safe for colorblind players.
8. Late waves keep animating every soldier.
9. Online has no rematch.

## After this pass

| Category | Before | After | What changed |
| --- | --- | --- | --- |
| Core fun / pacing | 5 | 7 | At five minutes the kings are exposed. King hits become full hits, other tower hits double, and a soldier in range of a tower strikes it before dueling. The banner says so. |
| Clarity / onboarding | 5 | 7 | Versus AI opens with the d2 pawn selected and its ring on the board. The tutorial is seven steps and names Overcharge. |
| Game feel / juice | 3 | 6 | A tower that loses life shows the number and a short hit tick. Still no impact shake. |
| Visual polish | 7 | 7 | Same art. |
| UI / HUD, desktop | 6 | 6 | Unchanged aside from the result lines. |
| UI / HUD, phone | 4 | 6 | A dock under the board has Pause, walls, and the three spells. The header keeps the wordmark and Login. Settings and Feedback stay in the footer. |
| AI / difficulty curve | 5 | 6 | Easy, Normal, and Hard build one stable lane, up to 8, 12, and 14 walls. Easy spends a high bank on pawns, then walls, then knights, and stops skipping turns once it is at the gold cap. |
| Balance | 5 | see batch | The 108-game rerun is the check. The first four minutes are the old game. |
| Online | 6 | 6 | Same host and guest. Rematch is still local only. |
| Performance | 6 | 6 | Once more than 48 soldiers are out, the bobbing animation stops so the late wave is not 80 looping nodes. |
| Accessibility | 4 | 5 | White soldiers carry a blue circle. Black soldiers carry an amber diamond. Keyboard and reduced motion are as they were. |
| Stability | 8 | 8 | 36 unit tests passed, including the harder King hit after five minutes. |
| Completeness | 6 | 7 | The result lists wave, time, whether the kings were exposed, towers left, walls left, and gold left. |

**Overall after: 6.** It is closer to something you can hand to a player. It is not a 10.

## Batch after the fixes

108 games. Nothing unfinished, no draws.

| Matchup | Wins | Mean |
| --- | --- | --- |
| Easy vs Easy | 6–6 | 233s, wave 14.7 |
| Normal vs Normal | 6–6 | 321s, wave 20.6 |
| Hard vs Hard | 7–5 | 298s, wave 19.1 |
| Normal vs Easy, both seats | Normal 24–0 | 124–131s |
| Hard vs Easy, both seats | Hard 24–0 | 132–137s |
| Hard vs Normal, both seats | Hard 16, Normal 8 | 292–299s |

Easy's gold-cap time fell from 74% to 52%. The longest game is 385s, down from 481s. Thirty-three games pass five minutes and then end in the exposed-kings minute. Cross-tier order is unchanged: Easy loses every game to Normal and Hard, and Hard beats Normal 16–8. Overcharge is 14.7 per game. Gold sits at the 120 cap 43% of the time.

## Third pass

| Category | Was | Now | What changed |
| --- | --- | --- | --- |
| Core fun / pacing | 7 | 7 | The five-minute exposure is now a HUD countdown, and How to play states it. King hits are full hits, other towers take double, and a soldier in range strikes the tower before dueling. |
| Clarity / onboarding | 7 | 8 | The tour points. Step 1 rings the pawn. Later steps highlight a wall square, the Target button, and Blessing. Skip still works. How to play can replay the tour. |
| Game feel / juice | 6 | 7 | Each shot kind has its own synthesized voice. A tower flashes when hit, and a collapse shakes the board unless reduced motion is on. The wave launch is a four-note fanfare. |
| Visual polish | 7 | 7 | Soldiers are drawn on one canvas as distinct tokens (circle, triangle, diamond, block) in the team color. The towers are unchanged. |
| UI / HUD, desktop | 6 | 7 | One gold line for both sides. Wall count lives on the button. The exposed countdown is its own line. |
| UI / HUD, phone | 6 | 7 | The same shorter HUD, with the dock still under the board. |
| AI / difficulty curve | 6 | 7 | Normal and Hard bless the wave they are about to launch, then Overcharge a tower for that launch, and heal or repair a tower that has enemies on it. |
| Balance | 6 | 7 | 108 games, nothing unfinished. Easy mirrors mean 233s. Normal mirrors fell from 321s to 275s. Longest game 371s. Hard beats Normal 15–9. Easy loses every cross match. Easy gold-cap time is 52%. |
| Online | 6 | 7 | Either player can offer a rematch. When both have agreed, the host starts a new match and both keep their seats. |
| Performance | 6 | 7 | 4× CPU, wave 12, 64 soldiers. Before: 64 soldier elements, 16.7ms idle frame. After: one canvas, 17.6ms idle frame, 19.3ms per simulation step plus paint. The frame stayed on the 60Hz cap. The node count is what dropped. |
| Accessibility | 5 | 6 | Settings has Bright colors (blue and orange) on top of the circle and diamond. Buttons show a focus ring. The wave line is aria-live and the panel is labeled. |
| Stability | 8 | 8 | 37 unit tests passed, including Hard blessing the next wave and the online rematch agreement. |
| Completeness | 7 | 7 | Rematch is in. A damage log is not. |

**Overall now: 7.** A player can learn it from the board, hear the difference between a cannon and an arrow, and finish a mirror when the kings are exposed. It is still not a 10.

108 games after the hunt and the full King hit. Nothing unfinished, no draws. Easy vs Easy 6–6, mean 233s, wave 14.7. Normal vs Normal 6–6, 275s. Hard vs Hard 5–7, 291s. Normal and Hard both beat Easy 24–0. Hard beats Normal 15–9, means 270–293s. Longest game 371s. Twenty-six games pass five minutes and end in the exposed minute. Easy gold-cap time 52%. All-sides gold cap 42%. Overcharge 15.4 per game.

## Sprite pass

| Category | Was | Now | What changed |
| --- | --- | --- | --- |
| Visual polish | 7 | 8 | The six soldiers are original drawings on the same canvas: peasant, mounted knight, archer, iron cannon, mage, and royal guard. White is pale steel with blue trim. Black is obsidian with amber trim. Bright colors swaps the inks to blue and orange. A circle or a diamond stays under the feet. |
| Performance | 7 | 7 | The atlas is built once per device pixel ratio and palette. Classic took 8.8ms, bright 6.4ms, and the sheet is 432×576. At 4× CPU, wave 12, 64 soldiers: token idle 16.7ms, sprite idle 17.6ms, token stress 19.3ms, sprite stress 20.6ms. Reduced motion holds a static frame. Past 48 soldiers the idle bob still stops. |

The simulation did not change, so the 108-game batch matches the hunt numbers above. Overall stays 7. The atlas reads at board size, and it is still flatter than the tower illustrations.

## Still left for a 10

- The soldier atlas is original and readable, and it is still flatter than the tower illustrations.
- The desktop panel is shorter and still lists every system once a tower is selected.
- Online rematch has no ready check and has not been sat through in two browsers under latency.
- Focus order on the board squares is the browser default.
- Hard and Normal now time a blessing and an Overcharge to the launch and defend a tower under attack. They are still one script.
- No replay, and the result still has no damage breakdown.
