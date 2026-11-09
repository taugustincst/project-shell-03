# Mended

**A cozy management game about a neighbourhood repair shop in a throwaway age.** Diagnose broken kettles, lamps, toasters, radios, bikes, consoles, phones and sewing machines; quote against replacement; order parts on lead times; train apprentices; build reputation street by street. Stay small and beloved, or become FixEmpire.

Free to install on Google Play. The first year on Hollow Lane is free and complete, with two streets and the first chapters of all thirteen stories. One in-app purchase, `full_unlock` at $4.99, opens years two and three, all five streets, the endings and endless mode. No ads, no consumables, nothing else to buy, fully offline.

Status: **v1.1.0, 2026-11-09**, not submitted. Folder's evaluation fixes are in (late-game money, diagnosis that pays, the store pack). Brief and living log in [HANDOFF.md](HANDOFF.md); plan and verification in [tasks/todo.md](tasks/todo.md).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game
- **Turn-based weeks.** Each week: customers at the counter (diagnose with up to three tests, name the fault, quote a price and a promise, or decline), the bench (assign staff, choose careful or quick), parts (three suppliers: cheap and slow, standard, same-day rush), the shop (hire four roles, train skills per trade, build benches, learn trades, open street blocks).
- **8 trades, 79 faults**, each a short decision tree. Every fault is provably isolatable within three tests from every symptom it can present with (`validateDiagnosis`, run in CI).
- **5 street blocks** with their own reputation, rent and customer mix; **13 story customers** with three beats each across the three-year campaign; **three endings** (The Shop on Hollow Lane, FixEmpire, Closing Time) and endless mode.
- Economy that is both beatable and losable in year one (the brief's kill rule): careful play survives, undercharging or neglect goes bust.

## Code
No build step, no runtime dependencies.

| File | What |
| --- | --- |
| `js/data.js` | All content tables: parts, categories and faults, suppliers, roles, blocks, story arcs, endings. |
| `js/engine.js` | Pure, deterministic (seeded) economy engine. Runs in Node and the browser. Includes the save sanitizer and the diagnosability validator. |
| `js/game.js` | UI, save, turn flow, the unlock sheet, test API (`window.__repairshop`). |
| `js/billing.js` | The one-time unlock through Google Play (the Play app's `AndroidBilling` bridge, `android/play/.../PlayBilling.java`). Outside the Play app the unlock shows as unavailable. |
| `sim/sim.js` | Headless auto-player: `node sim/sim.js all 7 20` plays 20 campaigns per strategy (unlocked) and reports endings, cash and reputation; `node sim/sim.js check 7 30` is the balance gate CI runs. |
| `tests/engine.test.js`, `tests/smoke.js` | Engine unit tests and a Playwright smoke test of the real page over `file://`, with a stand-in for the Play billing bridge. |
| `tools/tap-through.js` | Real taps on an emulator against a debug build of the Play edition (CI's Android workflow). |
| `tools/make-icons.js` | Icons and staged store screenshot via Chromium. |

```bash
node tests/engine.test.js && npm run balance && npm ci && node tests/smoke.js
```

Test API: `seed({week, cash, rep})`, `forceJob(cat, fault)`, `forceBeat(arc, beat)`, `endWeek()`, `finish(id)`, `reset()`.

Saves: `localStorage` key `mended.v1`, every field sanitized and clamped on load; an unreadable save is copied to `mended.v1.backup` and the game starts fresh. A save never carries the unlock: only Google Play's answer does, cached under `mended.unlock`. At the end of week 52 without the unlock the shop is held, saved, at week 52; the unlock carries it into week 53 with the same cash, staff and streets.

## Balance (sim, seed 7, 30 runs each, unlocked; Folder's week-6 pass done 2026-11-09)
| Strategy | Year-1 busts | Campaign endings | Avg cash at end | Hollow Lane rep |
| --- | --- | --- | --- | --- |
| Careful: tests until sure, the most likely fault, fair prices, hires it can pay for | 5/30 | 24 beloved, 6 bust | £33,514 | 92 |
| Coast: careful, then hasty from week 105 | 5/30 | 23 beloved, 1 FixEmpire, 6 bust | £26,649 | 79 |
| Hasty: one test, high prices, quick fixes, rush parts | 1/30 | 30 bust | −£3,846 | 44 |
| Cheap: undercharges, never hires | 30/30 | all bust | | |
| Neglect: no tests, no parts | 30/30 | all bust | | |

What makes it so: running costs that grow (rent rises in years two and three and per street, raises with seniority, VAT once a year's takings pass £50,000, a landlord's share of big weeks), reputation that fades above 70 and grows slower near the top, a misdiagnosis that costs reputation by how much the customer cared, quick fixes capped below top quality, and a better price when the fault is named for sure. Hasty shops survive year one but cannot carry the year-two costs. CI fails if careful stops beating hasty on cash or reputation, if year one stops being both beatable and losable, if careful's end cash leaves £8k to £60k, or if coasting late stops costing reputation.

## Publishing
A free app on Google Play with the whole game packed inside it and one in-app purchase (`android/play`, see `PLAY.md`). Pages deploys only the store page from `main` (`site/index.html`, the privacy policy `privacy.html` and the store graphics), not the playable game. Store copy: `store/listing.md`.
