<?php
// Uloženie úprav z admina: zdroj (súbory v tvare repozitára, údaje/zdroj/ nad pôvodnými súbormi balíka sprava/semeno/)
// a verejné súbory webu. Jedno uloženie = zámok, kontrola verzie, kontrola každej cesty a obsahu proti tabuľke (Mapa),
// záloha doterajšieho stavu, zápis cez dočasný súbor a premenovanie, denník. Prerušený zápis vráti ďalšia požiadavka
// zo zálohy. Krok späť vráti stav z poslednej zálohy a sám sa dá vrátiť.
defined('B30S') || exit;

final class Zmena
{
    const ZALOH = 30, ZALOH_BAJTOV = 209715200, NAJVIAC_SUBOROV = 120;

    // ---------- zdroj ----------
    public static function semeno(string $cesta): string { return Miesto::w('sprava/semeno/' . $cesta . '.txt'); }

    /** Text zdrojového súboru (úprava z údajov, inak pôvodný z balíka); null, keď nie je v tabuľke alebo chýba. */
    public static function citajZdroj(string $cesta): ?string
    {
        if (Mapa::zdroj($cesta) === null) return null;
        foreach ([Miesto::u('zdroj/' . $cesta), self::semeno($cesta)] as $f) if (is_file($f)) { $s = @file_get_contents($f); if ($s !== false) return $s; }
        return null;
    }

    public static function verziaBalika(): array
    {
        $v = json_decode((string) @file_get_contents(Miesto::w('sprava/semeno/verzia.json')), true);
        return is_array($v) ? $v : ['commit' => '', 'cas' => ''];
    }

    /** Upravené súbory zdroja (cesty), ktoré sú v tabuľke. */
    public static function upravene(): array
    {
        return array_values(array_filter(Ulozisko::subory(Miesto::u('zdroj')), fn($c) => Mapa::zdroj($c) !== null));
    }

    /** Verzia stavu: odtlačok upravených súborov a verzie balíka (ako sha vetvy na GitHube). */
    public static function verzia(): string
    {
        $o = [];
        foreach (self::upravene() as $c) $o[$c] = sha1_file(Miesto::u('zdroj/' . $c));
        return sha1(json_encode([self::verziaBalika()['commit'] ?? '', $o]));
    }

