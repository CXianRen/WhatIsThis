// ================== Info Panel Component (ESM) ==================

let panelElement = null;

function createInfoPanel(container, data = {}) {
  if (!container) return;

  const { daysLearned = 0,
    wordsAdded = 0,
    learnedDays = [], // Fixed typo: was daysLearneListd
    user = {}
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
  const userDiv = document.createElement('div');
  userDiv.className = 'info-section info-user';
  userDiv.innerHTML = `
    <div class="user-info">
      <img class="avatar" src="${user.avatarUrl || 'https://via.placeholder.com/40'}" alt="avatar">
      <span class="username">${user.name || 'User'}</span>
    </div>
    <div class="settings-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l0 0a2 2 0 1 1-2.83 2.83l0 0a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v0a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l0 0a2 2 0 1 1-2.83-2.83l0 0a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h0a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l0 0a2 2 0 1 1 2.83-2.83l0 0a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v0a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l0 0a2 2 0 1 1 2.83 2.83l0 0a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h0a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </div>
  `;
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