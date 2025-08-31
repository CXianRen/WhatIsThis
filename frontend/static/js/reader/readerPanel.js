// readerPanel.js (ESM, 工厂类封装)
import { fetchChapters, fetchChapterContent } from '../common/api_book.js';

import { getPathData } from '../router/router.js';

import SidebarComponent from '../common/sidebar-component.js';
import ToolBarWidget from './toolbarModule.js';
import WordPanel from './wordModule.js';
import YouglishPanel from './youglishModule.js';
import TagPanel from './tagModule.js';
import WordAnalysisPanel from './wordAnalysisModule.js';
import SentenceWidget from './sentenceWidget.js';


export default class ReaderPanel {
  constructor(container) {
    this.container = container || null;

    // 状态
    this.bookId = null;
    this.chapterData = [];
    this.currentSrcContent = null;
    this.currentDstContent = null;

    this.selectedWord = '';
    this.selectedText = '';
    this.sentenceWidget = null;

    this.currentFontSize = 2;
    this.fontSizes = ['small', 'medium', 'large', 'extra-large', 'huge'];

    // widget modules
    this.sidebar = null;
    this.toolBarModule = null;
    this.WordModule = null;
    this.youglishModule = null;
    this.tagModule = null;
    this.wordAnalysisModule = null;

    // DOM cache
    this.currentChapterElement = null;
    this.chapterInfoElement = null;
    this.contentAreaElement = null;

    // 生命周期
    this._onMount = [];
    this._onUnmount = [];

    // 事件管理
    this._events = [];
  }

  // ============== 生命周期 ==============
  onMount(cb) { this._onMount.push(cb); }
  onUnmount(cb) { this._onUnmount.push(cb); }

  mount() {
    // if (container) this.container = container;
    // if (!this.container) throw new Error('ReaderPanel: container is required');

    let data = getPathData();

    if (!data) {
      data = localStorage.getItem('lastReadingBook');
      if (data) {
        try {
          data = JSON.parse(data);
        } catch (e) {
          data = null;
        }
      }
    } else {
      localStorage.setItem('lastReadingBook', JSON.stringify(data));
    }

    console.log('ReaderPanel mount with data:', data);

    this.bookId = data.id || null;
    this.src_lang = data.languages[0].lang;
    this.src_lang_level = data.languages[0].level[0];
    this.dst_lang = data.languages[1].lang;
    this.dst_lang_level = data.languages[1].level[0];

    // if data is null, try to load from localStorage

    this.render();
    this._loadFontSizeSettings();
    this._loadNovelList();

    this._onMount.forEach(cb => cb());
  }

  unmount() {
    this.removeAllEvents();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this._onUnmount.forEach(cb => cb());
  }

  // ============== 渲染 ==================
  render() {
    const htmlContent = `
      <div class="main-content" id="main-content">
        <div class="content-header">
          <div class="chapter-title-area">
            <h2 id="currentChapter"></h2>
          </div>
          <div class="control-area">
            <p id="chapterInfo"></p>
            <div class="font-size-control">
              <label for="fontSizeSelect">Aa</label>
              <select id="fontSizeSelect" class="font-size-select"></select>
            </div>
          </div>
        </div>
        <div id="contentArea">
          <div class="loading">Please select a chapter from the left</div>
        </div>
      </div>
    `;
    this.container.innerHTML = htmlContent;

    const mainContainerElement = document.getElementById('main-content');
    this.currentChapterElement = document.getElementById('currentChapter');
    this.chapterInfoElement = document.getElementById('chapterInfo');
    this.contentAreaElement = document.getElementById('contentArea');

    // 字体大小选择
    const fontSizeSelect = this.container.querySelector('#fontSizeSelect');
    this.fontSizes.forEach((size, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = size;
      fontSizeSelect.appendChild(option);
    });
    this.addEvent(fontSizeSelect, 'change', (e) => {
      this.currentFontSize = parseInt(e.target.value);
      this._updateFontSize();
    });

    // Sidebar
    const isLandscape = window.innerWidth > window.innerHeight;
    this.sidebar = new SidebarComponent({
      title: 'Chapter List',
      containerId: 'main-content',
      position: 'left',
      width: isLandscape ? '50vw' : '80vw',
      height: 'auto',
      sidebarId: 'dagSidebar',
      showToggleButton: true,
      enableOverlay: true,
      autoHide: true
    });

    // ToolBar
    this.toolBarModule = new ToolBarWidget({
      container: mainContainerElement,
      cssUrl: '/static/css/reader/tool_bar.css',
      applist: [
        { name: "AI_D", onclick: () => this._openAIDictionary(), logo: "AI" },
        { name: "PN", onclick: () => this._openYouglish(), logo: "YT" },
        { name: "TAG", onclick: () => this._openTags(), logo: "TT" },
        { name: "AN", onclick: () => this._openWordAnalysis(), logo: "WA" },
      ],
      closeCallback: () => {
        this.sentenceWidget?._clearWordSelection();
      }
    });
    this.toolBarModule.init();

    // Word Panel
    this.WordModule = new WordPanel({ container: mainContainerElement });
    this.WordModule.init();

    // Youglish
    this.youglishModule = new YouglishPanel({
      container: mainContainerElement,
      cssUrl: '/static/css/reader/youglish_panel.css',
    });
    this.youglishModule.init();

    // Tag
    this.tagModule = new TagPanel({
      cssUrl: '/static/css/reader/tag_panel.css'
    });
    this.tagModule.init();

    // Word Analysis
    this.wordAnalysisModule = new WordAnalysisPanel({
      container: mainContainerElement
    });
    this.wordAnalysisModule.init();

  }

