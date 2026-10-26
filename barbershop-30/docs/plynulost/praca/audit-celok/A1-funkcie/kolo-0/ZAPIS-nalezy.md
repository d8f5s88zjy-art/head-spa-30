
## Nálezy

### A1-01 · vážna · Web Barbershopu nemá vlastnú stránku pre zlú adresu (404.html)
- **Súbory:** `barbershop-30/404.html` – neexistuje (`ls barbershop-30/` → `README.md admin assets docs en index.html karta
  rezervacia.html robots.txt sitemap.xml source`); `source/tools/nasad-barbershop30.sh:20–24` (do nasadenia ide
  `index.html rezervacia.html robots.txt sitemap.xml assets/ karta/ en/`, žiadna 404).
- **Dôkaz:** `vystup-oprava/vysledky.txt`: `FAIL [chybova/-] barbershop-30/404.html existuje … {"subor":false,
  "GET neexistujuca-stranka":404}`; `testy/live-404.log` (curl na nasadený web pod head-spa-30): zlá adresa, `karta/`,
  `en/`, `rezervacia.html` aj `admin/` vracajú `404 <title>Stránka sa nenašla | HEAD SPA 30 Nitra</title>` s odkazmi
  `tel:+421911153136` a `booqme.app/sk/rezervacia/salon-30-head-spa` – teda telefón a rezervácia iného podniku.
  Pri samostatnom nasadení (repozitár barbershop30) by sa ukázala anglická 404 GitHubu bez cesty späť.
- **Návrh:** rovnaký ako A3-03 (A3-seo/kolo-0/ZAPIS.md:64): `barbershop-30/404.html` v štýle webu, `noindex`, texty
  len zo stránky (Barbershop 30, Mostná 30, 0951 267 203, odkazy na úvod/služby/rezerváciu) a pridať ju do
  `nasad-barbershop30.sh` (cp) aj do kopírovania v `.github/workflows/pages.yml`. Jeden nález pre oba audity.

### A1-02 · drobná · „Objednať sa“ pri barberovi: prvý krok okna nepovie, že barber je už vybraný
- **Súbory:** `assets/objednavka.js:432–437` (odkaz z tímu nastaví len `pred.chce` = meno), `:197`
  (`if (s.barber && s.krok > 2)` – meno barbera sa v hlavičke ukáže až od kroku 3), `:190` (nadpis kroku 1 „Čo si dáš?“).
- **Dôkaz:** `vystup-oprava/vysledky.txt`: `OK [ukazka/pocitac] tím: Objednať sa u Nikolas otvorí objednávku s týmto
  barberom (až po výbere služby, krok 1 barbera nespomína)`; `testy/sonda-detaily.log`: `Objednať sa u Damian: krok 1
  spomína barbera=false; … → barber Damian vybraný po službe: true`; snímka `snimky/sonda-pocitac-barber.jpg`
  (krok 3 „Pánsky strih · Damian“ – funguje správne, len neskoro to povie).
- **Návrh:** v kroku 1 ukázať pod nadpisom čip „u Nikolasa“ (text z `s.chce`) rovnako, ako sa od kroku 2 ukazuje
  služba (`kusy`, riadky 193–198) – jeden riadok v `vykresli()`: `if (s.chce && s.krok === 1) kusy.push([s.chce, 1])`.
  Ten istý mechanizmus, žiadny nový vzhľad.

### A1-03 · drobná · Linka kapitol na počítači: po kliknutí na kapitolu 2–4 svieti bod nasledujúcej kapitoly
- **Súbory:** `assets/style.css:1116` (`.scene:not(#uvod) { scroll-margin-top: calc(-30vh - var(--nav-h) - 16px) }` –
  kotva pristane 30 vh pod začiatkom sekcie), `assets/app.js:166–172` (`closestSection`: značka `y + vh*0.4`),
  `index.html:211,234,257` (sekcie `vstup-dnu`, `remeslo`, `cakaren` vysoké 0,7 okna).
