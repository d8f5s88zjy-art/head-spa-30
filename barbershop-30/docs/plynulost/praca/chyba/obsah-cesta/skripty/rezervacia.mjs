// Cesta v rezervačnom systéme barbershop30.sk na telefóne – len čítanie: služba → pracovník → termín, NIČ sa neodosiela.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SN = path.join(OUT, 'snimky'), DATA = path.join(OUT, 'data');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:35449' } });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
// zablokovať akékoľvek odoslanie rezervácie (POST na ajax s osobnými údajmi) – poistka
await page.route('**/rezervacia/ajax**', async (route) => {
  const req = route.request();
  const body = req.postData() || '';
  log.push({ ajax: req.method(), body: body.slice(0, 300) });
  if (/first_name|last_name|email|phone/i.test(body)) return route.abort();
  return route.continue();
});
const t0 = Date.now();
await page.goto('https://www.barbershop30.sk/rezervacia', { waitUntil: 'networkidle', timeout: 60000 });
log.push({ krok: 'nacitane', ms: Date.now() - t0 });
await wait(1500);
// zavrieť lištu cookies, ak je
for (const sel of ['button:has-text("Prijať")', 'button:has-text("Súhlasím")', 'button:has-text("Accept")', '.cm__btn']) {
  const b = page.locator(sel).first(); if (await b.count()) { await b.click().catch(() => {}); log.push({ cookies: sel }); break; }
}
await wait(800);
await page.screenshot({ path: path.join(SN, 'r01-rezervacia-start.jpg'), quality: 65 });
const textStart = (await page.evaluate(() => document.querySelector('#order-component')?.innerText || '')).replace(/\s+/g, ' ').slice(0, 2500);
log.push({ krok: 'text-start', textStart });
// krok 1: služba „Pánsky strih a Úprava brady“
const sluzba = page.locator('#order-component >> text=Pánsky strih a Úprava brady').first();
log.push({ sluzba_najdena: await sluzba.count() });
if (await sluzba.count()) {
  await sluzba.scrollIntoViewIfNeeded(); await sluzba.click().catch((e) => log.push({ chyba: String(e) }));
  await wait(2500);
  await page.screenshot({ path: path.join(SN, 'r02-po-sluzbe.jpg'), quality: 65 });
  const t2 = (await page.evaluate(() => document.querySelector('#order-component')?.innerText || '')).replace(/\s+/g, ' ');
  log.push({ krok: 'po-sluzbe', text: t2.slice(0, 2500) });
  // tlačidlo pokračovať, ak treba
  const dalej = page.locator('#order-component >> text=/Pokračovať|Ďalej|pokračovať/').first();
  if (await dalej.count()) { await dalej.click().catch(() => {}); await wait(2500); log.push({ klik: 'pokracovat' }); }
  await page.screenshot({ path: path.join(SN, 'r03-pracovnik.jpg'), quality: 65, fullPage: true });
  const t3 = (await page.evaluate(() => document.querySelector('#order-component')?.innerText || '')).replace(/\s+/g, ' ');
  log.push({ krok: 'pracovnik', text: t3.slice(0, 3000) });
}
fs.writeFileSync(path.join(DATA, 'rezervacia.json'), JSON.stringify(log, null, 1));
await browser.close();
console.log(JSON.stringify(log, null, 1).slice(0, 6000));
