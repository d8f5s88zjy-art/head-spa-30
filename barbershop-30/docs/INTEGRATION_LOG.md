# Záznam integrácie

## 2026‑10‑09 – prehliadka podniku + úvod ako film

1. Stavba: `assets/film.js` (film zo skutočných fotiek s hĺbkovými mapami, three r169) a
   stránka `index.html` s 9 scénami a 13 kotvami `.film-shot` podľa TOUR_DIRECTION; 3D kreslo,
   jeho model, postery a loadery odstránené.
2. Úvod ako film (požiadavka majiteľa podľa referencie s filmovým hero): nový záber `rohozka`
   (slider/3, 1920 px, hĺbka cez Depth Anything V2) ako záber úvodu; prológ `vstup` → `rohozka`
   v `film.js` (časová os, pohyb `door`, zastavenie pri dverách kým nie je úvod načítaný, ukončenie
   skrolovaním, 7 s limit); rozhodnutie v hlavičke (`html.pro`, sessionStorage `bs30uvod`,
   `?uvod=znova`); statická záloha úvodu z dvoch `<template>` podľa triedy `pro`.
3. Nálezy pri integrácii a opravy:
   - `assets/film.css` bol nepoužitý duplikát pravidiel v `style.css` – zmazaný;
   - dymový test hľadal zálohu úvodu podľa `[data-shot="vstup"]` – po zmene úvodu opravené na `#uvod`;
   - šero v strede prelínania bolo takmer čierne – zjemnené na asi 36 % jasu;
   - popis miesta vľavo dole sa pri úvode ukazuje pod doskou (neprekrýva ju) – ponechané.
4. Kontroly: CHECKS.md (dymový test, prológ, scény, váha). Snímky v `docs/screenshots/`.
5. Nasadenie: vetva `claude/head-spa-page-5yf2fw` → `main` (GitHub Pages head‑spa‑30,
   podpriečinok `/barbershop-30/`), po nasadení kontrola naživo.

Otvorené: fotka dverí zblízka od majiteľa (otvorenie krídla v prológu), mobilné výrezy záberov
na výšku pre ostrejší film na telefóne (`<meno>-m-*`), Lighthouse na verejnej adrese.
