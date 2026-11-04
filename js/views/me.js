import { data, byId } from '../data.js';
import { state, save, weekKey, replaceState, localISO, SPANISH } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, row, download, ics, parseISO, fmtDate, safeUrl } from '../ui.js';
import { progress } from './journey.js';
import { applySettings } from '../main.js';
import { canSpeak, speak } from '../speech.js';

const rerender = () => document.dispatchEvent(new Event('heartward:render'));
const APP_URL = 'https://heartward.github.io/';
const WELCOME_URL = APP_URL + '#/welcome';

export function view() {
  const p = progress();
  const mine = byId(data.saints.saints, state.saint);
  const jCount = Object.keys(state.journal).length;
  const w = state.habits[weekKey()] || {};
  const hDone = data.paths.habits.filter(h => w[h.id]).length;
  let html = head(t('Me'), t('My journey'), '') +
    '<div class="tiles stats" style="margin-bottom:6px">' +
    stat(p.done + '/' + p.total, t('sessions lit')) + stat(Object.keys(state.learned).length + '/' + data.prayers.length, t('prayers learned')) + stat(hDone + '/' + data.paths.habits.length, t('habits this week')) +
    '</div>';
  html += '<div class="section-title"><h2>' + esc(t('Personal')) + '</h2></div><ul class="list card tight">' +
    row('#/journal', 'pen', t('Journal'), jCount ? jCount + ' ' + t('sessions with notes') : t('Notes and questions from each session')) +
    row('#/habits', 'check', t('Weekly habits'), t('Small practices, no guilt')) +
    row('#/dates', 'calendar', t('My dates'), t('Baptism and other anniversaries')) +
    row('#/saints', 'star', t('My patron saint'), mine ? mine.name : t('Not chosen yet')) +
    row('#/friends', 'people', t('Friends on the journey'), state.friends.length ? state.friends.length + ' ' + t('people') : t('Sponsor, catechist and group')) +
    '</ul><div class="section-title"><h2>' + esc(t('Parish')) + '</h2></div><ul class="list card tight">' +
    row('#/parish', 'church', t('My parish'), state.parish.name || data.parish.name || t('Add your parish')) +
    row('#/involved', 'hands', t('Get involved'), Object.keys(state.involved).length ? Object.keys(state.involved).length + ' ' + t('interests') : t('Ways to serve and belong')) +
    '</ul><div class="section-title"><h2>' + esc(t('App')) + '</h2></div><ul class="list card tight">' +
    row('#/settings', 'gear', t('Settings and backup'), t('Text size, theme, voice speed')) +
    row('#/share', 'share', t('Share with your class'), t('A welcome page, link and QR code')) +
    row('#/reminder', 'bell', t('Daily reminder'), t('Add prayer time to your calendar')) +
    '</ul><p class="notice">' + esc(t('Heartward is a free companion and does not replace your parish program. Lessons are drafts meant to be reviewed by a catechist or priest. Your data stays only on this device.')) + '</p>';
  return { html, title: t('Me') };
}
function stat(n, label) { return '<div class="tile" style="min-height:0;gap:2px"><span style="font-family:var(--serif);font-size:1.5rem;font-weight:600">' + esc(n) + '</span><span class="ts">' + esc(label) + '</span></div>'; }

export function journal() {
  const entries = data.sessionList.filter(s => state.journal[s.id]);
  let html = back('#/me', t('Me')) + head(t('Me'), t('Journal'), t('Your notes and questions from each session. Write in any session page.'));
  if (!entries.length) html += '<div class="card empty">' + icon('pen') + '<p>' + esc(t('No notes yet. Open a session and write what stood out to you.')) + '</p><a class="btn soft sm" href="#/journey">' + esc(t('Go to Journey')) + '</a></div>';
  entries.forEach(s => {
    const j = state.journal[s.id];
    html += '<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/session/' + s.id + '"><div class="eyebrow">' + esc(j.updated || '') + '</div><h3>' + esc(s.title) + '</h3>' +
      (j.notes ? '<p style="white-space:pre-line;font-family:var(--serif)">' + esc(j.notes) + '</p>' : '') +
      (j.questions ? '<div class="reflection" style="margin:8px 0 0"><div class="eyebrow">' + esc(t('Questions to ask')) + '</div><p style="white-space:pre-line;font-style:normal">' + esc(j.questions) + '</p></div>' : '') + '</a>';
  });
  return { html, title: t('Journal') };
}

