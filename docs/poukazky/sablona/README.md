# Darčekové poukážky podľa šablóny salónu

Poukážky na jednotlivé rituály sú presne pôvodná šablóna salónu (Salon 30 Nitra, fotka Head Spa,
zlatá mašľa a pečať). Mení sa na nich len:

- **názov rituálu** namiesto nápisu HEAD SPA (veľkými písmenami, dlhé názvy na dva riadky),
- **cena** pod názvom namiesto riadku RELAX • OBNOVA • HARMÓNIA,
- **doména v pätičke** HEADSPA30.SK namiesto SALON30NITRA.SK (tá doména neexistuje).

Ceny sú z cenníka na webe, ktorý zodpovedá rezervačnému kalendáru v Booqme. Rovnaké ceny musia
byť aj pri poukazoch v obchode Booqme (`docs/booqme-poukazy.csv`).

## Súbory

- `sablona.png`: pôvodná šablóna (1290 × 648 px, výrez zo screenshotu od salónu)
- `sablona-cista.png`: šablóna bez nápisov, ktoré sa menia (`python3 cisti.py`)
- `poukazka.html`: rozloženie textu na šablóne; písmo Cinzel (ako HEAD SPA v šablóne) a Montserrat
- `ritualy.json`: rituály, riadkovanie názvov, ceny, poradie v obchode Booqme a meno súboru na webe
- `booqme/`: hotové obrázky do obchodu Booqme (16 : 9), číslo v názve = poradie produktu v obchode

## Keď sa zmenia ceny

Z koreňa repozitára:

```
python3 docs/poukazky/sablona/ceny.py      # ceny z index.html do ritualy.json
node docs/poukazky/sablona/vyrob.mjs       # vykreslí poukážky (Playwright a Chromium)
python3 docs/poukazky/sablona/export.py    # booqme/*.jpg a assets/img/poukaz/<rituál>-*.{avif,webp,jpg}
```

Potom nové obrázky z `booqme/` nahrať k príslušným poukazom v obchode Booqme.
Pôvodná šablóna má rozlíšenie len 1290 px na šírku; na tlač vo veľkom formáte treba šablónu
od salónu vo vyššom rozlíšení.
