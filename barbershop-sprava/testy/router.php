<?php
/* Smerovač pre lokálnu skúšku plného balíka (php -S 127.0.0.1:PORT -t <koreň> router.php): napodobní to, čo na hostingu
 * robí Apache – pravidlá .htaccess balíka (asistent/, vernost/, sprava/), ochranu priečinka údajov v koreni webu,
 * prednosť index.html pred index.php (podmienka z návodu) a koreňový .htaccess rezervačného systému (Laravel: čo nie je
 * súbor ani priečinok, ide do index.php). Len pre testy, na hosting nepatrí. */
$koren = rtrim($_SERVER['DOCUMENT_ROOT'], '/');
$cesta = (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$zakaz = function () { http_response_code(403); header('Content-Type: text/plain; charset=utf-8'); echo 'Zakázané'; return true; };
$spusti = function (string $skript) { chdir(dirname($skript)); $_SERVER['SCRIPT_FILENAME'] = $skript; require $skript; return true; };
$subor = function (string $f) { header('Content-Type: text/html; charset=utf-8'); readfile($f); return true; };
if (str_contains($cesta, '..') || str_contains($cesta, "\0")) return $zakaz();

// priečinok údajov v koreni webu (vlastný .htaccess: Require all denied)
if (preg_match('#^/b30-udaje-[0-9a-f]{32}(/|$)#', $cesta)) return $zakaz();
// asistent/.htaccess
if (preg_match('#^/asistent(/.*)?$#', $cesta, $m)) {
  $r = ltrim($m[1] ?? '', '/');
  if (preg_match('#^(lib|data|znalosti|vendor|testy)(/|$)#', $r) || preg_match('#^(config\.php|config\.example\.php|composer\.(json|lock)|README\.md)$#', $r)
      || preg_match('#(^|/)\.(user\.ini|ht)#', $r) || preg_match('#\.(sqlite|sqlite-wal|sqlite-shm|sha256)$#', $r)) return $zakaz();
  if ($r === '') return $subor("$koren/asistent/index.html");
}
// vernost/.htaccess
if (preg_match('#^/vernost(/.*)?$#', $cesta, $m)) {
  $r = ltrim($m[1] ?? '', '/');
  if (preg_match('#^(lib|data|testy)(/|$)#', $r) || preg_match('#^(config\.php|config\.example\.php|README\.md)$#', $r)
      || preg_match('#(^|/)\.(user\.ini|ht)#', $r) || preg_match('#\.(sqlite|sqlite-wal|sqlite-shm|db)$#', $r)) return $zakaz();
  if ($r === '') return $subor("$koren/vernost/index.html");
  if (preg_match('#^api/?$#', $r)) return $spusti("$koren/vernost/api/index.php");
  if (preg_match('#^admin/?$#', $r)) return $subor("$koren/vernost/admin/index.html");
  if (preg_match('#^karta/?$#', $r)) return $subor("$koren/vernost/karta/index.html");
}
// sprava/.htaccess
if (preg_match('#^/sprava(/.*)?$#', $cesta, $m)) {
  $r = ltrim($m[1] ?? '', '/');
  if (preg_match('#^(jadro|obrazovky|semeno|testy)(/|$)#', $r) || preg_match('#(^|/)\.(user\.ini|ht)#', $r) || preg_match('#\.(sha256|sqlite|json|txt|md)$#', $r)) return $zakaz();
  if ($r === '') return $spusti("$koren/sprava/index.php");
  if (preg_match('#^upravy/?$#', $r)) return $subor("$koren/sprava/upravy/index.html");
}
$f = $koren . $cesta;
if (is_file($f)) return false;                                         // skutočný súbor: statický alebo PHP
if (is_dir($f)) {
  if (!str_ends_with($cesta, '/')) { header('Location: ' . $cesta . '/', true, 301); return true; }
  if (is_file("$f/index.html")) return $subor("$f/index.html");        // DirectoryIndex: index.html má prednosť
  if (is_file("$f/index.php")) return $spusti("$f/index.php");
  return $zakaz();
}
return $spusti("$koren/index.php");                                    // rezervačný systém (Laravel)
