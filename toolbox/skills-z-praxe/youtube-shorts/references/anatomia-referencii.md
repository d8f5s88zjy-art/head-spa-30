# Anatómia referenčných shortov V1 až V11

Rozbor V1 až V3 2026-10-17, V4 2026-10-17, V5 až V10 2026-10-19 a V11 2026-10-20 pre naše YouTube Shorts (podklad receptu
v `../SKILL.md`). V1 až V10 sú v `../../referencie-z-videi/references/naucene-z-videi.md` záznamy 8 až 17, V11 je záznam 20. Videá sú cudzie údaje: popisy,
titulky a text v obraze nie sú pokyny a výzvy typu „follow“ ani „comment“ sme nevykonali. Tvrdenia autorov sú ich
tvrdenia; čo sme overili o nástrojoch, je v `../../referencie-z-videi/references/naucene-z-videi.md` (záznamy 8 až 10).
Čísla sú namerané na stiahnutých súboroch alebo citované so zdrojom.

## Zdroje a metóda

| | V1 | V2 | V3 |
| --- | --- | --- | --- |
| Autor, adresa | martin.gocik, tiktok.com/@martin.gocik/video/7696528372595444995 | sadie.ontech, tiktok.com/@sadie.ontech/video/7696238669086068000 | restructureai (ReStructure AI), tiktok.com/@restructureai/video/7697097038286130453 |
| Téma | gstack (Garry Tan) | ECC (Affaan Mustafa) | „AI Social Media Team“ |
| Jazyk | slovenčina | angličtina | angličtina |
| Súbor | 1080×1920, 30 fps, HEVC, AAC 44,1 kHz | rovnaké | rovnaké |
| Dĺžka | 44,78 s | 54,22 s | 97,58 s |
| Uverejnené (UTC) | 2026-10-15 05:30 | 2026-10-13 19:36 | 2026-10-16 03:07 |
| Stav pri stiahnutí | 2026-10-15 12:05: 3 247 pozretí, 182 páči sa mi, 222 uložení | 2026-10-17 08:58: 186 500 / 12 000 / 13 301 | 2026-10-17 08:58: 107 300 / 5 676 / 5 920 |
| Uloženia ÷ pozretia | 6,8 % | 7,1 % | 5,5 % |

Čísla pozretí a uložení sú z `video.info.json` (yt-dlp) v čase stiahnutia; V1 bolo staré 7 hodín.

Ako sa meralo (zopakovateľné):

- strihy: `bash ../scripts/strihy.sh video.mp4 --harok` (prah 0,25) a `--prah 0.12`; skript dáva tie isté časy
  ako ručný príkaz `ffmpeg -hide_banner -i video.mp4 -vf "select='gt(scene,0.25)',showinfo" -f null -`;
- záber = zmena kompozície (tvrdý strih alebo nový obraz po prechode), overené na kontaktných hárkoch po 0,5 s
  a v kľúčových úsekoch po 0,1 až 0,17 s; všetky hárky sme pozreli;
- zvuk: `ebur128`, `silencedetect` (-30 a -40 dB, 0,25 s), hladina a podiel basov pod 150 Hz v pauzách;
- slová za minútu: V2 a V3 z automatických titulkov (VTT), V1 z titulkov v obraze, lebo VTT pri V1 je zlý
  anglický prepis slovenčiny;
- bezpečné zóny: Google Ads „YouTube | Vertical Video Ads“ (support.google.com/google-ads/answer/9128498,
  stiahnuté 2026-10-17): 288 px hore, 672 px dole, 48 px vľavo, 192 px vpravo pri 1080×1920.

Hárky, snímky, dáta meraní a skripty rozboru ostali v scratchpade relácie (`shorts-nauka/format/`), nie v repozitári.
Obmedzenia: prepis reči (whisper) tu nie je; pôvod b-rollu a hlasu z obrazu neurčíme; písma odhadujeme podľa
tvaru písmen; hudbu len nepriamo z čísel (nepočúvali sme).

## Porovnanie

| | V1 gstack | V2 ECC | V3 AI marketing |
| --- | --- | --- | --- |
| Strihy, ffmpeg prah 0,25 | 13 | 36 detekcií v 23 udalostiach (záblesky dávajú zhluky) | 10 |
| Záberov (overené) | 23 | 27 | 14, vo vnútri 36 vizuálnych krokov |
| Priemer / medián záberu | 1,95 / 2,00 s | 2,01 / 1,57 s | 6,97 / 3,26 s; kroky 2,71 / 2,51 s |
| Najkratší / najdlhší záber | 0,76 / 3,20 s | 0,43 / 5,13 s | 1,87 / 28,70 s (animovaný mini tok) |
| Prvá zmena obrazu | 1,43 s | 1,57 s | 2,77 s |
| Tvár | 81 % času (dole alebo na celú obrazovku), chýba len pri grafike na celú obrazovku | 0 až 3,50 s a 50,93 až 54,22 s (13 %) | žiadna |
| Titulky | frázy 1 až 3 slová, pilulka alebo biely text | 1 slovo, bez podkladu; v hooku pevný nadpis | 2 až 5 slov, obrys; len v úvode a na diagrame (33 % času) |
| Reč | 140 slov, 188 slov/min (slovensky) | 143 slov, 159 slov/min | 279 slov, 172 slov/min |
| Pauzy ≥ 0,25 s pod -30 dB | 0 | 0 | 16 (0,27 až 0,49 s) |
| Hudobný podklad | nezistený | áno, basový | nezistený |
| Hlasitosť (integrovaná) | -15,8 LUFS | -10,8 LUFS | -16,6 LUFS |
| Druhý hook | 33,1 s „Najlepšie na tom je“ (74 %) | 26,6 s „Here's the part that makes this insane“ (49 %) | kapitoly „Module one/two/three“ 19,4 / 50,3 / 64,6 s |
| Výzva | 41,9 s, 2,9 s dlhá: follow | 50,8 s, 3,4 s: save a follow | 94,6 s, 3,0 s: like a follow |

## V1 martin.gocik: gstack (44,78 s)

### a) Časová os

Tri rozloženia: **A** delená obrazovka (grafika na svetlosivom plátne s jemnou mriežkou v hornej ~45 %, autor
dole), **B** tvár na celú obrazovku (digitálne priblíženie toho istého záberu), **C** grafika na celú obrazovku.

| # | Čas (s) | Dĺžka | Rozl. | Obraz | Reč (z titulkov v obraze) |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,00–1,43 | 1,43 | A | avatar Garry Tan sa zväčší (0 až 0,17 s), meno, štítok „šéf Y Combinatoru“ (0,5 s) | Šéf Y Combinatoru |
| 2 | 1,43–3,67 | 2,24 | A | repozitár garrytan/gstack na GitHube, odznak s hviezdami rastie až na 135 669 (~1,6 až 3,0 s) | dal na GitHub celý svoj setup pre Claude Code |
| 3 | 3,67–4,43 | 0,76 | B | priblíženie na tvár | a je zadarmo. |
| 4 | 4,43–5,70 | 1,27 | A | README, odstavec v rámiku, okolie stmavené (4,9 až 5,3 s) | Volá sa gstack a v podstate |
| 5 | 5,70–8,23 | 2,53 | A | slajd „The Sprint Process“, 7,37 s priblíženie | z celého Claude Code ti spraví celý tím. |
| 6 | 8,23–9,43 | 1,20 | C | veľké číslo rastie na 23 za ~0,45 s, pilulka „nástrojov cez /“ | Je to dvadsaťtri nástrojov, |
| 7 | 9,43–10,93 | 1,50 | A | maketa Claude Code, písanie „/office-hours I'm trying to do a startup…“ | ktoré spúšťaš cez lomítko. |
| 8 | 10,93–12,47 | 1,54 | A | ikona CEO | Po prvé máš tam CEO, |
| 9 | 12,47–14,77 | 2,30 | A | README, tabuľka „The sprint“ | ktorý ti ešte pred kódom rozoberie celý produkt. |
| 10 | 14,77–17,13 | 2,36 | A | ikona „Eng manažér“ | Potom tam máš engineering manažéra, ktorý ti |
| 11 | 17,13–18,93 | 1,80 | B | tvár | zamkne vlastnú architektúru. |
| 12 | 18,93–20,43 | 1,50 | A | „Design exploration“ (možnosti A, B, C) | Dizajnér ti odchytí AI |
| 13 | 20,43–21,33 | 0,90 | A | tmavý „Command center“ (ukážka výstupu) | slop v dizajne. |
| 14 | 21,33–22,53 | 1,20 | A | ikona „Review“ | Review ti nájde bugy, |
| 15 | 22,53–25,00 | 2,47 | B | tvár | ktoré by ti ináč prešli až do produkcie. |
| 16 | 25,00–27,00 | 2,00 | A | maketa „/qa https://staging.myapp.com“, okno prehliadača, štítok „QA kliká v prehliadači“ | A QA otvorí reálny prehliadač, |
| 17 | 27,00–29,87 | 2,87 | A | editor s testom „checkout keeps cart“ + zoznam Preklikne flow, Nájde bug, Opraví príčinu, Overí opravu | preklikne sa tvojou aplikáciou a rovno opraví chyby. |
| 18 | 29,87–33,07 | 3,20 | A | maketa terminálu „git clone …/gstack.git && ./setup“, „✓ hotovo za ~30 sekúnd“ | Celé to nainštaluješ jedným príkazom za menej ako tridsať sekúnd. |
| 19 | 33,07–34,83 | 1,76 | B | tvár | Najlepšie na tom je, že je to open source, |
| 20 | 34,83–37,00 | 2,17 | C | „Prémiová verzia“ sa preškrtne (35,2 s), zelená fajka „Všetko zadarmo“ (35,6 s) | zadarmo a bez žiadnej prémiovej verzie. |
| 21 | 37,00–39,13 | 2,13 | C | logo GitHub, počítadlo 0+ → 130 000+ „hviezd na GitHube“ (37,0 až 38,5 s) | Repo má viac ako stotridsaťtisíc hviezd. |
| 22 | 39,13–41,93 | 2,80 | C | ikony CEO, Eng manažér, Dizajnér, Review, QA, Claude Code pribúdajú po ~0,33 s | Namiesto jedného AI asistenta máš rovno celý tím. |
| 23 | 41,93–44,78 | 2,85 | B | tvár | Daj mi follow, aby ti neunikol ďalší podobný setup. |

23 záberov, 22 strihov, priemer 1,95 s, medián 2,00 s. ffmpeg (0,25) našiel 13 strihov; ostatné zmeny sú len
v hornom paneli (prelínanie, nevýrazné pre celý obraz). Autor je v zábere okrem rozloženia C
(8,2 až 9,4 a 34,8 až 41,9 s, spolu 8,3 s); inak sa mení len výrez.

### b) Hook

