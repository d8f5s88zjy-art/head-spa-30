# Slepé sady – hodnotenie podľa zásad zhody v2, kolo 1

Hodnotiteľ: nezávislý, v strome `hs-recepcia` som nič nemenil (`git status --short` = 0 riadkov pred aj po).
Strom: HEAD **aeaafb7** („rozhodovanie len medzi položkami so zásahom“). Nad 6f8c47c zo zadania pribudlo 6 commitov
(74e21fd P1, 15f1f7f P3, 897a32b P4, 21bc944 P5+P6, 58f392d vzhľad, aeaafb7 rýchlosť). Hodnotil som skutočný HEAD.
Zásady: `stavba-v5/ZASADY-ZHODY.md` verzia 2 (P1–P6) existuje.

Sady (sha1): A 5c1111b2…, B 9d1387c6…, C2 5cc7e615…, D1 da554567…, D2 f344d097… – spolu **1 528 otázok** v 8 jazykoch
(A 349, B 315, C2 260, D1 293, D2 311).

## Postup (dá sa zopakovať)

```
cd .../stavba-v5/slepe
R=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30
for s in A B C2 D1 D2; do node spust-slepe-v2.mjs $R sada-$s.jsonl > vysledky-$s-v2-1.jsonl; done
python3 zarad-v2-1.py vysledky-{A,B,C2,D1,D2}-v2-1.jsonl      # strojové zaradenie → vysledky-*-v2-1-zarad.json
python3 zarad-v2-1-rucne.py                                     # ručné rozhodnutia → vysledky-*-v2-1-final.json + tabuľka
node cas-v2-1.mjs $R sada-*.jsonl                               # čas zhody (7 behov na otázku, medián)
cd $R && node --test source/tools/recepcia-kombinacie-test.mjs && node source/tools/recepcia-test.mjs
```

- `spust-slepe-v2.mjs` = spúšťač podľa `k1-skusaj.mjs` (volá `odpovedz()` z `assets/recepcia.js` s JSON jazyka),
  navyše zapisuje výrez cenníka z `vyrez()` (P3), príznaky výberu (`cas` = voľby trvania, `o` = text fallbacku) a čas.
- Zaradenie podľa zadania: **OK** = správna priama odpoveď, alebo „Myslíš toto?“ so správnou voľbou medzi prvými dvomi,
  alebo pri `volba:` voľby obsahujú všetky menované veci, alebo správne odovzdanie; **ODOVZDANIE‑NAVYŠE** = legitímna
  otázka bez správnej voľby (aj správna voľba až na 3.–4. mieste, aj len časť menovaných vecí pri `volba:`);
  **CHYBA** = holá cena/trvanie/služba, ktorá nesedí s očakávaním alebo stránkou, alebo nevysvetlí všetky menované veci,
  alebo cena bez výrezu. Legitímna = očakávanie nie je len `odovzdanie`/`bez-ceny`.
- Ručne som prešiel všetkých 276 odpovedí s cenou alebo trvaním (sú v `vysledky-*-v2-1-zarad.json`), všetkých
  10 strojových kandidátov na chybu a všetkých 95 odovzdaní navyše.

## Výsledok

| sada | spolu | OK | ODCHÝLKA (bez tvrdenia) | ODOVZDANIE‑NAVYŠE | **CHYBA** | legitímne | fallback_legit |
|---|---|---|---|---|---|---|---|
| A | 349 | 341 | 1 | 7 | **0** | 215 | 8 (3,7 %) |
| B | 315 | 308 | 2 | 5 | **0** | 78 | 5 (6,4 %) |
| C2 | 260 | 242 | 0 | 18 | **0** | 160 | 18 (11,2 %) |
| D1 | 293 | 256 | 2 | 35 | **0** | 224 | 36 (16,1 %) |
| D2 | 311 | 276 | 2 | 30 | **3** | 267 | 32 (12,0 %) |
| **spolu** | **1 528** | 1 423 | 7 | 95 | **3** | 944 | **99 (10,49 %)** |

- **fallback_legit_pct = 10,49 %** (cieľ ≤ 15 % splnený; pre sady A+B+C2 zo zadania 31/453 = 6,8 %, predtým 25,7 %).
  Do čitateľa rátam ODOVZDANIE‑NAVYŠE aj 4 legitímne ODCHÝLKY (otázka na rezerváciu → výber barbera).
  Sada D1 je sama nad cieľom (16,1 %).
