# Texty rezervácie Barbershopu 30 (návrh pre správcu ich systému)

Rezervačný systém na www.barbershop30.sk/rezervacia je ich vlastný (formulár, potvrdenie, e‑maily, SMS). Texty v ňom
sú v jazykovom súbore systému (kľúče nižšie, slovenčina). Nový web ich nemení; toto je návrh, ktorý vloží ich správca.
Hotové hodnoty na vloženie: `docs/texty-rezervacia.sk.json` (len zmenené kľúče, ostatné ostávajú).

Zásady: tykanie ako na novom webe (dnes sa v systéme mieša tykanie s vykaním), krátke vety, „Barbershop 30“
s medzerou, bez sľubov, ktoré systém nerobí. Zástupné značky systému `:date`, `:time`, `:attribute` ostávajú presne.
SMS je zámerne bez diakritiky: s diakritikou sa správa počíta po 70 znakov (dve SMS), takto má 112 znakov (jedna).
Ak chce prevádzka v e‑mailoch ostať pri vykaní, dá sa návrh prepísať; dôležité je, aby celá cesta hovorila jedným hlasom.

Stav 2026‑10‑25: texty prečítané z verejnej stránky rezervácie (len čítanie). Interné e‑maily pre recepciu
(mail.alert_*, mail.contact_*), darčekové poukážky a texty mimo rezervácie sa nemenia.

| kľúč | teraz | návrh |
|---|---|---|
| `rezervation.step_1_heading` | Online rezervácia | Objednaj sa online |
| `rezervation.step_1_content` | Klikni na vybranú službu a pokračuj podľa pokynov | Vyber si službu, potom barbera a čas, ktorý ti sedí. |
| `rezervation.step_2_heading` | 2. Vyberte pracovníka | 2. Vyber si barbera |
| `rezervation.step_2_content` | Zvolte si Vášho obľúbeného barbera, ktorý sa postará o Vaše pohodlie. | Svojho obľúbeného, alebo Nezáleží a dostaneš prvého voľného. |
| `rezervation.step_3_heading` | 3. Vyberte termín | 3. Vyber si deň a čas |
| `rezervation.step_3_content` | Je len na Vás, ktorý deň a hodina Vám najviac vyhovuje. My sa postaráme, aby bolo všetko pripravené. | Ktorý deň a hodina ti sedí? Všetko ti pripravíme. |
| `rezervation.step_4_heading` | 4. Vyplňte Vaše osobné údaje | 4. Tvoje údaje |
| `rezervation.step_4_content` | Vyplňte meno a priezvisko osoby, pre ktorú bude rezervácia určená. Kontaktné údaje potrebujeme v prípade, že sa s Vami budeme musieť spojiť. | Meno toho, kto príde, a kontakt, keby sme sa ti potrebovali ozvať. |
| `rezervation.first_name` | meno | Meno |
| `rezervation.last_name` | priezvisko | Priezvisko |
| `rezervation.email` | email | E-mail |
| `rezervation.phone` | telefón | Telefón |
| `confirmation.heading` | Vaša rezervácia bola úspešná! | Hotovo, tešíme sa na teba |
| `confirmation.content` | Ďakujeme za Vašu rezerváciu a už teraz sa tešíme na Vašu návštevu. Na emailovú adresu, ktorú ste uviedli pri rezervácii sme Vám poslali všetky dôležité informácie o rezervácii. V prípade akýchkoľvek otázok, alebo pre zmenu rezervácie nás neváhajte kontaktovať telefonicky alebo emailom. | Termín máš rezervovaný a detaily sme ti poslali na e-mail. Ak budeš potrebovať niečo zmeniť, zavolaj nám na 0951 267 203. |
| `confirmation.details` | Detaily rezervácie | Tvoja rezervácia |
| `confirmation.employee` | Pracovník | Barber |
| `mail.confirmation_subject` | Rezervácia termínu v Barbershop30 | Tvoj termín v Barbershop 30 |
| `mail.confirmation_heading` | Vaša rezervácia bola úspešná! | Tvoj termín je rezervovaný |
| `mail.confirmation_content` | Ďakujeme za Vašu rezerváciu a už teraz sa tešíme na Vašu návštevu. Nižšie nájdete všetky detaily Vašej rezervácie. V prípade akýchkoľvek otázok, alebo pre zmenu rezervácie nás neváhajte kontaktovať telefonicky alebo emailom. | Ďakujeme, tešíme sa na teba. Nižšie nájdeš všetky detaily. Ak potrebuješ termín zmeniť alebo zrušiť, zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. |
| `mail.confirmation_employee` | Pracovník | Barber |
| `mail.confirmation_thanks` | Ďakujeme a tešíme sa na Vašu návštevu | Tešíme sa na teba, tím Barbershop 30 |
| `mail.confirmation_heading_address` | Kde nás nájdete? | Kde nás nájdeš |
| `mail.confirmation_content_address` | Náš barbershop sa nachádza v Nitre na adrese Mostná 30. Určite nás neprehliadnete. | Na Mostnej 30 v Nitre. |
| `mail.confirmation_button_address` | Pozrieť na mape | Navigovať |
| `mail.reminder_subject` | Pripomenutie termínu v Barbershop30 | Zajtra sa vidíme v Barbershop 30 |
| `mail.reminder_heading` | Pripomenutie Vášho termínu | Zajtra sa vidíme |
| `mail.reminder_content` | Zajtra, dňa :date o :time, máte u nás v Barbershop30 rezerváciu termínu na nižšie uvedenú službu/y. Pripravíme všetko pre Vaše pohodlie. Tešíme sa na Vašu návštevu. | Zajtra :date o :time ťa čakáme v Barbershop 30 na službu nižšie. Ak nestihneš, daj nám prosím vedieť na 0951 267 203. |
| `sms.order_reminder` | Dobry den. Len Vam chceme pripomenut Vas zajtrajsi rezervovany termin o :time. Tesime sa na Vasu navstevu. Barbershop30 Mostna 30 Nitra | Ahoj, zajtra o :time ta cakame v Barbershop 30, Mostna 30, Nitra. Ak nestihnes, zavolaj 0951 267 203. Tesime sa! |
| `validation.phone` | :attribute nie je správne | Skontroluj prosím :attribute. |

Vzhľad rezervácie (rámčeky, polia, súhrn a potvrdenie) rieši `assets/tema-rezervacia.css` (docs/TEMA_REZERVACIA.md);
náhľad s novými textami aj štýlom: `node source/tools/tema-nahlad.mjs --texty` (snímky docs/screenshots/tema-rezervacia/).
Texty, ktoré má systém priamo v kóde („Služby:“, „Odstrániť“, „Pridať službu“, „Zmeniť“), sa cez jazykový súbor
zmeniť nedajú. Pri potvrdení systém za názov služby vypisuje aj celý jej popis v zátvorke; štýl ho skryje.
