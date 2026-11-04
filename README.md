# Heartward

A free, offline-friendly companion for people walking the journey into the Catholic faith (OCIA): session-by-session lessons, a prayer library with a practice mode, questions and answers, and progress that lights up a path.

Live at **https://heartward.github.io** (GitHub Pages, deployed from `main`).

## How it works

- Plain HTML, CSS and JavaScript. No build step, no server, no accounts.
- Progress is saved only in the visitor's browser. The Home page has Save backup / Restore backup buttons.
- A service worker caches everything, so the app works offline after the first visit and can be added to the home screen.

## Editing content

All content lives in `content/`:

| File | What it holds |
| --- | --- |
| `sessions.json` | The four stages (with their rites) and every session: title, summary, lesson paragraphs, reflection question, prayer ids, sources. `status` is `draft` (written) or `outline` (title only, shows "coming soon"). |
| `prayers.json` | Each prayer: text, when it is prayed, what it means, sources. |
| `faq.json` | Questions and answers. |

After changing content, bump `CACHE` in `sw.js` (for example `heartward-v2`) so returning visitors get the update.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

Content is a draft and should be reviewed by a catechist or priest before sharing widely.
