<?php
// Pevná tabuľka súborov, s ktorými správa pracuje: cesta v tvare repozitára → verejné miesto na webe → pravidlo obsahu.
// Nič mimo nej sa nedá čítať ani zapísať; cesta sa nikdy neskladá zo vstupu, vstup sa len hľadá v tabuľke (presná zhoda).
//
// Pravidlo kódu: súbor .js alebo .php sa smie od verzie na webe líšiť len v čísliciach a v e‑mailovej adrese (telefón
// a hodiny – to jediné, čo admin v kóde mení). Cez správu sa tak na server nedostane program, ani keby niekto získal
// prihlásenie.
defined('B30S') || exit;

final class Mapa
{
    const P = 'barbershop-30/';
    const JAZYKY = ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
    const EMAIL = '[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63}){1,4}';

    /** Zdrojová cesta => [verejná cesta alebo null (len zdroj, prípadne verejné zo zostavenia), pravidlo]. */
    public static function tabulka(): array
    {
        static $t = null;
        if ($t !== null) return $t;
        $p = self::P;
        $t = [
            $p . 'index.html' => [null, 'stranka'],                 // verejné: index.html a en/index.html zo zostavenia
            $p . 'rezervacia.html' => [null, 'html'],               // len zdroj a export (na doméne sa nezverejňuje)
            $p . '404.html' => [null, 'citanie'],
            $p . 'robots.txt' => [null, 'citanie'],
            $p . 'sitemap.xml' => [null, 'citanie'],                // verejné: sitemap.xml zo zostavenia (lastmod)
            $p . 'karta/index.html' => [null, 'html'],              // verejné: karta/index.html zo zostavenia
            'asistent/znalosti/barbershop.md' => ['asistent/znalosti/barbershop.md', 'text'],
            'asistent/znalosti/barbershop-otazky.json' => ['asistent/znalosti/barbershop-otazky.json', 'json'],
            $p . 'assets/asistent-otazky.json' => ['assets/asistent-otazky.json', 'json'],
            $p . 'assets/asistent-otazky-kmene.json' => ['assets/asistent-otazky-kmene.json', 'json'],
            $p . 'assets/barbershop30.vcf' => ['assets/barbershop30.vcf', 'text'],
            'asistent/ochrana-udajov.html' => ['asistent/ochrana-udajov.html', 'html'],
            $p . 'source/domena/vernost-ochrana-udajov.html' => ['vernost/ochrana-udajov.html', 'html'],
            'vernost/ochrana-udajov.html' => [null, 'html'],        // znenie pre HEAD SPA 30, len zdroj a export
            $p . 'assets/app.js' => ['assets/app.js', 'kod'],
            $p . 'assets/asistent.js' => ['assets/asistent.js', 'kod'],
            $p . 'assets/objednavka.js' => ['assets/objednavka.js', 'kod'],
            $p . 'assets/asistent-ukazka.js' => ['assets/asistent-ukazka.js', 'kod'],
            $p . 'assets/karty.js' => ['assets/karty.js', 'kod'],
            $p . 'karta/karta.js' => ['karta/karta.js', 'kod'],
            'vernost/karta/karta.js' => ['vernost/karta/karta.js', 'kod'],
            'asistent/lib/jadro.php' => ['asistent/lib/jadro.php', 'kod'],
            'asistent/api.php' => ['asistent/api.php', 'kod'],
            'vernost/lib/jadro.php' => ['vernost/lib/jadro.php', 'kod'],
        ];
        foreach (self::JAZYKY as $j) $t[$p . "assets/i18n/$j.json"] = ["assets/i18n/$j.json", 'json'];
        return $t;
    }

    /** Verejné súbory, ktoré posiela zostavenie v prehliadači (admin/zostav.js) => pravidlo. */
    const ZOSTAVENE = ['index.html' => 'verejna-sk', 'en/index.html' => 'verejna-en', 'sitemap.xml' => 'sitemap', 'karta/index.html' => 'karta'];

    /** Cesta zo vstupu vyzerá ako cesta (bez „..“, bez NUL, relatívna, primeraná dĺžka). Tabuľka aj tak rozhoduje sama. */
    public static function cestaOk($c): bool
    {
        return is_string($c) && $c !== '' && strlen($c) <= 200 && !str_contains($c, "\0") && !str_contains($c, '..') && !str_contains($c, '\\')
            && $c[0] !== '/' && !preg_match('#(^|/)\.#', $c) && preg_match('#^[A-Za-z0-9._/-]+$#', $c);
    }

    public static function zdroj(string $c): ?array { return self::cestaOk($c) ? (self::tabulka()[$c] ?? null) : null; }

    /** Nová fotka: barbershop-30/assets/img/<meno>-<šírka>.(webp|jpg) → verejná cesta, inak null. */
    public static function fotka($c): ?string
    {
        if (!self::cestaOk($c)) return null;
        return preg_match('#^barbershop-30/(assets/img/[a-z0-9][a-z0-9-]{0,80}-\d{3,4}\.(?:webp|jpg))$#', $c, $m) ? $m[1] : null;
    }

    private static function text(string $s, int $najviac): ?string
    {
        if ($s === '') return 'súbor je prázdny';
        if (strlen($s) > $najviac) return 'súbor je príliš veľký';
        if (str_contains($s, "\0") || !mb_check_encoding($s, 'UTF-8')) return 'súbor nie je text v UTF-8';
        return null;
    }

