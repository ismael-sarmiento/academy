// Landing sections rendered from i18n: trust chips, method, subjects, why us, reviews, FAQ and facts.
import { $, esc } from './core/dom.js';
import { t, currentLang } from './i18n.js';
import { CONTACT } from './config.js';

let factOrder = [], factIdx = 0;
const delay = (i, step = .08) => `style="--d:${(i * step).toFixed(2)}s"`;
const list = items => items.map(x => `<li>${esc(x)}</li>`).join('');

function subjectCard(s, i) {
  return `
      <details class="subject card reveal" id="materia-${s.id}" ${delay(i % 3, .06)}>
        <summary><h3 class="sname">${esc(s.name)}</h3><span class="sgroup">${esc(t(`subjects.groups.${s.group}`))}</span><span>${esc(s.short)}</span></summary>
        <div class="body">
          <h4>${esc(t(s.alt ? 'subjects.learnAlt' : 'subjects.learn'))}</h4>
          <ul>${list(s.learn)}</ul>
          <h4>${esc(t('subjects.how'))}</h4><p>${esc(s.how)}</p>
          <a class="btn btn-primary" href="#contacto" data-book="${s.id}">${esc(s.cta)}</a>
        </div>
      </details>`;
}

function reviewCard(r) {
  const [open, close] = currentLang() === 'es' ? ['«', '»'] : ['“', '”'];
  const translated = t('reviews.translated');
  return `<figure class="card review reveal">
      <div class="stars" role="img" aria-label="${esc(t('reviews.starsLabel'))}">★★★★★</div>
      <blockquote>${open}${esc(r.text)}${close}</blockquote>
      <figcaption>${esc(r.name)} · ${esc(r.date)}${translated ? ` · ${esc(translated)}` : ''}</figcaption></figure>`;
}

export function renderSections() {
  $('#trust').innerHTML = list(t('hero.trust'));
  $('#aboutBadges').innerHTML = list(t('about.badges'));
  $('#pillars').innerHTML = t('method.pillars').map((p, i) =>
    `<article class="card pillar reveal" ${delay(i)}><span class="n">${i + 1}</span><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></article>`).join('');
  $('#steps').innerHTML = t('method.steps').map((s, i) => `<li class="reveal" ${delay(i)}><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></li>`).join('');
  // one balanced 3×3 grid; each card carries its group label
  $('#subjects').innerHTML = `<div class="subject-grid">${t('subjects.items').map(subjectCard).join('')}</div>`;
  $('#why').innerHTML = t('why.items').map((w, i) => `<article class="card reveal" ${delay(i % 3)}><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></article>`).join('');
  $('#reviews').innerHTML = t('reviews.items').map(reviewCard).join('');
  $('#reviewsLink').href = CONTACT.profileUrl;
  $('#reviewsLink').innerHTML = `${esc(t('reviews.source'))}<span class="sr-only"> ${esc(t('contact.newTab'))}</span>`;
  $('#faqList').innerHTML = t('faq.items').map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  renderFact();
}

function renderFact() {
  const facts = t('resources.facts');
  if (factOrder.length !== facts.length) { factOrder = facts.map((_, i) => i).sort(() => Math.random() - .5); factIdx = 0; }
  $('#fact').textContent = facts[factOrder[factIdx]];
}

export function nextFact() {
  const el = $('#fact');
  factIdx = (factIdx + 1) % factOrder.length;
  el.style.opacity = 0;
  setTimeout(() => { renderFact(); el.style.opacity = 1; }, 200);
}
