# Šablóna: profil a bio (Profile Optimizer)

Vstup: snímka profilu od majiteľa (meno, bio, odkaz, zvýraznené Stories). Instagram dĺžku bio
obmedzuje; pred odovzdaním over, že sa návrh zmestí.

## Stavba

```
Meno profilu: <názov podniku> · <mesto>
Bio:
<čo robíme, jedna veta>
<kde, jedna veta, prípadne overený detail>
<výzva na rezerváciu>
Odkaz: <rezervácia>
Zvýraznené Stories: <3 až 5 tém podľa toho, čo podnik naozaj má>
Zdroje: …
Treba potvrdiť: …
```

## Príklad: Barbershop 30

```
Barbershop 30 · Nitra
Mostná 30, strihá sa tu od roku 2019.
Osem kresiel, vzadu káva zdarma.
Rezervuj online 24/7.
Odkaz: https://www.barbershop30.sk/rezervacia
Zvýraznené Stories: Služby, Tím, Čakáreň, Kde nás nájdeš
```

Zdroje: `barbershop-30/docs/CONTENT_SOURCES.md` (Identita a kontakt).

## Príklad: HEAD SPA 30

```
HEAD SPA 30 · Nitra
Head Spa rituály za zelenými dverami na Mostnej 30.
Poukaz vždy na konkrétny rituál.
Termín si vyberieš online kedykoľvek.
Odkaz: https://booqme.app/sk/rezervacia/salon-30-head-spa
Zvýraznené Stories: Rituály, Pre dvoch, Poukazy, Kde nás nájdeš
```

Zdroje: `CLAUDE.md`, `index.html`. Nepíš „salón 30“ ako názov ani „súčasť Salónu 30“.

## Kontrola

- Názov podniku presne podľa zdroja.
- Žiadne číslo, ktoré sa mení (ceny, hodiny), ak ho nemá kto udržiavať.
- Témy zvýraznených Stories len z toho, čo podnik ponúka a má nafotené.
