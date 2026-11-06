/*
 * Zhoda stránky Časté otázky (caste-otazky.html) s overenými odpoveďami asistenta (asistent/znalosti/richtarik-otazky.json).
 * Každá otázka na stránke musí byť v databáze asistenta a jej odpoveď musí byť rovnaká (100 %), aby web a asistent
 * nehovorili dve rôzne veci. Porovnáva sa po úprave medzier (aj nezlomiteľných) a s adresami
 * https://www.stavebninyrichtarik.sk/… skrátenými na cestu (sluzby.html), lebo stránka ich môže mať ako odkazy.
 * Otázky a odpovede stránky berie z FAQPage v JSON-LD; bez neho z <details><summary>otázka</summary>odpoveď</details>.
 * Použitie: node caste.mjs <priečinok stavebniny-richtarik>   (bez caste-otazky.html v strome len oznámi a skončí 0)
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const R = path.resolve(process.argv[2] || '.');
const STRANKA = path.join(R, 'caste-otazky.html');
if (!existsSync(STRANKA)) { console.log('caste-otazky.html v strome nie je (pribudne s textami webu), nie je čo porovnať'); process.exit(0); }
const zdroj = JSON.parse(readFileSync(path.join(R, 'asistent/znalosti/richtarik-otazky.json'), 'utf8'));
const html = readFileSync(STRANKA, 'utf8');

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', hellip: '…' };
const odEnt = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1] === 'x' || e[1] === 'X' ? 2 : 1), e[1] === 'x' || e[1] === 'X' ? 16 : 10)) : (ENT[e] ?? m));
const bezZnaciek = (s) => odEnt(s.replace(/<br\s*\/?>|<\/(p|li|div)>/gi, '\n').replace(/<li[^>]*>/gi, '\n- ').replace(/<[^>]+>/g, ''));
const norm = (s) => s.replace(/[  ]/g, ' ').replace(/https:\/\/www\.stavebninyrichtarik\.sk\//g, '')
  .replace(/^\s*[-•]\s*/gm, '- ').replace(/\s+/g, ' ').trim();

let pary = [];
for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
  let j; try { j = JSON.parse(m[1]); } catch (e) { console.log('FAIL JSON-LD sa nedá prečítať'); process.exit(1); }
  for (const x of [].concat(j['@graph'] || j)) if (x && x['@type'] === 'FAQPage') {
    for (const q of x.mainEntity || []) pary.push([q.name, q.acceptedAnswer && q.acceptedAnswer.text || '', 'JSON-LD']);
  }
}
if (!pary.length) for (const m of html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)) pary.push([bezZnaciek(m[1]), bezZnaciek(m[2]), 'details']);

const podlaOtazky = new Map(zdroj.otazky.map((o) => [norm(o.q), o]));
let ok = 0; const zle = [];
for (const [q, a, odkial] of pary) {
  const o = podlaOtazky.get(norm(q));
  if (!o) { zle.push(`otázka nie je v databáze asistenta: „${norm(q)}“ (${odkial})`); continue; }
  if (norm(a) === norm(o.a)) ok++;
  else zle.push(`${o.id}: odpoveď sa líši (${odkial})\n    stránka:  ${norm(a)}\n    asistent: ${norm(o.a)}`);
}
for (const z of zle) console.log('FAIL', z);
console.log(`\notázok na stránke ${pary.length}, zhodných ${ok} (${pary.length ? Math.round(100 * ok / pary.length) : 0} %)`);
process.exit(pary.length && !zle.length ? 0 : 1);
