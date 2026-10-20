---
name: obsah-a-texty
description: Pravdivý obsah a texty webu malého podniku (salón, barbershop, head spa, obchod) po slovensky. Fakty len zo zdrojov so stupňami dôvery, opravy od majiteľa s dátumom, hlas (tykanie, krátke riadky, hook), slovenská typografia (pevné medzery, bez em dash), preklady kľúčované slovenským textom (i18n, viac jazykov, hreflang), štruktúrované dáta schema.org (JSON-LD, Offer, FAQPage) v súlade s textom, popisy ľudí bez vymyslených faktov, súhlasy s fotkami. Použi pri písaní a úprave textov, copywritingu, prekladoch, SEO a kontrole pravdivosti.
---

# Obsah a texty webu podniku

Postup, podľa ktorého vznikli texty webov HEAD SPA 30 (koreň repozitára), BARBERSHOP 30 (`barbershop-30/`)
a Stavebniny Richtárik (`stavebniny-richtarik/`). Zásada: **každý údaj na webe má zapísaný zdroj; čo v zdroji
nie je, na webe nie je.** Pekná veta nikdy nevyváži vymyslený fakt.

## Kedy použiť

- Píšeš alebo meníš text webu: nadpis, úvod, popis služby, otázky, tlačidlá, meta popis, alt.
- Majiteľ poslal opravu („káva je vzadu, nie pri vstupe“, „taký rituál nemáme“).
- Pridávaš text na viacjazyčný web alebo kontroluješ preklady.
- Dopĺňaš štruktúrované dáta (JSON-LD) alebo meníš ceny, hodiny, kontakt.
- Píšeš popisy ľudí z tímu, vyberáš fotky s ľuďmi.

Na ceny a služby z rezervačného systému Booqme je samostatný skill `booqme-rezervacie`.

## 1. Zdroj faktov a stupne dôvery

Pred prvou vetou založ súbor zdrojov. Vzor je `barbershop-30/docs/CONTENT_SOURCES.md`: každý údaj má
hodnotu, zdroj, dátum získania a stupeň overenia. Stupne odtiaľ:

| Stupeň | Čo to je | Na web |
| --- | --- | --- |
| overené-oficiálne | web podniku alebo jeho rezervačný systém | áno |
| tretia strana | katalógy, recenzné weby | len s odkazom na zdroj, bez čísla v schéme |
| slabé | jediná neoficiálna zmienka | nie, kým to majiteľ nepotvrdí |
| neoverené | tvrdenie majiteľa bez dokladu alebo odhad | až po potvrdení |

Postup:

1. Stiahni oficiálne zdroje a zapíš dátum (napr. služby a ceny z JSON rezervačného systému, stav 2026-10-09).
2. Každý riadok tabuľky: `údaj | hodnota | poznámka` (poznámka hovorí, ako sa údaj na webe použije).
3. Rozpor zapíš, nerieš potichu. Príklad: web podniku píše „od roku 2019“, majiteľ hovorí o recepcii „8 rokov“;
   zapísané ako nesúlad, na webe ostalo „od roku 2019“.
4. Neoverené veci daj do zoznamu „Čo ostáva neoverené“ a na web ich nepúšťaj. Ak pre ne v kóde
   pripravíš miesto, označ ho a skry: `<div class="results-placeholder" hidden data-required="results">`
   (`barbershop-30/index.html`; pravidlo v `barbershop-30/docs/ART_DIRECTION.md`, časť 9).
5. Hodnotenia z tretej strany len ako odkaz na profil („Hodnotenie na Google“), bez čísla hviezdičiek
   v texte aj v schéme, bez vymyslených citácií.
6. Pravidlá, ktoré dal majiteľ, zapíš do `CLAUDE.md` projektu s poznámkou, že sa nemenia
   (v tomto repozitári časť „Pravidlá obsahu (majiteľ ich dal, nemeň ich)“).

Keď web vzniká z pôvodnej stránky (Stavebniny Richtárik), zdrojom je jej stiahnutý obsah
(`stavebniny-richtarik/zdroj/pages.json`, 83 stránok) a generátor `build.py`. Aj predajné vety
(`HOOKY` v `build.py`) a popisky značiek (`ZNACKY` v `popisy.py`, 49 položiek kategória a značka; README
uvádza 48) sú napísané len z faktov pôvodného webu.

Šablóna súboru zdrojov a príklady riadkov: `references/zdroje-a-opravy.md`.

## 2. Opravy od majiteľa

