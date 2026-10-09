#!/usr/bin/env node
// Dymový test režiséra (assets/app.js) proti index.html – Playwright, statický server, bez externých požiadaviek.
//
//   node source/tools/app-smoke.mjs            # všetky kontroly, desktop + mobil
//
// Kontroly (každá vypíše OK/FAIL, na konci exit 1 pri akomkoľvek FAIL):
//  1. načítanie bez pageerror / console.error / zlyhaných požiadaviek (404), žiadne absolútne cesty (/assets/…)
//  2. 5 scroll pozícií: --p rastie, --t1/--t2/--t3/--t7 sa menia podľa scény, data-scene-active sa prepína 1→2→3→4→…→7
//  3. is-in (data-at) sa zapína/vypína, stage data-visible = 1 v scénach 1,2,7 a 0 v 3–6
//  4. ?motion=off a prefers-reduced-motion: data-motion=off, data-webgl=off, __renderDone=true, filmové scény v toku (bez sticky výšky)
//  5. mobilné menu (aria-expanded, Esc), lightbox (otvorenie, šípky, Esc, návrat fokusu)
//  6. videá: hrá najviac jedno; hrá len keď je viditeľné; po odscrollovaní sa pozastaví; pri motion=off sa nič nesťahuje
//  7. bez WebGL (chromium --disable-gpu --disable-3d-apis): data-webgl=off, poster ostáva, stránka použiteľná
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let failed = 0;
const ok = (cond, msg, extra = '') => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}${extra ? '  ' + extra : ''}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = await startStaticServer(ROOT);
const base = srv.origin;

