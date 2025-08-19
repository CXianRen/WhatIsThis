// ========== Main App Controller (ESM) ==========
import { StorageUtils, ThemeUtils, DOMUtils } from './utils.js';
import BookFilter from './filter.js';
import BookList from './bookList.js';
import BookDetail from './bookDetail.js';

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
async function init() {
  console.log('📚 Books App initializing...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
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
  const modal = document.getElementById('book-detail-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeBookDetail();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookDetail();
    }
  });

  // Theme detection
  setupTheme();
}

function setupTheme() {
  // Use ThemeUtils from utils.js
  const savedTheme = ThemeUtils.getTheme();
  ThemeUtils.applyTheme(savedTheme);
  
  // Listen for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (savedTheme === 'system') {
      ThemeUtils.applyTheme('system');
    }
  });
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
  showBookDetail(book);
}

function showBookDetail(book) {
  const modal = document.getElementById("book-detail-modal");
  const container = document.getElementById("book-detail");
  
  if (modal && container && BookDetail) {
    // Show the modal with proper animation
    modal.style.display = "flex";
    
    // Use requestAnimationFrame to ensure smooth animation
    requestAnimationFrame(() => {
      modal.classList.add("modal-show");
    });
    
    BookDetail.show(book, container, closeBookDetail);
    
    // Focus management for accessibility
    setTimeout(() => {
      const closeBtn = container.querySelector(".book-detail-close");
      if (closeBtn) closeBtn.focus();
    }, 100);
    
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    
    // Add escape key listener
    modalKeyHandler = (e) => {
      if (e.key === "Escape") {
        closeBookDetail();
      }
    };
    document.addEventListener("keydown", modalKeyHandler);
  }
}

function closeBookDetail() {
  const modal = document.getElementById("book-detail-modal");
  if (modal) {
    // Animate out
    modal.classList.remove("modal-show");
    
    // Hide after animation completes
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
    
    document.body.style.overflow = "";
    
    // Remove escape key listener
    if (modalKeyHandler) {
      document.removeEventListener("keydown", modalKeyHandler);
      modalKeyHandler = null;
    }
  }
}

// ========== Public API ==========
export function addBook(book) {
  books.push({
    id: Date.now(),
    progress: 0,
    featured: false,
    new: true,
    lastRead: null,
    ...book
  });
  applyFilters();
}

export function removeBook(bookId) {
  books = books.filter(book => book.id !== bookId);
  applyFilters();
}

export function updateBookProgress(bookId, progress) {
  const book = books.find(b => b.id === bookId);
  if (book) {
    book.progress = Math.max(0, Math.min(100, progress));
    book.lastRead = new Date().toISOString().split('T')[0];
    renderBooks();
  }
}

export function getBooks() {
  return [...books];
}

export function getFilteredBooks() {
  return [...filteredBooks];
}

// ========== Initialize the app ==========
init();

// ========== Default export ==========
export default {
  addBook,
  removeBook,
  updateBookProgress,
  getBooks,
  getFilteredBooks,
  showBookDetail,
  closeBookDetail
};
