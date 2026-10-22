# Kontrola kódu, kolo 2: dávka V6 (vernostná kartička na webe BARBERSHOP 30, V6a–V6e) po oprave N1

Senior kontrolór, 22. 10. 2026, 05:43–05:47 UTC, nezávisle, nič v strome nezmenené (`git status --short` prázdny pred aj po
kontrole). Strom `$SP/hs-vernost` (vetva `barbershop-vernost`, 5 commitov `cbd97c2 … 52ce64f` nad f624ee8),
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Vstupy: `odovzdavka.md`, `oprava-1.md`, `kontrola-kod-1.md`; diff `git diff f624ee8..HEAD` (22 súborov, +583/−83;
oproti kolu 1 pribudlo len `vernost/testy/e2e.mjs` +9/−2 v commite `52ce64f`).
Prehliadač bol voľný (`pgrep -af "http.server 86[01]"` → nič, rc=1; `pgrep -c -f "headless_shel[l]|chrome-linux/chrom[e]"` → 0),
preto som prehliadačové testy spustil sám, po jednom, každý pod 30 s, porty 8730–8733; po každom `pgrep` → 0 živých Chromií.
Moje snímky, `php.log` a skript: `$SP/kontrola-v6-2/` (5,4 MB, 22 súborov).

**Výsledok: PREŠLO (vážny nález N1 z kola 1 je opravený a overený: celý `spusti.sh` 111 v poriadku, 0 zlyhalo).**
Bez nového vážneho nálezu. Ostávajú 2 stredné nálezy z kola 1 (N2, N3; oprava ich zámerne nemenila – zadanie opravy bolo len na vážne)
a drobnosti; k nim 2 nové drobné (D1, D2). Bezpečnostné poistky (fetch, úložisko, tajomstvá, CI brána, `data-skuska`) držia.

## 1. Overenie opravy N1 (commit `52ce64f`, `vernost/testy/e2e.mjs:204–212`)

| Kontrola | Dôkaz |
|---|---|
| Oprava mení len test | `git show 52ce64f --stat` → `vernost/testy/e2e.mjs | 11 +++++++++--`, 1 súbor; zdroj prihlášky ani kópia nedotknuté |
| Celý test vernosti prejde | `SNIMKY=$SP/kontrola-v6-2 VERNOST_PORT=8730 VERNOST_PUSH_PORT=8731 sh vernost/testy/spusti.sh` (05:44:51–05:45:19 UTC): `API`, `admin`, `karta a push`, `súbežnosť`, `oddelenie prevádzok`, `prehliadač` → **`VÝSLEDOK: 111 v poriadku, 0 zlyhalo`**, rc=0 |
| Logika opravy | `e2e.mjs:205` spočíta všetky `[data-vernost-karta]`; `:206` pre každý: `href === uložená`, nie je v `[hidden]` predkovi, `[data-vernost-nova]` skrytý, `[data-vernost-ma]` odkrytý (na HEAD SPA bez popisov `some([])=false`, `every([])=true` → triviálne platí); `:207` `pocet >= 1 && every(...)`; `:208–212` každý odkaz klikne → `popup.url() === uložená`, popup zavrie. Sekcia (`index.html:841`) je v DOM pred pätičkou (`:888`), takže označenie „posledný = pätička“ sedí |
| Upratanie po teste | `vernost/config.php` a `vernost/data/meno.php` neexistujú; `pgrep -af "php -S 127.0.0.1:873|push-moc[k]"` → nič; Chromium 0 (2 s po skončení; hneď po `tail` ich bolo ešte 3 – dobiehajúce ukončenie) |

## 2. Nálezy

### Stredné z kola 1, stále otvorené (nie sú podmienkou prijatia; oprava ich podľa zadania nemenila)

