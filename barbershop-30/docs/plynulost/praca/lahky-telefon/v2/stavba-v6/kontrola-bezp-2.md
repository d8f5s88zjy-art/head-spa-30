# Kontrola bezpečnosti, údajov a textov – dávka V6 (kolo 2)

Nezávislý kontrolór, 22. 10. 2026, 05:43–05:50 UTC. Strom `$SP/hs-vernost` (HEAD `52ce64f`, vetva `barbershop-vernost`,
5 commitov od f624ee8), nič som nemenil (`git status --short` po kontrole prázdny; `vernost/config.php` a
`vernost/data/meno.php` neexistujú). `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Vstupy: `odovzdavka.md`, `oprava-1.md` (len N1 → commit `52ce64f`, 1 súbor `vernost/testy/e2e.mjs` +9/−2), `kontrola-bezp-1.md`,
`kontrola-kod-1.md`. Merítko: `vernost.md` časť 5 (bezpečnosť), 6 (skúška), 7 (texty).

**Verdikt: prevziať. Žiadny vážny nález. Trvá 1 stredný nález z kola 1 (S1 = N2 kontroly kódu: skúška zapisuje
`v30.preskoc.barbershop` do `sessionStorage` cestou cez rezerváciu) a 6 drobných; oprava-1 ich podľa zadania nemenila.**
Nič sa neposiela, nič osobné sa neukladá, server odmieta cudzí pôvod aj formulárový CSRF, kópia prihlášky je zhodná so zdrojom,
`data-skuska` v strome nie je.

Prehliadačová kontrola skúšky **tentoraz prebehla** (Chromium, 8 s, sk + en, 390×844, snímky v `$SP/kontrola-bezp-2/`).
Poznámka k pravidlu o prehliadači (moja odchýlka, nie chyba dávky): o 05:44:43 bol voľný (`pgrep -f "http.server 86[01]"` → rc=1,
`pgrep -c -f "headless_shel[l]|chrome-linux/chrom[e]"` → 0); prvý pokus padol bez spustenia Chromia (N4 nižšie); pri opakovaní
o 05:45:01 kontrolný `pgrep` v tom istom príkaze vrátil už **7** (cudzí prehliadač sa medzitým spustil), ale príkaz beh nezastavil
a moje Chromium bežalo 05:45:01–05:45:09 súbežne s cudzím. Po behu `pgrep` → 0 (o 05:46). Ak meranie plynulosti iného tímu
v tých 8 s ukázalo výkyv, je odo mňa. Ďalej som prehliadač nepoužil.

---

## 1. Čo prihláška posiela, kam a čo ukladá (vernost.md časť 5)

| Otázka | Zistenie | Dôkaz |
|---|---|---|
| Polia pri registrácii | `prevadzka`, `meno`, `telefon`, `email` (aj prázdny), `suhlas_karta: true`, `suhlas_spravy` (true/false), `web` (pasca); JSON, `credentials: 'omit'` | `vernost/web/prihlaska.js:171–174` |
| Odosiela sa len po súhlase | bez zaškrtnutia sa `submit` skončí pred `fetch` (`uloz(K_NIE)`, rezervácia sa otvorí) | `prihlaska.js:156–162` |
| Kam | `API` = `data-api` alebo `https://www.headspa30.sk/vernost/api/`; POST `?a=registracia`, GET `?a=karta&k=<token>` raz za návštevu (4 s po načítaní) | `prihlaska.js:18, 171, 257, 260`; `barbershop-30/index.html:923` bez `data-api` |
| Nič iné | žiadna analytika ani tretie strany; `innerHTML` v prihláške 0× | `grep -n "innerHTML\|insertAdjacentHTML\|outerHTML\|document.write" vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → nič (rc=1) |
| V prehliadači | `localStorage`: `v30.karta.barbershop`, `v30.nie.barbershop` (60 dní), `v30.ma.barbershop`; `sessionStorage`: `v30.preskoc.barbershop`, `v30.overene.barbershop` | `prihlaska.js:22, 36–38, 188, 255–256`; zhoda s TEXTY časť 3 |
| Kópia = zdroj | `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → bez výstupu | kontrola `e2e.mjs:25` prejde (oprava-1 beh 111/0 to potvrdil) |

