# Vytiahne viditeľný text z HTML (bez skriptov a štýlov)
import sys,re,html
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S|re.I)
s=re.sub(r'<style\b[^>]*>.*?</style>','',s,flags=re.S|re.I)
s=re.sub(r'<!--.*?-->','',s,flags=re.S)
t=re.sub(r'<br\s*/?>','\n',s)
t=re.sub(r'<[^>]+>','\n',t)
t=html.unescape(t)
out=[]
for l in t.split('\n'):
    l=re.sub(r'\s+',' ',l).strip()
    if l: out.append(l)
print('\n'.join(out))
