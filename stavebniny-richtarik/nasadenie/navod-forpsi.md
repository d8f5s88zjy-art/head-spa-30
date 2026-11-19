# Stavebniny Richtárik – ako dať nový web na Forpsi

Návod pre toho, kto web nahráva prvý raz. Platí pre **Hosting Linux** vo Forpsi. Na Hosting Windows vo Forpsi sa správa webu spustiť nedá (krok 0).

Návod sme písali podľa návodov Forpsi. Na skutočnom účte Forpsi sme nič z toho neskúšali. Kde si nie sme istí, je slovo **NEOVERENÉ**. Názvy tlačidiel v účte Forpsi máme z českých návodov, v slovenskom účte môžu znieť trochu inak.

## Čo máš mať pred sebou

{CASTI}
- **NAVOD-FORPSI.pdf** – tento návod (to isté je v NAVOD-FORPSI.txt)
- **navod-sprava.pdf** – návod pre Mária, ako si mení veci na webe (dáš mu ho v kroku 10)

Potrebuješ **počítač** (Windows alebo Mac). Z telefónu web nahrávať neodporúčame. Ak počítač nemáš: kroky 3 až 5 môže spraviť ktokoľvek s počítačom, stačia mu údaje k FTP od Mária.

Čas: pri počítači asi hodinu. Na doménu a zámok (https) sa potom čaká jeden až niekoľko dní.

!> Heslá nikdy neposielaj nám ani nikomu inému. Keď niečo nejde, odfoť obrazovku (bez hesiel) a pošli nám ju.

## Čo nikdy nemazať

Keď už nový web na Forpsi beží, v priečinku www nikdy nemaž:

- priečinok **sprava** a priečinok, ktorého meno sa začína **sprava-data** (Máriov účet, všetky jeho zmeny a história; môže byť vo www alebo vedľa www),
- priečinky **img/s** a **pdf/s** (fotky a PDF, ktoré nahral Mário),
- priečinky **www**, **subdoms** a **backups-forpsi** (patria Forpsi, nepremenúvaj ich).

Vo FileZille nikdy nepoužívaj „synchronizovať“ ani „zrkadliť“.

## Ak už nový web na Forpsi beží (ďalšie nahratie)

Tento návod je na **úplne prvé nahratie**. Nové ZIPy na už bežiaci web nenahrávaj sám od seba:

1. Mário v správe ťukne Nastavenia → Stiahnuť zálohu a súbor nám pošle.
2. My pripravíme nové ZIPy, v ktorých sú jeho zmeny.
3. Potom sprav len kroky 3 a 5 (krok 4 preskoč, nič nemaž). Súbory sa prepíšu.

Ak FileZilla pri niektorých súboroch napíše, že ich nemôže prepísať (Permission denied, chyba 550), nič nemaž a napíš nám. Stáva sa to pri stránkach, ktoré medzitým prepísala správa.

## Krok 0 – čo má Mário v účte Forpsi

Trvá 5 minút, nič sa tým nemení. Sprav ho skôr, než začneš čokoľvek nahrávať.

Mário sa prihlási na admin.forpsi.sk a vľavo otvorí **Webhosting**.

**a)** Je tam riadok stavebninyrichtarik.sk a v jeho detaile „OS: Linux“? Pokračuj otázkou d).

**b)** Je tam „OS: Windows“? **STOP.** Na Windows hostingu Forpsi nie je PHP, správa webu by nešla a Mário by si nevedel sám meniť veci. Mário napíše podpore Forpsi:

veta> Chcem zmeniť Hosting Windows na Hosting Linux. Čo to stojí a čo sa stane s e-mailami?

Odpoveď nám prepošli (bez hesiel). Nič nenahrávaj.

**c)** Riadok tam nie je, alebo Mário účet vo Forpsi nemá? **STOP.** Web dnes beží u iného poskytovateľa, nie vo Forpsi. Mário potrebuje službu **Hosting Linux Easy** (cenník Forpsi k 19. 11. 2026: 1,30 € + DPH mesačne prvý rok, potom 2,60 € + DPH mesačne). Objednáva si ju sám na svoje meno, pri objednávke volí Linux. My nič neobjednávame. Napíš nám, čo ste zistili.

**d)** Je vľavo v časti **Domény** riadok stavebninyrichtarik.sk?

- **Áno** – doména je vo Forpsi. Zámok (https) bude zadarmo, keď doména prejde na servery Forpsi (krok 6, cesta A).
- **Nie** – doména je inde. Zámok zadarmo dá Forpsi až po prevode domény k Forpsi. Mário sa musí rozhodnúť medzi cestou A a B v kroku 6. Kroky 1 až 5 môžeš spraviť aj skôr, ľudia zatiaľ uvidia starý web.

