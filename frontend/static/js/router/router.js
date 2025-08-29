let register_path = [];
let page_objs = {}; // path -> constructor

let navbar = null;
let currentPath = null;
let stateStore = {}; // for saving path data


import { isLoggedIn } from '../user/login.js';

let app_el = null;

function routerInit(container) {
  app_el = container;
}

function registerPath(path, contructor, config = {}) {
  if (register_path.some(p => p.path === path)) {
    console.warn(`Path ${path} is already registered.`);
    return;
  }
  register_path.push({ path, config });
  page_objs[path] = new contructor(app_el);
}


function toPath(path, data = null, pushHistory = true) {
  console.log(`Navigating to path: ${path} with data:`, data);


  // check if path is registered
  const page = register_path.find(p => p.path === path);
  if (!page) {
    console.error(`Path ${path} is not registered.`);
    alert(`Error: Page ${path} is not registered.`);
    return;
  }

  const pathConfig = page.config;

  // default requiresLogin to true
  if (!('requiresLogin' in pathConfig)) {
    pathConfig.requiresLogin = true;
  }
  if (pathConfig.requiresLogin && !isLoggedIn()) {
    toPath('login');
    return;
  }

  const el = document.querySelector(`.app`);

  // --- call previous page's unmount ---
  if (currentPath) {
    const prevPage = register_path.find(p => p.path === currentPath);
    if (prevPage) {
      // prevPage.config.onUnmount();
      if (page_objs[currentPath] && page_objs[currentPath].unmount) {
        page_objs[currentPath].unmount();
      }
    }
  }

  currentPath = path;

  // show/hide navbar
  if (data !== null) {
    stateStore[path] = data;
  }

  // update navbar  
  if (pushHistory) {
    let url = '#' + path;
    location.hash = url;
    console.log(`Updating URL hash to: #${path}`);
  }

  // --- call navbar to update ---
  if (navbar) {
    if (pathConfig.fullscreen) {
      const el = document.querySelector(`.app`);
      el.style.height = 'calc(100vh - var(--top-insert))';
      navbar.hide();
    } else {
      navbar.show();
      const el = document.querySelector(`.app`);
      const nvbar = document.querySelector(`nav`);
      el.style.height = 'calc(100vh - ' + nvbar.offsetHeight + 'px)';
    }
  }
  // pathConfig.onMount(stateStore[path] || null);
  if (page_objs[path] && page_objs[path].mount) {
    page_objs[path].mount(stateStore[path] || null);
  }
}

function toPrevPath() {
  window.history.back();
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
    toPath('home', null, false);
  } else if (hash) {
    const [path, queryStr] = hash.split('?');
    let query = null;
    if (queryStr) {
      query = Object.fromEntries(new URLSearchParams(queryStr));
    }
    toPath(path, query, false);
  }
});


export { routerInit, registerPath, toPath, registerNavBar, getPathData, toPrevPath };
