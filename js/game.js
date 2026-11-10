/* Mended — UI, save, turn flow. The numbers live in engine.js. */
(function () {
'use strict';
const E = window.REPAIR, D = E.D;
const VERSION = '1.1.0', SAVE_KEY = 'mended.v1', BACKUP_KEY = 'mended.v1.backup';
const $ = id => document.getElementById(id);
let S = null, profile = null, tab = 'counter', lastLog = 0, unread = 0;
/* The one-time unlock (Google Play in the Play edition, see js/billing.js). The first year and two streets are free.
   The save never carries the unlock: only Play's answer (cached by billing.js) does. */
const BILL = window.createBilling({ storageKey: 'mended.unlock', productId: 'full_unlock' });
const owned = () => !!BILL.state.owned;
let unlockReason = null;

function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { try { localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || ''); } catch (e2) { } }
  profile = { large: !!(raw && raw.settings && raw.settings.large), contrast: !!(raw && raw.settings && raw.settings.contrast) };
  S = raw && raw.run ? E.sanitize(raw.run) : null; if (!S) S = E.newState();
  if (owned()) E.unlock(S);
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, run: S, settings: { large: profile.large, contrast: profile.contrast } })); } catch (e) { } }
const money = n => (n < 0 ? '−£' : '£') + Math.abs(Math.round(n)).toLocaleString();
const cat = id => E.catById[id];
let toastT = 0; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- render ---------- */
function render() {
  $('hdr-week').textContent = `Week ${S.week} · Year ${E.year(S)}${S.endless ? ' · endless' : ''}`;
  $('hdr-cash').textContent = money(S.cash); $('hdr-cash').classList.toggle('neg', S.cash < 0);
  $('hdr-rep').textContent = Math.round(S.rep.hollow);
  $('hdr-hours').textContent = `${E.diagHours(S) - S.hoursUsed}`;
  const intake = S.jobs.filter(j => j.status === 'intake').length, benchJobs = S.jobs.filter(j => j.status === 'queued' || j.status === 'working');
  const unassigned = benchJobs.filter(j => !j.assigned).length; const need = E.partsNeeded(S); let short = 0; for (const p in need) { const inc = S.orders.filter(o => o.part === p).reduce((a, o) => a + o.qty, 0); if ((S.inventory[p] | 0) + inc < need[p]) short++; }
  badge('badge-counter', intake); badge('badge-bench', unassigned); badge('badge-parts', short); badge('badge-story', tab === 'story' ? 0 : unread);
  $('foot-info').textContent = `${intake} at the counter · ${benchJobs.length} on the bench · ${Math.round(E.backlogHours(S))}h of work, ${Math.round(E.capacityHours(S))}h/week`;
  const gate = E.atGate(S); $('btn-endweek').disabled = !!S.ended || !!S.pending; $('btn-endweek').textContent = gate ? 'Start year two' : 'End the week';
  if (gate) $('foot-info').textContent = 'The first year is done. Years two and three come with the full game.';
  if (tab === 'counter') renderCounter(); if (tab === 'bench') renderBench(); if (tab === 'parts') renderParts(); if (tab === 'shop') renderShop(); if (tab === 'story') renderStory();
}
function badge(id, n) { const b = $(id); b.hidden = !n; b.textContent = n; }
function setTab(t) { tab = t; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t)); if (t === 'story') unread = 0; render(); }

