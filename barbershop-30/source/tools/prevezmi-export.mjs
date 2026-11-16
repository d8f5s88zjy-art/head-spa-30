#!/usr/bin/env node
// Prevzatie exportu zo správy webu na www.barbershop30.sk (Správa → Stiahnuť export) späť do repozitára.
// Export je ZIP so súbormi v tvare repozitára, ktoré majiteľ v správe zmenil (texty, cenník, tím, kontakt, odpovede
// asistenta, nové fotky), so zoznamom zmien ZMENY.json a s verziou balíka BALIK.txt.
//
//   node source/tools/prevezmi-export.mjs <export.zip> [--do=<koreň pracovného stromu>] [--bez-testov]
//
// 1. overí commit balíka (BALIK.txt) v tomto repozitári a každú cestu proti pevnej tabuľke správy (Mapa) – nič iné sa neprijme,
// 2. súbory rozbalí do pracovného stromu; keď sa súbor v repozitári od balíka medzitým zmenil, zlúči ho trojcestne
//    (git merge-file proti verzii z commitu balíka) a pri konflikte skončí s chybou a nechá súbor <meno>.export na ručné zlúčenie,
// 3. pripomenie CLAUDE.md pri zmene hodín (na hostingu nie je), vytvorí en/index.html nanovo a spustí otazky.mjs --kontrola,
//    i18n-test.mjs, en-stranka.mjs --check a admin-test.mjs (bez nich s --bez-testov).
// Nový balík (balik-domena.sh) sa stavia vždy až po prevzatí exportu, aby úpravy majiteľa nahratím balíka nezanikli.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = path.resolve(SITE, '..');
const args = process.argv.slice(2);
const zip = args.find((a) => !a.startsWith('--'));
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DO = path.resolve(opt.do || R);
if (!zip || !fs.existsSync(zip)) { console.error('použitie: node source/tools/prevezmi-export.mjs <export.zip> [--do=<koreň pracovného stromu>] [--bez-testov]'); process.exit(2); }
const beh = (cmd, a, o = {}) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...o });
const koniec = (t) => { console.error('CHYBA ' + t); process.exit(1); };

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'b30-export-'));
try {
  // zoznam súborov ZIP-u ešte pred rozbalením: žiadna cesta von z priečinka
  const zoznam = beh('unzip', ['-Z1', zip]);
  if (zoznam.status !== 0) koniec('súbor nie je ZIP: ' + zoznam.stderr.trim());
  const cesty = zoznam.stdout.split('\n').filter(Boolean);
  for (const c of cesty) if (c.startsWith('/') || c.includes('..') || c.includes('\\') || !/^[A-Za-z0-9._/-]+$/.test(c)) koniec('podozrivá cesta v exporte: ' + c);
  if (beh('unzip', ['-q', '-o', zip, '-d', T]).status !== 0) koniec('export sa nedá rozbaliť');
  if (!cesty.includes('BALIK.txt')) koniec('v exporte chýba BALIK.txt');
  const balik = fs.readFileSync(path.join(T, 'BALIK.txt'), 'utf8');
  const commit = ((balik.match(/^commit: ([0-9a-f]{40})(-upravene)?$/m) || [])[1]) || '';
  if (!commit) koniec('BALIK.txt nemá commit balíka');
  if (beh('git', ['-C', R, 'cat-file', '-e', commit + '^{commit}']).status !== 0) koniec(`commit balíka ${commit.slice(0, 8)} v tomto repozitári nie je`);
  console.log(`export z balíka ${commit.slice(0, 8)}${/-upravene$/m.test(balik) ? ' (balík bol postavený z upraveného stromu)' : ''}, ${cesty.length - 2} súborov`);

  // povolené cesty: pevná tabuľka správy a vzor novej fotky (ten istý kód ako na hostingu)
  const php = beh('php', ['-r', 'define("B30S", 1); require $argv[1]; echo json_encode(array_keys(array_filter(Mapa::tabulka(), fn($z) => $z[1] !== "citanie")));', path.join(R, 'barbershop-sprava', 'jadro', 'Mapa.php')]);
  if (php.status !== 0) koniec('tabuľka ciest sa nedá načítať (php, barbershop-sprava/jadro/Mapa.php)');
  const tabulka = new Set(JSON.parse(php.stdout));
  const fotka = /^barbershop-30\/assets\/img\/[a-z0-9][a-z0-9-]{0,80}-\d{3,4}\.(?:webp|jpg)$/;

  let zmenene = 0, nove = 0, rovnake = 0, konflikty = [];
  for (const c of cesty) {
    if (c === 'BALIK.txt' || c === 'ZMENY.json' || c.endsWith('/')) continue;
    const zdroj = path.join(T, c), ciel = path.join(DO, c);
    if (fotka.test(c)) {
      const b = fs.readFileSync(zdroj);
      if (!(b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') && !(b[0] === 0xff && b[1] === 0xd8)) koniec('súbor nie je fotka WebP ani JPEG: ' + c);
      if (fs.existsSync(ciel)) { if (!fs.readFileSync(ciel).equals(b)) koniec('fotka s týmto menom už v repozitári je a líši sa: ' + c); rovnake++; continue; }
      fs.mkdirSync(path.dirname(ciel), { recursive: true }); fs.copyFileSync(zdroj, ciel); nove++;
      continue;
    }
    if (!tabulka.has(c)) koniec('súbor nie je v zozname súborov, ktoré správa mení: ' + c);
    const novy = fs.readFileSync(zdroj, 'utf8');
    const teraz = fs.existsSync(ciel) ? fs.readFileSync(ciel, 'utf8') : null;
    if (teraz === novy) { rovnake++; continue; }
    const z = beh('git', ['-C', R, 'show', `${commit}:${c}`]);
    const zaklad = z.status === 0 ? z.stdout : null;
    if (teraz === null || zaklad === null || teraz === zaklad) { fs.mkdirSync(path.dirname(ciel), { recursive: true }); fs.writeFileSync(ciel, novy); zmenene++; continue; }
    // repozitár sa od balíka posunul: trojcestné zlúčenie (naša verzia, verzia balíka, verzia z exportu)
    const a = path.join(T, '_nase'), b = path.join(T, '_zaklad');
    fs.writeFileSync(a, teraz); fs.writeFileSync(b, zaklad);
    const m = beh('git', ['merge-file', '-p', a, b, zdroj]);
    if (m.status === 0) { fs.writeFileSync(ciel, m.stdout); zmenene++; console.log(`zlúčené s novšou verziou v repozitári: ${c}`); }
    else { fs.writeFileSync(ciel + '.export', novy); konflikty.push(c); }
  }
  console.log(`prevzaté: ${zmenene} zmenených súborov, ${nove} nových fotiek, ${rovnake} bez zmeny`);
  if (fs.existsSync(path.join(T, 'ZMENY.json'))) {
    const zm = JSON.parse(fs.readFileSync(path.join(T, 'ZMENY.json'), 'utf8')).filter((x) => x.stav === 'hotove');
    for (const x of zm.slice(-12)) console.log(`  ${String(x.cas).slice(0, 16)} ${x.typ}: ${(x.zmeny || []).slice(0, 4).join('; ')}`);
  }
  if (konflikty.length) koniec(`tieto súbory sa nedali zlúčiť s novšou verziou v repozitári, verzia z exportu je vedľa nich s príponou .export: ${konflikty.join(', ')}`);
  if (cesty.includes('barbershop-30/assets/app.js') || cesty.includes('asistent/lib/jadro.php')) console.log('POZOR: zmenil sa kontakt alebo hodiny v kóde. CLAUDE.md (pravidlo o hodinách pre asistenta) na hostingu nie je – uprav ho ručne podľa barbershop-30/assets/app.js (HOURS).');

  // anglická stránka z novej slovenskej a kontroly
  const b30 = path.join(DO, 'barbershop-30');
  const krok = (popis, a) => { const r = beh('node', a, { cwd: b30, stdio: 'inherit' }); if (r.status !== 0) koniec(`${popis} zlyhalo`); };
  krok('en-stranka.mjs', ['source/tools/en-stranka.mjs']);
  if (!opt['bez-testov']) {
    krok('otazky.mjs --kontrola', ['source/tools/otazky.mjs', '--kontrola']);
    krok('i18n-test.mjs', ['source/tools/i18n-test.mjs']);
    krok('en-stranka.mjs --check', ['source/tools/en-stranka.mjs', '--check']);
    krok('admin-test.mjs', ['source/tools/admin-test.mjs']);
  }
  console.log('HOTOVO: export je v pracovnom strome. Pozri git diff, commitni a až potom stavaj nový balík (balik-domena.sh).');
} finally { fs.rmSync(T, { recursive: true, force: true }); }
