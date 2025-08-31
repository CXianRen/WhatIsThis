// chapterEditPanel.js
import { saveChapterAPI } from '../common/api_book.js';
import { getPathData, toPath, toPrevPath } from '../router/router.js';

export default class ChapterEditPanel {
  constructor(container) {
    this.container = container;
    this._events = [];
  }

  // ----------- 生命周期 -----------
  async mount() {
    this.data = getPathData() || JSON.parse(sessionStorage.getItem('currentEditingBook') || '{} ');
    if (this.data) {
      sessionStorage.setItem('currentEditingBook', JSON.stringify(this.data));
    }

    this.book = this.data?.book || {};
    this.chapter = this.data?.chapter || null; // null 表示新增章节

    this.render();
    this.onMount();
  }

  unmount() {
    this.onUnmount();
    this.removeAllEvents();
    this.container.innerHTML = '';
  }

  onMount() { }
  onUnmount() { }

  render() {
    const isEdit = !!this.chapter;
    const title = isEdit ? this.chapter.chapter_title : '';
    const content = isEdit ? this.chapter.chapter_content : '';

    this.container.innerHTML = `
      <div class="chapter-edit-panel">
        <h3>${isEdit ? 'Edit Chapter' : 'Add New Chapter'}</h3>
        <div class="form-group">
          <label>Title</label>
          <input type="text" class="chapter-title" value="${title}" placeholder="Enter chapter title" />
        </div>
        <div class="form-group">
          <label>Content</label>
          <textarea class="chapter-content" placeholder="Enter chapter content">${content}</textarea>
        </div>
        <div class="form-actions">
          <button class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
          <button class="btn-cancel">Cancel</button>
        </div>
      </div>
    `;

    this.removeAllEvents();
    this.ddEvent('.btn-save', 'click', () => this._saveChapter());
    this.ddEvent('.btn-cancel', 'click', () => this._cancel());
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

  // ----------- 保存章节 (新增/更新) -----------
  async _saveChapter() {
    const title = this.container.querySelector('.chapter-title').value.trim();
    const content = this.container.querySelector('.chapter-content').value.trim();

    if (!title) {
      alert('Title cannot be empty');
      return;
    }
    if (!content) {
      alert('Content cannot be empty');
      return;
    }

    const saveBtn = this.container.querySelector('.btn-save');
    const oldText = saveBtn.innerText;
    saveBtn.innerText = "Translating...";

    try {
      const data = await saveChapterAPI({
        bookId: this.book.id,
        title,
        content,
        chapterId: this.chapter?.chapter_id
      });

      alert(data.message || (this.chapter ? 'Chapter updated successfully' : 'Chapter added successfully'));

      this.unmount(); // 关闭面板
      toPrevPath();   // 返回章节管理

    } catch (err) {
      console.error('Error saving chapter:', err);
      alert(err.message || 'Error saving chapter');
    } finally {
      saveBtn.innerText = oldText;
    }
  }
  _cancel() {
    toPrevPath();
  }
}
