(() => {
  const ADMIN_EMAIL = 'giaphufpt1@gmail.com';

  const gate = document.getElementById('loginGate');
  const adminShell = document.getElementById('adminShell');
  const githubLoginBtn = document.getElementById('githubLoginBtn');
  const loginMessage = document.getElementById('loginMessage');
  const frame = document.getElementById('previewFrame');
  const saveButton = document.getElementById('saveBtn');
  const undoButton = document.getElementById('undoBtn');
  const redoButton = document.getElementById('redoBtn');
  const logoutButton = document.getElementById('logoutBtn');
  const saveStatus = document.getElementById('saveStatus');

  const inspector = document.getElementById('inspector');
  const selectedLabel = document.getElementById('selectedLabel');
  const closeInspector = document.getElementById('closeInspector');
  const textTools = document.getElementById('textTools');
  const textValue = document.getElementById('textValue');
  const imageTools = document.getElementById('imageTools');
  const imageUrl = document.getElementById('imageUrl');
  const imageFile = document.getElementById('imageFile');
  const resetSelected = document.getElementById('resetSelected');

  if (!window.supabase) {
    loginMessage.textContent = 'Không tải được Supabase SDK.';
    return;
  }

  const client = window.supabase.createClient(
    window.PORTFOLIO_SUPABASE_URL,
    window.PORTFOLIO_SUPABASE_ANON_KEY
  );

  let sessionUser = null;
  let previewDocument = null;
  let selected = null;
  const focusBefore = new WeakMap();
  const dirty = new Map();
  const undoStack = [];
  const redoStack = [];

  const escapeCss = (value) => {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  };

  function setStatus(text, kind = '') {
    saveStatus.textContent = text;
    saveStatus.classList.remove('is-dirty', 'is-saved');
    if (kind) saveStatus.classList.add(kind);
  }

  function recordKey(selector, property) {
    return property + ':' + selector;
  }

  function selectorFor(element) {
    if (element.dataset.siteText) {
      return '[data-site-text="' + escapeCss(element.dataset.siteText) + '"]';
    }

    if (element.id) {
      return '#' + escapeCss(element.id);
    }

    const root = element.closest('[id]');
    const rootSelector = root ? '#' + escapeCss(root.id) : 'body';
    if (element === root) return rootSelector;

    const parts = [];
    let node = element;

    while (node && node !== root && node !== previewDocument.body) {
      const tag = node.tagName.toLowerCase();
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((item) => item.tagName === node.tagName)
        : [];
      const index = Math.max(1, siblings.indexOf(node) + 1);
      parts.unshift(tag + ':nth-of-type(' + index + ')');
      node = node.parentElement;
    }

    return rootSelector + (parts.length ? ' > ' + parts.join(' > ') : '');
  }

  function propertyFor(element) {
    return element.tagName === 'IMG' ? 'src' : 'innerHTML';
  }

  function valueFor(element, property = propertyFor(element)) {
    if (property === 'src') return element.getAttribute('src') || '';
    if (property === 'href') return element.getAttribute('href') || '';
    if (property === 'textContent') return element.textContent || '';
    return element.innerHTML;
  }

  function applyValue(selector, property, value) {
    if (!previewDocument) return;
    let elements = [];
    try {
      elements = [...previewDocument.querySelectorAll(selector)];
    } catch {
      return;
    }

    elements.forEach((element) => {
      if (property === 'src') element.setAttribute('src', value);
      else if (property === 'href') element.setAttribute('href', value);
      else if (property === 'textContent') element.textContent = value;
      else element.innerHTML = value;
    });

    if (selected && selectorFor(selected) === selector) {
      if (property === 'src') imageUrl.value = value;
      else textValue.value = value;
    }
  }

  function markDirty(selector, property, value) {
    dirty.set(recordKey(selector, property), {
      key: recordKey(selector, property),
      selector,
      property,
      value
    });
    setStatus('CÓ THAY ĐỔI · CTRL+S ĐỂ LƯU', 'is-dirty');
  }

  function pushChange(selector, property, before, after) {
    if (before === after) return;
    undoStack.push({ selector, property, before, after });
    redoStack.length = 0;
    markDirty(selector, property, after);
  }

  function commitElement(element) {
    if (!element || !focusBefore.has(element)) return;
    const before = focusBefore.get(element);
    focusBefore.delete(element);
    const property = propertyFor(element);
    const selector = selectorFor(element);
    const after = valueFor(element, property);
    pushChange(selector, property, before, after);
  }

  function commitActiveEdit() {
    const active = previewDocument?.activeElement;
    if (active?.matches?.('[data-admin-editable]')) commitElement(active);
  }

  function undo() {
    commitActiveEdit();
    const change = undoStack.pop();
    if (!change) return;
    applyValue(change.selector, change.property, change.before);
    redoStack.push(change);
    markDirty(change.selector, change.property, change.before);
  }

  function redo() {
    const change = redoStack.pop();
    if (!change) return;
    applyValue(change.selector, change.property, change.after);
    undoStack.push(change);
    markDirty(change.selector, change.property, change.after);
  }

  function selectElement(element) {
    selected = element;
    inspector.hidden = false;

    const property = propertyFor(element);
    const selector = selectorFor(element);
    selectedLabel.textContent = element.tagName.toLowerCase() + ' · ' + selector;

    if (property === 'src') {
      textTools.hidden = true;
      imageTools.hidden = false;
      imageUrl.value = valueFor(element, property);
    } else {
      imageTools.hidden = true;
      textTools.hidden = false;
      textValue.value = valueFor(element, property);
    }
  }

  function injectEditorStyles(doc) {
    const style = doc.createElement('style');
    style.dataset.adminStyle = 'true';
    style.textContent = `
      [data-admin-editable]{
        cursor:text!important;
        transition:outline-color .15s ease,background .15s ease!important;
      }
      [data-admin-editable]:hover{
        outline:1px dashed #8ff5d088!important;
        outline-offset:4px!important;
        background:#8ff5d008!important;
      }
      [data-admin-editable]:focus{
        outline:2px solid #8ff5d0!important;
        outline-offset:4px!important;
        background:#8ff5d00d!important;
      }
      img[data-admin-editable]{
        cursor:pointer!important;
      }

      .admin-project-image-handle{
        position:absolute!important;
        z-index:50!important;
        left:12px!important;
        bottom:12px!important;
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        width:auto!important;
        height:30px!important;
        padding:0 9px!important;
        border:1px solid #8ff5d055!important;
        border-radius:9px!important;
        background:#07110ee8!important;
        color:#8ff5d0!important;
        font:700 8px/1 'Space Mono',monospace!important;
        letter-spacing:.08em!important;
        cursor:pointer!important;
        opacity:1!important;
        transform:none!important;
      }

      .admin-project-image-handle:hover{
        background:#0b1a16!important;
        border-color:#8ff5d099!important;
      }
    `;
    doc.head.appendChild(style);
  }

  function preparePreview() {
    previewDocument = frame.contentDocument;
    if (!previewDocument) return;

    injectEditorStyles(previewDocument);

    const editableSelector = [
      'main h1',
      'main h2',
      'main h3',
      'main p',
      'main .console-label',
      'main .chip',
      'main .skill strong',
      'main .skill span',
      'footer span',
      'main img'
    ].join(',');

    previewDocument.querySelectorAll(editableSelector).forEach((element) => {
      element.dataset.adminEditable = 'true';

      if (element.tagName !== 'IMG') {
        element.contentEditable = 'true';
        element.spellcheck = false;
      }
    });

    previewDocument.querySelectorAll('[data-project-card-image]').forEach((image, index) => {
      const card = image.closest('.terminal-project-card');
      if (!card || card.querySelector('.admin-project-image-handle')) return;

      const handle = previewDocument.createElement('button');
      handle.type = 'button';
      handle.className = 'admin-project-image-handle';
      handle.textContent = 'ẢNH NỀN ' + String(index + 1).padStart(2, '0');
      handle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectElement(image);
      });

      card.appendChild(handle);
    });

    previewDocument.addEventListener('click', (event) => {
      const editable = event.target.closest?.('[data-admin-editable]');

      if (editable) {
        selectElement(editable);
        if (editable.tagName === 'IMG') {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      const link = event.target.closest?.('a');
      if (link) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    previewDocument.addEventListener('focusin', (event) => {
      const element = event.target.closest?.('[data-admin-editable]');
      if (!element || element.tagName === 'IMG') return;
      focusBefore.set(element, valueFor(element));
      selectElement(element);
    });

    previewDocument.addEventListener('input', (event) => {
      const element = event.target.closest?.('[data-admin-editable]');
      if (!element || element.tagName === 'IMG') return;
      const selector = selectorFor(element);
      const value = valueFor(element);
      markDirty(selector, 'innerHTML', value);
      if (selected === element) textValue.value = value;
    });

    previewDocument.addEventListener('focusout', (event) => {
      const element = event.target.closest?.('[data-admin-editable]');
      if (!element || element.tagName === 'IMG') return;
      commitElement(element);
    });

    previewDocument.addEventListener('keydown', handleShortcut, true);
  }

  async function saveAll() {
    commitActiveEdit();

    if (!sessionUser) return;
    if (!dirty.size) {
      setStatus('KHÔNG CÓ GÌ CẦN LƯU');
      return;
    }

    setStatus('ĐANG LƯU...');

    const now = new Date().toISOString();
    const rows = [...dirty.values()].map((item) => ({
      ...item,
      updated_at: now,
      updated_by: sessionUser.id
    }));

    const { error } = await client
      .from('portfolio_content')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      setStatus('LỖI LƯU');
      alert(
        'Không lưu được. Nếu đây là lần đầu dùng admin, hãy chạy admin/supabase-cms.sql trong Supabase SQL Editor.\n\n' +
        error.message
      );
      return;
    }

    dirty.clear();
    setStatus('ĐÃ LƯU', 'is-saved');
  }

  async function uploadImage(file) {
    if (!selected || selected.tagName !== 'IMG' || !file) return;

    const selector = selectorFor(selected);
    const before = valueFor(selected, 'src');
    const safeName = file.name.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
    const path = Date.now() + '-' + safeName;

    setStatus('ĐANG UPLOAD ẢNH...');

    const { error } = await client.storage
      .from('portfolio-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      setStatus('LỖI UPLOAD');
      alert(
        'Không upload được ảnh. Hãy kiểm tra admin/supabase-cms.sql đã được chạy chưa.\n\n' +
        error.message
      );
      return;
    }

    const { data } = client.storage.from('portfolio-media').getPublicUrl(path);
    const url = data.publicUrl;

    applyValue(selector, 'src', url);
    pushChange(selector, 'src', before, url);
    imageUrl.value = url;
  }

  async function resetCurrent() {
    if (!selected) return;

    const selector = selectorFor(selected);
    const property = propertyFor(selected);
    const key = recordKey(selector, property);

    const { error } = await client
      .from('portfolio_content')
      .delete()
      .eq('key', key);

    if (error) {
      alert(error.message);
      return;
    }

    dirty.delete(key);
    setStatus('ĐÃ KHÔI PHỤC · ĐANG TẢI LẠI', 'is-saved');
    frame.contentWindow.location.reload();
    inspector.hidden = true;
  }

  function handleShortcut(event) {
    const command = event.ctrlKey || event.metaKey;
    if (!command) return;

    const key = event.key.toLowerCase();

    if (key === 's') {
      event.preventDefault();
      saveAll();
      return;
    }

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      redo();
      return;
    }

    if (key === 'z') {
      event.preventDefault();
      undo();
    }
  }

  textValue.addEventListener('focus', () => {
    if (!selected || selected.tagName === 'IMG') return;
    textValue.dataset.before = valueFor(selected);
  });

  textValue.addEventListener('input', () => {
    if (!selected || selected.tagName === 'IMG') return;
    const selector = selectorFor(selected);
    applyValue(selector, 'innerHTML', textValue.value);
    markDirty(selector, 'innerHTML', textValue.value);
  });

  textValue.addEventListener('change', () => {
    if (!selected || selected.tagName === 'IMG') return;
    const selector = selectorFor(selected);
    const before = textValue.dataset.before ?? '';
    const after = textValue.value;
    pushChange(selector, 'innerHTML', before, after);
    textValue.dataset.before = after;
  });

  imageUrl.addEventListener('focus', () => {
    if (!selected || selected.tagName !== 'IMG') return;
    imageUrl.dataset.before = valueFor(selected, 'src');
  });

  imageUrl.addEventListener('change', () => {
    if (!selected || selected.tagName !== 'IMG') return;
    const selector = selectorFor(selected);
    const before = imageUrl.dataset.before ?? valueFor(selected, 'src');
    const after = imageUrl.value.trim();
    applyValue(selector, 'src', after);
    pushChange(selector, 'src', before, after);
    imageUrl.dataset.before = after;
  });

  imageFile.addEventListener('change', () => {
    const file = imageFile.files?.[0];
    if (file) uploadImage(file);
    imageFile.value = '';
  });

  saveButton.addEventListener('click', saveAll);
  undoButton.addEventListener('click', undo);
  redoButton.addEventListener('click', redo);
  resetSelected.addEventListener('click', resetCurrent);
  closeInspector.addEventListener('click', () => {
    inspector.hidden = true;
    selected = null;
  });

  logoutButton.addEventListener('click', async () => {
    await client.auth.signOut();
    location.reload();
  });

  window.addEventListener('keydown', handleShortcut, true);

  frame.addEventListener('load', () => {
    if (sessionUser && frame.src !== 'about:blank') preparePreview();
  });

  function loadEditor() {
    gate.hidden = true;
    adminShell.hidden = false;

    const previewSrc = frame.dataset.src || '../index.html?admin-preview=1';
    if (frame.getAttribute('src') === 'about:blank') {
      frame.setAttribute('src', previewSrc);
    } else {
      preparePreview();
    }
  }

  function showLogin(message = '') {
    sessionUser = null;
    adminShell.hidden = true;
    gate.hidden = false;
    if (message) loginMessage.textContent = message;
  }

  githubLoginBtn.addEventListener('click', async () => {
    loginMessage.textContent = 'Đang chuyển sang GitHub...';

    const redirectTo =
      window.location.origin +
      window.location.pathname;

    const { error } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
        skipBrowserRedirect: false
      }
    });

    if (error) {
      loginMessage.textContent = 'Không thể mở đăng nhập GitHub: ' + error.message;
    }
  });

  client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;
    if (!user) return;

    if (user.email?.toLowerCase() === ADMIN_EMAIL) {
      sessionUser = user;
      loadEditor();
      return;
    }

    client.auth.signOut().finally(() => {
      showLogin('Tài khoản này không có quyền admin.');
    });
  });

  async function init() {
    adminShell.hidden = true;
    gate.hidden = false;

    const params = new URLSearchParams(window.location.search);
    const oauthError =
      params.get('error_description') ||
      params.get('error');

    if (oauthError) {
      loginMessage.textContent = decodeURIComponent(oauthError);
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      showLogin('Không đọc được phiên đăng nhập: ' + error.message);
      return;
    }

    const user = data.session?.user || null;

    if (!user) {
      showLogin();
      return;
    }

    if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await client.auth.signOut();
      showLogin('Tài khoản này không có quyền admin.');
      return;
    }

    sessionUser = user;
    loadEditor();
  }

  init();
})();
