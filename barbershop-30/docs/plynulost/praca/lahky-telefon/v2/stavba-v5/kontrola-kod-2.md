# V5 etapa 1 – Recepcia: kontrola kódu, kolo 2 (23. 10. 2026, 11:03–11:06 UTC)

Kontrolór je nezávislý a v strome nič nemenil. Strom: `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD `0cdfdd4`,
6 commitov nad `f624ee8`. `git status --short` je prázdny. `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Cesty sú relatívne k `barbershop-30/`.

**Verdikt: stále NEPRIJAŤ.** Oprava 1 (`8dcfc57`, `cfc7901`, `0cdfdd4`) riešila len vážne obsahové nálezy V1–V3 a tie
sedia. Všetkých 5 stredných nálezov kódu z kola 1 (S1–S5) a drobné D1–D10 je v kóde **nezmenených**. Zopakoval som ich na HEAD.
Pribudli dva nové stredné nálezy: N1 (odpoveď na trvanie) a N2 (rozšírenie S1).
Vážny nález v kóde nie je: bezpečnosť, váha, `index.html` aj i18n prechádzajú.
Kontrola v prehliadači je znova **ODLOŽENÁ**.

## Čo prešlo (zmerané v tomto kole)

| čo | dôkaz |
|---|---|
| index.html bez zmeny | `git diff --quiet f624ee8..HEAD -- index.html` → „index.html bez zmeny“; gzip 16 537 → 16 537 B |
| prírastok prvého okna ≤ 0,5 kB | `gzip -6 <` : app.js 20 532 → 20 829 (**+297**), style.css 20 874 → 21 053 (**+179**), spolu **476 B** |
| panel sk ≤ 10 kB | gzip CLI: recepcia.js 3 566 + recepcia.css 1 000 + sk.json 5 614 = **10 180 B**. Node zlib (test 5): **10 207 B** ≤ 10 240, rezerva 33 B |
| iný jazyk ≤ 12 kB | podľa testu najviac uk **11 134 B**, ostatné 9 983–10 450 B |
| testy | `node --test source/tools/recepcia-test.mjs` → `tests 11, pass 11, fail 0`; 284 otázok, správne 100,0 %, falošné na nevieme 0, fallback 0; čas priemer 0,262 ms, max 0,615 ms |
| doplnkové skúšky | `dom-skuska.mjs`: všetky riadky OK, na konci `hotovo`. `skuska-jazyky.mjs`: `spolu 112, nesprávne 0, falošné odpovede na nevieme 0` |
| JSON = generátor | Kópia `assets/recepcia` + `i18n` do dočasného priečinka, `python3 -I jazyky-gen.py <kópia>`, `diff -rq` → „JSON zhodne s generatorom“. Kópia je zmazaná |
| XSS | Nový `innerHTML` je len na dvoch miestach a oba sú stále reťazce: SVG v app.js (diff +9) a `KOSTRA` (recepcia.js:118–120, 123). Otázka aj text z JSON idú cez `el()`/`textContent` (recepcia.js:68). `insertAdjacentHTML`, `outerHTML` ani `document.write` sa v diffe nevyskytujú |
| eval, úložisko, sieť | grep pridaných riadkov na `eval(\|new Function\|localStorage\|sessionStorage\|cookie\|indexedDB\|XMLHttp\|sendBeacon\|WebSocket` = 0. Sieť: `import('./recepcia.js')` (app.js 7d) a `fetch` `recepcia/<jazyk>.json` cez whitelist `^(en\|uk\|hu\|sr\|pl\|de\|cs)$` (recepcia.js:69). Ďalší `import(` je len v teste |
| CSP | bez inline `style=`, bez `eval`, CSS cez `<link>` z rovnakého pôvodu (recepcia.js:122). Stránka CSP nemá (`grep -i content-security index.html` = 0), kód je s ňou napriek tomu kompatibilný |
| výkon | Nový kód nemá poslucháča `scroll` ani `will-change` (grep = 0). Tlačidlo je `position: fixed`, animuje len `opacity` (style.css:1236–1237), vzniká vo `vPokoji` 1,5 s po `load`. Modul aj CSS sa načítajú až po ťuknutí |
| i18n | V 7 slovníkoch pribudol jediný kľúč „Spýtaj sa recepcie“ (262 → 263, odobraté 0, zmenené 0; skript nad `git show f624ee8:`). Žiadny text `panel`/`volby` v 7 jazykoch sa nezhoduje so slovenským. `fallback` aj `odovzdanie` sú preložené. Zhodné reťazce sú len vlastné mená a údaje (e-mail, „Ultra inclusive Barbershop30“, „Online 24/7“, @instagram) a v cs „Od roku 2019“ a „bezbariérový vstup“, ktoré sú správne po česky. Dialóg má `data-no-i18n`, jazyk podľa `html.lang` (recepcia.js:67, 131) |
| AI v strome | `grep -n -i -E "\bai\b\|umel\w* intelig\|chatbot"` nad 20 zmenenými súbormi: zásahy sú len v `source/tools/recepcia-test.mjs:17, 235, 242` (D6, nenasadzuje sa). Nasadzované súbory = 0. Rozšírený grep (artificial, künstlich, sztuczn, штучн, mesterséges, uměl) na pridaných riadkoch = 0. Správy commitov = 0 a sú bez podpisov |
| lint | `eslint --no-config-lookup` s pravidlami no-undef, no-unused-vars, no-eval, no-implied-eval na recepcia.js → exit 0. `node --check assets/app.js` → OK |
| mená | identifikátory sú po slovensky bez diakritiky (`odpovedz`, `zhoda`, `priprav`, `prepni`, `spytaj`, `postav`, `spusti`) |

