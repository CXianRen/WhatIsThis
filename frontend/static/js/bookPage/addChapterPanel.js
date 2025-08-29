// chapterEditPanel.js
import { getToken } from '../user/login.js';
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

  onMount() {}
  onUnmount() {}

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

    const token = getToken();
    const isEdit = !!this.chapter;
    const url = isEdit ? '/api/book/manage/chapter/update' : '/api/book/manage/chapter/add';

    const payload = {
      book_id: this.book.id,
      title,
      content
    };
    if (isEdit) {
      payload.chapter_id = this.chapter.chapter_id;  // 必须传 chapter_id
    }

    // the button show uploading
    const save_btn = this.container.querySelector('.btn-save');
    const old_text =  save_btn.innerText;
    save_btn.innerText = "Translating...";
    
    // console.log("change")

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // console.log("rechange")
    save_btn.innerText = old_text;

    if (res.ok) {
      const data = await res.json();
      alert(data.message || (isEdit ? 'Chapter updated successfully' : 'Chapter added successfully'));
      this.unmount(); // 关闭面板
      toPrevPath();   // 回到章节管理
    } else {
      const errText = await res.text();
      console.error('Error saving chapter:', errText);
      alert('Error saving chapter');
    }
  }

  _cancel() {
    toPrevPath();
  }
}
