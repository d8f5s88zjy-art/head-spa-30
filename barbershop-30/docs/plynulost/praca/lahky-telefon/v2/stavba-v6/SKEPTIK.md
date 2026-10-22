# Skeptik – dávka V6 (vernostná kartička na webe BARBERSHOP 30, vetva `barbershop-vernost`)

Skeptik, 22. 10. 2026, 05:51–05:58 UTC. Strom `$SP/hs-vernost`, HEAD `52ce64f` (5 commitov nad f624ee8), nič som v strome
nemenil (`git status --short` prázdny pred aj po; `vernost/config.php` a `vernost/data/meno.php` neexistujú).
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`. Moje skripty, logy a snímky:
`$SP/skeptik-v6/` (5,6 MB). Porty 8740–8744. Prehliadač bol voľný (`pgrep -af "http.server 86[01]"` → rc=1,
`pgrep -c -f "headless_shel[l]|chrome-linux/chrom[e]"` → 0 pred každým behom aj 2 s po ňom); tri behy Chromia po sebe,
spolu 42 s (05:53:53–05:54:30 a 05:57:26–05:57:31).

## Verdikt: tvrdenie je VYVRÁTENÉ v dvoch bodoch, zvyšok drží

Tvrdenie má šesť častí. Štyri som potvrdil vlastným kódom, testom alebo príkazom. Dve sú v doslovnom znení nepravdivé:

1. **„Skúška nič neposiela ani neukladá“** – neposiela nič (potvrdené), ale **ukladá**: ak majiteľ v náhľade klikne
   „Rezervovať termín“, otvorí sa okno a on ho zavrie krížikom bez voľby, do `sessionStorage` sa zapíše
   `v30.preskoc.barbershop = "1"` (reprodukované dvakrát, nižšie body 4 a 5). Dôsledok pre náhľad: v tej istej karte
   prehliadača sa pri ďalšom „Rezervovať“ otázka už neukáže a rezervácia ide rovno – majiteľ si môže myslieť, že
   prihláška „prestala fungovať“. Sľub „nič sa neukladá“ stojí v `vernost/web/prihlaska.js:12, 48`, `vernost/README.md:57`
   a `barbershop-30/README.md:75`. Kontrolóri to našli (N2/S1), oprava-1 to zámerne nemenila („nie je vážne“) – ako skeptik
   to nemôžem pustiť pod vetou „nič neukladá“.
2. **„Texty nesľubujú nič, čo systém nerobí“** – v skúške po „Založiť kartičku“ stojí pod štítkom
   „SKÚŠKA … nič sme neodoslali“ veta **„Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii QR kód
   z kartičky.“** (`prihlaska.js:198` – `karta ? L.okT : L.maT`, v skúške `karta = 'ukazka'`, `:179`). Nič sa neuložilo a
   QR v skúške nie je. Snímka: `$SP/skeptik-v6/skeptik-potvrdenie-skuska.png`. Majiteľ to v náhľade uvidí.
   Navyše okno sľubuje „vymeň ich za zľavu alebo produkt“ (`prihlaska.js:25`, kľúč `u`); odmeny v systéme zatiaľ nie sú
   (M5). Odovzdávka aj TEXTY to priznávajú a spúšťanie viažu na M5 – to je v poriadku, len to nie je „nesľubuje nič“.

Obe veci sú lacné: jedna podmienka `!SKUSKA` v `dlg._teraz` (`prihlaska.js:188`) + `cp` do kópie + krok v testoch skúšky;
a v `hotovo()` v skúške použiť `L.skuskaT` namiesto `L.okT` (text v 8 jazykoch už existuje). Bez nich je dávka funkčne
bezpečná (nič sa neposiela, nič osobné sa neukladá), ale sľub v dokumentácii a v okne neplatí.

## Čo som overil sám (príkaz → výstup)

| # | Tvrdenie | Ako | Výsledok |
|---|---|---|---|
| 1 | Chybný odkaz je skrytý, kým systém nebeží | `barbershop-30/index.html:888` `<li hidden data-vernost-footer>`, `:837` `hidden data-vernost-sekcia`; `node barbershop-30/source/tools/vernost-footer-test.mjs` | `OK: pätička a sekcia skryté bez prihlášky, odkryté so zapnutím alebo s platnou kartičkou, 8 neplatných adries, zmena úložiska, klik bez cieľa.` rc=0 |
| 2 | …aj v skutočnom prehliadači, strom ako je (bez `data-skuska`) | vlastný `$SP/skeptik-v6/skeptik-browser.mjs`, krok 5, Chromium 390×844, port 8744 | `sekcia viditeľná: false \| pätička viditeľná: false \| href sekcia: null \| href pätička: null` (odkaz bez `href`, `prihlaska.js:73`) |
| 3 | CI nezapne prihlášku bez funkčného servera | `tools/vernost-priprav.py` proti skutočnému `php -S 127.0.0.1:8740 … router.php` (BASE prepnuté na 127.0.0.1 v `$SP/skeptik-v6/brana.py`), 4 scenáre | A) heslo, server bez `config.php` (`admin.barbershop=false`) → `vypnutá`, `data-zapnute` 0×; B) bez hesla → `vypnutá` a server **nedostal ani jednu požiadavku** (log má len riadok „started“); C) heslo + dočasný `config.php` s odtlačkom → `?a=stav` `"admin":{"barbershop":true…}` → `zapnutá`, `data-zapnute` 1×, headspa `vypnutá`; D) heslo, ale `karta/` 404 → `dostupnost() -> {}` → `vypnutá`. `python3 -I tools/test-vernost-priprav.py` → `OK` (4 testy). `pages.yml:49–53` volá len tento skript; dočasný `config.php` zmazaný |
| 4 | Skúška nič neposiela ani neukladá – bez prehliadača | `node barbershop-30/source/tools/vernost-skuska-test.mjs` → `OK … fetch 0×, zápisov do úložiska 0 …`; **ale** vlastný `node $SP/skeptik-v6/s1.mjs barbershop-30/assets/vernost.js` (vm, `data-skuska`, klik na odkaz rezervácie, zavretie ×) | `okno otvorené z rezervácie: true \| klik zastavený: true` / `zápisy po zavretí ×: [["session","v30.preskoc.barbershop","1"],["session","v30.preskoc.barbershop","1"]] \| fetch: 0` – test dávky túto cestu nemeria (`vernost-skuska-browser.mjs:45` kontroluje úložisko len po ceste zo sekcie) |
| 5 | …v skutočnom prehliadači | `skeptik-browser.mjs` kroky 1–3 (Chromium, `data-skuska` doplnené len za behu do odpovede servera, cudzie adresy blokované, `fetch` na API hádže) | `1 okno z rezervácie otvorené: true \| tlačidlo: Pokračovať na rezerváciu`; `1 úložisko po ×: {"local":[],"session":[["v30.preskoc.barbershop","1"]]}`; `2 po druhom kliku okno otvorené: false` (otázka sa už nepýta); `3 … fetch na API: 0 \| cudzie požiadavky: 1 ['https://www.barbershop30.sk/rezervacia']` (to je skutočná rezervácia po mojom kliku, nie požiadavka na headspa30.sk); `3 potvrdenie: … SKÚŠKA … nič sme neodoslali. Kartička je pripravená, Peter! Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii QR kód z kartičky. Ukážka kartičky` |
| 6 | Sekcia a tlačidlo len so zapnutým systémom alebo v skúške | `prihlaska.js:50` `aktivne() = ZAPNUTE \|\| SKUSKA`, `:68` `dostupne = aktivne() \|\| !!u` (tretí prípad: platná uložená kartička – zámer, pozri odovzdávku), `:246` klik v skrytom bloku `preventDefault`; `NODE_PATH=/opt/node22/lib/node_modules B30_PORT=8743 node barbershop-30/source/tools/vernost-skuska-browser.mjs` | `20× OK`, `Všetky kontroly skúšky prešli`, rc=0 (sk + en: sekcia aj pätička viditeľné, štítok, potvrdenie bez servera, 0 odkazov na skutočnú kartičku, ukážka bez mena/telefónu/QR, 0 požiadaviek na headspa30.sk) |
| 7 | `data-skuska` nie je v strome; kópia = zdroj | `grep -c data-skuska barbershop-30/index.html index.html` → `0`/`0`; `git grep -n data-skuska -- '*.html'` → nič (rc=1); `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → bez výstupu | platí; `vernost-skuska-test.mjs:11–13` to stráži |
| 8 | Celý test vernosti po oprave N1 | `SNIMKY=$SP/skeptik-v6 VERNOST_PORT=8741 VERNOST_PUSH_PORT=8742 sh vernost/testy/spusti.sh` (05:53:53–05:54:21) | `VÝSLEDOK: 111 v poriadku, 0 zlyhalo`, rc=0; kontrola kópie `e2e.mjs:25` prešla; po behu `config.php`/`meno.php` neexistujú, 0 Chromií, 0 `php -S` |
| 9 | Správa pre majiteľa hovorí jasne, že bez M1–M4 kartu nikto nevytvorí | `TEXTY-PRE-MAJITELA.md` úvod („na webe ostanú skryté, kým systém kartičiek nebeží (body M1 až M3)“), časť 4 M1–M7, záver („bez nich sekcia a pätička ostanú skryté“) | jasné a bez žargónu; presnosť: M4 (e‑mailová schránka) je tam správne označená ako voliteľná – kartu bez nej zákazník vytvorí, len nedostane odkaz e‑mailom; nutné sú M1–M3 (+ M5 pre sľub odmeny v okne) |
| 10 | Pravidlá: commity, tajomstvá, iné stromy | `git log --format='%an \| %s%n%b' f624ee8..HEAD \| grep -niE 'claude\|anthropic\|co-authored\|signed-off\|\bAI\b'` → len meno autora `Claude <noreply@anthropic.com>`, ktoré má aj f624ee8 (identita repozitára, nie podpis v správe); správy commitov po slovensky; `git diff f624ee8..HEAD \| grep -niE '^\+.*(password\|heslo\|secret\|token)'` → len názvy `HESLO_B/HESLO_H` a komentár; `hs-lahky` 0 zmien, `hs-recepcia` 4 zmeny (cudzí tím, HEAD f624ee8 v oboch) | v poriadku; žiadny push (vetva lokálna) |

