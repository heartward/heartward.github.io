import { data, mySaint as getMySaint } from '../data.js';
import { state, save, weekKey, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, fmtDate, parseISO, tile } from '../ui.js';
import { season, seasonColor, upcoming, rosaryForDay } from '../liturgy.js';
import { progress, nextSession, sessionNo } from './journey.js';
import { daysToVigil } from './extras.js';

export function view() {
  const now = new Date();
  const s = data.calendar.seasons[season(now)];
  const p = progress();
  const next = nextSession();
  const hour = now.getHours();
  const greet = hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
  const circ = 2 * Math.PI * 40, off = circ * (1 - p.pct);

  // First visit: say plainly what the app is, who it is for and where to start.
  if (!state.introDone && !p.done) return intro(next);

  let html = '<section class="hero" aria-label="' + esc(t('Your progress')) + '">' +
    '<div class="season-chip"><span class="season-dot" style="background:' + seasonColor[s.color] + '"></span>' + esc(t(s.name)) + '</div>' +
    '<div class="date">' + esc(fmtDate(now)) + '</div>' +
    '<h1>' + esc(greet) + '</h1>' +
    '<div class="hero-progress"><div class="ring"><svg viewBox="0 0 92 92"><circle class="track" cx="46" cy="46" r="40" fill="none" stroke-width="8"/>' +
    '<circle class="bar" cx="46" cy="46" r="40" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
    '<span class="flame" style="color:var(--glow)">' + icon('flame') + '</span></div>' +
    '<div><div class="big">' + p.done + ' ' + esc(t('of')) + ' ' + p.total + '</div><div class="sub">' + esc(t('RCIA classes done')) + '</div>' +
    '<div class="sub">' + Object.keys(state.learned).length + ' ' + esc(t('prayers learned by heart')) + '</div></div></div>' +
    '<div class="stagebar">' + p.stages.map(st => '<div class="seg"><div class="bar"><div class="fill" style="width:' + Math.round(st.pct * 100) + '%"></div></div><div class="lbl">' + esc(t(st.title)) + '</div></div>').join('') + '</div>' +
    '</section>';

  const nv = daysToVigil();
  if (nv >= 0) html += '<a class="countdown-strip" href="#/rites">' + icon('candle') + '<span><strong>' + (nv > 1 ? nv + ' ' + esc(t('days')) : nv === 1 ? esc(t('Tomorrow')) : esc(t('Tonight'))) + '</strong> ' + esc(t('to the Easter Vigil')) + '</span><span class="chev">' + icon('chevron') + '</span></a>';

  // Anniversary or feast-day banner
  const md = localISO(now).slice(5);
  const anniv = [['baptism', 'Happy baptism anniversary!'], ['reception', 'Happy anniversary of your reception into the Church!'], ['confirmation', 'Happy confirmation anniversary!'], ['communion', 'Happy First Communion anniversary!']]
    .filter(([k]) => state.dates[k] && state.dates[k].slice(5) === md && state.dates[k] < localISO(now));
  anniv.forEach(([, msg]) => { html += '<div class="banner">' + icon('candle') + '<div><strong>' + esc(t(msg)) + '</strong><div class="small">' + esc(t('Light a candle and thank God for this day.')) + '</div></div></div>'; });
  const mySaint = getMySaint();
  if (mySaint && mySaint.feast === md) html += '<div class="banner">' + icon('star') + '<div><strong>' + esc(t('Today is the feast of your patron,')) + ' ' + esc(mySaint.name) + '</strong></div></div>';

  if (next) {
    const st = data.stages.find(x => x.id === next.stage);
    html += '<a class="card next-card" href="#/session/' + next.id + '" style="text-decoration:none;color:inherit">' +
      '<span class="num-badge">' + sessionNo(next) + '</span><span><span class="eyebrow">' + esc(t('Up next')) + ' · ' + esc(t(st.title)) + '</span>' +
      '<h2 class="h3">' + esc(next.title) + '</h2><span class="muted small">' + esc(next.summary) + '</span></span></a>';
    const sv = (data.study.sessions[next.id] || {}).verse;
    html += '<a class="card week-card" href="#/week"><span class="eyebrow">' + esc(t('This week')) + '</span>' +
      (sv ? '<span class="wk-verse">“' + esc(sv.text.length > 110 ? sv.text.slice(0, sv.text.lastIndexOf(' ', 105)) + '…' : sv.text) + '” <span class="muted small">' + esc(sv.ref) + '</span></span>' : '') +
      '<span class="wk-chips">' + [t('Memory verse'), t('Bible study'), t('Quiz'), t('Saint'), t('Challenge')].map(x => '<span>' + esc(x) + '</span>').join('') + '</span>' +
      '<span class="chev">' + icon('chevron') + '</span></a>';
  } else {
    html += '<div class="card"><h2 class="h3">' + esc(t('You walked the whole road')) + '</h2><p class="muted">' + esc(t('Every session is lit. Keep going with your first year.')) + '</p><a class="btn soft sm" href="#/first-year">' + esc(t('Your first year')) + '</a></div>';
  }

  // Today in the Church
  const ups = upcoming(data.calendar, data.saints.saints, new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  const myst = data.guides.rosary.mysteries[rosaryForDay(data.guides, now)];
  html += '<div class="section-title"><h2>' + esc(t('Today')) + '</h2><a href="#/calendar">' + esc(t('Calendar')) + '</a></div><div class="tiles">';
  html += tile('#/rosary', 'rosary', t('Pray the Rosary'), t(myst.name), 'dark');
  if (ups.length) html += tile(ups[0].saintId ? '#/saint/' + ups[0].saintId : '#/calendar', 'star', ups[0].name, t('Celebrated today'));
  html += hourPrayer(now);
  html += tile('#/habits', 'check', t('This week'), habitSummary());
  html += '</div>';

  // Parish card
  const pname = state.parish.name || data.parish.name;
  if (pname) {
    html += '<div class="section-title"><h2>' + esc(t('My parish')) + '</h2><a href="#/parish">' + esc(t('Edit')) + '</a></div>' +
      '<div class="card flat"><strong>' + esc(pname) + '</strong>' + ((state.parish.meets || data.parish.meets) ? '<div class="muted small">' + esc(t('Classes')) + ': ' + esc(state.parish.meets || data.parish.meets) + '</div>' : '') + '</div>';
  }

  html += '<div class="section-title"><h2>' + esc(t('Explore')) + '</h2></div><div class="tiles">' +
    tile('#/mass', 'church', t('Mass guide'), t('What happens and why')) +
    tile('#/questions', 'question', t('Questions'), t('Common newcomer questions')) +
    tile('#/saint-quiz', 'star', t('Find my saint'), t('A short quiz')) +
    tile('#/welcome-back', 'door', t('Welcome back'), t('For anyone returning to the Church')) +
    tile('#/journal', 'pen', t('Journal'), t('Your notes and questions')) +
    tile('#/share', 'share', t('Share with your class'), t('Link and QR code')) +
    '</div>';
  return { html, title: t('Today') };
}

function intro(first) {
  const feat = (href, ic, title, sub) => '<a class="intro-feat" href="' + href + '"><span class="ic">' + icon(ic) + '</span><span><strong>' + esc(title) + '</strong><span>' + esc(sub) + '</span></span></a>';
  const stops = data.stages.map(s => t(s.title));
  const html =
    '<section class="hero intro" aria-labelledby="intro-h">' +
    '<div class="kicker">' + esc(t('Welcome to Heartward')) + '</div>' +
    '<h1 id="intro-h">' + esc(t('Your companion on the road to the Catholic faith')) + '</h1>' +
    '<p>' + esc(t('Made for RCIA. Follow each class, learn the prayers by heart, and watch your path light up on the way to Easter.')) + '</p>' +
    '<svg class="road" viewBox="0 0 320 96" aria-hidden="true"><path id="road" d="M8 82 C 70 86, 70 34, 130 40 S 210 86, 250 58 S 290 14, 312 12" fill="none"/></svg>' +
    '<ol class="road-stops" aria-label="' + esc(t('The four stages')) + '">' + stops.map((s, i) => '<li' + (i === 0 ? ' class="here"' : '') + '>' + esc(s) + '</li>').join('') + '</ol>' +
    '<div class="btn-row" style="margin:18px 0 0">' +
    (first ? '<a class="btn block glow" href="#/session/' + first.id + '">' + icon('road') + esc(t('Start with Session 1')) + '</a>' : '') +
    '<button class="btn block ghost-light" id="skip-intro">' + esc(t('I have already started')) + '</button></div>' +
    '</section>' +
    '<div class="section-title"><h2>' + esc(t('What you can do here')) + '</h2></div>' +
    '<div class="intro-feats">' +
    feat('#/journey', 'road', t('Follow your class'), t('A short lesson for each RCIA session, with pictures, charts and a private journal.')) +
    feat('#/pray', 'candle', t('Learn the prayers'), t('Listen, repeat line by line, and practice until you know them by heart.')) +
    feat('#/rosary', 'rosary', t('Pray the Rosary'), t('Bead by bead, with the words in front of you.')) +
    feat('#/week', 'sparkle', t('Practice each week'), t('A memory verse, Bible study, quiz, saint of the week and a small challenge.')) +
    feat('#/learn', 'church', t('Understand the Mass'), t('When to sit, stand and kneel, plus answers to common questions.')) +
    '</div>' +
    '<p class="notice">' + esc(t('Free, no sign-up and no ads. Everything you write stays on your phone.')) + '</p>';
  return {
    html, title: t('Welcome'),
    bind(root) {
      // Place the four stage dots along the road.
      const road = root.querySelector('#road');
      if (road && road.getTotalLength) {
        const L = road.getTotalLength(), svg = road.ownerSVGElement;
        [0.02, 0.36, 0.68, 0.98].forEach((k, i) => {
          const pt = road.getPointAtLength(L * k), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', i === 0 ? 8 : 6); c.setAttribute('class', i === 0 ? 'lit' : 'dim');
          svg.appendChild(c);
        });
      }
      root.querySelector('#skip-intro').onclick = () => { state.introDone = true; save(); document.dispatchEvent(new Event('heartward:render')); };
    }
  };
}

function habitSummary() {
  const w = state.habits[weekKey()] || {};
  const n = data.paths.habits.filter(h => w[h.id]).length;
  return n + ' ' + t('of') + ' ' + data.paths.habits.length + ' ' + t('habits');
}

// A prayer that fits the time of day: morning offering, the Angelus (Regina Caeli in Easter season), or night prayer.
function hourPrayer(now) {
  const h = now.getHours();
  if (h >= 5 && h < 11) return tile('#/prayer/morning-offering', 'sun', t('Morning Offering'), t('Give your day to God'));
  if (h >= 11 && h < 20) {
    const easter = season(now) === 'easter';
    return tile('#/prayer/' + (easter ? 'regina-caeli' : 'angelus'), 'bell', t(easter ? 'The Regina Caeli' : 'The Angelus'), t('Prayed at 6 am, noon and 6 pm'));
  }
  return tile('#/prayer/guardian-angel', 'moon', t('Prayer to your Guardian Angel'), t('Before you sleep'));
}
