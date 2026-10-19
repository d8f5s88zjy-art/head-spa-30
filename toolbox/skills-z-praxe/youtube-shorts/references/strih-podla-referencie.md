# Strih podľa referencie (rytmus, nie obsah) a editory napojené na Claude

Majiteľ pošle video a povie „strihni to takto“. Z referencie berieme **len časy strihov** (rytmus); obraz, zvuk,
hudbu ani texty cudzieho videa nie. Postup beží lokálne, klientske zábery nikam neodchádzajú. Vznikol z rozboru
V10 (dazzzlme, editor Shorty pripojený ku Claude ako vlastný konektor; `../../referencie-z-videi/references/naucene-z-videi.md`,
záznam 17) a je overený 2026-10-19 na V2 a V10 s klipmi GYM KLUB.

## Príkazy

```bash
S=toolbox/skills-z-praxe/youtube-shorts/scripts
bash $S/strihy.sh ref.mp4 ref-strihy --prah 0.12 --harok            # počet záberov over na hárku
python3 -I $S/strih_podla_referencie.py ref.mp4 zabery/ -o strih.json --vystup out/short.mp4 \
  --bpm 100 --delenie 2 --min-zaber 0.6 --max-zaber 3.5 --hudba hudba/podklad.wav --harok
python3 -I $S/short.py strih.json --len-titulky                      # po doplnení fráz titulkov
python3 -I $S/short.py strih.json                                    # výroba a kontrola 11 bodov
python3 -I $S/strih_podla_referencie.py --porovnaj out/short.mp4 strih.json   # tvrdé strihy ±1 snímka
```

Bez `--vystup` sa short volá ako EDL (`strih.json` → `strih.mp4` vedľa EDL). Vstupom môže byť aj hotový
`zabery.csv` zo `strihy.sh` a zoznam klipov v želanom poradí (`--referencia ref.mp4` pre hárok).

## Postup

1. **Kostra.** Skript zavolá `strihy.sh` (alebo vezme hotový `zabery.csv`), voliteľne použije len časť referencie
   (`--od`, `--do`), spomalí tempo (`--mierka`), prichytí strihy na doby vlastnej hudby (`--bpm`, `--prvy-beat`,
   `--delenie`), zlúči príliš krátke zábery (`--min-zaber`) a rozdelí dlhé (`--max-zaber`). Hranice počíta
   v snímkach, takže sa chyba zaokrúhlenia nesčíta.
2. **Klipy.** Priečinok = abecedné poradie (poradie natáčania); vlastné poradie = zoznam súborov. Nepoužité klipy
   majú prednosť, dlhý záber hľadá dosť dlhý klip, inak spomalenie najviac na 0,5. Pri opakovaní iný úsek klipu.
3. **Kontrola hárku** (`strih-harok.jpg`: stred záberu referencie vľavo, náš úsek vpravo). Klipy vymeň podľa
   obsahu (hook = najrozpoznateľnejší záber miesta, druhý hook, výzva) a skript spusti znova so zoznamom súborov;
   časy ostanú. Hárok obsahuje cudzie snímky: len na kontrolu, nikam ho neposielaj a po práci zmaž.
4. **Titulky a hudba.** Kostra má prázdne `frazy`; text len zo zdrojov prevádzky. Hudba vlastná, z knižnice
   YouTube alebo licencovaná, nikdy zvuk referencie. Bez hudby a bez zvuku klipov kontrola -14 LUFS neprejde
   (skript upozorní).
5. **Prechody** `--prechod circleopen:0.3 --prechod-na 8,10` (názvy filtra xfade, napr. `circleopen`, `rectcrop`,
   `vertopen`, alebo `prelinanie`): predošlý záber sa predĺži o dĺžku prechodu, nový začne v čase strihu
   referencie. Prechody xfade majú mäkký okraj; ostré geometrické masky ako vo V10 nerobia.

