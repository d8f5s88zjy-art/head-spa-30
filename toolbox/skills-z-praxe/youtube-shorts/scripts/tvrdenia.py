#!/usr/bin/env python3
"""Kontrola tvrdení v scenári shortu pred natáčaním a pred schválením: fámy, čísla, superlatívy.

Vzniklo z rozboru videa V7 (marcinteodoru, „0x Alpha“, 2026-08-22): autor povedal „2,6 bilióna parametrov“, hoci
číslo na jeho vlastnej snímke obrazovky bolo 2,6 T tokenov za deň; porovnanie s Fable 5 a GPT-5.6 Sol pochádzalo
z 10 úloh jedného vývojára a nálepka „Fable 5 killer?“ s otáznikom tvrdenie neoslabila. Skript nič neoveruje
na webe: kontroluje, či každé tvrdenie má zdroj, dátum, stav a správne označenie. Overenie robí človek.

Dva režimy (Python 3, len štandardná knižnica):

  python3 -I tvrdenia.py scenar-tvrdenia.json        # tabuľka tvrdení (vzor: --vzor)
  python3 -I tvrdenia.py --text scenar.txt           # voľný text scenára, riadok po riadku
  python3 -I tvrdenia.py --vzor > tvrdenia.json      # prázdna šablóna JSON
  voliteľne: --json vysledok.json (zápis nálezov), --dnes RRRR-MM-DD (namiesto datum_vyroby)

JSON: {"short", "typ": "prevadzka"|"novinka", "datum_vyroby", "max_vek_dni" (predvolene 7), "tvrdenia": [
  {"id", "text" (presne, ako zaznie alebo je v obraze), "kde" (reč, obraz, názov, popis),
   "stav": overené (primárny zdroj, zdroj prevádzky alebo vlastné meranie s postupom)
         | pripísané (dôveryhodné médium, v texte zaznie „podľa …“)
         | nepotvrdené (fáma: v texte kto to tvrdí, v obraze štítok NEPOTVRDENÉ s dátumom)
         | nepravdivé (do shortu nesmie) | názor (znie ako názor),
   "zdroj" (adresa alebo súbor), "zdroj_typ": prevádzka | primárny | vlastné meranie | sekundárny |
   sociálna sieť | autor videa, "overené" (RRRR-MM-DD), "citat" (presný text zdroja s číslom),
   "jednotka" (čo číslo meria), "jednotka_v_texte" (čo musí stáť vo vete, napr. „%“; inak prvé slovo
   jednotky), "nazvy" (mená s číslami, ktoré nie sú údaje, napr. „GPT-5.6 Sol“), "kto_tvrdi", "stitok"}]}

Textový režim: rizikový riadok (číslo, superlatív, porovnanie, „údajne“, zdravotný sľub, otázka s tvrdením)
prejde, len keď má značku [zdroj: …, RRRR-MM-DD] alebo [nepotvrdené: kto tvrdí, RRRR-MM-DD].

Návratový kód: 0 bez chýb (upozornenia môžu byť), 1 aspoň jedna CHYBA, 2 zlé argumenty alebo súbor.
"""
import datetime
import json
import re
import sys
import unicodedata

STAVY = {'overené', 'pripísané', 'nepotvrdené', 'nepravdivé', 'názor'}
TYPY_ZDROJA = {'prevádzka', 'primárny', 'vlastné meranie', 'sekundárny', 'sociálna sieť', 'autor videa'}
SILNE_ZDROJE = {'prevádzka', 'primárny', 'vlastné meranie'}

# superlatívy a porovnania (slovensky aj anglicky, lebo hooky sa preberajú z cudzích videí)
SUPERLATIV = re.compile(
    r'\b(naj(lepš|lacnejš|rýchlejš|väčš|silnejš|kvalitnejš|obľúbenejš|populárnejš|výhodnejš)\w*|jedin(ý|á|é|í)\b'
    r'|číslo\s+jeden|top\s*1\b|prv(ý|á|é)\s+(v|na)\b|poráž\w*|poraz\w*|prekon[áa]\w*|drví\w*|drvia\w*|zabijak\w*|killer'
    r'|lepš(í|ia|ie)\s+ako|lepšie\s+ako|lepšie\s+než|beat(s|ing)?\b|crush\w*|destroy\w*|#1\b|best\b|revolúci\w*'
    r'|zázra\w*|garant\w*|100\s*%|oproti|versus|\bvs\b\.?|vedie\s+(?:si\s+)?(?:\w+\s+){0,2}proti)', re.I)
