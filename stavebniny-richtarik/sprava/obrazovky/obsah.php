<?php
// Obrazovky úprav obsahu: otváracie hodiny, akcie (zoznam, úprava, nová akcia), cenník akcií a letáky.
defined('SPRAVA') || exit;

function uloz_a_nahlad(array $D, ?string $chyba, string $popis, string $spat, array $q = [], array $varovania = []): void
{
    if ($chyba) { $_SESSION['formular'] = $_POST; Ui::presmeruj($spat, $q, $chyba, 'chyba'); }
    if ($e = Zmena::ulozKoncept($D, $popis, [$spat, $q])) Ui::presmeruj($spat, $q, $e, 'chyba');   // S3: Späť z náhľadu vedie sem
    unset($_SESSION['formular']);
    if ($varovania) $_SESSION['varovania'] = $varovania;
    Ui::presmeruj('nahlad');
}

function form_hodnota(string $k, $pred)
{
    return $_SESSION['formular'][$k] ?? $pred;
}

// ---------- otváracie hodiny ----------
function obrazovka_hodiny(): void
{
    $D = Zmena::pracovne();
    $dni = [];
    foreach ($D['firma']['hodiny'] as $s) foreach ($s['dni'] as $d) $dni[$d] = [$s['od'], $s['do']];
    $h = '<p class="vela">Zaškrtnite dni, keď je predajňa otvorená, a nastavte čas. Zmena sa ukáže v päte na všetkých stránkach, na Kontakte, na úvode, v Častých otázkach aj v údajoch pre Google.</p>'
       . '<p class="teraz">Teraz na webe: <b>' . Ui::e(implode(', ', array_map(fn($r) => $r['kratko'] . ' ' . $r['cas'], Vykreslenie::hodiny_riadky(Zmena::zive())))) . '</b></p>'
       . '<form method="post" action="index.php?s=hodiny" class="hodiny">' . Ui::csrf() . '<input type="hidden" name="a" value="hodiny">';
    for ($d = 1; $d <= 7; $d++) {
        $o = isset($dni[$d]);
        $h .= '<fieldset class="den"><legend>' . Vykreslenie::DNI_DLHO[$d] . '</legend><label class="prepinac"><input type="checkbox" name="den[' . $d . '][otvorene]" value="1"' . ($o ? ' checked' : '') . '> <span>Otvorené</span></label>'
            . '<label class="cas"><span>od</span><input type="time" name="den[' . $d . '][od]" value="' . Ui::e($o ? $dni[$d][0] : '07:00') . '" step="900"></label>'
            . '<label class="cas"><span>do</span><input type="time" name="den[' . $d . '][do]" value="' . Ui::e($o ? $dni[$d][1] : '16:00') . '" step="900"></label></fieldset>';
    }
    $h .= '<p class="pomocka">Na troch obrázkoch sú dnešné hodiny priamo v obrázku: hodiny na stránke Kontakt, leták Prečo nakupovať u nás a tabuľa s adresou v Galérii. Keď bežné hodiny zmeníte, z webu sa skryjú (náhľad ich vymenuje); oznam o sviatku alebo dovolenke ich neskryje. Leták a tabuľu potom nahradíte novými vo Fotkách v galérii.</p>'
       . '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>' . vynimky_html($D);
    Ui::stranka('Otváracie hodiny', $h);
}

function akcia_hodiny(): void
{
    [$D, $e] = Ulohy::hodiny(Obsah::bezStarychVynimiek(Zmena::pracovne()), $_POST);
    uloz_a_nahlad($D, $e, 'Otváracie hodiny', 'hodiny');
}

