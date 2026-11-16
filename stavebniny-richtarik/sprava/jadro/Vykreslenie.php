<?php
// Príprava dát pre šablóny a vykreslenie označených oblastí – do bajtu to isté ako nastroje/vykreslenie.py (build.py).
// Funkcie majú rovnaké mená ako v Pythone; novú funkciu pridávajte len s testom zhody (nastroje/sprava_zhoda.py).
// $D = ['firma'=>…, 'cennik'=>…, 'akcie'=>…, 'caste'=>…, 'k'=>konštanty z sprava/kostry/konstanty.json]
defined('SPRAVA') || exit;

final class Vykreslenie
{
    const ZNACKA = '/<!--s:([a-z0-9-]+)-->(.*?)<!--\/s:\1-->/s';
    const DNI_KRATKO = ['', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    const DNI_DLHO = ['', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
    const DNI_LD = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const SKONCILA = 'Táto akcia sa už skončila. Aktuálne akcie nájdete na stránke Akcie.';

    private static function txt(?string $s): string { return Typografia::txt($s); }
    private static function rel(string $c, string $z): string { return Pomocne::rel($c, $z); }

    public static function datum_html(string $d): string
    {
        return str_replace("\u{a0}", '&nbsp;', Pomocne::e(self::txt($d)));
    }

    public static function strany(int $n): string
    {
        return $n == 1 ? "$n strana" : (($n >= 2 && $n <= 4) ? "$n strany" : "$n strán");
    }

    // ---------- otváracie hodiny ----------
    public static function cas(string $c): string
    {
        [$h, $m] = explode(':', $c);
        return ((int)$h) . ':' . $m;
    }

    public static function hodiny_riadky(array $D): array
    {
        $von = [];
        foreach ($D['firma']['hodiny'] as $i => $s) {
            $d = $s['dni']; $a = $d[0]; $b = $d[count($d) - 1];
            $kratko = $a == $b ? self::DNI_KRATKO[$a] : self::DNI_KRATKO[$a] . ' – ' . self::DNI_KRATKO[$b];
            $dlho = $a == $b ? self::DNI_DLHO[$a] : self::DNI_DLHO[$a] . ' – ' . mb_strtolower(self::DNI_DLHO[$b]);
            $von[] = ['prvy' => $i == 0, 'kratko' => $kratko, 'dlho' => $dlho, 'uvod' => $a == $b ? $dlho : $kratko,
                      'dni' => $a == $b ? (string)$a : "$a-$b", 'cas' => self::cas($s['od']) . ' – ' . self::cas($s['do'])];
        }
        return $von;
    }

    public static function hodiny_veta(array $D, bool $velke = false): string
    {
        $v = implode(', ', array_map(fn($r) => mb_strtolower($r['dlho']) . ' ' . $r['cas'], self::hodiny_riadky($D)));
        return $velke ? mb_strtoupper(mb_substr($v, 0, 1)) . mb_substr($v, 1) : $v;
    }

    public static function datum_sk(string $iso, bool $rok = true): string
    {
        [$r, $m, $d] = explode('-', $iso);
        return $rok ? ((int)$d) . '. ' . ((int)$m) . '. ' . $r : ((int)$d) . '. ' . ((int)$m) . '.';
    }

    public static function vynimka_text(array $v): string
    {
        $od = $v['od']; $do = $v['do'];
        if ($od === $do) $rozsah = self::datum_sk($od);
        elseif (substr($od, 0, 4) === substr($do, 0, 4)) $rozsah = self::datum_sk($od, false) . ' – ' . self::datum_sk($do);
        else $rozsah = self::datum_sk($od) . ' – ' . self::datum_sk($do);
        $stav = !empty($v['zatvorene']) ? 'zatvorené' : 'otvorené ' . self::cas($v['cas_od']) . ' – ' . self::cas($v['cas_do']);
        return self::txt((($v['nazov'] ?? '') !== '' ? $v['nazov'] : 'Mimoriadne') . " $rozsah: $stav");
    }

    private static function vynimkyZoradene(array $D): array
    {
        $v = $D['firma']['vynimky'] ?? [];
        usort($v, fn($a, $b) => [$a['od'], $a['do']] <=> [$b['od'], $b['do']]);
        return $v;
    }

    public static function vynimky(array $D): array
    {
        return array_map(fn($v) => ['do' => $v['do'], 'text' => self::vynimka_text($v)], self::vynimkyZoradene($D));
    }

    public static function hodiny_ld(array $D): array
    {
        $von = [];
        foreach ($D['firma']['hodiny'] as $s) {
            $dni = array_map(fn($x) => self::DNI_LD[$x], $s['dni']);
            $von[] = ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => count($dni) > 1 ? $dni : $dni[0], 'opens' => $s['od'], 'closes' => $s['do']];
        }
        return $von;
    }

    public static function firma_ld(array $D): string
    {
        $f = $D['firma']; $k = $D['k'];
        $d = ['@context' => 'https://schema.org', '@type' => 'HardwareStore', '@id' => $k['domena'] . '#predajna', 'name' => 'Stavebniny Richtárik',
              'alternateName' => $f['majitel'], 'telephone' => [$f['mobil_tel'], $f['pevna_tel']], 'email' => $f['email'],
              'foundingDate' => '1997',
              'address' => ['@type' => 'PostalAddress', 'streetAddress' => $f['ulica'], 'addressLocality' => 'Nitra', 'postalCode' => '949 05', 'addressCountry' => 'SK'],
              'openingHoursSpecification' => self::hodiny_ld($D)]
           + (!empty($f['vynimky']) ? ['specialOpeningHoursSpecification' => array_map(fn($v) => ['@type' => 'OpeningHoursSpecification', 'validFrom' => $v['od'], 'validThrough' => $v['do'],
                 'opens' => !empty($v['zatvorene']) ? '00:00' : $v['cas_od'], 'closes' => !empty($v['zatvorene']) ? '00:00' : $v['cas_do']], self::vynimkyZoradene($D))] : [])
           + ['paymentAccepted' => 'Cash, Credit Card', 'areaServed' => 'Slovensko', 'url' => $k['domena'], 'logo' => $k['domena'] . 'img/logo-rs-720.png',
              'image' => $k['domena'] . $k['og_img'], 'hasMap' => 'https://maps.google.com/?cid=137067579998285540', 'taxID' => $f['dic']];
        return Pomocne::jsonPy($d);
    }

    // ---------- cenník a akcie ----------
    public static function cennik_aktualny(array $D): array
    {
        foreach ($D['cennik']['cenniky'] as $x) if ($x['id'] === $D['cennik']['aktualny']) return $x;
        throw new RuntimeException('aktuálny cenník chýba');
    }

    public static function cennik_text(array $D, bool $dlhy = false): string
    {
        $c = self::cennik_aktualny($D);
        return self::txt($dlhy ? "Cenník akcií z {$c['datum']} (PDF, " . self::strany((int)$c['strany']) . ')' : "Cenník akcií z {$c['datum']} (PDF)");
    }

    public static function zlava(array $D): string
    {
        return self::txt(str_replace('{datum}', self::cennik_aktualny($D)['datum'], $D['cennik']['zlava']));
    }

    public static function viditelne(array $D): array
    {
        return array_values(array_filter($D['akcie']['akcie'], fn($a) => $a['viditelna']));
    }

    public static function akcia(array $D, string $cesta): ?array
    {
        foreach ($D['akcie']['akcie'] as $a) if ($a['stranka'] === $cesta) return $a;
        return null;
    }

    public static function karta_akcie(array $D, array $a, string $cesta): array
    {
        if ($a['stranka']) { $href = self::rel($cesta, $a['stranka']); $viac = 'Leták akcie'; }
        else { $href = self::rel($cesta, $a['odkaz']['stranka']); $viac = $a['odkaz']['text']; }
        $n = $a['nahlad'] ?? null;
        return ['href' => $href, 'stitok' => self::txt($a['stitok']), 'nazov' => self::txt($a['nazov']), 'karta' => self::txt($a['karta']), 'viac' => self::txt($viac),
                'nahlad' => ($n && $a['stranka']) ? ['src' => self::rel($cesta, $n['src']), 'w' => $n['w'], 'h' => $n['h']] : null];
    }

    public static function pdf_text(array $a, array $p): string
    {
        if (!empty($p['text'])) return self::txt($p['text']);
        return self::txt(!empty($p['datum']) ? "Leták akcie: {$a['nazov']} (PDF, {$p['datum']})" : "Leták akcie: {$a['nazov']} (PDF)");
    }

    public static function akcia_vm(array $D, string $cesta): array
    {
        $a = self::akcia($D, $cesta); $f = $D['firma']; $c = self::cennik_aktualny($D);
        $vm = ['id' => $a['id'], 'stitok' => self::txt($a['stitok']), 'zlava' => self::zlava($D), 'cennik_href' => self::rel($cesta, $c['pdf']),
               'cennik_text' => self::cennik_text($D), 'mobil' => $f['mobil'], 'mobil_tel' => $f['mobil_tel'], 'email' => $f['email'],
               'predmet' => Pomocne::quote('Akcia ' . $a['nazov']), 'skoncila' => !$a['viditelna'], 'akcie_href' => self::rel($cesta, 'akcie/index.html')];
        $vm['katalog'] = $a['katalog'] ? ['odkazy' => array_map(fn($k) => ['href' => self::rel($cesta, $k), 'text' => self::txt($D['k']['nazvy'][$k] ?? $k)], $a['katalog'])] : null;
        if ($a['ceny']) {
            $tab = array_map(fn($t) => ['nadpis' => self::txt($t['nadpis']), 'poznamka' => self::txt($t['poznamka']),
                                        'riadky' => array_map(fn($r) => ['a' => self::txt($r[0]), 'b' => self::txt($r[1])], $t['riadky'])], $a['ceny']);
            if (!empty($a['ceny_zadane'])) {   // ceny zadané v správe: nadpis s dátumom zadania, nie dátum cenníka
                $stare = !empty($a['skryt_ceny']);
                $vm['ceny_zadane'] = self::txt('Akciové ceny (zadané ' . $a['ceny_zadane'] . ')');
            } else {
                $stare = (($a['cennik'] ?? null) !== $D['cennik']['aktualny']) || !empty($a['skryt_ceny']);
                $vm['ceny_zadane'] = null;
            }
            $vm['ceny_sekcia'] = ['tabulky' => $stare ? [] : $tab, 'stare' => $stare];
        } else { $vm['ceny_sekcia'] = null; $vm['ceny_zadane'] = null; }
        $l = $a['letak'] ?? null;
        if ($l) {
            $vm['letak'] = ['nazov' => self::txt($a['nazov']), 'src' => self::rel($cesta, $l['src']), 'w' => $l['w'], 'h' => $l['h'], 'velka' => self::rel($cesta, $l['velka'] ?? $l['src']),
                            'srcset' => !empty($l['sirky']) ? implode(', ', array_map(fn($x) => self::rel($cesta, $x[1]) . ' ' . $x[0] . 'w', $l['sirky'])) : '',
                            'avif' => !empty($l['avif']) ? implode(', ', array_map(fn($x) => self::rel($cesta, $x[1]) . ' ' . $x[0] . 'w', $l['avif'])) : ''];
        } else $vm['letak'] = null;
        $vm['pdf'] = array_map(fn($p) => ['href' => self::rel($cesta, $p['subor']), 'text' => self::pdf_text($a, $p)], $a['pdf']);
        return $vm;
    }

    public static function ostatne(array $D, string $cesta): array
    {
        $von = [];
        foreach (self::viditelne($D) as $a)
            if ($a['stranka'] && $a['stranka'] !== $cesta) $von[] = ['href' => self::rel($cesta, $a['stranka']), 'stitok' => self::txt($a['stitok']), 'nazov' => self::txt($a['nazov'])];
        return $von;
    }

    public static function v_akcii_vm(array $D, string $cesta): array
    {
        $ak = array_values(array_filter(self::viditelne($D), fn($a) => $a['stranka'] && in_array($cesta, $a['katalog'], true)));
        if (!$ak) return ['blok' => null];
        usort($ak, fn($x, $y) => ($x['katalog_poradie'] ?? 0) <=> ($y['katalog_poradie'] ?? 0));
        return ['blok' => ['nadpis' => substr_count($cesta, '/') == 1 ? 'V akcii z tejto kategórie' : 'Táto značka je v akcii',
                           'polozky' => array_map(fn($a) => ['href' => self::rel($cesta, $a['stranka']), 'stitok' => self::txt($a['stitok']), 'nazov' => self::txt($a['nazov'])], $ak)]];
    }

    public static function breadcrumb_ld(array $D, string $cesta, array $polozky): string
    {
        $k = $D['k']; $it = [];
        foreach ($polozky as $i => [$p, $t])
            $it[] = ['@type' => 'ListItem', 'position' => $i + 1,
                     'name' => Typografia::typografia(html_entity_decode(preg_replace('/<[^>]+>/u', '', Typografia::opravy($t)), ENT_QUOTES | ENT_HTML5, 'UTF-8')),
                     'item' => $k['domena'] . ($p === 'index.html' ? '' : $p)];
        return Typografia::opravy(Pomocne::jsonPy(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $it]));
    }

