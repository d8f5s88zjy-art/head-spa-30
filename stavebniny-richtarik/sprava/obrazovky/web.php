<?php
// Domov, náhľad a zverejnenie, História a Vrátiť späť, Nastavenia (heslo, zariadenia, kontrola, export), Pomoc.
defined('SPRAVA') || exit;

function obrazovka_domov(): void
{
    $D = Zmena::pracovne();
    $zive = Zmena::zive();
    $upoz = '';
    $dnes = date('Y-m-d');
    foreach ($D['akcie']['akcie'] as $a)
        if ($a['viditelna'] && $a['stranka'] && $a['plati_do'] && $a['plati_do'] < $dnes)
            $upoz .= '<div class="hlaska var">Akcia „' . Ui::e($a['nazov']) . '“ mala platiť do ' . Ui::e(Kontrola::datum($a['plati_do'])) . '. <a href="' . Ui::e(Ui::url('akcia', ['id' => $a['id']])) . '">Otvoriť a skryť</a></div>';
    $bal = Ulozisko::citajJson(Nastavenie::w('sprava/verzia.json'), []);
    if (isset($bal['revizia']) && $bal['revizia'] < $zive['verzia']['revizia']) {
        $st = Zmena::stavWebu();
        if ($st['rozdielne']) $upoz .= '<div class="hlaska var">Web bol nahratý zo staršej verzie. Vaše zmeny sú uložené. ' . Ui::tlacidlo('obnovit-web', 'Vrátiť na web moje zmeny', 'druhe', [], 'nastavenia') . '</div>';
    }
    // D6: rovnaké počty ako v zozname akcií (na webe / skryté)
    $vid = count(array_filter($D['akcie']['akcie'], fn($a) => $a['viditelna']));
    $skr = count($D['akcie']['akcie']) - $vid;
    $uvod = count(array_filter($D['akcie']['akcie'], fn($a) => $a['viditelna'] && $a['stranka'] && $a['na_uvode']));
    $c = Vykreslenie::cennik_aktualny($D);
    $hod = implode(', ', array_map(fn($r) => $r['kratko'] . ' ' . $r['cas'], Vykreslenie::hodiny_riadky($D)));
    $ozn = count(array_filter($D['firma']['vynimky'] ?? [], fn($v) => $v['do'] >= $dnes));
    $nov = count(array_filter($D['novinky']['novinky'], fn($n) => $n['viditelna']));
    $fot = 0;
    foreach ($D['galeria']['albumy'] as $al) $fot += count(array_filter($al['fotky'], fn($x) => $x['viditelna'] ?? true));
    $dlazdica = fn($s, $nadpis, $popis) => '<a class="dlazdica" href="' . Ui::e(Ui::url($s)) . '"><b>' . Ui::e($nadpis) . '</b><small>' . Ui::e($popis) . '</small></a>';
    $h = '<p class="vela">Dobrý deň' . (Pristup::ucet() ? ', ' . Ui::e(Pristup::ucet()) : '') . '. Čo chcete upraviť?</p>' . $upoz . '<nav class="dlazdice">'
       . $dlazdica('akcie', 'Akcie a ceny', Ui::pocet($vid, '%d na webe', '%d na webe', '%d na webe') . ", $uvod na úvode" . ($skr ? ', ' . Ui::pocet($skr, '%d skrytá', '%d skryté', '%d skrytých') : ''))
       . $dlazdica('cennik', 'Cenník a letáky (PDF)', 'Cenník akcií z ' . $c['datum'])
       . $dlazdica('hodiny', 'Otváracie hodiny a sviatky', $hod . ($ozn ? ' · ' . Ui::pocet($ozn, '%d oznam', '%d oznamy', '%d oznamov') : ''))
       . $dlazdica('novinky', 'Novinky', Ui::pocet($nov, '%d novinka na webe', '%d novinky na webe', '%d noviniek na webe'))
       . $dlazdica('galeria', 'Fotky v galérii', Ui::pocet($fot, '%d fotka a obrázok v galérii a letákoch', '%d fotky a obrázky v galérii a letákoch', '%d fotiek a obrázkov v galérii a letákoch'))
       . $dlazdica('texty', 'Texty stránok', 'Úvod, Služby, O nás, Doprava')
       . $dlazdica('kontakt', 'Telefón a e-mail', $D['firma']['mobil'] . ', ' . $D['firma']['email'])
       . $dlazdica('historia', 'História a Vrátiť späť', 'Čo sa kedy zmenilo')
       . $dlazdica('nastavenia', 'Nastavenia', 'Heslo, zapamätané zariadenia, záloha')
       . $dlazdica('pomoc', 'Pomoc', 'Návod krok za krokom') . '</nav>'
       . '<p class="odkazy"><a href="../index.html" target="_blank" rel="noopener">Otvoriť web ↗</a></p>';
    Ui::stranka('Správa webu', $h);
}

