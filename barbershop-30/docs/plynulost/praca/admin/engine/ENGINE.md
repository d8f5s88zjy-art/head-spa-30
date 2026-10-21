# ENGINE: jadro adminu HEAD SPA 30 a architektúra ľahkého adminu pre Barbershop 30

Zostavil staff frontend inžinier, 20. 10. 2026. Vstupy: celý `hs-tool/admin/index.html` (1 556 riadkov, 107 195 B),
`hs-tool/README.md` časť Admin, `hs-tool/CLAUDE.md`, web `hs-tool/barbershop-30/` (index.html, app.js, i18n.js,
slovníky, docs/CONTRACT.md, docs/ART_DIRECTION.md, docs/CONTENT_SOURCES.md), `barber/PLAN.md`, `barber/PLAN-D6-D7.md`,
`admin-audit/` a kapitoly skillu C019, C021, C022, C026, C028, C030, C057, C059, C074, C077, C081.
Repozitár som nemenil. Všetky výstupy sú v `barber/admin/engine/`:

| súbor | čo je |
|---|---|
| `meraj.mjs` | rozdelí admin na CSS, HTML záložiek a JS po častiach a funkciách (bajty aj gzip) |
| `podiel.mjs` | podiel jadra (prenositeľný kód) a kódu špecifického pre HEAD SPA |
| `mock-test.mjs` | Playwright s podvrhnutým `api.github.com`: prihlásenie, záložky, uloženie, konflikt, 422, 401, sieť preč |
| `mock-perf.mjs` | náklady hlavného vlákna pri CPU 4× (prvý obraz, prihlásenie, záložky, písanie) |
| `snimky/` | 15 snímok prihláseného adminu (telefón 390 × 844 a počítač 1 440 × 900) |

Spustenie testov: `cd hs-tool && python3 -m http.server 8940`, potom `node barber/admin/engine/mock-test.mjs`
(Playwright cez `createRequire('/opt/node22/lib/node_modules/')`, nič sa neinštaluje).

---

## 0. Záver v skratke

1. **Jadro adminu HEAD SPA je dobré a overené, prevziať ho.** Prihlásenie kľúčom, `gh()`, čítanie súborov podľa
   sha vetvy, commit cez bloby → strom → commit → posun vetvy s `force:false`, detekcia konfliktu, prenos
   neuložených zmien na novú verziu a automatický druhý pokus, lišta so zoznamom zmien, registrácia polí
   (`reg/bind/mark/changed`), presun kľúčov prekladov (`setKey/i18nText`), výrez fotky a kódovanie v prehliadači.
   Podvrhnutý GitHub potvrdil: zmena ceny + oznam = 1 blob, strom `["index.html"]`, posun vetvy `{sha, force:false}`;
   konflikt sha → nové načítanie, prenos zmien, uložené na druhý pokus bez zásahu majiteľa; 422 pri posune →
   zrozumiteľná správa; 401 → kľúč sa zmaže; sieť preč → kľúč aj rozpísané polia ostanú.
2. **Neprevziať celok.** Z 83,6 kB JS je 45,5 kB (54 %) kód špecifický pre web HEAD SPA (`build()` má sám
   17,8 kB: regexy na `<article data-price>`, `team-grid`, `data-siet`, FAQ pre Google, firma na pravne.html,
   výmena telefónu v 5 súboroch). Jadro je 24,2 kB (29 %), fotka 4,6 kB (6 %), skener textov 8,3 kB (10 %).
3. **Najväčšie slabiny:** (a) kľúč v `localStorage` na origine `d8f5s88zjy-art.github.io`, ktorý zdieľajú všetky
   weby účtu (HEAD SPA, Barbershop, Zentury, Visionary Living, stavebniny), takže ktorýkoľvek skript na ktoromkoľvek
   z nich kľúč prečíta; (b) žiadna CSP; (c) štart sťahuje 11 súborov, 945 kB textu (1,26 MB v base64) a potom
   jedna dlhá úloha 1,19 s pri CPU 4×, prihlásenie 5,9 s; záložka Texty 546 ms (grow na 209 textarea), každý
   znak písania 22 až 49 ms; (d) 9 záložiek na telefóne bez náznaku, že rad pokračuje; (e) po uložení admin
   netuší, kedy je zmena naživo.
4. **Architektúra pre Barbershop: tri súbory** `barbershop-30/admin/index.html` + `admin.css` + `admin.js`,
   rozpočet 56 kB zdroj / 19 kB gzip (cieľ ≤ 60 / ≤ 20), písma z webu (`../assets/fonts/`, 0 B navyše),
   CSP cez `<meta>` so `script-src 'self'` (vďaka externému JS), kľúč v `sessionStorage`.
5. **Jadro kopírovať, nie zdieľať súbor.** Dôvody v časti 6.2: HEAD SPA admin majiteľ používa a nemá testy;
   web Barbershop pôjde na vlastnú doménu (D6a, `nasad-barbershop30.sh`), kde spoločný súbor z koreňa nebude;
   odlišný obsah (7 jazykov so srbčinou, iné súbory). Jadro napísať ako čistý modul s adaptérom, aby sa dalo
   neskôr (samostatný, majiteľom schválený krok) vrátiť aj do adminu HEAD SPA.
6. **Testovať bez GitHubu** opraveným podvrhom (časť 7): audítorský `prihlaseny.mjs` sa nikdy neprihlásil
   (vracal `{}` na `GET /repos/o/r`, chýbalo `permissions.push`, kľúč uložil ako JSON), preto sú všetky snímky
   v `admin-audit/snimky/` len prihlasovacia obrazovka s chybou „Kľúč má len právo čítať“.
7. **Web Barbershop potrebuje tri malé háčiky od tímu D1–D7**, inak admin stojí na regexoch v 5 miestach:
   blok `<script type="application/json" id="nastavenia">` (hodiny, oznam), `app.js`/`hodiny.js` číta hodiny
   z neho, a slot oznamu. Do schválenia ide admin bez záložky Hodiny a Oznam, alebo ich zapisuje do dnešných
   miest (3× text hodín v HTML, 4 kľúče × 7 slovníkov, JSON-LD, konštanta `HOURS` v app.js).

---

## 1. Ako admin HEAD SPA funguje (tok dát, overený kódom a podvrhom)

