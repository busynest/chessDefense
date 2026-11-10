# Chess Defense

Two medieval kings defend their towns on one board. The chess pieces are towers. They never move.

## Rules

There are two layers.

**Towers, the 8×8.** Chess pieces are tower-defense buildings in that piece's silhouette. They begin in the standard starting position, White along the bottom, and they stay there for the whole match. There is no movement, no capture, no castling, and no promotion. Each tower shoots in its own way and, every wave, sends its soldier. Destroying the enemy King tower wins the match.

| Tower | Role | Level 1 shot | Upgrade |
| --- | --- | --- | --- |
| Pawn | Arrow outpost | 3 damage, range 3.2, every 0.8s | 18, then 29 |
| Knight | Close cleave that roots | 6 damage, range 3.3, every 1.6s | 26, then 42 |
| Bishop | Piercing bolt that slows | 4 damage, range 6.4, every 1.4s, 2 targets | 26, then 42 |
| Rook | Cannon splash | 9 damage, range 5.4, every 2.2s | 34, then 54 |
| Queen | Area magic, and the spell anchor | 5 damage, range 4.6, every 1.6s | 40, then 64 |
| King | Keep, modest shot, damage aura within 2 squares | 4 damage, range 3, every 1.2s. 720 life | 30, then 48 |

A level adds a quarter more damage, a little range, more life, and slightly stronger soldiers. Level 3 is the top. The King's aura adds 12% damage to friendly towers within two chess squares, and more after an upgrade. Corner rooks stand outside that aura.

**Armies, the 16×16.** Every chess square is split into four cells. Soldiers do not spawn in a trickle. After an 18 second build, every living tower releases its soldier at once: pawns send peasants, knights send cavalry, bishops send archers, rooks send iron cannons, the Queen sends a mage, and the King sends a royal guard. The next wave is 15 seconds later. Wave 1 and 2 send one soldier per tower. Waves 3 and 4 send two. Wave 5 and after send three, and each wave adds 15% life and strength. A side can have 40 soldiers on the board. Anyone past that cap waits for the next launch.

Soldiers march toward the enemy King, route around towers and blocks, fight enemy soldiers in range, and attack towers. A tower at zero life is destroyed and leaves the 8×8. Its four cells open up, and it stops sending waves. Towers also shoot soldiers that walk into their range.

**Blocks.** Each player spends 12 gold to place a wall on the 16×16 grid, only on their own half. White's half is the bottom eight rows (screen rows 8–15). Black's half is the top eight (screen rows 0–7). A wall has 28 life. Soldiers walk through a gap and only break a wall when it blocks every route, so a maze stalls and a sealed rank gets chewed open. Picking up your own wall refunds 6 gold. A placement that would wall off every route between the two home ranks is rejected. Walls cannot sit on a tower cell or on another wall. A wall in front of a tower does not silence that tower: the soldier deploys on the nearest open cell ahead.

**Economy.** Both towns earn 3 gold and 3 mana each second, starting from 36 gold and 14 mana. Gold pays for walls and tower upgrades. Mana pays for Queen spells. Gold caps at 120 and mana at 100.

**Queen magic.** Only a living Queen can cast, and every spell is centered on her.

- **Blessing** (24 mana). Friendly soldiers within 5 cells gain 4 strength and 35% speed, plus 6 life, for 6 seconds.
- **Heal** (28 mana). Friendly towers within 2 chess squares regain 30 life.
- **Blast** (36 mana). Enemy soldiers within 6 cells take 16 damage. Enemy towers within 2 squares take 10.

**Repair.** Tap a wounded tower and spend gold for the life it is missing, about one gold per eight life, at least 4. The tower cannot be repaired again for 8 seconds. Soldiers that reach the King deal 15% of a normal hit, so one leaker wounds the keep.

**Overcharge.** A level 3 tower can spend gold to hit 50% harder and faster for 8 seconds. Soldiers it launches in that window are stronger. The first charge on a tower costs 36. The next one on that same tower costs 28 more, then 28 more again. It cannot be bought again for 30 seconds. The button shows the price for that tower. The tower glows gold while the boost lasts.

**Win.** Destroy the enemy King tower, with soldiers or with a chess capture. If both King towers fall on the same step, the match is a draw.

### Units

| Tower | Builds each wave | Life |
| --- | --- | --- |
| Pawn | Peasant | 56 |
| Knight | Knight | 96 |
| Bishop | Archer | 64 |
| Rook | Iron Cannon | 120 |
| Queen | Mage | 100 |
| King | Royal Guard | 720 |