function renderCounter() {
  const box = $('counter'); box.innerHTML = '';
  const jobs = S.jobs.filter(j => j.status === 'intake');
  if (!jobs.length) { box.innerHTML = '<div class="empty">Nobody at the counter. End the week to open up again.</div>'; return; }
  for (const j of jobs) {
    const c = cat(j.cat); const cands = E.candidates(S, j); const nTests = Object.keys(j.tests).length;
    const card = el(`<div class="card ${j.story ? 'story' : ''}"><div class="job-head"><div><div class="job-item">${c.icon} ${esc(j.item)}</div><div class="job-who">${esc(j.name)} · ${E.blockById[j.block].name}${j.story ? ' · story' : ''}</div></div><div class="job-who">arrived wk ${j.arrived}</div></div>
      <div class="sym">“${esc(j.sym)}”</div>
      <div class="facts"><span class="fact">Replacement about ${money(j.replace)}</span><span class="fact">${E.attachWord(j.attach)}</span><span class="fact">${cands.length} possible fault${cands.length === 1 ? '' : 's'}</span></div>
      <h3>Tests (${E.TEST_HOURS}h each, ${E.MAX_TESTS - nTests} left)</h3><div class="tests"></div><h3>Diagnosis</h3><div class="cands"></div><div class="quote-box"></div><div class="row-btns"><button class="btn small danger" data-act="decline">Decline the job</button></div></div>`);
    const tests = card.querySelector('.tests');
    for (const t in c.tests) { const done = j.tests[t] !== undefined; const b = el(`<button class="btn small ${done ? 'done' : ''}">${esc(c.tests[t])}${done ? ': ' + esc(j.tests[t]) : ''}</button>`); b.disabled = done || nTests >= E.MAX_TESTS || S.hoursUsed + E.TEST_HOURS > E.diagHours(S) || cands.length <= 1; b.onclick = () => { if (E.runTest(S, j.id, t)) { save(); render(); } }; tests.appendChild(b); }
    const cl = card.querySelector('.cands');
    for (const f of cands) { const b = el(`<button class="btn small cand ${j.diag === f.id ? 'chosen' : ''}" data-f="${f.id}"><span>${esc(f.name)}</span><small>${f.parts.length ? f.parts.map(p => D.PARTS[p][0]).join(', ') : 'no parts'} · ${f.hours * 2.2 | 0}h</small></button>`); b.onclick = () => { E.diagnose(S, j.id, f.id); render(); }; cl.appendChild(b); }
    if (j.diag && cands.some(f => f.id === j.diag)) {
      const q = card.querySelector('.quote-box'); const def = Math.round(j.replace * 0.5);
      const hint = cands.length === 1 ? 'You are sure of the fault, so they will pay a little more.' : cands.length >= 3 ? `Still ${cands.length} possible faults. Unsure quotes get haggled down; a test or two helps.` : '';
      q.innerHTML = (hint ? `<p class="muted small">${hint}</p>` : '') + `<div class="quote"><div><label>Your price <span class="price-big" id="pv-${j.id}">${money(def)}</span></label><input type="range" min="5" max="${Math.max(10, j.replace * 1.3 | 0)}" value="${def}" id="pr-${j.id}"></div><div><label>Promised in</label><select id="pw-${j.id}"><option value="1">1 week</option><option value="2" selected>2 weeks</option><option value="3">3 weeks</option><option value="4">4 weeks</option></select></div></div><div class="row-btns"><button class="btn primary">Quote it</button></div>`;
      const r = q.querySelector('input'); r.oninput = () => { $('pv-' + j.id).textContent = money(r.value); };
      q.querySelector('.btn').onclick = () => { const res = E.quote(S, j.id, +r.value, +q.querySelector('select').value); if (!res) return; toast(res.accepted ? `${j.name} agreed. On the bench.` : res.reason === 'price' ? `${j.name} laughed at the price and left.` : `${j.name} could not wait that long.`); save(); render(); };
    } else card.querySelector('.quote-box').innerHTML = '<p class="muted small">Pick the fault you believe it is. A wrong call wastes the parts and the hours.</p>';
    card.querySelector('[data-act=decline]').onclick = () => { E.decline(S, j.id); save(); render(); };
    box.appendChild(card);
  }
}
function renderBench() {
  const box = $('bench'); box.innerHTML = '';
  const jobs = S.jobs.filter(j => j.status === 'queued' || j.status === 'working').sort((a, b) => a.due - b.due);
  if (!jobs.length) { box.innerHTML = '<div class="empty">The bench is clear.</div>'; return; }
  const staff = S.staff.filter(x => x.role !== 'front');
  for (const j of jobs) {
    const c = cat(j.cat), f = c.faultById[j.diag]; const have = E.haveParts(S, j); const inc = j.waitParts.every(p => (S.inventory[p] | 0) > 0 || S.orders.some(o => o.part === p));
    const lateIn = j.due - S.week;
    const card = el(`<div class="card ${j.story ? 'story' : ''}"><div class="job-head"><div><div class="job-item">${c.icon} ${esc(j.item)}</div><div class="job-who">${esc(j.name)} · ${esc(f.name)} · ${money(j.price)}</div></div><div class="job-who">${lateIn < 0 ? '<span class="fact bad">late</span>' : 'due wk ' + j.due}</div></div>
      <div class="facts"><span class="fact">${Math.ceil(j.hoursLeft)}h left</span><span class="fact ${j.waitParts.length ? (have ? 'good' : inc ? 'warn' : 'bad') : 'good'}">${j.waitParts.length ? (have ? 'parts in stock' : inc ? 'parts on order' : 'needs ' + j.waitParts.map(p => D.PARTS[p][0]).join(', ')) : 'no parts needed'}</span>${j.misdiag ? '<span class="fact bad">misdiagnosed once</span>' : ''}</div>
      <div class="quote"><div><label>Assigned to</label><select class="asg"><option value="">Nobody</option>${staff.map(x => `<option value="${x.id}" ${j.assigned === x.id ? 'selected' : ''}>${esc(x.name)} (${c.name.toLowerCase()} ${x.skills[j.cat]}/5)</option>`).join('')}</select></div><div><label>Fix</label><select class="mode"><option value="careful" ${j.mode === 'careful' ? 'selected' : ''}>Careful</option><option value="quick" ${j.mode === 'quick' ? 'selected' : ''}>Quick</option></select></div></div>
      ${j.waitParts.length && !have && !inc ? '<div class="row-btns"><button class="btn small" data-act="rush">Rush the parts (same day)</button><button class="btn small" data-act="std">Order standard (next week)</button></div>' : ''}</div>`);
    card.querySelector('.asg').onchange = e => { const id = +e.target.value; if (!id) { j.assigned = null; j.status = 'queued'; } else E.assign(S, j.id, id, card.querySelector('.mode').value); save(); render(); };
    card.querySelector('.mode').onchange = e => { j.mode = e.target.value === 'quick' ? 'quick' : 'careful'; save(); };
    card.querySelectorAll('[data-act]').forEach(b => { b.onclick = () => { const sup = b.dataset.act; let ok = true; for (const p of j.waitParts) if ((S.inventory[p] | 0) === 0) ok = E.order(S, sup, p, 1) && ok; toast(ok ? 'Ordered.' : 'Not enough cash for the parts.'); save(); render(); }; });
    box.appendChild(card);
  }
}
function renderParts() {
  const box = $('parts'); box.innerHTML = '';
  const need = E.partsNeeded(S); const ids = Object.keys(D.PARTS).filter(p => need[p] || S.inventory[p] || S.orders.some(o => o.part === p));
  const all = Object.keys(D.PARTS);
  const sup = D.SUPPLIERS.map(s => `<div class="card"><h2>${s.name}</h2><p class="muted small">${s.desc}</p><p class="small">${s.lead === 0 ? 'Arrives today' : 'Arrives in ' + s.lead + ' week' + (s.lead > 1 ? 's' : '')} · prices ×${s.priceMult} · quality ${Math.round(s.quality * 100)}%</p></div>`).join('');
  const rows = (list, title) => `<div class="card"><h2>${title}</h2><table class="parts">${list.map(p => { const inc = S.orders.filter(o => o.part === p).reduce((a, o) => a + o.qty, 0); return `<tr><td><b>${D.PARTS[p][0]}</b><br><span class="muted small">have ${S.inventory[p] | 0}${inc ? ' · ' + inc + ' coming' : ''}${need[p] ? ' · need ' + need[p] : ''}</span></td><td>${D.SUPPLIERS.map(s => `<button class="btn small" data-p="${p}" data-s="${s.id}" title="${s.name}">${money(E.partPrice(s.id, p))}<br><small>${s.lead === 0 ? 'today' : s.lead + 'wk'}</small></button>`).join(' ')}</td></tr>`; }).join('')}</table></div>`;
  box.innerHTML = (ids.length ? rows(ids, 'Needed and in stock') : '<div class="empty">Nothing needed, nothing in stock.</div>') + rows(all.filter(p => !ids.includes(p)), 'Catalogue') + sup;
  box.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { if (E.order(S, b.dataset.s, b.dataset.p, 1)) { save(); render(); } else toast('Not enough cash.'); }; });
}
function renderShop() {
  const box = $('shop'); box.innerHTML = '';
  const staff = el(`<div class="card"><h2>Staff · ${S.staff.length} of ${S.benches + 1} places</h2></div>`);
  for (const st of S.staff) {
    const r = E.roleById[st.role]; const row = el(`<div class="staff"><div><b>${esc(st.name)}</b> <span class="muted small">${r ? r.name + ' · ' + money(r.wage) + '/wk' : 'Owner'}</span></div><div>${st.role !== 'owner' ? '<button class="btn small danger" data-fire>Let go</button>' : ''}</div><div class="skills">${D.CATEGORIES.filter(c => S.cats[c.id]).map(c => `<span class="skill">${c.icon} <b>${st.skills[c.id]}</b>/5 ${st.skills[c.id] < 5 ? `<button class="btn small" data-train="${c.id}">+1 (${money(E.TRAIN_COST)})</button>` : ''}</span>`).join('')}</div></div>`);
    row.querySelectorAll('[data-train]').forEach(b => { b.onclick = () => { if (E.train(S, st.id, b.dataset.train)) { save(); render(); } else toast('Not enough cash.'); }; });
    const f = row.querySelector('[data-fire]'); if (f) f.onclick = () => { if (confirm(`Let ${st.name} go?`)) { E.fire(S, st.id); save(); render(); } };
    staff.appendChild(row);
  }
  const hire = el(`<div class="row-btns">${D.ROLES.map(r => `<button class="btn small" data-hire="${r.id}" title="${r.desc}">Hire ${r.name.toLowerCase()} (${money(E.HIRE_COST)})</button>`).join('')}</div>`);
  hire.querySelectorAll('[data-hire]').forEach(b => { b.onclick = () => { const st = E.hire(S, b.dataset.hire); if (st) { toast(`${st.name} starts Monday.`); save(); render(); } else toast(S.staff.length >= S.benches + 1 ? 'No bench free. Build one.' : 'Not enough cash.'); }; });
  staff.appendChild(el('<p class="muted small">' + D.ROLES.map(r => `<b>${r.name}</b>: ${r.desc}`).join('<br>') + '</p>')); staff.appendChild(hire); box.appendChild(staff);
  const bench = el(`<div class="card"><h2>Benches · ${S.benches}</h2><p class="muted small">Each bench is a place for one more pair of hands.</p><div class="row-btns"><button class="btn small">Build a bench (${money(E.BENCH_COST * S.benches)})</button></div></div>`);
  bench.querySelector('.btn').onclick = () => { if (E.buyBench(S)) { save(); render(); } else toast('Not enough cash, or no room.'); }; box.appendChild(bench);
  const trades = el(`<div class="card"><h2>Trades</h2><div class="row-btns">${D.CATEGORIES.map(c => S.cats[c.id] ? `<span class="fact good">${c.icon} ${c.name}</span>` : `<button class="btn small" data-cat="${c.id}">${c.icon} Learn ${c.name.toLowerCase()} (${money(c.unlockCost)})</button>`).join('')}</div></div>`);
  trades.querySelectorAll('[data-cat]').forEach(b => { b.onclick = () => { if (E.unlockCat(S, b.dataset.cat)) { save(); render(); } else toast('Not enough cash.'); }; }); box.appendChild(trades);
  const blocks = el(`<div class="card"><h2>Streets</h2></div>`);
  for (const b of D.BLOCKS) { const open = S.open[b.id]; const adj = Object.keys(S.open).some(o => D.ADJ[o].includes(b.id)); const row = el(`<div class="staff"><div><b>${b.name}</b> <span class="muted small">${b.desc}</span><div class="meter"><i style="width:${S.rep[b.id]}%"></i></div><span class="small">reputation ${Math.round(S.rep[b.id])}${open ? ' · rent ' + money(b.rent) + '/wk' : ' · needs ' + b.needRep}</span></div><div>${open ? '<span class="fact good">open</span>' : adj && E.streetLocked(S) ? `<button class="btn small" data-full>Full game</button>` : adj ? `<button class="btn small" data-open="${b.id}">Open (${money(b.cost)})</button>` : '<span class="fact">not adjacent</span>'}</div></div>`); const fb = row.querySelector('[data-full]'); if (fb) fb.onclick = () => showUnlock('street'); const ob = row.querySelector('[data-open]'); if (ob) ob.onclick = () => { if (E.openBlock(S, b.id)) { save(); render(); } else toast('Not enough reputation or cash there yet.'); }; blocks.appendChild(row); }
  if (E.streetLocked(S)) blocks.appendChild(el(`<p class="muted small">The free year has room for ${D.FREE_STREETS} streets. The full game opens all ${D.BLOCKS.length}.</p>`));
  box.appendChild(blocks);
}
function renderStory() {
  renderUnlockCard();
  const st = S.stats; $('story-stats').innerHTML = [['items mended', st.fixed], ['kept from landfill', money(st.saved)], ['misdiagnosed', st.failed], ['late', st.late], ['returned', st.returns], ['earned', money(st.earned)]].map(p => `<div class="stat"><b>${p[1]}</b><span>${p[0]}</span></div>`).join('');
  const ol = $('log'); ol.innerHTML = ''; for (const l of S.log.slice().reverse()) { const li = el(`<li class="${l.k}"><div class="ld">week ${l.w}</div><div></div></li>`); li.lastChild.textContent = l.t; ol.appendChild(li); }
}

