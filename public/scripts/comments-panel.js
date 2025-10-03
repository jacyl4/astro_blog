(() => {
  if (typeof window === 'undefined') return;
  if (window.__commentsPanelInitialized) return;

  const PANEL_ID = 'comments-panel';

  /**
   * @param {string | undefined} raw
   * @returns {{ apiBase?: string; uiText?: Record<string, string> }}
   */
  function parseConfig(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.error('[comments] Failed to parse config', error);
      return {};
    }
  }

  function readConfig() {
    const panel = document.getElementById(PANEL_ID);
    const parsed = parseConfig(panel?.dataset.config);
    const apiBase = typeof parsed.apiBase === 'string' ? parsed.apiBase : '';
    const uiText = parsed.uiText && typeof parsed.uiText === 'object' ? parsed.uiText : {};
    return { apiBase, uiText };
  }

  function normalizeHeaders(source) {
    if (!source) return {};
    if (source instanceof Headers) {
      return Object.fromEntries(Array.from(source.entries()));
    }
    if (Array.isArray(source)) {
      return Object.fromEntries(source);
    }
    return { ...source };
  }

  async function fetchJSON(url, opts = {}) {
    const init = { credentials: 'include', ...opts };
    const headers = { Accept: 'application/json', ...normalizeHeaders(init.headers) };

    const hasBody = typeof init.body !== 'undefined' && init.body !== null;
    if (hasBody) {
      const headerKeys = Object.keys(headers).reduce((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
      }, {});
      if (!('content-type' in headerKeys)) {
        headers['Content-Type'] = 'application/json';
      }
    }

    init.headers = headers;

    const res = await fetch(url, init);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function setEditorEnabled(enabled) {
    const input = /** @type {HTMLTextAreaElement|null} */ (getElement('comment-input'));
    const submit = /** @type {HTMLButtonElement|null} */ (getElement('comment-submit'));
    if (input) {
      input.disabled = !enabled;
      input.style.opacity = enabled ? '1' : '0.5';
    }
    if (submit) {
      submit.disabled = !enabled;
      submit.style.opacity = enabled ? '1' : '0.5';
    }
  }

  function renderComment(comment) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comment-item p-2 rounded border';
    wrapper.style.borderColor = 'var(--border-color)';

    const head = document.createElement('div');
    head.className = 'comment-author text-sm';
    const authorName = comment?.author?.login || 'User';
    const avatar = comment?.author?.avatar_url
      ? `<img src="${comment.author.avatar_url}" alt="${authorName}"/>`
      : `<span class="comment-avatar-fallback">${authorName.slice(0, 1).toUpperCase()}</span>`;
    const timestamp = new Date(comment?.created_at || '');
    const timestampText = Number.isNaN(timestamp.valueOf()) ? '' : timestamp.toLocaleString();
    head.innerHTML = `${avatar} <span style="color: var(--text-secondary);">${authorName}</span> <span class="ml-auto text-xs" style="color: var(--text-secondary);">${timestampText}</span>`;

    const body = document.createElement('div');
    body.className = 'comment-body prose prose-sm prose-invert';
    body.innerHTML = comment?.html || '';

    wrapper.appendChild(head);
    wrapper.appendChild(body);
    return wrapper;
  }

  function showStatus(message) {
    const box = /** @type {HTMLDivElement | null} */ (getElement('comments-status'));
    if (!box) return;
    if (!message) {
      box.style.display = 'none';
      box.textContent = '';
      return;
    }
    box.textContent = message;
    box.style.display = 'block';
  }

  async function loadSession() {
    const { apiBase, uiText } = readConfig();
    const sessionEl = /** @type {HTMLDivElement | null} */ (getElement('comments-session'));
    const loginLink = /** @type {HTMLAnchorElement | null} */ (getElement('login-link'));
    if (!sessionEl) {
      setEditorEnabled(false);
      return { authenticated: false };
    }

    if (!apiBase) {
      sessionEl.textContent = '评论服务未配置';
      if (loginLink) loginLink.style.display = 'none';
      setEditorEnabled(false);
      return { authenticated: false };
    }

    const loginUrl = `${apiBase}/auth/github/login?redirect_uri=${encodeURIComponent(window.location.href)}`;

    try {
      const res = await fetch(`${apiBase}/auth/session`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        if (loginLink) {
          loginLink.href = loginUrl;
          loginLink.style.display = 'inline';
        }
        sessionEl.textContent = uiText.loginPrompt || '';
        setEditorEnabled(false);
        return { authenticated: false };
      }

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || res.statusText);
      }

      const data = await res.json();
      if (data?.authenticated) {
        sessionEl.innerHTML = `${uiText.loggedInAs || ''} <strong style="color: var(--text-color);">${data.user?.login || ''}</strong>`;
        if (loginLink) loginLink.style.display = 'none';
        setEditorEnabled(true);
        return data;
      }

      if (loginLink) {
        loginLink.href = loginUrl;
        loginLink.style.display = 'inline';
      }
      sessionEl.textContent = uiText.loginPrompt || '';
      setEditorEnabled(false);
      return { authenticated: false };
    } catch (error) {
      console.error('[comments] Session error', error);
      sessionEl.textContent = uiText.sessionError || '';
      if (loginLink) {
        loginLink.href = loginUrl;
        loginLink.style.display = 'inline';
      }
      setEditorEnabled(false);
      return { authenticated: false };
    }
  }

  async function loadComments() {
    const { apiBase, uiText } = readConfig();
    const list = /** @type {HTMLDivElement | null} */ (getElement('comments-list'));
    if (!list || !apiBase) return;
    list.innerHTML = '';
    showStatus('');
    try {
      const res = await fetch(`${apiBase}/api/comments?postId=${encodeURIComponent(currentPostId())}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        showStatus(uiText.loginPrompt || '');
        return;
      }

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || res.statusText);
      }

      const data = await res.json();
      const comments = Array.isArray(data?.comments) ? data.comments : [];
      comments.forEach((comment) => list.appendChild(renderComment(comment)));
      if (!comments.length) {
        showStatus(uiText.noComments || '');
      }
    } catch (error) {
      console.error('[comments] Load error', error);
      showStatus(uiText.loadError || '');
    }
  }

  function currentPostId() {
    return window.location.pathname.replace(/\/$/, '') || '/';
  }

  async function setupEditor() {
    const submit = /** @type {HTMLButtonElement | null} */ (getElement('comment-submit'));
    const input = /** @type {HTMLTextAreaElement | null} */ (getElement('comment-input'));
    if (!submit || !input || submit.dataset.bound === 'true') return;
    submit.dataset.bound = 'true';
    submit.addEventListener('click', async () => {
      const { apiBase, uiText } = readConfig();
      if (!apiBase) {
        showStatus(uiText.commentError || '');
        return;
      }
      const text = input.value.trim();
      if (!text) return;
      submit.disabled = true;
      submit.textContent = uiText.commentSubmitting || '';
      showStatus('');
      try {
        await fetchJSON(`${apiBase}/api/comments`, {
          method: 'POST',
          body: JSON.stringify({ postId: currentPostId(), markdown: text }),
        });
        input.value = '';
        await loadComments();
      } catch (error) {
        console.error('[comments] Submit error', error);
        showStatus(uiText.commentError || '');
      } finally {
        submit.disabled = false;
        submit.textContent = uiText.commentSubmit || '';
      }
    });
  }

  function updateVisibility() {
    const { apiBase } = readConfig();
    const panel = /** @type {HTMLElement | null} */ (document.getElementById(PANEL_ID));
    if (!panel) return false;
    const isLargeScreen = window.matchMedia('(min-width: 1280px)').matches;
    const visible = window.location.pathname.startsWith('/posts/') && Boolean(apiBase) && isLargeScreen;
    panel.style.display = visible ? 'block' : 'none';
    return visible;
  }

  async function initComments() {
    const visible = updateVisibility();
    if (!visible) return;
    setEditorEnabled(false);
    await loadSession();
    await loadComments();
    await setupEditor();
  }

  function onNavEvents(handler) {
    document.addEventListener('astro:page-load', handler);
    document.addEventListener('astro:after-swap', handler);
    document.addEventListener('DOMContentLoaded', handler);
  }

  function initCommentsPanel() {
    if (window.__commentsPanelInitialized) return;
    window.__commentsPanelInitialized = true;

    onNavEvents(() => {
      initComments().catch((error) => console.error('[comments]', error));
    });

    initComments().catch((error) => console.error('[comments]', error));

    if (!window.__commentsPanelResizeBound) {
      window.__commentsPanelResizeBound = true;
      window.addEventListener('resize', () => {
        initComments().catch((error) => console.error('[comments]', error));
      });
    }
  }

  initCommentsPanel();
})();
