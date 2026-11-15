<?php
// Smerovač pre lokálne testy cez php -S: napodobní zákazy z .htaccess a web.config (správa, údaje, nahrávky),
// ktoré na hostingu robí Apache alebo IIS. RS_BEZ_OCHRANY=1 ich vypne (test, že správa chýbajúcu ochranu zistí).
$u = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$koren = $_SERVER['DOCUMENT_ROOT'];
$zakaz = function () { http_response_code(403); header('Content-Type: text/plain'); echo 'Zakázané'; return true; };
if (!getenv('RS_BEZ_OCHRANY')) {
    if (preg_match('#(^|/)(\.htaccess|web\.config|\.user\.ini)$#', $u)) return $zakaz();
    if (preg_match('#^/sprava-data-[0-9a-f]{32}(/|$)#', $u)) return $zakaz();
    if (preg_match('#^/(img|pdf)/s/#', $u)) {
        $ok = preg_match('#^/img/s/\d{4}/\d{2}/[a-z0-9-]+\.(webp|avif|jpg)$#', $u) || preg_match('#^/pdf/s/\d{4}/\d{2}/[a-z0-9-]+\.pdf$#', $u);
        if (!$ok) return $zakaz();
    }
    if (preg_match('#^/sprava(/|$)#', $u) && !preg_match('#^/sprava/(index\.php)?$#', $u) && !preg_match('#^/sprava/assets/(sprava\.(css|js)|manifest\.webmanifest|ikona-192\.png)$#', $u)) return $zakaz();
}
if (preg_match('#^/sprava/?$#', $u)) { $_SERVER['SCRIPT_NAME'] = '/sprava/index.php'; chdir($koren . '/sprava'); require $koren . '/sprava/index.php'; return true; }
if ($u === '/sprava/index.php') { chdir($koren . '/sprava'); return false; }
if (str_ends_with($u, '.avif') && is_file($koren . $u)) { header('Content-Type: image/avif'); readfile($koren . $u); return true; }
return false;
