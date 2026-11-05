# BARBERSHOP 30 – nezávislá kontrola vizuálu a funkcií (4. 11. 2026)

Strom `scratchpad/hs-skvrny`, HEAD **2179170f** (22 commitov nad 791fb3db). Strom som nemenil:
`git status --short | wc -l` → 0, `git rev-parse --short HEAD` → 2179170f. Server `python3 -I -m http.server 9160`
som spustil a na konci zastavil podľa PID (`curl :9160` → 000). Pracovné súbory: `barber/senior/kv/` (predošlý agent:
`s1/ s2/ s3/ testy/`, sondy `sonda1–3.mjs`; moje doplnky: `k2/` – sondy `k1.mjs … k6.mjs`, logy, snímky `k2/k1/`, `k2/k6/`).

## Verdikt

Kino ▶, pás kapitol, „Ďalej“ a odozva tlačidiel web naozaj oživili a na telefóne fungujú prstom, myšou aj klávesnicou.
Konzola je čistá, nič nepreteká (30 kombinácií stránka × šírka), objednávka (113/0) a Barber (ukážka) fungujú.
**Odovzdať to ešte nejde, kvôli dvom vážnym chybám:** (1) na počítači sa pás kapitol myšou nedá ťahať, (2) na telefóne
na šírku leží „Ďalej“ priamo na nadpise karty. K tomu sú tu tri stredné nálezy. Body B5–B7 (titulky, „Pozri bližšie“, zvuk),
ktoré mali byť najhravejšie, nie sú urobené.

## Nálezy

### V1 (vážna) – ťah myšou po páse kapitol na počítači nefunguje
- `k2/k3.mjs` 1440×900, kapitola Čakáreň: `elementFromPoint` = `A Čakáreň`, udalosti
  `["pointermove","pointerdown","pointermove","dragstart","pointercancel"]`. Prehliadač začne ťahať odkaz `<a href>`
  (v `k3` vyšlo `draggable: true`), zruší ukazovateľ a `tah` v app.js sa vynuluje.
- `k2/k2.mjs` (sk-SK): 1440 „stred→koniec“ `2360/4 → 1943/3`, potom 10× stojí na `1943/3`. Ťah doprava teda skočil
  o kapitolu **späť** a ďalej sa nič nedeje. Pri 1024 je to rovnaké (`2043/4 → 1658/3`, potom stojí). Prstom ťah ide:
  `k1 prst` `1604/3 → 556/1 → 991/2 … 9661/7 → 12548/7`.
- Návrh: na `.story-line a` dať `draggable="false"` (alebo `dragstart` → `preventDefault` na `.story-line`)
  a `-webkit-user-drag: none`. Do `kino-test` doplniť ťah myšou.

### V2 (vážna) – „Ďalej“ leží na nadpise karty na telefóne na šírku
- `k2/k1.mjs lezi` po 2,6 s bez skrolu: Ďalej `{x:16, y:108, w:127, h:39}` sa kryje s `P「Remeslo」`, `H2「Povedz, ako to chceš.」`
  pri 844×390, 740×360, 667×375 aj 568×320. Pri 568×320 sa kryje aj s `P「Pri dverách ťa privíta」`.
- Otvorené snímky: `k2/k1/lezi-667x375-remeslo.png` (cez kicker REMESLO je napísané „ĎALEJ Čakáreň ↓“ a čiara
  zasahuje do nadpisu), `kv/s3/568x320-y432.png` („Ďalej Remeslo ↓“ cez „PRVÝ KROK / Poď ďalej.“), `kv/s3/568x320-y576.png`.
  Pri karte zarovnanej doprava (Čakáreň 844×390, `lezi-844x390-cakaren.png`) sa nič nekryje.
- Príčina: `style.css` `@media (max-width: 900px) { .kino-next { left: 16px; top: calc(var(--nav-h) + 44px) } }` platí
  aj na nízkom ležiacom telefóne, kde je karta hneď pod pásom.
- Návrh: pri `(max-height: 600px)` Ďalej skryť, alebo ho dať dole vľavo nad spodné tlačidlá. Do `prienik.cjs` pridať
  okná 844×390 a 568×320.

### S1 (stredná) – ▶ hlási čítačke Zastaviť/Prehrať po slovensky vo všetkých jazykoch
- `kino.js:81` `play.setAttribute('aria-label', 'Zastaviť prehliadku')`, `kino.js:91` `'Prehrať prehliadku'`.
  Preklady pritom existujú (`en.json` „Stop the tour“, `de` „Rundgang anhalten“ …).
