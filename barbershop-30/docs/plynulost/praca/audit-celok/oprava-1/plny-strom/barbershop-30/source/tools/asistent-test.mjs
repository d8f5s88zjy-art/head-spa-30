#!/usr/bin/env node
// Test okna asistenta (assets/asistent.js) so serverom asistenta (asistent/api.php) a falošným API (asistent/testy/mock-api.php).
//   node source/tools/asistent-test.mjs [--out=dir]
// Kontroly: bez data-asistent sa nič nenačíta; tlačidlo až po stave „zapnuté“, zreteľne „AI“; otvorenie, návrh otázky,
// odpoveď po kúskoch, odkazy v odpovedi, karta overených termínov a Zavolať a potvrdiť termín (overené, výpadok kalendára,
// bez napojenia), Esc a návrat fokusu, rozhovor po obnovení stránky, angličtina, telefón bez pretekania a prekryvu, chyba servera;
// Barber: ikona je logo so štítkom AI, bublina pri ikone (Spýtať sa, Zavolať, zavrieť na 14 dní), Zavolať v hlavičke okna,
// Skryť Barbera do konca návštevy; časté otázky (témy, ťuknutie bez servera, súvisiace, clona a klávesnica na telefóne);
// ukážka ?asistent=ukazka označená, s overenými odpoveďami z častých otázok, nič neposiela.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASI = path.resolve(SITE, '..', 'asistent');
const { startStaticServer, PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'asistent'));
fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = await startStaticServer(SITE);
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'asi-'));
fs.mkdirSync(path.join(T, 'kal'));
fs.writeFileSync(path.join(T, 'config.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/a.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal', 'kalendar' => ['url' => 'http://127.0.0.1:8907', 'timeout' => 2.0]];`);
fs.writeFileSync(path.join(T, 'config-bez.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/b.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal'];`);
// zajtra (alebo pondelok, ak je zajtra nedeľa) je v kalendári voľno, o dva pracovné dni neskôr systém spadne (500)
const den = (n) => { const d = new Date(Date.now() + 864e5 * n); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const D1 = den(1), DCH = den(3);
fs.writeFileSync(path.join(T, 'scen.json'), JSON.stringify({ [DCH]: 'chyba500' }));
const mock = spawn('php', ['-S', '127.0.0.1:8905', path.join(ASI, 'testy', 'mock-api.php')], { env: { ...process.env, MOCK_LOG: path.join(T, 'api.log') }, stdio: 'ignore' });
const rez = spawn('php', ['-S', '127.0.0.1:8907', path.join(ASI, 'testy', 'mock-rezervacie.php')], { env: { ...process.env, MOCK_LOG: path.join(T, 'rez.log'), MOCK_SCEN: path.join(T, 'scen.json'), PHP_CLI_SERVER_WORKERS: '3' }, stdio: 'ignore' });
const api = spawn('php', ['-S', '127.0.0.1:8906', '-t', ASI], { env: { ...process.env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8905', ASISTENT_CONFIG: path.join(T, 'config.php'), PHP_CLI_SERVER_WORKERS: '3' }, stdio: 'ignore' });
const api2 = spawn('php', ['-S', '127.0.0.1:8908', '-t', ASI], { env: { ...process.env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8905', ASISTENT_CONFIG: path.join(T, 'config-bez.php') }, stdio: 'ignore' });
await sleep(800);
const API = 'http://127.0.0.1:8906/api.php';
const browser = await chromium.launch(PRESETS[0]);
try {
  // 1. bez zapnutia sa modul ani server nevolá
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const req = [];
    page.on('request', (r) => { if (/asistent|8906/.test(r.url())) req.push(r.url()); });
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off`, { waitUntil: 'load' });
    await page.mouse.move(200, 200); await sleep(1200);
    ok(req.length === 0, 'bez data-asistent sa nič nesťahuje ani neposiela', req.join(' '));
    await ctx.close();
  }
  for (const kind of ['desktop', 'mobile']) {
    const ctx = await browser.newContext(kind === 'mobile'
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent(API)}`, { waitUntil: 'load' });
    await page.mouse.move(300, 300).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 30));
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await sleep(500);
    await sleep(400);
    ok(await btn.evaluate((b) => parseFloat(getComputedStyle(b).opacity) > 0.95), `${kind}: tlačidlo asistenta je vidieť`);
    ok(await btn.evaluate((b) => /AI/.test(b.getAttribute('aria-label')) && /AI/.test(b.innerText + getComputedStyle(b, '::after').content)), `${kind}: tlačidlo je zreteľne označené AI`);
    if (kind === 'mobile') {
      const [a, c] = await page.evaluate(() => [document.querySelector('.asi-btn').getBoundingClientRect().toJSON(), document.querySelector('#mobile-cta .btn')?.getBoundingClientRect().toJSON()]);
      ok(!c || a.right <= c.left || c.width === 0, 'mobile: tlačidlo neprekrýva Zavolať a Rezervovať');
    }
    await btn.click();
    const panel = page.locator('#asi-panel');
    await panel.waitFor({ state: 'visible' });
    await sleep(100);
    ok(await page.evaluate((m) => { const a = document.activeElement; return m ? a && a.id === 'asi-panel' : a && a.tagName === 'TEXTAREA'; }, kind === 'mobile'),
      kind === 'mobile' ? 'mobile: fokus v okne, klávesnica sa nevysunie sama' : 'desktop: po otvorení je kurzor v poli otázky');
    ok(await page.locator('.asi-navrhy button').count() === 4, `${kind}: štyri návrhy otázok`);
    await page.screenshot({ path: path.join(OUT, `${kind}-otvorene.png`) });
    // časy zmien textu odpovede priamo v stránke (falošné API posiela kúsok každých 300 ms)
    await page.evaluate(() => { window.__asiT = []; new MutationObserver(() => { const b = [...document.querySelectorAll('.asi-a')].pop(); const n = b ? b.textContent.length : 0; const t = window.__asiT; if (n && (!t.length || t[t.length - 1][1] !== n)) t.push([performance.now(), n]); }).observe(document.querySelector('.asi-zoz'), { childList: true, subtree: true, characterData: true }); });
    await page.locator('.asi-navrhy button').first().click();
    await page.locator('.asi-send:not([disabled])').waitFor({ timeout: 8000 });
    const casy = await page.evaluate(() => window.__asiT);
    ok(casy.length >= 4 && casy[casy.length - 1][0] - casy[0][0] >= 900, `${kind}: odpoveď sa píše po kúskoch`, `${casy.length} zmien za ${Math.round(casy[casy.length - 1][0] - casy[0][0])} ms`);
    ok(await page.locator('.asi-u').first().innerText() === 'Koľko stojí strih?', `${kind}: otázka v rozhovore`);
    await sleep(300);
    await page.screenshot({ path: path.join(OUT, `${kind}-odpoved.png`) });
    if (kind === 'mobile') ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile: okno stránku neroztiahne do šírky');
    // odkazy v odpovedi: adresa a telefón sa dajú kliknúť, odrážky sú zoznam
    const linky = await page.evaluate(() => [...document.querySelectorAll('.asi-a')].pop().innerHTML);
    ok(/<li>.*href="https:\/\/www\.barbershop30\.sk\/rezervacia"/.test(linky) && linky.includes('href="tel:+421951267203"'), `${kind}: odkaz na rezerváciu a telefón v odpovedi`, linky.slice(0, 200));
    ok(await page.locator('.asi-akcie a[href="tel:+421951267203"]').count() >= 1, `${kind}: odpoveď o objednaní má Zavolať a potvrdiť termín`);
    // voľný termín overený v kalendári: karta s časmi z kalendára, predbežné, zavolať
    const termin = async (q, api2) => {
      await page.locator('.asi-form textarea').fill(q);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('.asi-send').disabled && !document.querySelector('.asi-pise'), null, { timeout: 15000 });
    };
    await termin(`TERMIN Adrián ${D1}`);
    const kal = await page.locator('.asi-kal').last().innerText().catch(() => '');
    ok(/Adrian/.test(kal) && /09:00/.test(kal) && /17:40/.test(kal) && /Predbežné/.test(kal), `${kind}: karta overených časov`, kal.replace(/\n/g, ' | '));
    ok(!/Jana/.test(await page.locator('#asi-panel').innerText()), `${kind}: žiadne údaje iných zákazníkov`);
    ok(await page.locator('.asi-kal + .asi-akcie a[href="tel:+421951267203"]').count() >= 1, `${kind}: pod kartou Zavolať a potvrdiť termín`);
    if (kind === 'mobile') await page.screenshot({ path: path.join(OUT, `${kind}-termin.png`) });
    const karty = await page.locator('.asi-kal').count();
    await termin(`TERMIN Adrián ${DCH}`);
    ok(await page.locator('.asi-kal').count() === karty && await page.locator('.asi-akcie').count() >= 3, `${kind}: výpadok kalendára: žiadne vymyslené časy, Zavolať áno`);
    if (kind === 'desktop') await page.screenshot({ path: path.join(OUT, `${kind}-termin.png`) });
    // Esc zatvorí a fokus sa vráti na tlačidlo
    await page.keyboard.press('Escape');
    ok(await panel.isHidden(), `${kind}: Esc zatvorí okno`);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('asi-btn')), `${kind}: fokus späť na tlačidle`);
    // rozhovor ostane po obnovení stránky (sessionStorage)
    await page.reload({ waitUntil: 'load' });
    await page.mouse.move(310, 310).catch(() => {});
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await btn.click();
    ok(await page.locator('.asi-u').count() === 3 && await page.locator('.asi-navrhy').count() === 0 && await page.locator('.asi-kal').count() === 1, `${kind}: rozhovor aj karta termínu ostali po obnovení`);
    // chyba servera: zdvorilá správa a otázka sa vráti do poľa
    await page.locator('.asi-form textarea').fill('CHYBA500');
    await page.keyboard.press('Enter');
    await page.locator('.asi-chyba').waitFor({ timeout: 8000 });
    ok(await page.locator('.asi-form textarea').inputValue() === 'CHYBA500', `${kind}: pri chybe sa otázka vráti do poľa`);
    ok(await page.locator('.asi-chyba + .asi-akcie a[href="tel:+421951267203"]').count() === 1, `${kind}: pri chybe Zavolať a potvrdiť termín`);
    // nový rozhovor
    await page.locator('.asi-novy').click();
    ok(await page.locator('.asi-u').count() === 0 && await page.locator('.asi-navrhy button').count() === 4, `${kind}: nový rozhovor`);
    ok(errs.length === 0, `${kind}: bez chýb v konzole`, errs.join(' | '));
    await ctx.close();
  }
  // angličtina: popisy okna v jazyku stránky, jazyk ide aj na server
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&lang=en&asistent=${encodeURIComponent(API)}`, { waitUntil: 'load' });
    await page.mouse.move(300, 300);
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForFunction(() => document.documentElement.lang === 'en', null, { timeout: 8000 }).catch(() => {});
    await btn.click();
    ok(/^Barber\s+AI$/.test(await page.locator('#asi-h').innerText()) && await page.locator('.asi-sub').innerText() === 'Barbershop 30 AI assistant, the front desk confirms your time', 'en: Barber, AI a podnadpis po anglicky');
    await page.locator('.asi-navrhy button').first().click();
    await page.locator('.asi-a').nth(1).filter({ hasText: '40 min' }).waitFor({ timeout: 8000 });
    const log = fs.readFileSync(path.join(T, 'api.log'), 'utf8').trim().split('\n').pop();
    ok(log.includes('Jazyk stránky návštevníka: en'), 'en: server dostal jazyk stránky');
    await page.screenshot({ path: path.join(OUT, 'desktop-en.png') });
    await ctx.close();
  }
  // bez napojenia na kalendár: poctivé „neviem overiť“, žiadna karta, Zavolať áno
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent('http://127.0.0.1:8908/api.php')}`, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 30));
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await btn.click();
    await page.locator('.asi-form textarea').fill(`TERMIN Adrián ${D1}`);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.asi-send').disabled && !document.querySelector('.asi-pise'), null, { timeout: 15000 });
    const txt = await page.locator('.asi-a').last().innerText();
    ok(/nepripojene/.test(txt) && await page.locator('.asi-kal').count() === 0 && await page.locator('.asi-akcie a[href="tel:+421951267203"]').count() === 1, 'bez kalendára: žiadne časy, Zavolať a potvrdiť termín', txt);
    await ctx.close();
  }
  // Barber: logo, bublina pri ikone, Zavolať v hlavičke, skrytie (telefón 360 px)
  {
    const ctx = await browser.newContext({ locale: 'sk-SK', viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const url = `${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent(API)}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 30));
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    ok(await btn.locator('img[src*="logo-30-barbershop"]').count() === 1 && (await btn.locator('.asi-ai').innerText()).trim() === 'AI' && /Barber/.test(await btn.getAttribute('aria-label')), 'Barber: ikona je logo so štítkom AI');
    const oznam = page.locator('.asi-oznam.is-on');
    await oznam.waitFor({ state: 'visible', timeout: 12000 });
    await sleep(500);
    const ot = await oznam.innerText();
    ok(/Barber/.test(ot) && /AI/.test(ot) && await oznam.locator('a[href="tel:+421951267203"]').count() === 1 && await oznam.locator('.asi-oznam-spytaj').isVisible(), 'Barber: bublina s menom, AI, Spýtať sa a Zavolať', ot.replace(/\n/g, ' | '));
    const [o, b] = await page.evaluate(() => ['.asi-oznam', '.asi-btn'].map((s) => document.querySelector(s).getBoundingClientRect().toJSON()));
    ok(o.bottom <= b.top && o.left >= 0 && o.right <= 360 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Barber: bublina nad ikonou, bez pretekania', `${Math.round(o.left)}–${Math.round(o.right)}, ${Math.round(o.bottom)} ≤ ${Math.round(b.top)}`);
    await page.screenshot({ path: path.join(OUT, 'mobile-bublina.png') });
    await page.locator('.asi-oznam-spytaj').click();
    await page.locator('#asi-panel').waitFor({ state: 'visible' });
    ok(await page.locator('.asi-oznam').isHidden() && await page.locator('.asi-hlava .asi-volaj[href="tel:+421951267203"]').isVisible(), 'Barber: Spýtať sa otvorí okno, Zavolať je v hlavičke');
    ok(/Barber/.test(await page.locator('#asi-h').innerText()) && /AI asistent/.test(await page.locator('.asi-sub').innerText()), 'Barber: v okne meno a AI asistent');
    await page.locator('.asi-hlava .asi-x').click();
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('asi-btn')), 'Barber: po zavretí fokus na ikone');
    // zavretie bubliny krížikom: ďalšia návšteva ju 14 dní neukáže
    await page.evaluate(() => sessionStorage.removeItem('b30.barber.oznam.raz'));
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 30));
    await oznam.waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.asi-oznam-x').click();
    ok(await page.locator('.asi-oznam').isHidden() && await page.evaluate(() => Number(localStorage.getItem('b30.barber.oznam')) > 0), 'Barber: krížik bublinu zavrie a zapamätá');
    await page.evaluate(() => sessionStorage.removeItem('b30.barber.oznam.raz'));
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 30));
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await sleep(10500);
    ok(await page.locator('.asi-oznam').isHidden(), 'Barber: zavretá bublina sa znova neukáže');
    // Skryť Barbera: ikona aj okno zmiznú do konca návštevy
    await btn.click();
    await page.locator('.asi-skry').click();
    ok(await page.locator('.asi-btn, #asi-panel, .asi-oznam').count() === 0 && !(await page.evaluate(() => document.documentElement.classList.contains('asi-open'))), 'Barber: Skryť Barbera ho schová');
    await page.reload({ waitUntil: 'load' });
    await page.mouse.move(100, 100).catch(() => {});
    await sleep(4500);
    ok(await page.locator('.asi-btn').count() === 0, 'Barber: skrytý ostane do konca návštevy');
    await ctx.close();
  }
  // časté otázky v okne (telefón 390 px): témy, otázka ťuknutím bez servera, súvisiace otázky, clona, klávesnica
  {
    const ctx = await browser.newContext({ locale: 'sk-SK', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    // náhrada visualViewport: test zmenší viditeľnú plochu ako otvorená klávesnica
    await ctx.addInitScript(() => {
      const t = new EventTarget(); t.height = innerHeight; t.offsetTop = 0; t.width = innerWidth; t.scale = 1;
      Object.defineProperty(window, 'visualViewport', { value: t, configurable: true });
      window.__klav = (h, top) => { t.height = h; t.offsetTop = top; t.dispatchEvent(new Event('resize')); };
    });
    const page = await ctx.newPage();
    const posty = [], errs = [];
    page.on('request', (r) => { if (/a=otazka/.test(r.url())) posty.push(r.url()); });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent(API)}`, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 30));
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await btn.click();
    await page.locator('.asi-temy').waitFor({ timeout: 8000 });
    ok(await page.locator('.asi-temy button').count() === 11, 'časté otázky: 11 tém na úvodnej obrazovke');
    ok(await page.locator('.asi-clona').isVisible() && await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), 'telefón: clona za oknom, stránka sa neposúva');
    await page.locator('.asi-temy button', { hasText: 'Otváracie hodiny' }).click();
    ok(await page.locator('.asi-temy button').count() >= 8 && await page.locator('.asi-temy .asi-chip-dalej', { hasText: 'Späť na témy' }).count() === 1, 'časté otázky: otázky témy a Späť na témy');
    await page.locator('.asi-temy button', { hasText: 'Kedy máte otvorené?' }).click();
    const odp = await page.locator('.asi-a').last().innerText();
    ok(/9:00 až 19:00/.test(odp) && /14:00/.test(odp) && await page.locator('.asi-zdroj').isVisible() && posty.length === 0, 'časté otázky: odpoveď hneď, označená, bez servera', odp);
    ok(await page.locator('.asi-suvis button').count() >= 2, 'časté otázky: súvisiace otázky pod odpoveďou');
    await page.locator('.asi-suvis button').first().click();
    ok(await page.locator('.asi-u').count() === 2 && await page.locator('.asi-zdroj').count() === 2, 'časté otázky: súvisiaca otázka ťuknutím');
    // otázka pre AI: odpoveď zo servera bez popisu pripravenej odpovede, pod ňou súvisiace otázky
    await page.locator('.asi-form textarea').fill('Koľko stojí strih?');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.asi-send').disabled && !document.querySelector('.asi-pise'), null, { timeout: 15000 });
    ok(posty.length === 1 && await page.locator('.asi-zdroj').count() === 2 && await page.locator('.asi-suvis').count() === 1, 'časté otázky: písaná otázka ide na server, pod odpoveďou súvisiace');
    // klávesnica: okno vyplní viditeľnú plochu, pole otázky ostane nad klávesnicou
    await page.evaluate(() => window.__klav(430, 120));
    const r = await page.evaluate(() => { const p = document.querySelector('#asi-panel').getBoundingClientRect(), f = document.querySelector('.asi-form').getBoundingClientRect(); return { top: p.top, h: p.height, fb: f.bottom, klav: document.documentElement.classList.contains('asi-klav') }; });
    ok(r.klav && Math.abs(r.top - 120) < 2 && Math.abs(r.h - 430) < 2 && r.fb <= 550 + 1, 'telefón: s klávesnicou okno presne na viditeľnej ploche', JSON.stringify(r));
    await page.screenshot({ path: path.join(OUT, 'mobile-klavesnica.png') });
    await page.evaluate(() => window.__klav(844, 0));
    ok(!(await page.evaluate(() => document.documentElement.classList.contains('asi-klav'))), 'telefón: bez klávesnice späť na spodné okno');
    await page.screenshot({ path: path.join(OUT, 'mobile-caste-otazky.png') });
    await page.locator('.asi-clona').click({ position: { x: 200, y: 40 } });
    ok(await page.locator('#asi-panel').isHidden(), 'telefón: ťuk na clonu okno zavrie');
    ok(errs.length === 0, 'časté otázky: bez chýb', errs.join(' | '));
    await ctx.close();
  }
  // ukážka bez servera: výrazne označená, odpovede z cenníka stránky, termíny nevymýšľa, nič neposiela
  {
    const ctx = await browser.newContext({ locale: 'sk-SK', viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const req = [], errs = [];
    page.on('request', (r) => { if (/api\.php|:891\d/.test(r.url())) req.push(r.url()); });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${srv.origin}/rezervacia.html?objednavka=ukazka&asistent=ukazka`, { waitUntil: 'load' });
    await page.mouse.move(300, 300);
    const btn = page.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await btn.click();
    ok(/nepíše ich AI/.test(await page.locator('.asi-ukazka-pas').innerText()) && await page.locator('.asi-note').isHidden(), 'ukážka: výrazne označené, že odpovede nepíše AI');
    const opytaj = async (q) => {
      await page.locator('.asi-form textarea').fill(q);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('.asi-send').disabled && !document.querySelector('.asi-pise'), null, { timeout: 15000 });
      return page.locator('.asi-a').last().innerText();
    };
    const cena = await opytaj('Koľko stojí strih?');
    ok(/Pánsky strih stojí 18\s€/.test(cena) && /15\s€/.test(cena) && await page.locator('.asi-zdroj').count() === 1, 'ukážka: overená odpoveď z častých otázok, označená', cena);
    const term = await opytaj('Má Adrián zajtra voľný termín?');
    ok(!/\d{1,2}:\d{2}/.test(term.replace(/od 9:00 do 19:00/g, '')) && /rezerv/.test(term) && await page.locator('.asi-kal').count() === 0 && await page.locator('.asi-akcie a[href="tel:+421951267203"]').count() >= 1, 'ukážka: voľné termíny nevymýšľa, ponúkne Zavolať', term.replace(/\n/g, ' | '));
    const nic = await opytaj('Robíte aj tetovanie obočia henou?');
    ok(/pripravených odpovediach nič nemám/.test(nic) && /0951 267 203/.test(nic), 'ukážka: neistá zhoda, poctivo telefón', nic);
    const nevie = await opytaj('Dá sa u vás parkovať?');
    ok(/0951 267 203/.test(nevie) && /zdvihneme/.test(nevie), 'ukážka: čo nevie, pošle na telefón');
    await page.screenshot({ path: path.join(OUT, 'desktop-ukazka.png') });
    ok(req.length === 0 && errs.length === 0, 'ukážka: nič sa neposiela na server, bez chýb', req.concat(errs).join(' '));
    await ctx.close();
  }
} finally {
  await browser.close();
  mock.kill(); api.kill(); api2.kill(); rez.kill();
  srv.close && srv.close();
  fs.rmSync(T, { recursive: true, force: true });
}
console.log(failed ? `${failed} FAIL` : 'všetko OK');
process.exit(failed ? 1 : 0);
