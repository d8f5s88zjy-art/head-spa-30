#!/usr/bin/env python3
"""YouTube Short zo zoznamu záberov (EDL v JSON) len cez ffmpeg.

Kroky: každý záber sa oreže na 9:16 a zmenší na 1080×1920 (HLG/PQ z telefónu sa prevedie na SDR BT.709),
voliteľne pomalší chod a plynulé priblíženie, potom strih alebo prelínanie podľa EDL, titulky slovo po slove
(ASS, aktuálne slovo inou farbou), zvuk záberov a hudba zmiešané a vyrovnané na -14 LUFS (meranie EBU R128
filtrom ebur128, lineárne zosilnenie, pri vysokej špičke limiter; voľba "metoda": "loudnorm" použije
dvojprechodový loudnorm), export H.264 High + AAC 48 kHz s +faststart, bez metadát z telefónu (poloha, model).
Na konci kontrola výsledku (kontajner, kódek, farby, GOP, B-snímky, hlasitosť, metadáta, dĺžka), test
synchronizácie zvuku a obrazu a náhľad so zónami YouTube.

python3 -I short.py strih.json                # celý short, kontrola a náhľad
python3 -I short.py strih.json --len-titulky  # len titulky .ass a .srt (na doladenie časov)
python3 -I short.py hotovy.mp4 --kontrola     # len kontrola hotového súboru
python3 -I short.py --test-sync [priečinok]   # synchronizácia obrazu a zvuku pri nastaveniach exportu

Formát EDL je v ../references/pipeline-ffmpeg.md, vzor v ../assets/strih-priklad.json.
Cesty v EDL sú relatívne k priečinku EDL. Návratový kód 0 = všetko v poriadku, 1 = kontrola niečo našla.
Odporúčania YouTube k exportu: support.google.com/youtube/answer/1722171 (čítané 2026-10-17).
"""
import json, os, re, shutil, subprocess, sys

W, H, FPS = 1080, 1920, 30
# bezpečná zóna pre zvislé video (Google Ads, support.google.com/google-ads/answer/9128498) a náš pás titulkov
# (SKILL.md, časť Bezpečné zóny): 48 px vľavo, 288 hore, 192 vpravo, 672 dole; titulky 1040 až 1240 px
ZONA = (48, 288, W - 192, H - 672)
PAS = (195, 1040, 885, 1240)


# ---------------------------------------------------------------- ffmpeg
def ffmpeg_bin():
    p = shutil.which('ffmpeg')
    if not p:
        try:
            import imageio_ffmpeg
            p = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            sys.exit('chyba: chýba ffmpeg')
    filtre = subprocess.run([p, '-hide_banner', '-filters'], capture_output=True, text=True).stdout
    chyba = [f for f in ('zscale', 'tonemap', 'ass', 'loudnorm', 'ebur128', 'xfade', 'perspective')
             if not re.search(rf'\s{f}\s', filtre)]
    if chyba:
        sys.exit(f'chyba: ffmpeg {p} nemá filtre {chyba} (treba zostavu s libzimg a libass)')
    return p


FF = None


def run(args, cwd=None, popis=''):
    r = subprocess.run([FF, '-hide_banner', '-nostdin'] + args, capture_output=True, text=True, cwd=cwd)
    if r.returncode:
        sys.stderr.write(r.stderr[-3000:])
        sys.exit(f'chyba ffmpeg ({popis})')
    return r.stderr


def probe(path):
    """Údaje o súbore z výpisu ffmpeg -i (ffprobe v kontajneri nie je)."""
    e = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', e)
    if not m:
        sys.exit(f'chyba: {path} sa nedá prečítať')
    d = {'dur': int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)), 'log': e}
    v = re.search(r'Stream #\S+.*?: Video: (.*)', e)
    if v:
        line = v.group(1)
        d['vcodec'] = line.split()[0]
        d['vline'] = line
        wh = re.search(r', (\d{2,5})x(\d{2,5})', line)
        d['w'], d['h'] = int(wh.group(1)), int(wh.group(2))
        f = re.search(r'([\d.]+) fps', line)
        d['fps'] = float(f.group(1)) if f else None
        d['trc'] = next((t for t in ('arib-std-b67', 'smpte2084') if t in line), 'sdr')
        rot = re.search(r'rotation of (-?[\d.]+) degrees', e)
        d['rot'] = float(rot.group(1)) if rot else 0.0
        d['dw'], d['dh'] = (d['h'], d['w']) if abs(round(d['rot'])) % 180 == 90 else (d['w'], d['h'])
    a = re.search(r'Stream #\S+.*?: Audio: (.*)', e)
    d['audio'] = a.group(1) if a else None
    return d


# ---------------------------------------------------------------- EDL
def nacitaj(path):
    edl = json.load(open(path, encoding='utf-8'))
    base = os.path.dirname(os.path.abspath(path))
    cesta = lambda p: p if os.path.isabs(p) else os.path.normpath(os.path.join(base, p))
    edl['_base'] = base
    edl['vystup'] = cesta(edl.get('vystup', 'short.mp4'))
    for k in edl['klipy']:
        k['zdroj'] = cesta(k['zdroj'])
    t = edl.get('titulky')
    if t and t.get('pismo'):
        t['pismo'] = cesta(t['pismo'])
    h = edl.get('zvuk', {}).get('hudba')
    if h:
        h['zdroj'] = cesta(h['zdroj'])
    return edl


def even(x):
    return int(round(x / 2) * 2)


