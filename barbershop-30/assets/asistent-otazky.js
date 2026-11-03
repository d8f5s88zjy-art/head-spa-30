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
// „počas strihu“, instagram → insta ako inštalatér): kmeňom je celá táto predpona, takže otázka mimo témy nedostane
// nezmyselnú odpoveď ani návrhy
const CELE = ['pocasi', 'recept', 'instagram', 'barberk'];

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

/* Cenník: otázka na cenu alebo čas, ktorá menuje jednu službu z cenníka, dostane overenú odpoveď cena-<služba> alebo
   trvanie-<služba>, keď ju hľadanie samo nevyberie. Hľadanie podľa slov skoro netrestá chýbajúce časté slovo (strih),
   takže kratšie znenie inej služby („Koľko stojí úprava brady?“) prebilo „strih a úprava brady“ (kontrola 29. 10. 2026).
   Pravidlá idú od konkrétnej služby k všeobecnej; tretí údaj sú služby, ktoré pravidlo zahŕňa (strih s bradou je aj
   strih aj brada). Keď otázka menuje ešte inú službu, je to otázka na viac služieb a rozhodne bežné hľadanie.
   Hľadanie má prednosť, keď vyberie práve túto odpoveď alebo inú než odpoveď o jednej službe (prehľad, fade, čo
   obsahuje), ktorá skoro presne sedí na otázku alebo má správne číslo v prvej vete. Server (asistent/lib/otazky.php) má tie isté pravidlá, otazky.mjs stráži zhodu a mriežku
   cenník × názvy × otázky a sadu 150 otázok na ceny a časy (source/tools/sada-150-ceny.json, nulová tolerancia).
   Strih a bradu spojí len spojka alebo slovo úprava („strih brady“ je úprava brady), zápor „bez/okrem“ službu vyškrtne
   a časť textu, ktorú pravidlo zoberie, sa ďalej nepočíta (nálezy BAR-01, 3. 11. 2026). */
