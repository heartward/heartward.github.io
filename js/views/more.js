// Prayer intentions, today's readings, the evening Examen, Stations of the Cross, and the keepsake page.
import { data, mySaint } from '../data.js';
import { state, save, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, fmtDate, parseISO, safeUrl } from '../ui.js';
import { listenButton, bindListen, sentences, speak, stop as stopSpeech, canSpeak } from '../speech.js';
import { riteDates } from './extras.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const M = () => data.more;
const z = n => String(n).padStart(2, '0');
// Mass readings from the Canadian Lectionary (Living with Christ, with the Canadian bishops).
export const readingsUrl = d => 'https://readings.livingwithchrist.ca/daily-texts/reading/' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);

// ---------- People I pray for ----------
export function intentions() {
  const list = state.intentions;
  const open = list.filter(x => !x.answered), done = list.filter(x => x.answered);
  const weeks = x => Math.floor((Date.now() - parseISO(x.added)) / (7 * 864e5));
  let html = back('#/pray', t('Pray')) + head(t('Pray'), t('People I pray for'), M().intentions.intro) +
    '<form class="card" id="iadd"><label class="field"><span>' + esc(t('Who or what are you praying for?')) + '</span><input type="text" name="text" required autocomplete="off" placeholder="' + esc(t('For example: Mom\'s health, my job interview')) + '"></label>' +
    '<button class="btn block" type="submit">' + icon('plus') + esc(t('Add')) + '</button></form>';
  html += '<div class="section-title"><h2>' + esc(t('Praying for')) + '</h2><span class="small muted">' + open.length + '</span></div>';
  html += open.length ? '<ul class="list card tight intentions">' + open.map(x => {
    const i = list.indexOf(x), w = weeks(x);
    return '<li class="intent"><div class="grow"><strong>' + esc(x.text) + '</strong><div class="small muted">' + esc(t('Since')) + ' ' + esc(fmtDate(parseISO(x.added), { month: 'short', day: 'numeric' })) +
      (w >= 3 ? ' · ' + esc(t('It has been') + ' ' + w + ' ' + t('weeks. Any change?')) : '') + '</div></div>' +
      '<div class="intent-btns"><button class="btn sm soft" data-ans="' + i + '">' + icon('check') + esc(t('Answered')) + '</button>' +
      '<button class="icon-btn" data-del="' + i + '" aria-label="' + esc(t('Remove')) + ' ' + esc(x.text) + '">' + icon('trash') + '</button></div></li>';
  }).join('') + '</ul>' : '<p class="card flat small muted">' + esc(t('Nothing here yet. Add a person or a need above.')) + '</p>';
  if (open.length) html += '<button class="btn ghost block" id="ipray">' + icon('candle') + esc(t('Pray for them now')) + '</button>';
  if (done.length) html += '<div class="section-title"><h2>' + esc(t('Answered prayers')) + '</h2><span class="small muted">' + done.length + '</span></div><ul class="list card tight intentions">' +
    done.map(x => { const i = list.indexOf(x); return '<li class="intent"><div class="grow"><strong>' + esc(x.text) + '</strong><div class="small muted">' + esc(fmtDate(parseISO(x.answered), { month: 'short', day: 'numeric', year: 'numeric' })) + '</div>' +
      (x.note ? '<p class="small" style="margin:4px 0 0;white-space:pre-line">' + esc(x.note) + '</p>' : '') + '</div><button class="icon-btn" data-del="' + i + '" aria-label="' + esc(t('Remove')) + ' ' + esc(x.text) + '">' + icon('trash') + '</button></li>'; }).join('') + '</ul>';
  return {
    html, title: t('People I pray for'),
    bind(root) {
      root.querySelector('#iadd').onsubmit = e => { e.preventDefault(); const v = String(new FormData(e.target).get('text') || '').trim(); if (!v) return; list.unshift({ text: v, added: localISO(new Date()) }); save(); toast(t('Added')); rerender(); };
      root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { list.splice(+b.dataset.del, 1); save(); rerender(); });
      root.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
        const x = list[+b.dataset.ans];
        const note = window.prompt(t('Thank God! How was it answered? (optional)'), '');
        if (note === null) return;
        x.answered = localISO(new Date()); x.note = note.trim(); save(); toast(t('Thanks be to God')); rerender();
      });
      const p = root.querySelector('#ipray');
      if (p) p.onclick = () => {
        const words = 'Lord, I bring to you: ' + open.map(x => x.text).join('; ') + '. You know what each one needs. Let your will be done. Amen.';
        if (canSpeak) speak(sentences(words));
        toast(t('Lord, hear our prayer'));
      };
    }
  };
}

