# Barbershop 30 – návrh textov B (tón „pánsky klub“)

Tón: atmosféra, rituál, pohodlie. Recepčná je hostiteľka, barber je majster. Tykanie ako na celom webe,
bez superlatívov bez dôkazu, bez porovnávania konkurencie, bez zdravotných sľubov. Každý fakt má oporu
v súbore (cesty sú relatívne k `scratchpad/hs-skvrny/barbershop-30/`, pokiaľ nie je uvedené inak).

## Čo web o faktoch hovorí (opora)

- Recepčná pri dverách: `index.html` (karta „Poď ďalej“) – „Pri dverách ťa privíta recepčná.“ Druhá veta
  „Ako jediný barbershop v Nitre ju máme už 8 rokov.“ je podľa `OTAZKY-PRE-MAJITELA.md` otázka 9
  NEPOTVRDENÁ → v nových textoch sa „jediný“ ani „8 rokov“ nepoužíva.
- Od roku 2019 na Mostnej 30: `index.html` („Na Mostnej 30 striháme od roku 2019.“, „Od roku 2019 na Mostnej 30 v Nitre“);
  `docs/CONTENT_SOURCES.md` (založenie 2019, overené‑oficiálne).
- 5,0 na Google · 945 recenzií: `index.html` (`.hero-proof`), `docs/CONTENT_SOURCES.md` časť „Úvod: hodnotenie a cena“.
- Káva a minerálka zdarma, čakáreň vzadu, kreslá, retro pumpa: `index.html` (karta „Čakáreň“); 8 kresiel: `index.html` (fakty pri kontakte).
- Priebeh strihu: `index.html` („Konzultácia, strojček, nožnice, fade. Pri brade horúci uterák a britva.“, „Na záver styling a kolínska.“).
- Telefón recepcie a hodiny: `index.html` („0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“; Po–Pi 9:00–19:00, So 9:00–14:00).
- O jednotlivých barberoch web nehovorí nič faktické: `docs/CONTENT_SOURCES.md` časť „Tím“ – „Priezviská ani
  špecializácie web neuvádza – nevymýšľame.“ a „žiadne roky praxe, špecializácie ani ocenenia“. Starý web
  (`source/web-povodny/index.txt`) má pri menách len „Barber“ / „Barberka“. → Riadky barberov sú bez faktov o osobe.
- Garancia: nikde na webe ani v dokumentoch (grep `garanc|záruk` v docs/, dennik/ a starom webe: jediný výskyt je
  zadanie majiteľa z 27. 10. v `dennik/.../PRIEBEH.md:238`). → len NA POTVRDENIE.
- „Bez objednania“: starý web `source/web-povodny/index.txt` („8 kresiel – minimálne čakanie – rýchly servis,
  aj keď prídeš bez objednania“), ale `OTAZKY-PRE-MAJITELA.md` otázka 5 je NEPOTVRDENÁ → len NA POTVRDENIE.

## 1. Sekcia tímu

### Úvod sekcie (nahrádza „Poctivé remeslo, moderný štýl a ľudský prístup. To spája celý tím.“)

Vojdeš a recepčná si vezme na starosť tvoj termín aj pohodlie. V kresle preberá slovo majster: konzultácia,
strojček, nožnice, fade, pri brade horúci uterák a britva. Takto sa na Mostnej 30 strihá od roku 2019 a 945 ľudí
nám za to dalo na Google 5,0.

(3 vety; fakty: recepčná, priebeh strihu, od roku 2019, 5,0 · 945 – všetko z `index.html`.)

### Riadok ku každému barberovi (≤ 90 znakov, bez faktov o osobe)