Snímky z mojich behov (tmavé okno v značke, štítok SKÚŠKA, ukážka 0 bodov / „Ukážka“ / „Kód UKÁŽKA“ / rámik namiesto QR /
„Odmeny a akcie doplní prevádzka.“): `$SP/skeptik-v6/skuska-okno.png`, `skuska-ukazka.png`, `skeptik-potvrdenie-skuska.png`.
Farby `#v30p[data-p=barbershop]` (`prihlaska.js:94`) sú nezmenené oproti f624ee8 – zámer značky (`REVIZIA-PO-SKEPTIKOVI.md` bod 5).

## Ďalšie výhrady (nevyvracajú, ale patria do odovzdávky)

- **`ftp.yml:44–49` zapína prihlášku HEAD SPA len podľa dĺžky hesla**, bez brány servera (`sed … data-zapnute` ak
  `${#HESLO_H} -ge 10`). Barbershop cez FTP nejde (`vernost.md:109`) a FTP krok nahráva server v tom istom behu, takže pre
  túto dávku to nie je chyba; ale veta „CI nezapne prihlášku bez funkčného servera“ platí len pre `pages.yml`. Patrí integrácii.
- **Tlačidlo sekcie si v skúške necháva živý `href`** `https://www.headspa30.sk/vernost/karta/` (krok 4: `href tlačidla sekcie
  v skúške: https://www.headspa30.sk/vernost/karta/`; `obnovPaticku()` ho odstráni len pri `!dostupne`, `prihlaska.js:73`) a
  „Ochrana údajov“ vedie na `…/vernost/ochrana-udajov.html`. Bežný klik zachytí poslucháč; dlhé podržanie na telefóne alebo
  stredné tlačidlo myši otvorí adresu, kde systém ešte nebeží (404). Do `nahlad-patch.md` a TEXTY patrí veta pre majiteľa.
