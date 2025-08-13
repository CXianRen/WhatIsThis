const ToolBarModule = (function () {
  let isInitialized = false;
  let wordToolbar;
  let wordToolbarVisible = false;
  let closeCallback = null;

  // ===== 动态插入 HTML =====
  function injectHTML() {
    if (document.getElementById('wordToolbar')) return;

    const html = `
    <div id="wordToolbar" class="word-toolbar" style="display:none;position:absolute;">
      <!-- 按钮占位，后续通过 register 动态添加 -->
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    wordToolbar = document.getElementById('wordToolbar');

    // 
    document.addEventListener('click', (event) => {
      // 如果点击的不是工具栏或其子元素，且工具栏可见，则隐藏工具栏
      if (wordToolbarVisible &&
        !wordToolbar.contains(event.target)) {
        close()
      }
    });
    document.addEventListener('scroll', () => {
      if (wordToolbarVisible) {
        clearWordSelection();
        close()
      }
    }, true);
  }

  // ===== 加载 CSS =====
  function loadCSS(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${url}"]`)) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`CSS 加载失败: ${url}`));
      document.head.appendChild(link);
    });
  }

  // ===== 注册工具按钮 =====
  function register({ name, onclick, logo }) {
    if (!wordToolbar) return;
    const btn = document.createElement('button');
    btn.className = 'word-toolbar-button';
    btn.title = name;
    btn.innerHTML = logo || name;
    btn.addEventListener('click', onclick);
    wordToolbar.appendChild(btn);
  }

  // ===== 初始化模块 =====
  async function init({ cssUrl, applist = [], ccb = null }) {
    if (isInitialized) return;

    closeCallback = ccb;
    injectHTML();

    if (cssUrl) await loadCSS(cssUrl);

    // 注册应用
    if (Array.isArray(applist)) {
      applist.forEach(app => register(app));
    }

    isInitialized = true;
  }

  // ===== 显示工具栏 =====
  function show(x, y) {
    if (!wordToolbar) return;

    wordToolbarVisible = true;
    wordToolbar.style.display = 'flex';

    const toolbarRect = wordToolbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x - toolbarRect.width / 2;
    let top = y + 10;

    if (left < 10) left = 10;
    else if (left + toolbarRect.width > viewportWidth - 10)
      left = viewportWidth - toolbarRect.width - 10;

    if (top + toolbarRect.height > viewportHeight - 10)
      top = y - toolbarRect.height - 10;

    wordToolbar.style.left = `${left}px`;
    wordToolbar.style.top = `${top}px`;
  }

  // ===== 关闭工具栏 =====
  function close() {
    if (!wordToolbar) return;
    wordToolbarVisible = false;
    wordToolbar.style.display = 'none';
    if (typeof closeCallback === 'function') closeCallback();
  }

  return { init, show, close, register };
})();
