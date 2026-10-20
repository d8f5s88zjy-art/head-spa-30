# 082 — Revízia a diagnostika

## Obsah

1. Kontrolné body
2. Matica zlyhaní
3. Prijatie a odovzdanie
4. Učenie zo skutočného výsledku

## 1. Kontrolné body

Kontroluj začiatok, každý stabilný beat, prechod, koniec a opačný smer. Skús rýchly preskok, refresh v polovici, priamy anchor, históriu späť, resize, dlhý text, vypnutý motion a zlyhanie assetu. Pri opakovaných interakciách sleduj rast listenerov a zdrojov.

Vizuálne skontroluj celý web v zmenšenom prehľade aj v skutočnej veľkosti: rytmus, opakovanie, crop, baseline, kontrast, hierarchiu, vedľajšie akcie a footer. Pekný hero nie je dôkaz dokončenej stránky.

Pri QA rozlišuj build, test čistých funkcií, mock kontraktov, browser behavior, vizuálnu kontrolu, emulovaný mobil a fyzické zariadenie. Do výsledku zapíš presne tie, ktoré prebehli. `acceptance-matrix.csv` poskytuje štruktúru.

## 2. Matica zlyhaní

| Príznak | Pravdepodobná príčina na overenie | Najmenšia zmysluplná oprava |
|---|---|---|
| Stránka pôsobí ako prezentácia | Rovnaké bloky, slabá mediálna kontinuita | Zmeniť rytmus a obsahové väzby |
| Animácie trhajú | Main-thread, GPU, dekódovanie alebo layout | Profilovať a odstrániť konkrétnu nákladnú prácu |
| Kamera a text nesedia | Viac rôznych progress zdrojov | Jeden zobrazený progres |
| Reload ukáže zlú scénu | Stav odvodený len z udalostí | Priamy výpočet zo vstupu |
| Kliknutie dvakrát pokazí UI | Nezrušená animácia alebo duplicitný commit | Zachytiť stav, zrušiť staré, commit raz |
| Mobil je nepoužiteľný | Zmenšený desktop, pin nad výšku viewportu | Samostatná kompozícia a tok |
| Obraz je vyblednutý/tmavý | Chybná color conversion alebo materiál | Overiť pipeline pred gradingom |
| Pamäť rastie pri navigácii | Neuvoľnené vlastnené resources | Scope lifecycle a cleanup |
| CTA nefunguje pri chybe canvasu | Funkcia závisí od dekorácie | Samostatný DOM flow |
| Efekty pôsobia lacno | Slabé podklady a priveľa mechanizmov | Opraviť kompozíciu a zúžiť slovník |

Diagnóza je hypotéza, kým ju neoveríš. Zmeň jednu rozhodujúcu vec a porovnaj. Neopakuj celé testovanie, ak ostala len drobná reverzibilná úprava bez dopadu na ostatné cesty.

## 3. Prijatie a odovzdanie

Blokujúce chyby: nefunkčná hlavná cesta, nepravdivý obsah, strata dát, zásadná nedostupnosť, rozbitý mobil, neopravené bezpečnostné riziko relevantné pre scope. Kozmetická kvalita tieto chyby nevykompenzuje.

Odovzdaj stav implementácie, prečo pomáha, dôkazy kontroly, známe obmedzenia a ďalší konkrétny krok len tam, kde je potrebný. Neuvádzaj univerzálne "100 % tested". Hodnotenie estetiky odliš od merateľného výkonu a obchodného výsledku.

## 4. Učenie zo skutočného výsledku

Záznam zlepšenia obsahuje zadanie, pozorovanú chybu, hypotézu príčiny, zmenu, výsledok porovnania a podmienky platnosti. Pravidlo zovšeobecni až po dôkaze. Jedna nevydarená generácia nepreukazuje, že nástroj je zlý; jedna dobrá skúška nepreukazuje všetky zariadenia.

Ulož konkrétny pracovný postup, nie tvrdenie o trénovaní modelu. Pri rozšírení skillu zachovaj kredity, aktualizuj evidenciu a otestuj vyhľadávanie/príklady. Praktická skúška nového projektu má väčšiu hodnotu než ďalší neoverený zoznam nástrojov.

## Senior decision gate

- **Decision:** Isolate the cause of the most consequential observed failure.
- **Deliverable:** A reproducible diagnosis and correction.
- **Verification:** Recheck the affected path rather than broadening tests without a reason.
