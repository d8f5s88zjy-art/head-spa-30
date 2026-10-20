# 031 — Jazyk a plynulosť pohybu

## Obsah

1. Slovník
2. Päť vrstiev plynulosti
3. Čas a easing
4. Deterministické skrolovanie
5. Prerušenie a vlastníctvo

## 1. Slovník

| Pojem | Význam |
|---|---|
| Motion design | Pohyb, hierarchia a rytmus grafických prvkov |
| Interaction design | Správanie ovládania a systému na základe vstupu |
| VFX | Digitálne vytvorené alebo upravené vizuálne efekty |
| Compositing | Skladanie obrazu z vrstiev a renderovacích priechodov |
| Shader | Program pre spracovanie geometrie, pixelov či ďalších GPU úloh |
| Post-processing | Úprava už vyrenderovaného obrazu |
| Scrollytelling | Rozprávanie riadené postupom po stránke |
| Scrubbing | Priradenie progresu animácie k progresu vstupu |
| Pinning / sticky | Dočasné udržanie kompozície pri pokračujúcom obsahu |
| Parallax | Rozdielny pohyb vrstiev vytvárajúci hĺbku |
| FLIP | First, Last, Invert, Play; animovanie rozdielu layoutov |
| Shared element | Vizuálne zachovanie objektu medzi stavmi |
| Mask / matte | Oblasť určujúca viditeľnosť vrstvy |
| Displacement | Posun vzorkovania obrazu alebo geometrie pomocou poľa |
| Match cut | Strih spájajúci podobný tvar, pohyb alebo zvuk |
| Occlusion | Prechod skrytý za zakrývajúcim predmetom |
| Camera choreography | Priebeh polohy, orientácie a optiky kamery |
| Frame pacing | Pravidelnosť intervalov medzi snímkami |
| Progressive enhancement | Funkčný základ doplnený podporovaným efektom |

Opory: S001–S008, S010–S015, S030–S031. FX záznamy sú vlastné adaptačné recepty, nie získaný kód referenčných webov.

## 2. Päť vrstiev plynulosti

Priestorová kontinuita zachováva smer, mierku, perspektívu a bod záujmu. Časová kontinuita udržiava zmysluplnú rýchlosť aj pri rýchlom alebo opačnom vstupe. Vizuálna kontinuita zlaďuje expozíciu, farbu, ostrosť a svetlo. Výpočtová plynulosť vyžaduje pravidelné snímky bez blokovania layoutom, dekódovaním alebo GPU prácou. Interakčná kontinuita znamená rýchlu odozvu, správny fokus, históriu a prerušenie zastaranej požiadavky.

Smooth-scroll knižnica opravuje pocit vstupu, nie pomalé vykresľovanie. Priemerné FPS môže zakryť nepríjemné jednotlivé zaseknutia. Príčinu najprv zmeraj.

## 3. Čas a easing

Interné východiská na ladenie, nie normy: reakcia ovládania 100–200 ms, malý presun 180–320 ms, kompozícia 300–600 ms, výrazná scéna 600–1000 ms s možnosťou pokračovať. Čitateľnosť a odozva majú prednosť. Na potvrdenie kliknutia nečakaj do konca dekorácie.

Ease-out sa hodí pre príchod do pokoja, ease-in pre odchod a ease-in-out pre samostatnú cestu medzi bodmi. Pre scroll je často vhodné lineárne mapovanie. Silný easing v každom úseku scrubu môže vytvoriť nepredvídateľnú odozvu.

Spring opisuj hmotnosťou, tuhosťou, tlmením, počiatočnou rýchlosťou, prekmitom a ustálením. Hodnoty knižníc nemusia byť zameniteľné. Anticipation pripraví pohyb, overlap nechá prvok doznieť a stagger vedie pozornosť. Dlhý zoznam nesmie čakať sekundy na poslednú položku; obmedz celkové oneskorenie.

Pre časovo nezávislé dobiehanie použi napríklad `alpha = 1 - exp(-lambda * dt)`, `dt` v sekundách. Fixné `lerp(..., 0.1)` za frame závisí od obnovovacej frekvencie. Pri návrate z pozadia resetuj čas alebo obmedz simulačný krok. Dobiehanie nie je fyzikálny solver.

## 4. Deterministické skrolovanie

Oddeľ logický progres `clamp((scroll-start)/(end-start),0,1)` od voliteľne vyhladeného zobrazovaného progresu. Kamera, titulok a maska majú vychádzať z tej istej zobrazovanej hodnoty. Ak text potrebuje okamžitý presný stav, odstráň inertia celej scény alebo jednoznačne oddeľ dekoráciu.

Rozdeľ príbeh na pomenované intervaly a urč úplný stav každého z nich. Nespoliehaj sa iba na `onEnter`: pri skoku cez viac sekcií sa niektoré udalosti nemusia vykonať. Výpočet zo súčasného progresu funguje aj pri reload v polovici.

Trvanie scrubovaných častí určuje pomer vzdialenosti, nie garantované sekundy sledovania. Podstatná informácia nesmie existovať iba v úzkom bode. Znovu odmeraj geometriu po relevantnej zmene fontov, obrázkov a viewportu; drahý refresh nevolaj každý frame. Skontroluj sticky rodičov, overflow, transformovaných predkov a dlhý mobilný obsah. S001, S007.

## 5. Prerušenie a vlastníctvo

Jednu vlastnosť nech riadi jeden systém. CSS, GSAP a Motion nemajú súčasne prepisovať `transform` toho istého uzla. Pri nezávislých pohyboch oddeľ odôvodnené wrappers.

Zachyť aktuálny stav, ukonči starú animáciu a nadviaž bez skoku. DOM zmenu vykonaj presne raz; zlyhanie animácie nie je dôvod opakovať objednávku alebo navigačnú mutáciu. Cleanup odstráni vlastné listenery, observer, RAF, timeline a zdroje.

Zmenu `prefers-reduced-motion` rieš aj za behu: zruš dekoráciu a ponechaj použiteľný konečný stav. Osobitne ošetri autoplay rejection a background. S002, S005, S008, S027.

Vyber efekt až po vete vysvetľujúcej jeho úžitok. Prečítaj fallback a kontroly FX záznamu pred kódovaním. Znalosť názvu nie je dôkaz praktickej skúšky; rozsah overenia priložených receptov je v `assets/evidence/motion-evidence.md`.

## Senior decision gate

- **Decision:** Choose purposeful motion with one authority per changing property.
- **Deliverable:** A motion contract with interruption and fallback.
- **Verification:** Observe reverse input, preference change and cleanup.
