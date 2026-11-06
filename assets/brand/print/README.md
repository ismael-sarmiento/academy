# IsAcademy · Brand assets for print

Vector files have **text converted to paths**: they print the same everywhere, with no fonts installed.

| File | Use |
|---|---|
| `isacademy-logo.svg` / `.png` (3000 px) | Full logo for light backgrounds |
| `isacademy-logo-dark.svg` / `.png` (3000 px) | Full logo for dark backgrounds |
| `isacademy-wordmark.svg` | Logo without "by Ismael Sarmiento" |
| `is-monogram.svg` / `.png` (2048 px) | Two-letter mark: gold "Is" on navy (avatar, sticker, favicon) |
| `is-monogram-transparent.svg` / `.png` | Gold "Is" without background |
| `qr-isacademy.svg` / `.png` (2352 px) | QR to https://isuniverse.dev/academy/ (error correction H) |
| `qr-isacademy-logo.svg` / `.png` | Same QR with the "Is" mark in the centre |
| `poster-light.pdf` / `poster-dark.pdf` | A4 poster for schools and study centres: logo, motto, what we do, why us, QR and ten tear-off strips with WhatsApp and the address (`python3 tools/poster.py`, texts from `i18n/es.json`) |

Both QR codes were checked with the macOS QR detector, also at 300 px. Print the QR at **2.5 cm or larger** and keep the white margin.

## Colours and fonts

- Navy `#1C2547` · Gold `#C8953F` (light) / `#E2B25C` (dark) · Cream `#FBF7EF` · Grey text `#4A5170`
- "Is": Allura · "Academy" and body text: Space Grotesk 500 (both OFL, in `assets/fonts/`)

## Regenerate

Scripts in `tools/brand/` (macOS, no downloads: CoreText and CoreImage):

```bash
cd tools/brand
swiftc -O glyphs.swift -o glyphs && swiftc -O qr.swift -o qr
python3 compose.py                      # logo paths
./qr gen "https://…" H > qr-matrix.txt  # QR modules
python3 qr_build.py                     # QR SVG/PNG (the logo PNG: render the SVG at 2352 px)
./qr dec qr-isacademy.png               # checks that a QR decodes
```