export function habits() {
  const H = data.paths.habits, wk = weekKey();
  const w = state.habits[wk] || {};
  let html = back('#/me', t('Me')) + head(t('Me'), t('Weekly habits'), t('A few small practices to grow a little each week. Tick what you did; there is no streak to lose.'));
  html += '<div class="card"><div class="eyebrow">' + esc(t('Week of')) + ' ' + esc(fmtDate(parseISO(wk), { month: 'long', day: 'numeric' })) + '</div>' +
    H.map(h => '<label class="check"><input type="checkbox" data-h="' + h.id + '"' + (w[h.id] ? ' checked' : '') + '> <span>' + esc(t(h.name)) + '</span></label>').join('') + '</div>';
  // last 8 weeks
  const weeks = [];
  for (let i = 7; i >= 0; i--) { const d = parseISO(wk); d.setDate(d.getDate() - 7 * i); weeks.push(localISO(d)); }
  html += '<div class="section-title"><h2>' + esc(t('Recent weeks')) + '</h2></div><div class="card"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;text-align:center">' +
    weeks.map(k => { const n = H.filter(h => (state.habits[k] || {})[h.id]).length; const a = n / H.length;
      return '<div><div style="height:56px;border-radius:10px;background:var(--surface-2);display:flex;align-items:flex-end;overflow:hidden"><div style="width:100%;height:' + Math.round(a * 100) + '%;background:var(--glow)"></div></div><div class="small muted" style="margin-top:4px">' + parseISO(k).getDate() + '</div></div>'; }).join('') +
    '</div><p class="small muted" style="margin:10px 0 0">' + esc(t('Each bar is one week, starting Sunday.')) + '</p></div>';
  return {
    html, title: t('Weekly habits'),
    bind(root) {
      root.querySelectorAll('[data-h]').forEach(c => c.onchange = () => {
        const cur = state.habits[wk] || (state.habits[wk] = {});
        if (c.checked) cur[c.dataset.h] = true; else delete cur[c.dataset.h];
        save(); rerender();
      });
    }
  };
}

const DATE_FIELDS = [['baptism', 'Baptism'], ['reception', 'Reception into the Church'], ['confirmation', 'Confirmation'], ['communion', 'First Communion']];
export function dates() {
  let html = back('#/me', t('Me')) + head(t('Me'), t('My dates'), t('Remember the days God worked in your life. Heartward will celebrate them with you on the Today page each year.'));
  html += '<div class="card">' + DATE_FIELDS.map(([k, label]) => '<label class="field"><span>' + esc(t(label)) + '</span><input type="date" data-d="' + k + '" value="' + esc(state.dates[k] || '') + '"></label>').join('') +
    '<p class="small muted" style="margin:0">' + esc(t('Fill in the ones that apply to you, including planned dates.')) + '</p></div>' +
    '<button class="btn ghost block" id="ics">' + icon('calendar') + esc(t('Add anniversaries to my calendar')) + '</button>';
  return {
    html, title: t('My dates'),
    bind(root) {
      root.querySelectorAll('[data-d]').forEach(i => i.onchange = () => { if (i.value) state.dates[i.dataset.d] = i.value; else delete state.dates[i.dataset.d]; save(); toast(t('Saved')); });
      root.querySelector('#ics').onclick = () => {
        const ev = DATE_FIELDS.filter(([k]) => state.dates[k]).map(([k, label]) => ({ date: parseISO(state.dates[k]), rrule: 'FREQ=YEARLY', title: t(label) + ' ' + t('anniversary'), desc: t('Give thanks for this day. https://heartward.github.io') }));
        const s = byId(data.saints.saints, state.saint);
        if (s) { const [m, d] = s.feast.split('-').map(Number); ev.push({ date: new Date(new Date().getFullYear(), m - 1, d), rrule: 'FREQ=YEARLY', title: t('Feast of') + ' ' + s.name }); }
        if (!ev.length) { toast(t('Add a date first')); return; }
        download('heartward-anniversaries.ics', ics(ev), 'text/calendar'); toast(t('Open the downloaded file to add it'));
      };
    }
  };
}

