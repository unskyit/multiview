# MultiView — AMOLED & Calm Blue Progressive Web App

MultiView is a pure **HTML5 + CSS3 + Vanilla JavaScript (ES Modules)** Progressive Web App (PWA) designed for Android, tablet, and desktop browsers.

## What's Included in This Clean GitHub-Ready Package
Every file in this folder is required for your live PWA—no extra build tools, no Kotlin/Android Studio bloat, and no external CDN dependencies:

- `index.html` — Main responsive application shell (with dynamic status-bar color sync & fullscreen toggle)
- `manifest.webmanifest` — Fullscreen & Standalone PWA configuration, icons, and Web Share Target registration
- `service-worker.js` — Offline caching engine so MultiView works 100% offline after initial visit
- `offline.html` — Offline fallback screen
- `assets/icons/` — Studio-grade SVG and 4x supersampled PNG icons (`icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-icon-512.png`, `apple-touch-icon.png`, `favicon.png`)
- `css/` — Modular stylesheets (`reset.css`, `variables.css`, `themes.css`, `layout.css`, `navigation.css`, `components.css`, `viewers.css`, `dialogs.css`, `responsive.css`)
- `js/` — Modular Vanilla JS (`app.js`, `config.js`, `router.js`, `state.js`, `events.js`, `utils/`, `core/`, `viewers/`, `features/`, `storage/`, `adapters/`)

## How to Deploy to GitHub Pages & Install on Android (3 Minutes)
1. Create a new **Public** repository on GitHub (e.g., `multiview`).
2. Upload all files and folders from this zip directly into the root of your repository.
3. On GitHub, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and click **Save**.
4. Wait ~60 seconds, then open `https://<your-username>.github.io/multiview/` in **Chrome on your Android phone**.
5. Tap **Install** in the top bar (or Chrome's `⋮` menu → **Install app**). MultiView will appear on your Android home screen with its custom icon and launch in fullscreen mode!
