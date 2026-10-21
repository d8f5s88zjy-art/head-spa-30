# Skeptik k plánu „Telefón v2“ (PLAN-TELEFON-V2.md, 21. 10. 2026)

Rola: skeptik. Len čítanie: `$V/PLAN-TELEFON-V2.md`, `$V/diagnoza.md`, `$V/pohyb.md`, `$V/asistent.md`, `$V/vernost.md`,
`$V/lqip/lqip.json`, strom `$T` (HEAD f624ee8), `$L/POZIADAVKY-MAJITELA.md`, `$L/stavba/meranie-1.md`, `$L/fotky-ako-pc/`,
`$SP/barber/OTAZKY-PRE-MAJITELA.md`, `$SP/barber/PRIEBEH.md`, `$SP/hs-lahky/vernost/`, referencia `claude-api` (cenník k 2026‑10‑06).
Bez prehliadača, bez servera, nič v stromoch nezmenené. Cesty ako v pláne (`$SP`, `$T`, `$L`, `$V`).

**Verdikt: plán je v jadre poctivý a dobre podložený kódom, ale má tri vážne diery, ktoré ho v dnešnej podobe vyvracajú
ako „plán, ktorý potvrdí príčiny a odstráni čierne obrazovky“: (1) V0 nedokáže oddeliť chybu stránky od chyby náhľadu
a jeho rozhodovací strom by zahodil všetky dôkazy majiteľa; (2) test, ktorým V0 „potvrdí“ hlavnú príčinu P1, nemeria
to, čo tvrdí; (3) V3 svojím vlastným mechanizmom (`is-on` len po dekódovaní) vracia „cudziu scénu“, ktorú V1 odstraňuje.
Ostatné výhrady sú drobnosti alebo otázky na majiteľa.** `vyvratene = true`.

---

## 0. Čo som overil v kóde (každé tvrdenie plánu má riadok; tu je 12 kontrol, ktoré som urobil znova)

| # | Tvrdenie plánu | Overenie | Výsledok |
|---|---|---|---|
| 1 | pod zálohou je plochá farba `--ink-2` (`style.css:463`) | `sed -n 455,465p` → `.film-still { … background: var(--ink-2); }` | **sedí** |
| 2 | priblíženie z `--sp` a `will-change` (`style.css:471, 475`) | `transform: scale(calc(1 + 0.06 * var(--sp, 0)))`; `html[data-motion="on"] .film-shot.is-near .film-still img { will-change: transform; }`; `app.js:43` dáva `data-motion="on"` aj v lite | **sedí** (will-change platí aj na lite) |
| 3 | náhľad z HTML má iba úvod (`index.html:174`, `style.css:1148` len `[data-pro]`) | `grep -c '<picture class="film-still'` = 11, `grep -c -- '--nahlad'` = 2 (oba v `<template>` úvodu); `style.css:1148–1150` `html.lite .film-shot.is-title[data-pro] .film-still …` | **sedí** |
| 4 | AVIF pred WebP na telefóne a preload len AVIF (`index.html:24–25, 175–176`) | `l.type='image/avif'`; `<source media="(max-width: 720px)" type="image/avif">` pred `type="image/webp"` | **sedí** |
| 5 | video + plagát `.webp` + `--ink-3` (`index.html:325–327`, `style.css:387–394`) | `data-poster="assets/video/tim-v-akcii-poster-576.webp"`, `.video-window { background: var(--ink-3) }` | **sedí** |
| 6 | lightbox len JPG, AVIF 1600 existuje (`index.html:684, 686`) | `data-lightbox-src="assets/img/naradie-noznice-1600.jpg"`; `naradie-noznice-1600.avif` v srcset | **sedí** |
| 7 | pätička → HEAD SPA, `vernost.js` bez `data-zapnute` (`index.html:879, 914`; `vernost.js:42–43, 171–177`) | overené doslovne; `ZAPNUTE = skript.hasAttribute('data-zapnute')` | **sedí** |
| 8 | videá: zdroj 576×1024, 30 fps, `minterpolate` na 60, lanczos na 864 (`videa.sh:10–17`) | `UP="scale=864:1536:flags=lanczos…"`, `MI="minterpolate=fps=60…"`, komentár „originály sú 30 snímok/s“ | **sedí** – podmienka majiteľa „60–120 fps“ sa dnešnými súbormi splniť nedá |
| 9 | merania: p95 −73 %, bajty −51 %, LoAF 21 nie 0 (`meranie-1.md:26, 28, 31`) | riadky 26/28/31 presne | **sedí** |
| 10 | 30,8 % scény, porota B (`FAKTY.md:32`, `POROTA.md` Verdikt) | „Spolu ostane 30,8 % pôvodnej fotky“; Verdikt „B … pre všetkých 9 titulných kariet“ | **sedí** |
| 11 | cenník Anthropic (Haiku 5.5 0,10/0,50; Sonnet 5.5 2/10; Opus 5.5 4/20 USD/M; cache read 0,20; Fable 5.1 30‑dňové uchovávanie) | referencia `claude-api` k 2026‑10‑06 | **sedí**; výpočet 6 000 vstup + 150 výstup → 0,0007 / 0,0135 / 0,027 USD sedí |
| 12 | fakty o podniku v `asistent.md` (hodiny Po–Pi 9–19, So 9–14; tel. 0951 267 203; FACEPALM, s.r.o., IČO 52231381; Booqme `/barbershop30`) | `index.html:824, 829, 827, 884, 484, 644` | **sedí** |

