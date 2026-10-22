# Skeptik – dávka V6 (vernostná kartička na webe BARBERSHOP 30, vetva `barbershop-vernost`)

Skeptik, 22. 10. 2026 (druhé, nezávislé kolo; nahrádza predošlý SKEPTIK.md z 05:59, jeho závery som overoval nanovo).
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`. Strom `$SP/hs-vernost`,
HEAD `52ce64f` (5 commitov nad `f624ee8`: `cbd97c2`, `f1a47bb`, `72d9537`, `1f45265`, `52ce64f`). V strome som nič nemenil
(`git status --short | wc -l` → `0`; `vernost/config.php` neexistuje). Moje skripty a kópie: `$SP/skeptik-v6b/` (1,1 MB).
Porty: 8740, 8741 (oba `php -S` po behu ukončené).

## Verdikt: VYVRÁTENÉ (dve časti tvrdenia neplatia doslovne), zvyšok drží

Tvrdenie má šesť častí. Štyri platia (overené vlastnými príkazmi). Dve neplatia:

1. **„Skúška nič neposiela ani neukladá“ – ukladá.** Neposiela nič (fetch 0×), ale keď majiteľ v náhľade klikne
   „Rezervovať termín“ a okno zavrie krížikom (alebo Esc, alebo klikom vedľa), zapíše sa
   `sessionStorage['v30.preskoc.barbershop'] = '1'` a pri ďalšom kliku na rezerváciu sa okno už neotvorí.
   Príčina: `vernost/web/prihlaska.js:188` (`dlg._teraz = … relacia(K_TERAZ, '1')`) a `:38` (`relacia` nemá podmienku
   `SKUSKA`, na rozdiel od `uloz` na `:36`). Test dávky túto cestu nemeria: `barbershop-30/source/tools/vernost-skuska-test.mjs:104`
   je len komentár bez kontroly, test ide len cestou zo sekcie. Sľub „nič sa neukladá“ stojí v `prihlaska.js:11–12, 48`,
   `vernost/README.md:57`, `barbershop-30/README.md:75`.
2. **„Texty nesľubujú nič, čo systém nerobí“ – v skúške sľubujú.** Potvrdenie v skúške hovorí
   „Kartička je pripravená, Peter! **Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii QR kód z kartičky.**“
   (`prihlaska.js:198` `karta ? L.okT : L.maT`, v skúške `karta = 'ukazka'` z `:179`). V skúške sa nič neuložilo a QR nie je
   (ukážka má len rámik „QR kód ukáže kartička…“). Majiteľ to v náhľade uvidí hneď pod štítkom „nič sme neodoslali“.
   Okrem toho okno sľubuje „vymeň ich za zľavu alebo produkt“ (`prihlaska.js:25`, kľúč `u`; text je z `f624ee8`, dávka ho
   nemenila) a odmeny v systéme zatiaľ nie sú – TEXTY to správne viažu na M5, ale „nesľubuje nič“ to nie je.

Oprava je lacná (nerobil som ju, nie je to úloha skeptika): v `prihlaska.js:188` pridať `!SKUSKA` (alebo `if (SKUSKA) return`
v `relacia` pri zápise), v `hotovo()` v skúške namiesto `L.okT` použiť `L.skuskaT` (text v 8 jazykoch už je), skopírovať do
`barbershop-30/assets/vernost.js` (`e2e.mjs:25` stráži zhodu) a do `vernost-skuska-test.mjs` doplniť cestu
rezervácia → × → `zapisy` prázdne a kontrolu, že potvrdenie neobsahuje „Uložili sme“.

## Čo som overil sám (príkaz → výstup)

| # | Tvrdenie | Príkaz / súbor:riadok | Výsledok |
|---|---|---|---|
| 1 | Chybný odkaz je skrytý, kým systém nebeží | `grep -n 'data-vernost' barbershop-30/index.html` → `:837 <div class="contact-vernost" hidden data-vernost-sekcia>`, `:888 <li hidden data-vernost-footer>`; bez `data-zapnute` `prihlaska.js:68–73` (`hidden = !dostupne`, `removeAttribute('href')`); `node barbershop-30/source/tools/vernost-footer-test.mjs` | `OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.` rc=0. **PLATÍ** (v `f624ee8` pätička skrytá nebola: `git show f624ee8:barbershop-30/index.html \| grep -c data-vernost-footer` → `0`) |
| 2 | CI nezapne prihlášku bez funkčného servera | `pages.yml:44–53` volá len `python3 tools/vernost-priprav.py`; moja kópia s `BASE='http://127.0.0.1:8740/vernost/'` (`$SP/skeptik-v6b/brana.py`) proti skutočnému `php -S 127.0.0.1:8740 … vernost/testy/router.php` na kópii `vernost/` | C) bez hesiel → `vypnutá`/`vypnutá`, server **0 požiadaviek**; A) `HESLO_B` 12 znakov, server bez `config.php` (`"admin":{"barbershop":false…}`) → `vypnutá`, príznak 0×; B) heslá + dočasný `config.php` s odtlačkom len pre barbershop (`"admin":{"barbershop":true,"headspa":false}`) → `barbershop zapnutá`, `headspa vypnutá`, príznak 1×/0×; B2) heslo 9 znakov → `vypnutá`; B3) opakovaný beh bez hesiel starý príznak odstráni (1 → 0). `python3 -I tools/test-vernost-priprav.py` → `Ran 4 tests … OK`. **PLATÍ pre `pages.yml`** (výhrady nižšie) |
| 3 | Sekcia a tlačidlo len so zapnutým systémom alebo v skúške | `prihlaska.js:50` `aktivne() = ZAPNUTE \|\| SKUSKA`, `:68` `dostupne = aktivne() \|\| !!u` | **PLATÍ** s vedomou výnimkou: ukážu sa aj návštevníkovi s platnou uloženou kartičkou (`kartaUlozena()`, `:53–62`, prísna kontrola pôvodu a tvaru adresy) – to je zámer V6a, nie chyba |
| 4 | Skúška nič neposiela | `node barbershop-30/source/tools/vernost-skuska-test.mjs` → `OK: … v skúške fetch 0×, zápisov do úložiska 0 …` rc=0; môj `node $SP/skeptik-v6b/repro.mjs barbershop-30/assets/vernost.js` (DOM náhrada z testu dávky, riadky 17–38, `fetch` hádže) | `fetch: 0` v oboch scenároch. **PLATÍ** |
| 5 | Skúška nič neukladá | ten istý `repro.mjs`, scenár A: `data-odkazy='a[data-booking-link]'`, klik na rezerváciu, × | `A okno z rezervácie: true \| klik zastavený: true` / `A zápisy po ×: [["session","v30.preskoc.barbershop","1"],["session","v30.preskoc.barbershop","1"]] \| fetch: 0` / `A druhý klik na rezerváciu otvorí okno znova: false`. **NEPLATÍ** |
| 6 | Texty nesľubujú nič, čo systém nerobí | `repro.mjs`, scenár B (sekcia → súhlas → meno, telefón → odoslať) | `B potvrdenie: SKÚŠKASkúšobný režim: kartička sa nezakladá, nič sme neodoslali.Kartička je pripravená, Peter!Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii QR kód z kartičky.Ukážka kartičky \| zápisy: [] \| fetch: 0`. **NEPLATÍ** (v skúške) |
| 7 | `data-skuska` nie je v strome; kópia = zdroj; patch náhľadu funguje | `grep -c data-skuska barbershop-30/index.html index.html` → `0`/`0`; `git grep -n data-skuska -- '*.html'` → rc=1; `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → zhodné; sed z `nahlad-patch.md` na kópii `$SP/skeptik-v6b/nahlad/index.html` | náhľad `1` (`:923 … data-prevadzka="barbershop" data-skuska defer>`), strom `0`. **PLATÍ** |
| 8 | Správa pre majiteľa hovorí jasne, že bez M1–M4 kartu nikto nevytvorí | `TEXTY-PRE-MAJITELA.md:3–4` („ostanú skryté, kým systém kartičiek nebeží (body M1 až M3)“), `:137–157` (M1 hosting, M2 FTP do tajomstiev GitHubu „nikam inam, ani do chatu, ani do kódu“, M3 heslo adminu `VERNOST_HESLO_BARBERSHOP`, M4 voliteľná, M5 odmeny), `:87–88` tmavé okno + ponuka svetlého | **PLATÍ v podstate**: jasné a bez žargónu. Presnosť: nutné sú M1–M3; M4 (e‑mail) je správne označená ako voliteľná, takže formulácia „bez M1–M4“ v tvrdení je o jeden bod širšia, než píše správa. Sídlo FACEPALM, s.r.o. je pri návrhu označené `[predpoklad – overí majiteľ]` (`:96–103`) |
| 9 | Pravidlá commitov a tajomstiev | `git log --format='%an <%ae>\|%s%n%b' f624ee8..HEAD \| grep -niE 'claude\|anthropic\|co-authored\|signed-off\|\bAI\b'` → zhoda len v mene autora `Claude <noreply@anthropic.com>`, ktorého majú aj `f624ee8`, `83e21bd`, `3582235` (identita repozitára, nie podpis v správe); `git diff f624ee8..HEAD \| grep '^+' \| grep -iE 'password\|secret\|token\|ftp_'` → len testové `test-heslo-*` v `spusti.sh` (dočasný `config.php`, maže sa) a `'x'*10` v teste | bez tajomstiev; vetva nemá upstream (`git branch -vv` bez `[origin/…]`); `hs-lahky` HEAD `f624ee8`, `hs-recepcia` `c7ffb2f` (cudzie, nemenené mnou) |

