#!/usr/bin/env node
// Test recepcie (assets/recepcia.js + assets/recepcia/<jazyk>.json), bez prehliadača.
//
//   node --test source/tools/recepcia-test.mjs
//
// Kontroly:
//  1. porozumenie (sk): sada otázok s očakávaným id (preklepy, bez diakritiky, hovorové tvary) – ≥ 90 % správnych,
//     0 falošných odpovedí na témy „nevieme“ (otázka na platbu nikdy nedostane položku), fallback ≤ 15 %
//  2. rýchlosť: priemer aj najpomalšia otázka < 5 ms (po zahriatí; najlepší z 5 behov, aby nerozhodoval šum GC a zaťaženie stroja)
//  3. obsah: každý zdroj index.html:riadok existuje a riadok (po odstránení značiek) obsahuje každú vetu odpovede
//     aj trvanie (cas); zdroj a overene sú v assets/recepcia/zdroje.json (rovnaké pre všetky jazyky, modul ich nečíta);
//     položky ≥ 30, témy nevieme ≥ 19, akcie len z kontakt + panel.akcie, dátum overene nie starší než 90 dní.
//     Schéma JSON: otazky[0] je zobrazovaná otázka, ďalšie sú varianty (v sk len tam, kde menia odpoveď; celý názov
//     služby z cenníka je variant sám osebe), kluc = kmene oddelené medzerou (veľké začiatočné písmeno alebo
//     „!“ = silný kmeň, „=“ = len celé slovo, „|“ = skupiny), spoj = spojky, odovzdanie = predmet (modul doplní panel.nepotvrdene)
//     alebo celá veta s bodkou
//  4. jazyky: každý assets/recepcia/<jazyk>.json má rovnaké id v rovnakom poradí; veta, ktorá má kľúč v
//     assets/i18n/<jazyk>.json, je preložená presne tak ako na stránke; pár otázok v danom jazyku
//  5. váha: recepcia.js + recepcia.css + sk.json ≤ 11 264 B gzip, s iným jazykom ≤ 12 800 B; bez zakázaných označení
//  6.–14. triedy podľa pravidiel zhody (p. 1–7 v komentároch recepcia.js); otázky sa skladajú z dát a šablón,
//     nie z nálezov kontroly:
//     p. 1 kmeň do 4 znakov len presne alebo s koncovkou najviac +3, preklep len pri kmeni od 5 znakov (test 6)
//     p. 2 neznáme obsahové slovo od 4 znakov pri službe s cenou → „Myslíš toto?“ alebo odovzdanie (test 7)
//     p. 3 špecifickejšia služba vyhrá; slovo inej služby, ktoré víťaz nevysvetlí, alebo spojená služba
//          (strih a brada) bez spojky → „Myslíš toto?“ s oboma (testy 8, 12, 13)
//     p. 4 osoba, miesto, vek a produkt mimo ponuky → téma nevieme, ktorá vetuje cenu (test 9)
//     p. 5 zdvorilosť a krátka správa → úvodná veta a voľby, nikdy cena (test 10)
//     p. 6 trvanie je trvanie menovanej služby (test 11)
//     p. 7 cena alebo trvanie len pri istej zhode so silným kmeňom služby (slovo z názvu alebo opisu služby na
//          stránke) alebo s celým názvom služby; súčasť balíka, nástroj či prenesené slovo je slabý kmeň (test 14)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = (p) => path.join(ROOT, p);
const { odpovedz, norm, zhoda } = await import(new URL('../../assets/recepcia.js', import.meta.url));
const citaj = (p) => JSON.parse(fs.readFileSync(R(p), 'utf8'));
const sk = citaj('assets/recepcia/sk.json'), zdroje = citaj('assets/recepcia/zdroje.json');
const JAZYKY = ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'].filter((l) => fs.existsSync(R(`assets/recepcia/${l}.json`)));