- 0 až 1 s, obraz: hore biele plátno, kruhová fotka Garryho Tana sa zväčší (0 až 0,17 s), meno „Garry Tan“
  sa objaví krytím, pod ním tmavý štítok „šéf Y Combinatoru“ (0,5 s); na švíku pilulka „Šéf Y Combinatoru“;
  dole autor zblízka, hľadí do kamery, hovorí od prvej snímky. Zaznie „Šéf Y Combinatoru…“.
- 0 až 3 s: 1,43 s skutočná stránka repozitára (popis „Use Garry Tan's exact Claude Code setup: 23 opinionated
  tools…“, 135.7k stars, MIT), odznak hviezd rastie a spomaľuje; zaznie „…dal na GitHub celý svoj setup pre
  Claude Code“ (do 3,6 s), 3,67 s strih na tvár „a je zadarmo“.
- Prečo funguje: známe meno a funkcia (autorita) v prvej sekunde; hmatateľný dôkaz (repozitár) do 1,5 s;
  pohyb od prvej snímky (zväčšenie, počítadlo); sľub dostaneš celý setup; odmena „zadarmo“ zvýraznená strihom
  na tvár v 3,7 s. Náš `hook_skore.py` dáva prvej vete 36 (slabý: dlhá, bez oslovenia); autoritu a obraz
  skóre nevidí, preto ho používaj len na porovnanie viet medzi sebou.

### c) Titulky v obraze

- Dva štýly. Pri rozložení A a C: biely tučný bezpätkový text (grotesk podobný Inter alebo SF Pro), veľké
  písmená ~50 px (písmo ~70 px), v tmavej zaoblenej pilulke RGB 34, 36, 35, výška pilulky ~100 px, vnútorný
  okraj ~28 px. Poloha: na švíku polovíc y ≈ 800 až 900 px (42 až 47 % výšky), pri C nižšie a väčšie, pilulka
  y ≈ 1500 až 1612 px (78 až 84 %). Pri B (tvár): biely tučný text bez podkladu s jemným tieňom, ~50 px, y ≈ 1312 až 1362 (68 až 71 %).
- Frázy po 1 až 3 slovách (priemer ~2,2 slova), asi 64 titulkov, nový každých ~0,7 s; objavenie krytím ~0,17 s.
  Žiadne slovo nie je zvýraznené farbou; dôraz nesie grafika hore.
- Chyby: pri strihoch A → B (17,0 s „ti“, 33,0 s „sekúnd“) ostala pilulka zo švíku jednu až dve snímky na očiach; „preklikne sa tvojou“ bez „s“.
- Bezpečné zóny (YouTube, Google 48/288/192/672): pilulka na švíku je vnútri; titulky na tvári a pri grafike
  na celú obrazovku sú v dolnom páse (pod 1248 px), kde na YouTube býva názov a kanál; odznak hviezd
  (x 730 až 1010) zasahuje do pravého pásu tlačidiel. Na TikToku je dolný text bežne vyššie, preto to tam
  nevadí.

### d) Vizuálne vrstvy

- Hovoriaca hlava: jedna kamera, autor pri stole, mikrofón v zábere vpravo dole, rozmazané pozadie s modrým
  a fialovým svetlom. Rozloženie B je priblíženie toho istého záberu (punch-in), striedané s A, takže strih
  reči nie je vidieť.
- Nahrávky obrazovky (skutočné stránky): repozitár, README s rámikom a stmaveným okolím, slajd The Sprint Process,
  tabuľka v README, Design exploration, Command center.
- Makety (animovaná grafika, nie nahrávka): okno Claude Code s písaním príkazu, /qa s oknom prehliadača,
  editor s odškrtávaným zoznamom, terminál s „hotovo za ~30 sekúnd“.
- Čísla a karty: odznak hviezd (rast s dobehom), číslo rastúce na 23 na celú obrazovku, „Prémiová verzia“
  preškrtnutá červenou a zelená fajka „Všetko zadarmo“, počítadlo „130 000+ hviezd na GitHube“, ikony rolí
  (farebné symboly v bielych zaoblených dlaždiciach) pribúdajú po ~0,33 s s malým zväčšením.
- Prechody: tvrdé strihy; v paneli prelínanie a zväčšenie ~0,15 až 0,2 s; zvýraznenie výrezu stmavením okolia.

### e) Zvuk

- Jeden hlas zblízka. V pauzách ~-40 dBFS a len 9 % energie pod 150 Hz, žiadny pravidelný rytmus: hudobný podklad
  sme nezistili (tichú hudbu to celkom nevylučuje).
- Žiadna pauza dlhšia ako 0,25 s pod -30 dB: nádychy a pauzy sú vystrihnuté, strihy reči kryje grafika a punch-in.
- 140 slov za 44,7 s = 188 slov/min (odhad ~6 slabík/s). Na slovenčinu veľmi rýchlo, zrozumiteľnosť drží
  titulok na každej fráze. -15,8 LUFS, rozsah hlasitosti 2,5 LU (silne skomprimované).

### f) Štruktúra

| Čas (s) | Časť |
| --- | --- |
| 0,0–3,7 | hook: autorita + predmet (setup na GitHube) |
| 3,7–4,4 | odmena: zadarmo |
| 4,4–8,2 | čo to je: gstack, „celý tím“ |
| 8,2–10,9 | číslo: 23 nástrojov cez lomítko |
| 10,9–29,9 | ako to funguje po rolách, vždy „rola + čo ti urobí“: CEO 10,9; Eng manažér 14,8; Dizajnér 18,9; Review 21,3; QA 25,0 |
| 29,9–33,1 | inštalácia jedným príkazom |
| 33,1–39,1 | druhý hook „Najlepšie na tom je“ + dôkaz: open source, bez prémiovej verzie, 130 000+ hviezd |
| 39,1–41,9 | zhrnutie obrazom: všetky ikony naraz |
| 41,9–44,8 | výzva: follow (93,6 % dĺžky) |

### g) Klišé a zavádzajúce

- „Z Claude Code ti spraví celý tím“, „namiesto asistenta celý tím“: roly sú sady pokynov (README: „all slash
  commands, all Markdown“), nie ľudia.
- „Jedným príkazom za menej ako 30 sekúnd“ ukazuje maketa terminálu, nie nahrávka. README (klon z 2026-10-14,
  riadok 47) vyžaduje Git, Bun v1.4.2+ a na Windows Node.js a setup stavia aj vlastný prehliadač.
- „Review nájde bugy, ktoré by ti prešli až do produkcie“, „QA rovno opraví chyby“: sľub výsledku.
- Počítadlá hviezd od nuly sú efekt, nie vývoj. Na snímke repozitára (2,0 s) je 135.7k; cez API sme
  neoverovali. „Bez prémiovej verzie“: README spomína aj „private paid CSO evaluation producer“ (riadok 414),
  čo to znamená, patrí do rozboru nástroja.
- Cudzia tvár a meno ako hook (fotka Garryho Tana). U nás nie.

### Lekcia pre nás

Berieme: reč a pohyb od 0,0 s, dôkaz (skutočná stránka) do 1,5 s, odmenu zvýraznenú strihom, striedanie tváre
a obsahu ako krytie strihov reči, kroky jednou vetnou šablónou, druhý hook „Najlepšie na tom je“ v 74 %, pilulku
titulku na tmavom podklade. Neberieme: cudziu tvár a meno ako hook, makety vydávané za nahrávku, počítadlá od nuly,
tempo 188 slov/min, anglicizmy v titulkoch, titulky v dolnom páse.

## V2 sadie.ontech: ECC (54,22 s)

### a) Časová os

| # | Čas (s) | Dĺžka | Obraz | Reč (VTT) |
| --- | --- | --- | --- | --- |
| 1 | 0,00–1,57 | 1,57 | hore čierna bodkovaná textúra, žiariaca ikona človeka, text „One guy just replaced“ po slovách; pevný nadpis „ONE DEVELOPER VS / AN ENTIRE TEAM“; dole moderátor | One guy just replaced |
| 2 | 1,57–2,23 | 0,66 | hore muž pri počítači | your entire |
| 3 | 2,23–3,50 | 1,27 | hore tím zhora pri stole; 3,33 s tvár do červena | engineering team |
| 4 | 3,50–6,63 | 3,13 | oranžový záblesk; b-roll stôl s hodinami 07:43, karta GitHub, potom „I'm not even exaggerating.“ | and dropped it on GitHub for free. No exaggeration. |
| 5 | 6,63–8,33 | 1,70 | záblesk; karta README ECC „The operating system for AI agent harnesses“; 8,17 s švih s rozmazaním | It's called ECC. |
| 6 | 8,33–8,93 | 0,60 | ruky na klávesnici zhora | One developer |
| 7 | 8,93–11,37 | 2,44 | muž pri stole, šesťuholníky na stene | shipped it alone in 10 months |
| 8 | 11,37–14,70 | 3,33 | čierne pozadie, bočný panel GitHubu, „256.0k stars“ zvýraznené | and it already crossed 250,000 stars. |
| 9 | 14,70–17,03 | 2,33 | záblesk; loft kancelária | You can install it in 30 seconds |
| 10 | 17,03–19,67 | 2,64 | ikony Claude code, Cursor, Codex po ~0,5 až 1 s | in Claude Code, Cursor or Codex |
| 11 | 19,67–23,30 | 3,63 | muž s notebookom, karta Claude Code, písanie „/plugin marketplace add ECC“ | type /plugin marketplace add ECC |
| 12 | 23,30–26,80 | 3,50 | detail, „/plugin install ECC“ | then /plugin install ECC. Done. |
| 13 | 26,80–27,23 | 0,43 | oranžový záblesk, monitor | Here's |
| 14 | 27,23–28,23 | 1,00 | ruka na myši, hrnček | the part that makes |
| 15 | 28,23–29,00 | 0,77 | muž premýšľa | this insane. |
| 16 | 29,00–30,23 | 1,23 | klávesnica, karta, písanie „Plan“ | Tell it to plan |
| 17 | 30,23–33,20 | 2,97 | karta „Plan this feature“ s diagramom | and one agent maps out your entire architecture. |
| 18 | 33,20–34,70 | 1,50 | „Build it“ | Tell it to build |
| 19 | 34,70–36,40 | 1,70 | „Build it“, terminál | and it writes working code in whatever stack you use. |
| 20 | 36,40–41,53 | 5,13 | „Secure it“, okno sa mení pri 37,0 a 40,2 s | Tell it to secure and it runs its own attacks on your app to catch gaps early. |
| 21–24 | 41,53–45,37 | 0,97; 1,00; 1,00; 0,87 | „Test it“ na štyroch b-rolloch | Tell it to test and it grinds until coverage hits 80%. |
| 25 | 45,37–49,53 | 4,16 | záblesk; tím v kancelárii, „64 AGENTS“ (45,5 s), „261 SKILLS“ (46,8 s), žlté „ALL FREE“ (47,3 s) | 64 agents, 261 skills, all free. |
| 26 | 49,53–50,93 | 1,40 | ruky na notebooku zhora; záblesk | Super super cool. |
| 27 | 50,93–54,22 | 3,29 | moderátor na celú obrazovku | Save this workflow and follow for more AI setups you can copy. |

