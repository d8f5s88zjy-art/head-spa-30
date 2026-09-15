# Darčekové poukazy · päť návrhov

Pre HEAD SPA 30 aj pre SALÓN 30. Rovnaká rodina: tie isté písma (Fraunces, Manrope,
JetBrains Mono), tá istá značka, tá istá kresba vody ako na webe. Formát A6 na šírku,
148 × 105 mm, líce a rub.

Začnite hárkami `00_prehlad-headspa.jpg` a `00_prehlad-salon30.jpg`.

## Návrh 1 · Signature
Lakovaná tmavá so zlatým dvojitým rámom a rohovými uholníkmi, hodnota veľkým Fraunces,
vpravo rytina misy s vodou. Najbližšie k webu, najistejšia voľba.

## Návrh 2 · Zlatý pás
Tmavé líce a pravá tretina ako zlatá fólia, hodnota je do nej vysadená tmavým písmom.
Najluxusnejšie pôsobí v ruke, na tlači vyzerá najlepšie so zlatou razbou alebo
metalickým papierom.

## Návrh 3 · Krémový editoriál
Papier a atrament, zlato len ako linka a dôraz. Najlacnejšia tlač, najlepšia čitateľnosť,
dobre sa naň píše rukou. V tmavom Instagrame svieti.

## Návrh 4 · Rytina
Certifikát: vodná giloš v strede, pečať, všetko na stred. Pôsobí najhodnotnejšie
a najhoršie sa napodobňuje, čiže najbezpečnejší proti kopírovaniu.

## Návrh 5 · S útržkom
Poukaz plus krémový útržok vpravo, ktorý si salón po uplatnení odtrhne a nechá.
Na útržku je hodnota, kód, dátum uplatnenia a podpis. Najpraktickejší do prevádzky,
lebo eviduje sám seba.

## Rub
Všetky návrhy majú rub v rovnakom systéme: polia Pre koho, Od koho, Venovanie,
Kód poukazu a Platí do, tri kroky ako poukaz uplatniť, QR kód priamo na rezerváciu
cez Booqme, adresa, otváracie hodiny a štyri fakty o prevádzke.
Rub je tmavý pri návrhoch 1, 2 a 4 a krémový pri návrhoch 3 a 5, nech ladí s lícom.

## Čo je v balíku

- **00_prehlad-*.jpg** päť návrhov vedľa seba, zvlášť Head Spa a zvlášť Salón 30
- **01_fotky** produktové zábery každého návrhu na web, Instagram a e-mail
- **02_tlac** PDF 154 × 111 mm, čiže A6 so spadávkou 3 mm, strana 1 líce a strana 2 rub.
  `poukazy-vsetky-navrhy.pdf` má všetkých desať poukazov za sebou
- **03_obrazky** JPG 1748 × 1240 px, čo je 300 dpi pri A6, na e-mail alebo do Booqme

## Hodnoty na ukážkach

Head Spa 30 má na ukážke 100 €, Salón 30 má 50 €. Vybraný návrh sa vygeneruje
pre všetky hodnoty naraz: 50, 70, 100, 149 a 249 € pre Head Spa a hodnoty, ktoré
si salón určí, pre kaderníctvo.

## Na potvrdenie

Dve vety nie sú nikde na webe, navrhol som ich a treba ich potvrdiť alebo zmeniť:
„Nie je vymeniteľný za hotovosť.“ a „Termín si prosím rezervuj vopred.“
Platnosť sa vypisuje rukou do políčka **Platí do**.

## Tlač

Papier 300 až 350 g, matný. Návrh 2 vynikne so zlatou razbou, návrh 4 s reliéfnou
razbou rámu. Návrhy 3 a 5 sú najlacnejšie na tlač. Pri celoplošnej tmavej ploche
(návrhy 1, 2, 4, 5) sa oplatí matné laminovanie, inak sa na tmavej farbe robia odtlačky.

## Ako to spustiť z tohto priečinka

```
node navrhy.mjs     # zostaví navrhy.html (20 kariet) a tlac.html
node shoot2.mjs     # PNG 1748 × 1240 do out/
node print2.mjs     # PDF so spadávkou do tlac/
python3 fotky2.py   # produktové zábery do fotky/
```

Návrhy, značky, hodnoty aj texty sú v `navrhy.mjs` v objekte `ZNACKY` a v `NAVRHY`.
Písma sa berú z `assets/fonts`. Vygenerované súbory (`navrhy.html`, `tlac.html`,
`out`, `tlac`, `fotky`) sa do repozitára neukladajú.
