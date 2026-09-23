# HEADSPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript bez frameworku; minifikáciu robí `node tools/build.mjs`, film používa Three.js v `assets/vendor/`.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 17 rituálov v piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (jeden záber miestnosti s paralaxou), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Pri krátkej výške okna a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` a `assets/img/galeria/` – fotografie salónu pre galériu (dvere, Budha, miestnosť, vodný oblúk, uteráky, lôžko)
- `assets/fonts/` – dve písma: Lora (500 a kurzíva 400) na nadpisy, Manrope (400 a 700) na text aj štítky, hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v 480 a 800 px v AVIF, WebP a JPG, pre dvere v úvode aj zaostrená 1600 a 2400 px WebP
- `assets/img/film/` – fotky filmu na pozadí (README Film zo skutočných fotiek), `assets/world.js` – film
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona, lotos v zlatom kruhu ako na svietiacom nápise v salóne

## Film zo skutočných fotiek

Pozadie celého webu je film zo skutočných fotiek salónu (`assets/world.js`, Three.js r169
v `assets/vendor/`), nie vymodelovaná scéna. Každá fotka má hĺbkovú mapu, takže kamera sa v nej
pohne ako v skutočnej miestnosti: lôžka a misy vpredu sa posúvajú viac ako stena za nimi.
Pri skrolovaní ide kamera pomalým filmovým pohybom (nájazd, prejazd do strany, zdvih) a medzi
časťami webu sa zábery prelínajú, kým ich zakrýva textová doska. Text leží na tmavých doskách.

| Časť | Záber |
| --- | --- |
| Úvod | `okna` (tá istá miestnosť ako v otvore dverí a vo fotke úvodu bez 3D) |
| Ako to prebieha | `voda` |
| Rituály a ceny | `zhora`, potom v okne každej kategórie jej priestor (fotka kategórie z cenníka) |
| Poukážky | `buddha` |
| Tím | `lozko` |
| Salón 30 | `miestnost` |
| Galéria | `neon-spa` |
| Otázky | `komoda` |
| Kontakt | `neon-head-spa` |

- Fotky sú v `assets/img/film/`: zaostrené, v šírkach 2172 (dvojnásobok originálu), 1448 a
  1086 px, každá v AVIF (o tretinu menšie) aj WebP, a `<meno>-hlbka.webp` (svetlá = blízko).
  Zaostrená fotka je z polovice zmiešaná s verným zväčšením originálu, aby mach, tapeta,
  uteráky a mosadz ostali také, aké sú. Skript vyberie najmenšiu šírku, ktorá na obrazovke
  nebude zväčšená o viac ako 5 %, AVIF s návratom na WebP.
- Načítanie: najprv záber, kde návštevník je (pri skoku cez menu cieľ), potom susedia. V pamäti
  sú najviac štyri zábery, preskočené sťahovanie sa ruší. Obrázok sa po nahratí do grafickej
  karty uvoľní. Skrytá kategória cenníka (filter) z filmu vypadne.
- Ostrosť: plné rozlíšenie displeja do 2x, fotky bez tónovania a bez hmly, farby presne ako na
  fotke. Jediná úprava obrazu je jemná vinetácia na okrajoch a pri prelínaní krátke stmavnutie o 22 %.
- Oblúk: kamera sa pri každom zábere posúva do strany (4 % šírky, na telefóne 2,6 %) a pozerá sa stále na bod záujmu, takže popredie sa posúva voči stene. Myš a naklonenie telefónu pridajú ďalší oblúk.
- Pohyb: kriticky tlmená pružina, prelínanie v strede medzi časťami, v pokoji sa dokončí na
  bližší záber. V pokoji jemné dýchanie kamery 30 snímok za sekundu, po 25 s bez pohybu kreslenie
  stojí. Na počítači sa perspektíva pohne za myšou, na Androide pri naklonení (mŕtva zóna 0,7°),
  iPhone nie (vyžadoval by povolenie).
  Pomalé zariadenie si zníži rozlíšenie (meria sa voči najkratšej snímke, 30 Hz nie je pomalé).
- Sekcie sú vo filme vyššie ako odhad `content-visibility`, preto sa po prvom pohybe postupne vo
  voľných chvíľach vykreslia všetky a pri kliknutí na odkaz v stránke hneď. Príchod s `#kotvou`
  (trieda `cv-all` z hlavičky) vykreslí všetko hneď, aby stránka pristala presne.
- Hlavička kategórie v cenníku je okno do filmu (74 % výšky, na mobile 64 %); bez 3D ukazuje fotku.
- Trieda `world` sa pridá v hlave stránky len pri WebGL2 (three r169 iný nevie), nie pri
  obmedzení pohybu, šetrení dát a nízkej obrazovke; `world-in` až keď je prvý záber nakreslený.
  Keď do 15 s nepríde žiadna fotka, film sa ukončí a ostáva pokojný web.
- Telefón: fotky najviac 1448 px, do grafickej karty sa nahrávajú po pásoch 256 riadkov (štyri
  pásy na snímku), takže prelínanie nezasekne. Vinetácia sa kreslí v tom istom prechode ako
  fotka, shadery sú preložené vopred a posledný krok znižovania kvality je 30 snímok za sekundu.
  Film sa zapne len pri aspoň 4 GB pamäti a 4 jadrách, slabší telefón dostane pokojný úvod s fotkou.
