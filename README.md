# AIDict · 查词与复习

A mobile-first static web app for real-world pronunciation examples with
[YouGlish](https://youglish.com/), a local wordbook, and short review sessions.
Version **0.2.0**. No Python backend, database server, account, build step, or API
key is required. The production site consists of HTML, CSS, JavaScript and icons.

## Use the app

- **查词**: search English, Swedish, Dutch, French, or Chinese; select an accent,
  listen to examples, and reuse local search history.
- **收藏**: tap the star beside the current word. A favorite stores the word or
  phrase, language, accent and an optional note. The same word in the same
  language has one entry even when searched with a different accent.
- **词本**: browse favorites, edit notes, and see how many words are due today.
- **复习**: practice up to 8 due words per round (or the remaining due words if
  fewer).
  Read a word aloud first, optionally tap **听例句**, then choose **再练** or
  **熟悉**. Practice words return later in the round; familiar words receive
  review intervals of 1, 3, 7, 14, 30, then 60 days. Cards appear without loading
  videos. **再练** resets a word to due now until it is marked familiar again.
- **备份**: export the wordbook and review progress as a JSON file; import a
  backup to restore or transfer it to another device. Import validates the whole
  file before adding words; existing words, notes and progress are preserved.

## Run locally

Use **Node.js 18 or newer** for the optional preview server:

```bash
node scripts/serve.mjs
```

Open `http://localhost:5000/`. The server exposes only the public app files;
it does not serve `venv/`, `data/`, `.git/`, or other workspace files.

To test the same subdirectory layout as a GitHub project site:

```bash
node scripts/serve.mjs --port 5000 --base /WhatIsThis/
```

Open `http://localhost:5000/WhatIsThis/`. To preview on another device on your
local network, add `--host 0.0.0.0` and use the computer's LAN address. Ordinary
LAN HTTP can preview the interface; installation and offline caching require
HTTPS or a browser's trusted localhost environment. Opening `index.html` through
`file://` is not supported.

Any static HTTPS host can serve this app. Node is only a local preview tool and
is not needed after deployment.

## Deploy to GitHub Pages

1. Push the project to a GitHub repository.
2. In **Settings → Pages → Build and deployment**, set **Source** to
   **GitHub Actions**.
3. Push to `main`, or run **Deploy AIDict to GitHub Pages** from the Actions tab.
   For a different production branch, change the workflow's `push.branches`.
4. Open the HTTPS URL shown by the deployment, normally
   `https://YOUR-NAME.github.io/REPOSITORY/`.

The included workflow stages only `index.html`, `static/`,
`manifest.webmanifest`, `sw.js` and `.nojekyll`. It does not publish the whole
checkout or local data. All application paths, manifest URLs and service worker
scope are relative, so both a project subdirectory and a root/custom domain work.
No deployment is performed simply by running the local preview server.

## Install and use offline

On compatible desktop or Android browsers, use the app's install button when
offered, or the browser's **Install app / Add to home screen** command. On iPhone
or iPad, open the site in Safari and choose **Share → Add to Home Screen**.
Installation options depend on the browser; the website remains usable without
installation.

After one successful online load completes the application cache:

| Available offline | Requires internet |
| --- | --- |
| Opening the app and the wordbook | Searching YouGlish for new examples |
| Reading/editing favorites and notes | Playing YouGlish/YouTube videos |
| Text review and saving review progress | Downloading a new app version |
| Importing/exporting a local backup | |

The service worker caches only this app's own interface files. It does not cache
third-party scripts, videos or captions. Listening to a saved word searches
YouGlish again; it does not promise to replay the exact video originally seen.

When a new version is ready, **更新应用** becomes available. Update after finishing
your current work; the app does not automatically reload an active review.
Updating the application cache leaves the wordbook database intact.

## Local data and backups

Favorites and review progress are stored in IndexedDB in the current browser.
Theme, language preferences and recent searches use localStorage. No wordbook is
uploaded to a server. Search text is sent to YouGlish when an online search or
listening request is made.

Export a backup regularly and before changing browser or site address. Devices
do not synchronize automatically; transfer the JSON file to import on another
device. Browser storage can be removed by clearing site data, private browsing
rules, device storage management, or uninstall behavior. A persistent-storage
request can reduce automatic eviction where supported, but is not a backup.

Browser data is tied to its origin (scheme, host and port). Changing domains,
switching HTTP to HTTPS, or moving between localhost ports does not transfer
existing data. Different GitHub Pages projects on the same hostname share an
origin; the app scopes its wordbook and service worker caches to its own path.
Changing the project path also requires exporting and importing a backup.
Backups contain the words and notes you wrote, so store them somewhere you trust.
The wordbook supports up to 10,000 entries, with 160 characters per word/phrase
and 1,000 characters per note. Imported files are limited to 100 MiB. A backup
uses the `aidict-wordbook` version 1 JSON format.

## Project structure

```text
index.html                    Application shell and mobile views
static/css/app.css            Layout and light/dark themes
static/js/app.js              Search, navigation and application integration
static/js/youglish.js          YouGlish player wrapper
static/js/wordbook-store.js    Local favorites, backup and review scheduling
static/js/wordbook.js          Wordbook and review interface
static/js/pwa.js               Installation, connection state and updates
static/icons/                 Install icons derived from static/favicon.svg
manifest.webmanifest          Install metadata with relative start URL/scope
sw.js                         Versioned, app-only offline cache
scripts/serve.mjs              Optional dependency-free local preview
.github/workflows/pages.yml   Static GitHub Pages deployment
```

When releasing changes, update the visible version in `index.html` and `VERSION`
in `sw.js` together. Add any new required application assets to `SHELL_FILES` in
`sw.js`. A missing precache file makes that worker installation fail and keeps
the previous installed version in use. During development, use the browser's
Service Workers panel to unregister the worker if you need immediate uncached
file changes; do not clear IndexedDB unless you intend to delete local favorites.

## Checks

The project has no npm dependencies to install. Run its Node tests with:

```bash
npm test
# Or directly:
node --test tests/*.test.mjs
```

For browser checks, preview both `/` and a repository subdirectory. Wait for the
offline-cache message, disconnect, reload and review saved words. Verify that a
version update stays pending until requested and that a failed precache keeps
the previous version usable. Video playback requires a separate online check on
the target device and browser.

References: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable),
[offline service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[browser storage limits](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
YouGlish is a third-party service; its availability, video playback and API usage
remain subject to [its developer policy](https://youglish.com/api/doc/js-api#developer-policy).
