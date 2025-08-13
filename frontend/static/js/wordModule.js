const WordModule = (function () {
  let isInitialized = false;

  let wordDetailOverlay, wordTitle, wordPronunciation, wordDetailContent;
  let closeCallback = null;

  // ===== 动态插入 HTML =====
  function injectHTML() {
    if (document.getElementById('wordDetailOverlay')) return;

    const html = `
    <div id="wordDetailOverlay" class="word-detail-overlay" style="display:none">
      <div class="word-detail-panel">
        <div class="word-detail-header">
          <button class="word-detail-close">&times;</button>
          <div class="word-title" id="wordTitle">单词</div>
          <div class="word-pronunciation" id="wordPronunciation"></div>
        </div>

        <div class="word-detail-content" id="wordDetailContent">
          <div class="word-loading">正在加载单词信息...</div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    wordDetailOverlay = document.getElementById('wordDetailOverlay');
    wordTitle = document.getElementById('wordTitle');
    wordPronunciation = document.getElementById('wordPronunciation');
    wordDetailContent = document.getElementById('wordDetailContent');

    // 关闭按钮
    const closeBtn = wordDetailOverlay.querySelector('.word-detail-close');
    closeBtn.addEventListener('click', () => close());
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
  async function init({ cssUrl, ccb = null }) {
    if (isInitialized) return;

    closeCallback = ccb;
    injectHTML();

    if (cssUrl) await loadCSS(cssUrl);

    isInitialized = true;
  }

  // ===== 显示面板 =====
  async function show(word) {
    if (!word) return;

    wordTitle.textContent = word;
    wordPronunciation.textContent = '';
    wordDetailContent.innerHTML = '<div class="word-loading">正在加载单词信息...</div>';
    wordDetailOverlay.style.display = 'flex';

    try {
      const response = await fetch(`/api/vocb/word/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('网络请求失败');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 更新面板内容
      wordTitle.textContent = data.word || word;
      wordPronunciation.textContent = data.pronunciation ?
        `${data.pronunciation} (${data.spelling_pronunciation || ''})` : '';

      let detailHTML = '';

      // 中文解释
      if (data.explain_zh?.length) {
        detailHTML += '<div class="definition-section"><h4>中文解释:</h4><ul>';
        data.explain_zh.forEach(e => detailHTML += `<li>${e}</li>`);
        detailHTML += '</ul></div>';
      }

      // 英文解释
      if (data.explain_en?.length) {
        detailHTML += '<div class="definition-section"><h4>英文解释:</h4><ul>';
        data.explain_en.forEach(e => detailHTML += `<li>${e}</li>`);
        detailHTML += '</ul></div>';
      }

      // 例句
      if (data.example_sentences?.length) {
        detailHTML += '<div class="definition-section"><h4>例句:</h4>';
        data.example_sentences.forEach(ex => {
          detailHTML += `
          <div class="example-sentence">
            <div class="scenario">${ex.scenario}</div>
            <div class="en-sentence">${ex.en}</div>
            <div class="zh-sentence">${ex.zh}</div>
          </div>`;
        });
        detailHTML += '</div>';
      }

      // 同义词
      if (data.synonyms?.length) {
        detailHTML += '<div class="definition-section"><h4>同义词:</h4><div class="synonyms">';
        data.synonyms.forEach(s => detailHTML += `<span class="synonym">${s}</span>`);
        detailHTML += '</div></div>';
      }

      wordDetailContent.innerHTML = detailHTML || '<div class="word-error">暂无详细信息</div>';

    } catch (error) {
      console.error('加载单词详细信息失败:', error);
      wordDetailContent.innerHTML = `<div class="word-error">加载失败: ${error.message}</div>`;
    }
  }

  // ===== 关闭面板 =====
  function close() {
    if (wordDetailOverlay) wordDetailOverlay.style.display = "none";
    if (closeCallback && typeof closeCallback === "function") {
      closeCallback();
    }
  }

  return { init, show, close };
})();
