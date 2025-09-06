import { getToken } from './api_user.js';

// defined tag object
// {
//   "id": tag_id,
//    "name": name,
//    "lang": lang,
//    "created_at": now,
//    "updated_at": now
// }


export async function getTagList(lang, callback) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const response = await fetch(`/api/vocb/tags/${lang}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

  const data = await response.json();
  if (response.status !== 200) {
    console.error('Failed to fetch tags:', data.error || 'Unknown error');
    throw new Error(data.error || 'Failed to fetch tags');
    return [];
  }
  // console.log('Raw tag data:', data.data);
  const tags = data.data || [];
  console.log('Fetched tags:', tags);

  if (typeof callback === 'function') callback(tags);
  return tags;
}

export async function addTag(tag, lang, callback) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');

  const response = await fetch('/api/vocb/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      'tag': tag,
      'lang': lang
    })
  });

  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.error || 'Failed to add tag');
  }

  return data.data || null;
}

export async function deleteTag(word, tag) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');
  const response = await fetch('/api/vocb/tags', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      'word': word,
      'tag': tag
    })
  });
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.error || 'Failed to delete tag from word');
  }
  return data;
}

export async function getWordTags(word, lang) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');
  const response = await fetch('/api/vocb/word/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    , body: JSON.stringify({ word, lang })
  });
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.error || 'Failed to fetch word tags');
  }
  const tags = data.data || [];
  return tags;
}

export async function addTagToWord(word, tag) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');
  const response = await fetch(`/api/vocb/word/tags/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      'word': word,
      'tag': tag
    })
  });

  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.error || 'Failed to add tag to word');
  }
  console.log('Add tag to word response:', data);
  return data.data || null;
}

export async function removeTagFromWord(word, tag) {
  const token = getToken();
  if (!token) throw new Error('User not logged in');
  const response = await fetch('/api/vocb/word/tags/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      'word': word,
      'tag': tag
    })
  });
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.error || 'Failed to remove tag from word');
  }
  return data;
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