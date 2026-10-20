---
name: 3d-modely-na-web
description: 3D modely na weby prevádzok (GLB, three.js, model-viewer) a model z jednej fotky (TRELLIS.2 od Microsoftu). Kedy 3D áno a kedy nie (HEAD SPA 30 nie), licencie kódu, váh a závislostí (nvdiffrast a RMBG-2.0 len nekomerčne, DINOv3 vlastná licencia), súkromie pri demo na Hugging Face, vymyslené detaily z jednej fotky, rozpočet GLB pre telefón, postup fotka → GLB → web, cloudová GPU bez vlastnej grafiky (len opis). Skript scripts/glb_info.py vypíše trojuholníky, textúry, pamäť v grafike a rozšírenia a skontroluje rozpočet (kód 0 alebo 1). Aj „3D okolie“ prevádzky z máp (Google 3D a Google Earth nie, MapLibre s OSM áno). Použi pri „sprav 3D model produktu“, „z fotky 3D“, „TRELLIS“, „model-viewer“, „GLB je veľké“, „3D na webe seká na mobile“, „3D mapa okolia“, pri videách o generovaní 3D.
---

# 3D modely na web

Postup vznikol 2026-10-19 z rozboru videa o TRELLIS.2 (záznam 15 v
`../referencie-z-videi/references/naucene-z-videi.md`) a z overenia repozitára, modelu, demo a ukážkových
GLB súborov Microsoftu. Fakty so zdrojmi a riadkami kódu sú v [references/trellis2.md](references/trellis2.md).
Nič z TRELLIS.2 sme nespúšťali ani neinštalovali; merali sme len stiahnuté ukážkové GLB.

## Kedy použiť

- Majiteľ alebo kolega chce na web 3D model (produkt, náradie, náčinie, dekorácia) alebo „3D z fotky“.
- Niekto pošle video o generovaní 3D (TRELLIS, Hunyuan3D a pod.) a chce to „mať“.
- GLB je veľké, 3D seká na telefóne alebo zhorší Lighthouse.
- Treba skontrolovať hotový GLB pred nasadením (`scripts/glb_info.py --rozpocet`).

## Pravidlá (platia vždy)

1. **Pravidlá projektu majú prednosť.** HEAD SPA 30: žiadny 3D model (`CLAUDE.md`: pozadie je film zo
   skutočných fotiek, „Nič vymodelované“, žiadna zmienka o AI, nič nevymýšľať, zdržanlivý štýl).
   Barbershop 30: 3D je „autorský štylizovaný symbol“, web netvrdí, že je to kópia skutočného kusu
   (`barbershop-30/docs/ART_DIRECTION.md`, časti 6 a 7). GYM KLUB: pravidlá fotiek v `../../gym-klub/README.md`.
2. **Model z jednej fotky nie je skutočný záznam.** Zadnú stranu, vnútro a nápisy si model domýšľa. Na webe ho
   nikdy nevydávame za sken ani za „náš skutočný produkt v 3D“; v dokumentácii projektu zapíšeme pôvod
   („ilustračný model z fotky, upravený“). Na webe a v commitoch bez zmienky o AI (spoločné pravidlá toolboxu).
3. **Licencie pred použitím u klienta.** Kód a váhy TRELLIS.2 sú MIT, ale bežný export GLB s textúrami volá
   nvdiffrast (licencia NVIDIA len na výskum alebo hodnotenie), predvolené odstránenie pozadia je RMBG-2.0
   (CC BY-NC 4.0) a povinný DINOv3 má vlastnú licenciu. Kým to neposúdi právnik alebo sa závislosti nenahradia,
   výstup TRELLIS.2 na komerčný web prevádzky nedávame. Podrobne v [references/trellis2.md](references/trellis2.md).
4. **Súkromie.** Fotky prevádzky ani klientov do cudzej služby (demo na Hugging Face) bez súhlasu majiteľa
   nenahrávame. Nikdy fotky s ľuďmi, tvárami, menami ani obrazovkami s údajmi. Demo pošle obrázok bez
   priehľadného pozadia aj do ďalšej služby (Space BRIA na odstránenie pozadia).
5. **Značky a cudzie fotky.** Žiadne produkty s cudzím logom alebo etiketou (model nápis domyslí a pokriví)
   a žiadne fotky výrobcu ako vstup bez práva na ne.
6. **Len oficiálne zdroje.** Demo len `huggingface.co/spaces/microsoft/TRELLIS.2` (odkaz z README repozitára).
   Weby s podobným menom a kreditmi (napr. trellis2.app) nie sú označené ako Microsoft.
