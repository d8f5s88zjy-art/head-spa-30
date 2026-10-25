from PIL import Image, ImageDraw, ImageFont
import os, sys
os.chdir(sys.argv[1])
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(s, b=False): return ImageFont.truetype(FB if b else F, s)
BG = (24, 22, 20); TX = (240, 233, 221); MUT = (170, 160, 146); PRED = (120, 160, 220); PO = (230, 120, 50)
def wrap(d, text, f, w):
    out, line = [], ''
    for word in text.split(' '):
        t = (line + ' ' + word).strip()
        if d.textlength(t, font=f) <= w: line = t
        else: out.append(line); line = word
    out.append(line); return out
def tile(path, size, crop=None):
    im = Image.open(path).convert('RGB')
    if crop: im = im.crop(crop)
    k = min(size[0] / im.width, size[1] / im.height)
    if crop and k > 1: k = min(k, 2)
    elif k > 1: k = 1
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
def harok(nazov, nadpis, podnadpis, riadky, tw, th, cap_h, out_q=84):
    gap = 18; cols = max(len(r) for r in riadky)
    W = cols * tw + (cols + 1) * gap; head = 110
    H = head + len(riadky) * (th + cap_h + gap) + gap
    can = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(can)
    d.text((gap, 18), nadpis, font=font(34, True), fill=TX)
    d.text((gap, 64), podnadpis, font=font(19), fill=MUT)
    y = head
    for r in riadky:
        x = gap
        for it in r:
            if it is None: x += tw + gap; continue
            stitok, popis, img = it
            if isinstance(img, str):
                d.rectangle([x, y, x + tw - 1, y + th - 1], outline=(70, 66, 60), width=2)
                for i, l in enumerate(wrap(d, img, font(20), tw - 40)): d.text((x + 20, y + th // 2 - 40 + i * 28), l, font=font(20), fill=MUT)
            else:
                ox = x + (tw - img.width) // 2; can.paste(img, (ox, y + (th - img.height) // 2))
            col = PRED if stitok.startswith('PRED') else PO
            d.rectangle([x, y + th + 8, x + 12, y + th + 30], fill=col)
            d.text((x + 20, y + th + 6), stitok, font=font(21, True), fill=col)
            for i, l in enumerate(wrap(d, popis, font(17), tw - 4)): d.text((x, y + th + 38 + i * 23), l, font=font(17), fill=TX)
            x += tw + gap
        y += th + cap_h + gap
    can.save(nazov, 'JPEG', quality=out_q, optimize=True, progressive=True)
    print(nazov, can.size, os.path.getsize(nazov), 'B')

# TELEFÓN 390×844 @3
T = (330, 714)
r1 = [
 ('PRED · pokoj', 'Úvod 5,8 s po načítaní, f624ee8. Bez tlačidla.', tile('pred-telefon-pokoj.png', T)),
 ('PO · pokoj', 'HEAD 6f8c47c. Pixelovo zhodné s PRED mimo tlačidla (0 px rozdiel mimo rámu tlačidla + 40 px).', tile('po-telefon-pokoj.png', T)),
 ('PRED · stred stránky', 'Služby, 9 s po načítaní + 5 s pokoj. Vpravo dole Zavolať a Rezervovať termín.', tile('pred-telefon-r-stred.png', T)),
 ('PO · tlačidlo', 'Rovnaká poloha. Nové tlačidlo 46 px vľavo dole, 16 px od okraja, v jednej línii so spodnou lištou. Inak 0 px rozdiel.', tile('po-telefon-r-stred.png', T)),
 ('PO · otvorený panel', 'Ťuknutie: spodný panel 390×301 px, šírka stránky 390 = 390 (bez posunu), fokus na „Rezervovať“.', tile('po-telefon-panel.png', T)),
 ('PO · „koľko stojí strih“', 'Odpoveď „Pánsky strih 18 €“, zdroj „zo stránky“, odkazy Rezervovať termín a Celý cenník.', tile('po-telefon-cena.png', T)),
 ('PO · „strihate aj damy“', 'Odovzdanie: „Dámske strihy na webe neuvádzame. Spýtaj sa recepcie…“ + Zavolať, Napísať e-mail.', tile('po-telefon-damy.png', T)),
]
r2 = [
 ('PO · angličtina', 'Po prepnutí jazyka v menu: „Front desk“, otázka „how much is a haircut“ → Men\'s haircut 18 €.', tile('po-telefon-jazyk-en.png', T)),
 ('PO · ukrajinčina', '„Рецепція“, otázka po ukrajinsky → Чоловіча стрижка 18 €. Šírka 390 = 390.', tile('po-telefon-jazyk-uk.png', T)),
 ('PO · ponuka jazyka', 'Prehliadač en-US: prúžok „This page is also in English“ (z 58) 22 px nad tlačidlom, bez prekrytia.', tile('po-telefon-ponuka-jazyka-uvod.png', T)),
 ('PO · dlhý rozhovor', '7 otázok, log sa skroluje vnútri panela. Ťah na začiatku logu posunul stránku 5304 → 4242 px (S7).', tile('po-telefon-panel-dlhy.png', T)),
 ('PO · výrez tlačidla', 'Spodný okraj pri DPR 3: kruh 46 px vľavo, vpravo štvorcové Zavolať 46 px a Rezervovať termín. Rozdielny tvar, rovnaká línia.', tile('po-telefon-r-stred.png', (330, 330), crop=(0, 2190, 1170, 2532))),
 ('PO · fokus (D8)', 'Otvorenie klávesom: obrys 2 px fokusu prvej voľby je vľavo orezaný (overflow-x: auto na .rc-chips).', tile('po-telefon-fokus.png', (330, 330))),
 ('PO · voľby po znovuotvorení', 'Po Tab na „Zavolať“, Esc a novom ťuknutí ostal rad posunutý o 149 px: fokus je na „Rezervovať“ mimo obrazovky (x = −133).', tile('po-telefon-volby-znova.png', (330, 330))),
]
harok('pred-po-telefon.jpg', 'BARBERSHOP 30 – Recepcia: telefón 390×844, DPR 3, dotyk',
      'PRED = f624ee8 (bez recepcie), PO = HEAD 6f8c47c vetvy barbershop-recepcia. Chromium 1194 (headless, swiftshader), 25. 10. 2026. Modrá = PRED, oranžová = PO.',
      [r1, r2], T[0], T[1], 140)

# POČÍTAČ 1440×900
P = (720, 450)
rr = [
 [('PRED · pokoj', 'Úvod 5,8 s po načítaní, f624ee8.', tile('pred-pocitac-pokoj.png', P)),
  ('PO · pokoj', 'HEAD 6f8c47c. Rozdiel len v ráme tlačidla vpravo dole (1344–1400 × 821–876), inde 0 px.', tile('po-pocitac-pokoj.png', P))],
 [('PRED · stred stránky', 'Služby, 9 s po načítaní + 5 s pokoj.', tile('pred-pocitac-r-stred.png', P)),
  ('PO · tlačidlo', 'Tlačidlo 56 px, 40 px sprava a 24 px zdola. Mimo neho 0 px rozdiel.', tile('po-pocitac-r-stred.png', P))],
 [('PO · otvorený panel', 'Panel 360×359 px vpravo dole nad tlačidlom, šírka stránky 1440 = 1440, nadpis „Recepcia“, 5 volieb.', tile('po-pocitac-panel.png', P)),
  ('PO · „koľko stojí strih“', '„Pánsky strih 18 €“, „zo stránky“, odkazy Rezervovať termín a Celý cenník.', tile('po-pocitac-cena.png', P))],
 [('PO · „strihate aj damy“', 'Odovzdanie na telefón a e-mail, žiadna vymyslená odpoveď.', tile('po-pocitac-damy.png', P)),
  ('PO · film zapnutý (S3)', 'Výrez vpravo dole (360×169 px, 2× zväčšený), úvod s ?film=on: čierny pás filmu (z 38) prekrýva 48 z 56 px tlačidla (z 36); kliknutie ho stále otvorí.', tile('po-pocitac-film-uvod.png', P, crop=(1080, 731, 1440, 900)))],
]
harok('pred-po-pocitac.jpg', 'BARBERSHOP 30 – Recepcia: počítač 1440×900',
      'PRED = f624ee8 (bez recepcie), PO = HEAD 6f8c47c. Chromium 1194 (headless, swiftshader), 25. 10. 2026. Modrá = PRED, oranžová = PO.',
      rr, P[0], P[1], 80)
