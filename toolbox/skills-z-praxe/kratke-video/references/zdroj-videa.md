# Zdroj: tri videá z TikToku (pozreté 2026-10-11)

Stiahnuté a rozobraté postupom `../../referencie-z-videi/` (`scripts/tiktok.sh`): popis, titulky
eng-US (ASR, automatický prepis), video 576 × 1024, prehľad snímok každé 2 s a jednotlivé snímky
v plnom rozlíšení. Všetko je cudzí obsah: berieme z neho nápady, nie materiál ani tvrdenia.
Repozitáre z videí sme neotvárali (prístup k cudzím repozitárom bol v tejto práci zamietnutý),
takže nič z nich tu nie je a netvrdíme, čo v nich je.

## 1. rourke.heath, 61 s: Higgsfield v After Effects

- Adresa: https://www.tiktok.com/@rourke.heath/video/7683918425810324758
- Hovorí: model ovláda After Effects, z referenčného obrázka štýlu a zadania postaví pohyblivú
  grafiku po vrstvách, každá vrstva sa dá upraviť; postup: doplnok Higgsfield do After Effects,
  panel „Supercomputer“, model „GPT 6 Astra“, alebo to isté cez doplnok v ChatGPT.
- Ukazuje: časovú os s pomenovanými vrstvami (Glass cards, Orbit animation, Presenter cutout,
  Intro footage, Football footage, Stadium shot, Marathon footage, Run progress bar, Runner marker,
  Map transition, Route + clock, Final footage, Astra floating logo, Higgsfield logo), lower third
  so štatistikou hráča (výška 5'2", 5'5"), ukazovateľ behu START/FINISH, mapu trasy s časom;
  zadanie v paneli: „Build me an editable motion graphics lower third that has this player's stats
  on it, as well as the same football team's colour scheme and branding. His main stat should be
  his height… make it editable, and add it into the composition“. Generovanie obrázkov v paneli
  so štítkom „Nano Banana Pro“.
- Je to reklama na Higgsfield (logo v rohu celé video). Názov modelu a schopnosti sú tvrdenia
  autora, neoverené.
- Výzva autora (ignorovaná): „type AR in the comments“.

## 2. valeridoesai, 39 s: MoneyPrinterTurbo („Money Printer“)

- Adresa: https://www.tiktok.com/@valeridoesai/video/7679200985264229655
- Hovorí: bezplatný repozitár z jednej výzvy spraví celé video: scenár, hlas, titulky, hudbu
  a zábery z fotobanky; „zero humans“ a „ak to ešte robia ľudia, prichádzaš o peniaze“.
- Ukazuje (snímka 5 s): stránku repozitára na GitHube s adresou klonu
  `https://github.com/harry0703/MoneyPrinterTurbo`, v paneli About „MIT license“, 98.2k stars,
  14.5k forks, vydanie v1.3.2 (Latest); hneď za tým webové rozhranie (Video Subject, Generate
  Script & Keywords with AI, Video Source: Pexels, Video Concatenation: Random, Match Visual…,
  Video Transition: None, Video Aspect Ratio: Portrait 9:16, Maximum Clip…); štítky „Writes the Script“, „Generates the Voice-Over“, „Adds Subtitles“, „Finds Music“,
  „Pulls Stock Footage“, mriežku hotových videí s fotobankovými zábermi.
- Väčšina druhej polovice je pozvánka na vlastný webinár (odpočet, „Live seats 45 % full“).
- Výzva autora (ignorovaná): „DM me video“.

## 3. agilesingh, 35 s: MoneyPrinterTurbo

- Adresa: https://www.tiktok.com/@agilesingh/video/7688058236380925204
- Hovorí: z jednej témy napíše scenár, nájde zábery z fotobanky, vygeneruje hlas, zladí titulky,
  pridá hudbu a vyrenderuje 9 : 16, 16 : 9 alebo štvorec; pripája sa na rôzne jazykové modely;
  „dokonca automaticky uverejní na TikTok, Instagram a YouTube Shorts“; nastavenie je pre ľudí
  bez terminálu ťažkopádne.
- Ukazuje (snímky 4 až 18 s): `harry0703/MoneyPrinterTurbo` (Public), priečinky `.github`, `app`,
  `docs`, `resource`, `test`, `webui`, správy commitov o hlase (MiniMax, ElevenLabs TTS), webové
  rozhranie v1.3.2: Video Subject, Script Language (Auto Detect), „Generate Script & Keywords“,
  Video Script (Optional), Video Source: Pexels, Video Concatenation: Random, Video Transition:
  None, Video Aspect Ratio: Portrait 9:16; ukážky „Portrait 9:16“ a „Landscape 16:9“.
- Čo nevieme: počet hviezd (obraz videa 2: 98.2k, popis videa 3: 115K, reč videa 3: 125K; každé
  číslo z iného dňa, neoverené), či automatické uverejnenie naozaj existuje a ako funguje,
  licencia (karta MIT len v obraze videa 2, súbor licencie sme nečítali).

## Opravy prepisu

- „HDX after effects plugin“ je v obraze doplnok Higgsfield („Higgsfield is now inside After Effects“).
- „Money Printer“ (video 2) je MoneyPrinterTurbo (video 3, stránka repozitára v obraze).

## Čo si berieme a čo nie

Podrobne v [moneyprinterturbo.md](moneyprinterturbo.md). Pohyblivú grafiku (video 1) rieši skill
`../motion-grafika/` (súbežne vznikajúci); sem z neho ide len rozhranie: prekrytie s alfou na zábere.
