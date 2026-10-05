(() => {
  let resolveReady;

  window.PORTFOLIO_CMS_READY = new Promise((resolve) => {
    resolveReady = resolve;
  });

  window.PORTFOLIO_CMS_STATE = {
    ready: false,
    applied: 0,
    error: null
  };

  function escapeSelectorValue(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function contactActionFor(link) {
    const explicit = String(link?.dataset?.contactAction || '').toLowerCase();
    if (explicit) return explicit;

    const href = String(link?.getAttribute?.('href') || '').trim().toLowerCase();
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith('sms:')) return 'sms';
    return '';
  }

  function contactSourceElement(link, action) {
    const sourceKey =
      link?.dataset?.contactSource ||
      (action === 'email' ? link?.dataset?.siteMailto : '') ||
      (action === 'phone' ? link?.dataset?.siteTel : '') ||
      '';

    if (sourceKey) {
      const selector =
        '[data-site-text="' + escapeSelectorValue(sourceKey) + '"]';

      return link.querySelector(selector) || document.querySelector(selector);
    }

    return (
      link.querySelector('[data-contact-value]') ||
      link.querySelector('strong') ||
      link.querySelector('[data-site-text]') ||
      link
    );
  }

  function normalizeEmail(value) {
    const email = String(value || '')
      .replace(/^mailto:/i, '')
      .trim()
      .replace(/\s+/g, '');

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  }

  function normalizePhone(value) {
    const raw = String(value || '').trim();
    const plus = raw.startsWith('+') ? '+' : '';
    const digits = raw.replace(/\D/g, '');

    if (digits.length < 6) return '';
    return plus + digits;
  }

  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
      if (/^https?:\/\//i.test(raw)) return new URL(raw).href;

      if (/^[\w.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(raw)) {
        return new URL('https://' + raw).href;
      }
    } catch {}

    return '';
  }

  function syncContactLink(link) {
    if (!(link instanceof HTMLAnchorElement)) return;

    const action = contactActionFor(link);
    if (!action) return;

    const source = contactSourceElement(link, action);
    const value = source?.textContent?.trim() || '';

    if (action === 'email') {
      const email = normalizeEmail(value);
      if (email) link.setAttribute('href', 'mailto:' + email);
      return;
    }

    if (action === 'phone' || action === 'tel') {
      const phone = normalizePhone(value);
      if (phone) link.setAttribute('href', 'tel:' + phone);
      return;
    }

    if (action === 'sms') {
      const phone = normalizePhone(value);
      if (phone) link.setAttribute('href', 'sms:' + phone);
      return;
    }

    if (action === 'url') {
      const url = normalizeUrl(value);
      if (url) link.setAttribute('href', url);
    }
  }

  function syncContactLinks(root = document) {
    const links =
      root.querySelectorAll?.(
        'a[data-contact-action],a[href^="mailto:"],a[href^="tel:"],a[href^="sms:"]'
      ) || [];

    links.forEach(syncContactLink);
  }

  function installContactLinkSync() {
    syncContactLinks();

    const observer = new MutationObserver((mutations) => {
      const shouldSync = mutations.some(
        (mutation) =>
          mutation.type === 'characterData' ||
          mutation.type === 'childList'
      );

      if (shouldSync) syncContactLinks();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });

    window.addEventListener('portfolio-cms-ready', () => {
      syncContactLinks();
    });
  }

  function finishCms(state = {}) {
    Object.assign(window.PORTFOLIO_CMS_STATE, state, { ready: true });

    resolveReady?.(window.PORTFOLIO_CMS_STATE);

    window.dispatchEvent(
      new CustomEvent('portfolio-cms-ready', {
        detail: window.PORTFOLIO_CMS_STATE
      })
    );
  }

  async function applyCms() {
    try {
      if (!window.supabase) {
        finishCms({ error: 'Supabase SDK unavailable' });
        return;
      }

      if (
        !window.PORTFOLIO_SUPABASE_URL ||
        !window.PORTFOLIO_SUPABASE_ANON_KEY
      ) {
        finishCms({ error: 'Supabase config unavailable' });
        return;
      }

      const client = window.supabase.createClient(
        window.PORTFOLIO_SUPABASE_URL,
        window.PORTFOLIO_SUPABASE_ANON_KEY
      );

      const { data, error } = await client
        .from('portfolio_content')
        .select('selector,property,value')
        .order('updated_at', { ascending: true });

      if (error) {
        console.info('Portfolio CMS chưa được cấu hình:', error.message);
        finishCms({ error: error.message });
        return;
      }

      let applied = 0;

      (data || []).forEach((item) => {
        let elements;

        try {
          elements = [...document.querySelectorAll(item.selector)];
        } catch {
          return;
        }

        if (!elements.length) return;

        elements.forEach((element) => {
          if (item.property === 'src') {
            element.setAttribute('src', item.value);
          } else if (item.property === 'href') {
            element.setAttribute('href', item.value);
          } else if (item.property === 'textContent') {
            element.textContent = item.value;
          } else if (item.property === 'style') {
            element.setAttribute('style', item.value);
          } else {
            element.innerHTML = item.value;
          }

          applied += 1;
        });
      });

      syncContactLinks();
      finishCms({ applied, error: null });
    } catch (error) {
      console.error('Portfolio CMS error:', error);
      finishCms({ error: error?.message || String(error) });
    }
  }

  function scheduleCms() {
    const isAdminPreview =
      new URLSearchParams(window.location.search).get('admin-preview') === '1';

    if (isAdminPreview) {
      applyCms();
      return;
    }

    const run = () => applyCms();

    requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 900 });
      } else {
        setTimeout(run, 180);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        installContactLinkSync();
        scheduleCms();
      },
      { once: true }
    );
  } else {
    installContactLinkSync();
    scheduleCms();
  }
})();