**Otázka pre majiteľa (trvá z kola 1, nie chyba dávky):** pôvod API je len `https://www.headspa30.sk/vernost/api/`
(`prihlaska.js:18`); server povoľuje pôvody `headspa30.sk`, GitHub Pages a `barbershop30.sk` (`vernost/lib/jadro.php:14–15`).
Pre Barbershop to znamená: odkaz na kartičku zákazníka Barbershopu začína `www.headspa30.sk/…` a údaje jeho zákazníkov ležia
na hostingu HEAD SPA 30 (prevádzky oddelené stĺpcom `prevadzka`, `api/index.php:90, 122–124`). Technicky v poriadku; právne
a značkovo je to rozhodnutie majiteľa – TEXTY to pomenúvajú v časti 2 bod 3 a v M1, nech to pri M1 výslovne potvrdí alebo odmietne.

## 2. Skúška: naozaj nič neposiela ani neukladá? (vernost.md časť 6)

Bez prehliadača (stub `fetch` hádže chybu a počíta volania):

```
node barbershop-30/source/tools/vernost-skuska-test.mjs
OK: index.html bez data-skuska; v skúške fetch 0×, zápisov do úložiska 0, štítok SKÚŠKA, potvrdenie s menom, ukážka kartičky bez QR a bez osobných údajov.   rc=0
node barbershop-30/source/tools/vernost-footer-test.mjs
OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.   rc=0
grep -c data-skuska barbershop-30/index.html index.html   → 0 / 0
git grep -n data-skuska   → len prihlaska.js/vernost.js, dva testy skúšky, README (vernost:56, barbershop-30:74); v HTML nikde
```

V prehliadači (Chromium, `NODE_PATH=/opt/node22/lib/node_modules B30_PORT=8745 node barbershop-30/source/tools/vernost-skuska-browser.mjs --snimky=$SP/kontrola-bezp-2`,
`data-skuska` doplnené len za behu do odpovede servera, nie do stromu; cudzie adresy blokované `ctx.route`): **20× OK, „Všetky kontroly skúšky prešli“, rc=0** –
za sk aj en: sekcia a pätička viditeľné, štítok v okne, „Kartička je pripravená, Peter!“ / „Your card is ready, Peter!“ bez servera,
0 odkazov na skutočnú kartičku, ukážka bez mena/telefónu/QR, **v úložisku nič s `v30.*`**, `fetch` na API 0×, 0 požiadaviek na
`headspa30.sk`, bez chýb JS. Snímky `skuska-okno.png` (okno so štítkom SKÚŠKA, vyplnené Peter Skúška / 0907 555 666, tlačidlo
„Založiť kartičku“) a `skuska-ukazka.png` (kartička „Barbershop 30“, 0 bodov, „Ukážka“, „Kód UKÁŽKA“, rámik „QR kód ukáže kartička…“,
„Odmeny a akcie doplní prevádzka.“) som si pozrel: tmavé v značke, bez údajov z formulára.

Čítaním kódu: `fetch` sa v skúške nevolá (`prihlaska.js:169–170` náhrada po 600 ms), `uloz()` má `if (SKUSKA) return;` (`:36`),
`overUlozenu()` dostane `u = ''` (`:254`), ukážka je zo stálych reťazcov (`:214–228`), `OCHRANA` odkaz má `rel="noopener"` (`:145`).

**S1 (stredná, trvá z kola 1; = N2 kontroly kódu): skúška zapisuje do `sessionStorage` cestou cez rezerváciu.** `relacia()`
(`prihlaska.js:38`) nemá poistku `SKUSKA` a `dlg._teraz` (`:188`) ju volá pri zavretí okna bez voľby (×, Esc, klik vedľa) po kliku
na odkaz rezervácie. Vlastná reprodukcia na kópii `barbershop-30/assets/vernost.js` (`$SP/kontrola-bezp-2/s1-rezervacia.mjs`, `vm`, `data-skuska`):

