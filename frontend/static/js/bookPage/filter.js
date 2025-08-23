// ========== Book Filter Component (Class-based ESM) ==========
class BookFilter {
  constructor(containerElement, onFilterChange) {
    this.container = containerElement;
    this.filterCallback = onFilterChange;
    this.currentFilters = {
      language: null,
      level: null,
      search: ''
    };

    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `    
      <div class="filter-controls">
        <div class="filter-group">
          <label class="filter-label" for="filter-language">Lang</label>
          <select id="filter-language" class="filter-select">
            <option value="">All</option>
            <option value="EN" ${this.currentFilters.language === 'EN' ? 'selected' : ''}>English</option>
            <option value="SV" ${this.currentFilters.language === 'SV' ? 'selected' : ''}>Svenska</option>
            <option value="FR" ${this.currentFilters.language === 'FR' ? 'selected' : ''}>Français</option>
            <option value="DE" ${this.currentFilters.language === 'DE' ? 'selected' : ''}>Deutsch</option>
            <option value="ZH" ${this.currentFilters.language === 'ZH' ? 'selected' : ''}>中文</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label" for="filter-level">Level</label>
          <select id="filter-level" class="filter-select">
            <option value="">All</option>
            <option value="A1" ${this.currentFilters.level === 'A1' ? 'selected' : ''}>A1</option>
            <option value="A2" ${this.currentFilters.level === 'A2' ? 'selected' : ''}>A2</option>
            <option value="B1" ${this.currentFilters.level === 'B1' ? 'selected' : ''}>B1</option>
            <option value="B2" ${this.currentFilters.level === 'B2' ? 'selected' : ''}>B2</option>
            <option value="C1" ${this.currentFilters.level === 'C1' ? 'selected' : ''}>C1</option>
            <option value="C2" ${this.currentFilters.level === 'C2' ? 'selected' : ''}>C2</option>
          </select>
        </div>
        
        <button class="filter-clear" id="filter-clear" ${this.hasActiveFilters() ? '' : 'disabled'}>
          Clear Filters
        </button>
      </div>
      
      <div class="filter-summary" id="filter-summary">
        <span class="result-count">0 Book</span>
        <div class="active-filters" id="active-filters"></div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.container) return;

    // Language filter
    const languageSelect = this.container.querySelector('#filter-language');
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.currentFilters.language = e.target.value || null;
        this.notifyFilterChange();
      });
    }

    // Level filter
    const levelSelect = this.container.querySelector('#filter-level');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        this.currentFilters.level = e.target.value || null;
        this.notifyFilterChange();
      });
    }

    // Clear filters button
    const clearButton = this.container.querySelector('#filter-clear');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearAllFilters());
    }
  }

  hasActiveFilters() {
    return this.currentFilters.search ||
           this.currentFilters.language ||
           this.currentFilters.level;
  }

  clearAllFilters() {
    this.currentFilters = {
      language: null,
      level: null,
      search: ''
    };

    const languageSelect = this.container?.querySelector('#filter-language');
    if (languageSelect) languageSelect.value = '';

    const levelSelect = this.container?.querySelector('#filter-level');
    if (levelSelect) levelSelect.value = '';

    this.updateClearButton();
    this.notifyFilterChange();
  }

  updateClearButton() {
    const clearButton = this.container?.querySelector('#filter-clear');
    if (clearButton) {
      clearButton.disabled = !this.hasActiveFilters();
    }
  }

  notifyFilterChange() {
    this.updateClearButton();
    this.updateActiveFiltersDisplay();

    if (this.filterCallback) {
      this.filterCallback(this.currentFilters);
    }
  }

  updateActiveFiltersDisplay() {
    const activeFiltersContainer = this.container?.querySelector('#active-filters');
    if (!activeFiltersContainer) return;

    const activeFilters = [];

    if (this.currentFilters.language) {
      const languageName = this.getLanguageName(this.currentFilters.language);
      activeFilters.push(`Language ${languageName}`);
    }

    if (this.currentFilters.level) {
      activeFilters.push(`Level ${this.currentFilters.level}`);
    }

    if (activeFilters.length > 0) {
      activeFiltersContainer.innerHTML = `
        <div class="filter-tags">
          ${activeFilters.map(f => `<span class="filter-tag">${f}</span>`).join('')}
        </div>
      `;
    } else {
      activeFiltersContainer.innerHTML = '';
    }
  }

  getLanguageName(code) {
    const names = {
      'EN': 'English',
      'SV': 'Svenska',
      'FR': 'Français',
      'DE': 'Deutsch',
      'ZH': '中文'
    };
    return names[code] || code;
  }

  updateSummary(filteredCount, totalCount) {
    const summaryElement = this.container?.querySelector('.result-count');
    if (summaryElement) {
      if (filteredCount === totalCount) {
        summaryElement.textContent = `${totalCount} Books`;
      } else {
        summaryElement.textContent = `${filteredCount} / ${totalCount} Books`;
      }
    }
  }

  getFilters() {
    return { ...this.currentFilters };
  }

  setFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.render();
    this.notifyFilterChange();
  }
}

export default BookFilter;
