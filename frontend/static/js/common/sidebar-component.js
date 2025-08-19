/**
 * 统一面板组件 - 可重用的面板部件（支持侧边栏、底部面板等）
 * 支持自定义内容插入和配置
 */
class SidebarComponent {
  constructor(options = {}) {
    this.options = {
      containerId: 'container',
      sidebarId: 'sidebar',
      overlayClass: 'sidebar-overlay',
      toggleButtonClass: 'sidebar-toggle',
      closeButtonClass: 'sidebar-close',
      showClass: 'show',
      title: '面板',
      position: 'left', // left, right, top, bottom
      autoHide: true, // 点击其他区域是否自动隐藏
      enableOverlay: true, // 是否启用遮罩层
      height: '40vh', // 底部面板时的高度
      width: '300px', // 侧边面板时的宽度
      showToggleButton: true, // 是否显示切换按钮
      ...options
    };
    
    this.isVisible = false;
    this.customContent = [];
    this.eventHandlers = {};
    
    this.init();
  }

  /**
   * 初始化面板组件
   */
  init() {
    this.createStructure();
    this.bindEvents();
    this.applyStyles();
  }

  /**
   * 创建HTML结构
   */
  createStructure() {
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      console.error(`Container with id "${this.options.containerId}" not found`);
      return;
    }

    // 创建切换按钮（只有在需要时才创建）
    if (this.options.showToggleButton) {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = this.options.toggleButtonClass;
      this.toggleButton.innerHTML = this.getToggleButtonIcon();
      this.toggleButton.setAttribute('aria-label', '切换面板');
      container.appendChild(this.toggleButton);
    }

    // 创建遮罩层
    if (this.options.enableOverlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = this.options.overlayClass;
      document.body.appendChild(this.overlay);
    }

    // 创建面板主体
    this.sidebar = document.createElement('div');
    this.sidebar.id = this.options.sidebarId;
    this.sidebar.className = `sidebar sidebar-${this.options.position}`;

    // 设置自定义宽度（对于左右面板）
    if ((this.options.position === 'left' || this.options.position === 'right') && this.options.width) {
      this.sidebar.style.width = this.options.width;
    }
    
    // 设置自定义高度（对于上下面板）
    if ((this.options.position === 'top' || this.options.position === 'bottom') && this.options.height) {
      this.sidebar.style.height = this.options.height;
    }

    // 创建关闭按钮
    this.closeButton = document.createElement('button');
    this.closeButton.className = this.options.closeButtonClass;
    this.closeButton.innerHTML = '×';
    this.closeButton.setAttribute('aria-label', '关闭面板');
    this.sidebar.appendChild(this.closeButton);

    // 创建标题
    this.titleElement = document.createElement('h3');
    this.titleElement.textContent = this.options.title;
    this.sidebar.appendChild(this.titleElement);

    // 创建内容容器
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'sidebar-content';
    this.sidebar.appendChild(this.contentContainer);

    // 将面板添加到body
    document.body.appendChild(this.sidebar);
  }

  /**
   * 获取切换按钮图标
   */
  getToggleButtonIcon() {
    switch (this.options.position) {
      case 'top':
        return '☰';
      case 'bottom':
        return '☰';
      case 'right':
        return '☰';
      case 'left':
      default:
        return '☰';
    }
  }

  /**
   * 应用样式
   */
  applyStyles() {
    // 检查是否已经加载了CSS文件
    if (!document.querySelector('link[href*="sidebar-component.css"]') && 
        !document.querySelector('#sidebar-component-styles')) {
      
      // 尝试加载外部CSS文件
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = '/static/css/sidebar-component.css';
      
      // 添加错误处理，如果外部CSS加载失败，则使用内联样式
      cssLink.onerror = () => {
        console.warn('无法加载外部CSS文件, 使用内联样式');
      };
      
      document.head.appendChild(cssLink);
    }
  }


 
  /**
   * 绑定事件
   */
  bindEvents() {
    // 切换按钮事件（只有存在时才绑定）
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggle());
    }

    // 关闭按钮事件
    this.closeButton.addEventListener('click', () => this.hide());

    // 遮罩层点击事件
    if (this.overlay && this.options.autoHide) {
      this.overlay.addEventListener('click', () => this.hide());
    }

    // 窗口大小变化事件
    window.addEventListener('resize', () => {
      if (this.isVisible) {
        this.hide();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * 显示面板
   */
  show() {
    if (this.isVisible) return;
    
    this.sidebar.classList.add(this.options.showClass);
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
    document.body.style.overflow = 'hidden';
    this.isVisible = true;
    
    this.trigger('show');
  }

  /**
   * 隐藏面板
   */
  hide() {
    if (!this.isVisible) return;
    
    this.sidebar.classList.remove(this.options.showClass);
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    this.isVisible = false;
    
    this.trigger('hide');
  }

  /**
   * 切换面板显示/隐藏
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 设置标题
   */
  setTitle(title) {
    this.options.title = title;
    this.titleElement.textContent = title;
  }

  /**
   * 添加自定义内容
   * @param {string|HTMLElement} content - 要添加的内容
   * @param {string} id - 内容的唯一标识符
   */
  addContent(content, id = null) {
    const contentId = id || `content-${Date.now()}`;
    
    // 创建内容包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'sidebar-content-item';
    wrapper.setAttribute('data-content-id', contentId);
    
    if (typeof content === 'string') {
      wrapper.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      wrapper.appendChild(content);
    }
    
    this.contentContainer.appendChild(wrapper);
    
    // 记录添加的内容
    this.customContent.push({
      id: contentId,
      element: wrapper,
      originalContent: content
    });
    
    return contentId;
  }

  /**
   * 移除指定内容
   * @param {string} contentId - 内容的唯一标识符
   */
  removeContent(contentId) {
    const item = this.customContent.find(item => item.id === contentId);
    if (item && item.element.parentNode) {
      item.element.parentNode.removeChild(item.element);
      this.customContent = this.customContent.filter(item => item.id !== contentId);
    }
  }

  /**
   * 清空所有自定义内容
   */
  clearContent() {
    this.contentContainer.innerHTML = '';
    this.customContent = [];
  }

  /**
   * 更新内容
   * @param {string} contentId - 内容的唯一标识符
   * @param {string|HTMLElement} newContent - 新的内容
   */
  updateContent(contentId, newContent) {
    const item = this.customContent.find(item => item.id === contentId);
    if (item) {
      if (typeof newContent === 'string') {
        item.element.innerHTML = newContent;
      } else if (newContent instanceof HTMLElement) {
        item.element.innerHTML = '';
        item.element.appendChild(newContent);
      }
      item.originalContent = newContent;
    }
  }

  /**
   * 获取内容元素
   * @param {string} contentId - 内容的唯一标识符
   */
  getContent(contentId) {
    const item = this.customContent.find(item => item.id === contentId);
    return item ? item.element : null;
  }

  /**
   * 绑定事件监听器
   * @param {string} event - 事件名称
   * @param {function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {function} handler - 事件处理函数
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  trigger(event, data = null) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler.call(this, data));
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除DOM元素
    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.sidebar && this.sidebar.parentNode) {
      this.sidebar.parentNode.removeChild(this.sidebar);
    }
    
    // 清理事件处理器
    this.eventHandlers = {};
    this.customContent = [];
    
    // 恢复body滚动
    document.body.style.overflow = 'auto';
  }
}

// 导出组件类
export default SidebarComponent;