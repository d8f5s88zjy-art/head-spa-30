#!/usr/bin/env node
// Nasadenie bez komentárov (PLY-01, PLY-08 len CSS): spracuje už skopírovaný web pred nahratím, zdroj v repozitári
// ostáva s komentármi. Volá sa ako posledná úprava HTML (po en-stranka.mjs) v .github/workflows/pages.yml
// a v source/tools/nasad-barbershop30.sh.
//
//   node source/tools/zmensi.mjs <priečinok webu>              napr. _site/barbershop-30
//   node source/tools/zmensi.mjs <priečinok webu> --skusobne   len vypíše úsporu, nič nezapíše
//
// HTML (index.html, en/index.html, rezervacia.html, 404.html): odstráni <!-- … --> okrem obsahu <script>, <style>,
// <textarea> a <pre>; komentár sám na riadku zmizne aj s riadkom.
// CSS (assets/*.css): odstráni /* … */ len zo súborov, ktoré nemajú url( ani /* vnútri reťazca (inak by sa mohla
// poškodiť adresa alebo text), a prázdne riadky. JavaScript sa nemení.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

/* HTML bez komentárov; časti v <script>, <style>, <textarea>, <pre> ostanú nedotknuté */
export function bezKomentarovHtml(html) {
  const chran = /<(script|style|textarea|pre)\b[\s\S]*?<\/\1\s*>/gi;
  const cisti = (t) => t.replace(/^[ \t]*<!--(?!\[if)[\s\S]*?-->[ \t]*\r?\n/gm, '').replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
  let out = '', i = 0, m;
  while ((m = chran.exec(html))) { out += cisti(html.slice(i, m.index)) + m[0]; i = m.index + m[0].length; }
  return out + cisti(html.slice(i));
}

/* CSS bez komentárov, alebo null, keď súbor má url( alebo /* v reťazci (ponechá sa celý) */
export function bezKomentarovCss(css) {
  if (/url\(/.test(css) || /(["'])[^"'\n]*\/\*[^"'\n]*\1/.test(css)) return null;
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [DIR, ...rest] = process.argv.slice(2);
  const SKUS = rest.includes('--skusobne');
  if (!DIR || !fs.existsSync(path.join(DIR, 'index.html'))) { console.error('použitie: node zmensi.mjs <priečinok webu s index.html> [--skusobne]'); process.exit(2); }
  const gz = (s) => zlib.gzipSync(s, { level: 9 }).length;
  let pred = 0, po = 0;
  const zapis = (f, t, s) => { pred += gz(t); po += gz(s); console.log(`${path.relative(DIR, f).padEnd(26)} gzip ${gz(t)} → ${gz(s)} B`); if (!SKUS) fs.writeFileSync(f, s); };
  for (const f of ['index.html', 'en/index.html', 'rezervacia.html', '404.html'].map((x) => path.join(DIR, x))) {
    if (fs.existsSync(f)) { const t = fs.readFileSync(f, 'utf8'); zapis(f, t, bezKomentarovHtml(t)); }
  }
  for (const x of fs.readdirSync(path.join(DIR, 'assets')).filter((n) => n.endsWith('.css')).sort()) {
    const f = path.join(DIR, 'assets', x), t = fs.readFileSync(f, 'utf8'), s = bezKomentarovCss(t);
    if (s === null) console.log(`${('assets/' + x).padEnd(26)} ponechaný (url( alebo /* v reťazci)`);
    else zapis(f, t, s);
  }
  console.log(`spolu gzip ${pred} → ${po} B (−${pred - po} B)${SKUS ? ', skúšobne, nič nezapísané' : ''}`);
}
