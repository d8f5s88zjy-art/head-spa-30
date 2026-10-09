# BARBERSHOP 30 – mapa scén

Stránka je jeden dokument. Scény 1–3 a 7 sú **filmové** (prilepené javisko,
kamera riadená scrollom). Scény 4–6 sú **pokojné informačné plochy** v bežnom
toku. Percentá sú orientačné rozdelenie celkového `progress` na desktope; mobil
má kratšie filmové úseky (pozri posledný stĺpec).

Legenda: **A** = asset, **K** = kamera (pozícia → cieľ, vzdialenosť), **S** =
svetlo, **T** = text, **P** = prechod, **CTA**, **M** = mobil.

## Globálna štruktúra dokumentu

```
<header>  lišta: logo · Strihy/Služby · Tím · Miesto · Galéria · Kontakt · [Rezervovať]
<main>
  #uvod      (scéna 1) filmová, prilepené javisko, výška 180vh (mobil 140vh)
  #remeslo   (scéna 2) filmová, 180vh (mobil 130vh)
  #miesto    (scéna 3) filmová, 220vh (mobil 180vh)
  #tim       (scéna 4) tok
  #sluzby    (scéna 5) tok
  #galeria   (scéna 6) tok
  #rezervacia(scéna 7) filmová, 150vh (mobil 120vh)
<footer>
<canvas id="stage"> fixed, z-index 0, viditeľný v 1–2 a 7, inak opacity 0
<div id="poster"> fixed, rovnaký záber ako canvas; LCP; skryje sa po prvom 3D frame
<a class="mobile-cta">Rezervovať termín</a> fixed bottom, mobil
```

`progress` = scrollY / (document.scrollHeight − innerHeight). Každá filmová sekcia
má lokálny `t` = (scrollY − top) / (height − innerHeight), 0–1, orezaný.

## Kamera 3D kresla (kľúčové snímky podľa lokálneho t)

Súradnice v jednotkách scény; kreslo stojí na podlahe, stred sedadla ~ (0, 0.55, 0),
výška kresla ~ 1.6.

| scéna | t | pozícia kamery | cieľ | fov | key | rim | poznámka |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 | (-3.6, 1.55, 4.4) | (0.15, 0.72, 0) | 32 | 1.0 | 0.6 | trojštvrťový záber zľava spredu, kreslo vpravo od stredu (text vľavo) |
| 1 | 1.00 | (-2.6, 1.35, 3.3) | (0.15, 0.78, 0) | 32 | 1.0 | 0.9 | pomalý nájazd (dolly), rim silnie |
| 2 | 0.00 | (-2.6, 1.35, 3.3) | (0.15, 0.78, 0) | 32 | 1.0 | 0.9 | nadväzuje bez skoku |
| 2 | 0.55 | (1.3, 1.05, 1.9) | (0.62, 0.62, 0.35) | 30 | 1.1 | 1.0 | oblúk doprava k pravej opierke – mosadz + prešívaná koža |
| 2 | 0.80 | (1.15, 0.95, 1.55) | (0.66, 0.6, 0.38) | 28 | 1.15 | 1.0 | detail; tu sa cez obraz prelína fotografia reálneho kresla (zhoda tvaru: zlatá opierka) |
| 2 | 1.00 | drží | drží | 28 | 0.9 | 0.8 | canvas opacity → 0, fotografia preberá |
| 7 | 0.00 | (2.4, 1.3, 4.2) | (0, 0.75, 0) | 32 | 0.8 | 0.7 | návrat ku kreslu z opačnej strany (zrkadlový obraz scény 1) |
| 7 | 1.00 | (1.9, 1.15, 3.6) | (0, 0.78, 0) | 32 | 1.0 | 0.8 | ustálenie, svetlo sa upokojí, kurzorové svetlo stíši na 50 % |

Interpolácia medzi snímkami `smoothstep`. Mobil: kamera o 25 % ďalej (násobok
vzdialenosti 1.25) a cieľ o 0.15 vyššie, kreslo v spodnej polovici obrazovky.

## Scéna 1 – PRVÝ DOJEM (0–12 %) `#uvod`

- **A**: 3D kreslo (symbol) na priehľadnom canvase; poster `assets/img/poster-kreslo-*.avif`
  (vyrenderovaný z toho istého záberu). Pozadie CSS gradient `--ink` → `#1A1511`.