// ---------- akcie ----------
function obrazovka_akcie(): void
{
    $D = Zmena::pracovne();
    $vid = count(array_filter($D['akcie']['akcie'], fn($a) => $a['viditelna']));
    $skr = count($D['akcie']['akcie']) - $vid;
    $uvod = count(array_filter($D['akcie']['akcie'], fn($a) => $a['viditelna'] && $a['stranka'] && $a['na_uvode']));
    $h = '<p class="vela">' . Ui::pocet($vid, '%d akcia na webe', '%d akcie na webe', '%d akcií na webe') . ', ' . $uvod . ' z nich na úvode' . ($skr ? ', ' . Ui::pocet($skr, '%d skrytá', '%d skryté', '%d skrytých') : '') . '. Poradie tu je poradie na stránke Akcie.</p>'
       . '<p><a class="tl hlavne siroke" href="' . Ui::e(Ui::url('akcia', ['id' => 'nova'])) . '">+ Pridať akciu</a></p><ul class="zoznam">';
    $dnes = date('Y-m-d');
    foreach ($D['akcie']['akcie'] as $a) {
        $stav = !$a['viditelna'] ? '<span class="znak sivy">skrytá</span>' : (($a['stranka'] && $a['na_uvode']) ? '<span class="znak">na úvode</span>' : '');
        if ($a['viditelna'] && $a['plati_do'] && $a['plati_do'] < $dnes) $stav .= '<span class="znak cerveny">platila do ' . Ui::e(Kontrola::datum($a['plati_do'])) . '</span>';
        $h .= '<li class="' . ($a['viditelna'] ? '' : 'skryta') . '"><a class="riadok" href="' . Ui::e(Ui::url('akcia', ['id' => $a['id']])) . '"><b>' . Ui::e($a['nazov']) . '</b><small>' . Ui::e($a['stitok']) . '</small>' . $stav . '</a>'
            . '<div class="posun">' . Ui::tlacidlo('vyssie', '↑', 'maly', ['id' => $a['id']], 'akcie') . Ui::tlacidlo('nizsie', '↓', 'maly', ['id' => $a['id']], 'akcie') . '</div></li>';
    }
    Ui::stranka('Akcie', $h . '</ul>');
}

function akcia_zoznam_akcii(string $a): void
{
    $id = (string)($_POST['id'] ?? '');
    $D = Zmena::pracovne();
    if ($a === 'vyssie' || $a === 'nizsie') { [$D, $e] = Ulohy::posun($D, $id, $a === 'vyssie' ? -1 : 1); if ($e = Zmena::ulozKoncept($D, 'Poradie akcií')) Ui::presmeruj('akcie', [], $e, 'chyba'); Ui::presmeruj('akcie'); }
    [$D, $e, $var] = Ulohy::viditelnost($D, $id, $a === 'zobrazit');
    $i = Ulohy::index($D, $id);
    uloz_a_nahlad($D, $e, ($a === 'zobrazit' ? 'Znova zobraziť: ' : 'Skryť: ') . ($i !== null ? $D['akcie']['akcie'][$i]['nazov'] : ''), 'akcia', ['id' => $id], $var);
}

function moznosti_stitku(string $akt): string
{
    $h = '';
    $vlastny = $akt !== '' && !in_array($akt, Ulohy::STITKY, true);
    foreach (Ulohy::STITKY as $s) $h .= '<label class="cip"><input type="radio" name="stitok" value="' . Ui::e($s) . '"' . ($s === $akt ? ' checked' : '') . '><span>' . Ui::e($s) . '</span></label>';
    $h .= '<label class="cip"><input type="radio" name="stitok" value="vlastny"' . ($vlastny ? ' checked' : '') . '><span>Vlastný:</span></label>'
        . '<input class="vlastny" name="stitok_vlastny" data-pocitadlo data-max="18" value="' . Ui::e($vlastny ? $akt : '') . '" aria-label="Vlastný štítok" placeholder="napr. 4,42 €/vrece">';
    return '<div class="cipy">' . $h . '</div>';
}

