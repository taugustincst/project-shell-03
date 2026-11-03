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
