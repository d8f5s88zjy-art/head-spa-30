<?php
// Obrazovky prístupu: prvé nastavenie (kontrola prostredia → kód zo súboru → meno a heslo), prihlásenie, obnova hesla.
defined('SPRAVA') || exit;

function navod_kod(string $subor): string
{
    // celé meno priečinka údajov sa pred overením neukazuje (keď je vo webe, jeho meno je súčasť ochrany)
    $kde = Nastavenie::$vnutriWebu ? 'V priečinku webu (www) otvorte priečinok, ktorého meno sa začína <b>sprava-data-</b>' : 'Vedľa priečinka <b>www</b> otvorte priečinok <b>sprava-data</b>';
    return '<ol class="kroky"><li>Súbor otvorí ten, kto má údaje k FTP (sú v zákazníckom účte Forpsi): v počítači programom <b>FileZilla</b>, alebo v prehliadači na <b>webftp.forpsi.com</b>.</li>'
         . '<li>' . $kde . '. Ak ho nevidíte, načítajte zoznam znova (FileZilla: kláves F5).</li><li>Otvorte súbor <b>' . Ui::e($subor) . '</b>. Je v ňom kód v tvare <b>ABCD-EFGH-JKLM-NPQR</b>.</li><li>Kód opíšte sem. Po použití sa súbor sám zmaže.</li></ol>';
}

function pole_kod(): string
{
    return '<label class="pole"><span>Kód zo súboru</span><input name="kod" required autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="ABCD-EFGH-JKLM-NPQR" maxlength="24"></label>';
}

function pole_heslo(bool $meno = true): string
{
    // D1: meno ostane vyplnené aj po chybe hesla (heslo sa z bezpečnosti nevracia)
    $m = (string)($_SESSION['meno_formular'] ?? ''); unset($_SESSION['meno_formular']);
    return ($meno ? '<label class="pole"><span>Vaše meno</span><input name="meno" required autocomplete="username" maxlength="40" placeholder="napríklad Mário" value="' . Ui::e($m) . '"></label>' : '')
        . '<label class="pole"><span>Nové heslo</span><input type="password" name="heslo" required minlength="10" autocomplete="new-password"><small>Aspoň 10 znakov. Dobré sú tri slová, napríklad palety-cement-krškany.</small></label>'
        . '<label class="pole"><span>Heslo ešte raz</span><input type="password" name="heslo2" required minlength="10" autocomplete="new-password"></label>'
        . '<label class="prepinac"><input type="checkbox" name="zapamatat" value="1" checked> <span>Zapamätať toto zariadenie (30 dní bez hesla)</span></label>';
}

function obrazovka_prve(): void
{
    $krok = $_SESSION['prvy_ok'] ?? 0;
    if ($krok && time() - $krok < 900) {
        Ui::stranka('Prvé nastavenie – heslo', '<p class="vela">Kód je správny. Teraz si zvoľte meno a heslo, ktorým sa budete prihlasovať.</p>'
            . '<form method="post" action="index.php">' . Ui::csrf() . '<input type="hidden" name="a" value="prvy-ucet">' . pole_heslo() . '<button class="tl hlavne siroke" type="submit">Uložiť a pokračovať</button></form>', 'domov', false);
    }
    $body = Prostredie::kontroly();
    $suhrn = Prostredie::suhrn($body);
    $kod = Pristup::stavKodu();
    $h = '<p class="vela">Vitajte. Správa webu ešte nie je nastavená. Aby sme overili, že ste majiteľ hostingu, správa zapíše na hosting súbor s kódom. Otvoríte ho cez správcu súborov Forpsi a kód opíšete sem.</p>';
    if (!$suhrn['pripravene']) {
        $h .= '<div class="hlaska chyba">Server ešte nie je pripravený: treba nastaviť ' . $suhrn['pocet'] . ' ' . ($suhrn['pocet'] == 1 ? 'vec' : ($suhrn['pocet'] < 5 ? 'veci' : 'vecí')) . '. Odfoťte túto stránku a pošlite ju tomu, kto vám web nahrával.</div>';
        $h .= '<ul class="body">';
        foreach ($body as $b) if ($b['povinne'] && $b['stav'] === 'chyba') $h .= '<li class="chyba">' . Ui::e($b['nazov']) . '</li>';
        Ui::stranka('Prvé nastavenie', $h . '</ul>', 'domov', false);
    }
    $h .= '<div class="hlaska ok">Server je pripravený.</div>';
    if ($kod && $kod['platne'] && $kod['druh'] === 'prvy') {
        $h .= navod_kod(Pristup::KOD_SUBOR['prvy']) . '<form method="post" action="index.php">' . Ui::csrf() . '<input type="hidden" name="a" value="prvy-over">' . pole_kod()
            . '<button class="tl hlavne siroke" type="submit">Overiť kód</button></form>';
    } else {
        $h .= '<form method="post" action="index.php">' . Ui::csrf() . '<input type="hidden" name="a" value="prvy-kod"><button class="tl hlavne siroke" type="submit">Vytvoriť overovací kód</button></form>';
    }
    Ui::stranka('Prvé nastavenie', $h, 'domov', false);
}

