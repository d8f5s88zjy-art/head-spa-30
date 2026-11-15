<?php
// Nahrávanie fotiek a PDF. Meno súboru vždy vyrobí server (img/s/<rok>/<mesiac>/<slug>-<8 hex>-<šírka>.webp,
// pdf/s/<rok>/<mesiac>/<slug>-<8 hex>.pdf), nič sa neprepisuje ani nemaže (cache na rok). Fotka sa vždy prekóduje cez GD
// (zmizne EXIF aj GPS), šírky sady nikdy väčšie ako originál. SVG, GIF, HEIC, TIFF ani nič iné sa neprijme.
defined('SPRAVA') || exit;

final class Subory
{
    const FOTKA_MAX = 15 << 20, PDF_MAX = 25 << 20;
    const MAX_STRANA = 12000, MAX_PIXELOV = 40000000;

    private static function chybaNahratia(array $f): ?string
    {
        $e = $f['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($e === UPLOAD_ERR_INI_SIZE || $e === UPLOAD_ERR_FORM_SIZE) return 'Súbor je príliš veľký pre tento hosting (najviac ' . round(Prostredie::limitNahravania() / 1048576) . ' MB).';
        if ($e === UPLOAD_ERR_NO_FILE) return 'Nevybrali ste súbor.';
        if ($e !== UPLOAD_ERR_OK) return 'Súbor sa nepodarilo nahrať. Skúste to znova.';
        if (!is_uploaded_file($f['tmp_name'] ?? '') && !(defined('SPRAVA_TEST') && is_file($f['tmp_name'] ?? ''))) return 'Súbor sa nepodarilo nahrať.';
        return null;
    }

    private static function cielovyPriecinok(string $druh): array
    {
        $rel = $druh . '/s/' . date('Y') . '/' . date('m');
        $abs = Nastavenie::w($rel);
        if (!is_dir($abs) && !@mkdir($abs, 0755, true) && !is_dir($abs)) throw new RuntimeException('Priečinok na súbory sa nedá vytvoriť.');
        return [$rel, $abs];
    }

    /** Nahrávky od času $od, na ktoré neodkazujú živé údaje ani koncept (zahodená zmena), sa zmažú z webu. */
    public static function upratNepouzite(int $od): int
    {
        $zive = json_encode(Zmena::zive(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $k = Zmena::koncept();
        $kon = $k ? json_encode($k['data'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : '';
        $n = 0;
        foreach (Ulozisko::citajJson(Nastavenie::d('subory.json'), []) as $z) {
            if (($z['cas'] ?? 0) < $od) continue;
            foreach ($z['subory'] ?? [] as $f) {
                if (!preg_match('#^(img|pdf)/s/\d{4}/\d{2}/[a-z0-9-]+\.(webp|avif|pdf)$#', $f)) continue;
                $zaklad = preg_replace('/-\d+\.(webp|avif)$/', '', $f);   // fotka: všetky šírky a AVIF spolu
                if (str_contains($zive, $zaklad) || str_contains($kon, $zaklad)) continue;
                foreach (glob(Nastavenie::w($zaklad) . '*') ?: [] as $x) if (preg_match('#\.(webp|avif|pdf)$#', $x) && @unlink($x)) $n++;
                if (is_file(Nastavenie::w($f)) && @unlink(Nastavenie::w($f))) $n++;
            }
        }
        return $n;
    }

    private static function zaznamenaj(array $z): void
    {
        Ulozisko::upravJson(Nastavenie::d('subory.json'), function ($d) use ($z) { $d[] = $z + ['cas' => time(), 'kto' => Pristup::ucet()]; return $d; }, []);
    }

    /** Fotka → ['src','w','h','velka','sirky'=>[[w, cesta]], 'avif'=>[[w, cesta]]] alebo veta s chybou. */
    public static function fotka(array $f, string $nazov, array $sirky = [600, 1200], bool $karta = false)
    {
        if ($e = self::chybaNahratia($f)) return $e;
        if (!Prostredie::webp()) return 'Tento hosting nevie upravovať fotky (chýba GD s WebP). Nahrajte leták ako PDF.';
        if (filesize($f['tmp_name']) > self::FOTKA_MAX) return 'Fotka je väčšia ako 15 MB.';
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $typ = ['image/jpeg' => IMAGETYPE_JPEG, 'image/png' => IMAGETYPE_PNG, 'image/webp' => IMAGETYPE_WEBP][$mime] ?? null;
        if ($typ === null) return 'Toto nie je fotka vo formáte JPEG, PNG alebo WebP. Odfoťte leták znova alebo ho uložte ako JPEG.';
        $info = @getimagesize($f['tmp_name']);
        if (!$info || $info[2] !== $typ) return 'Fotka je poškodená.';
        [$w, $h] = $info;
        if ($w < 200 || $h < 200) return 'Fotka je príliš malá (aspoň 200 × 200 bodov).';
        if ($w > self::MAX_STRANA || $h > self::MAX_STRANA || $w * $h > self::MAX_PIXELOV) return 'Fotka má príliš veľa bodov. Odfoťte ju v bežnom rozlíšení.';
        $pamat = self::pamat();
        if ($pamat > 0 && $w * $h * 5 * 2 > $pamat - memory_get_usage()) return 'Fotka je pre tento hosting príliš veľká. Zmenšite ju a skúste znova.';
        $im = $typ === IMAGETYPE_JPEG ? @imagecreatefromjpeg($f['tmp_name']) : ($typ === IMAGETYPE_PNG ? @imagecreatefrompng($f['tmp_name']) : @imagecreatefromwebp($f['tmp_name']));
        if (!$im) return 'Fotku sa nepodarilo otvoriť.';
        if ($typ === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $ex = @exif_read_data($f['tmp_name']);
            $o = (int)($ex['Orientation'] ?? 1);
            $otoc = [3 => 180, 6 => -90, 8 => 90][$o] ?? 0;
            if ($otoc) { $r = imagerotate($im, $otoc, 0); imagedestroy($im); $im = $r; }
        }
        $w = imagesx($im); $h = imagesy($im);
        if ($typ === IMAGETYPE_PNG) {   // priehľadnosť na bielu
            $b = imagecreatetruecolor($w, $h); imagefill($b, 0, 0, imagecolorallocate($b, 255, 255, 255)); imagecopy($b, $im, 0, 0, 0, 0, $w, $h); imagedestroy($im); $im = $b;
        }
        $ciele = array_values(array_filter($sirky, fn($s) => $s <= $w)) ?: [$w];
        [$rel, $abs] = self::cielovyPriecinok('img');
        $zaklad = Kontrola::slug($nazov, 40) . '-' . bin2hex(random_bytes(4));
        $avif = Prostredie::avif();
        $von = ['sirky' => [], 'avif' => []];
        try {
            foreach ($ciele as $s) {
                $vh = (int)round($h * $s / $w);
                $m = $s === $w ? $im : imagescale($im, $s, $vh, IMG_BICUBIC);
                $meno = "$zaklad-$s";
                ob_start(); imagewebp($m, null, 80); $b = ob_get_clean();
                Ulozisko::zapis("$abs/$meno.webp", $b);
                $von['sirky'][] = [$s, "$rel/$meno.webp"];
                if ($avif) { ob_start(); imageavif($m, null, 55); $b = ob_get_clean(); if (strlen($b) > 20) { Ulozisko::zapis("$abs/$meno.avif", $b); $von['avif'][] = [$s, "$rel/$meno.avif"]; } }
                if ($m !== $im) imagedestroy($m);
                $von['w'] = $s; $von['h'] = $vh;
            }
            // výrez na výšku (pomer letáku A4) pre kartu akcie, ak je fotka na šírku alebo štvorcová (D8)
            if ($karta && $w > $h * 0.9) {
                $cw = (int)round($h / M_SQRT2); $kw = min(600, $cw); $kh = (int)round($kw * M_SQRT2);
                $k = imagecreatetruecolor($kw, $kh);
                imagecopyresampled($k, $im, 0, 0, (int)(($w - $cw) / 2), 0, $kw, $kh, $cw, $h);
                ob_start(); imagewebp($k, null, 80); $b = ob_get_clean(); imagedestroy($k);
                Ulozisko::zapis("$abs/$zaklad-karta.webp", $b);
                $von['karta'] = ['src' => "$rel/$zaklad-karta.webp", 'w' => $kw, 'h' => $kh];
            }
        } finally { imagedestroy($im); }
        $najv = end($von['sirky'])[1];
        $von['src'] = $najv; $von['velka'] = $najv;
        if (!$von['avif']) unset($von['avif']);
        self::zaznamenaj(['druh' => 'fotka', 'subory' => array_merge(array_column($von['sirky'], 1), array_column($von['avif'] ?? [], 1), isset($von['karta']) ? [$von['karta']['src']] : [])]);
        return $von;
    }

    private static function pamat(): int
    {
        $v = trim((string)ini_get('memory_limit'));
        if ($v === '-1' || $v === '') return 0;
        $n = (int)$v;
        switch (strtolower(substr($v, -1))) { case 'g': $n *= 1024; case 'm': $n *= 1024; case 'k': $n *= 1024; }
        return $n;
    }

    /** Mená v PDF sa dajú písať aj cez #xx (/J#61vaScript = /JavaScript): pred kontrolou sa rozvinú. */
    public static function pdfMena(string $s): string
    {
        return preg_replace_callback('~/[^\s/<>\[\]()%{}]+~', fn($m) => preg_replace_callback('/#([0-9A-Fa-f]{2})/', fn($h) => chr(hexdec($h[1])), $m[0]), $s);
    }

    /** JavaScript, spúšťanie, vložené súbory, formuláre XFA a automatické akcie – aj v komprimovaných prúdoch
     *  (objektové prúdy /ObjStm). Prúd, ktorý sa nedá rozbaliť, sa nekontroluje (nie je to PDF objekt, napr. obrázok). */
    public static function pdfSProgramom(string $s): bool
    {
        $zle = '#/(JavaScript|JS|Launch|EmbeddedFile|EmbeddedFiles|RichMedia|XFA|SubmitForm|ImportData|GoToR|GoToE)(?![A-Za-z0-9])#';
        if (preg_match($zle, self::pdfMena($s))) return true;
        $spolu = 0;
        if (preg_match_all('#stream\r?\n(.*?)\r?\n?endstream#s', $s, $m)) foreach ($m[1] as $prud) {
            if (strlen($prud) > (8 << 20)) continue;
            $r = @gzuncompress($prud, 32 << 20);
            if ($r === false) $r = @gzinflate($prud, 32 << 20);
            if ($r === false) continue;
            $spolu += strlen($r);
            if ($spolu > (64 << 20)) return true;   // „bomba“: príliš veľa rozbaleného obsahu
            if (preg_match($zle, self::pdfMena($r))) return true;
        }
        return false;
    }

    /** PDF → ['subor', 'datum' (návrh z CreationDate), 'strany' (návrh)] alebo veta s chybou. */
    public static function pdf(array $f, string $nazov)
    {
        if ($e = self::chybaNahratia($f)) return $e;
        $max = min(self::PDF_MAX, Prostredie::limitNahravania());
        if (filesize($f['tmp_name']) > $max) return 'PDF je väčšie ako ' . round($max / 1048576) . ' MB.';
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $s = file_get_contents($f['tmp_name']);
        if ($mime !== 'application/pdf' || !preg_match('/^%PDF-[12]\.\d/', $s)) return 'Toto nie je súbor PDF.';
        if (!preg_match('/%%EOF\s*$/', substr($s, -2048))) return 'PDF je neúplné alebo poškodené. Uložte ho znova cez Tlačiť → Uložiť ako PDF.';
        if (self::pdfSProgramom($s))
            return 'PDF obsahuje programy alebo vložené súbory a nedá sa zverejniť. Uložte ho znova cez Tlačiť → Uložiť ako PDF.';
        $datum = '';
        if (preg_match('#/CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})#', $s, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1])) $datum = sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
        $strany = max(1, preg_match_all('#/Type\s*/Page(?![a-zA-Z])#', $s));
        [$rel, $abs] = self::cielovyPriecinok('pdf');
        $meno = Kontrola::slug($nazov, 40) . '-' . bin2hex(random_bytes(4)) . '.pdf';
        Ulozisko::zapis("$abs/$meno", $s);
        self::zaznamenaj(['druh' => 'pdf', 'subory' => ["$rel/$meno"]]);
        return ['subor' => "$rel/$meno", 'datum' => $datum, 'strany' => $strany];
    }
}