```
okno otvorené z rezervácie: true
zápisy po zavretí ×: [["session","v30.preskoc.barbershop","1"],["session","v30.preskoc.barbershop","1"]] fetch: 0
```

Sľub „nič sa neukladá“ stojí na troch miestach: `vernost/README.md:57`, `barbershop-30/README.md:75`, `prihlaska.js:12, 48`
(„nič sa neodosiela ani neukladá“). Oba testy skúšky (`vernost-skuska-test.mjs`, `vernost-skuska-browser.mjs:45–46`) merajú len
cestu zo sekcie. Dosah: len relácia, žiadne osobné údaje, nič sa neposiela; majiteľ v náhľade po prvom zavretí okna pri
„Rezervovať“ už v tej istej karte prehliadača otázku neuvidí. Návrh (jedna z dvoch): (a) `dlg._teraz = function () { if (rezervacia && !rozhodnute && !SKUSKA) relacia(K_TERAZ, '1'); };`
v zdroji + `cp` do kópie + v `vernost-skuska-test.mjs` cesta z odkazu rezervácie so zavretím × (`zapisy` ostane `[]`); alebo
(b) správanie nechať a opraviť vety v README (oba), v hlavičke `prihlaska.js` a doplniť vetu do TEXTY časť 1 „Len v náhľade“ a do `nahlad-patch.md`.

**S2 (drobná, trvá): protirečivý text potvrdenia v skúške.** `hotovo()` ukáže `karta ? L.okT : L.maT` (`prihlaska.js:198`),
v skúške `karta = 'ukazka'` (`:179`) → pod štítkom „nič sme neodoslali“ stojí „Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž
na recepcii QR kód z kartičky.“ Návrh: v skúške `SKUSKA ? L.skuskaT : L.okT` (text už existuje v 8 jazykoch) alebo veta do TEXTY časť 1.

**S3 (drobná, trvá, doplnené): živé odkazy v náhľade.** „Ochrana údajov“ v sekcii (`index.html:842` natvrdo
`https://www.headspa30.sk/vernost/ochrana-udajov.html`) a v okne (`prihlaska.js:145` z `API`), „Pokračovať na rezerváciu“ je skutočná
(`:160, 201`). Navyše tlačidlo sekcie si v skúške ponecháva `href="https://www.headspa30.sk/vernost/karta/"` (`index.html:841`;
`obnovPaticku()` ho odstráni len pri `!dostupne`, `prihlaska.js:73`) – bežný klik zachytí poslucháč (`:243–249`), ale dlhé podržanie
na iPhone alebo stredné tlačidlo myši (`auxclick`, poslucháč ho nerieši) otvorí živú adresu, kde systém ešte nebeží (404). Nie je to
požiadavka stránky bez činu používateľa. Návrh: veta do `nahlad-patch.md` a TEXTY „Len v náhľade“ (odkaz na zásady a dlhé podržanie
tlačidla v náhľade nefungujú, kým systém nebeží; rezervácia je skutočná); prípadne pri `!u` v blokoch `href` odstrániť vždy a doplniť
`tabindex="0"`/`role="button"`, aby tlačidlo ostalo v klávesnicovom poradí.

Poistky, že skúška neunikne na web, trvajú: `vernost-skuska-test.mjs:11–12` (bez `data-skuska`, značka presne bez ďalších atribútov),
`data-zapnute` dopĺňa len `tools/vernost-priprav.py:36–40` v `_site`; pri oboch atribútoch `SKUSKA` vyhráva a `fetch` sa nevolá (`:169`).
Úryvky v `nahlad-patch.md` som vyskúšal na kópii v `$SP/kontrola-bezp-2/nahlad/`: `sed` → `nahlad=1 strom=0`; python s `assert`
→ `0 -> 1`, riadok 923 nesie `data-skuska`, strom nedotknutý.

## 3. Kontrola uloženej kartičky (https, pôvod, cesta)

