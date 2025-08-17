// ========== Book List Component ==========
const BookList = (() => {
  let container = null;
  let books = [];
  let onBookClick = null;

  function init(containerElement, clickCallback) {
    container = containerElement;
    onBookClick = clickCallback;

    if (container) {
      container.classList.add('book-list');
    }
  }

  function render(booksData) {
    books = booksData || [];
    updateDisplay();
  }

  function updateDisplay() {
    if (!container) return;

    if (books.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No books found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    // Clear container first
    container.innerHTML = '';

    // Use BookCard API to create each card
    books.forEach(book => {
      let bookCard;

      if (window.BookCard && typeof window.BookCard.create === 'function') {
        // Use the optimized BookCard component
        bookCard = window.BookCard.create(book);

        // Override the click handler to use our onBookClick callback
        // Remove existing listeners and add our own
        const newCard = bookCard.cloneNode(true);
        setupCustomEventListeners(newCard, book);
        container.appendChild(newCard);
      } else {
        console.warn('BookCard component not found. Using legacy method.');
      }
    });
  }

  function setupCustomEventListeners(card, book) {
    // Remove any existing event listeners by cloning
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleBookClick(book);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleBookClick(book);
      }
    };

    card.addEventListener('click', handleClick);
    card.addEventListener('keydown', handleKeydown);
  }

  function handleBookClick(book) {
    if (onBookClick && typeof onBookClick === 'function') {
      onBookClick(book);
    }
  }

  function updateBook(bookId, updates) {
    const book = books.find(b => b.id === bookId);
    if (book) {
      Object.assign(book, updates);
      updateDisplay();
    }
  }

  function getBooks() {
    return [...books];
  }

  function getBook(bookId) {
    return books.find(b => b.id === bookId);
  }

  // Public API
  return {
    init,
    render,
    updateBook,
    getBooks,
    getBook
  };
})();

// Make available globally
window.BookList = BookList;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookList;
}
