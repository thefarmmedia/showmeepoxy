/* Show Me Epoxy — sitewide motion.
   Tags existing elements at runtime so no page markup had to change. Paired
   with motion.css.

   Two rules this file keeps to:
     1. Nothing above the fold is ever hidden. Elements already on screen when
        this runs are left alone, so the hero paints as it always did and LCP
        is untouched.
     2. Content never gets stuck invisible. Without IntersectionObserver, or if
        anything throws, every tagged element is revealed immediately. */
(function () {
  'use strict';

  try { run(); } catch (e) {
    // Never leave content hidden because this file failed.
    Array.prototype.forEach.call(document.querySelectorAll('.m-pre'), function (el) {
      el.classList.remove('m-pre');
      el.classList.add('m-in', 'm-done');
    });
  }

  function run() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    var root = document.documentElement;
    root.classList.add('m-smooth');

    // Groups that reveal together, each with a variant and a stagger.
    var REVEAL = [
      // Feature photos wipe on left to right, like a topcoat being pulled.
      { sel: '.two-col img,.area-gallery img,.feat-img img', variant: 'm-wipe', stagger: true },
      { sel: '.section-label,.section-title,.section-sub,.sub-label', variant: '', stagger: false },
      { sel: '.card,.why-card,.service-card,.feat-card,.sb-card', variant: 'm-rise', stagger: true },
      { sel: '.review-card', variant: 'm-rise', stagger: true },
      { sel: '.related-card,.post-card,.home-color-card', variant: 'm-zoom', stagger: true },
      { sel: '.faq-item,.acc-item', variant: '', stagger: true },
      { sel: '.step', variant: 'm-rise', stagger: true },
      { sel: '.gallery-img', variant: 'm-zoom', stagger: true },
      { sel: '.section-heading,.related-link,.tab-btn', variant: '', stagger: true },
      // Long-form posts have no cards or section titles: their images and
      // headings carry the motion instead. Body copy is left alone, since
      // paragraphs fading in under the reader is tiring rather than lively.
      { sel: '.article-wrap img,.article-wrap h2,.inline-cta,.inline-cta-b', variant: '', stagger: false },
      { sel: '.cta-section .container,.viz-promo-list li,.hero-checks li', variant: '', stagger: true }
    ];

    // Pages like colors.html and gallery.html lay their tiles out in grids whose
    // children carry no class at all, so those are found by structure instead.
    // The footer is left out on purpose. It holds the phone number, address and
    // navigation, it is the last thing on the page, and anything that fails to
    // reveal down there is content a visitor never gets. It stays painted.
    var GRID_SKIP = 'header,.nav-main,.nav-top,.mobile-menu,.breadcrumb,#quoteModal,footer';

    var LIFT = '.card,.why-card,.service-card,.feat-card,.related-card,.post-card,' +
               '.home-color-card,.review-card,.sb-card';
    var MEDIA = '.related-card,.post-card,.home-color-card';
    var BTN = '.btn-primary,.btn-secondary,.btn-gold,.btn-outline-navy,.btn-outline-white,' +
              '.nav-cta,.mobile-menu-cta,.btn-p,.btn-s';
    var COUNT = '.stat-num,.hero-count-num';

    function each(sel, fn) {
      var nodes;
      try { nodes = document.querySelectorAll(sel); } catch (e) { return; }
      Array.prototype.forEach.call(nodes, fn);
    }

    function reveal(el) {
      el.classList.remove('m-pre');
      el.classList.add('m-in');
      // Transitions are per-element; 1.2s clears the longest plus its stagger.
      setTimeout(function () { el.classList.add('m-done'); }, 1200);
    }

    // ---- hover and press ---------------------------------------------------
    each(LIFT, function (el) { el.classList.add('m-lift'); });
    each(MEDIA, function (el) { if (el.querySelector('img')) el.classList.add('m-media'); });
    each(BTN, function (el) { el.classList.add('m-btn'); });
    each('a[href^="tel:"]', function (el) {
      if (!el.classList.contains('m-btn')) el.classList.add('m-tel');
    });

    // ---- sticky header shadow ----------------------------------------------
    var nav = document.querySelector('.nav-main,header.nav-main,.head');
    if (nav) {
      nav.classList.add('m-nav');
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          nav.classList.toggle('m-stuck', window.pageYOffset > 12);
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // ---- counters ----------------------------------------------------------
    // Only ticks a value that starts with digits, and always finishes on the
    // page's own text, suffix and all. "MO" and the like are left alone.
    function countUp(el) {
      var text = el.textContent.trim();
      var m = /^(\d[\d,]*)(.*)$/.exec(text);
      if (!m) return;
      var target = parseInt(m[1].replace(/,/g, ''), 10);
      if (!isFinite(target) || target <= 0 || target > 100000) return;
      var suffix = m[2], started = null, dur = 900;
      el.classList.add('m-count');
      function frame(now) {
        if (started === null) started = now;
        var p = Math.min((now - started) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          el.textContent = Math.round(target * eased).toLocaleString() + suffix;
          window.requestAnimationFrame(frame);
        } else {
          el.textContent = text;           // restore the original string exactly
        }
      }
      window.requestAnimationFrame(frame);
    }

    // ---- scroll reveal -----------------------------------------------------
    var supported = 'IntersectionObserver' in window &&
                    typeof window.requestAnimationFrame === 'function';

    var candidates = [];
    REVEAL.forEach(function (group) {
      var seen = 0, lastParent = null;
      each(group.sel, function (el) {
        if (el.dataset.mSeen) return;      // one group per element
        el.dataset.mSeen = '1';
        if (group.stagger) {
          if (el.parentNode !== lastParent) { seen = 0; lastParent = el.parentNode; }
          el.style.setProperty('--m-i', String(Math.min(seen++, 5)));
        }
        candidates.push({ el: el, variant: group.variant });
      });
    });

    // Structural pass: children of real grid containers that nothing above
    // claimed. A transform makes an element the containing block for fixed
    // descendants, so anything wrapping the modal or a sticky bar is left out.
    var modal = document.getElementById('quoteModal');
    each('div,section,ul', function (box) {
      if (box.closest(GRID_SKIP)) return;
      var kids = box.children;
      if (kids.length < 3) return;
      var style = window.getComputedStyle(box);
      var stacked = style.display === 'flex' && /column/.test(style.flexDirection);
      if (style.display !== 'grid' && !stacked) return;
      var i = 0;
      Array.prototype.forEach.call(kids, function (el) {
        if (el.dataset.mSeen) return;
        if (el.querySelector('[data-m-seen]')) return;   // already animates inside
        var pos = window.getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') return;
        if (modal && el.contains(modal)) return;
        el.dataset.mSeen = '1';
        el.style.setProperty('--m-i', String(Math.min(i++, 5)));
        candidates.push({ el: el, variant: 'm-rise' });
      });
    });

    if (!supported) {
      candidates.forEach(function (c) { c.el.classList.add('m-in', 'm-done'); });
      return;
    }

    function arrive(el) {
      reveal(el);
      observer.unobserve(el);
      if (el.matches(COUNT)) countUp(el);
    }

    // threshold 0 with no negative bottom margin: an element fires as soon as any
    // part of it enters the viewport. A margin that shrinks the root bottom can
    // strand whatever sits in that band once the page is scrolled to its end.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) arrive(entry.target);
      });
    }, { threshold: 0 });

    var fold = window.innerHeight || root.clientHeight;
    candidates.forEach(function (c) {
      var top = c.el.getBoundingClientRect().top;
      if (top < fold * 0.92) {
        // Already on screen. Leave it painted; just run its counter.
        if (c.el.matches(COUNT)) countUp(c.el);
        return;
      }
      c.el.classList.add('m-pre');
      if (c.variant) c.el.classList.add(c.variant);
      observer.observe(c.el);
    });

    // Guarantee, independent of the observer: on every scroll, anything still
    // hidden that is inside the viewport gets revealed. Late-loading images can
    // move an element after the observer has made its decision, and a visitor
    // must never meet a blank gap where content should be.
    var sweeping = false;
    function sweep() {
      if (sweeping) return;
      sweeping = true;
      window.requestAnimationFrame(function () {
        sweeping = false;
        var pending = document.querySelectorAll('.m-pre');
        if (!pending.length) {
          window.removeEventListener('scroll', sweep);
          window.removeEventListener('resize', sweep);
          return;
        }
        var h = window.innerHeight || root.clientHeight;
        Array.prototype.forEach.call(pending, function (el) {
          // At or above the fold, including anything already scrolled past.
          // Lazy images loading lower down can carry an element across the
          // viewport between observer callbacks, and a visitor scrolling back
          // up must never find a blank space where content should be.
          if (el.getBoundingClientRect().top < h) arrive(el);
        });
      });
    }
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    window.addEventListener('load', sweep);   // images settling can shift things
    sweep();

    // Scrolling to a point the page already sits at fires no scroll event, so
    // a dropped observer callback would have nothing left to catch it. A short
    // bounded poll closes that gap and then gets out of the way.
    var ticks = 0;
    var poll = setInterval(function () {
      sweep();
      if (++ticks > 15 || !document.querySelector('.m-pre')) clearInterval(poll);
    }, 400);
  }
}());

