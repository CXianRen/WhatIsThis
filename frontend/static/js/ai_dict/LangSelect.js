export default class LangSelect {
  /**
   * @param {HTMLElement} container 容器
   * @param {Array} options [{ code: 'en', label: 'English', flag: 'url' }, ...]
   * @param {String} defaultLang 默认选中语言 code
   * @param {Function} onChange 语言改变回调 (langCode) => {}
   */
  constructor({ container, options = [], defaultLang = "en", onChange = null }) {
    this.container = container;
    this.options = options;
    this.lang = defaultLang;
    this.onChange = onChange;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="custom-select">
        <div class="selected">
          <img src="${this.getFlag(this.lang)}" width="20"> ${this.getLabel(this.lang)}
        </div>
        <div class="options">
          ${this.options
        .map(
          (opt) =>
            `<div class="option" data-lang="${opt.code}"><img src="${opt.flag}" width="20"> ${opt.label}</div>`
        )
        .join("")}
        </div>
      </div>
    `;

    this.customSelect = this.container.querySelector(".custom-select");
    this.selected = this.customSelect.querySelector(".selected");
    this.optionsContainer = this.customSelect.querySelector(".options");
    this.optionEls = this.optionsContainer.querySelectorAll(".option");
  }

  bindEvents() {
    // 点击显示/隐藏下拉
    this.selected.addEventListener("click", () => {
      this.optionsContainer.style.display =
        this.optionsContainer.style.display === "block" ? "none" : "block";
    });

    // 选择
    this.optionEls.forEach((opt) => {
      opt.addEventListener("click", () => {
        this.lang = opt.dataset.lang;
        this.selected.innerHTML = opt.innerHTML;
        this.optionsContainer.style.display = "none";
        this.onChange && this.onChange(this.lang);
      });
    });

    // 点击外部关闭
    document.addEventListener("click", (e) => {
      if (!this.customSelect.contains(e.target)) {
        this.optionsContainer.style.display = "none";
      }
    });
  }

  getFlag(code) {
    const opt = this.options.find((o) => o.code === code);
    return opt ? opt.flag : "";
  }

  getLabel(code) {
    const opt = this.options.find((o) => o.code === code);
    return opt ? opt.label : "";
  }

  getValue() {
    return this.lang;
  }

  setValue(code) {
    this.lang = code;
    this.selected.innerHTML = `<img src="${this.getFlag(code)}" width="20"> ${this.getLabel(
      code
    )}`;
  }
}