<?php
// Bezpečný zápis súborov: zápis do dočasného súboru vedľa cieľa a premenovanie (atómové), zámok, a súbory údajov
// v tvare „hlavička PHP s príkazom exit“ + JSON: pri priamej požiadavke z webu nič nevypíšu, ani keby ochrana priečinka zlyhala.
// Žiadna cesta sa neskladá zo vstupu – volajúci dáva len cesty z Miesto a z pevnej tabuľky Mapa.
defined('B30S') || exit;

final class Ulozisko
{
    const HLAVA = "<?php exit; ?>\n";
    /** Testovacia injekcia: zlyhanie premenovania pri N-tom cieli (testy/jednotky.php). */
    public static int $zlyhajPri = 0;
    private static int $pocitadlo = 0;

    /** Súbor údajov (tajne.php, ucty.php, pristup.php, nastavenie.php). */
    public static function citaj(string $cesta, $predvolene = [])
    {
        if (!is_file($cesta)) return $predvolene;
        $s = @file_get_contents($cesta);
        if ($s === false || !str_starts_with($s, self::HLAVA)) return $predvolene;
        $d = json_decode(substr($s, strlen(self::HLAVA)), true);
        return is_array($d) ? $d : $predvolene;
    }

    public static function zapisUdaje(string $cesta, array $data): void
    {
        self::zapis($cesta, self::HLAVA . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
        @chmod($cesta, 0600);
    }

    /** Úprava súboru údajov pod zámkom: $f dostane dáta a vráti nové. */
    public static function uprav(string $cesta, callable $f): array
    {
        $z = self::zamok($cesta . '.zamok', true);
        try { $d = $f(self::citaj($cesta, [])); self::zapisUdaje($cesta, $d); return $d; }
        finally { self::odomkni($z); }
    }

    /** Atómový zápis: <cieľ>.tmp-<náhodné> → rename. */
    public static function zapis(string $cesta, string $obsah): void
    {
        $dir = dirname($cesta);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) throw new RuntimeException('Nedá sa vytvoriť priečinok.');
        $tmp = $cesta . '.tmp-' . bin2hex(random_bytes(6));
        if (@file_put_contents($tmp, $obsah, LOCK_EX) !== strlen($obsah)) { @unlink($tmp); throw new RuntimeException('Zápis súboru zlyhal.'); }
        if (is_file($cesta)) @chmod($tmp, fileperms($cesta) & 0777);
        self::premenuj($tmp, $cesta);
        if (str_ends_with($cesta, '.php') && function_exists('opcache_invalidate')) @opcache_invalidate($cesta, true);
    }

    public static function premenuj(string $z, string $na): void
    {
        self::$pocitadlo++;
        if (self::$zlyhajPri > 0 && self::$pocitadlo === self::$zlyhajPri) { @unlink($z); throw new RuntimeException('Testovacie zlyhanie premenovania.'); }
        for ($i = 0; $i < 5; $i++) { if (@rename($z, $na)) return; usleep(200000); }
        @unlink($z);
        throw new RuntimeException('Súbor sa nedal nahradiť.');
    }

    public static function resetPocitadla(): void { self::$pocitadlo = 0; }

    /** Zámok (flock); vráti handle alebo null. S $cakaj čaká najviac $sekund. */
    public static function zamok(string $cesta, bool $cakaj = false, int $sekund = 10)
    {
        $h = @fopen($cesta, 'c');
        if (!$h) return null;
        $do = microtime(true) + ($cakaj ? $sekund : 0);
        do { if (flock($h, LOCK_EX | LOCK_NB)) return $h; if (!$cakaj) break; usleep(50000); } while (microtime(true) < $do);
        fclose($h);
        return null;
    }

    public static function odomkni($h): void { if ($h) { flock($h, LOCK_UN); fclose($h); } }

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

    /** Všetky súbory stromu (relatívne cesty). */
    public static function subory(string $dir): array
    {
        $von = [];
        if (!is_dir($dir)) return $von;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) if ($f->isFile()) $von[] = str_replace('\\', '/', substr($f->getPathname(), strlen($dir) + 1));
        sort($von);
        return $von;
    }
}
