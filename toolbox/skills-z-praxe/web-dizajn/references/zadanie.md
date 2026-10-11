# Zadanie webu slovami

Video hovorí: „opíš web, aký chceš, obyčajnými slovami a Claude sa postará o zvyšok“. Funguje to len vtedy,
keď opis obsahuje aj to, čo sa na snímke nevidí: pre koho, načo, z akých faktov a v akých hraniciach.

## Vzor z videa a čo v ňom chýba

Zadanie na snímke vo videu, preložené (koniec je na snímke odrezaný):

> Vytvor modernú prémiovú landing page pre startup FlowAI, nástroj na produktivitu s AI. Použi čistú bielu
> tému s výraznou typografiou, jemnými modrými prechodmi farieb, plynulými animáciami a množstvom bieleho
> priestoru. Pridaj navigačnú lištu, úvod so silným nadpisom a výzvou, karty funkcií, časť Ako to funguje,
> referencie, cenník, otázky a…

| Vo vzore je | Chýba (doplní naša šablóna) |
| --- | --- |
| názov a odbor | publikum a odkiaľ prichádza (telefón, Instagram, Google) |
| nálada a paleta | **jedna úloha stránky** a kam vedie hlavné tlačidlo |
| smer typografie | konkrétne písma a ich licencia |
| zoznam sekcií | čo má každá sekcia povedať a z akého zdroja |
| „referencie“, „cenník“ | odkiaľ sú: vymyslené recenzie a ceny sú najčastejšia chyba |
| „plynulé animácie“ | čo sa smie hýbať a čo nie, obmedzený pohyb |
| | pravidlá projektu, jazyky, výkon, prístupnosť, technika, nasadenie |
| | čo je hotové (merateľné kritériá) |

## Šablóna

Skopíruj, vyplň a daj ako zadanie do relácie nad repozitárom. Čo nevieš, nechaj v časti „Treba potvrdiť“,
nevymýšľaj.

```
# Zadanie: <názov stránky>

Najprv si prečítaj pravidlá projektu: <CLAUDE.md, ART_DIRECTION.md, ...>. Pri rozpore platia ony.

Značka: <presný zápis názvu; ako sa NEpíše>
Podnik a miesto: <čo robí, adresa>
Zdroje faktov: <súbory a dátum>; nič mimo nich
Publikum: <kto, odkiaľ prichádza, na akom zariadení>
Jedna úloha stránky: <čo má návštevník urobiť>
Hlavná výzva: <text tlačidla> -> <cieľ odkazu>
Vedľajšia výzva: <text> -> <cieľ>
Tón: <tri slová>; oslovenie <tykanie / vykanie>; dĺžka textov <...>
Vkus: <dve až tri vety; referencie a prevzaté princípy, odkaz na zápis podľa vkus.md>
Paleta: <hodnoty alebo pôvod (fotky prevádzky); akcent a kde sa smie objaviť>
Písma: <rodiny a úlohy; súbory; licencia>
Sekcie v poradí:
  1. <meno>: <otázka návštevníka> | <obsah zo zdroja> | <akcia>
  2. ...
Pohyb: <čo sa smie; čo nie; obmedzený pohyb>
Obmedzenia: <zákazy, jazyky, výkon, prístupnosť, technika, nasadenie>
Hotové, keď: <dizajn-audit bez závažných nálezov; Lighthouse; snímky telefónu a počítača schválené>
Treba potvrdiť: <otázky pre majiteľa>
```

Ako s vyplneným zadaním pracovať: Claude ho prečíta spolu s pravidlami, na „Treba potvrdiť“ sa spýta
(alebo tie časti vynechá) a pokračuje krokmi 2 až 7 zo SKILL.md.

## Príklad 1: HEAD SPA 30

Údaje sú z `CLAUDE.md` (stav 2026-10-11), poradie sekcií a texty tlačidiel z dnešného `index.html`, riadok Vkus
z komentárov v `assets/style.css` (Luxusná vrstva, Luxusná kompozícia).

