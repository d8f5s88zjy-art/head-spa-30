# Kontrola bezpečnosti, údajov a textov – dávka V6 (kolo 1)

Nezávislý kontrolór, 22. 10. 2026, 05:35 UTC. Strom `$SP/hs-vernost` (HEAD `1f45265`, vetva `barbershop-vernost`), nič som
nemenil (`git status --short` po kontrole prázdny). `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Odovzdávka: `$SP/barber/lahky-telefon/v2/stavba-v6/odovzdavka.md`. Merítko: `vernost.md` časť 5 (bezpečnosť), 6 (skúška), 7 (texty).

**Verdikt: prevziať s 1 strednou a 5 drobnými poznámkami.** Nič, čo by dávku zastavilo; stredný nález je medzera medzi
sľubom „v skúške sa nič neukladá“ a jednou cestou, ktorá zapisuje do `sessionStorage`.

Prehliadačové kontroly sú **ODLOŽENÉ** (cudzí prehliadač bežal počas celej kontroly: `pgrep -c -f "headless_shell|chrome-linux/chrome"`
→ 1, 8 a 1 v troch meraniach 05:0x–05:35 UTC; `pgrep -f "http.server 86[01]"` → 0). Všetko ostatné je overené bez prehliadača.

---

## 1. Čo prihláška posiela, kam a čo ukladá (vernost.md časť 5)

| Otázka | Zistenie | Dôkaz |
|---|---|---|
| Polia pri registrácii | `prevadzka`, `meno`, `telefon`, `email` (aj prázdny), `suhlas_karta: true`, `suhlas_spravy` (true/false), `web` (pasca); JSON, `credentials: 'omit'`, bez cookies | `vernost/web/prihlaska.js:172–173` |
| Odosiela sa len po súhlase | bez zaškrtnutia „Áno, chcem“ sa `submit` skončí pred `fetch` (`uloz(K_NIE…)`, otvorí rezerváciu) | `prihlaska.js:156–162` |
| Kam | `API` = `data-api` alebo `https://www.headspa30.sk/vernost/api/`; `?a=registracia` (POST), `?a=karta&k=<token>` (GET raz za návštevu, 4 s po načítaní) | `prihlaska.js:18, 171, 257`; `index.html:923` bez `data-api` → predvolená adresa |
| Nič iné | žiadna analytika, žiadne tretie strany; odkaz „Ochrana údajov“ v okne je z `API` (`OCHRANA`), v sekcii natvrdo na `www.headspa30.sk` | `prihlaska.js:20, 145`; `barbershop-30/index.html:842` |
| V prehliadači | `localStorage`: `v30.karta.barbershop` (odkaz s tokenom), `v30.nie.barbershop` (60 dní), `v30.ma.barbershop`; `sessionStorage`: `v30.preskoc.barbershop`, `v30.overene.barbershop` | `prihlaska.js:22, 36–38, 188, 255–256` |
| Mimo prihlášky | web používa len `b30.lang`, `b30.lang.no` (ponuka jazyka) a voľbu hudby (`atmosfera.js` `KEY`) | `grep -n "localStorage" barbershop-30/assets/*.js` → `app.js:596`, `i18n.js:66,203,261,268`, `atmosfera.js:80–81` |

Zhoda s TEXTY-PRE-MAJITELA.md časť 3 (odsek pre `pravne.html`): kľúče aj životnosť (60 dní, relácia) sedia s kódom.

**Otázka pre majiteľa (nie chyba dávky):** pôvod API je iba `https://www.headspa30.sk/vernost/api/` (`prihlaska.js:18`);
server povoľuje pôvody `headspa30.sk`, GitHub Pages a `barbershop30.sk` (`vernost/lib/jadro.php:14–15`). Pre Barbershop to
znamená: odkaz na kartičku zákazníka Barbershopu začína `www.headspa30.sk/…` a údaje zákazníkov Barbershopu ležia na
hostingu HEAD SPA 30. Technicky to dáva zmysel (jeden server, prevádzky oddelené `prevadzka` v každom dopyte,
`api/index.php:90, 123–124`), právne a značkovo je to rozhodnutie majiteľa. TEXTY to pomenúvajú (časť 2 bod 3, M1) – v poriadku,
len to nech pri M1 majiteľ výslovne potvrdí alebo odmietne.

