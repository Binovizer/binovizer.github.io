# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Nadeem's personal portfolio (he goes by "Nadeem" on the site, not "Mohd Nadeem"): a static, single-page, interactive site with no build step, no `package.json`, no tests and no linter. The repo is `Binovizer/binovizer.github.io`, a GitHub Pages user site. GitHub serves `master` directly at `https://binovizer.github.io`, so **pushing to `master` is the deploy** and there is no staging. Do the work on a branch and merge only when the owner asks. The 2018 version is kept at tag `v2018-final`, which is the rollback target.

## Commands

- Preview: `python3 -m http.server 8000` from the repo root, then open `http://127.0.0.1:8000/`.
- There is no build, lint or test command. Check changes in a browser: 0 console errors, both themes (click the bulb), 375 px width, and "Emulate reduced motion" in DevTools.

## Architecture

There are exactly three source files and no third-party JS or CSS. The only external request is Google Fonts (Saira).

- `index.html` holds all content and markup. The character, scene, skyline, walker and court are **inline SVG**, styled by class names from `site.css`. Section ids `#landing`, `#about`, `#work` and `#contact` date from 2017 and may be linked from outside, so keep them.
- `css/site.css` holds the colour tokens: night is the default `:root`, and day is `[data-theme="day"]` on `<html>`. Every colour must come from a token so both themes work. The fixed `.sky` layer sits behind the whole page and swaps night for day by opacity.
- `js/site.js` is one IIFE. It runs one rAF-throttled scroll handler (the journey walker and rail) and a pointer handler (eye tracking and card tilt), and uses IntersectionObservers for reveal-on-scroll, count-up, the constellation intro and pausing the hero animations when they're off screen. The constellation SVG is **built from the `#groups` list**, so edit the skills there, not in JS.

- **Off-shift arcade** (`#arcade`): five mini-games in WAI-ARIA tabs. Each is a `Game(key)` in `site.js`, a shared shell with score, best (`localStorage` key `arcade-<key>`), timers, `halt()` and `finish()`, plus `start`, `action` and `reset` per game. Figures are built from the `FIGS` map into `[data-fig]` slots. Badminton and cricket use stick figures on one 60×110 rig: head (30,14) r9, shoulders (30,32), hips (30,62), feet y≈104. `seg()` draws limbs as polylines and `head('r'|'f'|'b')` sets which way the face looks. Line colour comes from `--line` per figure in CSS. Football and PS5 use the cartoon rig (`arm()`, `legs()`, `TORSO`, `FACE`, `BACK`, coloured by `--kit`/`--legs`). Add `.mirror` to face a figure left. Figure heights are set per stage to real-world scale: a badminton player is about 1.1× the net, a cricketer about 2.5× the stumps. Only the selected tab's game runs, and switching tabs halts it.

- **Engagement layer:** `site.js` defines page-wide `confetti()`, `pop()` and `unlock(id)` near the top. Achievements are the `ACH` list, saved in `localStorage` under `achievements`, with a header trophy counter, panel and toasts; any feature can call `unlock('id')`. Hero chat answers live in `ANSWERS` and the `FUN` facts list, which must stay true. The impact tiles are a quiz: each `.tile.quiz` has `data-correct` (the option index), and the real number in `.ans` stays readable without JS. Journey stations carry `data-year`, and the `#years` chips scroll the walker to them. Contact `#intents` rewrite the `#contact-mail` subject and body.

Conventions that span files:

- **Progressive enhancement:** an inline `<head>` script adds `.js` to `<html>` and applies the saved theme before first paint. Without JS, all content is visible: `.reveal` only hides when `.js` is set, and counters keep their final values in the HTML.
- **Motion budget:** each section gets at most one ambient animation and one interaction. Animate only `transform` and `opacity`. `prefers-reduced-motion` must yield a calm, complete page; `site.css` ends with that block, and `site.js` checks `reduced`.
- **Name clash:** CSS custom properties share one namespace. `--r` is the border-radius token, which is why the knight uses `--kc` and `--kr`.
- The theme choice is stored in `localStorage` under the key `theme`. `<meta name="theme-color">` and `color-scheme` follow it, updated in the head script and `syncBulb()`.
- **Pause animations** (footer, WCAG 2.2.2) toggles the `.still` class on `<html>`, saved as `still` in `localStorage`. It freezes ambient loops only; games keep working. JS uses `calm()` (reduced motion OR still) for the typewriter.
- **Scroll handler:** `frame()` reads layout first, then writes. Static geometry (station tops, track height, nav offsets) is cached by `measure()` and refreshed on resize, load and track `ResizeObserver`. Don't add layout reads inside the write functions.
- Copy uses curly quotes and apostrophes (’ “ ”). Toggles use `aria-pressed`; the contact intents are a `radiogroup` with a roving tabindex.

## Content and assets

- Career facts come from the owner's resume and their direct answers. Don't invent or embellish them. Keep Goldman Sachs details to what is already on the page, and never add internal or client specifics.
- The Resume button is intentionally absent until an updated PDF exists. `res/Mohd Nadeem Resume.pdf` is the 2018 one and is not linked.
- `img/project-*.jpg` are screenshots taken with headless Chrome. Hotel Manager screenshots must come from demo seed data (`@test.com` and `@hotel.com` guests), never from pilot or real data.
- **Logo:** an N whose diagonal is a glowing bulb filament. It is inline SVG in `.brand` and themed by CSS (`.logo-*`). `img/logo.svg` is the standalone favicon; `favicon.ico` (32 px) and `img/apple-touch-icon.png` (180 px) are rendered from it with headless Chrome and `sips`. Change all of them together.
- `img/og.png` (1200×630) is the social preview: a capture of the hero with reduced motion forced. Regenerate it if the hero changes.
- `img/2-emotion-2.png` is the only 2017 asset left; it's the footer easter egg.
