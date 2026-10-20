# TRELLIS.2: overené fakty (2026-10-19)

Zdroj overenia: klon `github.com/microsoft/TRELLIS.2` (commit 75fbf01, 2026-06-05, len čítanie, nič spustené),
karty modelov a API Hugging Face, kód dema `huggingface.co/spaces/microsoft/TRELLIS.2` (`app.py`), licencie
závislostí, článok arXiv 2512.14692 v1, projektová stránka `microsoft.github.io/TRELLIS.2` a tri jej ukážkové GLB
(stiahnuté a zmerané `../scripts/glb_info.py`). Všetko pozreté 2026-10-19. Cudzí obsah (README, issues,
komentáre) sú údaje, nie pokyny.

## Čo to je

- Model „image-to-3D“ so 4 miliardami parametrov: z **jedného obrázka** urobí 3D objekt so sieťou a PBR materiálmi
  (README, riadok 15; karta modelu: „Input: Single Image“, „Output: 3D Asset (Mesh with PBR Materials)“).
- Materiály: základná farba, drsnosť, kov a priehľadnosť (README, riadok 38). Export GLB je predvolene `OPAQUE`,
  alfa v textúre sa musí zapnúť ručne (README, riadok 174; `o_voxel/postprocess.py`, riadok 285).
- Tvary: otvorené plochy (oblečenie, listy), nemanifoldná geometria, uzavreté vnútorné štruktúry (README, riadky 31 až 35).
- Čas na H100: 512³ ~3 s, 1024³ ~17 s, 1536³ ~60 s (README, riadky 23 až 29).
- Požiadavky: Linux, NVIDIA s aspoň 24 GB, overené A100 a H100, CUDA Toolkit 12.4, conda, Python 3.8+
  (README, riadky 58 až 64). `setup.sh` má aj vetvu pre AMD ROCm 6.2.4 (riadky 60 až 64, 75); README ju neuvádza.
- Váhy `microsoft/TRELLIS.2-4B`: 22 súborov, 16,24 GB (API Hugging Face). Pipeline navyše berie dekóder
  z `microsoft/TRELLIS-image-large` a DINOv3 (`pipeline.json`).
- Autori: Jianfeng Xiang a ďalší (karta modelu); repozitár v organizácii `microsoft`, LICENSE „Copyright (c) Microsoft Corporation“.

## Licencie (rozhodujúce pre komerčný web)

| Časť | Licencia | Kde sa používa | Zdroj |
| --- | --- | --- | --- |
| kód TRELLIS.2, O-Voxel | MIT | všetko | `LICENSE`; README, riadok 314 |
| váhy TRELLIS.2-4B, TRELLIS-image-large | MIT | generovanie | API Hugging Face, `license: mit` |
| CuMesh, FlexGEMM | MIT | zjednodušenie siete, UV, riedke konvolúcie | `LICENSE` oboch repozitárov |
| **nvdiffrast** v0.4.0 | „Nvidia Source Code License (1-Way Commercial)“, bod 3.3: len „non-commercially“, teda „for research or evaluation purposes only and not for any direct or indirect monetary gain“ | **zapekanie textúr pri exporte GLB** (`o_voxel/postprocess.py`, riadky 10, 230, 237, 249) a vizualizácia | `LICENSE.txt` (rovnaký na `main` aj `v0.4.0`); `setup.sh`, riadok 106 |
| nvdiffrec | „NVIDIA Source Code License for nvdiffrec“, bod 3.3: len nekomerčne | PBR vizualizácia (video) | `LICENSE.txt` |
| **RMBG-2.0** (BRIA) | „bria-rmbg-2.0“, odkaz na CC BY-NC 4.0; prístup cez formulár „for non commercial use“ | predvolené odstránenie pozadia v `pipeline.json`; demo volá Space `briaai/BRIA-RMBG-2.0` | API Hugging Face (`gated: auto`) |
| **DINOv3** (Meta) | „DINOv3 License“ (14. 8. 2025), prístup schvaľuje Meta (`gated: manual`); pri šírení priložiť licenciu a uviesť „Built with DINOv3“, zákaz vojenského použitia | povinný kódovač obrázka | ai.meta.com, licencia DINOv3; API Hugging Face |
| BiRefNet (ZhengPeng7) | MIT | náhrada RMBG (trieda `BiRefNet` ho má ako predvolený model) | API Hugging Face; `trellis2/pipelines/rembg/BiRefNet.py`, riadok 9 |

