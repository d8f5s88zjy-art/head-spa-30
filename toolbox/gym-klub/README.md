# GYM KLUB (Lipa gym): kde čo je

Projekt nie je na vetve `main`. Kód je na vetve `claude/subor-idk-fotografie-fitka-5lqm3q`
v priečinku `lipa-gym/` (web so 6 stránkami a 3D prehliadkou v `lipa-gym/3d/`). Verejná kópia je
v samostatnom repozitári Lupa-gym (pri kopírovaní sa prepisujú cesty).

Všetko podstatné o výrobe (scény, panorámy, médiá, výber fotiek) je v `lipa-gym/3d/PRODUKCIA.md`
na tej vetve. Nástroje: `lipa-gym/3d/tools/` (panorama.py, pano_export.py, media_opt.py, grade.py,
generuj.py, balik.py) a `lipa-gym/tools/` (obrazky.py, hlbka.py, vlastne_fotky.py).

Pravidlá pre fotky (podrobne v PRODUKCIA.md):
- poškodená fotka `907003c1` sa nepoužíva;
- klip IMG_8993 až od 2,7 s (pred 2,2 s je v skle odraz človeka), klip IMG_8995 vôbec;
- vyradené fotky s odrazom ľudí v zrkadlách: ae931f9a, b0ed9981, 67413462, e77dd2bd, de7727af, 0031fb81;
- žiadne fotky z fotobánk s ľuďmi.

V kontajneri: ffmpeg je z balíka `imageio_ffmpeg`; Chromium v testoch neprehrá H.264, preto testy
používajú WebM.
