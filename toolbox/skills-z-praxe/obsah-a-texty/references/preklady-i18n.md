# Preklady kľúčované slovenským textom

Implementácia: `assets/i18n.js` (zdroj, web načítava `assets/i18n.min.js` z `node tools/build.mjs`),
slovníky `assets/i18n/{cs,pl,hu,de,uk,en}.json`. Každý slovník má rovnakú sadu kľúčov
(stav 2026-10-11: 1023 kľúčov v každom zo šiestich súborov).

## Ako to funguje

1. Stránka sa otvára po slovensky. Iný jazyk sa nasadí, keď je v adrese `?lang=xx` alebo ho návštevník
   raz vybral (uložené v `localStorage` pod `hs30.lang`). Prehliadaču s iným jazykom sa jazyk len ponúkne
   prúžkom (`offer()`), aby sa text pred očami sám neprepisoval.
2. `collect()` raz prejde pôvodný slovenský obsah: textové uzly mimo `SCRIPT`, `STYLE`, `NOSCRIPT`,
   `svg` a `[data-no-i18n]`, ktoré obsahujú písmeno; atribúty `placeholder`, `aria-label`, `alt`, `title`
   (okrem hodnôt začínajúcich `http`); meta `description`, `og:description`, `og:title`, `og:image:alt`,
   `twitter:title`, `twitter:description` a `<title>`.
3. Kľúč je text po `norm()`: všetky medzery (aj pevné) zlúčené na jednu, orezané okraje.
   ```js
   function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
   ```
4. Preklad zachová medzery okolo textu (`put`) a „Head Spa“ spojí pevnou medzerou (`tie`).
5. Prekladá sa po dávkach 240 uzlov (`requestIdleCallback`), prvá dávka pokryje úvod; kým nie je
   hotová, úvod je skrytý triedou `t-wait` (najviac 1,5 s).
6. Text, ktorý skripty vložia neskôr, zachytí `MutationObserver` a preloží ho hneď (`adopt`).
7. Po nasadení sa nastaví `html[lang]`, `og:locale` a vyšle sa udalosť `langchange` (na ňu napr.
   `assets/app.js` prepíše adresy Booqme do jazyka návštevníka).
8. Keď sa slovník nestiahne, stránka ostane celá po slovensky (aj `lang`).

## Pridanie nového textu

1. Veta v `index.html` so slovenskou sadzbou (pevné medzery sú v poriadku, kľúč ich nemá).
2. Kľúč do všetkých šiestich súborov, hodnota v tykaní (du, ty, te, ти, you):
   ```json
   "Poukaz na ktorýkoľvek zo 17 rituálov kúpiš online.": "..."
   ```
3. Veta s odkazom alebo `<em>`: každý textový uzol zvlášť. Na stránke:
   `Prvýkrát u nás? Začni rituálom <a href="#klasicky-head-spa">Head Spa Classic</a>.` Kľúče v `en.json`:
   `"Prvýkrát u nás? Začni rituálom": "First time with us? Start with"` a samostatne názov rituálu.
   Uzol bez písmena (bodka na konci) sa nepreloží ani nekontroluje.
4. Nadpis delený na slová (`data-split`) potrebuje kľúč pre každé slovo (`Vypni`, `hlavu.`), lebo
   každé slovo je samostatný uzol. V `index.html` je jediný taký nadpis rozdelený už v HTML (spolu
   s celou vetou v `.vh` pre čítačky); nadpis bez `.vh` by rozdelil `splitLine` v `assets/app.js`.
5. Text skladaný v skripte: `window.HS30_LANG.t('slovenský text')` vráti preklad aktuálneho jazyka,
   alebo vlastný slovník v skripte pre texty s dátumom a časom (`TODAY_WORDS` v `assets/app.js` so
   siedmimi jazykmi a tvarmi dní, „v pondelok“, „vo štvrtok“).
6. Zmena slovenskej vety = zmena kľúča. Starý kľúč nájdi a premenuj vo všetkých šiestich súboroch;
   admin to robí sám a starý preklad označí „skontroluj preklad“ (README, Admin).
7. Kontrola z koreňa projektu: `node toolbox/skills-z-praxe/obsah-a-texty/scripts/i18n-kontrola.mjs index.html assets/i18n` vypíše pre každý jazyk texty
   bez kľúča a počet kľúčov, ktoré stránka v HTML nemá (môžu patriť textom zo skriptov, alebo sú
   po starých textoch; pred mazaním over `grep`, či ich nepoužíva skript).

## Názvy, čísla, značky

- Názvy služieb, ktoré podnik vedie po anglicky, sa neprekladajú („Head Spa Classic“ ostáva
  vo všetkých jazykoch). Slovenské názvy majú preklad („Spoločný Head Spa rituál“, en
  „Shared Head Spa ritual“). V Booqme a v podkladoch ostáva slovenský originál.
- Adresa, telefón, značka: hodnota rovnaká ako kľúč (`"HEAD SPA 30": "HEAD SPA 30"`), aby sa uzol nezmenil.
- Rozpätia a čísla v prekladoch sa menia s ponukou (admin ich prepočíta aj v slovníkoch).

## SEO pre jazyky

- `<link rel="alternate" hreflang="xx" href=".../?lang=xx">` pre cs, pl, hu, de, uk, en; `sk` a `x-default`
  vedú na adresu bez parametra.
- `sitemap.xml` má rovnaké jazykové adresy (README, Jazyky).
- `og:locale` sa mení podľa jazyka (`LANGS[].og`, napr. `de_AT`, `en_GB`).

## Pasce

- **Kľúč s pevnou medzerou sa nikdy nenájde** (kľúč je po `norm`). V JSON píš obyčajné medzery.
- **Uzol rozdelený skriptom inak ako v HTML** (počítadlá, delené nadpisy) potrebuje kľúče pre časti.
- **Atribút, ktorý prepísal skript** (napr. „Poukaz na rituál: názov“), sa prekladá po častiach
  oddelených `: ` (`retell`), každá časť potrebuje vlastný kľúč.
- **Rovnaký preklad pre dve rôzne slovenské vety.** Text, ktorý skript vloží už preložený (alebo
  atribút prepísaný skriptom), sa vracia na slovenský kľúč cez obrátený slovník (`liveRev` v `adopt`,
  `prevRev` v `retell`). Ak majú dve vety v jednom jazyku rovnaký preklad, obrátený slovník si pamätá
  len jednu a pri ďalšej zmene jazyka môže vzniknúť nesprávna veta. Preklady drž jednoznačné.
- **Text bez kľúča nevadí funkčne** (ostane po slovensky), preto chýbajúci preklad nikto neuvidí,
  kým nespustíš kontrolu.
