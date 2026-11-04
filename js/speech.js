// Read-aloud with the phone's own voice (Web Speech API). Free, no server, and on most phones it works offline.
import { state } from './store.js';
import { icon } from './icons.js';
import { esc, t } from './ui.js';

const synth = typeof window !== 'undefined' && window.speechSynthesis;
export const canSpeak = !!synth && typeof SpeechSynthesisUtterance !== 'undefined';
export const RATES = { slow: 0.75, normal: 0.95, fast: 1.15 };

let run = 0;        // each new reading gets a number; an older one stops when the number changes
let onStop = null;

function voice() {
  const vs = synth.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  return vs.find(v => v.localService && /en-(US|CA|GB)/i.test(v.lang)) || vs.find(v => v.localService) || vs[0] || null;
}

export function stop() {
  run++;
  if (canSpeak) synth.cancel();
  const f = onStop; onStop = null; if (f) f();
}

// Speaks a list of text pieces one after another. Short pieces avoid browsers cutting off long readings.
// gap(piece) returns a pause in ms after each piece (used to leave time to repeat a line).
export function speak(pieces, { gap = () => 250, onPiece, done } = {}) {
  stop();
  if (!canSpeak) return;
  const id = run, list = pieces.map(s => String(s).trim()).filter(Boolean);
  onStop = done || null;
  let i = 0;
  const next = () => {
    if (id !== run) return;
    if (i >= list.length) { const f = onStop; onStop = null; if (f) f(); return; }
    const k = i++, u = new SpeechSynthesisUtterance(list[k]);
    const v = voice(); if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.rate = RATES[state.settings.rate] || RATES.normal;
    u.onend = () => { if (id === run) setTimeout(next, gap(list[k])); };
    u.onerror = () => { if (id === run) setTimeout(next, 50); };
    if (onPiece) onPiece(k);
    synth.speak(u);
  };
  next();
}

// Splits long text into sentence-sized pieces.
export const sentences = text => (String(text).match(/[^.!?;:]+[.!?;:]*["')\]]*\s*/g) || [text]).map(s => s.trim()).filter(Boolean);

// A Listen button that becomes Stop while it plays. getPieces runs on tap, so it reads the page as it is then.
export function listenButton(id, label, cls = 'soft') {
  if (!canSpeak) return '';
  return '<button class="btn ' + cls + ' listen" id="' + id + '" data-label="' + esc(label) + '">' + icon('volume') + '<span>' + esc(label) + '</span></button>';
}

export function bindListen(root, id, getPieces, opts = {}) {
  const b = root.querySelector('#' + id);
  if (!b) return;
  const idle = () => { b.classList.remove('on'); b.innerHTML = icon('volume') + '<span>' + esc(b.dataset.label) + '</span>'; };
  b.onclick = () => {
    if (b.classList.contains('on')) { stop(); return; }
    root.querySelectorAll('.listen.on').forEach(x => x !== b && x.click());
    speak(getPieces(), Object.assign({}, opts, { done: idle }));
    b.classList.add('on'); b.innerHTML = icon('stop') + '<span>' + esc(t('Stop')) + '</span>';
  };
}
