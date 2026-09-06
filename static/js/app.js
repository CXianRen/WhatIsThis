import YouGlishPlayer from "./youglish.js";
import { initWordbook } from "./wordbook.js";

const HISTORY_KEY = "aidict.youglish.history.v1";
const LANGUAGE_KEY = "aidict.youglish.language.v1";
const ACCENT_KEY = "aidict.youglish.accents.v1";
const THEME_KEY = "aidict.theme.v1";
const HISTORY_LIMIT = 12;

const languages = {
  english: {
    label: "English",
    flag: "./static/flags/gb.svg",
    accents: [
      { code: "", label: "All" },
      { code: "us", label: "US" },
      { code: "uk", label: "UK" },
      { code: "aus", label: "Australia" },
      { code: "ca", label: "Canada" },
      { code: "ie", label: "Ireland" },
      { code: "sco", label: "Scotland" },
      { code: "nz", label: "New Zealand" },
    ],
  },
  swedish: {
    label: "Swedish",
    flag: "./static/flags/se.svg",
    accents: [{ code: "", label: "All" }],
  },
  dutch: {
    label: "Dutch",
    flag: "./static/flags/nl.svg",
    accents: [
      { code: "", label: "All" },
      { code: "nl", label: "Netherlands" },
      { code: "be", label: "Belgium" },
    ],
  },
  french: {
    label: "French",
    flag: "./static/flags/fr.svg",
    accents: [
      { code: "", label: "All" },
      { code: "fr", label: "France" },
      { code: "qc", label: "Québec" },
      { code: "be", label: "Belgium" },
      { code: "ch", label: "Switzerland" },
    ],
  },
  chinese: {
    label: "Chinese",
    flag: "./static/flags/cn.svg",
    accents: [
      { code: "", label: "All" },
      { code: "cn", label: "Mainland" },
      { code: "tw", label: "Taiwan" },
      { code: "sg", label: "Singapore" },
      { code: "hk", label: "Hong Kong" },
      { code: "sh", label: "Shanghai" },
      { code: "mo", label: "Macau" },
      { code: "mn", label: "Mongolia" },
    ],
  },
};

const form = document.querySelector("#search-form");
const themeToggle = document.querySelector("#theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const queryInput = document.querySelector("#query");
const languageButton = document.querySelector("#language-button");
const languageFlag = document.querySelector("#language-flag");
const accentButton = document.querySelector("#accent-button");
const accentLabel = document.querySelector("#accent-label");
const localeControls = document.querySelector(".locale-controls");
const localePanel = document.querySelector("#locale-panel");
const localePanelTitle = document.querySelector("#locale-panel-title");
const localeOptions = document.querySelector("#locale-options");
const historyPanel = document.querySelector("#history-panel");
const historyList = document.querySelector("#history-list");
const emptyHistory = document.querySelector("#empty-history");
const clearHistoryButton = document.querySelector("#clear-history");
const resultTitle = document.querySelector("#result-title");
const status = document.querySelector("#status");
const widgetContainer = document.querySelector("#youglish-widget");

let history = loadHistory();
let accentPreferences = loadAccentPreferences();
let selectedLanguage = "english";
let activePicker = null;

const player = new YouGlishPlayer({
  container: widgetContainer,
  onStatus: setStatus,
});

const wordbook = initWordbook({
  languages,
  formatLanguage,
  onLookup: (entry) => {
    selectedLanguage = entry.language;
    accentPreferences[entry.language] = entry.accent;
    writeStorage(LANGUAGE_KEY, entry.language);
    saveAccentPreferences();
    renderLocaleControls();
    search(entry.query, entry.language, entry.accent);
  },
  onLeaveSearch: () => {
    player.close();
    widgetContainer.hidden = true;
    if (queryInput.value) setStatus("点击搜索，重新加载例句。");
    hideHistory();
    closeLocalePicker();
  },
});

restoreLanguage();
renderLocaleControls();
renderHistory();
updateThemeControls();

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  writeStorage(THEME_KEY, nextTheme);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(queryInput.value, selectedLanguage, getSelectedAccent());
});

