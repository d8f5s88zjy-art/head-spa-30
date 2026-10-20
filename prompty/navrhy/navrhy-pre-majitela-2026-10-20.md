# Návrhy pre majiteľa z referencie 20 (nocode.joshua, „7 typov agentov v Claude“)

Stav 2026-10-20. Redaktor toolboxu zapísal záznam 20 a doplnky skills; tieto body ostali mimo toolboxu, lebo menia
pravidlá, ktoré dal majiteľ (`CLAUDE.md`), alebo predpokladajú rozhodnutie, ktoré ešte nepadlo. `CLAUDE.md` sa nemenil.

## 1. Otázka D1: push do `main` so súhlasom majiteľa?

```
D1 · Má push do main (nasadenie webu HEAD SPA 30) čakať na tvoj súhlas?
O čom to je: CLAUDE.md dnes opisuje nasadenie bez súhlasu (vetva → merge do main → push). Skill head-spa-30 pritom
hovorí „Zverejnenie (push na main) len so súhlasom majiteľa“. Push do main nasadí GitHub Pages a keď v GitHube
pribudnú FTP údaje, nahrá web aj na headspa30.sk, vrátane vernostnej kartičky (.github/workflows/ftp.yml).
Čo sa pokazí pri zlej voľbe: bez súhlasu sa môže dostať naživo nehotová alebo neskontrolovaná zmena. So súhlasom
čakáš na odpoveď pri každej drobnosti.
Odporúčanie: B, lebo je zhodné so skillom head-spa-30 a drobnosti sa dajú poslať naraz.
A) Nasadzovať bez súhlasu ako doteraz. Plus: rýchle. Mínus: rozpor so skillom head-spa-30; chyby naživo (GYM KLUB
   2026-10: 25 potvrdených nálezov sa našlo až po nasadení).
B) Push do main až po kontrole a tvojom „áno“ (odporúčané). Plus: nič neskontrolované naživo. Mínus: jedna správa
   navyše.
C) Bez súhlasu len texty a ceny zosúladené s Booqme, inak so súhlasom. Plus: drobnosti idú hneď. Mínus: hranicu
   treba posudzovať.
Úplnosť: A=6/10, B=10/10, C=8/10
```

### Kde je dnes v toolboxe „súhlas majiteľa pred pushom do main“ zapísaný len ako návrh (čaká na D1)

- `toolbox/skills-z-praxe/workflowy/SKILL.md`: „Kedy workflow netreba“ (bod Push, merge do `main` a nasadenie),
  pravidlo P7, kontrolný zoznam (posledný bod).
- `toolbox/skills-z-praxe/tim-roly/SKILL.md`: časť „Schválenia majiteľa“, skupina Zverejnenie, prvý bod.
- `toolbox/README.md`: časť „Kam patrí požiadavka“, stĺpec „Kto schvaľuje“ (riadky HEAD SPA 30 web, Barbershop 30,
  GYM KLUB obsah, nový skill), označené „návrh (D1)“.

Ak majiteľ zvolí B alebo C, tieto miesta sa prepíšu na platné pravidlo a doplní sa `CLAUDE.md` (bod 2). Ak zvolí A,
odseky „návrh (D1)“ sa z toolboxu vypustia a v `head-spa-30/SKILL.md` sa veta o súhlase zosúladí s `CLAUDE.md`.

## 2. Doplnky do `CLAUDE.md` (len so súhlasom majiteľa, všetky naraz)

1. **„Postup nasadenia“**, medzi krok 1 a 2 (len pri voľbe B alebo C):
   ```
   1a. Pred merge do `main`: kontrola (testy, `node tools/booqme-kontrola.mjs`, snímka telefón a počítač) a súhlas
       majiteľa. Push do `main` nasadí GitHub Pages a pri nastavených FTP tajomstvách aj headspa30.sk vrátane
       `vernost/` (`.github/workflows/ftp.yml`).
   ```
2. **„O čom to je“**, na koniec časti (odkaz, nie zmena pravidiel):
   ```
   - V repozitári sú aj iné projekty (`barbershop-30/`, `zentury/`, `visionary-living/`, `stavebniny-richtarik/`,
     `vernost/`) s vlastnými pravidlami v README svojho priečinka. Kam patrí požiadavka: `toolbox/README.md`,
     časť „Kam patrí požiadavka“.
   ```
   Pôvodný návrh z konceptu („pravidlá obsahu nižšie sa ich netýkajú“) hlavný agent neprijal ako príliš široký:
   napríklad commity po slovensku bez podpisov a bez zmienky o AI platia pre celý repozitár. Preto je tu len odkaz
   bez vety o neplatnosti pravidiel.
3. **„Nástroje“**, nový riadok:
   ```
   - Pred čímkoľvek, čo sa týka peňazí, klientov alebo zverejnenia: `toolbox/skills-z-praxe/tim-roly/SKILL.md`,
     časť „Schválenia majiteľa“.
   ```

## 3. Ďalšie rozhodnutia, ktoré čakajú na majiteľa

- **GYM KLUB, zdroj pravdy:** `lipa-gym/` na vetve `claude/subor-idk-fotografie-fitka-5lqm3q`, alebo repozitár
  Lupa-gym (`main`, obsah cez Pages CMS)? Smerovacia tabuľka v `toolbox/README.md` to uvádza ako otázku D1.
- **Recenzie zákazníkov s menom na webe:** zoznam (meno, text, zdroj, dátum) má pred commitom schváliť majiteľ;
  doteraz to v skriptoch ani v denníku nie je zapísané (kontrolný zoznam v `tim-roly`, skupina Klienti a ľudia).
- **Pravidlo `ask` na `Bash(git push *)` a na ukladacie skripty** v nastaveniach projektu: dáva zmysel len po
  rozhodnutí D1 (B alebo C). Pozor: bez spravovaných nastavení a bez prihlásenia Team alebo Enterprise môže
  nainštalovaný mod s udalosťou `tool.check` pravidlá `ask` aj `deny` obísť (code.claude.com/docs/en/permissions,
  stav 2026-10-20); taký mod bez vedomia majiteľa neinštalovať.

## 4. Čo z konceptu `navrh-skills.md` ostalo nezapísané (nie je to otázka pre majiteľa, len evidencia)

- B2: kostra formátu „číslovaná vysvetľovačka“ do `youtube-shorts/references/sablony.md` (časť 13) s návrhmi pre
  HEAD SPA 30, Barbershop 30 a GYM KLUB; v skills je zatiaľ len tabuľkový riadok formátu a pravidlá v „Strih a obraz“.
- G2: skript na meranie zmien karty (`youtube-shorts/scripts/zmeny_karty.py`); metóda je opísaná v `SKILL.md`,
  časť „Rozbor cudzieho shortu“, skript je v `referencie/v20/analyza/priloha-a.py`.
- G3: odsek o repozitári Lupa-gym a vetve `redizajn-2026-10` do `toolbox/gym-klub/README.md`; informácia je zatiaľ
  len v smerovacej tabuľke `toolbox/README.md`.
- A2: šablóna `workflowy/priklady/stavba-s-hodnotitelom.js`; kostra vzoru 9 prešla skúškou so skúšobnými agentmi
  (`referencie/v20/test-vzor9.mjs`, 7 prípadov), šablóna so zadaniami a schémami sa pridá po rovnakej skúške ako
  pri vzoroch 7 a 8.
