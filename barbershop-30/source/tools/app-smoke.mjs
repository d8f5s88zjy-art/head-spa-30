#!/usr/bin/env node
// Dymový test režiséra (assets/app.js) proti index.html – Playwright, statický server, bez externých požiadaviek.
//
//   node source/tools/app-smoke.mjs            # všetky kontroly, desktop + mobil
//
// Kontroly (každá vypíše OK/FAIL, na konci exit 1 pri akomkoľvek FAIL):
//  1. načítanie bez pageerror / console.error / zlyhaných požiadaviek (404), žiadne absolútne cesty (/assets/…)
//     (chýbajúci assets/film.js sa toleruje, kým súbor neexistuje – stránka musí fungovať aj bez neho)
//  2. 9 sekcií: scroll na každú kotvu .film-shot – data-scene-active ide 1→9, --p rastie, --sp kotvy v rozsahu 0–1
//  3. zálohy: každá .film-shot má min. výšku okna, .film-still viditeľná (bez world-in), prvá má fetchpriority=high
//  4. ?motion=off a prefers-reduced-motion: data-motion=off, __renderDone=true, dosky viditeľné, žiadne video, bez three.js
//  5. mobilné menu (aria-expanded, Esc), lightbox (otvorenie, šípky, Esc, návrat fokusu), mobilné CTA skryté v poslednej sekcii
//  6. videá: hrá najviac jedno; hrá len keď je viditeľné; po odscrollovaní sa pozastaví; pri motion=off sa nič nesťahuje
//  7. bez WebGL (chromium --disable-gpu --disable-3d-apis): html bez triedy world, zálohy ostávajú, stránka použiteľná
//  8. šírky 375 / 390 / 430 px: žiadne vodorovné pretekanie (scrollWidth <= innerWidth)
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

