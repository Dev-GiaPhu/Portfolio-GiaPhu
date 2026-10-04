(() => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('header nav');
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = [...document.querySelectorAll('header nav a[href^="#"]')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  links.forEach((link) => {
    link.addEventListener('click', () => {
      nav?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      links.forEach((link) => {
        const active = link.getAttribute('href') === '#' + visible.target.id;
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }, {
      rootMargin: '-22% 0px -62% 0px',
      threshold: [0, 0.12, 0.3, 0.6]
    });

    sections.forEach((section) => observer.observe(section));
  }

  const getHeaderOffset = () => (header?.offsetHeight || 72) + 14;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        getHeaderOffset();

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth'
      });

      history.replaceState(null, '', selector);
    });
  });
})();
