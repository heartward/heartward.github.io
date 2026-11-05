// Rites on the road to Easter, the sponsor page, and help choosing a Confirmation saint.
import { data, byId } from '../data.js';
import { state, save, localISO } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, sources, acc, download, ics, parseISO, fmtDate, safeUrl } from '../ui.js';
import { easter } from '../liturgy.js';
import { currentSession } from './week.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const day = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const short = d => fmtDate(d, { month: 'short', day: 'numeric' });

// The coming Easter season: this year's until Pentecost has passed, then next year's.
export function riteDates(now = new Date()) {
  const d0 = day(now);
  let y = d0.getFullYear(), e = easter(y);
  if (d0 > add(e, 49)) { y++; e = easter(y); }
  return {
    year: y, easter: e, ash: add(e, -46), lent1: add(e, -42), scrutinies: [add(e, -28), add(e, -21), add(e, -14)],
    vigil: add(e, -1), pentecost: add(e, 49)
  };
}
export function daysToVigil(now = new Date()) { return Math.round((riteDates(now).vigil - day(now)) / 864e5); }

function stepDates(st, R) {
  switch (st.when) {
    case 'parish': { const v = state.rites.acceptance; return v ? { start: parseISO(v), end: parseISO(v), label: fmtDate(parseISO(v)) } : { label: t('Date set by your parish') }; }
    case 'lent1': return { start: R.lent1, end: R.lent1, label: fmtDate(R.lent1) };
    case 'lent3': return { start: R.scrutinies[0], end: R.scrutinies[2], label: R.scrutinies.map(short).join(', ') };
    case 'lent': return { start: R.ash, end: add(R.vigil, -2), label: t('During Lent') + ' (' + short(R.ash) + ' – ' + short(add(R.easter, -7)) + ')' };
    case 'vigil': return { start: R.vigil, end: R.vigil, label: fmtDate(R.vigil) + ', ' + t('after dark') };
    case 'mystagogy': return { start: R.easter, end: R.pentecost, label: short(R.easter) + ' – ' + short(R.pentecost) };
  }
  return { label: '' };
}

export function rites() {
  const R = riteDates(), d0 = day(new Date()), n = daysToVigil();
  const X = data.extras.rites;
  let html = back('#/journey', t('Journey')) + head(t('The road to Easter'), t('Steps along the way'), X.intro);
  html += '<section class="card countdown"><div class="cd-num">' + (n > 0 ? n : n === 0 ? '🕯' : '✓') + '</div><div><div class="eyebrow">' + esc(t('Easter Vigil')) + ' ' + R.year + '</div>' +
    '<strong>' + esc(n > 1 ? n + ' ' + t('days to go') : n === 1 ? t('Tomorrow night') : n === 0 ? t('Tonight!') : t('Christ is risen! You are in the fifty days of Easter.')) + '</strong>' +
    '<div class="small muted">' + esc(fmtDate(R.vigil)) + '</div></div></section>';
  html += '<ol class="rites">';
  X.steps.forEach(st => {
    const D = stepDates(st, R);
    const status = !D.start ? '' : d0 > D.end ? 'past' : d0 >= D.start ? 'now' : 'soon';
    html += '<li class="rite ' + status + '"><span class="node">' + (status === 'past' ? icon('check') : icon(st.id === 'vigil' ? 'candle' : 'dove')) + '</span><div class="card">' +
      '<div class="eyebrow">' + esc(D.label) + (status === 'now' ? ' · <span class="tag gold">' + esc(t('Now')) + '</span>' : '') + '</div>' +
      '<h2 class="h3">' + esc(st.title) + '</h2><p>' + esc(st.about) + '</p><p class="small muted" style="margin:0">' + esc(st.tip) + '</p>' +
      (st.when === 'parish' ? '<label class="field" style="margin:12px 0 0"><span>' + esc(t('My date (if you know it)')) + '</span><input type="date" id="acc-date" value="' + esc(state.rites.acceptance || '') + '"></label>' : '') +
      '</div></li>';
  });
  html += '</ol><button class="btn ghost block" id="rics">' + icon('calendar') + esc(t('Add these dates to my calendar')) + '</button>' +
    '<p class="small muted">' + esc(t('Some parishes move a rite or hold the Scrutinies at a different Mass. Your parish schedule always comes first.')) + '</p>' + sources(X.sources);
  return {
    html, title: t('Steps along the way'),
    bind(root) {
      const a = root.querySelector('#acc-date');
      if (a) a.onchange = () => { state.rites.acceptance = a.value; save(); toast(t('Saved')); rerender(); };
      root.querySelector('#rics').onclick = () => {
        const desc = 'https://heartward.github.io/#/rites';
        const ev = [{ date: R.lent1, title: 'Rite of Election (first Sunday of Lent)', desc }]
          .concat(R.scrutinies.map((d, i) => ({ date: d, title: ['First', 'Second', 'Third'][i] + ' Scrutiny', desc })))
          .concat([{ date: R.vigil, title: 'Easter Vigil', desc }]);
        if (state.rites.acceptance) ev.unshift({ date: parseISO(state.rites.acceptance), title: 'Rite of Acceptance', desc });
        download('heartward-rites.ics', ics(ev), 'text/calendar'); toast(t('Open the downloaded file to add it'));
      };
    }
  };
}

