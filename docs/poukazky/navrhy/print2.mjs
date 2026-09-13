import fs from 'node:fs';
import path from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, 'karty.json'), 'utf8'));
const out = path.join(ROOT, 'tlac'); fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage();
await p.goto('file://' + path.join(ROOT, 'tlac.html'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const opts = { width: '154mm', height: '111mm', printBackground: true };
for (let i = 0; i < ids.length; i += 2) {
  const name = ids[i].replace('-lice', '');
  await p.pdf({ ...opts, path: path.join(out, `poukaz-${name}.pdf`), pageRanges: `${i + 1}-${i + 2}` });
}
await p.pdf({ ...opts, path: path.join(out, 'poukazy-vsetky-navrhy.pdf') });
await b.close();
console.log(fs.readdirSync(out).length, 'PDF');
