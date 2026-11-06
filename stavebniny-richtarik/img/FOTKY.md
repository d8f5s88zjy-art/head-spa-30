# Fotografie

Fotografie z Pexels (licencia Pexels, voľné aj na komerčné použitie). Po nafotení predajne ich stačí nahradiť pod rovnakým názvom.

- hero: https://www.pexels.com/photo/32865462/
- sklad: https://www.pexels.com/photo/36003985/
- tehla: https://www.pexels.com/photo/39370865/
- strecha: https://www.pexels.com/photo/39279728/
- cement: https://www.pexels.com/photo/29817952/
- izolacia: https://www.pexels.com/photo/6124239/
- rezivo: https://www.pexels.com/photo/12278574/
- komin: https://www.pexels.com/photo/20181619/
- dlazba: https://www.pexels.com/photo/17366769/
- naradie: https://www.pexels.com/photo/7484795/
- okna: https://www.pexels.com/photo/18513458/
- sadrokarton: https://www.pexels.com/photo/27728636/
- fasada: https://www.pexels.com/photo/4612381/
- farby: https://www.pexels.com/photo/6920160/
- nakladka: https://www.pexels.com/photo/5920561/
- predajna: https://www.pexels.com/photo/10284048/
- zahrada: https://www.pexels.com/photo/38220910/
- dvere: https://www.pexels.com/photo/31620051/
- hutny: https://www.pexels.com/photo/37426459/


Doplnené fotky (Pexels, voľná licencia): murar.webp (30081237), strecha-praca.webp (11467876), vzv.webp (18699604), stavba.webp (39494022), beton.webp (37121400), tehly-ruky.webp (19688828).

Strešné okná (hlavičky katalógu Strešné okná, Fakro, Fakro schody a výlezy, akcií Okná a schody Fakro, Strešné okná Rooflite):
`img/hd/okno-strecha.webp` 2400 px, `okno-strecha-1200.webp` a dlaždica `img/okno-strecha.webp` 900×600 – https://www.pexels.com/photo/233267/
(svetlá strecha, otvorené strešné okno); nahrádza tmavú fotku `okna` (hlavičky, dlaždica Strešné okná na úvode a v Katalógu,
karta Velux). Súbory `okna` ostávajú v repozitári, do balíka nejdú.

## Skutočné fotky dvora (`img/uvod/`, od majiteľa)

Originály má majiteľ; v repozitári sú len webové veľkosti. Nič sa do fotiek nepridáva ani z nich neuberá (žiadne
dokreslené palety ani tovar, žiadne generatívne nástroje).

**Elegantná fotografická úprava (6. 11. 2026, na žiadosť majiteľa „Uprav tie fotky, nech to vyzerá elegantne“):** všetkých
59 súborov dvora a zásob (`img/uvod/*`, `img/uvod/hlavicka/*`, `img/og-dvor.jpg`) má jednotný svetlý tón: vyváženie bielej,
expozícia, tiene, svetlá, kontrast, sýtosť, jemný odšum a doostrenie, pri `dvor-p`, `dvor-t`, `og-dvor` a `pas-dvor` aj
vyrovnanie horizontu (otočenie o 0,8 až 1°, pri `pas-dvor` aj zvislice) a orez. Zdroj je vždy neupravená verzia
(`dvor-*` a `og-dvor` z `u4` v `44aa237b^`, ostatné z `bb6bbaeb`), nič sa nezväčšovalo. Parametre, nástroje a merania
(jas, tmavé plochy, farby tovaru, ostrosť) sú v pracovnom priečinku úpravy fotiek (`fotky/MANIFEST.txt`, `fotky/ZAPIS.md`,
`fotky/nastroje/uprav.py`, `fotky/nasadenie/nastroje/`), nie v balíku webu.
Po vyrovnaní horizontu majú dva súbory menej pixelov, než hovorí názov (názov ostáva kvôli odkazom): `dvor-t-1448`
1420 × 1530 a `pas-dvor-1920` 1848 × 1040; v `srcset` je ich skutočná šírka (`1420w`, `1848w`), v `build.py`
`UVOD_FOTO['pas-dvor']` skutočný rozmer.

- `dvor-p-1290|1720` (na šírku) a `dvor-t-1086|1448` (na výšku): hlavný obraz úvodu. Výrez fotky dvora `u4`
  (`u4-p-1920` a `u4-t-1448` v stave `44aa237b^`, do repozitára pridané v `bb6bbaeb`): na šírku x 0–1720, y 220–1080
  bez pravého okraja, kde stojí auto firmy; na výšku y 300–1860. Na úvode nie je žiadne auto.
- `img/og-dvor.jpg` (1200 × 630): obrázok pri zdieľaní (og:image a JSON-LD `image` na všetkých stránkach), výrez tej
  istej fotky `u4-p-1920` (x 0–1720), bez auta.
- `pas-dvor`, `dvor-predajna`, `zasoba-porfix` (všetkých 20 súborov, AVIF aj WebP): 5. 11. 2026 vrátené na neupravené
  verzie zo stavu `bb6bbaeb`. Upravené verzie s generatívne doplnenými paletami vznikli v `6d285c37` („doplnený tovar“)
  a ďalej sa menili v `b46c7d43` a `6bffd83e` (ten stav mal web až do `4b2646bf`); plné zásoby sa nesmú dokazovať
  upravenou fotkou. V strome nie je žiadny súbor s md5 niektorej z 54 upravených verzií. Na Porfixe je teraz vidieť prázdnu a načatú paletu a modré plachty.
- `zasoba-tehly`, `zasoba-stadreko`, `zasoba-rezivo`: zábery strihu na úvode a pás „Na našom dvore v Nitre“, obsah bez
  zmeny (len fotografická úprava vyššie).
- Úvodné video s nákladným autom (vyrobené z vygenerovaného klipu) a jeho obrázok pri zdieľaní boli 5. 11. 2026 na
  žiadosť majiteľa odstránené zo stromu aj zo všetkých stránok.

Ostré verzie ilustračných fotiek Pexels (2400 px a 1200 px) sú v `img/hd/` a používajú sa v hlavičkách podstránok
a v dlaždiciach kategórií (aj na úvodnej stránke v časti Katalóg), nikdy v úvodnom obraze ani v strihu zásob. Dlaždice
ostávajú 900 px.

