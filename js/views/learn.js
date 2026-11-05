import { data, byId, mySaint } from '../data.js';
import { state, save, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, tile, acc, fmtDate } from '../ui.js';
import { season, seasonColor, upcoming } from '../liturgy.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));

export function view() {
  const html = head(t('Learn'), t('Learn the faith'), t('Guides for everything that can feel new: Mass, prayers, words, saints and the Church year.')) +
    '<div class="tiles">' +
    tile('#/mass', 'church', t('Mass guide'), t('Each part, and when to sit, stand or kneel')) +
    tile('#/basics', 'sparkle', t('First-week basics'), t('Holy water, genuflecting and more')) +
    tile('#/questions', 'question', t('Questions'), data.faq.length + ' ' + t('answers')) +
    tile('#/glossary', 'list', t('Glossary'), data.glossary.length + ' ' + t('Catholic words explained')) +
    tile('#/saint-quiz', 'star', t('Find my saint'), t('A short quiz to meet your patron')) +
    tile('#/saints', 'people', t('All saints'), t('Read their stories')) +
    tile('#/calendar', 'calendar', t('Church calendar'), t('Seasons and feast days')) +
    tile('#/welcome-back', 'door', t('Welcome back'), t('For anyone returning to the Church'), 'wide') +
    '</div>';
  return { html, title: t('Learn') };
}

export function questions() {
  let html = back('#/learn', t('Learn')) + head(t('Questions'), t('Common questions'), t('Questions people often ask when starting the journey. Bring yours to your catechist or sponsor too.')) +
    '<div class="search-wrap">' + icon('search') + '<input type="search" id="q" placeholder="' + esc(t('Search questions')) + '" aria-label="' + esc(t('Search questions')) + '"></div>' +
    '<div class="card tight" id="qa">' + data.faq.map(f => '<div data-text="' + esc((f.q + ' ' + f.a).toLowerCase()) + '">' + acc(f.q, '<p style="margin:0">' + esc(f.a) + '</p>') + '</div>').join('') + '</div>' +
    '<p class="empty" id="qa-empty" hidden>' + esc(t('No questions match. Try another word.')) + '</p>';
  return {
    html, title: t('Questions'),
    bind(root) {
      root.querySelector('#q').oninput = e => {
        const term = e.target.value.trim().toLowerCase(); let n = 0;
        root.querySelectorAll('#qa > div').forEach(d => { const m = !term || d.dataset.text.includes(term); d.hidden = !m; if (m) n++; });
        root.querySelector('#qa-empty').hidden = n > 0;
      };
    }
  };
}

const postureLabel = { stand: 'Stand', sit: 'Sit', kneel: 'Kneel', line: 'Communion line' };
export function mass() {
  const m = data.guides.mass;
  let html = back('#/learn', t('Learn')) + head(t('Learn'), t(m.title), m.intro);
  let group = '';
  m.parts.forEach(p => {
    if (p.group !== group) { if (group) html += '</div>'; group = p.group; html += '<div class="mass-group">' + esc(group) + '</div><div class="card tight">'; }
    html += '<details class="acc"><summary><span>' + esc(p.name) + '</span><span style="display:flex;gap:8px;align-items:center"><span class="posture ' + p.posture + '">' + esc(t(postureLabel[p.posture])) + '</span><span class="plus">' + icon('plus') + '</span></span></summary><div class="body"><p style="margin:0">' + esc(p.about) + '</p></div></details>';
  });
  html += '</div><p class="small muted">' + esc(m.note) + '</p>';
  return { html, title: t(m.title) };
}

export function basics() {
  const b = data.guides.basics;
  const html = back('#/learn', t('Learn')) + head(t('Learn'), t(b.title), b.intro) +
    '<div class="card tight">' + b.items.map((x, i) => acc(x.name, '<p style="margin:0">' + esc(x.about) + '</p>', i === 0)).join('') + '</div>';
  return { html, title: t(b.title) };
}

export function glossary() {
  const g = [...data.glossary].sort((a, b) => a.term.localeCompare(b.term));
  let html = back('#/learn', t('Learn')) + head(t('Learn'), t('Glossary'), t('Catholic words, explained simply.')) +
    '<div class="search-wrap">' + icon('search') + '<input type="search" id="g" placeholder="' + esc(t('Find a word')) + '" aria-label="' + esc(t('Find a word')) + '"></div><div class="card tight" id="gl">';
  g.forEach(x => { html += '<div class="cal-item" data-text="' + esc((x.term + ' ' + x.def).toLowerCase()) + '" style="display:block"><strong>' + esc(x.term) + '</strong><div class="muted small" style="margin-top:2px">' + esc(x.def) + '</div></div>'; });
  html += '</div>';
  return {
    html, title: t('Glossary'),
    bind(root) {
      root.querySelector('#g').oninput = e => {
        const term = e.target.value.trim().toLowerCase();
        root.querySelectorAll('#gl > div').forEach(d => { d.hidden = term && !d.dataset.text.includes(term); });
      };
    }
  };
}

const feastLabel = s => { const [m, d] = s.feast.split('-').map(Number); return new Date(2024, m - 1, d).toLocaleDateString(state.settings.lang === 'es' ? 'es' : 'en-US', { month: 'long', day: 'numeric' }); };

