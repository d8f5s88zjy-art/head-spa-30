# Zákaznícka (vernostná) karta na webe BARBERSHOP 30: stav, čo chýba, čo ide hneď, plán

Senior inžinier (web + jednoduché API) a produktový manažér, 21. 10. 2026. Len čítanie: strom `hs-lahky/barbershop-30`
(HEAD **f624ee8**, vetva `barbershop-lahky-telefon`), serverová časť `hs-chatgpt/vernost/` a dokumenty v `barber/`.
Žiadny prehliadač, žiadny server, žiadne meranie. Zápis len sem.
Druhý prechod 21. 10. 2026 (~16:30 UTC): každý citovaný riadok znova overený (`grep -n`/`awk`) v stromoch
`hs-lahky` (f624ee8) a `hs-chatgpt` (c129f58 + staged); opravené tri nepresnosti a doplnená časť 4.1.

Cesty: `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`;
`index.html`, `assets/vernost.js`, `assets/i18n/*.json` sú v `$SP/hs-lahky/barbershop-30/`; `vernost/…`, `tools/…`,
`.github/workflows/…` sú v `$SP/hs-lahky/` (commit 0f26b25 z 13. 10. 2026); „staged“ = necommitnuté, do indexu pridané
zmeny v `$SP/hs-chatgpt/` (strom odovzdania ChatGPT, `git status` ukazuje `M`/`A`).

Označenie istoty: **[kód]** = dokázané v súbore (súbor:riadok); **[dokument]** = z dokumentu tímu; **[predpoklad]** =
neoverené (bez siete sa nedá zistiť, či na `headspa30.sk` niečo beží); **[rozhodnutie majiteľa]** = stojí peniaze,
vyžaduje účet, prístup, právny text alebo súhlas – bez majiteľa sa nerobí.

---

## 0. Zhrnutie

- Systém vernostnej kartičky **už existuje celý**: prihláška na webe (`assets/vernost.js`, 188 riadkov, 8 jazykov),
  server (PHP 8.1 + SQLite, `vernost/api/index.php`, 418 riadkov), stránka kartičky s QR (`vernost/karta/`), admin pre
  recepciu (`vernost/admin/`), zásady ochrany údajov pre obe prevádzky (`vernost/ochrana-udajov.html`), nasadenie
  (`ftp.yml`, `pages.yml`) a testy (`vernost/testy/`). Rozhodnuté a postavené 13. 10. 2026
  (`$SP/hs-lahky/docs/VERNOSTNA-KARTA.md:3–6`).
- **Na Barbershope dnes nefunguje nič z toho**, lebo chýbajú tri veci mimo kódu: (1) server `vernost/` nasadený na
  hosting `headspa30.sk` (cez FTP majiteľa), (2) tajomstvo `VERNOST_HESLO_BARBERSHOP` v GitHube, (3) odmeny a body od
  majiteľa (`OTAZKY-PRE-MAJITELA.md:23`, otázka 15 – bez odpovede). Kým to chýba, prihláška mlčí (`vernost.js:40–43`)
  a pätička vedie zákazníka Barbershopu na adresu HEAD SPA 30 (`index.html:879`) – živá chyba D6a‑0
  (`OTAZKY-PRE-MAJITELA.md:36–38`).
- **Hneď bez majiteľa** vieme: skryť chybný odkaz v pätičke (hotové v staged strome, treba preniesť), postaviť sekciu
  „Vernostná kartička“ s tlačidlom **Vytvoriť kartičku** v 7 jazykoch (zobrazí sa až so zapnutým serverom), skúšobný
  režim len v náhľade (jasne označený, nič sa neodosiela), CI, ktoré prihlášku zapne až po overení servera, a návrhy
  textov. Právne texty a všetko, čo stojí peniaze alebo prístup, schvaľuje majiteľ.

---

## 1. Čo zákazník na Barbershope vidí dnes (f624ee8)

| Miesto | Čo sa deje | Dôkaz |
|---|---|---|
| Pätička, stĺpec „Sleduj nás“ | Odkaz **„Vernostná kartička“** je viditeľný, `href="https://www.headspa30.sk/vernost/karta/"`. | `index.html:879` [kód] |
| Klik na ten odkaz | Skript ho zachytí len pri `data-zapnute` alebo uloženej kartičke; inak `return` a prehliadač ide na `headspa30.sk`. Skript nemá `data-zapnute`. | `vernost.js:171–177` (brána riadok 173), `index.html:914` [kód] |
| Cieľ odkazu | Ak server beží: stránka „Kartičku otvoríš z odkazu … povedz na recepcii“ pod značkou „Vernostná kartička 30“, bez mena prevádzky. Ak nebeží: 404 HEAD SPA 30 s telefónom 0911 153 136. | `karta/karta.js:43–56` [kód]; 404 podľa `PLAN-D6-D7.md:138` [dokument]; či server beží, nevieme [predpoklad: nebeží – otázka 15 je otvorená] |
| Odkazy na rezerváciu (31× `barbershop30.sk/rezervacia`, z toho 5 tlačidiel `btn-primary`; 2× Booqme) | Prihláška pred rezerváciou sa **neukáže** (`aktivne()` je `false`), rezervácia sa otvorí rovno. | `vernost.js:159–168` (riadok 164), `index.html:139, 208, 812, 833, 893` (`btn-primary`); počty `grep -o` [kód] |
| Preklad pätičky | Kľúč „Vernostná kartička“ je v 7 slovníkoch (cs, de, en, hu, pl, sr, uk). | `assets/i18n/*.json` [kód] |
| Pri vypnutom JS alebo starom prehliadači | Skript sa ukončí (`!window.fetch || !window.HTMLDialogElement`), odkaz v pätičke ostáva živý. | `vernost.js:11` [kód] |

