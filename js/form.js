// Booking form: the subjects, the open class and the email Ismael receives. Validation, the bot checks and the delivery
// through the isa-forms Worker are the contact piece shared with IsProfile (/assets/ds/contact.js).
import { $, esc } from './core/dom.js';
import { initContactForm, fieldError } from '/assets/ds/contact.js';
import { t, currentLang, dictionary, onLangChange } from './i18n.js';
import { CONTACT } from './config.js';

const TURNSTILE_PRIVACY = 'https://www.cloudflare.com/turnstile-privacy-policy/';
let interest = null; // subject chosen from a "book" button, kept until the visitor sends or changes it
const form = () => $('#leadForm');

// ---------- rendering (also called when the language changes) ----------
export function renderForm() {
  const sel = $('#fInterest');
  const current = interest || sel.value;
  sel.innerHTML = `<option value="">${esc(t('contact.fChoose'))}</option>`
    + t('subjects.items').map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')
    + `<option value="open">${esc(t('contact.fOpen'))}</option><option value="other">${esc(t('contact.fOther'))}</option>`;
  if (current) sel.value = current;
  if (sel.value) fieldError(sel, '');
  syncMessageRequired();
  const mail = `<a href="mailto:${esc(CONTACT.publicEmail)}">${esc(CONTACT.publicEmail)}</a>`;
  const turnstile = `<a href="${TURNSTILE_PRIVACY}" target="_blank" rel="noopener noreferrer">${esc(t('contact.turnstileLink'))}</a>`;
  const notice = `<a href="/privacy/${currentLang() === 'en' ? '?lang=en' : ''}">${esc(t('contact.privacyNotice'))}</a>`;
  $('#privacyText').innerHTML = esc(t('contact.privacy')).replace('{email}', mail).replace('{turnstile}', turnstile).replace('{notice}', notice);
  const privacyLink = document.querySelector('[data-i18n="footer.privacy"]');
  if (privacyLink) privacyLink.href = t('footer.privacyHref');
  $('#footerMail').href = `mailto:${CONTACT.publicEmail}`;
  // WhatsApp opens with a first message in the language of the page
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(t('contact.waText'))}`;
  $('#waLink').href = wa;
  $('#footerWa').href = wa;
  $('#mailLink').href = `mailto:${CONTACT.publicEmail}`;
}

// id: a subject, "open" or "other" from a button that books something specific;
// null from a generic link ("Reservar clase", "Pide tu análisis gratuito"…): it clears a choice made by another
// button, but never what the visitor picked by hand in the form
export function setInterest(id) {
  const sel = $('#fInterest');
  if (id === null && interest && sel.value === interest) sel.value = '';
  interest = id;
  renderForm();
}

// signing up for an open class needs no explanation: the message is only required for classes
function syncMessageRequired() {
  const msg = form().elements.message;
  const optional = form().elements.interest.value === 'open';
  msg.required = !optional;
  msg.closest('label').querySelector('.req').hidden = optional;
  if (optional) fieldError(msg, '');
}

// ---------- the email Ismael receives ----------
// the Worker turns each key into a row of the email, so keys are labels written for him in Spanish
// the subject is always written in Spanish for Ismael, whatever language the visitor uses
async function subjectInSpanish(id) {
  const es = await dictionary('es');
  if (id === 'open') return es.contact.fOpen;
  if (id === 'other') return es.contact.fOther;
  return es.subjects.items.find(s => s.id === id)?.name ?? id;
}

async function buildEmail(f) {
  const v = name => f.elements[name].value.trim();
  const subject = await subjectInSpanish(f.elements.interest.value);
  const language = currentLang() === 'en' ? 'Inglés' : 'Español';
  const summary = `${v('name')} quiere información sobre «${subject}».${v('level') ? ` Edad o nivel: ${v('level')}.` : ''} Idioma: ${language}.`;
  return {
    Resumen: summary,
    Nombre: v('name'),
    Email: v('email'),
    'Teléfono': v('phone') || '—',
    'Interés': subject,
    'Edad o nivel': v('level') || '—',
    Mensaje: v('message') || '—',
    Idioma: language,
    _subject: `Nueva solicitud: ${subject} — ${v('name')}`,
    _replyto: v('email'),
  };
}

export function initForm() {
  const contact = initContactForm({
    form: form(),
    texts: () => ({ required: t('contact.fRequired'), badEmail: t('contact.fBadEmail'), needPrivacy: t('contact.fNeedPrivacy'),
      send: t('contact.fSend'), sending: t('contact.fSending'), ok: t('contact.fOk'), saved: t('contact.fSaved'), uncertain: t('contact.fUncertain'), error: t('contact.fError') }),
    buildEmail,
    onSent: () => { interest = null; renderForm(); },
  });
  onLangChange(contact.refreshTexts);
  $('#fInterest').addEventListener('change', syncMessageRequired);
}
