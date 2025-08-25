// ================== LearnPanel Class (ESM) ==================

export default class LearnPanel {
  constructor(container, apps = [
    {
      href: "/#wordcard",
      icon: "🎴",
      title: "Word Cards",
      description: "Review your vocabulary",
    },
    {
      href: "/#AIDict",
      icon: "🤖",
      title: "AI Dictionary",
      description: "Get AI-powered definitions and pronunciations",
    },
    {
      href: "/#sayit",
      icon: "🗣️",
      title: "Say It",
      description: "how to express a idea in any language",
    }
  ]) {
    this.container = container;
    this.apps = apps;
    this.panelElement = null;
    this.eventHandlers = []; // [{el, type, handler}]
  }

  // 工厂: 渲染 DOM 内容
  async render() {
    if (!this.container) return null;

    // 如果之前已經創建過，清空內容
    if (this.panelElement) {
      this.panelElement.innerHTML = "";
    } else {
      this.panelElement = document.createElement("div");
      this.panelElement.className = "learn-panel";
      this.container.appendChild(this.panelElement);
    }

    // 遍歷 apps 列表生成卡片
    this.apps.forEach(app => {
      const card = document.createElement("a");
      card.className = "learn-card";
      card.href = app.href;

      const icon = document.createElement("span");
      icon.className = "learn-icon";
      icon.textContent = app.icon;
      
      const detail = document.createElement("div");
      detail.className = "learn-details";

      const title = document.createElement("h3");
      title.className = "learn-title";
      title.textContent = app.title;

      const desc = document.createElement("p");
      desc.className = "learn-desc";
      desc.textContent = app.description;

      card.appendChild(icon);
      card.appendChild(detail);
      detail.appendChild(title);
      detail.appendChild(desc);
 
      this.panelElement.appendChild(card);
    });

    return this.panelElement;
  }

  // 生命周期: mount
  async mount() {
    await this.render();
    this.onMount?.();
  }

  // 生命周期: unmount
  unmount() {
    this.removeAllEvents();

    if (this.panelElement && this.container.contains(this.panelElement)) {
      this.container.removeChild(this.panelElement);
    }
    this.panelElement = null;

    this.onUnMount?.();
  }

  // hooks
  onMount() {
    // 可由外部覆盖
  }

  onUnMount() {
    // 可由外部覆盖
  }

  // 事件绑定
  addEvent(el, type, handler) {
    if (!el) return;
    el.addEventListener(type, handler);
    this.eventHandlers.push({ el, type, handler });
  }

  // 清理所有事件
  removeAllEvents() {
    this.eventHandlers.forEach(({ el, type, handler }) => {
      el.removeEventListener(type, handler);
    });
    this.eventHandlers = [];
  }
}
