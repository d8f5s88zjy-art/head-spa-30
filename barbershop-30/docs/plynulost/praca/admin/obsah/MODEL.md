# Barbershop 30 – admin: model úprav (čo majiteľ mení, kde to žije, ako sa to ukladá)

Stav: návrh produktového analytika, 20. 10. 2026. Pre koho: tím, ktorý píše `SPEC-ADMIN.md`, porota smerov a skeptik.
Nič z tohto dokumentu nemení repozitár; všetky cesty sú v kópii `scratchpad/hs-tool/barbershop-30/`
(riadky `index.html` platia pre stav z 20. 10. 2026 10:30 a slúžia len na orientáciu – admin sa na ne nesmie viazať,
pozri časť 2).

Zdroje, z ktorých model vychádza: `barbershop-30/index.html`, `assets/app.js` (tabuľa hodín, riadky 660–700),
`assets/i18n.js` (pravidlá kľúčov), `assets/i18n/{cs,de,en,hu,pl,sr,uk}.json` (7 × 262 kľúčov), `assets/recenzie.js`,
`assets/img/manifest.json`, `sitemap.xml`, `robots.txt`, `docs/CONTENT_SOURCES.md`, `docs/CONTRACT.md`,
`barber/PLAN.md` (D1–D5), `barber/PLAN-D6-D7.md`, `barber/OTAZKY-PRE-MAJITELA.md`, admin HEAD SPA 30
(`hs-tool/admin/index.html`, `hs-tool/README.md` časť „Admin (admin/)“), git história `barbershop-30/` od 9. 10. 2026.

## 1. V skratke

1. **Majiteľ (Lajko) potrebuje meniť deväť druhov vecí.** Často: oznam hore na webe, výnimky v hodinách (sviatky,
   dovolenka), cenu alebo názov služby, krátky text, člena tímu (nový barber, nová fotka, odchod). Zriedka: týždenné
   hodiny, recenzie, odkazy na siete. Takmer nikdy: telefón, e‑mail, právne údaje. Nikdy cez admin: adresa, odkaz
   na rezerváciu (doména), film, fotky prevádzky, štruktúra stránky.
2. **Web nemá databázu, pravda je v súboroch.** Slovenský text v `index.html` je zároveň kľúč prekladu v siedmich
   slovníkoch; hodiny sú na šiestich miestach (konštanta v JS, dve HTML tabuľky, tabuľa, JSON‑LD, veta v texte);
   telefón na jedenástich. Admin preto nemení „pole“, ale **prepisuje všetky výskyty naraz** a vie, ktoré sú to
   (časť 7). Položka bez takéhoto zoznamu do adminu nepatrí.
3. **Ceny: admin ich mení, ale iba ako zosúladenie s rezervačným systémom** (`docs/CONTENT_SOURCES.md` a pravidlo
   jedného cenníka). Postup je „najprv v systéme, potom na webe“, s povinným potvrdením a zápisom do denníka;
   Romanine ceny z Booqme sa na web nedostanú nikdy (časť 8).
4. **Preklady len ručne.** Zmena slovenčiny presunie kľúč v siedmich slovníkoch, starý preklad ostane v poli
   s označením „skontroluj preklad“; prázdne pole = „nepreložené“, web ukáže slovenčinu (to robí `i18n.js` sám).
   Čísla (ceny, hodiny, telefón) sa do prekladov prenesú automaticky, slová nie (časť 5).
5. **Po uložení sa prepočíta**: JSON‑LD (ceny, hodiny, telefón, siete), pätička = kontakt, podtitul cenníka
   s cenami, veta o hodinách v karte Rezervácia, `sitemap.xml` `lastmod`, manifest fotiek a riadok denníka
   v `docs/CONTENT_SOURCES.md` (časť 7). Jeden commit do `main`, web naživo asi do minúty; admin to overí
   a majiteľovi ukáže „naživo o 14:32“.
6. **Čo admin potrebuje od webu** (tri drobnosti pre tím D1–D5 alebo pre vetvu `barbershop-admin`): prvok oznamu
   za hlavičkou, `Disallow: /admin/` v `barbershop-30/robots.txt`, stabilný názov konštanty hodín (`HOURS`,
   po D6a v `assets/hodiny.js`). Rozpočet `index.html` je 14 600 B gzip, dnes 14 380 B – oznam sa doň zmestí
   (asi 60 B), nič iné do HTML nepridávať (časť 10).

## 2. Kde obsah žije (zdroje pravdy a pravidlá pre admin)