export function friends() {
  let html = back('#/me', t('Me')) + head(t('Me'), t('Friends on the journey'), t('Keep your sponsor, catechist and group close, even after classes end. These stay only on your phone.'));
  html += '<ul class="list card tight">' + (state.friends.length ? state.friends.map((f, i) =>
    '<li class="row" style="cursor:default"><span class="lead">' + icon('user') + '</span><span class="grow"><span class="title">' + esc(f.name) + '</span><span class="sub">' + esc(f.role || '') + '</span></span>' +
    (f.phone ? '<a class="icon-btn" aria-label="' + esc(t('Call')) + ' ' + esc(f.name) + '" href="' + esc(safeUrl('tel:' + f.phone.replace(/[^\d+]/g, ''))) + '">' + icon('phone') + '</a>' : '') +
    (f.email ? '<a class="icon-btn" aria-label="' + esc(t('Email')) + ' ' + esc(f.name) + '" href="' + esc(safeUrl('mailto:' + f.email)) + '">' + icon('mail') + '</a>' : '') +
    '<button class="icon-btn" data-del="' + i + '" aria-label="' + esc(t('Remove')) + ' ' + esc(f.name) + '">' + icon('trash') + '</button></li>').join('') : '<li class="empty">' + esc(t('No one added yet.')) + '</li>') + '</ul>' +
    '<div class="section-title"><h2>' + esc(t('Add someone')) + '</h2></div><form class="card" id="add">' +
    '<label class="field"><span>' + esc(t('Name')) + '</span><input type="text" name="name" required autocomplete="off"></label>' +
    '<label class="field"><span>' + esc(t('Role')) + '</span><select name="role"><option>' + esc(t('Sponsor')) + '</option><option>' + esc(t('Catechist')) + '</option><option>' + esc(t('Priest')) + '</option><option>' + esc(t('Friend from my group')) + '</option><option>' + esc(t('Other')) + '</option></select></label>' +
    '<label class="field"><span>' + esc(t('Phone (optional)')) + '</span><input type="tel" name="phone"></label>' +
    '<label class="field"><span>' + esc(t('Email (optional)')) + '</span><input type="email" name="email"></label>' +
    '<button class="btn block" type="submit">' + icon('plus') + esc(t('Add')) + '</button></form>';
  return {
    html, title: t('Friends on the journey'),
    bind(root) {
      root.querySelector('#add').onsubmit = e => {
        e.preventDefault(); const f = new FormData(e.target);
        const name = String(f.get('name') || '').trim(); if (!name) return;
        state.friends.push({ name, role: f.get('role'), phone: String(f.get('phone') || '').trim(), email: String(f.get('email') || '').trim() });
        save(); toast(t('Added')); rerender();
      };
      root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { state.friends.splice(+b.dataset.del, 1); save(); rerender(); });
    }
  };
}

