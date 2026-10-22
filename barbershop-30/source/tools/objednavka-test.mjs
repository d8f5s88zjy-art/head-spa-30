#!/usr/bin/env node
// Test objednávkového okna (assets/objednavka.js), rezervačnej stránky (rezervacia.html, assets/rezervacia.js)
// a pásu s vizitkou a vernostnou kartičkou (assets/karty.js)
// v prehliadači proti serveru asistenta (asistent/api.php) a falošnému rezervačnému systému
// (asistent/testy/mock-rezervacie.php). Nič nejde na skutočný rezervačný systém; objednávka sa nikdy neodošle.
// Snímky na kontrolu ukladá do docs/screenshots/objednavka/.
//   node source/tools/objednavka-test.mjs [--out=dir]
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
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'objednavka'));
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// časy skúšobného rezervačného systému; dnes okno ukáže len tie, ktoré ešte neprešli (test nezávisí od hodiny)
const CASY = ['09:00', '10:20', '14:00', '17:40'];
const casyOk = (c) => c.length > 0 && c.every((x) => CASY.includes(x)) && c.join() === CASY.filter((x) => c.includes(x)).join();
let zle = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${c || !x ? '' : '  ' + x}`); if (!c) zle++; };

const srv = await startStaticServer(SITE);
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'obj-'));
fs.mkdirSync(path.join(T, 'kal'));
// kľúč len aby stav asistenta hlásil zapnutý (test tlačidla AI asistenta); na API sa v teste nič neposiela
fs.writeFileSync(path.join(T, 'config.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/a.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal', 'kalendar' => ['url' => 'http://127.0.0.1:8973', 'timeout' => 2.0]];`);
fs.writeFileSync(path.join(T, 'config-bez.php'), `<?php return ['kluc' => '', 'db' => '${T}/b.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal'];`);
const SCEN = path.join(T, 'scen.json'), LOG = path.join(T, 'rez.log');
fs.writeFileSync(SCEN, '{}');
const env = { ...process.env, MOCK_LOG: LOG, MOCK_SCEN: SCEN, PHP_CLI_SERVER_WORKERS: '4' };
const deti = [
  spawn('php', ['-S', '127.0.0.1:8973', path.join(ASI, 'testy', 'mock-rezervacie.php')], { env, stdio: 'ignore' }),
  spawn('php', ['-S', '127.0.0.1:8972', '-t', ASI], { env: { ...env, ASISTENT_CONFIG: path.join(T, 'config.php') }, stdio: 'ignore' }),
  spawn('php', ['-S', '127.0.0.1:8974', '-t', ASI], { env: { ...env, ASISTENT_CONFIG: path.join(T, 'config-bez.php') }, stdio: 'ignore' }),
];
// aj pri páde testu zastaviť servery (inak by ďalší beh dostal staré s inou konfiguráciou)
process.on('exit', () => deti.forEach((d) => d.kill()));
process.on('uncaughtException', (e) => { console.error(e); process.exit(1); });
await sleep(900);
const API = 'http://127.0.0.1:8972/api.php';
const browser = await chromium.launch(PRESETS[0]);

// dni ako server (Bratislava): prvý pracovný deň od dnes, nedeľa zatvorená
const iso = (d) => d.toISOString().slice(0, 10);

