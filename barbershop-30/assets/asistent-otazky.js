/*
 * BARBERSHOP 30 – časté otázky pre Barbera (asistent.js a asistent-ukazka.js): overené odpovede a hľadanie
 * najpodobnejšej otázky. Zdroj je ../asistent/znalosti/barbershop-otazky.json (otázka q, iné znenia v, odpoveď a).
 * Prehliadač dostane kópiu v dvoch súboroch (kopiaPreWeb() nižšie; zapisuje ju source/tools/otazky.mjs a admin):
 *  - asistent-otazky.json: témy, otázky a odpovede bez iných znení (témy v okne, ťuknutie na otázku, odpoveď),
 *  - asistent-otazky-kmene.json: kmene otázky a jej iných znení podľa id, spočítané vopred (len na hľadanie).
 * nacitaj() stiahne prvý súbor pri prvom otvorení okna a hneď po ňom kmene; kým kmene nie sú, hľadá sa podľa
 * otázok, nacitajHladanie() počká na kmene. Kmene z inej kópie (verzia, otisk) sa nepoužijú; keď zlyhajú alebo
 * nesedia, ďalšie nacitaj() ich stiahne znova. Server má to isté hľadanie (asistent/lib/otazky.php) nad zdrojom, aby
 * modelu pridal odpovede na podobné otázky; otazky.mjs stráži, že server, zdroj aj kópia vrátia rovnaké poradie.
 *
 * Hľadanie: text bez diakritiky a bez výplňových slov, slová skrátené na kmeň (koncovka preč, najviac 5 znakov),
 * váha slova podľa toho, v koľkých otázkach je (zriedkavé slovo váži viac), zhoda s otázkou aj jej inými
 * zneniami (Dice s váhami), berie sa najlepšie znenie.
 */
const OTAZKY = new URL('asistent-otazky.json', import.meta.url), KMENE = new URL('asistent-otazky-kmene.json', import.meta.url);

const DIAKRITIKA = { á: 'a', ä: 'a', à: 'a', â: 'a', ã: 'a', å: 'a', ā: 'a', ă: 'a', ą: 'a', č: 'c', ć: 'c', ç: 'c', ď: 'd',
  é: 'e', ě: 'e', ë: 'e', è: 'e', ê: 'e', ē: 'e', ę: 'e', í: 'i', ì: 'i', î: 'i', ï: 'i', ĺ: 'l', ľ: 'l', ł: 'l', ň: 'n', ń: 'n',
  ñ: 'n', ó: 'o', ô: 'o', ö: 'o', ò: 'o', õ: 'o', ő: 'o', ø: 'o', ŕ: 'r', ř: 'r', š: 's', ś: 's', ş: 's', ť: 't', ú: 'u', ů: 'u',
  ü: 'u', ù: 'u', û: 'u', ű: 'u', ý: 'y', ÿ: 'y', ž: 'z', ź: 'z', ż: 'z', ß: 'ss' };
const STOP = new Set(('a aj ale alebo ako aka ake aki aky ani by bol bola bude budem co ci ho i ja je jeho jej ju k ku ' +
  'ma mam mame mate mat mi mna mne mnou moj moja moze mozem mozno my na nam nas ne nie o po pod pre pri s sa si ' +
  'som so su ta tak tam te to toho ten tu tvoj u uz v vam vas vo vy z za ze zo prosim vobec').split(' '));
const KONCOVKY = ['ovia', 'ami', 'ach', 'och', 'ych', 'ymi', 'imi', 'eho', 'emu', 'ovi', 'ich', 'ou', 'om', 'ov', 'ej',
  'ia', 'ie', 'iu', 'ii', 'ym', 'a', 'e', 'i', 'o', 'u', 'y'];
// slová, ktorých skrátený kmeň by splynul s iným slovom odpovedí (recept → recep ako recepcia, počasie → počas ako
// „počas strihu“): kmeňom je celá táto predpona, takže otázka mimo témy nedostane nezmyselnú odpoveď ani návrhy
const CELE = ['pocasi', 'recept'];

export function kmene(text) {
  const t = String(text).toLowerCase().replace(/[^\x00-\x7f]/g, (z) => DIAKRITIKA[z] ?? z).replace(/[^a-z0-9]+/g, ' ');
  const out = new Set();
  for (const w of t.split(' ')) {
    if (!w || STOP.has(w)) continue;
    let k = w;
    if (!/^\d+$/.test(w)) {
      const cele = CELE.find((p) => w.startsWith(p));
      if (cele) k = cele;
      else {
        for (const s of KONCOVKY) if (k.length - s.length >= 3 && k.endsWith(s)) { k = k.slice(0, -s.length); break; }
        k = k.slice(0, 5);
      }
    }
    out.add(k);
  }
  return [...out];
}

