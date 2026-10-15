# Návod: ako upravovať web GYM KLUB

Web <https://d8f5s88zjy-art.github.io/Lupa-gym/> upravujete sami v aplikácii **Pages CMS**. Je zadarmo, beží
v prehliadači (počítač, tablet aj mobil) a nepotrebujete na ňu žiadny program ani účet na GitHube.
Aplikácia je po anglicky, ale všetky časti webu a polia sú popísané po slovensky.

Zlatá rada: **nič nepokazíte natrvalo.** Keď niečo vyplníte zle, web sa nezmení a zostane taký, aký bol –
a na stránke <https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> sa dozviete, čo opraviť (pozri časť 10).

---

## 1. Prvé prihlásenie

1. Príde vám e-mail **„… invited you to "d8f5s88zjy-art/Lupa-gym"“** (od Pages CMS). Kliknite v ňom na tlačidlo
   **Join "d8f5s88zjy-art/Lupa-gym"**. **Pozvánka platí 24 hodín.**
2. Otvorí sa stránka prihlásenia. Je tam vaša e-mailová adresa – kliknite na pokračovanie.
3. Na e-mail vám príde **6-miestny kód** (predmet „Your Pages CMS temporary code is …“). Kód platí 5 minút.
4. Kód prepíšte do políčok a kliknite **Verify code**. Ste prihlásený.

Ak po kliknutí na pozvánku uvidíte **„Invite unavailable – This invitation is no longer available.“**, pozvánka
už vypršala. Nevadí: kliknite **Sign in** a prihláste sa e-mailom ako pri každom ďalšom prihlásení (nižšie).
Keby ani to nešlo, požiadajte správcu webu o novú pozvánku.

### Každé ďalšie prihlásenie

1. Otvorte <https://app.pagescms.org> (oplatí sa uložiť si ju medzi záložky).
2. Do políčka **Email** napíšte svoju e-mailovú adresu a kliknite **Continue with email**.
   (Tlačidlo „Sign in with GitHub“ nepoužívajte, to je pre správcu.)
3. Prepíšte 6-miestny kód z e-mailu a kliknite **Verify code**.
4. Ak vidíte viac projektov, otvorte **Lupa-gym**.

Kód nechodí? Pozrite priečinok Spam/Reklamy a skontrolujte, či je e-mailová adresa napísaná presne tá, na ktorú
prišla pozvánka.

**Dobré vedieť:** každá zmena sa uloží do verejného archívu webu (GitHub) a pri nej je vaše meno a e-mail, ktorým
sa prihlasujete. Archív si môže pozrieť ktokoľvek. Preto je lepšie prihlasovať sa pracovnou adresou (napr.
info@gymklub.sk), nie súkromnou – o pozvánku na ňu požiadajte správcu webu.

## 2. Ako to vyzerá

Vľavo je menu (na mobile ho otvoríte ikonou ☰ vľavo hore) – každá položka je jedna časť webu:

| Menu | Čo tam upravíte |
|---|---|
| **Oznam na webe** | krátky oznam v páse pod hlavičkou (napr. zmena hodín cez sviatky) |
| **Prevádzka a hodiny** | adresa, telefón, e-mail, Instagram, Facebook, otváracie hodiny, štátne sviatky |
| **Tréneri** | karty trénerov a tlačidlá filtra nad nimi |
| **Rozvrh lekcií** | skupinové lekcie, ich dni a časy, kto ich vedie |
| **Cenník** | ceny, poznámky, prvá návšteva |
| **Fotky priestoru a baru** | prechádzka priestorom, mozaika fotiek, bar |
| **Recenzie** | recenzie zákazníkov |
| **Otázky** | otázky a odpovede |
| **Texty na stránke** | nadpisy a texty jednotlivých častí webu (rozdelené na menšie časti) |
| **Vyhľadávače** | ako web vyzerá v Google a pri zdieľaní na Facebooku či WhatsAppe |
| **Nahraté fotky** | všetky fotky, ktoré ste nahrali (len na prezeranie, fotky pridávate pri poliach „Nová fotka“) |

Pod každým poľom je sivý popis: čo do poľa patrí, príklad a kde sa to na webe zobrazí.

Tlačidlá, ktoré budete používať:

- **Save** (vpravo hore) – uloží zmeny. Bez neho sa nič nezmení. Kým ste nič nezmenili, je sivé.
- **Add an item** – pridá položku do zoznamu (nový tréner, nová lekcia, nová fotka…).
- Položky v zozname sú zbalené – kliknutím na názov sa rozbalia. Potiahnutím za úchyt zmeníte poradie
  (poradie v CMS = poradie na webe).
