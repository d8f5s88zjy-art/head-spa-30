#!/usr/bin/env python3
"""Kostra EDL pre short.py podľa rytmu strihu referenčného videa a priečinka vlastných klipov.

„Strih podľa referencie“ bez cudzej služby: z referencie berieme len časy strihov (rytmus), nie obraz, zvuk
ani text. Časy dá strihy.sh (zabery.csv). Každý záber referencie dostane úsek nášho klipu v rovnakej dĺžke,
po snímkach presne pri fps výstupu, voliteľne prichytený na mriežku dôb vlastnej hudby. Výsledok je kostra:
poradie a výber záberov podľa obsahu, titulky a hudbu dopĺňa človek (alebo Claude) a kontroluje short.py.

  python3 -I strih_podla_referencie.py REF.mp4 KLIPY/ -o strih.json [voľby]      # detekcia cez strihy.sh
  python3 -I strih_podla_referencie.py zabery.csv a.mp4 b.mp4 -o strih.json       # hotové časy, klipy v poradí
  python3 -I strih_podla_referencie.py --porovnaj short.mp4 strih.json            # sedia strihy výsledku s plánom?

Voľby (predvolené hodnoty v zátvorke):
  --prah (0.12)        citlivosť detekcie pri vstupe videa (strihy.sh --prah); pri V2 dalo 0.12 28 záberov (ručne 27)
  --zlucit (0.3)       detekcie bližšie ako toľko sekúnd sú jeden strih (strihy.sh --zlucit)
  --od, --do           použi len túto časť referencie (s)
  --mierka (1.0)       tempo: 1.25 = každý záber o 25 % dlhší (pokojnejšia značka, HEAD SPA 30)
  --min-zaber (0)      kratšie zábery sa zlúčia so susedným (záblesky, rýchle série)
  --max-zaber (0)      dlhšie zábery sa rozdelia na rovnaké časti (recept: nič nad 3,5 s bez zmeny)
  --bpm, --prvy-beat (0), --delenie (1)   prichyť strihy na doby vlastnej hudby (delenie 2 = aj polovice dôb)
  --hudba, --hudba-db (0)                 hudba do EDL: vlastná alebo licencovaná, nikdy zvuk referencie
  --klipy-zvuk         nechaj zvuk klipov (predvolene vypnutý, rytmus nesie hudba)
  --okraj (0.15)       neber prvých a posledných toľko sekúnd klipu (trasenie pri štarte a stope)
  --prechod TYP:DĹŽKA a --prechod-na 4,9  prechod xfade (napr. circleopen, rectcrop, vertopen, prelinanie) na
                       začiatku týchto záberov kostry; predošlý záber sa predĺži, strih ostane v čase referencie
  --fps (30), --vystup (<meno EDL>.mp4 vedľa EDL), --referencia REF.mp4 (pri vstupe CSV, pre hárok)
  --harok              hárok párov: stred záberu referencie vedľa nášho záberu (kontrola kompozície a pohybu)

Výstup: EDL (JSON pre short.py), <EDL>-mapa.csv (záber, čas, klip, úsek), voliteľne <EDL>-harok.jpg; pri vstupe
videa <EDL>-referencia/ (výstup strihy.sh), pri --porovnaj <short>-porovnanie/. Overené 2026-10-19 na V2 (sadie.ontech)
a V10 (dazzzlme) s klipmi GYM KLUB: tvrdé strihy výsledku na snímku presne podľa plánu, short.py 11 z 11.
Návratové kódy: 0 v poriadku, 1 chyba vstupu alebo nesúlad pri --porovnaj, 2 zlé argumenty.
"""
import argparse, csv, glob, json, math, os, re, shutil, subprocess, sys

