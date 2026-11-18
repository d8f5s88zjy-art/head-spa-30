# Fotky prvej obrazovky úvodu (17. 11. 2026, Lajko: „zachovaj prvú úvodnú obrazovku … aj to, že sa to menilo“): štyri staré
# fotky z img/hd (Pexels, img/FOTKY.md) → img/uvod/uvod-*.avif|webp. Od 18. 11. 2026 (Mário: „k tým úvodným fotkám, čo sa
# menia, treba pridať jednu aj našich stavebnín, tú čo vidieť celý stavebný materiál“) je prvá fotka striedania jeho fotka
# celého dvora predajne (13-dlazba-sklad, pôvodná snímka z e-mailu 1320 × 990, bezstratovo v zdroj/foto-maria/
# dvor-predajne-13.webp, bez úpravy tónu) → img/uvod/uvod-predajna-*. Len orez, zmenšenie (Lanczos) a prevod formátu; nič sa
# nedokresľuje, netónuje ani nezväčšuje (výrez užší než cieľová šírka sa uloží v pôvodnej šírke).
#   /usr/bin/python3 -I zdroj/uvod_snimky.py .             – vyrobí súbory (AVIF kvalita QA=42, WebP QW=62)
#   /usr/bin/python3 -I zdroj/uvod_snimky.py . uvod-predajna – len vybrané fotky
#   /usr/bin/python3 -I zdroj/uvod_snimky.py . --kontrola  – len overí výrezy (zakázané oblasti), nič nezapisuje
# Zakázané oblasti (pravidlo: v úvode žiadne vozidlo a nič, čo do Nitry zjavne nepatrí): výrez sa ich nesmie ani dotknúť.
# build.py (kontrola_uvodu) volá kontrola() pri každom behu, takže zmena výrezu cez nákladiak alebo palmu build zastaví.
import os, sys

# zdroj (v img/hd, ak nie je uvedená cesta): (šírka, výška) súboru, zakázané oblasti (x0, y0, x1, y1, čo tam je)[, cesta]
ZDROJE = {
    # dvor predajne: dve vozidlá – nákladné auto vľavo (korba, kolesá, náklad na korbe) a modré nákladné auto v strede
    # dvora pri žltých paletách; oblasti sú s rezervou 4–8 px okolo vozidla; pri pravom okraji je polopriehľadný posuvník
    # Mailu (x 1302–1311, y 430–677), preto fotka končí na x 1296
    'dvor-predajne-13': ((1320, 990), [(0, 245, 210, 604, 'nákladné auto vľavo'), (798, 190, 908, 304, 'modré nákladné auto v strede'),
                                       (1298, 0, 1320, 990, 'posuvník Mailu pri pravom okraji snímky (nie je súčasť fotky)')],
                         'zdroj/foto-maria/dvor-predajne-13.webp'),
    'hero':          ((2400, 1600), [(1500, 300, 2060, 540, 'nákladné auto'), (1960, 40, 2080, 150, 'modrý sud')]),
    'stavba':        ((2400, 1347), []),
    'murar':         ((2400, 1599), []),
    'strecha-praca': ((2400, 1600), [(1260, 0, 2400, 1600, 'palma')]),
}
# názov: (zdroj, široký výrez pre počítač a tablet (x0, y0, x1, y1), úzky výrez pre telefón)
OREZY = {
    # telefón a tablet na výšku: celý dvor medzi oboma autami (sklad, rad farebných paliet, dvor, dlažba v popredí);
    # počítač: pod modrým autom (y ≥ 306) a vpravo od nákladného (x ≥ 214) – dlažba, palety a rad tovaru pri hornom okraji
    'uvod-predajna': ('dvor-predajne-13', (214, 306, 1296, 990), (214, 0, 794, 990)),
    'uvod-palety':  ('hero',          (0, 560, 2400, 1600), (240, 0, 990, 1600)),
    'uvod-stavba':  ('stavba',        (0, 0, 2400, 1347),   (720, 0, 1430, 1347)),
    'uvod-murar':   ('murar',         (0, 0, 2400, 1599),   (780, 0, 1530, 1599)),
    'uvod-strecha': ('strecha-praca', (0, 330, 1230, 1600), (300, 330, 1050, 1600)),
}
SIROKE, UZKE = (1280, 1920), (480, 750)


def _prienik(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def kontrola():
    """Zoznam chýb: výrez mimo fotky alebo cez zakázanú oblasť (prázdny = v poriadku)."""
    chyby = []
    for n, (z, *vyrezy) in OREZY.items():
        (w, h), zakaz = ZDROJE[z][:2]
        for v in vyrezy:
            if not (0 <= v[0] < v[2] <= w and 0 <= v[1] < v[3] <= h):
                chyby.append(f'{n}: výrez {v} je mimo fotky {z} {w} × {h}')
            for zk in zakaz:
                if _prienik(v, zk):
                    chyby.append(f'{n}: výrez {v} zasahuje do zakázanej oblasti fotky {z} ({zk[4]}, {zk[:4]})')
    return chyby


def vyrob(koren):
    from PIL import Image
    src_dir, out = os.path.join(koren, 'img/hd'), os.path.join(koren, 'img/uvod')
    os.makedirs(out, exist_ok=True)
    qa, qw = int(os.environ.get('QA', 42)), int(os.environ.get('QW', 62))

    def uloz(im, base):
        im.save(base + '.avif', quality=qa, speed=4)
        im.save(base + '.webp', quality=qw, method=6)
        print(base, im.size, os.path.getsize(base + '.avif'), os.path.getsize(base + '.webp'))

    ktore = [a for a in sys.argv[2:] if not a.startswith('-')]   # voliteľne len niektoré fotky (napr. uvod-predajna)
    for n, (z, s, u) in OREZY.items():
        if ktore and n not in ktore:
            continue
        cesta = ZDROJE[z][2] if len(ZDROJE[z]) > 2 else os.path.join(src_dir, z + '.webp')
        src = Image.open(os.path.join(koren, cesta) if len(ZDROJE[z]) > 2 else cesta).convert('RGB')
        if src.size != ZDROJE[z][0]:
            sys.exit(f'{z}.webp má {src.size}, čakané {ZDROJE[z][0]} – zakázané oblasti treba prepočítať')
        for vyrez, sirky, pred in ((s, SIROKE, ''), (u, UZKE, 't-')):
            v = src.crop(vyrez)
            for sw in sirky:
                if sw >= v.width:   # nezväčšovať: užší výrez ostane vo svojej šírke (napr. strecha 1230)
                    uloz(v, os.path.join(out, f'{n}-{pred}{v.width}'))
                    break
                uloz(v.resize((sw, round(v.height * sw / v.width)), Image.LANCZOS), os.path.join(out, f'{n}-{pred}{sw}'))


if __name__ == '__main__':
    ch = kontrola()
    for c in ch:
        print('CHYBA', c)
    if ch:
        sys.exit(1)
    if '--kontrola' in sys.argv:
        print('výrezy úvodu: OK (' + str(len(OREZY)) + ' fotiek, zakázané oblasti mimo výrezov)')
    else:
        vyrob(sys.argv[1] if len(sys.argv) > 1 else '.')
