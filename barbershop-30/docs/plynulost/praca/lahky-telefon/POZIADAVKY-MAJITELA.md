# Požiadavky majiteľa pre ľahký telefón (21. 10. 2026, iPhone)

1. 07:03 UTC: „Na telefóne sú fotky a videá strašne zasekané, sú tam fotky neúplné a nie je to pekné. Chcem, aby ten web bol ľahký ako pierko a plynulý ako potôčik.“
   Snímky: majitel-iphone-film.png (scéna Čakáreň), majitel-iphone-paticka.png (lišta bez pozadia prekrýva text, pod pätičkou fotka ulice).
2. 07:12 UTC: „Na začiatku je čierna obrazovka.“
   Kritérium: na telefóne je prvý obraz hneď fotka z HTML (fasáda alebo rohožka), nikdy čierna plocha; žiadne čakanie na 3D vrstvu, prológ ani písmo.
   Overiť filmovým pásom prvých 3 s (Chromium, telefón 390×844 DPR3, CPU 4×, sieť Fast 4G aj pomalšia) pred a po.
   Stopy v kóde D1: prológ (trieda pro, index.html hlavička), preload len AVIF varianty, html.world-in skrýva zálohy po prvom snímku WebGL (style.css 506–510, film.js 1252).
   Snímka 07:13 UTC: majitel-iphone-cierny-start.png – viditeľná je len lišta (Barbershop 30, Hudba) a spodné tlačidlá (telefón, Rezervovať termín); fotka AJ nadpis úvodu chýbajú, celá plocha je čierna. Prológ (html.pro) teda skrýva aj text úvodu, kým nebeží film; na telefóne musí byť od prvého obrazu fotka aj nadpis „Tvoj strih. Tvoje miesto.“ a tlačidlá.