  // ============== 加载章节列表 ==================
  async _loadNovelList() {
    try {
      this.chapterData = await fetchChapters({
        bookId: this.bookId,
        lang: this.dst_lang,
        level: this.dst_lang_level
      });

      console.log('Loaded chapter list:', this.chapterData);

      if (this.sidebar) {
        this.sidebar.clearContent();
        this.sidebar.addContent(this._renderNovelList(), 'novelList');
      }

    } catch (error) {
      console.error('Failed to load novel chapters:', error);

      if (this.sidebar) {
        this.sidebar.clearContent();
        this.sidebar.addContent(`<div class="error">加载失败: ${error.message}</div>`, 'error');
      }
    }
  }


  _createNovelListContent() {
    if (this.chapterData.length === 0) return '<div class="loading">No chapter found</div>';
    return `
      <ul class="chapter-list">
        ${this.chapterData.map((ch, idx) => `<li class="chapter-item" data-chapter-index="${idx}">${ch.chapter_title}</li>`).join('')}
      </ul>
    `;
  }

  _renderNovelList() {
    const container = document.createElement('div');
    container.innerHTML = this._createNovelListContent();

    container.querySelectorAll('.chapter-item').forEach((chapterEl) => {
      this.addEvent(chapterEl, 'click', (event) => {
        event.stopPropagation();
        const chapterIndex = parseInt(chapterEl.dataset.chapterIndex);
        this._selectChapter(chapterIndex, chapterEl, event);
      });
    });

    // restore historical reading position
    const historicalChapterId = this._loadReadingHistory(this.bookId);
    if (historicalChapterId) {
      const historicalIndex = this.chapterData.findIndex(ch => ch.chapter_id === historicalChapterId);
      if (historicalIndex !== -1) {
        const chapterEl = container.querySelector(`.chapter-item[data-chapter-index="${historicalIndex}"]`);
        if (chapterEl) {
          this._selectChapter(historicalIndex, chapterEl, new Event('click'));
        }
      }
    } else {
      // 默认选择第一章
      const firstChapterEl = container.querySelector('.chapter-item');
      if (firstChapterEl) {
        this._selectChapter(0, firstChapterEl, new Event('click'));
      }
    }

    return container;
  }

