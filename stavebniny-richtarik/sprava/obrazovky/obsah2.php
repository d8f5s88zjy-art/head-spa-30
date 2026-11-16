<?php
// Obrazovky: novinky, oznam k otváracím hodinám, fotky v galérii, texty stránok a kontakt.
defined('SPRAVA') || exit;

function vyber_hlavicky(string $akt, bool $bez = true): string
{
    $K = Nastavenie::konstanty();
    $h = '<div class="hlavicky">' . ($bez ? '<label class="hl bez"><input type="radio" name="hlavicka" value="bez"' . ($akt === '' ? ' checked' : '') . '><span>Bez fotky</span></label>' : '');
    foreach ($K['hlavicky'] as $spec => $x) $h .= '<label class="hl"><input type="radio" name="hlavicka" value="' . Ui::e($spec) . '"' . ($spec === $akt ? ' checked' : '') . ' aria-label="Fotka ' . Ui::e($spec) . '"><img src="../' . Ui::e($x['nahlad']) . '" alt="" loading="lazy" width="120" height="90"></label>';
    return $h . '</div>';
}

// ---------- novinky ----------
function obrazovka_novinky(): void
{
    $D = Zmena::pracovne();
    $vid = count(array_filter($D['novinky']['novinky'], fn($n) => $n['viditelna']));
    $skr = count($D['novinky']['novinky']) - $vid;
    $h = '<p class="vela">' . Ui::pocet($vid, '%d novinka na webe', '%d novinky na webe', '%d noviniek na webe') . ($skr ? ', ' . Ui::pocet($skr, '%d skrytá', '%d skryté', '%d skrytých') : '') . '. Prvé štyri označené „na úvode“ sú aj na úvodnej stránke.</p>'
       . '<p><a class="tl hlavne siroke" href="' . Ui::e(Ui::url('novinka', ['id' => 'nova'])) . '">+ Pridať novinku</a></p><ul class="zoznam">';
    foreach ($D['novinky']['novinky'] as $n) {
        $stav = !$n['viditelna'] ? '<span class="znak sivy">skrytá</span>' : (!empty($n['na_uvode']) ? '<span class="znak">na úvode</span>' : '');
        $h .= '<li class="' . ($n['viditelna'] ? '' : 'skryta') . '"><a class="riadok" href="' . Ui::e(Ui::url('novinka', ['id' => $n['id']])) . '"><b>' . Ui::e($n['nazov']) . '</b>' . $stav . '</a>'
            . '<div class="posun">' . Ui::tlacidlo('novinka-vyssie', '↑', 'maly', ['id' => $n['id']], 'novinky') . Ui::tlacidlo('novinka-nizsie', '↓', 'maly', ['id' => $n['id']], 'novinky') . '</div></li>';
    }
    Ui::stranka('Novinky', $h . '</ul>');
}

