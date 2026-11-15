<?php
// Pomocné funkcie, ktoré musia dávať do bajtu to isté ako Python v build.py (html.escape, json.dumps, urllib.parse.quote).
defined('SPRAVA') || exit;

final class Pomocne
{
    /** html.escape(v, quote=True): & < > " ' (apostrof ako &#x27;). */
    public static function e($v): string
    {
        return strtr(self::text($v), ['&' => '&amp;', '<' => '&lt;', '>' => '&gt;', '"' => '&quot;', "'" => '&#x27;']);
    }

    public static function text($v): string
    {
        if ($v === null || $v === false) return '';
        if ($v === true) return '1';
        return (string)$v;
    }

    /** json.dumps(o, ensure_ascii=False) – oddeľovače ", " a ": ", alebo kompaktné "," a ":". */
    public static function jsonPy($o, bool $kompakt = false): string
    {
        $c = $kompakt ? ',' : ', ';
        $d = $kompakt ? ':' : ': ';
        if ($o === null) return 'null';
        if ($o === true) return 'true';
        if ($o === false) return 'false';
        if (is_int($o)) return (string)$o;
        if (is_float($o)) return json_encode($o);
        if (is_string($o)) return self::jsonRetazec($o);
        if (is_array($o)) {
            if ($o === [] ) return '[]';
            if (array_is_list($o)) {
                return '[' . implode($c, array_map(fn($x) => self::jsonPy($x, $kompakt), $o)) . ']';
            }
            $p = [];
            foreach ($o as $k => $v) $p[] = self::jsonRetazec((string)$k) . $d . self::jsonPy($v, $kompakt);
            return '{' . implode($c, $p) . '}';
        }
        if ($o instanceof stdClass) {
            $a = (array)$o;
            if ($a === []) return '{}';
            $p = [];
            foreach ($a as $k => $v) $p[] = self::jsonRetazec((string)$k) . $d . self::jsonPy($v, $kompakt);
            return '{' . implode($c, $p) . '}';
        }
        throw new InvalidArgumentException('jsonPy: nepodporovaný typ');
    }

    /** json.dumps(o, ensure_ascii=False, indent=n) pre údaje z json_decode bez assoc (stdClass = slovník, aj prázdny). */
    public static function jsonPyOdsad($o, int $n = 1, int $l = 0): string
    {
        $ind = str_repeat(' ', $n * ($l + 1)); $kon = str_repeat(' ', $n * $l);
        if ($o instanceof stdClass) {
            $a = get_object_vars($o);
            if (!$a) return '{}';
            $p = [];
            foreach ($a as $k => $v) $p[] = $ind . self::jsonRetazec((string)$k) . ': ' . self::jsonPyOdsad($v, $n, $l + 1);
            return "{\n" . implode(",\n", $p) . "\n" . $kon . '}';
        }
        if (is_array($o)) {
            if (!$o) return '[]';
            return "[\n" . implode(",\n", array_map(fn($v) => $ind . self::jsonPyOdsad($v, $n, $l + 1), $o)) . "\n" . $kon . ']';
        }
        return self::jsonPy($o);
    }

    private static function jsonRetazec(string $s): string
    {
        $von = '"';
        $n = strlen($s);
        for ($i = 0; $i < $n; $i++) {
            $ch = $s[$i];
            $o = ord($ch);
            if ($ch === '"') $von .= '\\"';
            elseif ($ch === '\\') $von .= '\\\\';
            elseif ($ch === "\n") $von .= '\\n';
            elseif ($ch === "\r") $von .= '\\r';
            elseif ($ch === "\t") $von .= '\\t';
            elseif ($ch === "\x08") $von .= '\\b';
            elseif ($ch === "\x0c") $von .= '\\f';
            elseif ($o < 0x20 || $o === 0x7f && false) $von .= sprintf('\\u%04x', $o);
            else $von .= $ch;
        }
        return $von . '"';
    }

    /** urllib.parse.quote(s) s predvoleným safe='/'. */
    public static function quote(string $s): string
    {
        return str_replace('%2F', '/', rawurlencode($s));
    }

    /** Relatívna cesta z cesty stránky k cieľu (build.rel). */
    public static function rel(string $cesta, string $ciel): string
    {
        return str_repeat('../', substr_count($cesta, '/')) . $ciel;
    }

    /** Pravdivosť ako v Pythone pre hodnoty z JSON. */
    public static function pravda($v): bool
    {
        return !($v === null || $v === false || $v === '' || $v === 0 || $v === 0.0 || $v === []);
    }
}