## Nálezy

### STREDNÉ – z kola 1, stále otvorené (kód nezmenený)

**S1 – Krátke kmene odpovedajú na nesúvisiace otázky.** Na HEAD sa správa rovnako ako v kole 1 (`odpovedz` nad `sk.json`):

```
detailny strih   -> odpoved deti 1.50  „Strih pre malých gentlemanov 15 €“
synteticke vlasy -> odpoved deti 1.00
sedacka          -> odpoved farbenie-brady 0.67 „Farbenie brady 10 €“
Si robot? / rozmyslam / Rodicia / Ronaldo -> nevieme sviatky 0.60
rovno -> nevieme bez-objednania ; romantika -> nevieme romana-ceny 2.00
```

Príčina je stále v recepcia.js:20 (`w.startsWith(k)` aj pre kmene ≤ 3 znaky: `Det`, `Syn`, `sed`, `rok`…) a v :23.
Test tieto otázky stále neobsahuje (`grep -i "detailny\|synteticke\|sedacka\|ronaldo"` v teste = 0). Návrh je ako v kole 1.

**S2 – Koliesko alebo ťah v otvorenom paneli môže na počítači s filmom spustiť `leave()`** (PLAUSIBLE, potrebný prehliadač).
`film.js:1398` `locked()` stále nepozná `dialog[open]`. Pri wheel (`:1400–1402`) sa `typing()` nevolá. app.js:520 to rieši,
film.js nie. Návrh: `stopPropagation` pre `wheel`/`touchmove` na `dlg` v `postav()`.

**S3 – Pásy filmu (`z-index: 38`, style.css:593–597) zakrývajú tlačidlo (`z-index: 36`, style.css:1236), ktoré sa dá
stále stlačiť.** Bez zmeny.

**S4 – `.rc-zdroj` a `.rc-pozn` majú kontrast 4,41:1 < 4,5:1.** Prepočet WCAG: `--paper-3` #8e8578 na 6 % `--paper` nad
`--ink-2` = **4,41**. `--paper-2` na tom istom pozadí = 8,75 a `--paper-3` na čistom `--ink-2` (`.rc-sukromie`) = 5,04
(recepcia.css:16, 18). Oprava je zadarmo.

**S5 – Panel sa môže ukázať bez štýlu.** `spusti` (recepcia.js:133–141) stále čaká len na `prepni`, nie na `link.onload`
z `postav()` (:122).

### STREDNÉ – nové v kole 2

**N1 – Položka `trvanie` (`0cdfdd4`) odpovedá trvaním strihu a brady na otázku o akejkoľvek službe a pri farbení brady
uvádza nesprávny čas.** Kmene `Trvanie Minut =Trva =Trvat =Casu =Casovo dlho strih brad` sú silné aj bez služby.

```
sk  ako dlho trva farbenie          -> odpoved trvanie  „Pánsky strih 40 min / Úprava brady 20 min“
sk  ako dlho trva balicek           -> odpoved trvanie  (to isté; Balíček 1 má podľa index.html:590 65 min)
de  wie lange dauert Bartfärben     -> odpoved trvanie  „Herrenhaarschnitt 40 Min. / Bartpflege 20 Min.“
                                       stránka: Farbenie brady 30 min (index.html:577–578)
sk  kolko minut mam cakat           -> vyber kava,trvanie
en  how long does head shave take   -> odpoved hlava „Head shave 13 €“ (cena, nie 25 min z index.html:554)
```

Vety pochádzajú zo stránky, odpovedajú však na inú službu. Pri „Bartfärben“ návštevník vyčíta 20 min namiesto 30.
- Návrh: v `trvanie` nechať silné len kmene trvania. Keď otázka obsahuje silný kmeň inej položky s cenou, uprednostniť
  túto položku a k nej ukázať jej `price-time`. Na to stačí pridať trvanie do `odpoved` cenových položiek, napr.
  `["Farbenie brady","10 €","30 min"]`. Riadky trvania sú v stránke vždy hneď pod cenou, takže zdroj sa nemení.
  Druhá možnosť: `trvanie` vetovať, ak je v otázke silný kmeň inej služby, a dať odovzdanie „Celý cenník“.
