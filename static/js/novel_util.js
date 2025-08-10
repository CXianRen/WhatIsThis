// 语言配置
const LANGUAGES = {
  'zh': { flag: '🇨🇳', name: '中文', extension: '.txt' },
  'en': { flag: '🇺🇸', name: '英文', extension: '.en.json' },
  'se': { flag: '🇸🇪', name: '瑞典语', extension: '.se.json' },
  'fr': { flag: '🇫🇷', name: '法语', extension: '.fr.json' }
};

// 检查章节的语言支持
function getChapterLanguageSupport(chapter) {
  const support = {};

  // 中文默认支持（原始 .txt 文件）
  support.zh = true;

  // 检查其他语言支持
  if (chapter.available_languages) {
    chapter.available_languages.forEach(lang => {
      if (LANGUAGES[lang]) {
        support[lang] = true;
      }
    });
  }

  return support;
}

// 渲染语言标识
function renderLanguageFlags(chapter) {
  const support = getChapterLanguageSupport(chapter);

  return Object.keys(LANGUAGES).map(lang => {
    const langConfig = LANGUAGES[lang];
    const isAvailable = support[lang] || false;
    return `<span class="flag ${isAvailable ? 'available' : ''}" 
                      title="${langConfig.name}${isAvailable ? ' (已支持)' : ' (未支持)'}"
                      data-lang="${lang}" data-chapter-id="${chapter.cid}">
                  ${langConfig.flag}
                </span>`;
  }).join('');
}