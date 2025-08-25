// YouglishPanel.js (ESM)
import YouglishWidget from "./youglishWidget.js";

export default class YouglishPanel {
  constructor({
    container = document.body,
    cssUrl = null,
    containerId = "youglish-widget-container",
    scriptUrl,
    onClose = null
  } = {}) {
    this.container = container;
    this.cssUrl = cssUrl;
    this.containerId = containerId;
    this.scriptUrl = scriptUrl;
    this.closeCallback = onClose;

    this.overlay = null;
    this.wordEl = null;
    this.statusEl = null;

    this.widget = new YouglishWidget({
      containerId: this.containerId,
      scriptUrl: this.scriptUrl,
      onStatus: (msg) => this.updateStatus(msg)
    });
  }

  async init() {
    this.injectHTML();
    if (this.cssUrl) await this.loadCSS(this.cssUrl);
    await this.widget.init();
  }

  injectHTML() {
    if (document.getElementById("youglishOverlay")) return;

    const html = `
      <div id="youglishOverlay" class="youglish-overlay" style="display:none">
        <div class="youglish-panel">
          <div class="youglish-header">
            <button class="youglish-close">&times;</button>
            <h3 class="youglish-title">🎵 单词发音</h3>
            <span class="youglish-word" id="youglishWord">word</span>
          </div>
          <div class="youglish-content">
            <div class="youglish-status" id="youglishStatus">正在初始化...</div>
            <div id="${this.containerId}"></div>
          </div>
        </div>
      </div>`;
    this.container.insertAdjacentHTML("beforeend", html);

    this.overlay = document.getElementById("youglishOverlay");
    this.wordEl = document.getElementById("youglishWord");
    this.statusEl = document.getElementById("youglishStatus");

    const closeBtn = this.overlay.querySelector(".youglish-close");
    closeBtn.addEventListener("click", () => this.close());
  }

  loadCSS(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${url}"]`)) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`CSS 加载失败: ${url}`));
      document.head.appendChild(link);
    });
  }

  updateStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }

  // === 对外 API ===
  show(word) {
    if (!word) return;
    this.wordEl.textContent = word;
    this.overlay.style.display = "flex";
    this.widget.search(word);
  }

  close() {
    this.overlay.style.display = "none";
    this.widget.pause();
    if (this.closeCallback) this.closeCallback();
  }
}