Drobné chyby v citáciách: `app.js:144` je `snapUntil`, funkcia `snapNow` je na `app.js:396`; `setVar` (`app.js:115–122`)
zapisuje len pri zmene > 0,002, takže „až 9 zápisov na snímku“ je horná hranica, nie bežný stav (pri pomalom ťahu sa
mení `--so`/`--o` 2–4 kariet a `--sp` ≤ 3).

---

## 1. Rieši plán to, čo majiteľ napísal? (bod po bode)

| Majiteľ (15:45 UTC) | Plán | Hodnotenie skeptika |
|---|---|---|
| čierne obrazovky; žiadne čierne polia ani okná | V1a–e (LQIP všade, WebP, plagáty, lightbox), V4 | Správny smer a všetko [kód]-podložené. **Ale** plán potichu definuje „čierne pole“ ako *plochá farba pod fotkou alebo prázdny rámik* a výslovne necháva tmavé: lištu, spodné tlačidlo, pätičku (kritérium V1 „okrem pätičky“), ponuku, okno prihlášky `#141210` (V6 bod 7). Celý web je `ink #0E0D0C`. Či majiteľ myslí aj tieto zámerne tmavé plochy, plán nepýta – jediná otázka je pri V6 bod 7. Treba jednu výslovnú otázku v prvej správe majiteľovi (pozri doplniť 1). |
| zhoršila sa plynulosť | V1f (bez priblíženia), V3 (bez zápisov na snímku), P1/P2 cez V0 | Hypotézy sú označené [predpoklad], dobre. Chýba však alternatíva „zhoršenie je v náhľade, nie v stránke“ (iframe/hosting – pozri vážne 1): plán to má v P4/P7, ale rozhodovací strom to nevie rozlíšiť. |
| prechody nie sú cinematické ani filmové | V3 (strih s vlastným časom) | Je to interpretácia („pripnuté na prst“ = jadro výčitky, `pohyb.md` 1.2 sám píše „myslím“). V pláne 0 je už ako „najpravdepodobnejšia príčina“ bez označenia [predpoklad]. Alternatívna interpretácia (na telefóne je len statický výrez bez pohybu kamery, kým na PC je WebGL film) by viedla inam. Navyše poradie V0→V1→V4→V2→V3 ukáže majiteľovi **dva náhľady, ktoré sú menej filmové než dnes** (V1f vypne jediný pohyb fotky), a filmovosť príde až v 5. dávke, pričom „dosadnutie“ V3 závisí od súhlasu B (V2). Ak B zamietne, V3 = prelínanie + záblesk + slová – málo nad dnešok. |
| chcem, aby celé fotky boli vidno | V2 (variant B, rozhodnutie B) | Správne ako rozhodnutie majiteľa. Ale veta je dvojznačná: 07:03 písal „fotky neúplné“ (napoly stiahnuté), 09:48 „vidno tak dobre ako na PC“ (ostrosť), 15:45 „celé fotky“ (výrez?). Plán berie len výrez. Pri rozhodnutí B treba otázku položiť tak, aby sa dvojznačnosť odstránila (doplniť 2). |
| videá nedávaj pod 60–120 fps, sú rozmazané | V4 | Splnené a podložené (`videa.sh`). Nezrovnalosť: kritérium „0 `<video>` v DOM v lite“ pri „index.html sa nemení“ – `<video>` na `index.html:325` je v HTML, odstrániť ho musí JS alebo CSS; plán to nehovorí (doplniť 7). |
| AI agent, ktorý odpovedá | V5 etapa 1 = **nie AI** (kľúčové slová), etapa 2 = model, rozhodnutie H | Plán to nezatajuje (asistent.md 0.5 to píše výslovne), ale tabuľka 0 plánu („stránka má komunikovať – AI agent → V5“) a tabuľka 5 („tlačidlo Recepcia … 30 odpovedí“) umožnia majiteľovi vyhodnotiť etapu 1 ako „ten AI agent, čo som chcel“ – a sklamať sa, keď nerozumie otázke mimo 30 položiek. Odporúčanie „etapa 2 až po týždni etapy 1“ je názor tímu, nie majiteľa – ten chcel AI; patrí to do rozhodnutia H ako voľba, nie ako predvolený odklad (doplniť 3). |
| zákaznícka karta | V6 (hneď V6a–e, M1–M4 u majiteľa) | Najpoctivejšia časť plánu: nič nesľubuje bez servera (vernost.md 4.1), skúška jasne označená. Správne, že „karta len v prehliadači“ sa neodporúča. |