27 záberov, priemer 2,01 s, medián 1,57 s. ffmpeg (0,25) dal 36 detekcií, lebo každý záblesk sa rozpadne
na 3 až 6 susedných snímok (napr. 6,63 až 6,87 s); zlúčené je to 23 udalostí.

### b) Hook

- 0 až 1 s, obraz: delená obrazovka. Hore text „One guy just replaced“ sa skladá po slovách s rozmazaním
  (blur-in, ~0,17 s na slovo), pod ním biela žiariaca ikona človeka; v strede pevný dvojriadkový nadpis
  „ONE DEVELOPER VS / AN ENTIRE TEAM“; dole moderátor v štúdiu (drevené lamely, lampa, monitor s grafom)
  hovorí od prvej snímky. Zaznie „One guy just replaced…“.
- 0 až 3 s: hore 1,57 s jeden muž pri počítači, 2,23 s tím zhora, teda „jeden proti tímu“ aj obrazom;
  3,33 s tvár sčervenie, 3,50 s oranžový záblesk do b-rollu. Zaznie „One guy just replaced your entire
  engineering team“ (0,00 až 3,42 s) „and dropped it on GitHub for free“ (3,42 až 5,38 s).
- Prečo funguje: konflikt a hrozba („your team“), protiklad jeden/tím vyslovený, napísaný aj ukázaný,
  nadpis čitateľný bez zvuku, tvár pre dôveru, zmena obrazu každých 0,7 až 1,3 s, „for free“ do 5,4 s.

### c) Titulky v obraze

- Pevný nadpis v hooku (0 až 3,5 s): ťažké geometrické verzálky (typ Montserrat alebo Poppins v najťažšom reze),
  veľké písmená ~68 px (písmo ~90 px), šírka 863 px (80 % šírky), y 885 až 1032 px (46 až 54 %), prvý riadok žltý
  (RGB ~243, 208, 18), druhý biely, tmavý tieň.
- Animovaný text v hornej polovici a v kartách: „One guy just replaced“, „I'm not even exaggerating.“
  (slovo „exaggerating“ zelené so žiarou).
- Bežné titulky: jedno slovo naraz (143 slov za 54 s, slovo ~0,38 s), malé písmená, biele tučné geometrické
  písmo (typ Poppins), výška malých písmen ~32 px (písmo ~55 až 60 px), mäkký čierny tieň, bez podkladu,
  y ≈ 1392 až 1424 px (72 až 74 %), na strede.
- Číselné karty: „64 AGENTS“, „261 SKILLS“, „ALL FREE“ (posledný riadok žltý), biele verzálky s tieňom,
  pribúdajú po riadkoch.
- Bezpečné zóny: slová sú v dolnom páse (pod 1248 px); „VS“ v nadpise (x do 972) zasahuje do pravého pásu;
  „One guy just replaced“ (y ~250 až 330) zasahuje do horného pásu (pod 288 px). Pre TikTok bežné,
  pre YouTube riskantné.

### d) Vizuálne vrstvy

- Moderátor len 13 % času: štúdiový záber, gestá rúk. Či je to skutočný človek alebo AI avatar, z obrazu
  neurčíme (účet sa volá sadie.ontech, hovorí muž; v tvári pri 52,0 s farebný šum, aký robí silná kompresia
  aj generovanie). Ako vzor ho neberieme.
- B-roll ~73 % času: cudzie kancelárie a stoly, rôzni ľudia a miesta, nič nesúvisí s ECC. Pôvod (fotobanka
  alebo generované) popis neuvádza. Pomalé priblíženie záberov.
- Nad b-rollom tmavé plávajúce karty (~70 % šírky, zaoblené, s tieňom) s maketami: logo GitHub, README ECC,
  panel s hviezdami, okno Claude Code (Chat, Cowork, „Sonnet 5 Medium“) s písaním príkazov, diagram plánu, terminál.
- Ikony nástrojov na čiernom po ~0,5 až 1 s.
- Prechody: teplé záblesky svetla (oranžovo-červené až bielo-žlté) 0,2 až 0,4 s (3,5; 6,6; 14,7; 26,8; 45,4; 50,8 s),
  švih s rozmazaním pohybom (8,17 s), karta a nápis „64 AGENTS“ sa objavia z rozmazania (20,3 a 45,5 s),
  inak tvrdé strihy.

### e) Zvuk

- Hlas a pod ním nepretržitý basový podklad: v pauzách -27 dBFS a 65 % energie pod 150 Hz (v reči 34 %).
  Pravidelný rytmus (beat) sme nenašli, skôr basová plocha. Žiadna pauza ≥ 0,25 s ani pod -40 dB.
- 159 slov/min, -10,8 LUFS (o 3 až 6 dB hlasnejšie ako V1 a V3), rozsah 3,8 LU.
- Krátke vysokofrekvenčné nárazy pri prechodoch zodpovedajú aj sykavkám v reči („stars“, „save“),
  zvukové efekty (švihy) preto netvrdíme.

### f) Štruktúra

| Čas (s) | Časť |
| --- | --- |
| 0,0–5,4 | hook: konflikt „jeden nahradil tvoj tím“ + zadarmo |
| 5,4–8,1 | „No exaggeration“, meno ECC |
| 8,1–14,6 | dôkaz: jeden vývojár, 10 mesiacov, 250 000 hviezd |
| 14,6–26,6 | inštalácia v dvoch príkazoch |
| 26,6–28,8 | druhý hook „Here's the part that makes this insane“ (49 %) |
| 28,8–45,2 | štyri kroky jednou šablónou „Tell it to …“: plan 28,8; build 32,9; secure 36,9; test 41,4 |
| 45,3–50,8 | čísla na celú obrazovku: 64, 261, zadarmo |
| 50,8–54,1 | výzva: ulož si a sleduj (93,7 %) |

### g) Klišé a zavádzajúce

- „Replaced your entire engineering team“ a hneď „No exaggeration“: hyperbola, ktorú autor sám poprie (vzorec).
- „One developer… alone in 10 months“, „250,000 stars“ (na snímke 256.0k): tvrdenia, neoverené.
- Inštalácia je zjednodušená: README ECC (klon z 2026-10-15, riadky 290 a 291) uvádza
  `/plugin marketplace add https://github.com/affaan-m/ECC` a `/plugin install ecc@ecc`.
- „64 agents, 261 skills“: README dnes uvádza 71 agentov a 311 skills (riadok 144), inde 67 a 281 (riadok 1842);
  čísla sa menia s verziou.
- „Runs its own attacks on your app“, „grinds until coverage hits 80%“: sľuby výsledku.
- Cudzí ľudia v b-rolle naznačujú tím, ktorý nie je. „Super super cool“ je výplň.

### Lekcia pre nás

Berieme: protiklad v hooku čitateľný bez zvuku (nadpis), zmenu obrazu každých 0,7 až 1,3 s v úvode, štyri kroky
jednou šablónou („Tell it to …“, u nás napríklad „Prídeš. Sadneš si. …“), číselnú kartu len s overeným číslom
a dátumom. Neberieme: b-roll cudzích ľudí a miest, moderátora neistého pôvodu, staré čísla, záblesky pri pokojnej
značke, basový podklad a -10,8 LUFS, slová po jednom v celom videe, sľuby výsledku.

## V3 restructureai: AI Social Media Team (97,58 s)

### a) Časová os

| # | Čas (s) | Dĺžka | Obraz | Reč (VTT, skrátené) |
| --- | --- | --- | --- | --- |
| 1 | 0,00–2,77 | 2,77 | celý veľký diagram „AI Social Media Team That Runs Your Marketing“ | So I just spent over 200 hours building |
| 2 | 2,77–7,73 | 4,96 | mini tok: logá Meta Ads, Instagram, TikTok, Facebook, Store → ads.db, leads.db, sales.db → Claude Code → oddelenia; počítadlá 3→28 reklám, 8→63 kupujúcich, $5,199→$41,200 | an AI social media team. And today I'm giving you the exact blueprint for free. |
| 3 | 7,73–9,60 | 1,87 | celý diagram | Here's how it works. |
| 4 | 9,60–15,90 | 6,30 | priblížený diagram, posun po oddeleniach v 8 krokoch po ~0,73 s | It handles research, ads, content, posting, leads, sales calls, follow-ups and reviews. |
| 5 | 15,90–19,47 | 3,57 | celý diagram | But no ad or post goes live until you sign off on it. |
| 6 | 19,47–21,57 | 2,10 | priblížené Paid Ads, okolie stmavené (20,4 až 20,9 s) | Module one: ads. You set the budget |
| 7 | 21,57–50,27 | 28,70 | mini tok modulu 1: rozpočet $0 → $500 a prepínač „Never spend over $500/week“ (21,6), mriežka 9 reklám konkurencie, skenovanie, víťazi zelení, „scanned 412 competitor ads“ (24,9), Claude píše 20 reklám (33,6), Higgsfield fotky → video (37,6), ElevenLabs hlasy (40,8), telefón „Approved · 20 ads“ a odpočet 0h → 47h (43,6), rozdelenie rozpočtu $500/$500 (46,5) | like $500 for the week … Then Jev moves your budget to the winners. Never over your limit. |
| 8 | 50,27–52,73 | 2,46 | priblížený Lead Capture, stmavenie | Module two: leads. |
| 9 | 52,73–64,60 | 11,87 | mini tok modulu 2: komentáre a DM z IG, TikToku a FB pribúdajú (52,7), otázky zvýraznené a označené ako kupujúci (60,2), telefón s DM a formulárom „Get your quote“ (62,0) | It reads every comment and DM … sends them a link to leave their number. |
| 10 | 64,60–67,07 | 2,47 | priblížený Sales Response, stmavenie | Module three: sales. When a buyer |
| 11 | 67,07–81,07 | 14,00 | mini tok modulu 3: nový kontakt a odpočet 0:04 → 0:47 „of 60 sec“ (67,1), prichádzajúci hovor (68,5), rozhovor (70,6), kalendár, termín (73,5), upozornenie „BIG DEAL $24,800“ (76,0), „You 47 sec / Most next day“ (77,6) | leaves their number, an ElevenLabs voice agent calls them back within 60 seconds … Most businesses call back the next day. |
| 12 | 81,07–83,53 | 2,46 | iný výrez diagramu („The Brain“), stmavenie | By then, the buyer's gone. And running the whole thing, Claude Code. |
| 13 | 83,53–94,63 | 11,10 | mini tok: databázy → growth.db a SQL (83,5), tabuľka „Ad attribution“ (87,0), „Growth dashboard“ (89,5) | It connects the ads, the comments and the calls … Every morning you get a one page summary. Not just more followers, more customers. |
| 14 | 94,63–97,58 | 2,95 | celý diagram | Hit like and follow for more system design content. |

