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
