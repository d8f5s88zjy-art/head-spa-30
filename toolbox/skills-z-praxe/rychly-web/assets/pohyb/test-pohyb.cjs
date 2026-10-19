// Test vzoru „pohyb bez knižnice“ v Chromiu (Playwright): telefón aj počítač, prvá obrazovka bez data-pohyb,
// postupný nástup, príchod cez #kotvu, zníženie pohybu, bez JS, bez pohyb.js, neskorý pohyb.js, CLS,
// pretečenie do šírky, pauza svetla mimo obrazovky.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node test-pohyb.cjs [stránka.html] [--kotva=#kontakt] [--dole=#kontakt h2]
// Predvolene ukazka.html. Pre stránku projektu zadaj --kotva (sekcia na príchod cez odkaz) a --dole (prvok
// s data-pohyb hlboko pod ohybom). Návratový kód 0 = všetko prešlo, 1 = niečo zlyhalo (vypíše čo).
const path = require('path');
const fs = require('fs');
const { pathToFileURL, fileURLToPath } = require('url');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;

const arg = (k, z) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : z; };
const subor = process.argv.slice(2).find((x) => !x.startsWith('--')) || path.join(__dirname, 'ukazka.html');
const URL_ = pathToFileURL(path.resolve(subor)).href;
const KOTVA = arg('kotva', '#kontakt');
const DOLE = arg('dole', '#kontakt h2');
const chyby = [];
const over = (podmienka, popis) => { console.log((podmienka ? 'OK   ' : 'CHYBA') + ' ' + popis); if (!podmienka) chyby.push(popis); };
const cakaj = (ms) => new Promise((r) => setTimeout(r, ms));

async function stranka(prehliadac, nastavenia, pripravit, adresa = URL_) {
  const ctx = await prehliadac.newContext(nastavenia);
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
  });
  if (pripravit) await pripravit(p);
  await p.goto(adresa, { waitUntil: 'load' });
  return { ctx, p };
}
const opacity = (p, sel) => p.$eval(sel, (el) => getComputedStyle(el).opacity);
const vsetky = (p) => p.$$eval('[data-pohyb]', (l) => l.map((el) => getComputedStyle(el).opacity));
const svetlo = (p) => p.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.pseudoElement === '::before').map((a) => a.playState).join(','));

(async () => {
  const b = await chromium.launch();
  for (const [meno, okno] of [['telefón 390×844', { width: 390, height: 844 }], ['počítač 1440×900', { width: 1440, height: 900 }]]) {
    const { ctx, p } = await stranka(b, { viewport: okno, deviceScaleFactor: 2 });
    await cakaj(150);
    const vPrvej = await p.$$eval('[data-pohyb]', (l) => l.filter((el) => el.getBoundingClientRect().top < innerHeight).length);
    over(vPrvej === 0, `${meno}: v prvej obrazovke nie je žiadny data-pohyb (${vPrvej})`);
    over(await opacity(p, DOLE) === '0', `${meno}: prvok pod ohybom čaká skrytý`);
    over(await p.$eval(DOLE, (el) => el.getAnimations().length) === 0, `${meno}: záloha v CSS po štarte skriptu zrušená`);
    const sv = await svetlo(p);
    if (sv) over(sv === 'running', `${meno}: svetlo v úvode beží (${sv})`);
    // prvok vchádza zdola (horný okraj v 80 % výšky okna), ako pri bežnom skrolovaní
    await p.$eval(DOLE, (el) => scrollBy({ top: el.getBoundingClientRect().top - innerHeight * 0.8, behavior: 'instant' }));
    await cakaj(60);
    const pocas = Number(await opacity(p, DOLE));
    await cakaj(1000);
    over(pocas < 1, `${meno}: prvok sa objavuje postupne (krytie po 60 ms ${pocas.toFixed(2)})`);
    over(await opacity(p, DOLE) === '1', `${meno}: prvok po nástupe viditeľný`);
    const sv2 = await svetlo(p);
    if (sv2) over(sv2 === 'paused', `${meno}: svetlo mimo obrazovky stojí (${sv2})`);
    // prejsť celú stránku po krokoch, všetko sa má ukázať
    const vyska = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= vyska; y += Math.round(okno.height * 0.6)) { await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await cakaj(120); }
    await cakaj(900);
    const ops = await vsetky(p);
    over(ops.every((o) => o === '1'), `${meno}: po prejdení stránky všetko viditeľné (${ops.length} prvkov)`);
    over(await p.evaluate(() => window.__cls) === 0, `${meno}: CLS ${await p.evaluate(() => window.__cls)}`);
    over(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${meno}: žiadne pretečenie do šírky`);
    await ctx.close();
  }
  {
    const { ctx, p } = await stranka(b, { viewport: { width: 390, height: 844 } }, null, URL_ + KOTVA);
    await cakaj(150);
    over(await opacity(p, DOLE) === '1', `príchod cez ${KOTVA}: prvok v okne viditeľný hneď`);
    over(await p.$eval(DOLE, (el) => el.getAnimations().length) === 0, `príchod cez ${KOTVA}: bez animácie`);
    await ctx.close();
  }
  {
    const { ctx, p } = await stranka(b, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await cakaj(150);
    over((await vsetky(p)).every((o) => o === '1'), 'zníženie pohybu: všetko viditeľné hneď');
    over(await p.evaluate(() => document.getAnimations().length) === 0, 'zníženie pohybu: žiadna animácia (ani svetlo)');
    await ctx.close();
  }
  {
    const { ctx, p } = await stranka(b, { viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    over((await vsetky(p)).every((o) => o === '1'), 'bez JS: všetko viditeľné');
    await ctx.close();
  }
  {
    const { ctx, p } = await stranka(b, { viewport: { width: 390, height: 844 } }, (pg) => pg.route('**/pohyb.js', (r) => r.abort()));
    await cakaj(300);
    over(await opacity(p, DOLE) === '0', 'pohyb.js neprišiel: chvíľu skryté (záloha čaká)');
    await cakaj(3000);
    over((await vsetky(p)).every((o) => o === '1'), 'pohyb.js neprišiel: po 3 s všetko viditeľné (záloha v CSS)');
    await ctx.close();
  }
  {
    // pohyb.js príde až po zálohe: nič sa nesmie znova skryť
    const { ctx, p } = await stranka(b, { viewport: { width: 390, height: 844 } }, (pg) => pg.route('**/pohyb.js', async (r) => {
      const body = fs.readFileSync(fileURLToPath(r.request().url()), 'utf8'); await cakaj(3600);
      r.fulfill({ status: 200, contentType: 'text/javascript', body });
    }));
    await cakaj(400);
    const ops = await vsetky(p);
    over(ops.every((o) => o === '1') && await p.evaluate(() => document.documentElement.dataset.pohybBezi === '1'), 'pohyb.js neskoro (3,6 s): po príchode všetko viditeľné, nič sa neskrylo znova');
    await ctx.close();
  }
  await b.close();
  console.log(chyby.length ? `\n${chyby.length} chýb` : '\nVšetko prešlo.');
  process.exit(chyby.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
