# Skeptik – overenie stavby „texty tímu, recepcia v otázkach, odkazy na prevádzky“ (27. 10. 2026)

Overované: strom `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny`
(vetva `barbershop-skvrny`, HEAD `c88d29a1`, dva commity nad `bdabff7`). Nič som v strome nemenil (`git status --short` → 0 riadkov
pred aj po overení). Cesty sú relatívne k `hs-skvrny/barbershop-30/`; `scratchpad/` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/`.
Moje skripty a snímky: `scratchpad/barber/texty/skeptik/` (`skeptik.mjs`, `skeptik2.mjs`, `vypis.txt`, `okno-*.jpg`, `po-*.jpg`, `pred-*.jpg`).

## Verdikt

Tvrdenie **platí** vo všetkých častiach, ktoré sa dajú overiť strojom a okom. Na web nešiel žiadny nepotvrdený fakt, garancia
na webe nie je (správne), 8 jazykov je úplných, `en/` sedí so zdrojom, i18n-test prechádza, vzhľad nezmenených častí je rovnaký,
commity sú po slovensky bez podpisov. Zostávajú tri veci na pozornosť (časť 3), ani jedna nebráni odovzdaniu majiteľovi.

## 1. Čo som overil sám (10 tvrdení)

| # | tvrdenie | ako | výsledok |
|---|---|---|---|
| 1 | rozsah zmeny, film.js nezmenený | `git diff --stat bdabff7..HEAD` (18 súborov, +174/−53); `git diff bdabff7..HEAD -- barbershop-30/assets/film.js \| wc -c` | **0 B** – film.js nedotknutý |
| 2 | commity po slovensky, bez podpisov, len lokálne | `git log bdabff7..HEAD --format=%B` → „Barbershop 30: údernejšie texty tímu, recepcia v častých otázkach a odkazy na prevádzky“, „Barbershop 30: preklady nových textov do siedmich jazykov a anglická stránka“; `grep -ciE 'co-authored\|claude-session\|signed-off'` → **0**; `git status` čistý v `hs-skvrny` aj `dennik` (0 riadkov) | platí |
| 3 | každý fakt v nových textoch má oporu v `bdabff7` | `git show bdabff7:barbershop-30/index.html \| grep -n`: „od roku 2019“ → r. 742; „5,0 na Google“ → r. 193; „privíta recepčná“ → r. 224; „minerálka … zdarma“ → r. 270; „kolínska“ → r. 502/510; „barberiek“ → r. 293; „0951 267 203“ → r. 804; „od 9:00 do 19:00“ → r. 787/830/836; „britva“ → r. 247 | všetky nájdené |
| 4 | zakázané slová a nepotvrdené veci nie sú na webe | `grep -niE 'garanc\|umelá inteligen\|konkuren\|zdrav' index.html` → len HTML komentár na r. 314 („garancia čaká na potvrdenie“), žiadny viditeľný text; `grep -c 'bez objednania'` → 0; `grep -c 'Všetky tri'` → 0; slovníky (7×, nové kľúče): 0 podozrivých | platí |
| 5 | FAQ o recepcii a „Čo ma čaká“ | prehliadač 390 aj 1440: 10 otázok, 2. „Mám volať barberovi alebo recepcii?“, 9. „Čo ma čaká, keď prídem?“; otvorené odpovede na snímkach `okno-390-otazky.jpg`, `okno-1440-otazky.jpg` (otvorené nástrojom Read) | platí, znenie = odovzdávka |
| 6 | pätička: odkazy a adresy | DOM: `HEAD SPA 30 -> https://www.headspa30.sk/ [_blank, noopener]`, `Salón 30 -> https://www.salon30.sk/ [_blank, noopener]`, `Barbershop 30 -> #uvod [aria-current=page]`; `curl -L -w %{http_code}`: www.headspa30.sk **200**, www.salon30.sk **200**, headspa30.sk → www **200**, salon30.sk → www **200**; na salon30.sk doslovne „Trichologické vyšetrenie vlasov“, „koloristika“, titulok „Salón 30“; headspa30.sk titulok „HEAD SPA 30 Nitra \| Head Spa rituály, ceny a rezervácia“, canonical `https://headspa30.sk/`; canonical koreňového `index.html:30` = github.io (preto otázka 4) | platí |
| 7 | 8 jazykov | `python3 -I` porovnanie `git show bdabff7:…/i18n/*.json` s HEAD: každý zo 7 jazykov 309 → 325 kľúčov, 27 pridaných, 11 odobraných, **0 zmenených hodnôt, 0 prázdnych**, rovnaká sada kľúčov vo všetkých; prepnutie v prehliadači na de/uk/pl/sr: `html lang` de-AT/uk-UA/pl-PL/sr-Latn, piliere, 2. otázka, „Unsere Standorte / Наші заклади / Nasze lokale / Naši lokali“ a riadky barberov v cieľovom jazyku, `scrollWidth` 390; preklady idiómov zmysluplné (napr. de „Eine 5,0 bei Google schneidet man sich nicht in einer Woche zusammen“, hu „Semmit sem vaktában“); `en/`: lang en, 10 otázok, „Should I call the barber or the reception?“, „Our places“, `#uvod` existuje | platí |
| 8 | testy | `node source/tools/i18n-test.mjs` → „Všetky kontroly prešli“; `node source/tools/en-stranka.mjs --check` → „en/index.html je aktuálna“; `node source/tools/otazky.mjs` → „všetko OK: 251 otázok, 11 tém“; kópia `assets/asistent-otazky.json` zhodná so zdrojom; riadky barberov v `rezervacia.html` zhodné s `index.html` (diff prázdny) | platí |
| 9 | vzhľad ostatných častí nezmenený | PRED (export bdabff7, port 8821) vs PO (port 8820), 390×844 a 1440×900: rozmery `#uvod`, `.site-header`, `#cennik`, `.price-table`, `#galeria`, `#recenzie`, `.footer-grid`, `.footer-bottom` **rovnaké**; vypočítané štýly `.price-table`, `.site-footer`, `.footer-grid`, `.footer-title`, `.team-card`, `.team-bio`, `.faq-item`, `.hero-rating`, `.btn` **rovnaké**. Líšia sa len: `.band-head` (dlhší úvod tímu), `.faq-list` (+2 otázky), `.team-grid` (dlhšie riadky, 1440: 1070 → 1094 px), pätička `#kontakt` (= `<footer id="kontakt">`, blok prevádzok) a výška dokumentu | platí (zmeny len v zadaných častiach) |
| 10 | bez pretečenia a chýb | `scrollWidth`/`innerWidth` 390/390, 1440/1440 PRED aj PO; `pageerror` 0 vo všetkých behoch; ciele na telefóne: otázky 54 px, odkazy prevádzok 47 px (≥ 44) | platí |

