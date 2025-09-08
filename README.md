# Jeopardy Project

A small Jeopardy-like game built with HTML, CSS, and JavaScript (jQuery + axios). The board displays 6 categories × 5 clues. Category and clue data are fetched from a public Jeopardy-style API.

Files of interest

- `jeopardy/index.html` — main page, loads CSS and JS and required CDN libraries.
- `jeopardy/jeopardy.css` — styles for the board, loading overlay, and controls.
- `jeopardy/jeopardy.js` — game logic: fetch categories, build the table, handle clicks.

Quick start

The app is static (no build step). Open `jeopardy/index.html` in a browser, or serve the directory with a simple HTTP server and visit http://localhost:8000/jeopardy:

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/jeopardy in your browser
```

Dependencies

- The app uses CDN-hosted libraries included in `index.html`:
  - jQuery
  - axios
  - lodash
  - DOMPurify (for safe HTML sanitization)

Configuration

- API endpoints and sizes are configurable from `jeopardy/jeopardy.js` via the `CONFIG` object near the top of the file:
  - `CONFIG.API_BASE` — base URL for the categories/category endpoints.
  - `CONFIG.NUM_CATEGORIES` — how many categories to load (default 6).
  - `CONFIG.NUM_CLUES` — how many clues per category (default 5).

Notes about the API

- The original assignment references the Springboard API at:
  `https://projects.springboard.com/jeopardy/api`

  The project currently uses a replacement API by default (see `CONFIG.API_BASE`) because the Springboard API is missing convenient sampling features. If you want to use the Springboard API instead, change `CONFIG.API_BASE` in `jeopardy/jeopardy.js` to:

  ```js
  CONFIG.API_BASE = "https://projects.springboard.com/jeopardy/api";
  ```

  When switching endpoints, consider the API semantics (path names and query parameters) and adjust fetch URLs if necessary.

Sanitization & formatting

- The app uses DOMPurify to sanitize HTML returned by the API, allowing a small whitelist of inline tags (e.g., `<i>` for movie titles). This preserves harmless formatting while preventing XSS.
- The code additionally unescapes common backslash-escaped quotes (e.g. `it\'s` -> `it's`).

Styling and behavior notes

- The board is a table (6 × 5). Cells start with `?`. Clicking a cell shows the question; clicking again shows the answer.
- The Start/Restart button reloads categories and clues.
- The app currently uses static CSS font sizes; automatic per-cell font-fitting was intentionally left out to keep behavior predictable. If you want auto-fit, reintroduce `fitAllCellText()` and `fitTextInCell()` in `jeopardy/jeopardy.js`.

Accessibility

- A loading overlay with ARIA attributes (`role="status"`, `aria-live`, `aria-hidden`) displays during data fetches.

Development tips

- If you change JavaScript files, refresh the page and clear cache (or use the browser dev tools) to ensure new code loads.
- For iterative styling, use the browser inspector to tweak `jeopardy.css` and apply changes back to the file.

Questions or next steps

- Want automatic per-cell font-fitting re-enabled?
- Prefer to switch `CONFIG.API_BASE` to the Springboard API now (I'll help adapt the fetch URLs)?

License

- This repo is for learning/demo purposes.
