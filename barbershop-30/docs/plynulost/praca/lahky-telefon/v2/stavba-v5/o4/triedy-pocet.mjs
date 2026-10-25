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
//     služby z cenníka je variant sám osebe; téma nevieme má len zobrazovanú), kluc = kmene oddelené medzerou (veľké začiatočné písmeno alebo
//     „!“ = silný kmeň, „=“ = len celé slovo, „>10“ = číslo nad 10, „|“ = skupiny), spoj = spojky, odovzdanie = predmet (modul doplní panel.nepotvrdene)
//     alebo celá veta s bodkou
//  4. jazyky: každý assets/recepcia/<jazyk>.json má rovnaké id v rovnakom poradí; veta, ktorá má kľúč v
//     assets/i18n/<jazyk>.json, je preložená presne tak ako na stránke; pár otázok v danom jazyku
//  5. váha: recepcia.js + recepcia.css + sk.json ≤ 11 264 B gzip, s iným jazykom ≤ 12 800 B; bez zakázaných označení
//  6.–17. triedy podľa pravidiel zhody p. 1–10 (modul nemá komentáre kvôli váhe; pravidlá opisuje tento súbor);
//     otázky sa skladajú z dát a šablón, nie z nálezov kontroly:
//     p. 1 kmeň do 4 znakov len presne alebo s koncovkou najviac +3, preklep len pri kmeni od 5 znakov (test 6)
//     p. 2 neznáme obsahové slovo od 3 znakov pri službe s cenou → „Myslíš toto?“ alebo odovzdanie (test 7)
//     p. 3 špecifickejšia služba vyhrá; slovo inej služby, ktoré víťaz nevysvetlí, alebo spojená služba
//          (strih a brada) bez spojky → „Myslíš toto?“ s oboma (testy 8, 12, 13)
//     p. 4 osoba, miesto, vek (každé číslo nad 10) a produkt mimo ponuky → téma nevieme, ktorá vetuje cenu (test 9)
//     p. 5 zdvorilosť a krátka správa → úvodná veta a voľby, nikdy cena (test 10)
//     p. 6 trvanie je trvanie menovanej služby (test 11)
//     p. 7 cena alebo trvanie len pri istej zhode so silným kmeňom služby (slovo z názvu alebo opisu služby na
//          stránke) alebo s celým názvom služby; súčasť balíka, nástroj či prenesené slovo je slabý kmeň (test 14)
//     p. 8 zložené slovo = predná časť + hlava: dlhý kmeň vnútri slova (predná časť od 3 znakov, nie predpona ani
//          stop-slovo, po odrátaní „ne“) alebo viac ako 7 znakov za dlhým kmeňom na začiatku → slovo sa rozdelí na dve,
//          ak obe časti nevysvetľujú kmene ani názov tej istej položky; cudzia časť je potom neznáme slovo (p. 2),
//          slovo inej služby je druhá služba (p. 3) – „Rückenwaxing“ ako „depilácia chrbta“ (test 15)
//     p. 9 služba s cenou a viacerými skupinami kmeňov (farbenie | brada, holenie | hlava) je istá len pri zásahu
//          všetkých skupín alebo pri celom názve služby; inak „Myslíš toto?“ (test 16)
//     p. 10 čísla: čas hh:mm sa nepočíta ako vek; jednociferné číslo pri cm (3 cm, 3cm) nie je „nad 10 cm“;
//          téma vek má v druhej skupine všetky silné slová dieťaťa z položky deti (synovi, detský …) (test 17)
//  Modul nič neposiela ani neukladá: fetch len vlastného assets/recepcia/<jazyk>.json, text návštevníka len cez
//  textContent, innerHTML len pre statickú kostru panela.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';


import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2];
const R = (p) => path.join(ROOT, p);
const { odpovedz, norm, zhoda } = await import(process.argv[2] + '/assets/recepcia.js');
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


let zle = 0, spolu = 0; const CHK = (c, m) => { spolu++; if (!c) { zle++; if (zle <= 3) console.log('  ' + m); } };
const T = (n, f) => { zle = 0; spolu = 0; f(); console.log(n + ': zlé ' + zle + ' z ' + spolu); };
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