Záver: zákazník dnes nemá **žiadnu** cestu, ako si kartičku založiť, a jediný viditeľný prvok ho posiela k inej
prevádzke. To je horšie než nič – preto je prvý krok skrytie odkazu (časť 4, bod A).

---

## 2. Čo už existuje (inventár) a kde sú rozdiely medzi stromami

### 2.1 Prihláška na webe – `assets/vernost.js` (kópia `vernost/web/prihlaska.js`, README `vernost/README.md:50–52`)

- Spúšťa sa pred rezerváciou (zachytáva odkazy `barbershop30.sk/rezervacia`, Booqme `/barbershop30`,
  `a[data-booking-link]` – `vernost.js:14`) a z prvkov `[data-vernost-karta]` (pätička; `vernost.js:171–177`).
- Nič nie je predvolene zaškrtnuté (`vernost.js:81`); bez „Áno, chcem“ sa nič neodošle a rezervácia sa otvorí
  (`vernost.js:111–117`); tlačidlo „Založiť kartičku“ bez súhlasu je vypnuté (`vernost.js:107`).
- Polia: meno, telefón (rovnaký ako v rezervácii), nepovinný e‑mail, samostatný súhlas so správami, pasca na roboty
  (`vernost.js:82–93`); overenie mena, telefónu, e‑mailu na strane prehliadača (`vernost.js:118–121`).
- Odoslanie: `POST https://www.headspa30.sk/vernost/api/?a=registracia`, JSON `{prevadzka, meno, telefon, email,
  suhlas_karta, suhlas_spravy, web}`, `credentials: 'omit'` (`vernost.js:13, 123–125`).
- Po úspechu uloží odkaz na kartičku v `localStorage` (`v30.karta.barbershop`), ukáže „Kartička je pripravená“ a
  tlačidlá „Pokračovať na rezerváciu“ / „Otvoriť kartičku“ (`vernost.js:129–130, 144–156`). Pri zlyhaní servera:
  „Rezervácia funguje, kartičku ti založíme na recepcii“ (`vernost.js:20` kľúč `eServer`, `131–135`).
- Texty v 8 jazykoch vrátane srbčiny (`vernost.js:20–27`), jazyk podľa `<html lang>` (`vernost.js:29`), okno má
  `data-no-i18n`, takže ho všeobecný prekladač `i18n.js` neprepisuje (`vernost.js:68`, `i18n.js:80, 90`).
- Vzhľad: tmavé okno `#141210`, text `#f1e9dd`, akcent `#e0601c`, písmo Fraunces/Manrope (`vernost.js:59`),
  pozadie za oknom `rgba(8,7,6,.7)` (`vernost.js:47`). **Pozor na požiadavku „žiadne čierne polia“** – okno je zámerne
  tmavé v značke; svetlý variant (paper `#F1E9DD`) je zmena vzhľadu → [rozhodnutie majiteľa], technicky 6 premenných CSS.
- Brána: `ZAPNUTE = skript.hasAttribute('data-zapnute')` (`vernost.js:42`). Atribút dopĺňa až nasadenie, stránka sa
  servera vopred nepýta (`vernost.js:40–41`).

### 2.2 Server – `vernost/` (PHP 8.1+, SQLite, hosting HEAD SPA 30 na Forpsi; `vernost/README.md:3`)

- Prevádzky natvrdo: `barbershop` (Barbershop 30, Mostná 30, 0951 267 203, prevádzkovateľ FACEPALM, s.r.o., IČO 52231381,
  web **zatiaľ adresa github.io**) a `headspa` (`vernost/lib/jadro.php:8–13`). Povolené pôvody pre prihlášku:
  `www.headspa30.sk`, `headspa30.sk`, `d8f5s88zjy-art.github.io`, `www.barbershop30.sk`, `barbershop30.sk`
  (`jadro.php:14–15`), CORS len pre ne (`jadro.php:173–181`).
- Registrácia: pasca na roboty → tichý „ok“ (`api/index.php:76`), limit 20 registrácií za hodinu na odtlačok IP
  (`api/index.php:79`, `jadro.php:195–205`), súhlas povinný (`:81`), telefón sa normalizuje na `+421…`
  (`jadro.php:155–162`), existujúce číslo → `existuje: true` a opätovné poslanie e‑mailu (`:90–94`), inak nový klient s
  tokenom a kódom pre recepciu a odkaz `karta/?k=<token>` (`:97–101`).
- Kartička (`karta/`): CSP `default-src 'self'`, `noindex` (`karta/index.html:6–7`); značka, farby a ikona podľa
  prevádzky (`karta/karta.js:59–62`), meno, kód, body, história, odmeny, akcie, novinky (`api/index.php:127–130`),
  pridanie na plochu, offline, upozornenia, vypnutie správ, zrušenie s vymazaním (`README.md:14–15`, `karta.js:194–208`).
