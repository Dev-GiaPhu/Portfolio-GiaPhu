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

  async function refreshCount() {
    const { count, error } = await client
      .from('portfolio_likes')
      .select('*', { count: 'exact', head: true });
    if (!error && Number.isFinite(count)) countEl.textContent = String(count);
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

  async function signInWithGitHub() {
    const redirectTo = window.location.href.split('#')[0];
    await client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo }
    });
  }

  async function toggleLike() {
    button.disabled = true;
    try {
      if (!user) {
        await signInWithGitHub();
        return;
      }

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
    } catch (err) {
      console.error('Không thể cập nhật lượt tim:', err);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', toggleLike);

  client.auth.onAuthStateChange(async () => {
    await refreshUserState();
    await refreshCount();
  });

  Promise.all([refreshUserState(), refreshCount()]).finally(() => {
    button.disabled = false;
  });
})();
