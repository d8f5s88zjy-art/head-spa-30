# Poukážky od salónu

Hotové poukážky HEAD SPA 30, ktoré poslal salón (október 2026), 13 rituálov: fotka rituálu, názov,
dĺžka a veta Darujte chvíľu pokoja, v pätičke HEADSPA30.SK. Prišli v dvoch podobách (veľká mašľa;
malá mašľa s lotosovou pečaťou). Gentlemen Harmony Ritual a Hĺbkový rituál pre pokožku hlavy prišli
v oboch; používa sa podoba, ktorá je aj na webe, druhá je v `varianty/`. Každá je 1290 × 645 px, vyrezaná bez úprav
zo snímky obrazovky, v ktorej prišla. Názov súboru je `subor` z `../sablona/ritualy.json`.

V `ritualy.json` majú tieto rituály `"salon": true`, takže `python3 docs/poukazky/sablona/export.py`
z nich robí obrázky do obchodu Booqme (`../sablona/booqme/`) a keďže majú aj `"web": true`, aj ukážky
na web (`assets/img/poukaz/`).
Ostatné štyri rituály (Head Spa Classic, Gentlemen Head Spa, Little Fruit Head Spa, Spoločný Head Spa
rituál) majú poukážku podľa šablóny salónu (`../sablona/`).
