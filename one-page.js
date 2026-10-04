(() => {
  const rail = document.querySelector('[data-scroll-rail]');
  const track = document.querySelector('[data-rail-track]');
  const thumb = document.querySelector('[data-scroll-thumb]');
  const links = [...document.querySelectorAll('[data-rail-link]')];
  const railNav = rail?.querySelector('.rail-nav');
  const liquidSvg = rail?.querySelector('[data-rail-liquid-svg]');
  const waterColumn = rail?.querySelector('[data-rail-water-column]');
  const waterLobe = rail?.querySelector('[data-rail-water-lobe]');
  const waterBridge = rail?.querySelector('[data-rail-water-bridge]');
  const waterNeckTop = rail?.querySelector('[data-rail-water-neck-top]');
  const waterNeckBottom = rail?.querySelector('[data-rail-water-neck-bottom]');
  const waterHighlight = rail?.querySelector('[data-rail-water-highlight]');
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
      scrollToTarget(target);
      history.replaceState(null, '', selector);
    });
  });

  let waterCurrentY = null;
  let waterTargetY = null;
  let waterCurrentWidth = null;
  let waterTargetWidth = null;
  let waterFrame = null;

  function renderLiquidRail() {
    waterFrame = null;

    if (
      !liquidSvg ||
      !waterColumn ||
      !waterLobe ||
      !waterBridge ||
      !waterNeckTop ||
      !waterNeckBottom ||
      waterTargetY == null ||
      waterTargetWidth == null
    ) {
      return;
    }

    if (waterCurrentY == null) waterCurrentY = waterTargetY;
    if (waterCurrentWidth == null) waterCurrentWidth = waterTargetWidth;

    waterCurrentY += (waterTargetY - waterCurrentY) * 0.18;
    waterCurrentWidth += (waterTargetWidth - waterCurrentWidth) * 0.16;

    const height = Math.max(
      1,
      rail?.offsetHeight ||
      railNav?.offsetHeight ||
      220
    );

    liquidSvg.setAttribute('viewBox', `0 0 190 ${height}`);
    waterColumn.setAttribute('height', String(height));

    const compact = window.matchMedia('(max-width: 900px)').matches;
    const rightEdge = compact ? 158 : 160;
    const rx = Math.max(38, waterCurrentWidth / 2);
    const centerX = rightEdge - rx;
    const centerY = clamp(waterCurrentY, 24, height - 24);
    const lobeRy = compact ? 20 : 23;

    waterLobe.setAttribute('cx', centerX.toFixed(2));
    waterLobe.setAttribute('cy', centerY.toFixed(2));
    waterLobe.setAttribute('rx', rx.toFixed(2));
    waterLobe.setAttribute('ry', String(lobeRy));

    // The bridge and two neck metaballs overlap both the active lobe and
    // the vertical body. The shared goo filter fuses them into one liquid mass.
    waterBridge.setAttribute('cx', compact ? '138' : '140');
    waterBridge.setAttribute('cy', centerY.toFixed(2));
    waterBridge.setAttribute('r', compact ? '20' : '22');

    waterNeckTop.setAttribute('cx', compact ? '145' : '147');
    waterNeckTop.setAttribute('cy', (centerY - 12).toFixed(2));
    waterNeckTop.setAttribute('r', compact ? '16' : '18');

    waterNeckBottom.setAttribute('cx', compact ? '145' : '147');
    waterNeckBottom.setAttribute('cy', (centerY + 12).toFixed(2));
    waterNeckBottom.setAttribute('r', compact ? '16' : '18');

    if (waterHighlight) {
      waterHighlight.setAttribute(
        'cx',
        (centerX - rx * 0.18).toFixed(2)
      );
      waterHighlight.setAttribute(
        'cy',
        (centerY - lobeRy * 0.42).toFixed(2)
      );
      waterHighlight.setAttribute(
        'rx',
        Math.max(14, rx * 0.38).toFixed(2)
      );
      waterHighlight.setAttribute(
        'ry',
        compact ? '4.5' : '5.5'
      );
    }

    const moving =
      Math.abs(waterTargetY - waterCurrentY) > 0.25 ||
      Math.abs(waterTargetWidth - waterCurrentWidth) > 0.25;

    if (moving) {
      waterFrame = requestAnimationFrame(renderLiquidRail);
    } else {
      waterCurrentY = waterTargetY;
      waterCurrentWidth = waterTargetWidth;
    }
  }

  function syncLiquidRail(activeLink) {
    if (!liquidSvg || !railNav || !activeLink) return;

    const label = activeLink.querySelector('span');
    const labelWidth = label?.scrollWidth || 52;
    const compact = window.matchMedia('(max-width: 900px)').matches;

    waterTargetWidth = clamp(
      labelWidth + (compact ? 64 : 74),
      compact ? 94 : 108,
      compact ? 132 : 150
    );

    waterTargetY =
      railNav.offsetTop +
      activeLink.offsetTop +
      activeLink.offsetHeight / 2;

    if (!waterFrame) {
      waterFrame = requestAnimationFrame(renderLiquidRail);
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

    syncLiquidRail(activeLink);
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
    sendAudio(state.iframe, state.userMuted || !state.inView);
  });

  // Game fullscreen controls.
  document.querySelectorAll('[data-game-fullscreen]').forEach((button) => {
    button.addEventListener('click', async () => {
      const iframe = document.getElementById(button.dataset.gameFullscreen);
      const game = iframe?.closest('.one-project-game');
      if (!game) return;

      try {
        if (document.fullscreenElement === game) {
          await document.exitFullscreen();
          return;
        }

        if (game.requestFullscreen) {
          await game.requestFullscreen();
        } else if (iframe?.requestFullscreen) {
          await iframe.requestFullscreen();
        }
      } catch (error) {
        console.error('Không thể mở toàn màn hình:', error);
      }
    });
  });

  document.addEventListener('fullscreenchange', () => {
    document.querySelectorAll('[data-game-fullscreen]').forEach((button) => {
      const iframe = document.getElementById(button.dataset.gameFullscreen);
      const game = iframe?.closest('.one-project-game');
      const active = Boolean(game && document.fullscreenElement === game);
      button.classList.toggle('is-active', active);
      button.title = active ? 'Thoát toàn màn hình' : 'Toàn màn hình';
      button.setAttribute(
        'aria-label',
        active ? 'Thoát chế độ toàn màn hình' : 'Mở trò chơi toàn màn hình'
      );
    });
  });

})();