## Ďalšie výhrady (nevyvracajú, patria do odovzdávky alebo integrácie)

- **`ftp.yml:44–49` zapína prihlášku HEAD SPA len podľa dĺžky hesla** (`if [ ${#HESLO_H} -ge 10 ]; then sed … data-zapnute`), bez
  brány servera. Barbershop cez FTP nejde, takže pre túto dávku to nevadí; veta „CI nezapne prihlášku bez funkčného servera“
  platí len pre `pages.yml`. Patrí integrácii.
- **Brána kontroluje, že `karta/` vráti nejaké HTML 200, nie že je to naozaj stránka kartičky.** Pri mojom pokuse so
  skrytým `karta/` vrátil `php -S` 200 (vstavaný server spadne na `vernost/index.html`) a brána prihlášku zapla. Na Apache by
  išlo o 404, takže je to vlastnosť `php -S`, nie hostingu; skutočnou bránou je `api/?a=stav` s `admin.barbershop === true`,
  čo bez nasadeného servera s heslom nevznikne. Hosting s „mäkkou 404“ (200 + HTML) by však `karta/` neodhalil – lacné
  spevnenie: hľadať v tele značku, ktorú má len `vernost/karta/index.html`.
- **Tlačidlo sekcie si v skúške necháva skutočný `href`** `https://www.headspa30.sk/vernost/karta/` (`prihlaska.js:72–73`
  odstraňuje `href` len pri `!dostupne`). Bežný klik zachytí poslucháč (`:243–249`), ale dlhé podržanie na telefóne / stredné
  tlačidlo myši otvorí adresu, kde systém ešte nebeží. Patrí do `nahlad-patch.md` ako veta pre majiteľa.