```
prihlásenie  token z poľa alebo úložiska → gh('') (GET /repos/o/r) → permissions.push? → uloží kľúč
načítanie    GET /git/ref/heads/main → sha
             11× GET /contents/<p>?ref=sha (base64; pri >1 MB cez /git/blobs/<sha>)
             base = {sha, raw, i18n, tim}  →  model = parseAll(base)  →  prepare(): entries (Map) → render()
polia        reg(key,{orig,f,tab,item,what,trs}) → bind(el) → input: cur, touched, mark(), refresh()
lišta        refresh(): collect() (zmeny podľa item) + validate() → „N zmien“, zoznam s preskokom, čísla na záložkách
uloženie     save() → build() = {files:{path:{text|b64}|null}, notes} → commit():
               GET ref (sha == base.sha?) → GET /git/commits/sha (tree)
               POST /git/blobs (každý súbor) → POST /git/trees {base_tree, tree[]} (null sha = zmazanie)
               POST /git/commits {parents:[base.sha]} → PATCH /git/refs/heads/main {sha, force:false}
             → load() znova (nový sha) → „Uložené. Na webe to bude o minútu.“
konflikt     stale (ref ≠ base.sha, alebo 409/422 pri PATCH) → snapshot() → load() → reapply() →
             bez straty: save(true) automaticky; so stratou: zoznam polí na kontrolu
```

Overené správanie (`mock-test.mjs`, telefón 390 × 844):

| scenár | čo admin urobil | hodnotenie |
|---|---|---|
| štart | 14 volaní API (repo, ref, 11 súborov, zoznam `assets/img`), 262 polí, 2 905 uzlov DOM | ťažké, pozri 5.2 |
| zmena ceny + oznam, Uložiť | 19 volaní (6 na commit + 13 nové načítanie), 1 blob, strom `["index.html"]`, `force:false`, správa „Uložené… Cenu a dĺžku zmeň aj v Booqme.“ | správne |
| `main` sa posunul (iný sha pri ukladaní) | načítal novú verziu, zmeny preniesol, uložil na druhý pokus sám (47 volaní) | správne, C059 |
| 422 pri posune vetvy aj na druhý pokus | „Web sa medzitým zmenil inde… Klikni Uložiť na web ešte raz.“ | správne, ohraničený počet pokusov |
| 401 pri prihlásení | „Kľúč nie je platný…“, kľúč zmazaný z úložiska | správne |
| sieť preč pri prihlásení | „Nepodarilo sa spojiť s GitHubom…“, kľúč ostal | správne |
| sieť preč pri ukladaní | „Neuložené. Nepodarilo sa spojiť…“, rozpísané pole ostalo | správne, C028 |
| chyby stránky (pageerror) | žiadne | |

---

## 2. Meranie: z čoho je 107 kB

Celý súbor 107 195 B / 34 864 B gzip. (`meraj.mjs`)

| časť | B | gzip | poznámka |
|---|---:|---:|---|
| hlavička (meta, title, písma) | 349 | 254 | |
| CSS | 14 398 | 3 813 | 10 blokov; polia 3,1 kB, rituály a tím 2,9 kB, hlavička a záložky 1,8 kB, texty 1,6 kB, lišta 1,3 kB, poukazy 1,3 kB |
| HTML záložiek | 8 752 | 3 146 | login 1,4 kB, Ďalšie 1,8 kB a Platby 1,8 kB (návody a odkazy), ostatné záložky po 250 až 620 B, lišta 463 B |
| JS | 83 647 | 28 131 | |

JS po častiach (komentované bloky v kóde):

| blok | B | gzip | prenositeľnosť |
|---|---:|---:|---|
| pomocníci (norm, esc, h, fixNb…) | 4 157 | 2 070 | jadro, okrem `fixNb` (slovenská typografia HEAD SPA) |
| GitHub (gh, human, b64, readFile) | 2 189 | 1 136 | jadro |
| skener HTML (scan, at, cls) | 1 521 | 827 | jadro |
| časti stránky pre Texty (SECS, sectionOf, parseTexts) | 4 117 | 1 746 | špecifické (triedy a id HEAD SPA) |
| stav (parseAll, konštanty) | 5 384 | 2 280 | špecifické |
| polia a ich stav (reg, bind, field, trDetails) | 3 876 | 1 594 | jadro |
| polia pre všetky záložky (prepare) | 4 062 | 1 421 | špecifické |
| vykreslenie (renderOznam, renderTexty, renderRituals…) | 6 787 | 2 610 | špecifické |
| tím (renderTeam, memberEditor, openCropper, encodePhoto, teamChanges) | 16 140 | 5 858 | fotka 4,6 kB jadro, zvyšok špecifické |
| zmeny a kontrola (collect, validate, refresh) | 5 262 | 2 191 | collect/refresh jadro, validate špecifické |
| záložky (buildTabs, show) | 908 | 506 | jadro |
| zápis do súborov (build, commit, hourLines, i18nText…) | 22 773 | 8 258 | commit, setKey, i18nText, i18nLines jadro; build špecifické |
| načítanie (load, snapshot, reapply, login, save) | 6 471 | 2 758 | jadro |

Najväčšie funkcie: `build` 17 790 B, `parseAll` 4 506, `prepare` 4 046, `parseTexts` 3 367, `openCropper` 3 306,
`renderRituals` 2 749, `memberEditor` 2 225, `validate` 2 086, `login` 1 854, `renderPay` 1 845, `save` 1 825,
`renderTeam` 1 684, `refresh` 1 649, `commit` 1 460, `encodePhoto` 1 338.

Podiel po funkciách (`podiel.mjs`):

| kategória | B | gzip | podiel JS |
|---|---:|---:|---:|
| jadro (GitHub, polia, lišta, záložky, i18n kľúče, pomocníci) | 24 201 | 9 311 | 29 % |
| fotka: výrez a kódovanie | 4 644 | 1 989 | 6 % |
| záložka Texty (skener + časti HEAD SPA) | 8 260 | 3 360 | 10 % |
| špecifické pre HEAD SPA (26 funkcií) | 45 483 | 14 815 | 54 % |

