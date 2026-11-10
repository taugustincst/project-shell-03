// Builds the 1024x500 Play feature graphic from the current build's art: the app icon, the first store screenshot
// in a phone frame, the title and the listing's short description. Needs the pre-installed Chromium.
//   node tools/make-feature-graphic.js "<title>" <background hex> [screenshot file in store/]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
const title = process.argv[2], bg = process.argv[3] || '#111111';
const shotName = process.argv[4] || fs.readdirSync(path.join(root, 'store')).filter(f => /^screenshot-.*\.png$/.test(f)).sort()[0];
const listing = fs.readFileSync(path.join(root, 'store', 'listing.md'), 'utf8');
const m = listing.match(/## Short description[^\n]*\n+([^\n]+)/); if (!m) throw new Error('no short description in store/listing.md');
const short = m[1].trim();
const uri = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
(async () => {
  const b = await chromium.launch(); const g = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await g.setContent(`<html><body style="margin:0;width:1024px;height:500px;background:${bg};overflow:hidden;position:relative;font-family:Georgia,serif">
    <img src="${uri(path.join(root, 'icons', 'icon-512.png'))}" style="position:absolute;left:64px;top:100px;width:132px;height:132px;border-radius:28px">
    <div style="position:absolute;left:64px;top:248px;width:560px;color:#f3ecdc;font-size:56px;font-weight:bold;line-height:1.05">${esc(title)}</div>
    <div style="position:absolute;left:64px;top:326px;width:540px;color:#b9b2a5;font:24px/1.35 sans-serif">${esc(short)}</div>
    <div style="position:absolute;left:672px;top:44px;width:292px;height:600px;border-radius:36px;background:#3a3a3e;padding:8px;box-sizing:border-box">
      <img src="${uri(path.join(root, 'store', shotName))}" style="width:276px;border-radius:28px;display:block"></div></body></html>`);
  await g.waitForTimeout(300); await g.screenshot({ path: path.join(root, 'store', 'feature-graphic-1024x500.png') });
  await b.close(); console.log('wrote store/feature-graphic-1024x500.png from ' + shotName);
})();
