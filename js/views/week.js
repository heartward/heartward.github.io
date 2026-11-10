// Weekly activities for each RCIA session: memory verse, Bible study, quiz, discussion,
// Sunday Gospel with Lectio Divina, saint of the week, weekly challenge, and first Confession preparation.
import { data, byId } from '../data.js';
import { state, save, weekKey, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, fmtDate, safeUrl } from '../ui.js';
import { nextSession, sessionNo } from './journey.js';
import { practiceHtml } from './pray.js';
import { canSpeak, listenButton, bindListen, sentences } from '../speech.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const study = id => (data.study.sessions || {})[id] || null;
const ext = (href, label) => '<a class="btn soft sm" href="' + esc(safeUrl(href)) + '" target="_blank" rel="noopener">' + esc(label) + icon('external') + '</a>';
const weekNo = (d = new Date()) => Math.floor(new Date(weekKey(d) + 'T12:00:00').getTime() / (7 * 864e5));

// The session this week's activities follow: the next one not yet done, or the last one.
export const currentSession = () => nextSession() || data.sessionList[data.sessionList.length - 1];
export const saintOfWeek = () => data.saints.saints[((weekNo() % data.saints.saints.length) + data.saints.saints.length) % data.saints.saints.length];
export const challengeOfWeek = () => { const c = data.study.challenges; return c[((weekNo() % c.length) + c.length) % c.length]; };
export function nextSunday(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + ((7 - x.getDay()) % 7)); return x; }
const readingsUrl = d => { const z = n => String(n).padStart(2, '0'); return 'https://universalis.com/canada/' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '/mass.htm'; };

