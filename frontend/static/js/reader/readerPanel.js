import { getToken, getPathData } from '../user/login.js';

import SidebarComponent from '../common/sidebar-component.js';
import ToolBarModule from './toolbarModule.js';
import WordModule from './wordModule.js';
import YouglishModule from './youglishModule.js';
import TagModule from './tagModule.js';

// let novelData = [];
let chapterData = [];
let currentChapterIndex = 0;

let currentSrcContent = null;
let currentDstContent = null;

let sentenceStates = {}; // {chapterPath: {sentenceIndex: 'dest'|'source'}}
let sidebar = null;
let longPressTimer = null;
let isDragSelection = false;
let selectedWord = '';
let selectedWordElement = null;
let currentFontSize = 2;

const fontSizes = ['small', 'medium', 'large', 'extra-large', 'huge'];
const fontSizeNames = ['small', 'medium', 'large', 'extra-large', 'huge'];;

// word tag related variables
let allowTagList = [];
let wordTags = [];
let tempTagList = [];

// DOM elements cached for performance
let currentChapterElement = null;
let chapterInfoElement = null;
let contentAreaElement = null;
let wordToolbar = null;

let fontSizeDisplay = null;


function renderHTML(container) {
  const htmlContent = `
    <div class="main-content", id="main-content">
      <div class="content-header">
        <div class="chapter-title-area">
          <h2 id="currentChapter"></h2>
        </div>
        <div class="control-area">
          <p id="chapterInfo"></p>
     
          <div class="font-size-control">
            <button class="font-size-btn" id="fontSizeIncrease" title="减小字体">A-</button>
            <span class="font-size-display" id="fontSizeDisplay">medium</span>
            <button class="font-size-btn" id="fontSizeDecrease" title="增大字体">A+</button>
          </div>
        </div>
      </div>
      <div id="contentArea">
        <div class="loading">Please select a chapter from the left</div>
      </div>
    </div>
  `;
  container.innerHTML = htmlContent;

  currentChapterElement = document.getElementById('currentChapter');
  chapterInfoElement = document.getElementById('chapterInfo');
  contentAreaElement = document.getElementById('contentArea');
  wordToolbar = document.getElementById('wordToolbar');

  fontSizeDisplay = document.getElementById('fontSizeDisplay');

  // register event

  let font_increase_btn = document.querySelector('#fontSizeIncrease');
  font_increase_btn.addEventListener('click', decreaseFontSize);

  let font_decrease_btn = document.querySelector('#fontSizeDecrease');
  font_decrease_btn.addEventListener('click', increaseFontSize);


  // init side bar
  const isLandscape = window.innerWidth > window.innerHeight;

  sidebar = new SidebarComponent({
    title: 'Chapter List',
    containerId: 'main-content',
    position: 'left',
    width: isLandscape ? '50vw' : '80vw',
    height: 'auto',
    sidebarId: 'dagSidebar',
    showToggleButton: true,
    enableOverlay: true,
    autoHide: true
  });

}

