<?php
// Správa webu Barbershop 30 na vlastnej doméne – vstup stránok správy (prvé nastavenie, prihlásenie, nastavenia).
// Tento súbor je zámerne napísaný tak, aby ho preložilo aj staršie PHP 5.6 a 7.x; pri staršej verzii ukáže
// zrozumiteľnú stránku namiesto chyby 500. Moderný kód sa načíta až za bránou (jadro/spustenie.php).
if (!defined('PHP_VERSION_ID') || PHP_VERSION_ID < 80200) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');
    if (function_exists('http_response_code')) { http_response_code(503); }
    echo '<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Správa webu Barbershop 30</title>'
       . '<link rel="stylesheet" href="vzhlad/sprava.css"></head><body><main><h1>Hosting má staršiu verziu PHP</h1>'
       . '<p class="lead">Správa webu, asistent Barber a voľné termíny potrebujú PHP 8.2 alebo novšie (odporúčame 8.3). Web sám funguje ďalej.</p>'
       . '<p class="lead">Verzia PHP sa nastavuje v zákazníckom účte hostingu pre celú doménu. <b>Neprepínaj ju bez dohody so správcom rezervačného systému</b>, beží na tej istej doméne. Keď bude verzia zmenená, otvor túto stránku znova.</p>'
       . '</main></body></html>';
    exit;
}
define('B30S', 1);
require dirname(__FILE__) . '/jadro/spustenie.php';
