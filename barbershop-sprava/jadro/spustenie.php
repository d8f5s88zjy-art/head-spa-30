<?php
// Stránky správy: brána HTTPS, relácia, smerovanie obrazoviek a úkonov (index.php sem príde až po kontrole verzie PHP).
defined('B30S') || exit;
require __DIR__ . '/autoload.php';
foreach (glob(dirname(__DIR__) . '/obrazovky/*.php') as $f) require $f;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Bratislava');

set_exception_handler(function (Throwable $e) {
    Dennik::chyba($e);
    if (!headers_sent()) Ui::chyba('Pri spracovaní nastala chyba. Web sa nezmenil. Skús to znova; ak sa to opakuje, napíš tvorcovi webu.', 500);
});

$bezUdajov = false;
try { $bezUdajov = !Miesto::init(true); } catch (Throwable $e) { $bezUdajov = true; }
if ($bezUdajov) {
    Pristup::hlavicky();
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Správa webu</title><link rel="stylesheet" href="vzhlad/sprava.css">'
       . '<main><h1>Správa sa nedá spustiť</h1><p class="lead">Server nevie vytvoriť priečinok údajov. Priečinku webu (tam, kde je index.html) nastav cez FTP práva na zápis, alebo vytvor vedľa neho (o úroveň vyššie) priečinok <b>barbershop30-udaje</b> s právom zápisu, a otvor túto stránku znova.</p></main>';
    exit;
}

// Dôkaz HTTPS (mimo lokálnej skúšky): cookie s príznakom Secure sa cez nešifrované spojenie neuloží ani nepošle.
if (!Pristup::https()) {
    Pristup::posliDokazHttps();
    $adresa = Miesto::zaklad() . 'sprava/';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && !isset($_GET['h'])) { Pristup::hlavicky(); header('Location: ' . $adresa . '?h=1', true, 303); exit; }
    Pristup::hlavicky();
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Správa webu</title><link rel="stylesheet" href="vzhlad/sprava.css">'
       . '<main><h1>Otvor správu cez zabezpečené pripojenie</h1><p class="lead">Správa funguje len cez <b>https://</b> a s povolenými súbormi cookie.</p>'
       . '<p><a class="tl hlavne" href="' . Ui::e($adresa) . '">' . Ui::e($adresa) . '</a></p>'
       . '<p class="lead">Ak adresa s https nejde, zapni pre doménu v zákazníckom účte hostingu certifikát SSL a skús to o hodinu znova.</p></main>';
    exit;
}

Pristup::startRelacie();
Zmena::obnovPrerusene();   // prerušený zápis vráti zo zálohy (len keď práve nebeží iné uloženie)

$s = (string) preg_replace('/[^a-z-]/', '', (string) ($_GET['s'] ?? ''));
$a = (string) preg_replace('/[^a-z-]/', '', (string) ($_POST['a'] ?? ''));
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
if ($post && !Pristup::overPost()) Ui::chyba('Formulár vypršal. Otvor stránku znova a skús to ešte raz.', 403);

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
if ($post) akcie_spravy($a);
switch ($s) {
    case 'nastavenia': obrazovka_nastavenia();
    case 'historia': obrazovka_historia();
    case 'kontrola': obrazovka_kontrola();
    default: obrazovka_domov();
}
