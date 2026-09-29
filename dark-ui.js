(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal inspired by the cinematic transitions from the reference UI.
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
  }

  // Cursor glow.
  const glow = document.querySelector('.cursor-glow');
  if (glow && !reduced) {
    window.addEventListener('pointermove', (e) => {
      glow.style.setProperty('--x', e.clientX + 'px');
      glow.style.setProperty('--y', e.clientY + 'px');
    }, { passive: true });
  }

  // Subtle tilt on project cards.
  if (!reduced) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Command palette: Cmd/Ctrl + K, adapted from the docs template.
  const palette = document.querySelector('#command-palette');
  const search = document.querySelector('#command-search');
  const results = document.querySelector('#command-results');
  const openers = document.querySelectorAll('[data-command-open]');

  const commands = [
    { label: 'Home', meta: 'Overview', href: 'index.html' },
    { label: 'Projects', meta: 'Selected game work', href: 'projects.html' },
    { label: 'Dreamy Farm', meta: 'Unity 6 · C#', href: 'project.html' },
    { label: 'About Gia Phu', meta: 'Game developer profile', href: 'about.html' },
    { label: 'Contact', meta: 'GitHub & collaboration', href: 'contact.html' },
    { label: 'GitHub', meta: '@Dev-GiaPhu', href: 'https://github.com/Dev-GiaPhu', external: true }
  ];

  function render(query = '') {
    if (!results) return;
    const q = query.trim().toLowerCase();
    const filtered = commands.filter((c) => (c.label + ' ' + c.meta).toLowerCase().includes(q));
    results.innerHTML = filtered.map((c, i) => `
      <a class="command-item ${i === 0 ? 'active' : ''}" href="${c.href}" ${c.external ? 'target="_blank" rel="noopener"' : ''}>
        <span>${c.label}</span><small>${c.meta}</small>
      </a>`).join('') || '<p class="command-empty">No matching page.</p>';
  }

  function openPalette() {
    if (!palette) return;
    palette.hidden = false;
    document.body.classList.add('palette-open');
    render('');
    setTimeout(() => search?.focus(), 30);
  }

  function closePalette() {
    if (!palette) return;
    palette.hidden = true;
    document.body.classList.remove('palette-open');
  }

  openers.forEach((b) => b.addEventListener('click', openPalette));
  search?.addEventListener('input', (e) => render(e.target.value));
  palette?.addEventListener('click', (e) => {
    if (e.target === palette || e.target.matches('[data-close-palette]')) closePalette();
  });

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette?.hidden ? openPalette() : closePalette();
    }
    if (e.key === 'Escape') closePalette();
    if (e.key === 'Enter' && palette && !palette.hidden) {
      const first = results?.querySelector('a');
      if (document.activeElement === search && first) {
        e.preventDefault();
        first.click();
      }
    }
  });

  // Mobile nav.
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('header nav');
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
})();
