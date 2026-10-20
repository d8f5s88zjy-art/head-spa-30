# 041 — Kamera a príprava 3D scény

## Obsah

1. Médium a optika
2. Cesta kamery
3. Modely a materiály
4. Runtime
5. Video a sekvencie

## 1. Médium a optika

Statický obraz použi pre jeden presvedčivý stav, video pre pevnú filmovú cestu, sekvenciu pre riadené obrazové fázy a realtime 3D pre skutočnú manipuláciu. Fotorealistický film nemusí byť runtime render. Každá možnosť potrebuje semantic DOM a náhradný stav.

| Pohyb | Čo sa mení | Riziko |
|---|---|---|
| Dolly in/out | Poloha kamery k predmetu | Kolízia/prechod cez mesh |
| Truck / pedestal | Bočný/zvislý presun kamery | Strata orientácie a predmetu |
| Pan / tilt | Orientácia pri pevnej polohe | Závrat pri veľkých uhloch |
| Orbit | Kamera obchádza subjekt | Nerealistická os a zakrytie dôležitej strany |
| Zoom | Zorné pole/ohnisková vzdialenosť | Plošný dojem bez zmeny perspektívneho stanoviska |
| Dolly zoom | Zámerne spojená zmena polohy a optiky | Silný vestibulárny účinok |
| Rack focus | Rovina zaostrenia | Čitateľnosť a náklady DOF |

Dolly nie je zoom: zmena stanoviska mení perspektívne vzťahy. Rozhodni perspektívnu alebo ortografickú kameru podľa účelu. Nepoužívaj extrémne wide-angle skreslenie tvárí ani produktov, ak skresľuje skutočný tvar. S032 je iba vyhľadávací náhľad dokumentácie Blender, nie overený celý návod.

## 2. Cesta kamery

Zapíš normalizovaný interval, polohu, cieľ/orientáciu, zorné pole, viditeľný obsah, vrstvu popredia, fallback a stabilný bod. `shot-plan.json` obsahuje fiktívnu ukážku; čísla nie sú získané z cudzieho webu.

Interpoluj polohu a orientáciu vedome. Pri rotácii sa vyhni nekontrolovanému Euler wrap; podľa potreby použi kvaterniónovú interpoláciu a vhodný up vector. Cieľ nesmie splynúť s polohou kamery. Pri spline sleduj nerovnomernú rýchlosť, ostré tangenty a neželaný roll; ak treba, parametrizuj cestu vzdialenosťou.

Mobil môže potrebovať inú cestu a framing, nie len menší canvas. Over predmet aj text pri horizontálnom a vertikálnom zobrazení. Cesta nesmie vyžadovať hover. Ovládanie orbitu potrebuje limity, návrat a zmysluplný touch režim bez blokovania hlavného skrolovania.

## 3. Modely a materiály

Pipeline: originálny model → overené jednotky/orientácia/pivot → čistá topológia a UV → materiály → baked dáta podľa potreby → glTF/GLB export → samostatný náhľad → optimalizácia → kontrola rozdielu → integrácia.

Inventár: počet objektov a materiálov, rozmery, bounding box, skryté časti, animácie, morph targets, textúry, práva, decoder závislosti. Neodstraňuj údaje, ktoré potrebuje variantový systém. Optimalizácia bez vizuálneho porovnania môže poškodiť produkt.

glTF Transform umožňuje kontrolu a transformácie modelu. Zvoľ deduplikáciu, pruning, mesh kompresiu alebo textúrové úpravy až po určení cieľového loadera a decoderov. Príkaz najprv over cez aktuálne CLI; nepoužívaj slepú "optimize everything" pipeline. S016.

Komprimovaný prenos nie je to isté ako GPU pamäť. PNG/JPEG sa pri použití dekódujú; KTX2/Basis postup má vlastné kompatibilitné podmienky. Zmenšuj rozlíšenie podľa skutočnej obrazovej veľkosti. Pri normal/roughness/Occlusion zachovaj interpretáciu dát. S010, S013.

Pre materiál over roughness, metalness, normal, scale a svetlo. Fyzikálne chybný kov alebo plast nevyrieši bloom. Skús svetelné prostredie, key/fill/rim a tieň pred drahými realtime odrazmi. HDRI musí mať vhodné práva a pamäťový rozpočet.

## 4. Runtime

V React Three Fiber používaj frame loop pre rýchle zmeny a nere-renderuj React stav každú snímku. Mutuj iba vlastnené referencie, znovu používaj dočasné objekty a používaj delta time pre časový pohyb. S014.

Statické scény môžu vykresľovať na požiadanie; pri mutácii mimo Reactu treba invalidáciu. Animujúca scéna nemôže bez ďalšej logiky používať on-demand režim a očakávať nové snímky. S015.

Jedna trvalá scéna môže ušetriť opakovaný setup, ale nie je povinná pre každý web. Rozhodni scope canvasu, lifetime modelov, offscreen stop a chovanie pri route zmene. Bounded DPR, instancing, menej shadow maps a lokálny post-processing sú možnosti na meranie, nie univerzálne čísla zaručujúce výkon.

## 5. Video a sekvencie

Video hero potrebuje poster, rozmery, mobilný orez, kontrolu prehrávania a riešenie odmietnutého autoplay. Stav UI aktualizuj podľa výsledku `play()`, nie iba podľa želania prehrávať. S027. Reduced motion môže použiť poster; zvuk vyžaduje vedomé zapnutie.

Pri scroll videu ber do úvahy seek latenciu, keyframe vzdialenosť a podporu kodeku. Nevyžaduj presnú novú snímku pri každom scroll evente bez merania. Obrazová sekvencia potrebuje bounded cache, pripravené dekódované susedné snímky a fallback pri chýbajúcom frame; nenačítavaj stovky veľkých obrázkov naraz.

Porovnaj export s originálom pri skutočnej zobrazovacej veľkosti. Tvrdenie o ostrosti alebo frame rate má vychádzať z konkrétneho merania. S033 opisuje compositor iba na úrovni vyhľadávacieho náhľadu; nejde o vykonanú Blender produkciu.

## Senior decision gate

- **Decision:** Choose the least costly medium that gives the needed control.
- **Deliverable:** Shot plan, asset requirements and renderer assumptions.
- **Verification:** Inspect subject framing, path continuity and mobile alternatives.
