# 010 — Výber nástrojov a schopností

| Úloha | Minimálna vhodná cesta | Kedy pridať nástroj | Obmedzenie |
|---|---|---|---|
| Výskum a zdroje | Oficiálne docs, autorove case studies, katalóg | Aktuálne správanie vyžaduje reálnu interakciu | Vyhľadávací popis nepreukazuje pozreté video |
| Rozbor videa | Dostupný player/analýza + časové pozorovania | Potreba reálnych snímok/rytmu | Zapíš, čo bolo skutočne prehrané |
| Art direction | Kontrakt, storyboard a typografický systém | Figma pri potrebe editovateľného dizajnu | Použi príslušný Figma skill pred operáciou |
| Nový vizuálny koncept | Dostupný image-generation nástroj | Výstup slúži ako koncept/ilustrácia | Nevydávaj ho za reálne priestory |
| Úprava autentických médií | Zodpovedajúci media/image skill | Korekcia, orez, export a kontrola zdroja | Dodrž dostupné schopnosti a práva |
| Bežný frontend motion | CSS/WAAPI alebo existujúca knižnica | GSAP/Motion rieši konkrétnu zložitosť | Jedna autorita na vlastnosť |
| 3D | Existujúci renderer, kvalitný model | Three/R3F/TSL podľa potreby | Kompatibilita a výkon sa overujú |
| Návrh filmového videa | Shot list + autentické médiá | Dostupný video nástroj/pre-render | Nepredstieraj vykonanie neprístupného nástroja |
| Sites projekt | Príslušný Sites skill a existujúci projekt | Celá implementácia a overenie | Nenahrádzaj autorizovanú úpravu samostatným mockupom |
| Commerce/platby | Príslušný provider skill a skutočné dáta | Konkrétne autorizované integračné kroky | Žiadny falošný checkout alebo úspech |
| QA | Build a podporované UI/browser nástroje | Cielené testy podľa rizika | Screenshot nie je behavior test |

Pred pridaním dependency skontroluj existujúce balíky, ich verzie a skutočný problém. Vyber najmenšiu sadu, ktorá ho vyrieši. Neinštaluj celý katalóg, nevyžaduj nový platený účet bez potreby a nespúšťaj cudzí skript len preto, že je v README.

Ak tool/skill chýba, over dostupné alternatívy. Označ náhradu: napríklad originálne HTML/CSS štúdie namiesto neprístupného 3D renderu. Názov aplikácie v promte neznamená, že bola použitá.

Pre filmové médiá použi špecializované dostupné skilly na audit zdrojov, reframe, rytmus, farby a export, keď úloha skutočne zahŕňa video. Tento webový skill ostáva riadiacim postupom; nevyžaduje pri každej úprave spustiť všetky skilly.

Pri malej úlohe oprav konkrétnu chybu a skonči po primeranom overení. Pri celom webe prejdi všetky relevantné fázy. Nové knižnice a nekonečné referencie nesmú byť náhradou za vykonanie práce.

## Senior decision gate

- **Decision:** Use existing purpose-built capabilities and verify actual availability.
- **Deliverable:** A justified tool path with a usable fallback.
- **Verification:** Check current APIs and never infer installation from a catalog entry.
