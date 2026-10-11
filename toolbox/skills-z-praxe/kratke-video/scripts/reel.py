#!/usr/bin/env python3
"""Krátke video (reels, TikTok, YouTube Shorts) zo skutočných záberov a fotiek podniku.

Vstup je scenár JSON (vzor: ../references/scenar-vzor.json), výstup:
  <výstup>.mp4           H.264 High, yuv420p, 30 snímok/s, faststart, AAC len ak je zvuk (okolo -14 LUFS)
  <výstup>-titulka.jpg   titulná snímka (obálka)
  <výstup>.srt           titulky

Spustenie (python3 + ffmpeg s libass, Pillow, fontTools; bez siete):
  python3 -I reel.py scenar.json -o vystup.mp4 [--format 9:16|16:9|1:1] [--zaklad DIR] [--prac DIR] [--nechaj]
  python3 -I reel.py scenar.json --kontrola           # len kontrola textov, súborov, písiem a súhlasov
  python3 -I reel.py --casy-hlasu hlas.m4a            # kde v nahrávke hlasu sú vety (návrh dĺžok záberov)

Nič neuverejňuje a nič nesťahuje. Platené generovanie (hlas, obraz) tu nie je; hlas a hudba sú len súbory,
ktoré dodá majiteľ (hudba s licenciou, hlas s pôvodom).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SKRIPT = Path(__file__).resolve()
SKILL = SKRIPT.parent.parent
ZNACKY = SKILL / 'references' / 'znacky.json'

FORMATY = {'9:16': (1080, 1920), '16:9': (1920, 1080), '1:1': (1080, 1080)}
# bezpečná zóna (podiel obrazu): na výšku TikTok a Instagram kryjú spodok (popis, meno, hudba) a pravý okraj (ikony)
ZONY = {
    '9:16': dict(hore=0.12, dole=0.20, vlavo=0.06, vpravo=0.12),
    '16:9': dict(hore=0.08, dole=0.12, vlavo=0.06, vpravo=0.06),
    '1:1': dict(hore=0.07, dole=0.10, vlavo=0.07, vpravo=0.07),
}
PRIPONY_FOTO = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.bmp'}
PRIPONY_VIDEO = {'.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi'}
SK_ZNAKY = 'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ'
# zväčšenie malých záberov ako v barbershop-30/source/tools/videa.sh: lanczos a jemné doostrenie CAS po zväčšení
SCALE_FLAGS = 'lanczos+accurate_rnd+full_chroma_int'
CAS = 'cas=strength=0.5'
FARBY_709 = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv']
MEDZI = ['-c:v', 'libx264', '-crf', '6', '-preset', 'veryfast', '-pix_fmt', 'yuv420p'] + FARBY_709  # medzivýsledok takmer bez straty
VYSTUP = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level:v', '4.1',
          '-pix_fmt', 'yuv420p', '-bf', '2', '-maxrate', '16M', '-bufsize', '32M'] + FARBY_709
# texty pre zákazníkov: bez pomlčiek em/en dash a bez zmienky o AI (CLAUDE.md, instagram-salon)
VSEOBECNE_ZAKAZANE = [
    ('[\u2013\u2014]', 'chyba', 'pomlčka em dash alebo en dash; použi čiarku, bodku alebo spojovník'),
    (r'\bAI\b|\bA\.I\.|[Uu]mel\w* inteligenc|GPT|ChatGPT|Claude|Higgsfield', 'chyba', 'žiadna zmienka o AI v texte pre zákazníkov'),
]

POZOR = []          # upozornenia (render pokračuje)
NA_POTVRDENIE = []  # čo musí potvrdiť majiteľ pred uverejnením


class Chyba(Exception):
    pass


def pozor(text):
    POZOR.append(text)
    print('POZOR: ' + text, file=sys.stderr)


# ---------------------------------------------------------------- pomocné

def spusti(cmd, cwd=None):
    r = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        chyba = r.stderr.decode('utf-8', 'replace').strip().splitlines()[-15:]
        raise Chyba('príkaz zlyhal: ' + ' '.join(str(c) for c in cmd[:6]) + ' ...\n' + '\n'.join(chyba))
    return r


def potrebne_programy():
    for p in ('ffmpeg', 'ffprobe'):
        if not shutil.which(p):
            raise Chyba(f'chýba program {p} (nainštaluj ffmpeg s libass a libx264)')
    filtre = spusti(['ffmpeg', '-hide_banner', '-filters']).stdout.decode()
    for f in ('ass', 'xfade', 'loudnorm', 'cas', 'overlay'):
        if not re.search(r'\s' + f + r'\s', filtre):
            raise Chyba(f'ffmpeg nemá filter {f} (treba zostavenie s --enable-libass)')


def sonda(cesta):
    r = spusti(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(cesta)])
    d = json.loads(r.stdout)
    v = next((s for s in d['streams'] if s['codec_type'] == 'video'), None)
    a = next((s for s in d['streams'] if s['codec_type'] == 'audio'), None)
    info = {'audio': a is not None, 'dur': float(d['format'].get('duration') or 0)}
    if v:
        w, h = int(v['width']), int(v['height'])
        rot = 0
        for sd in v.get('side_data_list') or []:
            if 'rotation' in sd:
                rot = int(float(sd['rotation']))
        if 'rotate' in (v.get('tags') or {}):
            rot = int(v['tags']['rotate'])
        if abs(rot) % 180 == 90:
            w, h = h, w
        num, den = (v.get('r_frame_rate') or '30/1').split('/')
        info.update(w=w, h=h, fps=float(num) / float(den or 1), pix_fmt=v.get('pix_fmt', ''),
                    codec=v.get('codec_name', ''), trc=v.get('color_transfer', ''),
                    alpha_mode=(v.get('tags') or {}).get('alpha_mode') or (v.get('tags') or {}).get('ALPHA_MODE'))
        if v.get('duration'):
            info['dur'] = float(v['duration'])
    return info


def css_farba(css_text, premenna):
    """Posledná definícia premennej v CSS (neskoršia vyhráva, ako v kaskáde)."""
    hodnoty = re.findall(re.escape(premenna) + r'\s*:\s*([^;}]+)', css_text)
    if not hodnoty:
        return None
    return na_rgb(hodnoty[-1].strip())


def na_rgb(h):
    h = h.strip()
    m = re.fullmatch(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})', h)
    if m:
        x = m.group(1)
        if len(x) == 3:
            x = ''.join(c * 2 for c in x)
        return tuple(int(x[i:i + 2], 16) for i in (0, 2, 4))
    m = re.fullmatch(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+).*\)', h)
    if m:
        return tuple(int(m.group(i)) for i in (1, 2, 3))
    m = re.fullmatch(r'(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', h)   # HEAD SPA: --ink:12,9,6
    if m:
        return tuple(int(m.group(i)) for i in (1, 2, 3))
    return None


def ass_farba(rgb, alfa=0):
    r, g, b = rgb
    return f'&H{alfa:02X}{b:02X}{g:02X}{r:02X}'


def ass_cas(t):
    cs = max(0, int(round(t * 100)))
    return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


def srt_cas(t):
    ms = max(0, int(round(t * 1000)))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def cista_veta(t):
    return t.replace('*', '')


# ---------------------------------------------------------------- scenár a značka

def nacitaj(scenar_cesta, args):
    sc = json.loads(Path(scenar_cesta).read_text(encoding='utf-8'))
    base = Path(scenar_cesta).resolve().parent
    zaklad = Path(args.zaklad).resolve() if args.zaklad else (base / sc.get('zaklad', '.')).resolve()
    fmt = args.format or sc.get('format', '9:16')
    if fmt not in FORMATY:
        raise Chyba(f'neznámy formát {fmt}; povolené: {", ".join(FORMATY)}')
    sc['_zaklad'] = zaklad
    sc['_format'] = fmt
    sc['_fps'] = int(sc.get('fps', 30))
    if not sc.get('zabery'):
        raise Chyba('scenár nemá žiadne zábery (pole "zabery")')
    return sc


def cesta(sc, p):
    p = Path(os.path.expanduser(str(p)))
    return p if p.is_absolute() else (sc['_zaklad'] / p)


def nacitaj_znacku(sc):
    spec = sc.get('znacka', 'barbershop-30')
    vsetky = json.loads(ZNACKY.read_text(encoding='utf-8')) if ZNACKY.exists() else {}
    koren = (ZNACKY.parent / vsetky.get('_koren', '.')).resolve()
    if isinstance(spec, dict):
        zn = spec
    elif spec in vsetky:
        zn = json.loads(json.dumps(vsetky[spec]))
    else:
        raise Chyba(f'neznáma značka {spec}; v {ZNACKY.name} sú: {", ".join(k for k in vsetky if not k.startswith("_"))}')
    for k in ('pisma', 'farby', 'velkosti', 'riadkovanie', 'rozostup', 'linka'):   # scenár môže prepísať časť predvoľby
        if isinstance(sc.get(k), dict):
            zn.setdefault(k, {}).update(sc[k])
    for k in ('stmavenie', 'zarovnanie'):
        if k in sc:
            zn[k] = sc[k]
    zn['_koren'] = koren
    css_text = ''
    if zn.get('css') and (koren / zn['css']).exists():
        css_text = (koren / zn['css']).read_text(encoding='utf-8', errors='replace')
    farby = {}
    for meno, f in zn.get('farby', {}).items():
        rgb = None
        if isinstance(f, dict):
            if f.get('css') and css_text:
                rgb = css_farba(css_text, f['css'])
            if rgb is None and f.get('zaloha'):
                rgb = na_rgb(f['zaloha'])
        else:
            rgb = na_rgb(str(f))
        farby[meno] = rgb or (240, 235, 225)
    zn['_rgb'] = farby
    return zn


# ---------------------------------------------------------------- písma

class Pismo:
    def __init__(self, rola, ttf, rodina, tt):
        self.rola, self.ttf, self.rodina = rola, ttf, rodina
        self.cmap = tt.getBestCmap()
        self.hmtx = tt['hmtx']
        self.upem = tt['head'].unitsPerEm
        os2 = tt['OS/2']
        # libass meria veľkosť písma ako výšku riadka GDI (usWinAscent + usWinDescent), nie ako em
        self.win_a, self.win_d = os2.usWinAscent, os2.usWinDescent
        self.cap = getattr(os2, 'sCapHeight', 0) or int(self.upem * 0.7)
        self.space = self.hmtx[self.cmap.get(32, '.notdef')][0] if 32 in self.cmap else self.upem * 0.25

    def ass_velkost(self, em):
        return em * (self.win_a + self.win_d) / self.upem

    def zostup(self, em):
        return em * self.win_d / self.upem

    def sirka(self, text, em, fsp=0.0):
        s = 0
        for c in text:
            g = self.cmap.get(ord(c))
            s += self.hmtx[g][0] if g else self.upem * 0.55
        return s * em / self.upem + fsp * len(text)

    def chyba_znakov(self, text):
        return sorted({c for c in text if not c.isspace() and ord(c) not in self.cmap})


def priprav_pisma(zn, sc, prac, texty):
    """woff2/ttf/otf značky -> TTF s jedinečným menom v prac/pisma (libass ich tak nájde presne)."""
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        raise Chyba('chýba fontTools (pip install fonttools brotli)')
    cie = prac / 'pisma'
    cie.mkdir(parents=True, exist_ok=True)
    pisma = {}
    nahrady = [f for f in (
        spusti(['fc-match', '-f', '%{file}', 'DejaVu Serif']).stdout.decode() if shutil.which('fc-match') else '',
        spusti(['fc-match', '-f', '%{file}', 'DejaVu Sans']).stdout.decode() if shutil.which('fc-match') else '',
    ) if f]
    for rola in ('nadpis', 'kurziva', 'stitok', 'riadok'):
        p = zn.get('pisma', {}).get(rola)
        src = None
        if p:
            for kandidat in (cesta(sc, p), zn['_koren'] / p):
                if kandidat.exists():
                    src = kandidat
                    break
        if src is None:
            nahr = nahrady[0 if rola in ('nadpis', 'kurziva') else -1] if nahrady else None
            if not nahr:
                raise Chyba(f'písmo pre {rola} nenájdené ({p}) a nie je ani náhrada (fc-match)')
            pozor(f'písmo {rola} ({p}) nenájdené, použité {nahr}; pre značku daj do scenára "pisma"')
            src = Path(nahr)
        try:
            tt = TTFont(str(src))
        except Exception as e:
            raise Chyba(f'písmo {src} sa nedá prečítať ({e}); woff2 potrebuje modul brotli')
        tt.flavor = None
        rodina = 'R30 ' + rola.capitalize()
        n = tt['name']
        for rec in list(n.names):
            if rec.nameID in (1, 2, 4, 6, 16, 17, 21, 22):
                n.removeNames(nameID=rec.nameID)
        for nid, val in ((1, rodina), (2, 'Regular'), (4, rodina), (6, rodina.replace(' ', '') + '-Regular')):
            n.setName(val, nid, 3, 1, 0x409)
            n.setName(val, nid, 1, 0, 0)
        # bez príznakov tučné/kurzíva, aby libass nič nedomýšľal; hrúbka a sklon sú v tvaroch písma
        tt['OS/2'].fsSelection = (tt['OS/2'].fsSelection & ~0b1100001) | 0b1000000
        tt['head'].macStyle = 0
        ttf = cie / (rola + '.ttf')
        tt.save(str(ttf))
        pisma[rola] = Pismo(rola, ttf, rodina, tt)
        pisma[rola].zdroj = src
    # slovenské znaky (aj veľké) a všetky znaky textov musia byť v písme, inak náhrada
    for rola, pismo in list(pisma.items()):
        potrebne = SK_ZNAKY + ''.join(texty.get(rola, []))
        chyba = pismo.chyba_znakov(potrebne)
        if chyba:
            for nahr in nahrady:
                t2 = TTFont(nahr)
                if not [c for c in chyba if ord(c) not in t2.getBestCmap()]:
                    pozor(f'písmo {pismo.zdroj.name} ({rola}) nemá znaky {"".join(chyba)}; použitá náhrada {nahr}')
                    t2.flavor = None
                    rodina = 'R30 ' + rola.capitalize() + ' N'
                    n = t2['name']
                    for nid, val in ((1, rodina), (4, rodina), (6, rodina.replace(' ', '') + '-Regular')):
                        n.setName(val, nid, 3, 1, 0x409)
                    t2['OS/2'].fsSelection = (t2['OS/2'].fsSelection & ~0b1100001) | 0b1000000
                    ttf = cie / (rola + '-n.ttf')
                    t2.save(str(ttf))
                    pisma[rola] = Pismo(rola, ttf, rodina, t2)
                    pisma[rola].zdroj = Path(nahr)
                    break
            else:
                raise Chyba(f'písmo {pismo.zdroj.name} ({rola}) nemá znaky {"".join(chyba)} a náhrada sa nenašla')
    return pisma


# ---------------------------------------------------------------- kontrola obsahu

def kontrola(sc, zn):
    chyby = []
    zakazane = [(v, u, p) for v, u, p in VSEOBECNE_ZAKAZANE]
    zakazane += [(z['vzor'], z.get('uroven', 'chyba'), z.get('preco', '')) for z in zn.get('zakazane', [])]
    for i, z in enumerate(sc['zabery']):
        meno = f'záber {i + 1}'
        for pole in ('stitok', 'text', 'riadok'):
            t = z.get(pole) or ''
            if not t:
                continue
            if re.search(r'[{}\\]', t):
                chyby.append(f'{meno}, {pole}: znaky {{ }} \\ nie sú povolené')
            for vzor, uroven, preco in zakazane:
                m = re.search(vzor, t)
                if m:
                    sprava = f'{meno}, {pole}: „{m.group(0)}“ ({preco})'
                    (chyby.append(sprava) if uroven == 'chyba' else pozor(sprava))
        if z.get('text') and len(cista_veta(z['text'])) > 60:
            pozor(f'{meno}: text má {len(cista_veta(z["text"]))} znakov; na reel stačí jedna krátka veta (do 40)')
        if (z.get('text') or z.get('riadok')) and not z.get('zdroj'):
            pozor(f'{meno}: text bez poľa "zdroj" (odkiaľ je fakt); dopíš súbor a časť')
        src = z.get('src')
        if not src:
            chyby.append(f'{meno}: chýba "src"')
            continue
        p = cesta(sc, src)
        if not p.exists():
            chyby.append(f'{meno}: súbor {p} neexistuje')
            continue
        typ = typ_zaberu(z, p)
        if typ == 'video':
            info = sonda(p)
            od, do = float(z.get('od', 0)), z.get('do')
            do = float(do) if do is not None else info['dur']
            if do > info['dur'] + 0.02 or od >= do:
                chyby.append(f'{meno}: úsek {od} až {do} s mimo videa ({info["dur"]:.2f} s)')
            if 'ludia' not in z:
                pozor(f'{meno}: video bez poľa "ludia" (kto je v zábere a či súhlasil)')
        elif 'trvanie' not in z:
            chyby.append(f'{meno}: fotka potrebuje "trvanie" (s)')
        ludia = str(z.get('ludia', '')).strip()
        if ludia and not ludia.lower().startswith(('nie', 'nikto', 'bez ludi', 'bez ľudí')):
            NA_POTVRDENIE.append(f'súhlas ľudí v zábere {i + 1} ({p.name}): {ludia}')
        if z.get('overlay') and not cesta(sc, z['overlay']).exists():
            chyby.append(f'{meno}: prekrytie {z["overlay"]} neexistuje')
    hudba, hlas = sc.get('hudba'), sc.get('hlas')
    if hudba:
        if not str(hudba.get('licencia', '')).strip():
            chyby.append('hudba bez poľa "licencia" (kto ju dal a na čo smieš použiť); bez licencie hudbu vynechaj')
        elif not cesta(sc, hudba['src']).exists():
            chyby.append(f'hudba {hudba["src"]} neexistuje')
        else:
            NA_POTVRDENIE.append(f'licencia hudby: {hudba["licencia"]}')
    if hlas:
        if not str(hlas.get('povod', '')).strip():
            chyby.append('hlas bez poľa "povod" (nahral majiteľ, alebo služba so súhlasom a rozpočtom majiteľa)')
        elif not cesta(sc, hlas['src']).exists():
            chyby.append(f'hlas {hlas["src"]} neexistuje')
        else:
            NA_POTVRDENIE.append(f'hlas: {hlas["povod"]}')
    return chyby


def typ_zaberu(z, p):
    if z.get('typ') in ('foto', 'video'):
        return z['typ']
    ext = p.suffix.lower()
    if ext in ('.heic', '.heif'):
        raise Chyba(f'{p.name}: HEIC z iPhonu Pillow bez doplnku nečíta; preveď na JPG (alebo v telefóne Fotoaparát, '
                    'Formáty: Najkompatibilnejšie)')
    if ext in PRIPONY_VIDEO:
        return 'video'
    if ext in PRIPONY_FOTO:
        return 'foto'
    raise Chyba(f'neznámy typ súboru {p.name}; daj "typ": "foto" alebo "video"')


# ---------------------------------------------------------------- rozvrh

def rozvrh(sc):
    fps = sc['_fps']
    zab = []
    for i, z in enumerate(sc['zabery']):
        p = cesta(sc, z['src'])
        typ = typ_zaberu(z, p)
        if typ == 'video':
            od = float(z.get('od', 0))
            do = float(z['do']) if z.get('do') is not None else sonda(p)['dur']
            dur = do - od
        else:
            od, dur = 0.0, float(z['trvanie'])
        n = max(2, int(round(dur * fps)))
        prechod = z.get('prechod', 'strih') if i > 0 else 'strih'
        d_in = 0
        if prechod in ('prelinanie', 'prelínanie', 'xfade'):
            d_in = int(round(float(z.get('prechod_dlzka', 0.4)) * fps))
        elif prechod != 'strih':
            raise Chyba(f'záber {i + 1}: prechod "{prechod}" nepoznám (strih alebo prelinanie)')
        zab.append(dict(z=z, i=i, p=p, typ=typ, od=od, n=n, d_in=d_in))
    start = 0
    for k, a in enumerate(zab):
        if k > 0:
            prev = zab[k - 1]
            if a['d_in'] * 2 > min(prev['n'], a['n']):
                raise Chyba(f'záber {k + 1}: prelínanie je dlhšie ako polovica záberu')
            start = prev['start'] + prev['n'] - a['d_in']
        a['start'] = start
    for k, a in enumerate(zab):
        a['d_out'] = zab[k + 1]['d_in'] if k + 1 < len(zab) else 0
    celkom = zab[-1]['start'] + zab[-1]['n']
    return zab, celkom


# ---------------------------------------------------------------- zábery

def drahy_fotky(z, iw, ih, W, H, n):
    """Výrez fotky pre každú snímku (desatinné súradnice, bez zaokrúhľovania na pixely)."""
    a = W / H
    bw, bh = (ih * a, ih) if iw / ih > a else (iw, iw / a)       # najväčší výrez s pomerom výstupu
    fx, fy = (z.get('stred') or [0.5, 0.5])
    pohyb = z.get('pohyb', 'najazd')
    sila = float(z.get('sila', 0.08))

    def obmedz(c, polovica, dlzka):
        return min(max(c, polovica), dlzka - polovica)

    if pohyb in ('najazd', 'odjazd', 'ziadny', 'žiadny', 'staticky'):
        if pohyb in ('najazd', 'odjazd'):
            z0, z1 = z.get('zoom') or ([1.0, 1.0 + sila] if pohyb == 'najazd' else [1.0 + sila, 1.0])
        else:
            z0 = z1 = float(z.get('zoom', 1.0) if not isinstance(z.get('zoom'), list) else z['zoom'][0])
        boxy = []
        for zz in (z0, z1):
            cw, ch = bw / zz, bh / zz
            cx, cy = obmedz(fx * iw, cw / 2, iw), obmedz(fy * ih, ch / 2, ih)
            boxy.append((cx - cw / 2, cy - ch / 2, cw, ch))
        (x0, y0, w0, h0), (x1, y1, w1, h1) = boxy
        out = []
        for i in range(n):
            t = priebeh(z, i / (n - 1))
            w = w0 * (w1 / w0) ** t                     # rovnomerná zmena mierky (logaritmicky)
            s = 0.0 if w0 == w1 else (w0 - w) / (w0 - w1)  # pevný bod obrazu: okraje sa hýbu úmerne
            x, y = x0 + (x1 - x0) * s, y0 + (y1 - y0) * s
            if w0 == w1:
                x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            out.append((x, y, x + w, y + w / a))
        return out
    smery = {'vlavo': (-1, 0), 'vpravo': (1, 0), 'hore': (0, -1), 'dole': (0, 1)}
    if pohyb not in smery:
        raise Chyba(f'pohyb "{pohyb}" nepoznám (najazd, odjazd, vlavo, vpravo, hore, dole, ziadny)')
    dx, dy = smery[pohyb]
    zz = float(z.get('zoom', 1.0) if not isinstance(z.get('zoom'), list) else z['zoom'][0])
    if dx:   # posun o sila * šírka výrezu: musí sa zmestiť do fotky, inak treba viac priblížiť
        zz = max(zz, bw * (1 + sila) / iw)
    else:
        zz = max(zz, bh * (1 + sila) / ih)
    cw, ch = bw / zz, bh / zz
    c0 = (fx * iw - dx * sila * cw / 2, fy * ih - dy * sila * ch / 2)
    c1 = (fx * iw + dx * sila * cw / 2, fy * ih + dy * sila * ch / 2)
    # posun celej dráhy dovnútra fotky (zachová dĺžku posunu)
    def dnu(c0, c1, polovica, dlzka):
        lo, hi = min(c0, c1), max(c0, c1)
        posun = max(0, polovica - lo) - max(0, hi - (dlzka - polovica))
        return c0 + posun, c1 + posun
    cx0, cx1 = dnu(c0[0], c1[0], cw / 2, iw)
    cy0, cy1 = dnu(c0[1], c1[1], ch / 2, ih)
    out = []
    for i in range(n):
        t = priebeh(z, i / (n - 1))
        cx, cy = cx0 + (cx1 - cx0) * t, cy0 + (cy1 - cy0) * t
        out.append((cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
    return out


def priebeh(z, t):
    if z.get('priebeh') == 'plynuly':     # mäkký rozbeh a dobeh (polovica lineárne, polovica smoothstep)
        return 0.5 * t + 0.5 * t * t * (3 - 2 * t)
    return t                              # rovnomerne: najlepšie nadväzuje cez prelínanie


def otvor_fotku(p):
    from PIL import Image, ImageOps
    im = Image.open(p)
    im = ImageOps.exif_transpose(im)            # fotky z telefónu: otočenie podľa EXIF
    icc = im.info.get('icc_profile')
    if icc:                                      # napr. Display P3 z iPhonu -> sRGB (bez tónovania, len prevod farieb)
        try:
            import io
            from PIL import ImageCms
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            im = ImageCms.profileToProfile(im.convert('RGB'), src, ImageCms.createProfile('sRGB'), outputMode='RGB')
        except Exception:
            pass
    return im.convert('RGB')


def render_foto(a, W, H, fps, out):
    from PIL import Image
    z = a['z']
    im = otvor_fotku(a['p'])
    iw, ih = im.size
    boxy = drahy_fotky(z, iw, ih, W, H, a['n'])
    cw_min = min(b[2] - b[0] for b in boxy)
    zvacsenie = W / cw_min
    if zvacsenie > 1.02:
        pozor(f'záber {a["i"] + 1} ({a["p"].name}): fotka sa zväčšuje {zvacsenie:.2f}x, bude mäkšia; použi väčší zdroj alebo menší nájazd')
    # vopred zmenšiť, aby najmenší výrez mal stále 1,5-násobok výstupu (lanczos dobre vyhladí, rýchlejšie)
    f = min(1.0, 1.5 * W / cw_min)
    if f < 0.999:
        im = im.resize((max(1, round(iw * f)), max(1, round(ih * f))), Image.Resampling.LANCZOS)
        fx, fy = im.size[0] / iw, im.size[1] / ih
        boxy = [(b[0] * fx, b[1] * fy, b[2] * fx, b[3] * fy) for b in boxy]
    log = open(str(out) + '.log', 'wb')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(fps), '-i', '-', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
                          *MEDZI, str(out)], stdin=subprocess.PIPE, stderr=log)
    try:
        for b in boxy:   # desatinný výrez + lanczos: pohyb po zlomkoch pixela, bez skákania po celých pixeloch
            p.stdin.write(im.resize((W, H), Image.Resampling.LANCZOS, box=b).tobytes())
        p.stdin.close()
    except BrokenPipeError:
        pass
    if p.wait() != 0:
        raise Chyba(f'kódovanie fotky {a["p"].name} zlyhalo: ' + Path(str(out) + '.log').read_text(errors='replace')[-800:])


def render_video(a, W, H, fps, out, prac, bg):
    z = a['z']
    info = sonda(a['p'])
    dur = a['n'] / fps
    vf = []
    src = a['p']
    ss = a['od']
    if z.get('stabilizuj'):   # vid.stab v dvoch prechodoch ako v sekvencie.sh / videa.sh
        cut = prac / f'z{a["i"]:02d}-cut.mp4'
        trf = f'z{a["i"]:02d}.trf'
        spusti(['ffmpeg', '-v', 'error', '-y', '-ss', f'{ss:.3f}', '-i', str(src), '-t', f'{dur + 0.2:.3f}', '-an',
                '-c:v', 'libx264', '-crf', '8', '-preset', 'veryfast', str(cut)])
        spusti(['ffmpeg', '-v', 'error', '-y', '-i', cut.name, '-vf',
                f'vidstabdetect=shakiness=5:accuracy=15:result={trf}', '-f', 'null', '-'], cwd=prac)
        vf.append(f'vidstabtransform=input={trf}:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic')
        src, ss = cut.name, 0.0
    vf.append(f'fps={fps}')
    if info.get('trc') in ('arib-std-b67', 'smpte2084'):   # HDR z telefónu (HLG, PQ) -> SDR BT.709
        pozor(f'záber {a["i"] + 1}: video je HDR ({info["trc"]}), prevádza sa na SDR; skontroluj farby')
        vf.append('zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,'
                  'zscale=t=bt709:m=bt709:r=tv,format=yuv420p')
    iw, ih = info['w'], info['h']
    a_out = W / H
    if z.get('vypln') == 'pas':   # celé video v strede, okolo plocha farby pozadia značky (bez rozmazaného pozadia)
        k = min(W / iw, H / ih)
        sw, sh = int(iw * k) // 2 * 2, int(ih * k) // 2 * 2
        zv = k
        vf.append(f'scale={sw}:{sh}:flags={SCALE_FLAGS}:out_color_matrix=bt709:out_range=tv')
        if zv > 1.05:
            vf.append(CAS)
        vf.append(f'pad={W}:{H}:{(W - sw) // 2}:{(H - sh) // 2}:color=0x{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}')
    else:
        fx, fy = (z.get('stred') or [0.5, 0.5])
        if iw / ih > a_out:
            cw, ch = ih * a_out, ih
        else:
            cw, ch = iw, iw / a_out
        cw, ch = int(cw) // 2 * 2, int(ch) // 2 * 2
        x = int(min(max(fx * iw - cw / 2, 0), iw - cw))
        y = int(min(max(fy * ih - ch / 2, 0), ih - ch))
        if (cw, ch) != (iw, ih):
            vf.append(f'crop={cw}:{ch}:{x}:{y}')
        zv = W / cw
        vf.append(f'scale={W}:{H}:flags={SCALE_FLAGS}:out_color_matrix=bt709:out_range=tv')
        if zv > 1.05:
            vf.append(CAS)
    if zv > 2.6:
        pozor(f'záber {a["i"] + 1} ({a["p"].name}): video sa zväčšuje {zv:.1f}x, bude mäkké; pri 16:9 skús "vypln": "pas"')
    vf.append('setsar=1,format=yuv420p')
    spusti(['ffmpeg', '-v', 'error', '-y', '-ss', f'{ss:.3f}', '-i', str(src), '-an', '-vf', ','.join(vf),
            '-frames:v', str(a['n']), *MEDZI, str(out)], cwd=prac)
    got = sonda(out)
    if abs(got['dur'] - dur) > 1.5 / fps:
        pozor(f'záber {a["i"] + 1}: má {got["dur"]:.2f} s namiesto {dur:.2f} s (video je kratšie?)')


# ---------------------------------------------------------------- titulky (ASS cez libass) a SRT

def slova(text):
    """Text s *kurzívou* -> slová, každé ako zoznam (kúsok, kurzíva)."""
    casti = text.split('*')
    if len(casti) % 2 == 0:
        raise Chyba(f'nepárna hviezdička v texte „{text}“')
    out, slovo = [], []
    for k, cast in enumerate(casti):
        kurz = k % 2 == 1
        for j, kus in enumerate(re.split(r'(\s+)', cast)):
            if not kus:
                continue
            if kus.isspace():
                if slovo:
                    out.append(slovo)
                slovo = []
            else:
                slovo.append((kus, kurz))
    if slovo:
        out.append(slovo)
    return out


def zalom(words, sirka_slova, medzera, maxw, max_riadkov):
    """Vyvážené riadky (ako text-wrap: balance): najmenej riadkov, potom najkratší najdlhší riadok."""
    n = len(words)
    sir = [sirka_slova(w) for w in words]

    def dlzka(i, j):
        return sum(sir[i:j]) + medzera * (j - i - 1)
    najlepsie = None
    for k in range(1, min(max_riadkov, n) + 1):
        def rezy(start, zostava):
            if zostava == 1:
                yield [(start, n)]
                return
            for e in range(start + 1, n - zostava + 2):
                for zvysok in rezy(e, zostava - 1):
                    yield [(start, e)] + zvysok
        for r in rezy(0, k):
            m = max(dlzka(i, j) for i, j in r)
            if m <= maxw and (najlepsie is None or m < najlepsie[0]):
                najlepsie = (m, r)
        if najlepsie:
            return [words[i:j] for i, j in najlepsie[1]], najlepsie[0]
    return None, None


def blok_textu(z, zn, pisma, W, H, zona, skala):
    """Rozloženie jedného bloku (štítok, nadpis, riadok) v bezpečnej zóne. Vracia udalosti ASS bez času."""
    vel, rl, roz = zn.get('velkosti', {}), zn.get('riadkovanie', {}), zn.get('rozostup', {})
    farby = zn['_rgb']
    zarov = z.get('zarovnanie', zn.get('zarovnanie', 'vlavo'))
    poloha = z.get('poloha', 'dole')
    x_l, x_r = W * zona['vlavo'], W * (1 - zona['vpravo'])
    maxw = x_r - x_l
    P_n, P_k, P_s, P_r = pisma['nadpis'], pisma['kurziva'], pisma['stitok'], pisma['riadok']
    riadky = []   # (druh, obsah, em, šírka)
    # štítok (nadpisok): verzálky, riedko, pred ním linka
    if z.get('stitok'):
        em_s = vel.get('stitok', 30) * skala
        t = z['stitok'].upper()
        fsp = roz.get('stitok', 0.2) * em_s
        riadky.append(('stitok', t, em_s, P_s.sirka(t, em_s, fsp), fsp))
    em_n0 = vel.get('nadpis', 96) * skala
    if z.get('text'):
        words = slova(z['text'])
        vybrane = None
        for max_r in (2, 3):
            for f in (1.0, 0.94, 0.88, 0.82, 0.76):
                em = em_n0 * f
                fsp = roz.get('nadpis', -0.02) * em
                sw = lambda w, em=em, fsp=fsp: sum((P_k if k else P_n).sirka(c, em, fsp) for c, k in w)
                lines, m = zalom(words, sw, P_n.sirka(' ', em, fsp), maxw, max_r)
                if lines:
                    vybrane = (lines, em, fsp, sw)
                    break
            if vybrane:
                if max_r == 3:
                    pozor(f'záber {z.get("_i", 0) + 1}: nadpis má tri riadky; skráť vetu')
                break
        if not vybrane:
            raise Chyba(f'nadpis „{z["text"]}“ sa nezmestí do bezpečnej zóny ani na tri riadky; skráť ho')
        lines, em, fsp, sw = vybrane
        if em < em_n0 * 0.999:
            pozor(f'záber {z.get("_i", 0) + 1}: nadpis zmenšený na {em / em_n0:.0%}, aby bol najviac na dva riadky')
        for ln in lines:
            sirka = sum(sw(w) for w in ln) + P_n.sirka(' ', em, fsp) * (len(ln) - 1)
            riadky.append(('nadpis', ln, em, sirka, fsp))
    if z.get('riadok'):
        em_r = vel.get('riadok', 40) * skala
        fsp = roz.get('riadok', 0.0) * em_r
        words = [[(w, False)] for w in z['riadok'].split()]
        sw = lambda w, em=em_r, fsp=fsp: P_r.sirka(w[0][0], em, fsp)
        lines, m = zalom(words, sw, P_r.sirka(' ', em_r, fsp), maxw, 2)
        if not lines:
            raise Chyba(f'riadok „{z["riadok"]}“ je dlhý; skráť ho')
        for ln in lines:
            riadky.append(('riadok', ' '.join(w[0][0] for w in ln), em_r, sw_sum(ln, sw, P_r.sirka(' ', em_r, fsp)), fsp))
    if not riadky:
        return [], None
    # zvislé rozloženie od základných čiar (baseline)
    lin = zn.get('linka', {})
    y = 0.0
    zakl = []
    predch = None
    for druh, obsah, em, sirka, fsp in riadky:
        if druh == 'stitok':
            y += em * 0.75
        elif druh == 'nadpis':
            y += (em_n0 * 0.62 if predch == 'stitok' else 0) + (em * 0.78 if predch != 'nadpis' else em * rl.get('nadpis', 1.0))
        else:
            y += (em_n0 * 0.42 if predch == 'nadpis' else em_n0 * 0.3 if predch == 'stitok' else 0) + \
                 (em * 0.78 if predch != 'riadok' else em * rl.get('riadok', 1.3))
        zakl.append(y)
        predch = druh
    vyska = zakl[-1] + riadky[-1][2] * 0.24
    if poloha == 'hore':
        top = H * zona['hore'] + 0.012 * H
    elif poloha == 'stred':
        top = (H - vyska) / 2
    else:
        top = H * (1 - zona['dole']) - 0.012 * H - vyska
    udalosti = []
    sirka_bloku = 0
    linka_w = lin.get('sirka', 60) * skala if zn.get('linka') else 0
    linka_g = lin.get('medzera', 22) * skala if zn.get('linka') else 0
    for (druh, obsah, em, sirka, fsp), b in zip(riadky, zakl):
        base = top + b
        w_celk = sirka + (linka_w + linka_g if druh == 'stitok' and linka_w else 0)
        sirka_bloku = max(sirka_bloku, w_celk)
        x0 = x_l if zarov == 'vlavo' else (x_l + x_r) / 2 - w_celk / 2
        if druh == 'stitok':
            if linka_w:
                hr = max(1.0, lin.get('hrubka', 4) * skala)
                ly = base - em * 0.36 - hr / 2
                udalosti.append((2, f'{{\\an7\\pos({x0:.1f},{ly:.1f})\\p1\\bord0\\shad0\\blur0.6\\1c{ass_farba(farby["linka"])}}}'
                                    f'm 0 0 l {linka_w:.1f} 0 {linka_w:.1f} {hr:.1f} 0 {hr:.1f}{{\\p0}}'))
                x0 += linka_w + linka_g
            udalosti.append((3, f'{{\\an1\\pos({x0:.1f},{base + P_s.zostup(em):.1f})\\fn{P_s.rodina}\\fs{P_s.ass_velkost(em):.1f}'
                                f'\\fsp{fsp:.2f}\\1c{ass_farba(farby["stitok"])}}}{obsah}'))
        elif druh == 'nadpis':
            kusy = []
            for wi, w in enumerate(obsah):
                if wi:
                    kusy.append(' ')
                for c, k in w:
                    if k:
                        kusy.append(f'{{\\fn{P_k.rodina}\\fs{P_k.ass_velkost(em):.1f}\\1c{ass_farba(farby["akcent"])}}}{c}'
                                    f'{{\\fn{P_n.rodina}\\fs{P_n.ass_velkost(em):.1f}\\1c{ass_farba(farby["text"])}}}')
                    else:
                        kusy.append(c)
            udalosti.append((3, f'{{\\an1\\pos({x0:.1f},{base + P_n.zostup(em):.1f})\\fn{P_n.rodina}\\fs{P_n.ass_velkost(em):.1f}'
                                f'\\fsp{fsp:.2f}\\1c{ass_farba(farby["text"])}}}' + ''.join(kusy)))
        else:
            udalosti.append((3, f'{{\\an1\\pos({x0:.1f},{base + P_r.zostup(em):.1f})\\fn{P_r.rodina}\\fs{P_r.ass_velkost(em):.1f}'
                                f'\\fsp{fsp:.2f}\\1c{ass_farba(farby["text"])}}}{obsah}'))
    # jemné stmavenie len za textom (ako .title-card::before na webe): mäkká elipsa, fotka sa netónuje
    stm = float(z.get('stmavenie', zn.get('stmavenie', 0.5)))
    if stm > 0:
        bx0 = x_l if zarov == 'vlavo' else (x_l + x_r) / 2 - sirka_bloku / 2
        cx, cy = bx0 + sirka_bloku / 2, top + vyska / 2
        # web: radiálny prechod v ráme o 28 % širšom a 55 % vyššom než karta, krytie 0,7 v strede; tu elipsa s rozostrením
        rx, ry = sirka_bloku * 0.5 + em_n0 * 0.9, vyska * 0.5 + em_n0 * 0.75
        kk = 0.5523
        d = (f'm {rx:.0f} 0 b {rx + kk * rx:.0f} 0 {2 * rx:.0f} {ry - kk * ry:.0f} {2 * rx:.0f} {ry:.0f} '
             f'b {2 * rx:.0f} {ry + kk * ry:.0f} {rx + kk * rx:.0f} {2 * ry:.0f} {rx:.0f} {2 * ry:.0f} '
             f'b {rx - kk * rx:.0f} {2 * ry:.0f} 0 {ry + kk * ry:.0f} 0 {ry:.0f} b 0 {ry - kk * ry:.0f} {rx - kk * rx:.0f} 0 {rx:.0f} 0')
        alfa = int(round(255 * (1 - min(stm, 1))))
        blur = min(80, max(16, min(rx, ry) * 0.28))
        udalosti.insert(0, (0, f'{{\\an7\\pos({cx - rx:.1f},{cy - ry:.1f})\\p1\\bord0\\shad0\\blur{blur:.0f}'
                               f'\\1c{ass_farba(farby["tien"])}\\1a&H{alfa:02X}&}}{d}{{\\p0}}'))
    bbox = (x_l if zarov == 'vlavo' else (x_l + x_r) / 2 - sirka_bloku / 2, top, sirka_bloku, vyska)
    return udalosti, bbox


def sw_sum(ln, sw, medzera):
    return sum(sw(w) for w in ln) + medzera * (len(ln) - 1)


def titulky(zab, sc, zn, pisma, W, H, prac):
    fps = sc['_fps']
    zona = dict(ZONY[sc['_format']])
    zona.update(sc.get('bezpecna_zona') or {})
    skala = min(W, H) / 1080
    farby = zn['_rgb']
    bloky = []   # zlúčené susedné zábery s rovnakým textom
    for a in zab:
        z = a['z']
        kluc = tuple(z.get(k) or '' for k in ('stitok', 'text', 'riadok', 'poloha', 'zarovnanie'))
        if not any(kluc[:3]):
            continue
        t0 = (a['start'] + a['d_in'] / 2) / fps + float(z.get('text_od', 0.12))
        t1 = (a['start'] + a['n'] - a['d_out'] / 2) / fps
        if bloky and bloky[-1]['kluc'] == kluc and bloky[-1]['k_posl'] == a['i'] - 1:
            bloky[-1]['t1'] = t1
            bloky[-1]['k_posl'] = a['i']
        else:
            zz = dict(z)
            zz['_i'] = a['i']
            bloky.append(dict(kluc=kluc, z=zz, t0=t0, t1=t1, k_posl=a['i']))
    tien = farby['tien']
    hlavicka = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Text,{pisma['nadpis'].rodina},60,{ass_farba(farby['text'])},{ass_farba(farby['text'])},{ass_farba(tien, 0x70)},&HFF000000,0,0,0,0,100,100,0,0,1,{max(1.5, 2.6 * skala):.1f},0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    riadky, srt = [], []
    fad = sc.get('text_fade', [300, 250])
    halo = f'\\blur{max(2, 4 * skala):.0f}'   # mäkký tmavý lem okolo písmen (ako --halo na webe), výplň ostáva ostrá
    rozlozenie = []
    for bi, b in enumerate(bloky):
        ud, bbox = blok_textu(b['z'], zn, pisma, W, H, zona, skala)
        rozlozenie.append(bbox)
        for vrstva, txt in ud:
            efekt = f'{{\\fad({fad[0]},{fad[1]}){halo if vrstva == 3 else ""}}}'
            riadky.append(f'Dialogue: {vrstva},{ass_cas(b["t0"])},{ass_cas(b["t1"])},Text,,0,0,0,,{efekt}{txt}')
        obsah = [cista_veta(b['z'][k]) for k in ('text', 'riadok') if b['z'].get(k)]
        srt.append(f'{len(srt) + 1}\n{srt_cas(b["t0"])} --> {srt_cas(b["t1"])}\n' + '\n'.join(obsah) + '\n')
    (prac / 'titulky.ass').write_text(hlavicka + '\n'.join(riadky) + '\n', encoding='utf-8')
    return bloky, '\n'.join(srt), rozlozenie


# ---------------------------------------------------------------- zvuk

def priprav_zvuk(sc, dlzka, prac):
    hlas, hudba = sc.get('hlas'), sc.get('hudba')
    if not hlas and not hudba:
        return None
    vstupy, graf, mix = [], [], []
    if hlas:
        vstupy += ['-ss', str(float(hlas.get('zaciatok', 0))), '-i', str(cesta(sc, hlas['src']))]
        od = int(float(hlas.get('od', 0)) * 1000)
        graf.append(f'[{len(vstupy) // 4 - 1}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,'
                    f'volume={float(hlas.get("hlasitost_db", 0))}dB,adelay={od}|{od},apad,atrim=0:{dlzka:.3f}[hl]')
    if hudba:
        vstupy += ['-ss', str(float(hudba.get('zaciatok', 0))), '-i', str(cesta(sc, hudba['src']))]
        k = len(vstupy) // 4 - 1
        db = float(hudba.get('hlasitost_db', -18 if hlas else -6))
        graf.append(f'[{k}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={db}dB,'
                    f'apad,atrim=0:{dlzka:.3f},afade=t=in:d=0.4,afade=t=out:st={max(0, dlzka - 1.5):.3f}:d=1.5[hu]')
    if hlas and hudba:   # hudba ustúpi, keď sa hovorí
        graf.append('[hl]asplit=2[hl1][hl2]')
        graf.append('[hu][hl2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[hud]')
        graf.append('[hl1][hud]amix=inputs=2:normalize=0:duration=first[mix]')
    else:
        graf.append(('[hl]' if hlas else '[hu]') + 'anull[mix]')
    surovy = prac / 'zvuk-surovy.wav'
    spusti(['ffmpeg', '-v', 'error', '-y', *vstupy, '-filter_complex', ';'.join(graf), '-map', '[mix]',
            '-t', f'{dlzka:.3f}', '-c:a', 'pcm_f32le', str(surovy)])
    # hlasitosť okolo -14 LUFS (bežná úroveň krátkych videí), dva prechody loudnorm
    ciel = 'I=-14:TP=-1.5:LRA=11'
    r = spusti(['ffmpeg', '-v', 'info', '-hide_banner', '-i', str(surovy), '-af',
                f'loudnorm={ciel}:print_format=json', '-f', 'null', '-'])
    m = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr.decode('utf-8', 'replace'))
    if not m:
        raise Chyba('loudnorm nevrátil meranie')
    me = json.loads(m[-1])
    if float(me['input_i']) < -60:
        pozor('zvuk je takmer ticho; skontroluj súbory hlasu a hudby')
        af = f'loudnorm={ciel}'
    else:
        af = (f'loudnorm={ciel}:measured_I={me["input_i"]}:measured_TP={me["input_tp"]}:measured_LRA={me["input_lra"]}:'
              f'measured_thresh={me["input_thresh"]}:offset={me["target_offset"]}:linear=true')
    hotovy = prac / 'zvuk.wav'
    spusti(['ffmpeg', '-v', 'error', '-y', '-i', str(surovy), '-af', af + ',aresample=48000', '-c:a', 'pcm_s16le',
            '-t', f'{dlzka:.3f}', str(hotovy)])
    return hotovy


def zmeraj_lufs(subor):
    r = spusti(['ffmpeg', '-v', 'info', '-hide_banner', '-i', str(subor), '-map', '0:a', '-af',
                'loudnorm=print_format=json', '-f', 'null', '-'])
    m = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr.decode('utf-8', 'replace'))
    return json.loads(m[-1]) if m else None


# ---------------------------------------------------------------- zloženie

def zloz(zab, sc, zn, W, H, celkom, prac, out, zvuk):
    fps = sc['_fps']
    vstupy, graf = [], []
    for a in zab:
        vstupy += ['-i', a['subor'].name]
        graf.append(f'[{a["i"]}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[s{a["i"]}]')
    acc = 's0'
    for a in zab[1:]:
        k = a['i']
        if a['d_in']:
            graf.append(f'[{acc}][s{k}]xfade=transition=fade:duration={a["d_in"] / fps:.4f}:offset={a["start"] / fps:.4f}[x{k}]')
        else:
            graf.append(f'[{acc}][s{k}]concat=n=2:v=1:a=0[x{k}]')
        acc = f'x{k}'
    n_vst = len(zab)
    # prekrytia s priehľadnosťou (ProRes 4444 .mov alebo WebM VP9 s alfou) od začiatku záberu, cez celý obraz
    for a in zab:
        ov = a['z'].get('overlay')
        if not ov:
            continue
        p = cesta(sc, ov)
        info = sonda(p)
        if info.get('codec') == 'vp9':
            vstupy += ['-c:v', 'libvpx-vp9']   # natívny dekodér VP9 alfu z WebM zahodí
            if str(info.get('alpha_mode')) != '1':
                pozor(f'prekrytie {p.name}: WebM bez alfy (alpha_mode), zakryje celý obraz')
        elif 'a' not in info.get('pix_fmt', '').replace('gray', ''):
            pozor(f'prekrytie {p.name}: formát {info.get("pix_fmt")} nemá alfu, zakryje celý obraz')
        vstupy += ['-i', str(p)]
        t0 = a['start'] / fps
        trv = a['n'] / fps
        fmt = 'yuva444p' if '444' in info.get('pix_fmt', '') else 'yuva420p'
        # na rozmer výstupu a do BT.709 ako podklad (prekrytie bez značky farieb sa berie ako BT.601, tak ho ffmpeg
        # zapisuje z RGB); trvá najviac do konca svojho záberu; titulky a stmavenie za nimi idú až nad prekrytie
        graf.append(f'[{n_vst}:v]fps={fps},scale={W}:{H}:flags=lanczos:out_color_matrix=bt709:out_range=tv,'
                    f'format={fmt},trim=duration={trv:.4f},setpts=PTS-STARTPTS+{t0:.4f}/TB[o{n_vst}]')
        graf.append(f'[{acc}][o{n_vst}]overlay=eof_action=pass:format=auto[y{n_vst}]')
        acc = f'y{n_vst}'
        n_vst += 1
    graf.append(f'[{acc}]ass=titulky.ass:fontsdir=pisma,format=yuv420p[v]')
    (prac / 'graf.txt').write_text(';\n'.join(graf), encoding='utf-8')
    cmd = ['ffmpeg', '-v', 'error', '-y', *vstupy]
    if zvuk:
        cmd += ['-i', zvuk.name]
    cmd += ['-filter_complex', ';'.join(graf), '-map', '[v]']   # graf.txt v pracovnom priečinku je len na čítanie
    if zvuk:
        cmd += ['-map', f'{n_vst}:a', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2']
    # kľúčové snímky len na hraniciach záberov (v strede prelínania alebo na strihu), najviac každých 10 s:
    # kľúčová snímka uprostred pomalého nájazdu po fotke je viditeľné „cuknutie“ jemnej textúry (ukážka: CV 0,22 -> 0,07, plynulost.py)
    kluc = ['0'] + [f'{(a["start"] + a["d_in"] / 2) / fps:.3f}' for a in zab[1:]]
    cmd += [*VYSTUP, '-g', str(fps * 10), '-keyint_min', str(fps // 2), '-force_key_frames', ','.join(kluc),
            '-r', str(fps), '-frames:v', str(celkom), '-map_metadata', '-1', '-movflags', '+faststart', str(out)]
    spusti(cmd, cwd=prac)


def faststart_ok(subor):
    with open(subor, 'rb') as f:
        poradie, pos = [], 0
        while len(poradie) < 12:
            f.seek(pos)
            h = f.read(8)
            if len(h) < 8:
                break
            size, typ = int.from_bytes(h[:4], 'big'), h[4:8].decode('latin-1')
            if size == 1:
                size = int.from_bytes(f.read(8), 'big')
            poradie.append(typ)
            if size < 8:
                break
            pos += size
    return 'moov' in poradie and 'mdat' in poradie and poradie.index('moov') < poradie.index('mdat')


def casy_hlasu(subor):
    # prah ticha podľa nahrávky: 12 dB pod priemernou hlasitosťou (tichá nahrávka z telefónu by inak bola celá „ticho“)
    r = spusti(['ffmpeg', '-v', 'info', '-hide_banner', '-i', str(subor), '-af', 'volumedetect', '-f', 'null', '-'])
    m = re.search(r'mean_volume: (-?[\d.]+) dB', r.stderr.decode('utf-8', 'replace'))
    prah = min(-25.0, max(-60.0, float(m.group(1)) - 12)) if m else -35.0
    r = spusti(['ffmpeg', '-v', 'info', '-hide_banner', '-i', str(subor), '-af',
                f'silencedetect=noise={prah:.1f}dB:d=0.35', '-f', 'null', '-'])
    s = r.stderr.decode('utf-8', 'replace')
    dlzka = sonda(subor)['dur']
    zac = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', s)]
    kon = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', s)]
    kon += [dlzka] * (len(zac) - len(kon))          # nahrávka končí tichom bez konca
    useky, t = [], 0.0                               # reč = medzi koncom jedného ticha a začiatkom ďalšieho
    for a, b in zip(zac, kon):
        if a - t > 0.15:
            useky.append((t, a))
        t = b
    if dlzka - t > 0.15:
        useky.append((t, dlzka))
    print(f'nahrávka {subor}: {dlzka:.2f} s, vety (reč medzi tichom pod {prah:.0f} dB dlhším ako 0,35 s):')
    for i, (a, b) in enumerate(useky):
        print(f'  {i + 1}. {a:6.2f} až {b:6.2f} s  ({b - a:.2f} s)')
    if useky:
        print('návrh: záber k vete i nech trvá od začiatku vety i po začiatok vety i+1 (posledný + 0,8 s);')
        print('       "hlas": {"od": 0} ak video začína spolu s nahrávkou')


# ---------------------------------------------------------------- hlavný beh

def main():
    ap = argparse.ArgumentParser(description='Krátke vertikálne video zo skutočných záberov podniku.')
    ap.add_argument('scenar', nargs='?')
    ap.add_argument('-o', '--vystup', help='výstupné MP4 (vedľa neho -titulka.jpg a .srt)')
    ap.add_argument('--format', choices=list(FORMATY))
    ap.add_argument('--zaklad', help='priečinok, od ktorého sa berú relatívne cesty v scenári')
    ap.add_argument('--prac', help='pracovný priečinok (inak dočasný)')
    ap.add_argument('--nechaj', action='store_true', help='nezmazať pracovný priečinok')
    ap.add_argument('--kontrola', action='store_true', help='len kontrola, nič nerenderuje')
    ap.add_argument('--casy-hlasu', metavar='SUBOR', help='nájdi vety v nahrávke hlasu')
    args = ap.parse_args()
    try:
        potrebne_programy()
        if args.casy_hlasu:
            casy_hlasu(args.casy_hlasu)
            return 0
        if not args.scenar:
            ap.error('chýba scenár')
        sc = nacitaj(args.scenar, args)
        zn = nacitaj_znacku(sc)
        W, H = FORMATY[sc['_format']]
        fps = sc['_fps']
        chyby = kontrola(sc, zn)
        if chyby:
            raise Chyba('scenár neprešiel kontrolou:\n  ' + '\n  '.join(chyby))
        prac = Path(args.prac) if args.prac else Path(tempfile.mkdtemp(prefix='reel-'))
        prac.mkdir(parents=True, exist_ok=True)
        texty = {'nadpis': [], 'kurziva': [], 'stitok': [], 'riadok': []}
        for z in sc['zabery']:
            for w in slova(z.get('text') or ''):
                for c, k in w:
                    texty['kurziva' if k else 'nadpis'].append(c)
            texty['stitok'].append((z.get('stitok') or '').upper())
            texty['riadok'].append(z.get('riadok') or '')
        pisma = priprav_pisma(zn, sc, prac, texty)
        zab, celkom = rozvrh(sc)
        print(f'{zn.get("nazov", "")}: {len(zab)} záberov, {celkom / fps:.2f} s, {W}x{H}, {fps} snímok/s')
        for a in zab:
            print(f'  {a["i"] + 1}. {a["typ"]:5s} {a["p"].name:28s} {a["start"] / fps:6.2f} s + {a["n"] / fps:.2f} s'
                  f'{"  prelínanie " + str(a["d_in"] / fps) + " s" if a["d_in"] else ""}  „{cista_veta(a["z"].get("text") or "")}“')
        if celkom / fps > 60:
            pozor(f'video má {celkom / fps:.0f} s; krátke video drž do 15 až 30 s')
        if args.kontrola:
            titulky(zab, sc, zn, pisma, W, H, prac)   # overí aj rozloženie textu v bezpečnej zóne
            print('kontrola: v poriadku' + (f' ({len(POZOR)} upozornení)' if POZOR else ''))
            vypis_potvrdenie()
            if not args.nechaj and not args.prac:
                shutil.rmtree(prac, ignore_errors=True)
            return 0
        if not args.vystup:
            ap.error('chýba -o výstup.mp4')
        out = Path(args.vystup).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        bg = zn['_rgb'].get('pozadie', (14, 13, 12))
        for a in zab:
            a['subor'] = prac / f'z{a["i"]:02d}.mp4'
            if a['typ'] == 'foto':
                render_foto(a, W, H, fps, a['subor'])
            else:
                render_video(a, W, H, fps, a['subor'], prac, bg)
        bloky, srt, _ = titulky(zab, sc, zn, pisma, W, H, prac)
        zvuk = priprav_zvuk(sc, celkom / fps, prac)
        zloz(zab, sc, zn, W, H, celkom, prac, out, zvuk)
        out.with_suffix('.srt').write_text(srt, encoding='utf-8')
        # titulná snímka: chvíľa, keď je prvý nadpis celý viditeľný (alebo čas zo scenára)
        tt = sc.get('titulka')
        if isinstance(tt, dict):
            tt = tt.get('cas')
        if tt is None:
            tt = (bloky[0]['t0'] + 0.6) if bloky else min(1.0, celkom / fps / 2)
        jpg = out.with_name(out.stem + '-titulka.jpg')
        spusti(['ffmpeg', '-v', 'error', '-y', '-ss', f'{float(tt):.3f}', '-i', str(out), '-frames:v', '1',
                '-q:v', '2', str(jpg)])
        info = sonda(out)
        r = spusti(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                    'stream=codec_name,profile,pix_fmt,r_frame_rate,width,height', '-of', 'compact=p=0:nk=1', str(out)])
        print(f'hotovo: {out} ({out.stat().st_size / 1e6:.1f} MB, {info["dur"]:.2f} s, '
              f'{r.stdout.decode().strip()}, faststart {"áno" if faststart_ok(out) else "NIE"})')
        if info['audio']:
            me = zmeraj_lufs(out)
            print(f'  zvuk: AAC, {me["input_i"]} LUFS, špička {me["input_tp"]} dBTP')
        else:
            print('  zvuk: žiadny (hudbu s licenciou pridá majiteľ v aplikácii alebo do scenára)')
        print(f'  titulná snímka: {jpg}\n  titulky: {out.with_suffix(".srt")}')
        vypis_potvrdenie()
        if not args.nechaj and not args.prac:
            shutil.rmtree(prac, ignore_errors=True)
        elif args.nechaj or args.prac:
            print(f'  pracovný priečinok: {prac}')
        return 0
    except Chyba as e:
        print('CHYBA: ' + str(e), file=sys.stderr)
        return 1


def vypis_potvrdenie():
    print('Treba potvrdiť pred uverejnením (uverejňuje majiteľ):')
    for t in NA_POTVRDENIE + ['fakty v texte podľa zdrojov (pole "zdroj" pri zábere)']:
        print('  - ' + t)
    if POZOR:
        print(f'Upozornenia: {len(POZOR)} (vyššie, POZOR)')


if __name__ == '__main__':
    sys.exit(main())