// load the novel list from the server
async function loadNovelList(book) {
  try {
    const token = getToken();
    if (!token) {
      alert('You should login first');
      return;
    }
    // if (book == null) {
    //   alert('No book selected');
    //   return;
    // }

    const book = { id: '000001' };

    console.log("Fetch chapters for book:", book);
    // fetch the chapter list of the specified book
    fetch(`/api/book/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        // "book_id": book.id,
        book_id: '000001',
        "lang": "en",
        "level": "b2"
      })
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }).then(data => {
      chapterData = data;
      console.log('Novel chapter list loaded:', chapterData);

      if (sidebar) {
        sidebar.clearContent();
        sidebar.addContent(renderNovelList(), 'novelList');
      }
    }).catch(error => {
      console.error('加载小说章节列表失败:', error);
      if (sidebar) {
        sidebar.clearContent();
        sidebar.addContent(`<div class="error">加载失败: ${error.message}</div>`, 'error');
      }
    });

  } catch (e) {
    if (sidebar) {
      sidebar.clearContent();
      sidebar.addContent(`<div class="error">加载失败: </div>`, 'error');
    }
  }
}

// generate the HTML content for the novel list
function createNovelListContent() {
  if (chapterData.length === 0) {
    return '<div class="loading">No chapter found</div>';
  }

  let html = '<ul class="chapter-list">';

  chapterData.forEach((chapter, chapterIndex) => {
    html += `<li class="chapter-item" data-chapter-index="${chapterIndex}">${chapter.chapter_title}</li>`;
  });

  html += '</ul>';
  return html;
}

function renderNovelList() {
  // new container
  const container = document.createElement('div');
  container.innerHTML = createNovelListContent();


  // 绑定章节点击事件
  container.querySelectorAll('.chapter-item').forEach((chapterEl) => {
    chapterEl.addEventListener('click', (event) => {
      event.stopPropagation(); // 阻止冒泡到小说标题
      // const book_id = parseInt(chapterEl.dataset.bookId);
      // const chapter_id = parseInt(chapterEl.dataset.chapterId);
      const chapterIndex = parseInt(chapterEl.dataset.chapterIndex);
      selectChapter(chapterIndex, chapterEl, event);
    });
  });
  return container;
}


// chapter selection handler
async function selectChapter(chapterIndex, chapterElement, event) {
  event.stopPropagation();
  currentChapterIndex = chapterIndex;
  const chapter = chapterData[chapterIndex];

  // const novel = novelData[novelIndex];
  // const chapter = novel.chapters[chapterIndex];
  // console.log(novel.chapters)
  // console.log(`Select chapter: ${novel.name} - ${chapter.title}`);

  // close the sidebar if it is open
  sidebar?.hide();

  // update the active chapter in the sidebar
  sidebar.sidebar.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
  chapterElement.classList.add('active');

  // update the current chapter and content area
  // currentNovel = novel;
  // currentChapter = chapter_id;
  currentChapterElement.textContent = `${chapter.chapter_title}`;
  chapterInfoElement.textContent = 'Loading...';
  contentAreaElement.innerHTML = '<div class="loading">Loading...</div>';

  const url = `/api/book/content`;
  try {
    async function fetchChapterContent(url, data = {
      "book_id": '000001',
      "chapter_id": chapter.chapter_id,
      "lang": "en",
      "level": "b2"
    }
    ) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    }

    currentSrcContent = await fetchChapterContent(url, {
      "book_id": '000001',
      "chapter_id": chapter.chapter_id,
      "lang": "zh",
      "level": "c2"
    });

    currentDstContent = await fetchChapterContent(url, {
      "book_id": '000001',
      "chapter_id": chapter.chapter_id,
      "lang": "en",
      "level": "b2"
    });

    //  check data 
    if (currentSrcContent.total_sentence !== currentDstContent.total_sentence) {
      throw new Error('Source and target content sentence count mismatch');
    }

    console.log('Chapter content loaded successfully:', currentSrcContent,
      currentDstContent);

    // Initialize sentence state for this chapter
    sentenceStates = {};

    // Initialize each sentence state (default to English)
    if (currentDstContent.content) {
      currentDstContent.content.forEach((_, index) => {
        sentenceStates[index] = 'dest';
      });
    }

    renderChapterContent();

  } catch (error) {
    console.error('Failed to load chapter content:', error);
    contentAreaElement.innerHTML = `<div class="error">Failed to load: ${error.message}</div>`;
  }
}

// Render chapter content
function renderChapterContent() {
  const srcSentences = currentSrcContent.content;
  const dstSentences = currentDstContent.content;

  chapterInfoElement.textContent = `Total ${dstSentences.length} sentences`;

  // const sentenceHTML = sentences.map((sentence, index) => {
  //   const currentState = sentenceStates[chapterPath][index] || 'dest';
  //   const isSource = currentState === 'source';
  //   const cssClass = isSource ? 'source-text' : 'dest-text';
  //   const text = isSource ? sentence.src : sentence.target;

  //   const toggleIcon = isSource ? 'src' : 'dst';
  //   const toggleTitle = isSource ? 'Switch to English' : 'Switch to Chinese';

  //   return `
  //     <div class="sentence ${isSource ? 'source' : ''}" data-index="${index}" data-chapter-path="${chapterPath}">
  //       <div class="language-toggle" title="${toggleTitle}">
  //         ${toggleIcon}
  //       </div>
  //       <div class="sentence-text">
  //         <div class="${cssClass}">${text}</div>
  //       </div>
  //     </div>
  //   `;
  // }).join('');

  const sentenceHTML = srcSentences.map((_, index) => {
    const currentState = sentenceStates[index] || 'dest';
    const isSource = currentState === 'source';
    const cssClass = isSource ? 'source-text' : 'dest-text';
    const text = isSource ? srcSentences[index].sentence : dstSentences[index].sentence;

    const toggleIcon = isSource ? 'src' : 'dst';
    const toggleTitle = isSource ? 'Switch to dst language' : 'Switch to src language';

    return `
      <div class="sentence ${isSource ? 'source' : ''}" 
            data-index="${index}" 
           >
        <div class="language-toggle" title="${toggleTitle}">
          ${toggleIcon}
        </div>
        <div class="sentence-text">
          <div class="${cssClass}">${text}</div>
        </div>
      </div>
    `;
  }).join('');


  contentAreaElement.innerHTML = `<div class="sentence-container font-size-${fontSizes[currentFontSize]}">${sentenceHTML}</div>`;

  // 绑定事件
  contentAreaElement.querySelectorAll('.sentence').forEach(sentenceEl => {
    const index = parseInt(sentenceEl.dataset.index);
    // const path = sentenceEl.dataset.chapterPath;

    // 切换语言
    const toggleEl = sentenceEl.querySelector('.language-toggle');
    toggleEl.addEventListener('click', () => toggleSentence(index));

    // 鼠标/触摸事件
    const textEl = sentenceEl.querySelector('.sentence-text');
    textEl.addEventListener('mousedown', handleMouseDown);
    textEl.addEventListener('mouseup', handleMouseUp);
    textEl.addEventListener('touchstart', handleTouchStart);
    textEl.addEventListener('touchend', handleTouchEnd);
    textEl.addEventListener('touchmove', handleTouchMove);
    textEl.addEventListener('contextmenu', handleContextMenu);
  });
}

// Toggle sentence language display
function toggleSentence(sentenceIndex) {
  event.stopPropagation(); // Prevent event bubbling

  const currentState = sentenceStates[sentenceIndex] || 'dest';
  sentenceStates[sentenceIndex] = currentState === 'source' ? 'dest' : 'source';

  if (currentSrcContent && currentDstContent) {
    renderChapterContent();
  }
}

// ----------- UI Events ------------//

// Handle mouse down event
function handleMouseDown(event) {
  clearWordSelection();
  clearTimeout(longPressTimer);
  console.log("press");
  event.startTime = Date.now();
}

// Handle mouse up event
function handleMouseUp(event) {
  console.log("release");
  const clickDuration = Date.now() - (event.startTime || 0);
  if (clickDuration > 1000) {
    setTimeout(() => {
      handleTextSelection(event);
    }, 100);
  }
}

// blocking the default context menu
function handleContextMenu(event) {
  event.preventDefault();
}

// Handle touch start event
function handleTouchStart(event) {
  console.log("touch start");

  clearWordSelection();
  window.getSelection().removeAllRanges();
  clearTimeout(longPressTimer);

  // Save the coordinates and time when touch starts
  const touch = event.touches[0];
  event.startX = touch.clientX;
  event.startY = touch.clientY;

  // Initialize drag selection flag
  isDragSelection = false;

  longPressTimer = setTimeout(() => {
    isDragSelection = true;
    console.log("long press detected");
    window.getSelection().removeAllRanges(); // Clear previous selection
  }, 600);
}

// Handle touch end event
function handleTouchEnd(event) {
  console.log("touch end");
  clearTimeout(longPressTimer);

  // If it's a drag selection or long press, handle text selection
  if (isDragSelection) {
    setTimeout(() => {
      console.log("drag selection end detected");
      const selection = window.getSelection();
      const word = selection.toString().trim();

      console.log("drag selection detected word:", word);
      if (word) {

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        console.log("selected word rect:", rect);
        const x = rect.left + window.scrollX + rect.width / 2;
        const y = rect.bottom + window.scrollY;
        console.log("show word toolbar at:", x, y);
        selectedWord = word;
        // showWordToolbar(x, y);
        ToolBarModule.show(x, y);
        highlightWordInContent(word);
      }
    }, 100);
  }
}

// Utility function: expand selection range to word boundaries
function expandRangeToWord(range) {
  if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const text = range.startContainer.textContent;
  let start = range.startOffset;
  let end = range.endOffset;

  // Expand backward
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }

  // Expand forward
  while (end < text.length && /\w/.test(text[end])) {
    end++;
  }

  range.setStart(range.startContainer, start);
  range.setEnd(range.startContainer, end);
}

// Handle touch move event (cancel long press if moved too much)
function handleTouchMove(event) {
  // console.log("touch move");

  const touch = event.touches[0];
  const deltaX = Math.abs(touch.clientX - (event.startX || 0));
  const deltaY = Math.abs(touch.clientY - (event.startY || 0));
  // console.log("deltaX:", deltaX, "deltaY:", deltaY);

  if (!isDragSelection) {
    if (deltaX > 5 || deltaY > 5) {
      // Cancel long press
      clearTimeout(longPressTimer);
    }
  } else {
    // Enter drag selection mode
    event.preventDefault();

    let range;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
    } else {
      console.assert("caretRangeFromPoint not supported");
    }

    if (range) {
      expandRangeToWord(range);
      const selection = window.getSelection();
      if (selection.rangeCount === 0) {
        selection.addRange(range);
      } else {
        const existingRange = selection.getRangeAt(0);
        existingRange.setEnd(range.endContainer, range.endOffset);
        expandRangeToWord(existingRange);
      }
    }

  }
}

