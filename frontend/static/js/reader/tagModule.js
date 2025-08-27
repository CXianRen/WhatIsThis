export default class TagPanel {
  constructor({ cssUrl = null, closeCallback = null } = {}) {
    this.isInitialized = false;
    this.addTagOverlay = null;
    this.tagListContainer = null;
    this.selectedTagsContainer = null;
    this.addTagInput = null;

    // 状态变量
    this.selectedWord = '';
    this.wordTags = [];
    this.tempTagList = [];
    this.allowTagList = [];

    this.cssUrl = cssUrl;
    this.closeCallback = closeCallback;
  }

  // ===== 初始化 =====
  async init() {
    if (this.isInitialized) {
      console.log("already init.");
      return;
    }

    this.#injectHTML();

    if (this.cssUrl) await this.#loadCSS(this.cssUrl);

    this.getTagList((tags) => {
      console.log("get tag list");
      this.allowTagList = tags;
      this.#renderTags();
    });

    this.isInitialized = true;
  }

  // ===== 显示面板 =====
  show(word) {
    if (!word) return;

    this.selectedWord = word;
    this.tempTagList = [];
    this.wordTags = [];

    this.addTagOverlay.style.display = 'flex';
    this.addTagOverlay.querySelector('#addTagText').textContent = `Add: ${word}`;

    this.getWordTags(word, (tags) => {
      this.wordTags = tags;
      this.tempTagList = [...this.wordTags];
      this.#renderTags();
      this.#renderSelectedTags();
    });
  }

  // ===== 关闭面板 =====
  close() {
    if (this.addTagOverlay) this.addTagOverlay.style.display = 'none';
    if (typeof this.closeCallback === 'function') this.closeCallback();
  }

  // ====== 内部私有函数 ======
  #injectHTML() {
    if (document.getElementById('addTagOverlay')) {
      this.addTagOverlay = document.getElementById('addTagOverlay');
      return;
    }

    const html = `
    <div id="addTagOverlay" class="add-tag-overlay" style="display:none;">
      <div class="add-tag-panel">
        <div class="add-tag-header">
          <button class="add-tag-close">&times;</button>
          <h3 id="addTagText">Adding ...</h3>
        </div>

        <span class="tag-list-title">Available Tags:</span>
        <div class="add-tag-content">
          <div id="tagListContainer" class="tag-list-container"></div>
          <div>
            <input type="text" class="add-tag-input" placeholder="输入标签，逗号分隔" />
            <button class="add-tag-button" id="addTagBtn">New tags</button>
          </div>
        </div>

        <span class="selected-tags-title">Selected Tags:</span>
        <div class="add-tag-content">
          <div id="SelectedTags" class="tag-list-container"></div>
          <button class="add-tag-button" id="saveTagsBtn">SAVE</button>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    this.addTagOverlay = document.getElementById('addTagOverlay');
    this.tagListContainer = document.getElementById('tagListContainer');
    this.selectedTagsContainer = document.getElementById('SelectedTags');
    this.addTagInput = this.addTagOverlay.querySelector('.add-tag-input');

    // 事件绑定
    this.addTagOverlay.querySelector('.add-tag-close')
      .addEventListener('click', () => this.close());

    this.addTagOverlay.querySelector('#addTagBtn')
      .addEventListener('click', () => this.#addNewTags());

    this.addTagOverlay.querySelector('#saveTagsBtn')
      .addEventListener('click', () => this.#saveTags());
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

  #renderTags() {
    if (!this.tagListContainer) return;
    this.tagListContainer.innerHTML = '';

    this.allowTagList.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-item';
      btn.textContent = tag;
      btn.onclick = () => {
        if (!this.tempTagList.includes(tag)) {
          this.tempTagList.push(tag);
          this.#renderSelectedTags();
        }
      };
      this.tagListContainer.appendChild(btn);
    });
  }

  #renderSelectedTags() {
    if (!this.selectedTagsContainer) return;
    this.selectedTagsContainer.innerHTML = '';

    this.tempTagList.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-item';
      btn.textContent = tag;
      btn.onclick = () => {
        this.tempTagList = this.tempTagList.filter(t => t !== tag);
        this.#renderSelectedTags();
      };
      this.selectedTagsContainer.appendChild(btn);
    });
  }

  #addNewTags() {
    if (!this.addTagInput || !this.addTagInput.value.trim()) return;

    const newTags = this.addTagInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t && !this.allowTagList.includes(t));

    if (newTags.length === 0) return;

    this.addTag(newTags, (tags) => {
      this.allowTagList = tags;
      this.#renderTags();
      this.addTagInput.value = '';
    });
  }

  #saveTags() {
    console.log(`保存标签 ${this.selectedWord}:`, this.tempTagList);
    if (this.tempTagList.length === this.wordTags.length &&
      this.tempTagList.every(tag => this.wordTags.includes(tag))) {
      return;
    }
    this.addTagToWord(this.selectedWord, this.tempTagList, () => {
      alert("save tags!");
    });
  }

  // ====== API 调用函数 ======
  async getTagList(callback) {
    const response = await fetch('/api/vocb/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    const tags = data.tags || [];
    if (typeof callback === 'function') callback(tags);
    return tags;
  }

  async addTag(tag, callback) {
    const response = await fetch('/api/vocb/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tag })
    });
    const data = await response.json();
    if (typeof callback === 'function') callback(data.tag || null);
    return data.tag || null;
  }

  async deleteTag(tag, callback) {
    const response = await fetch('/api/vocb/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag })
    });
    const data = await response.json();
    if (typeof callback === 'function') callback(data.success);
    return data.success;
  }

  async getWordTags(word, callback) {
    const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    const tags = data.tags || [];
    if (typeof callback === 'function') callback(tags);
    return tags;
  }

  async addTagToWord(word, tags, callback) {
    const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: tags })
    });
    const data = await response.json();
    if (typeof callback === 'function') callback(data.success);
    return data.success;
  }
}