function obrazovka_akcia(): void
{
    $D = Zmena::pracovne();
    $K = Nastavenie::konstanty();
    $id = (string)($_GET['id'] ?? '');
    $nova = $id === 'nova';
    $i = $nova ? null : Ulohy::index($D, $id);
    if (!$nova && $i === null) Ui::chyba('Akcia neexistuje.', 404);
    $a = $nova ? ['nazov' => '', 'stitok' => 'Akciová cena', 'karta' => '', 'ceny' => [], 'katalog' => [], 'na_uvode' => false, 'hlavicka' => '', 'plati_do' => '', 'pdf' => [], 'letak' => null, 'seo' => null, 'stranka' => 'x', 'viditelna' => true, 'verzia' => 0, 'cennik' => null, 'skryt_ceny' => false]
               : $D['akcie']['akcie'][$i];
    $f = $_SESSION['formular'] ?? null; unset($_SESSION['formular']);
    $v = fn($k, $d) => $f[$k] ?? $d;
    $akt = Vykreslenie::cennik_aktualny($D);
    $h = '';
    if (!$nova && $a['stranka']) {
        $h .= '<p class="odkazy"><a href="../' . Ui::e($a['stranka']) . '" target="_blank" rel="noopener">Otvoriť stránku akcie na webe ↗</a></p>';
        if (!$a['viditelna']) $h .= '<div class="hlaska var">Akcia je skrytá. Na webe je len stránka s vetou, že akcia skončila.</div>';
    }
    $h .= '<form method="post" action="index.php?s=akcia&amp;id=' . Ui::e($id) . '" enctype="multipart/form-data" class="akcia">' . Ui::csrf()
        . '<input type="hidden" name="a" value="akcia"><input type="hidden" name="id" value="' . Ui::e($id) . '"><input type="hidden" name="verzia" value="' . (int)$a['verzia'] . '">'
        . '<h2>1. Názov a štítok</h2>'
        . '<label class="pole"><span>Názov akcie</span><input name="nazov" required value="' . Ui::e($v('nazov', $a['nazov'])) . '" data-pocitadlo data-max="45" placeholder="napr. Cement 325 R a 425 R"><small>2 až 7 slov, najviac 45 znakov.</small></label>'
        . '<fieldset class="pole"><legend>Štítok na karte</legend>' . moznosti_stitku($v('stitok', $a['stitok']) === 'vlastny' ? $v('stitok_vlastny', '') : $v('stitok', $a['stitok'])) . '</fieldset>'
        . '<h2>2. Text akcie</h2>'
        . '<label class="pole"><span>Čo je v akcii a za akých podmienok</span><textarea name="karta" required rows="4" data-pocitadlo data-max="220" placeholder="Napíšte, čo je v akcii a za akých podmienok. Ceny píšte s DPH.">' . Ui::e($v('karta', $a['karta'])) . '</textarea><small>30 až 220 znakov. Zobrazí sa na karte akcie a pod nadpisom stránky.</small></label>';
    if (!$a['stranka']) {
        $h .= '<p class="vela">Táto karta vedie na stránku ' . Ui::e($a['odkaz']['text'] ?? '') . ' a nemá vlastnú stránku akcie.</p>' . pole_karta_foto($a);
    } else {
        $h .= '<h2>3. Leták</h2>';
        if ($a['letak']) $h .= '<figure class="nahlad-letaku"><img src="../' . Ui::e($a['letak']['src']) . '" alt="Súčasný leták" width="160"><figcaption>Súčasná fotka letáku</figcaption></figure><label class="prepinac"><input type="checkbox" name="letak_zmazat" value="1"> <span>Odstrániť fotku letáku</span></label>';
        $h .= '<label class="pole subor"><span>' . ($a['letak'] ? 'Nová fotka letáku' : 'Fotka letáku') . '</span><input type="file" name="letak_foto" accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-fotka><small>Odfoťte leták alebo vyberte fotku. Telefón ju pred odoslaním zmenší.</small></label>'
            . '<div class="pdf-zoznam">';
        foreach ($a['pdf'] as $j => $p) $h .= '<label class="prepinac"><input type="checkbox" name="pdf_zmazat[' . $j . ']" value="1"> <span>Odstrániť: ' . Ui::e(Vykreslenie::pdf_text($a, $p)) . '</span></label>';
        $h .= '</div><label class="pole subor"><span>Pridať leták v PDF</span><input type="file" name="pdf_novy" accept="application/pdf,.pdf"></label>'
            . '<label class="pole"><span>Dátum letáku v PDF</span><input type="date" name="pdf_datum" value="' . Ui::e(date('Y-m-d')) . '"></label>'
            . pole_karta_foto($a);
        // ceny
        $h .= '<h2>4. Ceny (nepovinné)</h2><p class="pomocka">Tabuľka cien na stránke akcie. Ceny píšte s DPH, napríklad <b>4,42 €/vrece</b>. Prázdne riadky sa vynechajú.</p>';
        if (Ulohy::cenyStarehoCennika($a, $D))
            $h .= '<div class="hlaska var">Tieto ceny sú z cenníka, ktorý už nie je aktuálny, a na webe sa teraz neukazujú. Ak platia aj podľa cenníka z ' . Ui::e($akt['datum']) . ', zaškrtnite:<label class="prepinac"><input type="checkbox" name="ceny_potvrdit" value="1"> <span>Ceny platia aj podľa nového cenníka</span></label></div>';
        $tab = is_array($v('ceny', null)) ? array_values(array_filter($v('ceny', null), 'is_array')) : null;
        if ($tab !== null) foreach ($tab as &$t) { $t['r'] = array_values(array_filter(is_array($t['r'] ?? null) ? $t['r'] : [], 'is_array')); foreach (['nadpis', 'poznamka'] as $kk) if (!is_string($t[$kk] ?? '')) $t[$kk] = ''; }
        unset($t);
        $tab = $tab ?? array_map(fn($t) => ['nadpis' => $t['nadpis'], 'poznamka' => $t['poznamka'], 'r' => array_map(fn($r) => ['polozka' => $r[0], 'cena' => $r[1]], $t['riadky'])], $a['ceny']);
        if (!$tab) $tab = [['nadpis' => '', 'poznamka' => '', 'r' => []]];
        foreach ($tab as $ti => $t) {
            $rows = $t['r'] ?? [];
            $rows[] = ['polozka' => '', 'cena' => ''];
            $h .= '<fieldset class="tabulka" data-tabulka="' . $ti . '"><legend>Tabuľka ' . ($ti + 1) . '</legend><label class="pole"><span>Nadpis tabuľky</span><input name="ceny[' . $ti . '][nadpis]" maxlength="100" value="' . Ui::e($t['nadpis'] ?? '') . '" placeholder="napr. Cement (s. 3)"></label><div class="riadky">';
            foreach ($rows as $ri => $r) $h .= '<div class="cena-riadok"><input name="ceny[' . $ti . '][r][' . $ri . '][polozka]" maxlength="100" value="' . Ui::e($r['polozka'] ?? '') . '" placeholder="Výrobok" aria-label="Výrobok">'
                . '<input name="ceny[' . $ti . '][r][' . $ri . '][cena]" maxlength="40" value="' . Ui::e($r['cena'] ?? '') . '" placeholder="Cena, napr. 4,42 €/vrece" aria-label="Cena" inputmode="text"></div>';
            $h .= '</div><button type="button" class="tl maly" data-pridaj-riadok>+ Ďalší riadok</button><label class="pole"><span>Poznámka pod tabuľkou</span><input name="ceny[' . $ti . '][poznamka]" maxlength="300" value="' . Ui::e($t['poznamka'] ?? '') . '"></label></fieldset>';
        }
        // kde sa zobrazí
        $h .= '<h2>5. Kde sa zobrazí</h2><label class="prepinac"><input type="checkbox" name="na_uvode" value="1"' . ($v('na_uvode', $a['na_uvode']) ? ' checked' : '') . '> <span>Ukázať na úvode (najviac 6 akcií)</span></label>'
            . '<details class="kat"><summary>Súvisí s tovarom v katalógu (' . count($a['katalog']) . ')</summary><div class="stlpce">';
        $kat = (array)$v('katalog', $a['katalog']);
        foreach ($K['nazvy'] as $p => $n) $h .= '<label class="prepinac maly' . (substr_count($p, '/') > 1 ? ' vnor' : '') . '"><input type="checkbox" name="katalog[]" value="' . Ui::e($p) . '"' . (in_array($p, $kat, true) ? ' checked' : '') . '> <span>' . Ui::e($n) . '</span></label>';
        $h .= '</div></details>';
        // S5: fotka v hlavičke stránky je v hlavnom formulári; nová akcia bez výberu dostane fotku podľa tovaru v katalógu alebo žiadnu
        $akth = $v('hlavicka', $a['hlavicka'] ?: '');
        $h .= '<fieldset class="pole"><legend>Fotka v hlavičke stránky akcie</legend>' . vyber_hlavicky($nova && $akth === '' ? '-' : (string)$akth) . '<small>Vyberte fotku s tým istým tovarom, alebo „Bez fotky“.</small></fieldset>';
        $h .= '<label class="pole"><span>Platí do (nepovinné)</span><input type="date" name="plati_do" value="' . Ui::e($v('plati_do', $a['plati_do'] ?? '')) . '"><small>Po tomto dni vám správa pripomenie, aby ste akciu skryli.</small></label>'
            . '<details class="dalsie-nast"' . (!empty($_SESSION['otvor_dalsie']) ? ' open' : '') . '><summary>Ďalšie nastavenia: nadpis a texty pre Google</summary>';
        unset($_SESSION['otvor_dalsie']);
        $seo = $a['seo'] ?? ['h1' => '', 'titulok' => '', 'popis' => ''];
        $h .= '<p class="pomocka">Pre Google: ak necháte prázdne, správa ich zloží z názvu a textu akcie.</p>'
            . '<label class="pole"><span>Nadpis stránky</span><input name="seo_h1" value="' . Ui::e($v('seo_h1', $nova ? '' : $seo['h1'])) . '" data-pocitadlo data-max="45"></label>'
            . '<label class="pole"><span>Názov pre Google</span><input name="seo_titulok" value="' . Ui::e($v('seo_titulok', $nova ? '' : $seo['titulok'])) . '" data-pocitadlo data-max="31"><small>Najviac 31 znakov; za ním sa pridá „| Stavebniny Richtárik Nitra“.</small></label>'
            . '<label class="pole"><span>Popis pre Google</span><textarea name="seo_popis" rows="3" data-pocitadlo data-max="155">' . Ui::e($v('seo_popis', $nova ? '' : $seo['popis'])) . '</textarea><small>120 až 155 znakov.</small></label></details>';
    }
    $h .= '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>';
    if (!$nova && $a['stranka']) {
        $h .= '<div class="skryt">' . ($a['viditelna']
            ? Ui::tlacidlo('skryt', 'Skryť akciu z webu', 'nebezpecne', ['id' => $a['id']], 'akcie', 'Akcia zmizne zo zoznamu, z úvodu, z katalógu a z hľadania. Stránka ostane s vetou, že akcia skončila. Pokračovať?')
            : Ui::tlacidlo('zobrazit', 'Znova zobraziť akciu', 'druhe', ['id' => $a['id']], 'akcie')) . '</div>';
    }
    Ui::stranka($nova ? 'Nová akcia' : $a['nazov'], $h, 'akcie');
}

