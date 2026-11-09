'use strict';
// Emulator tap-through: Mended driven with real Android touch input (adb
// shell input) on a debug build of the Play edition. Play's 3 Nov 2026 review
// of Bubble Pop's first upload listed "Unresponsive UI elements, such as
// buttons or icons"; this test, built the same way as Bubble Pop's, fails
// unless each control visibly does its job when a finger taps it: a test and
// a diagnosis at the counter, a quote, the bench, ordering parts, hiring and
// training, the end of the week and its ledger, a story choice, a third
// street and its unlock sheet (the emulator has no Play Store, so it must say
// so and let the player carry on), the tabs and a setting, Back, a relaunch
// that keeps the shop, and the end of the free year, where the shop waits.
//
// The page's layout and state are read over WebView DevTools (enabled only in
// debuggable builds, see MainActivity), so every tap lands on the element's
// measured centre and every step is checked against the game's own state.
// Taps themselves never go through DevTools: they are real touches. The two
// drop-down lists on the bench are native pickers, so those are set through
// the page; everything else is tapped.
//
//   node tools/tap-through.js <debug-apk> [package]
// Screenshots and a log go to $TAP_THROUGH_OUT (default tap-through/).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK = process.argv[2];
const PKG = process.argv[3] || 'com.taugustincst.mended';
const OUT = process.env.TAP_THROUGH_OUT || 'tap-through';
const PORT = 9333;
if (!APK) { console.error('usage: node tools/tap-through.js <debug-apk> [package]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync('adb', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 }).trim();
let shotN = 0;
const shot = name => {
  const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
  try { fs.writeFileSync(f, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 })); } catch (e) { /* best effort */ }
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!ok) failures++;
  return ok;
};
const fatal = msg => { console.log('FAIL ' + msg); finish(true); };