- Rytmus: záber cez celú obrazovku, potom plný pás cez celú šírku s veľkým písmom (vrstva Luxusná kompozícia
  na konci `assets/style.css`), prechody medzi záberom a pásom sú mäkké, cenník je menu s vlasovými linkami.
- Lighthouse (lokálne, bez gzip): mobil 82 až 86, desktop 98, prístupnosť 100, TBT 0 ms.

## Admin (admin/)

Admin je na adrese `/admin/` (Google ho neindexuje, robots.txt ho vylučuje). Prihlásenie je kľúčom
GitHub (fine-grained token s právom Contents: Read and write len na tento repozitár), návod je priamo
na prihlasovacej stránke. Kľúč ostáva v prehliadači, nikam sa neposiela okrem GitHub API.

- Mení: oznam pod lištou (s prekladmi), cenu, dĺžku, podnadpis a popis každého rituálu (s prekladmi),
  otváracie hodiny, telefón, kód štatistík GoatCounter. Obsahuje zoznam obrázkov poukážok do Booqme a odkazy.
- Uloženie je jeden commit priamo do `main` (index.html a `assets/i18n/*.json`), GitHub Pages web
  obnoví do dvoch minút. Minifikované súbory sa nemenia, build netreba.
- Jediný zdroj údajov: blok `<script type="application/json" id="nastavenia">` v index.html (hodiny,
  štatistiky), `app.js` z neho berie otváracie hodiny. Cena a dĺžka rituálu sú len v karte rituálu
  a v dátach pre Google, otázky ceny neopakujú. Rozpätie cien a dĺžok v popisoch admin prepočíta.
- Telefón admin vymení vo všetkých tvaroch (0911 153 136, +421 911 153 136, tel:) aj v prekladoch.
- Keď admin uloží a súbor sa medzitým zmenil inde, uloženie odmietne a načíta aktuálny stav.
- Štatistiky: GoatCounter bez cookies sa načíta len s kódom v nastaveniach; kliky na Rezervovať,
  Zavolať, E-mail, Mapa, Kúpiť poukaz, Instagram alebo Facebook a náhľad poukazu sa počítajú ako udalosti.
- Kontrola s Booqme: `node tools/booqme-kontrola.mjs` porovná ceny a dĺžky v online kalendári
  a ceny poukazov v obchode s cenníkom webu (len verejné stránky, nič nemení).

## Úvodné dvere

Raz za návštevu sa pri otvorení stránky ukážu skutočné dvere salónu (`.veil`): fotka dverí
(`assets/img/dvere-*.webp`, zaostrená) prekryje obrazovku, rám ostane stáť a obe krídla vystrihnuté
z tej istej fotky sa v CSS 3D otvoria dnu a stmavnú. V otvore je salón (`okna`), potom
kamera prejde dnu. Krídla sa otočia 0,56 s (telefón 0,7 s) po načítaní fotky, celé to trvá asi
1,7 s. Kým fotka dverí nie je pripravená, je tma a kreslí sa značka; keď do 0,9 s nepríde, dvere
sa preskočia a tma sa rozplynie.

## Úvod

Úvod má jednu obrazovku, žiadne kapitoly. Po otvorení dverí sa miestnosť salónu pri oknách
(`okna`, tá istá ako v otvore dverí) pomaly vynorí z tmy a usadí sa, nadpis nastúpi po slovách. Pri skrolovaní
fotka zaostáva za stránkou, miestnosť stmavne a text odíde rýchlejšie, takže sa vrstvy od seba
oddelia; hneď pod tým začína Ako to prebieha.

Technika (`makeReel` v `assets/app.js`, štýly `.reel` v `assets/style.css`):
- Nástup je čisté CSS (`settle`, `shadeOut`), čaká na dvere cez `--veil`. Pri skrolovaní
  skript mení len `transform` a priehľadnosť (`.fs`, `.lift`) a premennú `--p` na stmavnutie.
- Fotka (`okna`, miestnosť pri oknách, tá istá ako v otvore dverí) má `fetchpriority="high"` a pre telefón vlastný výrez na výšku (`okna-m`).
  Končí 5 % nad spodkom pod tmavým prechodom; záber na celú obrazovku by prehliadač bral ako
  pozadie a LCP by meral až nadpis.
- Pri obmedzení pohybu a na nízkej obrazovke na šírku sa ukáže pokojný úvod s fotkou nápisu.
## Vrstva V9 (agentúrny vzhľad, už sa nenačítava)

`assets/premium-v9.css` a `assets/premium-v9.js` sú prekrytie nad základným webom: väčšie
editoriálne nadpisy, číslovanie sekcií 01 až 11, tenká linka priebehu skrolu hore, aktívna
položka v navigácii, atmosféra podľa sekcie, svetlo pod kurzorom a odlesk na kartách (len
na počítači s myšou, nie pri obmedzenom pohybu ani pri šetrení dát). Obsah, ceny, Booqme,
formuláre ani preklady nemení. Vypnutie: zmazať dva riadky `premium-v9.min.*` v `index.html`.
Podklady sú v `docs/v9/`.

## Poukazy online cez Booqme

