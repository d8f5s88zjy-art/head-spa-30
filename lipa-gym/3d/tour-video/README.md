# Video z prehliadky GYM KLUB

- `prehliadka-gymklub.mp4`: 1080 × 1920, 30 fps, 34 s, H.264 + AAC. Vertikálny formát pre Reels, TikTok a Shorts.
- `prehliadka-gymklub.jpg`: titulný obrázok (záber šprintérskej dráhy a LED stropu).
- `popis.txt`: text k príspevku. Pred zverejnením doplniť adresu webu.

Ako vzniklo:
- Obraz je skutočný web: filmová prehliadka na `o-fitku.html`, nahratá snímku po snímke v mobilnom zobrazení. Skript je `work/capture.mjs`, bez lišty webu a ovládacích tlačidiel.
- V zábere sú len skutočné panorámy a fotky prevádzky, fotka sály Panda je z gymklub.sk.
- Strih robí `work/edit.py`:
  - pomalé pohyby kamery sú zrýchlené 2,3× s prelínaním snímok;
  - prechody dverami, strihy a chvíle pokoja s bodmi v scéne sú v skutočnej rýchlosti.
- Zvuk robí `work/synth.py`, celý je syntetizovaný (A mol, 96 BPM): dron, pulz a pad, šum pri prechodoch, tón pri ťuknutí, záverečný akord.

Zostavenie (web beží na localhost:8765):

```
cd work && node capture.mjs cap && python3 edit.py && python3 synth.py
ffmpeg -framerate 30 -i out/%04d.jpg -i soundtrack.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -shortest ../prehliadka-gymklub.mp4
```
