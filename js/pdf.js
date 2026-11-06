// The brochure link of the intro ([data-pdf]) downloads IsAcademy as the visitor sees it: in the language and the theme
// of the page. tools/pdf.py prints the four files from the page itself (css/print.css).
import { currentLang, onLangChange } from './i18n.js';
import { isDark, onThemeChange } from './theme.js';

const pdfName = (lang, dark) => `/academy/isacademy${lang === 'en' ? '-en' : ''}${dark ? '-dark' : ''}.pdf`;

export function initPdfLinks() {
  const sync = () => document.querySelectorAll('[data-pdf]').forEach(a => a.setAttribute('href', pdfName(currentLang(), isDark())));
  onLangChange(sync);
  onThemeChange(sync);
  sync();
}
