// Teaching diagrams drawn as inline SVG so they stay sharp, work offline and follow the light/dark theme.
// A lesson paragraph written as "[[figure:name]]" is replaced with the figure of that name.
import { esc, t } from './ui.js';

const txt = (x, y, s, o = {}) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') + '"' +
  (o.rot ? ' transform="rotate(' + o.rot + ' ' + x + ' ' + y + ')"' : '') +
  ' class="' + (o.cls || 'lbl') + '">' + esc(s) + '</text>';

// Several lines of text. "a|b" breaks the line; a Spanish translation may break its lines in other places.
const lines = (x, y, s, cls, lh = 17, anchor = 'start') => { const full = s.split('|').join(' '), tr = t(full), ls = (tr === full ? s : tr).split('|'); return ls.map((l, k) => txt(x, y + k * lh, l, { anchor, cls })).join(''); };
const ARROW = '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="tip"/></marker></defs>';

const FIG = {
  // Shield of the Trinity: each Person "is" God; no Person "is not" another.
  trinity: () => {
    const F = [180, 60], S = [300, 268], H = [60, 268], G = [180, 196];
    const line = (a, b, cls) => '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + cls + '"/>';
    const mid = (a, b, k = .5) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    const onEdge = (a, b, s, dy) => { const m = mid(a, b); let r = ang(a, b); if (r > 90 || r < -90) r += 180; return txt(m[0], m[1] + dy, s, { rot: r, cls: 'edge' }); };
    const spoke = (a, s) => { const m = mid(a, G, .48); return '<rect x="' + (m[0] - 13) + '" y="' + (m[1] - 10) + '" width="26" height="18" rx="9" class="pill"/>' + txt(m[0], m[1] + 3.5, s, { cls: 'is' }); };
    return '<svg viewBox="0 0 360 330" role="img" aria-label="' + esc(t('Shield of the Trinity: the Father, the Son and the Holy Spirit are each God, and each is not the others.')) + '">' +
      line(F, S, 'side') + line(S, H, 'side') + line(H, F, 'side') +
      line(F, G, 'spoke') + line(S, G, 'spoke') + line(H, G, 'spoke') +
      onEdge(H, F, t('is not'), -8) + onEdge(F, S, t('is not'), -8) + onEdge(H, S, t('is not'), 20) +
      spoke(F, t('is')) + spoke(S, t('is')) + spoke(H, t('is')) +
      '<circle cx="' + G[0] + '" cy="' + G[1] + '" r="30" class="core"/>' + txt(G[0], G[1] + 6, t('God'), { cls: 'god' }) +
      '<circle cx="' + F[0] + '" cy="' + F[1] + '" r="9" class="node"/>' + txt(F[0], F[1] - 20, t('Father'), { cls: 'person' }) +
      '<circle cx="' + S[0] + '" cy="' + S[1] + '" r="9" class="node"/>' + txt(S[0], S[1] + 38, t('Son (Jesus)'), { cls: 'person' }) +
      '<circle cx="' + H[0] + '" cy="' + H[1] + '" r="9" class="node"/>' + txt(H[0] + 12, H[1] + 38, t('Holy Spirit'), { cls: 'person' }) +
      '</svg>';
  },
  // Faith involves the whole person: the mind believes and the will entrusts.
  faith: () => '<svg viewBox="0 0 360 230" role="img" aria-label="' + esc(t('Faith involves the intellect, believing, and the will, entrusting ourselves to God.')) + '">' +
    '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="tip"/></marker></defs>' +
    '<rect x="120" y="14" width="120" height="48" rx="24" class="core"/>' + txt(180, 45, t('Faith'), { cls: 'god' }) +
    '<line x1="160" y1="66" x2="102" y2="122" class="spoke" marker-end="url(#arr)"/><line x1="200" y1="66" x2="258" y2="122" class="spoke" marker-end="url(#arr)"/>' +
    '<rect x="12" y="128" width="156" height="84" rx="18" class="box"/>' + txt(90, 158, t('Intellect'), { cls: 'person' }) + txt(90, 180, t('believing what'), { cls: 'lbl' }) + txt(90, 198, t('God reveals'), { cls: 'lbl' }) +
    '<rect x="192" y="128" width="156" height="84" rx="18" class="box"/>' + txt(270, 158, t('Will'), { cls: 'person' }) + txt(270, 180, t('entrusting'), { cls: 'lbl' }) + txt(270, 198, t('ourselves to him'), { cls: 'lbl' }) +
    '</svg>',
  // Three-legged stool: the Church's teaching stands on Scripture, Tradition and the Magisterium together.
  stool: () => '<svg viewBox="0 0 360 290" role="img" aria-label="' + esc(t('A three-legged stool: the seat is the Church; the legs are Scripture, Tradition and the Magisterium. Remove one and it falls.')) + '">' +
    '<path d="M70 120 L52 236" class="leg"/><path d="M290 120 L308 236" class="leg"/><path d="M180 136 L180 252" class="leg"/>' +
    '<ellipse cx="180" cy="104" rx="128" ry="36" class="core"/>' + txt(180, 111, t('Church'), { cls: 'god' }) +
    txt(52, 266, t('Scripture'), { cls: 'person' }) + txt(308, 266, t('Tradition'), { cls: 'person' }) + txt(180, 282, t('Magisterium'), { cls: 'person' }) +
    '</svg>',
  // The 73 books of the Catholic Bible, grouped by kind.
  canon: () => {
    const groups = [
      [t('Old Testament'), 46, [[t('Pentateuch (Law)'), 5], [t('Historical books'), 16], [t('Wisdom books'), 7], [t('Prophets'), 18]]],
      [t('New Testament'), 27, [[t('Gospels'), 4], [t('Acts of the Apostles'), 1], [t('Letters of Paul'), 13], [t('Other letters'), 8], [t('Revelation'), 1]]]
    ];
    let y = 8, out = '';
    groups.forEach(([name, n, parts]) => {
      out += txt(12, y + 20, name, { anchor: 'start', cls: 'person' }) + txt(348, y + 20, n + ' ' + t('books'), { anchor: 'end', cls: 'god' });
      y += 32;
      parts.forEach(([p, k]) => {
        const w = Math.max(30, Math.round(k / 18 * 190));
        out += txt(12, y + 17, p, { anchor: 'start', cls: 'lbl' }) + '<rect x="150" y="' + (y + 4) + '" width="' + w + '" height="18" rx="9" class="core"/>' + txt(150 + w + 8, y + 18, String(k), { anchor: 'start', cls: 'is' });
        y += 26;
      });
      y += 10;
    });
    return '<svg viewBox="0 0 360 ' + y + '" role="img" aria-label="' + esc(t('The 73 books of the Catholic Bible: 46 in the Old Testament and 27 in the New Testament.')) + '">' + out + '</svg>';
  },
  // God's covenants, from Adam to Jesus: each one wider than the last.
  covenants: () => {
    const rows = [
      ['Adam', 'Husband', 'Marriage', 'Sabbath'], ['Noah', 'Father', 'Household', 'Rainbow'], ['Abram', 'Chieftain', 'Tribe', 'Circumcision'],
      ['Moses', 'Judge', 'Nation', 'Passover'], ['David', 'King', 'National|Kingdom', 'Throne'], ['Jesus', 'Royal High|Priest', 'Catholic|Church', 'Eucharist']
    ];
    const C = [112, 194, 268], H = 50, top = 44;
    const cell = (x, y, s, cls) => { const full = s.replace('|', ' '), tr = t(full), lines = (tr === full ? s : tr).split('|'); return lines.map((l, k) => txt(x, y + 5 + (k - (lines.length - 1) / 2) * 15, l, { anchor: 'start', cls })).join(''); };
    let out = txt(16, 20, t('Mediator'), { anchor: 'start', cls: 'edge' }) + txt(C[0], 20, t('Role'), { anchor: 'start', cls: 'edge' }) + txt(C[1], 20, t('Form'), { anchor: 'start', cls: 'edge' }) + txt(C[2], 20, t('Sign'), { anchor: 'start', cls: 'edge' });
    out += '<line x1="22" y1="' + top + '" x2="22" y2="' + (top + H * 5) + '" class="spoke"/>';
    rows.forEach((r, i) => {
      const y = top + i * H, last = i === rows.length - 1;
      out += '<circle cx="22" cy="' + y + '" r="' + (5 + i * 1.4) + '" class="' + (last ? 'node' : 'core') + '"/>' +
        txt(40, y + 5, t(r[0]), { anchor: 'start', cls: last ? 'nm hi' : 'nm' }) +
        cell(C[0], y, r[1], 'sm') + cell(C[1], y, r[2], 'sm') + cell(C[2], y, r[3], 'sm');
    });
    return '<svg viewBox="0 0 360 ' + (top + H * 5 + 26) + '" role="img" aria-label="' + esc(t('God\'s covenants from Adam to Jesus, each one widening God\'s family.')) + '">' + out + '</svg>';
  },
  // Creation, Fall, Redemption: the bonds with God (up and down) and with each other (side to side).
  salvation: () => {
    const rows = [
      ['Creation', 'Adam and Eve: unity in the|human family.|A united family', 'spoke'],
      ['Fall', 'Sin hurt our relationship with|God and each other, both the|vertical and the horizontal.|A broken human family', 'broken'],
      ['Redemption', 'Jesus restores us to the|Father and each other.|One family of God', 'spoke']
    ];
    const RH = 116;
    let out = ARROW;
    rows.forEach(([name, body, cls], i) => {
      const y = 8 + i * RH, g = [66, y + 16], ps = i === 1 ? [[20, y + 86], [66, y + 96], [112, y + 86]] : [[30, y + 80], [66, y + 90], [102, y + 80]];
      const ln = (a, b) => '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + cls + '"/>';
      if (i === 2) out += '<line x1="66" y1="' + (y + 4) + '" x2="66" y2="' + (y + 72) + '" class="side"/><line x1="44" y1="' + (y + 28) + '" x2="88" y2="' + (y + 28) + '" class="side"/>';
      else out += ps.map(p => ln(g, p)).join('');
      out += ln(ps[0], ps[1]) + ln(ps[1], ps[2]);
      if (i !== 2) out += '<circle cx="' + g[0] + '" cy="' + g[1] + '" r="11" class="core"/>';
      out += ps.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" class="node"/>').join('');
      out += txt(146, y + 26, t(name), { anchor: 'start', cls: 'person' }) + lines(146, y + 50, body, 'lbl', 18);
      if (i < 2) out += '<line x1="66" y1="' + (y + 104) + '" x2="66" y2="' + (y + RH + 2) + '" class="spoke" marker-end="url(#arr)"/>';
    });
    return '<svg viewBox="0 0 360 ' + (8 + RH * 3 - 6) + '" role="img" aria-label="' + esc(t('The story of salvation: in creation we are one family with God; the Fall breaks our bond with God and with each other; Jesus restores both.')) + '">' + out + '</svg>';
  },
  // Her drawn chart: God widens his family through certain leaders, up to the one universal Church.
  ladder: () => {
    const steps = [['Adam & Eve', 'couple'], ['Noah', 'one family'], ['Abraham', 'one tribe'], ['Moses', 'one nation'], ['David', 'one kingdom']];
    const yAt = x => 196 - (x - 14) * 0.6;
    let out = '<line x1="10" y1="196" x2="350" y2="196" class="side"/><line x1="14" y1="196" x2="268" y2="' + yAt(268) + '" class="spoke"/>';
    steps.forEach(([who, fam], i) => {
      const x = 36 + i * 50, top = yAt(x);
      out += '<line x1="' + x + '" y1="196" x2="' + x + '" y2="' + top + '" class="side"/>' +
        txt(x + 2, top - 6, t(fam), { anchor: 'start', rot: -62, cls: 'sm' }) +
        lines(x, 214, who === 'Adam & Eve' ? 'Adam|& Eve' : who, 'sm', 14, 'middle');
    });
    out += '<path d="M306 44 V196 M284 84 H328" class="leg"/>' + lines(306, 214, 'One universal|Catholic Church', 'sm', 14, 'middle');
    return '<svg viewBox="0 0 360 276" role="img" aria-label="' + esc(t('God widens his family step by step: a couple, one family, one tribe, one nation, one kingdom, and in Jesus one universal Catholic Church.')) + '"><g transform="translate(0 32)">' + out + '</g></svg>';
  },
  // Jesus: one divine Person, two natures. Each early heresy got one part wrong.
  natures: () => '<svg viewBox="0 0 360 336" role="img" aria-label="' + esc(t('Jesus Christ is one divine Person with two natures, truly God and truly man. Each early heresy denied one part.')) + '">' + ARROW +
    '<rect x="70" y="10" width="220" height="60" rx="30" class="core"/>' + txt(180, 37, t('Jesus Christ'), { cls: 'god' }) + txt(180, 58, t('one divine Person'), { cls: 'is' }) +
    '<line x1="140" y1="72" x2="96" y2="116" class="spoke" marker-end="url(#arr)"/><line x1="220" y1="72" x2="264" y2="116" class="spoke" marker-end="url(#arr)"/>' +
    '<rect x="12" y="122" width="150" height="72" rx="18" class="box"/>' + txt(87, 152, t('Truly God'), { cls: t('Truly God').length > 10 ? 'nm' : 'person' }) + txt(87, 176, t('divine nature'), { cls: 'lbl' }) +
    '<rect x="198" y="122" width="150" height="72" rx="18" class="box"/>' + txt(273, 152, t('Truly man'), { cls: t('Truly man').length > 10 ? 'nm' : 'person' }) + txt(273, 176, t('human nature'), { cls: 'lbl' }) +
    '<rect x="163" y="149" width="34" height="18" rx="9" class="pill"/>' + txt(180, 162, t('and'), { cls: 'is' }) +
    txt(87, 218, t('Denied by'), { cls: 'edge' }) + lines(87, 238, 'Arianism|Adoptionism', 'sm', 16, 'middle') +
    txt(273, 218, t('Denied by'), { cls: 'edge' }) + lines(273, 238, 'Docetism, Gnosticism|Apollinarianism|Monophysitism', 'sm', 16, 'middle') +
    '<line x1="40" y1="284" x2="320" y2="284" class="box"/>' +
    txt(180, 304, t('Distorted the union'), { cls: 'edge' }) + lines(180, 323, 'Nestorianism (two persons)', 'sm', 16, 'middle') +
    '</svg>',
  // The gap of sin, and the Cross that bridges it.
  bridge: () => '<svg viewBox="0 0 360 226" role="img" aria-label="' + esc(t('Sin opened a gap between God and humanity. The Cross of Jesus, true God and true man, bridges it.')) + '">' +
    '<path d="M8 74 H122 V218 H8 Z" class="core"/><path d="M238 74 H352 V218 H238 Z" class="box"/>' +
    txt(65, 150, t('God'), { cls: 'god' }) + lines(295, 144, 'Humanity', 'person', 20, 'middle') +
    '<path d="M180 16 L180 160" class="leg"/><path d="M30 64 L330 64" class="leg"/>' +
    txt(180, 196, t('the gap of sin'), { cls: 'edge' }) +
    '</svg>'
};