TU = os.path.dirname(os.path.abspath(__file__))
PISMO = os.path.normpath(os.path.join(TU, '..', 'assets', 'pisma', 'ManropeTitulky-700.ttf'))
PRIPONY = ('.mp4', '.mov', '.m4v', '.mkv', '.webm')
POZICIE = (0.5, 0.0, 1.0, 0.25, 0.75)       # kde v klipe brať úsek pri 1., 2., 3. … použití
MIN_RYCHLOST = 0.5                          # pomalší chod ako polovica pôsobí ako chyba, nie ako zámer


def chyba(text, kod=1):
    sys.stdout.flush()                      # pri presmerovanom výstupe nech chyba príde po vypísaných krokoch
    print('chyba: ' + text, file=sys.stderr)
    sys.exit(kod)


def ffmpeg_bin():
    p = shutil.which('ffmpeg')
    if not p:
        try:
            import imageio_ffmpeg
            p = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            chyba('chýba ffmpeg (ani v PATH, ani imageio_ffmpeg)')
    return p


FF = None


def dlzka(path, obraz=True):
    """Dĺžka súboru v sekundách z výpisu ffmpeg -i (ffprobe nemusí byť k dispozícii)."""
    e = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', e)
    if not m:
        chyba(f'{path} sa nedá prečítať')
    if obraz and 'Video:' not in e:
        chyba(f'{path} nemá obraz')
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


# ---------------------------------------------------------------- 1. časy záberov referencie
def strihy_sh(video, out, prah, zlucit):
    sh = os.path.join(TU, 'strihy.sh')
    if not os.path.isfile(sh):
        chyba(f'chýba {sh} (skript patrí do toolbox/skills-z-praxe/youtube-shorts/scripts/)')
    env = dict(os.environ, PATH=os.path.dirname(FF) + os.pathsep + os.environ.get('PATH', ''))
    r = subprocess.run(['bash', sh, video, out, '--prah', str(prah), '--zlucit', str(zlucit)],
                       capture_output=True, text=True, env=env)
    if r.returncode:
        sys.stderr.write(r.stderr)
        chyba('strihy.sh zlyhal')
    print('  ' + '\n  '.join(r.stdout.strip().splitlines()[:6]))
    return os.path.join(out, 'zabery.csv')


def nacitaj_zabery(path):
    """zabery.csv zo strihy.sh (číslo;od;do;dĺžka) → hranice [0, strih1, …, koniec]."""
    hr = []
    with open(path, encoding='utf-8') as f:
        for i, riadok in enumerate(csv.reader(f, delimiter=';')):
            if i == 0 or not riadok:
                continue
            od, do = float(riadok[1]), float(riadok[2])
            if not hr:
                hr.append(od)
            hr.append(do)
    if len(hr) < 2:
        chyba(f'{path}: žiadne zábery')
    return hr


# ---------------------------------------------------------------- 2. úprava hraníc
def uprav_hranice(hr, a):
    od = a.od if a.od is not None else hr[0]
    do = a.do if a.do is not None else hr[-1]
    if not hr[0] <= od < do <= hr[-1] + 1e-6:
        chyba(f'--od/--do mimo referencie ({hr[0]:.2f} až {hr[-1]:.2f} s)', 2)
    vnutri = [t for t in hr[1:-1] if od + 1e-3 < t < do - 1e-3]
    b = [0.0] + [(t - od) * a.mierka for t in vnutri] + [(do - od) * a.mierka]
    poz = []
    if a.bpm:
        g = 60.0 / a.bpm / a.delenie
        nove = [0.0]
        for t in b[1:]:
            s = a.prvy_beat + round((t - a.prvy_beat) / g) * g
            if s > nove[-1] + 1e-6:
                nove.append(s)
            else:
                poz.append(f'strih {t:.2f} s padol po prichytení na predošlý ({s:.2f} s), zábery sa zlúčili')
        b = nove
    if a.min_zaber > 0:
        while len(b) > 2:
            d = [y - x for x, y in zip(b, b[1:])]
            i = min(range(len(d)), key=lambda k: d[k])
            if d[i] >= a.min_zaber - 1e-6:
                break
            k = i + 1 if i + 1 < len(b) - 1 else i      # zlúč s nasledujúcim; posledný s predošlým
            poz.append(f'záber {b[i]:.2f} až {b[i + 1]:.2f} s kratší ako {a.min_zaber} s, zlúčený')
            del b[k]
    if a.max_zaber > 0:
        nove = [b[0]]
        for x, y in zip(b, b[1:]):
            n = math.ceil((y - x) / a.max_zaber - 1e-9)
            for j in range(1, n):
                t = x + (y - x) * j / n
                if a.bpm:
                    g = 60.0 / a.bpm / a.delenie
                    t = a.prvy_beat + round((t - a.prvy_beat) / g) * g
                if nove[-1] + 1e-6 < t < y - 1e-6:
                    nove.append(t)
            nove.append(y)
        if len(nove) > len(b):
            poz.append(f'{len(nove) - len(b)} dlhých záberov rozdelených (--max-zaber {a.max_zaber})')
        b = nove
    return od, b, poz


