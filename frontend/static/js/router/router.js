let register_path = []
let navbar = null;

function registerPath(path, config = {}) {
  if (register_path.includes(path)) {
    console.warn(`Path ${path} is already registered.`);
    return;
  }
  register_path.push({ path, config });
  console.log(`Path ${path} registered successfully.`);
}

function toPath(path) {

  console.log(`Navigating to path: ${path}`);
  register_path.forEach(panel => {
    const el = document.querySelector(`.${panel.path}`);
    if (el) {
      el.style.display = panel.path === path ? 'flex' : 'none';
      console.log(panel)
      if (panel.config.fullscreen === true) {
        navbar.style.display = 'none';
        console.log(`Hiding navbar for full-screen path: ${path}`);
      }
      else {
        navbar.style.display = 'block';
      }
    }
  });
}

function registerNavBar(bar) {
  navbar = bar;
}

export { registerPath, toPath, registerNavBar };