Snímky, ktoré som otvoril nástrojom Read: `okno-390-piliere.jpg`, `okno-390-barberi.jpg`, `okno-390-otazky.jpg`, `okno-390-paticka.jpg`,
`okno-1440-piliere.jpg`, `okno-1440-otazky.jpg`, `okno-1440-paticka.jpg`, `po-390-paticka-uk.jpg`, `po-390-tim.jpg`. Vidno: tri piliere
s oranžovou linkou pod úvodom tímu (telefón pod sebou, počítač v troch stĺpcoch), otvorené nové odpovede, blok „Naše prevádzky“ medzi
stĺpcami pätičky a spodným riadkom, aktuálny „Barbershop 30“ oranžový; v ukrajinčine všetko preložené. Pozn.: na snímkach celého prvku
(`po-390-tim.jpg`, `po-390-paticka-uk.jpg`) sa objavuje tlačidlo „Preskočiť na obsah“ a zdvojená lišta – je to artefakt zlepovania
dlhého prvku v Playwright (fixné prvky), na snímkach okna (`okno-*.jpg`) nie je; nie je to chyba stránky.

## 2. Čo som neoveril

- `en-test`, `app-smoke`, `vychytavky-test`, `admin-test` som znova nepúšťal (limit prehliadača); kontrola kódu (kolo 1) ich
  bežala PRED aj PO s rovnakým výsledkom vrátane známeho kolísavého pádu `app-smoke` (CLS 0.0283, záložný úvod). `tma-test`
  v tomto prostredí nejde (Pillow bez `_imaging`) – PRED aj PO.
