# Zhoda PLAN-D6-D7.md (text) a davky-d6-d7.json (strojová podoba).
# Použitie: python3 -I zhoda.py <PLAN-D6-D7.md> <davky-d6-d7.json> [výstup zhoda.txt]
# Kontroly:
#  1. množina N-bodov (N01–N41) v pláne == množina N-bodov v JSON (obojsmerne),
#  2. každý N-bod má v tabuľke plánu (časť 2) priradené dávky; JSON dávka musí N-bod spomínať
#     (v poli polozky alebo akceptacia); N-body „čaká“/„otázka“ musia byť v otazky_pre_majitela alebo nerobit,
#  3. efekty E1–E6 v D7 plánu == v JSON D7,
#  4. otázky 1–24 v pláne == cislo v JSON (počet a čísla),
#  5. dávky v pláne (### D…) == id v JSON, poradie rovnaké; každá dávka má povinné polia,
#  6. rozhodnutia R1–R15 spomenuté v pláne, R2 a R11–R15 musia byť v JSON,
#  7. kľúčové slová rozhodnutí skeptika sú v JSON (tnum/bez nového písma, zobrazit:false/bez objednania skryté,
#     +152 B/lenivo, <picture>/img.decode, počítadlo len pás tímu, raster favicon.svg, možnosti A/B).
import sys, re, json, pathlib

plan_p = pathlib.Path(sys.argv[1]); json_p = pathlib.Path(sys.argv[2])
out_p = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else json_p.parent / 'zhoda.txt'

def norm(s):  # nezlomiteľný spojovník a pomlčky → '-'
    return s.replace('‑', '-').replace('–', '-').replace('—', '-')

plan = norm(plan_p.read_text(encoding='utf-8'))
data = json.loads(json_p.read_text(encoding='utf-8'))
js = norm(json.dumps(data, ensure_ascii=False))

riadky = []
chyb = 0
def ok(msg): riadky.append('OK   ' + msg)
def err(msg):
    global chyb; chyb += 1; riadky.append('CHYBA ' + msg)

N_RE = re.compile(r'\bN(\d{2})\b')
# 1. množiny N-bodov
n_plan = set(N_RE.findall(plan)); n_json = set(N_RE.findall(js))
if n_plan == n_json: ok(f'N-body: plán {len(n_plan)} == JSON {len(n_json)} ({", ".join("N"+x for x in sorted(n_plan))})')
else:
    if n_plan - n_json: err('N-body v pláne, nie v JSON: ' + ', '.join('N'+x for x in sorted(n_plan - n_json)))
    if n_json - n_plan: err('N-body v JSON, nie v pláne: ' + ', '.join('N'+x for x in sorted(n_json - n_plan)))
ocak = {f'{i:02d}' for i in range(1, 42)}
if n_plan != ocak: err('plán nemá presne N01–N41: chýba ' + ', '.join(sorted(ocak - n_plan)) + '; navyše ' + ', '.join(sorted(n_plan - ocak)))

# 2. priradenie dávok z tabuľky časti 2
davky_json = {d['id']: d for d in data['davky']}
def text_davky(d): return norm(' '.join(d.get('polozky', [])) + ' ' + ' '.join(d.get('akceptacia', [])) + ' ' + d.get('ciel', '') + ' ' + d.get('riziko', ''))
otazky_txt = norm(json.dumps(data.get('otazky_pre_majitela', []), ensure_ascii=False))
nerobit_txt = norm(json.dumps(data.get('nerobit', []), ensure_ascii=False))
tab = re.findall(r'^\| (N\d{2}) \|(.*)\|\s*$', plan, flags=re.M)
if len(tab) != 41: err(f'tabuľka časti 2: nájdených {len(tab)} riadkov N (má byť 41)')
for nid, zvysok in tab:
    bunky = [b.strip() for b in zvysok.split('|')]
    davka = bunky[-1] if bunky else ''
    ids = re.findall(r'D6a-0|D6a|D6b|D6c|D7', davka)
    ids = sorted(set(ids), key=lambda x: ['D6a-0', 'D6a', 'D6b', 'D6c', 'D7'].index(x))
    if ids:
        for did in ids:
            if did not in davky_json: err(f'{nid}: dávka {did} z plánu nie je v JSON'); continue
            if nid not in text_davky(davky_json[did]): err(f'{nid}: podľa plánu patrí do {did}, JSON dávka {did} ho nespomína')
            else: ok(f'{nid} → {did}')
    else:
        kde = []
        if nid in otazky_txt: kde.append('otázky')
        if nid in nerobit_txt: kde.append('nerobiť')
        if nid in ' '.join(text_davky(d) for d in data['davky']): kde.append('dávky')
        if kde: ok(f'{nid} (bez dávky: „{davka}“) → JSON: {", ".join(kde)}')
        else: err(f'{nid} (bez dávky: „{davka}“) nie je v JSON otázkach, nerobiť ani dávkach')

