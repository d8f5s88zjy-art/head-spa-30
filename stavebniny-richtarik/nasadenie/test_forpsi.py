#!/usr/bin/env python3
"""Testy balíka pre Forpsi (volá ich nasadenie/test-forpsi.sh; README, časť Balík pre Forpsi).
  test_forpsi.py staticke <priečinok webu> <dočasný priečinok>
      XML všetkých web.config, remove pred každým mimeMap a add, simulácia presmerovaní proti presmerovania.tsv
  test_forpsi.py web <http://127.0.0.1:port> <rozbalený balík> <presmerovania.tsv>
      Apache s obmedzením ako Forpsi: žiadna odpoveď 500, typy a hlavičky, stránka 404, 236 starých adries, zákazy
  test_forpsi.py sprava755 <url>            správa na hostingu, kde PHP nesmie zapisovať: hlásenie s úkonom 757
  test_forpsi.py prve <url> <koreň webu> <uid FTP>
      prvé prihlásenie majiteľa, keď PHP beží pod iným používateľom než FTP a údaje sú vo www/sprava-data-<hex>
Nič z toho nebeží na hostingu ani na živom webe."""
import http.client, os, re, subprocess, sys, urllib.parse, xml.dom.minidom

OK = ZLE = 0
def t(nazov, podmienka, detail=''):
    global OK, ZLE
    if podmienka: OK += 1; print('  ok  ', nazov)
    else: ZLE += 1; print('  ZLE ', nazov, detail)
def koniec():
    print(f'Spolu: {OK} v poriadku, {ZLE} zlých'); sys.exit(1 if ZLE else 0)


