#!/usr/bin/env node
// Kombinatorické testy recepcie podľa zásad zhody v2 (oprava 5), bez prehliadača.
//
//   node --test source/tools/recepcia-kombinacie-test.mjs
//
// Zásady (podrobne stavba-v5/ZASADY-ZHODY.md, verzia 2):
//  P1 priama odpoveď (cena, trvanie, služba) len keď ju vysvetlí celá otázka: každé obsahové slovo patrí víťaznej
//     položke alebo malým triedam výplňových slov (opytovacie, cenové, časové, zdvorilosti, zámená, spojky)
//  P2 inak „Myslíš toto?“ (voľby položiek, ktorých slová otázka obsahuje) alebo odovzdanie
//  P3 cena vždy vo výreze cenníka (riadok zvýraznený, susedné riadky skupiny, doslovne zo stránky)
//  P4 trvanie len z price-time danej služby; položka bez trvania = odovzdanie; strih + brada len bez inej veci
//  P5 čisté kmene: zdieľaný kmeň len medzi výslovne povolenými dvojicami položiek, kmeň služby s cenou
//     nezachytí časové slovo ani príplatok
//  P6 kombinácie z dát v 8 jazykoch: dvojice položiek, trvanie × položka, cenové a časové slovo × položka,
//     časové príslovky, príplatky, dni, triedy kontroly 4 (k4/trieda-k4.mjs) a otázky skeptika
// Podmienka všetkých kombinácií: 0 holých odpovedí (cena alebo trvanie), ktoré nevysvetlia všetky menované veci.
// Otázky sa skladajú z JSON (názvy z cenníka, kmene, časové slová položky trvanie, kmene dní z položky hodiny)
// a z krátkych šablón jazyka; nie sú to ručne vybrané otázky z nálezov (okrem testu skeptika, ktorý ich opakuje).
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { odpovedz, norm, zhoda, vyrez } = await import(new URL('../../assets/recepcia.js', import.meta.url));
const citaj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const JAZYKY = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const KB = Object.fromEntries(JAZYKY.map((l) => [l, citaj(`assets/recepcia/${l}.json`)]));

const FRAZA = {
  cena: { sk: 'Koľko stojí', en: 'How much is', de: 'Was kostet', cs: 'Kolik stojí', pl: 'Ile kosztuje', hu: 'Mennyibe kerül', sr: 'Koliko košta', uk: 'Скільки коштує' },
  cas: { sk: 'Ako dlho trvá', en: 'How long does it take:', de: 'Wie lange dauert', cs: 'Jak dlouho trvá', pl: 'Jak długo trwa', hu: 'Meddig tart', sr: 'Koliko traje', uk: 'Скільки триває' },
};
/* slová iného významu (P5): príplatok, šediny a odfarbenie v jazyku stránky; šablóny, nie kmene */
const PRIPLATOK = { sk: 'príplatok', en: 'surcharge', de: 'Aufpreis', cs: 'příplatek', pl: 'dopłata', hu: 'felár', sr: 'doplata', uk: 'доплата' };
const SEDINY = { sk: 'šedín', en: 'grey hair', de: 'graue Haare', cs: 'šedin', pl: 'siwych włosów', hu: 'ősz haj', sr: 'sede kose', uk: 'сивини' };
const ODFARB = { sk: 'odfarbenie', en: 'bleaching', de: 'Blondierung', cs: 'odbarvení', pl: 'rozjaśnianie', hu: 'szőkítés', sr: 'izbeljivanje', uk: 'освітлення' };

