(() => {
  const rail = document.querySelector('[data-scroll-rail]');
  const track = document.querySelector('[data-rail-track]');
  const thumb = document.querySelector('[data-scroll-thumb]');
  const links = [...document.querySelectorAll('[data-rail-link]')];
  const railNav = rail?.querySelector('.rail-nav');
  const glassSvg = rail?.querySelector('[data-rail-glass-svg]');
  const glassShape = rail?.querySelector('[data-rail-glass-shape]');
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let dragging = false;
  let dragPointerId = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function scrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function setScrollFromTrack(clientY) {
    if (!track || !thumb) return;
    const rect = track.getBoundingClientRect();
    const thumbSize = thumb.offsetHeight || 30;
    const usable = Math.max(1, rect.height - thumbSize);
    const local = clamp(clientY - rect.top - thumbSize / 2, 0, usable);
    const progress = local / usable;
    window.scrollTo({ top: progress * scrollMax(), behavior: 'auto' });
  }

  function syncThumb() {
    if (!track || !thumb) return;
    const rect = track.getBoundingClientRect();
    const thumbSize = thumb.offsetHeight || 30;
    const usable = Math.max(1, rect.height - thumbSize);
    const progress = clamp(window.scrollY / scrollMax(), 0, 1);
    thumb.style.transform = `translate3d(0,${progress * usable}px,0)`;
    thumb.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  }

  thumb?.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragPointerId = event.pointerId;
    thumb.setPointerCapture?.(event.pointerId);
    document.body.classList.add('is-dragging-rail');
    event.preventDefault();
  });

  thumb?.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    setScrollFromTrack(event.clientY);
    event.preventDefault();
  });

  const stopDrag = (event) => {
    if (!dragging) return;
    if (event?.pointerId !== undefined && event.pointerId !== dragPointerId) return;
    dragging = false;
    dragPointerId = null;
    document.body.classList.remove('is-dragging-rail');
  };

  thumb?.addEventListener('pointerup', stopDrag);
  thumb?.addEventListener('pointercancel', stopDrag);

  track?.addEventListener('pointerdown', (event) => {
    if (event.target === thumb || thumb?.contains(event.target)) return;
    setScrollFromTrack(event.clientY);
  });

  function scrollToTarget(target, behavior = 'smooth') {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 18;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;

      let target;
      try {
        target = document.querySelector(selector);
      } catch {
        return;
      }
      if (!target) return;

      event.preventDefault();

      const deferredGame = target.querySelector?.('[data-game-src]');
      if (deferredGame) startDeferredGame(deferredGame);

      scrollToTarget(target);
      history.replaceState(null, '', selector);
    });
  });

  let glassCurrentY = null;
  let glassTargetY = null;
  let glassCurrentWidth = null;
  let glassTargetWidth = null;
  let glassTargetIndex = 0;
  let glassFrame = null;

  function buildGlassRailPath(
    navTop,
    navBottom,
    centerY,
    extensionWidth,
    activeIndex,
    itemCount
  ) {
    const right = 184;
    const columnLeft = 142;
    const columnRadius = 21;
    const top = navTop;
    const bottom = Math.max(navTop + 84, navBottom);
    const halfHeight = 21;

    const isFirst = activeIndex === 0;
    const isLast = activeIndex === itemCount - 1;

    const center = isFirst
      ? top + halfHeight
      : isLast
        ? bottom - halfHeight
        : clamp(centerY, top + halfHeight + 2, bottom - halfHeight - 2);

    const lobeLeft = right - extensionWidth;
    const capRight = lobeLeft + halfHeight;

    // FIRST TAB:
    // top edge itself extends left. No growth above the rail and no inward notch.
    if (isFirst) {
      const lowerJoin = center + halfHeight;

      return [
        `M ${capRight} ${top}`,
        `C ${lobeLeft + 9} ${top}, ${lobeLeft} ${top + 9}, ${lobeLeft} ${center}`,
        `C ${lobeLeft} ${center + 12}, ${lobeLeft + 9} ${lowerJoin}, ${capRight} ${lowerJoin}`,
        `C ${capRight + 26} ${lowerJoin}, ${columnLeft - 12} ${lowerJoin}, ${columnLeft} ${lowerJoin + 13}`,
        `V ${bottom - columnRadius}`,
        `Q ${columnLeft} ${bottom} ${columnLeft + columnRadius} ${bottom}`,
        `H ${right - columnRadius}`,
        `Q ${right} ${bottom} ${right} ${bottom - columnRadius}`,
        `V ${top + columnRadius}`,
        `Q ${right} ${top} ${right - columnRadius} ${top}`,
        `H ${capRight}`,
        'Z'
      ].join(' ');
    }

    // LAST TAB:
    // bottom edge itself extends left. The heart button sits outside this shape.
    if (isLast) {
      const upperJoin = center - halfHeight;

      return [
        `M ${columnLeft + columnRadius} ${top}`,
        `H ${right - columnRadius}`,
        `Q ${right} ${top} ${right} ${top + columnRadius}`,
        `V ${bottom - columnRadius}`,
        `Q ${right} ${bottom} ${right - columnRadius} ${bottom}`,
        `H ${capRight}`,
        `C ${lobeLeft + 9} ${bottom}, ${lobeLeft} ${bottom - 9}, ${lobeLeft} ${center}`,
        `C ${lobeLeft} ${center - 12}, ${lobeLeft + 9} ${upperJoin}, ${capRight} ${upperJoin}`,
        `C ${capRight + 26} ${upperJoin}, ${columnLeft - 12} ${upperJoin}, ${columnLeft} ${upperJoin - 13}`,
        `V ${top + columnRadius}`,
        `Q ${columnLeft} ${top} ${columnLeft + columnRadius} ${top}`,
        'Z'
      ].join(' ');
    }

    // MIDDLE TABS:
    // one clean outward bulge from the column wall.
    // No concave waist / indentation at the joint.
    const upperJoin = center - halfHeight;
    const lowerJoin = center + halfHeight;

    return [
      `M ${columnLeft + columnRadius} ${top}`,
      `H ${right - columnRadius}`,
      `Q ${right} ${top} ${right} ${top + columnRadius}`,
      `V ${bottom - columnRadius}`,
      `Q ${right} ${bottom} ${right - columnRadius} ${bottom}`,
      `H ${columnLeft + columnRadius}`,
      `Q ${columnLeft} ${bottom} ${columnLeft} ${bottom - columnRadius}`,
      `V ${lowerJoin + 13}`,
      `C ${columnLeft - 12} ${lowerJoin}, ${capRight + 26} ${lowerJoin}, ${capRight} ${lowerJoin}`,
      `C ${lobeLeft + 9} ${lowerJoin}, ${lobeLeft} ${center + 12}, ${lobeLeft} ${center}`,
      `C ${lobeLeft} ${center - 12}, ${lobeLeft + 9} ${upperJoin}, ${capRight} ${upperJoin}`,
      `C ${capRight + 26} ${upperJoin}, ${columnLeft - 12} ${upperJoin}, ${columnLeft} ${upperJoin - 13}`,
      `V ${top + columnRadius}`,
      `Q ${columnLeft} ${top} ${columnLeft + columnRadius} ${top}`,
      'Z'
    ].join(' ');
  }

  function renderGlassRail() {
    glassFrame = null;

    if (
      !glassSvg ||
      !glassShape ||
      glassTargetY == null ||
      glassTargetWidth == null
    ) {
      return;
    }

    if (glassCurrentY == null) glassCurrentY = glassTargetY;
    if (glassCurrentWidth == null) glassCurrentWidth = glassTargetWidth;

    glassCurrentY += (glassTargetY - glassCurrentY) * 0.17;
    glassCurrentWidth += (glassTargetWidth - glassCurrentWidth) * 0.15;

    const height = Math.max(
      1,
      rail?.offsetHeight ||
      railNav?.offsetHeight ||
      220
    );

    const navTop = railNav?.offsetTop || 0;
    const navBottom = navTop + (railNav?.offsetHeight || height);

    glassSvg.setAttribute('viewBox', `0 0 190 ${height}`);
    glassShape.setAttribute(
      'd',
      buildGlassRailPath(
        navTop,
        navBottom,
        glassCurrentY,
        glassCurrentWidth,
        glassTargetIndex,
        links.length
      )
    );

    const moving =
      Math.abs(glassTargetY - glassCurrentY) > 0.25 ||
      Math.abs(glassTargetWidth - glassCurrentWidth) > 0.25;

    if (moving) {
      glassFrame = requestAnimationFrame(renderGlassRail);
    } else {
      glassCurrentY = glassTargetY;
      glassCurrentWidth = glassTargetWidth;
    }
  }

  function syncGlassRail(activeLink) {
    if (!glassSvg || !railNav || !activeLink) return;

    if (window.matchMedia('(max-width: 767px)').matches) {
      if (glassFrame) {
        cancelAnimationFrame(glassFrame);
        glassFrame = null;
      }
      glassShape?.setAttribute('d', '');
      return;
    }

    const label = activeLink.querySelector('span');
    const labelWidth = label?.scrollWidth || 52;
    const compact = window.matchMedia('(max-width: 900px)').matches;

    glassTargetWidth = clamp(
      labelWidth + (compact ? 66 : 76),
      compact ? 98 : 112,
      compact ? 134 : 150
    );

    glassTargetY =
      railNav.offsetTop +
      activeLink.offsetTop +
      activeLink.offsetHeight / 2;

    glassTargetIndex = Math.max(0, links.indexOf(activeLink));

    if (!glassFrame) {
      glassFrame = requestAnimationFrame(renderGlassRail);
    }
  }

  function updateActiveSection() {
    if (!sections.length) return;

    const marker = window.innerHeight * 0.42;
    let active = sections[0];
    let activeLink = links[0] || null;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker) active = section;
    });

    links.forEach((link) => {
      const isActive = link.getAttribute('href') === '#' + active.id;
      link.classList.toggle('is-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
        activeLink = link;
      } else {
        link.removeAttribute('aria-current');
      }
    });

    syncGlassRail(activeLink);
  }

  let ticking = false;
  function syncScrollUi() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncThumb();
      updateActiveSection();
      ticking = false;
    });
  }

  window.addEventListener('scroll', syncScrollUi, { passive: true });
  window.addEventListener('resize', syncScrollUi, { passive: true });
  syncScrollUi();

  // Prevent casual browser context/source actions over the embedded game area.
  // The actual iframe also applies the same guard internally.
  document.addEventListener('contextmenu', (event) => {
    if (!event.target.closest?.('.one-project-game')) return;
    event.preventDefault();
  }, { capture: true });

  // Heavy Unity/WebGL downloads start only when the visitor explicitly
  // asks to play. Scrolling the portfolio never starts an 80-100 MB game.
  const deferredGameFrames = [...document.querySelectorAll('[data-game-src]')];

  function setGameGateState(iframe, loading) {
    const gate = iframe
      ?.closest('.one-project-game')
      ?.querySelector('[data-game-load-gate]');

    if (!gate) return;
    gate.classList.toggle('is-loading', Boolean(loading));
    gate.hidden = Boolean(loading);
  }

  function startDeferredGame(iframe) {
    if (!iframe || iframe.dataset.gameLoaded === 'true') return;
    const source = iframe.dataset.gameSrc;
    if (!source) return;

    iframe.dataset.gameLoaded = 'true';
    setGameGateState(iframe, true);
    iframe.src = source;
  }

  // Warm Unity build files in the browser cache after the portfolio has become
  // interactive. This downloads game data in the background without creating
  // a Unity instance, so clicking Play can reuse the same cached URLs.
  const gamePreloadPromises = new WeakMap();

  function parseUnityQuoted(source, pattern, fallback = '') {
    const match = source.match(pattern);
    return match?.[1] || fallback;
  }

  function hashBuildMarker(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  async function getBuildFingerprint(base, buildDir, dataFile, codeFile, fallback) {
    const markers = await Promise.all(
      [dataFile, codeFile].map(async (file) => {
        try {
          const url = new URL(buildDir.replace(/\/$/, '') + '/' + file, base).href;
          const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
          return [
            response.headers.get('etag') || '',
            response.headers.get('last-modified') || '',
            response.headers.get('content-length') || ''
          ].join(':');
        } catch {
          return '';
        }
      })
    );

    return hashBuildMarker(markers.filter(Boolean).join('|') || fallback || 'portfolio-build');
  }

  async function consumeForCache(url) {
    const response = await fetch(url, {
      cache: 'force-cache',
      credentials: 'same-origin',
      priority: 'low'
    });

    if (!response.ok) throw new Error('Không tải trước được ' + url);

    if (!response.body?.getReader) {
      await response.arrayBuffer();
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }

  function markPreloadState(iframe, state) {
    iframe.dataset.gamePreload = state;
    const gate = iframe
      ?.closest('.one-project-game')
      ?.querySelector('[data-game-load-gate]');
    gate?.setAttribute('data-preload-state', state);
  }

  async function preloadGameBuild(iframe) {
    if (!iframe || iframe.dataset.gameLoaded === 'true') return;
    if (gamePreloadPromises.has(iframe)) return gamePreloadPromises.get(iframe);

    const promise = (async () => {
      try {
        markPreloadState(iframe, 'preparing');

        const hostUrl = new URL(iframe.dataset.gameSrc, window.location.href);
        const game = hostUrl.searchParams.get('game');
        if (!game) return;

        const pageUrl = new URL('games/' + game + '/index.html', window.location.href).href;
        const response = await fetch(pageUrl, { cache: 'no-cache' });
        if (!response.ok) return;

        const source = await response.text();
        const base = new URL('.', pageUrl).href;
        const buildDir = parseUnityQuoted(
          source,
          /var\s+buildUrl\s*=\s*["']([^"']+)["']/,
          'Build'
        );
        const loaderFile = parseUnityQuoted(
          source,
          /var\s+loaderUrl\s*=\s*buildUrl\s*\+\s*["']\/([^"']+)["']/
        );
        const dataFile = parseUnityQuoted(
          source,
          /dataUrl\s*:\s*buildUrl\s*\+\s*["']\/([^"']+)["']/
        );
        const frameworkFile = parseUnityQuoted(
          source,
          /frameworkUrl\s*:\s*buildUrl\s*\+\s*["']\/([^"']+)["']/
        );
        const codeFile = parseUnityQuoted(
          source,
          /codeUrl\s*:\s*buildUrl\s*\+\s*["']\/([^"']+)["']/
        );
        const productVersion = parseUnityQuoted(
          source,
          /productVersion\s*:\s*["']([^"']*)["']/,
          '1.0'
        );

        if (!loaderFile || !dataFile || !frameworkFile || !codeFile) return;

        const version = await getBuildFingerprint(
          base,
          buildDir,
          dataFile,
          codeFile,
          productVersion
        );

        const buildUrl = (file) => {
          const url = new URL(buildDir.replace(/\/$/, '') + '/' + file, base);
          url.searchParams.set('v', version);
          return url.href;
        };

        // Small runtime files first, then the two large payloads together.
        await Promise.all([
          consumeForCache(buildUrl(loaderFile)),
          consumeForCache(buildUrl(frameworkFile))
        ]);

        await Promise.all([
          consumeForCache(buildUrl(dataFile)),
          consumeForCache(buildUrl(codeFile))
        ]);

        markPreloadState(iframe, 'ready');
      } catch (error) {
        console.info('Unity background preload skipped:', error);
        markPreloadState(iframe, 'idle');
      }
    })();

    gamePreloadPromises.set(iframe, promise);
    return promise;
  }

  function scheduleGamePreloads() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData) return;
    if (['slow-2g', '2g'].includes(connection?.effectiveType)) return;

    let index = 0;
    const preloadNext = async () => {
      const iframe = deferredGameFrames[index++];
      if (!iframe) return;

      if (iframe.dataset.gameLoaded !== 'true') {
        await preloadGameBuild(iframe);
      }

      if (index < deferredGameFrames.length) {
        setTimeout(preloadNext, 250);
      }
    };

    const begin = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadNext(), { timeout: 1800 });
      } else {
        setTimeout(preloadNext, 900);
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(begin, 650);
    } else {
      window.addEventListener('load', () => setTimeout(begin, 650), { once: true });
    }
  }

  scheduleGamePreloads();

  document.querySelectorAll('[data-game-load]').forEach((button) => {
    button.addEventListener('click', () => {
      const iframe = document.getElementById(button.dataset.gameLoad);
      startDeferredGame(iframe);
    });
  });

  // Direct links to a game are explicit intent, so start that game immediately.
  window.addEventListener('hashchange', () => {
    const target = document.querySelector(location.hash || '');
    const iframe = target?.querySelector?.('[data-game-src]');
    startDeferredGame(iframe);
  });

  if (location.hash) {
    const target = document.querySelector(location.hash);
    const iframe = target?.querySelector?.('[data-game-src]');
    startDeferredGame(iframe);
  }

  // Game audio:
  // - default muted;
  // - if the user unmutes, leaving the game section suspends audio;
  // - returning to the section resumes it.
  const audioButtons = [...document.querySelectorAll('[data-game-audio]')];
  const gameStates = new Map();

  function sendAudio(iframe, muted) {
    iframe?.contentWindow?.postMessage({
      type: 'portfolio-game-audio',
      muted: Boolean(muted)
    }, '*');
  }

  audioButtons.forEach((button) => {
    const iframe = document.getElementById(button.dataset.gameAudio);
    if (!iframe) return;

    const state = {
      iframe,
      button,
      userMuted: true,
      inView: false
    };

    gameStates.set(iframe.id, state);
    sendAudio(iframe, true);

    button.addEventListener('click', () => {
      state.userMuted = !state.userMuted;
      button.setAttribute('aria-pressed', String(!state.userMuted));
      button.classList.toggle('is-unmuted', !state.userMuted);
      button.title = state.userMuted ? 'Bật âm thanh' : 'Tắt âm thanh';
      sendAudio(iframe, state.userMuted || !state.inView);
    });
  });

  const gameObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target.querySelector('.onepage-game-frame');
      if (!iframe) return;

      const state = gameStates.get(iframe.id);
      if (!state) return;

      state.inView = entry.isIntersecting && entry.intersectionRatio >= 0.22;
      sendAudio(iframe, state.userMuted || !state.inView);
    });
  }, {
    threshold: [0, 0.22, 0.5]
  });

  document.querySelectorAll('.one-project-game').forEach((game) => {
    gameObserver.observe(game);
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'portfolio-game-ready') return;
    const slug = event.data.game;
    const id = slug === 'oops-brake' ? 'game-oops-brake' : 'game-lat-hinh';
    const state = gameStates.get(id);
    if (!state) return;
    setGameGateState(state.iframe, true);
    sendAudio(state.iframe, state.userMuted || !state.inView);
  });

  // Game fullscreen controls.
  // iPhone Safari does not always expose Element.requestFullscreen, so mobile
  // gets a fixed-viewport fallback that behaves like fullscreen.
  function setMobileGameExpanded(game, button, expanded) {
    if (!game || !button) return;

    game.classList.toggle('is-mobile-expanded', expanded);
    document.documentElement.classList.toggle('game-mobile-open', expanded);
    document.body.classList.toggle('game-mobile-open', expanded);

    button.classList.toggle('is-active', expanded);
    button.title = expanded ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    button.setAttribute(
      'aria-label',
      expanded ? 'Thoát chế độ toàn màn hình' : 'Mở trò chơi toàn màn hình'
    );
  }

  document.querySelectorAll('[data-game-fullscreen]').forEach((button) => {
    button.addEventListener('click', async () => {
      const iframe = document.getElementById(button.dataset.gameFullscreen);
      const game = iframe?.closest('.one-project-game');
      if (!game) return;

      startDeferredGame(iframe);

      if (game.classList.contains('is-mobile-expanded')) {
        setMobileGameExpanded(game, button, false);
        return;
      }

      try {
        if (document.fullscreenElement === game) {
          await document.exitFullscreen();
          return;
        }

        const fullscreenTarget =
          (document.fullscreenEnabled && game.requestFullscreen && game) ||
          (document.fullscreenEnabled && iframe?.requestFullscreen && iframe) ||
          null;

        if (fullscreenTarget) {
          await fullscreenTarget.requestFullscreen();
          return;
        }

        setMobileGameExpanded(game, button, true);
      } catch (error) {
        console.warn('Native fullscreen unavailable, using mobile fallback:', error);
        setMobileGameExpanded(game, button, true);
      }
    });
  });

  document.addEventListener('fullscreenchange', () => {
    document.querySelectorAll('[data-game-fullscreen]').forEach((button) => {
      const iframe = document.getElementById(button.dataset.gameFullscreen);
      const game = iframe?.closest('.one-project-game');
      const nativeActive = Boolean(
        game &&
        (
          document.fullscreenElement === game ||
          document.fullscreenElement === iframe
        )
      );
      const fallbackActive = Boolean(game?.classList.contains('is-mobile-expanded'));
      const active = nativeActive || fallbackActive;

      if (!active) {
        document.documentElement.classList.remove('game-mobile-open');
        document.body.classList.remove('game-mobile-open');
      }

      button.classList.toggle('is-active', active);
      button.title = active ? 'Thoát toàn màn hình' : 'Toàn màn hình';
      button.setAttribute(
        'aria-label',
        active ? 'Thoát chế độ toàn màn hình' : 'Mở trò chơi toàn màn hình'
      );
    });
  });


  // Project gallery / lightbox.
  let galleryLightbox = null;
  let galleryImages = [];
  let galleryIndex = 0;

  function ensureGalleryLightbox() {
    if (galleryLightbox) return galleryLightbox;

    const modal = document.createElement('div');
    modal.className = 'project-gallery-lightbox';
    modal.hidden = true;
    modal.innerHTML = `
      <button class="project-gallery-lightbox-close" type="button" aria-label="Đóng">×</button>
      <button class="project-gallery-lightbox-prev" type="button" aria-label="Ảnh trước">‹</button>
      <div class="project-gallery-lightbox-stage">
        <img alt="">
        <span class="project-gallery-lightbox-count"></span>
      </div>
      <button class="project-gallery-lightbox-next" type="button" aria-label="Ảnh tiếp theo">›</button>
    `;

    document.body.appendChild(modal);

    const close = () => {
      modal.hidden = true;
      document.body.style.removeProperty('overflow');
    };

    const show = (nextIndex) => {
      if (!galleryImages.length) return;
      galleryIndex = (nextIndex + galleryImages.length) % galleryImages.length;

      const source = galleryImages[galleryIndex];
      const image = modal.querySelector('.project-gallery-lightbox-stage img');
      const count = modal.querySelector('.project-gallery-lightbox-count');

      image.src = source.src;
      image.alt = source.alt || 'Hình ảnh dự án';
      count.textContent = (galleryIndex + 1) + ' / ' + galleryImages.length;
    };

    modal.querySelector('.project-gallery-lightbox-close').addEventListener('click', close);
    modal.querySelector('.project-gallery-lightbox-prev').addEventListener('click', () => show(galleryIndex - 1));
    modal.querySelector('.project-gallery-lightbox-next').addEventListener('click', () => show(galleryIndex + 1));

    const galleryStage = modal.querySelector('.project-gallery-lightbox-stage');
    let touchStartX = 0;
    let touchStartY = 0;

    galleryStage?.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    galleryStage?.addEventListener('touchend', (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
      show(dx < 0 ? galleryIndex + 1 : galleryIndex - 1);
    }, { passive: true });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    document.addEventListener('keydown', (event) => {
      if (modal.hidden) return;

      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(galleryIndex - 1);
      if (event.key === 'ArrowRight') show(galleryIndex + 1);
    });

    modal.openGallery = (images, index) => {
      galleryImages = images;
      galleryIndex = index;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      show(index);
    };

    galleryLightbox = modal;
    return modal;
  }

  document.addEventListener('click', (event) => {
    const item = event.target.closest?.('.project-gallery-item');
    if (!item) return;

    const gallery = item.closest('[data-project-gallery]');
    if (!gallery) return;

    const images = [...gallery.querySelectorAll('.project-gallery-item img')];
    const clickedImage = item.querySelector('img');
    const index = Math.max(0, images.indexOf(clickedImage));

    event.preventDefault();
    ensureGalleryLightbox().openGallery(images, index);
  });

})();
