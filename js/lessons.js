// Hero mini-lessons: automatic examples with an explicit, persistent reading pause.
import { $, esc, sleep, reducedMotion } from './core/dom.js';
import { highlight, langOf } from './core/highlight.js';
import { t } from './i18n.js';

const ROTATE_MS = 6000;
let index = 0, typingToken = 0, rotateTimer = null, noteTimer = null, started = false;
let automatic = true;
const lessons = () => t('hero.lessons');

function renderTabs() {
  const box = $('#codeTabs');
  if (box.children.length !== lessons().length) {
    box.innerHTML = lessons().map((l, i) => `<button type="button" role="tab" id="lesson-tab-${i}" aria-controls="heroCode" data-lesson="${i}">${esc(l.tab)}</button>`).join('');
  }
  // only flip the selected state: rebuilding would drop keyboard focus
  [...box.children].forEach((b, i) => {
    b.textContent = lessons()[i].tab;
    b.setAttribute('aria-selected', String(i === index));
    b.tabIndex = i === index ? 0 : -1;
  });
  $('#heroCode').setAttribute('aria-labelledby', `lesson-tab-${index}`);
  // keep the active tab visible by scrolling the tab strip only (never the page)
  const active = box.children[index];
  if (active && box.scrollWidth > box.clientWidth) box.scrollTo({ left: active.offsetLeft - box.offsetLeft - 8, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

function renderControl() {
  const button = $('#lessonsToggle');
  button.textContent = t(automatic ? 'hero.lessonsPause' : 'hero.lessonsResume');
  button.hidden = false;
}

function pause() {
  automatic = false;
  show(index, false);
}

function select(i) {
  automatic = false;
  show(i, false);
}

async function show(i, typed = true) {
  clearTimeout(rotateTimer);
  clearTimeout(noteTimer);
  index = i;
  const token = ++typingToken;
  const lesson = lessons()[i];
  const lang = langOf(lesson.tab);
  renderTabs();
  renderControl();
  const note = $('#heroNote');
  const updateNote = () => {
    if (token !== typingToken) return;
    note.textContent = lesson.note;
    note.style.opacity = 1;
  };
  if (typed && !reducedMotion()) {
    note.style.opacity = 0;
    noteTimer = setTimeout(updateNote, 250);
  } else updateNote();
  const pre = $('#heroCode');
  const caret = automatic && !reducedMotion() ? '<span class="caret" aria-hidden="true"></span>' : '';
  if (typed && !reducedMotion()) {
    for (let n = 0; n <= lesson.code.length; n += 2) {
      if (token !== typingToken) return;
      pre.innerHTML = highlight(lesson.code.slice(0, n), lang) + caret;
      await sleep(22);
    }
  }
  if (token !== typingToken) return;
  pre.innerHTML = highlight(lesson.code, lang) + caret;
  scheduleRotation();
}

function scheduleRotation() {
  clearTimeout(rotateTimer);
  if (!automatic) return;
  rotateTimer = setTimeout(() => {
    // Reading the tabs/code postpones rotation; the explicit resume control must remain usable with focus.
    if ($('#codeTabs').matches(':hover, :focus-within') || $('#heroCode').matches(':hover, :focus-within') || document.hidden) { scheduleRotation(); return; }
    show((index + 1) % lessons().length);
  }, ROTATE_MS);
}

export function startLessons() {
  if (started) return;
  started = true;
  automatic = !reducedMotion();
  const tabs = $('#codeTabs');
  tabs.addEventListener('click', e => {
    const b = e.target.closest('[data-lesson]');
    if (b) select(Number(b.dataset.lesson));
  });
  tabs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = lessons().length;
    select((index + (e.key === 'ArrowRight' ? 1 : n - 1)) % n);
    tabs.children[index].focus({ preventScroll: true });
  });
  $('#lessonsToggle').addEventListener('click', () => {
    if (automatic) pause();
    else {
      automatic = true;
      show(index, false);
    }
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    if (e.matches) pause();
  });
  show(0, automatic);
}

// language change: same lesson, new texts, no typing animation
export function refreshLessons() {
  if (!started) return;
  show(index, false);
}
