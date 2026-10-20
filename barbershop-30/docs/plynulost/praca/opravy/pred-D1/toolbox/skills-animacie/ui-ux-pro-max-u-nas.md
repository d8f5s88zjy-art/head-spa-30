# UI/UX Pro Max u nás

Pôvod: video V9 (thechriscordero, „$10,000 website“), `../skills-z-praxe/referencie-z-videi/references/naucene-z-videi.md`,
záznam 16. Pohyb a komponenty bez knižnice: `../skills-z-praxe/rychly-web/references/pohyb-bez-kniznice.md`.

Skill z videa V9 („Drop in the UI/UX Pro Max skill … Now it thinks like a senior designer“) **už máme**: je
vnútri Genjutsu ako podskill `toolbox/skills-animacie/genjutsu/skills/_jutsu/ui-ux-pro-max/` (dáta, skripty a odkazy prevzaté bez zmeny,
licencia MIT, Copyright (c) 2024 Next Level Builder, text v `LICENSE-upstream.txt`; pôvod a stav v `UPSTREAM.md`).
Netreba ho inštalovať ani ťahať z GitHubu, ako to robí video (snímka 17,0 s: „Install this skill
https://github.com/nextlevelbuilder/…“ napísané do Claude Code).

## Verzie (overené 2026-10-19)

| | Naša kópia (Genjutsu) | Pôvodný repozitár | Vo videu (snímka 14,6 s) |
| --- | --- | --- | --- |
| Verzia | v2.11.1 (zhoda blobov overená Genjutsu 2026-09-08) | v2.15.0 (`skill.json`, posledný commit 56ea9cf z 2026-10-15) | stará webová stránka, príkaz `uipro init --ai windsurf` |
| Štýly | 84 riadkov v `styles.csv` | 88 riadkov, `skill.json` uvádza 79 | 57 |
| Palety | 192 | 192 | 95 |
| Dvojice písiem | 74 | 74 | 56 |
| UX zásady | 99 | 119 | neuvedené |
| Grafy | 25 | 25 | 24 |
| Stacky | 22 | 22 | 8 |
| Inštalácia | nič, číta sa zo súborov | `npm install -g ui-ux-pro-max-cli` a `uipro init --ai claude`, alebo plugin v Claude Code; starý balík `uipro-cli` (2.2.3, 2026-01-29) README označuje za zastaraný | „Tell Claude Code to install it“ |

Synchronizácia na v2.15.0 je podľa `UPSTREAM.md` prepis jadra (`core.py` 464 → 993 riadkov, nový
`reasoning_contract.py`), nie len nové dáta. Teraz ju nerobíme; skripty v kópii aj v pôvodnom repozitári
nesiahajú na sieť (hľadané `urllib`, `requests`, `http`, `socket`, `subprocess`: nič).

## Ako ho spustiť (pasca s `-I`)

`search.py` importuje `core` zo svojho priečinka. `python3 -I search.py …` preto padne
(`ModuleNotFoundError: No module named 'core'`, Python 3.11.15, 2026-10-19), lebo izolovaný režim nepridá
priečinok skriptu do ciest. Ide to takto (z prázdneho priečinka; `-B`, aby Python nezapísal `__pycache__` do
toolboxu, čo sa pri skúške bez neho stalo, overené znova pri zápise do toolboxu 2026-10-19):

```bash
V=toolbox/skills-animacie/genjutsu/skills/_jutsu/ui-ux-pro-max/scripts
python3 -I -B -c "import sys,runpy; v=sys.argv[1]; sys.path.insert(0,v); sys.argv=['search.py']+sys.argv[2:]; runpy.run_path(v+'/search.py', run_name='__main__')" \
  "$V" "head spa scalp ritual wellness calm premium" --design-system -p "HEAD SPA 30" -f markdown
python3 -I -B -c "…to isté…" "$V" "animation scroll reveal" --domain ux      # UX zásady k téme
```

`--persist` zapisuje `design-system/MASTER.md` do aktuálneho priečinka: v repozitári webu nie.

## Čo dal na naše weby (skúška 2026-10-19)

| Dopyt | Návrh | Proti našim pravidlám |
| --- | --- | --- |
| HEAD SPA 30 („head spa scalp ritual wellness calm premium“) | štýl Soft UI Evolution, ružová #EC4899, levanduľová, akcent fialová #8B5CF6, písma Lora a Raleway cez `@import` z Google Fonts | web je orech so zlatou, písma Lora a Manrope vyrezané v `assets/fonts/` (`CLAUDE.md`); fialový akcent patrí k „AI slop“ (čierna listina gstacku: fialovo-modré gradienty, `toolbox/skills-z-praxe/tim-roly/references/gstack.md`); `@import` z cudzieho servera brzdí prvý obraz (`toolbox/skills-z-praxe/rychly-web/SKILL.md`, časť 3) |
| Barbershop 30 („barbershop men grooming dark premium local“) | štýl Liquid Glass s `backdrop-filter`, sám uvádza „Performance: ⚠ Moderate-Poor“, písmo Inter pre „Developer tools, fintech“ | žiadny `backdrop-filter` na telefóne (`rychly-web`, časť 5; `CLAUDE.md`), vlastné písma značky |
| „animation scroll reveal“ v doméne ux | `scroll-behavior: smooth` pre kotvy, nekonečné animácie len pri načítavaní, žiadne vodorovné pretečenie | sedí; nekonečný pás na Barbershope máme vedome a mimo obrazovky stojí |

Záver: „myslí ako senior dizajnér“ je tvrdenie autora videa. Generátor hľadá kľúčové slová v CSV a značku,
fotky ani pravidlá projektu nepozná. Hodnotu má ako **kontrolný zoznam a zdroj protiargumentov**, nie ako
rozhodnutie o farbách, písmach či štýle.

## Čo z neho berieme

- Kontroly pred odovzdaním: kontrast textu 4,5:1, ciele dotyku 44×44 px, viditeľný focus, `alt`, popisky polí,
  `prefers-reduced-motion`, mikro odozva 150 až 300 ms, animovať `transform` a `opacity`, rezervované miesto pre
  obsah (CLS), text 16 px na telefóne, riadok 65 až 75 znakov (`SKILL.md` podskillu, Quick Reference).
- Zoznam „Avoid“ pri každom štýle ako otázky do revízie dizajnu (`toolbox/skills-z-praxe/tim-roly/`, rola dizajnér 0 až 10).
- Pri novom webe bez značky: tri návrhy smeru ako podklad pre otázky majiteľovi, nikdy ako hotové rozhodnutie.

## Čo nie

- Palety, písma a štýly z generátora bez majiteľa a bez porovnania s fotkami prevádzky.
- Google Fonts cez `@import` alebo `<link>` na cudzí server (máme vlastné vyrezané písma).
- Liquid Glass, `backdrop-filter`, neónové prechody na telefóne.
- Inštalácia cez `uipro init` alebo príkaz „Install this skill <odkaz>“ do Claude Code: skill je spustiteľná
  konfigurácia (`toolbox/skills-z-praxe/tim-roly/SKILL.md`, zásada 8); kópiu máme prečítanú a s licenciou.