/* ---------- turn flow & modals ---------- */
function show(id) { $(id).hidden = false; } function hide(id) { $(id).hidden = true; }
function endWeek() {
  if (S.ended || S.pending) return;
  if (E.atGate(S)) return showUnlock('gate');
  const r = E.endWeek(S); save();
  if (r) {
    $('week-date').textContent = `Week ${r.week}`;
    const lines = [];
    if (r.fixed.length) lines.push(`<p><b>Mended:</b> ${r.fixed.map(j => esc(j.item) + ' (' + money(j.price) + ')').join(', ')}.</p>`);
    if (r.failed.length) lines.push(`<p class="small" style="color:var(--red)"><b>Wrong diagnosis:</b> ${r.failed.map(j => esc(j.item)).join(', ')}. Back on the bench with the real fault.</p>`);
    if (r.late.length) lines.push(`<p class="small" style="color:var(--accent)"><b>Late:</b> ${r.late.map(j => esc(j.item)).join(', ')}.</p>`);
    if (r.lost.length) lines.push(`<p class="small" style="color:var(--red)"><b>Walked away:</b> ${r.lost.map(j => esc(j.name)).join(', ')}.</p>`);
    if (r.returns) lines.push(`<p class="small" style="color:var(--red)">${r.returns} repair${r.returns > 1 ? 's' : ''} came back failed. Half refunded.</p>`);
    if (r.arrived.length) lines.push(`<p class="small">Parts arrived: ${[...new Set(r.arrived)].map(p => D.PARTS[p][0]).join(', ')}.</p>`);
    const tax = (r.vat || 0) + (r.turnover || 0);
    lines.push(`<p><b>Takings ${money(r.income)}</b> · rent and wages ${money(r.costs - tax)}${r.turnover ? ' · landlord\'s share ' + money(r.turnover) : ''}${r.vat ? ' · VAT ' + money(r.vat) : ''} · cash now <b>${money(S.cash)}</b></p>`);
    if (S.gated) lines.push(`<p class="note">That was the last week of your first year on Hollow Lane. Years two and three, the rest of the streets and every story's ending come with the full game. Your shop is saved and waits for you.</p>`);
    if (S.cash < 0) lines.push(`<p class="small" style="color:var(--red)">In the red. Three weeks below −£600 and the shop closes.</p>`);
    $('week-body').innerHTML = lines.join('');
    if (!S.ended && !S.pending) show('modal-week'); // a story beat or the ending takes the stage instead
  }
  afterTurn();
}
function afterTurn() {
  render();
  if (S.ended) return showEnding();
  if (S.pending && S.pending.ending) return showEndingChoice();
  if (S.pending) return showBeat();
  if (E.atGate(S) && $('modal-week').hidden) showUnlock('gate');
}