// ---------- Sponsor ----------
export function sponsor() {
  const X = data.extras.sponsor;
  const sp = state.friends.find(f => /sponsor/i.test(f.role || ''));
  const s = currentSession();
  const disc = ((data.study.sessions[s.id] || {}).discuss) || [];
  const jq = data.sessionList.map(x => (state.journal[x.id] || {}).questions).filter(Boolean);
  let html = back('#/me', t('Me')) + head(t('Me'), t('My sponsor'), X.intro);
  if (sp) {
    html += '<section class="card row" style="cursor:default"><span class="lead">' + icon('user') + '</span><span class="grow"><span class="title">' + esc(sp.name) + '</span><span class="sub">' + esc(t('Sponsor')) + '</span></span>' +
      (sp.phone ? '<a class="icon-btn" aria-label="' + esc(t('Text')) + ' ' + esc(sp.name) + '" href="' + esc(safeUrl('sms:' + sp.phone.replace(/[^\d+]/g, ''))) + '">' + icon('mail') + '</a><a class="icon-btn" aria-label="' + esc(t('Call')) + ' ' + esc(sp.name) + '" href="' + esc(safeUrl('tel:' + sp.phone.replace(/[^\d+]/g, ''))) + '">' + icon('phone') + '</a>' : '') +
      (sp.email && !sp.phone ? '<a class="icon-btn" aria-label="' + esc(t('Email')) + ' ' + esc(sp.name) + '" href="' + esc(safeUrl('mailto:' + sp.email)) + '">' + icon('mail') + '</a>' : '') + '</section>';
  } else {
    html += '<a class="card row" href="#/friends"><span class="lead">' + icon('plus') + '</span><span class="grow"><span class="title">' + esc(t('Add your sponsor')) + '</span><span class="sub">' + esc(t('Then you can call or text them from here')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  }
  html += '<div class="section-title"><h2>' + esc(t('For our next talk')) + '</h2></div><section class="card">' +
    '<label class="field"><span>' + esc(t('My questions')) + ' <span class="saved-hint" id="qsaved"></span></span><textarea id="sq" placeholder="' + esc(t('Anything you are wondering about, or finding hard')) + '">' + esc(state.sponsor.asks || '') + '</textarea></label>' +
    (jq.length ? '<details class="small"><summary>' + esc(t('Questions from my journal')) + ' (' + jq.length + ')</summary><ul class="lesson-list">' + jq.map(q => '<li style="white-space:pre-line">' + esc(q) + '</li>').join('') + '</ul></details>' : '') +
    (disc.length ? '<div class="eyebrow" style="margin-top:12px">' + esc(t('From this week')) + ': ' + esc(s.title) + '</div><ul class="lesson-list">' + disc.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' : '') +
    '<button class="btn block" id="ssend">' + icon('share') + esc(sp ? t('Send to') + ' ' + sp.name : t('Send to my sponsor')) + '</button></section>';
  html += '<div class="section-title"><h2>' + esc(t('Ideas to do together')) + '</h2></div><section class="card"><ul class="lesson-list">' + X.together.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
  html += '<div class="section-title"><h2>' + esc(t('Notes from our talks')) + '</h2></div><section class="card"><label class="field" style="margin:0"><span class="sr-only">' + esc(t('Notes from our talks')) + '</span><textarea id="sn" placeholder="' + esc(t('What did you talk about? What do you want to remember?')) + '">' + esc(state.sponsor.notes || '') + '</textarea></label><span class="saved-hint small" id="nsaved"></span></section>';
  html += acc(X.forSponsors.title, '<ul class="lesson-list">' + X.forSponsors.points.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>');
  return {
    html, title: t('My sponsor'),
    bind(root) {
      const keep = (id, key, hint) => { const ta = root.querySelector(id); let tm; ta.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { state.sponsor[key] = ta.value; save(); root.querySelector(hint).textContent = t('Saved'); }, 400); }; };
      keep('#sq', 'asks', '#qsaved'); keep('#sn', 'notes', '#nsaved');
      root.querySelector('#ssend').onclick = () => {
        const mine = root.querySelector('#sq').value.trim();
        const text = (mine ? 'My questions:\n' + mine + '\n\n' : '') + (disc.length ? s.title + ':\n' + disc.map((q, i) => (i + 1) + '. ' + q).join('\n') : '');
        if (!text) { toast(t('Write a question first')); return; }
        if (navigator.share) navigator.share({ title: 'For our next talk', text }).catch(() => {});
        else if (sp && sp.phone) location.href = 'sms:' + sp.phone.replace(/[^\d+]/g, '') + '?&body=' + encodeURIComponent(text);
        else if (sp && sp.email) location.href = 'mailto:' + sp.email + '?subject=' + encodeURIComponent('For our next talk') + '&body=' + encodeURIComponent(text);
        else (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t('Copied'))).catch(() => {});
      };
    }
  };
}

