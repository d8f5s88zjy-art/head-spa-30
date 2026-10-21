# Skeptik: odporúčanie poroty B („celá fotka na šírku + rozmazané okolie z plátna“)

21. 10. 2026. Strom `hs-lahky` som len čítal (`git -C hs-lahky show/archive HEAD`, HEAD = **0195615**, `git status` čistý).
Vlastné meranie: `skeptik/meraj.mjs`, výsledky v `skeptik/meranie.json`, snímky v `skeptik/*.png|jpg`.
Server: `python3 -m http.server 8687` nad dočasnou kópiou `git archive HEAD` + súbory prototypu B. Po meraní je ukončený
(`curl 127.0.0.1:8687` → kód 7, 0 procesov `http.server 8687` a `chromium-1194`). Kópiu (47 MB) som zmazal.
Nástroje: Chromium 1194, 430×932, DPR 3, `isMobile`, `hasTouch`, `?foto=B&uvod=off` a `?foto=A&uvod=off`.

## Verdikt

**Vyvrátené v podobe, v akej je zadané na stavbu.** Smer „ukázať celú scénu“ je správny a čísla poroty o bajtoch, px/CSS
a ploche scény sedia. Postup pre staviteľa však:

1. na dnešnom HEAD vyrobí na karte Tím **dva obrazy naraz** (nález S1);
2. mení základnú kompozíciu stránky, ktorú brief aj majiteľ (rozhodnutie 2026-10-09) určili ako „záber cez celé okno“
   (S2), a súhlas majiteľa chce až po stavbe (K7);
3. argument „najostrejšia“ nie je to, čo majiteľ okom uvidí (S3).

Pred stavbou treba ukázať majiteľovi A / B (a variant 1 : 1, S6) na jeho iPhone a doplniť body nižšie.

## Overené tvrdenia poroty (sedia)

| tvrdenie | overenie | výsledok |
|---|---|---|
| fotky B ≈ 991 129 B na celú stránku, A 2 753 498 B | `stat -c %s` 9× `<meno>-1448.avif` a 9× `<meno>-m-1448.avif` | 989 414 B a 2 751 779 B (zvyšok sú hlavičky HTTP), teda **sedí**, −64 % |
| 430×932 berie `-1448`, 3,37 px/CSS | `meranie.json`: všetkých 9 kariet `currentSrc = <meno>-1448.avif`, rámik 430 px | 1448 / 430 = **3,37**, sedí |
| fotka B = 30,8 % okna | `meranie.json` `photoShareOfWindow` | 0,308 (rohožka 16 : 10: 0,288), sedí |
| A pokrýva celé okno výrezom -m | `?foto=A`: rámik 443–456 × 960–988 px, podiel okna 1,0 | sedí |
| majiteľovi na snímke chýba scéna | `skeptik/majitel-430.jpg` (zmenšená `majitel-iphone-film.png`): pumpa a polovica buldoga | sedí, **ale** je to snímka **filmu** (presah 1,24), nie dnešného `lite` |

## Nálezy

### S1. Na HEAD 0195615 B na karte Tím prekrýva fotku pásu cez živé video (dvojexpozícia)

- Porota merala prototyp na **3346f80**. Po nej prišiel commit **0195615** „na telefóne sa vracia slučka tímu“:
  - `app.js` časť 11 a `slucky()`;
  - `style.css` ~1150: `.film-still .film-loop { position:absolute; inset:0; object-fit:cover }`.
- Meranie B na HEAD (`meranie.json`, `sala-rano`):
  - fotka: `img` 430×287 na y = 157, `z-index: 1`;
  - video: `<video class="film-loop is-ready">` 864×1536 cez celé okno `[0,0,430,932]`, `opacity 1`, `paused:false`.
- Snímka `skeptik/tim-a-b-cakaren.jpg`, prostredný panel: pás fotky sály leží uprostred bežiaceho videa tímu. Vidno dva
  rôzne obrazy naraz. To porušuje TOUR_DIRECTION:26 („nikdy dvojexpozícia celého obrazu“). Majiteľ by to právom nazval
  „nie je to pekné“.
- Postup poroty (kroky 3 až 5) ani kritériá K1, K2 a K6 túto kartu nepokrývajú. K2 meria len `img`.

### S2. B mení kompozíciu, ktorú brief a majiteľ výslovne určili. Tvrdenie „rovnaký vzhľad“ preto neplatí

- Platné zadanie stránky (všetko zo stromu `hs-lahky`, HEAD):
  - MASTER_BRIEF:88: „každá scéna = záber **cez celé okno** s titulnou kartou“;
  - TOUR_DIRECTION:57: „záber cez celú obrazovku → pás s textom → záber“;
  - TOUR_DIRECTION:111: „rozhodnutie majiteľa 2026-10-09: na telefóne rovnako prepracované ako na počítači“, doska
    textu „pláva nad filmom“.