    // ---------- SEO ----------
    public static function seo(array $D, string $cesta): array
    {
        if ($cesta === 'kontakt.html') return [$D['k']['stranky']['kontakt.html'], self::kontakt_popis($D)];
        if ($cesta === 'akcie/index.html') return [$D['k']['stranky']['akcie/index.html'], str_replace('{datum}', self::cennik_aktualny($D)['datum'], $D['cennik']['akcie_popis'])];
        if ($cesta === 'letak.html') return [$D['k']['stranky']['letak.html'], str_replace('{datum}', self::cennik_aktualny($D)['datum'], $D['cennik']['letak_popis'])];
        $a = str_starts_with($cesta, 'akcie/') ? self::akcia($D, $cesta) : self::novinka($D, $cesta);
        return [$a['seo']['titulok'], $a['seo']['popis']];
    }

    public static function kontakt_popis(array $D): string
    {
        $d = str_replace('{hodiny_veta}', self::hodiny_veta($D), $D['firma']['kontakt_popis']);
        if (mb_strlen(self::txt($d)) > 155 && !empty($D['firma']['kontakt_popis_kratky'])) $d = str_replace('{hodiny_veta}', self::hodiny_veta($D), $D['firma']['kontakt_popis_kratky']);
        return $d;
    }

    public static function meta_vm(array $D, string $cesta): array
    {
        [$t, $d] = self::seo($D, $cesta);
        $a = str_starts_with($cesta, 'akcie/') ? self::akcia($D, $cesta) : (str_starts_with($cesta, 'novinky/') ? self::novinka($D, $cesta) : null);
        $pr = $D['k']['pripona'];
        return ['titulok' => Typografia::opravy($t . $pr), 'titulok_og' => self::txt($t . $pr), 'popis' => self::txt($d),
                'farba' => $D['k']['farba'], 'noindex' => (bool)($a && !$a['viditelna'])];
    }