- Texty sekcie (`index.html:839`): „Za každú návštevu ti na recepcii pripíšeme body; odmeny a akcie vidíš priamo na kartičke.“ –
  body systém pripisuje (`api/index.php` `body_za_navstevu`, predvolene 1), odmeny ukáže až po M5; bez čísel a bez konkrétnych
  odmien, v súlade so zadaním.

## Nepotvrdené

1. Prehliadačová kontrola je **ODLOŽENÁ**: `pgrep -f "http.server 86[01]"` → nič (rc=1), ale doslovná podmienka
   `pgrep -c -f "headless_shel[l]|chrome-linux/chrom[e]"` vrátila `1` (zhoda na systémovom procese pid 85, nie na prehliadači;
   `ps -eo comm \| grep -cE '^(headless_shell|chrome)$'` → `0`). Pravidlo som neobchádzal. Celý `sh vernost/testy/spusti.sh`
   (Playwright) som preto nespúšťal; spoliehal som sa na vm‑reprodukciu a `php -S`.
2. Skutočný beh `pages.yml` na GitHube (Actions sa tu nedajú spustiť).
3. Cesta `ftp.yml` (HEAD SPA) – mimo dávky.
4. Sídlo FACEPALM, s.r.o. – [predpoklad – overí majiteľ].
5. Dlhé podržanie tlačidla sekcie na skutočnom telefóne (odvodené len z kódu).
6. Rozloženie sekcie na počítači (1440 px) – nemeral som.

