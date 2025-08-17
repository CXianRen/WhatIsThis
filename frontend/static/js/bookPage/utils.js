// ========== Utility Functions for Books App ==========

// Language handling utilities
const LanguageUtils = {
  // Language code mappings
  LANGUAGE_CODES: {
    'EN': { name: 'English', flag: '��🇸', color: '#1e40af' },
    'SV': { name: 'Svenska', flag: '🇸🇪', color: '#0ea5e9' },
    'FR': { name: 'Français', flag: '🇫🇷', color: '#7c3aed' },
    'DE': { name: 'Deutsch', flag: '🇩🇪', color: '#dc2626' },
    'ZH': { name: '中文', flag: '🇨��', color: '#ea580c' },
    'ES': { name: 'Español', flag: '🇪🇸', color: '#16a34a' },
    'IT': { name: 'Italiano', flag: '🇮🇹', color: '#059669' },
    'RU': { name: 'Русский', flag: '🇷🇺', color: '#be123c' },
    'JA': { name: '日本語', flag: '🇯🇵', color: '#9333ea' },
    'KO': { name: '한국어', flag: '🇰🇷', color: '#0891b2' }
  },

  getLanguageInfo(code) {
    return this.LANGUAGE_CODES[code.toUpperCase()] || { 
      name: code, 
      flag: '🌐', 
      color: '#6b7280' 
    };
  },

  formatLanguages(languages) {
    return languages.map(lang => this.getLanguageInfo(lang)).map(info => ({
      code: lang,
      ...info
    }));
  }
};

// Level utilities
const LevelUtils = {
  LEVELS: {
    'A1': { name: 'Beginner', color: '#10b981', description: 'Basic phrases and vocabulary' },
    'A2': { name: 'Elementary', color: '#0ea5e9', description: 'Simple conversations' },
    'B1': { name: 'Intermediate', color: '#f59e0b', description: 'Independent user' },
    'B2': { name: 'Upper Intermediate', color: '#ef4444', description: 'Complex texts' },
    'C1': { name: 'Advanced', color: '#8b5cf6', description: 'Fluent expression' },
    'C2': { name: 'Proficient', color: '#6366f1', description: 'Native-like fluency' }
  },

  getLevelInfo(level) {
    return this.LEVELS[level.toUpperCase()] || { 
      name: level, 
      color: '#6b7280', 
      description: 'Unknown level' 
    };
  },

  formatLevel(level) {
    const info = this.getLevelInfo(level);
    return {
      code: level.toUpperCase(),
      ...info
    };
  }
};

// Date utilities
const DateUtils = {
  formatRelativeDate(dateString) {
    if (!dateString) return 'Never read';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  },

  formatDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Progress utilities
const ProgressUtils = {
  formatProgress(progress, total) {
    const percentage = Math.round((progress / total) * 100);
    return {
      percentage,
      label: `${percentage}%`,
      status: this.getProgressStatus(percentage)
    };
  },

  getProgressStatus(percentage) {
    if (percentage === 0) return 'not-started';
    if (percentage < 25) return 'just-started';
    if (percentage < 75) return 'in-progress';
    if (percentage < 100) return 'almost-done';
    return 'completed';
  },

  getProgressColor(percentage) {
    if (percentage === 0) return '#d1d5db';
    if (percentage < 25) return '#fbbf24';
    if (percentage < 75) return '#3b82f6';
    if (percentage < 100) return '#8b5cf6';
    return '#10b981';
  }
};

// DOM utilities
const DOMUtils = {
  createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  },

  createElementWithHTML(tag, className = '', html = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html) element.innerHTML = html;
    return element;
  },

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  animate(element, animations, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `all ${duration}ms ease-in-out`;
      
      Object.entries(animations).forEach(([property, value]) => {
        element.style[property] = value;
      });
      
      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }
};

// Search utilities
const SearchUtils = {
  highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  fuzzySearch(items, searchTerm, keys = ['title']) {
    if (!searchTerm) return items;
    
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    
    return items.filter(item => {
      const searchableText = keys
        .map(key => this.getNestedValue(item, key))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      return searchWords.every(word => searchableText.includes(word));
    }).sort((a, b) => {
      // Score based on how early the match appears
      const aText = keys.map(key => this.getNestedValue(a, key)).join(' ').toLowerCase();
      const bText = keys.map(key => this.getNestedValue(b, key)).join(' ').toLowerCase();
      
      const aIndex = aText.indexOf(searchTerm.toLowerCase());
      const bIndex = bText.indexOf(searchTerm.toLowerCase());
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  },

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
};

// Theme utilities
const ThemeUtils = {
  THEME_KEY: 'wit:theme',
  
  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'system';
  },

  setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  },

  applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      html.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
  },

  isDarkMode() {
    const theme = this.getTheme();
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};

// Animation utilities
const AnimationUtils = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return DOMUtils.animate(element, { opacity: '1' }, duration);
  },

  fadeOut(element, duration = 300) {
    return DOMUtils.animate(element, { opacity: '0' }, duration)
      .then(() => {
        element.style.display = 'none';
      });
  },

  slideDown(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight + 'px';
    return DOMUtils.animate(element, { height: targetHeight }, duration)
      .then(() => {
        element.style.height = '';
        element.style.overflow = '';
      });
  },

  slideUp(element, duration = 300) {
    const currentHeight = element.scrollHeight + 'px';
    element.style.height = currentHeight;
    element.style.overflow = 'hidden';
    
    return DOMUtils.animate(element, { height: '0' }, duration)
      .then(() => {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
      });
  }
};

// Storage utilities
const StorageUtils = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`wit:${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to get from localStorage:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`wit:${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to set localStorage:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`wit:${key}`);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('wit:'));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

// Export utilities
window.BookUtils = {
  Language: LanguageUtils,
  Level: LevelUtils,
  Date: DateUtils,
  Progress: ProgressUtils,
  DOM: DOMUtils,
  Search: SearchUtils,
  Theme: ThemeUtils,
  Animation: AnimationUtils,
  Storage: StorageUtils
};

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LanguageUtils,
    LevelUtils,
    DateUtils,
    ProgressUtils,
    DOMUtils,
    SearchUtils,
    ThemeUtils,
    AnimationUtils,
    StorageUtils
  };
}