const CAPTION = {
  trinity: 'Read each line out loud: "The Father is God. The Father is not the Son." Three Persons, one God.',
  faith: 'Faith uses the whole person: the mind believes, and the will trusts.',
  stool: 'Take away any one leg and the stool falls. We need all three.',
  canon: 'The Catholic Bible has 73 books. Most Protestant Bibles have 66.',
  salvation: 'Creation, Fall, Redemption: the whole Bible in three words.',
  natures: 'Each early heresy got one part wrong. The Church holds it all together: one Person, truly God and truly man.',
  bridge: 'Sin opened a gap no human could close. Jesus, God and man, bridges it with his Cross.',
  ladder: 'God had a plan to restore humanity to Him and each other through certain leaders.',
  covenants: 'Each covenant widens God\'s family, from one couple to the whole world. Jesus fulfills them all.'
};

export function figure(name) {
  if (!FIG[name]) return '';
  return '<figure class="diagram">' + FIG[name]() + (CAPTION[name] ? '<figcaption>' + esc(t(CAPTION[name])) + '</figcaption>' : '') + '</figure>';
}

// A public-domain painting from Wikimedia Commons, written as "[[art:File_name.jpg|Caption]]".
// The phone loads it once and the service worker keeps it for offline use. If it cannot load, the figure hides itself.
export function art(file, caption) {
  const src = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=800';
  return '<figure class="art"><img src="' + src + '" alt="' + esc(t(caption)) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.hidden=true">' +
    '<figcaption>' + esc(t(caption)) + '</figcaption></figure>';
}

