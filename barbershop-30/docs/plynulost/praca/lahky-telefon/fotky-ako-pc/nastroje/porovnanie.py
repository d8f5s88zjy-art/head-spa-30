# Porovnávacie obrázky PC (vľavo, zmenšené) vs telefón 390×844 DPR 3 (vpravo) pre titulné karty.
# Použitie: python3 -I porovnanie.py <fakty>   (číta raw/pc1-*.png, raw/tel390-*.png, raw/rozbor.json, ramy/*.jpg)
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
rows = {r['shot']: r for r in json.load(open(os.path.join(OUT, 'raw', 'rozbor.json')))}
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
FH = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
FN = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19)
BG, FG, MUT, LAMP, OK = (20, 19, 18), (240, 234, 222), (175, 167, 155), (240, 126, 60), (110, 200, 120)

KARTY = {
    'cakaren': ('Čakáreň', [
        'Na telefóne chýba ľavých 57 % šírky PC záberu:',
        'rad kresiel a hĺbka sály s kruhovými svetlami.',
        'Z buldoga so slúchadlami ostáva na ľavom okraji',
        'len kúsok hlavy so slúchadlami a bok tela.']),
    'sala': ('Hlavná sála', [
        'Chýba 35 % vľavo (koženkové kreslo v popredí,',
        'priechod do zadnej časti) a 35 % vpravo (kruhové',
        'svetlá, zrkadlá s pultom, televízor).',
        'Ostáva rad kresiel a holičský stĺp.']),
    'stol': ('Pracovné miesto', [
        'Telefón ukazuje len 18 % plochy PC záberu: chýba',
        'ľavé zrkadlo s lampou (26 %) a celá pravá polovica (50 %):',
        'druhé zrkadlo, kruhové svetlo, okno, kreslo; televízor napoly.',
        'Výrez -m má len 1152 px na šírku: 0,81 px na fyzický px.']),
    'rohozka': ('Úvod (rohožka)', [
        'Telefón ukazuje inú fotku (photos/foto-40.jpg, rohožka',
        'zhora a strop). Sud s pumpou Route 66 a buldogom,',
        'ktoré sú na PC v strede (slider/3.jpg), na telefóne nie sú.',
        'PC má tu len 1920 px zdroj: 1,33 px na CSS px aj pri DPR 2.']),
    'vstup': ('Vstup z Mostnej', [
        'Chýba ľavých 61 % šírky PC záberu: auto v pohybe,',
        'Salón 30, EK, stĺp a ulica; vpravo 9 % (chodec, sused).',
        'Ostáva výklad Barbershop s dverami.',
        '']),
}

def fmt(x, d=1):
    return f'{x:.{d}f}'.replace('.', ',')

def save(img, path):
    for q in (85, 80, 75, 70, 64, 58, 52):
        img.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
        if os.path.getsize(path) <= 600_000:
            break
    print(path, img.size, os.path.getsize(path), 'q', q)

G = 24
PCW = 1000                       # 1440 -> 1000 (69,4 %)
TH = 1000                        # telefón 2532 px -> 1000 px výšky
for shot, (nazov, chyba) in KARTY.items():
    r = rows[shot]
    pc = Image.open(os.path.join(OUT, 'raw', f'pc1-{shot}.png')).convert('RGB')
    pc = pc.resize((PCW, round(pc.height * PCW / pc.width)), Image.LANCZOS)
    tel = Image.open(os.path.join(OUT, 'raw', f'tel390-{shot}.png')).convert('RGB')
    tel = tel.resize((round(tel.width * TH / tel.height), TH), Image.LANCZOS)
    rm = Image.open(os.path.join(OUT, 'ramy', f'{shot}.jpg')).convert('RGB')
    RW = 420
    rm = rm.resize((RW, round(rm.height * RW / rm.width)), Image.LANCZOS)
    HEAD = 100
    W = G + PCW + G + tel.width + G
    H = HEAD + TH + 60 + G
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    a, b, c = r['f_pc1'], r['f_pc2'], r['f_tel390']
    d.text((G, 18), f'{nazov}: počítač vs. telefón (ľahký režim)', font=FB, fill=FG)
    pct_tel = r['tel390']['pct']
    sub = (f'Plocha pôvodnej fotky: PC {fmt(r["pc"]["pct"])} %  ·  telefón {fmt(pct_tel)} %'
           + ('' if r['same_src'] else ' (iná fotka)')
           + (f'  ·  z toho, čo vidno na PC, vidno na telefóne {fmt(r["tel390"]["ofpc"], 0)} %' if r['same_src'] else ''))
    d.text((G, 60), sub, font=FN, fill=MUT)
    y0 = HEAD
    img.paste(pc, (G, y0))
    d.text((G, y0 + pc.height + 8), 'POČÍTAČ 1440×900, ?film=off (zmenšené na 69 %)', font=FH, fill=FG)
    d.text((G, y0 + pc.height + 36), f'{a["src"]} {a["fw"]}×{a["fh"]}: {fmt(a["pxcss"], 2)} px fotky na CSS px pri DPR 1;  '
           f'DPR 2: {b["src"]}, {fmt(b["pxcss"], 2)}', font=FN, fill=MUT)
    # rámy na pôvodnej fotke + čo chýba
    ry = y0 + pc.height + 76
    img.paste(rm, (G, ry))
    tx = G + RW + 20
    d.text((tx, ry), 'Čo z fotky vidno', font=FH, fill=FG)
    d.text((tx, ry + 30), 'zelená = PC, oranžová = telefón 390, žltá = 430,', font=FN, fill=MUT)
    d.text((tx, ry + 54), 'modrá = PC s filmom (WebGL, presah 1,24)', font=FN, fill=MUT)
    d.text((tx, ry + 96), 'Čo na telefóne chýba', font=FH, fill=LAMP)
    for i, line in enumerate(chyba):
        d.text((tx, ry + 126 + i * 26), line, font=FN, fill=FG)
    x = G + PCW + G
    img.paste(tel, (x, y0))
    d.text((x, y0 + TH + 8), 'TELEFÓN 390×844, DPR 3', font=FH, fill=FG)
    d.text((x, y0 + TH + 36), f'{c["src"]}: {fmt(c["pxcss"], 2)} px/CSS px', font=FN, fill=MUT)
    save(img, os.path.join(OUT, f'porovnanie-{shot}.jpg'))
