// ========== Book Filter Component (ESM) ==========
import { DOMUtils } from './utils.js';

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
    <div class="filter-controls">
      <div class="filter-group">
        <label class="filter-label" for="filter-language">Lang</label>
        <select id="filter-language" class="filter-select">
          <option value="">All</option>
          <option value="EN" ${currentFilters.language === 'EN' ? 'selected' : ''}>English</option>
          <option value="SV" ${currentFilters.language === 'SV' ? 'selected' : ''}>Svenska</option>
          <option value="FR" ${currentFilters.language === 'FR' ? 'selected' : ''}>Français</option>
          <option value="DE" ${currentFilters.language === 'DE' ? 'selected' : ''}>Deutsch</option>
          <option value="ZH" ${currentFilters.language === 'ZH' ? 'selected' : ''}>中文</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label" for="filter-level">Level</label>
        <select id="filter-level" class="filter-select">
          <option value="">All</option>
          <option value="A1" ${currentFilters.level === 'A1' ? 'selected' : ''}>A1</option>
          <option value="A2" ${currentFilters.level === 'A2' ? 'selected' : ''}>A2</option>
          <option value="B1" ${currentFilters.level === 'B1' ? 'selected' : ''}>B1</option>
          <option value="B2" ${currentFilters.level === 'B2' ? 'selected' : ''}>B2</option>
          <option value="C1" ${currentFilters.level === 'C1' ? 'selected' : ''}>C1</option>
          <option value="C2" ${currentFilters.level === 'C2' ? 'selected' : ''}>C2</option>
        </select>
      </div>
      
      <button class="filter-clear" id="filter-clear" ${hasActiveFilters() ? '' : 'disabled'}>
        Clear Filters
      </button>
    </div>
    
    <div class="filter-summary" id="filter-summary">
      <span class="result-count">0 Book</span>
      <div class="active-filters" id="active-filters"></div>
    </div>
  `;
}

function setupEventListeners() {
  if (!container) return;

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

  const languageSelect = container?.querySelector('#filter-language');
  if (languageSelect) languageSelect.value = '';

  const levelSelect = container?.querySelector('#filter-level');
  if (levelSelect) levelSelect.value = '';

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

  if (currentFilters.language) {
    const languageName = getLanguageName(currentFilters.language);
    activeFilters.push(`Language ${languageName}`);
  }

  if (currentFilters.level) {
    activeFilters.push(`Level ${currentFilters.level}`);
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
      summaryElement.textContent = `${totalCount} Books`;
    } else {
      summaryElement.textContent = `${filteredCount} / ${totalCount} Books`;
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

// Export the main API
export default {
  init,
  updateSummary,
  getFilters,
  setFilters,
  clearAllFilters
};
