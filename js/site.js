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
  function syncBulb() {
    var day = root.dataset.theme === 'day';
    bulb.setAttribute('aria-pressed', String(day));
    bulb.setAttribute('aria-label', day ? 'Lights off (switch to night theme)' : 'Lights on (switch to day theme)');
  }
  syncBulb();
  bulb.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'day' ? 'night' : 'day';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    syncBulb();
    restartClass(bulb, 'swing', 900);
  });

  /* ---- Typewriter ---- */
  var typed = $('typed');
  var phrases = ["Hi, I'm Nadeem 👋", 'I lead the billing team at Goldman Sachs.', 'Up for a quick chat?', 'Pull the bulb ☝ top right'];
  if (reduced) {
    typed.textContent = "Hi, I'm Nadeem 👋";
  } else {
    // Array.from splits by code point, so the emoji are never cut in half.
    var chars = phrases.map(function (s) { return Array.from(s); });
    var p = 0, c = chars[0].length, deleting = true;
    var tick = function () {
      c += deleting ? -1 : 1;
      typed.textContent = chars[p].slice(0, c).join('');
      var delay = deleting ? 30 : 65;
      if (deleting && c === 0) { deleting = false; p = (p + 1) % chars.length; delay = 400; }
      else if (!deleting && c === chars[p].length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200); // first phrase is already in the HTML
  }

  /* ---- Character: wave + eyes ---- */
  var scene = $('scene');
  function wave() { restartClass(scene, 'waving', 1300); }
  $('char-btn').addEventListener('click', wave);
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
  var counters = document.querySelectorAll('[data-count]');
  if (!reduced) counters.forEach(function (el) { el.textContent = '0' + (el.dataset.suffix || ''); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        var n = en.target.querySelector('[data-count]');
        if (n && !reduced) countUp(n);
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

  /* ---- Journey: the walker follows scroll ---- */
  var track = $('track'), walker = $('walker'), railFill = $('rail-fill');
  var stations = Array.prototype.slice.call(track.querySelectorAll('.station'));
  var walkTimer, queued = false;
  function updateJourney() {
    queued = false;
    var rect = track.getBoundingClientRect(), travel = Math.max(1, rect.height - 60);
    var prog = clamp((window.innerHeight * 0.45 - rect.top) / travel, 0, 1), y = prog * travel;
    walker.style.setProperty('--y', y.toFixed(1) + 'px');
    railFill.style.setProperty('--p', prog.toFixed(4));
    stations.forEach(function (st) { st.classList.toggle('reached', y + 30 >= st.offsetTop + 22); });
    updateNav();
  }

  /* ---- Header scroll-spy: mark the section you're in ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-header nav a'));
  var navUl = document.querySelector('.site-header nav ul'), header = document.querySelector('.site-header');
  var spied = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var activeLink = null;
  function updateNav() {
    var line = header.offsetHeight + window.innerHeight * 0.3, idx = -1;
    spied.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) idx = i; });
    // The last section can be too short to reach the line, so the page bottom counts as inside it.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = spied.length - 1;
    var next = navLinks[idx] || null;
    if (next === activeLink) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    activeLink = next;
    if (!next) return;
    next.setAttribute('aria-current', 'location');
    // On phones the nav scrolls sideways: keep the active link visible without moving the page.
    if (navUl.scrollWidth > navUl.clientWidth) navUl.scrollTo({ left: next.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
  }
  window.addEventListener('scroll', function () {
    if (!reduced) {
      walker.classList.add('walking');
      clearTimeout(walkTimer);
      walkTimer = setTimeout(function () { walker.classList.remove('walking'); }, 180);
    }
    if (!queued) { queued = true; requestAnimationFrame(updateJourney); }
  }, { passive: true });
  window.addEventListener('resize', updateJourney);
  updateJourney();

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

    function on() { li.classList.add('lit'); g.classList.add('lit'); }
    function off() { li.classList.remove('lit'); g.classList.remove('lit'); }
    li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
    li.addEventListener('focus', on); li.addEventListener('blur', off);
    g.addEventListener('mouseenter', on); g.addEventListener('mouseleave', off);
    li.addEventListener('click', function () { li.classList.contains('lit') ? off() : on(); });
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

    // Figures share one 60x110 rig; each game adds props.
    var F = {
      head: '<circle class="skin" cx="30" cy="16" r="11"/><path class="hair" d="M19 15c0-9 6-13 11-13s12 4 11 13c-3-5-7-7-11-7s-8 2-11 7z"/><path class="beard" d="M21 19c2 7 5 9 9 9s7-2 9-9c-3 3-5 4-9 4s-6-1-9-4z"/><circle cx="26" cy="15" r="1.7" fill="#1f1b26"/><circle cx="34" cy="15" r="1.7" fill="#1f1b26"/>',
      back: '<circle class="skin" cx="30" cy="16" r="11"/><path class="hair" d="M19 16c0-10 6-14 11-14s11 4 11 14c0 4-2 7-4 8H23c-2-1-4-4-4-8z"/>',
      legs: '<rect class="legs" x="19" y="66" width="9" height="40" rx="4"/><rect class="legs" x="32" y="66" width="9" height="40" rx="4"/>',
      body: '<rect class="kit" x="15" y="28" width="30" height="42" rx="10"/>',
      armL: '<rect class="kit" x="7" y="31" width="9" height="30" rx="4.5"/>',
      armR: '<rect class="kit" x="44" y="31" width="9" height="30" rx="4.5"/>',
      armUp: '<rect class="kit" x="42" y="2" width="9" height="32" rx="4.5"/>',
      racket: '<line x1="46.5" y1="4" x2="46.5" y2="-8" stroke="#333" stroke-width="3" stroke-linecap="round"/><ellipse cx="46.5" cy="-19" rx="8" ry="10" fill="none" stroke="#eee" stroke-width="2.5"/>'
    };
    var FIGS = {
      'me-racket': F.legs + F.body + F.armL + '<g class="swing-arm">' + F.armUp + F.racket + '</g>' + F.head,
      'opp': F.legs + F.body + F.armL + F.armUp + F.racket + F.head,
      'me-bat': F.legs + F.body + F.armL + F.armR + F.head + '<g class="bat"><rect x="43" y="34" width="7" height="48" rx="2" fill="#c8955a"/><rect x="44" y="27" width="5" height="9" fill="#333"/></g>',
      'bowler': F.legs + F.body + F.armL + F.armUp + F.head,
      'keeper': F.legs + F.body + '<rect class="kit" x="-8" y="30" width="24" height="9" rx="4.5"/><rect class="kit" x="44" y="30" width="24" height="9" rx="4.5"/><circle cx="-8" cy="34.5" r="5" fill="#fff"/><circle cx="68" cy="34.5" r="5" fill="#fff"/>' + F.head,
      'me-kit': F.legs + '<rect x="19" y="94" width="9" height="12" rx="3" fill="#fff"/><rect x="32" y="94" width="9" height="12" rx="3" fill="#fff"/>' + F.body +
        '<rect class="kit" x="16" y="62" width="28" height="14" rx="4"/>' + F.armL + F.armR + '<text class="num" x="30" y="56" text-anchor="middle">7</text>' + F.back,
      'me-couch': F.body + F.armL + F.armR + F.back
    };
    arcade.querySelectorAll('[data-fig]').forEach(function (el) {
      el.innerHTML = '<svg viewBox="0 0 60 110">' + FIGS[el.dataset.fig] + '</svg>';
    });

    var COLORS = ['#4cc9f0', '#ffd166', '#ff5c8a', '#3ddc97', '#a78bfa'];
    function confetti(stage, n) {
      if (reduced) return;
      var w = stage.clientWidth, h = stage.clientHeight;
      for (var i = 0; i < n; i++) {
        var c = document.createElement('i');
        c.className = 'confetto';
        c.style.cssText = 'left:50%;top:40%;background:' + COLORS[i % COLORS.length] + ';--x:' + rand(-.5, .5) * w + 'px;--y:' + rand(-.5, .55) * h + 'px;--rot:' + rand(-540, 540) + 'deg';
        stage.appendChild(c);
        setTimeout(c.remove.bind(c), 1200);
      }
    }
    function pop(stage, text, x, y, cls) {
      var d = document.createElement('div');
      d.className = 'pop' + (cls ? ' ' + cls : '');
      d.style.left = x + '%'; d.style.top = y + '%';
      d.textContent = text;
      stage.appendChild(d);
      setTimeout(d.remove.bind(d), 950);
    }
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
      g.reset = function () { place(g.stage, sh, 82, 42); };
      g.start = function () {
        T = 1500; dir = 'in'; t0 = performance.now();
        g.loop(function (now) {
          var dur = dir === 'in' ? T : 450;
          p = (now - t0) / dur;
          if (dir === 'in') {
            place(g.stage, sh, 82 - 64 * p, 42 - 30 * Math.sin(Math.PI * Math.min(p, 1)) + Math.max(0, p - 1) * 160);
            if (p > 1.15) { pop(g.stage, 'Missed!', 20, 60, 'bad'); g.finish('Rally'); }
          } else {
            place(g.stage, sh, 18 + 64 * p, 42 - 34 * Math.sin(Math.PI * Math.min(p, 1)));
            if (p >= 1) { dir = 'in'; t0 = now; T = Math.max(560, T * 0.92); }
          }
        });
      };
      g.action = function () {
        restartClass(g.stage, 'swinging', 300);
        if (!g.running || dir !== 'in' || p < 0.78 || p > 1.1) return;
        if (Math.abs(p - 0.95) < 0.06) { g.setScore(g.score + 2); pop(g.stage, 'SMASH! +2', 30, 30, 'big'); confetti(g.stage, 12); }
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
        if (runsHit === 6) { pop(g.stage, 'SIX! 🚀', 50, 30, 'big'); confetti(g.stage, 30); }
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
            g.setScore(g.score + 1);
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
          if (moves <= minMoves) { g.setScore(g.score + 2); pop(g.stage, 'Brilliant ‼ +2', 50, 45, 'big'); confetti(g.stage, 16); }
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

  /* ---- Email: paper plane, then open the mail app ---- */
  var plane = $('plane');
  document.querySelectorAll('.mail-link').forEach(function (a) {
    a.addEventListener('click', function (e) {
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
