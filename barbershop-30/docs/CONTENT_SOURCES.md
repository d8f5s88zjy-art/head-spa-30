# Zdroje obchodných údajov – BARBERSHOP 30

Každý údaj na webe má tu zapísaný zdroj, dátum získania a stupeň overenia.
Stupne: **overené‑oficiálne** (web podniku alebo jeho rezervačný systém),
**tretia strana** (katalógy, recenzné weby), **slabé** (jediná neoficiálna zmienka),
**neoverené** (tvrdenie majiteľa alebo odhad – na web ide až po potvrdení).
Dátum získania všetkých údajov: **2026‑10‑09**, pokiaľ nie je uvedené inak.

## Identita a kontakt (overené‑oficiálne, https://www.barbershop30.sk/)

| údaj | hodnota | poznámka |
|---|---|---|
| názov | Barbershop30 (web, logo „30 Barbershop Holičstvo“) | Facebook stránka „Barbershop 30“; na webe používame „Barbershop 30“ ako značku a „Barbershop30“ v právnych údajoch |
| adresa | Mostná 30, 949 01 Nitra | fasáda na fotkách z aktuálneho webu potvrdzuje susedstvo so Salónom 30 (spoločná budova) |
| telefón | 0951 267 203 (+421 951 267 203) | `tel:+421951267203` |
| e‑mail | info@barbershop30.sk | |
| otváracie hodiny | Po–Pi 09:00–19:00, So 09:00–14:00, Ne zatvorené | |
| rezervácia | https://www.barbershop30.sk/rezervacia | vlastný rezervačný systém podniku (Vue komponent, endpoint /rezervacia/ajax); nie Bookio. Nový web naň odkazuje, neembeduje ho. Predvoľba služby/barbera cez URL nie je zdokumentovaná → neprenáša sa. |
| farbenie, melír, trvalá | https://booqme.app/sk/rezervacia/barbershop30 | samostatná Booqme stránka (pracovníčka Romana); na novom webe len ako odkaz v sekcii služieb |
| založenie | 2019 („Sme tu pre vás už od roku 2019“) | majiteľ uvádza recepciu „8 rokov“ (= 2018) – **nesúlad, neoverené**; na webe používame „od roku 2019“ |
| kapacita | 8 kresiel, recepčná, káva a minerálka zdarma, online rezervácie 24/7, strihanie detí | prevzaté z „Prečo práve my?“ na aktuálnom webe |
| Instagram | https://www.instagram.com/barbershop30_nitra/ | |
| Facebook | https://www.facebook.com/barbershop30nitra/ | |
| TikTok | nenájdený | |
| prevádzkovateľ | FACEPALM, s.r.o., IČO 52231381, DIČ 2120952218 | ORSR https://www.orsr.sk/vypis.asp?ID=554260&SID=9&P=0 (zápis 05.03.2019) – ide do pätičky ako právne údaje |
| analytika na starom webe | GTM-K8PZD4KR, GA4 G-D9FMT63FQC | nový web žiadnu analytiku nezapája, kým majiteľ nepotvrdí súhlasovú lištu |

## Tím (overené‑oficiálne, https://www.barbershop30.sk/#nas-team)

Krstné mená a roly presne podľa aktuálneho webu; portréty prevzaté z toho istého
webu (`source/team/`). Priezviská ani špecializácie web neuvádza – nevymýšľame.

| portrét (súbor na starom webe) | meno | rola |
|---|---|---|
| team/47.png | Nikolas | Barber |
| team/50.png | Kristián | Barber |
| team/49.png | Damian | Barber |
| team/40.png | Michal | Barber |
| team/48.png | Andy | Barber |
| team/41.png | Dominika | Barberka |
| team/38.png | Kevin | Barber |
| team/18.png | Lajko | Barber |
| team/2.png | Jojo | Barber |
| team/42.png | Adrian | Barber |

Romana (farbenie/melír/trvalá) je uvedená len na Booqme – na webe ju spomenieme
iba v odkaze na Booqme, bez portrétu.

## Služby a ceny (overené‑oficiálne, JSON rezervačného systému na https://www.barbershop30.sk/rezervacia, 2026‑10‑09)