- OK podľa druhu: priama odpoveď 398, trvanie 101, „Myslíš toto?“ so správnou voľbou v top 2 246, všetky menované veci
  pri `volba:` 67, odovzdanie 530, výber pri téme odovzdania 80 (nič netvrdí), odpoveď bez ceny pri `bez-ceny` 1.
- **Všetky ceny a trvania sedia so stránkou:** strih 18 €/40 min (`index.html:529–531`), s bradou 28 €/60 (`:535–537`),
  nad 10 cm 22 €/60 (`:541–543`), malí gentlemani 15 €/45 do 10 rokov (`:547–549`), hlava 13 €/25 (`:553–555`),
  brada 15 €/20 (`:565–567`), Hot Towel 15 €/30 (`:571–573`), farbenie brady 10 €/30 (`:577–579`), Balíček 1 30 €/65
  (`:589–591`), Ultra 40 €/80 (`:595–597`), pleť 21,50 €/30 (`:607–609`), obočie 3 €/5 a 5 €/10 (`:613–615`,
  `:631–633`), depilácia 5,50 €/10 (`:619–621`), ornament 4 €/10 (`:625–627`).
- **Trvanie (101):** vždy služba menovaná v otázke a jej price-time; trvanie strihu a brady bez menovanej služby
  sa v sadách neobjavilo. P4 dodržané.
- **P3:** všetkých 174 odpovedí s cenou zo služby (aj 3 chyby nižšie) má výrez (zvýraznený riadok + susedné riadky skupiny). Výnimka:
  `ceny-konecne` (4×: sr „da li su cene konačne?“, en „Are the prices final…“, sk „Sú v cene nejaké skryté poplatky?“,
  cs obdoba) ukazuje vetu „Pánsky strih 18 €, s úpravou brady 28 €. Ceny sú konečné.“ bez výrezu. Veta je doslovne
  `index.html:506`, menuje obe služby a pod ňou je Celý cenník – nerátam ju ako chybu, ale doslovne podľa P3
  („odpoveď s cenou ukáže výrez“) je to odchýlka a test P3 ju nekontroluje.

## CHYBY (3)

Všetky v sade D2, ručne overené. Očakávania sedia so stránkou (sporné: 0).

| jazyk | otázka | dostal | malo byť | trieda |
|---|---|---|---|---|
| sk | V pondelok o 9:00 na bradu? | holá cena „Úprava brady 15 €“ (s výrezom) | hodiny Po–Pi 9:00–19:00 (`index.html:829`) alebo rezervácia; deň a čas otázka menuje, odpoveď ich nevysvetlí | W – pracovný deň je výplňové slovo |
| cs | Střih pro syna (8) a pro mě, kolik? | holá cena „Střih pro malé gentlemany 15 €“; výrez ukáže deti + susedov (nad 10 cm, hlava), nie pánsky strih | voľby deti + pánsky strih (15 € `:549`, 18 € `:531`) | D – druhá osoba „a pro mě“ |
| pl | Strzyżenie dla syna (8 lat) i dla mnie? | holá cena „Strzyżenie dla małych dżentelmenów 15 €“ | voľby deti + pánsky strih | D – druhá osoba „i dla mnie“ |

**Trieda W – pracovné dni, „zajtra“, „ráno“ a časy sú výplň.** `sk.json` `vypln` obsahuje `zajtra rano pondel utor
stred stvrt piat` (obdobne cs, pl, en, de, hu, sr, uk), sobota/nedeľa/víkend sú kmene položky hodiny. Navyše
`recepcia.js` v `odpovedz` maže čas `\d+:\d+` ešte pred zhodou. P1 vo verzii 2 uvádza ako výplň len opytovacie,
cenové, časové, zdvorilé slová, zámená a spojky – dni medzi nimi nie sú. Sondy mimo sád (`k1-skusaj.mjs`):

```
sk | strih o 21:00?            → odpoved cena-strih | Pánsky strih 18 €    (o 21:00 je zatvorené, :829)
sk | strih v piatok o 20:00?   → odpoved cena-strih | Pánsky strih 18 €
en | haircut Monday 20:00?     → odpoved cena-strih | Men's haircut 18 €
en | Haircut on Monday?        → odpoved cena-strih ;  de Haarschnitt am Montag?, hu Hajvágás hétfőn?,
sr | Šišanje u ponedeljak?, uk Стрижка в понеділок?, cs V pondělí střih? → to isté 18 €
sk | v sobotu strih? / strih v nedeľu? → vyber [hodiny, …]       (nesúrodé: víkend blokuje, pracovný deň nie)
```