const SPOJ = '( a| aj| s| so| plus| spolu s| aj s| a aj)';
const SLUZBY = [
  ['ultra-inclusive', /ultra|balic\w*.{0,25}whisk|whisk\w*.{0,25}balic/, 'balicek-1 strih-a-brada pansky-strih uprava-brady hot-towel uprava-obocia depilacia plet-premium'],
  ['balicek-1', /balic\w* (1|jedn|prv)|balik (1|jedn)|prv\w* balic|zakladn\w* balic/, 'strih-a-brada pansky-strih uprava-brady hot-towel uprava-obocia depilacia'],
  ['farbenie-brady', /(farb|tonov|sedin|sediv)\w*.{0,20}(brad|fuz)|(brad|fuz)\w*.{0,20}(farb|tonov|sedin|sediv)/, 'uprava-brady'],
  ['farbenie-obocia', /farb\w*.{0,20}oboc|oboc\w*.{0,20}farb/, 'uprava-obocia'],
  ['dlhe-vlasy', /(\bo?strih\w* )?(dlh\w*|dlhs\w*) vlas\w*|vlas\w* (dlh\w*|dlhs\w*)( ako)?( 10)?|(nad|cez|viac ako|dlhs\w* ako) 10|po plec/, 'pansky-strih'],
  ['strih-a-brada', new RegExp(`\\b(strih|ostrih|vlas)\\w*( \\w+)?(${SPOJ}( \\w+){0,2}| (uprav|zastrih)\\w*) (brad|fuz)\\w*|\\b(brad|fuz)\\w*( \\w+)?${SPOJ}( \\w+){0,2} (strih|ostrih|vlas)\\w*`), 'uprava-brady pansky-strih hot-towel'],
  ['oholenie-hlavy', /(hol|britv)\w*.{0,20}hlav|hlav\w*.{0,20}(hol|britv|hladk)/, 'hot-towel'],
  ['uprava-obocia', /oboc/, ''],
  ['hot-towel', /do hladka|na hladko|nahladko|\b(o|vy)?hol\w* (tvar|brad)\w*/, 'uprava-brady'],
  ['uprava-brady', /\b(o|za)?strih\w* (brady|fuzov)\b|brad|fuz/, 'hot-towel'],   // „strih brady“ je úprava brady
  ['male-gentlemany', /\bo?strih\w* pre (\w+ )?(syn|chlapc|diet|deti|mal)\w*|detsk|\bsyn|dieta|\bdeti|chlapc|chlapec|gentleman|\bmal(eho|emu|ych|ym)\b/, 'pansky-strih ornament'],
  ['hot-towel', /hot towel|do hladka|britv|ohol\w* tvar|holen/, ''],
  ['plet-premium', /\bplet|peeling|\bmask|premium/, ''],
  ['depilacia', /depil|vosk/, ''],
  ['ornament', /ornament|vzor/, ''],
  ['pansky-strih', /\b(o?strih|o?strihu|o?strihom|o?strihy|o?strihov|o?strihani[ea]|fade)\b/, ''],
];
const CENA = /\bcen[auy]?\b|\bcenn|\bstoj|\bstal\b|\b(bude|by|ma) stat\b|\bzaplat|\bkolko (sa )?plat|\bvyjde|\bza kolko\b|\bkolko (si )?(pytate|uctujete)|\bkolko dam\b|\bdam za\b|\beur/;
const CAS = /\bdlho\b|\btrva|\bkolko casu\b|\bzaberie|\bminut/;
// otázka nie je len na cenu alebo čas služby z cenníka: iný človek, podnik alebo služba, vek, platba, porovnanie,
// výdrž, čakanie, otázka, ktorá cenu či čas už menuje („strih za 18 eur“); rozhodne bežné hľadanie
const INE = new RegExp(['\\b(pes|psa|psov|psovi|psik\\w*|mack\\w*|zviera\\w*|konkurenc\\w*|inde|damsk\\w*|zensk\\w*|zen[auye]?|zenou|baby',
  'dievc\\w*|dcer\\w*|priatelk\\w*|manzelk\\w*|melir\\w*|trval\\w*|kadernic\\w*|rocn\\w*|rok|roky|rokov|tined\\w*|teen\\w*|vnuk\\w*|vnuc\\w*',
  'kartou|karta|kartu|hotovost\\w*|vydrz\\w*|zavis\\w*|rozdiel\\w*|dokedy|rovnak\\w*|cak\\w*|oprav\\w*|dolad\\w*|posob\\w*|necha\\w*',
  'lacnejs\\w*|drahs\\w*|rychlejs\\w*)\\b|\\b(dlhsie|kratsie) ako\\b(?! 10)|\\bviac\\b(?! ako \\d)|\\d+ ?(eur\\w*|e|min\\w*|hod\\w*)\\b',
  'farb\\w*.{0,15}vlas|vlas\\w*.{0,15}farb'].join('|'));
// mimo témy (BAR-03, BAR-07): strih, holenie či cena pre zviera, trávnik, plot alebo záhradu a otváracie hodiny iného miesta
// (pošta, lekáreň, Tesco, plaváreň, banka) nedostanú cenu ani hodiny Barbershopu, len telefón recepcie
const MIMO = /\b(pes|psa|psov|psovi|psik\w*|mack\w*|zviera\w*|travn\w*|plot\w*|krik\w*|krov\w*|strom\w*|zahrad\w*|ovc\w*|kon[ai]?)\b/;
const RIADI = /strih|holen|ohol|stoj|cen|trva|farb|zaplat/;
const MIESTO = /\b(posta|posty|postu|poste|lekar\w*|tesco\w*|plavar\w*|bank[ay]|banku|bankach|kaufland\w*|lidl\w*|billa\w*)\b/;
const OTVOR = /otvor|zatvor|zatvar|hodin|\bkedy\b/;
const plain = (text) => String(text).toLowerCase().replace(/[^\x00-\x7f]/g, (z) => DIAKRITIKA[z] ?? z).replace(/[^a-z0-9]+/g, ' ').trim();
const ID_SLUZBY = new Set(SLUZBY.flatMap(([s]) => [`cena-${s}`, `trvanie-${s}`]));