- Admin (`vernost/admin/`): prihlásenie prevádzka + heslo, klienti, zápis návštevy (predvolene 1 bod), odmeny, akcie,
  hromadné správy, export CSV (`README.md:21–31`). Heslá len ako odtlačky v `config.php`, ktorý vytvára nasadenie
  (`tools/vernost-config.php:7–10`, `config.example.php:2–3`).
- Databáza vzniká sama; ak sa dá, mimo verejného priečinka `../vernost-data/`, inak v `vernost/data/` s náhodným názvom
  a zákazom prístupu (`jadro.php:73–77`, `vernost/.htaccess:6–8`, `README.md:44–46`).
- Zásady ochrany údajov pre **obe** prevádzky vrátane Barbershopu a FACEPALM, s.r.o. (`vernost/ochrana-udajov.html:23,
  26, 28`); staged oprava dopĺňa sídlo Šalgovská ulica 1039/43, 951 15 Mojmírovce (jediný rozdiel `vernost/` medzi
  stromami: `diff -rq`, riadok 28). `CONTENT_SOURCES.md:26` uvádza len odkaz na výpis ORSR, samotnú adresu sídla sme
  bez siete neoverili → [predpoklad], pred zverejnením skontrolovať vo výpise ORSR.
- Testy: `sh vernost/testy/spusti.sh` – lokálny PHP server, Playwright (API, bezpečnosť, prihláška na oboch weboch,
  kartička, admin; `README.md:76–78`); test stráži, že `barbershop-30/assets/vernost.js` je presná kópia
  `vernost/web/prihlaska.js` (`vernost/testy/e2e.mjs:25`).

### 2.3 Nasadenie a CI

- `ftp.yml`: beží len s tajomstvami `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD` (+ `FTP_DIR`, `FTP_DOMENA`) (`ftp.yml:4–9,
  28–30`); balík `_ftp/` pribalí `vernost/` bez testov (`tools/ftp-balik.sh:14–17`); `config.php` vytvorí z
  `VERNOST_HESLO_BARBERSHOP`, `VERNOST_HESLO_HEADSPA`, `VERNOST_EMAIL_OD` (`ftp.yml:36–43`); nahráva FTPS, záložne FTP
  (`ftp.yml:50–72`). Prihlášku na HEAD SPA zapína sám (`ftp.yml:44–49`); **web Barbershopu cez FTP nejde**
  (`ftp-balik.sh:12` kopíruje len koreň HEAD SPA).
- `pages.yml` (GitHub Pages, kde dnes Barbershop beží): skopíruje `prihlaska.js` a doplní `data-zapnute` do
  `barbershop-30/index.html`, **len ak je heslo ≥ 10 znakov** (`pages.yml:44–52`). Vo verzii f624ee8 sa server neoveruje.
- Staged (`hs-chatgpt`): `pages.yml:51` volá `python3 tools/vernost-priprav.py`, ktorý zapne prihlášku iba ak
  `karta/`, `ochrana-udajov.html` vrátia HTML 200 a `api/?a=stav` vráti JSON s `ok`, `databaza`, `sqlite` a
  `admin.barbershop === true` (`tools/vernost-priprav.py:13–24, 30–38`); má jednotkový test
  (`tools/test-vernost-priprav.py`). `api/?a=stav` vracia práve tieto polia (`api/index.php:60–64`).

### 2.4 Rozdiely medzi stromami (dôležité pre prenos)

| Vec | f624ee8 (`hs-lahky`) | staged (`hs-chatgpt`) |
|---|---|---|
| Pätička | `<li><a href="https://www.headspa30.sk/vernost/karta/" data-vernost-karta>` viditeľné (`index.html:879`) | `<li hidden data-vernost-footer>…` (`barbershop-30/index.html:844`) |
| `vernost.js` | bez odkrývania pätičky; `kartaUlozena()` regexom (`:44`) | `obnovPaticku()` odkryje `[data-vernost-footer]` len pri `data-zapnute` alebo uloženej kartičke; `kartaUlozena()` overuje pôvod a cestu cez `new URL` (staged `vernost.js:44–63`) |
| CI | `sed` podľa dĺžky hesla (`pages.yml:51`) | `vernost-priprav.py` s overením servera |
| Ochrana údajov | adresa „Mostná 30“ pri FACEPALM | doplnené sídlo Mojmírovce |
| Pozor | – | staged `barbershop-30/assets/vernost.js` **nie je** zhodný s `vernost/web/prihlaska.js` (diff ukazuje `obnovPaticku` len v kópii) → test `e2e.mjs:25` by padol; pri prenose upraviť **najprv** `prihlaska.js` a skopírovať |

---

## 3. Čo treba, aby vytvorenie karty na Barbershope naozaj fungovalo (reťaz závislostí)

Poradie je dané závislosťami; bez kroku 1 nemá zmysel krok 2 atď.