- **Kôš** pri položke ju zmaže. Objaví sa okno **„Remove this item? This action cannot be undone.“** – kliknite
  **Remove**. Na webe sa to prejaví až po **Save**; ak ste položku zmazali omylom, stránku zatvorte bez uloženia.
- Pri fotke: **Upload** = nahrať novú fotku z počítača/mobilu, **Select** = vybrať už nahratú.

### Na mobile

- Menu je skryté – otvoríte ho ikonou **☰ vľavo hore**.
- Tlačidlo **Save** je na úzkej obrazovke len **ikona diskety vpravo hore** (bez nápisu). Je sivá, kým nič
  nezmeníte; po zmene zčernie a môžete ju stlačiť.
- Všetko ostatné funguje rovnako ako na počítači.

## 3. Zmena otváracích hodín

1. Menu **Prevádzka a hodiny** → časť **Otváracie hodiny**.
2. Pri dni prepíšte **Otvára o** a **Zatvára o**. Píšte vždy **dve číslice : dve číslice**, napr. `06:00`,
   `21:00`, `08:30` (nie `6:00` ani `6.00`).
3. Kliknite **Save**.

Nové hodiny sa samy prepíšu všade: v úvode, v tabuľkách, v textoch ako „Cez týždeň od 06:00 do 21:00…“, v stave
„Otvorené do …“ aj pre Google.

Keď sa niektorý deň líši (napr. zmeníte len sobotu na 14:00), texty to napíšu samy do zátvorky, napr.
„v sobotu a v nedeľu od 08:30 do 14:00 (v nedeľu do 18:00)“. Nemusíte nič prepisovať.
Môžete zmeniť ľubovoľný deň aj viac dní naraz.

Ak má byť niektorý deň **zatvorené** alebo ide o **jednorazovú výnimku** (sviatok, dovolenka), hodiny
nemeňte – napíšte **oznam** (časť 6). Zatvorený celý deň web zatiaľ nevie zobraziť.

## 4. Tréner: úprava a pridanie

### Úprava (telefón, popis, fotka)

1. Menu **Tréneri** → zoznam **Tréneri** → kliknite na meno.
2. Zmeňte, čo treba. Telefón píšte napr. `0905 123 456` alebo `+421 905 123 456` – web ho zobrazí jednotne.
3. **Save**.

### Nový tréner

1. Menu **Tréneri** → pod zoznamom trénerov kliknite **Add an item**.
2. Vyplňte:
   - **Meno** – napr. `Peter Novák`
   - **Skratka (id)** – krátko, malými písmenami bez diakritiky a medzier, napr. `novak`.
     Po uložení ju už nemeňte (podľa nej rozvrh vie, kto lekciu vedie).
   - **Zameranie** – napr. `Fitness`
   - **Popis** – dve-tri vety
   - **Telefón** – nepovinné
   - **Patrí pod filtre** – vyberte, pod ktorými tlačidlami (Fitness, Výživa…) sa má ukázať
3. **Fotka:** pri poli **Nová fotka (nahrať)** kliknite **Upload** a vyberte portrét **na výšku**
   (ideálne aspoň 480 × 600 bodov, **najviac asi 3 MB** – pozri časť 8). Web ju sám zmenší, oreže a odstráni z nej
   údaje o mieste. Pole „Fotka zo zoznamu“ nechajte prázdne.
4. Potiahnutím presuňte trénera na miesto, kde má byť, a kliknite **Save**.

Počet trénerov v texte („Jedenásť trénerov…“) sa prepočíta sám.

**Tréner odchádza:** ak vedie lekciu, najprv v **Rozvrhu lekcií** nastavte pri lekcii iného trénera
(pole **Tréner (skratka)**) alebo lekciu zmažte. Ak je to tréner Mastro Defence System, zmeňte skratku aj v
**Texty na stránke → Mastro Defence System → Tréner pre tlačidlo „Zavolať“ (skratka)**. Skratku každého trénera
vidíte v zozname trénerov hneď za menom (napr. „Michal Šášik – skratka sasik“). Potom trénera v zozname zmažte
(kôš → Remove) a dajte **Save**.
Keby ste na lekciu zabudli, web sa nezverejní a na stránke stavu napíše presne, ktorú lekciu treba upraviť.

## 5. Zmena ceny

1. Menu **Cenník**.
2. **Hlavné karty (3)** – rozbaľte kartu a zmeňte **Cena v €**. Píšte len číslo: `6`, `50`, pri centoch
   s bodkou `3.5` (na webe bude „3,50 €“). Pole nesmie ostať prázdne – CMS by vypísal „This field is required“.
3. **Ďalšie ceny (tabuľka)** – to isté. Pri balíkoch vstupov prepočítajte aj poznámku „… € za vstup“.
4. **Save**.

