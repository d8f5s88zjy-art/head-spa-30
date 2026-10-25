# V5 etapa 1 – Recepcia: kontrola kódu 4 (25. 10. 2026)

Kontrolór: nezávislý senior, v strome `hs-recepcia` som nič nemenil (`git status --short` → 0 riadkov pred kontrolou aj po nej).
Strom: HEAD **6f8c47c** (oprava 4). Zadanie uvádza „HEAD d4657b7“, ale nad d4657b7 je 13 commitov (8fc1824 … 6f8c47c).
Kontroloval som skutočný HEAD, diffy `d4657b7..HEAD` (12 súborov, +885 −489) a `f624ee8..HEAD` (21 súborov, +1531 −7).
Moje pracovné súbory sú v `stavba-v5/k4/` (sondy, výstupy, skripty). Dočasnú kópiu stromu (231 MB) som po overení generátora zmazal.

## Verdikt: NEPRIJATÉ

Kolo 3 je opravené (K1, K2, V6–V9: 23 z 23 otázok sedí, `k4/k3-triedy-head.txt`). Kód pravidiel je všeobecný, bezpečnosť, váha,
i18n, JSON = generátor a testy prechádzajú. **Trieda vážnych chýb sa ale vracia v ďalšom tvare.** Príčina je v kóde, nie v dátach:

- pravidlo 3 („iná služba v otázke“) sa pozerá **len na položky s cenou** (`recepcia.js:60`, podmienka `y._c`),
- pravidlo 6 dáva východiskové trvanie strihu a brady aj vtedy, keď otázka **menuje položku bez trvania** (`recepcia.js:90–91`).

Slovo položky bez ceny (melír, trvalá, blond, tónovanie, sobota, víkend, káva, rezervácia) je pre modul „známe“, takže ho nestráži
pravidlo 2. Pravidlo 3 ho tiež nevidí, lebo položka nemá cenu. Panel potom povie holú cenu alebo trvanie inej služby.
V prehliadači som to overil na skutočnom paneli (telefón aj počítač, `k4/prehliadac-k4.json`).

---

## 1. Čo prešlo (s dôkazom)

