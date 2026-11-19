/* Sagar Mali — portfolio interactions. Plain JS, no dependencies. */
(function () {
  'use strict';

  var EMAIL = 'malisagar1995@gmail.com';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // MediaQueryList change listener that also works in older Safari.
  function onMediaChange(mq, handler) {
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  /* ------------------------------------------------------------------
     Current year in the footer
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------
     Header: solid background once the page scrolls, active nav link
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });
  }

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var menu = document.getElementById('mobile-menu');
  var menuToggle = document.querySelector('.menu-toggle');
  var menuClose = menu ? menu.querySelector('.menu-close') : null;
  var pageParts = document.querySelectorAll('.site-header, main, .site-footer');

  function setInert(value) {
    pageParts.forEach(function (el) {
      if (value) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  function openMenu() {
    menu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    setInert(true);
    var firstLink = menu.querySelector('nav a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu(restoreFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    setInert(false);
    if (restoreFocus) menuToggle.focus();
  }

  if (menu && menuToggle) {
    menuToggle.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', function () { closeMenu(true); });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
    });
    onMediaChange(window.matchMedia('(min-width: 861px)'), function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }

  /* ------------------------------------------------------------------
     Contact dialog (falls back to the #contact section / mailto link)
     ------------------------------------------------------------------ */
  var dialog = document.getElementById('contact-dialog');
  var form = document.getElementById('contact-form');
  var statusEl = form ? form.querySelector('.form-status') : null;
  var canUseDialog = dialog && typeof dialog.showModal === 'function';

  if (canUseDialog) {
    var lastTrigger = null;

    // If the button that opened the dialog is gone (e.g. it was in the
    // mobile menu, which has closed), return focus to the menu button.
    dialog.addEventListener('close', function () {
      var target = lastTrigger && lastTrigger.offsetParent !== null ? lastTrigger : menuToggle;
      if (target && target.offsetParent !== null) target.focus();
    });

    document.querySelectorAll('[data-open-contact]').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        lastTrigger = trigger;
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.classList.remove('is-error');
        }
        // Let the mobile menu finish closing before the dialog takes focus.
        window.requestAnimationFrame(function () {
          dialog.showModal();
          var first = dialog.querySelector('input');
          if (first) first.focus();
        });
      });
    });

    dialog.querySelector('.dialog-close').addEventListener('click', function () {
      dialog.close();
    });

    // A click on the backdrop lands on the <dialog> itself (its content lives in .dialog-body).
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
      var firstInvalid = null;
      fields.forEach(function (field) {
        var valid = field.checkValidity() && field.value.trim() !== '';
        field.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        statusEl.textContent = 'Please fill in your name, a valid email address and a message.';
        statusEl.classList.add('is-error');
        firstInvalid.focus();
        return;
      }

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var subject = 'Portfolio enquiry from ' + name;
      var body = message + '\n\n— ' + name + '\n' + email;

      window.location.href = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      statusEl.classList.remove('is-error');
      statusEl.textContent = 'Your email app should open with the message ready to send. If nothing happens, email me at ' + EMAIL + '.';
    });

    form.addEventListener('input', function (event) {
      if (event.target.getAttribute('aria-invalid') === 'true' && event.target.checkValidity() && event.target.value.trim() !== '') {
        event.target.setAttribute('aria-invalid', 'false');
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal. Elements start visible without JS; with JS they fade
     in as soon as any part of them enters the viewport (or is already
     above it), so nothing can stay hidden.
     ------------------------------------------------------------------ */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    showAll();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Intro statement: words light up with scroll position. Computed from
     the paragraph's position on every frame, so fast scrolling or
     jumping to an anchor always ends in the right state.
     ------------------------------------------------------------------ */
  var intro = document.querySelector('[data-words]');

  function wrapWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            fragment.appendChild(span);
          }
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === 1) {
        wrapWords(child);
      }
    });
  }

  if (intro && !reducedMotion.matches) {
    wrapWords(intro);
    intro.classList.add('is-scrubbed');
    var words = Array.prototype.slice.call(intro.querySelectorAll('.w'));
    var ticking = false;

    var updateWords = function () {
      ticking = false;
      var rect = intro.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.88 - rect.top) / (rect.height + vh * 0.4);
      progress = Math.max(0, Math.min(1, progress));
      var lit = Math.round(progress * words.length);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle('on', i < lit);
      }
    };

    var requestUpdate = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateWords);
      }
    };

    updateWords();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  /* ------------------------------------------------------------------
     Hero: typing line that cycles through what I build
     ------------------------------------------------------------------ */
  var typedEl = document.querySelector('.typed');
  if (typedEl && !reducedMotion.matches) {
    var roles = [];
    try {
      roles = JSON.parse(typedEl.getAttribute('data-roles')) || [];
    } catch (error) {
      roles = [];
    }
    if (roles.length > 1) {
      var roleIndex = 0;
      var charIndex = roles[0].length;
      var deleting = true;
      var typeStep = function () {
        var word = roles[roleIndex];
        if (deleting) {
          charIndex -= 1;
          typedEl.textContent = word.slice(0, Math.max(charIndex, 0));
          if (charIndex <= 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            window.setTimeout(typeStep, 280);
            return;
          }
          window.setTimeout(typeStep, 30);
        } else {
          charIndex += 1;
          typedEl.textContent = roles[roleIndex].slice(0, charIndex);
          if (charIndex >= roles[roleIndex].length) {
            deleting = true;
            window.setTimeout(typeStep, 1900);
            return;
          }
          window.setTimeout(typeStep, 60);
        }
      };
      window.setTimeout(typeStep, 2600);
    }
  }

  /* ------------------------------------------------------------------
     Highlights: numbers count up when they come into view
     ------------------------------------------------------------------ */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reducedMotion.matches) {
      el.textContent = String(target);
      return;
    }
    var startTime = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - startTime) / 1400);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) window.requestAnimationFrame(step);
    };
    el.textContent = '0';
    window.requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Scroll progress bar and the experience timeline line
     ------------------------------------------------------------------ */
  var progressBar = document.querySelector('.scroll-progress');
  var timeline = document.querySelector('.timeline');
  var jobs = timeline ? Array.prototype.slice.call(timeline.querySelectorAll('.job')) : [];
  var scrollTicking = false;

  function updateScrollEffects() {
    scrollTicking = false;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) {
      progressBar.style.setProperty('--progress', maxScroll > 0 ? (window.scrollY / maxScroll).toFixed(4) : '0');
    }
    if (timeline) {
      var mark = window.innerHeight * 0.6;
      var rect = timeline.getBoundingClientRect();
      var lineProgress = Math.max(0, Math.min(1, (mark - rect.top) / rect.height));
      timeline.style.setProperty('--line-progress', lineProgress.toFixed(4));
      jobs.forEach(function (job) {
        job.classList.toggle('is-reached', job.getBoundingClientRect().top + 10 < mark);
      });
    }
  }

  function requestScrollEffects() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  }

  updateScrollEffects();
  window.addEventListener('scroll', requestScrollEffects, { passive: true });
  window.addEventListener('resize', requestScrollEffects);

  /* ------------------------------------------------------------------
     Mouse effects (desktop, motion allowed): cursor glow, card
     spotlights, project tilt, magnetic buttons
     ------------------------------------------------------------------ */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches && !reducedMotion.matches) {
    var glow = document.querySelector('.cursor-glow');
    if (glow) {
      var glowX = window.innerWidth / 2;
      var glowY = window.innerHeight / 3;
      var glowTargetX = glowX;
      var glowTargetY = glowY;
      var glowFrame = 0;
      var moveGlow = function () {
        glowX += (glowTargetX - glowX) * 0.14;
        glowY += (glowTargetY - glowY) * 0.14;
        glow.style.transform = 'translate3d(' + glowX.toFixed(1) + 'px,' + glowY.toFixed(1) + 'px,0)';
        if (Math.abs(glowTargetX - glowX) > 0.5 || Math.abs(glowTargetY - glowY) > 0.5) {
          glowFrame = window.requestAnimationFrame(moveGlow);
        } else {
          glowFrame = 0;
        }
      };
      window.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return;
        glowTargetX = event.clientX;
        glowTargetY = event.clientY;
        glow.classList.add('is-on');
        if (!glowFrame) glowFrame = window.requestAnimationFrame(moveGlow);
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', function () {
        glow.classList.remove('is-on');
      });
    }

    document.querySelectorAll('.flip-card, .stat-card, .edu-card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        card.style.setProperty('--mx', x.toFixed(0) + 'px');
        card.style.setProperty('--my', y.toFixed(0) + 'px');
        card.style.setProperty('--mxb', (rect.width - x).toFixed(0) + 'px');
      });
    });

    document.querySelectorAll('[data-tilt]').forEach(function (win) {
      var tiltFrame = 0;
      var px = 0.5;
      var py = 0.5;
      win.addEventListener('pointermove', function (event) {
        var rect = win.getBoundingClientRect();
        px = (event.clientX - rect.left) / rect.width;
        py = (event.clientY - rect.top) / rect.height;
        if (tiltFrame) return;
        tiltFrame = window.requestAnimationFrame(function () {
          tiltFrame = 0;
          win.classList.add('is-tilting');
          win.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 9).toFixed(2) + 'deg)';
          win.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          win.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      win.addEventListener('pointerleave', function () {
        if (tiltFrame) {
          window.cancelAnimationFrame(tiltFrame);
          tiltFrame = 0;
        }
        win.classList.remove('is-tilting');
        win.style.transform = '';
      });
    });

    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('pointermove', function (event) {
        var rect = btn.getBoundingClientRect();
        var dx = event.clientX - (rect.left + rect.width / 2);
        var dy = event.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------
     Starfield: a light 2D canvas (no WebGL). Twinkles, drifts with the
     scroll, and shows the odd shooting star. Static when the visitor
     prefers reduced motion; paused while the tab is hidden.
     ------------------------------------------------------------------ */
  var canvas = document.getElementById('starfield');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var stars = [];
  var rafId = 0;
  var shooting = null;
  var nextShootingStar = 0;

  function makeStars() {
    var count = Math.min(420, Math.round((width * height) / 4200));
    stars = [];
    for (var i = 0; i < count; i++) {
      var depth = Math.random() * 0.8 + 0.2;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        depth: depth,
        radius: (Math.random() * 0.9 + 0.35) * depth + 0.15,
        alpha: Math.random() * 0.55 + 0.3,
        speed: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        tint: depth > 0.86 ? '#dcd6ff' : (depth < 0.3 ? '#bfeee6' : '#ffffff')
      });
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    // Mobile browsers resize the viewport when the address bar hides; keep
    // the same stars unless the size really changed.
    var regenerate = Math.abs(newWidth - width) > 1 || Math.abs(newHeight - height) > 160 || !stars.length;
    width = newWidth;
    height = newHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (regenerate) makeStars();
  }

  function draw(time) {
    var still = reducedMotion.matches;
    var scrollShift = still ? 0 : window.scrollY;
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = (s.y - scrollShift * s.depth * 0.12) % height;
      if (y < 0) y += height;
      var twinkle = still ? 1 : 0.62 + 0.38 * Math.sin(time * 0.001 * s.speed + s.phase);
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.fillStyle = s.tint;
      ctx.beginPath();
      ctx.arc(s.x, y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!still) {
      if (!shooting && time > nextShootingStar) {
        shooting = {
          x: width * (0.35 + Math.random() * 0.6),
          y: height * Math.random() * 0.35,
          vx: -(7 + Math.random() * 4),
          vy: 2.6 + Math.random() * 1.8,
          age: 0
        };
      }
      if (shooting) {
        shooting.age += 1;
        shooting.x += shooting.vx;
        shooting.y += shooting.vy;
        var tailX = shooting.x - shooting.vx * 14;
        var tailY = shooting.y - shooting.vy * 14;
        var gradient = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
        gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.max(0, 1 - shooting.age / 80);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (shooting.age > 80 || shooting.x < -200 || shooting.y > height + 200) {
          shooting = null;
          nextShootingStar = time + 7000 + Math.random() * 9000;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(time) {
    draw(time);
    rafId = window.requestAnimationFrame(loop);
  }

  // True while the 3D starfield (js/starfield-3d.js) has taken over.
  var handedOff = false;

  function start() {
    window.cancelAnimationFrame(rafId);
    if (handedOff) return;
    if (reducedMotion.matches) {
      draw(0);
    } else {
      nextShootingStar = performance.now() + 3500;
      rafId = window.requestAnimationFrame(loop);
    }
  }

  resize();
  start();

  window.addEventListener('resize', function () {
    resize();
    if (reducedMotion.matches) draw(0);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) window.cancelAnimationFrame(rafId);
    else start();
  });

  onMediaChange(reducedMotion, start);

  // Desktop: the 3D starfield fades in, so fade this canvas out and stop drawing.
  document.addEventListener('starfield:3d-ready', function () {
    canvas.classList.add('is-faded');
    window.setTimeout(function () {
      if (!canvas.classList.contains('is-faded')) return;
      handedOff = true;
      window.cancelAnimationFrame(rafId);
    }, 1300);
  });

  // The 3D starfield stopped (WebGL lost, or reduce motion turned on): take over again.
  document.addEventListener('starfield:3d-stopped', function () {
    handedOff = false;
    canvas.classList.remove('is-faded');
    resize();
    start();
  });
})();
