import fs from 'node:fs';
import path from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, 'varianty.json'), 'utf8'));
const out = path.join(ROOT, 'out'); fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none'] });
const p = await b.newPage({ viewport: { width: 1900, height: 1400 } });
await p.goto('file://' + path.join(ROOT, 'poukaz.html'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
for (const id of ids) {
  await p.locator('#front-' + id).screenshot({ path: path.join(out, `poukaz-${id}-lice.png`) });
}
await p.locator('#back').screenshot({ path: path.join(out, 'poukaz-rub.png') });
const over = await p.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.card').forEach((c) => {
    const r = c.getBoundingClientRect();
    c.querySelectorAll('*').forEach((el) => {
      const e = el.getBoundingClientRect();
      if (!e.width || !e.height) return;
      if (e.left < r.left + 60 || e.right > r.right - 60 || e.top < r.top + 60 || e.bottom > r.bottom - 60)
        if (!el.classList.contains('frame') && !el.classList.contains('frame2') && !el.classList.contains('grain') && !el.classList.contains('bowl'))
          bad.push(c.id + ' ' + (el.className || el.tagName));
    });
  });
  return [...new Set(bad)].slice(0, 8);
});
if (over.length) console.log('mimo rámca:', over.join(' | ')); else console.log('všetko vnútri rámca');
await b.close();
