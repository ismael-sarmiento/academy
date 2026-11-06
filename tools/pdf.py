#!/usr/bin/env python3
"""Writes the downloadable brochure of IsAcademy with headless Chrome, from the page itself (css/print.css):

  isacademy.pdf           Spanish, light   (/academy/?pdf)
  isacademy-en.pdf        English, light   (/academy/?lang=en&pdf)
  isacademy-dark.pdf      Spanish, dark    (/academy/?pdf=dark)
  isacademy-en-dark.pdf   English, dark    (/academy/?lang=en&pdf=dark)

?pdf skips the intro and reveals everything (js/app.js); the "Descargar PDF" link of the intro picks the file of the
language and theme shown (js/pdf.js). Run it with the universe served locally (the portada at the root, this
repository in isacademy/), after tools/bump-version.sh:

    python3 tools/pdf.py [http://127.0.0.1:8777/]
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8777/').rstrip('/')

for name, query in (('isacademy.pdf', '?pdf'), ('isacademy-en.pdf', '?lang=en&pdf'),
                    ('isacademy-dark.pdf', '?pdf=dark'), ('isacademy-en-dark.pdf', '?lang=en&pdf=dark')):
    out = ROOT / name
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--hide-scrollbars',
                    '--virtual-time-budget=15000', f'--print-to-pdf={out}', f'{BASE}/academy/{query}'],
                   check=True, capture_output=True)
    print(f'wrote {out.name} ({out.stat().st_size // 1024} KB)')