queryInput.addEventListener("focus", showHistory);
queryInput.addEventListener("click", showHistory);
queryInput.addEventListener("input", renderHistory);

for (const [kind, button] of [["language", languageButton], ["accent", accentButton]]) {
  button.addEventListener("click", () => {
    if (activePicker === kind) closeLocalePicker();
    else openLocalePicker(kind);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openLocalePicker(kind);
    }
  });
}

localeOptions.addEventListener("keydown", (event) => {
  const buttons = [...localeOptions.querySelectorAll("button")];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  let nextIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = buttons.length - 1;
  else if (["ArrowDown", "ArrowRight"].includes(event.key)) nextIndex = (index + 1) % buttons.length;
  else if (["ArrowUp", "ArrowLeft"].includes(event.key)) nextIndex = (index - 1 + buttons.length) % buttons.length;
  else return;
  event.preventDefault();
  buttons[nextIndex].focus();
});

clearHistoryButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  queryInput.focus();
});

document.addEventListener("pointerdown", (event) => {
  if (!form.contains(event.target)) hideHistory();
  if (!localeControls.contains(event.target) && !localePanel.contains(event.target)) closeLocalePicker();
});

document.addEventListener("focusin", (event) => {
  if (!localeControls.contains(event.target) && !localePanel.contains(event.target)) closeLocalePicker();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activePicker) {
      closeLocalePicker(true);
      return;
    }
    hideHistory();
    queryInput.blur();
  }
});

function search(rawQuery, language, accent = "") {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (!query) {
    queryInput.focus();
    return;
  }

  const safeAccent = isValidAccent(language, accent) ? accent : "";
  queryInput.value = query;
  resultTitle.textContent = query;
  wordbook.setCurrent({ query, language, accent: safeAccent });
  widgetContainer.hidden = false;
  addHistory(query, language, safeAccent);
  hideHistory();
  queryInput.blur();
  if (navigator.onLine === false) {
    player.close();
    widgetContainer.hidden = true;
    setStatus("当前离线，可收藏这个词；联网后再搜索例句。", true);
  } else {
    player.search(query, language, safeAccent);
  }
  document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderLocaleControls() {
  const languageConfig = languages[selectedLanguage];
  const accent = getSelectedAccent();
  const selectedOption = languageConfig.accents.find((option) => option.code === accent);
  if (languageFlag.getAttribute("src") !== languageConfig.flag) {
    languageFlag.src = languageConfig.flag;
  }
  languageButton.setAttribute("aria-label", `Language: ${languageConfig.label}`);
  languageButton.title = languageConfig.label;
  accentLabel.textContent = accent ? (accent === "aus" ? "AU" : accent.toUpperCase()) : "All";
  accentButton.setAttribute("aria-label", `${languageConfig.label} accent: ${selectedOption.label}`);
  accentButton.title = `Accent: ${selectedOption.label}`;
  accentButton.hidden = languageConfig.accents.length === 1;
}

function openLocalePicker(kind) {
  if (kind === "accent" && accentButton.hidden) return;
  activePicker = kind;
  hideHistory();
  const isLanguage = kind === "language";
  const options = isLanguage
    ? Object.entries(languages).map(([value, config]) => ({ value, label: config.label, flag: config.flag }))
    : languages[selectedLanguage].accents.map(({ code, label }) => ({ value: code, label }));
  const selectedValue = isLanguage ? selectedLanguage : getSelectedAccent();
  localePanelTitle.textContent = isLanguage ? "Language" : `${languages[selectedLanguage].label} accent`;
  localeOptions.classList.toggle("is-accent", !isLanguage);
  localeOptions.replaceChildren();

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "locale-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", String(option.value === selectedValue));
    button.tabIndex = -1;
    if (option.flag) {
      const flag = document.createElement("img");
      flag.className = "language-flag";
      flag.src = option.flag;
      flag.alt = "";
      button.appendChild(flag);
    }
    const label = document.createElement("span");
    label.textContent = option.label;
    button.appendChild(label);
    button.addEventListener("click", () => {
      if (isLanguage) {
        selectedLanguage = option.value;
        writeStorage(LANGUAGE_KEY, selectedLanguage);
      } else {
        accentPreferences[selectedLanguage] = option.value;
        saveAccentPreferences();
      }
      closeLocalePicker(true);
      renderLocaleControls();
    });
    localeOptions.appendChild(button);
  }

  languageButton.setAttribute("aria-expanded", String(isLanguage));
  accentButton.setAttribute("aria-expanded", String(!isLanguage));
  localePanel.hidden = false;
  localeOptions.querySelector('[aria-checked="true"]').focus({ preventScroll: true });
}

