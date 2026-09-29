(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Reveal sections on scroll.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

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
    window.addEventListener('pointermove', (event) => {
      glow.style.setProperty('--x', event.clientX + 'px');
      glow.style.setProperty('--y', event.clientY + 'px');
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

      wrapper.addEventListener('pointermove', (event) => {
        const rect = wrapper.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
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

      wrapper.addEventListener('pointerleave', () => {
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
      eye?.setAttribute('aria-label', 'Hiện thông tin liên hệ');
      eye?.blur();
    }
  }

  terminalCards.forEach((card) => {
    if (finePointer) {
      card.addEventListener('pointerenter', () => activateTerminal(card));
      card.addEventListener('pointerleave', () => deactivateTerminal(card));
      return;
    }

    // Touch devices have no hover, so tap the card to run the same sequence.
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;

      if (card.classList.contains('is-info-visible') ||
          card.classList.contains('is-scanning')) {
        deactivateTerminal(card);
      } else {
        activateTerminal(card);
      }
    });
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
      revealed ? 'Ẩn thông tin liên hệ' : 'Hiện thông tin liên hệ'
    );
  });

  // Best-effort shortcut deterrence. Browsers can still expose DevTools
  // through their own menus; client-side code cannot disable that absolutely.
  document.addEventListener('contextmenu', (event) => {
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