The shot table above is the tower's own attack. The soldier table is the army it sends.

| Soldier | Strength | Life | Speed | Range | Attack |
| --- | --- | --- | --- | --- | --- |
| Peasant | 5 | 24 | 2.2 | 1 | 0.8s |
| Knight | 11 | 40 | 3.2 | 1 | 0.9s |
| Archer | 7 | 22 | 2.0 | 4 | 1.0s |
| Iron Cannon | 12 | 32 | 1.1 | 5 | 1.6s |
| Mage | 8 | 26 | 1.8 | 3 | 1.1s |
| Royal Guard | 12 | 54 | 1.5 | 1 | 0.8s |

Speed is cells per second. Range is Chebyshev distance on the 16×16 grid, so 1 includes diagonals. Strength is the damage of one hit. Kills pay a small gold bounty.

Projectiles show the shot. The damage lands when the attack fires, not when the drawing arrives. That keeps the match deterministic.

## How to play

Open the site and choose a mode.

- **Versus AI.** You are White. Easy hesitates and mostly heals. Normal takes captures and casts. Hard acts often and walks pieces forward.
- **Local 2 player.** Both colors are live at once on one screen. White and Black can each select their own towers while the armies keep moving. This is split control, not a turn-based hot-seat, because the match is real time.
- **Online 1v1.** Sign in, host a four-letter code, and send it to the other player. The host is White and runs the simulation. The guest is Black and sends moves and spells to the host. The host publishes the position about twice a second. The guest is looking at that snapshot, so orders arrive a short moment later. If the host closes the tab, the match stops.

Tap one of your towers. A ring shows its range, and Upgrade spends gold. The wall button opens block placement: your half of the board is shaded, a green cell is legal, and a red cell is not. Tap a cell to build. Tap your own wall to sell it. Spell buttons sit in the side panel, or above the board on a phone. Pause freezes the armies. The page also pauses while the tab is hidden. Menu leaves the match. Rematch starts the same mode with a new layout seed.

Sign in to save a win, loss, or draw from versus-AI and online matches. Local games are not recorded, because two players share one account. The record is `wins–losses–draws`.

## Design decisions

These are the calls the brief left open.

- White sits on rank 1. The human is White against the AI.
- Towers capture each other by chess moves. Soldiers also damage towers, including the King.
- No castling, en passant, or promotion. Those rules fight the real-time layer more than they help it.
- Soldiers attack in waves, not a stream. Twelve seconds of building, then a launch, then fifteen seconds until the next one.
- Soldiers do not occupy cells. A lane can stack. Towers occupy their four cells, and player blocks occupy one.
- Pathing is breadth-first search to the closest reachable cell to the enemy King. A block that cuts every route from one home rank to the other is rejected. Soldiers can also break a block they are standing against, so a maze is not permanent.
- Each side is capped at 40 soldiers so a late wave cannot flood the board.
- The opening has no neutral stones. The maze is whatever the players, or the AI, pay for.
- The clock is a fixed 100ms step, drawn from `requestAnimationFrame`. The simulation never reads the frame delta except to decide how many steps are due. A long hitch applies at most 200ms.
- Gold and mana are separate. Moves spend gold. Spells spend mana.
- Queen spells are self-centered so a phone can cast without a second targeting gesture.
- The King builds a royal guard instead of a second spell, and still moves one square.
- Local play is simultaneous. A hot-seat turn would freeze one town while its armies were still the thing that loses.
- Online play is host-authoritative rather than lockstep. Firestore latency is a poor shared clock, and one simulator cannot drift from itself. Guest commands are checked against that side's pieces, so a guest cannot move White. The host publishes the position every half second, and once more when the match ends, so the guest sees the same King fall. A listener that starts again does not replay commands it already had, so a reconnect does not spend the gold twice.
- Match history is per signed-in user. Versus AI and online write `users/{uid}` and `users/{uid}/history`. Local matches do not.
- The same seed and the same commands replay the same match. The AI reads a stored random state, not `Math.random`.

## Develop