export function involved() {
  const I = data.paths.involved;
  let html = back('#/me', t('Me')) + head(t('Parish'), t(I.title), I.intro) + '<div class="card tight">' +
    I.items.map(x => '<label class="check"><input type="checkbox" data-i="' + x.id + '"' + (state.involved[x.id] ? ' checked' : '') + '><span><strong>' + esc(x.name) + '</strong><br><span class="small muted">' + esc(x.about) + '</span></span></label>').join('') + '</div>' +
    '<p class="small muted">' + esc(t('Your parish office or bulletin will list who to contact for each ministry.')) + '</p>';
  return {
    html, title: t(I.title),
    bind(root) { root.querySelectorAll('[data-i]').forEach(c => c.onchange = () => { if (c.checked) state.involved[c.dataset.i] = true; else delete state.involved[c.dataset.i]; save(); }); }
  };
}

export function parish() {
  const P = data.parish;
  let html = back('#/me', t('Me')) + head(t('Parish'), t('My parish'), t('Add your parish and class time so they are always at hand.'));
  if (P.name) html += '<div class="parish-note"><div class="eyebrow">' + esc(t('Set up by your parish')) + '</div><strong>' + esc(P.name) + '</strong>' + (P.meets ? '<div>' + esc(P.meets) + '</div>' : '') + (P.welcome ? '<p style="margin:6px 0 0">' + esc(P.welcome) + '</p>' : '') +
    (Array.isArray(P.contacts) ? P.contacts.map(c => '<div class="small">' + esc(c.name) + (c.role ? ', ' + esc(c.role) : '') + (c.email ? ' · <a href="' + esc(safeUrl('mailto:' + c.email)) + '">' + esc(c.email) + '</a>' : '') + (c.phone ? ' · <a href="' + esc(safeUrl('tel:' + c.phone.replace(/[^\d+]/g, ''))) + '">' + esc(c.phone) + '</a>' : '') + '</div>').join('') : '') + '</div>';
  html += '<form class="card" id="pf"><label class="field"><span>' + esc(t('Parish name')) + '</span><input type="text" name="name" value="' + esc(state.parish.name) + '" placeholder="' + esc(t('e.g. St. Mary\'s')) + '"></label>' +
    '<label class="field"><span>' + esc(t('When classes meet')) + '</span><input type="text" name="meets" value="' + esc(state.parish.meets) + '" placeholder="' + esc(t('e.g. Tuesdays at 7 pm')) + '"></label>' +
    '<label class="field"><span>' + esc(t('Program')) + '</span><input type="text" value="' + esc(P.program || 'Symbolon') + '" disabled></label>' +
    '<button class="btn block" type="submit">' + esc(t('Save')) + '</button></form>' +
    '<p class="small muted">' + esc(t('Parish leaders: Heartward can be set up for your whole group by editing one file (content/parish.json) with your parish name, contacts, session order and notes for each session.')) + '</p>';
  return {
    html, title: t('My parish'),
    bind(root) { root.querySelector('#pf').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); state.parish = { name: String(f.get('name') || '').trim(), meets: String(f.get('meets') || '').trim() }; save(); toast(t('Saved')); location.hash = '#/me'; }; }
  };
}

