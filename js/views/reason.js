import { data, byId } from '../data.js';
import { state, save, today } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, sources } from '../ui.js';
import { listenButton, bindListen, sentences } from '../speech.js';

// Faith and reason: honest, reasoned answers to the questions people ask on the way to faith.
// Content: content/en/reason.json (Persian in content/fa/reason.json). Personal notes: state.reason[id] = { done, note }.
const R = () => data.reason;
const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const mine = id => state.reason[id] || {};

// Topics that fit a Journey session, for the session page and the daily plan.
export const reasonFor = sessionId => (R() ? R().topics : []).filter(x => (x.sessions || []).includes(sessionId)).map(x => ({ id: x.id, q: x.q, short: x.short }));

// "Romans 1:19-20" -> the in-app Bible reader (works offline, and in Persian), with the book name in the reader's language.
function scriptureLink(s) {
  const en = s.refEn || s.ref;
  const m = en.match(/^(.+?) (\d+)(?::(.+))?$/);
  const b = m && (data.year.books || []).find(x => x.name === m[1]);
  const label = b ? t(b.name) + ' ' + m[2] + (m[3] ? ':' + m[3] : '') : s.ref;
  const href = b ? '#/bible-read/' + b.id + '/' + m[2] : 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(en) + '&version=NRSVCE';
  return '<a class="row" href="' + href + '"' + (b ? '' : ' target="_blank" rel="noopener"') + '><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title" dir="auto">' + esc(label) + '</span>' +
    (s.note ? '<span class="sub">' + esc(s.note) + '</span>' : '') + '</span><span class="chev">' + icon('chevron') + '</span></a>';
}

const topicRow = x => {
  const done = !!mine(x.id).done;
  return '<li><a class="row' + (done ? ' done' : '') + '" href="#/reason/' + x.id + '"><span class="lead">' + (done ? icon('check') : icon('question')) + '</span><span class="grow"><span class="title">' + esc(x.q) + '</span>' +
    '<span class="sub clamp">' + esc(x.short) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>';
};

export function hub() {
  const r = R(), done = r.topics.filter(x => mine(x.id).done).length;
  let html = back('#/learn', t('Learn')) + head(t('Learn'), t('Faith and reason'), r.intro);
  html += '<div class="search-wrap">' + icon('search') + '<input type="search" id="rq" placeholder="' + esc(t('Search the questions')) + '" aria-label="' + esc(t('Search the questions')) + '"></div>';
  html += '<div id="r-all">';
  // The road of reasons: the usual order in which the steps toward faith build on each other.
  html += '<div class="section-title"><h2>' + esc(r.road.title) + '</h2></div><p class="muted" style="margin:-4px 2px 10px">' + esc(r.road.about) + '</p><ol class="road reason-road">' +
    r.road.steps.map((s, i) => {
      const lit = !!mine(s.topic).done;
      return '<li class="' + (lit ? 'lit' : '') + '"><a class="stop" href="#/reason/' + s.topic + '"><span class="node">' + (lit ? icon('check') : (i + 1)) + '</span><span class="info"><span class="title">' + esc(s.title) + '</span><span class="sub">' + esc(s.about) + '</span></span></a></li>';
    }).join('') + '</ol>';
  html += '<p class="small muted" style="margin:6px 2px 0">' + done + ' ' + esc(t('of')) + ' ' + r.topics.length + ' ' + esc(t('questions thought through')) + '</p>';
  // A method for any doubt.
  html += '<details class="card method"><summary><span class="eyebrow">' + esc(t('Start here')) + '</span><strong>' + esc(r.method.title) + '</strong><span class="plus">' + icon('plus') + '</span></summary><ol class="argument">' +
    r.method.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol><blockquote class="r-quote">' + esc(r.method.quote) + '<cite>' + esc(r.method.quoteBy) + '</cite></blockquote></details>';
  r.groups.forEach(g => {
    const list = r.topics.filter(x => x.group === g.id);
    html += '<div class="section-title"><h2>' + esc(g.title) + '</h2></div><p class="small muted" style="margin:-6px 2px 8px">' + esc(g.about) + '</p><ul class="list card tight">' + list.map(topicRow).join('') + '</ul>';
  });
  html += '</div><ul class="list card tight" id="r-hits" hidden></ul><p class="empty" id="r-empty" hidden>' + esc(t('No questions match. Try another word.')) + '</p>';
  html += '<p class="small muted">' + esc(t('These answers are a starting point. Bring your questions to your catechist, your sponsor or a priest: they will be glad you asked.')) + '</p>';
  return {
    html, title: t('Faith and reason'),
    bind(root) {
      const hay = Object.fromEntries(r.topics.map(x => [x.id, [x.q, x.short, ...x.steps, ...x.objections.flatMap(o => [o.o, o.r])].join(' ').toLowerCase()]));
      root.querySelector('#rq').oninput = e => {
        const words = e.target.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const hits = words.length ? r.topics.filter(x => words.every(w => hay[x.id].includes(w))) : [];
        root.querySelector('#r-all').hidden = !!words.length;
        const box = root.querySelector('#r-hits'); box.hidden = !hits.length; box.innerHTML = hits.map(topicRow).join('');
        root.querySelector('#r-empty').hidden = !words.length || hits.length > 0;
      };
    }
  };
}

