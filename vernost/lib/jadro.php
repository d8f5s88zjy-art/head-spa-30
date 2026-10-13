<?php
/* VERNOSTNÁ KARTA 30 – jadro: konfigurácia, databáza (SQLite cez PDO), bezpečnosť, pomocné funkcie.
 * Beží na bežnom PHP hostingu (Forpsi, Apache) od PHP 8.1. Žiadne knižnice, žiadne tajomstvá v repozitári:
 * heslá adminu sú len ako hash v config.php, ktorý vytvorí nasadenie zo secrets (pozri README.md). */
declare(strict_types=1);
if (!defined('VERNOST')) { http_response_code(404); exit; }

const PREVADZKY = [
  'barbershop' => ['nazov' => 'Barbershop 30', 'mesto' => 'Mostná 30, Nitra', 'tel' => '+421951267203', 'tel_text' => '0951 267 203',
                   'web' => 'https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/', 'prevadzkovatel' => 'FACEPALM, s.r.o., IČO 52231381'],
  'headspa'    => ['nazov' => 'HEAD SPA 30', 'mesto' => 'Mostná 226/30, Nitra', 'tel' => '+421911153136', 'tel_text' => '0911 153 136',
                   'web' => 'https://www.headspa30.sk/', 'prevadzkovatel' => 'HEAD SPA 30'],
];
const POVOLENE_POVODY = ['https://www.headspa30.sk', 'https://headspa30.sk', 'https://d8f5s88zjy-art.github.io',
                         'https://www.barbershop30.sk', 'https://barbershop30.sk'];

function konfig(): array {
  static $k = null;
  if ($k !== null) return $k;
  $subor = __DIR__ . '/../config.php';
  $k = is_file($subor) ? (array) require $subor : [];
  $k += ['hesla' => [], 'email_od' => '', 'zaklad' => '', 'povody' => [], 'kontakt_push' => 'mailto:info@salon30.sk'];
  return $k;
}

/* adresa priečinka vernost/ (napr. https://www.headspa30.sk/vernost/) – z konfigurácie, inak z požiadavky */
function zaklad(): string {
  $z = (string) konfig()['zaklad'];
  if ($z !== '') return rtrim($z, '/') . '/';
  $https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $cesta = preg_replace('#/api/.*$#', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/vernost/api/index.php'));
  return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $cesta;
}

/* ---------- databáza ---------- */
function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $pdo = new PDO('sqlite:' . cesta_db(), null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000;');
  $pdo->sqliteCreateFunction('norm', fn ($s) => norm((string) $s), 1, PDO::SQLITE_DETERMINISTIC);
  schema($pdo);
  return $pdo;
}

/* jeden riadok či hodnota a hneď zavrieť kurzor: otvorený čítací snímok WAL by inak zablokoval nasledujúci zápis (database is locked) */
function riadok(PDOStatement $s): array|false { $r = $s->fetch(); $s->closeCursor(); return $r; }
function hodnota(PDOStatement $s): mixed { $v = $s->fetchColumn(); $s->closeCursor(); return $v; }
/* hľadanie bez ohľadu na veľkosť písmen a diakritiku (SQLite LIKE to vie len pre ASCII) */
function norm(string $s): string {
  return strtr(mb_strtolower($s), ['á' => 'a', 'ä' => 'a', 'č' => 'c', 'ď' => 'd', 'é' => 'e', 'ě' => 'e', 'í' => 'i', 'ĺ' => 'l', 'ľ' => 'l', 'ň' => 'n',
    'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'ő' => 'o', 'ŕ' => 'r', 'ř' => 'r', 'š' => 's', 'ť' => 't', 'ú' => 'u', 'ů' => 'u', 'ü' => 'u', 'ű' => 'u', 'ý' => 'y', 'ž' => 'z',
    'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ś' => 's', 'ź' => 'z', 'ż' => 'z']);
}
/* kód pre recepciu (v QR na kartičke): len identifikátor pre admin, nie prístup ku kartičke */
function kod_recepcie(): string {
  $abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; $k = '';
  for ($i = 0; $i < 8; $i++) $k .= $abc[random_int(0, strlen($abc) - 1)];
  return $k;
}

/* databáza mimo webu, ak hosting dovolí zapisovať o priečinok vyššie; inak v data/ (zakázané v .htaccess) s náhodným menom */
function cesta_db(): string {
  $data = __DIR__ . '/../data';
  $meno = $data . '/meno.php';
  if (!is_file($meno)) {
    @mkdir($data, 0750, true);
    file_put_contents($meno, "<?php return '" . bin2hex(random_bytes(16)) . "';\n", LOCK_EX);
  }
  $nahodne = (string) require $meno;
  $koren = isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] !== '' ? dirname((string) $_SERVER['DOCUMENT_ROOT']) : '';
  if ($koren !== '' && getenv('VERNOST_DATA') === false) {
    $mimo = $koren . '/vernost-data';
    if (is_dir($mimo) || @mkdir($mimo, 0700)) { if (is_writable($mimo)) return $mimo . "/vernost-$nahodne.sqlite"; }
  }
  if (getenv('VERNOST_DATA')) $data = (string) getenv('VERNOST_DATA');
  return $data . "/vernost-$nahodne.sqlite";
}