| Súbor | Čo drží | Pravidlo pre admin |
|---|---|---|
| `index.html` (84 kB, 14 380 B gzip) | všetky slovenské texty, cenník (4 `.price-group`, 15 `.price-row`), tím (10 `.team-card`), kontakt, pätička, JSON‑LD, meta pre Google a zdieľanie | Admin hľadá prvky **len cez triedy a id** (`.price-row .price-name`, `.team-card`, `#rezervacia .title-sub`, `dl.hours`, `[data-flap]`, `#oznam`), nikdy cez číslo riadku ani poradie v súbore; súbežne ho mení iný tím (D1–D5, potom D6–D7). Zápis je textová náhrada v pôvodnom reťazci (ako admin HEAD SPA), nie prepis celého DOM – zachová odsadenie, komentáre a atribúty, ktoré admin nepozná. Pred uložením porovná `sha` s `main`; pri zmene načíta novú verziu a svoje zmeny prenesie znova. Rozpočet 14 600 B gzip (`PLAN-D6-D7.md`) – admin ho zmeria (`CompressionStream('gzip')`) a pri prekročení uloženie zastaví s vysvetlením. |
| `assets/i18n/{cs,de,en,hu,pl,sr,uk}.json` | 7 × 262 kľúčov; kľúč = normalizovaný slovenský text (`norm`: biele znaky na jednu medzeru, orezané), hodnota = preklad; `__tabula` = slová tabule hodín | Pravidlá z `i18n.js`: prekladajú sa textové uzly (okrem `script`, `style`, `svg`, `[data-no-i18n]`), atribúty `placeholder`, `aria-label`, `alt`, `title` (nie `http…`), meta `description`, `og:title`, `og:description`, `og:image:alt` a `<title>`. Text bez kľúča ostane po slovensky. Text bez písmena (napr. `9:00–19:00`, `18 €`) nie je kľúč. Nový kľúč sa vkladá hneď za starý (poradie súboru ostáva čitateľné), starý sa zmaže, až keď ho nič nepoužíva. |
| `assets/app.js` riadok 663: `const HOURS = { 1: [9, 19], …, 6: [9, 14], 0: null }` | jediný zdroj hodín pre tabuľu „Dnes“ (stav Teraz otvorené / Otvárame o / zatvorené, ďalší otvorený deň) | Admin hľadá **podľa názvu konštanty** (`/const HOURS = \{[^}]*\};/`), nie podľa riadku. D1 (`opravy/D1/…patch`) ju necháva na mieste, D6a N03 ju presúva do `assets/hodiny.js` (so sviatkami, bez `Intl`) – admin skúsi najprv `assets/hodiny.js`, potom `app.js`. Celé hodiny: tabuľa píše `${t[0]}:00`, minúty dnes nevie (časť 11). |
| `assets/recenzie.js` | `RECENZIE` = pole `{meno, lang, text}` (6 kusov), `GOOGLE` = odkaz na profil; sekcia `.recenzie` je v HTML `hidden`, modul ju odkryje | Doslovné citácie z Google, mená „Meno P.“, text sa neopravuje. Admin prepisuje len pole a konštantu, nie funkciu `spusti`. Pri 0 recenziách musí sekcia ostať skrytá (modul dnes guard nemá – doplniť jeden riadok). |
| JSON‑LD v `<head>` (`@type: BarberShop`) | telefón, e‑mail, adresa, `openingHoursSpecification`, `sameAs` (Instagram, Facebook), `potentialAction` (rezervácia), `hasOfferCatalog` s 15 ponukami (name, price „18“, „21.50“) | Admin ho parsuje ako JSON, mení polia a serializuje späť s rovnakým odsadením; nikdy nepridáva `aggregateRating`, `review`, `FAQPage` (zákaz v `PLAN-D6-D7.md`). Po D6a pribudne `priceRange`, `geo`, `hasMap` – admin ich zachová a `priceRange` prepočíta (min–max cenníka). |
| `sitemap.xml` | 8 × `<url>` (sk + 7 jazykov), všetky `<lastmod>2026-10-12</lastmod>`, hreflang | Každé uloženie, ktoré mení `index.html`, slovníky alebo `recenzie.js`, nastaví všetkých 8 `lastmod` na dnešný dátum (Europe/Bratislava). Nič iné sa v sitemap nemení. |
| `assets/img/manifest.json` → `team.tim-<slug>` | zdroj, alt, ohnisko, rozmery 821×695, šírky 480/820, formáty avif/webp/png, veľkosti súborov | Admin pri novej fotke zapíše záznam (formáty podľa toho, čo prehliadač naozaj vyrobil), pri odstránení človeka ho zmaže. `source/tools/build_images.py` ho číta – záznam musí mať rovnaký tvar. |
| `docs/CONTENT_SOURCES.md` | jediný zdroj pravdy pre ceny a texty (zdroj, dátum, stupeň overenia) | Admin ho neprepisuje, **pripája** riadok do časti `## Denník zmien z adminu` (vytvorí ju, ak chýba): dátum, položka, stará → nová hodnota, kto, „potvrdené v rezervačnom systéme“ pri cene. Správca webu denník raz za čas zapracuje do tabuliek. Tak ostáva dokument pravdivý aj po zmenách bez programátora. |
| `robots.txt`, `admin/` | dnes `Disallow: /source/`, `/docs/`; admin neexistuje | `Disallow: /admin/` + `<meta name="robots" content="noindex, nofollow">` v admine (ako HEAD SPA, `hs-tool/robots.txt`). |
| `assets/vernost.js`, `vernost/` | vernostná kartička, vlastný admin pre recepciu | Nemiešať. Odkaz „Vernostná kartička“ v pätičke riadi `pages.yml` (`data-zapnute`), admin webu ho nechá tak. |

## 3. Položky, ktoré majiteľ mení

Stĺpce: položka · kde v kóde · selektor / kľúč prekladu · tvar v admine · validácia · preklady · kto mení · ako často ·
po uložení prepočítať. Odhady častosti vychádzajú z bežnej prevádzky barbershopu a z histórie repozitára
(texty na želanie majiteľa 13. 10., cenník od 9. 10. bez zmeny, tím bez zmeny, jazyky 12. 10., recenzie 13. 10.).

### 3.1 Oznam (záložka Oznam) – dnes na webe neexistuje

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Oznam hore na webe (dovolenka, sviatok, zmena hodín, akcia) | navrhovaný prvok `<div class="oznam" id="oznam" role="status" hidden><p></p></div>` hneď za `</header>` (pred `nav.story-line`), štýl v `style.css` (≈ 60 B gzip v HTML; vzor HEAD SPA `index.html:65`) | `#oznam p`; kľúč = text oznamu | jedno pole, 1–2 vety; prepínač „zobraziť“ je odvodený (prázdne = skryté); voliteľne „platí do“ (dátum) – zobrazí sa, len ak web dostane podporu `data-do` (časť 10), inak admin len pripomenie, že oznam ostane, kým ho nezmaže | ≤ 160 znakov, bez odkazov a HTML, bez pomlčiek em dash (CLAUDE.md), nie len medzery | 7 polí; nepreložené → slovenčina | majiteľ | 5–10× ročne | `hidden` podľa obsahu; presun kľúča v 7 slovníkoch; `sitemap` `lastmod` |

