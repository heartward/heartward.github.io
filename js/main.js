import { loadData } from './data.js';
import { state } from './store.js';
import { icon } from './icons.js';
import { t } from './ui.js';
import { stop as stopSpeech } from './speech.js';
import * as today from './views/today.js';
import * as journey from './views/journey.js';
import * as pray from './views/pray.js';
import * as learn from './views/learn.js';
import * as me from './views/me.js';
import * as search from './views/search.js';
import * as week from './views/week.js';

const routes = {
  '': [today.view, 'today'],
  journey: [journey.view, 'journey'], session: [journey.session, 'journey'],
  'first-year': [journey.firstYear, 'journey'], 'welcome-back': [journey.welcomeBack, 'journey'],
  pray: [pray.view, 'pray'], prayer: [pray.prayer, 'pray'], rosary: [pray.rosary, 'pray'], confession: [pray.confession, 'pray'], reminder: [pray.reminder, 'pray'],
  learn: [learn.view, 'learn'], questions: [learn.questions, 'learn'], mass: [learn.mass, 'learn'], basics: [learn.basics, 'learn'],
  glossary: [learn.glossary, 'learn'], saints: [learn.saints, 'learn'], saint: [learn.saint, 'learn'], calendar: [learn.calendar, 'learn'],
  me: [me.view, 'me'], journal: [me.journal, 'me'], habits: [me.habits, 'me'], dates: [me.dates, 'me'], friends: [me.friends, 'me'],
  involved: [me.involved, 'me'], settings: [me.settings, 'me'], share: [me.share, 'me'], welcome: [me.welcome, ''], parish: [me.parish, 'me'],
  week: [week.week, 'journey'], verse: [week.verse, 'journey'], quiz: [week.quiz, 'journey'], lectio: [week.lectio, 'pray'], 'first-confession': [week.firstConfession, 'pray'],
  search: [search.view, 'search']
};

export function applySettings() {
  const r = document.documentElement, s = state.settings;
  if (s.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', s.theme);
  if (s.size === 'normal') r.removeAttribute('data-size'); else r.setAttribute('data-size', s.size);
  r.lang = s.lang === 'es' ? 'es' : 'en';
  renderChrome();
}

function renderChrome() {
  const tabs = [['#/', 'home', 'Today', 'today'], ['#/journey', 'road', 'Journey', 'journey'], ['#/pray', 'candle', 'Pray', 'pray'], ['#/learn', 'book', 'Learn', 'learn'], ['#/me', 'user', 'Me', 'me']];
  document.getElementById('tabbar').innerHTML = tabs.map(([h, ic, label, id]) => '<a href="' + h + '" data-tab="' + id + '">' + icon(ic) + '<span>' + t(label) + '</span></a>').join('');
  const s = document.getElementById('search-btn');
  s.innerHTML = icon('search'); s.setAttribute('aria-label', t('Search'));
}

let lastPath = null;
export function render() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [route, ...args] = hash.split('/').map(decodeURIComponent);
  const [fn, tab] = routes[route] || routes[''];
  const out = fn(...args) || {};
  const view = document.getElementById('view');
  view.innerHTML = out.html || '';
  if (hash !== lastPath) {
    if (lastPath !== null) stopSpeech();
    view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter');
    // Move keyboard and screen-reader focus to the new page (not on first load).
    if (lastPath !== null) view.focus({ preventScroll: true });
    window.scrollTo(0, 0); lastPath = hash;
    document.title = (out.title ? out.title + ' · ' : '') + 'Heartward';
  }
  document.querySelectorAll('#tabbar a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  if (out.bind) out.bind(view);
}

window.addEventListener('hashchange', render);
window.addEventListener('scroll', () => document.querySelector('.topbar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
document.addEventListener('heartward:render', render);

applySettings();
loadData().then(render).catch(err => {
  console.error(err);
  document.getElementById('view').innerHTML = '<div class="empty"><h2>' + t('Could not load') + '</h2><p>' + t('Please check your connection and reload. After the first visit, Heartward works offline.') + '</p></div>';
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
