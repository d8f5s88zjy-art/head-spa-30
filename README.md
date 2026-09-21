# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 17 rituálov v piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (misa s teplou vodou, prúd vody, kruhy, para a zlaté svetlo, bez kreslenej postavy), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Pri krátkej výške okna a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
- `assets/fonts/` – dve písma: Fraunces (400 a 300 kurzíva) na nadpisy, Manrope (400 a 700) na text aj štítky, hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v dvoch veľkostiach a troch formátoch, prehliadač si vyberie najmenší, ktorý vie zobraziť
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

## Úvodná cesta

Úvod má štyri kapitoly: Teplo, Voda, Ticho, Termín. Kamera sa počas skrolovania hýbe: začína širokým záberom na misu, v druhej kapitole sa k nej priblíži, v tretej sa pozerá zhora do vody (dve pomalé ruky, dva zdroje malých vlniek, ako masáž) a na konci sa vráti do širokého záberu, kde sa kruhy upokoja do jedného zlatého kruhu. Svetlo lampy začína chladné a biele a postupne teplie do zlata, s ním sa zohrieva aj miestnosť. Vpravo dole je namiesto percent lišta kapitol so zlatou linkou, ktorá sa plní. Aj bez skrolovania scéna dýcha (para, lomené svetlo vo vode, prúd) pri nízkej snímkovej frekvencii (12 snímok za sekundu), zastaví sa, keď je úvod mimo obrazovky, keď je karta skrytá, keď návštevník 45 sekúnd nič nerobí alebo keď má zapnuté obmedzenie pohybu. Galéria a pokojná verzia úvodu používajú tú istú scénu s pevnou kamerou a pôvodnými farbami.

## Poukazy online cez Booqme

V Booqme (Poukážky, Typy poukážok) je päť typov predplateného kreditu: 50, 70, 100, 149
a 249 €, s platnosťou 365 dní od zakúpenia a popisom, ktorý sedí s ponukou na webe.
Verejný obchod je na https://booqme.app/sk/eshop/barbershop-30 a vedie naň tlačidlo
Kúpiť poukaz online. Platba kartou funguje až po prepojení Stripe Connect v Booqme
(Nastavenia, Stripe Connect); dovtedy je druhou cestou formulár na webe, ktorý otvorí
e-mail s objednávkou. Poukaz na konkrétny rituál ide len cez formulár.

## Darčekové poukazy ako predajná sekcia

Nad objednávkovým formulárom je šesť kariet hodnôt: 50, 70, 100, 149, 249 eur
a konkrétny rituál. Každá hovorí, čo za tie peniaze obdarovaný dostane, podľa
skutočného cenníka. Ťuknutie kartu zvýrazní, vyplní hodnotu vo formulári nižšie
a posunie na neho; pri konkrétnom rituále rovno otvorí zoznam sedemnástich.

## Postup rituálu ako číslovaný sled

Kroky v rozbalenej karte rituálu už nie sú odrážky pod sebou. Každý krok má
číslo v zlatom krúžku a vlasovú linku nad sebou, na širokej obrazovke v dvoch
stĺpcoch, na telefóne v jednom. Zmena je len v CSS, obsah krokov zostal.

## Záverečná výzva pred pätičkou

Sekcia `.finale` uzatvára stránku jednou vetou a dvoma tlačidlami: Rezervovať
rituál a Darovať poukaz. Rezervačné tlačidlo prepíše skript na kalendár rovnako
ako ostatných tridsať.

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

## Poradca nad cenníkom

Nad cenníkom je blok `#poradca`: tri otázky (pre koho, koľko času, čo od toho
čakáš) a odporúčanie jedného rituálu s cenou, trvaním, tlačidlom Rezervovať
a odkazom na kartu v cenníku. Pod tým je jedna alternatíva.

Poradca si nedrží vlastný zoznam rituálov. Číta karty v cenníku, takže keď
pribudne alebo sa zmení rituál, poradca to vie hneď. Každá karta má `data-goal`
(`relax`, `deep`, `beauty`, `lux`) a `data-duo` pri rituáloch pre dvoch.

Bodovanie v `assets/app.js`: zhoda cieľa má váhu osem, tesnosť času do štyroch
bodov, prekročenie času je mierny mínus. Preto keď si niekto vyberie hĺbkové
čistenie a hodinu času, dostane hĺbkový rituál aj s vetou, že trvá deväťdesiat
minút, nie iný rituál, ktorý sa do hodiny zmestí. Pri zhode rozhoduje nižšia cena.

Pri tom sa opravila stará chyba: Zlatý Head Spa rituál 24K pre dvoch patrí
do luxusnej kategórie, preto sa pod filtrom Pre dvoch nezobrazoval, hoci
otázky na stránke hovoria o troch rituáloch pre dve osoby. Filter aj poradca
teraz berú `data-duo`, takže Pre dvoch ukáže všetky tri.

