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

  /* ---- Off-shift: badminton smash and knight hops ---- */
  var court = $('court');
  $('smash').addEventListener('click', function () { restartClass(court, 'swing', 1300); });

  var knight = $('knight'), kc = 1, kr = 2;
  var jumps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  function hop() {
    var legal = jumps.map(function (j) { return [kc + j[0], kr + j[1]]; })
      .filter(function (q) { return q[0] >= 0 && q[0] < 4 && q[1] >= 0 && q[1] < 4; });
    var n = legal[Math.floor(Math.random() * legal.length)];
    kc = n[0]; kr = n[1];
    knight.style.setProperty('--kc', kc); knight.style.setProperty('--kr', kr);
    restartClass(knight, 'hop', 450);
  }
  $('hop').addEventListener('click', hop);
  $('board').addEventListener('click', hop);

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
