// Liturgical calendar computed locally: seasons and moveable feasts (liturgical calendar for Canada, CCCB).
import { localISO } from './store.js';

export function easter(y) {
  // Anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
    f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function advent1(y) { const xmas = new Date(y, 11, 25); return add(xmas, -(xmas.getDay() || 7) - 21); }
function epiphany(y) { // In Canada: the Sunday between Jan 2 and Jan 8
  const j2 = new Date(y, 0, 2); return add(j2, (7 - j2.getDay()) % 7);
}
function baptismLord(y) { const ep = epiphany(y); return ep.getDate() >= 7 ? add(ep, 1) : add(ep, 7); }
function thanksgiving(y) { // Canadian Thanksgiving: second Monday of October
  const o1 = new Date(y, 9, 1); return new Date(y, 9, 1 + ((8 - o1.getDay()) % 7) + 7);
}
function holyFamily(y) { // Sunday after Christmas, or Dec 30 if Christmas is a Sunday
  const x = new Date(y, 11, 25); return x.getDay() === 0 ? new Date(y, 11, 30) : add(x, 7 - x.getDay());
}

export function moveable(y) {
  const e = easter(y), a1 = advent1(y);
  return {
    epiphany: epiphany(y), baptismLord: baptismLord(y), ashWednesday: add(e, -46), laetare: add(e, -21), palmSunday: add(e, -7),
    holyThursday: add(e, -3), goodFriday: add(e, -2), holySaturday: add(e, -1), easter: e, divineMercy: add(e, 7),
    ascension: add(e, 42) /* Canada: 7th Sunday of Easter */, pentecost: add(e, 49), trinity: add(e, 56), corpusChristi: add(e, 63), sacredHeart: add(e, 68),
    christKing: add(a1, -7), advent1: a1, gaudete: add(a1, 14), holyFamily: holyFamily(y), thanksgiving: thanksgiving(y)
  };
}

export function season(d) {
  const y = d.getFullYear(), m = moveable(y), t = d.getTime();
  const before = x => t < x.getTime(), on = x => t >= x.getTime();
  if (before(m.baptismLord) || t === m.baptismLord.getTime()) return 'christmas';
  if (on(m.advent1)) return t >= new Date(y, 11, 25).getTime() ? 'christmas' : 'advent';
  if (on(m.ashWednesday) && before(m.holyThursday)) return 'lent';
  if (on(m.holyThursday) && before(m.easter)) return 'triduum';
  if (on(m.easter) && !(t > m.pentecost.getTime())) return 'easter';
  return 'ordinary';
}

export const seasonColor = { violet: '#7a4fa0', white: '#e9e3d4', green: '#3b7a57', red: '#b23a3a', rose: '#d98aa6' };

// Upcoming celebrations from `from`, within `days` days.
export function upcoming(cal, saints, from, days) {
  const out = [], end = add(from, days), years = [from.getFullYear(), from.getFullYear() + 1];
  const push = (date, name, kind, extra) => { if (date >= from && date < end) out.push(Object.assign({ date, name, kind }, extra || {})); };
  for (const y of years) {
    const m = moveable(y);
    for (const k of Object.keys(cal.moveable)) if (m[k]) push(m[k], cal.moveable[k], 'feast');
    for (const f of cal.fixed) { const [mm, dd] = f.date.split('-').map(Number); push(new Date(y, mm - 1, dd), f.name, 'feast', { obligation: !!f.obligation }); }
    for (const s of saints) { if (s.calendar === false) continue; const [mm, dd] = s.feast.split('-').map(Number); push(new Date(y, mm - 1, dd), s.name, 'saint', { saintId: s.id }); }
  }
  const seen = new Set();
  return out.sort((a, b) => a.date - b.date).filter(x => { const k = localISO(x.date) + x.name; if (seen.has(k)) return false; seen.add(k); return true; });
}

export function rosaryForDay(guides, d) { return guides.rosary.byWeekday[d.getDay()]; }
