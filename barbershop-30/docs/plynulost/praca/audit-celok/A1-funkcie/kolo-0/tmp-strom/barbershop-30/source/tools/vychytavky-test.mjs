#!/usr/bin/env node
// Test vychytávok (2026‑10‑25): pripomienka ďalšieho strihu (súbor .ics podľa RFC 5545 a odkaz do Google Kalendára),
// Pošli kamarátovi (zdieľanie telefónu, inak kópia odkazu) a ikona na plochu (manifest, ikony, apple-touch-icon).
// Nič nejde von: zdieľanie aj schránka sú v prehliadači testu, Google Kalendár sa neotvára.
//   node source/tools/vychytavky-test.mjs [--out=dir]
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'vychytavky'));
fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const srv = await startStaticServer(SITE);
const b = await chromium.launch();

/* ikona na plochu: manifest a ikony na všetkých stránkach */
{
  const p = await b.newPage();
  const man = await (await p.request.get(`${srv.origin}/assets/manifest.webmanifest`)).json();
  ok(man.name && man.short_name === 'Barbershop 30' && man.start_url === '../' && man.display, 'manifest: meno, začiatok na webe, zobrazenie', JSON.stringify({ n: man.name, s: man.start_url }));
  const ikony = await Promise.all(man.icons.map(async (i) => (await p.request.get(`${srv.origin}/assets/${i.src}`)).ok()));
  ok(ikony.length === 3 && ikony.every(Boolean) && man.icons.some((i) => i.purpose === 'maskable'), 'manifest: ikony 192, 512 a maskovateľná existujú');
  for (const s of ['index.html', 'rezervacia.html', 'en/index.html']) {
    await p.goto(`${srv.origin}/${s}?uvod=off&film=off&hudba=off`, { waitUntil: 'domcontentloaded' });
    const r = await p.evaluate(async () => {
      const m = document.querySelector('link[rel="manifest"]'), a = document.querySelector('link[rel="apple-touch-icon"]');
      return { m: !!m && (await fetch(m.href)).ok, a: !!a && (await fetch(a.href)).ok };
    });
    ok(r.m && r.a, `${s}: manifest a ikona pre iPhone sa načítajú`);
  }
  await p.close();
}