| Barber | Riadok |
|---|---|
| Nikolas | Sadni si a povedz dve slová. Zvyšok za teba povie zrkadlo. |
| Kristián | Elegancia, ktorá nevyzerá ako námaha. Jeho rukopis spoznáš na ulici. |
| Damian | Najprv počúva. Potom hovoria nožnice a ty už len prikývneš. |
| Michal | Zavrieš oči pri horúcom uteráku. Otvoríš ich ako nový. |
| Andy | Detail, ktorý vidíš až z profilu, má u neho rovnakú váhu ako celok. |
| Dominika | Jemná ruka, prísne oko. Hotovo je, až keď sedí každý vlas. |
| Kevin | Pokoj v rukách, čisté línie. Strih, ktorý drží aj o týždeň. |
| Lajko | Ostrá línia na krku, mäkký prechod na bokoch. Remeslo vidno zblízka. |
| Jojo | Rozhovor alebo ticho, vyberáš ty. Strih dotiahne tak či tak. |
| Adrian | Dôveru si získa skôr, než si sadneš. A vrátiš sa, lebo chceš. |

Riadok pod tímom ostáva: „Farbenie, melír a trvalú robí Romana. Rezervuješ ich samostatne.“

### Tri piliere (≤ 140 znakov, každý 1 veta)

1. **Skúsenosti** – Na Mostnej 30 striháme od roku 2019 a 945 recenzií s hodnotením 5,0 na Google hovorí za nás.
2. **Pohodlie** – Pri dverách ťa privíta recepčná, vzadu čaká káva alebo minerálka zdarma a ty si len sadneš.
3. **Garancia** – NA POTVRDENIE majiteľom (znenia nižšie). Kým nie je potvrdená, do stavby ide náhradný pilier:
   **Remeslo** – Konzultácia, strojček, nožnice a fade, pri brade horúci uterák a britva: nič navyše, nič nechýba.

### Garancia – znenia NA POTVRDENIE (na web ide len to, čo majiteľ potvrdí; inak sa garancia neukáže)

- G1: Nie si spokojný? Povedz to ešte v kresle a barber to doladí na mieste, bez rečí.
- G2: Z kresla vstaneš, až keď si spokojný. Čo nesedí, dohodneme a doladíme hneď.
- G3: Ak ti niečo nesedí aj po návrate domov, zavolaj recepcii a dohodneme opravu. (Majiteľ doplní, dokedy a za akých podmienok.)

## 2. Časté otázky (nové položky do `index.html` pod existujúce `details.faq-item`)

**Mám volať barberovi alebo recepcii?**
Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. Recepčná sa stará o tvoje termíny a pohodlie, barber o tvoj výsledok. Keď má v kresle zákazníka, venuje sa len jemu. Recepcia ti termín nájde, presunie aj zruší.

**Čo ma čaká, keď prídem?**
Pri dverách ťa privíta recepčná. Vzadu v čakárni máš kávu alebo minerálku zdarma. V kresle začína konzultácia, potom strojček, nožnice a fade, pri brade horúci uterák a britva. Na záver styling a kolínska.

**Čo ak nebudem spokojný?** – NA POTVRDENIE (na web len po potvrdení garancie majiteľom)
Povedz to hneď, kým sedíš v kresle, alebo recepcii pri odchode. Dáme to do poriadku na mieste.

**Môžem prísť bez objednania?** – NA POTVRDENIE (otázka 5 v OTAZKY-PRE-MAJITELA.md; do stavby nejde)
Áno, ak je voľné kreslo. Istotu máš s rezerváciou online alebo cez recepciu na 0951 267 203.

Poradie v sekcii: „Mám volať barberovi alebo recepcii?“ hneď za „Ako sa objednám?“; „Čo ma čaká, keď prídem?“
pred „Kedy máte otvorené?“.

## 3. Pätička – blok „Naše prevádzky“ (nad riadok s © a prevádzkovateľom)

Nadpis stĺpca: **Naše prevádzky**