Čo z toho plynie: ľahký admin pre Barbershop nevznikne orezaním tohto súboru. Jadro (24 kB + fotka 4,6 kB) sa
prevezme takmer doslova, zvyšok sa píše nanovo pre menší a jednoduchší obsah (15 riadkov cenníka, 10 ľudí, hodiny,
oznam, kontakt), pričom cieľ je menej než polovica dnešnej veľkosti.

---

## 3. Čo prevziať (s miestom v kóde)

| čo | funkcie v `admin/index.html` | prečo |
|---|---|---|
| prihlásenie kľúčom | `login()` 1492–1517, `gh('')` + `permissions.push`, `#zapamatat`, návod „Ako získam kľúč“ 222–230 | jediná vec, ktorá overí právo zápisu pred načítaním; návod je zrozumiteľný |
| `gh()` | 414–425 | hlavičky `Bearer`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version`, `cache:'no-store'`, chyby so `status` a `net`, 204 → null |
| `human()` | 426–434 | chyby po slovensky bez technických slov; 401/403/404/5xx/sieť rozlíšené (C059) |
| base64 | `b64dec`, `b64enc` 435–436 | správne pre UTF-8 (TextEncoder, po 32 kB) |
| čítanie podľa sha | `readFile()` 437–441, `load()` 1458–1472 | všetky súbory z jednej verzie; `/contents` > 1 MB padá na `/git/blobs` |
| commit | `commit()` 1436–1456 | jeden atomický commit do `main`, `force:false`, mazanie cez `sha:null`, priebeh „Ukladám i z n“ |
| konflikt a prenos | `snapshot()`, `reapply()`, `save()` 1474–1490, 1519–1546 | prenáša len polia, ktorých `orig` sa nezmenil; jeden automatický druhý pokus, potom stop (C059: ohraničené pokusy) |
| polia | `reg`, `valOf`, `changed`, `bind`, `mark` 608–635 | pôvodný stav = to, čo pole naozaj ukazuje (riadok 621); normalizácia `f` oddelená od hodnoty |
| lišta so zmenami | `collect()`, `refresh()`, `fitBar`, `#count` 1055–1125, CSS `.bar` | „N zmien“, zoznam s preskokom na pole, počty na záložkách, miesto pod lištou cez `--bar` |
| `beforeunload` pri neuložených zmenách | 1549 | |
| grow textarea | `grow()` 637 | prevziať, ale spúšťať len pre zmenené pole (5.2) |
| preklady „skontroluj preklad“ | `staleUpdate`, `trField`, `trDetails` 636–668 | stará hodnota ostane, označí sa; polia prekladov sa tvoria až pri otvorení |
| presun kľúčov prekladov | `setKey`, `renameKey`, `i18nText`, `i18nLines` 1162–1190; mazanie starého kľúča len keď sa text nikde nevyskytuje 1424 | slovníky Barbershopu sú kľúčované slovenským textom rovnako (`i18n.js` to výslovne prevzalo z HEAD SPA) |
| výrez fotky | `openCropper()` 917–957, `encodePhoto()` 959–972 | pointer events s capture, zoom okolo stredu, WebP s JPEG zálohou, detekcia prehliadača bez WebP; pre Barbershop iný pomer strán (6.4) |
| `h()` a escapovanie | `h()` 382–392, `esc/escA/safeJson` 366–376 | DOM bez `innerHTML` (jediný `innerHTML` je dekódovanie entít v odpojenej `textarea`, riadok 370, bezpečné) |
| kontrola JSON blokov pred uložením | 1427–1428 | ochrana pred rozbitím JSON-LD |
| tabs a `#hash` | `buildTabs`, `show` 1127–1140 | `aria-selected`, `history.replaceState`, scroll na začiatok |

Z HTML prevziať štruktúru: hlavička (značka + Web + Odhlásiť), lepkavý rad záložiek, `main` s `.tab[hidden]`,
`#loading`, pevná lišta `.bar` s `env(safe-area-inset-bottom)`. Z CSS prevziať tokeny a komponenty polí
(`.f`, `.hint`, `.changed`, `.stale`, `.btn`, `.msg`, `.note`, `.card`), ale v tokenoch webu Barbershop.

## 4. Čo neprevziať alebo prerobiť

| čo | prečo |
|---|---|
| `build()` ako jedna funkcia 17,8 kB | neoddeliteľné od HTML HEAD SPA (`<article data-price>`, `team-grid`, `data-siet`, `hero-static` vs. `data-split`, FAQ, `pravne.html`); pre Barbershop písať malé čisté funkcie po oblastiach (cenník, tím, hodiny, oznam, kontakt), každá testovateľná v Node |
| skener všetkých textov (`parseTexts`, 176 blokov, 209 polí) | najdrahšia časť za behu (5.2) a na telefóne neprehľadná; pre Barbershop kurátorovaný zoznam textov (titulky kariet, podtitulky, kicker, lead, pätička) cez stabilné triedy, vykresľovaný po častiach až pri otvorení |
| `fixNb` (pevné medzery, „Head Spa“, telefón) | prepísať na pravidlá Barbershopu (jednopísmenové predložky, číslo + jednotka, „Barbershop 30“), menšie |
| výmena telefónu a e-mailu v 5 súboroch textovou náhradou (`split/join`, 1407–1421) | pre Barbershop majú kontakty 4 až 6 miest v HTML a 7 až 14 v slovníkoch; ostáva textová výmena, ale len v `index.html` a slovníkoch, so zoznamom miest v zozname zmien |
| záložky Poukazy a platby, Firma, Ďalšie (GoatCounter), obrázky poukazov do Booqme, návody Stripe/SumUp | HEAD SPA špecifické; Barbershop rezervuje cez barbershop30.sk, bez poukazov (zatiaľ), firma je v pätičke |
| `TIM_SIZES`, `ALT` v 7 jazykoch, `picture` s 3 WebP + JPEG 800 | fotky tímu Barbershopu sú 821 × 695 (na šírku, `--focal`), šírky 480 a 820, AVIF + WebP + PNG |
| výpočet rozpätí „od 30 do 120 minút, ceny 25 až 95 €“ v textoch a slovníkoch (1277–1296) | Barbershop takéto texty nemá; ak pribudnú, riešiť kľúčom v `#nastavenia`, nie regexom cez slovníky |
| detekcia `OWNER/REPO` z `location` (354–357) | na vlastnej doméne (D6a: www.barbershop30.sk) zlyhá; pevné konštanty s komentárom DEPLOY STEP ako na webe |
| `localStorage` ako predvolené úložisko kľúča | 5.1 |
| 9 záložiek | na telefóne sa zmestia 4 a pol, bez náznaku pokračovania (snímka `p390-oznam.png`); Barbershop ≤ 6 |
| načítanie `app.js` a `app.min.js` pri každom štarte (89 kB) | používajú sa len pri zmene telefónu; v Barbershope admin `app.js` nepotrebuje, kým hodiny ostanú v konštante `HOURS` (6.4) |

