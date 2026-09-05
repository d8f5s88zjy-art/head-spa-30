# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Barbershop30, Mostná 30, Nitra). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 17 rituálov v piatich kategóriách s cenami, objednávka darčekového poukazu, ako to prebieha (5 krokov), galéria, otázky, kontakt
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (voda, svetlo, para), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
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

## Darčekové poukážky

Sekcia Poukážky (vlastná položka v lište) obsahuje objednávkový formulár: hodnota alebo konkrétny rituál, pre koho, kontakt, venovanie a spôsob doručenia. Odoslanie otvorí pripravený e-mail na info@barbershop30.sk. Platba kartou priamo na webe vyžaduje platobnú bránu (napríklad Stripe Payment Links alebo GoPay), stačí potom nahradiť odkaz v `assets/app.js` v časti `vouchers`.

## Galéria

Sekcia Galéria zobrazuje fotografiu dverí a tri kreslené scény. Po nafotení salónu stačí nahradiť `<canvas data-mood>` prvky v `index.html` obrázkami `<img>` v `assets/img/`.

## Rezervácie

Všetky tlačidlá Rezervovať vedú na https://www.barbershop30.sk/rezervacia. Telefón a e-mail sú v sekcii Kontakt.
