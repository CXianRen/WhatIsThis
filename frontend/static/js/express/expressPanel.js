// WordYouglishPanel.js
import WordWidget from "../reader/wordWidget.js";
import YouglishWidget from "../reader/youglishWidget.js";
import LangSelect from "../ai_dict/LangSelect.js";

export default class ExpressPanel {
  constructor({ container }) {
    this.container = container;
    this.mounted = false;

    // 初始化语言选择组件
    this.langs = [
      { code: "en", label: "English", flag: "https://flagcdn.com/gb.svg" },
      { code: "fr", label: "Français", flag: "https://flagcdn.com/fr.svg" },
      { code: "se", label: "Svenska", flag: "https://flagcdn.com/se.svg" },
      { code: "zh", label: "中文", flag: "https://flagcdn.com/cn.svg" },
    ];

  }

  mount() {
    if (this.mounted) return;
    this.mounted = true;
    this.render();
    this.bindEvents();
  }

  unmount() {
    if (!this.mounted) return;
    this.mounted = false;
    this.container.innerHTML = "";
  }

  render() {
    this.container.innerHTML = `
      <div class="word-panel">
        <div class="lang-select" style="display:flex; gap:16px; justify-content:center; align-items:center;">
          <div class="lang-item">
            <label for="target-lang-select">Search:</label>
            <div id="target-lang"></div>
          </div>
        </div>
      </div>
    `;

    // 保存引用
    this.titleEl = this.container.querySelector(".word-title");
    this.pronunciationEl = this.container.querySelector(".word-pronunciation");
    this.wordContentEl = this.container.querySelector(".word-content");
    this.youglishContainer = this.container.querySelector("#youglish-widget-container");
    this.youglishStatus = this.container.querySelector(".youglish-status");

    this.loadConfig();


    this.targetLangSelect = new LangSelect({
      container: this.container.querySelector("#target-lang"),
      options: this.langs,
      defaultLang: this.targetLang || "en",
      onChange: (lang) => {
        this.targetLang = lang;
        this.saveConfig();
      },
    });

    this.explainLangSelect = new LangSelect({
      container: this.container.querySelector("#explain-lang"),
      options: this.langs,
      defaultLang: this.explainLang || "en",
      onChange: (lang) => {
        this.explainLang = lang;
        this.saveConfig();
      },
    });

    this.targetLang = this.targetLangSelect.getValue();
    this.explainLang = this.explainLangSelect.getValue();
  }

  bindEvents() {
    // 搜索按钮
    this.container.querySelector(".search-btn").addEventListener("click", () => {
      const word = this.container.querySelector(".word-input").value.trim();
      if (!word) return;

      this.wordWidget.loadWord(word, this.targetLang, this.explainLang);
      this.youglishWidget.search(word, this.ylang_map[this.targetLang] || "english");
    });

    // tab 切换
    this.container.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        this.container.querySelectorAll(".tab-btn").forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");

        this.container.querySelectorAll(".tab-panel").forEach((p) =>
          p.classList.remove("active")
        );
        this.container.querySelector(`.${tab}-panel`).classList.add("active");

        if (tab === "dict" && this.youglishWidget) {
          this.youglishWidget.pause();
        }
      });
    });
  }

  // loadconfig from localStorage
  // src language and explain language
  // if not exist, use default 'en' and 'en'
  loadConfig() {
    const srcLang = localStorage.getItem("dict_src_lang") || "en";
    const explainLang = localStorage.getItem("dict_explain_lang") || "en";
    this.targetLang = srcLang;
    this.explainLang = explainLang;
  }

  saveConfig() {
    localStorage.setItem("dict_src_lang", this.targetLang);
    localStorage.setItem("dict_explain_lang", this.explainLang);
  }

}

