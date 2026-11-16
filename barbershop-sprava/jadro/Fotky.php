<?php
// Nové fotky zo správy: prehliadač pošle zmenšený obrázok, server ho vždy dekóduje knižnicou GD, skontroluje rozmery
// a nanovo zakóduje (WebP q82, JPEG q85). Na web sa tak dostane len skutočný obrázok bez metadát (GPS) a bez prívesku;
// SVG, GIF, PDF ani súbor, ktorý sa len tvári ako obrázok, neprejdú. Meno určuje pevný vzor (Mapa::fotka).
defined('B30S') || exit;

final class Fotky
{
    const NAJVIAC_BAJTOV = 12000000, NAJVIAC_STRANA = 4000, NAJVIAC_BODOV = 16000000;

    public static function vie(): bool { return function_exists('imagecreatefromstring') && function_exists('imagewebp') && function_exists('imagejpeg'); }

    /** Prijme fotku pre $cesta; vráti ['znacka' => …] alebo ['chyba' => veta]. */
    public static function prijmi(string $cesta, string $bajty): array
    {
        $verejna = Mapa::fotka($cesta);
        if ($verejna === null) return ['chyba' => 'Meno fotky nie je v povolenom tvare.'];
        if (is_file(Miesto::w($verejna))) return ['chyba' => 'Fotka s týmto menom už na webe je.'];
        if (!self::vie()) return ['chyba' => 'Server nevie upravovať fotky (chýba rozšírenie GD s WebP).'];
        if ($bajty === '' || strlen($bajty) > self::NAJVIAC_BAJTOV) return ['chyba' => 'Fotka je prázdna alebo príliš veľká.'];
        $info = @getimagesizefromstring($bajty);
        if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) return ['chyba' => 'Súbor nie je fotka JPEG, PNG alebo WebP.'];
        [$w, $h] = $info;
        if ($w < 16 || $h < 16 || $w > self::NAJVIAC_STRANA || $h > self::NAJVIAC_STRANA || $w * $h > self::NAJVIAC_BODOV) return ['chyba' => 'Fotka má nevhodné rozmery (najviac 4 000 px na stranu).'];
        $im = @imagecreatefromstring($bajty);
        if (!$im) return ['chyba' => 'Fotku sa nepodarilo otvoriť.'];
        if (!imageistruecolor($im)) imagepalettetotruecolor($im);
        ob_start();
        if (str_ends_with($cesta, '.webp')) { imagealphablending($im, false); imagesavealpha($im, true); $ok = imagewebp($im, null, 82); }
        else {
            $biele = imagecreatetruecolor($w, $h); imagefill($biele, 0, 0, imagecolorallocate($biele, 255, 255, 255));
            imagecopy($biele, $im, 0, 0, 0, 0, $w, $h); $ok = imagejpeg($biele, null, 85); imagedestroy($biele);
        }
        $von = (string) ob_get_clean();
        imagedestroy($im);
        if (!$ok || strlen($von) < 100) return ['chyba' => 'Fotku sa nepodarilo uložiť.'];
        self::uprac();
        $znacka = bin2hex(random_bytes(16));
        Ulozisko::zapis(Miesto::u("nahrate/$znacka.bin"), $von);
        Ulozisko::zapis(Miesto::u("nahrate/$znacka.txt"), $cesta);
        return ['znacka' => $znacka, 'sirka' => $w, 'vyska' => $h, 'bajty' => strlen($von)];
    }

    /** Fotka čakajúca na uloženie: [cesta v tvare repozitára, súbor s obsahom] alebo null. */
    public static function cakajuca($znacka): ?array
    {
        if (!is_string($znacka) || !preg_match('/^[0-9a-f]{32}$/', $znacka)) return null;
        $b = Miesto::u("nahrate/$znacka.bin"); $t = Miesto::u("nahrate/$znacka.txt");
        return is_file($b) && is_file($t) ? [(string) file_get_contents($t), $b] : null;
    }

    public static function zahod(string $znacka): void { @unlink(Miesto::u("nahrate/$znacka.bin")); @unlink(Miesto::u("nahrate/$znacka.txt")); }

    /** Nepoužité nahrávky staršie ako deň sa mažú. */
    public static function uprac(): void
    {
        foreach (glob(Miesto::u('nahrate/*.{bin,txt}'), GLOB_BRACE) ?: [] as $f) if (time() - (int) @filemtime($f) > 86400) @unlink($f);
    }
}