// Handle text selection
function handleTextSelection(event) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  console.log("selectedText:", selectedText);
  if (selectedText) {
    selectedWord = selectedText;
    // Get the position of the selection range
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // show the bar
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    // showWordToolbar(x, y);
    ToolBarModule.show(x, y);

    highlightWordInContent(selectedWord);

    selection.removeAllRanges();
  }
}

// Highlight the specified word in the content (for future use)
function highlightWordInContent(word) {
  const sentenceTexts = document.querySelectorAll('.sentence-text');

  sentenceTexts.forEach(sentenceText => {
    const textContent = sentenceText.innerHTML;

    // Use a regular expression to match the whole word (case-insensitive)
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    const highlightedContent = textContent.replace(regex,
      '<span class="selected-word-highlight">$1</span>'
    );

    sentenceText.innerHTML = highlightedContent;
  });
}

// Clear word selection
function clearWordSelection() {
  // Remove all highlights
  const highlightedWords = document.querySelectorAll('.selected-word-highlight');
  highlightedWords.forEach(element => {
    const parent = element.parentNode;
    parent.replaceChild(document.createTextNode(element.textContent), element);
    parent.normalize(); // Merge adjacent text nodes
  });
}

// Toolbar button event handler
function openAIDictionary() {
  if (selectedWord) {
    console.log('Tool 1 - AI dictionary:', selectedWord)
    ToolBarModule.close()
    clearWordSelection();
    WordModule.show(selectedWord);
  }
}

