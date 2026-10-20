# Právne hranice: reklamy, dopyty, hlas a AI (stav 2026-10-17)

Pre časť „Reklamy, dopyty a schvaľovanie“ v `../SKILL.md` a pre krátke videá (`../../youtube-shorts/`). Zdroj: rozbor
videa restructureai „AI Social Media Team“ (`../../referencie-z-videi/references/naucene-z-videi.md`, záznam 10).
Prečítané z primárnych zdrojov 2026-10-17, ak nie je uvedené inak („sekundárne“ = článok alebo návod tretej strany).
Nie je to právne poradenstvo; texty pre zákazníkov (formulár, súhlas, oznámenie) nech skontroluje právnik. Pred
použitím over, či sa znenie nezmenilo (slov-lex.sk má verzie podľa dátumu účinnosti).

## Stručne: čo z toho pre nás

| Ponuka „AI marketingu“ | Prečo nie | Pravidlo nižšie |
| --- | --- | --- |
| hlasový agent volá zákazníkovi do 60 s po vyplnení formulára | automatické volacie systémy na priamy marketing len s predchádzajúcim preukázateľným súhlasom; oznámiť AI pri prvej interakcii; nahrávka hlasu len s privolením | 452/2021 § 116 ods. 3 a 4, AI Act čl. 50 ods. 1, OZ § 12, GDPR, ElevenLabs |
| automatické odpovede na komentáre a DM, odkaz „nechaj číslo“ | naše pravidlo; Meta: okno 24 h, jedna súkromná odpoveď na komentár do 7 dní, automatiku oznámiť | Meta |
| video z fotiek generované AI, AI hlasy v reklame za služby | zákazník vidí niečo, čo sa nestalo (klamlivé konanie); deepfake treba označiť; hlas človeka len s privolením | 108/2024 § 10, AI Act čl. 50 ods. 4, OZ § 12, YouTube a TikTok |
| žiadať recenzie len od spokojných alebo za zľavu | zakazuje Google; falošné alebo skresľované hodnotenia sú vždy nekalé | Google, 108/2024 príloha č. 1 body 31 a 32 |
| sťahovať cudzie reklamy botom a učiť sa z nich ako z predlohy | Meta povoľuje programový prístup len cez API; autorské práva a nekalá súťaž | Meta |
| meranie návštev z reklamy cez cookies bez súhlasu | ukladanie a čítanie v zariadení len s preukázateľným súhlasom | 452/2021 § 109 ods. 8 |
| vymyslené čísla („väčšina firiem volá až na druhý deň“) | klamlivé konanie | 108/2024 § 10 |
| stiahnuť cudzie video a použiť ho v našom príspevku či shorte; sťahovať z YouTube | rozmnoženina bez súhlasu, súkromná kópia sa na firmu nevzťahuje; podmienky YouTube, TikToku a Mety | autorský zákon § 19, § 42, § 51c, § 60, TZ § 283; `../../referencie-z-videi/references/stahovanie-a-pravo.md` |
| výzva „napíš slovo do DM“ s automatickou odpoveďou | naše pravidlo (žiadne automatické DM); okno 24 h, jedna súkromná odpoveď na komentár; na YouTube správy len po pozvánke, ktorú druhá strana povolí | Meta, nižšie |
| pustiť v prevádzke film, seriál alebo hudbu z domáceho predplatného | verejné vykonanie potrebuje súhlas; domáce predplatné je len na osobné použitie | autorský zákon § 26 ods. 2, Netflix Terms of Use 1.4 a 1.8(i) |

## Telefonovanie, SMS, e-mail (zákon 452/2021 Z. z. o elektronických komunikáciách)

Znenie účinné od 18. 8. 2026: https://static.slov-lex.sk/static/SK/ZZ/2021/452/20260818.html

- **§ 116 ods. 2**: priamy marketing je „akákoľvek forma prezentácie tovarov alebo služieb v písomnej forme
  alebo ústnej forme … vrátane získavania informácií o tovaroch a službách od účastníka“.
