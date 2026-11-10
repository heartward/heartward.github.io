// Bible study: a short guide, one simple method (Read, Understand, Pray, Live), and reading plans
// that light up like the road. Passages are bundled in the Douay-Rheims (public domain) so they work offline;
// each study also links to the NRSV, the translation of the Canadian Lectionary used at Mass in Canada.
import { data } from '../data.js';
import { state, save, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, acc, fmtDate, safeUrl } from '../ui.js';
import { figure } from '../figures.js';
import { sessionNo } from './journey.js';
import { currentSession, nextSunday, readingsUrl } from './week.js';
import { listenButton, bindListen, sentences } from '../speech.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const B = () => data.bible;
const ext = (href, label, cls = 'soft sm') => '<a class="btn ' + cls + '" href="' + esc(safeUrl(href)) + '" target="_blank" rel="noopener">' + esc(label) + icon('external') + '</a>';
export const nrsvUrl = ref => 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ref) + '&version=NRSVCE';
export const PLAN_IDS = ['rcia', 'mark', 'story'];

// Every study as one shape: { id, plan, ref, title, intro, understand, ccc, questions, live, session? }.
function rciaStudies() {
  return data.sessionList.filter(s => (data.study.sessions[s.id] || {}).bible).map(s => {
    const b = data.study.sessions[s.id].bible, x = B().studies[s.id] || {};
    return { id: s.id, plan: 'rcia', session: s, ref: b.ref, title: s.title, intro: b.intro, questions: b.questions, understand: x.understand, ccc: x.ccc, live: x.live };
  });
}
export function planStudies(planId) {
  if (planId === 'rcia') return rciaStudies();
  const p = B().plans[planId];
  return p ? p.days.map(d => ({ ...d, plan: planId })) : [];
}
export const allStudies = () => PLAN_IDS.flatMap(planStudies);
const findStudy = id => allStudies().find(s => s.id === id) || null;
const doneCount = list => list.filter(s => state.bible[s.id]).length;
const nextIn = list => list.find(s => !state.bible[s.id]) || null;
const notesOf = id => (state.study[id] || {}).notes || '';
const label = s => s.plan === 'rcia' ? t('Session') + ' ' + sessionNo(s.session) : t('Day') + ' ' + (planStudies(s.plan).indexOf(s) + 1);
const planCard = (id, extra) => {
  const p = B().plans[id], list = planStudies(id), n = doneCount(list), pct = list.length ? Math.round(n / list.length * 100) : 0;
  return '<a class="card plan-card" href="#/bible-plan/' + id + '"><span class="eyebrow">' + esc(p.sub) + '</span><h3>' + esc(p.title) + '</h3>' +
    (extra ? '<span class="small muted">' + esc(extra) + '</span>' : '') +
    '<span class="plan-bar" role="img" aria-label="' + n + ' / ' + list.length + '"><span style="width:' + pct + '%"></span></span>' +
    '<span class="small muted">' + n + ' / ' + list.length + ' ' + esc(t('done')) + '</span><span class="chev">' + icon('chevron') + '</span></a>';
};

