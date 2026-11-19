<?php
// Záznam zmien a prihlásení (sprava-data/dennik.jsonl): čas, kto, úkon, podrobnosti, odtlačok IP. Bez hesiel, kódov
// a obsahu formulárov. Pri prihlásení sa skracuje na 180 dní.
defined('SPRAVA') || exit;

final class Dennik
{
    public static function zapis(string $ukon, array $podrobnosti = []): void
    {
        if (Nastavenie::$data === '') return;
        $r = ['cas' => date('c'), 'kto' => $_SESSION['ucet'] ?? '', 'ukon' => $ukon] + $podrobnosti;
        $r['ip'] = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . (Ulozisko::citajJson(Nastavenie::d('nastavenie.json'), [])['tajomstvo'] ?? '')), 0, 12);
        $f = Nastavenie::d('dennik.jsonl'); $novy = !is_file($f);
        @file_put_contents($f, json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
        if ($novy || (@fileperms($f) & 0077)) @chmod($f, 0600);   // záznam číta len PHP (priečinok údajov môže mať 0705, Nastavenie::init)
    }

    public static function posledne(int $n = 50): array
    {
        $f = Nastavenie::d('dennik.jsonl');
        if (!is_file($f)) return [];
        $r = array_slice(file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), -$n);
        return array_reverse(array_values(array_filter(array_map(fn($x) => json_decode($x, true), $r))));
    }

    public static function skrat(): void
    {
        $f = Nastavenie::d('dennik.jsonl');
        if (!is_file($f) || filesize($f) < 200000) return;
        $hranica = date('c', time() - 180 * 86400);
        $r = array_filter(file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), fn($x) => (json_decode($x, true)['cas'] ?? '') >= $hranica);
        Ulozisko::zapis($f, implode("\n", $r) . "\n");
    }

    /** Chyba pre logy (podrobnosti len do súboru, Mário vidí všeobecnú vetu). */
    public static function chyba(Throwable $e): void
    {
        if (Nastavenie::$data === '') return;
        @file_put_contents(Nastavenie::d('log/chyby.log'), date('c') . ' ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() . "\n", FILE_APPEND | LOCK_EX);
    }
}
