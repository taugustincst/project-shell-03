// node tests/smoke.js [url]  — drives the real page over file:// by default
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (n, ok, x = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
// A stand-in for the Play app's billing bridge (android/play/.../PlayBilling.java), answering as Play does.
const fakePlay = owned => {
  const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30);
  window.__buys = 0;
  window.AndroidBilling = {
    start(id) { const had = owned || localStorage.getItem('fakeplay.bought') === '1'; say({ type: 'ready', product: id }); say({ type: 'price', product: id, price: '$4.99' }); say({ type: 'owned', product: id, owned: had }); },
    buy(id) { window.__buys++; localStorage.setItem('fakeplay.bought', '1'); say({ type: 'purchased', product: id }); },
    restore(id) { say({ type: 'owned', product: id, owned: localStorage.getItem('fakeplay.bought') === '1' }); }
  };
};
const fresh = async (b, init, arg) => { const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message)); q.on('dialog', d => d.accept()); if (init) await q.addInitScript(init, arg); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); return { ctx, q, qe }; };
(async () => {
  const b = await chromium.launch(); const errs = []; const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); }); p.on('dialog', d => d.accept());
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
  // the free year: two streets, then the shop waits at the end of week 52
  await T(p, () => { const K = window.__repairshop; K.state.rep.estate = 90; K.state.rep.market = 90; K.state.cash = 9000; K.E.openBlock(K.state, 'estate'); K.render(); });
  await p.click('.tab[data-tab="shop"]');
  check('with two streets open the next one asks for the full game', (await p.locator('#shop [data-full]').count()) >= 1 && (await p.locator('#shop [data-open]').count()) === 0 && (await p.textContent('#shop')).includes('free year has room for 2'));
  await p.click('#shop [data-full]'); await p.waitForSelector('#modal-unlock:not([hidden])');
  check('outside the Play app the unlock says so and cannot be bought', (await p.textContent('#u-sub')) === 'A third street' && (await p.isDisabled('#u-buy')) && (await p.textContent('#u-note')).includes('Google Play edition'));
  await p.click('#u-later'); await p.click('.tab[data-tab="counter"]');
  await T(p, () => { const K = window.__repairshop; K.seed({ week: 52 }); K.state.jobs = []; K.state.pending = null; K.endWeek(); }); await p.waitForTimeout(100);
  check('the last week of the free year says what comes next in its ledger', (await p.isVisible('#modal-week')) && (await p.textContent('#week-body')).includes('last week of your first year'));
  await p.click('#btn-week-ok'); await p.waitForSelector('#modal-unlock:not([hidden])');
  check('then the shop holds at week 52 and the unlock sheet opens', await T(p, () => { const s = window.__repairshop.state; return s.week === 52 && s.gated && !s.unlocked; }) && (await p.textContent('#u-sub')).includes('end of year one'));
  await p.click('#u-later');
  check('held, the end-week button reopens the sheet instead of a week', (await p.textContent('#btn-endweek')) === 'Start year two' && (await p.click('#btn-endweek'), await p.isVisible('#modal-unlock')) && (await T(p, () => window.__repairshop.state.week)) === 52);
  await p.click('#u-later'); await p.click('.tab[data-tab="story"]');
  check('the Story tab has a full-game card', (await p.textContent('#unlock-card')).includes('years two and three'));
  check('a save never carries the unlock', await T(p, () => { window.__repairshop.save(); const raw = JSON.parse(localStorage.getItem('mended.v1')); return raw.run.unlocked === false && !('owned' in raw); }));
  // save round trip
  const before = await T(p, () => { const K = window.__repairshop; K.save(); return [K.state.week, Math.round(K.state.cash), K.state.flags.okafor_job]; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  const after = await T(p, () => { const K = window.__repairshop; return [K.state.week, Math.round(K.state.cash), K.state.flags.okafor_job, K.state.gated]; });
  check('the save restores week, cash, flags and the held year', before[0] === after[0] && before[1] === after[1] && after[2] === true && after[3] === true && (await p.isVisible('#modal-unlock')), JSON.stringify(after));
  for (const [label, junk] of [['truncated JSON', '{"run":{"week":"zzz","cash":"1e999"},"meta":{"unlocked":"yes"}'], ['wrong types', '{"v":1,"run":{"week":-3,"cash":"x","jobs":"no","staff":[null],"rep":5},"meta":{"unlocked":1}}'], ['not an object', '42'], ['a save that claims the unlock', '{"v":1,"run":{"week":20,"cash":800,"unlocked":true,"open":{"hollow":true,"estate":true,"market":true}}}']]) {
    const { ctx, q, qe } = await fresh(b, j => { try { localStorage.setItem('mended.v1', j); } catch (e) { } }, junk);
    check('a mangled save still loads and opens nothing: ' + label, qe.length === 0 && await T(q, () => { const s = window.__repairshop.state; return s.week >= 1 && isFinite(s.cash) && s.unlocked === false && s.staff.length >= 1; }), qe.join(' | ')); await ctx.close();
  }
  { // a 1.0 paid-edition save in year two: kept where it was, and the sheet explains, until Play says owned
    const { ctx, q, qe } = await fresh(b, () => { try { localStorage.setItem('mended.v1', JSON.stringify({ v: 1, run: { week: 90, cash: 4200, unlocked: true } })); } catch (e) { } });
    check('a 1.0 save in year two is kept but asks for the unlock', qe.length === 0 && (await q.isVisible('#modal-unlock')) && await T(q, () => window.__repairshop.state.week === 90 && Math.round(window.__repairshop.state.cash) === 4200 && window.__repairshop.E.atGate(window.__repairshop.state)), qe.join(' | ')); await ctx.close();
  }
  { // the Play edition: buying carries the held shop into year two; a reinstall restores it
    const { ctx, q, qe } = await fresh(b, fakePlay, false);
    await T(q, () => { const K = window.__repairshop; K.seed({ week: 52 }); K.state.jobs = []; K.state.pending = null; K.endWeek(); }); await q.waitForTimeout(100); await q.click('#btn-week-ok'); await q.waitForSelector('#modal-unlock:not([hidden])'); await q.waitForTimeout(150);
    check('in the Play app the sheet shows Play\'s price', (await q.textContent('#u-buy')).includes('$4.99') && !(await q.isDisabled('#u-buy')));
    const cash = await T(q, () => Math.round(window.__repairshop.state.cash));
    await q.click('#u-buy'); await q.waitForTimeout(200); if (await q.isVisible('#modal-story')) { await q.click('#story-choices .choice'); await q.waitForTimeout(100); }
    check('buying carries the same shop into year two', (await T(q, () => window.__buys)) === 1 && await T(q, c => { const s = window.__repairshop.state; return s.week === 53 && s.unlocked && !s.gated && Math.round(s.cash) === c && s.jobs.some(j => j.status === 'intake'); }, cash) && !(await q.isVisible('#modal-unlock')) && (await q.textContent('#btn-endweek')) === 'End the week');
    await T(q, () => { const K = window.__repairshop; K.state.rep.estate = 90; K.state.rep.market = 90; K.state.cash = 9000; K.E.openBlock(K.state, 'estate'); K.E.openBlock(K.state, 'market'); });
    check('once bought, a third street opens', await T(q, () => Object.keys(window.__repairshop.state.open).length === 3));
    await ctx.close(); check('no errors in the Play edition run', qe.length === 0, qe.join(' | '));
    const r = await fresh(b, () => { try { localStorage.setItem('mended.v1', JSON.stringify({ v: 1, run: { week: 52, cash: 3000, gated: true } })); } catch (e) { } const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30); window.AndroidBilling = { start(id) { say({ type: 'ready', product: id }); say({ type: 'owned', product: id, owned: true }); }, buy() { }, restore(id) { say({ type: 'owned', product: id, owned: true }); } }; });
    await r.q.waitForTimeout(250); if (await r.q.isVisible('#modal-story')) { await r.q.click('#story-choices .choice'); await r.q.waitForTimeout(100); }
    check('a reinstall that Play says owns the unlock carries a held shop on', await T(r.q, () => { const s = window.__repairshop.state; return s.week === 53 && s.unlocked && !s.gated && window.__repairshop.billing.state.owned; }) && !(await r.q.isVisible('#modal-unlock')), r.qe.join(' | '));
    await r.ctx.close();
  }
  // the rest of the campaign, as the full game (Play's answer, faked)
  if (await p.isVisible('#modal-unlock')) await p.click('#u-later');
  await T(p, () => { window.__repairshop.billing.state.owned = true; window.__repairshop.E.unlock(window.__repairshop.state); window.__repairshop.render(); });
  if (await p.isVisible('#modal-story')) { await p.click('#story-choices .choice'); await p.waitForTimeout(100); }
  // ending
  await T(p, () => { const K = window.__repairshop; K.seed({ week: 156, rep: 80 }); K.state.jobs = []; K.state.pending = null; K.endWeek(); }); await p.waitForTimeout(100); if (await p.isVisible('#modal-week')) await p.click('#btn-week-ok');
  await p.waitForSelector('#modal-ending:not([hidden])'); check('week 156 asks what you became', (await p.textContent('#ending-title')).includes('What did you become'));
  await p.click('#ending-choices .choice:not([disabled])'); await p.waitForTimeout(100);
  check('an ending is written to the log', await T(p, () => window.__repairshop.state.ended === 'beloved' && window.__repairshop.state.log.some(l => l.k === 'ending')));
  await p.click('#btn-endless'); await p.waitForTimeout(100); check('endless mode keeps the shop open', await T(p, () => window.__repairshop.state.endless && !window.__repairshop.state.ended));
  { // phone width: nothing spills sideways on any tab, or with the unlock sheet open
    const r = [];
    for (const t of ['counter', 'bench', 'parts', 'shop', 'story']) { await p.click(`.tab[data-tab="${t}"]`); r.push(await T(p, () => document.documentElement.scrollWidth - innerWidth)); }
    await T(p, () => window.__repairshop.showUnlock('more')); r.push(await T(p, () => document.documentElement.scrollWidth - innerWidth)); await p.click('#u-later');
    check('at 360px every tab and the unlock sheet fit', r.every(x => x <= 0), JSON.stringify(r));
  }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
