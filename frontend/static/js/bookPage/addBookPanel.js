// ================== AddBookPanel (Factory Class Version) ==================
import { getToken } from '../user/login.js';
import { toPath } from '../router/router.js';

export default class AddBookPanel {
  constructor(container) {
    this.container = container;

    // DOM
    this.panelContainer = null;
    this.form = null;
    this.messageBox = null;

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
  }

  unmount() {
    this.removeAllEvents();
    if (this.panelContainer && this.container.contains(this.panelContainer)) {
      this.container.removeChild(this.panelContainer);
    }
    this.panelContainer = null;
    this.onUnMount?.();
  }

  onMount() { }
  onUnMount() { }

  // ================== Render ==================
  async render() {
    if (!this.container) return null;

    if (!this.panelContainer) {
      this.panelContainer = document.createElement('div');
      this.panelContainer.className = 'add-book-panel';
      this.container.appendChild(this.panelContainer);
    }
    this.panelContainer.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'add-book-header';
    header.innerHTML = `<h2>Add New Book</h2>`;
    this.panelContainer.appendChild(header);

    // Form
    this.form = document.createElement('form');
    this.form.className = 'add-book-form';
    this.form.innerHTML = `
      <label>Book Name: <input type="text" id="book-name" required /></label>
      <label>
        Original Language: 
        <select id="org-lang" required>
          <option value="">-- Select Language --</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="zh">Chinese</option>
          <option value="sw">Swedish</option>
        </select>
      </label>

      <label>
        Target Language: 
        <select id="target-lang" required>
          <option value="">-- Select Language --</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="zh">Chinese</option>
          <option value="sw">Swedish</option>
        </select>
      </label>

    <label>
      Level: 
      <select id="levels" required>
        <option value="">-- Select Level --</option>
        <option value="a1">A1</option>
        <option value="a2">A2</option>
        <option value="b1">B1</option>
        <option value="b2">B2</option>
        <option value="c1">C1</option>
        <option value="c2">C2</option>
      </select>
    </label>
      <button type="submit" class="btn btn-primary">Add Book</button>
      <button type="button" id="cancel-btn" class="btn btn-secondary">Cancel</button>
    `;

    this.messageBox = document.createElement('div');
    this.messageBox.className = 'message-box';

    this.panelContainer.appendChild(this.form);
    this.panelContainer.appendChild(this.messageBox);

    // Setup Events
    this.setupEventListeners();
    return this.panelContainer;
  }

  // ================== Events ==================
  setupEventListeners() {
    if (this.form) {
      this.addEvent(this.form, 'submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    const cancelBtn = this.container.querySelector('#cancel-btn');
    if (cancelBtn) {
      this.addEvent(cancelBtn, 'click', () => {
        toPath('manage'); // 返回管理面板
      });
    }
  }

  // ================== Submit ==================
  handleSubmit() {
    const bookName = this.container.querySelector('#book-name').value.trim();
    const orgLang = this.container.querySelector('#org-lang').value.trim().toLowerCase();
    const targetLang = this.container.querySelector('#target-lang').value.trim().toLowerCase();
    const level = this.container.querySelector('#levels').value;

    if (!bookName || !orgLang || !targetLang || !level) {
      this.showMessage('⚠️ Please fill all fields correctly.', 'error');
      return;
    }

    const token = getToken();
    if (!token) {
      this.showMessage('❌ User not logged in.', 'error');
      return;
    }

    const payload = {
      name: bookName,
      org_lang: orgLang,
      supported_lang: targetLang,
      levels: [level],
    };

    fetch('/api/book/manage/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Failed to add book');
        this.showMessage('✅ Book added successfully!', 'success');
        setTimeout(() => {
          toPath('manage'); // 跳转到管理面板
        }, 1000);
      })
      .catch(err => {
        console.error('Error adding book:', err);
        this.showMessage(`❌ ${err.message}`, 'error');
      });
  }

  // ================== Utils ==================
  showMessage(msg, type = 'info') {
    if (this.messageBox) {
      this.messageBox.innerText = msg;
      this.messageBox.className = `message-box ${type}`;
    }
  }
}
