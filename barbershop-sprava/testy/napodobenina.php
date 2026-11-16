<?php
/* Napodobenina koreňa domény www.barbershop30.sk pre testy: rezervačný systém (Laravel) tak, ako ho vidno zvonku –
 * index.php (stránka /rezervacia s komponentom v-order-component a tokenom, /rezervacia/ajax, /admin → /admin/login,
 * /login), vlastný .htaccess a priečinky css, js, images, fonts, storage, vendor. Rozhranie /rezervacia/ajax je falošný
 * rezervačný systém z testov asistenta (asistent/testy/mock-rezervacie.php). Testy overia, že po nahratí balíka a po
 * práci správy sa nič z toho nezmenilo.
 *   php napodobenina.php <cieľový priečinok> <cesta k asistent/testy/mock-rezervacie.php> */
[$ja, $ciel, $mock] = $argv + [null, null, null];
if (!$ciel || !is_file((string) $mock)) { fwrite(STDERR, "použitie: php napodobenina.php <cieľ> <mock-rezervacie.php>\n"); exit(2); }
foreach (['css', 'js', 'images', 'fonts', 'storage/app', 'vendor', 'admin-nie-je'] as $p) if ($p !== 'admin-nie-je') @mkdir("$ciel/$p", 0755, true);
copy($mock, "$ciel/storage/app/rezervacny-system.php");
file_put_contents("$ciel/index.php", <<<'PHP'
<?php
/* NAPODOBENINA rezervačného systému (Laravel) pre testy. */
$cesta = rtrim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$post = $_SERVER['REQUEST_METHOD'] === 'POST';
if ($cesta === '/rezervacia/ajax') {
  if (!$post) { http_response_code(405); echo 'Method Not Allowed'; return; }
  require __DIR__ . '/storage/app/rezervacny-system.php'; return;
}
if ($post) { file_put_contents((string) getenv('MOCK_LOG'), json_encode(['metoda' => 'POST ' . $cesta]) . "\n", FILE_APPEND); http_response_code(419); echo 'Page Expired'; return; }
if ($cesta === '/rezervacia') {
  header('Set-Cookie: laravel_session=sedenie42; path=/; httponly');
  echo '<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8"><meta name="csrf-token" content="token-abc"><link href="/css/app.css" rel="stylesheet"></head><body><div id="app"><v-order-component></v-order-component></div><script src="/js/app.js"></script></body></html>';
  return;
}
if ($cesta === '/admin') { header('Location: /admin/login', true, 302); return; }
if ($cesta === '/admin/login' || $cesta === '/login') { echo '<!DOCTYPE html><title>Prihlásenie – rezervačný systém</title><form method="post"><input name="email"><input name="password" type="password"></form>'; return; }
if ($cesta === '') { echo '<!DOCTYPE html><title>Starý web (index.php)</title><h1>Barbershop 30 – starý web</h1>'; return; }
http_response_code(404); echo '<!DOCTYPE html><title>404</title>Not Found';
PHP);
file_put_contents("$ciel/.htaccess", "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteCond %{REQUEST_FILENAME} !-d\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteRule ^ index.php [L]\n</IfModule>\n");
file_put_contents("$ciel/css/app.css", "/* rezervačný systém */ body{font-family:sans-serif}\n");
file_put_contents("$ciel/js/app.js", "/* rezervačný systém */ console.log('rezervacia');\n");
file_put_contents("$ciel/images/logo.png", "PNG-napodobenina\n");
file_put_contents("$ciel/fonts/pismo.woff", "WOFF-napodobenina\n");
file_put_contents("$ciel/storage/app/udaje.txt", "údaje rezervačného systému\n");
file_put_contents("$ciel/vendor/autoload.php", "<?php // knižnice rezervačného systému\n");
echo "napodobenina: $ciel\n";
