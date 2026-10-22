# Skladač náhľadu: zapnutie skúšobného režimu prihlášky (`data-skuska`)

Atribút `data-skuska` **nikdy nie je v `barbershop-30/index.html` v strome** (stráži
`node barbershop-30/source/tools/vernost-skuska-test.mjs`, prvá kontrola). Pridáva ho výhradne skladač náhľadu do
svojej kópie `index.html` (artefakt pre majiteľa). V skúške sa sekcia „Vernostná kartička“, pätička aj okno prihlášky
ukážu so štítkom „SKÚŠKA“, `fetch` sa nevolá, do úložiska sa nič nezapíše a namiesto kartičky je statická ukážka.

Cieľová značka v strome (commit 72d9537 a ďalšie, `barbershop-30/index.html`):

```html
<script src="assets/vernost.js" data-prevadzka="barbershop" defer></script>
```

## sed (na kópii v priečinku náhľadu, nie v strome)

```sh
sed -i 's#<script src="assets/vernost.js" data-prevadzka="barbershop" defer></script>#<script src="assets/vernost.js" data-prevadzka="barbershop" data-skuska defer></script>#' "$NAHLAD/index.html"
```

## python (rovnaký výsledok, s kontrolou, že značka je práve raz)

```python
from pathlib import Path
p = Path(NAHLAD) / 'index.html'
s = p.read_text(encoding='utf-8')
z = '<script src="assets/vernost.js" data-prevadzka="barbershop" defer></script>'
assert s.count(z) == 1, 'značka prihlášky musí byť v index.html práve raz'
p.write_text(s.replace(z, z.replace(' defer>', ' data-skuska defer>')), encoding='utf-8')
```

## Kontrola po zložení

```sh
grep -c 'data-skuska' "$NAHLAD/index.html"                       # 1 (náhľad)
grep -c 'data-skuska' barbershop-30/index.html                   # 0 (strom)
cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js     # bez výstupu (kópia zhodná)
```

Náhľad nesmie dostať `data-zapnute` (to dopĺňa len `tools/vernost-priprav.py` v nasadení po overení servera).
Poznámka pre majiteľa: okno prihlášky a ukážka kartičky sú zámerne tmavé v značke Barbershopu
(`REVIZIA-PO-SKEPTIKOVI.md`, bod 5); farby sa v tejto dávke nemenili.
