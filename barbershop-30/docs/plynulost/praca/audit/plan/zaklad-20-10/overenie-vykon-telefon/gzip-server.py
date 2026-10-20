# Statický server s gzip pre text (ako GitHub Pages), na Lighthouse bez skreslenia nekomprimovaným HTML/CSS/JS.
# python3 -I gzip-server.py <koreň> <port>
import gzip, http.server, os, sys
root, port = sys.argv[1], int(sys.argv[2])
TEXT = ('.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.xml')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
    def log_message(self, *a): pass
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path): path = os.path.join(path, 'index.html')
        if path.endswith(TEXT) and os.path.isfile(path) and 'gzip' in self.headers.get('Accept-Encoding', ''):
            data = gzip.compress(open(path, 'rb').read(), 6)
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            import io; return io.BytesIO(data)
        return super().send_head()
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