## Citáty medzi sekciami

Medzi sekcie pribudli tri tiché citáty (`section.pull`). Každý je veta, ktorá už
na stránke je, prevzatá z obsahu konkrétneho rituálu, a rovnaká veta nesie
aj sériu Instagram storiek, takže web a profil hovoria jedným hlasom:

- `Záver patrí tichu.` z Prémiového Head Spa rituálu, za sekciou Ako to prebieha
- `Tempo určuje pokoj, nie hodiny.` z Relaxačného Head Spa, za sekciou Prečo k nám
- `Dve osoby. Jedna hviezdna obloha.` zo Spoločného rituálu pod hviezdami, za galériou

Popisok pod citátom je odkaz na kartu toho rituálu v cenníku, takže citát nie je
len ozdoba. Trieda je `pull`, nie `quote`, lebo `quote` už patrí odseku v sekcii
Rituál a nesmie sa prepísať.

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

Sekcia Poukážky (vlastná položka v lište) má dve cesty: tlačidlo Kúpiť poukaz online vedie na rezervačnú stránku online rezerváciu (https://www.salon30.sk/rezervacia), kde sa po vytvorení typov poukážok v administrácii online rezerváciu automaticky objaví ich predaj kartou. Druhá cesta je objednávkový formulár (hodnota alebo konkrétny rituál, pre koho, kontakt, venovanie, doručenie), ktorý otvorí pripravený e-mail na info@salon30.sk.

## Galéria

Sekcia Galéria je mozaika šiestich dlaždíc: fotografia dverí, makro detail zlatých kruhov (výrez z tej istej fotky), tri kreslené zábery (teplá voda, para, zlaté svetlo) a jedna typografická dlaždica. Kreslené zábery sa jemne hýbu, ale len keď sú na obrazovke, a stoja pri zapnutom obmedzení pohybu aj po 45 sekundách nečinnosti. Fotografia sa dá zväčšiť kliknutím.

Výmena kreslených záberov za skutočné fotografie nevyžaduje zásah do kódu. Stačí uložiť súbor do `assets/img/galeria/` s presným názvom a spustiť `python3 scratchpad/build.py`:

- `voda.jpg` nahradí záber Teplá voda
- `para.jpg` nahradí záber Para a ticho
- `zlate.jpg` nahradí záber Zlaté svetlo
- `kruhy.jpg` nahradí makro detail kruhov

Ak fotografia existuje, použije sa namiesto kresby a štítok Kresba zmizne.

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

## Sekcia Tím

Sekcia `#tim` je pripravená, ale zatiaľ prázdna. Obsahuje tri karty v stave
„pripravujeme“: prerušovaný rámik, monogram 30 a text `Meno doplníme`.
Web tak nikde netvrdí nič, čo nie je overené.

Ako kartu vyplniť (jedna karta = jeden človek), v `index.html` v sekcii `#tim`:

1. z `<article class="tcard part is-empty">` zmazať `is-empty`,
2. `<h3 class="tname">` prepísať na meno,
3. `<p class="trole">` prepísať na rolu, napríklad `Head Spa terapeutka · Salón 30`,
4. `<p class="tbio">` prepísať na jednu vetu o tom, čo robí najradšej,
5. celý `<div class="tface"> ... </div>` nahradiť fotografiou:

```html
<div class="tface"><img src="assets/img/tim-meno.jpg" alt="Meno, Head Spa terapeutka"
     width="600" height="750" loading="lazy" decoding="async"></div>
```

Fotografie na výšku, minimálne 600 × 750 px, tvár v hornej tretine. Kariet môže
byť ľubovoľný počet, mriežka sa prispôsobí sama (tri v rade na počítači, jedna
pod druhou na mobile). Rovnaký návod je aj v komentári priamo nad sekciou.

Keď pribudnú mená, treba ich pridať aj do prekladov: v `assets/i18n/<jazyk>.json`
sa prekladá podľa slovenského textu, takže kľúče `Meno doplníme`,
`Head Spa terapeut · Salón 30` a veta v `tbio` sa nahradia novými. Meno človeka
sa neprekladá, stačí ho nechať bez kľúča.

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

## Rýchly prehľad cien a tlač

Pod kartami rituálov je `<details id="prehlad-cien">` s tabuľkou všetkých sedemnástich
rituálov: názov (odkaz na kartu), trvanie a cena, rozdelené podľa kategórií.
Slúži tým, čo chcú len ceny, a zároveň je z neho tlačový cenník.

`@media print` v `assets/style.css` skryje navigáciu, animácie, karty rituálov
aj ostatné sekcie a vytlačí sa hlavička so značkou, tabuľka a pätička s kontaktom,
dokopy dve strany A4. `assets/app.js` pri tlači tabuľku sám otvorí
(`beforeprint`), aby sa nevytlačila zatvorená.

Pri zmene ponuky treba tabuľku prepísať ručne rovnako ako karty, alebo ju
vygenerovať z `data-min`, `data-price` a `.meta` kariet.

## Hodnoty darčekových poukazov

Rebríček je odvodený od cenníka, nie zvolený od oka: **50, 70, 100, 149 a 249 €**.
Spodná hodnota presne pokryje najlacnejší rituál (50 €), horná aj ten najdrahší
(Zlatý Head Spa rituál 24K pre dvoch za 249 €). Vyššie hodnoty zámerne nie sú,
aby obdarovanému nezostal zostatok, ktorý nemá ako minúť.

Sú to dva ručne udržiavané zoznamy v rôznych častiach `index.html`: hodnoty
poukazu (`name="hodnota"`) a ceny rituálov (`data-price` na kartách). Keď sa
rozídu, `assets/app.js` vypíše varovanie do konzoly prehliadača:

```
HEAD SPA 30: poukaz za 400 € presahuje najdrahší rituál (249 €).
```

Kontrola sa ozve len vtedy, keď je naozaj čo hlásiť. **Pri zmene cien rituálov
preto treba prejsť aj hodnoty poukazov** a upraviť aj vetu pod nimi, ktorá obe
čísla menuje, plus jej preklady v šiestich jazykových súboroch.


## Výber podľa času a rozpočtu

Popri filtri podľa kategórie sú nad zoznamom dva výbery, ktoré sa s kategóriou
kombinujú: **Mám čas** (do 45, 60, 75 alebo 90 minút) a **Rozpočet**
(do 60, 80, 100 alebo 149 €).

Každá karta má `data-min` a `data-price`, takže sa filtruje priamo z hodnôt,
nie z parsovania textu. Nadpis kategórie zmizne, keď v nej po obmedzení nič
nezostane, a keď nezodpovedá nič, zobrazí sa vysvetlenie s návrhom, čo zmeniť.
Tlačidlo Zrušiť obmedzenia sa objaví len vtedy, keď je naozaj čo rušiť.

Riadok "Zobrazených N zo 17 rituálov" sa skladá až v prehliadači, preto má
vlastné preklady v `assets/app.js` (`COUNT_WORDS`), rovnako ako text otváracích
hodín. Po zmene jazyka sa prekreslí.

Pozor pri úprave cien alebo trvaní: hodnoty v `data-min` a `data-price` musia
sedieť s tým, čo je napísané v `.meta` karty, inak filter ukáže niečo iné,
než karta tvrdí.


## Ponuka: sedemnásť rituálov pre hlavu

Cenník má **17 Head Spa rituálov** v piatich kategóriách: Head Spa (7), pánske (4),
detský (1), pre dvoch (2) a luxusné (3). Trvanie 40 až 120 minút, ceny 50 až 249 €,
pri rituáloch pre dvoch platí cena za obe osoby.

Štrnásť z nich zodpovedá programom v `docs/booqme-programy.xlsx`. Tri luxusné
(Strieborný Head Spa rituál 109 €, Zlatý Head Spa rituál 24K 129 €, Zlatý Head Spa
rituál 24K pre dvoch 249 €) sa vrátili 15. 9. 2026 na pokyn majiteľa, že ponuka
má sedemnásť rituálov. Rituály pre chodidlá na webe nie sú a slovo chodidlá sa
na ňom nevyskytuje.

Pri zmene ponuky treba prejsť aj miesta, kde je počet alebo rozpätie napísané
slovami: hlavička cenníka, dlaždice v hlavičke a v hrdinskej sekcii, rýchly prehľad
cien, výber rituálu v rezervácii a v poukaze, hodnoty poukazov, `priceRange`
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

Dvere sa otvárajú raz za návštevu (drží to `sessionStorage`), trvajú necelú
sekundu a pol a neukážu sa, keď: má odkaz kotvu (`#sekcia`), má návštevník
zapnuté obmedzenie pohybu, má zapnutý šetrič dát, je karta na pozadí alebo je
vypnutý JavaScript. Kým dvere držia obraz, úvod čaká cez premennú `--veil`,
takže text nenabehne za dverami.

Stará verzia dverí stála devätnásť bodov výkonu, lebo telo stránky bolo do
konca animácie neviditeľné. Teraz je stránka vykreslená hneď a dvere sú len
vrstva nad ňou, takže stoja jeden bod.

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
  sa na stránke naozaj používajú. Fraunces má pevnú optickú veľkosť, nie celú os,
  takže je o polovicu menší. Spolu 227 kB → 74 kB.
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