/** Obrázok na karte akcie (Akcie, úvod): celá fotka tovaru namiesto miniatúry letáku; leták na stránke akcie ostáva. */
function pole_karta_foto(array $a): string
{
    $h = '<fieldset class="pole"><legend>Obrázok na karte akcie</legend>';
    if (!empty($a['nahlad']['foto'])) $h .= '<figure class="nahlad-letaku"><img src="../' . Ui::e($a['nahlad']['src']) . '" alt="Súčasný obrázok na karte" width="120"><figcaption>Súčasný obrázok na karte</figcaption></figure>'
        . '<label class="prepinac"><input type="checkbox" name="karta_foto_zmazat" value="1"> <span>Odstrániť obrázok na karte' . ($a['letak'] ?? null ? ' (karta znova ukáže leták)' : '') . '</span></label>';
    return $h . '<label class="pole subor"><span>' . (!empty($a['nahlad']['foto']) ? 'Iná fotka na kartu' : 'Fotka tovaru na kartu') . '</span><input type="file" name="karta_foto" accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-fotka>'
        . '<small>Celá fotka sa zmenší, nič sa neoreže. Leták na stránke akcie ostane.</small></label></fieldset>';
}

function akcia_akcia(): void
{
    $id = (string)($_POST['id'] ?? '');
    $nova = $id === 'nova';
    unset($_SESSION['nahrady']);
    [$D, $e, $var, $nid] = Ulohy::akcia(Zmena::pracovne(), $nova ? null : $id, $_POST, $_FILES);
    if ($e) unset($_SESSION['nahrady']);
    $i = Ulohy::index($D, (string)$nid);
    uloz_a_nahlad($D, $e, ($nova ? 'Nová akcia: ' : 'Akcia: ') . ($i !== null ? $D['akcie']['akcie'][$i]['nazov'] : ''), 'akcia', ['id' => $nova && !$e ? $nid : $id], $var);
}

