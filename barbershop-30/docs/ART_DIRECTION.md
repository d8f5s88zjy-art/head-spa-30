# BARBERSHOP 30 – výtvarný smer

Stav: pracovná verzia 1 (2026-10-09). Všetko nižšie je odvodené zo 45 fotografií
prevádzky (`source/photos/`) a z briefu „Tvoj strih. Tvoje miesto.“

## 1. Čo sme videli na fotkách (a z čoho vychádzame)

Prevádzka má tri výrazné priestory a jeden rukopis:

- **Hlavná sála** – oranžové priemyselné závesné lampy, tmavozelené metro obklady,
  tmavé dubové panely so zrkadlami, Edisonove trubicové kinkety, čierno‑zlaté
  retro kreslá s prešívanou kožou a liatinovým zlatým rámom, tmavá dubová podlaha,
  terakotovo‑okrová stierka na protiľahlej stene.
- **Predná sála s recepciou** – biele metro obklady, čierny vlnitý strop s drevenými
  trámami, drevený pult s čiernou lamelovou čelnou stenou, rohožka s logom,
  svietiaci nápis BARBERSHOP 30 v machu, detské kreslo‑autíčko COPS, sudy, regál
  s produktmi.
- **Zadná miestnosť** – čierne lesklé obklady, zelené zamatové sedačky, kruhové
  LED svietidlá, červená retro benzínová pumpa Route 66, čiernobiele fotografie.
- **Vstup a čakáreň** – dvere s leptaným logom, dve zelené kreslá s vankúšmi
  BARBER SHOP, medená lampa z rúr, okrová stena, cenník v ráme pri dverách.

Rukopis: **retro‑industriálne remeslo s humorom**. Nie sterilný luxus, ale teplý,
mužský, komunitný priestor. Detaily (astronaut, Route 66, graffiti buldog) hovoria,
že tu sa ľudia cítia dobre. Web musí byť rovnako sebavedomý a rovnako vrúcny.

## 2. Paleta

Jeden svetelný akcent (oranžová lámp), zvyšok materiál. Mosadz žije iba v 3D
objekte a vo fotografiách, nie v UI.

| token | hodnota | použitie |
|---|---|---|
| `--ink` | `#0E0D0C` | základná uhoľná čierna (teplá) |
| `--ink-2` | `#17141 2`→ `#171412` | plochy sekcií |
| `--ink-3` | `#221D19` | zvýšené plochy, karty |
| `--line` | `rgba(241,233,221,.14)` | vlasové linky, rámčeky |
| `--paper` | `#F1E9DD` | teplá biela – text, nadpisy |
| `--paper-2` | `#C9BEAE` | sekundárny text |
| `--paper-3` | `#8E8578` | popisky, tretia úroveň |
| `--lamp` | `#E0601C` | JEDINÝ akcent: tlačidlá, fokus, aktívne stavy, linka progresu |
| `--lamp-2` | `#F07E3C` | hover/aktívny stav akcentu |
| `--teal` | `#163B3C` | hlboký podklad scény „Miesto“ (ozvena obkladov), max 1 sekcia |
| `--leather` | `#1A1614` | 3D koža (základ) |
| `--brass` | `#B5924E` | 3D kov (základ), odlesky |

Kontrast: `--paper` na `--ink` 15.8:1, `--paper-2` na `--ink` 9.9:1,
`--ink` na `--lamp` 6.3:1 (text na tlačidle), `--paper-3` na `--ink` 4.9:1.

## 3. Typografia

Dve rodiny, obe so slovenskou diakritikou, hostované lokálne (`assets/fonts/`).

- **Fraunces 800 (opsz 144)** – titulky. Má rytý, mierne „vrtošivý“ charakter,
  ktorý sedí k rytému logu „30“ na rohožke. Fraunces 500 italic pre jeden‑dva
  tiché citáty.
- **Manrope 400/600/700** – všetok bežný text, popisky, tlačidlá, navigácia.

Mierka (clamp, desktop → mobil):

| rola | veľkosť | riadkovanie | písmo |
|---|---|---|---|
| H1 | `clamp(2.75rem, 7.2vw, 6.75rem)` | 0.94 | Fraunces 800, `letter-spacing:-.02em` |
| H2 | `clamp(2rem, 4.4vw, 3.5rem)` | 1.0 | Fraunces 800 |
| H3 | `clamp(1.35rem, 2vw, 1.75rem)` | 1.15 | Fraunces 800 |
| eyebrow | `.8125rem` | 1 | Manrope 600, VERZÁLKY, `letter-spacing:.14em` |
| lead | `clamp(1.125rem, 1.5vw, 1.375rem)` | 1.45 | Manrope 400 |
| body | `1.0625rem` (17px) | 1.6 | Manrope 400 |
| small | `.9375rem` | 1.5 | Manrope 400 |
| button | `.875rem` | 1 | Manrope 700, VERZÁLKY, `letter-spacing:.08em` |

Maximálna šírka odseku 62 znakov. Titulky sa nikdy nerozmazávajú ani nescaleujú
pod 1 počas prechodov (len opacity + posun do 24 px).

## 4. Mriežka a medzery

- Kontajner `max-width: 1360px`, bočný okraj 40 px desktop, 24 px tablet, 16 px mobil.
- 12 stĺpcov, medzera 24 px. Textové bloky v scénach: 5/12 stĺpcov desktop, plná
  šírka mobil.
- Medzery: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 144 px (`--s1`…`--s10`).
- Rámčeky: 1 px `--line`, polomer 8 px (karty), 6 px (tlačidlá), 999 px (chipy).

## 5. Komponenty

