(() => {
  const ADMIN_EMAIL = 'giaphufpt1@gmail.com';
  const ADMIN_GITHUB_LOGIN = 'dev-giaphu';

  const gate = document.getElementById('loginGate');
  const adminShell = document.getElementById('adminShell');
  const githubLoginBtn = document.getElementById('githubLoginBtn');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const clearSessionBtn = document.getElementById('clearSessionBtn');
  const currentSessionInfo = document.getElementById('currentSessionInfo');
  const loginMessage = document.getElementById('loginMessage');
  const frame = document.getElementById('previewFrame');

  const saveButton = document.getElementById('saveBtn');
  const undoButton = document.getElementById('undoBtn');
  const redoButton = document.getElementById('redoBtn');
  const logoutButton = document.getElementById('logoutBtn');
  const saveStatus = document.getElementById('saveStatus');

  const inspector = document.getElementById('inspector');
  const inspectorDragHandle = document.getElementById('inspectorDragHandle');
  const editorStage = frame.parentElement;
  const selectedLabel = document.getElementById('selectedLabel');
  const closeInspector = document.getElementById('closeInspector');

  const textTools = document.getElementById('textTools');
  const textValue = document.getElementById('textValue');
  const imageTools = document.getElementById('imageTools');
  const imageUrl = document.getElementById('imageUrl');
  const imageFile = document.getElementById('imageFile');

  const layoutTools = document.getElementById('layoutTools');
  const boxWidth = document.getElementById('boxWidth');
  const boxMinHeight = document.getElementById('boxMinHeight');
  const boxPadding = document.getElementById('boxPadding');
  const boxRadius = document.getElementById('boxRadius');
  const textSize = document.getElementById('textSize');
  const textColor = document.getElementById('textColor');
  const boxColor = document.getElementById('boxColor');
  const borderColor = document.getElementById('borderColor');

  const tagTools = document.getElementById('tagTools');
  const tagList = document.getElementById('tagList');
  const tagInput = document.getElementById('tagInput');
  const addTagBtn = document.getElementById('addTagBtn');

  const themeBg = document.getElementById('themeBg');
  const themeMint = document.getElementById('themeMint');
  const themeBlue = document.getElementById('themeBlue');

  const structureTools = document.getElementById('structureTools');
  const duplicateBoxBtn = document.getElementById('duplicateBoxBtn');
  const deleteBoxBtn = document.getElementById('deleteBoxBtn');
  const resetSelected = document.getElementById('resetSelected');

  if (!window.supabase) {
    loginMessage.textContent = 'Không tải được Supabase SDK.';
    return;
  }

  const client = window.supabase.createClient(
    window.PORTFOLIO_SUPABASE_URL,
    window.PORTFOLIO_SUPABASE_ANON_KEY
  );

  const TEXT_SELECTOR = [
    'main h1','main h2','main h3','main h4','main h5','main h6',
    'main p','main span','main strong','main small','main a','main li','main summary',
    '.rail-nav span','.project-terminal-link','.btn',
    '.contact-line span','.contact-line strong',
    'footer span'
  ].join(',');

  const BOX_SELECTOR = [
    '.panel','.skill-card','.terminal-project-card','.contact-line',
    '.skill-story','.one-project-game','.hero-terminal-card',
    '.project-info-accordion','.project-info-content','.project-info-grid > div',
    '.education-card','.education-stat','.education-program',
    '.education-head','.education-card-top',
    '.activity-card','.activities-head',
    '.section-head','.contact-compact-head'
  ].join(',');

  let sessionUser = null;
  let previewDocument = null;
  let selected = null;
  let listenersBound = false;
  let editorLoaded = false;
  let editorLoading = false;

  const focusBefore = new WeakMap();
  const dirty = new Map();
  const undoStack = [];
  const redoStack = [];

  const escapeCss = (value) => {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  };

  function authIdentity(user) {
    const metadata = user?.user_metadata || {};
    return {
      email: String(user?.email || metadata.email || '').toLowerCase(),
      githubLogin: String(
        metadata.user_name ||
        metadata.preferred_username ||
        metadata.login ||
        ''
      ).toLowerCase()
    };
  }

  function isAllowedAdmin(user) {
    const identity = authIdentity(user);
    return (
      identity.email === ADMIN_EMAIL ||
      identity.githubLogin === ADMIN_GITHUB_LOGIN
    );
  }

  function describeSession(user) {
    if (!user) {
      currentSessionInfo.hidden = true;
      currentSessionInfo.textContent = '';
      return;
    }

    const identity = authIdentity(user);
    const provider =
      user.app_metadata?.provider ||
      user.identities?.[0]?.provider ||
      'oauth';

    currentSessionInfo.hidden = false;
    currentSessionInfo.textContent =
      'Phiên hiện tại: ' +
      (identity.githubLogin ? '@' + identity.githubLogin : identity.email || 'không rõ tài khoản') +
      ' · ' +
      provider;
  }

  async function startOAuth(provider) {
    loginMessage.textContent =
      provider === 'google'
        ? 'Đang chuyển sang Google...'
        : 'Đang chuyển sang GitHub...';

    const options = {
      redirectTo: window.location.origin + window.location.pathname
    };

    if (provider === 'google') {
      options.queryParams = { prompt: 'select_account' };
    }

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options
    });

    if (error) {
      loginMessage.textContent =
        'Không thể đăng nhập bằng ' +
        (provider === 'google' ? 'Google' : 'GitHub') +
        ': ' +
        error.message;
    }
  }

  function setStatus(text, kind = '') {
    saveStatus.textContent = text;
    saveStatus.classList.remove('is-dirty', 'is-saved');
    if (kind) saveStatus.classList.add(kind);
  }

  function recordKey(selector, property) {
    return property + ':' + selector;
  }

  const INSPECTOR_POSITION_KEY = 'portfolio-admin-inspector-position-v1';

  function clampInspectorPosition(left, top) {
    const margin = 8;
    const width = inspector.offsetWidth || 350;
    const height = inspector.offsetHeight || 420;
    const maxLeft = Math.max(margin, editorStage.clientWidth - width - margin);
    const maxTop = Math.max(margin, editorStage.clientHeight - height - margin);

    return {
      left: Math.min(maxLeft, Math.max(margin, Number(left) || margin)),
      top: Math.min(maxTop, Math.max(margin, Number(top) || margin))
    };
  }

  function setInspectorPosition(left, top, persist = false) {
    const position = clampInspectorPosition(left, top);

    inspector.style.setProperty('left', position.left + 'px', 'important');
    inspector.style.setProperty('right', 'auto', 'important');
    inspector.style.setProperty('top', position.top + 'px', 'important');

    if (persist) {
      try {
        localStorage.setItem(
          INSPECTOR_POSITION_KEY,
          JSON.stringify(position)
        );
      } catch {}
    }
  }

  function restoreInspectorPosition() {
    let position = { left: 18, top: 18 };

    try {
      const saved = JSON.parse(
        localStorage.getItem(INSPECTOR_POSITION_KEY) || 'null'
      );

      if (
        saved &&
        Number.isFinite(saved.left) &&
        Number.isFinite(saved.top)
      ) {
        position = saved;
      }
    } catch {}

    setInspectorPosition(position.left, position.top);
  }

  function avoidInspectorOverlap(element) {
    if (!element || inspector.hidden) return;

    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const panel = {
        left: inspector.offsetLeft,
        top: inspector.offsetTop,
        right: inspector.offsetLeft + inspector.offsetWidth,
        bottom: inspector.offsetTop + inspector.offsetHeight
      };

      const gap = 18;
      const target = {
        left: rect.left - gap,
        top: rect.top - gap,
        right: rect.right + gap,
        bottom: rect.bottom + gap
      };

      const overlaps = !(
        panel.right < target.left ||
        panel.left > target.right ||
        panel.bottom < target.top ||
        panel.top > target.bottom
      );

      if (!overlaps) return;

      const stageWidth = editorStage.clientWidth;
      const stageHeight = editorStage.clientHeight;
      const panelWidth = inspector.offsetWidth;
      const panelHeight = inspector.offsetHeight;

      let nextLeft =
        rect.left + rect.width / 2 < stageWidth / 2
          ? stageWidth - panelWidth - 18
          : 18;

      let nextTop = inspector.offsetTop;

      const horizontalStillOverlaps = !(
        nextLeft + panelWidth < target.left ||
        nextLeft > target.right
      );

      if (horizontalStillOverlaps) {
        nextTop =
          rect.top + rect.height / 2 < stageHeight / 2
            ? stageHeight - panelHeight - 18
            : 18;
      }

      setInspectorPosition(nextLeft, nextTop);
    });
  }

  function structuralSelector(element) {
    if (!element) return 'body';
    if (element.id) return '#' + escapeCss(element.id);
    if (element.dataset.cmsNode) {
      return '[data-cms-node="' + escapeCss(element.dataset.cmsNode) + '"]';
    }

    const root = element.closest('[id]');
    const rootSelector = root ? '#' + escapeCss(root.id) : 'body';
    if (element === root) return rootSelector;

    const parts = [];
    let node = element;

    while (node && node !== root && node !== previewDocument.body) {
      if (node.dataset.cmsNode) {
        parts.unshift('[data-cms-node="' + escapeCss(node.dataset.cmsNode) + '"]');
        break;
      }

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

  function contentSelector(element) {
    if (element?.dataset.siteText) {
      return '[data-site-text="' + escapeCss(element.dataset.siteText) + '"]';
    }
    return structuralSelector(element);
  }

  function propertyFor(element) {
    return element?.tagName === 'IMG' ? 'src' : 'innerHTML';
  }

  function valueFor(element, property = propertyFor(element)) {
    if (!element) return '';
    if (property === 'src') return element.getAttribute('src') || '';
    if (property === 'href') return element.getAttribute('href') || '';
    if (property === 'textContent') return element.textContent || '';
    if (property === 'style') return element.getAttribute('style') || '';
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
      else if (property === 'style') element.setAttribute('style', value);
      else element.innerHTML = value;
    });

    if (property === 'innerHTML') decoratePreviewContent();

    if (selected) {
      const selectedSelector =
        property === 'style'
          ? structuralSelector(selected)
          : contentSelector(selected);

      if (selectedSelector === selector) {
        if (property === 'src') imageUrl.value = value;
        else if (property === 'innerHTML') textValue.value = value;
        populateLayoutControls(selected);
      }
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
    const selector = contentSelector(element);
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

  function rgbToHex(value, fallback = '#000000') {
    if (!value) return fallback;
    if (value.startsWith('#')) return value.slice(0, 7);

    const numbers = value.match(/[\d.]+/g);
    if (!numbers || numbers.length < 3) return fallback;

    const hex = numbers.slice(0, 3)
      .map((item) => Math.max(0, Math.min(255, Math.round(Number(item)))))
      .map((item) => item.toString(16).padStart(2, '0'))
      .join('');

    return '#' + hex;
  }

  function populateLayoutControls(element) {
    if (!element || !previewDocument) return;
    const computed = previewDocument.defaultView.getComputedStyle(element);

    boxWidth.value = element.style.width || '';
    boxMinHeight.value = element.style.minHeight || '';
    boxPadding.value = element.style.padding || '';
    boxRadius.value = element.style.borderRadius || '';
    textSize.value = element.style.fontSize || '';

    textColor.value = rgbToHex(computed.color, '#f3f7f4');
    boxColor.value = rgbToHex(computed.backgroundColor, '#0f141d');
    borderColor.value = rgbToHex(computed.borderTopColor, '#20252d');
  }

  function renderTags(context) {
    const stack =
      context?.matches?.('.stack-list')
        ? context
        : context?.querySelector?.('.stack-list') ||
          context?.closest?.('.project-info-content')?.querySelector('.stack-list') ||
          context?.closest?.('.terminal-project-card')?.querySelector('.stack-list');

    if (!stack) {
      tagTools.hidden = true;
      tagList.innerHTML = '';
      return;
    }

    tagTools.hidden = false;
    tagList.innerHTML = '';

    [...stack.querySelectorAll('.chip')].forEach((chip) => {
      const item = document.createElement('span');
      item.className = 'tag-editor-item';

      const label = document.createElement('span');
      label.textContent = chip.textContent.trim();

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Xóa tag';
      remove.addEventListener('click', () => {
        const selector = structuralSelector(stack);
        const before = stack.innerHTML;
        chip.remove();
        const after = stack.innerHTML;
        pushChange(selector, 'innerHTML', before, after);
        renderTags(stack);
      });

      item.append(label, remove);
      tagList.appendChild(item);
    });
  }

  function selectElement(element) {
    if (!element || element.closest?.('.admin-project-image-handle')) return;

    selected = element;
    inspector.hidden = false;

    if (!inspector.dataset.positionReady) {
      restoreInspectorPosition();
      inspector.dataset.positionReady = 'true';
    }

    const property = propertyFor(element);
    const selector = structuralSelector(element);
    selectedLabel.textContent = element.tagName.toLowerCase() + ' · ' + selector;

    if (property === 'src') {
      textTools.hidden = true;
      imageTools.hidden = false;
      imageUrl.value = valueFor(element, 'src');
    } else if (element.matches(TEXT_SELECTOR)) {
      imageTools.hidden = true;
      textTools.hidden = false;
      textValue.value = valueFor(element, 'innerHTML');
    } else {
      textTools.hidden = true;
      imageTools.hidden = true;
    }

    layoutTools.hidden = false;
    populateLayoutControls(element);

    const box = element.matches(BOX_SELECTOR) ? element : element.closest(BOX_SELECTOR);
    structureTools.hidden = !box;
    renderTags(element);
    avoidInspectorOverlap(element);
  }

  function sanitizeClone(root) {
    const clone = root.cloneNode(true);

    clone.querySelectorAll('.admin-project-image-handle').forEach((node) => node.remove());
    clone.querySelectorAll('[data-admin-editable],[data-admin-box]').forEach((node) => {
      node.removeAttribute('data-admin-editable');
      node.removeAttribute('data-admin-box');
      node.removeAttribute('contenteditable');
      node.removeAttribute('spellcheck');
    });

    clone.removeAttribute('data-admin-editable');
    clone.removeAttribute('data-admin-box');
    clone.removeAttribute('contenteditable');
    clone.removeAttribute('spellcheck');

    if (clone.id) clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));

    return clone;
  }

  function cleanContainerHtml(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.admin-project-image-handle').forEach((node) => node.remove());
    clone.querySelectorAll('[data-admin-editable],[data-admin-box]').forEach((node) => {
      node.removeAttribute('data-admin-editable');
      node.removeAttribute('data-admin-box');
      node.removeAttribute('contenteditable');
      node.removeAttribute('spellcheck');
    });
    return clone.innerHTML;
  }

  function addProjectImageHandles() {
    const cardImages = [...previewDocument.querySelectorAll('[data-project-card-image]')];
    const detailImages = [...previewDocument.querySelectorAll('[data-project-detail-image]')];

    cardImages.forEach((image, index) => {
      const card = image.closest('.terminal-project-card');
      if (!card || card.querySelector('.admin-project-image-handle[data-image-kind="card"]')) return;

      const handle = previewDocument.createElement('button');
      handle.type = 'button';
      handle.className = 'admin-project-image-handle';
      handle.dataset.imageKind = 'card';
      handle.textContent = 'ẢNH NỀN ' + String(index + 1).padStart(2, '0');

      handle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectElement(image);
      });

      card.appendChild(handle);
    });

    detailImages.forEach((image, index) => {
      const media = image.closest('[data-project-detail-media]');
      if (!media || media.querySelector('.admin-project-image-handle[data-image-kind="detail"]')) return;

      const handle = previewDocument.createElement('button');
      handle.type = 'button';
      handle.className = 'admin-project-image-handle admin-project-detail-image-handle';
      handle.dataset.imageKind = 'detail';
      handle.textContent = 'ẢNH MÔ TẢ ' + String(index + 1).padStart(2, '0');

      handle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectElement(image);
      });

      media.appendChild(handle);
    });
  }

  function decoratePreviewContent() {
    if (!previewDocument) return;

    previewDocument.querySelectorAll('.project-info-accordion').forEach((details) => {
      details.open = true;
    });

    previewDocument.querySelectorAll(TEXT_SELECTOR).forEach((element) => {
      element.dataset.adminEditable = 'true';
      element.contentEditable = 'true';
      element.spellcheck = false;
    });

    previewDocument.querySelectorAll('main img').forEach((element) => {
      element.dataset.adminEditable = 'true';
    });

    previewDocument.querySelectorAll(BOX_SELECTOR).forEach((element) => {
      element.dataset.adminBox = 'true';
    });

    addProjectImageHandles();
  }

  function injectEditorStyles(doc) {
    if (doc.querySelector('[data-admin-style]')) return;

    const style = doc.createElement('style');
    style.dataset.adminStyle = 'true';
    style.textContent = `
      [data-admin-editable]{
        cursor:text!important;
        transition:outline-color .15s ease,background .15s ease!important;
      }
      [data-admin-editable]:hover{
        outline:1px dashed #8ff5d088!important;
        outline-offset:3px!important;
      }
      [data-admin-editable]:focus{
        outline:2px solid #8ff5d0!important;
        outline-offset:3px!important;
      }
      [data-admin-box]{
        cursor:default!important;
      }
      [data-admin-box]:hover{
        box-shadow:inset 0 0 0 1px #7ca7ff35!important;
      }
      img[data-admin-editable]{
        cursor:pointer!important;
      }
      [data-project-detail-media]{
        position:relative!important;
      }
      [data-project-detail-media] img[src^="data:image/gif"]{
        display:none!important;
      }
      [data-project-detail-media]:has(.admin-project-detail-image-handle){
        display:block!important;
        min-height:86px!important;
        border:1px dashed #8ff5d044!important;
        border-radius:14px!important;
        background:#07110e44!important;
      }
      .admin-project-image-handle{
        position:absolute!important;
        z-index:50!important;
        left:12px!important;
        bottom:12px!important;
        display:flex!important;
        align-items:center!important;
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
      .admin-project-detail-image-handle{
        left:50%!important;
        bottom:50%!important;
        transform:translate(-50%,50%)!important;
      }
    `;

    doc.head.appendChild(style);
  }

  function bindPreviewEvents() {
    if (listenersBound) return;
    listenersBound = true;

    previewDocument.addEventListener('click', (event) => {
      if (event.target.closest?.('.admin-project-image-handle')) return;

      const editable = event.target.closest?.('[data-admin-editable]');
      if (editable) {
        selectElement(editable);

        if (editable.tagName === 'IMG' || editable.closest('a')) {
          event.preventDefault();
        }

        return;
      }

      const box = event.target.closest?.('[data-admin-box]');
      if (box) {
        selectElement(box);
        event.preventDefault();
        event.stopPropagation();
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

      const selector = contentSelector(element);
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

  function preparePreview() {
    previewDocument = frame.contentDocument;
    if (!previewDocument) return;

    listenersBound = false;
    injectEditorStyles(previewDocument);
    decoratePreviewContent();
    bindPreviewEvents();

    const rootStyle = previewDocument.documentElement.style;
    themeBg.value = rootStyle.getPropertyValue('--bg').trim() || '#07090d';
    themeMint.value = rootStyle.getPropertyValue('--mint').trim() || '#8ff5d0';
    themeBlue.value = rootStyle.getPropertyValue('--blue').trim() || '#7ca7ff';
  }

  function applyStyleProperty(property, value) {
    if (!selected) return;

    const selector = structuralSelector(selected);
    const before = valueFor(selected, 'style');

    if (!value) selected.style.removeProperty(property);
    else selected.style.setProperty(property, value);

    const after = valueFor(selected, 'style');
    pushChange(selector, 'style', before, after);
    populateLayoutControls(selected);
  }

  function applyThemeVariable(variable, value) {
    if (!previewDocument) return;

    const root = previewDocument.documentElement;
    const before = valueFor(root, 'style');
    root.style.setProperty(variable, value);
    const after = valueFor(root, 'style');

    pushChange(':root', 'style', before, after);
  }

  async function saveAll() {
    commitActiveEdit();

    if (!sessionUser) return;
    if (!dirty.size) {
      setStatus('KHÔNG CÓ GÌ CẦN LƯU');
      return;
    }

    setStatus('ĐANG KIỂM TRA QUYỀN...');

    const { data: allowed, error: permissionError } = await client
      .rpc('is_portfolio_admin');

    if (permissionError || allowed !== true) {
      setStatus('CHƯA CÓ QUYỀN LƯU');

      alert(
        'Supabase chưa nhận tài khoản hiện tại là admin.\n\n' +
        'Hãy chạy lại TOÀN BỘ file admin/supabase-cms.sql mới nhất trong Supabase SQL Editor, ' +
        'sau đó đăng xuất và đăng nhập lại admin một lần.\n\n' +
        (permissionError?.message || 'is_portfolio_admin() đang trả về false.')
      );
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
        'Không lưu được. Hãy chạy lại admin/supabase-cms.sql nếu quyền RLS chưa được cập nhật.\n\n' +
        error.message
      );
      return;
    }

    dirty.clear();
    setStatus('ĐÃ LƯU', 'is-saved');
  }

  async function uploadImage(file) {
    if (!selected || selected.tagName !== 'IMG' || !file) return;

    setStatus('ĐANG KIỂM TRA QUYỀN...');

    const { data: allowed, error: permissionError } = await client
      .rpc('is_portfolio_admin');

    if (permissionError || allowed !== true) {
      setStatus('CHƯA CÓ QUYỀN UPLOAD');
      alert(
        'Supabase chưa nhận tài khoản hiện tại là admin.\n\n' +
        'Hãy chạy lại TOÀN BỘ file admin/supabase-cms.sql mới nhất trong Supabase SQL Editor, ' +
        'sau đó đăng xuất và đăng nhập lại admin một lần.\n\n' +
        (permissionError?.message || 'is_portfolio_admin() đang trả về false.')
      );
      return;
    }

    const selector = structuralSelector(selected);
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
      alert('Không upload được ảnh.\n\n' + error.message);
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

    const contentKey = recordKey(contentSelector(selected), propertyFor(selected));
    const styleKey = recordKey(structuralSelector(selected), 'style');

    const { error } = await client
      .from('portfolio_content')
      .delete()
      .in('key', [contentKey, styleKey]);

    if (error) {
      alert(error.message);
      return;
    }

    dirty.delete(contentKey);
    dirty.delete(styleKey);
    setStatus('ĐÃ KHÔI PHỤC · ĐANG TẢI LẠI', 'is-saved');
    inspector.hidden = true;
    frame.contentWindow.location.reload();
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
    const selector = contentSelector(selected);
    applyValue(selector, 'innerHTML', textValue.value);
    markDirty(selector, 'innerHTML', textValue.value);
  });

  textValue.addEventListener('change', () => {
    if (!selected || selected.tagName === 'IMG') return;
    const selector = contentSelector(selected);
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
    const selector = structuralSelector(selected);
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

  [
    [boxWidth, 'width'],
    [boxMinHeight, 'min-height'],
    [boxPadding, 'padding'],
    [boxRadius, 'border-radius'],
    [textSize, 'font-size']
  ].forEach(([input, property]) => {
    input.addEventListener('change', () => {
      applyStyleProperty(property, input.value.trim());
    });
  });

  textColor.addEventListener('change', () => {
    applyStyleProperty('color', textColor.value);
  });

  boxColor.addEventListener('change', () => {
    applyStyleProperty('background-color', boxColor.value);
  });

  borderColor.addEventListener('change', () => {
    applyStyleProperty('border-color', borderColor.value);
  });

  themeBg.addEventListener('change', () => applyThemeVariable('--bg', themeBg.value));
  themeMint.addEventListener('change', () => applyThemeVariable('--mint', themeMint.value));
  themeBlue.addEventListener('change', () => applyThemeVariable('--blue', themeBlue.value));

  addTagBtn.addEventListener('click', () => {
    if (!selected) return;

    const stack =
      selected.matches?.('.stack-list')
        ? selected
        : selected.closest?.('.project-info-content')?.querySelector('.stack-list') ||
          selected.closest?.('.terminal-project-card')?.querySelector('.stack-list') ||
          selected.querySelector?.('.stack-list');

    const value = tagInput.value.trim().toUpperCase();
    if (!stack || !value) return;

    const selector = structuralSelector(stack);
    const before = stack.innerHTML;

    const chip = previewDocument.createElement('span');
    chip.className = 'chip';
    chip.textContent = value;
    stack.appendChild(chip);

    const after = stack.innerHTML;
    pushChange(selector, 'innerHTML', before, after);

    tagInput.value = '';
    decoratePreviewContent();
    renderTags(stack);
  });

  duplicateBoxBtn.addEventListener('click', () => {
    if (!selected) return;

    const box = selected.matches(BOX_SELECTOR)
      ? selected
      : selected.closest(BOX_SELECTOR);

    const parent = box?.parentElement;
    if (!box || !parent) return;

    const selector = structuralSelector(parent);
    const before = cleanContainerHtml(parent);
    const clone = sanitizeClone(box);

    clone.dataset.cmsNode = 'clone-' + Date.now();
    parent.insertBefore(clone, box.nextSibling);

    const after = cleanContainerHtml(parent);
    pushChange(selector, 'innerHTML', before, after);

    decoratePreviewContent();
    selectElement(clone);
  });

  deleteBoxBtn.addEventListener('click', () => {
    if (!selected) return;

    const box = selected.matches(BOX_SELECTOR)
      ? selected
      : selected.closest(BOX_SELECTOR);

    const parent = box?.parentElement;
    if (!box || !parent) return;

    const selector = structuralSelector(parent);
    const before = cleanContainerHtml(parent);

    box.remove();

    const after = cleanContainerHtml(parent);
    pushChange(selector, 'innerHTML', before, after);

    selected = null;
    inspector.hidden = true;
    decoratePreviewContent();
  });

  let inspectorDragState = null;

  inspectorDragHandle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button,input,textarea,label,a')) return;

    inspectorDragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: inspector.offsetLeft,
      top: inspector.offsetTop
    };

    inspectorDragHandle.setPointerCapture?.(event.pointerId);
    inspector.classList.add('is-dragging');
    event.preventDefault();
  });

  inspectorDragHandle.addEventListener('pointermove', (event) => {
    if (
      !inspectorDragState ||
      event.pointerId !== inspectorDragState.pointerId
    ) {
      return;
    }

    setInspectorPosition(
      inspectorDragState.left + event.clientX - inspectorDragState.startX,
      inspectorDragState.top + event.clientY - inspectorDragState.startY
    );

    event.preventDefault();
  });

  function stopInspectorDrag(event) {
    if (!inspectorDragState) return;

    if (
      event?.pointerId !== undefined &&
      event.pointerId !== inspectorDragState.pointerId
    ) {
      return;
    }

    inspector.classList.remove('is-dragging');
    inspectorDragState = null;
    setInspectorPosition(
      inspector.offsetLeft,
      inspector.offsetTop,
      true
    );
  }

  inspectorDragHandle.addEventListener('pointerup', stopInspectorDrag);
  inspectorDragHandle.addEventListener('pointercancel', stopInspectorDrag);

  window.addEventListener('resize', () => {
    if (inspector.hidden) return;
    setInspectorPosition(inspector.offsetLeft, inspector.offsetTop);
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

  async function syncPreviewWithPublicPage() {
    if (!sessionUser || frame.getAttribute('src') === 'about:blank') return;

    const win = frame.contentWindow;
    if (!win) return;

    setStatus('ĐANG ĐỒNG BỘ TRANG GỐC...');

    try {
      if (win.PORTFOLIO_CMS_READY) {
        await Promise.race([
          win.PORTFOLIO_CMS_READY,
          new Promise((resolve) => setTimeout(resolve, 8000))
        ]);
      } else if (!win.PORTFOLIO_CMS_STATE?.ready) {
        await new Promise((resolve) => {
          let finished = false;

          const done = () => {
            if (finished) return;
            finished = true;
            win.removeEventListener('portfolio-cms-ready', done);
            resolve();
          };

          win.addEventListener('portfolio-cms-ready', done, { once: true });
          setTimeout(done, 2500);
        });
      }
    } catch (error) {
      console.warn('Không thể chờ CMS preview:', error);
    }

    preparePreview();
    setStatus('ĐÃ ĐỒNG BỘ VỚI TRANG GỐC', 'is-saved');
  }

  frame.addEventListener('load', () => {
    if (!sessionUser || frame.getAttribute('src') === 'about:blank') return;

    editorLoaded = true;
    editorLoading = false;
    syncPreviewWithPublicPage();
  });

  function loadEditor() {
    gate.hidden = true;
    adminShell.hidden = false;

    if (editorLoaded || editorLoading) return;

    const currentSrc = frame.getAttribute('src') || '';
    if (currentSrc && currentSrc !== 'about:blank') {
      editorLoaded = true;
      syncPreviewWithPublicPage();
      return;
    }

    editorLoading = true;

    const baseSrc = frame.dataset.src || '../index.html?admin-preview=1';
    const separator = baseSrc.includes('?') ? '&' : '?';
    const previewSrc = baseSrc + separator + 'admin-editor=1';

    frame.setAttribute('src', previewSrc);
  }

  function showLogin(message = '') {
    sessionUser = null;
    editorLoaded = false;
    editorLoading = false;
    previewDocument = null;
    listenersBound = false;

    if (frame.getAttribute('src') !== 'about:blank') {
      frame.setAttribute('src', 'about:blank');
    }

    adminShell.hidden = true;
    gate.hidden = false;
    if (message) loginMessage.textContent = message;
  }

  githubLoginBtn.addEventListener('click', () => startOAuth('github'));
  googleLoginBtn.addEventListener('click', () => startOAuth('google'));

  clearSessionBtn.addEventListener('click', async () => {
    loginMessage.textContent = 'Đang đăng xuất phiên hiện tại...';
    await client.auth.signOut({ scope: 'local' });
    describeSession(null);
    loginMessage.textContent =
      'Đã xóa phiên Supabase. Nếu GitHub vẫn tự dùng cùng một tài khoản, hãy đăng xuất GitHub trên github.com rồi thử lại.';
  });

  client.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;

    if (!user) {
      if (event === 'SIGNED_OUT') {
        sessionUser = null;
        editorLoaded = false;
        editorLoading = false;
      }
      return;
    }

    describeSession(user);

    if (isAllowedAdmin(user)) {
      sessionUser = user;

      if (!editorLoaded && !editorLoading) {
        loadEditor();
      }

      return;
    }

    client.auth.signOut({ scope: 'local' }).finally(() => {
      showLogin(
        'Tài khoản này không có quyền admin. Admin chỉ chấp nhận GitHub @Dev-GiaPhu hoặc email ' +
        ADMIN_EMAIL +
        '.'
      );
    });
  });

  async function init() {
    adminShell.hidden = true;
    gate.hidden = false;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error_description') || params.get('error');

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
      describeSession(null);
      showLogin();
      return;
    }

    describeSession(user);

    if (!isAllowedAdmin(user)) {
      await client.auth.signOut({ scope: 'local' });
      showLogin(
        'Tài khoản này không có quyền admin. Admin chỉ chấp nhận GitHub @Dev-GiaPhu hoặc email ' +
        ADMIN_EMAIL +
        '.'
      );
      return;
    }

    sessionUser = user;
    loadEditor();
  }

  init();
})();