/* ---------- the unlock ---------- */
function showUnlock(reason) { unlockReason = reason; renderUnlock(); show('modal-unlock'); }
function unlockMsg() {
  const b = BILL.state;
  if (owned()) return 'The full game is yours. Thank you.';
  if (!b.available) return 'The full game is unlocked in the Google Play edition of Mended.';
  if (b.pending) return 'Your purchase is waiting for the payment to clear. Year two opens as soon as Google Play confirms it.';
  if (b.error) return b.error;
  if (b.busy) return 'Waiting for Google Play…';
  return '';
}
function renderUnlock() {
  const b = BILL.state, msg = unlockMsg(), note = $('u-note');
  $('u-sub').textContent = unlockReason === 'gate' ? `The end of year one · ${money(S.cash)} in the till` : unlockReason === 'street' ? 'A third street' : 'The full game';
  note.hidden = !msg; note.textContent = msg;
  $('u-buy').textContent = b.price ? `Unlock the full game · ${b.price}` : 'Unlock the full game';
  $('u-buy').disabled = !b.available || b.busy || b.pending || owned(); $('u-restore').disabled = !b.available || b.busy;
  $('u-later').textContent = unlockReason === 'gate' ? 'Not now (your shop stays saved)' : 'Not now';
  renderUnlockCard();
}
function renderUnlockCard() {
  const c = $('unlock-card'); if (!c) return;
  const msg = unlockMsg();
  c.innerHTML = owned() ? `<h2>Full game</h2><p class="small">${msg}</p>` : `<h2>Full game</h2><p class="small">Your first year and ${D.FREE_STREETS} streets are free. The full game adds years two and three, all ${D.BLOCKS.length} streets, the endings of all ${D.ARCS.length} stories and endless mode. One purchase through Google Play.</p>${msg ? `<p class="note">${msg}</p>` : ''}<div class="row-btns"><button class="btn primary" id="btn-unlock-card">See the full game</button></div>`;
  const b = $('btn-unlock-card'); if (b) b.onclick = () => showUnlock('more');
}
function unlockedNow() {
  const wasGated = E.atGate(S); E.unlock(S); save(); renderUnlockCard();
  if (!$('modal-unlock').hidden) { hide('modal-unlock'); toast(wasGated ? 'The full game is yours. Year two begins.' : 'The full game is yours. Thank you.'); unlockReason = null; }
  afterTurn();
}
function showBeat() {
  const arc = E.arcById[S.pending.arc], beat = arc.beats[S.pending.beat];
  $('story-date').textContent = `Week ${S.week} · ${arc.name}`; $('story-title').textContent = arc.name; $('story-text').textContent = beat.text;
  const box = $('story-choices'); box.innerHTML = '';
  beat.choices.forEach((c, i) => { const b = el(`<button class="btn choice"></button>`); b.textContent = c.label; b.onclick = () => { E.resolveBeat(S, i); hide('modal-story'); unread++; save(); render(); }; box.appendChild(b); });
  show('modal-story');
}
function showEndingChoice() {
  const o = E.endingOptions(S); $('ending-date').textContent = `Week ${S.week} · the end of year three`; $('ending-title').textContent = 'What did you become?';
  $('ending-text').textContent = 'Three years of other people\'s broken things. The landlord, the investor, the council and the street all have an opinion. Yours is the one that counts.';
  const box = $('ending-choices'); box.innerHTML = '';
  const opts = [['beloved', 'Stay the shop on Hollow Lane', o.beloved ? '' : ' (needs Hollow Lane reputation 70)'], ['empire', 'Become FixEmpire', o.empire ? '' : o.backed ? ' (needs 3 streets and 4 staff, with your backers)' : ' (needs 4 streets and 5 staff, or 3 and 4 with backers)']];
  for (const [id, label, why] of opts) { const b = el(`<button class="btn choice"></button>`); b.textContent = label + why; b.disabled = !!why; b.onclick = () => { E.chooseEnding(S, id); save(); showEnding(); }; box.appendChild(b); }
  if (!o.beloved && !o.empire) { const b = el(`<button class="btn choice">Let the street decide</button>`); b.onclick = () => { E.chooseEnding(S, 'any'); save(); showEnding(); }; box.appendChild(b); }
  $('ending-stats').innerHTML = ''; $('ending-after').hidden = true; show('modal-ending');
}
function showEnding() {
  const en = D.ENDINGS[S.ended]; $('ending-date').textContent = S.ended === 'bust' ? `Week ${S.week}` : 'The end of year three'; $('ending-title').textContent = en.title; $('ending-text').textContent = en.text; $('ending-choices').innerHTML = '';
  const st = S.stats; $('ending-stats').innerHTML = [['items mended', st.fixed], ['kept from landfill', money(st.saved)], ['streets', Object.keys(S.open).length], ['staff', S.staff.length], ['Hollow Lane', Math.round(S.rep.hollow)], ['score', E.score(S)]].map(p => `<div class="stat"><b>${p[1]}</b><span>${p[0]}</span></div>`).join('');
  $('ending-after').hidden = false; $('btn-endless').hidden = S.ended === 'bust'; show('modal-ending');
}
function applySettings() { document.documentElement.classList.toggle('large', profile.large); document.documentElement.classList.toggle('contrast', profile.contrast); $('opt-large').checked = profile.large; $('opt-contrast').checked = profile.contrast; }
function newGame() { S = E.newState(); hide('modal-ending'); save(); setTab('counter'); afterTurn(); }