- V skúške texty štítku v 8 jazykoch idú aj naživo (`vernost.js` +2,9 kB gzip) – priznané v odovzdávke (N7), vedomý náklad.

## Nepotvrdené (nemal som ako, alebo mimo rozsah)

1. Skutočný beh `pages.yml` na GitHube (Actions sa tu nedajú spustiť); brána overená len lokálne proti `php -S` a napodobeninami.
2. Cesta `ftp.yml` (HEAD SPA) – netestovaná, mimo dávku; pozri výhradu vyššie.
3. Sídlo FACEPALM, s.r.o. v návrhu zásad – [predpoklad – overí majiteľ] (bez internetu neoverené).
4. Rozloženie sekcie na počítači (kontrola-kod-2 N3: ide do pravého stĺpca mriežky, nie „pod kartu kontaktu“ ako píše
   TEXTY časť 1) – nemeral som pri 1440 px, beriem z kontroly kódu.
5. Dlhé podržanie tlačidla sekcie na skutočnom iPhone (len odvodené z `href` a z toho, že poslucháč rieši len `click`).
6. Či 4 necommitnuté zmeny v `hs-recepcia` nesúvisia s touto dávkou (cudzí strom, nemenil som ho a neprisudzujem).

## Pre majiteľa (bez žargónu)

V náhľade uvidíte na stránke Barbershopu novú časť „Vernostná kartička“ s tlačidlom „Vytvoriť kartičku“; po kliku sa
otvorí okno so štítkom SKÚŠKA, vyplníte meno a telefón a dostanete „Kartička je pripravená“ a ukážku kartičky – nič sa pritom
nikam neposiela a žiadna kartička nevzniká (jedna veta v potvrdení zatiaľ chybne tvrdí, že sme kartičku uložili v prehliadači;
opravíme). Na živom webe ostane táto časť skrytá, kým systém kartičiek nebeží. Aby bežal, potrebujeme od vás: kde má systém
bežať (navrhujeme hosting HEAD SPA 30), prístup na FTP toho hostingu, ktorý vložíte priamo do GitHubu ako tajomstvá (nikdy
nám ho neposielajte v správe ani e‑mailom), heslo do adminu kartičiek pre Barbershop (tiež len do tajomstiev GitHubu) a
aspoň jednu odmenu s počtom bodov, lebo okno sľubuje „vymeň body za zľavu alebo produkt“. Okno kartičky je zámerne tmavé vo
farbách značky Barbershopu; ak chcete svetlý (papierový) variant, povedzte, je to malá zmena.
