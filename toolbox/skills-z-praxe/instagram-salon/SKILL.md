---
name: instagram-salon
description: Návrhy pre Instagram salónu alebo malého podniku (Barbershop 30, HEAD SPA 30, barbershop, head spa, kaderníctvo, kozmetika): príspevok (post), popis, úvodná veta (hook), scenár reelu (reels), odpovede na komentáre, bio profilu, týždenný plán obsahu (content plan), mriežka profilu (grid), rozbor cudzích reels (virality, trend), zapájanie (engagement). Použi, keď majiteľ chce text, plán alebo nápad na Instagram či Stories. Skill len navrhuje, uverejňuje a komentuje majiteľ sám. Fakty len zo zdrojov podniku.
---

# Instagram pre salón

Jedenásť režimov, ktoré pripravujú **návrhy** pre Instagram podniku: texty, scenáre, odpovede
a plány. Uverejňuje, komentuje a odpovedá majiteľ sám zo svojho účtu.

Pôvod: video nategold.ai „Instagram Agent“ (TikTok, 44 s, pozreté 2026-10-11) ukazuje 11 skills
s týmito menami. Pôvodný repozitár `github.com/nategoldai/instagram-agent` sa nepodarilo otvoriť,
nič z neho tu nie je. Skill je náš vlastný, postavený len na tom, čo video hovorí a ukazuje
(`references/zdroj-video.md`), a na faktoch z tohto repozitára.

## Kedy použiť

- „Napíš príspevok na Instagram“, „čo dať tento týždeň na Insta“, „scenár na reel“.
- Majiteľ pošle komentár alebo správu a chce odpoveď.
- Majiteľ pošle odkaz alebo snímky cudzieho reelu a chce vedieť, prečo funguje a ako to spraviť po svojom.
- Úprava bio, názvu profilu alebo zvýraznených Stories.

Nepoužívaj na automatické uverejňovanie, komentovanie ani prihlasovanie do účtu.

## Zásady, ktoré platia vo všetkých režimoch

1. **Len návrhy.** Automatické komentovanie a odpovedanie z účtu Instagram obmedzuje (riziko
   obmedzenia účtu) a pôsobí ako spam. Výstup je text na schválenie; klikne majiteľ.
2. **Fakty len zo zdrojov podniku**, prečítaných v ten deň, nie z pamäti. Ceny, trvania a hodiny
   sa menia, preto ich tento skill neobsahuje; hovorí, kde sú (`references/fakty-*.md`). Čo nie je
   v zdroji, vynechaj alebo sa spýtaj.
3. **Hlas:** slovenčina, tykanie, krátko (myšlienka na jeden až dva riadky), bez pomlčky em dash.
   **Nikdy nespomínaj AI** v texte príspevku, odpovede ani bio.
4. **Ľudia v zábere:** zamestnanci len so súhlasom, klienti nerozpoznateľní (zozadu, z profilu
   v diaľke) alebo so súhlasom, deti len so súhlasom rodičov.
5. **Žiadne sľuby výsledkov.** Ani dosah, ani „virálne“, ani zdravotné účinky, ktoré nie sú na webe.

## Krok 0: ktorý podnik a jeho zdroje

| Podnik | Instagram | Zdroje faktov | Čo smieš tvrdiť |
| --- | --- | --- | --- |
| Barbershop 30 | https://www.instagram.com/barbershop30_nitra/ | `barbershop-30/docs/CONTENT_SOURCES.md`, `barbershop-30/index.html` | `references/fakty-barbershop-30.md` |
| HEAD SPA 30 | https://www.instagram.com/headspa.salon30/ | `CLAUDE.md`, `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv`, `index.html` | `references/fakty-head-spa-30.md` |
| iný podnik | od majiteľa | najprv založ zoznam zdrojov so stupňami overenia ako `CONTENT_SOURCES.md` | nový `references/fakty-<podnik>.md` podľa vzoru |

Barbershop 30 a HEAD SPA 30 sú dve samostatné značky s vlastnými zdrojmi. Nespájaj ich v jednom
príspevku, kým to majiteľ výslovne nepotvrdí: vzťah Barbershop 30 k Salónu 30 je v `CONTENT_SOURCES.md`
vedený ako neoverený a `CLAUDE.md` zakazuje písať „Barber shop 30“ ako názov HEAD SPA 30.

## Jedenásť režimov

Mená sú z videa; čo presne režim u nás robí, je náš výklad (video väčšinu z nich len menuje).