**N2 (stredná) – v skúške sa zapíše `sessionStorage['v30.preskoc.barbershop']` pri zatvorení okna otvoreného z rezervácie bez voľby.**
Znovu overené na HEAD (`$SP/kontrola-v6-2/n2-preskoc.mjs`, vm na `assets/vernost.js` s `data-skuska`, klik na
`a[href*="barbershop30.sk/rezervacia"]`, potom `dlg.close()`):
```
okno otvorené: true
zápisy po zatvorení okna bez voľby v skúške: [["session","v30.preskoc.barbershop","1"]]
```
`prihlaska.js:36` `uloz()` skúšku rešpektuje, `:38` `relacia()` nie. Hlavička (`:12–13`) a README tvrdia „do úložiska sa nič nezapíše“.
Nie je to bezpečnostný problém (sessionStorage, bez osobných údajov), ale sľub v dokumentácii neplatí a testy skúšky
(`vernost-skuska-test.mjs`, `vernost-skuska-browser.mjs:45`) tok rezervácia → × nekryjú. Návrh ako v kole 1: `if (SKUSKA) return null;`
v zápise `relacia()` + kópia `cp` + krok v oboch testoch, alebo priznať v hlavičke a odovzdávke.

**N3 (stredná) – na počítači ide sekcia do pravého stĺpca mriežky, nie „pod kartu kontaktu“.**
Kód nezmenený: `style.css:1187` `.contact-grid { grid-template-columns: minmax(0,1.2fr) minmax(0,1fr) }`, blok je druhé dieťa
(`index.html:837`), `grep grid-column style.css | grep vernost` → nič. Platí meranie z kola 1 (sekcia x:804 vedľa karty, fakty
spadnú pod kartu). Kým je blok `hidden`, živý web to neovplyvní; pre náhľad majiteľovi treba buď `grid-column: 1`, alebo opraviť opis
v TEXTY-PRE-MAJITELA.md (časť 1) a odovzdávke (časť 4, bod 5).

### Drobné z kola 1, stále otvorené

- **N4** – `vernost-skuska-browser.mjs:4` bez `NODE_PATH` (`grep NODE_PATH` nájde len `i18n-test.mjs:2`); bez neho padne import
  `../shot.mjs` na `playwright`. Spustil som s `NODE_PATH=/opt/node22/lib/node_modules`.
- **N5** – `prihlaska.js:106` `[el('b', {}, [L.skuska]), L.skuskaT]` bez medzery: textový obsah „SKÚŠKASkúšobný režim…“ (vizuálne
  rieši `margin-right`, čítačka nie).
- **N6** – `index.html:841` tlačidlo sekcie je `<a>` bez `aria-haspopup` (`grep -c aria-haspopup index.html` → 0); otvára modálne okno.
- **N7** – `vernost.js` 9 723 → 12 635 B gzip (+2 912 B; `git show <c>:… | gzip -9c | wc -c`), texty skúšky v 8 jazykoch sú v kóde aj
  naživo; `defer`, bez práce pri skrole – vedomý náklad, odovzdávka ho priznáva (časť 4).
- **N8** – mimo dávku (`i18n-test.mjs`, tabuľa hodín hu), v tomto kole nespúšťané.

### Nové drobné

**D1 (drobná) – `e2e.mjs:206`: nepoužitý parameter.** `odkazy.evaluateAll((as, u) => …, ulozena)` – `u` sa v tele nepoužíva, `ulozena`
sa porovnáva až v `:207` v Node. Mŕtvy argument, funkčne bez dopadu. Návrh: `evaluateAll((as) => …)` bez druhého argumentu.

**D2 (drobná) – odovzdávka nie je aktualizovaná o výsledok opravy.** `odovzdavka.md` (mtime 21. 10. 20:57) časť 4 bod 1 stále píše
„`spusti.sh` ODLOŽENÝ … očakávané: prihláška na oboch weboch prejde“ a časť 1 uvádza 4 commity; `oprava-1.md` §4 len navrhuje nahradiť.
Po kole 2 platí: 5 commitov, `spusti.sh` 111/0 (oprava aj táto kontrola), `vernost-skuska-browser.mjs` 20/20 (kontrola 1 aj 2),
`i18n-test.mjs` prešiel (kolo 1), `vaha.mjs` spustený (nižšie). Návrh: doplniť do odovzdávky jedným odsekom.

## 3. Čo prešlo (s dôkazom)

