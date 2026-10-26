# Oprava 1 – filmová scéna bez čiernych škvŕn (BARBERSHOP 30)

Opravár: senior WebGL / three.js. Strom `scratchpad/hs-skvrny` (vetva `barbershop-skvrny`, z 2687b6e).
Commit **102c5ee** „Barbershop 30: filmová scéna bez čiernych škvŕn pri pohybe do hĺbky“ (lokálne, bez podpisov),
záplata `scratchpad/barber/cierne-skvrny/oprava.patch` (`git format-patch 2687b6e..HEAD`). Mení sa len
`barbershop-30/assets/film.js` (39 riadkov pridaných, 16 odstránených, z toho väčšina komentáre).
Všetky cesty nižšie sú relatívne k `scratchpad/barber/cierne-skvrny/`, výstupy tejto opravy sú v `oprava-1/`.

## 1. Čo spôsobovalo škvrny (potvrdené)

**A – alfa plátna = hĺbka (škvrny zo záznamu).** Shader záberu písal `gl_FragColor = vec4(c, vZ)` (film.js:358 v 2687b6e)
aj pri priamom kreslení na obrazovku. three.js r169 zakladá WebGL kontext **vždy s `alpha: true`** – jeho voľba
`alpha: false` len nečistí alfu (vendor/three.module.min.js: `alpha:!0,depth:r,stencil:s,…`; parameter `alpha:a=!1`).
Plátno tak malo v alfe hĺbku a prehliadač ho skladal so stránkou. Chromium skladá premultiplikovane
(rgb + podklad·(1 − a) ≈ rgb, lebo podklad `--ink` je skoro čierny) – nič nevidno. Safari pixel s alfou 0 ukáže ako
priehľadný → podklad stránky `#0e0d0c` = čierna škvrna presne tam, kde má hĺbková mapa **presnú nulu** (koniec
miestnosti, obloha). WebKit to má zdokumentované: bug 264081 (pixel s alfou 0 a RGB ≠ 0 je neplatná premultiplikovaná
farba, WebKit ho skladá podľa zariadenia rôzne), bug 181317 (skladanie `alpha:false`, opravené 2019).
Dôkazy K2 (D1–D4: tvar alfy 0 = tvar škvŕn, presná nula v mapách, čas objavenia po skončení strihu) aj K4 (montáž
`k4/zaznam-vs-reprodukcia.jpg`) sedia; môj hárok `pred-po.jpg` to ukazuje v rovnakých chvíľach ako záznam.

**B – nepokrytý okraj fotky v strihoch popredia** (film.js:1063–1066): rezerva okraja rátala s hĺbkou 0,6·uAmt, okraje
máp majú hĺbku až 1,0 → pri bočnom posune kamery sa blízky okraj fotky vtiahol do záberu a za ním ostal pás farby
čistenia, ktorý strih rozmazal cez obraz (kava→sud až 13,9 % obrazovky, cakaren→sala-rano 0,8 %). Vo všetkých
prehliadačoch; na zázname nie je (záznam končí skôr).

**C – telefón na výšku: strih popredia bral „predmet“ spod pásu fotky.** Fotka je v hornom páse plátna (PAS_B 0,56),
pod ním je farba čistenia. Zvislý strih popredia (cakaren→sala-rano, smer `rise`) natiahol cez obraz práve ten
spodok → plátno tmavé až na 96 % (K2 `pokus-telefon-popredie.log`, `telefon-popredie-pred-po.jpg`). Čierne okno
na telefóne pri každom prechode z čakárne.

## 2. Zmeny v `assets/film.js` (commit 102c5ee) a prečo