`kartaUlozena()` (`prihlaska.js:53–62`): `new URL`, rovnaký `origin` ako základ API, `https:` (http len pre `127.0.0.1`/`localhost`
a aj to len pri zhodnom `origin`), bez používateľa a hesla, `pathname === '/vernost/karta/'`, `search` presne `?k=<22 znakov [A-Za-z0-9_-]>`,
bez `#`. Test prešiel s 8 neplatnými adresami (`vernost-footer-test.mjs`, výpis vyššie). Odkaz v skrytom bloku bez kartičky nemá `href`
(`:73`), klik sa zastaví (`:246`), `window.open(u, '_blank', 'noopener')` len po overení (`:249`). V poriadku.

## 4. XSS v prihláške a v sekcii

- Prihláška: `innerHTML`/`insertAdjacentHTML`/`outerHTML`/`document.write` 0× (grep vyššie); všetko cez `el()` + `append` textu (`:39–44`),
  chyba zo servera `textContent` (`:166, 182`), meno v nadpise ako text (`:197`), `href` len z overenej adresy (`:72, 206`).
- Sekcia `index.html:837–844` je statická; `i18n.js` prekladá cez `nodeValue`, `innerHTML` v `i18n.js:218, 265` skladá len vlastné
  reťazce prepínača jazyka (slovníky sú v repozitári, nie od používateľa).
- Server meno neescapuje (`jadro.php:142–147` len orezáva riadiace znaky): POST s menom `<img src=x onerror=alert(1)>` → 200 (sonda 10 nižšie).
  V poriadku, kým sa meno kreslí ako text (kartička `karta/karta.js` cez `el()`, overené v kole 1); každé nové vykreslenie mena musí ostať textové.

## 5. Server `api/index.php` (čítanie + lokálny `php -S 127.0.0.1:8746 … router.php`, dočasný `VERNOST_DATA` v `$SP/kontrola-bezp-2/`, po teste zmazaný; bez `config.php`)

```
 1 ?a=stav → {"ok":true,"php":"8.4.19","sqlite":true,…,"admin":{"barbershop":false,"headspa":false},"databaza":true,"ip_cez_proxy":false}
 2 POST application/x-www-form-urlencoded (jednoduchý CSRF formulár) → 415
 3 POST text/plain s JSON (CSRF bez preflightu) → 415 "Očakávam JSON."
 4 POST JSON, Origin https://zly.example → 403 "Zakázaný pôvod."
 5 Origin https://www.headspa30.sk.zly.example (prípona) → 403       (presná zhoda in_array, jadro.php:170)
 6 Origin null → 403
 7 OPTIONS z https://zly.example → 204 bez Access-Control-*        (prehliadač POST zastaví)
 8 OPTIONS z https://www.barbershop30.sk → 204 + Access-Control-Allow-Origin: https://www.barbershop30.sk
 9 POST bez suhlas_karta → 400 "Kartičku založíme len so súhlasom."
10 meno s HTML → 200 {"ok":true,"existuje":false,"karta":"http://127.0.0.1:8746/vernost/karta/?k=<22 znakov>"}
11 22 ďalších registrácií → 18× 200, potom 429 (limit 20/h na odtlačok IP, api/index.php:79; 2 predošlé v okne)
12 ?a=klienti bez hlavičky → 403; s X-Vernost-Admin: 1 bez relácie → 401
13 GET /vernost/lib/jadro.php → 403
```

CSRF: JSON `Content-Type` vynúti preflight (`api/index.php:14`), `Origin` mimo zoznamu → 403 (`:15–16`, `jadro.php:167–171`); admin
navyše hlavička + vlastný pôvod + relácia `HttpOnly`/`SameSite=Strict`/`secure` pri https (`jadro.php:220–232`). Limity: registrácia 20/h,
kartička 120/10 min, e‑mail 2/deň (`api/index.php:79, 120`; `jadro.php:252–257`); IP len ako HMAC odtlačok, najviac deň (`:195–198`).
Pasca `web` vracia „ok“ bez zápisu (`:78`). Odpoveď `existuje` prezrádza, že číslo kartičku má – vedome prijaté riziko (README), bez zmeny.
Bez nálezu.

