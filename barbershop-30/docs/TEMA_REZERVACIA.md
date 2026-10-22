# Vzhľad nového webu na rezervácii www.barbershop30.sk/rezervacia

Cieľ zadávateľa (2026‑10‑22): keď zákazník otvorí https://www.barbershop30.sk/rezervacia, stránka má vyzerať ako nový
web Barbershop 30, ale fungovať úplne rovnako. Preto sa nemení ich systém, len sa k nemu pridá štýl
`assets/tema-rezervacia.css` (farby, písmo Fraunces a Manrope, tlačidlá, karty služieb a barberov, tmavý kalendár,
zreteľné polia formulára). Kroky, kalendár, odoslanie rezervácie, e‑maily aj potvrdenie ostávajú ich.

Rezervačný systém nie je náš (Laravel a Vue, šablóna Murdock); štýl musí vložiť ten, kto spravuje web barbershop30.sk.

## Čo má urobiť správca webu barbershop30.sk (jeden riadok)

V hlavičke stránky rezervácie (alebo celého webu) **za** riadok s ich štýlom:

```html
<link rel="stylesheet" href="css/app.css?ver=1">
<link rel="stylesheet" href="https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/assets/tema-rezervacia.css">
```

Adresa funguje po nasadení webu do `main`. Ak nechce odkaz na cudziu adresu, skopíruje si na svoj hosting
`tema-rezervacia.css` do `css/` a písma `assets/fonts/Fraunces-500.woff2`, `Fraunces-500i.woff2`, `Fraunces-800.woff2`,
`Manrope-400.woff2`, `Manrope-600.woff2`, `Manrope-700.woff2` do `css/fonts/`, a odkáže na `css/tema-rezervacia.css`.
Odobrať sa dá zmazaním toho riadku, nič iné sa nemení.

## Kontrola

- `node source/tools/tema-nahlad.mjs`: stiahne verejnú stránku a jej skripty, spustí ju lokálne so skúšobným
  kalendárom (do ich systému nejde nič, makeOrder odmietne) a uloží snímky pred a po do
  `docs/screenshots/tema-rezervacia/` (telefón 390 px a počítač 1440 px, kroky služba, pracovník, deň a čas, údaje).
- Po vložení na ich web: prejsť rezerváciu naostro až po formulár (bez odoslania), na telefóne aj počítači; skúšobnú
  rezerváciu odoslať len s ich súhlasom a hneď ju zrušiť.

## Čo štýl robí a čo nie

- Mení: pozadie a farby (atrament, papier, oranžová lampa), písma, tlačidlá (verzálky, polomer 6 px), karty služieb
  a barberov s rámikom a zvýraznením výberu, kalendár (vybraný deň oranžový, dnešný s obrysom), časy ako tlačidlá,
  polia formulára ako zreteľné okienka, hlavičku a pätičku.
- Nemení: texty, poradie krokov, služby a ceny (ich systém), správanie formulára a overenie údajov.
- Číslice v nadpisoch sú v Manrope (vo Fraunces vyzerá malá „3“ ako „5“, napr. „3. Vyberte termín“).
- Keď ich systém zmení šablónu alebo triedy, štýl sa môže čiastočne neuplatniť; preto po každej ich zmene
  `tema-nahlad.mjs`.
