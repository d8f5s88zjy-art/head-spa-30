// Červený tím – generátory tried R01–R18. Deterministické (vlastný PRNG so semienkom z mena triedy a jazyka).
// Každá otázka nesie kontext (pojmy služieb, osoba, dĺžka, téma nevieme …); očakávanie podľa P7 (c) z neho
// počíta funkcia `ocakavanie` – jediné miesto, kde sú pravidlá orákula.
import { JAZYKY, norm, prisneZvyraznenie } from './stranka.mjs';
import { POJMY, VSEOB, LEX } from './jazyky.mjs';

// ── PRNG a výber ──
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) {
  let a = hash(seed);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function vyber(r, arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(k, a.length));
}

// ── formy a šablóny ──
export function forma(str) {
  let s = str, page = false, plural = false;
  if (s[0] === '=') { page = true; s = s.slice(1); }
  if (s[0] === '+') { plural = true; s = s.slice(1); }
  const [n, a = n, b = n] = s.split('|');
  return { n, a, b, page, plural };
}
const formy = (L, k) => LEX[L].s[k].map(forma);
const lenHole = (tpl) => !/\{n\d?\}|\{a\d?\}/.test(tpl);
function vypln(tpl, m) {
  let s = tpl.replace(/\{([a-zA-Z]+\d?)\}/g, (_, k) => {
    if (!(k in m)) throw new Error(`šablóna ${tpl}: chýba ${k}`);
    return m[k];
  });
  s = s.replace(/\s+/g, ' ').replace(/\s+([?.,!…])/g, '$1').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function pojemVety(r, L, k, tpl) {
  const f = formy(L, k).filter((x) => !x.plural || lenHole(tpl));
  if (!f.length) return null;
  return pick(r, f);
}

// ── orákulum P7 (c) ──
const ZENY = new Set(['ona', 'dievca', 'myona']);
// Témy, pri ktorých je neznáma sama cena služby → žiadny riadok nie je významovo správny.
const VLASTNA = new Set(['damske', 'poukazky', 'romana-ceny', 'storno', 'vernost', 'cena-ina-sluzba', 'sviatky', 'produkty', 'parkovanie']);
const PORADIE = ['g-strih', 'g-brada', 'g-balicky', 'g-doplnky'];
const R = {
  panske: 'Pánsky strih', kombo: 'Pánsky strih a úprava brady', dlhe: 'Pánsky strih – dĺžka vlasov nad 10 cm',
  deti: 'Strih pre malých gentlemanov', brada: 'Úprava brady',
};

function semRiadky(k, o) {
  const dieta = o.osoba === 'dieta';
  const vek = o.vek;
  const maly = dieta && (vek == null || vek < 10);
  const hranica = dieta && vek === 10;
  const velky = dieta && vek > 10;
  switch (k) {
    case 'strih':
      if (maly) return [R.deti];
      if (hranica) return [R.deti, R.panske];
      if (velky) return [R.panske, R.dlhe];
      if (o.osoba === 'my') return [R.panske, R.dlhe, R.deti];
      if (o.dlzka === 'dlha') return [R.dlhe];
      if (o.dlzka === 'kratka') return [R.panske];
      return VSEOB.strih;
    case 'panske':
      if (maly) return [R.deti];
      if (hranica) return [R.deti, R.panske];
      if (velky) return [R.panske];
      if (o.osoba === 'my') return [R.panske, R.deti];
      if (o.dlzka === 'dlha') return [R.dlhe];
      if (o.dlzka === 'nejasna') return [R.panske, R.dlhe];
      return [R.panske];
    case 'dlhe':
      if (o.dlzka === 'kratka') return [];
      if (dieta) return [R.deti, R.dlhe];
      return [R.dlhe];
    case 'deti':
      if (velky) return [R.panske, R.dlhe];
      if (hranica) return [R.deti, R.panske];
      if (o.osoba === 'on' || o.osoba === 'ja') return [];
      return [R.deti];
    case 'kombo':
      if (dieta) return [];
      if (o.dlzka === 'dlha') return [R.kombo, R.dlhe, R.brada];
      return [R.kombo];
    default:
      return VSEOB[k] || [POJMY[k].row];
  }
}

export function ocakavanie(st, L, otazka, o) {
  const k = o.k || [];
  const zena = ZENY.has(o.osoba);
  const tema = o.tema || (zena ? 'damske' : null);
  // skupiny
  const g = new Set(k.map((x) => POJMY[x].g));
  const maStrih = k.some((x) => x === 'strih' || x === 'panske');
  const maBradu = k.some((x) => x === 'brada' || x === 'upravabrady');
  const inaBrada = k.some((x) => POJMY[x].g === 'g-brada' && x !== 'brada' && x !== 'upravabrady');
  if (maStrih && maBradu && !inaBrada) g.delete('g-brada'); // „strih a brada“ = riadok Pánsky strih a úprava brady v skupine Strih
  for (const x of o.skupinyPlus || []) g.add(x);
  const skupiny = PORADIE.filter((x) => g.has(x));
  // významovo správne riadky (zvýraznenie mimo nich je chyba podľa P7 c)
  let spravne;
  if (o.spravne) spravne = o.spravne.slice();
  else if (zena || (tema && VLASTNA.has(tema))) spravne = [];
  else {
    const s = new Set();
    for (const x of k) for (const r of semRiadky(x, o)) s.add(r);
    if (maStrih && maBradu && !o.osoba?.startsWith('diet')) s.add(R.kombo);
    for (const r of o.spravnePlus || []) s.add(r);
    spravne = [...s];
  }
  // dovolené zvýraznenie podľa P7 (b)
  const meniace = o.meniace ?? ((k.length + (o.neg?.length || 0)) > 1 || !!o.osoba || !!o.dlzka || !!tema || !!o.neg?.length);
  const smie = prisneZvyraznenie(st, otazka, meniace);
  for (const r of smie) {
    if (!spravne.includes(r)) throw new Error(`orákulum: dovolené zvýraznenie ${r} nie je významovo správne: ${L} „${otazka}“ ${JSON.stringify(o)}`);
  }
  const zakazane = ['veta-cena', 'veta-trvanie', 'zvyraznenie-nespravne'];
  if (tema || zena || o.nesluzba) zakazane.push('cennik-bez-odovzdania');
  if (o.adresa) zakazane.push('cennik', 'tema:tim');
  const musi = o.adresa === 'jadro' ? ['adresa', 'mapa'] : [];
  let ocakava = o.ocakava;
  if (!ocakava) {
    if (o.adresa === 'jadro') ocakava = 'adresa';
    else if (o.adresa === 'cesta') ocakava = 'adresa|odovzdanie';
    else if (o.nesluzba) ocakava = 'ina|odovzdanie';
    else if (tema) ocakava = skupiny.length ? 'skupina|odovzdanie' : 'odovzdanie';
    else ocakava = skupiny.length ? 'skupina' : 'skupina|odovzdanie';
  }
  const zdroj = new Set();
  for (const x of k) if (POJMY[x].row) zdroj.add(`index.html:${st.riadky[POJMY[x].row].riadok}`);
  for (const x of skupiny) zdroj.add(`index.html:${st.skupiny.find((s) => s.id === x).riadok}`);
  if (o.adresa) { zdroj.add(`index.html:${st.adresa.riadok}`); zdroj.add(`index.html:${st.mapa.riadok}`); }
  if (zena) zdroj.add(`index.html:${st.komu.riadok}`);
  const kontext = {};
  for (const key of ['osoba', 'vek', 'dlzka', 'den', 'mix', 'variant', 'typ', 'pozn', 'polozka']) if (o[key] != null) kontext[key] = o[key];
  if (k.length) kontext.pojmy = k;
  if (o.neg?.length) kontext.zapor = o.neg;
  return {
    jazyk: L, otazka, skupiny_ok: skupiny, zvyraznit_smie: smie, zvyraznit_spravne: spravne.sort(),
    zakazane, musi, ocakava, tema: tema && tema !== 'hodiny' ? tema : null, kontext, zdroj: [...zdroj].sort(),
  };
}

// ── spoločné špecifikácie ručných otázok (texty sú v jazyky.mjs pod rovnakým kľúčom) ──
export const NEVIEME_SPEC = {
  dam1: { tema: 'damske', k: ['strih'] }, dam2: { tema: 'damske', k: ['strih'] }, dam3: { tema: 'damske', k: ['strih'] },
  dam4: { tema: 'damske', k: ['upravaobocia'] }, dam5: { tema: 'damske', k: ['strih'], osoba: 'ona', dlzka: 'dlha' },
  plat1: { tema: 'platba', k: [] }, plat2: { tema: 'platba', k: ['strih'] }, plat3: { tema: 'platba', k: ['strih'] },
  plat4: { tema: 'platba', k: [] }, plat5: { tema: 'platba', k: ['balicek'] },
  pouk1: { tema: 'poukazky', k: [] }, pouk2: { tema: 'poukazky', k: ['strih'] }, pouk3: { tema: 'poukazky', k: ['ultra'] },
  pouk4: { tema: 'poukazky', k: ['upravabrady'] }, pouk5: { tema: 'poukazky', k: ['strih', 'brada'], osoba: 'on' },
  park1: { tema: 'parkovanie', k: [] }, park2: { tema: 'parkovanie', k: ['strih'] },
  prod1: { tema: 'produkty', k: [] }, prod2: { tema: 'produkty', k: [] }, prod3: { tema: 'produkty', k: [] },
  rom1: { tema: 'romana-ceny', k: [] }, rom2: { tema: 'romana-ceny', k: [] }, rom3: { tema: 'romana-ceny', k: [] },
  rom4: { tema: 'romana-ceny', k: ['strih'] },
  sto1: { tema: 'storno', k: [] }, sto2: { tema: 'storno', k: ['strih'] },
  ver1: { tema: 'vernost', k: [] }, ver2: { tema: 'vernost', k: ['strih'] }, ver3: { tema: 'vernost', k: ['upravabrady'] },
  ver4: { tema: 'vernost', k: ['balicek'] },
  zdr1: { tema: 'zdravie', k: ['holenie'] }, zdr2: { tema: 'zdravie', k: ['farbbrady'] },
  ina1: { tema: 'cena-ina-sluzba', k: [] }, ina2: { tema: 'cena-ina-sluzba', k: [] }, ina3: { tema: 'cena-ina-sluzba', k: [] },
  ina4: { tema: 'cena-ina-sluzba', k: [] }, ina5: { tema: 'cena-ina-sluzba', k: [] }, ina6: { tema: 'cena-ina-sluzba', k: [] },
  svi1: { tema: 'sviatky', k: ['strih'] }, svi2: { tema: 'sviatky', k: ['strih'] },
  bez1: { tema: 'bez-objednania', k: ['strih'] }, bez2: { tema: 'bez-objednania', k: ['brada'] },
  vek1: { tema: 'vek', k: ['deti'] },
};
export const TRV_NES_SPEC = {
  t1: { polozka: 'rezervacia' }, t2: {}, t3: {}, t4: { polozka: 'hodiny' }, t5: { polozka: 'odkedy' },
  t6: { tema: 'romana-ceny' }, t7: { tema: 'romana-ceny' }, t8: { tema: 'poukazky' }, t9: { tema: 'storno' },
  t10: { tema: 'cena-ina-sluzba' }, t11: { tema: 'parkovanie' }, t12: { tema: 'storno' }, t13: {}, t14: {},
};
export const PASCE_SPEC = {
  p1: { k: [], tema: 'produkty' }, p2: { k: ['brada'] }, p3: { k: ['strih'], spravnePlus: [R.kombo] },
  p4: { k: ['hlava', 'strih'] }, p5: { k: ['farbobocia', 'farbbrady'] }, p6: { k: ['strih'], osoba: 'on' },
  p7: { k: ['brada'], dlzka: 'bradaDlha' }, p8: { k: [], spravne: [R.brada, 'Úprava obočia', R.panske], pozn: 'nejednoznačné' },
  p9: { k: ['plet', 'strih'] }, p10: { k: ['hottowel'], spravnePlus: [R.brada] }, p11: { k: [], tema: 'produkty' },
  p12: { k: [], tema: 'vernost' }, p13: { k: ['depil'] }, p14: { k: ['upravaobocia'], tema: 'platba' },
};
export const SKUPINY_VOLNE_SPEC = {
  v1: ['g-balicky'], v2: ['g-doplnky'], v3: ['g-brada'], v4: ['g-strih'], v5: [], v6: [], v7: [], v8: ['g-brada'],
};

// ── triedy ── každá vracia [{ L, q, o }]
const VEKY = [6, 8, 10, 12, 15];
const OSOBY_POJMY = {
  ja: ['strih', 'panske', 'brada', 'upravabrady', 'holenie', 'hottowel', 'upravaobocia', 'balicek', 'plet', 'hlava', 'ornament', 'depil', 'farbbrady', 'kombo'],
  on: ['strih', 'panske', 'brada', 'upravabrady', 'holenie', 'hottowel', 'upravaobocia', 'balicek', 'plet', 'hlava', 'ornament', 'depil', 'farbbrady', 'kombo'],
  my: ['strih', 'panske', 'brada', 'upravabrady', 'holenie', 'balicek', 'kombo'],
  ona: ['strih', 'panske', 'upravaobocia', 'farbobocia', 'plet', 'depil', 'balicek'],
  myona: ['strih', 'panske', 'upravaobocia', 'plet', 'balicek'],
  dieta: ['strih', 'panske', 'ornament', 'hlava', 'deti'],
  dievca: ['strih', 'ornament', 'deti'],
};

function R01(L) {
  const r = rng(`R01-${L}`), X = LEX[L], out = [];
  const kand = [];
  for (const [typ, fr] of Object.entries(X.osoby)) {
    for (const p of fr) {
      const veky = /\{N\}/.test(p) ? VEKY : [null];
      for (const vek of veky) for (const k of OSOBY_POJMY[typ]) kand.push({ typ, p: vek == null ? p : p.replace('{N}', vek), vek: vek ?? undefined, k });
    }
  }
  for (const c of vyber(r, kand, 80)) {
    const tpl = pick(r, X.osobaSab);
    const f = pojemVety(r, L, c.k, tpl); if (!f) continue;
    const q = vypln(tpl, { n: f.n, a: f.a, b: f.b, P: c.p });
    out.push({ L, q, o: { k: [c.k], osoba: c.typ, vek: c.vek }, formy: [f.n, f.a, f.b] });
  }
  return out;
}

function R02(L) {
  const r = rng(`R02-${L}`), X = LEX[L], out = [];
  const kand = [];
  for (const d of ['dlha', 'kratka', 'nejasna']) for (const k of ['strih', 'panske', 'dlhe', 'kombo']) {
    if (k === 'dlhe' && d === 'kratka') continue;
    for (const l of X.dlzka[d]) kand.push({ d, k, l });
  }
  for (const d of ['bradaDlha', 'bradaKratka']) for (const k of ['brada', 'upravabrady']) for (const l of X.dlzka[d]) kand.push({ d, k, l });
  for (const c of vyber(r, kand, 36)) {
    const tpl = pick(r, X.dlzkaSab);
    const f = pojemVety(r, L, c.k, tpl); if (!f) continue;
    const q = vypln(tpl, { n: f.n, a: f.a, b: f.b, L: c.l });
    out.push({ L, q, o: { k: [c.k], dlzka: c.d, typ: tpl === X.dlzkaSab[2] ? 'trvanie' : 'cena' }, formy: [f.n, f.a, f.b] });
  }
  // žena a dĺžka vlasov
  for (const l of vyber(r, X.dlzka.dlha.concat(X.dlzka.kratka), 4)) {
    const tpl = X.dlzkaSab[0], k = pick(r, ['strih', 'panske']);
    const f = pojemVety(r, L, k, tpl);
    out.push({ L, q: `${X.zena} ${vypln(tpl, { n: f.n, a: f.a, b: f.b, L: l })}`, o: { k: [k], osoba: 'ona', dlzka: X.dlzka.dlha.includes(l) ? 'dlha' : 'kratka' } });
  }
  return out;
}

const C3 = ['strih', 'panske', 'kombo', 'dlhe', 'hlava', 'brada', 'upravabrady', 'holenie', 'hottowel', 'farbbrady', 'balicek', 'balicek1', 'ultra', 'plet', 'obocie', 'upravaobocia', 'farbobocia', 'depil', 'ornament'];
function dvojicaOk(a, b) {
  if (POJMY[a].rod === POJMY[b].rod) return false;
  const sb = (x) => ['strih', 'brada'].includes(POJMY[x].rod);
  if ((a === 'kombo' && sb(b)) || (b === 'kombo' && sb(a))) return false;
  return true;
}
function R03(L, st) {
  const r = rng(`R03-${L}`), X = LEX[L], out = [];
  const dvojice = [];
  for (let i = 0; i < C3.length; i++) for (let j = 0; j < C3.length; j++) if (i !== j && dvojicaOk(C3[i], C3[j])) dvojice.push([C3[i], C3[j]]);
  const trojice = [];
  for (let n = 0; n < 400; n++) {
    const t = vyber(r, C3, 3);
    if (dvojicaOk(t[0], t[1]) && dvojicaOk(t[0], t[2]) && dvojicaOk(t[1], t[2])) trojice.push(t);
  }
  const pridaj = (ks, tpl, typ) => {
    const fs = ks.map((k) => formy(L, k).filter((x) => !x.plural));
    if (fs.some((x) => !x.length)) return;
    const ch = fs.map((x) => pick(r, x));
    const m = {};
    ch.forEach((f, i) => { m[`n${i + 1}`] = f.n; m[`a${i + 1}`] = f.a; m[`b${i + 1}`] = f.b; });
    const q = vypln(tpl, m);
    const nahodny = prisneZvyraznenie(st, q, false).filter((row) => !ks.some((k) => POJMY[k].row === row));
    if (nahodny.length) return; // zloženie náhodou vytvorilo celý názov inej služby (to testuje R16)
    out.push({ L, q, o: { k: ks, typ }, formy: ch.flatMap((f) => [f.n, f.a, f.b]) });
  };
  for (const d of vyber(r, dvojice, 36)) pridaj(d, pick(r, X.multi2), 'cena');
  for (const t of vyber(r, trojice, 12)) pridaj(t, pick(r, X.multi3), 'cena');
  for (const d of vyber(r, dvojice, 8)) pridaj(d, pick(r, X.multiTrv), 'trvanie');
  return out;
}

const z = (L, items, extra = {}) => items.map(([q, k, opts = {}]) => ({ L, q, o: { k, ...extra, ...opts } }));
function R04(L) { return z(L, LEX[L].zlozene); }

function R05(L) {
  const r = rng(`R05-${L}`), X = LEX[L], out = [];
  const K = ['strih', 'panske', 'upravabrady', 'brada', 'hottowel', 'kombo', 'balicek1', 'ultra', 'upravaobocia', 'hlava', 'plet'];
  const kand = [];
  for (const [druh, dni] of Object.entries(X.dni)) for (const d of dni) for (const k of K) kand.push({ druh, d, k });
  for (const c of vyber(r, kand, 36)) {
    const tpl = pick(r, X.denSab);
    const f = pojemVety(r, L, c.k, tpl); if (!f) continue;
    const q = vypln(tpl, { n: f.n, a: f.a, b: f.b, D: c.d });
    out.push({ L, q, o: { k: [c.k], den: c.druh, tema: c.druh === 'sviatok' ? 'sviatky' : undefined }, formy: [f.n, f.a, f.b] });
  }
  return out;
}

const ZAPOR_PARY = [['strih', 'upravabrady'], ['strih', 'brada'], ['brada', 'strih'], ['strih', 'upravaobocia'], ['balicek', 'strih'], ['holenie', 'upravabrady'],
  ['upravabrady', 'farbbrady'], ['strih', 'hlava'], ['plet', 'depil'], ['upravaobocia', 'farbobocia'], ['ultra', 'balicek1'], ['hottowel', 'upravabrady'],
  ['panske', 'kombo'], ['kombo', 'panske'], ['upravabrady', 'hottowel'], ['depil', 'ornament']];
function R06(L) {
  const r = rng(`R06-${L}`), X = LEX[L], out = [];
  for (const [neg, pos] of ZAPOR_PARY) {
    for (const tpl of vyber(r, X.zaporSab, 2)) {
      const f1 = pick(r, formy(L, neg).filter((x) => !x.plural)), f2 = pick(r, formy(L, pos).filter((x) => !x.plural));
      const q = vypln(tpl, { n1: f1.n, a1: f1.a, b1: f1.b, n2: f2.n, a2: f2.a, b2: f2.b });
      out.push({ L, q, o: { k: [pos], neg: [neg] }, formy: [f2.n, f2.a, f2.b] });
    }
  }
  return out;
}

function R07(L) {
  const r = rng(`R07-${L}`), X = LEX[L], out = [];
  const kand = [];
  for (const k of Object.keys(POJMY)) for (let t = 0; t < X.trv.length; t++) kand.push({ k, t });
  for (const c of vyber(r, kand, 34)) {
    const tpl = X.trv[c.t];
    const f = pojemVety(r, L, c.k, tpl); if (!f) continue;
    out.push({ L, q: vypln(tpl, { n: f.n, a: f.a, b: f.b }), o: { k: [c.k], typ: 'trvanie' }, formy: [f.n, f.a, f.b] });
  }
  return out;
}

function R08(L) {
  return Object.entries(TRV_NES_SPEC).map(([key, s]) => ({ L, q: LEX[L].trvNes[key], o: { k: [], nesluzba: true, typ: 'trvanie', ...s } }));
}
function R09(L) {
  return Object.entries(NEVIEME_SPEC).map(([key, s]) => ({ L, q: LEX[L].nevieme[key], o: { ...s } }));
}
function R11(L) { return z(L, LEX[L].hovor); }

const MIX_PARTNERI = { sk: ['en', 'de'], cs: ['en', 'sk'], en: ['sk', 'de'], de: ['en', 'sk'], pl: ['en', 'sk'], hu: ['sk', 'en'], sr: ['en', 'sk'], uk: ['sk', 'en'] };
const MIX_POJMY = ['strih', 'panske', 'upravabrady', 'brada', 'hottowel', 'kombo', 'balicek1', 'ultra', 'upravaobocia', 'plet', 'depil', 'ornament', 'hlava', 'farbbrady'];
function R12(L) {
  const r = rng(`R12-${L}`), X = LEX[L], out = [];
  for (const [q, k, mix] of X.mix) out.push({ L, q, o: { k, mix } });
  for (const B of MIX_PARTNERI[L]) {
    for (const k of vyber(r, MIX_POJMY, 9)) {
      const tpl = pick(r, [X.cena[0], X.cena[1], X.cena[5]]);
      const f = pick(r, formy(B, k).filter((x) => !x.plural));
      out.push({ L, q: vypln(tpl, { n: f.b, a: f.b, b: f.b }), o: { k: [k], mix: `${L}+${B}` } });
    }
  }
  return out;
}

const EMOJI_UPRAVY = [
  ['💈 pred', (q) => `💈 ${q}`], ['🙏 namiesto ?', (q) => q.replace(/\?$/, ' 🙏')], ['??', (q) => q.replace(/\?$/, '??')],
  ['😅 za', (q) => `${q} 😅`], ['pls', (q) => q.replace(/\?$/, ' pls?')], ['✂️ pred', (q) => `✂️ ${q}`], ['€? za', (q) => q.replace(/\?$/, ' €?')],
];
function R13(L, zaklady) {
  const r = rng(`R13-${L}`), out = z(L, LEX[L].emoji);
  for (const b of vyber(r, zaklady.filter((x) => x.L === L), 16)) {
    const [nazov, f] = pick(r, EMOJI_UPRAVY);
    const q = f(b.q);
    if (q !== b.q) out.push({ L, q, o: { ...b.o, variant: `emoji: ${nazov}` } });
  }
  return out;
}

function zaciatokMaly(L, q) {
  if (L === 'de' && /^(Adresse|Barbershop)/.test(q)) return q;
  return q.charAt(0).toLowerCase() + q.slice(1);
}
const bezDiakritiky = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
function R14(L) {
  const X = LEX[L], out = [];
  X.adresa.jadro.forEach((q, i) => {
    out.push({ L, q, o: { k: [], adresa: 'jadro', polozka: 'adresa' } });
    out.push({ L, q: X.pozdrav[i % 2] + zaciatokMaly(L, q), o: { k: [], adresa: 'jadro', polozka: 'adresa', variant: 'pozdrav' } });
    out.push({ L, q: bezDiakritiky(q).toLowerCase().replace(/[?.!]+$/, ''), o: { k: [], adresa: 'jadro', polozka: 'adresa', variant: 'bez diakritiky' } });
  });
  X.adresa.cesta.forEach((q, i) => {
    const tema = i === 4 ? 'parkovanie' : undefined;
    out.push({ L, q, o: { k: [], adresa: 'cesta', tema, polozka: 'adresa' } });
    out.push({ L, q: X.pozdrav[(i + 1) % 2] + zaciatokMaly(L, q), o: { k: [], adresa: 'cesta', tema, polozka: 'adresa', variant: 'pozdrav' } });
  });
  return out;
}

function R15(L) {
  const r = rng(`R15-${L}`), X = LEX[L], out = [];
  const K = ['strih', 'panske', 'upravabrady', 'kombo', 'balicek1', 'ultra', 'upravaobocia', 'hottowel', 'plet'];
  const kand = [];
  for (const k of K) for (const tpl of X.rozpocet) for (const N of [10, 15, 18, 20, 25, 30, 40]) kand.push({ k, tpl, N });
  for (const c of vyber(r, kand, 22)) {
    const f = pojemVety(r, L, c.k, c.tpl); if (!f) continue;
    out.push({ L, q: vypln(c.tpl, { n: f.n, a: f.a, b: f.b, N: c.N }), o: { k: [c.k], variant: 'rozpočet' }, formy: [f.n, f.a, f.b] });
  }
  for (const k of vyber(r, K, 5)) {
    const tpl = pick(r, X.mena);
    const f = pojemVety(r, L, k, tpl);
    out.push({ L, q: vypln(tpl, { n: f.n, a: f.a, b: f.b }), o: { k: [k], variant: 'iná mena' } });
  }
  for (const N of [20, 50]) out.push({ L, q: vypln(X.rozpocetVolny, { N }), o: { k: [], ocakava: 'skupina', variant: 'rozpočet bez služby' } });
  return out;
}

const RIADKOVE = Object.keys(POJMY).filter((k) => POJMY[k].row);
function R16(L, st) {
  const r = rng(`R16-${L}`), X = LEX[L], out = [];
  for (const k of RIADKOVE) {
    const f = formy(L, k).find((x) => x.page);
    const zak = [X.cena[0], X.trv[0], pick(r, X.cena.slice(1))];
    for (const tpl of zak) out.push({ L, q: vypln(tpl, { n: f.n, a: f.a, b: f.b }), o: { k: [k], typ: tpl === X.trv[0] ? 'trvanie' : 'cena' }, formy: [f.n, f.a, f.b] });
    const ini = RIADKOVE.filter((x) => POJMY[x].g !== POJMY[k].g);
    const mody = ['ina', 'zapor', k === 'deti' ? 'dievca' : 'on', 'ona'];
    if (k === 'panske' || k === 'dlhe') mody.push('dlzka');
    for (const mod of vyber(r, mody, 2)) {
      if (mod === 'on' || mod === 'ona') {
        const p = pick(r, X.osoby[mod]);
        out.push({ L, q: vypln(X.osobaSab[0], { n: f.n, a: f.a, b: f.b, P: p }), o: { k: [k], osoba: mod } });
      } else if (mod === 'dievca') {
        const p = pick(r, X.osoby.dievca).replace('{N}', 7);
        out.push({ L, q: vypln(X.osobaSab[0], { n: f.n, a: f.a, b: f.b, P: p }), o: { k: [k], osoba: 'dievca', vek: 7 } });
      } else if (mod === 'dlzka') {
        const d = k === 'dlhe' ? 'dlha' : pick(r, ['dlha', 'kratka']);
        out.push({ L, q: vypln(X.dlzkaSab[0], { n: f.n, a: f.a, b: f.b, L: pick(r, X.dlzka[d]) }), o: { k: [k], dlzka: d } });
      } else {
        const k2 = pick(r, ini), f2 = formy(L, k2).find((x) => x.page);
        if (mod === 'ina') {
          out.push({ L, q: vypln(X.multi2[0], { n1: f.n, a1: f.a, b1: f.b, n2: f2.n, a2: f2.a, b2: f2.b }), o: { k: [k, k2] } });
        } else {
          out.push({ L, q: vypln(X.zaporSab[1], { n1: f.n, a1: f.a, b1: f.b, n2: f2.n, a2: f2.a, b2: f2.b }), o: { k: [k2], neg: [k] } });
        }
      }
    }
  }
  return out;
}

function R17(L, st) {
  const X = LEX[L], out = [];
  for (const g of st.skupiny) for (const tpl of X.skupinySab) out.push({ L, q: vypln(tpl, { T: g.nadpisy[L] }), o: { k: [], skupinyPlus: [g.id], ocakava: 'skupina' } });
  for (const [key, gs] of Object.entries(SKUPINY_VOLNE_SPEC)) out.push({ L, q: X.skupinyVolne[key], o: { k: [], skupinyPlus: gs, ocakava: 'skupina' } });
  return out;
}
function R18(L) {
  return Object.entries(PASCE_SPEC).map(([key, s]) => ({ L, q: LEX[L].pasce[key], o: { ...s } }));
}

// ── R10: preklepy, bez diakritiky, iné písmo ──
const SR_CYR = [['lj', 'љ'], ['nj', 'њ'], ['dž', 'џ'], ['Lj', 'Љ'], ['Nj', 'Њ'], ['Dž', 'Џ']];
const SR_1 = 'abvgdđežzijklmnoprstćufhcčš', SR_1C = 'абвгдђежзијклмнопрстћуфхцчш';
function naCyriliku(s) {
  let o = s;
  for (const [a, b] of SR_CYR) o = o.split(a).join(b);
  return [...o].map((ch) => {
    const i = SR_1.indexOf(ch); if (i >= 0) return SR_1C[i];
    const j = SR_1.toUpperCase().indexOf(ch); if (j >= 0) return SR_1C.toUpperCase()[j];
    return ch;
  }).join('');
}
const UK_LAT = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', 'ʼ': '', "'": '' };
const naLatinku = (s) => [...s].map((ch) => { const l = ch.toLowerCase(); if (l in UK_LAT) { const t = UK_LAT[l]; return ch === l ? t : t.charAt(0).toUpperCase() + t.slice(1); } return ch; }).join('');

let SLOVA = null;
function slovaPojmov() {
  if (SLOVA) return SLOVA;
  SLOVA = {};
  for (const L of JAZYKY) {
    const m = new Map();
    for (const [k, fs] of Object.entries(LEX[L].s)) for (const f of fs.map(forma)) for (const t of [f.n, f.a, f.b]) for (const w of norm(t).split(' ')) {
      if (w.length < 3) continue;
      if (!m.has(w)) m.set(w, new Set());
      m.get(w).add(k);
    }
    SLOVA[L] = m;
  }
  return SLOVA;
}
function preklep(r, slovo, druh) {
  const p = [...slovo];
  if (p.length < 5) return null;
  const i = 1 + Math.floor(r() * (p.length - 2));
  switch (druh) {
    case 'výmena': [p[i], p[i + 1]] = [p[i + 1], p[i]]; break;
    case 'vypustenie': p.splice(i, 1); break;
    case 'zdvojenie': p.splice(i, 0, p[i]); break;
    case 'zámena': { const v = 'aeiouy', c = p[i].toLowerCase(); p[i] = v.includes(c) ? v[(v.indexOf(c) + 1) % v.length] : (c === 'r' ? 't' : c === 't' ? 'r' : c === 's' ? 'd' : 'r'); break; }
    default: return null;
  }
  const w = p.join('');
  return w === slovo ? null : w;
}
function R10(L, zaklady) {
  const r = rng(`R10-${L}`), out = [];
  const slova = slovaPojmov()[L];
  const zak = vyber(r, zaklady.filter((x) => x.L === L && x.formy), 60);
  for (const b of zak) {
    const druhy = ['bez diakritiky', 'preklep', 'preklep+bez diakritiky', 'malé bez interpunkcie', 'zlepené'];
    if (L === 'sr') druhy.push('cyrilika', 'cyrilika');
    if (L === 'uk') druhy.push('latinka', 'latinka');
    const druh = pick(r, druhy);
    let q = null;
    if (druh === 'bez diakritiky') q = bezDiakritiky(b.q);
    else if (druh === 'malé bez interpunkcie') q = b.q.toLowerCase().replace(/[?!.,…–]+/g, ' ').replace(/\s+/g, ' ').trim();
    else if (druh === 'cyrilika') q = /Hot Towel|Ultra|PREMIUM|Barbershop|fade|€/i.test(b.q) ? null : naCyriliku(b.q);
    else if (druh === 'latinka') q = naLatinku(b.q);
    else if (druh === 'zlepené') {
      const f = b.formy.find((x) => x.includes(' ') && b.q.includes(x));
      if (f) { const i = f.indexOf(' '); q = b.q.replace(f, f.slice(0, i) + f.slice(i + 1)); }
    } else {
      // preklep v najdlhšom slove vloženej formy služby
      const f = b.formy.filter((x) => b.q.includes(x)).sort((x, y) => y.length - x.length)[0];
      if (f) {
        const kand = f.split(/\s+/).filter((w) => [...w].length >= 5 && /^\p{L}+$/u.test(w)).sort((x, y) => y.length - x.length);
        for (const w of kand) {
          const nw = preklep(r, w, pick(r, ['výmena', 'vypustenie', 'zdvojenie', 'zámena']));
          if (!nw) continue;
          const kto = slova.get(norm(nw));
          if (kto && !b.o.k.some((k) => kto.has(k))) continue; // preklep vytvoril slovo inej služby
          q = b.q.replace(f, f.replace(w, nw));
          if (druh === 'preklep+bez diakritiky') q = bezDiakritiky(q);
          break;
        }
      }
    }
    if (q && q !== b.q) out.push({ L, q, o: { ...b.o, variant: druh } });
  }
  return out;
}

export const TRIEDY = [
  ['R01', 'služba × osoba (ja, on, ona, dieťa N rokov, dievča, kamarát, my)', R01],
  ['R02', 'služba × dĺžka a veľkosť (cm, krátke, dlhé, po plecia, brada)', R02],
  ['R03', 'dve a tri služby (a, aj, +, alebo, k tomu), aj trvanie dvoch služieb', R03],
  ['R04', 'zložené slová (de, hu, pl; aj sk, cs, uk, sr, en: vek a dĺžka v jednom slove)', R04],
  ['R05', 'služba × deň, čas, príplatok, sviatok', R05],
  ['R06', 'služba × zápor a oprava („nie X, ale Y“, „X… oprava, Y“)', R06],
  ['R07', 'trvanie × služba', R07],
  ['R08', 'trvanie × neslužba (rezervácia, čakanie, melír, poukážka, storno, cesta)', R08],
  ['R09', 'cena × téma nevieme (dámske, karta, poukážky, parkovanie, produkty, Romana, zľavy, iná služba)', R09],
  ['R10', 'preklepy, bez diakritiky, zlepené slová, cyrilika (sr) a latinka (uk)', R10],
  ['R11', 'hovorové a nárečové otázky', R11],
  ['R12', 'zmiešané jazyky (šablóna jedného jazyka, služba z iného)', R12],
  ['R13', 'emoji a skratky', R13],
  ['R14', 'adresa a cesta (8 jazykov)', R14],
  ['R15', 'cena od návštevníka, rozpočet, iná mena', R15],
  ['R16', 'celé názvy služieb zo stránky a zvýraznenie riadku (P7 b)', R16],
  ['R17', 'skupiny cenníka podľa nadpisu a celý cenník', R17],
  ['R18', 'pasce: slovo služby v inom význame (olej na bradu, strih brady, 10 cm brada …)', R18],
];