V Booqme (Poukážky, Typy poukážok) je sedemnásť typov poukazu, jeden na každý rituál
z ponuky, s cenou rituálu, platnosťou 365 dní od zakúpenia a popisom podľa
docs/booqme-poukazy.csv. Žiadne poukazy na sumu, len to, čo salón ponúka. Verejný obchod
je na https://booqme.app/sk/eshop/barbershop-30 a vedie naň tlačidlo Kúpiť poukaz online.
Platba kartou funguje až po prepojení Stripe Connect v Booqme (Nastavenia, Stripe Connect);
dovtedy je druhou cestou formulár na webe, ktorý otvorí e-mail s objednávkou. Na webe si
zákazník vyberá rituál z rovnakých sedemnástich, karta poukazu ukáže jeho meno.
Obrázok poukazu v Booqme (misa s vodou, A6 na šírku) je v docs/poukaz-a6.jpg; rezervačná
stránka Booqme má logo z assets/icon-512.png, tmavozelené pozadie, zlatý názov, odkaz na
Instagram a na tento web.

## Darčekové poukazy ako predajná sekcia

Sekcia Poukážky má nadpis, dve vety, tlačidlo do obchodu Booqme a poukážku salónu (`vzor`).
Pod ňou je výber Poukaz na rituál so všetkými sedemnástimi rituálmi: prvé štyri Head Spa
rituály ukážu vzor salónu, ostatné vlastnú poukážku s fotkou rituálu
(`assets/img/poukaz/<rituál>-{800,1290}.{avif,webp}`, vyrobené z `docs/poukazky/dl/png/`).
Obrázok sa stiahne až po výbere. Žiadne hodnoty v eurách, poukaz je vždy na rituál.

## Postup rituálu ako číslovaný sled

Kroky v rozbalenej karte rituálu už nie sú odrážky pod sebou. Každý krok má
číslo v zlatom krúžku a vlasovú linku nad sebou, na širokej obrazovke v dvoch
stĺpcoch, na telefóne v jednom. Zmena je len v CSS, obsah krokov zostal.

## Záverečná výzva pred pätičkou

Stránku uzatvára kontakt s rezerváciou; samostatná záverečná sekcia bola zrušená.

## Kam vedú tlačidlá

Adresa online kalendára je na jedinom mieste, v atribúte `data-booking` na
`<html>` v `index.html`. Skript pri načítaní prepíše každé tlačidlo `a.btn`,
ktoré smerovalo na `#rezervacia`, na túto adresu a otvorí ju v novej karte.
Zmena rezervačného systému je teda úprava jedného reťazca.

Pôvodný odkaz na Booqme (`booqme.app/sk/rezervacia/salon-30`) v septembri
prestal existovať, vracal chybu 404, takže všetky tlačidlá aj nákup poukazu
viedli do prázdna. Nahradila ho funkčná online rezervácia Salónu 30.

Formulár v sekcii `#rezervacia` zostáva ako záloha pre rituály, ktoré v kalendári
ešte nie sú. Vedie naň položka Rezervácia v menu a odkaz v otázkach. Bez
JavaScriptu tlačidlá skončia pri formulári, takže sa nikto nestratí.

## Bez opakovania

Zo stránky odišlo všetko, čo len opakovalo iné miesto: sekcie Prečo k nám, Tím
a Čo je Head Spa (hovorila to isté ako Ako to prebieha), citáty medzi sekciami,
mantra, zoznamy Solo/Duo/Darček a Kedy príde vhod, rýchly prehľad cien a dlaždice
rituálov pri poukaze (tretí a štvrtý zoznam tých istých sedemnástich rituálov)
a stĺpec Kontakt v pätičke (kontakt je hneď nad ňou). Rezervovať vedie z úvodu,
z kariet rituálov, z kontaktu a zo spodnej lišty na telefóne.

Karty rituálov sú na počítači v dvoch stĺpcoch, aby cenník nebol natiahnutý na
celú šírku s prázdnym miestom vpravo. Na tablete a telefóne zostáva jeden stĺpec.

## Nadväznosť sekcií

Poradie sekcií je príbeh návštevy: úvod, Ako to prebieha (čo Head Spa je), Rituály
a ceny (výber), Rezervácia (termín), Darčekové poukážky (ten istý rituál ako dar),
Salón 30 (kde), Galéria (pohľad za dvere), Otázky (pred návštevou) a Kontakt. Menu,
mobilné menu aj pätička majú rovnaké poradie.

Každá sekcia končí riadkom `p.next`: štítok Ďalej a jedna veta kurzívou, ktorá je
odkazom na nasledujúcu sekciu („Vybrané? Termín si dohodneš hneď nižšie.“). Za ním
je zlatá deliaca čiara (`div.divider`), rovnaká medzi všetkými sekciami. Sekcia Ako
to prebieha má namiesto riadku tlačidlo Vybrať si rituál. Vety sú v prekladoch ako
ostatné texty.

## Cenník bez poradcu a filtrov

Nad cenníkom sú len kategórie (Head Spa, Pánske, Deti, Pre dvoch, Chodidlá). Poradca s tromi
otázkami, filter podľa času a rozpočtu, číselný prehľad (17 rituálov, 40 až 120 minút,
45 až 149 €) aj kadernícky cenník Salónu 30 boli odstránené: na stránke sú iba rituály
a ceny HEAD SPA 30.

