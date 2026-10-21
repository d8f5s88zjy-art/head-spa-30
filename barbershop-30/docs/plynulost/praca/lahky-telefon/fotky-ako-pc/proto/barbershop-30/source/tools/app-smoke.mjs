#!/usr/bin/env node
// Dymový test režiséra (assets/app.js) proti index.html – Playwright, statický server, bez externých požiadaviek.
//
//   node source/tools/app-smoke.mjs            # všetky kontroly, desktop + mobil
//
// Kontroly (každá vypíše OK/FAIL, na konci exit 1 pri akomkoľvek FAIL):
//  1. načítanie bez pageerror / console.error / zlyhaných požiadaviek (404), žiadne absolútne cesty (/assets/…)
//     (chýbajúci assets/film.js sa toleruje, kým súbor neexistuje – stránka musí fungovať aj bez neho)
//  2. všetky kapitoly (section[data-scene], dnes 8): scroll na prvú kotvu každej – aktívna kapitola (aria-current na linke
//     kapitol) ide 1→N, --p rastie; data-scene-active na <html> sa počas skrolu nemení (len prítomnosť); premenné skrolu
//     sú na prvkoch, ktoré ich čítajú (--o na .title-frame, --so na .film-still, --sp na img zálohy len v pokojnej
//     verzii s pohybom), nie na kotvách
//  3. zálohy: každá .film-shot má min. výšku okna, .film-still viditeľná (bez world-in), prvá má fetchpriority=high
//  4. ?motion=off a prefers-reduced-motion: data-motion=off, __renderDone=true, dosky viditeľné, žiadne video, bez three.js
//  5. mobilné menu (aria-expanded, Esc), lightbox (otvorenie, šípky, Esc, návrat fokusu), mobilné CTA skryté v poslednej sekcii
//  6. videá: hrá najviac jedno; hrá len keď je viditeľné; po odscrollovaní sa pozastaví; pri motion=off sa nič nesťahuje
//  7. bez WebGL (chromium --disable-gpu --disable-3d-apis): film nejde (bez world alebo world-off), zálohy ostávajú, stránka použiteľná
//     softvérové kreslenie bez ?film=on: film sa po prvom vykreslení vypne (world-frame), CLS 0, rámovanie zálohy ostáva
//  8. šírky 375 / 390 / 430 px: žiadne vodorovné pretekanie (scrollWidth <= innerWidth), aj pri páse tímu a galérie
//     po nástupe kariet a bez app.js (412 px, telefón stránku neoddiali)
//  9. ľahký telefón (lite: dotyk, kratšia strana do 720 px, bez ?film=on) 390×844 a 430×932 @3: triedy lite + world-off bez
//     world/pro, film.js sa nenačíta (0 WebGL kontextov, žiadne three.js, film-worker, seq/*, *-hlbka*, tim-slucka),
//     prvý obraz rohožka -m s nadpisom a tlačidlami, stránka končí pätičkou, lišta ink; aktuálna karta je pri obnovenej
//     polohe, kotvách #tim / #kontakt, návrate späť a b30.lang=en vždy is-near a na obrazovke je hotová fotka (nie čistý ink);
//     ?film=on na telefóne film zapne (world); úzke okno 600×900 s myšou ostáva na filme (world, bez lite)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILM_EXISTS = fs.existsSync(path.join(ROOT, 'assets', 'film.js'));

let failed = 0;
const ok = (cond, msg, extra = '') => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}${extra ? '  ' + extra : ''}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = await startStaticServer(ROOT);
const base = srv.origin;

// chýbajúci film.js nie je chyba stránky (modul ešte nemusí existovať)
const filmNoise = (s) => !FILM_EXISTS && /film\.js/.test(s);