export function saints() {
  const S = data.saints;
  const picked = new Set();
  const mine = mySaint();
  let html = back('#/learn', t('Learn')) + head(t('Saints'), t('Choose a saint'), S.intro);
  if (mine) html += '<a class="card row" href="' + (mine.id ? '#/saint/' + mine.id : '#/saint-quiz') + '" style="text-decoration:none"><span class="lead" style="background:var(--accent-soft)">' + icon('star') + '</span><span class="grow"><span class="eyebrow">' + esc(t('My patron saint')) + '</span><span class="title">' + esc(mine.name) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  html += '<a class="card row" href="#/saint-quiz"><span class="lead">' + icon('sparkle') + '</span><span class="grow"><span class="title">' + esc(t('Find my saint')) + '</span><span class="sub">' + esc(t('A short quiz, and how to choose a Confirmation saint')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  html += '<div class="section-title"><h2>' + esc(t('What draws you?')) + '</h2></div><div class="chips" id="ints">' +
    S.interests.map(x => '<button class="chip" data-int="' + x.id + '" aria-pressed="false">' + esc(t(x.label)) + '</button>').join('') + '</div>' +
    '<div class="section-title"><h2 id="sh">' + esc(t('All saints')) + '</h2></div><ul class="list card tight" id="sl"></ul>';
  return {
    html, title: t('Choose a saint'),
    bind(root) {
      const draw = () => {
        let list = S.saints.map(s => ({ s, score: s.tags.filter(x => picked.has(x)).length }));
        if (picked.size) list = list.filter(x => x.score > 0).sort((a, b) => b.score - a.score);
        root.querySelector('#sh').textContent = picked.size ? t('Saints for you') : t('All saints');
        root.querySelector('#sl').innerHTML = list.map(({ s }) => '<li><a class="row" href="#/saint/' + s.id + '"><span class="lead">' + icon('star') + '</span><span class="grow"><span class="title">' + esc(s.name) + '</span><span class="sub">' + esc(t('Patron of')) + ' ' + esc(s.patron) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>').join('') || '<li class="empty">' + esc(t('No match yet')) + '</li>';
      };
      root.querySelectorAll('[data-int]').forEach(b => b.onclick = () => {
        const id = b.dataset.int; picked.has(id) ? picked.delete(id) : picked.add(id);
        b.classList.toggle('on', picked.has(id)); b.setAttribute('aria-pressed', picked.has(id)); draw();
      });
      draw();
    }
  };
}

export function saint(id) {
  const s = byId(data.saints.saints, id);
  if (!s) return { html: back('#/saints', t('Saints')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const mine = state.saint === s.id;
  const html = back('#/saints', t('Saints')) +
    '<header class="page-head"><div class="kicker">' + esc(t('Feast day')) + ': ' + esc(feastLabel(s)) + '</div><h1>' + esc(s.name) + '</h1><p class="muted">' + esc(s.years) + ' · ' + esc(t('Patron of')) + ' ' + esc(s.patron) + '</p></header>' +
    '<div class="reading"><p>' + esc(s.story) + '</p></div>' +
    '<div class="btn-row"><button class="btn block ' + (mine ? 'ok' : '') + '" id="pick">' + (mine ? icon('check') + esc(t('My patron saint')) : icon('star') + esc(t('Choose as my patron'))) + '</button></div>' +
    '<p class="small muted">' + esc(t('On your saint\'s feast day, Heartward will remind you on the Today page.')) + '</p>';
  return {
    html, title: s.name,
    bind(root) {
      root.querySelector('#pick').onclick = () => { state.saint = mine ? '' : s.id; save(); if (!mine) toast(t('Patron saint chosen')); rerender(); };
    }
  };
}

export function calendar() {
  const now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cur = data.calendar.seasons[season(now)];
  const ups = upcoming(data.calendar, data.saints.saints, d0, 75);
  let html = back('#/learn', t('Learn')) + head(t('Church year'), t('Church calendar'), data.calendar.note) +
    '<div class="card" style="border-left:6px solid ' + seasonColor[cur.color] + '"><div class="eyebrow">' + esc(t('Current season')) + '</div><h2 style="margin:0 0 4px">' + esc(t(cur.name)) + '</h2><p class="muted" style="margin:0">' + esc(cur.about) + '</p></div>' +
    '<div class="section-title"><h2>' + esc(t('Coming up')) + '</h2></div><div class="card tight">';
  ups.forEach(u => {
    const isToday = localISO(u.date) === localISO(d0);
    const inner = '<div class="cal-date"' + (isToday ? ' style="background:var(--accent-soft)"' : '') + '><div class="m">' + esc(u.date.toLocaleDateString(state.settings.lang === 'es' ? 'es' : 'en-US', { month: 'short' })) + '</div><div class="d">' + u.date.getDate() + '</div></div>' +
      '<div style="flex:1"><strong>' + esc(u.name) + '</strong><div class="small muted">' + esc(u.date.toLocaleDateString(state.settings.lang === 'es' ? 'es' : 'en-US', { weekday: 'long' })) +
      (u.obligation ? ' · <span class="tag gold">' + esc(t('Holy day of obligation')) + '</span>' : '') + (u.kind === 'saint' ? ' · ' + esc(t('Saint')) : '') + '</div></div>';
    html += u.saintId ? '<a class="cal-item" style="text-decoration:none;color:inherit" href="#/saint/' + u.saintId + '">' + inner + '</a>' : '<div class="cal-item">' + inner + '</div>';
  });
  html += '</div><div class="section-title"><h2>' + esc(t('The seasons')) + '</h2></div><div class="card tight">' +
    Object.values(data.calendar.seasons).map(s => '<div class="cal-item"><span style="width:14px;height:14px;border-radius:50%;flex:none;background:' + seasonColor[s.color] + ';box-shadow:0 0 0 1px var(--line)"></span><div><strong>' + esc(t(s.name)) + '</strong><div class="small muted">' + esc(s.about) + '</div></div></div>').join('') + '</div>' +
    '<p class="small muted">' + esc(t('Holy days of obligation can move when they fall on a Saturday or Monday. Check your parish bulletin.')) + '</p>';
  return { html, title: t('Church calendar') };
}
