import { data, byId } from '../data.js';
import { state, save, today } from '../store.js';
import { icon } from '../icons.js';
import { esc, t, toast, back, head, sources } from '../ui.js';
import { lessonHtml } from '../figures.js';
import { listenButton, bindListen, sentences } from '../speech.js';
import { daysToVigil } from './extras.js';

export const sessionNo = s => data.sessionList.indexOf(s) + 1;
export const nextSession = () => data.sessionList.find(s => !state.done[s.id]) || null;
export function progress() {
  const list = data.sessionList, done = list.filter(s => state.done[s.id]).length;
  const stages = data.stages.map(st => {
    const ss = list.filter(s => s.stage === st.id), d = ss.filter(s => state.done[s.id]).length;
    return { id: st.id, title: st.title, pct: ss.length ? d / ss.length : 0 };
  });
  return { done, total: list.length, pct: list.length ? done / list.length : 0, stages };
}
const rerender = () => document.dispatchEvent(new Event('heartward:render'));

export function view() {
  const next = nextSession();
  let html = head(t('Your journey'), t('The road to Easter'), t('Like the disciples on the road to Emmaus, you are not walking alone. Each session you finish lights another step. Your parish sets the exact schedule.'));
  const nv = daysToVigil();
  html += '<a class="card row" href="#/rites"><span class="lead">' + icon('candle') + '</span><span class="grow"><span class="title">' + esc(t('Steps along the way')) + '</span><span class="sub">' + esc(t('The rites before Easter and their dates')) + (nv > 0 ? ' · ' + nv + ' ' + esc(t('days to the Easter Vigil')) : '') + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  data.stages.forEach(st => {
    const ss = data.sessionList.filter(s => s.stage === st.id);
    if (!ss.length) return;
    const d = ss.filter(s => state.done[s.id]).length;
    html += '<section class="stage"><div class="stage-head"><div><div class="eyebrow">' + esc(t(st.subtitle)) + '</div><h2>' + esc(t(st.title)) + '</h2></div><span class="count">' + d + ' / ' + ss.length + '</span></div><ol class="road">';
    ss.forEach(s => {
      const lit = !!state.done[s.id];
      html += '<li class="' + (lit ? 'lit' : '') + (next === s ? ' next' : '') + '"><a class="stop" href="#/session/' + s.id + '">' +
        '<span class="node">' + (lit ? icon('check') : sessionNo(s)) + '</span><span class="info"><span class="title">' + esc(s.title) + '</span>' +
        '<span class="sub">' + esc(s.summary) + (s.status === 'outline' ? ' <span class="tag">' + esc(t('outline')) + '</span>' : '') + (state.journal[s.id] && (state.journal[s.id].notes || state.journal[s.id].questions) ? ' <span class="tag gold">' + esc(t('notes')) + '</span>' : '') + '</span></span></a></li>';
    });
    html += '</ol>';
    if (st.milestone) html += '<div class="milestone"><span class="mi">' + icon('candle') + '</span><div><strong>' + esc(st.milestone.title) + '</strong><div class="small muted">' + esc(st.milestone.about) + '</div></div></div>';
    html += '</section>';
  });
  const fy = data.paths.firstYear.months, fyDone = fy.filter(m => state.firstYear[m.id]).length;
  html += '<div class="section-title"><h2>' + esc(t('After Easter')) + '</h2></div><ul class="list card tight">' +
    '<li><a class="row" href="#/first-year"><span class="lead">' + icon('sparkle') + '</span><span class="grow"><span class="title">' + esc(t('Your first year')) + '</span><span class="sub">' + esc(t('One small step each month after you join')) + ' · ' + fyDone + '/' + fy.length + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li>' +
    '<li><a class="row" href="#/welcome-back"><span class="lead">' + icon('door') + '</span><span class="grow"><span class="title">' + esc(t('Welcome back')) + '</span><span class="sub">' + esc(t('For baptized Catholics returning after time away')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a></li></ul>';
  return { html, title: t('Journey') };
}

export function session(id) {
  const s = byId(data.sessionList, id);
  if (!s) return { html: back('#/journey', t('Journey')) + '<p class="empty">' + esc(t('Not found')) + '</p>' };
  const st = data.stages.find(x => x.id === s.stage);
  const done = !!state.done[s.id];
  const j = state.journal[s.id] || {};
  const pnote = data.parish.notes && data.parish.notes[s.id];
  let html = back('#/journey', t('Journey')) +
    '<header class="page-head"><div class="kicker">' + esc(t('Session')) + ' ' + sessionNo(s) + ' · ' + esc(t(st.title)) + '</div><h1>' + esc(s.title) + '</h1>' +
    (s.ref ? '<p class="small muted" style="margin:0 0 6px">' + esc(t('Follows')) + ' ' + esc(s.ref) + '</p>' : '') + '<p>' + esc(s.summary) + '</p></header>';
  if (pnote) html += '<div class="parish-note"><div class="eyebrow">' + esc(t('From your parish')) + '</div>' + esc(pnote) + '</div>';
  if (s.lesson && s.lesson.length) html += '<div class="listen-row">' + listenButton('ls', t('Listen to this lesson')) + '</div><div class="reading">' + lessonHtml(s.lesson) + '</div>';
  else html += '<div class="card flat"><p style="margin:0">' + esc(t('This lesson is still being written. Use the journal below to keep your notes from class, and they will be here when you come back.')) + '</p></div>';
  (s.deeper || []).forEach(d => { html += '<aside class="deeper"><div class="eyebrow">' + esc(t('Digging deeper')) + '</div><h3>' + esc(d.title) + '</h3>' + lessonHtml(d.text.split('\n\n')) + '</aside>'; });
  html += '<a class="card row week-link" href="#/week/' + s.id + '"><span class="lead">' + icon('sparkle') + '</span><span class="grow"><span class="title">' + esc(t('This week\'s activities')) + '</span><span class="sub">' + esc(t('Memory verse, Bible study, quiz, questions to discuss, saint and challenge')) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';
  if (s.reflection) html += '<div class="reflection"><div class="eyebrow">' + esc(t('Reflect')) + '</div><p>' + esc(s.reflection) + '</p></div>';
  if (s.prayers && s.prayers.length) {
    html += '<div class="section-title"><h2>' + esc(t('Prayers for this week')) + '</h2></div><div class="chips">' + s.prayers.map(pid => {
      const p = byId(data.prayers, pid); if (!p) return '';
      return '<a class="chip' + (state.learned[pid] ? ' on' : '') + '" href="#/prayer/' + pid + '">' + (state.learned[pid] ? '<span class="ok-mark">' + icon('check') + '</span>' : '') + esc(p.title) + '</a>';
    }).join('') + '</div>';
  }
  html += sources(s.sources);
  html += '<div class="section-title"><h2>' + esc(t('My journal')) + '</h2><span class="saved-hint" id="saved"></span></div>' +
    '<div class="card"><label class="field"><span>' + esc(t('Notes from class and my thoughts')) + '</span><textarea id="j-notes" placeholder="' + esc(t('What stood out to you this week?')) + '">' + esc(j.notes || '') + '</textarea></label>' +
    '<label class="field" style="margin:0"><span>' + esc(t('Questions to ask my catechist or sponsor')) + '</span><textarea id="j-questions" style="min-height:80px" placeholder="' + esc(t('Anything you are wondering about')) + '">' + esc(j.questions || '') + '</textarea></label>' +
    '<p class="small muted" style="margin:10px 0 0">' + esc(t('Saved only on this device.')) + '</p></div>';
  html += '<div class="btn-row" style="margin-top:22px"><button class="btn block ' + (done ? 'ok' : '') + '" id="toggle-done">' + (done ? icon('check') + esc(t('Completed')) : icon('flame') + esc(t('Mark as completed'))) + '</button></div>';
  const i = data.sessionList.indexOf(s), nxt = data.sessionList[i + 1];
  if (nxt) html += '<a class="card row" style="margin-top:6px" href="#/session/' + nxt.id + '"><span class="grow"><span class="eyebrow">' + esc(t('Next')) + '</span><span class="title">' + esc(nxt.title) + '</span></span><span class="chev">' + icon('chevron') + '</span></a>';

  return {
    html, title: s.title,
    bind(root) {
      // Lesson text for read-aloud: skip figures and paintings, drop the formatting marks.
      bindListen(root, 'ls', () => {
        const plain = p => p.startsWith('[[') ? '' : p.replace(/^(## |> |- )/, '').replace(/ — /g, '. ').replace(/\(Catechism [^)]*\)/g, '');
        const paras = (s.lesson || []).map(plain);
        (s.deeper || []).forEach(d => { paras.push(t('Digging deeper') + ': ' + d.title + '.'); d.text.split('\n\n').forEach(x => paras.push(plain(x))); });
        if (s.reflection) paras.push(t('Reflect') + ': ' + s.reflection);
        return paras.filter(Boolean).flatMap(sentences);
      }, { gap: x => /[.!?]$/.test(x) ? 260 : 120 });
      root.querySelector('#toggle-done').onclick = () => {
        if (state.done[s.id]) delete state.done[s.id]; else { state.done[s.id] = today(); toast(t('Another step lit on your path')); }
        save(); rerender();
      };
      let timer;
      const persist = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const notes = root.querySelector('#j-notes').value, questions = root.querySelector('#j-questions').value;
          if (notes || questions) state.journal[s.id] = { notes, questions, updated: today() }; else delete state.journal[s.id];
          save(); const h = root.querySelector('#saved'); if (h) h.textContent = t('Saved');
        }, 400);
      };
      root.querySelector('#j-notes').oninput = persist;
      root.querySelector('#j-questions').oninput = persist;
    }
  };
}