export function settings() {
  const s = state.settings;
  const seg = (key, opts) => '<div class="seg-control" role="group">' + opts.map(([v, l]) => '<button data-k="' + key + '" data-v="' + v + '" aria-pressed="' + (s[key] === v) + '">' + l + '</button>').join('') + '</div>';
  const html = back('#/me', t('Me')) + head(t('App'), t('Settings'), '') +
    '<div class="card"><div class="eyebrow">' + esc(t('Text size')) + '</div>' + seg('size', [['small', 'A−'], ['normal', 'A'], ['large', 'A+'], ['xlarge', 'A++']]) +
    '<div class="eyebrow" style="margin-top:18px">' + esc(t('Appearance')) + '</div>' + seg('theme', [['system', esc(t('Auto'))], ['light', esc(t('Light'))], ['dark', esc(t('Dark'))]]) +
    (canSpeak ? '<div class="eyebrow" style="margin-top:18px">' + esc(t('Voice speed')) + '</div>' + seg('rate', [['slow', esc(t('Slow'))], ['normal', esc(t('Normal'))], ['fast', esc(t('Fast'))]]) +
      '<button class="btn ghost" id="vtest" style="margin-top:10px">' + icon('volume') + esc(t('Test the voice')) + '</button>' +
      '<p class="small muted" style="margin:8px 0 0">' + esc(t('Read-aloud uses your phone\'s own voice. To get a nicer one, look in your phone\'s settings under Accessibility, Spoken Content (iPhone) or Text-to-speech (Android).')) + '</p>' : '') +
    (SPANISH ? '<div class="eyebrow" style="margin-top:18px">' + esc(t('Language')) + '</div>' + seg('lang', [['en', 'English'], ['es', 'Español']]) +
    '<p class="small muted" style="margin:10px 0 0">' + esc(t('Spanish covers the app\'s menus and the prayers. Lessons are in English for now.')) + '</p>' : '') + '</div>' +
    '<div class="section-title"><h2>' + esc(t('Backup')) + '</h2></div><div class="card"><p class="small muted">' + esc(t('Your progress, journal and dates are saved only on this device. Save a backup file before changing phones or clearing your browser.')) + '</p>' +
    '<div class="btn-row" style="margin:0"><button class="btn soft" id="bk">' + icon('download') + esc(t('Save backup')) + '</button><button class="btn ghost" id="rs">' + icon('upload') + esc(t('Restore')) + '</button><input type="file" id="rf" accept="application/json,.json"></div></div>' +
    '<div class="section-title"><h2>' + esc(t('About')) + '</h2></div><div class="card flat small muted"><p>' + esc(t('Heartward is free, has no ads and no accounts, and works offline. Named for the disciples on the road to Emmaus, whose hearts burned within them as they walked with Jesus (Luke 24:32).')) + '</p><p style="margin:0">' + esc(t('Content is a draft for review by a catechist or priest. Always follow what your parish teaches.')) + '</p></div>';
  return {
    html, title: t('Settings'),
    bind(root) {
      root.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { state.settings[b.dataset.k] = b.dataset.v; save(); applySettings(); rerender(); });
      const vt = root.querySelector('#vtest');
      if (vt) vt.onclick = () => speak(['Our Father, who art in heaven, hallowed be thy name.']);
      root.querySelector('#bk').onclick = () => download('heartward-backup-' + localISO(new Date()) + '.json', JSON.stringify({ app: 'heartward', version: 2, state }, null, 2), 'application/json');
      const rf = root.querySelector('#rf');
      root.querySelector('#rs').onclick = () => rf.click();
      rf.onchange = () => {
        const f = rf.files && rf.files[0]; if (!f) return;
        f.text().then(txt => { const o = JSON.parse(txt); if (!o || o.app !== 'heartward' || !o.state) throw 0; replaceState(o.state); applySettings(); toast(t('Backup restored')); rerender(); })
          .catch(() => toast(t('That file is not a Heartward backup')));
      };
    }
  };
}