function akcie_prve(string $a): void
{
    if ($a === 'prvy-kod') {
        // vždy aj so sondami: kód sa zapíše len vtedy, keď je overené, že priečinok údajov nie je dostupný z webu
        if (!Prostredie::suhrn(Prostredie::kontroly(true))['pripravene']) Ui::presmeruj('', [], 'Server ešte nie je pripravený.', 'chyba');
        $e = Pristup::vytvorKod('prvy');
        Ui::presmeruj('', [], $e ?? 'Kód je zapísaný na hostingu v súbore ' . Pristup::KOD_SUBOR['prvy'] . '.', $e ? 'chyba' : 'ok');
    }
    if ($a === 'prvy-over') {
        if (Pristup::overKod('prvy', (string)($_POST['kod'] ?? ''))) { $_SESSION['prvy_ok'] = time(); session_regenerate_id(true); Ui::presmeruj(); }
        $k = Pristup::stavKodu();
        Ui::presmeruj('', [], ($k && $k['platne']) ? 'Kód nie je správny. Skontrolujte ho a skúste znova (zostáva ' . (5 - $k['pokusy']) . ' pokusov).' : 'Kód už neplatí. Vytvorte nový.', 'chyba');
    }
    if ($a === 'prvy-ucet') {
        if (empty($_SESSION['prvy_ok']) || time() - $_SESSION['prvy_ok'] > 900) Ui::presmeruj('', [], 'Overenie vypršalo. Vytvorte nový kód.', 'chyba');
        $meno = Kontrola::text($_POST['meno'] ?? '', 40);
        $e = Pristup::chybaMena($meno) ?? Pristup::chybaHesla((string)($_POST['heslo'] ?? ''), (string)($_POST['heslo2'] ?? ''), $meno);
        if ($e) { $_SESSION['meno_formular'] = $meno; Ui::presmeruj('', [], $e, 'chyba'); }
        Pristup::nastavUcet($meno, (string)$_POST['heslo'], false);
        unset($_SESSION['prvy_ok']);
        Pristup::prihlas($meno, !empty($_POST['zapamatat']));
        Ui::presmeruj('', [], 'Hotovo. Správa webu je nastavená a ste prihlásený.');
    }
    Ui::chyba('Neznámy úkon.');
}

function obrazovka_prihlasenie(): void
{
    $b = Pristup::blokovane();
    $h = $b ? '<div class="hlaska chyba">' . Ui::e($b) . '</div>' : '';
    $h .= '<form method="post" action="index.php">' . Ui::csrf() . '<input type="hidden" name="a" value="prihlasit">'
        . '<label class="pole"><span>Meno</span><input name="meno" required autocomplete="username" maxlength="40" value="' . Ui::e((string)($_SESSION['meno_prihlasenie'] ?? '')) . '"><small>Na veľkých písmenách a dĺžňoch nezáleží.</small></label>'
        . '<label class="pole"><span>Heslo</span><input type="password" name="heslo" required autocomplete="current-password"></label>'
        . '<label class="prepinac"><input type="checkbox" name="zapamatat" value="1" checked> <span>Zapamätať toto zariadenie (30 dní)</span></label>'
        . '<button class="tl hlavne siroke" type="submit">Prihlásiť sa</button></form>'
        . '<p class="dalsie"><a href="' . Ui::e(Ui::url('obnova')) . '">Zabudli ste heslo?</a></p>';
    Ui::stranka('Prihlásenie', $h, 'domov', false);
}

