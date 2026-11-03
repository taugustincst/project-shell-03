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
