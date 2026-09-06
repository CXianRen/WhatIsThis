# AIDict · YouGlish

A mobile-first Flask web app for finding real-world pronunciation examples with
[YouGlish](https://youglish.com/).

## Features

- YouGlish search only
- English, Swedish, Dutch, French, and Chinese
- Accent selection for languages supported by YouGlish
- A custom mobile player for play/pause, replay, seeking, examples, and speed
- Search history, including language and accent, stored locally on the device
- Light and dark themes with the initial theme taken from the device
- Mobile-only interface

## Run locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python backend/app/main.py
```

Open `http://localhost:5000` on a phone or in a mobile browser viewport.

No database, account, AI service, or server-side API key is required.

## Project structure

```text
backend/app/main.py          Flask application
frontend/templates/index.html
frontend/static/css/app.css
frontend/static/js/app.js
frontend/static/js/youglish.js
```

The app uses YouGlish's official JavaScript widget as the video and caption
engine, while rendering its own controls around it. The widget requires an
internet connection. Review YouGlish's API and embedding policies before
commercial distribution or packaging this website as a native mobile app; the
[official developer policy](https://youglish.com/api/doc/js-api#developer-policy)
requires explicit permission for those uses.
