<?php
// Obrazovky prístupu: kontrola hostingu a prvé nastavenie (kód zo súboru → meno a heslo), prihlásenie, obnova prístupu.
defined('B30S') || exit;

/** Body kontroly hostingu; nanovo najviac raz za minútu (neprihlásený nemá čím server zaťažiť). */
function kontrola_body(bool $znova = false): array
{
    $p = Prostredie::posledne();
    if (!$znova && $p && time() - (int) $p['cas'] < 600) return $p['body'];
    if ($p && time() - (int) $p['cas'] < 60 && !Pristup::ucet() && !Pristup::kodOvereny('prvy')) return $p['body'];
    return Prostredie::kontroly(true);
}

function pole_kod(string $akcia, string $subor): string
{
    return '<form method="post" action="' . Ui::e(Ui::url($akcia === 'obnova-over' ? 'obnova' : '')) . '" class="karta">' . Ui::csrf() . '<input type="hidden" name="a" value="' . $akcia . '">'
        . '<div class="f"><label for="kod">Kód zo súboru ' . Ui::e($subor) . '</label><input id="kod" name="kod" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX" required></div>'
        . '<button class="tl hlavne" type="submit">Overiť kód</button></form>';
}

function polia_hesla(string $popis = 'Heslo'): string
{
    return '<div class="f"><label for="heslo">' . $popis . '<small>aspoň 10 znakov, napríklad tri slová</small></label><input id="heslo" name="heslo" type="password" autocomplete="new-password" minlength="10" required></div>'
        . '<div class="f"><label for="heslo2">' . $popis . ' ešte raz</label><input id="heslo2" name="heslo2" type="password" autocomplete="new-password" minlength="10" required></div>';
}

// ---------- prvé nastavenie ----------
function akcie_prve(string $a): void
{
    switch ($a) {
        case 'znova':
            kontrola_body(true);       // bez overeného kódu najviac raz za minútu
            Ui::presmeruj('', [], 'Kontrola hostingu je urobená znova.');
        case 'vytvor-kod':
            if ($e = Pristup::vytvorKod('prvy')) Ui::presmeruj('', [], $e, 'chyba');
            Ui::presmeruj('', [], 'Kód je pripravený v súbore PRVY-KOD.txt na hostingu.');
        case 'kod':
            if (Pristup::overKod('prvy', (string) ($_POST['kod'] ?? ''))) { Pristup::poKode('prvy'); Prostredie::kontroly(true); Ui::presmeruj('', [], 'Kód sedí. Teraz si nastav meno a heslo.'); }
            $k = Pristup::stavKodu();
            Ui::presmeruj('', [], $k && $k['platne'] ? 'Kód nesedí. Opíš ho presne zo súboru PRVY-KOD.txt (bez medzier, na pomlčkách nezáleží).' : 'Kód už neplatí (vypršal, alebo bolo priveľa pokusov). Vytvor nový.', 'chyba');
        case 'ucet':
            if (!Pristup::kodOvereny('prvy')) Ui::presmeruj('', [], 'Overenie kódom vypršalo. Vytvor nový kód.', 'chyba');
            if (!Prostredie::suhrn(kontrola_body())['pripravene']) Ui::presmeruj('', [], 'Najprv treba opraviť povinné body kontroly hostingu.', 'chyba');
            $meno = trim((string) ($_POST['meno'] ?? ''));
            $h = (string) ($_POST['heslo'] ?? ''); $h2 = (string) ($_POST['heslo2'] ?? '');
            if ($e = Pristup::chybaMena($meno) ?? Pristup::chybaHesla($h, $h2, $meno)) Ui::presmeruj('', [], $e, 'chyba');
            Pristup::nastavUcet($meno, $h, false);
            Pristup::prihlas($meno);
            Zmena::zapamatajBalik();                    // verzia balíka, ktorý je na hostingu
            Prepinace::zapis();
            Ui::presmeruj('nastavenia', [], 'Správa je nastavená. Teraz vyber, čo zapnúť. Každú časť môžeš preskočiť a vrátiť sa k nej neskôr.');
    }
    Ui::chyba('Neznámy úkon.');
}

