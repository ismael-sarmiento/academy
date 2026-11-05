#!/usr/bin/env bash
# Sets the cache-busting version of the whole site in ONE place: index.html.
# - the import map lists every JS module as file.js?v=<version> (modules import each other without versions);
# - the stylesheet and the entry script get the same version; i18n.js reads it from its own URL;
# - the shared startup guard is embedded; its hash and the import map hash are recomputed independently;
# - Alan (assistant + avatar) and his stylesheet come from the shared design system in /assets/ds/ (portada repository).
# - 404.html is a copy of the portada's 404, the same page on every site.
# Usage: tools/bump-version.sh [version]   (default: timestamp)
set -euo pipefail
cd "$(dirname "$0")/.."
V="${1:-$(date +%Y%m%d%H%M)}"
python3 - "$V" <<'PY'
import base64, hashlib, json, pathlib, re, sys
v = sys.argv[1]
root = pathlib.Path('.').resolve()
modules = sorted(p.relative_to(root).as_posix() for p in root.glob('js/**/*.js'))
imports = {f'./{m}': f'./{m}?v={v}' for m in modules}
# Alan, his avatar, the tab icons and the particle effects come from the shared design system of ismael-sarmiento.github.io (same origin)
for m in ('/assets/ds/assistant.js', '/assets/ds/avatar.js', '/assets/ds/favicon.js', '/assets/ds/fx.js', '/assets/ds/ds.js', '/assets/ds/frame-guard.js', '/assets/ds/contact.js', '/assets/ds/views.js'):
    imports[m] = f'{m}?v={v}'
importmap = json.dumps({'imports': imports}, indent=2)
html = (root / 'index.html').read_text()
guard = (root.parent / 'ismael-sarmiento.github.io/assets/ds/startup.js').read_text()
guard_tag = f'<script id="startup-guard">{guard}</script>'
if 'id="startup-guard"' in html:
    html = re.sub(r'<script id="startup-guard">.*?</script>', lambda m: guard_tag, html, flags=re.S)
else:
    html = html.replace('  <meta name="referrer"', f'  {guard_tag}\n  <meta name="referrer"', 1)
html = re.sub(r'<script type="importmap">.*?</script>', lambda m: f'<script type="importmap">{importmap}</script>', html, flags=re.S)
html = re.sub(r'(css/main\.css|css/print\.css|js/app\.js|/assets/ds/assistant\.css|/assets/ds/tokens\.css|/assets/ds/contact\.css|/assets/ds/portrait\.css|/assets/ds/startup\.css)\?v=[0-9a-z]+', rf'\1?v={v}', html)
digest = base64.b64encode(hashlib.sha256(importmap.encode()).digest()).decode()
guard_digest = base64.b64encode(hashlib.sha256(guard.encode()).digest()).decode()
html = re.sub(r"(?:'sha256-[A-Za-z0-9+/=]+'\s*)+", f"'sha256-{digest}' 'sha256-{guard_digest}'", html)
(root / 'index.html').write_text(html)
print(f'version → {v} ({len(modules)} modules, import map sha256-{digest[:10]}…)')
PY
# unknown /isacademy/... addresses get the 404 of every site (portada tools/build.py; same origin, absolute paths):
# build the portada first
HUB_404=../ismael-sarmiento.github.io/404.html
if [ -f "$HUB_404" ]; then cp "$HUB_404" 404.html; echo "404.html ← portada"; fi