  // ============== 加载章节内容 ==================
  async _selectChapter(chapterIndex, chapterElement, event) {
    event.stopPropagation();
    const chapter = this.chapterData[chapterIndex];

    // 更新选中样式
    this.sidebar?.hide();
    this.sidebar.sidebar.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
    chapterElement.classList.add('active');

    // 显示加载状态
    this.currentChapterElement.textContent = `${chapter.chapter_title}`;
    this.chapterInfoElement.textContent = 'Loading...';
    this.contentAreaElement.innerHTML = '<div class="loading">Loading...</div>';

    try {
      // 并行请求源语言和目标语言内容
      const [srcContent, dstContent] = await Promise.all([
        fetchChapterContent({ bookId: this.bookId, chapterId: chapter.chapter_id, lang: this.src_lang, level: this.src_lang_level }),
        fetchChapterContent({ bookId: this.bookId, chapterId: chapter.chapter_id, lang: this.dst_lang, level: this.dst_lang_level })
      ]);

      if (srcContent.content.length !== dstContent.content.length) {
        alert('Source and target content sentence count mismatch');
        throw new Error('Source and target content sentence count mismatch');
      }

      this.currentSrcContent = srcContent;
      this.currentDstContent = dstContent;
      this.chapterInfoElement.textContent = `Total ${dstContent.content.length} sentences`;

      // 渲染 SentenceWidget
      this.sentenceWidget = new SentenceWidget({
        container: this.contentAreaElement,
        toolBarModule: this.toolBarModule,
        onWordSelected: (word, text) => {
          this.selectedWord = word;
          this.selectedText = text;
        },
        srcLang: this.src_lang,
        dstLang: this.dst_lang
      });

      this.sentenceWidget.render(
        srcContent.content,
        dstContent.content,
        `font-size-${this.fontSizes[this.currentFontSize]}`
      );

    } catch (error) {
      console.error('Failed to load chapter content:', error);
      this.contentAreaElement.innerHTML = `<div class="error">Failed to load: ${error.message}</div>`;
    }

    // 保存阅读历史
    this._saveReadingHistory(this.bookId, chapter.chapter_id);
  }


  // ============== ToolBar actions ==================
  _openAIDictionary() {
    if (this.selectedWord) {
      //this.toolBarModule.close();
      this.sentenceWidget?._clearWordSelection();
      this.WordModule.show(this.selectedWord, this.dst_lang, this.src_lang);
    }
  }

  _openYouglish() {
    if (this.selectedWord) {
      const lang_map = {
        'zh': 'chinese',
        'en': 'english',
        'fr': 'french',
        // 'sw': 'swedish',
        'sv': 'swedish',
      }
      //this.toolBarModule.close();
      this.sentenceWidget?._clearWordSelection();
      this.youglishModule.show(this.selectedWord, this.dst_lang);
    }
  }

  _openTags() {
    if (this.selectedWord) {
      this.tagModule.show(this.selectedWord);
      //this.toolBarModule.close();
    }
  }

  _openWordAnalysis() {
    if (this.selectedWord) {
      this.wordAnalysisModule.show(this.selectedWord,
        this.selectedText, this.dst_lang, this.src_lang);
      //this.toolBarModule.close();
    }
  }
  // ================== reading history ===========
  // 保存阅读历史，支持多本书
  _saveReadingHistory(bookId, chapterId) {
    let historyMap = {};
    const historyStr = localStorage.getItem('readingHistory');
    if (historyStr) {
      try {
        historyMap = JSON.parse(historyStr);
      } catch (e) {
        historyMap = {};
      }
    }
    historyMap[bookId] = { chapterId, timestamp: Date.now() };
    localStorage.setItem('readingHistory', JSON.stringify(historyMap));
  }

  _loadReadingHistory(bookId) {
    const historyStr = localStorage.getItem('readingHistory');
    if (historyStr) {
      try {
        const historyMap = JSON.parse(historyStr);
        if (historyMap[bookId]) {
          return historyMap[bookId].chapterId;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ==============  Font Size ==================
  _updateFontSize() {
    const sentenceContainer = document.querySelector('.sentence-container');
    if (sentenceContainer) {
      this.fontSizes.forEach(size => sentenceContainer.classList.remove(`font-size-${size}`));
      sentenceContainer.classList.add(`font-size-${this.fontSizes[this.currentFontSize]}`);
    }

    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) fontSizeSelect.value = this.currentFontSize.toString();

    localStorage.setItem('fontSize', this.currentFontSize.toString());
  }

  _loadFontSizeSettings() {
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize !== null) {
      this.currentFontSize = parseInt(savedFontSize);
      if (this.currentFontSize < 0 || this.currentFontSize >= this.fontSizes.length) this.currentFontSize = 2;
      this._updateFontSize();
    }
  }

  // ============== 事件管理 ==================
  addEvent(el, type, handler) {
    el.addEventListener(type, handler);
    this._events.push({ el, type, handler });
  }

  removeAllEvents() {
    this._events.forEach(({ el, type, handler }) => {
      el.removeEventListener(type, handler);
    });
    this._events = [];
  }
}
