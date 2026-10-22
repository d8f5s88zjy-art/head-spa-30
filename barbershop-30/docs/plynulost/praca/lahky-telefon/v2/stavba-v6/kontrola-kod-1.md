# Kontrola kódu, kolo 1: dávka V6 (vernostná kartička na webe BARBERSHOP 30, V6a–V6e)

Senior kontrolór, 22. 10. 2026, nezávisle, nič v strome nezmenené (`git status --short` prázdny pred aj po kontrole).
Strom `$SP/hs-vernost` (vetva `barbershop-vernost`, 4 commity `cbd97c2 … 1f45265` nad f624ee8),
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Odovzdávka: `$SP/barber/lahky-telefon/v2/stavba-v6/odovzdavka.md`. Diff: `git diff f624ee8..HEAD` (22 súborov, +574/−81).
Prehliadač bol voľný (`pgrep -f "http.server 86[01]"` → nič, `pgrep -af "headless_shell|chrome-linux/chrome"` → len môj
vlastný shell), preto som odložené prehliadačové kontroly spustil sám: po jednej, každá pod 3 minúty, porty 8730–8734,
po každej `pgrep` → 0 živých Chromií. Moje snímky a skripty: `$SP/kontrola-v6/` (2,4 MB).

**Výsledok: NEPREŠLO (1 vážny nález: celý test vernosti `spusti.sh` padá), 2 stredné, 5 drobných.** Bezpečnostné
poistky (fetch, úložisko, tajomstvá, CI brána, `data-skuska`) držia.

## 1. Nálezy

### N1 (vážna) – `sh vernost/testy/spusti.sh` na vetve padá: sekcia pridala druhý `[data-vernost-karta]`, e2e.mjs:204 je v „strict mode“

Dôkaz (spustené `VERNOST_PORT=8730 VERNOST_PUSH_PORT=8731 sh vernost/testy/spusti.sh`, 05:32:25–05:33:02 UTC; API, admin,
karta a push, súbežnosť, oddelenie prevádzok prešli, časť „prehliadač“ padla):

```
locator.click: Error: strict mode violation: locator('[data-vernost-karta]') resolved to 2 elements:
    1) <a class="btn btn-ghost" data-vernost-karta="" href="http://127.0.0.1:8730/vernost/karta/?k=…">…</a>  aka getByRole('link', { name: 'Otvoriť kartičku' })
    2) <a data-vernost-karta="" href="http://127.0.0.1:8730/vernost/karta/?k=…">Vernostná kartička</a>
    at prihlaska (…/vernost/testy/e2e.mjs:204:98)
```

`vernost/testy/e2e.mjs:204`: `p.locator('[data-vernost-karta]').click()` – pred dávkou mal Barbershop jeden taký prvok
(pätička), po V6c ich má dva (`barbershop-30/index.html:841` sekcia, `:888` pätička). Odovzdávka (časť 4, bod 1) test označila
ako ODLOŽENÝ s očakávaním „prihláška na oboch weboch prejde“; očakávanie neplatí. Na Pages ani v `pages.yml` sa suite
nespúšťa (`git grep spusti.sh .github` → nič), ale je to hlavný regresný test vernosti (ROZHODNUTIE, riadok „Testy“;
`vernost/README.md:82`) a zadanie dávky ho vyžaduje. Pozitívne: kontrola kópie `e2e.mjs:25` prešla (`cmp` bez výstupu),
uložená kartička v skúške prešla (locator už mal `href` na `127.0.0.1:8730/vernost/karta/?k=…`, čiže `kartaUlozena()`
lokálny `http` správne pripúšťa).

Návrh: v `e2e.mjs:204` zúžiť selektor na pätičku (`'[data-vernost-footer] [data-vernost-karta]'`) alebo overiť oba prvky
(sekcia má mať popis „Otvoriť kartičku“: `[data-vernost-ma]` bez `hidden`); potom spustiť celý `spusti.sh` a výsledok
dať do odovzdávky. Po oprave znova `cmp` (e2e.mjs sa kópie netýka, ale nech je to v tom istom commite s testom).

### N2 (stredná) – V skúške sa predsa zapisuje `v30.preskoc.<prevádzka>` do sessionStorage (zatvorenie okna pred rezerváciou bez voľby)

Hlavička `prihlaska.js:11–12` a odovzdávka („do úložiska sa nič nezapíše“, test „zápisov do úložiska 0“) tvrdia, že v skúške
sa neukladá nič. `uloz()` (`:36`) skúšku rešpektuje, ale `relacia()` (`:38`) nie; `dlg._teraz` (`:188`) pri zatvorení okna
otvoreného z odkazu na rezerváciu (×, Esc, klik vedľa) zapíše `sessionStorage['v30.preskoc.barbershop'] = '1'`.
Dôkaz (vm, kópia `assets/vernost.js` s `data-skuska`, klik na `a[href*="barbershop30.sk/rezervacia"]`, potom `dlg.close()`):

