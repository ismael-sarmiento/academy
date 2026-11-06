// IsAcademy's scene of the shared intro (/assets/ds/intro.js, which owns focus, keys, "Saltar intro", the safety net,
// reduced motion and the end): the calligraphic "Is" is sketched by hand, then an AI "decodes" the word Academy.
// Its exit is the opening with the two hands (js/opening.js).
import { sleep } from './core/dom.js';
import { exitAcademy } from './opening.js';

const GLYPHS = '01<>/{}#$%&@=+*ABCDEFXYZ';
const DASH = 3000;

function animate(duration, step, cancelled) {
  return new Promise(resolve => {
    const t0 = performance.now();
    function tick(now) {
      const p = cancelled() ? 1 : Math.min(1, (now - t0) / duration);
      step(p);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    }
    requestAnimationFrame(tick);
  });
}

const easeInOut = p => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

async function sketchIs(svg, cancelled) {
  const stroke = svg.querySelector('.is-stroke');
  const ink = svg.querySelector('#inkRect');
  const box = svg.querySelector('.is-fill').getBBox();
  stroke.style.strokeDasharray = String(DASH);
  // 1) the outline is sketched, 2) ink fills it from left to right
  await animate(1500, p => { stroke.style.strokeDashoffset = String(DASH * (1 - easeInOut(p))); }, cancelled);
  await animate(700, p => { ink.setAttribute('x', String(box.x - 20)); ink.setAttribute('width', String((box.width + 60) * easeInOut(p))); }, cancelled);
}

// The first letter of "Academy" is drawn larger (a capital that reads as a second word, not "Isa…")
function setAcademy(svg, str) {
  const text = svg.querySelector('.academy');
  const safe = c => c.replace(/[<>&]/g, '');
  text.innerHTML = str ? `<tspan class="big-a">${safe(str[0])}</tspan>${safe(str.slice(1))}` : '';
}

function placeCursor(svg) {
  const text = svg.querySelector('.academy');
  const x = Number(text.getAttribute('x')) + (text.textContent ? text.getComputedTextLength() : 0);
  svg.querySelector('.cursor').setAttribute('x', String(x + 28));
  // "by Ismael Sarmiento" ends exactly where "Academy" ends
  if (text.textContent === 'Academy') svg.querySelector('.by').setAttribute('x', String(x));
}

async function typeAcademy(svg, cancelled) {
  const word = 'Academy';
  // ~0.77 s, following the screen's own frames (one change per frame at most): the letters advance evenly, as in the
  // signature of Inicio and CV Online (/assets/ds/signature.js)
  await animate(768, p => {
    const i = Math.min(word.length, Math.floor(p * (word.length + 1)));
    const noise = Array.from({ length: Math.min(2, word.length - i) }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
    setAcademy(svg, word.slice(0, i) + noise);
    placeCursor(svg);
  }, cancelled);
  setAcademy(svg, word);
  placeCursor(svg);
}

function drawCircuit(root) {
  const dots = root.querySelectorAll('#circuit circle');
  root.querySelectorAll('#circuit path').forEach((path, i) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, delay: i * 120, fill: 'forwards', easing: 'ease-out' });
    // each node lights up when its trace arrives, never floating on its own
    dots[i]?.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }],
      { duration: 300, delay: i * 120 + 1150, fill: 'forwards', easing: 'ease-out' });
  });
}

// the logo written at once: "Saltar intro", Escape and reduced motion (the shared intro shows the hook and actions)
function complete(root) {
  const svg = root.querySelector('svg.logo');
  const stroke = svg.querySelector('.is-stroke');
  stroke.style.strokeDasharray = String(DASH); stroke.style.strokeDashoffset = '0';
  svg.querySelector('#inkRect').setAttribute('width', '1000');
  setAcademy(svg, 'Academy');
  placeCursor(svg);
  svg.querySelector('.by').style.opacity = 1;
  svg.querySelector('.cursor').style.visibility = 'hidden';
  root.querySelectorAll('#circuit path').forEach(p => { p.getAnimations().forEach(a => a.cancel()); p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
  root.querySelectorAll('#circuit circle').forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.style.opacity = 1; });
}

// on every visit (the shared intro gives reduced-motion visitors the written logo instead)
async function play(root, cancelled) {
  const svg = root.querySelector('svg.logo');
  // hide the circuit traces until they are drawn (before the first wait: they never show undrawn)
  root.querySelectorAll('#circuit path').forEach(p => { const len = p.getTotalLength(); p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len); });
  root.querySelectorAll('#circuit circle').forEach(c => { c.style.opacity = 0; c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center'; });
  await document.fonts.ready;
  if (cancelled()) return;
  await sleep(250);
  if (cancelled()) return;
  await sketchIs(svg, cancelled);
  if (cancelled()) return;
  drawCircuit(root);
  await typeAcademy(svg, cancelled);
  if (cancelled()) return;
  await animate(500, p => { svg.querySelector('.by').style.opacity = p; }, cancelled);
  svg.querySelector('.cursor').style.visibility = 'hidden';   // the caret goes out once the word is written
}

export const academyScene = { play, complete, exit: exitAcademy, handoff: false };