async function stranka(w, h, q, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800, locale: 'sk-SK', colorScheme: 'dark', ...extra });
  const page = await ctx.newPage();
  const von = [];
  // žiadna požiadavka na skutočné rezervačné systémy ani cudzie servery
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => { von.push(r.request().url()); r.abort(); });
  const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&${q}`, { waitUntil: 'load' });
  return { ctx, page, von, chyby };
}
// snímka až po príchode okna a kroku (320 a 280 ms)
const snimka = async (page, f) => { await sleep(450); await page.screenshot({ path: path.join(OUT, f) }); };
async function stranka0(w, h, q) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800, locale: 'sk-SK', colorScheme: 'dark' });
  const page = await ctx.newPage();
  const von = [], chyby = [];
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => { von.push(r.request().url()); r.abort(); });
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.goto(`${srv.origin}/rezervacia.html${q ? '?' + q : ''}`, { waitUntil: 'load' });
  return { ctx, page, von, chyby };
}
const preteka = (page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('.obj[open] *')].some((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.obj-dni'); }));

/* ---------- 1. telefón 390: celá cesta služba → barber → deň → čas → výber ---------- */
{
  const { ctx, page, von, chyby } = await stranka(390, 844, `objednavka=${encodeURIComponent(API)}&vernost=ukazka`);
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => document.documentElement.classList.contains('obj-zapnute')), 'okno sa zapne až po stave servera s pripojeným kalendárom');
  // pás s vizitkou a kartičkou
  await page.waitForSelector('.band-karty', { timeout: 10000 }).catch(() => {});
  ok(await page.evaluate(() => { const p = document.querySelector('.band-karty'); return !!p && p.previousElementSibling.classList.contains('band-contact'); }), 'pás s vizitkou je hneď pod kontaktom');
  ok(await page.locator('.band-karty .viz-strana').count() === 2, 'vizitka má prednú aj zadnú stranu');
  ok(await page.evaluate(() => { const t = document.querySelector('.viz-pred').textContent; return ['0951 267 203', 'info@barbershop30.sk', 'Mostná 30, 949 01 Nitra', 'www.barbershop30.sk'].every((x) => t.includes(x)) && !document.querySelector('.viz-zad').textContent.trim(); }), 'vizitka ako ich: kontakt z fotky vpredu, zadná strana bez textu');
  await page.locator('.band-karty').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.viz-kruh img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 10000 }).catch(() => {});
  ok(await page.evaluate(() => [...document.querySelectorAll('.viz-kruh img')].length === 2 && [...document.querySelectorAll('.viz-kruh img')].every((i) => i.naturalWidth > 0)), 'vizitka: pôvodné logo v kruhu na oboch stranách');
  ok(await page.evaluate(() => /barbershop30\.vcf$/.test(document.querySelector('.karty-vizitka a.btn-secondary').href) && !document.querySelector('.karty-vizitka a[href$=".pdf"]')), 'Uložiť kontakt (vCard), bez vymysleného PDF');
  ok((await page.request.get(`${srv.origin}/assets/barbershop30.vcf`)).ok(), 'súbor kontaktu existuje');
  ok(await page.locator('.karty-vernost .vk').count() === 1 && await page.locator('.karty-vernost .je-ukazka').count() === 1, 'vernostná kartička: ukážka s vypnutým tlačidlom (prihláška nie je zapnutá)');
  await page.evaluate(() => { document.documentElement.lang = 'de'; });
  await sleep(100);
  ok(await page.evaluate(() => document.querySelector('.karty-vizitka .eyebrow').textContent === 'Unsere Visitenkarte' && document.querySelector('.karty-vernost .eyebrow').textContent === 'Treuekarte' && document.querySelector('.viz-tel').textContent === '0951 267 203'), 'zmena jazyka: texty pásu preložené, vizitka ostáva slovenská ako vytlačená');
  await page.evaluate(() => { document.documentElement.lang = 'sk'; });
  await page.locator('.band-karty').scrollIntoViewIfNeeded();
  await sleep(400);
  await page.locator('.karty-vizitka').screenshot({ path: path.join(OUT, 'vizitka-390.png') });
  await page.locator('.karty-vernost').screenshot({ path: path.join(OUT, 'karticka-390.png') });

  // Objednať sa v úvode
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
  await page.waitForSelector('.obj[open]');
  ok(await page.locator('.obj-sluzby button').count() === 15, 'krok 1: 15 služieb z cenníka');
  ok(await page.evaluate(() => document.querySelector('.obj-sluzby button').textContent.includes('Pánsky strih') && document.querySelector('.obj-sluzby button').textContent.includes('18 €')), 'krok 1: názov, čas a cena ako na webe');
  ok(!(await preteka(page)), 'krok 1: nič nepreteká do strany');
  await snimka(page, '1-sluzba-390.png');
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih a úprava brady' }).click();
  await page.waitForSelector('.obj-tim button');
  const tim = await page.locator('.obj-tim button').allTextContents();
  ok(tim.length === 3 && tim[0].includes('Nezáleží') && tim.some((t) => t.includes('Adrian')), 'krok 2: Nezáleží a barberi z rezervačného systému', JSON.stringify(tim));
  ok(await page.locator('.obj-tim img').count() >= 2, 'krok 2: portréty z tímu na webe');
  ok(!(await preteka(page)), 'krok 2: nič nepreteká');
  // najkratšia cesta: najbližšie voľné časy u kohokoľvek hneď nad tímom
  await page.waitForSelector('.obj-rychlo:not([hidden]) .obj-mriezka button', { timeout: 10000 }).catch(() => {});
  const rychle = await page.locator('.obj-rychlo .obj-mriezka button').allTextContents();
  ok(casyOk(rychle) && (await page.locator('.obj-rychlo-h').textContent()).startsWith('Najbližšie voľné'), 'krok 2: najbližšie voľné časy u kohokoľvek nad tímom', JSON.stringify(rychle));
  await snimka(page, '2-barber-390.png');
  await page.locator('.obj-tim button', { hasText: 'Adrian' }).click();
  await page.waitForSelector('.obj-mriezka button', { timeout: 10000 }).catch(() => {});
  const casy = await page.locator('.obj-mriezka button').allTextContents();
  ok(casyOk(casy), 'krok 3: prvý otvorený deň s voľným časom vybraný, časy z kalendára', JSON.stringify(casy));
  ok(!(await page.locator('.obj').textContent()).includes('Jana'), 'súkromie: meno iného zákazníka nikde');
  ok(await page.evaluate(() => [...document.querySelectorAll('.obj-dni button')].some((b) => b.disabled && b.textContent.includes('zatvorené'))), 'krok 3: nedeľa zatvorená (pravidlo kalendára)');
  ok(await page.evaluate(() => /Predbežné|predbežný/.test(document.querySelector('.obj-casy').textContent)), 'krok 3: časy sú označené ako predbežné s časom overenia');
  ok(!(await preteka(page)), 'krok 3: nič nepreteká (pás dní sa posúva vo vnútri)');
  await snimka(page, '3-den-cas-390.png');
  const cas1 = casy[0];
  await page.locator('.obj-mriezka button', { hasText: cas1 }).click();
  await page.waitForSelector('.obj-suhrn');
  const t4 = await page.locator('.obj').textContent();
  ok(t4.includes('Pánsky strih a úprava brady') && t4.includes('Adrian') && t4.includes('o ' + cas1), 'krok 4: výber služby, barbera, dňa a času');
  ok(t4.includes('Termín ešte nie je rezervovaný') && !/rezervovan[ýá]\b(?! )|úspešn|potvrden[ýá] /i.test(t4.replace('Termín ešte nie je rezervovaný', '')), 'krok 4: žiadny úspech bez skutočného potvrdenia');
  ok(await page.evaluate(() => { const a = document.querySelectorAll('.obj-akcie a'); return a.length === 2 && /barbershop30\.sk\/rezervacia$/.test(a[0].href) && a[0].hasAttribute('data-obj-priamo') && a[1].href === 'tel:+421951267203'; }), 'krok 4: Dokončiť v rezervačnom systéme a Zavolať a potvrdiť termín');
  ok(!(await preteka(page)), 'krok 4: nič nepreteká');
  await snimka(page, '4-vyber-390.png');
  // jazyk počas otvoreného okna
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await sleep(200);
  ok((await page.locator('.obj-h').textContent()) === 'Your choice' && (await page.locator('.obj').textContent()).includes('Finish in the booking system'), 'zmena jazyka preloží okno');
  await page.evaluate(() => { document.documentElement.lang = 'sk'; });
  // späť cez výber a tlačidlo Späť telefónu
  await page.locator('.obj-vyber button').first().click();
  ok((await page.locator('.obj-h').textContent()) === 'Čo si dáš?', 'ťuknutie na výber vráti na krok');
  await page.goBack();
  await sleep(300);
  ok(!(await page.locator('.obj[open]').count()), 'tlačidlo Späť v telefóne zatvorí okno');
  ok(page.url().startsWith(srv.origin), 'stránka ostala');

  // cenník: Objednať pri službe otvorí rovno krok 2
  await page.locator('a.price-cta[data-sluzba="3"]').scrollIntoViewIfNeeded();
  await page.locator('a.price-cta[data-sluzba="3"]').click();
  await page.waitForSelector('.obj[open] .obj-tim button', { timeout: 10000 }).catch(() => {});
  ok((await page.locator('.obj-h').textContent()) === 'Kedy a u koho?' && (await page.locator('.obj-vyber').textContent()).includes('Úprava brady'), 'cenník: služba vybraná, rovno krok barber');
  await page.keyboard.press('Escape');
  await sleep(300);
  ok(!(await page.locator('.obj[open]').count()), 'Esc zatvorí okno');

  // tím: Objednať sa pri barberovi → po službe rovno deň
  const adrian = page.locator('.team-card', { hasText: 'Adrian' }).locator('.team-cta');
  await adrian.scrollIntoViewIfNeeded();
  await adrian.click();
  await page.waitForSelector('.obj[open] .obj-sluzby button');
  await page.locator('.obj-sluzby button', { hasText: 'Oholenie hlavy' }).click();
  await page.waitForSelector('.obj-dni button', { timeout: 10000 }).catch(() => {});
  ok((await page.locator('.obj-h').textContent()) === 'Kedy?' && (await page.locator('.obj-vyber').textContent()).includes('Adrian') && !(await page.locator('.obj-rychlo:not([hidden])').count()), 'tím: barber vybraný, po službe rovno deň (bez rýchlej voľby u kohokoľvek)');
  await page.locator('.obj-spat').click();
  ok((await page.locator('.obj-h').textContent()) === 'Kedy a u koho?', 'Späť ukáže celý tím (výber z tímu sa nepoužije znova)');
  await page.keyboard.press('Escape');
  await sleep(400);                                     // zatvorenie vráti históriu (Späť v telefóne) a s ňou aj skrol

  // výpadok rezervačného systému v prvý deň: poctivá chyba a telefón
  const d = new Date(Date.now() + 864e5 * 2); while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  fs.writeFileSync(SCEN, JSON.stringify({ [iso(d)]: 'chyba500' }));
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
  await page.locator('.obj-sluzby button', { hasText: 'Úprava obočia' }).click();
  await page.locator('.obj-tim button', { hasText: 'Nikolas' }).click();
  await page.waitForSelector('.obj-mriezka button');
  await page.locator('.obj-dni button', { has: page.locator(`b:text-is("${d.getDate()}")`) }).first().click();
  await page.waitForFunction(() => /neviem overiť/.test(document.querySelector('.obj-casy').textContent), null, { timeout: 10000 }).catch(() => {});
  const tc = await page.locator('.obj-casy').textContent();
  ok(tc.includes('Voľné časy teraz neviem overiť') && tc.includes('telefón vždy zdvihneme') && !(await page.locator('.obj-mriezka').count()), 'výpadok kalendára: žiadne časy, poctivá správa a telefón');
  await snimka(page, '3-vypadok-390.png');
  await page.keyboard.press('Escape');
  fs.writeFileSync(SCEN, '{}');

  ok(!von.length, 'žiadna požiadavka na skutočný rezervačný systém', von.join(' '));
  ok(!chyby.length, 'bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}

/* ---------- 2. šírky 360 a 430, tablet a počítač: okno bez pretekania ---------- */
for (const [w, h] of [[360, 780], [430, 932], [768, 1024], [1440, 900]]) {
  const { ctx, page, chyby } = await stranka(w, h, `objednavka=${encodeURIComponent(API)}&vernost=ukazka`);
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.band-karty', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('a.price-cta[data-sluzba="1"]').scrollIntoViewIfNeeded();
  await page.locator('a.price-cta[data-sluzba="1"]').click();
  // Objednať pri službe → ťuk na najbližší čas = výber (dve kliknutia)
  await page.waitForSelector('.obj-rychlo:not([hidden]) .obj-mriezka button', { timeout: 10000 }).catch(() => {});
  ok(!(await preteka(page)), `${w} px: rýchla voľba bez pretekania`);
  await snimka(page, `2-rychlo-${w}.png`);
  const prvy = (await page.locator('.obj-rychlo .obj-mriezka button').first().textContent()).trim();
  await page.locator('.obj-rychlo .obj-mriezka button').first().click();
  ok((await page.locator('.obj-h').textContent()) === 'Tvoj výber' && (await page.locator('.obj-suhrn').textContent()).includes('o ' + prvy), `${w} px: dve kliknutia od služby po výber času`);
  await page.locator('.obj-vyber button').nth(1).click();
  await page.locator('.obj-tim button', { hasText: 'Nezáleží' }).click();
  await page.waitForSelector('.obj-dni + .obj-casy .obj-mriezka button, .obj-casy .obj-mriezka button', { timeout: 10000 }).catch(() => {});
  ok(!(await preteka(page)) && casyOk(await page.locator('.obj-casy .obj-mriezka button').allTextContents()), `${w} px: deň a časy bez pretekania`);
  await snimka(page, `3-den-cas-${w}.png`);
  await page.keyboard.press('Escape');
  await page.locator('.band-karty').scrollIntoViewIfNeeded();
  await sleep(300);
  ok(!(await preteka(page)), `${w} px: pás s vizitkou bez pretekania`);
  await page.locator('.band-karty').screenshot({ path: path.join(OUT, `karty-${w}.png`) });
  ok(!chyby.length, `${w} px: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}