| Prevádzka | Riadok | Odkaz (overené curl, 27. 10. 2026) |
|---|---|---|
| HEAD SPA 30 | Head Spa rituály pre relax a regeneráciu vlasov. Mostná 30, Nitra. | https://www.headspa30.sk/ (200, titulok „HEAD SPA 30 Nitra | Head Spa rituály, ceny a rezervácia“); canonical koreňového `index.html:30` je https://d8f5s88zjy-art.github.io/head-spa-30/ (tiež 200) – pozri otázku pre majiteľa |
| Salón 30 | Kaderníctvo: dámske strihy, farbenie a koloristika, trichologické vyšetrenie. Mostná 30, Nitra. | https://www.salon30.sk/ (200, titulok „Salón 30“, adresa Mostná 30, 94901 Nitra na stránke) |
| Barbershop 30 | Pánske holičstvo: strih, brada a holenie britvou. Mostná 30, Nitra. Tu si. | odkaz na úvod tejto stránky (`#top`/`./`), označené ako aktuálna prevádzka (`aria-current="page"`); živá doména https://www.barbershop30.sk/ (200) je zatiaľ starý web – otázka 21 |

Zdroje riadkov: HEAD SPA 30 – `meta description` koreňového `index.html:7` a živý web; Salón 30 – text
www.salon30.sk (menu „Cenník a služby“, „Trichologické vyšetrenie“, položky „Strih – dámske strihy“, „Farbenie a koloristika“)
a koreňový web (`assets/i18n/*.json`: „Kadernícke služby, farbenie, koloristiku a trichologické vyšetrenie nájdeš na www.salon30.sk“);
Barbershop 30 – `index.html` (`title`, podtitul úvodu). Telefóny iných prevádzok sa neuvádzajú (pravidlo v OTAZKY‑PRE‑MAJITELA.md, „Čo nerobíme“).
Externé odkazy s `target="_blank" rel="noopener"` ako ostatné externé odkazy webu.

Dôkazy curl (`curl -sS -o /dev/null -L -w '%{http_code} final=%{url_effective}'`):
- https://www.headspa30.sk/ → 200 final=https://www.headspa30.sk/ ; https://headspa30.sk/ → 200 (presmeruje na www)
- https://d8f5s88zjy-art.github.io/head-spa-30/ → 200
- https://www.salon30.sk/ → 200 ; https://salon30.sk/ → 200 final=https://www.salon30.sk/
- https://www.barbershop30.sk/ → 200 ; https://www.barbershop30.sk/rezervacia → 200
- https://booqme.app/sk/rezervacia/salon-30-head-spa → 200 ; https://booqme.app/sk/rezervacia/barbershop30 → 200

## 4. Otázky pre majiteľa

1. Garancia: ktoré znenie potvrdzujete (G1, G2 alebo G3)? Pri G3 dokedy po návšteve a za akých podmienok. Bez potvrdenia garancia na webe nebude a pilier nahradí „Remeslo“.
2. HEAD SPA 30: má odkaz v pätičke viesť na www.headspa30.sk (živá doména), alebo na adresu github.io z canonicalu koreňového webu? Obe fungujú.
3. Salón 30: je www.salon30.sk správny a aktuálny web, na ktorý máme odkazovať? Smieme ho uviesť ako „naša prevádzka“?
4. Nadpis „Naše prevádzky“: potvrdzujete, že všetky tri (HEAD SPA 30, Salón 30, Barbershop 30) sa majú na webe Barbershopu prezentovať ako naše? Doterajšie pravidlo v dokumentácii bolo opačné (nespomínať Salón 30 a HEAD SPA 30), po vašej dnešnej požiadavke ho upravíme.
5. Barbershop 30 v pätičke: odkaz na úvod tejto stránky; po spustení na www.barbershop30.sk (otázka 21) ho prepneme na doménu. Súhlasíte?
6. Môže zákazník prísť bez objednania (otázka 5)? Ak áno, pridáme otázku „Môžem prísť bez objednania?“.
7. Chcete pri barberoch skutočné údaje (od ktorého roku strihá, v čom je silný, jazyky)? Pošlite ich a riadky prispôsobíme; bez nich ostávajú bez faktov o osobe.
8. „Ako jediný barbershop v Nitre, už 8 rokov“ (otázka 9) v nových textoch nepoužívame; ostáva len v pôvodných kartách, kým to nepotvrdíte.