# ---------------------------------------------------------------- 3. klipy
def zoznam_klipov(vstupy):
    out = []
    for v in vstupy:
        if os.path.isdir(v):
            out += sorted(p for p in glob.glob(os.path.join(v, '*')) if p.lower().endswith(PRIPONY))
        elif os.path.isfile(v):
            out.append(v)
        else:
            chyba(f'{v} neexistuje', 2)
    if not out:
        chyba('žiadne klipy (prípony ' + ', '.join(PRIPONY) + ')', 2)
    return [{'cesta': os.path.abspath(p), 'L': dlzka(p), 'pouzite': 0} for p in out]


def prirad(potreby, klipy, okraj):
    """Každému záberu (výstupné sekundy) úsek klipu: v poradí klipov, nepoužité skôr ako použité; dlhý záber
    hľadá dostatočne dlhý klip, a keď žiadny nie je, spomalí najdlhší (najviac na MIN_RYCHLOST)."""
    vysl, p, poz = [], 0, []
    okno = lambda k: k['L'] - 2 * okraj if k['L'] > 2 * okraj + 0.2 else k['L']   # krátky klip celý
    for i, sek in enumerate(potreby):
        vyber, r = None, 1.0
        # najprv menej použité klipy, medzi nimi najbližší v poradí od ukazovateľa
        poradie = sorted(range(len(klipy)), key=lambda j: (klipy[j]['pouzite'], (j - p) % len(klipy)))
        for j in poradie:
            if okno(klipy[j]) >= sek - 1e-6:
                vyber = j
                break
        if vyber is None:
            vyber = max(range(len(klipy)), key=lambda j: okno(klipy[j]))
            r = okno(klipy[vyber]) / sek
            if r < MIN_RYCHLOST:
                chyba(f'záber {i + 1} trvá {sek:.2f} s, najdlhší klip dá len {okno(klipy[vyber]):.2f} s ani pri '
                      f'rýchlosti {MIN_RYCHLOST}; použi --max-zaber alebo dlhší klip')
            r = math.floor(r * 1e4) / 1e4
            poz.append(f'záber {i + 1}: žiadny klip nemá {sek:.2f} s, spomalený {os.path.basename(klipy[vyber]["cesta"])} '
                       f'na rýchlosť {r}')
        k = klipy[vyber]
        o = okno(k)
        zac = okraj if o < k['L'] else 0.0
        span = sek * r
        pos = POZICIE[k['pouzite'] % len(POZICIE)]
        od = zac + (o - span) * pos
        od = math.floor(od * 1e4) / 1e4
        do = od + span
        if do > k['L']:
            od, do = k['L'] - span, k['L']
        if k['pouzite']:
            poz.append(f'záber {i + 1}: {os.path.basename(k["cesta"])} použitý {k["pouzite"] + 1}. raz (iný úsek)')
        k['pouzite'] += 1
        vysl.append({'klip': k, 'od': od, 'do': do, 'r': r})
        p = (vyber + 1) % len(klipy)
    return vysl, poz


