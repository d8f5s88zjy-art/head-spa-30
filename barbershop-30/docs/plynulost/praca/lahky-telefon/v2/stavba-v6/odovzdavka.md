# Odovzdávka dávky V6 (vernostná kartička na webe BARBERSHOP 30: V6a–V6e)

Senior staviteľ, 21. 10. 2026. Pracovný strom `$SP/hs-vernost` (git worktree, vetva `barbershop-vernost` z f624ee8),
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`. Iné stromy (`hs-lahky`,
`hs-recepcia`, `hs-chatgpt`) nezmenené; nič nenasadené, žiadny `git push`, žiadna požiadavka na živé servery; žiadne
tajomstvá v strome ani v textoch (len názvy). Porty: PHP server vernosti 8720 (pridelené 8720–8729).

## 1. Commity (lokálne, `git log --oneline f624ee8..HEAD`)

| # | Hash | Správa | Čo (súbor:riadok) |
|---|---|---|---|
| 1 | `cbd97c2` | BARBERSHOP 30: odkaz na vernostnú kartičku skrytý, kým systém nebeží (V6a) | `barbershop-30/index.html:888` `<li hidden data-vernost-footer>`; `vernost/web/prihlaska.js:53–81` prísne `kartaUlozena()` (URL: pôvod API, https alebo 127.0.0.1/localhost pri lokálnom `data-api`, cesta `karta/`, token 22 znakov, bez hash/používateľa) a `obnovPaticku()` (odkryje `[data-vernost-footer],[data-vernost-sekcia]` len pri `data-zapnute` alebo platnej kartičke; odkaz v skrytom bloku bez `href`, `aria-disabled`), `uloz()/zmaz()` ju volajú, poslucháč `storage`; klik na `[data-vernost-karta]` bez prihlášky a kartičky sa v bloku zastaví (`:199–201`); kópia `barbershop-30/assets/vernost.js` (`cmp` zhodná); test `barbershop-30/source/tools/vernost-footer-test.mjs` (vlastný podľa vzoru balíka, pridané: sekcia, popisy nova/ma, lokálny http, 8 neplatných adries); testy vernosti berú porty z `VERNOST_PORT`/`VERNOST_PUSH_PORT` (`vernost/testy/spusti.sh:7–13`, `e2e.mjs:7`, `push-mock.mjs:28`; predvolené 8077/8078 ostávajú); README |
| 2 | `f1a47bb` | Vernosť: CI zapne prihlášku len pri funkčnom serveri (V6b) | `tools/vernost-priprav.py` a `tools/test-vernost-priprav.py` z balíka `hs-chatgpt` s `encoding='utf-8'` (ROZHODNUTIE, riadok D6a-0) a doplneným docstringom (brána `karta/`, `ochrana-udajov.html` HTML 200, `api/?a=stav` JSON `ok`, `databaza`, `sqlite`, `admin.<prevadzka> === true`; heslá iba merané); `.github/workflows/pages.yml:49–53` len vernostný krok (sed podľa dĺžky hesla nahradený `python3 tools/vernost-priprav.py`), nič iné z balíkového pages.yml |
| 3 | `72d9537` | BARBERSHOP 30: sekcia Vernostná kartička s tlačidlom Vytvoriť kartičku (V6c) | `barbershop-30/index.html:836–845` blok `hidden data-vernost-sekcia` v `.contact-grid` pod `.contact-main` (`#rezervacia`): `h3` „Vernostná kartička“, text podľa `vernost.md` časť 7 (bez čísel bodov a odmien; pomlčka nahradená čiarkou), `<a class="btn btn-ghost" data-vernost-karta>` s `<span data-vernost-nova>Vytvoriť kartičku</span><span data-vernost-ma hidden>Otvoriť kartičku</span>`, odkaz „Ochrana údajov“ na `vernost/ochrana-udajov.html`; `assets/style.css:1365–1369`; kľúče v 7 slovníkoch `assets/i18n/*.json` (4 nové kľúče, „Vernostná kartička“ už bola) |
| 4 | `1f45265` | Vernosť: skúšobný režim len pre náhľad (V6d) | `prihlaska.js:48–50` `SKUSKA = data-skuska`, `aktivne() = ZAPNUTE || SKUSKA`; `:31` `uloz()` v skúške nič nezapíše; `:98–106` `CSS_SKUSKA` + `stitok()` (štítok „SKÚŠKA“ + veta, 8 jazykov v `T`, kľúče `skuska…odmeny`); `:168–176` v skúške sa `fetch` nevolá, po 600 ms náhrada `{ok:true, existuje:false, karta:''}`; `hotovo()` `:195–212` v skúške tlačidlo „Ukážka kartičky“ namiesto odkazu; `ukazka()` `:214–230` statická kartička (značka, 0 bodov, meno „Ukážka“, kód UKÁŽKA, rámik „QR kód ukáže kartička…“, „Odmeny a akcie doplní prevádzka.“), bez QR a bez údajov z formulára; `overUlozenu()` v skúške preskočená; kópia zhodná; testy `vernost-skuska-test.mjs` (bez prehliadača) a `vernost-skuska-browser.mjs` (Chromium); README |
| – | – | V6e: texty na schválenie, **nie do webu** | `$SP/barber/lahky-telefon/v2/stavba-v6/TEXTY-PRE-MAJITELA.md` (sekcia v 8 jazykoch zo strom​u, zásady so sídlom [predpoklad – overí majiteľ], odsek o úložisku `v30.*` pre `pravne.html`, M1–M7 bez žargónu); bez commitu, lebo nič z toho nejde do webu |

