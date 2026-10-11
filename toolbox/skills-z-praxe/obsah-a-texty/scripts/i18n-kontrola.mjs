/* Kontrola prekladov kľúčovaných slovenským textom: ktoré texty stránky nemajú kľúč v jazykových súboroch.
   Zbiera textové uzly a atribúty rovnakými pravidlami ako assets/i18n.js (bez skriptov stránky, len HTML).
   Spustenie: node i18n-kontrola.mjs <index.html> <priečinok s jazykmi>  */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [html = 'index.html', dir = 'assets/i18n'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const maps = Object.fromEntries(files.map((f) => [f.replace('.json', ''), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));

const browser = await chromium.launch();
const page = await browser.newPage({ javaScriptEnabled: false });
await page.goto(pathToFileURL(path.resolve(html)).href);
const keys = await page.evaluate(() => {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const out = new Set();
  const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentNode;
    if (!p || SKIP[p.nodeName] || p.closest('svg') || p.closest('[data-no-i18n]') || !/[A-Za-zÀ-ž]/.test(n.nodeValue)) continue;
    out.add(norm(n.nodeValue));
  }
  document.body.querySelectorAll('[placeholder],[aria-label],[alt],[title]').forEach((el) => {
    if (el.closest('svg')) return;
    ['placeholder', 'aria-label', 'alt', 'title'].forEach((a) => {
      const v = el.getAttribute(a);
      if (v && /[A-Za-zÀ-ž]/.test(v) && v.indexOf('http') !== 0) out.add(norm(v));
    });
  });
  ['description', 'og:description', 'og:title', 'og:image:alt', 'twitter:title', 'twitter:description'].forEach((nm) => {
    const el = document.querySelector(`meta[name="${nm}"],meta[property="${nm}"]`);
    if (el) out.add(norm(el.content));
  });
  const ti = document.querySelector('title'); if (ti) out.add(norm(ti.textContent));
  return [...out];
});
await browser.close();

let chyba = 0;
for (const [L, m] of Object.entries(maps)) {
  const chyba_kluc = keys.filter((k) => k.length > 1 && m[k] === undefined);
  console.log(`${L}: ${chyba_kluc.length} textov bez prekladu`);
  chyba_kluc.slice(0, 15).forEach((k) => console.log('   ' + k.slice(0, 110)));
  if (chyba_kluc.length) chyba = 1;
}
const prvy = Object.values(maps)[0] || {};
const nepouzite = Object.keys(prvy).filter((k) => !keys.includes(k));
console.log(`\nKľúče, ktoré stránka v HTML nemá (môžu patriť textom zo skriptov): ${nepouzite.length}`);
const mn = Object.keys(maps); for (const L of mn) { const a = Object.keys(maps[L]).length; if (a !== Object.keys(prvy).length) console.log(`${L}: ${a} kľúčov, ${mn[0]}: ${Object.keys(prvy).length}`); }
process.exitCode = chyba;
