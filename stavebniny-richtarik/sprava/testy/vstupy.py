#!/usr/bin/env python3
"""Vstupné súbory pre testy správy (fotky s EXIF, PDF, útoky). Potrebuje ImageMagick (convert).
  python3 sprava/testy/vstupy.py <prázdny priečinok>"""
import os, struct, subprocess, sys
D = sys.argv[1]; os.makedirs(D, exist_ok=True)
def c(*a): subprocess.run(['convert', *a], check=True)
def s_exif(zdroj, ciel):
    """JPEG s EXIF: orientácia 6 (otočiť), výrobca a GPS (48° 16′ 58″ N, 18° 5′ 21″ E)."""
    def ifd(entries, base):
        out = struct.pack('>H', len(entries)); data = b''; off = base + 2 + len(entries) * 12 + 4
        for tag, typ, cnt, val in entries:
            if len(val) <= 4: out += struct.pack('>HHI', tag, typ, cnt) + val.ljust(4, b'\0')
            else: out += struct.pack('>HHII', tag, typ, cnt, off + len(data)); data += val + (b'\0' if len(val) % 2 else b'')
        return out + struct.pack('>I', 0) + data
    rac = lambda *v: b''.join(struct.pack('>II', a, 1) for a in v)
    gps_off = 8 + 2 + 3 * 12 + 4 + 8
    ifd0 = ifd([(0x0112, 3, 1, struct.pack('>H', 6)), (0x010f, 2, 8, b'Telefon\0'), (0x8825, 4, 1, struct.pack('>I', gps_off))], 8)
    gps = ifd([(1, 2, 2, b'N\0'), (2, 5, 3, rac(48, 16, 58)), (3, 2, 2, b'E\0'), (4, 5, 3, rac(18, 5, 21))], gps_off)
    exif = b'Exif\x00\x00MM\x00\x2a' + struct.pack('>I', 8) + ifd0 + gps
    j = open(zdroj, 'rb').read()
    open(ciel, 'wb').write(j[:2] + b'\xff\xe1' + struct.pack('>H', len(exif) + 2) + exif + j[2:])
p = lambda m: os.path.join(D, m)
c('-size', '4000x3000', 'xc:#efe9e0', '-fill', '#c1382c', '-draw', 'rectangle 0,0 4000,400', '-fill', '#141210', '-draw', 'rectangle 200,600 1800,1600', p('_plocha.jpg'))
s_exif(p('_plocha.jpg'), p('letak.jpg'))
c('-size', '4000x3000', 'plasma:fractal', '-blur', '0x1', '-quality', '90', p('_velky.jpg'))
s_exif(p('_velky.jpg'), p('velky.jpg'))
c('-size', '300x300', 'xc:black', p('mala.png'))
c('-size', '12001x100', 'xc:white', p('bomba.png'))
c('-size', '595x842', 'xc:white', p('letak.pdf'))
open(p('zly.pdf'), 'wb').write(b'%PDF-1.4\n1 0 obj << /Type /Catalog /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n')
open(p('shell.jpg'), 'wb').write(b'<?php echo "BEZI"; ?>')
open(p('polyglot.jpg'), 'wb').write(open(p('_plocha.jpg'), 'rb').read() + b'<?php echo "BEZI"; ?>')
open(p('obr.svg'), 'wb').write(b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
open(p('sonda.php'), 'wb').write(b"<?php echo 'BE'.'ZI';")
for m in ('_plocha.jpg', '_velky.jpg'): os.remove(p(m))
print('vstupy:', ' '.join(sorted(os.listdir(D))))
