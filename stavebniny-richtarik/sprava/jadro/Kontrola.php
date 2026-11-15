<?php
// Kontroly vstupov a výstupu pred zverejnením. Každá chyba je jedna veta pre Mária; s chybou sa nič nezverejní.
defined('SPRAVA') || exit;

final class Kontrola
{
    // ---------- vstupy ----------
    /** Čistý jednoriadkový text: NFC, bez riadiacich znakov a značiek, orezaný, najviac $max znakov. */
    public static function text($v, int $max = 200): string
    {
        if (!is_string($v)) return '';
        if (!mb_check_encoding($v, 'UTF-8')) return '';
        if (class_exists('Normalizer')) $v = Normalizer::normalize($v, Normalizer::FORM_C) ?: $v;
        $v = preg_replace('/[\x00-\x1F\x7F\x{200B}-\x{200F}\x{2028}\x{2029}\x{FEFF}]/u', ' ', $v);
        $v = trim(preg_replace('/[ \t]+/u', ' ', $v));
        return mb_substr($v, 0, $max);
    }

    /** Text nesmie obsahovať znaky, ktoré by sa dali zameniť za značky (aj keď sa všetko escapuje). */
    public static function chybaTextu(string $v, string $pole, int $min, int $max): ?string
    {
        $n = mb_strlen($v);
        if ($n < $min) return $min <= 1 ? "Vyplňte pole $pole." : "Pole $pole musí mať aspoň $min znakov.";
        if ($n > $max) return "Pole $pole môže mať najviac $max znakov, teraz má $n. Skráťte ho o " . ($n - $max) . '.';   // S7: nič sa neoreže potichu
        if (preg_match('/[<>{}\\\\]/u', $v)) return "V poli $pole nepoužívajte znaky < > { } \\.";
        return null;
    }

