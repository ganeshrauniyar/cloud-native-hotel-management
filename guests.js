/* ═══════════════════════════════════════════════════════════════
   GUESTS MODULE — Guest Registry CRUD
   ═══════════════════════════════════════════════════════════════ */

const GuestsModule = (() => {
  let searchQuery = '';

  // Avatar color palette
  const avatarColors = [
    'linear-gradient(135deg, #d4a853, #b8892f)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #3b82f6, #2563eb)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #ef4444, #dc2626)'
  ];

  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function render() {
    const guests = getFilteredGuests();

    return `
      <div class="page-enter">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-search">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search by name, email, or phone..." value="${searchQuery}" oninput="GuestsModule.onSearch(this.value)">
          </div>
          <button class="btn btn-primary" onclick="GuestsModule.openAddModal()">+ Add Guest</button>
        </div>

        <!-- Guests Grid -->
        <div class="guests-grid stagger-children">
          ${guests.map(g => renderGuestCard(g)).join('')}
          ${guests.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">👤</div><h4>No guests found</h4><p>Try adjusting your search</p></div>' : ''}
        </div>
      </div>
    `;
  }

  function renderGuestCard(g) {
    const bookingCount = HotelData.bookings.filter(b => b.guestId === g.id).length;

    return `
      <div class="guest-card">
        <div class="guest-card-header">
          <div class="guest-avatar" style="background:${getAvatarColor(g.fullName)}">${getInitials(g.fullName)}</div>
          <div>
            <div class="guest-name">${g.fullName}</div>
            <div class="guest-nationality">🌍 ${g.nationality}</div>
          </div>
        </div>
        <div class="guest-info-row">
          <span class="info-icon">📧</span>
          ${g.email}
        </div>
        <div class="guest-info-row">
          <span class="info-icon">📱</span>
          ${g.phone}
        </div>
        <div class="guest-info-row">
          <span class="info-icon">🪪</span>
          ${g.idType}: ${g.idNumber}
        </div>
        <div class="guest-info-row">
          <span class="info-icon">📅</span>
          ${bookingCount} booking${bookingCount !== 1 ? 's' : ''} · ${g.totalStays} stay${g.totalStays !== 1 ? 's' : ''}
        </div>
        <div class="guest-card-actions">
          <button class="btn btn-sm btn-secondary" onclick="GuestsModule.viewHistory('${g.id}')">📋 History</button>
          <button class="btn btn-sm btn-ghost" onclick="GuestsModule.openEditModal('${g.id}')">✏️ Edit</button>
          <button class="btn btn-sm btn-ghost" onclick="GuestsModule.confirmDelete('${g.id}')" style="color:#ef4444">🗑️</button>
        </div>
      </div>
    `;
  }

  function getFilteredGuests() {
    let guests = HotelData.guests;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      guests = guests.filter(g =>
        g.fullName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q)
      );
    }
    return guests.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  function onSearch(q) { searchQuery = q; App.refreshPage(); }

  function openAddModal(prefill = null) {
    App.openModal('Add New Guest', renderGuestForm(prefill), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="GuestsModule.saveGuest()">Add Guest</button>
    `);
  }

  function openEditModal(id) {
    const guest = HotelData.getById(HotelData.KEYS.GUESTS, id);
    if (!guest) return;
    App.openModal('Edit Guest', renderGuestForm(guest), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="GuestsModule.saveGuest('${id}')">Save Changes</button>
    `);
  }

  function renderGuestForm(g = null) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="guest-first">First Name</label>
          <input type="text" class="form-control" id="guest-first" placeholder="First name" value="${g ? g.firstName : ''}">
        </div>
        <div class="form-group">
          <label for="guest-last">Last Name</label>
          <input type="text" class="form-control" id="guest-last" placeholder="Last name" value="${g ? g.lastName : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="guest-email">Email</label>
          <input type="email" class="form-control" id="guest-email" placeholder="email@example.com" value="${g ? g.email : ''}">
        </div>
        <div class="form-group">
          <label for="guest-phone">Phone</label>
          <input type="tel" class="form-control" id="guest-phone" placeholder="+91 98765 43210" value="${g ? g.phone : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="guest-nationality">Nationality</label>
          <input type="text" class="form-control" id="guest-nationality" placeholder="e.g. Indian" value="${g ? g.nationality : ''}">
        </div>
        <div class="form-group">
          <label for="guest-id-type">ID Type</label>
          <select class="form-control" id="guest-id-type">
            <option value="Aadhaar" ${g && g.idType === 'Aadhaar' ? 'selected' : ''}>Aadhaar</option>
            <option value="Passport" ${g && g.idType === 'Passport' ? 'selected' : ''}>Passport</option>
            <option value="Driving License" ${g && g.idType === 'Driving License' ? 'selected' : ''}>Driving License</option>
            <option value="Voter ID" ${g && g.idType === 'Voter ID' ? 'selected' : ''}>Voter ID</option>
            <option value="Other" ${g && g.idType === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="guest-id-num">ID Number</label>
        <input type="text" class="form-control" id="guest-id-num" placeholder="ID number" value="${g ? g.idNumber : ''}">
      </div>
    `;
  }

  function saveGuest(editId = null) {
    const firstName = document.getElementById('guest-first').value.trim();
    const lastName = document.getElementById('guest-last').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const nationality = document.getElementById('guest-nationality').value.trim();
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-num').value.trim();

    if (!firstName || !lastName || !email || !phone) {
      App.showToast('Please fill all required fields', 'error');
      return;
    }

    const guestData = {
      firstName, lastName,
      fullName: `${firstName} ${lastName}`,
      email, phone, nationality, idType, idNumber
    };

    if (editId) {
      HotelData.update(HotelData.KEYS.GUESTS, editId, guestData);
      // Update guest name in bookings
      HotelData.bookings.filter(b => b.guestId === editId).forEach(b => {
        HotelData.update(HotelData.KEYS.BOOKINGS, b.id, { guestName: guestData.fullName });
      });
      App.showToast(`${guestData.fullName} updated`, 'success');
    } else {
      HotelData.add(HotelData.KEYS.GUESTS, {
        id: HotelData.generateId('guest_'),
        ...guestData,
        totalStays: 0,
        createdAt: new Date().toISOString()
      });
      HotelData.logActivity('Guest Added', `${guestData.fullName} added to guest registry`, '👤');
      App.showToast(`${guestData.fullName} added`, 'success');
    }

    App.closeModal();
    App.refreshPage();
  }

  function viewHistory(id) {
    const guest = HotelData.getById(HotelData.KEYS.GUESTS, id);
    if (!guest) return;
    const bookings = HotelData.bookings.filter(b => b.guestId === id);

    App.openModal(`Booking History — ${guest.fullName}`, `
      ${bookings.length > 0 ? `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Room</th><th>Check In</th><th>Check Out</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td>${b.roomNumber} (${b.roomType})</td>
                  <td>${formatDate(b.checkIn)}</td>
                  <td>${formatDate(b.checkOut)}</td>
                  <td>₹${b.totalAmount.toLocaleString()}</td>
                  <td><span class="status-badge ${b.status}">${b.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><div class="empty-icon">📋</div><h4>No booking history</h4></div>'}
    `, `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>`);
  }

  function confirmDelete(id) {
    const guest = HotelData.getById(HotelData.KEYS.GUESTS, id);
    if (!guest) return;

    const activeBookings = HotelData.bookings.filter(b => b.guestId === id && (b.status === 'confirmed' || b.status === 'checked_in'));
    if (activeBookings.length > 0) {
      App.showToast('Cannot delete guest with active bookings', 'error');
      return;
    }

    App.openModal('Delete Guest', `
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <h4>Delete ${guest.fullName}?</h4>
        <p>This will remove the guest from the registry. This cannot be undone.</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="GuestsModule.doDelete('${id}')">Delete</button>
        </div>
      </div>
    `, '');
  }

  function doDelete(id) {
    const guest = HotelData.getById(HotelData.KEYS.GUESTS, id);
    HotelData.remove(HotelData.KEYS.GUESTS, id);
    HotelData.logActivity('Guest Removed', `${guest?.fullName} removed from registry`, '🗑️');
    App.showToast('Guest deleted', 'success');
    App.closeModal();
    App.refreshPage();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return { render, onSearch, openAddModal, openEditModal, saveGuest, viewHistory, confirmDelete, doDelete };
})();