7. **Nič neinštaluj do repozitára webov** (CUDA rozšírenia, conda, váhy 16 GB). Ak vôbec, tak na prenajatom
   stroji, ktorý sa po práci zmaže (časť Cloudová GPU).

## Rozhodnutie: 3D áno alebo nie

| Situácia | Rozhodnutie | Prečo |
| --- | --- | --- |
| HEAD SPA 30, kozmetika, rituály | nie | `CLAUDE.md`; etikety značiek; skutočné fotky z 2 až 3 strán sú pravdivejšie a ľahšie |
| Barbershop 30, nožnice, britva, strojček | najprv procedurálne v three.js (ako kreslo, kladivko v `zentury/`) | jednoduché tvary, pár kB, presné; three r169 už je v `barbershop-30/assets/vendor/three.module.min.js` |
| GYM KLUB, kettlebell, činka, kotúč | procedurálne (`LatheGeometry`, valce) | rotačné telesá, model z fotky by mal ~1 milión trojuholníkov navyše |
| zložitý organický predmet bez značky (rastlina, dekorácia, socha) | TRELLIS.2 ako skica, potom úprava | tu má generovanie zmysel; licencie podľa pravidla 3 |
| návrh scény pre majiteľa na schválenie (nie na web) | TRELLIS.2 v deme s vlastnou fotkou bez ľudí, so súhlasom | rýchla predstava, hodnotenie je v licenciách dovolené |
| „3D okolie“ prevádzky, glóbus, zoom z mapy (video V4, God's Eye View) | nie Google 3D ani Google Earth; ak vôbec, vlastné video cesty k dverám alebo MapLibre GL JS s OpenFreeMap a budovami z OSM (ODbL, uvedenie „© OpenStreetMap contributors“), načítané až po kliknutí | Google Photorealistic 3D Tiles nie sú pre nové projekty s fakturačnou adresou v EEA od 8. 7. 2025; obsah Google Earth „may not be used for any commercial or promotional purposes“; Cesium ion Community len nekomerčne (overené 2026-10-17, záznam 11) |

## Rozpočet GLB pre web na telefóne (náš pracovný návrh)

Merané 2026-10-19 na troch ukážkových GLB z projektovej stránky TRELLIS.2: **42 až 50 MB**, **0,94 až
0,97 milióna trojuholníkov**, dve textúry WebP **4096×4096** (farba s alfou, kov a drsnosť), **bez normálovej
mapy**, geometria bez kompresie, povinné `EXT_texture_webp`. Pamäť textúr v grafike ~179 MB (odhad 4 B/px
a mipmapy). Na web to v tomto stave nejde.

| Limit | Hodnota | Odkiaľ |
| --- | --- | --- |
| súbor | do 3 MB | návrh; 3D sa načíta až po kliknutí, nesmie zjesť dáta na telefóne |
| trojuholníky | do 100 000 (radšej 30 až 80 tisíc) | návrh; výpočet z ukážky: 40 B na trojuholník bez kompresie, 50 tisíc ≈ 1,7 MB |
| textúry | 2048 px, na telefóne 1024 | merané: obe textúry prilby 1024 px WebP q80 = 0,62 MB (4096 px = 6,07 MB) |
| pamäť textúr v grafike | do 64 MB | výpočet: 4096² RGBA ≈ 64 MB, s mipmapami ≈ 85 MB na jednu textúru |
| povinné rozšírenia | len tie, ktoré načíta three.js aj model-viewer | zoznam v `scripts/glb_info.py` |

Limity sú návrh, nie norma: potvrď ich meraním na skutočnom telefóne a Lighthouse projektu (`../rychly-web/`).

```bash
python3 -I toolbox/skills-z-praxe/3d-modely-na-web/scripts/glb_info.py model.glb --rozpocet
python3 -I toolbox/skills-z-praxe/3d-modely-na-web/scripts/glb_info.py model.glb --rozpocet --max-mb 2 --max-trojuholnikov 60000 --max-textura 1024
python3 -I toolbox/skills-z-praxe/3d-modely-na-web/scripts/glb_info.py model.glb --json
```

Kód 0 = v rozpočte, 1 = niečo prekročené (vypíše čo), 2 = chyba súboru. Upozorní aj na geometriu bez
kompresie a na chýbajúcu normálovú mapu pri veľkom počte trojuholníkov. Overené 2026-10-19 na ukážkach
TRELLIS.2 (kód 1) a na skúšobných GLB s PNG, JPEG a WebP (stratové, bezstratové, s alfou) a s neznámym
povinným rozšírením.

## Postup fotka → GLB → web

1. **Súhlas a vstup.** Majiteľ súhlasí s tým, kam fotka pôjde. Vlastná fotka objektu bez ľudí a bez značiek,
   rovnomerné svetlo, objekt celý v zábere. Najlepšie vystrihnutý PNG s priehľadným pozadím: demo aj kód
   vtedy pozadie neodstraňujú (žiadna ďalšia služba, žiadny RMBG).
2. **Generovanie** (demo alebo cloudová GPU): rozlíšenie 1024, dva až tri seedy, vybrať najvernejší.
3. **Porovnanie so skutočnosťou.** Skutočný objekt odfotiť z 3 až 4 strán a zapísať, čo model vymyslel
   (zadná strana, nápisy, diery, zliate tenké časti). Čo nesedí, sa opraví alebo sa model nepoužije.
4. **Úprava** (Blender; tu neoverené): mierka a orientácia, zjednodušenie na 30 až 80 tisíc trojuholníkov,
   zapečenie normálovej mapy z pôvodného modelu (TRELLIS.2 ju nedáva, bez nej zmizne reliéf), textúry 1024 až 2048.
   Priehľadnosť: GLB je predvolene `OPAQUE`, alfa v textúre sa musí zapnúť ručne (README TRELLIS.2, riadok 174).
5. **Kompresia** (gltf-transform, MIT; tu neinštalované): Meshopt alebo Draco, textúry WebP alebo KTX2
   (KTX2 ostáva komprimované aj v grafike). Potom `gltf-transform inspect` a náš `glb_info.py --rozpocet`.
6. **Web.**
   - Kde už je three.js (Barbershop 30, r169 v `barbershop-30/assets/vendor/`): `GLTFLoader` a dekodér z tej istej verzie three,
     žiadny druhý balík.
   - Samostatná stránka bez three.js: `<model-viewer>` (Google, Apache-2.0). Verzia 4.3.1 má 1 068 903 B,
     gzip ~289 kB (merané 2026-10-19). Verziu pripni presne a nie novšiu ako dva týždne (4.4.0 je z 9. 10. 2026).
   - Plagát (AVIF) namiesto modelu, kým návštevník neklikne „Zobraziť v 3D“ (`poster`, `reveal="manual"` alebo
     `loading="lazy"`), aby 3D nezasiahlo do LCP.
   - Dekodéry Draco a KTX2 hostuj u seba (`dracoDecoderLocation`, `ktx2TranscoderLocation`); predvolene sa
     sťahujú z CDN Google, teda tretia strana, ktorú web inak nevolá.
   - `prefers-reduced-motion`: bez automatického otáčania. `saveData` alebo `deviceMemory < 4`: len plagát
     (ako kreslo Barbershop 30). Popis pre čítačky (`alt`).
7. **Kontrola** podľa projektu: Lighthouse mobil (HEAD SPA 95+, Barbershop podľa `docs/CHECKS.md`), skrol
   na telefóne, bez WebGL zostane plagát. Majiteľ schváli presný súbor a text (`../youtube-shorts/scripts/schvalenie.py`).
8. **Zápis pôvodu** v dokumentácii projektu: z akej fotky, kedy, čo bolo vymyslené a opravené, licencie.

## Cloudová GPU bez vlastnej grafiky (len opis, nič sme nespúšťali)

TRELLIS.2 potrebuje Linux a grafiku NVIDIA s aspoň 24 GB pamäte, overené na A100 a H100 (README, riadky 59 a 60).
Inštalátor má aj cestu pre AMD ROCm (`setup.sh`, riadky 60 až 64 a 75); README ju nespomína.

1. **Oficiálne demo (ZeroGPU), bez platby.** Denná kvóta GPU: neprihlásený 2 min, bezplatný účet 5 min,
   PRO 40 min; generovanie aj export GLB majú každé limit 120 s. Len na hodnotenie a vlastné testovacie fotky
   (pravidlá 3 a 4). Sťahovanie GLB je v kóde dema bez platby; obmedzuje ho len kvóta.
2. **Vlastná kópia dema na Hugging Face s platenou GPU.** Súkromný Space, ceny 2026-10-19: L4 24 GB 0,80 $/h,
   A10G 24 GB 1,00 až 1,50 $/h (presne na minime, riziko nedostatku pamäte pri 1536), L40S 48 GB 1,80 $/h,
   A100 80 GB 2,50 $/h. Účtuje sa po minútach, kým Space beží, aj keď nikto negeneruje: nastaviť sleep time
   a po práci Pause. Úpravy: vyhodiť volanie Space BRIA (posielať obrázky s alfou alebo BiRefNet, MIT),
   prijať licenciu DINOv3 na účte (schvaľuje Meta), token len v Secrets.
3. **Prenajatý GPU stroj na hodiny** (Linux, NVIDIA 24 GB a viac, radšej 48 GB): klon, `setup.sh` v novom
   prostredí, váhy (repozitár TRELLIS.2-4B 16,24 GB, plus DINOv3 a časť TRELLIS-image-large), `example.py`
   alebo `app.py` cez SSH tunel. Región v EÚ, po práci zmazať stroj aj disk. Ceny poskytovateľov sme neoverovali.

Čas podľa README (H100): 512³ ~3 s, 1024³ ~17 s, 1536³ ~60 s; export GLB v deme „half a minute or more“.

## Pasce

| Pasca | Čo sa stane | Čo s tým |
| --- | --- | --- |
| „MIT, zadarmo“ z videa | licencia kódu a váh, nie závislostí; export textúr volá nvdiffrast | pravidlo 3, issue #22 je otvorené |
| autor projektu píše, že nvdiffrast je „only for visualization“ | `o_voxel/postprocess.py` ho importuje a rasterizuje ním pri zapekaní textúr GLB (riadky 10, 230 až 249) | ver kódu, nie komentáru; otázka v issue #22 je bez odpovede |
| vstup bez priehľadného pozadia | demo pošle obrázok do Space `briaai/BRIA-RMBG-2.0` | nahraj PNG s alfou |
| GLB 40 až 50 MB, 4096 px textúry | telefón sťahuje dlho, v grafike ~179 MB textúr | úprava podľa postupu, `glb_info.py --rozpocet` |
| po zjednodušení zmizne reliéf | GLB nemá normálovú mapu | zapiecť normálovú mapu z pôvodného modelu |
| priehľadné sklo je nepriehľadné | export `OPAQUE` | zapnúť alfu v materiáli ručne |
| model-viewer vedľa three.js | dve kópie three, ~289 kB gzip navyše | na weboch s three.js len `GLTFLoader` |
| demo „zadarmo“ cez cudzie weby s kreditmi | neoficiálne služby, nejasné spracovanie fotiek | len oficiálny Space z README |
| ukážky vo videách | vstupy sú čisté ukážkové obrázky z projektovej stránky, nie fotky z telefónu | na vlastných fotkách kvalita neoverená, skúšať na objekte bez značky |

## Kontrolný zoznam

- [ ] Pravidlá projektu dovoľujú 3D (HEAD SPA 30 nie).
- [ ] Majiteľ súhlasil, kam fotka pôjde; na fotke nie sú ľudia, značky ani údaje.
- [ ] Licencie posúdené (nvdiffrast, RMBG-2.0, DINOv3) alebo ide len o hodnotenie mimo webu.
- [ ] Vymyslené časti porovnané so skutočným objektom a opravené alebo model vyradený.
- [ ] `glb_info.py --rozpocet` vráti 0; textúry a trojuholníky podľa telefónu.
- [ ] Plagát, načítanie po kliknutí, dekodéry u seba, zálohy (reduced motion, saveData, bez WebGL).
- [ ] Lighthouse a skrol na telefóne podľa projektu; majiteľ schválil presný súbor.
- [ ] Pôvod modelu zapísaný v dokumentácii projektu; na webe ani v commitoch bez zmienky o AI.

## V tomto toolboxe

- `scripts/glb_info.py`: rozbor GLB a rozpočet (len štandardná knižnica Pythonu).
- [references/trellis2.md](references/trellis2.md): TRELLIS.2 overené 2026-10-19 (licencie, kód, demo, kvóty,
  merania ukážok, kvalita podľa článku, cudzie porovnania).
- Pri zápise do toolboxu 2026-10-19 znova overené: `glb_info.py` na troch ukážkach Microsoftu a `topology.glb` kód 1
  (rozpočet prekročený), na skúšobných GLB s PNG, JPEG a WebP kód 0, neznáme povinné rozšírenie kód 1, poškodený
  súbor kód 2, bez argumentu kód 2; pyflakes bez nálezov.
- Súvisiace: `../rychly-web/` (LCP, Lighthouse), `../film-z-fotiek/` (WebGL zo skutočných fotiek),
  `../../skills-animacie/` (Three.js, Genjutsu), `barbershop-30/docs/ART_DIRECTION.md` (3D kreslo a pravdivosť),
  `zentury/README.md` (procedurálne kladivko v three.js).