Cena jednorazového vstupu a permanentky sa sama prepíše všade, kde je v texte značka `{vstup}` alebo
`{permanentka}` – veľký nadpis „Vstup 6 €.“, pás s ponukou, karta Fitness tréning, prvá návšteva, Google –
aj v nadpise cenníka napísanom slovom („Šesť eur dnes, päťdesiat na mesiac.“, značky `{vstup_slovom}` a
`{permanentka_slovom}`).

## 6. Oznam „Na Vianoce zatvorené“

1. Menu **Oznam na webe**.
2. Zapnite **Zobraziť oznam na webe**.
3. **Text oznamu**, napr.: `24. až 27. 12. zatvorené, od pondelka 28. 12. sme tu opäť od 06:00.`
   (najviac 160 znakov)
4. **Zobrazovať od**: `20. 12. 2026`, **Zobrazovať do (vrátane)**: `27. 12. 2026`. **Oba dátumy vyberte v kalendári**
   – kým ich nevyberiete, sú prázdne a web oznam nezverejní (napíše, že dátum chýba).
5. Nepovinné: **Odkaz v ozname** = „Kontakt a otváracie hodiny“, **Text odkazu** = `Otváracie hodiny`.
6. **Save**.

Oznam sa ukáže ako tenký pás pod hlavičkou webu **len v nastavenom období** a potom sa sám skryje – netreba ho
po sviatkoch vypínať. Oznam môžete pripraviť aj dopredu. Ak ho chcete skryť skôr, vypnite prepínač a uložte.

## 7. Nová fotka do baru (alebo do mozaiky)

1. Menu **Fotky priestoru a baru** → **Bar** → **Fotky baru** → **Add an item**.
2. **Tvar dlaždice**: *Široká* (2 miesta) alebo *Vysoká* (1 miesto). Mozaika má na počítači 4 miesta v rade a dnes
   sú v nej presne 2 rady (8 miest). Aby bol aj nový rad plný, pridajte naraz **1 širokú a 2 vysoké** alebo
   **2 široké** fotky (alebo zmeňte tvar inej fotky). Keď pridáte len jednu, web ju roztiahne na celý rad, aby
   nebola diera – vyzerá to v poriadku, len je fotka viac orezaná.
3. Pri **Nová fotka (nahrať)** kliknite **Upload** a vyberte fotku (JPG, PNG alebo WebP; na šírku aspoň
   960 bodov, na výšku aspoň 640 bodov; **najviac asi 3 MB** – pozri časť 8).
4. **Popis na fotke** – krátko, napr. `Káva z pákového kávovaru`.
5. **Popis fotky (pre nevidiacich a Google)** – jedna veta, čo je na fotke.
6. **Save**.

Fotka sa nahrá hneď (to je jedno uloženie) a na web sa dostane po uložení celej stránky (**Save**).

**Poloha vo fotkách:** fotky z mobilu často obsahujú miesto, kde boli odfotené. Na webe sa to odstráni, ale
pôvodná fotka zostáva uložená v archíve webu, ktorý je verejný. Fotky z fitka nevadia (adresa je verejná);
pri súkromných fotkách vypnite v mobile polohu pre fotoaparát.

## 8. Fotky z mobilu: veľkosť a formát

- **Najviac asi 3 MB.** Väčšiu fotku CMS nenahrá – ukáže chybu ako **„Upload failed“** alebo
  **„Request Entity Too Large“**. Bežná fotka z mobilu má 3–5 MB, preto ju najprv zmenšite:
  - pošlite si ju sami sebe cez **WhatsApp** (bežné odoslanie fotku zmenší) alebo **e-mailom** – iPhone sa pri
    odosielaní spýta na veľkosť, zvoľte **Stredná**; uloženú prílohu potom nahrajte;
  - na Androide (napr. Samsung) v Galérii: fotka → ⋮ → **Zmeniť veľkosť** a uložiť menšiu kópiu;
  - na počítači stačí stránka <https://squoosh.app> (nahrať, zmenšiť, stiahnuť).
  Webu stačí fotka okolo 2000 bodov na šírku.
- **„Invalid file type“** znamená nepodporovaný formát (najčastejšie HEIC z iPhonu uložený v aplikácii Súbory).
  Fotku pošlite z aplikácie **Fotky**, alebo v iPhone nastavte **Nastavenia → Fotoaparát → Formáty →
  Najkompatibilnejší** – nové fotky budú v JPG.

## 9. Značky v textoch

Niektoré texty obsahujú **značky v kučeravých zátvorkách** – web za ne dosadí aktuálny údaj. Nemažte ich,
ak chcete, aby sa údaj menil sám:

| Značka | Na webe | Mení sa podľa |
|---|---|---|
| `{vstup}` | 6 € | Cenník |
| `{permanentka}` | 50 € | Cenník |
| `{vstup_slovom}`, `{permanentka_slovom}` | šesť, päťdesiat | Cenník (cena slovom) |
| `{karticka}` | 3 € | Cenník → Klubová kartička |
| `{od_do_pracovne_dni}` | od 06:00 do 21:00 | otváracích hodín |
| `{od_do_vikend}` | od 08:30 do 18:00 | otváracích hodín |
| `{hodiny_pracovne_dni}` | 06:00–21:00 | otváracích hodín |
| `{hodiny_vikend}` | 08:30–18:00 | otváracích hodín |
| `{pocet_trenerov}` | jedenásť trénerov | počtu trénerov |
| `{pocet_zaberov}` | jedenásť záberov | počtu záberov prechádzky |
| `{pocet_zaberov_cislom}` | 11 záberov | počtu záberov prechádzky |
| `{pocet_dalsich_miest}` | šesť ďalších miest | počtu fotiek v mozaike |
| `{pocet_recenzii}` | štyri recenzie | počtu recenzií |
| `{pocet_pevnych_bodov}` | päť pevných bodov | počtu lekcií |
| `{v_pocte_krokov}` | v troch krokoch | počtu krokov prvej návštevy |

Značku píšte presne tak, ako je v tabuľke – bez medzier, s jednou zátvorkou na každej strane. Preklep
(napr. `{ vstup }` alebo `{vstp}`) web nezverejní a na stránke stavu ukáže, kde je.

Ďalšie užitočné veci:

- **Tučné písmo:** slovo dajte medzi dve hviezdičky na každej strane: `**v hotovosti aj kartou**`.
- HTML značky (`<b>`, `<a>`…) nepíšte – na webe by sa zobrazili ako obyčajný text.
- Nadpisy majú dve časti: prvá je biela, druhá zvýraznená farbou webu.
- Časy lekcií v **bežných textoch** (napr. „Pondelok o 16:00“ v popise trénera) sa samy nemenia. Ak zmeníte
  rozvrh, prepíšte ich aj tam (zoznam takých miest je v upozorneniach na stránke stavu).

## 10. Čo sa stane po uložení

1. Po **Save** sa zmena uloží do archívu webu (GitHub).
2. Web sa z nej sám zostaví a **do 1–2 minút** je zmena na <https://d8f5s88zjy-art.github.io/Lupa-gym/>.
   Ak ju nevidíte, počkajte chvíľu a obnovte stránku (na mobile potiahnutím nadol, na počítači Ctrl+F5).
3. Pred zverejnením web všetko skontroluje (časy, telefóny, fotky, skratky trénerov…). **Ak je niekde chyba,
   nezverejní sa nič** – web zostane taký, aký bol.

### Stránka stavu – keď sa web neobnoví

Výsledok každej kontroly je na **<https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html>** (uložte si ju medzi
záložky; netreba sa nikam prihlasovať). Obnoví sa 1–2 minúty po každom uložení.

- **Zelený pás „Web je zverejnený“** = všetko v poriadku. Pod ním môžu byť **upozornenia** – web nezastavili,
  ale oplatí sa ich prečítať (napr. menšia fotka, čas v texte, ktorý už nie je v rozvrhu).
- **Červený pás „Posledná zmena sa nezverejnila“** = chyba. Pod ním je presná hláška, napr.:

  ```text
  Prevádzka a hodiny › Otváracie hodiny › Pondelok › Otvára o
  Zadané: „6:00“
  Čo je zle: Čas píšte ako HH:MM s nulou na začiatku, napr. 06:00 (nie 6:00 ani 6.00).
  ```

  Prvý riadok je cesta v menu CMS k poľu, ktoré treba opraviť. Opravte ho v CMS a dajte **Save** – web sa
  zostaví znova a stránka stavu zozelenie.
- Pri riadku **„Kontrola:“** je čas poslednej kontroly. Ak je starý, počkajte minútu a stránku obnovte.

Ak si neviete rady (alebo stránka stavu píše, že chyba nie je vo vašom obsahu), pošlite správcovi webu odkaz na
stránku stavu alebo jej snímku.

## 11. Čo radšej nemeniť

- **Skratku (id)** existujúceho trénera – rozvrh a blok MDS sa na ňu odvolávajú.
- **Druh** lekcie a tlačidiel filtra – spájajú rozvrh s filtrom trénerov.
- Fotky vo **Filmovom páse** a úvodnú fotku vyberáte len zo zoznamu (majú priestorový efekt); nové sa tam nahrať
  nedajú.
- Videá a obrázok pre zdieľanie sa cez CMS nemenia – ak treba, napíšte správcovi webu.