- **Tlačidlo primárne**: výška 52 px (mobil 50), výplň `--lamp`, text `--ink`,
  hover `--lamp-2` + posun ikony 2 px, aktívny stav 160 ms. Fokus: 2 px obrys
  `--lamp` s odsadením 3 px, na tmavom aj svetlom podklade viditeľný.
- **Tlačidlo sekundárne**: obrys 1 px `rgba(241,233,221,.42)`, text `--paper`,
  hover obrys plný.
- **Lišta navigácie**: priehľadná v hero, po 80 px scrollu podklad
  `rgba(14,13,12,.72)` + `backdrop-filter: blur(12px)`, výška 64 px. Vpravo vždy
  „Rezervovať“. Na mobile menu na celú obrazovku + stále dostupné spodné tlačidlo
  „Rezervovať termín“ (výška 56 px, `padding-bottom: env(safe-area-inset-bottom)`),
  ktoré sa skryje len vo finálnej scéne rezervácie.
- **Linka progresu príbehu**: 2 px, `--lamp`, vľavo na desktope (zvislá, 7 kapitol
  ako body), na mobile hore pod lištou (vodorovná). Čisto informatívna, nie ovládanie.
- **Karta služby**: názov (H3), opis, cena vpravo (Fraunces 800), trvanie pod
  cenou, tlačidlo „Objednať“ → rezervácia. Rámček 1 px `--line`, hover rámček
  `rgba(241,233,221,.3)`.
- **Chip**: popisok v obraze (napr. „Hlavná sála“), `rgba(14,13,12,.6)` + blur,
  text Manrope 600 13 px.

## 6. Svetlo a materiály (3D kreslo)

Kreslo je **autorský štylizovaný symbol** odvodený zo zlato‑čiernych kresiel
v hlavnej sále. Nie je to digitálna kópia konkrétneho kusu a web to nikde netvrdí.

- Koža: `MeshPhysicalMaterial`, farba `--leather`, roughness .55, clearcoat .22,
  clearcoatRoughness .5, sheen .25 (teplý), normálová mapa = procedurálne
  diamantové prešívanie + jemné zrno (generované do canvas textúry 1024²).
- Kov: `MeshPhysicalMaterial`, farba `--brass`, metalness 1, roughness .32,
  odrazy z PMREM `RoomEnvironment` (intenzita .55). Liatinové hrany majú
  skosenie, aby chytali odlesk.
- Základňa a stĺp: satén čierna (roughness .45, metalness .25) + mosadzný prstenec.
- Svetlo: hlavné teplé bodové `#FFD8B4` zľava hore, úzke protisvetlo
  `#FF9A58` sprava zozadu (ozvena oranžových lámp), slabé hemisférické
  vyplňovacie `#2A2622`/`#0E0D0C`. Tiene PCF soft 1024², kontaktný tieň
  (radiálny gradient na podlahe) pre kontakt so zemou.
- Tónovanie ACES Filmic, expozícia 1.0, sRGB výstup. Pozadie priehľadné – za
  canvasom je CSS gradient (`--ink` → `#1A1511` vľavo dole), aby sa poster a 3D
  zhodovali.

Zásada: najprv statický záber, ktorý obstojí sám (poster). Pohyb iba pridáva.

## 7. Fotografie

- Originály v `source/photos/` (45 ks, 1932×2576 px, orientácia na výšku).
- Web dostáva AVIF + WebP + JPEG fallback v šírkach 640 / 1080 / 1600 / 2200 px,
  s `object-position` podľa ohniskového bodu z inventára.
- Fotografie s posunom vrstiev sú označené ako **2.5D spracovanie** (v kóde aj v
  dokumentácii). Žiadny 3D model interiéru neexistuje a web ho netvrdí.
- Ľudia: zábery, kde je rozpoznateľná osoba (odraz v zrkadle, chodci za sklom),
  sa nepoužijú bez súhlasu – pozri inventár.

## 8. Pohyb – pravidlá

- Jeden zdroj pravdy: `progress` (0–1 nad celým dokumentom) a z neho odvodený
  lokálny čas každej scény. Kamera, svetlo, text aj CSS premenné čítajú to isté
  číslo v jednom `requestAnimationFrame`.
- Tri vrstvy pohybu: **hlavný** (kamera medzi scénami), **podporný** (svetlo,
  hĺbka 2.5D, paralaxa ≤ 6 %), **mikro** (160–240 ms). Keď sa hýbe kamera
  výrazne, text stojí.
- Nástupy textu 450–700 ms, `cubic-bezier(.2,.7,.2,1)`. Žiadne rozmazanie
  dôležitého textu, žiadne blikanie, žiadne častice.
- Scroll funguje dopredu aj dozadu, skok cez navigáciu nastaví stav okamžite,
  zmena rozmerov prepočíta rozsahy, obnovenie stránky uprostred príbehu obnoví
  správnu scénu bez animovaného „dobiehania“.
- Desktop: kurzor jemne posúva hlavné svetlo (±0.35 jednotky, dobeh 0.08).
  Mobil: stabilné svetlo, žiadne pointer efekty.
- `prefers-reduced-motion: reduce`: poster namiesto 3D, žiadne scrollom riadené
  prechody, bežný priechod obsahom s okamžitými stavmi.
- Zlyhanie WebGL alebo pomalé zariadenie (`deviceMemory < 4`, `saveData`):
  poster, zvyšok webu bez zmeny.

## 9. Čo web nikdy nerobí

Nevymýšľa recenzie, mená, ceny, služby ani výsledky. Každý obchodný údaj má
zdroj v `docs/CONTENT_SOURCES.md`. Nepotvrdené údaje sú v kóde označené
`data-required="…"` a sú skryté, nie zobrazené ako pravda.
