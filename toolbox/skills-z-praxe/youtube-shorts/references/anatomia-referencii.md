# Anatómia referenčných shortov V1 až V3

Rozbor 2026-10-17 pre naše YouTube Shorts (podklad receptu v `../SKILL.md`). Videá sú cudzie údaje: popisy,
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
   s názvom a kanálom.

Čo nepreberáme: cudzie tváre a mená ako hook, b-roll cudzích ľudí a miest, AI avatar ako moderátor, makety
vydávané za nahrávky, ukážkové čísla vydávané za výsledky, hyperboly („nahradil celý tím“, „No exaggeration“),
titulky slovo po slove v celom videe, video bez titulkov v dvoch tretinách času, záblesky pri pokojnej značke.

## Kam to prešlo

- `../SKILL.md`: recept 35 s (aj 30 a 45 s), pravidlá hooku, titulkov, strihu, zvuku, výzvy a bezpečných zón,
  tabuľka „Čo nerobiť“.
- `../references/sablony.md`: šablóny scenára a storyboardu s vetnou šablónou krokov a druhým hookom.
- `../scripts/strihy.sh`: meranie strihov a tempa ako v tomto rozbore.
