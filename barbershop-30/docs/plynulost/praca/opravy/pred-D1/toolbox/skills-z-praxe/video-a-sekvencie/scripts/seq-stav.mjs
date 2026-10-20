#!/usr/bin/env node
// Kontrola sekvencie snímok vo filme BARBERSHOP 30 (data-video-mode="seq") cez window.BS30_FILM.state.seq.
// Telefón 390 × 844, ?film=on (softvérové kreslenie v kontajneri), ?uvod=off (bez prológu).
// Skroluje cez scénu (od výšky okna nad horným okrajom kotvy po výšku pod ním), vypisuje lo/hi/mix/tex, potom zastane
// na kotve filmu a overí, že mix je 0 alebo 1 (ostrá snímka) a že je na obrazovke stredná snímka (plagát).
// Fps sa tu nemeria: SwiftShader kreslí asi 7 snímok/s, kontroluje sa len logika.
//
//   node toolbox/skills-z-praxe/video-a-sekvencie/scripts/seq-stav.mjs [--id=vstup-dnu] [--root=barbershop-30]
//
// Potrebuje Playwright (require('playwright') cez NODE_PATH) a Chromium v /opt/pw-browsers.
// Statický server a voľby Chromia berie z barbershop-30/source/shot.mjs. Exit 1 pri chybe.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const REPO = path.resolve(here, '..', '..', '..', '..');
const ROOT = path.resolve(REPO, arg('root', 'barbershop-30'));
const ID = arg('id', 'vstup-dnu');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { chromium } = createRequire(import.meta.url)('playwright');
const { startStaticServer, PRESETS } = await import(pathToFileURL(path.join(ROOT, 'source', 'shot.mjs')).href);
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch(PRESETS[0]);
let bad = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(srv.origin + '/index.html?film=on&uvod=off', { waitUntil: 'load', timeout: 60000 });
  // bez prológu film čaká na prvý pohyb návštevníka (koliesko, kláves); až potom sa sťahujú aj snímky sekvencie
  await page.mouse.wheel(0, 10); await page.keyboard.press('Shift');
  const ready = await page.evaluate(() => Promise.race([window.BS30_FILM.ready, new Promise((z) => setTimeout(() => z('čas vypršal'), 20000))]));
  console.log('film pripravený:', ready);
  if (ready !== true) bad++;

  // kotva scény a meno jej záberu vo filme (záber s videom má meno <data-shot>-video). Kotva filmu pri titulnej
  // karte (.is-title) je stred jej pripnutia (film.js, measure): tam je S = pi a poloha v zábere 0,5, teda plagát.
  const at = await page.evaluate((id) => {
    const el = document.querySelector(`#${id} .film-shot[data-video]`);
    if (!el) return null;
    const y = el.getBoundingClientRect().top + scrollY;
    const free = el.offsetHeight - (el.classList.contains('title-long') ? innerHeight : 0);
    const pf = /f(\d{3})$/.exec(el.dataset.videoPoster || '');
    return { y, mid: el.classList.contains('is-title') ? y + free / 2 : y, shot: el.dataset.shot + '-video', vh: innerHeight, poster: pf ? +pf[1] : null };
  }, ID);
  if (!at) throw new Error(`kotva #${ID} .film-shot[data-video] nie je v stránke`);
  const seq = () => page.evaluate((shot) => (window.BS30_FILM.state.seq || []).find((s) => s.shot === shot) || null, at.shot);
  const cam = () => page.evaluate(() => { const st = window.BS30_FILM.state; return { S: +st.S.toFixed(4), T: +st.T.toFixed(4), frames: st.frames }; });

  // skrol cez scénu: od jednej výšky okna nad kotvou po jednu pod ňou, 12 krokov
  for (let k = 0; k <= 12; k++) {
    const y = Math.max(0, Math.round(at.y - at.vh + (2 * at.vh * k) / 12));
    await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
    await sleep(600);
    const s = await seq();
    if (s) console.log(`skrol ${String(y).padStart(5)} px`, JSON.stringify({ got: `${s.got}/${s.n}`, lo: s.lo, hi: s.hi, mix: s.mix, tex: s.tex, t: s.t }));
  }
  // späť na kotvu filmu (stred pripnutia karty) a čakať, kým kamera dôjde na cieľ (S = T) a zmes dosadne. Softvérové
  // kreslenie v kontajneri má výpadky aj na 2 s bez jedinej snímky, preto rozhoduje S = T a dve rovnaké čítania po sebe, najviac 30 s.
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), Math.round(at.mid));
  const t0 = Date.now();
  let a = null, b = null, c = null;
  while (Date.now() - t0 < 30000) {
    await sleep(1000);
    c = await cam();
    const s = await seq();
    if (c.S === c.T && a && s && s.lo === a.lo && s.hi === a.hi && s.mix === a.mix) { b = s; break; }
    a = c.S === c.T ? s : null;
  }
  console.log(`pokoj po ${((Date.now() - t0) / 1000).toFixed(1)} s`, JSON.stringify(b || a), JSON.stringify(c));
  const texN = b && b.tex ? b.tex.split(',').filter(Boolean).length : 0;
  const okMix = !!b && (b.mix === 0 || b.mix === 1);
  const okTex = texN > 0 && texN <= 6;
  const okStill = !!b;
  // na kotve je poloha v zábere 0,5: na obrazovke má byť stredná snímka, teda plagát (pri párnom počte jedna z dvoch stredných)
  const shown = b ? (b.mix === 1 ? b.hi : b.lo) : -1, mid = b ? (b.n - 1) / 2 : -1;
  const okMid = !!b && Math.abs(shown - mid) <= 0.5 && (at.poster == null || Math.abs(at.poster - mid) <= 0.5);
  console.log(okMix ? 'OK  ' : 'FAIL', 'v pokoji mix 0 alebo 1 (ostrá snímka)');
  console.log(okTex ? 'OK  ' : 'FAIL', `v grafike 1 až 6 snímok (${texN})`);
  console.log(okStill ? 'OK  ' : 'FAIL', 'kamera dôjde na cieľ a dvojica ani zmes sa potom nemenia (do 30 s)');
  console.log(okMid ? 'OK  ' : 'FAIL', `na kotve stredná snímka (ukázaná ${shown}, plagát ${at.poster}, t ${b ? b.t : '?'})`);
  console.log(errs.length ? 'FAIL' : 'OK  ', 'bez chýb konzoly', errs.length ? errs.slice(0, 5) : '');
  bad += [okMix, okTex, okStill, okMid, !errs.length].filter((x) => !x).length;
} catch (e) {
  console.log('FAIL', e.message); bad++;
} finally {
  await browser.close();
  srv.server.close();
}
process.exit(bad ? 1 : 0);
