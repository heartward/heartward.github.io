// Read-aloud with the phone's own voice (Web Speech API). Free, no server, and on most phones it works offline.
import { state } from './store.js';
import { icon } from './icons.js';
import { esc, t } from './ui.js';

const synth = typeof window !== 'undefined' && window.speechSynthesis;
const hasSynth = !!synth && typeof SpeechSynthesisUtterance !== 'undefined';
// Persian needs a Persian voice on the phone; most phones have none, so Listen is hidden until one is found.
const SPEECH_LANG = { en: 'en-US', fa: 'fa-IR', es: 'es-ES' };
const appLang = () => state.settings.lang || 'en';
const voiceFor = lang => { const vs = synth.getVoices(), re = new RegExp('^' + lang + '(-|_|$)', 'i'), d = vs.find(v => v.default); return d && re.test(d.lang) ? d : (lang === 'en' ? null : vs.find(v => re.test(v.lang)) || null); };
export let canSpeak = hasSynth && (appLang() !== 'fa' || !!voiceFor('fa'));
if (hasSynth && synth.addEventListener) synth.addEventListener('voiceschanged', () => { const was = canSpeak; canSpeak = appLang() !== 'fa' || !!voiceFor('fa'); if (was !== canSpeak) document.dispatchEvent(new Event('heartward:render')); });
export const RATES = { slow: 0.75, normal: 0.95, fast: 1.15 };

let run = 0;        // each new reading gets a number; an older one stops when the number changes
let onStop = null;

// Use the phone's default voice when it is English. Picking another voice by hand can choose one that is
// listed but not downloaded, which on iPhone reads nothing. Otherwise only the language is set.
function voice(lang) { return voiceFor(lang); }

// On iPhone the silent switch mutes web audio. Asking for "playback" (Safari 17+) lets it play like a podcast.
function unmute() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
}

let warn = null;
function hint(show) {
  clearTimeout(warn);
  const old = document.getElementById('speak-hint'); if (old) old.remove();
  if (!show) return;
  const el = document.createElement('div');
  el.id = 'speak-hint'; el.className = 'toast'; el.setAttribute('role', 'status');
  el.textContent = t('No sound? Turn up the volume and turn off silent mode, then tap Listen again.');
  document.body.appendChild(el);
  warn = setTimeout(() => el.remove(), 7000);
}

export function stop() {
  run++;
  // Safari can drop the next reading if cancel() runs when nothing is playing.
  if (canSpeak && (synth.speaking || synth.pending)) synth.cancel();
  const f = onStop; onStop = null; if (f) f();
}

// Speaks a list of text pieces one after another. Short pieces avoid browsers cutting off long readings.
// gap(piece) returns a pause in ms after each piece (used to leave time to repeat a line).
export function speak(pieces, { gap = () => 250, onPiece, done, lang } = {}) {
  stop();
  if (!hasSynth) return;
  const L = lang || appLang();
  const id = run, list = pieces.map(s => String(s).trim()).filter(Boolean);
  onStop = done || null;
  unmute();
  hint(false);
  let i = 0, started = false;
  // If nothing has started after 2.5 seconds, the phone is probably muted.
  warn = setTimeout(() => { if (id === run && !started) hint(true); }, 2500);
  const next = () => {
    if (id !== run) return;
    if (i >= list.length) { const f = onStop; onStop = null; if (f) f(); return; }
    const k = i++, u = new SpeechSynthesisUtterance(list[k]);
    const v = voice(L); if (v) u.voice = v;
    u.lang = v ? v.lang : SPEECH_LANG[L] || 'en-US';
    u.onstart = () => { started = true; hint(false); };
    u.rate = RATES[state.settings.rate] || RATES.normal;
    u.onend = () => { if (id === run) setTimeout(next, gap(list[k])); };
    u.onerror = () => { if (id === run) setTimeout(next, 50); };
    if (onPiece) onPiece(k);
    if (synth.paused) synth.resume();
    synth.speak(u);
  };
  next();
}

// Splits long text into sentence-sized pieces.
export const sentences = text => (String(text).match(/[^.!?;:؟؛]+[.!?;:؟؛]*["')\]»]*\s*/g) || [text]).map(s => s.trim()).filter(Boolean);

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