```
okno otvorené: true
zápisy po zatvorení okna bez voľby v skúške: [["session","v30.preskoc.barbershop","1"]]
```

Dôsledok v náhľade: do konca karty prehliadača sa pred „Rezervovať“ už neopýta (`:237`), majiteľ si môže myslieť, že
otázka zmizla. Testy to nekryjú: `vernost-skuska-test.mjs` aj `vernost-skuska-browser.mjs:45` kontrolujú úložisko len
v toku sekcia → okno → ukážka, nie tok rezervácia → × . Nie je to bezpečnostný problém (sessionStorage, bez osobných údajov).

Návrh: v `relacia()` pri zápise `if (SKUSKA) return null;` (alebo v `_teraz`), kópia `cp`, a do oboch skúšobných testov
pridať krok „klik na rezerváciu → Esc → 0 zápisov v30.*“. Alternatíva: v hlavičke a odovzdávke priznať, že skúška si pamätá
„teraz nie“ na jednu kartu prehliadača.

### N3 (stredná) – Na počítači sekcia nie je „pod kartou kontaktu“, ale vpravo vedľa nej; fakty sa presunú pod kartu (bez snímky staviteľa)

`.band-contact .contact-grid` je dvojstĺpcová mriežka (`style.css:1187`, `minmax(0,1.2fr) minmax(0,1fr)`); nový blok je
druhé dieťa (`index.html:837`), takže pri odkrytí ide do pravého stĺpca a `ul.facts` (tretie dieťa) spadne pod kartu
kontaktu. Dôkaz (vlastný skript `$SP/kontrola-v6/rozlozenie.mjs`, `data-zapnute` doplnené len za behu, 1440×900):

```
desktop main {x:40, y:15074, w:716} · sekcia {x:804, y:15074, w:596, h:263} · facts {x:40, y:15697, w:716}
mobil   main {x:16, y:14471} · sekcia {x:16, y:15056} · facts {x:16, y:15429}
```

Snímky `$SP/kontrola-v6/sekcia-desktop.png` (sekcia vpravo, pod ňou prázdny stĺpec) a `sekcia-mobil.png` (na telefóne je
poradie správne). Commit 72d9537, odovzdávka (časť 4, bod 5) a TEXTY-PRE-MAJITELA.md (časť 1) opisujú „pod kartou
„Kde nás nájdeš““; na počítači to neplatí. Kým je blok `hidden`, rozloženie sa nemení (`display:none`), takže živý web
to dnes neovplyvní. Vzhľad sám o sebe nie je zlý, ale nebol overený a nesedí s opisom pre majiteľa.

Návrh: buď `.band-contact .contact-vernost { grid-column: 1; }` (sekcia pod kartou, fakty ostanú vpravo ako doteraz),
alebo opis zmeniť na „vedľa karty (počítač) / pod kartou (telefón)“; v oboch prípadoch snímku 1440 px do odovzdávky.

### N4 (drobná) – `vernost-skuska-browser.mjs` bez `NODE_PATH` nespustiteľný; odovzdávka aj hlavička testu ho nepíšu

`barbershop-30/source/tools/vernost-skuska-browser.mjs:4` („Spustenie: B30_PORT=8721 node …“) a odovzdávka časť 4 body 2–4:
bez `NODE_PATH=/opt/node22/lib/node_modules` padne už import `../shot.mjs:37` (`Cannot find module 'playwright'`,
overené 05:30:59). `i18n-test.mjs:2` to v hlavičke má. Návrh: doplniť do hlavičky a do README riadku (`barbershop-30/README.md:76`).

### N5 (drobná) – Štítok „SKÚŠKA“ bez medzery pred vetou (čítačka prečíta „SKÚŠKASkúšobný režim…“)

`prihlaska.js:106`: `el('p', {class:'v30sk'}, [el('b', {}, [L.skuska]), L.skuskaT])` – medzera je len vizuálna
(`margin-right:6px`, `:98`). Textový obsah: `SKÚŠKASkúšobný režim: …` (vidno aj v teste `vernost-skuska-test.mjs:73`, ktorý
to regexom prejde). Návrh: `[el('b', …), ' ' + L.skuskaT]` + kópia.

### N6 (drobná) – Tlačidlo sekcie otvára okno, ale čítačke sa hlási ako obyčajný odkaz