## 2. Skúšobný režim – naozaj nič neposiela ani neukladá? (vernost.md časť 6)

Spustené:

```
node barbershop-30/source/tools/vernost-skuska-test.mjs
OK: index.html bez data-skuska; v skúške fetch 0×, zápisov do úložiska 0, štítok SKÚŠKA, potvrdenie s menom, ukážka kartičky bez QR a bez osobných údajov.
node barbershop-30/source/tools/vernost-footer-test.mjs
OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.
grep -c data-skuska barbershop-30/index.html index.html   → 0 / 0
cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js → bez výstupu (kópia zhodná, e2e.mjs:25 prejde)
```

Čítaním kódu: `fetch` sa v skúške nevolá vôbec (`prihlaska.js:169–170` vracia náhradu po 600 ms), `uloz()` má poistku
`if (SKUSKA) return;` (`:36`), `overUlozenu()` v skúške dostane `u = ''` a skončí (`:254`), ukážka je zo stálych reťazcov
`T[l].ukazkaMeno/ukazkaKod` a `'0'` (`:214–230`), bez QR, bez mena a telefónu z formulára (test `:99–100` to tvrdí).

**Nález S1 (stredná): skúška zapisuje do `sessionStorage` v ceste cez rezerváciu.** `relacia()` (`prihlaska.js:38`) nemá
poistku `SKUSKA`; `dlg._teraz` (`:188`) ju volá pri zavretí okna bez voľby (×, Esc, klik vedľa), keď bolo okno otvorené
z odkazu na rezerváciu. Vlastný test (kópia `assets/vernost.js` v `vm`, `data-skuska`, klik na odkaz rezervácie, potom ×):

```
okno otvorené: true
zápisy po zavretí ×: [["session","v30.preskoc.barbershop","1"],["session","v30.preskoc.barbershop","1"]]
```

Dosah: len relácia (po zavretí karty prehliadača zmizne), žiadne osobné údaje, nič sa neposiela. Ale (a) README a
odovzdávka (§3 „nič sa neukladá“, „zápisov do úložiska 0“) sľubujú nulu – test `vernost-skuska-test.mjs` meria len cestu
zo sekcie, cestu z rezervácie nie; (b) majiteľ v náhľade po prvom zavretí okna pri „Rezervovať“ už v tej istej karte
prehliadača otázku neuvidí a nebude vedieť prečo. Návrh: v `relacia()` pri `h !== undefined` v skúške nezapisovať
(alebo v `dlg._teraz` pridať `!SKUSKA`), zmenu urobiť v zdroji a skopírovať, do `vernost-skuska-test.mjs` pridať cestu
z odkazu rezervácie so zavretím ×. Ak sa správanie ponechá, napísať to do TEXTY (časť 1 „Len v náhľade“) a nahlad-patch.md.

**Nález S2 (drobná): protirečivý text potvrdenia v skúške.** Po „odoslaní“ v skúške okno ukáže štítok „SKÚŠKA –
… nič sme neodoslali“ a hneď pod nadpisom vetu `okT` „Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii
QR kód z kartičky.“ (`prihlaska.js:198` `karta ? L.okT : L.maT`, v skúške `karta = 'ukazka'`). V skúške sa nič neuložilo
a QR neexistuje. Návrh: v skúške namiesto `okT` použiť `skuskaT` alebo vetu „Takto bude vyzerať potvrdenie; v skúške sa
nič neuložilo.“ (8 jazykov), alebo to aspoň napísať majiteľovi do TEXTY časť 1.

**Nález S3 (drobná): živé odkazy v náhľade.** V skúške sú viditeľné odkazy „Ochrana údajov“ v sekcii
(`index.html:842` → `https://www.headspa30.sk/vernost/ochrana-udajov.html`) a v okne (`prihlaska.js:145`, z `API`), a
„Pokračovať na rezerváciu“ otvorí skutočnú rezerváciu (`:161, 201`). Nie je to požiadavka stránky (iba klik používateľa)
a `vernost-skuska-browser.mjs:22` cudzie adresy blokuje, ale majiteľ na telefóne klikne a dostane 404 z `headspa30.sk`
(systém tam ešte nebeží). Návrh: jedna veta v nahlad-patch.md a v TEXTY „Len v náhľade“: odkaz na zásady v náhľade
nefunguje, kým systém nebeží (M1–M2); rezervácia je skutočná.

