# benweese.github.io

[![Test and deploy](https://github.com/benweese/benweese.github.io/actions/workflows/site.yml/badge.svg)](https://github.com/benweese/benweese.github.io/actions/workflows/site.yml)
[![Tested with Playwright and axe](https://img.shields.io/badge/tested%20with-Playwright%20%2B%20axe-2EAD33)](tests/)

My GitHub Pages front page, live at **[code.benweese.com](https://code.benweese.com/)**: a single-page hub for my Playwright projects. My main site and blog stay at [benweese.com](https://benweese.com/).

It's plain HTML and CSS with no framework and no build step: `index.html`, `styles.css`, `gears.css` and `gears.js` (the ticking-gears hero), `favicon.png` and a self-hosted Manrope font in `fonts/` (SIL Open Font License, in `fonts/OFL.txt`). `package.json` is for the tests only; nothing in it ships.

By **[Ben Weese](https://benweese.com/)**

## Tests

A small Playwright suite in [`tests/`](tests/) checks that:

- the page loads with its CSS, font and favicon and no console errors, with one `h1` and the expected sections
- every link, image and share-card URL resolves: a 404, a 410 or no answer fails the run. Sites that refuse automated requests (LinkedIn returns 999) are reported as warnings
- [axe-core](https://github.com/dequelabs/axe-core) finds no WCAG 2.0–2.2 A/AA or best-practice violations
- nothing scrolls sideways at 320px wide
- the skip link is the first tab stop and moves focus to the content
- `prefers-reduced-motion` turns transitions and smooth scrolling off, starts the gears paused and keeps the moth away
- the gears' pause button works by mouse and keyboard, is at least 44px, and pausing also freezes the moth and its caption. Add `#moth` to the URL to see the moth in about 2 seconds instead of waiting
- the meta tags, Open Graph and Twitter card, and Person JSON-LD are present

Run them locally (Node 20+):

```bash
npm ci
npx playwright install chromium
npm test            # serves the site on http://127.0.0.1:4173 and runs the suite
npm run serve       # just serve it, to look at the page
```

## Deploys

[`.github/workflows/site.yml`](.github/workflows/site.yml) runs on every pull request and push, plus weekly:

- **test** checks the page itself, and a push to `main` deploys to GitHub Pages only if it passes
- **links** checks every link separately. A 404 shows as a failed check but doesn't block a deploy, so the page never stays unpublished because another site is down

Only the deploy job has `pages: write` and `id-token: write`; everything else is read-only. Pages publishes only the site's own files, never `tests/` or `node_modules/`.