    // ---------- uloženie ----------
    /** $v = ['verzia', 'sprava', 'zmeny' => [], 'subory' => [cesta => text], 'fotky' => [cesta => značka], 'verejne' => [cesta => text]].
     *  Vráti ['ok' => true, 'verzia' => …] alebo ['ok' => false, 'kod' => 400|409|503, 'chyba' => veta]. */
    public static function uloz(array $v, string $kto): array
    {
        $zle = fn(string $t, int $k = 400) => ['ok' => false, 'kod' => $k, 'chyba' => $t];
        $subory = $v['subory'] ?? []; $fotky = $v['fotky'] ?? []; $verejne = $v['verejne'] ?? [];
        if (!is_array($subory) || !is_array($fotky) || !is_array($verejne)) return $zle('Neplatné údaje.');
        if (count($subory) + count($fotky) + count($verejne) === 0) return $zle('Nie je čo uložiť.');
        if (count($subory) + count($fotky) + count($verejne) > self::NAJVIAC_SUBOROV) return $zle('Príliš veľa súborov naraz.');
        $zamok = Ulozisko::zamok(Miesto::u('zamok'), true, 10);
        if (!$zamok) return $zle('Práve prebieha iné uloženie. Skús to o chvíľu.', 503);
        try {
            self::obnovPrerusene(true);
            if (!is_string($v['verzia'] ?? null) || !hash_equals(self::verzia(), $v['verzia'])) return ['ok' => false, 'kod' => 409, 'stale' => true, 'chyba' => 'Web sa medzitým zmenil inde.'];
            $polozky = [];
            foreach ($subory as $c => $text) {
                if (!is_string($c) || !is_string($text)) return $zle('Neplatné údaje.');
                $z = Mapa::zdroj($c);
                if ($z === null) return $zle("Súbor $c nie je v zozname súborov webu, nedá sa uložiť.");
                $naWebe = $z[1] === 'kod' ? (is_file(Miesto::w($z[0])) ? (string) file_get_contents(Miesto::w($z[0])) : null) : null;
                if ($e = Mapa::kontrola($c, $text, $naWebe)) return $zle("Súbor $c sa nedá uložiť: $e.");
                $polozky[] = ['druh' => 'zdroj', 'cesta' => $c, 'obsah' => $text];
                if ($z[0] !== null) $polozky[] = ['druh' => 'web', 'cesta' => $z[0], 'obsah' => $text];
            }
            foreach ($verejne as $c => $text) {
                if (!is_string($c) || !is_string($text)) return $zle('Neplatné údaje.');
                if ($e = Mapa::kontrolaVerejna($c, $text)) return $zle("Verejný súbor $c sa nedá uložiť: $e.");
                $polozky[] = ['druh' => 'web', 'cesta' => $c, 'obsah' => $text];
                $polozky[] = ['druh' => 'zostavene', 'cesta' => $c, 'obsah' => $text];
            }
            // zmena stránky alebo anglického slovníka musí prísť so zostavenou slovenskou aj anglickou stránkou, inak by web zaostal
            $p = Mapa::P;
            if ((isset($subory[$p . 'index.html']) || isset($subory[$p . 'assets/i18n/en.json'])) && !(isset($verejne['index.html'], $verejne['en/index.html']))) return $zle('Chýba zostavená slovenská a anglická stránka. Obnov stránku správy a skús to znova.');
            if (isset($subory[$p . 'karta/index.html']) && !isset($verejne['karta/index.html'])) return $zle('Chýba zostavená stránka kartičky. Obnov stránku správy a skús to znova.');
            $nove = [];
            foreach ($fotky as $c => $znacka) {
                $f = Fotky::cakajuca($znacka);
                $ver = is_string($c) ? Mapa::fotka($c) : null;
                if ($f === null || $ver === null || $f[0] !== $c) return $zle('Fotka sa nenašla medzi nahratými. Vyber ju znova.');
                if (is_file(Miesto::w($ver))) return $zle("Fotka $ver už na webe je.");
                $polozky[] = ['druh' => 'web', 'cesta' => $ver, 'subor' => $f[1], 'nova' => true];
                $nove[$znacka] = $c;
            }
            $zmeny = array_slice(array_values(array_filter(array_map(fn($x) => is_string($x) ? mb_substr($x, 0, 200) : null, (array) ($v['zmeny'] ?? [])))), 0, 60);
            $id = self::vykonaj($polozky, ['typ' => 'ulozenie', 'kto' => $kto, 'zmeny' => $zmeny, 'sprava' => mb_substr((string) ($v['sprava'] ?? ''), 0, 300)]);
            foreach ($nove as $znacka => $c) Fotky::zahod($znacka);
            if ($nove) Ulozisko::uprav(Miesto::u('fotky.php'), function ($d) use ($nove) { $d['fotky'] = array_values(array_unique(array_merge($d['fotky'] ?? [], array_values($nove)))); return $d; });
            Dennik::zapis('ulozenie', ['zaloha' => $id, 'zmeny' => $zmeny, 'subory' => array_merge(array_keys($subory), array_values($nove))]);
            return ['ok' => true, 'verzia' => self::verzia(), 'zaloha' => $id];
        } finally { Ulozisko::odomkni($zamok); }
    }

    private static function ciel(array $p): string
    {
        return $p['druh'] === 'zdroj' ? Miesto::u('zdroj/' . $p['cesta']) : ($p['druh'] === 'zostavene' ? Miesto::u('zostavene/' . $p['cesta']) : Miesto::w($p['cesta']));
    }