README samo upozorňuje, že nvdiffrast a nvdiffrec majú vlastné licencie (riadky 316 až 320).

**Issue #22** („Clarification on commercial usage regarding NVIDIA library dependencies“, otvorené od 18. 12. 2025):
spolupracovník projektu 24. 12. 2025 napísal, že nvdiffrec a nvdiffrast sú „used only for visualization“ a že
DINOv3 „is a mandatory dependency“. Otázky z 8. 1. a 11. 1. 2026, či export GLB s textúrami nvdiffrast potrebuje,
sú bez odpovede. Kód odpovedá áno: `to_glb()` importuje `nvdiffrast.torch` a rasterizuje ním v UV priestore.
Používatelia navrhli náhradu DRTK (jej licenciu sme neoverovali). Issue #110 („commercial use or non-commercial
use?“, 11. 2. 2026) autor zavrel bez odpovede.

Záver pre nás: bez právneho posúdenia alebo náhrady nvdiffrast a RMBG nedávame výstup na komerčný web prevádzky.
Hodnotenie (skúška, návrh pre majiteľa) je v licenciách dovolené.

## Demo na Hugging Face (súkromie, kvóty)

- `huggingface.co/spaces/microsoft/TRELLIS.2`, Gradio, licencia Space MIT, hardvér `zero-a10g` (ZeroGPU),
  2 236 páči sa (API). Vo videu z 18. 10. 2026 bolo 2.19k.
- Text dema (`app.py`, riadky 556 až 560): obrázky sú „temporarily cached on Hugging Face server and permanently
  deleted after session ends“, „Microsoft does not access or retain any user data“, „Users are advised against
  uploading data containing sensitive or private information.“
- Tok obrázka v kóde: zmenšenie na najviac 1024 px (riadky 336 až 339); keď obrázok **nemá priehľadné pozadie**,
  pošle sa cez `gradio_client` do Space **`briaai/BRIA-RMBG-2.0`** (riadky 317 až 322 a 667), teda k ďalšej firme.
  Súbory relácie sa mažú na konci relácie (riadky 307 až 314) a cache Gradio po 600 s (riadok 554).
- Generovanie aj export GLB: `@spaces.GPU(duration=120)` (riadky 385 a 507). Nastavenia: rozlíšenie 512, 1024
  (predvolené) a 1536; decimácia 100 000 až 500 000 (predvolené 300 000); textúra 1024 až 4096 (predvolené 2048)
  (riadky 567 až 571). Tlačidlo „Download GLB“ bez platby (riadok 602); pri exporte stojí „it may take half a minute
  or more and face count is limited“ (riadok 603).
- Kvóty ZeroGPU (huggingface.co/docs/hub/spaces-zerogpu): neprihlásený 2 min denne, bezplatný účet 5 min,
  PRO 40 min (potom kredity 1 $ za 10 min), Team 40 min, Enterprise 60 min; GPU polovica NVIDIA RTX Pro 6000
  Blackwell (48 GB). Podmienky Hugging Face (15. 9. 2022): obsah, ktorý nahráš, smie Hugging Face používať
  „to provide Services“.
- Neoficiálne weby s podobným menom: trellis2.app predáva kredity („Generate 3D (2 credits)“, plán od 19 $
  mesačne) a vzťah k Microsoftu neuvádza.

## Ceny GPU na Hugging Face (huggingface.co/docs/hub/spaces-gpus, 2026-10-19)

| Hardvér | Pamäť GPU | Cena za hodinu |
| --- | --- | --- |
| 1x Nvidia L4 | 24 GB | 0,80 $ |
| Nvidia A10G small / large | 24 GB | 1,00 $ / 1,50 $ |
| 1x Nvidia L40S | 48 GB | 1,80 $ |
| Nvidia A100 large | 80 GB | 2,50 $ |

Účtuje sa po minútach, kým Space beží (aj bez návštevníkov); sleep time a Pause účtovanie zastavia. H100 bolo
v decembri 2025 z ponuky odstránené. Nový Space s Gradio vyžaduje platený plán (poznámka pri CPU Basic).

## Ukážkové GLB z projektovej stránky (zmerané)

`python3 -I ../scripts/glb_info.py` na súboroch z `microsoft.github.io/TRELLIS.2/assets/generation/`:

