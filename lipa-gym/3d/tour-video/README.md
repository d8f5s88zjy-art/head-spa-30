# Video GYM KLUB: celé fitko za 29 sekúnd

- `prehliadka-gymklub.mp4`: 1080 × 1920, 30 fps, 28,8 s, H.264 + AAC. Vertikálny formát pre Reels, TikTok a Shorts.
- `prehliadka-gymklub.jpg`: titulný obrázok (úvod s LED stropom a názvom).
- `popis.txt`: text k príspevku. Pred zverejnením doplniť adresu webu.

Ako vzniklo (`work2/`):
- Strih je zo skutočných fotiek prevádzky, upravených nástrojom `tools/grade.py` (farby, expozícia, orez). Obsahuje aj skutočnú panorámu funkčnej zóny zo záberu videa a dve fotky sály Panda z gymklub.sk.
- Storyboard je v `story.json`:
  - úvod: LED strop a názov;
  - 8 priestorov po 2 záberoch na takt (100 BPM);
  - posun po panoráme funkčnej zóny;
  - záverečná karta.
- `compose.html` skladá obraz ako čistú funkciu času: pomalý nájazd s bočným posunom, popis priestoru a pás 8 úsekov hore. `render.mjs` z neho vykreslí snímky.
- `synth.py` vytvorí syntetizovaný zvuk (A mol, 100 BPM).

Zostavenie (web beží na localhost:8765):

```
cd work2 && node render.mjs && python3 synth.py
ffmpeg -framerate 30 -i out/%04d.jpg -i soundtrack.wav -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -shortest ../prehliadka-gymklub.mp4
```

Staršia verzia (záznam filmovej prehliadky) je v `work/` a nahradila ju táto.
