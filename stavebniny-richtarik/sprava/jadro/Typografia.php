<?php
// Opravy názvov a typografia textu – prenos texty.opravy, texty._typografia a texty._verzalky (build.py) do PHP.
// Zoznamy pravidiel číta zo sprava/kostry/typografia.json, ktorý vyrába build.py z texty.py (jeden zdroj).
// Brána zhody (nastroje/sprava_zhoda.py) porovná výsledok s Pythonom na všetkých textoch webu.
defined('SPRAVA') || exit;

final class Typografia
{
    private static ?array $p = null;
    public static string $subor = '';
    private const NB = "\u{a0}";

    private static function p(): array
    {
        if (self::$p === null) {
            $s = file_get_contents(self::$subor ?: dirname(__DIR__) . '/kostry/typografia.json');
            self::$p = json_decode($s, true, 64, JSON_THROW_ON_ERROR);
        }
        return self::$p;
    }

    private static function re(string $vzor): string
    {
        return '/' . str_replace('/', '\/', $vzor) . '/u';
    }

    /** texty.opravy */
    public static function opravy(string $t): string
    {
        foreach (self::p()['opravy'] as [$a, $b]) $t = preg_replace(self::re($a), $b, $t);
        foreach (self::p()['odkazy'] as $a => $b) $t = str_replace($a, $b, $t);
        return $t;
    }

    /** Text z dát v konečnom tvare (vykreslenie.txt). */
    public static function txt(?string $s): string
    {
        return self::typografia(self::opravy($s ?? ''));
    }

    /** texty._typografia */
    public static function typografia(string $t): string
    {
        $P = self::p();
        $NB = self::NB;
        $MALE = $P['male'];
        foreach ($P['preklepy'] as [$a, $b]) $t = preg_replace(self::re($a), $b, $t);
        foreach ($P['super'] as [$a, $b]) {
            $t = preg_replace_callback(self::re($a), function ($m) use ($b) {
                $g = $m[0];
                $prve = mb_substr($g, 0, 1);
                if ($prve !== mb_strtolower($prve) && mb_strtoupper($prve) === $prve && !str_starts_with($g, 'v ') && !str_starts_with($g, 'V '))
                    return mb_strtoupper(mb_substr($b, 0, 1)) . mb_substr($b, 1);
                return $b;
            }, $t);
        }
        $t = self::verzalky($t);
        $t = preg_replace('/(?<=[\s\/\d(])m2(?![\w²])/u', 'm²', $t);
        $t = preg_replace('/(?<=[\s\/\d(])m3(?![\w³])/u', 'm³', $t);
        $t = preg_replace('/\+\s?(\d+)\s?oC\b/u', '+${1}' . $NB . '°C', $t);
        $t = preg_replace('/(\d)(m²|m³|kg|cm|mm|ks|m|t)(?![\w²³])/u', '${1}' . $NB . '${2}', $t);
        $t = preg_replace('/(\d) (€|m²|m³|kg|cm|mm|ks|m|t|l)(?![\w²³])/u', '${1}' . $NB . '${2}', $t);
        $t = preg_replace('/(\d) ?[x×] ?(?=\d)/u', '${1}' . $NB . '× ', $t);
        $t = preg_replace('/(\d),-\s*(?=€|Eur\b|EUR\b)/u', '${1} ', $t);
        $t = preg_replace('/\s?\b(?:Eur|EUR)\b/u', ' €', $t);
        $t = preg_replace('/(\d)\.(\d{2})(?=\s*€)/u', '${1},${2}', $t);
        $t = preg_replace('/(\d)€/u', '${1}' . $NB . '€', $t);
        $t = preg_replace('/\b(?:Dph|dph)\b/u', 'DPH', $t);
        $t = preg_replace('/\b(\d{1,2})\. ?(\d{1,2})\. ?(\d{4})\b/u', '${1}.' . $NB . '${2}.' . $NB . '${3}', $t);
        $t = preg_replace('/ø /u', 'ø' . $NB, $t);
        $t = preg_replace('/(\d) ?%/u', '${1}' . $NB . '%', $t);
        $t = preg_replace('/(?<!Richtárik)(?<=\S) - (?=\S)/u', ' – ', $t);
        $t = preg_replace('/(?<=\S) - ?$/u', ' – ', $t);
        $t = preg_replace('/\.{3,}/u', '…', $t);
        $t = preg_replace('/(?<![.…])\.\.(?!\.)/u', '.', $t);
        $t = preg_replace('/\s*!+(?=[\s"“”’)&]|$)/u', '.', $t);
        $t = preg_replace('/!+(?=[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ])/u', '. ', $t);
        $t = preg_replace('/\.\s*\.(?=\s|$)/u', '.', $t);
        $t = preg_replace('/…\s+\./u', '…', $t);
        $t = preg_replace('/(\d)[ \x{a0}]+,(?=\d)/u', '${1}, ', $t);
        $t = preg_replace('/(?<=, )(\d{2,3}),(\d{2,3})(?=,)/u', '${1}, ${2}', $t);
        $t = preg_replace('/(?<=\S)[ \x{a0}]+([,;])/u', '${1}', $t);
        $t = preg_replace('/(?<=[\w)])[ \x{a0}]+\.(?=\s|$)/u', '.', $t);
        $t = preg_replace('/\([ \x{a0}]+/u', '(', $t);
        $t = preg_replace('/[ \x{a0}]+\)/u', ')', $t);
        $t = preg_replace('/(?<=\s)\/([' . $MALE . '][' . $MALE . ' ]{2,}[' . $MALE . '])\//u', '(${1})', $t);
        $t = preg_replace_callback('/(?<=[' . $MALE . '0-9,;] )V(y|ám|ás|áš\w*|aš\w*|ami)\b/u', fn($m) => 'v' . substr($m[0], 1), $t);
        return $t;
    }

