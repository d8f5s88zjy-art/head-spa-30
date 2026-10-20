/* Kontrola slovenskej sadzby v texte stránky: pomlčky em dash a en dash, jednopísmenové slová
   a číslo s jednotkou bez pevnej medzery (U+00A0), Head Spa rozdelené na dva riadky.
   Pravidlá pevných medzier sú rovnaké ako fixNb v admin/index.html repozitára HEAD SPA 30.
   Spustenie: node typografia-kontrola.mjs <index.html> [ďalšie súbory .json alebo .html na pomlčky] */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [html = 'index.html', ...dalsie] = process.argv.slice(2);
let chyby = 0;

// 1) pomlčky v celom súbore (texty, meta, JSON-LD, preklady), s číslom riadku
for (const f of [html, ...dalsie]) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((r, i) => {
    if (r.includes('\u2014')) { chyby++; console.log(`${f}:${i + 1}: em dash (U+2014): ${ukaz(r, r.indexOf('\u2014'))}`); }
    if (r.includes('\u2013')) console.log(`${f}:${i + 1}: upozornenie, en dash (U+2013): ${ukaz(r, r.indexOf('\u2013'))}`);
  });
}

// 2) pevné medzery v textových uzloch stránky (bez skriptov stránky, len to, čo je v HTML)
const browser = await chromium.launch();
const page = await browser.newPage({ javaScriptEnabled: false });
await page.goto(pathToFileURL(path.resolve(html)).href);
const texty = await page.evaluate(() => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentNode;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName) || p.closest('svg')) continue;
    if (/[A-Za-zÀ-ž]/.test(n.nodeValue)) out.push(n.nodeValue.replace(/[\t\n\r ]+/g, ' '));
  }
  return out;
});
await browser.close();

const PRAVIDLA = [
  ['jednopísmenové slovo bez pevnej medzery', /(^|[\s(„"])([aiouksvzAIOUKSVZ]) (?=\S)/g],
  ['číslo a jednotka bez pevnej medzery', /(\d) (?=(?:min|minút|minúty|€|dní|rokov|rituálov|rituály|rituál|osoby|osôb|hod|%)(?![\wÀ-ž]))/g],
  ['Head Spa bez pevnej medzery', /Head Spa|HEAD SPA/g],
];
for (const t of texty) {
  for (const [nazov, re] of PRAVIDLA) {
    for (const m of t.matchAll(re)) { chyby++; console.log(`${nazov}: ${ukaz(t, m.index + m[0].length - 1)}`); }
  }
}
function ukaz(s, i) { return '…' + s.slice(Math.max(0, i - 35), i + 30).replace(/\u00a0/g, '°') + '…'; }
console.log(chyby ? `\nNálezy: ${chyby} (° je pevná medzera)` : 'Sadzba sedí.');
process.exitCode = chyby ? 1 : 0;
