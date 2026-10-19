#!/usr/bin/env python3
"""Short vo formáte V4: stály titulok hore v čiernom páse, záber 16:9 v strede, čierny spodok.

    python3 -I titulok_16x9.py KONFIG.json [--len-ass]

Formát pochádza z rozboru V4 (billyfx, God's Eye View, 2026-10-17; references/format-16x9.md). Hodí sa na
recykláciu vodorovného materiálu (nahrávky webu, 360° prehliadka, vodorovné videá) bez preklápania na výšku.
Výsledok má tichú zvukovú stopu: hudbu, -14 LUFS a kontrolu 11 bodov doplní short.py (EDL s jedným klipom).

Konfigurácia (JSON, vzor assets/format-16x9-priklad.json; relatívne cesty sú od priečinka konfigurácie):
  vystup        cesta k MP4 (vedľa sa uloží rovnomenné .ass)
  fontsdir      priečinok s TTF (predvolene ../assets/pisma pri skripte; libass hľadá písma podľa mena rodiny)
  fps           snímky za sekundu (30)
  pas_y         horný okraj pásu 16:9 (608 px vysoký); 640 = pás 640..1247, celý nad dolnou zónou YouTube (1248)
  titulok       {riadky: [..], pismo, velkost, spodok, rozostup}: každý riadok je samostatná udalosť
                s \\an2\\pos(540, y), takže rozostup riadkov je presne v px (libass ho inak berie z písma)
  zabery        [{subor, od, dlzka, fy (0..1 poloha výrezu na výšku), priblizenie (napr. 0.05 = 5 %)}]
  kineticky     [{text, od, do, velkost}] veľké slovo v strede pásu (V4: „OPEN“ → „OPEN SOURCED“)
  kineticke_pismo  rodina písma kinetického slova (predvolene „Bebas Titulky“)
  pisaci_stroj  [{text, od, do, x, y, cps, velkost, kurzor_farba}] písanie po znakoch s kurzorom, potom blikanie
  kurzor_farba  predvolená farba kurzora RRGGBB (akcent značky)
  oznacenie     malý sivý text dole (napr. „skúška, nie na zverejnenie“), alebo ""

Vstup môže byť vodorovný aj zvislý: scale ... force_original_aspect_ratio=increase a crop 1080×608
na výšku podľa fy. Zo zvislého klipu 1080×1920 ostane len 32 % plochy (608 z 1920 riadkov).
Text kreslí libass (filter ass), drawtext netreba.

Návratové kódy: 0 v poriadku, 1 ffmpeg zlyhal, 2 zlé argumenty alebo konfigurácia.
"""
import json
import os
import shutil
import subprocess
import sys

W, H, BAND = 1080, 1920, 608
TU = os.path.dirname(os.path.abspath(__file__))
PISMA = os.path.normpath(os.path.join(TU, '..', 'assets', 'pisma'))


def ts(t):
    t = max(0.0, t)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t - h * 3600 - m * 60
    return f'{h}:{m:02d}:{s:05.2f}'


def esc(s):
    return s.replace('\\', '\\\\').replace('{', '(').replace('}', ')')


