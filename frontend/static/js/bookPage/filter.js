// ========== Simplified Book Filter Component ==========
const BookFilter = (() => {
  let container = null;
  let filterCallback = null;
  let currentFilters = {
    language: null,
    level: null,
    search: ''
  };

  function init(containerElement, onFilterChange) {
    container = containerElement;
    filterCallback = onFilterChange;
    render();
    setupEventListeners();
  }

  function render() {
    if (!container) return;

    container.innerHTML = `
      <div class="search-container">
        <input 
          type="text" 
          id="book-search" 
          class="search-input" 
          placeholder="搜索書籍、作者或語言..."
          value="${currentFilters.search}"
        >
        <button class="search-clear" id="search-clear" style="display: ${currentFilters.search ? 'block' : 'none'}">
          ×
        </button>
      </div>
      
      <div class="filter-controls">
        <div class="filter-group">
          <label for="filter-language">語言:</label>
          <select id="filter-language" class="filter-select">
            <option value="">全部語言</option>
            <option value="EN" ${currentFilters.language === 'EN' ? 'selected' : ''}>English</option>
            <option value="SV" ${currentFilters.language === 'SV' ? 'selected' : ''}>Svenska</option>
            <option value="FR" ${currentFilters.language === 'FR' ? 'selected' : ''}>Français</option>
            <option value="DE" ${currentFilters.language === 'DE' ? 'selected' : ''}>Deutsch</option>
            <option value="ZH" ${currentFilters.language === 'ZH' ? 'selected' : ''}>中文</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-level">等級:</label>
          <select id="filter-level" class="filter-select">
            <option value="">全部等級</option>
            <option value="A1" ${currentFilters.level === 'A1' ? 'selected' : ''}>A1 - 初級</option>
            <option value="A2" ${currentFilters.level === 'A2' ? 'selected' : ''}>A2 - 初中級</option>
            <option value="B1" ${currentFilters.level === 'B1' ? 'selected' : ''}>B1 - 中級</option>
            <option value="B2" ${currentFilters.level === 'B2' ? 'selected' : ''}>B2 - 中高級</option>
            <option value="C1" ${currentFilters.level === 'C1' ? 'selected' : ''}>C1 - 高級</option>
            <option value="C2" ${currentFilters.level === 'C2' ? 'selected' : ''}>C2 - 精通</option>
          </select>
        </div>
        
        <button class="filter-clear" id="filter-clear" ${hasActiveFilters() ? '' : 'disabled'}>
          清除篩選
        </button>
      </div>
      
      <div class="filter-summary" id="filter-summary">
        <span class="result-count">0 本書籍</span>
        <div class="active-filters" id="active-filters"></div>
      </div>
    `;
  }

  function setupEventListeners() {
    if (!container) return;

    // Search input with debouncing
    const searchInput = container.querySelector('#book-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentFilters.search = e.target.value;
          updateSearchClearButton();
          notifyFilterChange();
        }, 300);
      });
    }

    // Search clear button
    const searchClear = container.querySelector('#search-clear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        currentFilters.search = '';
        searchInput.value = '';
        updateSearchClearButton();
        notifyFilterChange();
      });
    }

    // Language filter
    const languageSelect = container.querySelector('#filter-language');
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        currentFilters.language = e.target.value || null;
        notifyFilterChange();
      });
    }

    // Level filter
    const levelSelect = container.querySelector('#filter-level');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        currentFilters.level = e.target.value || null;
        notifyFilterChange();
      });
    }

    // Clear filters button
    const clearButton = container.querySelector('#filter-clear');
    if (clearButton) {
      clearButton.addEventListener('click', clearAllFilters);
    }
  }

  function updateSearchClearButton() {
    const clearButton = container?.querySelector('#search-clear');
    if (clearButton) {
      clearButton.style.display = currentFilters.search ? 'block' : 'none';
    }
  }

  function hasActiveFilters() {
    return currentFilters.search || 
           currentFilters.language || 
           currentFilters.level;
  }

  function clearAllFilters() {
    currentFilters = {
      language: null,
      level: null,
      search: ''
    };
    
    // Update UI elements
    const searchInput = container?.querySelector('#book-search');
    if (searchInput) searchInput.value = '';
    
    const languageSelect = container?.querySelector('#filter-language');
    if (languageSelect) languageSelect.value = '';
    
    const levelSelect = container?.querySelector('#filter-level');
    if (levelSelect) levelSelect.value = '';
    
    updateSearchClearButton();
    updateClearButton();
    notifyFilterChange();
  }

  function updateClearButton() {
    const clearButton = container?.querySelector('#filter-clear');
    if (clearButton) {
      clearButton.disabled = !hasActiveFilters();
    }
  }

  function notifyFilterChange() {
    updateClearButton();
    updateActiveFiltersDisplay();
    
    if (filterCallback) {
      filterCallback(currentFilters);
    }
  }

  function updateActiveFiltersDisplay() {
    const activeFiltersContainer = container?.querySelector('#active-filters');
    if (!activeFiltersContainer) return;

    const activeFilters = [];
    
    if (currentFilters.search) {
      activeFilters.push(`搜索: "${currentFilters.search}"`);
    }
    
    if (currentFilters.language) {
      const languageName = getLanguageName(currentFilters.language);
      activeFilters.push(`語言: ${languageName}`);
    }
    
    if (currentFilters.level) {
      activeFilters.push(`等級: ${currentFilters.level}`);
    }

    if (activeFilters.length > 0) {
      activeFiltersContainer.innerHTML = `
        <div class="filter-tags">
          ${activeFilters.map(filter => `<span class="filter-tag">${filter}</span>`).join('')}
        </div>
      `;
    } else {
      activeFiltersContainer.innerHTML = '';
    }
  }

  function getLanguageName(code) {
    const names = {
      'EN': 'English',
      'SV': 'Svenska', 
      'FR': 'Français',
      'DE': 'Deutsch',
      'ZH': '中文'
    };
    return names[code] || code;
  }

  function updateSummary(filteredCount, totalCount) {
    const summaryElement = container?.querySelector('.result-count');
    if (summaryElement) {
      if (filteredCount === totalCount) {
        summaryElement.textContent = `${totalCount} 本書籍`;
      } else {
        summaryElement.textContent = `${filteredCount} / ${totalCount} 本書籍`;
      }
    }
  }

  function getFilters() {
    return { ...currentFilters };
  }

  function setFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    render();
    notifyFilterChange();
  }

  // Public API
  return {
    init,
    updateSummary,
    getFilters,
    setFilters,
    clearAllFilters
  };
})();

// Make available globally
window.BookFilter = BookFilter;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookFilter;
}