| # | Režim | Čo od majiteľa potrebuješ | Čo odovzdáš | Šablóna |
| --- | --- | --- | --- | --- |
| 1 | Post Writer | téma, fotka alebo video (opis, čo na nich je) | 2 až 3 varianty popisu s úvodnou vetou | `sablona-prispevok.md` |
| 2 | Comment Drafter | odkaz alebo snímka cudzieho príspevku | návrh komentára, ktorý majiteľ napíše sám | `sablona-odpovede.md` |
| 3 | Reply Handler | text komentárov alebo správ | odpoveď podľa typu (pochvala, cena, sťažnosť, iné) | `sablona-odpovede.md` |
| 4 | Profile Optimizer | snímka profilu | názov, bio, odkaz, témy zvýraznených Stories | `sablona-bio.md` |
| 5 | Content Planner | čo sa v týždni deje, aký materiál je | plán Po až Ne: čo, kedy, s kým | `sablona-tyzden.md` |
| 6 | Virality Engine | odkazy alebo snímky úspešných reels v odbore | rozbor (úvod, obraz, stavba) a vlastný scenár | `sablona-rozbor-reelu.md` |
| 7 | Hook Extractor | odkazy, titulky, staré príspevky podniku | úvodné vety a ich vzorce, prepísané na fakty podniku | `sablona-prispevok.md` |
| 8 | Reel Scripter | téma, čo vie natočiť | scenár v troch vetách so zábermi | `sablona-reel.md` |
| 9 | Grid Planner | snímka mriežky profilu alebo zoznam fotiek | poradie ďalších príspevkov, aby mriežka držala štýl | `sablona-tyzden.md` |
| 10 | Trend Watcher | odkazy na TikTok alebo reels, ktoré majiteľ videl | čo je trend, či sedí na podnik, návrh vlastnej verzie | `sablona-rozbor-reelu.md` |
| 11 | Engagement Loop | čo sa za týždeň stalo na účte (komentáre, správy, označenia, čísla) | zoznam: komu odpovedať, komu poďakovať, čo zopakovať | `sablona-tyzden.md` |

Šablóny sú v `references/`.

### Poznámky k režimom

- **Post Writer a Hook Extractor.** Video ukazuje návrh príspevku so štítkom „Proven hook formulas“.
  Vzorce berieme z vlastných overených textov webu (napr. sľub „Vypni hlavu.“, obraz miesta
  „Vzadu ťa čaká káva.“, otázka „Kedy si sadneš?“, premena „Vstúpiš s hlavou plnou chaosu.
  Odídeš s čistou hlavou.“). Cudzie úvodné vety len ako vzorec, nikdy doslovne.
- **Comment Drafter.** Komentár k cudziemu príspevku je konkrétny k tomu príspevku, bez reklamy
  a bez odkazu. Píše ho majiteľ ručne a len tam, kde chce.
- **Reply Handler.** Sťažnosť sa rieši pokojne a mimo komentárov: telefón zo zdroja faktov. Cenu
  uvádzaj len overenú v ten deň, inak odkáž na rezerváciu, kde je aktuálna.
- **Profile Optimizer.** Bio obsahuje len overené fakty a jednu výzvu s odkazom na rezerváciu.
- **Content Planner.** Video ukazuje týždeň Po reel, Ut príspevok, St story, Št reel, Pi príspevok,
  So story, Ne bez príspevku. Ber to ako východisko, nie ako pravidlo; čas uverejnenia navrhni
  podľa čísel, ktoré majiteľ vidí vo svojich štatistikách, nie podľa odhadu.
- **Virality Engine a Trend Watcher.** Pracujú s tým, čo majiteľ dodá: odkaz na TikTok spracuj
  skillom `../referencie-z-videi/` (skript `scripts/tiktok.sh`), pri Instagrame si vypýtaj snímky
  alebo nahrávku obrazovky. Do účtu sa neprihlasuj. Sťahovanie z odkazu na Instagram sme neoverili.
- **Grid Planner.** Štýl mriežky drží vizuál webu: Barbershop 30 podľa `barbershop-30/docs/ART_DIRECTION.md`
  (uhoľná čierna, teplá biela, jediný akcent oranžová lámp, písma Fraunces a Manrope), HEAD SPA 30
  podľa `CLAUDE.md` (tóny orecha so zlatou, Lora a Manrope, skutočné fotky bez tónovania)
  a zoznamu záberov `docs/fotenie.md`.
- **Engagement Loop.** Raz za týždeň zhrň, čo čaká na odpoveď (režim 3), kto podnik označil
  (poďakovanie), komu chce majiteľ napísať komentár (režim 2) a čo sa podľa jeho čísel osvedčilo.

