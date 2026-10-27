# Pôvodný web vs. nový web

Pôvodný web (barbershop30.sk, zdroj v `source/web-povodny/`): klasická stránka s bežiacim
sliderom fotiek, blokmi textu, galériou v mriežke, zoznamom tímu a odkazom na rezerváciu.
Fotky sú rovnaké profesionálne zábery, ale stoja vedľa seba; návštevník si podnik neprejde,
len si ho pozrie po kúskoch. Ceny sú v rezervačnom systéme, nie na webe.

Nový web (`index.html` + `assets/`):

| | pôvodný | nový |
|---|---|---|
| úvod | slider fotiek s textom cez obrázok | úvod ako film: z Mostnej cez dvere na rohožku, H1 „Tvoj strih. Tvoje miesto.“ a dve tlačidlá od prvej sekundy |
| priestor | galéria v mriežke | prehliadka: 13 záberov s hĺbkou v poradí, ako sa podnikom prechádza, kamera sa v nich pohne; popis miesta vľavo dole |
| služby | odkaz do rezervácie | cenník 15 služieb s opisom, trvaním a cenou (na cent presne), „Objednať“ pri každej |
| tím | mená a fotky | 10 portrétov v rovnakom výreze, mená a roly presne ako ich tím uvádza, video „tím v akcii“ |
| dôvera | – | odkaz na hodnotenie na Google (bez vymyslených čísel), Instagram |
| mobil | responzívna šablóna | vlastné rozloženie: doska v dolnej polovici, spodné tlačidlo „Rezervovať termín“, menu cez celú obrazovku |
| bez WebGL / obmedzený pohyb | – | pokojná verzia s tými istými fotkami, rovnaké rozloženie |
| pravda | texty marketingové | len overené údaje (CONTENT_SOURCES.md), bez superlatívov |

Čo nový web zámerne nemá: vymyslené recenzie, hviezdičky, fotky výsledkov strihov (kým ich
majiteľ nedodá), formuláre (rezervácia ide do systému majiteľa).
