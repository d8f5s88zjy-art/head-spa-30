<?php
// Konfigurácia pre asistenta a voľné termíny (asistent/config.php v balíku je len zástupka, ktorá načíta tento súbor).
// Kľúč API číta z priečinka údajov správy; bez kľúča, bez súhlasu alebo bez priečinka údajov je asistent vypnutý
// (kluc je prázdny). Kód v asistent/ sa kvôli tomu nemení.
if (!defined('ASISTENT')) { http_response_code(403); exit; }
defined('B30S') || define('B30S', 1);
require_once __DIR__ . '/autoload.php';
return (function (): array {
    try {
        if (!Miesto::init(false)) return ['kluc' => ''];     // správa ešte nebola otvorená: nič sa nezakladá, všetko vypnuté
        return Nastavenia::preAsistenta();
    } catch (Throwable $e) { return ['kluc' => '']; }
})();
