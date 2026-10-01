const Auth = {
  token: () => localStorage.getItem('thandal_token'),
  user: () => JSON.parse(localStorage.getItem('thandal_user') || 'null'),
  save(token, user) { localStorage.setItem('thandal_token', token); localStorage.setItem('thandal_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('thandal_token'); localStorage.removeItem('thandal_user'); },
  guard(root) { if (!Auth.token()) location.replace(root + 'pages/auth/login.html'); }
};
