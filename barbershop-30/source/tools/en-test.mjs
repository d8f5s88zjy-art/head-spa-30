#!/usr/bin/env node
// Test anglickej stránky en/ (source/tools/en-stranka.mjs) a SEO úprav úvodu: stránka je aktuálna, načíta sa bez
// chýb a bez chýbajúcich súborov, text je po anglicky (žiadny slovenský kľúč zo slovníka v texte), titulok, popis,
// kanonická adresa, prepínač jazyka vedie na slovenskú stránku, časté otázky na oboch stránkach, H1 so značkou.
//   node source/tools/en-test.mjs [--out=dir]
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'seo'));
fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const en = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'i18n', 'en.json'), 'utf8'));
// základná adresa webu (canonical slovenskej stránky); pri vlastnej doméne ju prepne jeden sed (README, Nasadenie)
const BASE = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/)[1];

let aktualna = true;
try { execFileSync(process.execPath, [path.join(SITE, 'source', 'tools', 'en-stranka.mjs'), SITE, '--check'], { stdio: 'pipe' }); } catch (e) { aktualna = false; }
ok(aktualna, 'en/index.html je aktuálna (node source/tools/en-stranka.mjs)');

const srv = await startStaticServer(SITE);
const b = await chromium.launch();
const telefon = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-GB' };

/* anglická stránka */
{
  const ctx = await b.newContext(telefon);
  const p = await ctx.newPage();
  const chyby = [], chybajuce = [];
  p.on('pageerror', (e) => chyby.push(String(e)));
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(srv.origin)) chybajuce.push(r.url().replace(srv.origin, '')); });
  await p.goto(`${srv.origin}/en/index.html?uvod=off&film=off&hudba=off`);
  await p.waitForTimeout(2500);
  for (let y = 0; y < 30; y++) { await p.evaluate(() => scrollBy({ top: innerHeight * 0.9, behavior: 'instant' })); await p.waitForTimeout(120); }
  await p.waitForTimeout(800);
  const info = await p.evaluate((map) => {
    const sk = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const par = n.parentNode; if (!par || /SCRIPT|STYLE|NOSCRIPT/.test(par.nodeName) || par.closest('[data-no-i18n],svg')) continue;
      const k = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (k.length > 2 && typeof map[k] === 'string' && map[k].replace(/\s+/g, ' ').trim() !== k) sk.push(k);
    }
    return {
      lang: document.documentElement.lang, title: document.title,
      desc: document.querySelector('meta[name="description"]').content,
      canon: document.querySelector('link[rel="canonical"]').href,
      h1: document.querySelector('h1').innerText.replace(/\s+/g, ' '),
      faq: document.querySelectorAll('.faq-item').length, faqQ: document.querySelector('.faq-item summary').textContent,
      sk: [...new Set(sk)], sirka: document.documentElement.scrollWidth,
      obrazky: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
    };
  }, en);
  ok(info.lang === 'en' && /Men's barbershop/.test(info.title) && /^Men's barbershop at Mostná/.test(info.desc), 'jazyk, titulok a popis po anglicky', info.title);
  ok(info.canon === BASE + 'en/', 'kanonická adresa en/ = základná adresa + en/', info.canon);
  ok(/Barbershop 30 · Nitra/i.test(info.h1) && /Your cut|Your place/i.test(info.h1), 'H1 so značkou a mestom', info.h1);
  ok(info.faq === 10 && info.faqQ === 'How do I book?', 'časté otázky po anglicky', `${info.faq}, ${info.faqQ}`);
  ok(info.sk.length === 0, 'žiadny slovenský text zo slovníka', info.sk.slice(0, 5).join(' | '));
  ok(chybajuce.length === 0 && info.obrazky.length === 0, 'všetky súbory sa načítajú z en/ (cesty ../assets)', chybajuce.slice(0, 4).join(', ') + info.obrazky.slice(0, 2).join(', '));
  ok(chyby.length === 0, 'bez chýb skriptu', chyby.slice(0, 2).join(' | '));
  ok(info.sirka <= 390, 'telefón bez vodorovného pretekania', `${info.sirka}px`);
  await p.evaluate(() => document.querySelector('#caste-otazky').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.click('.faq-item summary');
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelector('.faq-item').open), 'ťuk otvorí odpoveď');
  await p.screenshot({ path: path.join(OUT, 'en-caste-otazky-390.png') });
  // prepínač jazyka v menu telefónu: nemčina otvorí slovenskú stránku s ?lang=de
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await p.click('.nav-toggle');
  await p.waitForSelector('[data-lang-pick="de"]');
  await Promise.all([p.waitForURL(/\/\?lang=de$/), p.click('[data-lang-pick="de"]')]);
  await p.waitForFunction(() => document.documentElement.lang === 'de-AT', null, { timeout: 15000 });
  ok(true, 'prepínač: nemčina vedie na slovenskú stránku s ?lang=de a preloží ju', p.url().replace(srv.origin, ''));
  await ctx.close();
}

/* slovenská stránka: H1, časté otázky, angličtina na mieste */
{
  const ctx = await b.newContext({ ...telefon, locale: 'sk-SK' });
  const p = await ctx.newPage();
  const chyby = [];
  p.on('pageerror', (e) => chyby.push(String(e)));
  await p.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off`);
  await p.waitForTimeout(1500);
  const sk = await p.evaluate(() => ({
    title: document.title, h1: document.querySelector('h1').innerText.replace(/\s+/g, ' '),
    kicker: getComputedStyle(document.querySelector('h1 .kicker')).textTransform,
    faq: [...document.querySelectorAll('.faq-item summary')].map((s) => s.textContent),
    ld: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).hasMap,
  }));
  ok(sk.title === 'Barbershop 30 Nitra | Pánske holičstvo, Mostná 30' && sk.title.length <= 60, 'titulok do 60 znakov', `${sk.title.length}`);
  ok(/BARBERSHOP 30 · NITRA|Barbershop 30 · Nitra/i.test(sk.h1) && sk.kicker === 'uppercase', 'H1 obsahuje značku a mesto, nadpisok ostal verzálkami', sk.h1);
  ok(sk.faq.length === 10 && sk.faq[0] === 'Ako sa objednám?', 'časté otázky na slovenskej stránke', sk.faq.length);
  ok(/maps\?cid=/.test(sk.ld || ''), 'údaje pre Google: odkaz na profil v Mapách', sk.ld);
  await p.evaluate(() => document.querySelector('#caste-otazky').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(OUT, 'sk-caste-otazky-390.png') });
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(OUT, 'sk-uvod-390.png') });
  ok(chyby.length === 0, 'slovenská stránka bez chýb skriptu', chyby.slice(0, 2).join(' | '));
  await ctx.close();
}
await b.close(); srv.server.close();
console.log(`\nVÝSLEDOK: ${failed ? failed + ' zlyhalo' : 'všetko v poriadku'}`);
process.exit(failed ? 1 : 0);
