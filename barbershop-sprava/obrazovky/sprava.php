<?php
// Obrazovky prihláseného: domov (čo je zapnuté, úpravy webu, krok späť, nový balík), nastavenia štyroch funkcií,
// história a kontrola hostingu.
defined('B30S') || exit;

function akcie_spravy(string $a): void
{
    $kto = (string) Pristup::ucet();
    $zverejni = function (string $s, string $text) {
        $r = Prepinace::zapis();
        Ui::presmeruj($s, [], $text . ($r['chyby'] ? "\n" . implode("\n", $r['chyby']) : ''), $r['chyby'] ? 'chyba' : 'ok');
    };
    switch ($a) {
        case 'odhlasit': Pristup::odhlas(); Ui::presmeruj('', [], 'Odhlásené.');
        case 'asistent':
            $e = Nastavenia::ulozAsistenta((string) ($_POST['kluc'] ?? ''), !empty($_POST['suhlas']), (int) ($_POST['strop'] ?? Nastavenia::STROP[2]), $kto);
            if ($e) Ui::presmeruj('nastavenia', [], $e, 'chyba');
            $api = Prostredie::spojenieApi();
            $r = Prepinace::zapis();
            $text = $r['stav']['asistent'] !== '' ? 'Asistent Barber je zapnutý a na webe sa ukáže.' : 'Uložené, ale asistent je zatiaľ vypnutý: ' . ($r['dovody']['asistent'] ?? '');
            if ($api['stav'] !== 'ok') $text .= "\n" . $api['detail'];
            Ui::presmeruj('nastavenia', [], $text . ($r['chyby'] ? "\n" . implode("\n", $r['chyby']) : ''), $r['stav']['asistent'] !== '' && !$r['chyby'] ? 'ok' : 'var');
        case 'asistent-odstranit':
            Nastavenia::odstranKluc();
            $zverejni('nastavenia', 'Kľúč je odstránený a asistent Barber sa na webe neukáže.');
        case 'kalendar':
            $e = Nastavenia::ulozKalendar(!empty($_POST['zapnut']), !empty($_POST['suhlas']), $kto);
            if ($e) Ui::presmeruj('nastavenia', [], $e, 'chyba');
            $r = Prepinace::zapis();
            $text = !empty($_POST['zapnut']) ? ($r['stav']['objednavka'] !== '' ? 'Voľné termíny sú zapnuté. Vyskúšaj ich tlačidlom Vyskúšať v časti Voľné termíny nižšie.' : 'Uložené, ale voľné termíny sú zatiaľ vypnuté: ' . ($r['dovody']['objednavka'] ?? '')) : 'Voľné termíny sú vypnuté. Okno objednávky ponúkne Zavolať a rezervačný systém.';
            Ui::presmeruj('nastavenia', [], $text . ($r['chyby'] ? "\n" . implode("\n", $r['chyby']) : ''), $r['chyby'] || (!empty($_POST['zapnut']) && $r['stav']['objednavka'] === '') ? 'var' : 'ok');
        case 'kalendar-skusit':
            $r = Nastavenia::skusKalendar();
            Ui::presmeruj('nastavenia', [], $r['text'], $r['ok'] ? 'ok' : 'chyba');
        case 'vernost':
            $e = Nastavenia::ulozVernost((string) ($_POST['heslo'] ?? ''), (string) ($_POST['heslo2'] ?? ''), (string) ($_POST['email'] ?? ''), $kto);
            if ($e) Ui::presmeruj('nastavenia', [], $e, 'chyba');
            $r = Prepinace::zapis();
            Ui::presmeruj('nastavenia', [], ($r['stav']['vernost'] ? 'Vernostná kartička je zapnutá. Recepcia sa prihlási na ' . Miesto::zaklad() . 'vernost/admin/ heslom, ktoré si práve nastavil.' : 'Uložené, ale kartička je zatiaľ vypnutá: ' . ($r['dovody']['vernost'] ?? '')) . ($r['chyby'] ? "\n" . implode("\n", $r['chyby']) : ''), $r['stav']['vernost'] && !$r['chyby'] ? 'ok' : 'var');
        case 'vernost-vypnut':
            Nastavenia::vypniVernost();
            $zverejni('nastavenia', 'Vernostná kartička je vypnutá a heslo recepcie zrušené (admin kartičiek sa neotvorí). Kartičky klientov ostávajú uložené; pri opätovnom zapnutí nastav heslo recepcie znova.');
        case 'proxy':
            if ($e = Nastavenia::ulozProxy((string) ($_POST['proxy'] ?? ''))) Ui::presmeruj('nastavenia', [], $e, 'chyba');
            Ui::presmeruj('nastavenia', [], 'Adresy proxy sú uložené.');
        case 'heslo':
            $e = Pristup::zmenHeslo($kto, (string) ($_POST['stare'] ?? ''), (string) ($_POST['heslo'] ?? ''), (string) ($_POST['heslo2'] ?? ''));
            Ui::presmeruj('nastavenia', [], $e ?? 'Heslo je zmenené. Ostatné zariadenia sú odhlásené.', $e ? 'chyba' : 'ok');
        case 'zverejnit': $zverejni('', 'Nastavenie je zapísané na web.');
        case 'spat':
            $r = Zmena::spat($kto);
            Ui::presmeruj('', [], $r['ok'] ? ($r['spat_spat'] ? 'Krok späť je vrátený, web je znova po poslednom uložení.' : 'Hotovo, web je ako pred posledným uložením. Krok späť sa dá tiež vrátiť.') : $r['chyba'], $r['ok'] ? 'ok' : 'chyba');
        case 'balik-novy': case 'balik-moje':
            $r = Zmena::prevezmiBalik($a === 'balik-moje' ? 'moje' : 'novy', $kto);
            if (!$r['ok']) Ui::presmeruj('', [], $r['chyba'], 'chyba');
            $p = Prepinace::zapis();
            Ui::presmeruj('', [], 'Aktualizácia je dokončená, zapnuté funkcie sú znova na webe.' . ($r['vynechane'] ? "\nTieto súbory ostali z nového balíka (moja úprava sa do nich nedala preniesť): " . implode(', ', $r['vynechane']) . '.' : '') . ($p['chyby'] ? "\n" . implode("\n", $p['chyby']) : ''), $p['chyby'] ? 'chyba' : 'ok');
        case 'kontrola-znova':
            Prostredie::kontroly(true);
            Ui::presmeruj('kontrola', [], 'Kontrola hostingu je urobená znova.');
        case 'export':
            $f = Export::vytvor();
            Pristup::hlavicky();
            header('Content-Type: application/zip');
            header('Content-Disposition: attachment; filename="' . basename($f) . '"');
            header('Content-Length: ' . filesize($f));
            readfile($f);
            exit;
    }
    Ui::chyba('Neznámy úkon.');
}