// ---------- This week (hub) ----------
export function week(id) {
  const s = (id && byId(data.sessionList, id)) || currentSession();
  const st = study(s.id) || {};
  const wk = weekKey(), saint = saintOfWeek(), ch = challengeOfWeek(), sun = nextSunday();
  const best = state.quiz[s.id];
  let html = back(id ? '#/session/' + s.id : '#/', id ? t('Session') : t('Today')) +
    head(t('This week') + ' · ' + t('Session') + ' ' + sessionNo(s), s.title, t('Everything to live this week\'s class: a verse to learn, a passage to study, questions to talk about, and small ways to practice.'));

  if (st.verse) html += '<section class="card verse-card"><div class="eyebrow">' + esc(t('Memory verse')) + '</div>' +
    '<blockquote class="verse">' + esc(st.verse.text) + '<cite>' + esc(st.verse.ref) + ' (Douay-Rheims)</cite></blockquote>' +
    '<div class="btn-row" style="margin:12px 0 0">' + listenButton('vlisten', t('Listen'), 'soft sm') + '<a class="btn ghost sm" href="#/verse/' + s.id + '">' + icon('sparkle') + esc(t('Practice with flashcards')) + '</a></div></section>';

  if (st.bible) {
    const notes = (state.study[s.id] || {}).notes || '';
    html += '<div class="section-title"><h2>' + esc(t('Bible study')) + '</h2></div><section class="card">' +
      '<div class="eyebrow">' + esc(st.bible.ref) + '</div><p style="margin:4px 0 12px">' + esc(st.bible.intro) + '</p>' + ext(st.bible.url, t('Read the passage')) +
      '<ol class="qs">' + st.bible.questions.map(q => '<li>' + esc(q) + '</li>').join('') + '</ol>' +
      '<label class="field" style="margin:0"><span>' + esc(t('My notes')) + ' <span class="saved-hint" id="bsaved"></span></span><textarea id="bnotes" placeholder="' + esc(t('What is God saying to you in this passage?')) + '">' + esc(notes) + '</textarea></label></section>';
  }

  html += '<div class="section-title"><h2>' + esc(t('Review')) + '</h2></div><div class="tiles">' +
    (st.quiz ? '<a class="tile" href="#/quiz/' + s.id + '"><span class="ti">' + icon('question') + '</span><span><span class="tt">' + esc(t('Quiz')) + '</span><br><span class="ts">' + esc(best != null ? t('Best') + ': ' + best + '/' + st.quiz.length : st.quiz.length + ' ' + t('questions')) + '</span></span></a>'
      : '<div class="tile flat"><span class="ti">' + icon('question') + '</span><span><span class="tt">' + esc(t('Quiz')) + '</span><br><span class="ts">' + esc(t('Comes when this lesson is written')) + '</span></span></div>') +
    '<a class="tile" href="#/session/' + s.id + '"><span class="ti">' + icon('book') + '</span><span><span class="tt">' + esc(t('The lesson')) + '</span><br><span class="ts">' + esc(t('Read or listen again')) + '</span></span></a></div>';

  if (st.discuss) html += '<div class="section-title"><h2>' + esc(t('Talk it over')) + '</h2><button class="linkish" id="dshare">' + esc(t('Send to my sponsor')) + '</button></div>' +
    '<section class="card"><p class="small muted" style="margin:0 0 6px">' + esc(t('For class, your sponsor, or a friend on the journey.')) + '</p><ul class="lesson-list">' + st.discuss.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul></section>';

  html += '<div class="section-title"><h2>' + esc(t('Sunday Gospel')) + '</h2></div><a class="card row" href="#/lectio"><span class="lead">' + icon('book') + '</span><span class="grow"><span class="title">' + esc(fmtDate(sun)) + '</span><span class="sub">' + esc(t('Pray this Sunday\'s Gospel with Lectio Divina, in four quiet steps')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';

  const done = !!state.challenges[wk];
  html += '<div class="section-title"><h2>' + esc(t('This week\'s challenge')) + '</h2></div><section class="card challenge' + (done ? ' done' : '') + '"><h3>' + esc(ch.title) + '</h3><p>' + esc(ch.body) + '</p>' +
    '<button class="btn sm ' + (done ? 'ok' : 'soft') + '" id="chdone" aria-pressed="' + done + '">' + (done ? icon('check') + esc(t('Done')) : esc(t('Mark as done'))) + '</button></section>';

  html += '<div class="section-title"><h2>' + esc(t('Saint of the week')) + '</h2></div><section class="card"><a href="#/saint/' + saint.id + '" class="saint-link"><strong>' + esc(saint.name) + '</strong></a>' +
    '<div class="small muted">' + esc(t('Patron of')) + ' ' + esc(saint.patron) + '</div><p style="margin:10px 0">' + esc(saint.story) + '</p>' +
    '<div class="action"><span class="eyebrow">' + esc(t('Small action')) + '</span><p style="margin:2px 0 0">' + esc((data.study.saintActions || {})[saint.id] || t('Ask this saint to pray for you every day this week.')) + '</p></div></section>';

  html += '<a class="card row" style="margin-top:18px" href="#/first-confession"><span class="lead">' + icon('heart') + '</span><span class="grow"><span class="title">' + esc(t('Prepare for your first Confession')) + '</span><span class="sub">' + esc(t('A gentle step-by-step examination of conscience')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';

  return {
    html, title: t('This week'),
    bind(root) {
      if (st.verse) bindListen(root, 'vlisten', () => [st.verse.ref + '.', ...sentences(st.verse.text)]);
      const ta = root.querySelector('#bnotes');
      if (ta) { let timer; ta.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { state.study[s.id] = { notes: ta.value }; save(); root.querySelector('#bsaved').textContent = t('Saved'); }, 400); }; }
      root.querySelector('#chdone').onclick = () => { if (state.challenges[wk]) delete state.challenges[wk]; else { state.challenges[wk] = true; toast(t('Well done')); } save(); rerender(); };
      const ds = root.querySelector('#dshare');
      if (ds) ds.onclick = () => {
        const text = s.title + '\n\n' + st.discuss.map((q, i) => (i + 1) + '. ' + q).join('\n');
        if (navigator.share) navigator.share({ title: s.title, text }).catch(() => {});
        else (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t('Copied'))).catch(() => {});
      };
    }
  };
}