### 3.2 Hodiny (záložka Hodiny)

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Týždenné otváracie hodiny | 1) `app.js` `const HOURS` (po D6a `assets/hodiny.js`); 2) kontakt `dl.contact-list` riadok s `dt` „Otvorené“ → `dd` „Po–Pi 9:00–19:00<br>So 9:00–14:00<br>Ne zatvorené“ (r. 813); 3) pätička `dl.hours` tri `div > dt + dd` (r. 850–854); 4) tabuľa `[data-flap] .flap-cells` záložný text „Po–Pi 9:00–19:00, So 9:00–14:00“ (r. 808, JS ho prepíše); 5) JSON‑LD `openingHoursSpecification`; 6) veta `#rezervacia .title-sub` „Zavolaj na recepciu, v pracovné dni od 9:00 do 19:00…“ | konštanta podľa názvu; `.band-contact .contact-row` podľa textu `dt`; `.site-footer dl.hours`; `[data-flap] .flap-cells`; JSON‑LD; `#rezervacia .title-sub` | tabuľka 7 dní (Po…Ne): prepínač Otvorené + od / do ako výber (v telefóne koliesko); náhľad „ako to uvidí zákazník“ (Po–Pi 9:00–19:00 …, zlúčené rovnaké susedné dni) | od < do; 6:00–22:00; aspoň jeden deň otvorený; kým `hodiny.js` nevie minúty, len celé hodiny (časť 11); zmena, ktorá rozdelí Po–Pi na rôzne časy, je povolená (riadkov pribudne) | generované: kľúče „Po–Pi 9:00–19:00“, „So 9:00–14:00“, „Ne zatvorené“, „Po–Pi 9:00–19:00, So 9:00–14:00“ a skratky „Po–Pi“, „So“, „Ne“, „zatvorené“ zo slovníka skratiek dní pre 7 jazykov (ako `DAY_WORDS` v admine HEAD SPA; dnes napr. uk „Пн–Пт 9:00–19:00“, hu „H–P 9:00–19:00“, de „Mo–Fr 9:00–19:00“); veta v karte Rezervácia: čísla sa vymenia v 7 prekladoch (`swapNums`), slová ostanú; `__tabula` sa nemení | majiteľ | 1–2× ročne | všetkých 6 miest, 7 slovníkov, JSON‑LD, `sitemap` |
| Výnimky: sviatky, dovolenka, skrátený deň | dnes neexistuje; D6a N03 pridá štátne sviatky do `assets/hodiny.js` (tabuľa „Sviatok · Online sa na dnes objednať nedá“) | navrhovaná konštanta `VYNIMKY` vedľa `HOURS` v tom istom súbore: `[{od:'2026-12-24', do:'2026-12-26', hodiny:null, text:'Vianoce'}, {od:'2026-12-31', do:'2026-12-31', hodiny:[9,14], text:''}]` | zoznam riadkov: od, do (predvolene = od), stav „zatvorené“ alebo od–do, poznámka; štátne sviatky na 12 mesiacov predvyplnené, pri každom prepínač „otvorené ako bežne“ (odpoveď na otázku 6 pre majiteľa); minulé riadky admin pri uložení zahodí; ponuka „pridať k tomu aj oznam“ | platné dátumy, od ≤ do, do ≥ dnes; prekrytie dvoch riadkov = upozornenie; max 40 riadkov; poznámka ≤ 40 znakov | poznámka: 7 polí, voliteľné (tabuľa ju ukáže v jazyku stránky, inak po slovensky) | majiteľ | 5–10× ročne | `VYNIMKY`; JSON‑LD `specialOpeningHoursSpecification` (validFrom, validThrough, opens/closes; bez opens = zatvorené); `sitemap` |

### 3.3 Cenník (záložka Služby a ceny)

Dnes 15 riadkov v 4 skupinách (Strih 5, Brada a holenie 3, Balíčky 2, Doplnky 5) plus poznámka o Romane.

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Cena služby | `.price-row .price-amount` („18 €“, „21,50 €“; pevná medzera U+00A0 pred €); JSON‑LD `Offer.price` („18“, „21.50“, desatinná bodka); podtitul `#sluzby .title-sub` „Pánsky strih 18 €, s úpravou brady 28 €. Ceny sú konečné.“ (čísla prvých dvoch služieb); po D6a `priceRange` | `.price-row` podľa textu `.price-name` + poradie v `.price-group`; JSON‑LD podľa `itemOffered.name` | číslo v eurách s krokom 0,50 (klávesnica s číslami), vedľa poľa odkaz „Otvoriť rezervačný systém“ a zaškrtnutie „Táto cena je už v rezervačnom systéme“ (povinné pri každej zmenenej cene) | 1–200 €; násobok 0,50; bez „od“, bez rozpätia, bez zľavy; zaškrtnutie potvrdenia | cena sa neprekladá; v podtitule sa čísla vymenia v 7 prekladoch (`swapNums`) | majiteľ, až po zmene v rezervačnom systéme | 1–3× ročne, zvyčajne viac cien naraz | HTML suma, JSON‑LD `price`, podtitul SK + 7 jazykov, `priceRange` (po D6a), riadok „Ceny a trvanie podľa rezervačného systému, overené <dátum>“ (D6b) stratí dátum („…podľa rezervačného systému“), denník v `CONTENT_SOURCES.md`, `sitemap` |
| Názov služby | `.price-row .price-name` (h4); skrytý text tlačidla `.price-cta .visually-hidden` „ – Názov“; JSON‑LD `itemOffered.name` | kľúče: `Názov` a `– Názov` | text | 2–60 znakov; jedinečný v cenníku; zaškrtnutie „tak sa služba volá aj v rezervačnom systéme“ (zákazník ju tam musí nájsť) | 2 kľúče × 7 (presun kľúča, starý preklad označený „skontroluj preklad“) | majiteľ | 0–2× ročne | názov, skrytý text, JSON‑LD, slovníky, denník; pás `.marquee` sa nemení (ozdoba, časť 4) |
| Popis služby | `.price-row .price-desc` | kľúč = text | text, 1–2 vety | ≤ 170 znakov (najdlhší dnešný má 112), bez odkazov | 7 polí | majiteľ | zriedka | slovníky |
| Trvanie | `.price-row .price-time` („40 min“, pevná medzera) | kľúč = „40 min“ (jeden kľúč pre všetky služby s rovnakým časom) | číslo v minútach | 5–180, násobok 5; upozornenie „trvanie nemá v `CONTENT_SOURCES.md` zdroj zo systému (tabuľka má „None min“), over ho v rezervačnom systéme“ | generované: admin vezme existujúci kľúč s iným číslom („40 min“ → en „40 min“, de „40 Min.“, hu „40 perc“, uk „40 хв“) a číslo vymení; nový kľúč len ak ešte nie je | majiteľ po overení so systémom | zriedka | slovníky, denník |
| Skupina a poradie, nová služba, odstránenie | `section.price-group` (h3 `.price-group-title`, id `g-strih`, `g-brada`, `g-balicky`, `g-doplnky`), `ul[role=list] > li.price-row` | šablóna = kópia existujúceho `li.price-row` s odkazom na rezerváciu | šípky hore/dole, výber skupiny, „Pridať službu“, „Odstrániť“ s potvrdením; názov skupiny je textové pole | v skupine aspoň 1 riadok; nová služba má názov, cenu, trvanie a potvrdenie, že je v systéme; najviac 30 riadkov (dĺžka stránky) | názov skupiny = kľúč (7); nová služba = 3 nové kľúče (názov, „– názov“, popis) + trvanie | majiteľ | zriedka | JSON‑LD poradie a počet ponúk, slovníky, denník; pri odstránení zmazať kľúče, ktoré už nič nepoužíva |
| Postup „Pánsky strih krok za krokom“ | `.steps-wrap .eyebrow` + `ol.steps li` (5) | kľúče | nadpis + 3–7 riadkov | riadok ≤ 40 znakov | 7 polí na riadok | majiteľ | zriedka | slovníky |
| Poznámka o Romane (farbenie, melír, trvalá) | `.price-extra .price-name`, `.price-extra .price-desc`, odkaz „Rezervovať na Booqme“; `#tim .team-note` „Farbenie, melír a trvalú robí Romana. Rezervuješ ich samostatne.“ | kľúče | texty; odkaz na Booqme je zamknutý (časť 4) | bez cien (pravidlo jedného cenníka: Romanine ceny len so súhlasom majiteľa, dnes nie) | 7 polí | majiteľ | zriedka | slovníky |

