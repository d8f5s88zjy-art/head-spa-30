# Fotky práce barberov (rezervácia na webe)

Rezervácia ukazuje pri každom barberovi tri ukážky jeho práce (ťuknutím väčšie) a na rezervačnej stránke
galériu „Naša práca“. Kým fotky nie sú, ukazuje len portréty a odkaz na Instagram @barbershop30_nitra.
Fotky sa do webu nesťahujú z Instagramu automaticky: Instagram bez prihlásenia nič neukáže, do účtu sa
neprihlasujeme a automatické prechádzanie účtu Instagram obmedzuje.

## Ako fotky dodať (stačí jedna z možností)

1. **Priamo od barberov (najrýchlejšie a najostrejšie).** Každý barber vyberie 5 až 8 svojich najlepších fotiek
   z galérie telefónu, najlepšie na výšku, bez filtrov, a pošle ich ako súbory (napríklad ZIP alebo WhatsApp
   „Dokument“, aby sa nezmenšili). Pri každej meno barbera.
2. **Z Instagramu podniku.** Kto má prístup k účtu: Accounts Center → Your information and permissions →
   Export your information → Export to device → profil barbershop30_nitra → vybrať obsah (príspevky, príbehy) →
   kvalita médií vysoká → spustiť. Odkaz príde e‑mailom (môže to chvíľu trvať) a dá sa stiahnuť 4 dni.
   Postup podľa pomocníka Instagramu (https://help.instagram.com/181231772500920); názvy položiek sa môžu
   v aplikácii mierne líšiť. Jednotlivý príbeh z archívu: profil → menu → Archív → príbeh → Možnosti → Uložiť.
   K fotkám treba dopísať, ktorého barbera je práca.

## Pravidlá

- Klient na fotke len so svojím súhlasom, inak nerozpoznateľný (zozadu, z profilu, detail strihu).
- Barber súhlasí, aby boli jeho fotky na webe. Deti len so súhlasom rodičov.
- Fotky sa netónujú ani neupravujú, nástroj ich len oreže na 4:5 a zmenší.

## Spracovanie (robí správca webu)

```bash
# originály do source/praca/<meno barbera>/ (adrian, nikolas, dominika, ...; v gite nie sú, .gitignore)
python3 -I source/tools/praca.py            # → assets/img/praca/*.webp (480 a 960 px, bez GPS) a assets/praca.json
python3 -I source/tools/praca.py --stred 0.5,0.35   # orez vyššie, keď je strih hore na fotke
```

Voliteľne `source/praca/<meno>/popis.txt` s riadkami `subor.jpg: popis fotky` (text pre čítačky obrazovky).
Potom `node source/tools/objednavka-test.mjs` a kontrola snímok.
