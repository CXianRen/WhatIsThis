import SidebarComponent from '../common/sidebar-component.js';
import ImageViewer from './imageViewerModule.js';

export default class WordCardPanel {
  constructor(container) {
    this.container = container;

    // data
    this.words = [];
    this.currentWordIndex = 0;
    this.currentWord = null;
    this.selectedTags = [];
    this.availableTags = [];
    this.searchQuery = '';

    // modules
    this.sidebar = null;
    this.imageViewer = null;

    // dom
    this.panelContainer = null;
    this.mainContainer = null;

    // event handlers
    this.eventHandlers = [];
  }

  // ================== Event Helpers ==================
  addEvent(el, type, handler) {
    if (!el) return;
    el.addEventListener(type, handler);
    this.eventHandlers.push({ el, type, handler });
  }

  removeAllEvents() {
    this.eventHandlers.forEach(({ el, type, handler }) => {
      el.removeEventListener(type, handler);
    });
    this.eventHandlers = [];
  }

  // ================== Lifecycle ==================
  async mount() {
    await this.render();
    this.onMount?.();
    await this.fetchTags();
  }

  unmount() {
    this.removeAllEvents();

    if (this.sidebar) {
      this.sidebar.destroy();
    }
    if (this.panelContainer && this.container.contains(this.panelContainer)) {
      this.container.removeChild(this.panelContainer);
    }
    this.panelContainer = null;
    this.mainContainer = null;
    this.onUnMount();


  }

  onMount() { }
  onUnMount() { }

  // ================== Render ==================
  async render() {
    if (!this.container) return null;

    // container
    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'wc-wordcard-container';
    this.panelContainer.id = 'wc-wordcardContainer';
    this.container.appendChild(this.panelContainer);

    // Sidebar
    const isLandscape = window.innerWidth > window.innerHeight;
    this.sidebar = new SidebarComponent({
      title: 'Filter',
      containerId: 'wc-wordcardContainer',
      position: 'left',
      width: isLandscape ? '50vw' : '80vw',
      height: 'auto',
      sidebarId: 'wc-wordcardSidebar',
      showToggleButton: true,
      enableOverlay: true,
      autoHide: true
    });

    this.sidebar.addContent(this.renderSidebar(), 'wc-wordcardSidebar');

    // Main
    this.mainContainer = document.createElement('div');
    this.mainContainer.className = 'wc-wordcard-main-container';
    this.mainContainer.id = 'wc-wordcardMainContainer';
    this.mainContainer.innerHTML = this.renderWordCard();
    this.panelContainer.appendChild(this.mainContainer);

    this.imageViewer = new ImageViewer({ containerId: 'wc-imageViewer' });

    // Setup events
    this.setupEvents();

    return this.panelContainer;
  }

  renderSidebar() {
    return `
      <div class="wc-filter-section">
        <div class="wc-available-tags">
          <h4 class="wc-filter-title">All Tags</h4>
          <div class="wc-tag-filter" id="wc-availableTags"></div>
        </div>

        <div class="wc-selected-tags">
          <h4 class="wc-filter-title">Selected Tags</h4>
          <div class="wc-tag-filter" id="wc-selectedTags"></div>
        </div>

        <button class="wc-filter-btn" id="wc-filterBtn">Filter</button>
      </div>

      <div class="wc-word-list" id="wc-wordList"></div>
    `;
  }

  renderWordCard() {
    return `
      <div class="wc-word-card">
        <div class="wc-word-display">
          <h1 class="wc-word-title" id="wc-wordTitle"></h1>
        </div>

        <div class="wc-image-viewer" id="wc-imageViewer"></div>

        <div class="wc-toolbar" id="wc-wc-toolbar">
          <div class="wc-toolbar-actions">
            <button class="wc-nav-btn" id="wc-youglishBtn">Youglish</button>
            <button class="wc-nav-btn" id="wc-wordDetailBtn">Word Detail</button>
          </div>
          <div class="wc-nav-buttons">
            <button class="wc-nav-btn" id="wc-prevBtn">Prev</button>
            <button class="wc-nav-btn" id="wc-nextBtn">Next</button>
          </div>
        </div>
      </div>
    `;
  }

