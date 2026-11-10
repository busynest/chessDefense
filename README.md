# Chess Defense

Two medieval kings defend their towns on one board. The game is chess played slowly, and tower defense played underneath it.

## Rules

There are two layers.

**Towers, the 8×8.** Chess pieces are towers. They begin in the standard starting position, White along the bottom. They move by the normal chess rules for their piece, but a move spends gold and then the tower has to wait several seconds. Towers cannot share a square. Moving onto an enemy tower captures it. Capturing the enemy King, or reducing the King to zero life, wins the match.

There is no castling, no en passant, and pawns do not promote. A pawn moves one square toward the enemy, or two from its starting square when the path is clear, and captures one square diagonally forward.

**Armies, the 16×16.** Every chess square is split into four cells. Towers build soldiers onto the cell in front of them. Soldiers march toward the enemy King, route around towers and stone blocks, fight enemy soldiers in range, and damage towers. Soldiers do not block each other. Towers and blocks do.

A side may have at most 16 soldiers at once. Further spawns wait until there is room.

**Economy.** Both towns earn 10 gold and 5 mana each second, starting from 36 gold and 18 mana. Gold pays for tower moves. Mana pays for Queen spells. Gold caps at 400 and mana at 160.

**Waves.** Every 20 seconds the wave number rises and spawn cooldowns shorten, down to 40% of the opening pace.

**Queen magic.** Only a living Queen can cast, and every spell is centered on her.

- **Blessing** (24 mana). Friendly soldiers within 5 cells gain 4 strength and 35% speed, plus 6 life, for 6 seconds.
- **Heal** (28 mana). Friendly towers within 2 chess squares regain 30 life.
- **Blast** (36 mana). Enemy soldiers within 4 cells take 16 damage. Enemy towers within 2 squares take 10.

**Blocks.** Eight stone blocks sit in the center in two clusters, with a lane between them and open wings on both sides.

**Win.** Destroy the enemy King. If both Kings fall on the same step, the match is a draw.

### Units

| Tower | Builds | Life | Move | Spawn | Aura |
| --- | --- | --- | --- | --- | --- |
| Pawn | Peasant | 48 | 8 gold, 4.0s | 3.6s | 3 damage, range 2 |
| Knight | Knight | 80 | 18 gold, 5.0s | 7.0s | 8 damage, range 1 |
| Bishop | Archer | 55 | 16 gold, 5.0s | 4.8s | 5 damage, range 4 |
| Rook | Iron Cannon | 100 | 24 gold, 7.0s | 9.0s | 12 damage, range 5 |
| Queen | Mage | 90 | 30 gold, 8.0s | 11.0s | 8 damage, range 4 |
| King | Royal Guard | 140 | 20 gold, 6.0s | 13.0s | 9 damage, range 2 |

Auras fire on their own cooldown. They are the tower shooting while its soldiers are away.

| Soldier | Strength | Life | Speed | Range | Attack |
| --- | --- | --- | --- | --- | --- |
| Peasant | 5 | 16 | 2.2 | 1 | 0.8s |
| Knight | 12 | 34 | 3.4 | 1 | 0.9s |
| Archer | 8 | 16 | 2.0 | 4 | 1.0s |
| Iron Cannon | 18 | 26 | 1.0 | 6 | 1.6s |
| Mage | 9 | 20 | 1.8 | 3 | 1.1s |
| Royal Guard | 14 | 46 | 1.5 | 1 | 0.8s |

Speed is cells per second. Range is Chebyshev distance on the 16×16 grid, so 1 includes diagonals. Strength is the damage of one hit. Kills pay a small gold bounty.

Projectiles show the shot. The damage lands when the attack fires, not when the drawing arrives. That keeps the match deterministic.

## How to play

Open the site and choose a mode.

- **Versus AI.** You are White. Easy hesitates and mostly heals. Normal takes captures and casts. Hard acts often and walks pieces forward.
- **Local 2 player.** Both colors are live at once on one screen. White and Black can each select their own towers while the armies keep moving. This is split control, not a turn-based hot-seat, because the match is real time.
- **Online 1v1.** Sign in, host a four-letter code, and send it to the other player. The host is White and runs the simulation. The guest is Black and sends moves and spells to the host. The host publishes the position about twice a second. The guest is looking at that snapshot, so orders arrive a short moment later. If the host closes the tab, the match stops.

