// ================== Icon-only Navigation Bar Component (ESM) ==================

function createNavigationBar(
  container = document.body,
  page_list = [
    // { cb: , icon: '🏠' },
    // { cb: , icon: '📚' },
    // { cb: , icon: '🎓' }
  ]
) {
  if (!container) return;

  const nav = document.createElement('nav');
  nav.className = 'navbar is-primary';

  const start = document.createElement('div');
  start.className = 'navbar-start';

  page_list.forEach(page => {
    const a = document.createElement('a');
    a.className = 'navbar-item';
    a.innerHTML = page.icon; 
    a.title = page.url; 
    a.style.padding = '0.5rem';
    start.appendChild(a);
    a.addEventListener('click', () => {
      if (typeof page.cb === 'function') {
        page.cb();
      }
    });
  });

  nav.appendChild(start);
  container.appendChild(nav);

  return nav;
}

export { createNavigationBar };