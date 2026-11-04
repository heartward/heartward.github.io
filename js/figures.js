// Teaching diagrams drawn as inline SVG so they stay sharp, work offline and follow the light/dark theme.
// A lesson paragraph written as "[[figure:name]]" is replaced with the figure of that name.
import { esc, t } from './ui.js';

const txt = (x, y, s, o = {}) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') + '"' +
  (o.rot ? ' transform="rotate(' + o.rot + ' ' + x + ' ' + y + ')"' : '') +
  ' class="' + (o.cls || 'lbl') + '">' + esc(s) + '</text>';

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
      '<circle cx="' + H[0] + '" cy="' + H[1] + '" r="9" class="node"/>' + txt(H[0], H[1] + 38, t('Holy Spirit'), { cls: 'person' }) +
      '</svg>';
  },
  // Faith involves the whole person: the mind believes and the will entrusts.
  faith: () => '<svg viewBox="0 0 360 230" role="img" aria-label="' + esc(t('Faith involves the intellect, believing, and the will, entrusting ourselves to God.')) + '">' +
    '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="tip"/></marker></defs>' +
    '<rect x="120" y="14" width="120" height="48" rx="24" class="core"/>' + txt(180, 45, t('Faith'), { cls: 'god' }) +
    '<line x1="160" y1="66" x2="102" y2="122" class="spoke" marker-end="url(#arr)"/><line x1="200" y1="66" x2="258" y2="122" class="spoke" marker-end="url(#arr)"/>' +
    '<rect x="12" y="128" width="156" height="84" rx="18" class="box"/>' + txt(90, 158, t('Intellect'), { cls: 'person' }) + txt(90, 180, t('believing what'), { cls: 'lbl' }) + txt(90, 198, t('God reveals'), { cls: 'lbl' }) +
    '<rect x="192" y="128" width="156" height="84" rx="18" class="box"/>' + txt(270, 158, t('Will'), { cls: 'person' }) + txt(270, 180, t('entrusting'), { cls: 'lbl' }) + txt(270, 198, t('ourselves to him'), { cls: 'lbl' }) +
    '</svg>'
};

const CAPTION = {
  trinity: 'Read each line out loud: "The Father is God. The Father is not the Son." Three Persons, one God.',
  faith: 'Faith uses the whole person: the mind believes, and the will trusts.'
};

export function figure(name) {
  if (!FIG[name]) return '';
  return '<figure class="diagram">' + FIG[name]() + (CAPTION[name] ? '<figcaption>' + esc(t(CAPTION[name])) + '</figcaption>' : '') + '</figure>';
}

// Turns lesson paragraphs into HTML. Plain paragraphs stay paragraphs; a few simple markers add structure:
// "## Heading", "> Quote — Author", "- List item", and "[[figure:name]]".
export function lessonHtml(paras) {
  let html = '', list = [];
  const flush = () => { if (list.length) { html += '<ul class="lesson-list">' + list.map(li => '<li>' + li + '</li>').join('') + '</ul>'; list = []; } };
  paras.forEach(p => {
    const fig = p.match(/^\[\[figure:([\w-]+)\]\]$/);
    if (p.startsWith('- ')) {
      const m = p.slice(2).match(/^([^:]{2,40}):\s(.*)$/);
      list.push(m ? '<strong>' + esc(m[1]) + ':</strong> ' + esc(m[2]) : esc(p.slice(2)));
      return;
    }
    flush();
    if (fig) html += figure(fig[1]);
    else if (p.startsWith('## ')) html += '<h3>' + esc(p.slice(3)) + '</h3>';
    else if (p.startsWith('> ')) {
      const [q, who] = p.slice(2).split(' — ');
      html += '<blockquote><p>' + esc(q) + '</p>' + (who ? '<cite>' + esc(who) + '</cite>' : '') + '</blockquote>';
    } else html += '<p>' + esc(p) + '</p>';
  });
  flush();
  return html;
}

// Plain text of a lesson, for search.
export const lessonText = paras => (paras || []).filter(p => !p.startsWith('[[')).map(p => p.replace(/^(## |> |- )/, '')).join(' ');
