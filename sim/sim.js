/* Headless auto-player: node sim/sim.js [strategy|all|check] [seed] [runs]. `check` is the balance gate CI runs. Plays full 3-year campaigns and reports cash/reputation curves. */
const E = require('../js/engine.js'); const D = E.D;
const STRATS = {
  // Runs every test it can afford, prices at 55% of replacement scaled by attachment, careful fixes, stocks parts a week ahead, hires and expands when flush.
  careful: { tests: 3, priceFrac: j => 0.5 + 0.4 * j.attach, mode: 'careful', weeks: 2, invest: true, supplier: 'std' },
  // One test then a guess, high prices, quick fixes, rush parts. The impatient player.
  hasty: { tests: 1, priceFrac: j => 0.75 + 0.3 * j.attach, mode: 'quick', weeks: 1, invest: true, supplier: 'rush' },
  // Careful for two years, then coasts like the hasty player. Shows that reputation can still be lost late.
  coast: { tests: 3, priceFrac: j => 0.5 + 0.4 * j.attach, mode: 'careful', weeks: 2, invest: true, supplier: 'std', coastFrom: 105 },
  // Thorough but undercharges and never hires.
  cheap: { tests: 3, priceFrac: j => 0.25, mode: 'careful', weeks: 3, invest: false, supplier: 'bulk' },
  // Takes every job without diagnosing properly and never orders parts. Does it go bust?
  neglect: { tests: 0, priceFrac: j => 0.5, mode: 'quick', weeks: 1, invest: false, supplier: null }
};
function play(name, seed, maxWeeks) {
  const S0 = STRATS[name]; let S = S0; const s = E.newState({ seed, unlocked: true }); const curve = [];
  let guard = 0;
  while (!s.ended && guard++ < 5000) {
    if (S0.coastFrom && s.week >= S0.coastFrom) S = STRATS.hasty;
    if (s.pending) { if (s.pending.ending) { const o = E.endingOptions(s); E.chooseEnding(s, o.beloved ? 'beloved' : o.empire ? 'empire' : 'any'); break; } E.resolveBeat(s, 0); continue; }
    // intake
    for (const j of s.jobs.filter(j => j.status === 'intake')) {
      const cat = E.catById[j.cat]; const tests = Object.keys(cat.tests);
      for (let k = 0; k < S.tests; k++) { const left = E.candidates(s, j); if (left.length <= 1) break; const best = tests.filter(t => j.tests[t] === undefined).sort((a, b) => new Set(left.map(f => f.t[a])).size - new Set(left.map(f => f.t[b])).size).pop(); if (!best || !E.runTest(s, j.id, best)) break; }
      const left = E.candidates(s, j); const guess = E.mostLikely(left) || cat.faults[0]; E.diagnose(s, j.id, guess.id);
      if (S.tests > 0 && E.backlogHours(s) > E.capacityHours(s) * 1.5 * S.weeks && !j.story) { E.decline(s, j.id); continue; }
      E.quote(s, j.id, Math.max(5, Math.round(j.replace * S.priceFrac(j))), S.weeks);
    }
    // parts
    if (S.supplier) { const need = E.partsNeeded(s); for (const p in need) { const have = (s.inventory[p] | 0) + s.orders.filter(o => o.part === p).reduce((a, o) => a + o.qty, 0); if (have < need[p]) E.order(s, S.supplier, p, need[p] - have + (S.invest ? 1 : 0)); } }
    // assign: least busy bench staff
    const bench = s.staff.filter(x => x.role !== 'front');
    for (const j of s.jobs.filter(j => j.status === 'queued')) { const st = bench.map(x => [x, s.jobs.filter(y => y.assigned === x.id && y.status === 'working').length]).sort((a, b) => a[1] - b[1])[0]; if (st && st[1] < 8) E.assign(s, j.id, st[0].id, S.mode); }
    // invest
    if (S.invest) {
      // hire only while the last six weeks' takings cover the wage bill with room for one more
      const recent = (s.takings || []).slice(-6), avgIn = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0, canPay = recent.length < 6 || avgIn > E.weeklyCosts(s) + 150;
      if (S.tests > 1 && process.env.FRONT !== '0' && s.hoursUsed > E.diagHours(s) - 2 * E.TEST_HOURS && s.cash > 1500 && canPay && s.staff.length < s.benches + 1 && s.staff.filter(x => x.role === 'front').length < 2) E.hire(s, 'front');
      if (s.cash > 1500 && canPay && s.staff.length < s.benches + 1 && s.jobs.filter(j => j.status === 'queued' || j.status === 'working').length > bench.length * 2) E.hire(s, s.cash > 4000 ? 'tech' : 'apprentice');
      if (s.cash > 2500 && s.staff.length >= s.benches + 1) E.buyBench(s);
      for (const c of D.CATEGORIES) if (!s.cats[c.id] && s.cash > c.unlockCost + 600) { E.unlockCat(s, c.id); break; }
      for (const b of D.BLOCKS) if (!s.open[b.id] && s.cash > b.cost + 1500) E.openBlock(s, b.id);
      if (s.cash > 3000) { const st = s.staff.filter(x => x.role !== 'owner' && x.role !== 'front')[0]; if (st) { const c = D.CATEGORIES.filter(c => s.cats[c.id]).sort((a, b) => st.skills[a.id] - st.skills[b.id])[0]; E.train(s, st.id, c.id); } }
    }
    const w = s.week; E.endWeek(s);
    if (w % 13 === 0) curve.push({ w, cash: Math.round(s.cash), rep: Math.round(s.rep.hollow), staff: s.staff.length, blocks: Object.keys(s.open).length });
    if (maxWeeks && s.week > maxWeeks) break;
  }
  return { s, curve };
}
function summarise(n, seed, runs) {
  const ends = {}, bustWeeks = []; let bustYear1 = 0, cashY1 = 0, cashEnd = 0, repEnd = 0, fixed = 0, failed = 0;
  for (let i = 0; i < runs; i++) { const { s, curve } = play(n, seed + i); ends[s.ended] = (ends[s.ended] | 0) + 1; const y1 = curve.find(c => c.w === 52); if (s.ended === 'bust') { bustWeeks.push(s.week); if (s.week <= 52) bustYear1++; } cashY1 += y1 ? y1.cash : s.cash; cashEnd += s.cash; repEnd += s.rep.hollow; fixed += s.stats.fixed; failed += s.stats.failed; }
  return { n, runs, ends, bustYear1, bustWeeks: bustWeeks.sort((a, b) => a - b), cashY1: Math.round(cashY1 / runs), cashEnd: Math.round(cashEnd / runs), rep: Math.round(repEnd / runs), fixed: Math.round(fixed / runs), failed: Math.round(failed / runs) };
}
const line = r => `${r.n.padEnd(8)} endings=${JSON.stringify(r.ends)} bustInYear1=${r.bustYear1}/${r.runs} avgCashY1=£${r.cashY1} avgCashEnd=£${r.cashEnd} avgRepHollow=${r.rep} fixed/run=${r.fixed} misdiag/run=${r.failed}`;
const which = process.argv[2] || 'all', seed = +(process.argv[3] || 7), runs = +(process.argv[4] || 20);
if (which === 'check') {
  // The balance gate CI runs (Folder's week-6 acceptance and the brief's kill rule). Exit 2 when any line fails.
  const R = {}; for (const n of Object.keys(STRATS)) { R[n] = summarise(n, seed, runs); console.log(line(R[n])); }
  const c = R.careful, h = R.hasty, gates = [
    ['careful beats hasty on end cash', c.cashEnd > h.cashEnd],
    ['careful beats hasty on reputation', c.rep > h.rep],
    ['year one is beatable: careful survives it in at least 80% of runs', c.bustYear1 <= runs * 0.2],
    ['year one is losable: undercharging and neglect go bust in it', R.cheap.bustYear1 >= runs * 0.9 && R.neglect.bustYear1 >= runs * 0.9],
    ['the last year has money tension: careful ends in the low tens of thousands', c.cashEnd >= 8000 && c.cashEnd <= 60000],
    ['reputation can still be lost late: coasting from week 105 ends at least 8 lower', R.coast.rep <= c.rep - 8]
  ];
  for (const [g, ok] of gates) console.log(`${ok ? 'PASS' : 'FAIL'} ${g}`);
  process.exitCode = gates.every(g => g[1]) ? 0 : 2;
} else {
  const names = which === 'all' ? Object.keys(STRATS) : [which];
  for (const n of names) {
    const r = summarise(n, seed, runs); if (process.env.BUSTS) console.log(n, 'bust weeks', r.bustWeeks.join(' '));
    console.log(line(r));
    if (which !== 'all') { const { curve } = play(n, seed); console.log(curve.map(c => `w${c.w}: £${c.cash} rep${c.rep} staff${c.staff} blocks${c.blocks}`).join('\n')); }
  }
}