- **K**: viď tabuľka. Pri načítaní jednorazový 1.4 s prejazd hlavného svetla
  zľava doprava (časový, nie scrollový), ktorý odhalí kožu → kov → siluetu.
  Pri reduced‑motion sa nedeje.
- **S**: hlavné teplé zľava hore, rim oranžové sprava zozadu, kontaktný tieň.
- **T**: vľavo 5/12: eyebrow „BARBERSHOP 30 · NITRA“, H1 „Tvoj strih. Tvoje
  miesto.“, lead „Barbershop 30 v Nitre. Spoznaj náš tím, vyber si službu a
  rezervuj si svoj termín.“, tlačidlá. Text je v HTML od prvej milisekundy; nástup
  450 ms po `DOMContentLoaded` (nie po 3D).
- **P** do scény 2: text sa posunie o −24 px a stratí (300 ms), kamera pokračuje
  bez strihu. Dole vpravo chip „Scrolluj“ s 2 px linkou, zmizne po 2 % progressu.
- **CTA**: „Rezervovať termín“ (primárne), „Zavolať na recepciu“ (sekundárne,
  `tel:` – len s overeným číslom; bez neho vedie na #kontakt).
- **M**: text hore (od 96 px), kreslo v spodných 55 % obrazovky, kamera ďalej;
  tlačidlá pod sebou na plnú šírku; prejazd svetla kratší (1.0 s).

## Scéna 2 – REMESLO (12–28 %) `#remeslo`

- **A**: 3D detail opierky → fotografia **reálneho** kresla zblízka (zlatý rám,
  prešívaná koža; výber z inventára, scéna 2, `hero_fit ≥ 4`) → druhá fotografia
  nástrojov (sud s uterákmi, staré strojčeky, astronaut) alebo produktov na
  pracovnom stole. Ak chýba záber práce rúk, používa sa detail nástroja – shot list
  eviduje, že záber práce barbera treba nafotiť.
- **K**: oblúk doprava a nadol k opierke (t 0→0.8). Pri t 0.72–0.88 crossfade do
  fotografie so **zhodou tvaru**: zlatá opierka v 3D sedí v pravej tretine, na
  fotke rovnako (object‑position podľa inventára). Na t 0.88–1 canvas opacity 0.
- **S**: hlavné svetlo o 15 % silnejšie, rim na 1.0; v momente prelínania sa
  svetlo nehýbe (statický interval na prečítanie).
- **T**: vpravo dole (desktop) / dole (mobil): eyebrow „REMESLO“, H2 „Presnosť,
  ktorú vidíš v detaile.“, odsek (overené fakty o prístupe; bez vymyslených
  služieb). Text nastúpi na t 0.3, drží do t 0.95.
- **P** do scény 3: fotografia nástrojov sa zmenší na 0.96 a stmavne na 70 %,
  pod ňou sa odhalí prvá fotografia priestoru (match na zvislú líniu lampy).
- **CTA**: textový odkaz „Pozri služby →“ (#sluzby).
- **M**: kamera rovnaká, ale fotografia prelínania je v hornej polovici, text v dolnej.

## Scéna 3 – MIESTO (28–44 %) `#miesto`

- **A**: tri fotografie priestoru s **2.5D** spracovaním (dve vrstvy: pozadie
  scale 1.0→1.06, popredie‑maska jemný posun; označené v kóde ako `data-depth="2.5d"`):
  1) predná sála s recepciou (dlhý záber cez sálu), 2) hlavná sála s oranžovými
  lampami, 3) zadná miestnosť so zelenými sedačkami. Výber z inventára (scéna 3,
  `hero_fit ≥ 4`, `people_visible: nie`).
- **K**: žiadna 3D kamera; „kamera“ je crossfade + mierny dolly (scale) v CSS,
  riadený lokálnym t: fotka 1 t 0–0.36, fotka 2 t 0.3–0.7, fotka 3 t 0.64–1.
- **S**: podklad `--teal` presvitá cez okraje (vignette), chipy s názvom priestoru.
- **T**: vľavo hore: eyebrow „MIESTO“, H2 „Príď ako k známym.“, odsek o
  recepcii a komunite (tvrdenie „8 rokov“ iba v overenej formulácii – viď
  CONTENT_SOURCES), tri krátke riadky s chipmi: Recepcia · Hlavná sála ·
  Zadná miestnosť (popisné názvy, nie oficiálne).