/* pripomienka a zdieľanie na telefóne */
for (const [w, h] of [[390, 844], [360, 780], [430, 932]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK', acceptDownloads: true });
  const p = await ctx.newPage();
  const chyby = []; p.on('pageerror', (e) => chyby.push(String(e)));
  // zdieľanie telefónu: zachytí, čo by sa poslalo
  await p.addInitScript(() => { window.__zdielane = null; navigator.share = async (d) => { window.__zdielane = d; }; });
  await p.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off`, { waitUntil: 'load' });
  await p.waitForSelector('.karty-pripomienka', { state: 'attached', timeout: 15000 });
  await p.locator('.karty-pripomienka').scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  if (w === 390) {
    const v = await p.evaluate(() => ({
      tl: [...document.querySelectorAll('.pr-volba')].map((x) => `${x.textContent}${x.getAttribute('aria-pressed') === 'true' ? '*' : ''}`),
      kedy: document.querySelector('.pr-kedy').textContent, add: document.querySelector('.karty-pripomienka a.btn').getAttribute('href'),
      g: document.querySelector('.karty-pripomienka a.link-arrow').href, zd: document.querySelector('.karty-zdielaj').textContent,
    }));
    ok(v.tl.join('|') === 'o 3 týždne|o 4 týždne*|o 6 týždňov', 'voľby týždňov, predvolené 4', v.tl.join('|'));
    // očakávaný deň: o 4 týždne, nedeľa → pondelok
    const ocak = await p.evaluate(() => { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 28, 10); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toLocaleDateString('sk', { weekday: 'long', day: 'numeric', month: 'long' }); });
    ok(v.kedy === `Pripomienka ${ocak} o 10:00`, 'dátum pripomienky o 4 týždne o 10:00 (nie v nedeľu)', v.kedy);
    const t = decodeURIComponent(v.add.replace(/^data:text\/calendar;charset=utf-8,/, ''));
    const riadky = t.split('\r\n');
    const rozlozene = t.replace(/\r\n /g, '');
    ok(t.endsWith('\r\n') && !/[^\r]\n/.test(t), 'súbor .ics: riadky CRLF');
    ok(riadky.every((r) => Buffer.byteLength(r) <= 75), 'súbor .ics: riadky najviac 75 bajtov (RFC 5545)', Math.max(...riadky.map((r) => Buffer.byteLength(r))) + ' B');
    for (const kluc of ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:', 'BEGIN:VEVENT', 'UID:', 'DTSTAMP:', 'DTSTART:', 'DTEND:', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'END:VEVENT', 'END:VCALENDAR']) if (!rozlozene.includes(kluc)) ok(false, `súbor .ics obsahuje ${kluc}`);
    ok(/DTSTART:\d{8}T100000\r\n/.test(rozlozene) && /DTEND:\d{8}T101500\r\n/.test(rozlozene), 'udalosť 10:00 až 10:15');
    ok(rozlozene.includes('SUMMARY:Objednaj sa na strih · Barbershop 30') && rozlozene.includes('Pripomienka\\, nie rezervácia.'), 'text udalosti: objednaj sa, pripomienka nie rezervácia');
    ok(rozlozene.includes('https://www.barbershop30.sk/rezervacia') && rozlozene.includes('0951 267 203') && rozlozene.includes('LOCATION:Barbershop 30\\, Mostná 30\\, 949 01 Nitra'), 'v udalosti rezervácia, telefón a adresa');
    const g = new URL(v.g);
    ok(g.hostname === 'calendar.google.com' && g.searchParams.get('action') === 'TEMPLATE' && /^\d{8}T100000\/\d{8}T101500$/.test(g.searchParams.get('dates')) && g.searchParams.get('ctz') === 'Europe/Bratislava', 'Google Kalendár: šablóna udalosti s časom a pásmom');
    // voľba 6 týždňov zmení dátum aj súbor
    await p.locator('.pr-volba', { hasText: 'o 6 týždňov' }).click();
    const v6 = await p.evaluate(() => ({ kedy: document.querySelector('.pr-kedy').textContent, add: document.querySelector('.karty-pripomienka a.btn').getAttribute('href'), st: document.querySelector('.pr-volba[aria-pressed="true"]').textContent }));
    ok(v6.st === 'o 6 týždňov' && v6.kedy !== v.kedy && v6.add !== v.add, 'voľba 6 týždňov zmení dátum aj súbor', v6.kedy);
    // stiahnutie súboru
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.locator('.karty-pripomienka a.btn').click()]);
    const obsah = fs.readFileSync(await dl.path(), 'utf8');
    ok(dl.suggestedFilename() === 'barbershop30-pripomienka.ics' && obsah.startsWith('BEGIN:VCALENDAR'), 'Pridať do kalendára stiahne súbor .ics', dl.suggestedFilename());
    // Pošli kamarátovi
    await p.locator('.karty-zdielaj').click();
    const zd = await p.evaluate(() => window.__zdielane);
    ok(v.zd === 'Pošli kamarátovi' && zd && zd.url.endsWith('/barbershop30/') && !zd.url.includes('?') && /Mostnej 30/.test(zd.text), 'Pošli kamarátovi: zdieľa kanonickú adresu a krátky text', JSON.stringify(zd));
    // jazyk: angličtina
    await p.evaluate(() => window.B30_LANG && window.B30_LANG.set('en'));
    await p.waitForFunction(() => document.querySelector('.karty-zdielaj').textContent === 'Send to a friend', null, { timeout: 15000 }).catch(() => {});
    const en = await p.evaluate(() => ({ h: document.querySelector('.karty-h4').textContent, k: document.querySelector('.pr-kedy').textContent, add: decodeURIComponent(document.querySelector('.karty-pripomienka a.btn').getAttribute('href')) }));
    ok(en.h === 'Remember your next cut' && /^Reminder on [A-Z][a-z]+day \d{1,2} [A-Z][a-z]+ at 10:00$/.test(en.k) && en.add.includes('SUMMARY:Book your haircut'), 'angličtina: texty aj udalosť', en.k);
    await p.evaluate(() => window.B30_LANG && window.B30_LANG.set('sk'));
    await p.waitForTimeout(800);
  }
  // bez zdieľania telefónu: kópia odkazu do schránky
  if (w === 360) {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.origin });
    await p.evaluate(() => { delete navigator.share; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
    await p.locator('.karty-zdielaj').click();
    await p.waitForTimeout(300);
    const r = await p.evaluate(async () => ({ stav: document.querySelector('.karty-stav').textContent, schr: await navigator.clipboard.readText() }));
    ok(r.stav === 'Odkaz je skopírovaný' && r.schr.endsWith('/barbershop30/'), 'bez zdieľania telefónu: odkaz v schránke a správa', JSON.stringify(r));
  }
  const pre = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('.karty-vizitka *')].some((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }));
  ok(!pre, `${w} px: vizitka, zdieľanie a pripomienka bez pretekania`);
  // výška ťukacej plochy: prvok, pri odkaze so šípkou aj jeho neviditeľný presah (P18 v style.css)
  const male = await p.evaluate(() => [...document.querySelectorAll('.karty-vizitka a, .karty-vizitka button')].filter((e) => !e.hidden && e.getBoundingClientRect().height).map((e) => {
    const a = getComputedStyle(e, '::after'), v = Math.max(e.getBoundingClientRect().height, a.content !== 'none' && a.position === 'absolute' ? parseFloat(a.height) || 0 : 0);
    return [e.textContent.trim(), Math.round(v)];
  }).filter(([, v]) => v < 40).map(([t, v]) => `${t} ${v}`));
  ok(!male.length, `${w} px: ťukacie plochy aspoň 40 px`, male.join(', '));
  await p.evaluate(() => document.querySelector('.karty-vizitka').scrollIntoView({ block: 'start' }));
  await p.evaluate(() => scrollBy(0, -70));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(OUT, `vizitka-${w}.png`) });
  await p.evaluate(() => document.querySelector('.karty-pripomienka').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, `pripomienka-${w}.png`) });
  ok(!chyby.length, `${w} px: bez chýb skriptu`, chyby.slice(0, 2).join(' | '));
  await ctx.close();
}

/* počítač */
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off`, { waitUntil: 'load' });
  await p.waitForSelector('.karty-pripomienka', { state: 'attached', timeout: 15000 });
  await p.evaluate(() => document.querySelector('.karty-vizitka').scrollIntoView({ block: 'start' }));
  await p.evaluate(() => scrollBy(0, -90));
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'vizitka-1440.png') });
  await p.close();
}
await b.close(); srv.server.close();
console.log(`\nVÝSLEDOK: ${failed ? failed + ' zlyhalo' : 'všetko v poriadku'} · snímky: ${OUT}`);
process.exit(failed ? 1 : 0);
