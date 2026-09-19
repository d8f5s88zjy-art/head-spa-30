# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 17 rituálov v piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (misa s teplou vodou, prúd vody, kruhy, para a zlaté svetlo, bez kreslenej postavy), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Na telefóne a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
- `assets/fonts/` – písma Fraunces (400, 500, 300 kurzíva), Manrope (400, 600, 700) a JetBrains Mono (400, 600), hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v dvoch veľkostiach a troch formátoch, prehliadač si vyberie najmenší, ktorý vie zobraziť
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

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

Kalendár Booqme zostáva ako druhá možnosť pod formulárom.

## Darčekové poukážky

Sekcia Poukážky (vlastná položka v lište) má dve cesty: tlačidlo Kúpiť poukaz online vedie na rezervačnú stránku Booqme (https://booqme.app/sk/rezervacia/salon-30), kde sa po vytvorení typov poukážok v administrácii Booqme automaticky objaví ich predaj kartou. Druhá cesta je objednávkový formulár (hodnota alebo konkrétny rituál, pre koho, kontakt, venovanie, doručenie), ktorý otvorí pripravený e-mail na info@salon30.sk.

## Galéria

Sekcia Galéria je mozaika šiestich dlaždíc: fotografia dverí, makro detail zlatých kruhov (výrez z tej istej fotky), tri kreslené zábery (teplá voda, para, zlaté svetlo) a jedna typografická dlaždica. Kreslené zábery sa jemne hýbu, ale len keď sú na obrazovke, a stoja pri zapnutom obmedzení pohybu aj po 45 sekundách nečinnosti. Fotografia sa dá zväčšiť kliknutím.

Výmena kreslených záberov za skutočné fotografie nevyžaduje zásah do kódu. Stačí uložiť súbor do `assets/img/galeria/` s presným názvom a spustiť `python3 scratchpad/build.py`:

- `voda.jpg` nahradí záber Teplá voda
- `para.jpg` nahradí záber Para a ticho
- `zlate.jpg` nahradí záber Zlaté svetlo
- `kruhy.jpg` nahradí makro detail kruhov

Ak fotografia existuje, použije sa namiesto kresby a štítok Kresba zmizne.

## Rezervácie

Všetky tlačidlá Rezervovať vedú na rezervačnú stránku Booqme https://booqme.app/sk/rezervacia/salon-30 (adresa je v `scratchpad/build.py` ako `BOOK` a v šablóne). Zoznam 17 programov na nahratie do Booqme je v `docs/booqme-programy.xlsx`. Telefón a e-mail sú v sekcii Kontakt.

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
sa stratil, keď všetky tlačidlá začali smerovať rovno do Booqme. Logika v
`assets/app.js` medzitým zostala celá, chýbala len značka, takže sa dala vrátiť
bez písania nového kódu.

Ako to funguje:

1. Návštevník ťukne na Rezervovať pri rituáli. Tlačidlo má `data-book` so slugom
   rituálu a odkazuje na `#rezervacia`. Skript ten rituál vyberie vo formulári
   a lístok vpravo hneď ukáže názov, trvanie a cenu.
2. Vyberie deň, časové okno (prípadne presný čas a náhradný termín), počet osôb,
   meno, telefón a poznámku. Formulár pozná otváracie hodiny, takže nedovolí
   termín, ktorý sa do nich nezmestí.
3. Odošle to cez WhatsApp alebo e-mailom. Web nič neukladá, správa sa skladá
   v prehliadači a odchádza z telefónu návštevníka. Každá má referenciu `HS30-XXXX`.

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

---

# GYM KLUB Nitra, pracovný názov LIPA GYM (priečinok `lipa-gym/`)

Web pre **GYM KLUB Fitness & Bodybuilding**, Výstavná 6 (Lipa Centrum), 949 01 Nitra-Chrenová. Rovnaký princíp ako HEAD SPA 30: čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí. Nasadzuje sa spolu s hlavným webom (`.github/workflows/pages.yml` kopíruje aj `lipa-gym/`), takže beží na https://d8f5s88zjy-art.github.io/head-spa-30/lipa-gym/. Pri presune na vlastnú doménu stačí priečinok skopírovať do vlastného repozitára a v `index.html` upraviť `canonical`, `og:url` a `og:image` (miesto je označené komentárom `DEPLOY STEP`).

## Zdroj údajov

Všetky fakty sú prevzaté z oficiálneho webu **gymklub.sk** (stav 19. 9. 2026) a zo zadania `LIPA_GYM_Nitra_source.zip` (DESIGN_PROMPT.md, hero-gym.mp4). Nič nie je vymyslené:

| Údaj | Hodnota | Zdroj |
|---|---|---|
| Názov | GYM KLUB Fitness & Bodybuilding | gymklub.sk |
| Adresa | Výstavná 6 (Lipa Centrum), 949 01 Nitra, Chrenová | gymklub.sk/contact.html |
| Telefón, e-mail | +421 944 800 394, info@gymklub.sk | gymklub.sk |
| Hodiny | Po až Št 06:30 – 21:00, Pi 06:30 – 23:00, So a Ne 08:00 – 17:00 | gymklub.sk (kontakt, FAQ, harmonogram); pätička webu uvádza pre víkend 08:30 – 18:00, preto je na stránke poznámka „cez víkend overte telefonicky“ |
| Cenník | vstup 6 €, permanentka 50 €/mesiac, študentská 42 €/mesiac, 10 vstupov 50 €, 20 vstupov 80 €, študent 5 €, dôchodca 3,50 €; platba len v hotovosti; MultiSport a Upbalansea app | gymklub.sk, sekcia Cenník a FAQ |
| Rozvrh | Po Pilates 16:00 a Krav Maga 17:00, Ut a Št Bojové športy 17:00 a Zdravý chrbát 18:00, St Pilates 18:00, So Bojové športy 13:00 | gymklub.sk, časový harmonogram |
| Tréneri (10) | mená, špecializácie, fotografie, telefóny a popisy | gymklub.sk/treneri.html a stránky tréningov |
| Recenzie (4) | Nika D., Jozef K., Andrea F., Marcel Š. | gymklub.sk, sekcia Recenzie |
| Fotografie | výlučne zábery z prevádzky: 10 fotografií priestoru (aj pri tréningoch), 10 portrétov trénerov, logo; stockové zábery z gymklub.sk (service) sa nepoužívajú | gymklub.sk/assets/img |
| Video v úvode | `assets/hero-gym.mp4` zo zadania, ilustračné (Higgsfield), na stránke označené | zadanie |
| Sociálne siete | Instagram gymklubnitra, Facebook | gymklub.sk |

Kontakty, hodiny a rozvrh sú na jednom mieste v `assets/app.js` (`GYM`, `HOURS`, `TIMETABLE`); z nich sa vypĺňa stránka aj štruktúrované dáta (schema.org HealthClub s hodinami, cenníkom a trénermi, FAQPage).

## Štruktúra

- `lipa-gym/index.html` – úvod (fotografia z prevádzky + ambientné video, zapnutie svetiel, nájazd kamery), bežiaci pás, dôvody, 6 tréningov s fotografiami, cenník (3 karty + tabuľka + podmienky), rozvrh s dňami a živým stavom otvorené, 10 trénerov s filtrom podľa disciplíny, galéria 9 fotografií s lightboxom, prvá návšteva, recenzie, otázky, kontakt s mapou, hodinami a formulárom
- `lipa-gym/assets/style.css` – štýly, tmavá paleta s limetkovou, Bebas Neue + Manrope
- `lipa-gym/assets/app.js` – údaje o prevádzke, živé hodiny (Bratislava), rozvrh, filter trénerov, lightbox, formulár (otvorí pripravený e-mail na info@gymklub.sk, nič neukladá), mapa načítaná až pri posune, animácie, koľajnica, zotrvačné skrolovanie, schema.org
- `lipa-gym/assets/img/` – fotografie prevádzky (`hero`, `stojany`, `rig`, `cardio`, `ring`, `stroje`, `recepcia`, `rig2`, `tatami`, `bar`, `about`) s mobilnými variantmi `-640`, `tim/` portréty trénerov (+ `-320`), `logo-gymklub.png`; každý obrázok v JPG aj WebP
- `lipa-gym/assets/hero-gym.mp4` – ambientné video úvodu (bez zvuku, 0,6 MB), pri obmedzení pohybu alebo šetrení dát sa nenačíta a ostáva fotografia
- `lipa-gym/assets/fonts/` – Bebas Neue a Manrope lokálne

## Animácie

- **Otvorenie (zapnutie svetiel):** úvod je pri načítaní tmavý, svetlá dvakrát bliknú a zostanú svietiť, po hale prejde odlesk, kamera 12 sekúnd pomaly nabieha a nadpis vybehne po riadkoch. Preskočí sa klikom do úvodu, pri obmedzení pohybu, pri odkaze na sekciu a pri druhom načítaní v tej istej karte.
- **Skrolovacia vrstva:** obrysové kotúče a činka v pozadí plynú rôznou rýchlosťou, za nadpismi sekcií plávajú obrysové nápisy, nadpisy nabiehajú podľa skrolu, bežiaci pás sa pri rýchlom skrole nakloní, vpravo koľajnica s kotúčom a bodkami sekcií.
- **Zotrvačné skrolovanie** kolieskom na počítači (`SMOOTH_SCROLL` v `app.js`), odkazy na sekcie idú tou istou cestou, dotyk a klávesnica ostávajú natívne.
- **Telefón (odľahčený režim, `body.lite`):** na dotykových zariadeniach a do šírky 860 px sa nenačíta video, nebeží pohyblivé pozadie, obrysové nápisy, paralaxa ani nájazd kamery, obrázky sa berú v menších variantoch (`*-640`, `tim/*-320`) a sekcie mimo obrazovky sa nevykresľujú (`content-visibility`). Zapnutie svetiel ostáva ako prelínanie priehľadnosti.
- **Plynulosť:** žiadne filtre na hýbucich sa prvkoch, `will-change` na vrstvách, premenná postupu len na prvkoch, ktoré ju používajú, lišta bez rozostrenia na mobile.
- Pri zapnutom **obmedzení pohybu** je všetko statické a nič sa neschováva.

## Kontakt a formulár

Hlavná akcia je „Prísť si zacvičiť“ (kontakt s hodinami, mapou a navigáciou) a „Pozrieť cenník“. Na telefóne je dole lišta Zavolať a Cenník a vstup. Formulár „Napíšte nám“ pripraví e-mail do klientovho programu, web nič neukladá ani neposiela.

## Náhľad

```
npx http-server -p 8080
```

a otvoriť `http://localhost:8080/lipa-gym/`.
