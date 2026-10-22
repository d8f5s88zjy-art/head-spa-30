# Vernostná kartička 30 (Barbershop 30 a HEAD SPA 30)

Vlastný jednoduchý systém: PHP 8.1+ a SQLite na hostingu HEAD SPA 30 (Forpsi), adresa `https://www.headspa30.sk/vernost/`.
Žiadna platená služba, žiadne údaje klientov v repozitári. Každá prevádzka má vlastných klientov, odmeny, akcie a heslo.

## Ako to funguje pre klienta

1. Na webe klikne **Rezervovať**. Pred otvorením rezervácie sa ukáže okno „Vernostná kartička“. Nič nie je zaškrtnuté:
   kto nechce, klikne **Pokračovať na rezerváciu** a nič sa neodošle (60 dní sa ho znova nepýtame); kto okno len zavrie,
   toho sa do konca návštevy webu nepýtame. Okno sa zapne samo pri najbližšom nasadení po tom, čo má prevádzka v GitHube heslo do adminu
   (nasadenie doplní do stránky príznak `data-zapnute`; stránka sa servera vopred nič nepýta).
2. Kto zaškrtne **Áno, chcem vernostnú kartičku**, vyplní meno, telefón (rovnaký ako v rezervácii), nepovinne e‑mail
   a samostatne súhlas so správami o akciách. Kartička sa založí hneď, odkaz sa uloží v prehliadači a príde e‑mailom.
3. Kartička (`karta/?k=…`, odkaz je zároveň prístup) ukazuje body, QR kód s krátkym kódom pre recepciu (nie odkaz), odmeny, akcie a správy. Dá sa pridať na plochu telefónu,
   funguje aj bez signálu (posledná verzia), zapnúť upozornenia, vypnúť správy a zrušiť (vymaže všetky údaje).
4. V pätičke oboch webov je odkaz **Vernostná kartička** (otvorí uloženú kartičku alebo prihlášku bez rezervácie).
5. **Po zaplatení na recepcii** ukáže recepcia QR kód (admin → Klienti → QR pre nového klienta). Klient ho naskenuje,
   otvorí sa stránka kartičky s formulárom (`?nova`) a kartičku si založí sám v telefóne.

**Kartička Barbershopu je na webe Barbershopu** (`barbershop-30/karta/`, nie na headspa30.sk): server vracia odkaz podľa
prevádzky (`PREVADZKY['barbershop']['karta']` v `lib/jadro.php`, v `config.php` sa dá prepísať kľúčom `karty`), aj v e‑maile,
v upozornení a v admine. Súbory `karta.js`, `karta.css`, `qr.js` a `sw.js` sú kópie `vernost/karta/` (test ich stráži:
`cp vernost/karta/{karta.js,karta.css,qr.js,sw.js} barbershop-30/karta/`); `<html>` stránky Barbershopu nesie `data-api`,
`data-api-lokal`, `data-manifest` a `data-prevadzka`. Písma sú v `pisma.css` (každá stránka vlastné cesty). Kým server
kartičiek na headspa30.sk nebeží, stránka Barbershopu povie „Kartičky práve spúšťame“ a dá telefón.

Rezervačné systémy (barbershop30.sk, Booqme) nie sú naše, preto prihláška beží v okne pred rezerváciou. Ak by ich
vývojár chcel zaškrtávacie políčko priamo vo formulári rezervácie, stačí mu volať `POST api/?a=registracia` (nižšie).

## Recepcia a majiteľ: `https://www.headspa30.sk/vernost/admin/`

- Prihlásenie: prevádzka + heslo (heslo sa nastavuje v GitHub tajomstvách, nikdy nie v repozitári ani v chate).
- **Klienti**: hľadanie podľa mena (aj bez diakritiky), telefónu, e‑mailu alebo kódu z kartičky (QR skener v Chrome
  na Androide/počítači, inak kód prepísať), **Zapísať
  návštevu** (body podľa nastavenia, predvolene 1; druhý zápis do 30 minút sa opýta), **Uplatniť odmenu**, ručné pripísanie
  či odpísanie bodov s dôvodom (napr. kúpa produktu), nový klient na recepcii (len so súhlasom), QR kód pre klienta, úprava, zmazanie.
- **Odmeny**: názov, popis, cena v bodoch (napr. „Puder na vlasy zdarma – 10 bodov“). Na začiatku nie je žiadna – určuje majiteľ.
- **Akcie**: názov, popis, platnosť od – do (napr. „Mesiac študentov“). Klient ich vidí na kartičke.
- **Správy**: hromadná správa klientom so súhlasom – upozornenie v telefóne, na kartičke a voliteľne e‑mail.
- **Nastavenia**: body za návštevu, export klientov (CSV pre Excel).