| Značka | Nastavenie | Na V2 (prah 0,12, 100 BPM, polovice dôb) |
| --- | --- | --- |
| HEAD SPA 30 | `--mierka 1.5 --min-zaber 1.75 --max-zaber 3.5`, bez tvarových prechodov, len `prelinanie:0.3` | 0 až 25 s → 37,5 s, 15 záberov, medián 2,40 s, 1,80 až 3,30 s (recept 2,2 až 3,0 s) |
| Barbershop 30, GYM KLUB | `--mierka 1.15 --min-zaber 0.6 --max-zaber 3.5`, najviac 2 tvarové prechody | 0 až 30 s → 34,5 s, 19 záberov, medián 1,80 s, 0,60 až 3,00 s (recept 1,8 až 2,2 s) |
| všetky | `--bpm` podľa vlastnej hudby, `--delenie 2` | posun strihu najviac polovica mriežky (100 BPM s polovicami dôb: 0,15 s) |

`--max-zaber` musí byť aspoň dvojnásobok `--min-zaber` (inak by delenie dalo príliš krátke časti; skript to odmietne
kódom 2). `--mierka` posúva aj prvý strih (pri 1,15 na 1,80 s, pri 1,5 na 2,40 s), recept chce prvú zmenu do 1,5 s:
prvý záber vtedy skráť v EDL alebo mu daj priblíženie (`zoom`). Medián vo výpise skriptu porovnaj s receptom vždy.

## Výsledky skúšok (klipy GYM KLUB, hudba vlastná syntéza 100 BPM)

**2026-10-19, rozbor V10 (testovacia kópia skillu):**

- V2 (sadie.ontech), 0 až 18 s, prah 0,12, 100 BPM s polovicami dôb, `--min-zaber 0.6 --max-zaber 3.5`: 10 záberov
  ako v referencii, strihy 1,50 2,10 3,60 6,60 8,40 9,00 11,40 14,70 17,10 s (referencia 1,57 2,23 3,50 6,63 8,33
  8,93 11,37 14,70 17,03 s, posun najviac 0,13 s); short.py 11 z 11, 540 snímok = 18,00 s, -13,9 LUFS, -1,9 dBTP,
  synchronizácia +2,7 ms; `--porovnaj` 9 z 9 tvrdých strihov na snímku presne; výroba 1 min 32 s.
- V10 (dazzzlme) zo `zabery.csv` (prah 0,12, zlúčenie 0,05 s, 19 záberov), bez prichytenia, `--min-zaber 0.4`,
  dva prechody `circleopen` 0,3 s: 11 záberov, 412 snímok = 13,73 s ako referencia, short.py 11 z 11, `--porovnaj`
  8 z 8 tvrdých strihov presne (2 prechody sa nemerajú); prechod začína v 11,533 s, v čase strihu referencie.
- Vstup video a vstup `zabery.csv` dali rovnakú EDL; okrajové prípady: prechod na prvom zábere, `--do` mimo
  referencie, zlé argumenty, neexistujúci klip, zlé použitie `--porovnaj` = kód 2; klip krátky aj pri rýchlosti 0,5
  = kód 1; jeden krátky klip = spomalenie s upozornením; bez hudby = upozornenie, že -14 LUFS neprejde.

**2026-10-19, pri zápise do toolboxu (z jeho umiestnenia, výstupy v scratchpade `ref-nauka/zapis-test/strih-ref/`):**
oba behy zopakované s tými istými výsledkami: V2 9 z 9 tvrdých strihov presne, short.py 11 z 11, 540 snímok,
-13,9 LUFS; V10 s dvoma prechodmi 8 z 8, 412 snímok = 13,73 s, short.py 11 z 11; prechod na prvom zábere a
`--max-zaber` menší ako dvojnásobok `--min-zaber` kód 2.

## Pasce

| Pasca | Čo sa stalo | Riešenie |
| --- | --- | --- |
| prechod posunie strihy | xfade skracuje časovú os o dĺžku prechodu (`os_strihu` v `short.py`) | `strih_podla_referencie.py` predĺži predošlý záber; overené 412 snímok = 13,73 s |
| tvar nie je ostrý | `circleopen` v xfade je mäkký kruh s polopriehľadným okrajom | ostré masky ako V10 nerobíme; pri HEAD SPA žiadne tvary |
| strih medzi podobnými zábermi | dva zábery toho istého miesta (IMG_8981, IMG_8982) môže detekcia prehliadnuť | `--porovnaj` vypíše nenájdené; v teste V2 strih 1,50 s medzi nimi našla so skóre 0,39 (prah 0,12) |
| „strih“ v 0,03 s | detekcia hlási zmenu na prvej snímke | prvé a posledné 0,05 s sa ignorujú (ako `strihy.sh`) |
| zrkadlená snímka | selfie kamera otočí text obrazovky | text čítaj zo snímky obrazovky, nie zo selfie |