// ---------- Confirmation saint ----------
export function saintQuiz() {
  const X = data.extras.confirmationSaint, S = data.saints.saints;
  let html = back('#/saints', t('Saints')) + head(t('Saints'), t('Find my saint'), X.intro) +
    '<section class="card"><h2 class="h3">' + esc(t('How to choose')) + '</h2><ol class="qs">' + X.how.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></section>' +
    '<div class="section-title"><h2>' + esc(t('A short quiz')) + '</h2></div><form id="sqz">';
  X.quiz.forEach((q, i) => {
    html += '<fieldset class="card quiz-q"><legend><span class="eyebrow">' + (i + 1) + ' / ' + X.quiz.length + '</span><br>' + esc(q.q) + '</legend>' +
      q.options.map((o, j) => '<label class="opt"><input type="radio" name="q' + i + '" value="' + j + '"> <span>' + esc(o.label) + '</span></label>').join('') + '</fieldset>';
  });
  html += '<button class="btn block" type="submit">' + icon('star') + esc(t('See my saints')) + '</button></form><div id="sres" aria-live="polite"></div>';
  return {
    html, title: t('Find my saint'),
    bind(root) {
      root.querySelector('#sqz').onsubmit = e => {
        e.preventDefault();
        const f = new FormData(e.target), score = {};
        let answered = 0;
        X.quiz.forEach((q, i) => { const v = f.get('q' + i); if (v == null) return; answered++; q.options[+v].tags.forEach(tg => { score[tg] = (score[tg] || 0) + 1; }); });
        const out = root.querySelector('#sres');
        if (!answered) { out.innerHTML = '<p class="card flat">' + esc(t('Pick at least one answer.')) + '</p>'; return; }
        const top = S.map(s => ({ s, n: s.tags.reduce((a, tg) => a + (score[tg] || 0), 0) })).filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
        out.innerHTML = '<div class="section-title"><h2>' + esc(t('Saints to get to know')) + '</h2></div><ul class="list card tight">' + top.map(({ s }) =>
          '<li class="saint-pick"><a class="row" href="#/saint/' + s.id + '"><span class="lead">' + icon('star') + '</span><span class="grow"><span class="title">' + esc(s.name) + '</span><span class="sub">' + esc(t('Patron of')) + ' ' + esc(s.patron) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>' +
          '<p class="small" style="margin:0 16px 8px">' + esc(s.story.split('. ')[0] + '.') + '</p>' +
          '<button class="btn sm ' + (state.saint === s.id ? 'ok' : 'soft') + '" data-pick="' + s.id + '" style="margin:0 16px 14px">' + (state.saint === s.id ? icon('check') + esc(t('My patron saint')) : icon('star') + esc(t('Choose as my patron'))) + '</button></li>').join('') + '</ul>' +
          '<p class="small muted">' + esc(t('Tap a name to read the whole story. Pray about it, and choose the one that feels like a friend. You can change your mind any time.')) + '</p>';
        out.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
          state.saint = b.dataset.pick; save(); toast(t('Patron saint chosen'));
          out.querySelectorAll('[data-pick]').forEach(x => { const on = x.dataset.pick === state.saint; x.className = 'btn sm ' + (on ? 'ok' : 'soft'); x.innerHTML = on ? icon('check') + esc(t('My patron saint')) : icon('star') + esc(t('Choose as my patron')); });
        });
        out.querySelector('h2').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }
  };
}