async function openPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, query = '', reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion });
  const page = await ctx.newPage();
  const problems = [], requests = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !filmNoise(m.text())) problems.push(`console.error: ${m.text()}`); });
  page.on('requestfailed', (r) => { if (!filmNoise(r.url())) problems.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !filmNoise(r.url())) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(`${base}/index.html${query}`, { waitUntil: 'load', timeout: 60000 });
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
  const cs = getComputedStyle(document.documentElement);
  return { p: parseFloat(cs.getPropertyValue('--p')) || 0, scene: document.documentElement.dataset.sceneActive || '' };
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
        allTall: shots.every((s) => s.getBoundingClientRect().height >= innerHeight - 1),
        allHaveStill: shots.every((s) => s.querySelector('picture.film-still img[width][height][alt]')),
        allHaveMeta: shots.every((s) => s.dataset.shot && /^[\d.]+,[\d.]+$/.test(s.dataset.f || '') && /^(in|right|left|rise|down|near)$/.test(s.dataset.mv || '')),
        firstHigh: first?.getAttribute('fetchpriority') === 'high' && first?.getAttribute('loading') !== 'lazy',
        lazyRest: [...document.querySelectorAll('.film-shot .film-still img')].slice(1).every((i) => i.getAttribute('loading') === 'lazy'),
        firstVisible: first ? getComputedStyle(first.closest('.film-still')).opacity === '1' && first.naturalWidth > 0 : false,
        worldIn: document.documentElement.classList.contains('world-in'),
      };
    });
    ok(stills.count === 13 && stills.allHaveStill && stills.allHaveMeta, `[${label}] 13 kotiev .film-shot s data-shot/f/mv a zálohou`, JSON.stringify({ count: stills.count, still: stills.allHaveStill, meta: stills.allHaveMeta }));
    ok(stills.allTall, `[${label}] každá kotva má aspoň výšku okna`);
    ok(stills.firstHigh && stills.lazyRest, `[${label}] prvá záloha fetchpriority=high, ostatné lazy`);
    ok(stills.worldIn || stills.firstVisible, `[${label}] prvá záloha je viditeľná a načítaná (alebo beží film)`, JSON.stringify(stills));

    // 2. sekcie 1→9
    const L = await layout(page);
    let prev = null; const seen = [];
    for (let n = 1; n <= 9; n++) {
      const s = L.shots.find((x) => Number(x.scene) === n);
      await scrollTo(page, s.top);
      const v = await vars(page);
      seen.push(v.scene);
      ok(v.scene === String(n), `[${label}] kotva ${s.name}: data-scene-active=${v.scene} (čakané ${n})`);
      if (prev) ok(v.p > prev.p, `[${label}] kotva ${s.name}: --p rastie (${prev.p.toFixed(3)} → ${v.p.toFixed(3)})`);
      prev = v;
    }
    ok(new Set(seen).size === 9, `[${label}] kapitoly sa prepínajú (${seen.join('→')})`);
    const sp = await page.evaluate(() => [...document.querySelectorAll('.film-shot')].map((el) => parseFloat(el.style.getPropertyValue('--sp'))).filter((v) => Number.isFinite(v)));
    ok(sp.length === 13 && sp.every((v) => v >= 0 && v <= 1), `[${label}] --sp nastavené na všetkých kotvách v rozsahu 0–1`, sp.map((v) => v.toFixed(2)).join(' '));

    // data-at: chip druhého záberu sály (kreslo) – skrytý pred vstupom, viditeľný v strede
    const kreslo = L.shots.find((x) => x.name === 'kreslo');
    await scrollTo(page, kreslo.top - L.vh * 0.9);
    const early = await page.evaluate(() => document.querySelector('[data-shot="kreslo"] .place-tag').classList.contains('is-in'));
    await scrollTo(page, kreslo.top);
    const late = await page.evaluate(() => document.querySelector('[data-shot="kreslo"] .place-tag').classList.contains('is-in'));
    ok(!early && late, `[${label}] data-at: popis záberu kreslo skrytý pred vstupom, viditeľný v zábere`);

    // dosky .reveal sa odkryjú
    const boards = await page.evaluate(() => ({ seen: document.querySelectorAll('.board.reveal.is-in').length, all: document.querySelectorAll('.board.reveal').length }));
    ok(boards.seen >= 2, `[${label}] dosky sa odkrývajú (.reveal.is-in ${boards.seen}/${boards.all})`);

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

    /* ---- videá ---- */
    const vidState = () => page.evaluate(() => [...document.querySelectorAll('video[data-video]')].map((v) => ({ cls: v.closest('figure').classList.contains('team-video') ? 'team-video' : 'remeslo-video', paused: v.paused, t: v.currentTime, ready: v.readyState })));
    const stol = L.shots.find((x) => x.name === 'stol');
    await scrollTo(page, stol.top); await sleep(2500);
    let vs = await vidState();
    ok(vs.filter((v) => !v.paused).length === 1 && !vs.find((v) => v.cls === 'remeslo-video').paused, `[${label}] remeslo: hrá video Remeslo, Tím nie`, JSON.stringify(vs));
    await scrollTo(page, L.sections.sluzby.top + 600); await sleep(800);
    vs = await vidState();
    ok(vs.every((v) => v.paused), `[${label}] mimo viewportu sa video pozastaví`, JSON.stringify(vs));
    const tv = await page.evaluate(() => document.querySelector('.team-video').getBoundingClientRect().top + scrollY - innerHeight * 0.3);
    await scrollTo(page, tv); await sleep(2500);
    vs = await vidState();
    ok(vs.filter((v) => !v.paused).length === 1 && !vs.find((v) => v.cls === 'team-video').paused, `[${label}] tím: hrá len video Tím`, JSON.stringify(vs));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ motion off / reduced motion */
  for (const [name, opts] of [['?motion=off', { query: '?motion=off' }], ['prefers-reduced-motion', { reducedMotion: 'reduce' }]]) {
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems, requests } = await openPage(browser, opts);
    await sleep(600);
    const st = await page.evaluate(() => ({
      motion: document.documentElement.dataset.motion, world: document.documentElement.classList.contains('world'), done: window.__renderDone,
      stillOpacity: getComputedStyle(document.querySelector('[data-shot="recepcia"] .film-still')).opacity,
      stillTransform: getComputedStyle(document.querySelector('[data-shot="recepcia"] .film-still img')).transform,
      boardOpacity: getComputedStyle(document.querySelector('#recepcia .board')).opacity,
      tagOpacity: getComputedStyle(document.querySelector('[data-shot="kreslo"] .place-tag')).opacity,
      canvas: !!document.querySelector('.film-canvas'),
    }));
    ok(st.motion === 'off' && st.done === true && !st.world, `[${name}] data-motion=off, bez triedy world, __renderDone`, JSON.stringify(st));
    ok(st.stillOpacity === '1' && st.stillTransform === 'none' && !st.canvas, `[${name}] záloha stojí (bez prejazdu), žiadny canvas`);
    ok(st.boardOpacity === '1' && st.tagOpacity === '1', `[${name}] dosky a popisy viditeľné`);
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
      stillVisible: getComputedStyle(document.querySelector('[data-shot="vstup"] .film-still')).opacity, imgW: document.querySelector('[data-shot="vstup"] .film-still img').naturalWidth }));
    ok(!st.world && st.done === true, '[bez WebGL] html bez triedy world, __renderDone', JSON.stringify(st));
    ok(st.stillVisible === '1' && st.imgW > 0, '[bez WebGL] záloha vstupu je viditeľná a načítaná');
    const L = await layout(page);
    await scrollTo(page, L.shots[L.shots.length - 1].top);
    const cta = await page.locator('#rezervacia .btn-primary').isVisible();
    ok(cta, '[bez WebGL] tlačidlo Rezervovať termín v rezervácii je viditeľné');
    ok(problems.filter((p) => !/WebGL|GPU|webgl/i.test(p)).length === 0, '[bez WebGL] bez chýb okrem správy o WebGL', problems.slice(0, 3).join(' | '));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ šírky telefónov: bez vodorovného pretekania */
  {
    const browser = await chromium.launch(PRESETS[0]);
    for (const w of [375, 390, 430]) {
      const { ctx, page } = await openPage(browser, { mobile: true, viewport: { width: w, height: 800 } });
      await sleep(400);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      let overflow = false, where = '';
      for (const y of [0, h * 0.25, h * 0.5, h * 0.75, h]) {
        await scrollTo(page, y);
        const r = await page.evaluate(() => {
          const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 2).map((el) => el.className || el.tagName);
          return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide };
        });
        if (r.sw > r.iw) { overflow = true; where = `${r.sw}>${r.iw} ${r.wide.join(',')}`; break; }
      }
      ok(!overflow, `[${w} px] žiadne vodorovné pretekanie`, where);
      await ctx.close();
    }
    await browser.close();
  }
} finally {
  srv.server.close();
}
console.log(failed ? `\n${failed} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(failed ? 1 : 0);
