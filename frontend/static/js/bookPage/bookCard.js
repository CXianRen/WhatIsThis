// ========== Book Card Component (ESM) ==========

function create(book) {
  const card = document.createElement("div");
  card.className = "book-card";
  card.tabIndex = 0; 
  card.role = "button";
  card.ariaLabel = `OpenBook: ${book.title}`;

  card.innerHTML = `
    ${createCoverHtml(book)}
    <div class="book-content">
      ${createContentHtml(book)}
      ${createMetaHtml(book)}
    </div>
  `;

  return card;
}

// -------- HTML Creation Functions --------
function createCoverHtml(book) {
  const imgSrc = book.cover?.trim() || "/static/imgs/book-placeholder.svg";
  return `
    <div class="book-cover">
      <img src="${imgSrc}" alt="${book.title}" class="book-cover-img" loading="lazy"
           onerror="this.src='/static/imgs/book-placeholder.svg'">
      <div class="book-tags">
        ${createLanguageTags(book.languages)}
        ${createLevelTag(book.level)}
      </div>
      ${createProgressBar(book.progress)}
    </div>
  `;
}

function createLanguageTags(langs = []) {
  return langs.map(l => `<span class="language-tag">${l.toUpperCase()}</span>`).join("");
}

function createLevelTag(level) {
  return level ? `<span class="level-tag ${level.toLowerCase()}">${level}</span>` : "";
}

function createProgressBar(progress) {
  return progress ? `
    <div class="book-progress">
      <div class="book-progress-bar" style="width:${progress}%"></div>
    </div>` : "";
}

function createContentHtml(book) {
  const title = escapeHtml(book.title || "未知標題");
  const desc = truncateText(escapeHtml(book.description || "暫無描述"), 100);
  return `<h3 class="book-title">${title}</h3><p class="book-description">${desc}</p>`;
}

function createMetaHtml(book) {
  const chapters = book.chapters || 0;
  const time = estimateReadingTime(book.wordCount || 0);
  return `
    <div class="book-meta">
      <div class="book-stats">
        <span class="chapter-count">${chapters} 章節</span>
        ${time ? `<span class="reading-time">約 ${time}</span>` : ""}
      </div>
      <div class="book-level"><span class="reading-level">${book.level || "N/A"}</span></div>
    </div>
  `;
}

// -------- Utils --------
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function truncateText(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.8 ? cut.slice(0, lastSpace) : cut) + "...";
}
function estimateReadingTime(words) {
  if (!words) return "";
  const mins = Math.ceil(words / 200);
  return mins < 60 ? `${mins} 分鐘` : `${Math.floor(mins/60)}小時${mins%60}分鐘`;
}

// -------- Loading Placeholder --------
function createLoadingCard() {
  const card = document.createElement("div");
  card.className = "book-card loading";
  card.innerHTML = `
    <div class="book-cover"><div class="book-cover-placeholder"><div class="loading-spinner"></div></div></div>
    <div class="book-content">
      <div class="book-title loading-text"></div>
      <div class="book-description loading-text"></div>
      <div class="book-meta"><div class="loading-text small"></div><div class="loading-text small"></div></div>
    </div>
  `;
  return card;
}

// -------- Export API --------
export default { create, createLoadingCard };
