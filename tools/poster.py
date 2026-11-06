#!/usr/bin/env python3
"""Writes the IsAcademy poster for schools, libraries and study centres: one A4 page with the logo, the motto, what we
do, why us, a QR to the website and ten tear-off strips with WhatsApp and the address, in two versions:

  assets/brand/print/poster-light.pdf   cream paper, cheap to print
  assets/brand/print/poster-dark.pdf    night paper, as the website

The texts come from i18n/es.json (motto, subjects, why us), so the poster says what the site says.
    python3 tools/poster.py
"""
import html
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRINT = ROOT / 'assets/brand/print'
FONTS = (ROOT / 'assets/fonts').as_uri()
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
WHATSAPP = '613 371 874'
WEB = 'isuniverse.dev/academy'

es = json.loads((ROOT / 'i18n/es.json').read_text())
motto = re.sub(r'<b>(.*?)</b>', r'<b>\1</b>', es['intro']['hook'])                      # «La IA te da respuestas. <b>Aquí…</b>»
subjects = [s['name'] for s in es['subjects']['items'] if s['id'] not in ('tfg', 'careers')]
why = [es['why']['items'][i] for i in (0, 1, 3, 4)]                                    # experience, tailored, AI judgement, support
e = html.escape

THEMES = {
    'light': {'paper': '#fbf7ef', 'ink': '#1c2547', 'soft': '#4a5170', 'gold': '#b58534', 'goldText': '#7a5212', 'line': 'rgba(28,37,71,.16)',
              'card': '#fffdf9', 'logo': 'isacademy-logo.svg'},
    'dark': {'paper': '#0b1026', 'ink': '#f6f1e7', 'soft': '#b9bdd3', 'gold': '#e2b25c', 'goldText': '#e2b25c', 'line': 'rgba(255,255,255,.18)',
             'card': '#141b40', 'logo': 'isacademy-logo-dark.svg'},
}


def page(t):
    strip = (f'<div class="strip"><b>IsAcademy</b><span>Clases de programación e IA</span>'
             f'<span class="wa">WhatsApp {WHATSAPP}</span><span class="web">{WEB}</span></div>')
    whys = ''.join(f'<div class="why"><i></i><h3>{e(w["t"])}</h3><p>{e(w["d"])}</p></div>' for w in why)
    return f'''<!doctype html><meta charset="utf-8"><style>
@font-face {{ font-family: Allura; src: url({FONTS}/allura-latin.woff2); }}
@font-face {{ font-family: "Space Grotesk"; src: url({FONTS}/space-grotesk-latin.woff2); font-weight: 300 700; }}
@page {{ size: A4; margin: 0; }}
* {{ margin: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html, body {{ width: 210mm; height: 297mm; background: {t['paper']}; color: {t['ink']}; font-family: "Space Grotesk"; }}
.sheet {{ height: 297mm; display: flex; flex-direction: column; overflow: hidden; }}
.top {{ flex: 1; min-height: 0; padding: 13mm 16mm 6mm; display: flex; flex-direction: column; }}
.logo {{ width: 112mm; }}
.motto {{ font-size: 18.5pt; line-height: 1.25; margin: 5mm 0 0; color: {t['soft']}; }}
.motto b {{ display: block; color: {t['ink']}; font-weight: 600; }}
.rule {{ width: 22mm; height: 1.2mm; background: {t['gold']}; margin: 4.5mm 0 4mm; border-radius: 1mm; }}
.what {{ font-size: 11.5pt; line-height: 1.5; max-width: 170mm; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 2mm; margin: 4mm 0 0; }}
.chips span {{ font-size: 9.5pt; padding: 1.2mm 3mm; border-radius: 10mm; border: .3mm solid {t['gold']}; color: {t['goldText']}; }}
h2 {{ font-size: 9.5pt; letter-spacing: .14em; text-transform: uppercase; color: {t['goldText']}; margin: 5mm 0 2.5mm; }}
.whys {{ display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }}
.why {{ background: {t['card']}; border: .3mm solid {t['line']}; border-radius: 3mm; padding: 3mm 4mm; }}
.why i {{ display: block; width: 8mm; height: .9mm; background: {t['gold']}; margin-bottom: 2mm; }}
.why h3 {{ font-size: 11.5pt; margin-bottom: 1mm; }} .why p {{ font-size: 9.5pt; line-height: 1.4; color: {t['soft']}; }}
.cta {{ margin-top: auto; display: flex; align-items: center; gap: 7mm; padding-top: 4mm; }}
.qr {{ width: 31mm; height: 31mm; border-radius: 2mm; background: #fff; padding: 1.5mm; flex: none; }}
.qr img {{ width: 100%; height: 100%; display: block; }}
.cta-text p {{ font-size: 11pt; color: {t['soft']}; line-height: 1.5; }}
.cta-text strong {{ display: block; font-size: 17pt; color: {t['ink']}; margin-bottom: 1.5mm; }}
.cta-text .free {{ display: inline-block; margin-top: 2mm; font-weight: 600; color: {t['goldText']}; }}
.cut {{ position: relative; border-top: .4mm dashed {t['soft']}; }}
.cut::before {{ content: "✂"; position: absolute; left: 8mm; top: -3.4mm; font-size: 12pt; color: {t['soft']}; background: {t['paper']}; padding: 0 1mm; }}
.strips {{ height: 62mm; flex: none; display: grid; grid-template-columns: repeat(10, 1fr); }}
.strip {{ border-left: .3mm dashed {t['line']}; writing-mode: vertical-rl; transform: rotate(180deg); display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center; gap: .8mm; padding: 4mm 0; font-size: 8pt; line-height: 1.2; }}
.strip:last-child {{ border-left: 0; }}
.strip b {{ font-size: 10.5pt; }} .strip .wa {{ font-weight: 700; font-size: 9.5pt; color: {t['goldText']}; }} .strip .web {{ font-size: 6.6pt; color: {t['soft']}; }}
</style>
<div class="sheet"><div class="top">
  <img class="logo" src="{(PRINT / t['logo']).as_uri()}" alt="IsAcademy">
  <p class="motto">{motto}</p>
  <div class="rule"></div>
  <p class="what">Clases particulares <b>online y en directo</b> de programación, datos e inteligencia artificial para todas las edades:
    del colegio a la universidad o tu primer empleo. También te acompañamos en tu TFG/TFM y en tu orientación profesional.</p>
  <div class="chips">{''.join(f'<span>{e(s)}</span>' for s in subjects)}</div>
  <h2>Por qué IsAcademy</h2>
  <div class="whys">{whys}</div>
  <div class="cta"><div class="qr"><img src="{(PRINT / 'qr-isacademy-logo.svg').as_uri()}" alt=""></div>
    <div class="cta-text"><strong>¿Empezamos?</strong><p>Escanea el código o escríbenos por WhatsApp al {WHATSAPP}.<br>{WEB}</p>
      <span class="free">Análisis inicial gratuito · Clases online</span></div></div>
</div><div class="cut"></div><div class="strips">{strip * 10}</div></div>'''


if __name__ == '__main__':
    for name, t in THEMES.items():
        with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as tmp:
            tmp.write(page(t))
        out = PRINT / f'poster-{name}.pdf'
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files',
                        '--virtual-time-budget=4000', f'--print-to-pdf={out}', Path(tmp.name).as_uri()], check=True, capture_output=True)
        print(f'wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')