`index.html:841`: `<a class="btn btn-ghost" href="https://www.headspa30.sk/vernost/karta/" data-vernost-karta>`; v prehliadači
(a11y strom, `rozlozenie.mjs`) `aria-haspopup: null`, `role: null`. Klávesnica inak sedí: Enter otvorí modálne okno
(`role=dialog`, názov „Vernostná kartička Barbershop 30“, fokus na zaškrtávacie pole), Esc vráti fokus na tlačidlo
(výpis „fokus po Escape: `<a class="btn btn-ghost" …`“). Návrh: `aria-haspopup="dialog"` na oba prvky `[data-vernost-karta]`
(index.html; HEAD SPA `index.html:718` ostáva bežným odkazom, kým nie je zapnutá – tam neriešiť).

### N7 (drobná) – `vernost.js` nesie texty skúšky v 8 jazykoch stále (+2 912 B gzip aj na živom webe)

`git show f624ee8:barbershop-30/assets/vernost.js | gzip -9c | wc -c` = 9 723, HEAD = 12 635 (odovzdávka to priznáva).
Je `defer` a mimo prvého obrazu, nič sa pri skrole nerobí, takže to tím plynulosti neohrozí; ale 2,9 kB pre režim, ktorý
živý web nikdy nezapne. Návrh (nie podmienka): kľúče `skuska…odmeny` a `CSS_SKUSKA` do samostatného súboru načítaného
len v náhľade, alebo prijať ako vedomý náklad a napísať to do README vernosti.

### N8 (drobná, mimo dávku) – `i18n-test.mjs` raz padol na tabuli hodín (hu), pri opakovaní prešiel

Prvý beh (`B30_PORT=8734`, 05:34:16): `CHYBA [hu] tabuľa hodín v jazyku stránky {"flap":"","label":"Ma","aria":null}`;
druhý beh (05:35:26): `Všetky kontroly prešli`. Tabuľa (`[data-flap]`, `index.html:824`) sa v dávke nemení; chyba je časovanie
vyplnenia tabule pri priblížení (`i18n-test.mjs:63, 85`). Nie je to chyba dávky, len poznámka pre vlastníka testu.

## 2. Čo prešlo (s dôkazom)

