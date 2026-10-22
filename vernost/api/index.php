<?php
/* VERNOSTNÁ KARTA 30 – API. Volanie: api/?a=<akcia>, telo JSON (POST). Verejné akcie slúžia karte klienta a
 * prihláške z webu; akcie admina vyžadujú prihlásenie (relácia), hlavičku X-Vernost-Admin a vlastný pôvod. */
declare(strict_types=1);
const VERNOST = true;
require __DIR__ . '/../lib/jadro.php';
require __DIR__ . '/../lib/push.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
cors();
$a = (string) ($_GET['a'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
if ($post && !str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) chyba('Očakávam JSON.', 415);
$o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($o !== '' && !povod_povoleny($o)) chyba('Zakázaný pôvod.', 403);

try {
  match ($a) {
    'stav' => stav(),
    'registracia' => $post ? registracia() : chyba('POST', 405),
    'karta' => karta((string) ($_GET['k'] ?? '')),
    'manifest' => manifest((string) ($_GET['k'] ?? '')),
    'karta_spravy' => $post ? karta_spravy() : chyba('POST', 405),
    'odber' => $post ? odber(true) : chyba('POST', 405),
    'odber_zrus' => $post ? odber(false) : chyba('POST', 405),
    'odber_stav' => $post ? odber_stav() : chyba('POST', 405),
    'novinka' => $post ? novinka() : chyba('POST', 405),
    'karta_zrus' => $post ? karta_zrus() : chyba('POST', 405),
    'prihlasenie' => $post ? prihlasenie() : chyba('POST', 405),
    'odhlasenie' => $post ? odhlasenie() : chyba('POST', 405),
    'ja' => ja(),
    'klienti' => a_klienti(admin()),
    'klient' => a_klient(admin(), (int) ($_GET['id'] ?? 0)),
    'klient_novy' => $post ? a_klient_novy(admin()) : chyba('POST', 405),
    'klient_uprav' => $post ? a_klient_uprav(admin()) : chyba('POST', 405),
    'klient_zmaz' => $post ? a_klient_zmaz(admin()) : chyba('POST', 405),
    'navsteva' => $post ? a_navsteva(admin()) : chyba('POST', 405),
    'body' => $post ? a_body(admin()) : chyba('POST', 405),
    'uplatnit' => $post ? a_uplatnit(admin()) : chyba('POST', 405),
    'odmeny' => a_zoznam(admin(), 'odmena'),
    'odmena_uloz' => $post ? a_odmena_uloz(admin()) : chyba('POST', 405),
    'akcie' => a_zoznam(admin(), 'akcia'),
    'akcia_uloz' => $post ? a_akcia_uloz(admin()) : chyba('POST', 405),
    'zmaz' => $post ? a_zmaz(admin()) : chyba('POST', 405),
    'spravy' => a_spravy(admin()),
    'sprava_posli' => $post ? a_sprava_posli(admin()) : chyba('POST', 405),
    'nastavenia' => a_nastavenia(admin()),
    'nastavenia_uloz' => $post ? a_nastavenia_uloz(admin()) : chyba('POST', 405),
    'export' => a_export(admin()),
    default => chyba('Neznáma akcia.', 404),
  };
} catch (PDOException $e) {
  error_log('vernost: ' . $e->getMessage());
  chyba('Chyba databázy. Skús to, prosím, znova.', 500);
}

/* ================= verejné ================= */

function stav(): never {
  $k = konfig();
  odpoved(['ok' => true, 'php' => PHP_VERSION, 'sqlite' => extension_loaded('pdo_sqlite'), 'openssl' => extension_loaded('openssl'),
    'curl' => extension_loaded('curl'), 'mbstring' => extension_loaded('mbstring'), 'email' => $k['email_od'] !== '',
    'admin' => array_map(fn ($p) => !empty($k['hesla'][$p]), array_combine(array_keys(PREVADZKY), array_keys(PREVADZKY))),
    'databaza' => (bool) hodnota(db()->query('SELECT 1')), 'ip_cez_proxy' => ip_cez_proxy()]);
}

function karta_url(string $token, string $p): string { return karta_zaklad($p) . '?k=' . $token; }
function email_karta(string $komu, string $p, string $token): void {
  $n = PREVADZKY[$p]['nazov'];
  posli_email($komu, "$n – tvoja vernostná kartička", "Ahoj,\n\ntvoja vernostná kartička $n je tu:\n" . karta_url($token, $p)
    . "\n\nPri návšteve ukáž na recepcii QR kód z kartičky a body ti pripíšeme. Kartičku si môžeš pridať na plochu telefónu.\n"
    . "Ak si o kartičku nežiadal(a), tento e‑mail ignoruj alebo nám zavolaj.\n\n$n\n" . PREVADZKY[$p]['tel_text'] . "\n");
}

function registracia(): never {
  $v = vstup();
  if (text($v['web'] ?? '', 50) !== '') odpoved(['ok' => true, 'karta' => '']);          // pasca na roboty
  limit('registracia', 20, 3600);   // viac klientov môže zdieľať jednu IP (mobilní operátori, Wi‑Fi v salóne)
  $p = prevadzka($v['prevadzka'] ?? '');
  if (($v['suhlas_karta'] ?? false) !== true) chyba('Kartičku založíme len so súhlasom.');
  $meno = text($v['meno'] ?? '', 80);
  if (mb_strlen($meno) < 2) chyba('Napíš, prosím, meno a priezvisko.');
  $tel = telefon(text($v['telefon'] ?? '', 30));
  if (!$tel) chyba('Napíš, prosím, platné telefónne číslo.');
  $email = text($v['email'] ?? '', 120);
  if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) chyba('E‑mail nie je v správnom tvare.');
  $spravy = ($v['suhlas_spravy'] ?? false) === true;
  $pdo = db();
  $s = $pdo->prepare('SELECT token, email FROM klient WHERE prevadzka = ? AND telefon = ?');
  $s->execute([$p, $tel]);
  if ($stara = riadok($s)) {
    if ($stara['email'] !== '') email_karta($stara['email'], $p, $stara['token']);
    odpoved(['ok' => true, 'existuje' => true]);
  }
  $token = token();
  $pdo->prepare('INSERT INTO klient (prevadzka, meno, telefon, email, token, kod, suhlas_karta, suhlas_spravy, suhlas_spravy_cas, zdroj, vytvorena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      ->execute([$p, $meno, $tel, $email, $token, kod_recepcie(), teraz(), $spravy ? 1 : 0, $spravy ? teraz() : null, 'web', teraz()]);
  zapis_pohyb((int) $pdo->lastInsertId(), 0, 'zalozenie', 'Karta založená pri rezervácii');
  if ($email !== '') email_karta($email, $p, $token);
  odpoved(['ok' => true, 'existuje' => false, 'karta' => karta_url($token, $p)]);
}

function klient_z_tokenu(string $k): array {
  if (!preg_match('/^[A-Za-z0-9_-]{22}$/', $k)) chyba('Karta neexistuje.', 404);
  $s = db()->prepare('SELECT * FROM klient WHERE token = ?');
  $s->execute([$k]);
  $r = riadok($s);
  if (!$r) chyba('Karta neexistuje.', 404);
  return $r;
}

function aktivne_akcie(string $p): array {
  $s = db()->prepare("SELECT id, nazov, popis, od, do FROM akcia WHERE prevadzka = ? AND aktivna = 1 AND (od IS NULL OR od = '' OR od <= ?) AND (do IS NULL OR do = '' OR do >= ?) ORDER BY id DESC");
  $s->execute([$p, dnes(), dnes()]);
  return $s->fetchAll();
}

function karta(string $k): never {
  limit('karta', 120, 600);
  $r = klient_z_tokenu($k);
  $p = $r['prevadzka']; $pdo = db();
  $od = $pdo->prepare('SELECT id, nazov, popis, body FROM odmena WHERE prevadzka = ? AND aktivna = 1 ORDER BY body, id'); $od->execute([$p]);
  $sp = $pdo->prepare('SELECT nadpis, text, cas FROM sprava WHERE prevadzka = ? AND cas >= ? ORDER BY id DESC LIMIT 5'); $sp->execute([$p, $r['vytvorena'] < gmdate('Y-m-d', time() - 60 * 86400) ? gmdate('Y-m-d', time() - 60 * 86400) : substr($r['vytvorena'], 0, 10)]);
  $hi = $pdo->prepare("SELECT body, typ, popis, cas FROM pohyb WHERE klient_id = ? AND typ <> 'zalozenie' ORDER BY id DESC LIMIT 10"); $hi->execute([$r['id']]);
  [$vapid] = vapid();
  odpoved(['ok' => true, 'prevadzka' => $p, 'nazov' => PREVADZKY[$p]['nazov'], 'tel' => PREVADZKY[$p]['tel'], 'tel_text' => PREVADZKY[$p]['tel_text'], 'web' => PREVADZKY[$p]['web'],
    'meno' => $r['meno'], 'kod' => $r['kod'], 'body' => (int) $r['body'], 'od' => $r['vytvorena'], 'suhlas_spravy' => (bool) $r['suhlas_spravy'],
    'body_za_navstevu' => (int) nastavenie($p, 'body_za_navstevu', '1'), 'odmeny' => $od->fetchAll(), 'akcie' => aktivne_akcie($p),
    'novinky' => $sp->fetchAll(), 'historia' => $hi->fetchAll(), 'vapid' => $vapid]);
}

/* manifest pre „pridať na plochu“: štart priamo na kartičku klienta (iPhone má pre aplikácie z plochy vlastné úložisko) */
function manifest(string $k): never {
  limit('karta', 120, 600);
  $r = klient_z_tokenu($k); $p = $r['prevadzka'];
  $farba = ['barbershop' => '#0e0d0c', 'headspa' => '#0c0906'][$p] ?? '#111111';
  $ikona = fn (int $v) => ['src' => zaklad() . "karta/ikony/$p-$v.png", 'sizes' => "{$v}x$v", 'type' => 'image/png', 'purpose' => 'any'];
  header('Content-Type: application/manifest+json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode(['id' => 'karta-' . $p, 'name' => PREVADZKY[$p]['nazov'] . ' – vernostná kartička', 'short_name' => PREVADZKY[$p]['nazov'], 'lang' => 'sk',
    'start_url' => karta_url($r['token'], $p), 'scope' => karta_zaklad($p), 'display' => 'standalone', 'background_color' => $farba, 'theme_color' => $farba,
    'icons' => [$ikona(192), $ikona(512)]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function karta_spravy(): never {
  $v = vstup(); limit('karta_zmena', 30, 600);
  $r = klient_z_tokenu((string) ($v['k'] ?? ''));
  $on = ($v['suhlas'] ?? false) === true;
  db()->prepare('UPDATE klient SET suhlas_spravy = ?, suhlas_spravy_cas = ? WHERE id = ?')->execute([$on ? 1 : 0, teraz(), $r['id']]);
  if (!$on) db()->prepare('DELETE FROM odber WHERE klient_id = ?')->execute([$r['id']]);
  odpoved(['ok' => true, 'suhlas_spravy' => $on]);
}

function odber(bool $zapnut): never {
  $v = vstup(); limit('karta_zmena', 30, 600);
  $r = klient_z_tokenu((string) ($v['k'] ?? ''));
  $e = text($v['endpoint'] ?? '', 1000);
  if (!endpoint_povoleny($e)) chyba('Neznáma služba upozornení.');
  if ($zapnut) {
    if (!$r['suhlas_spravy']) db()->prepare('UPDATE klient SET suhlas_spravy = 1, suhlas_spravy_cas = ? WHERE id = ?')->execute([teraz(), $r['id']]);
    db()->prepare('INSERT OR IGNORE INTO odber (klient_id, endpoint, vytvoreny) VALUES (?, ?, ?)')->execute([$r['id'], $e, teraz()]);
    db()->prepare('DELETE FROM odber WHERE klient_id = ? AND id NOT IN (SELECT id FROM odber WHERE klient_id = ? ORDER BY id DESC LIMIT 5)')->execute([$r['id'], $r['id']]);
  } else db()->prepare('DELETE FROM odber WHERE klient_id = ? AND endpoint = ?')->execute([$r['id'], $e]);
  odpoved(['ok' => true]);
}

function odber_stav(): never {
  $v = vstup(); limit('karta', 120, 600);
  $r = klient_z_tokenu((string) ($v['k'] ?? ''));
  $s = db()->prepare('SELECT 1 FROM odber WHERE klient_id = ? AND endpoint = ?'); $s->execute([$r['id'], text($v['endpoint'] ?? '', 1000)]);
  odpoved(['ok' => true, 'aktivny' => (bool) hodnota($s)]);
}

/* service worker po pushi: najnovšia správa (do 3 dní) pre karty prepojené s týmto odberom */
function novinka(): never {
  $v = vstup(); limit('novinka', 60, 600);
  $e = text($v['endpoint'] ?? '', 1000);
  $s = db()->prepare("SELECT s.nadpis, s.text, k.prevadzka FROM odber o JOIN klient k ON k.id = o.klient_id JOIN sprava s ON s.prevadzka = k.prevadzka
                      WHERE o.endpoint = ? AND s.cas >= ? ORDER BY s.id DESC LIMIT 1");
  $s->execute([$e, gmdate('Y-m-d\TH:i:s\Z', time() - 3 * 86400)]);
  $r = riadok($s);
  if (!$r) odpoved(['ok' => true, 'sprava' => null]);
  odpoved(['ok' => true, 'sprava' => ['nadpis' => PREVADZKY[$r['prevadzka']]['nazov'] . ': ' . $r['nadpis'], 'text' => $r['text'], 'url' => karta_zaklad($r['prevadzka']), 'prevadzka' => $r['prevadzka']]]);
}

function karta_zrus(): never {
  $v = vstup(); limit('karta_zmena', 30, 600);
  $r = klient_z_tokenu((string) ($v['k'] ?? ''));
  if (($v['potvrdenie'] ?? '') !== 'ZRUSIT') chyba('Chýba potvrdenie.');
  db()->prepare('DELETE FROM klient WHERE id = ?')->execute([$r['id']]);
  odpoved(['ok' => true]);
}

/* ================= prihlásenie admina ================= */

function prihlasenie(): never {
  relacia();
  if (($_SERVER['HTTP_X_VERNOST_ADMIN'] ?? '') !== '1') chyba('Zakázané.', 403);
  $v = vstup();
  limit_kontrola('prihlasenie', 8, 900);                       // počítajú sa len nesprávne heslá
  $p = prevadzka($v['prevadzka'] ?? '');
  $hash = (string) (konfig()['hesla'][$p] ?? '');
  if ($hash === '') chyba('Admin pre túto prevádzku ešte nie je nastavený (README, časť Nasadenie).', 503);
  if (!password_verify((string) ($v['heslo'] ?? ''), $hash)) { limit_zapis('prihlasenie'); usleep(400000); chyba('Nesprávne heslo.', 401); }
  session_regenerate_id(true);
  udrzba();
  $_SESSION['prevadzka'] = $p; $_SESSION['do'] = time() + 12 * 3600;
  odpoved(['ok' => true, 'prevadzka' => $p, 'nazov' => PREVADZKY[$p]['nazov']]);
}
function odhlasenie(): never { relacia(); $_SESSION = []; session_destroy(); odpoved(['ok' => true]); }
function ja(): never {
  relacia();
  $p = (string) ($_SESSION['prevadzka'] ?? '');
  $ok = $p !== '' && ($_SESSION['do'] ?? 0) >= time();
  // nova: adresa, kde si klient sám založí kartičku (QR kód na recepcii po zaplatení, admin ho ukáže)
  odpoved(['ok' => true, 'prihlaseny' => $ok, 'prevadzka' => $ok ? $p : '', 'nazov' => $ok ? PREVADZKY[$p]['nazov'] : '',
    'nova' => $ok ? karta_zaklad($p) . '?nova' : '', 'prevadzky' => array_map(fn ($x) => $x['nazov'], PREVADZKY)]);
}

/* ================= admin ================= */

function klient_admin(string $p, int $id): array {
  $s = db()->prepare('SELECT * FROM klient WHERE id = ? AND prevadzka = ?');
  $s->execute([$id, $p]);
  $r = riadok($s);
  if (!$r) chyba('Klient neexistuje.', 404);
  return $r;
}
function verejny_klient(array $r): array {
  return ['id' => (int) $r['id'], 'kod' => $r['kod'], 'meno' => $r['meno'], 'telefon' => $r['telefon'], 'email' => $r['email'], 'body' => (int) $r['body'],
    'suhlas_spravy' => (bool) $r['suhlas_spravy'], 'zdroj' => $r['zdroj'], 'vytvorena' => $r['vytvorena'], 'posledna_navsteva' => $r['posledna_navsteva']];
}

function a_klienti(string $p): never {
  $q = text($_GET['q'] ?? '', 200);
  $kod = strtoupper(preg_replace('/[\s-]/', '', preg_replace('/^V30:/i', '', $q)));
  if (preg_match('/^[A-HJKMNP-Z2-9]{8}$/', $kod)) {                              // kód recepcie z QR na kartičke (alebo prepísaný ručne)
    $s = db()->prepare('SELECT * FROM klient WHERE prevadzka = ? AND kod = ?'); $s->execute([$p, $kod]);
  } elseif (preg_match('/[?&]k=([A-Za-z0-9_-]{22})/', $q, $m) || preg_match('/^([A-Za-z0-9_-]{22})$/', $q, $m)) {   // odkaz na kartičku
    $s = db()->prepare('SELECT * FROM klient WHERE prevadzka = ? AND token = ?'); $s->execute([$p, $m[1]]);
  } elseif ($q !== '') {
    $tel = preg_replace('/\D/', '', $q);
    $s = db()->prepare("SELECT * FROM klient WHERE prevadzka = ? AND (norm(meno) LIKE ? ESCAPE '\\' OR norm(email) LIKE ? ESCAPE '\\' OR (? <> '' AND replace(telefon, '+', '') LIKE ?)) ORDER BY meno LIMIT 50");
    $like = '%' . addcslashes(norm($q), '%_\\') . '%';
    $s->execute([$p, $like, $like, $tel, '%' . ltrim($tel, '0') . '%']);
  } else {
    $s = db()->prepare('SELECT * FROM klient WHERE prevadzka = ? ORDER BY id DESC LIMIT 50'); $s->execute([$p]);
  }
  $poc = db()->prepare('SELECT COUNT(*) AS karty, COALESCE(SUM(suhlas_spravy), 0) AS so_suhlasom FROM klient WHERE prevadzka = ?'); $poc->execute([$p]);
  $push = db()->prepare('SELECT COUNT(DISTINCT o.klient_id) FROM odber o JOIN klient k ON k.id = o.klient_id WHERE k.prevadzka = ? AND k.suhlas_spravy = 1'); $push->execute([$p]);
  odpoved(['ok' => true, 'klienti' => array_map('verejny_klient', $s->fetchAll()), 'spolu' => riadok($poc) + ['s_upozornenim' => (int) hodnota($push)]]);
}

function a_klient(string $p, int $id): never {
  $r = klient_admin($p, $id);
  $h = db()->prepare('SELECT body, typ, popis, cas FROM pohyb WHERE klient_id = ? ORDER BY id DESC LIMIT 50'); $h->execute([$id]);
  odpoved(['ok' => true, 'klient' => verejny_klient($r) + ['karta' => karta_url($r['token'], $p)], 'historia' => $h->fetchAll()]);
}

function a_klient_novy(string $p): never {
  $v = vstup();
  if (($v['suhlas_karta'] ?? false) !== true) chyba('Kartu založíme len so súhlasom klienta.');
  $meno = text($v['meno'] ?? '', 80); if (mb_strlen($meno) < 2) chyba('Chýba meno.');
  $tel = telefon(text($v['telefon'] ?? '', 30)); if (!$tel) chyba('Neplatné telefónne číslo.');
  $email = text($v['email'] ?? '', 120); if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) chyba('Neplatný e‑mail.');
  $spravy = ($v['suhlas_spravy'] ?? false) === true;
  $s = db()->prepare('SELECT id FROM klient WHERE prevadzka = ? AND telefon = ?'); $s->execute([$p, $tel]);
  if ($id = hodnota($s)) chyba('Klient s týmto číslom už kartu má (#' . (int) $id . ').', 409);
  $token = token();
  db()->prepare('INSERT INTO klient (prevadzka, meno, telefon, email, token, kod, suhlas_karta, suhlas_spravy, suhlas_spravy_cas, zdroj, vytvorena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      ->execute([$p, $meno, $tel, $email, $token, kod_recepcie(), teraz(), $spravy ? 1 : 0, $spravy ? teraz() : null, 'recepcia', teraz()]);
  $id = (int) db()->lastInsertId();
  zapis_pohyb($id, 0, 'zalozenie', 'Karta založená na recepcii');
  if ($email !== '') email_karta($email, $p, $token);
  odpoved(['ok' => true, 'id' => $id, 'karta' => karta_url($token, $p)]);
}

function a_klient_uprav(string $p): never {
  $v = vstup(); $r = klient_admin($p, (int) ($v['id'] ?? 0));
  $meno = text($v['meno'] ?? $r['meno'], 80); if (mb_strlen($meno) < 2) chyba('Chýba meno.');
  $tel = telefon(text($v['telefon'] ?? $r['telefon'], 30)); if (!$tel) chyba('Neplatné telefónne číslo.');
  $email = text($v['email'] ?? $r['email'], 120); if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) chyba('Neplatný e‑mail.');
  $spravy = (int) $r['suhlas_spravy'];
  if (($v['odvolat_spravy'] ?? false) === true) $spravy = 0;          // súhlas so správami môže dať len klient sám, admin ho len zaznamená ako odvolaný
  try {
    db()->prepare('UPDATE klient SET meno = ?, telefon = ?, email = ?, suhlas_spravy = ?, suhlas_spravy_cas = CASE WHEN ? <> suhlas_spravy THEN ? ELSE suhlas_spravy_cas END WHERE id = ?')
        ->execute([$meno, $tel, $email, $spravy, $spravy, teraz(), $r['id']]);
  } catch (PDOException $e) { chyba('Toto číslo už má iná karta.', 409); }
  if (!$spravy) db()->prepare('DELETE FROM odber WHERE klient_id = ?')->execute([$r['id']]);
  odpoved(['ok' => true]);
}

function a_klient_zmaz(string $p): never {
  $v = vstup(); $r = klient_admin($p, (int) ($v['id'] ?? 0));
  db()->prepare('DELETE FROM klient WHERE id = ?')->execute([$r['id']]);
  odpoved(['ok' => true]);
}

function a_navsteva(string $p): never {
  $v = vstup(); $r = klient_admin($p, (int) ($v['id'] ?? 0));
  $s = db()->prepare("SELECT cas FROM pohyb WHERE klient_id = ? AND typ = 'navsteva' ORDER BY id DESC LIMIT 1"); $s->execute([$r['id']]);
  $posl = hodnota($s);
  if ($posl && strtotime((string) $posl) > time() - 1800 && ($v['aj_tak'] ?? false) !== true) chyba('Návšteva je už zapísaná pred menej ako 30 minútami.', 409);
  $body = max(0, min(100, (int) nastavenie($p, 'body_za_navstevu', '1')));
  zapis_pohyb((int) $r['id'], $body, 'navsteva', text($v['popis'] ?? '', 120) ?: 'Návšteva');
  db()->prepare('UPDATE klient SET posledna_navsteva = ? WHERE id = ?')->execute([teraz(), $r['id']]);
  odpoved(['ok' => true, 'pripisane' => $body, 'body' => (int) $r['body'] + $body]);
}

function a_body(string $p): never {
  $v = vstup(); $r = klient_admin($p, (int) ($v['id'] ?? 0));
  $b = (int) ($v['body'] ?? 0);
  if ($b === 0 || abs($b) > 1000) chyba('Počet bodov musí byť od -1000 do 1000 a nie 0.');
  if ((int) $r['body'] + $b < 0) chyba('Klient nemá dosť bodov.', 409);
  $popis = text($v['popis'] ?? '', 120); if ($popis === '') chyba('Napíš dôvod (napr. kúpa produktu).');
  zapis_pohyb((int) $r['id'], $b, 'uprava', $popis);
  odpoved(['ok' => true, 'body' => (int) $r['body'] + $b]);
}

function a_uplatnit(string $p): never {
  $v = vstup(); $r = klient_admin($p, (int) ($v['id'] ?? 0));
  $s = db()->prepare('SELECT * FROM odmena WHERE id = ? AND prevadzka = ? AND aktivna = 1'); $s->execute([(int) ($v['odmena_id'] ?? 0), $p]);
  $od = riadok($s); if (!$od) chyba('Odmena neexistuje alebo nie je aktívna.', 404);
  if (isset($v['body']) && (int) $v['body'] !== (int) $od['body']) chyba('Cena odmeny sa medzitým zmenila na ' . (int) $od['body'] . ' b. Otvor klienta znova.', 409);
  $pdo = db(); $pdo->beginTransaction();
  $pdo->prepare('UPDATE klient SET body = body WHERE id = ?')->execute([$r['id']]);   // zámok skôr, než čítame body
  $aktual = $pdo->prepare('SELECT body FROM klient WHERE id = ?'); $aktual->execute([$r['id']]);
  if ((int) hodnota($aktual) < (int) $od['body']) { $pdo->rollBack(); chyba('Klient nemá dosť bodov.', 409); }
  zapis_pohyb((int) $r['id'], -(int) $od['body'], 'odmena', 'Odmena: ' . $od['nazov']);
  $pdo->commit();
  odpoved(['ok' => true, 'body' => (int) $r['body'] - (int) $od['body']]);
}

function a_zoznam(string $p, string $tab): never {
  $s = db()->prepare("SELECT * FROM $tab WHERE prevadzka = ? ORDER BY aktivna DESC, id DESC"); $s->execute([$p]);
  odpoved(['ok' => true, 'polozky' => $s->fetchAll()]);
}

function a_odmena_uloz(string $p): never {
  $v = vstup();
  $nazov = text($v['nazov'] ?? '', 80); if (mb_strlen($nazov) < 2) chyba('Chýba názov odmeny.');
  $popis = text($v['popis'] ?? '', 300); $body = (int) ($v['body'] ?? 0);
  if ($body < 1 || $body > 10000) chyba('Body musia byť od 1 do 10000.');
  $akt = ($v['aktivna'] ?? true) === true ? 1 : 0; $id = (int) ($v['id'] ?? 0);
  if ($id) db()->prepare('UPDATE odmena SET nazov = ?, popis = ?, body = ?, aktivna = ? WHERE id = ? AND prevadzka = ?')->execute([$nazov, $popis, $body, $akt, $id, $p]);
  else db()->prepare('INSERT INTO odmena (prevadzka, nazov, popis, body, aktivna, vytvorena) VALUES (?, ?, ?, ?, ?, ?)')->execute([$p, $nazov, $popis, $body, $akt, teraz()]);
  odpoved(['ok' => true]);
}

function datum(mixed $d): ?string { $d = text($d, 10); return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : null; }
function a_akcia_uloz(string $p): never {
  $v = vstup();
  $nazov = text($v['nazov'] ?? '', 100); if (mb_strlen($nazov) < 2) chyba('Chýba názov akcie.');
  $popis = text($v['popis'] ?? '', 600); $od = datum($v['od'] ?? ''); $do = datum($v['do'] ?? '');
  if ($od && $do && $do < $od) chyba('Koniec akcie je pred začiatkom.');
  $akt = ($v['aktivna'] ?? true) === true ? 1 : 0; $id = (int) ($v['id'] ?? 0);
  if ($id) db()->prepare('UPDATE akcia SET nazov = ?, popis = ?, od = ?, do = ?, aktivna = ? WHERE id = ? AND prevadzka = ?')->execute([$nazov, $popis, $od, $do, $akt, $id, $p]);
  else db()->prepare('INSERT INTO akcia (prevadzka, nazov, popis, od, do, aktivna, vytvorena) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$p, $nazov, $popis, $od, $do, $akt, teraz()]);
  odpoved(['ok' => true]);
}

function a_zmaz(string $p): never {
  $v = vstup(); $tab = ['odmena' => 'odmena', 'akcia' => 'akcia'][(string) ($v['co'] ?? '')] ?? chyba('Neznáma položka.');
  db()->prepare("DELETE FROM $tab WHERE id = ? AND prevadzka = ?")->execute([(int) ($v['id'] ?? 0), $p]);
  odpoved(['ok' => true]);
}

function a_spravy(string $p): never {
  $s = db()->prepare('SELECT * FROM sprava WHERE prevadzka = ? ORDER BY id DESC LIMIT 50'); $s->execute([$p]);
  odpoved(['ok' => true, 'polozky' => $s->fetchAll()]);
}

function a_sprava_posli(string $p): never {
  $v = vstup(); limit('sprava', 20, 3600);
  $nadpis = text($v['nadpis'] ?? '', 60); $text = text($v['text'] ?? '', 500);
  if (mb_strlen($nadpis) < 2 || mb_strlen($text) < 2) chyba('Napíš nadpis aj text správy.');
  $pdo = db();
  $pdo->prepare('INSERT INTO sprava (prevadzka, nadpis, text, cas) VALUES (?, ?, ?, ?)')->execute([$p, $nadpis, $text, teraz()]);
  $id = (int) $pdo->lastInsertId();
  $o = $pdo->prepare('SELECT DISTINCT o.endpoint FROM odber o JOIN klient k ON k.id = o.klient_id WHERE k.prevadzka = ? AND k.suhlas_spravy = 1'); $o->execute([$p]);
  [$push] = posli_push($o->fetchAll());
  $email = 0;
  if (($v['aj_email'] ?? false) === true) {
    @set_time_limit(180);
    $e = $pdo->prepare("SELECT meno, email, token FROM klient WHERE prevadzka = ? AND suhlas_spravy = 1 AND email <> '' LIMIT 500"); $e->execute([$p]);
    foreach ($e->fetchAll() as $k) {
      if (posli_email($k['email'], PREVADZKY[$p]['nazov'] . ': ' . $nadpis, "$text\n\nVaša karta: " . karta_url($k['token'], $p) . "\nSprávy si vypnete na karte (Správy o akciách: vypnúť).\n")) $email++;
    }
  }
  $pdo->prepare('UPDATE sprava SET push = ?, email = ? WHERE id = ?')->execute([$push, $email, $id]);
  odpoved(['ok' => true, 'push' => $push, 'email' => $email]);
}

function a_nastavenia(string $p): never {
  odpoved(['ok' => true, 'body_za_navstevu' => (int) nastavenie($p, 'body_za_navstevu', '1'), 'email' => konfig()['email_od'] !== '']);
}
function a_nastavenia_uloz(string $p): never {
  $v = vstup(); $b = (int) ($v['body_za_navstevu'] ?? 1);
  if ($b < 0 || $b > 100) chyba('Body za návštevu musia byť od 0 do 100.');
  nastav($p, 'body_za_navstevu', (string) $b);
  odpoved(['ok' => true]);
}

function a_export(string $p): never {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="vernostna-karta-' . $p . '-' . dnes() . '.csv"');
  header('Cache-Control: no-store');
  $out = fopen('php://output', 'w');
  fwrite($out, "\xEF\xBB\xBF");
  fputcsv($out, ['id', 'meno', 'telefon', 'email', 'body', 'suhlas_spravy', 'zdroj', 'vytvorena', 'posledna_navsteva'], ';');
  $s = db()->prepare('SELECT * FROM klient WHERE prevadzka = ? ORDER BY id'); $s->execute([$p]);
  foreach ($s as $r) {
    $bunky = array_map(fn ($x) => preg_match('/^[=+\-@]/', (string) $x) ? "'" . $x : $x, [$r['id'], $r['meno'], $r['telefon'], $r['email'], $r['body'], $r['suhlas_spravy'], $r['zdroj'], $r['vytvorena'], $r['posledna_navsteva']]);
    fputcsv($out, $bunky, ';');
  }
  exit;
}
