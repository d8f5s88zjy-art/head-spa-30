#!/usr/bin/env python3
"""Import zmien zo správy webu do repozitára (README, časť Správa webu – Zmeny z hostingu späť do repozitára).

  python3 -I nastroje/sprava_import.py <richtarik-obsah-….zip alebo .tar> [--len-over]

1. Rozbalí export do nového prázdneho priečinka mimo repozitára a skontroluje každú cestu (len data/*.json, img/s/**,
   pdf/s/**, odtlacky.json, profil.json, verzia.json; žiadne .., absolútne cesty, odkazy ani iné prípony), JSON a typy
   súborov. Pri prvej chybe skončí a v repozitári nič nezmení.
2. Skopíruje údaje a nahrávky do repozitára (existujúci súbor s iným obsahom = chyba, nahrávky sa nikdy neprepisujú).
3. Spustí python3 build.py, výstup prenesie cez nasadenie/profil.py s profilom z exportu a porovná odtlačky sha256
   s odtlacky.json (sitemap.xml bez lastmod). Rozdiel = chyba kódu (PHP a Python sa rozišli), nie dôvod meniť obsah.
--len-over: len kroky 1 a kontrola, nič sa nekopíruje.
"""
import hashlib, json, os, re, shutil, subprocess, sys, tarfile, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POVOLENE = re.compile(r'^(data/(firma|cennik|akcie|caste|novinky|galeria|texty|verzia)\.json|img/s/\d{4}/\d{2}/[a-z0-9-]+\.(webp|avif)|pdf/s/\d{4}/\d{2}/[a-z0-9-]+\.pdf|odtlacky\.json|profil\.json|verzia\.json)$')
HLAVICKY = {'.webp': lambda b: b[:4] == b'RIFF' and b[8:12] == b'WEBP', '.avif': lambda b: b[4:12] in (b'ftypavif', b'ftypavis'), '.pdf': lambda b: b[:5] == b'%PDF-'}


class Chyba(Exception):
    pass


def rozbal(archiv, ciel):
    """Rozbalí archív do prázdneho priečinka ciel; každú cestu overí pred zápisom."""
    clenovia = []
    if zipfile.is_zipfile(archiv):
        z = zipfile.ZipFile(archiv)
        for i in z.infolist():
            if i.is_dir(): continue
            if (i.external_attr >> 16) & 0o170000 == 0o120000: raise Chyba(f'odkaz (symlink) v archíve: {i.filename}')
            clenovia.append((i.filename, lambda i=i: z.read(i), i.file_size))
    elif tarfile.is_tarfile(archiv):
        t = tarfile.open(archiv)
        for i in t.getmembers():
            if i.isdir(): continue
            if not i.isfile(): raise Chyba(f'nepovolený typ položky v archíve: {i.name}')
            clenovia.append((i.name, lambda i=i: t.extractfile(i).read(), i.size))
    else:
        raise Chyba('súbor nie je ZIP ani TAR')
    spolu = 0
    for meno, _, velkost in clenovia:
        if meno.startswith('/') or '\\' in meno or '..' in meno.split('/') or not POVOLENE.match(meno): raise Chyba(f'nepovolená cesta v archíve: {meno}')
        spolu += velkost
        if spolu > 2 << 30: raise Chyba('archív je príliš veľký')
    if not any(m == 'data/akcie.json' for m, _, _ in clenovia): raise Chyba('v archíve chýbajú údaje (data/akcie.json)')
    for meno, citaj, _ in clenovia:
        b = citaj()
        pripona = os.path.splitext(meno)[1]
        if pripona in HLAVICKY and not HLAVICKY[pripona](b): raise Chyba(f'súbor {meno} nemá obsah svojho typu')
        if pripona == '.json':
            try: json.loads(b.decode('utf-8'))
            except Exception: raise Chyba(f'{meno} nie je platný JSON')
        p = os.path.join(ciel, meno)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'wb') as f: f.write(b)
    return [m for m, _, _ in clenovia]


def sha(p, sitemap=False):
    b = open(p, 'rb').read()
    if sitemap: b = re.sub(rb'<lastmod>[^<]*</lastmod>', b'', b)
    return hashlib.sha256(b).hexdigest()


