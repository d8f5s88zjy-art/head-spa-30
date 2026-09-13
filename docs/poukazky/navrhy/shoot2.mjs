import fs from 'node:fs';
import path from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, 'karty.json'), 'utf8'));
const out = path.join(ROOT, 'out'); fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none'] });
const p = await b.newPage({ viewport: { width: 1900, height: 1400 } });
await p.goto('file://' + path.join(ROOT, 'navrhy.html'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
for (const id of ids) await p.locator('#' + id).screenshot({ path: path.join(out, id + '.png') });
const bad = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('.card').forEach((c) => {
    const r = c.getBoundingClientRect();
    c.querySelectorAll('.body,.head,.foot,.stack,.cols,.terms,.claim,.note,.contact,.val,.stub>*,.vbox>*').forEach((el) => {
      const e = el.getBoundingClientRect();
      if (!e.width || !e.height) return;
      if (e.left < r.left + 34 || e.right > r.right - 34 || e.top < r.top + 34 || e.bottom > r.bottom - 34)
        out.push(c.id + ' · ' + (el.className || el.tagName));
    });
  });
  return [...new Set(out)];
});
console.log(bad.length ? 'mimo:\n  ' + bad.join('\n  ') : 'všetko vnútri');
await b.close();