1. **Hosting pre server `vernost/`** [rozhodnutie majiteľa]. Navrhnutý je webhosting HEAD SPA 30 (`headspa30.sk`,
   Forpsi, PHP 8.1+, SQLite; `README.md:3`). Dôsledky, ktoré musí majiteľ vedieť:
   - adresa kartičky zákazníka Barbershopu bude `https://www.headspa30.sk/vernost/karta/?k=…` (`jadro.php:27–29`,
     `api/index.php:66`) – na kartičke je meno a telefón Barbershopu (`karta.js:99, 124`), ale doména je HEAD SPA;
   - údaje klientov Barbershopu (FACEPALM, s.r.o.) ležia na hostingu inej prevádzky; zásady to opisujú
     (`ochrana-udajov.html:26`), ale zmluvný vzťah (spoločný prevádzkovateľ / sprostredkovateľ) je právna otázka –
     [rozhodnutie majiteľa, právnik];
   - alternatíva: vlastný hosting s PHP pre `barbershop30.sk` – nevieme, kto ho spravuje (otázka 21,
     `OTAZKY-PRE-MAJITELA.md:29`); kód je pripravený (povolené pôvody už obsahujú `barbershop30.sk`, `jadro.php:14–15`;
     `data-api` v skripte prepne adresu, `vernost.js:13`).
2. **Nasadenie na FTP** [rozhodnutie majiteľa – prístup]. Tajomstvá `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`,
   `FTP_DIR`, `FTP_DOMENA` v GitHube (`ftp.yml:4–9`). Ručné nahratie ZIP‑u (`pages.yml:53–54`) **nestačí**: balík
   neobsahuje `config.php` s odtlačkami hesiel (`ftp-balik.sh:14`, `config.example.php:2–3`) – musel by ho niekto
   vyrobiť ručne (`config.example.php:6`). Odporúčame tajomstvá; heslá v chate ani v repozitári nikdy (`README.md:23`).
3. **Heslo do adminu Barbershopu** `VERNOST_HESLO_BARBERSHOP` (≥ 10 znakov) [rozhodnutie majiteľa]. Bez neho:
   admin Barbershopu zamknutý (`tools/vernost-config.php:9–10`), `stav.admin.barbershop = false`, prihláška ostane
   vypnutá (`vernost-priprav.py:34`). Kto heslo dostane (recepcia) a kde ho uchová – majiteľ.
4. **E‑mailová schránka na doméne hostingu** `VERNOST_EMAIL_OD` [rozhodnutie majiteľa, voliteľné]. Bez nej sa odkazy
   na kartičku e‑mailom neposielajú (`README.md:42`, `jadro.php:252–254`); zákazník má kartičku len v prehliadači a na
   recepcii (text prihlášky s tým počíta, `vernost.js:20` kľúč `maT`).
5. **Kontrola po nasadení** (my, bez majiteľa, ale až po 1–3): `https://www.headspa30.sk/vernost/api/?a=stav` →
   `ok`, `sqlite`, `databaza`, `admin.barbershop`, `email`, `ip_cez_proxy` (`api/index.php:60–64`, `README.md:47–48`).
6. **Obsah vernostného programu** [rozhodnutie majiteľa – nič nevymýšľame]: body za návštevu (systém má predvolené 1,
   `README.md:26`, `api/index.php:129`), aspoň jedna odmena (názov, cena v bodoch; na začiatku nie je žiadna,
   `README.md:28`), prípadné akcie. Bez odmeny sľubuje prihláška „vymeň ich za zľavu alebo produkt“ (`vernost.js:20`)
   niečo, čo na kartičke nie je – spustiť až s odmenou.
7. **Recepcia**: kto sa prihlási do `/vernost/admin/`, ako zapíše návštevu (QR skener v Chrome na Androide/počítači,
   inak prepísať kód; `README.md:24–27`). Krátke zaškolenie – [rozhodnutie majiteľa – ľudia a zariadenie].
8. **Zapnutie na webe** – automatické: po 1–3 ďalšie nasadenie Pages doplní `data-zapnute` (staged
   `vernost-priprav.py`), pätička a sekcia sa odkryjú (`obnovPaticku`), prihláška sa začne pýtať pred rezerváciou.
9. **Právne texty** [rozhodnutie majiteľa]: schválenie `ochrana-udajov.html` (vrátane sídla), odpoveď na otázku 22
   (kontakt pre otázky k údajom, `OTAZKY-PRE-MAJITELA.md:30`), `barbershop-30/pravne.html` (N05; staged) s úložiskom
   `v30.*`.
10. **Neskôr**: po presune webu na `www.barbershop30.sk` zmeniť `web` prevádzky v `jadro.php:10` (dnes github.io) –
    drobná zmena kódu, no závisí od otázky 21.

---

## 4. Čo vieme urobiť hneď bez majiteľa (bez peňazí, účtov a právnych textov)

Všetko nižšie mení len verejný statický web a CI; nič neodosiela údaje a nič nesľubuje, kým server nebeží.

**A. Skryť chybný odkaz v pätičke (D6a‑0 / N01)** – preniesť staged riešenie na vetvu lite:
`<li hidden data-vernost-footer>` + `obnovPaticku()` v `vernost/web/prihlaska.js` → `cp` do
`barbershop-30/assets/vernost.js` (`README.md:50–52`). Odkaz sa ukáže len pri `data-zapnute` alebo pri platnej uloženej
kartičke. Zákazník už nikdy neskončí na HEAD SPA. Odhad: +7 B gzip HTML (`PLAN-D6-D7.md:293`), +~0,6 kB JS.