const cenaText = (r) => /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
const hola = (r) => r.typ === 'odpoved' && cenaText(r);
const popis = (r) => `${r.typ} ${r.id ?? ''}${r.sluzba ? ':' + r.sluzba : ''}${Array.isArray(r.p) ? ' [' + r.p.map((x) => x.id) + ']' : ''}`;
const tokeny = (p) => p.kluc.split('|').map((g) => g.trim().split(/\s+/).filter(Boolean));
const kmen = (t) => t.replace('!', '').toLowerCase();
const silne = (p) => tokeny(p).flat().filter((t) => /^=?[A-Z]/.test(t) || t.endsWith('!'));
const slovo = (t) => kmen(t).replace(/^=/, '').replace('_', ' ');
const cenova = (p) => !!p.odpoved && JSON.stringify(p.odpoved).includes('€');
const nazov = (p) => p.odpoved.filter(Array.isArray)[0][0];
const mena = (p) => (p.odpoved || []).filter(Array.isArray).map((f) => norm(f[0]));
/* položka P vysvetlí slovo w: istá zhoda s kmeňom alebo slovo celého názvu z cenníka (miernejšie ako modul) */
const vysvetli = (P, w) => tokeny(P).flat().some((t) => !t.includes('_') && zhoda(w, kmen(t)) >= 0.9) || mena(P).some((m) => m.split(' ').includes(w));
/* obsahové slová otázky: bez stop, cenových, výplňových, zdvorilých slov a spojok, od 3 znakov, nie čísla */
function obsah(kb, q) {
  const L = (s) => (s || '').split(' ').filter(Boolean), stop = L(kb.stop), ine = [...L(kb.cenove), ...L(kb.vypln), ...L(kb.zdvor), ...L(kb.spoj)];
  return norm(q).split(' ').filter((w) => w.length > 2 && !/^\d+$/.test(w) && !stop.includes(w) && !ine.some((k) => w.startsWith(k)));
}
/* P1: holá odpoveď musí vysvetliť všetky menované veci (slová), inak je to chyba */
function overP1(kb, q, slova, chyby) {
  const r = odpovedz(q, kb);
  if (!hola(r)) return r;
  const P = r.sluzba ? kb.polozky.find((x) => x.id === r.sluzba) : r.p, T = casova(kb);
  // pri trvaní sú časové slová (prvá skupina položky trvanie) súčasťou otázky na trvanie
  const nevysv = slova.filter((w) => !vysvetli(P, w) && !(r.id === T.id && vysvetli({ kluc: T.kluc.split('|')[0] }, w)));
  if (r.sluzba == null && r.id === T.id) { if (nevysv.length) chyby.push(`${kb.jazyk} „${q}“ → ${popis(r)}: trvanie strihu a brady pri menovanej veci`); }
  else if (nevysv.length) chyby.push(`${kb.jazyk} „${q}“ → ${popis(r)}: nevysvetlí ${nevysv.join(', ')}`);
  return r;
}
const casova = (kb) => kb.polozky.find((p) => p.pravidlo === 'cas');
/* slovo položky B, ktoré položka A nevysvetlí (silný kmeň, inak akýkoľvek) */
const slovoInej = (A, B) => [...silne(B), ...tokeny(B).flat()].filter((t) => !'>'.includes(t[0])).map(slovo).find((w) => w.length > 2 && !w.includes(' ') && !vysvetli(A, w) && vysvetli(B, w));
const vypis = (chyby, n) => { if (chyby.length) console.log(chyby.slice(0, 25).join('\n')); console.log(`otázok ${n}, chýb ${chyby.length}`); };

test('P6a: dvojice položiek – služba s cenou × každá iná položka (s cenou, bez ceny, téma nevieme)', () => {
  const chyby = []; let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const T = casova(kb), spoj = kb.spoj.split(' ')[0];
    for (const A of kb.polozky.filter((p) => cenova(p) && p.odpoved.some(Array.isArray))) {
      for (const B of [...kb.polozky, ...kb.nevieme].filter((p) => p !== A && p !== T)) {
        const w = slovoInej(A, B);
        if (!w) continue;
        for (const q of [`${FRAZA.cena[l]} ${nazov(A)} ${spoj} ${w}?`, `${FRAZA.cena[l]} ${w} ${nazov(A)}?`]) {
          n++; overP1(kb, q, obsah(kb, q), chyby);
        }
      }
    }
  }
  vypis(chyby, n);
  assert.equal(chyby.length, 0, chyby.slice(0, 5).join('\n'));
});