| # | zmena | kde | dôvod | cena |
|---|-------|-----|-------|------|
| A | priamy prechod píše alfu **1**: `gl_FragColor = vec4(c, uVig.w > 0.5 ? 1.0 : vZ)` | FRAG (film.js:371) | alfa = hĺbka má zmysel len v textúre prechodu (prelínanie a strih popredia ju čítajú z rtA/rtB, kam sa kreslí s `uVig.w = 0`); na obrazovke nikdy | 1 výber vo fragment shaderi |
| P1 | **vlastný WebGL2 kontext s `alpha: false`** odovzdaný three.js cez `context` | film.js:310–320 | plátno bez alfy je nepriehľadné vždy, nech shader zapíše do alfy čokoľvek – poistka aj pre neznámu príčinu v Safari; three.js inak alfu plátna vždy zapne | žiadna (nepriehľadná vrstva sa skladá lacnejšie) |
| B | okraj fotky bez hĺbky: `vec2 e = min(uv, 1.0 - uv); z *= smoothstep(0.0, 0.03, min(e.x, e.y));` | VERT (film.js:352) | krajné 3 % fotky ostávajú na rovine steny, strih ich nevtiahne do záberu; okno v pokoji je od okraja fotky ≥ 4,8 % (presah OVER 0,12 mínus pohyb oka), preto sa obraz v pokoji nemení | 4 inštrukcie na vrchol |
| C | strih popredia počíta v páse fotky: uniform `uB` (= `band`, 1 na počítači), súradnice `vb`/`fb`, `lead` namiesto `uLead`, vzorka `ps.y` späť do plátna a nie pod pás (s rezervou rozmazania úrovne `lo`) | post shader (film.js:919–937), JS film.js:1194 | predmet aj jeho let sa rátajú v páse, spod pásu sa nič nevzorkuje; na počítači `uB = 1` → identický výpočet | pár inštrukcií len počas strihu popredia |
| P2 | mriežka záberu `side: THREE.DoubleSide` | film.js:428 | keby sa trojuholník na hrane hĺbky pri silnom posune preklopil, nakreslí sa (kúsok fotky), nie diera vo farbe čistenia | žiadna (bežne sú všetky trojuholníky lícne, culling nič nešetril) |
| P3 | pri `webglcontextlost` sa zloží `world-in` (zálohy `.film-still` sa ukážu), `shown = drawn = false`; po obnove sa `world-in` vráti s prvým novým snímkom | film.js:1475 | strata grafiky (iPhone pri nedostatku pamäte) dávala tmavé okno s textom; teraz je pod textom statická fotka | žiadna |

Nezmenené: RGB shaderov, vinetácia, hĺbka (uAmt), pohyb kamery, strihy, farba čistenia, nahrávanie fotiek.

## 3. Overenie

### 3.1 K2 – statická kontrola (`nastroje/k2-staticka.mjs`)
`oprava-1/k2/k2-staticka-po.txt`: **0 CHYBA**, 8 POZOR, 13 OK, kód 0 (PRED `k2-staticka-pred.txt`: 5 CHYBA).
K2-01 priamy prechod alfa 1 ✔, K2-05 DoubleSide ✔, K2-12 poistka okraja ✔, K2-13 strih popredia v páse ✔.
Zostávajúce POZOR sú riziká mimo škvŕn (video bez plagátu K2-07b, zmena veľkosti okna K2-08c) alebo už ošetrené
poistkou P1 (K2-03, K2-10, K2-11).

### 3.2 K4 – reprodukcia chvíľ zo záznamu (`nastroje/k4-reprodukcia.cjs`, HEAD, 1350 × 960, SwiftShader)
DOPLNIT_K4

### 3.3 K1 – detektor škvŕn pri skrolovaní (`nastroje/k1-detektor.cjs`, HEAD)
DOPLNIT_K1

### 3.4 K3 – simulácia hĺbkových máp (`nastroje/k3-simulacia.py`, kópia `oprava-1/nastroje/k3-simulacia-oprava.py`)
DOPLNIT_K3

### 3.5 Vlastné snímky (oprava-1/nastroje/op-predpo.cjs)
Plátno sa číta surovo (`readPixels`) a skladá ako Safari (alfa 0 = podklad). Kontext sa zakladá s `alpha: true`
v oboch verziách, takže PO sa testuje aj bez poistky P1 (len oprava A):

| chvíľa (ako na zázname) | PRED alfa 0 | PO alfa 0 |
|---|---|---|
| sala t 0,5 (záznam 7,47 s) | 3,26 % | 0,00 % |
| stol t 0,5 (10,97 s, kontrola) | 0,00 % | 0,00 % |
| cakaren t 0,5 (14,53 s) | 7,05 % | 0,00 % |
| sala-rano t 0,65 (18,63 s) | 4,08 % | 0,00 % |

(`oprava-1/harok/pred/stavy.json`, `oprava-1/harok/po/stavy.json`). Video: DOPLNIT_VIDEO. Telefón: DOPLNIT_TELEFON.

## 4. Cena (rAF pri CPU 4×, SwiftShader)
DOPLNIT_VYKON

## 5. Pre majiteľa
- `pred-po.jpg` – rovnaké chvíle ako na jeho zázname: záznam | PRED | PO (vľavo čierne tvary, vpravo nič).
- `pred-po.mp4` – skrol filmovou scénou ako na zázname, vľavo PRED, vpravo PO, s podielom priehľadných pixelov.
- `pred-po-telefon.jpg` – strih popredia na telefóne (čierne okno PRED, obraz PO).

## 6. Čo ostáva / riziká
DOPLNIT_RIZIKA
