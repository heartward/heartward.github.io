/* Heartward: a static, offline-first companion. All personal data stays in this browser. */
(function () {
  'use strict';

  var STORE_KEY = 'heartward:v1';
  var data = { stages: [], sessions: [], prayers: [], faq: [] };
  var state = loadState();

  // ---------- storage ----------
  function loadState() {
    var fresh = { done: {}, learned: {}, updated: null };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return fresh;
      var parsed = JSON.parse(raw);
      return { done: parsed.done || {}, learned: parsed.learned || {}, updated: parsed.updated || null };
    } catch (e) { return fresh; }
  }
  function saveState() {
    state.updated = new Date().toISOString();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function stageOf(id) { return byId(data.stages, id); }
  function doneCount() { return data.sessions.filter(function (s) { return state.done[s.id]; }).length; }
  function nextSession() {
    for (var i = 0; i < data.sessions.length; i++) if (!state.done[data.sessions[i].id]) return data.sessions[i];
    return null;
  }
  function sessionNumber(s) { return data.sessions.indexOf(s) + 1; }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function safeUrl(u) { return /^https:\/\//.test(u) ? u : '#'; }

  // ---------- views ----------
  function pathHtml() {
    var next = nextSession();
    var html = '<div class="path" role="img" aria-label="' + doneCount() + ' of ' + data.sessions.length + ' sessions completed">';
    data.stages.forEach(function (st, si) {
      if (si > 0) html += '<span class="stage-gap"></span>';
      data.sessions.filter(function (s) { return s.stage === st.id; }).forEach(function (s) {
        var cls = 'dot' + (state.done[s.id] ? ' lit' : '') + (next === s ? ' next' : '');
        html += '<span class="' + cls + '"></span>';
      });
    });
    return html + '</div>';
  }

  function viewHome() {
    var next = nextSession();
    var learned = data.prayers.filter(function (p) { return state.learned[p.id]; }).length;
    var html = '<h1>Welcome, fellow traveler</h1>' +
      '<p class="muted">Like the disciples on the road to Emmaus, you are not walking alone. Each session you finish lights up another step on your path.</p>' +
      '<div class="card">' +
        '<div class="eyebrow">Your path of light</div>' + pathHtml() +
        '<div class="progress-label">' + doneCount() + ' of ' + data.sessions.length + ' sessions · ' + learned + ' of ' + data.prayers.length + ' prayers learned</div>' +
      '</div>';
    if (next) {
      var st = stageOf(next.stage);
      html += '<div class="card">' +
        '<div class="eyebrow">Up next · ' + esc(st ? st.title : '') + '</div>' +
        '<h2 style="margin-top:0">' + sessionNumber(next) + '. ' + esc(next.title) + '</h2>' +
        '<p class="muted">' + esc(next.summary) + '</p>' +
        '<a class="btn" href="#/session/' + next.id + '">Open session</a>' +
      '</div>';
    } else {
      html += '<div class="card"><h2 style="margin-top:0">You walked the whole road</h2><p>Every session is lit. Keep praying, keep coming to Mass, and stay close to your parish.</p></div>';
    }
    html += '<div class="card"><div class="eyebrow">Today</div><h3>Pray the Our Father slowly</h3>' +
      '<p class="muted small">Take one line at a time and think about what you are asking.</p>' +
      '<a class="btn secondary" href="#/prayer/our-father">Open prayer</a></div>';
    html += '<h2>Your data</h2>' +
      '<p class="small muted">Your progress is saved only on this device. Nothing is sent anywhere. Save a backup file before changing phones or clearing your browser.</p>' +
      '<div class="btn-row"><button class="btn secondary" id="backup">Save backup</button>' +
      '<button class="btn secondary" id="restore">Restore backup</button><input type="file" id="restore-file" accept="application/json,.json"></div>' +
      '<p class="notice">Heartward is a free companion and does not replace your parish program. Content is a draft written to be reviewed by a catechist or priest. Always follow what your parish teaches.</p>';
    return html;
  }

  function viewJourney() {
    var html = '<h1>Your journey</h1><p class="muted">Four stages, with a celebration (a rite) at the end of each. Your parish sets the exact schedule.</p>';
    data.stages.forEach(function (st) {
      html += '<div class="stage-head"><div class="eyebrow">' + esc(st.subtitle) + '</div><h2 style="margin-top:0">' + esc(st.title) + '</h2></div>';
      html += '<ul class="list card" style="padding:4px 12px">';
      data.sessions.filter(function (s) { return s.stage === st.id; }).forEach(function (s) {
        var done = !!state.done[s.id];
        html += '<li><a class="row' + (done ? ' lit' : '') + '" href="#/session/' + s.id + '">' +
          '<span class="num">' + (done ? '✓' : sessionNumber(s)) + '</span>' +
          '<span class="grow"><span class="title">' + esc(s.title) + '</span><span class="sub">' + esc(s.summary) +
          (s.status === 'outline' ? ' <span class="tag">coming soon</span>' : '') + '</span></span>' +
          '<span class="chev" aria-hidden="true">›</span></a></li>';
      });
      html += '</ul>';
      if (st.milestone) {
        html += '<div class="milestone"><span class="flame" aria-hidden="true">🕯</span><div><strong>' + esc(st.milestone.title) + '</strong><div class="small muted">' + esc(st.milestone.about) + '</div></div></div>';
      }
    });
    return html;
  }

  function prayerChips(ids) {
    if (!ids || !ids.length) return '';
    return '<h2>Prayers for this week</h2><div class="chips">' + ids.map(function (id) {
      var p = byId(data.prayers, id);
      if (!p) return '';
      return '<a class="chip' + (state.learned[id] ? ' learned' : '') + '" href="#/prayer/' + id + '">' + esc(p.title) + '</a>';
    }).join('') + '</div>';
  }

  function sourcesHtml(list, heading) {
    if (!list || !list.length) return '';
    return '<h2>' + heading + '</h2><div class="sources card">' + list.map(function (s) {
      return '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener">' + esc(s.title) + ' ↗</a>';
    }).join('') + '</div>';
  }

  function viewSession(id) {
    var s = byId(data.sessions, id);
    if (!s) return viewNotFound();
    var st = stageOf(s.stage);
    var done = !!state.done[s.id];
    var html = '<a class="back" href="#/journey">‹ Journey</a>' +
      '<div class="eyebrow">Session ' + sessionNumber(s) + ' · ' + esc(st ? st.title : '') + '</div>' +
      '<h1>' + esc(s.title) + '</h1><p class="muted">' + esc(s.summary) + '</p>';
    if (s.lesson && s.lesson.length) {
      html += '<div class="reading">' + s.lesson.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';
    } else {
      html += '<div class="card"><p style="margin:0">This lesson is still being written. Bring your notes from this week\'s parish session, and they can become part of it.</p></div>';
    }
    if (s.reflection) html += '<div class="reflection">' + esc(s.reflection) + '</div>';
    html += prayerChips(s.prayers);
    html += sourcesHtml(s.sources, 'Go deeper');
    html += '<div class="btn-row" style="margin-top:24px"><button class="btn' + (done ? ' done' : '') + '" id="toggle-done">' +
      (done ? '✓ Completed' : 'Mark as completed') + '</button></div>';
    var idx = data.sessions.indexOf(s);
    var nxt = data.sessions[idx + 1];
    if (nxt) html += '<p class="small"><a href="#/session/' + nxt.id + '">Next: ' + esc(nxt.title) + ' ›</a></p>';
    return html;
  }

  function viewPrayers() {
    var html = '<h1>Prayers</h1><p class="muted">Learn these by heart, one at a time. Open a prayer and use practice mode to test yourself.</p><ul class="list card" style="padding:4px 12px">';
    data.prayers.forEach(function (p) {
      var l = !!state.learned[p.id];
      html += '<li><a class="row' + (l ? ' lit' : '') + '" href="#/prayer/' + p.id + '"><span class="num">' + (l ? '✓' : '✢') + '</span>' +
        '<span class="grow"><span class="title">' + esc(p.title) + '</span><span class="sub">' + esc(p.when) + '</span></span><span class="chev" aria-hidden="true">›</span></a></li>';
    });
    return html + '</ul>';
  }

  // Practice mode: hide a share of words, chosen deterministically so the view is stable.
  function prayerTextHtml(text, level) {
    if (!level) return esc(text);
    var n = 0;
    return text.split(/(\s+)/).map(function (tok) {
      if (/^\s+$/.test(tok) || tok === '') return tok;
      n++;
      var hide = level >= 4 || ((n * 7) % 4) < level;
      return hide ? '<span class="hid" tabindex="0" role="button" aria-label="hidden word, tap to reveal">' + esc(tok) + '</span>' : esc(tok);
    }).join('');
  }

  function viewPrayer(id) {
    var p = byId(data.prayers, id);
    if (!p) return viewNotFound();
    var l = !!state.learned[p.id];
    return '<a class="back" href="#/prayers">‹ Prayers</a><h1>' + esc(p.title) + '</h1>' +
      '<p class="muted small">' + esc(p.when) + '</p>' +
      '<div class="practice"><label for="level">Practice: hide words <span id="level-label">(off)</span></label>' +
      '<input type="range" id="level" min="0" max="4" step="1" value="0" aria-describedby="level-label"></div>' +
      '<div class="prayer-text" id="prayer-text">' + prayerTextHtml(p.text, 0) + '</div>' +
      '<p class="small muted" style="margin-top:8px">In practice mode, tap a blank to peek at the word.</p>' +
      '<h2>What it means</h2><p>' + esc(p.meaning) + '</p>' +
      sourcesHtml(p.sources, 'Go deeper') +
      '<div class="btn-row" style="margin-top:24px"><button class="btn' + (l ? ' done' : '') + '" id="toggle-learned">' +
      (l ? '✓ I know this by heart' : 'Mark as learned') + '</button></div>';
  }

  function viewQuestions() {
    var html = '<h1>Questions</h1><p class="muted">Common questions from people starting the journey. Bring yours to your catechist or sponsor too.</p>' +
      '<input class="search" id="q" type="search" placeholder="Search questions" aria-label="Search questions">' +
      '<div id="qa-list">';
    data.faq.forEach(function (f, i) {
      html += '<details class="qa" data-text="' + esc((f.q + ' ' + f.a).toLowerCase()) + '"><summary>' + esc(f.q) + '</summary><div class="ans">' + esc(f.a) + '</div></details>';
    });
    return html + '</div><p class="muted small" id="qa-empty" hidden>No questions match. Try another word.</p>';
  }

  function viewNotFound() { return '<h1>Not found</h1><p><a href="#/">Go home</a></p>'; }

  // ---------- wiring ----------
  function bind(route, arg) {
    var el;
    if ((el = document.getElementById('toggle-done'))) el.onclick = function () {
      if (state.done[arg]) delete state.done[arg]; else { state.done[arg] = new Date().toISOString().slice(0, 10); toast('Another step lit ✦'); }
      saveState(); render();
    };
    if ((el = document.getElementById('toggle-learned'))) el.onclick = function () {
      if (state.learned[arg]) delete state.learned[arg]; else { state.learned[arg] = true; toast('Learned by heart ✦'); }
      saveState(); render();
    };
    var level = document.getElementById('level');
    if (level) {
      var p = byId(data.prayers, arg);
      var names = ['(off)', '(a few)', '(half)', '(most)', '(all)'];
      level.oninput = function () {
        document.getElementById('prayer-text').innerHTML = prayerTextHtml(p.text, +level.value);
        document.getElementById('level-label').textContent = names[+level.value];
      };
      document.getElementById('prayer-text').onclick = function (e) {
        if (e.target.classList.contains('hid')) e.target.classList.toggle('peek');
      };
      document.getElementById('prayer-text').onkeydown = function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('hid')) { e.preventDefault(); e.target.classList.toggle('peek'); }
      };
    }
    var q = document.getElementById('q');
    if (q) q.oninput = function () {
      var term = q.value.trim().toLowerCase(), shown = 0;
      document.querySelectorAll('#qa-list details').forEach(function (d) {
        var match = !term || d.getAttribute('data-text').indexOf(term) !== -1;
        d.hidden = !match; if (match) shown++;
      });
      document.getElementById('qa-empty').hidden = shown > 0;
    };
    if ((el = document.getElementById('backup'))) el.onclick = function () {
      var blob = new Blob([JSON.stringify({ app: 'heartward', version: 1, state: state }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'heartward-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    };
    if ((el = document.getElementById('restore'))) {
      var file = document.getElementById('restore-file');
      el.onclick = function () { file.click(); };
      file.onchange = function () {
        var f = file.files && file.files[0];
        if (!f) return;
        f.text().then(function (txt) {
          var parsed = JSON.parse(txt);
          if (!parsed || parsed.app !== 'heartward' || !parsed.state) throw new Error('not a backup');
          state = { done: parsed.state.done || {}, learned: parsed.state.learned || {}, updated: parsed.state.updated || null };
          saveState(); render(); toast('Backup restored');
        }).catch(function () { toast('That file is not a Heartward backup'); });
      };
    }
  }

  function render() {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/');
    var route = parts[0] || 'home', arg = parts[1];
    var html, tab = route;
    switch (route) {
      case 'home': html = viewHome(); break;
      case 'journey': html = viewJourney(); break;
      case 'session': html = viewSession(arg); tab = 'journey'; break;
      case 'prayers': html = viewPrayers(); break;
      case 'prayer': html = viewPrayer(arg); tab = 'prayers'; break;
      case 'questions': html = viewQuestions(); break;
      default: html = viewNotFound();
    }
    var view = document.getElementById('view');
    view.innerHTML = html;
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    bind(route, arg);
  }

  var lastHash = null;
  window.addEventListener('hashchange', function () {
    render();
    if (location.hash !== lastHash) { window.scrollTo(0, 0); lastHash = location.hash; }
  });

  function getJson(path) {
    return fetch(path).then(function (r) { if (!r.ok) throw new Error(path); return r.json(); });
  }

  Promise.all([getJson('content/sessions.json'), getJson('content/prayers.json'), getJson('content/faq.json')])
    .then(function (res) {
      data.stages = res[0].stages; data.sessions = res[0].sessions; data.prayers = res[1]; data.faq = res[2];
      render();
    })
    .catch(function () {
      document.getElementById('view').innerHTML = '<h1>Could not load</h1><p>Please check your connection and reload. After the first visit, Heartward works offline.</p>';
    });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
