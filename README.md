# AIDict · YouGlish

A mobile-first Flask web app for finding real-world pronunciation examples with
[YouGlish](https://youglish.com/).

## Features

- YouGlish search only
- English, Swedish, French, and Chinese
- Search history stored locally on the device
- Mobile-first interface

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

The YouGlish widget requires an internet connection. Review YouGlish's API and
embedding policies before commercial distribution or packaging this website as
a native mobile app.