async function openPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, query = '', reducedMotion = 'no-preference', raw = false } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion });
  const page = await ctx.newPage();
  const problems = [], requests = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !filmNoise(m.text())) problems.push(`console.error: ${m.text()}`); });
  page.on('requestfailed', (r) => { if (!filmNoise(r.url())) problems.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !filmNoise(r.url())) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => requests.push(r.url()));
  // prehliadač v teste kreslí softvérovo: ?film=on povolí film aj tak (brána v hlavičke inak dá pokojnú verziu)
  // (raw: adresa bez ?film=on, film overí grafiku sám a pri softvérovom kreslení sa vypne)
  const q = raw || /film=off|motion=off/.test(query) ? query : (query ? query + '&' : '?') + 'film=on';
  await page.goto(`${base}/index.html${q}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 60000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  return { ctx, page, problems, requests };
}
async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
  await page.waitForFunction(() => window.__scrollSettled === false, null, { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 90000 }).catch(() => {});
  await sleep(250);
}
const vars = (page) => page.evaluate(() => {
  // priebeh skrolu (0 až 1) z polohy; app.js už nepíše --p na <html> (prepočet celej stránky);
  // aktívna kapitola z aria-current linky kapitol (data-scene-active na <html> sa už nemení)
  const a = document.querySelector('.story-line a[aria-current="true"]');
  return { p: scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), scene: a ? a.dataset.chapter : '' };
});
// premenné skrolu: kde sú zapísané (kotvy nesmú mať žiadnu – dedili by sa do celého podstromu)
const scrollVars = (page) => page.evaluate(() => {
  const shots = [...document.querySelectorAll('.film-shot')], get = (el, n) => (el ? el.style.getPropertyValue(n) : '');
  const nums = (arr) => arr.filter((v) => v !== '').map(parseFloat);
  const o = nums(shots.map((s) => get(s.querySelector('.title-frame'), '--o')));
  const so = nums(shots.map((s) => get(s.querySelector('.film-still'), '--so')));
  const sp = nums(shots.map((s) => get(s.querySelector('.film-still img'), '--sp')));
  return { kotvy: shots.filter((s) => ['--sp', '--o', '--so'].some((n) => get(s, n) !== '')).length,
    o: o.length, so: so.length, sp: sp.length, rozsah: [...o, ...so, ...sp].every((v) => v >= 0 && v <= 1) };
});
const layout = (page) => page.evaluate(() => {
  const y = scrollY, o = { shots: [], sections: {} };
  for (const el of document.querySelectorAll('.film-shot')) { const r = el.getBoundingClientRect(); o.shots.push({ name: el.dataset.shot, scene: el.closest('section')?.dataset.scene, top: r.top + y, height: r.height }); }
  for (const el of document.querySelectorAll('section[data-scene]')) { const r = el.getBoundingClientRect(); o.sections[el.id] = { top: r.top + y, height: r.height }; }
  const f = document.querySelector('.site-footer').getBoundingClientRect(); o.footer = { top: f.top + y, height: f.height };
  o.vh = innerHeight; return o;
});

try {
  if (!FILM_EXISTS) console.log('info assets/film.js zatiaľ neexistuje – jeho 404 sa toleruje, testuje sa pokojná verzia');

  /* ------------------------------------------------------------------ desktop + mobil, motion on */
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobil' : 'desktop';
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems, requests } = await openPage(browser, { mobile, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
    await sleep(1200);

    ok(problems.length === 0, `[${label}] načítanie bez chýb a 4xx`, problems.slice(0, 4).join(' | '));
    const abs = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('[src],[href],[srcset],[poster],[data-lightbox-src]').forEach((el) => {
        for (const a of ['src', 'href', 'poster', 'data-lightbox-src', 'srcset']) {
          const v = el.getAttribute(a); if (!v) continue;
          const parts = a === 'srcset' ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v];
          parts.forEach((p) => { if (p.startsWith('/') && !p.startsWith('//')) bad.push(p); });
        }
      });
      return bad;
    });
    ok(abs.length === 0, `[${label}] všetky cesty v HTML sú relatívne`, abs.slice(0, 3).join(' '));
    const ext = requests.filter((u) => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:'));
    ok(ext.length === 0, `[${label}] žiadne externé požiadavky za behu`, ext.slice(0, 3).join(' '));

    const dm = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, cls: document.documentElement.className }));
    ok(dm.motion === 'on', `[${label}] data-motion=on`, JSON.stringify(dm));

    // 3. zálohy
    const stills = await page.evaluate(() => {
      const shots = [...document.querySelectorAll('.film-shot')];
      const first = document.querySelector('.film-shot .film-still img');
      return {
        count: shots.length,
        // výšky kotiev (kratšia cesta 2026‑10‑11): úvod celé okno, karta bez pásu 0,7 okna, karta pred pásom 1,6 okna
        allTall: shots.every((s) => { const h = s.getBoundingClientRect().height / innerHeight, long = s.classList.contains('title-long');
          return s.hasAttribute('data-pro') ? h >= 0.99 : long ? h >= 1.59 && h <= 1.61 : h >= 0.69 && h <= 0.71; }),
        allHaveStill: shots.every((s) => s.querySelector('picture.film-still img[width][height][alt]')),
        allHaveMeta: shots.every((s) => s.dataset.shot && /^[\d.]+,[\d.]+$/.test(s.dataset.f || '') && /^(in|right|left|rise|down|near)$/.test(s.dataset.mv || '')),
        firstHigh: first?.getAttribute('fetchpriority') === 'high' && first?.getAttribute('loading') !== 'lazy',
        lazyRest: [...document.querySelectorAll('.film-shot .film-still img')].slice(1).every((i) => i.getAttribute('loading') === 'lazy'),
        firstVisible: first ? getComputedStyle(first.closest('.film-still')).opacity === '1' && first.naturalWidth > 0 : false,
        worldIn: document.documentElement.classList.contains('world-in'),
      };
    });
    ok(stills.count === 9 && stills.allHaveStill && stills.allHaveMeta, `[${label}] 9 kotiev .film-shot s data-shot/f/mv a zálohou`, JSON.stringify({ count: stills.count, still: stills.allHaveStill, meta: stills.allHaveMeta }));
    ok(stills.allTall, `[${label}] výšky kotiev: úvod 1, karta 0,7, karta pred pásom 1,6 okna`);
    ok(stills.firstHigh && stills.lazyRest, `[${label}] prvá záloha fetchpriority=high, ostatné lazy`);
    ok(stills.worldIn || stills.firstVisible, `[${label}] prvá záloha je viditeľná a načítaná (alebo beží film)`, JSON.stringify(stills));

    // 2. kapitoly 1→N: v tretine pripnutia prvej kotvy je kapitola aktívna a jej titulná karta svieti
    const L = await layout(page);
    const NS = await page.evaluate(() => document.querySelectorAll('section[data-scene]').length);
    let prev = null; const seen = []; let cardsOn = 0;
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // zmeny atribútu data-scene-active počas prechodu kapitolami (každá zmena prepočítala štýl celej stránky)
    await page.evaluate(() => { window.__dsa = 0; new MutationObserver((l) => { window.__dsa += l.length; }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene-active'] }); });
    for (let n = 1; n <= NS; n++) {
      // poloha kotvy sa meria tesne pred skokom (písma a obrázky v pásoch môžu stránku ešte posunúť)
      const s = await page.evaluate((n) => { const el = document.querySelector(`section[data-scene="${n}"] .film-shot`); const r = el.getBoundingClientRect(); return { name: el.dataset.shot, top: r.top + scrollY, height: r.height }; }, n);
      await scrollTo(page, n === 1 ? 0 : s.top + s.height * 0.3);
      const v = await vars(page);
      seen.push(v.scene);
      ok(v.scene === String(n), `[${label}] kotva ${s.name}: aktívna kapitola ${v.scene} (čakané ${n})`);
      if (prev) ok(v.p > prev.p, `[${label}] kotva ${s.name}: --p rastie (${prev.p.toFixed(3)} → ${v.p.toFixed(3)})`);
      cardsOn += await page.evaluate((n) => !!document.querySelector(`section[data-scene="${n}"] .film-shot.is-title.is-on`), n) ? 1 : 0;
      prev = v;
    }
    ok(NS >= 8 && new Set(seen).size === NS, `[${label}] kapitoly sa prepínajú (${seen.join('→')})`);
    ok(cardsOn === NS, `[${label}] titulná karta svieti v každej kapitole (${cardsOn}/${NS})`);
    const dsa = await page.evaluate(() => ({ zmeny: window.__dsa, je: document.documentElement.hasAttribute('data-scene-active') }));
    ok(dsa.je && dsa.zmeny === 0, `[${label}] data-scene-active je na <html> a pri prechode kapitolami sa nemení`, JSON.stringify(dsa));
    const sv = await scrollVars(page);
    ok(sv.kotvy === 0 && sv.o === stills.count && sv.so === stills.count && sv.rozsah, `[${label}] premenné skrolu na prvkoch, ktoré ich čítajú (--o na .title-frame, --so na .film-still), žiadna na kotve`, JSON.stringify(sv));
    ok(sv.sp === 0, `[${label}] s filmom (world) sa --sp nepíše (záloha má transform: none)`, JSON.stringify(sv));

    // titulná karta druhého záberu v kapitole (galéria: sud, Cestou von): zhasnutá pred kotvou, svieti v pripnutí
    const sud = L.shots.find((x) => x.name === 'sud');
    await scrollTo(page, sud.top - L.vh * 0.9);
    const early = await page.evaluate(() => document.querySelector('[data-shot="sud"]').classList.contains('is-on'));
    await scrollTo(page, sud.top + sud.height * 0.4);
    const late = await page.evaluate(() => document.querySelector('[data-shot="sud"]').classList.contains('is-on'));
    ok(!early && late, `[${label}] karta sud zhasnutá pred kotvou, svieti v pripnutí`);

    // späť hore
    await scrollTo(page, 0);
    const back = await vars(page);
    ok(back.p === 0 && back.scene === '1', `[${label}] návrat hore: --p=0, scéna 1`);

    // lišta a mobilné CTA
    const last = L.shots[L.shots.length - 1];
    await scrollTo(page, last.top);
    const flags = await page.evaluate(() => ({ cta: document.querySelector('#mobile-cta').classList.contains('is-hidden'), hdr: document.querySelector('.site-header').classList.contains('is-scrolled') }));
    ok(flags.hdr, `[${label}] .site-header.is-scrolled po scrolle`);
    ok(flags.cta, `[${label}] #mobile-cta.is-hidden v poslednej sekcii (rezervácia)`);
    await scrollTo(page, L.sections.sluzby.top);
    const ctaMid = await page.evaluate(() => document.querySelector('#mobile-cta').classList.contains('is-hidden'));
    ok(!ctaMid, `[${label}] #mobile-cta viditeľné v službách`);

    /* ---- menu (mobil) ---- */
    if (mobile) {
      await scrollTo(page, 0);
      await page.click('.nav-toggle');
      let exp = await page.getAttribute('.nav-toggle', 'aria-expanded');
      const ctaMenu = await page.evaluate(() => document.querySelector('#mobile-cta').classList.contains('is-hidden'));
      ok(exp === 'true' && ctaMenu, '[mobil] menu: aria-expanded=true po kliku, CTA skryté');
      await page.keyboard.press('Escape');
      exp = await page.getAttribute('.nav-toggle', 'aria-expanded');
      ok(exp === 'false', '[mobil] menu: Esc zatvára');
    }

    /* ---- lightbox ---- */
    const gal = await page.evaluate(() => document.querySelector('#galeria .band').getBoundingClientRect().top + scrollY);
    await scrollTo(page, gal + 100);
    const firstBtn = page.locator('.gallery-btn').first();
    await firstBtn.scrollIntoViewIfNeeded();
    await firstBtn.click();
    const lbOpen = await page.evaluate(() => !document.querySelector('#lightbox').hidden);
    const src1 = await page.evaluate(() => document.querySelector('#lightbox-img').getAttribute('src'));
    ok(lbOpen && !!src1, `[${label}] lightbox sa otvorí`, src1);
    await page.keyboard.press('ArrowRight');
    const src2 = await page.evaluate(() => document.querySelector('#lightbox-img').getAttribute('src'));
    ok(src2 && src2 !== src1, `[${label}] lightbox: šípka vpravo mení fotografiu`);
    await page.keyboard.press('Escape');
    const lbClosed = await page.evaluate(() => document.querySelector('#lightbox').hidden);
    const focusBack = await page.evaluate(() => document.activeElement?.classList.contains('gallery-btn'));
    ok(lbClosed && focusBack, `[${label}] lightbox: Esc zatvorí a vráti fokus na tlačidlo`);
    const galCount = await page.evaluate(() => document.querySelectorAll('.gallery-btn[data-lightbox-src]').length);
    ok(galCount === 8, `[${label}] galéria má 8 fotiek (${galCount})`);

    /* ---- videá v okne (tím na počítači; na telefóne je tím vo filme, okno je skryté) ---- */
    const vidState = () => page.evaluate(() => [...document.querySelectorAll('video[data-video]')].map((v) => ({ shown: !!v.offsetParent, paused: v.paused, t: v.currentTime })));
    const tv = await page.evaluate(() => document.querySelector('.team-video').getBoundingClientRect().top + scrollY - innerHeight * 0.3);
    if (!mobile) {
      await scrollTo(page, tv); await sleep(2500);
      let vs = await vidState();
      ok(vs.filter((v) => !v.paused).length === 1, `[${label}] tím: hrá video Tím`, JSON.stringify(vs));
      await scrollTo(page, L.sections.sluzby.top + 600); await sleep(800);
      vs = await vidState();
      ok(vs.every((v) => v.paused), `[${label}] mimo viewportu sa video pozastaví`, JSON.stringify(vs));
    } else {
      await scrollTo(page, tv); await sleep(1500);
      const vs = await vidState();
      ok(vs.every((v) => !v.shown && v.paused), `[${label}] okno s videom tímu je na telefóne skryté a nehrá (tím je vo filme)`, JSON.stringify(vs));
    }
    /* ---- pohyblivé detaily ---- */
    const det = await page.evaluate(() => ({ flap: (document.querySelector('[data-flap]') || {}).getAttribute?.('aria-label') || '', marquee: document.querySelectorAll('.marquee-track span').length, steps: document.querySelectorAll('.steps li').length, kin: document.querySelectorAll('.kin .kw').length }));
    ok(/^Dnes /.test(det.flap) && det.marquee >= 10 && det.steps === 5 && det.kin > 20, `[${label}] detaily: tabuľa dnešných hodín, pás služieb, kroky strihu, nadpisy po slovách`, JSON.stringify(det));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ motion off / reduced motion */
  for (const [name, opts] of [['?motion=off', { query: '?motion=off' }], ['prefers-reduced-motion', { reducedMotion: 'reduce' }]]) {
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems, requests } = await openPage(browser, opts);
    await sleep(600);
    const st = await page.evaluate(() => ({
      motion: document.documentElement.dataset.motion, world: document.documentElement.classList.contains('world'), done: window.__renderDone,
      // s kartami stoja zábery cez celé okno a prelínajú sa pri svojej scéne: na vrchu je to záber úvodu
      stillOpacity: getComputedStyle(document.querySelector('#uvod .film-still')).opacity,
      stillTransform: getComputedStyle(document.querySelector('#uvod .film-still img')).transform,
      canvas: !!document.querySelector('.film-canvas'),
    }));
    ok(st.motion === 'off' && st.done === true && !st.world, `[${name}] data-motion=off, bez triedy world, __renderDone`, JSON.stringify(st));
    ok(st.stillOpacity === '1' && st.stillTransform === 'none' && !st.canvas, `[${name}] záloha stojí (bez prejazdu), žiadny canvas`);
    const rec = await page.evaluate(() => { const r = document.querySelector('[data-shot="cakaren"]').getBoundingClientRect(); return r.top + scrollY + r.height * 0.4; });
    await scrollTo(page, rec); await sleep(300);
    const cardOp = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-shot="cakaren"] .title-frame')).opacity));
    ok(cardOp > 0.98, `[${name}] titulná karta čakárne je v pripnutí celá viditeľná (${cardOp})`);
    ok(problems.length === 0, `[${name}] bez chýb`, problems.slice(0, 3).join(' | '));
    ok(!requests.some((u) => /three\.module|\.mp4|\.webm/.test(u)), `[${name}] nesťahuje three.js ani video`, requests.filter((u) => /three|mp4|webm/.test(u)).join(' '));
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await scrollTo(page, h / 2); await sleep(500);
    const playing = await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length);
    ok(playing === 0, `[${name}] žiadne video nehrá`);
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ bez WebGL */
  {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--disable-3d-apis'] });
    const { ctx, page, problems } = await openPage(browser, {});
    await sleep(1500);
    const st = await page.evaluate(() => ({ world: document.documentElement.classList.contains('world'), done: window.__renderDone,
      off: document.documentElement.classList.contains('world-off'), in: document.documentElement.classList.contains('world-in'),
      stillVisible: getComputedStyle(document.querySelector('#uvod .film-still')).opacity, imgW: document.querySelector('#uvod .film-still img').naturalWidth }));
    ok((!st.world || st.off) && !st.in && st.done === true, '[bez WebGL] film nejde (bez world alebo world-off), __renderDone', JSON.stringify(st));
    ok(st.stillVisible === '1' && st.imgW > 0, '[bez WebGL] záloha úvodu je viditeľná a načítaná');
    const L = await layout(page);
    const lastShot = L.shots[L.shots.length - 1];
    await scrollTo(page, lastShot.top + (lastShot.height - L.vh) * 0.3); await sleep(300);
    const cta = await page.locator('#rezervacia .title-card .btn-primary').isVisible();
    ok(cta, '[bez WebGL] tlačidlo Rezervovať termín v rezervácii je viditeľné');
    // film sa vypne s rámovaním prvého snímku (world-frame): záloha stojí (transform none), --sp sa nepíše
    const sv = await scrollVars(page);
    const tr = await page.evaluate(() => ({ t: getComputedStyle(document.querySelector('#rezervacia .film-still img')).transform, frame: document.documentElement.classList.contains('world-frame') }));
    ok(sv.kotvy === 0 && sv.rozsah && (tr.frame ? sv.sp === 0 && tr.t === 'none' : tr.t !== 'none'), '[bez WebGL] premenné skrolu nie sú na kotvách; pri rámovaní filmu (world-frame) sa --sp nepíše', JSON.stringify({ ...sv, ...tr }));
    ok(problems.filter((p) => !/WebGL|GPU|webgl/i.test(p)).length === 0, '[bez WebGL] bez chýb okrem správy o WebGL', problems.slice(0, 3).join(' | '));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ ?film=off: pokojná verzia s pohybom */
  {
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems } = await openPage(browser, { mobile: true, viewport: { width: 390, height: 844 }, query: '?film=off' });
    await sleep(600);
    const L = await layout(page);
    const cak = L.shots.find((x) => x.name === 'cakaren');
    await scrollTo(page, cak.top + cak.height * 0.4);
    const sv = await scrollVars(page);
    const tr = await page.evaluate(() => getComputedStyle(document.querySelector('[data-shot="cakaren"] .film-still img')).transform);
    // jemný prejazd zálohy 1 → 1,06 podľa lokálneho t záberu: --sp priamo na img (nie na kotve), len na zálohách
    // v okolí (is-near, najviac 3 – L5), nie na všetkých 9 v každej snímke
    const spNear = await page.evaluate(() => { const n = [...document.querySelectorAll('.film-shot.is-near')]; return { near: n.length, sp: n.filter((s) => s.querySelector('.film-still img').style.getPropertyValue('--sp') !== '').length }; });
    ok(sv.kotvy === 0 && spNear.near >= 1 && spNear.near <= 3 && spNear.sp === spNear.near && sv.rozsah && /^matrix\(1\.0[1-6]/.test(tr), '[?film=off] --sp na img záloh v okolí (prejazd 1 → 1,06), žiadna premenná na kotve', JSON.stringify({ ...sv, ...spNear, tr }));
    // počas skrolu cez ďalšie karty sa štýl img mení len pri zálohách v okolí (MutationObserver na atribúte style)
    await page.evaluate(() => { window.__spW = { all: 0, far: 0 }; const mo = new MutationObserver((rs) => rs.forEach((r) => { window.__spW.all++; if (!r.target.closest('.film-shot').classList.contains('is-near')) window.__spW.far++; }));
      document.querySelectorAll('.film-still img').forEach((i) => mo.observe(i, { attributes: true, attributeFilter: ['style'] })); });
    for (let k = 1; k <= 8; k++) { await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'instant' }), Math.round(L.vh * 0.45)); await sleep(60); }
    await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
    const spW = await page.evaluate(() => window.__spW);
    ok(spW.all > 0 && spW.far === 0, '[?film=off] --sp sa počas skrolu zapisuje len na zálohy v okolí (is-near)', JSON.stringify(spW));
    ok(problems.length === 0, '[?film=off] bez chýb', problems.slice(0, 3).join(' | '));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ softvérové kreslenie bez ?film=on */
  // brána v hlavičke WebGL nevytvára (rýchly prvý obraz), film overí grafiku po prvom vykreslení a pri
  // softvérovom kreslení sa vypne s triedou world-frame: záloha si nechá rámovanie, nič neposkočí
  // telefón bez ?film=on je ľahký režim (lite, film.js sa nenačíta): kontroluje ho časť 9; tu ostáva telefón s myšou
  // (bez dotyku, napr. úzke okno), kde brána film pustí a softvér ho vypne
  if (FILM_EXISTS) for (const mobile of [false, true]) {
    const name = mobile ? 'softvér úzke okno bez dotyku' : 'softvér desktop';
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems } = await openPage(browser, mobile ? { viewport: { width: 412, height: 823 }, raw: true } : { raw: true });
    await page.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.waitForFunction(() => document.documentElement.classList.contains('world-off'), null, { timeout: 10000 }).catch(() => {});
    await sleep(800);
    const st = await page.evaluate(() => { const c = document.documentElement.classList, r = document.querySelector('#uvod .film-still img').getBoundingClientRect();
      return { world: c.contains('world'), frame: c.contains('world-frame'), off: c.contains('world-off'), in: c.contains('world-in'), cls: +window.__cls.toFixed(4), w: Math.round(r.width) }; });
    ok(st.world && st.frame && st.off && !st.in, `[${name}] film sa po prvom vykreslení vypne (world-frame, world-off)`, JSON.stringify(st));
    ok(st.cls < 0.01, `[${name}] bez posunu rozloženia (CLS ${st.cls})`);
    ok(st.w > (mobile ? 412 : 1440), `[${name}] záloha úvodu má rámovanie filmu (presah), šírka ${st.w}`);
    ok(problems.length === 0, `[${name}] bez chýb`, problems.slice(0, 3).join(' | '));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ 9. ľahký telefón (lite) */
  {
    const browser = await chromium.launch(PRESETS[0]);
    const HOOK = `window.__gl = 0; { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/i.test(String(t))) window.__gl++; return g.call(this, t, ...a); }; }`;
    const FILM_REQ = /three\.module|film\.js|film-worker|\/seq\/|hlbka|tim-slucka/;
    // stav po ustálení: triedy, aktuálna karta (podľa polohy, rovnaké pravidlo ako app.js), viditeľná hotová fotka
    const liteState = (page) => page.evaluate(() => {
      const c = document.documentElement.classList, y = scrollY, vh = innerHeight;
      const t = [...document.querySelectorAll('.film-shot.is-title')];
      let cur = 0; t.forEach((el, i) => { if (el.getBoundingClientRect().top + y <= y + vh * 0.5) cur = i; });
      const stills = [...document.querySelectorAll('.film-shot.is-title .film-still')];
      const vis = stills.filter((st) => { const cs = getComputedStyle(st), img = st.querySelector('img');
        return cs.display !== 'none' && cs.visibility === 'visible' && +cs.opacity > 0.99 && img && img.complete && img.naturalWidth > 0; });
      return { cls: document.documentElement.className, lite: c.contains('lite'), off: c.contains('world-off'), world: c.contains('world'), pro: c.contains('pro'), worldIn: c.contains('world-in'),
        film: !!window.BS30_FILM, gl: window.__gl, cur: t[cur] && t[cur].dataset.shot, curNear: !!t[cur] && t[cur].classList.contains('is-near'),
        hotova: vis.map((st) => st.closest('.film-shot').dataset.shot), zobrazene: stills.filter((st) => getComputedStyle(st).display !== 'none').length,
        // celé okno kryjú nepriehľadné pásy a pätička (napr. #kontakt): fotka tam netreba, ink to nie je
        kryte: [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95].every((f) => { const el = document.elementFromPoint(innerWidth / 2, innerHeight * f); return !!(el && el.closest('.band, .site-footer')); }) };
    });
    const liteOpen = async ({ viewport, hash = '', query = '', init = '' }) => {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
      await ctx.addInitScript(HOOK + init);
      const page = await ctx.newPage();
      const problems = [], requests = [];
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
      page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
      page.on('request', (r) => requests.push(r.url()));
      await page.goto(`${base}/index.html${query}${hash}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__renderDone === true, null, { timeout: 30000 });
      await sleep(1500);
      return { ctx, page, problems, requests };
    };
    for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
      const label = `lite ${viewport.width}`;
      const { ctx, page, problems, requests } = await liteOpen({ viewport });
      const st = await liteState(page);
      ok(st.lite && st.off && !st.world && !st.pro && !st.worldIn && !st.film, `[${label}] triedy lite + world-off, bez world/pro, film.js nespustený`, JSON.stringify(st));
      const bad = requests.filter((u) => FILM_REQ.test(u));
      ok(st.gl === 0 && bad.length === 0, `[${label}] 0 WebGL kontextov, žiadne požiadavky filmu (three.js, film.js, seq, hĺbka, tim-slucka)`, JSON.stringify({ gl: st.gl, bad: bad.slice(0, 3) }));
      const hero = await page.evaluate(() => ({ src: (document.querySelector('#uvod .film-still img').currentSrc || '').split('/').pop(),
        h1: +getComputedStyle(document.querySelector('.title-hero h1 .w')).opacity, act: +getComputedStyle(document.querySelector('.title-hero .title-actions')).opacity,
        filter: getComputedStyle(document.querySelector('.title-hero h1 .w')).filter, near: document.querySelector('#uvod .film-shot').classList.contains('is-near') }));
      ok(/^rohozka-m-/.test(hero.src) && hero.h1 === 1 && hero.act === 1 && hero.filter === 'none' && st.hotova.includes('rohozka'), `[${label}] prvý obraz: rohožka -m, nadpis a tlačidlá viditeľné`, JSON.stringify(hero));
      // celá stránka po kartách: aktuálna karta vždy is-near, na obrazovke vždy hotová fotka
      const tops = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; }));
      let zle = [];
      for (const t of tops) {
        await scrollTo(page, t.y + t.h * 0.3); await sleep(400);
        const s2 = await liteState(page);
        if (!s2.curNear || !(s2.hotova.length || s2.kryte) || s2.zobrazene > 3) zle.push(JSON.stringify({ cur: s2.cur, near: s2.curNear, hotova: s2.hotova, n: s2.zobrazene }));
      }
      ok(zle.length === 0, `[${label}] pri každej karte je aktuálna karta is-near a na obrazovke hotová fotka`, zle.slice(0, 2).join(' '));
      // koniec stránky: pätička, lišta
      const end = await page.evaluate(() => { scrollTo(0, document.scrollingElement.scrollHeight); return null; });
      await sleep(900);
      const kon = await page.evaluate(() => { const f = document.querySelector('.site-footer');
        return { rezerva: Math.round(document.scrollingElement.scrollHeight - (f.getBoundingClientRect().bottom + scrollY)), lista: getComputedStyle(document.querySelector('.site-header')).backgroundColor }; });
      ok(kon.rezerva === 0 && kon.lista === 'rgb(14, 13, 12)', `[${label}] stránka končí pätičkou (0 px pod ňou), lišta ink`, JSON.stringify(kon));
      ok(problems.length === 0, `[${label}] bez chýb a 4xx`, problems.slice(0, 3).join(' | '));
      // obnovená poloha (znovunačítanie uprostred stránky) a návrat späť
      const cak = await page.evaluate(() => { const el = document.querySelector('[data-shot="cakaren"]'); const r = el.getBoundingClientRect(); return r.top + scrollY + r.height * 0.3; });
      await scrollTo(page, cak);
      await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => window.__renderDone === true); await sleep(1500);
      const re = await liteState(page);
      // po znovunačítaní musí byť na obrazovke záber karty, ktorú skrol ukazuje (čakáreň), nie len záloha úvodu
      ok(re.hotova.includes('cakaren'), `[${label}] znovunačítanie uprostred: na obrazovke je záber čakárne`, JSON.stringify(re.hotova));
      ok(re.curNear && (re.hotova.length > 0 || re.kryte) && re.lite, `[${label}] znovunačítanie uprostred: aktuálna karta ${re.cur} is-near, fotka na obrazovke ${re.hotova.join(',')}`, JSON.stringify(re));
      await page.goto(`${base}/index.html#kontakt`, { waitUntil: 'load' }); await sleep(800);
      await page.goBack({ waitUntil: 'load' }).catch(() => {});
      // obnovená poloha prejde plynulým skrolom cez celú stránku: stav sa číta až po ustálení slučky
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {}); await sleep(1500);
      const bk = await liteState(page);
      ok(bk.curNear && (bk.hotova.length > 0 || bk.kryte), `[${label}] späť: aktuálna karta ${bk.cur} is-near, fotka ${bk.hotova.join(',')}`, JSON.stringify(bk));
      await ctx.close();
    }
    // kotvy, angličtina (t-wait), ?film=off (lite ostáva), ?film=on (film na telefóne)
    for (const [name, o] of [['#tim', { hash: '#tim' }], ['#kontakt', { hash: '#kontakt' }], ['b30.lang=en', { init: ';try{localStorage.setItem("b30.lang","en")}catch(e){}' }], ['?film=off', { query: '?film=off' }]]) {
      const { ctx, page, problems, requests } = await liteOpen({ viewport: { width: 390, height: 844 }, ...o });
      const st = await liteState(page);
      ok(st.lite && st.off && st.curNear && (st.hotova.length > 0 || st.kryte) && st.gl === 0 && !requests.some((u) => FILM_REQ.test(u)), `[lite ${name}] aktuálna karta ${st.cur} is-near, fotka ${st.hotova.join(',') || (st.kryte ? '(okno kryje pás/pätička)' : 'žiadna')}, bez filmu`, JSON.stringify(st));
      ok(problems.length === 0, `[lite ${name}] bez chýb`, problems.slice(0, 3).join(' | '));
      await ctx.close();
    }
    {
      const { ctx, page } = await liteOpen({ viewport: { width: 390, height: 844 }, query: '?film=on' });
      const st = await liteState(page);
      ok(!st.lite && st.world && st.film, '[telefón ?film=on] lite vypnutý, film sa načíta (world)', JSON.stringify(st));
      await ctx.close();
    }
    {
      const ctx = await browser.newContext({ viewport: { width: 600, height: 900 }, colorScheme: 'dark' });
      const page = await ctx.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
      const cls = await page.evaluate(() => document.documentElement.className);
      ok(/(^|\s)world(\s|$)/.test(cls) && !/\blite\b/.test(cls), '[600×900 s myšou] úzke okno počítača ostáva na filme (world, bez lite)', cls);
      await ctx.close();
    }
    await browser.close();
  }

  /* ------------------------------------------------------------------ šírky telefónov: bez vodorovného pretekania */
  {
    const browser = await chromium.launch(PRESETS[0]);
    for (const w of [375, 390, 430]) {
      const { ctx, page } = await openPage(browser, { mobile: true, viewport: { width: w, height: 800 } });
      await sleep(400);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      let overflow = false, where = '';
      // aj pri páse tímu a galérie po nástupe kariet (is-in, karta už bez posunu)
      const strips = await page.evaluate(() => ['.team-grid', '.gallery-grid'].map((q) => { const el = document.querySelector(q); return el ? el.getBoundingClientRect().top + scrollY - innerHeight * 0.3 : 0; }));
      for (const y of [0, h * 0.25, h * 0.5, h * 0.75, h, ...strips]) {
        await scrollTo(page, y);
        if (strips.includes(y)) await sleep(900);
        const r = await page.evaluate(() => {
          const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 2).map((el) => el.className || el.tagName);
          return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide };
        });
        if (r.sw > r.iw) { overflow = true; where = `${r.sw}>${r.iw} ${r.wide.join(',')}`; break; }
      }
      ok(!overflow, `[${w} px] žiadne vodorovné pretekanie`, where);
      await ctx.close();
    }
    // bez skriptov (kým app.js nedobehne, aj pri jeho zlyhaní): šírka okna ostáva šírkou telefónu
    {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.route(/assets\/(app|film)\.js/, (r) => r.abort());
      await page.goto(`${base}/index.html`, { waitUntil: 'load', timeout: 60000 });
      await sleep(500);
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      ok(r.iw === 412 && r.sw <= r.iw, '[412 px bez app.js] žiadne vodorovné pretekanie, telefón stránku neoddiali', JSON.stringify(r));
      await ctx.close();
    }
    await browser.close();
  }
} finally {
  srv.server.close();
}
console.log(failed ? `\n${failed} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(failed ? 1 : 0);