1. Zapíš opravu do zdroja **s dátumom a pôvodom**. Príklad z `CONTENT_SOURCES.md`:
   `| kde sa podáva káva | vzadu, kde ľudia čakajú (...), nie pri recepcii | majiteľ 2026-10-11; na webe v karte Čakáreň |`
2. Nájdi všetky výskyty starého tvrdenia: text v HTML, preklady, JSON-LD, alt, meta popis, dokumenty
   (`grep -rn` cez `index.html`, `assets/i18n/`, `docs/`).
3. Oprav všade naraz a v commite povedz, čo a prečo.
4. Ak oprava mení pravidlo (nie len jednu vetu), dopíš ho do `CLAUDE.md`, aby sa chyba nevrátila.
   Príklad: salón neponúka strieborný ani zlatý Head Spa rituál; po odstránení (commit 1a3b955,
   2026-09-22) je to výslovne v `CLAUDE.md`.

## 3. Čo sa nesmie

- **Vymýšľať**: služby, ceny, trvania, mená, roky praxe, ocenenia, recenzie, výsledky, špecializácie.
  Čo nevieš, vynechaj alebo sa spýtaj.
- **Zmienka o AI** na webe, v kóde, v commitoch ani v názvoch vetiev; ani o 3D modeli či nástrojoch
  (BARBERSHOP 30 hovorí len „prehliadka podniku“, `MASTER_BRIEF.md`).
- **Pomlčka em dash** (U+2014). Rozsahy píš slovom: „od 40 do 120 minút, ceny 45 až 135 €“ (meta popis HEAD SPA 30).
- **Mená a značky proti pravidlám podniku.** V tomto repozitári: HEAD SPA 30 je samostatná časť s vlastným
  tímom v priestoroch Salónu 30, nie jeho značka; nepísať „Barber shop 30“ ani „salón 30“ ako názov webu,
  služby Salónu 30 na web nepatria. Formulácia, ktorá to dodržiava, je v otázkach `index.html`:
  „HEAD SPA 30 je samostatná časť s vlastným tímom. Sídlime v priestoroch Salónu 30 na Mostnej 30 v Nitre.“
  Dve značky v jednej budove (Barbershop 30 a Salón 30) nespájaj, kým to majiteľ nepotvrdí
  (`CONTENT_SOURCES.md`, „Vzťah so Salónom 30“ je neoverený).
- **Superlatívy bez dôkazu** („najlepší v Nitre“, „číslo jeden“, „100 %“) a marketingové frázy.
- **Ľudia na fotkách bez súhlasu** (časť 9).

## 4. Hlas

- **Tykanie všade**, aj v prekladoch (du, ty, te, ти, you). Pri službách pre dvoch množné číslo
  („Doprajte si 65 minút spoločného oddychu“). Výnimka: poukážky podľa vzoru salónu vykajú ako ten
  vzor (pečať „PRE VÁS“, `docs/poukazky/README.md`).
- **Krátko**: myšlienka na jeden až dva riadky. Titulná karta BARBERSHOP 30 = nadpisok (miesto),
  veľký nadpis, jeden riadok (`MASTER_BRIEF.md`, časť 3).
- **Hook**: prvá veta je jasný sľub, potom obraz miesta, potom čo dostaneš a ako rezervovať. Príklady z webov:

| Nadpisok | Nadpis (sľub, otázka) | Riadok (overený fakt) |
| --- | --- | --- |
| Barbershop 30 · Nitra | Tvoj strih. Tvoje miesto. | Za dverami na Mostnej 30 sa strihá od roku 2019. |
| Čakáreň | Vzadu ťa čaká káva. | Kreslá, retro pumpa a farebný buldog. Káva aj minerálka sú zdarma. |
| Ľudia | Komu zveríš hlavu? | Desať ľudí, jeden kalendár. Svojho človeka si vyberieš v rezervácii. |
| Head Spa rituály v Nitre | Vypni hlavu. | Hlboký relax a regenerácia vlasov v jednom rituáli. Začína teplou vodou a končí tichom. |

Každý fakt v riadkoch BARBERSHOP 30 (rok 2019, káva a minerálka zdarma, desať ľudí v tíme) je v `CONTENT_SOURCES.md`.

- **Bez opakovania**: ten istý zoznam služieb je na stránke raz. Z HEAD SPA 30 odišli sekcie, ktoré
  len opakovali iné miesto, a tretí a štvrtý zoznam tých istých rituálov (README, „Bez opakovania“).
- **Poradie sekcií je príbeh návštevy** (README, „Nadväznosť sekcií“). Dnes v `index.html`: úvod, Ako to
  prebieha, Rituály a ceny, Poukazy, Tím, Galéria, Otázky, Kontakt; bočná lišta, mobilné menu aj pätička
  v rovnakom poradí (horná lišta na počítači Tím vynecháva).