**B. Sekcia „Vernostná kartička“ s tlačidlom „Vytvoriť kartičku“** – v páse kontaktu pod kartou „Kde nás nájdeš“
(`index.html:819–849`, kotva `#rezervacia`), kde D6b plánuje „Pred návštevou“ (`OTAZKY-PRE-MAJITELA.md:58`, D6b), nie nová
scéna (rozpočet HTML 14 600 B gzip, `OTAZKY-PRE-MAJITELA.md:45`). Obsah: nadpis, 3 vety, tlačidlo
`<a class="btn btn-ghost" data-vernost-karta>Vytvoriť kartičku</a>` (skript ho už obsluhuje, `vernost.js:171–177`), odkaz
„Ochrana údajov“ na `vernost/ochrana-udajov.html`. Blok má `hidden data-vernost-sekcia` a odkrýva ho `obnovPaticku()`
spolu s pätičkou (rozšíriť selektor z `[data-vernost-footer]` na oba). Text len z toho, čo systém naozaj robí
(návrh v časti 7); bez čísel bodov a bez konkrétnych odmien. Texty v 7 slovníkoch `assets/i18n/*.json` (kľúče ako pri
„Vernostná kartička“); okno prihlášky má preklady vlastné (`vernost.js:20–27`).

**C. Tlačidlo v okne prihlášky bez rezervácie** už existuje (`otvor('')` → „Založiť kartičku“, `vernost.js:94, 176`).
Netreba stavať; stačí B.

**D. CI, ktoré prihlášku zapne až po overení servera** – preniesť staged `tools/vernost-priprav.py` +
`tools/test-vernost-priprav.py` a riadok `pages.yml:51`. Bez toho by samotné heslo zaplo prihlášku aj pri nenasadenom
serveri (`pages.yml:51` vo f624ee8) a zákazník by dostal chybu „Kartičku sa teraz nepodarilo založiť“ (`vernost.js:133`).

**E. Skúšobný režim v náhľade** – časť 6. Majiteľ si na iPhone prejde celý tok (sekcia → okno → „Kartička je
pripravená“ → ukážka kartičky) bez servera a bez odoslania čohokoľvek.

**F. Stránka kartičky** – existuje (`vernost/karta/`) v tmavom dizajne so značkou prevádzky; nestaviame druhú. Do
náhľadu dáme statickú **ukážku** s označením „Ukážka“ (časť 6). Prípadný svetlý variant okna a kartičky → majiteľ.

**G. Návrhy textov** (sekcia v SK + 7 jazykov, e‑mail s odkazom už existuje v `api/index.php:69–73`) – pripravíme ako
návrh; **schvaľuje majiteľ** (najmä všetko právne).

**H. Oprava sídla v `ochrana-udajov.html`** je staged; fakt je z ORSR (`CONTENT_SOURCES.md:26`), ale ide o právny text →
preniesť ako návrh, zverejniť až po schválení [rozhodnutie majiteľa].

### 4.1 Prečo nejde „kartička hneď, bez servera“ (dočasné riešenie len v prehliadači)

Majiteľ chce, aby si zákazník kartu vytvoril. Lákavá skratka je kartička uložená len v telefóne (bez servera).
Neodporúčame ju, lebo by to bola kartička bez obsahu: body zapisuje recepcia v admine (`README.md:24–27`), kartička
ich číta zo servera (`karta.js:244–247`), a bez servera niet ani kódu pre recepciu, ani odmien, ani zrušenia s vymazaním.
Zákazník by dostal sľub („zbieraj body“, `vernost.js:20`), ktorý nikto neplní – presne typ chyby, ktorú D6a odstraňuje.
Jediná poctivá cesta k živej kartičke je M1 (nasadenie servera), a to závisí od majiteľa (časť 3, body 1–3).
Čo však ide hneď, je úplný **skúšobný tok v náhľade** (časť 6), na ktorom majiteľ uvidí, čo zákazník dostane, a rozhodne.

Čo **nerobíme** bez majiteľa: nasadenie servera, tajomstvá, odmeny/body, zmena právnych textov na živom webe, svetlý
vzhľad okna, Apple/Google Wallet (`docs/VERNOSTNA-KARTA.md:35` – poplatky), čokoľvek s rezervačným systémom tretej strany.

---

## 5. Bezpečnosť a ochrana údajov (čo sa posiela, kde sa ukladá, GDPR minimum)

**Čo odchádza z prehliadača** (len po zaškrtnutí „Áno, chcem“ a kliku na tlačidlo): `prevadzka=barbershop`, meno,
telefón, e‑mail (ak zadaný), `suhlas_karta=true`, `suhlas_spravy` (true/false), pasca `web` – JSON cez HTTPS na
`www.headspa30.sk/vernost/api/?a=registracia`, bez cookies (`vernost.js:123–125`). Raz za návštevu webu sa pri uloženej
kartičke overí, že ešte existuje: `GET api/?a=karta&k=<token>` (`vernost.js:180–187`). Nič iné (žiadna analytika,
žiadne tretie strany; `karta/index.html:6` CSP `'self'`).

