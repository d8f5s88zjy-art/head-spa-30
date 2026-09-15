# HEAD SPA 30 · darčekové poukazy

Navrhnuté podľa webu: tie isté farby, písma (Fraunces, Manrope, JetBrains Mono),
značka, kresba vody a texty. Formát A6 na šírku, 148 × 105 mm.

## Čo je v balíku

**01_fotky** · produktové zábery poukazu na použitie na Instagram, na web alebo do e-mailu
- `foto-1-poukaz.jpg` jeden poukaz zblízka
- `foto-2-lice-a-rub.jpg` líce aj rub vedľa seba
- `foto-3-sada.jpg` všetkých päť hodnôt rozložených
- `foto-4-instagram.jpg` na výšku, 1080 × 1350
- `foto-5-ritual.jpg` poukaz na konkrétny rituál

**02_tlac** · pripravené do tlačiarne, PDF 154 × 111 mm, čiže A6 so spadávkou 3 mm
- `poukaz-50.pdf` … `poukaz-249.pdf` a `poukaz-ritual.pdf`, každý má stranu 1 líce a stranu 2 rub
- `poukaz-vsetky.pdf` všetkých šesť líc a spoločný rub v jednom súbore

**03_obrazky** · PNG 1748 × 1240 px, čo je 300 dpi pri A6. Na e-mail, do Booqme alebo na web.

**04_zdroj** · zdroj, z ktorého sa poukazy generujú (HTML, CSS, písma, QR kód).
Keď sa zmenia ceny alebo texty, prepíše sa `build.mjs` a spustí sa:
`node build.mjs && node shoot.mjs && node print.mjs && python3 fotky.py`.

## Hodnoty

50 €, 70 €, 100 €, 149 €, 249 € a poukaz na konkrétny rituál. Sú to tie isté
hodnoty ako na webe: najnižšia pokryje najlacnejší rituál, najvyššia aj ten
najdrahší (Zlatý Head Spa rituál 24K pre dvoch za 249 €).

## Rub poukazu

Miesto na vypísanie: pre koho, od koho, venovanie, kód poukazu a platnosť.
Ďalej tri kroky, ako poukaz uplatniť, QR kód priamo na rezerváciu cez Booqme,
adresa a otváracie hodiny (Po až Pi 9.00 – 18.00, So 9.00 – 15.00).

## Dve vety na potvrdenie

Na weboch to nikde nebolo, takže som ich navrhol a treba ich potvrdiť alebo zmeniť
v súbore `04_zdroj/build.mjs`:

1. „Pri drahšom rituáli sa rozdiel dopláca v salóne.“ (na líci poukazov na hodnotu)
2. „Nie je vymeniteľný za hotovosť.“ (v podmienkach na rube)

Platnosť poukazu sa vypisuje rukou do políčka **Platí do**, aby si ju salón určil sám.

## Tlač

Odporúčaný papier 300 až 350 g, matný. Zlatá a krémová vyzerajú dobre aj na
obyčajnej digitálnej tlači, pri väčšej sérii sa oplatí matné laminovanie.
Poukazy vyzerajú dobre aj ako samotné PDF poslané e-mailom, vtedy sa netlačí nič.

## Ako to spustiť z tohto priečinka

```
node build.mjs      # zostaví poukaz.html zo zoznamu variantov
node shoot.mjs      # PNG 1748 × 1240 do out/
node print.mjs      # PDF so spadávkou do tlac/
python3 fotky.py    # produktové zábery do fotky/
```

Písma sa berú z `assets/fonts` toho istého repozitára, QR kód je v `qr.png`
a smeruje na rezerváciu cez Booqme. Priečinky `out`, `tlac` a `fotky` sa
negenerujú do repozitára, vznikajú až pri spustení.