---

## 5. Známe slabiny

### 5.1 Bezpečnosť (C077)

1. **Zdieľaný origin na GitHub Pages.** Admin HEAD SPA beží na `https://d8f5s88zjy-art.github.io/head-spa-30/admin/`.
   `localStorage` je per origin a origin je celé `d8f5s88zjy-art.github.io`: tie isté dáta vidí
   `…/barbershop-30/`, `…/zentury/`, `…/visionary-living/`, `…/stavebniny-richtarik/` a každý ďalší projekt účtu.
   Kľúč `hs30.admin` (fine-grained token s právom Contents: Read and write na celý repozitár vrátane všetkých webov)
   teda prečíta ktorýkoľvek skript, ktorý sa dostane na ktorúkoľvek z tých stránok (chyba XSS v cudzom návrhu,
   knižnica tretej strany v `zentury/`, `visionary-living/`). Pri predvolene zaškrtnutom „Zapamätať na tomto
   zariadení“ je kľúč v `localStorage` bez obmedzenia času.
   Odporúčanie pre Barbershop: predvolene `sessionStorage` (kľúč zmizne so zatvorením karty), „zapamätať“ ako
   vedomá voľba s vysvetlením. Vlastná doména (www.barbershop30.sk, D6a) origin oddelí; dovtedy nič do
   `localStorage`. Šifrovanie kľúča PIN-om (PBKDF2 + AES-GCM) je možné, ale 6-miestny PIN sa dá uhádnuť offline
   za hodiny, preto to nepredávať ako ochranu.
2. **Žiadna CSP.** `<meta http-equiv="Content-Security-Policy">` chýba. S externým `admin.js` ide napísať
   `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' blob: data:
   https://raw.githubusercontent.com; connect-src https://api.github.com https://raw.githubusercontent.com;
   base-uri 'none'; form-action 'none'`. (`frame-ancestors` cez meta nejde; GitHub Pages hlavičky neumožňuje.)
   Jednosúborový admin s inline skriptom by potreboval hash skriptu, ktorý sa mení pri každej úprave.
3. **XSS v admine samotnom: dnes v poriadku.** UI sa stavia cez `h()` (textContent, setAttribute), žiadny
   `innerHTML` s obsahom webu. Hodnoty idú do HTML cez `esc()` (text), `escA()` (atribúty), `safeJson()`
   (`<` → `<` v JSON blokoch). Jediné riziko sú regexové náhrady: text s `</` alebo `"` do atribútu je
   escapovaný, ale zle zvolený regex môže prepísať nesprávne miesto. Pre Barbershop po `build()` pridať
   kontrolu štruktúry: `DOMParser` na výsledok a porovnanie počtu `.price-row`, `.team-card`, JSON blokov s
   pôvodným, inak neuložiť.
4. **Chybové správy GitHubu:** `gh()` berie prvých 160 znakov tela odpovede do `e.message`, do UI ide len
   `e.status`; kľúč sa nikam neloguje. Zachovať.
5. **Rozsah kľúča:** fine-grained token na jeden repozitár s Contents RW je minimum, ktoré GitHub ponúka; nedá
   sa obmedziť na priečinok `barbershop-30/`. Majiteľ Barbershopu dostane kľúčom aj HEAD SPA. Ak je to
   problém, jediná cesta je samostatný repozitár pre Barbershop (otázka v časti 9).
6. **Nahrávanie fotky:** `accept="image/*"`, dekódovanie cez `Image`, výstup vždy z `canvas` (prekódovanie),
   žiadne spoliehanie sa na názov súboru. Dobré. Chýba limit veľkosti vstupu (telefón dá 12 MP; `canvas` to
   zvládne, ale starší iPhone môže pri 4 plátnach vyhodiť pamäť), pridať zmenšenie na max. 2 200 px pred výrezom.

### 5.2 Výkon (meranie `mock-perf.mjs`, telefón 390 × 844, DPR 3, CPU 4×, Fast 4G emulácia, API podvrhnuté)

| krok | nameraná hodnota | príčina |
|---|---|---|
| prvý obraz prihlásenia | FCP 308 ms, DCL 348 ms, dlhé úlohy 85 + 50 ms | 107 kB v jednom súbore sa parsuje celé pred prihlásením; prijateľné |
| od načítania po `#app` | 5 937 ms, z toho jedna dlhá úloha 1 189 ms | 11 súborov cez `/contents` (945 kB textu, 1,26 MB base64, dekódovanie `atob` + TextDecoder), potom `parseAll` (scan 114 kB HTML + regexy) + `prepare` (asi 2 300 polí) + `render` všetkých záložiek naraz (2 905 uzlov, 262 polí hneď, 209 textarea v Texty) |
| prepnutie na Texty | 546 ms, dlhé úlohy 148 + 223 ms | `grow()` na 209 textarea: každý číta `scrollHeight` po zápise `height:auto`, 209 vynútených rozložení |
| Rituály / Tím / Oznam | 172 / 141 / 157 ms | prijateľné; Rituály majú jednu úlohu 64 ms |
| jeden znak písania | 22 až 49 ms | `refresh()` pri každom `input`: `collect()` + `validate()` cez všetky polia, prestavba zoznamu zmien, 17× `r.sum()`, `fitBar` |
| pamäť | JS halda 11 MB, 2 909 uzlov | v poriadku |

Pre Barbershop (ciele: prvý obraz < 1 s na Fast 4G, bez dlhej úlohy > 200 ms, znak < 10 ms):

1. Súbory čítať z `https://raw.githubusercontent.com/<o>/<r>/<sha>/<cesta>` (pripnuté na sha, CDN, CORS `*`,
   bez base64, gzip), API len na `ref` a zápis. HEAD SPA admin to už robí pre fotky tímu (`teamPhotoUrl`).
   Záloha `/contents` s `Accept: application/vnd.github.raw+json` pri 404 z CDN. Barbershop potrebuje
   `index.html` (84 kB) a 7 slovníkov (135 kB); `app.js` len ak hodiny ostanú v jeho konštante.
