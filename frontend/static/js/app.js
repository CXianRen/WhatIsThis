import YouGlishPlayer from "./youglish.js";

const HISTORY_KEY = "aidict.youglish.history.v1";
const LANGUAGE_KEY = "aidict.youglish.language.v1";
const HISTORY_LIMIT = 12;

const languageLabels = {
  english: "English",
  swedish: "Swedish",
  french: "French",
  chinese: "Chinese",
};

const form = document.querySelector("#search-form");
const queryInput = document.querySelector("#query");
const languageSelect = document.querySelector("#language");
const historyPanel = document.querySelector("#history-panel");
const historyList = document.querySelector("#history-list");
const emptyHistory = document.querySelector("#empty-history");
const clearHistoryButton = document.querySelector("#clear-history");
const resultTitle = document.querySelector("#result-title");
const resultLanguage = document.querySelector("#result-language");
const status = document.querySelector("#status");
const widgetContainer = document.querySelector("#youglish-widget");

let history = loadHistory();

const player = new YouGlishPlayer({
  container: widgetContainer,
  onStatus: setStatus,
});

restoreLanguage();
renderHistory();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(queryInput.value, languageSelect.value);
});

queryInput.addEventListener("focus", showHistory);
queryInput.addEventListener("click", showHistory);
queryInput.addEventListener("input", renderHistory);

languageSelect.addEventListener("change", () => {
  writeStorage(LANGUAGE_KEY, languageSelect.value);
  resultLanguage.textContent = languageLabels[languageSelect.value];
});

clearHistoryButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  queryInput.focus();
});

document.addEventListener("pointerdown", (event) => {
  if (!form.contains(event.target)) hideHistory();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideHistory();
    queryInput.blur();
  }
});

function search(rawQuery, language) {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (!query) {
    queryInput.focus();
    return;
  }

  queryInput.value = query;
  resultTitle.textContent = query;
  resultLanguage.textContent = languageLabels[language];
  widgetContainer.hidden = false;
  addHistory(query, language);
  hideHistory();
  queryInput.blur();
  player.search(query, language);
  document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function addHistory(query, language) {
  const normalizedQuery = query.toLocaleLowerCase();
  history = history.filter(
    (item) => !(item.query.toLocaleLowerCase() === normalizedQuery && item.language === language),
  );
  history.unshift({ query, language });
  history = history.slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function loadHistory() {
  try {
    const stored = JSON.parse(readStorage(HISTORY_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored
      .filter(
        (item) =>
          typeof item?.query === "string" &&
          Object.hasOwn(languageLabels, item?.language),
      )
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveHistory() {
  writeStorage(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const filter = queryInput.value.trim().toLocaleLowerCase();
  const visibleHistory = filter
    ? history.filter((item) => item.query.toLocaleLowerCase().includes(filter))
    : history;

  historyList.replaceChildren();

  for (const item of visibleHistory) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";

    const query = document.createElement("span");
    query.className = "history-query";
    query.textContent = item.query;

    const language = document.createElement("span");
    language.className = "history-language";
    language.textContent = languageLabels[item.language];

    button.append(query, language);
    button.addEventListener("click", () => {
      languageSelect.value = item.language;
      writeStorage(LANGUAGE_KEY, item.language);
      search(item.query, item.language);
    });

    const listItem = document.createElement("li");
    listItem.appendChild(button);
    historyList.appendChild(listItem);
  }

  emptyHistory.hidden = visibleHistory.length > 0;
  clearHistoryButton.hidden = history.length === 0;
}

function showHistory() {
  renderHistory();
  historyPanel.hidden = false;
  queryInput.setAttribute("aria-expanded", "true");
}

function hideHistory() {
  historyPanel.hidden = true;
  queryInput.setAttribute("aria-expanded", "false");
}

function restoreLanguage() {
  const storedLanguage = readStorage(LANGUAGE_KEY);
  if (Object.hasOwn(languageLabels, storedLanguage)) {
    languageSelect.value = storedLanguage;
  }
  resultLanguage.textContent = languageLabels[languageSelect.value];
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // History remains available in memory when browser storage is blocked.
  }
}