## Čo web robí sám

- Na telefóne a tablete má menu (ikona vpravo hore), na počítači odkazy v lište. Lišta sa pri čítaní smerom dole schová a pri prvom pohybe hore sa vráti.
- V kontakte a v menu ukazuje, či je salón práve otvorený (počíta sa podľa času v Bratislave z otváracích hodín v kóde, `HOURS` v `app.js`).
- Sekcie sa objavujú pri rolovaní, na počítači s jemnou myšou (tlačidlá sa nakláňajú k ruke, karty nesú svetlo pod kurzorom). Pri zapnutom obmedzení pohybu je všetko statické.
- Mapa v kontakte je vložená Google mapa adresy; keby sa nenačítala, ostane adresa a odkaz na navigáciu.

## Náhľad

Dvojklik na `index.html` funguje. Pre plný zážitok so scrollom spustite lokálny server v priečinku projektu:

```
npx http-server -p 8080
```

a otvorte `http://localhost:8080`.

## Nasadenie

Web beží zadarmo na GitHub Pages: https://d8f5s88zjy-art.github.io/head-spa-30/. Nasadenie robí automaticky `.github/workflows/pages.yml` pri každom pushi (repozitár musí byť verejný, alebo účet s GitHub Pro). Pri presune na vlastnú doménu upravte v `index.html` značky `canonical`, `og:url` a `og:image` (miesto je označené komentárom `DEPLOY STEP`) a v nastaveniach Pages zadajte doménu.

## Rezervácia

Sekcia Rezervácia (vlastná položka v lište) umožňuje vybrať ktorýkoľvek zo 17 rituálov, deň a časové okno. Tlačidlo Rezervovať pri rituáli v cenníku daný rituál rovno predvyberie. Formulár kontroluje otváracie hodiny, dĺžku rituálu a nedele, potom otvorí hotovú správu vo WhatsApp (0911 153 136) alebo v e-maile. Web nič neukladá, správa odchádza z telefónu zákazníka. Odkaz sa dá aj zdieľať s predvybraným rituálom, napríklad `?ritual=zlaty-ritual-24k#rezervacia`.

Kalendár online rezerváciu zostáva ako druhá možnosť pod formulárom.

## Darčekové poukážky