| oblasť | výsledok | dôkaz |
|---|---|---|
| testy | **23/23**, `# fail 0`, 8,1–9,0 s | `node source/tools/recepcia-test.mjs` (v `barbershop-30/`) |
| JSON = generátor | 8× zhodné | kópia stromu → `python3 -I stavba-v5/jazyky-gen.py <kópia>` → `cmp` en uk hu sr pl de cs sk: všetky „zhodné“ |
| váha po ťuknutí (js + css + jazyk) | sk **11 246 B** (Node zlib) / 11 235 (gzip -6) / 11 217 (gzip -9) ≤ 11 264; najťažší uk **12 495** / 12 460 / 12 435 ≤ 12 800; ostatné 11 275–11 815 | slučka `gzip -6c`, `gzip -9c`, `zlib.gzipSync` cez recepcia.js + recepcia.css + recepcia/<l>.json |
| prvé okno proti f624ee8 | app.js +295 B, style.css +185 B (Node) = **+480 B**; gzip -9: +304 + 191 = +495 B ≤ 500 | `git show f624ee8:… \| gzip`; od d4657b7 sa app.js ani style.css nezmenili |
| index.html | **0 B** zmeny | `git diff f624ee8..HEAD -- index.html \| wc -c` → 0 |
| bezpečnosť – DOM | `innerHTML` len pri statickej kostre `KOSTRA` (`recepcia.js:154`) a statickom SVG tlačidla (app.js 7d); text návštevníka ide len cez `el()` → `textContent` (`:97`, `:123`) | grep `innerHTML\|insertAdjacentHTML\|outerHTML\|document.write\|eval\|new Function` → len `:154` |
| bezpečnosť – sieť | jediný `fetch` je `recepcia/<jazyk>.json` (jazyk z bieleho zoznamu, `:98`), `import('./recepcia.js')` až po ťuknutí (app.js) | grep `fetch\|XMLHttpRequest\|sendBeacon\|WebSocket\|import(` → `:98`; v prehliadači pred ťuknutím 0 žiadostí na recepciu, po ťuknutí len `assets/recepcia.js`, `assets/recepcia.css`, `assets/recepcia/sk.json`, žiadna cudzia adresa |
| bezpečnosť – úložisko | žiadny localStorage, sessionStorage, IndexedDB ani cookie | grep → 0; v prehliadači `setItem` pre recepciu 0×, `document.cookie.length` 0 |
| vstup `<img src=x onerror=alert(1)>` | v paneli 0 prvkov `img`, odpoveď fallback | `k4/prehliadac-k4.json` |
| prístupnosť | `showModal`, fokus na prvú voľbu (`rc-chip`), Esc zavrie, fokus sa vráti na tlačidlo, `aria-expanded` false | `k4/prehliadac-k4.json` (oba pohľady) |
| umiestnenie, CLS | telefón 390×844: x 16, 46×46 px (vľavo dole); počítač 1440×900: x 1344, 56×56 px (vpravo dole); CLS pred ťuknutím 0 / 0,0001 (orientačné) | to isté; v CSS `prefers-reduced-motion` vypne animáciu (`style.css` 7d) |
| i18n | v každom zo 7 slovníkov pribudol len kľúč „Spýtaj sa recepcie“, žiadna iná hodnota sa nezmenila (`__tabula` je objekt, porovnanie odkazu je falošný poplach) | porovnanie kľúčov `assets/i18n/<l>.json` proti f624ee8 |
| žiadna zmienka o AI | v module, CSS, JSON ani app.js nie je AI, umelá inteligencia, chatbot ani asistent. V správach commitov je jediný zásah: názov súboru návrhu `asistent.md` v c7ffb2f (odkaz na súbor, nie označenie) | grep cez súbory a `git log --format=%B f624ee8..HEAD` |
| pravidlá v kóde sú všeobecné | v zhodovacej časti (`recepcia.js:1–92`) nie je žiadne slovo ani veta z otázok. Literály sú len typy odpovedí, `'€'`, `/sluzby\|booqme/`, `/^ne/` a `cm\|см` (pozri D3) | výpis literálov `grep -oE` |
| kolo 3 (K1, K2, V6–V9) | sorry, köszönöm, děkuji, dekujem → zdvorilosť; detox, sedačka → fallback; holenie 30 min, Bartfärben 30 min, balíček 65/80, head shave 25; mama, babka, kamarátka, sestra, mum → téma dámske; balzam, vosk, olej na bradu → produkty; holenie hlavy britvou → Oholenie hlavy 13 €; doma, nemocnica, domov dôchodcov → mimo | `k4/k3-triedy-head.txt` |
| čas zhody (orientačné, záťaž 4,9–5,4 na 4 jadrách, súbežný prehliadač iného tímu) | bežné otázky (580): priemer 0,9–1,7 ms, max 1,6–3,5 ms, jeden výkyv pl 6,9 ms. Príprava JSON 1,2–8 ms raz | `node k4/cas-k4.mjs <strom> k4/vsetky-k4.txt bez` |

## 2. Nálezy

### V1 – VÁŽNA (kód): služba bez ceny sa pri „inej službe v otázke“ nepočíta → holá cena jednej služby

- **Príčina:** `recepcia.js:60`, kandidát na druhú službu `Y` musí mať `y._c` (cenu). Položka `farbenie-vlasov` (Romana: melír,
  trvalá, blond, tónovanie, odfarbenie) cenu nemá. Témy „nevieme“ (napr. `romana-ceny`) majú len slabé kmene, takže nevetujú
  (`:35`). Slovo je pritom známe (`zn`), takže ho nestráži ani pravidlo 2 (`:80`).
- ZASADY pravidlo 3 a test 12 sľubujú „dve služby v otázke = nikdy holá cena jednej“. Test 12 skladá len dvojice služieb
  **s cenou** (1 456 dvojíc), túto triedu teda nevidí.
- Ručné sondy (`k4/sondy-k4c-vystup.txt`, `k4/sondy-k4b-vystup.txt`):

