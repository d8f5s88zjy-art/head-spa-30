# Administrácia Barbershop 30

Statická administrácia na `/admin/` vedľa verejného webu. Nepotrebuje build ani vzdialené knižnice. Používa existujúce lokálne fonty a fotografie.

## Použitie

1. Otvor administráciu a uprav ceny, trvanie, týždenný rozpis, oznam, tím alebo texty.
2. Pri novom slovenskom texte doplň sedem prekladov a potvrď ich kontrolu. Rovnaké slovenské znenie má na celom webe spoločný preklad. Pri ozname môže preklad zostať prázdny; v danom jazyku sa skryje.
3. Skontroluj rozdiely cez **Skontrolovať zmeny**. Ceny a trvanie zosúlaď aj s rezervačným systémom; administrácia ho nemení.
4. Pripoj existujúci GitHub kľúč s právom `Contents: Read and write` len pre `d8f5s88zjy-art/head-spa-30`. Na ukladanie slúži až samostatné tlačidlo v kontrole zmien.

Predvolene sa ukladá do `main`. Parameter `?branch=nazov-vetvy` dovolí existujúcu pracovnú vetvu; cieľ je viditeľný pred uložením. Zápis do `main` spúšťa existujúce nasadenie. Administrácia nepotvrdzuje, že nasadenie už skončilo.

Kľúč ostáva iba v pamäti, pole sa ihneď vymaže a pri odchode sa spojenie zruší. Koncept takisto nie je automaticky uložený. Stiahnutý koncept neobsahuje kľúč a dá sa obnoviť len nad rovnakým editovateľným obsahom. Pri konflikte s novšou verziou si ho stiahni, načítaj aktuálny web a zmeny prenes ručne.

## Rozsah a ochrany

- Zdroj sa číta z jednej GitHub revízie. Všetky zmenené súbory tvoria jeden commit so zachovaným základným stromom. Vetva sa overuje pred aj po príprave; posledný krok nikdy nepoužíva force push. Rozdiely URL vzniknuté nasadením neblokujú koncept: pri pripojení sa porovná editovateľný obsah a zmeny sa skladajú z aktuálneho raw zdroja.
- Ceny a hodiny sa upravia aj v JSON-LD. Hodiny majú jeden zdroj `#barbershop-settings`; statický kontakt, pätička a náhradná tabuľa sa tiež aktualizujú.
- Oznam je obyčajný text; pri zápise JSON je `<` escapované. Textové polia nevkladajú HTML. Admin má CSP a zákaz indexovania.
- Upravujú sa iba `barbershop-30/index.html` a sedem `assets/i18n/*.json`. Fotografie, poradie/počet členov tímu, názvy služieb, kontakty, právne a špeciálne formátované texty zostávajú v zdroji.
- Verejná cesta administrácie sama nedáva právo zapisovať. Zápis vyžaduje príslušný GitHub kľúč. Pri strate odpovede sa výsledok overuje podľa revízie, zápis sa automaticky neopakuje.

## Overenie

Z koreňa repozitára:

```sh
node --test barbershop-30/source/tools/admin-test.mjs
node --check barbershop-30/admin/app.mjs
```

Browser test vyžaduje už dostupný Playwright a Chromium a lokálny HTTP server repozitára na porte 8000. Nič neinštaluje. Všetky GitHub požiadavky nahrádza simuláciou; neodosiela reálne zmeny:

```sh
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node barbershop-30/source/tools/admin-browser.mjs
```

Iný server možno zadať cez `ADMIN_BASE_URL`. Screenshoty sa uložia do dočasného priečinka alebo do `ADMIN_SCREENSHOT_DIR`. Chýbajúci Chromium skončí stavom `BLOCKED` a kódom 2; nejde o úspešný test.