# ---------------------------------------------------------------- 4. EDL
def zostav(a):
    edl_cesta = os.path.abspath(a.vystup_edl)
    base = os.path.dirname(edl_cesta)
    os.makedirs(base, exist_ok=True)
    rel = lambda p: os.path.relpath(p, base)
    vstup = os.path.abspath(a.vstup)
    detekcia = not vstup.lower().endswith('.csv')
    if not detekcia:
        zab_csv = vstup
        ref_video = os.path.abspath(a.referencia) if a.referencia else None
    else:
        ref_video = vstup
        out = os.path.splitext(edl_cesta)[0] + '-referencia'
        print(f'1/4 strihy referencie (strihy.sh, prah {a.prah})')
        zab_csv = strihy_sh(vstup, out, a.prah, a.zlucit)
    hr = nacitaj_zabery(zab_csv)
    od, b, poz = uprav_hranice(hr, a)
    fps = a.fps
    B = [round(t * fps) for t in b]                # hranice v snímkach: strihy padnú presne, chyba sa nesčíta
    zab = [(x, y) for x, y in zip(B, B[1:]) if y > x]
    if not zab:
        chyba('po úpravách nezostal žiadny záber')
    # prechody: predošlý záber sa predĺži o dĺžku prechodu, nový začne v čase strihu referencie
    prech = {}
    if a.prechod:
        typ, _, d = a.prechod.partition(':')
        d = float(d or 0.3)
        for c in a.prechod_na:
            if not 2 <= c <= len(zab):
                chyba(f'--prechod-na {c}: kostra má zábery 1 až {len(zab)} (prvý nemôže mať prechod)', 2)
            nd = round(d * fps)
            if nd >= zab[c - 1][1] - zab[c - 1][0] or nd >= zab[c - 2][1] - zab[c - 2][0]:
                chyba(f'prechod {d} s je dlhší ako záber {c - 1} alebo {c}', 2)
            prech[c] = (typ, nd)
    potreby = []
    for i, (x, y) in enumerate(zab, 1):
        n = y - x + (prech[i + 1][1] if i + 1 in prech else 0)
        potreby.append(n / fps)
    print(f'2/4 klipy ({", ".join(a.klipy)})')
    klipy = zoznam_klipov(a.klipy)
    for k in klipy:
        print(f'    {os.path.basename(k["cesta"])} {k["L"]:.2f} s')
    pr, poz2 = prirad(potreby, klipy, a.okraj)
    poz += poz2
    print(f'3/4 kostra: {len(zab)} záberov, {B[-1] / fps:.2f} s')
    kl, mapa = [], []
    for i, ((x, y), u) in enumerate(zip(zab, pr), 1):
        k = {'zdroj': rel(u['klip']['cesta']), 'od': round(u['od'], 4), 'do': round(u['do'], 4)}
        if u['r'] != 1.0:
            k['rychlost'] = u['r']
        if not a.klipy_zvuk:
            k['zvuk'] = False
        if i in prech:
            k['prechod'] = {'typ': prech[i][0], 'dlzka': round(prech[i][1] / fps, 4)}
        ref = [round(od + x / fps / a.mierka, 2), round(od + y / fps / a.mierka, 2)]
        k['ref'] = ref                             # short.py pole ignoruje; slúži na kontrolu a hárok
        # kontrola: short.py počíta snímky ako round((do - od) / rychlost * fps)
        n = int(round((k['do'] - k['od']) / k.get('rychlost', 1.0) * fps))
        ocak = y - x + (prech[i + 1][1] if i + 1 in prech else 0)
        if n != ocak:
            chyba(f'záber {i}: short.py by dal {n} snímok namiesto {ocak} (zaokrúhlenie), nahlás chybu skriptu')
        kl.append(k)
        mapa.append([i, f'{ref[0]:.2f}', f'{ref[1]:.2f}', f'{x / fps:.3f}', f'{y / fps:.3f}', f'{(y - x) / fps:.3f}',
                     os.path.basename(u['klip']['cesta']), f'{k["od"]:.3f}', f'{k["do"]:.3f}', k.get('rychlost', 1),
                     f'{prech[i][0]} {prech[i][1] / fps:.2f} s' if i in prech else ''])
    edl = {
        'popis': ('Kostra zo strih_podla_referencie.py: časy záberov podľa referencie, klipy priradené v poradí. '
                  'Pred výrobou: vymeň klipy podľa obsahu (hook, kroky, druhý hook, výzva), doplň titulky zo zdrojov '
                  'prevádzky a hudbu (vlastná alebo licencovaná). Pole ref (čas v referencii) short.py ignoruje.'),
        'referencia': {
            'video': ref_video, 'zabery_csv': zab_csv,
            'prah': a.prah if detekcia else None, 'zlucit': a.zlucit if detekcia else None,
            'od': od, 'do': round(od + b[-1] / a.mierka, 3), 'mierka': a.mierka,
            'bpm': a.bpm, 'prvy_beat': a.prvy_beat if a.bpm else None, 'delenie': a.delenie if a.bpm else None,
            'min_zaber': a.min_zaber, 'max_zaber': a.max_zaber, 'zaberov_v_referencii': len(hr) - 1,
            'zaberov_v_kostre': len(zab),
            'strihy_s': [round(x / fps, 3) for x, _ in zab[1:]],
        },
        'vystup': rel(os.path.abspath(a.vystup)) if a.vystup else os.path.splitext(os.path.basename(edl_cesta))[0] + '.mp4',
        'fps': fps,
        'klipy': kl,
    }
    if os.path.isfile(PISMO):
        edl['titulky'] = {'pismo': rel(PISMO), 'styl': 'aktualne', 'velkost': 76, 'farba': '#FFFFFF',
                          'zvyraznenie': '#D4B062', 'podklad': '#161616', 'podklad_kryt': 0.85, 'podklad_tvar': 'jeden',
                          'spodok': 1240, 'okraj': 195, 'fade_ms': 120, 'frazy': []}
    zv = {'klipy_db': 0, 'lufs': -14, 'true_peak': -1.0, 'rezerva_aac_db': 1.0, 'metoda': 'ebur128'}
    if a.hudba:
        if not os.path.isfile(a.hudba):
            chyba(f'hudba {a.hudba} neexistuje', 2)
        zv['hudba'] = {'zdroj': rel(os.path.abspath(a.hudba)), 'od': 0, 'db': a.hudba_db, 'nabeh': 0.05, 'dobeh': 0.8}
        if dlzka(a.hudba, False) < B[-1] / fps - 0.05:
            poz.append(f'hudba má {dlzka(a.hudba, False):.2f} s, short {B[-1] / fps:.2f} s: koniec bude bez hudby')
    elif not a.klipy_zvuk:
        poz.append('bez hudby a bez zvuku klipov: short.py hlasitosť nevyrovná a kontrola -14 LUFS neprejde')
    edl['zvuk'] = zv
    edl['export'] = {'crf': 18, 'maxrate': '16M', 'bufsize': '32M', 'preset': 'slow', 'audio_kbps': 384,
                     'bez_editlistu': True}
    stredy = [(x + y) / 2 / fps for x, y in zab]
    edl['nahlad_casy'] = [round(stredy[j], 2) for j in sorted({0, len(stredy) // 2, len(stredy) - 1})]
    json.dump(edl, open(edl_cesta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    mapa_cesta = os.path.splitext(edl_cesta)[0] + '-mapa.csv'
    with open(mapa_cesta, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['číslo', 'ref_od', 'ref_do', 'short_od', 'short_do', 'dĺžka', 'klip', 'klip_od', 'klip_do',
                    'rýchlosť', 'prechod'])
        w.writerows(mapa)
    d = sorted((y - x) / fps for x, y in zab)
    med = d[len(d) // 2] if len(d) % 2 else (d[len(d) // 2 - 1] + d[len(d) // 2]) / 2
    print(f'    zábery: medián {med:.2f} s, najkratší {d[0]:.2f} s, najdlhší {d[-1]:.2f} s; '
          f'prvý strih {zab[1][0] / fps if len(zab) > 1 else 0:.2f} s')
    for x in poz:
        print('    ! ' + x)
    print(f'4/4 {edl_cesta}\n    {mapa_cesta}')
    if a.harok:
        if not ref_video:
            print('    ! hárok potrebuje referenčné video (--referencia pri vstupe CSV)')
        else:
            print('    ' + harok(edl, ref_video, base, os.path.splitext(edl_cesta)[0] + '-harok.jpg'))
    return 0


def snimka(video, t, w=200):
    from PIL import Image
    import io
    r = subprocess.run([FF, '-v', 'error', '-ss', f'{max(0, t):.3f}', '-i', video, '-frames:v', '1',
                        '-vf', f'scale={w}:-2', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True)
    if not r.stdout:
        return Image.new('RGB', (w, round(w * 16 / 9)), (60, 0, 0))
    return Image.open(io.BytesIO(r.stdout)).convert('RGB')


def harok(edl, ref_video, base, out, w=200):
    """Pár na záber: vľavo stred záberu referencie, vpravo stred nášho úseku; číslo záberu a dĺžka."""
    from PIL import Image, ImageDraw
    pary = []
    for i, k in enumerate(edl['klipy'], 1):
        ra, rb = k['ref']
        L = snimka(ref_video, (ra + rb) / 2, w)
        R = snimka(os.path.join(base, k['zdroj']), (k['od'] + k['do']) / 2, w)
        h = max(L.height, R.height)
        p = Image.new('RGB', (2 * w + 6, h + 26), (24, 24, 24))
        p.paste(L, (0, 26)); p.paste(R, (w + 6, 26))
        dl = (k['do'] - k['od']) / k.get('rychlost', 1)
        ImageDraw.Draw(p).text((4, 4), f'{i}. ref {ra:.2f} s | {os.path.basename(k["zdroj"])} {dl:.2f} s',
                               fill=(255, 220, 0), font_size=15)
        pary.append(p)
    st = 4
    W, H = max(p.width for p in pary), max(p.height for p in pary)
    rows = math.ceil(len(pary) / st)
    sh = Image.new('RGB', (st * (W + 10), rows * (H + 10)), (10, 10, 10))
    for i, p in enumerate(pary):
        sh.paste(p, ((i % st) * (W + 10), (i // st) * (H + 10)))
    sh.save(out, quality=86)
    return f'hárok {out} ({len(pary)} párov: referencia vľavo, náš záber vpravo)'


# ---------------------------------------------------------------- 5. porovnanie výsledku s plánom
def porovnaj(video, edl_cesta, tol_snimok=1):
    edl = json.load(open(edl_cesta, encoding='utf-8'))
    fps = edl.get('fps', 30)
    plan, t, typy = [], 0.0, []
    for i, k in enumerate(edl['klipy']):
        n = int(round((k['do'] - k['od']) / k.get('rychlost', 1.0) * fps))
        p = k.get('prechod', {})
        d = p.get('dlzka', 0) if i and p.get('typ', 'strih') != 'strih' else 0
        t -= round(d * fps) / fps
        if i:
            plan.append(t)
            typy.append(p.get('typ', 'strih') if d else 'strih')
        t += n / fps
    out = os.path.splitext(os.path.abspath(video))[0] + '-porovnanie'
    strihy_sh(os.path.abspath(video), out, 0.12, 0.05)
    det = [float(r.split()[0]) for r in open(os.path.join(out, 'detekcie.txt')) if r.strip()]
    det = [x for x in det if 0.05 < x < t - 0.05]          # prvá a posledná snímka nie sú strih (ako strihy.sh)
    tol = (tol_snimok + 0.5) / fps
    ok, zle, prech = 0, [], 0
    for c, ty in zip(plan, typy):
        if ty != 'strih':
            prech += 1                                     # postupný prechod detekcia nenájde spoľahlivo
            continue
        bl = min(det, key=lambda x: abs(x - c)) if det else None
        if bl is not None and abs(bl - c) <= tol:
            ok += 1
        else:
            zle.append(f'{c:.3f} s (najbližšia detekcia {bl if bl is None else round(bl, 3)})')
    navyse = [x for x in det if all(abs(x - c) > tol for c in plan)]
    tvrde = len(plan) - prech
    print(f'plán: {len(plan)} strihov ({tvrde} tvrdých, {prech} s prechodom), dĺžka {t:.2f} s')
    print(f'výsledok: {len(det)} detekcií pri prahu 0.12; tvrdé strihy nájdené do ±{tol_snimok} snímky: {ok} z {tvrde}')
    if zle:
        print('  nenájdené (podobné zábery za sebou alebo pomalý pohyb): ' + ', '.join(zle))
    if navyse:
        print('  detekcie navyše (zmena vnútri záberu, prechod): ' + ', '.join(f'{x:.2f}' for x in navyse))
    return 0 if ok == tvrde else 1


def main():
    global FF
    if '--porovnaj' in sys.argv:
        a = [x for x in sys.argv[1:] if x != '--porovnaj']
        if len(a) != 2:
            print('použitie: --porovnaj short.mp4 strih.json', file=sys.stderr); return 2
        FF = ffmpeg_bin()
        return porovnaj(a[0], a[1])
    ap = argparse.ArgumentParser(description='Kostra EDL pre short.py podľa rytmu strihu referencie.',
                                 epilog='Podrobne v docstringu skriptu a v SKILL.md (Strih podľa referencie).')
    ap.add_argument('vstup', help='referenčné video alebo zabery.csv zo strihy.sh')
    ap.add_argument('klipy', nargs='+', help='priečinok klipov (abecedne) alebo súbory v želanom poradí')
    ap.add_argument('-o', '--edl', dest='vystup_edl', required=True, help='kam zapísať EDL (JSON)')
    ap.add_argument('--vystup', help='cesta hotového shortu v EDL (predvolene vedľa EDL)')
    ap.add_argument('--referencia', help='referenčné video pri vstupe CSV (pre hárok)')
    ap.add_argument('--prah', type=float, default=0.12)
    ap.add_argument('--zlucit', type=float, default=0.3)
    ap.add_argument('--od', type=float)
    ap.add_argument('--do', type=float)
    ap.add_argument('--mierka', type=float, default=1.0)
    ap.add_argument('--min-zaber', type=float, default=0.0)
    ap.add_argument('--max-zaber', type=float, default=0.0)
    ap.add_argument('--bpm', type=float)
    ap.add_argument('--prvy-beat', type=float, default=0.0)
    ap.add_argument('--delenie', type=int, default=1)
    ap.add_argument('--hudba')
    ap.add_argument('--hudba-db', type=float, default=0.0)
    ap.add_argument('--klipy-zvuk', action='store_true')
    ap.add_argument('--okraj', type=float, default=0.15)
    ap.add_argument('--prechod')
    ap.add_argument('--prechod-na', type=lambda s: [int(x) for x in s.split(',') if x], default=[])
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--harok', action='store_true')
    a = ap.parse_args()
    if a.mierka <= 0 or (a.bpm is not None and a.bpm <= 0) or a.delenie < 1 or a.okraj < 0:
        ap.error('mierka, bpm a delenie musia byť kladné, okraj nezáporný')
    if a.max_zaber and a.min_zaber and a.max_zaber < 2 * a.min_zaber:
        ap.error('--max-zaber musí byť aspoň dvojnásobok --min-zaber')
    FF = ffmpeg_bin()
    return zostav(a)


if __name__ == '__main__':
    sys.exit(main())