function openYouglish() {
  if (selectedWord) {
    console.log('tool 2 - YouGlish:', selectedWord);
    ToolBarModule.close()
    clearWordSelection();
    YouglishModule.show(selectedWord);
  }
}

function openTags() {
  if (selectedWord) {
    console.log('tool 3 - Tag:', selectedWord);
    TagModule.show(selectedWord);
    ToolBarModule.close()
  }
}

// 增大字体
function increaseFontSize() {
  if (currentFontSize < fontSizes.length - 1) {
    currentFontSize++;
    updateFontSize();
  }
}

// 减小字体
function decreaseFontSize() {
  if (currentFontSize > 0) {
    currentFontSize--;
    updateFontSize();
  }
}

// 更新字体大小
function updateFontSize() {
  const sentenceContainer = document.querySelector('.sentence-container');
  if (sentenceContainer) {
    // 移除所有字体大小类
    fontSizes.forEach(size => {
      sentenceContainer.classList.remove(`font-size-${size}`);
    });
    // 添加当前字体大小类
    sentenceContainer.classList.add(`font-size-${fontSizes[currentFontSize]}`);
  }

  // 更新显示
  fontSizeDisplay.textContent = fontSizeNames[currentFontSize];

  // 保存到本地存储
  localStorage.setItem('fontSize', currentFontSize.toString());
}

// 加载字体大小设置
function loadFontSizeSettings() {
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize !== null) {
    currentFontSize = parseInt(savedFontSize);
    // 确保值在有效范围内
    if (currentFontSize < 0 || currentFontSize >= fontSizes.length) {
      currentFontSize = 2; // 默认中等
    }
    fontSizeDisplay.textContent = fontSizeNames[currentFontSize];
  }
}

function createReaderPanel(container) {
  renderHTML(container);
  loadFontSizeSettings();

  loadNovelList();

  YouglishModule.init({
    cssUrl: '/static/css/reader/youglish_panel.css',
    ccb: () => {
      clearWordSelection();
      ToolBarModule.close()
    }
  });

  // 初始化单词详情面板
  WordModule.init({
    cssUrl: '/static/css/reader/word_panel.css',
    ccb: () => {
      clearWordSelection();
      ToolBarModule.close()
    }
  });

  //
  TagModule.init({
    cssUrl: '/static/css/reader/tag_panel.css',
    ccb: () => {
      clearWordSelection();
      ToolBarModule.close()
    }
  });

  // //
  ToolBarModule.init({
    cssUrl: '/static/css/reader/tool_bar.css',
    applist: [
      { name: "AI_D", onclick: openAIDictionary, logo: "AI" },
      { name: "PN", onclick: openYouglish, logo: "YT" },
      { name: "TAG", onclick: openTags, logo: "TT" }
    ],
    ccb: () => {
      clearWordSelection();
    }
  });


  console.log('Novel Reader 页面加载完成');
}

export {
  createReaderPanel
}