2. Najprv `index.html` → vykresliť cenník, tím, hodiny, oznam, kontakt (použiteľné do 1 s); slovníky dočítať na
   pozadí, polia prekladov a uloženie na ne počkajú (lišta ukáže „načítavam preklady“ len ak majiteľ klikne skôr).
3. Vykresliť len otvorenú záložku, ostatné pri prvom otvorení (ako dnes preklady v `trDetails`).
4. `refresh()` prírastkovo: zmena jedného poľa prepočíta len jeho položku, zoznam zmien sa stavia z `Set`
   zmenených kľúčov; `validate()` po poliach s vlastnou kontrolou pri `input`, celkové overenie až pri Uložiť.
5. `grow()` len na zmenenej textarea; kde to ide, CSS `field-sizing: content` s JS zálohou.
6. Rozpočet: ≤ 1 200 uzlov DOM po prihlásení, ≤ 80 polí v DOM naraz.

### 5.3 Chyby a obnova (C059, C028)

Overené v 1. časti: sieť preč, 401, 403 (text pre práva aj limit), 404, 5xx, konflikt sha, 422 pri posune, strata
poľa pri prenose. Čo chýba alebo je slabé:

1. **Po uložení nevie, kedy je zmena naživo.** „Na webe to bude o minútu“ je odhad; Pages môže trvať 2 až 5 minút
   alebo zlyhať. Pre Barbershop: po commite každých 15 s `fetch(LIVE + 'index.html?t=' + Date.now(),
   {cache:'no-store'})` a hľadať v odpovedi nový sha (ak web ponesie `<meta name="verzia" content="<sha>">`,
   +60 B) alebo zmenený text; do lišty „Už naživo ✓“ alebo po 5 min „Ešte sa obnovuje, skontroluj o chvíľu“.
   Alternatíva `GET /repos/o/r/pages/builds/latest` potrebuje právo Pages: read navyše, radšej nie.
2. **Druhý konflikt** nechá majiteľa s polovičnou informáciou: hlási prenos, ale neukáže, čo sa inde zmenilo.
   Stačí doplniť „inde sa zmenilo: cena Pánsky strih 18 → 20 €“ zo snímky `orig` pred a po `load()`.
3. **`SyntaxError`/`TypeError` v `build()`** (riadok 1542) správne nezapíše nič, ale text „Daj vedieť správcovi
   webu“ nemá kam viesť. Pridať adresu alebo odkaz, a do správy aj názov poľa, pri ktorom to padlo.
4. **`confirm()`** pri Zrušiť, Odstrániť a Odhlásiť je natívny dialóg, na telefóne v poriadku (C074). Ponechať.
5. **Limity GitHubu:** 5 000 volaní/h na kľúč, `/contents` 1 MB, `/git/blobs` 100 MB. Admin ich s rezervou dodrží;
   fotka 3 × WebP + JPEG je asi 250 kB v base64.
6. **Dvojité kliknutie na Uložiť** blokuje `saving` (C022, bez duplicitného commitu). Zachovať.

### 5.4 Telefón a použiteľnosť (snímky `snimky/p390-*.png`, C057)

1. Rad 9 záložiek: vidno „Oznam, Texty, Rituály, Tím, Poukazy a pl…“, bez tieňa alebo šípky, že rad pokračuje
   (`p390-oznam.png`). Hodiny sú až po posunutí (`p390-hodiny.png`). Pre Barbershop najviac 6 záložiek
   a na telefóne namiesto radu zoznam „Čo chceš zmeniť“ s 6 veľkými riadkami (cena, človek, hodiny, oznam,
   text, kontakt), záložky až od 700 px.
2. Lišta zaberá 112 px + safe area (13 % výšky), so zoznamom zmien 36 vh. Pri otvorenej klávesnici ostáva
   nad ňou. Dobré, prevziať; v Barbershope zoznam zmien s tvarom „Pánsky strih: 18 € → 20 €“.
3. Hodiny: každý deň 2 riadky, 7 dní = 1 500 px skrolu (`p390-hodiny.png`). Barbershop má Po–Pi rovnaké:
   upravovať tak, ako web zobrazuje (Po–Pi, So, Ne), s voľbou „rozdeliť dni“.
4. Rituály: karta s 8 poľami + 6 jazykov × 6 polí je dlhá, ale zbalená; cena a dĺžka ako `type=number`
   s `inputmode=numeric` je správne. Pre cenník Barbershopu stačí riadok: názov · čas · cena, popis pod tým.
5. Texty: „na 2 miestach naraz“ a zbalené „+ Preklady“ sú dobré vzory. 176 blokov je priveľa na výber bez
   hľadania.
6. Prihlásenie: pole `type=password`, návod v `details`, správa po slovensky. Dobré. Chýba link „zabudol som,
   kde je kľúč“ (to isté ako návod) a upozornenie, že kľúč sa ukladá len v tomto prehliadači.
7. Kontrast a dotyk: polia 50 px, tlačidlá 48 px, chip 40 px, fokus 2 px zlatý. V poriadku.

### 5.5 Ostatné

1. **Audit bol chybný.** `admin-audit/prihlaseny.mjs`: (a) `GET /repos/o/r` vracal `{}` → `login()` hodí
   „Kľúč má len právo čítať“; (b) kľúč uložil ako `JSON.stringify({token})`, admin číta surový reťazec;
   (c) `/contents` pre priečinky vracal 404. Všetky snímky `admin-audit/snimky/*` sú preto prihlasovacia
   obrazovka. Opravený podvrh je `mock-test.mjs`.
2. Repozitár a vetva z `location` (riadky 354–357) fungujú len na `*.github.io/<repo>/`.
3. `build()` prepisuje aj `app.js` a `app.min.js` pri zmene telefónu; minifikovaný súbor sa tak rozchádza
   s `tools/build.mjs` iba textovo, čo je zámer, ale krehké. Barbershop nemá build krok, netýka sa ho.
4. Jeden súbor bez verzie: pri chybe sa nedá povedať, ktorú verziu adminu majiteľ má. Pridať `const VERZIA`.

