# Zostaví prehľadné JPEG (do 600 kB) zo snímok: python3 -I zostav.py <raw> <snimky> [prípona]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
raw, out = sys.argv[1], sys.argv[2]
suf = sys.argv[3] if len(sys.argv) > 3 else '390x844'
os.makedirs(out, exist_ok=True)
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
FN = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19)
FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
BG, FG, MUT, LAMP = (20, 19, 18), (240, 234, 222), (170, 162, 150), (214, 120, 60)
d = json.load(open(os.path.join(raw, f'udaje-{suf}.json')))
CARDS = [('cakaren', 'Čakáreň'), ('sala', 'Hlavná sála'), ('stol', 'Pracovné miesto')]
TW = 390  # šírka jednej snímky telefónu v zostave (1/3 z DPR 3)

def shot(name, w=TW):
    im = Image.open(os.path.join(raw, name)).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

def save(img, path):
    for q in (86, 80, 74, 68, 60, 52):
        img.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
        if os.path.getsize(path) <= 600_000: break
    print(path, img.size, os.path.getsize(path), 'q', q)

def sheet(title, sub, cols, rows, cells, path, cw=TW, ch=None):
    # cells[r][c] = (Image, popis)
    ch = ch or max(c[0].height for row in cells for c in row)
    G, HEAD, CAP = 18, 54 + 24 * len(sub) + 10, 58
    W = G + cols * (cw + G)
    H = HEAD + rows * (ch + CAP + G) + G
    img = Image.new('RGB', (W, H), BG); dr = ImageDraw.Draw(img)
    dr.text((G, 16), title, font=FB, fill=FG)
    y = 54
    for line in sub:
        dr.text((G, y), line, font=FN, fill=MUT); y += 24
    for r in range(rows):
        for c in range(cols):
            im, cap = cells[r][c]
            x0, y0 = G + c * (cw + G), HEAD + r * (ch + CAP + G)
            img.paste(im, (x0, y0))
            ly = y0 + im.height + 6
            for i, line in enumerate(cap.split('\n')[:2]):
                dr.text((x0, ly + i * 22), line, font=FN if i == 0 else FS, fill=FG if i == 0 else MUT)
    save(img, path)

def cap(m, c):
    i = d[m]['cards'][c]
    return f"{i['src']}\n{i['nat'][0]}×{i['nat'][1]} = {i['mp']} MP, {i['pxPerCss']} px/CSS px"

if 'A' in d:
    sheet('A – dnešný stav (výrez -m na výšku, pomalé priblíženie 1 → 1,06)',
          [f'Telefón {suf} DPR 3, ?foto=A. Fotka cez celé okno, zo scény vidno len stredný pás.'],
          3, 1, [[(shot(f'A-{c}.png'), f'{n} · ' + cap('A', c)) for c, n in CARDS]], os.path.join(out, f'A-{suf}.jpg'))
if 'B' in d:
    sheet('B – celá fotka na šírku displeja, okolo nej tá istá fotka rozmazaná',
          [f'Telefón {suf} DPR 3, ?foto=B (rozmazanie predpočítané raz do plátna 36 px, bez filtra pri kreslení).'],
          3, 1, [[(shot(f'B-{c}.png'), f'{n} · ' + cap('B', c)) for c, n in CARDS]], os.path.join(out, f'B-{suf}.jpg'))
if 'Bcss' in d:
    sheet('B (variant rozmaz=css) – ten istý súbor, CSS filter: blur(22px) na statickej vrstve',
          [f'Telefón {suf} DPR 3, ?foto=B&rozmaz=css. Vzhľad takmer rovnaký ako B s plátnom, cena kreslenia vyššia.'],
          3, 1, [[(shot(f'Bcss-{c}.png'), f'{n} · ' + cap('Bcss', c)) for c, n in CARDS]], os.path.join(out, f'B-css-{suf}.jpg'))
if 'C' in d:
    cells = []
    for c, n in CARDS:
        i = d['C']['cards'][c]
        cells.append([(shot(f'C-{c}-{lab}.png'), f'{n} · {lab_sk}: {round(i["tx_" + lab])} px\n{i["src"]} {i["mp"]} MP, {i["pxPerCss"]} px na CSS px')
                      for lab, lab_sk in (('zaciatok', 'začiatok'), ('stred', 'stred 9 s'), ('koniec', 'koniec 18 s'))])
    sheet('C – prejazd kamery po celej fotke (18 s zľava doprava)',
          [f'Telefón {suf} DPR 3, ?foto=C. Fotka na výšku okna, CSS animácia transform: translate3d,', 'vlastná vrstva (will-change) len na zobrazenej karte; snímky v čase 0 s, 9 s a 18 s.'],
          3, 3, cells, os.path.join(out, f'C-{suf}.jpg'))
if 'PC' in d:
    pw = 600
    sheet('Referencia: počítač 1440 × 900, ?film=off (rovnaké rámovanie ako film, bez WebGL)',
          ['Toto je „ako na PC“: fotka na šírku cez celé okno, vidno asi 94 % šírky a 88 % výšky scény.'],
          3, 1, [[(shot(f'PC-{c}.png', pw), f'{n} · ' + cap('PC', c)) for c, n in CARDS]], os.path.join(out, 'PC-1440x900.jpg'), cw=pw)
# prehľad: riadky = karty, stĺpce A | B | C (stred) | PC
if all(k in d for k in ('A', 'B', 'C', 'PC')):
    cw = 300
    cells = []
    for c, n in CARDS:
        pc = shot(f'PC-{c}.png', cw)
        row = [(shot(f'A-{c}.png', cw), f'A {n}\n{d["A"]["cards"][c]["pxPerCss"]} px/CSS px'),
               (shot(f'B-{c}.png', cw), f'B {n}\n{d["B"]["cards"][c]["pxPerCss"]} px/CSS px'),
               (shot(f'C-{c}-stred.png', cw), f'C {n} (stred prejazdu)\n{d["C"]["cards"][c]["pxPerCss"]} px/CSS px'),
               (pc, f'PC {n}\n{d["PC"]["cards"][c]["pxPerCss"]} px/CSS px (DPR 1)')]
        cells.append(row)
    sheet(f'Prehľad A / B / C na telefóne {suf} a PC',
          ['A dnes, B celá fotka + rozmazané okolie, C prejazd (snímka v strede), PC 1440 × 900 ?film=off.'],
          4, 3, cells, os.path.join(out, f'prehlad-{suf}.jpg'), cw=cw, ch=round(844 * cw / 390) if suf == '390x844' else None)