test('P6b: trvanie × každá položka – trvanie len služby s price-time, nikdy strih a brada pri inej veci (P4)', () => {
  const chyby = []; let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const T = casova(kb), casove = tokeny(T)[0].map(slovo);
    const frazy = [FRAZA.cas[l], ...casove.map((t) => `${FRAZA.cena[l]} ${t}`)];
    for (const P of [...kb.polozky, ...kb.nevieme].filter((p) => p !== T)) {
      const w = [...silne(P), ...tokeny(P).flat()].filter((t) => !'>'.includes(t[0])).map(slovo).find((x) => x.length > 2 && !casove.includes(x));
      if (!w) continue;
      for (const f of frazy) {
        const q = `${f} ${w}?`, r = odpovedz(q, kb); n++;
        if (r.typ !== 'odpoved' || r.id !== T.id) continue;
        if (!r.sluzba) chyby.push(`${l} „${q}“ → ${popis(r)}: trvanie strihu a brady pri menovanej veci`);
        else if (r.sluzba !== P.id && !vysvetli(kb.polozky.find((x) => x.id === r.sluzba), w)) chyby.push(`${l} „${q}“ → ${popis(r)}: trvanie inej služby`);
        else if (!kb.polozky.find((x) => x.id === r.sluzba).cas) chyby.push(`${l} „${q}“ → ${popis(r)}: služba bez trvania`);
      }
    }
    // len časové slovo (bez veci) = trvanie strihu a brady alebo odovzdanie, nikdy cena
    for (const t of casove) for (const q of [t, `${FRAZA.cena[l]} ${t}?`]) {
      const r = odpovedz(q, kb); n++;
      if (r.typ === 'odpoved' && JSON.stringify(r.p.odpoved).includes('€')) chyby.push(`${l} „${q}“ → ${popis(r)}: cena pri časovom slove`);
    }
  }
  vypis(chyby, n);
  assert.equal(chyby.length, 0, chyby.slice(0, 5).join('\n'));
});

test('P6c: cenové a časové slovo × každá položka s cenou, príplatok, dni, šediny, odfarbenie (P1, P5)', () => {
  const chyby = []; let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const T = casova(kb), casove = tokeny(T)[0].map(slovo), H = kb.polozky.find((p) => p.id === 'hodiny');
    const dni = silne(H).map(slovo).filter((w) => w.length > 2);
    const brada = silne(kb.polozky.find((p) => p.id === 'cena-brada')).map(slovo);
    const farb = silne(kb.polozky.find((p) => p.id === 'farbenie-brady')).map(slovo).filter((w) => !brada.includes(w));
    const cenove = kb.polozky.filter((p) => cenova(p) && p.odpoved.some(Array.isArray));
    const q1 = [];
    for (const P of cenove) {
      for (const t of casove) q1.push(`${FRAZA.cena[l]} ${t} ${nazov(P)}?`);
      for (const d of dni) q1.push(`${FRAZA.cena[l]} ${nazov(P)} ${d}?`);
      q1.push(`${FRAZA.cena[l]} ${PRIPLATOK[l]} ${nazov(P)}?`);
    }
    for (const d of dni) q1.push(`${FRAZA.cena[l]} ${PRIPLATOK[l]} ${d}?`);
    for (const t of casove) q1.push(`${FRAZA.cena[l]} ${PRIPLATOK[l]} ${t}?`);
    q1.push(`${FRAZA.cena[l]} ${PRIPLATOK[l]}?`);
    for (const f of farb) q1.push(`${FRAZA.cena[l]} ${f} ${SEDINY[l]}?`);
    for (const b of brada) q1.push(`${FRAZA.cena[l]} ${ODFARB[l]} ${b}?`);
    for (const q of q1) { n++; overP1(kb, q, obsah(kb, q), chyby); }
  }
  vypis(chyby, n);
  assert.equal(chyby.length, 0, chyby.slice(0, 5).join('\n'));
});

