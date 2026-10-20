# 071 — Výkon a prístupnosť v praxi

## Obsah

1. Rozpočty a meranie
2. Diagnostika
3. Mobil
4. Prístupnosť pohybu
5. Funkčný fallback

## 1. Rozpočty a meranie

Zapíš cieľový používateľský scenár, zariadenie, sieť, cold/warm cache, viewport, build a nástroj. Odliš laboratórny test od dát reálnych používateľov. Core Web Vitals pracujú s LCP, INP a CLS; dobré prahy sú LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1, hodnotené na 75. percentile návštev príslušného súboru. Jedna lokálna návšteva tento stav nepreukazuje. S020.

Interný návrh rozpočtu musí uviesť limity pre kritický JS/CSS, úvodné médiá, odložené 3D, dekódovanú pamäť, render targets, draw calls a frametime. Neexistuje univerzálne číslo pre každý projekt. Dohodni hodnoty pred pridaním veľkých médií; pri prekročení zaznamenaj dôvod a opatrenie.

16,7 ms pri 60 Hz a 8,3 ms pri 120 Hz sú približné celkové intervaly snímok, nie celý dostupný čas pre JavaScript. Sleduj p95/p99 frame time, long tasks, latenciu vstupu a zahriatie zariadenia, ak to nástroj umožní. Nesľubuj FPS bez merania. Iný headless viewport nie je fyzický iPhone.

## 2. Diagnostika

Najprv odstráň efekt a porovnaj. Pri CPU bottlenecku hľadaj synchrónnu prácu, časté rerendery, layout thrashing a dekódovanie. Pri GPU skúšaj menej pixelov, passes, overdraw, shadow máp a vzoriek. Pri sieti analyzuj poradie requestov a kritický obsah. Pri pamäti porovnaj opakované vstupy/odchody a vlastníctvo resources.

Transform a opacity často znižujú layout/paint prácu, ale veľké vrstvy môžu byť stále nákladné. `will-change` nepridávaj plošne; použite ho po meraní a odstráň, keď už netreba. S021.

Prioritizuj skutočný LCP obrázok, rezervuj rozmery médií, nenačítavaj všetky galérie/sekvencie naraz. Oddeľ kritický obsah od dekoratívneho JS a využívaj lazy loading podľa kontextu. Neodkladaj hlavný obrázok iba preto, že všetky obrázky majú rovnakú komponentu.

## 3. Mobil

Navrhni samostatný focal point, orez a tok textu. Over menu, sticky prvky, virtuálnu klávesnicu, safe areas, dlhý obsah, orientáciu, zoom a touch. Ovládanie nesmie vyžadovať hover. Nepoužívaj povinnú horizontálnu jazdu pre základné informácie.

Čítanie a rezervácia fungujú aj pri nízkom výkone a obmedzených dátach. Zníženie dekorácie je lepšie než odstránenie informácie. Capability vetvu zakladaj na feature detection a meraní; user agent nie je spoľahlivý výkonový test.

## 4. Prístupnosť pohybu

Zvoľ relevantný cieľ prístupnosti a over konkrétne kritériá. WCAG 2.2 zahŕňa požiadavky na klávesnicu, fokus, kontrast, reflow, pomenovanie ovládania a ďalšie oblasti; samotný reduced-motion prepínač nie je zhoda s celou normou. S022.

Automaticky sa pohybujúci obsah, ktorý trvá viac než päť sekúnd a beží popri inom obsahu, má za podmienok SC 2.2.2 mechanizmus pause/stop/hide, s výnimkou nevyhnutného pohybu. Nie je správne skrátiť pravidlo na "každá animácia nad päť sekúnd je zakázaná". S023.

SC 2.3.3 Animation from Interactions je Level AAA. Rešpektovanie reduced motion zaraď ako vlastné pravidlo tejto produkcie aj pri inom cieľovom leveli. Pri vypnutí motion obmedz translácie, zoom a parallax; statický obsah ostáva zmysluplný. S024.

Vyhni sa stroboskopickým/glitch flash prechodom. SC 2.3.1 Level A používa hranicu viac než troch zábleskov za sekundu alebo limity veľkosti/intenzity; nerob laické vyhlásenie bezpečnosti podľa frekvencie jednej vrstvy. S025.

Modal musí mať zmysluplný fokus, návrat do kontextu, ovládanie zatvorenia a správne správanie klávesnice. Animovaná vrstva nesmie nechať fokus na neviditeľnom prvku. S026. Pri animovanej navigácii zachovaj názov stránky, stav a príslušný fokus; netrapuj klávesnicu v dekorácii.

## 5. Funkčný fallback

| Zlyhanie/podmienka | Očakávaný stav |
|---|---|
| JavaScript nedorazil | Čitateľný základ a skutočné odkazy |
| 3D nefunguje/stratil kontext | Poster, vysvetlenie produktu, dostupná akcia |
| Video odmietne autoplay | Poster a možnosť spustiť prehrávanie |
| Font zlyhá | Čitateľná náhrada bez rozbitého layoutu |
| Reduced motion sa zapne za behu | Prebiehajúca dekorácia skončí v použiteľnom stave |
| Časť médií chýba | Kontrolovaný placeholder bez vymyslenej informácie |
| Sieť/API zlyhá | Pravdivá chyba, možnosť retry bez duplikácie |

Testuj relevantné vetvy úmyselne, nie len úspešný screenshot. Nepoužívaj preloader ako náhradu za rýchly a robustný základ.

## Senior decision gate

- **Decision:** Protect the primary task while choosing visual cost.
- **Deliverable:** A usable mobile/reduced-motion/failure experience.
- **Verification:** Measure actual bottlenecks and inspect meaningful accessibility paths.
