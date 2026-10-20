// Otvorí verejnú stránku v prehliadači, zatvorí výzvy na prihlásenie a uloží text, meta a snímku
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const fs = await import('fs');
const [url, out, mobil] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--lang=sk-SK', '--ignore-certificate-errors-spki-list=' + process.env.PROXY_SPKI] });
const ctx = await browser.newContext(mobil ? { locale: 'sk-SK', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' } : { locale: 'sk-SK', viewport: { width: 1366, height: 1000 } });
const page = await ctx.newPage();
const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => { console.log('ERR', String(e).split('\n')[0]); return null; });
console.log('status', r && r.status(), page.url());
await page.waitForTimeout(5000);
for (const t of ['Odmietnuť voliteľné súbory cookie', 'Decline optional cookies', 'Povoliť všetky súbory cookie', 'Allow all cookies', 'Odmietnuť všetko', 'Zavrieť', 'Close']) {
  const b = page.getByRole('button', { name: t });
  if (await b.count()) { await b.first().click({ timeout: 3000 }).catch(()=>{}); console.log('klik', t); await page.waitForTimeout(1500); }
}
await page.keyboard.press('Escape').catch(()=>{});
await page.waitForTimeout(2500);
const meta = await page.evaluate(() => [...document.querySelectorAll('meta')].map(m => (m.getAttribute('property')||m.getAttribute('name')||'') + ' = ' + (m.getAttribute('content')||'')).filter(x => /og:|description|twitter:/.test(x)));
fs.writeFileSync(out + '-meta.txt', meta.join('\n'));
fs.writeFileSync(out + '-text.txt', await page.evaluate(() => document.body ? document.body.innerText : ''));
await page.screenshot({ path: out + '.jpg', type: 'jpeg', quality: 65 });
await browser.close();