- B (`skeptik/B430-cakaren.png`, `porota/B430-styri.jpg`):
  - fotka zaberá 30,8 % okna, zvyšných 69 % je rozmazaná stmavená plocha;
  - text je pod fotkou, nie na nej;
  - úvod (rohožka) má po kroku 4 pás fotky hore a nadpis s tlačidlami pod ním.
  To je iný typ stránky (pás s rozmazaným okrajom, ako zdieľaná fotka na šírku v príbehu), nie „rovnaký vzhľad ako na
  počítači“, kde fotka vypĺňa okno a text leží na nej.
- Porota tvrdí „mení sa len to, že fotka stojí v páse“. V skutočnosti je to práve tá vec, ktorú majiteľ na počítači vidí
  ako hlavnú.
- Pri úvode B navyše ticho vymení fotku:
  - TOUR_DIRECTION:62: na telefóne je rohožka z `foto-40` majiteľa (pult, rohožka, kreslá, sud);
  - B dá `rohozka-1448` zo `slider/3.jpg` (FAKTY.md časť 0 bod 4).
  Je to zmena obsahu, o ktorej majiteľ nevie.
- Plán poroty chce pohľad majiteľa až v K7, teda **po** stavbe. Pri zmene tohto rozsahu má byť pohľad **pred** stavbou
  (to isté vytýkal V8 v `../SKEPTIK.md`). Prototyp už existuje, takže to stojí len odkaz.

### S3. „B je najostrejšia“: px na CSS px nie je ostrosť, ktorú majiteľ vidí

Výpočet: `python3`, iPhone 430×932 = 460 ppi, čítanie na 30 cm; notebook 15" 1440 CSS px pri DPR 2, 224 ppi, 55 cm.

- Fotka B má na iPhone **71 × 48 mm**, uhlová šírka **13,5°**. Oko rozlíši asi 1′, teda asi **810 bodov** naprieč
  scénou.
- Súbor `-1448` dáva 1448 px. Rozdiel medzi 3,37 (B) a 2,76 (A) px/CSS je teda pri bežnej vzdialenosti **pod hranicou
  oka**: obe sú nad ňou.
- Počítač: 327 mm, 33,1°, asi 1 980 bodov. B ukáže scénu v **0,41-násobku** uhlovej šírky PC, teda asi 1/6 plochy.
  „Tak dobre ako na PC“ platí pre **úplnosť** (100 % oproti 93,7 % `?film=off` a 56 % s filmom), nie pre veľkosť
  a čitateľnosť detailu.
- Predmet (buldog, Route 66) je v A **3,25×** väčší lineárne ako v B (4096 / (1536 · 430/524)). B je „najostrejšia“
  preto, že je najmenšia.
- Porota to sama uvádza vo výhradách („celá, ostrá, ale menšia“). Vo verdikte to však obrátila na hlavný argument.

### S4. Brána `<source media>` nesedí s bránou `lite`

- `lite` = `(hover: none) and (pointer: coarse)` a `min(screen) ≤ 720` a nie `?film=on` (index.html:16).
- Nové `media="(max-width: 720px) and (hover: hover)"` vypne výrez `-m` aj zariadeniam bez myši, ktoré **nie sú** `lite`:
  - telefón s `?film=on` (prepínač na porovnanie s filmom);
  - iPad v Split View alebo Slide Over (okno ≤ 720 px, `min(screen)` > 720).
- Ich záloha `<img>` je naďalej cover cez celé okno (B CSS platí len pre `html.lite`). Na 430×932 to znamená fotku na
  šírku `-1448` roztiahnutú na 1398 CSS px, teda **1,04 px/CSS** (0,35 na fyzický px), viditeľne mäkkú.
- Film pritom ťahá vlastné `-m` (film.js:251 `s.photo = phone && el.dataset.m`), takže sa sťahuje dvakrát.
- Odvodené z kódu, nemerané. Treba to buď pridať do K1, alebo `-m` vypínať triedou `lite` (napr. `fetchpriority`/`srcset`
  v hlavičkovom skripte), nie samotným `hover`.

### S5. Oprava stredových kariet na 375×667 naráža na spodné prvky

- Porota počíta 60 + 8 + 250 + 24 + 272 = 614 ≤ 667.
- Na úvode však výzva „PREJDI SI PODNIK“ stojí približne na y 594–640 (`skeptik/b375.jpg`, ľavý panel). Spodok
  tlačidiel úvodu by bol na 614, teda by sa **prekrývali** asi o 20 px.
- Pri vstupe (text 260 px → spodok 602) je to tesne pri spodnej lište (~605 na 375×667, pravý panel).
- K2 meria len medzeru text − fotka, nie text − spodné prvky.

