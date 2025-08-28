// ================== SettingPanel Class (ESM) ==================
import { toPath } from '../router/router.js';
import { getUserInfo, logout } from '../user/login.js';

const settingConfig = [
  {
    panelTitle: 'General',
    settings: [
      { type: 'checkbox', id: 'enable-feature', label: 'Enable Feature' },
      {
        type: 'select', id: 'theme-select', label: 'Theme', options: [
          { value: 'light', text: 'Light' },
          { value: 'dark', text: 'Dark' }
        ]
      }
    ],
  },
  {
    panelTitle: 'Notifications',
    settings: [
      { type: 'checkbox', id: 'enable-notifications', label: 'Enable Notifications' },
    ],
  },
  {
    panelTitle: 'Book Management',
    settings: [
      { type: 'button', id: 'goto-library', label: 'Add book from library', path: 'library' },
      { type: 'button', id: 'goto-book-manage', label: 'Manage your books', path: 'manage' },
    ]
  }
];

export default class SettingPanel {
  constructor(container) {
    this.container = container;
    this.panelElement = null;
    this.eventHandlers = [];
  }

  async render() {
    if (!this.container) return null;
    if (this.panelElement) this.panelElement.innerHTML = '';
    else {
      this.panelElement = document.createElement('div');
      this.panelElement.id = 'setting-container';
      this.container.appendChild(this.panelElement);
    }

    // User Info
    const userInfo = document.createElement('div'); userInfo.id = 'user-info';
    const avatar = document.createElement('img'); avatar.id = 'user-avatar';
    avatar.src = window.user?.avatar || '/static/imgs/default-avatar.png';
    avatar.alt = 'User Avatar'; avatar.width = 48; avatar.height = 48;

    try {
      const user = await getUserInfo();
      const div = document.createElement('div'); div.id = 'user-details';
      const userId = document.createElement('span'); userId.id = 'user-id';
      userId.textContent = user.username || user.email || 'Unknown User';
      const logoutBtn = document.createElement('button'); logoutBtn.id = 'logout-btn';
      logoutBtn.textContent = 'Logout';
      this.addEvent(logoutBtn, 'click', async () => { await logout(); window.location.reload(); });
      userInfo.appendChild(avatar); div.appendChild(userId); div.appendChild(logoutBtn); userInfo.appendChild(div);
    } catch {
      const loginBtn = document.createElement('button'); loginBtn.id = 'login-btn'; loginBtn.textContent = 'Login';
      this.addEvent(loginBtn, 'click', () => { toPath('login'); });
      userInfo.appendChild(avatar); userInfo.appendChild(loginBtn);
    }

    // Settings Panels
    const panels = document.createElement('div'); panels.id = 'setting-panels';
    settingConfig.forEach(panelCfg => {
      const panel = document.createElement('div'); panel.className = 'setting-panel';
      const h2 = document.createElement('h2'); h2.textContent = panelCfg.panelTitle; panel.appendChild(h2);

      panelCfg.settings.forEach(setting => {
        const label = document.createElement('label');

        if (setting.type === 'checkbox') {
          const input = document.createElement('input'); input.type = 'checkbox'; input.id = setting.id;
          label.appendChild(document.createTextNode(' ' + setting.label)); label.appendChild(input);
        } else if (setting.type === 'select') {
          const select = document.createElement('select'); select.id = setting.id;
          setting.options.forEach(opt => { const option = document.createElement('option'); option.value = opt.value; option.textContent = opt.text; select.appendChild(option); });
          label.appendChild(document.createTextNode(' ' + setting.label)); label.appendChild(select);
        } else if (setting.type === 'button') {
          const btn = document.createElement('button'); btn.id = setting.id; btn.textContent = setting.label;
          this.addEvent(btn, 'click', () => {
            if (setting.path) toPath(setting.path);
          });
          panel.appendChild(btn);
        }

        if (setting.type !== 'button') panel.appendChild(label);
      });

      panels.appendChild(panel);
    });

    // Clear Settings Button
    const clearBtn = document.createElement('button'); clearBtn.id = 'clear-settings-btn'; clearBtn.textContent = 'Clear Settings';
    this.addEvent(clearBtn, 'click', () => { console.log('Settings cleared!'); });

    this.panelElement.appendChild(userInfo);
    this.panelElement.appendChild(panels);
    this.panelElement.appendChild(clearBtn);

    return this.panelElement;
  }

  // 生命周期
  async mount() { await this.render(); this.onMount?.(); }
  unmount() { this.removeAllEvents(); if (this.panelElement && this.container.contains(this.panelElement)) this.container.removeChild(this.panelElement); this.panelElement = null; this.onUnMount?.(); }
  onMount() { }
  onUnMount() { }

  // 事件管理
  addEvent(el, type, handler) { if (!el) return; el.addEventListener(type, handler); this.eventHandlers.push({ el, type, handler }); }
  removeAllEvents() { this.eventHandlers.forEach(({ el, type, handler }) => el.removeEventListener(type, handler)); this.eventHandlers = []; }
}