def staticke(SRC, TMP):
    print('1. web.config: platné XML a remove pred každým pridaním')
    subprocess.run(['php', '-r', 'const SPRAVA = 1; require $argv[1] . "/sprava/jadro/Nastavenie.php"; Nastavenie::$data = $argv[2]; Nastavenie::ochranData();', SRC, TMP], check=True)
    subory = ['nasadenie/web.config.txt', 'sprava/web.config', 'img/s/web.config', 'pdf/s/web.config', 'asistent/web.config']
    cesty = [(s, os.path.join(SRC, s)) for s in subory] + [('priečinok údajov/web.config (píše správa)', os.path.join(TMP, 'web.config'))]
    for meno, c in cesty:
        try: d = xml.dom.minidom.parse(c)
        except Exception as e: t(f'{meno}: platné XML', False, str(e)); continue
        t(f'{meno}: platné XML', d.documentElement.tagName == 'configuration')
        bez = []
        for el in d.getElementsByTagName('mimeMap') + [a for a in d.getElementsByTagName('add') if a.parentNode.tagName in ('hiddenSegments', 'fileExtensions', 'customHeaders', 'denyUrlSequences')]:
            kluc = next(k for k in ('fileExtension', 'segment', 'name', 'sequence') if el.hasAttribute(k))
            p = el.previousSibling
            while p is not None and p.nodeType != p.ELEMENT_NODE: p = p.previousSibling
            if not (p is not None and p.tagName == 'remove' and p.getAttribute(kluc) == el.getAttribute(kluc)): bez.append(f'{el.tagName} {el.getAttribute(kluc)}')
        if meno == 'nasadenie/web.config.txt':
            mm = [b for b in bez if b.startswith('mimeMap')]
            t(f'{meno}: každý mimeMap má pred sebou remove', not mm, str(mm))
            print(f'       známe a neriešené (README, IIS-09): {len(bez) - len(mm)} hlavička bez remove v nasadenie/web.config.txt', [b for b in bez if not b.startswith("mimeMap")])
        else: t(f'{meno}: každý mimeMap a add má pred sebou remove', not bez, str(bez))

    print('2. presmerovania: simulácia pravidiel proti presmerovania.tsv')
    tsv = [l.rstrip('\n').split('\t') for l in open(os.path.join(SRC, 'nasadenie/presmerovania.tsv'), encoding='utf-8') if l.strip()]
    domena = re.search(r"^DOMENA = '([^']+)'", open(os.path.join(SRC, 'build.py'), encoding='utf-8').read(), re.M).group(1).rstrip('/')
    t('presmerovania.tsv má 236 starých adries', len(tsv) == 236, str(len(tsv)))

    def apache(subor):
        pravidla = []
        for l in open(os.path.join(SRC, subor), encoding='utf-8'):
            m = re.match(r'RewriteRule (\S+) (\S+) \[([^\]]*)\]', l)
            if m: pravidla.append((re.compile(m.group(1), re.I if 'NC' in m.group(3).split(',') else 0), m.group(2), m.group(3).split(',')))
        def chod(cesta):
            for vz, ciel, pr in pravidla:
                m = vz.search(cesta.lstrip('/'))
                if m: return re.sub(r'\$(\d)', lambda x: m.group(int(x.group(1))), ciel), pr
            return None, None
        return pravidla, chod
    for subor, predpona in (('nasadenie/htaccess-forpsi.txt', ''), ('nasadenie/htaccess.txt', domena)):
        pravidla, chod = apache(subor)
        zle = [(a, chod(a)[0]) for a, b in tsv if chod(a)[0] != predpona + b]
        velke = [(a, chod(a.upper())[0]) for a, b in tsv if (chod(a.upper())[0] or '').lower() != (predpona + b).lower()]
        r301 = [a for a, b in tsv if 'R=301' not in (chod(a)[1] or []) or 'L' not in (chod(a)[1] or [])]
        retaz = [b for a, b in tsv if chod(b)[0] is not None]
        t(f'{subor}: {len(pravidla)} pravidiel, všetkých 236 adries ide na cieľ z tsv', not zle, str(zle[:3]))
        t(f'{subor}: aj adresy VEĽKÝMI písmenami', not velke, str(velke[:3]))
        t(f'{subor}: vždy 301 a koniec (R=301, L), cieľ nie je stará adresa (bez reťaze)', not r301 and not retaz, str((r301[:3], retaz[:3])))
        if not predpona:
            t(f'{subor}: žiadny cieľ nemá schému ani meno servera', all(c.startswith('/') and not c.startswith('//') for _, c, _ in pravidla), '')
        nove = []
        for dp, dn, fn in os.walk(SRC):
            if any(x in dp for x in ('/.git', '/zdroj', '/nasadenie', '/data', '/nastroje', '__pycache__')): continue
            nove += ['/' + os.path.relpath(os.path.join(dp, f), SRC).replace(os.sep, '/') for f in fn]
        chytene = [n for n in nove if chod(n)[0] is not None]
        t(f'{subor}: žiadny súbor nového webu ({len(nove)}) pravidlá nezachytia', not chytene, str(chytene[:3]))

    d = xml.dom.minidom.parse(os.path.join(SRC, 'nasadenie/web.config.txt'))
    mapa = {a.getAttribute('key'): a.getAttribute('value') for a in d.getElementsByTagName('rewriteMap')[0].getElementsByTagName('add')}
    reg = []
    for r in d.getElementsByTagName('rule'):
        m, a = r.getElementsByTagName('match')[0], r.getElementsByTagName('action')[0]
        if r.getAttribute('name').startswith('stare ') and r.getAttribute('name') != 'stare adresy':
            reg.append((re.compile(m.getAttribute('url'), re.I), a.getAttribute('url')))
    def iis(cesta):
        if cesta in mapa: return mapa[cesta]
        for vz, ciel in reg:
            m = vz.search(cesta.lstrip('/'))
            if m: return re.sub(r'\{R:(\d)\}', lambda x: m.group(int(x.group(1))), ciel)
    zle = [(a, iis(a)) for a, b in tsv if iis(a) != domena + b]
    t('nasadenie/web.config.txt: mapa a pravidlá dajú pre 236 adries cieľ z tsv (len simulácia, na IIS nespustené)', not zle, str(zle[:3]))
    print('       známe a neriešené (README, IIS-01 až IIS-11): ciele sú https://www…, mapa rozlišuje veľkosť písmen, súbor sa na Forpsi nedodáva')
    koniec()


def spoj(url):
    u = urllib.parse.urlparse(url); return http.client.HTTPConnection(u.hostname, u.port, timeout=30), f'{u.hostname}:{u.port}'
def get(url, cesta, hlavicky=None, metoda='GET', telo=None):
    c, host = spoj(url)
    c.request(metoda, cesta, body=telo, headers={'Host': host, 'Accept-Encoding': 'identity', **(hlavicky or {})})
    r = c.getresponse(); b = r.read(); c.close()
    return r.status, {k.lower(): v for k, v in r.getheaders()}, b, r.getheaders()