```
# Zadanie: web HEAD SPA 30

Najprv si prečítaj CLAUDE.md a drž sa ho. Pri rozpore platí CLAUDE.md.

Značka: HEAD SPA 30. Nikdy „Barber shop 30“ ani „salón 30“ ako názov webu. HEAD SPA 30 je samostatná
  časť s vlastným tímom, sídli v priestoroch Salónu 30; Salón 30 len ako miesto a odkaz www.salon30.sk,
  nie ako značka nad HEAD SPA 30. O majiteľovi nič. Služby Salónu 30 (kaderníctvo, kozmetika) na web nepatria.
Podnik a miesto: Head Spa rituály, Mostná 30, Nitra. Telefón 0911 153 136.
Zdroje faktov: CLAUDE.md, docs/booqme-sluzby.csv, docs/booqme-poukazy.csv (čítať v ten deň; ceny, dĺžky
  a obsah rituálov sa riadia online kalendárom Booqme).
Publikum: v zdrojoch nie je (Treba potvrdiť).
Jedna úloha stránky: rezervovať si rituál (alebo kúpiť poukaz na rituál).
Hlavná výzva: Rezervovať online -> https://booqme.app/sk/rezervacia/salon-30-head-spa
Vedľajšia výzva: poukaz -> https://booqme.app/sk/eshop/salon-30-head-spa
  Na webe nie sú formuláre, každé tlačidlo vedie rovno do Booqme.
Ponuka: 17 rituálov (12 Head Spa, 2 pre dvoch, 3 pre chodidlá: Klasický, Ovocný a bylinkový, Zlatý rituál
  24K). Žiadny strieborný ani zlatý Head Spa rituál. Fúkaná a žehlenie sú v cenníku pod rituálmi v časti
  Fúkaná a žehlenie; nie sú to rituály a poukaz sa na ne nepredáva.
Poukaz: vždy na konkrétny rituál, nie na sumu; 17 typov, platnosť 365 dní.
Tón: elegantný a zdržanlivý; tykanie; texty najviac jeden až dva riadky; bez em dash.
Vkus: rytmus hotelového filmu (veľký záber, potom pokojný pás s veľkým písmom), cenník ako menu v dobrej
  reštaurácii; pozadie je film zo skutočných fotiek salónu s hĺbkovou mapou, nič vymodelované, fotky bez
  tónovania; dvere v úvode sú skutočná fotka dverí salónu, krídla sa otvoria dnu.
Paleta: tóny orecha so zlatou; zlatá len ako detail; žiadna zelená plocha.
Písma: Lora (nadpisy, zlatá kurzíva ako jediný akcent), Manrope (text aj štítky); vyrezané v assets/fonts/,
  ďalšie nepridávať.
Štýl: veľa priestoru, vlasové linky namiesto kariet, ploché hranaté tlačidlá, rádius 2 px; tlačidlá, odkazy,
  filtre a popisky normálnym písmom (verzálky len na malých nadpiskoch sekcií); rituály v pokojných okienkach
  (tenký rámik, bez ikon); časti oddeľuje zlatá linka s lotosom. Žiadne žiary, prechody farieb, efekty pod
  kurzorom, čiastočky ani poskakovanie; obsah sa pri skrolovaní nevysúva ani neskladá.
Sekcie v poradí (dnešný web):
  1. Úvod: čo to je | „Vypni hlavu.“ a veta z index.html | Rezervovať online, 17 rituálov a ceny
  2. Rituál: ako to prebieha | kroky rituálu | Vybrať si rituál
  3. Cenník: čo si vyberiem a za koľko | docs/booqme-sluzby.csv | Rezervovať, Darovať ako poukaz
  4. Poukaz: čo darovať | docs/booqme-poukazy.csv | Kúpiť poukaz
  5. Tím  6. Galéria  7. Otázky  8. Kontakt (adresa, telefón, Kde nás nájdeš)
Pohyb: film kreslí pri pohybe a v pokoji ešte 25 s jemné dýchanie kamery 30 snímok za sekundu, potom stojí;
  záloha je pokojný úvod s fotkou.
Obmedzenia: žiadna zmienka o AI na webe, v kóde, v commitoch ani v názvoch vetiev; každý nový text kľúčom
  v assets/i18n/*.json (kľúč je slovenský text); zdroje assets/style.css, app.js, i18n.js a po zmene
  node tools/build.mjs; žiadny backdrop-filter na mobile; komentáre v kóde po slovensky.
Hotové, keď: dizajn-audit bez závažných nálezov; Lighthouse počítač 100, telefón 95 a viac;
  node tools/booqme-kontrola.mjs hlási, že kalendár sedí; snímky telefónu a počítača pozreté.
Treba potvrdiť: publikum; ak sa mení text, preklady do všetkých jazykov.
```

## Príklad 2: BARBERSHOP 30

Údaje sú z `barbershop-30/docs/CONTENT_SOURCES.md` (zdroje so stupňami overenia, stav 2026-10-09 až 2026-10-11);
vzhľad z `ART_DIRECTION.md` a `MASTER_BRIEF.md`; poradie sekcií z dnešného `barbershop-30/index.html`.