**Čo ostáva v prehliadači zákazníka** (`vernost.js:17, 30–33`): `localStorage` `v30.karta.barbershop` (odkaz s tokenom
= prístup ku kartičke), `v30.nie.barbershop` (čas odmietnutia, 60 dní), `v30.ma.barbershop`; `sessionStorage`
`v30.preskoc.barbershop`, `v30.overene.barbershop`. Stránka kartičky si pamätá posledný stav pre offline
(`karta.js:245–246`). Toto patrí do `pravne.html` (N05 už s tým počíta: „0 cookies, b30.lang, v30.*“).

**Kde sa ukladá na serveri**: SQLite tabuľka `klient` (prevadzka, meno, telefon, email, token, kod, súhlasy a ich čas,
zdroj, vytvorená; `jadro.php:82–87`), jedinečnosť `(prevadzka, telefon)`; súbor mimo verejného priečinka alebo
s náhodným názvom a zákazom prístupu (`jadro.php:73–77`, `.htaccess:6–8`). IP sa neukladá, len odtlačok so soľou na
limity, najviac deň (`jadro.php:195–198`).

**Oddelenie prevádzok**: každý dopyt filtruje `prevadzka` (`api/index.php:90, 224, 244…`); admin Barbershopu nevidí
HEAD SPA. Admin vyžaduje reláciu `HttpOnly` + `SameSite=Strict`, hlavičku `X-Vernost-Admin` a vlastný pôvod
(`jadro.php:225–228`, `README.md:69`).

**GDPR minimum, ktoré už je v kóde**: súhlas nie je predvolený (`vernost.js:81`), správy majú samostatný súhlas
(`vernost.js:85`), odkaz na zásady priamo v okne (`vernost.js:100`), právny základ súhlas (`ochrana-udajov.html:41`),
uchovanie do zrušenia, najviac 3 roky bez návštevy (`:44`), zrušenie s vymazaním samým zákazníkom (`:56`,
`karta.js:194–208`), vypnutie správ bez straty bodov (`:57`), príjemcovia (služby upozornení, poštový server; `:49–50`).

**Známe prijaté riziká** (`README.md:71–72`): kto prvý zaregistruje cudzie číslo, drží jeho kartičku (recepcia zmaže a
založí znova); odpoveď `existuje` prezradí, že číslo kartičku má. Odkaz s tokenom je zároveň prístup – kto má odkaz
(zdieľaný telefón), vidí meno, kód a body (`api/index.php:127–130`); upozornenia ani QR prístup nedávajú (`README.md:69`).

**Otvorené právne body** [rozhodnutie majiteľa]: vzťah FACEPALM, s.r.o. ↔ prevádzkovateľ HEAD SPA 30 ako hostiteľ
údajov (zmluva, záznam o spracovateľských činnostiach); kontakt pre otázky k údajom (otázka 22); schválenie zásad;
či je prijateľná doména `headspa30.sk` v adrese kartičky Barbershopu.

---

## 6. Skúšobný režim v náhľade (bez živého servera, nič sa neodosiela)

Cieľ: majiteľ na iPhone prejde celý tok a vidí, ako to bude vyzerať; pritom je nemožné, aby náhľad niečo odoslal
alebo aby sa skúšobný režim dostal na živý web.

Návrh (zmena v `vernost/web/prihlaska.js` → kópia; atribút len v náhľade):
1. Nový atribút `data-skuska` na `<script src="assets/vernost.js">`. Pridáva ho **len** skladač náhľadu (artefakt),
   nikdy `index.html` v strome. `aktivne()` vracia `true` aj pri `data-skuska`, aby sa sekcia, pätička a okno ukázali.
2. V skúške sa **`fetch` vôbec nevolá**: namiesto `fetch(API + '?a=registracia', …)` (`vernost.js:123`) sa po 600 ms
   vráti náhrada `{ok:true, existuje:false, karta:''}`; `overUlozenu()` (`vernost.js:180–187`) sa v skúške preskočí.
   `uloz()` (`vernost.js:31`) v skúške nezapisuje `v30.karta.*` – do telefónu majiteľa sa nedostane falošný odkaz.
3. Viditeľné označenie: v hlavičke okna štítok **„SKÚŠKA“** (akcent `#E0601C`) a veta „Skúšobný režim: kartička sa
   nezakladá, nič sme neodoslali.“ pod nadpisom; na obrazovke „Kartička je pripravená“ tlačidlo **„Ukážka kartičky“**
   namiesto „Otvoriť kartičku“ (neotvára `headspa30.sk`).
4. „Ukážka kartičky“: inline obrazovka v tom istom `<dialog>` zo statických údajov (`nazov: Barbershop 30`,
   `meno: „Ukážka“`, `body: 0`, `kod: UKÁŽKA`, bez odmien → „Odmeny a akcie doplní prevádzka“), vzhľad podľa
   `karta/karta.css` (tmavá kartička, QR nahradený obdĺžnikom „QR na recepcii“). Žiadne skutočné meno, žiadne QR.