test('P6d: triedy kontroly 4 – trvanie × položka bez trvania (A), farbenie vlasov × služba s cenou (B)', () => {
  // prenesené z stavba-v5/k4/trieda-k4.mjs (rovnaké šablóny a výber kmeňov)
  const T = { sk: 'kolko minut', en: 'how many minutes', de: 'wie viele minuten', hu: 'hany perc', cs: 'kolik minut', pl: 'ile minut', uk: 'скільки хвилин', sr: 'koliko minuta' };
  const C = { sk: 'kolko stoji', en: 'how much is', de: 'was kostet', hu: 'mennyibe kerul', cs: 'kolik stoji', pl: 'ile kosztuje', uk: 'скільки коштує', sr: 'koliko kosta' };
  const sil = (p) => p.kluc.split('|')[0].trim().split(/\s+/).filter((t) => /^[A-ZÀ-ÞĀ-Ž]/.test(t) || t.endsWith('!')).map((t) => t.replace(/[!=]/g, '').toLowerCase()).filter((t) => t.length > 2 && !/^\d/.test(t));
  const A = [], B = []; let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    for (const p of kb.polozky.filter((p) => !p.cas && !cenova(p) && !p.pravidlo)) for (const s of sil(p)) {
      const q = `${T[l]} ${s}`, r = odpovedz(q, kb); n++;
      if (r.typ === 'odpoved' && r.id === 'trvanie') A.push(`${l} „${q}“ → ${popis(r)}`);
    }
    const fv = kb.polozky.find((p) => p.id === 'farbenie-vlasov');
    const vsetky = new Set(kb.polozky.filter(cenova).flatMap((p) => p.kluc.replace(/\|/g, ' ').split(/\s+/).map((t) => t.replace(/[!=]/g, '').toLowerCase())));
    for (const s of sil(fv).filter((s) => !vsetky.has(s))) for (const y of kb.polozky.filter((p) => cenova(p) && !p.pravidlo && p.id !== 'farbenie-brady' && p.odpoved.some(Array.isArray))) {
      const q = `${C[l]} ${s} ${nazov(y).split(/\s+/).pop()}`, r = odpovedz(q, kb); n++;
      if (r.typ === 'odpoved' && cenova(r.p)) B.push(`${l} „${q}“ → ${popis(r)}`);
    }
  }
  vypis([...A, ...B], n);
  assert.equal(A.length + B.length, 0, [...A, ...B].slice(0, 5).join('\n'));
});

/* otázky skeptika (stavba-v5/skeptik/otazky*.txt) a sondy kontroly 4 (k4/sondy-k4b.txt, k4/sondy-k4c.txt);
   tretí stĺpec: položky, ktoré smú dať holú cenu (trvanie:služba pri trvaní); prázdny = žiadna holá cena ani trvanie */
