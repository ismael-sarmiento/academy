# AGENTS.md — academy (IsAcademy)

## Parent

Global roots (L0):
- Claude Code: `~/.claude/CLAUDE.md`
- Codex: `~/.codex/AGENTS.md`

## Purpose

Entry point for any agent working on the IsAcademy promotional website (GitHub Pages, static), served at
`https://isuniverse.dev/academy/`. Repository `academy`, a copy with history of `isacademy`, which now only redirects
`/isacademy/` here: printed posters and QR codes point there, so never delete it or its redirect pages.
Personal project of Ismael Sarmiento; only the global L0 protocols apply
(Plan al Milímetro before each phase, close-out recap after each task).

## Read order

1. `README.md` — structure, local preview, deployment (A: browser upload, B: git + gh)
2. `.private/PROJECT_CONTEXT.md` — product decisions that must not be reopened without the owner
3. `.private/TODO.md` — pending items and phase roadmap
4. `.private/SEO.md` and `.private/PUBLISHING.md` — SEO checklist and how to publish (browser upload or git)

`.private/` holds the owner's working notes: local only, never published (see `.gitignore`).

## Rules

- Static only: no backend, no build step, no API keys in the repo. Relative paths (site lives under `/academy/`).
- Every user-facing string lives in `i18n/es.json` and `i18n/en.json`; keep both in sync.
- Both themes (light and dark) and phone portrait (375×812) must be checked on every UI change.
- The professional phone +34 613 371 874 (WhatsApp) is public since 2026-10-17 (`js/config.js`); never publish any other number.
- This is a professional academy site whose goal is student acquisition. Playful elements live only in the intro/opening
  and the Resources section (future 3D world). Any game content must be original (no copied characters or franchises).
- Copy tone: professional, plural voice ("nosotros"). Every section should end in a clear path to contact.
- TFG/TFM copy must never suggest doing the student's work.
- Never bypass git hooks or security controls to publish; if `git push` is not allowed, use README option A.
- Code structure: one responsibility per module (see README); shared helpers only in `js/core/`; never copy `$`/`esc`/highlighting into a module.
- Colours only as tokens: the shared ones in `/assets/ds/tokens.css` (portada repository), IsAcademy's own in § 1 of `css/main.css`; components reuse `.card`, `.btn`, `.btn-arrow`, `.code-surface`.
- Never write `?v=` by hand: run `tools/bump-version.sh <version>` (import map + CSP hash) and then `python3 tools/prerender.py`.
