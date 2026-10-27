# Náhrada GitHub Pages pre skúšku chybových stránok: strom webu pod /head-spa-30/, chýbajúci súbor -> koreňový 404.html s kódom 404.
# Súbory mimo sparse stromu (napr. assets/ HEAD SPA 30) berie z gitu (HEAD). Predpona /pred/ servíruje pôvodný 404.html z commitu 2687b6e.
#   python3 -I pages-server.py <port> <strom>
import sys, os, subprocess, mimetypes
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlsplit, unquote
PORT, ROOT = int(sys.argv[1]), os.path.abspath(sys.argv[2])
def git_show(rev, rel):
    try: return subprocess.run(['git', '-C', ROOT, 'show', f'{rev}:{rel}'], capture_output=True, check=True).stdout
    except subprocess.CalledProcessError: return None
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, typ):
        self.send_response(code); self.send_header('Content-Type', typ); self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        p = unquote(urlsplit(self.path).path)
        pred = p.startswith('/pred/')
        if pred: p = p[5:]
        if not p.startswith('/head-spa-30/'): return self.send(404, b'mimo /head-spa-30/', 'text/plain')
        rel = p[len('/head-spa-30/'):]
        if rel == '' or rel.endswith('/'): rel += 'index.html'
        f = os.path.normpath(os.path.join(ROOT, rel))
        if not f.startswith(ROOT): return self.send(403, b'', 'text/plain')
        typ = mimetypes.guess_type(f)[0] or 'application/octet-stream'
        if typ.startswith('text/') or typ in ('application/javascript', 'image/svg+xml'): typ += '; charset=utf-8'
        if os.path.isdir(f) and not p.endswith('/'):
            self.send_response(301); self.send_header('Location', ('/pred' if pred else '') + p + '/'); self.end_headers(); return
        if os.path.isfile(f): return self.send(200, open(f, 'rb').read(), typ)
        if not rel.startswith('barbershop-30/'):
            b = git_show('HEAD', rel)
            if b is not None: return self.send(200, b, typ)
        body = git_show('2687b6e', '404.html') if pred else open(os.path.join(ROOT, '404.html'), 'rb').read()
        return self.send(404, body, 'text/html; charset=utf-8')
ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