## Editory napojené na Claude (V10) a čo s nimi

V10 ukazuje editor **Shorty** pripojený ku claude.ai ako vlastný konektor (remote MCP) a prompt „Recreate the
reference video's editing exactly on my footage. Match the timing, beat cuts, rhythm, pacing, composition, and all
transitions precisely.“ V relácii Claude bol pripojený aj **Descript MCP** (Agent Underlord). Porovnanie
(overené 2026-10-19; Descript len opísaný podľa schém nástrojov v relácii a help.descript.com, článok 36803785502221,
nič sme tam nevytvárali, lebo by to vytvorilo projekty na účte majiteľa a nahralo zábery bez jeho súhlasu):

| | Shorty (V10) | Descript MCP (Agent Underlord) | Náš postup |
| --- | --- | --- | --- |
| Kde beží | cloud Shorty (Tools Products FZ-LLC, SAE; Supabase; AI poskytovatelia „including“ Google Gemini a Anthropic) | cloud Descriptu | lokálne, ffmpeg |
| Referencia | nahrá sa celé video, analyzuje ho Gemini („StyleSpec“); zvuk referencie môže ísť do výstupu (podmienky od 14. 10. 2026) | zhodu s referenciou dokumentácia neuvádza; príklady ako „Add zoom cuts every 3 to 6 seconds“, časy treba napísať výslovne | len časy strihov (`strihy.sh`); obraz, zvuk ani text sa nepreberá |
| Kto rozhoduje | AI („shot plan“) | AI, nedeterministicky („might overpromise“) | človek alebo Claude podľa hárku, deterministicky |
| Overenie | náhľad v aplikácii | v Descripte | `short.py` 11 bodov a `--porovnaj` (±1 snímka) |
| Výstup | MP4 | `publish_project` (zdieľaná adresa, `access_level` až po public), `export_timeline` (EDL, FCPXML, Premiere XML, DaVinci Resolve XML, AAF) | MP4 1080×1920, -14 LUFS, bez edit listu |
| Súkromie | klientske zábery idú von (mimo EÚ) | klientske zábery idú von | nič neodchádza |
| Cena | od 19 $ mesačne (4 400 kreditov, podľa stránky ~21 strihov), bezplatný plán stránka neuvádza | AI kredity Descriptu (neoverené) | zadarmo |

Pravidlá pre cudzie strihacie služby cez Claude:

1. **Klientske zábery len so súhlasom majiteľa** a len služba, ktorej prevádzkovateľa, zásady súkromia a ďalších
   spracovateľov sme prečítali. Ľudia v zábere: aj ich súhlas so spracovaním mimo prevádzky.
2. **Vlastný konektor je cudzí server.** Dostáva dáta a môže vracať pokyny („Malicious MCP servers may include hidden
   instructions…“, support.claude.com, článok 11175166; plán Free má najviac jeden vlastný konektor). Pred pridaním
   over bez prihlásenia (POST `initialize` čaká 401, `/.well-known/oauth-protected-resource`), účet nezakladaj
   bez majiteľa; rola bezpečnosť v `../../tim-roly/`.
3. **Descript MCP:** `import_media` nahrá do cloudu Descriptu; `prompt_project_agent` (Agent Underlord) časy strihov
   zo `strih.json` napíš výslovne; `export_timeline` na prenos do vlastného strihu; `publish_project` len
   s `access_level: "private"`, nič neuverejňovať (uverejňuje majiteľ).
4. **Nikdy „recreate exactly“ cudzie video:** obraz, hudba, texty a ostré tvarové masky cudzieho autora sa
   nepreberajú; zvuk referencie vo výstupe = riziko Content ID.
5. Výsledok z cudzej služby prejde rovnakou kontrolou: `short.py --kontrola`, titulky, -14 LUFS, schválenie
   presného súboru (`schvalenie.py`).

Shorty (shortyedit.com, MCP `https://mcp.shortyedit.com/mcp`): bez prihlásenia HTTP 401 „Missing bearer token. Connect
via OAuth, or pass your shorty API key…“, OAuth s dynamickou registráciou, rozsahy `mcp openid email`; zoznam
nástrojov bez účtu nevidno (účet sme nezakladali). Nezávislú recenziu sme nenašli. Nepoužívame.
