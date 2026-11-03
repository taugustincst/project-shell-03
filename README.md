# Mended (working title: Repair-Shop Tycoon)

**A cozy management game about a neighbourhood repair shop in a throwaway age.** Diagnose broken kettles, lamps, toasters, radios, bikes, consoles, phones and sewing machines; quote against replacement; order parts on lead times; train apprentices; build reputation street by street. Stay small and beloved, or become FixEmpire.

A paid download on Google Play: the whole three-year campaign, with no in-app purchases. No ads, no consumables, fully offline.

Status: **v1.0.0 draft built 2026-11-03**, not submitted. Brief and living log in [HANDOFF.md](HANDOFF.md); plan and verification in [tasks/todo.md](tasks/todo.md). Name and repo rename are Tj's call.

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
| `js/game.js` | UI, save, turn flow, test API (`window.__repairshop`). |
| `sim/sim.js` | Headless auto-player: `node sim/sim.js all 7 20` plays 20 campaigns per strategy and reports endings, cash and reputation. |
| `tests/engine.test.js`, `tests/smoke.js` | Engine unit tests and a Playwright smoke test of the real page over `file://`. |
| `tools/make-icons.js` | Icons and staged store screenshot via Chromium. |

```bash
node tests/engine.test.js && node sim/sim.js all 7 20 && npm install && node tests/smoke.js
```

Test API: `seed({week, cash, rep})`, `forceJob(cat, fault)`, `forceBeat(arc, beat)`, `endWeek()`, `finish(id)`, `reset()`.

Saves: `localStorage` key `mended.v1`, every field sanitized and clamped on load; an unreadable save is copied to `mended.v1.backup` and the game starts fresh.

## Balance (sim, seed 7, 20 runs each; week-6 balance pass still to do)
| Strategy | Year-1 busts | Campaign endings | Cash at end |
| --- | --- | --- | --- |
| Careful: three tests, fair prices, hires when the bench is full | 1/20 | 18 beloved, 2 bust | high |
| Hasty: one test, high prices, rush parts | 2/20 | 16 beloved, 4 bust | high |
| Cheap: undercharges, never hires | 20/20 | all bust | |
| Neglect: no tests, no parts | 20/20 | all bust | |

Known: late-campaign cash snowballs; endings other than "beloved" need more pull. Both are week-6 balance items.

## Publishing
A paid app on Google Play with the whole game packed inside it (`android/play`, see `PLAY.md`). Pages deploys only the store page from `main` (`site/index.html`, the privacy policy `privacy.html` and the store graphics), not the playable game. Store copy: `store/listing.md`.