function schema(PDO $pdo): void {
  $pdo->exec(<<<SQL
CREATE TABLE IF NOT EXISTS klient (
  id INTEGER PRIMARY KEY, prevadzka TEXT NOT NULL, meno TEXT NOT NULL, telefon TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
  token TEXT NOT NULL UNIQUE, kod TEXT NOT NULL UNIQUE, body INTEGER NOT NULL DEFAULT 0 CHECK (body >= 0),
  suhlas_karta TEXT NOT NULL, suhlas_spravy INTEGER NOT NULL DEFAULT 0, suhlas_spravy_cas TEXT,
  zdroj TEXT NOT NULL DEFAULT 'web', vytvorena TEXT NOT NULL, posledna_navsteva TEXT,
  UNIQUE (prevadzka, telefon));
CREATE TABLE IF NOT EXISTS pohyb (
  id INTEGER PRIMARY KEY, klient_id INTEGER NOT NULL REFERENCES klient(id) ON DELETE CASCADE,
  body INTEGER NOT NULL, typ TEXT NOT NULL, popis TEXT NOT NULL DEFAULT '', cas TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS pohyb_klient ON pohyb (klient_id, id);
CREATE TABLE IF NOT EXISTS odmena (
  id INTEGER PRIMARY KEY, prevadzka TEXT NOT NULL, nazov TEXT NOT NULL, popis TEXT NOT NULL DEFAULT '',
  body INTEGER NOT NULL CHECK (body > 0), aktivna INTEGER NOT NULL DEFAULT 1, vytvorena TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS akcia (
  id INTEGER PRIMARY KEY, prevadzka TEXT NOT NULL, nazov TEXT NOT NULL, popis TEXT NOT NULL DEFAULT '',
  od TEXT, do TEXT, aktivna INTEGER NOT NULL DEFAULT 1, vytvorena TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sprava (
  id INTEGER PRIMARY KEY, prevadzka TEXT NOT NULL, nadpis TEXT NOT NULL, text TEXT NOT NULL, cas TEXT NOT NULL,
  push INTEGER NOT NULL DEFAULT 0, email INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS odber (
  id INTEGER PRIMARY KEY, klient_id INTEGER NOT NULL REFERENCES klient(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, vytvoreny TEXT NOT NULL, UNIQUE (klient_id, endpoint));
CREATE TABLE IF NOT EXISTS nastavenie (prevadzka TEXT NOT NULL, kluc TEXT NOT NULL, hodnota TEXT NOT NULL, PRIMARY KEY (prevadzka, kluc));
CREATE TABLE IF NOT EXISTS limit_poziadaviek (kluc TEXT NOT NULL, cas INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS limit_kluc ON limit_poziadaviek (kluc, cas);
SQL);
}

function teraz(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function dnes(): string { return (new DateTimeImmutable('now', new DateTimeZone('Europe/Bratislava')))->format('Y-m-d'); }

function nastavenie(string $p, string $kluc, string $predvolene = ''): string {
  $s = db()->prepare('SELECT hodnota FROM nastavenie WHERE prevadzka = ? AND kluc = ?');
  $s->execute([$p, $kluc]);
  $v = hodnota($s);
  return $v === false ? $predvolene : (string) $v;
}
function nastav(string $p, string $kluc, string $hodnota): void {
  db()->prepare('INSERT INTO nastavenie (prevadzka, kluc, hodnota) VALUES (?, ?, ?) ON CONFLICT (prevadzka, kluc) DO UPDATE SET hodnota = excluded.hodnota')
      ->execute([$p, $kluc, $hodnota]);
}

/* ---------- odpovede a vstup ---------- */
function odpoved(array $data, int $kod = 200): never {
  http_response_code($kod);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function chyba(string $sprava, int $kod = 400): never { odpoved(['ok' => false, 'chyba' => $sprava], $kod); }

function vstup(): array {
  static $v = null;
  if ($v !== null) return $v;
  $surove = file_get_contents('php://input', false, null, 0, 65536) ?: '';
  $v = $surove === '' ? [] : json_decode($surove, true);
  if (!is_array($v)) chyba('Neplatné údaje.');
  return $v;
}
function text(mixed $x, int $max): string {
  $s = is_scalar($x) ? (string) $x : '';
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
  $s = trim(preg_replace('/[ \t]+/u', ' ', $s) ?? '');
  return mb_substr($s, 0, $max);
}
function prevadzka(mixed $p): string {
  $p = is_string($p) ? $p : '';
  if (!isset(PREVADZKY[$p])) chyba('Neznáma prevádzka.');
  return $p;
}

/* telefón do tvaru +421…; slovenské 09xx…, inak medzinárodný tvar s + a 8 až 15 číslicami */
function telefon(string $t): ?string {
  $c = preg_replace('/[^\d+]/', '', $t) ?? '';
  if (str_starts_with($c, '00')) $c = '+' . substr($c, 2);
  if (preg_match('/^0(9\d{8})$/', $c, $m)) $c = '+421' . $m[1];
  if (preg_match('/^\+4210(9\d{8})$/', $c, $m)) $c = '+421' . $m[1];
  if (preg_match('/^9\d{8}$/', $c)) $c = '+421' . $c;
  return preg_match('/^\+[1-9]\d{7,14}$/', $c) ? $c : null;
}

function token(): string { return rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '='); }

/* ---------- CORS a pôvod požiadavky ---------- */
function povod_povoleny(string $o): bool {
  if ($o === '') return true;
  $vlastny = preg_replace('#^(https?://[^/]+).*$#', '$1', zaklad());
  return $o === $vlastny || in_array($o, array_merge(POVOLENE_POVODY, (array) konfig()['povody']), true);
}
function cors(): void {
  $o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
  if ($o !== '' && povod_povoleny($o)) {
    header('Access-Control-Allow-Origin: ' . $o);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 600');
  }
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}

/* ---------- limity požiadaviek (proti skúšaniu hesiel a hromadnému zakladaniu kariet) ---------- */
function ip(): string {
  /* X-Forwarded-For pošle ktokoľvek, preto mu veríme len vtedy, keď požiadavku priniesla proxy hostingu
     (vnútorná adresa alebo adresa uvedená v config.php 'proxy'); potom platí posledná, ňou pripojená adresa */
  $r = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
  $xff = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
  $proxy = in_array($r, (array) (konfig()['proxy'] ?? []), true) || !filter_var($r, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
  if ($proxy && $xff !== '') { $casti = array_map('trim', explode(',', $xff)); $posledna = end($casti); if (filter_var($posledna, FILTER_VALIDATE_IP)) return $posledna; }
  return $r;
}
function ip_cez_proxy(): bool { return ip() !== (string) ($_SERVER['REMOTE_ADDR'] ?? ''); }
function limit_kluc(string $akcia): string { return $akcia . ':' . hash_hmac('sha256', ip(), cesta_db()); }   // IP len ako odtlačok so soľou
function limit_ok(string $akcia, int $max, int $okno, ?string $kluc = null): bool {
  $pdo = db(); $t = time();
  $pdo->prepare('DELETE FROM limit_poziadaviek WHERE cas < ?')->execute([$t - 86400]);                   // odtlačky najviac deň
  $s = $pdo->prepare('SELECT COUNT(*) FROM limit_poziadaviek WHERE kluc = ? AND cas > ?');
  $s->execute([$kluc ?? limit_kluc($akcia), $t - $okno]);
  return (int) hodnota($s) < $max;
}
function limit_zapis(string $akcia, ?string $kluc = null): void {
  db()->prepare('INSERT INTO limit_poziadaviek (kluc, cas) VALUES (?, ?)')->execute([$kluc ?? limit_kluc($akcia), time()]);
}
function limit_kontrola(string $akcia, int $max, int $okno): void {
  if (!limit_ok($akcia, $max, $okno)) chyba('Príliš veľa pokusov. Skús to, prosím, o chvíľu.', 429);
}
function limit(string $akcia, int $max, int $okno): void { limit_kontrola($akcia, $max, $okno); limit_zapis($akcia); }

/* ---------- admin: relácia, heslo, ochrana pred podvrhnutou požiadavkou ---------- */
function relacia(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  $https = str_starts_with(zaklad(), 'https://');
  $dir = dirname(cesta_db()) . '/relacie';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  if (is_dir($dir) && is_writable($dir)) session_save_path($dir);
  ini_set('session.gc_maxlifetime', '43200');
  session_name('v30adm');
  session_set_cookie_params(['lifetime' => 0, 'path' => parse_url(zaklad(), PHP_URL_PATH) ?: '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
  session_start();
}
function admin(): string {
  relacia();
  if (($_SERVER['HTTP_X_VERNOST_ADMIN'] ?? '') !== '1') chyba('Zakázané.', 403);
  $o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
  $vlastny = preg_replace('#^(https?://[^/]+).*$#', '$1', zaklad());
  if ($o !== '' && $o !== $vlastny) chyba('Zakázané.', 403);
  $p = (string) ($_SESSION['prevadzka'] ?? '');
  if ($p === '' || !isset(PREVADZKY[$p]) || ($_SESSION['do'] ?? 0) < time()) chyba('Prihlás sa, prosím.', 401);
  $_SESSION['do'] = time() + 12 * 3600;
  return $p;
}

function zapis_pohyb(int $klient, int $body, string $typ, string $popis): void {
  $pdo = db();
  $vlastna = !$pdo->inTransaction();                // pohyb a zostatok bodov vždy spolu, alebo vôbec
  if ($vlastna) $pdo->beginTransaction();
  try {
    $pdo->prepare('INSERT INTO pohyb (klient_id, body, typ, popis, cas) VALUES (?, ?, ?, ?, ?)')->execute([$klient, $body, $typ, $popis, teraz()]);
    $pdo->prepare('UPDATE klient SET body = body + ? WHERE id = ?')->execute([$body, $klient]);
    if ($vlastna) $pdo->commit();
  } catch (Throwable $e) { if ($vlastna && $pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}

/* údržba (pri prihlásení admina): kartičky bez návštevy 3 roky sa vymažú aj s históriou, ako sľubuje ochrana údajov */
function udrzba(): void {
  db()->prepare('DELETE FROM klient WHERE COALESCE(posledna_navsteva, vytvorena) < ?')->execute([gmdate('Y-m-d\TH:i:s\Z', time() - 3 * 365 * 86400)]);
}

/* e‑mail s odkazom na kartu (PHP mail(); ak hosting neodošle, karta funguje aj bez e‑mailu) */
function posli_email(string $komu, string $predmet, string $text): bool {
  $od = (string) konfig()['email_od'];
  if ($od === '' || !filter_var($komu, FILTER_VALIDATE_EMAIL)) return false;
  $kluc = 'mail:' . hash('sha256', mb_strtolower($komu));
  if (!limit_ok('mail', 2, 86400, $kluc)) return false;
  limit_zapis('mail', $kluc);
  $hlavicky = "From: $od\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\nMIME-Version: 1.0";
  return @mail($komu, '=?UTF-8?B?' . base64_encode($predmet) . '?=', $text, $hlavicky);
}
