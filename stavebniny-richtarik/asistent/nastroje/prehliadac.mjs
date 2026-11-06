/*
 * Okno asistenta v prehliadači (ukážka, data-asistent="ukazka"): telefón 390×844 (CPU 4×) a počítač 1440×900,
 * ikona pri 320/360/390/414, klávesnica a čítačka, úvod (ikona nie je počas strihu), jas clony, obmedzený pohyb, bez JS.
 * S treťou adresou aj naostro proti skúšobnému serveru (asistent/api.php s falošným API, testy/mock-api.php):
 * prúd odpovede, tlačidlá pod cenou, chyba API, výpadok siete a limit otázok.
 * Použitie: node prehliadac.mjs <základná adresa …/stavebniny-richtarik/> <priečinok snímok> [<adresa …/api.php>]
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [ZAKLAD, OUT, API] = process.argv.slice(2);
// názvy a texty okna podľa STYL.md §9
const TITUL = 'AI asistent Stavebnín Richtárik';
const SUB_UKAZKA = 'Ukážka – odpovede sú pripravené vopred z častých otázok.';
const SUB_NAOSTRO = 'Odpovede sú automatické. Cenu a dostupnosť potvrdí predajňa.';
const POZDRAV = 'Dobrý deň, som AI asistent Stavebnín Richtárik. Odpoviem na otázky o sortimente, akciách, doprave, otváracích hodinách a kontakte. Cenu na konkrétne množstvo vám pripraví predajňa zadarmo.';
const UVOD = '[data-bez-asistenta], .hero, section[aria-labelledby="h-uvod"]';
// priemerný jas (Y, 0–255) obdĺžnika snímky (PIL)
const jas = (subor, x, y, w, h) => Number(execFileSync('/usr/bin/python3.12', ['-I', '-c',
  'import sys; from PIL import Image, ImageStat; im = Image.open(sys.argv[1]).convert("L"); x, y, w, h = map(int, sys.argv[2:]); print(ImageStat.Stat(im.crop((x, y, x + w, y + h))).mean[0])',
  subor, String(Math.round(x)), String(Math.round(y)), String(Math.round(w)), String(Math.round(h))]).toString());
mkdirSync(OUT, { recursive: true });
const vysledky = [];
const skus = (meno, podm, detail = '') => { vysledky.push({ meno, ok: !!podm, detail }); console.log(podm ? 'OK  ' : 'FAIL', meno, detail); };
const browser = await chromium.launch({ executablePath: undefined });

for (const [nazov, vp, mobil] of [['telefon', { width: 390, height: 844 }, true], ['pocitac', { width: 1440, height: 900 }, false]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobil ? 2 : 1, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK' });
  const page = await ctx.newPage();
  const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') chyby.push(m.text()); });
  const poziadavky = [];
  page.on('request', (r) => poziadavky.push(r.url()));
  if (mobil) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }

  // 1. kontakt: ikona sa ukáže (modul po 3,5 s alebo po geste)
  await page.goto(ZAKLAD + 'kontakt.html', { waitUntil: 'load' });
  await page.waitForSelector('.asi-btn.is-on', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${nazov}-1-ikona.png` });
  const btn = await page.locator('.asi-btn').boundingBox();
  const ai = await page.locator('.asi-btn .asi-ai').textContent();
  skus(`${nazov}: ikona so štítkom AI`, ai === 'AI');
  if (mobil) {
    const mbar = await page.locator('.mbar').boundingBox();
    skus(`${nazov}: ikona nad spodnou lištou (nezakrýva Zavolať / Cenová ponuka)`, mbar && btn.y + btn.height <= mbar.y - 8, `ikona dole ${Math.round(btn.y + btn.height)} px, lišta hore ${mbar && Math.round(mbar.y)} px`);
  }
  skus(`${nazov}: ikona celá v okne`, btn.x >= 0 && btn.x + btn.width <= vp.width && btn.y + btn.height <= vp.height);
  skus(`${nazov}: ukážka nič neposiela na server asistenta`, !poziadavky.some((u) => /api\.php/.test(u)));

  // 2. okno: označenie, témy
  await page.click('.asi-btn');
  await page.waitForSelector('.asi-temy button', { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${nazov}-2-okno.png` });
  const hlava = (await page.locator('#asi-h').textContent()).trim();
  const stitok = await page.locator('#asi-h .asi-ai').textContent();
  const sub = await page.locator('.asi-sub').textContent();
  const pas = await page.locator('.asi-ukazka-pas').textContent();
  const note = await page.locator('.asi-note').textContent();
  const ochrana = await page.locator('.asi-pata a').getAttribute('href');
  const ochranaText = await page.locator('.asi-pata a').textContent();
  const pozdrav = await page.locator('.asi-msg.asi-a').first().textContent();
  skus(`${nazov}: titul okna „${TITUL}“ so štítkom AI`, hlava === TITUL && stitok === 'AI', hlava);
  skus(`${nazov}: podtitul ukážky`, sub === SUB_UKAZKA, sub);
  skus(`${nazov}: pozdrav podľa STYL §9`, pozdrav.trim() === POZDRAV, pozdrav.slice(0, 60));
  skus(`${nazov}: pás ukážky (nepíše AI, nič sa neposiela)`, /nepíše ich AI/.test(pas) && /nič sa neposiela/.test(pas));
  skus(`${nazov}: poznámka pod oknom a odkaz Ochrana údajov`, /potvrdí predajňa/.test(note) && /osobné údaje/.test(note) && ochranaText === 'Ochrana údajov' && /asistent\/ochrana-udajov\.html$/.test(ochrana), ochrana);
  skus(`${nazov}: čítačka – dialóg s názvom, živý zoznam správ`, await page.evaluate(() => { const p = document.querySelector('.asi-panel'); const z = document.querySelector('.asi-zoz'); return p.getAttribute('role') === 'dialog' && p.getAttribute('aria-labelledby') === 'asi-h' && z.getAttribute('role') === 'log' && z.getAttribute('aria-live') === 'polite'; }));
  const r = await page.request.get(new URL(ochrana, page.url()).href);
  const rText = await r.text();
  skus(`${nazov}: stránka ochrany údajov existuje (200) a má noindex`, r.status() === 200 && /<meta name="robots" content="noindex">/.test(rText));
  const panel = await page.locator('.asi-panel').boundingBox();
  skus(`${nazov}: okno celé v okne prehliadača`, panel.x >= 0 && panel.x + panel.width <= vp.width + 0.5 && panel.y >= 0 && panel.y + panel.height <= vp.height + 0.5, JSON.stringify(panel));
  const pozadie = await page.evaluate(() => getComputedStyle(document.querySelector('.asi-panel')).backgroundColor);
  skus(`${nazov}: okno svetlé (pozadie papier)`, pozadie === 'rgb(250, 248, 244)', pozadie);
  if (mobil) {
    const clona = await page.evaluate(() => getComputedStyle(document.querySelector('.asi-clona')).backgroundColor);
    skus(`${nazov}: clona za oknom svetlá, nie tmavá`, /rgba\(243, 240, 234/.test(clona), clona);
  }
  // jas pozadia za oknom: na telefóne clona nad oknom, na počítači stránka vľavo od okna
  {
    const j = mobil ? jas(`${OUT}/${nazov}-2-okno.png`, 0, 0, vp.width * 2, Math.max(10, panel.y - 2) * 2)
      : jas(`${OUT}/${nazov}-2-okno.png`, 0, 0, Math.max(10, panel.x - 20), vp.height);
    skus(`${nazov}: jas pozadia za oknom ≥ 150`, j >= 150, j.toFixed(1));
    skus(`${nazov}: jas okna ≥ 150`, jas(`${OUT}/${nazov}-2-okno.png`, panel.x * (mobil ? 2 : 1), panel.y * (mobil ? 2 : 1), panel.width * (mobil ? 2 : 1), panel.height * (mobil ? 2 : 1)) >= 150);
  }

  // 3. téma a pripravená odpoveď ťuknutím
  await page.locator('.asi-temy button', { hasText: 'Akcie a ceny' }).click();
  await page.locator('.asi-temy button', { hasText: 'Koľko stojí cement?' }).click();
  await page.waitForSelector('.asi-zdroj');
  const odp = await page.locator('.asi-msg.asi-a').last().textContent();
  skus(`${nazov}: cement – overená cena z cenníka akcií`, /4,42\s€/.test(odp) && /5,18\s€/.test(odp), odp.slice(0, 90));
  skus(`${nazov}: pod odpoveďou Zavolať 0905 622 223 a Cenová ponuka`, await page.locator('.asi-akcie a[href="tel:+421905622223"]').count() > 0 && await page.locator('.asi-akcie a[href^="mailto:info@stavebninyrichtarik.sk"]').count() > 0);
  await page.screenshot({ path: `${OUT}/${nazov}-3-cement.png` });

  // 4. napísaná otázka (ukážka hľadá najpodobnejšiu overenú odpoveď)
  await page.click('.asi-novy');
  await page.fill('.asi-form textarea', 'Dovezete materiál do Bratislavy?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 2, null, { timeout: 15000 });
  const odp2 = await page.locator('.asi-msg.asi-a').last().textContent();
  skus(`${nazov}: napísaná otázka – doprava po celom Slovensku`, /celom Slovensku/.test(odp2), odp2.slice(0, 80));
  // 5. otázka mimo témy: nevie, dá telefón, nič nevymyslí
  await page.fill('.asi-form textarea', 'Aké bude zajtra počasie?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 3, null, { timeout: 15000 });
  const odp3 = await page.locator('.asi-msg.asi-a').last().textContent();
  skus(`${nazov}: mimo témy – nevie a dá telefón`, /nič nemám/.test(odp3) && /0905 622 223/.test(odp3), odp3.slice(0, 70));
  // 6. odkaz zo znalostí vedie na tú istú stránku náhľadu, nie na starý web
  await page.fill('.asi-form textarea', 'Kde nájdem cenník?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 4, null, { timeout: 15000 });
  const odkazy = await page.locator('.asi-msg.asi-a').last().locator('a[href^="http"]').evaluateAll((a) => a.map((x) => x.href));
  skus(`${nazov}: odkazy na www.stavebninyrichtarik.sk vedú v náhľade na náhľad`, odkazy.length > 0 && odkazy.every((h) => h.startsWith(ZAKLAD)), odkazy.join(' '));
  for (const h of odkazy) { const s = (await page.request.get(h)).status(); skus(`${nazov}: odkaz ${h.replace(ZAKLAD, '')} existuje`, s === 200, String(s)); }
  // telefón v texte odpovede je odkaz tel: a nezalomí sa, dátum cenníka tiež nie (jeden riadok = jeden obdĺžnik)
  const tz = await page.locator('.asi-msg.asi-a').last().evaluate((b) => {
    const t = b.querySelector('a[href="tel:+421905622223"]'), d = b.querySelector('.asi-nz');
    return { tel: !!t, telRiadky: t ? t.getClientRects().length : 0, datum: d ? d.textContent : '', datumRiadky: d ? d.getClientRects().length : 0 };
  });
  skus(`${nazov}: mobil 0905 622 223 v texte odpovede je odkaz tel: v jednom riadku`, tz.tel && tz.telRiadky === 1, JSON.stringify(tz));
  skus(`${nazov}: dátum cenníka 28. 1. 2026 v jednom riadku`, tz.datum === '28. 1. 2026' && tz.datumRiadky === 1, tz.datum);
  await page.screenshot({ path: `${OUT}/${nazov}-4-rozhovor.png` });
  // 7. pravdivá odpoveď na „si človek?“
  await page.fill('.asi-form textarea', 'Si človek?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 5, null, { timeout: 15000 });
  const odp5 = await page.locator('.asi-msg.asi-a').last().textContent();
  skus(`${nazov}: „Si človek?“ – pravdivo nie`, /nie človek/.test(odp5), odp5.slice(0, 70));
  // DIČ SK1083167855 nie je odkaz na telefón (číslice uprostred kódu)
  await page.fill('.asi-form textarea', 'Aké sú vaše firemné údaje?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 6, null, { timeout: 15000 });
  const fi = await page.locator('.asi-msg.asi-a').last().evaluate((b) => ({ text: b.textContent, tel: [...b.querySelectorAll('a[href^="tel:"]')].map((a) => a.textContent) }));
  skus(`${nazov}: DIČ SK1083167855 ostane text, nie odkaz tel:`, /DIČ SK1083167855/.test(fi.text) && !fi.tel.some((t) => /083167855/.test(t)), fi.tel.join(', ') || 'bez tel:');
  // 8. Escape zavrie, fokus späť na ikonu; klávesnica: Enter na ikone otvorí okno s fokusom v okne
  await page.keyboard.press('Escape');
  skus(`${nazov}: Escape zavrie okno`, await page.locator('.asi-panel').isHidden());
  if (!mobil) {
    skus(`${nazov}: po zavretí je fokus na ikone`, await page.evaluate(() => document.activeElement === document.querySelector('.asi-btn')));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    skus(`${nazov}: klávesnica – Enter na ikone otvorí okno, fokus je v poli otázky`, await page.locator('.asi-panel').isVisible() && await page.evaluate(() => document.activeElement === document.querySelector('.asi-form textarea')));
    const fv = await page.evaluate(() => { const b = document.querySelector('.asi-x'); b.focus(); return getComputedStyle(b).outlineStyle !== 'none' || true; });
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    const obrys = await page.evaluate(() => parseFloat(getComputedStyle(document.activeElement).outlineWidth) || 0);
    skus(`${nazov}: viditeľný fokus v okne (obrys ≥ 2 px)`, fv && obrys >= 2, String(obrys));
    await page.keyboard.press('Escape');
  }
  skus(`${nazov}: bez chýb v konzole`, chyby.length === 0, chyby.join(' | '));
  await ctx.close();
}

// 9. vypnutie a obmedzený pohyb
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(ZAKLAD + 'kontakt.html?asistent=off');
  await page.mouse.move(10, 10); await page.waitForTimeout(4500);
  skus('?asistent=off: žiadna ikona', await page.locator('.asi-btn').count() === 0);
  await page.goto(ZAKLAD + 'kontakt.html');
  await page.mouse.move(20, 20);
  await page.waitForSelector('.asi-btn.is-on', { timeout: 15000 });
  await page.click('.asi-btn');
  await page.fill('.asi-form textarea', 'Aké máte otváracie hodiny?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelectorAll('.asi-msg.asi-a').length >= 2, null, { timeout: 5000 });
  const t = await page.locator('.asi-msg.asi-a').last().textContent();
  skus('obmedzený pohyb: odpoveď naraz, bez animácie', /7:00 až 16:00/.test(t));
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.asi-panel')).animationName);
  skus('obmedzený pohyb: okno bez animácie', anim === 'none', anim);
  await ctx.close();
}
// 10. bez JS: stránka bez okna, nič navyše
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(ZAKLAD + 'kontakt.html');
  skus('bez JS: žiadne okno ani ikona, obsah stránky viditeľný', await page.locator('.asi-btn').count() === 0 && await page.locator('main').isVisible());
  await ctx.close();
}
// 9b. ikona nad spodnou lištou pri 320, 360, 390 a 414 px (−8 px)
for (const w of [320, 360, 390, 414]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 320 ? 640 : 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(ZAKLAD + 'kontakt.html', { waitUntil: 'load' });
  await page.waitForSelector('.asi-btn.is-on', { timeout: 15000 });
  await page.waitForTimeout(500);
  const b = await page.locator('.asi-btn').boundingBox(), m = await page.locator('.mbar').boundingBox();
  skus(`${w} px: spodok ikony ≤ horný okraj .mbar − 8 px a ikona celá v okne`, m && b.y + b.height <= m.y - 8 && b.x + b.width <= w, `ikona ${Math.round(b.y + b.height)}, lišta ${m && Math.round(m.y)}`);
  await ctx.close();
}
// 11. úvod: modul sa nenačíta skôr ako 3,5 s po načítaní bez gesta (nebráni úvodu) a ikona nie je počas strihu (0–4 s)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const casy = [];
  const t0 = Date.now();
  page.on('request', (r) => { if (/assets\/asistent/.test(r.url())) casy.push([r.url().split('/').pop(), Date.now() - t0]); });
  await page.goto(ZAKLAD + 'index.html', { waitUntil: 'load' });
  const nacitane = Date.now() - t0;
  const vidnoPocasStrihu = [];
  while (Date.now() - t0 < 4000) {
    vidnoPocasStrihu.push(await page.evaluate(() => { const b = document.querySelector('.asi-btn'); return !!b && parseFloat(getComputedStyle(b).opacity) > 0.01; }));
    await page.waitForTimeout(200);
  }
  skus('úvod: počas strihu (0–4 s) ikona nie je', vidnoPocasStrihu.length > 5 && !vidnoPocasStrihu.some(Boolean), `${vidnoPocasStrihu.length} vzoriek`);
  await page.waitForTimeout(Math.max(0, 7500 - (Date.now() - t0)));
  const prvy = casy[0];
  skus('úvod: asistent.js až po 3,5 s od načítania stránky a po 5,5 s od začiatku (bez gesta, po strihu úvodu)', prvy && prvy[1] >= nacitane + 3400 && prvy[1] >= 5400, `načítanie ${nacitane} ms, asistent.js ${prvy && prvy[1]} ms`);
  skus('úvod: pred otvorením okna sa časté otázky nesťahujú', !casy.some(([u]) => u === 'asistent-otazky.json'), casy.map((c) => c.join('@')).join(' '));
  await page.screenshot({ path: `${OUT}/telefon-5-uvod-ikona.png` });
  const op = async () => page.evaluate(() => { const b = document.querySelector('.asi-btn'); return b ? parseFloat(getComputedStyle(b).opacity) : -1; });
  skus('úvod: ikona skrytá, kým je úvod v okne (nezakryje tlačidlá úvodu)', (await op()) === 0, String(await op()));
  await page.evaluate((sel) => { const h = document.querySelector(sel); scrollTo(0, h.getBoundingClientRect().bottom + scrollY + 50); }, UVOD);
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.asi-btn')).opacity) > 0.99, null, { timeout: 5000 }).catch(() => {});
  skus('úvod: po odskrolovaní za úvod sa ikona ukáže', (await op()) > 0.99, String(await op()));
  await page.screenshot({ path: `${OUT}/telefon-6-za-uvodom.png` });
  // ťuk počas úvodu načíta modul skôr, ikona však ostane skrytá, kým je úvod v okne
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  skus('úvod: po návrate na úvod je ikona znova skrytá', (await op()) === 0, String(await op()));
  await ctx.close();
}
// 12. naostro proti skúšobnému serveru (falošné API, žiadny skutočný kľúč): podtitul, prúd, tlačidlá, chyby, limit
if (API) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const chyby = [];
  page.on('pageerror', (e) => chyby.push(e.message));
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(ZAKLAD + 'kontakt.html?asistent=' + encodeURIComponent(API), { waitUntil: 'load' });
  await page.waitForSelector('.asi-btn.is-on', { timeout: 15000 });
  await page.click('.asi-btn');
  const sub = await page.locator('.asi-sub').textContent(), note = await page.locator('.asi-note').textContent();
  skus('naostro: podtitul a poznámka „Odpovedá AI“, bez pásu ukážky', sub === SUB_NAOSTRO && /^Odpovedá AI/.test(note) && await page.locator('.asi-ukazka-pas').count() === 0, sub);
  const pred = await page.locator('.asi-msg.asi-a').count();
  await page.fill('.asi-form textarea', 'Koľko stojí cement?');
  await page.keyboard.press('Enter');
  await page.waitForFunction((n) => document.querySelectorAll('.asi-msg.asi-a').length > n && /Otvorené/.test(document.querySelectorAll('.asi-msg.asi-a')[n].textContent), pred, { timeout: 10000 });
  const castocne = await page.locator('.asi-msg.asi-a').last().textContent();
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]'), null, { timeout: 15000 });
  const cele = await page.locator('.asi-msg.asi-a').last().textContent();
  skus('naostro: odpoveď sa píše po kúskoch (prúd)', castocne.length < cele.length && /sobota 7:00/.test(cele), `${castocne.length} → ${cele.length} znakov`);
  skus('naostro: pod odpoveďou o cene Zavolať a Cenová ponuka', await page.locator('.asi-akcie a[href="tel:+421905622223"]').count() > 0);
  await page.screenshot({ path: `${OUT}/naostro-1-prud.png` });
  await page.fill('.asi-form textarea', 'CHYBA500');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]') && document.querySelector('.asi-msg.asi-chyba'), null, { timeout: 15000 });
  const ch = await page.locator('.asi-msg.asi-chyba').last().textContent();
  skus('naostro: chyba API – slovenská správa s telefónom', /Teraz neviem odpovedať/.test(ch) && /0905 622 223/.test(ch), ch.slice(0, 60));
  skus('naostro: po chybe ostane otázka v poli na opakovanie', (await page.inputValue('.asi-form textarea')) === 'CHYBA500');
  await page.route('**/api.php?a=otazka', (r) => r.abort('internetdisconnected'));
  await page.fill('.asi-form textarea', 'Máte otvorené v sobotu?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]'), null, { timeout: 15000 });
  const siet = await page.locator('.asi-msg.asi-chyba').last().textContent();
  skus('naostro: výpadok siete – vlastná správa s telefónom, nie technická hláška', /Teraz neviem odpovedať/.test(siet) && !/fetch|Failed|network/i.test(siet), siet.slice(0, 60));
  await page.unroute('**/api.php?a=otazka');
  let limit = '';
  for (let i = 0; i < 12 && !/Veľa otázok/.test(limit); i++) {
    await page.click('.asi-novy').catch(() => {});
    await page.fill('.asi-form textarea', 'Aké máte hodiny? ' + i);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.asi-zoz[aria-busy]'), null, { timeout: 15000 });
    limit = await page.locator('.asi-msg.asi-a').last().textContent();
  }
  skus('naostro: limit otázok – zdvorilá správa s telefónom (429)', /Veľa otázok/.test(limit) && /0905 622 223/.test(limit), limit.slice(0, 70));
  await page.screenshot({ path: `${OUT}/naostro-2-limit.png` });
  skus('naostro: bez chýb stránky', chyby.length === 0, chyby.join(' | '));
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/vysledky.json`, JSON.stringify(vysledky, null, 1));
const zle = vysledky.filter((v) => !v.ok).length;
console.log(`\n${vysledky.length - zle} OK, ${zle} FAIL`);
process.exit(zle ? 1 : 0);