    /** Pravidlo obsahu zdrojového súboru. $naWebe = dnešný verejný súbor (pre pravidlo kódu). Null = v poriadku. */
    public static function kontrola(string $cesta, string $obsah, ?string $naWebe = null): ?string
    {
        $z = self::zdroj($cesta);
        if ($z === null) return 'cesta nie je v zozname súborov webu';
        switch ($z[1]) {
            case 'citanie': return 'tento súbor správa nemení';
            case 'stranka':
                if ($e = self::text($obsah, 400000)) return $e;
                if (strlen($obsah) < 20000) return 'stránka je podozrivo krátka';
                if (str_contains($obsah, '<?')) return 'stránka obsahuje značku programu';
                if (!str_contains($obsah, '<html lang="sk" data-motion="on"')) return 'stránka nemá očakávanú hlavičku';
                return null;
            case 'html':
                if ($e = self::text($obsah, 400000)) return $e;
                return str_contains($obsah, '<?') ? 'stránka obsahuje značku programu' : null;
            case 'json':
                if ($e = self::text($obsah, 3000000)) return $e;
                json_decode($obsah);
                return json_last_error() === JSON_ERROR_NONE ? null : 'súbor nie je platný JSON';
            case 'text':
                if ($e = self::text($obsah, 1000000)) return $e;
                return str_contains($obsah, '<?') ? 'text obsahuje značku programu' : null;
            case 'kod':
                if ($e = self::text($obsah, 1000000)) return $e;
                if ($naWebe === null) return 'súbor s kódom na webe chýba, nedá sa porovnať';
                return self::kodOk($naWebe, $obsah, str_ends_with($cesta, '.php')) ? null : 'v súbore s kódom sa smú meniť len číslice a e‑mail (telefón, hodiny)' . (str_ends_with($cesta, '.php') ? ', v PHP len v textoch' : '');
        }
        return 'neznáme pravidlo';
    }

    /** Pravidlo verejného súboru zo zostavenia. */
    public static function kontrolaVerejna(string $cesta, string $obsah): ?string
    {
        $pr = self::ZOSTAVENE[$cesta] ?? null;
        if ($pr === null) return 'tento verejný súbor zostavenie neposiela';
        $zaklad = rtrim((string) Miesto::ciel()['zaklad'], '/') . '/';
        if ($pr === 'sitemap') {
            if ($e = self::text($obsah, 100000)) return $e;
            if (!str_starts_with($obsah, '<?xml version="1.0"') || substr_count($obsah, '<?') !== 1 || !str_contains($obsah, '<urlset')) return 'sitemap.xml nemá očakávaný tvar';
            return str_contains($obsah, '<loc>' . $zaklad) ? null : 'sitemap.xml nemá adresu domény';
        }
        if ($pr === 'karta') {
            if ($e = self::text($obsah, 100000)) return $e;
            if (str_contains($obsah, '<?')) return 'stránka obsahuje značku programu';
            return str_contains($obsah, 'data-api="' . Miesto::ciel()['vernost'] . '"') ? null : 'stránka kartičky nemá adresu servera kartičiek';
        }
        if ($e = self::text($obsah, 400000)) return $e;
        if (strlen($obsah) < 20000) return 'stránka je podozrivo krátka';
        if (str_contains($obsah, '<?')) return 'stránka obsahuje značku programu';
        $kan = '<link rel="canonical" href="' . $zaklad . ($pr === 'verejna-en' ? 'en/' : '') . '"';
        if (!str_contains($obsah, $kan)) return 'stránka nemá kanonickú adresu domény';
        return Prepinace::hlavaOk($obsah, $pr === 'verejna-en') ? null : 'stránka nemá očakávanú hlavičku a značku skriptu kartičky';
    }

    /** Text bez samostatných čísel a e‑mailov (zástupky) – dva súbory s kódom sa smú líšiť len v nich. Číslice prilepené
     *  k písmenu, podčiarkovníku, znaku $ alebo spätnej lomke (sha256, base64, \x41, $a1) sa nemenia: tie nie sú telefón
     *  ani hodiny, ale mená a zápisy znakov v programe. */
    public static function kostra(string $s): string
    {
        $s = (string) preg_replace('/(?<![A-Za-z0-9._%+-])' . self::EMAIL . '(?![A-Za-z0-9-])/', '@E@', $s);
        return (string) preg_replace('/(?<![A-Za-z0-9_$\\\\])\d+(?![A-Za-z_])/', '0', $s);
    }

    /** PHP na serveri (D-3): číslice a e‑mail sa smú meniť len v textoch a komentároch (telefón, hodiny v reťazcoch),
     *  nie v číselných hodnotách programu – tie sú limity a stropy asistenta (okná limitov, max_tokens, počet kôl). */
    public static function kostraPhp(string $s): string
    {
        $out = '';
        foreach (token_get_all($s) as $t) {
            if (!is_array($t)) { $out .= $t; continue; }
            $out .= in_array($t[0], [T_CONSTANT_ENCAPSED_STRING, T_ENCAPSED_AND_WHITESPACE, T_COMMENT, T_DOC_COMMENT, T_INLINE_HTML], true) ? self::kostra($t[1]) : $t[1];
        }
        return $out;
    }

    public static function kodOk(string $stary, string $novy, bool $php = false): bool
    {
        return $php ? hash_equals(sha1(self::kostraPhp($stary)), sha1(self::kostraPhp($novy)))
                    : hash_equals(sha1(self::kostra($stary)), sha1(self::kostra($novy)));
    }
}
