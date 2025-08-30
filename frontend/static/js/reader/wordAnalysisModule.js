// WordAnalysisPanel.js
import WordAnalysisWidget from "./wordAnalysisWidget.js";

export default class WordAnalysisPanel {
  constructor({
    container = null,
    cssUrl = '/static/css/reader/word_panel.css',
    onClose = null
  } = {}) {
    this.container = container;

    this.overlay = null;
    this.titleEl = null;
    this.contentEl = null;

    this.analysisWidget = null;

    this.cssUrl = cssUrl;
    this.onClose = onClose;

    this.isInitialized = false;
  }

  // ===== 初始化 =====
  async init() {
    if (this.isInitialized) return;

    this._injectHTML();
    this.analysisWidget = new WordAnalysisWidget({
      titleEl: this.titleEl,
      contentEl: this.contentEl
    });

    if (this.cssUrl) await this._loadCSS(this.cssUrl);

    this.isInitialized = true;
  }

  // ===== 显示单词分析 =====
  async show(word, text, lang = 'en', native_lang = 'zh') {
    // if (!jsonData) return;

    this.overlay.style.display = 'flex';
    this.titleEl.textContent = word;
    this.contentEl.innerHTML = '<div class="word-loading">正在加载单词分析...</div>';

    this.analysisWidget.loadWordAnalysis(word, text, lang, native_lang);
  }

  // ===== 关闭面板 =====
  close() {
    if (this.overlay) this.overlay.style.display = 'none';
    if (typeof this.onClose === 'function') this.onClose();
  }

  // ===== 私有方法 =====
  _injectHTML() {
    if (document.getElementById('wordAnalysisOverlay')) return;

    const html = `
      <div id="wordAnalysisOverlay" class="word-detail-overlay" style="display:none">
        <div class="word-detail-panel">
          <div class="word-detail-header">
            <button class="word-detail-close">&times;</button>
            <div class="word-title" id="wordAnalysisTitle">单词分析</div>
          </div>
          <div class="word-detail-content" id="wordAnalysisContent">
            <div class="word-loading">正在加载单词分析...</div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', html);

    this.overlay = document.getElementById('wordAnalysisOverlay');
    this.titleEl = document.getElementById('wordAnalysisTitle');
    this.contentEl = document.getElementById('wordAnalysisContent');

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
