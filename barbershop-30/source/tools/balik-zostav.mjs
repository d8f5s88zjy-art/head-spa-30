#!/usr/bin/env node
// Časť stavby plného balíka pre www.barbershop30.sk (volá ju balik-domena.sh): verejné súbory webu zostaví tým istým
// kódom ako správa na hostingu (admin/zostav.js), zmenší CSS a z admin/index.html odvodí rozhranie úprav sprava/upravy/.
//   node source/tools/balik-zostav.mjs <priečinok balíka NAHRAT-NA-HOSTING>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zostav, bezKomentarovCss } from '../../admin/zostav.js';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VON = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(VON, 'assets'))) { console.error('použitie: node balik-zostav.mjs <priečinok balíka s assets/>'); process.exit(2); }
const ciel = JSON.parse(fs.readFileSync(path.join(SITE, 'source', 'domena', 'ciel.json'), 'utf8'));
const citaj = (c) => fs.readFileSync(path.join(SITE, c), 'utf8');
const zapis = (c, t) => { fs.mkdirSync(path.dirname(path.join(VON, c)), { recursive: true }); fs.writeFileSync(path.join(VON, c), t); };

// 1. verejné súbory = zostav(pôvodné súbory); dátum v sitemap.xml ostáva z repozitára
const zdroj = {};
for (const c of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'karta/index.html', 'assets/i18n/en.json']) zdroj['barbershop-30/' + c] = citaj(c);
const von = zostav(zdroj, ciel);
for (const [c, t] of Object.entries(von)) zapis(c, t);
// 2. CSS bez komentárov (ako zmensi.mjs pri nasadení)
let css = 0;
for (const x of fs.readdirSync(path.join(VON, 'assets')).filter((n) => n.endsWith('.css')).sort()) {
  const t = fs.readFileSync(path.join(VON, 'assets', x), 'utf8'), s = bezKomentarovCss(t);
  if (s !== null) { fs.writeFileSync(path.join(VON, 'assets', x), s); css++; }
}
// 3. rozhranie úprav na hostingu z admin/index.html: bez kľúča GitHub, ukladanie cez sprava/api.php, len vlastný pôvod
let h = citaj('admin/index.html');
const raz = (a, b) => { const n = typeof a === 'string' ? h.split(a).length - 1 : (h.match(new RegExp(a.source, a.flags.includes('g') ? a.flags : a.flags + 'g')) || []).length; if (n !== 1) throw new Error(`admin/index.html: čakám presne raz ${a} (je ${n}×)`); h = h.replace(a, b); };
raz('<html lang="sk">', '<html lang="sk" data-ulozisko="hosting">');
raz(/<!-- kľúč je v tomto prehliadači[^>]*-->\n<meta http-equiv="Content-Security-Policy" content="[^"]*">/, `<!-- správa na vlastnej doméne: stránka hovorí len s vlastným serverom (sprava/api.php), skripty a štýly len vlastné -->\n<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'none'">`);
raz('href="../karta/ikony/barbershop-192.png"', 'href="../../karta/ikony/barbershop-192.png"');
if (h.split('url(../assets/fonts/').length - 1 !== 3) throw new Error('admin/index.html: čakám tri písma v ../assets/fonts/');
h = h.split('url(../assets/fonts/').join('url(../../assets/fonts/');
raz('<a class="lnk" id="webLink" href="../" target="_blank" rel="noopener" hidden>Web</a>', '<a class="lnk" id="webLink" href="../../" target="_blank" rel="noopener" hidden>Web</a>');
// značka v hlavičke vedie späť do správy (ďalší odkaz by sa na telefóne do hlavičky nezmestil)
raz('<span class="brand">Barbershop 30<em>admin</em></span>', '<a class="brand" href="../" style="color:inherit;text-decoration:none" title="Späť do správy">Barbershop 30<em>správa</em></a>');
raz(/<section id="login" class="login">[\s\S]*?<\/section>/, `<section id="login" class="login">
    <h1>Úpravy webu</h1>
    <p class="lead">Tu zmeníš texty, cenník, tím a fotky webu Barbershop 30. Uloženie je na webe hneď.</p>
    <div class="msg" id="loginMsg" hidden></div>
    <div class="btns"><a class="btn quiet" href="../">Späť do správy</a></div>
  </section>`);
zapis('sprava/upravy/index.html', h);
for (const c of ['admin.js', 'ulozisko-hosting.js', 'zostav.js', 'lib/en-stranka-jadro.js', 'lib/zmensi-jadro.js']) zapis('sprava/upravy/' + c, citaj('admin/' + c));
zapis('sprava/assets/asistent-otazky.js', citaj('assets/asistent-otazky.js'));   // admin.js ho importuje z ../assets/
console.log(`zostavené: ${Object.keys(von).join(', ')}; CSS bez komentárov: ${css}; sprava/upravy/ pripravené`);
