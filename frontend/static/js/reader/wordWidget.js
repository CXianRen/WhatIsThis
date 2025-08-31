import { fetchWordDetail } from '../common/api_vocb.js';

export default class WordWidget {
  constructor({ titleEl, pronunciationEl, contentEl }) {
    this.titleEl = titleEl;
    this.pronunciationEl = pronunciationEl;
    this.contentEl = contentEl;
  }
  async loadWord(word, lang = 'en', nativeLang = 'zh') {
    // 初始化 UI
    this.titleEl.textContent = word;
    this.pronunciationEl.textContent = '';
    this.contentEl.innerHTML = '<div class="word-loading">Loading, might take some seconds...</div>';

    try {
      const data = await fetchWordDetail({ word, lang, nativeLang });

      // 标题 & 发音
      this.titleEl.textContent = data.word || word;
      this.pronunciationEl.textContent = data.pronunciation
        ? `${data.pronunciation} (${data.spelling_pronunciation || ''})`
        : '';

      // 构造详细内容
      let detailHTML = '';

      const srcKey = `explain_${nativeLang}`;
      const dstKey = `explain_${lang}`;

      if (data[srcKey]?.length) {
        detailHTML += '<div class="definition-section"><h4>Explanation (Native):</h4><ul>';
        data[srcKey].forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data[dstKey]?.length) {
        detailHTML += '<div class="definition-section"><h4>Explanation (Target):</h4><ul>';
        data[dstKey].forEach((e) => (detailHTML += `<li>${e}</li>`));
        detailHTML += '</ul></div>';
      }

      if (data.example_sentences?.length) {
        detailHTML += '<div class="definition-section"><h4>Examples:</h4>';
        data.example_sentences.forEach((ex) => {
          detailHTML += `
          <div class="example-sentence">
            <div class="scenario">${ex.scenario || ''}</div>
            <div class="en-sentence">${ex[lang] || ''}</div>
            <div class="zh-sentence">${ex[nativeLang] || ''}</div>
          </div>`;
        });
        detailHTML += '</div>';
      }

      if (data.synonyms?.length) {
        detailHTML += '<div class="definition-section"><h4>Synonyms:</h4><div class="synonyms">';
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