/* ══ Motion layer 2 ═══════════════════════════════════════════════════════
   Headline parallax, scroll progress, section-title
   underlines, process-step sequence, and (mouse only) card tilt and magnetic
   buttons. Kept in its own closure so a failure here can never affect the
   reveal guarantees above. Purely decorative: nothing in this block hides
   content, and it does nothing at all under prefers-reduced-motion. */
(function () {
  'use strict';
  var mm = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  if (mm('(prefers-reduced-motion: reduce)')) return;

  var raf = window.requestAnimationFrame;
  if (typeof raf !== 'function') return;
  raf = raf.bind(window);
  var hasIO = 'IntersectionObserver' in window;
  var fine = mm('(hover: hover) and (pointer: fine)');

  function safe(fn) { try { fn(); } catch (e) { /* decorative only */ } }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  // Fires fn once, the first time enough of el is on screen.
  function onceVisible(el, ratio, fn) {
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: ratio });
    io.observe(el);
  }
  function heroInner(hero) {
    var kids = hero.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].classList.contains('container') || kids[i].classList.contains('wrap')) return kids[i];
    }
    return null;
  }

  // Scroll-driven effects share one listener and one frame per scroll burst.
  var scrollFns = [];
  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    raf(function () {
      queued = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  safe(progressBar);
  safe(heroParallax);
  safe(underlines);
  safe(processSteps);
  if (fine) { safe(tilt); safe(magnetic); }
  onScroll();

  // ---- scroll progress -----------------------------------------------------
  function progressBar() {
    var bar = document.createElement('div');
    bar.className = 'm-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    scrollFns.push(function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      // Short pages get no bar: there is nothing to track.
      var p = max > window.innerHeight * 0.5 ? Math.min(Math.max(y / max, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  // ---- hero parallax -------------------------------------------------------
  // The hero copy drifts and softens as it leaves. At the top of the page the
  // inline styles are cleared entirely, so the first paint is untouched.
  function heroParallax() {
    var hero = document.querySelector('.hero,.page-hero');
    if (!hero) return;
    var inner = heroInner(hero);
    if (!inner) return;
    inner.classList.add('m-para');
    scrollFns.push(function (y) {
      var h = hero.offsetHeight || 1;
      if (y <= 0) { inner.style.transform = ''; inner.style.opacity = ''; return; }
      if (y > h) return;
      inner.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
      // Copy stays fully opaque for the first third, then softens.
      var fade = Math.max(0, y - h * 0.35) / (h * 0.8);
      inner.style.opacity = Math.max(1 - fade, 0.35).toFixed(3);
    });
  }

  // ---- section title underline ---------------------------------------------
  function underlines() {
    each('.section-title', function (el) {
      if (el.closest('header,footer,#quoteModal')) return;
      el.classList.add('m-ul');
      onceVisible(el, 0.6, function () { el.classList.add('m-ul-in'); });
    });
  }

  // ---- process steps -------------------------------------------------------
  function processSteps() {
    each('.process-steps', function (box) {
      var cols = window.getComputedStyle(box).gridTemplateColumns.split(' ').length;
      // The fill line only makes sense when the steps sit in a row.
      if (cols > 1) box.classList.add('m-steps');
      Array.prototype.forEach.call(box.querySelectorAll('.step-num'), function (n, i) {
        n.style.setProperty('--m-s', String(i));
      });
      onceVisible(box, 0.35, function () { box.classList.add('m-steps-in'); });
    });
  }

  // ---- card tilt with glare (mouse only) -----------------------------------
  function tilt() {
    var SEL = '.card,.why-card,.service-card,.feat-card,.related-card,.post-card,' +
              '.review-card,.sb-card,.home-color-card';
    each(SEL, function (el) {
      if (el.closest('#quoteModal')) return;
      el.classList.add('m-tilt');
      if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var glare = document.createElement('span');
      glare.className = 'm-glare';
      glare.setAttribute('aria-hidden', 'true');
      el.appendChild(glare);
      var pending = null;
      el.addEventListener('pointerenter', function () {
        el.style.transition = 'transform .14s ease-out,box-shadow .28s ease';
      });
      el.addEventListener('pointermove', function (e) {
        var first = !pending;
        pending = e;
        if (!first) return;
        raf(function () {
          if (!pending) return;
          var r = el.getBoundingClientRect();
          var px = (pending.clientX - r.left) / r.width, py = (pending.clientY - r.top) / r.height;
          pending = null;
          el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) +
            'deg) rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg) translateY(-4px)';
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        pending = null;
        el.style.transform = '';
        el.style.transition = '';
      });
    });
  }

  // ---- magnetic primary buttons (mouse only) -------------------------------
  function magnetic() {
    each('.btn-primary,.btn-gold,.nav-cta', function (el) {
      if (el.closest('#quoteModal')) return;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate(' + (dx * 10).toFixed(1) + 'px,' + (dy * 8 - 2).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
}());
