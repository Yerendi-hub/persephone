# The Pumpkin Case — host pack

Second game on the platform. Everybody plays **alone on their own phone**; the shared screen shows the clock, live progress and the reveal. Players enter a nickname when they join (kept for later games on the same evening).

## Running it

1. `/control` → **GAME: The Pumpkin Case**. Phones ask for a nickname, then show "Wait for the Great Pumpkin Investigation to begin…".
2. Read the intro (READ ALOUD). Choose the game time (default 12 min; the briefing counts too) → **Start the investigation**.
3. Each phone pages through a briefing: Emperor with the pumpkin → smashed pumpkin → you are the detective → "meet 5 suspects" → one page per suspect with photo, motive and trait symbols.
4. Puzzles, then the accusation. The page header shows the time left. **+2 min** if many people are close; **End now** (tap twice) stops everybody.
5. After the time: **Show the results** → **Reveal the criminal**. Phones then show their evidence next to the suspect cards, with matching symbols highlighted.

No browser pop-ups anywhere: risky buttons (give up, end, switch game) ask "tap again"; the accusation asks "Are you sure? ✓ ✗" on the card itself.

## The puzzles (in this order)

| # | Puzzle | Mechanic | Evidence |
|---|---|---|---|
| 1 | Your detective symbol | Draw any one-line shape. Currently drawn twice to confirm — set `confirmSymbol=false` in `games/pumpkin/content.mjs` to accept the first drawing. | — |
| 2 | The Throne Room lights | Memory: 3 symbols, then 4, then 5 (the first ones stay). 3 attempts. | 🥾 Muddy boot prints |
| 3 | The forensic droid | Two columns side by side: 6 descriptions, 8 things (decoys: lemon, moon; Vader is a trap). One check. Easiest puzzle → the weakest clue. | 🍪 Cookie crumbs |
| 4 | The security terminal | Unlock pattern through the L-things: Lantern → Lightbulb → Lemon → Lollipop → Leaf. 3 tries. | 🧣 Cape fibers |
| 5 | MOP-3 has no power | Board is blurred until **Ready**, then 10 seconds to connect battery and droid (`seconds` in content). One try. | ✨ Everything perfectly straight |
| 6 | The Evidence Vault | Draw the symbol from step 1. 3 tries. | 📏 A long, straight scratch |

**Symbol match:** 50% (`SIGNATURE_THRESHOLD`, default `0.5`; players never see the number). A different shape scores under 40%, the same shape drawn carelessly still passes.

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

## Images

In `games/pumpkin/img/` (missing files are simply not shown): `emperor` (lobby), `intro-pumpkin`, `intro-smashed`, `detective`, `who-guilty` (briefing; also the results screen), `suspect-vader|tarkin|klynn|rex|mop3`. Optional extras: `reveal`, `puzzle-register|lights|droid|terminal|mop3|vault`, `clue-mud|cookie|cape|neat|pole`.
