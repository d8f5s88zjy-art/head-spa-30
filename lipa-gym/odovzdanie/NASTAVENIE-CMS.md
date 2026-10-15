# Nastavenie Pages CMS (pre vlastníka GitHub účtu d8f5s88zjy-art)

Cieľ: Ondrej (bez GitHub účtu) upravuje obsah webu v <https://app.pagescms.org>. Treba to urobiť raz,
trvá to asi 10 minút a je to zadarmo. Pages CMS je open-source (github.com/pages-cms/pages-cms), hostovaná
verzia app.pagescms.org pristupuje k repozitáru cez svoju GitHub App.

## 0. Čo už je v repozitári

- `.pages.yml` – nastavenie CMS (menu, polia, popisy, pravidlá); obsah je v `obsah/*.json`.
- `.github/workflows/pages.yml` – pri každom pushi do `main` (aj z CMS) obsah skontroluje, zostaví web
  a zverejní ho do vetvy `gh-pages`. Pri chybe nezverejní web, len stránku **stav.html** so slovenskou hláškou
  (<https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> – Ondrej ju vidí bez prihlásenia; Summary behu
  v záložke Actions vidí len prihlásený používateľ GitHubu).

Skontrolujte v repozitári **Settings → Pages**: *Source* = **Deploy from a branch**, vetva **gh-pages**,
priečinok **/ (root)**. A v **Settings → Actions → General** musia byť Actions povolené; workflow si práva na
zápis do `gh-pages` žiada sám (`permissions: contents: write`). Ak by bol v **Workflow permissions** zvolený
režim len na čítanie a nasadenie by padalo na `git push`, prepnite ho na „Read and write permissions“.

Vetva `main` nesmie vyžadovať pull request ani podpis commitov (Settings → Branches / Rules) – CMS zapisuje
priamo do `main`. Ak tam pravidlo je, povoľte výnimku pre aplikáciu Pages CMS.

### Pred prvým pushom

Na GitHube je dnes `main` = `4fb1416` a zverejnený web je z neho. Lokálna vetva má navyše commit `69d7665`
(logo z členskej kartičky v hlavičke a pätičke namiesto činky, položka menu „Bar“, blok „Po tréningu na kávu“
s 5 fotkami, nová fotka Marka Riga) a za ním prechod na CMS. **Prvý push teda zverejní aj obsah `69d7665`.**
Ak ho chcete overiť samostatne, pushnite najprv len `69d7665` (`git push origin 69d7665:main`), pozrite web
a až potom zvyšok.

## 1. Inštalácia Pages CMS len na repozitár Lupa-gym

1. Otvorte <https://app.pagescms.org> a kliknite **Sign in with GitHub** (prihláste sa účtom
   `d8f5s88zjy-art`).
2. Pages CMS vás pošle na inštaláciu svojej GitHub App (prípadne kliknite na tlačidlo inštalácie / „Install“).
3. Ako účet vyberte **d8f5s88zjy-art**.
4. Zvoľte **Only select repositories** a vyberte len **Lupa-gym**. (Neodporúčame „All repositories“ – aplikácia
   by mala zápis do všetkých vašich repozitárov.)
5. Potvrďte **Install**. GitHub pritom zobrazí oprávnenia, ktoré aplikácia žiada. Podľa dokumentácie Pages CMS
   sú to najmä: obsah repozitára (*Contents*) – čítanie a zápis (ukladanie obsahu a fotiek), *Metadata* –
   čítanie, *Actions* – čítanie a zápis (stav a spúšťanie workflowov), *Checks* a *Commit statuses* – čítanie,
   *Administration* – čítanie a zápis, a e-mailová adresa používateľa – čítanie. Presný zoznam vidíte na
   obrazovke inštalácie; vzťahuje sa len na vybrané repozitáre.
6. Po návrate do Pages CMS otvorte **Lupa-gym** (vetva `main`). Vľavo musíte vidieť menu: Oznam na webe,
   Prevádzka a hodiny, Tréneri, Rozvrh lekcií, Cenník, Fotky priestoru a baru, Recenzie, Otázky,
   Texty na stránke, Vyhľadávače a Nahraté fotky.

Skúška: v **Oznam na webe** zapnite oznam, napíšte krátky text, v kalendári vyberte dnešný dátum v oboch poliach
a dajte **Save**. V repozitári sledujte záložku **Actions** – beh má skončiť zelenou fajkou, o 1–2 minúty je pás
s oznamom na webe a <https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> ukazuje „Web je zverejnený“.
Potom oznam vypnite a uložte.

## 2. Pozvanie Ondreja

1. V Pages CMS v projekte **Lupa-gym** otvorte v menu **Collaborators**.
2. Kliknite **Invite**, zadajte Ondrejov e-mail a **Send invite**.
3. Ondrejovi príde e-mail „… invited you to "d8f5s88zjy-art/Lupa-gym"“ s tlačidlom **Join "d8f5s88zjy-art/Lupa-gym"**. Prihlasuje sa
   e-mailom a 6-miestnym kódom, ktorý mu príde poštou (platí 5 minút) – GitHub účet nepotrebuje.