Nič z výčitiek plán nevynecháva; dve prekrúca jemne (filmovosť = len časovanie strihu; celé fotky = len výrez) a jednu
rieši niečím iným, než majiteľ pomenoval (AI agent → kľúčové slová), čo je síce rozumné, ale musí to byť v prvej vete
náhľadu, nie v časti 4 rozboru.

---

## 2. Sú príčiny pre iPhone podložené a stačí V0 na ich potvrdenie?

Podložené [kód]: P3 (chýbajúce súbory v náhľade → tmavý obdĺžnik videa a lightbox, `index.html:325–327, 684`,
`style.css:387–394`) – to je **jediná príčina čiernych polí, ktorá je dokázaná bez telefónu**, a plán ju správne rieši
hneď (V1d/e, O5). Všetko ostatné (P1, P2, P4, P5–P8) sú predpoklady, správne označené.

Čo V0 **nezvládne**:

1. **P4 (rámec) sa nedá vylúčiť a rozhodovací strom je logicky chybný.** `app.js:861–866` už dnes hovorí „rootBounds
   chýba v cudzom rámci (náhľad)“ – náhľad je rámec, to je [kód], nie predpoklad. Artefakt claude.ai beží v rámci aj
   v Safari mimo aplikácie (tá istá stránka claude.ai s vloženým obsahom), takže krok „to isté v Safari“ P4 neoddelí.
   Jediná vrchná (top=self) plocha je GitHub Pages – a pravidlo 1.3 plánu hovorí „Nič sa nenasadzuje na GitHub Pages“,
   pričom V0 zároveň žiada „po nasadení na GitHub Pages zopakovať bod 1“. Plán si tu protirečí a nemá krok, ktorý by
   P4 rozhodol. K tomu strom: „`V RÁMCI` **alebo** `innerHeight ≫ screen.height` → náhľad nepoužiteľný“ – keďže
   `V RÁMCI` bude vždy, strom zahodí **každé** meranie majiteľa. Správne je „v rámci **a zároveň** rozťahnutý“; samotný
   rámec s výškou okna je v poriadku.
