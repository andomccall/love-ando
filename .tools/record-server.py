#!/usr/bin/env python3
# Serves the loveando.org site locally AND accepts a recorded canvas clip via
# POST /rec (saved to the recordings dir). Used for Stage 5 of the Blanksy
# pipeline: record a ~15s canvas clip of a new feature and hand it to Ando.
# Usage: python3 record-server.py <site_root> <port> <out_dir>
import http.server, socketserver, os, sys, functools

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else '.'
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4682
OUT = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.join(ROOT, '.tools', 'recordings')
os.makedirs(OUT, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204); self.end_headers()
    def do_POST(self):
        if self.path.startswith('/rec'):
            n = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(n)
            name = self.headers.get('X-Filename', 'clip.webm')
            name = os.path.basename(name)  # no path traversal
            with open(os.path.join(OUT, name), 'wb') as f:
                f.write(data)
            self.send_response(200); self.end_headers()
            self.wfile.write(b'ok')
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a):
        pass

Handler = functools.partial(H, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'serving {ROOT} on :{PORT}, recordings -> {OUT}', flush=True)
    httpd.serve_forever()
