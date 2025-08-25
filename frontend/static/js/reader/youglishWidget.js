// YouglishWidget.js (ESM)
export default class YouglishWidget {
  constructor({
    containerId,
    scriptUrl = "https://youglish.com/public/emb/widget.js",
    width = 640,
    height = 550,
    onStatus = () => { }
  } = {}) {
    this.containerId = containerId;
    this.scriptUrl = scriptUrl;
    this.width = width;
    this.height = height;
    this.onStatus = onStatus;

    this.apiReady = false;
    this.widget = null;
    this.timer = null;
  }

  async init() {
    if (this.apiReady) return;

    window.onYouglishAPIReady = () => this.onAPIReady();

    await this.loadScript(this.scriptUrl);
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  onAPIReady() {
    this.apiReady = true;
    this.onStatus("YouGlish API 已就绪，正在创建 Widget...");

    try {
      this.widget = new YG.Widget(this.containerId, {
        width: this.width,
        height: this.height,
        components: 88,
        events: {
          onFetchDone: (e) => this.onFetchDone(e),
          onCaptionConsumed: () => this.onCaptionConsumed(),
          onVideoReady: () => this.onVideoReady(),
          onError: (e) => this.onError(e)
        }
      });
      this.onStatus("Widget 已创建");
    } catch (e) {
      console.error("Widget 创建失败:", e);
      this.onStatus("Widget 创建失败: " + e.message);
    }
  }

  // === Youglish 事件 ===
  onFetchDone(event) {
    if (event.totalResult === 0) {
      this.onStatus("没有找到结果");
    } else {
      this.onStatus(`找到 ${event.totalResult} 个发音示例`);
    }
  }

  onCaptionConsumed() {
    if (this.widget) {
      this.widget.pause();
      this.timer = setTimeout(() => {
        if (this.widget) this.widget.replay();
      }, 2000);
    }
  }

  onVideoReady() {
    this.onStatus("播放器已准备就绪");
  }

  onError(event) {
    this.onStatus("发生错误：" + event.code);
  }

  // === API ===
  search(word) {
    if (!this.widget) {
      this.onStatus("Widget 未初始化");
      return;
    }
    this.onStatus("正在搜索: " + word);
    try {
      this.widget.fetch(word, "english");
    } catch (e) {
      console.error("搜索失败:", e);
      this.onStatus("搜索失败: " + e.message);
    }
  }

  pause() {
    if (this.widget) {
      try {
        this.widget.pause();
      } catch { }
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
