# Zdroje: tri videá a čo sme si z nich vzali

Pozreté 2026-10-11 cez `../referencie-z-videi/` (popis, automatické titulky, snímky). Repozitáre ani nástroje
z videí sme neotvárali, neinštalovali ani nespúšťali (prístup k cudzím repozitárom v tej relácii zamietnutý).
Nič odtiaľ tu nie je skopírované; všetko o nich je len to, čo videá hovoria a ukazujú.

## ref7: rourke.heath, 61 s, Higgsfield v After Effects

Podrobne v `after-effects-higgsfield.md`. Vzali sme: kompozíciu z pomenovaných vrstiev s časom, jedno zadanie
s referenciou štýlu a zoznamom podkladov, upraviteľný text a vymeniteľnú grafiku, lower third, priebeh so
značkou, značku na konci. Nevzali sme: After Effects, plugin, generovanie obrázkov a záberov, sklenené karty,
obiehanie, odlesky, rozmazanie pohybom. Video je reklama; tvrdenia o modeli „GPT 6 Astra“ sú neoverené.

## ref8: valeridoesai, 39 s, a ref9: agilesingh, 35 s, MoneyPrinterTurbo

Na snímkach je adresa `github.com/harry0703/MoneyPrinterTurbo` a licencia MIT. Počet hviezd sa líši (popis ref9
115K, reč ref9 125K); neoverené. Podľa videí nástroj z jednej témy napíše scenár, nájde zábery z fotobánky,
vygeneruje hlas, titulky a hudbu a vyrenderuje 9:16, 16:9 alebo štvorec; pripája sa na rôzne jazykové modely.
ref9 tvrdí aj automatické uverejnenie na TikTok, Instagram a YouTube Shorts (neoverené). ref8 je z veľkej časti
lákadlo na vlastný webinár (odpočet „Sunday, August 30“, „45% FULL“, „Spots are limited“).

Pre naše značky sa nástroj nehodí, lebo jeho jadro je v rozpore s pravidlami:

| MoneyPrinterTurbo podľa videí | naše pravidlo |
| --- | --- |
| zábery z fotobánky | len skutočné zábery a fotky podniku od majiteľa |
| scenár napísaný modelom z témy | fakty len zo zdrojov (CONTENT_SOURCES.md, CLAUDE.md, CSV), krátke texty, tykanie |
| vygenerovaný hlas | platené služby na hlas len so súhlasom a rozpočtom majiteľa; v texte pre zákazníkov žiadna zmienka o AI |
| automatické uverejnenie | nič sa neuverejňuje automaticky, uverejňuje majiteľ |

Čo sme si vzali pre pohyblivú grafiku (vzor, nie kód):

- **Zoznam krokov, ktoré naskakujú po jednom** (ref8: „Writes the Script“, „Generates the Voice-Over“, „Adds
  Subtitles“, „Finds Music“, „Pulls Stock Footage“): u nás kroky v šablóne Priebeh, ktoré sa rozsvietia, keď ich
  výplň prejde, s krokmi z opisu služby v cenníku.
- **Odpočet a pás priebehu** (ref8 webinár): u nás šablóna Priebeh s počítadlom. Nikdy nie falošná vzácnosť
  („miesta sa míňajú“, percentá obsadenosti bez zdroja).
- **Jeden parametrický beh od zadania po hotový súbor**: u nás JSON parametre, jeden príkaz `render.mjs`,
  výstup v troch formátoch a kontrola. Strih, titulky a hudbu reelu rieši skill `kratke-video`.
- Veľké slová po jednom cez obraz (ref9) sú titulky, nie prekrytie; patria do `kratke-video`.