### 3.4 Tím (záložka Tím)

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Meno | `.team-card .team-name` (h3); `alt` portrétu „Meno, Rola v Barbershop 30“ | kľúč = meno; kľúč = alt | text | 2–30 znakov, jedinečné | meno ostáva vo všetkých jazykoch rovnaké (dnes aj v uk „Nikolas“), kľúč sa založí s hodnotou = meno; alt sa generuje zo šablón pre 7 jazykov (dnes en „Nikolas, barber at Barbershop 30“, uk „Nikolas, барбер у Barbershop 30“, hu „Nikolas, barber a Barbershop 30‑ban“, de „Nikolas, Barber im Barbershop 30“) | majiteľ | 1–3× ročne (príchod, odchod, prezývka) | slovníky (meno, alt), `manifest.json` alt, denník |
| Rola | `.team-card .team-role` | kľúče „Barber“, „Barberka“ (existujú vo všetkých 7; de „Barberin“, uk „Барберка“) | výber Barber / Barberka / iné (text) | „iné“ vyžaduje preklady, inak sa na webe ukáže slovenčina | existujúce kľúče bez práce; pri „iné“ 7 polí | majiteľ | zriedka | alt (rola je v ňom), slovníky |
| Popis pod menom | `.team-card .team-bio` | kľúč | jedna veta | ≤ 90 znakov (najdlhšia dnes 68); podľa `CONTENT_SOURCES.md` krátke vety o remesle, nie fakty o osobe (roky praxe, ocenenia) – admin to pripomenie pod poľom | 7 polí | majiteľ | zriedka | slovníky |
| Fotka | `.team-portrait picture`: `source` avif 480/820, `source` webp 480/820, `img` png 480/820 (`width=821 height=695`, `style="--focal: 50% 35%"`, `loading=lazy`); súbory `assets/img/tim-<slug>-{480,820}.{avif,webp,png}` (dnes 60 súborov); `manifest.json` → `team.tim-<slug>` | slug z mena bez diakritiky (`tim-nikolas`) | nahrať fotku z telefónu alebo počítača, výrez 821:695 s posúvaním (ohnisko → `--focal`), náhľad karty | JPEG/PNG/WebP (HEIC prehliadač nevie – povedať to), ≤ 15 MB, po výreze aspoň 820 × 695 px; súhlas zamestnanca s portrétom na webe (zaškrtnutie; `CONTENT_SOURCES.md` ho žiada) | nie | majiteľ | 1–3× ročne | v prehliadači vyrobiť WebP 480 a 820 + JPEG 820 (AVIF sa v prehliadači kódovať nedá: `<picture>` nového človeka bude bez AVIF zdroja, `img` ukáže na JPEG); zapísať `manifest.json` (`formats` podľa skutočnosti); zmazať staré súbory tej osoby; `sitemap` |
| Poradie, pridať, odstrániť | `ul.team-grid > li.team-card` | kópia existujúcej karty ako šablóna (CTA s odkazom na rezerváciu sa nemení) | šípky / presun; „Pridať človeka“; „Odstrániť“ s potvrdením | aspoň 1 člen, najviac 16; nový člen potrebuje meno, rolu, fotku | — | majiteľ | 1–3× ročne | pri odstránení zmazať `li`, 6 súborov fotiek, záznam v manifeste a kľúče (meno, popis, alt), ak ich nič iné nepoužíva; denník |

### 3.5 Texty sekcií (záložka Texty: každá sekcia zvlášť, s hľadaním)

Polia sa čítajú z HTML tak ako v admine HEAD SPA (`parseTexts`): blok = `p, h1–h6, li, button, figcaption, label, dt, dd, small`;
v bloku sa menia len textové úseky, značky `<em>`, `<a>`, `<br>`, `<span class="w">` ostávajú. Nadpisy `.kin` a `h1` sú rozdelené
na riadky (`<br>`, `<span class="w">`) a každý riadok je samostatný kľúč (napr. „Komu“ + „zveríš hlavu?“) – admin ukáže
nadpis ako jedno pole s dvoma riadkami a rozdelí ho rovnako.

| Sekcia (id) | Polia (selektory) | Tvar | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|
| Úvod `#uvod` | `.kicker` „Barbershop 30 · Nitra“, `h1#h-uvod` (2 riadky, druhý kurzíva), `.title-sub`, tlačidlá „Rezervovať termín“, „Zavolať“ | text; h1 ako 2 riadky | riadok nadpisu ≤ 24 znakov (Fraunces 800 na telefóne), podtitul ≤ 120 | 7 polí na úsek | majiteľ | zriedka (13. 10. 2026 na želanie majiteľa) | slovníky, `sitemap` |
| Poď ďalej `#vstup-dnu`, Remeslo `#remeslo`, Čakáreň `#cakaren`, Cestou von (`#galeria` druhá karta) | `.kicker`, `h2.kin` / `h3.kin` (2 riadky), `.title-sub` | text | ako úvod | 7 polí | majiteľ | zriedka | slovníky |
| Tím `#tim` | `.kicker` „Ľudia“, `h2#h-tim`, `.title-sub`, `.band-head .eyebrow` „Kto ťa ostrihá“, `.band-head .lead`, `.team-note` | text | ako vyššie | 7 polí | majiteľ | zriedka | slovníky |
| Služby `#sluzby` | `.kicker`, `h2#h-sluzby`; `.title-sub` je **generovaný** z cien (nemení sa tu, len v Cenníku); `.steps` (3.3) | text | — | 7 polí | majiteľ | zriedka | slovníky |
| Galéria `#galeria` | `.kicker`, `h2#h-galeria`, `.title-sub`; `.recenzie .eyebrow` „Povedali o nás“; `.trust-item` (eyebrow „Dôvera“, `.trust-text`, odkaz „Hodnotenie na Google“; eyebrow „Instagram“, `.trust-text`, text odkazu `@barbershop30_nitra` je generovaný zo siete) | text | `.trust-text` ≤ 140 znakov; fakty (rok 2019) musia sedieť s `CONTENT_SOURCES.md` – admin pripomenie | 7 polí | majiteľ | zriedka | slovníky |
| Rezervácia `#rezervacia` | `.kicker`, `h2#h-rezervacia` (s `<em>`), `.title-sub` (hodiny v nej sú generované: čísla z Hodín, slová editovateľné), tlačidlá; kontakt: `.eyebrow` „Kde nás nájdeš“, `h3.h2` „Mostná 30, Nitra“ (zamknuté, adresa), `ul.facts li` 6 × `strong` + `span` | text; fakty ako zoznam dvojíc (titulok ≤ 20, podriadok ≤ 50) | fakty s `data-required` (po D6) ostávajú skryté, kým ich tím neodomkne – admin ich ukáže sivo s poznámkou „čaká na potvrdenie“ | 7 polí | majiteľ | zriedka | slovníky |
| Pätička `footer` | `.footer-brand p.small` „Pánske strihy, brada a holenie na Mostnej 30. Od roku 2019.“; nadpisy stĺpcov, hodiny, kontakt a odkazy sú generované alebo zamknuté | text | ≤ 90 znakov | 7 polí | majiteľ | zriedka | slovníky |
| Pre Google a zdieľanie (`<head>`) | `<title>`, `meta[name=description]`, `og:title`, `og:description`, `og:image:alt` | text s počítadlom znakov | title ≤ 65, description ≤ 155 (D6a N10), og:title ≤ 70 | 7 polí (i18n ich prekladá) | majiteľ so správcom webu | zriedka | slovníky, `sitemap` |