// ---------- Memory verse flashcards ----------
export function verse(id) {
  const list = data.sessionList.filter(s => study(s.id) && study(s.id).verse);
  let i = Math.max(0, list.findIndex(s => s.id === (id || currentSession().id)));
  const html = back('#/week', t('This week')) + head(t('Memory verses'), t('Flashcards'), t('Tap the card to turn it over. Say the verse, then check yourself.')) +
    '<div class="flash-wrap"><button class="flashcard" id="card" aria-live="polite"></button></div>' +
    '<div class="card flat"><label class="field" style="margin:0"><span>' + esc(t('Hide words')) + ' <span id="lvl-name"></span></span><input type="range" id="lvl" min="0" max="4" step="1" value="0" style="width:100%;accent-color:var(--accent)"></label></div>' +
    '<div class="btn-row">' + listenButton('vsay', t('Listen'), 'soft') + '<button class="btn ghost" id="known"></button></div>' +
    '<div class="rosary-nav"><div class="in"><button class="btn ghost" id="prev">' + icon('back') + esc(t('Previous')) + '</button><button class="btn" id="next">' + esc(t('Next')) + icon('chevron') + '</button></div></div><div class="rosary-pad"></div>';
  return {
    html, title: t('Flashcards'),
    bind(root) {
      let flipped = false;
      const card = root.querySelector('#card'), lvl = root.querySelector('#lvl'), names = ['off', 'a few', 'half', 'most', 'all'];
      const draw = () => {
        const s = list[i], v = study(s.id).verse;
        card.classList.toggle('back', flipped);
        card.innerHTML = flipped
          ? '<span class="prayer-text">' + practiceHtml(v.text, +lvl.value) + '</span><span class="ref">' + esc(v.ref) + '</span>' + (v.note ? '<span class="note">' + esc(v.note) + '</span>' : '')
          : '<span class="eyebrow">' + esc(t('Session')) + ' ' + sessionNo(s) + ' · ' + (i + 1) + '/' + list.length + '</span><span class="ref big">' + esc(v.ref) + '</span><span class="small muted">' + esc(s.title) + '</span><span class="hint">' + esc(t('Tap to see the verse')) + '</span>';
        card.setAttribute('aria-label', flipped ? v.ref + ': ' + v.text : v.ref + '. ' + t('Tap to see the verse'));
        root.querySelector('#lvl-name').textContent = '(' + t(names[+lvl.value]) + ')';
        const k = !!state.verses[s.id];
        root.querySelector('#known').innerHTML = k ? icon('check') + esc(t('I know this one')) : esc(t('Mark as known'));
        root.querySelector('#known').className = 'btn ' + (k ? 'ok' : 'ghost');
        root.querySelector('#prev').disabled = i === 0; root.querySelector('#next').disabled = i === list.length - 1;
      };
      card.onclick = e => { if (e.target.classList.contains('hid')) { e.target.classList.toggle('peek'); return; } flipped = !flipped; draw(); };
      lvl.oninput = () => { flipped = true; draw(); };
      root.querySelector('#prev').onclick = () => { if (i > 0) { i--; flipped = false; draw(); } };
      root.querySelector('#next').onclick = () => { if (i < list.length - 1) { i++; flipped = false; draw(); } };
      root.querySelector('#known').onclick = () => { const id = list[i].id; if (state.verses[id]) delete state.verses[id]; else { state.verses[id] = true; toast(t('Learned by heart')); } save(); draw(); };
      bindListen(root, 'vsay', () => { const v = study(list[i].id).verse; return [v.ref + '.', ...sentences(v.text)]; });
      draw();
    }
  };
}

// ---------- Review quiz ----------
export function quiz(id) {
  const s = byId(data.sessionList, id), st = s && study(s.id);
  if (!st || !st.quiz) return { html: back('#/week', t('This week')) + '<p class="empty">' + esc(t('No quiz for this session yet.')) + '</p>' };
  const html = back('#/week/' + s.id, t('This week')) + head(t('Quiz') + ' · ' + t('Session') + ' ' + sessionNo(s), s.title, t('A quick check, just for you. Nobody else sees your score.')) +
    '<div id="qz" aria-live="polite"></div>';
  return {
    html, title: t('Quiz'),
    bind(root) {
      let i = 0, score = 0, answered = false;
      const box = root.querySelector('#qz');
      const draw = () => {
        if (i >= st.quiz.length) {
          const prev = state.quiz[s.id];
          if (prev == null || score > prev) { state.quiz[s.id] = score; save(); }
          box.innerHTML = '<section class="card center"><div class="quiz-score">' + score + '/' + st.quiz.length + '</div><p>' + esc(score === st.quiz.length ? t('Perfect. Well done!') : t('Good work. Read the lesson again and try once more whenever you like.')) + '</p>' +
            '<div class="btn-row" style="justify-content:center"><button class="btn" id="again">' + esc(t('Try again')) + '</button><a class="btn ghost" href="#/week/' + s.id + '">' + esc(t('Back to this week')) + '</a></div></section>';
          root.querySelector('#again').onclick = () => { i = 0; score = 0; answered = false; draw(); };
          return;
        }
        const q = st.quiz[i];
        box.innerHTML = '<section class="card"><div class="eyebrow">' + esc(t('Question')) + ' ' + (i + 1) + '/' + st.quiz.length + '</div><h2 class="h3" style="margin:6px 0 12px">' + esc(q.q) + '</h2>' +
          '<div class="opts">' + q.options.map((o, k) => '<button class="opt" data-k="' + k + '">' + esc(o) + '</button>').join('') + '</div><div id="why"></div></section>';
        box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
          if (answered) return; answered = true;
          const k = +b.dataset.k, right = k === q.a; if (right) score++;
          box.querySelectorAll('.opt').forEach(x => { const xk = +x.dataset.k; x.disabled = true; if (xk === q.a) x.classList.add('right'); else if (xk === k) x.classList.add('wrong'); });
          box.querySelector('#why').innerHTML = '<p class="feedback ' + (right ? 'ok' : 'no') + '"><strong>' + esc(right ? t('Right.') : t('Not quite.')) + '</strong> ' + esc(q.why) + '</p>' +
            '<button class="btn block" id="qnext">' + esc(i === st.quiz.length - 1 ? t('See my score') : t('Next question')) + '</button>';
          root.querySelector('#qnext').onclick = () => { i++; answered = false; draw(); };
          root.querySelector('#qnext').focus();
        });
      };
      draw();
    }
  };
}