---

## 6. Architektúra adminu Barbershop 30

### 6.1 Súbory a rozpočet bajtov

Umiestnenie `hs-tool/barbershop-30/admin/` (nasadzuje sa s webom; `pages.yml` dnes kopíruje len `index.html`,
`robots.txt`, `sitemap.xml` a `assets`, takže krok nasadenia musí pribudnúť `admin`, a `barbershop-30/robots.txt`
riadok `Disallow: /admin/`; `source/tools/nasad-barbershop30.sh` pre vlastnú doménu to isté).

| súbor | B zdroj | gzip | obsah |
|---|---:|---:|---|
| `index.html` | 7 000 | 2 500 | meta (`noindex,nofollow`, CSP, theme-color), hlavička, prihlásenie s návodom, 6 záložiek (len nadpis + lead + prázdny `div`), lišta, `<script src="admin.js" defer>` |
| `admin.css` | 9 000 | 3 000 | tokeny z webu (`--ink`, `--ink-2`, `--ink-3`, `--line`, `--paper`, `--paper-2`, `--paper-3`, akcent), `@font-face` Fraunces 800 + Manrope 400/600 z `../assets/fonts/` (súbory má prehliadač z webu v cache), polia, tlačidlá, karty, rad záložiek, lišta, výrez fotky |
| `admin.js` jadro | 16 000 | 5 500 | `gh`, `human`, prihlásenie a úložisko kľúča, čítanie z raw podľa sha, `commit`, `snapshot/reapply`, `reg/bind/mark/changed`, `collect/refresh`, lišta, záložky, `h/esc/escA/safeJson`, `setKey/i18nText`, kontrola naživo |
| `admin.js` adaptér Barbershop | 16 000 | 5 500 | `rozober()` (cenník, tím, hodiny, oznam, kontakt, texty) a `zostav()` po oblastiach, validácie, vykreslenie záložiek |
| `admin.js` fotka | 5 000 | 2 000 | výrez 821:695, WebP + JPEG 480/820, zmenšenie veľkých vstupov |
| **spolu** | **53 000** | **18 500** | cieľ ≤ 60 000 / ≤ 20 000 |

Tri súbory, nie jeden, lebo: (1) CSP `script-src 'self'` bez hashov; (2) HTML 7 kB sa vykreslí (prihlásenie)
skôr, než sa stiahne a parsuje JS (`defer`), prvý obraz na Fast 4G pod 400 ms; (3) CSS a JS sa cacheujú
samostatne, oprava v JS neposiela znova CSS; (4) `vernost/admin/` v repozitári už má rovnakú trojicu
(`index.html`, `admin.css`, `admin.js`), jeden vzor v repozitári; (5) jadro a adaptér sú v jednom `admin.js`
oddelené hlavičkou a `VERZIA`, takže sa neskôr dá jadro vyňať do `engine.js` bez zmeny rozhrania.
Jeden súbor by ušetril dve požiadavky (≈ 80 ms na 4G), to nie je dôvod vzdať sa CSP.

Dizajn (iná úloha, tu len rámec): ART_DIRECTION.md v1 má ako jediný akcent UI oranžovú lampu `--lamp #E0601C`,
mosadz `--brass #B5924E` necháva fotkám a 3D. Zadanie hovorí „orech, zlatá“. Admin má prevziať tokeny webu tak,
ako budú po D5/D6, a akcent jeden; ktorý, rozhodne art director. Písmo Fraunces len na nadpisy záložiek,
Manrope všade inde (C026: tokeny z webu, nie vlastná paleta).

### 6.2 Jadro: spoločný súbor alebo kópia

Odporúčam **kópiu jadra do `barbershop-30/admin/admin.js`** (časť „jadro“ s verziou a dátumom prevzatia),
nie spoločný `admin/engine.js` v koreni, z týchto dôvodov:

1. **Vlastná doména.** D6a plánuje nasadiť Barbershop do koreňa www.barbershop30.sk (`nasad-barbershop30.sh`,
   PLAN-D6-D7 riadky 704–724). Tam `../../admin/engine.js` neexistuje; spoločný súbor by sa aj tak musel kopírovať
   pri nasadení, čiže by boli dve kópie bez jedného zdroja pravdy.
2. **HEAD SPA admin je v prevádzke a bez testov.** Prestavať ho na import spoločného modulu znamená meniť nástroj,
   ktorý majiteľ používa, bez jeho zadania a bez záchrannej siete („nič sa nenasadzuje bez majiteľa“). Rozbitie by
   si všimol až pri ukladaní.
3. **Obsah sa líši:** 7 jazykov so srbčinou vs. 6; iné súbory (bez `pravne.html`, `404.html`, `app.min.js`);
   iný pomer fotky; iné validácie. Spoločný súbor by potreboval konfiguráciu pre oboje a rástol by.
4. **Riziko spoločného zlyhania:** chyba v spoločnom jadre vyradí oba adminy naraz; dve nezávislé kópie zlyhajú
   nanajvýš po jednej.

Cena kópie: opravy jadra treba preniesť ručne (zatiaľ 24 kB, 2 miesta). Aby to bolo lacné, jadro v `admin.js`
písať ako **čistý modul s adaptérom** (6.3), bez odkazov na konkrétne selektory, a do `README` HEAD SPA zapísať,
že Barbershop admin má jadro verzie X. Keď Barbershop admin pobeží mesiac bez chyby, samostatný majiteľom
schválený krok môže HEAD SPA admin preniesť na to isté jadro (`admin/engine.js` v koreni pre HEAD SPA a kópia
pre Barbershop pri nasadení).

### 6.3 Rozhranie jadra (adaptér)