function obrazovka_novinka(): void
{
    $D = Zmena::pracovne();
    $K = Nastavenie::konstanty();
    $id = (string)($_GET['id'] ?? '');
    $nova = $id === 'nova';
    $i = $nova ? null : Obsah::index($D, $id);
    if (!$nova && $i === null) Ui::chyba('Novinka neexistuje.', 404);
    $n = $nova ? ['nazov' => '', 'popis' => '', 'odseky' => [], 'fotky' => [], 'pdf' => [], 'na_uvode' => false, 'hlavicka' => null, 'verzia' => 0, 'viditelna' => true, 'zdroj' => 'sprava', 'id' => '']
               : $D['novinky']['novinky'][$i];
    $f = $_SESSION['formular'] ?? null; unset($_SESSION['formular']);
    $v = fn($k, $d) => is_string($f[$k] ?? null) ? $f[$k] : $d;
    $h = '';
    if (!$nova) {
        $h .= '<p class="odkazy"><a href="../' . Ui::e($n['stranka']) . '" target="_blank" rel="noopener">Otvoriť novinku na webe ↗</a></p>';
        if (!$n['viditelna']) $h .= '<div class="hlaska var">Novinka je skrytá. Na webe je len stránka s vetou, že už nie je v ponuke.</div>';
    }
    $h .= '<form method="post" action="index.php?s=novinka&amp;id=' . Ui::e($id) . '" enctype="multipart/form-data">' . Ui::csrf()
        . '<input type="hidden" name="a" value="novinka"><input type="hidden" name="id" value="' . Ui::e($id) . '"><input type="hidden" name="verzia" value="' . (int)$n['verzia'] . '">'
        . '<label class="pole"><span>Názov novinky</span><input name="nazov" required value="' . Ui::e($v('nazov', $n['nazov'])) . '" data-pocitadlo data-max="45" placeholder="napr. Dlažba Holland – nové farby"><small>2 až 7 slov, najviac 45 znakov.</small></label>'
        . '<label class="pole"><span>Krátky popis (na karte a pod nadpisom)</span><textarea name="popis" required rows="3" data-pocitadlo data-max="200">' . Ui::e($v('popis', $n['popis'])) . '</textarea><small>30 až 200 znakov.</small></label>'
        . '<label class="pole"><span>' . ($n['zdroj'] === 'sprava' ? 'Text novinky' : 'Ďalší text pod pôvodným obsahom (nepovinné)') . '</span><textarea name="text" rows="7" placeholder="Odseky oddeľte prázdnym riadkom.">' . Ui::e($v('text', implode("\n\n", $n['odseky']))) . '</textarea><small>Odseky oddeľte prázdnym riadkom.</small></label>';
    $h .= '<h2>Fotky</h2>';
    foreach ($n['fotky'] as $j => $x) $h .= '<div class="foto-riadok"><img src="../' . Ui::e($x['webp'][0][1]) . '" alt="" width="96" height="72"><label class="pole"><span>Popis fotky</span><input name="foto_popis[' . $j . ']" value="' . Ui::e($x['popis']) . '"></label><label class="prepinac"><input type="checkbox" name="foto_zmazat[' . $j . ']" value="1"> <span>Odstrániť fotku</span></label></div>';
    $h .= '<label class="pole subor"><span>Pridať fotku</span><input type="file" name="foto" accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-fotka><small>Telefón ju pred odoslaním zmenší.</small></label>'
        . '<label class="pole"><span>Popis novej fotky (nepovinné)</span><input name="foto_popis_novy" value=""></label>';
    $h .= '<h2>PDF (nepovinné)</h2><div class="pdf-zoznam">';
    foreach ($n['pdf'] as $j => $p) $h .= '<label class="prepinac"><input type="checkbox" name="pdf_zmazat[' . $j . ']" value="1"> <span>Odstrániť: ' . Ui::e($p['text']) . '</span></label>';
    $h .= '</div><label class="pole subor"><span>Pridať PDF (leták, technický list)</span><input type="file" name="pdf" accept="application/pdf,.pdf"></label>';
    $h .= '<h2>Kde sa zobrazí</h2><label class="prepinac"><input type="checkbox" name="na_uvode" value="1"' . (($f ? !empty($f['na_uvode']) : !empty($n['na_uvode'])) ? ' checked' : '') . '> <span>Ukázať na úvodnej stránke (najviac 4 novinky)</span></label>'
        . '<details class="kat"><summary>Súvisí s kategóriou katalógu</summary><div class="stlpce">';
    $akt = [];
    foreach ($D['novinky']['kategorie'] as $k => $zoz) if (in_array($n['id'], $zoz, true)) $akt[] = $k;
    foreach ($K['nazvy'] as $p => $nz) if (substr_count($p, '/') === 1) $h .= '<label class="prepinac maly"><input type="checkbox" name="kategorie[]" value="' . Ui::e($p) . '"' . (in_array($p, $akt, true) ? ' checked' : '') . '> <span>' . Ui::e($nz) . '</span></label>';
    $h .= '</div></details><fieldset class="pole"><legend>Fotka v hlavičke stránky</legend>' . vyber_hlavicky((string)($n['hlavicka'] ?? '')) . '</fieldset>';
    $h .= '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>';
    if (!$nova) $h .= '<div class="skryt">' . ($n['viditelna']
        ? Ui::tlacidlo('novinka-skryt', 'Skryť novinku z webu', 'nebezpecne', ['id' => $n['id']], 'novinky', 'Novinka zmizne zo zoznamu, z úvodu, z katalógu a z hľadania. Stránka ostane s vetou, že už nie je v ponuke. Pokračovať?')
        : Ui::tlacidlo('novinka-zobrazit', 'Znova zobraziť novinku', 'druhe', ['id' => $n['id']], 'novinky')) . '</div>';
    Ui::stranka($nova ? 'Nová novinka' : $n['nazov'], $h, 'novinky');
}

function akcia_novinka(): void
{
    $id = (string)($_POST['id'] ?? '');
    $nova = $id === 'nova';
    [$D, $e, $var, $nid] = Obsah::novinka(Zmena::pracovne(), $nova ? null : $id, $_POST, $_FILES);
    $i = Obsah::index($D, (string)$nid);
    uloz_a_nahlad($D, $e, ($nova ? 'Nová novinka: ' : 'Novinka: ') . ($i !== null ? $D['novinky']['novinky'][$i]['nazov'] : ''), 'novinka', ['id' => $nova && !$e ? $nid : $id], $var);
}

