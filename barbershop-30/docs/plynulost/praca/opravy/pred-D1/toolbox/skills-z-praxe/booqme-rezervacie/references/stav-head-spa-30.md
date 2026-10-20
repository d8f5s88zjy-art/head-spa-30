# Stav HEAD SPA 30 a Booqme (2026-10-11)

Zistené behom `NODE_USE_ENV_PROXY=1 node tools/booqme-kontrola.mjs` a čítaním verejných stránok
Booqme v tento deň. Pri ďalšej práci spusti kontrolu znova; tento zápis je len východisko.

## Výsledok kontroly

```
Web: 21 rituálov · Booqme kalendár: 21 služieb · obchod: 17 poukazov
```

- **Kalendár sedí**: všetkých 17 rituálov a 4 služby Fúkaná a žehlenie majú v kalendári rovnakú cenu
  a dĺžku ako na webe.
- **Obchod s poukazmi nesedí pri 13 poukazoch**: majú ceny spred zmeny z 2026-10-10 (napr. Head Spa
  Relax 70 € v obchode, 67 € na webe a v kalendári; Head Spa Signature Ritual 149 € proti 123 €;
  Ovocný a bylinkový rituál pre chodidlá 65 € proti 55 €). Ceny poukazov prepíše majiteľ v Booqme
  (Poukážky, Typy poukážok) podľa `docs/booqme-poukazy.csv`, ktoré už má nové ceny; web sa nemení.
  Pôvodná kontrola skončí s kódom 1, kým obchod nesedí; prenosná verzia v `scripts/` hlási kalendár
  a obchod zvlášť.
- Podklad proti webu (`scripts/podklad-zhoda.py`): sedí; dve poznámky, web má kratší popis pri
  Head Spa Beauty Ritual a Head Spa Signature Ritual než stĺpec `Popis do Booqme`.

## Úlohy z `docs/booqme-opravy.md` (zoznam z 2026-09-23)

| Bod | Úloha | Ako to vyzerá 2026-10-11 na verejnej stránke |
| --- | --- | --- |
| 1 | názov prevádzky „HEAD SPA 30 · Salón 30“ | titulok stále „Salon 30 - Head Spa“ |
| 3 | kategória poukážok bez emoji | „Darčekové poukážky“, emoji v obchode nie je |
| 6 | nové popisy poukazov bez „Kategória: …“ | popisy v obchode ešte končia „Kategória: …“ |
| 7 | adresa profilu `salon-30-head-spa` | hotovo; obrázky s QR kódom (`docs/poukazky/dl`) treba pregenerovať |
| 8 | platba kartou cez Stripe Connect | z verejnej stránky sa overiť nedá |

Body 2 (logo), 4 (hodnotenie) a 5 (popisy rituálov pre chodidlá) sa z tohto behu neoverovali.

## História zmien adresy

- do septembra 2026: `booqme.app/sk/rezervacia/salon-30`, potom 404 (README, „Kam vedú tlačidlá“);
- potom `.../barbershop-30`, ktorá tiež prestala platiť (commit 0efe439, 2026-10-10);
- teraz `salon-30-head-spa` (kalendár, obchod, krátka adresa profilu).
