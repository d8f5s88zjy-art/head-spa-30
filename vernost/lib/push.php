<?php
/* Upozornenia do mobilu (Web Push) bez knižníc: posiela sa prázdna správa podpísaná kľúčom VAPID (ES256);
 * service worker karty si po prijatí stiahne najnovšiu správu z API a zobrazí ju. Bez šifrovania obsahu,
 * lebo obsah v pushi nie je. Kľúče sa vytvoria na serveri pri prvom použití a ostanú v databáze. */
declare(strict_types=1);
if (!defined('VERNOST')) { http_response_code(404); exit; }

function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

/* [verejný kľúč 65 B ako base64url, súkromný PEM] */
function vapid(): array {
  static $v = null;
  if ($v) return $v;
  $pem = nastavenie('*', 'vapid_pem');
  if ($pem === '') {
    $k = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$k) throw new RuntimeException('OpenSSL nevie vytvoriť kľúč EC.');
    openssl_pkey_export($k, $novy);
    db()->prepare("INSERT OR IGNORE INTO nastavenie (prevadzka, kluc, hodnota) VALUES ('*', 'vapid_pem', ?)")->execute([$novy]);
    $pem = nastavenie('*', 'vapid_pem');                 // pri súbežnom prvom spustení vyhrá jeden kľúč pre všetkých
  }
  $d = openssl_pkey_get_details(openssl_pkey_get_private($pem));
  $x = str_pad($d['ec']['x'], 32, "\0", STR_PAD_LEFT);
  $y = str_pad($d['ec']['y'], 32, "\0", STR_PAD_LEFT);
  return $v = [b64u("\x04" . $x . $y), $pem];
}

/* podpis DER (SEQUENCE{INTEGER r, INTEGER s}) -> 64 B r||s pre JWT ES256 */
function der_na_raw(string $der): string {
  $pos = 2;
  if (ord($der[1]) & 0x80) $pos += ord($der[1]) & 0x7f;
  $citaj = function () use ($der, &$pos): string {
    $pos++; $dlzka = ord($der[$pos++]); $v = substr($der, $pos, $dlzka); $pos += $dlzka;
    return str_pad(ltrim($v, "\0"), 32, "\0", STR_PAD_LEFT);
  };
  return $citaj() . $citaj();
}

function vapid_hlavicka(string $endpoint): string {
  [$pub, $pem] = vapid();
  $u = parse_url($endpoint);
  $aud = $u['scheme'] . '://' . $u['host'] . (isset($u['port']) ? ':' . $u['port'] : '');
  $hlavicka = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
  $telo = b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => (string) konfig()['kontakt_push']]));
  openssl_sign("$hlavicka.$telo", $der, openssl_pkey_get_private($pem), OPENSSL_ALGO_SHA256);
  return "vapid t=$hlavicka.$telo." . b64u(der_na_raw($der)) . ", k=$pub";
}

/* pošle prázdny push na všetky odbery; vráti [odoslané, zlyhané]; neplatné odbery (400/403/404/410) zmaže */
function posli_push(array $odbery): array {
  $ok = 0; $zle = 0;
  $mh = curl_multi_init(); $spojenia = [];
  foreach ($odbery as $o) {
    $ch = curl_init($o['endpoint']);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => '', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
      CURLOPT_HTTPHEADER => ['Authorization: ' . vapid_hlavicka($o['endpoint']), 'TTL: 86400', 'Urgency: normal', 'Content-Length: 0']]);
    curl_multi_add_handle($mh, $ch); $spojenia[] = [$ch, $o];
  }
  do { curl_multi_exec($mh, $bezi); if ($bezi) curl_multi_select($mh, 1.0); } while ($bezi);
  foreach ($spojenia as [$ch, $o]) {
    $kod = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($kod >= 200 && $kod < 300) $ok++;
    else { $zle++; if (in_array($kod, [400, 403, 404, 410], true)) db()->prepare('DELETE FROM odber WHERE endpoint = ?')->execute([$o['endpoint']]); }
    curl_multi_remove_handle($mh, $ch); curl_close($ch);
  }
  curl_multi_close($mh);
  return [$ok, $zle];
}

/* adresa push služby musí byť https a z bežných služieb prehliadačov (nie ľubovoľný server) */
function endpoint_povoleny(string $e): bool {
  if (getenv('VERNOST_TEST_PUSH') && str_starts_with($e, (string) getenv('VERNOST_TEST_PUSH'))) return true;
  if (!str_starts_with($e, 'https://') || strlen($e) > 1000) return false;
  $h = strtolower((string) parse_url($e, PHP_URL_HOST));
  return in_array($h, ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'], true)
    || (bool) preg_match('/^[a-z0-9-]+\.notify\.windows\.com$/', $h);
}
