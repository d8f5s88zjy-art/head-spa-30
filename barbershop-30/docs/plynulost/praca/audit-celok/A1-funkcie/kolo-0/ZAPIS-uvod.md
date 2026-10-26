# A1 – Všetko funguje · kolo 0 · BARBERSHOP 30 (Nitra)

Nezávislý audítor funkcií. Strom `scratchpad/hs-skvrny` (vetva `barbershop-skvrny` z `2687b6e`) som bral len na čítanie;
prehliadačové kontroly bežali z kópie `A1-funkcie/kolo-0/tmp-strom/` (identická s `2687b6e`, `diff -rq` bez rozdielu
o 11:55 UTC) cez `python3 -I -m http.server` na portoch 8860–8862 a Chromium (Playwright, SwiftShader – softvérové WebGL,
bez GPU). Počítač 1440×900, telefón 390×844 DPR 3 s dotykom. Externé adresy sa v prehliadači nikdy nenačítali (route →
abort), overoval sa len tvar odkazov. Nič v strome som nemenil; počas auditu začal opravár čiernych škvŕn meniť
`assets/film.js` (12:23 UTC, `git status`: ` M barbershop-30/assets/film.js`, 39+/16−; záznam
`testy/zmeny-stromu-pocas-auditu.txt`) – kontroly filmu nižšie sú zo stavu `2687b6e` pred jeho úpravou.
