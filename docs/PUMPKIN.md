# The Pumpkin Case — host pack

Second game on the platform. Everybody plays **alone on their own phone**; the shared screen shows the clock, live progress and the reveal. Players enter a nickname when they join (kept for later games on the same evening).

## Running it

1. `/control` → **GAME: The Pumpkin Case**. Phones leave the "starts soon" page, ask for a nickname and show the intro and the suspects.
2. Read the intro (READ ALOUD). Choose the game time (default 12 min) → **Start the investigation**.
3. Watch progress on the screen. **+2 min** if many people are close; **End now** stops everybody.
4. After the time: **Show the results** (who accused whom) → **Reveal the criminal** (story, explanation, fastest correct detectives).

Switching back to Persephone or the "starts soon" page is one click in the GAME bar; each switch starts the chosen game fresh.

## The puzzles (in this order)

| # | Puzzle | Mechanic | Evidence |
|---|---|---|---|
| 1 | Detective registration | Draw any one-line shape, then draw it again to confirm (≥85% match, otherwise start again). | — |
| 2 | The Throne Room lights | Memory: watch 3 symbols and repeat, then 5, then 7 (the first ones stay the same). 3 attempts. | 🥾 Muddy boot prints |
| 3 | The forensic droid | Match 6 descriptions to 8 things (2 decoys: lemon, moon; Vader is a trap for "best emperor"). One check. | 🍪 Cookie crumbs |
| 4 | The security terminal | Unlock pattern through the things starting with L: Lantern → Lightbulb → Lemon → Lollipop → Leaf (draws an L). 3 tries. Either direction counts. | 🧣 Cape fibers |
| 5 | MOP-3 has no power | Turn pipe pieces to connect the battery to the droid. No limit. | ✨ Everything perfectly straight |
| 6 | The Evidence Vault | Reproduce the signature from step 1, ≥90% match, 3 tries. | 📏 A long, straight scratch |

Every puzzle except registration has "Give up — lose this evidence", so nobody gets stuck.

**Signature threshold:** `SIGNATURE_THRESHOLD` in `.env` (default `0.9`). The score compares the shape after scaling and centring; size and position don't matter, drawing direction doesn't matter, but the start point and the shape do. A careful redraw scores ~92–99%, a sloppy one ~85–90%, a different shape under 40%. If people struggle at the event, set `0.85` and `docker compose up -d --force-recreate app`.

## The solution (private)

Culprit: **Royal Guard Rex**. Every innocent suspect misses at least two of the five clues, so **any 4 clues identify Rex**; with only 3 clues, two suspects can remain (e.g. boots + cookies + cape also fits Vader; cookies + tidy + pole also fits Tarkin).

| Suspect | 🥾 | 🍪 | 🧣 | 📏 | ✨ |
|---|---|---|---|---|---|
| Darth Vader | ✓ | ✓ | ✓ | | |
| Grand Moff Tarkin | | ✓ | | ✓ | ✓ |
| Stormtrooper Klynn | ✓ | ✓ | | | |
| **Royal Guard Rex** | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cleaning droid MOP-3 | | | | ✓ | ✓ |

All suspects show five traits on their card (extra traits like lightsaber, blaster, wheels never match a clue), so "most icons" gives nothing away. A lost puzzle never tells the player which evidence they lost.

## Images to generate (all optional)

Put JPEGs in `games/pumpkin/img/` with exactly these names; anything missing is simply not shown. 16:9 landscape unless noted, ~1600 px wide is plenty.

| File | What it shows | Used |
|---|---|---|
| `intro.jpg` | The Throne Room, the Emperor, a smashed carved pumpkin on the floor | Lobby (phone + screen) |
| `suspect-vader.jpg`, `suspect-tarkin.jpg`, `suspect-klynn.jpg`, `suspect-rex.jpg`, `suspect-mop3.jpg` | Portraits, **square** | Suspect cards |
| `puzzle-register.jpg` | A detective badge / ID scanner | Registration |
| `puzzle-lights.jpg` | Dark throne room, a glowing light panel | Memory |
| `puzzle-droid.jpg` | A forensic droid scanning the floor | Matching |
| `puzzle-terminal.jpg` | A locked security terminal | Pattern |
| `puzzle-mop3.jpg` | A powered-down cleaning droid with a broken cable | Pipes |
| `puzzle-vault.jpg` | An evidence vault door with a signature pad | Vault |
| `clue-mud.jpg`, `clue-cookie.jpg`, `clue-cape.jpg`, `clue-neat.jpg`, `clue-pole.jpg` | Close-ups: muddy boot prints · cookie crumbs · cape fibers on a table edge · perfectly aligned polished cups/candles · a long straight scratch on a table | Evidence cards (shown small, 4:3 crop) |
| `reveal.jpg` | Rex straightening the pumpkin a bit too much | Reveal |

After adding images: commit, `git pull && docker compose up -d --build` on the server.
