# Zabalí skills z tohto priečinka do zipov na nahratie do Claude.ai (Settings, Capabilities, Skills)
# alebo na prenos do ~/.claude/skills na inom počítači. Každý zip má v koreni priečinok skillu so SKILL.md.
# Spustenie z koreňa repozitára:  python3 -I toolbox/skills-z-praxe/zabal.py <cieľový-priečinok> [meno-skillu ...]
# Bez mien zabalí všetky skills. Súbory __pycache__, .DS_Store a dočasné výstupy sa vynechajú.
import os
import sys
import zipfile

TU = os.path.dirname(os.path.abspath(__file__))
VYNECHAJ = {'__pycache__', '.DS_Store', 'node_modules'}


def skills():
    return sorted(d for d in os.listdir(TU) if os.path.isfile(os.path.join(TU, d, 'SKILL.md')))


def zabal(meno, ciel):
    zdroj = os.path.join(TU, meno)
    cesta = os.path.join(ciel, meno + '.zip')
    n = 0
    with zipfile.ZipFile(cesta, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for koren, dirs, files in os.walk(zdroj):
            dirs[:] = sorted(d for d in dirs if d not in VYNECHAJ)
            for f in sorted(files):
                if f in VYNECHAJ or f.endswith('.pyc'):
                    continue
                p = os.path.join(koren, f)
                z.write(p, os.path.join(meno, os.path.relpath(p, zdroj)))
                n += 1
    return cesta, n, os.path.getsize(cesta)


def main():
    if len(sys.argv) < 2:
        print('Použitie: python3 -I toolbox/skills-z-praxe/zabal.py <cieľový-priečinok> [meno-skillu ...]')
        sys.exit(2)
    ciel = os.path.abspath(sys.argv[1])
    os.makedirs(ciel, exist_ok=True)
    mena = sys.argv[2:] or skills()
    nezname = [m for m in mena if m not in skills()]
    if nezname:
        print('neznámy skill:', ', '.join(nezname), '| dostupné:', ', '.join(skills()))
        sys.exit(2)
    for m in mena:
        cesta, n, b = zabal(m, ciel)
        print(f'{m}: {n} súborov, {b / 1024:.0f} kB -> {cesta}')


if __name__ == '__main__':
    main()