function obrazovka_nahlad(): void
{
    $k = Zmena::koncept();
    if (!$k) Ui::presmeruj('', [], 'Nie je nič rozpracované. Všetko je na webe.');
    $r = Zmena::priprav();
    $var = $_SESSION['varovania'] ?? []; unset($_SESSION['varovania']);
    $DK = Zmena::sKonstantami($k['data']);
    $h = '<p class="vela">Zmena: <b>' . Ui::e(implode(', ', $k['popis'])) . '</b>. Zatiaľ nie je na webe.</p>';
    // S8: čo presne sa zmení (pred → po), bez otvárania stránok
    $vety = Rozdiel::vety(Zmena::zive(), $k['data']);
    if ($vety) $h .= '<h2>Čo sa zmení</h2><ul class="zmeny">' . implode('', array_map(fn($x) => '<li>' . Ui::e($x) . '</li>', $vety)) . '</ul>';
    foreach ($var as $x) $h .= '<div class="hlaska var">' . Ui::e($x) . '</div>';
    // S2: stará cena ostala v textoch akcie – jedným ťuknutím ju nahradiť všade
    $nr = $_SESSION['nahrady'] ?? null;
    if ($nr && ($ia = Ulohy::index($k['data'], $nr['id'])) !== null) {
        $h .= '<div class="hlaska var"><b>Stará cena je ešte v textoch akcie:</b><ul>';
        foreach ($nr['pary'] as $p) $h .= '<li>' . Ui::e($p['stara'] . ' € → ' . $p['nova'] . ' € v poliach: ' . implode(', ', $p['kde'])) . '</li>';
        $h .= '</ul>' . Ui::tlacidlo('nahradit-cenu', 'Nahradiť starú cenu novou všade', 'druhe siroke', [], 'nahlad') . '</div>';
    }
    if ($r['chyby']) {
        $h .= '<div class="hlaska chyba"><b>Takto sa to nedá zverejniť:</b><ul>' . implode('', array_map(fn($x) => '<li>' . Ui::e($x) . '</li>', $r['chyby'])) . '</ul></div>';
    }
    $html = array_values(array_filter($r['zmenene'], fn($p) => str_ends_with($p, '.html')));
    if (!$r['zmenene']) $h .= '<div class="hlaska ok">Na webe by sa nič nezmenilo.</div>';
    else {
        $poradie = array_merge($r['nove'], ['index.html', 'akcie/index.html', 'kontakt.html', 'caste-otazky.html', 'letak.html', 'doprava.html']);
        $hlavne = array_values(array_filter($html, fn($p) => !preg_match('#^(katalog/|404\.html)#', $p)));
        usort($hlavne, fn($x, $y) => (($i = array_search($x, $poradie, true)) === false ? 99 : $i) <=> (($j = array_search($y, $poradie, true)) === false ? 99 : $j) ?: strcmp($x, $y));
        // D3: skloňovanie podľa počtu
        $n = count($html);
        $h .= '<p>' . ($n === 1 ? 'Zmení sa 1 stránka' : Ui::pocet($n, '', 'Zmenia sa %d stránky', 'Zmení sa %d stránok')) . ($r['nove'] ? ' (' . Ui::pocet(count($r['nove']), '%d nová', '%d nové', '%d nových') . ')' : '')
            . '. ' . ($n === 1 ? 'Pozrite si ju:' : 'Pozrite si ich:') . '</p><ul class="zoznam stranky">';
        foreach (array_slice($hlavne, 0, 6) as $p) $h .= '<li><a class="riadok" href="' . Ui::e(Ui::url('stranka', ['p' => $p])) . '" target="_blank" rel="noopener"><b>' . Ui::e(Kontrola::nazovStranky($p, $DK)) . '</b><small>' . (in_array($p, $r['nove'], true) ? 'nová stránka' : 'náhľad') . ' ↗</small></a></li>';
        if (count($html) > count(array_slice($hlavne, 0, 6))) $h .= '<li class="pomocka">… a ďalšie stránky (päta, katalóg) s tou istou zmenou.</li>';
        $h .= '</ul>';
    }
    $h .= '<div class="dole dva">';
    if (!$r['chyby'] && $r['zmenene']) $h .= Ui::tlacidlo('zverejnit', 'Zverejniť na webe', 'hlavne siroke', [], 'nahlad');
    // S3: Späť a „Upraviť ďalej“ vedú do formulára, z ktorého zmena prišla
    [$ns, $nq] = Zmena::navrat($k);
    $h .= '<a class="tl druhe" href="' . Ui::e(Ui::url($ns, $nq)) . '">Upraviť ďalej</a>'
        . Ui::tlacidlo('zahodit', 'Zahodiť zmenu', 'nebezpecne', [], 'nahlad', 'Rozpracovaná zmena sa zahodí. Web ostane, ako je. Pokračovať?') . '</div>'
        . '<p class="pomocka">Zmena ostane uložená, kým ju nezverejníte alebo nezahodíte. Môžete medzitým upraviť aj niečo iné (Domov) a zverejniť všetko naraz.</p>';
    Ui::stranka('Náhľad zmeny', $h, $ns === '' ? 'domov' : $ns, true, $nq);
}