export function firstYear() {
  const fy = data.paths.firstYear;
  let html = back('#/journey', t('Journey')) + head(t('After Easter'), t(fy.title), fy.intro);
  html += '<ol class="road">' + fy.months.map((m, i) => {
    const lit = !!state.firstYear[m.id];
    return '<li class="' + (lit ? 'lit' : '') + '"><div class="stop"><span class="node">' + (lit ? icon('check') : (i + 1)) + '</span><span class="info" style="flex:1">' +
      '<span class="eyebrow">' + esc(t('Month')) + ' ' + (i + 1) + '</span><span class="title">' + esc(m.title) + '</span>' +
      '<span class="sub" style="color:var(--text);margin-top:6px">' + esc(m.lesson) + '</span>' +
      '<span class="sub" style="margin-top:8px"><strong>' + esc(t('This month')) + ':</strong> ' + esc(m.practice) + '</span>' +
      '<button class="btn sm ' + (lit ? 'ok' : 'soft') + '" style="margin-top:10px" data-fy="' + m.id + '">' + (lit ? icon('check') + esc(t('Done')) : esc(t('Mark done'))) + '</button></span></div></li>';
  }).join('') + '</ol>';
  return {
    html, title: t(fy.title),
    bind(root) {
      root.querySelectorAll('[data-fy]').forEach(b => b.onclick = () => {
        const id = b.dataset.fy; if (state.firstYear[id]) delete state.firstYear[id]; else { state.firstYear[id] = true; toast(t('Another step lit on your path')); }
        save(); rerender();
      });
    }
  };
}