/* [otázka, očakávané id alebo zoznam prijateľných id]; témy „nevieme“ sú označené prefixom '?' */
const SADA = [
  // hodiny / teraz
  ['Kedy máte otvorené?', 'hodiny'], ['otvaracie hodiny', 'hodiny'], ['do kolkej mate otvorene', 'hodiny'], ['Máte v sobotu otvorené?', 'hodiny'],
  ['v nedelu otvorene?', 'hodiny'], ['Dokedy ste otvorení v piatok?', 'hodiny'], ['kedy otvarate rano', 'hodiny'], ['otvorne hodiny', 'hodiny'],
  ['Kedy zatvárate?', 'hodiny'], ['cez vikend otvorene', 'hodiny'], ['Je teraz otvorené?', 'hodiny'], ['mate dnes otvorene', 'hodiny'],
  ['je momentalne otvorene?', 'hodiny'], ['Stihnem to ešte dnes?', 'hodiny'], ['ste prave otvoreni', 'hodiny'],
  // adresa / telefón / e-mail
  ['Kde vás nájdem?', 'adresa'], ['adresa', 'adresa'], ['kde ste', 'adresa'], ['Na akej ulici ste?', 'adresa'], ['kde sa nachadzate v nitre', 'adresa'],
  ['ako sa k vam dostanem', 'adresa'], ['Mostna', 'adresa'], ['Aké máte číslo?', 'telefon'], ['telefon', 'telefon'], ['kam mam zavolat', 'telefon'],
  ['telefonne cislo na recepciu', 'telefon'], ['kontakt', 'telefon'], ['mozem vam zavolat?', 'telefon'], ['Máte e-mail?', 'email'], ['mail', 'email'],
  ['kam mam napisat email', 'email'], ['emailova adresa', 'email'],
  // rezervácia / online
  ['Ako si rezervujem termín?', 'rezervacia'], ['chcem sa objednat', 'rezervacia'], ['rezervacia', 'rezervacia'], ['ako sa objednam', 'rezervacia'],
  ['booking', 'rezervacia'], ['Kde si rezervujem termín?', 'rezervacia'], ['ako si dohodnut termin', 'rezervacia'], ['chcem si zarezervovat termín', 'rezervacia'],
  ['Dá sa objednať online aj večer?', 'online'], ['rezervacia online v noci', 'online'], ['objednat online', 'online'], ['da sa objednat cez vikend online', 'online'],
  ['funguje rezervacia nonstop', 'online'], ['online rezervácia', 'online'],
  // ceny
  ['Koľko stojí pánsky strih?', 'cena-strih'], ['kolko stoji strih', 'cena-strih'], ['cena strihu', 'cena-strih'], ['strih cena', 'cena-strih'],
  ['Kolko stoji ostrihanie?', 'cena-strih'], ['co stoji fade', 'cena-strih'], ['pansky strih', 'cena-strih'], ['kolko je strih', 'cena-strih'],
  ['Koľko stojí strih s bradou?', 'cena-strih-brada'], ['strih a brada spolu', 'cena-strih-brada'], ['strih s upravou brady cena', 'cena-strih-brada'],
  ['kolko stoji strih aj brada', 'cena-strih-brada'], ['Koľko stojí úprava brady?', 'cena-brada'], ['brada', 'cena-brada'], ['upravit bradu', 'cena-brada'],
  ['kolko stoji brada', 'cena-brada'], ['zastrihnut bradu', 'cena-brada'], ['fuzy', 'cena-brada'], ['Mám dlhé vlasy, je to drahšie?', 'cena-dlhe'],
  ['dlhe vlasy', 'cena-dlhe'], ['strih dlhych vlasov cena', 'cena-dlhe'], ['vlasy nad 10 cm', 'cena-dlhe'], ['je priplatok za dlhsie vlasy', 'cena-dlhe'],
  ['Strihate aj deti?', 'deti'], ['detsky strih', 'deti'], ['strih pre chlapca', 'deti'], ['kolko stoji detsky strih', 'deti'], ['strihate aj male deti', 'deti'],
  ['do kolkych rokov strihate deti', 'deti'], ['syn 8 rokov strih', 'deti'],
  ['Robíte holenie britvou?', 'holenie'], ['holenie', 'holenie'], ['hot towel', 'holenie'], ['holenie do hladka', 'holenie'], ['robite klasicke holenie', 'holenie'],
  ['oholit bradu', 'holenie'], ['Oholíte mi hlavu?', 'hlava'], ['oholenie hlavy', 'hlava'], ['dohola', 'hlava'], ['strih na nulu', 'cena-strih'], ['holenie hlavy cena', 'hlava'],
  ['Máte balíčky?', 'balicky'], ['balicek', 'balicky'], ['balik sluzieb', 'balicky'], ['co je v balicku 1', 'balicky'], ['kompletny balik cena', 'balicky'],
  ['Čo je Ultra inclusive?', 'ultra'], ['ultra inclusive', 'ultra'], ['balicek s whisky', 'ultra'], ['najdrahsi balicek', 'ultra'], ['co obsahuje ultra', 'ultra'],
  ['Robíte starostlivosť o pleť?', 'plet'], ['peeling', 'plet'], ['maska na tvar', 'plet'], ['osetrenie pleti', 'plet'], ['plet premium cena', 'plet'],
  ['Upravujete obočie?', 'obocie'], ['obocie', 'obocie'], ['farbenie obocia', 'obocie'], ['farbite obocie', 'obocie'], ['uprava obocia cena', 'obocie'],
  ['Robíte depiláciu uší?', 'depilacia'], ['depilacia usi', 'depilacia'], ['chlpky v nose', 'depilacia'], ['vosk usi a nos', 'depilacia'], ['depilacia nosa', 'depilacia'],
  ['Farbíte bradu?', 'farbenie-brady'], ['farbenie brady', 'farbenie-brady'], ['zafarbit bradu', 'farbenie-brady'], ['kolko stoji farbenie brady', 'farbenie-brady'],
  ['sediva brada farba', 'farbenie-brady'], ['Robíte vzory do vlasov?', 'ornament'], ['ornament', 'ornament'], ['tribal', 'ornament'], ['hair tattoo', 'ornament'],
  ['ciary vo vlasoch', 'ornament'], ['vystrihnut vzor', 'ornament'],
  ['Sú to konečné ceny?', 'ceny-konecne'], ['cennik', 'ceny-konecne'], ['ake mate ceny', 'ceny-konecne'], ['ceny', 'ceny-konecne'], ['plati sa nieco navyse', 'ceny-konecne'],
  ['skryte poplatky', 'ceny-konecne'], ['kde najdem cennik', 'ceny-konecne'],
  ['Farbíte vlasy?', 'farbenie-vlasov'], ['melir', 'farbenie-vlasov'], ['robite trvalu', 'farbenie-vlasov'], ['farbenie vlasov', 'farbenie-vlasov'],
  ['chcem zafarbit vlasy', 'farbenie-vlasov'], ['blond', 'farbenie-vlasov'], ['robite melir', 'farbenie-vlasov'], ['odfarbenie vlasov', 'farbenie-vlasov'],
  // tím
  ['Kto u vás strihá?', 'tim'], ['barberi', 'tim'], ['tim', 'tim'], ['mena barberov', 'tim'], ['kolko mate barberov', 'tim'], ['kto tu pracuje', 'tim'],
  ['aky mate tim', 'tim'], ['Môžem si vybrať barbera?', 'vyber-barbera'], ['ku komu sa mozem objednat', 'vyber-barbera'], ['konkretny barber', 'vyber-barbera'],
  ['chcem ist ku konkretnemu barberovi', 'vyber-barbera'], ['oblubeny barber', 'vyber-barbera'], ['mozem si zvolit kto ma ostriha', 'vyber-barbera'],
  // ostatné
  ['Čo všetko je v pánskom strihu?', 'co-je-v-strihu'], ['co je v strihu', 'co-je-v-strihu'], ['ako prebieha strih', 'co-je-v-strihu'], ['umyjete mi aj vlasy', 'co-je-v-strihu'], ['umytie hlavy', 'co-je-v-strihu'], ['kolko stoji umytie hlavy', 'co-je-v-strihu'],
  ['je v cene aj styling', 'co-je-v-strihu'], ['co strih obsahuje', 'co-je-v-strihu'], ['postup strihu', 'co-je-v-strihu'],
  ['Máte kde počkať?', 'kava'], ['kava', 'kava'], ['cakaren', 'kava'], ['je kava zadarmo', 'kava'], ['obcerstvenie', 'kava'], ['mozem pockat na kamarata', 'kava'],
  ['Koľko máte kresiel?', 'kresla'], ['kolko kresiel', 'kresla'], ['kapacita', 'kresla'], ['ako velky je podnik', 'kresla'],
  ['Odkedy fungujete?', 'odkedy'], ['ako dlho fungujete', 'odkedy'], ['od ktoreho roku', 'odkedy'], ['kedy ste vznikli', 'odkedy'], ['historia podniku', 'odkedy'],
  ['Máte Instagram?', 'socialne'], ['instagram', 'socialne'], ['facebook', 'socialne'], ['socialne siete', 'socialne'], ['ig', 'socialne'], ['fb', 'socialne'],
  ['kde vas sledovat', 'socialne'], ['Máte recepciu?', 'recepcia'], ['recepcia', 'recepcia'], ['kto ma privita', 'recepcia'], ['je tam recepcna', 'recepcia'],
  // preklepy a skomoleniny
  ['kedy mate otovrene', 'hodiny'], ['rezrvacia terminu', 'rezervacia'], ['kolko stoji panksy strih', 'cena-strih'], ['uprava bardy', '!'] /* pravidlo 1: preklep v kmeni do 4 znakov sa nehádá */,
  ['kolko stoji strich', 'cena-strih'], ['holenei britvou', 'holenie'], ['intsagram', 'socialne'], ['adrsa', 'adresa'], ['telefonne cislo', 'telefon'], ['balicky', 'balicky'], ['kde vas najdme', 'adresa'],
  // témy „nevieme“ (25+)
  ['Dá sa platiť kartou?', '?platba'], ['platba kartou', '?platba'], ['beriete karty', '?platba'], ['mate terminal', '?platba'], ['da sa platit hotovostou', '?platba'],
  ['apple pay', '?platba'], ['ako sa u vas plati', '?platba'], ['Máte darčekové poukážky?', '?poukazky'], ['voucher', '?poukazky'], ['chcem kupit poukaz', '?poukazky'],
  ['darcek pre priatela', '?poukazky'], ['kolko stoji poukazka', '?poukazky'], ['Ako zruším termín?', '?storno'], ['chcem zmenit termin', '?storno'], ['meskam 10 minut', '?storno'],
  ['storno poplatok', '?storno'], ['mozem termin presunut', '?storno'], ['chodi sms pripomienka', '?pripomienka'], ['poslete upozornenie den vopred', '?pripomienka'],
  ['Môžem prísť bez objednania?', '?bez-objednania'], ['bez rezervacie', '?bez-objednania'], ['pridem hned', '?bez-objednania'], ['walk in', '?bez-objednania'],
  ['Máte otvorené cez sviatky?', '?sviatky'], ['vianoce', '?sviatky'], ['otvorene na silvestra', '?sviatky'], ['velka noc otvorene', '?sviatky'],
  ['Kde zaparkujem?', '?parkovanie'], ['parkovanie', '?parkovanie'], ['mate parkovisko', '?parkovanie'], ['ktory autobus', '?parkovanie'], ['mhd zastavka', '?parkovanie'],
  ['bezbarierovy vchod', '?bezbarierovy'], ['dostanem sa dnu na voziku', '?bezbarierovy'], ['je tam schod', '?bezbarierovy'],
  ['mate whatsapp', '?whatsapp'], ['viber', '?whatsapp'], ['messenger', '?whatsapp'], ['predavate produkty', '?produkty'], ['kupim u vas pomadu', '?produkty'],
  ['ake znacky predavate', '?produkty'], ['olej na bradu', '?produkty'],
  // vosk na vlasy nikdy nedostane cenu depilácie (kontrola kola 2, V5)
  ['kolko stoji vosk na vlasy', '?produkty'], ['cena vosku na vlasy', '?produkty'], ['kolko stoji depilacia usi voskom', 'depilacia'], ['depilacia voskom', 'depilacia'],
  ['kolko stoji farbenie vlasov', '?romana-ceny'], ['cena meliru', '?romana-ceny'],
  ['kedy robi romana', '?romana-ceny'], ['kolko stoji trvala', '?romana-ceny'], ['vernostna karticka', '?vernost'], ['mate vernostny program', '?vernost'],
  ['zbieram body', '?vernost'], ['mate zlavy', '?vernost'], ['mate fotky strihov', '?vysledky'], ['ukazky prace', '?vysledky'], ['fotky pred a po', '?vysledky'],
  ['portfolio', '?vysledky'], ['hovorite anglicky', '?jazyky-tim'], ['do you speak english', '?jazyky-tim'], ['dohovorim sa po madarsky', '?jazyky-tim'],
  ['kolko mate hviezdiciek', '?hodnotenie'], ['recenzie', '?hodnotenie'], ['ake mate hodnotenie', '?hodnotenie'], ['robite skolenia', '?skolenia'], ['barber kurz', '?skolenia'],
  ['hladate barberov', '?skolenia'], ['ponukate pracu', '?skolenia'], ['ako dlho trva strih', 'trvanie'], ['kolko minut trva uprava brady', 'trvanie'],
  ['kolko trva strih', 'trvanie'], ['trvanie strihu', 'trvanie'], ['strihate aj zeny', '?damske'], ['damsky strih', '?damske'], ['damsky strih cena', '?damske'],
  ['strihate aj dievcata', '?damske'], ['moze prist aj manzelka', '?damske'],
  // strih pre ženu nikdy nedostane cenu pánskeho strihu (kontrola kola 2, V4)
  ['strihate aj damy?', '?damske'], ['kolko stoji strih pre damy', '?damske'], ['ostrihate aj babu?', '?damske'], ['ostrihate aj moju frajerku', '?damske'],
  ['strihate aj slecny', '?damske'], ['dam si ostrihat bradu', ['cena-brada', 'cena-strih-brada']], ['kolko stoji masaz', '?cena-ina-sluzba'], ['cena manikury', '?cena-ina-sluzba'],
  ['kolko stoji masaz hlavy', '?cena-ina-sluzba'], ['masaz hlavy', '?cena-ina-sluzba'], ['kolko stoji pedikura', '?cena-ina-sluzba'], ['kolko stoji botox', '?cena-ina-sluzba'],
  ['mam alergiu na farbu', '?zdravie'], ['mam citlivu pokozku a vyrazky po holeni', '?zdravie'], ['mam ekzem', '?zdravie'],
  // mimo témy: smie byť len fallback alebo nevieme, nikdy odpoveď
  ['aké bude zajtra počasie', '!'], ['predávate pizzu', '!'], ['asdf qwer', '!'], ['kedy hrá slovan', '!'], ['oprava mobilov', '!'],
];

