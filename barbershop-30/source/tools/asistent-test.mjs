#!/usr/bin/env node
// Test okna asistenta (assets/asistent.js) so serverom asistenta (asistent/api.php) a falošným API (asistent/testy/mock-api.php).
//   node source/tools/asistent-test.mjs [--out=dir]
// Kontroly: bez data-asistent sa nič nenačíta; tlačidlo až po stave „zapnuté“, zreteľne „AI“; otvorenie, návrh otázky,
// odpoveď po kúskoch, odkazy v odpovedi, karta overených termínov a Zavolať a potvrdiť termín (overené, výpadok kalendára,
// bez napojenia), Esc a návrat fokusu, rozhovor po obnovení stránky, angličtina, telefón bez pretekania a prekryvu, chyba servera.
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
fs.writeFileSync(path.join(T, 'config.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/a.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal', 'kalendar' => ['url' => 'http://127.0.0.1:8913', 'timeout' => 2.0]];`);
fs.writeFileSync(path.join(T, 'config-bez.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/b.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal'];`);
// zajtra (alebo pondelok, ak je zajtra nedeľa) je v kalendári voľno, o dva pracovné dni neskôr systém spadne (500)
const den = (n) => { const d = new Date(Date.now() + 864e5 * n); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const D1 = den(1), DCH = den(3);
fs.writeFileSync(path.join(T, 'scen.json'), JSON.stringify({ [DCH]: 'chyba500' }));
const mock = spawn('php', ['-S', '127.0.0.1:8911', path.join(ASI, 'testy', 'mock-api.php')], { env: { ...process.env, MOCK_LOG: path.join(T, 'api.log') }, stdio: 'ignore' });
const rez = spawn('php', ['-S', '127.0.0.1:8913', path.join(ASI, 'testy', 'mock-rezervacie.php')], { env: { ...process.env, MOCK_LOG: path.join(T, 'rez.log'), MOCK_SCEN: path.join(T, 'scen.json'), PHP_CLI_SERVER_WORKERS: '3' }, stdio: 'ignore' });
const api = spawn('php', ['-S', '127.0.0.1:8912', '-t', ASI], { env: { ...process.env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8911', ASISTENT_CONFIG: path.join(T, 'config.php'), PHP_CLI_SERVER_WORKERS: '3' }, stdio: 'ignore' });
const api2 = spawn('php', ['-S', '127.0.0.1:8914', '-t', ASI], { env: { ...process.env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8911', ASISTENT_CONFIG: path.join(T, 'config-bez.php') }, stdio: 'ignore' });
await sleep(800);
const API = 'http://127.0.0.1:8912/api.php';
const browser = await chromium.launch(PRESETS[0]);
try {
  // 1. bez zapnutia sa modul ani server nevolá
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const req = [];
    page.on('request', (r) => { if (/asistent|8912/.test(r.url())) req.push(r.url()); });
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
    ok(await page.locator('.asi-chips button').count() === 4, `${kind}: štyri návrhy otázok`);
    await page.screenshot({ path: path.join(OUT, `${kind}-otvorene.png`) });
    // časy zmien textu odpovede priamo v stránke (falošné API posiela kúsok každých 300 ms)
    await page.evaluate(() => { window.__asiT = []; new MutationObserver(() => { const b = [...document.querySelectorAll('.asi-a')].pop(); const n = b ? b.textContent.length : 0; const t = window.__asiT; if (n && (!t.length || t[t.length - 1][1] !== n)) t.push([performance.now(), n]); }).observe(document.querySelector('.asi-zoz'), { childList: true, subtree: true, characterData: true }); });
    await page.locator('.asi-chips button').first().click();
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
    ok(await page.locator('.asi-u').count() === 3 && await page.locator('.asi-chips').count() === 0 && await page.locator('.asi-kal').count() === 1, `${kind}: rozhovor aj karta termínu ostali po obnovení`);
    // chyba servera: zdvorilá správa a otázka sa vráti do poľa
    await page.locator('.asi-form textarea').fill('CHYBA500');
    await page.keyboard.press('Enter');
    await page.locator('.asi-chyba').waitFor({ timeout: 8000 });
    ok(await page.locator('.asi-form textarea').inputValue() === 'CHYBA500', `${kind}: pri chybe sa otázka vráti do poľa`);
    ok(await page.locator('.asi-chyba + .asi-akcie a[href="tel:+421951267203"]').count() === 1, `${kind}: pri chybe Zavolať a potvrdiť termín`);
    // nový rozhovor
    await page.locator('.asi-novy').click();
    ok(await page.locator('.asi-u').count() === 0 && await page.locator('.asi-chips button').count() === 4, `${kind}: nový rozhovor`);
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
    ok(await page.locator('#asi-h').innerText() === 'Barbershop 30 AI assistant', 'en: nadpis okna po anglicky');
    await page.locator('.asi-chips button').first().click();
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
    await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent('http://127.0.0.1:8914/api.php')}`, { waitUntil: 'load' });
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
} finally {
  await browser.close();
  mock.kill(); api.kill(); api2.kill(); rez.kill();
  srv.close && srv.close();
  fs.rmSync(T, { recursive: true, force: true });
}
console.log(failed ? `${failed} FAIL` : 'všetko OK');
process.exit(failed ? 1 : 0);
