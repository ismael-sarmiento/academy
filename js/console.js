// Educational Python runs in a terminable browser Worker; the editor and UI remain on this thread.
import { $ } from './core/dom.js';
import { t } from './i18n.js';
import { startDebug, exitDebug, initDebugger } from './debugger.js';
import { createPythonRuntime } from './core/python-runtime.js';

let running = false, outputStarted = false, notice = null;

function out(text, cls = '') {
  const pre = $('#pyOut'), span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = text;
  pre.appendChild(span);
  pre.scrollTop = pre.scrollHeight;
  return span;
}

function clearOutput() { $('#pyOut').textContent = ''; notice = null; }
function showNotice(key, cls = '', append = false) {
  if (!append) clearOutput();
  else if ($('#pyOut').textContent && !$('#pyOut').textContent.endsWith('\n')) out('\n');
  notice = { key, node: out(t(key) + '\n', cls) };
}
function programOutput(text, cls) {
  if (!outputStarted) { clearOutput(); outputStarted = true; }
  out(text, cls);
}

const runtime = createPythonRuntime({
  onOutput: programOutput,
  onPhase: phase => {
    if (!running || outputStarted) return;
    if (phase === 'preparing') showNotice('console.preparing');
    if (phase === 'executing') showNotice('console.running');
  },
});

function busy(on) {
  const previous = document.activeElement;
  const stop = $('[data-action="console-stop"]');
  const wasAction = previous?.matches('[data-action="console-run"], [data-action="console-debug"]');
  running = on;
  ['console-run', 'console-debug', 'console-reset'].forEach(action => {
    const button = $(`[data-action="${action}"]`);
    button.disabled = on;
  });
  $('#samples').querySelectorAll('button').forEach(button => { button.disabled = on; });
  stop.disabled = !on;
  $('#consoleBody').setAttribute('aria-busy', String(on));
  if (on && wasAction) stop.focus({ preventScroll: true });
  if (!on && previous === stop) $('[data-action="console-run"]').focus({ preventScroll: true });
}

function problem(error) {
  const messages = {
    stopped: 'console.stopped', timeout: 'console.timeout', outputLimit: 'console.outputLimit',
    codeLimit: 'console.codeLimit', unsupported: 'console.unsupported', load: 'console.error', runtime: 'console.error',
  };
  if (error.kind === 'python') {
    if (!outputStarted) clearOutput();
    out(error.message + '\n', 'err');
    outputStarted = true;
  } else {
    showNotice(messages[error.kind] || 'console.error', error.kind === 'stopped' ? '' : 'err', outputStarted);
  }
  $('#pyOut').dataset.state = 'error';
}

export function renderSamples() {
  const box = $('#samples');
  if (!box) return;
  if (notice?.node.isConnected) notice.node.textContent = t(notice.key) + '\n';
  box.replaceChildren();
  t('console.samples').forEach((sample, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = sample.name; button.dataset.sample = String(i);
    button.disabled = running;
    box.appendChild(button);
  });
}

function loadSample(i) {
  if (running) return;
  $('#pyEditor').value = t('console.samples')[i].code;
  $('#pyEditor').focus();
}

export async function openConsole() {
  const body = $('#consoleBody');
  if (!body.hidden) { $('#pyEditor').focus(); return; }
  body.hidden = false;
  $('[data-action="console-open"]').hidden = true;
  renderSamples();
  if (!$('#pyEditor').value) loadSample(0);
  outputStarted = false;
  busy(true);
  showNotice('console.loading');
  try {
    await runtime.ready();
    showNotice('console.ready');
    $('#pyOut').dataset.state = 'ready';
  } catch (error) { problem(error); }
  finally { busy(false); }
}

async function execute(debug) {
  if (running) return;
  const code = $('#pyEditor').value;
  outputStarted = false;
  clearOutput();
  busy(true);
  $('#pyOut').dataset.state = 'run';
  try {
    if (debug) {
      const result = await runtime.debug(code);
      clearOutput();
      startDebug(result, code);
    } else {
      await runtime.run(code);
      if (!outputStarted) showNotice('console.done');
    }
    $('#pyOut').dataset.state = 'done';
  } catch (error) { problem(error); }
  finally { busy(false); }
}

export const runCode = () => execute(false);
export const debugCode = () => execute(true);
export function stopCode() { if (running) runtime.stop(); }

export function initConsole() {
  initDebugger();
  addEventListener('pagehide', event => { if (!event.persisted) runtime.dispose(); });
  document.addEventListener('click', e => {
    const s = e.target.closest('[data-sample]');
    if (s) loadSample(Number(s.dataset.sample));
  });
  const ed = $('#pyEditor');
  ed.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runCode(); return; }
    // Tab indents inside the editor; Escape gives keyboard users a way out
    if (e.key === 'Escape') { $('[data-action="console-run"]').focus(); return; }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: a, selectionEnd: b, value } = ed;
      ed.value = value.slice(0, a) + '    ' + value.slice(b);
      ed.selectionStart = ed.selectionEnd = a + 4;
    }
  });
}

export function resetConsole() {
  if (running) return;
  exitDebug();
  $('#pyEditor').value = '';
  loadSample(0);
  outputStarted = false;
  showNotice('console.ready');
  $('#pyOut').dataset.state = 'ready';
}
