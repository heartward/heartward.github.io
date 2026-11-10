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
    planCard('rcia', t('Session') + ' ' + sessionNo(cur) + ': ' + cur.title) + planCard('mark') + planCard('story');

  html += '<div class="section-title"><h2>' + esc(t('Get ready for Sunday')) + '</h2></div><ul class="list card tight">' +
    '<li><a class="row" href="#/lectio"><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title">' + esc(t('Sunday Gospel with Lectio Divina')) + '</span><span class="sub">' + esc(fmtDate(nextSunday())) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' +
    '<li><a class="row" href="' + esc(readingsUrl(nextSunday())) + '" target="_blank" rel="noopener"><span class="lead">' + icon('church') + '</span><span class="grow"><span class="title">' + esc(t('Sunday\'s readings for Canada')) + '</span><span class="sub">' + esc(t('From the Canadian Lectionary, on Living with Christ')) + '</span></span><span class="chev">' + icon('external') + '</span></a></li></ul>';

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
  let html = back('#/bible', t('Bible study')) + head(t('Bible study'), t('My Bible notes'), t('Everything you wrote in your Bible studies. It stays only on this device; Backup in Settings saves it too.'));
  if (!withNotes.length) html += '<p class="empty">' + esc(t('No notes yet. Open a study and write a line or two in step 3.')) + '</p><div class="btn-row" style="justify-content:center"><a class="btn" href="#/bible-plan/rcia">' + esc(t('Open My RCIA road')) + '</a></div>';
  PLAN_IDS.forEach(pid => {
    const list = withNotes.filter(s => s.plan === pid);
    if (!list.length) return;
    html += '<div class="section-title"><h2>' + esc(B().plans[pid].title) + '</h2></div>' + list.map(s =>
      '<a class="card note-card" href="#/bible/' + s.id + '"><span class="eyebrow">' + esc(s.ref) + ' · ' + esc(s.title) + '</span><span class="note-text">' + esc(notesOf(s.id)) + '</span></a>').join('');
  });
  return { html, title: t('My Bible notes') };
}