    /** texty._verzalky – pracuje s bajtovými pozíciami (PHP), dĺžky slov v znakoch ako v Pythone. */
    public static function verzalky(string $t): string
    {
        $P = self::p();
        $V = $P['velke']; $M = $P['male'];
        $SKR = array_flip($P['skratky']); $MENA = $P['mena'];
        if (!preg_match_all('/(?<![\w' . $V . $M . '])[' . $V . ']{2,}(?![\w' . $V . $M . '])/u', $t, $mm, PREG_OFFSET_CAPTURE)) return $t;
        $slova = array_map(fn($x) => [$x[1], $x[1] + strlen($x[0]), $x[0]], $mm[0]);   // [začiatok, koniec, text]
        $useky = []; $cur = [$slova[0]];
        for ($i = 1; $i < count($slova); $i++) {
            $a = $slova[$i - 1]; $b = $slova[$i];
            $medzi = substr($t, $a[1], $b[0] - $a[1]);
            if (preg_match('/^(?:[\s,+\/\-–0-9.]|(?<=\s)[AVSKOUZI](?=\s))*\z/u', $medzi) && !preg_match('/[.]\s/u', $medzi)) $cur[] = $b;
            else { $useky[] = $cur; $cur = [$b]; }
        }
        $useky[] = $cur;
        $out = [];
        foreach ($useky as $u) {
            $ma = false;
            foreach ($u as $w) if (mb_strlen($w[2]) >= 5 && !isset($SKR[$w[2]])) { $ma = true; break; }
            if (!$ma) continue;
            $pred = substr($t, 0, $u[0][0]);
            $zaciatok = preg_replace('/^\s+|\s+$/u', '', $pred) === '' || preg_match('/[.!?]\s*$|[–-]\s*$|^\s*\d+\.\s*$/u', $pred);
            $zoznam = false;
            if (count($u) > 1) for ($i = 1; $i < count($u); $i++) if (strpos(substr($t, $u[$i - 1][1], $u[$i][0] - $u[$i - 1][1]), ',') !== false) { $zoznam = true; break; }
            $prve = true;
            foreach ($u as $i => $m) {
                $w = $m[2];
                if ($i && strpos(substr($t, $u[$i - 1][1], $m[0] - $u[$i - 1][1]), ',') !== false) $prve = true;
                if (isset($SKR[$w])) $nove = $w;
                elseif (isset($MENA[$w])) $nove = $MENA[$w];
                elseif ($prve && ($zoznam || $zaciatok || ($i == 0 && count($u) == 1 && !preg_match('/[' . $M . ']\s*$/u', $pred))))
                    $nove = mb_substr($w, 0, 1) . mb_strtolower(mb_substr($w, 1));
                else $nove = mb_strtolower($w);
                if ($i) {
                    $zac = $u[$i - 1][1];
                    $medzi = substr($t, $zac, $m[0] - $zac);
                    if (preg_match_all('/(?<=\s)[AVSKOUZI](?=\s)/u', $medzi, $jj, PREG_OFFSET_CAPTURE))
                        foreach ($jj[0] as $j) $out[] = [$zac + $j[1], $zac + $j[1] + strlen($j[0]), strtolower($j[0])];
                }
                $out[] = [$m[0], $m[1], $nove];
                $prve = false;
                if ($i == 0 && !$zoznam) $zaciatok = false;
            }
        }
        if (!$out) return $t;
        $r = ''; $poz = 0;
        foreach ($out as [$a, $b, $n]) { $r .= substr($t, $poz, $a - $poz) . $n; $poz = $b; }
        return $r . substr($t, $poz);
    }
}