/* kópia pre prehliadač: { otazky: obsah asistent-otazky.json, kmene: obsah asistent-otazky-kmene.json }. Otázky bez
   iných znení (v); kmene { id: znenia oddelené |, kmene medzerou }, bez opakovaní (rovnaké znenie nemení najlepšiu
   zhodu ani váhy), takže telefón ich pri otvorení okna nepočíta. Server číta zdroj s v (jeho formát sa nemení).
   otisk (FNV-1a kmeňov) majú oba súbory: nacitaj() spáruje len kmene z tej istej kópie, aj keď sa zdroj zmení dvakrát
   v ten istý deň (verzia je dátum) alebo ho uloží admin (verziu nemení). */
const otisk = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); return (h >>> 0).toString(36); };
export function kopiaPreWeb(data) {
  const k = (o) => [...new Set([o.q, ...(o.v || [])].map((z) => kmene(z).join(' ')).filter(Boolean))].join('|');
  const km = Object.fromEntries(data.otazky.map((o) => [o.id, k(o)]));
  const o = otisk(JSON.stringify(km));
  return {
    otazky: { ...data, otisk: o, otazky: data.otazky.map(({ v, ...x }) => x) },
    kmene: { verzia: data.verzia, otisk: o, k: km },
  };
}

/* pripraví otázky na hľadanie: kmene každého znenia a váhy slov. Kmene z kópie (k podľa id), inak z otázky a jej
   iných znení (zdroj); kópia otázok bez kmeňov hľadá len podľa otázok. */
export function priprav(data, km = null) {
  const ot = data.otazky.map((o) => ({ ...o, znenia: km && typeof km[o.id] === 'string'
    ? km[o.id].split('|').filter(Boolean).map((z) => z.split(' '))
    : [o.q, ...(o.v || [])].map(kmene).filter((z) => z.length) }));
  const df = new Map();
  for (const o of ot) for (const k of new Set(o.znenia.flat())) df.set(k, (df.get(k) || 0) + 1);
  const n = ot.length;
  const idf = (k) => Math.log(1 + n / (df.get(k) || 1 / 2));
  return { ...data, ot, idf };
}

/* zoradené otázky podľa podobnosti s textom: [{ o, skore 0..1 }] */
export function hladaj(db, text, kolko = 5) {
  const q = kmene(text);
  if (!q.length) return [];
  const wq = q.reduce((s, k) => s + db.idf(k), 0), qs = new Set(q);
  const vys = [];
  for (const o of db.ot) {
    let naj = 0;
    for (const z of o.znenia) {
      let m = 0, wz = 0;
      for (const k of z) { const w = db.idf(k); wz += w; if (qs.has(k)) m += w; }
      // zaokrúhlené, aby server (PHP) a prehliadač zoradili rovnako aj pri rozdiele v poslednom bite
      const s = Math.round((2 * m) / (wq + wz) * 1e6) / 1e6;
      if (s > naj) naj = s;
    }
    if (naj > 0) vys.push({ o, skore: naj });
  }
  return vys.sort((a, b) => b.skore - a.skore || (a.o.id < b.o.id ? -1 : 1)).slice(0, kolko);
}

const stiahni = (u) => fetch(u.href, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
let nacitane = null, hladanie = null, bezKmenov = false;
/* kmene k db: inej verzie alebo z inej kópie (stará kópia v pamäti prehliadača alebo CDN) sa nepoužijú; pri zlyhaní
   alebo nezhode ostane hľadanie podľa otázok a ďalšie nacitaj() (ďalšie otvorenie okna, ďalšia otázka) skúsi znova */
const kmeneDo = (db) => stiahni(KMENE).then((km) => {
  if (km.verzia !== db.verzia || km.otisk !== db.otisk) { bezKmenov = true; return db; }
  const p = priprav(db, km.k); db.ot = p.ot; db.idf = p.idf; return db;
}, () => { bezKmenov = true; return db; });
/* otázky a odpovede (db pre témy a ťuknutie); hneď potom sa sťahujú kmene a to isté db ich dostane (ot, idf) */
export function nacitaj() {
  if (!nacitane) {
    nacitane = stiahni(OTAZKY).then((d) => priprav(d)).catch((e) => { nacitane = null; hladanie = null; throw e; });
    hladanie = nacitane.then(kmeneDo);
    hladanie.catch(() => {});
  } else if (bezKmenov) { bezKmenov = false; hladanie = nacitane.then(kmeneDo); }
  return nacitane;
}
/* to isté db, keď už hľadá aj podľa iných znení (kmene stiahnuté alebo nedostupné) */
export function nacitajHladanie() {
  nacitaj();
  return hladanie;
}
