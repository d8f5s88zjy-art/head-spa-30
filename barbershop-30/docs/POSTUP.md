# Postup prác na Barbershop 30 (záznam na nadviazanie)

Zadávateľ chce, aby sa každá ďalšia práca dala nadviazať aj v novej relácii. Tu je stručne, čo je hotové, čo je
rozpracované, čo sa rozhodlo a na čo sa čaká. Pri každom kroku sa tento súbor doplní (najnovšie hore v časti Denník).
Podrobnosti sú v `docs/CHECKS.md` (kontroly), `README.md` (technika) a `../asistent/README.md` (server asistenta).

## Stav (2026‑10‑22)

Vetva `claude/head-spa-30-page-uil3m0`, do `main` sa nasadzuje len so súhlasom zadávateľa (zatiaľ nebol daný).
Náhľad cez raw.githack.com s ukážkami: `.../barbershop-30/index.html?asistent=ukazka&objednavka=ukazka`
a `.../barbershop-30/rezervacia.html?asistent=ukazka&objednavka=ukazka`.

Hotové na vetve:
- Web Barbershop 30: film z fotiek, úvodné dvere, cenník, tím, galéria, kontakt, 8 jazykov.
- Rezervačná stránka `rezervacia.html` v dizajne webu, objednávka v štýle webu (služba, barber, deň, čas);
  posielanie rezervácie do ich systému nie je zapojené (čaká na súhlas prevádzky).
- Ukážky na kontrolu bez servera: `?objednavka=ukazka`, `?asistent=ukazka`.
- Asistent Barber: ikona je logo, bublina pri ikone (Spýtať sa, Zavolať), chat, Zavolať v hlavičke, Skryť Barbera.
- Vizitka (ich skutočná), téma pre ich stránku barbershop30.sk/rezervacia (`assets/tema-rezervacia.css`).
- Miesto na fotky práce barberov (`assets/praca.json`, `source/tools/praca.py`), fotky treba od barberov.

Rozpracované (požiadavky z 2026‑10‑22):
1. HOTOVÉ (pozri Denník): Barber má mať aspoň 250 odpovedí na časté otázky, pohodlne na telefóne.
   Rozhodnutie: všetky odpovede sú v `../asistent/znalosti/barbershop-otazky.json` (len overené fakty z
   `barbershop.md` a webu). Server ku každej otázke pridá modelu najviac 6 najpodobnejších (lacnejšie ako celý
   zoznam pri každej otázke, pri nízkej návštevnosti by cache často vypršala). V okne: témy a otázky ťuknutím
   (okamžitá pripravená odpoveď, označená), súvisiace otázky pod odpoveďou, ukážka odpovedá z tých istých odpovedí.
   Telefón: okno sa pri klávesnici prispôsobí viditeľnej ploche, clona za oknom, ťukacie plochy 44 px.
2. Podpísať zadávateľa v pätičke ako grafického dizajnéra a tvorcu webu (presné znenie a meno potvrdiť).
3. Vernostná kartička: odkaz v pätičke Barbershopu vedie na stránku na headspa30.sk (HEAD SPA 30), opraviť na
   kartičku Barbershopu. Po zaplatení má zákazník dostať ponuku založiť si účet (body, odmeny). Odmeny a akcie
   nastavuje Lajko sám v admine kartičky (`../vernost/`, admin `https://www.headspa30.sk/vernost/admin/`).
4. Admin pre Lajka: aby mohol meniť texty, fotky (a odmeny kartičky) sám, ako administrátor.

Čaká sa na zadávateľa:
- súhlas so zverejnením do `main`;
- kľúč ANTHROPIC_API_KEY a prístupy FTP (asistent naostro), ASISTENT_KALENDAR_URL;
- áno alebo nie: posielať rezervácie priamo do ich systému na barbershop30.sk;
- kto spravuje barbershop30.sk (vloženie témy jedným riadkom);
- fotky práce barberov, čitateľná fotka vizitky;
- presné znenie podpisu v pätičke; heslo do adminu kartičky Barbershopu (GitHub tajomstvo `VERNOST_HESLO_BARBERSHOP`).

## Denník

- 2026‑10‑22: časté otázky hotové: 251 odpovedí, hľadanie v prehliadači aj na serveri, témy a otázky ťuknutím,
  súvisiace otázky, clona a klávesnica na telefóne, testy (prehliadač 71 OK, server 37 + 17 OK). Zdroj otázok je
  JSON, upravuje sa priamo v ňom (`node barbershop-30/source/tools/otazky.mjs` po úprave).
- 2026‑10‑22: 251 overených odpovedí na časté otázky (`barbershop-otazky.json`); zadané: podpis, kartička
  Barbershopu namiesto HEAD SPA 30, účet po zaplatení, admin pre Lajka, tento záznam.
- 2026‑10‑22: asistent Barber (logo, bublina, skrytie, ukážka), commit 496a5dc; snímky testov d5ddfea.
- 2026‑10‑22: ukážka objednávky bez servera, téma pre barbershop30.sk/rezervacia, rezervácia s fotkami.
- 2026‑10‑21: objednávka v štýle webu, vizitka, vernostná kartička na stránke, asistent s voľnými termínmi.