export function share() {
  const html = back('#/me', t('Me')) + head(t('Share'), t('Share with your class'), t('Heartward is free for anyone. Your sponsor or classmates can scan this code with their phone camera, or you can send them the link. It opens a short welcome page.')) +
    '<div class="qr" id="qr" aria-label="' + esc(t('QR code for')) + ' ' + WELCOME_URL + '"></div>' +
    '<p class="center" style="font-weight:600">' + APP_URL.replace('https://', '').replace(/\/$/, '') + '</p>' +
    '<div class="btn-row"><button class="btn block" id="sh">' + icon('share') + esc(t('Share link')) + '</button><button class="btn ghost block" id="cp">' + icon('link') + esc(t('Copy link')) + '</button></div>' +
    '<a class="card row" href="#/welcome"><span class="lead">' + icon('door') + '</span><span class="grow"><span class="title">' + esc(t('See the welcome page')) + '</span><span class="sub">' + esc(t('What your classmates will see first')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>' +
    '<div class="card flat small"><strong>' + esc(t('Nothing is shared but the link')) + '</strong><p class="muted" style="margin:6px 0 0">' + esc(t('Your journal, progress and dates stay on your phone. Each person who opens the link gets their own fresh copy of the app.')) + '</p></div>';
  return {
    html, title: t('Share with your class'),
    bind(root) {
      try {
        const qr = window.qrcode(0, 'M'); qr.addData(WELCOME_URL); qr.make();
        root.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      } catch (e) { root.querySelector('#qr').textContent = WELCOME_URL; }
      root.querySelector('#sh').onclick = () => {
        if (navigator.share) navigator.share({ title: 'Heartward', text: t('A free companion for RCIA: lessons, prayers and the Rosary on your phone.'), url: WELCOME_URL }).catch(() => {});
        else root.querySelector('#cp').click();
      };
      root.querySelector('#cp').onclick = () => {
        (navigator.clipboard ? navigator.clipboard.writeText(WELCOME_URL) : Promise.reject()).then(() => toast(t('Link copied'))).catch(() => toast(WELCOME_URL));
      };
    }
  };
}

// The first page a sponsor or classmate sees when they open a shared link.
export function welcome() {
  const pname = (data.parish && data.parish.name) || '';
  const feat = (ic, title, sub) => '<li><div class="row"><span class="lead">' + icon(ic) + '</span><span class="grow"><span class="title">' + esc(title) + '</span><span class="sub">' + esc(sub) + '</span></span></div></li>';
  const html =
    '<section class="welcome-hero"><img src="icon.svg" alt="" width="64" height="64"><div class="kicker">' + esc(pname ? t('For') + ' ' + pname : t('Welcome')) + '</div>' +
    '<h1>' + esc(t('Welcome to Heartward')) + '</h1>' +
    '<p>' + esc(t('A free companion for anyone walking toward the Catholic faith in RCIA, for sponsors walking beside them, and for Catholics coming home.')) + '</p>' +
    '<blockquote>' + esc(t('"Were not our hearts burning within us while he spoke to us on the way?"')) + '<cite>Luke 24:32</cite></blockquote></section>' +
    '<div class="section-title"><h2>' + esc(t('What is inside')) + '</h2></div><ul class="list card tight">' +
    feat('road', t('The journey, week by week'), t('Lessons that follow the class, with pictures, charts and a private journal.')) +
    feat('candle', t('Prayers to learn by heart'), t('Listen to each prayer, repeat it line by line, and practice from memory.')) +
    feat('rosary', t('The Rosary, step by step'), t('Bead by bead, with the words, or read aloud as you pray.')) +
    feat('church', t('Mass guide and answers'), t('When to sit, stand and kneel, common questions, words and saints.')) +
    '</ul>' +
    '<div class="section-title"><h2>' + esc(t('Free and private')) + '</h2></div><div class="card flat"><p style="margin:0">' + esc(t('No sign-up, no ads, nothing to pay. Your notes and progress stay on your own phone, and after the first visit it works without internet.')) + '</p></div>' +
    '<div class="section-title"><h2>' + esc(t('Put it on your home screen')) + '</h2></div><ol class="steps card">' +
    '<li><strong>iPhone:</strong> ' + esc(t('open this page in Safari, tap the Share button, then "Add to Home Screen."')) + '</li>' +
    '<li><strong>Android:</strong> ' + esc(t('open it in Chrome, tap the ⋮ menu, then "Add to Home screen" or "Install app."')) + '</li></ol>' +
    '<div class="btn-row" style="margin-top:20px"><a class="btn block" href="#/journey">' + icon('road') + esc(t('Start the journey')) + '</a><a class="btn ghost block" href="#/pray">' + icon('candle') + esc(t('Explore prayers')) + '</a></div>' +
    '<p class="small muted center" style="margin-top:18px">' + esc(t('Heartward does not replace your parish program. Always follow what your catechist and priest teach.')) + '</p>';
  return { html, title: t('Welcome') };
}