function obrazovka_prve(): void
{
    $body = kontrola_body();
    $su = Prostredie::suhrn($body);
    $overeny = Pristup::kodOvereny('prvy');
    $zaklad = array_filter($body, fn($b) => in_array($b['id'], ['udaje', 'https'], true) && $b['stav'] === 'chyba');
    $h = '<p class="lead">Tu sa zapína asistent Barber, voľné termíny v okne objednávky, vernostná kartička a úpravy webu. Najprv treba dokázať, že máš prístup k hostingu.</p>';
    $h .= '<h2>1. Kontrola hostingu</h2>';
    if ($su['pripravene']) $h .= '<div class="hlaska ok">Hosting vyhovuje' . ($su['upozornenia'] ? ' (' . $su['upozornenia'] . ' ' . ($su['upozornenia'] === 1 ? 'upozornenie, uvidíš ho' : ($su['upozornenia'] < 5 ? 'upozornenia, uvidíš ich' : 'upozornení, uvidíš ich')) . ' po overení kódu)' : '') . '.</div>';
    else $h .= '<div class="hlaska chyba">Treba opraviť ' . $su['pocet'] . ' ' . ($su['pocet'] === 1 ? 'vec' : ($su['pocet'] < 5 ? 'veci' : 'vecí')) . ': ' . Ui::e(implode(', ', array_map(fn($b) => $b['nazov'], array_filter($body, fn($b) => $b['povinne'] && $b['stav'] === 'chyba')))) . '. Podrobnosti uvidíš po overení kódu.</div>';
    if ($overeny) $h .= Ui::body($body, true);
    $h .= Ui::tlacidlo('znova', 'Skontrolovať znova', 'tiche');

    if (!$overeny) {
        $h .= '<h2>2. Kód zo súboru na hostingu</h2>';
        $k = Pristup::stavKodu();
        if ($zaklad) $h .= '<p class="lead">Kód sa dá vytvoriť až po oprave bodov vyššie.</p>';
        elseif ($k && $k['platne'] && $k['druh'] === 'prvy') {
            $h .= '<p class="lead">Server zapísal kód do súboru <b>PRVY-KOD.txt</b>. Nájdeš ho cez FTP alebo správcu súborov hostingu: ' . Ui::e(Miesto::kdeUdaje()) . '. Otvor ho, kód opíš sem. Platí do ' . Ui::datumCas($k['cas'] + Pristup::KOD_PLATNOST['prvy']) . '.</p>'
                . '<p class="pozn">Kód vie prečítať len ten, kto má prístup k hostingu. Nikomu ho neposielaj.</p>' . pole_kod('kod', 'PRVY-KOD.txt');
        } else {
            $h .= '<p class="lead">Ťukni na tlačidlo. Server zapíše jednorazový kód do súboru na hostingu, ktorý vidíš len cez FTP alebo správcu súborov.</p>'
                . ($k && !$k['platne'] && $k['druh'] === 'prvy' ? '<p class="pozn">Predošlý kód už neplatí.</p>' : '') . Ui::tlacidlo('vytvor-kod', 'Vytvoriť kód', 'hlavne');
        }
    } else {
        $h .= '<h2>2. Meno a heslo správy</h2>';
        if (!$su['pripravene']) $h .= '<p class="lead">Najprv oprav body označené „treba opraviť“ a ťukni Skontrolovať znova.</p>';
        else $h .= '<form method="post" action="' . Ui::e(Ui::url()) . '" class="karta">' . Ui::csrf() . '<input type="hidden" name="a" value="ucet">'
            . '<div class="f"><label for="meno">Meno<small>ním sa budeš prihlasovať, napr. Lajko</small></label><input id="meno" name="meno" type="text" autocomplete="username" maxlength="40" required></div>'
            . polia_hesla() . '<p class="pozn">Heslo si zapíš do správcu hesiel. Nikomu ho neposielaj, ani tvorcovi webu.</p><button class="tl hlavne" type="submit">Nastaviť a pokračovať</button></form>';
    }
    Ui::stranka('Prvé nastavenie', $h);
}

