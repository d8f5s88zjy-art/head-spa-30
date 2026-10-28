#!/usr/bin/env node
// Časté otázky Barbera: kontrola a kópia pre web.
//   node source/tools/otazky.mjs            skontroluje ../asistent/znalosti/barbershop-otazky.json a zapíše kópiu
//                                           pre prehliadač (kopiaPreWeb() z assets/asistent-otazky.js):
//                                           assets/asistent-otazky.json (otázky a odpovede bez iných znení) a
//                                           assets/asistent-otazky-kmene.json (kmene znení podľa id, na hľadanie)
//   node source/tools/otazky.mjs --kontrola len skontroluje, aj či je kópia aktuálna (testy)
// Kontroly: aspoň 250 otázok, jedinečné id, známe témy, žiadne dlhé pomlčky; id tim-meno a volno-meno v téme tim
// len pre odpovede o členoch tímu (admin ich pri zmene tímu zmaže a vytvorí znova); v odpovediach len ceny a dĺžky
// z cenníka webu (index.html), len overený telefón, odkazy a hodiny, bez „24/7“; odpoveď o termíne má telefón
// a vetu „telefón vždy zdvihneme“; každá otázka aj jej iné znenie nájde samu seba; hľadanie na serveri
// (asistent/lib/otazky.php) zoradí rovnako ako v prehliadači (assets/asistent-otazky.js), ak je php; kópia pre web
// zoradí rovnako ako zdroj a bez kmeňov (kým sa sťahujú) nájde každá otázka samu seba.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASI = path.resolve(SITE, '..', 'asistent');
const ZDROJ = path.join(ASI, 'znalosti', 'barbershop-otazky.json');
const KOPIA = path.join(SITE, 'assets', 'asistent-otazky.json'), KOPIA_KMENE = path.join(SITE, 'assets', 'asistent-otazky-kmene.json');
const kontrola = process.argv.includes('--kontrola');
const { priprav, hladaj, kopiaPreWeb } = await import(path.join(SITE, 'assets', 'asistent-otazky.js'));

let zle = 0;
const chyba = (m) => { zle++; console.log('FAIL ' + m); };
const data = JSON.parse(fs.readFileSync(ZDROJ, 'utf8'));
const ot = data.otazky;

// cenník webu: ceny a dĺžky (jediný zdroj čísel v odpovediach)
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const ceny = new Set([...html.matchAll(/class="price-amount">([^<]+)</g)].map((m) => m[1].replace(/\s+/g, ' ').trim()));
const dlzky = new Set([...html.matchAll(/class="price-time">(\d+) min</g)].map((m) => m[1]));
const TEL = new Set(['0951 267 203', '+421 951 267 203']);
// členovia tímu z webu (ako slug v admin.js): len oni majú odpovede tim-meno a volno-meno
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const CLENOVIA = new Set([...html.matchAll(/class="team-name">([^<]+)</g)].map((m) => slug(m[1])));
const ODKAZY = new Set(['https://www.barbershop30.sk/rezervacia', 'https://booqme.app/sk/rezervacia/barbershop30',
  'https://www.google.com/maps/dir/?api=1&destination=Mostn%C3%A1+30%2C+949+01+Nitra', 'https://www.google.com/maps?cid=18132360254733427623',
  'https://www.instagram.com/barbershop30_nitra/', 'https://www.facebook.com/barbershop30nitra/']);
// otváracie hodiny z app.js (rovnaké ako živý stav „otvorené“; admin ich mení v záložke Kontakt a hodiny)
const HOURS = fs.readFileSync(path.join(SITE, 'assets', 'app.js'), 'utf8').match(/const HOURS = \{([^}]*)\};/)[1];
const HODINY = new Set([...HOURS.matchAll(/\[(\d+), (\d+)\]/g)].flatMap((m) => [`${m[1]}:00`, `${m[2]}:00`]));

if (ot.length < 250) chyba(`otázok je ${ot.length}, treba aspoň 250`);
const ids = new Set();
for (const o of ot) {
  const kde = `${o.id}:`;
  if (ids.has(o.id)) chyba(`${kde} id dvakrát`); ids.add(o.id);
  if (!data.temy[o.t]) chyba(`${kde} neznáma téma ${o.t}`);
  if (!o.q || !o.a) chyba(`${kde} chýba otázka alebo odpoveď`);
  // odpovede o členoch tímu (tim-meno, volno-meno) admin pri každej zmene tímu zmaže a vytvorí znova (admin.js, timDoZnalosti)
  const clen = o.t === 'tim' && o.id.match(/^(?:tim|volno)-(.+)$/);
  if (clen && !CLENOVIA.has(clen[1])) chyba(`${kde} id ${o.id} je vyhradené pre odpovede o členoch tímu (${[...CLENOVIA].join(', ')}); admin ho pri zmene tímu zmaže, daj inú predponu`);
  const vsetko = [o.q, ...(o.v || []), o.a].join(' ');
  if (/[—–]/.test(vsetko)) chyba(`${kde} dlhá pomlčka`);
  if (/24\s*\/\s*7|nonstop/i.test(o.a)) chyba(`${kde} 24/7`);
  if (o.a.length > 480) chyba(`${kde} odpoveď je dlhá (${o.a.length} znakov)`);
  for (const m of o.a.matchAll(/(\d+(?:,\d+)?) €/g)) if (!ceny.has(`${m[1]} €`)) chyba(`${kde} cena ${m[1]} € nie je v cenníku`);
  for (const m of o.a.matchAll(/(\d+) (?:minút|min)\b/g)) if (!dlzky.has(m[1])) chyba(`${kde} dĺžka ${m[1]} minút nie je v cenníku`);
  for (const m of o.a.matchAll(/(?<!\d)(?:\+421|0)\s?\d{3}\s?\d{3}\s?\d{3}(?!\d)/g)) if (!TEL.has(m[0])) chyba(`${kde} neznámy telefón ${m[0]}`);
  for (const m of o.a.matchAll(/https?:\/\/[^\s]+[^\s.,;:!?)]/g)) if (!ODKAZY.has(m[0])) chyba(`${kde} neznámy odkaz ${m[0]}`);
  for (const m of o.a.matchAll(/\b\d{1,2}:\d{2}\b/g)) if (!HODINY.has(m[0])) chyba(`${kde} čas ${m[0]} nie je v otváracích hodinách`);
  if (o.tel && !(o.a.includes('0951 267 203') && o.a.includes('telefón vždy zdvihneme'))) chyba(`${kde} odpoveď o termíne bez telefónu a istoty`);
}

