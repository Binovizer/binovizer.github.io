# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Mohd Nadeem's personal portfolio: a static, single-page, interactive site with no build step, no `package.json`, no tests and no linter. The repo is `Binovizer/binovizer.github.io`, a GitHub Pages user site. GitHub serves `master` directly at `https://binovizer.github.io`, so **pushing to `master` is the deploy** and there is no staging. Do the work on a branch and merge only when the owner asks. The 2018 version is kept at tag `v2018-final`, which is the rollback target.

## Commands

- Preview: `python3 -m http.server 8000` from the repo root, then open `http://127.0.0.1:8000/`.
- There is no build, lint or test command. Check changes in a browser: 0 console errors, both themes (click the bulb), 375 px width, and "Emulate reduced motion" in DevTools.

## Architecture

There are exactly three source files and no third-party JS or CSS. The only external request is Google Fonts (Saira).

- `index.html` holds all content and markup. The character, scene, skyline, walker and court are **inline SVG**, styled by class names from `site.css`. Section ids `#landing`, `#about`, `#work` and `#contact` date from 2017 and may be linked from outside, so keep them.
- `css/site.css` holds the colour tokens: night is the default `:root`, and day is `[data-theme="day"]` on `<html>`. Every colour must come from a token so both themes work. The fixed `.sky` layer sits behind the whole page and swaps night for day by opacity.
- `js/site.js` is one IIFE. It runs one rAF-throttled scroll handler (the journey walker and rail) and a pointer handler (eye tracking and card tilt), and uses IntersectionObservers for reveal-on-scroll, count-up, the constellation intro and pausing the hero animations when they're off screen. The constellation SVG is **built from the `#groups` list**, so edit the skills there, not in JS.

- **Off-shift arcade** (`#arcade`): five mini-games in WAI-ARIA tabs. Each is a `Game(key)` in `site.js`, a shared shell with score, best (`localStorage` key `arcade-<key>`), timers, `halt()` and `finish()`, plus `start`, `action` and `reset` per game. Figures are built from the `FIGS` map into `[data-fig]` slots. It is one 60×110 cartoon rig: shoulders at (21,42), hips at (26,66), feet at y≈100, with limbs drawn as round-capped strokes by `arm()` and `legs()`. Add `.mirror` to face a figure left. Only the selected tab's game runs, and switching tabs halts it.

Conventions that span files:

- **Progressive enhancement:** an inline `<head>` script adds `.js` to `<html>` and applies the saved theme before first paint. Without JS, all content is visible: `.reveal` only hides when `.js` is set, and counters keep their final values in the HTML.
- **Motion budget:** each section gets at most one ambient animation and one interaction. Animate only `transform` and `opacity`. `prefers-reduced-motion` must yield a calm, complete page; `site.css` ends with that block, and `site.js` checks `reduced`.
- **Name clash:** CSS custom properties share one namespace. `--r` is the border-radius token, which is why the knight uses `--kc` and `--kr`.
- The theme choice is stored in `localStorage` under the key `theme`.

## Content and assets

- Career facts come from the owner's resume and their direct answers. Don't invent or embellish them. Keep Goldman Sachs details to what is already on the page, and never add internal or client specifics.
- The Resume button is intentionally absent until an updated PDF exists. `res/Mohd Nadeem Resume.pdf` is the 2018 one and is not linked.
- `img/project-*.jpg` are screenshots taken with headless Chrome. Hotel Manager screenshots must come from demo seed data (`@test.com` and `@hotel.com` guests), never from pilot or real data.
- `img/og.png` (1200×630) is the social preview: a capture of the hero with reduced motion forced. Regenerate it if the hero changes.
- `img/2-emotion-2.png` is the only 2017 asset left; it's the footer easter egg.
