// WordPanel.js
import WordWidget from "./wordWidget.js";
export default class WordPanel {
  constructor({
    container = null,
    cssUrl = '/static/css/reader/word_panel.css',
    onClose = null } = {}) {
    // DOM 元素

    console.log('WordPanel container:', container);
    this.container = container;

    this.overlay = null;
    this.titleEl = null;
    this.pronunciationEl = null;
    this.contentEl = null;

    this.wordDetail = null;

    // 配置
    this.cssUrl = cssUrl;
    this.onClose = onClose;

    this.isInitialized = false;

  }

  // ===== 初始化 =====
  async init() {
    if (this.isInitialized) return;

    this._injectHTML();
    this.wordDetail = new WordWidget({
      titleEl: this.titleEl,
      pronunciationEl: this.pronunciationEl,
      contentEl: this.contentEl
    });

    if (this.cssUrl) await this._loadCSS(this.cssUrl);

    this.isInitialized = true;
  }

  // ===== 显示单词信息 =====
  async show(word) {
    if (!word) return;

    this.titleEl.textContent = word;
    this.pronunciationEl.textContent = '';
    this.contentEl.innerHTML = '<div class="word-loading">正在加载单词信息...</div>';
    this.overlay.style.display = 'flex';

    this.wordDetail.loadWord(word);

  }

  // ===== 关闭面板 =====
  close() {
    if (this.overlay) this.overlay.style.display = 'none';
    if (typeof this.onClose === 'function') this.onClose();
  }

  // ===== 私有方法 =====
  _injectHTML() {
    if (document.getElementById('wordDetailOverlay')) return;

    const html = `
      <div id="wordDetailOverlay" class="word-detail-overlay" style="display:none">
        <div class="word-detail-panel">
          <div class="word-detail-header">
            <button class="word-detail-close">&times;</button>
            <div class="word-title" id="wordTitle">单词</div>
            <div class="word-pronunciation" id="wordPronunciation"></div>
          </div>
          <div class="word-detail-content" id="wordDetailContent">
            <div class="word-loading">正在加载单词信息...</div>
          </div>
        </div>
      </div>`;

    this.container.insertAdjacentHTML('beforeend', html);

    this.overlay = document.getElementById('wordDetailOverlay');
    this.titleEl = document.getElementById('wordTitle');
    this.pronunciationEl = document.getElementById('wordPronunciation');
    this.contentEl = document.getElementById('wordDetailContent');

    const closeBtn = this.overlay.querySelector('.word-detail-close');
    closeBtn.addEventListener('click', () => this.close());
  }

  _loadCSS(url) {
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