// ---------------------------------------------------------------- DevTools
let ws = null, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); } }, 15000);
  });
}
async function js(expression) {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.error) throw new Error('DevTools: ' + m.error.message);
  if (m.result.exceptionDetails) {
    const d = m.result.exceptionDetails;
    throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
  }
  return m.result.result.value;
}
async function connect() {
  for (let i = 0; i < 40; i++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG); } catch (e) { /* not up yet */ }
    if (pid) {
      try {
        adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid.split(/\s+/)[0]}`);
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        const page = list.find(t => t.type === 'page' && /appassets\.androidplatform\.net/.test(t.url));
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          ws.onmessage = e => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
            if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          };
          await send('Runtime.enable');
          if (await js('!!(window.__repairshop)')) return;
          ws.close(); ws = null;
        }
      } catch (e) { /* the page or its DevTools socket is not ready yet */ }
    }
    await sleep(1000);
  }
  fatal('could not reach the game page over WebView DevTools (is this a debug build?)');
}

// ----------------------------------------------------------------- geometry
let dpr = 1, offX = 0, offY = 0, screenW = 0, screenH = 0;
// Measure an element (scrolled into view programmatically if it sits in a
// scrolling panel) and make sure it is the topmost thing at its centre, so a
// tap there reaches it and nothing covers it.
async function measure(sel) {
  return js(`(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {missing:true};
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var top=document.elementFromPoint(cx,cy);
    var visible=r.width>0&&r.height>0&&cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight;
    return {cx:cx,cy:cy,w:r.width,h:r.height,visible:visible,onTop:!!top&&(top===el||el.contains(top))};
  })()`);
}
const toScreen = (cx, cy) => [Math.round(cx * dpr + offX), Math.round(cy * dpr + offY)];
// Wait for the layout to settle (the soft keyboard opening or closing
// resizes the page), so the tap lands where the element really is.
async function measureSettled(sel) {
  let m = await measure(sel);
  for (let i = 0; i < 12 && !m.missing; i++) {
    await sleep(250);
    const n = await measure(sel);
    if (n.missing || (Math.abs(n.cx - m.cx) < 1 && Math.abs(n.cy - m.cy) < 1)) return n;
    m = n;
  }
  return m;
}
// Two taps close together in time and place read as a double tap, and the
// WebView swallows the second one (CI saw a setting toggled on and the next
// tap on it lost), so a tap near the last one waits until it cannot be.
let lastTap = { t: 0, x: -1e9, y: -1e9 };
async function tap(sel, label) {
  await sleep(150);
  const m = await measureSettled(sel);
  if (m.missing) return check(`${label}: on screen`, false, `${sel} not in the page`);
  if (!check(`${label}: visible and not covered`, m.visible && m.onTop, JSON.stringify(m))) return false;
  const [x, y] = toScreen(m.cx, m.cy);
  const gap = Date.now() - lastTap.t;
  if (gap < 900 && Math.hypot(x - lastTap.x, y - lastTap.y) < 300 * dpr) await sleep(900 - gap);
  adb('shell', 'input', 'tap', String(x), String(y));
  lastTap = { t: Date.now(), x, y };
  return true;
}
async function longPress(sel, ms) {
  const m = await measureSettled(sel);
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(ms));
}
async function waitFor(expr, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    let v = false;
    try { v = await js(expr); } catch (e) { /* page busy */ }
    if (v) return true;
    if (Date.now() > end) return false;
    await sleep(150);
  }
}
const hidden = id => `document.getElementById(${JSON.stringify(id)}).hidden`;
const shown = id => `!document.getElementById(${JSON.stringify(id)}).hidden`;
function alive() { try { return adb('shell', 'pidof', PKG) !== ''; } catch (e) { return false; } }

// -------------------------------------------------------------------- run
let finished = false;
function finish(stop) {
  if (finished) return; finished = true;
  try { fs.writeFileSync(path.join(OUT, 'logcat.txt'), adb('logcat', '-d')); } catch (e) { /* best effort */ }
  if (stop) failures = failures || 1;
  console.log(failures ? `tap-through: ${failures} FAILED` : 'tap-through: every screen and control responded');
  try { if (ws) ws.close(); } catch (e) { /* closing */ }
  process.exit(failures ? 1 : 0);
}
const K = 'window.__repairshop';
const S = `${K}.state`;
const tabOpen = t => `document.getElementById('tab-${t}').classList.contains('active')`;

(async () => {
  adb('wait-for-device');
  adb('install', '-r', APK);
  try { adb('shell', 'pm', 'clear', PKG); } catch (e) { /* fresh install */ }
  adb('logcat', '-c');
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  [screenW, screenH] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
  dpr = await js('devicePixelRatio');
  await sleep(1500);
  shot('counter');

  // 1. The shop opens at week 1 with customers. Calibrate on the title (no handler).
  check('the shop opens on week 1 with customers at the counter', await waitFor(`${S}.week===1&&document.querySelectorAll('#counter .card').length>0`));
  await js(`window.__tt=[];addEventListener('pointerdown',function(e){__tt.push([e.clientX,e.clientY])},true);1`);
  {
    const m = await measure('.top h1');
    const sx = Math.round(m.cx * dpr), sy = Math.round(m.cy * dpr);
    adb('shell', 'input', 'tap', String(sx), String(sy));
    if (!(await waitFor('__tt.length>0'))) fatal('a tap on the screen never reached the page (touch input is not getting through)');
    const [px, py] = await js('__tt[__tt.length-1]');
    offX = sx - px * dpr; offY = sy - py * dpr;
    console.log(`geometry: screen ${screenW}x${screenH}, devicePixelRatio ${dpr}, page offset ${offX.toFixed(1)},${offY.toFixed(1)}`);
    check('touch reaches the page where it was aimed', Math.abs(offX) < screenW && Math.abs(offY) < screenH);
  }
  check('the app has the Play billing bridge', await js('!!window.AndroidBilling'));

  // 2. The counter: a test, the diagnosis, a quote.
  const jid = await js(`${S}.jobs.find(function(j){return j.status==='intake'}).id`);
  const card = `#counter .card:nth-child(1)`;
  const h0 = await js(`${S}.hoursUsed`);
  if (await js(`!!document.querySelector('${card} .tests .btn:not([disabled])')`)) {
    await tap(`${card} .tests .btn:not([disabled])`, 'a test');
    check('the test shows its result and spends hours', await waitFor(`${S}.hoursUsed>${h0}&&Object.keys(${S}.jobs.find(function(j){return j.id===${jid}}).tests).length===1`));
  }
  const fault = await js(`${S}.jobs.find(function(j){return j.id===${jid}}).fault`);
  if (!(await js(`!!document.querySelector('${card} .cand[data-f="${fault}"]')`))) {
    check('the true fault is still on the list', false);
  } else {
    await tap(`${card} .cand[data-f="${fault}"]`, 'the fault');
    check('the diagnosis is chosen and the quote opens', await waitFor(`${S}.jobs.find(function(j){return j.id===${jid}}).diag===${JSON.stringify(fault)}&&!!document.getElementById('pr-${jid}')`));
    await js(`(function(){var r=document.getElementById('pr-${jid}');r.value=5;r.dispatchEvent(new Event('input'))})();1`);
    shot('quote');
    await tap(`${card} .quote-box .btn.primary`, 'Quote it');
    check('a low quote puts the job on the bench', await waitFor(`${S}.jobs.find(function(j){return j.id===${jid}}).status==='queued'`));
  }

  // 3. The bench: assign it, and order its parts if it needs any.
  await tap('.tab[data-tab="bench"]', 'Bench tab');
  check('the bench lists the job', await waitFor(`${tabOpen('bench')}&&document.querySelectorAll('#bench .card').length>0`));
  await js(`(function(){var s=document.querySelector('#bench .card .asg');s.selectedIndex=1;s.dispatchEvent(new Event('change'))})();1`);
  check('assigning starts the work', await waitFor(`${S}.jobs.find(function(j){return j.id===${jid}}).status==='working'`));
  if (await js(`!!document.querySelector('#bench [data-act="std"]')`)) {
    const o0 = await js(`${S}.orders.length`);
    await tap('#bench [data-act="std"]', 'Order standard');
    check('the parts are ordered', await waitFor(`${S}.orders.length>${o0}`));
  }
  shot('bench');

  // 4. Parts, hiring and training.
  await tap('.tab[data-tab="parts"]', 'Parts tab');
  check('the parts tab lists the catalogue', await waitFor(`${tabOpen('parts')}&&document.querySelectorAll('#parts [data-p]').length>10`));
  {
    const part = await js(`document.querySelector('#parts [data-p]').dataset.p`);
    const n0 = await js(`(${S}.inventory[${JSON.stringify(part)}]|0)+${S}.orders.filter(function(o){return o.part===${JSON.stringify(part)}}).length`);
    await tap('#parts [data-p]', 'a part');
    check('buying a part puts it in stock or on order', await waitFor(`(${S}.inventory[${JSON.stringify(part)}]|0)+${S}.orders.filter(function(o){return o.part===${JSON.stringify(part)}}).length>${n0}`));
  }
  await js(`${S}.cash=5000;${K}.render();1`);
  await tap('.tab[data-tab="shop"]', 'Shop tab');
  check('the shop tab opens', await waitFor(tabOpen('shop')));
  if (await js(`${S}.staff.length<${S}.benches+1`)) {
    const s0 = await js(`${S}.staff.length`);
    await tap('#shop [data-hire]', 'Hire');
    check('hiring adds a pair of hands', await waitFor(`${S}.staff.length===${s0 + 1}`));
  }
  {
    const c0 = await js(`${S}.cash`);
    await tap('#shop [data-train]', 'Train +1');
    check('training costs and raises a skill', await waitFor(`${S}.cash<${c0}`));
  }
  shot('shop');

  // 5. The end of the week and its ledger.
  await tap('.tab[data-tab="counter"]', 'Counter tab');
  const w0 = await js(`${S}.week`);
  await tap('#btn-endweek', 'End the week');
  check('the ledger opens and the week moves on', await waitFor(`${shown('modal-week')}&&${S}.week===${w0 + 1}`, 5000));
  shot('ledger');
  await tap('#btn-week-ok', 'Open up');
  check('the ledger closes', await waitFor(hidden('modal-week')));
  if (await js(shown('modal-story'))) { await tap('#story-choices .choice', 'a story choice'); await waitFor(hidden('modal-story')); }

  // 6. A story beat and a choice.
  await js(`${K}.forceBeat('okafor',0);1`);
  check('a story beat opens with choices', await waitFor(`${shown('modal-story')}&&document.querySelectorAll('#story-choices .choice').length>0`));
  shot('story');
  await tap('#story-choices .choice', 'the first choice');
  check('the choice is recorded', await waitFor(`${hidden('modal-story')}&&!${S}.pending&&${S}.flags.okafor_job===true`));

  // 7. A third street asks for the full game. No Play Store here, so it must say so.
  await js(`(function(){var s=${S};s.rep.estate=90;s.rep.market=90;s.cash=9000;${K}.E.openBlock(s,'estate');${K}.render()})();1`);
  await tap('.tab[data-tab="shop"]', 'Shop tab');
  check('with two streets open, the next one is the full game', await waitFor(`!!document.querySelector('#shop [data-full]')&&!document.querySelector('#shop [data-open]')`));
  await tap('#shop [data-full]', 'Full game');
  check('the unlock sheet opens', await waitFor(`${shown('modal-unlock')}&&document.getElementById('u-sub').textContent==='A third street'`));
  check('without a Play Store the sheet says so', await waitFor(`/Google Play/.test(document.getElementById('u-note').textContent)`, 8000), await js(`document.getElementById('u-note').textContent`));
  shot('unlock');
  if (await js(`!document.getElementById('u-buy').disabled`)) {
    await tap('#u-buy', 'Unlock the full game');
    check('the unlock button answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  if (await js(`!document.getElementById('u-restore').disabled`)) {
    await tap('#u-restore', 'Restore purchase');
    check('Restore answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  check('nothing unlocked without Play', await js(`!${K}.billing.state.owned&&Object.keys(${S}.open).length===2`));
  await tap('#u-later', 'Not now');
  check('Not now closes the sheet', await waitFor(hidden('modal-unlock')));

  // 8. The tabs and a setting.
  for (const t of ['counter', 'bench', 'parts', 'shop', 'story']) {
    await tap(`.tab[data-tab="${t}"]`, `${t} tab`);
    check(`the ${t} tab opens`, await waitFor(tabOpen(t)));
  }
  check('Story offers the full game', await waitFor(`/years two and three/.test(document.getElementById('unlock-card').textContent)`));
  await tap('#opt-large', 'Large text');
  check('Large text turns on', await waitFor(`document.documentElement.classList.contains('large')`));
  await tap('#opt-large', 'Large text again');
  check('Large text turns off', await waitFor(`!document.documentElement.classList.contains('large')`));
  await tap('.tab[data-tab="counter"]', 'Counter tab');

  // 9. Back leaves without a crash, and the shop is there on relaunch.
  const kept = await js(`(function(){var s=${S};${K}.save();return {week:s.week,cash:Math.round(s.cash),jobs:s.jobs.length}})()`);
  adb('shell', 'input', 'keyevent', '4');
  await sleep(1500);
  const log1 = adb('logcat', '-d');
  check('Back leaves without a crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log1));
  try { ws.close(); } catch (e) { /* reconnecting */ } ws = null;
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  await sleep(1000);
  check('the week, the cash and the jobs are kept on relaunch', await waitFor(`(function(){var s=${S};return s.week===${kept.week}&&Math.round(s.cash)===${kept.cash}&&s.jobs.length===${kept.jobs}})()`));
  shot('relaunch');

  // 10. The end of the free year: the ledger says so, then the shop waits at week 52.
  await js(`(function(){var k=${K};k.seed({week:52});k.state.jobs=[];k.state.pending=null;k.render()})();1`);
  await tap('#btn-endweek', 'End the last week of the year');
  check('the last ledger of the free year says what comes next', await waitFor(`${shown('modal-week')}&&/last week of your first year/.test(document.getElementById('week-body').textContent)`, 5000));
  await tap('#btn-week-ok', 'Open up');
  check('the shop holds at week 52 and the unlock sheet opens', await waitFor(`${shown('modal-unlock')}&&${S}.week===52&&${S}.gated`));
  shot('gate');
  await tap('#u-later', 'Not now');
  check('End the week now reads Start year two', await waitFor(`document.getElementById('btn-endweek').textContent==='Start year two'&&${hidden('modal-unlock')}`));
  await tap('#btn-endweek', 'Start year two');
  check('it opens the unlock sheet again, and the week stays', await waitFor(`${shown('modal-unlock')}&&${S}.week===52`));
  await tap('#u-later', 'Not now');

  const log = adb('logcat', '-d');
  check('no crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log));
  check(`no "app not responding"`, !log.includes(`ANR in ${PKG}`));
  check('no errors in the page', pageErrors.length === 0, pageErrors.join(' | '));
  check('the app is still running', alive());
  finish(false);
})().catch(e => { console.log('FAIL tap-through stopped: ' + (e && e.stack || e)); finish(true); });
