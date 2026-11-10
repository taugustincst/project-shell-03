// node tests/colour.test.js — the colour-vision check. Every status colour must stay readable (WCAG 4.5:1 on the panel)
// under simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, full severity), and every place a
// status colour is used must also say the state in words, so no state is told by colour alone.
const fs = require('fs'); const path = require('path'); const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8'); const game = fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8');
const v = {}; for (const m of css.split('\n')[0].matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) v[m[1]] = m[2];
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4, unlin = c => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const M = { protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]], deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]], tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]] };
const sim = (c, m) => { const l = c.map(lin); return m.map(r => unlin(r[0] * l[0] + r[1] * l[1] + r[2] * l[2])); };
const lum = c => { const l = c.map(lin); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let fails = 0; const check = (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) fails++; };
for (const fg of ['--green', '--red', '--accent', '--muted', '--blue']) for (const bg of ['--panel', '--panel-2']) {
  const worst = Object.entries(M).map(([k, m]) => [k, ratio(sim(rgb(v[fg]), m), sim(rgb(v[bg]), m))]).concat([['normal', ratio(rgb(v[fg]), rgb(v[bg]))]]).sort((a, b) => a[1] - b[1])[0];
  check(`${fg} on ${bg} reads at 4.5:1 or better for every colour vision`, worst[1] >= 4.5, `worst ${worst[0]} ${worst[1].toFixed(1)}:1`);
}
// The status classes are only ever set next to words that say the state
check('parts status says in stock / on order / needs …', /'parts in stock'/.test(game) && /'parts on order'/.test(game) && /'needs ' \+/.test(game));
check('a negative balance carries a minus sign, not just red', /n < 0 \? '−£'/.test(game));
check('owned trades are written out, not only coloured', /fact good">\$\{c\.icon\} \$\{c\.name\}/.test(game));
console.log(fails ? 'SOME FAILED' : 'ALL PASSED'); process.exitCode = fails ? 1 : 0;
