<?php
// Koncový bod ukladania pre admin (sprava/upravy/): JSON, len s reláciou správy, hlavičkou X-B30-CSRF a vlastným pôvodom.
//   GET  a=stav                    prihlásený?, verzia stavu, verzia balíka, CSRF tejto relácie (bez relácie len prihlaseny: false)
//   POST a=citaj {cesty: []}       texty zo zdroja a verzia
//   POST a=fotka {cesta, b64}      jedna nová fotka (server ju dekóduje a nanovo zakóduje), vráti značku
//   POST a=uloz  {verzia, sprava, zmeny, subory, fotky, verejne}   jedno uloženie; 409 {stale: true} pri inej verzii
//   POST a=spat                    krok späť
//   GET  a=historia                posledných 30 uložení
//   POST a=odhlas
// Export a prevzatie nového balíka sú na stránkach správy (index.php).
defined('B30S') || exit;
require __DIR__ . '/autoload.php';
ini_set('display_errors', '0');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Bratislava');

function b30_json(array $d, int $kod = 200): never
{
    http_response_code($kod);
    Pristup::hlavicky("default-src 'none'; frame-ancestors 'none'");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
set_exception_handler(function (Throwable $e) { Dennik::chyba($e); b30_json(['ok' => false, 'chyba' => 'Pri spracovaní nastala chyba. Web sa nezmenil. Skús to znova.'], 500); });

try { $ok = Miesto::init(false); } catch (Throwable $e) { $ok = false; }
if (!$ok) b30_json(['ok' => false, 'prihlaseny' => false, 'chyba' => 'Správa ešte nie je nastavená.'], 401);
if (!Pristup::https()) b30_json(['ok' => false, 'prihlaseny' => false, 'chyba' => 'Správa funguje len cez https.'], 401);
if (!Pristup::povodOk()) b30_json(['ok' => false, 'chyba' => 'Zakázaný pôvod.'], 403);
Pristup::startRelacie();
$a = (string) preg_replace('/[^a-z-]/', '', (string) ($_GET['a'] ?? ''));
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
$kto = Pristup::ucet();
if ($kto === null) b30_json(['ok' => false, 'prihlaseny' => false, 'chyba' => 'Prihlás sa, prosím.'], 401);

if ($a === 'stav' && !$post) {
    Zmena::obnovPrerusene();
    b30_json(['ok' => true, 'prihlaseny' => true, 'ucet' => $kto, 'verzia' => Zmena::verzia(), 'balik' => Zmena::verziaBalika(), 'csrf' => Pristup::csrf(),
              'fotky' => Fotky::vie(), 'ciel' => array_intersect_key(Miesto::ciel(), ['zaklad' => 1, 'povodna' => 1, 'vernost' => 1]), 'vernost' => Nastavenia::vernostHeslo()]);
}
// všetko ostatné: token relácie v hlavičke (aj pri GET), POST len ako JSON
if (!Pristup::overApi()) b30_json(['ok' => false, 'chyba' => 'Neplatná požiadavka (chýba overenie). Obnov stránku.'], 403);
$v = [];
if ($post) {
    if (!str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) b30_json(['ok' => false, 'chyba' => 'Očakávam JSON.'], 415);
    $telo = (string) file_get_contents('php://input', false, null, 0, 40000000);
    $v = $telo === '' ? [] : json_decode($telo, true);
    if (!is_array($v)) b30_json(['ok' => false, 'chyba' => 'Neplatné údaje.'], 400);
}
Zmena::obnovPrerusene();
switch ($a . ($post ? ':post' : ':get')) {
    case 'citaj:post':
        $cesty = $v['cesty'] ?? null;
        if (!is_array($cesty) || count($cesty) > 80) b30_json(['ok' => false, 'chyba' => 'Neplatné údaje.'], 400);
        $von = [];
        foreach ($cesty as $c) { if (!is_string($c) || Mapa::zdroj($c) === null) b30_json(['ok' => false, 'chyba' => 'Súbor nie je v zozname súborov webu.', 'cesta' => is_string($c) ? mb_substr($c, 0, 120) : ''], 404); $von[$c] = Zmena::citajZdroj($c); }
        b30_json(['ok' => true, 'verzia' => Zmena::verzia(), 'subory' => $von]);
    case 'fotka:post':
        $b = base64_decode((string) ($v['b64'] ?? ''), true);
        if ($b === false) b30_json(['ok' => false, 'chyba' => 'Neplatné údaje.'], 400);
        $r = Fotky::prijmi((string) ($v['cesta'] ?? ''), $b);
        b30_json(isset($r['chyba']) ? ['ok' => false, 'chyba' => $r['chyba']] : ['ok' => true] + $r, isset($r['chyba']) ? 400 : 200);
    case 'uloz:post':
        $r = Zmena::uloz($v, $kto);
        if (!$r['ok']) b30_json($r, $r['kod'] ?? 400);
        b30_json($r);
    case 'spat:post':
        $r = Zmena::spat($kto);
        b30_json($r, $r['ok'] ? 200 : ($r['kod'] ?? 400));
    case 'historia:get':
        b30_json(['ok' => true, 'historia' => Zmena::historia(30)]);
    case 'odhlas:post':
        Pristup::odhlas();
        b30_json(['ok' => true]);
}
b30_json(['ok' => false, 'chyba' => 'Neznáma akcia.'], 404);