Click one of your towers, then a highlighted square. Green is a move. Red is a capture. Spell buttons sit in the side panel, or above the board on a phone. Pause freezes the armies. The page also pauses while the tab is hidden. Menu leaves the match. Rematch starts the same mode with a new layout seed.

Sign in to save a win, loss, or draw from versus-AI and online matches. Local games are not recorded, because two players share one account. The record is `wins–losses–draws`.

## Design decisions

These are the calls the brief left open.

- White sits on rank 1. The human is White against the AI.
- Towers capture each other by chess moves. Soldiers also damage towers, including the King.
- No castling, en passant, or promotion. Those rules fight the real-time layer more than they help it.
- Soldiers do not occupy cells. A lane can stack. Towers occupy their four cells, and blocks occupy one.
- Pathing is breadth-first search to the closest reachable cell to the enemy King. The King starts sealed in by its own back rank, so armies attack the pawn wall until a hole opens.
- Each side is capped at 16 soldiers so a stalled match cannot flood the board.
- The clock is a fixed 100ms step, drawn from `requestAnimationFrame`. The simulation never reads the frame delta except to decide how many steps are due. A long hitch applies at most 200ms.
- Gold and mana are separate. Moves spend gold. Spells spend mana.
- Queen spells are self-centered so a phone can cast without a second targeting gesture.
- The King builds a royal guard instead of a second spell, and still moves one square.
- Local play is simultaneous. A hot-seat turn would freeze one town while its armies were still the thing that loses.
- Online play is host-authoritative rather than lockstep. Firestore latency is a poor shared clock, and one simulator cannot drift from itself. Guest commands are checked against that side's pieces, so a guest cannot move White.
- Match history is per signed-in user. Versus AI and online write `users/{uid}` and `users/{uid}/history`. Local matches do not.
- The same seed and the same commands replay the same match. The AI reads a stored random state, not `Math.random`.

## Develop

The stack is Lit 3, Redux Toolkit 2, pwa-auth, and Firebase 12. TypeScript is compiled with `tsc`. Development uses `@web/dev-server`. Production uses Rollup. There is no Vite and no Polymer.

```bash
npm install
npm test
npm start
npm run build
```

`npm test` compiles and runs the rule tests with Node's test runner. They cover chess moves, captures, spawning, pathing around a wall, melee, the King falling, Blessing, deterministic replays, and a scripted win against the easy AI.

`npm start` serves http://localhost:8080 and keeps `tsc --watch` running. The page loads `out/application-shell.js`.

`npm run build` writes the hosting bundle to `dist/`. `dist/` is not committed. Firebase Hosting is pointed at it.

```bash
npx firebase deploy --only hosting,firestore:rules,storage,database
```

Deploy the rules with the site. Until those rules are published, online matches and saved records are rejected by Firebase.

### Layout

`src/game/units.ts` holds every stat. `src/game/simulate.ts` is the pure step function. `src/game/chess.ts` is movement. `src/game/pathing.ts` is the 16×16 search. `src/game/ai.ts` chooses one action for the computer. `src/game/game_state.ts` is the Redux slice. The board components (`board-square`, `one-square`, `four-square`, `square-space`, `box-block`, and the six piece elements) only draw. `chess-defense` owns the menu, the clock, and the online listeners.

### Firebase

`src/firebase-config.ts` is the existing Chess Defense web config. Nothing new was invented. pwa-auth still provides `<user-icon>`, `<user-drawer>`, `<user-login>`, `<user-settings>`, and `<email-reset>`.

`firestore.rules` lets a signed-in player read and write only `users/{their uid}`, create a match they host, join a match that has an empty guest seat, and append inputs stamped with their own uid. The host may update the match document. Guests may not overwrite the snapshot after they have joined. Feedback can be created by a signed-in user.

`storage.rules` allows an image under 5 MB at `pwa-auth/{uid}/…`, which is where profile photos go. `database.rules.json` limits the Realtime Database to `users/{uid}` for that same user.

Online play and Analytics both call Google with that web API key. From this environment the key returned HTTP 400 for Analytics. The key was left as it is. Online matches also need the rules deployed before two browsers can meet.