2. **Test „Overiť zahodenie“ (drawImage > 20 ms = bitmapa zahodená) nemeria to, čo tvrdí.** `drawImage` dekódovanej
   `<img>` do plátna používa vo WebKite inú cestu (obrázok pre plátno sa môže dekódovať znova nezávisle od toho, či
   skladač svoju bitmapu drží) – prvé kreslenie do plátna trvá desiatky ms aj pri nedotknutej vrstve. Falošne pozitívny
   výsledok potvrdí P1 a strom z toho vyvodí „V2 je jediná trvalá cesta“. Jediný spoľahlivý signál P1 v paneli je
   „načítania v relácii > 1“ (pád procesu) a časová zhoda medzery rAF s `+is-shown` pri `__dec = true`; tie dva nech sú
   kritériom, drawImage len ako orientačný údaj. (P1 je navyše [WebKit] správanie bez odkazu na zdroj – hypotéza
   o nižšom strope pamäte WKWebView je výslovne „Apple čísla nezverejňuje“.)
3. **Panel sám ruší meranie plynulosti.** `layers()` prejde `getComputedStyle` + `getBoundingClientRect` cez ≈ 1 500
   prvkov každých 500 ms (diagnoza.md 2.3 odhaduje 5–10 ms na volanie). Kritérium V3 na iPhone je „rAF p95 ≤ 9 ms pri
   120 Hz“ a „0 rozstupov > 34 ms“ – panel s pravidelným 5–10 ms zásahom na hlavnom vlákne pokazí práve histogram, ktorý
   má zmerať. `layers()` má bežať len na tlačidlo (ako „Overiť zahodenie“), nie v intervale.
4. **„Náhľad musí mať všetky súbory“** naráža na známy limit artefaktu: PRIEBEH.md:81 – 511 súborov, preto pôvodný
   náhľad vynechal WebP/JPG; `assets/` má dnes 682 súborov a 100 MB (img 439/76 MB, seq 190/8,2 MB, video 20/14 MB).
   Bez `seq/`, `source/`, `docs/` je to ≈ 490 súborov / ≈ 92 MB – pod limitom 511 / 256 MB, ale nad 64 MB na jedno
   publikovanie, teda dve publikovania; a plán chce **dva** takéto náhľady (AVIF + videá / WebP bez videí). Dá sa, ale
   plán to musí povedať skladačovi náhľadu, inak sa zopakuje „len AVIF“ a majiteľ znova uvidí P3.
5. Náhľad s panelom zakryje 46 vh spodku obrazovky vrátane spodných tlačidiel; „čiernu obrazovku odfotiť s panelom“
   ukáže len hornú polovicu. Tlačidlo Min/Max to rieši, len treba majiteľovi povedať: pri čiernej najprv Min, potom foto.

Záver k (2): V0 je nutný a lacný, ale v dnešnej podobe potvrdí spoľahlivo len P3 a prípadný pád procesu; P1 a P4
ostanú po V0 presne tak nepodložené ako pred ním, a strom by pritom tvrdil opak.

---

## 3. Filmovosť vs. plynulosť – je to v rozpore a sú kritériá merateľné?

- Princíp „skrol rozhodne, CSS zahrá“ je správna odpoveď na obe požiadavky naraz (transform/opacity na skladači).
  V rozpore nie sú; plán aj poctivo píše, že LoAF = 0 je predikcia.