// ---------- prihlásenie a obnova ----------
function akcie_prihlasenie(string $a): void
{
    switch ($a) {
        case 'prihlasit':
            if ($b = Pristup::blokovane()) Ui::presmeruj('', [], $b, 'chyba');
            $meno = trim((string) ($_POST['meno'] ?? ''));
            if (Pristup::overHeslo($meno, (string) ($_POST['heslo'] ?? ''))) {
                $zle = Pristup::prihlas(Pristup::menoUctu($meno));
                Ui::presmeruj('', [], $zle > 0 ? "Od posledného prihlásenia bolo $zle nesprávnych pokusov o prihlásenie." : null, 'var');
            }
            Pristup::zlyPokus();
            Ui::presmeruj('', [], Pristup::blokovane() ?? 'Meno alebo heslo nie je správne.', 'chyba');
        case 'obnova-kod':
            if ($e = Pristup::vytvorKod('obnova')) Ui::presmeruj('obnova', [], $e, 'chyba');
            Ui::presmeruj('obnova', [], 'Kód je pripravený v súbore OBNOVA-KOD.txt na hostingu.');
        case 'obnova-over':
            if (Pristup::overKod('obnova', (string) ($_POST['kod'] ?? ''))) { Pristup::poKode('obnova'); Ui::presmeruj('obnova', [], 'Kód sedí. Nastav si nové heslo.'); }
            $k = Pristup::stavKodu();
            Ui::presmeruj('obnova', [], $k && $k['platne'] ? 'Kód nesedí. Opíš ho presne zo súboru OBNOVA-KOD.txt.' : 'Kód už neplatí. Vytvor nový.', 'chyba');
        case 'obnova-heslo':
            if (!Pristup::kodOvereny('obnova')) Ui::presmeruj('obnova', [], 'Overenie kódom vypršalo. Vytvor nový kód.', 'chyba');
            $meno = (string) (Pristup::ucty()[0]['meno'] ?? '');
            $h = (string) ($_POST['heslo'] ?? ''); $h2 = (string) ($_POST['heslo2'] ?? '');
            if ($e = Pristup::chybaHesla($h, $h2, $meno)) Ui::presmeruj('obnova', [], $e, 'chyba');
            Pristup::nastavUcet($meno, $h, true);
            Pristup::prihlas($meno);
            Ui::presmeruj('', [], 'Heslo je zmenené a všetky ostatné zariadenia sú odhlásené.');
    }
    Ui::chyba('Neznámy úkon.');
}

function obrazovka_prihlasenie(): void
{
    $h = '<form method="post" action="' . Ui::e(Ui::url()) . '" class="karta">' . Ui::csrf() . '<input type="hidden" name="a" value="prihlasit">'
       . '<div class="f"><label for="meno">Meno</label><input id="meno" name="meno" type="text" autocomplete="username" maxlength="40" required></div>'
       . '<div class="f"><label for="heslo">Heslo</label><input id="heslo" name="heslo" type="password" autocomplete="current-password" required></div>'
       . '<button class="tl hlavne" type="submit">Prihlásiť</button></form>'
       . '<p><a href="' . Ui::e(Ui::url('obnova')) . '">Zabudnuté heslo: obnoviť prístup</a></p>';
    Ui::stranka('Prihlásenie', $h);
}

function obrazovka_obnova(): void
{
    $h = '<p class="lead">Zabudnuté heslo sa obnoví rovnako ako pri prvom nastavení: kódom zo súboru na hostingu. Po zmene hesla sa odhlásia všetky zariadenia.</p>';
    if (Pristup::kodOvereny('obnova')) {
        $h .= '<form method="post" action="' . Ui::e(Ui::url('obnova')) . '" class="karta">' . Ui::csrf() . '<input type="hidden" name="a" value="obnova-heslo">'
            . '<p class="lead">Účet: <b>' . Ui::e(Pristup::ucty()[0]['meno'] ?? '') . '</b></p>' . polia_hesla('Nové heslo') . '<button class="tl hlavne" type="submit">Zmeniť heslo</button></form>';
    } else {
        $k = Pristup::stavKodu();
        if ($k && $k['platne'] && $k['druh'] === 'obnova')
            $h .= '<p class="lead">Kód je v súbore <b>OBNOVA-KOD.txt</b>: ' . Ui::e(Miesto::kdeUdaje()) . '. Platí do ' . Ui::datumCas($k['cas'] + Pristup::KOD_PLATNOST['obnova']) . '.</p>' . pole_kod('obnova-over', 'OBNOVA-KOD.txt');
        else $h .= Ui::tlacidlo('obnova-kod', 'Vytvoriť kód na obnovu', 'hlavne', [], 'obnova');
    }
    $h .= '<p><a href="' . Ui::e(Ui::url()) . '">Späť na prihlásenie</a></p>';
    Ui::stranka('Obnoviť prístup', $h);
}