### 3.6 Kontakt a siete (záložka Kontakt)

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Telefón | 5 × `a[href="tel:+421951267203"]` (úvod, karta Rezervácia, kontakt, pätička, `#mobile-cta`), 4 × text „0951 267 203“, `aria-label` „Zavolať na recepciu 0951 267 203“ (`#mobile-cta .btn-call`), JSON‑LD `telephone`; po D6a N08 aj kľúč „+421 951 267 203“ | `a[href^="tel:"]`; kľúče s číslom | jedno pole, zobrazený tvar „0951 267 203“ | po odstránení medzier `+421` alebo `0` a 9 číslic; medzinárodný tvar do `tel:` a JSON‑LD, národný do textu | kľúče s číslom: číslo sa vymení v 7 prekladoch (uk „Зателефонувати на рецепцію 0951 267 203“ ostane so slovami, zmení sa len číslo) | majiteľ | takmer nikdy | všetkých 11 miest naraz, slovníky, denník, `sitemap` |
| E‑mail | 2 × `a[href^="mailto:"]` + 2 × text, JSON‑LD `email` | kľúč „info@barbershop30.sk“ (hodnota rovnaká vo všetkých) | pole | jednoduchý tvar `meno@doména.tld`; upozornenie, ak doména nie je `barbershop30.sk` | presun kľúča (hodnota = nový e‑mail) | majiteľ | takmer nikdy | 5 miest, slovníky, denník |
| Instagram | `#galeria .trust-item a[href*="instagram.com"]` + text „@barbershop30_nitra“, pätička `a[href*="instagram.com"]`, JSON‑LD `sameAs` | podľa hostiteľa v `href` (bez `data-siet`; ak tím pridá `data-siet` ako v HEAD SPA, admin ho uprednostní) | pole: adresa profilu alebo `@meno` | `https://www.instagram.com/<meno>/`, meno `[A-Za-z0-9._]{1,30}`; prázdne = odkaz sa odstráni (aj z `sameAs`) | text „@meno“ je kľúč s rovnakou hodnotou vo všetkých 7 | majiteľ | zriedka | 2 odkazy, text, `sameAs`, slovníky |
| Facebook | pätička `a[href*="facebook.com"]`, `sameAs` | podľa hostiteľa | pole | `https://www.facebook.com/…` | — | majiteľ | zriedka | odkaz, `sameAs` |
| TikTok (dnes nie je) | — | pri vyplnení nový `li` v `.footer-links` za Facebook + `sameAs` | pole, voliteľné | `https://www.tiktok.com/@…` | text „TikTok“ kľúč (rovnaký) | majiteľ | zriedka | pätička, `sameAs` |
| Google profil (hodnotenia) | `#galeria a[href*="google.com/maps"]`, `recenzie.js` `GOOGLE`, po D6a JSON‑LD `hasMap` | podľa hostiteľa | pole | `https://www.google.com/maps?cid=<číslo>` | — | majiteľ so správcom webu | takmer nikdy | 3 miesta |

### 3.7 Recenzie (záložka Recenzie)

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Recenzia | `assets/recenzie.js` pole `RECENZIE` `{meno, lang, text}`; sekcia `.recenzie[hidden]` + `ul[data-recenzie][data-no-i18n]` | poradie v poli | zoznam kariet: meno („Marek J.“), jazyk (8), text, šípky poradia; „Pridať“, „Odstrániť“ | meno `^\p{Lu}[\p{L}'\-]+ \p{Lu}\.$` (meno a iniciála); text 40–600 znakov, bez URL a e‑mailu; upozornenie na možné celé priezvisko tretej osoby (dve slová s veľkým písmenom za sebou); povinné zaškrtnutie „prepísané doslovne z Google, bez opráv“ (`CONTENT_SOURCES.md`); 0 recenzií = sekcia ostane skrytá (guard v module) | nie – citácia sa neprekladá, `lang` ide na `blockquote` | majiteľ | 2–4× ročne | `recenzie.js`, `sitemap`, denník (meno, dátum, „overené na Google“) |

### 3.8 Firma (záložka Firma)

| Položka | Kde v kóde | Selektor / kľúč | Tvar v admine | Validácia | Preklady | Kto mení | Ako často | Po uložení |
|---|---|---|---|---|---|---|---|---|
| Právne údaje | `.footer-bottom p.small` „© <span class="year">2026</span> Barbershop 30 · Prevádzkovateľ: FACEPALM, s.r.o., IČO 52231381“ (kľúč s číslom); po D6a N05 `pravne.html` (obchodné meno, sídlo, IČO, DIČ, register, SOI) | kľúč; `pravne.html` podľa `data-firma` atribútov (ako HEAD SPA) | polia: obchodné meno, IČO, DIČ, IČ DPH, zápis v registri | IČO 8 číslic, DIČ 10, IČ DPH `SK` + 10; rok v pätičke píše web sám | kľúč pätičky: slová ostávajú, číslo sa vymení | majiteľ | takmer nikdy | pätička, `pravne.html` (ak existuje), slovníky |

### 3.9 Pri každom uložení (bez zásahu majiteľa)

`sitemap.xml` 8 × `lastmod`; jeden commit do `main` s popisom zmien po slovensky, bez podpisov a bez zmienky o nástrojoch
(CLAUDE.md); riadok denníka v `docs/CONTENT_SOURCES.md`; kontrola rozpočtu gzip `index.html` ≤ 14 600 B; kontrola, že
každý nový slovenský kľúč má záznam v 7 slovníkoch alebo je vo výpise „nepreložené“ (web ukáže slovenčinu); po
uložení admin sleduje živý `index.html` (`cache: 'no-store'`, porovnanie s uloženým textom) a ukáže „Naživo o 14:32“
alebo po 3 minútach „Ešte sa nasadzuje, skontroluj o chvíľu“ (GitHub Pages podľa README asi minúta).

## 4. Zamknuté (admin ich ukáže len na čítanie alebo vôbec)