- **P** do scény 4: posledná fotografia sa zastaví, javisko sa „odlepí“ a stránka
  prejde do bežného toku; plocha `--ink-2`.
- **CTA**: „Ako sa k nám dostaneš →“ (#kontakt).
- **M**: fotky orezané na výšku podľa ohniskového bodu; text dole nad spodným CTA.

## Scéna 4 – ĽUDIA (44–60 %) `#tim`

- **A**: autentické portréty tímu – **zatiaľ nie sú k dispozícii**. Sekcia má
  pripravenú mriežku (3 stĺpce desktop / 1 mobil), ale karty s menami sa
  vykreslia iba z overeného zoznamu (`data-required="team"`). Do nafotenia je
  viditeľný len úvodný text sekcie a odkaz na rezerváciu.
- **K**: pokojná; vstup kariet 450 ms zdola o 16 px pri vstupe do viewportu.
- **T**: eyebrow „ĽUDIA“, H2 „Tím barberov a barberiek.“, odsek (len overené).
- **CTA**: „Rezervovať u konkrétneho barbera“ len ak to rezervačný systém
  podporuje (inak „Rezervovať termín“).
- **M**: karty pod sebou, portrét 4:5.

## Scéna 5 – SLUŽBY A CENY (60–78 %) `#sluzby`

- **A**: žiadne veľké obrazy; jemná textúra pozadia (`--ink-2`), vlasové linky.
- **T**: eyebrow „SLUŽBY A CENY“, H2 „Vyber si službu.“, zoznam kariet: názov,
  opis, cena (s „od“ a podmienkami zo zdroja), trvanie, „Objednať“. Dáta len
  z overeného zdroja; inak sa zobrazí blok „Aktuálny cenník nájdeš v rezervácii“
  s odkazom (ak existuje) a karty ostanú skryté (`data-required="services"`).
- **CTA**: každá karta → rezervácia (s predvoľbou služby iba ak to systém podporuje).
- **M**: karty na plnú šírku, cena pod názvom.

## Scéna 6 – VÝSLEDKY A DÔVERA (78–90 %) `#galeria`

- **A**: galéria výsledkov strihov – **zatiaľ nie sú k dispozícii**. Do dodania
  galéria ukazuje detaily remesla a priestoru (nástroje, kreslo, neón, barber pole)
  – výber 6–8 fotiek z inventára (scéna 6), s lightboxom (klávesnica: Esc,
  šípky). Recenzie len doložené (odkaz na Google profil, ak je overený; žiadne
  vymyslené citácie ani hviezdičky bez zdroja). Školenia pod značkou: samostatná
  karta s odkazom iba po overení.
- **T**: eyebrow „VÝSLEDKY“, H2 „Práca, ktorá hovorí za nás.“
- **M**: mriežka 2 stĺpce, pomer 4:5.

## Scéna 7 – REZERVÁCIA (90–100 %) `#rezervacia`

- **A**: návrat 3D kresla (canvas opacity 0→1 na t 0–0.25) z opačného uhla,
  alebo pri reduced‑motion/zlyhaní WebGL fotografia vstupu (dvere s leptaným
  logom).
- **K**: viď tabuľka; kamera sa ustáli na t 0.6 a potom už stojí.
- **S**: svetlo sa upokojí; rim 0.8; kurzorové svetlo stíši.
- **T**: vľavo: eyebrow „REZERVÁCIA“, H2 „Tvoj termín je na jedno klepnutie.“,
  blok kontaktov (adresa, hodiny, telefón, navigácia – každý iba overený), tlačidlá.
- **CTA**: „Rezervovať termín“ (primárne, cieľ = overený rezervačný systém),
  „Zavolať na recepciu“, „Navigovať“ (mapa – iba s overenou adresou).
- **M**: text hore, kreslo dole; spodné plávajúce tlačidlo sa skryje (duplicita).

## Pätička

Názov podniku, adresa (overená), odkazy na sociálne siete (overené), odkaz na
sesterský Salón 30 / Head Spa 30 (ak majiteľ potvrdí), právne informácie
(prevádzkovateľ – `data-required="legal"`), odkaz „Späť hore“.

## Čo chýba (shot list) – viď `docs/SHOT_LIST.md`