| id | služba | cena | trvanie | opis zo systému |
|---|---|---|---|---|
| 1 | Pánsky strih | 18 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej |
| 18 | Pánsky strih a Úprava brady | 28 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej.Úprava brady, naparenie horúcim ručníkom, britva, záverečný styling s prípravkami. |
| 5 | Strih pre malých gentlemenov | 15 € | None min | Klasický strih, Fade, prípadne kreatívne ornamenty vo vlasoch, umytie vlasov, záverečný styling - do 10 rokov |
| 3 | Úprava brady | 15 € | None min | Úprava brady, naparenie horúcim ručníkom, britva, záverečný styling s prípravkami |
| 19 | Pánsky strih - dĺžka vlasov nad 10cm | 22 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej |
| 14 | Balíček 1 | 30 € | None min | Konzultácia, strihanie strojčekom/nožnicami, úprava brady, Hot Towel, úprava obočia, depilácia uší, umytie vlasov, vlasový tonic, fénovanie, záverečný styling a aplikácia kolínskej |
| 15 | Ultra inclusive Barbershop30 | 40 € | None min | Konzultácia, strihanie strojčekom/nožnicami, úprava brady, Hot Towel, umytie vlasov, vlasový tonic, depilácia uší, úprava obočia, naparenie tváre, peeling, relaxačná maska podľa vlastného výberu, fénovanie, pohárik whisky, záverečný styling a aplikácia kolínskej |
| 6 | Starostlivosť o pleť PREMIUM | 21.5 € | None min | Naparenie tváre, peeling, relaxačná maska podľa vlastného výberu |
| 4 | Holenie do hladka Hot Towel | 15 € | None min | Holenie britvou, naparenie horúcim ručníkom, ošetrenie pleti po holení |
| 2 | Oholenie hlavy | 13 € | None min | Príprava pokožky hlavy na holenie britvou, umývanie a sušenie, záverečný styling |
| 7 | Úprava obočia | 3 € | None min | Vytrhanie a úprava obočia |
| 8 | Depilácia uši a nosa voskom | 5.5 € | None min | Depilácia uší |
| 10 | Kreatívny ornament na hlave | 4 € | None min | . |
| 11 | Farbenie brady | 10 € | None min | Farbenie brady profesionálnymi farbami - 20 ml farby |
| 12 | Farbenie obočia | 5 € | None min | Farbenie obočia profesionálnymi farbami |

Ceny sú konečné (bez „od“). Booqme služby (farbenie 40–80 €, trvalá 45–60 €,
tónovanie 35–40 €, melír 45 €) ostávajú len ako odkaz – ich ceny sa na novom webe
nezobrazujú, aby neboli dva cenníky na jednom mieste.

## Dôkazy a ocenenia (tretia strana – na webe iba s odkazom na zdroj)

- Google hodnotenie: agregované cez Zlatá Firma (5,0 z 792 recenzií Google Maps)
  a QuickBook (5/5 z 813) – priamo z Google Maps nečitateľné. Na webe: „Hodnotenie
  na Google“ ako odkaz na profil, **bez čísla v schéme** a bez vymyslených citácií.
  Zdroj: https://www.zlatafirma.eu/company/barbershop-30-227214
- Zlatá Firma: „Víťaz ocenenia“, odznaky 2022–2026 (vrátane 2024). Orly kaderníctva:
  laureát 2022, 2023, 2025, 2026. Obe sú komerčné ratingy z recenzií. Plaketu „2024“
  v prevádzke nevieme jednoznačne priradiť – **spýtať sa majiteľa** pred použitím.
- Školenia: barberkurzy.sk („Profesionálne barber kurzy, Est'd 2018“) sídli na
  Mostnej 30, iný telefón (0951 207 055); prepojenie so značkou Barbershop 30 je
  **slabé/neoverené** – na webe len ako samostatný odkaz „Školenia“, ak ho majiteľ potvrdí.

## Médiá

- 45 fotiek od majiteľa (`source/photos/`), všetky na výšku; inventár v `source/audit.json`.
- Z aktuálneho webu prevzaté (`source/team/`, `source/gallery/`, `source/slider/`,
  `source/logo.png`): 10 portrétov, 17 profesionálnych fotiek na šírku (4096×2731),
  3 slider zábery (1920×1200), logo 100×100 px. Práva: fotky zverejnil podnik na
  vlastnom webe; **potvrdiť u majiteľa**, že ich môžeme použiť na novom webe
  (najmä portréty – súhlas zamestnancov).
- Vektorové logo nemáme – na webe je značka sadzaná písmom; logo PNG slúži len
  ako favicon/ikonka. **Vyžiadať vektor od majiteľa.**

## Čo ostáva neoverené (`data-required` v kóde)

- „Recepcia funguje 8 rokov“ – nesúlad s rokom 2019 na webe.
- Plaketa 2024 v prevádzke.
- Školenia pod značkou Barbershop 30.
- Vzťah so Salónom 30 (spoločná budova; žiadny web nespomína druhý).
- Vernostná karta – žiadny zdroj; na webe sa nezobrazuje.
- Výsledky strihov (pred/po) – žiadne fotky; galéria zatiaľ ukazuje priestor a remeslo.

## Videá od majiteľa (2026‑10‑09)

Tri telefónne videá z prevádzky (barberi pri práci). Vidno zamestnancov spredu a
klientov zozadu. Na webe len ako tiché slučky; **pred zverejnením potvrdiť súhlas
zamestnancov a to, že klienti nie sú rozpoznateľní** (v `remeslo-strojcek` a
`tim-v-akcii` sú klienti zozadu alebo z profilu v diaľke).
