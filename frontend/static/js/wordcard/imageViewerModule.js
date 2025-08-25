// ImageViewer.js
export default class ImageViewer {
  constructor({ containerId, cssUrl = null }) {
    this.containerId = containerId;
    this.cssUrl = cssUrl;

    // DOM 元素
    this.container = null;
    this.imageContainer = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.indicatorsContainer = null;

    // 状态
    this.images = [];
    this.currentIndex = 0;

    this.init();
  }

  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`容器 ID "${this.containerId}" 不存在`);
      return;
    }

    this.injectHTML();

    if (this.cssUrl) {
      // await this.loadCSS(this.cssUrl);
    }
  }

  injectHTML() {
    if (this.container.querySelector('.image-container')) return;

    const html = `
      <div class="image-container"></div>
      <div class="image-nav">
        <button class="image-btn" id="prevImageBtn">👈</button>
        <div class="image-indicators"></div>
        <button class="image-btn" id="nextImageBtn">👉</button>
      </div>
    `;
    this.container.innerHTML = html;

    this.imageContainer = this.container.querySelector('.image-container');
    this.prevBtn = this.container.querySelector('#prevImageBtn');
    this.nextBtn = this.container.querySelector('#nextImageBtn');
    this.indicatorsContainer = this.container.querySelector('.image-indicators');

    this.container.addEventListener('click', (e) => {
      if (e.target === this.prevBtn) this.prev();
      if (e.target === this.nextBtn) this.next();
      if (e.target.classList.contains('indicator')) {
        this.goToSlide(parseInt(e.target.dataset.slide));
      }
    });
  }

  // loadCSS(url) {
  //   return new Promise((resolve, reject) => {
  //     if (document.querySelector(`link[href="${url}"]`)) return resolve();
  //     const link = document.createElement('link');
  //     link.rel = 'stylesheet';
  //     link.href = url;
  //     link.onload = resolve;
  //     link.onerror = () => reject(new Error(`CSS 加载失败: ${url}`));
  //     document.head.appendChild(link);
  //   });
  // }

  setImages(newImages) {
    this.images = newImages || [];
    this.currentIndex = 0;
    this.render();
  }

  render() {
    if (!this.imageContainer) return;

    this.imageContainer.innerHTML = this.images.map((src, idx) => `
      <img src="${src}" class="image-slide ${idx === this.currentIndex ? 'active' : ''}">
    `).join('');

    this.indicatorsContainer.innerHTML = this.images.map((_, idx) => `
      <span class="indicator ${idx === this.currentIndex ? 'active' : ''}" data-slide="${idx}"></span>
    `).join('');

    this.updateButtons();
  }

  updateButtons() {
    if (!this.prevBtn || !this.nextBtn) return;
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled = this.currentIndex === this.images.length - 1;
  }

  goToSlide(index) {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.render();
    }
  }

  next() {
    this.goToSlide(this.currentIndex + 1);
  }

  prev() {
    this.goToSlide(this.currentIndex - 1);
  }
}
