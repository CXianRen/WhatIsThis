// ================== Info Panel Component (ESM) ==================
import { toPath } from './router/router.js';
import { getUserInfo } from './user/login.js';
let panelElement = null;

async function createInfoPanel(container, data = {}) {
  if (!container) return;

  let { daysLearned = 0,
    wordsAdded = 0,
    learnedDays = [], // Fixed typo: was daysLearneListd
  } = data;

  if (panelElement) {
    panelElement.innerHTML = '';
  } else {
    panelElement = document.createElement('div');
    panelElement.className = 'info-panel';
    container.appendChild(panelElement);
  }

  // Learning days
  const daysDiv = document.createElement('div');
  daysDiv.className = 'info-section info-days';
  daysDiv.innerHTML = `
    <div class="info-tag">You have been learning for:</div>
    <div class="info-value">${daysLearned} days</div>
  `;
  panelElement.appendChild(daysDiv);

  // Words added
  const wordsDiv = document.createElement('div');
  wordsDiv.className = 'info-section info-words';
  wordsDiv.innerHTML = `
    <div class="info-tag">You have added words:</div>
    <div class="info-value">${wordsAdded}</div>
  `;
  panelElement.appendChild(wordsDiv);

  // Learning calendar
  const calendarDiv = document.createElement('div');
  calendarDiv.className = 'info-section info-calendar';
  calendarDiv.innerHTML = `
    <div class="info-tag">Learning calendar</div>
    <div class="info-value calendar">
    ${generateCalendarHTML(new Date().getFullYear(), new Date().getMonth() + 1, learnedDays)
    }</div>
  `;
  panelElement.appendChild(calendarDiv);

  // Info and settings
  let userinfo = null;

  try {
    userinfo = await getUserInfo();
  } catch (e) {
    userinfo = { username: 'Guest' };
  }

  console.log('User Info:', userinfo);
  
  const userDiv = document.createElement('div');
  userDiv.className = 'info-section info-user';
  userDiv.innerHTML = `
    <div class="user-info">
      <img class="avatar" src="${'/static/imgs/default-avatar.png'}" alt="avatar">
      <span class="username">${userinfo.username || 'Guest'}</span>
    </div>
    <div class="settings-icon">
      ⚙️
    </div>
  `;
  userDiv.querySelector('.settings-icon').onclick = () => {
    // Open settings panel logic here
    console.log('Open settings panel');
    toPath('setting');
  }; 
  
  panelElement.appendChild(userDiv);

  return panelElement;
}

function generateCalendarHTML(year, month, learnedDays = []) {
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
        <tbody>`;

  let dayCounter = 1 - firstDay;

  while (dayCounter <= lastDate) {
    html += '<tr>';
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > lastDate) {
        html += '<td class="calendar-day empty"></td>';
      } else {
        let classes = 'calendar-day';
        
        if (dayCounter === currentDay) {
          classes += ' today';
        }
        
        if (learnedDays.includes(dayCounter)) {
          classes += ' learned';
        } else if (dayCounter <= currentDay || !isCurrentMonth) {
          classes += ' not-learned';
        } else {
          classes += ' future';
        }
        
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
    </div>`;
  
  return html;
}


function render(newData = {}) {
  if (!panelElement) return;
  createInfoPanel(panelElement.parentElement, newData);
}

export { createInfoPanel, render };