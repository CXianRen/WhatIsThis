let register_path = [];
let navbar = null;
let currentPath = null;
let stateStore = {}; // for saving path data

import { isLoggedIn } from '../user/login.js';

function registerPath(path, config = {}) {
  if (register_path.some(p => p.path === path)) {
    console.warn(`Path ${path} is already registered.`);
    return;
  }
  register_path.push({ path, config });
  console.log(`Path ${path} registered successfully.`);
}

function toPath(path, data = null, pushHistory = true) {
  console.log(`Navigating to path: ${path}`);

  // check if path is registered
  const page = register_path.find(p => p.path === path);
  if (!page) {
    console.error(`Path ${path} is not registered.`);
    alert(`Error: Page ${path} is not registered.`);
    return;
  }

  const pathConfig = page.config;

  // 默认需要登录
  if (!('requiresLogin' in pathConfig)) {
    pathConfig.requiresLogin = true;
  }
  if (pathConfig.requiresLogin && !isLoggedIn()) {
    toPath('login');
    return;
  }

  // --- 调用上一个页面的 unmount ---
  if (currentPath) {
    const prevPage = register_path.find(p => p.path === currentPath);
    if (prevPage && prevPage.config.onUnmount) {
      prevPage.config.onUnmount();
    }
  }

  currentPath = path;

  // 存储数据
  if (data !== null) {
    stateStore[path] = data;
  }

  // 更新 URL hash
  if (pushHistory) {
    let url = '#' + path;
    location.hash = url;
    console.log(`Updating URL hash to: #${path}`);
  }

  // 切换 DOM display
  register_path.forEach(p => {
    const el = document.querySelector(`.${p.path}`);
    if (el) {
      el.style.display = p.path === path ? 'flex' : 'none';
      if (p.path === path) {
        if (p.config.fullscreen === true) {
          navbar.style.display = 'none';
          console.log(`Hiding navbar for full-screen path: ${path}`);
        } else {
          navbar.style.display = 'block';
        }
      }
    }
  });

  // --- 调用新页面的 mount ---
  if (pathConfig.onMount) {
    pathConfig.onMount(stateStore[path] || null);
  }
}

function registerNavBar(bar) {
  navbar = bar;
}

function getPathData(path = currentPath) {
  return stateStore[path] || null;
}

// hashchange
window.addEventListener('hashchange', () => {
  const hash = location.hash.slice(1);
  if (!hash) return;

  const [path, queryStr] = hash.split('?');
  let query = {};
  if (queryStr) {
    query = Object.fromEntries(new URLSearchParams(queryStr));
  }

  const data = stateStore[path] || query;
  if (path && path !== currentPath) {
    toPath(path, data, false);
  }
});

// initial load
window.addEventListener('load', () => {
  const hash = location.hash.slice(1);
  if (!hash && register_path.length > 0) {
    toPath(register_path[0].path, null, false);
  } else if (hash) {
    const [path, queryStr] = hash.split('?');
    let query = {};
    if (queryStr) {
      query = Object.fromEntries(new URLSearchParams(queryStr));
    }
    toPath(path, query, false);
  }
});

export { registerPath, toPath, registerNavBar, getPathData };
