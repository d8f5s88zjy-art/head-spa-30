# Kontrola kódu a vzhľadu – kolo 1 (27. 10. 2026)

Kontrolované: strom `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny`
(vetva `barbershop-skvrny`, HEAD `c88d29a1`, dva commity nad `bdabff7`), odovzdávka
`/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/odovzdavka.md`.
Nič som v strome nemenil (jediný zásah: `git checkout -- barbershop-30/docs/screenshots/seo`, ktorým som vrátil tri PNG, ktoré
prepísal môj prvý, prerušený beh `en-test`; `git status --short` po ňom: 0 riadkov). Cesty nižšie sú relatívne
k `hs-skvrny/barbershop-30/`, pokiaľ nie je uvedené inak; `scratchpad/` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/`.

## Verdikt

**OK s výhradami (drobné).** Zmena robí presne to, čo zadanie žiada, nič si nevymýšľa, prekladá do všetkých ôsmich jazykov,
nerozbíja rozloženie na telefóne ani na počítači, nemení film.js a neprináša nové pády testov. Nálezy sú drobné (jeden stredný
k dokumentácii zadania o garancii – nie je chyba stavby, ale treba ho mať na očiach) a ani jeden nebráni odovzdaniu majiteľovi.

## 1. Rozsah zmeny (overené)

- `git diff --stat bdabff7..HEAD`: 18 súborov, +174/−53: `index.html`, `rezervacia.html`, `assets/style.css` (+17), 7× `assets/i18n/*.json`,
  `en/index.html`, `source/tools/en-test.mjs` (8 → 10 otázok), `README.md`, `docs/CHECKS.md`, `docs/CONTENT_SOURCES.md`, `docs/POSTUP.md`,
  `../asistent/znalosti/barbershop-otazky.json`, `assets/asistent-otazky.json`.
- **film.js nezmenený:** `git diff bdabff7..HEAD -- barbershop-30/assets/film.js | wc -c` → `0`.
- **Slovníky:** každý zo 7 jazykov 309 → 325 kľúčov, 27 pridaných, 11 odobraných (presne staré riadky barberov a starý úvod tímu),
  0 zmenených hodnôt, žiadny prázdny ani neprelozený preklad (`python3 -I`, porovnanie `git show bdabff7:…/i18n/*.json` s HEAD).
- **en/ je aktuálna:** `node source/tools/en-stranka.mjs --check` → „en/index.html je aktuálna“.
- **Tón a pravidlá:** v pridaných riadkoch `index.html` nič o konkurencii, zdraví, AI, žiadne vulgarity (grep nad `git diff … | grep '^+'` → 0);
  žiadne roky praxe, ocenenia ani špecializácie pri osobách; slovo „garancia“ na webe nie je (ostáva v OTAZKY otázka 25).

## 2. Fakty vs. zdroje (každá nová veta má oporu)

| nová veta | opora v `bdabff7` |
|---|---|
| „Striháme na Mostnej 30 od roku 2019.“ | `index.html:742` (karta Dôvera: „Na Mostnej 30 striháme od roku 2019.“), `docs/CONTENT_SOURCES.md:20` |
| „Hodnotenie 5,0 na Google“ | `index.html:193` („5,0 na Google · 945 recenzií“) – počet recenzií v pilieri správne vynechaný |
| „Konzultácia … strojčeka, britva pri brade, styling a kolínska“ | `index.html:247` (scéna Remeslo), `:498–510` (cenník „krok za krokom“) |
| „Pri dverách recepčná, v čakárni káva a minerálka zdarma.“ | `index.html:224` („Pri dverách ťa privíta recepčná…“), `:270` („Káva aj minerálka sú zdarma.“) – veta o „8 rokoch, ako jediný“ (nepotvrdená, OTAZKY 9) sa správne neprebrala |
| „0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“ | `index.html:787` a pôvodná otázka „Ako sa objednám?“ |
| „zmenu či zrušenie jej daj vedieť čo najskôr“ | pôvodná otázka „Čo ak nestihnem prísť?“ („Daj nám vedieť čo najskôr“); storno lehoty (OTAZKY 3, nepotvrdené) sa neuvádzajú |
| recepčná = termín a pohodlie, barber = výsledok | slová majiteľa z 27. 10. (zadanie) |
| „Tím barberov a barberiek“ | `index.html:293` („barberiek“), Dominika je `Barberka` (`:400`) |
| Pätička: HEAD SPA 30 → https://www.headspa30.sk/, Salón 30 → https://www.salon30.sk/, Barbershop 30 → `#uvod` | adresy a kódy 200 doložené v odovzdávke (tabuľka curl) a `docs/CONTENT_SOURCES.md`; Barbershop zatiaľ na úvod stránky (OTAZKY 29) |

## 3. Testy (môj beh, `scratchpad/barber/stavba/testy.sh`; PRED = export bdabff7 `scratchpad/barber/pred-strom`, PO = hs-skvrny; výpisy `scratchpad/barber/texty/testy-kontrola-1/{pred,po}/*.log`)

| test | PRED (bdabff7) | PO (c88d29a1) | výsledok |
|---|---|---|---|
| i18n-test | 55 OK, 0 FAIL (exit 0) | 55 OK, 0 FAIL (exit 0) | zhodné, **prechádza** |
| en-test | 16 OK, 0 FAIL (exit 0) | 16 OK, 0 FAIL (exit 0) | zhodné (očakáva 10 otázok, jediná zmena testu) |
| app-smoke | 108 OK, 1 FAIL (exit 1) | 108 OK, 1 FAIL (exit 1) | ten istý FAIL „[softvér desktop] bez posunu rozloženia (CLS 0.0283)“ s rovnakou hodnotou PRED aj PO (`diff` FAIL riadkov prázdny) – nie regresia |
| vychytavky-test | 27 OK, 0 FAIL | 27 OK, 0 FAIL | zhodné |
| tma-test | 0 OK, exit 1: `ImportError: cannot import name '_imaging' from 'PIL'` | rovnaká chyba | nevyhodnotiteľné v tomto prostredí (prostredie, nie web) |
| admin-test | 101 OK, 0 FAIL | 101 OK, 0 FAIL | zhodné |

Žiadny nový pád. Po behu `git status --short` v `hs-skvrny` aj v `pred-strom`: 0 riadkov.

## 4. Vzhľad – snímky a merania

Skript `scratchpad/barber/texty/kontrola-1.mjs` (Playwright, Chromium `/opt/pw-browsers`, server `python3 -I -m http.server 8810` nad `hs-skvrny`,
stránka `/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka`), snímky JPEG v `scratchpad/barber/texty/snimky-1/`
(`<jazyk>-<zariadenie>-{tim,otazky,otazky-zavrete,paticka}.jpg`; `enstranka-*` = stránka `en/`), výpis `…/snimky-1/vypis.txt`, čísla `…/vysledky.json`.
Doplnkové presné meranie `scratchpad/barber/texty/kontrola-1b.mjs` (PRED na porte 8811 vs. PO na 8810).

Otvoril som (Read) a prezrel: `sk-telefon-390-{tim,otazky-zavrete,otazky,paticka}`, `sk-pocitac-1440-{tim,otazky,paticka}`, `sk-pocitac-1920-{tim,paticka}`,
`sk-telefon-360-{tim,paticka}`, `uk-telefon-390-paticka`, `uk-pocitac-1440-tim`, `hu-telefon-390-tim`, `hu-pocitac-1440-otazky`, `en-telefon-390-otazky`,
`enstranka-telefon-390-paticka`.

| meranie | telefón 390×844 DPR 3 | telefón 360×780 | počítač 1440×900 | počítač 1920×1080 | en/ 390 | en/ 1440 |
|---|---|---|---|---|---|---|
| vodorovné pretečenie (`scrollWidth`/`innerWidth`) | 390/390 | 360/360 | 1440/1440 | 1920/1920 | 390/390 | 1440/1440 |
| pretečenie prvkov (piliere, riadky, otázky, prevádzky, pätička) | 0 | 0 | 0 | 0 | 0 | 0 |
| prekrytie (piliere×portréty, piliere×úvod, prevádzky×stĺpce, prevádzky×spodok, karty, položky) | žiadne | žiadne | žiadne | žiadne | žiadne | žiadne |
| medzera piliere→portréty / stĺpce→prevádzky / prevádzky→spodok (px) | 32 / 48 / 48 | – | 48 / 48 / 48 | – | 32 / 48 / 48 | 48 / 48 / 48 |
| chyby skriptu (`pageerror`) | 0 | 0 | 0 | 0 | 0 | 0 |
| CLS po načítaní a prejdení celej stránky (bez vstupu) | 0 | 0 | 0 (presné meranie 0,0001, zdroj `nav`, rovnako PRED 0,0002) | 0 | 0 | 0,0001 (`nav`; PRED 0,0005) |
| ciele < 44 px v tíme/otázkach/pätičke | 0 | 0 | 13 (pozri D3) | 13 | 0 | 13 |
| počet otázok | 10 | 10 | 10 | 10 | 10 | 10 |

Kontrast (WCAG, zložené pozadie `--ink`): pilier nadpis 15,2:1 (20 px), pilier text 10,0:1 (15 px), úvod tímu 10,0:1, riadok barbera 9,1:1,
otázka 15,2:1, odpoveď 10,0:1, odkaz prevádzky 16,1:1 (17 px), aktuálna prevádzka (`--lamp-2`) 7,2:1, text prevádzky 5,3:1 (15 px; `--paper-3`,
rovnako ako doterajšie nadpisy stĺpcov pätičky), nadpis „Naše prevádzky“ 5,3:1 (13 px, rovnaký štýl ako „Kontakt“/„Otváracie hodiny“). Všetko ≥ 4,5:1.

Prvý skript hlásil „prekrytie“ susedných `.faq-item` (napr. `[8]×[9]`); bolo to zaokrúhlenie celých px v mojom meraní – presné meranie
(`kontrola-1b.mjs`, rozdiel `bottom − top` susedov s toleranciou 0,01 px) ukázalo **žiadne** prekrytie otázok v sk ani en, 390 aj 1440, PRED aj PO.
Hodnota „CLS po otázkach 0,62“ v `vypis.txt` vznikla tým, že skript otvoril všetkých 10 otázok programovo (`details.open = true`, bez vstupu
používateľa), takže sa posun zarátal; pri klikaní na `summary` (prvé dve nové otázky som klikal) je posun vylúčený `hadRecentInput` – nie je to chyba stránky.

Čo vidno na snímkach: na telefóne sú tri piliere pod úvodom tímu s ľavou oranžovou linkou, s odstupom 32 px od portrétov, riadky barberov
kurzívou na 2–3 riadky bez pretečenia; na počítači piliere v troch stĺpcoch medzi úvodom a mriežkou tímu (48 px odstup); FAQ zavreté: 10 položiek
s „+“, nové na 2. a 9. mieste; FAQ otvorené: odpovede v `--paper-2`, zalomenie čisté aj v hu (dlhé vety); pätička: blok „Naše prevádzky“ pod
stĺpcami, nad spodným riadkom, oddelený linkami, tri odkazy v riadku (počítač) alebo pod sebou (telefón), aktuálny „Barbershop 30“ oranžový.
V ukrajinčine a maďarčine sú všetky nové texty preložené (piliere, 10 otázok, prevádzky, riadky barberov, nadpis „Наші заклади“ / „Üzleteink“).

## 5. Prepínanie jazykov sk → en → uk → hu (cez prepínač `.lang-btn` → `[data-lang-pick]`, 390 aj 1440)

- `html lang`: sk → `en` → `uk-UA` → `hu-HU`; po každom prepnutí sú piliere, obe nové otázky, nadpis a riadky prevádzok aj riadky barberov
  v cieľovom jazyku (výpis `vypis.txt`, napr. uk: „Телефонувати барберу чи на рецепцію?“, hu: „A barbert hívjam vagy a recepciót?“).
- Pretečenie 0, prekrytie 0 (presné) vo všetkých troch jazykoch na oboch zariadeniach; ciele na telefóne všetky ≥ 44 px.
- Stránka `en/`: lang `en`, 10 otázok („Should I call the barber or the reception?“, „What happens when I arrive?“), „Our places“, žiadne slovenské
  slová v tíme/otázkach/pätičke okrem vlastných mien (Mostná, Salón, IČO).

## 6. Nálezy

### Stredné

**S1. Garancia – zadanie majiteľa hovorí „garancia“, web ju nemá; návrhy G1–G3 sú len v OTAZKY.** Stavba postupovala podľa pravidla
(bez potvrdenia nič na web) správne: `grep -c garanc index.html` → 0, pilier „Pohodlie“ namiesto „Garancia“. Treba však, aby odovzdanie majiteľovi
výslovne obsahovalo tri znenia NA POTVRDENIE (sú v `dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md:122–126`, G1–G3) a aby po potvrdení
pribudla aj otázka „Čo ak nebudem spokojný?“ do 8 jazykov. Odovzdávka to uvádza (časť 2 bod 1 a časť 5); nie je to chyba stavby, len
najdôležitejšia otvorená vec zadania. Návrh: v správe majiteľovi dať garanciu ako prvú otázku.

### Drobné

**D1. Plávajúca ikona asistenta zakrýva nadpis „Naše prevádzky“ na telefóne, keď je pätička navrchu okna.** Snímky `sk-telefon-390-paticka.jpg`,
`uk-telefon-390-paticka.jpg`, `enstranka-telefon-390-paticka.jpg`: ikona „30 AI“ (ukážkový režim `?asistent=ukazka`, `position: fixed` vľavo dole)
sedí presne na slove „NAŠE“/„НАШІ“/„OUR P“. Ide o doterajšiu pevnú ikonu, ktorá zakrýva čokoľvek, čo sa pod ňou práve nachádza (na snímke 360
je nad linkou, na 1440 nad podpisom autora) – nie je to chyba nového bloku a po ďalšom posune je nadpis voľný. Návrh: nič nemeniť v tejto dávke;
ak by majiteľ chcel, ikona by si mohla pri dosiahnutí pätičky odskočiť (samostatná úloha mimo tohto zadania).

**D2. Nadpis bloku je `<h2 class="footer-title">` ako ostatné tri stĺpce pätičky (`index.html:865,873,881,892`)** – konzistentné s existujúcou
pätičkou, ale v osnove stránky je pätička na úrovni h2, kým „Časté otázky“ sú `<h3 class="h2">` (`:834`). Doterajší stav, nový blok ho len kopíruje.
Bez zásahu.

**D3. Ciele < 44 px na počítači:** 10× `.team-cta` „Objednať sa →“ (109×39 px) a 3 odkazy prevádzok (104–118×27 px). Na počítači (myš) je to v poriadku
(≥ 24 px podľa WCAG 2.5.8); presah ťukacej plochy je v `style.css:1628` len pre `max-width: 720px`, kde som nameral 0 cieľov pod 44 px (390 aj 360,
všetky jazyky). `team-cta` 39 px je stav pred zmenou. Bez zásahu.

**D4. `vysledky.json`/`vypis.txt` z prvého skriptu obsahujú dve falošné hlásenia** (prekrytie otázok zo zaokrúhlenia a CLS z programového otvárania),
vysvetlené v časti 4; presné čísla sú z `kontrola-1b.mjs`. Uvádzam, aby ich nikto nečítal ako nálezy.

**D5. Odovzdávka hovorí o jednom nestabilnom páde `app-smoke` „[softvér desktop] bez posunu rozloženia (CLS 0.0283)“** – potvrdené v mojom behu PO aj
PRED s rovnakou hodnotou (tabuľka v časti 3), mimo zmenených častí (zdroj = záložný úvod bez filmu). Nie je to regresia tejto zmeny.

**D6. tma-test sa v tomto prostredí nedá vyhodnotiť** (Pillow bez `_imaging`, PRED aj PO rovnaká chyba). Na iný beh ho treba spustiť tam, kde Pillow
funguje; nové prvky používajú len existujúce tokeny (`--paper`, `--paper-2`, `--paper-3`, `--lamp`, `--line`), svetlá téma v `style.css` neexistuje
(`grep prefers-color-scheme` → 0), takže riziko pre „tmu“ je malé.

**D7. Veľkosť `index.html` po gzip -9: 15 758 B (PRED 14 833 B), nad hranicou 14 600 B z plánu D6** – potvrdené (`gzip -9 -c index.html | wc -c`);
hranica bola prekročená už pred zmenou, nárast +925 B sú nové texty (piliere, dve odpovede, pätička). Odovzdávka to priznáva (časť 6). Ak má hranica
platiť, riešiť samostatne. Commity: 2, po slovensky, bez podpisových riadkov (`git log … | grep -ciE "co-authored|claude-session"` → 0);
`git status` čistý v `hs-skvrny` aj `dennik` (0 riadkov); `node source/tools/otazky.mjs` → „všetko OK: 251 otázok, 11 tém“.

## 7. Záver

Zmena je postavená čisto a doložiteľne; na web nešiel žiadny nepotvrdený fakt, všetky nové texty majú oporu, 8 jazykov je kompletných,
`en/` je vygenerovaná zo zdroja, testy nepadajú nad rámec stavu pred zmenou, CLS po načítaní 0, žiadne pretečenie ani prekrytie na 4 šírkach a 4 jazykoch.
Odporúčam **prijať** a majiteľovi odovzdať s otázkami 25–34 (garancia ako prvá).