    /** Záloha dotknutých súborov, plán, zápis (verejné stránky ako posledné, hneď s prepínačmi), plán hotový. Vráti id zálohy.
     *  Volá sa len pod zámkom údaje/zamok. */
    private static function vykonaj(array $polozky, array $meta): string
    {
        $id = self::noveId();
        $dir = Miesto::u('zalohy/' . $id);
        if (!@mkdir($dir, 0700, true)) throw new RuntimeException('Záloha sa nedá vytvoriť.');
        // prepínače, ktoré sú práve na webe, sa prenesú do novej stránky ešte pred zápisom (web nikdy neostane bez nich)
        $teraz = [];
        foreach (Prepinace::STRANKY as $s => $en) if (is_file(Miesto::w($s))) $teraz[$s] = Prepinace::precitaj((string) file_get_contents(Miesto::w($s)));
        $zoznam = [];
        foreach ($polozky as $i => $p) {
            $c = self::ciel($p);
            if (isset(Prepinace::STRANKY[$p['cesta']]) && $p['druh'] === 'web' && isset($p['obsah']) && isset($teraz[$p['cesta']])) $polozky[$i]['obsah'] = Prepinace::nastav($p['obsah'], $teraz[$p['cesta']]);
            $bolo = is_file($c);
            if ($bolo && empty($p['nova'])) {
                $z = $dir . '/' . $p['druh'] . '/' . $p['cesta'];
                if (!is_dir(dirname($z))) @mkdir(dirname($z), 0700, true);
                if (!@copy($c, $z)) throw new RuntimeException('Záloha súboru zlyhala.');
            }
            $zoznam[] = ['druh' => $p['druh'], 'cesta' => $p['cesta'], 'bolo' => $bolo, 'nova' => !empty($p['nova'])];
        }
        $plan = ['id' => $id, 'cas' => date('c'), 'stav' => 'zacate', 'verzia_pred' => self::verzia(), 'subory' => $zoznam] + $meta;
        Ulozisko::zapis($dir . '/plan.json', json_encode($plan, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        // poradie: zdroj a kópie zostavenia, potom verejné súbory, verejné stránky HTML ako posledné
        $poradie = fn($p) => $p['druh'] !== 'web' ? 0 : (str_ends_with($p['cesta'], '.html') ? 2 : 1);
        usort($polozky, fn($a, $b) => $poradie($a) <=> $poradie($b));
        foreach ($polozky as $p) {
            $c = self::ciel($p);
            if (isset($p['subor'])) { $t = (string) file_get_contents($p['subor']); Ulozisko::zapis($c, $t); }
            elseif ($p['obsah'] === null) { if (is_file($c)) @unlink($c); }
            else Ulozisko::zapis($c, $p['obsah']);
        }
        $plan['stav'] = 'hotove'; $plan['verzia_po'] = self::verzia();
        Ulozisko::zapis($dir . '/plan.json', json_encode($plan, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        self::upracZalohy();
        return $id;
    }

    /** Meno zálohy = čas na mikrosekundy; vždy väčšie než meno poslednej zálohy (poradie záloh je poradie mien,
     *  aj pri dvoch uloženiach v tej istej sekunde alebo po posune hodín servera). */
    private static function noveId(): string
    {
        $t = microtime(true);
        $id = date('Ymd-His', (int) $t) . '-' . sprintf('%06d', (int) (($t - floor($t)) * 1000000));
        $d = glob(Miesto::u('zalohy/*'), GLOB_ONLYDIR) ?: [];
        $posl = $d ? basename(end($d)) : '';
        if ($posl !== '' && preg_match('/^(\d{8}-\d{6})-(\d{6})$/', $posl, $m) && strcmp($id, $posl) <= 0)
            $id = (int) $m[2] < 999999 ? $m[1] . '-' . sprintf('%06d', (int) $m[2] + 1) : $id;
        while (is_dir(Miesto::u('zalohy/' . $id))) { usleep(1000); $t = microtime(true); $id = date('Ymd-His', (int) $t) . '-' . sprintf('%06d', (int) (($t - floor($t)) * 1000000)); }
        return $id;
    }

    private static function plan(string $id): ?array
    {
        if (!preg_match('/^\d{8}-\d{6}-\d{6}$/', $id)) return null;
        $p = json_decode((string) @file_get_contents(Miesto::u("zalohy/$id/plan.json")), true);
        return is_array($p) && ($p['id'] ?? '') === $id ? $p : null;
    }

    private static function zapisPlan(array $p): void
    {
        Ulozisko::zapis(Miesto::u("zalohy/{$p['id']}/plan.json"), json_encode($p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    }

    /** Zálohy od najnovšej (id sa začína časom). */
    public static function zalohy(): array
    {
        $von = [];
        foreach (array_reverse(glob(Miesto::u('zalohy/*'), GLOB_ONLYDIR) ?: []) as $d) { $p = self::plan(basename($d)); if ($p) $von[] = $p; }
        return $von;
    }

    /** Nedokončený zápis (plán v stave „zacate“) vráti zo zálohy. Bez zámku (iné uloženie práve beží) nič nerobí. */
    public static function obnovPrerusene(bool $mamZamok = false): bool
    {
        $nedokoncene = array_values(array_filter(self::zalohy(), fn($p) => ($p['stav'] ?? '') === 'zacate'));
        if (!$nedokoncene) return false;
        $zamok = $mamZamok ? null : Ulozisko::zamok(Miesto::u('zamok'));
        if (!$mamZamok && !$zamok) return false;
        try {
            foreach ($nedokoncene as $p) {
                foreach ($p['subory'] as $s) {
                    $c = self::ciel($s); $z = Miesto::u("zalohy/{$p['id']}/{$s['druh']}/{$s['cesta']}");
                    if (!empty($s['nova'])) continue;                 // nová fotka ostane (nepoužitá), nič neprepísala
                    if ($s['bolo']) { if (is_file($z)) Ulozisko::zapis($c, (string) file_get_contents($z)); }
                    elseif (is_file($c)) @unlink($c);
                }
                $p['stav'] = 'prerusene-vratene';
                self::zapisPlan($p);
                Dennik::zapis('zapis-preruseny-vrateny', ['zaloha' => $p['id']]);
            }
            return true;
        } finally { Ulozisko::odomkni($zamok); }
    }

    /** Krok späť: vráti súbory do stavu pred posledným uložením (alebo vráti späť posledný krok späť). */
    public static function spat(string $kto): array
    {
        $zamok = Ulozisko::zamok(Miesto::u('zamok'), true, 10);
        if (!$zamok) return ['ok' => false, 'kod' => 503, 'chyba' => 'Práve prebieha iné uloženie. Skús to o chvíľu.'];
        try {
            self::obnovPrerusene(true);
            $b = null;
            foreach (self::zalohy() as $p) if (($p['stav'] ?? '') === 'hotove') { $b = $p; break; }
            if (!$b) return ['ok' => false, 'kod' => 400, 'chyba' => 'Niet čo vrátiť: žiadne uloženie so zálohou.'];
            $polozky = [];
            foreach ($b['subory'] as $s) {
                if (!empty($s['nova'])) continue;
                $z = Miesto::u("zalohy/{$b['id']}/{$s['druh']}/{$s['cesta']}");
                $polozky[] = ['druh' => $s['druh'], 'cesta' => $s['cesta'], 'obsah' => $s['bolo'] ? (string) file_get_contents($z) : null];
            }
            $spatSpat = ($b['typ'] ?? '') === 'spat';
            $id = self::vykonaj($polozky, ['typ' => 'spat', 'kto' => $kto, 'vracia' => $b['id'], 'zmeny' => [$spatSpat ? 'Vrátený krok späť' : 'Krok späť: ' . implode('; ', array_slice($b['zmeny'] ?? [], 0, 3))]]);
            $b['stav'] = 'vratene'; self::zapisPlan($b);
            // vrátený krok späť: uloženie, ktoré ten krok vracal, opäť platí a dá sa vrátiť znova
            if ($spatSpat && ($povodne = self::plan((string) ($b['vracia'] ?? ''))) && ($povodne['stav'] ?? '') === 'vratene') { $povodne['stav'] = 'hotove'; self::zapisPlan($povodne); $n = self::plan($id); $n['stav'] = 'vratene'; self::zapisPlan($n); }
            Dennik::zapis('krok-spat', ['zaloha' => $id, 'vracia' => $b['id']]);
            return ['ok' => true, 'verzia' => self::verzia(), 'vratene' => $b['zmeny'] ?? [], 'spat_spat' => $spatSpat];
        } finally { Ulozisko::odomkni($zamok); }
    }

    /** Posledné uloženia pre obrazovku História (čas, kto, čo). */
    public static function historia(int $n = 30): array
    {
        $von = [];
        foreach (array_slice(self::zalohy(), 0, $n) as $p) $von[] = ['id' => $p['id'], 'cas' => $p['cas'] ?? '', 'kto' => $p['kto'] ?? '', 'typ' => $p['typ'] ?? '', 'stav' => $p['stav'] ?? '', 'zmeny' => $p['zmeny'] ?? []];
        return $von;
    }

    /** Dá sa urobiť krok späť? Vráti popis toho, čo by sa vrátilo, alebo null. */
    public static function daSaVratit(): ?array
    {
        foreach (self::zalohy() as $p) if (($p['stav'] ?? '') === 'hotove') return ['typ' => $p['typ'] ?? '', 'cas' => $p['cas'] ?? '', 'zmeny' => $p['zmeny'] ?? []];
        return null;
    }

    private static function upracZalohy(): void
    {
        $d = array_reverse(glob(Miesto::u('zalohy/*'), GLOB_ONLYDIR) ?: []);
        $spolu = 0;
        foreach ($d as $i => $x) {
            $spolu += Ulozisko::velkostStromu($x);
            if ($i >= self::ZALOH || ($i > 0 && $spolu > self::ZALOH_BAJTOV)) Ulozisko::zmazStrom($x);
        }
    }

    // ---------- po nahratí novšieho balíka ----------
    /** Líši sa balík na hostingu od toho, ktorý správa naposledy prevzala? */
    public static function novyBalik(): bool
    {
        $n = Ulozisko::citaj(Miesto::u('nastavenie.php'), []);
        return ($n['verzia_balika']['commit'] ?? null) !== (self::verziaBalika()['commit'] ?? '') || ($n['verzia_balika']['cas'] ?? null) !== (self::verziaBalika()['cas'] ?? '');
    }

    /** Zapamätá verziu balíka, ktorý je na hostingu (prvé nastavenie; zdroj sa nemení). */
    public static function zapamatajBalik(): void
    {
        $vb = self::verziaBalika();
        Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($vb) { $n['verzia_balika'] = ['commit' => $vb['commit'] ?? '', 'cas' => $vb['cas'] ?? '']; return $n; });
    }

    /** $rezim 'novy' = prevziať nový balík (moje úpravy zo zdroja preč, sú v zálohe); 'moje' = ponechať moje úpravy a znovu
     *  ich zverejniť. Súbor s kódom sa pri 'moje' zverejní len vtedy, keď sa od kódu nového balíka líši iba v čísliciach
     *  a e‑maile; inak ostane kód nového balíka a súbor sa vypíše v 'vynechane'. */
    public static function prevezmiBalik(string $rezim, string $kto): array
    {
        $zamok = Ulozisko::zamok(Miesto::u('zamok'), true, 10);
        if (!$zamok) return ['ok' => false, 'chyba' => 'Práve prebieha iné uloženie. Skús to o chvíľu.'];
        try {
            self::obnovPrerusene(true);
            $polozky = []; $vynechane = [];
            foreach (self::upravene() as $c) {
                $z = Mapa::zdroj($c); $text = (string) file_get_contents(Miesto::u('zdroj/' . $c));
                if ($rezim !== 'moje') { $polozky[] = ['druh' => 'zdroj', 'cesta' => $c, 'obsah' => null]; continue; }
                if ($z[0] === null) continue;
                $naWebe = is_file(Miesto::w($z[0])) ? (string) file_get_contents(Miesto::w($z[0])) : null;
                if ($z[1] === 'kod' && ($naWebe === null || !Mapa::kodOk($naWebe, $text))) { $vynechane[] = $c; $polozky[] = ['druh' => 'zdroj', 'cesta' => $c, 'obsah' => null]; continue; }
                $polozky[] = ['druh' => 'web', 'cesta' => $z[0], 'obsah' => $text];
            }
            foreach (array_keys(Mapa::ZOSTAVENE) as $c) {
                $f = Miesto::u('zostavene/' . $c);
                if (!is_file($f)) continue;
                if ($rezim === 'moje') { $t = (string) file_get_contents($f); if (Mapa::kontrolaVerejna($c, $t) === null) $polozky[] = ['druh' => 'web', 'cesta' => $c, 'obsah' => $t]; else $vynechane[] = $c; }
                else $polozky[] = ['druh' => 'zostavene', 'cesta' => $c, 'obsah' => null];
            }
            $id = $polozky ? self::vykonaj($polozky, ['typ' => 'balik', 'kto' => $kto, 'zmeny' => [$rezim === 'moje' ? 'Nový balík: ponechané moje úpravy' : 'Nový balík: prevzatý']]) : '';
            $vb = self::verziaBalika();
            Ulozisko::uprav(Miesto::u('nastavenie.php'), function ($n) use ($vb) { $n['verzia_balika'] = ['commit' => $vb['commit'] ?? '', 'cas' => $vb['cas'] ?? '']; return $n; });
            Dennik::zapis('balik-prevzaty', ['rezim' => $rezim, 'commit' => $vb['commit'] ?? '', 'vynechane' => $vynechane]);
            return ['ok' => true, 'vynechane' => $vynechane, 'zaloha' => $id];
        } finally { Ulozisko::odomkni($zamok); }
    }
}
