// ================== Info Panel Class (ESM) ==================
import { toPath } from './router/router.js';
import { getUserInfo } from './user/login.js';


export default class InfoPanel {
  constructor(container, data = {}) {
    if (!container) throw new Error('Container is required');
    this.container = container;
    this.panelElement = null;
    this.isMounted = false;

    this.eventListeners = []; // ✅ 用来保存事件记录 {element, type, handler}

    this.data = {
      daysLearned: 0,
      wordsAdded: 0,
      learnedDays: [],
      ...data
    };
  }

  // ---------------- 生命周期 ----------------
  async mount() {
    if (this.isMounted){
      console.warn('InfoPanel is already mounted');
      return this.panelElement;
    } 

    this.panelElement = document.createElement('div');
    this.panelElement.className = 'info-panel';
    this.container.appendChild(this.panelElement);
    this.isMounted = true;
    await this.render();
    this.onMount();   // ✅ 挂载回调
    return this.panelElement;
  }

  unmount() {
    if (!this.isMounted) return;

    // ✅ 清理事件
    this.removeAllEvents();

    if (this.panelElement && this.container.contains(this.panelElement)) {
      this.container.removeChild(this.panelElement);
    }

    this.onUnmount(); // ✅ 卸载回调
    this.panelElement = null;
    this.isMounted = false;
  }

  onMount() {
    console.log('InfoPanel mounted');
  }

  onUnmount() {
    console.log('InfoPanel unmounted');
  }

  // ---------------- 事件管理 ----------------
  addEvent(element, type, handler) {
    element.addEventListener(type, handler);
    this.eventListeners.push({ element, type, handler });
  }

  removeAllEvents() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  // ---------------- 渲染逻辑 ----------------
  async render(newData = {}) {
    if (!this.isMounted) return;

    console.log('Rendering InfoPanel with data:', { ...this.data, ...newData });
    this.data = { ...this.data, ...newData };

    const { daysLearned, wordsAdded, learnedDays } = this.data;

    this.panelElement.innerHTML = ''; // 清空再渲染
    this.removeAllEvents(); // ✅ 防止重复绑定

    // Days
    const daysDiv = document.createElement('div');
    daysDiv.className = 'info-section info-days';
    daysDiv.innerHTML = `
      <div class="info-tag">You have been learning for:</div>
      <div class="info-value">${daysLearned} days</div>
    `;
    this.panelElement.appendChild(daysDiv);

    // Words
    const wordsDiv = document.createElement('div');
    wordsDiv.className = 'info-section info-words';
    wordsDiv.innerHTML = `
      <div class="info-tag">You have added words:</div>
      <div class="info-value">${wordsAdded}</div>
    `;
    this.panelElement.appendChild(wordsDiv);

    // Calendar
    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'info-section info-calendar';
    calendarDiv.innerHTML = `
      <div class="info-tag">Learning calendar</div>
      <div class="info-value calendar">
        ${this.generateCalendarHTML(new Date().getFullYear(), new Date().getMonth() + 1, learnedDays)}
      </div>
    `;
    this.panelElement.appendChild(calendarDiv);

    // User info
    const userinfo = getUserInfo();

    const userDiv = document.createElement('div');
    userDiv.className = 'info-section info-user';
    userDiv.innerHTML = `
      <div class="user-info">
        <img class="avatar" src="/static/imgs/default-avatar.png" alt="avatar">
        <span class="username">${userinfo.username || 'Guest'}</span>
      </div>
      <div class="settings-icon">⚙️</div>
    `;
    this.panelElement.appendChild(userDiv);

    // ✅ 用 addEvent 来注册事件，而不是直接 onclick
    this.addEvent(userDiv.querySelector('.settings-icon'), 'click', () => {
      console.log('Open settings panel');
      toPath('setting');
    });
  }

  generateCalendarHTML(year, month, learnedDays = []) {
    const date = new Date(year, month - 1, 1);
    const firstDay = date.getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
    const currentDay = isCurrentMonth ? today.getDate() : -1;

    let html = `
      <div class="calendar-container">
        <table class="learning-calendar">
          <thead>
            <tr>
              <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th>
              <th>Thu</th><th>Fri</th><th>Sat</th>
            </tr>
          </thead>
          <tbody>
    `;

    let dayCounter = 1 - firstDay;

    while (dayCounter <= lastDate) {
      html += '<tr>';
      for (let i = 0; i < 7; i++) {
        if (dayCounter < 1 || dayCounter > lastDate) {
          html += '<td class="calendar-day empty"></td>';
        } else {
          let classes = 'calendar-day';
          if (dayCounter === currentDay) classes += ' today';
          if (learnedDays.includes(dayCounter)) classes += ' learned';
          else if (dayCounter <= currentDay || !isCurrentMonth) classes += ' not-learned';
          else classes += ' future';

          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${dayCounter.toString().padStart(2, '0')}`;
          html += `<td class="${classes}" title="${dateStr}">${dayCounter}</td>`;
        }
        dayCounter++;
      }
      html += '</tr>';
    }

    html += `
          </tbody>
        </table>
        <div class="calendar-legend">
          <span class="legend-text">Less</span>
          <div class="legend-colors">
            <div class="legend-item not-learned"></div>
            <div class="legend-item learned"></div>
          </div>
          <span class="legend-text">More</span>
        </div>
      </div>
    `;

    return html;
  }
}