```
# Zadanie: web BARBERSHOP 30

Najprv si prečítaj barbershop-30/docs/MASTER_BRIEF.md, ART_DIRECTION.md a CONTENT_SOURCES.md. Pri rozpore
MASTER_BRIEF.md s ART_DIRECTION.md alebo TOUR_DIRECTION.md platí MASTER_BRIEF.md (tak to píše sám).

Značka: „Barbershop 30“ ako značka, „Barbershop30“ v právnych údajoch (logo „30 Barbershop Holičstvo“).
Podnik a miesto: barbershop, Mostná 30, 949 01 Nitra. Telefón 0951 267 203 (+421 951 267 203).
  Otvorené Po až Pi 09:00 až 19:00, So 09:00 až 14:00, Ne zatvorené.
Zdroje faktov: CONTENT_SOURCES.md, len stupeň overené-oficiálne; tretia strana len s odkazom; slabé
  a neoverené na web nejdú.
Publikum: v zdrojoch nie je (Treba potvrdiť).
Jedna úloha stránky: rezervovať si termín.
Hlavná výzva: Rezervovať termín -> https://www.barbershop30.sk/rezervacia (vlastný systém podniku,
  odkaz, nie vloženie; predvoľba služby alebo barbera sa neprenáša).
Vedľajšia výzva: farbenie, melír, trvalá -> https://booqme.app/sk/rezervacia/barbershop30 (len odkaz,
  bez cien, aby neboli dva cenníky).
Fakty na web: od roku 2019; 8 kresiel, recepčná, káva a minerálka zdarma (káva vzadu v čakárni, nie pri
  recepcii, majiteľ 2026-10-11), online rezervácie 24/7, strihanie detí. 15 služieb s konečnými cenami
  z tabuľky Služby a ceny (bez „od“). Tím: 10 barberov, krstné mená a roly presne podľa tabuľky Tím, bez
  priezvisk, špecializácií a rokov praxe. Instagram a Facebook z tabuľky Identita a kontakt.
Dôkazy: hodnotenie na Google len ako odkaz na profil, bez čísla v texte aj v schéme, bez vymyslených citácií.
Nepoužiť (neoverené): „8 rokov“, plaketa 2024, školenia pod značkou, vzťah so Salónom 30, vernostná karta,
  výsledky pred a po.
Tón: sebavedomý a vrúcny; retro-industriálne remeslo s humorom, nie sterilný luxus, ale teplý, mužský,
  komunitný priestor (ART_DIRECTION.md časť 1); slovenčina s diakritikou, tykanie, bez marketingových fráz a superlatívov bez dôkazu.
Vkus: realistická prehliadka prevádzky zo skutočných fotiek a videí; návštevník prejde skrolom tak, ako
  keby vošiel dverami z Mostnej ulice; úvod ako film s našimi dverami a našou miestnosťou.
Paleta: uhoľná čierna --ink #0E0D0C, teplá biela --paper #F1E9DD, jediný akcent oranžová lámp
  --lamp #E0601C; --teal najviac v jednej časti; mosadz len vo fotkách.
Písma: Fraunces 800 (titulky), Manrope 400/600/700 (text, tlačidlá, navigácia); lokálne v assets/fonts/.
Sekcie v poradí (dnešný web):
  1. Úvod: „Tvoj strih. Tvoje miesto.“ | Rezervovať termín
  2. „Poď ďalej.“ 3. „Povedz, ako to chceš.“ 4. „Vzadu ťa čaká káva.“ 5. „Komu zveríš hlavu?“ (tím)
  6. „Čo to bude dnes?“ (služby a ceny) 7. „Pozri si to zblízka.“ (galéria) 8. „Kedy si sadneš?“ (rezervácia,
  kontakt, otváracie hodiny)
Pohyb: kamera, prelínania a lišta čítajú jedno číslo zo skrolu; nástupy textu 450 až 700 ms; paralaxa
  najviac 6 %; žiadne blikanie, častice, efekt pod kurzorom ani rozmazaný text; prefers-reduced-motion a bez WebGL pokojná
  verzia s tými istými fotkami.
Obmedzenia: na webe žiadna zmienka o 3D modeli, AI ani nástrojoch, len „prehliadka podniku“; odsek najviac
  62 znakov na riadok; dotykové ciele aspoň 44 px; telefón 375, 390, 430 px bez pretekania; relatívne cesty
  (web beží v podpriečinku).
Hotové, keď: LCP do 2,5 s, CLS do 0,1, INP do 200 ms; prvý čitateľný obraz do 1,5 MB; kontrast textu
  4,5 : 1, veľké nadpisy 3 : 1; dizajn-audit bez závažných nálezov; app-smoke.mjs bez FAIL.
Treba potvrdiť: publikum; súhlas zamestnancov s portrétmi a videami; práva na fotky z pôvodného webu;
  vektorové logo.
```

## Pasce

| Pasca | Riešenie |
| --- | --- |
| Zadanie opisuje len vzhľad | doplniť publikum, jednu úlohu, zdroje faktov a pravidlá (tabuľka vyššie) |
| „Referencie“ a „cenník“ v zozname sekcií bez zdroja | recenzie len ako odkaz na profil, ceny len zo zdroja v ten deň |
| Staré zadanie v rozpore s dnešnými pravidlami | `docs/zadanie-zjednotenie-s-prevadzkou.md` píše „pod značkou Salón 30“ a zelenú plochu; platí dnešné `CLAUDE.md` |
| Publikum či iný údaj nie je v zdrojoch | „Treba potvrdiť“, nie odhad |
| Ceny skopírované do zadania | zadanie odkazuje na zdroj; ceny sa menia (HEAD SPA 30 v Booqme) |