- Do testu pridať: farbenie, Bartfärben, balíček, head shave + „how long“.
- Pozor na rezervu 33 B v sk.

**N2 – Zdvorilostné slová dostanú cenu detského strihu (trieda S1, nový dôkaz).**

```
sk  dekujem               -> odpoved deti 0.60 „Strih pre malých gentlemanov 15 €“
sk  mate detsku stolicku  -> odpoved deti 1.00
sk  kolko stoji detske sedadlo -> odpoved deti 1.00
```

„Dekujem“ (česky alebo preklep „ďakujem“) je bežná posledná správa v rozhovore. Príčina je kmeň `Det`, recepcia.js:20 a :23.
Vyrieši to rovnaká oprava ako S1. Do testu pridať `dekujem` / `dakujem` / `dik` ako fallback.

### DROBNÉ – z kola 1, stále otvorené

- **D1** Tlačidlo ignoruje `html[data-motion="off"]`. V style.css:1235–1242 také pravidlo pre `.recepcia-btn` nie je.
  Ostatné prvky ho majú (napr. :414, :588).
- **D2** Nad 900 px je panel `right: 24px` (recepcia.css:23), tlačidlo `right: var(--gutter)` = 40 px (style.css:38, 1236).
- **D3** Tiché zlyhanie offline: `.catch(() => {})` v app.js 7d, `nacitaj` → `null` a `spusti` sa vráti (recepcia.js:69, 137).
- **D4** Časová bomba v teste: `overene` ≤ 90 dní (recepcia-test.mjs:160, 164). 30 položiek má 2026-10-21, takže test
  **zlyhá od 2027-01-20**. Okrem toho `gz()` vráti 0 pre chýbajúci súbor (:236) a `JAZYKY` aj `subory` filtrujú cez
  `existsSync` (:30, :241).
- **D5** `norm(o).replace(/ /g, ' ')` (recepcia-test.mjs:178) nahrádza medzeru medzerou.
- **D6** Slovo „AI“ je v teste (recepcia-test.mjs:17, 235, 242). Súbor sa nenasadzuje, zadanie však chce v kóde nulu.
- **D7** Po kotve (Celý cenník a pod.) sa fokus vráti na tlačidlo recepcie (recepcia.js:73, 128), nie na cieľ.
- **D8** Obrys fokusu prvej voľby môže byť orezaný (`.rc-chips` `overflow-x: auto`, `padding: var(--s2) 0`, recepcia.css:10). Overiť snímkou.
- **D9** Husté riadky bez komentára k bodovaniu (recepcia.js:9, 28, 42, 53). Diceov vzorec (:16) platí len vďaka `splice`.
- **D10** README neuvádza `recepcia-test.mjs` (`grep -c -i recepcia README.md` = 0).

### DROBNÉ – nové

- **D11** `kolko stoji strich a brada` → `odpoved cena-brada` („Úprava brady 15 €“). Otázka pýta kombináciu, existuje však
  položka `cena-strih-brada`. Preklep „strich“ (0,6) prehrá s presnou „brada“. Lepšia by bola ponuka „Myslíš toto?“.
  Rieši sa spolu s N1/S1 a do testu treba pridať jeden riadok.
- **D12** Súbeh v `prepni` (recepcia.js:112–116): pri dvoch rýchlych `langchange` môže neskôr dorazený starší JSON prepísať
  `kb` na predchádzajúci jazyk. Je to málo pravdepodobné. Stačí po `await` overiť `if (code !== jazyk()) return`.

## ODLOŽENÉ (nie prejdené)

O 11:03 aj 11:05 UTC bolo `pgrep -c -f "headless_shell|chrome-linux/chrome"` = **2** (prehliadač iného tímu).
`pgrep -f "http.server 86[01]"` nič nenašiel (exit 1). Podľa pravidla som prehliadač nespustil a port 8710–8714 som nepoužil.

Odložené zostáva:
- `i18n-test.mjs`, `app-smoke.mjs`, `vaha.mjs`, `karty-shot.mjs`;
- snímky 390 × 844 a 1440 × 900: tlačidlo voči zhluku, `.lang-offer`, pásy filmu (S3), posun šírky pri `showModal()`, D8;
- S5 pri spomalenej sieti a S2 koliesko na vrchu stránky s filmom;
- nový stav „Myslíš toto?“ s jedným tlačidlom (oprava 1 ho v prehliadači nevidela);
- iPhone a VoiceOver (kritériá 8.4–8.5, len majiteľ).

## Poradie pred kolom 3

1. **S1 + N2** (kmene ≤ 3 znaky len ako celé slovo, DL na predpone od 5 znakov) a **N1** (trvanie podľa služby). Do testu
   pridať všetky otázky z tejto správy.
2. **S4** (zadarmo), **S5** (~40 B), **S3**, **S2**, potom D1–D4 a D6. Rezerva v sk je 33 B.
3. Po uvoľnení prehliadača spustiť ODLOŽENÉ behy.