const SKEPTIK = `sk|Koľko stojí strih?|cena-strih
sk|Kolko stoji uprava brady?|cena-brada
sk|Ako dlho trvá oholenie hlavy?|trvanie:hlava
sk|Koľko stojí strih a melír?|
sk|Koľko stojí strih a trvalá ondulácia?|
sk|Ako dlho trvá čakanie na voľné miesto?|
sk|Koľko minút trvá parkovanie?|
sk|Koľko stojí darčeková poukážka?|
sk|Dá sa platiť kartou?|
sk|Koľko stojí strih pre dcéru?|
sk|Koľko stojí strih pre 14-ročného?|
sk|Koľko stojí šampón na bradu?|
sk|Koľko dlho sa strihá?|trvanie:cena-strih
sk|Robíte aj predĺženie vlasov? Koľko stojí?|
sk|Koľko stojí strih s umytím a masážou hlavy?|
sk|Koľko stojí odfarbenie fúzov?|
sk|Koľko stojí strih v nedeľu?|
sk|Koľko stojí zafarbenie šedín na hlave?|
sk|Mám alergiu na farbu, koľko stojí farbenie brady?|
sk|Kde ste?|
cs|Kolik stojí holení na hladko?|holenie
cs|Kolik stojí stříhání vousů a melír?|
cs|Jak dlouho se čeká?|
cs|Kolik stojí střih pro manželku?|
cs|Kolik stojí dárkový poukaz?|
en|How much is a haircut?|cena-strih
en|How long is a beard trim?|trvanie:cena-brada
en|How much for a haircut and highlights?|
en|How long do I have to wait for a coffee?|
en|How much is a perm?|
en|How much is a haircut for my daughter?|
en|Do you take credit cards?|
en|How much is a gift voucher?|
en|thanks a lot|
de|Was kostet ein Herrenhaarschnitt?|cena-strih
de|Was kostet Haarschnitt und Strähnchen?|
de|Wie lange muss ich warten?|
de|Was kostet ein Haarschnitt für meine Tochter?|
de|Was kostet Bartöl?|
hu|Mennyibe kerül a hajvágás és a melír?|
hu|Mennyi ideig kell várni?|
hu|Mennyibe kerül a szakállfestés?|farbenie-brady
hu|Mennyibe kerül a női hajvágás?|
pl|Ile kosztuje strzyżenie i pasemka?|
pl|Jak długo trwa rezerwacja?|
pl|Ile kosztuje strzyżenie dla córki?|
pl|Ile kosztuje golenie głowy?|hlava
uk|Скільки коштує стрижка і мелірування?|
uk|Скільки хвилин чекати?|
uk|Скільки коштує стрижка бороди?|cena-brada
sr|Koliko dugo se čeka?|
sr|Koliko je doplata za subotu?|
sr|Koliko košta šišanje i trajna?|
sr|Koliko košta brijanje glave?|hlava
sk|Koľko stojí ostrihanie a tónovanie vlasov?|
sk|Koľko stojí strih a blond prameene?|
sk|Koľko stojí farbenie vlasov na hlave?|
sk|Ako dlho trvá melír?|
sk|Koľko minút trvá rezervácia cez telefón?|
sk|Ako dlho máte otvorené v sobotu?|
sk|Koľko stojí holenie a melír?|
sk|Koľko stojí úprava obočia a trvalá?|
sk|Koľko stojí strih pre psa?|
sk|Koľko stojí strih vo štvrtok večer?|cena-strih
sk|Koľko stojí strih pre vnuka, má 16?|
sk|Koľko stojí strih a čierna farba?|
cs|Kolik stojí střih a barvení vlasů?|
cs|Jak dlouho trvá rezervace?|
en|How long is the wait?|
en|How much is a haircut and a perm?|
en|How much is bleaching my beard?|
en|How long does a perm take?|
de|Wie lange dauert eine Dauerwelle?|
de|Was kostet Bart und Dauerwelle?|
hu|Mennyibe kerül a szakáll és dauer?|
pl|Ile kosztuje farbowanie siwych włosów?|
uk|Скільки коштує фарбування сивини?|
sr|Koliko traje rezervacija?|
sk|Koľko stojí strih s melírom?|
sk|Koľko stojí strih a farbenie vlasov?|
sk|Koľko stojí pánsky strih a blond?|
sk|Koľko stojí strih a odfarbenie?|
sk|Koľko stojí úprava brady a melír?|
en|How much is a haircut with highlights?|
en|How much is a men's haircut and colouring?|
de|Was kostet Haarschnitt mit Strähnchen?|
de|Was kostet Haarschnitt und Dauerwelle?|
hu|Mennyibe kerül hajvágás és melír?|
hu|Mennyibe kerül hajvágás és hajfestés?|
cs|Kolik stojí střih a melír?|
cs|Kolik stojí střih a trvalá?|
pl|Ile kosztuje strzyżenie i trwała?|
uk|Скільки коштує стрижка і фарбування волосся?|
sr|Koliko košta šišanje i pramenovi?|
sr|Koliko košta šišanje i farbanje kose?|
sk|Koľko minút sa čaká v čakárni?|
sk|Ako dlho trvá rezervácia?|
sk|Koľko minút trvá online rezervácia?|
sk|Ako dlho trvá káva?|
sk|Ako dlho trvá kým zdvihnete telefón?|
sk|Koľko minút pred zatvorením môžem prísť?|
sk|Koľko dlho sa čaká?|
sk|Koľko dlho budem čakať na strih?|
sk|Koľko stojí melír brady?|
sk|Koľko stojí blond brada?|
sk|Koľko stojí trvalá na bradu?|
sk|Koľko stojí tónovanie obočia?|obocie
sk|Koľko stojí melír obočia?|
sk|Koľko stojí blond obočie?|
sk|Koľko stojí zafarbenie šedín?|
sk|Koľko stojí prekrytie šedín?|
sk|Koľko stojí farbenie šedivých vlasov?|
sk|Koľko stojí šedivá brada?|farbenie-brady
sk|Je príplatok za sobotu?|
sk|Koľko je príplatok za víkend?|
sk|Koľko je príplatok za večer?|
sk|Je príplatok za strih v sobotu?|
sk|Koľko stojí strih online?|
sk|Koľko stojí strih cez víkend?|
sk|Koľko stojí strih v sobotu?|
sk|Koľko stojí brada s kávou?|
en|How long does the coffee take?|
en|How many minutes do I wait in the waiting room?|
en|How long does booking take?|
en|How much is beard toning?|farbenie-brady
en|How much is beard bleaching?|
en|How much is grey coverage?|
en|How much is a perm for the beard?|
en|Is there a Saturday surcharge?|
en|How much extra on weekends?|
hu|Mennyi ideig tart a foglalás?|
hu|Hány percet kell várni a kávéra?|
hu|Mennyibe kerül a szakáll melír?|
sr|Koliko dugo traje čekanje?|
sr|Koliko dugo ste otvoreni subotom?|
sr|Koliko dugo se čeka na šišanje?|
cs|Kolik minut se čeká?|
cs|Kolik stojí tónování vousů?|farbenie-brady
cs|Je příplatek za sobotu?|
pl|Ile minut się czeka?|
pl|Ile kosztuje tonowanie brody?|farbenie-brady
pl|Czy jest dopłata za sobotę?|
de|Wie lange dauert die Reservierung?|
de|Wie viele Minuten wartet man?|
de|Was kostet Bart tönen?|farbenie-brady
de|Gibt es einen Samstagszuschlag?|
uk|Скільки хвилин чекати?|
uk|Скільки триває бронювання?|
uk|Скільки коштує тонування бороди?|farbenie-brady
uk|Чи є доплата за суботу?|`;