function riadok_stavu(string $nazov, bool $zapnute, string $dovod, string $ako): string
{
    return '<li class="' . ($zapnute ? 'ok' : 'vyp') . '"><span class="znak" aria-hidden="true">' . ($zapnute ? '✓' : '–') . '</span><div><b>' . Ui::e($nazov) . '</b> <span class="stit ' . ($zapnute ? 'ok' : 'var') . '">' . ($zapnute ? 'na webe zapnuté' : 'vypnuté') . '</span>'
        . '<p>' . Ui::e($zapnute ? $ako : $dovod) . '</p></div></li>';
}

function obrazovka_domov(): void
{
    $h = '';
    if (Zmena::novyBalik()) {
        $moje = Zmena::upravene();
        $h .= '<div class="karta dolezite"><h2>Na hostingu je novší balík webu</h2><p class="lead">Po nahratí nového balíka sú funkcie na webe vypnuté, kým aktualizáciu nedokončíš.</p>'
            . Ui::tlacidlo('balik-novy', 'Dokončiť aktualizáciu', 'hlavne')
            . ($moje ? '<p class="pozn">V správe sú tvoje úpravy (' . count($moje) . ' súborov). Nový balík ich už má obsahovať, ak si predtým poslal export. Ak nie, môžeš ich ponechať a znovu zverejniť:</p>' . Ui::tlacidlo('balik-moje', 'Ponechať moje úpravy a znovu zverejniť', 'tiche') : '') . '</div>';
    }
    $ciel = Nastavenia::cielovyStav();
    $web = is_file(Miesto::w('index.html')) ? Prepinace::precitaj((string) file_get_contents(Miesto::w('index.html'))) : ['asistent' => '', 'objednavka' => '', 'vernost' => false];
    $nesedi = ($web['asistent'] !== '') !== ($ciel['asistent'] !== '') || ($web['objednavka'] !== '') !== ($ciel['objednavka'] !== '') || $web['vernost'] !== $ciel['vernost'];
    $h .= '<h2>Čo je na webe zapnuté</h2><ul class="body">'
        . riadok_stavu('Asistent Barber', $web['asistent'] !== '', $ciel['dovody']['asistent'] ?? 'Zapíše sa po ťuknutí na Zapísať nastavenie na web.', 'Ikona asistenta s označením AI je na webe.')
        . riadok_stavu('Voľné termíny v okne objednávky', $web['objednavka'] !== '', $ciel['dovody']['objednavka'] ?? 'Zapíše sa po ťuknutí na Zapísať nastavenie na web.', 'Okno Objednať sa ukazuje barberov, dni a voľné časy.')
        . riadok_stavu('Vernostná kartička', $web['vernost'], $ciel['dovody']['vernost'] ?? 'Zapíše sa po ťuknutí na Zapísať nastavenie na web.', 'Prihláška ku kartičke je na webe, recepcia má admin kartičiek.')
        . '</ul>';
    if ($nesedi && !Zmena::novyBalik()) $h .= '<div class="hlaska var">Web sa líši od nastavenia.</div>' . Ui::tlacidlo('zverejnit', 'Zapísať nastavenie na web', 'hlavne');
    if ($u = Nastavenia::upozornenieStropu()) $h .= '<div class="hlaska var">' . Ui::e($u) . '</div>';
    $h .= '<p class="rad"><a class="tl" href="' . Ui::e(Ui::url('nastavenia')) . '">Nastavenia funkcií</a></p>';

    $h .= '<h2>Úpravy webu</h2><p class="lead">Texty, cenník, tím, galéria, kontakt a hodiny, odpovede asistenta. Uloženie je na webe hneď, po slovensky aj po anglicky.</p>'
        . '<p class="rad"><a class="tl hlavne" href="upravy/">Upraviť web</a>' . (Nastavenia::vernostHeslo() ? ' <a class="tl" href="../vernost/admin/" target="_blank" rel="noopener">Admin kartičiek</a>' : '') . '</p>';
    $v = Zmena::daSaVratit();
    if ($v) $h .= '<div class="karta"><b>' . ($v['typ'] === 'spat' ? 'Posledný krok späť' : 'Posledné uloženie') . '</b> ' . Ui::e(Ui::datumCas($v['cas'])) . '<p class="pozn">' . Ui::e(implode('; ', array_slice($v['zmeny'], 0, 4)) . (count($v['zmeny']) > 4 ? ' a ďalšie' : '')) . '</p>'
        . Ui::tlacidlo('spat', $v['typ'] === 'spat' ? 'Vrátiť krok späť' : 'Krok späť (vrátiť posledné uloženie)', 'tiche') . '</div>';

    $h .= '<h2>Ďalšie</h2><p class="rad"><a class="tl" href="' . Ui::e(Ui::url('historia')) . '">História</a> <a class="tl" href="' . Ui::e(Ui::url('kontrola')) . '">Kontrola hostingu</a></p>'
        . '<div class="karta"><b>Export pre tvorcu webu</b><p class="pozn">Súbor ZIP s tvojimi úpravami. Pošli ho tvorcovi webu, aby ich mal aj v ďalšej verzii webu. Nie sú v ňom heslá, kľúč ani kartičky klientov.</p>' . Ui::tlacidlo('export', 'Stiahnuť export', 'tiche') . '</div>';
    Ui::stranka('Správa webu', $h);
}

