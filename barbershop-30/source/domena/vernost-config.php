<?php
/* Zástupka konfigurácie v plnom balíku pre www.barbershop30.sk: žiadne údaje tu nie sú. Heslo recepcie nastavuje
 * majiteľ v správe (sprava/), ktorá drží jeho odtlačok aj databázu kartičiek v priečinku údajov mimo webu. */
if (!defined('VERNOST')) { http_response_code(404); exit; }
return require __DIR__ . '/../sprava/jadro/pre-vernost.php';
