// Načíta Google profil podniku (cid) a uloží text panela a snímku
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const out = process.argv[2];
const url = process.argv[3] || 'https://www.google.com/maps?cid=18132360254733427623&hl=sk';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--lang=sk-SK', '--ignore-certificate-errors-spki-list=' + process.env.PROXY_SPKI] });
const ctx = await browser.newContext({ locale: 'sk-SK', viewport: { width: 1400, height: 1000 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
console.log('URL1', page.url());
// súhlas s cookies (consent.google.com)
for (const t of ['Odmietnuť všetko', 'Reject all', 'Prijať všetko', 'Accept all']) {
  const b = page.getByRole('button', { name: t });
  if (await b.count()) { await b.first().click().catch(()=>{}); console.log('klik', t); break; }
}
await page.waitForTimeout(6000);
console.log('URL2', page.url());
const txt = await page.evaluate(() => document.body.innerText);
const fs = await import('fs');
fs.writeFileSync(out + '/panel.txt', txt);
await page.screenshot({ path: out + '/panel.jpg', type: 'jpeg', quality: 70 });
// hodiny: rozbaliť tabuľku hodín, ak je
const aria = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).filter(a => a && a.length < 400));
fs.writeFileSync(out + '/aria.txt', aria.join('\n'));
await browser.close();