function obrazovka_nastavenia(): void
{
    $u = Ui::url('nastavenia'); $z = Miesto::zaklad();
    $form = fn(string $a, string $telo, string $tl, string $trieda = 'hlavne') => '<form method="post" action="' . Ui::e($u) . '">' . Ui::csrf() . '<input type="hidden" name="a" value="' . $a . '">' . $telo . '<button class="tl ' . $trieda . '" type="submit">' . Ui::e($tl) . '</button></form>';
    $h = '<p class="lead">Každú časť môžeš preskočiť a vrátiť sa k nej neskôr. Kľúč API ani heslá nikomu neposielaj, ani tvorcovi webu.</p>';

    // asistent
    $ma = Nastavenia::maKluc(); $dnes = Nastavenia::otazokDnes();
    $h .= '<section class="karta" id="asistent"><h2>Asistent Barber</h2><p class="lead">Odpovedá návštevníkom na otázky o službách, cenách a hodinách. Na webe je označený ako AI. Potrebuje kľúč API z účtu prevádzky na platform.claude.com; platí sa za použitie priamo z toho účtu.</p>'
        . ($ma ? '<p class="pozn">Kľúč je uložený od ' . Ui::e(Ui::datumCas(Nastavenia::klucOd())) . '. Z bezpečnosti sa už nezobrazí; nový kľúč ho nahradí.' . ($dnes !== null ? ' Otázok za posledných 24 hodín: ' . $dnes . '.' : '') . '</p>' : '')
        . (($u = Nastavenia::upozornenieStropu()) ? '<div class="hlaska var">' . Ui::e($u) . '</div>' : '')
        . '<p class="pozn">Bežná otázka stojí rádovo 1 až 3 centy, najdlhšia asi 20 centov. V účte na platform.claude.com si nastav mesačný limit útraty (napríklad 30 €): po jeho minutí asistent prestane odpovedať a web ponúkne telefón.</p>'
        . $form('asistent',
            '<div class="f"><label for="kluc">' . ($ma ? 'Nový kľúč API (nechaj prázdne, ak sa nemení)' : 'Kľúč API') . '</label><input id="kluc" name="kluc" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"></div>'
          . '<label class="chk"><input type="checkbox" name="suhlas" value="1"' . (Nastavenia::suhlasAsistent() ? ' checked' : '') . '> Barbershop 30 súhlasí so zapnutím asistenta a s platbou za jeho použitie z účtu prevádzky.</label>'
          . '<div class="f"><label for="strop">Najviac otázok za deň na celom webe<small>strop nákladov, ' . Nastavenia::STROP[0] . ' až ' . Nastavenia::STROP[1] . '</small></label><input id="strop" name="strop" type="number" inputmode="numeric" min="' . Nastavenia::STROP[0] . '" max="' . Nastavenia::STROP[1] . '" value="' . Nastavenia::strop() . '"></div>', 'Uložiť asistenta')
        . ($ma ? Ui::tlacidlo('asistent-odstranit', 'Odstrániť kľúč a vypnúť asistenta', 'tiche', [], 'nastavenia') : '') . '</section>';

    // voľné termíny
    $kal = Nastavenia::kalendarZapnuty();
    $h .= '<section class="karta" id="terminy"><h2>Voľné termíny v okne objednávky</h2><p class="lead">Okno Objednať sa ukáže barberov, dni a voľné časy z vášho rezervačného systému. Web ich len číta; objednávku zákazník dokončí v rezervačnom systéme. Kým je to vypnuté, okno ponúkne Zavolať a odkaz na rezervačný systém.</p>'
        . $form('kalendar',
            '<label class="chk"><input type="checkbox" name="zapnut" value="1"' . ($kal ? ' checked' : '') . '> Zapnúť voľné termíny</label>'
          . '<label class="chk"><input type="checkbox" name="suhlas" value="1"' . (Nastavenia::suhlasKalendar() ? ' checked' : '') . '> Barbershop 30 súhlasí, aby web čítal voľné termíny z vlastného rezervačného systému. Web nikdy nič neobjednáva.</label>', 'Uložiť voľné termíny')
        . ($kal ? Ui::tlacidlo('kalendar-skusit', 'Vyskúšať', 'tiche', [], 'nastavenia') . '<p class="pozn">Vyskúšať urobí jedno čítanie barberov pre Pánsky strih. Daj o zapnutí vedieť správcovi rezervačného systému.</p>' : '') . '</section>';

    // kartička
    $vh = Nastavenia::vernostHeslo();
    $h .= '<section class="karta" id="karticka"><h2>Vernostná kartička</h2><p class="lead">Zákazník si kartičku založí v telefóne, recepcia mu zapisuje návštevy v admine kartičiek. Recepcia má vlastné heslo, iné než heslo správy.</p>'
        . ($vh ? '<p class="pozn">Heslo recepcie je nastavené od ' . Ui::e(Ui::datumCas(Nastavenia::vernostOd())) . '. Admin kartičiek: <a href="../vernost/admin/" target="_blank" rel="noopener">' . Ui::e($z) . 'vernost/admin/</a>, stránka pre nového klienta (QR): ' . Ui::e($z) . 'karta/?nova</p>' : '')
        . $form('vernost',
            '<div class="f"><label for="vheslo">' . ($vh ? 'Nové heslo recepcie (nechaj prázdne, ak sa nemení)' : 'Heslo recepcie') . '<small>aspoň 10 znakov</small></label><input id="vheslo" name="heslo" type="password" autocomplete="new-password"></div>'
          . '<div class="f"><label for="vheslo2">Heslo recepcie ešte raz</label><input id="vheslo2" name="heslo2" type="password" autocomplete="new-password"></div>'
          . '<div class="f"><label for="vemail">E‑mail odosielateľa<small>nepovinné; z neho príde klientovi odkaz na kartičku</small></label><input id="vemail" name="email" type="email" autocomplete="off" value="' . Ui::e(Nastavenia::vernostEmail()) . '"></div>', 'Uložiť kartičku')
        . ($vh ? Ui::tlacidlo('vernost-vypnut', 'Vypnúť kartičku a prístup recepcie', 'tiche', [], 'nastavenia') : '') . '</section>';

    // úpravy webu
    $h .= '<section class="karta"><h2>Úpravy webu</h2><p class="lead">Sú pripravené, netreba nič zapínať.</p><p class="rad"><a class="tl hlavne" href="upravy/">Upraviť web</a></p></section>';

    // heslo správy a proxy
    $h .= '<section class="karta"><h2>Heslo správy</h2>' . $form('heslo',
            '<div class="f"><label for="stare">Súčasné heslo</label><input id="stare" name="stare" type="password" autocomplete="current-password" required></div>' . polia_hesla('Nové heslo'), 'Zmeniť heslo', 'tiche') . '</section>';
    $h .= '<details class="karta"><summary>Adresy proxy hostingu (len na pokyn tvorcu webu)</summary><p class="pozn">Keď kontrola hostingu hlási, že server vidí adresu proxy namiesto návštevníka, sem patria adresy proxy (jedna na riadok).</p>'
        . $form('proxy', '<div class="f"><label for="proxy">Adresy IP</label><textarea id="proxy" name="proxy" rows="3" spellcheck="false">' . Ui::e(implode("\n", Nastavenia::proxy())) . '</textarea></div>', 'Uložiť adresy', 'tiche') . '</details>';
    Ui::stranka('Nastavenia', $h, 'domov');
}

