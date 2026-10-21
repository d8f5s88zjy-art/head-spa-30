// Test jazykových verzií (assets/i18n.js, slovníky assets/i18n/*.json) – Playwright, statický server.
// Spustenie: NODE_PATH=/opt/node22/lib/node_modules node source/tools/i18n-test.mjs
// Overí pre každý jazyk: preklad sa nasadí (lang na <html>), na stránke neostal slovenský text, ktorý má preklad,
// nadpisy po slovách sú celé preložené, tabuľa hodín je v jazyku stránky, Booqme má jazyk, bez chýb v konzole.
// Ďalej prepínač na počítači aj v menu telefónu a návrat do slovenčiny bez zmeny textu.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LANGS = { en: 'en', uk: 'uk-UA', hu: 'hu-HU', sr: 'sr-Latn', pl: 'pl-PL', de: 'de-AT', cs: 'cs-CZ' };
const BQ = { en: 'en/reservation', uk: 'uk/reservation', hu: 'hu/foglalas', sr: 'en/reservation', pl: 'pl/reservation', de: 'de/reservation', cs: 'cs/rezervace' };

const srv = await startStaticServer(ROOT);
const browser = await chromium.launch();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'OK  ' : 'CHYBA'} ${name}${info ? '  ' + JSON.stringify(info) : ''}`); if (!cond) fails++; };

async function page(opts, url) {
  const p = await browser.newPage(opts);
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/WebGL|GPU/i.test(m.text())) errs.push(m.text()); });
  p.on('requestfailed', (r) => { if (r.url().startsWith(srv.origin)) errs.push('fail ' + r.url()); });
  await p.goto(url);
  return { p, errs };
}

// texty na stránke, ktoré sú slovenským kľúčom s iným prekladom (= ostali nepreložené)
const zvysky = (p, dict) => p.evaluate((d) => {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const out = [], preklady = new Set(Object.values(d).filter((v) => typeof v === 'string').map(norm));
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    // obsah výslovne označený ako slovenský (vizitka ako vytlačená, assets/karty.js) sa neprekladá
    const par = n.parentNode; if (!par || /SCRIPT|STYLE|NOSCRIPT/.test(par.nodeName) || par.closest('svg, [data-lang-switch], .lang-offer, body [lang="sk"]')) continue;
    const k = norm(n.nodeValue);
    if (k.length > 1 && typeof d[k] === 'string' && norm(d[k]) !== k && !preklady.has(k)) out.push(k);
  }
  // nadpisy po slovách: celý text nadpisu nesmie obsahovať slovenský riadok s prekladom
  document.querySelectorAll('.kin').forEach((h) => { const t = norm(h.textContent); Object.keys(d).forEach((k) => { if (k.length > 6 && typeof d[k] === 'string' && norm(d[k]) !== k && t === k) out.push('kin: ' + k); }); });
  return [...new Set(out)];
}, dict);

const skFlap = await (async () => {
  const { p } = await page({ viewport: { width: 1440, height: 900 } }, `${srv.origin}/?uvod=off`);
  await p.waitForTimeout(800);
  const f = await p.evaluate(() => [(document.querySelector('.flap-state') || {}).textContent, (document.querySelector('[data-flap]') || { getAttribute: () => '' }).getAttribute('aria-label')]);
  await p.close(); return f;
})();

for (const [code, locale] of Object.entries(LANGS)) {
  const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'i18n', `${code}.json`), 'utf8'));
  const { p, errs } = await page({ viewport: { width: 1440, height: 900 } }, `${srv.origin}/?lang=${code}&uvod=off`);
  await p.waitForFunction((l) => document.documentElement.lang === l && !document.documentElement.classList.contains('t-wait'), locale, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => ({ lang: document.documentElement.lang, wait: document.documentElement.classList.contains('t-wait'),
    flap: (document.querySelector('.flap-state') || {}).textContent || '', flapLabel: (document.querySelector('.flap-label') || {}).textContent || '',
    flapAria: (document.querySelector('[data-flap]') || { getAttribute: () => '' }).getAttribute('aria-label'),
    bq: [...document.querySelectorAll('a[href^="https://booqme.app/"]')].map((a) => a.getAttribute('href')),
    rez: (document.querySelector('a[href^="https://www.barbershop30.sk/rezervacia"]') || { title: '' }).title }));
  ok(`[${code}] jazyk nasadený`, st.lang === locale && !st.wait, { lang: st.lang });
  const z = await zvysky(p, dict);
  ok(`[${code}] neostal slovenský text s prekladom`, z.length === 0, z.slice(0, 8));
  const T = dict.__tabula;
  ok(`[${code}] tabuľa hodín v jazyku stránky`, st.flap !== skFlap[0] && st.flapAria !== skFlap[1] && st.flap.length > 3 && st.flapLabel !== 'Dnes' || code === 'cs' && st.flap !== skFlap[0], { flap: st.flap, label: st.flapLabel, aria: st.flapAria });
  ok(`[${code}] Booqme v jazyku`, st.bq.length > 0 && st.bq.every((h) => h.includes(`booqme.app/${BQ[code]}/`)), st.bq);
  ok(`[${code}] poznámka k rezervácii po slovensky`, st.rez.length > 5, { rez: st.rez });
  ok(`[${code}] bez chýb`, errs.length === 0, errs.slice(0, 5));
  if (!T) ok(`[${code}] slovník má __tabula`, false);
  await p.close();
}

// prepínač na počítači: SK → EN → SK, text sa vráti presne
{
  const { p, errs } = await page({ viewport: { width: 1440, height: 900 } }, `${srv.origin}/?uvod=off`);
  await p.mouse.move(400, 400); await p.waitForTimeout(400);
  await p.waitForSelector('.lang-btn', { state: 'visible', timeout: 10000 });
  await p.waitForTimeout(600);
  const text = () => p.evaluate(() => { const c = document.querySelector('.flap-cells'); if (c) c.style.display = 'none'; const t = document.body.innerText; if (c) c.style.display = ''; return t; });
  const skText = await text();
  const pos = await p.evaluate(() => { const r = document.querySelector('.lang-btn').getBoundingClientRect(); return { x: r.x, w: r.width, inHeader: !!document.querySelector('.lang-btn').closest('.site-header .container'), inNav: !!document.querySelector('.lang').closest('#nav') }; });
  ok('počítač: prepínač v lište, nie v menu', pos.inHeader && !pos.inNav, pos);
  await p.click('.lang-btn'); await p.click('[data-lang-pick="en"]');
  await p.waitForFunction(() => document.documentElement.lang === 'en', null, { timeout: 10000 });
  await p.waitForTimeout(800);
  const en = await text();
  ok('počítač: angličtina sa nasadí', /Book|book/.test(en) && en !== skText);
  await p.click('.lang-btn'); await p.click('[data-lang-pick="sk"]');
  await p.waitForFunction(() => document.documentElement.lang === 'sk-SK', null, { timeout: 10000 });
  await p.waitForTimeout(800);
  const sk2 = await text();
  const diff = sk2.split('\n').filter((l, i) => l !== skText.split('\n')[i]);
  ok('počítač: návrat do slovenčiny vráti text', sk2 === skText, diff.slice(0, 6));
  ok('počítač: bez chýb', errs.length === 0, errs);
  await p.close();
}

// telefón: lišta má miesto pre Menu, jazyky sú v rozbaľovacom menu
for (const w of [320, 375, 390]) {
  const { p, errs } = await page({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true }, `${srv.origin}/?uvod=off`);
  await p.tap('body', { position: { x: 10, y: 400 } }).catch(() => {}); await p.waitForTimeout(4200);
  const st = await p.evaluate(() => {
    const t = document.querySelector('.nav-toggle').getBoundingClientRect(), lang = document.querySelector('.lang');
    return { tw: t.width, tr: Math.round(t.right), vw: innerWidth, inNav: !!(lang && lang.closest('#nav')), sw: document.documentElement.scrollWidth };
  });
  ok(`[${w} px] tlačidlo Menu má 44 px a je na obrazovke, jazyky sú v menu`, st.tw >= 44 && st.tr <= st.vw && st.inNav && st.sw <= st.vw, st);
  await p.tap('.nav-toggle'); await p.waitForTimeout(400);
  await p.tap('[data-lang-pick="uk"]'); await p.waitForFunction(() => document.documentElement.lang === 'uk-UA', null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(600);
  const st2 = await p.evaluate(() => ({ lang: document.documentElement.lang, sw: document.documentElement.scrollWidth, vw: innerWidth }));
  ok(`[${w} px] ukrajinčina z menu, bez pretekania`, st2.lang === 'uk-UA' && st2.sw <= st2.vw, st2);
  ok(`[${w} px] bez chýb`, errs.length === 0, errs);
  await p.close();
}

await browser.close();
srv.server.close();
console.log(fails ? `\n${fails} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(fails ? 1 : 0);