export function topic(id) {
  const r = R(), x = byId(r.topics, id);
  if (!x) return { html: back('#/reason', t('Faith and reason')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const g = byId(r.groups, x.group), m = mine(x.id);
  const i = r.topics.indexOf(x), nxt = r.topics[i + 1];
  let html = back('#/reason', t('Faith and reason')) + head(g ? g.title : t('Faith and reason'), x.q, '');
  html += '<div class="listen-row">' + listenButton('rl', t('Listen')) + '</div>';
  html += '<div class="card r-short"><div class="eyebrow">' + esc(t('In short')) + '</div><p>' + esc(x.short) + '</p></div>';
  html += '<div class="section-title"><h2>' + esc(t('Step by step')) + '</h2></div><ol class="argument card">' + x.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  html += '<div class="section-title"><h2>' + esc(t('Fair objections')) + '</h2></div><p class="muted small" style="margin:-4px 2px 8px">' + esc(t('The strongest questions on the other side, and how a Catholic answers them.')) + '</p><div class="card tight">' +
    x.objections.map(o => '<details class="acc"><summary><span>' + esc(o.o) + '</span><span class="plus">' + icon('plus') + '</span></summary><div class="body"><p style="margin:0">' + esc(o.r) + '</p></div></details>').join('') + '</div>';
  html += '<div class="reflection"><div class="eyebrow">' + esc(t('Think it through')) + '</div><p>' + esc(x.think) + '</p></div>';
  html += '<div class="section-title"><h2>' + esc(t('In Scripture')) + '</h2></div><ul class="list card tight">' + x.scripture.map(s => '<li>' + scriptureLink(s) + '</li>').join('') + '</ul>';
  if (x.ccc) html += '<p class="small muted" style="margin:10px 2px 0">' + esc(t('To go deeper: Catechism of the Catholic Church')) + ' ' + esc(x.ccc) + '</p>';
  html += sources(x.sources);
  const ss = (x.sessions || []).map(sid => byId(data.sessionList, sid)).filter(Boolean);
  if (ss.length) html += '<div class="section-title"><h2>' + esc(t('On your journey')) + '</h2></div><ul class="list card tight">' +
    ss.map(s => '<li><a class="row" href="#/session/' + s.id + '"><span class="lead">' + icon('road') + '</span><span class="grow"><span class="eyebrow">' + esc(t('Session')) + ' ' + (data.sessionList.indexOf(s) + 1) + '</span><span class="title">' + esc(s.title) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>').join('') + '</ul>';
  html += '<div class="section-title"><h2>' + esc(t('My thoughts')) + '</h2><span class="saved-hint" id="saved"></span></div><div class="card"><label class="field" style="margin:0"><span>' + esc(t('What convinces me, and what I still wonder about')) + '</span><textarea id="r-note" placeholder="' + esc(t('Write freely. Only you can see this.')) + '">' + esc(m.note || '') + '</textarea></label>' +
    '<p class="small muted" style="margin:10px 0 0">' + esc(t('Saved only on this device.')) + '</p></div>';
  html += '<div class="btn-row" style="margin-top:18px"><button class="btn block ' + (m.done ? 'ok' : '') + '" id="r-done">' + (m.done ? icon('check') + esc(t('Thought through')) : icon('flame') + esc(t('I have thought this through'))) + '</button></div>';
  html += '<p class="small muted">' + esc(t('Still unsure? That is all right. Write the question in your journal and bring it to your catechist or sponsor. Keep praying, even simply: "God, if you are there, show me."')) + '</p>';
  if (nxt) html += '<a class="card row" style="margin-top:6px" href="#/reason/' + nxt.id + '"><span class="grow"><span class="eyebrow">' + esc(t('Next question')) + '</span><span class="title">' + esc(nxt.q) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  return {
    html, title: x.q,
    bind(root) {
      bindListen(root, 'rl', () => [x.q, t('In short') + '.', x.short, t('Step by step') + '.', ...x.steps, t('Fair objections') + '.', ...x.objections.flatMap(o => [o.o, o.r]), t('Think it through') + '.', x.think].flatMap(sentences), { gap: s => /[.!?؟]$/.test(s) ? 260 : 120 });
      let timer;
      root.querySelector('#r-note').oninput = e => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const note = e.target.value, cur = state.reason[x.id] || {};
          if (note || cur.done) state.reason[x.id] = { ...cur, note }; else delete state.reason[x.id];
          save(); const h = root.querySelector('#saved'); if (h) h.textContent = t('Saved');
        }, 400);
      };
      root.querySelector('#r-done').onclick = () => {
        const cur = state.reason[x.id] || {};
        if (cur.done) { delete cur.done; if (cur.note) state.reason[x.id] = cur; else delete state.reason[x.id]; }
        else { state.reason[x.id] = { ...cur, done: today() }; toast(t('Another step lit on your path')); }
        save(); rerender();
      };
    }
  };
}

// A short block for a Journey session page: the questions people often ask about that session's topic.
export function sessionBlock(sessionId) {
  const list = reasonFor(sessionId);
  if (!list.length) return '';
  return '<div class="section-title"><h2>' + esc(t('Questions people ask')) + '</h2><a class="small" href="#/reason">' + esc(t('Faith and reason')) + '</a></div><ul class="list card tight">' +
    list.map(x => topicRow(x)).join('') + '</ul>';
}
