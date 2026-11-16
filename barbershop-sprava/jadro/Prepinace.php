<?php
// Prepínače funkcií na webe: atribúty data-asistent a data-objednavka na značke <html> a data-zapnute pri skripte
// kartičky v /index.html a /en/index.html – to isté, čo na GitHub Pages robí nasadenie (pages.yml). app.js, asistent.js,
// objednavka.js a vernost.js sa nemenia. Cieľový stav sa vždy vypočíta z nastavenia a z kontrol; zápis je idempotentný.
// Mení sa len prvá otváracia značka dokumentu a jediná značka skriptu kartičky; keď ich funkcia nenájde presne, nič
// nezapíše a ohlási chybu.
defined('B30S') || exit;

final class Prepinace
{
    const STRANKY = ['index.html' => false, 'en/index.html' => true];
    const RE_HTML = '~\A(<!DOCTYPE html>\s*(?:<!--.*?-->\s*)?<html lang="(?:sk|en)"(?: data-zdroj="en")? data-motion="on")((?: data-(?:asistent|objednavka)="[^"<>]*")*)(>)~s';
    const RE_SKRIPT = '~(<script src="(?:\.\./)?assets/vernost\.js" data-prevadzka="barbershop")( data-zapnute)?( data-api="[^"<>]*")~';

    /** Má stránka značky, ktoré prepínače menia (presne raz)? */
    public static function hlavaOk(string $html, bool $en): bool
    {
        if (!preg_match(self::RE_HTML, $html, $m)) return false;
        if (str_contains($m[1], 'lang="en"') !== $en) return false;
        return preg_match_all(self::RE_SKRIPT, $html) === 1;
    }

    /** Stránka s prepínačmi podľa $stav = ['asistent' => adresa|'' , 'objednavka' => adresa|'', 'vernost' => bool]. */
    public static function nastav(string $html, array $stav): string
    {
        $atr = '';
        if (!empty($stav['asistent'])) $atr .= ' data-asistent="' . htmlspecialchars($stav['asistent'], ENT_QUOTES) . '"';
        if (!empty($stav['objednavka'])) $atr .= ' data-objednavka="' . htmlspecialchars($stav['objednavka'], ENT_QUOTES) . '"';
        $n = 0;
        $html = (string) preg_replace_callback(self::RE_HTML, fn($m) => $m[1] . $atr . $m[3], $html, 1, $n);
        if ($n !== 1) throw new RuntimeException('značka <html> sa nenašla');
        if (preg_match_all(self::RE_SKRIPT, $html) !== 1) throw new RuntimeException('značka skriptu kartičky sa nenašla presne raz');
        return (string) preg_replace_callback(self::RE_SKRIPT, fn($m) => $m[1] . (!empty($stav['vernost']) ? ' data-zapnute' : '') . $m[3], $html, 1);
    }

    /** Čo je práve v stránke zapnuté (číta sa z verejného súboru). */
    public static function precitaj(string $html): array
    {
        $s = ['asistent' => '', 'objednavka' => '', 'vernost' => false];
        if (preg_match(self::RE_HTML, $html, $m)) {
            if (preg_match('/ data-asistent="([^"]*)"/', $m[2], $a)) $s['asistent'] = html_entity_decode($a[1], ENT_QUOTES);
            if (preg_match('/ data-objednavka="([^"]*)"/', $m[2], $a)) $s['objednavka'] = html_entity_decode($a[1], ENT_QUOTES);
        }
        if (preg_match(self::RE_SKRIPT, $html, $m)) $s['vernost'] = $m[2] !== '';
        return $s;
    }

    /** Zapíše cieľový stav do verejných stránok. Vráti ['stav' => …, 'zmenene' => [súbory], 'chyby' => [vety]]. */
    public static function zapis(?array $stav = null): array
    {
        $stav = $stav ?? Nastavenia::cielovyStav();
        $ciel = ['asistent' => $stav['asistent'] ?? '', 'objednavka' => $stav['objednavka'] ?? '', 'vernost' => !empty($stav['vernost'])];
        $zmenene = []; $chyby = [];
        foreach (self::STRANKY as $s => $en) {
            $f = Miesto::w($s);
            $html = is_file($f) ? (string) file_get_contents($f) : '';
            if ($html === '' || !self::hlavaOk($html, $en)) { $chyby[] = "V súbore $s sa nenašla hlavička stránky; prepínače sa do neho nezapísali."; continue; }
            try { $nove = self::nastav($html, $ciel); }
            catch (Throwable $e) { $chyby[] = "Súbor $s: " . $e->getMessage() . '.'; continue; }
            if ($nove === $html) continue;
            try { Ulozisko::zapis($f, $nove); $zmenene[] = $s; }
            catch (Throwable $e) { $chyby[] = "Do súboru $s sa nedá zapisovať. Nastav mu cez FTP práva na zápis."; }
        }
        if ($zmenene) Dennik::zapis('prepinace', ['asistent' => $ciel['asistent'] !== '', 'objednavka' => $ciel['objednavka'] !== '', 'vernost' => $ciel['vernost'], 'subory' => $zmenene]);
        return ['stav' => $ciel, 'dovody' => $stav['dovody'] ?? [], 'zmenene' => $zmenene, 'chyby' => $chyby];
    }
}