Poistky, že skúška neunikne na web: `vernost-skuska-test.mjs:11–12` tvrdí, že `index.html` v strome nemá `data-skuska` a
značka skriptu je presne `<script src="assets/vernost.js" data-prevadzka="barbershop" defer>` (teda ani `data-zapnute`);
`data-zapnute` dopĺňa len `tools/vernost-priprav.py:36–40` v `_site`; ak by oba atribúty boli spolu, `SKUSKA` vyhráva a
`fetch` sa nevolá (`:169`). Úryvok v `nahlad-patch.md` mieri na presnú značku a kontroluje, že je raz (python `assert`).

## 3. Kontrola uloženej kartičky (https, pôvod, cesta)

`kartaUlozena()` (`prihlaska.js:53–62`): `new URL(...)`, rovnaký `origin` ako základ API, `https:` (http len pre
`127.0.0.1`/`localhost`, a aj to len keď je na nich samotné API, lebo `origin` sa musí zhodovať), bez používateľa a hesla,
`pathname === '/vernost/karta/'`, `search` presne `?k=<22 znakov [A-Za-z0-9_-]>`, bez `#`. Test prešiel pre 8 neplatných
adries vrátane `example.com`, `http:`, `#bad`, `&extra=1`, `karta/../admin/`, `user:pw@`, `javascript:alert(1)`,
„nie je adresa“ (`vernost-footer-test.mjs:47–49`). Odkaz v skrytom bloku bez kartičky nemá `href` (`:73`), klik sa zastaví
(`:246`). V poriadku; prísnejšie než balík hs-chatgpt (tam kópia ≠ zdroj).

## 4. XSS v prihláške a v sekcii

- `prihlaska.js` nepoužíva `innerHTML`/`insertAdjacentHTML` (`grep -n innerHTML vernost/web/prihlaska.js` → 0 nálezov);
  všetko cez `el()` + `append` textu (`:39–44`), chyba zo servera cez `textContent` (`:182`), meno v nadpise ako text (`:196`),
  `href` len z overenej adresy (`:72, 202`), `window.open(u)` len po `kartaUlozena()` (`:249`).
- Sekcia v `index.html:837–844` je statická; `i18n.js` prekladá textové uzly cez `nodeValue` (`i18n.js:112, 146`) a
  preskakuje `[data-no-i18n]` (`:80`), okno má `data-no-i18n` + `translate="no"` (`prihlaska.js:117`). `innerHTML` v
  `i18n.js:218, 265` skladá len vlastné statické reťazce (prepínač jazyka, ponuka), nie údaje používateľa.
- Server meno neescapuje (`text()` len orezáva riadiace znaky, `jadro.php:148–153`) – `POST` s menom
  `<img src=x onerror=alert(1)>` prešiel (`{"ok":true,…}`). Je to v poriadku, kým sa meno všade kreslí ako text:
  `karta/karta.js:73, 213` cez `el()`; `innerHTML` v `karta.js:90` a `admin/admin.js:175` je len `qrSvg()` z kódu
  recepcie (`[A-HJKMNP-Z2-9]{8}`, `jadro.php:56–59`). Poznámka do budúcna: každé nové vykreslenie mena musí ostať textové.

## 5. Server `api/index.php` (len čítanie + lokálny beh na porte 8727, dočasný priečinok dát zmazaný, `vernost/data/meno.php` zmazaný, strom čistý)

