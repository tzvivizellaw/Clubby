"""Build the standalone offline file and the installable app from index.html.

Usage: python3 build.py
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = (here / 'index.html').read_text(encoding='utf-8')
src = '\n'.join(l for l in src.split('\n') if 'claude:viewport' not in l)


def wrap(page, extra_body=''):
    head, rest = page.split('</style>', 1)
    return ('<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</style>\n</head>\n<body>\n' + rest.strip() + '\n' + extra_body + '\n</body>\n</html>\n')


# 1) offline single file: no web fonts, icons stay embedded
offline = '\n'.join(l for l in src.split('\n') if 'fonts.googleapis' not in l)
(here / 'city-and-sea-offline.html').write_text(wrap(offline), encoding='utf-8')

# 2) installable web app (GitHub Pages): icon files, manifest, service worker
app = re.sub(r'<link rel="icon"[^>]*>',
             '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">\n'
             '<link rel="manifest" href="manifest.webmanifest">', src)
app = re.sub(r'<link rel="apple-touch-icon"[^>]*>',
             '<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">\n'
             '<meta name="apple-mobile-web-app-capable" content="yes">\n'
             '<meta name="mobile-web-app-capable" content="yes">\n'
             '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">', app)
sw = ("<script>if('serviceWorker' in navigator&&window.isSecureContext){addEventListener('load',"
      "()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}</script>")
(here / 'app' / 'index.html').write_text(wrap(app, sw), encoding='utf-8')

# bump the service-worker cache so installed copies pick up the new version
swf = here / 'app' / 'sw.js'
s = swf.read_text()
n = int(re.search(r"ir-veyam-v(\d+)", s).group(1)) + 1
swf.write_text(re.sub(r"ir-veyam-v\d+", f"ir-veyam-v{n}", s))
print('built offline + app, cache v%d' % n)