!> Firma používa e-maily na doméne (na webe sú adresy, ktoré sa končia @stavebninyrichtarik.sk). Pri zmene domény môžu prestať chodiť. Doménu preto **nikdy neprepínaj sám**.

!> Starý hosting nerušte a neprestaňte ho platiť, kým nový web aj e-maily nie sú presunuté a vyskúšané. Na starom serveri nič nemažte.

## Krok 1 – údaje k FTP

Účet Forpsi → Webhosting → stavebninyrichtarik.sk → **FTP**. Opíš si „Server“ a „Login“. Mário si tam nastaví nové heslo k FTP a nadiktuje ti ho. Heslo si zapíš na papier, neposielaj ho správou.

ok> Máš tri veci: server, login, heslo.

## Krok 2 – PHP 8.3

Ten istý detail webu → riadok **PHP** → „zmeniť“ → vyber **8.3**.

ok> V riadku PHP je 8.3. Vyhovuje aj 8.4 alebo 8.5.

Riadok „Dynamic cache“ nechaj „neaktívna“.

## Krok 3 – pripoj sa programom FileZilla

Stiahni **FileZilla Client** len zo stránky filezilla-project.org. Ak inštalátor ponúkne iný program, zvoľ Odmietnuť (Decline).

Program môže byť po slovensky alebo po anglicky, anglický názov je v zátvorke.

Súbor → **Správca lokalít** (Site Manager) → **Nová lokalita** (New site):

- Protokol: FTP
- Hostiteľ (Host): server z kroku 1
- Port: nechaj prázdny
- Šifrovanie (Encryption): Používať explicitné FTP cez TLS ak je dostupné (Use explicit FTP over TLS if available)
- Typ prihlasovania (Logon Type): Opýtať sa na heslo (Ask for password)
- Používateľ (User): login z kroku 1
- karta Nastavenia prenosu (Transfer Settings): Pasívny (Passive); zaškrtni Obmedziť počet súčasných spojení (Limit number of simultaneous connections) a daj 3

Klikni **Pripojiť** (Connect), zadaj heslo. Okno o neznámom certifikáte servera *.forpsi.com potvrď.

V menu **Server** zaškrtni **Vynútiť zobrazovanie skrytých súborov** (Force showing hidden files).

Na Macu: keď sa počítač opýta, či smie FileZilla čítať priečinok Plocha alebo Stiahnuté, povoľ.

ok> Vpravo vidíš priečinok **www**. Niekedy najprv priečinok stavebninyrichtarik.sk a v ňom www.

ak> Skontroluj server, login a heslo. Ak si v zahraničí alebo máš zapnutú VPN, vypni ju. Ak vpravo vidíš viac priečinkov s menami domén, otvor len stavebninyrichtarik.sk. Ak nevidíš www ani stavebninyrichtarik.sk – STOP, odfoť okno a pošli nám.

## Krok 4 – vyprázdni www (LEN PRI ÚPLNE PRVOM NAHRATÍ)

Vpravo otvor www a pozri sa, čo v ňom je.

!> Vidíš vo www priečinok **sprava** alebo priečinok, ktorého meno sa začína **sprava-data**? Potom tu už nový web je. **NIČ NEMAŽ**, tento krok preskoč a napíš nám.

!> Je vo www veľa súborov a priečinkov (viac než pár)? Môže to byť iný web. **STOP**, odfoť okno a pošli nám.

Inak (nový hosting, vo www je len úvodná stránka od Forpsi):

1. Vľavo hore klikni na Plocha (Desktop). Do zoznamu pod tým klikni pravým tlačidlom → **Vytvoriť adresár** (Create directory) → meno stary-obsah-www. Dvojklikom doň vojdi.
2. Vpravo vo www klikni do zoznamu, stlač Ctrl+A (Mac: Cmd+A) a všetko pretiahni doľava. To je záloha.
3. Počkaj, kým sa prenos skončí. Dole musí byť záložka **Zlyhané prenosy** (Failed transfers) prázdna. Až potom maž.
4. Vpravo znova Ctrl+A → pravé tlačidlo → **Odstrániť** (Delete).

ok> Priečinok www je prázdny. Samotné priečinky www, subdoms a backups-forpsi ostali.

Ak bol www prázdny už na začiatku, nič nerob a pokračuj krokom 5.