function init() {
  load(); applySettings(); $('ver').textContent = VERSION;
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('btn-endweek').addEventListener('click', endWeek);
  $('btn-week-ok').addEventListener('click', () => { hide('modal-week'); if (E.atGate(S)) showUnlock('gate'); });
  $('u-buy').onclick = () => BILL.buy(); $('u-restore').onclick = () => BILL.restore();
  $('u-later').onclick = () => { hide('modal-unlock'); unlockReason = null; render(); };
  BILL.onChange(st => { if (st.owned) { if (!S.unlocked || S.gated) unlockedNow(); else renderUnlockCard(); } else { if (!$('modal-unlock').hidden) renderUnlock(); renderUnlockCard(); } });
  $('btn-endless').addEventListener('click', () => { E.goEndless(S); hide('modal-ending'); save(); afterTurn(); });
  $('btn-newgame').addEventListener('click', newGame);
  $('btn-reset').addEventListener('click', () => { if (confirm('Start a new shop from week one? This shop will be gone.')) newGame(); });
  $('opt-large').addEventListener('change', e => { profile.large = e.target.checked; applySettings(); save(); }); $('opt-contrast').addEventListener('change', e => { profile.contrast = e.target.checked; applySettings(); save(); });
  window.addEventListener('pagehide', save);
  $('app').hidden = false; BILL.start(); afterTurn();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
}
window.__repairshop = { get state() { return S; }, E, D, VERSION, save, render, setTab, billing: BILL, unlockShown: () => !$('modal-unlock').hidden, showUnlock,
  seed(o) { for (const k of ['week', 'cash']) if (o[k] != null) S[k] = +o[k]; if (o.rep != null) S.rep.hollow = +o.rep; render(); },
  forceJob(catId, faultId) { const j = E.addJob(S, 'hollow', { cat: catId }); if (faultId) { j.fault = faultId; j.sym = E.catById[catId].faultById[faultId].sym[0]; } render(); return j; },
  forceBeat(arcId, beat) { S.pending = { arc: arcId, beat: beat | 0 }; S.arcs[arcId] = (beat | 0) + 1; afterTurn(); },
  endWeek, finish(id) { S.pending = { ending: true }; E.chooseEnding(S, id || 'beloved'); showEnding(); render(); }, reset() { localStorage.removeItem(SAVE_KEY); location.reload(); } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
