<?php
// Úkony správy: z formulára vyrobia nové údaje (celé firma/cennik/akcie/caste). Nič nezapisujú na web – výsledok ide
// do konceptu (Zmena::ulozKoncept) a na web až po náhľade a ťuknutí Zverejniť.
defined('SPRAVA') || exit;

final class Ulohy
{
    const STITKY = ['Akciová cena', 'Znížené ceny', 'Na sklade', 'Doprava zdarma', 'Špeciálne zľavy', 'Zľava 10 %', 'Zľava 15 %', 'Zľava 20 %'];

    // ---------- otváracie hodiny ----------
    /** [$D, chyba] z polí den[1..7][otvorene, od, do]. */
    public static function hodiny(array $D, array $post): array
    {
        $dni = [];
        for ($d = 1; $d <= 7; $d++) {
            $x = $post['den'][$d] ?? [];
            if (empty($x['otvorene'])) continue;
            $od = (string)($x['od'] ?? ''); $do = (string)($x['do'] ?? '');
            foreach ([$od, $do] as $c) if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $c)) return [$D, 'Zadajte čas otvorenia aj zatvorenia v tvare 7:00 (deň ' . Vykreslenie::DNI_DLHO[$d] . ').'];
            if ($od >= $do) return [$D, 'V deň ' . mb_strtolower(Vykreslenie::DNI_DLHO[$d]) . ' musí byť čas zatvorenia neskôr ako otvorenia.'];
            $dni[$d] = [$od, $do];
        }
        if (!$dni) return [$D, 'Aspoň jeden deň musí byť otvorené.'];
        $skup = [];
        foreach ($dni as $d => $c) {
            $n = count($skup);
            if ($n && end($skup[$n - 1]['dni']) === $d - 1 && $skup[$n - 1]['od'] === $c[0] && $skup[$n - 1]['do'] === $c[1]) $skup[$n - 1]['dni'][] = $d;
            else $skup[] = ['dni' => [$d], 'od' => $c[0], 'do' => $c[1]];
        }
        $D['firma']['hodiny'] = $skup;
        // popis Kontaktu pre Google musí ostať v medziach
        $p = Vykreslenie::kontakt_popis($D);
        if (mb_strlen(Typografia::txt($p)) > 155) return [$D, 'Toľko rôznych časov sa nezmestí do popisu stránky Kontakt pre Google. Zlúčte dni s rovnakým časom.'];
        return [$D, null];
    }

    // ---------- akcie ----------
    /** Ceny akcie z cenníka, ktorý už nie je aktuálny (na webe sa neukazujú). Ceny zadané v správe sa ukazujú vždy. */
    public static function cenyStarehoCennika(array $a, array $D): bool
    {
        return !empty($a['ceny']) && empty($a['ceny_zadane']) && ($a['cennik'] ?? null) !== $D['cennik']['aktualny'];
    }

    public static function index(array $D, string $id): ?int
    {
        foreach ($D['akcie']['akcie'] as $i => $a) if ($a['id'] === $id) return $i;
        return null;
    }

    public static function normalizujCenu(string $c): ?string
    {
        $c = Kontrola::text($c, 40);
        if ($c === '') return null;
        $c = preg_replace('/(\d)\.(\d)/', '$1,$2', $c);
        $c = preg_replace('/\s*(eur|EUR|Eur)\b/u', ' €', $c);
        if (preg_match('/^\d{1,6}(,\d{1,2})?$/', $c)) $c .= ' €';
        $c = preg_replace('/(\d)\s*€/u', '$1 €', $c);
        $c = preg_replace('/€\s*\/\s*/u', '€/', $c);
        if (!preg_match('/\d/', $c)) return mb_strlen($c) <= 30 ? $c : null;   // „na dopyt“
        if (!preg_match('/^\d{1,6}(,\d{1,2})? €(\/[\p{L}²³0-9 .]{1,20})?( \+ [\p{L} ]{1,30})?$/u', $c)) return null;
        return $c;
    }

    /** Obrázok na karte akcie (Mário 18. 11. 2026: „akcie tovaru treba vymeniť obrázky“): celá fotka tovaru zmenšená na šírku
     *  300 px, bez výrezu letáku (D8) – nahlad s foto:true (karta ju ukáže celú, site.css .thumb.foto). Leták ani PDF nemení.
     *  „Odstrániť obrázok na karte“ vráti miniatúru letáku (ak leták je), inak karta ostane bez obrázka. Vráti akciu alebo chybu. */
    public static function kartaFoto(array $a, array $post, array $files, string $nazov)
    {
        if (!empty($post['karta_foto_zmazat']) && !empty($a['nahlad']['foto'])) $a['nahlad'] = self::nahladLetaku($a['letak'] ?? null);
        if (!empty($files['karta_foto']['name'])) {
            $f = Subory::fotka($files['karta_foto'], $nazov . ' karta', [300], false);
            if (is_string($f)) return $f;
            $a['nahlad'] = ['src' => $f['sirky'][0][1], 'w' => $f['w'], 'h' => $f['h'], 'foto' => true];
        }
        return $a;
    }

    /** Miniatúra letáku na kartu: najmenšia šírka nahratého letáku, pri letáku z pôvodného webu (img/p/ID.webp) jeho -400. */
    public static function nahladLetaku(?array $l): ?array
    {
        if (!$l) return null;
        if (!empty($l['sirky'])) return ['src' => $l['sirky'][0][1], 'w' => $l['sirky'][0][0], 'h' => (int)round($l['h'] * $l['sirky'][0][0] / $l['w'])];
        if (preg_match('~^img/p/(\d+)\.webp$~', $l['src'], $m) && is_file(Nastavenie::w("img/p/{$m[1]}-400.webp")))
            return ['src' => "img/p/{$m[1]}-400.webp", 'w' => 400, 'h' => (int)round($l['h'] * 400 / $l['w'])];
        return ['src' => $l['src'], 'w' => $l['w'], 'h' => $l['h']];
    }

    /** Uloží akciu z formulára. $id = null → nová. Vráti [$D, chyba, varovania, id]. */
    public static function akcia(array $D, ?string $id, array $post, array $files): array
    {
        $var = [];
        $K = Nastavenie::konstanty();
        $i = $id === null ? null : self::index($D, $id);
        if ($id !== null && $i === null) return [$D, 'Akcia neexistuje.', [], $id];
        $stara = $i === null ? null : $D['akcie']['akcie'][$i];
        $a = $stara ?? ['id' => '', 'stranka' => null, 'odkaz' => null, 'viditelna' => true, 'zdroj' => 'sprava', 'plati_do' => null, 'verzia' => 0,
                        'na_uvode' => false, 'seo' => null, 'hlavicka' => null, 'letak' => null, 'nahlad' => null, 'pdf' => [], 'ceny' => [],
                        'cennik' => null, 'katalog' => [], 'katalog_poradie' => null, 'stitok' => '', 'nazov' => '', 'karta' => ''];
        if ($stara && (int)($post['verzia'] ?? -1) !== (int)$stara['verzia']) return [$D, 'Medzitým túto akciu niekto zmenil. Otvorte ju znova.', [], $id];
        if ($stara && !$stara['stranka']) {   // karta bez vlastnej stránky (vedie do katalógu alebo noviniek)
            $nazov = Kontrola::text($post['nazov'] ?? '', 500); $stitok = Kontrola::text($post['stitok'] === 'vlastny' ? ($post['stitok_vlastny'] ?? '') : ($post['stitok'] ?? ''), 200); $karta = Kontrola::text($post['karta'] ?? '', 2000);
            foreach ([[$nazov, 'Názov', 3, 45], [$stitok, 'Štítok', 2, 18], [$karta, 'Text akcie', 10, 220]] as [$v, $n, $mi, $ma]) if ($e = Kontrola::chybaTextu($v, $n, $mi, $ma)) return [$D, $e, [], $id];
            $k = self::kartaFoto($stara, $post, $files, $nazov);   // obrázok na karte aj pri karte bez stránky (Garáže)
            if (is_string($k)) return [$D, $k, [], $id];
            $D['akcie']['akcie'][$i] = array_merge($k, ['nazov' => $nazov, 'stitok' => $stitok, 'karta' => $karta, 'verzia' => $stara['verzia'] + 1]);
            return [$D, null, [], $id];
        }
        $nazov = Kontrola::text($post['nazov'] ?? '', 500);
        if ($e = Kontrola::chybaTextu($nazov, 'Názov', 3, 45)) return [$D, $e, [], $id];
        if (Seo::slova($nazov) < 1 || Seo::slova($nazov) > 7) return [$D, 'Názov môže mať najviac 7 slov.', [], $id];
        $st = (string)($post['stitok'] ?? '');
        $stitok = $st === 'vlastny' ? Kontrola::text($post['stitok_vlastny'] ?? '', 200) : Kontrola::text($st, 200);
        if ($e = Kontrola::chybaTextu($stitok, 'Štítok', 2, 18)) return [$D, $e, [], $id];
        $karta = Kontrola::text($post['karta'] ?? '', 2000);
        if ($e = Kontrola::chybaTextu($karta, 'Text akcie', 30, 220)) return [$D, $e, [], $id];
        // ceny
        $tab = [];
        foreach (array_slice((array)($post['ceny'] ?? []), 0, 6) as $t) {
            if (!is_array($t)) continue;   // pole namiesto reťazca a naopak (podvrhnutý formulár) sa ticho vynechá
            $riadky = [];
            foreach (array_slice(is_array($t['r'] ?? null) ? $t['r'] : [], 0, 50) as $r) {
                if (!is_array($r)) continue;
                $pol = Kontrola::text($r['polozka'] ?? '', 500); $cena = (string)($r['cena'] ?? '');
                if ($pol === '' && trim($cena) === '') continue;
                if ($e = Kontrola::chybaTextu($pol, 'Výrobok', 2, 100)) return [$D, $e, [], $id];
                $c = self::normalizujCenu($cena);
                if ($c === null) return [$D, 'Cenu pri „' . $pol . '“ napíšte ako číslo a jednotku, napríklad 4,42 €/vrece.', [], $id];
                $riadky[] = [$pol, $c];
            }
            $nadpis = Kontrola::text($t['nadpis'] ?? '', 120);
            $pozn = Kontrola::text($t['poznamka'] ?? '', 400);
            if (!$riadky) continue;
            if ($e = Kontrola::chybaTextu($nadpis !== '' ? $nadpis : 'Ceny', 'Nadpis tabuľky', 2, 100)) return [$D, $e, [], $id];
            if ($pozn !== '' && ($e = Kontrola::chybaTextu($pozn, 'Poznámka', 2, 300))) return [$D, $e, [], $id];
            $tab[] = ['nadpis' => $nadpis !== '' ? $nadpis : 'Ceny akcie', 'riadky' => $riadky, 'poznamka' => $pozn];
        }
        $ceny_zmenene = json_encode($tab) !== json_encode($a['ceny']);
        // stará cena v texte: náhľad ponúkne jedným ťuknutím nahradiť ju všade (S2); na fotke letáku ju správa nezmení
        $nahrady = [];
        if ($stara && $ceny_zmenene) {
            $nove = array_merge(...array_map(fn($t) => array_column($t['riadky'], 1), $tab ?: [['riadky' => []]]));
            $novePodla = [];
            foreach ($tab as $t) foreach ($t['riadky'] as $r) $novePodla[$r[0]] = $r[1];
            foreach ($stara['ceny'] as $t) foreach ($t['riadky'] as $r) {
                if (in_array($r[1], $nove, true)) continue;
                $cislo = preg_replace('/\s*€.*$/u', '', $r[1]);
                $kde = [];
                foreach (['karta' => $karta, 'stitok' => $stitok, 'Popis pre Google' => $stara['seo']['popis'] ?? '', 'Nadpis stránky' => $stara['seo']['h1'] ?? '', 'Názov pre Google' => $stara['seo']['titulok'] ?? ''] as $k => $text)
                    if ($cislo !== '' && preg_match('/(?<![\d,])' . preg_quote($cislo, '/') . '(?![\d,])/u', $text)) $kde[] = $k === 'karta' ? 'Text akcie' : ($k === 'stitok' ? 'Štítok' : $k);
                $nova = isset($novePodla[$r[0]]) ? preg_replace('/\s*€.*$/u', '', $novePodla[$r[0]]) : null;
                if ($kde && $nova !== null && preg_match('/\d/', $nova)) $nahrady[] = ['stara' => $cislo, 'nova' => $nova, 'kde' => $kde];
                elseif ($kde) $var[] = "Stará cena $cislo € je ešte v poliach: " . implode(', ', $kde) . '. Prepíšte ju, ak sa zmenila (Nadpis a texty pre Google sú v časti „Ďalšie nastavenia“).';
            }
            if ($stara['letak'] || $stara['pdf']) $var[] = 'Cena na fotke letáku a v letákoch PDF sa sama nezmení. Ak je na nich stará cena, odfoťte nový leták alebo ho pri akcii odstráňte.';
        }
        // katalóg
        $kat = array_values(array_filter((array)($post['katalog'] ?? []), fn($k) => is_string($k) && isset($K['nazvy'][$k])));
        // na úvode
        $na_uvode = !empty($post['na_uvode']);
        // hlavička
        $hl = (string)($post['hlavicka'] ?? '');
        // S5: bez výberu nová akcia dostane fotku podľa tovaru v katalógu, inak hlavičku bez fotky (nie cudzí tovar)
        if ($hl === 'bez') $hl = null;
        elseif ($hl === '' || !isset($K['hlavicky'][$hl])) $hl = $stara ? $a['hlavicka'] : ($kat ? ($K['kat_hlavicka'][$kat[0]] ?? null) : null);
        // platí do
        $plati = trim((string)($post['plati_do'] ?? ''));
        if ($plati !== '' && Kontrola::datum($plati) === null) return [$D, 'Dátum „Platí do“ nie je platný.', [], $id];
        // nová akcia: id a stránka
        if ($stara === null) {
            $zaklad = Kontrola::slug($nazov); $slug = $zaklad; $n = 2;
            while (self::index($D, $slug) !== null || is_file(Nastavenie::w("akcie/$slug.html")) || $slug === 'index') $slug = $zaklad . '-' . $n++;
            $a['id'] = $slug; $a['stranka'] = "akcie/$slug.html";
        }
        // SEO
        $seo = $a['seo'] ?? ['h1' => '', 'titulok' => '', 'popis' => ''];
        $seo_h1 = Kontrola::text($post['seo_h1'] ?? '', 500); $seo_t = Kontrola::text($post['seo_titulok'] ?? '', 500); $seo_p = Kontrola::text($post['seo_popis'] ?? '', 1000);
        if ($stara === null || $seo_h1 === '' || $seo_t === '' || $seo_p === '') {
            $h1 = $seo_h1 ?: (mb_strlen($nazov . ' v akcii') <= 45 && Seo::slova($nazov . ' v akcii') <= 7 ? $nazov . ' v akcii' : $nazov);
            $lim = 60 - mb_strlen(Seo::pripona());
            $t = $seo_t ?: (mb_strlen($nazov . ' v akcii') <= $lim ? $nazov . ' v akcii' : $nazov);
            $p = $seo_p ?: Seo::popis($nazov, 'akcia', $karta);
            $seo = ['h1' => $h1, 'titulok' => $t, 'popis' => $p];
        } else $seo = ['h1' => $seo_h1, 'titulok' => $seo_t, 'popis' => $seo_p];
        foreach (['h1' => 'Nadpis', 'titulok' => 'Názov pre Google', 'popis' => 'Popis pre Google'] as $k => $n) if ($e = Kontrola::chybaTextu($seo[$k], $n, 2, 160)) return [$D, $e, [], $id];
        if ($ch = Seo::chyby($seo['titulok'], Typografia::txt($seo['h1']), Typografia::txt($seo['popis']))) return [$D, implode(' ', $ch) . ' Upravte to v časti „Pre Google“.', [], $id];
        if ($stara && $stara['nazov'] !== $nazov && $seo === $stara['seo']) $var[] = 'Zmenili ste názov akcie. Skontrolujte v časti „Pre Google“, či nadpis a popis sedia.';
        // leták – fotka a PDF (až po kontrole textov, aby sa pri chybe v texte súbory nenahrávali zbytočne)
        // obrázok na karte: fotka tovaru (nahlad.foto) má prednosť pred miniatúrou letáku – nový ani zmazaný leták ju nemení
        $foto = !empty($a['nahlad']['foto']);
        if (!empty($post['letak_zmazat'])) { $a['letak'] = null; if (!$foto) $a['nahlad'] = null; }
        if (!empty($files['letak_foto']['name'])) {
            $f = Subory::fotka($files['letak_foto'], $nazov, [600, 1200], true);
            if (is_string($f)) return [$D, $f, [], $id];
            $vyrez = $f['karta'] ?? null; unset($f['karta']);   // výrez pre kartu (nie text akcie v $karta)
            $a['letak'] = $f;
            // D8: fotka na šírku dostane na kartu výrez na výšku (ako ostatné letáky), inak by z nej bol tenký pásik
            if (!$foto) $a['nahlad'] = $vyrez ?? ['src' => $f['sirky'][0][1], 'w' => $f['sirky'][0][0], 'h' => (int)round($f['h'] * $f['sirky'][0][0] / $f['w'])];
        }
        $a = self::kartaFoto($a, $post, $files, $nazov);
        if (is_string($a)) return [$D, $a, [], $id];
        // PDF letáky
        $pdf = [];
        foreach ($a['pdf'] as $j => $p) if (empty($post['pdf_zmazat'][$j])) $pdf[] = $p;
        if (!empty($files['pdf_novy']['name'])) {
            $f = Subory::pdf($files['pdf_novy'], $nazov);
            if (is_string($f)) return [$D, $f, [], $id];
            $dat = Kontrola::datum((string)($post['pdf_datum'] ?? '')) ?? ($f['datum'] ? Kontrola::datum($f['datum']) : null);
            array_unshift($pdf, ['subor' => $f['subor'], 'datum' => $dat]);
        }
        if (count($pdf) > 12) return [$D, 'Akcia môže mať najviac 12 letákov PDF.', [], $id];
        $a = array_merge($a, ['nazov' => $nazov, 'stitok' => $stitok, 'karta' => $karta, 'ceny' => $tab, 'katalog' => $kat, 'na_uvode' => $na_uvode,
                              'hlavicka' => $hl, 'plati_do' => $plati !== '' ? $plati : null, 'pdf' => $pdf, 'seo' => $seo, 'verzia' => $a['verzia'] + 1]);
        // S1: ceny zadané alebo zmenené v správe nemajú nad tabuľkou dátum cenníka, ale dátum zadania
        if ($tab && $ceny_zmenene) { $a['cennik'] = null; $a['ceny_zadane'] = date('j. n. Y'); unset($a['skryt_ceny']); }
        elseif ($tab && !empty($post['ceny_potvrdit'])) {
            if (!empty($a['ceny_zadane'])) $a['ceny_zadane'] = date('j. n. Y'); else $a['cennik'] = $D['cennik']['aktualny'];
            unset($a['skryt_ceny']);
        }
        if (!$tab) { $a['cennik'] = null; unset($a['ceny_zadane'], $a['skryt_ceny']); }
        if ($kat && $a['katalog_poradie'] === null) $a['katalog_poradie'] = 1 + max(array_map(fn($x) => (int)($x['katalog_poradie'] ?? 0), $D['akcie']['akcie']));
        if ($i === null) array_unshift($D['akcie']['akcie'], $a);   // nová akcia je prvá v zozname
        else $D['akcie']['akcie'][$i] = $a;
        $uvod = count(array_filter($D['akcie']['akcie'], fn($x) => $x['viditelna'] && $x['stranka'] && $x['na_uvode']));
        if ($na_uvode && $uvod > 6) {   // z úvodu ustúpi posledná akcia v poradí (nie táto)
            for ($j = count($D['akcie']['akcie']) - 1; $j >= 0; $j--) {
                $x = $D['akcie']['akcie'][$j];
                if ($x['id'] !== $a['id'] && $x['viditelna'] && $x['stranka'] && $x['na_uvode']) {
                    $D['akcie']['akcie'][$j]['na_uvode'] = false; $D['akcie']['akcie'][$j]['verzia']++;
                    $D['akcie']['akcie'][$j]['ustupila_pre'] = $a['id'];   // S4: pri skrytí tejto akcie sa vráti na úvod
                    $var[] = 'Na úvode je miesto pre 6 akcií, preto z úvodu ustúpi akcia „' . $x['nazov'] . '“ (na stránke Akcie ostáva).';
                    break;
                }
            }
        }
        if ($nahrady) $_SESSION['nahrady'] = ['id' => $a['id'], 'pary' => $nahrady];
        return [$D, null, $var, $a['id']];
    }

    /** S2: v texte akcie, štítku a textoch pre Google nahradí staré ceny novými (koncept, pred náhľadom). */
    public static function nahradCeny(array $D, string $id, array $pary): array
    {
        $i = self::index($D, $id);
        if ($i === null) return [$D, 'Akcia neexistuje.'];
        $a = $D['akcie']['akcie'][$i];
        $r = fn($t) => array_reduce($pary, fn($t, $p) => preg_replace('/(?<![\d,])' . preg_quote($p['stara'], '/') . '(?![\d,])/u', $p['nova'], $t), $t);
        $a['karta'] = $r($a['karta']); $a['stitok'] = $r($a['stitok']);
        if ($a['seo']) foreach (['h1', 'titulok', 'popis'] as $k) $a['seo'][$k] = $r($a['seo'][$k]);
        if ($e = Kontrola::chybaTextu($a['stitok'], 'Štítok', 2, 18)) return [$D, $e];
        if ($e = Kontrola::chybaTextu($a['karta'], 'Text akcie', 30, 220)) return [$D, $e];
        if ($a['seo'] && ($ch = Seo::chyby($a['seo']['titulok'], Typografia::txt($a['seo']['h1']), Typografia::txt($a['seo']['popis'])))) return [$D, implode(' ', $ch)];
        $a['verzia']++;
        $D['akcie']['akcie'][$i] = $a;
        return [$D, null];
    }

    /** Skrytie / zobrazenie akcie. Vráti [$D, chyba, varovania]. S4: skrytá akcia z úvodu vráti na úvod tú, ktorá jej ustúpila. */
    public static function viditelnost(array $D, string $id, bool $vid): array
    {
        $i = self::index($D, $id);
        if ($i === null || !$D['akcie']['akcie'][$i]['stranka']) return [$D, 'Akcia neexistuje.', []];
        $var = [];
        $bolaNaUvode = $D['akcie']['akcie'][$i]['viditelna'] && $D['akcie']['akcie'][$i]['na_uvode'];
        $D['akcie']['akcie'][$i]['viditelna'] = $vid;
        $D['akcie']['akcie'][$i]['verzia']++;
        $naUvode = fn() => count(array_filter($D['akcie']['akcie'], fn($x) => $x['viditelna'] && $x['stranka'] && $x['na_uvode']));
        if ($vid) {
            if ($naUvode() > 6) $D['akcie']['akcie'][$i]['na_uvode'] = false;
        } elseif ($bolaNaUvode) {
            $vratena = null;
            foreach ($D['akcie']['akcie'] as $j => $x) if (($x['ustupila_pre'] ?? null) === $id && $x['viditelna'] && $x['stranka'] && !$x['na_uvode']) {
                $D['akcie']['akcie'][$j]['na_uvode'] = true; $D['akcie']['akcie'][$j]['verzia']++; unset($D['akcie']['akcie'][$j]['ustupila_pre']); $vratena = $x['nazov']; break;
            }
            if ($vratena) $var[] = "Na úvod sa vráti akcia „{$vratena}“, ktorá predtým ustúpila.";
            else {
                $n = $naUvode();
                if ($n < 6) $var[] = 'Na úvode bude ' . Ui::pocet($n, '%d akcia', '%d akcie', '%d akcií') . '. Ak chcete plný rad, otvorte inú akciu a zaškrtnite „Ukázať na úvode“.';
            }
        }
        return [$D, null, $var];
    }

    public static function posun(array $D, string $id, int $smer): array
    {
        $i = self::index($D, $id);
        $j = $i === null ? null : $i + $smer;
        if ($i === null || $j < 0 || $j >= count($D['akcie']['akcie'])) return [$D, null];
        $x = $D['akcie']['akcie'][$i]; $D['akcie']['akcie'][$i] = $D['akcie']['akcie'][$j]; $D['akcie']['akcie'][$j] = $x;
        return [$D, null];
    }

    // ---------- cenník a letáky ----------
    /** Nový cenník akcií v PDF. $tabulky: 'skryt' (predvolené) alebo 'platia'. */
    public static function cennik(array $D, array $post, array $files): array
    {
        $dat = Kontrola::datum((string)($post['datum'] ?? ''));
        if (empty($files['cennik_pdf']['name'])) return [$D, 'Vyberte súbor PDF s cenníkom.'];
        $f = Subory::pdf($files['cennik_pdf'], 'cennik-akcii');
        if (is_string($f)) return [$D, $f];
        if ($dat === null) $dat = $f['datum'] ? Kontrola::datum($f['datum']) : null;
        if ($dat === null) return [$D, 'Zadajte dátum cenníka.'];
        $strany = (int)($post['strany'] ?? 0) ?: $f['strany'];
        if ($strany < 1 || $strany > 200) return [$D, 'Počet strán nie je správny.'];
        $id = 'c' . date('YmdHis');
        $D['cennik']['cenniky'][] = ['id' => $id, 'pdf' => $f['subor'], 'datum' => $dat, 'strany' => $strany];
        $stary = $D['cennik']['aktualny'];
        $D['cennik']['aktualny'] = $id;
        if (($post['tabulky'] ?? 'skryt') === 'platia')
            foreach ($D['akcie']['akcie'] as &$a) if ($a['ceny'] && $a['cennik'] === $stary) { $a['cennik'] = $id; $a['verzia']++; }
        unset($a);
        return [$D, null];
    }

    public static function letakPridat(array $D, array $post, array $files): array
    {
        $text = Kontrola::text($post['text'] ?? '', 500);
        if ($e = Kontrola::chybaTextu($text, 'Názov letáku', 5, 90)) return [$D, $e];
        $f = Subory::pdf($files['letak_pdf'] ?? [], $text);
        if (is_string($f)) return [$D, $f];
        $dat = Kontrola::datum((string)($post['datum'] ?? '')) ?? ($f['datum'] ? Kontrola::datum($f['datum']) : null);
        if ($dat && !str_contains($text, '(PDF')) $text .= " (PDF, $dat)"; elseif (!str_contains($text, '(PDF')) $text .= ' (PDF)';
        array_unshift($D['cennik']['stare_letaky'], ['pdf' => $f['subor'], 'text' => $text]);
        return [$D, null];
    }

    public static function letakZmazat(array $D, int $i): array
    {
        if (!isset($D['cennik']['stare_letaky'][$i])) return [$D, 'Leták neexistuje.'];
        array_splice($D['cennik']['stare_letaky'], $i, 1);
        return [$D, null];
    }
}
