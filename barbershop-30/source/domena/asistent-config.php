<?php
/* Zástupka konfigurácie v plnom balíku pre www.barbershop30.sk: žiadne údaje tu nie sú. Kľúč API a nastavenie zadáva
 * majiteľ v správe (sprava/), ktorá ich drží v priečinku údajov mimo webu. */
if (!defined('ASISTENT')) { http_response_code(403); exit; }
return require __DIR__ . '/../sprava/jadro/pre-asistenta.php';
