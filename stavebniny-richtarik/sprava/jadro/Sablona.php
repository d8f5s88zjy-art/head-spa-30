<?php
// Motor šablón kúskov HTML – ten istý jazyk a výstup ako nastroje/sablona.py (build.py). Opis jazyka je tam.
defined('SPRAVA') || exit;

final class Sablona
{
    private static array $cache = [];
    public static string $koren = '';

    public static function sablona(string $meno, array $data): string
    {
        if (!preg_match('/^[a-z0-9-]+$/', $meno)) throw new InvalidArgumentException('šablóna');
        if (!isset(self::$cache[$meno])) {
            $t = file_get_contents((self::$koren ?: dirname(__DIR__) . '/sablony') . '/' . $meno . '.html');
            if ($t === false) throw new RuntimeException('chýba šablóna ' . $meno);
            if (substr($t, -1) === "\n") $t = substr($t, 0, -1);
            self::$cache[$meno] = self::rozober($t);
        }
        $von = '';
        self::vykresli(self::$cache[$meno], [$data], $von);
        return $von;
    }

    public static function vyplnit(string $text, array $data): string
    {
        $von = '';
        self::vykresli(self::rozober($text), [$data], $von);
        return $von;
    }

    private static function rozober(string $t): array
    {
        $koren = [];
        $zasobnik = [[null, &$koren]];
        $poz = 0;
        preg_match_all('/\{\{(\{|#|\^|\/)?\s*([a-zA-Z0-9_.]+|\.)\s*\}?\}\}/', $t, $m, PREG_OFFSET_CAPTURE | PREG_SET_ORDER);
        foreach ($m as $x) {
            $start = $x[0][1];
            $cely = $x[0][0];
            $vrch = count($zasobnik) - 1;
            if ($start > $poz) $zasobnik[$vrch][1][] = ['t', substr($t, $poz, $start - $poz)];
            $druh = $x[1][1] >= 0 ? $x[1][0] : '';
            $meno = $x[2][0];
            if ($druh === '#' || $druh === '^') {
                $uzol = ['s', $meno, $druh === '^', []];
                $zasobnik[$vrch][1][] = $uzol;
                $i = count($zasobnik[$vrch][1]) - 1;
                $zasobnik[] = [$meno, &$zasobnik[$vrch][1][$i][3]];
            } elseif ($druh === '/') {
                if ($zasobnik[$vrch][0] !== $meno) throw new RuntimeException('šablóna: neočakávané {{/' . $meno . '}}');
                array_pop($zasobnik);
            } elseif ($druh === '{') {
                if (substr($cely, -3) !== '}}}') throw new RuntimeException('šablóna: {{{ bez }}}');
                $zasobnik[$vrch][1][] = ['v', $meno, false];
            } else {
                $zasobnik[$vrch][1][] = ['v', $meno, true];
            }
            $poz = $start + strlen($cely);
        }
        if (count($zasobnik) !== 1) throw new RuntimeException('šablóna: neuzavretá časť');
        if ($poz < strlen($t)) $koren[] = ['t', substr($t, $poz)];
        return $koren;
    }

    private static function hodnota(array $kontexty, string $meno)
    {
        if ($meno === '.') return end($kontexty);
        $casti = explode('.', $meno);
        for ($i = count($kontexty) - 1; $i >= 0; $i--) {
            $k = $kontexty[$i];
            if (is_array($k) && !array_is_list($k) && array_key_exists($casti[0], $k)) {
                $v = $k[$casti[0]];
                foreach (array_slice($casti, 1) as $c) $v = (is_array($v) && array_key_exists($c, $v)) ? $v[$c] : null;
                return $v;
            }
        }
        return null;
    }

    private static function vykresli(array $uzly, array $kontexty, string &$von): void
    {
        foreach ($uzly as $u) {
            if ($u[0] === 't') { $von .= $u[1]; continue; }
            $v = self::hodnota($kontexty, $u[1]);
            if ($u[0] === 'v') { $von .= $u[2] ? Pomocne::e($v) : Pomocne::text($v); continue; }
            if ($u[2]) {
                if (!Pomocne::pravda($v)) self::vykresli($u[3], $kontexty, $von);
            } elseif (is_array($v) && $v !== [] && array_is_list($v)) {
                foreach ($v as $x) self::vykresli($u[3], array_merge($kontexty, [$x]), $von);
            } elseif (is_array($v)) {
                if ($v !== []) self::vykresli($u[3], array_merge($kontexty, [$v]), $von);
            } elseif (Pomocne::pravda($v)) {
                self::vykresli($u[3], $kontexty, $von);
            }
        }
    }
}
