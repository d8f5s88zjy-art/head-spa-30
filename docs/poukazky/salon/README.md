# Poukážky od salónu

Hotové poukážky HEAD SPA 30, ktoré poslal salón (október 2026): fotka rituálu, názov, dĺžka
a veta Darujte chvíľu pokoja, v pätičke HEADSPA30.SK. Každá je 1290 × 645 px, vyrezaná bez úprav
zo snímky obrazovky, v ktorej prišla. Názov súboru je `subor` z `../sablona/ritualy.json`.

V `ritualy.json` majú tieto rituály `"salon": true`, takže `python3 docs/poukazky/sablona/export.py`
z nich robí obrázky do obchodu Booqme (`../sablona/booqme/`) a keďže majú aj `"web": true`, aj ukážky
na web (`assets/img/poukaz/`).
Ostatné rituály majú poukážku podľa šablóny salónu (`../sablona/`).
