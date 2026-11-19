#!/usr/bin/env python3
"""Návod pre laika k balíku FORPSI=linux: z jedného zdroja (nasadenie/navod-forpsi.md) vyrobí
  NAVOD-FORPSI.txt   riadky do 72 znakov, UTF-8 s BOM a CRLF (Poznámkový blok vo Windows),
  NAVOD-FORPSI.html  jeden stĺpec, veľké písmo; z neho nasadenie/navod-pdf.cjs spraví PDF so stranou na šírku telefónu.
Použitie: python3 -I nasadenie/navod_forpsi.py <navod-forpsi.md> <výstupný priečinok> <casti.tsv>
casti.tsv (píše balik-forpsi.sh): číslo časti, počet súborov, veľkosť ZIPu v bajtoch, obsah.
Značky zdroja (zámerne len tieto): # ## ### nadpisy · prázdny riadok oddeľuje odseky · „- “ odrážka · „1. “ číslovaný krok ·
„[ ] “ políčko · „!> “ výstraha · „ok> “ je to dobre, keď · „ak> “ keď nie · „veta> “ hotová veta na odpísanie ·
„| a | b |“ dvojstĺpcový riadok · **tučné** · {N} počet častí · {CASTI} zoznam častí s veľkosťami."""
import html, re, sys, textwrap

ZDROJ, OUT, TSV = sys.argv[1], sys.argv[2], sys.argv[3]
casti = [l.rstrip('\n').split('\t') for l in open(TSV, encoding='utf-8') if l.strip()]
N = len(casti)
mb = lambda b: f'{int(b) / 1e6:.1f}'.replace('.', ',')
zoznam = '\n'.join(f'- **richtarik-forpsi-cast-{i}-z-{N}.zip** – {mb(v)} MB ({o})' for i, n, v, o in casti)
zoznam = f'Nový web v {N} častiach, spolu {mb(sum(int(c[2]) for c in casti))} MB. Ak má stiahnutý súbor inú veľkosť, stiahni ho znova.\n\n' + zoznam
text = open(ZDROJ, encoding='utf-8').read().replace('{CASTI}', zoznam).replace('{N}', str(N))
if re.search(r'\{[A-Z_]+\}', text): sys.exit('CHYBA: v návode ostala nevyplnená značka')

# rozbor na bloky: (druh, text) alebo ('tabulka', [(a, b), …])
bloky = []
for odsek in re.split(r'\n\s*\n', text.strip()):
    riadky = odsek.split('\n')
    if riadky[0].startswith('|'):
        bloky.append(('tabulka', [tuple(c.strip() for c in r.strip().strip('|').split('|', 1)) for r in riadky])); continue
    for r in riadky:
        m = re.match(r'(#{1,3}) (.*)|(- |\[ \] |!> |ok> |ak> |veta> )(.*)|(\d+)\. (.*)', r)
        if not m: bloky.append(('p', r))
        elif m.group(1): bloky.append(('h' + str(len(m.group(1))), m.group(2)))
        elif m.group(3): bloky.append(({'- ': 'li', '[ ] ': 'box', '!> ': 'pozor', 'ok> ': 'ok', 'ak> ': 'ak', 'veta> ': 'veta'}[m.group(3)], m.group(4)))
        else: bloky.append(('ol', (m.group(5), m.group(6))))

# --- TXT ---
bez = lambda s: s.replace('**', '')
def zalom(s, prvy='', dalsi=''):
    return textwrap.fill(bez(s), 72, initial_indent=prvy, subsequent_indent=dalsi, break_long_words=False, break_on_hyphens=False)
t = []; pred = ''
for druh, b in bloky:
    if pred in ('li', 'box') and druh not in ('li', 'box'): t += ['']   # prázdny riadok za zoznamom
    pred = druh
    if druh == 'h1': t += [bez(b).upper(), '=' * min(72, len(b)), '']
    elif druh == 'h2': t += ['', '', zalom(b.upper()), '-' * min(72, len(b)), '']
    elif druh == 'h3': t += ['', zalom(b), '']
    elif druh == 'p': t += [zalom(b), '']
    elif druh == 'li': t += [zalom(b, '  • ', '    ')]
    elif druh == 'box': t += [zalom(b, '  [ ] ', '      ')]
    elif druh == 'ol': t += [zalom(b[1], f'  {b[0]}. ', '     '), '']
    elif druh == 'pozor': t += [zalom(b, '  !! POZOR: ', '     '), '']
    elif druh == 'ok': t += [zalom(b, '  ✔ Je to dobre, keď: ', '    '), '']
    elif druh == 'ak': t += [zalom(b, '  ✘ Keď nie: ', '    '), '']
    elif druh == 'veta': t += [zalom('„' + b + '“', '      ', '      '), '']
    elif druh == 'tabulka':
        for a, c in b[1:]: t += [zalom(a, '  ▸ ', '    '), zalom(c, '      → ', '        '), '']
txt = re.sub(r'\n{3,}', '\n\n', '\n'.join(t)).strip() + '\n'
dlhe = [r for r in txt.split('\n') if len(r) > 72]
if dlhe: sys.exit('CHYBA: riadok návodu dlhší ako 72 znakov: ' + dlhe[0])
open(OUT + '/NAVOD-FORPSI.txt', 'w', encoding='utf-8-sig', newline='\r\n').write(txt)