// ---------- Hub ----------
export function hub() {
  const cur = currentSession(), rcia = rciaStudies();
  const forWeek = rcia.find(s => s.id === cur.id) || nextIn(rcia);
  const anyNotes = allStudies().some(s => notesOf(s.id).trim());
  let html = back('#/learn', t('Learn')) + head(t('Learn'), t('Bible study'), B().intro);

  if (forWeek) html += '<a class="card week-card" href="#/bible/' + forWeek.id + '"><span class="eyebrow">' + esc(t('This week\'s passage')) + ' · ' + esc(label(forWeek)) + '</span>' +
    '<span class="wk-verse">' + esc(forWeek.ref) + '</span><span class="muted small">' + esc(forWeek.intro) + '</span>' +
    (state.bible[forWeek.id] ? ' <span class="tag gold">' + esc(t('done')) + '</span>' : '') + '<span class="chev">' + icon('chevron') + '</span></a>';

  html += '<div class="tiles">' +
    '<a class="tile wide" href="#/bible-guide"><span class="ti">' + icon('sparkle') + '</span><span><span class="tt">' + esc(t('Start here')) + '</span><br><span class="ts">' + esc(t('How the Bible works and how Catholics read it. Five minutes.')) + '</span></span></a></div>';

  html += '<div class="section-title"><h2>' + esc(t('Four steps in every study')) + '</h2></div><ol class="steps4">' +
    B().method.map((m, i) => '<li><span class="n">' + (i + 1) + '</span><span><strong>' + esc(m.name) + '</strong><span class="small muted"> ' + esc(m.about) + '</span></span></li>').join('') + '</ol>';

  html += '<div class="section-title"><h2>' + esc(t('Reading plans')) + '</h2></div>' +
    yearCard() + planCard('rcia', t('Session') + ' ' + sessionNo(cur) + ': ' + cur.title) + planCard('mark') + planCard('story');

  html += '<div class="section-title"><h2>' + esc(t('Get ready for Sunday')) + '</h2></div><ul class="list card tight">' +
    '<li><a class="row" href="#/lectio"><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title">' + esc(t('Sunday Gospel with Lectio Divina')) + '</span><span class="sub">' + esc(fmtDate(nextSunday())) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' +
    '<li><a class="row" href="' + esc(readingsUrl(nextSunday())) + '" target="_blank" rel="noopener"><span class="lead">' + icon('church') + '</span><span class="grow"><span class="title">' + esc(t('Sunday\'s readings for Canada')) + '</span><span class="sub">' + esc(t('From the Canadian Lectionary, on Living with Christ')) + '</span></span><span class="chev">' + icon('external') + '</span></a></li></ul>';

  html += '<div class="section-title"><h2>' + esc(t('The whole Bible')) + '</h2></div><ul class="list card tight">' +
    '<li><a class="row" href="#/bible-books"><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title">' + esc(t('All 73 books')) + '</span><span class="sub">' + esc(t('A guide to every book, and the full text to read chapter by chapter')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li></ul>';

  html += '<div class="section-title"><h2>' + esc(t('Mine')) + '</h2></div><ul class="list card tight">' +
    '<li><a class="row" href="#/bible-notes"><span class="lead">' + icon('list') + '</span><span class="grow"><span class="title">' + esc(t('My Bible notes')) + '</span><span class="sub">' + esc(anyNotes ? t('Everything you wrote, in one place') : t('Your notes from each study will gather here')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' +
    '<li><a class="row" href="#/verse"><span class="lead">' + icon('sparkle') + '</span><span class="grow"><span class="title">' + esc(t('Memory verses')) + '</span><span class="sub">' + esc(t('Flashcards with audio')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li></ul>';
  return { html, title: t('Bible study') };
}

// ---------- Start here ----------
export function guide() {
  const G = B().guide;
  let html = back('#/bible', t('Bible study')) + head(t('Bible study'), t('Start here'), t('Six short pages on the Bible: what it is, how to find your way around it, and how Catholics read it.')) +
    '<div class="card tight">' + G.map((g, i) => acc(g.title, (g.figure ? '<figure class="figure">' + figure(g.figure) + '</figure>' : '') + g.body.map(p => '<p>' + esc(p) + '</p>').join(''), i === 0)).join('') + '</div>' +
    '<section class="card verse-card"><div class="eyebrow">' + esc(t('A prayer before you read')) + '</div><blockquote class="verse small-verse">' + esc(B().prayer) + '</blockquote></section>' +
    '<div class="btn-row"><a class="btn" href="#/bible-plan/rcia">' + esc(t('Begin with My RCIA road')) + icon('chevron') + '</a></div>';
  return { html, title: t('Start here') };
}

// ---------- A plan ----------
export function plan(id) {
  const p = B().plans[id];
  if (!p) return { html: back('#/bible', t('Bible study')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const list = planStudies(id), next = id === 'rcia' ? (list.find(s => s.id === currentSession().id) || nextIn(list)) : nextIn(list);
  let html = back('#/bible', t('Bible study')) + head(t('Reading plan'), p.title, p.about) +
    '<p class="small muted" style="margin:-6px 2px 10px">' + doneCount(list) + ' / ' + list.length + ' ' + esc(t('done')) + '</p><ol class="road">';
  list.forEach(s => {
    const lit = !!state.bible[s.id], n = s.plan === 'rcia' ? sessionNo(s.session) : list.indexOf(s) + 1;
    html += '<li class="' + (lit ? 'lit' : '') + (next === s ? ' next' : '') + '"><a class="stop" href="#/bible/' + s.id + '"><span class="node">' + (lit ? icon('check') : n) + '</span>' +
      '<span class="info"><span class="title">' + esc(s.ref) + '</span><span class="sub">' + esc(s.title) + (notesOf(s.id).trim() ? ' <span class="tag gold">' + esc(t('notes')) + '</span>' : '') + '</span></span></a></li>';
  });
  html += '</ol>';
  return { html, title: p.title };
}

// ---------- One study ----------
export function study(id) {
  const s = findStudy(id);
  if (!s) return { html: back('#/bible', t('Bible study')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const P = B().plans[s.plan], list = planStudies(s.plan), i = list.indexOf(s), prev = list[i - 1], nxt = list[i + 1];
  const verses = (data.scripture.passages || {})[s.ref] || [], done = !!state.bible[s.id];
  const m = Object.fromEntries(B().method.map(x => [x.id, x]));
  const step = (n, key, body) => '<section class="card study-step"><div class="step-head"><span class="n">' + n + '</span><h2>' + esc(m[key].name) + '</h2></div>' + body + '</section>';

  let html = back('#/bible-plan/' + s.plan, P.title) +
    head(label(s) + ' · ' + P.title, s.ref, s.intro) +
    (s.plan === 'rcia' ? '<p class="small muted" style="margin:-8px 2px 12px">' + esc(s.title) + ' · <a href="#/session/' + s.id + '">' + esc(t('Open the lesson')) + '</a></p>' : '<p class="small muted" style="margin:-8px 2px 12px">' + esc(s.title) + '</p>') +
    '<p class="small muted prayer-line">' + icon('candle') + ' ' + esc(B().prayer) + '</p>';

  html += step(1, 'read', '<p class="small muted" style="margin:0 0 8px">' + esc(m.read.about) + '</p>' +
    '<div class="btn-row" style="margin:0 0 10px">' + listenButton('slisten', t('Listen'), 'soft sm') + ext(nrsvUrl(s.ref), t('Read in the NRSV (as at Mass in Canada)'), 'ghost sm') + '</div>' +
    (verses.length ? '<div class="scripture">' + verses.map(([n, v]) => '<span class="vn">' + n + '</span>' + esc(v) + ' ').join('') + '</div><p class="small muted" style="margin:8px 0 0">' + esc(t('Douay-Rheims Bible, public domain.')) + '</p>'
      : '<p>' + esc(t('Open the passage in your Bible or with the button above.')) + '</p>'));

  if (s.understand) html += step(2, 'understand', '<p style="margin:0">' + esc(s.understand) + '</p>' +
    (s.ccc ? '<p class="small muted" style="margin:10px 0 0">' + esc(t('To go deeper: Catechism of the Catholic Church')) + ' ' + esc(s.ccc) + '</p>' : ''));

  html += step(s.understand ? 3 : 2, 'pray', '<ol class="qs">' + (s.questions || []).map(q => '<li>' + esc(q) + '</li>').join('') + '</ol>' +
    '<label class="field" style="margin:0"><span>' + esc(t('My notes')) + ' <span class="saved-hint" id="bsaved"></span></span><textarea id="bnotes" placeholder="' + esc(t('What is God saying to you in this passage?')) + '">' + esc(notesOf(s.id)) + '</textarea></label>' +
    '<div class="btn-row" style="margin:10px 0 0"><button class="btn ghost sm" id="bshare">' + esc(t('Send the questions to my sponsor or group')) + '</button></div>');

  if (s.live) html += step(s.understand ? 4 : 3, 'live', '<p style="margin:0">' + esc(s.live) + '</p>');

  html += '<div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn ' + (done ? 'ok' : '') + '" id="bdone" aria-pressed="' + done + '">' + (done ? icon('check') + esc(t('Studied')) + ' · ' + esc(fmtDate(new Date(state.bible[s.id] + 'T12:00:00'), { month: 'short', day: 'numeric' })) : esc(t('Mark as studied'))) + '</button></div>' +
    '<div class="study-nav">' + (prev ? '<a class="btn ghost sm" href="#/bible/' + prev.id + '">' + icon('back') + esc(prev.ref) + '</a>' : '<span></span>') +
    (nxt ? '<a class="btn ghost sm" href="#/bible/' + nxt.id + '">' + esc(nxt.ref) + icon('chevron') + '</a>' : '') + '</div>';

  return {
    html, title: s.ref,
    bind(root) {
      bindListen(root, 'slisten', () => [s.ref + '.', ...verses.flatMap(([, v]) => sentences(v))]);
      const ta = root.querySelector('#bnotes');
      let timer;
      ta.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { state.study[s.id] = { ...(state.study[s.id] || {}), notes: ta.value, ref: s.ref, updated: localISO(new Date()) }; save(); root.querySelector('#bsaved').textContent = t('Saved'); }, 400); };
      root.querySelector('#bdone').onclick = () => {
        if (state.bible[s.id]) delete state.bible[s.id];
        else { state.bible[s.id] = localISO(new Date()); toast(t('Well done')); }
        save(); rerender();
      };
      root.querySelector('#bshare').onclick = () => {
        const text = s.ref + ' · ' + s.title + '\n\n' + (s.questions || []).map((q, k) => (k + 1) + '. ' + q).join('\n') + '\n\n' + nrsvUrl(s.ref);
        if (navigator.share) navigator.share({ title: s.ref, text }).catch(() => {});
        else (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t('Copied'))).catch(() => {});
      };
    }
  };
}

// ---------- My Bible notes ----------
export function notes() {
  const withNotes = allStudies().filter(s => notesOf(s.id).trim());
  const yearNotes = Object.keys(state.study).filter(k => k.startsWith('year-') && notesOf(k).trim())
    .sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10) || a.localeCompare(b));
  let html = back('#/bible', t('Bible study')) + head(t('Bible study'), t('My Bible notes'), t('Everything you wrote in your Bible studies. It stays only on this device; Backup in Settings saves it too.'));
  if (!withNotes.length && !yearNotes.length) html += '<p class="empty">' + esc(t('No notes yet. Open a study and write a line or two in step 3.')) + '</p><div class="btn-row" style="justify-content:center"><a class="btn" href="#/bible-plan/rcia">' + esc(t('Open My RCIA road')) + '</a></div>';
  PLAN_IDS.forEach(pid => {
    const list = withNotes.filter(s => s.plan === pid);
    if (!list.length) return;
    html += '<div class="section-title"><h2>' + esc(B().plans[pid].title) + '</h2></div>' + list.map(s =>
      '<a class="card note-card" href="#/bible/' + s.id + '"><span class="eyebrow">' + esc(s.ref) + ' · ' + esc(s.title) + '</span><span class="note-text">' + esc(notesOf(s.id)) + '</span></a>').join('');
  });
  if (yearNotes.length) html += '<div class="section-title"><h2>' + esc(t('The whole Bible')) + '</h2></div>' + yearNotes.map(k =>
    '<a class="card note-card" href="#/bible-day/' + k.slice(5) + '"><span class="eyebrow">' + esc(state.study[k].ref || k) + '</span><span class="note-text">' + esc(notesOf(k)) + '</span></a>').join('');
  return { html, title: t('My Bible notes') };
}


// ---------- The whole Bible in a year ----------
// content/en/year.json: books [{ id, name, dr, nt, v: verses per chapter, s: { chapter: first verse number } }]
// and 365 days. Each day is [whole day, first half, second half]; each part is a list of readings
// [book, chapterFrom, positionFrom, chapterTo, positionTo] (positions count verses from 1 in a chapter).
// One year reads whole days; the gentler two-year pace reads halves. Progress is shared: a day counts as done
// when it or both its halves are done, so switching pace never loses anything.
// Book texts (content/bible/*.json) load one book at a time and are kept for offline use by the service worker.
const Y = () => data.year;
const BK = name => (data.books || {})[name] || null;
const bookCache = {};
export const loadBook = id => bookCache[id] || (bookCache[id] = fetch('content/bible/' + id + '.json').then(r => { if (!r.ok) throw new Error(id); return r.json(); }).catch(e => { delete bookCache[id]; throw e; }));
const pace = () => state.bibleYear.pace === 2 ? 2 : 1;
// Entries of the current pace: '12' (a whole day) or '12-a' / '12-b' (halves).
const entries = () => pace() === 1 ? Y().days.map((_, i) => String(i + 1)) : Y().days.flatMap((_, i) => [(i + 1) + '-a', (i + 1) + '-b']);
const parseEntry = e => { const m = /^(\d+)(?:-([ab]))?$/.exec(e || ''); return m ? { day: +m[1], half: m[2] || '' } : null; };
const partsOf = e => { const p = parseEntry(e); const d = p && Y().days[p.day - 1]; return d ? d[p.half === 'a' ? 1 : p.half === 'b' ? 2 : 0] : null; };
const isDone = e => {
  const p = parseEntry(e); if (!p) return false;
  const k = n => !!state.bible['year-' + n];
  if (p.half) return k(p.day + '-' + p.half) || k(p.day);
  return k(p.day) || (k(p.day + '-a') && k(p.day + '-b'));
};
const setDone = (e, on) => {
  const p = parseEntry(e), today = localISO(new Date());
  if (on) state.bible['year-' + e] = today;
  else { delete state.bible['year-' + e]; if (!p.half) { delete state.bible['year-' + p.day + '-a']; delete state.bible['year-' + p.day + '-b']; } else delete state.bible['year-' + p.day]; }
};
const entryLabel = e => { const p = parseEntry(e); return pace() === 1 ? t('Day') + ' ' + p.day : t('Day') + ' ' + ((p.day - 1) * 2 + (p.half === 'b' ? 2 : 1)); };
const yearTitle = () => pace() === 1 ? t('The whole Bible in a year') : t('The whole Bible in two years');
const verseNo = (b, c, pos) => ((b.s || {})[c] || 1) + pos - 1;
// "Genesis 1-3", "Psalms 118:1-88", "Luke 9:24-45", "Luke 9:51-10:12"
export function refOf(r) {
  const [bi, c1, p1, c2, p2] = r, b = Y().books[bi];
  const whole = p1 === 1 && p2 === b.v[c2 - 1];
  if (whole) return b.name + ' ' + (c1 === c2 ? c1 : c1 + '-' + c2);
  const v1 = verseNo(b, c1, p1), v2 = verseNo(b, c2, p2);
  return b.name + ' ' + c1 + ':' + v1 + '-' + (c1 === c2 ? v2 : c2 + ':' + v2);
}
const isPsalms = r => Y().books[r[0]].name === 'Psalms';
function versesOf(r, bk) {
  const [, c1, p1, c2, p2] = r, out = [];
  for (let c = c1; c <= c2; c++) (bk.c[c - 1] || []).forEach((txt, i) => {
    const pos = i + 1;
    if ((c === c1 && pos < p1) || (c === c2 && pos > p2)) return;
    out.push([c, ((bk.s || {})[c] || 1) + i, txt]);
  });
  return out;
}
const scriptureHtml = (vs, showChap = true) => '<div class="scripture">' + vs.map(([c, n, v], i) => (showChap && (i === 0 || vs[i - 1][0] !== c) ? '<span class="chap">' + c + '</span>' : '') + '<span class="vn">' + n + '</span>' + esc(v) + ' ').join('') + '</div>';
const minutes = parts => Math.max(3, Math.round(parts.reduce((n, r) => { const b = Y().books[r[0]]; let v = 0; for (let c = r[1]; c <= r[3]; c++) v += (c === r[3] ? r[4] : b.v[c - 1]) - (c === r[1] ? r[2] - 1 : 0); return n + v; }, 0) / 6));
const section = (name, c) => { const o = (BK(name) || {}).outline || []; let cur = null; o.forEach(x => { if (x[0] <= c) cur = x[1]; }); return cur; };

// About a book: what it is, what to look for, how it points to Christ, its outline.
function bookGuideHtml(name, open, here) {
  const g = BK(name); if (!g) return '';
  const b = Y().books.find(x => x.name === name);
  const body = '<p class="small muted" style="margin:0 0 6px">' + esc(g.kind) + (b && b.dr !== name ? ' · ' + esc(t('In the Douay-Rheims:')) + ' ' + esc(b.dr) : '') + '</p>' +
    '<p>' + esc(g.about) + '</p><p><strong>' + esc(t('Look for')) + ':</strong> ' + esc(g.look) + '</p><p><strong>' + esc(t('Pointing to Christ')) + ':</strong> ' + esc(g.christ) + '</p>' +
    '<div class="eyebrow" style="margin-top:10px">' + esc(t('The shape of the book')) + '</div><ol class="outline">' + g.outline.map(([c, title], i) => {
      const next = g.outline[i + 1], last = next ? next[0] - 1 : (b ? b.chapters || b.v.length : c);
      return '<li' + (here && here >= c && here <= last ? ' class="here"' : '') + '><span class="oc">' + (c === last ? c : c + '-' + last) + '</span>' + esc(title) + '</li>';
    }).join('') + '</ol>' +
    (g.ccc ? '<p class="small muted" style="margin:8px 0 0">' + esc(t('Catechism')) + ' ' + esc(g.ccc) + '</p>' : '');
  return acc((open ? t('Starting a new book') + ': ' : t('About')) + ' ' + name, body, open);
}

function yearCard() {
  const es = entries(), n = es.filter(isDone).length, pct = Math.round(n / es.length * 100);
  return '<a class="card plan-card year-card" href="#/bible-year"><span class="eyebrow">' + esc(pace() === 1 ? t('All 73 books in 365 days') : t('All 73 books in two years')) + '</span><h3>' + esc(yearTitle()) + '</h3>' +
    '<span class="small muted">' + esc(t('A few chapters of the Old Testament and a passage of the New each day, with a guide to every book')) + '</span>' +
    '<span class="plan-bar" role="img" aria-label="' + n + ' / ' + es.length + '"><span style="width:' + pct + '%"></span></span>' +
    '<span class="small muted">' + n + ' / ' + es.length + ' ' + esc(t('days done')) + '</span><span class="chev">' + icon('chevron') + '</span></a>';
}
export { yearCard };

export function year() {
  const es = entries(), total = es.length, n = es.filter(isDone).length, next = es.find(e => !isDone(e)), pct = Math.round(n / total * 100);
  let html = back('#/bible', t('Bible study')) + head(t('Reading plan'), yearTitle(),
      t('The whole Bible, all 73 books, in the order of a Catholic Bible. Each day has a few chapters of the Old Testament and a passage of the New Testament, a guide to each book, and a question to pray with. The plan waits for you: no dates, no falling behind.')) +
    '<section class="card"><span class="plan-bar"><span style="width:' + pct + '%"></span></span><p class="small muted" style="margin:4px 0 12px">' + n + ' / ' + total + ' ' + esc(t('days done')) + '</p>' +
    (next ? '<a class="btn block" href="#/bible-day/' + next + '">' + esc(n ? t('Continue') : t('Start')) + ': ' + esc(entryLabel(next)) + icon('chevron') + '</a><p class="small muted" style="margin:8px 0 0">' + esc(partsOf(next).map(refOf).join(' · ')) + ' · ' + t('about') + ' ' + minutes(partsOf(next)) + ' ' + esc(t('minutes')) + '</p>'
      : '<p style="margin:0"><strong>' + esc(t('You have read the whole Bible. Thanks be to God!')) + '</strong></p>') + '</section>' +
    '<section class="card"><div class="eyebrow">' + esc(t('Pace')) + '</div><div class="seg" role="radiogroup" aria-label="' + esc(t('Pace')) + '">' +
      [[1, t('One year'), t('15-20 min a day')], [2, t('Two years'), t('8-10 min a day')]].map(([v, l, sub]) => '<button role="radio" aria-checked="' + (pace() === v) + '" data-pace="' + v + '" class="' + (pace() === v ? 'on' : '') + '"><strong>' + esc(l) + '</strong><span class="small">' + esc(sub) + '</span></button>').join('') +
    '</div><p class="small muted" style="margin:8px 0 0">' + esc(t('Switch any time. What you have read stays read.')) + '</p></section>' +
    '<div class="card flat small"><p style="margin:0 0 8px">' + esc(t('The text is the Douay-Rheims, a Catholic translation free for anyone to share. A few books have older names, and most Psalms are numbered one lower than in a modern Bible. Each reading links to the NRSV, the translation of the Lectionary used at Mass in Canada.')) + '</p>' +
    '<button class="btn soft sm" id="offline">' + icon('check') + esc(t('Save the whole Bible for offline')) + '</button> <span class="small muted" id="offmsg"></span></div>';
  html += '<div class="section-title"><h2>' + esc(t('Every day')) + '</h2><a class="linkish" href="#/bible-books">' + esc(t('Book guides')) + '</a></div><div class="card tight">';
  const step = 30;
  for (let m = 0; m < total; m += step) {
    const slice = es.slice(m, m + step), done = slice.filter(isDone).length;
    const rows = slice.map(e => '<li><a class="row' + (isDone(e) ? ' done' : '') + '" href="#/bible-day/' + e + '"><span class="lead">' + (isDone(e) ? icon('check') : esc(entryLabel(e).replace(/\D+/g, ''))) + '</span><span class="grow"><span class="sub" style="color:var(--text)">' + esc(partsOf(e).map(refOf).join(' · ')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>').join('');
    html += acc(t('Days') + ' ' + (m + 1) + '-' + (m + slice.length) + ' · ' + done + '/' + slice.length, '<ul class="list tight">' + rows + '</ul>', !!next && slice.includes(next));
  }
  html += '</div>';
  return {
    html, title: yearTitle(),
    bind(root) {
      root.querySelectorAll('[data-pace]').forEach(b => b.onclick = () => { state.bibleYear.pace = +b.dataset.pace; save(); rerender(); });
      const btn = root.querySelector('#offline'), msg = root.querySelector('#offmsg');
      btn.onclick = async () => {
        btn.disabled = true; let k = 0; const books = Y().books;
        try {
          for (const b of books) { await loadBook(b.id); k++; msg.textContent = k + ' / ' + books.length; }
          msg.textContent = t('Saved. The whole Bible now works offline.');
        } catch (e) { msg.textContent = t('Could not finish. Check your internet and try again.'); btn.disabled = false; }
      };
    }
  };
}

export function day(e) {
  const parts = partsOf(e);
  if (!parts) return { html: back('#/bible-year', t('Bible study')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const es = entries(), idx = es.indexOf(e), done = isDone(e), key = 'year-' + e, p = parseEntry(e);
  // Show a guide when a reading starts a new book; otherwise where we are in the book.
  const q = r => { const g = BK(Y().books[r[0]].name); return g && g.pray.length ? g.pray[(p.day + (p.half === 'b' ? 1 : 0)) % g.pray.length] : ''; };
  let html = back('#/bible-year', yearTitle()) +
    head(yearTitle() + ' · ' + entryLabel(e), parts.map(refOf).join(' · '), t('About') + ' ' + minutes(parts) + ' ' + t('minutes') + '. ' + t('Read slowly. If a part is hard, keep going: the guide below each reading helps.')) +
    '<p class="small muted prayer-line">' + icon('candle') + ' ' + esc(B().prayer) + '</p>' +
    '<div class="btn-row" style="margin:0 0 10px">' + listenButton('ylisten', t('Listen to all of today'), 'soft sm') + '</div>';
  parts.forEach((r, i) => {
    const b = Y().books[r[0]], starts = r[1] === 1 && r[2] === 1, where = section(b.name, r[1]);
    html += '<section class="card study-step"><div class="step-head"><span class="n sm">' + (b.nt ? t('NT') : t('OT')) + '</span><h2>' + esc(refOf(r)) + '</h2></div>' +
      (where && !starts ? '<p class="small muted" style="margin:-4px 0 8px">' + esc(t('Where you are')) + ': ' + esc(where) + '</p>' : '') +
      '<div class="card tight flat" style="margin:0 0 10px">' + bookGuideHtml(b.name, starts, r[1]) + '</div>' +
      '<div id="yr' + i + '"><p class="muted">' + esc(t('Opening…')) + '</p></div>' +
      '<div class="btn-row" style="margin:10px 0 0">' + (isPsalms(r) ? '' : ext(nrsvUrl(refOf(r)), t('Read in the NRSV'), 'ghost sm')) + listenButton('yl' + i, t('Listen'), 'ghost sm') + '</div></section>';
  });
  const qs = [...new Set(parts.map(q).filter(Boolean))];
  html += '<section class="card study-step"><div class="step-head"><span class="n">' + icon('heart') + '</span><h2>' + esc(t('Pray')) + '</h2></div>' +
    '<ol class="qs">' + qs.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    '<label class="field" style="margin:0"><span>' + esc(t('My notes')) + ' <span class="saved-hint" id="bsaved"></span></span><textarea id="bnotes" placeholder="' + esc(t('One line: what struck you today?')) + '">' + esc(notesOf(key)) + '</textarea></label></section>' +
    '<div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn ' + (done ? 'ok' : '') + '" id="bdone" aria-pressed="' + done + '">' + (done ? icon('check') + esc(t('Read')) : esc(t('Mark as read'))) + '</button></div>' +
    '<div class="study-nav">' + (idx > 0 ? '<a class="btn ghost sm" href="#/bible-day/' + es[idx - 1] + '">' + icon('back') + esc(entryLabel(es[idx - 1])) + '</a>' : '<span></span>') +
    (idx >= 0 && idx < es.length - 1 ? '<a class="btn ghost sm" href="#/bible-day/' + es[idx + 1] + '">' + esc(entryLabel(es[idx + 1])) + icon('chevron') + '</a>' : '') + '</div>';
  return {
    html, title: entryLabel(e),
    bind(root) {
      const per = parts.map(() => []);
      Promise.all(parts.map(r => loadBook(Y().books[r[0]].id))).then(bks => parts.forEach((r, i) => {
        const vs = versesOf(r, bks[i]), el = root.querySelector('#yr' + i);
        if (el) el.innerHTML = scriptureHtml(vs);
        per[i].push(refOf(r) + '.', ...vs.flatMap(v => sentences(v[2])));
      })).catch(() => parts.forEach((r, i) => { const el = root.querySelector('#yr' + i); if (el) el.innerHTML = '<p>' + esc(t('This reading needs the internet the first time. Connect once, or use "Save the whole Bible for offline" on the plan page.')) + '</p>'; }));
      bindListen(root, 'ylisten', () => per.flat());
      parts.forEach((_, i) => bindListen(root, 'yl' + i, () => per[i]));
      const ta = root.querySelector('#bnotes'); let timer;
      ta.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { state.study[key] = { notes: ta.value, ref: entryLabel(e) + ': ' + parts.map(refOf).join(' · '), updated: localISO(new Date()) }; save(); root.querySelector('#bsaved').textContent = t('Saved'); }, 400); };
      root.querySelector('#bdone').onclick = () => {
        const on = !isDone(e); setDone(e, on); save();
        if (on) toast(idx === es.length - 1 ? t('You have read the whole Bible!') : t('Well done'));
        rerender();
      };
    }
  };
}

// ---------- Book guides and the whole Bible to browse ----------
export function books() {
  const bs = Y().books, list = nt => '<ul class="list card tight">' + bs.filter(b => b.nt === nt).map(b => {
    const g = BK(b.name);
    return '<li><a class="row" href="#/bible-read/' + b.id + '/1"><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title">' + esc(b.name) + (b.dr !== b.name ? ' <span class="small muted">(' + esc(b.dr) + ')</span>' : '') + '</span><span class="sub clamp">' + esc(g ? g.about : '') + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>';
  }).join('') + '</ul>';
  const html = back('#/bible', t('Bible study')) + head(t('Bible study'), t('All 73 books'), t('A guide to every book of the Bible: what it is, what to look for, how it points to Christ, and its outline. Open a book to read it, chapter by chapter.')) +
    '<div class="section-title"><h2>' + esc(t('Old Testament')) + ' · 46</h2></div>' + list(false) +
    '<div class="section-title"><h2>' + esc(t('New Testament')) + ' · 27</h2></div>' + list(true);
  return { html, title: t('All 73 books') };
}

export function read(id, cStr) {
  const b = Y().books.find(x => x.id === id);
  if (!b) return { html: back('#/bible-books', t('All 73 books')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const n = b.v.length, c = Math.min(Math.max(1, parseInt(cStr, 10) || 1), n), ref = b.name + ' ' + c;
  const html = back('#/bible-books', t('All 73 books')) + head(b.nt ? t('New Testament') : t('Old Testament'), ref, section(b.name, c) || '') +
    '<div class="card tight">' + bookGuideHtml(b.name, c === 1, c) + '</div>' +
    '<div class="btn-row" style="margin:12px 0 10px">' + listenButton('rlisten', t('Listen'), 'soft sm') + (b.name === 'Psalms' ? '' : ext(nrsvUrl(ref), t('Read in the NRSV'), 'ghost sm')) + '</div>' +
    '<section class="card"><div id="rtext"><p class="muted">' + esc(t('Opening…')) + '</p></div></section>' +
    '<div class="study-nav">' + (c > 1 ? '<a class="btn ghost sm" href="#/bible-read/' + id + '/' + (c - 1) + '">' + icon('back') + esc(t('Chapter')) + ' ' + (c - 1) + '</a>' : '<span></span>') +
    (c < n ? '<a class="btn ghost sm" href="#/bible-read/' + id + '/' + (c + 1) + '">' + esc(t('Chapter')) + ' ' + (c + 1) + icon('chevron') + '</a>' : '') + '</div>' +
    (n > 1 ? '<div class="eyebrow" style="margin:14px 2px 6px">' + esc(t('Chapters')) + '</div><div class="chip-wrap">' + Array.from({ length: n }, (_, i) => '<a class="chip-link' + (i + 1 === c ? ' on' : '') + '" href="#/bible-read/' + id + '/' + (i + 1) + '"' + (i + 1 === c ? ' aria-current="page"' : '') + '>' + (i + 1) + '</a>').join('') + '</div>' : '');
  return {
    html, title: ref,
    bind(root) {
      let pieces = [];
      loadBook(id).then(bk => {
        const vs = (bk.c[c - 1] || []).map((v, i) => [c, ((bk.s || {})[c] || 1) + i, v]);
        root.querySelector('#rtext').innerHTML = scriptureHtml(vs, false);
        pieces = [ref + '.', ...vs.flatMap(v => sentences(v[2]))];
      }).catch(() => { root.querySelector('#rtext').innerHTML = '<p>' + esc(t('This book needs the internet the first time you open it.')) + '</p>'; });
      bindListen(root, 'rlisten', () => pieces);
    }
  };
}
