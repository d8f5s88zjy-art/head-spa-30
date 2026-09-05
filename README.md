# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Barbershop30, Mostná 30, Nitra). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 17 rituálov v piatich kategóriách s cenami, darčekový poukaz, ako to prebieha (5 krokov a náladové zábery), otázky, kontakt
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (voda, svetlo, para), otvárací moment so značkou, animácie, filter rituálov
- `assets/fonts/` – písma Fraunces, Manrope a JetBrains Mono (hostované lokálne)
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

## Náhľad

Dvojklik na `index.html` funguje. Pre plný zážitok so scrollom spustite lokálny server v priečinku projektu:

```
npx http-server -p 8080
```

a otvorte `http://localhost:8080`.

## Nasadenie

Nahrajte obsah priečinka (index.html a assets/) na akýkoľvek statický hosting. Pred nasadením upravte v `index.html` značky `og:url` a `og:image` na živú adresu (miesto je označené komentárom `DEPLOY STEP`).

## Rezervácie

Všetky tlačidlá Rezervovať vedú na https://www.barbershop30.sk/rezervacia. Telefón a e-mail sú v sekcii Kontakt.
