// "Alan" on IsAcademy: the assistant shared by every site of Ismael Sarmiento (/assets/ds/assistant.js), fed with the
// academy's knowledge base in i18n (assistant.intents). Local and private: no server, no external model.
import { t } from './i18n.js';
import { createAssistant } from '/assets/ds/assistant.js';

const norm = s => ' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ+#\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
let alan = null;

// Light stemming so plurals match their singular key ("clases" → "clase", "presenciales" → "presencial").
const stem = w => (w.length > 5 && /[lnrdz]es$/.test(w) ? w.slice(0, -2) : w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);
const prep = s => ' ' + norm(s).trim().split(' ').map(stem).join(' ') + ' ';

// Score every intent: a key counts when it appears as whole words; longer keys weigh more,
// "boost" ranks specific intents (price, booking, thesis, identity) above topics, and
// generic intents (greetings, thanks, bye) only win when nothing else matched.
export function match(question) {
  const q = prep(question);
  let best = null, bestScore = 0, bestGeneric = null, bestGenericScore = 0;
  for (const intent of t('assistant.intents')) {
    let score = 0;
    for (const key of intent.keys) {
      const k = prep(key);
      if (q.includes(k)) score += k.trim().length;
    }
    if (!score) continue;
    if (intent.boost) score += intent.boost;
    if (intent.generic) { if (score > bestGenericScore) { bestGeneric = intent; bestGenericScore = score; } continue; }
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  if (best && bestScore >= 2) return best;
  return bestGenericScore >= 2 ? bestGeneric : null;
}

// the academy's intents carry "book" (a subject to preselect in the form): it travels as the generic "arg"
const toShared = intent => intent && { answer: intent.answer, actions: (intent.actions || []).map(a => ({ ...a, arg: a.book || '' })) };

function texts() {
  return {
    name: t('assistant.name'), badge: t('assistant.badge'), subtitle: t('assistant.subtitle'), open: t('assistant.open'),
    openLabel: t('assistant.openLabel'), close: t('assistant.close'), placeholder: t('assistant.placeholder'), send: t('assistant.send'),
    typing: t('assistant.typing'), greeting: t('assistant.greeting'), suggestions: t('assistant.suggestions'),
    fallback: { answer: t('assistant.fallback'), actions: [{ label: t('nav.cta'), href: '#contacto' }] },
  };
}

export function refreshAssistant() { alan?.refresh(texts()); }

export function initAssistant(actionHandler) {
  alan = createAssistant({
    ...texts(),
    fabId: 'assistantFab',
    startHidden: !document.body.classList.contains('entered'),   // may load after the intro has already ended
    match: q => toShared(match(q)),
    onAction: ({ href, action, arg }) => actionHandler({ href, action, book: arg }),
  });
}
