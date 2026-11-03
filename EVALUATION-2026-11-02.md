# Evaluation — Shell 03: Repair-Shop Tycoon ("Mended")

Evaluator: Folder (expert review) · Date: 2026-11-02 · Build audited: v1.0.0 draft, repo `taugustincst/project-shell-03`
Brief source: `HANDOFF.md` in the repo. Method: full code/data audit, the repo's own engine tests, Playwright smoke test, and its economy sim harness run locally.

## Scores

| Dimension | Score /10 |
|---|---|
| Brief compliance | 9 |
| Gameplay / design | 7 |
| Economy / balance evidence | 6 |
| Polish / presentation | 6 |
| UX / accessibility | 8 |
| Technical quality | 9 |
| Store readiness | 6 |
| **Overall** | **7** |

**Verdict: Ship after fixes** — the game is complete and structurally sound; it needs its scheduled week-6 balance pass and a finished store pack, not a rework.

## Test & sim results (actually run)

- **Engine tests (`node tests/engine.test.js`): 12/12 PASS** — diagnosability validator (every fault isolatable within 3 tests from every symptom), content floors, seeded determinism, quote ceiling refusal, misdiagnosis consequences, supplier lead times, week-52 gate + week-156 ending, bankruptcy after 3 debt weeks, story beat ordering/effects, save sanitize round-trip, hiring/training bounds.
- **Smoke test (`node tests/smoke.js`, Playwright, 360×640 touch viewport): 20/20 PASS** — full UI loop (test → diagnose → quote → assign → parts → end week → story beat → gate → unlock → save reload → three mangled-save loads → ending → endless), zero page/console errors. (Required `npm install` of the playwright devDependency plus an existing Chromium; it does not run from a bare checkout.)
- **Economy sim (`node sim/sim.js`), verbatim headline output, seed batch 7, 20 runs/strategy:**
  - `careful  endings={"beloved":18,"bust":2} bustInYear1=1/20 avgCashY1=£2779 avgCashEnd=£204595 avgRepHollow=94 fixed/run=2862 misdiag/run=595`
  - `hasty    endings={"beloved":16,"bust":4} bustInYear1=2/20 avgCashY1=£4044 avgCashEnd=£220714 avgRepHollow=89 fixed/run=2660 misdiag/run=542`
  - `cheap    endings={"bust":20} bustInYear1=20/20 avgCashY1=£-750 …`
  - `neglect  endings={"bust":20} bustInYear1=20/20 avgCashY1=£-741 …`
  - Second batch (seeds 1000+, 30 runs) reproduced the pattern: careful 24 beloved / 6 bust (0 busts in year 1), hasty 23/7, cheap and neglect 30/30 bust.
- **Kill/pivot rule (§4 of brief): NOT triggered.** Year one is both beatable (careful play busts only 0–1 times in year 1 across 50 runs, and reaches year-end with ~£1.8k–£2.8k average cash) and losable (undercharging or neglect busts 100% of runs; even careful play can bust over the full campaign). No category cut is warranted.

## Brief compliance — content audit (counted from `js/data.js` via the engine)

| Brief floor | Actual | ✓ |
|---|---|---|
| 8 item categories | 8 (kettle, lamp, toaster, radio, bike, console, phone, sewing) | ✓ |
| Fault table 8–12 per category | 9–12 per category, **79 faults total** | ✓ |
| 3 suppliers differing in lead time / price / quality | bulk (3wk, ×0.7, q0.85), std (1wk, ×1.0, q1.0), rush (0wk, ×1.7, q1.05) | ✓ |
| 4 staff roles / skill tracks | apprentice, technician, front-of-house, master; per-trade skill levels, training, learning rates | ✓ |
| 5 street blocks with per-block reputation | 5 (hollow, market, estate, station, hill), adjacency-gated expansion, per-block rent and rep drift | ✓ |
| 3-year campaign + ending choice + endless | 156 weeks; endings beloved / FixEmpire / bust; endless after a non-bust ending | ✓ |
| 12 authored story arcs | **13 arcs × 3 beats** (39 beats), with flags and mechanical effects | ✓ |
| Diagnosis ≤ 3-step decision tree | 4 tests exist per trade; `MAX_TESTS` = 3 enforced; validator proves isolability | ✓ |
| Sim harness required | `sim/sim.js`, 4 strategies, full-campaign auto-play with cash/rep curves | ✓ |
| Scope guardrail (shallow-but-wide tables) | Respected — faults/suppliers/roles/arcs are all data rows in `js/data.js`; no simulation creep found | ✓ |