```js
// admin.js, časť 1: JADRO (prenositeľné, bez znalosti webu)
const admin = jadro({
  owner: 'd8f5s88zjy-art', repo: 'head-spa-30', branch: 'main',        // DEPLOY STEP: pevné, nie z location
  live: 'https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/', // kontrola „už naživo“
  koren: 'barbershop-30/',                                             // predpona ciest v repozitári
  kluc: 'b30.admin',                                                   // sessionStorage, voliteľne localStorage
  subory: ['index.html'],                                              // načítať hneď
  neskor: LANGS.map((l) => `assets/i18n/${l}.json`),                   // dočítať na pozadí
  rozober: (raw) => model,                 // čistá funkcia: texty súborov → model (cenník, tím, hodiny, oznam, kontakt, texty)
  polia: (model, reg) => {},               // registrácia polí: reg(key, {orig, f, tab, item, what, trs})
  vykresli: { cennik, tim, hodiny, oznam, texty, kontakt },  // záložka → funkcia(model, entries, host), volá sa pri otvorení
  over: (model, entries) => [{tab, text}], // celková kontrola pred uložením
  zostav: (model, entries, raw) => ({ files: { 'index.html': {text} , 'assets/img/tim-x-820.webp': {b64}, … }, notes: [] }),
  skontroluj: (files, raw) => [],          // štruktúra po zostavení (počty .price-row, .team-card, JSON bloky)
  sprava: (commit) => 'Úprava webu: …',    // text commitu (bez podpisov, po slovensky)
});
// admin.js, časť 2: ADAPTÉR BARBERSHOP 30 (selektory, kľúče, validácie, výrez 821:695)
```

`rozober`, `zostav`, `over` a `skontroluj` sú čisté funkcie nad reťazcami: bežia v Node bez prehliadača, takže
testy „zmena ceny mení presne tieto riadky“ idú bez Playwrightu (časť 7). Jadro drží stav (`base`, `entries`),
lištu, záložky, GitHub a obnovu po chybe.

### 6.4 Čo admin číta a zapisuje na webe Barbershop (stabilné selektory a kľúče, nie čísla riadkov)

Tím D1–D5 mení `index.html` súbežne (D1 nemení HTML, D2 má rozpočet gzip ≤ 14 600 B, D5 mení `sizes` galérie
a kotvy záberov, D6 pridáva FAQ, parkovanie, `hodiny.js`, `<p class="dnes">`). Admin preto stojí len na týchto
háčikoch (všetky sú v `docs/CONTRACT.md` alebo v dnešnom HTML a plán ich nemení):

| oblasť | číta | zapisuje | kľúče prekladov (7 slovníkov) |
|---|---|---|---|
| cenník | `.price-group` (`h3.price-group-title`), `.price-row` → `.price-name`, `.price-desc`, `.price-time`, `.price-amount`, `.price-cta .visually-hidden` | tie isté uzly; JSON-LD `hasOfferCatalog.itemListElement[].itemOffered.name` + `price` (párovanie podľa názvu, nie poradia; C030) | názov, popis, „40 min“; sumy nemajú kľúč |
| tím | `.team-card` → `.team-portrait picture` (`source` avif/webp, `img` png, `style="--focal"`, `alt`), `.team-name`, `.team-role`, `.team-bio` | `<li class="team-card">` celý; nová fotka ako `tim-<slug>-480/820.webp` + `.jpg` (AVIF prehliadač nevyrobí; `source type=image/avif` sa pre toho človeka vynechá, `build_images.py` ho doplní neskôr) | meno, „Meno, Rola v Barbershop 30“ (alt), rola, bio |
| hodiny | dnes 3 miesta v HTML (`.flap-cells` riadok 808, `.contact-row dd` 813, `dl.hours` 850–854), JSON-LD `openingHoursSpecification`, `app.js` `const HOURS = {…}` (riadok 659), 4 kľúče × 7 slovníkov | **žiadosť pre tím D6:** jeden blok `<script type="application/json" id="nastavenia">{"hodiny":{"1":[9,19],…,"0":null},"oznam":""}</script>` (+ asi 120 B gzip), `hodiny.js` (D6a) aj tabuľa z neho čítajú; HTML riadky hodín admin generuje z neho ako HEAD SPA (`hourLines`) | riadky hodín po jazykoch (`DAY_WORDS` z HEAD SPA rozšíriť o `sr`) |
| oznam | neexistuje | **žiadosť:** slot `<div class="oznam" id="oznam" role="status" hidden><p></p></div>` + CSS na webe, alebo text v `#nastavenia` a `app.js` ho vykreslí (0 B v HTML) | text oznamu |
| kontakt | `a[href^="tel:"]`, `a[href^="mailto:"]`, JSON-LD `telephone`, `email`, `sameAs`; sociálne siete `footer-links a` | textová výmena všetkých tvarov v `index.html` (4 + 6 + 5 miest) a v slovníkoch (7 + 14) | |
| texty | kurátorovaný zoznam: `.title-card .kicker/.title/.title-sub`, `.band-head .eyebrow/.lead`, `.footer-brand .small`, meta `description` | úseky podľa pozície ako HEAD SPA (`scan()`), `.kin` nadpisy po celých riadkoch (i18n.js ich tak prekladá) | text |
| naživo | `LIVE + 'index.html'` | **žiadosť:** `<meta name="verzia" content="…">` nepotrebná, ak admin porovná zmenený text | |

Do schválenia háčikov pre hodiny a oznam ide admin so 4 záložkami (Cenník, Tím, Texty, Kontakt) a Hodiny s Oznamom
pribudnú v druhom kroku; alebo Hodiny zapisujú do dnešných 5 miest vrátane `app.js`, čo je 2 kB kódu navyše
a krehké. Odporúčam prvé.

Zoznam zmien v lište musí ukazovať pred → po („Pánsky strih: 18 € → 20 €“, „Hodiny: So 9:00–14:00 → 9:00–13:00“)
a po uložení „Už naživo“ (6.1), to je „vidí, čo sa zmení a kedy bude naživo“.

### 6.5 Nasadenie a index

- `barbershop-30/admin/index.html`: `<meta name="robots" content="noindex, nofollow">`; `barbershop-30/robots.txt`
  `Disallow: /admin/`; koreňový `robots.txt` už má `Disallow: /admin/`, ale nie `/barbershop-30/admin/`.
- `pages.yml` krok Barbershop: doplniť `barbershop-30/admin` do `cp`; `nasad-barbershop30.sh` to isté;
  `tools/ftp-balik.sh` pre headspa30.sk nesmie obsahovať `barbershop-30/` (D6a-0 to už rieši).
- Nič z toho sa nenasadí bez majiteľa; návrh zmien workflowu ide ako samostatný diff na schválenie.

---

## 7. Testovanie bez GitHubu (vzor `mock-test.mjs`, opravený oproti `admin-audit/prihlaseny.mjs`)