def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    archiv = os.path.abspath(sys.argv[1]); len_over = '--len-over' in sys.argv
    tmp = tempfile.mkdtemp(prefix='richtarik-import-')
    try:
        mena = rozbal(archiv, tmp)
        sys.path.insert(0, ROOT)
        import data_sprava
        D = {m: json.load(open(os.path.join(tmp, 'data', m + '.json'), encoding='utf-8')) for m in data_sprava.SUBORY}
        data_sprava.over(D)
        nahravky = [m for m in mena if m.startswith(('img/s/', 'pdf/s/'))]
        print(f'export: revízia {D["verzia"]["revizia"]}, {len(D["akcie"]["akcie"])} akcií, {len(nahravky)} nahratých súborov – cesty a obsah v poriadku')
        for m in nahravky:
            ciel = os.path.join(ROOT, m)
            if os.path.exists(ciel) and sha(ciel) != sha(os.path.join(tmp, m)): raise Chyba(f'{m} už v repozitári je s iným obsahom')
        if len_over: return 0
        # zmenený telefón alebo e-mail: staré podoby sa nahradia v zdrojoch repozitára (ako to urobila správa na hostingu)
        from nastroje import kontakt
        stara = json.load(open(os.path.join(ROOT, 'data', 'firma.json'), encoding='utf-8'))
        pary = kontakt.pary(stara, D['firma'])
        if pary: print('kontakt zmenený:', ', '.join(f'{a} → {b}' for a, b in pary[:3]), '| upravené súbory:', len(kontakt.nahrad_v_strome(ROOT, pary)))
        for m in data_sprava.SUBORY:
            with open(os.path.join(ROOT, 'data', m + '.json'), 'w', encoding='utf-8') as f: f.write(json.dumps(D[m], ensure_ascii=False, indent=2, sort_keys=True) + '\n')
        for m in nahravky:
            os.makedirs(os.path.dirname(os.path.join(ROOT, m)), exist_ok=True)
            shutil.copyfile(os.path.join(tmp, m), os.path.join(ROOT, m))
        r = subprocess.run([sys.executable, 'build.py'], cwd=ROOT, capture_output=True, text=True)
        print('\n'.join(x for x in r.stdout.splitlines() if 'kontrola' in x or 'zhoda' in x))
        if r.returncode: raise Chyba('build.py zlyhal:\n' + (r.stderr or r.stdout)[-2000:])
        odt = json.load(open(os.path.join(tmp, 'odtlacky.json'), encoding='utf-8')) if os.path.exists(os.path.join(tmp, 'odtlacky.json')) else {}
        profil = json.load(open(os.path.join(tmp, 'profil.json'), encoding='utf-8')) if os.path.exists(os.path.join(tmp, 'profil.json')) else {}
        api = profil.get('asistent_api')
        sys.path.insert(0, os.path.join(ROOT, 'nasadenie'))
        import profil as P
        rozdiel = []
        for p, h in sorted(odt.items()):
            cesta = os.path.join(ROOT, p)
            if not os.path.exists(cesta): rozdiel.append(p + ' (chýba)'); continue
            t = open(cesta, encoding='utf-8').read()
            if p.endswith('.html') and api != 'ukazka': t = P.uprav(t, api)
            if p == 'sitemap.xml': t = re.sub(r'<lastmod>[^<]*</lastmod>', '', t)
            if hashlib.sha256(t.encode('utf-8')).hexdigest() != h: rozdiel.append(p)
        for x in r.stdout.splitlines():   # znalosti asistenta (R-1): build.py upozorní, čo treba pred zapnutím asistenta doplniť
            if x.startswith('POZOR') or x.startswith('  '): print(x)
        print(f'porovnanie s hostingom: {len(odt)} súborov, rozdielnych {len(rozdiel)}', rozdiel[:10])
        if rozdiel: raise Chyba('výstup build.py sa líši od hostingu – chyba kódu správy alebo build.py (nie obsahu); súbory: ' + ', '.join(rozdiel[:10]))
        print(f'Hotovo. Návrh commitu: „Stavebniny Richtárik: obsah zo správy k {D["verzia"].get("export", "")[:10] or "dnešku"} (r{D["verzia"]["revizia"]})“')
        return 0
    except (Chyba, Exception) as e:
        if not isinstance(e, Chyba) and not hasattr(e, 'args'): raise
        print('CHYBA:', e)
        return 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
