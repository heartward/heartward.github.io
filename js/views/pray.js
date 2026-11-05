import { data, byId } from '../data.js';
import { state, save, SPANISH } from '../store.js';
import { canSpeak, speak, stop as stopSpeech, listenButton, bindListen } from '../speech.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, sources, tile, acc, download, ics } from '../ui.js';
import { rosaryForDay } from '../liturgy.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));

export function view() {
  const myst = data.guides.rosary.mysteries[rosaryForDay(data.guides, new Date())];
  let html = head(t('Pray'), t('Prayer'), t('Prayer is simply talking with God. Learn the prayers Catholics share, one at a time.'));
  html += '<div class="tiles">' +
    tile('#/rosary', 'rosary', t('Pray the Rosary'), t('Today') + ': ' + t(myst.name), 'dark wide') +
    tile('#/intentions', 'people', t('People I pray for'), state.intentions.filter(x => !x.answered).length ? state.intentions.filter(x => !x.answered).length + ' ' + t('intentions') : t('Names and needs to pray for')) +
    tile('#/examen', 'moon', t('Evening Examen'), t('Five minutes at bedtime')) +
    tile('#/stations', 'candle', t('Stations of the Cross'), t('Walk with Jesus to the cross')) +
    tile('#/readings', 'book', t('Today\'s readings'), t('The Mass readings for today')) +
    tile('#/confession', 'heart', t('Confession guide'), t('Steps and examination of conscience')) +
    tile('#/first-confession', 'check', t('First Confession'), t('Prepare step by step')) +
    tile('#/lectio', 'book', t('Sunday Gospel'), t('Pray it with Lectio Divina')) +
    tile('#/verse', 'sparkle', t('Memory verses'), t('Flashcards with audio')) +
    tile('#/reminder', 'bell', t('Daily reminder'), t('Add prayer time to your calendar')) +
    '</div>';
  const learned = data.prayers.filter(p => state.learned[p.id]).length;
  html += '<div class="section-title"><h2>' + esc(t('Prayers to learn')) + '</h2><span class="small muted">' + learned + ' / ' + data.prayers.length + ' ' + esc(t('learned')) + '</span></div>' +
    '<p class="small muted" style="margin:-4px 2px 8px">' + esc(t('Any of these prayers can begin and end with the Sign of the Cross, with or without holy water.')) + '</p>';
  const cats = [...new Set(data.prayers.map(p => p.category))];
  cats.forEach(c => {
    html += '<div class="eyebrow" style="margin:16px 2px 6px">' + esc(t(c)) + '</div><ul class="list card tight">';
    data.prayers.filter(p => p.category === c).forEach(p => {
      const l = !!state.learned[p.id];
      html += '<li><a class="row' + (l ? ' done' : '') + '" href="#/prayer/' + p.id + '"><span class="lead">' + (l ? icon('check') : icon('candle')) + '</span><span class="grow"><span class="title">' + esc(p.title) + '</span><span class="sub">' + esc(p.when) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>';
    });
    html += '</ul>';
  });
  return { html, title: t('Pray') };
}

export function practiceHtml(text, level) {
  if (!level) return esc(text);
  let n = 0;
  return text.split(/(\s+)/).map(tok => {
    if (!tok || /^\s+$/.test(tok)) return tok;
    n++;
    const hide = level >= 4 || ((n * 7) % 4) < level;
    return hide ? '<span class="hid" tabindex="0" role="button" aria-label="' + esc(t('hidden word, tap to reveal')) + '">' + esc(tok) + '</span>' : esc(tok);
  }).join('');
}