test('P6e: otázky skeptika a sondy kontroly 4 – holá cena alebo trvanie len pri správnej službe', () => {
  const chyby = [], riadky = SKEPTIK.split('\n');
  for (const r0 of riadky) {
    const [l, q, ok] = r0.split('|'), r = odpovedz(q, KB[l]);
    if (!hola(r)) continue;
    const id = r.sluzba ? `trvanie:${r.sluzba}` : r.id;
    if (!ok.split(',').includes(id)) chyby.push(`${l} „${q}“ → ${popis(r)}, smie: ${ok || 'nič'}`);
  }
  vypis(chyby, riadky.length);
  assert.equal(chyby.length, 0, chyby.join('\n'));
});

/* P5: dvojice položiek, ktoré smú zdieľať kmeň (spoločný význam na stránke); všetko ostatné je chyba dát */
const POVOLENE = `adresa ceny-konecne|balicky cena-strih-brada|balicky co-je-v-strihu|balicky ultra|bez-objednania hodiny|bez-objednania online
bez-objednania rezervacia|bez-objednania storno|bez-objednania vyber-barbera|bezbarierovy recepcia|cena-brada cena-strih-brada|cena-brada farbenie-brady
cena-brada obocie|cena-brada plet|cena-brada produkty|cena-brada trvanie|cena-dlhe cena-strih|cena-dlhe cena-strih-brada|cena-dlhe ceny-konecne
cena-dlhe co-je-v-strihu|cena-dlhe depilacia|cena-dlhe deti|cena-dlhe farbenie-vlasov|cena-dlhe ornament|cena-dlhe produkty|cena-dlhe romana-ceny
cena-dlhe tim|cena-dlhe trvanie|cena-dlhe ultra|cena-dlhe vyber-barbera|cena-dlhe vysledky|cena-strih cena-strih-brada|cena-strih co-je-v-strihu
cena-strih deti|cena-strih tim|cena-strih trvanie|cena-strih vyber-barbera|cena-strih vysledky|cena-strih-brada co-je-v-strihu|cena-strih-brada deti
cena-strih-brada farbenie-brady|cena-strih-brada obocie|cena-strih-brada produkty|cena-strih-brada tim|cena-strih-brada trvanie|cena-strih-brada vyber-barbera
cena-strih-brada vysledky|ceny-konecne co-je-v-strihu|ceny-konecne storno|co-je-v-strihu deti|co-je-v-strihu hlava|co-je-v-strihu tim|co-je-v-strihu trvanie
co-je-v-strihu vyber-barbera|co-je-v-strihu vysledky|depilacia deti|depilacia farbenie-vlasov|depilacia ornament|depilacia produkty|depilacia romana-ceny
deti farbenie-vlasov|deti odkedy|deti ornament|deti produkty|deti romana-ceny|deti sviatky|deti tim|deti trvanie|deti vek|deti vyber-barbera|deti vysledky
farbenie-brady farbenie-vlasov|farbenie-brady obocie|farbenie-brady produkty|farbenie-brady romana-ceny|farbenie-brady trvanie|farbenie-vlasov obocie
farbenie-vlasov ornament|farbenie-vlasov produkty|farbenie-vlasov romana-ceny|farbenie-vlasov vysledky|hlava holenie|hodiny odkedy|hodiny online
hodiny romana-ceny|hodiny trvanie|jazyky-tim rezervacia|obocie romana-ceny|odkedy romana-ceny|odkedy trvanie|odkedy vek|online rezervacia|online storno
online sviatky|online vyber-barbera|ornament produkty|ornament romana-ceny|ornament vysledky|platba vernost|plet zdravie|poukazky produkty
pripomienka vysledky|produkty romana-ceny|produkty trvanie|produkty vysledky|recepcia telefon|rezervacia storno|rezervacia vyber-barbera
romana-ceny vysledky|skolenia tim|skolenia vyber-barbera|socialne vysledky|storno vyber-barbera|sviatky vek|tim trvanie|tim vyber-barbera|tim vysledky
trvanie vyber-barbera|trvanie vysledky|vyber-barbera vysledky`.split(/[|\n]/).map((s) => s.trim());