Small compliance nits: the "beloved" ending keys only on home-block (Hollow) reputation ≥ 70 (`endingOptions`, `js/engine.js:202`), and FixEmpire requires ≥4 blocks + ≥5 staff — both reachable, but the empire path has little narrative pull (the handoff log admits this). The free-year gate also quietly caps block openings at 2 in year 1 (`openBlock`), which matches the unlock promise in the listing.

## Gameplay / design

The weekly loop is complete and in the brief's exact order: intake with symptoms → paid tests that narrow a candidate set (the diagnosis UI genuinely shows test outcomes narrowing faults) → quote against a willingness model driven by replacement cost × sentimental attachment × block reputation (`willingness()`, engine.js:90) with refusal consequences → parts ordering against three meaningfully different suppliers → bench assignment with per-staff trade skills → quick-vs-careful repair mode → returns/refunds for shoddy work, weekly ledger, rent + wages, reputation drift. Every verb in the brief exists and is wired to consequences. Turn-based weeks suit one-handed portrait play.

Design weakness (evidence in the sim section): the loop's *stated* core skill — careful diagnosis — is not its *optimal* strategy (Defect 2). Also, once staff caps at 9 and all 5 blocks open (around week 143 on the careful curve), the final stretch of the campaign has few remaining decisions.

## Economy / balance judgement

Year 1 is a real economy: £1,500 start, weekly rent + wages, parts float, and refusal/return risks produce genuine tension — proven losable and winnable above. Years 2–3 are not: the careful curve goes £9.5k (w78) → £28k (w91) → £188k (w156), reputation pins at ~100, and there is no sink sized for late-game income (benches/staff/blocks all cap out). Average end cash across strategies and seed batches is £169k–£244k — money stops being a resource for roughly the final third of the campaign. This matches the handoff log's own "known balance items," but it is un-fixed in this build. Separately, the sim's `misdiag/run` (~500–600) reflects the bot guessing randomly among post-test candidates, not player behaviour; the harness would be more decision-useful if its careful strategy picked the most-likely candidate deterministically.

## Monetization

Implemented as briefed, in web form: free through week 52 with a soft gate modal, one non-consumable `full_unlock` via the Digital Goods API / Play Billing (`js/billing.js`), restore via `listPurchases()`, unlock state persisted in save meta and surviving reload (smoke-verified). In a plain browser it degrades honestly — explains itself and stays locked — and `?dev=1` unlocks for testing (flagged FOR TJ in the handoff). No ads, no consumables, nothing else sold. Defect: `billing.js` is copied from Keep the Light (shell-04) — the exported global is `KTL_BILLING` and the fallback purchase label reads **"The rest of the century"**, a lighthouse-game string. Functionally harmless (game.js imports it consistently), but it is exactly the kind of residue an expert review exists to catch.

## Technical quality

