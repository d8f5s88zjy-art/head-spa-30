# Darčekové poukážky: ako vznikajú a kam idú

## Pravidlá od salónu

- Poukaz je vždy na konkrétny rituál, nie na sumu.
- Salón chce poukážky presne podľa svojej šablóny alebo vlastného návrhu; mení sa len rituál
  (a cena alebo dĺžka).
- Všetkých 17 poukazov sa predáva len v obchode Booqme. Na webe je vzor salónu a šesť ukážok
  (`"web": true` v `ritualy.json`), každá vedie do obchodu.
- Ceny sa riadia kalendárom Booqme (zdroj pravdy), web a poukazy sa podľa neho zosúlaďujú.
- Starý návrh `docs/poukazky/dl/` (DL 210 × 99 mm, QR kód, PDF na tlač) salón odmietol, nepoužíva sa.

## Dve podoby

1. **Od salónu** (`docs/poukazky/salon/`, `"salon": true`, 13 rituálov): hotové poukážky HEAD SPA 30 s fotkou
   rituálu, názvom, dĺžkou a vetou „Darujte chvíľu pokoja.“, 1290 × 645. Prišli ako snímky obrazovky z iPhonu
   (1290 × 2796, poukážka asi na riadkoch 1075 – 1719); vyrezávajú sa bez úprav `scripts/orez-poukazky.py`.
   Dva štýly: veľká mašľa; malá mašľa s lotosovou pečaťou. Pri dvoch rituáloch prišli oba, druhý je
   v `salon/varianty/`.
2. **Šablóna** (`docs/poukazky/sablona/`, zvyšné 4 rituály): pôvodná šablóna SALON30 s vyčisteným miestom
   na text (`cisti.py`, OpenCV inpaint, zóny pevne pre šablónu 1290 × 648), názov rituálu písmom Cinzel 600,
   cena, pätička HEADSPA30.SK písmom Montserrat 600.

## Výroba obrázkov

```
python3 docs/poukazky/sablona/ceny.py      # ceny z index.html do ritualy.json
PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
node docs/poukazky/sablona/vyrob.mjs       # vykreslí šablónové poukážky do sablona/png/ (gitignore)
python3 docs/poukazky/sablona/export.py    # booqme/*.jpg (1600 × 1200) a ukážky na web
```

`export.py` preskočí rituál, ktorému chýba vykreslenie, takže pri zmene len poukážok od salónu netreba
spúšťať vyrob.mjs. Potrebuje Pillow s podporou AVIF. Pri poukážkach od salónu je okolo v obrázku pre Booqme
plný tmavý pás (fotka a stuha idú až po okraj, rozmazaný okraj robil škvrny); pri šablóne plynulý prechod.

Ponaučenia z vykresľovania šablóny (vyrob.mjs, poukazka.html):
- len plné Chromium (`PLAYWRIGHT_CHROMIUM`), headless shell kazí rozostupy písmen;
- písma z `file://` sa načítajú len cez `page.goto(súbor)`, nie `setContent`;
- latin-ext woff2 nemá A – Z, písma sa načítavajú cez CSS s `unicode-range` (`pismo/pismo.css`);
- písma vopred načítať `document.fonts.load`, inak prvé poukážky vyjdú posunuté;
- `background-clip: text` oreže diakritiku: padding .45em a posunúť `top`;
- vykresliť v 1× a hotový obrázok zväčšiť (ostrý text na rozmazanej šablóne nevyzerá dobre);
- šablóna má len 1290 px; na veľkú tlač treba od salónu väčšie rozlíšenie.

## Kontrola

Pred odovzdaním vždy viac nezávislých pohľadov: `scripts/kontrola-poukazok.workflow.js` (obsah a diakritika,
orez v obchode, okraje a zvyšky snímok obrazovky), plus porovnanie webových obrázkov s výstupom export.py.

## Web

Pás „Poukážka na konkrétny rituál“ v `index.html` (`.vouchers-list`), obrázky
`assets/img/poukaz/<rituál>-{480,800,1290}.{avif,webp}` a `-800.jpg`, pomer 2592/1260 (orez 9 px hore
a dole z 1290 × 645). Šípky pásu sa skryjú, keď sa všetko zmestí (app.js). Zväčšenie pod kurzorom
je vypnuté, orezávalo zlatý rámik. Nový text v sekcii potrebuje kľúč vo všetkých šiestich
`assets/i18n/*.json`.