HEDGE = re.compile(r'\b(údajne|vraj|vraví\s+sa|šepká\s+sa|reportedly|supposedly|allegedly|rumou?r\w*|prý)\b', re.I)
POSUDZOVANE = re.compile(r'\b(podľa|tvrdí|tvrdia|píše|píšu|uvádza|uvádzajú|hovorí|hovoria)\b', re.I)
ZDRAVIE = re.compile(r'\b(lieč\w*|vylieč\w*|rast\s+vlasov|vypadáv\w*|vypadan\w*|detox\w*|chudn\w*|spaľ\w*\s+tuk\w*'
                     r'|omladz\w*|regener\w*\s+vlas\w*|proti\s+plešat\w*)\b', re.I)
POPLACH = re.compile(r'\b(breaking|tajomn\w*|záhadn\w*|šok\w*|mysterious|nobody\s+knows|nikto\s+nevie)\b', re.I)
CISLO = re.compile(r'\d+(?:[.,]\d+)?')
DATUM_STITKU = re.compile(r'\d{1,2}\.\s?\d{1,2}\.')
NAZOR = re.compile(r'\b(podľa\s+mňa|myslím|za\s+mňa|môj\s+názor|mne\s+sa)\b', re.I)
ZNACKA = re.compile(r'\[(zdroj|nepotvrdené)\s*:[^\]]*\d{4}-\d{2}-\d{2}[^\]]*\]', re.I)

VZOR = {
    'short': '[názov shortu]',
    'typ': 'prevadzka',
    'datum_vyroby': '[RRRR-MM-DD]',
    'max_vek_dni': 7,
    'tvrdenia': [
        {'id': 'T1', 'text': '[veta presne, ako zaznie]', 'kde': ['reč', 'obraz'], 'stav': 'overené',
         'zdroj': '[súbor alebo adresa]', 'zdroj_typ': 'prevádzka', 'overené': '[RRRR-MM-DD]',
         'citat': '[presný text zo zdroja, ak veta obsahuje číslo]', 'jednotka': '[čo číslo meria]'},
    ],
}


