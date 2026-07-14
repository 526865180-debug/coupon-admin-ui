#!/usr/bin/env python3
"""Simple HTTP server with SPA fallback for React Router."""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIR = sys.argv[2] if len(sys.argv) > 2 else '/workspace/coupon-admin-ui/dist'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        # If the requested path doesn't exist as a file, serve index.html (SPA fallback)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f'Serving {DIR} on port {PORT} (SPA mode)')
    server.serve_forever()