# --- HTML (jeden stĺpec; tlač = strana 90 × 160 mm, na telefóne čitateľná na celú šírku) ---
def r(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return re.sub(r'(https?://[^\s<)]+[^\s<).,])', r'<span class="adr">\1</span>', s)
h = []; otvorene = None
def zavri():
    global otvorene
    if otvorene: h.append(f'</{otvorene}>'); otvorene = None
def otvor(znacka, trieda=''):
    global otvorene
    if otvorene != znacka: zavri(); h.append(f'<{znacka}{trieda}>'); otvorene = znacka
for druh, b in bloky:
    if druh in ('li', 'box'):
        otvor('ul', ' class="policka"' if druh == 'box' else '') if not (otvorene == 'ul') else None
        h.append(f'<li class="{druh}">{r(b)}</li>'); continue
    if druh == 'ol':
        otvor('ol'); h.append(f'<li value="{b[0]}">{r(b[1])}</li>'); continue
    if druh in ('pozor', 'ok', 'ak', 'veta') and otvorene == 'ol':
        # výstraha alebo „je to dobre, keď“ medzi číslovanými krokmi: zoznam pokračuje ďalším číslom
        zavri()
    else: zavri()
    if druh == 'h1': h.append(f'<h1>{r(b)}</h1>')
    elif druh == 'h2': h.append(f'<h2{" class=krok" if b.startswith("Krok") else ""}>{r(b)}</h2>')
    elif druh == 'h3': h.append(f'<h3>{r(b)}</h3>')
    elif druh == 'p': h.append(f'<p>{r(b)}</p>')
    elif druh == 'pozor': h.append(f'<p class="pozor"><b>Pozor.</b> {r(b)}</p>')
    elif druh == 'ok': h.append(f'<p class="ok"><b>Je to dobre, keď:</b> {r(b)}</p>')
    elif druh == 'ak': h.append(f'<p class="ak"><b>Keď nie:</b> {r(b)}</p>')
    elif druh == 'veta': h.append(f'<blockquote>„{r(b)}“</blockquote>')
    elif druh == 'tabulka':
        h.append('<dl>' + ''.join(f'<div><dt>{r(a)}</dt><dd>{r(c)}</dd></div>' for a, c in b[1:]) + '</dl>')
zavri()
CSS = '''
@page { size: 90mm 160mm; margin: 7mm 6mm 8mm; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, "DejaVu Sans", sans-serif; font-size: 12.5pt; line-height: 1.42;
  color: #161616; background: #fff; margin: 0 auto; padding: 4mm; max-width: 34em; overflow-wrap: break-word; }
@media print { body { padding: 0; max-width: none; } }
h1 { font-size: 19pt; line-height: 1.15; margin: 0 0 4mm; }
h2 { font-size: 15pt; line-height: 1.2; margin: 7mm 0 2.5mm; padding-top: 3mm; border-top: 2.5pt solid #b42226; break-after: avoid; }
h2.krok { background: #b42226; color: #fff; border: 0; border-radius: 2mm; padding: 2.5mm 3mm; }
h3 { font-size: 13pt; margin: 5mm 0 2mm; break-after: avoid; }
h1, h2, h3 { break-inside: avoid; }
p { margin: 0 0 2.6mm; }
ul, ol { margin: 0 0 3mm; padding-left: 6.5mm; }
li { margin-bottom: 1.6mm; }
ul.policka { list-style: none; padding-left: 0; }
ul.policka li.box { padding-left: 8mm; position: relative; }
ul.policka li.box::before { content: ""; position: absolute; left: 0; top: .15em; width: 4.6mm; height: 4.6mm; border: 1.2pt solid #161616; border-radius: .8mm; }
.pozor, .ok, .ak, blockquote { border-radius: 2mm; padding: 2.5mm 3mm; margin: 0 0 3mm; break-inside: avoid; }
.pozor { background: #fdecea; border-left: 3pt solid #b42226; }
.ok { background: #e9f5ea; border-left: 3pt solid #2e7d32; }
.ak { background: #fff4d9; border-left: 3pt solid #b26a00; }
blockquote { background: #eef2f7; border-left: 3pt solid #546e7a; font-style: italic; }
dl { margin: 0 0 3mm; }
dl div { border: 1pt solid #c9c4ba; border-radius: 2mm; padding: 2.2mm 3mm; margin-bottom: 2mm; break-inside: avoid; }
dt { font-weight: 700; margin-bottom: 1mm; }
dd { margin: 0; }
.adr { overflow-wrap: anywhere; }
'''
open(OUT + '/NAVOD-FORPSI.html', 'w', encoding='utf-8').write(
    '<!doctype html>\n<html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    '<meta name="robots" content="noindex"><title>Stavebniny Richtárik – ako dať nový web na Forpsi</title><style>' + CSS + '</style></head><body>\n'
    + '\n'.join(h) + '\n</body></html>\n')
print(f'návod pre laika: {N} častí, {len(bloky)} blokov, TXT {txt.count(chr(10))} riadkov (najdlhší {max(map(len, txt.split(chr(10))))} znakov)')
