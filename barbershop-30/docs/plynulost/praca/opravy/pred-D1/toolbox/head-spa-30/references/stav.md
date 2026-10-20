# Stav a otvorené úlohy (11. 10. 2026)

## Hotové

- www.headspa30.sk má web z commitu d28e0c0 (kontrola 55/55 HOTOVO): nové ceny podľa Booqme,
  rezervácia do `salon-30-head-spa`, šesť poukážok od salónu, žiadny odkaz na barbershop-30.
- GitHub Pages má rovnaký web; commit 2a50048 zmenil len `docs/` (ďalších sedem poukážok od salónu).
- Obrázky do Booqme: 17 kusov 1600 × 1200 v `docs/poukazky/sablona/booqme/` (13 od salónu, 4 podľa šablóny).

## Otvorené

- Obchod Booqme: vymeniť všetkých 17 obrázkov a zmeniť 13 cien (robí správca salónu; `scripts/booqme-balik.py`).
  Obrázky z 22. 9. sú zo starého návrhu (pätička www.salon30.sk) a dva sú priradené zle
  (Ovocný a bylinkový rituál ukazuje Klasický, Gentlemen Harmony ukazuje Gentlemen Head Spa).
- Štyri poukážky sú ešte zo starej šablóny SALON30 (Head Spa Classic, Gentlemen Head Spa, Little Fruit
  Head Spa, Spoločný Head Spa rituál), kým salón nepošle nové.
- Salón má potvrdiť kroky Signature rituálov (v Booqme sú dva zoznamy) a zablokovať sviatky v kalendári.
- Úpravy profilu Booqme z `docs/booqme-opravy.md` (názov, logo, texty) nie sú urobené.
- Zmeniť heslo do Booqme (bolo zdieľané v správe a v chate).
- Voliteľne: nastaviť FTP tajné premenné vrátane `FTP_DIR` (automatické nahrávanie), zmazať starý `.zip`
  v `/headspa30.sk` na FTP.
