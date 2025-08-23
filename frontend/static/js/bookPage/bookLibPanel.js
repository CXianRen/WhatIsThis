// ========== Main App Controller (ESM) ==========
import { toPath } from '../router/router.js';
import BookFilter from './filter.js';
import BookList from './bookList.js';
import { getToken } from '../user/login.js';

let books = [];
let filteredBooks = [];
let currentFilters = {
  language: null,
  level: null,
  search: ''
};
let isLoading = false;

let panelContainer = null;

//  components
let myBookFilter = null;
let myBookList = null;

// ========== Initialization ==========

function createBookLibraryPanel(container) {
  if (!container) return null;

  // 清空 container
  container.innerHTML = '';

  // panel container
  panelContainer = document.createElement('div');
  panelContainer.className = 'book-Library-panel';

  // header section
  const header = document.createElement('div');
  header.className = 'bookLibrary-header';
  header.innerHTML = `
    <h2>Library</h2>
  `;
  panelContainer.appendChild(header);

  // Filter section
  const filterDiv = document.createElement('div');
  filterDiv.id = 'book-filter';
  filterDiv.className = 'filter-container';

  // Books list
  const listDiv = document.createElement('div');
  listDiv.id = 'book-list';
  listDiv.className = 'books-grid';

  // Empty state
  const emptyState = document.createElement('div');
  emptyState.id = 'empty-state';
  emptyState.className = 'empty-state';
  emptyState.style.display = 'none';
  emptyState.innerHTML = `
    <div class="empty-icon">📖</div>
    <h3>No books available</h3>
  `;

  // Loading state
  const loadingState = document.createElement('div');
  loadingState.id = 'loading-state';
  loadingState.className = 'loading-state';
  loadingState.style.display = 'none';
  loadingState.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading books...</p>
  `;


  // book control panel
  // a pannel has two buttons: Read and Remove
  // when click Read, it will open jump to the reading panel
  // when click Remove, it will alert the user and remove the book from the Library
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'book-control-panel-overlay';
  overlay.style.display = 'none';

  const bookControlPanel = document.createElement('div');
  bookControlPanel.id = 'book-control-panel';
  bookControlPanel.className = 'book-control-panel';
  bookControlPanel.innerHTML = `
    <button id="add-book-btn" class="btn btn-primary">Add</button>
  `;
  overlay.appendChild(bookControlPanel);

  // Append all to container
  panelContainer.appendChild(filterDiv);
  panelContainer.appendChild(listDiv);
  panelContainer.appendChild(emptyState);
  panelContainer.appendChild(loadingState);
  container.appendChild(panelContainer);
  container.appendChild(overlay);

  // Setup the app
  setup();

  return container;
}

function setup() {
  // Initialize components
  initializeComponents();

  // Load sample data
  loadUserBooks();

  // Setup event listeners
  setupEventListeners();

  console.log('✅ Books Lib ready!');
}

function initializeComponents() {
  const filterContainer = panelContainer.querySelector('#book-filter');
  const listContainer = panelContainer.querySelector('#book-list');

  if (filterContainer && BookFilter) {
    // BookFilter.init(filterContainer, handleFilterChange);
    myBookFilter = new BookFilter(filterContainer, handleFilterChange);
  }

  if (listContainer && BookList) {
    // BookList.init(listContainer, handleBookClick);
    myBookList = new BookList(listContainer, handleBookClick);
  }
}

function setupEventListeners() {
  // Modal close events
  const overlay = panelContainer.querySelector('#book-control-panel-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeBookControl();
      }
    });
  }

  // add books button in empty state
  const el = panelContainer.querySelector('#addBooks');
  if (el) {
    el.addEventListener('click', () => {
      console.log('Navigating to library to add books');
      // toPath('library'); // Navigate to the library panel
    });
  }
}

// ========== Data Management ==========
function loadUserBooks() {

  showLoading(true);
  let token = getToken();
  if (!token) {
    console.error('No token found. User might not be logged in.');
  }

  // Fetch books from the backend
  fetch('/api/book/list/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include the token in the Authorization header
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Fetched books:', data)
      books = data.map(book => ({
        id: book.book_id,
        title: book.book_name,
        subtitle: book.subtitle || '',
        description: book.description || '',
        cover: '/static/imgs/book-placeholder.svg',
        languages: book.support_language || [],
        chapters: book.total_chapters || 0,
        totalWords: 0, // Assuming total words is not provided, set to 0
        progress: 0, // Assuming progress is not provided, set to 0
        featured: false, // Assuming featured is not provided, set to false
        new: false, // Assuming new is not provided, set to false
        lastRead: null // Assuming last read is not provided, set to null
      }));
      filteredBooks = [...books];
      renderBooks();
      showLoading(false);
    })
    .catch(error => {
      console.error('Error fetching books:', error);
      elert('Error loading books. Please try again later.');
      showLoading(false);
      // Optionally, you could show an error message to the user
      // const emptyState = document.getElementById('empty-state');
      // if (emptyState) {
      //   emptyState.innerHTML = `<h3>Error loading books. Please try again later.</h3>`;
      //   emptyState.style.display = 'block';
      // }
    });
}

// ========== Filter Management ==========
function handleFilterChange(filters) {
  currentFilters = filters;
  applyFilters();
}

function applyFilters() {
  filteredBooks = books.filter(book => {
    // Language filter
    if (currentFilters.language) {
      let lang_infos = book.languages;
      // Check if any language matches the filter
      const hasLang = lang_infos.some(lang_info =>
        ((lang_info.lang || lang_info).toUpperCase() === currentFilters.language.toUpperCase())
      );
      if (!hasLang) {
        return false;
      }
    }

    // Level filter
    if (currentFilters.level) {
      let lang_infos = book.languages;
      const hasLevel = lang_infos.some(lang_info => {
        // Ensure lang_info.level exists and is an array
        if (lang_info.level && Array.isArray(lang_info.level)) {
          return lang_info.level.map(lv => lv.toLowerCase()).includes(currentFilters.level.toLowerCase());
        }
        return false;
      });
      if (!hasLevel) {
        return false;
      }
    }

    // If passed all filters, include the book
    return true;
  });

  renderBooks();
}

// ========== Rendering ==========
function renderBooks() {
  if (myBookList) {
    myBookList.render(filteredBooks);
  }

  // Update filter summary
  updateFilterSummary();

  // Show/hide empty state
  toggleEmptyState(filteredBooks.length === 0 && !isLoading);
}

function updateFilterSummary() {
  // This would be handled by the Filter component
  if (myBookFilter) {
    myBookFilter.updateSummary(filteredBooks.length, books.length);
  }
}

function toggleEmptyState(show) {
  const emptyState = panelContainer.querySelector('#empty-state');
  const booksList = panelContainer.querySelector('#book-list');

  if (emptyState) {
    emptyState.style.display = show ? 'block' : 'none';
  }
  if (booksList) {
    booksList.style.display = show ? 'none' : 'grid';
  }
}

function showLoading(show) {
  isLoading = show;
  const loadingState = panelContainer.querySelector('#loading-state');
  const booksList = panelContainer.querySelector('#book-list');

  if (loadingState) {
    loadingState.style.display = show ? 'block' : 'none';
  }
  if (booksList) {
    booksList.style.display = show ? 'none' : 'grid';
  }
}

// ========== Book Detail Modal ==========
function handleBookClick(book) {
  showBookControl(book);
}

function showBookControl(book) {
  // Show the overlay


  const overlay = panelContainer.querySelector('#book-control-panel-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }

  // Set up the buttons
  const addButton = panelContainer.querySelector('#add-book-btn');
  console.log('Setting up Read button for book:', book);

  if (addButton) {
    addButton.onclick = () => {
      // Handle reading the book
      console.log(`Reading book: ${book.title}`);
      closeBookControl();
      toPath('reader'); // Navigate to the reading panel
      // Here you would typically navigate to the reading panel
    };
  }
}

function closeBookControl() {
  const overlay = panelContainer.querySelector('#book-control-panel-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ========== Default export ==========
export {
  createBookLibraryPanel
};