- **Rozpor je vnútri V3 samého:** „`is-on` prepnúť len ak `stillReady` (dekódované)“ (plán V3, súbory) znamená, že pri
  pomalej sieti alebo skoku z menu sa stav neprepne a pod textom novej karty ostane **fotka predchádzajúcej** – presne
  „cudzia scéna“ z `kontrola-vzhlad-2` nález 1, ktorú V1a (LQIP pod každou kartou) a `pohyb.md` 4.7/6 („cieľová karta
  má okamžite svoj náhľad, ostrá dobehne zaostrením“, R5) odstraňujú. Jedna z dvoch viet musí padnúť; mechanizmus V3
  musí prepínať stav vždy a nechať `img.nacitana` riešiť ostrosť.
- Kritériá: Chromium má čísla (p95, LoAF, zápisy = 0, vrstvy ≤ 9) – merateľné. iPhone: „0 rozstupov > 34 ms“ je nulová
  tolerancia na zariadení, kde jediný GC alebo callback dekódovania dá jeden rozstup; V3 by tak neprešla nikdy – zvoliť
  p99 alebo ≤ 2 na 10 s. „Je to filmové“ je priznane jediné nečíselné kritérium a je rozhodujúce – v poriadku, ale
  potom nech má V3 aj **negatívne** kritérium: ak majiteľ povie „nie“, čo sa mení (dĺžka strihu, stierka, dosadnutie)?
  Plán nemá iteráciu, len áno/nie.
- „`will-change` v pokoji = 0“ popri „okolie `scale(1 → 1.08)` 14 s“ (pohyb 4.1): kým je karta `is-on`, beží animácia
  vrstvy cez celé okno (1 290 × 2 796), stránka nie je „v pokoji“; kritérium treba definovať ako „bez `will-change`,
  animované vrstvy ≤ 1 mimo strihu“.
- Výkonový prínos V3 je neistý: `setVar` už dnes zapisuje len pri zmene (`app.js:115–122`), p95 v Chromiu je 14,5 ms;
  hodnota V3 je estetická. To nie je chyba, len nech sa V3 nepredáva ako oprava plynulosti.

---

## 4. Vymyslené fakty (asistent, karta, právne)?

- O podniku nič vymyslené: ceny, hodiny, telefón, prevádzkovateľ, Booqme – všetko v `index.html` (tabuľka 0, riadok 12).
  Sídlo FACEPALM v Mojmírovciach je správne označené [predpoklad].
- Cenník Anthropic sedí s referenciou; AI Act čl. 50 (transparentnosť pri komunikácii s AI) je skutočná povinnosť;
  `inference_geo`, DPA a uchovávanie sú správne označené na overenie.
- Dve **nové vety** v odpovediach etapy 1 nie sú zo stránky: „Vo sviatky môže byť inak, pre istotu zavolaj.“ (položka 2)
  a „Záväzné ceny a termíny sú v rezervačnom systéme.“ (položka 22). Rozbor ich označuje „opatrnosť“, ale druhá je
  tvrdenie o tom, kde sú záväzné ceny – a rezervačný systém má pri službách „None min“ (`CONTENT_SOURCES.md`). Obe
  vety nech schváli majiteľ (R2), nie len právne texty.
- „7 jazykov“ (V5) vs. „8 jazykov“ (V6): `assets/i18n/` má 7 slovníkov + sk = 8 jazykov; `vernost.js` má 8 vrátane sk.
  Je to konzistentné, len terminológia mätie – zjednotiť na „sk + 7“.
- Plán V6 bod 1 nazýva hosting HEAD SPA „Forpsi“ (`ftp.yml:5` len príklad `ftpx.forpsi.com`, `README.md:3`
  vernost) – označiť ako predpoklad, kým majiteľ nepotvrdí.

---

## 5. Poradie a čo čaká na majiteľa