### S6. Ľahkosť: B obstojí, s dvoma otáznikmi pre iPhone

- Dekódovanie 1,40 MP na kartu (5,6 MB RGBA), plátno 36×78 (0,003 MP), 0 B navyše: **sedí**. Je to 2,7× menej ako A.
  Na iPhone to pamäť nezaťaží.
- `ctx.filter` vo WebKite: staršie iOS ho nemajú (porota to sama píše).
  - Bez neho ostane len bilineárne zväčšenie 36 → 1290 fyzických px. Pri jasných lampách to môže dať viditeľné
    „kosoštvorce“.
  - Treba snímku z iPhonu, nie z Chromia.
- Plátno sa kreslí z `innerWidth`/`innerHeight`. V Safari sa `innerHeight` mení so zbalením lišty (svh → lvh), čo dá
  mierne natiahnutie. Prekresľovať len pri zmene `innerWidth` (krok 5) je správne.

### S7. Telefón na šírku je mäkší ako dnes

- Nové `sizes` dajú pri 932×430 `66vw` → `-2172`: 2172 / 932 = **2,33 px/CSS = 0,78 na fyzický px**.
- Dnes (`124vw`) berie 2896 (3,11 px/CSS, pri vstupe 4096).
- Je to ľahšie, ale práve otočenie telefónu je najprirodzenejší spôsob, ako majiteľ uvidí scénu „ako na PC“: cover
  932×430 ukáže 69 % scény cez celý displej.

## Čo doplniť pred stavbou

Zoznam aj v štruktúrovanej odpovedi.

1. **Karta Tím (L6, 0195615):** v B rozhodnúť a zmerať jedno z dvoch:
   - slučku tiež ako pás (video 9 : 16 sa do pásu 3 : 2 nehodí);
   - alebo pri `is-ready` videa skryť pás aj plátno.
   Pridať do K2: „na žiadnej karte nie sú naraz viditeľné dve rôzne zábery“, so snímkou `sala-rano` po 3,5 s.
2. **Pohľad majiteľa pred stavbou, nie po nej:**
   - poslať `prehlad-430x932.jpg` + `skeptik/tim-a-b-cakaren.jpg` a odkaz `?foto=A|B` na jeho iPhone;
   - výslovne sa spýtať, či chce stránku „pás fotky + rozmazaný okraj, text pod fotkou“ namiesto „fotka cez celé okno,
     text na nej“ (MASTER_BRIEF:88, TOUR_DIRECTION:57, 111);
   - spýtať sa aj na výmenu úvodnej fotky `foto-40` → `slider/3` (TOUR_DIRECTION:62).
3. **Ukázať aj variant „B 1 : 1“** (štvorec cez šírku, cover okolo `--fx`):
   - 66,7 % scény (viac než PC s filmom, 56 %), fotka 46 % okna namiesto 31 %, predmety 1,5× väčšie než v B;
   - z `-1448` 2,24 px/CSS (≥ 2), z `-2172` 3,37;
   - bez nových súborov.
   Porota sama spomína 4 : 3 ako ďalší krok. Majiteľ by mal vidieť obe veľkosti naraz.
4. **Kritériá K1/K2 opraviť:**
   - K1 merať `naturalWidth` skutočného súboru (`new Image(currentSrc)`). `img.naturalWidth` pri `srcset` vracia
     hodnotu prepočítanú hustotou: `meranie.json` ukazuje 430, nie 1448.
   - K2 doplniť o medzeru spodok textu − vrch spodnej lišty / výzvy „Prejdi si podnik“ ≥ 8 px pri 375×667, 390×844
     a 430×932.
5. **Bránu `-m` zladiť s `lite` (S4):**
   - pridať do K1 telefón s `?film=on` a okno 500×900 s `hover: none` a `screen` 1024 (iPad Split View);
   - záloha nesmie mať pod 2 px/CSS a nesmie sťahovať obe varianty.
6. **Do K1 dať aj „fyzickú“ mieru:** mm a uhlovú šírku fotky na 430×932 (71 mm, 13,5°). Rozhodnutie má stáť na
   veľkosti scény, nie na px/CSS.
7. **Telefón na šírku:** zvážiť `sizes` 100vw pre `(hover: none) and (max-height: 720px)` (→ `-2896`, 3,11 px/CSS),
   alebo vedome prijať 2,33 a zapísať to.
8. **iPhone (M1):**
   - snímka plátna bez `ctx.filter` (staršie iOS);
   - výber `-1448` v Safari;
   - pamäť pri prechode kariet so slučkou Tím (Web Inspector → Timelines → Memory).
9. **Ostatné:** fasádu `still-vstup` a `<noscript>` zahrnúť do `diff` zdrojov. Plán píše 11 `<picture>` a 22 `<source>`,
   staviteľ to má overiť `grep -c` pred aj po zmene.