- **§ 116 ods. 3**: „Na účely priameho marketingu je dovolené používanie automatických volacích a komunikačných
  systémov bez ľudského zásahu, telefaxu, elektronickej pošty, služby SMS a služby MMS voči účastníkovi alebo
  užívateľovi len s jeho predchádzajúcim preukázateľným súhlasom získaným pred kontaktovaním účastníka alebo užívateľa.“
- **§ 116 ods. 4**: súhlas sa nesmie získavať volaním, automatickým systémom, e-mailom ani SMS.
- **§ 116 ods. 5**: súhlas podľa GDPR; záznam uchovať aspoň 4 roky od odvolania; pri získavaní uviesť, ako ho
  jednoducho odvolať.
- **§ 116 ods. 8**: volanie na priamy marketing je zakázané na čísla v zozname nesúhlasu (vedie Úrad) alebo po
  námietke. **Ods. 14** vyníma z ods. 8 a 12 vlastných zákazníkov pri podobných službách a komunikáciu, ktorú si
  človek sám vopred preukázateľne vyžiadal, s možnosťou kedykoľvek odmietnuť. Výnimka sa netýka ods. 3.
- **§ 109 ods. 8**: ukladať alebo čítať informácie v zariadení používateľa (cookies, meranie návštev) len
  s jeho preukázateľným súhlasom (okrem technicky nevyhnutného).

## Hlas, nahrávky, osobné údaje

