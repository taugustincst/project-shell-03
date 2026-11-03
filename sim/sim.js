/* Headless auto-player: node sim/sim.js [strategy|all] [seed] [runs]. Plays full 3-year campaigns and reports cash/reputation curves. */
const E = require('../js/engine.js'); const D = E.D;
const STRATS = {
  // Runs every test it can afford, prices at 55% of replacement scaled by attachment, careful fixes, stocks parts a week ahead, hires and expands when flush.
  careful: { tests: 3, priceFrac: j => 0.5 + 0.4 * j.attach, mode: 'careful', weeks: 2, invest: true, supplier: 'std' },
  // One test then a guess, high prices, quick fixes, rush parts. The impatient player.
  hasty: { tests: 1, priceFrac: j => 0.75 + 0.3 * j.attach, mode: 'quick', weeks: 1, invest: true, supplier: 'rush' },
  // Thorough but undercharges and never hires.
  cheap: { tests: 3, priceFrac: j => 0.25, mode: 'careful', weeks: 3, invest: false, supplier: 'bulk' },
  // Takes every job without diagnosing properly and never orders parts. Does it go bust?
  neglect: { tests: 0, priceFrac: j => 0.5, mode: 'quick', weeks: 1, invest: false, supplier: null }
};
function play(name, seed, maxWeeks) {
  const S = STRATS[name]; const s = E.newState({ seed, unlocked: true }); const curve = [];
  let guard = 0;
  while (!s.ended && guard++ < 5000) {
    if (s.pending) { if (s.pending.ending) { const o = E.endingOptions(s); E.chooseEnding(s, o.beloved ? 'beloved' : 'empire'); break; } E.resolveBeat(s, 0); continue; }
    // intake
    for (const j of s.jobs.filter(j => j.status === 'intake')) {
      const cat = E.catById[j.cat]; const tests = Object.keys(cat.tests);
      for (let k = 0; k < S.tests; k++) { const left = E.candidates(s, j); if (left.length <= 1) break; const best = tests.filter(t => j.tests[t] === undefined).sort((a, b) => new Set(left.map(f => f.t[a])).size - new Set(left.map(f => f.t[b])).size).pop(); if (!best || !E.runTest(s, j.id, best)) break; }
      const left = E.candidates(s, j); const guess = left[Math.floor(E.rand(s) * left.length)] || cat.faults[0]; E.diagnose(s, j.id, guess.id);
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
      if (s.cash > 1500 && s.staff.length < s.benches + 1 && s.jobs.filter(j => j.status === 'queued' || j.status === 'working').length > bench.length * 2) E.hire(s, s.cash > 4000 ? 'tech' : 'apprentice');
      if (s.cash > 2500 && s.staff.length >= s.benches + 1) E.buyBench(s);
      for (const c of D.CATEGORIES) if (!s.cats[c.id] && s.cash > c.unlockCost + 1200) { E.unlockCat(s, c.id); break; }
      for (const b of D.BLOCKS) if (!s.open[b.id] && s.cash > b.cost + 1500) E.openBlock(s, b.id);
      if (s.cash > 3000) { const st = s.staff.filter(x => x.role !== 'owner' && x.role !== 'front')[0]; if (st) { const c = D.CATEGORIES.filter(c => s.cats[c.id]).sort((a, b) => st.skills[a.id] - st.skills[b.id])[0]; E.train(s, st.id, c.id); } }
    }
    const w = s.week; E.endWeek(s);
    if (w % 13 === 0) curve.push({ w, cash: Math.round(s.cash), rep: Math.round(s.rep.hollow), staff: s.staff.length, blocks: Object.keys(s.open).length });
    if (maxWeeks && s.week > maxWeeks) break;
  }
  return { s, curve };
}
const which = process.argv[2] || 'all', seed = +(process.argv[3] || 7), runs = +(process.argv[4] || 20);
const names = which === 'all' ? Object.keys(STRATS) : [which];
for (const n of names) {
  const ends = {}; let bustYear1 = 0, cashY1 = 0, cashEnd = 0, repEnd = 0, fixed = 0, failed = 0;
  for (let i = 0; i < runs; i++) { const { s, curve } = play(n, seed + i); ends[s.ended] = (ends[s.ended] | 0) + 1; const y1 = curve.find(c => c.w === 52); if (s.ended === 'bust' && s.week <= 52) bustYear1++; cashY1 += y1 ? y1.cash : s.cash; cashEnd += s.cash; repEnd += s.rep.hollow; fixed += s.stats.fixed; failed += s.stats.failed; }
  console.log(`${n.padEnd(8)} endings=${JSON.stringify(ends)} bustInYear1=${bustYear1}/${runs} avgCashY1=£${Math.round(cashY1 / runs)} avgCashEnd=£${Math.round(cashEnd / runs)} avgRepHollow=${Math.round(repEnd / runs)} fixed/run=${Math.round(fixed / runs)} misdiag/run=${Math.round(failed / runs)}`);
  if (which !== 'all') { const { curve } = play(n, seed); console.log(curve.map(c => `w${c.w}: £${c.cash} rep${c.rep} staff${c.staff} blocks${c.blocks}`).join('\n')); }
}