Úryvok pre skladač náhľadu (`data-skuska` **len v náhľade**): `$SP/barber/lahky-telefon/v2/stavba-v6/nahlad-patch.md`.

`git diff f624ee8..HEAD --stat`: 22 súborov, +574 / −81 riadkov (pages.yml 7, README 4+8, 7× i18n, style.css 5,
vernost.js/prihlaska.js 137, index.html 11, 3 nové testy, 2 nástroje CI, testy vernosti porty).

## 2. Testy s výstupom

| Príkaz | Výsledok |
|---|---|
| `node barbershop-30/source/tools/vernost-footer-test.mjs` | `OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.` |
| `node barbershop-30/source/tools/vernost-skuska-test.mjs` | `OK: index.html bez data-skuska; v skúške fetch 0×, zápisov do úložiska 0, štítok SKÚŠKA, potvrdenie s menom, ukážka kartičky bez QR a bez osobných údajov.` (stub `fetch` hádže chybu a počíta volania: 0) |
| `python3 -I tools/test-vernost-priprav.py` | `Ran 4 tests … OK` (odpovede servera napodobnené, bez siete) |
| `grep -c data-skuska barbershop-30/index.html index.html` | `0` / `0` |
| `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` | bez výstupu (kópia zhodná, kontrola `e2e.mjs:25` prejde) |
| `node --check barbershop-30/assets/vernost.js`; `sh -n vernost/testy/spusti.sh`; YAML `pages.yml` (`yaml.safe_load`, 11 krokov) | v poriadku |
| statická kontrola i18n (5 textov sekcie v 7 slovníkoch, python) | `chýba: []` vo všetkých 7; slovníky 262 → 266 kľúčov |
| API PHP servera na porte 8720 (`php -S 127.0.0.1:8720 … router.php`, dočasný `config.php` a `VERNOST_DATA`, po teste zmazané) | `?a=stav` → `{"ok":true,"php":"8.4.19","sqlite":true,…,"admin":{"barbershop":true,"headspa":true},"databaza":true}`; registrácia bez súhlasu 400; cudzí pôvod 403; z `d8f5s88zjy-art.github.io` → `{"ok":true,"existuje":false,"karta":"http://127.0.0.1:8720/vernost/karta/?k=…"}`; `/vernost/lib/jadro.php` 403 |

Veľkosti (`git show <c>:<súbor> \| gzip -9c \| wc -c`, bez názvu súboru v hlavičke):

| Súbor | f624ee8 | po V6a (cbd97c2) | po V6c (72d9537) | po V6d (HEAD) |
|---|---|---|---|---|
| `barbershop-30/index.html` | 16 466 B | 16 473 B (+7 B) | 16 732 B (**+259 B**, limit ≤ 512 B) | 16 732 B |
| `barbershop-30/assets/vernost.js` (`defer`, mimo prvého obrazu) | 9 723 B | 10 487 B (+764 B) | 10 487 B | 12 635 B (+2 148 B: texty skúšky v 8 jazykoch, CSS ukážky len v skúške, ukážka) |

Surové: index.html 88 351 → 89 289 B. Rozpočet HTML ≤ 14 600 B gzip prekračuje už vetva lite (ROZHODNUTIE §5.1), táto dávka
pridáva +266 B.

## 3. Bezpečnosť a prenos z balíka (ROZHODNUTIE, riadky D6a-0, pages.yml, vernost, Testy)

- Prevzaté upravené: `vernost-priprav.py` + test (`encoding='utf-8'`), vernostný krok `pages.yml`, princíp `obnovPaticku()`
  a prísna kontrola uloženej kartičky (živá chyba R1: do `localStorage` podstrčená cudzia adresa by sa otvorila z pätičky;
  teraz platí len `https://<pôvod API>/vernost/karta/?k=<22 znakov>` bez hash a bez používateľa, `prihlaska.js:53–62`).
  Rozdiel oproti balíku: `http` sa pripúšťa len pre `127.0.0.1`/`localhost`, lebo lokálny test (`spusti.sh`, `data-api` na
  127.0.0.1) inak nemôže prejsť; balík porušoval pravidlo „najprv zdroj, potom kópia“ (jeho `assets/vernost.js` ≠
  `prihlaska.js`), tu je zmena v zdroji a kópia je zhodná. Odkaz mimo skrytých blokov (HEAD SPA, `index.html:718`) ostáva
  bežným odkazom na vlastnú doménu, mení sa len Barbershop.
