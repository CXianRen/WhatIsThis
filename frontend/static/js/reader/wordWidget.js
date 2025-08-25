
export default class WordWidget {
  constructor({ titleEl, pronunciationEl, contentEl }) {
    this.titleEl = titleEl;
    this.pronunciationEl = pronunciationEl;
    this.contentEl = contentEl;
  }

  async loadWord(word, lang = 'en', native_lang = 'zh') {
    // 初始化
    this.titleEl.textContent = word;
    this.pronunciationEl.textContent = '';
    this.contentEl.innerHTML = '<div class="word-loading">Loading, might take some seconds...</div>';

    try {
      const response = await fetch(`/api/vocb/word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, lang, native_lang })
      });

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
      const src_explanation_key = "explain_" + native_lang;
      const dst_explanation_key = "explain_" + lang;
      // console.log("src_explanation_key:", src_explanation_key);
      // console.log("dst_explanation_key:", dst_explanation_key);

      if (data[src_explanation_key]?.length) {
        detailHTML += '<div class="definition-section"><h4>Explanation:</h4><ul>';
        data[src_explanation_key].forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data[dst_explanation_key]?.length) {
        detailHTML += '<div class="definition-section"><h4>Explanation:</h4><ul>';
        data[dst_explanation_key].forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data.example_sentences?.length) {
        detailHTML += '<div class="definition-section"><h4>Example:</h4>';
        data.example_sentences.forEach((ex) => {
          detailHTML += `
            <div class="example-sentence">
              <div class="scenario">${ex.scenario}</div>
              <div class="en-sentence">${ex[lang]}</div>
              <div class="zh-sentence">${ex[native_lang]}</div>
            </div>`;
        });
        detailHTML += '</div>';
      }

      if (data.synonyms?.length) {
        detailHTML += '<div class="definition-section"><h4>Synonym:</h4><div class="synonyms">';
        data.synonyms.forEach((s) => (detailHTML += `<span class="synonym">${s}</span>`));
        detailHTML += '</div></div>';
      }

      this.contentEl.innerHTML = detailHTML || '<div class="word-error">Cannot find any useful info.</div>';
    } catch (error) {
      console.error('加载单词详细信息失败:', error);
      this.contentEl.innerHTML = `<div class="word-error">Load fail: ${error.message}</div>`;
    }
  }
}