- Snímky cenníka PRED/PO som porovnal len geometriou a štýlmi (bod 9), nie pixel po pixeli.

## 3. Nálezy (žiadny neblokuje)

- **N1 – riadok Dominiky znie ako sľub.** „Vstaneš, až keď sedí každý vlas. Bez výnimky.“ (`index.html:407`) je opis jej
  dôslednosti (starý riadok mal „U nej je hotovo, až keď sedí každý vlas“), ale dovetok „Bez výnimky.“ sa blíži k nepotvrdenej
  garancii G3 („Z kresla vstaneš, až keď si spokojný“). Odporúčam dať majiteľovi na vedomie; ak nechce verejné sľuby, škrtnúť
  „Bez výnimky.“ (7 slovníkov + en/).
- **N2 – starý rozpor ostáva na stránke.** `index.html:224` stále hovorí „Ako jediný barbershop v Nitre ju máme už 8 rokov.“
  (nepotvrdené, OTAZKY otázka 9, CONTENT_SOURCES „nesúlad s rokom 2019“), kým nový pilier hovorí „od roku 2019“. Nie je to
  chyba tejto zmeny, ale nové texty rozpor zviditeľnia. Patrí do otázok pre majiteľa.
- **N3 – gzip `index.html` 15 758 B** (PRED 14 833 B; `gzip -9 -c index.html | wc -c`) je nad hranicou 14 600 B z pravidla
  „Čo nerobíme“. Hranica bola prekročená už pred zmenou; táto dávka pridáva +925 B. Odovzdávka to priznáva; riešiť samostatne.
- Pravidlo „Nespomínať Salón 30 ani HEAD SPA 30 ako súčasť značky“ je zmenené požiadavkou majiteľa z 27. 10.; nadpis
  „Naše prevádzky“ je otázka 26 (resp. 7 v zozname nižšie) – správne označené v OTAZKY.

## 4. Otázky pre majiteľa (zhrnuté)

1. Garancia: G1, G2 alebo G3, bez príplatku, dokedy platí. Dovtedy web garanciu neukazuje, tretí pilier je „Pohodlie“.
2. „Aj keď prídeš bez objednania“ – platí? (otázka 5)
3. Fakty o barberoch (roky, škola, čo robí najradšej) – bez nich ostávajú riadky bez čísel.
4. HEAD SPA 30: https://www.headspa30.sk/ alebo github.io?
5. Salón 30: https://www.salon30.sk/ a popis „Kaderníctvo a wellness pre vlasy: strihy, farbenie a koloristika, trichologické vyšetrenie.“ – súhlasí?
6. Barbershop 30 v bloku vedie na začiatok stránky; po spustení na www.barbershop30.sk pôjde na doménu – súhlasí?
7. Podnadpis „Všetky tri na Mostnej 30 v Nitre“ a nadpis „Naše prevádzky“ (ruší staré pravidlo) – potvrdiť.
8. K „volaj recepcii“ pridať e‑mail info@barbershop30.sk alebo WhatsApp?
9. Riadok Dominiky „Bez výnimky.“ – nechať, alebo škrtnúť? (N1)
10. „Recepcia 8 rokov, jediný v Nitre“ na r. 224 vs. „od roku 2019“ – čo platí? (N2, otázka 9)
