import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = (await readFile(new URL('../../js/lessons.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replaceAll('export ', '');
const dictionaries = {};
for (const lang of ['es', 'en']) dictionaries[lang] = JSON.parse(await readFile(new URL(`../../i18n/${lang}.json`, import.meta.url), 'utf8'));

function fixture({ reduced = false } = {}) {
  let now = 0, serial = 0, lang = 'es', motion = reduced;
  const timers = new Map(), mediaListeners = [];
  const doc = { hidden: false, activeElement: null };
  class Element {
    constructor(id) { this.id = id; this.children = []; this.attrs = {}; this.events = {}; this.style = {}; this.dataset = {}; this.hidden = true; this._html = ''; this.textContent = ''; this.hovered = false; this.scrollWidth = 500; this.clientWidth = 300; this.offsetLeft = 0; }
    set innerHTML(value) {
      this._html = value;
      if (this.id === 'codeTabs') this.children = [...value.matchAll(/data-lesson="(\d+)"/g)].map(m => {
        const b = new Element(`lesson-tab-${m[1]}`); b.dataset.lesson = m[1]; b.offsetLeft = Number(m[1]) * 100; return b;
      });
    }
    get innerHTML() { return this._html; }
    setAttribute(name, value) { this.attrs[name] = value; }
    addEventListener(name, fn) { (this.events[name] ??= []).push(fn); }
    emit(name, event) { for (const fn of this.events[name] || []) fn(event); }
    closest() { return this.dataset.lesson === undefined ? null : this; }
    focus() { doc.activeElement = this; }
    matches() { return this.hovered || doc.activeElement === this || this.children.includes(doc.activeElement); }
    scrollTo(options) { this.scroll = options; }
  }
  const nodes = Object.fromEntries(['codeTabs', 'heroCode', 'heroNote', 'lessonsToggle'].map(id => [id, new Element(id)]));
  const setTimer = (fn, delay) => { const id = ++serial; timers.set(id, { fn, due: now + delay }); return id; };
  const api = runInNewContext(source + '\n({startLessons, refreshLessons})', {
    $: selector => nodes[selector.slice(1)],
    esc: s => s,
    sleep: delay => new Promise(resolve => setTimer(resolve, delay)),
    reducedMotion: () => motion,
    highlight: code => code,
    langOf: tab => tab.endsWith('.sql') ? 'sql' : 'python',
    t: path => path.split('.').reduce((value, key) => value[key], dictionaries[lang]),
    setTimeout: setTimer, clearTimeout: id => timers.delete(id), document: doc,
    matchMedia: () => ({ addEventListener: (name, fn) => { assert.equal(name, 'change'); mediaListeners.push(fn); } }),
  });
  async function advance(ms) {
    const end = now + ms;
    for (let limit = 0; ; limit++) {
      assert.ok(limit < 10000, 'timer queue must remain bounded');
      const next = [...timers].filter(([, task]) => task.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      now = next[1].due; timers.delete(next[0]); next[1].fn();
      await new Promise(resolve => setImmediate(resolve));
    }
    now = end;
  }
  return {
    api, nodes, doc, timers, advance,
    selected: () => nodes.codeTabs.children.findIndex(b => b.attrs['aria-selected'] === 'true'),
    code: i => dictionaries[lang].hero.lessons[i].code,
    note: i => dictionaries[lang].hero.lessons[i].note,
    toggle: () => { nodes.lessonsToggle.focus(); nodes.lessonsToggle.emit('click', {}); },
    tab: i => { const b = nodes.codeTabs.children[i]; b.focus(); nodes.codeTabs.emit('click', { target: b }); },
    key: key => { let prevented = false; nodes.codeTabs.emit('keydown', { key, preventDefault: () => { prevented = true; } }); return prevented; },
    language: value => { lang = value; api.refreshLessons(); },
    motion: value => { motion = value; for (const fn of mediaListeners) fn({ matches: value }); },
  };
}

test('initial example finishes typing before its six-second reading interval', async () => {
  const h = fixture(); h.api.startLessons();
  const duration = (Math.floor(h.code(0).length / 2) + 1) * 22;
  await h.advance(duration); assert.ok(h.nodes.heroCode.innerHTML.startsWith(h.code(0)));
  await h.advance(5999); assert.equal(h.selected(), 0);
  await h.advance(1); assert.equal(h.selected(), 1);
});

test('pause during typing completes code and note; no delayed timer restarts it', async () => {
  const h = fixture(); h.api.startLessons(); await h.advance(22); h.toggle();
  assert.equal(h.nodes.heroCode.innerHTML, h.code(0));
  assert.equal(h.nodes.heroNote.textContent, h.note(0));
  assert.equal(h.nodes.lessonsToggle.textContent, 'Reanudar ejemplos');
  await h.advance(60000); assert.equal(h.selected(), 0); assert.equal(h.timers.size, 0);
});

test('resume keeps the completed example and allows rotation with focus on its control', async () => {
  const h = fixture(); h.api.startLessons(); h.toggle(); await h.advance(100); h.toggle();
  assert.ok(h.nodes.heroCode.innerHTML.startsWith(h.code(0)));
  assert.equal(h.doc.activeElement, h.nodes.lessonsToggle);
  await h.advance(5999); assert.equal(h.selected(), 0);
  await h.advance(1); assert.equal(h.selected(), 1);
});

test('manual selection remains fixed after pointer and focus leave the card', async () => {
  const h = fixture(); h.api.startLessons(); h.tab(4); h.doc.activeElement = null;
  assert.equal(h.nodes.heroCode.innerHTML, h.code(4));
  await h.advance(60000); assert.equal(h.selected(), 4);
  assert.equal(h.nodes.lessonsToggle.textContent, 'Reanudar ejemplos');
});

test('arrows select and pause, wrap at both ends, retain focus and prevent page scrolling', async () => {
  const h = fixture(); h.api.startLessons();
  assert.equal(h.key('ArrowLeft'), true); assert.equal(h.selected(), 4);
  assert.equal(h.doc.activeElement, h.nodes.codeTabs.children[4]);
  assert.equal(h.key('ArrowRight'), true); assert.equal(h.selected(), 0);
  assert.equal(h.key('Tab'), false);
  await h.advance(30000); assert.equal(h.selected(), 0);
});

test('language changes preserve paused selection, tab identity and keyboard focus', async () => {
  const h = fixture(); h.api.startLessons(); h.tab(2);
  const focused = h.doc.activeElement;
  h.language('en');
  assert.equal(h.selected(), 2); assert.equal(h.doc.activeElement, focused);
  assert.equal(focused.textContent, 'which_model.py');
  assert.equal(h.nodes.heroCode.innerHTML, h.code(2));
  assert.equal(h.nodes.lessonsToggle.textContent, 'Resume examples');
  h.language('es'); await h.advance(30000); assert.equal(h.selected(), 2);
});

test('language changes preserve automatic rotation and translate its control', async () => {
  const h = fixture(); h.api.startLessons(); h.language('en');
  assert.equal(h.nodes.lessonsToggle.textContent, 'Pause examples');
  await h.advance(6000); assert.equal(h.selected(), 1);
});

test('reduced motion starts static with no caret or smooth tab scrolling; explicit resume rotates without typing', async () => {
  const h = fixture({ reduced: true }); h.api.startLessons();
  assert.equal(h.nodes.heroCode.innerHTML, h.code(0));
  assert.equal(h.nodes.codeTabs.scroll.behavior, 'auto');
  await h.advance(30000); assert.equal(h.selected(), 0);
  h.toggle(); await h.advance(6000); assert.equal(h.selected(), 1);
  assert.equal(h.nodes.heroCode.innerHTML, h.code(1));
});

test('enabling reduced motion stops an active animation; disabling it never silently resumes', async () => {
  const h = fixture(); h.api.startLessons(); await h.advance(22); h.motion(true);
  assert.equal(h.nodes.heroCode.innerHTML, h.code(0));
  h.motion(false); await h.advance(60000); assert.equal(h.selected(), 0);
  assert.equal(h.nodes.lessonsToggle.textContent, 'Reanudar ejemplos');
});

test('quick selection invalidates pending note and typing updates from previous examples', async () => {
  const h = fixture(); h.api.startLessons(); await h.advance(22); h.tab(1); h.tab(4);
  await h.advance(60000);
  assert.equal(h.nodes.heroCode.innerHTML, h.code(4)); assert.equal(h.nodes.heroNote.textContent, h.note(4));
});

test('reading code, focused tabs and hidden documents postpone automatic rotation', async () => {
  for (const blocker of ['hover', 'focus', 'hidden']) {
    const h = fixture({ reduced: true }); h.api.startLessons(); h.toggle();
    if (blocker === 'hover') h.nodes.heroCode.hovered = true;
    if (blocker === 'focus') h.nodes.codeTabs.children[0].focus();
    if (blocker === 'hidden') h.doc.hidden = true;
    await h.advance(12000); assert.equal(h.selected(), 0, blocker);
    h.nodes.heroCode.hovered = false; h.doc.activeElement = null; h.doc.hidden = false;
    await h.advance(6000); assert.equal(h.selected(), 1, blocker);
  }
});

test('starting twice installs only one control listener and one motion listener', async () => {
  const h = fixture(); h.api.startLessons(); h.api.startLessons(); h.toggle();
  assert.equal(h.nodes.lessonsToggle.events.click.length, 1);
  assert.equal(h.nodes.lessonsToggle.hidden, false);
  h.motion(true); assert.equal(h.nodes.lessonsToggle.textContent, 'Reanudar ejemplos');
  await h.advance(30000); assert.equal(h.selected(), 0); assert.equal(h.timers.size, 0);
});
