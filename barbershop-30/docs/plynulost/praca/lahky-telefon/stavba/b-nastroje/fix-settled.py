import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
rep=[
("""    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
    window.__scrollSettled = true;
    return;""","""    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
    // bez dobiehania (dotyk) slučka dobehne v každej snímke, aj keď prehliadač ešte plynulo skroluje (kotva, návrat
    // späť): hotovo až 150 ms po poslednom posune (časovač triedy skrol), inak by testy čítali stav uprostred skrolu
    window.__scrollSettled = !skrolTimer;
    return;"""),
("""  skrolTimer = 0;
  if (rafId) skrolKonci = true; else html.classList.remove('skrol');   // slučka beží: zruší sa v jej snímke""",
"""  skrolTimer = 0;
  if (rafId) skrolKonci = true; else { html.classList.remove('skrol'); window.__scrollSettled = true; }   // slučka beží: zruší sa v jej snímke"""),
]
for a,b in rep:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w',encoding='utf-8').write(s)