// každá otázka a každé jej znenie nájde samu seba
const db = priprav(data);
for (const o of ot) for (const z of [o.q, ...(o.v || [])]) {
  const h = hladaj(db, z, 1);
  if (!h[0] || h[0].o.id !== o.id) chyba(`${o.id}: „${z}“ nájde ${h[0] ? h[0].o.id : 'nič'}`);
}

// server a prehliadač zoradia rovnako (otázky, znenia a pár iných)
const SKUS = [...ot.flatMap((o) => [o.q, ...(o.v || [])]), 'kolko by ma stal strih pre syna', 'chcem si dat ostrihat bradu',
  'Má Adrián zajtra voľný termín?', 'mozem si dat pivo', 'kde zaparkujem auto', 'Do you cut kids hair?', 'Wie viel kostet ein Haarschnitt?',
  'Koľko stojí strih 10 cm?', 'otvarate v nedelu?', '', '???'];
let php = '';
try { php = execFileSync('php', ['-v'], { encoding: 'utf8' }); } catch (e) { console.log('pozor: php nie je, zhoda so serverom sa nekontroluje'); }
if (php) {
  const kod = `define('ASISTENT', 1); require ${JSON.stringify(path.join(ASI, 'lib', 'otazky.php'))};
    $db = otazky_db('barbershop'); $out = [];
    foreach (json_decode(stream_get_contents(STDIN), true) as $q) $out[] = array_map(fn($x) => $x['o']['id'] . ' ' . $x['skore'], otazky_hladaj($db, $q, 6));
    echo json_encode($out);`;
  const p = JSON.parse(execFileSync('php', ['-r', kod], { input: JSON.stringify(SKUS), encoding: 'utf8', maxBuffer: 1 << 26 }));
  let rozdiel = 0;
  SKUS.forEach((q, i) => {
    const j = hladaj(db, q, 6).map((x) => `${x.o.id} ${x.skore}`);
    const r = p[i].map((s) => s.replace(/ (\d+(?:\.\d+)?)$/, (_, n) => ` ${Number(n)}`));
    if (JSON.stringify(j) !== JSON.stringify(r)) { rozdiel++; if (rozdiel <= 5) chyba(`server a prehliadač sa líšia pri „${q}“: ${r.join(', ')} | ${j.join(', ')}`); }
  });
  if (rozdiel) chyba(`rozdielov spolu ${rozdiel} z ${SKUS.length}`);
  else console.log(`OK   server a prehliadač zoradia rovnako (${SKUS.length} otázok)`);
}

// kópia pre web (otázky + kmene znení vopred) hľadá rovnako ako zdroj: rovnaké otázky aj skóre
const web = kopiaPreWeb(data);
const min = JSON.stringify(web.otazky) + '\n', minKmene = JSON.stringify(web.kmene) + '\n';
const dbWeb = priprav(JSON.parse(min), JSON.parse(minKmene).k);
let inak = 0;
for (const q of SKUS) {
  const a = hladaj(db, q, 6).map((x) => `${x.o.id} ${x.skore}`).join(', '), b = hladaj(dbWeb, q, 6).map((x) => `${x.o.id} ${x.skore}`).join(', ');
  if (a !== b) { inak++; if (inak <= 5) chyba(`kópia pre web hľadá inak pri „${q}“: ${b} | zdroj ${a}`); }
}
if (!inak) console.log(`OK   kópia pre web zoradí rovnako ako zdroj (${SKUS.length} otázok)`);
// kým sa kmene sťahujú, okno hľadá len podľa otázok: aj tak nájde každá otázka samu seba
const dbBez = priprav(JSON.parse(min));
const bez = ot.filter((o) => { const h = hladaj(dbBez, o.q, 1); return !h[0] || h[0].o.id !== o.id; });
if (bez.length) chyba(`kópia bez kmeňov: ${bez.length} otázok nenájde samu seba (${bez.slice(0, 5).map((o) => o.id).join(', ')})`);
else console.log(`OK   kópia bez kmeňov: každá otázka nájde samu seba (${ot.length})`);
const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB, gzip ${(zlib.gzipSync(s, { level: 6 }).length / 1024).toFixed(1)} kB`;
console.log(`     kópia pre web: otázky ${kb(min)}; kmene ${kb(minKmene)}`);
if (kontrola) {
  for (const [f, t] of [[KOPIA, min], [KOPIA_KMENE, minKmene]]) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== t) chyba(`assets/${path.basename(f)} nie je aktuálna kópia (spusti node source/tools/otazky.mjs)`);
} else if (!zle) { fs.writeFileSync(KOPIA, min); fs.writeFileSync(KOPIA_KMENE, minKmene); }

console.log(zle ? `${zle} FAIL` : `všetko OK: ${ot.length} otázok, ${Object.keys(data.temy).length} tém, ceny ${[...ceny].join(' ')}`);
process.exit(zle ? 1 : 0);