## Pre majiteľa (bez žargónu)

V náhľade uvidíte na stránke Barbershopu novú časť „Vernostná kartička“ s tlačidlom „Vytvoriť kartičku“; po kliknutí sa
otvorí okno so štítkom SKÚŠKA, vyplníte meno a telefón a uvidíte „Kartička je pripravená“ aj ukážku kartičky, pričom sa nič
nikam neodošle a žiadna kartička nevznikne (jednu vetu v potvrdení, ktorá zatiaľ nesprávne tvrdí, že sme kartičku uložili,
ešte opravíme). Na skutočnom webe ostane táto časť skrytá, kým systém kartičiek nebeží, a bez vás ho spustiť nevieme. Potrebujeme
od vás miesto, kde systém pobeží (navrhujeme hosting HEAD SPA 30), prístup na FTP toho hostingu, ktorý vložíte priamo do
GitHubu ako tajomstvá a nikdy ho neposielajte v správe ani e‑mailom, heslo do správy kartičiek pre Barbershop, tiež len do
tajomstiev GitHubu, a aspoň jednu odmenu s počtom bodov, lebo okno sľubuje výmenu bodov za zľavu alebo produkt. Okno
kartičky je zámerne tmavé vo farbách značky Barbershopu; ak chcete svetlý variant, povedzte a pripravíme ho.

## Oprava po skeptikovi (22. 10. 2026, 20:15 UTC, commit bf26d2d v hs-vernost)
- (a) Skúška zapisovala sessionStorage v30.preskoc.barbershop po zatvorení okna z rezervácie: relacia() má teraz `if (SKUSKA) return null;` pred zápisom (prihlaska.js:37). Repro skeptika (kontrola-v6-2/n2-preskoc.mjs): pred opravou `[["session","v30.preskoc.barbershop","1"]]`, po oprave `[]`. Test vernost-skuska-test.mjs má nový blok pre túto cestu.
- (b) Potvrdenie v skúške tvrdilo „Uložili sme ju aj v tomto prehliadači…“: nový text okS v 8 jazykoch („V skúške sme nič neuložili. Skutočná kartička sa uloží v tomto prehliadači a na recepcii ukážeš jej QR kód.“); test overuje oba smery a na starej verzii padá.
- N3 (kontrola kódu): na počítači ≥ 801 px je sekcia v stĺpci 1 pod kartou kontaktu a fakty v stĺpci 2 cez oba riadky, len keď je sekcia odkrytá (`:not([hidden]) ~ .facts`); skrytá sekcia živý web nemení. Snímka 1440 px ODLOŽENÁ (prehliadač má teraz Richtárik).
- Ostáva u majiteľa: veta okna „vymeň ich za zľavu alebo produkt“ (M5 odmeny) a M1–M3.
- Testy: vernost-skuska-test OK, vernost-footer-test OK, test-vernost-priprav 4 OK, cmp kópie OK.