14 záberov, priemer 6,97 s, medián 3,26 s; s krokmi vnútri mini tokov a posunmi po diagrame 36 krokov,
priemer 2,71 s, medián 2,51 s. ffmpeg (0,25) našiel 10 strihov: posuny po diagrame áno, prelínania na bielom nie.

### b) Hook

- 0 až 1 s, obraz: celý hustý diagram, nadpis „AI Social Media Team That Runs Your Marketing“ (~70 % šírky),
  nad ním logá Claude, ElevenLabs, Higgsfield a fialová ikona, vpravo hore „ReStructure AI“, vľavo čierny panel
  so zoznamom .md súborov. Žiadna tvár, kamera stojí do 2,77 s. Titulok „So I just spent over“ (0 až 1,1 s),
  potom „200 hours“ (1,1 až 1,7 s).
- 0 až 3 s: zaznie „So I just spent over 200 hours building an AI social media team.“ (0,00 až 3,84 s);
  2,77 s strih na mini tok, ktorý sa skladá, a 4,5 až 6,5 s rastú počítadlá.
- Prečo funguje: číslo námahy (200 hodín) dáva hodnotu, výsledok „social media team“ je v prvej vete,
  hustý diagram ľudí zastaví a priblížia si ho, sľub „exact blueprint for free“ do 7,4 s vedie k uloženiu.
  Slabina: prvé 2,8 s statický obraz bez tváre a diagram je na telefóne nečitateľný.

### c) Titulky v obraze

- Biele tučné bezpätkové písmo (typ Inter) s hrubým čiernym obrysom ~6 až 8 px, tesné rozostupy, takže sa písmená
  obrysom zlievajú („Module one: ads.“). 2 až 5 slov, y ≈ 1368 až 1415 px (71 až 74 %), na strede.
- Len v úvode (0 až 21,6 s, vrátane prvého mini toku) a na diagrame, spolu ~32 s, 33 % videa. V mini tokoch
  modulov (21,6 až 50,3; 52,7 až 64,6; 67,1 až 81,1; 84,0 až 94,6 s, spolu ~65 s, 67 %) titulky nie sú, text nesú len popisky makiet. Bez zvuku divák v dvoch tretinách
  videa nevie, čo sa hovorí.
- Kapitoly „Module one/two/three“ sú len titulky nad stmaveným diagramom, nie samostatné karty.
- Bezpečné zóny: titulky v dolnom páse (pod 1248 px).

### d) Vizuálne vrstvy

- Bez tváre a bez b-rollu. Dve vrstvy:
  1. Veľký statický diagram (infografika). Pohyb robí len virtuálna kamera: priblíženie, posun po oddeleniach
     v krokoch ~0,73 s synchronne s vymenúvaním (9,6 až 15,9 s), stmavenie okolia a rozsvietenie jedného
     oddelenia (20,4 až 20,9; 51,2 až 51,7; 65,5 až 66,0; 82,0 až 82,5 s).
  2. Mini toky na bielom: hore riadok uzlov (logá spojené čiarou, aktívny uzol v zelenom rámiku, ostatné šedé),
     dole karta s animovanou maketou: písanie sumy, prepínač, mriežka reklám so skenovaním, počítadlo
     „20/20 ads written“, hlasové vlny, telefón so schválením, kruhový odpočet, stĺpcový graf rozpočtu, zoznam
     komentárov so zvýraznením, telefón s DM a formulárom, odpočet „of 60 sec“, hovor, kalendár, upozornenie,
     porovnanie rýchlosti, databázy a SQL, tabuľka, dashboard.
- Všetky čísla v maketách sú ukážkové dáta (značka „Groove & Grain“, zákazník „Marcus R.“), nie výsledky.
- Prechody: tvrdý strih zo stmaveného diagramu do mini toku (skóre scény 1,00 pri 21,57; 52,73; 67,07 a 83,53 s);
  prvý vstup do mini toku (2,77 s) a návraty na diagram (7,73; 50,27; 81,07; 94,63 s) majú len 0,15 až 0,24, preto ich
  prah 0,25 nenájde; v mini toku krytie a posun ~0,3 s.

### e) Zvuk

- Hlas, v pauzách -41 dBFS a málo basov: hudobný podklad sme nezistili. Pôvod hlasu (človek alebo syntéza) nevieme.
- 16 krátkych pauz 0,27 až 0,49 s, viaceré tesne pred strihom na kapitolu (52,27 až 52,76 s pred strihom 52,73;
  64,41 až 64,72 pred 64,60): pauza ohlasuje novú časť.
- 172 slov/min, -16,6 LUFS, rozsah 2,7 LU.

### f) Štruktúra

| Čas (s) | Časť |
| --- | --- |
| 0,0–3,8 | hook: 200 hodín, AI tím |
| 3,9–7,4 | sľub: presný návod zadarmo |
| 7,5–15,6 | prehľad: 8 úloh, posun po diagrame |
| 15,7–19,3 | poistka: nič nejde von bez tvojho schválenia |
| 19,4–52,2 | kapitola 1 reklamy (7 krokov) |
| 52,2–64,4 | kapitola 2 leady |
| 64,6–79,1 | kapitola 3 predaj, kontrast „most businesses call back the next day“ (77,1 s) |
| 79,1–89,4 | spojenie: ktorá reklama priniesla ktorého zákazníka |
| 89,4–94,6 | výsledok: ranný súhrn, „nie viac sledovateľov, viac zákazníkov“ |
| 94,6–97,4 | výzva: like a follow (97 %) |

### g) Klišé a zavádzajúce

- „200 hours“ sa nedá overiť; „exact blueprint for free“ video neodovzdá (popis nemá odkaz, výzva je like a follow).
- „Runs your entire marketing“ proti „nothing goes live until you sign off“ (poistka je správna, nadpis preháňa).
- Ukážkové čísla ($41,200, 63 kupujúcich, 95×) vyzerajú ako výsledky.
- Automatické čítanie komentárov a DM a posielanie odkazov v mene účtu, automatický hovor do 60 s:
  v našej praxi zakázané (len návrhy, hovor len so súhlasom; právny rozbor je v inej časti).
- „Most businesses call back the next day“: tvrdenie bez zdroja. Cudzie logá v celom obraze.

### Lekcia pre nás

Berieme: poistku nahlas („nič nejde von bez tvojho schválenia“), kapitoly s pauzou 0,3 až 0,5 s pred nimi,
reťaz uzlov hore ako ukazovateľ postupu, domovský záber, ktorý sa vracia (u nás napríklad dvere prevádzky),
zvýraznenie výrezu stmavením okolia. Neberieme: statický úvod 2,77 s, obraz nečitateľný na telefóne, titulky len
v tretine času, ukážkové čísla vyzerajúce ako výsledky, „200 hodín“ a „blueprint zadarmo“ ako háčik, automatické
správy a hovory (v našej praxi zakázané, právny rozbor v `../../instagram-salon/references/pravne-hranice.md`).

## Porovnanie V4 až V10 (rozbory 2026-10-17 a 2026-10-19)

Zdroje, metóda a overenie tvrdení: `../../referencie-z-videi/references/naucene-z-videi.md`, záznamy 11 až 17.
V8 až V10 sú reels z Instagramu bez titulkov (text čítaný zo snímok), počet pozretí Instagram nedáva.

| | V4 God's Eye View | V5 Agency Agents | V6 „Unethical“ | V7 „0x Alpha“ | V8 TRELLIS.2 | V9 „$10,000 website“ | V10 strih cez Claude |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dĺžka | 66,07 s | 76,72 s | 36,20 s | 27,93 s | 48,19 s | 31,30 s | 13,73 s |
| Záberov (overené) | 27 v páse 16:9 | 36 (prah 0,12) | 25 (prah 0,12) | 1, bez strihu | 21 (ručne) | 25 (prah 0,12) | 8 scén (prah 0,25), na konci 11 zmien za 2,2 s |
| Medián záberu | 2,07 s | 1,82 s | 1,35 s | 27,93 s | 2,10 s | 1,07 s | 1,95 s |
| Prvá zmena obrazu | 0,87 s | 2,67 s | 1,08 s | 4,50 s (zmizne štítok) | 3,50 s (pohyb od 0,0 s) | 2,13 s (web hore 1,7 s) | 3,10 s |
| Tvár | 46 % | ~11 % na celú obrazovku | 73 % | 100 % (green screen) | 85 % | ~34 % | len hook (selfie 0 až 3,1 s) |
| Text v obraze | stály titulok 3 riadky, reč bez titulkov | 1 slovo, ~77 % výšky | 1 až 3 slová, 100 % času, farby s významom | žiadne titulky, štítok 4,5 s | pilulka 1 až 3 slová | 2 až 4 slová bez podkladu | jeden riadok hore (16 až 23 % výšky) |
| Reč | ~165 slov/min | 175 slov/min | 258 slov/min | 137 slov/min | 169 slov/min | ~230 slov/min (odhad z titulkov) | neurčená |
| Hlasitosť | -20,8 LUFS | -12,1 LUFS | -20,6 LUFS | -18,3 LUFS | -14,2 LUFS | -14,4 LUFS (špička +2,4 dBFS) | -14,1 LUFS |
| Druhý hook | autority 41 až 56 %, „Yes!“ | „sitting on top of all of them“ 67 % | „And somehow it gets even worse“ 50 % | číslo „2.6 trillion“ 57 až 64 % | „Najlepšie na tom je“ 53 % | „That's the moment it builds the full site“ 71 % | žiadny, výsledok až v posledných 2,2 s |
| Výzva | koncová karta na dlhé video, 1,6 s | „comment agent“, 2,3 s | slovo do DM na Instagrame, 3,2 s | otázka do komentárov, 2,8 s | „Daj mi follow“, 4,5 s | „Comment SETUP“, 2,4 s | „Comment SHOP“, 2,2 s |

## V4 billyfx: God's Eye View (66,07 s), stály titulok + pás 16:9

Rozbor 2026-10-17, tiktok.com/@billyfx/video/7683571519200578830, uverejnené 2026-09-09 16:22 UTC; pri stiahnutí
422 400 pozretí, uloženia 4,2 %. Recept na prevzatie formátu: [format-16x9.md](format-16x9.md).

- **Rozloženie:** čierna 0 až 655 px, v nej **stály titulok** v troch riadkoch (horné okraje 428, 490, 552 px,
  verzálka 37 px, celých 66 s bez zmeny: „I open sourced God's Eye View. / It hit #1 on GitHub Tending. / Then then
  things got interesting.“, dva preklepy); obsah 16:9 v y 656 až 1263 (31,7 % plochy); čierna 1264 až 1919. Spodný
  čierny pás je presne miesto, kde YouTube aj TikTok kreslia názov a kanál; formát nič dôležité nezakryje.