    // ---------- časté otázky ----------
    public static function caste_odpovede(array $D): array
    {
        $von = [];
        $dat = self::cennik_aktualny($D)['datum'];
        foreach ($D['caste']['otazky'] as $o) {
            $a = str_replace(['{hodiny_veta}', '{Hodiny_veta}', '{cennik_datum}'], [self::hodiny_veta($D), self::hodiny_veta($D, true), $dat], $o['odpoved']);
            $v = $o['vazba'] ?? null;
            if ($v) {
                $ak = null;
                foreach ($D['akcie']['akcie'] as $x) if ($x['id'] === $v['akcia']) { $ak = $x; break; }
                $ceny = [];
                foreach ($ak ? $ak['ceny'] : [] as $t) foreach ($t['riadky'] as $r) $ceny[] = $r[1];
                $platne = $ak && $ak['viditelna'] && ((($ak['cennik'] ?? null) === $D['cennik']['aktualny']) || !empty($ak['ceny_zadane'])) && empty($ak['skryt_ceny']);
                $chyba = false;
                foreach ($v['ceny'] as $c) if (!in_array($c, $ceny, true)) $chyba = true;
                if (!$platne || $chyba) $a = $v['nahrada'];
            }
            $von[] = [$o['id'], $o['tema'], $o['otazka'], $a];
        }
        return $von;
    }