function akcia_novinky_zoznam(string $a): void
{
    $id = (string)($_POST['id'] ?? '');
    $D = Zmena::pracovne();
    if ($a === 'novinka-vyssie' || $a === 'novinka-nizsie') {
        [$D] = Obsah::novinkaPosun($D, $id, $a === 'novinka-vyssie' ? -1 : 1);
        if ($e = Zmena::ulozKoncept($D, 'Poradie noviniek', ['novinky', []])) Ui::presmeruj('novinky', [], $e, 'chyba');
        Ui::presmeruj('novinky');
    }
    [$D, $e] = Obsah::novinkaViditelnost($D, $id, $a === 'novinka-zobrazit');
    $i = Obsah::index($D, $id);
    uloz_a_nahlad($D, $e, ($a === 'novinka-zobrazit' ? 'Znova zobraziť novinku: ' : 'Skryť novinku: ') . ($i !== null ? $D['novinky']['novinky'][$i]['nazov'] : ''), 'novinka', ['id' => $id]);
}

// ---------- oznam k otváracím hodinám ----------
function vynimky_html(array $D): string
{
    $h = '<h2>Sviatok, dovolenka alebo iné hodiny</h2><p class="pomocka">Oznam sa ukáže pri hodinách v päte každej stránky, na Kontakte a na úvode. Bežné hodiny (hore) sa nemenia. Po poslednom dni oznamu web ukáže opäť len bežné hodiny.</p>';
    $vyn = $D['firma']['vynimky'] ?? [];
    if ($vyn) {
        $h .= '<ul class="zoznam">';
        foreach (array_values($vyn) as $i => $v) $h .= '<li><span class="riadok"><b>' . Ui::e(Vykreslenie::vynimka_text($v)) . '</b>' . ($v['do'] < date('Y-m-d') ? '<span class="znak sivy">skončil</span>' : '') . '</span><div class="posun">'
            . Ui::tlacidlo('vynimka-zmazat', 'Odstrániť', 'maly', ['i' => $i], 'hodiny', 'Oznam zmizne z webu. Pokračovať?') . '</div></li>';
        $h .= '</ul>';
    }
    $dnes = date('Y-m-d');
    $h .= '<form method="post" action="index.php?s=hodiny" class="vynimka">' . Ui::csrf() . '<input type="hidden" name="a" value="vynimka-pridat">'
        . '<div class="dva-stlpce"><label class="pole"><span>Od</span><input type="date" name="od" required min="' . $dnes . '" value="' . $dnes . '"></label>'
        . '<label class="pole"><span>Do (vrátane)</span><input type="date" name="do" min="' . $dnes . '" value="' . $dnes . '"></label></div>'
        . '<fieldset class="pole"><legend>V tieto dni je predajňa</legend><label class="prepinac"><input type="radio" name="druh" value="zatvorene" checked> <span>Zatvorená</span></label>'
        . '<label class="prepinac"><input type="radio" name="druh" value="otvorene"> <span>Otvorená v inom čase:</span></label>'
        . '<div class="dva-stlpce"><label class="cas"><span>od</span><input type="time" name="cas_od" value="07:00" step="900"></label><label class="cas"><span>do</span><input type="time" name="cas_do" value="12:00" step="900"></label></div></fieldset>'
        . '<label class="pole"><span>Názov (nepovinné)</span><input name="nazov" placeholder="napr. Vianoce, Inventúra" data-pocitadlo data-max="30"></label>'
        . '<button class="tl druhe siroke" type="submit">Pridať oznam a pozrieť náhľad</button></form>';
    return $h;
}

function akcia_vynimka(string $a): void
{
    $D = Zmena::pracovne();
    if ($a === 'vynimka-pridat') { [$D, $e] = Obsah::vynimkaPridat($D, $_POST); uloz_a_nahlad($D, $e, 'Oznam k otváracím hodinám', 'hodiny'); }
    [$D, $e] = Obsah::vynimkaZmazat($D, (int)($_POST['i'] ?? -1));
    uloz_a_nahlad($D, $e, 'Odstránený oznam k hodinám', 'hodiny');
}

