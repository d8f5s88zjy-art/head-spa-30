<?php
// Načítanie tried správy z priečinka jadro/ (bez Composera).
defined('SPRAVA') || exit;
spl_autoload_register(function ($trieda) {
    if (preg_match('/^[A-Z][A-Za-z]+$/', $trieda) && is_file(__DIR__ . '/' . $trieda . '.php')) require __DIR__ . '/' . $trieda . '.php';
});
