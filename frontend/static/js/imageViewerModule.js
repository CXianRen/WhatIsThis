const ImageViewerModule = (function () {
  let isInitialized = false;
  let container, prevBtn, nextBtn, indicatorsContainer;
  let images = [];
  let currentIndex = 0;

  function injectHTML(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;
    if (container.querySelector('.image-container')) return; // 已经注入过

    const html = `
      <div class="image-container"></div>
      <div class="image-nav">
        <button class="image-btn" id="prevImageBtn">👈</button>
        <div class="image-indicators"></div>
        <button class="image-btn" id="nextImageBtn">👉</button>
      </div>
    `;
    container.innerHTML = html;

    prevBtn = container.querySelector('#prevImageBtn');
    nextBtn = container.querySelector('#nextImageBtn');
    indicatorsContainer = container.querySelector('.image-indicators');

    // 绑定点击事件
    container.addEventListener('click', (e) => {
      if (e.target === prevBtn) prev();
      if (e.target === nextBtn) next();
      if (e.target.classList.contains('indicator')) {
        goToSlide(parseInt(e.target.dataset.slide));
      }
    });
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
  function render() {
    if (!container) return;
    const imageContainer = container.querySelector('.image-container');

    imageContainer.innerHTML = images.map((src, idx) => `
      <img src="${src}" class="image-slide ${idx === currentIndex ? 'active' : ''}">
    `).join('');

    indicatorsContainer.innerHTML = images.map((_, idx) => `
      <span class="indicator ${idx === currentIndex ? 'active' : ''}" data-slide="${idx}"></span>
    `).join('');

    updateButtons();
  }

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === images.length - 1;
  }

  function goToSlide(index) {
    if (index >= 0 && index < images.length) {
      currentIndex = index;
      render();
    }
  }

  function next() {
    goToSlide(currentIndex + 1);
  }

  function prev() {
    goToSlide(currentIndex - 1);
  }

  function setImages(newImages) {
    images = newImages || [];
    currentIndex = 0;
    render();
  }

  async function init({ cssUrl= null, containerId }) {
    if (isInitialized) return;

    injectHTML(containerId);

    if (cssUrl) await loadCSS(cssUrl);

    isInitialized = true;
  }

  return { init, setImages };
})();
