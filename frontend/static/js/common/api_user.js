export function signup(username, email, password) {
  return fetch('/api/user/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, useremail: email, userpassword: password })
  })
    .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error); }))
}

export function login(username, password) {
  return fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, userpassword: password })
  })
    .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error); }))
    .then(data => {
      localStorage.setItem('token', data.token);
      return data;
    });
}

export function loginAsGuest() {
  return fetch('/api/user/guest_login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error); }))
    .then(data => {
      localStorage.setItem('token', data.token);
      return data;
    });
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export function getUserInfo() {
  // return local information from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.reject(new Error('User not logged in'));
  }
  // Decode the token to get user info (assuming JWT)
  const payload = JSON.parse(atob(token.split('.')[1]));
  return Promise.resolve({
    username: payload.username,
    email: payload.useremail
  });
}

export function getToken() {
  return localStorage.getItem('token');
}
