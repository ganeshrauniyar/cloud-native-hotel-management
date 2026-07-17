/* ═══════════════════════════════════════════════════════════════
   STAFF MODULE — Staff Directory & Roles
   ═══════════════════════════════════════════════════════════════ */

const StaffModule = (() => {
  let roleFilter = 'all';

  function render() {
    const staff = getFilteredStaff();
    const roles = HotelData.STAFF_ROLES;

    return `
      <div class="page-enter">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-pills">
            <button class="filter-pill ${roleFilter === 'all' ? 'active' : ''}" onclick="StaffModule.setFilter('all')">All Staff</button>
            ${roles.map(r => `
              <button class="filter-pill ${roleFilter === r.value ? 'active' : ''}" onclick="StaffModule.setFilter('${r.value}')">${r.label}</button>
            `).join('')}
          </div>
          <button class="btn btn-primary" onclick="StaffModule.openAddModal()">+ Add Staff</button>
        </div>

        <!-- Staff Grid -->
        <div class="staff-grid stagger-children">
          ${staff.map(s => renderStaffCard(s)).join('')}
          ${staff.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">👥</div><h4>No staff members found</h4></div>' : ''}
        </div>
      </div>
    `;
  }

  function renderStaffCard(s) {
    const roleInfo = HotelData.STAFF_ROLES.find(r => r.value === s.role);
    const roleColor = roleInfo ? roleInfo.color : '#94a3b8';

    return `
      <div class="staff-card" style="border-top: 3px solid ${roleColor}">
        <div class="d-flex justify-between align-center mb-2">
          <div style="font-size:1.15rem;font-weight:700;color:var(--text-primary);">${s.fullName}</div>
          <span class="role-badge" style="background:${roleColor}20; color:${roleColor}; border: 1px solid ${roleColor}40;">${s.roleName}</span>
        </div>
        <div class="staff-info-row">
          <span class="info-icon">📧</span>
          ${s.email}
        </div>
        <div class="staff-info-row">
          <span class="info-icon">📱</span>
          ${s.phone}
        </div>
        <div class="staff-info-row">
          <span class="info-icon">🕒</span>
          Shift: ${s.shift}
        </div>
        <div class="staff-info-row">
          <span class="info-icon">📅</span>
          Joined: ${formatDate(s.joinDate)}
        </div>
        <div class="d-flex gap-1 mt-3 justify-between align-center">
          <span class="status-badge ${s.status === 'active' ? 'available' : 'maintenance'}" style="font-size:0.7rem;">${s.status === 'active' ? 'Active' : 'On Leave'}</span>
          <div class="table-actions">
            <button class="btn-icon btn-sm" onclick="StaffModule.openEditModal('${s.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-sm" onclick="StaffModule.confirmDelete('${s.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  function getFilteredStaff() {
    let staff = HotelData.staff;
    if (roleFilter !== 'all') {
      staff = staff.filter(s => s.role === roleFilter);
    }
    return staff.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  function setFilter(role) {
    roleFilter = role;
    App.refreshPage();
  }

  function openAddModal() {
    App.openModal('Add New Staff Member', renderStaffForm(), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="StaffModule.saveStaff()">Add Staff</button>
    `);
  }

  function openEditModal(id) {
    const staff = HotelData.getById(HotelData.KEYS.STAFF, id);
    if (!staff) return;
    App.openModal('Edit Staff Member', renderStaffForm(staff), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="StaffModule.saveStaff('${id}')">Save Changes</button>
    `);
  }

  function renderStaffForm(s = null) {
    const roleOptions = HotelData.STAFF_ROLES.map(r =>
      `<option value="${r.value}" ${s && s.role === r.value ? 'selected' : ''}>${r.label}</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label for="staff-first">First Name</label>
          <input type="text" class="form-control" id="staff-first" placeholder="First name" value="${s ? s.firstName : ''}">
        </div>
        <div class="form-group">
          <label for="staff-last">Last Name</label>
          <input type="text" class="form-control" id="staff-last" placeholder="Last name" value="${s ? s.lastName : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="staff-email">Email</label>
          <input type="email" class="form-control" id="staff-email" placeholder="email@grandhotel.com" value="${s ? s.email : ''}">
        </div>
        <div class="form-group">
          <label for="staff-phone">Phone</label>
          <input type="tel" class="form-control" id="staff-phone" placeholder="+91 XXXXX XXXXX" value="${s ? s.phone : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="staff-role">Role</label>
          <select class="form-control" id="staff-role">${roleOptions}</select>
        </div>
        <div class="form-group">
          <label for="staff-shift">Shift</label>
          <select class="form-control" id="staff-shift">
            <option value="Day (8AM–4PM)" ${s && s.shift === 'Day (8AM–4PM)' ? 'selected' : ''}>Day (8AM–4PM)</option>
            <option value="Evening (2PM–10PM)" ${s && s.shift === 'Evening (2PM–10PM)' ? 'selected' : ''}>Evening (2PM–10PM)</option>
            <option value="Night (10PM–6AM)" ${s && s.shift === 'Night (10PM–6AM)' ? 'selected' : ''}>Night (10PM–6AM)</option>
            <option value="Split (6AM–2PM, 5PM–10PM)" ${s && s.shift === 'Split (6AM–2PM, 5PM–10PM)' ? 'selected' : ''}>Split (6AM–2PM, 5PM–10PM)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="staff-status">Status</label>
          <select class="form-control" id="staff-status">
            <option value="active" ${s && s.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="leave" ${s && s.status === 'leave' ? 'selected' : ''}>On Leave</option>
          </select>
        </div>
        <div class="form-group">
          <label for="staff-joindate">Join Date</label>
          <input type="date" class="form-control" id="staff-joindate" value="${s ? s.joinDate : new Date().toISOString().split('T')[0]}">
        </div>
      </div>
    `;
  }

  function saveStaff(editId = null) {
    const firstName = document.getElementById('staff-first').value.trim();
    const lastName = document.getElementById('staff-last').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const phone = document.getElementById('staff-phone').value.trim();
    const role = document.getElementById('staff-role').value;
    const shift = document.getElementById('staff-shift').value;
    const status = document.getElementById('staff-status').value;
    const joinDate = document.getElementById('staff-joindate').value;

    if (!firstName || !lastName || !email || !phone) {
      App.showToast('Please fill all required fields', 'error');
      return;
    }

    const roleInfo = HotelData.STAFF_ROLES.find(r => r.value === role);

    const staffData = {
      firstName, lastName,
      fullName: `${firstName} ${lastName}`,
      email, phone, role,
      roleName: roleInfo ? roleInfo.label : role,
      shift, status, joinDate
    };

    if (editId) {
      HotelData.update(HotelData.KEYS.STAFF, editId, staffData);
      App.showToast(`${staffData.fullName} details updated`, 'success');
    } else {
      HotelData.add(HotelData.KEYS.STAFF, {
        id: HotelData.generateId('staff_'),
        ...staffData,
        createdAt: new Date().toISOString()
      });
      HotelData.logActivity('Staff Added', `New staff member ${staffData.fullName} (${staffData.roleName}) joined`, '👤');
      App.showToast(`${staffData.fullName} added successfully`, 'success');
    }

    App.closeModal();
    App.refreshPage();
  }

  function confirmDelete(id) {
    const s = HotelData.getById(HotelData.KEYS.STAFF, id);
    if (!s) return;

    App.openModal('Remove Staff Member', `
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <h4>Remove ${s.fullName}?</h4>
        <p>This will remove them from the staff directory. This action cannot be undone.</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="StaffModule.doDelete('${id}')">Remove Staff</button>
        </div>
      </div>
    `, '');
  }

  function doDelete(id) {
    const s = HotelData.getById(HotelData.KEYS.STAFF, id);
    HotelData.remove(HotelData.KEYS.STAFF, id);
    HotelData.logActivity('Staff Removed', `Staff member ${s?.fullName} removed`, '🗑️');
    App.showToast('Staff member removed', 'success');
    App.closeModal();
    App.refreshPage();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return { render, setFilter, openAddModal, openEditModal, saveStaff, confirmDelete, doDelete };
})();