- **Tlačidlá** hovoria, čo sa stane („Rezervovať online“, „Kúpiť poukaz“), vedú priamo do cieľa,
  telefón je druhá cesta pre toho, kto váha.

Viac príkladov a vzorce viet: `references/hlas-a-hook.md`.

## 5. Slovenská typografia

Pevná medzera (U+00A0, v HTML `&nbsp;`) za jednopísmenovými slovami a medzi číslom a jednotkou,
značka sa nelomí. Referenčná implementácia je `fixNb` v `admin/index.html` (admin ňou upraví každý text, ktorý zapíše na web):

```js
for (let i = 0; i < 2; i++) t = t.replace(/(^|[\s(„"])([aiouksvzAIOUKSVZ]) /g, `$1$2${NB}`);
t = t.replace(/(\d) (?=(?:min|minút|minúty|€|dní|rokov|rituálov|rituály|rituál|osoby|osôb|hod|%)(?![\wÀ-ž]))/g, `$1${NB}`);
t = t.replace(/Head Spa/g, `Head${NB}Spa`).replace(/HEAD SPA/g, `HEAD${NB}SPA`).replace(/(\d{4}) (\d{3}) (\d{3})/g, `$1${NB}$2${NB}$3`);
```

Cyklus beží dvakrát, aby sa chytili aj dve jednopísmenové slová za sebou („a v“). Prekladom pevné
medzery nevadia: `assets/i18n.js` pri porovnaní všetky medzery normalizuje (`norm`), kľúč ostáva rovnaký.

Kontrola (z koreňa projektu): `node toolbox/skills-z-praxe/obsah-a-texty/scripts/typografia-kontrola.mjs index.html assets/i18n/en.json`
vypíše em dash (chyba), en dash (upozornenie) a miesta bez pevnej medzery. V tomto repozitári našla
2026-10-11 23 miest bez pevnej medzery a en dash v bloku otváracích hodín kontaktu (`Po`, U+2013, `Pi`).

Ďalej: úvodzovky „takto“, desatinná čiarka v texte (35,50 €), v dátach bodka (`data-price="35.50"`).

## 6. Viac jazykov: kľúč je slovenský text

Slovenčina je priamo v `index.html`; `assets/i18n/<jazyk>.json` je objekt `{"slovenský text": "preklad"}`
pre cs, pl, hu, de, uk, en. `assets/i18n.js` po načítaní prejde textové uzly a atribúty
`placeholder`, `aria-label`, `alt`, `title`, meta popisy a `<title>` a vymení ich. HTML nepotrebuje
žiadne značky navyše, presun sekcií preklady nerozbije, text bez kľúča ostane po slovensky.

Pridanie textu:

1. Napíš vetu do `index.html` (so slovenskou sadzbou).
2. Do **všetkých šiestich** súborov pridaj kľúč presne tak, ako je text uzla po zlúčení medzier
   (bez pevných medzier v kľúči, s nimi môže byť hodnota).
3. Ak veta obsahuje odkaz alebo `<em>`, každý kúsok je samostatný uzol a samostatný kľúč
   („Prvýkrát u nás? Začni rituálom“ + „Head Spa Classic“).
4. Text, ktorý skladá skript, nemá kľúč v JSON: buď `HS30_LANG.t('kľúč')`, alebo vlastný slovník
   v skripte (`TODAY_WORDS` v `assets/app.js`).
5. Element, ktorý sa prekladať nemá, dostane `data-no-i18n`.
6. Spusti `node toolbox/skills-z-praxe/obsah-a-texty/scripts/i18n-kontrola.mjs index.html assets/i18n`
   (texty bez prekladu v každom jazyku; dnes 0) a po zmene `assets/i18n.js` aj `node tools/build.mjs`.

Názvy služieb, ktoré podnik vedie po anglicky (Head Spa Classic, Gentlemen Harmony Ritual), sa
neprekladajú; slovenské názvy (Spoločný Head Spa rituál) preklad majú. V hlavičke sú `hreflang` na
všetkých sedem jazykov plus `x-default` (`?lang=xx`). Podrobnosti a pasce: `references/preklady-i18n.md`.

## 7. Štruktúrované dáta v súlade s textom

JSON-LD v `<head>` hovorí vyhľadávačom to isté, čo text, nič navyše. HEAD SPA 30 má jeden `@graph`:

- podnik `["DaySpa","HealthAndBeautyBusiness"]` s `@id`, adresou, `geo`, telefónom, `openingHoursSpecification`,
  `priceRange` („45 € až 135 €“), `sameAs` (Instagram), `potentialAction` typu `ReserveAction`
  a `hasOfferCatalog` so 17 ponukami;
- `WebSite` s `inLanguage` a `publisher`;
- `FAQPage` so 17 otázkami, rovnakými ako na stránke.

Ponuka odkazuje na kartu služby cez `url` s `#id`, takže sa dá strojovo porovnať:

```json
{"@type":"Offer","itemOffered":{"@type":"Service","name":"Head Spa Classic","serviceType":"Head Spa rituály",
 "provider":{"@id":"https://d8f5s88zjy-art.github.io/head-spa-30/#salon"},"duration":"PT40M"},
 "price":"50","priceCurrency":"EUR","url":"https://d8f5s88zjy-art.github.io/head-spa-30/#klasicky-head-spa",
 "availability":"https://schema.org/InStock"}
```

Pravidlá: hodnotenie bez čísla, kým nie je overené (BARBERSHOP 30 nemá `aggregateRating`); `foundingDate`
len overený rok; otváracie hodiny na všetkých miestach naraz (text, schéma, blok `#nastavenia` čítaný v `assets/app.js`).
Kontrola: `python3 -I toolbox/skills-z-praxe/obsah-a-texty/scripts/ld-zhoda.py index.html` porovná ponuky s kartami, `priceRange` s cenami
a FAQ s otázkami na stránke. Viac: `references/schema-org.md`.

## 8. Popisy ľudí bez vymyslených faktov

O človeku z tímu často vieme len meno a rolu. Popis je potom **dojem a prístup, nie tvrdenie**:
žiadne roky praxe, špecializácie, ocenenia, záľuby. Pochvala remesla, ktorú chce majiteľ, je v poriadku.
Ukážky z `barbershop-30/index.html` (`.team-bio`):

- „Pozorne ťa vypočuje. Potom už hovoria len nožnice.“
- „Zavrieš oči pri horúcom uteráku a otvoríš ich spokojný.“
- „Rozhovor alebo ticho, ako ti je milšie. Strih dotiahne tak či tak.“

Postup (workflow textárov): traja textári s rôznym uhlom (remeslo, hosť, charakter), dvaja porotcovia
(pravidlá a fakty; zákazník), syntéza, korektor. Pravidlá briefu: najviac 95 znakov, žiadne pomlčky,
výkričníky ani úvodzovky, každý popis začína inak, rod a tvary podľa človeka. Mená a roly presne
podľa webu podniku. Celý brief a stavba: `references/popisy-ludi.md`.

## 9. Fotky, ľudia a súhlasy

- Inventár médií so stĺpcom „ľudia“ (`barbershop-30/docs/MEDIA_SELECTION.md`) a zoznam nepoužitých
  fotiek s dôvodom (chodec na ulici, odraz v zrkadle, cudzie tváre na plagátoch).
- Zamestnanci len so súhlasom; klienti nerozpoznateľní (zozadu, z profilu v diaľke) alebo so súhlasom
  (`MASTER_BRIEF.md`, `CONTENT_SOURCES.md`, časť Videá); deti len so súhlasom rodičov (`docs/fotenie.md`).
  Súhlas sa potvrdzuje u majiteľa pred ostrým spustením.
- Cudzie fotky (Pexels) len ako dočasné a s evidenciou v `FOTKY.md`, kým podnik nenafotí vlastné
  (`docs/poukazky/dl/FOTKY.md`, `stavebniny-richtarik/img/FOTKY.md`).
- Alt text po slovensky opisuje skutočné miesto („Barberské kreslo s čiernou prešívanou kožou...“).

## Pasce (lekcie)

- **README zastaráva rýchlejšie ako kód.** V tomto repozitári README ešte opisuje formulár rezervácie,
  sekciu Salón 30 s kaderníckymi službami, riadky `p.next` a ceny „45 až 149 €“; v `index.html` nič
  z toho nie je. Pred písaním čítaj kód, README len ako históriu (`references/zdroje-a-opravy.md`).
- **Číslo napísané slovom sa zabúda.** Pri zmene ponuky prejdi aj „Sedemnásť rituálov“, rozpätia
  v meta popise, v otázkach, v `priceRange` a v prekladoch (README, „Ponuka“). Admin rozpätia
  „od X do Y minút, ceny A až B €“ prepočíta sám; pri ručnej úprave HTML ich musíš prepísať ty.