    public static function odkazy_v_odpovedi(array $D, string $t): string
    {
        $f = $D['firma'];
        $t = Pomocne::e($t);
        $t = str_replace($f['mobil'], '<a href="tel:' . $f['mobil_tel'] . '">' . $f['mobil'] . '</a>', $t);
        $t = str_replace($f['pevna'], '<a href="tel:' . $f['pevna_tel'] . '">' . $f['pevna'] . '</a>', $t);
        return str_replace($f['email'], '<a href="mailto:' . $f['email'] . '">' . $f['email'] . '</a>', $t);
    }

    public static function faq_vm(array $D): array
    {
        $qa = self::caste_odpovede($D); $bloky = [];
        foreach ($D['caste']['temy'] as [$tema, $nadpis]) {
            if (!$nadpis) continue;
            $temy = $tema === 'kontakt' ? [$tema, 'hodiny'] : [$tema];
            $pol = [];
            foreach ($qa as [$i, $t, $q, $a]) if (in_array($t, $temy, true)) $pol[] = ['id' => $i, 'otazka' => self::txt($q), 'odpoved' => self::odkazy_v_odpovedi($D, self::txt($a))];
            if ($pol) $bloky[] = ['nadpis' => self::txt($nadpis), 'polozky' => $pol];
        }
        return ['bloky' => $bloky];
    }

