import { data } from '../data.js';
import { icon } from '../icons.js';
import { esc, t, head } from '../ui.js';
import { lessonText } from '../figures.js';
import { SPANISH, state } from '../store.js';
import { allStudies } from './bible.js';

// Lower case, and for Persian: one form of ye and kaf, no short vowels or half-spaces, Persian digits as ASCII.
const norm = s => String(s).toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ة]/g, 'ه').replace(/[\u064B-\u065F\u0670\u200c\u200f\u200e]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// One search across everything bundled with the app. All local, so it works offline.
function index() {
  const items = [];
  const add = (group, ic, href, title, sub, body) => items.push({ group, ic, href, title, sub, hay: norm(title + ' ' + (sub || '') + ' ' + (body || '')) });
  data.sessionList.forEach(s => add('Sessions', 'road', '#/session/' + s.id, s.title, s.summary, lessonText(s.lesson) + ' ' + (s.deeper || []).map(d => d.title + ' ' + lessonText(d.text.split('\n\n'))).join(' ') + ' ' + (s.reflection || '') + ' ' + (s.ref || '')));
  data.prayers.forEach(p => {
    // The English text is searchable too when the app is in Persian, and the Spanish when Spanish is on.
    const es = SPANISH ? (data.prayersEs || {})[p.id] : (state.settings.lang === 'fa' ? (data.prayersEn || {})[p.id] : null);
    add('Prayers', 'candle', '#/prayer/' + p.id, p.title, p.when, p.text + (es ? ' ' + es.title + ' ' + es.text : ''));
  });
  data.faq.forEach(f => add('Questions', 'question', '#/questions', f.q, f.a, ''));
  data.glossary.forEach(g => add('Words', 'list', '#/glossary', g.term, g.def, ''));
  data.saints.saints.forEach(s => add('Saints', 'star', '#/saint/' + s.id, s.name, t('Patron of') + ' ' + s.patron, s.story + ' ' + s.tags.join(' ')));
  const g = data.guides;
  g.mass.parts.forEach(p => add('Guides', 'church', '#/mass', p.name, g.mass.title, p.about));
  g.basics.items.forEach(x => add('Guides', 'sparkle', '#/basics', x.name, g.basics.title, x.about));
  add('Guides', 'heart', '#/confession', t('Confession guide'), t('Steps and examination of conscience'), g.confession.intro + ' ' + g.confession.steps.map(s => s.name + ' ' + s.about).join(' '));
  add('Guides', 'rosary', '#/rosary', t('Pray the Rosary'), t('Step by step'), Object.values(g.rosary.mysteries).map(m => m.name + ' ' + m.items.join(' ') + ' ' + (m.details || []).map(x => x.fruit + ' ' + x.ref).join(' ')).join(' '));
  add('Guides', 'door', '#/welcome-back', t(data.paths.welcomeBack.title), data.paths.welcomeBack.intro, data.paths.welcomeBack.steps.map(s => s.title + ' ' + s.body).join(' '));
  add('Bible study', 'book', '#/bible', t('Bible study'), t('Reading plans, the Bible text, and a guide'), data.bible.intro);
  add('Bible study', 'sparkle', '#/bible-guide', t('Start here: how to read the Bible'), t('Bible study'), data.bible.guide.map(g => g.title + ' ' + g.body.join(' ')).join(' '));
  data.year.books.forEach(b => { const g = data.books[b.name]; if (g) add('Bible study', 'book', '#/bible-read/' + b.id + '/1', b.name + (b.dr !== b.name ? ' (' + b.dr + ')' : ''), g.kind, [g.about, g.look, g.christ, g.outline.map(o => o[1]).join(' ')].join(' ')); });
  add('Bible study', 'book', '#/bible-year', t('The whole Bible in a year'), t('All 73 books, a little each day'), '');
  allStudies().forEach(st => add('Bible study', 'book', '#/bible/' + st.id, st.ref, st.title + ' · ' + data.bible.plans[st.plan].title, [st.intro, st.understand, st.live, (st.questions || []).join(' '), ((data.scripture.passages || {})[st.ref] || []).map(v => v[1]).join(' ')].join(' ')));
  data.paths.firstYear.months.forEach(m => add('Guides', 'sparkle', '#/first-year', m.title, t(data.paths.firstYear.title), m.lesson + ' ' + m.practice));
  return items;
}

const GROUPS = ['Sessions', 'Bible study', 'Prayers', 'Questions', 'Words', 'Saints', 'Guides'];
let cache = null;

function results(q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (q.trim().length < 2) return '<p class="empty">' + esc(t('Type at least two letters.')) + '</p>';
  cache = cache || index();
  const hits = cache.filter(x => words.every(w => x.hay.includes(w)))
    .map(x => ({ ...x, score: words.reduce((n, w) => n + (norm(x.title).includes(w) ? 2 : 0), 0) }))
    .sort((a, b) => b.score - a.score);
  if (!hits.length) return '<p class="empty">' + esc(t('Nothing found. Try a shorter or different word.')) + '</p>';
  let html = '<p class="small muted" style="margin:0 2px 8px">' + hits.length + ' ' + esc(t('results')) + '</p>';
  GROUPS.forEach(gname => {
    const list = hits.filter(h => h.group === gname).slice(0, 12);
    if (!list.length) return;
    html += '<div class="eyebrow" style="margin:16px 2px 6px">' + esc(t(gname)) + '</div><ul class="list card tight">' +
      list.map(h => '<li><a class="row" href="' + h.href + '"><span class="lead">' + icon(h.ic) + '</span><span class="grow"><span class="title">' + esc(h.title) + '</span>' +
        (h.sub ? '<span class="sub clamp">' + esc(h.sub) + '</span>' : '') + '</span><span class="chev">' + icon('chevron') + '</span></a></li>').join('') + '</ul>';
  });
  return html;
}

export function view(q = '') {
  const html = head('', t('Search Heartward'), '') +
    '<div class="search-wrap">' + icon('search') + '<input type="search" id="s" enterkeyhint="search" autocomplete="off" value="' + esc(q) + '" placeholder="' + esc(t('Search sessions, prayers, questions, words and saints')) + '" aria-label="' + esc(t('Search')) + '"></div>' +
    '<div id="sr" aria-live="polite">' + (q ? results(q) : '') + '</div>';
  return {
    html, title: t('Search'),
    bind(root) {
      const inp = root.querySelector('#s'), out = root.querySelector('#sr');
      if (!q) inp.focus();
      let timer;
      inp.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const v = inp.value;
          out.innerHTML = v ? results(v) : '';
          // Keep the query in the address so Back returns to the same results.
          history.replaceState(null, '', '#/search/' + encodeURIComponent(v));
        }, 120);
      };
    }
  };
}
