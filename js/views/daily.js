// Between classes: a seven-day plan for each RCIA session, so every day of the week has something
// to read, think through, pray and do. Day 1 is the day after class, Day 7 is class day.
// Each day leads with one thing of its own kind: remember, Scripture, watch or listen, think it through
// (faith and reason), a story, live it, and get ready for class. Content: content/en/daily.json.
import { data, byId } from '../data.js';
import { state, save, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, fmtDate, parseISO, safeUrl } from '../ui.js';
import { sessionNo } from './journey.js';
import { currentSession, readingsUrl } from './week.js';
import { passage, nrsvUrl } from './bible.js';
import { listenButton, bindListen, sentences } from '../speech.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const D = () => data.daily || { sessions: {}, kinds: {} };
export const daysOf = id => (D().sessions || {})[id] || null;
const rec = (sid, n) => ((state.daily[sid] || {})[n]) || {};
const isDone = (sid, n) => !!rec(sid, n).done;
const setRec = (sid, n, patch) => {
  const r = Object.assign({}, rec(sid, n), patch);
  Object.keys(r).forEach(k => { if (r[k] === '' || r[k] == null) delete r[k]; });
  state.daily[sid] = Object.assign({}, state.daily[sid]);
  if (Object.keys(r).length) state.daily[sid][n] = r; else delete state.daily[sid][n];
  if (!Object.keys(state.daily[sid]).length) delete state.daily[sid];
};
const ext = (href, label, cls = 'ghost sm') => '<a class="btn ' + cls + '" href="' + esc(safeUrl(href)) + '" target="_blank" rel="noopener">' + esc(label) + icon('external') + '</a>';

// Weekday names in the languages of the app, to read the class day from the parish's "meets" text.
const WEEKDAYS = [['sunday', 'sun', 'یکشنبه'], ['monday', 'mon', 'دوشنبه'], ['tuesday', 'tue', 'سه‌شنبه', 'سه شنبه'], ['wednesday', 'wed', 'چهارشنبه'],
  ['thursday', 'thu', 'پنجشنبه', 'پنج‌شنبه'], ['friday', 'fri', 'جمعه'], ['saturday', 'sat', 'شنبه']];
function guessDay(text) {
  const s = String(text || '').toLowerCase();
  if (!s) return null;
  // Longer Persian names first, so شنبه (Saturday) does not match inside یکشنبه.
  for (const i of [0, 1, 2, 3, 4, 5, 6]) if (WEEKDAYS[i].slice(2).some(w => s.includes(w))) return i;
  for (const i of [0, 1, 2, 3, 4, 5, 6]) if (new RegExp('\\b' + WEEKDAYS[i][1]).test(s)) return i;
  return null;
}
// The weekday of class: chosen on the plan page, or read from the parish's meeting time.
export function classDay() {
  const v = state.settings.classDay;
  if (v !== '' && v != null && !isNaN(+v)) return +v;
  return guessDay(state.parish.meets || data.parish.meets);
}
const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Which day of the plan today is (1-7) for session s.
export function todayNo(s, now = new Date()) {
  const i = data.sessionList.indexOf(s), prev = i > 0 ? data.sessionList[i - 1] : null;
  const prevDone = prev && state.done[prev.id], todayIso = localISO(now);
  const cd = classDay();
  if (cd != null) {
    const n = (now.getDay() - cd + 7) % 7;
    // Class day itself is Day 7, unless that class was just marked done: then the new week starts.
    if (n === 0) return prevDone === todayIso ? 1 : 7;
    return n;
  }
  // No class day known: count from the day the last class was marked done.
  if (prevDone) {
    const n = Math.round((midnight(now) - parseISO(prevDone)) / 864e5);
    return Math.min(7, Math.max(1, n));
  }
  const days = daysOf(s.id) || [];
  const first = days.findIndex((_, k) => !isDone(s.id, k + 1));
  return first < 0 ? 7 : first + 1;
}