## Krok 5 – nahraj web (všetkých {N} častí, v poradí 1, 2, 3 …)

Všetky ZIPy najprv rozbaľ na **Plochu**: Windows – pravé tlačidlo → Extrahovať všetko; Mac – dvojklik.

Pre každú časť, od 1 po {N}:

1. Vo FileZille vľavo hore klikni na Plocha (Desktop) a nájdi priečinok, v ktorom je súbor **cast-1-z-{N}.txt** (pri druhej časti cast-2-z-{N}.txt a tak ďalej). Na Windows je to priečinok s menom ZIPu. Na Macu môže byť rozbalené inak – hľadaj ten súbor.
2. Klikni do zoznamu, kde ten súbor vidíš, a stlač Ctrl+A (Mac: Cmd+A). Označí sa všetko, čo je pri ňom.
3. Vpravo maj otvorený priečinok **www**. Označené pretiahni doprava.
4. Ak sa opýta, čo so súborom, ktorý už existuje: **Prepísať** (Overwrite) a zaškrtni Vždy vykonať túto činnosť (Always use this action).
5. Počkaj, kým sa dole vyprázdni **Súbory vo fronte** (Queued files). Záložka **Zlyhané prenosy** (Failed transfers) musí byť prázdna. Ak nie je: pravé tlačidlo do nej → **Resetovať a znovu zaradiť do frontu všetky** (Reset and requeue all) → pravé tlačidlo → **Spracovať front** (Process Queue).

!> Nahrávaj vždy to, čo je V priečinku pri súbore cast-…txt, nie ten priečinok sám. Inak by bol web o priečinok hlbšie a nefungoval by.

!> Nahraj všetky časti. Bez posledných častí chýbajú letáky a cenníky a správa odmietne zverejniť Máriove zmeny.

ok> Vo www vidíš súbory .htaccess, index.html a cast-1-z-{N}.txt až cast-{N}-z-{N}.txt a priečinky akcie, assets, galeria, img, katalog, novinky, pdf, sprava, subory.

ZIPy na hosting nenahrávaj. Forpsi nechce, aby sa na hostingu skladovali archívy.

## Krok 6 – doména musí viesť na Forpsi (rozhoduje a robí Mário, nie ty)

Dnes adresa www.stavebninyrichtarik.sk vedie na starý server u iného poskytovateľa (podľa verejných záznamov mrhosting.net). Tam idú aj e-maily firmy. Kým sa to nezmení, ľudia vidia starý web. Sú dve cesty. Vyberá Mário.

### Cesta A – všetko k Forpsi (zámok zadarmo)

Doména aj e-maily prejdú k Forpsi. Zámok (https) je potom zadarmo a obnovuje sa sám. Prevod domény .sk je podľa Forpsi zadarmo, platí sa ročné predĺženie domény (11,90 € + DPH k 19. 11. 2026). Mário napíše podpore Forpsi:

veta> Dobrý deň, mám u vás Hosting Linux pre stavebninyrichtarik.sk. Web aj e-maily dnes bežia u iného poskytovateľa. Chcem doménu previesť k vám a nasmerovať na tento hosting tak, aby e-maily na doméne neprestali chodiť. Prenesiete aj schránky a staré správy? Ponúkate asistovanú migráciu? Čo mám spraviť ja a v akom poradí?

Čo presne Forpsi pri prevode e-mailov spraví za Mária, je NEOVERENÉ – povie to ich odpoveď.

### Cesta B – e-maily ostanú, kde sú

Na Forpsi pôjde len web. Ten, kto dnes spravuje doménu, zmení jediný údaj. Adresu nájdeš v účte Forpsi v detaile webu v riadku **Web IP (DNS A)**. Mário napíše dnešnému poskytovateľovi:

veta> Dobrý deň, web stavebninyrichtarik.sk sťahujeme na iný hosting. E-maily chceme nechať u vás bez zmeny. Prosím, zmeňte len záznamy A pre stavebninyrichtarik.sk a www.stavebninyrichtarik.sk na adresu …… (doplniť Web IP z Forpsi). Záznamy MX a poštu nemeňte.

Pri ceste B Forpsi zámok zadarmo nedá. Platený stojí 10 € + DPH ročne (cenník Forpsi k 19. 11. 2026) a obnovuje sa ručne dvakrát do roka. Bez zámku sa správa webu nespustí.

ok> Adresa http://www.stavebninyrichtarik.sk/ ukáže nový web. Môže to trvať až 24 hodín.

Staré odkazy z Googlu (…/sk/….aspx) fungujú hneď, aj bez zámku. Starý web ostáva na starom serveri nedotknutý, takže doménu sa dá vrátiť späť.