/** S2: „Nahradiť starú cenu všade“ z náhľadu. */
function akcia_nahradit_cenu(): void
{
    $n = $_SESSION['nahrady'] ?? null;
    if (!$n) Ui::presmeruj('nahlad');
    [$D, $e] = Ulohy::nahradCeny(Zmena::pracovne(), $n['id'], $n['pary']);
    unset($_SESSION['nahrady']);
    if ($e) { $_SESSION['otvor_dalsie'] = 1; Ui::presmeruj('akcia', ['id' => $n['id']], $e . ' Upravte texty ručne v časti „Ďalšie nastavenia“.', 'chyba'); }
    $i = Ulohy::index($D, $n['id']);
    uloz_a_nahlad($D, null, 'Akcia: ' . $D['akcie']['akcie'][$i]['nazov'], 'akcia', ['id' => $n['id']], ['Stará cena je nahradená novou v texte akcie, štítku a textoch pre Google. Skontrolujte náhľad.']);
}

// ---------- cenník akcií a letáky ----------
function obrazovka_cennik(): void
{
    $D = Zmena::pracovne();
    $c = Vykreslenie::cennik_aktualny($D);
    $sCenami = count(array_filter($D['akcie']['akcie'], fn($a) => $a['ceny'] && $a['viditelna']));
    $h = '<p class="vela">Aktuálny cenník akcií: <a href="../' . Ui::e($c['pdf']) . '" target="_blank" rel="noopener">z ' . Ui::e($c['datum']) . ' (' . Ui::e(Vykreslenie::strany((int)$c['strany'])) . ')</a>.</p>'
       . '<form method="post" action="index.php?s=cennik" enctype="multipart/form-data">' . Ui::csrf() . '<input type="hidden" name="a" value="cennik"><h2>Nahrať nový cenník akcií</h2>'
       . '<label class="pole subor"><span>Cenník v PDF</span><input type="file" name="cennik_pdf" accept="application/pdf,.pdf" required></label>'
       . '<label class="pole"><span>Dátum cenníka</span><input type="date" name="datum" value="' . Ui::e(date('Y-m-d')) . '" required></label>'
       . '<label class="pole"><span>Počet strán (nepovinné)</span><input type="number" name="strany" min="1" max="200" inputmode="numeric" placeholder="zistí sa z PDF"></label>'
       . '<fieldset class="pole"><legend>Ceny v tabuľkách pri ' . $sCenami . ' akciách sú z cenníka z ' . Ui::e($c['datum']) . '. Čo s nimi?</legend>'
       . '<label class="prepinac"><input type="radio" name="tabulky" value="skryt" checked> <span><b>Zatiaľ ich skryť</b> – na webe bude namiesto tabuľky odkaz na nový cenník. Ceny potom potvrdíte pri každej akcii.</span></label>'
       . '<label class="prepinac"><input type="radio" name="tabulky" value="platia"> <span><b>Ceny ostávajú rovnaké</b> – tabuľky sa ukážu s dátumom nového cenníka.</span></label></fieldset>'
       . '<div class="dole"><button class="tl hlavne siroke" type="submit">Pozrieť náhľad</button></div></form>';
    $h .= '<h2>Letáky na stránke Akcie</h2><ul class="zoznam">';
    foreach ($D['cennik']['stare_letaky'] as $i => $l)
        $h .= '<li><a class="riadok" href="../' . Ui::e($l['pdf']) . '" target="_blank" rel="noopener">' . Ui::e($l['text']) . '</a><div class="posun">' . Ui::tlacidlo('letak-zmazat', 'Odstrániť', 'maly', ['i' => $i], 'cennik', 'Leták zmizne zo stránky Akcie (súbor ostane na hostingu). Pokračovať?') . '</div></li>';
    $h .= '</ul><form method="post" action="index.php?s=cennik" enctype="multipart/form-data">' . Ui::csrf() . '<input type="hidden" name="a" value="letak-pridat">'
        . '<label class="pole subor"><span>Nový leták v PDF</span><input type="file" name="letak_pdf" accept="application/pdf,.pdf" required></label>'
        . '<label class="pole"><span>Názov letáku</span><input name="text" required maxlength="90" placeholder="napr. Leták akcie: cement 325 a 425"></label>'
        . '<label class="pole"><span>Dátum letáku</span><input type="date" name="datum" value="' . Ui::e(date('Y-m-d')) . '"></label>'
        . '<button class="tl druhe siroke" type="submit">Pridať leták a pozrieť náhľad</button></form>';
    Ui::stranka('Cenník a letáky', $h);
}

function akcia_cennik(string $a): void
{
    $D = Zmena::pracovne();
    if ($a === 'cennik') { [$D, $e] = Ulohy::cennik($D, $_POST, $_FILES); uloz_a_nahlad($D, $e, 'Nový cenník akcií', 'cennik'); }
    if ($a === 'letak-pridat') { [$D, $e] = Ulohy::letakPridat($D, $_POST, $_FILES); uloz_a_nahlad($D, $e, 'Nový leták', 'cennik'); }
    [$D, $e] = Ulohy::letakZmazat($D, (int)($_POST['i'] ?? -1));
    uloz_a_nahlad($D, $e, 'Odstránený leták', 'cennik');
}
