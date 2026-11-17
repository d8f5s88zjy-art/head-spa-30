<?php
// Titulky, popisy a nadpisy pre vyhľadávače – prenos texty.titulok/texty.popis a pravidiel kontrola_textov (build.py).
defined('SPRAVA') || exit;

final class Seo
{
    const AKCIA_DOPLNOK = 'So zákazníckou kartou zľava z cien 5 % v hotovosti alebo 3,3 % kartou.';

    private static function d(): array
    {
        static $d = null;
        if ($d === null) $d = json_decode(file_get_contents(dirname(__DIR__) . '/kostry/typografia.json'), true)['doplnky'];
        return $d;
    }

    public static function pripona(): string
    {
        return ' | Stavebniny Richtárik Nitra';
    }

    /** texty.popis bez ručného popisu: zloží popis z celých viet (120 – 155 znakov). */
    public static function popis(string $nazov, string $druh, string $veta = '', $nic = null): string
    {
        $veta = rtrim(trim($veta), '.');
        $vl = mb_strtolower(mb_substr($veta, 0, 1)) . mb_substr($veta, 1);
        switch ($druh) {
            case 'kategoria': $z = $veta !== '' ? "$nazov v Nitre: $vl." : "$nazov v Nitre."; break;
            case 'znacka': $z = "$nazov v Stavebninách Richtárik v Nitre." . ($veta !== '' ? " $veta." : ''); break;
            case 'akcia': $z = $veta !== '' ? "Akcia $nazov: $veta." : "Akcia $nazov."; break;
            case 'novinka': $z = $veta !== '' ? "$nazov: $veta." : "$nazov."; break;
            default: $z = "$nazov.";
        }
        $doplnky = $druh === 'akcia' ? array_merge([self::AKCIA_DOPLNOK], self::d()) : self::d();
        $d = $z;
        if (mb_strlen($d) > 155) {
            $vety = preg_split('/(?<=[.!?])\s+/u', $d); $d = '';
            foreach ($vety as $v) if (mb_strlen(trim($d . ' ' . $v)) <= 155) $d = trim($d . ' ' . $v);
        }
        foreach ($doplnky as $x) {
            if (mb_strlen($d) >= 120) break;
            if (mb_strlen($d . ' ' . $x) <= 155) $d = $d . ' ' . $x;
        }
        return $d;
    }

    /** Počet slov H1 ako re.findall(r'[\w]+', h1). */
    public static function slova(string $t): int
    {
        return preg_match_all('/\w+/u', $t);
    }

    /** Chyby SEO jednej stránky (vety pre Mária); prázdne pole = v poriadku. */
    public static function chyby(string $titulok, string $h1, string $popis): array
    {
        $ch = [];
        if (mb_strlen($titulok . self::pripona()) > 60) $ch[] = 'Názov pre Google je dlhý (najviac ' . (60 - mb_strlen(self::pripona())) . ' znakov).';
        $n = self::slova($h1);
        if ($n < 2 || $n > 7 || mb_strlen($h1) > 45) $ch[] = 'Nadpis stránky musí mať 2 až 7 slov a najviac 45 znakov.';
        $l = mb_strlen($popis);
        if ($l < 120 || $l > 155 || preg_match('/(…|\.\.\.)$/u', $popis)) $ch[] = "Popis pre Google má $l znakov, potrebných je 120 až 155.";
        return $ch;
    }
}
