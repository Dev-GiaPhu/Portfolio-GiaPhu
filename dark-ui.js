(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobileViewport = window.matchMedia('(max-width: 767px)').matches;

  // Reveal sections on scroll.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: mobileViewport ? 0.01 : 0.12,
      rootMargin: mobileViewport ? '180px 0px' : '0px'
    });

    document.querySelectorAll('[data-reveal]').forEach((element) => {
      observer.observe(element);
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => {
      element.classList.add('is-visible');
    });
  }

  // Soft cursor glow on desktop.
  const glow = document.querySelector('.cursor-glow');
  if (glow && !reducedMotion && finePointer) {
    let glowFrame = 0;
    let glowX = 0;
    let glowY = 0;

    window.addEventListener('pointermove', (event) => {
      glowX = event.clientX;
      glowY = event.clientY;
      if (glowFrame) return;

      glowFrame = requestAnimationFrame(() => {
        glowFrame = 0;
        glow.style.setProperty('--x', glowX + 'px');
        glow.style.setProperty('--y', glowY + 'px');
      });
    }, { passive: true });
  }

  // Mobile navigation.
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('header nav');

  navToggle?.addEventListener('click', () => {
    const opened = nav?.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(Boolean(opened)));
  });

  // 3D rare-card tilt for the portrait.
  if (!reducedMotion && finePointer) {
    document.querySelectorAll('[data-tilt-card]').forEach((wrapper) => {
      const shell = wrapper.querySelector('.terminal-shell');
      const glare = wrapper.querySelector('.terminal-card-glare');

      if (!shell) return;

      let tiltFrame = 0;
      let pointerX = 0;
      let pointerY = 0;

      wrapper.addEventListener('pointermove', (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (tiltFrame) return;

        tiltFrame = requestAnimationFrame(() => {
          tiltFrame = 0;
          const rect = wrapper.getBoundingClientRect();
          const px = (pointerX - rect.left) / rect.width;
          const py = (pointerY - rect.top) / rect.height;
          const rotateY = (px - 0.5) * 16;
          const rotateX = (0.5 - py) * 14;

          shell.style.transform =
            `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px) scale(1.012)`;

          if (glare) {
            glare.style.setProperty('--mx', `${px * 100}%`);
            glare.style.setProperty('--my', `${py * 100}%`);
          }

          wrapper.classList.add('is-hovering');
        });
      }, { passive: true });

      wrapper.addEventListener('pointerleave', () => {
        if (tiltFrame) {
          cancelAnimationFrame(tiltFrame);
          tiltFrame = 0;
        }
        shell.style.transform = '';
        wrapper.classList.remove('is-hovering');
      });
    });
  }

  // Terminal interaction sequence:
  // enter/tap -> one scan pass -> digitally reveal information.
  const terminalCards = document.querySelectorAll(
    '.hero-terminal-card, .terminal-project-card'
  );

  const revealTimers = new WeakMap();

  function clearRevealTimer(card) {
    const timer = revealTimers.get(card);
    if (timer) {
      window.clearTimeout(timer);
      revealTimers.delete(card);
    }
  }

  function activateTerminal(card) {
    clearRevealTimer(card);
    card.classList.remove('is-info-visible');
    card.classList.remove('is-scanning');

    // Force a reflow so the one-shot scan animation restarts cleanly.
    void card.offsetWidth;

    card.classList.add('is-scanning');

    const timer = window.setTimeout(() => {
      card.classList.add('is-info-visible');
      revealTimers.delete(card);
    }, reducedMotion ? 0 : 430);

    revealTimers.set(card, timer);
  }

  function deactivateTerminal(card) {
    clearRevealTimer(card);
    card.classList.remove('is-scanning', 'is-info-visible');

    if (card.classList.contains('hero-terminal-card')) {
      card.classList.remove('is-contact-revealed');
      const eye = card.querySelector('[data-contact-toggle]');
      eye?.setAttribute('aria-expanded', 'false');
      eye?.setAttribute('aria-label', 'Hiện thông tin cá nhân');
      eye?.blur();
    }
  }

  terminalCards.forEach((card) => {
    if (finePointer) {
      card.addEventListener('pointerenter', () => activateTerminal(card));
      card.addEventListener('pointerleave', () => deactivateTerminal(card));
      return;
    }

    // Touch/mobile: show terminal information immediately.
    // Personal values inside the portrait card still stay masked
    // until the eye button is pressed.
    clearRevealTimer(card);
    card.classList.remove('is-scanning');
    card.classList.add('is-info-visible');
  });
  // Eye toggle: reveal or mask contact values only.
  const contactToggle = document.querySelector('[data-contact-toggle]');
  const portraitCard = contactToggle?.closest('.hero-terminal-card');

  contactToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!portraitCard) return;

    const revealed = portraitCard.classList.toggle('is-contact-revealed');
    contactToggle.setAttribute('aria-expanded', String(revealed));
    contactToggle.setAttribute(
      'aria-label',
      revealed ? 'Ẩn thông tin cá nhân' : 'Hiện thông tin cá nhân'
    );
  });

  // Best-effort shortcut deterrence. Browsers can still expose DevTools
  // through their own menus; client-side code cannot disable that absolutely.
  document.addEventListener('contextmenu', (event) => {
    if (!event.target.closest?.('.one-project-game')) return;
    event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const devtoolsShortcut =
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
      ((event.ctrlKey || event.metaKey) && key === 'u');

    if (!devtoolsShortcut) return;

    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });
})();