## Rozbor reelu a scenár v troch vetách

Z videa (karta „Reel analysis“), preložené a prispôsobené salónu:

| Časť | Vo videu | U nás |
| --- | --- | --- |
| Úvod (HOOK) | Clear opening promise | prvá veta je jasný sľub |
| Obraz (VISUAL) | Face + recognizable UI | tvár (kto hovorí, so súhlasom) a rozpoznateľné miesto (dvere, sála, kreslo) |
| Stavba (STRUCTURE) | Problem → simple solution | problém zákazníka a jednoduché riešenie v podniku |

Scenár z videa (karta „Reel script“) má tri riadky: 00 úvod, 01 čo to je, 02 ako to nastaviť.
U nás: **00 sľub, 01 čo dostaneš, 02 ako si rezervuješ.** Príklad z overených faktov Barbershop 30:

```
00  Vzadu ťa čaká káva zdarma.        (čakáreň: kreslá, retro pumpa)
01  Osem kresiel, jedno je tvoje.     (sála pod oranžovými lampami)
02  Rezervuj online 24/7.             (rohožka s logom, dvere na Mostnej 30)
```

Zdroj: `CONTENT_SOURCES.md` (kapacita, káva vzadu v čakárni podľa majiteľa 2026-10-11, online
rezervácie 24/7). Príklad pre HEAD SPA 30 je v `references/sablona-reel.md`.

## Postup krok za krokom

1. **Podnik a režim.** Zisti, pre koho a čo (tabuľky vyššie). Pri inom podniku najprv zdroje faktov.
2. **Zdroje.** Prečítaj aktuálne zdrojové súbory a `references/fakty-<podnik>.md`. Pri HEAD SPA 30
   platí online kalendár Booqme; ak majiteľ hlási zmenu, web sa najprv zosúladí
   (`node tools/booqme-kontrola.mjs` musí hlásiť, že kalendár sedí, pozri `../booqme-rezervacie/`).
3. **Materiál.** Vypýtaj si, čo majiteľ naozaj má (fotky, videá, snímky komentárov). Nič nevymýšľaj
   za neho, ani zábery, ktoré nemá.
4. **Návrh.** Podľa šablóny 2 až 3 varianty, každý krátky. Pri reeli tri vety a zábery.
5. **Kontrola faktov.** Ku každej vete s faktom napíš zdroj (súbor a časť). Čo zdroj nemá, vyhoď
   alebo daj do „Treba potvrdiť“.
6. **Kontrola hlasu.** Tykanie, krátko, bez em dash, bez „AI“, bez cien z pamäti, správny názov
   podniku.
7. **Odovzdanie.** Text na skopírovanie, pod ním „Zdroje“ a „Treba potvrdiť“. Nikdy nepíš, že
   je uverejnené.

Príkazy na čítanie zdrojov a kontrolu (spúšťaj z koreňa repozitára):

```bash
# HEAD SPA 30: aktuálne rituály, dĺžky a ceny z docs/booqme-sluzby.csv
python3 -I -c "import csv; [print(r['Kategória'], '|', r['Názov služby'], '|', r['Trvanie (min)'], 'min |', r['Cena (€)'], '€') for r in csv.DictReader(open('docs/booqme-sluzby.csv', encoding='utf-8-sig'), delimiter=';')]"
# Barbershop 30: služby a ceny zo zdroja
sed -n '/^## Služby a ceny/,/^## Dôkazy/p' barbershop-30/docs/CONTENT_SOURCES.md
# adresy profilov priamo z webov
grep -o 'https://www.instagram.com/[^"]*' index.html barbershop-30/index.html | sort -u
# návrh: em dash, en dash, „AI“ a názvy na kontrolu (Salón 30 smie byť len ako miesto)
python3 -I -c "import re,sys; t=open(sys.argv[1],encoding='utf-8').read(); print([m.group() for m in re.finditer(r'[\u2013\u2014]|\bAI\b|[Ss]alón 30|Barber shop 30', t)])" navrh.txt
```

## Pasce a lekcie

