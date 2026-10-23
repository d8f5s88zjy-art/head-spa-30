# V5 etapa 1 – Recepcia: kontrola kódu, kolo 3 (23. 10. 2026, 11:15–11:19 UTC)

Kontrolu robil nezávislý kontrolór a v strome nič nemenil.
- Strom: `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD `d4657b7`, 8 commitov nad `f624ee8`. `git status --short` je prázdny.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
- Cesty sú relatívne k `barbershop-30/`.
- Dočasná kópia na kontrolu generátora (`stavba-v5/k3-tmp`) je zmazaná.

**Verdikt: NEPRIJAŤ.**
- Oprava 2 (`c1b4a48`, `d4657b7`) zmenila iba dáta a test: `git diff 0cdfdd4..HEAD --stat` ukazuje 8× JSON a test,
  `recepcia.js`, `recepcia.css`, `app.js` ani `style.css` sa nezmenili.
- Všetky nálezy kódu z kola 2 (S1–S5, N1, N2, D1–D12) som na HEAD zopakoval a **všetky platia**.
- Nové dôkazy k S1/N1/N2 ukazujú, že pri bežných správach („sorry“, „köszönöm“, „děkuji“, „dekujem“, „detox“)
  aj pri otázkach na trvanie inej služby panel ukáže **cenu alebo trvanie inej služby**. Kontrola obsahu túto triedu
  chýb v kole 2 hodnotí ako vážnu (V4, V5). Pre jednotné meradlo ich preto preraďujem medzi **vážne (K1, K2)**.
- Bezpečnosť, váha, `index.html`, i18n a lint prechádzajú.
- Kontrola v prehliadači je znova **ODLOŽENÁ**.

## Čo prešlo (zmerané v tomto kole)

| čo | dôkaz |
|---|---|
| index.html bez zmeny | `git diff --quiet f624ee8..HEAD -- index.html` → „index.html bez zmeny“; `gzip -6`: 16 537 → 16 537 B |
| prvé okno +≤ 0,5 kB (krit. 8.1) | `gzip -6 <`: app.js 20 532 → 20 829 (**+297**), style.css 20 874 → 21 053 (**+179**), spolu **476 B** |
| panel sk ≤ 10 kB (krit. 8.2) | Node zlib (test 5): recepcia.js 3 597 + recepcia.css 998 + sk.json 5 635 = **10 230 B** ≤ 10 240, **rezerva 10 B** (pozri S6). gzip CLI: 3 566 + 1 000 + 5 637 = 10 203 B |
| iný jazyk ≤ 12 kB | en 9 987, sr 10 039, de 10 136, cs 10 286, hu 10 361, pl 10 458, **uk 11 139 B** (limit 12 288) |
| testy | `node --test source/tools/recepcia-test.mjs` → `tests 11, pass 11, fail 0`. Výpis: 294 otázok (nevieme 85), správne 100,0 %, falošné na nevieme 0, fallback 0, „Myslíš toto?“ 3. Čas: priemer 0,264 ms, max 0,612 ms (limit 5 ms) |
| JSON = generátor | Kópia `assets/recepcia` + `i18n` + `index.html` do `stavba-v5/k3-tmp`, `python3 -I jazyky-gen.py <kópia>`, `diff -rq` → „JSON zhodne s generatorom“. Kópia je zmazaná |
| XSS | V pridaných riadkoch je `innerHTML` len 2× a oba sú stále reťazce: SVG ikona (app.js 7d) a `KOSTRA` (recepcia.js:118–120, 123). Otázka aj text z JSON idú cez `el()` → `textContent` (recepcia.js:68). `insertAdjacentHTML`, `outerHTML`, `document.write` ani `setTimeout('…')` sa v diffe nevyskytujú |
| eval, úložisko | `eval(`, `new Function`, `localStorage`, `sessionStorage`, `cookie`, `indexedDB`, `XMLHttp`, `sendBeacon`, `WebSocket`, `EventSource` = 0 v pridaných riadkoch `assets/` |
| sieť | Pridaný kód načítava len `import('./recepcia.js')` (app.js 7d) a `fetch(new URL('recepcia/<jazyk>.json', import.meta.url))` cez whitelist `^(en\|uk\|hu\|sr\|pl\|de\|cs)$`, inak `sk` (recepcia.js:69). Adresy `https://` v JSON (booqme, barbershop30.sk/rezervacia, Google Maps, Instagram) sú iba `href` odkazov a otvárajú sa až po kliknutí, s `rel="noopener"` (recepcia.js:73) |
| CSP | Kód nemá inline `style=` ani `eval`. CSS sa načítava cez `<link>` z rovnakého pôvodu (recepcia.js:122) |
| výkon | Pridaný kód nemá `scroll`, `wheel`, `touchmove`, `resize` poslucháča ani `will-change` (grep = 0). Tlačidlo je `position: fixed` a animuje len `opacity` (style.css:1236–1237). Vzniká vo `vPokoji` 1,5 s po `load` (app.js 7d, `vPokoji` app.js:436). Modul, CSS aj JSON sa načítajú až po ťuknutí |
| i18n | 7 slovníkov: 262 → 263 kľúčov, pribudol jediný kľúč „Spýtaj sa recepcie“, ostatné nezmenené (porovnanie s `git show f624ee8:`). V `panel` sa so sk zhoduje len `akcie.instagram` („Instagram“, vlastné meno). `fallback` a `odovzdanie` sú vo všetkých 7 jazykoch preložené. Témy `nevieme` sa so sk zhodujú len v cs `bezbarierovy`, čo je správna čeština. Dialóg má `data-no-i18n`, jazyk sa riadi `html.lang` a `langchange` (recepcia.js:67, 104, 131) |
| prístupnosť (kód) | `<dialog>` + `showModal()`, `aria-labelledby="rc-h"`, Esc natívne, fokus na prvú voľbu (recepcia.js:141) a po zatvorení späť na tlačidlo (:128). Tlačidlo má `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` a `aria-label`. `aria-label` sa prepíše pri `langchange`. Log má `role="log" aria-live="polite"` (:119). Zavretie má preložený `aria-label` (:106). `prefers-reduced-motion` je ošetrený (recepcia.css:24, style.css:1242). Globálny `:focus-visible` dáva 2 px obrys `--lamp` (style.css:96) |
| kontrast | `--paper` na bubline 13,32:1, `.rc-sukromie` (`--paper-3` na `--ink-2`) 5,04:1, `.rc-send` (`--ink` na `--lamp`) 5,42:1. Výnimka je S4 |
| AI v nasadzovaných súboroch | `grep -n -i -E "\bai\b\|umel\w* intelig\|chatbot"` nad 20 zmenenými súbormi: výskyt je **len** v `source/tools/recepcia-test.mjs:17, 241, 248` (pozri D6). Správy 8 commitov: `\bai\b\|umel… intelig\|chatbot\|co-authored\|claude` = 0 |
| lint | `eslint --no-config-lookup` s pravidlami no-undef, no-unused-vars, no-eval, no-implied-eval na recepcia.js skončil s exit 0. `node --check` na `app.js` a na teste: OK. Všetkých 8 JSON sa dá načítať |
| mená | Identifikátory sú po slovensky a bez diakritiky (`odpovedz`, `zhoda`, `priprav`, `prepni`, `spytaj`, `postav`, `spusti`, `vytvor`, `neskor`) |

## Nálezy

### VÁŽNE (preradené zo S1/N1/N2 podľa meradla kontroly obsahu V4/V5)

**K1 – Bežná správa alebo nesúvisiace slovo dostane cenu detského strihu (15 €) v sk, cs, en aj hu.**

Dôkaz na HEAD `d4657b7` (`odpovedz` nad `assets/recepcia/<jazyk>.json`, node):
```
en | sorry                      -> odpoved deti 0.60 [["Little gentlemen's cut","15 €"], …]
hu | köszönöm                   -> odpoved deti 0.60 [["Hajvágás kis úriembereknek","15 €"], …]
cs | děkuji                     -> odpoved deti 0.60 [["Střih pro malé gentlemany","15 €"], …]
sk | dekujem                    -> odpoved deti 0.60
sk | detox / kolko stoji detox  -> odpoved deti 2.00 / 1.33
sk | detailny strih             -> odpoved deti 1.50
sk | synteticke vlasy           -> odpoved deti 1.00
sk | mate detsku stolicku / kolko stoji detske sedadlo -> odpoved deti 1.00
sk | sedacka                    -> odpoved farbenie-brady 0.67 „Farbenie brady 10 €“
pl | dziękuję                   -> nevieme romana-ceny 0.60   (bez ceny, zlá téma)
sk | Si robot? / Ronaldo        -> nevieme sviatky 0.60      (bez ceny, zlá téma)
```

- Prečo je to vážne:
  - „Ďakujem“ alebo „sorry“ býva posledná správa rozhovoru. Ako odpoveď prišla cena služby, na ktorú sa návštevník nepýtal.
  - Je to tá istá trieda ako V4 a V5 („cena inej služby“) a riziko z `asistent.md:584`.
- Príčina je v kóde, nie v dátach (recepcia.js:20, 23):
  - `:23`: pri kmeni dĺžky 3 sa DL ≤ 1 skúša aj na predpone dĺžky `k.length - 1` = **2**. Slovu dlhšiemu ako 4 znaky
    preto stačia **prvé dve písmená** kmeňa: `sorry` → `so` ~ `Son`, `dekujem` → `de` ~ `Det`, `koszonom` → `kos` ~ `kis`.
  - `:20`: `w.startsWith(k)` platí aj pre 3-znakové kmene, takže `detox`, `detailny`, `detsku` → `Det` (silný, 2 body).
  - Rozsah: kmeňov s ≤ 3 znakmi je sk 19 (silných 12), cs 15 (9), en 19 (9), hu 29 (12), sr 36 (17), uk 18 (8), pl 16 (5) a de 3 (3).
- Návrh (kód, ~30 B gzip):
  - Pre `k.length ≤ 3` povoliť len `w === k` alebo `w.startsWith(k)`, a to iba vtedy, keď `w.length ≤ k.length + 3`
    (`det`/`deti`/`detsky` áno, `detailny`/`detox` nie).
  - DL na predpone (`:23`) povoliť až od `k.length ≥ 5` a len s `n ≥ k.length`.
  - Potom znova spustiť všetky sady (`k2-otazky*.txt`, `o1-otazky.txt`, `o2/otazky.txt`) a porovnať ich s `o2/v5-vystup.txt`.
- Do testu pridať ako fallback: `sorry`, `köszönöm`, `děkuji`, `dekujem`, `dziękuję`, `detox`, `detailny strih`,
  `synteticke vlasy`, `sedacka`, `mate detsku stolicku`. Pozor, pridať treba **iné** tvary, nielen tieto (S8 z kontroly obsahu).

**K2 – Otázka na trvanie inej služby dostane trvanie strihu a brady (40/20 min). Pri holení a farbení brady je to
nesprávny údaj.**

```
sk | ako dlho trva holenie        -> odpoved trvanie „Pánsky strih 40 min / Úprava brady 20 min“
                                     stránka: Holenie do hladka Hot Towel 30 min (index.html:571–572)
de | wie lange dauert Bartfärben  -> odpoved trvanie „Herrenhaarschnitt 40 Min. / Bartpflege 20 Min.“
                                     stránka: Farbenie brady 30 min (index.html:577–578)
sk | ako dlho trva farbenie / ako dlho trva balicek -> odpoved trvanie (to isté)
sk | casovo to stihnem?           -> odpoved trvanie
en | how long does head shave take   -> odpoved hlava „Head shave 13 €“ (cena, nie 25 min z index.html:554)
en | how long does beard dyeing take -> odpoved farbenie-brady „Beard colouring 10 €“ (cena bez 30 min)
sk | kolko trva peeling           -> odpoved plet 21,50 € (cena bez trvania)
```

- Návštevník, ktorý sa pýta na holenie, vyčíta 40 alebo 20 min namiesto 30 min. To je nepravdivý údaj o službe.
- Príčina je v dátach `trvanie` (`sk.json`, kmene `Trvanie Minut =Trva =Trvat =Casu =Casovo dlho strih brad`). Silné kmene
  trvania stačia samy, kód (recepcia.js:57) nemá spôsob, ako uprednostniť službu z otázky.
- Návrh je rovnaký ako v kole 2:
  - Riadok `price-time` doplniť do `odpoved` cenových položiek. Je na stránke hneď pod cenou, zdroj sa teda nemení.
  - V `trvanie` nechať odpoveď len pre otázku bez inej služby.
  - Druhá možnosť: `trvanie` vetovať, keď otázka obsahuje silný kmeň inej položky, a dať „Celý cenník“.

### STREDNÉ

- **S2 – koliesko, ťah alebo kláves v otvorenom paneli môže na počítači s filmom spustiť `leave()` / `startPro()`.**
  Stav: PLAUSIBLE, overenie potrebuje prehliadač.
  - `film.js:1398` `locked()` stále nepozná `dialog[open]`.
  - Pri wheel (`:1400–1402`) sa nekontroluje nič iné.
  - Pri keydown (`:1414`) chráni len `typing(e)`. Ak klik do textu bubliny presunie fokus na `body`, šípka hore
    alebo medzerník pôjde filmu.
  - app.js:520 to pre vlastný wheel rieši (`document.querySelector('dialog[open]')`), film.js nie.
  - Návrh: v `postav()` pridať `stopPropagation` pre `wheel`/`touchmove`/`keydown` na `dlg`, alebo pridať `dialog[open]` do `locked()`.
- **S3 – pásy filmu zakrývajú tlačidlo, ktoré sa dá stále stlačiť.** Pásy majú `z-index: 38` (style.css:593), tlačidlo
  `z-index: 36` (style.css:1236). Bez zmeny.
- **S4 – `.rc-zdroj` a `.rc-pozn` majú kontrast 4,41:1 < 4,5:1.** Je to `--paper-3` #8e8578 na bubline 6 % `--paper` nad
  `--ink-2` (recepcia.css:16, 18). Výpočet podľa WCAG je zopakovaný v tomto kole. Oprava je zadarmo:
  `--paper-2` dáva 8,75:1.
- **S5 – panel sa môže ukázať bez štýlu.** `spusti` (recepcia.js:133–141) čaká len na `prepni`, nie na `link.onload`
  z `postav()` (:122).
- **S6 (nové) – rozpočet 10 B blokuje opravy.**
  - sk má rezervu 10 B (10 230 / 10 240). Oprava S5 (~40 B) alebo K1 by limit 8.2 prekročila.
  - Zistenie: `recepcia.js` pri behu nečíta `p.zdroj` ani `p.overene`. Jediné `.zdroj` (:84) je `kb.panel.zdroj`.
  - Ak sa obe polia presunú do súboru len pre test, sk.json klesne z 5 635 na **5 282 B** (−353 B) a uk z 6 544 na 6 182 B.
  - Návrh však `zdroj` v JSON výslovne chce (`asistent.md:130–131, 171`) a etapa 2 ho má použiť ako bázu. Je to preto
    **rozhodnutie pre zadávateľa**, nie oprava, ktorú môže autor urobiť sám.
  - Druhá možnosť: kratšie kľúče alebo kmene v JSON.
- **S7 (nové, PLAUSIBLE) – skrol z panela prechádza na stránku.**
  - `#rc-panel` ani `.rc-log` nemajú `overscroll-behavior: contain` (recepcia.css:2, 13) a stránka sa pri otvorenom
    paneli nezamyká.
  - Na telefóne ťah za koniec logu alebo cez pozadie posunie stránku. Kritérium 8.4 („zatvorenie vráti presne tú istú
    polohu skrolu“) tak nemusí platiť.
  - Návrh: pridať `overscroll-behavior: contain` na `#rc-panel` a `.rc-log` (~25 B v recepcia.css). Overiť v prehliadači.

### DROBNÉ (z kola 2, všetky stále otvorené)

- **D1** Tlačidlo ignoruje `html[data-motion="off"]` (style.css:1235–1242). Ostatné prvky ho majú (napr. :414, :588).
  Panel ho má (recepcia.css:25).
- **D2** Nad 900 px je panel `right: 24px` (recepcia.css:23), ale tlačidlo `right: var(--gutter)` = 40 px (style.css:38, 1236).
- **D3** Pri výpadku je zlyhanie tiché: `.catch(() => {})` v app.js 7d, `nacitaj` → `null` a `spusti` sa vráti
  (recepcia.js:69, 137). Návštevník ťukne a nič sa nestane.
- **D4** Test má časovú bombu: `overene` ≤ 90 dní (recepcia-test.mjs:166, 170). 30 položiek má 2026-10-21, takže test
  **zlyhá od 2027-01-20**. `gz()` vráti 0 pre chýbajúci súbor (:242) a `JAZYKY` aj `subory` filtrujú cez `existsSync` (:30, :247).
- **D5** `norm(o).replace(/ /g, ' ')` (recepcia-test.mjs:184) nahrádza medzeru medzerou.
- **D6** Slovo „AI“ je v teste (recepcia-test.mjs:17, 241, 248). Súbor sa nenasadzuje, zadanie však chce v kóde nulu.
  Návrh: písať „bez označenia umelá inteligencia“ inak, napr. „bez zakázaných slov“, a regex skladať z častí.
- **D7** Po kotve (Celý cenník a pod.) sa fokus vráti na tlačidlo recepcie (recepcia.js:73, 128), nie na cieľ kotvy.
- **D8** Obrys fokusu prvej voľby môže byť orezaný: `.rc-chips` má `overflow-x: auto` a `padding: var(--s2) 0`
  (recepcia.css:10), pričom obrys má `outline-offset: 3px` (style.css:96–98).
- **D9** Husté riadky nemajú komentár k bodovaniu (recepcia.js:9, 23, 28, 53). Diceov vzorec (:16) je správny len vďaka `splice`.
  Práve riadok :23 je príčinou K1, ktorú bez komentára nebolo vidieť.
- **D10** README nespomína `recepcia-test.mjs` (`grep -c -i recepcia README.md ../README.md` → 0, 0).
- **D11** `kolko stoji strich a brada` → `cena-brada` („Úprava brady 15 €“), hoci existuje `cena-strih-brada`.
- **D12** V `prepni` je súbeh (recepcia.js:112–116): starší JSON môže prepísať novší jazyk. Stačí po `await`
  overiť `if (code !== jazyk()) return`.

## ODLOŽENÉ (nie prejdené)

- O 11:15:52 UTC bolo `pgrep -c -f "headless_shell|chrome-linux/chrome"` = **2**, o 11:18:54 UTC = **14**. Bežia
  prehliadače iného tímu.
- `pgrep -f "http.server 86[01]"` nič nenašiel (exit 1).
- Podľa pravidla som prehliadač nespustil a nepoužil ani porty 8710–8714.

Odložené zostáva:
- `i18n-test.mjs`, `app-smoke.mjs`, `vaha.mjs`, `karty-shot.mjs`;
- Lighthouse mobil: CLS 0 a LCP ± 50 ms (krit. 8.1);
- snímky 390 × 844 a 1440 × 900:
  - tlačidlo voči zhluku a `.lang-offer` (`z-index: 58`, `max-width: calc(100vw - 32px)` pri spodnom okraji,
    i18n.css:35–37, pravdepodobne prekryje tlačidlo 46 px vľavo dole);
  - pásy filmu (S3), posun šírky pri `showModal()`, D8;
- S2 (koliesko a kláves s filmom), S5 (pomalá sieť), S7 (ťah na konci logu, poloha skrolu po zatvorení);
- iPhone a VoiceOver („Spýtaj sa recepcie, tlačidlo, otvorí dialóg“, krit. 8.4–8.5). Overiť to vie len majiteľ.

## Poradie pred kolom 4

1. **K1** (recepcia.js:20, 23) a **K2** (trvanie podľa služby). Do testu pridať všetky otázky z K1/K2 a **iné tvary**
   rovnakého problému, nielen tie, ktoré kontrola našla.
2. **S6**: rozhodnúť o rozpočte, či presunúť `zdroj`/`overene` mimo nasadzovaný JSON alebo zmenšiť dáta. Bez toho sa
   K1, S5 a S7 nevojdú do 10 240 B.
3. **S4** (zadarmo), **S5**, **S7**, **S2**, **S3**, potom D1–D4, D6 a D12.
4. Keď sa prehliadač uvoľní, spustiť ODLOŽENÉ behy.