// ---------- galéria ----------
function obrazovka_galeria(): void
{
    $D = Zmena::pracovne();
    $h = '<p class="vela">Fotky v albumoch Predajňa a Areál na stránke Galéria. Nová fotka sa pridá na začiatok albumu.</p>';
    foreach ($D['galeria']['albumy'] as $a) {
        $vid = count(array_filter($a['fotky'], fn($x) => $x['viditelna'] ?? true));
        $h .= '<h2>' . Ui::e($a['nadpis']) . ' <small>(' . Ui::e(Vykreslenie::fotografie($vid)) . ' na webe)</small></h2>'
            . '<form method="post" action="index.php?s=galeria" enctype="multipart/form-data" class="nova-fotka">' . Ui::csrf() . '<input type="hidden" name="a" value="galeria-pridat"><input type="hidden" name="album" value="' . Ui::e($a['id']) . '">'
            . '<label class="pole subor"><span>Pridať fotku</span><input type="file" name="foto" required accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-fotka></label>'
            . '<label class="pole"><span>Čo je na fotke</span><input name="popis" required placeholder="napr. Palety tehál v areáli predajne" data-pocitadlo data-max="120"></label>'
            . '<button class="tl druhe siroke" type="submit">Pridať fotku a pozrieť náhľad</button></form><ul class="zoznam fotky">';
        foreach ($a['fotky'] as $x) {
            $skr = !($x['viditelna'] ?? true);
            $pol = ['album' => $a['id'], 'foto' => $x['id']];
            $h .= '<li class="' . ($skr ? 'skryta' : '') . '"><img src="../' . Ui::e($x['src']) . '" alt="" width="96" height="72" loading="lazy"><details class="foto-uprava"><summary>' . Ui::e(mb_substr($x['popis'], 0, 60)) . ($skr ? ' <span class="znak sivy">skrytá</span>' : '') . '</summary>'
                . '<form method="post" action="index.php?s=galeria">' . Ui::csrf() . '<input type="hidden" name="a" value="galeria-popis"><input type="hidden" name="album" value="' . Ui::e($a['id']) . '"><input type="hidden" name="foto" value="' . Ui::e($x['id']) . '">'
                . '<label class="pole"><span>Čo je na fotke</span><input name="popis" value="' . Ui::e($x['popis']) . '" data-pocitadlo data-max="120"></label><button class="tl druhe siroke" type="submit">Uložiť popis</button></form>'
                . '<form method="post" action="index.php?s=galeria" enctype="multipart/form-data">' . Ui::csrf() . '<input type="hidden" name="a" value="galeria-nahradit"><input type="hidden" name="album" value="' . Ui::e($a['id']) . '"><input type="hidden" name="foto" value="' . Ui::e($x['id']) . '">'
                . '<label class="pole subor"><span>Nahradiť inou fotkou</span><input type="file" name="foto" required accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-fotka></label><button class="tl druhe siroke" type="submit">Nahradiť</button></form>'
                . '<div class="posun">' . Ui::tlacidlo('galeria-vyssie', '↑', 'maly', $pol, 'galeria') . Ui::tlacidlo('galeria-nizsie', '↓', 'maly', $pol, 'galeria')
                . ($skr ? Ui::tlacidlo('galeria-zobrazit', 'Zobraziť', 'maly', $pol, 'galeria') : Ui::tlacidlo('galeria-skryt', 'Skryť', 'maly', $pol, 'galeria', 'Fotka zmizne z galérie (súbor ostane na hostingu). Pokračovať?')) . '</div></details></li>';
        }
        $h .= '</ul>';
    }
    Ui::stranka('Fotky v galérii', $h);
}

function akcia_galeria(string $a): void
{
    $ukon = substr($a, 8);
    [$D, $e] = Obsah::galeria(Zmena::pracovne(), $ukon, $_POST, $_FILES);
    if (in_array($ukon, ['vyssie', 'nizsie'], true) && !$e) {
        if ($e = Zmena::ulozKoncept($D, 'Poradie fotiek v galérii', ['galeria', []])) Ui::presmeruj('galeria', [], $e, 'chyba');
        Ui::presmeruj('galeria');
    }
    uloz_a_nahlad($D, $e, ['pridat' => 'Nová fotka v galérii', 'nahradit' => 'Nahradená fotka v galérii', 'popis' => 'Popis fotky v galérii', 'skryt' => 'Skrytá fotka v galérii', 'zobrazit' => 'Zobrazená fotka v galérii'][$ukon] ?? 'Galéria', 'galeria');
}