/* p. 8: zložené slovo (de, hu …) je predná časť + hlava; časť, ktorú nevysvetľuje tá istá služba, je neznáme slovo */
T('15. pravidlo 8: zložené slovo s cudzou časťou nedostane cenu služby z druhej časti', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter(cenove)) {
    for (const t of p.kluc.split(/[\s|]+/).filter((t) => /^[A-Z]/.test(t) || t.endsWith('!'))) {
      const k = t.replace('!', '').toLowerCase();
      if (k.length < 5) continue;
      for (const q of [`${FRAZA.cena[l]} ${nahodne()}${k}?`, `${FRAZA.cena[l]} ${k}${nahodne()}a?`]) {
        const r = odpovedz(q, kb); n++;
        CHK(!cena(r), `${l} „${q}“ → ${popis(r)}: cena pri zloženom slove s neznámou časťou`);
      }
    }
  }
  console.log(`zložených slov: ${n}`);
});

/* p. 9: služba s cenou a viacerými skupinami kmeňov (farbenie | brada, holenie | hlava) je istá len pri zásahu všetkých */
T('16. pravidlo 9: služba s dvomi skupinami nedostane holú cenu zo slova jednej skupiny', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) for (const p of kb.polozky.filter((x) => cenove(x) && x.kluc.includes('|') && x.pravidlo !== 'spolu')) {
    const G = p.kluc.split('|').map((g) => g.trim().split(/\s+/).map((t) => t.replace(/[=!]/g, '').toLowerCase()));
    G.forEach((g, gi) => {
      for (const k of g) {
        if (G.some((h, hi) => hi !== gi && h.some((x) => zhoda(k, x) > 0.89))) continue;
        const q = `${FRAZA.cena[l]} ${k}?`, r = odpovedz(q, kb); n++;
        CHK(!(r.typ === 'odpoved' && r.id === p.id), `${l} „${q}“ → ${popis(r)}: holá cena zo slova jednej skupiny`);
      }
    });
  }
  console.log(`otázok zo slova jednej skupiny: ${n}`);
});

/* p. 4 a p. 10: vek nad 10 so slovom dieťaťa v hocijakom tvare = téma vek; dĺžka do 9 cm nie je „nad 10 cm“; čas nie je vek */
T('17. pravidlo 10: číslo pri slove dieťaťa, pri cm a v čase', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const d = kb.polozky.find((x) => x.id === 'deti'), s = kb.polozky.find((x) => x.id === 'cena-strih');
    for (const t of d.kluc.split(/\s+/).filter((t) => /^[A-Z]/.test(t) || t.endsWith('!'))) for (const v of ['11', '12', '15']) {
      const q = `${FRAZA.cena[l]} ${t.replace('!', '').toLowerCase()}i ${v}?`, r = odpovedz(q, kb); n++;
      CHK(!(cena(r) && r.id === 'deti'), `${l} „${q}“ → ${popis(r)}: detský strih pri veku nad 10`);
    }
    for (const v of ['1', '3', '5', '9', '3,5']) for (const u of [' cm', 'cm']) {
      const q = `${FRAZA.cena[l]} ${nazov(s)}, ${v}${l === 'uk' ? u.replace('cm', 'см') : u}?`, r = odpovedz(q, kb); n++;
      CHK(!(r.typ === 'odpoved' && r.id === 'cena-dlhe'), `${l} „${q}“ → ${popis(r)}: dĺžka do 9 cm nie je nad 10 cm`);
    }
    for (const c of ['14:00', '12:30', '16:15']) {
      const q = `${FRAZA.cena[l]} ${nazov(d)} ${c}?`, r = odpovedz(q, kb); n++;
      CHK(!(r.typ === 'nevieme' && r.id === 'vek'), `${l} „${q}“ → ${popis(r)}: čas nie je vek`);
    }
  }
  console.log(`otázok s číslom: ${n}`);
});
