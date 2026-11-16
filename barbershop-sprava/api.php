<?php
// Správa webu Barbershop 30 – koncový bod ukladania pre admin (sprava/upravy/). Len JSON, len s reláciou správy,
// hlavičkou X-B30-CSRF a vlastným pôvodom. Brána verzie PHP je napísaná tak, aby ju preložilo aj staršie PHP.
if (!defined('PHP_VERSION_ID') || PHP_VERSION_ID < 80200) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    if (function_exists('http_response_code')) { http_response_code(503); }
    echo '{"ok":false,"chyba":"Hosting má staršiu verziu PHP. Správa potrebuje PHP 8.2 alebo novšie."}';
    exit;
}
define('B30S', 1);
require dirname(__FILE__) . '/jadro/api.php';
