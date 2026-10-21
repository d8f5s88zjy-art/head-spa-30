# Požiadavky majiteľa pre ľahký telefón (21. 10. 2026, iPhone)

1. 07:03 UTC: „Na telefóne sú fotky a videá strašne zasekané, sú tam fotky neúplné a nie je to pekné. Chcem, aby ten web bol ľahký ako pierko a plynulý ako potôčik.“
   Snímky: majitel-iphone-film.png (scéna Čakáreň), majitel-iphone-paticka.png (lišta bez pozadia prekrýva text, pod pätičkou fotka ulice).
2. 07:12 UTC: „Na začiatku je čierna obrazovka.“
   Kritérium: na telefóne je prvý obraz hneď fotka z HTML (fasáda alebo rohožka), nikdy čierna plocha; žiadne čakanie na 3D vrstvu, prológ ani písmo.
   Overiť filmovým pásom prvých 3 s (Chromium, telefón 390×844 DPR3, CPU 4×, sieť Fast 4G aj pomalšia) pred a po.
   Stopy v kóde D1: prológ (trieda pro, index.html hlavička), preload len AVIF varianty, html.world-in skrýva zálohy po prvom snímku WebGL (style.css 506–510, film.js 1252).
   Snímka 07:13 UTC: majitel-iphone-cierny-start.png – viditeľná je len lišta (Barbershop 30, Hudba) a spodné tlačidlá (telefón, Rezervovať termín); fotka AJ nadpis úvodu chýbajú, celá plocha je čierna. Prológ (html.pro) teda skrýva aj text úvodu, kým nebeží film; na telefóne musí byť od prvého obrazu fotka aj nadpis „Tvoj strih. Tvoje miesto.“ a tlačidlá.
3. 09:45 UTC (moje pozorovanie pri snímaní pre majiteľa, commit 790c05c, lite): skok o ~5 000 px na kartu Služby (#h-sluzby) → snímka po 250 ms je CELÁ čierna vrátane lišty a spodných tlačidiel, po 1 000 ms je karta celá (ukazky/790c05c/skok/skok-spolu.jpg). Zaťaženie stroja 10 (4 jadrá), takže môže ísť o artefakt snímania; aj D1 s filmom má po skoku čiernu. Overiť pri skoku z menu bez súbežnej záťaže: lišta a fotka (alebo jej náhľad) viditeľné najneskôr v ďalšom snímku po skoku; ak je čierna aj bez záťaže, je to čierne okno a treba ho opraviť (napr. predkresliť cieľovú kartu pred skokom z menu).
4. 09:48 UTC: „Chcem, aby tie fotky bolo vidno tak dobre ako na PC.“ → ostrosť na telefóne nezhoršovať (L4a/L4b zamietnuté), riešiť aj výrez (na telefóne dnes len stredový výrez -m). Rozbor a prototypy: fotky-ako-pc/ (wf_ef28985d-af9).