Exemplary for a draft. Vanilla HTML5/JS, no framework, no build step; whole repo ~315 KB of files (well under the 4 MB budget); one deterministic seeded engine (`js/engine.js`) shared by the game, the sim, and the tests. Save hardening is the real Ironhold lesson applied: versioned key `mended.v1` plus a backup key, and a field-level `sanitize()` (engine.js:231+) that clamps/validates every job, staff, rep and flag field — garbage saves load fail-soft, proven by three mangled-save smoke cases. Test API `window.__repairshop` is complete (state, engine handle, seed, forceBeat, unlock, save, endWeek). Offline story is clean: service worker precaches assets; grep finds **zero** analytics/ads/accounts/network calls in game code (the only `fetch` is the SW's same-origin cache handler). CI workflow present. Minor: `capacityHours()` uses the kettle skill as a global proxy (`skillMult(st,'kettle')`) — a documented hack waiting to confuse a future balance pass.

## UX / accessibility

Portrait-first tab UI (Counter / Bench / Parts / Shop / Story) with ≥44px tab targets, badged attention states, and a weekly ledger modal. Large-text (19px root) and high-contrast modes exist as persisted settings toggles — brief asked for large text; contrast is a bonus. No twitch input anywhere; all diagnosis information is tap-readable (no hover-only content). Not verified: colourblind-specific encoding (reputation/quality rely partly on colour), and no real-device or real-user playtest is recorded — the smoke test is scripted, not human.

## Store readiness

`store/listing.md` is a strong draft: profession-led copy, content claims accurate (8 trades / 79 faults / 13 arcs), declarations sketched, contact email correct. Gaps: (1) the short description is **83 characters — over Play's 80 limit**, despite the file's own "(80)" label; (2) **no 1024×500 feature graphic** anywhere in the repo; (3) only **one** screenshot (`icons/screenshot-portrait.png`, 720×1280) — Play needs at least two, and the brief wants shot 1 to be a diagnosis in progress; (4) the listing header still says "(working title)" / "Title is FOR TJ" although the handoff log records Tj confirming "Mended" — stale paperwork; (5) caption 4 says "two endings" (there are three, two of them chosen); (6) no Android/TWA wrapper or Play app exists yet (listed as the agent's own next step). Rating: a good draft pack, roughly 60% of a submittable one.

## Ranked defects

1. **Years 2–3 economy snowballs** — avg end cash £169k–£244k, rep saturated ~100, all growth sinks capped by ~week 143; the final third of the 156-week campaign has no money tension. (Sim curves; admitted in handoff.)
2. **Hasty play dominates careful play** — 1 test, high prices, quick fixes ends richer than careful diagnosis (£220,714 vs £204,595 avg; one hasty run £378,860 with £22,655 banked by week 52 vs careful's £1,816). Returns (−50% refund, −3 rep) and the −0.15 quick-mode quality penalty are too weak. This undercuts the game's marketed core: "Diagnose, don't guess."
3. **Store pack incomplete** — no feature graphic, one screenshot, 83-char short description, stale "working title" header.
4. **Copy-paste residue in billing.js** — `KTL_BILLING` global and "The rest of the century" fallback label from Keep the Light.
5. **FixEmpire ending under-built** — threshold-only availability, no narrative pull toward it; the sim never selects it and the story arcs lean beloved. (Also admitted in handoff.)
6. **Sim harness blind spot** — the careful bot guesses randomly among remaining candidates, inflating misdiagnosis counts (~595/run) and masking whether *informed* diagnosis is properly rewarded; fix the bot before trusting it for the week-6 pass.
7. **Minor code smell** — `capacityHours` kettle-skill proxy; listing caption "two endings."

## Top 3 fixes (in order)

1. **Week-6 balance pass, late-game sinks:** scale rent/wages with blocks and staff seniority in years 2–3, add at least one repeatable sink (master training costs, block refits, story-driven expenses), and re-run the sim until careful end cash lands in the low tens of thousands and reputation can still be lost late.
2. **Make diagnosis pay:** raise the cost of guessing (misdiagnosis already wastes parts/hours — extend it to a reputation hit scaled by attachment), deepen the quick-mode quality penalty or returns rate, and make 3-test certainty unlock premium pricing tolerance. Acceptance test: in the sim, careful must beat hasty on average end cash *and* reputation across 30 runs.
3. **Finish the store pack:** fix the short description to ≤80 chars, produce the 1024×500 feature graphic and ≥4 staged screenshots via `__repairshop` (shot 1 = diagnosis in progress), update the listing header to the confirmed title "Mended," and rename the billing module/labels to Mended's own.

## Bottom line

Claude built the brief — all of it, measurably. The structure, content volume, save hardening, and test discipline are release-grade; the economy's back half and the store pack are not yet. **Overall 7/10 — ship after the balance pass and store-pack completion above.**