const vysledky = SADA.map(([q, oc]) => ({ q, oc, r: odpovedz(q, sk) }));
const spravne = (v) => {
  if (v.oc === '!') return v.r.typ === 'fallback' || v.r.typ === 'nevieme';
  const ids = [].concat(v.oc);
  if (ids[0].startsWith('?')) return v.r.typ === 'nevieme' && ids.map((x) => x.slice(1)).includes(v.r.id);
  if (v.r.typ === 'odpoved') return ids.includes(v.r.id);
  if (v.r.typ === 'vyber') return ids.includes(v.r.p[0].id);
  return false;
};

test('1. porozumenie: ≥ 90 % správnych id, 0 falošných na nevieme, fallback ≤ 15 %', () => {
  const zle = vysledky.filter((v) => !spravne(v));
  const nevieme = vysledky.filter((v) => typeof v.oc === 'string' && v.oc.startsWith('?'));
  const falosne = nevieme.filter((v) => v.r.typ === 'odpoved' || v.r.typ === 'vyber');
  const fallback = vysledky.filter((v) => v.r.typ === 'fallback' && v.oc !== '!');
  const vyber = vysledky.filter((v) => v.r.typ === 'vyber');
  const pct = (100 * (vysledky.length - zle.length)) / vysledky.length;
  console.log(`otázok: ${vysledky.length} (z toho nevieme ${nevieme.length}), správne ${pct.toFixed(1)} %, falošné na nevieme ${falosne.length}, fallback ${fallback.length} (${((100 * fallback.length) / vysledky.length).toFixed(1)} %), ponuka „Myslíš toto?“ ${vyber.length}`);
  zle.forEach((v) => console.log(`  CHYBA „${v.q}“ → ${v.r.typ} ${v.r.id} (${v.r.skore.toFixed(2)}), čakané ${JSON.stringify(v.oc)}`));
  assert.ok(SADA.length >= 120, 'sada má aspoň 120 otázok');
  assert.ok(nevieme.length >= 25, 'aspoň 25 otázok na témy nevieme');
  assert.equal(falosne.length, 0, 'falošné odpovede na témy nevieme: ' + falosne.map((v) => `${v.q} → ${v.r.id}`).join('; '));
  assert.ok(pct >= 90, `správnych ${pct.toFixed(1)} % < 90 %`);
  assert.ok(fallback.length / vysledky.length <= 0.15, 'fallback nad 15 %');
});

test('2. rýchlosť: zhoda < 5 ms na otázku', () => {
  for (const [q] of SADA) odpovedz(q, sk); // zahriatie
  let max = 0, sum = 0;
  for (const [q] of SADA) { let t = Infinity; for (let i = 0; i < 5; i++) { const t0 = performance.now(); odpovedz(q, sk); t = Math.min(t, performance.now() - t0); } sum += t; max = Math.max(max, t); }
  console.log(`čas: priemer ${(sum / SADA.length).toFixed(3)} ms, najpomalšia ${max.toFixed(3)} ms`);
  assert.ok(max < 5, `najpomalšia otázka ${max.toFixed(2)} ms`);
});

/* text riadku index.html bez značiek a entít */
const html = fs.readFileSync(R('index.html'), 'utf8').split('\n');
const bezZnaciek = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const textZdroja = (z) => {
  const m = /^([\w.\-/]+):(\d+)(?:-(\d+))?$/.exec(z); assert.ok(m, `zdroj v tvare súbor:riadok: ${z}`);
  assert.equal(m[1], 'index.html', `zdroj mimo index.html: ${z}`);
  const od = +m[2], po = +(m[3] || m[2]); assert.ok(od >= 1 && po <= html.length && od <= po, `riadok mimo súboru: ${z}`);
  return html.slice(od - 1, po).map(bezZnaciek).join(' ');
};
const vety = (p) => [].concat(...p.odpoved.map((f) => (Array.isArray(f) ? f : [f]))).concat(p.zoznam || [], p.cas || []);

