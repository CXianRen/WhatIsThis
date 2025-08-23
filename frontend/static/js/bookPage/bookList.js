// bookList.js
import BookCard from './bookCard.js';

class BookList {
  constructor(containerElement, clickCallback) {
    this.container = containerElement;
    this.books = [];
    this.onBookClick = clickCallback;

    if (this.container) {
      this.container.classList.add('book-list');
    }
  }

  render(booksData) {
    this.books = booksData || [];
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.books.forEach(book => {
      let bookCard;
      if (BookCard && typeof BookCard.create === 'function') {
        bookCard = BookCard.create(book);
        const newCard = bookCard.cloneNode(true);
        this.setupCustomEventListeners(newCard, book);
        this.container.appendChild(newCard);
      }
    });
  }

  setupCustomEventListeners(card, book) {
    card.addEventListener('click', () => this.handleBookClick(book));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleBookClick(book);
      }
    });
  }

  handleBookClick(book) {
    if (this.onBookClick) {
      this.onBookClick(book);
    }
  }

  updateBook(bookId, updates) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      Object.assign(book, updates);
      this.updateDisplay();
    }
  }

  getBooks() {
    return [...this.books];
  }

  getBook(bookId) {
    return this.books.find(b => b.id === bookId);
  }
}

export default BookList;
