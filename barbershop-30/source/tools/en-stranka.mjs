#!/usr/bin/env node
// Anglická stránka en/index.html zo slovenskej index.html a slovníka assets/i18n/en.json, aby ju Google našiel
// (vlastná adresa, texty priamo v HTML, hreflang v sitemap.xml). Rovnaké pravidlá ako assets/i18n.js: kľúč je
// slovenský text s normalizovanými medzerami, prekladajú sa textové uzly (okrem script, style, svg a [data-no-i18n])
// a atribúty placeholder, aria-label, alt, title, popisy v meta a titulok; navyše data-lightbox-alt a názvy
// služieb v údajoch pre Google. Text bez kľúča ostane po slovensky (i18n-test stráži, že žiadny nechýba).
// Spúšťa sa pri nasadení (.github/workflows/pages.yml, source/tools/nasad-barbershop30.sh) až po všetkých úpravách
// index.html, takže anglická stránka je vždy podľa poslednej verzie (aj po zmenách v admine). V repozitári je kópia
// en/index.html na náhľad; --check overí, že je aktuálna.
//   node source/tools/en-stranka.mjs [priečinok webu] [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enStranka } from '../../admin/lib/en-stranka-jadro.js';   // čisté jadro (to isté použije správa webu na vlastnej doméne)

const args = process.argv.slice(2);
const SITE = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const CHECK = args.includes('--check');
const src = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const map = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'i18n', 'en.json'), 'utf8'));
const { html, preklad, bez: zvysok } = enStranka(src, map);

const ciel = path.join(SITE, 'en', 'index.html');
if (CHECK) {
  const stary = fs.existsSync(ciel) ? fs.readFileSync(ciel, 'utf8') : '';
  console.log(stary === html ? 'en/index.html je aktuálna' : 'en/index.html nie je aktuálna (node source/tools/en-stranka.mjs)');
  process.exit(stary === html ? 0 : 1);
}
fs.mkdirSync(path.dirname(ciel), { recursive: true });
fs.writeFileSync(ciel, html);
console.log(`en/index.html: ${preklad} prekladov, bez prekladu ${zvysok.length}${zvysok.length ? ': ' + zvysok.slice(0, 12).join(' | ') : ''}`);
