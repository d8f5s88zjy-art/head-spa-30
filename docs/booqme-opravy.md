# Opravy na Booqme

Stav k 23. 9. 2026. Všetkých 17 rituálov aj 17 poukazov má na Booqme správny názov, dĺžku aj cenu
(kontrola proti `docs/booqme-sluzby.csv` a `docs/booqme-poukazy.csv`). Opraviť treba vzhľad a texty.
Všetko sa robí v administrácii Booqme, web sa nemení.

## 1. Názov prevádzky

Teraz: **Salon 30 - Head Spa** (bez dĺžňa, so spojovníkom).

Nový názov:

```
HEAD SPA 30 · Salón 30
```

## 2. Logo

V hlavičke je staré logo (kruh s číslom 30). Nahraj `docs/booqme/logo-head-spa-30.png`
(1024 × 1024 px, lotos v zlatom kruhu na tmavom podklade, rovnaký ako na webe).

## 3. Kategória poukážok bez emoji

Teraz: **🎁 Darčekové poukážky**. Nový názov:

```
Darčekové poukážky
```

## 4. Hodnotenie 0,0 a Recenzie (0)

Prázdne hodnotenie pôsobí, akoby salón nemal klientov. Ak ho Booqme dovolí v nastaveniach
profilu skryť, skry ho, kým nepribudnú prvé recenzie. Ak nie, popros po rituáli pár stálych
klientok o recenziu cez odkaz z Booqme.

## 5. Popisy rituálov pre chodidlá

Tri rituály pre chodidlá majú na Booqme dlhý odsek, všetky ostatné rituály majú jednu vetu
a potom Obsah rituálu. Zjednoť ich, do popisu služby vlož presne toto:

### Klasický rituál pre chodidlá

```
Teplý kúpeľ, peeling, masky, teplo a reflexné tlakové techniky pre pocit ľahkosti chodidiel. Obsah rituálu: Uvítací nápoj · Voňavý aromaterapeutický úvod · Teplý kúpeľ chodidiel · Jemné penové očistenie · Peeling chodidiel · Osviežujúca maska na chodidlá · Hydratačná maska na päty · Teplý uterákový zábal · Reflexný tlakový rituál chodidiel · Jemné stimulačné techniky na chodidlách · Výživné sérum a intenzívna hydratácia · Záverečný relaxačný rituál v tichu
```

### Ovocný a bylinkový rituál pre chodidlá

```
Teplý bylinný kúpeľ s čerstvými citrusmi, ovocný peeling, obklad a hydratačná maska pre chodidlá. Obsah rituálu: Uvítací nápoj s čerstvým ovocím · Voňavý aromaterapeutický úvod · Teplý bylinný kúpeľ chodidiel s čerstvými citrusmi · Jemné penové očistenie · Ovocný peeling chodidiel · Čerstvý ovocný a bylinný obklad · Chladivý osviežujúci rituál · Hydratačná maska na chodidlá a päty · Teplý uterákový zábal · Reflexný tlakový rituál chodidiel · Jemné stimulačné techniky pre pocit uvoľnenia · Výživné ovocné maslo alebo krémové ošetrenie · Aromaterapeutický oddych v tichu · Záverečný relaxačný rituál
```

### Zlatý rituál 24K

```
Kúpeľ, luxusný peeling, zlatá maska a 24K zábal na päty a chodidlá, so sérom s kozmetickým zlatom. Obsah rituálu: Uvítací nápoj · Zlatý aromaterapeutický úvod · Teplý kúpeľ chodidiel s minerálnym a aromatickým rituálom · Jemné penové očistenie · Luxusný peeling chodidiel · 24K zlatý peelingový rituál · Teplý uterákový zábal · Zlatá hydratačná maska na chodidlá · 24K zlatý zábal na päty a chodidlá · Reflexný tlakový rituál chodidiel · Jemné stimulačné techniky pre pocit uvoľnenia · Výživné sérum obohatené o kozmetické zlato · Hrejivý zábal chodidiel · Chladivý záverečný rituál · Aromaterapeutický odpočinok v úplnom tichu · Luxusné záverečné ošetrenie chodidiel
```

## 6. Popisy poukazov

Popisy končia technickým „Kategória: …“ a opakujú slovo rituál. Nový text pre každý poukaz
(názov a cena sa nemenia):

**Poukaz: Head Spa Classic**

```
Poukaz na Head Spa Classic, 40 minút. Prvé zoznámenie s Head Spa. Platí 365 dní od kúpy.
```