/** Náhľad jednej stránky: zo stagingu (alebo živá), s pásom „Náhľad“. Cesta len zo zoznamu pripravených súborov. */
function obrazovka_stranka(): void
{
    $p = (string)($_GET['p'] ?? '');
    $t = preg_match('#^[a-z0-9][a-z0-9/-]*\.html$#', $p) && !str_contains($p, '..') ? Zmena::stagingSubor($p) : null;
    if ($t === null) { http_response_code(404); Ui::chyba('Náhľad tejto stránky nie je pripravený.', 404); }
    $koren = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/sprava/index.php'))), '/') . '/';
    $base = $koren . (dirname($p) === '.' ? '' : dirname($p) . '/');
    $pas = '<div style="position:sticky;top:0;z-index:9999;background:#b3261e;color:#fff;font:600 16px/1.4 system-ui,sans-serif;padding:10px 16px;text-align:center">Náhľad – zatiaľ nie je na webe. Zatvorte okno a ťuknite Zverejniť.</div>';
    $t = preg_replace('#<head>#', '<head><base href="' . Ui::e($base) . '">', $t, 1);
    $t = preg_replace('#(<body[^>]*>)#', '$1' . $pas, $t, 1);
    $t = str_replace(' data-asistent="ukazka"', '', $t);
    $hashe = [];
    preg_match_all('#<script(?![^>]*\bsrc=)(?![^>]*type="application/ld\+json")[^>]*>(.*?)</script>#s', $t, $m);
    foreach ($m[1] as $s) $hashe[] = "'sha256-" . base64_encode(hash('sha256', $s, true)) . "'";
    Pristup::hlavicky("default-src 'self'; img-src 'self' data: blob:; script-src 'self' " . implode(' ', array_unique($hashe)) . "; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
    header('Content-Type: text/html; charset=utf-8');
    echo $t;
    exit;
}

function akcia_zverejnit(): void
{
    $e = Zmena::zverejni();
    if ($e) Ui::presmeruj('nahlad', [], $e, 'chyba');
    Ui::presmeruj('', [], 'Hotovo. Zmena je na webe. Zákazníci ju uvidia najneskôr o 10 minút. Ak ste sa pomýlili, v Histórii ju vrátite jedným ťuknutím.');
}

function obrazovka_historia(): void
{
    $h = '<p class="vela">Každé zverejnenie sa dá vrátiť. Vrátenie ukáže náhľad a zverejní sa až po potvrdení.</p><ul class="zoznam">';
    $z = Zmena::zalohy();
    if (!$z) $h .= '<li class="pomocka">Zatiaľ ste nič nezverejnili.</li>';
    // S8: pri každom zverejnení aj to, čo sa zmenilo (pred → po), nielen druh zmeny
    foreach (array_slice($z, 0, 40) as $m)
        $h .= '<li><span class="riadok"><b>' . Ui::e(Ui::datumCas($m['cas'])) . '</b><small>' . Ui::e(implode(', ', $m['popis'])) . ' · ' . Ui::e($m['ucet'] ?? '') . '</small>'
            . (!empty($m['zmeny']) ? '<small class="zmeny-h">' . Ui::e(implode(' · ', array_slice($m['zmeny'], 0, 4)) . (count($m['zmeny']) > 4 ? ' · …' : '')) . '</small>' : '') . '</span>'
            . '<div class="posun">' . Ui::tlacidlo('vratit', 'Vrátiť', 'maly', ['id' => $m['id']], 'historia') . '</div></li>';
    Ui::stranka('História a Vrátiť späť', $h . '</ul>');
}

function akcia_vratit(): void
{
    $e = Zmena::vratit((string)($_POST['id'] ?? ''));
    if ($e) Ui::presmeruj('historia', [], $e, 'chyba');
    Ui::presmeruj('nahlad');
}

function obrazovka_nastavenia(): void
{
    $u = Pristup::ucet();
    $h = '<h2>Zmena hesla</h2><form method="post" action="index.php?s=nastavenia">' . Ui::csrf() . '<input type="hidden" name="a" value="heslo">'
       . '<label class="pole"><span>Súčasné heslo</span><input type="password" name="stare" required autocomplete="current-password"></label>'
       . '<label class="pole"><span>Nové heslo</span><input type="password" name="heslo" required minlength="10" autocomplete="new-password"><small>Aspoň 10 znakov.</small></label>'
       . '<label class="pole"><span>Nové heslo ešte raz</span><input type="password" name="heslo2" required minlength="10" autocomplete="new-password"></label>'
       . '<button class="tl druhe siroke" type="submit">Zmeniť heslo</button></form>';
    $h .= '<h2>Zapamätané telefóny a počítače</h2><ul class="zoznam">';
    foreach (Pristup::zariadenia($u) as $z)
        $h .= '<li><span class="riadok"><b>' . Ui::e(Ui::zariadenie((string)($z['popis'] ?? ''))) . '</b><small>naposledy ' . Ui::e(Ui::datumCas($z['pouzite'])) . '</small></span><div class="posun">'
            . Ui::tlacidlo('zariadenie-odhlasit', 'Odhlásiť', 'maly', ['id' => $z['id']], 'nastavenia') . '</div></li>';
    $h .= '</ul>' . Ui::tlacidlo('zariadenia-vsetky', 'Odhlásiť všetky zariadenia', 'nebezpecne', [], 'nastavenia', 'Všetky zapamätané zariadenia sa odhlásia. Pokračovať?');
    $h .= '<h2>Server a web</h2><p><a class="tl druhe siroke" href="' . Ui::e(Ui::url('kontrola')) . '">Skontrolovať server</a></p>'
        . '<p class="pomocka">Ak niekto nahral na hosting starší web a zmizli vaše zmeny:</p>' . Ui::tlacidlo('obnovit-web', 'Vrátiť na web moje zmeny', 'druhe siroke', [], 'nastavenia');
    $h .= '<h2>Stiahnuť zálohu pre programátora</h2><p class="pomocka">Súbor ZIP s údajmi webu, nahratými fotkami a PDF. Heslá ani záznamy prihlásení v ňom nie sú.</p>'
        . '<form method="post" action="index.php?s=nastavenia">' . Ui::csrf() . '<input type="hidden" name="a" value="export"><label class="pole"><span>Vaše heslo</span><input type="password" name="heslo" required autocomplete="current-password"></label>'
        . '<button class="tl druhe siroke" type="submit">Stiahnuť zálohu</button></form>'
        . '<p class="pomocka">Hosting Forpsi navyše robí vlastné zálohy každý deň (zákaznícky účet Forpsi).</p>';
    Ui::stranka('Nastavenia', $h);
}

function akcia_nastavenia(string $a): void
{
    $u = Pristup::ucet();
    if ($a === 'heslo') {
        $e = Pristup::zmenHeslo($u, (string)($_POST['stare'] ?? ''), (string)($_POST['heslo'] ?? ''), (string)($_POST['heslo2'] ?? ''));
        if ($e) { Pristup::zlyPokus(); Ui::presmeruj('nastavenia', [], $e, 'chyba'); }
        Pristup::prihlas($u, false);
        Ui::presmeruj('nastavenia', [], 'Heslo je zmenené. Ostatné zariadenia sa odhlásili.');
    }
    if ($a === 'zariadenie-odhlasit') { Pristup::zmazZariadenie((string)($_POST['id'] ?? '')); Ui::presmeruj('nastavenia', [], 'Zariadenie je odhlásené.'); }
    if ($a === 'zariadenia-vsetky') { Pristup::odhlasVsetko($u); Ui::presmeruj('nastavenia', [], 'Všetky zariadenia sú odhlásené.'); }
    if ($a === 'obnovit-web') {
        if (Zmena::koncept()) Ui::presmeruj('nahlad', [], 'Najprv zverejnite alebo zahoďte rozpracovanú zmenu.', 'var');
        $e = Zmena::ulozKoncept(Zmena::zive(), 'Obnovenie webu podľa uložených údajov');
        if ($e) Ui::presmeruj('nastavenia', [], $e, 'chyba');
        Ui::presmeruj('nahlad');
    }
    if ($a === 'export') {
        if (!Pristup::overHeslo($u, (string)($_POST['heslo'] ?? ''))) { Pristup::zlyPokus(); Ui::presmeruj('nastavenia', [], 'Heslo nie je správne.', 'chyba'); }
        Export::stiahnut();
    }
    Ui::presmeruj('nastavenia');
}

function obrazovka_kontrola(): void
{
    $body = Prostredie::kontroly();
    $h = '<ul class="body">';
    foreach ($body as $b) $h .= '<li class="' . Ui::e($b['stav']) . '"><b>' . Ui::e($b['nazov']) . '</b><small>' . Ui::e($b['detail']) . '</small></li>';
    $h .= '</ul><p class="pomocka">PHP ' . Ui::e(PHP_VERSION) . ' · ' . Ui::e(PHP_OS_FAMILY) . ' · údaje: ' . Ui::e(Nastavenie::$vnutriWebu ? 'v priečinku webu (chránené)' : 'mimo webu') . '</p>';
    Ui::stranka('Kontrola servera', $h, 'nastavenia');
}

function obrazovka_pomoc(): void
{
    $h = <<<'HTML'
<section class="pomoc">
<h2>Ako to funguje</h2>
<p>Každá zmena má tri kroky: <b>upravíte</b> → <b>pozriete náhľad</b> → <b>zverejníte</b>. Kým neťuknete Zverejniť, web sa nemení. V náhľade je zoznam „Čo sa zmení“. Hore vždy vidíte, či je všetko na webe, alebo čaká nezverejnená zmena. Z náhľadu sa tlačidlom <b>Upraviť ďalej</b> vrátite do formulára.</p>
<h2>Zmeniť cenu v akcii</h2>
<ol><li>Akcie a ceny → ťuknite na akciu.</li><li>V časti 4. Ceny prepíšte cenu (napríklad 4,59 €/vrece).</li><li>Pozrieť náhľad. Ak je stará cena aj v texte akcie, v štítku alebo v textoch pre Google, náhľad to ukáže a jedným ťuknutím ju nahradíte všade.</li><li>Fotku letáku so starou cenou správa nezmení: odfoťte nový leták alebo ho pri akcii odstráňte.</li><li>Zverejniť na webe. Nad cenami bude „Akciové ceny (zadané …)“ s dnešným dátumom.</li></ol>
<h2>Pridať novú akciu</h2>
<ol><li>Akcie a ceny → + Pridať akciu.</li><li>Napíšte názov, vyberte štítok a napíšte, čo je v akcii.</li><li>Odfoťte leták alebo pridajte PDF.</li><li>Ceny sú nepovinné. Môžete zaškrtnúť „Ukázať na úvode“ a vybrať fotku v hlavičke (alebo „Bez fotky“).</li><li>Pozrieť náhľad → Zverejniť na webe.</li></ol>
<h2>Skončila akcia</h2>
<p>Otvorte akciu a dole ťuknite <b>Skryť akciu z webu</b>. Zmizne zo zoznamov a z úvodu, stránka ostane s vetou, že akcia skončila. Ak kvôli nej predtým z úvodu ustúpila iná akcia, vráti sa na úvod. Neskôr ju môžete znova zobraziť.</p>
<h2>Nový cenník akcií v PDF</h2>
<p>Cenník a letáky → Nahrať nový cenník. Ak sa ceny v tabuľkách zmenili, nechajte „Zatiaľ ich skryť“ a ceny potom prepíšte pri akciách. Web nikdy neukáže starú cenu s dátumom nového cenníka.</p>
<h2>Otváracie hodiny, sviatok, dovolenka</h2>
<p>Bežné hodiny: Otváracie hodiny a sviatky → zaškrtnite dni a časy → Pozrieť náhľad → Zverejniť. Zmenia sa naraz na všetkých stránkach. Z webu sa pritom skryjú obrázky s dnešnými hodinami (hodiny na Kontakte, leták Prečo nakupovať u nás, tabuľa s adresou); náhľad ich vymenuje.</p>
<p>Sviatok alebo dovolenka: na tej istej obrazovke dole vyplňte dátum od – do, vyberte „Zatvorená“ alebo iný čas a napíšte názov (napríklad Vianoce). Bežné hodiny sa nemenia. Po poslednom dni oznam z webu sám zmizne.</p>
<h2>Novinka</h2>
<p>Novinky → + Pridať novinku → názov, krátky popis, text, fotky alebo PDF → Pozrieť náhľad → Zverejniť. Pri starej novinke môžete zmeniť názov, popis, pridať text a fotky, alebo ju skryť.</p>
<h2>Fotky v galérii</h2>
<p>Fotky v galérii → pri albume Predajňa alebo Areál ťuknite Pridať fotku a napíšte, čo je na nej. Pri fotke ťuknite na jej popis: môžete ju nahradiť inou, zmeniť popis, posunúť alebo skryť.</p>
<p>Na tej istej obrazovke sú aj vaše letáky a bannery (stránka Akciový leták) a logá, tabule, vizitka a karta (album Logo a firemná grafika v Galérii). Opravený leták nahrajte cez „Nahradiť inou fotkou“, nepotrebný skryte. Obrázok, na ktorom je telefón, e-mail, adresa alebo otváracie hodiny (leták Prečo nakupovať u nás, leták so sortimentom, tabuľa s adresou, vizitka, zákaznícka karta), sa na webe ukazuje, len kým sú tieto údaje v správe rovnaké ako na ňom. Po zmene údajov sa sám skryje a v správe pri ňom uvidíte „nie je na webe“; keď nahráte nový obrázok so správnymi údajmi, bude na webe znova. Keď zmenu údajov vrátite v Histórii, starý obrázok sa vráti sám.</p>
<h2>Texty stránok</h2>
<p>Texty stránok → upravte vetu alebo odsek na Úvode, v Službách, O nás alebo v Doprave → Pozrieť náhľad → Zverejniť. Vzhľad stránky ostáva.</p>
<h2>Telefón a e-mail</h2>
<p>Telefón a e-mail → prepíšte číslo alebo e-mail → Pozrieť náhľad → Zverejniť. Zmení sa na všetkých stránkach naraz, aj na tlačidlách Zavolať a v údajoch pre Google. Obrázky s číslom alebo e-mailom v obrázku sa po zmene z webu skryjú a náhľad ich vymenuje: „Zavolajte nám“ a „Napíšte nám“ na Kontakte (nové pripraví programátor), vizitka, zákaznícka karta a tabuľa s adresou v Galérii a leták so sortimentom (nahradíte ich sami vo Fotkách v galérii).</p>
<h2>Pomýlil som sa</h2>
<p>História a Vrátiť späť → pri zmene je napísané, čo sa zmenilo → ťuknite Vrátiť → Zverejniť. Vrátiť sa dá aj vrátenie. Nová akcia alebo novinka sa pri vrátení skryje (stránka ostane s vetou, že skončila); úplne ju zmaže programátor.</p>
<h2>Odhlásenie</h2>
<p>Odhlásiť zruší aj zapamätanie tohto zariadenia. Nabudúce sa prihlásite menom a heslom.</p>
<h2>Zabudol som heslo</h2>
<p>Na prihlásení ťuknite „Zabudli ste heslo?“. Správa zapíše na hosting súbor OBNOVA-KOD.txt; otvoríte ho rovnako ako pri prvom nastavení (programom FileZilla alebo na webftp.forpsi.com, údajmi k FTP).</p>
<h2>Čo sa tu nedá</h2>
<p>Vzhľad webu, menu, katalóg a značky, adresu a IČO mení programátor. Pošlite mu, čo chcete zmeniť.</p>
</section>
HTML;
    Ui::stranka('Pomoc', $h);
}
