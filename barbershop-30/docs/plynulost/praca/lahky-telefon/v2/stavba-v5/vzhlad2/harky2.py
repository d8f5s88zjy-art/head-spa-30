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


H = 'HEAD 854e849'
# TELEFÓN 390×844 @3
T = (330, 714)
NIE = 'Na f624ee8 recepcia neexistuje – tlačidlo ani panel nie sú, nie je čo otvoriť.'
r1 = [
 ('PRED · pokoj', 'Úvod, f624ee8 (8 s čakanie na tlačidlo, ktoré nepríde, + 3,5 s). Úvod už stojí.', tile('v2-pred-telefon-pokoj.png', T)),
 ('PO · pokoj', H + '. Mimo rámu tlačidla + 40 px rozdiel 0 px (PIL, prah 24).', tile('v2-po-telefon-pokoj.png', T)),
 ('PRED · stred stránky', 'Služby. Vpravo dole Zavolať a Rezervovať termín, vľavo dole nič.', tile('v2-pred-telefon-tlacidlo.png', T)),
 ('PO · tlačidlo', 'Rovnaká poloha: kruh 46 px vľavo dole (x 16, y 782), z-index 39. Inak 0 px rozdiel.', tile('v2-po-telefon-tlacidlo.png', T)),
 ('PRED · otvorený panel', NIE, NIE),
 ('PO · otvorený panel', 'Ťuknutie: list 390×301 px, stránka stojí (scrollY 5304 = 5304, šírka 390 = 390), body overflow hidden.', tile('v2-po-telefon-panel.png', T)),
 ('PO · „koľko stojí strih“', 'Výrez cenníka: nadpis Strih, zvýraznený Pánsky strih 40 min 18 €, susedný riadok. Celá bublina v logu, nad vstupom.', tile('v2-po-telefon-cena.png', T)),
 ('PO · „strih a melír“', '„Myslíš toto?“ – 3 voľby + Celý cenník + Zavolať. Voľby majú 40 px výšky, pod 44 px (V6).', tile('v2-po-telefon-volby.png', T)),
 ('PO · „strihate aj damy“', 'Odovzdanie: „Dámske strihy na webe neuvádzame. Spýtaj sa recepcie…“ + Zavolať, Napísať e‑mail.', tile('v2-po-telefon-damy.png', T)),
]
r2 = [
 ('PO · výrez cenníka', 'Čitateľné, bez pretečenia (scrollWidth = clientWidth vo všetkých riadkoch). Tlmený riadok 4,41 : 1 (V8).', tile('v2-po-telefon-cena-vyrez.png', (330, 330))),
 ('PO · voľby s fokusom', 'Shift+Tab zo vstupu: Zavolať → Celý cenník → strih s bradou → farbíte → pánsky strih (zdola nahor), obrys 2 px celý.', tile('v2-po-telefon-volby-fokus.png', (330, 330))),
 ('PO · rad volieb znova (V1)', 'Po 4× Tab (scrollLeft 149), Esc a novom ťuknutí: scrollLeft 0, fokus Rezervovať x 16. Aj po vodorovnom ťahu prstom.', tile('v2-po-telefon-volby-znova.png', (330, 330))),
 ('PO · fokus (D8)', 'Otvorenie klávesom Enter: obrys prvej voľby je celý (6 px od okraja radu, obrys 2 + 3 px).', tile('v2-po-telefon-fokus.png', (330, 330))),
 ('PO · angličtina', 'Front desk, „how much is a haircut“ → výrez Cut / Men\'s haircut 18 €. Staré bubliny ostali po slovensky (V2, zámer).', tile('v2-po-telefon-jazyk-en.png', T)),
 ('PO · ukrajinčina', 'Рецепція, výrez Стрижка / Чоловіча стрижка 18 €. Šírka 390 = 390.', tile('v2-po-telefon-jazyk-uk.png', T)),
 ('PO · dlhý rozhovor (S7)', 'Ťahy cez log aj pozadie: scrollY 5304 stále; po zatvorení 5304. Kritérium 8.4 v prehliadači platí.', tile('v2-po-telefon-panel-dlhy.png', T)),
 ('PO · po ťuknutí na voľbu', 'Prvá voľba „Koľko stojí pánsky strih?“ → otázka v logu a výrez cenníka.', tile('v2-po-telefon-po-volbe.png', T)),
 None,
]
harok('../snimky-v5/pred-po-telefon.jpg', 'BARBERSHOP 30 – Recepcia, kolo 2: telefón 390×844, DPR 3, dotyk',
      'PRED = f624ee8 (bez recepcie), PO = ' + H + ' vetvy barbershop-recepcia. Chromium 1194 (headless, swiftshader), 25. 10. 2026. Modrá = PRED, oranžová = PO.',
      [r1, r2], T[0], T[1], 140, out_q=80)

# POČÍTAČ 1440×900
P = (720, 450)
NIEP = 'Na f624ee8 recepcia neexistuje – tlačidlo ani panel nie sú.'
rr = [
 [('PRED · pokoj', 'Úvod, f624ee8.', tile('v2-pred-pocitac-pokoj.png', P)),
  ('PO · pokoj', H + '. Rozdiel len v ráme tlačidla (1344–1400 × 821–876), inde 0 px.', tile('v2-po-pocitac-pokoj.png', P))],
 [('PRED · stred stránky', 'Služby, 9 s po načítaní + 5 s pokoj.', tile('v2-pred-pocitac-r-stred.png', P)),
  ('PO · tlačidlo', 'Rovnaké časovanie. Tlačidlo 56 px, 40 px sprava, 24 px zdola. Mimo neho 0 px rozdiel.', tile('v2-po-pocitac-r-stred.png', P))],
 [('PO · otvorený panel', 'Panel 360×359 px, pravá hrana 1400 = tlačidlo 1400 (D2), spodok 808 nad tlačidlom 820. Šírka 1440 = 1440.', tile('v2-po-pocitac-panel.png', P)),
  ('PO · „koľko stojí strih“', 'Výrez cenníka v bubline 287 px, bez pretečenia. Odoslať je pod vstupom (formulár 92 px, V7).', tile('v2-po-pocitac-cena.png', P))],
 [('PO · „strih a melír“', '„Myslíš toto?“: 3 voľby + Celý cenník + Zavolať, výška 40 px.', tile('v2-po-pocitac-volby.png', P)),
  ('PO · „strihate aj damy“', 'Odovzdanie na telefón a e‑mail, žiadna vymyslená odpoveď.', tile('v2-po-pocitac-damy.png', P))],
 [('PO · film, úvod (S3)', 'Výrez vpravo dole, 2× zväčšený, ?film=on: tlačidlo (z 39) je nad pásom filmu (z 38), celé viditeľné.', tile('v2-po-pocitac-film-uvod-vyrez.png', P)),
  ('PO · film, ulica (S3)', 'Na ulici rovnako: pás pod tlačidlom, elementFromPoint dolného okraja = tlačidlo.', tile('v2-po-pocitac-film-ulica-vyrez.png', P))],
]
harok('../snimky-v5/pred-po-pocitac.jpg', 'BARBERSHOP 30 – Recepcia, kolo 2: počítač 1440×900',
      'PRED = f624ee8 (bez recepcie), PO = ' + H + '. Chromium 1194 (headless, swiftshader), 25. 10. 2026. Modrá = PRED, oranžová = PO.',
      rr, P[0], P[1], 80)