test('3. obsah: zdroje existujú, riadky obsahujú vety odpovedí, štruktúra', () => {
  const ids = new Set();
  assert.ok(sk.polozky.length >= 30, `položiek ${sk.polozky.length} < 30`);
  assert.ok(sk.nevieme.length >= 19, `tém nevieme ${sk.nevieme.length} < 19`);
  const dnes = new Date(), limit = 90 * 864e5;
  for (const p of sk.polozky) {
    assert.ok(!ids.has(p.id), `duplicitné id ${p.id}`); ids.add(p.id);
    const z = zdroje[p.id] || {};
    assert.ok(p.otazky.length >= 1 && p.kluc.length && p.odpoved.length && (z.zdroj || []).length && z.overene, `neúplná položka ${p.id}`);
    assert.ok(!('zdroj' in p) && !('overene' in p), `${p.id}: zdroj a overene patria do zdroje.json`);
    assert.ok(dnes - new Date(z.overene) <= limit, `položka ${p.id} overená pred viac než 90 dňami (${z.overene})`);
    assert.ok(!p.cas || p.cas.length === p.odpoved.filter(Array.isArray).length, `${p.id}: cas nezodpovedá riadkom cenníka`);
    const text = z.zdroj.map(textZdroja).join(' ');
    for (const v of vety(p)) assert.ok(text.includes(bezZnaciek(v)), `${p.id}: veta „${v}“ nie je v ${z.zdroj.join(', ')}`);
    for (const a of p.akcie || []) assert.ok(sk.kontakt[a] && sk.panel.akcie[a], `${p.id}: akcia ${a} bez kontaktu alebo popisu`);
  }
  assert.deepEqual(Object.keys(zdroje), sk.polozky.map((p) => p.id), 'zdroje.json má presne položky sk.json');
  for (const n of sk.nevieme) {
    assert.ok(!ids.has(n.id), `duplicitné id ${n.id}`); ids.add(n.id);
    assert.ok(n.otazky.length >= 1 && (n.kluc.length || n.pravidlo) && n.odovzdanie, `neúplná téma nevieme ${n.id}`);
    assert.ok(!n.odovzdanie.endsWith('.') || /neuvádzame|nemáme|nevieme|neviem nájsť/.test(n.odovzdanie), `${n.id}: odovzdanie netvrdí nič nové`);
    assert.ok((n.akcie || []).length, `${n.id}: bez cesty na recepciu`);
    for (const a of n.akcie || []) assert.ok(sk.kontakt[a] && sk.panel.akcie[a], `${n.id}: akcia ${a} bez kontaktu alebo popisu`);
  }
  for (const k of Object.keys(sk.panel.volby)) assert.ok(sk.kontakt[k] || ids.has(k), `rýchla voľba ${k} bez položky ani kontaktu`);
  assert.ok(/0951 267 203/.test(sk.odovzdanie) && /0951 267 203/.test(sk.fallback), 'odovzdanie a fallback bez telefónu recepcie');
  const bezDia = [...sk.polozky, ...sk.nevieme].filter((p) => p.otazky.some((o) => /[a-z]/.test(o) && o === norm(o).replace(/ /g, ' ') && /[^a-z0-9 ?]/.test(o) === false));
  console.log(`položiek s variantom bez diakritiky: ${bezDia.length}`);
  console.log(`položiek ${sk.polozky.length}, tém nevieme ${sk.nevieme.length}, zdrojov ${sk.polozky.reduce((a, p) => a + zdroje[p.id].zdroj.length, 0)}`);
});

const normI = (s) => String(s).replace(/\s+/g, ' ').trim();
const OTAZKY_JAZYK = {
  en: [['When are you open?', 'hodiny'], ['How much is a haircut?', 'cena-strih'], ['Where are you?', 'adresa'], ['Can I pay by card?', '?platba'], ['Do you have parking?', '?parkovanie'], ['How do I book?', 'rezervacia'], ['Do you cut kids hair?', 'deti'], ['womens haircut', '?damske'], ['how much is hair wax', '?produkty'], ['nose wax price', 'depilacia'],
    ['how much is a head massage', '?cena-ina-sluzba'], ['how much is a haircit', 'cena-strih'], ['how much is a manicure', '?cena-ina-sluzba'], ['opening hours', 'hodiny'], ['phone number', 'telefon'], ['beard trim price', 'cena-brada'], ['loyalty card', '?vernost'], ['gift voucher', '?poukazky'], ['do you speak english', '?jazyky-tim'], ['how long does a haircut take', 'trvanie'], ['is there coffee', 'kava'], ['book online at night', 'online'], ['what is the weather tomorrow', '!']],
  de: [['Wann habt ihr geöffnet?', 'hodiny'], ['Was kostet ein Haarschnitt?', 'cena-strih'], ['Wo seid ihr?', 'adresa'], ['Kann ich mit Karte zahlen?', '?platba'], ['Gibt es Parkplätze?', '?parkovanie'], ['Wie buche ich einen Termin?', 'rezervacia'], ['Schneidet ihr auch Kinder?', 'deti'], ['Damenhaarschnitt', '?damske'], ['was kostet Haarwachs', '?produkty'], ['was kostet Wachs für die Haare', '?produkty'], ['was kostet Ohrenwachs', 'depilacia'],
    ['was kostet eine Kopfmassage', '?cena-ina-sluzba'], ['was kostet ein Haarschnit', 'cena-strih'], ['Öffnungszeiten', 'hodiny'], ['Telefonnummer', 'telefon'], ['Was kostet Bart trimmen?', 'cena-brada'], ['Treuekarte', '?vernost'], ['Gutschein', '?poukazky'], ['Wie lange dauert ein Haarschnitt?', 'trvanie'], ['Macht ihr Dauerwelle?', 'farbenie-vlasov'], ['online buchen', 'online'], ['Gibt es Kaffee?', 'kava'], ['wie wird das Wetter morgen', '!']],
  cs: [['Kdy máte otevřeno?', 'hodiny'], ['Kolik stojí střih?', 'cena-strih'], ['Kde vás najdu?', 'adresa'], ['Dá se platit kartou?', '?platba'], ['Kde zaparkuju?', '?parkovanie'], ['Jak si rezervuju termín?', 'rezervacia'], ['Stříháte i děti?', 'deti'], ['dámský střih', '?damske'], ['stříháte i dámy?', '?damske'], ['kolik stojí střih pro dámy', '?damske'], ['kolik stojí vosk na vlasy', '?produkty'], ['kolik stojí depilace uší voskem', 'depilacia'],
    ['kolik stojí masáž hlavy', '?cena-ina-sluzba'], ['kolik stoji strich', 'cena-strih'], ['otevírací doba', 'hodiny'], ['telefonní číslo', 'telefon'], ['kolik stojí úprava vousů', 'cena-brada'], ['věrnostní kartička', '?vernost'], ['dárkový poukaz', '?poukazky'], ['jak dlouho trvá střih', 'trvanie'], ['máte kávu', 'kava'], ['rezervace online', 'online'], ['jaké bude zítra počasí', '!']],
  pl: [['Kiedy jesteście otwarci?', 'hodiny'], ['Ile kosztuje strzyżenie?', 'cena-strih'], ['Gdzie jesteście?', 'adresa'], ['Czy można płacić kartą?', '?platba'], ['Gdzie zaparkować?', '?parkovanie'], ['Jak zarezerwować termin?', 'rezervacia'], ['Czy strzyżecie dzieci?', 'deti'], ['strzyżenie damskie', '?damske'], ['czy strzyżecie panie', '?damske'], ['ile kosztuje strzyżenie dla pań', '?damske'], ['strzyżenie dla panów', 'cena-strih'], ['ile kosztuje wosk do włosów', '?produkty'], ['ile kosztuje depilacja uszu woskiem', 'depilacia'],
    ['ile kosztuje masaż głowy', '?cena-ina-sluzba'], ['godziny otwarcia', 'hodiny'], ['numer telefonu', 'telefon'], ['ile kosztuje broda', 'cena-brada'], ['karta lojalnościowa', '?vernost'], ['bon podarunkowy', '?poukazky'], ['jak długo trwa strzyżenie', 'trvanie'], ['robicie trwałą', 'farbenie-vlasov'], ['jest kawa', 'kava'], ['jaka będzie jutro pogoda', '!']],
  hu: [['Mikor vagytok nyitva?', 'hodiny'], ['Mennyibe kerül a hajvágás?', 'cena-strih'], ['Hol vagytok?', 'adresa'], ['Lehet kártyával fizetni?', '?platba'], ['Van parkoló?', '?parkovanie'], ['Hogyan foglalok időpontot?', 'rezervacia'], ['Gyerekeket is vágtok?', 'deti'], ['női hajvágás', '?damske'], ['mennyibe kerül a hajwax', '?produkty'],
    ['mennyibe kerül a fejmasszázs', '?cena-ina-sluzba'], ['nyitvatartás', 'hodiny'], ['telefonszám', 'telefon'], ['mennyibe kerül a szakáll', 'cena-brada'], ['hűségkártya', '?vernost'], ['ajándékutalvány', '?poukazky'], ['meddig tart a hajvágás', 'trvanie'], ['van kávé', 'kava'], ['online foglalás', 'online'], ['milyen idő lesz holnap', '!']],
  sr: [['Kada ste otvoreni?', 'hodiny'], ['Koliko košta šišanje?', 'cena-strih'], ['Gde se nalazite?', 'adresa'], ['Može li karticom?', '?platba'], ['Ima li parking?', '?parkovanie'], ['Kako da zakažem termin?', 'rezervacia'], ['Šišate li decu?', 'deti'], ['žensko šišanje', '?damske'], ['koliko košta vosak za kosu', '?produkty'], ['koliko košta depilacija ušiju voskom', 'depilacia'],
    ['koliko košta masaža glave', '?cena-ina-sluzba'], ['radno vreme', 'hodiny'], ['broj telefona', 'telefon'], ['koliko košta brada', 'cena-brada'], ['kartica lojalnosti', '?vernost'], ['poklon vaučer', '?poukazky'], ['koliko traje šišanje', 'trvanie'], ['radite li trajnu', 'farbenie-vlasov'], ['ima li kafe', 'kava'], ['kakvo će biti vreme sutra', '!']],
  uk: [['Коли ви відчинені?', 'hodiny'], ['Скільки коштує стрижка?', 'cena-strih'], ['Де ви знаходитесь?', 'adresa'], ['Можна платити карткою?', '?platba'], ['Є парковка?', '?parkovanie'], ['Як записатися?', 'rezervacia'], ['Стрижете дітей?', 'deti'], ['жіноча стрижка', '?damske'], ['скільки коштує віск для волосся', '?produkty'], ['скільки коштує депіляція вух воском', 'depilacia'],
    ['скільки коштує масаж голови', '?cena-ina-sluzba'], ['години роботи', 'hodiny'], ['номер телефону', 'telefon'], ['скільки коштує борода', 'cena-brada'], ['картка лояльності', '?vernost'], ['подарунковий сертифікат', '?poukazky'], ['скільки триває стрижка', 'trvanie'], ['є кава', 'kava'], ['запис онлайн', 'online'], ['яка завтра погода', '!']],
};