CI brána `tools/vernost-priprav.py:33–41`: `data-zapnute` len pri dĺžke hesla ≥ 10 **a** `ready[name] is True` zo živého `?a=stav`;
heslá sa iba merajú (`len(os.environ.get(...))`), nikam sa nevypisujú; `python3 -I tools/test-vernost-priprav.py` → 4 testy OK
(výstup „vernostná prihláška vypnutá“ pri napodobnených odpovediach). `pages.yml:44–53` má len tento krok s `env` zo `secrets.VERNOST_HESLO_*`.
Tajomstvá v diffe f624ee8..HEAD: len názvy tajomstiev a testovacie heslá lokálneho testu (`spusti.sh:10`, „test-heslo-…“, existovali už pred dávkou).

## 6. Texty (V6e `TEXTY-PRE-MAJITELA.md`, sekcia, okno)

Prešlo:
- Sekcia `index.html:838–839` je doslova z `vernost.md` časť 7 (pomlčka → čiarka); čísla v bloku `837–843`: len `h3` a „30“ v názvoch
  (`grep -oE '[0-9]+'`) – bez čísel bodov, bez konkrétnej odmeny; tykanie ako zvyšok webu.
- Slovo „AI“, „umelá inteligencia“, „ChatGPT“, „Claude“: `grep -rn -i -E '\bAI\b|umel[áa] intelig|ChatGPT|Claude'` v `index.html`,
  7 slovníkoch, `prihlaska.js`, TEXTY a `nahlad-patch.md` → nič (rc=1).
- Sídlo FACEPALM, s.r.o. len v TEXTY časť 2 so značkou **[predpoklad – overí majiteľ]**; v strome `vernost/ochrana-udajov.html` bez sídla (nezmenené v dávke).
- Vykanie majiteľovi dôsledné („určíte vy“, „povedzte“, „zadáte“); citované texty webu tykajú (správne). Tmavé okno a ukážka: farby
  nezmenené, majiteľovi napísané (TEXTY časť 1 „Vzhľad“, `nahlad-patch.md` posledný odsek) – podľa `REVIZIA-PO-SKEPTIKOVI.md` bod 5.
- 8 jazykov: deterministický výber 8 viet okna (`otvor, odmeny, chcem, gdpr, kod, tel, ma, u`) + text sekcie + 3 tlačidlá za každý zo 7
  jazykov (výpis v relácii; semienko 20261022). Preklady verné slovenčine, rovnaký register, žiadny pridaný sľub ani číslo; štítok skúšky a
  ukážka (`skuska…odmeny`) vo všetkých 8 v `T` a zhodne v TEXTY časť 1.
- TEXTY časť 3 (odsek pre `pravne.html`) sedí s kódom: kľúče, 60 dní, relácia, jedno overenie za návštevu na `www.headspa30.sk`.
- M1–M7 pokrývajú body 1–7 z `vernost.md` časť 8; body 8–9 (vzhľad, kedy spustiť) sú v „Doplnky“. Úplné, poradie podľa závislostí.

**T1 (drobná, trvá – zúžené):** `hu` `ukazka` „Kártya minta“ → „Kártyaminta“ (`prihlaska.js:28`); veta `qr` „QR kód ukáže kartička,
zadarmo na recepcii“ (sk `:25`, podobne cs/de/en) je kostrbatá → „QR kód bude na kartičke; na recepcii ho ukážeš zadarmo.“
Výhrada kola 1 k `hu` „Igen, kérem a hűségkártyát“ **neplatí**: „kérem“ je tu 1. osoba určitého časovania („žiadam si ju“), nie zdvorilostná forma.

**T2 (drobná, trvá):** žargón v M1–M3/M5 TEXTY časť 4: „či tam beží PHP“ (M1), „súbor s odtlačkami hesiel“ (M2), „admin“ (M3, M5);
názvy tajomstiev patria do zátvorky „pre technika“. „systém má predvolené 1“ (M5) je predvoľba kódu (`api/index.php:129`), nie pravidlo
podniku → „kým nepoviete inak, systém počíta 1 bod za návštevu“.

