// ================== learn Panel Component (ESM) ==================

let panelElement = null;

function createLearnPanel(
  container,
  apps = [
    {
      href: "/word-cards",
      icon: "🎴",
      title: "Word Cards",
      description: "Review your vocabulary",
    }
  ]
) {
  if (!container) return;

  // 如果之前已經創建過，清空內容
  if (panelElement) {
    panelElement.innerHTML = '';
  } else {
    panelElement = document.createElement('div');
    panelElement.className = 'learn-panel';
    container.appendChild(panelElement);
  }

  // 遍歷 apps 列表生成卡片
  apps.forEach(app => {
    const card = document.createElement('a');
    card.className = 'learn-card';
    card.href = app.href;

    const icon = document.createElement('span');
    icon.className = 'learn-icon';
    icon.textContent = app.icon;

    const title = document.createElement('h3');
    title.className = 'learn-title';
    title.textContent = app.title;

    const desc = document.createElement('p');
    desc.className = 'learn-desc';
    desc.textContent = app.description;

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(desc);

    panelElement.appendChild(card);
  });

  return panelElement;
}

export { createLearnPanel };