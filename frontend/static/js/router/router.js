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

  //  check if path is registered
  if (!register_path.some(p => p.path === path)) {
    console.error(`Path ${path} is not registered.`);
    alert(`Error: Page ${path} is not registered.`);
    return;
  }

  // check if path requires login
  const pathConfig = register_path.find(p => p.path === path).config;
  if (!('requiresLogin' in pathConfig)) {
    pathConfig.requiresLogin = true; // default to true
  }


  if (pathConfig.requiresLogin && !isLoggedIn()) {
    toPath('login');
    return;
  }

  currentPath = path;

  // if data is not null, saive it to stateStore
  if (data !== null) {
    stateStore[path] = data;
  }

  // update the URL hash
  if (pushHistory) {

    let url = '#' + path;
    // if (data && data.id !== undefined) {
    //   // if data has an id, append it to the URL
    //   // and encodeURIComponent to handle special characters
    //   url += `?id=${encodeURIComponent(data.id)}`;
    // }
    location.hash = url;
    console.log(`Updating URL hash to: #${path}`);
  }

  // switch display of registered paths
  register_path.forEach(page => {
    const el = document.querySelector(`.${page.path}`);
    if (el) {
      el.style.display = page.path === path ? 'flex' : 'none';
      if (page.path === path) {
        if (page.config.fullscreen === true) {
          navbar.style.display = 'none';
          console.log(`Hiding navbar for full-screen path: ${path}`);
        } else {
          navbar.style.display = 'block';
        }
      }
    }
  });
}

function registerNavBar(bar) {
  navbar = bar;
}

// getPathData(path) returns the data for the given path
function getPathData(path = currentPath) {
  return stateStore[path] || null;
}

// listen for hash changes to handle navigation
window.addEventListener('hashchange', () => {
  const hash = location.hash.slice(1);
  if (!hash) return;

  const [path, queryStr] = hash.split('?');
  let query = {};
  if (queryStr) {
    query = Object.fromEntries(new URLSearchParams(queryStr));
  }

  // if the path exists in stateStore, 
  // use that data; otherwise use query
  const data = stateStore[path] || query;

  if (path && path !== currentPath) {
    toPath(path, data, false);
  }
});

// initial load handling
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