| Pasca | Ako sa stala alebo prečo hrozí | Riešenie |
| --- | --- | --- |
| agent komentuje sám | video to ponúka ako hlavnú výhodu | len návrhy; Instagram automatické akcie obmedzuje |
| stará cena v texte | ceny sa menia (HEAD SPA v Booqme, Barbershop v rezervačnom systéme) | cenu len z dnešného zdroja alebo odkaz na rezerváciu |
| káva „pri recepcii“ | skoršia karta webu „Najprv káva“ pri recepcii; majiteľ 2026-10-11 opravil: vzadu v čakárni | opravy majiteľa sa zapisujú s dátumom do zdroja a odtiaľ sa berú |
| vymyslené detaily o barberoch | lákavé pre „osobný“ príspevok | žiadne roky praxe, špecializácie ani ocenenia, len dojem a prístup (`CONTENT_SOURCES.md`, Tím) |
| neoverené tvrdenia | „8 rokov“, plaketa 2024, školenia, vernostná karta | nepoužívať, kým majiteľ nepotvrdí (`CONTENT_SOURCES.md`, Čo ostáva neoverené) |
| číslo hodnotenia | hodnotenia a ocenenia sú od tretích strán | len s odkazom na zdroj a po súhlase majiteľa |
| HEAD SPA 30 pod iným menom | „salón 30“, „Barber shop 30“ | vždy HEAD SPA 30; Salón 30 len ako miesto (v priestoroch Salónu 30) |
| zlatý Head Spa rituál | zámena so Zlatým rituálom 24K | zlatý je len rituál pre chodidlá; strieborný ani zlatý Head Spa rituál neexistuje |
| poukaz na sumu | bežná prax inde | HEAD SPA 30: poukaz vždy na konkrétny rituál, platí 365 dní |
| fúkaná ako rituál | je v kalendári HEAD SPA 30 | fúkaná a žehlenie nie sú rituály a poukaz na ne nie je |
| chybný prepis reči z referencie | titulky TikToku sú automatické („Claw“ namiesto Claude) | rozbor over v obraze, pozri `../referencie-z-videi/` |
| rozpoznateľný klient vo videu | videá z prevádzky | súhlas zamestnancov, klienti zozadu alebo nerozpoznateľní (`CONTENT_SOURCES.md`, Videá od majiteľa) |

## V tomto repozitári

- Fakty Barbershop 30: `barbershop-30/docs/CONTENT_SOURCES.md` (stupne overenia, dátumy, opravy
  majiteľa), texty webu `barbershop-30/index.html`, vizuál `barbershop-30/docs/ART_DIRECTION.md`,
  texty kariet `barbershop-30/docs/TOUR_DIRECTION.md` (časť Cesta).
- Fakty HEAD SPA 30: `CLAUDE.md` (pravidlá obsahu), `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv`,
  `index.html` (texty, otázky a odpovede, štruktúrované dáta s hodinami), `docs/fotenie.md` (zábery
  a pravidlá fotenia), `docs/booqme-opravy.md` (stav profilu v Booqme).
- Učenie z videí: `toolbox/skills-z-praxe/referencie-z-videi/`.
- Šablóny a fakty: `toolbox/skills-z-praxe/instagram-salon/references/`.

## Mimo tohto repozitára

V inom chate (Claude.ai so skillom nahratým ako zip, Claude Code v inom projekte) zdrojové súbory
webov nie sú. Vtedy:

- `references/fakty-*.md` ber ako východisko so stavom k dátumu v nich, nie ako dnešnú pravdu.
- Ceny, hodiny, mená a ponuku si vypýtaj od majiteľa alebo nech vloží aktuálny zdroj (napr. obsah
  `CONTENT_SOURCES.md` alebo snímku cenníka); bez toho ich do návrhu nedávaj.
- Pravidlá (len návrhy, tykanie, bez em dash, bez zmienky o AI, správny názov podniku) platia rovnako.

## Kontrolný zoznam

- [ ] Viem, pre ktorý podnik píšem, a použil som jeho správny názov.
- [ ] Každý fakt má zdroj prečítaný dnes; žiadna cena, trvanie ani hodiny z pamäti.
- [ ] Nič z „nesmieš tvrdiť“ (`references/fakty-*.md`).
- [ ] Tykanie, krátke vety, bez em dash, bez zmienky o AI.
- [ ] Úvodná veta je jasný sľub alebo obraz; výzva hovorí, ako si rezervovať.
- [ ] Pri reeli: tri vety, tvár so súhlasom, rozpoznateľné miesto, problém a jednoduché riešenie.
- [ ] Ľudia v zábere: súhlas, klienti nerozpoznateľní, deti len so súhlasom rodičov.
- [ ] Odpoveď na sťažnosť je pokojná a ponúka telefón; nič sa nerieši verejne.
- [ ] Výstup je návrh so zdrojmi a „Treba potvrdiť“; uverejní ho majiteľ.
