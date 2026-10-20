# Rozbor over-dekod.mjs: pre každý zaznamenaný snímok (Page.startScreencast) podiel tmavej plochy a jas.
# Test A (záloha karty): podiel pixelov s jasom < 28 v celom okne (bez lišty hore 70 px a spodného CTA 110 px).
# Test B (pás tímu): v boxoch portrétov (poloha na konci švihu, posun počas švihu sa ignoruje → meria sa pás 220–620 px)
# rozptyl jasu: prázdny portrét (tmavý gradient) má smerodajnú odchýlku < 12, fotka výrazne viac.
#   python3 -I over-dekod.py dekod
import json, os, sys, glob
from PIL import Image, ImageStat
root = sys.argv[1] if len(sys.argv) > 1 else 'dekod'
for d in sorted(glob.glob(os.path.join(root, '*-*-*'))):
    meta = json.load(open(os.path.join(d, 'meta.json')))
    files = sorted(glob.glob(os.path.join(d, '*.jpg')))
    fr = meta['frames']
    t0 = meta.get('tJump') or meta.get('t0')
    rows = []
    for f, ts in zip(files, fr):
        im = Image.open(f).convert('L')
        w, h = im.size
        if meta['test'] == 'A':
            c = im.crop((0, int(h * 70 / 844), w, int(h * (844 - 110) / 844)))
            px = c.get_flattened_data() if hasattr(c, 'get_flattened_data') else c.getdata()
            px = list(px)
            dark = sum(1 for p in px if p < 28) / len(px)
            rows.append((ts - t0, dark, ImageStat.Stat(c).mean[0]))
        else:
            # pás portrétov 210–470 px okna, zvislé pruhy po 30 px: prázdny portrét (len tmavý gradient) má rozptyl < 9
            y0, y1 = int(h * 210 / 844), int(h * 470 / 844); sw = max(1, int(w * 30 / 390))
            flat = 0
            for x in range(0, w - sw + 1, sw):
                st = ImageStat.Stat(im.crop((x, y0, x + sw, y1)))
                if st.stddev[0] < 9 and st.mean[0] < 70: flat += 1
            rows.append((ts - t0, flat, ImageStat.Stat(im.crop((0, y0, w, y1))).mean[0]))
    name = os.path.basename(d)
    if meta['test'] == 'A':
        shown = [x for x in meta.get('triedy', []) if 'is-shown' in x['c']]
        ts_shown = (shown[0]['t'] - t0) if shown else None
        after = [r for r in rows if r[0] >= 0]
        over = [r for r in after if r[1] > 0.6]
        # najdlhší súvislý úsek s tmavou plochou > 60 % okna
        best = cur = 0; start = None
        for i, r in enumerate(after):
            if r[1] > 0.6:
                if start is None: start = r[0]
                end = after[i + 1][0] if i + 1 < len(after) else r[0]
                best = max(best, end - start)
            else: start = None
        print(f"{name}: kotva {meta['geo']['shot']}, pred skokom {meta['pred']}, is-shown {ts_shown and round(ts_shown)} ms po skoku; snímok {len(after)}, s tmavou plochou > 60 %: {len(over)}, najdlhší tmavý úsek ~{round(best)} ms")
        print('   ' + ' '.join(f"{round(r[0])}:{round(100 * r[1])}%" for r in after[:40]))
    else:
        after = [r for r in rows if r[0] >= 0]
        print(f"{name}: portréty stiahnuté {meta['pred']}, scrollLeft na konci {meta['scrollLeft']}")
        bad = [r for r in after if r[1] >= 3]
        print(f"   snímok {len(after)}, so slepým portrétom (≥ 3 pruhy po 30 px bez obsahu): {len(bad)}, od {round(bad[0][0]) if bad else '-'} do {round(bad[-1][0]) if bad else '-'} ms")
        print('   čas:prázdnych pruhov  ' + ' '.join(f"{round(r[0])}:{r[1]}" for r in after[:45]))