## Nasadenie

Ide samo s webom HEAD SPA 30 cez `.github/workflows/ftp.yml` (`tools/ftp-balik.sh` pribalí `vernost/`, bez testov a návodu).
`config.php` vytvorí nasadenie z tajomstiev repozitára (Settings → Secrets and variables → Actions):

| Tajomstvo | Význam |
|---|---|
| `VERNOST_HESLO_BARBERSHOP` | heslo do adminu Barbershop 30 (aspoň 10 znakov) |
| `VERNOST_HESLO_HEADSPA` | heslo do adminu HEAD SPA 30 (aspoň 10 znakov) |
| `VERNOST_EMAIL_OD` | odosielateľ e‑mailov s odkazom na kartičku (schránka na doméne hostingu); bez neho sa e‑maily neposielajú |

Nahráva sa šifrovane (FTPS), ak to hosting nepodporuje, záložne cez FTP. Do `config.php` idú heslá len ako odtlačky `password_hash()`. Databáza sa vytvorí sama pri prvej požiadavke: ak sa dá,
mimo verejného priečinka (`../vernost-data/`), inak v `vernost/data/` s náhodným názvom a zákazom prístupu. Kľúč pre
upozornenia (VAPID) sa vygeneruje sám a uloží v databáze. Relácie adminu (12 h) sú vo vlastnom priečinku vedľa databázy.
Kontrola po nasadení: `https://www.headspa30.sk/vernost/api/?a=stav` (`ip_cez_proxy` ukáže, či limity vidia skutočnú
IP klienta za proxy hostingu; ak proxy nemá vnútornú adresu, jej IP sa dá do `config.php` → `proxy`).

Weby: HEAD SPA 30 načíta `vernost/web/prihlaska.js` (na GitHub Pages ho kopíruje `pages.yml`), Barbershop 30 má kópiu
`barbershop-30/assets/vernost.js` (web sa nasadzuje aj samostatne). Po zmene prihlášky:
`cp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` (test to stráži).

## API (`api/?a=…`, JSON)

Verejné: `stav`, `registracia` (POST: prevadzka, meno, telefon, email, suhlas_karta=true, suhlas_spravy), `karta` (GET k),
`manifest` (GET k), `karta_spravy`, `odber`, `odber_zrus`, `novinka` (pre service worker), `karta_zrus` (potvrdenie „ZRUSIT“).
Admin (relácia + hlavička `X-Vernost-Admin: 1` + vlastný pôvod): `prihlasenie`, `odhlasenie`, `ja`, `klienti`, `klient`,
`klient_novy`, `klient_uprav`, `klient_zmaz`, `navsteva`, `body`, `uplatnit`, `odmeny`, `odmena_uloz`, `akcie`, `akcia_uloz`,
`zmaz`, `spravy`, `sprava_posli`, `nastavenia`, `nastavenia_uloz`, `export`.
Povolené pôvody pre prihlášku: www.headspa30.sk, d8f5s88zjy-art.github.io, www.barbershop30.sk (`lib/jadro.php`).

## Bezpečnosť a ochrana údajov

Súhlas s kartičkou a so správami sú oddelené a nič nie je predvolené. Klient si kartičku zruší sám (vymaže všetko);
kartičky bez návštevy 3 roky sa vymažú pri prihlásení admina. Upozornenia neobsahujú text (služby Googlu/Apple ho nevidia).
Limity požiadaviek s odtlačkom IP (so soľou, najviac deň; X‑Forwarded‑For sa berie len od proxy hostingu), e‑mail s kartičkou
bez textu od klienta a najviac 2 za deň na adresu, najviac 5 odberov upozornení na kartičku len k známym službám,
upozornenie ani QR kód nedávajú prístup ku kartičke, heslá len ako odtlačky, relácia `HttpOnly` + `SameSite=Strict`, admin len
z vlastného pôvodu, všetky texty z databázy idú do stránky cez `textContent`, CSV chránený pred vzorcami.
Zásady: `ochrana-udajov.html`. Vedome prijaté riziko: kto ako prvý zaregistruje cudzie číslo, drží jeho kartičku
(recepcia ju vtedy zmaže a založí znova); registrácia prezradí, či číslo už kartičku má.

## Test

`sh vernost/testy/spusti.sh` – lokálny server (php -S s pravidlami ako `.htaccess`), napodobenina služby upozornení
s overením VAPID podpisu, Playwright: API, bezpečnosť, súbežné požiadavky, oddelenie prevádzok, prihláška na oboch weboch (aj po anglicky),
kartička (aj bez signálu), admin, zrušenie kartičky. Snímky do `$SNIMKY`.
