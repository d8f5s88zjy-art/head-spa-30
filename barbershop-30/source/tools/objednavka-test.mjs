#!/usr/bin/env node
// Test objednávkového okna (assets/objednavka.js) – jediná cesta k objednaniu (Lajko 9. 11. 2026, bod 7): každý odkaz
// Objednať sa otvorí okno, ?objednat=1 ho otvorí po načítaní, rezervacia.html je len presmerovanie; bez servera, keď
// server visí, zlyhá alebo nie je internet, okno do 8 s povie „Objednávka cez web teraz nejde – zavolaj“ (Zavolať,
// Skúsiť znova, otváracie hodiny) – a pásu s vizitkou a vernostnou kartičkou (assets/karty.js)
// v prehliadači proti serveru asistenta (asistent/api.php) a falošnému rezervačnému systému
// (asistent/testy/mock-rezervacie.php). Nič nejde na skutočný rezervačný systém; objednávka sa nikdy neodošle.
// Snímky na kontrolu ukladá do docs/screenshots/objednavka/.
//   node source/tools/objednavka-test.mjs [--out=dir] [--port=8972]   (port servera asistenta, ďalšie dva: kalendár, server bez kalendára)
// Bez knižnice servera (asistent/vendor z composer install) časti so serverom preskočí a vypíše PRESKOČENÉ; časti bez
// servera (bez zapnutia, stránka bez skriptu a bez príznaku, ukážka) pobežia aj tak.
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
// voľné časy falošného systému: u konkrétneho barbera a u kohokoľvek (vtedy aj 12:00, asistent/testy/mock-rezervacie.php)
const CASY = ['09:00', '10:20', '14:00', '17:40'], CASY_KTOKOLVEK = ['09:00', '10:20', '12:00', '14:00', '17:40'];
const casyOk = (c, vzor = CASY) => c.length > 0 && c.every((x) => vzor.includes(x)) && c.join() === vzor.filter((x) => c.includes(x)).join();
let zle = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${c || !x ? '' : '  ' + x}`); if (!c) zle++; };

const P0 = Number(opt.port || 8972), PR = P0 + 1, PB = P0 + 2;   // server asistenta, kalendár, server bez kalendára
let php = false; try { php = (await import('node:child_process')).spawnSync('php', ['-v']).status === 0; } catch (e) { /* bez php */ }
const SERVER = php && fs.existsSync(path.join(ASI, 'vendor', 'autoload.php'));
if (!SERVER) console.log(`PRESKOČENÉ časti so serverom: ${php ? 'chýba asistent/vendor (spusti composer install v asistent/)' : 'chýba php'}; pobežia len časti bez servera`);
const srv = await startStaticServer(SITE);
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'obj-'));
fs.mkdirSync(path.join(T, 'kal'));
// kľúč len aby stav asistenta hlásil zapnutý (test tlačidla AI asistenta); na API sa v teste nič neposiela
fs.writeFileSync(path.join(T, 'config.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/a.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal', 'kalendar' => ['url' => 'http://127.0.0.1:${PR}', 'timeout' => 2.0]];`);
fs.writeFileSync(path.join(T, 'config-bez.php'), `<?php return ['kluc' => '', 'db' => '${T}/b.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal'];`);
const SCEN = path.join(T, 'scen.json'), LOG = path.join(T, 'rez.log');
fs.writeFileSync(SCEN, '{}');
const env = { ...process.env, MOCK_LOG: LOG, MOCK_SCEN: SCEN, PHP_CLI_SERVER_WORKERS: '4' };
// vlastná skupina procesov: php -S s viacerými workermi má podprocesy, zastaviť treba celú skupinu
const deti = SERVER ? [
  spawn('php', ['-S', `127.0.0.1:${PR}`, path.join(ASI, 'testy', 'mock-rezervacie.php')], { env, stdio: 'ignore', detached: true }),
  spawn('php', ['-S', `127.0.0.1:${P0}`, '-t', ASI], { env: { ...env, ASISTENT_CONFIG: path.join(T, 'config.php') }, stdio: 'ignore', detached: true }),
  spawn('php', ['-S', `127.0.0.1:${PB}`, '-t', ASI], { env: { ...env, ASISTENT_CONFIG: path.join(T, 'config-bez.php') }, stdio: 'ignore', detached: true }),
] : [];
const zastav = () => deti.forEach((d) => { try { process.kill(-d.pid); } catch (e) { /* už nebeží */ } });
// aj pri páde testu zastaviť servery (inak by ďalší beh dostal staré s inou konfiguráciou)
process.on('exit', zastav);
process.on('uncaughtException', (e) => { console.error(e); process.exit(1); });
if (SERVER) await sleep(900);
const API = `http://127.0.0.1:${P0}/api.php`;
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
  // odpovede servera pre výpis pri chybe (DIAG)
  page.api = [];
  page.on('requestfailed', (r) => { if (/api\.php/.test(r.url())) page.api.push('ZLYHALO ' + r.url().split('?')[1] + ' ' + (r.failure() || {}).errorText); });
  page.on('response', async (r) => { if (/api\.php/.test(r.url())) page.api.push(r.status() + ' ' + r.url().split('?')[1] + ' ' + (await r.text().catch(() => '')).slice(0, 90)); });
  await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&${q}`, { waitUntil: 'load' });
  return { ctx, page, von, chyby };
}
// na vrch stránky hneď (stránka má plynulé skrolovanie, klik počas jazdy by trafil inú scénu)
const hore = async (page) => { await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForFunction(() => scrollY === 0); await sleep(300); };
// snímka až po príchode okna a kroku (320 a 280 ms)
const snimka = async (page, f) => { await sleep(450); await page.screenshot({ path: path.join(OUT, f) }); };
const preteka = (page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('.obj[open] *')].some((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.obj-dni'); }));

/* ---------- 1. telefón 390: celá cesta služba → barber → deň → čas → výber ---------- */
if (SERVER) {
  const { ctx, page, von, chyby } = await stranka(390, 844, `objednavka=${encodeURIComponent(API)}&vernost=ukazka`);
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => document.documentElement.classList.contains('obj-zapnute')), 'okno je pripravené (modul a štýl)');
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
  await hore(page);
  await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
  await page.waitForSelector('.obj[open]');
  ok(await page.locator('.obj-sluzby button').count() === 15, 'krok 1: 15 služieb z cenníka');
  ok(await page.evaluate(() => document.querySelector('.obj-sluzby button').textContent.includes('Pánsky strih') && document.querySelector('.obj-sluzby button').textContent.includes('18 €')), 'krok 1: názov, čas a cena ako na webe');
  ok(!(await preteka(page)), 'krok 1: nič nepreteká do strany');
  await snimka(page, '1-sluzba-390.png');
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih a úprava brady' }).click();
  await page.waitForSelector('.obj-tim button', { timeout: 20000 }).catch(async () => console.log('DIAG tím', page.api.join(' | '), JSON.stringify(await page.evaluate(async (api) => {
    const r = await fetch(api + '?a=barberi&sluzba=18').then(async (x) => [x.status, (await x.text()).slice(0, 200)]).catch((e) => String(e));
    return { obj: document.querySelector('.obj') && document.querySelector('.obj').textContent.slice(0, 300), r, krok: document.querySelector('.obj-h') && document.querySelector('.obj-h').textContent };
  }, API))));
  const tim = await page.locator('.obj-tim button').allTextContents();
  ok(tim.length === 3 && tim[0].includes('Nezáleží') && tim.some((t) => t.includes('Adrian')), 'krok 2: Nezáleží a barberi z rezervačného systému', JSON.stringify(tim));
  ok(await page.locator('.obj-tim img').count() >= 2, 'krok 2: portréty z tímu na webe');
  ok(!(await preteka(page)), 'krok 2: nič nepreteká');
  // najkratšia cesta: najbližšie voľné časy u kohokoľvek hneď nad tímom
  // hlavný web popri tom načítava fotky filmu, preto dlhšie čakanie; pri chybe odpovede servera
  await page.waitForSelector('.obj-rychlo:not([hidden]) .obj-mriezka button', { timeout: 20000 }).catch(async () => console.log('DIAG rýchla voľba', page.api.join(' | '), JSON.stringify(await page.evaluate(async (api) => {
    const r = await fetch(api + '?a=dni&sluzba=18&barber=ktoko%C4%BEvek'); return [r.status, (await r.text()).slice(0, 200)];
  }, API))));
  const rychle = await page.locator('.obj-rychlo .obj-mriezka button').allTextContents();
  ok(casyOk(rychle, CASY_KTOKOLVEK) && (await page.locator('.obj-rychlo-h').textContent()).startsWith('Najbližšie voľné'), 'krok 2: najbližšie voľné časy u kohokoľvek nad tímom', JSON.stringify(rychle));
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
  // po WEB-03: Dokončiť je v päte okna (na očiach bez skrolu), v obsahu ťahák pre rezervačný systém a Zavolať
  ok(await page.evaluate(() => { const d = document.querySelector('.obj .obj-pata [data-obj-priamo]'), t = [...document.querySelectorAll('.obj .obj-telo .obj-akcie a')]; return !!d && /barbershop30\.sk\/rezervacia$/.test(d.href) && t.length === 1 && t[0].href === 'tel:+421951267203' && !!document.querySelector('.obj .obj-tahak'); }), 'krok 4: Dokončiť v rezervačnom systéme v päte okna, ťahák a Zavolať a potvrdiť termín');
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
  await hore(page);
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
if (SERVER) for (const [w, h] of [[360, 780], [430, 932], [768, 1024], [1440, 900]]) {
  const { ctx, page, chyby } = await stranka(w, h, `objednavka=${encodeURIComponent(API)}&vernost=ukazka`);
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.band-karty', { timeout: 10000 }).catch(() => {});
  await hore(page);
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
  ok(!(await preteka(page)) && casyOk(await page.locator('.obj-casy .obj-mriezka button').allTextContents(), CASY_KTOKOLVEK), `${w} px: deň a časy bez pretekania`);
  await snimka(page, `3-den-cas-${w}.png`);
  await page.keyboard.press('Escape');
  await page.locator('.band-karty').scrollIntoViewIfNeeded();
  await sleep(300);
  ok(!(await preteka(page)), `${w} px: pás s vizitkou bez pretekania`);
  await page.locator('.band-karty').screenshot({ path: path.join(OUT, `karty-${w}.png`) });
  ok(!chyby.length, `${w} px: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}

