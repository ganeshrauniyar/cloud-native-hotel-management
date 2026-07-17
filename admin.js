/* ═══════════════════════════════════════════════════════════════
   ADMIN PANEL — user management + system overview (admin only)
   ═══════════════════════════════════════════════════════════════ */
const AdminUI = (() => {
  const ROLES = ['admin', 'manager', 'staff'];
  let me = null;

  function token() { return Auth.token(); }
  async function api(method, path, body) {
    const res = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) { Auth.logout(); throw new Error('Unauthorized'); }
    const data = res.status === 204 ? {} : await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ── Toast (standalone copy so admin page doesn't depend on app.js) ──
  function toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';
    t.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); t.addEventListener('animationend', () => t.remove()); }, 4000);
  }

  // ── Modal helpers ──
  function openModal(title, body, footer) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer || '';
    document.getElementById('modal-overlay').classList.add('active');
  }
  function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

  // ── Boot ──
  async function init() {
    me = await Auth.verify();
    if (!me) { Auth.logout(); return; }
    if (me.role !== 'admin') {
      document.querySelector('.admin-shell').innerHTML =
        `<div class="glass-card" style="margin-top:60px;text-align:center;padding:40px;">
           <div style="font-size:48px;">🔒</div>
           <h2>Admins only</h2>
           <p class="text-muted">Your account (${me.role}) doesn't have access to this page.</p>
           <button class="btn btn-primary" onclick="window.location.href='index.html'">← Back to Dashboard</button>
         </div>`;
      return;
    }
    document.getElementById('admin-who').textContent = `Signed in as ${me.name} (${me.email})`;
    await Promise.all([loadStats(), loadUsers()]);
  }

  async function loadStats() {
    try {
      const s = await api('GET', '/stats/admin');
      document.getElementById('st-users').textContent = s.users;
      document.getElementById('st-rooms').textContent = s.rooms;
      document.getElementById('st-bookings').textContent = s.bookings;
      document.getElementById('st-staff').textContent = s.staff;
    } catch (e) { toast(e.message, 'error'); }
  }

  async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    try {
      const users = await api('GET', '/users');
      if (!users.length) { tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>No users</p></div></td></tr>`; return; }
      tbody.innerHTML = users.map(u => `
        <tr class="${u.active ? '' : 'inactive-row'}">
          <td><strong>${esc(u.name)}</strong>${u.id === me.id ? ' <span class="text-muted">(you)</span>' : ''}</td>
          <td>${esc(u.email)}</td>
          <td><span class="role-pill role-${u.role}">${u.role}</span></td>
          <td><span class="status-badge ${u.active ? 'available' : 'maintenance'}" style="font-size:.7rem;">${u.active ? 'Active' : 'Disabled'}</span></td>
          <td>
            <div class="table-actions">
              <button class="btn-icon" title="Edit" onclick="AdminUI.openEdit('${u.id}')">✏️</button>
              <button class="btn-icon" title="Reset password" onclick="AdminUI.resetPw('${u.id}','${esc(u.name)}')">🔑</button>
              ${u.id === me.id ? '' : `<button class="btn-icon" title="Delete" onclick="AdminUI.remove('${u.id}','${esc(u.name)}')">🗑️</button>`}
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>${esc(e.message)}</p></div></td></tr>`;
    }
  }

  function roleOptions(sel) {
    return ROLES.map(r => `<option value="${r}" ${r === sel ? 'selected' : ''}>${r[0].toUpperCase() + r.slice(1)}</option>`).join('');
  }

  // ── Create ──
  function openCreate() {
    openModal('Add User', `
      <div class="form-group"><label>Full Name</label><input class="form-control" id="f-name" placeholder="Jane Doe"></div>
      <div class="form-group"><label>Email</label><input type="email" class="form-control" id="f-email" placeholder="jane@grandhorizon.com"></div>
      <div class="form-row">
        <div class="form-group"><label>Password</label><input type="password" class="form-control" id="f-pass" placeholder="min 6 chars"></div>
        <div class="form-group"><label>Role</label><select class="form-control" id="f-role">${roleOptions('staff')}</select></div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="AdminUI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="AdminUI.saveCreate()">Create</button>
    `);
  }
  async function saveCreate() {
    try {
      const body = {
        name: val('f-name'), email: val('f-email'),
        password: val('f-pass'), role: val('f-role')
      };
      if (!body.name || !body.email || !body.password) return toast('Fill all fields', 'error');
      await api('POST', '/users', body);
      closeModal(); toast('User created'); loadUsers(); loadStats();
    } catch (e) { toast(e.message, 'error'); }
  }

  // ── Edit ──
  let editing = null;
  async function openEdit(id) {
    const users = await api('GET', '/users');
    const u = users.find(x => x.id === id);
    if (!u) return;
    editing = id;
    openModal('Edit User', `
      <div class="form-group"><label>Full Name</label><input class="form-control" id="f-name" value="${esc(u.name)}"></div>
      <div class="form-group"><label>Email</label><input class="form-control" value="${esc(u.email)}" disabled></div>
      <div class="form-row">
        <div class="form-group"><label>Role</label><select class="form-control" id="f-role">${roleOptions(u.role)}</select></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="f-active">
            <option value="true" ${u.active ? 'selected' : ''}>Active</option>
            <option value="false" ${!u.active ? 'selected' : ''}>Disabled</option>
          </select>
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="AdminUI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="AdminUI.saveEdit()">Save</button>
    `);
  }
  async function saveEdit() {
    try {
      await api('PATCH', `/users/${editing}`, {
        name: val('f-name'), role: val('f-role'), active: val('f-active') === 'true'
      });
      closeModal(); toast('User updated'); loadUsers();
    } catch (e) { toast(e.message, 'error'); }
  }

  // ── Reset password ──
  function resetPw(id, name) {
    openModal('Reset Password', `
      <p class="text-secondary">Set a new password for <strong>${esc(name)}</strong>.</p>
      <div class="form-group"><label>New Password</label><input type="password" class="form-control" id="f-newpass" placeholder="min 6 chars"></div>
    `, `
      <button class="btn btn-secondary" onclick="AdminUI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="AdminUI.saveResetPw('${id}')">Reset</button>
    `);
  }
  async function saveResetPw(id) {
    try {
      const newPassword = val('f-newpass');
      if (!newPassword || newPassword.length < 6) return toast('Min 6 characters', 'error');
      await api('PATCH', `/users/${id}/password`, { newPassword });
      closeModal(); toast('Password reset');
    } catch (e) { toast(e.message, 'error'); }
  }

  // ── Delete ──
  function remove(id, name) {
    openModal('Delete User', `
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <h4>Delete ${esc(name)}?</h4>
        <p>This permanently removes the account. This cannot be undone.</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="AdminUI.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="AdminUI.confirmRemove('${id}')">Delete</button>
        </div>
      </div>`, '');
  }
  async function confirmRemove(id) {
    try { await api('DELETE', `/users/${id}`); closeModal(); toast('User deleted'); loadUsers(); loadStats(); }
    catch (e) { toast(e.message, 'error'); }
  }

  // ── utils ──
  function val(id) { return document.getElementById(id).value.trim(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  document.addEventListener('DOMContentLoaded', init);

  return { openCreate, saveCreate, openEdit, saveEdit, resetPw, saveResetPw, remove, confirmRemove, closeModal };
})();