- `k2/k1.mjs jazyk` (jazyk prepnutý cez ponuku, 1440 aj 390, en/de/uk): pred Kinom `aria` je preložené
  („Play the tour“, „Rundgang abspielen“, „Відтворити екскурсію“), po spustení **„Zastaviť prehliadku“**
  a po zastavení **„Prehrať prehliadku“** vo všetkých šiestich behoch. Aj na stránke en/ (`kv/s1-mobile-enpage.log`
  `kino-start … "aria":"Zastaviť prehliadku"`).
- Viditeľné texty sú v poriadku: štítok `04 · Wartebereich`, Ďalej `Weiter Team ↓`, `Далі Команда ↓`.
- Návrh: aria-label brať zo slovníka i18n (rovnako ako ostatné atribúty), alebo použiť `aria-pressed`
  a nemenný preložený label.

### S2 (stredná) – pás kapitol bez podkladu prečiarkuje text pod sebou
- Pás je fixný a tvoria ho len čiary s tieňom („žiadna doska“). Pri skrolovaní ležia oranžové a sivé čiary na odsekoch.
  Otvorené snímky: `kv/s3/1280x800-y3960.png` (2 px čiary cez bio „Elegancia bez námahy…“, „Najprv ťa vypočuje…“),
  `kv/s3/1440x900-y3645.png` (cez „Barberi s 10 až 15 rokmi praxe…“) a `kv/s3/390x844-y4180.png` (telefón: čiary cez
  „Na Mostnej 30 od roku 2019“ hneď pod lištou). Vyzerá to ako podčiarknutý alebo prečiarknutý text.
- `kv/s3-*.log`: prekryv pásu s viditeľným textom pri **všetkých** 12 šírkach 320–1920 (19–77 polôh na šírku).
  To vyvracia tvrdenie v `zlepsenia.md` „prienik.cjs: pás … 0 px²“, ktoré platí len pre polohy zastavenia.
- Návrh: nad pásmi s textom (`kino-tenky`) pás skryť úplne, alebo mu dať jemný prechod pozadia (gradient od
  `--bg` k priehľadnej) len v tenkom režime.

### S3 (stredná) – test app-smoke je pri záťaži nestabilný
- Môj beh na HEAD: `k2/app-smoke.log` → 108 OK / 1 FAIL (`[softvér desktop] CLS 0.0283`, známy WEB-05, rovnaký ako na
  791fb3db podľa `zlepsenia.md`). Predošlý beh pri súbežnom audite (775 s): `kv/testy/app-smoke.log` → 100/9, napr.
  `kotva kreslo-stred: data-scene-active=5 (čakané 6)` a `za pásom .band-team … {"on":false}`. Kód sa medzitým nezmenil.
- Od commitu 53a42e5e sa aktívna kapitola berie z ukázanej karty (lerp), takže kontrola závisí od rýchlosti stroja.
  To isté vidieť aj ako chvíľkový zlý štítok po skoku: `kv/s2-desktop.log` po skoku zo spodku na Remeslo ukáže
  `05 · Tím` (100 ms) → `04 · Čakáreň` (400 ms) → `03 · Remeslo` (1 s).
- Návrh: v teste čakať, kým sa `data-scene-active` ustáli (alebo `snapNow`). Na stránke po skoku nastaviť stav okamžite
  (`snapUntil`), nech pás nepreblikne tromi kapitolami.

### D1 (drobná) – „Ďalej“ je v poradí Tab až za pätičkou
- `k2/k1 klav`: `{"poradie":90,"spolu":91,"posledne":["A","link-arrow footer-top","kino-next"]}`. Odkaz sa vkladá na koniec
  `body` (`kino.js:44`), takže na klávesnici je viditeľné tlačidlo prakticky nedosiahnuteľné.
- Návrh: vložiť ho hneď za `.story-line`.

### D2 (drobná) – samotné ▶ v úvode na počítači nemá viditeľný popis
- `k2/k6/2560x1440-index.png` (otvorená): krúžok ▶ stojí sám vľavo od „PREJDI SI PODNIK“. Kapitoly a štítok sa v úvode
  skryjú (`.story-line:not(.is-visible) a, .kino-label { opacity: 0 }`) a popis má len `aria-label`. Zákazník nevie,
  že spúšťa prehliadku a zároveň hudbu (`k2/k1/kino-prst-stop-390.png`: po ťuku na ▶ svieti ikona hudby).
