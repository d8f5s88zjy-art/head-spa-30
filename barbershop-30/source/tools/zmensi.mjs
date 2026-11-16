#!/usr/bin/env node
// Nasadenie bez komentárov (PLY-01, PLY-08 len CSS): spracuje už skopírovaný web pred nahratím, zdroj v repozitári
// ostáva s komentármi. Volá sa ako posledná úprava HTML (po en-stranka.mjs) v .github/workflows/pages.yml
// a v source/tools/nasad-barbershop30.sh.
//
//   node source/tools/zmensi.mjs <priečinok webu>              napr. _site/barbershop-30
//   node source/tools/zmensi.mjs <priečinok webu> --skusobne   len vypíše úsporu, nič nezapíše
//
// HTML (index.html, en/index.html, rezervacia.html, 404.html): odstráni <!-- … --> okrem obsahu <script>, <style>,
// <textarea> a <pre>; komentár sám na riadku zmizne aj s riadkom. Odsadenie na začiatku riadkov (medzery a tabulátory za
// zalomením) tiež zmizne, zalomenie ostáva, takže medzi prvkami je stále medzera a vzhľad sa nemení (na stránkach nie je
// white-space: pre mimo chránených častí); 12. 11. 2026 kvôli stráži PLY-01, keď Lajkove texty úvodu a tímu pridali ~90 B.
// CSS (assets/*.css): odstráni /* … */ len zo súborov, ktoré nemajú url( ani /* vnútri reťazca (inak by sa mohla
// poškodiť adresa alebo text), a prázdne riadky. JavaScript sa nemení.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { bezKomentarovHtml, bezKomentarovCss } from '../../admin/lib/zmensi-jadro.js';   // čisté jadro (to isté použije správa webu na vlastnej doméne)
export { bezKomentarovHtml, bezKomentarovCss };

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