/* ---------- 4. zapnutá prihláška vernostnej kartičky (ako po nasadení s heslom recepcie) ---------- */
if (SERVER) {
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
  // klik priamo na odkaz (po skrolovaní hore ho v teste niekedy prekryje pripnutý záber filmu, ide o tú istú udalosť)
  await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
  await page.waitForSelector('.obj[open]', { timeout: 5000 }).catch(async () => console.log('DIAG', JSON.stringify(await page.evaluate(() => ({ c: document.documentElement.className, v: !!document.querySelector('#v30p[open]'), y: scrollY, h: location.href, st: history.state, a: document.activeElement && document.activeElement.outerHTML.slice(0, 120) })))));
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih' }).first().click();
  await page.locator('.obj-tim button', { hasText: 'Nezáleží' }).click();
  await page.waitForSelector('.obj-mriezka button', { timeout: 10000 }).catch(async () => { await snimka(page, 'chyba-4.png'); console.log(await page.locator('.obj').textContent()); });
  await page.locator('.obj-mriezka button').first().click();
  await page.locator('.obj [data-obj-priamo]', { hasText: 'Dokončiť v rezervačnom systéme' }).click();
  await page.waitForSelector('#v30p[open]', { timeout: 5000 }).catch(() => {});
  ok(await page.locator('#v30p[open]').count() === 1 && await page.locator('.obj[open]').count() === 1, 'Dokončiť: prihláška kartičky nad výberom, výber ostáva');
  await sleep(500);
  await snimka(page, '5-dokoncit-karticka-390.png');
  ok(!von.length, 'zapnutá prihláška: nič neodišlo von', von.join(' '));
  ok(!chyby.length, 'zapnutá prihláška: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
/* server bez napojenia kalendára: okno sa otvorí a povie „nejde – zavolaj“ (nie rezervačný systém v novej karte) */
if (SERVER) {
  const { ctx, page } = await stranka(390, 844, `objednavka=${encodeURIComponent(`http://127.0.0.1:${PB}/api.php`)}`);
  await page.mouse.move(10, 10);
  await sleep(3500);
  await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
  await page.waitForSelector('.obj[open] .obj-znova', { timeout: 9000 }).catch(() => {});
  ok((await page.locator('.obj[open] .obj-h').textContent().catch(() => '')) === 'Objednávka cez web teraz nejde – zavolaj.', 'kalendár nepripojený: okno povie „nejde – zavolaj“');
  await ctx.close();
}

/* ---------- 3. bez servera (náhľad, statický hosting): Objednať sa otvorí okno, do 8 s „nejde – zavolaj“ ---------- */
// Lajko 9. 11. 2026, bod 7: jediná cesta k objednaniu je okno na hlavnej stránke; nikdy slepá ulička
const NEJDE = 'Objednávka cez web teraz nejde – zavolaj.';
const stavOkna = (page) => page.evaluate(() => {
  const d = document.querySelector('.obj[open]');
  if (!d) return { open: false };
  const h = d.querySelector('.obj-h').textContent, t = d.querySelector('.obj-telo');
  return { open: true, h, sluzby: d.querySelectorAll('.obj-sluzby button').length, tel: !!t.querySelector('a[href="tel:+421951267203"]'),
    znova: !!t.querySelector('button.obj-znova'), hodiny: t.querySelectorAll('.obj-hodiny dt').length, sys: !!t.querySelector('a[data-obj-priamo][href*="barbershop30.sk/rezervacia"]'),
    offline: /bez internetu/.test(t.textContent), fokus: document.activeElement === d.querySelector('.obj-h'), prazdne: !t.textContent.trim() };
});
{
  const { ctx, page, von, chyby } = await stranka(390, 844, '');
  const ziadosti = [], popupy = [];
  page.on('request', (r) => { if (/api\.php/.test(r.url())) ziadosti.push(r.url()); });
  page.on('popup', (p) => popupy.push(p.url()));
  await page.mouse.move(10, 10);
  await sleep(1500);
  ok(!(await page.locator('.obj[open]').count()), 'bez servera: okno sa samo neotvorí');
  const t0 = Date.now();
  await page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first().click();
  await page.waitForFunction((n) => { const h = document.querySelector('.obj[open] .obj-h'); return h && h.textContent === n; }, NEJDE, { timeout: 8000 }).catch(() => {});
  const ms = Date.now() - t0, st = await stavOkna(page);
  ok(st.open && st.h === NEJDE && ms < 8000, 'bez servera: Objednať sa otvorí okno a do 8 s povie „Objednávka cez web teraz nejde – zavolaj“', `${ms} ms`);
  ok(st.tel && st.znova && st.hodiny === 3 && st.sys && st.fokus, 'bez servera: Zavolať, Skúsiť znova, otváracie hodiny zo stránky, tichý odkaz na rezervačný systém, fokus na nadpise', JSON.stringify(st));
  ok(!popupy.length && !ziadosti.length && !von.length, 'bez servera: žiadna nová karta, nič na server ani do rezervačného systému', popupy.concat(ziadosti, von).join(' '));
  ok(!(await preteka(page)), 'bez servera: okno nepreteká');
  await snimka(page, '0-nejde-390.png');
  // Skúsiť znova: zase bez servera, okno ostane (nie prázdne), tlačidlo je znova použiteľné
  await page.locator('.obj button.obj-znova').click();
  await sleep(1000);
  const st2 = await stavOkna(page);
  ok(st2.open && st2.h === NEJDE && st2.znova && !st2.prazdne && await page.locator('.obj button.obj-znova').isEnabled(), 'Skúsiť znova bez servera: okno ostane a dá sa skúsiť znova');
  await page.keyboard.press('Escape');
  await sleep(300);
  ok(!(await page.locator('.obj[open]').count()) && page.url().startsWith(srv.origin), 'Esc zatvorí okno, stránka ostala');
  // všetky odkazy Objednať sa na stránke (lišta, úvod, karty, tím, cenník, kontakt, spodná lišta telefónu) otvoria okno
  // (okrem odkazov v samotnom okne: Dokončiť / rezervačný systém majú data-obj-priamo a idú do rezervačného systému)
  const ODK = 'a[href*="barbershop30.sk/rezervacia"]:not([data-obj-priamo])';
  const n = await page.locator(ODK).count();
  let otvorilo = 0;
  for (let i = 0; i < n; i++) {
    await page.evaluate(([k, sel]) => document.querySelectorAll(sel)[k].click(), [i, ODK]);
    if (await page.waitForSelector('.obj[open]', { timeout: 3000 }).then(() => true, () => false)) otvorilo++;
    await page.evaluate(() => { const d = document.querySelector('.obj[open]'); if (d) d.close(); });
    await sleep(120);
  }
  ok(n >= 30 && otvorilo === n && !popupy.length, `každý odkaz Objednať sa otvorí okno (${otvorilo} z ${n}), žiadna nová karta`);
  ok(!chyby.length, 'bez servera: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
for (const [w, h] of [[320, 568], [430, 932], [768, 1024], [1440, 900]]) {
  const { ctx, page, chyby } = await stranka(w, h, '');
  await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
  await page.waitForFunction((n) => { const e = document.querySelector('.obj[open] .obj-h'); return e && e.textContent === n; }, NEJDE, { timeout: 8000 }).catch(() => {});
  const st = await stavOkna(page);
  ok(st.h === NEJDE && st.tel && st.znova && !(await preteka(page)), `${w} px: „nejde – zavolaj“ bez pretekania`);
  if (w === 1440 || w === 320) await snimka(page, `0-nejde-${w}.png`);
  ok(!chyby.length, `${w} px: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}

/* ---------- 3b. server (falošný cez page.route, bez php): visí, chyba, Skúsiť znova, bez internetu ---------- */
{
  const FAKE = 'http://127.0.0.1:9/api.php';
  const jeApi = (u) => u.href.startsWith('http://127.0.0.1:9/');
  // visí: na „Objednať sa“ okno hneď (služby), po najviac 8 s od spustenia „nejde – zavolaj“
  {
    const { ctx, page, chyby } = await stranka(390, 844, `objednavka=${encodeURIComponent(FAKE)}`);
    await page.route(jeApi, () => {});
    const t0 = Date.now();
    await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
    await page.waitForSelector('.obj[open]', { timeout: 5000 }).catch(() => {});
    const prve = await stavOkna(page);
    ok(prve.open && prve.sluzby === 15, 'server visí: okno sa otvorí hneď so službami (nie prázdne)', JSON.stringify(prve));
    await page.waitForFunction((n) => { const e = document.querySelector('.obj[open] .obj-h'); return e && e.textContent === n; }, NEJDE, { timeout: 12000 }).catch(() => {});
    const ms = Date.now() - t0, st = await stavOkna(page);
    ok(st.h === NEJDE && ms <= 8800, 'server visí: do 8 s „nejde – zavolaj“', `${ms} ms od kliku`);
    ok(!chyby.length, 'server visí: bez chýb skriptu', chyby.join(' | '));
    await ctx.close();
  }
  // chyba servera (spojenie zlyhá): „nejde“ hneď; Skúsiť znova s funkčným serverom → výber služby a barbera
  {
    const { ctx, page, chyby } = await stranka(390, 844, `objednavka=${encodeURIComponent(FAKE)}`);
    let zije = false;
    await page.route(jeApi, (r) => {
      if (!zije) return r.abort();
      const a = new URL(r.request().url()).searchParams.get('a');
      const j = a === 'stav' ? { ok: true, kalendar: true } : a === 'barberi' ? { ok: true, stav: 'ok', barberi: ['Adrian', 'Nikolas'] } : a === 'dni' ? { ok: true, stav: 'chyba' } : { ok: true };
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
    });
    await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
    await page.waitForFunction((n) => { const e = document.querySelector('.obj[open] .obj-h'); return e && e.textContent === n; }, NEJDE, { timeout: 8000 }).catch(() => {});
    ok((await stavOkna(page)).h === NEJDE, 'chyba servera: „nejde – zavolaj“');
    zije = true;
    await page.locator('.obj button.obj-znova').click();
    await page.waitForSelector('.obj[open] .obj-sluzby button', { timeout: 5000 }).catch(() => {});
    ok((await stavOkna(page)).sluzby === 15, 'Skúsiť znova so živým serverom: výber služby');
    await page.locator('.obj-sluzby button', { hasText: 'Úprava brady' }).first().click();
    await page.waitForSelector('.obj-tim button', { timeout: 5000 }).catch(() => {});
    ok(await page.locator('.obj-tim button', { hasText: 'Adrian' }).count() === 1, 'potom krok 2: barberi zo servera');
    ok(!chyby.length, 'Skúsiť znova: bez chýb skriptu', chyby.join(' | '));
    await ctx.close();
  }
  // bez internetu: veta o pripojení; po návrate internetu to okno skúsi samo
  {
    const { ctx, page, chyby } = await stranka(390, 844, '');
    await page.mouse.move(10, 10);
    await page.waitForFunction(() => document.documentElement.classList.contains('obj-zapnute'), null, { timeout: 15000 }).catch(() => {});
    await ctx.setOffline(true);
    await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
    await page.waitForSelector('.obj[open] .obj-znova', { timeout: 8000 }).catch(() => {});
    const st = await stavOkna(page);
    ok(st.h === NEJDE && st.offline && st.tel, 'bez internetu: „nejde – zavolaj“ s vetou o pripojení a telefónom', JSON.stringify(st));
    await ctx.setOffline(false);
    await page.waitForFunction(() => { const t = document.querySelector('.obj[open] .obj-telo'); return t && !/bez internetu/.test(t.textContent) && t.querySelector('.obj-znova'); }, null, { timeout: 6000 }).catch(() => {});
    const st2 = await stavOkna(page);
    ok(st2.open && st2.h === NEJDE && !st2.offline, 'internet späť: okno to skúsilo samo (bez servera ostáva „nejde“, veta o pripojení zmizla)');
    ok(!chyby.length, 'bez internetu: bez chýb skriptu', chyby.join(' | '));
    await ctx.close();
  }
}

/* ---------- 3c. klávesnica, čítačka, obmedzený pohyb ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => r.abort());
  await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&objednavka=ukazka`, { waitUntil: 'load' });
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
  const odkaz = page.locator('#uvod a.btn-primary', { hasText: 'Objednať sa' }).first();
  await odkaz.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.obj[open]', { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'obj-h' && document.querySelector('.obj[open]').getAttribute('aria-labelledby') === 'obj-h'), 'klávesnica: Enter na Objednať sa otvorí okno, fokus na nadpise kroku (čítačka ho prečíta)');
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.querySelector('.obj[open]').contains(document.activeElement)), 'klávesnica: Tab ostáva v okne');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.obj[open]')).animationName === 'none' && getComputedStyle(document.querySelector('.obj-telo')).animationName === 'none'), 'obmedzený pohyb: okno bez nábehu');
  await page.keyboard.press('Escape');
  await sleep(300);
  ok(!(await page.locator('.obj[open]').count()) && await page.evaluate(() => document.activeElement && document.activeElement.matches('#uvod a.btn-primary')), 'Esc zatvorí okno a fokus sa vráti na odkaz Objednať sa');
  await ctx.close();
}

/* ---------- 5. rezervacia.html je len presmerovanie; ?objednat=1 otvorí okno; žiadny odkaz na rezervacia.html ---------- */
{
  // so skriptom: hneď na hlavnú stránku s predvoľbou služby a barbera, okno otvorené (ukážka bez servera)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => r.abort());
  await page.goto(`${srv.origin}/rezervacia.html?sluzba=3&barber=Adrian&objednavka=ukazka`, { waitUntil: 'load' });
  await page.waitForURL(/index\.html/, { timeout: 5000 }).catch(() => {});
  await page.waitForSelector('.obj[open] .obj-dni button', { timeout: 10000 }).catch(() => {});
  ok(/\/index\.html(\?objednavka=ukazka)?$/.test(page.url()), 'rezervacia.html presmeruje na hlavnú stránku (adresa bez ?objednat, obnovenie okno znova neotvorí)', page.url());
  ok((await page.locator('.obj-h').textContent().catch(() => '')) === 'Kedy?' && /Úprava brady/.test(await page.locator('.obj-vyber').textContent()) && /Adrian/.test(await page.locator('.obj-vyber').textContent()), 'predvoľby z odkazu (?sluzba=3&barber=Adrian): služba aj barber vybraní, rovno deň');
  await snimka(page, 'presmerovanie-390.png');
  ok(!chyby.length, 'presmerovanie: bez chýb skriptu', chyby.join(' | '));
  await ctx.close();
}
{
  // bez skriptu: meta refresh na hlavnú stránku s ?objednat=1 a viditeľný odkaz
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => r.abort());
  const r = await page.request.get(`${srv.origin}/rezervacia.html`);
  const t = await r.text();
  ok(/<meta http-equiv="refresh" content="0; url=index\.html\?objednat=1">/.test(t) && /<a href="index\.html\?objednat=1">/.test(t) && /href="tel:\+421951267203"/.test(t) && /noindex/.test(t), 'rezervacia.html: meta refresh, viditeľný odkaz, telefón, noindex');
  await page.goto(`${srv.origin}/rezervacia.html`, { waitUntil: 'load' });
  await page.waitForURL(/index\.html\?objednat=1/, { timeout: 5000 }).catch(() => {});
  ok(/index\.html\?objednat=1$/.test(page.url()), 'bez skriptu: meta refresh na index.html?objednat=1', page.url());
  await ctx.close();
}
for (const [cesta, jazyk] of [['index.html', 'sk'], ['en/index.html', 'en']]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme/, (r) => r.abort());
  await page.goto(`${srv.origin}/${cesta}?objednat=1&uvod=off&film=off&hudba=off`, { waitUntil: 'load' });
  await page.waitForSelector('.obj[open]', { timeout: 10000 }).catch(() => {});
  const h = await page.locator('.obj[open] .obj-h').textContent().catch(() => '');
  ok(h === (jazyk === 'en' ? 'Online booking isn’t working right now – call us.' : NEJDE) && !/objednat/.test(page.url()), `${cesta}?objednat=1: okno po načítaní (bez servera „nejde“ v jazyku stránky), adresa bez ?objednat`, h);
  ok(!chyby.length, `${cesta}?objednat=1: bez chýb skriptu`, chyby.join(' | '));
  await ctx.close();
}
{
  // statické kontroly: žiadny odkaz na rezervacia.html (navigácia, päta, karty, en/, 404, karta/), sitemap a JSON-LD bez nej,
  // 404 Objednať sa vedie na okno
  const subory = ['index.html', 'en/index.html', '404.html', 'karta/index.html'].map((f) => [f, fs.readFileSync(path.join(SITE, f), 'utf8')]);
  ok(subory.every(([, t]) => !/href="[^"]*rezervacia\.html/.test(t)), 'žiadny odkaz na rezervacia.html (index, en/, 404, karta/)');
  const ld = (t) => (t.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || ['', ''])[1];
  ok(!fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8').includes('rezervacia') && subory.every(([, t]) => !ld(t).includes('rezervacia.html')), 'sitemap.xml a JSON-LD bez rezervacia.html');
  ok(/<a class="btn primary" href="https:\/\/[^"]+\/\?objednat=1">Objednať sa<\/a>/.test(subory[2][1]), '404: Objednať sa otvorí okno na hlavnej stránke (?objednat=1)');
  const ymlP = path.join(SITE, '..', '.github', 'workflows', 'pages.yml');
  if (!fs.existsSync(ymlP)) console.log('PRESKOČENÉ pages.yml (kópia stromu bez .github)');
  else ok(!/rezervacia\.html<\/loc>|robots" content="noindex">\/d' _site\/barbershop-30\/rezervacia/.test(fs.readFileSync(ymlP, 'utf8')), 'nasadenie (pages.yml) rezervaciu nepridáva do sitemap.xml ani jej neruší noindex');
}

/* ---------- 6. ukážka na kontrolu (?objednavka=ukazka): bez servera, výrazne označená ---------- */
for (const [subor, q] of [['index.html', 'uvod=off&film=off&hudba=off&objednavka=ukazka']]) {

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage();
  const api = [], chyby = [];
  page.on('request', (r) => { if (/api\.php|barbershop30\.sk/.test(r.url())) api.push(r.url()); });
  page.on('pageerror', (e) => chyby.push(e.message));
  await page.route(/barbershop30\.sk|headspa30\.sk|booqme|instagram/, (r) => r.abort());
  await page.goto(`${srv.origin}/${subor}?${q}`, { waitUntil: 'load' });
  if (subor === 'index.html') {
    await page.mouse.move(10, 10);
    await page.waitForFunction(() => document.documentElement.classList.contains('obj-css'), null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.querySelector('#uvod a.btn-primary').click());
  }
  await page.waitForSelector('.obj-sluzby button', { timeout: 10000 }).catch(() => {});
  ok(await page.locator('.obj-ukazka-pas').isVisible() && (await page.locator('.obj-ukazka-pas').textContent()).includes('nič sa nerezervuje'), `ukážka ${subor}: výrazne označená, nič sa nerezervuje`);
  await page.locator('.obj-sluzby button', { hasText: 'Pánsky strih' }).first().click();
  await page.waitForSelector('.obj-rychlo:not([hidden]) .obj-mriezka button', { timeout: 10000 }).catch(() => {});
  ok((await page.locator('.obj-rychlo').textContent()).includes('Ukážkové časy, nie skutočné') && await page.locator('.obj-tim button').count() >= 3, `ukážka ${subor}: časy označené ako ukážkové, tím zo stránky`);
  await snimka(page, 'ukazka-2-390.png');
  await page.locator('.obj-rychlo .obj-mriezka button').first().click();
  ok((await page.locator('.obj-h').textContent()) === 'Tvoj výber' && (await page.locator('.obj').first().textContent()).includes('Termín ešte nie je rezervovaný'), `ukážka ${subor}: dve kliknutia po výber, žiadny úspech`);
  ok(!api.length && !chyby.length, `ukážka ${subor}: bez servera a bez chýb`, api.concat(chyby).join(' | '));
  await ctx.close();
}

if (SERVER) ok(!fs.readFileSync(LOG, 'utf8').includes('makeOrder'), 'objednávka (makeOrder) sa nikdy neodoslala');
await browser.close();
zastav();
srv.close && srv.close();
fs.rmSync(T, { recursive: true, force: true });
console.log(zle ? `VÝSLEDOK: ${zle} zlyhalo` : SERVER ? 'VÝSLEDOK: všetko v poriadku' : 'VÝSLEDOK: v poriadku v častiach bez servera (časti so serverom PRESKOČENÉ)', '· snímky:', OUT);
process.exit(zle ? 1 : 0);