def ass(cfg, dur):
    t = cfg['titulok']
    out = ['[Script Info]', '; vygeneroval titulok_16x9.py', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}',
           'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '', '[V4+ Styles]',
           'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, '
           'Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, '
           'Alignment, MarginL, MarginR, MarginV, Encoding',
           # stály titulok: biely, bez obrysu a tieňa (pozadie je čisto čierne), ako V4
           f"Style: Titulok,{t['pismo']},{t['velkost']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,"
           '0,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1',
           # veľké slovo v hooku: zúžené verzálky, jemný tieň
           f"Style: Kineticky,{cfg.get('kineticke_pismo', 'Bebas Titulky')},200,&H10FFFFFF,&H00FFFFFF,"
           '&H00000000,&H80000000,0,0,0,0,100,100,2,0,1,0,4,5,0,0,0,1',
           # písací stroj: verzálky, rozostup +3; tmavá žiara = polopriesvitný čierny obrys rozmazaný \\blur
           # (V4 má bielu žiaru, lebo píše na tmavé pozadie; naše zábery sú svetlé)
           f"Style: Pisaci,{t['pismo']},60,&H00FFFFFF,&H00FFFFFF,&H50000000,&H00000000,"
           '0,0,0,0,100,100,3,0,1,6,0,7,0,0,0,1',
           'Style: Oznacenie,' + t['pismo'] + ',30,&H00909090,&H00909090,&H00000000,&H00000000,'
           '0,0,0,0,100,100,1,0,1,0,0,2,0,0,0,1',
           '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    n = len(t['riadky'])
    for i, r in enumerate(t['riadky']):
        y = t['spodok'] - (n - 1 - i) * t['rozostup']
        out.append(f"Dialogue: 2,{ts(0)},{ts(dur)},Titulok,,0,0,0,,{{\\an2\\pos(540,{y})}}{esc(r)}")
    cy = cfg['pas_y'] + BAND // 2
    for k in cfg.get('kineticky', []):
        v = k.get('velkost', 200)
        out.append(f"Dialogue: 1,{ts(k['od'])},{ts(k['do'])},Kineticky,,0,0,0,,"
                   f"{{\\an5\\pos(540,{cy})\\fs{v}\\fad(90,0)}}{esc(k['text'])}")
    for p in cfg.get('pisaci_stroj', []):
        txt, t0, t1, cps = p['text'], p['od'], p['do'], p.get('cps', 22)
        pos = f"{{\\an7\\pos({p['x']},{p['y']})\\fs{p.get('velkost', 60)}\\blur6}}"
        # kurzor: zúžená zvislá čiara vo farbe akcentu; v Manrope by plné „|“ vyzeralo ako písmeno I
        # (prvá skúška: „TERASA|“ sa čítalo „TERASAI“). Skrytý kurzor má rovnakú šírku, text neskáče.
        farba = p.get('kurzor_farba', cfg.get('kurzor_farba', 'FFFFFF'))   # RRGGBB
        bgr = farba[4:6] + farba[2:4] + farba[0:2]
        kurzor = f'{{\\fscx30\\fscy115\\1c&H{bgr}&}}|'
        skryty = '{\\fscx30\\fscy115\\alpha&HFF&}|'
        for i in range(1, len(txt) + 1):
            a, b = t0 + (i - 1) / cps, min(t0 + i / cps, t1)
            if a >= t1:
                break
            out.append(f'Dialogue: 1,{ts(a)},{ts(b)},Pisaci,,0,0,0,,{pos}{esc(txt[:i])}{kurzor}')
        tt = t0 + len(txt) / cps
        on = True
        while tt < t1 - 1e-3:                  # blikanie kurzora, perióda 0,5 s
            b = min(tt + 0.25, t1)
            out.append(f"Dialogue: 1,{ts(tt)},{ts(b)},Pisaci,,0,0,0,,{pos}{esc(txt)}{kurzor if on else skryty}")
            tt = b
            on = not on
    if cfg.get('oznacenie'):
        out.append(f"Dialogue: 0,{ts(0)},{ts(dur)},Oznacenie,,0,0,0,,{{\\an2\\pos(540,1860)}}{esc(cfg['oznacenie'])}")
    return '\n'.join(out) + '\n'