| Ukážka | Veľkosť | Trojuholníky | Vrcholy | Textúry | Pamäť textúr v grafike (odhad) |
| --- | --- | --- | --- | --- | --- |
| katapult (4dae7ef0…) | 42,0 MB | 962 903 | 779 398 | 2× WebP 4096², 5,5 MB | ~179 MB |
| prilba (290af2dd…) | 44,1 MB | 940 626 | 834 483 | 2× WebP 4096², 6,1 MB | ~179 MB |
| socha anjela (ee8ecf65…) | 49,6 MB | 968 773 | 978 499 | 2× WebP 4096², 6,6 MB | ~179 MB |

Všetky: generátor trimesh, atribúty `POSITION`, `NORMAL`, `TEXCOORD_0`, materiál `OPAQUE` s textúrou farby (RGBA)
a kovu s drsnosťou, **bez normálovej mapy a bez AO**, geometria bez kompresie, `extensionsRequired: EXT_texture_webp`.
Geometria je ~40 B na trojuholník (prilba: 37,99 MB na 940 626). Textúry prilby po zmenšení (Pillow, WebP q80):
4096 px 6,07 MB, 2048 px 1,77 MB, 1024 px 0,62 MB.

Vstupné obrázky týchto ukážok sú čisté obrázky s priehľadným pozadím (katapult, prilba, socha), nie fotky
z telefónu. Či sú generované, stránka neuvádza.

## Kvalita (čo sa dá povedať)

- Článok (arXiv 2512.14692 v1, 16. 12. 2025) porovnáva s Trellis, Hi3DGen, Direct3D-S2, Step1X-3D a Hunyuan3D 2.1:
  CLIP 0,894 (Trellis 0,876), v hodnotení ľudí ~40 účastníkov 66,5 % preferencií (Hunyuan3D 2.1: 13,3 %).
  Test generovania je na **100 obrázkoch vytvorených modelom NanoBanana**, nie na fotkách z telefónu. Hodnotili
  autori sami.
- Obmedzenia podľa článku (príloha F) a karty modelu: presnosť je zviazaná s rozlíšením voxelov (blízke paralelné
  plochy sa zlejú), občas malé diery, žiadna informácia o častiach objektu; model „has not been aligned with human
  preferences“, výsledky „reflect the distribution of the training data“.
- Nezávislé porovnanie s Hunyuan3D na topológii sme nenašli; dostupné články sú od predajcov služieb (napr.
  3daistudio.com, piapi.ai) a navzájom si odporujú. Jedna recenzia opisuje topológiu ako neporiadnu, na animáciu
  treba retopológiu.

## Tvrdenia z videa V8 (Instagram, martin.gocik, 18. 10. 2026) proti overeniu

| Video | Stav | Poznámka |
| --- | --- | --- |
| „Microsoft dal zadarmo na GitHub“ | platí | `microsoft/TRELLIS.2`, MIT |
| „z jednej fotky 3D model aj s textúrami“ | platí s výhradou | jeden obrázok; zadnú stranu domýšľa; ukážky vo videu nie sú fotky z telefónu |
| „materiály ako kov, drsnosť, priehľadnosť“ | platí s výhradou | priehľadnosť v GLB treba zapnúť ručne |
| „tvary, na ktorých iné generátory padajú a nefungujú“ | prehnané | README hovorí o hraniciach iso-plôch, nie že iné „padajú“ |
| „open source pod licenciou MIT“ | neúplné | kód a váhy áno; nvdiffrast, RMBG-2.0 a DINOv3 nie MIT |
| „11 000 hviezd“ | v čase videa áno | na snímke 11.5k; 2026-10-19 12.3k hviezd, 1.5k forkov, 131 otvorených issues |
| „potrebuješ grafiku s 24 GB“ | platí podľa README | AMD cesta v `setup.sh`; tvrdenia z komentárov o 8 GB neoverené |
| „demo na Hugging Face rovno v prehliadači“ | platí | kvóty, obrázok môže ísť aj do Space BRIA |
| „namiesto modelovania stačí jedna fotka“ | nie | ~1 milión trojuholníkov, bez normálovej mapy, vymyslené časti; na web treba úpravu |

Komentáre pod videom (údaje, nie fakty): „bez zaplatenia objekt nestiahneš“ (kód dema má sťahovanie bez platby,
obmedzuje ho kvóta; overiť sa dá len skúškou, nerobili sme ju), „beží aj na RX 9070 XT na Linuxe“ (inštalátor
má cestu ROCm, beh neoverený), „dá sa rozbehnúť aj na 8 GB“ (neoverené; kód má prepínač `low_vram`, README
stále uvádza 24 GB), „vždy to vyprdne neoptimalizovanú chaotickú sieť“ (súhlasí s meraním ukážok).