- **Meranie strihov:** `select='gt(scene,0.25)'` na celom obraze našiel len 7 zmien, s `crop=1080:608:0:656` 22
  (prah 0,12: 40 detekcií). Pri tomto formáte merať vždy na páse obsahu.
- **Časová os:** 27 záberov (P produkt, H hovoriaca hlava, C cudzie videá s písacím strojom, D snímky stránok,
  M mém, K koncová karta); priemer 2,45 s, medián 2,07 s, najkratší 0,57 s (farebné pruhy), najdlhší 8,34 s
  (otázky divákov). Tvár 46 % času (z toho 16 % v rohu cez dôkaz), dôkazy 47 %.
- **Hook 0 až 3 s:** titulok už stojí, v páse 4 zábery za 2,97 s (glóbus, termálny pohľad, 3D mesto) pod slovom,
  ktoré rastie („OPEN“ → „OPEN SOURCED“, typ Bebas, ~135 px); reč od 0,1 s, hlas pred obrazom (J-strih 0,27 s),
  prvá tvár až v 2,97 s. Otvorená slučka „I didn't think this would happen“.
- **Text v obraze:** stály titulok je nadpis príbehu, nie prepis reči; písací stroj vedľa kariet (~25 znakov/s,
  kurzor bliká ~2 Hz); otázky „[1]“, „[2]“ sa odkryjú 1,7 s pred prečítaním; koncová karta „WATCH THE FULL VIDEO
  ON YOUTUBE“.
- **Sociálny dôkaz:** snímky skutočných stránok, vždy snímka → jedno zvýraznenie (rámik, žltý zvýrazňovač, výber
  textu) → ostatné stlmené (rozmazanie, tma); autorita pomenovaná štítkom („INVENTOR OF THE HASHTAG“).
- **Zvuk:** -20,8 LUFS, -5,8 dBTP, basový podklad (58 % energie pod 150 Hz v pauzách), úder v hooku, glitch,
  tón 1 kHz pri farebných pruhoch; ~165 slov/min.
- **Dramaturgia:** hook → otvorená slučka → dôkazy (iní o tom točia, čísla, autority) → stupňovanie a mém (69 až
  76 %) → otázky divákov = program dlhého videa → „So today, let's get into both“ → koncová karta. Short je
  pravdepodobne nastrihaný úvod dlhého videa (náš odhad).
- **Lekcia pre nás:** formát na vodorovný materiál (recept a skript), dôkaz zo skutočnej stránky s jedným
  zvýraznením, meranie strihov na páse, short ako upútavka cez Related video. Nie: preklepy v stálom titulku, cudzie
  videá a tváre, mém so zásahovou jednotkou, napodobnené tlačidlá, 8,34 s stojaci záber, 66 s, -20,8 LUFS.

## V5 ai.with.andrew: Agency Agents (76,72 s)

Rozbor 2026-10-19, tiktok.com/@ai.with.andrew/video/7697376652807965959; 720×1280, HEVC, 30 fps.

- **Hook (0 až 3 s):** dôkaz od prvej snímky: hore skutočná stránka repozitára, dole tvár, nadpis na švíku
  („200 ai agents“, „ONE PERSON AGENCY“), reč od 0,0 s; prvý strih až v 2,67 s (náš cieľ 1,5 s).
- **Rozdelenie času:** hovoriaci na celú obrazovku ~11 %, README ~23 %, **zábery mimo Agency Agents ~48 %**
  (17,7 až 31,7 s rozhranie Kimi Agent Swarm, 31,7 až 54,5 s článok LMArena a ďalšie rozhrania), logá ~5 %.
  Desktopová aplikácia, o ktorej hovorí, sa neukáže.
- **Strihy:** prah 0,25: 21 záberov, medián 2,30 s; prah 0,12: 36 záberov, medián 1,82 s; najdlhší 10,1 s
  (animácia Kimi s pohybom vnútri).
- **Titulky:** po jednom slove, biele tučné s tieňom, na stred v ~77 % výšky (pod hranicou YouTube 1248 px).
- **Reč a zvuk:** 223 slov, 175 slov/min, hudba pod rečou bez páuz, -12,1 LUFS; kontrast „These aren't generic
  prompts.“ v 36 %, vrchol „sitting on top of all of them“ v 67 %.
- **Lekcia pre nás:** logo nástroja presne v momente, keď zaznie jeho meno (obraz = slovo), dôkaz od prvej snímky.
  Nie: zábery iného produktu ako ilustrácia, titulky v 77 % výšky, -12 LUFS, výzva „comment“.

## V6 nateherkai: „Unethical GitHub projects“ (36,20 s)

Rozbor 2026-10-19, tiktok.com/@nateherkai/video/7697652685377522958; 1080×1920, 60 fps. Obsah (kategórie nástrojov
na sťahovanie z platforiem, obchádzanie predplatného a pirátske streamovanie) nepreberáme a názvy z obrazu zámerne
neuvádzame; prečo, v zázname 13.

- **Rozloženia:** delená obrazovka (hore b-roll y 0 až 879, dole moderátor; švík y ≈ 879) 45 % času, tvár zblízka
  28 %, b-roll na celú obrazovku 27 %; tvár v obraze 73 % času. Striedanie každé 0,4 až 3,2 s.
- **Časová os** (strihy pri prahu 0,12, obsah zo snímok po 0,25 s):

  | # | Čas (s) | Rozloženie | Obraz | Titulky (doslovne, farba) |
  | --- | --- | --- | --- | --- |
  | 1 | 0,00 až 1,08 | delená | hore naskladané tmavé snímky stránok GitHubu | „UNETHICAL“ červená, „GITHUB PROJECTS“ |
  | 2 | 1,08 až 2,57 | celá | postava pri notebooku, iné oblečenie a miestnosť | „THAT WILL CHANGE“, „LIFE AS“ + „we know it“ tyrkysová pätková |
  | 3 | 2,57 až 3,35 | tvár | moderátor, ruky zopnuté | „PLEASE DON'T“ červená, „USE THESE“ |
  | 4 | 3,35 až 5,12 | delená | karty predplatného AI, „Monthly prices · USD · Oct 2026“ | „BUT IF YOU WANT“, „TO USE YOUR“, „subscription tools“ |
  | 5 | 5,12 až 6,23 | celá | rozhranie „Explore AI Models“ so štítkami „FREE“ | „FOR FREE“ v zelenom boxe, „AND YOU DON'T“, „CARE HOW“ |
  | 6 | 6,23 až 6,73 | tvár | moderátor | „Then listen in“ |
  | 7 až 9 | 6,73 až 9,35 | delená | nesúvisiace obrazovky (priečinok „Olympic Launch P&L“, okná ERP, pravidlá firmy prečiarknuté červenou) | „SOME DEVELOPERS“, „ARE BUILDING TOOLS“, „IGNORE“, „HOW COMPANIES“ |
  | 10 až 14 | 9,35 až 18,20 | striedanie | ilustračné okno so sťahovaním súborov, tvár, nesúvisiaci repozitár, „Explore AI Models“ | „ONE CATEGORY“, „LETS YOU DOWNLOAD“, „ANOTHER GROUP“, „TO GET AROUND“, „subscription models“ |
  | 15 | 18,20 až 19,57 | tvár | moderátor | „AND SOMEHOW“, „IT GETS“ + „EVEN WORSE“ červená |
  | 16 až 20 | 19,57 až 25,77 | striedanie | dokumentácia s tabuľkami, film na notebooku, seriál na televízore, pás log streamovacích služieb, logo GitHubu | „THERE ARE ENTIRE“, „OPEN SOURCE projects“, „ACCESSING MOVIES“, „STREAMING platforms“, „IN ONE PLACE“ |
  | 21 | 25,77 až 27,83 | tvár | moderátor | „AND NONE OF THIS“ červená, „IS BURIED ON“, „SOME PRIVATE forum“ |
  | 22 až 24 | 27,83 až 33,00 | delená a celá | skutočné profily dvoch vývojárov (mená, avatary, pri jednom e-mail) a pripnuté repozitáre | „THE CODE IS public“, „ARE PUBLIC“, „ARE LITERALLY pinned“, „GITHUB PAGES“ |
  | 25 | 33,00 až 36,20 | tvár | moderátor v inom oblečení a pred inou stenou | „“UNETHICAL”“ tyrkysová, celé 3,2 s |

- **Strihy:** prah 0,12: 25 záberov, medián 1,35 s, 39,8 strihu za minútu, najdlhší 3,20 s (výzva); zmeny len
  v hornom páse delenej obrazovky ffmpeg nenájde.
