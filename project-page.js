(() => {
  const config = window.PROJECT_SETUP;
  const root = document.getElementById('project-detail');

  if (!config || !root) return;

  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const lineBreaks = (lines = []) =>
    lines.map(escapeHtml).join('<br>');

  document.title = config.pageTitle || document.title;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && config.metaDescription) {
    metaDescription.setAttribute('content', config.metaDescription);
  }

  const tags = (config.tags || [])
    .map((tag) => escapeHtml(tag))
    .join(' · ');

  const playable = config.playable?.enabled
    ? `
      <section class="playable-build" data-reveal aria-labelledby="playable-title">
        <div class="playable-build-head">
          <div>
            <p class="eyebrow">${escapeHtml(config.playable.eyebrow || 'PLAYABLE BUILD / WEBGL')}</p>
            <h2 id="playable-title">${lineBreaks(config.playable.titleLines || [])}</h2>
          </div>
          <p>${escapeHtml(config.playable.description || '')}</p>
        </div>
        <div class="playable-frame-shell">
          <div class="playable-frame-top">
            <span>${escapeHtml(config.playable.label || 'WEBGL BUILD')}</span>
            <a href="${escapeHtml(config.playable.playerPage || '#')}" target="_blank" rel="noopener">MỞ RIÊNG ↗</a>
          </div>
          <iframe
            class="playable-frame"
            src="${escapeHtml(config.playable.playerPage || '')}"
            title="${escapeHtml('Chơi ' + (config.nameLines || []).join(' '))}"
            loading="lazy"
            allow="fullscreen; autoplay; gamepad"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    `
    : '';

  const galleryItems = (config.gallery || []).map((item, index) => `
    <figure class="project-shot project-shot--${escapeHtml(item.layout || 'normal')}" data-reveal>
      <div class="project-shot-media">
        <img
          src="${escapeHtml(item.src || '')}"
          alt="${escapeHtml(item.alt || item.title || 'Ảnh dự án')}"
          loading="lazy"
          data-project-image
        >
        <div class="project-shot-missing" aria-hidden="true">
          <span>IMAGE / ${String(index + 1).padStart(2, '0')}</span>
          <strong>${escapeHtml(item.src || 'CHƯA CÓ TÊN FILE')}</strong>
        </div>
      </div>
      <figcaption>
        <p class="eyebrow">${escapeHtml(item.label || '')}</p>
        <h3>${escapeHtml(item.title || '')}</h3>
        <p>${escapeHtml(item.description || '')}</p>
      </figcaption>
    </figure>
  `).join('');

  const gallery = galleryItems
    ? `
      <section class="project-gallery-section">
        <div class="project-gallery-head" data-reveal>
          <div>
            <p class="eyebrow">PROJECT VISUALS</p>
            <h2>${escapeHtml(config.galleryTitle || 'HÌNH ẢNH DỰ ÁN.')}</h2>
          </div>
          <p>${escapeHtml(config.galleryIntro || '')}</p>
        </div>
        <div class="project-gallery">
          ${galleryItems}
        </div>
      </section>
    `
    : '';

  const sections = (config.sections || []).map((section) => `
    <section class="panel" data-reveal>
      <p class="eyebrow">${escapeHtml(section.label || '')}</p>
      <h2>${escapeHtml(section.title || '')}</h2>
      <p>${escapeHtml(section.description || '')}</p>
    </section>
  `).join('');

  const github = config.github?.enabled
    ? `
      <p class="project-source-action" data-reveal>
        <a class="btn" href="${escapeHtml(config.github.url || '#')}" target="_blank" rel="noopener">
          ${escapeHtml(config.github.label || 'Xem GitHub ↗')}
        </a>
      </p>
    `
    : '';

  root.innerHTML = `
    <a class="back" href="projects.html">← TẤT CẢ DỰ ÁN</a>

    <p class="eyebrow project-detail-index" data-reveal>
      ${escapeHtml(config.indexLabel || '')}
    </p>

    <h1 class="page-title" data-reveal>
      ${lineBreaks(config.nameLines || [])}
    </h1>

    <p class="lede" data-reveal>
      ${escapeHtml(config.introduction || '')}
    </p>

    <div
      class="project-hero project-hero-configurable"
      data-reveal
      style="--project-hero-image:url('${escapeHtml(config.heroImage || '')}')"
      aria-label="${escapeHtml(config.heroAlt || (config.nameLines || []).join(' '))}"
    >
      <span>${tags}</span>
    </div>

    ${playable}
    ${gallery}

    <div class="info-grid project-info-grid">
      ${sections}
    </div>

    ${github}
  `;

  document.querySelectorAll('[data-project-image]').forEach((image) => {
    const markMissing = () => {
      image.closest('.project-shot-media')?.classList.add('is-missing');
    };

    image.addEventListener('error', markMissing);

    if (image.complete && !image.naturalWidth) {
      markMissing();
    }
  });
})();