**T3 (drobná, trvá):** `odovzdavka.md` riadok 16 má U+200B („zo strom​u“; vlastná kontrola python, pozícia 3830). TEXTY, `nahlad-patch.md`
a `oprava-1.md` sú bez neviditeľných znakov.

Poznámka (nie nález): veta okna „vymeň ich za zľavu alebo produkt“ (`prihlaska.js:25` kľúč `u`, 8 jazykov) ostáva jediným sľubom odmeny;
odovzdávka aj TEXTY ju správne viažu na M5.

## 7. Oprava-1 a nástroje (bezpečnostný pohľad)

- Commit `52ce64f` mení len `vernost/testy/e2e.mjs:204–212` (test; počíta všetky `[data-vernost-karta]`, overí `href === uložená`,
  odkrytie a popisy, kliká postupne). Nič v zdroji prihlášky ani v HTML; bez vplyvu na web.
- **N4 (drobná, trvá; = N4 kontroly kódu):** `vernost-skuska-browser.mjs` bez `NODE_PATH` padá: `B30_PORT=8745 node …` →
  `Error: Cannot find module 'playwright'` z `barbershop-30/source/shot.mjs:37` (`createRequire(import.meta.url)`), hoci hlavička testu
  (`:4`) uvádza len `B30_PORT=8721 node …`. S `NODE_PATH=/opt/node22/lib/node_modules` prešiel (časť 2). Návrh: doplniť `NODE_PATH` do hlavičky
  testu a do `barbershop-30/README.md`, alebo v teste načítať server inak než cez `shot.mjs`.

## 8. Súhrn

| # | Závažnosť | Nález | Kde |
|---|---|---|---|
| S1 | stredná (trvá) | skúška zapisuje `v30.preskoc.barbershop` do `sessionStorage` pri zavretí okna z rezervácie; sľub „nič sa neukladá“ (README ×2, hlavička) a testy to nepokrývajú | `prihlaska.js:38, 188`; `vernost/README.md:57`, `barbershop-30/README.md:75` |
| S2 | drobná (trvá) | v skúške pod „nič sme neodoslali“ veta „Uložili sme ju aj v tomto prehliadači… QR kód“ | `prihlaska.js:198` |
| S3 | drobná (trvá) | v náhľade živé odkazy na `headspa30.sk` (404, kým systém nebeží), tlačidlo sekcie drží `href` (dlhé podržanie / `auxclick`), rezervácia skutočná | `index.html:841–842`, `prihlaska.js:73, 145, 160, 201` |
| N4 | drobná (trvá) | `vernost-skuska-browser.mjs` bez `NODE_PATH` nespustiteľný, hlavička to nepíše | `vernost-skuska-browser.mjs:4`, `shot.mjs:37` |
| T1 | drobná (trvá) | hu „Kártya minta“, kostrbatá veta `qr` (sk/cs/de/en); „kérem“ je v poriadku | `prihlaska.js:25–29` |
| T2 | drobná (trvá) | žargón v M1–M3/M5, „predvolené 1“ označiť ako predvoľbu kódu | TEXTY časť 4 |
| T3 | drobná (trvá) | U+200B v `odovzdavka.md:16` | odovzdávka |

Otázka pre majiteľa: pôvod API a adresa kartičky na `headspa30.sk` pre zákazníkov Barbershopu (časť 1; M1).

Odchýlka kontrolóra: Chromium (8 s) bežalo súbežne s cudzím prehliadačom, lebo opakovaný príkaz beh nepodmienil výsledkom `pgrep` (úvod).
Nič iné ODLOŽENÉ nie je; `spusti.sh` celý som nespúšťal (vyžaduje prehliadač) – platí výsledok z `oprava-1.md` (111 v poriadku, 0 zlyhalo),
API časť nahradená sondami v časti 5.
