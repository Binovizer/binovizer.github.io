(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  function $(id) { return document.getElementById(id); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function restartClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.getBoundingClientRect(); // force reflow so the animation restarts
    el.classList.add(cls);
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  $('year').textContent = new Date().getFullYear();

  /* ---- Shared effects: confetti and floating text (used page-wide) ---- */
  var COLORS = ['#4cc9f0', '#ffd166', '#ff5c8a', '#3ddc97', '#a78bfa'];
  function confetti(box, n) {
    if (reduced) return;
    var w = box.clientWidth || window.innerWidth, h = box.clientHeight || window.innerHeight;
    for (var i = 0; i < n; i++) {
      var c = document.createElement('i');
      c.className = 'confetto';
      c.style.cssText = 'left:50%;top:40%;background:' + COLORS[i % COLORS.length] + ';--x:' + rand(-.5, .5) * w + 'px;--y:' + rand(-.5, .55) * h + 'px;--rot:' + rand(-540, 540) + 'deg';
      box.appendChild(c);
      setTimeout(c.remove.bind(c), 1200);
    }
  }
  function pop(box, text, x, y, cls) {
    var d = document.createElement('div');
    d.className = 'pop' + (cls ? ' ' + cls : '');
    d.style.left = x + '%'; d.style.top = y + '%';
    d.textContent = text;
    box.appendChild(d);
    setTimeout(d.remove.bind(d), 950);
  }

  /* ---- Achievements: page-wide, saved on this device ---- */
  var ACH = [
    ['bulb', '💡', 'Let there be light', 'Pull the bulb'],
    ['wave', '👋', 'Hello there', 'Make me wave'],
    ['chat', '💬', 'Small talk', 'Ask me a question'],
    ['quiz', '🧠', 'Numbers nerd', 'Finish the impact quiz'],
    ['journey', '🧭', 'Career explorer', 'Walk the journey to Goldman Sachs'],
    ['stars', '✨', 'Stargazer', 'Light up a skill constellation'],
    ['smash', '🏸', 'Smash!', 'Land a perfect smash'],
    ['six', '🏏', 'Maximum', 'Hit a six'],
    ['siu', '⚽', 'SIUUU', 'Score a penalty'],
    ['brilliant', '♞', 'Brilliant ‼', 'Find the shortest knight route'],
    ['wanted', '🎮', 'Most wanted', 'Reach 3 wanted stars'],
    ['mail', '✉️', 'Say hi', 'Press Email me']
  ];
  var got = [];
  try { got = JSON.parse(localStorage.getItem('achievements') || '[]') || []; } catch (e) { got = []; }
  var trophy = $('trophy'), achPanel = $('ach-panel'), achList = $('ach-list'), toasts = $('toasts');
  function renderAch() {
    $('ach-count').textContent = got.length;
    achList.innerHTML = ACH.map(function (a) {
      var has = got.indexOf(a[0]) >= 0;
      return '<li class="' + (has ? 'got' : 'locked') + '"><span class="e" aria-hidden="true">' + a[1] + '</span><b>' + (has ? a[2] : 'Locked') +
        '</b><small>' + a[3] + (has ? ' ✓' : '') + '</small></li>';
    }).join('');
  }
  function toast(text) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    toasts.appendChild(t);
    while (toasts.children.length > 2) toasts.removeChild(toasts.firstChild); // keep it calm during fast play
    setTimeout(function () { t.classList.add('out'); }, 3200);
    setTimeout(t.remove.bind(t), 3600);
  }
  function unlock(id) {
    if (got.indexOf(id) >= 0) return;
    var a = ACH.filter(function (x) { return x[0] === id; })[0];
    if (!a) return;
    got.push(id);
    try { localStorage.setItem('achievements', JSON.stringify(got)); } catch (e) {}
    renderAch();
    restartClass(trophy, 'bump', 400);
    toast(a[1] + ' Achievement unlocked: ' + a[2] + ' (' + got.length + '/' + ACH.length + ')');
    if (got.length === ACH.length) {
      setTimeout(function () {
        toast('🎉 All ' + ACH.length + ' unlocked. You have seen everything. Now say hi!');
        confetti($('celebrate'), 80);
      }, 900);
    }
  }
  renderAch();
  function closePanel(refocus) {
    var hadFocus = achPanel.contains(document.activeElement);
    achPanel.hidden = true;
    trophy.setAttribute('aria-expanded', 'false');
    if (refocus || hadFocus) trophy.focus();
  }
  trophy.addEventListener('click', function () {
    if (!achPanel.hidden) { closePanel(true); return; }
    achPanel.hidden = false;
    trophy.setAttribute('aria-expanded', 'true');
    achPanel.focus();
  });
  document.addEventListener('click', function (e) {
    if (!achPanel.hidden && !achPanel.contains(e.target) && !trophy.contains(e.target)) closePanel(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !achPanel.hidden) closePanel(true);
  });
  // Tabbing out of the panel closes it, so it never hangs open behind the page.
  achPanel.addEventListener('focusout', function (e) {
    if (!achPanel.hidden && e.relatedTarget && !achPanel.contains(e.relatedTarget) && e.relatedTarget !== trophy) closePanel(false);
  });

  /* ---- Sky: stars and lit windows ---- */
  var stars = $('stars'), frag = document.createDocumentFragment();
  for (var i = 0; i < 110; i++) {
    var s = document.createElement('span'), size = rand(1, 2.6);
    s.className = 'star' + (i % 3 === 0 ? ' tw' : '');
    s.style.cssText = 'left:' + rand(0, 100) + '%;top:' + rand(0, 85) + '%;width:' + size + 'px;height:' + size +
      'px;--d:' + rand(2, 6) + 's;--dl:' + rand(0, 4) + 's';
    frag.appendChild(s);
  }
  stars.appendChild(frag);

  var city = document.querySelector('.city'), wins = $('windows'), NS = 'http://www.w3.org/2000/svg';
  for (var w = 0; w < 140 && wins.childNodes.length < 45; w++) {
    var x = Math.round(rand(2, 1070)), y = Math.round(rand(30, 110));
    try { if (!city.isPointInFill(new DOMPoint(x + 2, y + 3))) continue; } catch (e) { break; }
    var r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', 4); r.setAttribute('height', 6);
    r.setAttribute('class', 'win' + (Math.random() < .3 ? ' tw' : ''));
    r.style.setProperty('--d', rand(3, 9) + 's');
    wins.appendChild(r);
  }

  /* ---- Bulb = theme switch ---- */
  var bulb = $('bulb');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncBulb() {
    var day = root.dataset.theme === 'day';
    if (themeMeta) themeMeta.content = day ? '#ffd3a1' : '#060a18';
    bulb.setAttribute('aria-pressed', String(day));
    bulb.setAttribute('aria-label', day ? 'Lights off (switch to night theme)' : 'Lights on (switch to day theme)');
  }
  syncBulb();
  bulb.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'day' ? 'night' : 'day';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    syncBulb();
    restartClass(bulb, 'swing', 900);
    unlock('bulb');
  });

  /* ---- Typewriter + talk to the character ---- */
  var typed = $('typed'), scene = $('scene'), typeTimer, resumeTimer;
  var GREETING = 'Hi, I’m Nadeem 👋';
  function calm() { return reduced || root.classList.contains('still'); }
  var phrases = [GREETING, 'I lead the billing team at Goldman Sachs.', 'Ask me something below 👇', 'Pull the bulb ☝ top right'];
  // Array.from splits by code point, so the emoji are never cut in half.
  var chars = phrases.map(function (t) { return Array.from(t); });
  var p = 0, c = chars[0].length, deleting = true;
  function tick() {
    c += deleting ? -1 : 1;
    typed.textContent = chars[p].slice(0, c).join('');
    var delay = deleting ? 30 : 65;
    if (deleting && c === 0) { deleting = false; p = (p + 1) % chars.length; delay = 400; }
    else if (!deleting && c === chars[p].length) { deleting = true; delay = 2200; }
    typeTimer = setTimeout(tick, delay);
  }
  if (calm()) typed.textContent = GREETING;
  else typeTimer = setTimeout(tick, 2200); // first phrase is already in the HTML

  var FUN = [
    'I ranked 119th out of 250,000+ coders in TCS CodeVita, back in college. 🧑‍💻',
    'I run a chess YouTube channel, Neemu Chess. Beat my knight game below ♞',
    'Mornings are for badminton: top 4 out of 40 teams in a corporate tournament. 🏸',
    'My goal is 100 books. Thrillers, every night before sleep. 📚'
  ];
  var funIdx = 0;
  var ANSWERS = {
    what: ['happy', 'I lead the billing team at Goldman Sachs: payments, ledgers and pipelines where every number has to add up.'],
    work: ['happy', 'Yes! A quick chat, a business idea or an engineering problem: press Email me. I reply. ✉️'],
    bulb: ['wink', 'My first site in 2017 had a bulb too. Pull it, top right ☝ Day mode awaits.']
  };
  function say(text, mood) {
    clearTimeout(typeTimer); clearTimeout(resumeTimer);
    $('answer').textContent = text;
    scene.classList.remove('mood-happy', 'mood-surprised', 'mood-wink');
    void scene.getBoundingClientRect();
    scene.classList.add('mood-' + mood);
    if (calm()) { typed.textContent = text; }
    else {
      var letters = Array.from(text), k = 0;
      (function typeOut() {
        typed.textContent = letters.slice(0, ++k).join('');
        if (k < letters.length) typeTimer = setTimeout(typeOut, 22);
      })();
    }
    // Go back to the idle loop after a pause.
    resumeTimer = setTimeout(function () {
      scene.classList.remove('mood-happy', 'mood-surprised', 'mood-wink');
      if (calm()) { typed.textContent = GREETING; return; }
      c = 0; deleting = false; p = 0; typed.textContent = '';
      typeTimer = setTimeout(tick, 300);
    }, 9000);
  }
  document.querySelectorAll('#chips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var q = chip.dataset.q;
      if (q === 'fun') { say(FUN[funIdx], funIdx % 2 ? 'wink' : 'surprised'); funIdx = (funIdx + 1) % FUN.length; chip.textContent = 'Another fun fact?'; }
      else say(ANSWERS[q][1], ANSWERS[q][0]);
      if (q === 'work') wave();
      unlock('chat');
    });
  });

  /* ---- Pause animations (WCAG 2.2.2): freezes ambient loops and the typewriter ---- */
  var stillBtn = $('still-btn');
  function syncStill() {
    var on = root.classList.contains('still');
    stillBtn.setAttribute('aria-pressed', String(on));
    stillBtn.textContent = on ? '▶ Play animations' : '⏸ Pause animations';
  }
  syncStill();
  stillBtn.addEventListener('click', function () {
    var on = !root.classList.contains('still');
    root.classList.toggle('still', on);
    try { localStorage.setItem('still', on ? '1' : '0'); } catch (e) {}
    syncStill();
    clearTimeout(typeTimer); clearTimeout(resumeTimer);
    if (calm()) typed.textContent = GREETING;
    else { c = 0; deleting = false; p = 0; typed.textContent = ''; typeTimer = setTimeout(tick, 300); }
  });

  /* ---- Character: wave + eyes ---- */
  function wave() { restartClass(scene, 'waving', 1300); }
  $('char-btn').addEventListener('click', function () { wave(); unlock('wave'); });
  if (!reduced) setTimeout(wave, 1200);

  if (finePointer && !reduced) {
    var eyes = $('eyes'), px = 0, py = 0, eyeQueued = false;
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (eyeQueued) return;
      eyeQueued = true;
      requestAnimationFrame(function () {
        eyeQueued = false;
        var b = eyes.getBoundingClientRect();
        var dx = px - (b.left + b.width / 2), dy = py - (b.top + b.height / 2);
        var d = Math.hypot(dx, dy) || 1, m = Math.min(3.5, d / 40);
        scene.style.setProperty('--lx', (dx / d * m).toFixed(2) + 'px');
        scene.style.setProperty('--ly', (dy / d * m).toFixed(2) + 'px');
      });
    }, { passive: true });
  }

  /* ---- Reveal, counters, hero pause ---- */
  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    var hero = document.querySelector('.hero');
    new IntersectionObserver(function (en) {
      hero.classList.toggle('paused', !en[0].isIntersecting);
      root.classList.toggle('past-hero', en[0].intersectionRatio < .35);
    }, { threshold: [0, .35] }).observe(hero);
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Impact quiz: guess the number, then see the real one ---- */
  var quizTiles = document.querySelectorAll('.tile.quiz'), quizRight = 0, quizDone = 0;
  function quizScore() {
    $('quiz-score').textContent = quizDone < quizTiles.length
      ? 'Guess my numbers: ' + quizRight + ' right, ' + (quizTiles.length - quizDone) + ' to go'
      : 'You got ' + quizRight + ' of ' + quizTiles.length + ' right' + (quizRight === quizTiles.length ? '. Perfect! 🎯' : '. Now you know. 😉');
  }
  quizTiles.forEach(function (tile) {
    var correct = +tile.dataset.correct;
    tile.querySelectorAll('.opts button').forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (tile.classList.contains('answered')) return;
        var ok = i === correct, ans = tile.querySelector('.ans');
        tile.classList.add('answered', ok ? 'right' : 'wrong');
        var v = document.createElement('span');
        v.className = 'verdict';
        v.textContent = ok ? '✓ You got it' : '✗ You guessed ' + btn.textContent;
        ans.insertBefore(v, ans.firstChild);
        var n = ans.querySelector('[data-count]');
        if (n && !reduced) countUp(n);
        if (ok) { quizRight++; confetti(tile, 14); }
        quizDone++;
        quizScore();
        ans.setAttribute('tabindex', '-1'); ans.focus({ preventScroll: true });
        if (quizDone === quizTiles.length) unlock('quiz');
      });
    });
  });
  if (quizTiles.length) quizScore();

  /* ---- Journey: the walker follows scroll ---- */
  var track = $('track'), walker = $('walker'), railFill = $('rail-fill');
  var stations = Array.prototype.slice.call(track.querySelectorAll('.station'));
  var walkTimer, queued = false, journeyLive = false, walkerTag = $('walker-tag');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-header nav a'));
  var navUl = document.querySelector('.site-header nav ul'), header = document.querySelector('.site-header');
  var spied = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var activeLink = null, geo = null;
  // Layout that only changes on resize/reflow: measured once, not on every scroll frame.
  function measure() {
    geo = {
      trackH: track.offsetHeight,
      stTops: stations.map(function (st) { return st.offsetTop; }),
      headerH: header.offsetHeight,
      navScrolls: navUl.scrollWidth > navUl.clientWidth,
      linkLefts: navLinks.map(function (l) { return l.offsetLeft; })
    };
  }
  function frame() {
    queued = false;
    if (!geo) measure();
    // 1. Reads only.
    var vh = window.innerHeight, trackTop = track.getBoundingClientRect().top;
    var secTops = spied.map(function (sec) { return sec ? sec.getBoundingClientRect().top : Infinity; });
    var atBottom = vh + window.scrollY >= document.documentElement.scrollHeight - 2;
    // 2. Writes only.
    writeJourney(trackTop, vh);
    writeNav(secTops, geo.headerH + vh * 0.3, atBottom);
  }
  function writeJourney(trackTop, vh) {
    var travel = Math.max(1, geo.trackH - 60);
    var prog = clamp((vh * 0.45 - trackTop) / travel, 0, 1), y = prog * travel, last = -1;
    walker.style.setProperty('--y', y.toFixed(1) + 'px');
    railFill.style.setProperty('--p', prog.toFixed(4));
    stations.forEach(function (st, i) {
      var r = y + 30 >= geo.stTops[i] + 22;
      st.classList.toggle('reached', r);
      if (r) last = i;
      // First time a station is reached by scrolling: celebrate it once.
      if (r && journeyLive && !st.classList.contains('unlocked')) {
        st.classList.add('unlocked');
        var yPct = (geo.stTops[i] + 30) / geo.trackH * 100;
        if (i === stations.length - 1) {
          pop(track, 'LEVEL UP: Vice President 🚀', 50, yPct, 'big');
          confetti(track, 40);
          unlock('journey');
        } else if (i > 0) pop(track, 'Unlocked: ' + st.querySelector('h3').textContent, 50, yPct);
      }
    });
    walkerTag.textContent = stations[Math.max(0, last)].dataset.year;
  }
  function writeNav(secTops, line, atBottom) {
    var idx = -1;
    secTops.forEach(function (t, i) { if (t <= line) idx = i; });
    // The last section can be too short to reach the line, so the page bottom counts as inside it.
    if (atBottom) idx = spied.length - 1;
    var next = navLinks[idx] || null;
    if (next === activeLink) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    activeLink = next;
    if (!next) return;
    next.setAttribute('aria-current', 'location');
    // On phones the nav scrolls sideways: keep the active link visible without moving the page.
    if (geo.navScrolls) navUl.scrollTo({ left: geo.linkLefts[idx] - 16, behavior: reduced ? 'auto' : 'smooth' });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', function () {
    if (!reduced) {
      walker.classList.add('walking');
      clearTimeout(walkTimer);
      walkTimer = setTimeout(function () { walker.classList.remove('walking'); }, 180);
    }
    schedule();
  }, { passive: true });
  function remeasure() { geo = null; schedule(); }
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure); // fonts and images can shift layout after first paint
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(track);
  frame();
  // Stations already passed on load count as unlocked silently.
  stations.forEach(function (st) { if (st.classList.contains('reached')) st.classList.add('unlocked'); });
  journeyLive = true;
  document.querySelectorAll('#years button').forEach(function (b) {
    b.addEventListener('click', function () {
      // Scroll so the walker (which sits at 45% of the viewport) lands on this station.
      var st = stations[+b.dataset.st], rect = track.getBoundingClientRect(), travel = Math.max(1, rect.height - 60);
      var wantY = clamp(st.offsetTop + 6, 0, travel); // a little past the reach line, so it counts as arrived
      window.scrollBy({ top: rect.top - (window.innerHeight * 0.45 - wantY), behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---- Skills constellation (built from the accessible list) ---- */
  var svg = $('constellation'), groups = document.querySelectorAll('#groups .group'), gEls = [];
  groups.forEach(function (li, gi) {
    var name = li.querySelector('h3').textContent, skills = li.querySelector('p').textContent.split(' · ');
    var cx = 150 + (gi % 3) * 300, cy = 105 + Math.floor(gi / 3) * 210;
    var g = document.createElementNS(NS, 'g'), pts = [];
    g.setAttribute('class', 'c-group');
    skills.forEach(function (sk, i) {
      var a = (i / skills.length) * Math.PI * 2 + gi * 0.9, rad = i % 2 ? 78 : 60;
      pts.push([cx + Math.cos(a) * rad * 1.25, cy + Math.sin(a) * rad * 0.85, Math.cos(a)]);
    });
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + (pts.length > 2 ? 'Z' : ''));
    path.setAttribute('pathLength', '1');
    path.setAttribute('class', 'c-line');
    g.appendChild(path);
    pts.forEach(function (q, i) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', q[0]); c.setAttribute('cy', q[1]); c.setAttribute('r', 3.5);
      c.setAttribute('class', 'c-star' + (i % 2 ? ' tw' : ''));
      c.style.setProperty('--d', rand(2, 5) + 's');
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', q[0] + (q[2] < 0 ? -9 : 9)); t.setAttribute('y', q[1] + 4);
      t.setAttribute('text-anchor', q[2] < 0 ? 'end' : 'start');
      t.setAttribute('class', 'c-label');
      t.textContent = skills[i];
      g.appendChild(c); g.appendChild(t);
    });
    var nm = document.createElementNS(NS, 'text');
    nm.setAttribute('x', cx); nm.setAttribute('y', cy + 5); nm.setAttribute('text-anchor', 'middle');
    nm.setAttribute('class', 'c-name');
    nm.textContent = name;
    g.appendChild(nm);
    svg.appendChild(g);
    gEls.push(g);

    var btn = li.querySelector('.group-btn'), pinned = false;
    function on() { li.classList.add('lit'); g.classList.add('lit'); unlock('stars'); }
    function off() { if (pinned) return; li.classList.remove('lit'); g.classList.remove('lit'); }
    li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
    btn.addEventListener('focus', on); btn.addEventListener('blur', off);
    g.addEventListener('mouseenter', on); g.addEventListener('mouseleave', off);
    // Click/tap pins the constellation on (or releases it), so a tap never lights and unlights at once.
    btn.addEventListener('click', function () {
      pinned = !pinned;
      btn.setAttribute('aria-pressed', String(pinned));
      if (pinned) on(); else off();
    });
  });
  // Intro: light each constellation once when the section first appears
  if (!reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      cio.disconnect();
      gEls.forEach(function (g, i) {
        setTimeout(function () { g.classList.add('lit'); }, i * 350);
        setTimeout(function () { if (!groups[i].classList.contains('lit')) g.classList.remove('lit'); }, i * 350 + 1600);
      });
    }, { threshold: .4 });
    cio.observe(svg);
  }

  /* ---- Award flip cards: tap or Enter flips them ---- */
  document.querySelectorAll('.award .flip').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); });
  });

  /* ---- Project card tilt (desktop only) ---- */
  if (finePointer && !reduced) {
    document.querySelectorAll('.project').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        card.style.setProperty('--rx', (-((e.clientY - b.top) / b.height - .5) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (((e.clientX - b.left) / b.width - .5) * 8).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); });
    });
  }

  /* ---- Off-shift arcade: five quick mini-games ---- */
  (function () {
    var arcade = $('arcade');
    if (!arcade) return;

    // Figures share one 60x110 cartoon rig (big head like the hero character, tapered torso,
    // rounded limbs drawn as strokes). Shoulders sit at (21,42) and (39,42), hips at (26,66) and (34,66).
    function arm(sx, sy, cx, cy, hx, hy) { // shoulder, elbow control point, hand
      return '<path class="limb-k" d="M' + sx + ' ' + sy + 'Q' + cx + ' ' + cy + ' ' + hx + ' ' + hy + '"/><circle class="skin" cx="' + hx + '" cy="' + hy + '" r="3.6"/>';
    }
    function legs(lx, rx) { // foot x positions; feet at y=98
      return '<path class="limb-l" d="M26 66L' + lx + ' 97"/><path class="limb-l" d="M34 66L' + rx + ' 97"/>' +
        '<ellipse class="shoe" cx="' + (lx - 1) + '" cy="100" rx="5.5" ry="3.2"/><ellipse class="shoe" cx="' + (rx + 1) + '" cy="100" rx="5.5" ry="3.2"/>';
    }
    var TORSO = '<path class="kit" d="M19 41q11-7 22 0l2 25q-13 5-26 0z"/>';
    var FACE = '<circle class="skin" cx="15.5" cy="21" r="3.2"/><circle class="skin" cx="44.5" cy="21" r="3.2"/><circle class="skin" cx="30" cy="20" r="14.5"/>' +
      '<path class="beard" d="M17.5 23c1 9 6 13 12.5 13s11.5-4 12.5-13c-3 4-7 6-12.5 6s-9.5-2-12.5-6z"/>' +
      '<path class="hair" d="M15.5 19c-1-11 6-16 14.5-16s16 5 14.5 16c-2-5-6-8-11-9-6 3-12 4-18 9z"/>' +
      '<circle cx="24.5" cy="20.5" r="1.9" fill="#1f1b26"/><circle cx="35.5" cy="20.5" r="1.9" fill="#1f1b26"/>' +
      '<path d="M26 28q4 3 8 0" fill="none" stroke="#4a2c22" stroke-width="1.6" stroke-linecap="round"/>';
    var BACK = '<circle class="skin" cx="15.5" cy="21" r="3.2"/><circle class="skin" cx="44.5" cy="21" r="3.2"/><circle class="skin" cx="30" cy="20" r="14.5"/>' +
      '<path class="hair" d="M15.5 21c-1-12 6-18 14.5-18s15.5 6 14.5 18c-1 6-4 10-7 12H22.5c-3-2-6-6-7-12z"/>';
    var RACKET = '<path d="M46 23L49 9" stroke="#2b2b33" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse cx="50.5" cy="0" rx="6.5" ry="8.5" transform="rotate(10 50.5 0)" fill="rgba(255,255,255,.12)" stroke="#f2f2f2" stroke-width="2.2"/>';
    var FIGS = {
      'me-racket': legs(20, 40) + TORSO + arm(21, 42, 15, 52, 15, 62) +
        '<g class="swing-arm">' + arm(39, 42, 47, 36, 46, 23) + RACKET + '</g>' + FACE,
      'opp': legs(20, 40) + TORSO + arm(21, 42, 15, 52, 15, 62) + arm(39, 42, 47, 36, 46, 23) + RACKET + FACE,
      'me-bat': legs(22, 38) + TORSO +
        '<g class="bat"><rect x="32.5" y="52" width="3.4" height="9" rx="1.2" fill="#2b2b33"/><rect x="31" y="60" width="6.4" height="30" rx="2.4" fill="#d9a45f"/></g>' +
        arm(21, 42, 25, 55, 33, 53) + arm(39, 42, 42, 50, 35.5, 54) +
        FACE + '<path d="M15 18c0-11 7-16 15-16s15 5 15 16z" fill="#1d3f8f"/><path d="M15 18h31" stroke="#1d3f8f" stroke-width="3" stroke-linecap="round"/>',
      'bowler': legs(18, 42) + TORSO + arm(21, 42, 13, 46, 9, 52) + arm(39, 42, 44, 30, 43, 14) + FACE,
      'keeper': legs(17, 43) + TORSO + arm(21, 42, 10, 40, 5, 29) + arm(39, 42, 50, 40, 55, 29) +
        '<circle cx="5" cy="29" r="4.8" fill="#fff"/><circle cx="55" cy="29" r="4.8" fill="#fff"/>' + FACE,
      'me-kit': legs(22, 38) + '<path d="M23 86L22.5 95M37 86L37.5 95" stroke="#fff" stroke-width="7.4" stroke-linecap="round"/>' +
        TORSO + '<path class="kit" d="M18 62h24l1 12h-10l-3-4-3 4H17z"/>' + arm(21, 42, 15, 53, 14, 63) + arm(39, 42, 45, 53, 46, 63) +
        '<text class="num" x="30" y="61" text-anchor="middle">7</text>' + BACK,
      'me-couch': TORSO + arm(21, 42, 20, 54, 26, 60) + arm(39, 42, 40, 54, 34, 60) + BACK
    };
    arcade.querySelectorAll('[data-fig]').forEach(function (el) {
      el.innerHTML = '<svg viewBox="0 0 60 110">' + FIGS[el.dataset.fig] + '</svg>';
    });

    function place(stage, el, x, y) { // x, y in % of the stage
      el.style.transform = 'translate(' + (x / 100 * stage.clientWidth - el.offsetWidth / 2) + 'px,' + (y / 100 * stage.clientHeight - el.offsetHeight / 2) + 'px)';
    }
    function getBest(k) { try { return +localStorage.getItem('arcade-' + k) || 0; } catch (e) { return 0; } }
    function setBest(k, v) { try { localStorage.setItem('arcade-' + k, v); } catch (e) {} }

    // Shared game shell: UI refs, loop, timers, scoring, finish.
    var games = {};
    function Game(key) {
      var panel = $('game-' + key), q = function (s) { return panel.querySelector(s); };
      var g = { key: key, panel: panel, stage: q('.stage'), scoreEl: q('.score'), bestEl: q('.best'), msg: q('.msg'), play: q('.play'), time: q('.time'), act: q('.act'), score: 0, running: false };
      g.bestEl.textContent = getBest(key);
      g.setScore = function (v) { g.score = v; g.scoreEl.textContent = v; };
      g.loop = function (fn) {
        (function f(now) { if (!g.running) return; fn(now); g.raf = requestAnimationFrame(f); })(performance.now());
      };
      g.timer = function (secs, onEnd) {
        var end = performance.now() + secs * 1000;
        g.time.textContent = secs;
        g.iv = setInterval(function () {
          var left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
          g.time.textContent = left;
          if (left <= 0) { clearInterval(g.iv); onEnd(); }
        }, 100);
      };
      g.halt = function () {
        g.running = false;
        cancelAnimationFrame(g.raf); clearTimeout(g.t); clearTimeout(g.t2); clearInterval(g.iv);
        if (g.act) g.act.disabled = true;
        if (g.reset) g.reset();
        root.classList.remove('playing');
      };
      g.finish = function (label) {
        g.halt();
        var b = getBest(key);
        if (g.score > b) {
          setBest(key, g.score); g.bestEl.textContent = g.score;
          g.msg.textContent = 'New best: ' + g.score + '! 🎉';
          pop(g.stage, 'NEW BEST!', 50, 40, 'big'); confetti(g.stage, 40);
        } else {
          g.msg.textContent = label + ' ' + g.score + '. Your best is ' + b + '. Again?';
        }
        g.play.textContent = 'Play again'; g.play.disabled = false;
      };
      g.play.addEventListener('click', function () {
        g.halt(); g.setScore(0); g.running = true; g.play.disabled = true;
        root.classList.add('playing');
        if (g.act) g.act.disabled = false;
        g.msg.textContent = 'Go!';
        g.start();
      });
      if (g.act) g.act.addEventListener('click', function () { g.action(); });
      games[key] = g;
      return g;
    }

    /* Badminton: keep the rally alive */
    (function () {
      var g = Game('badminton'), sh = g.stage.querySelector('.shuttlecock');
      var dir, t0, T, p = 0;
      g.stage.dataset.tap = '';
      g.reset = function () { place(g.stage, sh, 77, 34); };
      g.start = function () {
        T = 1500; dir = 'in'; t0 = performance.now();
        g.loop(function (now) {
          var dur = dir === 'in' ? T : 450;
          p = (now - t0) / dur;
          if (dir === 'in') {
            place(g.stage, sh, 77 - 55 * p, 34 - 24 * Math.sin(Math.PI * Math.min(p, 1)) + Math.max(0, p - 1) * 170);
            if (p > 1.15) { pop(g.stage, 'Missed!', 20, 60, 'bad'); g.finish('Rally'); }
          } else {
            place(g.stage, sh, 22 + 55 * p, 30 - 26 * Math.sin(Math.PI * Math.min(p, 1)) + 4 * p);
            if (p >= 1) { dir = 'in'; t0 = now; T = Math.max(560, T * 0.92); }
          }
        });
      };
      g.action = function () {
        restartClass(g.stage, 'swinging', 300);
        if (!g.running || dir !== 'in' || p < 0.78 || p > 1.1) return;
        if (Math.abs(p - 0.95) < 0.06) { g.setScore(g.score + 2); pop(g.stage, 'SMASH! +2', 30, 30, 'big'); confetti(g.stage, 12); unlock('smash'); }
        else { g.setScore(g.score + 1); pop(g.stage, '+1', 24, 30); }
        if (g.score >= 10 && g.score % 10 < 2) pop(g.stage, 'On fire 🔥', 50, 20, 'big');
        dir = 'out'; t0 = performance.now();
      };
      g.reset();
    })();

    /* Cricket: one over */
    (function () {
      var g = Game('cricket'), ball = g.stage.querySelector('.cricket-ball'), bowler = g.stage.querySelector('.fig-opp');
      var stumps = g.stage.querySelector('.stumps'), overs = g.stage.querySelector('.overs');
      var state, t0, T, p = 0, balls, hx, hy, runsHit;
      g.stage.dataset.tap = '';
      g.reset = function () { ball.style.opacity = 0; };
      function chip(txt) { var s = document.createElement('span'); s.textContent = txt; s.className = 'b' + txt; overs.appendChild(s); }
      function nextBall() {
        if (balls === 6) { g.finish('Runs'); return; }
        state = 'runup'; ball.style.opacity = 0;
        restartClass(bowler, 'runup', 600);
        g.t = setTimeout(function () { state = 'ball'; T = rand(850, 1150); t0 = performance.now(); ball.style.opacity = 1; }, 650);
      }
      function out(text) {
        balls++; chip('W'); state = 'done';
        stumps.classList.add('out');
        pop(g.stage, text, 50, 35, 'big bad');
        g.t = setTimeout(function () { g.finish('Runs'); }, 1000);
      }
      g.start = function () {
        balls = 0; overs.innerHTML = ''; stumps.classList.remove('out');
        nextBall();
        g.loop(function (now) {
          if (state === 'ball') {
            p = (now - t0) / T;
            var y = p < 0.62 ? 48 + 30 * (p / 0.62) : 78 - 16 * ((p - 0.62) / 0.38);
            place(g.stage, ball, 80 - 62 * p, y);
            if (p > 1.12) out('Bowled! 🏏');
          } else if (state === 'hit') {
            var k = (now - t0) / 650;
            place(g.stage, ball, hx + k * (runsHit >= 4 ? 90 : 45), hy - k * (runsHit === 6 ? 80 : 25) + (runsHit === 6 ? 0 : k * k * 20));
            if (k >= 1) { state = 'wait'; ball.style.opacity = 0; g.t = setTimeout(nextBall, 400); }
          }
        });
      };
      g.action = function () {
        restartClass(g.stage, 'swinging', 350);
        if (!g.running || state !== 'ball') return;
        if (p < 0.79) return out('Too early! Bowled');
        if (p > 1.07) return out('Too late! Bowled');
        var d = Math.abs(p - 0.93);
        runsHit = d <= 0.03 ? 6 : d <= 0.06 ? 4 : d <= 0.1 ? 2 : 1;
        balls++; chip(String(runsHit)); g.setScore(g.score + runsHit);
        if (runsHit === 6) { pop(g.stage, 'SIX! 🚀', 50, 30, 'big'); confetti(g.stage, 30); unlock('six'); }
        else if (runsHit === 4) { pop(g.stage, 'FOUR!', 50, 30, 'big'); confetti(g.stage, 14); }
        else pop(g.stage, runsHit + (runsHit === 1 ? ' run' : ' runs'), 40, 30);
        hx = 80 - 62 * p; hy = p < 0.62 ? 48 + 30 * (p / 0.62) : 78 - 16 * ((p - 0.62) / 0.38);
        state = 'hit'; t0 = performance.now();
      };
      g.reset();
    })();

    /* Football: five penalties */
    (function () {
      var g = Game('football'), ball = g.stage.querySelector('.football'), keeper = g.stage.querySelector('.keeper');
      var goal = g.stage.querySelector('.goal'), siu = g.stage.querySelector('.siu'), kicker = g.stage.querySelector('.fig-me');
      var shots = g.panel.querySelectorAll('.shoot'), kicks, busy;
      function enable(on) { shots.forEach(function (b) { b.disabled = !on; }); }
      function resetBall() {
        ball.style.transition = 'none'; place(g.stage, ball, 50, 84); void ball.offsetWidth; ball.style.transition = '';
        keeper.className = 'fig keeper';
      }
      g.reset = function () { enable(false); resetBall(); busy = false; };
      g.start = function () { kicks = 0; busy = false; resetBall(); enable(true); g.msg.textContent = 'Pick a corner.'; };
      g.shoot = function (dir) {
        if (!g.running || busy) return;
        busy = true; enable(false);
        var kd = Math.floor(Math.random() * 3);
        place(g.stage, ball, [30, 50, 70][dir], 24);
        g.t = setTimeout(function () { keeper.classList.add('dive-' + kd); }, 80);
        g.t2 = setTimeout(function () {
          kicks++;
          if (kd === dir) { pop(g.stage, 'Saved! 🧤', 50, 60, 'big bad'); }
          else {
            g.setScore(g.score + 1); unlock('siu');
            restartClass(goal, 'ripple', 500); restartClass(siu, 'show', 1200); restartClass(kicker, 'jump', 900);
            confetti(g.stage, 25);
          }
          g.msg.textContent = 'Kick ' + kicks + ' of 5';
          g.t = setTimeout(function () {
            if (kicks === 5) { g.finish('Goals'); return; }
            resetBall(); busy = false; enable(true);
          }, 1300);
        }, 500);
      };
      shots.forEach(function (b) { b.addEventListener('click', function () { g.shoot(+b.dataset.dir); }); });
      g.stage.addEventListener('pointerdown', function (e) {
        if (!g.running) return;
        var r = g.stage.getBoundingClientRect();
        g.shoot(Math.min(2, Math.floor((e.clientX - r.left) / r.width * 3)));
      });
      g.reset();
    })();

    /* Chess: knight's quest */
    (function () {
      var g = Game('chess'), board = g.stage.querySelector('.board5'), sqs = [];
      var kn, pawn, moves, minMoves;
      var J = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      function nbrs(s) {
        var r = Math.floor(s / 5), c = s % 5;
        return J.map(function (j) { return [r + j[0], c + j[1]]; })
          .filter(function (q) { return q[0] >= 0 && q[0] < 5 && q[1] >= 0 && q[1] < 5; })
          .map(function (q) { return q[0] * 5 + q[1]; });
      }
      function dist(a, b) { // BFS: fewest knight moves from a to b
        var seen = {}, frontier = [a], d = 0; seen[a] = 1;
        while (frontier.length) {
          if (frontier.indexOf(b) >= 0) return d;
          var next = [];
          frontier.forEach(function (s) { nbrs(s).forEach(function (n) { if (!seen[n]) { seen[n] = 1; next.push(n); } }); });
          frontier = next; d++;
        }
        return Infinity;
      }
      for (var i = 0; i < 25; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sq' + ((Math.floor(i / 5) + i % 5) % 2 ? ' dark' : '');
        b.setAttribute('aria-label', 'abcde'[i % 5] + (5 - Math.floor(i / 5)));
        b.dataset.i = i;
        board.appendChild(b); sqs.push(b);
      }
      function spawn() {
        do { pawn = Math.floor(Math.random() * 25); } while (pawn === kn);
        minMoves = dist(kn, pawn); moves = 0;
      }
      function render(landed) {
        var legal = g.running ? nbrs(kn) : [];
        sqs.forEach(function (b, i) {
          var isLegal = legal.indexOf(i) >= 0;
          b.classList.toggle('legal', isLegal);
          b.disabled = !isLegal;
          b.innerHTML = i === kn ? '<span class="pc' + (landed ? ' land' : '') + '">♞</span>' : i === pawn ? '<span class="pc">♟</span>' : '';
          b.setAttribute('aria-label', 'abcde'[i % 5] + (5 - Math.floor(i / 5)) + (i === kn ? ', knight' : i === pawn ? ', pawn' : ''));
        });
      }
      board.addEventListener('click', function (e) {
        var b = e.target.closest('.sq');
        if (!b || !g.running || !b.classList.contains('legal')) return;
        kn = +b.dataset.i; moves++;
        if (kn === pawn) {
          if (moves <= minMoves) { g.setScore(g.score + 2); pop(g.stage, 'Brilliant ‼ +2', 50, 45, 'big'); confetti(g.stage, 16); unlock('brilliant'); }
          else { g.setScore(g.score + 1); pop(g.stage, 'Captured! +1', 50, 45); }
          spawn();
        }
        render(true);
        // The clicked square is now disabled, so keep keyboard users on the board.
        var first = board.querySelector('.legal'); if (first && b.disabled) first.focus({ preventScroll: true });
      });
      g.reset = function () { render(false); };
      g.start = function () {
        kn = 12; spawn(); render(false);
        g.timer(30, function () { g.finish('Score'); });
        var first = board.querySelector('.legal'); if (first) first.focus();
      };
      kn = 12; pawn = 0; render(false);
    })();

    /* PS5: button rush */
    (function () {
      var g = Game('ps5'), prompt = g.stage.querySelector('.prompt'), starsEl = g.stage.querySelector('.stars'), wasted = g.stage.querySelector('.wasted');
      var pads = g.panel.querySelectorAll('.padbtn'), SYM = ['△', '○', '✕', '□'], cur = -1, streak, maxed;
      function stars(n) { starsEl.textContent = '★'.repeat(n) + '☆'.repeat(5 - n); }
      function next() {
        var n; do { n = Math.floor(Math.random() * 4); } while (n === cur);
        cur = n;
        prompt.textContent = SYM[cur]; prompt.className = 'prompt p' + cur;
        restartClass(prompt, 'new', 250);
        clearTimeout(g.t2);
        g.t2 = setTimeout(miss, Math.max(650, 1400 - g.score * 20));
      }
      function miss() {
        if (!g.running) return;
        streak = 0; maxed = false; stars(0);
        restartClass(wasted, 'show', 800);
        next();
      }
      g.press = function (b) {
        if (!g.running) return;
        if (b !== cur) { miss(); return; }
        streak++;
        var s = Math.min(5, Math.floor(streak / 3)), pts = 1 + s;
        stars(s); g.setScore(g.score + pts);
        if (s >= 3) unlock('wanted');
        pop(g.stage, '+' + pts, 50, 55);
        if (s === 5 && !maxed) { maxed = true; pop(g.stage, 'MAX WANTED ★★★★★', 50, 30, 'big'); confetti(g.stage, 30); }
        next();
      };
      pads.forEach(function (p) { p.addEventListener('click', function () { g.press(+p.dataset.b); }); });
      g.reset = function () { pads.forEach(function (p) { p.disabled = true; }); prompt.textContent = '🎮'; prompt.className = 'prompt'; stars(0); };
      g.start = function () {
        streak = 0; maxed = false; stars(0);
        pads.forEach(function (p) { p.disabled = false; });
        next();
        g.timer(20, function () { g.finish('Score'); });
      };
      g.reset();
    })();

    // Tabs (arrow keys move between them, per the WAI-ARIA tabs pattern)
    var tabs = Array.prototype.slice.call(arcade.querySelectorAll('[role="tab"]')), current = 'badminton';
    function select(i, focus) {
      var key = tabs[i].id.replace('tab-', '');
      if (games[current]) games[current].halt();
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
        $(t.getAttribute('aria-controls')).hidden = j !== i;
      });
      current = key;
      games[key].msg.textContent = 'Press Play.';
      games[key].play.textContent = 'Play'; games[key].play.disabled = false;
      if (games[key].reset) games[key].reset();
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + tabs.length - 1) % tabs.length, true); }
      });
    });

    // Tap the stage or press Space for timing games; arrows for football and PS5 while playing.
    ['badminton', 'cricket'].forEach(function (k) {
      games[k].stage.addEventListener('pointerdown', function () { if (games[k].running) games[k].action(); });
    });
    document.addEventListener('keydown', function (e) {
      var g = games[current];
      if (!g || !g.running || e.target.getAttribute('role') === 'tab') return;
      if ((current === 'badminton' || current === 'cricket') && e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); g.action(); }
      if (current === 'football') { var d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2 }[e.key]; if (d !== undefined) { e.preventDefault(); g.shoot(d); } }
      if (current === 'ps5') { var b = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key]; if (b !== undefined) { e.preventDefault(); g.press(b); } }
    });
  })();

  /* ---- Email: intent chips pre-fill the mail, paper plane, then open the mail app ---- */
  var plane = $('plane'), contactMail = $('contact-mail');
  var intentChips = Array.prototype.slice.call(document.querySelectorAll('#intents .chip'));
  var INTENTS = {
    chat: ['Quick chat', 'Hi Nadeem,\n\nWould love a quick chat about ', '#4cc9f0'],
    biz: ['Business idea', 'Hi Nadeem,\n\nI have an idea I would like to run by you: ', '#ffd166'],
    hire: ['Opportunity', 'Hi Nadeem,\n\nI am reaching out about a role: ', '#3ddc97'],
    hi: ['Just saying hi', 'Hi Nadeem,\n\nFound your portfolio and wanted to say hi! ', '#ff7ac6']
  };
  function setIntent(key) {
    var it = INTENTS[key];
    contactMail.href = 'mailto:mohd.nadeem3464@gmail.com?subject=' + encodeURIComponent(it[0]) + '&body=' + encodeURIComponent(it[1]);
    contactMail.dataset.plane = it[2];
    intentChips.forEach(function (c) {
      var on = c.dataset.intent === key;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
  }
  intentChips.forEach(function (c, i) {
    c.addEventListener('click', function () { setIntent(c.dataset.intent); });
    c.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      var n = intentChips[(i + d + intentChips.length) % intentChips.length];
      setIntent(n.dataset.intent); n.focus();
    });
  });
  setIntent('chat');
  document.querySelectorAll('.mail-link').forEach(function (a) {
    a.addEventListener('click', function (e) {
      unlock('mail');
      plane.style.color = a.dataset.plane || '';
      if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || a._sent) return; // second click goes straight through
      e.preventDefault();
      a._sent = true;
      var b = a.getBoundingClientRect();
      plane.style.left = (b.left + b.width / 2 - 17) + 'px';
      plane.style.top = (b.top - 10) + 'px';
      restartClass(plane, 'fly', 900);
      wave();
      setTimeout(function () { window.location.href = a.href; a._sent = false; }, 650);
    });
  });

  /* ---- Easter egg ---- */
  var eggBtn = $('egg-btn'), egg = $('egg');
  eggBtn.setAttribute('aria-expanded', 'false');
  eggBtn.setAttribute('aria-controls', 'egg');
  eggBtn.addEventListener('click', function () {
    egg.hidden = !egg.hidden;
    eggBtn.setAttribute('aria-expanded', String(!egg.hidden));
    eggBtn.textContent = egg.hidden ? 'Meet 2017 me' : 'Bye, 2017 me';
  });
})();