## Krok 7 – zapni zámok (certifikát https)

Až keď krok 6 ukazuje nový web. Účet Forpsi → Webhosting → stavebninyrichtarik.sk → riadok **SSL certifikát** → **Spravovať**:

1. zaškrtni súhlas s obchodnými podmienkami,
2. zaškrtni aj „Zapnúť automatické presmerovanie webu na zabezpečený protokol (SSL redirect)“,
3. klikni **Požiadať o certifikát**.

Certifikát býva hotový do niekoľkých minút, príde o tom e-mail.

ok> Adresa https://www.stavebninyrichtarik.sk/ sa otvorí so zámkom.

ak> V riadku stojí, že certifikát nemožno vydať? Odpíš nám celú vetu. Zadarmo ho Forpsi dáva len doméne, ktorá je registrovaná vo Forpsi a je na serveroch Forpsi (krok 0 d, cesta A).

## Krok 8 – skontroluj web (telefón aj počítač)

[ ] https://www.stavebninyrichtarik.sk/ – úvod má fotky, menu funguje
[ ] …/skuska-neexistuje – ukáže stránku webu „Stránka sa nenašla“
[ ] …/sk/akcie.aspx – otvorí stránku Akcie
[ ] …/cast-{N}-z-{N}.txt – ukáže krátky text „časť {N} z {N}“ (posledná časť je na mieste)
[ ] Katalóg – hľadanie „cement“ nájde výsledky; Akciový leták sa otvorí

ak> Neexistujúca adresa ukáže holú stránku servera namiesto stránky webu? Vo www chýba súbor .htaccess. Z rozbalenej časti 1 nahraj **len súbor .htaccess** (nie celú časť znova).

ak> Web nemá fotky alebo sa neotvorí leták? Niektorá časť sa nenahrala celá. Nahraj ju znova podľa kroku 5 – ale len dovtedy, kým Mário v správe nič nezmenil. Potom už nie, napíš nám.

ak> Každá stránka ukazuje chybu 500? Odfoť ju a pošli nám.

## Krok 9 – aby si Mário vedel sám meniť veci

Prvé prihlásenie sa robí raz, spolu s Máriom. Dá sa až vtedy, keď:

- sú nahraté všetky časti (krok 5),
- je nastavené PHP 8.3 (krok 2),
- web sa otvára so zámkom (kroky 6 a 7).

1. Mário v telefóne otvorí https://www.stavebninyrichtarik.sk/sprava/

ok> Vidí „Prvé nastavenie“ a zelené „Server je pripravený.“

ak> Vidí niečo iné – pozri tabuľku „Keď správa píše niečo iné“ nižšie.

2. Mário ťukne **Vytvoriť overovací kód**. Správa napíše, kde na hostingu je súbor **PRVY-KOD.txt**: buď v priečinku sprava-data vedľa www, alebo vo www v priečinku, ktorého meno sa začína sprava-data-.

3. Ty sa vo FileZille pripoj znova ako v kroku 3 a vpravo stlač **F5** (načíta nový zoznam). Ak má byť priečinok vedľa www, dvojklikni vpravo na riadok s dvoma bodkami (..) úplne hore – dostaneš sa o úroveň vyššie. Na súbor PRVY-KOD.txt daj pravé tlačidlo → **Zobraziť/upraviť** (View/Edit) a prečítaj Máriovi kód (16 znakov so spojovníkmi). Kód nie je heslo. Platí 24 hodín a len raz.

4. Mário kód opíše, ťukne **Overiť kód** a do 15 minút si zvolí meno a heslo (aspoň 10 znakov).

!> Heslo si Mário vymyslí SÁM. Nikomu ho nehovorí a nikam ho neposiela – ani tebe, ani nám. Pri písaní hesla sa nepozeraj. Žiadne predvolené heslo neexistuje.

5. Skúška: Mário zmení jednu drobnosť (napríklad oznam pri otváracích hodinách) → Pozrieť náhľad → Zverejniť na webe. Na webe je to do 10 minút. Potom v „História a Vrátiť späť“ ťukne Vrátiť.

ok> Mário vidí „Domov“ s riadkom „Všetko je na webe ✓“.

**Čo si Mário mení sám:** akcie, ich fotky a obrázok na karte, ceny, leták a cenník v PDF, otváracie hodiny a výnimky (sviatok, dovolenka), oznamy, novinky, fotky v galérii, texty stránok, telefón a e-mail. Postup je v navod-sprava.pdf a v správe pod „Pomoc“.