| Položka | Prečo | Kto to mení a ako |
|---|---|---|
| Film, zábery, sekvencie, videá, titulné karty (`.film-shot`, `data-shot`, `data-place`, `data-video…`, `film.js`, `assets/img/film/`, `assets/seq/`, `assets/video/`) | vlastníkmi sú dávky D3–D5 a D7; zmena = nové zábery, hĺbkové mapy, meranie | tím webu (`source/tools/film.py`, `stills.py`) |
| Fotky prevádzky v galérii (`.gallery-item`, `alt`, lightbox) a `og.jpg` | výber a práva sú v `docs/MEDIA_SELECTION.md`; alt texty sú popisy fotiek | tím webu (`build_images.py`); výsledky strihov (`data-required="results"`) sa odomknú až po fotkách so súhlasom klientov |
| Štruktúra: menu `nav#nav`, kapitoly `.story-line` (`aria-label`), id sekcií, `.chip` popisky („Tím v akcii“), lightbox, `.flap-label` „Dnes“, nadpisy `dt` v kontakte a pätičke, tlačidlá dverí | kotvy pre `app.js`, `film.js`, `i18n-test.mjs` a odkazy; zmena slov v menu je zmena IA, nie obsahu | tím webu |
| Pás `.marquee` so slovami služieb | `aria-hidden` ozdoba so 7 slovami (nie cenník); bez vzťahu k riadkom | tím webu |
| Adresa (Mostná 30, 949 01 Nitra) vo všetkých tvaroch, odkazy „Navigovať“, JSON‑LD `address`, texty „na Mostnej 30“ | sťahovanie je nový web, nie úprava | tím webu |
| Odkaz na rezerváciu `https://www.barbershop30.sk/rezervacia` (31 výskytov + JSON‑LD) a odkaz Booqme (2 + `BQ_RE` v `i18n.js`) | `i18n.js` ich pozná podľa prefixu (r. 158–163: poznámka „rezervácia je po slovensky“, jazyk Booqme); zmena domény = migrácia D6c | tím webu, pri migrácii jedným `sed` (DEPLOY STEP) |
| Jazyky (zoznam, poradie, `__tabula`, `i18n.js`, `i18n.css`) | rozhodnuté prieskumom `docs/JAZYKY.md` | tím webu |
| Vernostná kartička (odkaz v pätičke, `vernost.js`, `data-zapnute`) | vlastný admin pre recepciu, zapína `pages.yml` | recepcia vo `vernost/admin/`, nasadenie tím |
| Analytika, cookie lišta | majiteľ nerozhodol (`CONTENT_SOURCES.md`); na rozdiel od HEAD SPA bez záložky Štatistiky | až po rozhodnutí majiteľa |
| Poukazy | web ich nemá, otázka 2 pre majiteľa nie je zodpovedaná | až po odpovedi |
| Ceny Romany (Booqme) | pravidlo jedného cenníka; `CONTENT_SOURCES.md` | len so súhlasom majiteľa, mimo admin v1 |
| `robots.txt`, `sitemap.xml` okrem `lastmod`, `canonical`, `hreflang`, `og:url` | D6c (doména) | tím webu |

## 5. Preklady – model

- Slovenčina je zdroj v `index.html`; kľúč prekladu je normalizovaný slovenský text (`norm`), bez značiek. Preto admin
  mení preklady **po úsekoch** (časť textu pred `<em>` a za ním sú dva kľúče), rovnako ako admin HEAD SPA.
- **Žiadny automatický preklad.** Pri každom texte sú pod ním zbalené „Preklady (7)“ s poľami EN, UK, HU, SR, PL, DE, CS
  v poradí z `i18n.js`. Prázdne pole = štítok „nepreložené – na webe bude slovenčina“ (tak sa `i18n.js` správa sám;
  nič netreba dopĺňať). Pri uložení admin zhrnie: „3 texty bez prekladu (uk 2, sr 1)“.
- **Zmena slovenčiny**: kľúč sa presunie vo všetkých 7 slovníkoch na nový text (vloží sa za starý), starý preklad
  ostane v poli so štítkom „skontroluj preklad“ (majiteľ ho môže nechať; nie je povinný). Starý kľúč sa zmaže, len keď
  ho už nepoužíva nič iné v HTML (ten istý text býva na dvoch miestach, napr. „Rezervovať termín“ 4×).
- **Čísla v texte** (ceny v podtitule cenníka, hodiny vo vete karty Rezervácia, telefón v `aria-label`, IČO v pätičke):
  admin vymení len čísla v poradí (`swapNums`), slová prekladu ostanú. Pri inom počte čísel pole označí „skontroluj preklad“.
- **Generované texty** (hodiny, trvania, alt portrétov, „– Názov“ v tlačidle) sa skladajú zo šablón pre 7 jazykov,
  nie z ručného prekladu: skratky dní a slovo „zatvorené“ (dnes v slovníkoch), slovo pre minúty (vzor z existujúceho
  kľúča „40 min“), šablóny alt (vzor z dnešných 10 kľúčov), spojka pomlčky.
- **Neprekladá sa**: mená ľudí (kľúč = hodnota), e‑mail, adresa profilu, recenzie (`data-no-i18n`, `lang` na citácii),
  oznam v jazykoch bez prekladu (ukáže sa slovensky – pre dovolenku je to prijateľné, admin to povie).
- `__tabula` v slovníkoch (slová tabule) admin nemení; ak D6a N03 pridá slová pre sviatok, pridá ich tím.
- Kontrola: admin nevie spustiť `source/tools/i18n-test.mjs`; robí statickú kontrolu (každý nový kľúč v 7 slovníkoch
  alebo v zozname nepreložených) a po uložení správca webu spúšťa test pri najbližšej práci.

## 6. Validácie – súhrn

