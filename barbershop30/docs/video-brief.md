# BARBERSHOP 30 — produkčný brief úvodného videa

Vyplnená šablóna `google-video-production-brief` z balíka Max Studio Ultra X 6.0.
Vyplnené sú len overené fakty. Čo overené nie je, je označené ako `CHÝBA`.

Projekt: úvodné video na web barbershop30 (`/barbershop30/`)
Vlastník: prevádzka BARBERSHOP 30, Mostná 226/30, Nitra
Publikum: muži z Nitry a okolia, ktorí hľadajú barbera a chcú vedieť, ako bude strih vyzerať
Jeden cieľ komunikácie: presvedčiť návštevníka, že si strih vyberie ešte pred kreslom, a poslať ho do rezervácie
Hlavná výzva: Rezervovať termín
Zdroj pravdy: `barbershop30/assets/data.js` a rezervačný kalendár prevádzky
Vybraný produkčný kód: **GV-19148**

Kód sa rozkladá presne na to, čo úvod potrebuje:

| Os | Hodnota |
|---|---|
| Cieľ | G20 Cinematic website hero |
| Naratív | N02 Cold open, reveal, proof, CTA |
| Vizuál | V05 Tactile macro craft |
| Kamera a strih | C08 Match-cut montage |

## Výstupy

| Výstup | Nástroj | Dĺžka | Pomer | Rozlíšenie | Zvuk | Umiestnenie |
|---|---|---:|---|---|---|---|
| Úvod, počítač | Higgsfield Kling 3.0 | 3,2 s | 16:9 | 1280×720 | bez zvuku | hero na `/barbershop30/` |
| Úvod, telefón | Higgsfield Kling 3.0 | 3,2 s | 9:16 | 720×1280 | bez zvuku | hero na telefóne |
| Plagát | odvodený z prvej snímky | — | oba pomery | ako video | — | `poster`, nesie LCP |
| Statická náhrada | machová fotografia | — | oba pomery | — | — | obmedzený pohyb, pomalé pripojenie |

Google Veo ani Google Vids **nie sú v tejto relácii pripojené ako nástroj**. Balík to výslovne
zakazuje predstierať, preto je produkcia spravená v Higgsfielde, ktorý pripojený je.
Scéna, strihový plán aj kontrolné body nižšie sú prenosné, keď k Veo a Vids prístup bude.

## Fakty a schválenia

| Údaj | Zdroj | Stav |
|---|---|---|
| Adresa, telefón, e-mail, Instagram | živé kontakty značky 30 | overené |
| Rezervačný kalendár | načítaný, obsahuje služby prevádzky | overené |
| Ceny a dĺžky služieb | — | CHÝBA, do videa sa nedostali |
| Otváracie hodiny | prevzaté zo salónu | CHÝBA potvrdenie, do videa sa nedostali |
| Interiér a barberi | Instagram je pre server neprístupný | CHÝBA, interiér je generovaný |

## Referencie a práva

| Podklad | Čo riadi | Musí ostať | Pôvod |
|---|---|---|---|
| `moss-16x9.jpg` | prvá snímka záberu A, textúra machu, mosadzné svetlo | kompozícia stredného švíku | vygenerované, práva prevádzky |
| `remeslo.jpg` | prvá snímka záberu B, poloha hrebeňa a nožníc | tvár klienta voľná, hrebeň mimo tváre | vygenerované, práva prevádzky |
| `interier.jpg` | cieľ prieniku v zábere A | teplé svetlo, kreslo, zrkadlo | vygenerované, práva prevádzky |
| Zelené dvere | paleta značky | zelená a mosadz | fotografia prevádzky |

Vo videu nie je žiadna skutočná osoba, preto sa nerieši súhlas s podobizňou. Zároveň sa vo videu
nesmie objaviť tvár, ktorá by sa vydávala za konkrétneho barbera alebo klienta prevádzky.

## Smerovanie

- Naratív: studený štart v detaile machu, strih otvorí priestor, dôkaz je remeslo, záver je rezervácia.
- Vizuál: hmatová makro remeselnosť, tmavá zelená, orech, mosadz, teplé svetlo, jemné zrno.
- Kamera: zámok, pomalý prienik, potom strihová spojka na detail strihania.
- Značka: text hero ostáva v HTML, nikdy sa negeneruje do obrazu.
- Zvuk: žiadny. Web je stlmený a video sa nikdy nespúšťa so zvukom.
- Prístupnosť: video je dekoratívne, `aria-hidden`, s okamžite dostupným tlačidlom Preskočiť úvod
  a statickou náhradou pri obmedzenom pohybe.

## Produkčné poistky

- Overené živé možnosti: Higgsfield pripojený, kredit skontrolovaný pred každou úlohou.
- Rebrík: najprv jeden lacný náhľad rizikového záberu, kontrola rúk, nástrojov a poslednej snímky.
- Strop opakovaní: po dvoch podobných zlyhaniach sa produkcia zastaví a nahlási prekážka.
- Kritérium prevzatia: video sa prehrá celé, sedí dĺžka aj rozmery, posledná snímka nie je čierna,
  hero text je čitateľný nad každou snímkou.
