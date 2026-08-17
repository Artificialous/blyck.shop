/* ============================================================
   BLYCK — Prototyp-Logik
   Zwei Features aus dem Konzept, hier lokal simuliert:
   1. Merkliste (ersetzt den Warenkorb)
   2. Beliebtheitswert (eigener Klickzähler statt Amazon-Sternen)

   Speicher: localStorage. Beim Umstieg auf WordPress wandert der
   Zähler in eine eigene DB-Tabelle bzw. einen REST-Endpoint —
   siehe pushClick() unten. Es werden bewusst keine personen-
   bezogenen Daten erfasst, nur ein Zählwert pro Produkt.
   ============================================================ */
(function () {
  'use strict';

  var WISH_KEY = 'blyck.wishlist.v1';
  var CLICK_KEY = 'blyck.clicks.v1';
  var nf = new Intl.NumberFormat('de-DE');

  /* ---------- Speicher-Helfer (defensiv: Private Mode, Quota) ---------- */
  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Speicher nicht verfügbar — UI funktioniert weiter, nur ohne Persistenz */
    }
  }

  /* ============================================================
     MERKLISTE
     ============================================================ */
  var wishlist = read(WISH_KEY, []);

  function renderWishCount() {
    var n = wishlist.length;
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      el.textContent = n;
    });
  }

  function renderWishButtons() {
    document.querySelectorAll('[data-wish]').forEach(function (btn) {
      var on = wishlist.indexOf(btn.dataset.wish) !== -1;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        on ? 'Von der Merkliste entfernen' : 'Zur Merkliste hinzufügen'
      );
    });
  }

  function toggleWish(id) {
    var i = wishlist.indexOf(id);
    if (i === -1) {
      wishlist.push(id);
      toast('Zur Merkliste hinzugefügt');
    } else {
      wishlist.splice(i, 1);
      toast('Von der Merkliste entfernt');
    }
    write(WISH_KEY, wishlist);
    renderWishCount();
    renderWishButtons();
    renderWishlistPage();
  }

  /* ============================================================
     WUNSCHLISTE-SEITE
     Rendert dieselben Karten wie das Empfehlungen-Grid (siehe
     product-card.njk), reduziert per data-id auf die gemerkten.
     Grid/Leer-Hinweis starten "hidden" im Markup, hier wird
     synchron beim Laden entschieden, welcher sichtbar wird —
     kein Flash of wrong content.
     ============================================================ */
  function renderWishlistPage() {
    var grid = document.getElementById('wunschlisteGrid');
    if (!grid) return;
    var emptyState = document.getElementById('wunschlisteEmpty');
    var disclosure = document.getElementById('wunschlisteDisclosure');
    var cards = grid.querySelectorAll('.product[data-id]');
    var visible = 0;
    cards.forEach(function (card) {
      var show = wishlist.indexOf(card.dataset.id) !== -1;
      card.hidden = !show;
      if (show) visible++;
    });
    grid.hidden = visible === 0;
    if (emptyState) emptyState.hidden = visible > 0;
    if (disclosure) disclosure.hidden = visible === 0;
  }

  /* ============================================================
     BELIEBTHEITSWERT
     Basiswert steht im Markup (data-clicks), lokale Klicks kommen
     obendrauf. So bleibt der Prototyp ohne Backend realistisch.
     ============================================================ */
  var localClicks = read(CLICK_KEY, {});

  function baseClicks(id) {
    var el = document.querySelector('[data-id="' + id + '"][data-clicks]');
    return el ? parseInt(el.dataset.clicks, 10) || 0 : 0;
  }

  function renderClicks(id) {
    var total = baseClicks(id) + (localClicks[id] || 0);
    document.querySelectorAll('[data-clickcount="' + id + '"]').forEach(function (el) {
      el.textContent = nf.format(total);
    });
  }

  function renderAllClicks() {
    var seen = {};
    document.querySelectorAll('[data-clickcount]').forEach(function (el) {
      var id = el.dataset.clickcount;
      if (!seen[id]) {
        seen[id] = true;
        renderClicks(id);
      }
    });
  }

  /* Später serverseitig: fetch('/wp-json/blyck/v1/click', {method:'POST', ...})
     Hier nur lokal, damit das Verhalten beurteilbar ist. */
  function pushClick(id) {
    localClicks[id] = (localClicks[id] || 0) + 1;
    write(CLICK_KEY, localClicks);
    renderClicks(id);
  }

  /* ============================================================
     FILTER-TABS (Meistgeklickt + Handverlesene Empfehlungen)
     Jede .tabs-Gruppe traegt ihr Ziel-Grid als data-target, damit
     dieselbe Logik fuer beide Stellen reicht. Ueber ?kategorie=…
     in der URL kann von aussen (Hauptnav, Footer, Kategorie-Kacheln)
     direkt gefiltert reingesprungen werden.
     ============================================================ */
  function initTabs() {
    document.querySelectorAll('.tabs[data-target]').forEach(function (tabs) {
      var grid = document.getElementById(tabs.dataset.target);
      var buttons = tabs.querySelectorAll('.tabs__btn');
      if (!buttons.length || !grid) return;

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');

          var filter = btn.dataset.filter;
          grid.querySelectorAll('.product').forEach(function (card) {
            var show = filter === 'alle' || card.dataset.cat === filter;
            card.hidden = !show;
          });
        });
      });
    });

    /* Deep-Link von aussen: ?kategorie=licht filtert die Empfehlungen
       direkt beim Laden, ohne dass erst ein Tab geklickt werden muss.
       Wert kommt aus der URL — per dataset-Vergleich statt Selector-
       String, damit ein unerwarteter Wert nichts zerschiessen kann. */
    var kategorie = new URLSearchParams(window.location.search).get('kategorie');
    if (kategorie) {
      var empfehlungenTabs = document.querySelector('.tabs[data-target="empfehlungenGrid"]');
      if (empfehlungenTabs) {
        var match = Array.prototype.find.call(
          empfehlungenTabs.querySelectorAll('.tabs__btn'),
          function (b) { return b.dataset.filter === kategorie; }
        );
        if (match) match.click();
      }
    }
  }

  /* ============================================================
     STICKY-HEADER (.mainnav)
     .mainnav ist per CSS position:sticky und rastet automatisch
     oben ein. Der IntersectionObserver auf dem Sentinel am Ende
     der Hero-Sektion setzt nur .is-stuck für den Schatten, sobald
     wirklich über die Hero-Höhe hinaus gescrollt wurde.
     ============================================================ */
  function initStickyNav() {
    var nav = document.querySelector('.mainnav');
    var sentinel = document.getElementById('heroSentinel');
    if (!nav || !sentinel || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        nav.classList.toggle('is-stuck', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    observer.observe(sentinel);
  }

  /* ============================================================
     HERO-SLIDER (Crossfade)
     ============================================================ */
  function initHeroSlider() {
    var slides = document.querySelectorAll('.hero__slide');
    var artSlides = document.querySelectorAll('.hero__art-slide');
    var dots = document.querySelectorAll('.hero__dots [data-dot]');
    if (!slides.length || !dots.length) return;

    var AUTOPLAY_MS = 5500;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;
    var timer = null;

    function show(index) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      /* Bild-Folien laufen synchron zum Text mit — eigene Liste, damit
         die Reihenfolge im DOM (Text vor Bild) die Indizes nicht verschiebt. */
      artSlides.forEach(function (art, i) {
        art.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-on', i === index);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      current = index;
    }

    function next() {
      show((current + 1) % slides.length);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      timer = window.setInterval(next, AUTOPLAY_MS);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        startAutoplay(); /* Autoplay nach manueller Interaktion neu starten, nicht stehen lassen */
      });
    });

    show(0);
    startAutoplay();
  }

  /* ============================================================
     SCROLL-REVEAL
     Blendet .reveal-Sektionen beim ersten Erscheinen sanft ein,
     löst pro Sektion nur einmal aus.
     ============================================================ */
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     MERKLISTE PER E-MAIL (Magic-Link statt Login)
     Kein Passwort, keine Session — Nutzer bekommt einen Link, um
     die Merkliste geräteübergreifend abzurufen. Die Checkbox meldet
     zusätzlich zu neuen Artikeln an — ersetzt das separate
     Newsletter-Feld, ein Formular statt zwei E-Mail-Abfragen.
     Hier nur simuliert.
     TODO: POST /wp-json/blyck/v1/wishlist-link { email, notifyOnNewArticles }
     ============================================================ */
  function initWishlistEmail() {
    var form = document.getElementById('wishEmailForm');
    if (!form) return;
    var newsletterCheck = document.getElementById('wishEmailNewsletter');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var field = form.querySelector('.nl__field');
      var email = field.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast('Bitte gültige E-Mail-Adresse eingeben');
        return;
      }
      var subscribed = newsletterCheck && newsletterCheck.checked;
      toast(
        subscribed
          ? 'Merkliste-Link angefragt, Artikel-Benachrichtigung aktiviert (Demo — Versand folgt)'
          : 'Merkliste-Link angefragt (Demo — Versand folgt)'
      );
      form.reset();
    });
  }

  /* ============================================================
     SUCHE (Platzhalter)
     Unter 50 Produkten ersetzt die Kategorien-Navigation eine
     echte Suche vollständig — siehe Konzeptdokument Punkt 7.
     ============================================================ */
  function initSearchPlaceholder() {
    var form = document.querySelector('.search');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      toast('Suche startet bald — nutze die Kategorien');
    });
  }

  /* ============================================================
     TOAST
     ============================================================ */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-on');
    }, 1800);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', function (ev) {
    var wishBtn = ev.target.closest('[data-wish]');
    if (wishBtn) {
      ev.preventDefault();
      toggleWish(wishBtn.dataset.wish);
      wishBtn.classList.remove('is-pop');
      void wishBtn.offsetWidth; /* Reflow erzwingen, damit die Animation bei schnellen Klicks neu startet */
      wishBtn.classList.add('is-pop');
      wishBtn.addEventListener('animationend', function handler() {
        wishBtn.classList.remove('is-pop');
        wishBtn.removeEventListener('animationend', handler);
      });
      return;
    }

    var offer = ev.target.closest('[data-offer]');
    if (offer) {
      pushClick(offer.dataset.offer);
      var href = offer.getAttribute('href');
      if (!href || href === '#') {
        /* Noch kein Amazon-Link im CMS hinterlegt — Klick wird nur gezählt. */
        ev.preventDefault();
        toast('Kein Angebotslink hinterlegt');
      } else {
        toast('Klick gezählt · Weiterleitung zu Amazon');
      }
    }
  });

  /* ============================================================
     PRODUKT-GALERIE (Detailseite)
     Klick auf eine Miniatur tauscht src UND Zuschnitt des Hauptbilds —
     jedes Bild hat im CMS eigene Werte fuer Groesse/Position, die als
     data-Attribute an der Miniatur haengen. Ohne den Transform-Wechsel
     wuerde der Zuschnitt des ersten Bilds an jedem folgenden Bild
     haengen bleiben.
     ============================================================ */
  function initProductGallery() {
    var main = document.getElementById('pdMainImage');
    var mainBadge = document.getElementById('pdMainAiBadge');
    var thumbs = document.querySelectorAll('.pd__thumb');
    if (!main || !thumbs.length) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        main.src = thumb.dataset.full;
        main.style.transform =
          'translate(' + thumb.dataset.moveX + '%, ' + thumb.dataset.moveY + '%) ' +
          'scale(' + (thumb.dataset.zoom / 100) + ')';
        if (mainBadge) {
          mainBadge.style.display = thumb.dataset.aiBadge === 'true' ? '' : 'none';
        }
        thumbs.forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  renderWishCount();
  renderWishButtons();
  renderWishlistPage();
  renderAllClicks();
  initTabs();
  initWishlistEmail();
  initSearchPlaceholder();
  initStickyNav();
  initHeroSlider();
  initScrollReveal();
  initProductGallery();
})();
