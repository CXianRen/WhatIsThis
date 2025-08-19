// ========== Main App Controller (ESM) ==========
import { toPath } from '../router/router.js';
import { StorageUtils, ThemeUtils, DOMUtils } from './utils.js';
import BookFilter from './filter.js';
import BookList from './bookList.js';

let books = [];
let filteredBooks = [];
let currentFilters = {
  language: null,
  level: null,
  search: ''
};
let isLoading = false;
let modalKeyHandler = null;

// ========== Initialization ==========

function createBookShelfPanel(container) {
  if (!container) return null;

  // 清空 container
  container.innerHTML = '';

  // panel container
  const panelContainer = document.createElement('div');
  panelContainer.className = 'book-shelf-panel';

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
  // when click Remove, it will alert the user and remove the book from the shelf
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'book-control-panel-overlay';
  overlay.style.display = 'none';

  const bookControlPanel = document.createElement('div');
  bookControlPanel.id = 'book-control-panel';
  bookControlPanel.className = 'book-control-panel';
  bookControlPanel.innerHTML = `
    <button id="read-book-btn" class="btn btn-primary">Read</button>
    <button id="remove-book-btn" class="btn btn-secondary">Remove</button>
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
  loadSampleBooks();

  // Setup event listeners
  setupEventListeners();

  console.log('✅ Books App ready!');
}

function initializeComponents() {
  const filterContainer = document.getElementById('book-filter');
  const listContainer = document.getElementById('book-list');

  if (filterContainer && BookFilter) {
    BookFilter.init(filterContainer, handleFilterChange);
  }

  if (listContainer && BookList) {
    BookList.init(listContainer, handleBookClick);
  }
}

function setupEventListeners() {
  // Modal close events
  const overlay = document.getElementById('book-control-panel-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeBookControl();
      }
    });
  }
}

// ========== Data Management ==========
function loadSampleBooks() {
  showLoading(true);

  // Simulate API call
  setTimeout(() => {
    books = [
      {
        id: 1,
        title: "Swedish for Beginners",
        subtitle: "Learn Swedish from scratch",
        description: "A comprehensive guide to learning Swedish for absolute beginners. This book covers basic grammar, essential vocabulary, and practical conversations that you'll need in everyday situations. Perfect for those starting their Swedish learning journey.",
        cover: "/static/imgs/book-placeholder.svg",
        languages: ["SV"],
        level: "A1",
        chapters: 12,
        totalWords: 2500,
        progress: 0,
        featured: true,
        new: false,
        lastRead: null
      },
      {
        id: 2,
        title: "French B2 Reader",
        subtitle: "Intermediate French stories",
        description: "Improve your French reading skills with engaging short stories designed for intermediate learners. Each story includes vocabulary notes and comprehension exercises to help you progress to advanced level.",
        cover: "/static/imgs/book-placeholder.svg",
        languages: ["FR"],
        level: "B2",
        chapters: 20,
        totalWords: 5200,
        progress: 35,
        featured: false,
        new: false,
        lastRead: "2024-08-15"
      },
      {
        id: 3,
        title: "English Business Conversations",
        subtitle: "Professional English for workplace",
        description: "Master professional English communication with practical business conversations, email templates, and presentation skills. Essential for career advancement in international business environments.",
        cover: "/static/imgs/book-placeholder.svg",
        languages: ["EN"],
        level: "B2",
        chapters: 15,
        totalWords: 3800,
        progress: 60,
        featured: false,
        new: true,
        lastRead: "2024-08-16"
      },
      {
        id: 4,
        title: "Intermediate Chinese Stories",
        subtitle: "HSK 4-5 level reading practice",
        description: "Collection of contemporary Chinese stories for intermediate learners. Stories are carefully selected to match HSK 4-5 vocabulary and include pinyin annotations and cultural notes.",
        cover: "/static/imgs/book-placeholder.svg",
        languages: ["ZH"],
        level: "B1",
        chapters: 18,
        totalWords: 4200,
        progress: 0,
        featured: false,
        new: true,
        lastRead: null
      },
      {
        id: 5,
        title: "Advanced German Literature",
        subtitle: "Classic German texts",
        description: "Explore classic German literature with modern annotations and analysis. This collection includes excerpts from famous authors like Goethe, Kafka, and Mann, with detailed explanations of complex language structures.",
        cover: "/static/imgs/book-placeholder.svg",
        languages: ["DE"],
        level: "C1",
        chapters: 25,
        totalWords: 8500,
        progress: 12,
        featured: true,
        new: false,
        lastRead: "2024-08-10"
      }
    ];

    filteredBooks = [...books];
    renderBooks();
    showLoading(false);
  }, 1000);
}

// ========== Filter Management ==========
function handleFilterChange(filters) {
  currentFilters = filters;
  applyFilters();
}

function applyFilters() {
  filteredBooks = books.filter(book => {
    // Language filter
    if (currentFilters.language && !book.languages.includes(currentFilters.language.toUpperCase())) {
      return false;
    }

    // Level filter
    if (currentFilters.level && book.level.toLowerCase() !== currentFilters.level.toLowerCase()) {
      return false;
    }

    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const searchableText = [
        book.title,
        book.subtitle,
        book.description,
        ...book.languages
      ].join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  renderBooks();
}

// ========== Rendering ==========
function renderBooks() {
  if (BookList) {
    BookList.render(filteredBooks);
  }

  // Update filter summary
  updateFilterSummary();

  // Show/hide empty state
  toggleEmptyState(filteredBooks.length === 0 && !isLoading);
}

function updateFilterSummary() {
  // This would be handled by the Filter component
  if (BookFilter) {
    BookFilter.updateSummary(filteredBooks.length, books.length);
  }
}

function toggleEmptyState(show) {
  const emptyState = document.getElementById('empty-state');
  const booksList = document.getElementById('book-list');

  if (emptyState) {
    emptyState.style.display = show ? 'block' : 'none';
  }
  if (booksList) {
    booksList.style.display = show ? 'none' : 'grid';
  }
}

function showLoading(show) {
  isLoading = show;
  const loadingState = document.getElementById('loading-state');
  const booksList = document.getElementById('book-list');

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
  const overlay = document.getElementById('book-control-panel-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }

  // Set up the buttons
  const readButton = document.getElementById('read-book-btn');
  const removeButton = document.getElementById('remove-book-btn');

  if (readButton) {
    readButton.onclick = () => {
      // Handle reading the book
      console.log(`Reading book: ${book.title}`);
      closeBookControl();
      toPath(`read-panel`); // Navigate to the reading panel
      // Here you would typically navigate to the reading panel
    };
  }

  if (removeButton) {
    removeButton.onclick = () => {
      // Handle removing the book
      const confirmRemove = confirm(`Are you sure you want to remove "${book.title}" from your shelf?`);
      if (confirmRemove) {
        books = books.filter(b => b.id !== book.id);
        filteredBooks = filteredBooks.filter(b => b.id !== book.id);
        renderBooks();
        closeBookControl();
      }
    };
  }

}

function closeBookControl() {
  const overlay = document.getElementById('book-control-panel-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ========== Default export ==========
export {
  createBookShelfPanel
};
