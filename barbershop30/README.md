# BARBERSHOP 30

Stránka pre barbershop na Mostnej 30 v Nitre. Čisté HTML, CSS a JavaScript, bez build kroku
a bez externých závislostí, rovnako ako zvyšok tohto repozitára.

Hlavná myšlienka: **vyber si strih ešte pred tým, než si sadneš do kresla.** Návštevník si
prejde ukážky, klikne na tvar, ktorý chce, doladí štyri detaily a zhrnutie si odnesie
do rezervácie.

## Súbory

- `index.html` – celá stránka v poradí: úvod s machovou scénou, výber strihu, tvoja predstava,
  cenník, ako to funguje, galéria, kontakt.
- `assets/data.js` – **jediné miesto, kde sa mení obsah.** Údaje prevádzky, zoznam strihov,
  filtre, otváracie hodiny, galéria, barberi a referencie.
- `assets/app.js` – filtre, detail strihu, formulár predstavy, zhrnutie, kopírovanie, menu.
- `assets/style.css` – štýly.
- `assets/img/` – obrázky.
- `assets/fonts/` – vlastná kópia písiem, aby sa priečinok dal presunúť samostatne.

## Čo ešte treba doplniť pred spustením

Všetko je v `assets/data.js` označené komentárom `REQUIRED_REAL_DATA`:

1. **Cenník.** Pri každom strihu je `price` a `duration` zatiaľ `null` a `pricesConfirmed`
   je `false`, takže stránka namiesto tabuľky ukáže odkaz do rezervačného kalendára.
   Po doplnení cien prepni `pricesConfirmed` na `true` a tabuľka sa zobrazí.
2. **Ponuka strihov.** Osem pripravených strihov je bežná barbershopová ponuka, nie potvrdený
   zoznam. Čo nerobíte, prepnite na `offered: false`, čo chýba, dopíšte.
3. **Otváracie hodiny.** Prevzaté zo salónu na Mostnej 30. Po potvrdení prepni
   `hours.confirmed` na `true` a poznámka pod hodinami zmizne.
4. **Fotky.** Všetky zábery strihov aj priestoru sú zatiaľ ilustračné ukážky a stránka ich tak
   aj označuje. Po nafotení nahraď súbory v `assets/img/` a pri strihoch prepni
   `illustrative` na `false`.
5. **Barberi a referencie.** Prázdne polia `barbers` a `reviews` znamenajú, že sa sekcia
   vôbec nevykreslí. Doplň len skutočných ľudí a skutočné hodnotenia.

## Rezervácia

Tlačidlá vedú na `booqme.app/sk/rezervacia/barbershop-30`. Je to overený kalendár, v ktorom
sú služby prevádzky.

Zhrnutie predstavy sa do rezervácie **neprenáša automaticky**, Booqme na to nemá pole.
Stránka to nepredstiera: návštevník má tlačidlo, ktoré mu zhrnutie skopíruje, a text
pod ním hovorí, že ho má poslať alebo ukázať barberovi. Ak neskôr pribudne pole na poznámku
alebo iný spôsob odovzdania, treba upraviť `handoffNote` v `app.js`.

Fotka pre inšpiráciu ostáva v prehliadači návštevníka. Nikam sa neodosiela a nikde neukladá.

## Náhľad

```
npx http-server -p 8080
```

Potom otvor `http://localhost:8080/barbershop30/`.
