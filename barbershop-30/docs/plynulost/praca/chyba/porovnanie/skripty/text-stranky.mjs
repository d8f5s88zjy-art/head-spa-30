// Vypíše viditeľný text stránky (SPA) a odkazy; snímka voliteľne. Použitie: node text-stranky.mjs <url> [snímka.jpg]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, shot] = process.argv.slice(2);
const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args: ['--ignore-certificate-errors-spki-list=' + process.env.SPKI] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, locale: 'sk-SK' });
p.setDefaultTimeout(20000);
try {
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  const t = await p.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 4000));
  console.log(t);
  if (shot) await p.screenshot({ path: shot, type: 'jpeg', quality: 70 });
} catch (e) { console.log('CHYBA', String(e).slice(0, 200)); }
await b.close();