Sekcia Poukážky (vlastná položka v lište): tlačidlo Kúpiť poukaz online vedie do obchodu Booqme
(https://booqme.app/sk/eshop/barbershop-30), kde sa poukaz platí kartou. Objednávkový formulár
na webe už nie je, všetko ide cez Booqme.

## Galéria

Sekcia Galéria je mozaika trinástich fotografií salónu, zoradená ako prechádzka: zelené dvere,
svietiaci nápis HEAD SPA, miestnosť s dvoma lôžkami, lôžka s vodnými misami, vodný oblúk,
lôžko s orchideou, pripravené lôžka, lôžko pod nápisom Spa relax, pohľad zhora, komoda
s uterákmi, Budha so sviečkami, nápis Spa relax a miestnosť pri oknách.
Obrázky sú v `assets/img/galeria/` v troch šírkach (480, 800, 1200 px) ako AVIF, WebP a JPG,
zdroje v plnej veľkosti sú `*.jpg` bez prípony šírky. Každá fotka sa dá otvoriť vo zväčšení.
Rozloženie mozaiky určujú triedy na `<figure>` (`door`, `voda`, `rings`, ..., `r3`, `r4`), nie fotky;
pri výmene poradia sa presúva len obsah figúry a atribút `sizes` ostáva podľa miesta v mozaike.

## Luxusná vrstva

Na konci `assets/style.css` je vrstva, ktorá drží celú stránku v jednom pokojnom jazyku:
veľa priestoru medzi sekciami (`--lux-space`), vlasové linky namiesto kariet, ploché hranaté
tlačidlá s verzálkami, rádius 2 px, zlatá `#c9a66b` len na štítky, linky a akcent v nadpise.
Každý rituál je v pokojnom okienku (jemné pozadie, tenký rámik, bez ikon a čísel): názov,
podtitul kurzívou, trvanie a cena vpravo. Filtre sú text s linkou. Preč sú štatistiky v úvode, odkazy Ďalej, zlaté deliace čiary, vzor listov,
ikonky a čísla na kartách, naklonený lístok, prúžok postupu a vrstva V9 (magnetické tlačidlá,
svetlo pod kurzorom).

## Identita z prevádzky

Web má vyzerať ako miestnosť, do ktorej zákazník vojde. Farby, materiály aj pohyb sú odpísané
z fotiek salónu, nič nie je všeobecná „spa“ paleta.

| V prevádzke | Na webe |
| --- | --- |
| Svietiace logo: machový kruh, **HEAD SPA** verzálkami, pod tým **salon30**, lotos, **NITRA** | značka v lište, v pätičke, na lístkoch aj na dverách v úvode: lotos v zlatom kruhu (`.mark`), vedľa **HEAD SPA 30** verzálkami a *salon30 · Nitra* zlatou kurzívou Lora; rovnaký lotos je `favicon.svg` |
| Orech, parkety rybia kosť, drevená mozaika za logom | plátno a panely v tónoch orecha (`--canvas #0c0906`, `--panel #1a130d`, `--panel-2 #22190f`), rámy kariet a fotiek `--wood-line` |
| Fľaškovo zelené dvojkrídlové dvere s mosadznými kruhmi | `--door #1f3328`: lístok rezervácie a poukazu, dvere pri vstupe na stránku |
| Olivové zamatové závesy a stena | `--olive #5d5a2a` |
| Tapeta so zlatohnedými listami | jemný vzor listov len v bočných okrajoch sekcií Ako to prebieha a Galéria, nikdy pod textom |
| Mosadzné misky, zlaté rámy | zlatá `--accent #d9b56a` ostáva jediným akcentom rozhrania |
| LED pás za logom, sviečky | `--glow #f0a65a`: svit pod nápisom v úvode, plameň na poukaze |
| Biele uteráky, orchidey | `--cream`, `--orchid` len ako rezerva, nie farba rozhrania |
| Vane s modrou a zelenou vodou | tyrkys `--water` len pri vode (linka krokov a voda na fotkách) |

Zelenočierne odtiene z predchádzajúcej verzie sú v `assets/style.css` a `assets/premium-v9.css`
nahradené premennými: `rgba(var(--ink),a)` pre tiene a clony, `rgba(var(--walnut),a)`
a `rgba(var(--walnut-2),a)` pre panely. Aj kreslená scéna v úvode (`assets/app.js`) má miestnosť
v tónoch orecha.

Kontrast textu (WCAG): hlavný text `#f4ece0` 16,9 : 1 na plátne a 11,5 : 1 na zelenom lístku,
vedľajší `#d2c6b5` 11,8 : 1 a 8,0 : 1, najslabší `#aa9d8b` 7,5 : 1 na plátne a 5,1 : 1 na lístku,
zlatá 10,2 : 1, tmavý text na zlatom tlačidle 9,6 : 1.

### Kde je ktorá fotka

| Miesto | Fotka |
| --- | --- |
| Úvod | `okna` (pozri Úvod); pokojná verzia úvodu `neon-head-spa` |
| Ako to prebieha | `voda` pod textom, nad vodou stúpa para |
| Cenník, hlavičky kategórií | Head Spa `lozka-sviecka`, Pánske `komoda`, Deti `spa-relax-lozko`, Pre dvoch `miestnost`, Chodidlá `lozka-spa` |
| Poukážky | poukážka salónu `vzor`; po výbere rituálu jeho poukážka (`assets/img/poukaz/`, tie isté ako tlačené) |
| Salón 30 | `okna`, `buddha`, `komoda` |
| Galéria | všetkých 13 (poradie vyššie) |
| Kontakt | `dvere` vedľa mapy, „Hľadaj zelené dvere“; mapa okolia `mapa-*` (podklad © OpenStreetMap, zafarbená do tónov webu, značka salónu v strede) namiesto vloženej Google mapy |

Fotky na poukážkach rituálov sú čiastočne z Pexels (licencia a autori v
`docs/poukazky/dl/FOTKY.md`), ostatné sú zo salónu. Keď budú vlastné, stačí prepísať súbory
v `docs/poukazky/dl/foto/`, spustiť `node docs/poukazky/dl/build.mjs` a znova vyrobiť
`assets/img/poukaz/*` (800 a 1290 px, 2 : 1, AVIF a WebP).

### Pohyb podľa miestnosti

- svit LED pásu nad nápisom v úvode sa pomaly nadýchne (`ledBreath`, 10 s),
- na poukaze bliká plameň sviečky, len žiara, text stojí (`candle`),
- nad vodným oblúkom v sekcii Ako to prebieha stúpa para (`steamRise`).

Fotky sa pri pohybe nezväčšujú o viac ako 5 % (dosadnutie galérie, prejdenie myšou).
Pri `prefers-reduced-motion: reduce` stojí všetko a všetko je viditeľné; mimo obrazovky
a pri nečinnosti sa animácie pozastavia.

## Rezervácie

Všetky tlačidlá Rezervovať vedú na rezervačnú stránku online rezerváciu https://www.salon30.sk/rezervacia (adresa je v `scratchpad/build.py` ako `BOOK` a v šablóne). Zoznam 17 programov na nahratie do online rezerváciu je v `docs/booqme-programy.xlsx`. Telefón a e-mail sú v sekcii Kontakt.

## Kontakt a otváracie hodiny

Všetky kontakty na stránke patria Salónu 30, materskej prevádzke: telefón 0911 153 136,
e-mail info@salon30.sk, web www.salon30.sk, Instagram salon30_nitra, Facebook Salon30_nitra,
adresa Mostná 226/30, 949 01 Nitra. Otváracie hodiny sú prevzaté zo salon30.sk:
pondelok až piatok 09:00 až 18:00, sobota 09:00 až 15:00, nedeľa zatvorené.
Rovnaké hodiny sú v schéme `openingHoursSpecification`, v pätičke, v kontakte,
v hlásení Dnes otvorené (`assets/app.js`, konštanta `HOURS`) a v kontrole termínov.
Ak sa hodiny zmenia, treba ich upraviť na všetkých týchto miestach naraz.

## Sekcia Salón 30

Sekcia `#salon` opisuje materské kaderníctvo: kozmetika Oroexpert, trichologické vyšetrenie
mikrokamerou (vlasová stylistka Kristína Salayová), šesť kaderníčok a orientačné ceny
kaderníckych služieb. Všetko je prevzaté z www.salon30.sk, stav 11. 9. 2026. Nič nie je vymyslené.

## Typografia po slovensky

V `index.html` sú pevné medzery (`&nbsp;`, znak U+00A0) za jednopísmenovými
predložkami a spojkami (a, i, k, o, s, u, v, z) a medzi číslom a jednotkou
(50 €, 40 min, 2 osoby). Sadzba tak nikdy nenechá osamelé „v“ na konci riadku
a cena sa nezalomí. Prekladom to nevadí: `assets/i18n.js` medzery normalizuje,
takže kľúč zostáva rovnaký.

Pri písaní nových textov stačí spustiť rovnaké pravidlo, alebo medzery doplniť
ručne. Značka je zviazaná celá: `HEAD SPA 30` aj `Salón 30` majú pevné medzery,
aby sa nelámali na dva riadky.

## Texty pri rituáloch

Karty rituálov majú tri vrstvy textu: `.tag` (jedna veta nad názvom), `.desc`
(čo rituál je) a odseky v `O rituále` (ako prebieha). Kroky v `<ol>` sú prevzaté
z ponuky prevádzky a neprepisujú sa.

Celá stránka **tyká**, vrátane kariet a formulára na poukaz. Pri písaní nových
textov sa toho treba držať, inak stránka pôsobí, akoby ju písali dvaja ľudia.
Rovnaké pravidlo platí pre preklady: všetkých šesť jazykov oslovuje neformálne
(ty, du, ty, te, ти, you).

Každá karta má `id` zhodné s `data-id`, takže na ňu vedie odkaz z rýchleho
prehľadu cien aj zvonka. Kvôli lepkavému filtru má `.card[id]`
`scroll-margin-top`, inak by nadpis skončil pod filtrom.

## Drobnosti, ktoré nie sú vidieť

- Titulok stránky má 55 znakov a meta popis 133, aby ich Google neorezal.
- `sitemap.xml` má `lastmod` pri každej zo siedmich jazykových adries.
- Tlačidlo Späť hore (`#toTop`) sa objaví po dvoch obrazovkách skrolovania,
  na mobile sedí nad lištou s tlačidlami Zavolať a Rezervovať. Pri tlači sa skryje.
- Nadpisy v hrdinskej sekcii sa lámu na slová (`data-split`), preto sa prekladajú
  po slovách: `Teplo.`, `Voda.`, `Ticho.`, `Tvoj`, `termín`, `čaká.` sú vlastné
  kľúče v jazykových súboroch.

## Rezervácia priamo na stránke

Sekcia `#rezervacia` je návrat formulára, ktorý bol na webe od začiatku a v septembri
sa stratil, keď všetky tlačidlá začali smerovať rovno do online rezerváciu. Logika v
`assets/app.js` medzitým zostala celá, chýbala len značka, takže sa dala vrátiť
bez písania nového kódu.

Ako to funguje:

1. Návštevník ťukne na Rezervovať pri rituáli. Tlačidlo má `data-book` so slugom
   rituálu a odkazuje na `#rezervacia`. Skript ten rituál vyberie vo formulári
   a lístok vpravo hneď ukáže názov, trvanie a cenu.
2. Deň si vyberie ťuknutím. Skript ponúkne desať najbližších otvorených dní ako
   dlaždice `Dnes`, `Zajtra`, `po 21. 9.` a podobne. Nedeľa sa v ponuke nikdy
   neobjaví a dnešok zhasne, keď už sa vybraný rituál do zvyšku dňa nezmestí.
   Kto chce termín ďalej v kalendári, otvorí `Iný deň` a dostane bežné pole
   s dátumom. Ak doň napíše nedeľu, deň sa posunie na pondelok a povie to.
3. Doplní časové okno (prípadne presný čas a náhradný termín), počet osôb,
   meno, telefón a poznámku. Formulár pozná otváracie hodiny, takže nedovolí
   termín, ktorý sa do nich nezmestí.
4. Odošle to cez WhatsApp. Pod tlačidlami je veta, kedy sa salón ozve, počítaná
   z otváracích hodín a z času v Bratislave, nie z času na telefóne návštevníka.
   Telefón je druhé tlačidlo, e-mail zostal len ako záloha v drobnom texte,
   lebo schránku salón číta zriedka.
5. Web nič neukladá ani nikam neposiela. Správa sa skladá v prehliadači
   a odchádza z telefónu návštevníka, každá má referenciu `HS30-XXXX`.

Rozpísaný formulár prežije obnovenie stránky. Ukladá sa do `localStorage` pod
kľúčom `hs30-rezervacia`, platí 24 hodín a po odoslaní sa maže. V súkromnom
režime sa jednoducho neuloží a formulár funguje ďalej.

Dni, názvy dní a veta o potvrdení sú v siedmich jazykoch priamo v `assets/app.js`
(`DAY_WORDS`, `CONFIRM_WORDS`), pretože vznikajú za behu a v prekladových
súboroch by nemali kľúč. Pri zmene jazyka sa dlaždice prekreslia.

Odkaz na online kalendár je na jednom jedinom mieste, v bloku `Radšej kalendár?`
v tej istej sekcii. Keď salón prejde na iný rezervačný systém, mení sa jedna adresa.

## Tlač

`@media print` v `assets/style.css` skryje navigáciu, animácie a ostatné sekcie
a vytlačí sa hlavička so značkou, karty rituálov v jednom stĺpci (názov, trvanie,
cena, krátky popis) a pätička, dokopy dve strany A4.

## Poukaz na konkrétny rituál

Poukaz nie je na sumu, ale na jeden zo sedemnástich rituálov. Na webe sa rituál vyberá
v `#voucher-ritual` pod poukážkou, hodnota `option` je meno obrázka poukážky. V Booqme je sedemnásť typov poukazov,
jeden na rituál (`docs/booqme-poukazy.csv`).

## Ponuka: sedemnásť rituálov pre hlavu

Cenník má **17 rituálov** v piatich kategóriách: Head Spa (7), pánske (4), detský (1),
pre dvoch (2) a pre chodidlá (3). Trvanie 40 až 120 minút, ceny 45 až 149 €, presne
podľa ponuky salónu (`docs/booqme-sluzby.csv`). Žiadny strieborný ani zlatý Head Spa
rituál, tie salón neponúka.

Všetkých sedemnásť je z podkladov salónu (maily s obsahom rituálov). Rituály pre chodidlá
sú tri a majú vlastnú kategóriu.

Pri zmene ponuky treba prejsť aj miesta, kde je počet alebo rozpätie napísané
slovami: hlavička cenníka, dlaždice v hlavičke a v hrdinskej sekcii, výber rituálu
v rezervácii a v poukaze, `priceRange`
a ponuky v štruktúrovaných dátach, odpovede v otázkach, meta popisy a preklady.

## Jazyky

Stránka je v siedmich jazykoch: slovenčina, čeština, poľština, maďarčina,
nemčina, ukrajinčina a angličtina. Teda Slovensko a všetky susedné krajiny plus angličtina.

Ako to funguje:

- Slovenčina je priamo v `index.html`, žiadny zvláštny súbor nepotrebuje.
- `assets/i18n/<jazyk>.json` je objekt, kde kľúč je slovenský text zo stránky
  a hodnota je jeho preklad. Kľúčuje sa textom, nie poradím, takže presun sekcií
  v HTML preklady nerozbije. Text bez kľúča zostane po slovensky.
- `assets/i18n.js` po načítaní prejde textové uzly a vybrané atribúty
  (`placeholder`, `aria-label`, `alt`, `title`, meta popisy, `<title>`) a vymení ich.
  HTML preto nepotrebuje žiadne značky navyše. Element s `data-no-i18n` sa preskočí.
- Jazyk sa vyberie v poradí: `?lang=xx` v odkaze, uložená voľba v `localStorage`,
  jazyk prehliadača, inak slovenčina. Voľba sa zapíše do adresy, takže sa dá poslať odkaz.
- Text "Dnes otvorené do 18:00" vzniká až v prehliadači, preto má vlastné preklady
  priamo v `assets/app.js` (`TODAY_WORDS`), nie v JSON súboroch.
- Keď sa preklad nestiahne, stránka zostane slovenská a plne funkčná.
- V hlavičke sú `hreflang` odkazy na všetkých sedem jazykov plus `x-default`,
  to isté má aj `sitemap.xml`.

**Keď pribudne nový text v `index.html`**, stačí doň pridať nový kľúč do šiestich
jazykových súborov. Kým tam nie je, tá jedna veta sa zobrazí po slovensky
a zvyšok stránky ostane preložený.

## Rýchlosť a prístupnosť

Stránka je postavená tak, aby sa prvá obrazovka vykreslila bez čakania na skript.
Čo to v praxi znamená:

- Písma sú priamo v hlavičke stránky a štýl sa načítava ako prvý súbor, ešte pred
  popismi pre vyhľadávače a zdieľanie.
- Prvý nadpis je rozdelený na slová už v HTML, takže ho prehliadač vykreslí hneď.
  Skript ho znova nerozdeľuje, iba prevezme animáciu pri skrolovaní.
- Úvodná kapitola cesty má plnú viditeľnosť priamo v CSS a jej nábeh je obyčajná
  CSS animácia. Telo stránky sa už neskrýva, kým nenabehne skript.
- Scéna hero sekcie (plátno s vodou a parou) sa zapína až keď má prehliadač voľnú
  chvíľu, najneskôr pri prvom skrolovaní. Do vtedy je na jej mieste rovnaký
  farebný podklad.
- Štruktúrované dáta pre vyhľadávače sú na konci stránky, aby nebrzdili prvé
  vykreslenie.

Merané cez Lighthouse na serveri s kompresiou (rovnako ako GitHub Pages):
výkon, prístupnosť, osvedčené postupy aj SEO 100 zo 100 na počítači.

Pri prístupnosti platí: tlačidlá hodnoty poukazu nie sú zoznam, ale skupina
tlačidiel s aria-pressed, výber jazyka je menu s aria-checked a značka v hlavičke
aj v pätičke nesie svoj viditeľný text (popis je v title).

## Seniorský prechod

Zadanie pre tento prechod je v `docs/prompt-senior.md`. Čo z neho vyplynulo:

- Sekcia Tím už neukazuje prázdne karty s nápisom "Meno doplníme". Namiesto nich
  sú tri karty o tom, ako rituál vedie človek: konzultácia, tlak a teplota na
  mieru, záver v kaderníckych rukách. Keď budú fotografie, karty sa vymenia za
  profily podľa poznámky priamo v HTML.
- Bez JavaScriptu stránka už nie je poloprázdna. Na `<html>` je trieda `no-js`,
  ktorú skript hneď zmaže. Kým tam je, ukáže sa statický úvod a všetko ostatné je
  v koncovom stave.
- Tlačidlá do kalendára majú adresu priamo v HTML (`data-booking-link`), takže
  vedú do kalendára aj bez skriptu. Skript ich už len drží zhodné s `data-booking`
  na `<html>`.
- Kapitoly úvodnej cesty, ktoré nie sú na obrazovke, majú `inert`. Klávesnica cez
  ne už neprechádza.
- Hlavička sa zmestí aj do 320 px.
- Pribudla stránka `404.html` v štýle webu. GitHub Pages ju ukáže pri zlom odkaze.

## Dvere na úvode

Dvere sa otvárajú raz za návštevu (drží to `sessionStorage`). Sú to skutočné dvere salónu
z fotky (README Úvodné dvere): krídla sa otočia 0,56 s (telefón 0,7 s) po načítaní fotky, celé to
trvá asi 1,7 s a medzitým zlatý lotos zo stredu dverí preletí na svoje miesto v lište. Pri
obmedzení pohybu, šetrení dát, v skrytej karte alebo pri príchode cez odkaz na konkrétnu časť
(`#rituály`) sa dvere preskočia a stránka je hneď hotová.

Stará verzia dverí stála devätnásť bodov výkonu, lebo telo stránky bolo do
konca animácie neviditeľné. Teraz je stránka vykreslená hneď a dvere sú len
vrstva nad ňou. Fotka dverí sa prednačíta s bežnou prioritou a fotka v otvore sa
sťahuje až keď sú dvere na obrazovke, takže stoja zhruba jeden bod.

## Mobil

- Odstupy sekcií 60 px, kontakt 76/96 px. Stránka je hustejšia a menej prázdna.
- Karta rituálu má obe tlačidlá pod sebou cez celú šírku, hlavné je zlaté.
  Čas a cena sú v jednom riadku, cena vpravo.
- Dvojice tlačidiel pod textom (poukazy, salón, tím) idú tiež na celú šírku.
- Tri čísla nad cenníkom sú kompaktnejšie, záber dverí v galérii je 3:4, aby
  bolo vidieť aj popis.

## Výkon na mobile

Mobilné meranie Lighthouse simuluje pomalú 4G a štyrikrát pomalší procesor, takže
tu rozhoduje každý kilobajt a každá dlhá úloha. Čo sa spravilo:

- **Písma.** Z ôsmich súborov zostalo šesť a všetky sú orezané len na znaky, ktoré
  sa na stránke naozaj používajú. Lora je z premenlivého písma vyrezaná v jednej
  hrúbke (500, kurzíva 400), spolu s Manrope asi 93 kB.
- **Menší kód.** `tools/build.mjs` robí z `assets/style.css`, `assets/app.js` a
  `assets/i18n.js` zmenšené súbory `*.min.*`, ktoré stránka načítava. Zdrojom
  zostávajú pôvodné súbory, minifikované sa needitujú.
  **Po každej zmene CSS alebo JS treba spustiť `node tools/build.mjs`.**
- **Menej práce na začiatku.** Poukazy, rezervačný formulár, poradca a ďalšie
  časti pod prvou obrazovkou sa spúšťajú až vo voľnej chvíli prehliadača.
  Scéna v úvode kreslí na telefóne menej častíc a v nižšom rozlíšení.
- **Sekcie pod úvodom** majú `content-visibility:auto`, prehliadač ich rieši až
  keď sa k nim návštevník priblíži.
- **Bez drahých efektov na mobile.** Žiadne `backdrop-filter`, žiadne zrno,
  statické svetelné škvrny.
- **Jazyk.** Stránka sa otvára po slovensky a sama sa neprepína. Prehliadaču s
  iným jazykom sa po načítaní ukáže malý prúžok s ponukou. Preklad sa nasadzuje
  po dávkach, takže nezasekne prehliadač.

Merané na serveri s kompresiou (rovnako ako GitHub Pages): počítač 100,
mobil 94 až 96 podľa toho, ako je stroj zaťažený.

## Kam vedú tlačidlá Rezervovať

Do vlastného online kalendára na Booqme:
`https://booqme.app/sk/rezervacia/barbershop-30` (prevádzka Salon 30 - Head Spa,
Mostná 30, Nitra). Formulár na stránke zostáva ako druhá cesta, vedie naň
položka Rezervácia v menu.

Adresa je na jedinom mieste, v atribúte `data-booking` na `<html>`, a v
`href` tlačidiel s `data-booking-link`. Zmena adresy je jedna náhrada na dvoch
miestach:

1. v `index.html` v `<html ... data-booking="">` doplniť adresu kalendára
2. tým istým odkazom nahradiť `href="#rezervacia"` pri tlačidlách, ktoré majú
   `data-booking-link` (je ich tridsať)

Skript potom drží oboje zhodné. Bez JavaScriptu tlačidlá fungujú tiež, lebo
adresa je priamo v HTML.
