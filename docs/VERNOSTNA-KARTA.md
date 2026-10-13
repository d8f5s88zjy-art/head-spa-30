# Vernostná karta pre BARBERSHOP 30 a HEAD SPA 30 – rozhodnutie a plán

Stav k 2026‑10‑13 (večer): **rozhodnuté a postavené – vlastný systém (možnosť B)**, priečinok `vernost/`,
návod `vernost/README.md`. Upresnenie od Lajka: kartičku si klient pri rezervácii **sám** zaškrtne („Áno, chcem
vernostnú kartičku“), nikoho nenútime; akcie a odmeny tvorí Lajko v admine, žiadne 30–40 % zľavy (napr. mesiac
študentov, ostrihaj sa a styling máš za polovicu). Body sa menia na zľavu alebo produkt (napr. puder).
Text nižšie je pôvodné porovnanie možností pred rozhodnutím.

## Čo chce majiteľ (Lajko)

- Keď sa klientovi spraví termín, vznikne mu vernostná karta.
- Karta je prepojená na admin, z ktorého sa dajú hneď posielať hromadné správy (súťaže, akcie a pod.).
- Rovnaká karta aj pre HEAD SPA 30.

## Prečo to nie je len zmena webu

Weby (barbershop-30/ a koreň HEAD SPA 30) sú statické stránky na GitHub Pages. Karta potrebuje tri veci, ktoré
statický web nemá: databázu klientov, odosielanie správ do mobilu a napojenie na rezervácie.

- Rezervácie Barbershopu bežia vo vlastnom systéme barbershop30.sk (Vue, `/rezervacia/ajax`), HEAD SPA cez Booqme.
  Ani jeden z nich sme nenašli v zozname integrácií ponúkaných kartových systémov, preto „karta pri rezervácii“
  automaticky zatiaľ nejde; ide karta cez QR kód pri pulte, odkaz na webe a odkaz v potvrdení rezervácie
  (ak ho rezervačný systém dovolí upraviť).
- Klientske údaje (meno, telefón, e‑mail) nesmú byť vo verejnom repozitári, preto karta nemôže bežať cez
  admin HEAD SPA 30 (ten ukladá do GitHubu).
- Hromadné správy potrebujú súhlas klienta s marketingom (GDPR) a doplnenie zásad ochrany údajov.

## Možnosti

| | A: hotová služba (napr. VEXiON cards) | B: vlastné riešenie |
|---|---|---|
| čo klient dostane | karta v Apple Wallet / Google Wallet cez QR alebo odkaz, bez aplikácie | karta ako webová stránka (pridať na plochu), neskôr Wallet |
| admin a hromadné správy | ich admin: push a geo notifikácie, automatické pripomienky, databáza klientov, export CSV | treba postaviť: zoznam kariet, pečiatky, odoslanie správy všetkým |
| napojenie na rezervácie | uvádzajú Bookio, Zapier a pokladne; Booqme ani barbershop30.sk nie | len ak má rezervačný systém webhook alebo API |
| účty a poplatky | ONE 20 €/mes. bez DPH (1 prevádzka, do 200 klientov), PRO 34 €/mes. pri ročnej platbe; do 31. 10. 2026 akcia −50 % (údaje z vexioncards.one, cenník) | hosting s databázou (napr. Cloudflare alebo Supabase, bezplatná úroveň), Apple Developer 99 USD/rok pre Apple Wallet, účet Google Wallet; SMS by stáli za kus |
| čas | spustenie do pár dní, web dostane sekciu s tlačidlom | týždne vývoja, testov a právnych úprav |

Odporúčanie: **A** (hotová služba) – Lajko ju už má ponúknutú, rieši Wallet aj notifikácie a pre dve prevádzky
je lacnejšia než vývoj. Pre dve prevádzky treba plán s viac prevádzkami (PRO) alebo dva účty – overiť s predajcom.

## Čo spravíme na weboch, keď bude rozhodnuté

1. Sekcia „Vernostná karta“ na Barbershop 30 (aj v 7 jazykoch) a na HEAD SPA 30: krátky popis, tlačidlo
   „Pridať kartu do mobilu“ (odkaz od poskytovateľa), QR kód pre počítač, poznámka o súhlase so správami.
2. Odkaz na kartu v mobilnej lište a v pätičke, doplnenie zásad ochrany osobných údajov o kartu a správy.
3. Text pre recepciu a pre potvrdenie rezervácie (ak systém dovolí): „Tu je tvoja vernostná karta: …“.

Potrebujeme od majiteľa: výber systému, odkaz na registráciu karty (alebo prístup do adminu), pravidlá odmeny
(napr. koľká návšteva je zadarmo – nevymýšľame) a súhlas s textami.