def nacitaj(cesta):
    try:
        with open(cesta, encoding='utf-8') as f:
            cfg = json.load(f)
    except (OSError, ValueError) as e:
        print(f'konfigurácia sa nedá prečítať: {e}', file=sys.stderr)
        sys.exit(2)
    zaklad = os.path.dirname(os.path.abspath(cesta))

    def abs_(p):
        return p if os.path.isabs(p) else os.path.normpath(os.path.join(zaklad, p))

    chyby = [k for k in ('vystup', 'titulok', 'zabery') if k not in cfg]
    if chyby:
        print(f'v konfigurácii chýba: {", ".join(chyby)}', file=sys.stderr)
        sys.exit(2)
    cfg['vystup'] = abs_(cfg['vystup'])
    cfg['fontsdir'] = abs_(cfg['fontsdir']) if cfg.get('fontsdir') else PISMA
    cfg.setdefault('pas_y', 640)
    if not 0 <= cfg['pas_y'] <= H - BAND:
        print(f'pas_y {cfg["pas_y"]} je mimo 0..{H - BAND}', file=sys.stderr)
        sys.exit(2)
    if cfg['pas_y'] + BAND > 1248:
        print(f'! pás 16:9 končí na {cfg["pas_y"] + BAND} px, pod hranicou 1248 px ho na YouTube zakryje názov a kanál')
    for z in cfg['zabery']:
        z['subor'] = abs_(z['subor'])
        if not os.path.isfile(z['subor']):
            print(f'záber {z["subor"]} neexistuje', file=sys.stderr)
            sys.exit(2)
        if z.get('dlzka', 0) <= 0:
            print(f'záber {z["subor"]}: dlzka musí byť kladná', file=sys.stderr)
            sys.exit(2)
    return cfg


def main(argv):
    subory = [a for a in argv if not a.startswith('--')]
    if len(subory) != 1:
        print(__doc__.strip().splitlines()[2].strip(), file=sys.stderr)
        return 2
    cfg = nacitaj(subory[0])
    zab = cfg['zabery']
    fps = cfg.get('fps', 30)
    dur = sum(z['dlzka'] for z in zab)
    out = cfg['vystup']
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ass_path = os.path.splitext(out)[0] + '.ass'
    with open(ass_path, 'w', encoding='utf-8') as f:
        f.write(ass(cfg, dur))
    if '--len-ass' in argv:
        print(ass_path)
        return 0
    ff = shutil.which('ffmpeg')
    if not ff:
        print('ffmpeg sa nenašiel v PATH', file=sys.stderr)
        return 1
    cmd = [ff, '-hide_banner', '-v', 'error', '-y']
    for z in zab:
        cmd += ['-ss', str(z.get('od', 0)), '-t', str(z['dlzka']), '-i', z['subor']]
    cmd += ['-f', 'lavfi', '-t', f'{dur:.3f}', '-i', 'anullsrc=r=48000:cl=stereo']
    parts = []
    for i, z in enumerate(zab):
        fy = z.get('fy', 0.5)
        zoom = z.get('priblizenie', 0)
        f = (f'[{i}:v]fps={fps},scale={W}:{BAND}:force_original_aspect_ratio=increase:flags=lanczos,'
             f'crop={W}:{BAND}:(iw-{W})/2:(ih-{BAND})*{fy}')
        if zoom:
            n = max(1, round(z['dlzka'] * fps))
            # zoompan po 1 snímke; 2× väčší vstup zmenší skákanie zaokrúhľovaním polohy
            f += (f',scale={2 * W}:{2 * BAND},zoompan=z=\'1+{zoom}*on/{n}\':d=1:'
                  f'x=\'iw/2-iw/zoom/2\':y=\'ih/2-ih/zoom/2\':s={W}x{BAND}:fps={fps}')
        f += f',setsar=1,format=yuv420p[v{i}]'
        parts.append(f)
    cat = ''.join(f'[v{i}]' for i in range(len(zab)))
    fd = cfg['fontsdir'].replace(':', '\\:')
    ap = ass_path.replace(':', '\\:')
    parts.append(f'{cat}concat=n={len(zab)}:v=1:a=0,pad={W}:{H}:0:{cfg["pas_y"]}:black,'
                 f"ass='{ap}':fontsdir='{fd}',format=yuv420p[v]")
    cmd += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', f'{len(zab)}:a',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', str(fps),
            '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', out]
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print('ffmpeg zlyhal', file=sys.stderr)
        return 1
    print(out, f'{dur:.2f} s')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
