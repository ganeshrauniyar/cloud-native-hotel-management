/* ═══════════════════════════════════════════════════════════════
   AUTH CLIENT — token storage, current user, logout, header render
   ═══════════════════════════════════════════════════════════════ */
const Auth = (() => {
  function token() { return localStorage.getItem('hms_token') || ''; }
  function user() {
    try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; }
  }
  function isLoggedIn() { return !!token(); }

  function save(tok, usr) {
    localStorage.setItem('hms_token', tok);
    localStorage.setItem('hms_user', JSON.stringify(usr));
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    save(data.token, data.user);
    return data.user;
  }

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    window.location.href = 'login.html';
  }

  // Verify token is still valid with the server; returns user or null
  async function verify() {
    if (!token()) return null;
    try {
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token()}` } });
      if (!res.ok) return null;
      const data = await res.json();
      save(token(), data.user);
      return data.user;
    } catch { return null; }
  }

  function initials(name) {
    return (name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // Fill the top-header user block on the dashboard
  function renderUser() {
    const u = user();
    if (!u) return;
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avEl = document.getElementById('user-avatar');
    const adminBtn = document.getElementById('btn-admin');
    if (nameEl) nameEl.textContent = u.name;
    if (roleEl) roleEl.textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    if (avEl) avEl.textContent = initials(u.name);
    if (adminBtn && u.role === 'admin') adminBtn.style.display = '';
  }

  return { token, user, isLoggedIn, login, logout, verify, renderUser, initials };
})();