```
?a=stav → {"ok":true,"php":"8.4.19","sqlite":true,…,"admin":{"barbershop":false,"headspa":false},"databaza":true}  (bez config.php)
OPTIONS z https://www.barbershop30.sk → 204 + Access-Control-Allow-Origin/Methods/Headers/Max-Age
OPTIONS z https://zly.example → 204 bez Access-Control-* (prehliadač POST zastaví)
POST application/x-www-form-urlencoded (jednoduchý CSRF formulár) → 415 "Očakávam JSON."
POST JSON z https://zly.example → 403 "Zakázaný pôvod."; Origin: null → 403
POST bez suhlas_karta → 400 "Kartičku založíme len so súhlasom."
?a=klienti bez hlavičky → 403; s X-Vernost-Admin: 1 bez relácie → 401
22 registrácií za sebou (po 2 predošlých) → 18× 200, potom 429 (limit 20/h na odtlačok IP, api/index.php:79)
GET /vernost/lib/jadro.php → 403 (router napodobňuje .htaccess)
```

CSRF: JSON `Content-Type` vynúti preflight (`api/index.php:14`), `Origin` mimo zoznamu → 403 (`:15–16`,
`jadro.php:167–171`), admin navyše hlavička `X-Vernost-Admin`, vlastný pôvod, relácia `HttpOnly`+`SameSite=Strict`+`secure`
pri https (`jadro.php:220, 223–233`). Limity: registrácia 20/h, kartička 120/10 min, e‑mail 2/deň na adresu
(`api/index.php:79, 120`; `jadro.php:252–257`); IP len ako HMAC odtlačok so soľou z cesty DB, najviac deň (`jadro.php:195–198`);
`X-Forwarded-For` len spoza proxy (`:185–193`). Pasca `web` vracia „ok“ bez zápisu (`api/index.php:78`). Odpoveď `existuje`
prezradí, že číslo kartičku má – vedome prijaté riziko (`README`), bez zmeny v tejto dávke. Žiadne nálezy.

CI brána `tools/vernost-priprav.py`: zapína `data-zapnute` len keď `karta/` a `ochrana-udajov.html` vrátia HTML 200 a
`api/?a=stav` JSON s `ok`, `databaza`, `sqlite`, `admin.<prevadzka> === true` (`:15–30, 38`); heslá sa iba merajú (`:34, 38`),
nikam sa neposielajú; `python3 -I tools/test-vernost-priprav.py` → `Ran 4 tests … OK`. `pages.yml:46–53` má len tento krok;
`env` s `HESLO_B`/`HESLO_H` zo `secrets.VERNOST_HESLO_*` ostáva. Tajomstvá v strome ani v textoch nie sú (len názvy).

## 6. Texty (V6e TEXTY-PRE-MAJITELA.md, sekcia, okno)

Prešlo:
- Sekcia (`index.html:838–839`) je doslova z `vernost.md` časť 7 (pomlčka → čiarka), bez čísel bodov a bez konkrétnych
  odmien; tykanie ako zvyšok webu („Sleduj nás“, „Rezervuj“); 7 slovníkov majú všetkých 5 kľúčov (vlastná kontrola, výpis vyššie v relácii).
- Slovo „AI“ ani „umelá inteligencia“ sa v sekcii, slovníkoch, prihláške ani v troch súboroch odovzdávky nevyskytuje
  (`grep -rn -i '\bAI\b\|umel[áa] intelig' …` → 0).
- Sídlo FACEPALM, s.r.o. je v TEXTY len ako návrh so značkou **[predpoklad – overí majiteľ]** (časť 2); adresa pochádza
  z balíka `hs-chatgpt/vernost/ochrana-udajov.html:28`, podklad `barbershop-30/docs/CONTENT_SOURCES.md:26` má iba odkaz na
  ORSR; v strome `vernost/ochrana-udajov.html:28` ostáva bez sídla. Správne – žiadny nový fakt vo webe.
- Vykanie majiteľovi je dôsledné („určíte vy“, „ak to nechcete, povedzte“, „zadáte“); citované texty webu tykajú (správne).
- 8 jazykov: 8 náhodných viet okna + 2 vety sekcie na jazyk (semienko 20261022, výpis v relácii) – preklady verné
  slovenčine, rovnaký register, bez pridaných sľubov; štítok skúšky a ukážka (`skuska…odmeny`) sú vo všetkých 8 v `T`.
- M1–M7 pokrývajú všetko z `vernost.md` časť 8/9: hosting, FTP, heslo adminu, e‑mail, pravidlá, obsluha, schválenie textov; poradie podľa závislostí.