5. Dve poistky mimo prehliadača: test v `source/tools/` (vzor staged `vernost-footer-test.mjs`) tvrdí, že
   `index.html` v strome neobsahuje `data-skuska`, a jednotkový test, že v skúške sa `window.fetch` nikdy nezavolá
   (stub `fetch`, ktorý pri zavolaní zhodí test). Rozšíriť `e2e.mjs:25` (kópia zhodná) ostáva.
6. Poznámka, nie poistka: náhľad beží na doméne claude.ai, ktorá nie je v povolených pôvodoch (`jadro.php:14–15`);
   prehliadač by skutočný `POST` s JSON zastavil už pri preflight (`jadro.php:173–181`). Na to sa nespoliehame –
   skúška `fetch` nevolá vôbec.

Čo majiteľ v náhľade uvidí: sekciu s tlačidlom „Vytvoriť kartičku“, okno prihlášky (8 jazykov podľa prepínača),
overenie polí, „Kartička je pripravená, <meno>!“, ukážku kartičky, odkaz v pätičke, a pred „Rezervovať“ otázku na
kartičku. Nevidí: e‑mail, QR, skutočné body.

---

## 7. Návrh textov sekcie (SK; schvaľuje majiteľ, nič nad rámec toho, čo systém robí)

- Nadpis: **Vernostná kartička** (kľúč už existuje v 7 slovníkoch).
- Text: „Kartička je zadarmo a na tvoje meno. Za každú návštevu ti na recepcii pripíšeme body; odmeny a akcie vidíš
  priamo na kartičke. Založíš ju pri rezervácii alebo tu – stačí meno a telefón.“ (Body/odmeny bez čísel; „zľava
  alebo produkt“ z okna `vernost.js:20` ponechať len ak majiteľ odmenu zadá.)
- Tlačidlo: **Vytvoriť kartičku**; vedľa malý odkaz **Ochrana údajov**.
- Pri uloženej kartičke sa tlačidlo mení na **Otvoriť kartičku** (skript to už robí: `vernost.js:175–176`; popis
  tlačidla treba prepnúť v `obnovPaticku()`).
- Preklady: cs, de, en, hu, pl, sr, uk – rovnaký register ako okno (tykanie), do `assets/i18n/*.json`.

---

## 8. Zoznam pre majiteľa (čo od vás potrebujeme, po bodoch, bez žargónu)

1. **Súhlas s miestom, kde kartičky pobežia.** Navrhujeme webhosting HEAD SPA 30 (headspa30.sk). Odkaz na kartičku
   zákazníka Barbershopu bude začínať `www.headspa30.sk/…`. Ak to nechcete, povedzte, kto spravuje hosting
   barbershop30.sk a či tam beží PHP (otázka 21).
2. **Prístup na FTP hostingu** (adresa servera, prihlasovacie meno, heslo, priečinok webu). Zadáme ich do GitHubu ako
   tajomstvá; nikam inam, ani do chatu, ani do kódu. Potom sa server nahrá sám.
3. **Heslo do adminu kartičiek pre Barbershop** (aspoň 10 znakov) a kto ho na recepcii dostane.
4. **E‑mailová schránka na doméne hostingu** (napr. vernost@headspa30.sk) na posielanie odkazov na kartičku – voliteľné.
   Bez nej zákazník kartičku nedostane e‑mailom, ostane mu v telefóne a na recepcii.
5. **Pravidlá programu**: koľko bodov za návštevu (systém má predvolené 1), aspoň jedna odmena (názov a koľko bodov
   stojí), prípadné akcie s dátumom od – do. Nič z toho nevymýšľame; zadáte to v admine alebo nám to napíšete.
6. **Kto na recepcii bude kartičky obsluhovať** a na čom (telefón s Androidom alebo počítač s kamerou na QR; inak sa
   kód prepíše ručne). Zaškolenie zaberie pár minút.
7. **Schválenie textov**: sekcia na webe (slovensky + 7 jazykov), text okna, zásady ochrany údajov (vrátane sídla
   FACEPALM, s.r.o. v Mojmírovciach), kontakt pre otázky k údajom (otázka 22). Vzťah medzi FACEPALM, s.r.o. a
   HEAD SPA 30 ako hostiteľom údajov odporúčame prejsť s právnikom.
8. **Vzhľad**: okno prihlášky a kartička sú tmavé v značke Barbershopu. Ak chcete svetlú (papierovú) verziu, povedzte
   – je to malá zmena, ale mení vzhľad.
9. **Kedy spustiť** – a či najprv „potichu“ (len cez recepciu, bez sekcie na webe) a až potom naplno.

Čo ide hneď bez vás: skrytie chybného odkazu v pätičke, sekcia s tlačidlom pripravená (ukáže sa až so serverom),
skúšobný režim v náhľade, kontrola servera v nasadení, návrhy textov.

---

## 9. Plán stavby

Poradie a závislosti; „kontrola“ = tri nezávislé pohľady (kód, meranie, vzhľad) ako pri ostatných dávkach
(`PLAN-D6-D7.md`, časť 5). Veľkosti sú odhady, nie merania.

