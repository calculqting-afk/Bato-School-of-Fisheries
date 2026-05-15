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
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    if (
      window.matchMedia('(max-width: 700px)').matches &&
      link.parentElement &&
      link.parentElement.classList.contains('dropdown') &&
      link.nextElementSibling &&
      link.nextElementSibling.classList.contains('dropdown-box')
    ) return;
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
    if (link.getAttribute('href') === page) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    if (
      (page === 'Arts.html' || page === 'Sports.html' || page === 'SPTVE.html') &&
      link.classList.contains('programs-btn')
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    if (page === 'Strands.html' && link.getAttribute('href') === 'Strands.html') {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // 2. Hamburger menu toggle
  var hamburger = document.getElementById('hamburger');
  var navMenu   = document.getElementById('navMenu');

  function setMenuOpen(isOpen) {
    if (!hamburger || !navMenu) return;
    navMenu.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    if (!isOpen) closeDropdowns();
  }

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      setMenuOpen(!navMenu.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        setMenuOpen(false);
      }
    });
  }

  // 2b. Mobile dropdown toggle + keyboard-friendly state
  var dropdowns = document.querySelectorAll('.dropdown');
  function closeDropdowns(except) {
    dropdowns.forEach(function (dropdown) {
      if (dropdown === except) return;
      dropdown.classList.remove('open');
      var trigger = dropdown.querySelector(':scope > a');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.blur();
      }
    });
  }

  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.querySelector(':scope > a');
    var menu = dropdown.querySelector(':scope > .dropdown-box');
    if (!trigger || !menu) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function (e) {
      if (!window.matchMedia('(max-width: 700px)').matches) return;
      e.preventDefault();
      e.stopPropagation();
      var shouldOpen = !dropdown.classList.contains('open');
      closeDropdowns(shouldOpen ? dropdown : null);
      dropdown.classList.toggle('open', shouldOpen);
      trigger.setAttribute('aria-expanded', String(shouldOpen));
      if (!shouldOpen) trigger.blur();
    });
  });

  if (navMenu) {
    navMenu.addEventListener('click', function (e) {
      if (!window.matchMedia('(max-width: 700px)').matches) return;
      var link = e.target.closest('a[href]');
      if (!link) return;
      var isDropdownTrigger = link.parentElement &&
        link.parentElement.classList.contains('dropdown') &&
        link.nextElementSibling &&
        link.nextElementSibling.classList.contains('dropdown-box');
      if (!isDropdownTrigger) setMenuOpen(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeDropdowns();
    if (hamburger && navMenu) setMenuOpen(false);
  });

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
  function activateTab(btn) {
    var targetPanel = document.getElementById(btn.getAttribute('data-tab'));
    if (!targetPanel) return;
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    targetPanel.classList.add('active');
  }

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(this);
    });
  });

  // 5. Tab + scroll from URL params
  // Handles links like: Strands.html?tab=techpro#industrial-arts
  var params   = new URLSearchParams(window.location.search);
  var tabParam = params.get('tab');
  var hash     = window.location.hash;

  if (tabParam) {
    var targetBtn = document.querySelector('.tab-btn[data-tab="' + tabParam + '"]');
    if (targetBtn) {
      activateTab(targetBtn);
    }
  }

  if (hash) {
    setTimeout(function () {
      var target = document.querySelector(hash);
      if (target) {
        var navHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 80;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }, 150);
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

  // 10. Timeline scroll-reveal (about.html)
  var tlItems = document.querySelectorAll('.tl-item');
  if (tlItems.length) {
    var tlObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () { entry.target.classList.add('visible'); }, i * 120);
          tlObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    tlItems.forEach(function (el) { tlObserver.observe(el); });
  }

});
