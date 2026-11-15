<?php
// Vzhľad obrazoviek správy: jedna obrazovka = jedna vec, veľké písmo a tlačidlá, vykanie, žiadne technické slová.
defined('SPRAVA') || exit;

final class Ui
{
    public static function e($v): string { return htmlspecialchars(is_scalar($v) ? (string)$v : '', ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8'); }

    public static function url(string $s = '', array $q = []): string
    {
        $q = $s === '' ? $q : ['s' => $s] + $q;
        return 'index.php' . ($q ? '?' . http_build_query($q) : '');
    }

    public static function presmeruj(string $s = '', array $q = [], ?string $sprava = null, string $druh = 'ok'): void
    {
        if ($sprava !== null) $_SESSION['sprava'] = [$druh, $sprava];
        header('Location: ' . self::url($s, $q), true, 303);
        exit;
    }

    public static function flash(): string
    {
        if (empty($_SESSION['sprava'])) return '';
        [$d, $t] = $_SESSION['sprava'];
        unset($_SESSION['sprava']);
        return '<div class="hlaska ' . ($d === 'ok' ? 'ok' : ($d === 'var' ? 'var' : 'chyba')) . '" role="' . ($d === 'chyba' ? 'alert' : 'status') . '">' . nl2br(self::e($t)) . '</div>';
    }

    public static function csrf(): string { return '<input type="hidden" name="_t" value="' . self::e(Pristup::csrf()) . '">'; }

    public static function tlacidlo(string $akcia, string $text, string $trieda = 'hlavne', array $polia = [], string $s = '', string $potvrdit = ''): string
    {
        $h = '';
        foreach ($polia as $k => $v) $h .= '<input type="hidden" name="' . self::e($k) . '" value="' . self::e($v) . '">';
        return '<form method="post" action="' . self::e(self::url($s)) . '" class="inline"' . ($potvrdit ? ' data-potvrdit="' . self::e($potvrdit) . '"' : '') . '>' . self::csrf()
            . '<input type="hidden" name="a" value="' . self::e($akcia) . '">' . $h . '<button class="tl ' . $trieda . '" type="submit">' . self::e($text) . '</button></form>';
    }

    /** Lišta stavu: všetko na webe / nezverejnená zmena. */
    public static function stav(): string
    {
        if (!Pristup::ucet()) return '';
        $k = Zmena::koncept();
        if (!$k) return '<div class="stav ok">Všetko je na webe ✓</div>';
        return '<a class="stav cak" href="' . self::e(self::url('nahlad')) . '">Nezverejnené: ' . self::e(implode(', ', $k['popis'])) . ' – Pozrieť a zverejniť</a>';
    }

    public static function stranka(string $titulok, string $obsah, string $spat = 'domov', bool $prihlaseny = true, array $spatQ = []): void
    {
        Pristup::hlavicky();
        header('Content-Type: text/html; charset=utf-8');
        $v = self::verziaAssetov();
        $hore = $prihlaseny && Pristup::ucet()
            ? '<header class="hore"><a class="spat" href="' . self::e(self::url($spat === 'domov' ? '' : $spat, $spatQ)) . '"' . ($titulok === 'Správa webu' ? ' hidden' : '') . '>‹ Späť</a><span class="meno">Správa webu</span>'
              . self::tlacidlo('odhlasit', 'Odhlásiť', 'maly', [], '', '') . '</header>' . self::stav()
            : '<header class="hore"><span class="meno">Správa webu Stavebniny Richtárik</span></header>';
        echo '<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
           . '<meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#1c1a1b"><title>' . self::e($titulok) . ' – správa webu</title>'
           . '<link rel="manifest" href="assets/manifest.webmanifest"><link rel="icon" href="assets/ikona-192.png">'
           . '<link rel="stylesheet" href="assets/sprava.css?v=' . $v . '"><script src="assets/sprava.js?v=' . $v . '" defer></script></head><body>'
           . $hore . '<main id="obsah"><h1>' . self::e($titulok) . '</h1>' . self::flash() . $obsah . '</main></body></html>';
        exit;
    }

    private static function verziaAssetov(): string
    {
        return substr(md5((string)@filemtime(dirname(__DIR__) . '/assets/sprava.css') . (string)@filemtime(dirname(__DIR__) . '/assets/sprava.js')), 0, 8);
    }

    public static function chyba(string $text, int $kod = 400): void
    {
        http_response_code($kod);
        self::stranka('Niečo sa nepodarilo', '<p class="vela">' . self::e($text) . '</p><p><a class="tl hlavne" href="' . self::e(self::url()) . '">Späť na začiatok</a></p>', 'domov', false);
    }

    /** Skloňovanie podľa počtu: pocet(2, '%d stránka', '%d stránky', '%d stránok'). */
    public static function pocet(int $n, string $jeden, string $dva, string $vela): string
    {
        return sprintf($n === 1 ? $jeden : ($n >= 2 && $n <= 4 ? $dva : $vela), $n);
    }

    /** D4: zapamätané zariadenie zrozumiteľne („iPhone – Safari“), nie surový reťazec prehliadača. */
    public static function zariadenie(string $ua): string
    {
        if ($ua === '') return 'Zariadenie';
        $s = preg_match('/iPhone/', $ua) ? 'iPhone' : (preg_match('/iPad/', $ua) ? 'iPad' : (preg_match('/Android/', $ua) ? (preg_match('/Mobile/', $ua) ? 'Telefón Android' : 'Tablet Android')
           : (preg_match('/Windows/', $ua) ? 'Počítač Windows' : (preg_match('/Macintosh|Mac OS X/', $ua) ? 'Počítač Mac' : (preg_match('/Linux|CrOS/', $ua) ? 'Počítač' : 'Zariadenie')))));
        $p = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/SamsungBrowser/', $ua) ? 'Samsung Internet' : (preg_match('/OPR\/|Opera/', $ua) ? 'Opera'
           : (preg_match('/Firefox|FxiOS/', $ua) ? 'Firefox' : (preg_match('/Chrome|CriOS/', $ua) ? 'Chrome' : (preg_match('/Safari/', $ua) ? 'Safari' : '')))));
        return $p !== '' ? "$s – $p" : $s;
    }

    public static function datumCas(int $t): string { return date('j. n. Y H:i', $t); }
}
