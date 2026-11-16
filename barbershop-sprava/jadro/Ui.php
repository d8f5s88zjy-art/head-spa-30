<?php
// Vzhľad stránok správy: vykreslené na serveri, fungujú bez skriptu aj s vyplňovačom hesiel. Jedna obrazovka = jedna vec,
// veľké písmo a tlačidlá, tykanie ako na webe.
defined('B30S') || exit;

final class Ui
{
    public static function e($v): string { return htmlspecialchars(is_scalar($v) ? (string) $v : '', ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8'); }

    /** Adresa obrazovky správy; vždy s menom súboru alebo lomkou (presmerovanie priečinka bez lomky by išlo cez http). */
    public static function url(string $s = '', array $q = []): string
    {
        $q = $s === '' ? $q : ['s' => $s] + $q;
        return './' . ($q ? '?' . http_build_query($q) : '');
    }

    public static function presmeruj(string $s = '', array $q = [], ?string $sprava = null, string $druh = 'ok'): void
    {
        if ($sprava !== null) $_SESSION['sprava'] = [$druh, $sprava];
        header('Location: ' . Miesto::zaklad() . 'sprava/' . substr(self::url($s, $q), 2), true, 303);
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

    /** Formulár s jedným tlačidlom (úkon bez ďalších polí). */
    public static function tlacidlo(string $akcia, string $text, string $trieda = 'hlavne', array $polia = [], string $s = ''): string
    {
        $h = '';
        foreach ($polia as $k => $v) $h .= '<input type="hidden" name="' . self::e($k) . '" value="' . self::e($v) . '">';
        return '<form method="post" action="' . self::e(self::url($s)) . '" class="inline">' . self::csrf()
            . '<input type="hidden" name="a" value="' . self::e($akcia) . '">' . $h . '<button class="tl ' . $trieda . '" type="submit">' . self::e($text) . '</button></form>';
    }

    public static function stranka(string $titulok, string $obsah, string $spat = ''): void
    {
        Pristup::hlavicky();
        header('Content-Type: text/html; charset=utf-8');
        $v = substr(md5((string) @filemtime(dirname(__DIR__) . '/vzhlad/sprava.css')), 0, 8);
        $prihl = Pristup::ucet();
        $hore = '<header class="hore"><div class="in"><span class="znacka">Barbershop 30<em>správa</em></span><span class="sp"></span>'
              . ($prihl ? '<a class="lnk" href="../" target="_blank" rel="noopener">Web</a>' . self::tlacidlo('odhlasit', 'Odhlásiť', 'lnk') : '') . '</div></header>';
        echo '<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
           . '<meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#0e0d0c"><title>' . self::e($titulok) . ' · správa Barbershop 30</title>'
           . '<link rel="icon" href="../karta/ikony/barbershop-192.png"><link rel="stylesheet" href="vzhlad/sprava.css?v=' . $v . '"></head><body>'
           . $hore . '<main>' . ($spat !== '' && $prihl ? '<p class="spat"><a href="' . self::e(self::url($spat === 'domov' ? '' : $spat)) . '">‹ Späť</a></p>' : '')
           . '<h1>' . self::e($titulok) . '</h1>' . self::flash() . $obsah . '</main></body></html>';
        exit;
    }

    public static function chyba(string $text, int $kod = 400): void
    {
        http_response_code($kod);
        self::stranka('Niečo sa nepodarilo', '<p class="lead">' . self::e($text) . '</p><p><a class="tl hlavne" href="' . self::e(self::url()) . '">Späť na začiatok</a></p>');
    }

    public static function datumCas($t): string { $t = is_numeric($t) ? (int) $t : strtotime((string) $t); return $t ? date('j. n. Y H:i', $t) : ''; }

    /** Zoznam bodov kontroly hostingu. $podrobne = aj podrobnosti (len overenému kódom alebo prihlásenému). */
    public static function body(array $body, bool $podrobne): string
    {
        $h = '<ul class="body">';
        foreach ($body as $b) {
            if (!$podrobne && $b['stav'] === 'ok') continue;
            $znak = ['ok' => '✓', 'chyba' => '✕', 'upozornenie' => '!'][$b['stav']] ?? '?';
            $h .= '<li class="' . self::e($b['stav']) . '"><span class="znak" aria-hidden="true">' . $znak . '</span><div><b>' . self::e($b['nazov']) . '</b>'
                . ($b['stav'] === 'chyba' ? ' <span class="stit">treba opraviť</span>' : ($b['stav'] === 'upozornenie' ? ' <span class="stit var">upozornenie</span>' : ''))
                . '<p>' . self::e($b['detail']) . '</p></div></li>';
        }
        return $h . '</ul>';
    }
}
