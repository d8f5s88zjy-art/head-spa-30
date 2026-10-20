# 042 — VFX a compositing

## Obsah

1. Výber pipeline
2. Farby a svetlo
3. Efekty a ich cena
4. Postup shaderu
5. Stabilita a degradácia

## 1. Výber pipeline

Rozlišuj geometriu/material, osvetlenie scény, post-processing renderovaného obrazu a DOM vrstvu. Filmová nálada môže vzniknúť dobrým svetlom a médiom bez ďalšieho efektu. VFX vyber pre konkrétny obrazový zámer.

Pre WebGL v Three.js sa používa napríklad EffectComposer a vhodné passes; pre WebGPURenderer má Three.js vlastný uzlový/TSL postup. Aktuálna dokumentácia používa RenderPipeline, zatiaľ čo starší názov PostProcessing je označený ako premenovaný/deprecated. Over nainštalovanú revíziu. Nemiešaj WebGL ShaderMaterial/GLSL, TSL a príklady cudzej knižnice ako zameniteľné moduly. S011, S012, S017, S034.

WebGPU schopnosť prehliadača nie je dôkaz kompatibility celého efektového reťazca. Over konkrétne rozšírenia, textúrové formáty, renderer, materiály a zariadenia. Priprav statický alebo jednoduchší základ.

## 2. Farby a svetlo

Rozlišuj farebné mapy od dátových textúr. Pri bežnom Three.js workflow majú albedo/emissive obrázky príslušnú sRGB anotáciu, zatiaľ čo normal/roughness mapy sa nemajú interpretovať ako farebný sRGB obrázok. Výpočty svetla prebiehajú v lineárnom priestore a výstup potrebuje správny display transform. Konverzia aplikovaná dvakrát vytvorí chybný obraz. S010.

Stanov základnú expozíciu a kontrast pred gradingom. Oddeľ HDR informáciu od finálneho výstupu. Tone mapping komprimuje svetelný rozsah; grading mení vzhľad. LUT nenahrádza správne vstupy. Poradie efektov navrhni podľa ich požadovaného vstupného priestoru; niektoré filtre sa vykonávajú pred výstupnou konverziou a iné po nej. Over dokumentáciu použitej pipeline. S011–S012.

DOM text drž mimo bloom/blur/chromatic aberration. Testuj zhodu DOM farieb a canvasu na referenčných vzorkách. Pri exportovanom videu porovnaj poster a prvú snímku; nesúlad farieb môže pokaziť plynulý nábeh.

## 3. Efekty a ich cena

| Rodina | Účinok | Hlavné riziko | Jednoduchšia náhrada |
|---|---|---|---|
| Bloom / glow | Mäkká žiara jasných častí | Prepal, strata kontrastu, extra passes | Emissive akcent alebo pripravená žiara |
| Depth of field / bokeh | Optické oddelenie hĺbky | Drahé vzorkovanie, halo na hranách | Ostrý subjekt s vopred rozostreným pozadím |
| Motion blur | Dojem časovej integrácie pohybu | Ghosting, nečitateľnosť, velocity buffers | Plynulá krátka transformácia |
| Fog / atmospheric perspective | Hĺbka cez vzdialenosť | Zahmlenie kľúčového objektu | Jednoduchá hĺbková hmla |
| Volumetric light / god rays | Svetlo v objeme | Raymarching/sampling náklady | Baked svetelná vrstva |
| Particles | Prach, iskry, vzduch, stopa | Overdraw a fill rate | Menej bodov, menšia plocha |
| Refraction / transmission | Sklo, tekutina | Offscreen render, poradie transparentnosti | Jednoduchší materiál alebo video |
| SSR / SSAO | Odrazy a kontaktná hĺbka | Artefakty mimo obrazu, extra buffers | Environment map a baked AO |
| Noise / grain | Jemná materiálovosť | Kompresný šum, blikanie | Statická slabá textúra |
| Chromatic aberration | Rozchod farebných kanálov | Mäkký obraz a únava | Odstrániť alebo použiť lokálne |
| Displacement / distortion | Materiálová deformácia | UV okraje, strata rozpoznateľnosti | Maska alebo crossfade |
| Glitch / scanline | Zámerný digitálny charakter | Rušenie, blikajúce plochy | Jednorazový mierny posun bez flash |

Cena závisí od rozlíšenia, počtu vzoriek, transparentných vrstiev, formátu bufferov, počtu passes a zariadenia. Počet polygonov sám nevysvetľuje výkon. Pri testovaní vypínaj efekty jednotlivo a meraj zmenu. Ide o vlastné praktické pravidlá nad mechanizmami S011–S015; nie benchmark všetkých efektov.

## 4. Postup shaderu

1. Napíš účel, vstupy a garantované koncové stavy.
2. Začni statickým shaderom so správnym aspect ratio a súradnicami.
3. Pridaj jeden parameter progresu; animácia musí ísť dopredu aj dozadu.
4. Definuj jednotky času, rozsah uniformov, clamp a seed.
5. Obmedz slučky, vzorkovanie textúr a presnosť na odôvodnenú potrebu.
6. Skontroluj alpha blending, premultiplied alpha a okraje.
7. Pridaj farby a post-processing až po overení geometrie a UV.
8. Otestuj resize, nulový rozmer, zlyhanie textúry a stratu kontextu.

Pseudokód bezpečných koncov displacement: `envelope = sin(pi * p)`; pri p=0 a p=1 je posun nulový. Samotná interpolácia `mix(A,B,p)` má vrátiť presne zodpovedajúci vstupný obraz. Tento vzťah neurčuje správny color space ani aspect ratio; tie vyrieš samostatne. Neoznačuj pseudokód ako skompilovaný shader.

Pri SDF oddeľ vzdialenosť od farby a nastav konečný počet krokov, maximálnu vzdialenosť a hit epsilon. Pri fluids alebo GPU particles urč pamäťový rozpočet a číselnú stabilitu; zjednoduš parameter alebo použi pripravenú animáciu, ak simulácia neprináša interakčný úžitok.

## 5. Stabilita a degradácia

Použi stupne kvality: plná scéna → menej passes/nižšie rozlíšenie → jednoduchý materiál → poster. Nemeň stupeň pri každej snímke; použite hysteréziu a kontrolované prechody. Detekcia platformy nenahrádza meranie a preference používateľa.

Uvoľňuj iba zdroje, ktoré komponenta vlastní. Zdieľané materiály/textúry potrebujú dohodnuté vlastníctvo, inak unmount jednej sekcie poškodí druhú. Reuse znižuje alokácie; samostatné `dispose()` má byť súčasťou lifecycle. S013.

Nikdy nenahrádzaj bežnú chybu agresívnym blikajúcim efektom. Stroboskopické prechody vynechaj. Prístupnosť posudzuj podľa celej scény, nie iba podľa nastavenia jednej knižnice.

## Senior decision gate

- **Decision:** Select a compatible renderer pipeline and justify each pass.
- **Deliverable:** Bounded effect chain with controllable quality.
- **Verification:** Check color output, overdraw, context failure and no-effect baseline.
