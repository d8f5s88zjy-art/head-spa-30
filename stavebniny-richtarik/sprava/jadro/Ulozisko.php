<?php
// Bezpečný zápis súborov: JSON pod zámkom, zápis do dočasného súboru vedľa cieľa a premenovanie (atómové na Linuxe,
// na Windows s opakovaním). Žiadna cesta sa neskladá zo vstupu – volajúci dáva len cesty z Nastavenie.
defined('SPRAVA') || exit;

final class Ulozisko
{
    /** Testovacia injekcia: zlyhanie premenovania pri N-tom cieli (sprava/testy). */
    public static int $zlyhajPri = 0;
    private static int $pocitadlo = 0;

    public static function citajJson(string $cesta, $predvolene = null)
    {
        if (!is_file($cesta)) return $predvolene;
        $s = @file_get_contents($cesta);
        if ($s === false || $s === '') return $predvolene;
        $d = json_decode($s, true, 512);
        return json_last_error() === JSON_ERROR_NONE ? $d : $predvolene;
    }

    public static function zapisJson(string $cesta, $data, bool $pekne = true): void
    {
        $f = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR;
        self::zapis($cesta, json_encode($data, $pekne ? $f | JSON_PRETTY_PRINT : $f) . "\n");
    }

    /** Atómový zápis: <cieľ>.tmp-<náhodné> → rename. */
    public static function zapis(string $cesta, string $obsah): void
    {
        $dir = dirname($cesta);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) throw new RuntimeException('Nedá sa vytvoriť priečinok.');
        $tmp = $cesta . '.tmp-' . bin2hex(random_bytes(6));
        if (@file_put_contents($tmp, $obsah, LOCK_EX) !== strlen($obsah)) { @unlink($tmp); throw new RuntimeException('Zápis súboru zlyhal.'); }
        if ($dir === Nastavenie::$data) @chmod($tmp, 0600);   // súbory priamo v priečinku údajov (účet, tajomstvo) číta len PHP
        self::premenuj($tmp, $cesta);
    }

    /** rename s opakovaním (Windows: cieľ môže byť chvíľu zamknutý). */
    public static function premenuj(string $z, string $na): void
    {
        self::$pocitadlo++;
        if (self::$zlyhajPri > 0 && self::$pocitadlo === self::$zlyhajPri) { @unlink($z); throw new RuntimeException('Testovacie zlyhanie premenovania.'); }
        for ($i = 0; $i < 5; $i++) {
            if (@rename($z, $na)) return;
            usleep(200000);
        }
        @unlink($z);
        throw new RuntimeException('Súbor sa nedal nahradiť.');
    }

    public static function resetPocitadla(): void { self::$pocitadlo = 0; }

    /** Zámok (flock na súbore); vráti handle alebo null, ak je zamknuté. */
    public static function zamok(string $cesta, bool $cakaj = false)
    {
        $h = @fopen($cesta, 'c');
        if (!$h) return null;
        if (!flock($h, LOCK_EX | ($cakaj ? 0 : LOCK_NB))) { fclose($h); return null; }
        return $h;
    }

    public static function odomkni($h): void
    {
        if ($h) { flock($h, LOCK_UN); fclose($h); }
    }

    /** Úprava JSON pod zámkom: $f dostane dáta a vráti nové. */
    public static function upravJson(string $cesta, callable $f, $predvolene = [])
    {
        $z = self::zamok($cesta . '.zamok', true);
        try {
            $d = $f(self::citajJson($cesta, $predvolene));
            self::zapisJson($cesta, $d);
            return $d;
        } finally { self::odomkni($z); }
    }

    public static function zmazStrom(string $dir): void
    {
        if (!is_dir($dir) || is_link($dir)) { if (is_file($dir) || is_link($dir)) @unlink($dir); return; }
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $p = $dir . '/' . $f;
            if (is_dir($p) && !is_link($p)) self::zmazStrom($p); else @unlink($p);
        }
        @rmdir($dir);
    }

    public static function velkostStromu(string $dir): int
    {
        $n = 0;
        if (!is_dir($dir)) return 0;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) if ($f->isFile()) $n += $f->getSize();
        return $n;
    }
}
