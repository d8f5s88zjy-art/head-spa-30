"""Príprava dát pre šablóny kúskov a vykreslenie označených oblastí (<!--s:ID-->…<!--/s:ID-->).

Ten istý obsah do bajtu vyrába sprava/jadro/Vykreslenie.php (brána nastroje/sprava_zhoda.py). Funkcie tu a v PHP majú
rovnaké mená; nová funkcia sa smie pridať len spolu s PHP verziou a testom zhody.
D (dáta) = {'firma', 'cennik', 'akcie', 'caste', 'novinky', 'galeria', 'texty', 'k'}: obsah data/*.json a konštanty
z sprava/kostry/konstanty.json.
"""
import html, json, re
from urllib.parse import quote
import texty
from nastroje.sablona import sablona

ZNACKA = re.compile(r'<!--s:([a-z0-9-]+)-->(.*?)<!--/s:\1-->', re.S)
DNI_KRATKO = ['', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne']
DNI_DLHO = ['', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa']
DNI_LD = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


# ---------- pomocné ----------
def txt(s):
    """Text z dát v konečnom tvare: opravy názvov a typografia (to isté, čo urobí write() v build.py)."""
    return texty._typografia(texty.opravy(s or ''))


def json_py(o, kompakt=False):
    """json.dumps(o, ensure_ascii=False) s predvolenými (alebo kompaktnými) oddeľovačmi."""
    return json.dumps(o, ensure_ascii=False, separators=(',', ':') if kompakt else None)


def rel(cesta, ciel):
    return '../' * cesta.count('/') + ciel


def datum_html(d):
    """Dátum s nezlomiteľnými medzerami ako entity &nbsp; (ručne písané vety v index.html a doprava.html)."""
    return html.escape(txt(d), quote=True).replace('\u00a0', '&nbsp;')


def strany(n):
    return f'{n} strana' if n == 1 else (f'{n} strany' if 2 <= n <= 4 else f'{n} strán')


# ---------- otváracie hodiny ----------
def cas(c):
    h, m = c.split(':')
    return f'{int(h)}:{m}'


def hodiny_riadky(D):
    von = []
    for i, s in enumerate(D['firma']['hodiny']):
        d = s['dni']; a, b = d[0], d[-1]
        kratko = DNI_KRATKO[a] if a == b else f'{DNI_KRATKO[a]} – {DNI_KRATKO[b]}'
        dlho = DNI_DLHO[a] if a == b else f'{DNI_DLHO[a]} – {DNI_DLHO[b].lower()}'
        von.append({'prvy': i == 0, 'kratko': kratko, 'dlho': dlho, 'uvod': dlho if a == b else kratko,
                    'dni': str(a) if a == b else f'{a}-{b}', 'cas': f'{cas(s["od"])} – {cas(s["do"])}'})
    return von


def hodiny_veta(D, velke=False):
    v = ', '.join(f'{r["dlho"].lower()} {r["cas"]}' for r in hodiny_riadky(D))
    return v[:1].upper() + v[1:] if velke else v


def datum_sk(iso, rok=True):
    """2026-12-24 → 24. 12. 2026 (bez roka: 24. 12.)."""
    r, m, d = iso.split('-')
    return f'{int(d)}. {int(m)}. {r}' if rok else f'{int(d)}. {int(m)}.'


def vynimka_text(v):
    """Oznam k otváracím hodinám: „Vianoce 24. 12. – 26. 12. 2026: zatvorené“ alebo „… : otvorené 7:00 – 12:00“."""
    od, do = v['od'], v['do']
    if od == do: rozsah = datum_sk(od)
    elif od[:4] == do[:4]: rozsah = f'{datum_sk(od, False)} – {datum_sk(do)}'
    else: rozsah = f'{datum_sk(od)} – {datum_sk(do)}'
    stav = 'zatvorené' if v.get('zatvorene') else f'otvorené {cas(v["cas_od"])} – {cas(v["cas_do"])}'
    return txt(f'{v.get("nazov") or "Mimoriadne"} {rozsah}: {stav}')


def vynimky(D):
    """Oznamy k hodinám v poradí dátumu; na webe zmiznú samy po poslednom dni (site.js podľa data-do)."""
    return [{'do': v['do'], 'text': vynimka_text(v)} for v in sorted(D['firma'].get('vynimky') or [], key=lambda x: (x['od'], x['do']))]


def hodiny_ld(D):
    von = []
    for s in D['firma']['hodiny']:
        dni = [DNI_LD[x] for x in s['dni']]
        von.append({'@type': 'OpeningHoursSpecification', 'dayOfWeek': dni if len(dni) > 1 else dni[0], 'opens': s['od'], 'closes': s['do']})
    return von


def firma_ld(D):
    f, k = D['firma'], D['k']
    d = {"@context": "https://schema.org", "@type": "HardwareStore", "@id": k['domena'] + "#predajna", "name": "Stavebniny Richtárik",
         "alternateName": f['majitel'], "telephone": [f['mobil_tel'], f['pevna_tel']], "email": f['email'],
         "foundingDate": "1997",
         "address": {"@type": "PostalAddress", "streetAddress": f['ulica'], "addressLocality": "Nitra", "postalCode": "949 05", "addressCountry": "SK"},
         "openingHoursSpecification": hodiny_ld(D),
         **({"specialOpeningHoursSpecification": [
             {"@type": "OpeningHoursSpecification", "validFrom": v['od'], "validThrough": v['do'],
              "opens": "00:00" if v.get('zatvorene') else v['cas_od'], "closes": "00:00" if v.get('zatvorene') else v['cas_do']}
             for v in sorted(f['vynimky'], key=lambda x: (x['od'], x['do']))]} if f.get('vynimky') else {}),
         "paymentAccepted": "Cash, Credit Card", "areaServed": "Slovensko", "url": k['domena'], "logo": k['domena'] + "img/logo-rs-720.png",
         "image": k['domena'] + k['og_img'], "hasMap": "https://maps.google.com/?cid=137067579998285540", "taxID": f['dic']}
    return json_py(d)


# ---------- cenník a akcie ----------
def cennik_aktualny(D):
    c = D['cennik']
    return next(x for x in c['cenniky'] if x['id'] == c['aktualny'])


def cennik_text(D, dlhy=False):
    c = cennik_aktualny(D)
    return txt(f'Cenník akcií z {c["datum"]} (PDF, {strany(c["strany"])})' if dlhy else f'Cenník akcií z {c["datum"]} (PDF)')


def zlava(D):
    return txt(D['cennik']['zlava'].replace('{datum}', cennik_aktualny(D)['datum']))


def akcie_so_strankou(D):
    return [a for a in D['akcie']['akcie'] if a['stranka']]


def viditelne(D):
    return [a for a in D['akcie']['akcie'] if a['viditelna']]


def akcia(D, cesta):
    return next((a for a in D['akcie']['akcie'] if a['stranka'] == cesta), None)


def karta_akcie(D, a, cesta, uvod=False):
    if a['stranka']: href, viac = rel(cesta, a['stranka']), 'Leták akcie'
    else: href, viac = rel(cesta, a['odkaz']['stranka']), a['odkaz']['text']
    n = a.get('nahlad')
    return {'href': href, 'stitok': txt(a['stitok']), 'nazov': txt(a['nazov']), 'karta': txt(a['karta']), 'viac': txt(viac),
            'nahlad': {'src': rel(cesta, n['src']), 'w': n['w'], 'h': n['h']} if n and a['stranka'] else None}


def pdf_text(a, p):
    if p.get('text'): return txt(p['text'])
    return txt(f'Leták akcie: {a["nazov"]} (PDF, {p["datum"]})' if p.get('datum') else f'Leták akcie: {a["nazov"]} (PDF)')


def akcia_vm(D, cesta):
    a = akcia(D, cesta); f = D['firma']; c = cennik_aktualny(D)
    vm = {'id': a['id'], 'stitok': txt(a['stitok']), 'zlava': zlava(D), 'cennik_href': rel(cesta, c['pdf']),
          'cennik_text': cennik_text(D), 'mobil': f['mobil'], 'mobil_tel': f['mobil_tel'], 'email': f['email'],
          'predmet': quote('Akcia ' + a['nazov']), 'skoncila': not a['viditelna'], 'akcie_href': rel(cesta, 'akcie/index.html')}
    vm['katalog'] = {'odkazy': [{'href': rel(cesta, k), 'text': txt(D['k']['nazvy'].get(k, k))} for k in a['katalog']]} if a['katalog'] else None
    if a['ceny']:
        tab = [{'nadpis': txt(t['nadpis']), 'poznamka': txt(t['poznamka']), 'riadky': [{'a': txt(r[0]), 'b': txt(r[1])} for r in t['riadky']]} for t in a['ceny']]
        if a.get('ceny_zadane'):   # ceny zadané v správe: nadpis s dátumom zadania, nie dátum cenníka (cenník ich nemusí obsahovať)
            stare = bool(a.get('skryt_ceny'))
            vm['ceny_zadane'] = txt(f'Akciové ceny (zadané {a["ceny_zadane"]})')
        else:
            stare = a.get('cennik') != D['cennik']['aktualny'] or a.get('skryt_ceny')
            vm['ceny_zadane'] = None
        vm['ceny_sekcia'] = {'tabulky': [] if stare else tab, 'stare': bool(stare)}
    else: vm['ceny_sekcia'] = None; vm['ceny_zadane'] = None
    l = a.get('letak')
    if l:
        vm['letak'] = {'nazov': txt(a['nazov']), 'src': rel(cesta, l['src']), 'w': l['w'], 'h': l['h'], 'velka': rel(cesta, l.get('velka') or l['src']),
                       'srcset': ', '.join(f'{rel(cesta, s)} {w}w' for w, s in l['sirky']) if l.get('sirky') else '',
                       'avif': ', '.join(f'{rel(cesta, s)} {w}w' for w, s in l['avif']) if l.get('avif') else ''}
    else: vm['letak'] = None
    vm['pdf'] = [{'href': rel(cesta, p['subor']), 'text': pdf_text(a, p)} for p in a['pdf']]
    return vm


def ostatne(D, cesta):
    return [{'href': rel(cesta, a['stranka']), 'stitok': txt(a['stitok']), 'nazov': txt(a['nazov'])}
            for a in viditelne(D) if a['stranka'] and a['stranka'] != cesta]


def v_akcii_vm(D, cesta):
    ak = sorted([a for a in viditelne(D) if a['stranka'] and cesta in a['katalog']], key=lambda a: a['katalog_poradie'])
    if not ak: return {'blok': None}
    return {'blok': {'nadpis': 'V akcii z tejto kategórie' if cesta.count('/') == 1 else 'Táto značka je v akcii',
                     'polozky': [{'href': rel(cesta, a['stranka']), 'stitok': txt(a['stitok']), 'nazov': txt(a['nazov'])} for a in ak]}}


def breadcrumb_ld(D, cesta, polozky):
    k = D['k']
    it = [{"@type": "ListItem", "position": i + 1, "name": texty._typografia(html.unescape(re.sub(r'<[^>]+>', '', texty.opravy(t)))),
           "item": k['domena'] + ('' if p == 'index.html' else p)} for i, (p, t) in enumerate(polozky)]
    return texty.opravy(json_py({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": it}))


# ---------- SEO (meta) ----------
def seo(D, cesta):
    """(titulok bez prípony, popis) stránky s oblasťou meta."""
    if cesta == 'kontakt.html': return D['k']['stranky']['kontakt.html'], kontakt_popis(D)
    if cesta == 'akcie/index.html':
        return D['k']['stranky']['akcie/index.html'], D['cennik']['akcie_popis'].replace('{datum}', cennik_aktualny(D)['datum'])
    if cesta == 'letak.html':
        return D['k']['stranky']['letak.html'], D['cennik']['letak_popis'].replace('{datum}', cennik_aktualny(D)['datum'])
    a = akcia(D, cesta) if cesta.startswith('akcie/') else novinka(D, cesta)
    return a['seo']['titulok'], a['seo']['popis']


def kontakt_popis(D):
    """Popis Kontaktu pre vyhľadávače s otváracími hodinami; ak by bol dlhší ako 155 znakov, kratšia veta bez telefónu."""
    d = D['firma']['kontakt_popis'].replace('{hodiny_veta}', hodiny_veta(D))
    if len(txt(d)) > 155 and D['firma'].get('kontakt_popis_kratky'): d = D['firma']['kontakt_popis_kratky'].replace('{hodiny_veta}', hodiny_veta(D))
    return d


def meta_vm(D, cesta):
    t, d = seo(D, cesta)
    a = akcia(D, cesta) if cesta.startswith('akcie/') else (novinka(D, cesta) if cesta.startswith('novinky/') else None)
    return {'titulok': texty.opravy(t + texty.PRIPONA), 'titulok_og': txt(t + texty.PRIPONA), 'popis': txt(d),
            'farba': D['k']['farba'], 'noindex': bool(a and not a['viditelna'])}


# ---------- časté otázky ----------
def caste_odpovede(D):
    """(id, téma, otázka, odpoveď) s dosadenými hodinami a dátumom cenníka; odpoveď s cenou akcie, ktorá sa zmenila
    alebo je skrytá, sa nahradí vetou bez čísla."""
    von = []
    for o in D['caste']['otazky']:
        a = o['odpoved'].replace('{hodiny_veta}', hodiny_veta(D)).replace('{Hodiny_veta}', hodiny_veta(D, True))
        a = a.replace('{cennik_datum}', cennik_aktualny(D)['datum'])
        v = o.get('vazba')
        if v:
            ak = next((x for x in D['akcie']['akcie'] if x['id'] == v['akcia']), None)
            ceny = [r[1] for t in (ak['ceny'] if ak else []) for r in t['riadky']]
            platne = ak and ak['viditelna'] and (ak.get('cennik') == D['cennik']['aktualny'] or ak.get('ceny_zadane')) and not ak.get('skryt_ceny')
            if not platne or any(c not in ceny for c in v['ceny']): a = v['nahrada']
        von.append((o['id'], o['tema'], o['otazka'], a))
    return von


def odkazy_v_odpovedi(D, t):
    f = D['firma']
    t = html.escape(t)
    t = t.replace(f['mobil'], f'<a href="tel:{f["mobil_tel"]}">{f["mobil"]}</a>').replace(f['pevna'], f'<a href="tel:{f["pevna_tel"]}">{f["pevna"]}</a>')
    return t.replace(f['email'], f'<a href="mailto:{f["email"]}">{f["email"]}</a>')


def faq_vm(D):
    qa = caste_odpovede(D); bloky = []
    for tema, nadpis in D['caste']['temy']:
        if not nadpis: continue
        temy = [tema] + (['hodiny'] if tema == 'kontakt' else [])
        pol = [{'id': i, 'otazka': txt(q), 'odpoved': odkazy_v_odpovedi(D, txt(a))} for i, t, q, a in qa if t in temy]
        if pol: bloky.append({'nadpis': txt(nadpis), 'polozky': pol})
    return {'bloky': bloky}


def faq_ld(D):
    ld = {"@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for i, t, q, a in caste_odpovede(D)]}
    return texty.opravy(json_py(ld))


# ---------- novinky ----------
NOVINKA_SKONCILA = 'Táto novinka už nie je v ponuke. Aktuálne novinky nájdete na stránke Novinky.'


def novinka(D, cesta):
    return next((n for n in D['novinky']['novinky'] if n['stranka'] == cesta), None)


def novinky_viditelne(D):
    return [n for n in D['novinky']['novinky'] if n['viditelna']]


def karta_novinky(n, cesta, uvod=False):
    k = n['karta']
    return {'href': rel(cesta, n['stranka']), 'nazov': txt(n['nazov']), 'popis': txt((n.get('popis_uvod') if uvod else None) or n['popis']),
            'foto': {'src': rel(cesta, k['src']), 'w': k['w'], 'h': k['h']} if k['druh'] == 'foto' else None,
            'dlazdica': {'nad': txt(k['nad']), 'suma': txt(k['cena']), 'pod': txt(k['pod'])} if k['druh'] == 'cena' else None,
            'prazdna': k['druh'] == 'prazdna'}


def novinky_kat_vm(D, cesta):
    ids = D['novinky'].get('kategorie', {}).get(cesta, [])
    nov = [n for i in ids for n in novinky_viditelne(D) if n['id'] == i]
    if not nov: return {'blok': None}
    return {'blok': {'polozky': [{'href': rel(cesta, n['stranka']), 'nadpis': txt(n['seo']['h1']), 'popis': txt(n['popis'])} for n in nov]}}


def fotka_vm(f, cesta, sirky_kluc='webp'):
    """Fotka z dát (galéria, novinka): srcset WebP a AVIF, rozmery, popis."""
    return {'velka': rel(cesta, f['velka']), 'popis': txt(f.get('popis') or ''), 'src': rel(cesta, f['src']), 'w': f['w'], 'h': f['h'],
            'pos': f.get('pos') or '', 'webp': ', '.join(f'{rel(cesta, x)} {w}w' for w, x in f[sirky_kluc]),
            'srcset': ', '.join(f'{rel(cesta, x)} {w}w' for w, x in f[sirky_kluc]),
            'avif': ', '.join(f'{rel(cesta, x)} {w}w' for w, x in f.get('avif') or [])}


def novinka_doplnok_vm(D, cesta):
    n = novinka(D, cesta)
    fotky = [fotka_vm(f, cesta) for f in n.get('fotky') or [] if f.get('viditelna', True)]
    return {'text': {'odseky': [{'t': txt(x)} for x in n['odseky']]} if n.get('odseky') else None,
            'galeria': {'trieda': 'n2' if len(fotky) > 1 else 'n1', 'fotky': fotky} if fotky else None,
            'pdf_blok': {'pdf': [{'href': rel(cesta, p['subor']), 'text': txt(p['text'])} for p in n['pdf']]} if n.get('pdf') else None}


def fotografie(n):
    return f'{n} fotografia' if n == 1 else (f'{n} fotografie' if 2 <= n <= 4 else f'{n} fotografií')


def obrazky(n):
    return f'{n} obrázok' if n == 1 else (f'{n} obrázky' if 2 <= n <= 4 else f'{n} obrázkov')


def fotka_na_webe(D, f):
    """Položka albumu je na webe, keď je viditeľná a údaje, ktoré má v obrázku (plati_pri), platia (udaje_platia)."""
    return bool(f.get('viditelna', True)) and udaje_platia(D, f.get('plati_pri') or [])


def galeria_vm(D, album, cesta):
    a = next(x for x in D['galeria']['albumy'] if x['id'] == album)
    fotky = [fotka_vm(f, cesta) for f in a['fotky'] if fotka_na_webe(D, f)]
    return {'nadpis': txt(a['nadpis']), 'pocet': fotografie(len(fotky)), 'fotky': fotky}


def grafika_vm(D, album, cesta):
    """Albumy Máriových grafík (data/galeria.json: letaky na stránke Leták, grafika v Galérii): náhľady v rámikoch s celým
    obrázkom, po kliknutí veľký obrázok. Bez položiek na webe sa nevykreslí nič (ani nadpis). Letáky sú dva v rade ako
    susedné časti stránky Leták, album v Galérii šesť v rade; sizes je šírka obrázka v rámiku (obrázok nahraný v správe
    má šírky 600 a 1200 px, prehliadač si vyberie menšiu)."""
    a = next(x for x in D['galeria']['albumy'] if x['id'] == album)
    fotky = [fotka_vm(f, cesta) for f in a['fotky'] if fotka_na_webe(D, f)]
    if not fotky: return {'blok': None}
    v_galerii = album == 'grafika'
    return {'blok': {'nadpis': txt(a['nadpis']), 'album': v_galerii, 'pocet': obrazky(len(fotky)) if v_galerii else '',
                     'trieda': 'n6 gg' if v_galerii else 'n2 lb4', 'fotky': fotky,
                     'sizes': '(max-width:700px) 30vw, (max-width:1000px) 23vw, 180px' if v_galerii else '(max-width:700px) 42vw, 400px'}}


# ---------- texty stránok ----------
def odkaz_telefon(D, t):
    """Text s premennou {telefon}: escapovaný, telefón ako odkaz (ako v pôvodnej šablóne Dopravy)."""
    f = D['firma']
    return html.escape(txt(t), quote=True).replace('{telefon}', f'<a href="tel:{f["mobil_tel"]}">{f["mobil"]}</a>')


def polozky_vm(D, zoznam):
    return {'polozky': [{'n': f'{i:02d}', 'nazov': txt(t), 'popis': odkaz_telefon(D, d)} for i, (t, d) in enumerate(zoznam, 1)]}


# ---------- Kontakt: karty Zavolajte nám a Napíšte nám ----------
def cislice(s):
    return re.sub(r'\D', '', s or '')


def udaje_platia(D, kluce):
    """Máriove grafiky s údajom v obrázku (hodiny, telefón, e-mail, adresa, zľava) sa ukazujú len dovtedy, kým údaje
    v data/*.json sú tie, ktoré obrázok ukazuje (konštanty grafika_udaje z build.py; čísla bez medzier a e-mail rozdelený
    pri @, aby ich zmena kontaktu v správe nenahradila). Vráti True, keď platia všetky vymenované údaje (kľúče hodiny,
    mobil, pevna, email, ulica, psc, majitel, zlava); prázdny zoznam platí vždy. Oznamy k hodinám (vynimky) obrázok
    neskrývajú: ukazuje bežné hodiny a oznam je text hneď pri ňom."""
    f, o = D['firma'], D['k']['grafika_udaje']
    for k in kluce:
        if k == 'hodiny': ok = [[x['dni'], cas(x['od']), cas(x['do'])] for x in f['hodiny']] == o['hodiny']
        elif k in ('mobil', 'pevna'): ok = cislice(f[k]) == o[k]
        elif k == 'email': ok = f['email'].lower() == '@'.join(o['email'])
        elif k in ('ulica', 'majitel'): ok = f[k].lower() == o[k].lower()
        elif k == 'psc': ok = o['psc'] in f['mesto']
        elif k == 'zlava':
            t = D['cennik']['zlava'].replace('\u00a0', ' ')
            ok = all(re.search(r'(?<![0-9,])' + re.escape(x), t) for x in o['zlava'])
        else: ok = False
        if not ok: return False
    return True


def kontakt_karty_vm(D):
    """Karty Kontaktu s Máriovými grafikami (img/ilu/kontakt-*). Grafika má číslo a e-mail v obrázku, preto sa ukáže len
    vtedy, keď údaje v data/firma.json sú tie, ktoré obrázok ukazuje (konštanty kontakt_obr z build.py: čísla bez medzier
    a e-mail rozdelený pri @, aby ich zmena kontaktu v správe nenahradila). Inak je karta bez obrázka, text je vždy z dát."""
    f, o = D['firma'], D['k']['kontakt_obr']
    meno, _, domena = f['email'].partition('@')
    return {'mobil': f['mobil'], 'mobil_tel': f['mobil_tel'], 'pevna': f['pevna'], 'pevna_tel': f['pevna_tel'], 'email': f['email'],
            'email_meno': meno, 'email_domena': domena,
            'obr_tel': cislice(f['mobil']) == o['zavolajte']['mobil'] and cislice(f['pevna']) == o['zavolajte']['pevna'],
            'obr_mail': [meno, domena] == o['napiste']['email']}


# ---------- znalosti asistenta (R-1) ----------
# Odpovede asistenta na otázky, ktoré sú aj na stránke Časté otázky, a riadok s otváracími hodinami v znalostiach sa
# skladajú z tých istých dát ako web; správa ich na hostingu prepíše spolu so stránkami (ak tam asistent je).
ASISTENT_OTAZKY = ('asistent/znalosti/richtarik-otazky.json', 'assets/asistent-otazky.json')
ASISTENT_ZNALOSTI = 'asistent/znalosti/richtarik.md'
ZNALOSTI_HODINY = re.compile(r'^(- Otváracie hodiny: )[^\n(]*?( \(v odpovedi)', re.M)


# časy v ostatných odpovediach asistenta („v sobotu máme otvorené 7:00 – 12:00, v pracovné dni 7:00 – 16:00“); len pri
# rozvrhu pondelok – piatok + sobota, inak ich build.py nahlási (POZOR) a treba ich upraviť ručne
CAS_ROZSAH = r'\d{1,2}:\d\d – \d{1,2}:\d\d'
ODPOVED_CASY = [(re.compile(r'((?:[Pp]ondelok – piatok|v pracovné dni) )' + CAS_ROZSAH), '1-5'),
                (re.compile(r'((?:[Ss]obota|v sobotu|[Vv] sobotu máme otvorené) )' + CAS_ROZSAH), '6')]


def odpoved_casy(D, a):
    r = {x['dni']: x['cas'] for x in hodiny_riadky(D)}
    if set(r) != {'1-5', '6'}: return a
    for vzor, k in ODPOVED_CASY: a = vzor.sub(lambda m: m.group(1) + r[k], a)
    return a


def asistent_otazky(D, text):
    z = json.loads(text)
    odp = {i: a for i, t, q, a in caste_odpovede(D)}
    for o in z.get('otazky', []):
        if o.get('id') in odp: o['a'] = odp[o['id']]
        elif isinstance(o.get('a'), str): o['a'] = odpoved_casy(D, o['a'])
    return json.dumps(z, ensure_ascii=False, indent=1) + ('\n' if text.endswith('\n') else '')


def asistent_znalosti(D, md):
    return ZNALOSTI_HODINY.sub(lambda m: m.group(1) + hodiny_veta(D) + m.group(2), md, count=1)


# vety „Zavolajte nám na … (pondelok – piatok …)“ v okne asistenta (assets/asistent.js, asistent-ukazka.js)
ASISTENT_JS = ('assets/asistent.js', 'assets/asistent-ukazka.js')
JS_HODINY = re.compile(r'(Zavolajte nám na [^(\n]{5,40} \()pondelok[^)\n]*?(\))')


def asistent_js(D, js):
    return JS_HODINY.sub(lambda m: m.group(1) + hodiny_veta(D) + m.group(2), js)


# ---------- oblasti ----------
def vykresli(oid, cesta, D):
    """Obsah oblasti oid v súbore cesta (relatívna cesta od koreňa webu)."""
    if oid == 'hodiny-pata': return sablona('hodiny-pata', {'riadky': hodiny_riadky(D), 'vynimky': vynimky(D)})
    if oid == 'hodiny-kontakt': return sablona('hodiny-kontakt', {'riadky': hodiny_riadky(D), 'vynimky': vynimky(D), 'obr': udaje_platia(D, ['hodiny'])})
    if oid == 'kontakt-karty': return sablona('kontakt-karty', kontakt_karty_vm(D))
    if oid == 'hodiny-uvod-info': return sablona('hodiny-uvod-info', {'riadky': hodiny_riadky(D)})
    if oid == 'hodiny-uvod': return sablona('hodiny-uvod', {'riadky': hodiny_riadky(D), 'vynimky': vynimky(D)})
    if oid == 'ld-firma': return sablona('ld', {'json': firma_ld(D)})
    if oid == 'faq': return sablona('faq', faq_vm(D))
    if oid == 'faq-ld': return sablona('ld', {'json': faq_ld(D)})
    if oid == 'meta': return sablona('meta', meta_vm(D, cesta))
    if oid == 'zlava-lede': return sablona('lede', {'text': zlava(D)})
    if oid == 'akcie-index':
        return sablona('akcie-index', {'cennik_href': rel(cesta, cennik_aktualny(D)['pdf']), 'cennik_text': cennik_text(D), 'letak_href': rel(cesta, 'letak.html'),
                                       'karty': [karta_akcie(D, a, cesta) for a in viditelne(D)],
                                       'letaky': [{'href': rel(cesta, l['pdf']), 'text': txt(l['text'])} for l in D['cennik']['stare_letaky']]})
    if oid == 'ld-omrvinky' and cesta.startswith('novinky/'):
        n = novinka(D, cesta)
        return sablona('ld', {'json': breadcrumb_ld(D, cesta, [('index.html', 'Úvod'), ('novinky/index.html', 'Novinky'), (cesta, n['nazov'])])})
    if oid == 'ld-omrvinky':
        a = akcia(D, cesta)
        return sablona('ld', {'json': breadcrumb_ld(D, cesta, [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), (cesta, a['nazov'])])})
    if oid == 'hlavicka' and cesta.startswith('novinky/'):
        n = novinka(D, cesta)
        foto = D['k']['hlavicky'].get(n.get('hlavicka') or '', {}).get('html', '')
        return sablona('hlavicka-novinka', {'nazov': txt(n['nazov']), 'h1': txt(n['seo']['h1']), 'lede': txt(n['popis'] if n['viditelna'] else NOVINKA_SKONCILA),
                                            'foto': foto, 'uvod_href': rel(cesta, 'index.html'), 'novinky_href': rel(cesta, 'novinky/index.html')})
    if oid == 'novinka-doplnok': return sablona('novinka-doplnok', novinka_doplnok_vm(D, cesta))
    if oid == 'novinky-index': return sablona('novinky-index', {'karty': [karta_novinky(n, cesta) for n in novinky_viditelne(D)]})
    if oid == 'uvod-novinky': return sablona('uvod-novinky', {'karty': [karta_novinky(n, cesta, True) for n in novinky_viditelne(D) if n.get('na_uvode')][:4]})
    if oid == 'novinky-kat': return sablona('novinky-kat', novinky_kat_vm(D, cesta))
    if oid in ('galeria-predajna', 'galeria-dvor'): return sablona(oid, galeria_vm(D, oid[8:], cesta))
    if oid in ('galeria-letaky', 'galeria-grafika'): return sablona('galeria-grafika', grafika_vm(D, oid[8:], cesta))
    if oid == 'sluzby-zlavy': return sablona('sluzby-zlavy', {'zlava': zlava(D), 'obr': udaje_platia(D, ['zlava']), 'akcie_href': rel(cesta, 'akcie/index.html')})
    if oid == 'sluzby-lede': return sablona('lede', {'text': txt(D['texty']['sluzby_uvod'])})
    if oid == 'sluzby-polozky': return sablona('sluzby-polozky', polozky_vm(D, D['texty']['sluzby']))
    if oid == 'doprava-polozky': return sablona('doprava-polozky', polozky_vm(D, D['texty']['doprava']))
    if oid == 'onas-text': return sablona('odseky', {'odseky': [{'t': txt(x)} for x in D['texty']['onas']]})
    if oid == 'uvod-onas': return sablona('odseky', {'odseky': [{'t': txt(x)} for x in D['texty']['uvod_onas']]})
    if oid == 'uvod-lede': return sablona('lede-uvod', {'text': txt(D['texty']['uvod_lede'])})
    if oid == 'hlavicka':
        a = akcia(D, cesta)
        foto = D['k']['hlavicky'].get(a['hlavicka'] or '', {}).get('html', '')
        lede = 'Táto akcia sa už skončila. Aktuálne akcie nájdete na stránke Akcie.' if not a['viditelna'] else a['karta']
        return sablona('hlavicka-akcia', {'nazov': txt(a['nazov']), 'h1': txt(a['seo']['h1']), 'lede': txt(lede), 'foto': foto,
                                          'uvod_href': rel(cesta, 'index.html'), 'akcie_href': rel(cesta, 'akcie/index.html')})
    if oid == 'akcia-telo': return sablona('akcia-telo', akcia_vm(D, cesta))
    if oid == 'akcie-bocny': return sablona('akcie-bocny', {'ostatne': ostatne(D, cesta)})
    if oid == 'v-akcii': return sablona('v-akcii', v_akcii_vm(D, cesta))
    if oid == 'uvod-akcie':
        ak = [a for a in viditelne(D) if a['stranka'] and a['na_uvode']][:6]
        return sablona('uvod-akcie', {'karty': [karta_akcie(D, a, cesta) for a in ak]})
    if oid == 'uvod-cennik-veta': return sablona('uvod-cennik-veta', {'datum': datum_html(cennik_aktualny(D)['datum'])})
    if oid == 'doprava-cennik-odkaz': return sablona('doprava-cennik-odkaz', {'href': rel(cesta, cennik_aktualny(D)['pdf']), 'text': cennik_text(D)})
    if oid == 'doprava-cennik-veta': return sablona('doprava-cennik-veta', {'datum': datum_html(cennik_aktualny(D)['datum'])})
    if oid == 'letak-lede': return sablona('lede', {'text': txt(f'Cenník akcií z {cennik_aktualny(D)["datum"]} a staršie akciové letáky na stiahnutie.')})
    if oid == 'letak-cennik': return sablona('letak-cennik', {'href': rel(cesta, cennik_aktualny(D)['pdf']), 'text': cennik_text(D, True), 'zlava': zlava(D)})
    raise KeyError(f'neznáma oblasť {oid}')


def oblast(oid, obsah):
    return f'<!--s:{oid}-->{obsah}<!--/s:{oid}-->'


def oblasti_v(text):
    """[(id, obsah)] v poradí výskytu."""
    return [(m.group(1), m.group(2)) for m in ZNACKA.finditer(text)]


def prepis(text, cesta, D):
    """Text súboru s oblasťami vykreslenými z dát."""
    return ZNACKA.sub(lambda m: oblast(m.group(1), vykresli(m.group(1), cesta, D)), text)


def bez_znaciek(text):
    return re.sub(r'<!--/?s:[a-z0-9-]+-->', '', text)
