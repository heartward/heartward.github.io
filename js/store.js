// All personal data lives in this browser only (localStorage). Nothing is ever sent anywhere.
const KEY = 'heartward:v1';
// Spanish is switched off for now (the app is English only). Set to true to bring the language option back;
// the translations stay in js/i18n-es.js and content/es/.
export const SPANISH = false;

const defaults = () => ({
  done: {},          // sessionId -> 'YYYY-MM-DD'
  learned: {},       // prayerId -> true
  journal: {},       // sessionId -> { notes, questions, updated }
  habits: {},        // weekKey -> { habitId: true }
  firstYear: {},     // monthId -> true
  welcomeBack: {},   // stepId -> true
  involved: {},      // ministryId -> true
  dates: {},         // baptism, confirmation, communion, reception -> 'YYYY-MM-DD'
  saint: '',         // chosen patron saint id
  friends: [],       // { name, role, phone, email }
  parish: { name: '', meets: '' },
  settings: { theme: 'system', size: 'normal', lang: 'en', reminder: '08:00' },
  updated: null
});

function merge(base, obj) {
  const out = defaults();
  for (const k of Object.keys(out)) if (obj && obj[k] !== undefined) out[k] = obj[k];
  out.settings = Object.assign(defaults().settings, obj && obj.settings);
  out.parish = Object.assign(defaults().parish, obj && obj.parish);
  if (!SPANISH) out.settings.lang = 'en';
  return out;
}

export let state = load();

function load() {
  try { return merge(defaults(), JSON.parse(localStorage.getItem(KEY) || 'null')); }
  catch (e) { return defaults(); }
}

export function save() {
  state.updated = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable (private mode) */ }
}

export function replaceState(obj) { state = merge(defaults(), obj); save(); }

export function today() { return localISO(new Date()); }
export function localISO(d) {
  const z = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
}
// Week key: the Sunday that starts the week, so habits line up with Sunday Mass.
export function weekKey(d = new Date()) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  return localISO(s);
}
