// node tests/smoke.js [url]  — drives the real page over file:// by default
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (n, ok, x = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('opens on week 1 with customers at the counter', (await p.textContent('#hdr-week')).includes('Week 1') && (await p.locator('#counter .card').count()) > 0);
  // diagnose via the UI: run a test, pick the true fault, quote low
  const jid = await T(p, () => window.__repairshop.state.jobs.find(j => j.status === 'intake').id);
  await p.click('#counter .card .tests .btn:not([disabled])'); await p.waitForTimeout(100);
  check('a test shows its result and spends hours', await T(p, id => { const s = window.__repairshop.state; const j = s.jobs.find(x => x.id === id); return Object.keys(j.tests).length === 1 && s.hoursUsed > 0; }, jid));
  await T(p, id => { const K = window.__repairshop; const j = K.state.jobs.find(x => x.id === id); K.E.diagnose(K.state, id, j.fault); K.render(); }, jid);
  await p.waitForSelector(`#pr-${jid}`); await T(p, id => { const r = document.getElementById('pr-' + id); r.value = 5; r.dispatchEvent(new Event('input')); }, jid); await p.click('#counter .card .quote-box .btn.primary'); await p.waitForTimeout(100);
  check('a fair quote puts the job on the bench', await T(p, id => window.__repairshop.state.jobs.find(x => x.id === id).status === 'queued', jid));
  await p.click('.tab[data-tab="bench"]'); await p.waitForSelector('#bench .card');
  await p.selectOption('#bench .card .asg', { index: 1 }); await p.waitForTimeout(100);
  check('assigning from the bench starts the work', await T(p, id => window.__repairshop.state.jobs.find(x => x.id === id).status === 'working', jid));
  await p.click('.tab[data-tab="parts"]'); check('the parts catalogue lists suppliers', (await p.locator('#parts [data-p]').count()) > 10);
  await p.click('.tab[data-tab="shop"]'); check('the shop tab offers hires, benches, trades and streets', (await p.locator('#shop [data-hire]').count()) === 4 && (await p.locator('#shop [data-cat]').count()) === 6);
  const w0 = await T(p, () => window.__repairshop.state.week);
  await T(p, () => window.__repairshop.state.jobs.filter(j => j.status === 'intake').forEach(j => window.__repairshop.E.decline(window.__repairshop.state, j.id)));
  await p.click('#btn-endweek'); await p.waitForTimeout(200);
  const hasWeek = await p.isVisible('#modal-week'); if (hasWeek) await p.click('#btn-week-ok');
  check('ending the week advances the calendar and shows a ledger', hasWeek && (await T(p, () => window.__repairshop.state.week)) === w0 + 1);
  // story beat
  await T(p, () => window.__repairshop.forceBeat('okafor', 0)); await p.waitForSelector('#modal-story:not([hidden])');
  check('a story beat opens with choices', (await p.locator('#story-choices .choice').count()) >= 1); await p.click('#story-choices .choice'); await p.waitForTimeout(100);
  check('choosing records a flag and a story log line', await T(p, () => { const s = window.__repairshop.state; return !s.pending && s.flags.okafor_job === true && s.log.some(l => l.k === 'story' && l.t.includes('Okafor')); }));
  // gate
  await T(p, () => { const K = window.__repairshop; K.seed({ week: 52 }); K.state.jobs = []; K.endWeek(); }); await p.waitForTimeout(100); if (await p.isVisible('#modal-week')) await p.click('#btn-week-ok');
  await p.waitForSelector('#modal-gate:not([hidden])'); check('the free year stops at week 52 with the unlock sheet', await T(p, () => window.__repairshop.state.gated));
  await p.click('#btn-gate-later'); await p.click('.tab[data-tab="story"]'); await p.click('#btn-unlock'); await p.waitForTimeout(150);
  check('without Play Billing the unlock explains itself and stays locked', await T(p, () => !window.__repairshop.state.unlocked && !document.getElementById('toast').hidden));
  await T(p, () => window.__repairshop.unlock()); check('unlock reopens the calendar', await T(p, () => window.__repairshop.state.unlocked && !window.__repairshop.state.gated));
  // save round trip
  const before = await T(p, () => { const K = window.__repairshop; K.save(); return [K.state.week, Math.round(K.state.cash), K.state.flags.okafor_job]; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  const after = await T(p, () => { const K = window.__repairshop; return [K.state.week, Math.round(K.state.cash), K.state.flags.okafor_job, K.state.unlocked]; });
  check('the save restores week, cash, flags and the unlock', before[0] === after[0] && before[1] === after[1] && after[2] === true && after[3] === true, JSON.stringify(after));
  for (const [label, junk] of [['truncated JSON', '{"run":{"week":"zzz","cash":"1e999"},"meta":{"unlocked":"yes"}'], ['wrong types', '{"v":1,"run":{"week":-3,"cash":"x","jobs":"no","staff":[null],"rep":5},"meta":{"unlocked":1}}'], ['not an object', '42']]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message)); await q.addInitScript(j => { try { localStorage.setItem('mended.v1', j); } catch (e) { } }, junk); await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qe.length === 0 && await T(q, () => { const s = window.__repairshop.state; return s.week >= 1 && isFinite(s.cash) && s.unlocked === false && s.staff.length >= 1; }), qe.join(' | ')); await ctx.close();
  }
  // ending
  await T(p, () => { const K = window.__repairshop; K.seed({ week: 156, rep: 80 }); K.state.jobs = []; K.state.pending = null; K.endWeek(); }); await p.waitForTimeout(100); if (await p.isVisible('#modal-week')) await p.click('#btn-week-ok');
  await p.waitForSelector('#modal-ending:not([hidden])'); check('week 156 asks what you became', (await p.textContent('#ending-title')).includes('What did you become'));
  await p.click('#ending-choices .choice:not([disabled])'); await p.waitForTimeout(100);
  check('an ending is written to the log', await T(p, () => window.__repairshop.state.ended === 'beloved' && window.__repairshop.state.log.some(l => l.k === 'ending')));
  await p.click('#btn-endless'); await p.waitForTimeout(100); check('endless mode keeps the shop open', await T(p, () => window.__repairshop.state.endless && !window.__repairshop.state.ended));
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