- Kritická cesta k „žiadne čierne obrazovky“: V0 (5 snímok × 2 prostredia) → V1 stavba → V1 snímky. Minimálne dve kolá
  majiteľa, hoci V1 na V0 nezávisí („bez merania“). **V0 a V1+V4+V6a sa dajú poslať naraz** ako dva náhľady (pôvodný
  f624ee8 s panelom na diagnostiku; opravený s panelom na hodnotenie) – jedno kolo namiesto dvoch, a majiteľ hneď vidí
  zlepšenie, nie len panel. Plán má namiesto toho 7 náhľadov (tabuľka 5) a každé kritérium prijatia viaže na jeho fotky
  (pravidlo 1.6). Pre majiteľa, ktorý už dnes píše „stále čierne obrazovky“, je to priveľa kôl bez viditeľného výsledku.
- Rozhodnutie B (V2) blokuje V3 „dosadnutie“ a V1g; plán to vie. Nevie však, že V1f (vypnutie priblíženia) **pred** V3
  dá majiteľovi medzistav bez akéhokoľvek pohybu fotky – pri výčitke „nie je to filmové“ by V1f mala ísť spolu s V3,
  alebo musí byť v správe k V1 výslovne: „pohyb sme dočasne vypli kvôli plynulosti, vráti sa v ďalšej dávke“.
- Rozpočet HTML: V1a pridá ≈ 2,7 kB gzip (LQIP) a V6c +0,4 kB, hoci `index.html` je už 16 548 B nad rozpočtom 14 600 B,
  a V5 má preto „0 B v HTML“. Buď rozpočet platí pre všetky dávky, alebo sa prepíše; dnes platí len pre V5.
- Čo čaká na majiteľa je zhrnuté správne (A–I). Chýba jedna položka: **top‑level test** (P4) – nasadenie do
  súkromnej/testovacej cesty na GitHub Pages alebo inde mimo rámca je rozhodnutie majiteľa (verejná adresa).

---

## 6. Vážne nedostatky (vyvracajú plán v dnešnej podobe)

1. **V0 nevie oddeliť chybu stránky od chyby náhľadu.** Náhľad je rámec aj v Safari (app.js:861–866 to priznáva),
   jediná vrchná plocha (GitHub Pages) je pravidlom 1.3 zakázaná, a rozhodovací strom „`V RÁMCI` alebo … → nepoužiteľné“
   zahodí každé meranie. Plán potrebuje: (a) opravu stromu na „v rámci **a** rozťahnutý“, (b) krok, ktorý dá top‑level
   test (rozhodnutie majiteľa), (c) priznanie, že bez neho P4/P7 ostanú otvorené.
2. **Hlavná príčina P1 sa po V0 nepotvrdí ani nevyvráti.** Test „Overiť zahodenie“ (drawImage > 20 ms) je falošne
   pozitívny z princípu; obalené `decode()` zmeria len prvé dekódovanie. Strom na tom stavia „V2 je jediná trvalá
   cesta“. Kritériom P1 nech je len počítadlo načítaní a časová zhoda rAF‑medzier s `+is-shown`; V2 sa má odôvodniť
   tým, čo je isté (menšia bitmapa, −64 % bajtov, 100 % scény), nie neplatným testom.
3. **V3 protirečí V1 a pohyb.md:** „`is-on` len ak dekódované“ vracia cudziu scénu pod textom pri pomalej sieti a skoku
   z menu – presne to, čo V1a (LQIP pod každou kartou) a R5 („zaostrenie, nikdy cudzia“) odstraňujú. Mechanizmus V3 musí
   stav prepínať vždy; ostrosť rieši `nacitana`.
4. **Diagnostický panel kazí vlastné meranie plynulosti** (`layers()` každých 500 ms cez ≈ 1 500 prvkov) a plán zároveň
   stanovuje nulovú toleranciu rozstupov > 34 ms na iPhone – kritérium V3 je tým nesplniteľné. `layers()` len na tlačidlo,
   tolerancia p99 alebo ≤ 2 / 10 s.