Display type is [Cinzel](https://fonts.google.com/specimen/Cinzel) and body type is [Spectral](https://fonts.google.com/specimen/Spectral), both served by Google Fonts under the SIL Open Font License, with Palatino as the fallback. Every picture on the board is original SVG and CSS. No asset pack is used. The tones are original oscillators, credited here, not a sound library.

The stack is Lit 3, Redux Toolkit 2, pwa-auth, and Firebase 12. TypeScript is compiled with `tsc`. Development uses `@web/dev-server`. Production uses Rollup. There is no Vite and no Polymer.

Sound is original synthesis in the browser (oscillators only). No sampled recordings are shipped. Volume and mute are saved in this browser with the last difficulty and whether the first-match tutorial has been seen.

To play on this machine, emulators and the dev server together:

```bash
npm install
npm run dev:emulators
```

Open http://127.0.0.1:8080 . That host selects the development Firebase config. Sign in from the Login button with any email and password if you want a saved record or an online match. Versus AI and local 2 player work signed out. The first versus-AI match shows a short tutorial. Pause is P or Space. Menu is M.

```bash
npm test
npm run test:online
npm run test:e2e
npm run build
```

`npm test` compiles and runs the rule tests with Node's test runner. They cover upgrades, repair, Overcharge pricing, Easy spending a full bank on pawns, pathing, the King falling, spells, deterministic replays, and a scripted win against the easy AI.

`npm run test:e2e` plays a versus-AI match in Chrome from the title screen through the results and back to the menu. It needs the dev server, and reuses one that is already on port 8080.

`npm start` serves http://127.0.0.1:8080 and keeps `tsc --watch` running, without starting the emulators. Sign-in and online matches need `npm run dev:emulators` instead.

### Local online matches

`config/development.js` and `config/production.js` hold the contractors-centre web config. `boot.js` runs before the app module. On `localhost` or `127.0.0.1` it selects the development config, whose Realtime Database URL is `http://localhost:9000?ns=emulationui`. Any other host selects production, `https://contractors-centre.firebaseio.com`. Both keys land on `window.process.env` together: `NODE_ENV` and `FIREBASE_CONFIG`. pwa-auth reads that config when it loads.

On localhost the page also talks to the Auth emulator on port 9099 and the Firestore emulator on port 8088. A production host does not. Sign-in and online matches on this machine need those emulators running.

```bash
npm run dev:emulators
```

Then open http://127.0.0.1:8080 . Sign in from the Login button with any email and password. The emulator keeps those accounts on this machine only.

`npm run test:online` boots the same emulators, plays a host and a guest through create, join, build, a wall, upgrade, repair, Overcharge, a spell, a wave, a dropped guest listener, and the King falling, then exits.

`npm run build` writes the hosting bundle to `dist/`. `dist/` is not committed. Firebase Hosting is pointed at it.

```bash
npx firebase deploy --only hosting,firestore:rules,storage,database
```

Deploy the rules with the site. Until those rules are published, online matches and saved records are rejected by Firebase.

### Layout

`src/game/units.ts` holds every stat. `src/game/simulate.ts` is the pure step function. `src/game/chess.ts` is movement. `src/game/pathing.ts` is the 16×16 search. `src/game/ai.ts` chooses one action for the computer. `src/game/game_state.ts` is the Redux slice. The board components (`board-square`, `one-square`, `four-square`, `square-space`, `box-block`, and the six piece elements) only draw. `chess-defense` owns the menu, the clock, and the online listeners.

### Firebase

`src/firebase-config.ts` reads the config `boot.js` already chose, and passes that same JSON to the pwa-auth elements. pwa-auth still provides `<user-icon>`, `<user-drawer>`, `<user-login>`, `<user-settings>`, and `<email-reset>`. The Firebase project is contractors-centre.

`firestore.rules` lets a signed-in player read and write only `users/{their uid}`, create a match they host, join a match that has an empty guest seat, and append inputs stamped with their own uid. The host may update the match document. Guests may not overwrite the snapshot after they have joined. Feedback can be created by a signed-in user.

`storage.rules` allows an image under 5 MB at `pwa-auth/{uid}/…`, which is where profile photos go. `database.rules.json` limits the Realtime Database to `users/{uid}` for that same user.

Online play on a deployed host uses the contractors-centre project. Localhost uses the emulators instead, so a match can be played before those rules are published. The Realtime Database emulator is port 9000, namespace `emulationui`, matching the development database URL.

The contractors-centre web key is a real Identity Toolkit key. A request from `https://contractors-centre.firebaseapp.com` is accepted. A request from `http://localhost:8080` or `http://127.0.0.1:8080` is rejected with `API_KEY_HTTP_REFERRER_BLOCKED`. That is why local sign-in goes through the Auth emulator.
