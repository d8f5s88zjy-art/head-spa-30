"""Malý motor šablón kúskov HTML, spoločný pre build.py (Python) a správu webu (sprava/jadro/Sablona.php).

Šablóny sú v sprava/sablony/*.html. Jazyk (nič iné neexistuje):
  {{pole}}          hodnota escapovaná ako html.escape(..., quote=True)
  {{{pole}}}        hodnota bez escapovania (len hotový kúsok z inej šablóny alebo z prípravy dát)
  {{#pole}}…{{/pole}}  zoznam: pre každú položku raz (položka je nový kontext); slovník: raz v jeho kontexte;
                    iná pravdivá hodnota: raz v tom istom kontexte
  {{^pole}}…{{/pole}}  len ak je hodnota nepravdivá (None, False, '', 0, prázdny zoznam)
  {{.}}             aktuálna položka zoznamu
Pole môže byť cesta s bodkami (a.b). Hľadá sa od najvnútornejšieho kontextu von. Text z dát sa nikdy nevyhodnocuje
ako šablóna (šablóna sa rozoberie raz, hodnoty sa len vkladajú). Súbor šablóny bez posledného znaku nového riadka.
Ten istý výstup do bajtu dáva PHP (sprava/testy/sablona-pripady.json overí oba motory).
"""
import html, os, re

KOREN = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sprava', 'sablony')
_TOKEN = re.compile(r'\{\{(\{|#|\^|/)?\s*([a-zA-Z0-9_.]+|\.)\s*\}?\}\}')
_CACHE = {}


def e(v):
    """Escapovanie ako html.escape(quote=True); None je prázdny reťazec, číslo sa prevedie na text."""
    return html.escape(_text(v), quote=True)


def _text(v):
    if v is None or v is False: return ''
    if v is True: return '1'
    return str(v)


def _rozober(t):
    """Zoznam uzlov: ('t', text) | ('v', meno, escapovať) | ('s', meno, obrátená, deti)."""
    koren = []; zasobnik = [(None, koren)]; poz = 0
    for m in _TOKEN.finditer(t):
        if m.start() > poz: zasobnik[-1][1].append(('t', t[poz:m.start()]))
        druh, meno = m.group(1), m.group(2)
        if druh in ('#', '^'):
            deti = []; zasobnik[-1][1].append(('s', meno, druh == '^', deti)); zasobnik.append((meno, deti))
        elif druh == '/':
            if zasobnik[-1][0] != meno: raise ValueError(f'šablóna: neočakávané {{{{/{meno}}}}}')
            zasobnik.pop()
        elif druh == '{':
            if not m.group(0).endswith('}}}'): raise ValueError('šablóna: {{{ bez }}}')
            zasobnik[-1][1].append(('v', meno, False))
        else:
            zasobnik[-1][1].append(('v', meno, True))
        poz = m.end()
    if len(zasobnik) != 1: raise ValueError(f'šablóna: neuzavretá časť {zasobnik[-1][0]}')
    if poz < len(t): koren.append(('t', t[poz:]))
    return koren


def _hodnota(kontexty, meno):
    if meno == '.': return kontexty[-1]
    casti = meno.split('.')
    for k in reversed(kontexty):
        if isinstance(k, dict) and casti[0] in k:
            v = k[casti[0]]
            for c in casti[1:]:
                v = v.get(c) if isinstance(v, dict) else None
            return v
    return None


def _pravda(v):
    return not (v is None or v is False or v == '' or v == 0 or v == [] or v == {})


def _vykresli(uzly, kontexty, von):
    for u in uzly:
        if u[0] == 't': von.append(u[1])
        elif u[0] == 'v':
            v = _hodnota(kontexty, u[1])
            von.append(e(v) if u[2] else _text(v))
        else:
            v = _hodnota(kontexty, u[1])
            if u[2]:
                if not _pravda(v): _vykresli(u[3], kontexty, von)
            elif isinstance(v, list):
                for x in v: _vykresli(u[3], kontexty + [x], von)
            elif isinstance(v, dict):
                if v: _vykresli(u[3], kontexty + [v], von)
            elif _pravda(v):
                _vykresli(u[3], kontexty, von)


def vyplnit(text_sablony, data):
    von = []
    _vykresli(_rozober(text_sablony), [data], von)
    return ''.join(von)


def nacitaj(meno):
    if meno not in _CACHE:
        with open(os.path.join(KOREN, meno + '.html'), encoding='utf-8') as f:
            t = f.read()
        _CACHE[meno] = t[:-1] if t.endswith('\n') else t
    return _CACHE[meno]


def sablona(meno, data):
    """Vyplní šablónu sprava/sablony/<meno>.html dátami."""
    return vyplnit(nacitaj(meno), data)
