# The Pumpkin Case — host pack

Second game on the platform. Everybody plays **alone on their own phone**; the shared screen shows the clock, live progress and the reveal. Players enter a nickname when they join (kept for later games on the same evening).

## Running it

1. `/control` → **GAME: The Pumpkin Case**. Phones ask for a nickname, then show "Wait for the Great Pumpkin Investigation to begin…".
2. **Start the briefing.** You page through it with Back/Next; phones and the screen follow you and the clock is not running. Pages: Emperor with the pumpkin → smashed pumpkin → you are the detective → "meet 5 suspects" → one page per suspect (photo, motive, trait symbols). READ ALOUD shows the text of each page.
3. On the last page: **Start the investigation** — now everybody plays alone for **5 minutes** (time shown in the page header). **+2 min** if needed; **End now** (tap twice) stops everybody.
4. Players who already accused (and everybody after the time is up) get a waiting game: Vader runs, tap to jump over pumpkins and collect cookies to fill his belly.
5. **Show the results** → **Reveal the criminal**. Phones then show their evidence next to the suspect cards, with matching symbols highlighted.

No browser pop-ups anywhere: risky buttons (give up, end, switch game) ask "tap again"; the accusation asks "Are you sure? ✓ ✗" on the card itself.

## The puzzles (in this order)

| # | Puzzle | Mechanic | Evidence |
|---|---|---|---|
| 1 | Your detective symbol | Draw any one-line shape. Currently drawn twice to confirm — set `confirmSymbol=false` in `games/pumpkin/content.mjs` to accept the first drawing. | — |
| 2 | The Throne Room lights | Memory: 3 symbols, then 4, then 5 (the first ones stay). 3 attempts. | 🥾 Muddy boot prints |
| 3 | The forensic droid | Two columns side by side: 6 descriptions, 8 things (decoys: lemon, moon; Vader is a trap). One check. Easiest puzzle → the weakest clue. | 🍪 Cookie crumbs |
| 4 | The security terminal | "Find the pattern and connect the symbols." No hint in the text; the answer is the things starting with L (Lantern → Lightbulb → Lemon → Lollipop → Leaf), which draws an L. 3 tries. | 🧣 Cape fibers |
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