| otázka | odpoveď na HEAD |
|---|---|
| sk „Koľko stojí strih a melír?“ / „strih s melírom“ / „strih a trvalá“ / „pánsky strih a blond“ / „strih a odfarbenie“ | Pánsky strih **18 €** |
| cs „Kolik stojí střih a melír?“, „střih a trvalá“; pl „strzyżenie i pasemka“, „i trwała“; uk „стрижка і мелірування“; sr „šišanje i pramenovi“, „i trajna“ | **18 €** |
| hu „Mennyibe kerül hajvágás és melír?“ / „hajvágás és hajfestés?“ | Férfi hajvágás **18 €** |
| sk „Koľko stojí úprava brady a melír?“, „melír brady“, „blond brada“, „trvalá na bradu“; hu „szakáll melír“ | Úprava brady **15 €** |
| sk „Koľko stojí tónovanie brady?“ | Úprava brady **15 €** (tónovanie je farbenie) |
| sk „Koľko stojí melír obočia?“, „blond obočie“, „tónovanie obočia“ | Úprava obočia 3 € / Farbenie obočia 5 € |

- **Trieda zo skriptu** (`k4/trieda-k4.mjs`): silný kmeň `farbenie-vlasov`, ktorý nemá žiadna položka s cenou, + posledné slovo
  názvu každej služby s cenou v 8 jazykoch → **195 holých cien** (sk 30, cs 30, hu 36, pl 36, uk 35, sr 24, de 4).
  Niektoré dvojice sú nezmyselné (melír nosa), trieda je však jasná.
- **Návrh (kód, všeobecne):**
  - za „inú službu“ (`Y`) brať aj položku bez ceny so službou (`_s`, akcie sluzby alebo booqme), aj tému „nevieme“ so zhodou
    v slove, ktoré víťaz nevysvetlí;
  - alebo slovo, ktoré víťaz nevysvetlí a ktoré má silnú zhodu len s položkou bez ceny, rátať pri cenovej odpovedi ako neznáme
    (pravidlo 2);
  - doplniť test: dvojice „služba s cenou × služba bez ceny“ z dát všetkých jazykov.

### V2 – VÁŽNA (kód): otázka na trvanie s položkou bez trvania → trvanie strihu a brady

- **Príčina:** `recepcia.js:87–91`.
  - Ak `rozhodni` vráti položku bez `cas`, odovzdanie nastane len pri `x._s && !x.cas` (`:90`).
  - Pri položke bez služby (káva, hodiny, rezervácia, online, adresa …) sa vráti `R('odpoved', [.., T])` (`:91`), teda
    „Pánsky strih 40 min, Úprava brady 20 min“.
  - ZASADY pravidlo 6 hovorí „služba bez trvania … → odovzdanie“ a „Čo pravidlá zámerne nerobia: neodpovedajú na čakaciu dobu“.
    Kód robí opak.
- Sondy (`k4/sondy-k4-vystup.txt`, `k4/sondy-k4b-vystup.txt`; v prehliadači overené):

| otázka | odpoveď |
|---|---|
| sk „Koľko minút sa čaká v čakárni?“ | Pánsky strih 40 min, Úprava brady 20 min |
| sk „Ako dlho trvá rezervácia?“, „Koľko minút trvá online rezervácia?“, „Ako dlho trvá káva?“, „Koľko minút pred zatvorením môžem prísť?“ | 40 / 20 min |
| hu „Mennyi ideig kell várni?“, „Hány percet kell várni a kávéra?“, „Mennyi ideig tart a foglalás?“ | 40 / 20 perc |
| cs „Kolik minut se čeká?“, „Jak dlouho trvá rezervace?“; pl „Ile minut się czeka?“, „Jak długo trwa rezerwacja?“; de „Wie viele Minuten wartet man?“, „Wie lange dauert die Reservierung?“; uk „Скільки хвилин чекати?“, „Скільки триває бронювання?“; en „How long does booking take?“ | 40 / 20 min |

- **Trieda zo skriptu:** „<koľko minút> + silný kmeň položky bez ceny a bez trvania“ v 8 jazykoch → **571 trvaní strihu a brady**
  (sk 78, uk 77, pl 75, de 71, cs 70, en 69, sr 67, hu 64).
- **Návrh:** východiskové trvanie strihu a brady len vtedy, keď po odobratí časových a cenových slov neostane žiadne známe slovo
  (`wt` prázdne). Ak `rozhodni` vráti akúkoľvek položku bez `cas` (nielen `_s`), nasleduje odovzdanie. Do testu 11 treba
  doplniť položky bez trvania.

