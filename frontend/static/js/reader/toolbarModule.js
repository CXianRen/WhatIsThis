// ToolBarModule.js (ESM)

export default class ToolBarWidget {
  constructor({ cssUrl = null, applist = [], closeCallback = null } = {}) {
    this.isInitialized = false;
    this.wordToolbar = null;
    this.wordToolbarVisible = false;
    this.cssUrl = cssUrl;
    this.applist = applist;
    this.closeCallback = closeCallback;
  }

  // ===== 初始化 =====
  async init() {
    if (this.isInitialized) return;

    this.#injectHTML();

    if (this.cssUrl) await this.#loadCSS(this.cssUrl);

    // 注册应用
    if (Array.isArray(this.applist)) {
      this.applist.forEach((app) => this.register(app));
    }

    this.isInitialized = true;
  }

  // ===== 注册工具按钮 =====
  register({ name, onclick, logo }) {
    if (!this.wordToolbar) return;
    const btn = document.createElement('button');
    btn.className = 'word-toolbar-button';
    btn.title = name;
    btn.innerHTML = logo || name;
    btn.addEventListener('click', onclick);
    this.wordToolbar.appendChild(btn);
  }

  // ===== 显示工具栏 =====
  show(x, y) {
    if (!this.wordToolbar) return;

    this.wordToolbarVisible = true;
    this.wordToolbar.style.display = 'flex';

    const toolbarRect = this.wordToolbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x - toolbarRect.width / 2;
    let top = y + 10;

    if (left < 10) left = 10;
    else if (left + toolbarRect.width > viewportWidth - 10)
      left = viewportWidth - toolbarRect.width - 10;

    if (top + toolbarRect.height > viewportHeight - 10)
      top = y - toolbarRect.height - 10;

    this.wordToolbar.style.left = `${left}px`;
    this.wordToolbar.style.top = `${top}px`;
  }

  // ===== 关闭工具栏 =====
  close() {
    if (!this.wordToolbar) return;
    this.wordToolbarVisible = false;
    this.wordToolbar.style.display = 'none';
    if (typeof this.closeCallback === 'function') this.closeCallback();
  }

  // ===== 内部私有函数 =====
  #injectHTML() {
    if (document.getElementById('wordToolbar')) {
      this.wordToolbar = document.getElementById('wordToolbar');
      return;
    }

    const html = `
      <div id="wordToolbar" class="word-toolbar" style="display:none;position:absolute;">
        <!-- 按钮占位，后续通过 register 动态添加 -->
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    this.wordToolbar = document.getElementById('wordToolbar');

    // 点击外部区域关闭
    document.addEventListener('click', (event) => {
      if (this.wordToolbarVisible && !this.wordToolbar.contains(event.target)) {
        this.close();
      }
    });

    // 滚动时关闭
    document.addEventListener(
      'scroll',
      () => {
        if (this.wordToolbarVisible) {
          this.close();
        }
      },
      true
    );
  }

  async #loadCSS(url) {
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
}
