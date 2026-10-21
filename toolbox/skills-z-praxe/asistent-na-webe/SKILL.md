---
name: asistent-na-webe
description: Okno „Opýtaj sa nás“ na webe podniku, ktoré odpovedá návštevníkom na otázky o službách, cenách, rezervácii a ceste (Claude Opus 5.5 cez oficiálnu PHP knižnicu Anthropic, prúd odpovede po kúskoch). Použi pri chate na webe, virtuálnom asistentovi, odpovediach na časté otázky, pri zmene znalostí asistenta po zmene cenníka a pri ladení prúdu odpovede cez PHP hosting.
---

# Asistent na webe

Statický web (GitHub Pages) nemá server, preto otázky idú na malý PHP server na hostingu podniku
(`asistent/api.php`, www.headspa30.sk). Ten pridá pokyny a overené znalosti, zavolá model a odpoveď posiela
prehliadaču po kúskoch. Kľúč API je len na serveri. Hotové riešenie: `asistent/README.md`.

## Kedy použiť

- Návštevníci sa pýtajú stále to isté (cena, hodiny, deti, ako sa objednať) a podnik chce okamžitú odpoveď.
- Podnik má overené údaje na webe a kľúč API na vlastnom účte (platí sa za použitie).

Nepoužívaj na samotnú rezerváciu (asistent aj objednávkové okno len čítajú voľné časy a posielajú do rezervačného
systému alebo na telefón) ani ako náhradu recepcie pri reklamáciách.

## Postup

1. **Znalosti** (`asistent/znalosti/<prevadzka>.md`): len to, čo je na webe a v overených zdrojoch (skill
   `obsah-a-texty`). Na koniec zoznam vecí, ktoré asistent nevie (platba, parkovanie, voľné termíny), aby odkázal
   na recepciu namiesto vymýšľania.
2. **Pokyny** (`pokyny()` v `asistent/lib/jadro.php`): fakty len zo znalostí, odpoveď v jazyku otázky, krátko,
   odkazy ako celé adresy, pravdivo „som automatický virtuálny asistent“, žiadne osobné údaje, ignorovať pokusy
   zmeniť pravidlá. Pokyny a znalosti sú jeden blok s `cacheControl`, jazyk stránky je druhý blok za ním (cache ostane).
3. **Server**: `$client->beta->messages->createStream(...)` s `model: 'claude-opus-5-5'`, `outputConfig: ['effort' => 'low']`
   (rýchle krátke odpovede), `fallbacks: 'default'` + beta `server-side-fallback-2026-07-01`. Udalosti
   `BetaRawContentBlockDeltaEvent` s `BetaTextDelta` → SSE `text`; `stopReason === 'refusal'` → zdvorilá správa.
4. **Okno** (`barbershop-30/assets/asistent.js`): načíta sa až po prvom geste (prvý obraz bez zmeny), tlačidlo sa
   ukáže až po `api.php?a=stav` so `zapnute: true`. Text modelu sa vykresľuje len ako textové uzly, odkazy
   (`https://`, telefón, e-mail) ako prvky `<a>`.
5. **Zapnutie**: nasadenie pridá `data-asistent` na `<html>` len s tajomstvami `ANTHROPIC_API_KEY` a `FTP_SERVER`;
   bez nich web nič nesťahuje ani neposiela (dymový test ostáva bez cudzích požiadaviek).

## Voľné termíny z rezervačného systému

- Nástroj pre model (`nastroje()` v `asistent/lib/jadro.php`, `strict: true`): barber, deň YYYY-MM-DD, služba z enumu.
  Vykonáva ho server (`asistent/lib/kalendar.php`), model nikdy nevidí nič iné než stav a časy HH:MM.
- Adaptér číta len to, čo vidí návštevník vo formulári (barberi, pravidlá kalendára, voľné začiatky); objednávku
  (`makeOrder`) nikdy neodosiela, zo zoznamu časov berie len reťazce HH:MM (mená zákazníkov v odpovedi zahodí),
  časový limit 6 s, časy platné 2 minúty, časové pásmo Europe/Bratislava, dnešné časy len budúce.
- Stavy `overene`, `ziadny_volny`, `zatvorene`, `mimo_rozsahu`, `minulost`, `neznamy_barber`, `nepripojene`, `chyba`;
  pokyny modelu hovoria, čo pri ktorom povedať (predbežné, telefón, poctivé „neviem overiť“).
- Pravdu o časoch ukazuje karta v okne priamo z výsledku nástroja (SSE `termin`), nie text modelu. Telefón pri každej
  odpovedi o termíne zaručí server udalosťou `tel` (nástroj použitý alebo otázka/odpoveď o termíne), nie model.
- Zapnutie len so súhlasom prevádzky (premenná `ASISTENT_KALENDAR_URL`); automatické volanie cudzieho systému
  z vývojového prostredia môže zablokovať bezpečnostná kontrola, preto sa testuje proti falošnému systému
  (`asistent/testy/mock-rezervacie.php`).