// ---------- Today's readings ----------
export function readings() {
  const d = new Date(), R = M().readings;
  const thought = R.thoughts[dayOfYear(d) % R.thoughts.length];
  const html = back('#/', t('Today')) + head(t('Mass readings'), fmtDate(d), R.intro) +
    '<section class="card"><a class="btn block" href="' + esc(safeUrl(readingsUrl(d))) + '" target="_blank" rel="noopener">' + icon('book') + esc(t('Open today\'s readings')) + icon('external') + '</a>' +
    '<p class="small muted" style="margin:10px 0 0">' + esc(t('Opens the readings from the Canadian Lectionary on Living with Christ (needs internet). They are the readings you hear at Mass in Canada.')) + '</p></section>' +
    '<section class="card reflection-card"><div class="eyebrow">' + esc(t('A thought for today')) + '</div><p style="margin:6px 0 0;font-family:var(--serif);font-size:1.1rem">' + esc(thought) + '</p></section>' +
    '<a class="card row" href="#/examen"><span class="lead">' + icon('moon') + '</span><span class="grow"><span class="title">' + esc(t('Evening Examen')) + '</span><span class="sub">' + esc(t('Look back on the day with God tonight')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  return { html, title: t('Today\'s readings') };
}

// ---------- Evening Examen ----------
export function examen() {
  const E = M().examen;
  let html = back('#/pray', t('Pray')) + head(t('Pray'), t('Evening Examen'), E.intro) +
    '<div class="listen-row">' + listenButton('exl', t('Guide me (with pauses)')) + '</div>' +
    '<ol class="road lectio">' + E.steps.map((s, i) => '<li><div class="stop"><span class="node">' + (i + 1) + '</span><span class="info"><span class="title">' + esc(s.name) + '</span><span class="sub" style="color:var(--text)">' + esc(s.text) + '</span></span></div></li>').join('') + '</ol>' +
    '<p class="small muted">' + esc(t('With "Guide me", Heartward reads each step aloud and then waits quietly for about half a minute.')) + '</p>';
  return {
    html, title: t('Evening Examen'),
    bind(root) {
      // One piece per step; a long pause after each so there is time to pray.
      const pieces = E.steps.map(s => s.name + '. ' + s.text);
      bindListen(root, 'exl', () => pieces, { gap: p => pieces.indexOf(p) === pieces.length - 1 ? 0 : 30000 });
    }
  };
}

// ---------- Stations of the Cross ----------
export function stations() {
  const S = M().stations, N = S.list.length;
  let i = -1; // -1 = introduction, N = closing
  let html = back('#/pray', t('Pray')) + '<div id="st"></div>' +
    '<div class="rosary-nav"><div class="in"><button class="btn ghost" id="prev">' + icon('back') + esc(t('Back')) + '</button><button class="btn" id="next">' + esc(t('Start')) + icon('chevron') + '</button></div></div><div class="rosary-pad"></div>';
  return {
    html, title: t('Stations of the Cross'),
    bind(root) {
      const box = root.querySelector('#st'), prev = root.querySelector('#prev'), next = root.querySelector('#next');
      const draw = () => {
        stopSpeech();
        if (i < 0) box.innerHTML = head(t('Pray'), t('Stations of the Cross'), S.intro) + '<div class="card flat"><p style="margin:0">' + esc(S.how) + '</p></div>' +
          '<ol class="list card tight st-index">' + S.list.map((s, k) => '<li><button class="row linkish" data-go="' + k + '"><span class="lead">' + (k + 1) + '</span><span class="grow"><span class="title">' + esc(s.title) + '</span></span></button></li>').join('') + '</ol>';
        else if (i >= N) box.innerHTML = '<header class="page-head"><div class="kicker">' + esc(t('Stations of the Cross')) + '</div><h1>' + esc(t('Closing')) + '</h1></header><div class="reading"><p>' + esc(S.closing) + '</p></div><a class="btn soft" href="#/prayer/our-father">' + esc(t('Our Father')) + '</a>';
        else {
          const s = S.list[i];
          box.innerHTML = '<header class="page-head"><div class="kicker">' + esc(t('Station')) + ' ' + (i + 1) + ' / ' + N + '</div><h1>' + esc(s.title) + '</h1><p class="small muted">' + esc(s.ref) + '</p></header>' +
            '<div class="station-v"><p><strong>' + esc(S.verse) + '</strong></p><p><em>' + esc(S.response) + '</em></p></div>' +
            '<div class="reading"><p>' + esc(s.text) + '</p></div><div class="reflection"><div class="eyebrow">' + esc(t('Pray')) + '</div><p>' + esc(s.prayer) + '</p></div>' +
            '<div class="listen-row">' + listenButton('stl', t('Listen')) + '</div>';
          bindListen(box, 'stl', () => { const s2 = S.list[i]; return [t('Station') + ' ' + (i + 1) + '. ' + s2.title + '.', S.verse, S.response, ...sentences(s2.text), s2.prayer]; });
        }
        box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { i = +b.dataset.go; draw(); });
        prev.disabled = i < 0;
        next.disabled = i >= N;
        next.innerHTML = (i < 0 ? esc(t('Start')) : i === N - 1 ? esc(t('Finish')) : esc(t('Next'))) + icon('chevron');
        window.scrollTo(0, 0);
      };
      prev.onclick = () => { if (i > -1) { i--; draw(); } };
      next.onclick = () => { if (i < N) { i++; draw(); } };
      draw();
    }
  };
}