| Kontrola | Dôkaz |
|---|---|
| Zhoda zdroja a kópie (e2e.mjs:25) | `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → bez výstupu, rc=0 (33 598 B oba); v `spusti.sh` kontrola kópie prešla |
| Skrytý odkaz a sekcia bez `data-zapnute` | `index.html:837` `hidden data-vernost-sekcia`, `:888` `<li hidden data-vernost-footer>`; `node barbershop-30/source/tools/vernost-footer-test.mjs` → `OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.`; `prihlaska.js:53–62` (pôvod API, https alebo 127.0.0.1/localhost, cesta `karta/`, 22-znakový token, bez hash/používateľa/hesla), `:246` klik v skrytom bloku `preventDefault`; v `spusti.sh` bez `data-zapnute`: „prihláška mlčí a rezervácia ide rovno“ prešlo |
| Skúška nevolá `fetch`, nezapisuje `v30.*` (okrem N2) | `node …/vernost-skuska-test.mjs` → `OK: index.html bez data-skuska; v skúške fetch 0×, zápisov do úložiska 0, štítok SKÚŠKA, potvrdenie s menom, ukážka kartičky bez QR a bez osobných údajov.`; `NODE_PATH=… B30_PORT=8732 node …/vernost-skuska-browser.mjs --snimky=$SP/kontrola-v6-2` (05:45:48–05:45:55) → **20× OK** (sk aj en: sekcia a pätička viditeľné, štítok, „Kartička je pripravená, Peter!“ bez servera, žiadny odkaz na skutočnú kartičku, ukážka bez mena/telefónu/QR, `v30.*` prázdne, fetch na API 0, 0 požiadaviek na headspa30.sk, bez chýb JS), `Všetky kontroly skúšky prešli`; snímky `skuska-okno.png` (štítok SKÚŠKA + veta, tmavé okno značky), `skuska-ukazka.png` (0 bodov, „Ukážka“, „Kód UKÁŽKA“, rámik namiesto QR, „Odmeny a akcie doplní prevádzka.“); `prihlaska.js:168–171` (v skúške `Promise` namiesto `fetch`), `:254` (`overUlozenu` preskočená), `:36` (`uloz` nič nezapíše) |
| `data-skuska` nie je v strome | `grep -c data-skuska barbershop-30/index.html index.html` → `0`/`0`; `git grep -n data-skuska -- '*.html'` → nič (rc=1); `vernost-skuska-test.mjs:11–13` to stráži; `nahlad-patch.md` dáva sed aj python s kontrolou „práve raz“ a zakazuje `data-zapnute` v náhľade |
| CI brána | `tools/vernost-priprav.py:17–30` (karta/ a ochrana-udajov.html HTML 200 s `<html`, `api/?a=stav` JSON `ok`/`databaza`/`sqlite` true, `admin.<prevádzka> === true`; každá výnimka → `{}`), `:34` bez hesla ≥ 10 znakov sa server nevolá, `:36–41` starý príznak sa odstráni; výpis iba „zapnutá/vypnutá“ (žiadna dĺžka, žiadne heslo); `python3 -I tools/test-vernost-priprav.py` → `Ran 4 tests in 0.006s … OK` (404, text/plain, výpadok siete, opakovaný beh, bez hesla sa `dostupnost` nevolá) |
| `pages.yml` len vernostný krok | diff má jediný hunk `@@ -47,9 +47,10 @@` (dva `sed` → `python3 tools/vernost-priprav.py` + komentár), `env` `HESLO_B/HESLO_H` nezmenené; `yaml.safe_load` → `yaml ok, kroky: 11` |
| i18n 0 nepreloženého textu | python porovnanie f624ee8 ↔ HEAD pre cs/de/en/hu/pl/sr/uk: 262 → 266 kľúčov, presne 4 pridané (veta sekcie, „Vytvoriť kartičku“, „Otvoriť kartičku“, „Ochrana údajov“), 0 zmenených, 0 odstránených; všetky 4 preložené v každom slovníku (nepreložené ostávajú len pôvodné vlastné mená/značky, napr. „Nikolas“, „Fade“, ktoré boli rovnaké už vo f624ee8) |
| Čísla veľkostí | `git show <c>:<súbor> \| gzip -9c \| wc -c`: `index.html` 16 466 → 16 732 B (+266 B), `vernost.js` 9 723 → 12 635 B; surové `index.html` 89 289 B – zhodné s odovzdávkou. `NODE_PATH=… B30_PORT=8733 node barbershop-30/source/tools/vaha.mjs` (05:45:57–05:46:10): desktop bez filmu do `load` 460 KB (HTML 87, CSS 78, písma 64, JS 58, AVIF 172), s prológom 711 KB + 1 447 KB; mobil bez filmu 186 KB, s prológom 708 KB + 1 708 KB. Poznámka: `vaha.mjs` v rozpise nevykazuje `vernost.js` (33,6 KB surové, `defer`) ani na mobile žiadny JS – vlastnosť nástroja, nie dávky; rozdiel oproti `docs/CHECKS.md` §4 (383/351 KB) je starší než táto dávka (dávka pridáva do HTML +938 B surových) |
| `index.html` zmeny len pätička + sekcia | diff má 2 hunky: `@@ -833,6 +833,15 @@` (blok sekcie) a `@@ -876,7 +885,7 @@` (`<li hidden data-vernost-footer>`); koreňový `index.html` HEAD SPA v diffe nie je; značka skriptu `:923` bez ďalších atribútov |
| Žiadne tajomstvá v strome | `git diff f624ee8..HEAD \| grep -niE '^\+.*(heslo\|password\|ftp\|secret\|token)'` → len názvy (`HESLO_B`, `HESLO_H`), `karta.password` z `URL`, testovací `password_hash("test-heslo-…")` v `spusti.sh` (bol už vo f624ee8, mení sa len port); `git grep` v strome mimo `.md` nájde len `secrets.FTP_PASSWORD` v `ftp.yml` (názov tajomstva) a vstupné polia `type=password` |
| Prístupnosť tlačidla a okna | kód od kola 1 nezmenený: okno `dialog` s `aria-labelledby=v30h` (`prihlaska.js:111`), `showModal()` (`:189`), chyba `role=alert` (`:125`), fokus na „Áno, chcem…“ (`:148`), zatvorenie × s `aria-label` (`:140`); popis `[data-vernost-ma] hidden` v názve odkazu nie je; `aria-disabled` na odkaze v skrytom bloku (`:81`). Meranie z kola 1 (Enter otvorí, Esc vráti fokus, 50–52 px) platí; otvorené drobnosti N5, N6 |
| Kvalita kódu opravy | `node --check vernost/testy/e2e.mjs` OK; oprava je v štýle súboru (`over()` s detailom pri zlyhaní, bez novej závislosti), pokrýva sekciu aj pätičku namiesto zúženia na pätičku (druhá možnosť z kola 1); jediná výhrada D1 |
| Commity a pravidlá | 5 commitov po slovensky; `git log --format=%B f624ee8..HEAD \| grep -niE 'claude\|anthropic\|co-authored\|signed-off\|AI\b'` → nič (rc=1); autor commitov je rovnaký ako f624ee8 a celej vetvy (identita repozitára, nie podpis v správe); žiadny push (vetva lokálna), žiadny merge/reset; iné stromy nedotknuté; po kontrole žiadne `php -S`, `push-mock` ani Chromium, `config.php` neexistuje |

## 4. Poznámky bez nálezu

- Tmavé okno a ukážka sú dizajn značky (`REVIZIA-PO-SKEPTIKOVI.md` bod 5): farby `#v30p[data-p=barbershop]` (`prihlaska.js:94`)
  nezmenené, snímky `skuska-okno.png`/`skuska-ukazka.png` to potvrdzujú; poznámka majiteľovi je v TEXTY (časť 1) a `nahlad-patch.md`.
- Texty bez nových faktov: sekcia = `vernost.md` časť 7, bez čísel bodov a odmien; TEXTY-PRE-MAJITELA.md od kola 1 nezmenené (mtime
  21. 10. 20:55), sídlo FACEPALM označené [predpoklad – overí majiteľ].
- Odporúčanie pred integráciou (nie podmienka): N2 (jeden riadok + `cp` + 2 kroky testov) a N3 (jeden riadok CSS alebo oprava opisu),
  potom znova `cmp`, `vernost-skuska-test.mjs`, `vernost-skuska-browser.mjs` a snímka 1440 px; D2 doplniť do odovzdávky.
