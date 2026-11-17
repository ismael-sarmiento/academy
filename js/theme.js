// Light / dark theme: follows the OS by default, a manual choice is remembered; the tab icon follows it
// (/assets/ds/favicon.js, shared with every site).
import { syncFavicon } from '/assets/ds/favicon.js';

const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = [];

function stored() { try { return localStorage.getItem('isa-theme'); } catch { return null; } }
function store(v) { try { localStorage.setItem('isa-theme', v); } catch { /* storage unavailable */ } }
function forget() { try { localStorage.removeItem('isa-theme'); } catch { /* storage unavailable */ } }

export function isDark() {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === 'dark' : media.matches;
}

export function onThemeChange(fn) { listeners.push(fn); }
function notify() { syncFavicon(); listeners.forEach(fn => fn(isDark())); }

// A choice made on another site of the universe (another tab) is applied here too.
function applyTheme(choice) {
  if (choice === 'light' || choice === 'dark') document.documentElement.dataset.theme = choice;
  else delete document.documentElement.dataset.theme;
  notify();
}

export function initTheme() {
  const s = stored();
  if (s === 'light' || s === 'dark') document.documentElement.dataset.theme = s;
  syncFavicon();
  media.addEventListener('change', notify);
  addEventListener('storage', e => { if (e.key === 'isa-theme' || e.key === null) applyTheme(stored()); });
}

// The button shows the opposite of what is on screen. Choosing the system's own scheme forgets the choice, so the
// site follows the system again; any other choice is remembered, even if the system later changes to match it
// (Modern Web Guidance, dark-mode-toggle).
export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  const system = media.matches ? 'dark' : 'light';
  if (next === system) forget(); else store(next);
  applyTheme(next === system ? null : next);
}