def bez_diakritiky(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()


def cisla(s):
    """Čísla v texte normalizované na bodku (2,6 → 2.6); poradové čísla dátumu a verzií sa neodlišujú."""
    return {c.replace(',', '.') for c in CISLO.findall(s)}


def datum(s):
    try:
        return datetime.date.fromisoformat(str(s))
    except (TypeError, ValueError):
        return None


def kontroluj_tabulku(d, dnes=None):
    naly = []

    def n(uroven, tid, sprava):
        naly.append({'uroven': uroven, 'id': tid, 'sprava': sprava})

    typ = d.get('typ', 'prevadzka')
    vyroba = datum(dnes or d.get('datum_vyroby'))
    if not vyroba:
        n('CHYBA', '-', 'chýba datum_vyroby (RRRR-MM-DD) alebo --dnes: bez neho sa nedá posúdiť, či je overenie čerstvé')
    max_vek = int(d.get('max_vek_dni', 7))
    tvrd = d.get('tvrdenia') or []
    if not tvrd:
        n('CHYBA', '-', 'žiadne tvrdenia: aj short bez čísel má tvrdenia (čo, kde, pre koho); zapíš ich')
    for i, t in enumerate(tvrd, 1):
        tid = t.get('id') or f'T{i}'
        text = t.get('text', '')
        stav = t.get('stav')
        ztyp = t.get('zdroj_typ')
        if stav not in STAVY:
            n('CHYBA', tid, f'stav „{stav}“ nie je jeden z: {", ".join(sorted(STAVY))}')
            continue
        if ztyp and ztyp not in TYPY_ZDROJA:
            n('CHYBA', tid, f'zdroj_typ „{ztyp}“ nie je jeden z: {", ".join(sorted(TYPY_ZDROJA))}')
        if stav == 'nepravdivé':
            n('CHYBA', tid, 'nepravdivé tvrdenie nepatrí do shortu; ak ho vyvraciaš, zapíš vyvrátenie ako vlastné '
                            'tvrdenie so zdrojom (napr. „2,6 T na grafe sú tokeny za deň, nie parametre“)')
            continue
        if stav == 'názor':
            if not NAZOR.search(text):
                n('POZOR', tid, 'názor má znieť ako názor („podľa mňa“, „za mňa“), inak ho divák berie ako fakt')
            if SUPERLATIV.search(text) and typ == 'prevadzka':
                n('CHYBA', tid, 'superlatív o prevádzke ani ako názor (zákon 108/2024, § 10 a príloha č. 1)')
            continue
        # overené, pripísané a nepotvrdené potrebujú zdroj a dátum
        if not t.get('zdroj'):
            n('CHYBA', tid, 'chýba zdroj (súbor prevádzky alebo adresa); bez zdroja tvrdenie nejde do shortu')
        ov = datum(t.get('overené'))
        if not ov:
            n('CHYBA', tid, 'chýba dátum overenia „overené“ (RRRR-MM-DD)')
        elif vyroba:
            if ov > vyroba:
                n('CHYBA', tid, f'dátum overenia {ov} je po dni výroby {vyroba}')
            elif (vyroba - ov).days > max_vek:
                n('POZOR', tid, f'overené {ov}, teda pred {(vyroba - ov).days} dňami (limit {max_vek}): over znova '
                                'pred uverejnením; pri V7 sa autor modelu odhalil 4 dni po videu')
        if stav == 'overené':
            if ztyp and ztyp not in SILNE_ZDROJE:
                n('CHYBA', tid, f'zdroj typu „{ztyp}“ nestačí na „overené“; článok, príspevok alebo cudzie video je '
                                'nanajvýš „nepotvrdené“ s uvedením, kto to tvrdí')
            if HEDGE.search(text):
                n('POZOR', tid, f'„{HEDGE.search(text).group(0)}“ pri overenom tvrdení mätie: povedz zdroj, nie „údajne“')
        if stav == 'pripísané':
            if ztyp in ('sociálna sieť', 'autor videa'):
                n('CHYBA', tid, f'„{ztyp}“ nie je médium, ktoré tvrdenie overuje: je to „nepotvrdené“ so štítkom')
            if not POSUDZOVANE.search(text):
                n('CHYBA', tid, 'pripísané tvrdenie musí v texte povedať, odkiaľ je („podľa Bloombergu …“)')
            if SUPERLATIV.search(text):
                n('CHYBA', tid, f'superlatív alebo porovnanie („{SUPERLATIV.search(text).group(0)}“) len z primárneho '
                                'zdroja alebo vlastného merania')
            if typ == 'prevadzka':
                n('CHYBA', tid, 'o prevádzke len zdroj prevádzky alebo majiteľ, nie médiá ani katalógy')
        if stav == 'nepotvrdené':
            if typ == 'prevadzka':
                n('CHYBA', tid, 'nepotvrdené tvrdenie o prevádzke (cena, služba, termín, výsledok) nejde von; '
                                'najprv potvrdiť u majiteľa alebo v zdroji')
            st = t.get('stitok', '')
            if 'nepotvrden' not in bez_diakritiky(st):
                n('CHYBA', tid, 'nepotvrdené tvrdenie potrebuje štítok v obraze so slovom „NEPOTVRDENÉ“')
            if st and not DATUM_STITKU.search(st):
                n('CHYBA', tid, f'štítok „{st}“ nemá dátum stavu (napr. „k 22. 8.“): fáma sa mení zo dňa na deň')
            kto = t.get('kto_tvrdi', '')
            if not kto:
                n('CHYBA', tid, 'chýba kto_tvrdi: pri fáme povedz, kto to tvrdí a na čom (napr. „vývojár na 10 úlohách“)')
            elif not (POSUDZOVANE.search(text) or re.search(r'\b' + re.escape(bez_diakritiky(kto.split()[0])) + r'\b',
                                                               bez_diakritiky(text))):
                n('CHYBA', tid, 'v texte nezaznie, kto to tvrdí („podľa …“); „údajne“ ani otáznik to nenahradia')
            if SUPERLATIV.search(text):
                n('CHYBA', tid, f'superlatív alebo porovnanie z fámy („{SUPERLATIV.search(text).group(0)}“) nepúšťaj '
                                'ani s otáznikom; povedz, čo presne kto nameral')
        # spoločné kontroly
        if '?' in text and SUPERLATIV.search(text):
            n('CHYBA', tid, f'otázka s tvrdením („{text.strip()}“): otáznik tvrdenie neruší, divák si zapamätá tvrdenie')
        if SUPERLATIV.search(text) and stav == 'overené' and typ == 'prevadzka':
            n('POZOR', tid, 'superlatív alebo porovnanie o prevádzke: len doslovne zo zdroja a doložiteľné '
                            '(zákon 108/2024, § 10 a príloha č. 1); radšej konkrétny fakt')
        if ZDRAVIE.search(text):
            slovo = ZDRAVIE.search(text).group(0)
            doslovne = (stav == 'overené' and ztyp == 'prevádzka'
                        and bez_diakritiky(slovo)[:5] in bez_diakritiky(t.get('citat', '')))
            n('POZOR' if doslovne or typ != 'prevadzka' else 'CHYBA', tid,
              f'zdravotný alebo výsledkový sľub („{slovo}“): len doslovne zo zdroja prevádzky (citat) '
              'alebo s dokladom od majiteľa, inak nie')
        if POPLACH.search(text):
            n('POZOR', tid, f'poplašné slovo („{POPLACH.search(text).group(0)}“): ak je tajomstvo vyriešené, '
                            'video zastará; uveď dátum stavu')
        bez_mien = text
        for meno in t.get('nazvy') or []:
            bez_mien = bez_mien.replace(meno, ' ')
        cs = cisla(bez_mien)
        if cs:
            citat = t.get('citat', '')
            jedn = t.get('jednotka', '')
            if not citat:
                n('CHYBA', tid, 'veta s číslom potrebuje „citat“: presný text zdroja, kde číslo stojí')
            else:
                chyba = sorted(c for c in cs if c not in cisla(citat))
                if chyba:
                    n('CHYBA', tid, f'číslo {", ".join(chyba)} nie je v citáte zdroja „{citat}“')
            if not jedn:
                n('CHYBA', tid, 'chýba „jednotka“: čo číslo meria (V7: 2,6 T boli tokeny za deň, nie parametre)')
            else:
                kmen = bez_diakritiky(t.get('jednotka_v_texte') or jedn.split()[0][:5])
                if kmen and kmen not in bez_diakritiky(text):
                    n('CHYBA', tid, f'jednotka v texte nesedí so zdrojom: zdroj meria „{jedn}“, veta to nehovorí '
                                    f'(„{text.strip()}“)')
    return naly


def kontroluj_text(riadky):
    naly = []
    for i, r in enumerate(riadky, 1):
        s = r.strip()
        if not s or s.startswith('#'):
            continue
        dovody = []
        if CISLO.search(re.sub(r'\[[^\]]*\]', '', s)):
            dovody.append('číslo')
        for meno, rx in (('superlatív/porovnanie', SUPERLATIV), ('„údajne“', HEDGE), ('zdravotný sľub', ZDRAVIE),
                         ('poplašné slovo', POPLACH)):
            m = rx.search(s)
            if m:
                dovody.append(f'{meno} „{m.group(0)}“')
        if '?' in s and SUPERLATIV.search(s):
            dovody.append('otázka s tvrdením')
        if not dovody:
            continue
        m = ZNACKA.search(s)
        if 'otázka s tvrdením' in dovody:
            uroven, dopln = 'CHYBA', ' (otáznik tvrdenie neruší, prepíš na konkrétny fakt)'
        elif m and m.group(1).lower().startswith('nepotvrden') and any(x.startswith('superlatív') for x in dovody):
            uroven, dopln = 'CHYBA', ' (superlatív z fámy nepúšťaj ani so značkou; povedz, čo presne kto nameral)'
        elif m:
            uroven, dopln = 'OK', ''
        else:
            uroven, dopln = 'CHYBA', ' (chýba [zdroj: …, RRRR-MM-DD] alebo [nepotvrdené: kto, RRRR-MM-DD])'
        naly.append({'uroven': uroven, 'id': f'r{i}', 'sprava': f'{", ".join(dovody)}: „{s}“{dopln}'})
    return naly


def pocet(n, jeden, dva_styri, viac):
    return f'{n} ' + (jeden if n == 1 else dva_styri if 2 <= n <= 4 else viac)


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__)
        return 2
    if argv[0] == '--vzor':
        print(json.dumps(VZOR, ensure_ascii=False, indent=1))
        return 0
    out_json, dnes = None, None
    if '--json' in argv:
        k = argv.index('--json')
        out_json = argv[k + 1] if k + 1 < len(argv) else None
        argv = argv[:k] + argv[k + 2:]
    if '--dnes' in argv:
        k = argv.index('--dnes')
        dnes = argv[k + 1] if k + 1 < len(argv) else None
        argv = argv[:k] + argv[k + 2:]
    try:
        if argv[0] == '--text':
            with open(argv[1], encoding='utf-8') as f:
                naly = kontroluj_text(f.read().splitlines())
            nazov = argv[1]
        else:
            with open(argv[0], encoding='utf-8') as f:
                d = json.load(f)
            naly = kontroluj_tabulku(d, dnes)
            nazov = d.get('short', argv[0])
    except (IndexError, OSError, json.JSONDecodeError) as e:
        print(f'chyba: {e}', file=sys.stderr)
        return 2
    chyby = sum(1 for x in naly if x['uroven'] == 'CHYBA')
    pozor = sum(1 for x in naly if x['uroven'] == 'POZOR')
    print(f'{nazov}: {pocet(chyby, "chyba", "chyby", "chýb")}, {pocet(pozor, "upozornenie", "upozornenia", "upozornení")}')
    for x in naly:
        print(f"  {x['uroven']:5} {x['id']}: {x['sprava']}")
    if out_json:
        with open(out_json, 'w', encoding='utf-8') as f:
            json.dump({'subor': nazov, 'chyby': chyby, 'upozornenia': pozor, 'nalezy': naly}, f,
                      ensure_ascii=False, indent=1)
    return 1 if chyby else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