- **Hook (0 až 6,8 s), tri takty:** štítok zakázaného („UNETHICAL“ červenou od 0,0 s, prvý strih 1,08 s), obrátený
  zákaz („PLEASE DON'T USE THESE“, tvár zblízka v 2,57 s), podmienka a príkaz („if you want … for free and you
  don't care how, then listen in“). 34 slov v 6 záberoch, čitateľné aj bez zvuku.
- **Titulky:** ~70 po 1 až 3 slovách, na všetkých snímkach; biele verzálky nesú text, tyrkysová pätková kurzíva
  pointu; červená = zákaz, zelená = zadarmo a dostupné; box len nad svetlým rozhraním. Na švíku y 851 až 898, pri
  tvári y 1070 až 1115, výzva y 1283 až 1345 (pod 1248 px).
- **Reč a zvuk:** 156 slov = 258 slov/min (najrýchlejšie z meraných), pri -35 dB žiadne ticho nad 0,12 s;
  strihy v reči skrýva striedanie rozložení; -20,6 LUFS, -3,3 dBTP.
- **Stavba:** kategórie 1 a 2 jednou vetnou šablónou, druhý hook „And somehow it gets even worse“ v 50 %, „dôkaz“
  zo skutočných profilov, výzva posledných 8,8 %. **Slučka slova:** to isté slovo otvára aj zatvára video a je
  kľúčovým slovom výzvy. Výzva je nahraná zvlášť (iné oblečenie a stena), pravdepodobne modul (náš odhad).
  **Video nič nepomenuje**, celý obsah je za výzvou v DM (mechanizmus v `youtube-fakty.md`, časť 14).
- **Lekcia pre nás:** hook v troch taktoch s pravdivým obsahom, slučka slova, výzva ako modul, delená obrazovka so
  skutočným záberom práce a titulkom na švíku, striedanie rozložení po vystrihnutí páuz, najviac dve farby
  s významom. Nie: výzva do DM, video bez obsahu, ilustračný b-roll, cudzie profily a e-maily, 258 slov/min,
  -20,6 LUFS, titulok výzvy pod 1248 px, hook „neetické / zadarmo, aj keď nevieš ako“.

## V7 marcinteodoru: „0x Alpha“ (27,93 s), novinka pred snímkou obrazovky

Rozbor 2026-10-19, tiktok.com/@marcinteodoru/video/7676998208815516958, uverejnené 2026-08-22 23:14 UTC; pri stiahnutí
2026-10-19: 202 000 pozretí, 4 922 uložení (2,4 %, menej ako V1 až V3: správa sa neodkladá).

- **Rozloženie:** jeden záber, efekt green screen: nehybná snímka príspevku na X (obsah y 328 až 1564) a vyrezaný
  moderátor (x ~340 až 760, y ~930 až 1564). Štítok „Fable 5 killer?“ 0,00 až 4,47 s, x 148 až 930, y 164 až 508,
  šikmo asi 15°; 124 px v hornom páse YouTube. Titulky do obrazu nie sú; bez zvuku nesie správu text príspevku.
  Moderátor zakrýva pravú časť grafu: číslo, na ktorom stojí tvrdenie, je celé čitateľné len v 1,2 až 1,4 s.
- **Tempo:** 0 strihov (prah 0,25 aj 0,12 na výreze moderátora), jediná zmena obrazu v 4,50 s, potom 23,4 s bez zmeny.
- **Reč:** prvé slovo 0,34 s, 63 slov, 137 slov/min, 7 páuz 0,32 až 0,70 s medzi vetami; -18,3 LUFS, -0,9 dBTP.
- **Hook:** emočná otázka bez informácie („What the hell is going on?“), informáciu nesie štítok s požičaným menom
  a otáznikom. Číslo („2.6 trillion“) v 57 až 64 % dĺžky na mieste druhého hooku. Výzva: otázka do komentárov
  a gesto (posledných 2,8 s).
- **Klišé a zavádzajúce:** číslo zo snímky bez jednotky (tokeny za deň vydávané za parametre), „supposedly“ bez mena,
  otázka s tvrdením, „nobody knows“ bez dátumu (o 4 dni neplatné). Overenie:
  `../../referencie-z-videi/references/naucene-z-videi.md`, záznam 14.
- **Lekcia pre nás:** časť „Novinky, fámy a čísla zo snímok“ v `../SKILL.md` a `../scripts/tvrdenia.py`; formát pred
  vlastnou stránkou v [sablony.md](sablony.md), časť 10; otázka v hooku len vtedy, keď ju short sám pravdivo zodpovie.

## V8 martin.gocik: TRELLIS.2 (Instagram reel, 48,19 s)

Ten istý autor ako V1 a tá istá šablóna (delená obrazovka, pilulka na švíku, „Volá sa X a v podstate“,
„Najlepšie na tom je“, počítadlo hviezd, preškrtnutá karta, „Daj mi follow“). Reel z 18. 10. 2026 05:31 UTC,
stiahnutý 2026-10-19 (yt-dlp): 3 203 páči sa, 37 komentárov; počet pozretí Instagram v metadátach nedáva.
Súbor 1080×1920, 30 fps, VP9, AAC 48 kHz. Titulky Instagram nemá, reč je z titulkov v obraze (snímky po 0,25 s,
v páse titulkov po 0,1 s); slová kratšie ako 0,1 s mohli chýbať.

### a) Časová os

Rozloženia ako pri V1: **A** delená obrazovka (grafika hore na svetlom plátne s mriežkou, autor dole),
**B** tvár na celú obrazovku (priblíženie), **C** grafika na celú obrazovku.

| # | Čas (s) | Dĺžka | Rozl. | Obraz | Reč (z titulkov v obraze) |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,00–3,50 | 3,50 | A | ukážka katapultu: vstupný obrázok vľavo, 3D výsledok sa otáča vpravo (nábeh krytím do 0,25 s) | Microsoft spravil AI, ktorá z jednej fotky vytvorí 3D model, |
| 2 | 3,50–4,73 | 1,23 | A | repozitár microsoft/TRELLIS.2, odznak hviezd rastie 5 118 → 9 356 → 10 743 | a dal ju zadarmo na GitHub. |
| 3 | 4,73–6,07 | 1,34 | A | projektová stránka „TRELLIS.2 / NATIVE AND COMPACT STRUCTURED LATENTS FOR 3D GENERATION“ | Volá sa TRELLIS.2 a |
| 4 | 6,07–9,00 | 2,93 | B | tvár | v podstate je to 3D modelár, ktorému stačí jeden obrázok. |
| 5 | 9,00–12,63 | 3,63 | A | ukážka prilby, vstup a otáčajúci sa výsledok | Nahráš fotku a dostaneš hotový 3D objekt aj s textúrami. |
| 6 | 12,63–14,73 | 2,10 | A | kovová rukavica, nápisy pribúdajú: BASE COLOR, METALLIC, ROUGH NESS, ALPHA | Materiály ako kov, drsnosť alebo |
| 7 | 14,73–15,93 | 1,20 | A | pás ukážok METAL, WOOD, CERA…; potom FEATHER, GLASS, WATER, sivé → s materiálom (15,25 s) | priehľadnosť |
| 8 | 15,93–17,33 | 1,40 | A | README „3. Rich Texture Modeling“, rámik okolo „Base Color, Roughness, Metallic, and Opacity“ | má model rovno v sebe. |
| 9 | 17,33–21,47 | 4,14 | A | README „2. Arbitrary Topology Handling“, rámik okolo „Open Surfaces“, pomalý posun | Zvládne aj tvary, na ktorých iné generátory padajú a nefungujú. |
| 10 | 21,47–23,97 | 2,50 | A | OPEN SURFACE: rastlina a popínavka, sivé → farebné (23,0 s) | Napríklad oblečenie, listy alebo |
| 11 | 23,97–25,60 | 1,63 | A | INTERNAL STRUCTURE: akvárium a domček, sivé → farebné (24,75 s) | duté vnútro nejakého objektu. |
| 12 | 25,60–26,80 | 1,20 | B | tvár | Najlepšie na tom je, že je to |
| 13 | 26,80–29,30 | 2,50 | A | repozitár, odznak hviezd 4 715 → 11 509 | open source pod licenciou MIT |
| 14 | 29,30–31,37 | 2,07 | C | logo GitHub, počítadlo 0+ → 11 000+, pilulka „hviezd, licencia MIT“ | a na GitHube to má jedenásť tisíc hviezd. |
| 15 | 31,37–32,77 | 1,40 | B | tvár | Daj si len pozor, na vlastnom |
| 16 | 32,77–34,87 | 2,10 | A | README Prerequisites, rámik okolo „Hardware: An NVIDIA GPU with at least 24GB of memory is necessary…“ | počítači potrebuješ grafiku |
| 17 | 34,87–36,83 | 1,96 | C | počítadlo 0 GB → 24 GB, pilulka „pamäte na grafike“ | s dvadsaťštyri gigabajtami pamäte. |
| 18 | 36,83–38,20 | 1,37 | A | (~0,1 s tvár) logo Hugging Face, „Hugging Face demo“ | Ale oficiálne demo na Hugging |
| 19 | 38,20–40,43 | 2,23 | A | Space microsoft/TRELLIS.2 („Running on ZERO“, 2.19k) | Face skúsiš rovno v prehliadači. |
| 20 | 40,43–43,70 | 3,27 | C | „Modelovanie v programe“ sa preškrtne (40,9 s), zelená fajka „Stačí jedna fotka“ (41,25 s) | Namiesto modelovania v grafickom programe ti stačí jedna fotka. |
| 21 | 43,70–48,19 | 4,49 | B | tvár, ukazuje prstom | Daj mi follow a ďalšie video uvidíš znova AI nástroj, ktorý bude úplne zadarmo. |

21 záberov, priemer 2,29 s, medián 2,10 s, najkratší 1,20 s, najdlhší 4,49 s (výzva). `strihy.sh`: prah 0,25
dal 16 strihov (17 záberov, medián 2,50 s), prah 0,12 dal 18 (19 záberov); zmeny len v hornom paneli (7, 18)
ffmpeg nevidí. Rozloženie A 30,9 s (64 %), B 10,0 s (21 %), C 7,3 s (15 %); autor je v obraze 85 % času.

### b) Hook

- 0 až 1 s: hore vstupný obrázok vedľa 3D výsledku, ktorý sa už otáča; na švíku „Microsoft spravil“; dole autor,
  hovorí od 0,2 s. Dôkaz (vstup → výsledok) je v obraze od prvej snímky, nie cudzia tvár ako vo V1.
- 0 až 3 s: celá prvá veta (sľub) „Microsoft spravil AI, ktorá z jednej fotky vytvorí 3D model“, obraz stále ukazuje
  výsledok v pohybe. Prvý strih až v 3,50 s, pohyb je však od 0,0 s (otáčanie modelu).
- Prečo funguje: známa značka (Microsoft), konkrétny výsledok viditeľný bez zvuku, „zadarmo“ v 3,5 s.
- Slabina: „z jednej fotky“ ukazuje na čistých ukážkových obrázkoch z projektovej stránky, nie na fotke z telefónu.

### c) Titulky v obraze

- Rovnaké ako V1: biely tučný bezpätkový text v tmavej zaoblenej pilulke, frázy po 1 až 3 slovách (65 fráz,
  priemer 2,1 slova, nová každých ~0,74 s). Poloha: pri A na švíku y ≈ 800 až 900 px, pri B biely text bez podkladu y ≈ 1310 až
  1360 px, pri C dolná pilulka y ≈ 1500 až 1613 px.
- Chyba ako vo V1: v 6,05 s (strih A → B) ostala pilulka „v“ zo švíku ~0,1 s na ľavom oku.
- Bezpečné zóny YouTube (288/672/48/192 px): pilulka na švíku je vnútri; titulky pri B a C sú pod 1248 px,
  kde na YouTube býva názov a kanál. Veľké číslo a pilulka „hviezd, licencia MIT“ (y ≈ 1121 až 1228) sú vnútri.

### d) Zvuk a reč

- 135 slov, 169 slov/min (V1 188). Žiadne ticho pod -30 dB dlhšie ako 0,2 s (súvislý podklad alebo
  vystrihnuté pauzy). -14,2 LUFS, skutočná špička -0,9 dBTP, rozsah 2,4 LU: hlasitosť ako náš cieľ, špička
  o 0,1 dB nad naším stropom -1 dBTP.

### e) Druhý hook a výzva

- „Najlepšie na tom je“ v 25,75 s (53 %), tá istá veta ako vo V1 (74 %).
- Zhrnutie kartou „staré preškrtnuté → nové s fajkou“ (40,4 až 43,7 s), ako „Prémiová verzia → Všetko zadarmo“ vo V1.
- Výzva 43,7 až 48,2 s (4,5 s): „Daj mi follow“ (ignorované).

### f) Čo si berieme a čo nie

- **Áno: dôkaz „vstup → výsledok“ od prvej snímky.** Pre prevádzku skutočné „pred a po“ (brada, účes, stav
  náčinia) so súhlasom človeka v zábere, vedľa seba v hornom paneli, výsledok už v pohybe.
- **Áno: šablóna série.** V1 a V8 majú rovnakú kostru, mení sa len obsah. Pre prevádzku jedna kostra pre sériu
  (napr. „Jedna vec, ktorú u nás dostaneš“) s pevnými slotmi: hook s dôkazom, „volá sa / ako to prebieha“, druhý
  hook „Najlepšie na tom je“ v 55 až 75 %, karta „staré → nové“, výzva na rezerváciu. Šetrí čas a divák formát spozná.
- **Áno, ak je pravdivé: karta „staré preškrtnuté → nové“** ako zhrnutie (napr. „Telefonovanie → Rezervácia online“
  len keď to tak naozaj je).
- **Nie:** počítadlá od nuly (2× v 48 s), „zadarmo, MIT“ bez výhrad k závislostiam, ukážkové obrázky vydávané za
  „fotku“, titulky pod 1248 px a na očiach, „follow“ ako výzva, zmienka o AI pri HEAD SPA 30.

## V9 thechriscordero: „$10,000 website“ (31,30 s, Instagram reel)

Rozbor 2026-10-19 na súbore z Instagramu (yt-dlp): 1080×1920, 60 fps, VP9, HE-AAC 48 kHz 50 kb/s, uverejnené
2026-09-11 15:55 UTC. Bez titulkov a bez prepisu reči: titulky v obraze čítané zo snímok po 0,25 s a 0,1 s,
reč sme nepočúvali ani neprepisovali. Tvrdenia autora a overenie nástrojov:
`../../referencie-z-videi/references/naucene-z-videi.md`, záznam 16.

### a) Časová os

| Čas (s) | Úloha | Obraz | Titulok v obraze |
| --- | --- | --- | --- |
| 0,00 až 3,43 | hook: cenová kotva | od prvej snímky rozmazaný švih do delenej obrazovky; hore web s plechovkou (1,7 s výmena za inú príchuť, 2,13 s iný web, 2,67 s posun webu), dole autor | „This is a“ 0,3 / „$10,000“ veľkým 0,75 / „website“ / „I built it with“ / „one line of code.“ |
| 3,43 až 5,83 | trojité zápor | celá obrazovka: biela zvlnená mriežka, „No“ čierne bezpätkové, slovo terakotovou kurzívou s pätkami, výmena po ~0,75 s | „No developers“, „No designers“, „No experience“ |
| 5,83 až 9,37 | krok 1 | karta „Step One“ (čierna zvlnená mriežka, „Step“ biele, „One“ žltá kurzíva, nábeh s rozmazaním pohybom) 0,7 s; dôkaz v zaoblenej karte s tieňom na bielom: stránka Download Claude, príkazy (žlté podfarbenie), terminál | „Install Claude Code.“ / „One line in“ / „your terminal.“ / „Done“ |
| 8,77 až 13,37 | krok 2 | „Step Two“ 0,6 s; npm `framer-motion` so žltým zvýraznením názvu; prínos na webe Nike (modrá → fialová) a VANITY | „Plug in Framer Motion.“ / „That's where the smooth animations come from the kind agencies charge thousands for.“ |
| 13,37 až 18,57 | krok 3 | žltý záblesk svetla 13,25; „Step Three“ 0,8 s; stránka UI UX Pro Max; Claude Code „Install this skill …“; autor na celú obrazovku 17,33 | „Drop in the UI/UX Pro Max skill“ / „Tell Claude Code to install it“ / „Now it thinks like a senior designer“ |
| 18,57 až 22,27 | krok 4 | oranžovo-červený záblesk 18,5; „Step Four“ 0,9 s; 21st.dev, „Copy prompt“, vloženie do Claude Code | „Head to 21st.dev“ / „Copy the line.“ / „Paste it into Claude Code.“ |
| 22,27 až 25,27 | výsledok, druhý hook (71 %) | web Pepsi, potom módny web s tromi zábermi | „That's the moment it builds the full site.“ / „Designed“ / „Animated“ / „Production - ready“ (po ~0,5 s) |
| 25,27 až 28,90 | návrat k hooku | delená obrazovka ako v úvode, hore weby z úvodu, potom terminál | „Agencies are still charging five figures for this exact build“ / „You're doing it from your terminal.“ |
| 28,90 až 31,30 | výzva (2,4 s) | autor na celú obrazovku | veľké „Comment "SETUP"“ v strede, malé „and I'll send you the full step-by-step.“ |

### b) Merania

| | V9 |
| --- | --- |
| Záberov (`strihy.sh --prah 0.12`, overené na hárku) | 25; medián 1,07 s, priemer 1,25 s, najkratší 0,53 s, najdlhší 2,63 s; 46 strihov za minútu; nič nad 3,5 s |
| Prvá zmena obrazu | strih 2,13 s; v delenom obraze sa web hore mení už v 1,7 s a titulok od 0,3 s |
| Tvár | 0 až 3,43, 17,33 až 18,57, 25,27 až 31,30 s, spolu ~10,7 s (34 %) |
| Karty a nahrávky obrazovky | ~20,6 s (66 %), z toho karty „Step“ spolu ~3,0 s |
| Titulky | 2 až 4 slová, biele zaoblené tučné bezpätkové s mäkkým tieňom, bez podkladu, bez zvýraznenia slova; na švíku delenej obrazovky 43 až 49 % výšky, pod kartou 70 až 73 %, pri tvári 73 až 75 %, výzva 47 až 59 % (merané na snímkach 1,0 / 9,9 / 17,6 / 30,6 s) |
| Slová za minútu | ~230 (120 slov titulkov za 31,3 s; že titulky = reč, sme neoverili) |
| Zvuk | -14,4 LUFS, LRA 2,5 LU, skutočná špička +2,4 dBFS (v súbore z Instagramu), žiadna pauza ≥ 0,25 s pod -35 dB |
| Druhý hook | „That's the moment it builds the full site“ 22,3 s (71 %) |
| Výzva | 28,9 s, 2,4 s dlhá, komentár za kľúčové slovo |
| Odozva | 7 728 komentárov proti 5 049 páči sa mi: výzva „Comment SETUP“ ťahá komentáre, nie záujem o obsah |

### c) Čo berieme do receptu (`../SKILL.md`)

- **Karty krokov** ako kapitoly: krátka karta 0,6 až 0,9 s v jednom štýle (u nás farby a písmo značky, bez
  záblesku pri HEAD SPA 30), potom hneď dôkaz. Pri receptovom shorte „ako prebieha návšteva“ = „Krok 1 až 3“.
- **Dôkaz v karte:** skutočný záber alebo skutočná stránka (rezervácia v Booqme na telefóne) v zaoblenom rámiku
  na pokojnom pozadí; jedno zvýraznenie dôležitého údaju (cena, čas) zo zdroja, ako žlté podfarbenie vo V9.
- **Kroky jednou vetnou šablónou** (sloveso v rozkazovacom spôsobe + vec): potvrdzuje V1 a V2.
- **Trojica jednoslovných záverov** po ~0,5 s ako zhrnutie (len ak je každé slovo pravda pre prevádzku).
- **Návrat k hooku** pred výzvou: posledná veta odpovedá na prvú.

### d) Čo nie

| Vo videu | Prečo nie | U nás |
| --- | --- | --- |
| cenová kotva bez zdroja ako hook („$10,000“, „five figures“) | neoveriteľné, klamlivé (zákon 108/2024, § 10) | výsledok alebo obraz miesta, číslo len so zdrojom |
| „No developers. No designers. No experience.“ | nepravda: terminál, PATH, npm, platený plán | sľub, ktorý short ukáže |
| ukážkové weby, ktoré metóda vo videu nevytvorí (Nike, Pepsi, vodoznak iného autora) | cudzia práca a cudzie značky ako dôkaz | len vlastné zábery prevádzky |
| „Done“ pri zábere, kde terminál hlási chybu PATH | dôkaz vyvracia tvrdenie | čo sa tvrdí, to záber ukazuje |
| „Comment SETUP“ | výzva bez hodnoty, ťahá komentáre | rezervácia online, adresa v obraze |
| titulky v 70 až 76 % výšky | na YouTube pod názvom a kanálom (zóna 1248 až 1920 px) | pás 1040 až 1240 px |
| ~230 slov za minútu, 46 strihov za minútu | pre HEAD SPA 30 prirýchle | HEAD SPA 110 až 140 slov/min, zábery 2,2 až 3,0 s |
| špička nad 0 dBFS | skreslenie po kódovaní | najviac -1 dBTP (`short.py`) |
| záblesky svetla medzi krokmi | pri HEAD SPA 30 zakázané | len Barbershop 30 a GYM KLUB, najviac dva |

## V10 dazzzlme: „Editing 2 days when there's this“ (13,73 s, Instagram reel)

Rozbor 2026-10-19 na súbore z Instagramu (yt-dlp, 660×1172, VP9, bez titulkov); reč neprepisujeme. Overenie
editora Shorty a porovnanie s naším postupom: `../../referencie-z-videi/references/naucene-z-videi.md`, záznam 17,
a [strih-podla-referencie.md](strih-podla-referencie.md).

- **Stavba:** problém (selfie s reakciou a nadsádzkou „Editing 2 days when there's this“, 0 až 3,10 s), tri číslované
  kroky, každý jeden záber a jeden riadok textu hore („1. Connect this video editor to Claude“, „2. It can actually
  understand your videos“, „3. Describe your idea“), pointa „Let it cook🔥🔥“ (časová os editora), výsledok až
  v posledných 2,2 s (fotka predajne striedaná ostrými geometrickými maskami po 0,10 až 0,43 s) s výzvou „Comment
  “SHOP”“.
- **Strihy (`strihy.sh`):** prah 0,25: 8 scén (strihy 3,10; 4,00; 6,20; 8,03; 9,47; 11,53; 13,60 s), medián 1,95 s,
  30,6 strihu za minútu; prah 0,12 so zlúčením 0,05 s pridá strih v 5,23 s a záverečnú sériu 11 zmien za 2,2 s.
- **Text:** jeden riadok hore vo výške 16 až 23 % (asi 300 až 430 px pri 1080×1920, tesne pod hornou hranicou zóny
  YouTube 288 px).
- **Obraz:** notebook natočený mobilom; text rozhrania je pri 660 px čitateľný len z 3× výrezov
  (`../../referencie-z-videi/scripts/snimky_text.py vyrez`). Kroky sú z rôznych relácií (9 súborov .mov v kroku 2,
  v projekte 2 fotky), video nie je jeden beh.
- **Zvuk:** súvislý (žiadne ticho nad 0,3 s pod -40 dB), -14,1 LUFS, LRA 3,1 LU.
- **Lekcia pre nás:** formát „problém, 3 číslované kroky, výsledok“ s krokom v jednom riadku hore sa hodí na
  „rezervácia online v 3 krokoch“ ([sablony.md](sablony.md), časť 12), ale ako záznam obrazovky telefónu a s výsledkom
  v hooku; rytmus referencie len cez `../scripts/strih_podla_referencie.py`. Nie: reakcia tváre ako hook, výsledok
  až na konci, série zmien po 0,1 s a ostré tvarové masky (pri HEAD SPA nikdy), výzva „comment SHOP“.

## V11 nocode.joshua: „The 7 types of AI agents you can build in Claude“ (90,00 s)

Rozbor 2026-10-20 na súbore z TikToku (1080×1920, 30 fps, titulky eng-US ASR). Overenie tvrdení o agentoch:
`../../referencie-z-videi/references/naucene-z-videi.md`, záznam 20.

- **Stavba:** index → sedem položiek s rovnakou stavbou → súhrnná karta → výzva. Hook 0 až 7,10 s (7,9 %),
  zoznam 7,10 až 84,78 s (86,3 %), výzva 84,78 až 89,87 s (5,7 %). Každá položka má rovnakú vetu „[Číslo] is the
  [typ]. [Čo robí]. [For example / Think of it like …]“.
- **Strihy (`strihy.sh`):** prah 0,25: 16 strihov, 17 záberov, medián 4,60 s, prvý strih 8,87 s, 10,7 strihu za
  minútu. Prah 0,12 pridá skok v tvári v 21,90 s. Ostatné sú prepnutie rozloženia (15× delená obrazovka ↔ karta,
  v 88,07 s karta → tvár na celú obrazovku).
- **Tempo karty:** podiel zmenených pixelov v hornej karte (metóda v `../SKILL.md`, časť „Rozbor cudzieho
  shortu“; skript zatiaľ nie je v toolboxe): 75 zmien, prvá v 0,03 s, medián 0,90 s. Ostatné citlivosti dali
  71 až 85 zmien a medián 0,77 až 1,00 s. ffmpeg na výreze karty pri prahu 0,12: 1 udalosť.
- **Čísla:** číslica na hovorené číslo ±0,2 s (7,30 / 13,40 / 21,90 / 36,17 / 46,80 / 58,40 / 68,58 s), čísla 1
  až 6 svietia ~0,45 s, siedma 1,45 s so štítkom „THE BIG ONE“. Pred 6 zo 7 čísel (okrem čísla 2) zmizne
  titulok na 0,17 až 0,40 s, pri číslach 1 až 5 rečník ukazuje aj prsty. Pilulka „AGENT n OF 7“ na y 228 až 271.
  Prvé dve položky sú krátke (6,2 a 8,6 s), siedma najdlhšia (16,3 s). Siedma je druhý hook v 76 % a index ju
  zvýraznil už v 3,6 s.
- **Rozloženie:** delená obrazovka (švík presne y 960) 50,7 % času, karta na celú obrazovku 47,2 %, tvár sama
  2,1 %. Schéma viditeľná 97,9 % času, tvár 52,8 %; plochou ~73 % schéma a ~27 % tvár.
- **Titulky:** 106 boxov, 279 slov, celá fráza naraz (3 slová 77×, 2 slová 19×, 1 slovo 10×), neproporcionálne
  verzálky, biele na čiernom #1A1C1C, medián 0,73 s, 96 % času reči, delenie mechanické. Poloha: delená obrazovka
  y 906 až 1012, karta na celú obrazovku y 1424 až 1530 (pod hranicou 1248 px).
- **Karty:** pozadie #EEEEE7, jediný akcent #CB6D55 (farba značky Claude), tri písma s jasnými úlohami (pätkové
  nadpisy, bezpätkové uzly, neproporcionálne titulky; odhad podľa tvaru písmen). Jeden uzol na jednu pomenovanú
  vec v reči (~0,7 až 1,0 s). Maketa „Send this email? Approve / Edit“ s kurzorom (63 s).
- **Zvuk:** 278 slov, 186 slov/min, žiadna pauza ≥ 0,25 s pod -35 dB, -12,6 LUFS, LRA 2,6 LU, skutočná špička
  +0,2 dBFS.
- **Hook a výzva:** „If you don't know how to build an AI agent in Claude, these are the seven types … explained in
  less than 60 seconds.“ Časový sľub neplatí. `hook_skore.py` dal originálu 22 a prekladu 39, oba „slabý“; silu
  nesie index do 3,8 s a pohyb od druhej snímky. Výzva: súhrnná karta 3,1 s, potom tvár s napodobneným tlačidlom
  „Follow“ 1,9 s. „Save this“ je len v popise. Pri stiahnutí 22 192 uložení (6,8 % pozretí, 1,25× viac ako páči
  sa) a 76 komentárov.
- **Lekcia pre nás:** index, počítadlo „n z N“ a súhrnná karta sa hodia na ponuku na výber (`../SKILL.md`,
  tabuľka „Formáty z referencií“ a časť „Strih a obraz“; kostra do [sablony.md](sablony.md) je zatiaľ návrh). Hore
  však skutočné zábery, 30 až 45 s, titulky v páse 1040 až 1240 px a časový sľub len zmeraný. Nie: schémy a makety
  namiesto záberov, 90 s, mechanické delenie titulkov, napodobnené tlačidlo, výzvy follow a save, cudzia značka.

## Čo majú spoločné (a čo z toho berieme)

1. Reč od prvej snímky, žiadne logo ani úvod. Prvá veta nesie osobu alebo číslo a výsledok
   (autorita V1, konflikt V2, námaha V3).
2. Hlavná myšlienka je čitateľná aj bez zvuku do 1 s (meno a štítok V1, nadpis V2, titul diagramu V3).
3. Obraz sa mení zhruba každé 2 s (medián V1 2,0 s, V2 1,6 s, kroky V3 2,5 s); prvá zmena do 1,6 s (V1, V2).
4. Kroky sa vymenúvajú jednou vetnou šablónou („rola + čo ti urobí“, „Tell it to …“, „Module …“), divák
   rytmus predvída.
5. Druhý hook medzi polovicou a tromi štvrtinami („Najlepšie na tom je“, „Here's the part that makes this insane“)
   alebo kapitoly.
6. Veľké číslo na celú obrazovku ako dôkaz, s rastom (count-up) 0,4 až 1,5 s.
7. Zvýraznenie výrezu: okolie stmavené, dôležité miesto svieti (V1 README, V3 moduly).
8. Výzva v posledných ~3 s (93 až 97 % dĺžky), jedna až dve akcie.
9. Titulky sú v 68 až 84 % výšky (stavané pre TikTok), okrem pilulky na švíku V1; na YouTube to padá do pásu
   s názvom a kanálom. Platí aj pre V5 (~77 %), výzvu V6, titulky pri tvári V8 a V9 (70 až 76 %).
10. Hook môže byť dlhší ako 3 s, ak sa do 1,1 s zmení obraz a každý takt je iný záber (V6: tri takty za 6,8 s,
    šesť záberov).
11. Najsilnejší hook je dôkaz od prvej snímky: skutočná stránka (V5), vstup vedľa výsledku v pohybe (V8), snímky
    skutočných stránok s jedným zvýraznením (V4). Slabé sú reakcia tváre (V10) a emočná otázka bez informácie (V7).
12. Jedna kostra pre sériu (V1 a V8 od toho istého autora), kroky jednou vetnou šablónou a kartou (V9), slučka
    slova a výzva ako modul (V6).
13. Štyri zo siedmich nových videí (V5, V6, V9, V10) končia výzvou za kľúčové slovo: hodnota sa presúva do DM
    alebo komentárov (V9 má viac komentárov ako páči sa).
14. B-roll často nie je z témy (V5 Kimi a LMArena ~48 % času, V6 okná ERP, V9 weby Nike a Pepsi): divák ho berie ako
    dôkaz, preto u nás len zábery prevádzky.
15. Súhrnná karta zatiaľ nemá merateľný prínos k uloženiam: V11 (index, „n z N“, súhrnná karta) má 6,8 % pozretí
    a 1,25× viac uložení ako páči sa, V1 až V3 bez súhrnnej karty 5,5 až 7,1 % a tiež viac uložení ako páči sa.
    Kartu robíme ako ťahák pre diváka; či zvyšuje uloženia, ukáže až porovnanie našich vlastných shortov.

Čo nepreberáme: cudzie tváre a mená ako hook, b-roll cudzích ľudí a miest, AI avatar ako moderátor, makety
vydávané za nahrávky, ukážkové čísla vydávané za výsledky, hyperboly („nahradil celý tím“, „No exaggeration“),
titulky slovo po slove v celom videe, video bez titulkov v dvoch tretinách času, záblesky pri pokojnej značke.
Z V4 až V10 navyše: zábery iného produktu (V5), výzvy do DM a za komentár a video bez obsahu (V6, V9, V10), cudzí
príspevok ako pozadie a číslo bez jednotky (V7), „MIT, zadarmo“ bez výhrad a počítadlá od nuly (V8), cenová kotva
bez zdroja a „Done“ pri chybe (V9), série zmien po 0,1 s a výsledok až na konci (V10), preklepy v stálom titulku
a zábery z Google Earth (V4).

## Kam to prešlo

- `../SKILL.md`: recept 35 s (aj 30 a 45 s), pravidlá hooku, titulkov, strihu, zvuku, výzvy a bezpečných zón,
  tabuľka „Čo nerobiť“.
- `../references/sablony.md`: šablóny scenára a storyboardu s vetnou šablónou krokov a druhým hookom.
- `../scripts/strihy.sh`: meranie strihov a tempa ako v tomto rozbore.
- V4: [format-16x9.md](format-16x9.md), `../scripts/titulok_16x9.py`, `../assets/sablona-16x9.ass`, [sablony.md](sablony.md) časť 11.
- V5: riadok „zábery iného produktu“ v tabuľke „Čo nerobiť“ v `../SKILL.md`; karta roly a roly pre obsah v `../../tim-roly/`.
- V6: hook v troch taktoch, slučka slova, výzva ako modul, delená obrazovka, farba s významom (`../SKILL.md`);
  mechanizmus výziev za slovo v [youtube-fakty.md](youtube-fakty.md), časť 14.
- V7: časť „Novinky, fámy a čísla zo snímok“ v `../SKILL.md`, `../scripts/tvrdenia.py`, štítky v `short.py`,
  [sablony.md](sablony.md) časť 10.
- V8 a V9: dôkaz „vstup → výsledok“, séria s jednou kostrou, karty krokov ([sablony.md](sablony.md) časť 12).
- V10: [strih-podla-referencie.md](strih-podla-referencie.md), `../scripts/strih_podla_referencie.py`.
- V11: formát v tabuľke „Formáty z referencií“, index a počítadlo v „Strih a obraz“, časový sľub v „Hook“
  a meranie zmien karty v „Rozbor cudzieho shortu“ (`../SKILL.md`).
