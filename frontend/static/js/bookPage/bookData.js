// bookData.js
export default function createBook(data) {
  return {
    id: data.id,
    title: data.title || '未知標題',
    description: data.description || '',
    cover: data.cover || '/static/imgs/book-placeholder.svg',
    languages: data.languages || [],
    level: data.level || 'N/A',
    chapters: data.chapters || 0,
    totalWords: data.totalWords || 0,
    progress: data.progress || 0
  };
}