# 3. efekty
e_plan = set(re.findall(r'\| (E[1-6]) \|', plan)); e_json = set(re.findall(r'\b(E[1-6])\b', norm(' '.join(davky_json['D7']['polozky'] + davky_json['D7']['akceptacia']))))
if e_plan == e_json == {'E1', 'E2', 'E3', 'E4', 'E5', 'E6'}: ok('efekty E1–E6: plán == JSON D7')
else: err(f'efekty: plán {sorted(e_plan)} vs JSON {sorted(e_json)}')

# 4. otázky
cast7 = plan.split('## 7. Otázky pre majiteľa', 1)[1].split('## 8.', 1)[0]
q_plan = [int(x) for x in re.findall(r'^(\d{1,2})\. ', cast7, flags=re.M)]
q_json = [q['cislo'] for q in data.get('otazky_pre_majitela', [])]
if q_plan == q_json == list(range(1, 25)): ok('otázky 1–24: plán == JSON')
else: err(f'otázky: plán {q_plan} vs JSON {q_json}')
for q in data.get('otazky_pre_majitela', []):
    for nid in q.get('n_body', []):
        if nid not in n_plan and nid[1:] not in n_plan: err(f'otázka {q["cislo"]}: {nid} nie je v pláne')

# 5. dávky a polia
d_plan = re.findall(r'^### (D6a-0|D6a|D6b|D6c|D7) ', plan, flags=re.M)
d_json = [d['id'] for d in data['davky']]
if d_plan == d_json: ok(f'dávky a poradie: {d_json}')
else: err(f'dávky: plán {d_plan} vs JSON {d_json}')
polia = ['id', 'nazov', 'ciel', 'polozky', 'zdroje_faktov', 'akceptacia', 'overenie', 'riziko', 'kapitoly_skillu']
for d in data['davky']:
    chyba_poli = [p for p in polia if p not in d or not d[p]]
    if chyba_poli: err(f'{d["id"]}: chýbajú polia {chyba_poli}')
    else: ok(f'{d["id"]}: všetkých 9 polí')
    # kapitoly skillu z plánu
    blok = plan.split(f'### {d["id"]} ', 1)[1].split('\n### ', 1)[0]
    m = re.search(r'\*\*Kapitoly skillu:\*\*(.*?)(?:\n\n|\Z)', blok, flags=re.S)
    k_plan = set(re.findall(r'C\d{3}', m.group(1))) if m else set()
    k_json = set(re.findall(r'C\d{3}', d['kapitoly_skillu']))
    if k_plan == k_json: ok(f'{d["id"]}: kapitoly skillu {sorted(k_json)}')
    else: err(f'{d["id"]}: kapitoly skillu plán {sorted(k_plan)} vs JSON {sorted(k_json)}')
for p in ['otazky_pre_majitela', 'nerobit']:
    if p in data and data[p]: ok(f'pole {p}: {len(data[p])} položiek')
    else: err(f'chýba pole {p}')
cast8 = plan.split('## 8. Čo nerobiť', 1)[1].split('## 9.', 1)[0]
n8 = len(re.findall(r'^- ', cast8, flags=re.M))
if n8 == len(data.get('nerobit', [])): ok(f'nerobiť: {n8} bodov v pláne == JSON')
else: err(f'nerobiť: plán {n8} bodov vs JSON {len(data.get("nerobit", []))}')

# 6. rozhodnutia
r_plan = set(re.findall(r'\*\*(R\d{1,2}) ', plan))
for r in ['R2', 'R11', 'R12', 'R13', 'R14', 'R15']:
    if r not in r_plan: err(f'{r} nie je v pláne')
    elif not re.search(r'\b' + r + r'\b', js): err(f'{r} nie je v JSON')
    else: ok(f'{r} v pláne aj v JSON')

# 7. kľúčové slová rozhodnutí skeptika v JSON
klucove = [
 ('N07 bez nového písma / tnum', ['bez nového písma', 'tnum', 'fonts.css a assets/fonts/ sa nemenia']),
 ('nepotvrdené skryté', ['zobrazit:false', 'bez objednania', 'skryt']),
 ('D6b technika v HTML + lenivo', ['+152 B', 'lenivo', 'nič nevkladá pri štarte']),
 ('E1 picture/decode', ['<picture>', 'img.decode()', 'loading=\\"lazy\\"', 'decoding=\\"async\\"']),
 ('E4 len pás tímu', ['LEN pri páse tímu']),
 ('ikony raster favicon.svg', ['rastrom priamo z existujúceho favicon.svg']),
 ('vernostná A/B', ['možnosť A', 'možnosť B', 'otázka 15']),
]
raw = json_p.read_text(encoding='utf-8')
for nazov, slova in klucove:
    chyba = [s for s in slova if s not in raw and s not in js]
    if chyba: err(f'{nazov}: v JSON chýba {chyba}')
    else: ok(f'{nazov}: v JSON')

vysledok = ('ZHODA: 0 chýb' if chyb == 0 else f'NEZHODA: {chyb} chýb')
riadky.insert(0, f'Kontrola zhody plánu a JSON, {plan_p.name} ↔ {json_p.name}: {vysledok}')
out_p.write_text('\n'.join(riadky) + '\n', encoding='utf-8')
print('\n'.join(riadky))
sys.exit(1 if chyb else 0)