- **Občiansky zákonník § 12 ods. 1** (znenie 31. 7. 2026, https://static.slov-lex.sk/static/SK/ZZ/1964/40/20260731.html):
  „obrazové a zvukové záznamy týkajúce sa fyzickej osoby alebo jej prejavov osobnej povahy sa smú vyhotoviť
  alebo použiť len s jej privolením.“ Platí aj pre klon hlasu majiteľa či zamestnanca.
- **Trestný zákon § 377** (znenie 18. 8. 2026, https://static.slov-lex.sk/static/SK/ZZ/2005/300/20260818.html):
  neoprávnené zachytenie neverejne prednesených slov a sprístupnenie alebo použitie záznamu so spôsobením vážnej
  ujmy na právach, trest až 2 roky.
- **GDPR** (nariadenie 2016/679): právny základ (čl. 6; odpoveď na požiadavku, ktorú človek poslal, je krok pred
  zmluvou na jeho žiadosť, písm. b), informovanie pri získaní údajov (čl. 13), zmluva so sprostredkovateľom
  (čl. 28, napr. dodávateľ hlasového agenta), prenos mimo EÚ (kapitola V).
- Slovenské usmernenie ÚOOÚ k nahrávaniu hovorov sme nenašli (overiť na dataprotection.gov.sk).

## AI (nariadenie 2024/1689, AI Act)

https://artificialintelligenceact.eu/article/50/ ; platí od 2. 8. 2026.

- **čl. 50 ods. 1**: systémy určené na priamu interakciu s ľuďmi musia ľudí informovať, že komunikujú so
  systémom AI, ak to nie je zrejmé.
- **čl. 50 ods. 4**: kto použije deepfake (obraz, zvuk, video), musí oznámiť, že je umelo vytvorený alebo upravený.
- **čl. 50 ods. 5**: informácia „clear and distinguishable“, najneskôr pri prvej interakcii alebo vystavení.
- Sekundárne (Gibson Dunn, Legalithm): „Digital Omnibus“ posunul pravidlá pre vysokorizikové systémy,
  nie povinnosť oznámiť AI podľa čl. 50.

## Spotrebitelia (zákon 108/2024 Z. z. o ochrane spotrebiteľa)

Znenie 27. 9. 2026: https://static.slov-lex.sk/static/SK/ZZ/2024/108/20260927.html

- **§ 10**: klamlivé konanie (nepravdivé alebo zavádzajúce informácie o hlavných vlastnostiach produktu,
  aj keď sú vecne správne, ak môžu uviesť do omylu).
- **Príloha č. 1, bod 31**: tvrdiť, že hodnotenia sú od skutočných zákazníkov, bez primeraných krokov na overenie.
- **Príloha č. 1, bod 32**: „Predloženie alebo poverenie inej osoby, aby poskytla falošné spotrebiteľské
  hodnotenia alebo odporúčania, alebo skresľovanie spotrebiteľských hodnotení alebo odporúčaní v sociálnych
  médiách s cieľom propagovať produkty.“

## Meta

- Automatický zber: „Platform APIs are the only allowable means to access data programmatically, unless you
  have our prior written permission.“ https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection/
- Správy Messenger a Instagram (https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy):
  odpovedať do 24 h od správy človeka; značka Human Agent na ručné odpovede do 7 dní; súkromná odpoveď na
  komentár do 7 dní, jedna správa; automatický chat oznamuje automatiku, kde to vyžaduje zákon, a Meta to
  odporúča vždy.
- Archív reklám (DSA čl. 39, nariadenie 2022/2065): obsah, za koho, kto platil, obdobie, cielenie, celkový dosah,
  1 rok po poslednom zobrazení; **výdavky nie**. Sekundárne: Meta ukazuje sumy len pri politických a spoločenských
  reklamách.
- Sekundárne: fáza učenia asi 50 udalostí na sadu reklám za 7 dní; rozpočet kampane Advantage+ sám presúva
  peniaze na lepšie sady; limity výdavkov kampane a účtu existujú (presné správanie over v pomocníkovi Mety).
- Výzva cez kľúčové slovo v DM (rozbor V6, 2026-10-19): nástroj (napr. ManyChat, „official Meta Business Partner“)
  je napojený na profesionálny účet cez Instagram API. Keď človek napíše, Meta pošle webhook `messages` s ID
  a textom; odpoveď smie ísť len v okne 24 h od správy človeka (oprávnenia `instagram_business_basic`,
  `instagram_business_manage_messages`). Pri komentári: „Only one message can be sent to the commenter“, do 7 dní;
  ďalšie správy len ak človek odpovie, do 24 h (developers.facebook.com/docs/instagram-platform/private-replies).
  U nás nie: automatické DM sú proti pravidlu praxe; výnimku by musel výslovne rozhodnúť majiteľ (D1).

## Google, YouTube, TikTok

- Google, Rating Manipulation (https://support.google.com/contributionpolicy/answer/7400114): zakázané
  „Discourage or prohibit negative reviews, or selectively solicit positive reviews from customers“ a „Offer
  incentives … in exchange for posting any review“.
- YouTube (https://support.google.com/youtube/answer/14328491): „We require creators to disclose AI-generated or
  altered content that seems realistic“ (nastavenie „AI use“ pri nahrávaní); netreba pri scenári, titulkoch,
  filtroch ani klone vlastného hlasu na komentár.
- TikTok: Business Messaging API existuje (https://ads.tiktok.com/help/article/marketing-api); podľa tretej
  strany (Vista Social) nie je pre firemné účty v EHP. Realistický obsah z AI treba označiť (sekundárne, AP 2024).
- YouTube súkromné správy zrušil 18. 9. 2019 (Engadget 2019-08-20); dnes ich má obmedzene ako „Video sharing & messaging“
  vo vybraných krajinách vrátane Slovenska: od 18 rokov, prihlásený kanál, konverzácia až po pozvánke cez odkaz
  (platí 7 dní), ktorú druhá strana povolí (support.google.com/youtube/answer/16650958, 2026-10-19). Výzva „napíš mi slovo do DM“
  v shorte preto nefunguje ako na Instagrame.
- YouTube, Harmful or dangerous content (https://support.google.com/youtube/answer/2801964): zakázaný je obsah
  „that shows viewers how to get unauthorized access to content, software, or services that usually require payment“.
- Google Earth a Earth Studio vo videách (Google geo-guidelines, čítané 2026-10-17): „may not be used for any
  commercial or promotional purposes“; propagačný short so zábermi z Google Earth nie.

## ElevenLabs (ak by niekto navrhoval hlasového agenta)

- Oznámenie pred interakciou: „They are interacting with AI rather than a human“ a „Their conversations are being
  recorded and may be shared with ElevenLabs and its third-party large language model providers“
  (https://elevenlabs.io/docs/eleven-agents/legal/disclosure-requirement).
- Hromadné hovory zo zoznamu CSV cez Twilio alebo SIP; režim bez uchovávania (Zero Retention Mode) sa pri nich
  nedá zapnúť (https://elevenlabs.io/docs/agents-platform/phone-numbers/batch-calls).
