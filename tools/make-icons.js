// Renders icons and a staged store screenshot with the pre-installed Chromium. node tools/make-icons.js [pageUrl]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1b1a17"/><g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<rect x="60" y="300" width="392" height="40" rx="8" fill="#8a6a3a"/><rect x="90" y="340" width="30" height="120" fill="#5c4527"/><rect x="392" y="340" width="30" height="120" fill="#5c4527"/>
<g transform="rotate(-35 256 200)"><rect x="236" y="90" width="40" height="190" rx="8" fill="#e7a33b"/><rect x="200" y="60" width="112" height="56" rx="12" fill="#f1ece2"/><rect x="226" y="74" width="60" height="28" rx="6" fill="#1b1a17"/></g>
<circle cx="150" cy="230" r="44" fill="none" stroke="#f1ece2" stroke-width="18"/><circle cx="150" cy="230" r="12" fill="#f1ece2"/></g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const out = path.join(__dirname, '..', 'icons'); fs.mkdirSync(out, { recursive: true });
  for (const [name, pad, size] of [['icon-512.png', 0, 512], ['icon-192.png', 0, 192], ['maskable-512.png', 70, 512]]) { await p.setViewportSize({ width: size, height: size }); await p.setContent(`<html><body style="margin:0;background:#1b1a17">${svg(pad).replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`)}</body></html>`); await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } }); }
  const base = process.argv[2];
  if (base) { const q = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 }); await q.goto(base + '?dev=1'); await q.waitForSelector('#app:not([hidden])'); await q.evaluate(() => { const T = window.__repairshop; T.seed({ week: 9, cash: 1340, rep: 41 }); const j = T.forceJob('radio', 'r_dial'); T.E.runTest(T.state, j.id, 'power'); T.E.runTest(T.state, j.id, 'tune'); T.setTab('counter'); }); await q.waitForTimeout(400); await q.screenshot({ path: path.join(out, 'screenshot-portrait.png') }); }
  await b.close(); console.log('icons written');
})();
