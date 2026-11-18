# itch.io page — Mended

A draft for an itch.io page that hosts the free web part of the game and points
to the full game on Google Play. Nothing here is published; the steps below are
for Taylor to follow by hand.

The zip is built with the marketing tools, outside this repo:
`python3 tools/itch_pack.py <this repo> mended-itch.zip` (index.html at the
root, plus `js/`, `icons/`, the stylesheet and the manifest; nothing from
`android/`, `tests/`, `sim/`, `tools/` or `store/`). In a plain browser the
build plays the first year on Hollow Lane and shows years two and three as
part of the Google Play edition, so the itch page works as a free demo.

## Upload

1. https://itch.io/game/new (a free account; verify the email first).
2. **Kind of project:** HTML. Upload `mended-itch.zip` and tick
   **This file will be played in the browser**.
3. **Embed options:** viewport **360 × 640** (portrait); tick **Mobile
   friendly** (orientation: portrait) and **Fullscreen button**. Leave
   *Automatically start on page load* on. SharedArrayBuffer: off (not used).
4. **Pricing:** *No payments* (a free web demo; the full game is on Google Play).
5. **Visibility:** *Draft* until the page below is filled, then *Public*.

## Page

**Title** (the project name)

    Mended

**Short description or tagline** (the line under the title)

    A cozy repair shop tycoon. Diagnose the fault, quote against the price of a new one, order the parts, and win a street's trust.

**Classification:** Games · **Kind of project:** HTML

**Genre:** Simulation (also Strategy)

**Tags** (ten at most; itch's own vocabulary)

    Management, Tycoon, Simulation, Cozy, Turn-based, Deduction, Singleplayer, Economy, Offline, Mobile

**Made with:** JavaScript, HTML5

**Languages:** English · **Inputs:** Mouse, Touchscreen

**Accessibility:** large text and high contrast, in the settings. Turn-based,
no timers.

**Links:** the full game on Google Play:
https://play.google.com/store/apps/details?id=com.taugustincst.mended

**Description** (itch takes Markdown)

    **Every repair is a small vote against the landfill.**

    You inherit a one-bench repair café on Hollow Lane in a throwaway age.
    Kettles, lamps, radios, bikes, games consoles, phones and sewing machines
    come through the door, each with a symptom and an owner who knows what a
    new one costs.

    **Diagnose, don't guess.** Choose the tests, read the results, name the
    fault. A wrong call wastes the parts and the hours.

    **Quote, order, fix.** Price against the alternative and promise a date
    you can keep. Order parts cheap and slow, next week, or today at a
    premium. Hire staff who learn on the job and choose careful fixes or
    quick ones.

    **Win the street.** Each street has its own reputation, and the story
    customers remember what you did for them.

    **This web version is the free part of the game:** the first year on
    Hollow Lane, with two streets and the start of every story. The full
    game, with years two and three, all five streets, the endings and
    endless mode, is on Google Play:
    https://play.google.com/store/apps/details?id=com.taugustincst.mended

    No ads, no account. Progress stays in your browser.

**Screenshots:** the captioned phone shots in `store/play/`, or the raw ones in
this folder.

**Cover image:** 630 × 500; crop `feature-graphic-1024x500.png`, or make one
from `store/play/play-01.png`.
