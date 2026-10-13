# VISIONARY LIVING – návrh nového webu (Černík)

Statický web developerského projektu Visionary Living (dvojizbové a trojizbové byty v obci Černík), postavený ako
náhrada pôvodného webu visionaryliving.sk. Reč webu je projektová dokumentácia: každá stránka je list výkresu
s názvom v rohu, fakty sú kóty a rohová pečiatka, byt sa vyberá na nakreslenej fasáde. Všetky texty a čísla sú
z pôvodného webu (`docs/ZDROJE.md`); nič sa nedomýšľa.

Náhľad: https://d8f5s88zjy-art.github.io/head-spa-30/visionary-living/ (zatiaľ `noindex`, kým web nie je na doméne).

## Stránky

| Súbor | List | Obsah |
| --- | --- | --- |
| `index.html` | 1 – Titulný list | nadpis, vizualizácia s kótou vzdialeností, pečiatka s údajmi projektu, výber bytu na fasáde, lokalita, piliere, skrátená cesta kúpy, kontakt |
| `o-projekte.html` | 2 – Technická správa | popis projektu, charakteristika bytov a domu, výhody, harmonogram, lokalita s kótou a fotkami, Prečo Černík |
| `byty.html` | 3 – Pohľad | filter typov, fasáda s 12 bytmi, panel zvoleného bytu, tabuľka 12 bytov (funguje bez skriptu) |
| `byt/a1.html` … `byt/l3.html` | 4 – Pôdorys | pôdorys podlažia (lupa), výrez bytu, miestnosti a plochy, štandard, interiér, čo nasleduje, susedné byty |
| `financovanie.html` | 5 – Splátkový plán | štyri kroky na zvislej čiare, ktorá sa odvíja so skrolom, krokomer |
| `galeria.html` | 6 – Vizualizácie | exteriér a interiér, mozaika s lupou (natívny `<dialog>`) |
| `kontakt.html` | 7 – Kontakt | telefón, e-mail, formulár (`?byt=A1` predvyplní správu), fotografia |
| `ochrana-sukromia.html`, `cookies.html` | Príloha | právne texty |

## Ako web vzniká

- `source/obsah.json` – všetok obsah (značka, kontakt, projekt, lokalita, typy bytov, 12 bytov, financovanie, galéria).
- `source/zostav.py` – generátor: `python3 source/zostav.py` zapíše 20 stránok, `sitemap.xml` a `robots.txt`.
  Výberovník, panel aj tabuľka bytov sú zapísané priamo v HTML (skript ich len oživuje), preto web funguje aj bez JS.
- `source/obrazky.py` – obrázky: z originálov klienta vyrobí stupne šírok v AVIF a WebP (`ZDROJ=/originály python3
  source/obrazky.py`; `--logo` len ikony). Nikdy nezväčšuje. Pôdorysy sú výrezy (výkres, legenda, byt).
- `source/pisma.py` – písma: Bricolage Grotesque (dva statické rezy: 700 pre nadpisy, 500 pre kóty) a Instrument
  Sans (400 až 600, bez kurzívy), podsadené na latin + latin-ext, preload dvoch rezov prvej obrazovky.
- `assets/style.css` – tokeny (Papier, Tuš, Grafit, Okr, Les, Mach, Betón), rám listu, fasáda, panel, cesta, galéria,
  formulár; pohyb len `transform` a `opacity`, krivka `cubic-bezier(.2,0,0,1)`, trvania 140/320/560 ms.
- `assets/site.js` – menu, kreslenie výkresov pri príchode do okna (`data-kresli` → `je-nakreslene`), výber bytu
  (tlačidlá s `aria-pressed`, filter ako `radiogroup`, šípky, stavový riadok pre čítačku), čiara cesty so skrolom
  (jediný skrolom riadený prvok), dialóg lupy, formulár s chybami pod poľami.
- `docs/NAVRH.md` – záväzný dizajnový brief, `docs/ZDROJE.md` – zdroje údajov, chyby pôvodného webu, čo je neoverené.

## Kontrola

`node source/kontrola.mjs` (Playwright; nájde ho v projekte alebo v globálnych moduloch Node) overí 20 stránok:
konzola a sieť bez chýb, odkazy a obrázky, jeden h1 a poradie nadpisov, žiadne pretekanie pri 320 až 1440 px, výber
bytu (klik, filter, klávesnica, dotyk), lupa, formulár, cesta na Financovaní, beh bez JS a s obmedzeným pohybom,
úvodná sekvencia, poradie Tab s viditeľným fokusom. `--url=https://…/visionary-living/` testuje nasadený web.

Lighthouse (telefón, index.html, lokálny server s gzipom): výkon 100, prístupnosť 96 → 100 po úprave pätky,
osvedčené postupy 100; SEO zámerne nižšie kvôli `noindex`. LCP 1,7 s, CLS 0, TBT 0.

## Nasadenie

1. V `source/zostav.py` nastaviť `BASE` na doménu a vygenerovať; odstrániť riadok `<meta name="robots" content="noindex">`
   (generátor, `stranka()`); nahrať `index.html`, `*.html`, `byt/`, `assets/`, `robots.txt`, `sitemap.xml`.
2. Formulár odosiela cez `mailto:`; klient doplní formulárovú službu do `action` (generátor, `kontakt()`).
3. Pred nasadením s klientom: termín „Jar 2026“ (už minulosť), stav bytov (stav k 13. 10. 2026), pôdorysy
   (zobrazené sú výrezy bez cudzieho označenia), priradenie interiérových vizualizácií k bytom.

## Odchýlky od briefu (docs/NAVRH.md)

- Schematický pôdorys v paneli a na detaile nahradil skutočný výrez z klientovho pôdorysu (orezaný tak, že neobsahuje
  cudzie označenie): nič sa nedomýšľa a výrez je presnejší než schéma.
- Písma sú samohostované a orezané hneď (nie Google Fonts), aby prvá obrazovka nečakala na cudzí server.
- Nadpis titulného listu má tri riadky (nie štyri) – tretí riadok je „Černík“, pomlčka ostáva na konci druhého.
