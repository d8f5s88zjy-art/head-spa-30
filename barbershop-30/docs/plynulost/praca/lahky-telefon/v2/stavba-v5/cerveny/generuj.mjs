// Červený tím – zostaví sadu R (sada-R.jsonl) zo všetkých tried R01–R18.
// Použitie: node generuj.mjs [--strom <cesta k barbershop-30>] [--vystup <súbor.jsonl>] [--tichy]
// Deterministické: rovnaké vstupy (index.html, assets/i18n) → bajtovo rovnaký výstup.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JAZYKY, STROM, nacitajStranku, norm } from './stranka.mjs';
import { LEX, POJMY } from './jazyky.mjs';
import { TRIEDY, ocakavanie, forma } from './triedy.mjs';

const TU = dirname(fileURLToPath(import.meta.url));
const arg = (meno, pred) => { const i = process.argv.indexOf(meno); return i > 0 ? process.argv[i + 1] : pred; };
const strom = arg('--strom', STROM);
const vystup = arg('--vystup', join(TU, 'sada-R.jsonl'));
const tichy = process.argv.includes('--tichy');

export function generuj(stromCesta = STROM) {
  const st = nacitajStranku(stromCesta);
  const chyby = [];
  // 1. formy s názvom zo stránky musia presne sedieť s assets/i18n (texty stránky sú jediný zdroj)
  for (const L of JAZYKY) for (const [k, fs] of Object.entries(LEX[L].s)) {
    if (!POJMY[k]) chyby.push(`${L}: neznámy pojem ${k}`);
    for (const f of fs.map(forma)) if (f.page) {
      const ocak = st.riadky[POJMY[k].row]?.nazvy[L];
      if (f.b !== ocak) chyby.push(`${L}/${k}: forma „${f.b}“ ≠ názov na stránke „${ocak}“`);
    }
    if (POJMY[k].row && !fs.map(forma).some((f) => f.page)) chyby.push(`${L}/${k}: chýba forma s názvom zo stránky`);
  }
  for (const k of Object.keys(POJMY)) if (POJMY[k].row && !st.riadky[POJMY[k].row]) chyby.push(`riadok ${POJMY[k].row} nie je v cenníku`);
  if (chyby.length) throw new Error(`Kontrola jazykových dát zlyhala:\n${chyby.join('\n')}`);

  // 2. triedy (R10 a R13 stavajú na základoch z R01, R03, R05, R07, R16)
  const surove = new Map();
  const zakladneTriedy = new Set(['R01', 'R03', 'R05', 'R07', 'R16']);
  for (const [id, , fn] of TRIEDY) {
    if (id === 'R10' || id === 'R13') continue;
    surove.set(id, JAZYKY.flatMap((L) => fn(L, st)));
  }
  const zaklady = [...surove.entries()].filter(([id]) => zakladneTriedy.has(id)).flatMap(([, v]) => v);
  for (const [id, , fn] of TRIEDY) if (id === 'R10' || id === 'R13') surove.set(id, JAZYKY.flatMap((L) => fn(L, zaklady)));

  // 3. očakávania, identifikátory, odstránenie duplicít
  const zaznamy = [];
  const videne = new Map();
  const konflikty = [];
  let duplicity = 0;
  for (const [id] of TRIEDY) {
    const pocty = {};
    for (const it of surove.get(id)) {
      if (!it.q || !it.q.trim()) throw new Error(`${id}/${it.L}: prázdna otázka`);
      if ([...it.q].length > 200) throw new Error(`${id}/${it.L}: otázka nad 200 znakov: ${it.q}`);
      const z = ocakavanie(st, it.L, it.q, it.o);
      const kluc = `${it.L}|${norm(it.q)}`;
      const podpis = JSON.stringify([z.skupiny_ok, z.zvyraznit_smie, z.zvyraznit_spravne, z.zakazane, z.musi]);
      if (videne.has(kluc)) {
        const pred = videne.get(kluc);
        if (pred.podpis !== podpis) konflikty.push({ otazka: it.q, jazyk: it.L, prva: pred.id, druha: id, a: pred.podpis, b: podpis });
        duplicity++;
        continue;
      }
      pocty[it.L] = (pocty[it.L] || 0) + 1;
      const rid = `${id}-${it.L}-${String(pocty[it.L]).padStart(3, '0')}`;
      videne.set(kluc, { id: rid, podpis });
      zaznamy.push({ id: rid, trieda: id, ...z });
    }
  }
  // 4. mená tém overené proti `id` v assets/recepcia/sk.json (iba polia id)
  const temy = new Set(zaznamy.map((z) => z.tema).filter(Boolean));
  const nezname = st.idTem ? [...temy].filter((t) => !st.idTem.nevieme.includes(t)) : [];
  return { st, zaznamy, konflikty, duplicity, temy: [...temy].sort(), nezname, idTemOverene: !!st.idTem };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { zaznamy, konflikty, duplicity, temy, nezname, idTemOverene } = generuj(strom);
  const text = zaznamy.map((z) => JSON.stringify(z)).join('\n') + '\n';
  writeFileSync(vystup, text);
  const sha = createHash('sha256').update(text).digest('hex');
  if (!tichy) {
    const tab = {};
    for (const z of zaznamy) { tab[z.trieda] ??= {}; tab[z.trieda][z.jazyk] = (tab[z.trieda][z.jazyk] || 0) + 1; }
    console.log(['trieda', ...JAZYKY, 'spolu'].join('\t'));
    for (const [id] of TRIEDY) {
      const r = tab[id] || {};
      console.log([id, ...JAZYKY.map((L) => r[L] || 0), JAZYKY.reduce((s, L) => s + (r[L] || 0), 0)].join('\t'));
    }
    const pj = JAZYKY.map((L) => zaznamy.filter((z) => z.jazyk === L).length);
    console.log(['spolu', ...pj, zaznamy.length].join('\t'));
    const ocak = {};
    for (const z of zaznamy) ocak[z.ocakava] = (ocak[z.ocakava] || 0) + 1;
    console.log('očakávanie:', JSON.stringify(ocak));
    console.log('so zvýraznením dovoleným (P7 b):', zaznamy.filter((z) => z.zvyraznit_smie.length).length,
      '| so zákazom cenníka bez odovzdania:', zaznamy.filter((z) => z.zakazane.includes('cennik-bez-odovzdania')).length,
      '| adresa povinná:', zaznamy.filter((z) => z.musi.includes('adresa')).length);
    console.log('témy nevieme:', temy.join(', '), idTemOverene ? `| neznáme v recepcia/sk.json: ${nezname.length ? nezname.join(', ') : 'žiadne'}` : '| (id tém neoverené)');
    console.log(`duplicity odstránené: ${duplicity}, konflikty očakávaní: ${konflikty.length}`);
    for (const k of konflikty.slice(0, 20)) console.log('  KONFLIKT', JSON.stringify(k));
    console.log(`zapísané: ${vystup} (${Buffer.byteLength(text)} B, sha256 ${sha})`);
  }
  if (konflikty.length || nezname.length) process.exitCode = 1;
}