// Turns lesson paragraphs into HTML. Plain paragraphs stay paragraphs; a few simple markers add structure:
// "## Heading", "### Subheading", "> Quote — Author", "- List item", "[[figure:name]]" and "[[art:File.jpg|Caption]]".
export function lessonHtml(paras) {
  let html = '', list = [];
  const flush = () => { if (list.length) { html += '<ul class="lesson-list">' + list.map(li => '<li>' + li + '</li>').join('') + '</ul>'; list = []; } };
  paras.forEach(p => {
    const fig = p.match(/^\[\[figure:([\w-]+)\]\]$/), pic = p.match(/^\[\[art:([^|\]]+)\|([^\]]+)\]\]$/);
    if (p.startsWith('- ')) {
      const m = p.slice(2).match(/^([^:]{2,40}):\s(.*)$/);
      list.push(m ? '<strong>' + esc(m[1]) + ':</strong> ' + esc(m[2]) : esc(p.slice(2)));
      return;
    }
    flush();
    if (fig) html += figure(fig[1]);
    else if (pic) html += art(pic[1], pic[2]);
    else if (p.startsWith('### ')) html += '<h3 class="lh3">' + esc(p.slice(4)) + '</h3>';
    else if (p.startsWith('## ')) html += '<h2 class="lh">' + esc(p.slice(3)) + '</h2>';
    else if (p.startsWith('> ')) {
      const [q, who] = p.slice(2).split(' — ');
      html += '<blockquote><p>' + esc(q) + '</p>' + (who ? '<cite>' + esc(who) + '</cite>' : '') + '</blockquote>';
    } else html += '<p>' + esc(p) + '</p>';
  });
  flush();
  return html;
}

// Plain text of a lesson, for search.
export const lessonText = paras => (paras || []).filter(p => !p.startsWith('[[')).map(p => p.replace(/^(### |## |> |- )/, '')).join(' ');
