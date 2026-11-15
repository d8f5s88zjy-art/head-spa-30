<?php
// Zmena telefónu alebo e-mailu: číslo je na webe na stovkách miest (lišta, päta, tlačidlá, údaje pre Google, texty
// katalógu, znalosti asistenta), často aj mimo označených oblastí. Správa preto pri zmene nahradí presné staré podoby
// (0905 622 223, 0905&nbsp;622&nbsp;223, +421905622223, …) novými vo všetkých verejných textových súboroch a v údajoch.
// Ten istý zoznam podôb má nastroje/kontakt.py, ktorý pri importe urobí to isté v repozitári (zdroje pre build.py).
defined('SPRAVA') || exit;

final class Kontakt
{
    const POLIA = ['mobil', 'pevna', 'email'];

    /** Podoby jedného údaja tak, ako sa vyskytujú na webe. */
    public static function podoby(string $pole, string $v): array
    {
        if ($pole === 'email') return [$v];
        $p = [$v, str_replace(' ', "\u{a0}", $v), str_replace(' ', '&nbsp;', $v)];
        $lomka = preg_replace('/^(\d+) /', '$1/', $v);
        if ($lomka !== $v) $p[] = $lomka;
        return $p;
    }

    /** Dvojice [staré, nové] pre zmenené údaje (najdlhšie najprv); tel. čísla aj v medzinárodnom tvare. */
    public static function pary(array $stara, array $nova): array
    {
        $pary = [];
        foreach (self::POLIA as $pole) {
            if (($stara[$pole] ?? '') === ($nova[$pole] ?? '') || ($stara[$pole] ?? '') === '') continue;
            $s = self::podoby($pole, $stara[$pole]); $n = self::podoby($pole, $nova[$pole]);
            foreach ($s as $i => $x) $pary[] = [$x, $n[min($i, count($n) - 1)]];
            if ($pole !== 'email') {
                $pary[] = [$stara[$pole . '_tel'], $nova[$pole . '_tel']];
                $pary[] = [ltrim($stara[$pole . '_tel'], '+'), ltrim($nova[$pole . '_tel'], '+')];
            }
        }
        usort($pary, fn($a, $b) => strlen($b[0]) <=> strlen($a[0]));
        return $pary;
    }

    public static function nahrad(string $t, array $pary): string
    {
        foreach ($pary as [$a, $b]) $t = str_replace($a, $b, $t);
        return $t;
    }

    /** Údaje: všetky texty (okrem samotných polí kontaktu, tie už sú nové) s nahradenými starými podobami. */
    public static function nahradVDatach(array $D, array $pary): array
    {
        array_walk_recursive($D, function (&$v) use ($pary) { if (is_string($v)) $v = self::nahrad($v, $pary); });
        return $D;
    }

    /** Verejné textové súbory webu (bez správy, údajov, zdrojov, nahrávok a PHP). */
    public static function subory(): array
    {
        $von = [];
        $koren = Nastavenie::w();
        $it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(new RecursiveDirectoryIterator($koren, FilesystemIterator::SKIP_DOTS),
            fn($f) => !($f->isDir() && (in_array($f->getFilename(), ['img', 'pdf', 'subory', 'zdroj', 'nasadenie', 'sprava', 'data', 'nastroje', '.git', 'vendor', 'testy', '__pycache__'], true)
                                       || str_starts_with($f->getFilename(), 'sprava-data')))));
        foreach ($it as $f) {
            if (!$f->isFile() || !preg_match('/\.(html|js|json|xml|txt|md|webmanifest)$/', $f->getFilename())) continue;
            $p = str_replace('\\', '/', substr($f->getPathname(), strlen($koren) + 1));
            if (str_starts_with($p, 'asistent/data/')) continue;
            $von[] = $p;
        }
        sort($von);
        return $von;
    }
}