    public static function faq_ld(array $D): string
    {
        $me = [];
        foreach (self::caste_odpovede($D) as [$i, $t, $q, $a]) $me[] = ['@type' => 'Question', 'name' => $q, 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $a]];
        return Typografia::opravy(Pomocne::jsonPy(['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $me]));
    }

    // ---------- novinky ----------
    const NOVINKA_SKONCILA = 'Táto novinka už nie je v ponuke. Aktuálne novinky nájdete na stránke Novinky.';

    public static function novinka(array $D, string $cesta): ?array
    {
        foreach ($D['novinky']['novinky'] as $n) if ($n['stranka'] === $cesta) return $n;
        return null;
    }

    public static function novinky_viditelne(array $D): array
    {
        return array_values(array_filter($D['novinky']['novinky'], fn($n) => $n['viditelna']));
    }

    public static function karta_novinky(array $n, string $cesta, bool $uvod = false): array
    {
        $k = $n['karta'];
        return ['href' => self::rel($cesta, $n['stranka']), 'nazov' => self::txt($n['nazov']), 'popis' => self::txt(($uvod ? ($n['popis_uvod'] ?? null) : null) ?: $n['popis']),
                'foto' => $k['druh'] === 'foto' ? ['src' => self::rel($cesta, $k['src']), 'w' => $k['w'], 'h' => $k['h']] : null,
                'dlazdica' => $k['druh'] === 'cena' ? ['nad' => self::txt($k['nad']), 'suma' => self::txt($k['cena']), 'pod' => self::txt($k['pod'])] : null,
                'prazdna' => $k['druh'] === 'prazdna'];
    }

    public static function novinky_kat_vm(array $D, string $cesta): array
    {
        $nov = [];
        foreach ($D['novinky']['kategorie'][$cesta] ?? [] as $i) foreach (self::novinky_viditelne($D) as $n) if ($n['id'] === $i) $nov[] = $n;
        if (!$nov) return ['blok' => null];
        return ['blok' => ['polozky' => array_map(fn($n) => ['href' => self::rel($cesta, $n['stranka']), 'nadpis' => self::txt($n['seo']['h1']), 'popis' => self::txt($n['popis'])], $nov)]];
    }

    public static function fotka_vm(array $f, string $cesta): array
    {
        $ss = fn($l) => implode(', ', array_map(fn($x) => self::rel($cesta, $x[1]) . ' ' . $x[0] . 'w', $l ?? []));
        return ['velka' => self::rel($cesta, $f['velka']), 'popis' => self::txt($f['popis'] ?? ''), 'src' => self::rel($cesta, $f['src']), 'w' => $f['w'], 'h' => $f['h'],
                'pos' => $f['pos'] ?? '', 'webp' => $ss($f['webp']), 'srcset' => $ss($f['webp']), 'avif' => $ss($f['avif'] ?? [])];
    }

    public static function novinka_doplnok_vm(array $D, string $cesta): array
    {
        $n = self::novinka($D, $cesta);
        $fotky = [];
        foreach ($n['fotky'] ?? [] as $f) if ($f['viditelna'] ?? true) $fotky[] = self::fotka_vm($f, $cesta);
        return ['text' => !empty($n['odseky']) ? ['odseky' => array_map(fn($x) => ['t' => self::txt($x)], $n['odseky'])] : null,
                'galeria' => $fotky ? ['trieda' => count($fotky) > 1 ? 'n2' : 'n1', 'fotky' => $fotky] : null,
                'pdf_blok' => !empty($n['pdf']) ? ['pdf' => array_map(fn($p) => ['href' => self::rel($cesta, $p['subor']), 'text' => self::txt($p['text'])], $n['pdf'])] : null];
    }

    public static function fotografie(int $n): string
    {
        return $n == 1 ? "$n fotografia" : (($n >= 2 && $n <= 4) ? "$n fotografie" : "$n fotografií");
    }

    public static function obrazky(int $n): string
    {
        return $n == 1 ? "$n obrázok" : (($n >= 2 && $n <= 4) ? "$n obrázky" : "$n obrázkov");
    }

    /** Položka albumu je na webe, keď je viditeľná a údaje, ktoré má v obrázku (plati_pri), platia. */
    public static function fotka_na_webe(array $D, array $f): bool
    {
        return (bool)($f['viditelna'] ?? true) && self::udaje_platia($D, $f['plati_pri'] ?? []);
    }

    private static function fotkyAlbumu(array $D, string $album, string $cesta): array
    {
        foreach ($D['galeria']['albumy'] as $a) if ($a['id'] === $album) {
            $fotky = [];
            foreach ($a['fotky'] as $f) if (self::fotka_na_webe($D, $f)) $fotky[] = self::fotka_vm($f, $cesta);
            return [$a, $fotky];
        }
        throw new RuntimeException('neznámy album ' . $album);
    }

    public static function galeria_vm(array $D, string $album, string $cesta): array
    {
        [$a, $fotky] = self::fotkyAlbumu($D, $album, $cesta);
        return ['nadpis' => self::txt($a['nadpis']), 'pocet' => self::fotografie(count($fotky)), 'fotky' => $fotky];
    }

    /** Albumy Máriových grafík (letaky na stránke Leták, grafika v Galérii); bez položiek na webe sa nevykreslí nič. */
    public static function grafika_vm(array $D, string $album, string $cesta): array
    {
        [$a, $fotky] = self::fotkyAlbumu($D, $album, $cesta);
        if (!$fotky) return ['blok' => null];
        $g = $album === 'grafika';
        return ['blok' => ['nadpis' => self::txt($a['nadpis']), 'album' => $g, 'pocet' => $g ? self::obrazky(count($fotky)) : '',
                           'trieda' => $g ? 'n6 gg' : 'n2 lb4', 'fotky' => $fotky,
                           'sizes' => $g ? '(max-width:700px) 30vw, (max-width:1000px) 23vw, 180px' : '(max-width:700px) 42vw, 400px']];
    }

    // ---------- texty stránok ----------
    public static function odkaz_telefon(array $D, string $t): string
    {
        $f = $D['firma'];
        return str_replace('{telefon}', '<a href="tel:' . $f['mobil_tel'] . '">' . $f['mobil'] . '</a>', Pomocne::e(self::txt($t)));
    }

    // ---------- Kontakt: karty Zavolajte nám a Napíšte nám (obrázok len pri údajoch, ktoré ukazuje) ----------
    public static function cislice(?string $s): string
    {
        return preg_replace('/\D/', '', $s ?? '');
    }

    /** Grafiky s údajom v obrázku sa ukazujú, len kým údaje platia (konštanty grafika_udaje); to isté ako v Pythone. */
    public static function udaje_platia(array $D, array $kluce): bool
    {
        $f = $D['firma']; $o = $D['k']['grafika_udaje'];
        foreach ($kluce as $k) {
            if ($k === 'hodiny') $ok = array_map(fn($x) => [array_values($x['dni']), self::cas($x['od']), self::cas($x['do'])], array_values($f['hodiny'])) === $o['hodiny'];
            elseif ($k === 'mobil' || $k === 'pevna') $ok = self::cislice($f[$k]) === $o[$k];
            elseif ($k === 'email') $ok = mb_strtolower($f['email']) === implode('@', $o['email']);
            elseif ($k === 'ulica' || $k === 'majitel') $ok = mb_strtolower($f[$k]) === mb_strtolower($o[$k]);
            elseif ($k === 'psc') $ok = str_contains($f['mesto'], $o['psc']);
            elseif ($k === 'zlava') {
                $t = str_replace("\u{a0}", ' ', $D['cennik']['zlava']); $ok = true;
                foreach ($o['zlava'] as $x) if (!preg_match('/(?<![0-9,])' . preg_quote($x, '/') . '/u', $t)) $ok = false;
            } else $ok = false;
            if (!$ok) return false;
        }
        return true;
    }

    public static function kontakt_karty_vm(array $D): array
    {
        $f = $D['firma']; $o = $D['k']['kontakt_obr'];
        $i = strpos($f['email'], '@');
        $meno = $i === false ? $f['email'] : substr($f['email'], 0, $i);
        $domena = $i === false ? '' : substr($f['email'], $i + 1);
        return ['mobil' => $f['mobil'], 'mobil_tel' => $f['mobil_tel'], 'pevna' => $f['pevna'], 'pevna_tel' => $f['pevna_tel'], 'email' => $f['email'],
                'email_meno' => $meno, 'email_domena' => $domena,
                'obr_tel' => self::cislice($f['mobil']) === $o['zavolajte']['mobil'] && self::cislice($f['pevna']) === $o['zavolajte']['pevna'],
                'obr_mail' => [$meno, $domena] === $o['napiste']['email']];
    }

    public static function polozky_vm(array $D, array $zoznam): array
    {
        $p = [];
        foreach (array_values($zoznam) as $i => [$t, $d]) $p[] = ['n' => sprintf('%02d', $i + 1), 'nazov' => self::txt($t), 'popis' => self::odkaz_telefon($D, $d)];
        return ['polozky' => $p];
    }

    private static function odseky(array $zoznam): array
    {
        return ['odseky' => array_map(fn($x) => ['t' => self::txt($x)], $zoznam)];
    }

    // ---------- znalosti asistenta (R-1, to isté ako nastroje/vykreslenie.py) ----------
    const ASISTENT_OTAZKY = ['asistent/znalosti/richtarik-otazky.json', 'assets/asistent-otazky.json'];
    const ASISTENT_ZNALOSTI = 'asistent/znalosti/richtarik.md';

    public static function asistent_otazky(array $D, string $text): string
    {
        $z = json_decode($text, false, 512, JSON_THROW_ON_ERROR);
        $odp = [];
        foreach (self::caste_odpovede($D) as [$i, $t, $q, $a]) $odp[$i] = $a;
        foreach ($z->otazky ?? [] as $o) {
            if (isset($o->id, $odp[$o->id])) $o->a = $odp[$o->id];
            elseif (isset($o->a) && is_string($o->a)) $o->a = self::odpoved_casy($D, $o->a);
        }
        return Pomocne::jsonPyOdsad($z, 1) . (str_ends_with($text, "\n") ? "\n" : '');
    }

    /** Časy v ostatných odpovediach asistenta (to isté ako odpoved_casy v nastroje/vykreslenie.py). */
    public static function odpoved_casy(array $D, string $a): string
    {
        $r = [];
        foreach (self::hodiny_riadky($D) as $x) $r[$x['dni']] = $x['cas'];
        $kl = array_map('strval', array_keys($r)); sort($kl);   // kľúč „6“ je v PHP číslo
        if ($kl !== ['1-5', '6']) return $a;
        $roz = '\d{1,2}:\d\d – \d{1,2}:\d\d';
        foreach (['/((?:[Pp]ondelok – piatok|v pracovné dni) )' . $roz . '/u' => '1-5', '/((?:[Ss]obota|v sobotu|[Vv] sobotu máme otvorené) )' . $roz . '/u' => '6'] as $vzor => $k)
            $a = preg_replace_callback($vzor, fn($m) => $m[1] . $r[$k], $a);
        return $a;
    }

    const ASISTENT_JS = ['assets/asistent.js', 'assets/asistent-ukazka.js'];

    public static function asistent_js(array $D, string $js): string
    {
        return preg_replace_callback('/(Zavolajte nám na [^(\n]{5,40} \()pondelok[^)\n]*?(\))/u', fn($m) => $m[1] . self::hodiny_veta($D) . $m[2], $js);
    }

    public static function asistent_znalosti(array $D, string $md): string
    {
        return preg_replace_callback('/^(- Otváracie hodiny: )[^\n(]*?( \(v odpovedi)/mu', fn($m) => $m[1] . self::hodiny_veta($D) . $m[2], $md, 1);
    }

    // ---------- oblasti ----------
    public static function vykresli(string $oid, string $cesta, array $D): string
    {
        $S = fn($m, $d) => Sablona::sablona($m, $d);
        switch ($oid) {
            case 'hodiny-uvod-info':
                return $S($oid, ['riadky' => self::hodiny_riadky($D)]);
            case 'kontakt-karty': return $S('kontakt-karty', self::kontakt_karty_vm($D));
            case 'hodiny-kontakt':
                return $S($oid, ['riadky' => self::hodiny_riadky($D), 'vynimky' => self::vynimky($D), 'obr' => self::udaje_platia($D, ['hodiny'])]);
            case 'hodiny-pata': case 'hodiny-uvod':
                return $S($oid, ['riadky' => self::hodiny_riadky($D), 'vynimky' => self::vynimky($D)]);
            case 'ld-firma': return $S('ld', ['json' => self::firma_ld($D)]);
            case 'faq': return $S('faq', self::faq_vm($D));
            case 'faq-ld': return $S('ld', ['json' => self::faq_ld($D)]);
            case 'meta': return $S('meta', self::meta_vm($D, $cesta));
            case 'zlava-lede': return $S('lede', ['text' => self::zlava($D)]);
            case 'akcie-index':
                return $S('akcie-index', ['cennik_href' => self::rel($cesta, self::cennik_aktualny($D)['pdf']), 'cennik_text' => self::cennik_text($D),
                    'letak_href' => self::rel($cesta, 'letak.html'),
                    'karty' => array_map(fn($a) => self::karta_akcie($D, $a, $cesta), self::viditelne($D)),
                    'letaky' => array_map(fn($l) => ['href' => self::rel($cesta, $l['pdf']), 'text' => self::txt($l['text'])], $D['cennik']['stare_letaky'])]);
            case 'ld-omrvinky':
                if (str_starts_with($cesta, 'novinky/')) {
                    $n = self::novinka($D, $cesta);
                    return $S('ld', ['json' => self::breadcrumb_ld($D, $cesta, [['index.html', 'Úvod'], ['novinky/index.html', 'Novinky'], [$cesta, $n['nazov']]])]);
                }
                $a = self::akcia($D, $cesta);
                return $S('ld', ['json' => self::breadcrumb_ld($D, $cesta, [['index.html', 'Úvod'], ['akcie/index.html', 'Akcie'], [$cesta, $a['nazov']]])]);
            case 'hlavicka':
                if (str_starts_with($cesta, 'novinky/')) {
                    $n = self::novinka($D, $cesta);
                    $foto = $D['k']['hlavicky'][$n['hlavicka'] ?? '']['html'] ?? '';
                    return $S('hlavicka-novinka', ['nazov' => self::txt($n['nazov']), 'h1' => self::txt($n['seo']['h1']), 'lede' => self::txt($n['viditelna'] ? $n['popis'] : self::NOVINKA_SKONCILA),
                                                   'foto' => $foto, 'uvod_href' => self::rel($cesta, 'index.html'), 'novinky_href' => self::rel($cesta, 'novinky/index.html')]);
                }
                $a = self::akcia($D, $cesta);
                $foto = $D['k']['hlavicky'][$a['hlavicka'] ?? '']['html'] ?? '';
                $lede = !$a['viditelna'] ? self::SKONCILA : $a['karta'];
                return $S('hlavicka-akcia', ['nazov' => self::txt($a['nazov']), 'h1' => self::txt($a['seo']['h1']), 'lede' => self::txt($lede), 'foto' => $foto,
                                             'uvod_href' => self::rel($cesta, 'index.html'), 'akcie_href' => self::rel($cesta, 'akcie/index.html')]);
            case 'akcia-telo': return $S('akcia-telo', self::akcia_vm($D, $cesta));
            case 'novinka-doplnok': return $S('novinka-doplnok', self::novinka_doplnok_vm($D, $cesta));
            case 'novinky-index': return $S('novinky-index', ['karty' => array_map(fn($n) => self::karta_novinky($n, $cesta), self::novinky_viditelne($D))]);
            case 'uvod-novinky':
                $nv = array_slice(array_values(array_filter(self::novinky_viditelne($D), fn($n) => !empty($n['na_uvode']))), 0, 4);
                return $S('uvod-novinky', ['karty' => array_map(fn($n) => self::karta_novinky($n, $cesta, true), $nv)]);
            case 'novinky-kat': return $S('novinky-kat', self::novinky_kat_vm($D, $cesta));
            case 'galeria-predajna': case 'galeria-dvor': return $S($oid, self::galeria_vm($D, substr($oid, 8), $cesta));
            case 'galeria-letaky': case 'galeria-grafika': return $S('galeria-grafika', self::grafika_vm($D, substr($oid, 8), $cesta));
            case 'sluzby-zlavy': return $S('sluzby-zlavy', ['zlava' => self::zlava($D), 'obr' => self::udaje_platia($D, ['zlava']), 'akcie_href' => self::rel($cesta, 'akcie/index.html')]);
            case 'sluzby-lede': return $S('lede', ['text' => self::txt($D['texty']['sluzby_uvod'])]);
            case 'sluzby-polozky': return $S('sluzby-polozky', self::polozky_vm($D, $D['texty']['sluzby']));
            case 'doprava-polozky': return $S('doprava-polozky', self::polozky_vm($D, $D['texty']['doprava']));
            case 'onas-text': return $S('odseky', self::odseky($D['texty']['onas']));
            case 'uvod-onas': return $S('odseky', self::odseky($D['texty']['uvod_onas']));
            case 'uvod-lede': return $S('lede-uvod', ['text' => self::txt($D['texty']['uvod_lede'])]);
            case 'akcie-bocny': return $S('akcie-bocny', ['ostatne' => self::ostatne($D, $cesta)]);
            case 'v-akcii': return $S('v-akcii', self::v_akcii_vm($D, $cesta));
            case 'uvod-akcie':
                $ak = array_slice(array_values(array_filter(self::viditelne($D), fn($a) => $a['stranka'] && $a['na_uvode'])), 0, 6);
                return $S('uvod-akcie', ['karty' => array_map(fn($a) => self::karta_akcie($D, $a, $cesta), $ak)]);
            case 'uvod-cennik-veta': return $S('uvod-cennik-veta', ['datum' => self::datum_html(self::cennik_aktualny($D)['datum'])]);
            case 'doprava-cennik-odkaz': return $S('doprava-cennik-odkaz', ['href' => self::rel($cesta, self::cennik_aktualny($D)['pdf']), 'text' => self::cennik_text($D)]);
            case 'doprava-cennik-veta': return $S('doprava-cennik-veta', ['datum' => self::datum_html(self::cennik_aktualny($D)['datum'])]);
            case 'letak-lede': return $S('lede', ['text' => self::txt('Cenník akcií z ' . self::cennik_aktualny($D)['datum'] . ' a staršie akciové letáky na stiahnutie.')]);
            case 'letak-cennik': return $S('letak-cennik', ['href' => self::rel($cesta, self::cennik_aktualny($D)['pdf']), 'text' => self::cennik_text($D, true), 'zlava' => self::zlava($D)]);
        }
        throw new RuntimeException('neznáma oblasť ' . $oid);
    }

    public static function oblast(string $oid, string $obsah): string
    {
        return '<!--s:' . $oid . '-->' . $obsah . '<!--/s:' . $oid . '-->';
    }

    /** [[id, obsah], …] v poradí výskytu. */
    public static function oblasti_v(string $text): array
    {
        preg_match_all(self::ZNACKA, $text, $m, PREG_SET_ORDER);
        return array_map(fn($x) => [$x[1], $x[2]], $m);
    }

    /** Text súboru s oblasťami vykreslenými z dát. */
    public static function prepis(string $text, string $cesta, array $D): string
    {
        $von = preg_replace_callback(self::ZNACKA, fn($m) => self::oblast($m[1], self::vykresli($m[1], $cesta, $D)), $text);
        if ($von === null) throw new RuntimeException('prepis: chyba regulárneho výrazu (' . preg_last_error_msg() . ')');
        return $von;
    }

    public static function bez_znaciek(string $text): string
    {
        return preg_replace('/<!--\/?s:[a-z0-9-]+-->/', '', $text);
    }
}
