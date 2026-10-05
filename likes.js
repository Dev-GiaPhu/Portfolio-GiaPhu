(() => {
  const button = document.querySelector('#portfolio-like');
  const countEl = document.querySelector('#portfolio-like-count');
  if (!button || !countEl) return;

  const url = window.PORTFOLIO_SUPABASE_URL || '';
  const key = window.PORTFOLIO_SUPABASE_ANON_KEY || '';
  const supabaseLib = window.supabase;

  if (!url || !key || !supabaseLib) {
    button.disabled = true;
    button.title = 'Tính năng tim chưa được kết nối cơ sở dữ liệu.';
    countEl.textContent = '—';
    return;
  }

  const client = supabaseLib.createClient(url, key);
  let user = null;
  let liked = false;
  let authPanel = null;
  let initialStatePromise = null;

  function oauthRedirect() {
    return window.location.href.split('#')[0];
  }

  function closeAuthPanel() {
    authPanel?.remove();
    authPanel = null;
  }

  function createAuthPanel() {
    closeAuthPanel();

    const panel = document.createElement('div');
    panel.className = 'like-auth-panel';
    panel.innerHTML = `
      <div class="like-auth-card" role="dialog" aria-modal="true" aria-label="Đăng nhập để thả tim">
        <button class="like-auth-close" type="button" aria-label="Đóng">×</button>
        <p class="like-auth-eyebrow">THẢ TIM CHO PORTFOLIO</p>
        <strong>Đăng nhập để tiếp tục</strong>
        <span>Chọn tài khoản bạn muốn sử dụng.</span>

        <div class="like-auth-options">
          <button type="button" data-like-provider="google">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.6 12.23c0-.71-.06-1.24-.2-1.79H12v3.39h5.52a4.72 4.72 0 0 1-2.05 3.1l-.02.11 2.98 2.31.21.02c1.92-1.77 2.96-4.38 2.96-7.14Z"/>
              <path d="M12 22c2.7 0 4.97-.89 6.63-2.42l-3.17-2.45c-.85.57-1.99.97-3.46.97-2.6 0-4.8-1.76-5.59-4.19l-.11.01-3.1 2.4-.04.1A10 10 0 0 0 12 22Z"/>
              <path d="M6.41 13.91A6.02 6.02 0 0 1 6.1 12c0-.66.11-1.3.3-1.91l-.01-.13-3.14-2.44-.1.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.49l3.33-2.58Z"/>
              <path d="M12 5.9c1.88 0 3.15.81 3.88 1.49l2.82-2.75C16.98 3.03 14.7 2 12 2a10 10 0 0 0-8.85 5.58l3.25 2.52C7.2 7.66 9.4 5.9 12 5.9Z"/>
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          <button type="button" data-like-provider="github">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.36-3.9-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.2-3.12-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.17 1.19A11 11 0 0 1 12 6.06c.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.78.11 3.08.75.82 1.2 1.85 1.2 3.12 0 4.46-2.71 5.44-5.29 5.73.42.36.79 1.06.79 2.14v3.21c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/>
            </svg>
            <span>Tiếp tục với GitHub</span>
          </button>
        </div>

        <small class="like-auth-message" aria-live="polite"></small>
      </div>
    `;

    document.body.appendChild(panel);
    authPanel = panel;

    panel.querySelector('.like-auth-close')?.addEventListener('click', closeAuthPanel);
    panel.addEventListener('click', (event) => {
      if (event.target === panel) closeAuthPanel();
    });

    panel.querySelectorAll('[data-like-provider]').forEach((providerButton) => {
      providerButton.addEventListener('click', async () => {
        const provider = providerButton.dataset.likeProvider;
        const message = panel.querySelector('.like-auth-message');

        panel.querySelectorAll('[data-like-provider]').forEach((item) => {
          item.disabled = true;
        });

        if (message) {
          message.textContent =
            provider === 'google'
              ? 'Đang mở đăng nhập Google...'
              : 'Đang mở đăng nhập GitHub...';
        }

        const { error } = await client.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: oauthRedirect()
          }
        });

        if (error) {
          panel.querySelectorAll('[data-like-provider]').forEach((item) => {
            item.disabled = false;
          });
          if (message) message.textContent = 'Không thể đăng nhập: ' + error.message;
        }
      });
    });

    window.addEventListener('keydown', function onEscape(event) {
      if (event.key !== 'Escape' || !authPanel) return;
      closeAuthPanel();
      window.removeEventListener('keydown', onEscape);
    });
  }

  async function refreshCount() {
    const { count, error } = await client
      .from('portfolio_likes')
      .select('*', { count: 'exact', head: true });

    if (!error && Number.isFinite(count)) {
      countEl.textContent = String(count);
    }
  }

  async function refreshUserState() {
    const { data } = await client.auth.getUser();
    user = data?.user || null;

    if (!user) {
      liked = false;
      button.setAttribute('aria-pressed', 'false');
      button.querySelector('.like-heart').textContent = '♡';
      return;
    }

    const { data: row } = await client
      .from('portfolio_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    liked = Boolean(row);
    button.setAttribute('aria-pressed', String(liked));
    button.querySelector('.like-heart').textContent = liked ? '♥' : '♡';
  }

  async function ensureInitialState() {
    if (!initialStatePromise) {
      initialStatePromise = Promise.all([
        refreshUserState(),
        refreshCount()
      ]);
    }

    await initialStatePromise;
  }

  async function toggleLike() {
    await ensureInitialState();

    if (!user) {
      createAuthPanel();
      return;
    }

    button.disabled = true;

    try {
      if (liked) {
        const { error } = await client
          .from('portfolio_likes')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
        liked = false;
      } else {
        const { error } = await client
          .from('portfolio_likes')
          .insert({ user_id: user.id });

        if (error && error.code !== '23505') throw error;
        liked = true;
      }

      button.setAttribute('aria-pressed', String(liked));
      button.querySelector('.like-heart').textContent = liked ? '♥' : '♡';
      await refreshCount();
    } catch (error) {
      console.error('Không thể cập nhật lượt tim:', error);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', toggleLike);

  client.auth.onAuthStateChange(async () => {
    closeAuthPanel();
    await refreshUserState();
    await refreshCount();
  });

  const startInitialState = () => {
    ensureInitialState().finally(() => {
      button.disabled = false;
    });
  };

  requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(startInitialState, { timeout: 1200 });
    } else {
      setTimeout(startInitialState, 240);
    }
  });
})();
