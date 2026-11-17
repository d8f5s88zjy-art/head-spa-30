<?php
// Čo sa zmení: vety „pred → po“ pre náhľad a Históriu (S8), aby Mário videl obsah zmeny bez otvárania stránok.
defined('SPRAVA') || exit;

final class Rozdiel
{
    private static function kratko(string $t, int $n = 70): string
    {
        return mb_strlen($t) > $n ? mb_substr($t, 0, $n - 1) . '…' : $t;
    }

    private static function hodiny(array $D): string
    {
        return implode(', ', array_map(fn($r) => $r['kratko'] . ' ' . $r['cas'], Vykreslenie::hodiny_riadky($D)));
    }

    private static function ceny(array $a): array
    {
        $c = [];
        foreach ($a['ceny'] ?? [] as $t) foreach ($t['riadky'] as $r) $c[$r[0]] = $r[1];
        return $c;
    }

    private static function podlaId(array $zoz): array
    {
        $m = [];
        foreach ($zoz as $x) $m[$x['id']] = $x;
        return $m;
    }

    /** Obrázky s údajom v obrázku (telefón, e-mail, adresa, hodiny, zľava) → či sú pri údajoch $D na webe. Kľúč je id,
     *  hodnota [názov pre Mária, na webe]. Položky albumov len viditeľné; to isté rozhoduje vykreslenie (udaje_platia). */
    private static function obrazkyUdajov(array $D): array
    {
        if (!isset($D['k'])) $D = Zmena::sKonstantami($D);   // údaje webu a konceptu konštanty nenesú
        $k = Vykreslenie::kontakt_karty_vm($D);
        $m = ['k-tel' => ['obrázok Zavolajte nám (Kontakt)', $k['obr_tel']], 'k-mail' => ['obrázok Napíšte nám (Kontakt)', $k['obr_mail']],
              'k-hod' => ['obrázok otváracích hodín (Kontakt)', Vykreslenie::udaje_platia($D, ['hodiny'])],
              's-zl' => ['ikona zliav (Služby)', Vykreslenie::udaje_platia($D, ['zlava'])]];
        foreach ($D['galeria']['albumy'] as $a) foreach ($a['fotky'] as $f)
            if (!empty($f['plati_pri']) && ($f['viditelna'] ?? true))
                $m['g-' . $a['id'] . '-' . $f['id'] . '-' . $f['src']] = [$f['popis'] . ' (' . $a['nadpis'] . ')', Vykreslenie::udaje_platia($D, $f['plati_pri'])];
        return $m;
    }

    /** N2 (17. 11. 2026): pri zmene telefónu, e-mailu, hodín alebo zľavy náhľad povie, ktoré obrázky z webu zmiznú alebo sa vrátia. */
    private static function obrazkyVety(array $A, array $B): array
    {
        $oa = self::obrazkyUdajov($A); $ob = self::obrazkyUdajov($B); $skr = []; $vrat = [];
        foreach ($ob as $id => [$n, $na]) {
            if (!isset($oa[$id])) continue;   // nová, nahradená alebo inak zmenená položka – hlási ju časť galéria
            if ($oa[$id][1] && !$na) $skr[] = $n;
            elseif (!$oa[$id][1] && $na) $vrat[] = $n;
        }
        $v = [];
        if ($skr) $v[] = 'Z webu sa skryjú obrázky so starým údajom: ' . implode(', ', $skr)
            . '. Obrázky v Galérii a letáky nahradíte novými vo Fotkách v galérii (Nahradiť inou fotkou), obrázky na Kontakte a v Službách vymení programátor.';
        if ($vrat) $v[] = 'Na web sa vrátia obrázky: ' . implode(', ', $vrat) . '.';
        return $v;
    }