export function prayer(id) {
  const p = byId(data.prayers, id);
  if (!p) return { html: back('#/pray', t('Pray')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const es = SPANISH ? data.prayersEs[id] : null;
  let lang = state.settings.lang === 'es' && es ? 'es' : 'en';
  const l = !!state.learned[p.id];
  const textFor = () => lang === 'es' && es ? es.text : p.text;
  let html = back('#/pray', t('Pray')) + head(t(p.category), lang === 'es' && es ? es.title : p.title, p.when);
  if (es) html += '<div class="seg-control lang-toggle" role="group" aria-label="' + esc(t('Language')) + '"><button data-lang="en" aria-pressed="' + (lang === 'en') + '">English</button><button data-lang="es" aria-pressed="' + (lang === 'es') + '">Español</button></div>';
  html += '<div class="card"><div class="prayer-text" id="ptext">' + esc(textFor()) + '</div></div>' +
    (canSpeak ? '<div class="listen-row">' + listenButton('say', t('Listen')) + listenButton('rep', t('Say it after me'), 'ghost') + '</div>' +
      '<p class="small muted" style="margin:-4px 2px 14px">' + esc(t('"Say it after me" reads one line, then pauses so you can repeat it out loud.')) + '</p>' : '') +
    '<div class="card flat"><label class="field" style="margin:0"><span>' + esc(t('Practice mode: hide words')) + ' <span id="lvl-name">(' + esc(t('off')) + ')</span></span>' +
    '<input type="range" id="lvl" min="0" max="4" step="1" value="0" style="width:100%;accent-color:var(--accent)"></label>' +
    '<p class="small muted" style="margin:6px 0 0">' + esc(t('Say the prayer from memory. Tap a blank to peek.')) + '</p></div>' +
    '<div class="section-title"><h2>' + esc(t('What it means')) + '</h2></div><p>' + esc(p.meaning) + '</p>' +
    sources(p.sources) +
    '<div class="btn-row" style="margin-top:22px"><button class="btn block ' + (l ? 'ok' : '') + '" id="learned">' + (l ? icon('check') + esc(t('I know this by heart')) : esc(t('Mark as learned'))) + '</button></div>';
  return {
    html, title: p.title,
    bind(root) {
      const names = ['off', 'a few', 'half', 'most', 'all'];
      const lvl = root.querySelector('#lvl'), out = root.querySelector('#ptext');
      const draw = () => { out.innerHTML = practiceHtml(textFor(), +lvl.value); root.querySelector('#lvl-name').textContent = '(' + t(names[+lvl.value]) + ')'; };
      lvl.oninput = draw;
      const lines = () => textFor().split('\n');
      bindListen(root, 'say', lines, { gap: () => 120 });
      // Pause after each line for about as long as it takes to say it again.
      bindListen(root, 'rep', lines, { gap: l => 900 + l.split(/\s+/).length * 480 * ({ slow: 1.3, fast: .85 }[state.settings.rate] || 1) });
      out.onclick = e => { if (e.target.classList.contains('hid')) e.target.classList.toggle('peek'); };
      out.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('hid')) { e.preventDefault(); e.target.classList.toggle('peek'); } };
      root.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
        lang = b.dataset.lang; root.querySelectorAll('[data-lang]').forEach(x => x.setAttribute('aria-pressed', x === b));
        root.querySelector('h1').textContent = lang === 'es' && es ? es.title : p.title; draw();
      });
      root.querySelector('#learned').onclick = () => {
        if (state.learned[p.id]) delete state.learned[p.id]; else { state.learned[p.id] = true; toast(t('Learned by heart')); }
        save(); rerender();
      };
    }
  };
}

// ---------- Rosary ----------
function rosarySteps(key) {
  const m = data.guides.rosary.mysteries[key];
  const P = id => byId(data.prayers, id);
  const steps = [
    { p: 'sign-of-the-cross', bead: null }, { p: 'apostles-creed', bead: 'cross' }, { p: 'our-father', bead: 'big' },
    { p: 'hail-mary', bead: 'small', note: t('For an increase of faith') }, { p: 'hail-mary', bead: 'small', note: t('For an increase of hope') },
    { p: 'hail-mary', bead: 'small', note: t('For an increase of love') }, { p: 'glory-be', bead: null }
  ];
  m.items.forEach((name, d) => {
    steps.push({ announce: true, decade: d, name });
    steps.push({ p: 'our-father', bead: 'big', decade: d, name });
    for (let i = 0; i < 10; i++) steps.push({ p: 'hail-mary', bead: 'small', decade: d, name, count: i + 1 });
    steps.push({ p: 'glory-be', bead: null, decade: d, name }, { p: 'fatima-prayer', bead: null, decade: d, name });
  });
  steps.push({ p: 'hail-holy-queen', bead: null }, { p: 'prayer-after-rosary', bead: null }, { p: 'sign-of-the-cross', bead: null, end: true });
  steps.forEach(s => { if (s.p) s.prayer = P(s.p); });
  return { steps, m };
}