def web(URL, KOREN, TSV):
    fs = []
    for dp, dn, fn in os.walk(KOREN):
        fs += [os.path.relpath(os.path.join(dp, f), KOREN).replace(os.sep, '/') for f in fn]
    fs = sorted(f for f in fs if not f.startswith('sprava-data'))
    print('1. Apache s AllowOverride ako Forpsi: žiadna odpoveď 500')
    s, h, b, _ = get(URL, '/')
    t('úvod / → 200 a je to nový web', s == 200 and b'Stavebniny Rich' in b and h.get('content-type', '').startswith('text/html'), f'{s}')
    stranky = [f for f in fs if f.endswith('.html') and not f.startswith('sprava/')]
    zle = [(f, get(URL, '/' + f)[0]) for f in stranky]; zle = [x for x in zle if x[1] != 200]
    t(f'všetkých {len(stranky)} stránok HTML → 200', not zle, str(zle[:5]))
    typy = {'.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.css': 'text/css',
            '.js': ('text/javascript', 'application/javascript'), '.json': 'application/json', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': ('application/xml', 'text/xml'), '.txt': 'text/plain', '.doc': 'application/msword'}
    for pr, typ in typy.items():
        f = next((x for x in fs if x.endswith(pr) and not x.startswith(('sprava/', 'img/s/', 'pdf/s/'))), None)
        if not f: continue
        s, h, b, _ = get(URL, '/' + f)
        dlha = pr in ('.avif', '.webp', '.woff2', '.pdf', '.svg', '.mp4', '.png', '.jpg', '.doc')
        cc = h.get('cache-control', '')
        t(f'{pr}: 200, typ {typ if isinstance(typ, str) else typ[0]}, cache {"rok" if dlha else "10 minút"} ({f})',
          s == 200 and h.get('content-type', '').split(';')[0] in ((typ,) if isinstance(typ, str) else typ) and (('31536000' in cc) if dlha else ('max-age=600' in cc)), f'{s} {h.get("content-type")} {cc}')
    f = next(x for x in fs if x.endswith('.woff2'))
    t('písmo má hlavičku Access-Control-Allow-Origin: *', get(URL, '/' + f)[1].get('access-control-allow-origin') == '*')
    s, h, b, _ = get(URL, '/assets/site.css', {'Accept-Encoding': 'gzip'})
    t('štýl sa posiela komprimovaný (gzip)', h.get('content-encoding') == 'gzip', str(h.get('content-encoding')))
    znacky = [f for f in fs if re.fullmatch(r'cast-\d+-z-\d+\.txt', f)]
    t(f'značky častí ({len(znacky)}) sa otvoria', znacky and all(get(URL, '/' + f)[0] == 200 for f in znacky))

    print('2. stránka 404')
    for c in ('/skuska-neexistuje', '/akcie/neexistuje.html', '/a/b/c/neexistuje'):
        s, h, b, _ = get(URL, c)
        t(f'{c} → 404 so stránkou webu', s == 404 and 'Stránka sa nenašla'.encode() in b or (s == 404 and b'class="e404' in b), f'{s} {b[:80]!r}')

    print('3. staré adresy cez http (bez certifikátu)')
    tsv = [l.rstrip('\n').split('\t') for l in open(TSV, encoding='utf-8') if l.strip()]
    zle = []; ciele = set()
    for a, b_ in tsv:
        s, h, b, _ = get(URL, a)
        if s != 301 or h.get('location') != URL.rstrip('/') + b_: zle.append((a, s, h.get('location')))
        ciele.add(b_)
    t(f'všetkých {len(tsv)} starých adries → 301 na cieľ z tsv na tej istej schéme a serveri', not zle, str(zle[:3]))
    zle = [(c, get(URL, c)[0]) for c in sorted(ciele)]; zle = [x for x in zle if x[1] != 200]
    t(f'všetkých {len(ciele)} cieľov → 200 (jedno presmerovanie, potom stránka)', not zle, str(zle[:3]))
    s, h, b, _ = get(URL, '/SK/AKCIE.ASPX')
    t('adresa VEĽKÝMI písmenami → 301', s == 301 and h.get('location') == URL.rstrip('/') + '/akcie/index.html', f'{s} {h.get("location")}')
    s, h, b, _ = get(URL, '/sk/akcie.aspx?utm=1')
    t('adresa s otáznikom → 301 a reťazec za otáznikom ostane', s == 301 and h.get('location') == URL.rstrip('/') + '/akcie/index.html?utm=1', f'{s} {h.get("location")}')
    s, h, b, _ = get(URL, '/sk/akcie.aspx', {'X-Forwarded-Proto': 'https'})
    print(f'       za proxy s HTTPS (hlavička X-Forwarded-Proto: https) dá náš Apache Location: {h.get("location")} – čo spraví proxy Forpsi, je neoverené')

    print('4. zákazy')
    for c in ('/.htaccess', '/sprava/.htaccess', '/sprava/.user.ini', '/sprava/web.config', '/sprava/verzia.json', '/sprava/jadro/Pristup.php', '/sprava/semeno/akcie.json',
              '/sprava/kostry/konstanty.json', '/sprava/sablony/meta.html', '/img/s/.htaccess', '/img/s/web.config', '/pdf/s/.htaccess', '/pdf/s/web.config', '/img/s/', '/pdf/s/'):
        s = get(URL, c)[0]
        t(f'{c} → 403', s == 403, str(s))
    s = get(URL, '/sprava/jadro/')[0]
    t('/sprava/jadro/ → žiadny výpis priečinka (403 alebo 404)', s in (403, 404), str(s))
    for c in ('/sprava/assets/sprava.css', '/sprava/assets/sprava.js'):
        t(f'{c} → 200', get(URL, c)[0] == 200)
    os.makedirs(os.path.join(KOREN, 'img/s/2026/11'), exist_ok=True)
    for meno in ('skuska.php', 'skuska.php.jpg', 'skuska.phtml'):
        open(os.path.join(KOREN, 'img/s/2026/11', meno), 'w').write('<?php echo "SPUSTENE-" . (6 * 7);')
        s, h, b, _ = get(URL, '/img/s/2026/11/' + meno)
        t(f'img/s/…/{meno}: PHP sa nespustí', b'SPUSTENE-42' not in b and s in (403, 200), f'{s}')
        os.remove(os.path.join(KOREN, 'img/s/2026/11', meno))
    os.removedirs(os.path.join(KOREN, 'img/s/2026/11'))
    koniec()


def sprava755(URL):
    s, h, b, _ = get(URL, '/sprava/', {'X-Forwarded-Proto': 'https'})
    x = b.decode('utf-8', 'replace')
    t('PHP nesmie zapisovať (priečinky 755 patria FTP): správa povie, čo spraviť', s == 500 and 'priečinok údajov nie je dostupný' in x and 'práva 757' in x and 'README' not in x, f'{s} {x[:200]}')
    koniec()


class Relacia:
    def __init__(self, url): self.url = url; self.k = {}
    def chod(self, cesta, polia=None):
        hl = {'X-Forwarded-Proto': 'https'}
        if self.k: hl['Cookie'] = '; '.join(f'{a}={b}' for a, b in self.k.items())
        telo = None
        if polia is not None:
            telo = urllib.parse.urlencode(polia); hl['Content-Type'] = 'application/x-www-form-urlencoded'
        for _ in range(6):
            s, h, b, vsetky = get(self.url, cesta, hl, 'POST' if telo is not None else 'GET', telo)
            for a, v in vsetky:
                if a.lower() == 'set-cookie':
                    n, _, hod = v.split(';')[0].partition('=')
                    if hod and hod != 'deleted': self.k[n.strip()] = hod
                    else: self.k.pop(n.strip(), None)
            if s in (301, 302, 303) and h.get('location'):
                cesta = urllib.parse.urljoin(cesta, h['location']); telo = None
                hl = {'X-Forwarded-Proto': 'https', 'Cookie': '; '.join(f'{a}={b}' for a, b in self.k.items())}
                continue
            return s, b.decode('utf-8', 'replace')
        return s, ''
    @staticmethod
    def token(x):
        m = re.search(r'name="_t" value="([^"]+)"', x); return m.group(1) if m else ''


def prve(URL, KOREN, UID):
    ako_ftp = lambda *a: subprocess.run(['setpriv', f'--reuid={UID}', f'--regid={UID}', '--clear-groups', *a], capture_output=True, text=True)
    print('1. bez zámku')
    s, h, b, _ = get(URL, '/sprava/')
    x = b.decode('utf-8', 'replace')
    t('cez http správa ukáže len stránku o zabezpečenom pripojení s postupom Forpsi', 'Otvorte správu cez zabezpečené pripojenie' in x and 'SSL certifikát' in x and 'Požiadať o certifikát' in x and 'Let' not in x, x[:200])
    kand = [d for d in os.listdir(KOREN) if re.fullmatch(r'sprava-data-[0-9a-f]{32}', d)]
    t('priečinok údajov vznikol vo www ako sprava-data-<32 znakov>', len(kand) == 1 and not os.path.exists(os.path.join(os.path.dirname(KOREN), 'sprava-data')), str(kand))
    D = os.path.join(KOREN, kand[0]); st = os.stat(D)
    t('patrí používateľovi PHP a má práva 0705 (FTP ho vie otvoriť)', st.st_uid != int(UID) and st.st_mode & 0o777 == 0o705, f'{st.st_uid} {st.st_mode & 0o777:o}')
    print('2. prvé nastavenie')
    r = Relacia(URL); s, x = r.chod('/sprava/')
    t('Prvé nastavenie: „Server je pripravený.“ (sondy na vlastný web prešli)', s == 200 and 'Prvé nastavenie' in x and 'Server je pripravený.' in x, re.sub(r'<[^>]+>', ' ', x)[:400])
    for c in (f'/{kand[0]}/nastavenie.json', f'/{kand[0]}/.htaccess', f'/{kand[0]}/', f'/{kand[0]}/adresa.txt'):
        t(f'údaje z webu nedostupné: {c.replace(kand[0], "sprava-data-…")} → 403', get(URL, c)[0] == 403)
    s, x = r.chod('/sprava/index.php', {'_t': r.token(x), 'a': 'prvy-kod'})
    t('Vytvoriť overovací kód: správa napíše, kde súbor je', 'PRVY-KOD.txt' in x and 'sprava-data-' in x and 'FileZilla' in x, re.sub(r'<[^>]+>', ' ', x)[:300])
    t('kód z webu nedostupný', get(URL, f'/{kand[0]}/PRVY-KOD.txt')[0] == 403)
    v = ako_ftp('ls', D); k = ako_ftp('cat', os.path.join(D, 'PRVY-KOD.txt')); n = ako_ftp('cat', os.path.join(D, 'nastavenie.json'))
    kod = re.search(r'Kód: ([A-Z0-9-]+)', k.stdout)
    t('používateľ FTP priečinok vypíše a súbor s kódom prečíta', v.returncode == 0 and 'PRVY-KOD.txt' in v.stdout and bool(kod), v.stderr + k.stderr)
    t('používateľ FTP neprečíta nastavenie.json (tajomstvo) ani relácie', n.returncode != 0 and ako_ftp('ls', os.path.join(D, 'relacie')).returncode != 0)
    t('používateľ FTP súbor s kódom nezmaže ani neprepíše', ako_ftp('rm', '-f', os.path.join(D, 'PRVY-KOD.txt')).returncode != 0 or os.path.exists(os.path.join(D, 'PRVY-KOD.txt')))
    s, x = r.chod('/sprava/index.php', {'_t': r.token(x), 'a': 'prvy-over', 'kod': kod.group(1) if kod else ''})
    t('kód prejde, správa pýta meno a heslo', 'Kód je správny' in x and 'name="heslo"' in x, re.sub(r'<[^>]+>', ' ', x)[:300])
    t('súbor s kódom sa po použití zmazal', not os.path.exists(os.path.join(D, 'PRVY-KOD.txt')))
    heslo = 'skusobne-' + os.urandom(6).hex() + '-palety'
    s, x = r.chod('/sprava/index.php', {'_t': r.token(x), 'a': 'prvy-ucet', 'meno': 'Skúška', 'heslo': heslo, 'heslo2': heslo})
    t('majiteľ je na Domove: „Všetko je na webe“', 'Všetko je na webe' in x, re.sub(r'<[^>]+>', ' ', x)[:300])
    t('účet je uložený len ako odtlačok a FTP ho neprečíta', heslo not in open(os.path.join(D, 'ucty.json')).read() and ako_ftp('cat', os.path.join(D, 'ucty.json')).returncode != 0)
    print('3. kontrola servera po prihlásení')
    s, x = r.chod('/sprava/index.php?s=kontrola')
    body = re.findall(r'<li class="(\w+)"><b>([^<]+)</b><small>([^<]*)</small>', x)
    for stav, nazov, detail in body: print(f'       {stav:11} {nazov}: {detail}')
    t(f'kontrola servera: {len(body)} bodov, žiadna chyba', body and not [b for b in body if b[0] == 'chyba'], str([b for b in body if b[0] == 'chyba']))
    t('bod „Súbory vytvorené správou“ hlási iného používateľa než FTP', any('iným používateľom než FTP' in b[2] for b in body))
    t('bod „.htaccess v koreni webu“ je v poriadku', any(b[1].startswith('Nastavenie servera') and b[0] == 'ok' for b in body))
    t('údaje sú vo www a sonda overila, že sú z webu nedostupné', any(b[1] == 'Údaje správy nie sú dostupné z webu' and b[0] == 'ok' and 'Overené' in b[2] for b in body))
    print('4. majiteľ zmení otváracie hodiny a zverejní (správa prepisuje stránky, ktoré nahral používateľ FTP)')
    pred = get(URL, '/kontakt.html')[2].decode('utf-8')
    s, x = r.chod('/sprava/index.php?s=hodiny')
    polia = {'_t': r.token(x), 'a': 'hodiny'}
    for m in re.finditer(r'<input type="(checkbox|time)" name="(den\[\d\]\[\w+\])" value="([^"]*)"( checked)?', x):
        if m.group(1) == 'time' or m.group(4): polia[m.group(2)] = m.group(3)
    t('formulár hodín má 7 dní', sum(1 for k in polia if k.endswith('[od]')) == 7, str(sorted(polia)))
    polia['den[6][otvorene]'] = '1'; polia['den[6][od]'] = '07:00'; polia['den[6][do]'] = '11:15'
    s, x = r.chod('/sprava/index.php?s=hodiny', polia)
    t('náhľad zmeny s tlačidlom Zverejniť na webe', 'Náhľad zmeny' in x and 'Zverejniť na webe' in x, re.sub(r'<[^>]+>', ' ', x)[:300])
    s, x = r.chod('/sprava/index.php?s=nahlad', {'_t': r.token(x), 'a': 'zverejnit'})
    po = get(URL, '/kontakt.html')[2].decode('utf-8')
    t('zverejnené: na Kontakte je sobota do 11:15', '11:15' in po and '11:15' not in pred and 'Všetko je na webe' in x, re.sub(r'<[^>]+>', ' ', x)[:300])
    t('zmena je aj v päte inej stránky a v údajoch hľadania', '11:15' in get(URL, '/akcie/index.html')[2].decode('utf-8') and '11:15' in get(URL, '/assets/index.json')[2].decode('utf-8'))
    st = os.stat(os.path.join(KOREN, 'kontakt.html'))
    print(f'       kontakt.html po zverejnení: vlastník uid {st.st_uid}, práva {st.st_mode & 0o777:o}')
    t('prepísanú stránku používateľ FTP prečíta', ako_ftp('cat', os.path.join(KOREN, 'kontakt.html')).returncode == 0)
    prepis = ako_ftp('sh', '-c', f'echo x >> "{os.path.join(KOREN, "kontakt.html")}"').returncode == 0
    print(f'       používateľ FTP stránku prepísanú správou {"vie" if prepis else "NEVIE"} prepísať priamo (README: pri ďalšom balíku ju najprv zmazať, potom nahrať)')
    zmaz = ako_ftp('sh', '-c', f'cp "{os.path.join(KOREN, "kontakt.html")}" "{KOREN}/kontakt.kopia" && rm "{os.path.join(KOREN, "kontakt.html")}" && mv "{KOREN}/kontakt.kopia" "{os.path.join(KOREN, "kontakt.html")}"')
    t('používateľ FTP vie prepísanú stránku zmazať a nahrať znova (priečinok je jeho)', zmaz.returncode == 0 and get(URL, '/kontakt.html')[0] == 200, zmaz.stderr)
    s, x = r.chod('/sprava/index.php?s=historia')
    t('zmena je v Histórii', 'Otváracie hodiny' in x)
    koniec()


if __name__ == '__main__':
    {'staticke': staticke, 'web': web, 'sprava755': sprava755, 'prve': prve}[sys.argv[1]](*sys.argv[2:])
