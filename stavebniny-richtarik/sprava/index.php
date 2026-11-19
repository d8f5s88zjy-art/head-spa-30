<?php
// Správa webu Stavebniny Richtárik – jediný vstup (všetko ostatné v sprava/ je z webu zakázané: .htaccess, web.config).
// Návštevníci webu túto stránku nikdy nevidia; verejné stránky sú statické súbory bez kódu správy.
const SPRAVA = 1;
require __DIR__ . '/jadro/autoload.php';
foreach (glob(__DIR__ . '/obrazovky/*.php') as $f) require $f;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Bratislava');

set_exception_handler(function (Throwable $e) {
    Dennik::chyba($e);
    if (!headers_sent()) Ui::chyba('Pri spracovaní nastala chyba. Web sa nezmenil. Skúste to znova; ak sa to opakuje, zavolajte programátora.', 500);
});

try {
    Nastavenie::init();
    Nastavenie::zabezpecData();
} catch (Throwable $e) {
    Dennik::chyba($e);
    Pristup::hlavicky();
    http_response_code(500);
    echo '<!doctype html><meta charset="utf-8"><title>Správa webu</title><p>Správa webu sa nedá spustiť: priečinok údajov nie je dostupný.</p><p>Server nesmie zapisovať do priečinkov webu. Kto má údaje k FTP, nastaví v programe FileZilla priečinku www a jeho podpriečinkom práva 757 (pravé tlačidlo na www → Oprávnenia súborov → číslo 757 → zaškrtnúť „Rekurzívne použiť aj na vnorené adresáre“ a „Použiť iba na adresáre“) a túto stránku načíta znova.</p><p>Ak to nepomôže: odfoťte túto stránku a pošlite ju tomu, kto vám web nahrával.</p>';
    exit;
}

// HTTPS je povinné (výnimka len pre lokálny test cez php -S, nikdy podľa IP adresy)
if (!Nastavenie::https() && !Nastavenie::lokalne()) {
    Pristup::hlavicky();
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Správa webu</title>'
       . '<link rel="stylesheet" href="assets/sprava.css"><main id="obsah"><h1>Otvorte správu cez zabezpečené pripojenie</h1>'
       . '<p class="vela">Správa webu funguje len cez <b>https://</b>. Ak adresa s https nejde: v zákazníckom účte Forpsi otvorte Webhosting → váš web → riadok SSL certifikát → Spravovať → Požiadať o certifikát. Býva hotový do niekoľkých minút; potom otvorte túto stránku s https:// na začiatku. Bezplatný certifikát dáva Forpsi len doméne, ktorá je registrovaná vo Forpsi.</p></main>';
    exit;
}

Pristup::startRelacie();
Zmena::obnovPrerusene();   // prerušený zápis dokončí len vtedy, keď práve nebeží zverejnenie (zámok)

$s = preg_replace('/[^a-z-]/', '', (string)($_GET['s'] ?? ''));
$a = preg_replace('/[^a-z-]/', '', (string)($_POST['a'] ?? ''));
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
if ($post && !Pristup::overPost()) { http_response_code(403); Ui::chyba('Formulár vypršal. Otvorte stránku znova a skúste to ešte raz.', 403); }

// ---------- bez účtu: len prvé nastavenie ----------
if (!Pristup::maUcet()) {
    if ($post) akcie_prve($a);
    obrazovka_prve();
}

// ---------- neprihlásený ----------
if (!Pristup::ucet()) {
    if ($post) akcie_prihlasenie($a);
    if ($s === 'obnova') obrazovka_obnova();
    obrazovka_prihlasenie();
}

// ---------- prihlásený ----------
if ($post) {
    switch ($a) {
        case 'odhlasit': Pristup::odhlas(); Ui::presmeruj('', [], 'Boli ste odhlásený.');
        case 'hodiny': akcia_hodiny();
        case 'vynimka-pridat': case 'vynimka-zmazat': akcia_vynimka($a);
        case 'novinka': akcia_novinka();
        case 'novinka-skryt': case 'novinka-zobrazit': case 'novinka-vyssie': case 'novinka-nizsie': akcia_novinky_zoznam($a);
        case 'galeria-pridat': case 'galeria-nahradit': case 'galeria-popis': case 'galeria-skryt': case 'galeria-zobrazit': case 'galeria-vyssie': case 'galeria-nizsie': akcia_galeria($a);
        case 'texty': akcia_texty();
        case 'kontakt': akcia_kontakt();
        case 'nahradit-cenu': akcia_nahradit_cenu();
        case 'akcia': akcia_akcia();
        case 'skryt': case 'zobrazit': case 'vyssie': case 'nizsie': akcia_zoznam_akcii($a);
        case 'cennik': case 'letak-pridat': case 'letak-zmazat': akcia_cennik($a);
        case 'nahlad': Ui::presmeruj('nahlad');
        case 'zverejnit': akcia_zverejnit();
        case 'zahodit': if ($e = Zmena::zahodKoncept()) Ui::presmeruj('nahlad', [], $e, 'chyba'); Ui::presmeruj('', [], 'Rozpracovaná zmena je zahodená. Web ostal bez zmeny.');
        case 'vratit': akcia_vratit();
        case 'heslo': case 'zariadenie-odhlasit': case 'zariadenia-vsetky': case 'obnovit-web': case 'export': akcia_nastavenia($a);
    }
    Ui::chyba('Neznámy úkon.');
}
switch ($s) {
    case 'hodiny': obrazovka_hodiny();
    case 'novinky': obrazovka_novinky();
    case 'novinka': obrazovka_novinka();
    case 'galeria': obrazovka_galeria();
    case 'texty': obrazovka_texty();
    case 'kontakt': obrazovka_kontakt();
    case 'akcie': obrazovka_akcie();
    case 'akcia': obrazovka_akcia();
    case 'cennik': obrazovka_cennik();
    case 'nahlad': obrazovka_nahlad();
    case 'stranka': obrazovka_stranka();
    case 'historia': obrazovka_historia();
    case 'nastavenia': obrazovka_nastavenia();
    case 'kontrola': obrazovka_kontrola();
    case 'pomoc': obrazovka_pomoc();
    default: obrazovka_domov();
}
