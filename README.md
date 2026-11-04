# Heartward

A free, offline companion for people walking the journey into the Catholic faith (RCIA), and for those who come back to it. Named for the disciples on the road to Emmaus (Luke 24:32).

Live at **https://heartward.github.io** (GitHub Pages, deployed from `main`).

## What is inside

- **Today**: the current Church season, your progress ring, what is next, the Rosary of the day, feast days, your anniversaries and your patron saint's feast.
- **Journey**: the road to Easter, following the Symbolon sessions in four stages with their rites. Each session has a lesson, a reflection, prayers, sources and a private journal. After Easter: a first-year path and a welcome-back path.
- **Pray**: 29 prayers with a practice mode, a step-by-step Rosary with beads, a confession guide with an examination of conscience, and calendar reminders.
- **Learn**: Mass guide (when to sit, stand or kneel), first-week basics, questions, glossary, a saint finder and the Church calendar.
- **Me**: journal, weekly habits, sacrament dates and anniversaries, friends on the journey, getting involved, parish info, settings (text size, dark mode), backup and a QR code to share the app.
- **Listen**: read-aloud for prayers, lessons and the Rosary using the phone's own voice, with a "say it after me" mode for memorizing.
- **Share with your class**: a welcome page (`#/welcome`) with a QR code and link for sponsors and classmates.
- **Search** across everything, offline.

## How it works

- Plain HTML, CSS and JavaScript modules. No build step, no server, no accounts, no ads.
- Personal data stays in the browser (`localStorage`). Settings has Save backup / Restore.
- Reminders are calendar files (`.ics`) that the phone's own calendar runs.
- A service worker caches everything, so the app works offline and can be added to the home screen.

## Files

| Path | What it holds |
| --- | --- |
| `index.html`, `css/styles.css` | Page shell and design |
| `js/main.js` | Routes and app chrome |
| `js/views/*.js` | One file per section: today, journey, pray, learn, me, search |
| `js/speech.js` | Read-aloud (Web Speech API, no server) |
| `js/liturgy.js` | Easter date, moveable feasts and seasons, computed on the device |
| `js/i18n-es.js` | Spanish menu text (switched off for now: set `SPANISH = true` in `js/store.js` to bring it back) |
| `content/en/sessions.json` | Stages, rites and sessions. `status` is `draft` (written) or `outline` |
| `content/en/prayers.json` | Prayers with category, text, meaning and sources |
| `content/en/guides.json` | Mass, basics, confession and Rosary guides |
| `content/en/faq.json`, `glossary.json`, `saints.json`, `calendar.json`, `paths.json` | Questions, words, saints, feasts, and the first-year, welcome-back and get-involved paths |
| `content/es/prayers.json` | Spanish prayer texts |
| `content/parish.json` | Settings for one parish (see below) |

## Setting it up for a parish

Fork the repo and edit `content/parish.json`:

```json
{
  "name": "St. Mary's",
  "program": "Symbolon",
  "meets": "Tuesdays at 7 pm, parish hall",
  "welcome": "We are glad you are here.",
  "contacts": [{ "name": "Ana", "role": "RCIA coordinator", "phone": "555-0100", "email": "ocia@example.org" }],
  "notes": { "sym1-03": "Bring a Bible to class this week." },
  "order": ["s01", "sym1-01", "s03"]
}
```

`notes` adds a parish note to a session by its id. `order` (optional) lists session ids in your parish's order; sessions not listed are hidden.

After changing any file, bump `CACHE` in `sw.js` (for example `heartward-v4`) so returning visitors get the update.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

Content is a draft and should be reviewed by a catechist or priest before sharing widely.