# ---------------------------------------------------------------- 1. zábery
def zaber(k, i, fps, prac):
    """Jeden záber do medzisúboru: 1080×1920, fps, SDR BT.709, zvuk 48 kHz stereo, presne N snímok."""
    info = probe(k['zdroj'])
    od, do = k.get('od', 0.0), k.get('do', info['dur'])
    if do > info['dur'] + 0.01 or od >= do:
        sys.exit(f"chyba: záber {i + 1} {os.path.basename(k['zdroj'])}: úsek {od} až {do} s mimo dĺžky {info['dur']:.2f} s")
    r = float(k.get('rychlost', 1.0))
    n = int(round((do - od) / r * fps))
    T = n / fps
    dw, dh = info['dw'], info['dh']
    sx, sy = k.get('stred', [0.5, 0.5])
    if dw / dh > W / H:                       # širšie ako 9:16: orež šírku
        cw, ch = even(dh * W / H), dh
    else:                                     # vyššie: orež výšku
        cw, ch = dw, even(dw * H / W)
    x = min(max(0, round(sx * dw - cw / 2)), dw - cw)
    y = min(max(0, round(sy * dh - ch / 2)), dh - ch)
    vf = [f'setpts=(PTS-STARTPTS)/{r}']
    if (cw, ch) != (dw, dh):
        vf.append(f'crop={cw}:{ch}:{x}:{y}')
    if info['trc'] == 'arib-std-b67':         # HLG (iPhone): najprv zmenšiť, potom tónovanie (1,7× rýchlejšie)
        vf += [f'zscale=w={W}:h={H}:f=lanczos', 'zscale=t=linear:npl=203', 'format=gbrpf32le', 'zscale=p=bt709',
               'tonemap=hable:desat=0:peak=4', 'zscale=t=bt709:m=bt709:r=tv', 'format=yuv420p']
    elif info['trc'] == 'smpte2084':          # PQ (HDR10, Android): bežný recept, na našich záberoch neoverený
        vf += [f'zscale=w={W}:h={H}:f=lanczos', 'zscale=t=linear:npl=100', 'format=gbrpf32le', 'zscale=p=bt709',
               'tonemap=hable:desat=0', 'zscale=t=bt709:m=bt709:r=tv', 'format=yuv420p']
    else:
        vf += [f'scale={W}:{H}:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv',
               'format=yuv420p']
    vf += [f'fps={fps}', 'tpad=stop_mode=clone:stop_duration=0.2']
    z0, z1 = k.get('zoom', [1.0, 1.0])
    if (z0, z1) != (1.0, 1.0):
        # plynulé priblíženie s presnosťou pod pixel (perspective s cubic), ease in-out; crop+scale by skákal po 1 px
        zx, zy = k.get('zoom_stred', [0.5, 0.5])
        u = f'clip(in/{max(1, n - 1)}\\,0\\,1)'
        z = f'({z0}+({z1}-{z0})*({u}*{u}*(3-2*{u})))'
        L, Tp = f'({zx}*W*(1-1/{z}))', f'({zy}*H*(1-1/{z}))'
        R, B = f'({L}+W/{z})', f'({Tp}+H/{z})'
        vf.append(f"perspective=x0='{L}':y0='{Tp}':x1='{R}':y1='{Tp}':x2='{L}':y2='{B}':x3='{R}':y3='{B}'"
                  ':interpolation=cubic:eval=frame')
    vf.append('setsar=1')
    zvuk = info['audio'] and k.get('zvuk', True)
    args = ['-y', '-ss', f'{od:.3f}', '-t', f'{do - od:.3f}', '-i', k['zdroj']]
    if not zvuk:
        args += ['-f', 'lavfi', '-t', f'{T:.3f}', '-i', 'anullsrc=r=48000:cl=stereo']
    af = ['asetpts=PTS-STARTPTS']
    if zvuk and r != 1.0:
        rr, ch = r, []
        while rr < 0.5:
            ch.append('atempo=0.5'); rr /= 0.5
        af += ch + [f'atempo={rr:.4f}']
    af += ['aresample=48000', 'aformat=sample_fmts=fltp:channel_layouts=stereo', f'apad=whole_dur={T:.4f}',
           f'atrim=end={T:.4f}', 'afade=t=in:d=0.015', f'afade=t=out:st={max(0, T - 0.015):.4f}:d=0.015']
    fc = f"[0:v]{','.join(vf)}[v];[{0 if zvuk else 1}:a]{','.join(af)}[a]"
    out = os.path.join(prac, f'zaber{i + 1:02d}.mkv')
    run(args + ['-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-frames:v', str(n),
                '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
                '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                '-c:a', 'pcm_s24le', '-map_metadata', '-1', '-map_chapters', '-1', out], popis=f'záber {i + 1}')
    return {'subor': out, 'T': T, 'n': n, 'hdr': info['trc'], 'zdroj_fps': info['fps'],
            'zdroj': f"{info['dw']}x{info['dh']}", 'zvuk': bool(zvuk)}


# ---------------------------------------------------------------- 2. strih
PRECHODY = {'prelinanie': 'fade', 'cez_ciernu': 'fadeblack', 'cez_bielu': 'fadewhite'}


def os_strihu(klipy, zab):
    """Začiatky záberov vo výslednom čase a celková dĺžka (prelínanie skracuje o svoju dĺžku)."""
    t, zac = 0.0, []
    for i, (k, z) in enumerate(zip(klipy, zab)):
        d = k.get('prechod', {}).get('dlzka', 0) if i and k.get('prechod', {}).get('typ', 'strih') != 'strih' else 0
        t -= d
        zac.append(t)
        t += z['T']
    return zac, t


def graf_strihu(klipy, zab, druh, fps=FPS):
    """Filter na spojenie záberov: druh 'v' (obraz) alebo 'a' (zvuk). Vráti (filter, menovka výstupu)."""
    f, cur, T = [], None, 0.0
    for i, (k, z) in enumerate(zip(klipy, zab)):
        src = f'[{i}:{druh}]'
        lab = f'{druh}n{i}'
        f.append(f"{src}{f'settb=AVTB,setpts=PTS-STARTPTS,fps={fps}' if druh == 'v' else 'asetpts=PTS-STARTPTS'}[{lab}]")
        if cur is None:
            cur, T = lab, z['T']
            continue
        p = k.get('prechod', {})
        typ = p.get('typ', 'strih')
        out = f'{druh}j{i}'
        if typ == 'strih':
            f.append(f"[{cur}][{lab}]concat=n=2:v={1 if druh == 'v' else 0}:a={1 if druh == 'a' else 0}[{out}]")
            T += z['T']
        else:
            d = float(p.get('dlzka', 0.25))
            if druh == 'v':
                # xfade chce stálu snímkovú frekvenciu na oboch vstupoch, výstup concat ju nemá nastavenú
                f.append(f'[{cur}]fps={fps}[{cur}f]')
                cur += 'f'
                f.append(f'[{cur}][{lab}]xfade=transition={PRECHODY.get(typ, typ)}:duration={d}:offset={T - d:.4f}[{out}]')
            else:
                f.append(f'[{cur}][{lab}]acrossfade=d={d}:c1=tri:c2=tri[{out}]')
            T += z['T'] - d
        cur = out
    return ';'.join(f), cur


# ---------------------------------------------------------------- 3. titulky
def ass_farba(hexa, kryt=1.0):
    h = hexa.lstrip('#')
    r, g, b = h[0:2], h[2:4], h[4:6]
    a = round(255 * (1 - kryt))
    return f'&H{a:02X}{b.upper()}{g.upper()}{r.upper()}'


def ass_inline(hexa):
    """Farba pre značku v texte (\\1c&HBBGGRR&), bez priehľadnosti."""
    h = hexa.lstrip('#').upper()
    return f'&H{h[4:6]}{h[2:4]}{h[0:2]}&'


def ass_text(s):
    return s.replace('\\', '\\\\').replace('{', '(').replace('}', ')')


def casy_slov(fr):
    """Časy slov frázy: zadané (slova: [[od, do, slovo], …]) alebo odhad podľa dĺžky slov (bez prepisu reči)."""
    if fr.get('slova'):
        return [(float(a), float(b), w) for a, b, w in fr['slova']], 'zadané'
    slova = []
    for w in fr['text'].split():               # samotná interpunkcia (·, –, &) sa pripojí k predošlému slovu
        if slova and not any(c.isalnum() for c in w):
            slova[-1] += ' ' + w
        else:
            slova.append(w)
    vahy = [len(w) + 1 for w in slova]
    t, od, do, out = 0, fr['od'], fr['do'], []
    for w, v in zip(slova, vahy):
        a = od + (do - od) * t / sum(vahy)
        t += v
        out.append((a, od + (do - od) * t / sum(vahy), w))
    return out, 'odhad'


def ass_cas(t):
    cs = int(round(t * 100))
    return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


def srt_cas(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def sirka_textu(cfg, text):
    """Približná šírka riadku v px, ako ju vykreslí libass (veľkosť ASS = výška bunky usWinAscent+usWinDescent)."""
    try:
        from PIL import ImageFont
        from fontTools.ttLib import TTFont
        f = TTFont(cfg['pismo'])
        os2, upm = f['OS/2'], f['head'].unitsPerEm
        em = cfg.get('velkost', 76) * upm / (os2.usWinAscent + os2.usWinDescent)
        return ImageFont.truetype(cfg['pismo'], max(1, round(em))).getlength(text) + 2 * cfg.get('okraj_boxu', 16)
    except Exception:
        return None


def titulky(cfg, dlzka, prac):
    """Zapíše titulky.ass (slovo po slove) a titulky.srt (frázy). Vráti (meno písma, upozornenia)."""
    from fontTools.ttLib import TTFont
    meno = TTFont(cfg['pismo'])['name'].getDebugName(1)
    styl = cfg.get('styl', 'aktualne')
    zakl, zvyr = cfg.get('farba', '#FFFFFF'), cfg.get('zvyraznenie', '#FFD25A')
    pod, kryt = cfg.get('podklad', '#161616'), cfg.get('podklad_kryt', 0.85)
    velk = cfg.get('velkost', 76)
    ml = cfg.get('okraj', PAS[0])
    box = cfg.get('okraj_boxu', 16)
    mv = H - cfg.get('spodok', PAS[3]) + box   # spodok = spodný okraj podkladu (box presahuje text o okraj_boxu)
    prim, sek = (ass_farba(zvyr), ass_farba(zakl)) if styl == 'karaoke' else (ass_farba(zakl), ass_farba(zakl))
    if cfg.get('podklad_tvar', 'jeden') == 'jeden':
        # BorderStyle 4 (libass 0.17): jeden obdĺžnik pod celou frázou z BackColour; obrys priehľadný.
        # BorderStyle 3 kreslí box pod každý úsek textu zvlášť a pri krytí pod 100 % sa prekryvy zdvoja
        # (tmavé pruhy medzi slovami a riadkami, viditeľné pri zvýraznení slov)
        obrys, bs = ass_farba(pod, 0.0), 4
    else:
        obrys, bs = ass_farba(pod, kryt), 3
    styl_riadok = (f'Style: Titulok,{meno},{velk},{prim},{sek},{obrys},{ass_farba(pod, kryt)},0,0,0,0,100,100,1,0,'
                   f'{bs},{box},0,2,{ml},{ml},{mv},1')
    hl = [
        '[Script Info]', '; vygeneroval short.py', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}',
        'WrapStyle: 0', 'ScaledBorderAndShadow: yes', '', '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, '
        'Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, '
        'MarginR, MarginV, Encoding',
        styl_riadok, '', '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    srt, upoz, fad = [], [], int(cfg.get('fade_ms', 120))
    zv = ass_inline(zvyr)
    for j, fr in enumerate(cfg['frazy'], 1):
        if fr['do'] > dlzka + 0.01:
            upoz.append(f'fráza {j} končí v {fr["do"]} s, video má {dlzka:.2f} s')
        slova, zdroj_casov = casy_slov(fr)
        text = ' '.join(w for _, _, w in slova)
        s = sirka_textu(cfg, text)
        maxw = PAS[2] - PAS[0]
        if s and s > 2 * maxw:
            upoz.append(f'fráza {j} „{text}“ má asi {s:.0f} px, viac ako 2 riadky po {maxw} px: rozdeľ ju')
        if styl == 'karaoke':
            k = ''.join(f'{{\\k{max(1, round((b - a) * 100))}}}{ass_text(w)} ' for a, b, w in slova).rstrip()
            hl.append(f'Dialogue: 0,{ass_cas(fr["od"])},{ass_cas(fr["do"])},Titulok,,0,0,0,,{{\\fad({fad},0)}}{k}')
        elif styl == 'aktualne':
            for i, (a, b, w) in enumerate(slova):
                zac = fr['od'] if i == 0 else a
                kon = slova[i + 1][0] if i + 1 < len(slova) else fr['do']
                casti = [(f'{{\\1c{zv}}}{ass_text(x)}{{\\1c{ass_inline(zakl)}}}' if n == i else ass_text(x))
                         for n, (_, _, x) in enumerate(slova)]
                pref = f'{{\\fad({fad},0)}}' if i == 0 else ''
                hl.append(f'Dialogue: 0,{ass_cas(zac)},{ass_cas(kon)},Titulok,,0,0,0,,{pref}{" ".join(casti)}')
        else:
            hl.append(f'Dialogue: 0,{ass_cas(fr["od"])},{ass_cas(fr["do"])},Titulok,,0,0,0,,{{\\fad({fad},0)}}{ass_text(text)}')
        srt.append(f'{j}\n{srt_cas(fr["od"])} --> {srt_cas(fr["do"])}\n{text}\n')
        if zdroj_casov == 'odhad' and styl != 'bez' and j == 1:
            upoz.append('časy slov sú odhad podľa dĺžky slov; pri reči ich zadaj ručne (pole "slova") podľa prepisu')
    open(os.path.join(prac, 'titulky.ass'), 'w', encoding='utf-8').write('\n'.join(hl) + '\n')
    open(os.path.join(prac, 'titulky.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
    return meno, upoz


# ---------------------------------------------------------------- 4. zvuk
def zvuk(edl, zab, klipy, dlzka, prac):
    """Zmes zvuku záberov a hudby do WAV; meranie loudnorm (1. prechod). Vráti (wav, merania alebo None)."""
    zc = edl.get('zvuk', {})
    args = ['-y']
    for z in zab:
        args += ['-i', z['subor']]
    fa, cur = graf_strihu(klipy, zab, 'a')
    fa += f";[{cur}]volume={zc.get('klipy_db', 0)}dB[ak]"
    vstupy = '[ak]'
    h = zc.get('hudba')
    if h:
        args += ['-i', h['zdroj']]
        m = len(zab)
        fi, fo = h.get('nabeh', 0.3), h.get('dobeh', 0.8)
        fa += (f";[{m}:a]atrim=start={h.get('od', 0)}:duration={dlzka:.4f},asetpts=PTS-STARTPTS,aresample=48000,"
               f"aformat=sample_fmts=fltp:channel_layouts=stereo,volume={h.get('db', 0)}dB,"
               f"apad=whole_dur={dlzka:.4f},afade=t=in:d={fi},afade=t=out:st={max(0, dlzka - fo):.4f}:d={fo}[ah]")
        vstupy += '[ah]'
        fa += f';{vstupy}amix=inputs=2:normalize=0:duration=first[mix]'
    else:
        fa += ';[ak]anull[mix]'
    wav = os.path.join(prac, 'zmes.wav')
    run(args + ['-filter_complex', fa, '-map', '[mix]', '-c:a', 'pcm_s24le', '-ar', '48000', wav], popis='zmes zvuku')
    I, TP, LRA = zc.get('lufs', -14), zc.get('true_peak', -1.0), zc.get('lra', 11)
    if zc.get('metoda', 'ebur128') == 'loudnorm':
        return wav, loudnorm_meranie(wav, I, TP, LRA, zc)
    # predvolene: meranie ebur128 (ten istý merač ako kontrola), lineárne zosilnenie a pri potrebe limiter
    # na 4× vzorkovaní; špička pred AAC o rezervu nižšie, lebo AAC ju v skúške zvýšil o 0,5 až 1,0 dB
    m0 = meraj_r128(wav)
    if m0['I'] is None or m0['I'] < -70:
        return wav, None                      # ticho: nenormalizovať
    rez = zc.get('rezerva_aac_db', 1.0)
    strop = TP - rez
    zisk = I - m0['I']
    tmp = wav[:-4] + '-norm.wav'
    if m0['TP'] + zisk > strop:
        lim = 10 ** ((strop - 0.3) / 20)
        af = (f'volume={zisk:.2f}dB,aresample=192000,alimiter=limit={lim:.4f}:level=disabled:attack=5:release=60,'
              'aresample=48000')
        run(['-y', '-i', wav, '-af', af, '-c:a', 'pcm_s24le', tmp], popis='limiter')
        m1 = meraj_r128(tmp)
        dozisk = I - m1['I']                  # limiter ubral hlasitosť, doladiť (zvyčajne desatiny dB)
        run(['-y', '-i', tmp, '-af', f'volume={dozisk:.2f}dB', '-c:a', 'pcm_s24le', wav], popis='dozisk')
        os.remove(tmp)
        postup = f'zosilnenie {zisk:+.2f} dB, limiter na {strop - 0.3:.1f} dBTP (4× vzorkovanie), doladenie {dozisk:+.2f} dB'
    else:
        run(['-y', '-i', wav, '-af', f'volume={zisk:.2f}dB', '-c:a', 'pcm_s24le', tmp], popis='zosilnenie')
        os.replace(tmp, wav)
        postup = f'lineárne zosilnenie {zisk:+.2f} dB'
    m2 = meraj_r128(wav)
    return wav, {'metoda': 'ebur128', 'pred': m0, 'po': m2, 'postup': postup}


def meraj_r128(path):
    """Integrovaná hlasitosť, rozsah a skutočná špička podľa EBU R128 (filter ebur128, peak=true)."""
    e = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-vn', '-filter_complex', 'ebur128=peak=true',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = e[e.rfind('Summary:'):]
    num = lambda m: float(m.group(1)) if m and m.group(1) not in ('-inf', 'inf') else None
    return {'I': num(re.search(r'I:\s+(-?[\d.]+|-inf)', s)), 'LRA': num(re.search(r'LRA:\s+(-?[\d.]+|-inf)', s)),
            'TP': num(re.search(r'True peak:\s+Peak:\s+(-?[\d.]+|-inf)', s))}


def loudnorm_meranie(wav, I, TP, LRA, zc):
    """Klasický dvojprechodový loudnorm (metoda "loudnorm"). Na 8 s zmesi meral o 0,5 LU tichšie ako ebur128."""
    def meraj():
        e = run(['-i', wav, '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'], popis='loudnorm 1')
        return json.loads(e[e.rindex('{'):e.rindex('}') + 1])
    j = meraj()
    if j['input_i'] in ('-inf', 'inf') or float(j['input_i']) < -70:
        return None
    zisk = I - float(j['input_i'])
    if float(j['input_tp']) + zisk > TP and zc.get('limiter', True):
        # lineárne zosilnenie by prekročilo špičku a loudnorm by prešiel na dynamický režim (pumpovanie)
        lim = 10 ** ((TP - 0.5) / 20)
        tmp = wav[:-4] + '-lim.wav'
        run(['-y', '-i', wav, '-af', f'volume={zisk:.2f}dB,aresample=192000,alimiter=limit={lim:.4f}:level=disabled:'
             'attack=5:release=60,aresample=48000', '-c:a', 'pcm_s24le', tmp], popis='limiter')
        os.replace(tmp, wav)
        j = meraj()
        j['limiter_db'] = round(zisk, 2)
    j['metoda'] = 'loudnorm'
    return j


# ---------------------------------------------------------------- 5. export
# MP4 bez edit listu (odporúčanie YouTube) a pritom presná synchronizácia:
# - B-snímky posúvajú obraz o 2 snímky; +negative_cts_offsets ich zarovná na 0 bez edit listu,
# - kodér AAC pridá na začiatok 1024 vzoriek (21,3 ms); bez edit listu by zvuk meškal, preto sa prvých
#   1024 vzoriek zmesi odstrihne a na koniec sa doplní ticho.
# Zmerané záblesk + pípnutie v 1,0 s (funkcia test_sync nižšie, 2026-10-17): s edit listom +2,7 ms, bez neho -42,7 ms
# (zvuk predbieha), negative_cts_offsets +24,0 ms, s kompenzáciou AAC +2,7 ms (ako originál).
KOMP_AAC = 'atrim=start_sample=1024,asetpts=PTS-STARTPTS,apad=pad_len=1024'


def parametre_videa(ex, fps):
    g = int(ex.get('gop', round(fps / 2)))           # YouTube: uzavretý GOP polovica snímkovej frekvencie
    return ['-c:v', 'libx264', '-profile:v', 'high', '-preset', ex.get('preset', 'slow'),
            '-crf', str(ex.get('crf', 18)), '-maxrate', ex.get('maxrate', '16M'), '-bufsize', ex.get('bufsize', '32M'),
            '-g', str(g), '-bf', '2', '-flags', '+cgop', '-pix_fmt', 'yuv420p', '-fps_mode', 'cfr', '-r', str(fps),
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']


def parametre_kontajnera(ex):
    return ['-c:a', 'aac', '-b:a', f"{ex.get('audio_kbps', 384)}k", '-ar', '48000', '-ac', '2',
            '-map_metadata', '-1', '-map_chapters', '-1', '-metadata:s:v', 'handler_name=VideoHandler',
            '-metadata:s:a', 'handler_name=SoundHandler',
            ] + (['-movflags', '+faststart+negative_cts_offsets', '-use_editlist', '0'] if bez_elst(ex)
                 else ['-movflags', '+faststart'])


def bez_elst(ex):
    """Predvolene bez edit listu; "bez_editlistu": false vráti bežný MP4 z ffmpeg (edit list rieši posuny sám)."""
    return ex.get('bez_editlistu', True)


def komp(ex):
    return KOMP_AAC if bez_elst(ex) else 'anull'


def test_sync(prac, ex=None):
    """Záblesk a pípnutie v 1,0 s cez rovnaké nastavenie exportu; vráti posun zvuku oproti obrazu v ms."""
    import numpy as np
    os.makedirs(prac, exist_ok=True)
    src, out = os.path.join(prac, 'sync-zdroj.mkv'), os.path.join(prac, 'sync-test.mp4')
    run(['-y', '-f', 'lavfi', '-i', f"color=black:s={W}x{H}:r={FPS}:d=3,drawbox=enable='eq(n\\,{FPS})':x=0:y=0:w=iw:h=ih:color=white:t=fill",
         '-f', 'lavfi', '-i', "sine=f=1000:r=48000:d=3,volume=enable='not(between(t\\,1.0\\,1.1))':volume=0",
         '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', '-c:a', 'pcm_s24le', src], popis='sync zdroj')
    ex = ex or {}
    run(['-y', '-i', src, '-af', komp(ex)] + parametre_videa(ex, FPS) + parametre_kontajnera(ex) + [out], popis='sync export')
    e = subprocess.run([FF, '-hide_banner', '-i', out, '-an', '-vf', 'scale=64:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    tv = next(float(t) for t, y in re.findall(r'pts_time:([\d.]+)\s*\n.*?YAVG=([\d.]+)', e) if float(y) > 128)
    raw = subprocess.run([FF, '-v', 'error', '-i', out, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
    ta = int(np.argmax(np.abs(np.frombuffer(raw, np.float32)) > 0.05)) / 48000
    return round((ta - tv) * 1000, 1)


def export(edl, zab, klipy, dlzka, wav, meranie, prac, ma_titulky):
    zc, ex = edl.get('zvuk', {}), edl.get('export', {})
    fps = edl.get('fps', FPS)
    args = ['-y']
    for z in zab:
        args += ['-i', z['subor']]
    args += ['-i', 'zmes.wav']
    fv, cur = graf_strihu(klipy, zab, 'v', fps)
    if ma_titulky:
        fv += f";[{cur}]ass=filename=titulky.ass:fontsdir=pisma[vo]"
    else:
        fv += f';[{cur}]null[vo]'
    I, TP, LRA = zc.get('lufs', -14), zc.get('true_peak', -1.0), zc.get('lra', 11)
    if meranie and meranie.get('metoda') == 'loudnorm':
        ln = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={meranie['input_i']}:measured_TP={meranie['input_tp']}:"
              f"measured_LRA={meranie['input_lra']}:measured_thresh={meranie['input_thresh']}:"
              f"offset={meranie['target_offset']}:linear=true:print_format=json,aresample=48000,{komp(ex)}")
    else:
        ln = komp(ex)                        # zmes je už normalizovaná (ebur128) alebo je to ticho
    fv += f';[{len(zab)}:a]{ln}[ao]'
    out = edl['vystup']
    os.makedirs(os.path.dirname(out), exist_ok=True)
    e = run(args + ['-filter_complex', fv, '-map', '[vo]', '-map', '[ao]'] + parametre_videa(ex, fps)
            + parametre_kontajnera(ex) + [out], cwd=prac, popis='export')
    typ = re.findall(r'"normalization_type" : "(\w+)"', e)
    return out, (typ[-1] if typ else None), e


# ---------------------------------------------------------------- 6. kontrola
def atomy(path):
    """Poradie hlavných boxov MP4 a či moov obsahuje edit list (elst) alebo polohu z telefónu."""
    out, moov = [], b''
    with open(path, 'rb') as f:
        while True:
            hd = f.read(8)
            if len(hd) < 8:
                break
            size, typ = int.from_bytes(hd[:4], 'big'), hd[4:8].decode('latin-1')
            hl = 8
            if size == 1:
                size, hl = int.from_bytes(f.read(8), 'big'), 16
            elif size == 0:
                size = os.path.getsize(path) - f.tell() + 8
            out.append(typ)
            if typ == 'moov':
                moov = f.read(size - hl)
            else:
                f.seek(size - hl, 1)
    return out, moov


def kontrola(path, zapis=None, povol_elst=False):
    """11 bodov podľa odporúčaní YouTube. povol_elst: edit list zámerne ponechaný (EDL "bez_editlistu": false)."""
    info = probe(path)
    typy, moov = atomy(path)
    r = {'subor': path, 'velkost_MB': round(os.path.getsize(path) / 1e6, 2), 'dlzka_s': round(info['dur'], 3)}
    r['boxy'] = typy
    r['faststart'] = 'moov' in typy and 'mdat' in typy and typy.index('moov') < typy.index('mdat')
    r['edit_list'] = b'elst' in moov
    r['poloha_v_metadatach'] = any(x in moov for x in (b'\xa9xyz', b'location', b'com.apple'))
    v = info.get('vline', '')
    r['video'] = v[:140]
    r['h264_high'] = v.startswith('h264 (High)')
    r['yuv420p_bt709'] = 'yuv420p(tv, bt709' in v
    r['rozmer'] = f"{info.get('w')}x{info.get('h')}"
    r['fps'] = info.get('fps')
    r['audio'] = (info['audio'] or '')[:90]
    r['aac_48k_stereo'] = bool(info['audio']) and info['audio'].startswith('aac (LC)') and '48000 Hz, stereo' in info['audio']
    vb = re.search(r'Video: .*?, (\d+) kb/s', info['log'])
    r['video_kbps'] = int(vb.group(1)) if vb else None
    # GOP a B-snímky
    e = subprocess.run([FF, '-hide_banner', '-i', path, '-vf', 'showinfo', '-an', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    typy_sn = re.findall(r'iskey:(\d).*?type:([IPB])', e)
    kluc = [i for i, (k, _) in enumerate(typy_sn) if k == '1']
    r['snimok'] = len(typy_sn)
    r['klucove_snimky'] = len(kluc)
    r['gop_max'] = max((b - a for a, b in zip(kluc, kluc[1:])), default=len(typy_sn))
    seq, mx = 0, 0
    for _, t in typy_sn:
        seq = seq + 1 if t == 'B' else 0
        mx = max(mx, seq)
    r['max_b_za_sebou'] = mx
    # hlasitosť EBU R128 so skutočnou špičkou
    m = meraj_r128(path)
    r['lufs'], r['lra'], r['true_peak_dbtp'] = m['I'], m['LRA'], m['TP']
    r['short_podla_youtube'] = (info.get('h', 0) >= info.get('w', 1)) and info['dur'] <= 180
    ok = {
        'faststart (moov pred mdat)': r['faststart'],
        ('edit list zámerne ponechaný (bez_editlistu: false)' if povol_elst else 'bez edit listu'):
            povol_elst or not r['edit_list'],
        'bez polohy a metadát telefónu': not r['poloha_v_metadatach'],
        'H.264 High, 4:2:0, BT.709': r['h264_high'] and r['yuv420p_bt709'],
        '1080x1920': r['rozmer'] == f'{W}x{H}',
        'AAC-LC 48 kHz stereo': r['aac_48k_stereo'],
        'GOP najviac polovica fps': r['gop_max'] <= round((r['fps'] or FPS) / 2),
        'najviac 2 B-snímky za sebou': r['max_b_za_sebou'] <= 2,
        'hlasitosť -14 LUFS ±1': r['lufs'] is not None and abs(r['lufs'] + 14) <= 1,
        'skutočná špička do -1 dBTP': r['true_peak_dbtp'] is not None and r['true_peak_dbtp'] <= -0.95,
        'zvislé, do 3 min (Short)': r['short_podla_youtube'],
    }
    r['vysledok'] = ok
    for k, v in ok.items():
        print(f"  {'OK ' if v else 'NIE'}  {k}")
    print(f"  dĺžka {r['dlzka_s']} s, {r['snimok']} snímok, video {r['video_kbps']} kb/s, {r['velkost_MB']} MB, "
          f"{r['lufs']} LUFS, LRA {r['lra']}, špička {r['true_peak_dbtp']} dBTP, GOP max {r['gop_max']}")
    if zapis:
        json.dump(r, open(zapis, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return r


def nahlad(path, casy, out):
    """Snímky v zadaných časoch vedľa seba so zónou YouTube (červená) a pásom titulkov (modrá)."""
    from PIL import Image, ImageDraw
    prac = os.path.dirname(out)
    ims = []
    for i, t in enumerate(casy):
        p = os.path.join(prac, f'_n{i}.png')
        run(['-y', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', p], popis='náhľad')
        im = Image.open(p).convert('RGB')
        d = ImageDraw.Draw(im, 'RGBA')
        d.rectangle(ZONA, outline=(255, 40, 40, 255), width=5)
        d.rectangle(PAS, outline=(40, 200, 255, 255), width=5)
        d.rectangle([0, 0, 260, 70], fill=(0, 0, 0, 200))
        d.text((14, 12), f'{t:.2f} s', fill=(255, 255, 0, 255), font_size=44)
        ims.append(im.resize((W // 2, H // 2)))
        os.remove(p)
    sheet = Image.new('RGB', (len(ims) * (W // 2 + 12), H // 2), (20, 20, 20))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * (W // 2 + 12), 0))
    sheet.save(out, quality=88)
    return out


# ---------------------------------------------------------------- hlavný beh
def main():
    global FF
    a = sys.argv[1:]
    if not a:
        print(__doc__); return 2
    FF = ffmpeg_bin()
    if '--test-sync' in a:
        d = [x for x in a if not x.startswith('--')]
        ms = test_sync(d[0] if d else 'sync-test')
        print(f'zvuk oproti obrazu {ms:+.1f} ms (zdroj má +2,7 ms: tón sa deteguje od prahu; rozdiel do ±5 ms je v poriadku)')
        return 0 if abs(ms - 2.7) <= 5 else 1
    if '--kontrola' in a:
        p = next((x for x in a if not x.startswith('--')), None)
        if not p:
            print('chyba: --kontrola potrebuje cestu k MP4', file=sys.stderr); return 2
        r = kontrola(p, os.path.splitext(p)[0] + '-kontrola.json')
        return 0 if all(r['vysledok'].values()) else 1
    edl = nacitaj(a[0])
    fps = edl.get('fps', FPS)
    out = edl['vystup']
    prac = os.path.join(os.path.dirname(out), os.path.splitext(os.path.basename(out))[0] + '-prac')
    os.makedirs(os.path.join(prac, 'pisma'), exist_ok=True)
    klipy = edl['klipy']
    tc = edl.get('titulky')
    if '--len-titulky' in a:
        zab = [{'T': round(((k['do'] if 'do' in k else probe(k['zdroj'])['dur']) - k.get('od', 0))
                           / k.get('rychlost', 1) * fps) / fps} for k in klipy]
        zac, dl = os_strihu(klipy, zab)
        meno, upoz = titulky(tc, dl, prac)
        print(f'titulky: {prac}/titulky.ass, .srt (písmo {meno}), dĺžka videa {dl:.2f} s')
        for u in upoz:
            print('  !', u)
        return 0
    print(f'1/5 zábery ({len(klipy)})')
    zab = []
    for i, k in enumerate(klipy):
        z = zaber(k, i, fps, prac)
        zab.append(z)
        print(f"    {i + 1}. {os.path.basename(k['zdroj'])} {k.get('od', 0)} až {k.get('do', 'koniec')} s, "
              f"{z['zdroj']} {z['hdr']} {z['zdroj_fps']} fps → {z['n']} snímok ({z['T']:.2f} s), zvuk {'áno' if z['zvuk'] else 'nie'}")
    zac, dl = os_strihu(klipy, zab)
    print('    začiatky záberov vo výsledku: ' + ', '.join(f'{t:.2f}' for t in zac) + f' s; spolu {dl:.2f} s')
    print('2/5 titulky')
    ma_tit = bool(tc and tc.get('frazy'))
    upoz = []
    if ma_tit:
        shutil.copy(tc['pismo'], os.path.join(prac, 'pisma', os.path.basename(tc['pismo'])))
        meno, upoz = titulky(tc, dl, prac)
        print(f'    {len(tc["frazy"])} fráz, písmo „{meno}“, štýl {tc.get("styl", "aktualne")}')
        for u in upoz:
            print('    !', u)
    print('3/5 zvuk a meranie hlasitosti')
    wav, meranie = zvuk(edl, zab, klipy, dl, prac)
    if meranie and meranie['metoda'] == 'ebur128':
        p0, p2 = meranie['pred'], meranie['po']
        print(f"    zmes {p0['I']} LUFS, špička {p0['TP']} dBTP → {meranie['postup']} → {p2['I']} LUFS, {p2['TP']} dBTP")
    elif meranie:
        if 'limiter_db' in meranie:
            print(f"    zosilnenie {meranie['limiter_db']:+.2f} dB s limiterom (lineárne by prekročilo špičku)")
        print(f"    loudnorm meral {meranie['input_i']} LUFS, špička {meranie['input_tp']} dBTP, LRA {meranie['input_lra']}")
    else:
        print('    zmes je ticho, hlasitosť sa nenormalizuje')
    print('4/5 export')
    vys, typ, log = export(edl, zab, klipy, dl, wav, meranie, prac, ma_tit)
    if typ:
        print(f'    loudnorm: {typ}' + ('' if typ == 'linear' else ' (dynamická úprava, zmes má veľký rozsah alebo špičky)'))
    chyby_pisma = sorted(set(re.findall(r'Glyph 0x[0-9A-Fa-f]+ not found[^\n]*', log)))
    for poz, vyb in re.findall(r'fontselect: \(([^,]+),[^)]*\) -> ([^,\n]+)', log):
        if poz.replace(' ', '').lower() not in vyb.replace(' ', '').lower():
            chyby_pisma.append(f'písmo {poz} nenájdené, libass použil {vyb}')
    for c in chyby_pisma:
        print('    ! libass:', c)
    print(f'5/5 kontrola {vys}')
    r = kontrola(vys, os.path.splitext(vys)[0] + '-kontrola.json', povol_elst=not bez_elst(edl.get('export', {})))
    r['libass_upozornenia'] = chyby_pisma
    r['titulky_upozornenia'] = upoz
    r['loudnorm_typ'] = typ
    r['zvuk_normalizacia'] = meranie
    r['sync_test_ms'] = test_sync(os.path.join(prac, 'sync'), edl.get('export', {}))
    print(f"  {'OK ' if abs(r['sync_test_ms'] - 2.7) <= 5 else 'NIE'}  synchronizácia pri týchto nastaveniach exportu "
          f"(záblesk a tón): {r['sync_test_ms']:+.1f} ms, zdroj +2,7 ms")
    r['zabery'] = [{k: v for k, v in z.items() if k != 'subor'} for z in zab]
    json.dump(r, open(os.path.splitext(vys)[0] + '-kontrola.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    casy = edl.get('nahlad_casy') or [round(dl * x, 2) for x in (0.1, 0.4, 0.7, 0.95)]
    n = nahlad(vys, casy, os.path.splitext(vys)[0] + '-nahlad.jpg')
    print(f'    náhľad {n}')
    return 0 if all(r['vysledok'].values()) and abs(r['sync_test_ms'] - 2.7) <= 5 else 1


if __name__ == '__main__':
    sys.exit(main())