Podvrh `page.route('https://api.github.com/**')` musí vracať:

| volanie | odpoveď | prečo |
|---|---|---|
| `GET /repos/o/r` | `{permissions:{push:true}}` | inak `login()` hlási „len právo čítať“ (chyba auditu) |
| `GET /git/ref/heads/main` | `{object:{sha}}` | druhé volanie s iným sha simuluje konflikt |
| `GET /contents/<cesta>?ref=` | súbor z disku ako `{sha, encoding:'base64', content}`; priečinok ako pole `[{path,type}]`; 404 pre neexistujúce | admin číta aj `assets/img` |
| `GET raw.githubusercontent.com/o/r/<sha>/<cesta>` (Barbershop) | text súboru z disku | nový spôsob čítania |
| `POST /git/blobs`, `/git/trees`, `/git/commits` | `{sha}`; telá požiadaviek si test odloží | kontrola, čo sa zapíše |
| `PATCH /git/refs/heads/main` | `{}` alebo 422 | konflikt pri posune |
| kľúč | `sessionStorage.setItem('b30.admin', 'github_pat_test')` surový reťazec | audit ukladal JSON |

Scenáre, ktoré musí Barbershop admin prejsť (všetky už bežia v `mock-test.mjs` proti HEAD SPA):
prihlásenie a počet volaní; každá záložka na 390 × 844 a 1 440 × 900 so snímkou, ktorú si niekto pozrie;
zmena + zoznam zmien + uloženie; konflikt sha (automatický druhý pokus); 422 pri PATCH; 401; 403; sieť preč pri
prihlásení aj pri ukladaní (polia ostanú); `beforeunload`; `pageerror` = 0.

Navyše pre Barbershop:

1. **Zlatý diff:** z odloženého blobu dekódovať `index.html`, porovnať s pôvodným po riadkoch; zmena ceny
   „Pánsky strih“ smie zmeniť presne 2 riadky (`.price-amount` a JSON-LD), zmena hodín presne N riadkov, zmena
   mena v tíme presne 4 (name, alt, visually-hidden, JSON-LD ak je). Všetko ostatné byte po byte rovnaké.
   Beží v Node nad `rozober`/`zostav` bez prehliadača, s fixtúrami z kópie `index.html` (dlhý názov, prázdny
   popis, jeden človek, 11 ľudí, názov s `&` a `"`, srbský preklad s diakritikou; C030).
2. **Štruktúra:** `DOMParser` na výstup: počty `.price-row`, `.team-card`, `script[type=application/ld+json]`
   a JSON bloky sa parsujú.
3. **Testy webu nad výstupom:** výstup `zostav()` zapísať do dočasnej kópie webu a spustiť
   `source/tools/i18n-test.mjs` (všetky jazyky bez nepreloženého textu) a `app-smoke.mjs`. To chytí chýbajúci
   kľúč po premenovaní názvu služby.
4. **Rozpočet:** `mock-perf.mjs` s hranicami: FCP < 1 000 ms, `#app` < 1 500 ms pri CPU 4×, žiadna dlhá úloha
   > 200 ms, znak < 10 ms, `gzip -9c` súčet ≤ 20 000 B. Test padne pri prekročení.
5. **Klávesnica (C074):** Tab cez prihlásenie → záložky → polia → lišta; Enter v poli kľúča; Esc nič nerozbije;
   fokus po preskoku zo zoznamu zmien skončí na poli.

---

## 8. Brány kvality pre admin (C081, prispôsobené)

| brána | dôkaz |
|---|---|
| pravda a rozsah | admin mení len to, čo je v `docs/CONTENT_SOURCES.md` ako upraviteľné majiteľom; ceny a trvania ostávajú v súlade s rezervačným systémom (nástroj `rezervacia-kontrola.mjs` z D6 ako upozornenie po uložení: „skontroluj aj v rezervačnom systéme“) |
| funkčná cesta | zlatý diff, podvrhnutý commit, konflikt, 401, offline |
| mobil | snímky 390 × 844 každej záložky s otvorenou klávesnicou; žiadny rad záložiek bez náznaku pokračovania |
| prístupnosť | labely pre každé pole, `aria-selected`, fokus viditeľný, kontrast ≥ 4,5:1 na tokenoch webu, prechod klávesnicou |
| výkon | rozpočet 20 kB gzip a časy z `mock-perf.mjs` v CI (lokálne, bez GitHubu) |
| bezpečnosť | CSP v meta, kľúč v sessionStorage, žiadny `innerHTML` s obsahom, escapovanie na výstupe, kontrola štruktúry pred commitom |
| inžinierstvo | `pageerror` 0, žiadna knižnica z CDN, komentáre a commity po slovensky, bez podpisov, žiadna zmienka o AI |
| odovzdanie | README časť „Admin (barbershop-30/admin/)“ ako má HEAD SPA, návod na kľúč, zoznam háčikov v CONTRACT.md |

---

## 9. Otvorené otázky (pre majiteľa a tím D1–D7)

1. Súhlasí tím D6 s blokom `#nastavenia` (hodiny, oznam) a s tým, že `hodiny.js` a tabuľa čítajú hodiny z neho?
   Bez toho admin hodiny buď nemení, alebo prepisuje 5 miest vrátane `app.js`.
2. Kde má byť oznam na webe Barbershop (pod lištou ako HEAD SPA?) a kto doplní CSS: D6 alebo admin spolu
   s prvým nasadením?
3. Chce majiteľ Barbershopu záložku Texty vôbec, alebo stačí cenník, tím, hodiny, oznam, kontakt?
   (Texty = +8 kB a najväčšie riziko omylu.)
4. Má Barbershop dostať vlastný repozitár? Kľúč na `head-spa-30` dáva majiteľovi Barbershopu aj zápis do
   HEAD SPA a ostatných webov. Ak ostane jeden repozitár, treba to majiteľovi povedať.
5. Vlastná doména www.barbershop30.sk: kedy. Dovtedy kľúč len v `sessionStorage` (zdieľaný origin github.io).
6. Fotky nových ľudí bez AVIF (len WebP + JPEG) do najbližšieho behu `build_images.py`: prijateľné?
7. Názov commitu z adminu: „Úprava webu Barbershop: …“, aby sa v histórii líšil od HEAD SPA.