**Nález T1 (drobná): drobnosti v prekladoch a jednej slovenskej vete.** `hu` `ukazka` „Kártya minta“ → „Kártyaminta“
(zložené slovo spolu); `hu` `chcem` „Igen, kérem a hűségkártyát“ je zdvorilostná forma, kým zvyšok okna tyká („Add meg…“)
→ „Igen, kérek hűségkártyát“; veta `qr` „QR kód ukáže kartička, zadarmo na recepcii“ (sk, podobne de/en) je kostrbatá →
„QR kód bude na kartičke; na recepcii ho ukážeš zadarmo.“ Nič z toho nemení význam.

**Nález T2 (drobná): žargón v M1–M7.** „či tam beží PHP“ (M1), „súbor s odtlačkami hesiel“ (M2), „admin“ (M3, M5) sú pre
majiteľa bez vysvetlenia; názvy tajomstiev (`FTP_SERVER`…) sú nutné podľa pravidiel, ale patria skôr do zátvorky
„pre technika“. „systém má predvolené 1“ (M5) je číslo – je to predvolená hodnota kódu (`api/index.php:129`
`body_za_navstevu`, '1'), nie pravidlo podniku; napísať „kým nepoviete inak, systém počíta 1 bod za návštevu“, aby to
nevyzeralo ako hotové rozhodnutie. Návrh: tri krátke vsuvky, žiadna zmena obsahu.

**Nález T3 (drobná): neviditeľný znak v odovzdávke.** `odovzdavka.md` riadok 16 obsahuje U+200B („zo strom​u“); do
textov pre majiteľa sa nedostal (TEXTY a nahlad-patch bez ZWSP/BOM/SHY – vlastná kontrola python). Len vymazať.

Poznámka (nie nález): veta okna „vymeň ich za zľavu alebo produkt“ (`prihlaska.js:23`, kľúč `u`, 8 jazykov) je jediný
konkrétny sľub odmeny; odovzdávka aj TEXTY ju správne viažu na M5. Sekcia sľubuje len „pripíšeme body; odmeny a akcie
vidíš na kartičke“ – to je v medziach návrhu (časť 7) a systému (`api/index.php:127–130` kartička odmeny a akcie naozaj nesie).

## 7. Súhrn

| # | Závažnosť | Nález | Kde |
|---|---|---|---|
| S1 | stredná | skúška zapisuje `v30.preskoc.barbershop` do `sessionStorage` pri zavretí okna z rezervácie; sľub „nič sa neukladá“ a test to nepokrývajú | `prihlaska.js:38, 188`; test `vernost-skuska-test.mjs` |
| S2 | drobná | v skúške sa pod štítkom „nič sme neodoslali“ ukáže „Uložili sme ju aj v tomto prehliadači… QR kód“ | `prihlaska.js:198` |
| S3 | drobná | v náhľade vedú odkazy „Ochrana údajov“ na živý `headspa30.sk` (404, kým systém nebeží); „Pokračovať na rezerváciu“ je skutočná | `index.html:842`, `prihlaska.js:145, 161, 201` |
| T1 | drobná | hu „Kártya minta“/„kérem“, kostrbatá veta `qr` (sk/de/en) | `prihlaska.js:26` (hu), `:23` (sk) |
| T2 | drobná | žargón v M1–M3/M5 („beží PHP“, „odtlačky hesiel“, „admin“), „predvolené 1“ označiť ako predvoľbu kódu | TEXTY časť 4 |
| T3 | drobná | U+200B v `odovzdavka.md:16` | odovzdávka |

Otázka pre majiteľa: pôvod API a adresa kartičky na `headspa30.sk` pre zákazníkov Barbershopu (časť 1 vyššie; M1).

ODLOŽENÉ (prehliadač obsadený, `pgrep` ≠ 0 počas celej kontroly): `sh vernost/testy/spusti.sh` celý (API časť nahradená
ručným behom vyššie), `vernost-skuska-browser.mjs` (sk + en, 390×844), `i18n-test.mjs`, vzhľad sekcie a štítku. Postup:
keď `pgrep -f "http.server 86[01]"` nič nenájde a `pgrep -c -f "headless_shell|chrome-linux/chrome"` je 0, spustiť
postupne na portoch 8720–8723, každý do 3 minút, jeden prehliadač.
