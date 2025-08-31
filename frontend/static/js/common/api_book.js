
import { getToken } from './api_user.js';

// 获取所有书籍
export async function fetchAllBooks() {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error('Network error');

  const data = await res.json();

  // 转换为前端使用的数据结构
  return data.map(book => ({
    id: book.book_id,
    title: book.book_name,
    subtitle: book.subtitle || '',
    description: book.description || '',
    cover: '/static/imgs/book-placeholder.svg',
    languages: book.support_language || [],
    chapters: book.total_chapters || 0,
    totalWords: 0,
    progress: 0,
    featured: false,
    new: false,
    lastRead: null
  }));
}

export async function fetchUserBooks() {
  const token = getToken();
  if (!token) {
    throw new Error('No token found. User might not be logged in.');
  }

  const res = await fetch('/api/book/list/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Network error');
  }

  const data = await res.json();

  // convert to Book type
  return data.map(book => ({
    id: book.book_id,
    title: book.book_name,
    subtitle: book.subtitle || '',
    description: book.description || '',
    cover: '/static/imgs/book-placeholder.svg',
    languages: book.support_language || [],
    chapters: book.total_chapters || 0,
    totalWords: 0,
    progress: 0,
    featured: false,
    new: false,
    lastRead: null
  }));
}

// 获取用户书籍列表
export async function fetchUserCreatedBooks() {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/manage/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error('Network error');

  const data = await res.json();

  // 转换为前端数据结构
  return data.map(book => ({
    id: book.book_id,
    title: book.book_name,
    subtitle: book.subtitle || '',
    description: book.description || '',
    languages: book.support_language || [],
    cover: '/static/imgs/book-placeholder.svg',
    chapters: book.total_chapters || 0
  }));
}


export async function removeBookFromShelf(bookId) {
  const token = getToken();
  if (!token) {
    throw new Error('No token found. User might not be logged in.');
  }

  const res = await fetch('/api/book/list/user/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action: 'remove', book_id: bookId })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Network error');
  }

  return data;
}


export async function createBook(payload) {
  const token = getToken();
  if (!token) {
    throw new Error('User not logged in.');
  }

  const res = await fetch('/api/book/manage/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to add book');
  }

  return data;
}

// 删除书籍
export async function deleteBook(bookId) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/manage/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ book_id: bookId })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Error deleting book');
  }

  return data;
}


// 添加书籍到用户书架
export async function addBookToShelf(bookId) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/list/user/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ book_id: bookId, action: 'add' })
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Network error');
  }

  return data;
}


// 新增或更新章节 API
export async function saveChapterAPI({ bookId, title, content, chapterId = null }) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const url = chapterId
    ? '/api/book/manage/chapter/update'
    : '/api/book/manage/chapter/add';

  const payload = { book_id: bookId, title, content };
  if (chapterId) payload.chapter_id = chapterId;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'Error saving chapter');
  }

  return data;
}


// 获取书籍章节
export async function fetchChapters({ bookId, lang, level }) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/chapters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ book_id: bookId, lang, level })
  });

  if (!res.ok) {
    throw new Error(res.statusText || 'Error fetching chapters');
  }

  return res.json();
}

// 删除章节
export async function deleteChapter({ bookId, chapterId }) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/manage/chapter/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ book_id: bookId, chapter_id: chapterId })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    throw new Error(data?.error || 'Error deleting chapter');
  }

  return data;
}

// 获取单章节内容
export async function fetchChapterContent({ bookId, chapterId, lang, level }) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/book/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ book_id: bookId, chapter_id: chapterId, lang, level })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
