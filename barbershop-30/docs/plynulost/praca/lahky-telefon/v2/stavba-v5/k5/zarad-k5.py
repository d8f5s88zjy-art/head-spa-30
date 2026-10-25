# Zaradenie nálezov orákula trieda-k5 (ručne overené kategórie):  python3 -I zarad-k5.py trieda-k5-vystup.txt
import re, sys, collections
C = collections.Counter(); L = collections.defaultdict(collections.Counter)
osoba = {'her', 'sie', 'ihr', 'nu', 'ni', 'jej'}
zlozene = {'kinderhaarschnitt', 'hautpflege', 'bartpfleg', 'nassrasur', 'fejborotv', 'szakalligazitassal', 'zastrih'}
fp_func = set('kolika cenik cene komu nad ihr euch eure seid macht wem preise preisliste vagytok hogyan arak arai jestescie cennik cen niz kad kako vam sta ima pre cenovnik ціни які мене pricelist prices cenn cez velk velik nagy смс'.split())
fp_sem = set('kostenlos teuerstes legdragabb najdrozsz наидорож najskuplj nejdrazs ogolicie поголит leborotvaljatok prefarbenie dohladka ostrih ostrzyz dugom dlugos długos długo'.split())
cur = None; tot = 0
for x in open(sys.argv[1], encoding='utf8'):
    x = x.rstrip('\n')
    m = re.match(r'### (K\d [^(]+) \(', x)
    if m: cur = m.group(1)[:2]; continue
    if x.startswith('## K9'): cur = None
    m = re.match(r'  (\w\w) „(.*)“ → (\w+) ([\w:-]+) .*\| nevysvetlí: (.*)$', x)
    if not (m and cur): continue
    tot += 1
    l, q, druh, vin, z = m.groups(); zs = set(z.split(', '))
    if cur == 'K7' and '(dve osoby)' in zs: k = 'V1b dve osoby, druhá zámenom → holá cena jednej'
    elif cur == 'K7' and zs & osoba: k = 'V1a žena zámenom → cena pánskej služby'
    elif zs & zlozene: k = 'V2 zložené slovo inej služby → holá cena jednej'
    elif cur == 'K8' and zs & {'2x', 'ket', 'all'}: k = 'S3 počet (2x, két, all of us) → jednotková cena'
    elif cur == 'K8' and zs & {'pod', 'up', 'bis', 'під'}: k = 'V3 dĺžka do/pod 10 cm → 22 €'
    elif cur == 'K6': k = 'D1 holé číslo „um 9“'
    elif cur == 'K8': k = 'zápor v nezmyselnej šablóne (realistické vety → voľby)'
    elif cur == 'K7': k = 'zámeno muža/„one“ – výplň podľa P1 (him, ihn, ně, all)'
    elif zs <= fp_func: k = 'falošný poplach: funkčné/cenové slovo mimo môjho zoznamu'
    elif zs <= (fp_sem | fp_func): k = 'falošný poplach: víťaz sémanticky správny'
    else: k = 'NEZARADENÉ: ' + z
    C[k] += 1; L[k][l] += 1
print('spolu', tot)
for k, v in C.most_common(): print(f'{v:6d}  {k}  {dict(L[k])}')
