import { toPath } from '../router/router.js';

// temporary setting.js file for frontend static JS settings component
const settingConfig = [
  {
    panelTitle: 'General',
    settings: [
      {
        type: 'checkbox',
        id: 'enable-feature',
        label: 'Enable Feature'
      },
      {
        type: 'select',
        id: 'theme-select',
        label: 'Theme',
        options: [
          { value: 'light', text: 'Light' },
          { value: 'dark', text: 'Dark' }
        ]
      }
    ]
  },
  {
    panelTitle: 'Notifications',
    settings: [
      {
        type: 'checkbox',
        id: 'enable-notifications',
        label: 'Enable Notifications'
      }
    ]
  }
];

export function renderSettingComponent() {
  // User Info Area
  const container = document.createElement('div');
  container.id = 'setting-container';

  // User Info
  const userInfo = document.createElement('div');
  userInfo.id = 'user-info';

  const avatar = document.createElement('img');
  avatar.id = 'user-avatar';
  avatar.src = window.user && window.user.avatar ? window.user.avatar : '/static/imgs/default-avatar.png';
  avatar.alt = 'User Avatar';
  avatar.width = 48;
  avatar.height = 48;

  if (window.user && window.user.id) {
    const userId = document.createElement('span');
    userId.id = 'user-id';
    userId.textContent = window.user.id;
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = () => {
      // logout logic here
    };
    userInfo.appendChild(avatar);
    userInfo.appendChild(userId);
    userInfo.appendChild(logoutBtn);
  } else {
    const loginBtn = document.createElement('button');
    loginBtn.id = 'login-btn';
    loginBtn.textContent = 'Login';
    loginBtn.onclick = () => {
      // login logic here
      toPath('login');
    };
    userInfo.appendChild(avatar);
    userInfo.appendChild(loginBtn);
  }

  // Settings Panels
  const panels = document.createElement('div');
  panels.id = 'setting-panels';

  // Create each settings panel based on the configuration
  settingConfig.forEach(panelCfg => {
    const panel = document.createElement('div');
    panel.className = 'setting-panel';
    const h2 = document.createElement('h2');
    h2.textContent = panelCfg.panelTitle;
    panel.appendChild(h2);

    panelCfg.settings.forEach(setting => {
      const label = document.createElement('label');
      if (setting.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = setting.id;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + setting.label));
      } else if (setting.type === 'select') {
        const select = document.createElement('select');
        select.id = setting.id;
        setting.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          select.appendChild(option);
        });
        label.appendChild(select);
        label.appendChild(document.createTextNode(' ' + setting.label));
      }
      panel.appendChild(label);
    });

    panels.appendChild(panel);
  });

  // Clear Settings Button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-settings-btn';
  clearBtn.textContent = 'Clear Settings';
  clearBtn.onclick = () => {
    // clear settings logic here
  };

  container.appendChild(userInfo);
  container.appendChild(panels);
  container.appendChild(clearBtn);

  return container;
}