for (const l of JAZYKY) {
  test(`4. jazyk ${l}: rovnaké id, preklady viet ako na stránke, otázky v jazyku`, () => {
    const kb = citaj(`assets/recepcia/${l}.json`), i18n = citaj(`assets/i18n/${l}.json`);
    assert.equal(kb.jazyk, l);
    assert.deepEqual(kb.polozky.map((p) => p.id), sk.polozky.map((p) => p.id), 'id položiek');
    assert.deepEqual(kb.nevieme.map((p) => p.id), sk.nevieme.map((p) => p.id), 'id tém nevieme');
    assert.deepEqual(Object.keys(kb.panel.volby), Object.keys(sk.panel.volby), 'rýchle voľby');
    assert.deepEqual(Object.keys(kb.panel.akcie), Object.keys(sk.panel.akcie), 'popisy akcií');
    // popisy tlačidiel, nadpis, Zavrieť a rýchle voľby: ak má slovenský text kľúč v slovníku stránky, preklad je ten istý
    for (const [k, v] of Object.entries(sk.panel.akcie)) if (typeof i18n[v] === 'string') assert.equal(kb.panel.akcie[k], i18n[v], `akcia ${k}`);
    for (const [k, v] of Object.entries(sk.panel.volby)) if (typeof i18n[v] === 'string') assert.equal(kb.panel.volby[k], i18n[v], `voľba ${k}`);
    for (const k of ['nadpis', 'zavriet', 'odoslat']) if (typeof i18n[sk.panel[k]] === 'string') assert.equal(kb.panel[k], i18n[sk.panel[k]], `panel.${k}`);
    assert.equal(kb.kontakt.tel, sk.kontakt.tel); assert.equal(kb.kontakt.email, sk.kontakt.email); assert.equal(kb.kontakt.rezervacia, sk.kontakt.rezervacia);
    let prelozene = 0;
    sk.polozky.forEach((p, i) => {
      const t = kb.polozky[i];
      assert.ok(t.otazky.length >= 2 && t.kluc.length, `${l}/${p.id}: chýbajú varianty alebo kmene`);
      assert.equal(t.odpoved.length, p.odpoved.length, `${l}/${p.id}: iný počet viet`);
      const a = vety(p), b = vety(t);
      assert.equal(a.length, b.length, `${l}/${p.id}: iný počet úryvkov`);
      a.forEach((v, j) => { const k = normI(v); if (typeof i18n[k] === 'string') { assert.equal(normI(b[j]), normI(i18n[k]), `${l}/${p.id}: „${v}“ má v slovníku iný preklad`); prelozene++; } });
      assert.equal(!!t.poznamka, !!p.poznamka, `${l}/${p.id}: poznámka`);
      assert.equal(t.pravidlo, p.pravidlo, `${l}/${p.id}: pravidlo`);
      assert.ok(!('zdroj' in t) && !('overene' in t), `${l}/${p.id}: zdroj a overene patria do zdroje.json`);
      assert.deepEqual(t.akcie || [], p.akcie || [], `${l}/${p.id}: akcie`);
    });
    sk.nevieme.forEach((p, i) => { const t = kb.nevieme[i]; assert.ok(t.otazky.length >= 1 && (t.kluc.length || t.pravidlo) && t.odovzdanie, `${l}/${p.id}: téma nevieme neúplná`); assert.deepEqual(t.akcie || [], p.akcie || [], `${l}/${p.id}: akcie`); assert.equal(t.pravidlo, p.pravidlo, `${l}/${p.id}: pravidlo`); });
    assert.ok(kb.stop && kb.cenove && kb.vypln && kb.zdvor && kb.fallback && kb.odovzdanie && kb.panel.uvod && kb.panel.nepotvrdene, `${l}: chýba stop, cenove, vypln, zdvor, fallback, odovzdanie, úvod alebo šablóna nepotvrdené`);
    const v = (OTAZKY_JAZYK[l] || []).map(([q, oc]) => ({ q, oc, r: odpovedz(q, kb) }));
    const zle = v.filter((x) => !spravne(x));
    zle.forEach((x) => console.log(`  ${l} CHYBA „${x.q}“ → ${x.r.typ} ${x.r.id} (${x.r.skore.toFixed(2)}), čakané ${x.oc}`));
    console.log(`${l}: viet so slovníkovým prekladom ${prelozene}, otázok ${v.length}, správne ${v.length - zle.length}`);
    assert.equal(zle.length, 0, `${l}: nesprávne odpovede`);
  });
}