function closeLocalePicker(restoreFocus = false) {
  if (!activePicker) return;
  const trigger = activePicker === "language" ? languageButton : accentButton;
  activePicker = null;
  localePanel.hidden = true;
  languageButton.setAttribute("aria-expanded", "false");
  accentButton.setAttribute("aria-expanded", "false");
  if (restoreFocus) trigger.focus({ preventScroll: true });
}

function getSelectedAccent(language = selectedLanguage) {
  const accent = accentPreferences[language] || "";
  return isValidAccent(language, accent) ? accent : "";
}

function loadAccentPreferences() {
  try {
    const stored = JSON.parse(readStorage(ACCENT_KEY) || "{}");
    const preferences = {};
    for (const language of Object.keys(languages)) {
      const storedAccent = stored?.[language];
      preferences[language] = isValidAccent(language, storedAccent)
        ? storedAccent
        : "";
    }
    return preferences;
  } catch {
    return Object.fromEntries(Object.keys(languages).map((language) => [language, ""]));
  }
}

function saveAccentPreferences() {
  writeStorage(ACCENT_KEY, JSON.stringify(accentPreferences));
}

function addHistory(query, language, accent) {
  const normalizedQuery = query.toLocaleLowerCase();
  history = history.filter(
    (item) =>
      !(
        item.query.toLocaleLowerCase() === normalizedQuery &&
        item.language === language &&
        item.accent === accent
      ),
  );
  history.unshift({ query, language, accent });
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
          Object.hasOwn(languages, item?.language),
      )
      .map((item) => ({
        query: item.query,
        language: item.language,
        accent: isValidAccent(item.language, item.accent) ? item.accent : "",
      }))
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
    language.textContent = formatLanguage(item.language, item.accent);

    button.append(query, language);
    button.addEventListener("click", () => {
      selectedLanguage = item.language;
      accentPreferences[item.language] = item.accent;
      writeStorage(LANGUAGE_KEY, item.language);
      saveAccentPreferences();
      renderLocaleControls();
      search(item.query, item.language, item.accent);
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
  if (Object.hasOwn(languages, storedLanguage)) {
    selectedLanguage = storedLanguage;
  }
}

function isValidAccent(language, accent) {
  return (
    typeof accent === "string" &&
    (languages[language]?.accents.some((option) => option.code === accent) || false)
  );
}

function formatLanguage(language, accent) {
  const languageLabel = languages[language]?.label || language;
  const accentLabel = languages[language]?.accents.find((option) => option.code === accent)?.label;
  return accent ? `${languageLabel} · ${accentLabel}` : languageLabel;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateThemeControls();
}

function updateThemeControls() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.title = label;
  themeColorMeta.content = isDark ? "#101411" : "#f5f2eb";
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  if (isError && !widgetContainer.querySelector("iframe")) {
    widgetContainer.hidden = true;
  }
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
    // History and preferences remain available in memory when storage is blocked.
  }
}
