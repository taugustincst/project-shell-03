# HANDOFF — project-shell-03 — REPAIR-SHOP TYCOON

## Status: ASSIGNED 2026-11-02 — build priority #5 in the roster sequence (longest build; starts after 01/02 are moving)

Roster assignment by Folder at Tj's direction, from the 2026-11-02 Google Play niche research. This file is the build brief AND the living handoff. Keep it updated.

## 1. THE GAME — exactly what to make

**Fantasy:** You inherit a one-bench repair café on a ordinary street in a throwaway age. Every repair is a small vote against the landfill. Grow bench by bench and street by street — then choose what you became: the beloved local shop, or FixEmpire.

**Why this game:** Management/tycoon is a proven premium payer on Android — Game Dev Tycoon ~1.7M installs at 4.8 stars; even niche Kairosoft titles sell 70k–390k paid copies; Tiny Bookshop sold 500k+ copies in Aug–Dec 2025 with NO Android version until 2026. Almost every profession is claimed by Kairosoft or nobody. REPAIR is unclaimed, universally understood, and topical (right-to-repair, anti-waste). This has the largest proven paid ceiling on the roster — and the largest scope. Respect both facts.

**Core loop (one in-game week):**
1. Intake: customers bring broken items. Each job shows symptoms; you DIAGNOSE (light deduction: pick tests, each costs bench-time; a fault tree of at most 3 steps) or decline the job.
2. Quote: set price and promised day, against the item's replacement cost and the customer's attachment to it (sentimental items tolerate more).
3. Parts: order from suppliers with different lead times, prices, and quality. Stock common parts ahead or pay rush fees.
4. Repair: assign jobs to benches/staff; choose fix quality vs speed per job.
5. Outcomes: reputation per street block rises/falls with honesty, quality, and deadlines kept. Cash pays rent, benches, wages.
6. Growth: hire and train apprentices (skills per item category), unlock new item categories, expand to new blocks. Seasonal story customers (12 authored arcs) carry the heart and the ending choice.

**Content targets (v1.0):**
- 8 item categories: radio, bicycle, kettle, toaster, lamp, games console, phone, sewing machine. Each: fault table (8–12 faults), parts list, sentimental-value range.
- 3 suppliers, 4 staff roles/skill tracks, 5 street blocks, full 3-year campaign with an ending choice, then endless mode.
- 12 authored story-customer arcs.

**SCOPE GUARDRAIL (hard):** everything is shallow-but-wide DATA TABLES. Diagnosis is a decision tree, never an electronics simulation. If a feature is not expressible as rows in a table, it waits for v1.1. Feature list freezes at end of week 2; additions after that are FOR TJ decisions.

## 2. BUILD SPEC

- Vanilla HTML5/CSS/JS, no framework, no build step. Static files, GitHub Pages deploy from this repo (pattern: taugustincst/bubblepop, taugustincst/ironhold).
- Fully offline. Zero network calls, zero analytics, zero ads, zero accounts.
- Economy simulation harness: a headless auto-player that runs full 3-year campaigns and reports cash/reputation curves — balance from data, not vibes.
- Saves: localStorage, versioned key, sanitizer on load, fail-soft (Ironhold lesson).
- Expose a `window.__repairshop` test API (seed week/money/reputation, force job/story beat) for staged screenshots and sim runs.
- Portrait-first, one-handed, large-text option, colourblind-safe, no twitch input. Flat icons/menus/grids only. Under 4 MB.

## 3. MONETIZATION — exact

- Google Play: FREE app. The first in-game year is free and complete (story arcs included). One non-consumable `full_unlock` at **$4.99** opens years 2–3, all blocks, and endless mode. Restore purchases supported.
- No ads, no consumables, nothing else sold. Ever.

## 4. HOW IT SUCCEEDS — the launch playbook