/* zakázané označenia skladané z častí, aby sa v súbore nevyskytovali ako slová */
const ZAKAZANE = new RegExp(['\\bA' + 'I\\b', 'ume' + 'l[áa] inte' + 'ligenc', 'chat' + 'bot', 'asis' + 'tent', 'assis' + 'tant'].join('|'), 'i');
test('5. váha: ≤ 11 264 B gzip (sk), ≤ 12 800 B s iným jazykom; bez zakázaných označení', () => {
  const gz = (p) => (fs.existsSync(R(p)) ? zlib.gzipSync(fs.readFileSync(R(p)), { level: 6 }).length : 0);
  const js = gz('assets/recepcia.js'), css = gz('assets/recepcia.css'), skj = gz('assets/recepcia/sk.json');
  console.log(`gzip: recepcia.js ${js} B, recepcia.css ${css} B, sk.json ${skj} B, spolu ${js + css + skj} B`);
  assert.ok(js + css + skj <= 11264, `spolu ${js + css + skj} B > 11 264 B`);
  for (const l of JAZYKY) { const g = gz(`assets/recepcia/${l}.json`); console.log(`gzip: ${l}.json ${g} B, spolu s modulom ${js + css + g} B`); assert.ok(js + css + g <= 12800, `${l}: ${js + css + g} B > 12 800 B`); }
  const subory = ['assets/recepcia.js', 'assets/recepcia.css', 'assets/recepcia/sk.json', 'assets/recepcia/zdroje.json', 'source/tools/recepcia-test.mjs', ...JAZYKY.map((l) => `assets/recepcia/${l}.json`)].filter((p) => fs.existsSync(R(p)));
  for (const p of subory) assert.ok(!ZAKAZANE.test(fs.readFileSync(R(p), 'utf8')), `${p}: zakázané označenie`);
});

/* ---- triedy podľa pravidiel zhody ----
   Otázky sa skladajú z dát (názvy služieb z cenníka, kmene) a zo šablón; nie sú to otázky z nálezov kontroly. */
const KB = Object.fromEntries(['sk', ...JAZYKY].map((l) => [l, l === 'sk' ? sk : citaj(`assets/recepcia/${l}.json`)]));
const cena = (r) => r.typ === 'odpoved' && /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
const popis = (r) => `${r.typ} ${r.id ?? ''}${r.sluzba ? ':' + r.sluzba : ''}${Array.isArray(r.p) ? ' [' + r.p.map((x) => x.id) + ']' : ''}`;
/* pseudonáhodné nezmyselné slovo (bez samohlások na začiatku kmeňov), rovnaké pri každom behu */
let semienko = 30;
const nahodne = () => { let w = 'zq'; for (let i = 0; i < 5; i++) { semienko = (semienko * 1103515245 + 12345) % 2147483648; w += 'bcdfghjklmnprstvxz'[semienko % 18]; } return w; };
const cenove = (p) => p.odpoved.filter(Array.isArray).length && JSON.stringify(p.odpoved).includes('€');
const nazov = (p) => p.odpoved.filter(Array.isArray)[0][0];
const FRAZA = {
  cena: { sk: 'Koľko stojí', en: 'How much is', de: 'Was kostet', cs: 'Kolik stojí', pl: 'Ile kosztuje', hu: 'Mennyibe kerül', sr: 'Koliko košta', uk: 'Скільки коштує' },
  cas: { sk: 'Ako dlho trvá', en: 'How long does it take:', de: 'Wie lange dauert', cs: 'Jak dlouho trvá', pl: 'Jak długo trwa', hu: 'Meddig tart', sr: 'Koliko traje', uk: 'Скільки триває' },
};

test('6. pravidlo 1: kmeň do 4 znakov len presne alebo s koncovkou najviac +3; preklep len pri kmeni od 5 znakov', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of [...kb.polozky, ...kb.nevieme]) for (const t of p.kluc.split(/[\s|]+/).filter(Boolean)) {
    if (t[0] === '=') continue;
    const k = t.replace('!', '').toLowerCase();
    n++;
    assert.equal(zhoda(k, k), 1, `${l} ${k}: presná zhoda`);
    if (k.length < 5) {
      assert.equal(zhoda(k + 'qxzv', k), 0, `${l} ${k}: slovo dlhšie o 4 znaky nesmie mať zhodu`);
      assert.ok(zhoda(k + 'qxz', k) > 0, `${l} ${k}: koncovka +3 má zhodu`);
      if (k.length < 4) assert.equal(zhoda(k + 'qx', k), 0.6, `${l} ${k}: krátky kmeň s dlhou koncovkou je neistý`);
      if (k.length > 2 && k[1] !== k[2]) assert.equal(zhoda(k[0] + k[2] + k[1] + k.slice(3) + 'a', k), 0, `${l} ${k}: preklep v krátkom kmeni sa nehádá`);
    } else if (k[1] !== k[2]) assert.ok(zhoda(k[0] + k[2] + k[1] + k.slice(3) + 'a', k) >= 0.6, `${l} ${k}: prehodené písmená v kmeni od 5 znakov sú preklep`);
  }
  console.log(`kmeňov skontrolovaných: ${n}`);
});

test('7. pravidlo 2: neznáme slovo pri službe nedostane holú cenu ani trvanie', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) {
    for (const q of [`${FRAZA.cena[l]} ${nazov(p)} ${nahodne()}`, `${nahodne()} ${nazov(p)}`]) {
      const r = odpovedz(q, kb); n++;
      assert.ok(!cena(r), `${l} „${q}“ → ${popis(r)}: holá cena pri neznámom slove`);
      if (r.typ === 'vyber') assert.ok(r.p.length >= 1, 'Myslíš toto? s kandidátom');
    }
  }
  // kmeň do 3 znakov s cudzou koncovkou (napr. det-ox) nie je istá zhoda
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) for (const t of p.kluc.split(/[\s|]+/)) {
    const k = t.replace(/[=!]/g, '').toLowerCase();
    if (k.length !== 3 || t[0] === '=') continue;
    const q = `${FRAZA.cena[l]} ${k}qya`, r = odpovedz(q, kb); n++;
    assert.ok(!cena(r), `${l} „${q}“ → ${popis(r)}`);
  }
  console.log(`otázok s neznámym slovom: ${n}`);
});

test('8. pravidlo 3: názov služby z cenníka vedie na tú službu (špecifickejšia vyhrá)', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) for (const q of [nazov(p), `${FRAZA.cena[l]} ${nazov(p)}?`]) {
    const r = odpovedz(q, kb); n++;
    const ok = (r.typ === 'odpoved' && r.id === p.id) || (r.typ === 'vyber' && r.p[0].id === p.id);
    assert.ok(ok, `${l} „${q}“ → ${popis(r)}, čakané ${p.id}`);
  }
  console.log(`názvov služieb: ${n}`);
});

