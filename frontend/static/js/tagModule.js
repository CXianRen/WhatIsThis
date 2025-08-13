const TagModule = (function () {
  let isInitialized = false;
  let addTagOverlay;
  let tagListContainer, selectedTagsContainer, addTagInput;
  let closeCallback = null;

  // 状态变量
  let selectedWord = '';
  let wordTags = [];
  let tempTagList = [];
  let allowTagList = []; // 可选标签列表

  // callback
  let _getTaglist = null;
  let _getWordTags = null;
  let _addTag = null;
  let _addTagToWord = null;



  // ===== 动态插入 HTML =====
  function injectHTML() {
    if (document.getElementById('addTagOverlay')) return;

    const html = `
    <div id="addTagOverlay" class="add-tag-overlay" style="display:none;">
      <div class="add-tag-panel">
        <div class="add-tag-header">
          <button class="add-tag-close">&times;</button>
          <h3 id="addTagText">Adding ...</h3>
        </div>

        <span class="tag-list-title">Available Tags:</span>
        <div class="add-tag-content">
          <div id="tagListContainer" class="tag-list-container"></div>
          <div>
            <input type="text" class="add-tag-input" placeholder="输入标签，逗号分隔" />
            <button class="add-tag-button" id="addTagBtn">New tags</button>
          </div>
        </div>

        <span class="selected-tags-title">Selected Tags:</span>
        <div class="add-tag-content">
          <div id="SelectedTags" class="tag-list-container"></div>
          <button class="add-tag-button" id="saveTagsBtn">SAVE</button>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    addTagOverlay = document.getElementById('addTagOverlay');
    tagListContainer = document.getElementById('tagListContainer');
    selectedTagsContainer = document.getElementById('SelectedTags');
    addTagInput = addTagOverlay.querySelector('.add-tag-input');

    // 关闭按钮
    addTagOverlay.querySelector('.add-tag-close').addEventListener('click', close);

    // 新增标签按钮
    addTagOverlay.querySelector('#addTagBtn').addEventListener('click', addNewTags);

    // 保存按钮
    addTagOverlay.querySelector('#saveTagsBtn').addEventListener('click', saveTags);
  }

  // ===== 加载 CSS =====
  function loadCSS(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${url}"]`)) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`CSS 加载失败: ${url}`));
      document.head.appendChild(link);
    });
  }

  // ===== 初始化模块 =====
  async function init({ cssUrl = null,
    ccb = null,
    getTaglist = null,
    getWordTags = null,
    addTag = null,
    addTagToWord = null
  }) {
    if (isInitialized) return;

    closeCallback = ccb;
    _getTaglist = getTaglist;
    _getWordTags = getWordTags;
    _addTag = addTag;
    _addTagToWord = addTagToWord;

    injectHTML();

    if (cssUrl) await loadCSS(cssUrl);
    if (_getTaglist) getTaglist((tags) => {
      allowTagList = tags;
    }
    );

    isInitialized = true;
  }

  // ===== 显示面板 =====
  function show(word) {
    if (!word) return;

    selectedWord = word;

    tempTagList = []; // 临时列表
    wordTags = []; // 当前单词标签，可通过接口填充

    addTagOverlay.style.display = 'flex';
    addTagOverlay.querySelector('#addTagText').textContent = `Add: ${word}`;

    if (_getWordTags) _getWordTags(
      word, (tags) => {
        wordTags = tags;
        tempTagList = [...wordTags];
        renderTags();
        renderSelectedTags();
      }, (error) => {
        alert("get tags of word faild.")
      });
  }

  // ===== 关闭面板 =====
  function close() {
    if (addTagOverlay) addTagOverlay.style.display = 'none';
    if (typeof closeCallback === 'function') closeCallback();
  }

  // ===== 渲染可选标签 =====
  function renderTags() {
    if (!tagListContainer) return;
    tagListContainer.innerHTML = '';

    allowTagList.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-item';
      btn.textContent = tag;
      btn.onclick = () => {
        if (!tempTagList.includes(tag)) {
          tempTagList.push(tag);
          renderSelectedTags();
        }
      };
      tagListContainer.appendChild(btn);
    });
  }

  // ===== 渲染已选标签 =====
  function renderSelectedTags() {
    if (!selectedTagsContainer) return;
    selectedTagsContainer.innerHTML = '';

    tempTagList.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-item';
      btn.textContent = tag;
      btn.onclick = () => {
        tempTagList = tempTagList.filter(t => t !== tag);
        renderSelectedTags();
      };
      selectedTagsContainer.appendChild(btn);
    });
  }

  // ===== 添加新标签 =====
  function addNewTags() {
    if (!addTagInput || !addTagInput.value.trim()) return;

    const newTags = addTagInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t && !allowTagList.includes(t));

    if (newTags.length === 0) {
      return;
    }
    if (newTags.some(tag => allowTagList.includes(tag))) {
      return;
    }

    if (_addTag) _addTag(
      newTags, (tags) => {
        allowTagList = tags;
        renderTags();
        addTagInput.value = '';
      }, (error) => {
        alert("add new tag fail.");
      }
    );
  }

  // ===== 保存标签 =====
  function saveTags() {
    console.log(`保存标签 ${selectedWord}:`, tempTagList);
    if (tempTagList.length === wordTags.length &&
      tempTagList.every(tag => wordTags.includes(tag))) {
      return;
    }
    _addTagToWord(selectedWord, tempTagList,
      (response) => {
        alert("save tags!");
      }, (error) => {
        alert("save fail:", error);
      }
    );
  }

  return { init, show, close };
})();
