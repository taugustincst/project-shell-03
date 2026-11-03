# Lessons (Mended)

- Local ports are denied in this sandbox; Playwright over `file://` works for everything but the service worker.
- A planted corrupt save is overwritten by the `pagehide` save on reload; plant it with `addInitScript` in a fresh context.
- GitHub Pages must be enabled by Tj (Settings → Pages → Source: GitHub Actions); the workflow token cannot create the site.
- First economy pass went bust for every strategy: rent and wages were sized against a real shop, not against 4 jobs a week at £25. Size costs from the sim's income, not from realism.
- A per-staff concurrent-job cap of 2 silently starved the bench and crashed reputation through lateness; hours are the real limit, not job count.
- A diagnosis-hours budget of 40 h at 6 h per test allowed only two fully tested jobs a week; test cost must be sized against intake volume.
- A week ledger and the gate sheet both opening at once blocked clicks; only one sheet takes the stage per turn.
- Quote tests must respect customer patience (promised weeks), or the quote is refused for time, not price.
- Folder pushes to `main` concurrently (Pages workflow, a placeholder index.html). Before merging: fetch origin main, merge it into the branch (no force-push, no reset; force-push is denied here anyway), keep Folder's `.github/workflows/pages.yml` and its HANDOFF log line, make sure the game's `index.html` wins over the placeholder (`git checkout --ours index.html`), then fast-forward main. Pages is already enabled, so the game goes live on that merge.
- A shallow single-branch clone's `git fetch origin` only updates `origin/main`; the feature branch ref is not tracked locally.