### V3 – VÁŽNA (dáta + kód): „koľko dlho / koliko dugo“ → cena dlhých vlasov 22 €

- Otázky a odpovede:
  - sk „Koľko dlho sa čaká?“ → **Pánsky strih – dĺžka vlasov nad 10 cm, 22 €**,
  - sr „Koliko dugo se čeka?“ a „Koliko dugo se čeka na šišanje?“ → **22 €** (v srbčine bežná veta),
  - sk, en, cs, pl „Ako dlho budem čakať?“ a podobné → „Myslíš toto?“ [Dlhé vlasy, Káva] (bezpečné, ale ukazuje tú istú príčinu).
- **Príčina:**
  - príslovka času dlho, dugo (long, dlouho, długo) je silný kmeň dlhých vlasov (sk `Dlh`, sr `Dug`, 3 znaky, zhoda 1).
    V položke trvanie je len slabá, a tak nespustí vetvu trvania;
  - cenové slovo „koľko/koliko“ znamená aj „ako dlho / koľko minút“ a k položke s cenou pridá skóre (`recepcia.js:29`).
- **Návrh:**
  - časová príslovka má byť silný spúšťač trvania (`=dlho`, `=dugo`, `=dlouho`, `=dlugo`, …) alebo v stop-slovách položky dlhých
    vlasov; dlhé vlasy potom určujú tvary prídavného mena (dlhé, dlhý, dlhšie);
  - doplniť test „<cenové slovo> + <časová príslovka> + čakanie“ v 8 jazykoch.

### V4 – VÁŽNA (rovnaká príčina ako V1): príplatok za sobotu, víkend či večer → 22 €

- Otázky a odpovede:
  - sk „Koľko je príplatok za víkend?“, „Koľko je príplatok za večer?“, „Je príplatok za strih v sobotu?“ → **22 €** (dlhé vlasy),
  - sr „Koliko je doplata za subotu?“ → **22 €**,
  - en, cs, pl „Saturday surcharge“ → „Myslíš toto?“ (v poriadku).
- **Príčina:** `Priplat`/`Doplat` je silný kmeň dlhých vlasov. Sobota, víkend a večer sú silné kmene položky hodiny (bez ceny),
  takže nie sú neznáme a do `Y` nevstúpia. Zákazník číta 22 € ako príplatok za sobotu.
- **Návrh:** oprava V1 to pokryje, ak sa za druhú vec v otázke rátajú aj položky bez ceny. Doplniť test s príplatkom
  a časom alebo dňom.

### V5 – VÁŽNA (dáta): šediny v skupine „brada“ pri farbení brady

- Otázky a odpovede:
  - „Koľko stojí farbenie šedivých vlasov?“ → **Farbenie brady 10 €** (farbenie vlasov robí Romana a cenu web neuvádza),
  - „Koľko stojí zafarbenie šedín?“ → **10 €**,
  - „Ako dlho trvá zafarbenie šedín?“ → **Farbenie brady 30 min**.
- **Príčina:**
  - druhá skupina `farbenie-brady` je `Brad Fuz Fuzo sediv sedin`. Šediny nie sú brada: vlastná dátová zásada („kmeň nesmie
    zahŕňať slovo iného významu“) je porušená;
  - k tomu príčina V1: `farbenie-vlasov` nemá cenu, preto „vlasov“ nespustí „Myslíš toto?“.
- **Návrh:** sediv a sedin vyradiť zo skupiny brady (najviac ako slabý kmeň pri slove brada). Opraviť V1.

### S1 – STREDNÁ: odfarbenie brady → Farbenie brady 10 €

- Otázky: „Koľko stojí odfarbenie brady?“ a „odfarbenie fúzov?“ → **10 €**.
- **Príčina:** kmeň `farben` (6 znakov) je vnútri slova „odfarbenie“ (istá zhoda 0,9). Pravidlo 8 slovo nerozdelí, lebo predpona
  „od“ má menej ako 3 znaky.
- Dáta pritom odfarbenie odlišujú: `Odfarb` je kmeň `farbenie-vlasov`. Stránka ponúka len „Farbenie profesionálnymi farbami“
  (`index.html:577`).
