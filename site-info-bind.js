(() => {
  const data = window.SITE_INFO;
  if (!data) return;

  const get = (path) =>
    path.split(".").reduce((value, key) => value?.[key], data);

  document.querySelectorAll("[data-site-text]").forEach((element) => {
    const value = get(element.dataset.siteText);
    if (value !== undefined && value !== null) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-site-href]").forEach((element) => {
    const value = get(element.dataset.siteHref);
    if (value) element.setAttribute("href", value);
  });

  document.querySelectorAll("[data-site-mailto]").forEach((element) => {
    const value = get(element.dataset.siteMailto);
    if (value) element.setAttribute("href", "mailto:" + value);
  });

  // Contact links must follow the value currently rendered on screen.
  // This prevents a stale SITE_INFO/CMS href from opening an old address.
  document.querySelectorAll("[data-site-mailto]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const key = element.dataset.siteMailto;
      const source =
        element.querySelector('[data-site-text="' + key + '"]') ||
        document.querySelector('[data-site-text="' + key + '"]');

      const email = String(source?.textContent || "")
        .replace(/^mailto:/i, "")
        .trim()
        .replace(/\s+/g, "");

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

      const href = "mailto:" + email;
      element.setAttribute("href", href);
      event.preventDefault();
      window.location.href = href;
    }, { capture: true });
  });

  document.querySelectorAll("[data-site-download]").forEach((element) => {
    const value = get(element.dataset.siteDownload);
    if (value) element.setAttribute("download", value);
  });
})();
