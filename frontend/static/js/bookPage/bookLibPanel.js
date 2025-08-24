// ========== Main App Controller (ESM, Class Version) ==========
import { toPath } from '../router/router.js';
import BookFilter from './filter.js';
import BookList from './bookList.js';
import { getToken } from '../user/login.js';

export default class BookLibraryPanel {
  constructor(container) {
    this.container = container;
    this.books = [];
    this.filteredBooks = [];
    this.currentFilters = {
      language: null,
      level: null,
      search: ''
    };
    this.isLoading = false;

    // components
    this.myBookFilter = null;
    this.myBookList = null;

    if (this.container) {
      this.init();
    }
  }

  // ========= Initialization =========
  init() {
    this.container.innerHTML = '';

    // panel container
    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'book-shelf-panel';

    // header section
    const header = document.createElement('div');
    header.className = 'bookshelf-header';
    header.innerHTML = `<h2>Library</h2>`;
    this.panelContainer.appendChild(header);

    // Filter section
    const filterDiv = document.createElement('div');
    filterDiv.id = 'book-filter';
    filterDiv.className = 'filter-container';

    // Books list
    const listDiv = document.createElement('div');
    listDiv.id = 'book-list';
    listDiv.className = 'books-grid';

    // Empty state
    this.emptyState = document.createElement('div');
    this.emptyState.id = 'empty-state';
    this.emptyState.className = 'empty-state';
    this.emptyState.style.display = 'none';
    this.emptyState.innerHTML = `
      <div class="empty-icon">📖</div>
      <h3>No books available</h3>
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

    // book control overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.id = 'book-control-panel-overlay';
    this.overlay.style.display = 'none';

    const bookControlPanel = document.createElement('div');
    bookControlPanel.id = 'book-control-panel';
    bookControlPanel.className = 'book-control-panel';
    bookControlPanel.innerHTML = `
      <button id="add-book-btn" class="btn btn-primary">Add to my shelf</button>
    `;
    this.overlay.appendChild(bookControlPanel);

    // Append all to container
    this.panelContainer.appendChild(filterDiv);
    this.panelContainer.appendChild(listDiv);
    this.panelContainer.appendChild(this.emptyState);
    this.panelContainer.appendChild(this.loadingState);
    this.container.appendChild(this.panelContainer);
    this.container.appendChild(this.overlay);

    // Setup
    this.initializeComponents();
    this.loadAllBooks();
    this.setupEventListeners();

    console.log('✅ Bookshelf Panel ready!');
  }

  // ========= Components =========
  initializeComponents() {
    const filterContainer = this.container.querySelector('#book-filter');
    const listContainer = this.container.querySelector('#book-list');

    if (filterContainer && BookFilter) {
      this.myBookFilter = new BookFilter(filterContainer, (filters) => this.handleFilterChange(filters));
    }
    if (listContainer && BookList) {
      this.myBookList = new BookList(listContainer, (book) => this.handleBookClick(book));
    }
  }

  setupEventListeners() {
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.closeBookControl();
        }
      });
    }
  }

  // ========= Data =========
  loadAllBooks() {

    fetch('/api/book/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        this.books = data.map(book => ({
          id: book.book_id,
          title: book.book_name,
          subtitle: book.subtitle || '',
          description: book.description || '',
          cover: '/static/imgs/book-placeholder.svg',
          languages: book.support_language || [],
          chapters: book.total_chapters || 0,
          totalWords: 0,
          progress: 0,
          featured: false,
          new: false,
          lastRead: null
        }));
        this.filteredBooks = [...this.books];
        this.renderBooks();
        this.showLoading(false);
      })
      .catch(err => {
        console.error('Error fetching books:', err);
        alert('Error loading books. Please try again later.');
        this.showLoading(false);
      });
  }

  // ========= Filters =========
  handleFilterChange(filters) {
    this.currentFilters = filters;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredBooks = this.books.filter(book => {
      if (this.currentFilters.language) {
        const hasLang = book.languages.some(lang_info =>
          ((lang_info.lang || lang_info).toUpperCase() === this.currentFilters.language.toUpperCase())
        );
        if (!hasLang) return false;
      }

      if (this.currentFilters.level) {
        const hasLevel = book.languages.some(lang_info =>
          Array.isArray(lang_info.level) &&
          lang_info.level.map(lv => lv.toLowerCase()).includes(this.currentFilters.level.toLowerCase())
        );
        if (!hasLevel) return false;
      }

      return true;
    });

    this.renderBooks();
  }

  // ========= Rendering =========
  renderBooks() {
    if (this.myBookList) {
      this.myBookList.render(this.filteredBooks);
    }
    if (this.myBookFilter) {
      this.myBookFilter.updateSummary(this.filteredBooks.length, this.books.length);
    }
    this.toggleEmptyState(this.filteredBooks.length === 0 && !this.isLoading);
  }

  toggleEmptyState(show) {
    if (this.emptyState) this.emptyState.style.display = show ? 'block' : 'none';
    const list = this.container.querySelector('#book-list');
    if (list) list.style.display = show ? 'none' : 'grid';
  }

  showLoading(show) {
    this.isLoading = show;
    if (this.loadingState) this.loadingState.style.display = show ? 'block' : 'none';
    const list = this.container.querySelector('#book-list');
    if (list) list.style.display = show ? 'none' : 'grid';
  }

  // ========= Book Control =========
  handleBookClick(book) {
    this.showBookControl(book);
  }

  showBookControl(book) {
    if (this.overlay) this.overlay.style.display = 'flex';

    const addButton = this.container.querySelector('#add-book-btn');

    if (addButton) {
      addButton.onclick = () => {
        console.log(`Reading book: ${book.title}`);
        
        // update user book list
        const token = getToken();
        if (!token) {
          alert('Please log in to add books to your shelf.');
        }

        fetch('/api/book/list/user/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ book_id: book.id, action: 'add' })
        })
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then(data => {
          if (data.error) {
            alert(`Error: ${data.error}`);
          } else {
            alert(`Book "${book.title}" added to your shelf!`);
            // Optionally, refresh the user's book list here
          }
        })
        .catch(err => {
          console.error('Error updating user book list:', err);
          alert('Error adding book to your shelf. Please try again later.');
        });

        this.closeBookControl();
      
      };
    }
  }

  closeBookControl() {
    if (this.overlay) this.overlay.style.display = 'none';
  }
}
