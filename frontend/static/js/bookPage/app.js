// ========== Main App Controller ==========
class BooksApp {
  constructor() {
    this.books = [];
    this.filteredBooks = [];
    this.currentFilters = {
      language: null,
      level: null,
      search: ''
    };
    this.isLoading = false;
    
    this.init();
  }

  async init() {
    console.log('📚 Books App initializing...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Initialize components
    this.initializeComponents();
    
    // Load sample data
    this.loadSampleBooks();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('✅ Books App ready!');
  }

  initializeComponents() {
    const filterContainer = document.getElementById('book-filter');
    const listContainer = document.getElementById('book-list');
    
    if (filterContainer && typeof BookFilter !== 'undefined') {
      BookFilter.init(filterContainer, (filters) => this.handleFilterChange(filters));
    }
    
    if (listContainer && typeof BookList !== 'undefined') {
      BookList.init(listContainer, (book) => this.handleBookClick(book));
    }
  }

  setupEventListeners() {
    // Modal close events
    const modal = document.getElementById('book-detail-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeBookDetail();
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeBookDetail();
      }
    });

    // Theme detection
    this.setupTheme();
  }

  setupTheme() {
    // Read theme preference from localStorage (similar to Settings page)
    const themeKey = 'wit:theme';
    const savedTheme = localStorage.getItem(themeKey) || 'system';
    
    this.applyTheme(savedTheme);
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (savedTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      html.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
    }
  }

  loadSampleBooks() {
    this.showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      this.books = [
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
      
      this.filteredBooks = [...this.books];
      this.renderBooks();
      this.showLoading(false);
    }, 1000);
  }

  handleFilterChange(filters) {
    this.currentFilters = filters;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredBooks = this.books.filter(book => {
      // Language filter
      if (this.currentFilters.language && !book.languages.includes(this.currentFilters.language.toUpperCase())) {
        return false;
      }
      
      // Level filter
      if (this.currentFilters.level && book.level.toLowerCase() !== this.currentFilters.level.toLowerCase()) {
        return false;
      }
      
      // Search filter
      if (this.currentFilters.search) {
        const searchTerm = this.currentFilters.search.toLowerCase();
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
    
    this.renderBooks();
  }

  renderBooks() {
    if (typeof BookList !== 'undefined') {
      BookList.render(this.filteredBooks);
    }
    
    // Update filter summary
    this.updateFilterSummary();
    
    // Show/hide empty state
    this.toggleEmptyState(this.filteredBooks.length === 0 && !this.isLoading);
  }

  updateFilterSummary() {
    // This would be handled by the Filter component
    if (typeof BookFilter !== 'undefined') {
      BookFilter.updateSummary(this.filteredBooks.length, this.books.length);
    }
  }

  toggleEmptyState(show) {
    const emptyState = document.getElementById('empty-state');
    const booksList = document.getElementById('book-list');
    
    if (emptyState) {
      emptyState.style.display = show ? 'block' : 'none';
    }
    if (booksList) {
      booksList.style.display = show ? 'none' : 'grid';
    }
  }

  showLoading(show) {
    this.isLoading = show;
    const loadingState = document.getElementById('loading-state');
    const booksList = document.getElementById('book-list');
    
    if (loadingState) {
      loadingState.style.display = show ? 'block' : 'none';
    }
    if (booksList) {
      booksList.style.display = show ? 'none' : 'grid';
    }
  }

  handleBookClick(book) {
    this.showBookDetail(book);
  }

  showBookDetail(book) {
    const modal = document.getElementById("book-detail-modal");
    const container = document.getElementById("book-detail");
    
    if (modal && container && typeof BookDetail !== "undefined") {
      // Show the modal with proper animation
      modal.style.display = "flex";
      
      // Use requestAnimationFrame to ensure smooth animation
      requestAnimationFrame(() => {
        modal.classList.add("modal-show");
      });
      
      BookDetail.show(book, container, () => this.closeBookDetail());
      
      // Focus management for accessibility
      setTimeout(() => {
        const closeBtn = container.querySelector(".book-detail-close");
        if (closeBtn) closeBtn.focus();
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      
      // Add escape key listener
      this._modalKeyHandler = (e) => {
        if (e.key === "Escape") {
          this.closeBookDetail();
        }
      };
      document.addEventListener("keydown", this._modalKeyHandler);
    }
  }

  closeBookDetail() {
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
      if (this._modalKeyHandler) {
        document.removeEventListener("keydown", this._modalKeyHandler);
        this._modalKeyHandler = null;
      }
    }
  }

  // Public API for extending functionality
  addBook(book) {
    this.books.push({
      id: Date.now(),
      progress: 0,
      featured: false,
      new: true,
      lastRead: null,
      ...book
    });
    this.applyFilters();
  }

  removeBook(bookId) {
    this.books = this.books.filter(book => book.id !== bookId);
    this.applyFilters();
  }

  updateBookProgress(bookId, progress) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.progress = Math.max(0, Math.min(100, progress));
      book.lastRead = new Date().toISOString().split('T')[0];
      this.renderBooks();
    }
  }
}

// ========== Initialize App ==========
window.BooksApp = new BooksApp();

// ========== Export for module usage ==========
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BooksApp;
}
