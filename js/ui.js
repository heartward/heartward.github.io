import { icon } from './icons.js';
import { state } from './store.js';
import { ES } from './i18n-es.js';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = u => /^(https:\/\/|mailto:|tel:)/.test(u || '') ? u : '#';
// UI strings: English is the key; other languages map from it.
export function t(s) { return state.settings.lang === 'es' && ES[s] ? ES[s] : s; }
export function locale() { return state.settings.lang === 'es' ? 'es' : 'en-CA'; }
export function fmtDate(d, opts) { return d.toLocaleDateString(locale(), opts || { weekday: 'long', month: 'long', day: 'numeric' }); }
export function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

export function toast(msg) {
  document.querySelectorAll('.toast').forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = icon('sparkle') + '<span>' + esc(msg) + '</span>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

export function back(href, label) { return '<a class="back" href="' + href + '">' + icon('back') + esc(label) + '</a>'; }
export function head(kicker, title, intro) {
  return '<header class="page-head">' + (kicker ? '<div class="kicker">' + esc(kicker) + '</div>' : '') +
    '<h1>' + esc(title) + '</h1>' + (intro ? '<p>' + esc(intro) + '</p>' : '') + '</header>';
}
export function tile(href, ic, title, sub, cls) {
  return '<a class="tile' + (cls ? ' ' + cls : '') + '" href="' + href + '"><span class="ti">' + icon(ic) + '</span>' +
    '<span><span class="tt">' + esc(title) + '</span>' + (sub ? '<br><span class="ts">' + esc(sub) + '</span>' : '') + '</span></a>';
}
export function row(href, ic, title, sub, opts = {}) {
  return '<li><a class="row' + (opts.done ? ' done' : '') + '" href="' + href + '">' +
    '<span class="lead">' + (opts.done ? icon('check') : (opts.text ? esc(opts.text) : icon(ic))) + '</span>' +
    '<span class="grow"><span class="title">' + esc(title) + (opts.tag ? ' <span class="tag ' + (opts.tagCls || '') + '">' + esc(opts.tag) + '</span>' : '') + '</span>' +
    (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</span>' +
    '<span class="chev">' + icon('chevron') + '</span></a></li>';
}
export function sources(list) {
  if (!list || !list.length) return '';
  return '<div class="section-title"><h2>' + esc(t('Go deeper')) + '</h2></div><div class="card tight sources">' +
    list.map(s => '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener"><span>' + esc(s.title) + '</span>' + icon('external') + '</a>').join('') + '</div>';
}
export function acc(summary, body, open) {
  return '<details class="acc"' + (open ? ' open' : '') + '><summary><span>' + esc(summary) + '</span><span class="plus">' + icon('plus') + '</span></summary><div class="body">' + body + '</div></details>';
}
export function download(name, text, type) {
  const blob = new Blob([text], { type: type || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
// Calendar file (.ics) so reminders work without any server: the phone's own calendar does the reminding.
export function ics(events) {
  const z = n => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Heartward//EN', 'CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    const d = e.date;
    const dt = d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate());
    lines.push('BEGIN:VEVENT', 'UID:heartward-' + i + '-' + dt + '-' + Math.random().toString(36).slice(2) + '@heartward.github.io', 'DTSTAMP:' + stamp);
    if (e.time) { const [h, m] = e.time.split(':'); lines.push('DTSTART:' + dt + 'T' + h + m + '00', 'DURATION:PT10M'); }
    else lines.push('DTSTART;VALUE=DATE:' + dt);
    if (e.rrule) lines.push('RRULE:' + e.rrule);
    lines.push('SUMMARY:' + e.title.replace(/[,;]/g, '\\$&'));
    if (e.desc) lines.push('DESCRIPTION:' + e.desc.replace(/[,;]/g, '\\$&'));
    if (e.alarm) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + e.title.replace(/[,;]/g, '\\$&'), 'TRIGGER:-PT0M', 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
