# Všeobecné poukážky: žena, muž, chodidlá

Zadanie salónu (11. 10. 2026): tri poukážky namiesto jednej na každý rituál. Na prvej je len žena,
na druhej muž, tretia je na chodidlá. Tam, kde bolo pole „PRE“, je pole „RITUÁL“ a názov rituálu
do neho salón dopíše.

| Súbor | Vychádza z poukážky salónu | Fotka |
| --- | --- | --- |
| `poukazka-zena.png` | `../salon/hlbkovy-ritual-pre-pokozku-hlavy.png` | žena pri umývaní vlasov pod sprchou |
| `poukazka-muz.png` | `../salon/gentlemen-harmony-ritual.png` | muž pri umývaní vlasov pod sprchou |
| `poukazka-chodidla.png` | `../salon/klasicky-ritual-pre-chodidla.png` | chodidlá vo vodnej miske |

Všetky tri sú v rovnakej podobe (veľká mašľa, popisy polí vedľa okienok), 1290 × 645 px ako poukážky
od salónu.

## Čo sa zmenilo oproti poukážke salónu

- Názov rituálu a dĺžka sú preč, mramor pod nimi je dopočítaný z okolia.
- Veta „Darujte chvíľu pokoja.“ je posunutá do stredu medzi nápis „poukážka“ a riadok polí.
- Pole „PRE:“ je teraz „RITUÁL:“ (písmo Cormorant Garamond SemiBold, rovnaká veľkosť a farba ako
  ostatné popisy), okienko je o šírku dlhšieho popisu kratšie.
- Pole pre obdarovaného už na poukážke nie je, ostali polia OD, PLATNOSŤ DO a KÓD.
- Všetko ostatné (mašľa, nápisy, fotka, rámik, HEADSPA30.SK) je pôvodné od salónu.

## Výroba

```
python3 -I docs/poukazky/vseobecne/vyrob.py          # tri PNG do tohto priečinka
python3 -I docs/poukazky/vseobecne/vyrob.py --tlac   # navyše tlac/*-2580.png (2×, 300 dpi, mimo gitu)
```

Potrebuje Pillow, numpy a OpenCV (`pip install opencv-python-headless`); písmo si pri prvom spustení
stiahne z Google Fonts do `~/.cache/headspa30/`. Súradnice textov sú pevne pre tieto tri zdroje
(`POUKAZKY` v skripte); pri inom zdroji ich treba premerať.

Tlač: poukážky od salónu majú len 1290 px na šírku. Verzia `--tlac` je len zväčšená; na ostrú tlač
treba od salónu zdroj vo vyššom rozlíšení.
