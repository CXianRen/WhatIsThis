// navigationBar.js 
export default class NavigationBar {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.pageList = options.pageList || [];
    this.nav = null;
    this.init();
  }

  // ==============  ==================
  init() {
    if (!this.container) return;

    this.nav = document.createElement('nav');
    this.nav.className = 'navbar is-primary';

    const start = document.createElement('div');
    start.className = 'navbar-start';

    this.pageList.forEach(page => {
      const a = document.createElement('a');
      a.className = 'navbar-item';
      a.innerHTML = page.icon_url ? `<img src="${page.icon_url}" alt="${page.name}" style="width:24px; height:24px;">` : (page.icon || page.name || 'Link');
      a.title = page.url || '';
      a.style.padding = '0.5rem';

      if (typeof page.cb === 'function') {
        a.addEventListener('click', page.cb);
      }

      start.appendChild(a);
    });

    this.nav.appendChild(start);
    this.container.appendChild(this.nav);
    // this.hide(); // initially hide
  }

  show() {
    if (this.nav) this.nav.style.display = '';
  }

  hide() {
    if (this.nav) this.nav.style.display = 'none';
  }

}