- Neprevzaté (patria integrácii): 404 koreňa, `barbershop-30/404.html`, `pravne.html`, admin, zvyšok `pages.yml`, sídlo v
  `ochrana-udajov.html` (len ako návrh v TEXTY-PRE-MAJITELA.md, časť 2).
- Skúška: `fetch` sa v skúške vôbec nevolá (nie je to len blokovanie CORS), `uloz()` nič nezapíše, `overUlozenu()` sa
  preskočí, ukážka je zo stálych reťazcov (`ukazka()`), bez QR a bez mena/telefónu z formulára; `data-skuska` nikdy v strome
  (test) a nikdy spolu s `data-zapnute` (nasadenie atribút pridáva len `vernost-priprav.py`, náhľad len skladač).
- Tajomstvá: v CI len `HESLO_B`/`HESLO_H` z `secrets.VERNOST_HESLO_*` a len ich dĺžka; v texte pre majiteľa len názvy
  (`FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR`, `FTP_DOMENA`, `VERNOST_HESLO_BARBERSHOP`, `VERNOST_EMAIL_OD`).
- Vzhľad: tmavé okno prihlášky a ukážka sú dizajn značky (`REVIZIA-PO-SKEPTIKOVI.md` bod 5); farby nezmenené, majiteľovi
  to je napísané (TEXTY, časť 1 „Vzhľad“; nahlad-patch.md).

## 4. Čo ostalo a čo je ODLOŽENÉ

**ODLOŽENÉ (prehliadač obsadený iným tímom počas celej dávky: `pgrep -f "http.server 86[01]"` → 2 procesy,
`pgrep -c -f "headless_shell|chrome-linux/chrome"` → 13–14, kontrolované 20:4x až 20:57 UTC, aj čakaním 10 minút):**
1. `sh vernost/testy/spusti.sh` celý (`VERNOST_PORT=8720 VERNOST_PUSH_PORT=8724`): `e2e.mjs` po API časti spúšťa Chromium;
   API časť bola overená ručne na porte 8720 (časť 2). Očakávané: kontrola `e2e.mjs:25` prejde (kópia zhodná), prihláška na
   oboch weboch prejde, lebo lokálny `data-api` na 127.0.0.1 je v `kartaUlozena()` pripustený.
2. `B30_PORT=8721 node barbershop-30/source/tools/vernost-skuska-browser.mjs --snimky=$SP/barber/lahky-telefon/v2/stavba-v6`
   (skúšobný tok v Chromiu, sk + en, 390×844; syntax overená `node --check`).
3. `B30_PORT=8722 node barbershop-30/source/tools/i18n-test.mjs` (7 jazykov; statická kontrola kľúčov prešla, časť 2).
4. `B30_PORT=8723 node barbershop-30/source/tools/vaha.mjs` (prenesené bajty; HTML prírastok meraný `gzip -9c`: +259 B).
5. Vzhľad sekcie (`.contact-vernost` v mriežke pod kartou kontaktu, 390/1440 px) a okna so štítkom „SKÚŠKA“: bez snímok.
Postup: keď `pgrep` nič nenájde, spustiť 1–4 postupne, každý do 3 minút, jeden prehliadač.

**Ostalo (nie je chyba dávky):**
- V6e nemá commit (texty nejdú do webu); sídlo FACEPALM v `ochrana-udajov.html` ostáva ako návrh [predpoklad – overí majiteľ].
- Veta okna „vymeň ich za zľavu alebo produkt“ (`prihlaska.js`, kľúč `u`) sľubuje odmenu; spustiť až s odmenou (M5) alebo
  upraviť v 8 jazykoch (majiteľ).
- `vernost.js` narástol o 2,9 kB gzip (texty skúšky v 8 jazykoch sú v kóde aj mimo skúšky; CSS ukážky sa pridáva len v skúške);
  skript je `defer`, bez práce pri skrole. Ak to prekáža, texty skúšky sa dajú presunúť do samostatného súboru načítaného len v náhľade.
- Rozpočet `index.html` ≤ 14 600 B gzip (README) prekračuje už vetva lite (ROZHODNUTIE §5.1); táto dávka +266 B.
- M1–M7 u majiteľa (TEXTY-PRE-MAJITELA.md, časť 4): bez nich sekcia a pätička na živom webe ostanú skryté.
