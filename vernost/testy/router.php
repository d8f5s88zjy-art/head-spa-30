<?php
/* Router pre lokálny test (php -S): napodobní pravidlá z vernost/.htaccess, ktoré na hostingu robí Apache. */
$cesta = (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/vernost/(lib|data|testy)(/|$)#', $cesta) || preg_match('#^/vernost/(config\.php|config\.example\.php|README\.md)$#', $cesta) || preg_match('#\.(sqlite|db)$#', $cesta)) {
  http_response_code(403); echo 'Zakázané'; return true;
}
if (preg_match('#^/vernost/api/?$#', $cesta)) { require __DIR__ . '/../api/index.php'; return true; }
return false;