export function welcomeBack() {
  const wb = data.paths.welcomeBack;
  let html = back('#/journey', t('Journey')) + head('', t(wb.title), wb.intro);
  html += '<ol class="road">' + wb.steps.map((st, i) => {
    const lit = !!state.welcomeBack[st.id];
    return '<li class="' + (lit ? 'lit' : '') + '"><div class="stop"><span class="node">' + (lit ? icon('check') : (i + 1)) + '</span><span class="info" style="flex:1">' +
      '<span class="title">' + esc(st.title) + '</span><span class="sub" style="color:var(--text);margin-top:6px">' + esc(st.body) + '</span>' +
      '<button class="btn sm ' + (lit ? 'ok' : 'soft') + '" style="margin-top:10px" data-wb="' + st.id + '">' + (lit ? icon('check') + esc(t('Done')) : esc(t('Mark done'))) + '</button></span></div></li>';
  }).join('') + '</ol>' +
    '<div class="tiles" style="margin-top:16px"><a class="tile" href="#/confession"><span class="ti">' + icon('heart') + '</span><span class="tt">' + esc(t('Confession guide')) + '</span></a>' +
    '<a class="tile" href="#/mass"><span class="ti">' + icon('church') + '</span><span class="tt">' + esc(t('Mass guide')) + '</span></a></div>';
  return {
    html, title: t(wb.title),
    bind(root) {
      root.querySelectorAll('[data-wb]').forEach(b => b.onclick = () => {
        const id = b.dataset.wb; if (state.welcomeBack[id]) delete state.welcomeBack[id]; else state.welcomeBack[id] = true;
        save(); rerender();
      });
    }
  };
}