export function rosary(key) {
  const def = rosaryForDay(data.guides, new Date());
  key = data.guides.rosary.mysteries[key] ? key : def;
  const { steps, m } = rosarySteps(key);
  const beadIdx = steps.map((s, i) => s.bead ? i : -1).filter(i => i >= 0);
  let i = 0, showWords = true, aloud = canSpeak && !!state.settings.rosaryAloud;
  const r = data.guides.rosary;
  const html = back('#/pray', t('Pray')) +
    '<header class="page-head"><div class="kicker">' + esc(t(m.name)) + ' · ' + esc(t(m.days)) + '</div><h1>' + esc(t(r.title)) + '</h1></header>' +
    '<div class="chips" style="margin-bottom:12px">' + Object.entries(r.mysteries).map(([k, v]) => '<a class="chip' + (k === key ? ' on' : '') + '" href="#/rosary/' + k + '">' + esc(t(v.name.replace(' Mysteries', ''))) + '</a>').join('') + '</div>' +
    '<details class="card flat acc" style="padding:0 16px"><summary><span>' + esc(t('How to pray the Rosary')) + '</span><span class="plus">' + icon('plus') + '</span></summary><div class="body"><p>' + esc(r.intro) + '</p></div></details>' +
    '<div class="beads" id="beads" aria-hidden="true"></div><div class="rosary-stage" id="stage" aria-live="polite"></div>' +
    '<label class="check small"><input type="checkbox" id="words" checked> ' + esc(t('Show the words of each prayer')) + '</label>' +
    (canSpeak ? '<label class="check small"><input type="checkbox" id="aloud"' + (state.settings.rosaryAloud ? ' checked' : '') + '> ' + esc(t('Read each prayer aloud')) + '</label>' : '') +
    // The buttons stay pinned just above the tabs, so they never move between short and long prayers.
    '<div class="rosary-nav"><div class="in"><button class="btn ghost" id="prev">' + icon('back') + esc(t('Back')) + '</button><button class="btn" id="next">' + esc(t('Next')) + icon('chevron') + '</button></div></div><div class="rosary-pad"></div>';
  return {
    html, title: t('Rosary'),
    bind(root) {
      const stage = root.querySelector('#stage'), beads = root.querySelector('#beads');
      const draw = () => {
        const s = steps[i];
        beads.innerHTML = beadIdx.map(bi => '<span class="bead' + (steps[bi].bead === 'big' || steps[bi].bead === 'cross' ? ' big' : '') + (bi < i ? ' done' : bi === i ? ' now' : '') + '"></span>').join('');
        let h = '';
        if (s.name != null) h += '<div class="mystery">' + esc(t(['First', 'Second', 'Third', 'Fourth', 'Fifth'][s.decade])) + ' ' + esc(t('Mystery')) + ': ' + esc(s.name) + '</div>';
        if (s.announce) h += '<h2>' + esc(s.name) + '</h2><p class="muted">' + esc(t('Take a moment to picture this scene from the life of Jesus. Then begin the decade.')) + '</p>';
        else {
          h += '<h2>' + esc(s.prayer.title) + (s.count ? ' <span class="muted" style="font-size:.7em">' + s.count + '/10</span>' : '') + '</h2>';
          if (s.note) h += '<p class="muted">' + esc(s.note) + '</p>';
          if (showWords) h += '<div class="prayer-text">' + esc(s.prayer.text) + '</div>';
        }
        if (s.end) h += '<p class="muted" style="margin-top:14px">' + esc(t('You have finished the Rosary. Well done.')) + '</p>';
        stage.innerHTML = h;
        if (aloud) speak(s.announce ? [t(['First', 'Second', 'Third', 'Fourth', 'Fifth'][s.decade]) + ' ' + t('Mystery') + ': ' + s.name + '.'] : [s.prayer.title + '.'].concat(s.prayer.text.split('\n')), { gap: () => 120 });
        root.querySelector('#prev').disabled = i === 0;
        root.querySelector('#next').innerHTML = s.end ? icon('check') + esc(t('Finish')) : esc(t('Next')) + icon('chevron');
      };
      root.querySelector('#prev').onclick = () => { if (i > 0) { i--; draw(); } };
      root.querySelector('#next').onclick = () => { if (i < steps.length - 1) { i++; draw(); } else { toast(t('Rosary complete')); location.hash = '#/pray'; } };
      root.querySelector('#words').onchange = e => { showWords = e.target.checked; draw(); };
      const al = root.querySelector('#aloud');
      if (al) al.onchange = e => { aloud = e.target.checked; state.settings.rosaryAloud = aloud; save(); if (aloud) draw(); else stopSpeech(); };
      draw();
    }
  };
}