### Keď správa píše niečo iné

| Na obrazovke je | Čo spraviť |
| „Otvorte správu cez zabezpečené pripojenie“ | Zámok ešte nie je hotový (krok 7). Adresa musí začínať https://. Ak web so zámkom už ide a toto vidíš stále, odfoť a pošli nám. |
| „Správa webu sa nedá spustiť: priečinok údajov nie je dostupný“ | Server nesmie zapisovať. Sprav úkon „práva 757“ pod tabuľkou a stránku načítaj znova. |
| červené „Verzia PHP“ | Krok 2. |
| červené „Zápis do súborov webu“ alebo „Priečinok údajov správy“ | Sprav úkon „práva 757“ pod tabuľkou a stránku načítaj znova. |
| červené „Údaje správy nie sú dostupné z webu“ | Doména ešte nevedie na Forpsi alebo zámok ešte nie je hotový. Skús o hodinu. Ak web so zámkom už ide a toto vidíš aj o hodinu, odfoť a pošli nám. |
| „Overenie vypršalo. Vytvorte nový kód.“ | Na meno a heslo je po overení kódu 15 minút. Ťukni znova Vytvoriť overovací kód; nový kód môže vzniknúť až o 15 minút. |
| pri zverejnení „Odkaz na … nevedie na existujúci súbor“ | Nie sú nahraté všetky časti. Dokonči krok 5. |
| súbor PRVY-KOD.txt sa nedá nájsť alebo otvoriť, alebo čokoľvek iné | Odfoť obrazovku správy aj okno FileZilly (bez hesiel) a pošli nám. |

**Úkon „práva 757“** (len keď to správa pýta): vo FileZille vpravo pravé tlačidlo na priečinok www → **Oprávnenia súborov** (File permissions) → do políčka Číselná hodnota (Numeric value) napíš 757 → zaškrtni **Rekurzívne použiť aj na vnorené adresáre** (Recurse into subdirectories) a **Použiť iba na adresáre** (Apply to directories only) → OK. Či to nový hosting Forpsi potrebuje, je NEOVERENÉ; staršie servery Forpsi to potrebovali.

## Krok 10 – odovzdaj Máriovi

[ ] navod-sprava.pdf (to isté je v správe pod „Pomoc“)
[ ] papier s heslom k FTP. Ak chce, heslo k FTP si v účte Forpsi zmení.
[ ] Povedz mu: keď zabudne heslo do správy, na prihlásení ťukne „Zabudli ste heslo?“ a nový kód (súbor OBNOVA-KOD.txt) sa prečíta rovnako ako v kroku 9. Nech si nechá FileZillu v počítači, alebo sa ozve tebe.

Kód sa dá prečítať aj z telefónu na webftp.forpsi.com (server, login a heslo k FTP) – NEOVERENÉ, na skutočnom účte sme to neskúšali.

ZIPy a rozbalené priečinky z Plochy môžeš zmazať. Priečinok stary-obsah-www si nechaj.

## Dôležité na neskôr

- Čo nikdy nemazať, je na začiatku tohto návodu.
- Keď niekto neskôr presunie doménu preč z Forpsi alebo zmení jej servery, zámok zadarmo zanikne a správa prestane pustiť Mária dnu (ukáže stránku o zabezpečenom pripojení).
- Nové ZIPy od nás vždy až po tom, čo Mário pošle zálohu zo správy (časť „Ak už nový web na Forpsi beží“).
- ZIPy a návod z 18. 11. 2026 (stavebniny-richtarik-web-1.zip až -5.zip, NAVOD-NAHRATIE.txt, priečinok ku-korenu) zahoď. Platí len tento balík.

## Čo nie je overené na skutočnom účte Forpsi

Povieme to rovno: nikto z nás v účte Forpsi nebol.

- či Mário má vo Forpsi Hosting Linux a doménu (krok 0),
- či vo FileZille uvidíš hneď www, alebo najprv priečinok s menom domény,
- či PHP na Forpsi vie upravovať fotky (bez toho Mário nenahrá fotky, ostatné funguje) – správa to ukáže v Nastavenia → Kontrola servera,
- či bude treba úkon „práva 757“ a kde presne vznikne priečinok sprava-data,
- ako dlho potrvá doména a certifikát,
- prevod e-mailov a čo pri ňom spraví Forpsi,
- čítanie kódu cez webftp.forpsi.com z telefónu.

Prvé nahratie je preto zároveň skúška. Keď sa niečo líši od návodu, odfoť to a pošli nám – opravíme návod aj balík.
