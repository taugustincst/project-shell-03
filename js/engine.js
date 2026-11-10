/* Mended — economy engine. Pure functions over a plain state; no DOM. Runs in Node (sim, tests) and the browser. */
(function (root) {
'use strict';
const D = (typeof REPAIR_DATA !== 'undefined') ? REPAIR_DATA : require('./data.js');
const catById = {}; D.CATEGORIES.forEach(c => { catById[c.id] = c; c.faultById = {}; c.faults.forEach(f => { c.faultById[f.id] = f; }); });
const blockById = {}; D.BLOCKS.forEach(b => { blockById[b.id] = b; });
const roleById = {}; D.ROLES.forEach(r => { roleById[r.id] = r; });
const supById = {}; D.SUPPLIERS.forEach(s => { supById[s.id] = s; });
const arcById = {}; D.ARCS.forEach(a => { arcById[a.id] = a; });

const TEST_HOURS = 3, OWNER_HOURS = 40, BENCH_COST = 350, HIRE_COST = 200, TRAIN_COST = 120, MAX_TESTS = 3;
const START_CASH = 1500, BANKRUPT_AT = -600, LOG_CAP = 400;
/* Balance levers (week-6 pass, 2026-11-09). Each is a plain number so the sim can try others. */
const BAL = {
  frontDiag: 20,                  // diagnosis hours each front-of-house adds to the owner's 40
  sure: 1.15, unsure: 0.85,       // what a customer will pay when you can name the fault for certain, or when three or more faults still fit
  misdiagRep: 3,                  // reputation lost on a wrong call, scaled by how attached the customer is (plus one)
  quickQ: -0.15, careQ: 0.1,      // repair quality for quick and careful fixes
  quickCap: 0.6,                  // however skilled the hands, a quick fix is never better than this
  returnBelow: 0.62,              // repairs below this quality may come back failed
  rentYear: [1, 1.1, 1.25],       // the street is coming up: rent by year
  rentPerBlock: 0.3,              // each street you hold makes every lease dearer
  wageSkill: 0,                   // wages rising with average skill (off: seniority does the work)
  wageYear: 0.25,                 // each full year on the payroll, a wage rises by this share
  benchUpkeep: 20,                // per bench past the first two, per week
  repCeil: 70, repFade: 0.05,     // above this, a street's reputation fades unless you keep earning it
  repHead: 60,                    // good work earns less reputation the nearer a street is to 100
  vatAt: 50000, vat: 1 / 6,       // once a year's takings pass this, VAT takes this share of each week's takings
  turnoverAt: 1500, turnover: 0.4 // from year two the leases take this share of a week's takings above this
};
if (typeof process !== 'undefined' && process.env && process.env.MENDED_BAL) Object.assign(BAL, JSON.parse(process.env.MENDED_BAL)); // sim experiments only

function rand(s) { s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function newStaff(s, roleId, name) {
  const r = roleById[roleId]; const skills = {};
  for (const c of D.CATEGORIES) skills[c.id] = 0;
  if (roleId === 'tech') { const open = D.CATEGORIES.filter(c => s.cats[c.id]); for (let i = 0; i < 2 && open.length; i++) skills[pick(s, open).id] = 2; }
  if (roleId === 'master') for (const c of D.CATEGORIES) skills[c.id] = 4;
  return { id: s.nextId++, name: name || pick(s, D.STAFF_NAMES), role: roleId, skills, xp: 0, since: s.week };
}
function newState(opts) {
  opts = opts || {};
  const s = { v: 1, seed: (opts.seed | 0) || ((Date.now() ^ (Math.random() * 1e9)) | 0), week: 1, cash: START_CASH, nextId: 1,
    rep: { hollow: 25, market: 10, estate: 10, station: 5, hill: 5 }, open: { hollow: true }, benches: 2, cats: { kettle: true, lamp: true },
    staff: [], inventory: {}, orders: [], jobs: [], arcs: {}, flags: {}, log: [], hoursUsed: 0, debtWeeks: 0,
    stats: { fixed: 0, failed: 0, declined: 0, late: 0, returns: 0, earned: 0, spent: 0, saved: 0 },
    unlocked: !!opts.unlocked, gated: false, ended: null, endless: false, pending: null, week_log: [] };
  const owner = { id: s.nextId++, name: 'You', role: 'owner', skills: {}, xp: 0 }; for (const c of D.CATEGORIES) owner.skills[c.id] = c.id === 'kettle' || c.id === 'lamp' ? 2 : 1;
  s.staff.push(owner);
  for (const p of ['fuse', 'cord', 'switch', 'element', 'bulbholder']) s.inventory[p] = 2;
  log(s, 'Took the keys to the one-bench shop on Hollow Lane. Two trades, a box of fuses, and a street that throws things away.', 'story');
  spawnCustomers(s);
  return s;
}
function log(s, t, k) { s.log.push({ w: s.week, t, k: k || 'note' }); if (s.log.length > LOG_CAP) s.log.splice(0, s.log.length - LOG_CAP); }
function year(s) { return Math.min(3, Math.floor((s.week - 1) / D.WEEKS_PER_YEAR) + 1); }

/* ---------- customers & jobs ---------- */
function attachWord(a) { return a >= 0.8 ? 'irreplaceable' : a >= 0.55 ? 'fond of it' : a >= 0.3 ? 'practical' : 'indifferent'; }
function spawnCustomers(s) {
  const front = s.staff.filter(x => x.role === 'front').length;
  for (const b of D.BLOCKS) {
    if (!s.open[b.id]) continue;
    const n = b.base * (0.5 + s.rep[b.id] / 100) * (1 + 0.25 * front) * (s.flags.bakersign && s.week < 60 ? 1.3 : 1) * (0.8 + rand(s) * 0.4);
    const count = Math.floor(n) + (rand(s) < n - Math.floor(n) ? 1 : 0);
    for (let i = 0; i < count; i++) addJob(s, b.id);
  }
  // story beats
  for (const arc of D.ARCS) {
    const stage = s.arcs[arc.id] | 0; const beat = arc.beats[stage]; if (!beat) continue;
    if (s.week < beat.week[0] || s.week > beat.week[1]) continue;
    if (beat.cond && !condOk(s, beat.cond)) continue;
    if (beat.cat && !s.cats[beat.cat]) continue;
    s.arcs[arc.id] = stage + 1; s.pending = { arc: arc.id, beat: stage };
    if (beat.cat) addJob(s, 'hollow', { cat: beat.cat, item: beat.item, attach: beat.attach, name: arc.name, story: true });
    break;
  }
}
function condOk(s, c) { if (!c) return true; if (c[0] === '!') return !condOk(s, c.slice(1)); if (c.startsWith('flag:')) return !!s.flags[c.slice(5)]; return true; }
function addJob(s, blockId, o) {
  o = o || {};
  const open = D.CATEGORIES.filter(c => s.cats[c.id]);
  const cat = o.cat ? catById[o.cat] : pick(s, open);
  const fault = pick(s, cat.faults);
  const attach = o.attach != null ? o.attach : rand(s);
  const replace = Math.round(cat.replace[0] + rand(s) * (cat.replace[1] - cat.replace[0]));
  const j = { id: s.nextId++, cat: cat.id, item: o.item || pick(s, D.ITEM_NAMES[cat.id]), name: o.name || pick(s, D.CUSTOMER_NAMES), block: blockId, fault: fault.id, sym: pick(s, fault.sym),
    attach: +attach.toFixed(2), replace, tests: {}, diag: null, status: 'intake', price: 0, due: 0, promised: 0, assigned: null, hoursLeft: 0, quality: 0, mode: 'careful', arrived: s.week, story: !!o.story, waitParts: [] };
  s.jobs.push(j); return j;
}
function candidates(s, j) {
  const cat = catById[j.cat];
  return cat.faults.filter(f => f.sym.includes(j.sym) && Object.keys(j.tests).every(t => f.t[t] === j.tests[t]));
}
/* The fault a sensible person would bet on: each fault shows one of its symptoms at random, so a fault with fewer symptoms is likelier to be behind this one. Ties go to the first in the table. */
function mostLikely(cands) { let best = null, w = -1; for (const f of cands) { const x = 1 / f.sym.length; if (x > w) { w = x; best = f; } } return best; }
function diagHours(s) { return OWNER_HOURS + BAL.frontDiag * s.staff.filter(x => x.role === 'front').length; }
function runTest(s, jobId, testId) {
  const j = s.jobs.find(x => x.id === jobId); if (!j || j.status !== 'intake') return false;
  const cat = catById[j.cat]; if (!cat.tests[testId] || j.tests[testId] !== undefined) return false;
  if (Object.keys(j.tests).length >= MAX_TESTS) return false;
  if (s.hoursUsed + TEST_HOURS > diagHours(s)) return false;
  s.hoursUsed += TEST_HOURS; j.tests[testId] = cat.faultById[j.fault].t[testId]; return true;
}
function diagnose(s, jobId, faultId) { const j = s.jobs.find(x => x.id === jobId); if (!j || j.status !== 'intake') return false; const cat = catById[j.cat]; if (!cat.faultById[faultId]) return false; j.diag = faultId; return true; }
function decline(s, jobId) { const i = s.jobs.findIndex(x => x.id === jobId); if (i < 0) return false; const j = s.jobs[i]; if (j.status !== 'intake' && j.status !== 'quoted') return false; s.jobs.splice(i, 1); s.stats.declined++; if (j.story) s.rep[j.block] = clamp(s.rep[j.block] - 2, 0, 100); return true; }
/* The customer's private ceiling. Shown to the player only as the replacement cost and an attachment word. */
function willingness(s, j) { return j.replace * (0.6 + 0.9 * j.attach) * (0.85 + s.rep[j.block] / 200) * (s.staff.some(x => x.role === 'front') ? 1.08 : 1); }
function quote(s, jobId, price, weeks) {
  const j = s.jobs.find(x => x.id === jobId); if (!j || j.status !== 'intake' || !j.diag) return null;
  price = clamp(Math.round(+price || 0), 1, 9999); weeks = clamp(weeks | 0, 1, 4);
  const noise = 0.92 + rand(s) * 0.16; const patience = 1 + Math.round(j.attach * 2); // 1..3 weeks tolerated
  const left = candidates(s, j).length; const trust = left <= 1 ? BAL.sure : left >= 3 ? BAL.unsure : 1; // naming the fault for sure earns a better price
  const ok = price <= willingness(s, j) * trust * noise && weeks <= patience + 1;
  if (!ok) { s.jobs.splice(s.jobs.indexOf(j), 1); s.stats.declined++; if (price > willingness(s, j) * 1.5) s.rep[j.block] = clamp(s.rep[j.block] - 1, 0, 100); return { accepted: false, reason: price > willingness(s, j) * trust * noise ? 'price' : 'time' }; }
  j.price = price; j.promised = weeks; j.due = s.week + weeks; j.status = 'queued';
  const f = catById[j.cat].faultById[j.diag]; j.hoursLeft = f.hours * 2.2; j.waitParts = f.parts.slice();
  return { accepted: true };
}
/* ---------- parts ---------- */
function partPrice(supId, partId) { return Math.round(D.PARTS[partId][1] * supById[supId].priceMult * 100) / 100; }
function order(s, supId, partId, qty) {
  const sup = supById[supId]; if (!sup || !D.PARTS[partId]) return false; qty = clamp(qty | 0, 1, 50);
  const cost = partPrice(supId, partId) * qty; if (s.cash < cost) return false;
  s.cash -= cost; s.stats.spent += cost;
  if (sup.lead === 0) s.inventory[partId] = (s.inventory[partId] | 0) + qty; else s.orders.push({ part: partId, qty, arrive: s.week + sup.lead, q: sup.quality });
  s.partQ = s.partQ || {}; s.partQ[partId] = sup.quality; return true;
}
function partsNeeded(s) { const need = {}; for (const j of s.jobs) if (j.status === 'queued' || j.status === 'working') for (const p of j.waitParts) need[p] = (need[p] | 0) + 1; return need; }
function haveParts(s, j) { const need = {}; for (const p of j.waitParts) need[p] = (need[p] | 0) + 1; for (const p in need) if ((s.inventory[p] | 0) < need[p]) return false; return true; }
/* ---------- staff & benches ---------- */
function hire(s, roleId) { const r = roleById[roleId]; if (!r) return false; if (s.cash < HIRE_COST) return false; if (s.staff.length >= s.benches + 1) return false; s.cash -= HIRE_COST; s.stats.spent += HIRE_COST; const st = newStaff(s, roleId); s.staff.push(st); log(s, `${st.name} joins as ${r.name.toLowerCase()}.`); return st; }
function fire(s, staffId) { const i = s.staff.findIndex(x => x.id === staffId && x.role !== 'owner'); if (i < 0) return false; const st = s.staff[i]; s.staff.splice(i, 1); for (const j of s.jobs) if (j.assigned === staffId) j.assigned = null; log(s, `${st.name} let go.`); return true; }
function train(s, staffId, catId) { const st = s.staff.find(x => x.id === staffId); if (!st || !catById[catId] || !s.cats[catId]) return false; if (st.skills[catId] >= 5 || s.cash < TRAIN_COST) return false; s.cash -= TRAIN_COST; s.stats.spent += TRAIN_COST; st.skills[catId]++; return true; }
function buyBench(s) { const cost = BENCH_COST * s.benches; if (s.cash < cost || s.benches >= 8) return false; s.cash -= cost; s.stats.spent += cost; s.benches++; log(s, `Bench ${s.benches} built. More elbow room, more elbows.`); return true; }
function unlockCat(s, catId) { const c = catById[catId]; if (!c || s.cats[catId] || s.cash < c.unlockCost) return false; s.cash -= c.unlockCost; s.stats.spent += c.unlockCost; s.cats[catId] = true; log(s, `${c.name} repairs: manuals bought, tools on the wall.`); return true; }
/* The free first year holds Hollow Lane and one more street; the rest wait for the unlock. */
/* True while the shop waits for the unlock: held at the end of the free year, or a later save opened before Google Play has answered. */
function atGate(s) { return !s.unlocked && (s.gated || s.week > D.FREE_WEEKS); }
function streetLocked(s) { return !s.unlocked && Object.keys(s.open).length >= D.FREE_STREETS; }
function openBlock(s, blockId) { const b = blockById[blockId]; if (!b || s.open[blockId]) return false; if (streetLocked(s)) return false; if (s.rep[blockId] < b.needRep || s.cash < b.cost) return false; const adj = Object.keys(s.open).some(o => D.ADJ[o].includes(blockId)); if (!adj) return false; s.cash -= b.cost; s.stats.spent += b.cost; s.open[blockId] = true; log(s, `Opened a counter on ${b.name}.`, 'story'); return true; }
function skillMult(st, catId) { const k = st.skills[catId] | 0; return 1.7 - 0.2 * k; }
function assign(s, jobId, staffId, mode) { const j = s.jobs.find(x => x.id === jobId); const st = s.staff.find(x => x.id === staffId); if (!j || !st || (j.status !== 'queued' && j.status !== 'working')) return false; if (st.role === 'front') return false; const busy = s.jobs.filter(x => x.assigned === staffId && x.id !== jobId && x.status === 'working'); if (busy.length >= 8) return false; j.assigned = staffId; if (mode) j.mode = mode === 'quick' ? 'quick' : 'careful'; if (j.status === 'queued') j.status = 'working'; return true; }
function backlogHours(s) { let h = 0; for (const j of s.jobs) if (j.status === 'queued' || j.status === 'working') h += j.hoursLeft; return h; }
/* Bench hours a week, at each person's average speed across the trades the shop has learned. */
function capacityHours(s) { let h = 0; for (const st of s.staff) if (st.role !== 'front') h += staffHours(st) / (1.7 - 0.2 * avgSkill(s, st)); return Math.min(h, s.benches * 40); }
function staffHours(st) { return st.role === 'owner' ? 40 : roleById[st.role].hours; }

/* ---------- running costs ---------- */
function rentOf(s, b) { const nOpen = Object.keys(s.open).length; return blockById[b].rent * BAL.rentYear[year(s) - 1] * (1 + BAL.rentPerBlock * (nOpen - 1)) * (s.flags.rent_up && s.week > 52 ? 1.2 : s.flags.lease && s.week > 52 ? 1.1 : 1); }
function avgSkill(s, st) { const open = D.CATEGORIES.filter(c => s.cats[c.id]); return open.reduce((a, c) => a + (st.skills[c.id] | 0), 0) / Math.max(1, open.length); }
function wageOf(s, st) { return st.role === 'owner' ? 0 : roleById[st.role].wage * (1 + BAL.wageSkill * avgSkill(s, st) + BAL.wageYear * Math.floor((s.week - (st.since || s.week)) / D.WEEKS_PER_YEAR)); }
function yearTakings(s) { return (s.takings || []).reduce((a, b) => a + b, 0); }
function vatDue(s) { return yearTakings(s) > BAL.vatAt; }
function weeklyCosts(s) { let c = Math.max(0, s.benches - 2) * BAL.benchUpkeep; for (const b in s.open) c += rentOf(s, b); for (const st of s.staff) c += wageOf(s, st); return Math.round(c); }

/* ---------- end of week ---------- */
function endWeek(s) {
  if (s.ended || s.pending || atGate(s)) return null;
  const r = { week: s.week, income: 0, costs: 0, fixed: [], failed: [], late: [], arrived: [], returns: 0, lost: [] };
  // parts arrive
  s.orders = s.orders.filter(o => { if (o.arrive <= s.week) { s.inventory[o.part] = (s.inventory[o.part] | 0) + o.qty; r.arrived.push(o.part); s.partQ = s.partQ || {}; s.partQ[o.part] = o.q; return false; } return true; });
  // work: each staff member spends hours on assigned jobs, jobs needing parts first consume them
  for (const st of s.staff) {
    if (st.role === 'front') continue;
    let hours = staffHours(st);
    const mine = s.jobs.filter(j => j.assigned === st.id && j.status === 'working').sort((a, b) => a.due - b.due);
    for (const j of mine) {
      if (hours <= 0) break;
      if (j.waitParts.length) { if (!haveParts(s, j)) continue; for (const p of j.waitParts) s.inventory[p]--; j.partsQ = j.waitParts.reduce((q, p) => Math.min(q, (s.partQ && s.partQ[p]) || 1), 1.05); j.waitParts = []; }
      const rate = 1 / skillMult(st, j.cat) * (j.mode === 'quick' ? 1.5 : 1);
      const use = Math.min(hours, j.hoursLeft / rate); j.hoursLeft -= use * rate; hours -= use; st.xp += use * (roleById[st.role] ? roleById[st.role].learn : 0.5);
      if (st.role !== 'owner' && st.xp >= 60 && st.skills[j.cat] < 5) { st.xp = 0; st.skills[j.cat]++; log(s, `${st.name} is better at ${catById[j.cat].name.toLowerCase()}s now (${st.skills[j.cat]}/5).`); }
      if (j.hoursLeft <= 0.01) finishJob(s, j, st, r);
    }
  }
  // deadlines
  for (const j of s.jobs.slice()) if ((j.status === 'working' || j.status === 'queued') && s.week >= j.due) { if (s.week === j.due) { s.rep[j.block] = clamp(s.rep[j.block] - 2, 0, 100); r.late.push(j); s.stats.late++; } if (s.week > j.due + 3) { r.lost.push(j); s.jobs.splice(s.jobs.indexOf(j), 1); s.rep[j.block] = clamp(s.rep[j.block] - 3, 0, 100); log(s, `${j.name} took ${j.item} back unmended. Too long.`); } }
  // intake that waited too long walks
  for (const j of s.jobs.slice()) if (j.status === 'intake' && s.week - j.arrived >= 2) { s.jobs.splice(s.jobs.indexOf(j), 1); r.lost.push(j); if (!j.story) s.rep[j.block] = clamp(s.rep[j.block] - 1, 0, 100); }
  // returns from poor quality
  for (const j of s.jobs.slice()) if (j.status === 'done' && j.returnAt === s.week) { s.jobs.splice(s.jobs.indexOf(j), 1); if (j.quality < BAL.returnBelow && rand(s) < BAL.returnBelow + 0.15 - j.quality) { r.returns++; s.stats.returns++; s.cash -= Math.round(j.price * 0.5); s.rep[j.block] = clamp(s.rep[j.block] - 3, 0, 100); log(s, `${j.name} brought ${j.item} back. It failed again. Half refunded, and the street heard.`); } }
  // costs
  let costs = weeklyCosts(s);
  s.takings = (s.takings || []).concat(Math.round(r.income)).slice(-D.WEEKS_PER_YEAR);
  if (year(s) >= 2 && r.income > BAL.turnoverAt) { r.turnover = Math.round((r.income - BAL.turnoverAt) * BAL.turnover); costs += r.turnover; }
  if (vatDue(s)) { r.vat = Math.round(r.income * BAL.vat); costs += r.vat; if (!s.flags.vat) { s.flags.vat = true; log(s, `A year's takings passed ${'£' + BAL.vatAt.toLocaleString()}. The shop is registered for VAT now: a sixth of every week's takings goes to the taxman.`, 'story'); } }
  s.cash -= costs; r.costs = costs; s.stats.spent += costs;
  // reputation drifts toward neighbours and decays slowly at the top
  for (const b of D.BLOCKS) { let drift = 0; for (const a of D.ADJ[b.id]) if (s.open[a]) drift += (s.rep[a] - s.rep[b.id]) * 0.02; const fade = s.rep[b.id] > BAL.repCeil ? (s.rep[b.id] - BAL.repCeil) * BAL.repFade : 0; s.rep[b.id] = clamp(s.rep[b.id] + drift - fade - (s.open[b.id] ? 0 : 0.1), 0, 100); }
  // bankruptcy
  if (s.cash < BANKRUPT_AT) s.debtWeeks++; else s.debtWeeks = 0;
  if (s.debtWeeks >= 3) { s.ended = 'bust'; log(s, D.ENDINGS.bust.text, 'ending'); return r; }
  // next week
  s.week++; s.hoursUsed = 0;
  if (!s.unlocked && s.week > D.FREE_WEEKS) { s.week = D.FREE_WEEKS; s.gated = true; return r; } // the free year ends; the shop waits, saved, for the unlock
  if (s.week > D.CAMPAIGN_WEEKS && !s.endless) { s.week = D.CAMPAIGN_WEEKS; s.pending = { ending: true }; return r; }
  if (s.week % D.WEEKS_PER_YEAR === 1 && s.week > 1) log(s, `Year ${year(s)} begins. Cash £${Math.round(s.cash)}, reputation on Hollow Lane ${Math.round(s.rep.hollow)}.`, 'story');
  spawnCustomers(s);
  s.week_log = [r]; return r;
}
function finishJob(s, j, st, r) {
  const f = catById[j.cat].faultById[j.diag];
  const correct = j.diag === j.fault;
  if (!correct) { // wrong diagnosis: parts wasted, start over on the real fault
    j.diag = j.fault; const real = catById[j.cat].faultById[j.fault]; j.hoursLeft = real.hours * 2.2; j.waitParts = real.parts.slice(); j.misdiag = (j.misdiag | 0) + 1; r.failed.push(j); s.stats.failed++; s.rep[j.block] = clamp(s.rep[j.block] - (1 + Math.round(BAL.misdiagRep * j.attach)), 0, 100); j.due = Math.max(j.due, s.week + 1);
    if (j.misdiag >= 2) { s.jobs.splice(s.jobs.indexOf(j), 1); s.rep[j.block] = clamp(s.rep[j.block] - 5, 0, 100); log(s, `Could not fix ${j.item} for ${j.name}. It went in the bin after all.`); }
    else log(s, `${j.item}: it was not the ${f.name.toLowerCase()}. Back on the bench.`);
    return;
  }
  const q = clamp(0.45 + 0.09 * (st.skills[j.cat] | 0) + (j.mode === 'quick' ? BAL.quickQ : BAL.careQ) + ((j.partsQ || 1) - 1) * 1.5 - 0.05 * (f.diff - 1), 0.1, 1);
  j.quality = j.mode === 'quick' ? Math.min(q, BAL.quickCap) : q; j.status = 'done'; j.returnAt = s.week + 2 + Math.floor(rand(s) * 5);
  const late = s.week > j.due; const earlyBonus = !late && s.week < j.due ? 1 : 0;
  s.cash += j.price; s.stats.earned += j.price; r.income += j.price; s.stats.fixed++; s.stats.saved += j.replace; r.fixed.push(j);
  let dRep = 1 + earlyBonus + (q >= 0.8 ? 1 : 0) + (j.attach >= 0.8 ? 1 : 0) - (late ? 3 : 0) - (q < 0.5 ? 1 : 0);
  if (j.story) dRep += 2;
  if (dRep > 0) dRep *= clamp((100 - s.rep[j.block]) / BAL.repHead, 0.1, 1);
  s.rep[j.block] = clamp(s.rep[j.block] + dRep, 0, 100);
  if (j.story) log(s, `${j.name}: ${j.item} mended${late ? ', late' : ''}.`, 'story');
}
/* ---------- story & ending ---------- */
function resolveBeat(s, choice) {
  if (!s.pending || s.pending.ending) return false;
  const arc = arcById[s.pending.arc]; const beat = arc.beats[s.pending.beat]; const c = beat.choices[choice] || beat.choices[0];
  const e = c.eff || {};
  if (e.rep) s.rep.hollow = clamp(s.rep.hollow + e.rep, 0, 100);
  if (e.cash) { s.cash += e.cash; if (e.cash > 0) s.stats.earned += e.cash; else s.stats.spent -= e.cash; }
  if (e.flag) s.flags[e.flag] = true; if (e.bench) s.benches = Math.min(8, s.benches + e.bench);
  if (e.hire && s.staff.length < s.benches + 1) s.staff.push(newStaff(s, e.hire));
  if (e.train) for (const st of s.staff) for (const c of D.CATEGORIES) if (s.cats[c.id]) st.skills[c.id] = Math.min(5, st.skills[c.id] + e.train);
  if (e.parts) for (const p of ['screen', 'battery', 'port', 'cap', 'speaker', 'psu']) s.inventory[p] = (s.inventory[p] | 0) + 5;
  if (arc.id === 'baker' && s.pending.beat === 1) s.flags.bakersign = true;
  if (e.log) log(s, e.log, 'story');
  s.pending = null; return true;
}
/* FixEmpire needs four streets and five staff, or three and four with outside money behind you (the investor, the borough or the hospital). */
function backed(s) { return !!(s.flags.funded || s.flags.council_chain || s.flags.nhs_contract); }
function endingOptions(s) {
  const blocks = Object.keys(s.open).length, staff = s.staff.length;
  return { empire: (blocks >= 4 && staff >= 5) || (backed(s) && blocks >= 3 && staff >= 4), beloved: s.rep.hollow >= 70, backed: backed(s) };
}
function chooseEnding(s, id) {
  if (!s.pending || !s.pending.ending) return false;
  const o = endingOptions(s); if (id === 'empire' && !o.empire) return false; if (id === 'beloved' && !o.beloved) return false;
  if (id !== 'empire' && id !== 'beloved') id = o.beloved ? 'beloved' : 'empire';
  s.ended = id; s.pending = null; log(s, D.ENDINGS[id].text, 'ending'); return true;
}
/* Google Play said the unlock is owned. Opens the streets, and a shop held at the end of the free year carries on into year two. */
function unlock(s) { if (s.unlocked && !s.gated) return false; s.unlocked = true; if (s.gated) { s.gated = false; s.week = D.FREE_WEEKS + 1; s.hoursUsed = 0; log(s, `Year 2 begins. Cash £${Math.round(s.cash)}, reputation on Hollow Lane ${Math.round(s.rep.hollow)}.`, 'story'); spawnCustomers(s); } return true; }
function goEndless(s) { if (!s.ended || s.ended === 'bust') return false; s.endless = true; s.ended = null; s.week++; s.hoursUsed = 0; spawnCustomers(s); log(s, 'Endless mode. The street keeps bringing things.', 'story'); return true; }
function score(s) { return Math.round(s.stats.fixed * 10 + s.stats.saved / 10 + Object.values(s.rep).reduce((a, b) => a + b, 0) + s.cash / 100 - s.stats.failed * 5); }

/* ---------- diagnosability validator: can each fault be isolated from each of its symptoms within MAX_TESTS tests? ---------- */
function validateDiagnosis() {
  const problems = [];
  for (const cat of D.CATEGORIES) {
    const tests = Object.keys(cat.tests);
    for (const f of cat.faults) for (const sym of f.sym) {
      const start = cat.faults.filter(x => x.sym.includes(sym));
      let best = Infinity;
      const subsets = [[]]; for (const t of tests) for (const sub of subsets.slice()) if (sub.length < MAX_TESTS) subsets.push(sub.concat(t));
      for (const sub of subsets) { const left = start.filter(x => sub.every(t => x.t[t] === f.t[t])); if (left.length === 1) best = Math.min(best, sub.length); }
      if (best === Infinity) problems.push(`${cat.id}/${f.id} via "${sym}" cannot be isolated`);
    }
  }
  return problems;
}

/* ---------- save hygiene ---------- */
// Older builds wrote a year-one stop line to the log; saves from them load without it.
const RETIRED_LOG = 'The first year ends here.';
const num = (v, def, lo, hi) => { v = +v; if (!isFinite(v)) v = def; return clamp(v, lo, hi); };
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = newState({ seed: raw.seed }); s.jobs = []; s.log = []; s.arcs = {}; s.flags = {}; s.staff = []; s.inventory = {}; s.orders = []; s.open = {}; s.cats = {};
  s.week = Math.round(num(raw.week, 1, 1, 100000)); s.cash = num(raw.cash, START_CASH, -1e6, 1e9); s.nextId = Math.round(num(raw.nextId, 1, 1, 1e9)); s.benches = Math.round(num(raw.benches, 2, 1, 8));
  s.hoursUsed = num(raw.hoursUsed, 0, 0, 200); s.debtWeeks = Math.round(num(raw.debtWeeks, 0, 0, 3));
  for (const b of D.BLOCKS) s.rep[b.id] = num(raw.rep && raw.rep[b.id], b.id === 'hollow' ? 25 : 10, 0, 100);
  if (raw.open) for (const b in raw.open) if (blockById[b] && raw.open[b]) s.open[b] = true; if (!s.open.hollow) s.open.hollow = true;
  if (raw.cats) for (const c in raw.cats) if (catById[c] && raw.cats[c]) s.cats[c] = true; if (!Object.keys(s.cats).length) { s.cats.kettle = true; s.cats.lamp = true; }
  if (Array.isArray(raw.staff)) for (const x of raw.staff.slice(0, 9)) { if (!x || (x.role !== 'owner' && !roleById[x.role])) continue; const st = { id: Math.round(num(x.id, s.nextId++, 1, 1e9)), name: String(x.name || 'Staff').slice(0, 24), role: x.role, skills: {}, xp: num(x.xp, 0, 0, 1000), since: Math.round(num(x.since, s.week, 1, s.week)) }; for (const c of D.CATEGORIES) st.skills[c.id] = Math.round(num(x.skills && x.skills[c.id], 0, 0, 5)); s.staff.push(st); }
  if (!s.staff.some(x => x.role === 'owner')) { const o = { id: s.nextId++, name: 'You', role: 'owner', skills: {}, xp: 0 }; for (const c of D.CATEGORIES) o.skills[c.id] = 1; s.staff.unshift(o); }
  if (raw.inventory) for (const p in raw.inventory) if (D.PARTS[p]) { const n = Math.round(num(raw.inventory[p], 0, 0, 999)); if (n) s.inventory[p] = n; }
  if (raw.partQ && typeof raw.partQ === 'object') { s.partQ = {}; for (const p in raw.partQ) if (D.PARTS[p]) s.partQ[p] = num(raw.partQ[p], 1, 0.5, 1.2); }
  if (Array.isArray(raw.orders)) s.orders = raw.orders.filter(o => o && D.PARTS[o.part]).slice(0, 100).map(o => ({ part: o.part, qty: Math.round(num(o.qty, 1, 1, 50)), arrive: Math.round(num(o.arrive, s.week, 1, 1e6)), q: num(o.q, 1, 0.5, 1.2) }));
  if (Array.isArray(raw.jobs)) for (const j of raw.jobs.slice(0, 80)) {
    if (!j || !catById[j.cat]) continue; const cat = catById[j.cat]; if (!cat.faultById[j.fault]) continue;
    const st = ['intake', 'queued', 'working', 'done'].includes(j.status) ? j.status : 'intake';
    const job = { id: Math.round(num(j.id, s.nextId++, 1, 1e9)), cat: j.cat, item: String(j.item || 'an item').slice(0, 60), name: String(j.name || 'A customer').slice(0, 40), block: blockById[j.block] ? j.block : 'hollow', fault: j.fault, sym: cat.faultById[j.fault].sym.includes(j.sym) ? j.sym : cat.faultById[j.fault].sym[0], attach: num(j.attach, 0.5, 0, 1), replace: Math.round(num(j.replace, cat.replace[0], 1, 9999)), tests: {}, diag: cat.faultById[j.diag] ? j.diag : null, status: st, price: Math.round(num(j.price, 0, 0, 9999)), due: Math.round(num(j.due, 0, 0, 1e6)), promised: Math.round(num(j.promised, 1, 1, 4)), assigned: null, hoursLeft: num(j.hoursLeft, 0, 0, 500), quality: num(j.quality, 0, 0, 1), mode: j.mode === 'quick' ? 'quick' : 'careful', arrived: Math.round(num(j.arrived, s.week, 1, 1e6)), story: j.story === true, waitParts: Array.isArray(j.waitParts) ? j.waitParts.filter(p => D.PARTS[p]).slice(0, 6) : [], misdiag: Math.round(num(j.misdiag, 0, 0, 2)), returnAt: j.returnAt == null ? undefined : Math.round(num(j.returnAt, 0, 0, 1e6)), partsQ: num(j.partsQ, 1, 0.5, 1.2) };
    if (j.tests && typeof j.tests === 'object') for (const t in j.tests) if (cat.tests[t]) job.tests[t] = cat.faultById[j.fault].t[t];
    if (st !== 'intake' && !job.diag) job.status = 'intake';
    if (st === 'working' && s.staff.some(x => x.id === j.assigned && x.role !== 'front')) job.assigned = j.assigned; else if (st === 'working') job.status = 'queued';
    s.jobs.push(job);
  }
  if (Array.isArray(raw.takings)) s.takings = raw.takings.slice(-D.WEEKS_PER_YEAR).map(v => Math.round(num(v, 0, 0, 1e6)));
  if (raw.arcs) for (const a in raw.arcs) if (arcById[a]) s.arcs[a] = Math.round(num(raw.arcs[a], 0, 0, 3));
  if (raw.flags) for (const f in raw.flags) if (raw.flags[f]) s.flags[String(f).slice(0, 32)] = true;
  for (const k in s.stats) s.stats[k] = Math.round(num(raw.stats && raw.stats[k], 0, 0, 1e9));
  if (Array.isArray(raw.log)) s.log = raw.log.filter(l => l && typeof l.t === 'string' && !l.t.startsWith(RETIRED_LOG)).slice(-LOG_CAP).map(l => ({ w: Math.round(num(l.w, 1, 1, 1e6)), t: String(l.t).slice(0, 500), k: typeof l.k === 'string' ? l.k.slice(0, 10) : 'note' }));
  s.unlocked = false; s.endless = raw.endless === true; // the unlock is Google Play's answer, never the save's: the game sets it
  s.gated = raw.gated === true && s.week === D.FREE_WEEKS; // held at the end of the free year
  s.ended = ['beloved', 'empire', 'bust'].includes(raw.ended) ? raw.ended : null;
  if (raw.pending && typeof raw.pending === 'object') { if (raw.pending.ending) s.pending = { ending: true }; else if (arcById[raw.pending.arc] && arcById[raw.pending.arc].beats[raw.pending.beat | 0]) s.pending = { arc: raw.pending.arc, beat: raw.pending.beat | 0 }; }
  if (!s.log.length) log(s, 'The shop, again.', 'story');
  return s;
}

const ENGINE = { D, BAL, unlock, atGate, streetLocked, backed, rentOf, wageOf, weeklyCosts, avgSkill, yearTakings, vatDue, catById, blockById, roleById, supById, arcById, TEST_HOURS, BENCH_COST, HIRE_COST, TRAIN_COST, MAX_TESTS, START_CASH, newState, log, year, rand, spawnCustomers, addJob, candidates, mostLikely, diagHours, runTest, diagnose, decline, willingness, quote, partPrice, order, partsNeeded, haveParts, hire, fire, train, buyBench, unlockCat, openBlock, skillMult, assign, staffHours, backlogHours, capacityHours, endWeek, resolveBeat, endingOptions, chooseEnding, goEndless, score, validateDiagnosis, sanitize, attachWord, clamp };
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE; else root.REPAIR = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