test('P5: lint dát – zdieľaný kmeň len medzi povolenými dvojicami; služba s cenou nezachytí časové slovo ani príplatok', () => {
  const chyby = [];
  for (const [l, kb] of Object.entries(KB)) {
    const vlastnik = {};
    for (const p of [...kb.polozky, ...kb.nevieme]) for (const t of new Set(tokeny(p).flat().map(kmen))) (vlastnik[t] ||= new Set()).add(p.id);
    for (const [k, ids] of Object.entries(vlastnik)) {
      const s = [...ids].sort();
      for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (!POVOLENE.includes(`${s[i]} ${s[j]}`)) chyby.push(`${l}: kmeň „${k}“ zdieľajú ${s[i]} a ${s[j]} (dvojica nie je povolená)`);
    }
    const T = casova(kb), casove = tokeny(T)[0].map(slovo).filter((w) => !w.includes(' '));
    for (const p of kb.polozky.filter((p) => p !== T && (cenova(p) || p.cas))) {
      const G = tokeny(p);
      for (const t of G.flat()) {
        const k = kmen(t);
        // výnimka: časové slovo, ktoré je aj prídavným menom (en long, de lange), smie byť v jednej z dvoch skupín
        // (samo položku nevysvetlí, P1 chce zásah všetkých skupín)
        const jednaSkupina = G.length > 1 && !G.every((g) => g.includes(t));
        for (const w of casove) if (zhoda(w, k) >= 0.9 && !jednaSkupina) chyby.push(`${l}/${p.id}: kmeň „${k}“ zachytí časové slovo „${w}“`);
        if (silne({ kluc: t }).length) for (const w of norm(PRIPLATOK[l]).split(' ')) if (zhoda(w, k) >= 0.9) chyby.push(`${l}/${p.id}: silný kmeň „${k}“ zachytí príplatok „${w}“`);
      }
    }
  }
  if (chyby.length) console.log(chyby.slice(0, 30).join('\n'));
  console.log(`povolených dvojíc ${POVOLENE.length}, chýb ${chyby.length}`);
  assert.equal(chyby.length, 0, chyby.slice(0, 5).join('\n'));
});