// Where the "go deeper" links lead.
const GO = {
  lesson: (s) => ['#/session/' + s.id, 'book', t('Read the lesson again')],
  bible: (s) => (data.study.sessions[s.id] || {}).bible ? ['#/bible/' + s.id, 'book', t('This week\'s Bible study')] : null,
  quiz: (s) => (data.study.sessions[s.id] || {}).quiz ? ['#/quiz/' + s.id, 'question', t('Take the review quiz')] : null,
  verse: (s) => (data.study.sessions[s.id] || {}).verse ? ['#/verse/' + s.id, 'sparkle', t('Practise the memory verse')] : null,
  week: (s) => ['#/week/' + s.id, 'sparkle', t('This week\'s activities')],
  lectio: () => ['#/lectio', 'book', t('Sunday Gospel with Lectio Divina')],
  rosary: () => ['#/rosary', 'rosary', t('Pray the Rosary')],
  confession: () => ['#/confession', 'heart', t('Confession guide')],
  'first-confession': () => ['#/first-confession', 'heart', t('Prepare for your first Confession')],
  examen: () => ['#/examen', 'moon', t('Evening Examen')],
  stations: () => ['#/stations', 'candle', t('Stations of the Cross')],
  intentions: () => ['#/intentions', 'hands', t('People I pray for')],
  sponsor: () => ['#/sponsor', 'people', t('Talks with my sponsor')],
  rites: () => ['#/rites', 'candle', t('The rites ahead')],
  mass: () => ['#/mass', 'church', t('Mass guide')],
  'saint-quiz': () => ['#/saint-quiz', 'star', t('Find my saint')],
  'bible-year': () => ['#/bible-year', 'book', t('The whole Bible in a year')],
  habits: () => ['#/habits', 'check', t('My weekly habits')]
};
const goRow = (key, s) => { const g = GO[key] && GO[key](s); return g ? '<li><a class="row" href="' + g[0] + '"><span class="lead">' + icon(g[1]) + '</span><span class="grow"><span class="title">' + esc(g[2]) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' : ''; };

// Book names are translated for display; the English reference finds the text and builds the NRSV link.
const refShow = ref => { const m = /^(.+?)\s+(\d.*)$/.exec(ref || ''); if (!m) return ref; const b = m[1] === 'Psalm' ? 'Psalms' : m[1]; const tb = t(b); return (tb === b ? m[1] : tb) + ' ' + m[2]; };
const kindOf = d => (D().kinds || {})[d.kind] || { name: d.kind, icon: 'sparkle' };

// ---------- The card on Today ----------
export function todayCard() {
  const s = currentSession(), days = s && daysOf(s.id);
  if (!days) return '';
  const n = todayNo(s), d = days[n - 1], k = kindOf(d), done = isDone(s.id, n);
  const dots = days.map((_, i) => '<span class="' + (isDone(s.id, i + 1) ? 'on' : '') + (i + 1 === n ? ' now' : '') + '"></span>').join('');
  return '<a class="card day-card' + (done ? ' done' : '') + '" href="#/daily/' + s.id + '/' + n + '">' +
    '<span class="eyebrow">' + esc(t('Today\'s step')) + ' · ' + esc(t('Day')) + ' ' + n + ' ' + esc(t('of')) + ' 7</span>' +
    '<span class="day-kind">' + icon(k.icon) + esc(k.name) + '</span>' +
    '<h2 class="h3">' + esc(d.title) + '</h2>' +
    '<span class="wk-chips">' + [t('Read'), t('Think'), t('Pray'), t('Do')].map(x => '<span>' + esc(x) + '</span>').join('') + (done ? '<span class="ok">' + icon('check') + esc(t('Done')) + '</span>' : '') + '</span>' +
    '<span class="day-dots" role="img" aria-label="' + days.filter((_, i) => isDone(s.id, i + 1)).length + ' / 7">' + dots + '</span>' +
    '<span class="chev">' + icon('chevron') + '</span></a>';
}

// ---------- The week's plan ----------
export function plan(id) {
  const s = (id && byId(data.sessionList, id)) || currentSession(), days = daysOf(s.id);
  if (!days) return { html: back('#/', t('Today')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const cur = s === currentSession(), n = cur ? todayNo(s) : 0, cd = classDay(), j = state.journal[s.id] || {};
  const doneN = days.filter((_, i) => isDone(s.id, i + 1)).length;
  const wd = k => new Date(2024, 0, 7 + k).toLocaleDateString(state.settings.lang === 'fa' ? 'fa-IR' : 'en-CA', { weekday: 'short' });
  let html = back(id ? '#/session/' + s.id : '#/', id ? t('Session') : t('Today')) +
    head(t('Between classes') + ' · ' + t('Session') + ' ' + sessionNo(s), s.title, D().intro);
  html += '<section class="card"><span class="plan-bar" role="img" aria-label="' + doneN + ' / 7"><span style="width:' + Math.round(doneN / 7 * 100) + '%"></span></span><p class="small muted" style="margin:4px 0 0">' + doneN + ' / 7 ' + esc(t('days done')) + '</p></section>';
  html += '<ol class="day-list">' + days.map((d, i) => {
    const k = kindOf(d), on = isDone(s.id, i + 1), here = i + 1 === n;
    return '<li><a class="row' + (on ? ' done' : '') + (here ? ' here' : '') + '" href="#/daily/' + s.id + '/' + (i + 1) + '"><span class="lead">' + (on ? icon('check') : '<span class="dn">' + (i + 1) + '</span>') + '</span>' +
      '<span class="grow"><span class="eyebrow">' + esc(t('Day')) + ' ' + (i + 1) + ' · ' + esc(k.name) + (here ? ' · ' + esc(t('Today')) : '') + '</span><span class="title">' + esc(d.title) + '</span>' +
      '<span class="sub">' + esc(refShow(d.ref)) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>';
  }).join('') + '</ol>';
  html += '<div class="section-title"><h2>' + esc(t('My class day')) + '</h2></div><section class="card"><p class="small muted" style="margin:0 0 8px">' + esc(t('Day 1 is the day after class and Day 7 is class day, so the week ends with getting ready for the next session.')) + '</p>' +
    '<div class="day-pick" role="radiogroup" aria-label="' + esc(t('My class day')) + '">' + [0, 1, 2, 3, 4, 5, 6].map(k => '<button role="radio" aria-checked="' + (cd === k) + '" data-cd="' + k + '" class="' + (cd === k ? 'on' : '') + '">' + esc(wd(k)) + '</button>').join('') + '</div>' +
    (cd == null ? '<p class="small muted" style="margin:8px 0 0">' + esc(t('Not set yet: the plan counts from the day you mark a class as done.')) + '</p>' : '') + '</section>';
  html += '<div class="section-title"><h2>' + esc(t('Also for this week')) + '</h2></div><ul class="list card tight">' +
    goRow('week', s) + goRow('lesson', s) +
    '<li><a class="row" href="#/session/' + s.id + '"><span class="lead">' + icon('pen') + '</span><span class="grow"><span class="title">' + esc(t('My questions for class')) + '</span><span class="sub">' + esc((j.questions || '').trim() ? (j.questions.trim().split('\n').filter(Boolean).length + ' ' + t('written')) : t('Gather them during the week')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' +
    '<li><a class="row" href="#/reminder"><span class="lead">' + icon('bell') + '</span><span class="grow"><span class="title">' + esc(t('Remind me every day')) + '</span><span class="sub">' + esc(t('A daily reminder in your phone\'s calendar')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li></ul>';
  return {
    html, title: t('Between classes'),
    bind(root) {
      root.querySelectorAll('[data-cd]').forEach(b => b.onclick = () => { const v = +b.dataset.cd; state.settings.classDay = state.settings.classDay === v ? '' : v; save(); rerender(); });
    }
  };
}

// ---------- One day ----------
export function day(id, nStr) {
  const s = byId(data.sessionList, id) || currentSession(), days = daysOf(s.id), n = Math.min(7, Math.max(1, +nStr || todayNo(s)));
  if (!days) return { html: back('#/', t('Today')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const d = days[n - 1], k = kindOf(d), r = rec(s.id, n), done = !!r.done, j = state.journal[s.id] || {};
  const step = (ic, name, body) => '<section class="card study-step"><div class="step-head"><span class="n">' + icon(ic) + '</span><h2>' + esc(name) + '</h2></div>' + body + '</section>';
  const isToday = s === currentSession() && n === todayNo(s);

  let html = back('#/daily-week/' + s.id, t('Between classes')) +
    '<header class="page-head"><div class="kicker">' + esc(t('Day')) + ' ' + n + ' ' + esc(t('of')) + ' 7 · ' + esc(t('Session')) + ' ' + sessionNo(s) + (isToday ? ' · ' + esc(t('Today')) : '') + '</div>' +
    '<div class="day-kind">' + icon(k.icon) + esc(k.name) + '</div><h1>' + esc(d.title) + '</h1>' + (k.about ? '<p>' + esc(k.about) + '</p>' : '') + '</header>';

  // What this day leads with
  if (d.media) {
    const m = d.media;
    html += '<section class="card media-card"><div class="eyebrow">' + esc(m.kind === 'podcast' ? t('Listen') : m.kind === 'search' ? t('Watch: choose one') : t('Watch')) + ' · ' + esc(m.by) + (m.mins ? ' · ' + m.mins + ' ' + esc(t('min')) : '') + '</div>' +
      '<h3>' + esc(m.title) + '</h3><p>' + esc(m.about) + '</p>' +
      (m.listen ? '<p class="small"><strong>' + esc(t('Listen for')) + ':</strong> ' + esc(m.listen) + '</p>' : '') +
      '<div class="btn-row" style="margin:8px 0 0">' + ext(m.url, m.kind === 'podcast' ? t('Open the episode') : m.kind === 'search' ? t('Open the videos') : t('Open the video'), 'soft sm') + '</div>' +
      '<p class="small muted offline-note" style="margin:8px 0 0">' + esc(t('Needs the internet. Offline? The summary above is enough for today; watch it later.')) + (state.settings.lang === 'fa' ? ' ' + esc(t('The video is in English.')) : '') + '</p></section>';
  }
  if (d.story) html += '<section class="card story-card"><div class="eyebrow">' + esc(t('A story')) + '</div><h3>' + esc(d.story.name) + '</h3>' +
    d.story.text.split('\n\n').map(p => '<p>' + esc(p) + '</p>').join('') +
    '<div class="btn-row" style="margin:8px 0 0">' + listenButton('stlisten', t('Listen'), 'soft sm') + (d.story.saint ? '<a class="btn ghost sm" href="#/saint/' + esc(d.story.saint) + '">' + icon('star') + esc(t('About this saint')) + '</a>' : '') + '</div></section>';
  if (d.reason) html += '<section class="card reason-card"><div class="eyebrow">' + esc(t('A question people ask')) + '</div><h3>' + esc(d.reason.q) + '</h3>' +
    '<ol class="qs">' + d.reason.steps.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    (d.reasonId ? '<a class="btn ghost sm" href="#/reason/' + esc(d.reasonId) + '">' + icon('question') + esc(t('Think it through further')) + '</a>' : '') + '</section>';
  if (d.class) html += '<section class="card"><div class="eyebrow">' + esc(t('Questions to bring to class')) + '</div><p style="margin:4px 0 10px">' + esc(d.class) + '</p>' +
    '<label class="field" style="margin:0"><span>' + esc(t('My questions for class')) + ' <span class="saved-hint" id="qsaved"></span></span><textarea id="dq" style="min-height:90px" placeholder="' + esc(t('One question per line')) + '">' + esc(j.questions || '') + '</textarea></label>' +
    '<div class="btn-row" style="margin:10px 0 0"><button class="btn ghost sm" id="qshare">' + icon('share') + esc(t('Send to my catechist or sponsor')) + '</button></div></section>';

  // Read
  html += step('book', t('Read'), '<p class="small muted" style="margin:0 0 6px"><strong>' + esc(refShow(d.ref)) + '</strong></p>' +
    '<div id="dread"><p class="muted">' + esc(t('Opening…')) + '</p></div>' +
    '<div class="btn-row" style="margin:10px 0 0">' + listenButton('dlisten', t('Listen'), 'soft sm') + ext(nrsvUrl(d.refEn || d.ref), t('Read in the NRSV')) + '</div>');
  // Think
  html += step('sparkle', t('Think'), '<p style="margin:0 0 10px">' + esc(d.think) + '</p>' +
    '<label class="field" style="margin:0"><span>' + esc(d.journal) + ' <span class="saved-hint" id="dsaved"></span></span><textarea id="dnote" placeholder="' + esc(t('A few honest lines are enough.')) + '">' + esc(r.note || '') + '</textarea></label>' +
    '<p class="small muted" style="margin:6px 0 0">' + esc(t('Saved in your journal for this session, only on this device.')) + '</p>');
  // Pray
  let pray = '<p class="prayer-line-big">' + esc(d.pray) + '</p>';
  if (d.prayer) { const p = byId(data.prayers, d.prayer); if (p) pray += '<a class="btn ghost sm" href="#/prayer/' + p.id + '">' + icon('candle') + esc(t('Then pray')) + ': ' + esc(p.title) + '</a>'; }
  html += step('candle', t('Pray'), pray);
  // Do
  html += step('check', t('Do'), '<p style="margin:0">' + esc(d.do) + '</p>');

  // Go deeper
  const wi = d.word ? (data.glossaryEn || []).findIndex(g => g.term === d.word) : -1, word = wi >= 0 ? data.glossary[wi] : null;
  const saint = d.saint && byId(data.saints.saints, d.saint);
  const deeper = (word ? '<li><div class="row static"><span class="lead">' + icon('list') + '</span><span class="grow"><span class="eyebrow">' + esc(t('Word of the day')) + '</span><span class="title">' + esc(word.term) + '</span><span class="sub">' + esc(word.def) + '</span></span></div></li>' : '') +
    (d.ccc ? '<li><div class="row static"><span class="lead">' + icon('church') + '</span><span class="grow"><span class="eyebrow">' + esc(t('From the Catechism')) + '</span><span class="sub">' + esc(t('Catechism')) + ' ' + esc(d.ccc) + '</span></span></div></li>' : '') +
    (saint ? '<li><a class="row" href="#/saint/' + saint.id + '"><span class="lead">' + icon('star') + '</span><span class="grow"><span class="eyebrow">' + esc(t('Saint')) + '</span><span class="title">' + esc(saint.name) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' : '') +
    (d.go || []).map(g => goRow(g, s)).join('') +
    '<li><a class="row" href="' + esc(readingsUrl(new Date())) + '" target="_blank" rel="noopener"><span class="lead">' + icon('church') + '</span><span class="grow"><span class="title">' + esc(t('Today\'s Mass readings for Canada')) + '</span><span class="sub">' + esc(t('From the Canadian Lectionary, on Living with Christ')) + '</span></span><span class="chev">' + icon('external') + '</span></a></li>';
  html += '<div class="section-title"><h2>' + esc(t('Go deeper')) + '</h2></div><ul class="list card tight">' + deeper + '</ul>';

  html += '<div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn ' + (done ? 'ok' : 'glow') + '" id="ddone" aria-pressed="' + done + '">' + (done ? icon('check') + esc(t('Done')) + ' · ' + esc(fmtDate(parseISO(r.done), { month: 'short', day: 'numeric' })) : icon('flame') + esc(t('I did today\'s step'))) + '</button></div>' +
    '<div class="study-nav">' + (n > 1 ? '<a class="btn ghost sm" href="#/daily/' + s.id + '/' + (n - 1) + '">' + icon('back') + esc(t('Day')) + ' ' + (n - 1) + '</a>' : '<span></span>') +
    (n < 7 ? '<a class="btn ghost sm" href="#/daily/' + s.id + '/' + (n + 1) + '">' + esc(t('Day')) + ' ' + (n + 1) + icon('chevron') + '</a>' : '<a class="btn ghost sm" href="#/session/' + s.id + '">' + esc(t('To the session')) + icon('chevron') + '</a>') + '</div>';

  return {
    html, title: d.title,
    bind(root) {
      let said = [];
      passage(d.refEn || d.ref, d.dr).then(p => {
        const el = root.querySelector('#dread'); if (!el) return;
        el.innerHTML = p.html + '<p class="small muted" style="margin:6px 0 0">' + esc(p.fa ? t('Old Persian Version (1895), public domain.') : t('Douay-Rheims Bible, public domain.')) + '</p>';
        said = [refShow(d.ref) + '.', ...p.said];
      }).catch(() => { const el = root.querySelector('#dread'); if (el) el.innerHTML = '<p>' + esc(t('This reading needs the internet the first time. Open it in your Bible, or connect once.')) + '</p>'; });
      bindListen(root, 'dlisten', () => said);
      if (d.story) bindListen(root, 'stlisten', () => [d.story.name + '.', ...d.story.text.split('\n\n').flatMap(sentences)]);
      const ta = root.querySelector('#dnote'); let timer;
      ta.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { setRec(s.id, n, { note: ta.value.trim() ? ta.value : '', prompt: d.journal, updated: localISO(new Date()) }); save(); root.querySelector('#dsaved').textContent = t('Saved'); }, 400); };
      const dq = root.querySelector('#dq');
      if (dq) {
        let qt;
        dq.oninput = () => { clearTimeout(qt); qt = setTimeout(() => {
          const cur = state.journal[s.id] || {}, next = Object.assign({}, cur, { questions: dq.value, updated: localISO(new Date()) });
          if (next.notes || next.questions) state.journal[s.id] = next; else delete state.journal[s.id];
          save(); root.querySelector('#qsaved').textContent = t('Saved');
        }, 400); };
        root.querySelector('#qshare').onclick = () => {
          const text = t('My questions for class') + ' · ' + s.title + '\n\n' + dq.value.trim();
          if (navigator.share) navigator.share({ title: s.title, text }).catch(() => {});
          else (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t('Copied'))).catch(() => {});
        };
      }
      root.querySelector('#ddone').onclick = () => {
        const on = !isDone(s.id, n);
        setRec(s.id, n, { done: on ? localISO(new Date()) : '' }); save();
        if (on) toast(days.every((_, i) => isDone(s.id, i + 1)) ? t('All seven days! Your week was full of God.') : t('Well done'));
        rerender();
      };
    }
  };
}

// ---------- What I wrote this week, shown under the session's journal ----------
export function weekNotesHtml(sid) {
  const days = daysOf(sid), mine = state.daily[sid] || {};
  if (!days) return '';
  const rows = days.map((d, i) => [i + 1, d, mine[i + 1]]).filter(([, , r]) => r && r.note);
  const doneN = days.filter((_, i) => (mine[i + 1] || {}).done).length;
  return '<div class="section-title"><h2>' + esc(t('From my week')) + '</h2><a class="linkish" href="#/daily-week/' + sid + '">' + doneN + ' / 7 ' + esc(t('days')) + '</a></div>' +
    (rows.length ? '<div class="card tight">' + rows.map(([n, d, r]) => '<div class="cal-item" style="display:block"><span class="eyebrow">' + esc(t('Day')) + ' ' + n + ' · ' + esc(d.journal) + '</span><div style="white-space:pre-wrap;margin-top:2px">' + esc(r.note) + '</div></div>').join('') + '</div>'
      : '<a class="card row" href="#/daily-week/' + sid + '"><span class="lead">' + icon('calendar') + '</span><span class="grow"><span class="title">' + esc(t('Between classes')) + '</span><span class="sub">' + esc(t('Seven short days to live this session: read, think, pray and do')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>');
}
