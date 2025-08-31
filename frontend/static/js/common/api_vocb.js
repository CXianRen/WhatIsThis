import { getToken } from './api_user.js';

export async function getTagList(callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  const tags = data.tags || [];
  if (typeof callback === 'function') callback(tags);
  return tags;
}

export async function addTag(tag, callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: tag })
  });
  const data = await response.json();
  if (typeof callback === 'function') callback(data.tag || null);
  return data.tag || null;
}

export async function deleteTag(tag, callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag })
  });
  const data = await response.json();
  if (typeof callback === 'function') callback(data.success);
  return data.success;
}

export async function getWordTags(word, callback) {
  const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  const tags = data.tags || [];
  if (typeof callback === 'function') callback(tags);
  return tags;
}

export async function addTagToWord(word, tags, callback) {
  const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag: tags })
  });
  const data = await response.json();
  if (typeof callback === 'function') callback(data.success);
  return data.success;
}

// 获取单词分析
export async function fetchWordAnalysis({ word, text, lang, nativeLang }) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const res = await fetch('/api/vocb/word/analyse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ word, text, lang, native_lang: nativeLang })
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
}

// 单词详情 API
export async function fetchWordDetail({ word, lang = 'en', nativeLang = 'zh' }) {
  const res = await fetch(`/api/vocb/word`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, lang, native_lang: nativeLang })
  });

  if (!res.ok) throw new Error('网络请求失败');

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return data;
}