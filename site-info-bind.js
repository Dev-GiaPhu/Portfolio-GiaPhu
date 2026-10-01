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

  document.querySelectorAll("[data-site-download]").forEach((element) => {
    const value = get(element.dataset.siteDownload);
    if (value) element.setAttribute("download", value);
  });
})();
