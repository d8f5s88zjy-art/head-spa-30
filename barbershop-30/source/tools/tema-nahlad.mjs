#!/usr/bin/env node
// Náhľad vzhľadu webu na existujúcej rezervácii www.barbershop30.sk/rezervacia (assets/tema-rezervacia.css).
// Stiahne verejnú stránku, jej css/app.css, js/app.js a pár súborov, ktoré formulár potrebuje, do dočasného
// priečinka a spustí ju lokálne: namiesto ich servera odpovedá skúšobný kalendár (getEmployees, getCalendar,
// getTime), makeOrder vždy odmietne (403), iné adresy okrem písiem Google prehliadač nedostane. Prejde kroky
// služba → pracovník → deň a čas → údaje bez a so štýlom a uloží snímky (docs/screenshots/tema-rezervacia/).
//   node source/tools/tema-nahlad.mjs [--out=dir] [--sirky=390,1440]
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const { PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'tema-rezervacia'));
const SIRKY = String(opt.sirky || '390,1440').split(',').map(Number);
const ZDROJ = 'https://www.barbershop30.sk/';
fs.mkdirSync(OUT, { recursive: true });

// 1. verejné súbory ich stránky (len čítanie) do vlastného dočasného priečinka
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'bs30-'));
const SUBORY = ['rezervacia', 'css/app.css', 'js/app.js', 'js/vendor/bootstrap.js', 'js/plugins/jquery.min.js', 'js/vendor/modernizr.js', 'images/demo/logo.png',
  'fonts/font-awesome/fontawesome-webfont.woff2', 'fonts/glyphicons/glyphicons-halflings-regular.woff', 'fonts/murdock-icons/Murdock.woff'];
for (const f of SUBORY) {
  const r = await fetch(ZDROJ + f, { headers: { 'User-Agent': 'Mozilla/5.0 Barbershop30-nahlad' } });
  if (!r.ok) { console.log(`POZOR ${f}: ${r.status}`); continue; }
  const ciel = path.join(D, f === 'rezervacia' ? 'rezervacia.html' : f);
  fs.mkdirSync(path.dirname(ciel), { recursive: true });
  fs.writeFileSync(ciel, Buffer.from(await r.arrayBuffer()));
}

// 2. lokálny server: ich stránka so skúšobným kalendárom, ?tema=1 pridá náš štýl za ich css/app.css
const MENA = ['Nikolas', 'Kristián', 'Damian', 'Michal', 'Andy', 'Dominika', 'Kevin', 'Lajko', 'Jojo', 'Adrian'];
const den = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
const TYP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const metody = [];
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/rezervacia/ajax') {
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      let m = ''; try { m = JSON.parse(b).ajax_method; } catch (e) { m = new URLSearchParams(b).get('ajax_method'); }
      metody.push(m);
      res.setHeader('Content-Type', 'application/json');
      if (m === 'makeOrder') { res.writeHead(403); return res.end('{"message":"v náhľade sa nič neodosiela"}'); }
      const dnes = new Date();
      const r = m === 'getEmployees' ? { employees: [{ id: 0, name: 'Nezáleží', title: 'Barber' }, ...MENA.map((n, i) => ({ id: 40 + i, name: n, title: n === 'Dominika' ? 'Barberka' : 'Barber' }))] }
        : m === 'getCalendar' ? { calendar: { limits: { min: den(dnes), max: den(new Date(+dnes + 30 * 864e5)) }, disabled_days: ['Ne'], disabled_dates: [] } }
        : m === 'getTime' ? { times: { Doobeda: ['09:00', '09:40', '10:20', '11:00'], Poobede: ['13:20', '14:00', '15:20', '17:40'] } } : {};
      res.end(JSON.stringify({ result: r }));
    }); return;
  }
  if (u.pathname === '/rezervacia') {
    let h = fs.readFileSync(path.join(D, 'rezervacia.html'), 'utf8').replace(ZDROJ + 'rezervacia/ajax', '/rezervacia/ajax');
    if (u.searchParams.get('tema')) h = h.replace('</head>', '<link rel="stylesheet" href="/_web/tema-rezervacia.css">\n</head>');
    res.writeHead(200, { 'Content-Type': TYP['.html'] }); return res.end(h);
  }
  const f = u.pathname.startsWith('/_web/') ? path.join(SITE, 'assets', u.pathname.slice(6)) : path.join(D, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${srv.address().port}`;

// 3. kroky bez a so štýlom
const browser = await chromium.launch(PRESETS[0]);
for (const w of SIRKY) for (const [druh, q] of [['pred', ''], ['po', '?tema=1']]) {
  const p = await browser.newPage({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1, isMobile: w < 800, hasTouch: w < 800 });
  await p.route('**/*', (r) => (/^http:\/\/127\.0\.0\.1|fonts\.(googleapis|gstatic)\.com/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto(origin + '/rezervacia' + q, { waitUntil: 'load' });
  await p.waitForTimeout(1800);
  const snim = async (n, el) => { await p.waitForTimeout(500); if (el) await p.locator(el).last().scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, `${druh}-${w}-${n}.png`) }); };
  await p.locator('#order-component .title').first().scrollIntoViewIfNeeded(); await snim('1-sluzby');
  await p.locator('.services .titlefeat', { hasText: 'Pánsky strih a Úprava brady' }).click();
  await p.locator('a.btn', { hasText: 'Pokračovať v rezervácii' }).click(); await p.waitForTimeout(1000);
  await snim('2-pracovnik', '.container:not(.services) .title');
  await p.locator('.container:not(.services) .titlefeat', { hasText: 'Adrian' }).click(); await p.waitForTimeout(1200);
  await p.locator('.vfc-span-day:not(.vfc-disabled):not(.vfc-hide)').nth(1).click(); await p.waitForTimeout(1200);
  await snim('3-den-cas', '.vfc-calendars');
  await p.locator('.time .border', { hasText: '14:00' }).click(); await p.waitForTimeout(1200);
  await snim('4-udaje', '#order-component input');
  console.log(`${druh} ${w} px: šírka stránky ${await p.evaluate(() => document.documentElement.scrollWidth)}`);
  await p.close();
}
await browser.close();
srv.close();
fs.rmSync(D, { recursive: true, force: true });
console.log('metódy rezervačného systému:', [...new Set(metody)].join(', '), metody.includes('makeOrder') ? '(makeOrder odmietnutý)' : '(makeOrder nikdy)');
console.log('snímky:', OUT);
process.exit(0);