| Pole | Pravidlo | Správa majiteľovi (pod poľom, hneď pri písaní) |
|---|---|---|
| Cena | číslo 1–200, krok 0,50; bez „od“, bez rozpätia | „Cena je číslo v eurách, napríklad 18 alebo 21,50.“ |
| Cena – potvrdenie | zaškrtnutie „už je v rezervačnom systéme“ pri každej zmenenej cene; bez neho sa neuloží | „Najprv zmeň cenu v rezervačnom systéme, zákazník ju vidí tam pri objednaní.“ + odkaz |
| Trvanie | 5–180 min, násobok 5 | „Minúty po piatich, napríklad 40.“ |
| Názov služby | 2–60 znakov, jedinečný | „Rovnaký názov už v cenníku je.“ |
| Hodiny | od < do, 6:00–22:00, celé hodiny (kým `hodiny.js` nevie minúty), aspoň 1 deň otvorený | „Zatvárame skôr, než otvárame?“; „Minúty web zatiaľ nevie, vyber celú hodinu.“ |
| Výnimka | platný dátum, od ≤ do, do ≥ dnes, bez prekrytia | „Tento deň už má výnimku.“ |
| Oznam | ≤ 160 znakov, bez odkazov, bez em dash | „Krátko, jedna až dve vety.“ |
| Texty | limity dĺžky podľa 3.5 (nadpis ≤ 24 na riadok, podtitul ≤ 120, popis ≤ 170) | „Na telefóne sa to zalomí na tri riadky, skús kratšie.“ |
| Telefón | bez medzier `+421` alebo `0` a 9 číslic | „Slovenské číslo, napríklad 0951 267 203.“ |
| E‑mail | `meno@doména.tld` | „Toto nevyzerá ako e‑mail.“ |
| Siete | adresa na správnej doméne alebo `@meno`; prázdne = odstrániť | „Instagram je instagram.com/meno.“ |
| Fotka | JPEG/PNG/WebP, ≤ 15 MB, výrez ≥ 820×695, súhlas zamestnanca | „Fotka je malá, bude rozmazaná.“; „HEIC z iPhonu najprv ulož ako JPEG (Nastavenia → Fotoaparát → Najkompatibilnejší).“ |
| Recenzia | meno „Meno P.“, 40–600 znakov, bez URL, potvrdenie doslovnosti | „Meno skráť na meno a prvé písmeno priezviska.“ |
| IČO / DIČ / IČ DPH | 8 / 10 / SK+10 číslic | „IČO má 8 číslic.“ |
| Rozpočet HTML | gzip ≤ 14 600 B | „Stránka by bola o 120 B ťažšia, než smie. Skráť oznam alebo popis.“ |
| Konflikt s `main` | `sha` sa zmenil | „Web medzitým niekto upravil. Načítal som novú verziu a tvoje zmeny preniesol; toto pole sa zmenilo aj tam – skontroluj.“ |

Pravidlá z C028 (formuláre): chyby pri poli, nie v okne; uloženie zablokované len pri chybe, upozornenia neblokujú;
nič sa nestratí pri obnovení stránky (rozpracované zmeny v `sessionStorage`, kľúč nie).

## 7. Čo sa po uložení prepočíta (a v akom poradí)

1. **Cena** → `.price-amount` (čiarka, pevná medzera, „€“) → JSON‑LD `Offer.price` (bodka, „21.50“) → podtitul
   `#sluzby .title-sub` (čísla prvých dvoch riadkov skupiny Strih; ak majiteľ zmení poradie, veta sa prepíše podľa
   nových prvých dvoch) → tie isté čísla v 7 prekladoch → `priceRange` (po D6a: `min € – max €`) → riadok „overené
   <dátum>“ (po D6b) stratí dátum → denník.
2. **Názov služby** → `.price-name` → `.price-cta .visually-hidden` → JSON‑LD `name` → presun 2 kľúčov × 7.
3. **Hodiny** → `HOURS` → `dd` v kontakte → `dl.hours` v pätičke (**pätička = kontakt**, vždy rovnaké) → záložný text
   `.flap-cells` → JSON‑LD `openingHoursSpecification` (zlúčenie dní s rovnakým časom) → veta v karte Rezervácia
   („v pracovné dni od 9:00 do 19:00“: ak Po–Pi už nie sú rovnaké, admin vetu označí „skontroluj“ a nemení ju) →
   4 kľúče hodín + 4 skratky v 7 slovníkoch.
4. **Výnimky** → `VYNIMKY` → `specialOpeningHoursSpecification`.
5. **Telefón / e‑mail** → `href` + texty + `aria-label` + JSON‑LD + kľúče s číslom.
6. **Siete** → odkazy + text „@meno“ + `sameAs` (poradie Instagram, Facebook, TikTok) + `GOOGLE` v `recenzie.js`.
7. **Tím** → `li.team-card` (šablóna z prvej karty), súbory fotiek, `manifest.json`, kľúče meno/popis/alt × 7.
8. **Oznam** → `#oznam p` + `hidden` + kľúč × 7.
9. **Recenzie** → `RECENZIE` (JSON s odsadením ako dnes), guard pre prázdne pole.
10. **Vždy** → `lastmod` × 8 → denník → kontrola gzip → bloby, strom, commit, posun `main` → sledovanie nasadenia.

Čo sa **neprepočítava** a admin to povie: pás `.marquee`, texty v `docs/` okrem denníka, `source/`, `CHECKS.md`.

## 8. Ceny a pravidlo jedného cenníka – rozhodnutie

Fakty: `docs/CONTENT_SOURCES.md` uvádza ceny ako „overené‑oficiálne“ z JSON rezervačného systému
(`https://www.barbershop30.sk/rezervacia`, 2026‑10‑09); trvania tam majú „None min“ (web ich má, zdroj nie je
zapísaný – D6a N11 to má doplniť); CLAUDE.md pre HEAD SPA má rovnaké pravidlo („salón ich mení v kalendári, web sa
zosúladí“); D6a N12 plánuje `source/tools/rezervacia-kontrola.mjs` (porovná 15 názvov, cien a trvaní s
`v-order-component` a `/rezervacia/ajax`). Z prehliadača majiteľa sa systém priamo čítať nedá (iný pôvod, POST
koncový bod bez CORS; nevieme to garantovať) – admin preto **nesľubuje automatickú kontrolu**.

Rozhodnutie pre admin v1:

1. Admin ceny, názvy a trvania **mení** – inak by majiteľ pri každej zmene potreboval programátora a web by bol
   nepravdivý dlhšie, než keby ju urobil sám.
2. Mení ich **len ako zosúladenie**: pri každej zmenenej cene je povinné zaškrtnutie „Táto cena je už v rezervačnom
   systéme“ a odkaz naň; v hlavičke záložky je veta „Zákazník platí cenu z rezervačného systému. Web ju iba ukazuje,
   preto ju najprv zmeň tam.“ (C019: pravdivosť ponuky).
3. Každá zmena ide do denníka v `CONTENT_SOURCES.md` s textom „potvrdené majiteľom v rezervačnom systéme <dátum>“;
   riadok „overené <dátum>“ z nástroja (D6b) stratí dátum, kým nástroj nezbehne znova – web tak nikdy netvrdí
   kontrolu, ktorá sa nestala.
4. Nikdy: ceny „od“, zľavy, akcie, Romanine ceny (Booqme), služby mimo rezervačného systému (`PLAN-D6-D7.md` „Čo
   nerobiť“). Admin nemá pole, do ktorého by sa dali napísať.
5. Odporúčanie správcovi webu: po dokončení N12 spúšťať `rezervacia-kontrola.mjs` raz mesačne a po každom riadku
   denníka s cenou; ak by koncový bod systému mal verejné GET JSON s CORS, dá sa do adminu pridať tlačidlo „Porovnať
   so systémom“ ako druhý krok (nie v1).

## 9. Kto mení a ako často (súhrn)

