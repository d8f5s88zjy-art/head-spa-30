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

const args = process.argv.slice(2);
const SITE = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const CHECK = args.includes('--check');
const src = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const map = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'i18n', 'en.json'), 'utf8'));

const NB = ' ';
const LETTER = /\p{L}/u;
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: NB };
const dec = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : (ENT[e.toLowerCase()] ?? m)));
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => escT(s).replace(/"/g, '&quot;');
// preklad zachová medzery okolo textu; značka Barbershop 30 sa nerozdelí na dva riadky (put v i18n.js)
const put = (raw, tr) => raw.match(/^\s*/)[0] + String(tr).replace(/Barbershop 30/g, `Barbershop${NB}30`) + raw.match(/\s*$/)[0];
const preloz = (t) => { if (!LETTER.test(t)) return null; const v = map[norm(t)]; return typeof v === 'string' ? v : null; };

const ATTRS = new Set(['placeholder', 'aria-label', 'alt', 'title', 'data-lightbox-alt']);
const META = new Set(['description', 'og:description', 'og:title', 'og:image:alt', 'twitter:title', 'twitter:description']);
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const SKIP = new Set(['script', 'style', 'svg']);

let preklad = 0, bez = [];
// tokeny: komentár, značka, text; zásobník značiek kvôli script/style/svg a [data-no-i18n]
const out = [];
const stack = [];
const re = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/gi;
let m;
const ticho = () => stack.some((x) => SKIP.has(x.tag) || x.noi18n);
let kon = 0;   // koniec predošlého tokenu: každý znak stránky musí patriť nejakému tokenu (nič sa nestratí)
while ((m = re.exec(src))) {
  if (m.index !== kon) throw new Error(`rozbor HTML: neznámy obsah na pozícii ${kon}: ${JSON.stringify(src.slice(kon, kon + 40))}`);
  kon = re.lastIndex;
  const [cely, zav, meno, atr, text] = m;
  if (text !== undefined) {
    if (ticho() || !LETTER.test(text)) { out.push(text); continue; }
    const t = dec(text), v = preloz(t);
    if (v) { out.push(put(text, escT(v))); preklad++; } else { out.push(text); if (norm(t).length > 1) bez.push(norm(t)); }
    continue;
  }
  if (!meno) { out.push(cely); continue; }
  const tag = meno.toLowerCase();
  if (zav) {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
    out.push(cely);
    continue;
  }
  const noi18n = /\sdata-no-i18n(?=[\s=>]|$)/.test(atr);
  let a = atr;
  if (!ticho() && !noi18n) {
    a = atr.replace(/(\s)([\w:-]+)="([^"]*)"/g, (mm, sp, k, v) => {
      if (ATTRS.has(k.toLowerCase()) && !v.startsWith('http')) { const t = preloz(dec(v)); if (t) { preklad++; return `${sp}${k}="${escA(t)}"`; } }
      return mm;
    });
    if (tag === 'meta') {
      const nm = (atr.match(/\s(?:name|property)="([^"]+)"/) || [])[1];
      if (nm && META.has(nm)) a = a.replace(/(\scontent=")([^"]*)(")/, (mm, x, v, y) => { const t = preloz(dec(v)); if (t) { preklad++; return x + escA(t) + y; } return mm; });
    }
  }
  out.push(`<${meno}${a}>`);
  // obsah script a style sa skopíruje celý (môže obsahovať „<“), údaje pre Google sa preložia
  if (tag === 'script' || tag === 'style') {
    const k = src.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
    const obsah = src.slice(re.lastIndex, k < 0 ? src.length : k);
    out.push(tag === 'script' && /application\/ld\+json/.test(atr) ? ldPreklad(obsah) : obsah);
    re.lastIndex = kon = k < 0 ? src.length : k;
    continue;
  }
  if (!VOID.has(tag) && !/\/\s*$/.test(atr)) stack.push({ tag, noi18n });
}
if (kon !== src.length) throw new Error('rozbor HTML neskončil na konci stránky');
// údaje pre Google: názvy služieb a katalógu v angličtine, ostatné ostáva
function ldPreklad(json) {
  return json.replace(/("name": ")([^"]+)(")/g, (mm, x, v, y) => { const t = map[norm(v)]; return typeof t === 'string' ? x + t.replace(/"/g, '\\"').replace(new RegExp(NB, 'g'), ' ') + y : mm; });
}

let html = out.join('');
// hlavička anglickej stránky: jazyk, zdroj pre i18n.js (prepínač jazyka vedie späť na slovenskú stránku),
// vlastná kanonická adresa a og:url, locale (hlavný en_GB, druhý jazyk sk_SK)
html = html.replace(/<html lang="sk"/, '<html lang="en" data-zdroj="en"')
  .replace(/(<link rel="canonical" href=")([^"]+)(")/, (mm, x, u, y) => x + u + 'en/' + y)
  .replace(/(<meta property="og:url" content=")([^"]+)(")/, (mm, x, u, y) => x + u + 'en/' + y)
  .replace(/(<meta property="og:locale" content=")sk_SK(")/, '$1en_GB$2')
  .replace(/(<meta property="og:locale:alternate" content=")en_GB(")/, '$1sk_SK$2');
// relatívne cesty o priečinok vyššie (súbory webu sú v koreni, stránka v en/)
html = html.replace(/(["'(\s,])assets\//g, '$1../assets/').replace(/href="karta\//g, 'href="../karta/')
  .replace(/^<!DOCTYPE html>\n/i, '<!DOCTYPE html>\n<!-- Vygenerované zo slovenskej index.html a assets/i18n/en.json (source/tools/en-stranka.mjs). Needitovať, pri nasadení sa vytvorí nanovo. -->\n');

const ciel = path.join(SITE, 'en', 'index.html');
if (CHECK) {
  const stary = fs.existsSync(ciel) ? fs.readFileSync(ciel, 'utf8') : '';
  console.log(stary === html ? 'en/index.html je aktuálna' : 'en/index.html nie je aktuálna (node source/tools/en-stranka.mjs)');
  process.exit(stary === html ? 0 : 1);
}
fs.mkdirSync(path.dirname(ciel), { recursive: true });
fs.writeFileSync(ciel, html);
const zvysok = [...new Set(bez)];
console.log(`en/index.html: ${preklad} prekladov, bez prekladu ${zvysok.length}${zvysok.length ? ': ' + zvysok.slice(0, 12).join(' | ') : ''}`);
