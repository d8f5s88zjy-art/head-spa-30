# Čo potrebujeme od majiteľa

Krátku verziu pošli majiteľovi ako správu; podrobnosti sú pre toho, kto video skladá.

## Zábery k trom vetám

Ku každej vete scenára jeden až dva zábery, ktoré ju naozaj ukazujú. Čo majiteľ nemá, to sa
nevymýšľa ani negeneruje: napíš to do „Materiál, ktorý treba natočiť“.

| # | Veta | Záber (čo má byť vidieť) | Máme? | Kto je v zábere |
| --- | --- | --- | --- | --- |
| 00 | sľub | rozpoznateľné miesto alebo detail, ktorý sľub dokazuje | | |
| 01 | čo dostaneš | práca, priestor, výsledok (len skutočný) | | |
| 02 | ako si rezervuješ | dvere, vchod, logo, recepcia | | |

## Ako natáčať a fotiť (telefón stačí)

- Na výšku (9 : 16). Video 1080p alebo 4K, 30 snímok/s; 60 snímok/s, ak telefón vie (plynulejší
  pohyb, dá sa spomaliť).
- HDR video radšej vypnúť v nastaveniach fotoaparátu; nástroj HDR prevedie, ale farby treba skontrolovať.
- Každý záber 3 až 6 s, telefón pokojne (oprieť alebo pomalý krok), bez približovania prstami.
- Svetlo ako počas prevádzky, nič netónovať, žiadne filtre ani text v obraze (text pridáme).
- Fotky v plnom rozlíšení; iPhone pri HEIC: poslať ako JPG alebo prepnúť formát na
  „Najkompatibilnejšie“.
- Posielať originály (napr. cez úložisko alebo kábel), nie cez chat, ktorý video zmenší.

## Ľudia v zábere

- Zamestnanci: súhlas s uverejnením na sociálnych sieťach (meno, dátum, kde).
- Klienti: zozadu, z profilu v diaľke alebo so súhlasom; deti len so súhlasom rodičov.
- Do scenára pole `ludia`; nástroj z neho spraví zoznam „Treba potvrdiť“.

## Hlas (voliteľne)

- Nahráva majiteľ alebo niekto z tímu so súhlasom; tichá miestnosť, telefón asi 20 až 30 cm od úst.
- Vety presne podľa scenára, medzi nimi krátka pauza; súbor m4a alebo wav.
- `python3 -I scripts/reel.py --casy-hlasu hlas.m4a` ukáže, kde sú vety, a podľa toho sa nastavia
  dĺžky záberov.
- Syntetický hlas alebo iná platená služba len s výslovným súhlasom a rozpočtom majiteľa
  (v scenári `povod` napr. „služba X, súhlas majiteľa 2026-10-12, rozpočet Y €“).

## Hudba (voliteľne)

- Len s licenciou, ktorú majiteľ vie doložiť (kto ju dal, na aké použitie a platformy, dokedy).
  Do scenára `licencia`.
- Inak video bez hudby a majiteľ pridá hudbu priamo v aplikácii z knižnice, ktorú jeho účet smie
  použiť (firemné účty majú obmedzený výber).

## Fakty

- Čo sa zmenilo od poslednej kontroly zdrojov (ceny, hodiny, služby, tím).
- Potvrdenie vecí vedených ako neoverené (zoznam v `CONTENT_SOURCES.md`, resp. `CLAUDE.md`).

## Uverejnenie

Uverejňuje majiteľ zo svojho účtu. Dostane MP4, titulnú snímku JPG (obálka), SRT a zoznam
„Treba potvrdiť“. Popis príspevku navrhne skill `../instagram-salon/` (režim Post Writer).