/* ---------- 3. bez zapnutia: odkazy idú rovno do rezervačného systému, nič sa nesťahuje ---------- */
{
  const { ctx, page } = await stranka(390, 844, '');
  const ziadosti = [];
  page.on('request', (r) => { if (/objednavka\.js|api\.php/.test(r.url())) ziadosti.push(r.url()); });
  await page.mouse.move(10, 10);
  await sleep(3500);
  ok(!ziadosti.length && !(await page.evaluate(() => document.documentElement.classList.contains('obj-zapnute'))), 'bez data-objednavka sa nič nesťahuje ani neposiela');
  ok(await page.locator('.karty-vernost').count() === 0 && await page.locator('.karty-vizitka').count() === 1, 'bez zapnutej prihlášky sa vernostná kartička neukáže, vizitka áno');
  const [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 5000 }).catch(() => null), page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click()]);
  ok(!!popup && /barbershop30\.sk\/rezervacia/.test(popup.url()) && !(await page.locator('.obj[open]').count()), 'Objednať sa otvorí rezervačný systém');
  await ctx.close();
}
/* ---------- 4. zapnutá prihláška vernostnej kartičky (ako po nasadení s heslom recepcie) ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
  const page = await ctx.newPage();
  const von = [];
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => { von.push(r.request().url()); r.abort(); });
  // príznak data-zapnute ako po nasadení: doplní sa na skript prihlášky ešte pred jeho spustením (odložený skript);
  // podstrčená stránka cez page.route by bola pre Chrome verejná a ten by zablokoval dopyt na lokálny server
  await page.addInitScript(() => new MutationObserver((z) => z.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeName === 'SCRIPT' && n.getAttribute('data-prevadzka') === 'barbershop') n.setAttribute('data-zapnute', '');
  }))).observe(document, { childList: true, subtree: true }));
  const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&objednavka=${encodeURIComponent(API)}`, { waitUntil: 'load' });
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.karty-vernost', { timeout: 10000 }).catch(() => {});
  ok(await page.locator('.karty-vernost a.btn-primary[data-vernost-karta]').count() === 1 && !(await page.locator('.karty-ukazka').count()), 'zapnutá prihláška: kartička na stránke s aktívnym tlačidlom');
  await page.locator('.karty-vernost a.btn-primary').scrollIntoViewIfNeeded();
  await page.locator('.karty-vernost a.btn-primary').click();
  await page.waitForSelector('#v30p[open]', { timeout: 5000 }).catch(() => {});
  ok((await page.locator('#v30p[open] h2').textContent().catch(() => '')).includes('Vernostná kartička Barbershop 30'), 'Chcem vernostnú kartičku otvorí prihlášku');
  await sleep(600);
  await page.keyboard.press('Escape');
  // prihláška sa musí zavrieť, inak by ďalšie kliknutie trafilo jej pozadie (nestabilný test)
  await page.waitForFunction(() => !document.querySelector('#v30p[open]'), null, { timeout: 3000 }).catch(() => page.evaluate(() => document.querySelector('#v30p').close()));
  await sleep(300);
  // celá cesta objednávky: na konci Dokončiť v rezervačnom systéme → prihláška sa opýta na kartičku (nič sa neodošle)
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* nič */ } scrollTo(0, 0); });
  await sleep(400);
  await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
  await page.waitForSelector('.obj[open]', { timeout: 5000 }).catch(async () => console.log('DIAG', JSON.stringify(await page.evaluate(() => ({ c: document.documentElement.className, v: !!document.querySelector('#v30p[open]'), y: scrollY, h: location.href, st: history.state, a: document.activeElement && document.activeElement.outerHTML.slice(0, 120) })))));
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih' }).first().click();
  await page.locator('.obj-tim button', { hasText: 'Nezáleží' }).click();
  await page.waitForSelector('.obj-mriezka button', { timeout: 10000 }).catch(async () => { await snimka(page, 'chyba-4.png'); console.log(await page.locator('.obj').textContent()); });
  await page.locator('.obj-mriezka button').first().click();
  await page.locator('.obj-akcie a', { hasText: 'Dokončiť v rezervačnom systéme' }).click();
  await page.waitForSelector('#v30p[open]', { timeout: 5000 }).catch(() => {});
  ok(await page.locator('#v30p[open]').count() === 1 && await page.locator('.obj[open]').count() === 1, 'Dokončiť: prihláška kartičky nad výberom, výber ostáva');
  await sleep(500);
  await snimka(page, '5-dokoncit-karticka-390.png');
  ok(!von.length, 'zapnutá prihláška: nič neodišlo von', von.join(' '));
  ok(!chyby.length, 'zapnutá prihláška: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
/* server bez napojenia kalendára: okno sa nezapne */
{
  const { ctx, page } = await stranka(390, 844, `objednavka=${encodeURIComponent('http://127.0.0.1:8974/api.php')}`);
  await page.mouse.move(10, 10);
  await sleep(3500);
  ok(!(await page.evaluate(() => document.documentElement.classList.contains('obj-zapnute'))), 'kalendár nepripojený: okno sa nezapne, odkazy ostanú');
  await ctx.close();
}

/* ---------- 5. rezervačná stránka (rezervacia.html) ---------- */
{
  // bez skriptu: úvod, cenník s odkazmi do rezervačného systému, kontakt
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => r.abort());
  await page.goto(`${srv.origin}/rezervacia.html`, { waitUntil: 'load' });
  ok(await page.evaluate(() => document.querySelector('h1').textContent.includes('Kedy') && document.querySelectorAll('a.price-cta[data-sluzba][href*="barbershop30.sk/rezervacia"]').length === 15 && document.querySelectorAll('a[href="tel:+421951267203"]').length >= 3), 'stránka bez skriptu: úvod, 15 služieb s odkazom do rezervačného systému, telefón');
  await sleep(800);                                    // krátky príchod úvodu (600 ms) aj bez skriptu
  const bs = await page.evaluate(() => ({ o: getComputedStyle(document.querySelector('.rez-uvod .title')).opacity, sw: document.documentElement.scrollWidth, iw: innerWidth }));
  ok(bs.o === '1' && bs.sw <= bs.iw, 'stránka bez skriptu: text viditeľný, nič nepreteká', JSON.stringify(bs));
  await snimka(page, 'stranka-bez-skriptu-390.png');
  await ctx.close();
}
{
  // bez príznaku: cenník ostane, nič sa nesťahuje ani neposiela
  const { ctx, page, chyby } = await stranka0(390, 844, '');
  const ziadosti = [];
  page.on('request', (r) => { if (/objednavka\.js|api\.php|asistent\.js/.test(r.url())) ziadosti.push(r.url()); });
  await page.mouse.move(10, 10);
  await sleep(3200);
  ok(!ziadosti.length && await page.locator('.rez-cennik').isVisible() && !(await page.locator('.obj-stranka').count()), 'stránka bez príznaku: cenník, nič sa nesťahuje ani neposiela');
  ok(!chyby.length, 'stránka bez príznaku: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
for (const [w, h] of [[360, 780], [390, 844], [430, 932], [768, 1024], [1440, 900]]) {
  const { ctx, page, von, chyby } = await stranka0(w, h, `objednavka=${encodeURIComponent(API)}&asistent=${encodeURIComponent(API)}`);
  await page.waitForSelector('.obj-stranka .obj-sluzby button', { timeout: 10000 }).catch(() => {});
  ok(await page.locator('.obj-stranka .obj-sluzby button').count() === 15 && !(await page.locator('.rez-cennik').isVisible()), `stránka ${w} px: kroky priamo na stránke namiesto cenníka`);
  if (w === 390) await snimka(page, 'stranka-1-390.png');
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih a úprava brady' }).click();
  await page.locator('.obj-tim button', { hasText: 'Adrian' }).click();
  await page.waitForSelector('.obj-mriezka button', { timeout: 10000 }).catch(() => {});
  const cs = await page.locator('.obj-mriezka button').allTextContents();
  ok(casyOk(cs) && !(await preteka(page)), `stránka ${w} px: voľné časy, nič nepreteká`, JSON.stringify(cs));
  await snimka(page, `stranka-3-${w}.png`);
  await page.locator('.obj-mriezka button', { hasText: cs[0] }).click();
  const t = await page.locator('.obj-stranka').textContent();
  ok(t.includes('Termín ešte nie je rezervovaný') && t.includes('o ' + cs[0]) && await page.locator('.obj-stranka .obj-akcie a[href$="barbershop30.sk/rezervacia"]').count() === 1, `stránka ${w} px: výber predbežný, dokončenie v rezervačnom systéme`);
  if (w === 390) {
    await snimka(page, 'stranka-4-390.png');
    // AI asistent na otázky aj na rezervačnej stránke, zreteľne označený
    await page.mouse.move(20, 20);
    await page.waitForSelector('.asi-btn.is-on', { timeout: 10000 }).catch(() => {});
    ok((await page.locator('.asi-btn').getAttribute('aria-label').catch(() => '') || await page.locator('.asi-btn').textContent().catch(() => '')).includes('AI'), 'stránka: AI asistent na otázky, označený ako AI');
  }
  ok(!von.length, `stránka ${w} px: žiadna požiadavka na skutočné systémy`, von.join(' '));
  ok(!chyby.length, `stránka ${w} px: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}
{
  // odkaz s predvoľbou (napr. z Instagramu): služba a barber vybraní, rovno deň; jazyk stránky preloží aj kroky
  const { ctx, page } = await stranka0(390, 844, `objednavka=${encodeURIComponent(API)}&sluzba=1&barber=Adrian&lang=en`);
  await page.waitForSelector('.obj-dni button', { timeout: 10000 }).catch(() => {});
  ok((await page.locator('.obj-stranka .obj-vyber').textContent()).includes('Adrian') && (await page.locator('.obj-h').textContent()) === 'When?', 'stránka: ?sluzba=1&barber=Adrian rovno na deň, kroky po anglicky');
  await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('.rez-uvod .title-sub').textContent.startsWith('Pick a service'), null, { timeout: 10000 }).catch(() => {});
  ok(await page.evaluate(() => document.querySelector('.rez-uvod .title-sub').textContent.startsWith('Pick a service') && document.title.startsWith('Booking')), 'stránka po anglicky: úvod aj názov stránky');
  await ctx.close();
}

ok(!fs.readFileSync(LOG, 'utf8').includes('makeOrder'), 'objednávka (makeOrder) sa nikdy neodoslala');
await browser.close();
deti.forEach((d) => d.kill());
srv.close && srv.close();
fs.rmSync(T, { recursive: true, force: true });
console.log(zle ? `VÝSLEDOK: ${zle} zlyhalo` : 'VÝSLEDOK: všetko v poriadku', '· snímky:', OUT);
process.exit(zle ? 1 : 0);
