# Šablóna: rozbor cudzieho reelu (Virality Engine, Trend Watcher)

Vstup od majiteľa: odkaz na TikTok (spracuj skillom `../../referencie-z-videi/`, skript
`scripts/tiktok.sh`), alebo snímky či nahrávka obrazovky reelu z Instagramu. Do účtu sa
neprihlasuj a reels nevyhľadávaj za majiteľa. Čo nevidíš alebo nepočuješ, nedomýšľaj.

## Výstup

```
Reel: <autor, odkaz alebo „snímky od majiteľa“>, <trvanie>
Čísla: <len čitateľné na snímke, napr. pozretia; inak „nevidno“>

Úvod (HOOK): <prvá veta doslovne> → aký sľub dáva
Obraz (VISUAL): <je tam tvár? aké rozpoznateľné miesto alebo vec?>
Stavba (STRUCTURE): <problém> → <jednoduché riešenie>
Prečo to asi funguje: <jedna až dve vety, označené ako odhad>

Trend: <čo sa opakuje v reeloch, ktoré majiteľ poslal (zvuk, formát, téma)>
Sedí na náš podnik? <áno/nie a prečo, podľa fakty-*.md a pravidiel>

Vlastná verzia (sablona-reel.md):
00 <sľub>
01 <čo dostaneš>
02 <ako si rezervuješ>
Zdroje: …
Čo nepreberáme a prečo: <cudzie znenie, nepravdivé tvrdenie, nesúhlas s pravidlami>
```

## Príklad: rozbor samotného videa nategold.ai

```
Reel: nategold.ai, TikTok, 44 s
Čísla: počet pozretí samotného videa na snímkach nie je; karta profilu v ukážke
       „Optimize bio“ má počty sledovateľov; v ukážke rozboru je cudzí reel s 318K pozretí
Úvod: „Claw just killed Instagram.“ (automatický prepis; z obrazu je to Claude)
      → sľub: jedným nástrojom vybavíš celý účet
Obraz: tvár autora s mikrofónom, nad ňou karty rozhrania (agent pripojený k Instagramu,
       11 skills, plán týždňa, rozbor reelu, scenár)
Stavba: problém (spravovať Instagram je veľa práce) → jednoduché riešenie (vložiť odkaz)
Scenár na obrazovke: 00 Claude can run your Instagram. 01 11 skills working as one team.
                     02 Here is how to set it up.
Čo nepreberáme: automatické komentovanie a odpovedanie z účtu (Instagram obmedzuje, spam),
                výzvu „comment agent“
```