4. **Odkaz v pozvánke platí 24 hodín.** Po vypršaní uvidí „Invite unavailable“ – prístup mu tým nezanikne,
   stačí sa prihlásiť na app.pagescms.org tým istým e-mailom (Continue with email). Novú pozvánku pošlete v
   **Collaborators** cez ponuku **⋮** pri jeho e-maile → **Resend invitation**.
5. Pošlite mu [NAVOD-PRE-ONDREJA.md](NAVOD-PRE-ONDREJA.md) (napr. ako PDF alebo odkaz na súbor v repozitári)
   a odkaz na stránku stavu.

**E-mail v histórii:** v `.pages.yml` je `settings.commit.identity: user`, takže commity z CMS nesú meno a
e-mail toho, kto zmenu urobil (v histórii vidno, kto čo zmenil). Repozitár je verejný, takže **Ondrejov e-mail
bude verejne čitateľný**. Pozvite ho preto na pracovnú adresu (napr. info@gymklub.sk, ktorá je na webe aj tak),
nie na súkromnú. Ak by to nevyhovovalo, zmeňte v `.pages.yml` `identity: user` na `identity: app` – commity potom
budú pod menom aplikácie Pages CMS (autora zmeny už nebude vidno).

Čo môže spolupracovník: otvárať pozvané repozitáre, upravovať obsah a fotky. Nemôže: meniť `.pages.yml`,
pozývať ďalších ľudí, mazať súbory obsahu (`operations: { delete: false }`).

## 3. Bežná prevádzka

- **Stav webu:** <https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> – výsledok poslednej kontroly (zelený =
  zverejnené aj s upozorneniami, červený = nezverejnené s presnou hláškou: pole v CMS, zadaná hodnota, čo je
  zle, ako opraviť). Podrobnosti behu (log, testy) sú v záložke **Actions**; pri chybe sú hlášky aj ako
  anotácie behu. Web ostáva v poslednej funkčnej podobe.
- **Chyba v nástrojoch** (zlyhali testy generátora): stránka stavu píše, že nejde o chybu v obsahu. Testy
  pracujú so zamrazenou kópiou obsahu `nastroje/testdata/obsah/`, takže ich Ondrejove úpravy nezhodia.
- **Veľkosť fotiek:** hostovaný app.pagescms.org posiela fotku v jednej požiadavke (base64) a Vercel ju nad
  približne 4,5 MB odmietne (413), takže fotka môže mať najviac asi 3 MB. Návod pre Ondreja (časť 8) opisuje,
  ako fotku zmenšiť. Generátorovi stačí okolo 2000 px na šírku.
- **Vrátenie zmeny:** v GitHube otvorte commit z CMS a použite **Revert** (alebo v CMS prepíšte hodnotu späť).
- **Nová disciplína** (nový druh lekcie/filtra, napr. joga): doplňte hodnotu do komponentu `kod_filtra`
  v `.pages.yml`; tlačidlo filtra potom Ondrej pridá sám (Tréneri → Tlačidlá filtra).
- **Nové hotové fotky do zoznamov** (s variantmi v `assets/img/f`): `python3 nastroje/zostav.py --vypis-fotky`
  a doplniť `components` v `.pages.yml`; test stráži zhodu.
- **Vlastná doména:** zmeňte `adresa_webu` v `nastroje/nastavenia.json` (a odkazy na stav.html v návode).

## 4. Zrušenie prístupu

- **Len Ondrejovi:** Pages CMS → Lupa-gym → **Collaborators** → ⋮ pri jeho e-maile → **Remove**.
- **Úplne odpojiť Pages CMS:** GitHub → **Settings → Applications → Installed GitHub Apps** → Pages CMS →
  **Configure** → v časti *Repository access* odoberte Lupa-gym, alebo dole **Uninstall**. Web aj obsah
  zostanú, len sa nebude dať upravovať cez CMS (obsah `obsah/*.json` sa dá stále upraviť priamo v GitHube).
- Ak aplikáciu odinštalujete a znova nainštalujete, spolupracovníkov treba pozvať znova.

## 5. Súkromie

Repozitár je verejný. Fotky nahraté cez CMS sa ukladajú do `assets/img/nahrate/` v pôvodnej podobe (môžu
obsahovať EXIF vrátane GPS polohy). Na web sa dostanú len zmenšené kópie bez metadát a generátor pri fotke
s GPS vypíše upozornenie (na stránke stavu). Ak by originál prezrádzal súkromné miesto, treba ho odstrániť
z repozitára aj z jeho histórie (napr. `git filter-repo`) – samotné zmazanie súboru históriu nevyčistí.
Pri commitoch z CMS je meno a e-mail autora (pozri časť 2).