// ---------- Keepsake ----------
const KEEP_DATES = [['baptism', 'Baptism'], ['confirmation', 'Confirmation'], ['communion', 'First Communion'], ['reception', 'Received into the Church']];
export function keepsake() {
  const K = state.keepsake, saint = mySaint();
  const sponsor = state.friends.find(f => /sponsor/i.test(f.role || ''));
  const verses = data.sessionList.map(s => (data.study.sessions[s.id] || {}).verse).filter(Boolean);
  const verse = verses.find(v => v.ref === K.verse) || null;
  const parish = state.parish.name || data.parish.name || '';
  const vigil = riteDates().vigil;
  const line = (label, val) => val ? '<div class="ks-line"><span>' + esc(t(label)) + '</span><strong>' + esc(val) + '</strong></div>' : '';
  let html = back('#/me', t('Me')) + '<div class="no-print">' + head(t('Me'), t('My keepsake'), M().keepsake.intro) +
    '<section class="card"><label class="field"><span>' + esc(t('My name')) + '</span><input type="text" id="kname" value="' + esc(K.name || '') + '" autocomplete="name"></label>' +
    '<label class="field"><span>' + esc(t('My favourite verse')) + '</span><select id="kverse"><option value="">' + esc(t('Choose one')) + '</option>' +
    verses.map(v => '<option' + (v.ref === K.verse ? ' selected' : '') + '>' + esc(v.ref) + '</option>').join('') + '</select></label>' +
    '<p class="small muted" style="margin:0">' + esc(t('Dates, saint, sponsor and parish come from the rest of the app.')) + ' <a href="#/dates">' + esc(t('My dates')) + '</a></p></section></div>' +
    '<article class="keepsake"><div class="ks-cross">✝</div><div class="eyebrow">' + esc(t('Welcomed into the Catholic Church')) + '</div>' +
    '<h1>' + esc(K.name || t('Your name')) + '</h1>' +
    '<p class="ks-sub">' + esc(t('Easter Vigil')) + ' ' + esc(fmtDate(vigil, { year: 'numeric', month: 'long', day: 'numeric' })) + '</p>' +
    KEEP_DATES.map(([k, l]) => line(l, state.dates[k] ? fmtDate(parseISO(state.dates[k]), { year: 'numeric', month: 'long', day: 'numeric' }) : '')).join('') +
    line('Patron saint', saint ? saint.name : '') + line('Sponsor', sponsor ? sponsor.name : '') + line('Parish', parish) +
    (verse ? '<blockquote class="verse">' + esc(verse.text) + '<cite>' + esc(verse.ref) + '</cite></blockquote>' : '') +
    '<p class="ks-foot">' + esc(t('“Was not our heart burning within us, whilst he spoke in the way?”')) + ' ' + esc(t('Luke 24:32')) + '</p></article>' +
    '<button class="btn block no-print" id="kprint">' + icon('download') + esc(t('Save as PDF or print')) + '</button>';
  return {
    html, title: t('My keepsake'),
    bind(root) {
      root.querySelector('#kname').onchange = e => { K.name = e.target.value.trim(); save(); rerender(); };
      root.querySelector('#kverse').onchange = e => { K.verse = e.target.value; save(); rerender(); };
      root.querySelector('#kprint').onclick = () => window.print();
    }
  };
}