    /** Vety o zmene z údajov $A (teraz na webe) na $B (koncept). */
    public static function vety(array $A, array $B): array
    {
        $v = [];
        // hodiny a oznamy
        if ($A['firma']['hodiny'] !== $B['firma']['hodiny']) $v[] = 'Otváracie hodiny: ' . self::hodiny($A) . ' → ' . self::hodiny($B);
        $va = array_map([Vykreslenie::class, 'vynimka_text'], $A['firma']['vynimky'] ?? []);
        $vb = array_map([Vykreslenie::class, 'vynimka_text'], $B['firma']['vynimky'] ?? []);
        foreach (array_diff($vb, $va) as $x) $v[] = 'Nový oznam pri hodinách: ' . $x;
        foreach (array_diff($va, $vb) as $x) $v[] = 'Odstránený oznam: ' . $x;
        foreach (['mobil' => 'Mobil', 'pevna' => 'Pevná linka', 'email' => 'E-mail'] as $k => $n)
            if ($A['firma'][$k] !== $B['firma'][$k]) $v[] = "$n: {$A['firma'][$k]} → {$B['firma'][$k]} (na všetkých stránkach)";
        array_push($v, ...self::obrazkyVety($A, $B));
        // akcie
        $aa = self::podlaId($A['akcie']['akcie']); $ab = self::podlaId($B['akcie']['akcie']);
        foreach ($ab as $id => $b) {
            $a = $aa[$id] ?? null; $n = '„' . $b['nazov'] . '“';
            if (!$a) { $v[] = "Nová akcia $n" . ($b['na_uvode'] ? ' (aj na úvode)' : ''); continue; }
            if ($a['viditelna'] !== $b['viditelna']) $v[] = ($b['viditelna'] ? 'Znova zobrazená akcia ' : 'Skrytá akcia ') . $n;
            if ($a['nazov'] !== $b['nazov']) $v[] = "Názov akcie: „{$a['nazov']}“ → $n";
            if ($a['stitok'] !== $b['stitok']) $v[] = "Štítok akcie $n: {$a['stitok']} → {$b['stitok']}";
            if ($a['karta'] !== $b['karta']) $v[] = "Text akcie $n: „" . self::kratko($b['karta']) . '“';
            if (($a['na_uvode'] ?? false) !== ($b['na_uvode'] ?? false) && $b['viditelna']) $v[] = ($b['na_uvode'] ? 'Na úvod pribudne akcia ' : 'Z úvodu ustúpi akcia ') . $n;
            $ca = self::ceny($a); $cb = self::ceny($b);
            foreach ($cb as $p => $c) if (!isset($ca[$p])) $v[] = "Akcia $n: nová cena $p – $c"; elseif ($ca[$p] !== $c) $v[] = "Akcia $n: $p {$ca[$p]} → $c";
            foreach ($ca as $p => $c) if (!isset($cb[$p])) $v[] = "Akcia $n: odstránená cena $p – $c";
            if (($a['letak']['src'] ?? null) !== ($b['letak']['src'] ?? null)) $v[] = "Akcia $n: " . ($b['letak'] ? 'nová fotka letáku' : 'bez fotky letáku');
            if (count($a['pdf']) !== count($b['pdf'])) $v[] = "Akcia $n: letákov PDF " . count($a['pdf']) . ' → ' . count($b['pdf']);
            if (($a['hlavicka'] ?? null) !== ($b['hlavicka'] ?? null)) $v[] = "Akcia $n: iná fotka v hlavičke";
            if (($a['seo'] ?? null) !== ($b['seo'] ?? null) && $a['nazov'] === $b['nazov']) $v[] = "Akcia $n: texty pre Google";
        }
        if (array_keys($aa) !== array_values(array_filter(array_keys($ab), fn($id) => isset($aa[$id])))) $v[] = 'Iné poradie akcií';
        // cenník a letáky
        if ($A['cennik']['aktualny'] !== $B['cennik']['aktualny']) $v[] = 'Nový cenník akcií z ' . Vykreslenie::cennik_aktualny($B)['datum'];
        $la = array_column($A['cennik']['stare_letaky'], 'text'); $lb = array_column($B['cennik']['stare_letaky'], 'text');
        foreach (array_diff($lb, $la) as $x) $v[] = "Nový leták: $x";
        foreach (array_diff($la, $lb) as $x) $v[] = "Odstránený leták: $x";
        // novinky
        $na = self::podlaId($A['novinky']['novinky']); $nb = self::podlaId($B['novinky']['novinky']);
        foreach ($nb as $id => $b) {
            $a = $na[$id] ?? null; $n = '„' . $b['nazov'] . '“';
            if (!$a) { $v[] = "Nová novinka $n"; continue; }
            if ($a['viditelna'] !== $b['viditelna']) $v[] = ($b['viditelna'] ? 'Znova zobrazená novinka ' : 'Skrytá novinka ') . $n;
            if ($a['nazov'] !== $b['nazov']) $v[] = "Názov novinky: „{$a['nazov']}“ → $n";
            if ($a['popis'] !== $b['popis']) $v[] = "Popis novinky $n: „" . self::kratko($b['popis']) . '“';
            if ($a['odseky'] !== $b['odseky']) $v[] = "Text novinky $n";
            if (count($a['fotky']) !== count($b['fotky'])) $v[] = "Novinka $n: fotiek " . count($a['fotky']) . ' → ' . count($b['fotky']);
            if (count($a['pdf']) !== count($b['pdf'])) $v[] = "Novinka $n: PDF " . count($a['pdf']) . ' → ' . count($b['pdf']);
            if (!empty($a['na_uvode']) !== !empty($b['na_uvode'])) $v[] = (!empty($b['na_uvode']) ? 'Na úvod: novinka ' : 'Z úvodu: novinka ') . $n;
        }
        if ($A['novinky']['kategorie'] !== $B['novinky']['kategorie']) $v[] = 'Novinky v katalógu (kategórie)';
        // galéria
        foreach ($B['galeria']['albumy'] as $i => $b) {
            $a = self::podlaId($A['galeria']['albumy'][$i]['fotky'] ?? []); $fb = self::podlaId($b['fotky']);
            foreach ($fb as $id => $f) {
                $o = $a[$id] ?? null;
                if (!$o) $v[] = "Galéria {$b['nadpis']}: nová fotka „" . self::kratko($f['popis'], 50) . '“';
                elseif ($o['src'] !== $f['src']) $v[] = "Galéria {$b['nadpis']}: nahradená fotka „" . self::kratko($f['popis'], 50) . '“';
                elseif (($o['viditelna'] ?? true) !== ($f['viditelna'] ?? true)) $v[] = "Galéria {$b['nadpis']}: " . (($f['viditelna'] ?? true) ? 'zobrazená' : 'skrytá') . ' fotka „' . self::kratko($f['popis'], 50) . '“';
                elseif ($o['popis'] !== $f['popis']) $v[] = "Galéria {$b['nadpis']}: popis „" . self::kratko($o['popis'], 40) . '“ → „' . self::kratko($f['popis'], 40) . '“';
            }
            if (array_keys($a) !== array_values(array_filter(array_keys($fb), fn($id) => isset($a[$id])))) $v[] = "Galéria {$b['nadpis']}: iné poradie fotiek";
        }
        // texty
        foreach (Obsah::TEXTY as $k => [$n]) if (($A['texty'][$k] ?? null) !== ($B['texty'][$k] ?? null))
            $v[] = is_string($B['texty'][$k]) ? "$n: „" . self::kratko($A['texty'][$k], 40) . '“ → „' . self::kratko($B['texty'][$k], 60) . '“' : "$n (zmenený text)";
        if (count($v) > 30) $v = array_merge(array_slice($v, 0, 29), ['… a ďalšie zmeny (' . (count($v) - 29) . ')']);
        return $v;
    }
}
