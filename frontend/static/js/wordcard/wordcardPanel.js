
import SidebarComponent from '../common/sidebar-component.js';

import ImageViewerModule from '../imageViewerModule.js'

// import ToolBarModule from './toolbarModule.js';
// import WordModule from './wordModule.js';
// import YouglishModule from './youglishModule.js';
// import TagModule from './tagModule.js';

let sidebar = null;

let currentWordIndex = 0;
let words = [];
let selectedTags = [];
let availableTags = [];
let searchQuery = '';
let currentWord = null;

function renderHTML(container) {
  // gen container 
  const containerEl = document.createElement('div');
  containerEl.className = 'wc-wordcard-container';
  containerEl.id = 'wc-wordcardContainer';
  container.appendChild(containerEl);


  const isLandscape = window.innerWidth > window.innerHeight;
  sidebar = new SidebarComponent({
    title: 'Filter',
    containerId: 'wc-wordcardContainer',
    position: 'left',
    width: isLandscape ? '50vw' : '80vw',
    height: 'auto',
    sidebarId: 'wc-wordcardSidebar',
    showToggleButton: true,
    enableOverlay: true,
    autoHide: true
  });

  sidebar.addContent(renderSiderbar(), 'wc-wordcardSidebar');

  const main_container = document.createElement('div');
  main_container.className = 'wc-wordcard-main-container';
  main_container.id = 'wc-wordcardMainContainer';
  main_container.innerHTML = renderWordCard();

  containerEl.appendChild(main_container);

  ImageViewerModule.init({
    cssUrl: '/static/css/image_viewer.css',
    containerId: 'wc-imageViewer',
  });

}

function renderSiderbar() {
  const html = `
      <!-- Filter Section -->
      <div class="wc-filter-section">
        <div class="wc-available-tags">
          <h4 class="wc-filter-title">All Tags</h4>
          <div class="wc-tag-filter" id="wc-availableTags">
            <!-- Available tags will be loaded here -->
          </div>
        </div>

        <div class="wc-selected-tags">
          <h4 class="wc-filter-title">Selected Tags</h4>
          <div class="wc-tag-filter" id="wc-selectedTags">
            <!-- Selected tags will show here -->
          </div>
        </div>

        <button class="wc-filter-btn" id="wc-filterBtn">Filter</button>
      </div>

      <!-- Words List -->
      <div class="wc-word-list" id="wc-wordList">
        <!-- Words will be loaded here -->
      </div>
  `;
  return html;
}

function renderWordCard() {
  const html = `
       <div class="wc-word-card">
        <div class="wc-word-display">
          <h1 class="wc-word-title" id="wc-wordTitle"></h1>
        </div>

        <!-- Image Viewer Component -->
        <div class="wc-image-viewer" id="wc-imageViewer">
          <!-- viewer component -->
        </div>

        <!-- Toolbar -->
        <div class="wc-toolbar" id="wc-wc-toolbar">
          <div class="wc-toolbar-actions">
            <button class="wc-nav-btn" id="wc-youglishBtn">Youglish</button>
            <button class="wc-nav-btn" id="wc-wordDetailBtn">Word Detail</button>
          </div>
          <div class="wc-nav-buttons">
            <button class="wc-nav-btn" id="wc-prevBtn">Prev</button>
            <button class="wc-nav-btn" id="wc-nextBtn">Next</button>
          </div>
        </div>
      </div>`;
  return html;
}



// fetch available tags from the server
async function fetchTags() {
  try {
    const response = await fetch('/api/vocb/tags');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    availableTags = data.tags || [];
    updateAvailableTags();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    // availableTags = ['noun', 'verb', 'adjective', 'important', 'difficult']; // fallback
    // updateAvailableTags();
  }
}

