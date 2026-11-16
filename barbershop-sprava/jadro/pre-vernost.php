<?php
// Konfigurácia pre vernostnú kartičku (vernost/config.php v balíku je len zástupka, ktorá načíta tento súbor).
// Odtlačok hesla recepcie a databáza sú v priečinku údajov správy; na tejto doméne žije len prevádzka Barbershop 30
// a verejné zápisy sa otvoria až po nastavení hesla recepcie.
if (!defined('VERNOST')) { http_response_code(404); exit; }
defined('B30S') || define('B30S', 1);
require_once __DIR__ . '/autoload.php';
return (function (): array {
    $vypnute = ['hesla' => [], 'len' => ['barbershop'], 'spustene' => false];
    try {
        if (!Miesto::init(true)) return $vypnute;
        return Nastavenia::preVernost();
    } catch (Throwable $e) { return $vypnute; }
})();