- de „Bart tönen“ a uk „тонування бороди“ → Bartfärbung 10 €: tónovanie je druh farbenia, to je hraničné.
- **Návrh:** vyrieši sa spolu s V1 (silný kmeň `Odfarb` položky bez ceny v otázke → „Myslíš toto?“).

### S2 – STREDNÁ: strihanie chĺpkov v nose → depilácia voskom

- Otázka: de „Was kostet Nasenhaarschneiden?“ → **Ohren- und Nasenwaxing 5,50 €** (strihanie nie je depilácia voskom).
- Názov služby je v odpovedi viditeľný. sk „vytrhanie chĺpkov z nosa“ a en „nose hair trimming“ správne dávajú „Myslíš toto?“.
- **Návrh:** pri zloženom slove so slovesom inej činnosti („schneiden“ je kmeň strihu) to riešiť ako pri dvoch slovách
  (pravidlo 8 + 3).

### D1 – DROBNÁ: čas zhody pri vstupe s 200 znakmi

- 200-znakové vstupy (66 krátkych slov, opakované „kolko stoji“, dlhé zložené slová) trvajú **10–14 ms**, bežné otázky 0,9–1,7 ms.
  Merané orientačne pri záťaži 4,9–5,4 (`k4/cas-k4.mjs`).
- Kritérium „< 5 ms v Node“ (`asistent.md:608`) test 2 meria len na sade otázok. Je to jeden výpočet na odoslanie, nie na snímku,
  takže dopad je malý.
- **Návrh:** pridať do testu 2 aspoň jeden 200-znakový vstup s rozumnou hranicou, alebo to v kritériách výslovne prijať.

### D2 – DROBNÁ: rezerva váhy sk je 18 B

- sk 11 246 B (Node zlib) pri limite 11 264 B. Každá oprava V1–V5 musí byť úsporná: radšej zmena podmienky `y._c`
  ako nové kmene.

### D3 – DROBNÁ: jazykové pravidlá natvrdo v module

- `recepcia.js:74` odráta zápornú predponu `/^ne/` (sk, cs) pre všetky jazyky.
- `recepcia.js:72` pozná jednotky `cm|см`.
- Pre ostatné jazyky to nič nekazí, ale je to jazykové pravidlo v kóde, nie v JSON jazyka.

### D4 – DROBNÁ: bezpečné, ale zvláštne zaradenia

- „Dvojičky majú 9, koľko za oboch?“ → „Myslíš toto?“ [obočie]: `Oboc` zachytí „oboch“.
- „Koľko stojí strih pre dôchodcu?“ → téma mimo („Služby mimo podniku…“): `Dochodc`.
- „Koľko stojí strih pre vnuka, má 16?“ → „Myslíš toto?“ [pánsky strih]: vnuk nie je v triede slov dieťaťa, takže to nie je téma vek.
- Nič z toho nie je cena ani sľub.

## 3. Zhrnutie pre staviteľa

- **Hlavná príčina** vážnych nálezov V1, V2, V4 a čiastočne V3 a V5 je jedna:
  - modul rozlišuje len „neznáme slovo“ a „slovo inej služby s cenou“;
  - **slovo položky bez ceny alebo bez trvania** (Romana, hodiny, káva, rezervácia) je pre neho „známe a neškodné“.
- **Oprava patrí do kódu:**
  - `recepcia.js:60`: kandidát `Y` aj bez `_c`;
  - `recepcia.js:90–91`: trvanie len pre položku s `cas`, inak odovzdanie.
- **Dáta:**
  - V3 (časová príslovka ako silný kmeň dlhých vlasov),
  - V5 (šediny v skupine brada).
- **Testy:**
  - dvojice „služba s cenou × položka bez ceny“,
  - „trvanie × položka bez trvania“,
  - „cenové slovo + časová príslovka“, všetko v 8 jazykoch z dát, nie z mojich viet.
- **Skripty na overenie opravy:**
  - `node stavba-v5/k4/trieda-k4.mjs <strom>` (dnes A 571, B 195; po oprave oba 0, s ručnou kontrolou zvyšku),
  - `node stavba-v5/k1-skusaj.mjs <strom> < stavba-v5/k4/sondy-k4c.txt` a `… < sondy-k4b.txt`.
