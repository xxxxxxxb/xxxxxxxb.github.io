# Copilot instructions for this repository

## Build, test, and lint commands

This repository does not have a real build, lint, or test pipeline yet.

- `npm start` runs the Express server in `server.js`, serves the static site from the repository root, and exposes the guestbook API at `/api/messages`.
- `npm test` runs the placeholder script in `package.json` and exits with `Error: no test specified`.
- There is no single-test command because no test framework is configured.
- There is no build command; the frontend is plain static files.

## High-level architecture

The project is now a small personal site made of a static frontend plus a lightweight Node backend.

- `server.js` is the runtime entry point. It serves the static files, exposes `GET /api/messages` and `POST /api/messages`, and persists guestbook entries to a JSON file.
- `index.html` contains nearly all site content directly in markup: the blog-like entries, embedded Bilibili and NetEase players, the guestbook form shell, and the local video reference in `media\videos\mathvedio\1440p60\SquareToCircle.mp4`.
- `main.css` owns the page layout and look: the full-width hero area, the fade overlay, and the overlapping centered content card. Most visual changes should happen there rather than by restructuring the HTML.
- `main\main.js` is the browser-side interaction layer. It mounts a global Vue 3 app onto `#images` for the hero image carousel and also handles guestbook fetch/render/submit behavior against `/api/messages`.
- `mathvedio.py` is a Manim scene source, and `media\` contains its generated artifacts. The page embeds the generated MP4 directly rather than generating media at runtime.

## Key conventions

- Vue is loaded from the CDN in `index.html` and used through the global `Vue` object. Do not assume a bundled app, SFCs, or module-based imports.
- Content updates are usually direct edits to `index.html`; this repo does not separate posts into data files, templates, or components.
- The hero image switcher is hard-coded in `main\main.js`. When adding or removing hero images, update both the files in `main\img\` and the rotation logic.
- The guestbook frontend expects the API at the same origin under `/api/messages`. Keep that path stable unless you also update the browser fetch code or add a reverse proxy rule.
- Guestbook persistence is file-based; use the `MESSAGE_STORE_PATH` environment variable if you want the JSON store to live outside the deploy directory on the VPS.
- Asset paths are written as simple relative paths from `index.html` and are consumed directly by the browser. Preserve that static-file layout when moving assets.
