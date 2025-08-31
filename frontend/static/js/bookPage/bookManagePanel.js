// ================== BookManagePanel (Factory Class Version) ==================
import { fetchUserCreatedBooks, deleteBook } from '../common/api_book.js';

import { toPath } from '../router/router.js';
import BookList from './bookList.js';
import { getToken } from '../user/login.js';

export default class BookManagePanel {
  constructor(container) {
    this.container = container;
    this.books = [];
    this.filteredBooks = [];
    this.isLoading = false;

    // components
    this.myBookList = null;

    // DOM
    this.panelContainer = null;
    this.emptyState = null;
    this.loadingState = null;
    this.overlay = null;

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
      this.panelContainer.className = 'book-manage-panel';
      this.container.appendChild(this.panelContainer);
    }
    this.panelContainer.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'book-manage-header';
    header.innerHTML = `<h2>Book Management</h2>`;
    this.panelContainer.appendChild(header);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'book-actions';
    actions.innerHTML = `
      <button id="add-book-btn" class="btn btn-primary">➕ Add Book</button>
    `;
    this.panelContainer.appendChild(actions);

    // List container
    const listDiv = document.createElement('div');
    listDiv.id = 'book-manage-list';
    listDiv.className = 'books-grid';

    // Empty state
    this.emptyState = document.createElement('div');
    this.emptyState.id = 'empty-state';
    this.emptyState.className = 'empty-state';
    this.emptyState.style.display = 'none';
    this.emptyState.innerHTML = `
      <div class="empty-icon">📚</div>
      <h3>No books found</h3>
    `;

    // Loading state
    this.loadingState = document.createElement('div');
    this.loadingState.id = 'loading-state';
    this.loadingState.className = 'loading-state';
    this.loadingState.style.display = 'none';
    this.loadingState.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading books...</p>
    `;

    // Overlay for book control
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.id = 'book-manage-overlay';
    this.overlay.style.display = 'none';

    const controlPanel = document.createElement('div');
    controlPanel.id = 'book-manage-control-panel';
    controlPanel.className = 'book-control-panel';
    controlPanel.innerHTML = `
      <button id="manage-chapter" class="btn btn-primary">Manage Chapter</button>
      <button id="manage-delete-book" class="btn btn-danger">Remove Book</button>
    `;
    this.overlay.appendChild(controlPanel);

    // Append all to panelContainer
    this.panelContainer.appendChild(listDiv);
    this.panelContainer.appendChild(this.emptyState);
    this.panelContainer.appendChild(this.loadingState);
    this.panelContainer.appendChild(this.overlay);

    // Initialize components and events
    this.initializeComponents();
    this.setupEventListeners();
    this.loadBooks();
    return this.panelContainer;
  }

  // ================== Components ==================
  initializeComponents() {
    const listContainer = this.container.querySelector('#book-manage-list');
    if (listContainer && BookList) {
      this.myBookList = new BookList(listContainer, (book) => this.handleBookClick(book));
    }
  }

  setupEventListeners() {
    // Overlay click to close
    this.addEvent(this.overlay, 'click', e => {
      if (e.target === this.overlay) this.closeOverlay();
    });

    // Add book button
    const addBookBtn = this.container.querySelector('#add-book-btn');
    if (addBookBtn) {
      this.addEvent(addBookBtn, 'click', () => {
        console.log('Navigating to add book page');
        toPath('addbook');
      });
    }
  }

  // ================== Data ==================
  async loadBooks() {
    this.showLoading(true);

    try {
      const books = await fetchUserCreatedBooks();
      this.books = books;
      this.filteredBooks = [...books];
      this.renderBooks();
    } catch (err) {
      console.error('Error fetching books:', err);
      alert('Error loading books. Please try again later.');
    } finally {
      this.showLoading(false);
    }
  }


  // ================== Rendering ==================
  renderBooks() {
    if (this.myBookList) this.myBookList.render(this.filteredBooks);
    this.toggleEmptyState(this.filteredBooks.length === 0 && !this.isLoading);
  }

  toggleEmptyState(show) {
    if (this.emptyState) this.emptyState.style.display = show ? 'block' : 'none';
    const list = this.container.querySelector('#book-manage-list');
    if (list) list.style.display = show ? 'none' : 'grid';
  }

  showLoading(show) {
    this.isLoading = show;
    if (this.loadingState) this.loadingState.style.display = show ? 'block' : 'none';
    const list = this.container.querySelector('#book-manage-list');
    if (list) list.style.display = show ? 'none' : 'grid';
  }

  // ================== Book Control ==================
  handleBookClick(book) {
    this.showOverlay(book);
  }

  showOverlay(book) {
    if (this.overlay) this.overlay.style.display = 'flex';

    const manageChapterBtn = this.container.querySelector('#manage-chapter');
    const deleteBookBtn = this.container.querySelector('#manage-delete-book');

    if (manageChapterBtn) {
      manageChapterBtn.onclick = () => {
        console.log(`Adding chapter to book: ${book.title}`);
        this.closeOverlay();
        toPath('chapter-editor', book);
      };
    }

    if (deleteBookBtn) {
      deleteBookBtn.onclick = async () => {
        if (!confirm(`Remove book "${book.title}"?`)) return;

        try {
          await deleteBook(book.id);

          // 更新本地数据
          this.books = this.books.filter(b => b.id !== book.id);
          this.filteredBooks = this.filteredBooks.filter(b => b.id !== book.id);
          this.renderBooks();

          alert(`Book "${book.title}" removed successfully`);

        } catch (err) {
          console.error('Error removing book:', err);
          alert(err.message || 'Error removing book.');
        } finally {
          this.closeOverlay();
        }
      };
    }
  }

  closeOverlay() {
    if (this.overlay) this.overlay.style.display = 'none';
  }
}
