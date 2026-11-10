# Mended — build plan (v1.0.0 draft)

## Content targets (HANDOFF §1)
- [x] 8 item categories, each with 8–12 faults, parts list, sentimental range (79 faults)
- [x] Diagnosis as a decision tree: symptom + up to 3 tests, validator proves every fault isolatable
- [x] 3 suppliers with lead time, price and quality
- [x] 4 staff roles / skill tracks, training on the job and by course
- [x] 5 street blocks with reputation, rent, adjacency
- [x] 3-year campaign (156 weeks), ending choice (beloved / empire / bust), endless mode
- [x] 12+ authored story-customer arcs (13 × 3 beats)
- [x] Scope guardrail: everything is data tables; no simulation beyond a decision tree

## Spec (HANDOFF §2)
- [x] Vanilla HTML/CSS/JS, no build step, fully offline, no network/analytics/ads/accounts
- [x] Economy sim harness (`sim/sim.js`) with four strategies, reports endings and curves
- [x] Versioned, sanitized, fail-soft localStorage save (`mended.v1`, backup on parse failure)
- [x] `window.__repairshop` test API (seed week/cash/rep, force job, force beat, end week, finish)
- [x] Portrait-first, one-handed, large-text and high-contrast options, meaning never in colour alone, no twitch
- [x] Under 4 MB (≈ 150 KB plus icons)

## Monetization (HANDOFF §3)
- [x] Paid download (2026-11-03): the whole campaign is open from week 1; the year-one gate, Play Billing and restore were removed
- [x] Nothing sold inside the game; no ads

## Tests and verification
- [x] Engine unit tests: 12 passing (`node tests/engine.test.js`)
- [x] Diagnosability validator: 0 problems
- [x] Sim: year one beatable (careful 1/20 busts) and losable (cheap/neglect 20/20)
- [x] Playwright smoke test over file://: 21 checks passing
- [x] CI workflow runs all three; Pages workflow on main

## Store pack
- [x] Icons, maskable icon, staged screenshot via test API
- [x] privacy.html, store/listing.md draft (features only, no price wording)
- [ ] Android TWA project (Ironhold pattern) — next
- [ ] Week-6 balance pass from sim data (late-game cash snowball; make FixEmpire path competitive)
- [ ] Expert review, submission prep (Tj approval)

## Review
Built the complete loop the brief describes, as data tables: intake → tests → diagnosis → quote → parts → bench → outcomes → reputation → growth → story → ending. Verified locally: 12 engine tests, the diagnosability validator (0 problems), 80 simulated campaigns across four strategies, and a 21-check browser smoke test, all passing. Open items are the Android wrapper, the sacred balance week, and Tj's naming/Pages/Play Console decisions (logged FOR TJ in HANDOFF.md).

## v1.1.0 (2026-11-09): free with a paid unlock, and Folder's evaluation fixes
- [x] Free to install; the first year (52 weeks) and two streets are free; `full_unlock` ($4.99, Play Billing 8 via `PlayBilling.java` and `js/billing.js`) opens years two and three, all five streets, the endings and endless mode. At the end of week 52 the shop is held, saved, until the unlock; buying carries the same shop into week 53. A save never carries the unlock.
- [x] P1-1 late-game money: rent rises by year and per street, raises with seniority, VAT past £50,000 a year, a landlord's share of big weeks, reputation fading above 70. Careful ends with about £33k (was £200k+); coasting from week 105 loses reputation.
- [x] P1-2 diagnosis pays: misdiagnosis costs reputation by attachment and a week, quick fixes capped below top quality and returned more, a better price when the fault is named for sure. Careful beats hasty on cash and reputation; hasty goes bust in years two and three.
- [x] P2-3 sim bot picks the most likely fault; balance gate (`node sim/sim.js check`) in CI on two seed batches
- [x] P2-4 short description 80 characters, "working title" gone, caption says three endings, screenshot 1 is a diagnosis in progress (the feature graphic is unchanged)
- [x] P2-5 billing leftovers: moot, `js/billing.js` is fresh and shared with Open Stall
- [x] P3-6 FixEmpire: backing from the investor, the council or the hospital lowers it to three streets and four staff; `capacityHours` uses the staff's average skill
- [x] Tests: engine 18/18, smoke (Play bridge stand-in) all passing, emulator tap-through script (real taps) passing locally against a stand-in device
- [ ] Phone playtest of year one and the unlock (Taylor)