// fetch words from the server
async function fetchWords(tags = []) {
  try {
    const response = await fetch('/api/vocb/word/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    words = Array.isArray(data) ? data : [];
    console.log('Fetched words:', words);
    updateWordList();
    updateWordCard();
  } catch (error) {
    console.error('Failed to fetch words:', error);
    words = []; // fallback to empty array
  }
}

async function fetchWordImages(word) {
  try {
    const response = await fetch(`/api/vocb/word/imgs/${word}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Fetched images for word:', word, data.images);
    return data.images || [];
  } catch (error) {
    console.error('Failed to fetch word images:', error);
    return [];
  }
}

function updateAvailableTags() {
  const availableTagsContainer = document.getElementById('wc-availableTags');
  const tagsToShow = availableTags.filter(tag => !selectedTags.includes(tag));

  availableTagsContainer.innerHTML = tagsToShow.map(tag =>
    `<button class="wc-tag-btn" data-tag="${tag}">${tag}</button>`
  ).join('');
}

function updateSelectedTags() {
  const selectedTagsContainer = document.getElementById('wc-selectedTags');

  selectedTagsContainer.innerHTML = selectedTags.map(tag =>
    `<div class="wc-selected-tag">
          ${tag}
          <button class="wc-remove-tag" data-tag="${tag}">×</button>
        </div>`
  ).join('');
}

function addTag(tag) {
  if (!selectedTags.includes(tag)) {
    selectedTags.push(tag);
    updateAvailableTags();
    updateSelectedTags();
  }
}

function removeTag(tag) {
  selectedTags = selectedTags.filter(t => t !== tag);
  updateAvailableTags();
  updateSelectedTags();
}

function updateWordList() {
  const wordList = document.getElementById('wc-wordList');
  wordList.innerHTML = words.map((word, index) => `
        <div class="wc-word-item ${index === currentWordIndex ? 'active' : ''}" data-word-id="${word.id}">
          <div class="wc-word-text">${word.word}</div>
          <div class="wc-word-tags">
            ${word.tags ? word.tags.map(tag => `<span class="wc-word-tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
      `).join('');
}

function selectWord(wordId) {
  const index = words.findIndex(word => word.id === wordId);
  if (index !== -1) {
    currentWordIndex = index;
    currentWord = words[currentWordIndex];
    updateWordList();
    updateWordCard();
  }
}

// WordCard Functions
function updateWordCard() {
  if (words.length === 0) return;

  console.log('Updating word card with current index:', currentWordIndex);
  currentWord = words[currentWordIndex];
  console.log('Updating word card with current word:', currentWord);

  document.getElementById('wc-wordTitle').textContent = currentWord.word;

  fetchWordImages(currentWord.word)
    .then(images => {
      console.log('Setting images for word:', currentWord.word, images);
      ImageViewerModule.setImages(images);
    })
    .catch(error => {
      ImageViewerModule.setImages([]);
      console.error('Failed to fetch images for word:', currentWord.word, error);
    });
  updateNavigationButtons();
}

function updateNavigationButtons() {
  document.getElementById('wc-prevBtn').disabled = currentWordIndex === 0;
  document.getElementById('wc-nextBtn').disabled = currentWordIndex === words.length - 1;
}

export function createWordCardPanel(container) {
  // Render the HTML structure
  renderHTML(container);

  // // Initialize modules
  // ToolBarModule.init();
  // WordModule.init();
  // YouglishModule.init();
  // TagModule.init();

  fetchTags();
  document.getElementById('wc-availableTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('wc-tag-btn')) {
      addTag(e.target.dataset.tag);
    }
  });

  document.getElementById('wc-selectedTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('wc-remove-tag')) {
      removeTag(e.target.dataset.tag);
    }
  });

  // 綁定篩選按鈕事件
  document.getElementById('wc-filterBtn').addEventListener('click', () => {
    const filterBtn = document.getElementById('wc-filterBtn');
    filterBtn.disabled = true;

    fetchWords(selectedTags)
      .finally(() => {
        filterBtn.disabled = false;
      });
  });

  // 绑定单词列表点击事件
  document.getElementById('wc-wordList').addEventListener('click', (e) => {
    const wordItem = e.target.closest('.wc-word-item');
    if (wordItem) {
      selectWord(parseInt(wordItem.dataset.wordId));
    }
  });

  // 绑定按钮事件
  document.getElementById('wc-prevBtn').addEventListener('click', () => {
    if (currentWordIndex > 0) {
      currentWordIndex--;
      updateWordList();
      updateWordCard();
    }
  });

  document.getElementById('wc-nextBtn').addEventListener('click', () => {
    if (currentWordIndex < words.length - 1) {
      currentWordIndex++;
      updateWordList();
      updateWordCard();
    }
  });

  // document.getElementById('youglishBtn').addEventListener('click', () => {
  //   console.log('Youglish button clicked for word:', currentWord);
  //   YouglishModule.show(currentWord.word);
  // });

  // document.getElementById('wordDetailBtn').addEventListener('click', () => {
  //   console.log('Word detail button clicked for word:', currentWord);
  //   WordModule.show(currentWord.word);
  // });
} 