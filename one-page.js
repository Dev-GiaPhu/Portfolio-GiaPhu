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