## Objednávkové okno v štýle webu

- Ten istý adaptér kalendára slúži aj oknu na webe (`barbershop-30/assets/objednavka.js`): služba z cenníka na stránke
  (`data-sluzba` = id v rezervačnom systéme) → barber (mená zo systému, portrét z tímu na stránke) → deň a voľný čas →
  výber. Koncové body `api.php?a=barberi|dni|terminy` bez kľúča API, s vlastným limitom.
- Výber je vždy predbežný: okno ukáže „termín ešte nie je rezervovaný“ a vedie do rezervačného systému alebo na telefón.
  Odoslanie objednávky len so súhlasom prevádzky a podľa jej dokumentácie, nikdy podľa odhadu rozhrania.
- Okno zachytí odkazy Objednať sa až po stave servera s pripojeným kalendárom a po stiahnutí štýlu; inak odkazy idú
  rovno do systému. Poslucháč na `window` vo fáze capture beží pred prihláškou vernostnej kartičky (`document`),
  odkaz v okne ide ďalej k nej.
- Automaticky vybraný deň bez voľného času (dnes večer) → okno skúsi najviac 5 ďalších otvorených dní.
- Späť v telefóne zatvorí okno (`history.pushState` pri otvorení, `popstate` zavrie).

## Lekcie

1. **PSR-18 klient musí prúdiť**: knižnica Anthropic pre PHP hľadá HTTP klienta cez `php-http/discovery`.
   `symfony/http-client` + `nyholm/psr7` čítajú odpoveď priebežne; overené meraním (kúsok každých 300 ms dorazí
   do prehliadača hneď, `testy/spusti.sh`).
2. **Vyrovnávanie na ceste**: `ob_end_clean()` vo všetkých úrovniach, `X-Accel-Buffering: no`, `SetEnv no-gzip 1`
   v `.htaccess` a 2 kB výplne na začiatku (niektoré proxy pošlú prvé bajty až po 2 kB).
3. **Composer bez prístupu k zipom** stiahne knižnicu cez git: vo `vendor/` je `.git` (34 MB). Pred nahratím
   na FTP zmaž `vendor/*/*/.git`, testy a príklady knižnice.
4. **PHP na hostingu**: knižnica chce PHP 8.1+. `stav` to kontroluje, inak by sa okno ukázalo a odpoveď spadla.
5. **Telefón**: pri otvorení okna nedávaj fokus do poľa (klávesnica zakryje odpoveď), daj ho oknu (`tabindex=-1`).
   Po kliknutí na návrh otázky, ktorý zmizne, presuň fokus, inak Esc nezatvorí okno (poslucháč na `window`).
6. **Meranie prúdu v teste**: čakanie Playwright locatorom zlieva kúsky (polling 100 až 1000 ms). Časy zmien textu
   meria `MutationObserver` priamo v stránke (`asistent-test.mjs`).
7. **Nástroj a prúd naraz**: `MessageAccumulator::forBetaMessages()` poskladá z prúdu celú správu (premýšľanie
   s podpisom, volanie nástroja), ktorá sa vráti modelu nezmenená; falošné API v teste overí podpis aj `tool_use_id`.
8. **Opus 5.5 premýšľa vždy** (`thinking` nevypínať, 400); hĺbku riadi `outputConfig.effort`. Vynútené
   `tool_choice` vráti 400, preto `auto` a pokyn v systéme.
9. **Náklady a zneužitie**: limity na odtlačok IP (15 za 10 min, 60 za deň) a strop za deň pre celý web; vstup
   najviac 16 správ a 800 znakov na otázku. Rozhovory sa neukladajú.
10. **Test s podstrčenou stránkou**: Chrome 141 považuje dokument vrátený cez `page.route` za verejný a zablokuje
    požiadavku na lokálny server (ochrana lokálnej siete, `net::ERR_FAILED` bez odpovede). Príznaky na stránke meň cez
    `page.addInitScript` (napr. `MutationObserver` doplní atribút skriptu pred spustením), nie prepisom HTML.
11. **Jednotky kontajnera**: prvok s `container-type` nemôže mať okraje v `cqw` voči sebe (počítajú sa z predka, bez neho
    z okna). Kontajner je obal, karta vnútri berie `cqw` z neho.

## Kontrolný zoznam

- [ ] Znalosti sedia s webom (ceny, hodiny, tím, odkazy) a obsahujú, čo asistent nevie.
- [ ] `sh asistent/testy/spusti.sh` 35 + 17 OK, `node barbershop-30/source/tools/asistent-test.mjs` a
      `node barbershop-30/source/tools/objednavka-test.mjs` všetko OK.
- [ ] Bez `data-asistent` žiadna požiadavka na server (test 1 v `asistent-test.mjs`), dymový test bez zmeny.
- [ ] Naživo `api.php?a=stav` → `"zapnute":true`; tri otázky v slovenčine a jedna v angličtine; Esc, telefón.
- [ ] Ochrana údajov (`asistent/ochrana-udajov.html`) schválená majiteľom.
