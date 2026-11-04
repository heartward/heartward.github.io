// Loads bundled content. Content files live in content/<lang>/; English is the base and other languages overlay it.
export const data = {};
const FILES = ['sessions', 'prayers', 'faq', 'guides', 'glossary', 'saints', 'calendar', 'paths'];
const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });

export async function loadData() {
  const [base, es, parish] = await Promise.all([
    Promise.all(FILES.map(f => get('content/en/' + f + '.json'))),
    get('content/es/prayers.json').catch(() => []),
    get('content/parish.json').catch(() => ({}))
  ]);
  FILES.forEach((f, i) => { data[f] = base[i]; });
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

export const byId = (list, id) => list.find(x => x.id === id) || null;