// ---------- Confession ----------
export function confession() {
  const c = data.guides.confession;
  let html = back('#/pray', t('Pray')) + head(t('Reconciliation'), t(c.title), c.intro);
  html += '<div class="section-title"><h2>' + esc(t('Step by step')) + '</h2></div><ol class="road">' +
    c.steps.map((s, i) => '<li><div class="stop"><span class="node">' + (i + 1) + '</span><span class="info"><span class="title">' + esc(s.name) + '</span><span class="sub" style="color:var(--text)">' + esc(s.about) + '</span></span></div></li>').join('') + '</ol>';
  html += '<div class="section-title"><h2>' + esc(t('Examination of conscience')) + '</h2></div><p class="small muted">' + esc(c.privacy) + '</p>';
  c.examination.forEach(g => {
    html += '<div class="card tight"><div class="eyebrow" style="margin-top:12px">' + esc(g.heading) + '</div>' +
      g.questions.map(q => '<label class="check"><input type="checkbox"> <span>' + esc(q) + '</span></label>').join('') + '</div>';
  });
  html += '<a class="btn soft block" href="#/prayer/act-of-contrition">' + esc(t('Act of Contrition')) + '</a>';
  return { html, title: t(c.title) };
}

// ---------- Reminder (calendar file) ----------
export function reminder() {
  let html = back('#/pray', t('Pray')) + head(t('Reminders'), t('Daily reminder'), t('Heartward has no server, so it uses your own phone calendar to remind you. Pick a time, download the event, and open it to add it to your calendar.'));
  html += '<div class="card"><label class="field"><span>' + esc(t('Daily prayer time')) + '</span><input type="time" id="rtime" value="' + esc(state.settings.reminder) + '"></label>' +
    '<button class="btn block" id="daily">' + icon('bell') + esc(t('Add daily prayer reminder')) + '</button></div>' +
    '<div class="card"><h2 class="h3">' + esc(t('Sunday Mass')) + '</h2><p class="muted small">' + esc(t('A weekly reminder on Saturday evening to plan for Sunday Mass.')) + '</p>' +
    '<button class="btn ghost block" id="sunday">' + icon('calendar') + esc(t('Add weekly Mass reminder')) + '</button></div>' +
    '<p class="small muted">' + esc(t('Anniversary reminders for your baptism and other dates are in Me > My dates.')) + '</p>';
  return {
    html, title: t('Daily reminder'),
    bind(root) {
      const now = new Date();
      root.querySelector('#daily').onclick = () => {
        state.settings.reminder = root.querySelector('#rtime').value || '08:00'; save();
        download('heartward-daily-prayer.ics', ics([{ date: now, time: state.settings.reminder, rrule: 'FREQ=DAILY', title: t('Time to pray'), desc: t('A few minutes with God. Open Heartward: https://heartward.github.io'), alarm: true }]), 'text/calendar');
        toast(t('Open the downloaded file to add it'));
      };
      root.querySelector('#sunday').onclick = () => {
        const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((6 - now.getDay() + 7) % 7));
        download('heartward-sunday-mass.ics', ics([{ date: sat, time: '18:00', rrule: 'FREQ=WEEKLY;BYDAY=SA', title: t('Plan for Sunday Mass'), desc: t('Check your parish Mass times and read the Sunday Gospel.'), alarm: true }]), 'text/calendar');
        toast(t('Open the downloaded file to add it'));
      };
    }
  };
}