| Skupina | Kto | Odhad za rok | Čas v admine (cieľ) |
|---|---|---|---|
| Oznam | majiteľ | 5–10× | do 1 minúty |
| Výnimky v hodinách | majiteľ | 5–10× | do 1 minúty |
| Cena / názov / trvanie | majiteľ po zmene v systéme | 1–3× (viac položiek naraz) | do 1 minúty na cenu, 5 minút na celý cenník |
| Text sekcie | majiteľ | 2–4× | do 1 minúty bez prekladov; preklady podľa chuti |
| Člen tímu | majiteľ | 1–3× | 3 minúty s fotkou |
| Recenzie | majiteľ | 2–4× | 2 minúty |
| Týždenné hodiny | majiteľ | 1–2× | do 1 minúty |
| Siete, Google profil | majiteľ | 0–1× | do 1 minúty |
| Telefón, e‑mail, firma | majiteľ so správcom | takmer nikdy | do 1 minúty |
| Všetko zamknuté (časť 4) | tím webu | podľa dávok | mimo admin |

Jediný používateľ adminu je majiteľ (jeden kľúč GitHub; recepcia má vlastný admin vernostnej kartičky). Preto admin
nepotrebuje roly ani schvaľovanie; potrebuje zoznam zmien pred uložením („4 zmeny: cena Pánsky strih 18 → 19 €, …“)
a možnosť vrátiť pole na pôvodnú hodnotu.

## 10. Čo admin potrebuje od webu a od dávok D1–D7

| Potreba | Kde | Veľkosť | Kto a kedy |
|---|---|---|---|
| Prvok oznamu `<div class="oznam" id="oznam" role="status" hidden><p></p></div>` za `</header>` + štýl `.oznam` v `style.css` (pokojný pás v tónoch orecha, bez animácie, pod lištou, `role="status"`) | `index.html`, `assets/style.css` | ≈ 60 B gzip v HTML, ≈ 250 B v CSS | vetva `barbershop-admin` pri zlúčení po D1–D5 (jednoriadkové vloženie, malé riziko konfliktu) |
| Voliteľne `data-do="RRRR-MM-DD"` na `#oznam` a 3 riadky v `app.js`, ktoré ho po dátume skryjú | `app.js` | ≈ 40 B | spolu s prvkom; bez toho admin pole „platí do“ neukáže |
| `Disallow: /admin/` | `barbershop-30/robots.txt` | 1 riadok | vetva `barbershop-admin` |
| Stabilný názov konštanty hodín `HOURS` a `VYNIMKY` (po D6a v `assets/hodiny.js`), hodiny ako celé hodiny alebo v minútach s jednou formátovacou funkciou | `app.js` / `assets/hodiny.js` | — | tím D6a N03; admin číta oba súbory |
| Guard `if (!RECENZIE.length) return;` v `recenzie.js` | `assets/recenzie.js` | 1 riadok | vetva `barbershop-admin` |
| Voliteľne `data-siet` (instagram, facebook, tiktok) na odkazoch sietí a `data-sluzba="<id systému>"` na `.price-row` | `index.html` | ≈ 15 × 16 B surových, ≈ 60 B gzip | len ak rozpočet dovolí po D5; admin bez nich funguje (hľadá podľa hostiteľa a názvu) |
| Denník `## Denník zmien z adminu` | `docs/CONTENT_SOURCES.md` | — | založí prvé uloženie z adminu |
| Zápis do `pages.yml`: kopírovať `barbershop-30/admin/` do `_site/barbershop-30/admin/` | `.github/workflows/pages.yml` | 1 riadok | pri nasadení adminu (majiteľ rozhodne, kedy) |

Závislosti: admin stojí na selektoroch z časti 3; D1–D5 menia `index.html` (náhľady, `sizes`, atribúty filmu,
`id="kontakt"` sa v D6a N06 presúva z `footer` na `.band-contact` – admin používa `footer.site-footer`, nie `#kontakt`),
D6a mení JSON‑LD (`HairSalon`, `geo`, `hasMap`, `priceRange`), D6b pridáva modul `navsteva.js` (admin ho nečíta v1;
odpovede „Pred návštevou“ sú kandidát na záložku v2 po tom, čo majiteľ odpovie na otázky 1–8).

## 11. Otázky pre majiteľa, ktoré menia model (ostatné sú v `OTAZKY-PRE-MAJITELA.md`)

1. Hodiny s polhodinou (napr. So 9:00–13:30) niekedy potrebuješ? Ak áno, `hodiny.js` musí vedieť minúty už v D6a.
2. Sviatky: ktoré sú zatvorené (otázka 6) – admin ich predvyplní; potom ich len prepínaš.
3. Chceš meniť ceny sám, alebo ti stačí, že to po tvojej správe urobí správca webu? (Model ráta s tým, že sám – po zmene
   v rezervačnom systéme.)
4. Má oznam ukazovať aj dátum „platí do“ a sám zmiznúť, alebo ho vždy zmažeš ručne?
5. Stačí ti v admine slovenčina a preklady necháš prázdne (web ukáže slovenčinu), alebo chceš preklady posielať niekomu
   na vyplnenie? (Admin to umožňuje oboje.)

## 12. Overenie proti `CONTENT_SOURCES.md` – nálezy, ktoré admin musí rešpektovať

- Ceny sedia s tabuľkou systému (15 položiek, konečné). Názvy na webe sú upravené („Strih pre malých gentlemanov“ vs.
  systém „gentlemenov“, „Pánsky strih – dĺžka vlasov nad 10 cm“ vs. „- …10cm“, „Pánsky strih a úprava brady“ vs.
  „…a Úprava brady“) – admin pri porovnaní so systémom (nástroj N12) musí názvy normalizovať; majiteľ pri úprave
  názvu dostane poznámku, že zákazník ho hľadá v systéme.
- Trvania (5–80 min) nemajú v dokumente zdroj („None min“) – do adminu idú s upozornením, do denníka s poznámkou.
- Recenzie: dve spomínajú barbera „Tony“, ktorý nie je v tíme (otázka 19) – admin to nerieši, ale pri odstránení
  recenzie zapíše dôvod do denníka.
- Fakty „8 rokov recepcia“, „v troch miestnostiach“, „Školenia na poschodí“ sú tvrdenia majiteľa (neoverené); po D6
  dostanú `data-required` – admin ich ukáže ako texty s poznámkou „neoverené, podľa majiteľa“ a nebráni úprave.
- Odkaz „Vernostná kartička“ a 404 dnes vedú na HEAD SPA 30 (D6a‑0) – mimo admin.
- Žiadna analytika a žiadne cookies – admin nemá záložku Štatistiky (rozdiel oproti HEAD SPA).
- Žiadne poukazy – bez záložky Poukazy (rozdiel oproti HEAD SPA); pribudne až po odpovedi na otázku 2.
