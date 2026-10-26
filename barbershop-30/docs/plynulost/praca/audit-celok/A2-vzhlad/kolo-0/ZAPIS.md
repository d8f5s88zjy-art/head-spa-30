# AUDIT 2 – VZHĽAD BEZ CHÝB, kolo 0 (ROZPRACOVANÉ – priebežný zápis)

Stav: 26. 10. 2026, strom hs-skvrny @ 2687b6e (len na čítanie). Prechod index.html na všetkých 21 šírkach hotový;
rezervacia.html, en/, karta/, 404 a ďalšie kontroly (stavy, načítanie, jazyky, tmavý režim, karty-sonda, CLS, skok)
bežia – tento zápis sa dopĺňa. Stroj je súčasne zaťažený ďalšími kontrolami (load 10–28), časové merania sú orientačné.

Nástroje: nastroje/a2-vzhlad.cjs (prechod + kontroly DOM), a2-analyza.py (čierne polia, kontrast, hárky),
a2-suhrn.py (súhrn), a2-vyrez.py (výrezy na overenie okom), a2-pismo-dokaz.cjs, a2-retaz2.sh.
Snímky: A2-vzhlad/kolo-0/snimky/<stránka>/<šírka>/NN.jpg (+ ozn-NN.jpg s rámikmi), hárky A2-vzhlad/harky/,
výrezy na overenie A2-vzhlad/kolo-0/overenie/.

## Nálezy (zatiaľ index.html)

(zapíšu sa v konečnej verzii – pozri nižšie rozpracované body A2-1 … A2-9)

A2-1 vážna – hlavička na počítači: „Objednať sa" svetlý text na oranžovej (1,95:1). style.css:310 (.nav a) prebíja style.css:236.
A2-2 stredna – telefón na šírku: „Prejdi si podnik" cez hodnotenie/tlačidlo, nadpis pod hlavičkou (320 px), kicker cez menu (412/430 px). style.css:996-1001, 1137-1150.
A2-3 stredna – bublina asistenta zakrýva text pripnutej karty na telefóne. asistent.css:33-36, asistent.js:351-372.
A2-4 drobna – 320 px: ikona asistenta a spodná lišta sa prekrývajú o 8 px. style.css:1161-1163, asistent.css:13-14.
A2-5 vážna – po načítaní i18n.css prejde Manrope 700/800 (latinka) na systémové písmo. i18n.css:72 (váha „500 800"), fonts.css:48-52. Mechanizmus sa overuje (pismo/dokaz.json).
A2-6 stredna – štítok „AI": 9,6 px, kontrast 3,2:1; zmienka o AI (rozhodnutie majiteľa). asistent.css:7-10, 23; asistent.js:31.
A2-7 drobna – „NITRA" v logu nad fotkou 3,4–3,8:1. style.css:308.
A2-8 drobna – mäkké fotky: tím 820 px na 3× telefóne na šírku, naradie-noznice na l390, vstup-m na p412; zábery filmu na tabletoch (len záznam). index.html:317-319.
A2-9 záznam (film) – prázdne čierne pole pod pásom fotky medzi kartami (p320 krok 2), čierne okno po skoku kotvou (skok-sonda).
