// 

// get the tag list of current user
async function getTagList(callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const tags = data.tags || [];
  if (typeof callback === 'function') {
    callback(tags);
  }
  return tags;
}

// add a new tag
async function addTag(tag, callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"tags": tag})
  });
  const data = await response.json();
  if (typeof callback === 'function') {
    callback(data.tag || null);
  }
  return data.tag || null;
}

// delete a tag
async function deleteTag(tag, callback) {
  const response = await fetch('/api/vocb/tags', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tag })
  });
  const data = await response.json();
  if (typeof callback === 'function') {
    callback(data.success);
  }
  return data.success;
}

// get tags of a specific word
async function getWordTags(word, callback) {
  const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const tags = data.tags || [];
  if (typeof callback === 'function') {
    callback(tags);
  }
  return tags;
}

// add a tag to a word
async function addTagToWord(word, tag, callback) {
  const response = await fetch(`/api/vocb/word/tags/${encodeURIComponent(word)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tag })
  });
  const data = await response.json();
  if (typeof callback === 'function') {
    callback(data.success);
  }
  return data.success;
}