5. **Plán rieši majiteľove „čierne polia“ vlastnou definíciou** (plochá farba pod fotkou) a ponecháva zámerne tmavé
   plochy (lišta, tlačidlo, pätička, ponuka, okno prihlášky `#141210`) bez jedinej otázky majiteľovi. Ak majiteľ myslí
   aj tie, celá dávka V1 neprejde jeho hodnotením. Jedna otázka v prvej správe to vyrieši – teraz chýba.

---

## 7. Doplniť (drobnosti)

1. Prvá správa majiteľovi: ukázať mu jeho vlastnú snímku a spýtať sa, ktorá plocha je „čierne pole“ (fotka pod textom /
   rámik galérie / video / lišta a pätička / okno prihlášky). Bez toho sa kritérium „0 fotiek s čiernou plochou“ nedá
   vyhodnotiť jeho očami.
2. Pri rozhodnutí B položiť otázku k „celé fotky“ s troma významami (celý výrez / nikdy napoly stiahnutá / ostrá ako PC)
   – a priznať, že variant B mení rozsah MASTER_BRIEF:88 a ide proti „rovnaký vzhľad ako na počítači“.
3. V5: v náhľade a v správe majiteľovi hneď prvou vetou „Recepcia nie je AI – odpovedá z 30 pripravených odpovedí;
   skutočný model je rozhodnutie H“. Odklad etapy 2 „po týždni“ dať ako voľbu, nie ako predvolené.
4. V0 + V1 + V4 + V6a poslať v jednom kole ako dva náhľady (pôvodný s panelom, opravený s panelom); V1f buď až s V3,
   alebo s výslovnou vetou o dočasnom vypnutí pohybu.
5. Skladač náhľadu: zoznam súborov pre lite (bez `seq/`, `source/`, `docs/`; ≈ 490 súborov / ≈ 92 MB, dve publikovania),
   aby sa „len AVIF“ nezopakovalo; kontrola 0 × 404 v náhľade je kritérium V0, nie až V1.
6. V0: „pri čiernej obrazovke najprv Min, potom foto“; `<meta name="b30-commit">` aj do pôvodného náhľadu f624ee8;
   zjednotiť `?diag=1` (diagnoza) a `?ladenie=1` (pohyb) na jeden parameter.
7. V4: povedať, kto odstráni `<video>` z `index.html:325` v lite (JS pri štarte, alebo CSS `display: none` a kritérium
   zmeniť na „0 požiadaviek na video“, nie „0 `<video>` v DOM“).
8. V3: pridať iteráciu po „nie je to filmové“ (čo sa ladí: dĺžka 500–900 ms, stierka áno/nie, dosadnutie 1,02–1,06);
   kritérium „v pokoji“ definovať pri bežiacej 14 s animácii okolia (≤ 1 animovaná vrstva mimo strihu).
9. Rozpočet HTML 14 600 B gzip: buď platí pre V1a/V6c (potom LQIP 24×43, nie 48×85, a sekcia V6c do JS), alebo sa
   prepíše a V5 môže mať statické tlačidlo (variant B asistenta, lepšie pre čítačky).
10. asistent.md: dve nové vety (sviatky, záväzné ceny) do R2 na schválenie; „7 jazykov“/„8 jazykov“ zjednotiť na „sk + 7“.
11. Citácie: `snapNow` je `app.js:396` (144 je `snapUntil`); „9 zápisov na snímku“ je horná hranica (`setVar` zapisuje
    len pri zmene > 0,002); „Forpsi“ označiť ako predpoklad.
12. Tabuľka 0 plánu: príčina filmovosti („pripnuté na prst“) označiť [predpoklad], nie ako fakt; uviesť aj
    alternatívu (statický výrez bez kamery vs. WebGL na PC).
13. V2 kritérium kontrastu „`paper` ≥ 4,5:1 pod `.title-sub`“ sa meria na snímke s LQIP okolím – pri svetlých scénach
    (vstup, recepcia) plán dovoľuje gradient do 0,42, čo je opäť tmavé pole pod textom; povedať, kde je hranica, pri
    ktorej sa radšej zmení poloha textu než tón.