const TRIEDY = {
  osoba: {
    sk: [['Ostriháte aj {}?', 'Koľko stojí strih pre {}?'], ['mamu', 'mamičku', 'babku', 'babičku', 'sestru', 'tetu', 'kamarátku', 'svokru', 'dcéru', 'manželku', 'priateľku', 'susedku', 'neter', 'krstnú mamu', 'švagrinú', 'kolegyňu']],
    en: [["Can you cut my {}'s hair?", 'How much is a haircut for my {}?'], ['mom', 'mum', 'mother', 'grandma', 'sister', 'aunt', 'daughter', 'wife', 'girlfriend', 'niece', 'stepmother', 'godmother']],
    de: [['Schneidet ihr auch meine {}?', 'Was kostet ein Haarschnitt für meine {}?'], ['Mutter', 'Mama', 'Oma', 'Schwester', 'Tante', 'Tochter', 'Frau', 'Freundin', 'Nichte', 'Schwiegermutter', 'Patentante']],
    cs: [['Ostříháte i {}?', 'Kolik stojí střih pro {}?'], ['mámu', 'maminku', 'babičku', 'sestru', 'tetu', 'dceru', 'manželku', 'přítelkyni', 'tchyni', 'kamarádku', 'sousedku', 'neteř']],
    pl: [['Czy ostrzyżecie moją {}?', 'Ile kosztuje strzyżenie, chodzi o {}?'], ['mamę', 'babcię', 'siostrę', 'ciocię', 'córkę', 'żonę', 'dziewczynę', 'koleżankę', 'teściową', 'sąsiadkę']],
    hu: [['{} is megnyírjátok?', 'Mennyibe kerül a hajvágás, {} jönne?'], ['anyukámat', 'anyámat', 'nagymamámat', 'húgomat', 'nővéremet', 'feleségemet', 'barátnőmet', 'lányomat', 'nagynénémet']],
    sr: [['Šišate li moju {}?', 'Koliko košta šišanje za moju {}?'], ['mamu', 'baku', 'sestru', 'tetku', 'ćerku', 'suprugu', 'devojku', 'drugaricu', 'svekrvu', 'komšinicu']],
    uk: [['Чи підстрижете мою {}?', 'Скільки коштує стрижка, це для {}?'], ['маму', 'бабусю', 'сестру', 'тітку', 'доньку', 'дружину', 'дівчину', 'подругу', 'свекруху', 'сусідку']],
  },
  miesto: {
    sk: [['Strihate aj {}?', 'Koľko stojí strih {}?'], ['doma', 'v nemocnici', 'v domove dôchodcov', 'na svadbe', 'v hoteli', 'u mňa doma', 'vo firme', 'na chate']],
    en: [['Do you cut hair {}?', 'How much is a haircut {}?'], ['at home', 'in hospital', 'at a wedding', 'in a hotel', 'in a nursing home', 'at my office']],
    de: [['Schneidet ihr auch {}?', 'Was kostet ein Haarschnitt {}?'], ['zu Hause', 'im Krankenhaus', 'im Altenheim', 'auf einer Hochzeit', 'im Hotel', 'im Büro']],
    cs: [['Stříháte i {}?', 'Kolik stojí střih {}?'], ['doma', 'v nemocnici', 'v domově důchodců', 'na svatbě', 'v hotelu']],
    pl: [['Czy strzyżecie {}?', 'Ile kosztuje strzyżenie {}?'], ['w domu', 'w szpitalu', 'na weselu', 'w hotelu', 'z dojazdem']],
    hu: [['Vágtok hajat {}?', 'Mennyibe kerül a hajvágás {}?'], ['otthon', 'kórházban', 'esküvőn', 'szállodában', 'házhoz']],
    sr: [['Šišate li {}?', 'Koliko košta šišanje {}?'], ['kod kuće', 'u bolnici', 'na venčanju', 'u hotelu']],
    uk: [['Чи стрижете {}?', 'Скільки коштує стрижка {}?'], ['вдома', 'у лікарні', 'на весіллі', 'в готелі', 'з виїздом']],
  },
  vek: {
    sk: [['Syn má {} rokov, koľko stojí strih?', 'Strihate aj {}-ročných?'], ['11', '12', '13', '14', '15', '16', '17']],
    en: [['My son is {} years old, how much is a haircut?'], ['11', '12', '13', '14', '15', '16', '17']],
    de: [['Mein Sohn ist {} Jahre alt, was kostet ein Haarschnitt?'], ['11', '12', '13', '14', '15', '16', '17']],
    cs: [['Syn má {} let, kolik stojí střih?'], ['11', '12', '13', '14', '15', '16', '17']],
    pl: [['Syn ma {} lat, ile kosztuje strzyżenie?'], ['11', '12', '13', '14', '15', '16', '17']],
    hu: [['A fiam {} éves, mennyibe kerül a hajvágás?'], ['11', '12', '13', '14', '15', '16', '17']],
    sr: [['Sin ima {} godina, koliko košta šišanje?'], ['11', '12', '13', '14', '15', '16', '17']],
    uk: [['Синові {} років, скільки коштує стрижка?'], ['11', '12', '13', '14', '15', '16', '17']],
  },
  produkt: {
    sk: [['Koľko stojí {} na bradu?', 'Koľko stojí {} na vlasy?', 'Predávate {}?'], ['balzam', 'olej', 'vosk', 'pomádu', 'gél', 'šampón', 'hrebeň', 'kefu', 'sérum', 'sprej', 'kondicionér', 'krém']],
    en: [['How much is beard {}?', 'How much is hair {}?', 'Do you sell {}?'], ['balm', 'oil', 'wax', 'pomade', 'gel', 'shampoo', 'comb', 'brush', 'serum', 'spray', 'conditioner', 'cream']],
    de: [['Was kostet {}?', 'Verkauft ihr {}?'], ['Bartbalsam', 'Bartöl', 'Bartwachs', 'Haarwachs', 'Pomade', 'Haargel', 'Shampoo', 'Kamm', 'Bürste', 'Haarspray']],
    cs: [['Kolik stojí {} na vousy?', 'Prodáváte {}?'], ['balzám', 'olej', 'vosk', 'pomádu', 'gel', 'šampon', 'hřeben', 'kartáč', 'sérum']],
    pl: [['Ile kosztuje {} do brody?', 'Sprzedajecie {}?'], ['balsam', 'olejek', 'wosk', 'pomadę', 'żel', 'szampon', 'grzebień', 'szczotkę']],
    hu: [['Mennyibe kerül a {}?', 'Árultok {}?'], ['szakállolaj', 'szakállbalzsam', 'hajwax', 'pomádé', 'sampon', 'fésű', 'kefe', 'szakállviasz']],
    sr: [['Koliko košta {} za bradu?', 'Prodajete li {}?'], ['balzam', 'ulje', 'vosak', 'pomadu', 'gel', 'šampon', 'češalj', 'četku']],
    uk: [['Скільки коштує {} для бороди?', 'Чи продаєте {}?'], ['бальзам', 'олію', 'віск', 'помаду', 'гель', 'шампунь', 'гребінець', 'щітку']],
  },
};

test('9. pravidlo 4: osoba, miesto, vek a produkt mimo ponuky nedostanú cenu ani trvanie', () => {
  const stat = {};
  for (const [trieda, J] of Object.entries(TRIEDY)) for (const [l, [sablony, slova]] of Object.entries(J)) {
    if (!KB[l]) continue;
    for (const s of sablony) for (const w of slova) {
      const q = s.replace('{}', w), r = odpovedz(q, KB[l]);
      stat[trieda] = stat[trieda] || { n: 0, nevieme: 0 }; stat[trieda].n++; if (r.typ === 'nevieme') stat[trieda].nevieme++;
      assert.ok(!cena(r), `${trieda} ${l} „${q}“ → ${popis(r)}`);
    }
  }
  console.log('triedy (otázok / z toho téma nevieme): ' + Object.entries(stat).map(([k, v]) => `${k} ${v.n}/${v.nevieme}`).join(', '));
  // vek, ktorý stránka uvádza (do 10 rokov), ostáva detským strihom
  for (const q of ['Syn má 8 rokov, koľko stojí strih?', 'Strihate aj 5-ročných?']) {
    const r = odpovedz(q, sk);
    assert.ok((r.typ === 'odpoved' && r.id === 'deti') || (r.typ === 'vyber' && r.p[0].id === 'deti'), `„${q}“ → ${popis(r)}`);
  }
});

