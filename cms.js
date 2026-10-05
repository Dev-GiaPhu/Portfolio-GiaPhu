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

  function finishCms(state = {}) {
    Object.assign(window.PORTFOLIO_CMS_STATE, state, { ready: true });

    resolveReady?.(window.PORTFOLIO_CMS_STATE);

    window.dispatchEvent(new CustomEvent('portfolio-cms-ready', {
      detail: window.PORTFOLIO_CMS_STATE
    }));
  }

  async function applyCms() {
    try {
      if (!window.supabase) {
        finishCms({ error: 'Supabase SDK unavailable' });
        return;
      }

      if (!window.PORTFOLIO_SUPABASE_URL || !window.PORTFOLIO_SUPABASE_ANON_KEY) {
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

    // Give the browser the first paint and interaction setup before Supabase
    // fetches and applies CMS overrides. Timeout guarantees content still
    // refreshes quickly on busy devices.
    requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 900 });
      } else {
        setTimeout(run, 180);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleCms, { once: true });
  } else {
    scheduleCms();
  }
})();