- **Dôkaz:** `testy/linka-sonda.log`: `linka #vstup-dnu y=1170 top=-270 … aktívny bod #remeslo`, `linka #remeslo …
  aktívny bod #cakaren`, `linka #cakaren … aktívny bod #tim`; `testy/linka-snimka.log`: `#vstup-dnu {"aktivny":"Remeslo",
  "scena":"3","karta":["Poď ďalej."]}` – na obrazovke je karta kapitoly Vstup dnu („Poď ďalej.“), ale svieti bod
  Remeslo; snímka `snimky/linka-vstup-dnu.jpg` (tretí bod oranžový pri karte „Prvý krok · Poď ďalej.“).
  Matematika: pristátie `y = top + 0,3·vh`, značka `y + 0,4·vh = top + 0,7·vh` = presne začiatok ďalšej 0,7-vh sekcie.
  DOPLNIŤ: výsledok `testy/kotvy-snimka.log` (aria-current po kliku).
- **Návrh:** v `closestSection` porovnávať s malou rezervou (`mark < s.top + s.height` → `mark <= s.top + s.height - 1`,
  alebo značku `y + vh * 0.39`). Vzhľad sa nemení.

### A1-04 · drobná · Stránka kartičky volá server vernosti, ktorý nie je nasadený: chyba 404 v konzole
- **Súbory:** `karta/index.html:2` (`data-api="https://www.headspa30.sk/vernost/api/" data-api-lokal="/vernost/api/"`),
  `karta/karta.js:10` (na 127.0.0.1 ide na `data-api-lokal`), `:96` (`fetch(\`${API}?a=stav\`)` → `.catch(mimo)`).
- **Dôkaz:** `vystup-ukazka/vysledky.txt`: `FAIL [karta/pocitac] karta/: … 404 (File not found) @ /vernost/api/?a=stav`,
  rovnako `karta/?nova`, `karta/?k=AAAA…` (`a=karta` aj `a=stav`), na počítači aj telefóne; `testy/live-404.log`:
  `https://www.headspa30.sk/vernost/api/?a=stav 404`. Stránka to zvláda – ukáže „Kartičky práve spúšťame … Zavolaj nám
  na 0951 267 203“ (`vystup-ukazka/karta-pocitac.jpg`), len každé otvorenie zapíše chybu do konzoly a kartička
  s kľúčom `?k=` sa nikdy nenačíta, kým server vernosti nebeží. (Zápis `404 /vernost/api/?a=stav` pri `index.html`
  v `vystup-zaklad` vznikol až po kliknutí na „Vernostná kartička“ v pätičke – patrí stránke `karta/`, úvodná je čistá.)
- **Návrh:** nič v kóde; po nasadení servera vernosti (`vernost/api/`) overiť `karta/?k=…` znova. Ak server nebude,
  zvážiť v `karty.js` skrytie odkazu na kartičku, kým nie je `data-zapnute`.

### A1-05 · drobná · „Kontakt“ v lište na počítači pristane s kontaktom v dolnej polovici obrazovky
- **Súbory:** `index.html:848` (`<footer class="site-footer" id="kontakt">` – kontakt je pätička vysoká 403 px),
  `assets/style.css:1116` (záporný `scroll-margin-top` platí len pre `.scene`, pätička je na konci stránky).
- **Dôkaz:** `vystup-oprava/vysledky.txt`: `FAIL [zaklad/pocitac] navigácia „Kontakt“ → #kontakt v zábere
  {"top":497,"bottom":900,"y":17189}` – stránka je doskrolovaná na koniec (`y` = maximum), kontakt začína až na 497 px
  z 900; rovnako `en/pocitac` (`["#kontakt",false]`); na telefóne v poriadku (`top 76`). DOPLNIŤ: snímka
  `snimky/kotva-pocitac-kontakt.jpg`.
- **Návrh:** len ak to majiteľovi prekáža (vzhľad v pokoji sa inak nemení): na počítači dať pätičke
  `min-height: calc(100vh - var(--nav-h))` alebo pred ňu doplniť vzduch, aby sa „Kontakt“ dal doskrolovať hore.