| Krok | Čo | Súbory | Závisí od | Odhad |
|---|---|---|---|---|
| V0 | Preniesť staged riešenie N01: skrytá pätička + `obnovPaticku()` + prísne `kartaUlozena()`; **najprv** `vernost/web/prihlaska.js`, potom `cp` | `index.html:879`, `vernost/web/prihlaska.js`, `assets/vernost.js` | nič | +7 B HTML, +0,6 kB JS; 1 h |
| V1 | CI: `tools/vernost-priprav.py` + test, `pages.yml:51` | `.github/workflows/pages.yml`, `tools/` | nič | 1 h |
| V2 | Sekcia „Vernostná kartička“ (hidden `data-vernost-sekcia`) v `band-contact`, tlačidlo `data-vernost-karta`, odkaz na zásady; `obnovPaticku()` odkrýva aj sekciu a mení popis tlačidla | `index.html:819–849`, `prihlaska.js`, `style.css` (využiť `.btn-ghost`, `.band-contact`) | V0 | +0,4 kB HTML gzip; 3 h |
| V3 | Texty sekcie v 7 slovníkoch | `assets/i18n/*.json` | V2 | 1 h |
| V4 | Skúšobný režim `data-skuska` + ukážka kartičky + 2 testy (bez `data-skuska` v strome; `fetch` sa v skúške nevolá) | `prihlaska.js`, `source/tools/*.mjs` | V0–V2 | +1,5 kB JS len v kóde (vetva skúšky mimo bežnej cesty); 4 h |
| V5 | Náhľad (artefakt) s `data-skuska` pre majiteľa, v 8 jazykoch, iPhone 430×932 – spolu s diagnostickým prekrytím z `v2/diagnoza.md`, časť 2 | skladač náhľadu | V4 | 1 h |
| V6 | Lokálne testy `sh vernost/testy/spusti.sh` (`README.md:76–78`) + kontrola, že `e2e.mjs:25` prechádza; **až keď iný tím skončí meranie** (teraz žiadny server) | – | V0–V4 | 1 h |
| V7 | Návrh textov (sekcia, zásady so sídlom, `pravne.html` úložisko `v30.*`) → majiteľovi na schválenie | `v2/`, neskôr `vernost/ochrana-udajov.html`, `barbershop-30/pravne.html` | nič | 1 h |
| M1 | Majiteľ: body 1–4 zo zoznamu → tajomstvá v GitHube → `ftp.yml` nasadí server | – | majiteľ | – |
| M2 | Kontrola `api/?a=stav` (`admin.barbershop`, `databaza`, `email`, `ip_cez_proxy`); ak proxy, doplniť `povody`/`proxy` v `config.php` (`README.md:47–48`) | – | M1 | 0,5 h |
| M3 | Majiteľ: odmeny, body, akcie v admine; recepcia zaškolená; texty schválené | – | M1 | – |
| M4 | Ďalšie nasadenie Pages → `data-zapnute` sa doplní samo (V1) → sekcia, pätička a prihláška pred rezerváciou živé; skúšobný tok v náhľade vypnúť | – | M2, M3 | 0,5 h |
| M5 | Po presune na `www.barbershop30.sk`: `jadro.php:10` (`web`), overiť pôvody; prípadne Wallet (poplatky – majiteľ) | `vernost/lib/jadro.php` | otázka 21 | 0,5 h |

Riziká a poistky:
- Kódová zmena `vernost.js` sa robí v `prihlaska.js` a kopíruje (inak padá `e2e.mjs:25`); staged strom už toto pravidlo
  porušuje – pri prenose zjednotiť.
- Výkon na telefóne: `vernost.js` je `defer`, 10 kB, bez práce pri skrole (`rozbor-vaha.md:76`, `v2/diagnoza.md:287`);
  sekcia je statické HTML v existujúcom páse, žiadna nová fotka ani animácia → nesúvisí s čiernymi obrazovkami (O1–O3
  v `v2/diagnoza.md`).
- Jazyk okna sa berie z `<html lang>` (`vernost.js:29`); overiť v náhľade, že prepínač jazykov `lang` nastavuje (podľa
  `i18n.js` áno – `STORE b30.lang`, `:33`), inak okno ostane slovenské.
- Sekcia „hidden do zapnutia“ znamená, že majiteľ ju na živom webe neuvidí, kým neurobí M1 – to mu treba povedať
  vopred (náhľad so skúškou je na to).

---

## 10. Predpoklady a čo sme neoverili

- [predpoklad] Server `vernost/` na `headspa30.sk` dnes nebeží (otázka 15 bez odpovede; `PLAN-D6-D7.md:138` hovorí o
  404). Bez siete sa to nedá overiť; prvý krok M2 to zistí z `api/?a=stav`.
- [predpoklad] Hosting Forpsi má PHP 8.1+ s `pdo_sqlite` (README to predpokladá; `stav` to ukáže).
- [predpoklad] Majiteľ Barbershopu (Lajko, `docs/VERNOSTNA-KARTA.md:4`) rozhoduje aj za hosting HEAD SPA 30; ak nie,
   bod 1 zoznamu potrebuje druhý súhlas.
- Nevideli sme `vernost/admin/admin.js` celý (358 riadkov) ani `karta/karta.css`; opis adminu je z `README.md:21–31`.
- Nič z tohto dokumentu nebolo spustené v prehliadači; odhady veľkostí sú z dĺžky súborov, nie z merania.
