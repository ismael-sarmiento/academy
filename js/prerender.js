// With ?prerender the rendered Spanish sections are exported so tools/prerender.py can write them into index.html:
// search engines and AI crawlers that do not run JavaScript then read the whole page.
import { t } from './i18n.js';
import { esc } from './core/dom.js';
const IDS = ['trust', 'aboutBadges', 'pillars', 'steps', 'subjects', 'why', 'reviews', 'reviewsLink', 'faqList', 'fact', 'fInterest', 'privacyText'];

export function exportPrerenderIfAsked() {
  if (!new URLSearchParams(location.search).has('prerender')) return;
  const out = {};
  IDS.forEach(id => {
    const clone = document.getElementById(id).cloneNode(true);
    clone.querySelectorAll('.in').forEach(el => el.classList.remove('in'));
    out[id] = clone.innerHTML;
  });
  // The visitor gets a shuffled fact; the generated HTML must be reproducible.
  out.fact = esc(t('resources.facts')[0]);
  const tag = document.createElement('script');
  tag.type = 'application/json';
  tag.id = 'prerender-out';
  tag.textContent = JSON.stringify(out);
  document.body.appendChild(tag);
}
