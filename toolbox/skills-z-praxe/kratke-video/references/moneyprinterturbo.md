# MoneyPrinterTurbo a náš nástroj: čo berieme, čo nie a prečo

Podklad: dve videá o MoneyPrinterTurbo (valeridoesai, agilesingh) a ich snímky, pozri
[zdroj-videa.md](zdroj-videa.md). Repozitár `harry0703/MoneyPrinterTurbo` sme neotvorili; všetko
o ňom nižšie je to, čo videá hovoria alebo ukazujú, nie overený popis kódu. Z repozitára sme
nič neskopírovali; `scripts/reel.py` je vlastný (Python, Pillow, fontTools, ffmpeg).

## Reťaz krok po kroku

| Krok | MoneyPrinterTurbo (podľa videí) | `reel.py` a tento skill | Prečo |
| --- | --- | --- | --- |
| téma | „Video Subject“, jedna téma alebo výzva | téma od majiteľa (čo chce povedať, komu) | rovnaké |
| scenár | jazykový model napíše scenár a kľúčové slová („Generate Script & Keywords“) | tri vety podľa `../instagram-salon/` (sľub, čo dostaneš, ako si rezervuješ); návrh môže napísať chat, ale každá veta s faktom má pole `zdroj` a nástroj kontroluje zakázané tvrdenia značky | fakty len zo zdrojov podniku; vymyslený detail o podniku je horší ako žiadny |
| zábery | fotobanka (Video Source: Pexels) podľa kľúčových slov, poradie aj náhodne („Random Concatenation“) | len skutočné fotky a videá podniku od majiteľa, každý záber vybraný k vete, poradie podľa scenára | zákazník príde do skutočného priestoru; cudzí záber by klamal, kde je, a pravidlá značiek ho zakazujú |
| hlas | syntetický hlas (v obraze správy commitov o hlasových službách MiniMax a ElevenLabs) | žiadny, alebo nahrávka majiteľa; služba na hlas len s výslovným súhlasom a rozpočtom majiteľa; pole `povod` je povinné | pravý hlas podniku; platené volania nespúšťame sami; TikTok a Meta majú pravidlá na označenie realistického syntetického obsahu, čo nejde dokopy so zásadou bez zmienky o AI v texte pre zákazníkov |
| titulky | titulky zladené s hlasom | veta zo scenára = titulok, vypálený písmom značky (libass) v bezpečnej zóne, k tomu `.srt`; `--casy-hlasu` nájde vety v nahrávke a navrhne dĺžky záberov | čitateľnosť a vzhľad značky; ovládanie aplikácií nezakryje text |
| hudba | „Finds Music“, hudba na pozadí | žiadna, alebo súbor od majiteľa s povinným poľom `licencia`; pod hlasom sa hudba stíši (sidechain) | hudba bez licencie môže video na platforme stlmiť alebo zablokovať; majiteľ môže pridať hudbu v aplikácii z knižnice, ktorú jeho účet smie použiť |
| render | 9 : 16, 16 : 9, štvorec; prechod „None“ | 9 : 16 (1080 × 1920), 16 : 9, 1 : 1; strih alebo prelínanie; fotky s pomalým nájazdom bez trasenia; malé videá zväčšené lanczos + CAS; zvuk okolo -14 LUFS; titulná snímka JPG | berieme formáty; pohyb a ostrosť sú u nás merané (`technika.md`) |
| uverejnenie | podľa videa 3 „dokonca automaticky uverejní“ na TikTok, Instagram, YouTube Shorts (neoverené) | nikdy; výstup sú súbory a zoznam „Treba potvrdiť“ (súhlasy, licencie, fakty) | uverejňuje majiteľ zo svojho účtu; automatické akcie môžu účet obmedziť a obišli by kontrolu súhlasov |
| jazykový model | pripája sa na rôzne modely (GPT, Claude, Gemini, DeepSeek podľa videa 3) | nástroj žiadny model nepotrebuje, beží bez siete; scenár pripraví chat alebo človek | žiadne kľúče, žiadne náklady, výsledok sa dá zopakovať |
| množstvo | „money printer“, veľa videí bez ľudí („zero humans“) | jeden scenár = jedno video, varianty kopírovaním scenára | cieľ je pár dobrých videí so skutočným podnikom, nie objem všeobecného obsahu |

## Čo sme si zobrali

1. **Reťaz krokov** v jednom nástroji: téma, scenár, zábery, (hlas), titulky, (hudba), render.
   Každý krok má v scenári svoje pole, takže sa dá zopakovať a upraviť jedno miesto.
2. **Formáty** 9 : 16, 16 : 9 a 1 : 1 z toho istého scenára (`--format`).
3. **Titulky ako súčasť videa** (vypálené) aj zvlášť (`.srt`).
4. **Spojenie hlasu a titulkov**: u nás opačne, dĺžky záberov podľa nahratých viet (`--casy-hlasu`).
5. **Jednoduché zadanie**: jeden súbor JSON namiesto strihového programu.

## Čo sme nezobrali

- Fotobanku a náhodné poradie záberov.
- Syntetický hlas ako predvolenú voľbu a akékoľvek platené generovanie bez súhlasu majiteľa.
- Hudbu bez licencie.
- Automatické uverejňovanie.
- Webové rozhranie a hromadnú výrobu.
- Titulky po slovách vo veľkých verzálkach (štýl referenčných videí): naše značky sú zdržanlivé
  (Fraunces a Manrope, resp. Lora a Manrope, jeden akcent).

## Pohyblivá grafika (video Higgsfield v After Effects)

Vrstvy s menami a upraviteľné prvky (lower third so štatistikou, ukazovateľ postupu, mapa) sú
téma skillu `../motion-grafika/`. Odtiaľ sem ide hotové prekrytie s alfou (ProRes 4444 alebo WebM
VP9) a `reel.py` ho položí na záber (pole `overlay`). Doplnok Higgsfield a jeho platené generovanie
nespúšťame; ak ho majiteľ chce, len s jeho výslovným súhlasom a rozpočtom.
