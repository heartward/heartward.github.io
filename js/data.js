import { state } from './store.js';
// Loads bundled content. Content files live in content/<lang>/; English is the base and other languages overlay it.
export const data = {};
const FILES = ['sessions', 'prayers', 'faq', 'guides', 'glossary', 'saints', 'calendar', 'paths', 'study', 'extras', 'feasts', 'more', 'bible', 'scripture', 'year', 'books'];
const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });

// Translations (content/fa/<file>.json) map each English text to its translation. Any text without one
// (for example something added to the English files later) simply shows in English.
// Fields that hold ids, links or codes are never translated.
const KEEP = new Set(['id', 'url', 'stage', 'status', 'prayers', 'color', 'date', 'feast', 'byWeekday', 'posture', 'tags', 'program', 'answer']);
function overlay(x, map, key) {
  if (typeof x === 'string') return KEEP.has(key) ? x : (map[x] || x);
  if (Array.isArray(x)) return x.map(v => overlay(v, map, key));
  if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x)) o[k] = overlay(x[k], map, KEEP.has(key) ? key : k); return o; }
  return x;
}

export async function loadData() {
  const lang = state.settings.lang;
  const tr = lang === 'fa' ? FILES.map(f => get('content/fa/' + f + '.json').catch(() => ({}))) : [];
  const [base, es, parish, maps] = await Promise.all([
    Promise.all(FILES.map(f => get('content/en/' + f + '.json'))),
    get('content/es/prayers.json').catch(() => []),
    get('content/parish.json').catch(() => ({})),
    Promise.all(tr)
  ]);
  data.prayersEn = Object.fromEntries(base[FILES.indexOf('prayers')].map(p => [p.id, p]));
  FILES.forEach((f, i) => { data[f] = maps[i] ? overlay(base[i], maps[i], null) : base[i]; });
  data.stages = data.sessions.stages;
  data.sessionList = applyParishOrder(data.sessions.sessions, parish);
  data.prayersEs = Object.fromEntries(es.map(p => [p.id, p]));
  data.parish = parish || {};
  return data;
}

// A parish can reorder or hide sessions by listing ids in content/parish.json ("order": [...]).
function applyParishOrder(list, parish) {
  if (!parish || !Array.isArray(parish.order) || !parish.order.length) return list;
  const byId = Object.fromEntries(list.map(s => [s.id, s]));
  return parish.order.map(id => byId[id]).filter(Boolean);
}

// The chosen patron: either a saint with a page in the app (its id), or any saint from the calendar ('cal:MM-DD|Name').
export function mySaint() {
  const v = state.saint;
  if (!v) return null;
  if (v.startsWith('cal:')) { const [feast, name] = v.slice(4).split('|'); return { id: null, name, feast }; }
  const s = byId(data.saints.saints, v);
  return s ? { id: s.id, name: s.name, feast: s.feast } : null;
}

export const byId = (list, id) => list.find(x => x.id === id) || null;
