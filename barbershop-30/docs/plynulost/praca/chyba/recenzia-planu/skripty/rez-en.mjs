// overí, či prepínač EN na rezervácii barbershop30.sk naozaj preloží stránku (Google prekladač)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--lang=sk-SK', '--ignore-certificate-errors-spki-list=' + process.env.PROXY_SPKI] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'sk-SK' });
const net = [];
page.on('response', (r) => { if (/translate/.test(r.url())) net.push(r.status() + ' ' + r.url().slice(0, 120)); });
await page.goto('https://www.barbershop30.sk/rezervacia', { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('goto', e.message));
const pred = (await page.innerText('body')).slice(0, 600);
await page.screenshot({ path: out + '/rez-sk.jpg', quality: 60 });
const sel = await page.$('#languageOption');
console.log('select', !!sel);
if (sel) { await sel.selectOption('en').catch((e) => console.log('sel', e.message)); }
await page.waitForTimeout(8000);
const po = (await page.innerText('body')).slice(0, 600);
await page.screenshot({ path: out + '/rez-en.jpg', quality: 60 });
console.log('PRED:', pred.replace(/\s+/g, ' ').slice(0, 300));
console.log('PO:', po.replace(/\s+/g, ' ').slice(0, 300));
console.log('html lang/class:', await page.evaluate(() => document.documentElement.className + ' ' + document.documentElement.lang));
console.log(net.join('\n'));
await browser.close();