| Kontrola | Dôkaz |
|---|---|
| Zhoda zdroja a kópie (e2e.mjs:25) | `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → bez výstupu; v `spusti.sh` kontrola kópie prešla (padlo až `:204`, N1) |
| Skrytý odkaz a sekcia bez `data-zapnute` | `index.html:837` `hidden data-vernost-sekcia`, `:888` `<li hidden data-vernost-footer>`; `node barbershop-30/source/tools/vernost-footer-test.mjs` → `OK: … skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.`; `prihlaska.js:53–60` (URL, pôvod API, https alebo 127.0.0.1/localhost, cesta `karta/`, 22-znakový token, bez hash a používateľa); `:246` klik v skrytom bloku `preventDefault` |
| Skúška nevolá `fetch`, nezapisuje `v30.*` (okrem N2) | `node …/vernost-skuska-test.mjs` → `OK: … fetch 0×, zápisov do úložiska 0 …` (stub `fetch` hádže); `NODE_PATH=… B30_PORT=8732 node …/vernost-skuska-browser.mjs` → 20× OK (sk aj en: fetch na API 0, 0 požiadaviek na headspa30.sk, `v30.*` prázdne, bez chýb JS), snímky `$SP/kontrola-v6/skuska-okno*.png`, `skuska-ukazka*.png` (štítok SKÚŠKA, ukážka 0 bodov, kód UKÁŽKA, rámik namiesto QR, „Odmeny a akcie doplní prevádzka.“); `prihlaska.js:168–171` (v skúške `Promise` namiesto `fetch`), `:254` (`overUlozenu` preskočená), `:36` (`uloz` nič nezapíše) |
| `data-skuska` nie je v strome | `grep -c data-skuska barbershop-30/index.html index.html` → `0`/`0`; `git grep data-skuska -- '*.html'` → nič; test `vernost-skuska-test.mjs:11–12` to stráži; `nahlad-patch.md` dáva sed aj python s kontrolou „značka práve raz“ a zakazuje `data-zapnute` v náhľade |
| CI brána | `tools/vernost-priprav.py:17–30` (karta/ a ochrana-udajov.html HTML 200 s `<html`, `api/?a=stav` JSON `ok`/`databaza`/`sqlite` true, `admin.<prevádzka> === true`; každá výnimka → `{}`), `:34` bez hesla ≥ 10 znakov sa server ani nepýta, `:36–41` starý príznak sa odstráni, výpis len „zapnutá/vypnutá“; `python3 -I tools/test-vernost-priprav.py` → `Ran 4 tests … OK` (404, text/plain, výpadok siete, opakovaný beh, bez hesla sa `dostupnost` nevolá). Kľúče `databaza`/`sqlite`/`admin` server naozaj vracia (`vernost/api/index.php:65`, `lib/jadro.php:127` JSON) |
| `pages.yml` len vernostný krok | diff má jediný hunk `@@ -47,9 +47,10 @@` (sed → `python3 tools/vernost-priprav.py`), `env` `HESLO_B/HESLO_H` z `secrets.VERNOST_HESLO_*` nezmenené (`pages.yml:45–47`); `yaml.safe_load` prejde (job `deploy`) |
| i18n 0 nepreloženého textu | 7 slovníkov 262 → 266 kľúčov, pridané presne 4 kľúče (veta sekcie, „Vytvoriť kartičku“, „Otvoriť kartičku“, „Ochrana údajov“), 0 zmenených, 0 odstránených (python porovnanie f624ee8 ↔ HEAD); `i18n-test.mjs` v Chromiu: všetky kontroly prešli (2. beh, N8) |
| Čísla veľkostí (vaha.mjs) | `vaha.mjs` meria prenos v prehliadači (odovzdávka ho správne nechala ODLOŽENÝ); čísla z odovzdávky som zmeral rovnako (`git show <c>:<súbor> \| gzip -9c \| wc -c`): index.html 16 466 → 16 732 B (+266), vernost.js 9 723 → 12 635 B; surové index.html 89 289 B – sedí. Commit 72d9537 píše 16 484 → 16 743 (gzip s názvom v hlavičke), rozdiel +259 rovnaký |
| `index.html` zmeny len pätička + sekcia | diff má 2 hunky: `@@ -833,6 +833,15 @@` (sekcia) a `@@ -876,7 +885,7 @@` (pätička); koreňový `index.html` HEAD SPA v diffe nie je |
| Žiadne tajomstvá v strome | `git diff f624ee8..HEAD \| grep -iE '^\+.*(heslo\|password\|ftp_\|secret\|token)'` → len názvy (`HESLO_B`, `HESLO_H`, `karta.password` z URL API, `password_hash` v teste s testovacím heslom „test-heslo-…“, ktoré tam bolo už vo f624ee8); TEXTY-PRE-MAJITELA.md má len názvy tajomstiev (`FTP_*`, `VERNOST_HESLO_BARBERSHOP`, `VERNOST_EMAIL_OD`) |
| Texty bez nových faktov | sekcia = `vernost.md` časť 7 doslovne (pomlčka → čiarka), bez čísel bodov a odmien; TEXTY: sídlo FACEPALM označené **[predpoklad – overí majiteľ]**; „predvolené 1“ bod (`api/index.php:129, 305`) a „3 roky“ (`ochrana-udajov.html:44`, `jadro.php:246`) sú z kódu, nie nové |
| Tmavé okno = dizajn značky | farby `#v30p[data-p=barbershop]` (`prihlaska.js:94`) nezmenené; poznámka majiteľovi v TEXTY (časť 1 „Vzhľad“) a v nahlad-patch.md |
| Prístupnosť | okno `role=dialog`, `aria-labelledby=v30h`, modálne, fokus na „Áno, chcem…“, Esc vráti fokus na tlačidlo (desktop aj mobil, `rozlozenie.mjs`); tlačidlo 50–52 px vysoké; `[data-vernost-ma] hidden` sa v názve neobjaví; drobnosti N5, N6 |
| Commity a pravidlá | 4 commity po slovensky, bez podpisov a bez zmienky o AI v správach; žiadny push (vetva len lokálna); iné stromy nedotknuté; `vernost/config.php` po teste neexistuje, žiadne procesy `php -S`/`push-mock`/Chromium po kontrole |

## 3. Poznámky bez nálezu

- `kartaUlozena()` teraz vyžaduje absolútne `data-api` (`new URL(API…)` bez základu by pri relatívnej adrese hodil a vrátil
  `''`). V strome je `data-api` vždy absolútne alebo chýba (`git grep data-api -- '*.html'` → nič), takže dnes bez dopadu;
  hodí sa veta v hlavičke prihlášky.
- V skúške sa po odmietnutí (`uloz(K_NIE)` preskočené) otázka pred rezerváciou vracia pri každom kliku; pre náhľad
  majiteľovi je to skôr výhoda (vidí ju znova), len nech to vie.
- Po oprave N1–N3 odporúčam zopakovať: `spusti.sh` (celý), `vernost-skuska-browser.mjs`, snímku 1440 px sekcie, `cmp`.
