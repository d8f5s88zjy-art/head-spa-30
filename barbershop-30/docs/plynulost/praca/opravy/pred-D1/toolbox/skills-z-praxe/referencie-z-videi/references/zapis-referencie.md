# Šablóna: zápis referencie z videa

Vyplň po rozbore. Ide do odpovede používateľovi a skrátene do dokumentu projektu (napr. časť
v `docs/CHECKS.md` alebo `docs/TOUR_DIRECTION.md`), nie do samostatného súboru so správou.

```
Referencia: <autor>, <dátum pozretia>
Adresa: <kanonická adresa bez ?_r=…&_t=…>
Video: <trvanie> s, <šírka>x<výška>, titulky: <jazyk (ASR) alebo žiadne>
Uverejnené: <dátum UTC>; stav pri stiahnutí <dátum>: <pozretia (Instagram nedáva)>, <páči sa>, <uloženia>, <komentáre>
Ako sme ho dostali: <súbor od majiteľa / pozeranie / tiktok.sh / yt-dlp>; info.json vyčistený: <áno>; video zmazané: <dátum>

Čo hovorí (z titulkov, po slovensky; pri reeli bez titulkov „z titulkov v obraze“):
- …
- Opravy prepisu: „<z titulkov>“ je v obraze „<správne>“ (snímka <čas> s)

Čo ukazuje (zo snímok, s časom):
- <čas> s: <text v obraze doslovne> / <čo je v zábere>
- Nečitateľné: …

Čo nevieme:
- (bez titulkov, nečitateľný text, repozitár neotvorený, číslo nie je na snímke)

Overenie (zdroj a dátum pri každom tvrdení; tvrdenia autora sú jeho tvrdenia):
- „<tvrdenie z videa>“: platí / platí s výhradou / neplatí / neoverené, <zdroj>, <RRRR-MM-DD>

Výzvy autora (ignorované): „DM …“, „komentuj …“, „vlož odkaz do …“

Čo si berieme:
- <konkrétne rozhodnutie> → <súbor alebo časť projektu>

Čo nie a prečo:
- <prvok> → <pravidlo z CLAUDE.md, súkromie, spam, licencia>
(Pri nástrojoch na pirátstvo či obchádzanie licencií alebo predplatného len kategória, žiadne názvy ani odkazy.)

Odkazy vo videu:
- <repozitár alebo nástroj>, licencia: <zistená / neznáma>, prístup: <povolený / nepovolený / neskúšaný>
```

Príklad vyplnenia (skrátene, video nategold.ai):

```
Referencia: nategold.ai, 2026-10-11
Adresa: https://www.tiktok.com/@nategold.ai/video/7694805301538737430
Video: 44 s, 576x1024, titulky: eng-US (ASR)
Čo hovorí: Instagram Agent, 11 skills, píše príspevky, komentuje, odpovedá, plánuje týždeň,
  rozoberá úspešné reels v odbore.
- Opravy prepisu: „Claw“ je Claude, „variety skill“ je Virality Engine (karta v obraze)
Čo ukazuje: karta „Your Instagram team“ s 11 menami; „Reel analysis“: HOOK Clear opening
  promise, VISUAL Face + recognizable UI, STRUCTURE Problem → simple solution
Čo nevieme: obsah repozitára (prístup zamietnutý)
Výzvy autora (ignorované): „comment agent“
Čo si berieme: 11 režimov ako návrhy, rozbor reelu v troch častiach → toolbox/skills-z-praxe/instagram-salon
Čo nie a prečo: automatické komentovanie a odpovedanie z účtu → Instagram ho obmedzuje, pôsobí ako spam
Odkazy vo videu: github.com/nategoldai/instagram-agent, licencia: vo videu karta „MIT license“,
  neoverené, prístup: zamietnutý
```