- Návrh: v úvode ukázať pri ▶ text „Prehrať prehliadku“ (už je preložený v 8 jazykoch).

## Čo funguje (overené)

| oblasť | dôkaz |
|---|---|
| Kino ▶ myšou | `kv/s2-desktop.log`: 8 cieľov `[0,1125,1755,2385,3015,6297,10124,13904]`, jazda 0,5 → 35,1 s, koniec na Rezervácii; koliesko zastaví (`k2/k1 klav` `hra4 false`) |
| Kino ▶ prstom | `k2/k1 prst`: po 6 s `{hra:true, sc:"2"}`, ťuk do stránky → `{hra:false, stoji:true, next:"Ďalej Čakáreň ↓"}`; snímka `kino-prst-stop-390.png` otvorená |
| Kino klávesnicou | `k2/k1 klav`: fokus na ▶ `focus-visible, outline solid`; Enter → `hra:true`, medzerník → `hra:false` |
| pás šípkami | Tab → „Úvod“, → → → `Poď ďalej 1125/2`, `Remeslo 1755/3`, `Čakáreň 2385/4` |
| pás ťukom a ťahom prstom | ťuk na kapitolu 6 → `{y:4843, sc:"6", hash:"#sluzby"}`; ťah prstom prejde 1 → 7 |
| 8 jazykov (vzorka en/de/uk) | štítok, Ďalej aj názvy kapitol preložené (`k2/k1/vysledok-jazyk.json`); i18n-test 55/0 (`kv/testy`) |
| konzola, 4xx, pretečenie | `k2/k6.log`: index, en/, rezervacia.html, 404.html, karta/, ukážka × 320×568, 390×844, 844×390, 1440×900, 2560×1440 → `errs []`, `bad []`, `ov 0` vo všetkých 30 |
| Barber (ukážka) | `k2/k6.log`: otvorí sa, čip „Koľko stojí strih?“ → „Pánsky strih stojí 18 € (približne 40 minút), pre vlasy nad 10 cm 22 € a s úpravou brady 28 €…“ (fakty sedia s webom), Esc zavrie (`open:false`) a fokus sa vráti na `asi-btn`; snímka 844×390 otvorená, okno na šírku sa zmestí |
| objednávka | `k2/objednavka-test-kopia.log` (kópia zhodná s HEAD, `cmp` 10/10 súborov, zástupná knižnica) → 113 OK / 0 FAIL; bez knižnice v strome 15/0 (`k2/objednavka-test.log`). Predošlý TimeoutError bol záťaž |
| rezervacia.html | `k2/k6/320x568-rezervacia_html.png` otvorená, bez prekryvu |
| ostatné testy (stav stromu rovnaký) | `kv/testy/vysledky.txt`: en-test 16/0, en-stranka aktuálna, otazky --kontrola OK (9), vychytavky 27/0, admin 101/0, vaha OK; asistent-test 32/10 – známe, chýba knižnica Anthropic |

## Je web hravejší a filmovejší?

Áno, ale len čiastočne. Zákazník teraz môže pustiť prehliadku ▶, preskakovať a (prstom) pretáčať kapitoly ako vo
videoprehrávači, po zastavení ho Ďalej pozve do ďalšej kapitoly a tlačidlá reagujú na stlačenie. Na telefóne na výšku
to pôsobí čisto (snímka `kino-prst-stop-390.png`). Na počítači, kde je pretáčanie myšou najprirodzenejšie, nefunguje (V1).
Interakcie so scénou, ktoré si majiteľ predstavoval („niečo robiť s tým webom“), sú v pláne VYBER ako B5 titulky
„krok za krokom“, B6 bod „Pozri bližšie“ a B7 zvuk. Podľa `zlepsenia.md` sú „nezačaté“, takže zadanie majiteľa z 2. 11.
zatiaľ nie je splnené celé.

## Poradie opráv
1. V1 `draggable=false` na pás (1 riadok) a test ťahu myšou.
2. V2 Ďalej na nízkom ležiacom telefóne skryť alebo presunúť.
3. S1 preložené aria-label pre ▶.
4. S2 tenký pás nad textom skryť.
5. D1, D2 a stabilizácia app-smoke (S3).
6. Potom B5 → B6 → B7.
