<?php
// Denník (údaje/dennik/dennik.jsonl): prihlásenia, zlé pokusy, kódy, uloženia a zmeny nastavenia. Bez hesiel, kódov,
// kľúča API a obsahu formulárov; adresa IP len ako odtlačok. Najviac 2 MB, potom sa skráti na novšiu polovicu.
defined('B30S') || exit;

final class Dennik
{
    const NAJVIAC = 2097152;

    public static function zapis(string $ukon, array $podrobnosti = []): void
    {
        if (Miesto::$udaje === '') return;
        $r = ['cas' => date('c'), 'kto' => $_SESSION['ucet'] ?? '', 'ukon' => $ukon] + $podrobnosti;
        $r['ip'] = Pristup::odtlacokIp();
        $f = Miesto::u('dennik/dennik.jsonl');
        @file_put_contents($f, json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
        if (@filesize($f) > self::NAJVIAC) self::skrat();
    }

    public static function posledne(int $n = 50, ?array $ukony = null): array
    {
        $f = Miesto::u('dennik/dennik.jsonl');
        if (!is_file($f)) return [];
        $r = array_values(array_filter(array_map(fn($x) => json_decode($x, true), file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES))));
        if ($ukony !== null) $r = array_values(array_filter($r, fn($x) => in_array($x['ukon'] ?? '', $ukony, true)));
        return array_reverse(array_slice($r, -$n));
    }

    public static function skrat(): void
    {
        $f = Miesto::u('dennik/dennik.jsonl');
        $r = @file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        Ulozisko::zapis($f, implode("\n", array_slice($r, (int) (count($r) / 2))) . "\n");
    }

    /** Chyba pre programátora (podrobnosti len do súboru, majiteľ vidí všeobecnú vetu). */
    public static function chyba(Throwable $e): void
    {
        if (Miesto::$udaje === '') return;
        @file_put_contents(Miesto::u('dennik/chyby.log'), date('c') . ' ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() . "\n", FILE_APPEND | LOCK_EX);
    }
}
