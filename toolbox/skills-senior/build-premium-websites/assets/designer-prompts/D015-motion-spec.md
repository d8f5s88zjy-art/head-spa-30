# D015 — Filmové prechody a motion špecifikácia

## Zadanie

Navrhni plynulý prechod medzi konkrétnymi stavmi a odovzdaj ho ako realizovateľnú motion špecifikáciu. Vyber mechanizmus podľa významu, nie podľa počtu efektov.

## Konkrétny postup

Zváž match cut, prechod zakrytím, masku, crossfade, zdieľaný prvok alebo jednoduchú zmenu stavu. Vysvetli kontinuitu: identita subjektu, poloha, smer, mierka, svetlo alebo význam. Definuj začiatok, prekrytie, stabilný koniec, dobu či scroll rozsah a easing. Rozdeľ animované vlastnosti medzi jasných vlastníkov.

Ukáž stav pri prerušení v polovici, opakovanom kliknutí, opačnom smere, neúspešnom načítaní a zmene reduced-motion preferencie. Navigácia, fokus a potvrdené transakcie musia zostať pod autoritou aplikácie. Pri FLIP alebo zdieľanej geometrii označ vnorené a transformované prvky, ktoré vyžadujú technické overenie.

## Povinný výstup

Dodaj stabilné a prechodové snímky, časovú/progresovú tabuľku, zoznam vlastností, parametrov a easing návrhov, pravidlá prerušenia, cleanup a statický fallback. Prilož mobilný variant, odhad hlavných nákladov bez falošného merania a konkrétne body kontroly. Ak nástroj umožní autorizovaný prototyp, odovzdaj ho s presným popisom, čo v ňom skutočne funguje.

## Akceptácia

Prechod nikdy nevytvorí nečitateľný alebo neovládateľný medzistav. Výsledný obsah je správny aj po zrušení animácie. Špecifikácia obsahuje správanie pri zlyhaní a nie iba časovú os ideálneho priechodu.