    public static function datum(string $v): ?string
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) || !checkdate((int)$m[2], (int)$m[3], (int)$m[1])) return null;
        return ((int)$m[3]) . '. ' . ((int)$m[2]) . '. ' . $m[1];
    }

    public static function datumIso(string $sk): string
    {
        if (!preg_match('/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/u', trim($sk), $m)) return '';
        return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
    }

    /** Cena: číslo s čiarkou + jednotka (4,42 €/vrece), alebo voľný text bez číslic („na dopyt“). */
    public static function cena(string $cislo, string $jednotka): ?string
    {
        $cislo = str_replace([' ', "\u{a0}", '€'], '', str_replace('.', ',', trim($cislo)));
        if ($cislo === '') return null;
        if (!preg_match('/^\d{1,6}(,\d{1,2})?$/', $cislo)) return null;
        $j = self::text($jednotka, 30);
        if ($j !== '' && !preg_match('/^[\p{L}\p{N}²³ .\/+-]+$/u', $j)) return null;
        return $cislo . ' €' . ($j !== '' ? '/' . ltrim($j, '/') : '');
    }

    /** Slug z názvu (prepis diakritiky vlastnou tabuľkou, bez intl). */
    public static function slug(string $t, int $max = 50): string
    {
        $t = mb_strtolower($t);
        $t = strtr($t, ['á' => 'a', 'ä' => 'a', 'č' => 'c', 'ď' => 'd', 'é' => 'e', 'ě' => 'e', 'í' => 'i', 'ĺ' => 'l', 'ľ' => 'l', 'ň' => 'n',
                        'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'ŕ' => 'r', 'ř' => 'r', 'š' => 's', 'ť' => 't', 'ú' => 'u', 'ů' => 'u', 'ü' => 'u',
                        'ý' => 'y', 'ž' => 'z', 'ø' => 'o', '×' => 'x', '²' => '2', '³' => '3', '&' => 'a']);
        $t = trim(preg_replace('/[^a-z0-9]+/', '-', $t), '-');
        $t = substr($t, 0, $max);
        return rtrim($t, '-') ?: 'akcia';
    }

    // ---------- výstup ----------
    private static function titulok(string $t): string
    {
        return preg_match('#<title>(.*?)</title>#s', $t, $m) ? html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';
    }

    private static function popis(string $t): string
    {
        return preg_match('#<meta name="description" content="([^"]*)">#', $t, $m) ? html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';
    }

    private static function h1(string $t): array
    {
        preg_match_all('#<h1[\s>].*?</h1>#s', $t, $m);
        return array_map(fn($x) => trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($x), ENT_QUOTES | ENT_HTML5, 'UTF-8'))), $m[0]);
    }

    /** Kontrola pripravených súborov. Vráti [chyby, varovania]. */
    public static function vystup(array $vystup, array $nove, callable $citaj, array $DK): array
    {
        $chyby = []; $var = [];
        $kostra = array_column(Vykreslenie::oblasti_v(Zmena::kostra('akcie/x.html')), 0);
        $kostraN = array_column(Vykreslenie::oblasti_v(Zmena::kostra('novinky/x.html')), 0);
        $ocak = Ulozisko::citajJson(Nastavenie::w('sprava/kostry/oblasti.json'), []);
        $nazov = fn($p) => self::nazovStranky($p, $DK);
        foreach ($vystup as $p => $t) {
            if (!str_ends_with($p, '.html')) continue;
            $ids = array_column(Vykreslenie::oblasti_v($t), 0);
            $vzor = str_starts_with($p, 'novinky/') ? $kostraN : $kostra;
            $mali = (in_array($p, $nove, true) || (Zmena::spravovana($p) && !isset($ocak[$p]))) ? $vzor : ($ocak[$p] ?? array_column(Vykreslenie::oblasti_v((string)@file_get_contents(Nastavenie::w($p))), 0));
            if ($ids !== $mali) $chyby[] = "Stránka $p by stratila označené miesta. Zmena sa nedá zverejniť; zavolajte programátora.";
            if (substr_count($t, '<!--s:') !== substr_count($t, '<!--/s:')) $chyby[] = "Stránka $p má poškodené označenie.";
            $h1 = self::h1($t);
            if (count($h1) !== 1) $chyby[] = 'Stránka ' . $nazov($p) . ' musí mať práve jeden hlavný nadpis.';
            if ($p !== 'index.html' && $p !== '404.html') {
                $tit = self::titulok($t); $d = self::popis($t);
                if (mb_strlen($tit) > 60) $chyby[] = 'Názov pre Google na stránke ' . $nazov($p) . ' je dlhší ako 60 znakov. Skráťte názov.';
                $l = mb_strlen($d);
                if ($l < 120 || $l > 155) $chyby[] = 'Popis pre Google na stránke ' . $nazov($p) . " má $l znakov (treba 120 až 155).";
                if ($h1) {
                    $n = Seo::slova($h1[0]);
                    if ($n < 2 || $n > 7 || mb_strlen($h1[0]) > 45) $chyby[] = 'Nadpis „' . $h1[0] . '“ musí mať 2 až 7 slov a najviac 45 znakov.';
                }
            }
            foreach (Vykreslenie::oblasti_v($t) as [$id, $obsah]) {
                if (preg_match_all('#<script type="application/ld\+json">(.*?)</script>#s', $obsah, $mm))
                    foreach ($mm[1] as $j) if (json_decode($j) === null) $chyby[] = "Údaje pre Google na stránke $p nie sú platné.";
                if (preg_match_all('#<img\b[^>]*>#', $obsah, $mm))
                    foreach ($mm[0] as $img) if (!preg_match('/\swidth="\d+"/', $img) || !preg_match('/\sheight="\d+"/', $img)) $chyby[] = "Obrázok na stránke $p nemá rozmery.";
                preg_match_all('#\s(?:href|src)="([^"]+)"|\ssrcset="([^"]+)"#', $obsah, $mm, PREG_SET_ORDER);
                foreach ($mm as $x) {
                    $hodnoty = !empty($x[2]) ? array_map(fn($s) => explode(' ', trim($s))[0], explode(',', $x[2])) : [$x[1]];
                    foreach ($hodnoty as $u) {
                        $u = html_entity_decode($u, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                        if ($u === '' || preg_match('#^(https?:|mailto:|tel:|\#|data:)#', $u)) {
                            if (preg_match('#^\s*javascript:#i', $u)) $chyby[] = "Nepovolený odkaz na stránke $p.";
                            continue;
                        }
                        $ciel = self::relCesta($p, explode('#', explode('?', $u)[0])[0]);
                        if ($ciel === null || (!is_file(Nastavenie::w($ciel)) && !isset($vystup[$ciel]))) $chyby[] = "Odkaz na $u zo stránky $p nevedie na existujúci súbor.";
                    }
                }
            }
            $stary = is_file(Nastavenie::w($p)) ? filesize(Nastavenie::w($p)) : 0;
            if ($stary > 0 && (strlen($t) < 0.6 * $stary || strlen($t) > 1.5 * $stary)) $chyby[] = 'Stránka ' . $nazov($p) . ' by sa zmenila príliš (veľkosť). Skontrolujte zmenu.';
        }
        // jedinečnosť titulkov, popisov a nadpisov v celom webe
        $tit = []; $pop = []; $h1s = [];
        foreach (self::vsetkyStranky() as $p) {
            $t = $vystup[$p] ?? $citaj($p);
            if ($t === '' || $p === 'index.html' || preg_match('#<meta name="robots" content="noindex">#', $t)) continue;
            $tit[self::titulok($t)][] = $p; $pop[self::popis($t)][] = $p;
            foreach (self::h1($t) as $h) $h1s[$h][] = $p;
        }
        foreach ([['názov pre Google', $tit], ['popis pre Google', $pop], ['nadpis', $h1s]] as [$co, $mapa])
            foreach ($mapa as $k => $str) if (count($str) > 1 && array_intersect($str, array_keys($vystup)))
                $chyby[] = 'Rovnaký ' . $co . ' „' . mb_substr($k, 0, 60) . '“ majú stránky ' . implode(', ', array_map($nazov, $str)) . '. Zmeňte názov.';
        if (isset($vystup['assets/index.json']) && json_decode($vystup['assets/index.json']) === null) $chyby[] = 'Index hľadania nie je platný.';
        if (isset($vystup['sitemap.xml'])) {
            $d = new DOMDocument(); $s = libxml_use_internal_errors(true);
            if (!$d->loadXML($vystup['sitemap.xml'], LIBXML_NONET)) $chyby[] = 'Mapa webu (sitemap) nie je platná.';
            libxml_clear_errors(); libxml_use_internal_errors($s);
        }
        return [array_values(array_unique($chyby)), $var];
    }

    public static function nazovStranky(string $p, array $DK): string
    {
        foreach ($DK['akcie']['akcie'] as $a) if ($a['stranka'] === $p) return 'akcie „' . $a['nazov'] . '“';
        foreach ($DK['novinky']['novinky'] ?? [] as $n) if ($n['stranka'] === $p) return 'novinky „' . $n['nazov'] . '“';
        $n = ['404.html' => 'Stránka sa nenašla', 'index.html' => 'Úvod', 'kontakt.html' => 'Kontakt', 'akcie/index.html' => 'Akcie', 'letak.html' => 'Akciový leták', 'doprava.html' => 'Doprava', 'caste-otazky.html' => 'Časté otázky',
              'novinky/index.html' => 'Novinky', 'galeria/index.html' => 'Galéria', 'sluzby.html' => 'Služby', 'o-nas.html' => 'O nás'];
        return $n[$p] ?? ($DK['k']['nazvy'][$p] ?? $p);
    }

    /** Relatívny odkaz zo stránky p → cesta od koreňa webu; null, ak vedie mimo webu. */
    public static function relCesta(string $p, string $u): ?string
    {
        $u = rawurldecode($u);
        $casti = $u[0] === '/' ? [] : explode('/', dirname($p) === '.' ? '' : dirname($p));
        foreach (explode('/', ltrim($u, '/')) as $c) {
            if ($c === '' || $c === '.') continue;
            if ($c === '..') { if (!array_filter($casti, 'strlen')) return null; array_pop($casti); continue; }
            $casti[] = $c;
        }
        return implode('/', array_filter($casti, 'strlen'));
    }

    public static function vsetkyStranky(): array
    {
        $von = [];
        $it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(new RecursiveDirectoryIterator(Nastavenie::w(), FilesystemIterator::SKIP_DOTS),
            fn($f, $k, $it) => !($f->isDir() && in_array($f->getFilename(), ['img', 'pdf', 'subory', 'zdroj', 'nasadenie', 'asistent', 'sprava', 'data', 'nastroje', '.git', '__pycache__'], true)) && !str_starts_with($f->getFilename(), 'sprava-data')));
        foreach ($it as $f) if ($f->isFile() && str_ends_with($f->getFilename(), '.html')) $von[] = str_replace('\\', '/', substr($f->getPathname(), strlen(Nastavenie::w()) + 1));
        sort($von);
        return $von;
    }
}