function obrazovka_obnova(): void
{
    if (!empty($_SESSION['obnova_ok']) && time() - $_SESSION['obnova_ok'] < 900) {
        Ui::stranka('Nové heslo', '<p class="vela">Kód je správny. Zvoľte nové heslo. Všetky zapamätané telefóny sa odhlásia.</p><form method="post" action="index.php?s=obnova">' . Ui::csrf()
            . '<input type="hidden" name="a" value="obnova-heslo">' . pole_heslo() . '<button class="tl hlavne siroke" type="submit">Uložiť nové heslo</button></form>', 'domov', false);
    }
    $k = Pristup::stavKodu();
    $h = '<p class="vela">Heslo obnovíte rovnako ako pri prvom nastavení: správa zapíše na hosting súbor s kódom, vy ho opíšete sem.</p>';
    if ($k && $k['platne'] && $k['druh'] === 'obnova') {
        $h .= navod_kod(Pristup::KOD_SUBOR['obnova']) . '<form method="post" action="index.php?s=obnova">' . Ui::csrf() . '<input type="hidden" name="a" value="obnova-over">' . pole_kod() . '<button class="tl hlavne siroke" type="submit">Overiť kód</button></form>';
    } else {
        $h .= '<form method="post" action="index.php?s=obnova">' . Ui::csrf() . '<input type="hidden" name="a" value="obnova-kod"><button class="tl hlavne siroke" type="submit">Vytvoriť kód na obnovu hesla</button></form>';
    }
    $h .= '<p class="pomocka">Súbor s kódom sa po použití sám zmaže. Ak ste ho otvorili, ale kód sa nepodarilo použiť (napríklad sa zatvoril prehliadač), súbor zmažte a vytvorte nový kód.</p><p class="dalsie"><a href="index.php">Späť na prihlásenie</a></p>';
    Ui::stranka('Zabudnuté heslo', $h, 'domov', false);
}

function akcie_prihlasenie(string $a): void
{
    if ($a === 'prihlasit') {
        if ($b = Pristup::blokovane()) Ui::presmeruj('', [], $b, 'chyba');
        $meno = Kontrola::text($_POST['meno'] ?? '', 40);
        if (Pristup::overHeslo($meno, (string)($_POST['heslo'] ?? ''))) {
            $n = Pristup::prihlas(Pristup::menoUctu($meno), !empty($_POST['zapamatat']));
            Dennik::skrat();
            Zmena::uprac();
            unset($_SESSION['meno_prihlasenie']);
            // D3: bez zdvojeného pozdravu (Domov pozdraví menom); počet zlých pokusov len ako informácia
            if ($n) Ui::presmeruj('', [], 'Od posledného prihlásenia ' . Ui::pocet($n, 'bol %d nesprávny pokus', 'boli %d nesprávne pokusy', 'bolo %d nesprávnych pokusov') . ' o prihlásenie (napríklad preklep v hesle).', 'var');
            Ui::presmeruj();
        }
        $_SESSION['meno_prihlasenie'] = $meno;
        Pristup::zlyPokus();
        Dennik::zapis('prihlasenie-zle', []);
        Ui::presmeruj('', [], 'Meno alebo heslo nie je správne.', 'chyba');
    }
    if ($a === 'obnova-kod') {
        // kód sa zapíše len do priečinka, o ktorom je overené, že nie je dostupný z webu
        if (Nastavenie::$vnutriWebu) {
            $b = array_values(array_filter(Prostredie::kontroly(true), fn($x) => $x['id'] === 'sonda-data'));
            if (!$b || $b[0]['stav'] !== 'ok') Ui::presmeruj('obnova', [], 'Kód sa teraz nedá bezpečne zapísať, server nevie overiť ochranu priečinka údajov. Odfoťte túto stránku a pošlite ju tomu, kto vám web nahrával.', 'chyba');
        }
        $e = Pristup::vytvorKod('obnova');
        Ui::presmeruj('obnova', [], $e ?? 'Kód je zapísaný na hostingu v súbore ' . Pristup::KOD_SUBOR['obnova'] . '. Platí hodinu.', $e ? 'chyba' : 'ok');
    }
    if ($a === 'obnova-over') {
        if (Pristup::overKod('obnova', (string)($_POST['kod'] ?? ''))) { $_SESSION['obnova_ok'] = time(); session_regenerate_id(true); Ui::presmeruj('obnova'); }
        Ui::presmeruj('obnova', [], 'Kód nie je správny alebo už neplatí.', 'chyba');
    }
    if ($a === 'obnova-heslo') {
        if (empty($_SESSION['obnova_ok']) || time() - $_SESSION['obnova_ok'] > 900) Ui::presmeruj('obnova', [], 'Overenie vypršalo. Vytvorte nový kód.', 'chyba');
        $meno = Kontrola::text($_POST['meno'] ?? '', 40);
        $e = Pristup::chybaMena($meno) ?? Pristup::chybaHesla((string)($_POST['heslo'] ?? ''), (string)($_POST['heslo2'] ?? ''), $meno);
        if ($e) { $_SESSION['meno_formular'] = $meno; Ui::presmeruj('obnova', [], $e, 'chyba'); }
        Pristup::nastavUcet($meno, (string)$_POST['heslo'], true);
        unset($_SESSION['obnova_ok']);
        Pristup::prihlas(Pristup::menoUctu($meno), !empty($_POST['zapamatat']));
        Ui::presmeruj('', [], 'Heslo je zmenené a ste prihlásený.');
    }
    Ui::presmeruj();
}
