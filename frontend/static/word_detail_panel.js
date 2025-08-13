// 右侧详情栏相关的JavaScript功能
let currentAudioUrl = null;
let wordNotes = {}; // 存储每个单词的笔记

// DOM元素缓存
let rightPanelTitle, phoneticText, audioButton, definitionText,
  imagesGrid, notesArea, customSearchInput, customSearchBtn,
  pronunciationSection, imagesSection, notesSection;

// 初始化DOM元素引用
function initWordDetailPanel() {
  rightPanelTitle = document.getElementById('rightPanelTitle');
  phoneticText = document.getElementById('phoneticText');
  audioButton = document.getElementById('audioButton');
  definitionText = document.getElementById('definitionText');
  imagesGrid = document.getElementById('imagesGrid');
  notesArea = document.getElementById('notesArea');
  customSearchInput = document.getElementById('customSearchInput');
  customSearchBtn = document.getElementById('customSearchBtn');
  pronunciationSection = document.getElementById('pronunciationSection');
  imagesSection = document.getElementById('imagesSection');
  notesSection = document.getElementById('notesSection');
  definitionSection = document.getElementById('definitionSection');

  // 加载存储的笔记
  console.log('加载存储的笔记');
  loadStoredNotes();
}

// 加载单词详细信息
// 通过新的统一API加载单词详细信息
async function loadWordDetails(word,
  mask = false,
  skip_title = false,
  skip_pronunciation = false) {
    console.log('加载单词详细信息:', word, mask, skip_title, skip_pronunciation);

  try {
       // 确保DOM元素已初始化
    if (!rightPanelTitle) {
      initWordDetailPanel();
    }

    // 显示加载状态
    showLoadingState(word, skip_title, skip_pronunciation);

    const response = await fetch(`/api/vocb/word/${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error('网络请求失败');

    const data = await response.json();
    console.log('单词详细信息:', data);

    // 清除加载状态并显示实际内容
    updateContentWithData(data, mask, skip_title, skip_pronunciation);

  } catch (error) {
    console.error('加载单词详细信息失败:', error);
    showErrorState(error.message);
  }
}

// 显示加载状态
function showLoadingState(word, skip_title, skip_pronunciation) {
  if (skip_title) {
    rightPanelTitle.classList.add('hidden-component');
  } else {
    rightPanelTitle.classList.remove('hidden-component');
    rightPanelTitle.textContent = word;
    rightPanelTitle.classList.add('masked');
  }

  if (skip_pronunciation) {
    pronunciationSection.classList.add('hidden-component');
  } else {
    pronunciationSection.classList.remove('hidden-component');
    phoneticText.classList.remove('hidden-component');
    phoneticText.textContent = '正在加载发音信息...';
    phoneticText.classList.add('masked');
  }

  // 显示加载中的定义区域
  if (definitionSection) {
    definitionSection.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner">⏳</div>
        <div class="loading-text">正在获取单词详细信息...</div>
      </div>
    `;
  }

  // 显示加载中的图片区域
  if (imagesGrid) {
    imagesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">
        <div class="loading-spinner">🔄</div>
        <div>正在加载图片...</div>
      </div>
    `;
  }

  // 隐藏音频按钮
  if (audioButton) {
    audioButton.style.display = 'none';
  }

  // 隐藏笔记区域
  if (notesArea) {
    notesArea.style.visibility = 'hidden';
  }
}

// 显示错误状态
function showErrorState(errorMessage) {
  if (phoneticText) phoneticText.textContent = '加载失败';
  
  if (definitionSection) {
    definitionSection.innerHTML = `
      <div class="error-state">
        <div class="error-icon">❌</div>
        <div class="error-text">加载失败: ${errorMessage}</div>
        <button onclick="location.reload()" class="retry-button">重试</button>
      </div>
    `;
  }
  
  if (imagesGrid) {
    imagesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f44336;">图片加载失败</div>';
  }
}

// 用数据更新内容
function updateContentWithData(data, mask, skip_title, skip_pronunciation) {
  if (skip_title) {
    rightPanelTitle.classList.add('hidden-component');
  } else {
    rightPanelTitle.classList.remove('hidden-component');
  }

  if (skip_pronunciation) {
    pronunciationSection.classList.add('hidden-component');
  } else {
    pronunciationSection.classList.remove('hidden-component');
  }

  if (rightPanelTitle) {
    rightPanelTitle.classList.add('masked');
    rightPanelTitle.textContent = data.word || 'unknown';
  }

  if (phoneticText) {
    if (skip_pronunciation) {
      phoneticText.classList.add('hidden-component');
    } else {
      phoneticText.classList.remove('hidden-component');
      phoneticText.classList.add('masked');
      phoneticText.textContent = data.pronunciation + " (" + data.spelling_pronunciation + ")";
      
      // 构建定义内容的HTML
      let definitionHTML = '';
      
      // 中文解释
      if (data.explain_zh && data.explain_zh.length > 0) {
        definitionHTML += '<div class="definition-section"><h4>中文解释:</h4><ul>';
        data.explain_zh.forEach(explain => {
          definitionHTML += `<li>${explain}</li>`;
        });
        definitionHTML += '</ul></div>';
      }
      
      // 英文解释
      if (data.explain_en && data.explain_en.length > 0) {
        definitionHTML += '<div class="definition-section"><h4>英文解释:</h4><ul>';
        data.explain_en.forEach(explain => {
          definitionHTML += `<li>${explain}</li>`;
        });
        definitionHTML += '</ul></div>';
      }
      
      // 例句
      if (data.example_sentences && data.example_sentences.length > 0) {
        definitionHTML += '<div class="definition-section"><h4>例句:</h4>';
        data.example_sentences.forEach(example => {
          definitionHTML += `
            <div class="example-sentence">
        <div class="scenario">${example.scenario}</div>
        <div class="en-sentence">${example.en}</div>
        <div class="zh-sentence">${example.zh}</div>
            </div>
          `;
        });
        definitionHTML += '</div>';
      }
      
      // 同义词
      if (data.synonyms && data.synonyms.length > 0) {
        definitionHTML += '<div class="definition-section"><h4>同义词:</h4><div class="synonyms">';
        data.synonyms.forEach(synonym => {
          definitionHTML += `<span class="synonym">${synonym}</span>`;
        });
        definitionHTML += '</div></div>';
      }
      
      // 设置定义内容
      if (definitionSection) {
        definitionSection.innerHTML = definitionHTML;
      }

    }
    currentAudioUrl = data.audio || null;
    if (audioButton) {
      audioButton.style.display = currentAudioUrl ? 'inline-block' : 'none';
    }
  }

  // 显示笔记区域
  if (notesArea) {
    notesArea.style.visibility = 'hidden';
  }

  // 解除遮罩函数
  function unmaskWordDetailPanel() {
    if (rightPanelTitle) {
      rightPanelTitle.classList.remove('masked');
    }
    if (phoneticText) {
      phoneticText.classList.remove('masked');
    }
    if (notesArea) {
      notesArea.style.visibility = 'visible';
    }
  }

  if (!mask) {
    unmaskWordDetailPanel();
  }

  // 显示图片
  displayImages(Array.isArray(data.images) ? data.images.slice(0, 6) : []);

  rightPanelTitle.onclick = () => {
    unmaskWordDetailPanel();
    if (typeof maskDiv !== 'undefined' && maskDiv) {
      maskDiv.remove();
    }
  };

  // 加载该单词的笔记
  loadNotes(data.word);
}

// 显示图片
function displayImages(imageUrls) {
  if (!imagesGrid) return;

  if (!imageUrls || imageUrls.length === 0) {
    imagesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666;">暂无图片</div>';
    return;
  }

  imagesGrid.innerHTML = '';
  imageUrls.forEach((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'word-image';
    img.alt = `图片 ${index + 1}`;
    img.onerror = () => {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg==';
    };
    imagesGrid.appendChild(img);
  });
}

// 播放音频
function playAudio() {
  if (currentAudioUrl) {
    const audio = new Audio(currentAudioUrl);
    audio.play().catch(error => {
      console.error('播放音频失败:', error);
      alert('音频播放失败');
    });
  }
}

// 加载笔记
function loadNotes(word) {
  if (notesArea) {
    notesArea.value = wordNotes[word] || '';
  }
}

// 保存笔记
function saveNotes() {
  if (!rightPanelTitle || !notesArea) return;

  const currentWord = rightPanelTitle.textContent.split(' - ')[0];
  if (currentWord && currentWord !== '单词详情') {
    wordNotes[currentWord] = notesArea.value;
    // 保存到本地存储
    localStorage.setItem('wordNotes', JSON.stringify(wordNotes));
    alert('笔记已保存');
  }
}

// 从本地存储加载笔记
function loadStoredNotes() {
  try {
    const stored = localStorage.getItem('wordNotes');
    if (stored) {
      wordNotes = JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载存储的笔记失败:', error);
  }
}

// 使用自定义关键词搜索图片
async function searchWithCustomKey() {
  if (!customSearchInput || !customSearchBtn) return;

  const customKey = customSearchInput.value.trim();
  if (!customKey) {
    alert('请输入搜索关键词');
    return;
  }

  const currentWord = getCurrentWord();
  if (!currentWord) {
    alert('请先选择一个单词');
    return;
  }

  // 显示加载状态
  customSearchBtn.disabled = true;
  customSearchBtn.textContent = '⏳';

  if (imagesGrid) {
    imagesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">正在搜索图片...</div>';
  }

  try {
    const response = await fetch(`/searchImagesAs/${encodeURIComponent(currentWord)}/${encodeURIComponent(customKey)}`);
    if (!response.ok) throw new Error('搜索请求失败');

    const data = await response.json();
    if (data.success) {
      displayImages(data.images || []);
      alert(`成功更新了"${currentWord}"的图片，使用关键词："${customKey}"`);
    } else {
      throw new Error(data.error || '搜索失败');
    }
  } catch (error) {
    console.error('自定义搜索失败:', error);
    alert(`搜索失败: ${error.message}`);
    if (imagesGrid) {
      imagesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666;">搜索失败</div>';
    }
  } finally {
    // 恢复按钮状态
    customSearchBtn.disabled = false;
    customSearchBtn.textContent = '🔍';
  }
}

// 获取当前选中的单词
function getCurrentWord() {
  if (!rightPanelTitle) return null;
  const titleText = rightPanelTitle.textContent;
  if (titleText === 'Word Details' || titleText === '单词详情') return null;
  return titleText.split(' - ')[0];
}
