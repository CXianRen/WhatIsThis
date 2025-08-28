// chapterManagerPanel.js
import { getToken } from '../user/login.js';
import { getPathData, toPath } from '../router/router.js';

export default class ChapterManagerPanel {
  constructor(container) {
    this.container = container;

    this.chapterData = [];

    this._events = [];
  }

  // ----------- 生命周期 -----------
  async mount() {
    //  save book for refresh
    this.book = getPathData() || JSON.parse(sessionStorage.getItem('currentEditingBook') || '{} ');
    //  save to sessionStorage
    if (this.book && this.book.id) {
      sessionStorage.setItem('currentEditingBook', JSON.stringify(this.book));
    }

    if (!this.book) {
      this.container.innerHTML = '<div class="error">No book data found.</div>';
      return;
    }
    console.log('Managing chapters for book:', this.book);
    this.bookId = this.book.id || null;
    this.src_lang = this.book.languages[0].lang;
    this.src_lang_level = this.book.languages[0].level[0];

    await this._loadChapters();
    this.render();
    this.onMount();
  }

  unmount() {
    this.onUnmount();
    this.removeAllEvents();
    this.container.innerHTML = '';
  }

  onMount() {
    // 钩子：需要的话子类可覆盖
  }

  onUnmount() {
    // 钩子：需要的话子类可覆盖
  }

  render() {
    const div = document.createElement('div');
    div.className = 'chapter-manager-panel';
    this.container.appendChild(div);

    div.innerHTML = `
      <div class="chapter-manager-header">
        <h3>Chapter Manager</h3>
        <button class="btn-add-chapter">Add Chapter</button>
      </div>
      <div class="chapter-list-container">
        ${this._createChapterListContent()}
      </div>
    `;

    this.removeAllEvents();
    this.ddEvent('.btn-add-chapter', 'click', () => toPath('add-chapter', { 'book': this.book }));

    div.querySelectorAll('.btn-edit').forEach((btn, idx) => {
      this.ddEvent(btn, 'click', () => toPath('add-chapter', { 'book': this.book, 'chapter': this.chapterData[idx] }));
    });

    div.querySelectorAll('.btn-delete').forEach((btn, idx) => {
      this.ddEvent(btn, 'click', () => this._confirmDelete(idx));
    });
  }

  // ----------- 事件绑定管理 -----------
  ddEvent(selectorOrEl, event, handler) {
    let el = typeof selectorOrEl === 'string'
      ? this.container.querySelector(selectorOrEl)
      : selectorOrEl;
    if (!el) return;
    el.addEventListener(event, handler);
    this._events.push({ el, event, handler });
  }

  removeAllEvents() {
    this._events.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this._events = [];
  }

  // ----------- 数据加载 -----------
  async _loadChapters() {
    const token = getToken();
    const response = await fetch(`/api/book/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        book_id: this.bookId,
        lang: this.src_lang,
        level: this.src_lang_level
      })
    });

    if (!response.ok) {
      console.error("Error fetching chapters:", response.statusText);
      this.chapterData = [];
      return;
    }

    this.chapterData = await response.json();
  }

  _createChapterListContent() {
    if (this.chapterData.length === 0) return '<div class="loading">0 chapter</div>';
    return `
      <ul class="chapter-list">
        ${this.chapterData.map((ch, idx) => `
          <li class="chapter-item" data-chapter-index="${idx}">
            <span>${ch.chapter_title}</span>
            <button class="btn-delete">Delete</button>
            <button class="btn-edit">Edit</button>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // ----------- 删除章节 -----------
  async _confirmDelete(idx) {
    const chapter = this.chapterData[idx];
    if (!confirm(`Delete chapter "${chapter.chapter_title}"?`)) return;

    const token = getToken();
    const res = await fetch(`/api/book/manage/chapter/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        book_id: this.bookId,
        chapter_id: chapter.chapter_id
      })
    });

    if (res.ok) {
      await this._loadChapters();
      this.render();
    } else {
      alert('Error deleting chapter');
    }
  }
}
