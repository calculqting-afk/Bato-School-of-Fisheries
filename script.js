// ── PAGE TRANSITION OVERLAY ──
(function () {
  var overlay = document.createElement('div');
  overlay.id = 'page-transition';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(10,31,68,0.97)',
    'z-index:9999', 'pointer-events:none',
    'opacity:0', 'transition:opacity 0.45s cubic-bezier(0.4,0,0.2,1)',
    'display:none'
  ].join(';');
  document.documentElement.appendChild(overlay);

  if (sessionStorage.getItem('bsf-nav') === '1') {
    sessionStorage.removeItem('bsf-nav');
    overlay.style.display = '';
    overlay.style.opacity = '1';
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.style.opacity = '0';
          setTimeout(function () { overlay.style.display = 'none'; }, 460);
        });
      });
    });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
    if (link.target === '_blank') return;
    e.preventDefault();
    sessionStorage.setItem('bsf-nav', '1');
    overlay.style.display = '';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        setTimeout(function () { window.location.href = href; }, 440);
      });
    });
  }, true);
})();

document.addEventListener('DOMContentLoaded', function () {

  // 1. Highlight active nav link
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(function (link) {
    if (link.getAttribute('href') === page) link.classList.add('active');
    if (
      (page === 'arts.html' || page === 'sports.html' || page === 'sptve.html') &&
      link.classList.contains('spa-btn') && link.getAttribute('href') === '#'
    ) link.classList.add('active');
    if (page === 'strands.html' && link.getAttribute('href') === 'strands.html') {
      link.classList.add('active');
    }
  });

  // 2. Hamburger menu toggle
  var hamburger = document.getElementById('hamburger');
  var navMenu   = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  // 3. Navbar darkens + hides/shows on scroll
  var nav = document.querySelector('.navbar');
  var lastScroll = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (nav) {
      nav.style.background = y > 30 ? 'rgba(10,31,68,1)' : 'rgba(10,31,68,0.97)';
      if (y > lastScroll && y > 200) {
        nav.style.transform = 'translateY(-100%)';
      } else {
        nav.style.transform = 'translateY(0)';
      }
      lastScroll = y;
    }
  }, { passive: true });

  // 4. Strand tabs
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById(this.getAttribute('data-tab')).classList.add('active');
    });
  });

  // 5. ── TAB + SCROLL FROM URL PARAMS ──
  // Handles links like: strands.html?tab=techpro#industrial-arts
  var params = new URLSearchParams(window.location.search);
  var tabParam = params.get('tab');
  var hash = window.location.hash; // e.g. "#industrial-arts"

  if (tabParam) {
    // Activate the correct tab button
    var targetBtn = document.querySelector('.tab-btn[data-tab="' + tabParam + '"]');
    if (targetBtn) {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      targetBtn.classList.add('active');
      var panel = document.getElementById(tabParam);
      if (panel) panel.classList.add('active');
    }
  }

  // Scroll to the anchor after tab is shown
  if (hash) {
    setTimeout(function () {
      var target = document.querySelector(hash);
      if (target) {
        var navHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 80;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }, 150); // small delay so tab panel renders first
  }

  // 6. Animated stat counters
  var statsAnimated = false;
  var statsRow = document.querySelector('.stats');
  if (statsRow) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !statsAnimated) {
        statsAnimated = true;
        document.querySelectorAll('.stat-num').forEach(function (el) {
          var end    = parseInt(el.textContent.replace(/\D/g, ''));
          var suffix = el.textContent.replace(/[\d,]/g, '');
          var count  = 0;
          var step   = Math.ceil(end / 80);
          var timer  = setInterval(function () {
            count += step;
            if (count >= end) { count = end; clearInterval(timer); }
            el.textContent = count.toLocaleString() + suffix;
          }, 16);
        });
      }
    }, { threshold: 0.3 }).observe(statsRow);
  }

  // 7. Scroll reveal
  var revealItems = document.querySelectorAll('.reveal, .reveal-card');
  if (revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var delay = entry.target.classList.contains('reveal-card') ? (i % 6) * 80 : 0;
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  // 8. Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 9. Hero parallax
  var hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', function () {
      hero.style.backgroundPositionY = 'calc(center + ' + (window.scrollY * 0.25) + 'px)';
    }, { passive: true });
  }

});