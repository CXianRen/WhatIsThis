// ========== Book Detail Component ==========
const BookDetail = (() => {
  let currentBook = null;
  let closeCallback = null;

  function show(book, container, onClose) {
    currentBook = book;
    closeCallback = onClose;

    if (!container) {
      console.error('BookDetail: No container provided');
      return;
    }

    render(container);
  }

  function render(container) {
    if (!currentBook || !container) return;

    const book = currentBook;

    // Language badges
    const languageBadges = book.languages.map(lang => {
      const langInfo = window.BookUtils?.Language.getLanguageInfo(lang) || { name: lang, flag: '🌐', color: '#6b7280' };
      return `<span class="language-badge" style="background-color: ${langInfo.color};">
        ${langInfo.flag} ${langInfo.name}
      </span>`;
    }).join('');

    // Level info
    const levelInfo = window.BookUtils?.Level.getLevelInfo(book.level) || { name: book.level, color: '#6b7280' };

    // Progress info
    const progressPercentage = book.progress || 0;
    const progressColor = getProgressColor(progressPercentage);

    // Last read info
    const lastReadText = book.lastRead
      ? window.BookUtils?.Date.formatRelativeDate(book.lastRead) || book.lastRead
      : 'Never read';

    const formattedDate = book.lastRead
      ? window.BookUtils?.Date.formatDate(book.lastRead) || book.lastRead
      : null;

    container.innerHTML = `
      <div class="book-detail-header">
        <button class="book-detail-close" aria-label="Close book details">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="book-detail-content">
        <div class="book-detail-cover">
          <img src="${book.cover || '/static/placeholder.svg'}" alt="${escapeHTML(book.title)} cover">
          
          <div class="book-status-badges">
            ${book.featured ? '<span class="status-badge featured">⭐ Featured</span>' : ''}
            ${book.new ? '<span class="status-badge new">🆕 New</span>' : ''}
          </div>
        </div>

        <div class="book-detail-info">
          <div class="book-header">
            <h1 class="book-title">${escapeHTML(book.title)}</h1>
            ${book.subtitle ? `<h2 class="book-subtitle">${escapeHTML(book.subtitle)}</h2>` : ''}
            
            <div class="book-meta">
              <div class="book-badges">
                ${languageBadges}
                <span class="level-badge" style="background-color: ${levelInfo.color};">
                  ${book.level} - ${levelInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div class="book-description">
            <p>${escapeHTML(book.description || 'No description available.')}</p>
          </div>

          <div class="book-stats-grid">
            <div class="stat-item">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Chapters</div>
                <div class="stat-value">${book.chapters}</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Total Words</div>
                <div class="stat-value">${book.totalWords?.toLocaleString() || 'Unknown'}</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Last Read</div>
                <div class="stat-value" title="${formattedDate || 'Never'}">${lastReadText}</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Difficulty</div>
                <div class="stat-value">${levelInfo.name}</div>
              </div>
            </div>
          </div>

          <div class="book-progress-section">
            <div class="progress-header">
              <h3>Reading Progress</h3>
              <span class="progress-percentage">${progressPercentage}%</span>
            </div>
            
            <div class="progress-bar-large">
              <div class="progress-fill" style="width: ${progressPercentage}%; background-color: ${progressColor};"></div>
            </div>
            
            <div class="progress-description">
              ${getProgressDescription(progressPercentage, book.chapters)}
            </div>
          </div>

<div class="book-actions">
            <button class="book-detail-btn primary" onclick="startReading(${book.id})">
              ${progressPercentage > 0 ? 'Continue Reading' : 'Start Reading'}
            </button>
            
            <button class="book-detail-btn secondary" onclick="addToLibrary(${book.id})">
              ${book.inLibrary ? 'Remove from Library' : 'Add to Library'}
            </button>
            
          </div>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    setupEventListeners(container);
  }

  function setupEventListeners(container) {
    // Close button
    const closeBtn = container.querySelector('.book-detail-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hide);
    }

    // Note: Keyboard navigation is handled by the main app

    // Store the handler to remove it later
    container._keydownHandler = handleKeydown;
  }

  function hide() {
    if (closeCallback && typeof closeCallback === 'function') {
      closeCallback();
    }

    // Clean up event listeners
    const container = document.getElementById('book-detail');
    if (container && container._keydownHandler) {
      document.removeEventListener('keydown', container._keydownHandler);
      delete container._keydownHandler;
    }

    currentBook = null;
    closeCallback = null;
  }

  function getProgressColor(percentage) {
    if (percentage === 0) return '#d1d5db';
    if (percentage < 25) return '#fbbf24';
    if (percentage < 75) return '#3b82f6';
    if (percentage < 100) return '#8b5cf6';
    return '#10b981';
  }

  function getProgressDescription(percentage, totalChapters) {
    if (percentage === 0) {
      return 'Ready to start your reading journey!';
    }

    const completedChapters = Math.floor((percentage / 100) * totalChapters);
    const remainingChapters = totalChapters - completedChapters;

    if (percentage === 100) {
      return '🎉 Congratulations! You\'ve completed this book.';
    } else if (percentage >= 75) {
      return `Almost there! ${remainingChapters} chapter${remainingChapters !== 1 ? 's' : ''} remaining.`;
    } else if (percentage >= 25) {
      return `Good progress! You've completed ${completedChapters} chapter${completedChapters !== 1 ? 's' : ''}.`;
    } else {
      return `Just getting started. ${remainingChapters} chapter${remainingChapters !== 1 ? 's' : ''} to go.`;
    }
  }

  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  return {
    show,
    hide
  };
})();

// Global action functions (these would typically be handled by the main app)
window.startReading = function (bookId) {
  console.log('Starting to read book:', bookId);
  // This would typically navigate to the reading interface
  alert(`Starting to read book ${bookId}. This would navigate to the reading interface.`);
};

window.addToLibrary = function (bookId) {
  console.log('Adding book to library:', bookId);
  // This would typically make an API call to add/remove from library
  alert(`Toggle library status for book ${bookId}`);
};


// Make available globally
window.BookDetail = BookDetail;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookDetail;
}
