(() => {
  async function applyCms() {
    if (!window.supabase) return;
    if (!window.PORTFOLIO_SUPABASE_URL || !window.PORTFOLIO_SUPABASE_ANON_KEY) return;

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
      return;
    }

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
          return;
        }

        if (item.property === 'href') {
          element.setAttribute('href', item.value);
          return;
        }

        if (item.property === 'textContent') {
          element.textContent = item.value;
          return;
        }

        if (item.property === 'style') {
          element.setAttribute('style', item.value);
          return;
        }

        element.innerHTML = item.value;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCms, { once: true });
  } else {
    applyCms();
  }
})();
