// Google profil: karta Informácie (atribúty) a tabuľka hodín
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const fs = await import('fs');
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--lang=sk-SK', '--ignore-certificate-errors-spki-list=' + process.env.PROXY_SPKI] });
const ctx = await browser.newContext({ locale: 'sk-SK', viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://www.google.com/maps?cid=18132360254733427623&hl=sk', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
for (const t of ['Odmietnuť všetko', 'Reject all']) { const b = page.getByRole('button', { name: t }); if (await b.count()) { await b.first().click().catch(()=>{}); break; } }
await page.waitForTimeout(6000);
await page.screenshot({ path: out + '/prehlad.jpg', type: 'jpeg', quality: 70 });
const tab = page.getByRole('tab', { name: /Informácie/ });
console.log('tab', await tab.count());
if (await tab.count()) { await tab.first().click({ force: true, timeout: 8000 }).catch(e => console.log('klik zlyhal')); await tab.first().evaluate(e => e.click()).catch(()=>{}); await page.waitForTimeout(4000); }
fs.writeFileSync(out + '/informacie.txt', await page.evaluate(() => document.body.innerText));
await page.screenshot({ path: out + '/informacie.jpg', type: 'jpeg', quality: 70 });
const aria = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).filter(a => a && a.length < 400));
fs.writeFileSync(out + '/informacie-aria.txt', aria.join('\n'));
await browser.close();
