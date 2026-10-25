# Oprava 7 (P7): úpravy vstupu generátora jazykov – presné náhrady, každá musí zasiahnuť práve raz.
import re, sys
from pathlib import Path
P = Path(sys.argv[1]); s = P.read_text('utf8')
def nahrad(a, b):
    global s
    n = s.count(a)
    if n != 1: raise SystemExit(f'náhrada {a!r}: {n} výskytov')
    s = s.replace(a, b)
# EN
nahrad("not all one out too off see may her she\",", "not all one out too off see may\",")
nahrad("guys charge where when who whom'", "guys charge when who whom'")
nahrad("'Address Located Location Street Map Directions =where find get nitra'", "'Address Located Location Street Map Directions =Where find get nitra barbersho shop salon premis place'")
nahrad("Bride Fiancee', \"We don't", "Bride Fiancee =Her =She', \"We don't")
# DE
nahrad("machen wo wann wer wem warum'", "machen wann wer wem warum'")
nahrad("'Adress Mostn Straße Strasse Navig Lage Anfahrt =wo find nitra'", "'Adress Mostn Straße Strasse Navig Lage Anfahrt =Wo find nitra barbersho laden salon'")
nahrad("Schwiegermutter Braut', ", "Schwiegermutter Braut Fur_sie Ihr_haarschnitt Ihre_haare', ")
# CS
nahrad("celk kde kdy kdo komu proč'", "celk kdy kdo komu proč'")
nahrad("'Adres Mostn Ulic Mapa Navig Nacház Poloh =kde najd nitr dostan'", "'Adres Mostn Ulic Mapa Navig Nacház Poloh =Kde najd nitr dostan barbersho provoz salon'")
nahrad("Partnerk Nevěst', ", "Partnerk Nevěst =Ji =Ní =Její', ")
# PL
nahrad("mój nam ich jej ten raz", "mój nam ich ten raz")
nahrad("bierze biorą gdzie kiedy kto komu dlaczego'", "bierze biorą kiedy kto komu dlaczego'")
nahrad("'Adres Mostn Ulic Mapa Nawig Położen Polozen Lokaliz =gdzie znajd nitr dojad'", "'Adres Mostn Ulic Mapa Nawig Położen Polozen Lokaliz =Gdzie znajd nitr dojad barbersho salon lokal zakład'")
nahrad("Wnuczk Partnerk', 'Strzyżeń", "Wnuczk Partnerk =Jej =Niej =Nią', 'Strzyżeń")
# HU
nahrad("tulajdonk hol mikor kinek miért pontos'", "tulajdonk mikor kinek miért pontos'")
nahrad("'Cím Címet Mostn Utca Térkép Navig Elhelyezk =hol talál nitr odajut'", "'Cím Címet Mostn Utca Térkép Navig Elhelyezk =Hol talál nitr odajut jutok jutni barbersho szalon üzlet'")
# SR
nahrad("onda gde gdje kad kada =ko kome zašto'", "onda kad kada =ko kome zašto'")
nahrad("'Adres Mostn Ulic Mapa Navig Nalaz Lokacij =gde nađ nadj nać nitr stign'", "'Adres Mostn Ulic Mapa Navig Nalaz Lokacij =Gde =Gdje nađ nadj nać nitr stign barbersho salon radnj lokal'")
nahrad("Nećakinj =Unuka =Unuku Verenic', ", "Nećakinj =Unuka =Unuku Verenic =Nju =Njoj =Nje', ")
# UK
nahrad("'Адрес Мостн Вулиц Мап Навіг Знаходит Розташ =де знайт нітр дістат'", "'Адрес Мостн Вулиц Мап Навіг Знаходит Розташ =Де знайт нітр дістат барбершоп салон заклад'")
nahrad("Племінниц Онучк', ", "Племінниц Онучк =Неї =Її =Їй =Нею', ")
# spojky a zámená prvej osoby pre deti už modul nepotrebuje (P7: cena je celá skupina, nie jedna služba)
s, n1 = re.subn(r"\n 'spoj': '[^']*',", '', s)
s, n2 = re.subn(r"\n 'ine': \{[^}]*\},[^\n]*", '', s)
if (n1, n2) != (7, 7): raise SystemExit(f'spoj {n1}, ine {n2}')
# slová, ktoré menia službu (iná osoba, zápor, dĺžka) – zvýraznenie riadku cenníka len bez nich (P7 b)
MOD = {'EN': 'not all us no', 'DE': 'nicht ohne bis sie ihr ihn ihm uns', 'CS': 'ne bez do pod nad nas nam jich', 'PL': 'nie bez do pod nad ich nas nam',
       'HU': 'nem ket', 'SR': 'ne bez do pod nad nas nama', 'UK': 'не без до під над нас нам ні'}
for L, m in MOD.items():
    i = s.index(f'\n{L} = {{'); j = s.index("\n 'frag':", i)
    s = s[:j] + f"\n 'mod': '{m}'," + s[j:]
P.write_text(s, 'utf8'); print('upravené', P)