  // ================== Fetch Data ==================
  async fetchTags() {
    try {
      const res = await fetch('/api/vocb/tags');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      this.availableTags = data.tags || [];
      this.updateAvailableTags();
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }

  async fetchWords(tags = []) {
    try {
      const res = await fetch('/api/vocb/word/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      this.words = Array.isArray(data) ? data : [];
      this.updateWordList();
      this.updateWordCard();
    } catch (err) {
      console.error('Failed to fetch words:', err);
      this.words = [];
    }
  }

  async fetchWordImages(word) {
    try {
      const res = await fetch(`/api/vocb/word/imgs/${word}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      return data.images || [];
    } catch (err) {
      console.error('Failed to fetch word images:', err);
      return [];
    }
  }

  // ================== UI Updates ==================
  updateAvailableTags() {
    const container = document.getElementById('wc-availableTags');
    if (!container) return;
    const tagsToShow = this.availableTags.filter(tag => !this.selectedTags.includes(tag));
    container.innerHTML = tagsToShow.map(tag => `<button class="wc-tag-btn" data-tag="${tag}">${tag}</button>`).join('');
  }

  updateSelectedTags() {
    const container = document.getElementById('wc-selectedTags');
    if (!container) return;
    container.innerHTML = this.selectedTags.map(tag => `
      <div class="wc-selected-tag">
        ${tag}
        <button class="wc-remove-tag" data-tag="${tag}">×</button>
      </div>
    `).join('');
  }

  addTag(tag) {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.updateAvailableTags();
      this.updateSelectedTags();
    }
  }

  removeTag(tag) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.updateAvailableTags();
    this.updateSelectedTags();
  }

  updateWordList() {
    const container = document.getElementById('wc-wordList');
    if (!container) return;
    container.innerHTML = this.words.map((word, index) => `
      <div class="wc-word-item ${index === this.currentWordIndex ? 'active' : ''}" data-word-id="${word.id}">
        <div class="wc-word-text">${word.word}</div>
        <div class="wc-word-tags">${word.tags ? word.tags.map(tag => `<span class="wc-word-tag">${tag}</span>`).join('') : ''}</div>
      </div>
    `).join('');
  }

  selectWord(wordId) {
    const index = this.words.findIndex(word => word.id === wordId);
    if (index !== -1) {
      this.currentWordIndex = index;
      this.currentWord = this.words[this.currentWordIndex];
      this.updateWordList();
      this.updateWordCard();
    }
  }

  async updateWordCard() {
    if (!this.words.length) return;
    this.currentWord = this.words[this.currentWordIndex];
    document.getElementById('wc-wordTitle').textContent = this.currentWord.word;

    const images = await this.fetchWordImages(this.currentWord.word);
    this.imageViewer.setImages(images);

    document.getElementById('wc-prevBtn').disabled = this.currentWordIndex === 0;
    document.getElementById('wc-nextBtn').disabled = this.currentWordIndex === this.words.length - 1;
  }

  // ================== Events ==================
  setupEvents() {
    // Available tags click
    this.addEvent(document.getElementById('wc-availableTags'), 'click', e => {
      if (e.target.classList.contains('wc-tag-btn')) this.addTag(e.target.dataset.tag);
    });

    // Selected tags click
    this.addEvent(document.getElementById('wc-selectedTags'), 'click', e => {
      if (e.target.classList.contains('wc-remove-tag')) this.removeTag(e.target.dataset.tag);
    });

    // Filter button
    this.addEvent(document.getElementById('wc-filterBtn'), 'click', async e => {
      e.target.disabled = true;
      await this.fetchWords(this.selectedTags);
      e.target.disabled = false;
    });

    // Word list click
    this.addEvent(document.getElementById('wc-wordList'), 'click', e => {
      const item = e.target.closest('.wc-word-item');
      if (item) this.selectWord(parseInt(item.dataset.wordId));
    });

    // Prev / Next
    this.addEvent(document.getElementById('wc-prevBtn'), 'click', () => {
      if (this.currentWordIndex > 0) {
        this.currentWordIndex--;
        this.updateWordList();
        this.updateWordCard();
      }
    });
    this.addEvent(document.getElementById('wc-nextBtn'), 'click', () => {
      if (this.currentWordIndex < this.words.length - 1) {
        this.currentWordIndex++;
        this.updateWordList();
        this.updateWordCard();
      }
    });
  }
}