/* P3: výrez cenníka – nadpis a riadky sú zo stránky (sk: index.html, ostatné: slovník stránky cez generátor) */
test('P3: výrez cenníka – zvýraznený riadok služby, susedné riadky tej istej skupiny, doslovne zo stránky', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), txt = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const skupiny = [...html.matchAll(/<section class="price-group"[\s\S]*?<\/section>/g)].map(([s]) => [txt(/price-group-title[^>]*>([\s\S]*?)<\/h3>/.exec(s)[1]),
    [...s.matchAll(/price-name">([\s\S]*?)<\/h4>[\s\S]*?price-time">([\s\S]*?)<\/p>[\s\S]*?price-amount">([\s\S]*?)<\/p>/g)].map((m) => [txt(m[1]), txt(m[2]), txt(m[3])])]);
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const riadky = (ids) => ids.flatMap((s) => { const [id, i] = s.split(':'), P = kb.polozky.find((x) => x.id === id); return P.odpoved.filter(Array.isArray).map((f, j) => [f[0], P.cas[j], f[1]]).filter((x, j) => i == null || j === +i); });
    assert.equal(kb.cennik.length, skupiny.length, `${l}: počet skupín cenníka`);
    kb.cennik.forEach(([nadpis, ...ids], gi) => {
      const r = riadky(ids);
      if (l === 'sk') { assert.equal(nadpis, skupiny[gi][0], `sk: nadpis skupiny ${gi}`); assert.deepEqual(r, skupiny[gi][1], `sk: riadky skupiny ${nadpis} = index.html`); }
      else assert.equal(r.length, skupiny[gi][1].length, `${l}: počet riadkov skupiny ${nadpis}`);
    });
    for (const P of kb.polozky.filter((p) => cenova(p) && p.odpoved.some(Array.isArray))) {
      const v = vyrez(P, kb); n++;
      assert.ok(v, `${l}/${P.id}: výrez cenníka`);
      const [nadpis, rr] = v, skupina = kb.cennik.find((g) => g[0] === nadpis), vsetky = riadky(skupina.slice(1)).map((x) => x[0]);
      const hl = rr.filter((x) => x[3]).map((x) => x[0]), ceny = P.odpoved.filter(Array.isArray).filter((f) => /€$/.test(f[1]));
      assert.deepEqual(hl, ceny.map((f) => f[0]), `${l}/${P.id}: zvýraznené sú práve riadky služby`);
      for (const [a, t, c] of rr) assert.ok(kb.polozky.some((Q) => Q.odpoved.filter(Array.isArray).some((f, j) => f[0] === a && f[1] === c && Q.cas[j] === t)), `${l}/${P.id}: riadok ${a} ${t} ${c} je z cenníka`);
      const ix = rr.map((x) => vsetky.indexOf(x[0]));
      assert.ok(ix.every((i, k) => k === 0 || i === ix[k - 1] + 1), `${l}/${P.id}: riadky výrezu idú za sebou`);
      if (vsetky.length > 1) assert.ok(rr.length >= 2, `${l}/${P.id}: výrez má aj susedný riadok`);
      for (const i of hl.map((h) => vsetky.indexOf(h))) for (const j of [i - 1, i + 1]) if (j >= 0 && j < vsetky.length) assert.ok(rr.some((x) => x[0] === vsetky[j]), `${l}/${P.id}: chýba susedný riadok ${vsetky[j]}`);
    }
  }
  console.log(`výrezov cenníka: ${n}`);
});