Cena je pravdivá a vo výreze, ale na otázku „môžem o 21:00?“ pôsobí ako „áno, 18 €“. ZASADY-ZHODY.md v časti „Čo pravidlá
zámerne nerobia“ uvádza, že voľné termíny idú na odovzdanie; pri čase v otázke sa to nedeje.

**Trieda D – „pre syna a pre mňa“.** Sondy: cs, hu, uk, en („Cut for my son (6) and me, price?“) → holá cena
deti 15 €; sk, de, pl („Ile za strzyżenie syna (7) i moje?“), sr → „Myslíš toto?“ [deti, pánsky strih, …]. Zámeno
„mě/mnie/me/мене/én“ je výplň, takže P1 položku deti považuje za úplne vysvetlenú, hoci otázka menuje dve osoby a spojku.

## ODCHÝLKY bez tvrdenia (7, nerátané ako chyba)

- Rezervácia → výber barbera (4, legitímne, rátané do fallbacku): sk „chcem sa objednat na strih“, sk „Dobry den,
  chcel by som sa objednat na strih, ako na to?“, sk „Môžem sa objednať na strih na zajtra ráno?“, cs „Můžu se objednat
  na střih na zítra ráno?“ → „Svojho človeka si vyberieš v rezervácii.“ + Rezervovať termín. Pravdivé (`index.html`
  tím), ale neodpovedá „ako“ (telefón / online). Kmene `objedn` a `strih` sú aj vo `vyber-barbera`.
- Téma odovzdania → položka bez ceny (3): sk „Máte TikTok?“ → Instagram (`socialne`); de „Hundefriseur?“ → tím
  („…arbeitet hier ein Team aus Barbern…“); sk „Máte wifi v čakárni?“ → káva a minerálka zdarma. Nič netvrdia o TikToku,
  psoch ani wifi, ale Hundefriseur → tím môže unáhlený čitateľ vziať ako „áno“. P1 zakazuje neznáme slovo len
  prísnym položkám (cena/služba), info položky ho smú nechať (`ZASADY-ZHODY.md` P1 bod 2).

## ODOVZDANIE‑NAVYŠE (95) – čo zostáva

| druh | počet | príklady |
|---|---|---|
| téma „nevieme“ s nesúvisiacim štítkom | 33 | negácia „len vlasy / nur die Haare / samo kosa“ → `produkty` (7); „žena barberka“ → `damske` (5); pl „jak się umówić“ → `jazyky-tim` (3); D1 „Na aké číslo môžem volať? … píše za mňa dcéra“ → `damske`; „otec má 70 rokov … holenie“ → `vek` („Strih pre chlapcov nad 10 rokov…“); „som dôchodca … kedy máte otvorené“ → `mimo`; uk „доплата за довге волосся“, „приховані платежі“ → `platba` |
| fallback | 27 | dlhé vety D1 (dôchodca Jozef, Charkov/Ultra, hu legénybúcsú Csomag 1), uk „Який у вас графік роботи?“, sr „колико кошта шишање“ (cyrilika), mená barberov |
| výber bez správnej položky | 18 | otázky na meno barbera → [pánsky strih] (6 v D2), „Holenie hlavy cez víkend, ide to?“ → [hlava], en „beard trim on Sunday?“ → [brada], „Ako dlho trvá strih, stihnem to?“ → voľby s textom fallbacku |
| správna voľba až 3.–4. | 8 | zápor „Nechcem bradu, len strih“ → [strih s bradou, brada, strih, …] (zámerne, `ZASADY-ZHODY.md` „Čo pravidlá zámerne nerobia“) |
| len časť menovaných vecí (`volba:`) | 7 | „Kedy máte otvorené a kde vás nájdem?“ → [hodiny]; „strih pre malých gentlemanov a pre otca“ → [deti] |
| voľba trvania pri cenovej otázke | 2 | en „My hair is quite long, over 10 cm. Is it more expensive?“ a sk „Mám vlasy dlho nestrihané, asi 15 cm, koľko?“ → „Myslíš toto?“ [nad 10 cm], po ťuknutí **60 min**, nie 22 € (`long`/`dlho` je časové slovo). Nič nepravdivé, ale cenu nedostane. |