- **Pevná medzera sa zle hľadá.** V `index.html` je raz ako znak U+00A0, raz ako `&nbsp;`, takže
  `grep '67 €'` cenu nenájde. Hľadaj `LC_ALL=C.UTF-8 grep -nP '67(\x{a0}| |&nbsp;)€'`.
- **Skladanie viet z polí** zdvojí bodku, keď pole už bodkou končí: „Žiadny zhon.. Platí 365 dní“
  (`docs/booqme-opravy.md`, popisy poukazov). Pri spájaní textov odstráň koncovú bodku.
- **Preklad po kúskoch.** Veta rozdelená odkazom sa prekladá po častiach; slovosled v cudzom jazyku
  potom nemusí sedieť. Ak záleží na vete, daj odkaz na koniec alebo celú vetu do odkazu.
- **Nadpisy delené na slová** (`data-split`) majú každé slovo ako vlastný kľúč (`Vypni`, `hlavu.`).
- **Preklepy zo zdroja** sa na webe opravia (BARBERSHOP 30: v systéme „Depilácia uši“, na webe „uší“;
  HEAD SPA 30: v Booqme „Fúkana - krátke vlasy“, na webe „Fúkaná na krátke vlasy“), ale kľúč na strojové
  párovanie drží presný názov zo systému (`data-booqme="Fúkana - krátke vlasy"`, skill `booqme-rezervacie`).
- **Kontrolný beh nie je odhad.** Popisy ľudí prešli korektorom, ktorý počítal znaky; rovnako sa
  overujú preklady a sadzba skriptom, nie očami.

## V tomto repozitári

| Čo | Kde |
| --- | --- |
| pravidlá obsahu od majiteľa | `CLAUDE.md` |
| služby, ceny, obsah rituálov HEAD SPA 30 | `docs/booqme-sluzby.csv`, poukazy `docs/booqme-poukazy.csv` |
| zdroje BARBERSHOP 30 so stupňami a opravami | `barbershop-30/docs/CONTENT_SOURCES.md` |
| brief, výtvarný smer, výber médií | `barbershop-30/docs/MASTER_BRIEF.md`, `ART_DIRECTION.md`, `MEDIA_SELECTION.md` |
| preklady | `assets/i18n.js`, `assets/i18n/*.json`, `assets/i18n/README.txt` |
| pevné medzery pri zápise textu | `admin/index.html`, funkcia `fixNb` |
| zosúladenie JSON-LD a rozpätí v admine | `admin/index.html` (časti „dáta pre Google“, „rozpätia“, „otázky pre Google“) |
| popisy barberov | `barbershop-30/index.html` (`.team-bio`), workflow v `references/popisy-ludi.md` |
| web z pôvodnej stránky | `stavebniny-richtarik/README.md`, `build.py` (`HOOKY`), `popisy.py` |
| tlačová verzia cenníka | `@media print` v `assets/style.css` (README, „Tlač“) |

Skripty skillu (spúšťaj z koreňa projektu, Playwright s Chromium je v `/opt/pw-browsers`):

```
node toolbox/skills-z-praxe/obsah-a-texty/scripts/i18n-kontrola.mjs index.html assets/i18n
node toolbox/skills-z-praxe/obsah-a-texty/scripts/typografia-kontrola.mjs index.html assets/i18n/en.json
python3 -I toolbox/skills-z-praxe/obsah-a-texty/scripts/ld-zhoda.py index.html
```

## Kontrolný zoznam

- [ ] Každý nový údaj je v súbore zdrojov so stupňom a dátumom; neoverené nie je na webe.
- [ ] Oprava od majiteľa je zapísaná s dátumom a opravená všade (text, preklady, JSON-LD, alt, meta).
- [ ] Žiadna zmienka o AI, žiadny em dash, žiadny superlatív bez dôkazu, mená a značky podľa `CLAUDE.md`.
- [ ] Tykanie, myšlienka na jeden až dva riadky, nadpis s jasným sľubom, fakt v riadku pod ním.
- [ ] Pevné medzery doplnené (`typografia-kontrola.mjs` bez nových nálezov).
- [ ] Kľúč vo všetkých šiestich jazykoch (`i18n-kontrola.mjs`: 0 textov bez prekladu).
- [ ] JSON-LD sedí s textom (`ld-zhoda.py`), hodiny a kontakt rovnaké na všetkých miestach.
- [ ] Popisy ľudí bez faktov o osobe, mená a roly presne podľa podniku.
- [ ] Fotky s ľuďmi so súhlasom, cudzie fotky v `FOTKY.md`, alt po slovensky.
- [ ] Po zmene skriptu `node tools/build.mjs`, potom nasadenie podľa `CLAUDE.md`.