function obrazovka_historia(): void
{
    $typy = ['ulozenie' => 'Uloženie', 'spat' => 'Krok späť', 'balik' => 'Nový balík'];
    $h = '<p class="lead">Posledných 30 uložení. Ku každému je záloha.</p><ul class="body">';
    $r = Zmena::historia(30);
    foreach ($r as $x) $h .= '<li class="vyp"><div><b>' . Ui::e(Ui::datumCas($x['cas'])) . '</b> · ' . Ui::e($typy[$x['typ']] ?? $x['typ']) . ' · ' . Ui::e($x['kto'])
        . ($x['stav'] === 'vratene' ? ' <span class="stit var">vrátené</span>' : ($x['stav'] !== 'hotove' ? ' <span class="stit var">nedokončené, vrátené zo zálohy</span>' : ''))
        . '<p>' . Ui::e(implode('; ', $x['zmeny'])) . '</p></div></li>';
    $h .= '</ul>' . (!$r ? '<p class="lead">Zatiaľ žiadne uloženie.</p>' : '');
    Ui::stranka('História', $h, 'domov');
}

function obrazovka_kontrola(): void
{
    $p = Prostredie::posledne();
    $body = $p ? $p['body'] : Prostredie::kontroly(true);
    $h = '<p class="lead">Naposledy ' . Ui::e(Ui::datumCas($p['cas'] ?? time())) . '.</p>' . Ui::body($body, true) . Ui::tlacidlo('kontrola-znova', 'Skontrolovať znova', 'hlavne', [], 'kontrola');
    Ui::stranka('Kontrola hostingu', $h, 'domov');
}