const ZDVOR = {
  sk: ['ďakujem', 'Ďakujem pekne!', 'dakujeme', 'vďaka', 'prepáčte', 'ahoj', 'čau', 'dobrý deň', 'ok', 'okej', 'super', 'fajn', 'dovidenia', 'sorry', 'dekujem', 'zdravím', 'rozumiem, ďakujem', 'merci'],
  en: ['thanks', 'thank you', 'thx', 'sorry', 'hello', 'hi', 'hey', 'ok', 'okay', 'good morning', 'great, thanks', 'bye', 'cheers', 'cool'],
  de: ['danke', 'danke schön', 'vielen Dank', 'hallo', 'servus', 'tschüss', 'guten Tag', 'guten Morgen', 'ok', 'super', 'Entschuldigung', 'alles klar'],
  cs: ['děkuji', 'díky', 'děkujeme', 'promiňte', 'ahoj', 'čau', 'dobrý den', 'ok', 'super', 'nashledanou', 'sorry'],
  pl: ['dziękuję', 'dzięki', 'przepraszam', 'cześć', 'dzień dobry', 'ok', 'super', 'do widzenia', 'sorry'],
  hu: ['köszönöm', 'köszi', 'bocsánat', 'szia', 'jó napot', 'helló', 'ok', 'szuper', 'viszlát'],
  sr: ['hvala', 'izvinite', 'zdravo', 'ćao', 'dobar dan', 'ok', 'super', 'prijatno', 'sorry'],
  uk: ['дякую', 'спасибі', 'вибачте', 'привіт', 'добрий день', 'ок', 'супер', 'до побачення', 'sorry'],
};

test('10. pravidlo 5: zdvorilosť a krátka správa nikdy nedostane cenu ani ponuku služby', () => {
  let n = 0, z = 0;
  for (const [l, a] of Object.entries(ZDVOR)) for (const q of a) {
    if (!KB[l]) continue;
    const r = odpovedz(q, KB[l]); n++; if (r.typ === 'zdvorilost') z++;
    assert.ok(r.typ === 'zdvorilost' || r.typ === 'fallback', `${l} „${q}“ → ${popis(r)}`);
  }
  console.log(`zdvorilostí ${n}, z toho rozpoznaných ${z}`);
  assert.ok(z / n >= 0.85, 'aspoň 85 % zdvorilostí dostane zdvorilú odpoveď');
  // zdvorilosť s otázkou ostáva otázkou
  const r = odpovedz('Dobrý deň, koľko stojí pánsky strih?', sk);
  assert.equal(r.id, 'cena-strih');
});

test('11. pravidlo 6: trvanie je trvanie menovanej služby; bez služby strih a brada; neznáma služba = odovzdanie', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    for (const p of kb.polozky.filter((x) => x.cas)) {
      const q = `${FRAZA.cas[l]} ${nazov(p)}?`, r = odpovedz(q, kb); n++;
      assert.ok(r.typ === 'odpoved' && r.id === 'trvanie' && r.sluzba === p.id, `${l} „${q}“ → ${popis(r)}, čakané trvanie:${p.id}`);
      assert.ok(JSON.stringify(r.p.odpoved).includes(p.cas[0]) && !JSON.stringify(r.p.odpoved).includes('€'), `${l} „${q}“: trvanie ${p.cas[0]} bez ceny`);
    }
    const t = odpovedz(`${FRAZA.cas[l]} ${nahodne()}?`, kb);
    assert.ok(t.typ === 'fallback' || t.typ === 'nevieme', `${l}: trvanie neznámej služby → ${popis(t)}`);
  }
  const b = odpovedz('Ako dlho to trvá?', sk);
  assert.ok(b.typ === 'odpoved' && b.id === 'trvanie' && !b.sluzba, `bez služby → ${popis(b)}`);
  console.log(`otázok na trvanie služby: ${n}`);
});

/* p. 3: dve služby z cenníka v jednej otázke nikdy nedostanú holú cenu len jednej z nich */
const SPOLU = { 'cena-strih-brada': ['cena-strih', 'cena-brada'] };
test('12. pravidlo 3: dve služby v otázke = Myslíš toto? alebo spojená služba, nikdy holá cena jednej', () => {
  let n = 0, v = 0, obe = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const c = kb.polozky.filter(cenove), spoj = kb.spoj.split(' ')[0];
    for (const a of c) for (const b of c) {
      if (a === b) continue;
      const q = `${FRAZA.cena[l]} ${nazov(a)} ${spoj} ${nazov(b)}?`, r = odpovedz(q, kb), t = r.typ === 'odpoved' && JSON.stringify(r.p.odpoved); n++;
      if (r.typ === 'vyber') { v++; if ([a, b].every((x) => r.p.some((y) => y.id === x.id))) obe++; continue; }
      // spojená služba pokrýva svoje časti (aj keď je jednou z dvojice)
      const S = (x, y) => (r.id === x.id && (SPOLU[x.id] || []).includes(y.id)) || ((SPOLU[r.id] || []).includes(x.id) && (SPOLU[r.id] || []).includes(y.id));
      assert.ok(!cena(r) || S(a, b) || S(b, a) || [a, b].every((x) => t.includes(nazov(x))), `${l} „${q}“ → ${popis(r)}: cena len jednej služby`);
    }
  }
  console.log(`dvojíc služieb: ${n}, z toho „Myslíš toto?“ ${v} (s oboma ${obe})`);
});

/* p. 3: spojená služba (pravidlo „spolu“) len so spojkou (a, s, +, and, und …); bez nej Myslíš toto? */
test('13. pravidlo 3: strih a brada so spojkou = spojená služba, bez spojky nie', () => {
  for (const [l, kb] of Object.entries(KB)) {
    const p = kb.polozky.find((x) => x.pravidlo === 'spolu'), spoj = kb.spoj.split(' ');
    assert.ok(p, `${l}: spojená služba`);
    const so = p.otazky[1], bez = norm(so).split(' ').filter((w) => !spoj.includes(w)).join(' ');
    assert.notEqual(so.split(' ').length, bez.split(' ').length, `${l}: variant „${so}“ má spojku`);
    for (const q of [so, `${FRAZA.cena[l]} ${so}?`, bez.replace(' ', ' + ')]) {
      const r = odpovedz(q, kb);
      assert.ok(r.typ === 'odpoved' && r.id === p.id, `${l} „${q}“ → ${popis(r)}, čakané ${p.id}`);
    }
    for (const q of [bez, `${FRAZA.cena[l]} ${bez}?`]) {
      const r = odpovedz(q, kb);
      assert.ok(!(r.typ === 'odpoved' && r.id === p.id), `${l} „${q}“ → ${popis(r)}: spojená služba bez spojky`);
    }
  }
});

/* p. 7: otázka len zo slabých kmeňov služby (súčasť, nástroj, opisné slovo) nedostane jej cenu */
test('14. pravidlo 7: cena len pri istej zhode so silným kmeňom služby', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const silne = new Set([...kb.polozky, ...kb.nevieme].flatMap((p) => p.kluc.split(/[\s|]+/).filter((t) => /^[A-Z]/.test(t) || t.endsWith('!')).map((t) => t.replace(/[=!]/g, '').toLowerCase())));
    for (const p of kb.polozky.filter(cenove)) {
      const slabe = [...new Set(p.kluc.split(/[\s|]+/).map((t) => t.replace('=', '')).filter((t) => t && !/^[A-Z>]/.test(t) && !t.endsWith('!')))].filter((t) => ![...silne].some((k) => zhoda(t, k) > 0.89));
      if (!slabe.length) continue;
      const q = `${FRAZA.cena[l]} ${slabe.join(' ')}?`, r = odpovedz(q, kb); n++;
      assert.ok(!(cena(r) && r.id === p.id), `${l} „${q}“ → ${popis(r)}: cena bez silného kmeňa`);
    }
  }
  console.log(`otázok len so slabými kmeňmi: ${n}`);
});