// ---------- texty stránok ----------
function obrazovka_texty(): void
{
    $D = Zmena::pracovne();
    $T = $D['texty'];
    $f = $_SESSION['formular'] ?? null; unset($_SESSION['formular']);
    $v = fn($k, $d) => is_string($f[$k] ?? null) ? $f[$k] : $d;
    $pole = fn($k, $d, $riadky = 3) => '<label class="pole"><span>' . Ui::e(Obsah::TEXTY[$k][0]) . ' <a class="maly-odkaz" href="../' . Ui::e(Obsah::TEXTY[$k][1]) . '" target="_blank" rel="noopener">pozrieť ↗</a></span><textarea name="' . $k . '" rows="' . $riadky . '" data-pocitadlo data-max="' . (Obsah::TEXTY[$k][3] * ($riadky > 3 ? 4 : 1)) . '">' . Ui::e($v($k, $d)) . '</textarea></label>';
    $h = '<p class="vela">Vybrané texty stránok. Mení sa len text, vzhľad ostáva. Odseky oddeľte prázdnym riadkom.</p>'
       . '<form method="post" action="index.php?s=texty">' . Ui::csrf() . '<input type="hidden" name="a" value="texty">'
       . '<h2>Úvodná stránka</h2>' . $pole('uvod_lede', $T['uvod_lede']) . $pole('uvod_onas', implode("\n\n", $T['uvod_onas']), 6)
       . '<h2>Služby</h2>' . $pole('sluzby_uvod', $T['sluzby_uvod']);
    foreach (['sluzby' => 'Služba', 'doprava' => 'Bod'] as $k => $nz) {
        if ($k === 'doprava') $h .= '<h2>O nás</h2>' . $pole('onas', implode("\n\n", $T['onas']), 8) . '<h2>Doprava</h2><p class="pomocka">Slovo {telefon} sa na webe zmení na telefónne číslo s odkazom.</p>';
        $zoz = $T[$k]; $zoz[] = ['', ''];
        foreach ($zoz as $i => [$t, $d]) $h .= '<fieldset class="tabulka"><legend>' . $nz . ' ' . ($i + 1) . ($t === '' ? ' (nová, nepovinné)' : '') . '</legend><label class="pole"><span>Nadpis</span><input name="' . $k . '[' . $i . '][nazov]" value="' . Ui::e($t) . '" data-pocitadlo data-max="60"></label>'
            . '<label class="pole"><span>Text</span><textarea name="' . $k . '[' . $i . '][text]" rows="3" data-pocitadlo data-max="300">' . Ui::e($d) . '</textarea></label></fieldset>';
        $h .= '<p class="pomocka">Bod odstránite tak, že vymažete jeho nadpis aj text.</p>';
    }
    $h .= '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>';
    Ui::stranka('Texty stránok', $h);
}

function akcia_texty(): void
{
    [$D, $e] = Obsah::texty(Zmena::pracovne(), $_POST);
    uloz_a_nahlad($D, $e, 'Texty stránok', 'texty');
}

// ---------- kontakt ----------
function obrazovka_kontakt(): void
{
    $D = Zmena::pracovne();
    $F = $D['firma'];
    $h = '<p class="vela">Telefón a e-mail sú na každej stránke (hore, v päte, na tlačidlách „Zavolať“) aj v údajoch pre Google. Správa ich zmení všade naraz.</p>'
       . '<form method="post" action="index.php?s=kontakt">' . Ui::csrf() . '<input type="hidden" name="a" value="kontakt">'
       . '<label class="pole"><span>Mobil</span><input name="mobil" required inputmode="tel" autocomplete="off" value="' . Ui::e($F['mobil']) . '"></label>'
       . '<label class="pole"><span>Pevná linka</span><input name="pevna" required inputmode="tel" autocomplete="off" value="' . Ui::e($F['pevna']) . '"></label>'
       . '<label class="pole"><span>E-mail</span><input name="email" type="email" required autocomplete="off" value="' . Ui::e($F['email']) . '"></label>'
       . '<p class="pomocka">Na stránke Kontakt sú obrázky „Zavolajte nám“ a „Napíšte nám“, v ktorých je číslo a e-mail priamo v obrázku. Po zmene mobilu, pevnej linky alebo e-mailu sa obrázok skryje (text karty ostane správny), kým programátor nepripraví nový.</p>'
       . '<p class="pomocka">Adresu, IČO a názov firmy mení programátor (sú aj v zmluvách a registroch).</p>'
       . '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>';
    Ui::stranka('Telefón a e-mail', $h);
}

function akcia_kontakt(): void
{
    [$D, $e] = Obsah::kontakt(Zmena::pracovne(), $_POST);
    uloz_a_nahlad($D, $e, 'Kontakt (telefón, e-mail)', 'kontakt');
}
