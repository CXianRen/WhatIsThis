import { fetchWordAnalysis } from '../common/api_vocb.js';
import { getToken } from '../user/login.js';

export default class WordAnalysisWidget {
  constructor({ titleEl, contentEl }) {
    this.titleEl = titleEl;
    this.contentEl = contentEl;
  }

  renderAnalysis(data) {
    if (!data) {
      this.contentEl.innerHTML = '<div class="word-error">No data provided.</div>';
      return;
    }

    // 更新标题
    // if (this.titleEl) {
    //   this.titleEl.textContent = data.word || 'Word Analysis';
    // }

    let html = '';

    // 基本信息
    html += `<div class="definition-section">
      <h4>Basic Info</h4>
      <ul>
        <li><strong>Part of speech:</strong> ${data.part}</li>
        <li><strong>Meaning:</strong> ${data.meaning}</li>
        <li><strong>Level:</strong> ${data.level}</li>
        <li><strong>Feature:</strong> ${data.features}</li>
      </ul>
    </div>`;

    // 口语替换
    if (data.oral_replacement?.length) {
      html += '<div class="definition-section"><h4>Oral Replacement</h4><ul>';
      data.oral_replacement.forEach((item) => {
        html += `<li><strong>${item.word}:</strong> ${item.replaced}</li>`;
      });
      html += '</ul></div>';
    }

    // 等级替换
    if (data.cases_of_levels?.length) {
      html += '<div class="definition-section"><h4>Cases by Levels</h4><ul>';
      data.cases_of_levels.forEach((item) => {
        html += `<li>
          <strong>Level ${item.level} - ${item.words}:</strong> ${item.replaced}
          <br><em>Chinese: ${item.chinese}</em>
        </li>`;
      });
      html += '</ul></div>';
    }

    this.contentEl.innerHTML = html || '<div class="word-error">No analysis available.</div>';
  }

  async loadWordAnalysis(word, text, lang, nativeLang) {
    try {
      const data = await fetchWordAnalysis({ word, text, lang, nativeLang });
      this.renderAnalysis(data);
    } catch (error) {
      console.error('Failed to load word analysis:', error);
      this.contentEl.innerHTML = `<div class="word-error">Load fail: ${error.message}</div>`;
    }
  }

}