async function openPage(browser, { mobile = false, query = '', reducedMotion = 'no-preference', block = null } = {}) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion,
  });
  const page = await ctx.newPage();
  const problems = [], requests = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(`${base}/index.html${query}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 60000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  return { ctx, page, problems, requests };
}
async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
  // v SwiftShaderi (CPU) trvá snímok stovky ms až sekundy: najprv počkaj, kým slučka zaregistruje scroll (settled=false), potom na dobehnutie
  await page.waitForFunction(() => window.__scrollSettled === false, null, { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 90000 }).catch(() => {});
  await sleep(300);
}
const vars = (page) => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const n = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
  return { p: n('--p'), t1: n('--t1'), t2: n('--t2'), t3: n('--t3'), t7: n('--t7'), scene: document.documentElement.dataset.sceneActive || '', visible: document.querySelector('#stage')?.dataset.visible };
});
const sections = (page) => page.evaluate(() => {
  const y = scrollY, o = {};
  for (const el of document.querySelectorAll('.scene[data-scene]')) { const r = el.getBoundingClientRect(); o[el.id] = { top: r.top + y, height: r.height }; }
  o.vh = innerHeight; return o;
});

try {
  /* ------------------------------------------------------------------ desktop, motion on */
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobil' : 'desktop';
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems, requests } = await openPage(browser, { mobile });
    await sleep(1500);

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

    const dm = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, webgl: document.documentElement.dataset.webgl }));
    ok(dm.motion === 'on' && dm.webgl === 'on', `[${label}] data-motion=on, data-webgl=on`, JSON.stringify(dm));

    const S = await sections(page);
    const film = (id, t) => S[id].top + t * (S[id].height - S.vh);
    const positions = [
      ['scéna 1 t0', 0, '1'],
      ['scéna 2 t0.5', film('remeslo', 0.5), '2'],
      ['scéna 3 t0.5', film('miesto', 0.5), '3'],
      ['scéna 5', S.sluzby.top + 200, '5'],
      ['scéna 7 t0.75', film('rezervacia', 0.75), '7'],
    ];
    let prev = null; const seen = [];
    for (const [name, y, expectScene] of positions) {
      await scrollTo(page, y);
      const v = await vars(page);
      seen.push(v.scene);
      ok(v.scene === expectScene, `[${label}] ${name}: data-scene-active=${v.scene} (čakané ${expectScene})`);
      if (prev) ok(v.p > prev.p, `[${label}] ${name}: --p rastie (${prev.p.toFixed(3)} → ${v.p.toFixed(3)})`);
      if (expectScene === '2') ok(v.t2 > 0.4 && v.t2 < 0.7, `[${label}] --t2 sa mení (${v.t2.toFixed(2)})`);
      if (expectScene === '3') ok(v.t3 > 0.4 && v.t3 < 0.6, `[${label}] --t3 sa mení (${v.t3.toFixed(2)})`);
      if (expectScene === '7') ok(v.t7 > 0.6, `[${label}] --t7 sa mení (${v.t7.toFixed(2)})`);
      ok(v.visible === (['1', '2', '7'].includes(expectScene) ? '1' : '0'), `[${label}] ${name}: stage data-visible=${v.visible}`);
      prev = v;
    }
    ok(new Set(seen).size === seen.length, `[${label}] kapitoly sa prepínajú (${seen.join('→')})`);

    // is-in: text scény 2 sa zapína až od t 0.3
    await scrollTo(page, film('remeslo', 0.1));
    const early = await page.evaluate(() => document.querySelector('.scene-text-2').classList.contains('is-in'));
    await scrollTo(page, film('remeslo', 0.6));
    const late = await page.evaluate(() => document.querySelector('.scene-text-2').classList.contains('is-in'));
    ok(!early && late, `[${label}] data-at: text scény 2 skrytý pri t0.1, viditeľný pri t0.6`);
    // späť hore: dozvuk
    await scrollTo(page, 0);
    const back = await vars(page);
    ok(back.p === 0 && back.scene === '1', `[${label}] návrat hore: --p=0, scéna 1`);

    // príznaky mobilného CTA a hlavičky
    await scrollTo(page, film('rezervacia', 0.75));
    const flags = await page.evaluate(() => ({ cta: document.querySelector('#mobile-cta').classList.contains('is-hidden'), hdr: document.querySelector('.site-header').classList.contains('is-scrolled') }));
    ok(flags.hdr, `[${label}] .site-header.is-scrolled po scrolle`);
    ok(flags.cta, `[${label}] #mobile-cta.is-hidden v scéne 7`);

    /* ---- menu (mobil) ---- */
    if (mobile) {
      await scrollTo(page, 0);
      await page.click('.nav-toggle');
      let exp = await page.getAttribute('.nav-toggle', 'aria-expanded');
      ok(exp === 'true', '[mobil] menu: aria-expanded=true po kliku');
      await page.keyboard.press('Escape');
      exp = await page.getAttribute('.nav-toggle', 'aria-expanded');
      ok(exp === 'false', '[mobil] menu: Esc zatvára');
    }

    /* ---- lightbox ---- */
    const gal = await sections(page);
    await scrollTo(page, gal.galeria.top + 100);
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

    /* ---- videá ---- */
    const vidState = () => page.evaluate(() => [...document.querySelectorAll('video[data-video]')].map((v) => ({ cls: v.closest('figure').classList.contains('team-video') ? 'team-video' : 'scene2-video', paused: v.paused, t: v.currentTime, ready: v.readyState })));
    await scrollTo(page, film('remeslo', 0.6)); await sleep(2500);
    let vs = await vidState();
    ok(vs.filter((v) => !v.paused).length === 1 && !vs.find((v) => v.cls === 'scene2-video').paused, `[${label}] scéna 2: hrá video Remeslo, Ľudia nie`, JSON.stringify(vs));
    await scrollTo(page, film('remeslo', 0.1)); await sleep(800);
    vs = await vidState();
    ok(vs.every((v) => v.paused), `[${label}] scéna 2 t0.1 (video ešte skryté): nič nehrá`, JSON.stringify(vs));
    await scrollTo(page, film('remeslo', 0.6)); await sleep(1200);
    await scrollTo(page, S.tim.top - 40); await sleep(2500);
    vs = await vidState();
    ok(vs.filter((v) => !v.paused).length === 1 && vs.find((v) => v.cls === 'team-video') && !vs.find((v) => v.cls === 'team-video').paused, `[${label}] scéna 4: hrá len video Tím, Remeslo sa pozastavilo`, JSON.stringify(vs));
    await scrollTo(page, S.sluzby.top + 600); await sleep(800);
    vs = await vidState();
    ok(vs.every((v) => v.paused), `[${label}] mimo viewportu sa video pozastaví`, JSON.stringify(vs));
    await ctx.close(); await browser.close();
  }

  /* ------------------------------------------------------------------ motion off / reduced motion */
  for (const [name, opts] of [['?motion=off', { query: '?motion=off' }], ['prefers-reduced-motion', { reducedMotion: 'reduce' }]]) {
    const browser = await chromium.launch(PRESETS[0]);
    const { ctx, page, problems, requests } = await openPage(browser, opts);
    await sleep(600);
    const st = await page.evaluate(() => ({
      motion: document.documentElement.dataset.motion, webgl: document.documentElement.dataset.webgl, done: window.__renderDone,
      stickyPos: getComputedStyle(document.querySelector('.scene-1 .scene-sticky')).position,
      h1: document.querySelector('.scene-1').getBoundingClientRect().height, vh: innerHeight,
      canvas: getComputedStyle(document.querySelector('#stage-canvas')).display,
      textOpacity: getComputedStyle(document.querySelector('.scene-text-2')).opacity,
    }));
    ok(st.motion === 'off' && st.webgl === 'off' && st.done === true, `[${name}] data-motion=off, data-webgl=off, __renderDone`, JSON.stringify(st));
    ok(st.stickyPos === 'relative' && st.h1 < st.vh * 1.6, `[${name}] filmové scény v bežnom toku (výška scény 1 = ${Math.round(st.h1)} px)`);
    ok(st.canvas === 'none' && st.textOpacity === '1', `[${name}] canvas skrytý, text scény 2 viditeľný`);
    ok(problems.length === 0, `[${name}] bez chýb`, problems.slice(0, 3).join(' | '));
    ok(!requests.some((u) => /three\.module|chair\.js|kreslo\.glb|\.mp4|\.webm/.test(u)), `[${name}] nesťahuje three.js, GLB ani video`, requests.filter((u) => /three|chair|glb|mp4|webm/.test(u)).join(' '));
    // celá stránka sa dá prejsť, nič nehrá
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
    await sleep(2500);
    const st = await page.evaluate(() => ({ webgl: document.documentElement.dataset.webgl, motion: document.documentElement.dataset.motion, done: window.__renderDone,
      posterVisible: getComputedStyle(document.querySelector('#stage-poster')).opacity, canvas: getComputedStyle(document.querySelector('#stage-canvas')).display,
      posterW: document.querySelector('#stage-poster img').naturalWidth }));
    ok(st.webgl === 'off' && st.done === true, '[bez WebGL] data-webgl=off, __renderDone', JSON.stringify(st));
    ok(st.posterVisible === '1' && st.canvas === 'none' && st.posterW > 0, '[bez WebGL] poster je viditeľný, canvas skrytý');
    const S = await sections(page);
    await scrollTo(page, S.rezervacia.top + (S.rezervacia.height - S.vh) * 0.75);
    const fb = await page.evaluate(() => getComputedStyle(document.querySelector('.scene7-fallback')).display);
    ok(fb === 'block', '[bez WebGL] scéna 7 ukáže fotografiu vstupu');
    const cta = await page.locator('.scene-7 .btn-primary').isVisible();
    ok(cta, '[bez WebGL] tlačidlo Rezervovať termín je viditeľné');
    ok(problems.filter((p) => !/WebGL|GPU|webgl/i.test(p)).length === 0, '[bez WebGL] bez chýb okrem správy o WebGL', problems.slice(0, 3).join(' | '));
    await ctx.close(); await browser.close();
  }
} finally {
  srv.server.close();
}
console.log(failed ? `\n${failed} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(failed ? 1 : 0);
