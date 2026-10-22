/*
 * BARBERSHOP 30 – časté otázky pre Barbera (asistent.js a asistent-ukazka.js): overené odpovede z
 * asistent-otazky.json (kópia ../asistent/znalosti/barbershop-otazky.json, robí ju source/tools/otazky.mjs) a
 * hľadanie najpodobnejšej otázky. Server má to isté hľadanie (asistent/lib/otazky.php), aby modelu pridal
 * odpovede na podobné otázky; otazky.mjs stráži, že obe vrátia rovnaké poradie.
 *
 * Hľadanie: text bez diakritiky a bez výplňových slov, slová skrátené na kmeň (koncovka preč, najviac 5 znakov),
 * váha slova podľa toho, v koľkých otázkach je (zriedkavé slovo váži viac), zhoda s otázkou aj jej inými
 * zneniami (Dice s váhami), berie sa najlepšie znenie.
 */
const ZDROJ = new URL('asistent-otazky.json', import.meta.url);

const DIAKRITIKA = { á: 'a', ä: 'a', à: 'a', â: 'a', ã: 'a', å: 'a', ā: 'a', ă: 'a', ą: 'a', č: 'c', ć: 'c', ç: 'c', ď: 'd',
  é: 'e', ě: 'e', ë: 'e', è: 'e', ê: 'e', ē: 'e', ę: 'e', í: 'i', ì: 'i', î: 'i', ï: 'i', ĺ: 'l', ľ: 'l', ł: 'l', ň: 'n', ń: 'n',
  ñ: 'n', ó: 'o', ô: 'o', ö: 'o', ò: 'o', õ: 'o', ő: 'o', ø: 'o', ŕ: 'r', ř: 'r', š: 's', ś: 's', ş: 's', ť: 't', ú: 'u', ů: 'u',
  ü: 'u', ù: 'u', û: 'u', ű: 'u', ý: 'y', ÿ: 'y', ž: 'z', ź: 'z', ż: 'z', ß: 'ss' };
const STOP = new Set(('a aj ale alebo ako aka ake aki aky ani by bol bola bude budem co ci ho i ja je jeho jej ju k ku ' +
  'ma mam mame mate mat mi mna mne mnou moj moja moze mozem mozno my na nam nas ne nie o po pod pre pri s sa si ' +
  'som so su ta tak tam te to toho ten tu tvoj u uz v vam vas vo vy z za ze zo prosim vobec').split(' '));
const KONCOVKY = ['ovia', 'ami', 'ach', 'och', 'ych', 'ymi', 'imi', 'eho', 'emu', 'ovi', 'ich', 'ou', 'om', 'ov', 'ej',
  'ia', 'ie', 'iu', 'ii', 'ym', 'a', 'e', 'i', 'o', 'u', 'y'];

export function kmene(text) {
  const t = String(text).toLowerCase().replace(/[^\x00-\x7f]/g, (z) => DIAKRITIKA[z] ?? z).replace(/[^a-z0-9]+/g, ' ');
  const out = new Set();
  for (const w of t.split(' ')) {
    if (!w || STOP.has(w)) continue;
    let k = w;
    if (!/^\d+$/.test(w)) {
      for (const s of KONCOVKY) if (k.length - s.length >= 3 && k.endsWith(s)) { k = k.slice(0, -s.length); break; }
      k = k.slice(0, 5);
    }
    out.add(k);
  }
  return [...out];
}

/* pripraví otázky: kmene každého znenia a váhy slov */
export function priprav(data) {
  const ot = data.otazky.map((o) => ({ ...o, znenia: [o.q, ...(o.v || [])].map(kmene).filter((z) => z.length) }));
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

let nacitane = null;
export function nacitaj() {
  if (!nacitane) nacitane = fetch(ZDROJ.href, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then(priprav)
    .catch((e) => { nacitane = null; throw e; });
  return nacitane;
}