// ---------- Sunday Gospel with Lectio Divina ----------
export function lectio() {
  const L = data.study.lectio, sun = nextSunday(), key = localISO(sun);
  const notes = state.lectio[key] || [];
  let html = back('#/week', t('This week')) + head(t('Sunday Gospel'), t('Lectio Divina'), L.intro) +
    '<section class="card"><div class="eyebrow">' + esc(fmtDate(sun)) + '</div><p style="margin:4px 0 12px">' + esc(t('Open this Sunday\'s readings and find the Gospel (the last reading).')) + '</p>' + ext(readingsUrl(sun), t('Open Sunday\'s readings')) + '</section>';
  html += '<ol class="road lectio">' + L.steps.map((s, i) => '<li><div class="stop"><span class="node">' + (i + 1) + '</span><span class="info"><span class="title">' + esc(s.name) + ' <span class="muted small">(' + esc(s.latin) + ')</span></span>' +
    '<span class="sub" style="color:var(--text)">' + esc(s.how) + '</span>' +
    '<label class="field" style="margin:10px 0 0"><span class="small muted">' + esc(s.prompt) + '</span><textarea data-i="' + i + '" style="min-height:64px">' + esc(notes[i] || '') + '</textarea></label></span></div></li>').join('') + '</ol>' +
    '<p class="small muted"><span id="lsaved"></span> ' + esc(t('Your notes are saved only on this device, for this Sunday.')) + '</p>';
  return {
    html, title: t('Lectio Divina'),
    bind(root) {
      let timer;
      root.querySelectorAll('textarea[data-i]').forEach(ta => ta.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { const arr = state.lectio[key] || []; arr[+ta.dataset.i] = ta.value; state.lectio[key] = arr; save(); root.querySelector('#lsaved').textContent = t('Saved.'); }, 400);
      });
    }
  };
}

// ---------- First Confession ----------
export function firstConfession() {
  const F = data.study.firstConfession, ex = data.guides.confession.examination;
  let html = back('#/week', t('This week')) + head(t('Reconciliation'), t('Prepare for your first Confession'), F.intro) +
    '<div class="section-title"><h2>' + esc(t('Before')) + '</h2></div><ol class="steps card">' + F.before.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    '<div class="section-title"><h2>' + esc(t('Examination of conscience')) + '</h2></div>';
  ex.forEach((g, gi) => {
    html += '<section class="card exam"><h3>' + esc(g.heading) + '</h3>' + g.questions.map((q, qi) => '<label class="check exam-q"><input type="checkbox" data-q="' + gi + '-' + qi + '"> <span>' + esc(q) + '</span></label>').join('') + '</section>';
  });
  html += '<section class="card my-list" id="mylist" hidden><div class="eyebrow">' + esc(t('To remember')) + '</div><ul class="lesson-list" id="mylist-items"></ul><p class="small muted" style="margin:6px 0 0">' + esc(t('This list is not saved. It disappears when you leave this page.')) + '</p></section>' +
    '<div class="section-title"><h2>' + esc(t('In the confessional')) + '</h2></div><ol class="steps card">' + F.say.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    '<a class="card row" href="#/prayer/act-of-contrition"><span class="lead">' + icon('candle') + '</span><span class="grow"><span class="title">' + esc(t('Act of Contrition')) + '</span><span class="sub">' + esc(t('Learn it, or bring the words with you')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>' +
    '<div class="section-title"><h2>' + esc(t('After')) + '</h2></div><ol class="steps card">' + F.after.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
  return {
    html, title: t('First Confession'),
    bind(root) {
      const list = root.querySelector('#mylist'), items = root.querySelector('#mylist-items');
      root.querySelectorAll('input[data-q]').forEach(cb => cb.onchange = () => {
        const picked = [...root.querySelectorAll('input[data-q]:checked')].map(x => x.nextElementSibling.textContent);
        items.innerHTML = picked.map(p => '<li>' + esc(p) + '</li>').join(''); list.hidden = !picked.length;
      });
    }
  };
}