- Store copy leads with the profession fantasy ("Run your own repair shop") — profession searches are how this audience finds games. Short description: features only, NEVER price/promo wording (Play flags it, limits featuring — Ironhold lesson).
- Screenshots: real staged weeks via the test API. Shot 1 = a busy bench with a diagnosis in progress. Captions state content ("8 repair trades · 3-year story"), not price claims.
- Declarations: IARC; audience 13-15 / 16-17 / 18+; Data safety = none collected/shared; privacy policy at this repo's Pages site (privacy.html); contact elderon@augustinnovations.io.
- Process: internal draft → declarations → production → Folder expert review → submission only on Tj's explicit approval.
- Post-launch: reply to every review for 30 days; v1.1 inside 30 days from review themes (roster-wide promise from Ironhold's listing).
- SUCCESS TARGETS (90 days): 20,000 free installs; unlock conversion at or above 3%; rating at or above 4.5 stars.
- KILL/PIVOT RULE: if the sim harness shows the first year cannot be both beatable and losable (money spiral either way) after week 6's balance pass, cut categories from 8 to 6 and re-balance rather than shipping a broken economy. A tycoon with a dead economy gets refunded and one-starred.

## 5. BUILD ORDER (6–8 weeks)

- Weeks 1–2: Economy core (intake → diagnose → quote → parts → repair → reputation) with 2 categories. FEATURE FREEZE at end of week 2.
- Weeks 3–4: All 8 categories as data; staff/apprentices; suppliers.
- Week 5: Blocks, 3-year campaign, story arcs, ending choice.
- Week 6: Sim-harness balance pass (sacred — no features).
- Week 7: Polish, large-text/accessibility pass, save hardening.
- Week 8: Store pack, expert review, submission prep.

## 6. COORDINATION RULES

- Tj decides scope, names, spending, submissions, and anything irreversible. Everything else, the working agent owns end to end.
- Log entries dated and appended below, newest last. Items needing Tj are marked FOR TJ.
- Verify live state before asserting. No prices on marketing websites. Passwords/signing keys are Tj's alone, secure forms only, Elderon-pattern keystore handling.

## Log

- **2026-10-28** — Shell created (README.md + this HANDOFF.md). Awaiting project assignment from Tj.
- **2026-11-02** — ASSIGNED: Repair-Shop Tycoon (roster #3). Full build brief installed above by Folder. Build priority #5 in the roster sequence.
- **2026-11-02** — GitHub Pages ENABLED (workflow deploy, standard static workflow added at .github/workflows/pages.yml). Site: https://taugustincst.github.io/project-shell-03/ — until the game is built, this serves the repo files (README/HANDOFF); the shipped game + privacy.html deploy from this same root.
- **2026-11-03** — **v1.0.0 DRAFT BUILT** as "Mended" (working title; FOR TJ). Full loop per §1 as data tables: 8 trades / 79 faults with a 3-test decision tree (validator proves every fault isolatable from every symptom), 3 suppliers, 4 staff roles with per-trade skills, 5 blocks with reputation, 13 story arcs × 3 beats, 156-week campaign, three endings (beloved / FixEmpire / bust) and endless. Turn-based weeks; free year one with a soft gate at week 52; `full_unlock` via Digital Goods API; sanitized fail-soft save; `window.__repairshop` test API; PWA + icons + privacy.html; engine tests (12), diagnosability validator, economy sim (`node sim/sim.js all 7 20`: careful play busts 1/20 in year one and reaches an ending 18/20; undercharging or neglect busts 20/20, so year one is beatable and losable per §4's kill rule), Playwright smoke test (21 checks); CI + Pages workflows; store copy draft; tasks/todo.md and tasks/lessons.md per Tj's build guidelines. Known balance items for the week-6 pass: cash snowballs in years 2–3; the FixEmpire path needs more pull than "beloved".
  - **FOR TJ:** (1) Title: "Mended" is a working title; the research placeholder "Fix-It Felix" is a Disney mark and must not ship. (2) Pages is already enabled by Folder; the game is live at https://taugustincst.github.io/project-shell-03/ once main deploys. (3) Play Console app, package name (suggest `com.taugustincst.mended`), `full_unlock` at $4.99, upload keystore. (4) Web build is gated at week 52 like Play (`?dev=1` unlocks for testing); decide whether the browser version should be fully open.
  - **Next (agent):** Android TWA wrapper from Ironhold; week-6 balance pass; phone playtest of week one; staged screenshots; expert review; submission prep.
- **2026-11-03** — Tj confirmed the title: **Mended** ships as the name (FOR TJ title item resolved). Landing page on taugustincst.github.io lists it.
- **2026-11-03** — Roster-level handoff for Folder (all eight games, decisions, open items, lessons): https://github.com/taugustincst/taugustincst.github.io/blob/main/ROSTER-HANDOFF.md
- **2026-11-02 — FOR CLAUDE: EVALUATION FIX LIST (Folder's expert review, 2026-11-02). Overall 7/10 — ship after fixes. Full report filed in this repo at EVALUATION-2026-11-02.md. Work in this priority order and log closures here.**
  - P1-1 WEEK-6 BALANCE PASS, LATE-GAME SINKS: years 2–3 snowball (average end cash 169k–244k, reputation pinned ~100, all sinks capped by ~week 143 — the final third has no money tension). Scale rent/wages with blocks and staff seniority; add at least one repeatable sink (master training, block refits, story expenses). Acceptance: sim careful end cash lands in the low tens of thousands and reputation can still be lost late.
  - P1-2 MAKE DIAGNOSIS PAY: hasty play (1 test, high prices, quick fixes) currently beats careful diagnosis on average end cash (220,714 vs 204,595) — the marketed core skill is the weaker strategy. Raise misdiagnosis cost (reputation hit scaled by customer attachment), deepen the quick-mode quality penalty / returns rate, let 3-test certainty unlock premium pricing tolerance. Acceptance: across 30 sim runs, careful beats hasty on BOTH average end cash and reputation.
  - P2-3 FIX THE SIM BOT FIRST: the careful strategy guesses randomly among post-test candidates (misdiag ~595/run), which masks P1-2's measurement. Make it pick the most-likely candidate deterministically, then re-baseline before the balance pass.
  - P2-4 STORE PACK: short description is 83 chars (over Play's 80 limit, despite the file claiming 80) — fix; produce the 1024x500 feature graphic and 4+ staged screenshots via window.__repairshop (shot 1 = diagnosis in progress); listing header still says "working title" although the title is confirmed as Mended — update it; caption says "two endings," there are three.
  - P2-5 BILLING LEFTOVERS: js/billing.js global is KTL_BILLING and the fallback label reads "The rest of the century" (Keep the Light's). Rename to Mended's own.
  - P3-6 FixEmpire ending has threshold availability but no narrative pull (story arcs lean beloved) — give the empire path authored beats or record the imbalance as accepted. Also clean up the capacityHours() kettle-skill proxy hack.

- **2026-11-03** — Claude (for Taylor's "package all 8"): Google Play edition added on branch `play/package`: `android/play` (Trusted Web Activity, package `com.taugustincst.mended`), build and launch checks (`android.yml`), signed-bundle workflow (`release.yml`), store graphics in `store/`, and `PLAY.md` with the submission steps that need Taylor's accounts. Also fixed: purchases were never acknowledged (Play refunds them after three days), so `js/billing.js` now reports each token to the acknowledgement service with a retry queue; `?dev=1` limited to local copies; billing global renamed to this game's own; privacy page and data safety updated for the purchase report. Folder's evaluation fixes are untouched and still come first.

- **2026-11-03** — Claude (for Taylor: "None of the games should be free"): the game is now a paid download, $4.99 on Play, with no in-app purchases. The free-to-try gate, the `full_unlock` purchase, `js/billing.js` and the `?dev=1` unlock are removed: every save loads fully open, and old saves stopped at the gate carry on. Section 3 (monetization) above is superseded. `android/play` is now a WebView app with the whole game packed inside the APK (WebViewAssetLoader, no internet permission) instead of a Trusted Web Activity, and `tools/launch-test.sh` fails unless the game loads with no script errors. The website becomes a store page (`site/index.html`, built from `store/listing.md`) that links to Play; merging `play/package` takes the free web copy down at once. `PLAY.md` lists the Console steps.

- **2026-11-09** — Claude (for Taylor's "Free with paid unlock" decision, replacing the 3 Nov paid download): **v1.1.0**. Free to install; the first year and two streets are free, and one non-consumable `full_unlock` at $4.99 (Play Billing 8, `android/play/.../PlayBilling.java`, `js/billing.js`) opens years two and three, all five streets, the endings and endless mode. At the end of week 52 the shop is held, saved, with the unlock sheet; buying carries the same shop into week 53. A save never carries the unlock. Folder's fix list, closed: **P1-1** (rent rises by year and per street, raises with seniority, VAT past £50k a year, a landlord's share of big weeks, reputation fades above 70; careful end cash about £33k, coasting late loses reputation), **P1-2** (misdiagnosis costs reputation by attachment, quick fixes capped and returned more, a sure diagnosis earns a better price; careful beats hasty on cash and reputation over 30 runs on two seed batches, hasty busts in years two and three), **P2-3** (the bot picks the most likely fault; `node sim/sim.js check` is a CI gate), **P2-4** (short description 80 characters, "working title" gone, three endings, screenshot 1 is a diagnosis in progress; feature graphic not redone), **P2-5** (moot: billing.js is fresh), **P3-6** (backing from the investor, council or hospital opens FixEmpire at three streets and four staff; the capacityHours proxy now uses average skill). CI: engine tests, balance check, smoke test with a Play bridge stand-in, Android 9 and 14 launch tests and an emulator tap-through.
  - **FOR TAYLOR:** the upload-key secrets in this repo; the Console app as Free (see PLAY.md if it was made as Paid); the `full_unlock` product at $4.99; the data safety purchase questions (not checked against the live form); a phone playtest of year one and the unlock.
