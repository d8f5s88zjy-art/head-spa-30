<?php
// Úkony správy pre novinky, oznamy k otváracím hodinám, fotky galérie, texty stránok a kontakt. Ako Ulohy: z formulára
// vyrobia nové údaje (nič nezapisujú na web), výsledok ide do konceptu a na web až po náhľade a ťuknutí Zverejniť.
defined('SPRAVA') || exit;

final class Obsah
{
    // ---------- oznamy k otváracím hodinám (sviatky, dovolenka, mimoriadne hodiny) ----------
    /** Oznamy, ktorých posledný deň už bol, sa pri ďalšej zmene hodín z údajov vynechajú (na webe ich skryje site.js). */
    public static function bezStarychVynimiek(array $D): array
    {
        $dnes = date('Y-m-d');
        $D['firma']['vynimky'] = array_values(array_filter($D['firma']['vynimky'] ?? [], fn($v) => $v['do'] >= $dnes));
        return $D;
    }

    public static function vynimkaPridat(array $D, array $post): array
    {
        $od = (string)($post['od'] ?? ''); $do = (string)($post['do'] ?? '') ?: $od;
        if (Kontrola::datum($od) === null) return [$D, 'Zadajte, od ktorého dňa oznam platí.'];
        if (Kontrola::datum($do) === null) return [$D, 'Dátum „do“ nie je platný.'];
        if ($do < $od) return [$D, 'Dátum „do“ musí byť rovnaký alebo neskorší ako „od“.'];
        if ($do < date('Y-m-d')) return [$D, 'Tento termín už prešiel.'];
        if ((strtotime($do) - strtotime($od)) / 86400 > 92) return [$D, 'Oznam môže platiť najviac 3 mesiace. Pri dlhšej zmene upravte bežné otváracie hodiny.'];
        $nazov = Kontrola::text($post['nazov'] ?? '', 200);
        if ($nazov !== '' && ($e = Kontrola::chybaTextu($nazov, 'Názov (napríklad Vianoce)', 2, 30))) return [$D, $e];
        $v = ['od' => $od, 'do' => $do, 'nazov' => $nazov, 'zatvorene' => ($post['druh'] ?? 'zatvorene') !== 'otvorene'];
        if (!$v['zatvorene']) {
            $co = (string)($post['cas_od'] ?? ''); $cd = (string)($post['cas_do'] ?? '');
            foreach ([$co, $cd] as $c) if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $c)) return [$D, 'Zadajte čas otvorenia aj zatvorenia v tvare 7:00.'];
            if ($co >= $cd) return [$D, 'Čas zatvorenia musí byť neskôr ako otvorenia.'];
            $v['cas_od'] = $co; $v['cas_do'] = $cd;
        }
        $D = self::bezStarychVynimiek($D);
        if (count($D['firma']['vynimky']) >= 8) return [$D, 'Naraz môže byť najviac 8 oznamov. Najprv odstráňte starší.'];
        $D['firma']['vynimky'][] = $v;
        usort($D['firma']['vynimky'], fn($a, $b) => [$a['od'], $a['do']] <=> [$b['od'], $b['do']]);
        return [$D, null];
    }

    public static function vynimkaZmazat(array $D, int $i): array
    {
        $D = self::bezStarychVynimiekZachovajIndex($D);
        if (!isset($D['firma']['vynimky'][$i])) return [$D, 'Oznam neexistuje.'];
        array_splice($D['firma']['vynimky'], $i, 1);
        return [$D, null];
    }

    private static function bezStarychVynimiekZachovajIndex(array $D): array
    {
        $D['firma']['vynimky'] = array_values($D['firma']['vynimky'] ?? []);
        return $D;
    }

    // ---------- novinky ----------
    public static function index(array $D, string $id): ?int
    {
        foreach ($D['novinky']['novinky'] as $i => $n) if ($n['id'] === $id) return $i;
        return null;
    }

    /** Odseky z textového poľa (prázdny riadok = nový odsek). */
    public static function odseky(string $t): array
    {
        $t = str_replace("\r", '', $t);
        $von = [];
        foreach (preg_split('/\n\s*\n/u', $t) as $o) { $o = Kontrola::text(str_replace("\n", ' ', $o), 2000); if ($o !== '') $von[] = $o; }
        return $von;
    }

    /** Uloží novinku z formulára ($id null = nová). Vráti [$D, chyba, varovania, id]. */
    public static function novinka(array $D, ?string $id, array $post, array $files): array
    {
        $K = Nastavenie::konstanty();
        $i = $id === null ? null : self::index($D, $id);
        if ($id !== null && $i === null) return [$D, 'Novinka neexistuje.', [], $id];
        $stara = $i === null ? null : $D['novinky']['novinky'][$i];
        if ($stara && (int)($post['verzia'] ?? -1) !== (int)$stara['verzia']) return [$D, 'Medzitým túto novinku niekto zmenil. Otvorte ju znova.', [], $id];
        $n = $stara ?? ['id' => '', 'stranka' => '', 'zdroj' => 'sprava', 'viditelna' => true, 'verzia' => 0, 'na_uvode' => false, 'popis_uvod' => null,
                        'karta' => ['druh' => 'prazdna'], 'hlavicka' => null, 'seo' => null, 'odseky' => [], 'fotky' => [], 'pdf' => []];
        $nazov = Kontrola::text($post['nazov'] ?? '', 200);
        if ($e = Kontrola::chybaTextu($nazov, 'Názov', 3, 45)) return [$D, $e, [], $id];
        if (Seo::slova($nazov) < 1 || Seo::slova($nazov) > 7) return [$D, 'Názov môže mať najviac 7 slov.', [], $id];
        $popis = Kontrola::text($post['popis'] ?? '', 1000);
        if ($e = Kontrola::chybaTextu($popis, 'Krátky popis', 30, 200)) return [$D, $e, [], $id];
        $odseky = self::odseky((string)($post['text'] ?? ''));
        if (count($odseky) > 20) return [$D, 'Text môže mať najviac 20 odsekov.', [], $id];
        foreach ($odseky as $o) if ($e = Kontrola::chybaTextu($o, 'Text', 2, 1500)) return [$D, $e, [], $id];
        if ($stara === null && !$odseky) return [$D, 'Napíšte aspoň jeden odsek textu novinky.', [], $id];
        // nová novinka: id a stránka
        if ($stara === null) {
            $zaklad = Kontrola::slug($nazov); $slug = $zaklad; $k = 2;
            while (self::index($D, $slug) !== null || is_file(Nastavenie::w("novinky/$slug.html")) || $slug === 'index') $slug = $zaklad . '-' . $k++;
            $n['id'] = $slug; $n['stranka'] = "novinky/$slug.html";
        }
        // SEO: pri novej a pri zmene názvu alebo popisu sa zloží znova (pôvodné novinky majú ručné texty, kým sa nezmenia)
        if ($stara === null || $stara['nazov'] !== $nazov || $stara['popis'] !== $popis) {
            $p = Seo::popis($nazov, 'novinka', $popis);
            $n['seo'] = ['h1' => $nazov, 'titulok' => $nazov, 'popis' => $p];
            if ($ch = Seo::chyby($nazov, Typografia::txt($nazov), Typografia::txt($p))) return [$D, implode(' ', $ch) . ' Skráťte alebo predĺžte názov či krátky popis.', [], $id];
        }
        // fotky: odstránenie, popisy, nová fotka
        $fotky = [];
        foreach ($n['fotky'] as $j => $f) if (empty($post['foto_zmazat'][$j])) { $f['popis'] = Kontrola::text($post['foto_popis'][$j] ?? ($f['popis'] ?? ''), 200); $fotky[] = $f; }
        foreach ($fotky as $f) if ($f['popis'] !== '' && ($e = Kontrola::chybaTextu($f['popis'], 'Popis fotky', 2, 120))) return [$D, $e, [], $id];
        if (!empty($files['foto']['name'])) {
            $pf = Kontrola::text($post['foto_popis_novy'] ?? '', 200);
            if ($pf !== '' && ($e = Kontrola::chybaTextu($pf, 'Popis fotky', 2, 120))) return [$D, $e, [], $id];
            if (count($fotky) >= 12) return [$D, 'Novinka môže mať najviac 12 fotiek.', [], $id];
            $f = Subory::fotka($files['foto'], $nazov);
            if (is_string($f)) return [$D, $f, [], $id];
            $fotky[] = self::fotkaZNahravky($f, $pf, 'sprava');
        }
        // PDF
        $pdf = [];
        foreach ($n['pdf'] as $j => $p) if (empty($post['pdf_zmazat'][$j])) $pdf[] = $p;
        if (!empty($files['pdf']['name'])) {
            $f = Subory::pdf($files['pdf'], $nazov);
            if (is_string($f)) return [$D, $f, [], $id];
            $dat = $f['datum'] ? Kontrola::datum($f['datum']) : null;
            $pdf[] = ['subor' => $f['subor'], 'text' => "Novinka – $nazov (PDF" . ($dat ? ", $dat" : '') . ')'];
        }
        if (count($pdf) > 6) return [$D, 'Novinka môže mať najviac 6 PDF.', [], $id];
        // karta: pri novej novinke prvá fotka; pôvodné si nechajú svoju kartu
        if ($n['zdroj'] === 'sprava') $n['karta'] = $fotky ? ['druh' => 'foto', 'src' => $fotky[0]['webp'][0][1], 'w' => $fotky[0]['webp'][0][0], 'h' => (int)round($fotky[0]['h'] * $fotky[0]['webp'][0][0] / $fotky[0]['w'])] : ['druh' => 'prazdna'];
        // hlavička: len z hotových fotiek hlavičiek alebo bez fotky
        $hl = (string)($post['hlavicka'] ?? '');
        $n['hlavicka'] = $hl === 'bez' ? null : (isset($K['hlavicky'][$hl]) ? $hl : $n['hlavicka']);
        // kategórie katalógu
        $kat = array_values(array_filter((array)($post['kategorie'] ?? []), fn($k) => is_string($k) && isset($K['nazvy'][$k]) && substr_count($k, '/') === 1));
        foreach ($D['novinky']['kategorie'] as $k => $zoz) $D['novinky']['kategorie'][$k] = array_values(array_filter($zoz, fn($x) => $x !== $n['id'] || in_array($k, $kat, true)));
        foreach ($kat as $k) if (!in_array($n['id'], $D['novinky']['kategorie'][$k] ?? [], true)) $D['novinky']['kategorie'][$k][] = $n['id'];
        $D['novinky']['kategorie'] = array_filter($D['novinky']['kategorie']);
        ksort($D['novinky']['kategorie']);
        $na_uvode = !empty($post['na_uvode']);
        $var = [];
        if ($stara && $stara['popis'] !== $popis) $n['popis_uvod'] = null;   // úvod ukáže nový popis
        $n = array_merge($n, ['nazov' => $nazov, 'popis' => $popis, 'odseky' => $odseky, 'fotky' => $fotky, 'pdf' => $pdf, 'na_uvode' => $na_uvode, 'verzia' => $n['verzia'] + 1]);
        if ($i === null) array_unshift($D['novinky']['novinky'], $n); else $D['novinky']['novinky'][$i] = $n;
        if ($na_uvode && (!$stara || !$stara['na_uvode'])) {
            $uvod = array_values(array_filter($D['novinky']['novinky'], fn($x) => $x['viditelna'] && !empty($x['na_uvode'])));
            if (count($uvod) > 4) $var[] = 'Na úvode sú miesta pre 4 novinky. Ukážu sa prvé štyri v poradí zoznamu Novinky; „' . $uvod[4]['nazov'] . '“ sa na úvode neukáže.';
        }
        return [$D, null, $var, $n['id']];
    }

    public static function novinkaViditelnost(array $D, string $id, bool $vid): array
    {
        $i = self::index($D, $id);
        if ($i === null) return [$D, 'Novinka neexistuje.'];
        $D['novinky']['novinky'][$i]['viditelna'] = $vid;
        $D['novinky']['novinky'][$i]['verzia']++;
        return [$D, null];
    }

    public static function novinkaPosun(array $D, string $id, int $smer): array
    {
        $i = self::index($D, $id); $j = $i === null ? null : $i + $smer;
        if ($i === null || $j < 0 || $j >= count($D['novinky']['novinky'])) return [$D, null];
        [$D['novinky']['novinky'][$i], $D['novinky']['novinky'][$j]] = [$D['novinky']['novinky'][$j], $D['novinky']['novinky'][$i]];
        return [$D, null];
    }

    /** Fotka z nahrávky (Subory::fotka) do údajov galérie alebo novinky. */
    public static function fotkaZNahravky(array $f, string $popis, string $id): array
    {
        return ['id' => $id . '-' . substr(md5($f['src']), 0, 8), 'popis' => $popis, 'velka' => $f['velka'], 'src' => end($f['sirky'])[1], 'w' => $f['w'], 'h' => $f['h'], 'pos' => '',
                'webp' => $f['sirky'], 'avif' => $f['avif'] ?? [], 'viditelna' => true, 'zdroj' => 'sprava'];
    }

    // ---------- galéria ----------
    /** Albumy Máriových grafík (rámiky s celým obrázkom; položka môže mať plati_pri – údaje, ktoré má v obrázku). */
    const ALBUMY_GRAFIKY = ['letaky', 'grafika'];

    private static function album(array $D, string $album): ?int
    {
        foreach ($D['galeria']['albumy'] as $i => $a) if ($a['id'] === $album) return $i;
        return null;
    }

    /** Úkon s fotkou galérie: pridat, nahradit, popis, skryt, zobrazit, vyssie, nizsie. */
    public static function galeria(array $D, string $ukon, array $post, array $files): array
    {
        $ai = self::album($D, (string)($post['album'] ?? ''));
        if ($ai === null) return [$D, 'Album neexistuje.'];
        $fotky = &$D['galeria']['albumy'][$ai]['fotky'];
        if ($ukon === 'pridat') {
            $popis = Kontrola::text($post['popis'] ?? '', 200);
            if ($e = Kontrola::chybaTextu($popis, 'Popis fotky', 10, 120)) return [$D, $e . ' Popis čítajú aj nevidiaci a Google, napríklad „Palety tehál v areáli predajne“.'];
            if (count($fotky) >= 40) return [$D, 'Album môže mať najviac 40 fotiek. Najprv niektorú skryte.'];
            $f = Subory::fotka($files['foto'] ?? [], $popis);
            if (is_string($f)) return [$D, $f];
            array_unshift($fotky, self::fotkaZNahravky($f, $popis, 'foto'));
            return [$D, null];
        }
        $j = null;
        foreach ($fotky as $k => $f) if ($f['id'] === (string)($post['foto'] ?? '')) $j = $k;
        if ($j === null) return [$D, 'Fotka neexistuje.'];
        switch ($ukon) {
            case 'nahradit':
                $f = Subory::fotka($files['foto'] ?? [], $fotky[$j]['popis']);
                if (is_string($f)) return [$D, $f];
                // nová položka nemá plati_pri: nahratý obrázok nesie nové údaje, podmienka starého obrázka zaniká
                $fotky[$j] = array_merge(self::fotkaZNahravky($f, $fotky[$j]['popis'], 'foto'), ['viditelna' => $fotky[$j]['viditelna'] ?? true]);
                break;
            case 'popis':
                $popis = Kontrola::text($post['popis'] ?? '', 200);
                if ($e = Kontrola::chybaTextu($popis, 'Popis fotky', 10, 120)) return [$D, $e];
                $fotky[$j]['popis'] = $popis;
                break;
            case 'skryt': case 'zobrazit':
                $fotky[$j]['viditelna'] = $ukon === 'zobrazit';
                // albumy grafiky (Letáky a bannery, Logo a firemná grafika) smú ostať prázdne: ich časť potom z webu zmizne celá
                if (!in_array($D['galeria']['albumy'][$ai]['id'], self::ALBUMY_GRAFIKY, true) && !array_filter($fotky, fn($x) => $x['viditelna'] ?? true)) return [$D, 'V albume musí ostať aspoň jedna fotka.'];
                break;
            case 'vyssie': case 'nizsie':
                $k = $j + ($ukon === 'vyssie' ? -1 : 1);
                if ($k >= 0 && $k < count($fotky)) [$fotky[$j], $fotky[$k]] = [$fotky[$k], $fotky[$j]];
                break;
            default: return [$D, 'Neznámy úkon.'];
        }
        return [$D, null];
    }

    // ---------- texty stránok ----------
    /** Polia textov: kľúč => [nadpis pre Mária, stránka, min, max]. */
    const TEXTY = [
        'uvod_lede' => ['Úvod – veta pod hlavným nadpisom', 'index.html', 40, 200],
        'uvod_onas' => ['Úvod – časť „Rodinná firma od roku 1997“ (odseky)', 'index.html', 30, 400],
        'sluzby_uvod' => ['Služby – veta pod nadpisom', 'sluzby.html', 40, 200],
        'sluzby' => ['Služby – zoznam služieb', 'sluzby.html', 20, 300],
        'onas' => ['O nás – text (odseky)', 'o-nas.html', 30, 600],
        'doprava' => ['Doprava – štyri hlavné body', 'doprava.html', 20, 300],
    ];

    private static function chybaTextuStranky(string $v, string $pole, int $min, int $max, bool $telefon = false): ?string
    {
        return Kontrola::chybaTextu($telefon ? str_replace('{telefon}', 'telefón', $v) : $v, $pole, $min, $max);
    }

    public static function texty(array $D, array $post): array
    {
        $T = $D['texty'];
        foreach (['uvod_lede', 'sluzby_uvod'] as $k) {
            [$n, , $mi, $ma] = self::TEXTY[$k];
            $v = Kontrola::text($post[$k] ?? '', 1000);
            if ($e = Kontrola::chybaTextu($v, "„{$n}“", $mi, $ma)) return [$D, $e];
            $T[$k] = $v;
        }
        foreach (['uvod_onas', 'onas'] as $k) {
            [$n, , $mi, $ma] = self::TEXTY[$k];
            $o = self::odseky((string)($post[$k] ?? ''));
            if (!$o || count($o) > 6) return [$D, "Text „{$n}“ musí mať 1 až 6 odsekov."];
            foreach ($o as $x) if ($e = Kontrola::chybaTextu($x, "„{$n}“", $mi, $ma)) return [$D, $e];
            $T[$k] = $o;
        }
        foreach (['sluzby', 'doprava'] as $k) {
            $zoz = [];
            foreach (array_slice((array)($post[$k] ?? []), 0, 12) as $r) {
                if (!is_array($r)) continue;
                $t = Kontrola::text($r['nazov'] ?? '', 200); $d = Kontrola::text($r['text'] ?? '', 1000);
                if ($t === '' && $d === '') continue;
                if ($e = Kontrola::chybaTextu($t, 'Nadpis bodu', 3, 60)) return [$D, $e];
                if ($e = self::chybaTextuStranky($d, "Text bodu „{$t}“", 20, 300, $k === 'doprava')) return [$D, $e];
                $zoz[] = [$t, $d];
            }
            if (count($zoz) < 2) return [$D, 'V zozname „' . self::TEXTY[$k][0] . '“ musia ostať aspoň 2 body.'];
            $T[$k] = $zoz;
        }
        $D['texty'] = $T;
        return [$D, null];
    }

    // ---------- kontakt ----------
    /** Telefón do tvaru webu: mobil 0905 622 223, pevná linka 037 651 17 77; vráti [zobrazenie, tel] alebo null. */
    public static function telefon(string $v, bool $mobil): ?array
    {
        $c = preg_replace('/[\s\/-]/', '', $v);
        if (str_starts_with($c, '+421')) $c = '0' . substr($c, 4); elseif (str_starts_with($c, '00421')) $c = '0' . substr($c, 5);
        if (!preg_match('/^0\d{9}$/', $c)) return null;
        if ($mobil && !str_starts_with($c, '09')) return null;
        $zobr = $mobil ? substr($c, 0, 4) . ' ' . substr($c, 4, 3) . ' ' . substr($c, 7, 3) : substr($c, 0, 3) . ' ' . substr($c, 3, 3) . ' ' . substr($c, 6, 2) . ' ' . substr($c, 8, 2);
        return [$zobr, '+421' . substr($c, 1)];
    }

    public static function kontakt(array $D, array $post): array
    {
        $m = self::telefon((string)($post['mobil'] ?? ''), true);
        if (!$m) return [$D, 'Mobil napíšte ako 10 číslic, napríklad 0905 622 223.'];
        $p = self::telefon((string)($post['pevna'] ?? ''), false);
        if (!$p) return [$D, 'Pevnú linku napíšte ako 10 číslic s predvoľbou, napríklad 037 651 17 77.'];
        $email = strtolower(Kontrola::text($post['email'] ?? '', 100));
        if (!preg_match('/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/', $email)) return [$D, 'E-mail nie je v správnom tvare.'];
        $nova = array_merge($D['firma'], ['mobil' => $m[0], 'mobil_tel' => $m[1], 'pevna' => $p[0], 'pevna_tel' => $p[1], 'email' => $email]);
        if ($nova['mobil'] === $nova['pevna']) return [$D, 'Mobil a pevná linka nemôžu byť rovnaké.'];
        $pary = Kontakt::pary($D['firma'], $nova);
        if (!$pary) return [$D, 'Kontakt je rovnaký ako na webe, nie je čo zmeniť.'];
        // všetky texty v údajoch (popis Kontaktu, časté otázky, texty stránok…) s novým kontaktom
        $nove = Kontakt::nahradVDatach(array_intersect_key($D, array_flip(Zmena::MENA)), $pary);
        foreach (Zmena::MENA as $k) $D[$k] = $nove[$k];
        $D['firma'] = array_merge($D['firma'], array_intersect_key($nova, array_flip(['mobil', 'mobil_tel', 'pevna', 'pevna_tel', 'email'])));
        return [$D, null];
    }
}