/* overené odpovede z cenníka pre otázku na cenu alebo čas jednej či viacerých služieb, inak []; služba, ktorú zahŕňa
   už vybraná služba (strih s bradou je aj strih), sa nepridá */
export function smerujVsetky(db, text) {
  let t = plain(text);
  if (!t || t.split(' ').length > 16 || INE.test(t)) return [];
  const druh = CAS.test(t) ? 'trvanie' : CENA.test(t) ? 'cena' : null;
  if (!druh) return [];
  t = t.replace(/\b(bez|okrem)( \w+)? (brad|fuz|strih|ostrih|vlas|holen|ohol)\w*/g, ' ');
  const cely = t;
  // „strih pre mňa a pre syna“ sú dvaja ľudia: detský strih sa nezlúči s pánskym
  const viacLudi = /\bpre (mna|seba|mnou)\b|\b(ja|mne) a\b/.test(t);
  const vybrane = [];
  for (const [s, re, zahrna] of SLUZBY) {
    const m = t.match(re);
    if (!m) continue;
    if (s === 'male-gentlemany' && !/strih|fade|gentleman/.test(cely)) continue;   // „úprava brady pre syna“: syn je človek, nie služba
    t = t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length);
    if (vybrane.some(([x, z]) => x === s || (z.split(' ').includes(s) && !(viacLudi && x === 'male-gentlemany')))) continue;
    vybrane.push([s, zahrna]);
  }
  return vybrane.map(([s]) => db.ot.find((o) => o.id === `${druh}-${s}`)).filter(Boolean);
}
/* overená odpoveď z cenníka pre otázku na cenu alebo čas jednej služby, inak null */
export function smeruj(db, text) { const v = smerujVsetky(db, text); return v.length === 1 ? v[0] : null; }

/* číslo, ktoré musí byť v odpovedi: cena (18 €) alebo dĺžka (40 minút) zo smerovanej odpovede */
const cislo = (o) => (o.id.startsWith('cena-') ? (o.a.match(/\d+(?:,\d+)? €/) || [])[0] : (o.a.match(/\d+ minút/) || [])[0]);
const prvaVeta = (a) => a.split(/(?<=[.!?])\s/)[0];

/* najlepšia odpoveď pre okno a server: [{ o, skore }] ako hladaj(), na prvom mieste smerovaná odpoveď z cenníka.
   Otázka na viac služieb (BAR-02): keď hľadanie nenašlo pripravenú odpoveď na takú dvojicu (napr. sluzby-strih-ornament),
   okno zloží prvé vety overených odpovedí tých služieb za sebou (id cennik-viac). Nič nesčítava. */
export function najdi(db, text, kolko = 5, prah = 0) {
  const t = plain(text);
  if ((MIMO.test(t) && RIADI.test(t)) || (MIESTO.test(t) && OTVOR.test(t))) return [];
  const h = hladaj(db, text, kolko);
  const v = smerujVsetky(db, text);
  const top0 = h[0];
  if (v.length > 1 && (!top0 || top0.skore < prah || ID_SLUZBY.has(top0.o.id))) {
    const o = { id: 'cennik-viac', q: text, a: v.map((x) => prvaVeta(x.a)).join(' ') + ' Ceny sú konečné.', viac: v.map((x) => x.id) };
    return [{ o, skore: 1 }, ...h].slice(0, kolko);
  }
  const s = v.length === 1 ? v[0] : null;
  if (!s) return h;
  const top = h[0];
  const c = cislo(s);
  if (top && top.skore >= prah && (top.o.id === s.id || (!ID_SLUZBY.has(top.o.id) && (top.skore >= 0.9 || (c && prvaVeta(top.o.a).includes(c)))))) return h;
  return [{ o: s, skore: 1 }, ...h.filter((x) => x.o.id !== s.id)].slice(0, kolko);
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
