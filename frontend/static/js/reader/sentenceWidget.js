// sentenceWidget.js
export default class SentenceWidget {
  constructor({ container, toolBarModule, onWordSelected, srcLang, dstLang }) {
    this.container = container;
    this.toolBarModule = toolBarModule;
    this.onWordSelected = onWordSelected;

    this.sentenceStates = {}; // index: 'dest' | 'source'
    this.selectedWord = '';
    this.longPressTimer = null;
    this.isDragSelection = false;

    this.srcLang = srcLang || 'src';
    this.dstLang = dstLang || 'dst';
  }

  render(srcSentences, dstSentences, fontSizeClass) {
    const sentenceHTML = srcSentences.map((src, index) => {
      const currentState = this.sentenceStates[index] || 'dest';
      const isSource = currentState === 'source';
      const cssClass = isSource ? 'source-text' : 'dest-text';
      const text = isSource ? src.sentence : dstSentences[index].sentence;

      const toggleIcon = isSource ? this.srcLang : this.dstLang;
      const toggleTitle = isSource ? 'Switch to dst language' : 'Switch to src language';

      return `
        <div class="sentence ${isSource ? 'source' : ''}" data-index="${index}">
          <div class="language-toggle" title="${toggleTitle}">
            ${toggleIcon}
          </div>
          <div class="sentence-text">
            <div class="${cssClass}">${text}</div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `<div class="sentence-container ${fontSizeClass}">${sentenceHTML}</div>`;

    this._bindEvents(srcSentences, dstSentences);
  }

  _bindEvents(srcSentences, dstSentences) {
    this.container.querySelectorAll('.sentence').forEach(sentenceEl => {
      const index = parseInt(sentenceEl.dataset.index);

      // 切换语言
      sentenceEl.querySelector('.language-toggle')
        .addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleSentence(index, srcSentences, dstSentences);
        });

      // 鼠标 / 触摸事件
      const textEl = sentenceEl.querySelector('.sentence-text');
      textEl.addEventListener('mousedown', this._handleMouseDown.bind(this));
      textEl.addEventListener('mouseup', this._handleMouseUp.bind(this));
      textEl.addEventListener('touchstart', this._handleTouchStart.bind(this));
      textEl.addEventListener('touchend', this._handleTouchEnd.bind(this));
      textEl.addEventListener('touchmove', this._handleTouchMove.bind(this));
      textEl.addEventListener('contextmenu', e => e.preventDefault());
    });
  }

  toggleSentence(index, srcSentences, dstSentences) {
    const currentState = this.sentenceStates[index] || 'dest';
    this.sentenceStates[index] = currentState === 'source' ? 'dest' : 'source';
    this.render(srcSentences, dstSentences, this._getFontSizeClass());
  }

  _handleMouseDown(e) {
    this._clearWordSelection();
    clearTimeout(this.longPressTimer);
    e.startTime = Date.now();
  }

  _handleMouseUp(e) {
    const clickDuration = Date.now() - (e.startTime || 0);
    if (clickDuration > 1000) {
      setTimeout(() => this._handleTextSelection(e), 100);
    }
  }

  _handleTouchStart(e) {
    this._clearWordSelection();
    window.getSelection().removeAllRanges();
    clearTimeout(this.longPressTimer);

    const touch = e.touches[0];
    e.startX = touch.clientX;
    e.startY = touch.clientY;

    this.isDragSelection = false;

    this.longPressTimer = setTimeout(() => {
      this.isDragSelection = true;
      window.getSelection().removeAllRanges();
    }, 600);
  }

  _handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);

    if (this.isDragSelection) {
      setTimeout(() => {
        const selection = window.getSelection();
        const word = selection.toString().trim();
        if (word) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const x = rect.left + window.scrollX + rect.width / 2;
          const y = rect.bottom + window.scrollY;

          this.selectedWord = word;
          this.toolBarModule?.show(x, y);
          this._highlightWord(word);

          this.onWordSelected?.(word);
        }
      }, 100);
    }
  }

  _handleTouchMove(e) {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - (e.startX || 0));
    const deltaY = Math.abs(touch.clientY - (e.startY || 0));

    if (!this.isDragSelection && (deltaX > 5 || deltaY > 5)) {
      clearTimeout(this.longPressTimer);
    }
  }

  _handleTextSelection(e) {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      this.selectedWord = text;
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.bottom;

      this.toolBarModule?.show(x, y);
      this._highlightWord(text);
      this.onWordSelected?.(text);

      selection.removeAllRanges();
    }
  }

  _highlightWord(word) {
    this.container.querySelectorAll('.sentence-text').forEach(el => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      el.innerHTML = el.innerHTML.replace(regex,
        '<span class="selected-word-highlight">$1</span>'
      );
    });
  }

  _clearWordSelection() {
    this.container.querySelectorAll('.selected-word-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  }

  _getFontSizeClass() {
    const sentenceContainer = this.container.querySelector('.sentence-container');
    return sentenceContainer ? [...sentenceContainer.classList].find(c => c.startsWith('font-size-')) : '';
  }
}
