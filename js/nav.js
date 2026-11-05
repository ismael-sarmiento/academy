// Page navigation and motion: reveal on scroll, active menu item, home links, scroll progress and card spotlight.
import { $, $$, scrollBehavior, reducedMotion, isPhone } from './core/dom.js';

// ---------- reveal on scroll ----------
let revealObserver;
export function observeReveals() {
  revealObserver ??= new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal:not(.in)').forEach(el => revealObserver.observe(el));
}

// ---------- active menu item ----------
function initScrollSpy() {
  const links = $$('.sections a:not(.btn)');
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove('active'));
    const a = byId.get(e.target.id);
    if (!a) return;
    a.classList.add('active');
    // on phones the menu scrolls sideways: move only the menu, never the page
    const nav = a.parentElement;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));
}

// ---------- "home" links (logo, back to top) scroll up without leaving #hero in the address ----------
function initHomeLinks() {
  document.addEventListener('click', e => {
    if (!e.target.closest('a[href="#hero"]')) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    history.replaceState(history.state, '', location.pathname + location.search);
    $('.hero h1').focus({ preventScroll: true });
  });
}

// ---------- top bar: soft shadow once the page scrolls and a thin reading-progress line ----------
function initScrollProgress() {
  const bar = $('.topbar'), progress = $('#readProgress');
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.classList.toggle('scrolled', scrollY > 8);
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// ---------- cards: a faint light that follows the pointer (mouse only, never on touch or reduced motion) ----------
function initSpotlight() {
  if (reducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.addEventListener('pointermove', e => {
    const card = e.target.closest?.('.card, .contact-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

// ---------- phones: the assistant button steps aside over the booking form and while typing ----------
// so it never covers the send button, the code editor or sits on top of the keyboard
export function initFabTuck() {
  const fab = $('#assistantFab');
  if (!fab) return;
  let overForm = false, typing = false;
  const update = () => fab.classList.toggle('fab-tucked', isPhone() && (overForm || typing));
  new IntersectionObserver(([e]) => { overForm = e.isIntersecting; update(); }, { threshold: .15 }).observe($('#contacto'));
  document.addEventListener('focusin', e => {
    if (e.target.matches('input:not([type="checkbox"]), textarea, select') && !e.target.closest('#assistantPanel')) { typing = true; update(); }
  });
  document.addEventListener('focusout', () => { typing = false; update(); });
  addEventListener('resize', update, { passive: true });
}

export function initNav() {
  initScrollSpy();
  initHomeLinks();
  initScrollProgress();
  initSpotlight();
}
