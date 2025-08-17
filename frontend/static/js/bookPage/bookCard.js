// ========== Optimized Book Card Component ==========
const BookCard = (() => {
  
  function create(book) {
    const card = document.createElement("div");
    card.className = "book-card";
    card.setAttribute('tabindex', '0'); // For accessibility
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打開書籍: ${book.title}`);
    
    // Build cover section
    const coverHtml = createCoverHtml(book);
    
    // Build content section
    const contentHtml = createContentHtml(book);
    
    // Build meta section
    const metaHtml = createMetaHtml(book);
    
    card.innerHTML = `
      ${coverHtml}
      <div class="book-content">
        ${contentHtml}
        ${metaHtml}
      </div>
    `;
    
    // Add event listeners
    setupCardEventListeners(card, book);
    
    return card;
  }
  
  function createCoverHtml(book) {
    const hasImage = book.cover && book.cover.trim() !== '';
    const imageSrc = hasImage ? book.cover : '/static/imgs/book-placeholder.svg';
    
    return `
      <div class="book-cover">
        <img 
          src="${imageSrc}" 
          alt="${book.title}" 
          class="book-cover-img"
          loading="lazy"
          onerror="this.src='/static/imgs/book-placeholder.svg'"
        >
        <div class="book-tags">
          ${createLanguageTags(book.languages)}
          ${createLevelTag(book.level)}
        </div>
        ${createProgressBar(book.progress)}
      </div>
    `;
  }
  
  function createLanguageTags(languages) {
    if (!languages || languages.length === 0) return '';
    
    return languages.map(lang => 
      `<span class="language-tag">${lang.toUpperCase()}</span>`
    ).join('');
  }
  
  function createLevelTag(level) {
    if (!level) return '';
    
    const levelClass = level.toLowerCase();
    return `<span class="level-tag ${levelClass}">${level}</span>`;
  }
  
  function createProgressBar(progress) {
    if (!progress || progress === 0) return '';
    
    return `
      <div class="book-progress">
        <div class="book-progress-bar" style="width: ${progress}%"></div>
      </div>
    `;
  }
  
  function createContentHtml(book) {
    const title = escapeHtml(book.title || '未知標題');
    const description = escapeHtml(book.description || '暫無描述');
    const truncatedDescription = truncateText(description, 100);
    
    return `
      <h3 class="book-title">${title}</h3>
      <p class="book-description">${truncatedDescription}</p>
    `;
  }
  
  function createMetaHtml(book) {
    const chapterCount = book.chapters || 0;
    const readingTime = estimateReadingTime(book.wordCount || 0);
    
    return `
      <div class="book-meta">
        <div class="book-stats">
          <span class="chapter-count">${chapterCount} 章節</span>
          ${readingTime ? `<span class="reading-time">約 ${readingTime}</span>` : ''}
        </div>
        <div class="book-level">
          <span class="reading-level">${book.level || 'N/A'}</span>
        </div>
      </div>
    `;
  }
  
  function setupCardEventListeners(card, book) {
    // Click event
    const handleClick = () => {
      if (window.BookDetail && typeof window.BookDetail.show === 'function') {
        window.BookDetail.show(book);
      } else {
        console.warn('BookDetail component not available');
      }
    };
    
    // Mouse events
    card.addEventListener('click', handleClick);
    
    // Keyboard events for accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
    
    // Add loading state on image load
    const img = card.querySelector('.book-cover-img');
    if (img) {
      img.addEventListener('load', () => {
        card.classList.remove('loading');
      });
      
      img.addEventListener('error', () => {
        console.warn(`Failed to load image for book: ${book.title}`);
        card.classList.remove('loading');
      });
    }
  }
  
  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }
  
  function estimateReadingTime(wordCount) {
    if (!wordCount || wordCount === 0) return null;
    
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes < 60) {
      return `${minutes} 分鐘`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} 小時`;
    }
    
    return `${hours}小時${remainingMinutes}分鐘`;
  }
  
  // Create loading placeholder
  function createLoadingCard() {
    const card = document.createElement("div");
    card.className = "book-card loading";
    card.innerHTML = `
      <div class="book-cover">
        <div class="book-cover-placeholder">
          <div class="loading-spinner"></div>
        </div>
      </div>
      <div class="book-content">
        <div class="book-title loading-text"></div>
        <div class="book-description loading-text"></div>
        <div class="book-meta">
          <div class="loading-text small"></div>
          <div class="loading-text small"></div>
        </div>
      </div>
    `;
    return card;
  }
  
  // Public API
  return {
    create,
    createLoadingCard
  };
})();

// Make available globally
window.BookCard = BookCard;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookCard;
}