## Kombinatorické testy (node --test)

```
$ node --test source/tools/recepcia-kombinacie-test.mjs   →  # tests 7  # pass 7  # fail 0  (27,7 s)
  P6a dvojice položiek, P6b trvanie × položka, P6c cenové/časové slovo × služba, príplatok, dni, šediny, odfarbenie,
  P6d triedy kontroly 4, P6e otázky skeptika, P5 lint kmeňov, P3 výrez
$ node source/tools/recepcia-test.mjs                      →  # tests 23  # pass 23  # fail 0
```

**Slabina orákula** (`recepcia-kombinacie-test.mjs:53–56`, funkcia `obsah`): obsahové slová otázky test počíta s tými
istými zoznamami `stop`, `cenove`, `vypln`, `zdvor`, `spoj` z JSON ako modul. Čo je chybne vo `vypln` (pracovné dni,
„zajtra“, „ráno“) alebo v `stop` (zámená „me/mě/mnie“), test nikdy neuvidí – kontrola je kruhová. P6c skladá dni len
zo silných kmeňov položky hodiny (`silne(H)`, `:121`) = sobota, nedeľa, víkend; pracovné dni a časy `hh:mm` netestuje.
Preto 3 chyby vyššie prešli cez 7/7.

## Čas zhody a váha

- Čas (`cas-v2-1.mjs`, Node 22, 4 jadrá, bez súbežného prehliadača, load 0,07; 7 behov na otázku, medián):
  medián všetkých 1 528 otázok 0,82–0,87 ms, ale **3–4 otázky ≥ 5 ms** v každom z 3 behov, najviac 6,0 / 10,5 / 9,4 ms
  (uk „Добрий день, я з Харкова…“, en „My hair is quite long, over 10 cm…“, sk „Kamarát chce na boku hlavy vystrihnutý
  blesk…“). **Kritérium „max < 5 ms“ nie je splnené** pri dlhých otázkach D1/D2 (A, B, C2 z commitu sú kratšie).
  Orientačné číslo – Node, nie telefón.
- Váha (gzip -9): recepcia.js + recepcia.css + sk.json = 11 985 B ≤ 12 288; najťažší iný jazyk uk 13 177 B ≤ 13 312
  (cs 12 438, de 12 222, en 12 046, hu 12 448, pl 12 583, sr 12 114). Prvé okno proti f624ee8: app.js 20 497 → 20 794
  (+297), style.css 20 802 → 20 996 (+194) = +491 B ≤ 500. index.html diff 0 B. Splnené.

## Verdikt kola 1 (v2)

Nový princíp funguje: v 1 528 slepých otázkach žiadna cena ani trvanie **inej** služby, všetky čísla zo stránky,
P3 výrez pri všetkých cenách služieb, P4 dodržané, odovzdanie navyše klesol z 25,7 % na 10,49 %.
**Neprijaté pre 3 holé odpovede** (dve triedy, ktoré P1 v praxi neuplatňuje):
1. **W:** pracovné dni, „zajtra/ráno“ a čas `hh:mm` sú výplň → „strih o 21:00?“ dostane 18 €. Návrh: dni a časy
   dať ako kmene položky hodiny (alebo vlastnej triedy „kedy“), čas nemazať, ale rátať ako slovo hodín.
2. **D:** druhá osoba so spojkou („pre syna a pre mňa“) → len cena deti. Návrh: spojka + zámeno prvej osoby po menovanej
   osobe = druhá vec → „Myslíš toto?“ [deti, pánsky strih].
3. **Test:** orákulum P6 nesmie preberať `vypln`/`stop` z dát; pridať dni Po–Pi, `hh:mm` a dvojice osôb.
Ďalej: čas zhody > 5 ms pri dlhých otázkach, `ceny-konecne` bez výrezu (P3), voľba trvania pri cenovej otázke
s „long/dlho“ a nesúvisiace štítky tém (`produkty` pri zápore, `damske` pri „dcéra píše za mňa“, `vek` pri 70-ročnom otcovi).

Súbory v tomto priečinku: `spust-slepe-v2.mjs`, `zarad-v2-1.py`, `zarad-v2-1-rucne.py`, `cas-v2-1.mjs`,
`vysledky-{A,B,C2,D1,D2}-v2-1.jsonl`, `vysledky-*-v2-1-zarad.json`, `vysledky-*-v2-1-final.json`.
