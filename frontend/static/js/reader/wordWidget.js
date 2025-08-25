
export default class WordWidget {
  constructor({ titleEl, pronunciationEl, contentEl }) {
    this.titleEl = titleEl;
    this.pronunciationEl = pronunciationEl;
    this.contentEl = contentEl;
  }

  async loadWord(word) {
    // 初始化
    this.titleEl.textContent = word;
    this.pronunciationEl.textContent = '';
    this.contentEl.innerHTML = '<div class="word-loading">正在加载单词信息...</div>';

    try {
      const response = await fetch(`/api/vocb/word/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('网络请求失败');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 更新标题和发音
      if (this.titleEl) {
        this.titleEl.textContent = data.word || word;
      }

      if (this.pronunciationEl) {
        this.pronunciationEl.textContent = data.pronunciation
          ? `${data.pronunciation} (${data.spelling_pronunciation || ''})`
          : '';
      }

      // 构建详细内容
      let detailHTML = '';

      if (data.explain_zh?.length) {
        detailHTML += '<div class="definition-section"><h4>中文解释:</h4><ul>';
        data.explain_zh.forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data.explain_en?.length) {
        detailHTML += '<div class="definition-section"><h4>英文解释:</h4><ul>';
        data.explain_en.forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data.example_sentences?.length) {
        detailHTML += '<div class="definition-section"><h4>例句:</h4>';
        data.example_sentences.forEach((ex) => {
          detailHTML += `
            <div class="example-sentence">
              <div class="scenario">${ex.scenario}</div>
              <div class="en-sentence">${ex.en}</div>
              <div class="zh-sentence">${ex.zh}</div>
            </div>`;
        });
        detailHTML += '</div>';
      }

      if (data.synonyms?.length) {
        detailHTML += '<div class="definition-section"><h4>同义词:</h4><div class="synonyms">';
        data.synonyms.forEach((s) => (detailHTML += `<span class="synonym">${s}</span>`));
        detailHTML += '</div></div>';
      }

      this.contentEl.innerHTML = detailHTML || '<div class="word-error">暂无详细信息</div>';
    } catch (error) {
      console.error('加载单词详细信息失败:', error);
      this.contentEl.innerHTML = `<div class="word-error">加载失败: ${error.message}</div>`;
    }
  }
}