**Poukaz: Head Spa Relax**

```
Poukaz na Head Spa Relax, 60 minút. Ticho, jemný dotyk, vôňa, teplo a voda. Platí 365 dní od kúpy.
```

**Poukaz: Head Spa Harmony**

```
Poukaz na Head Spa Harmony, 75 minút. Sedemdesiatpäť minút bez zhonu. Platí 365 dní od kúpy.
```

**Poukaz: Hĺbkový rituál pre pokožku hlavy**

```
Poukaz na Hĺbkový rituál pre pokožku hlavy, 90 minút. Keď už nestačí obyčajná starostlivosť. Platí 365 dní od kúpy.
```

**Poukaz: Head Spa Beauty Ritual**

```
Poukaz na Head Spa Beauty Ritual, 60 minút. Pokožka hlavy, tvár aj vlasy v jednej hodine. Platí 365 dní od kúpy.
```

**Poukaz: Head Spa Fruit & Fresh Ritual**

```
Poukaz na Head Spa Fruit & Fresh Ritual, 75 minút. Kúsok prírody, ktorý je cítiť. Platí 365 dní od kúpy.
```

**Poukaz: Head Spa Signature Ritual**

```
Poukaz na Head Spa Signature Ritual, 120 minút. Stodvadsať minút. Žiadny zhon.. Platí 365 dní od kúpy.
```

**Poukaz: Gentlemen Head Spa**

```
Poukaz na Gentlemen Head Spa, 45 minút. Jednoduchý. Elegantný. Mužský.. Platí 365 dní od kúpy.
```

**Poukaz: Gentlemen Harmony Ritual**

```
Poukaz na Gentlemen Harmony Ritual, 60 minút. Sila mužskej elegancie. Platí 365 dní od kúpy.
```

**Poukaz: Gentlemen Deep Scalp Ritual**

```
Poukaz na Gentlemen Deep Scalp Ritual, 90 minút. Keď pokožka hlavy potrebuje viac než šampón. Platí 365 dní od kúpy.
```

**Poukaz: Gentlemen Signature Experience**

```
Poukaz na Gentlemen Signature Experience, 120 minút. Najvyššia úroveň komfortu a oddychu. Platí 365 dní od kúpy.
```

**Poukaz: Little Fruit Head Spa**

```
Poukaz na Little Fruit Head Spa, 50 minút. Malý hosť, veľký zážitok. Platí 365 dní od kúpy.
```

**Poukaz: Spoločný Head Spa rituál**

```
Poukaz na Spoločný Head Spa rituál, 65 minút, pre dve osoby. Niektoré chvíle sú krajšie, keď ich prežívame spolu. Platí 365 dní od kúpy.
```

**Poukaz: Spoločný rituál pod hviezdami**

```
Poukaz na Spoločný rituál pod hviezdami, 75 minút, pre dve osoby. Dve osoby. Jedna hviezdna obloha.. Platí 365 dní od kúpy.
```

**Poukaz: Klasický rituál pre chodidlá**

```
Poukaz na Klasický rituál pre chodidlá, 40 minút. Teplo. Vôňa. Dotyk. Relax.. Platí 365 dní od kúpy.
```

**Poukaz: Ovocný a bylinkový rituál pre chodidlá**

```
Poukaz na Ovocný a bylinkový rituál pre chodidlá, 60 minút. Ovocie, bylinky, teplo a dotyk. Platí 365 dní od kúpy.
```

**Poukaz: Zlatý rituál 24K**

```
Poukaz na Zlatý rituál 24K, 90 minút. Keď obyčajný relax nestačí, prichádza zlato. Platí 365 dní od kúpy.
```

## 7. Adresa rezervácie

Adresa je `booqme.app/sk/rezervacia/barbershop-30`. Slovo barbershop tam klient vidí pri
rezervácii aj platbe. Ak Booqme dovolí zmeniť adresu profilu (napríklad na `head-spa-30`),
zmeň ju a napíš mi novú adresu, prepíšem všetky odkazy na webe naraz. Kým sa to nezmení,
web ostáva na súčasnej adrese, inak by tlačidlá Rezervovať prestali fungovať.

## 8. Platba kartou

V obchode s poukazmi je voľba Platba kartou online. Funguje až po prepojení Stripe Connect
v Booqme. Over jedným nákupom najlacnejšieho poukazu (Klasický rituál pre chodidlá, 45 €),
že platba prejde a poukaz príde e-mailom, potom ho v administrácii zruš a vráť.
