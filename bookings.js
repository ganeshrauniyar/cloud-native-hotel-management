/* ═══════════════════════════════════════════════════════════════
   BOOKINGS MODULE — Booking System CRUD
   ═══════════════════════════════════════════════════════════════ */

const BookingsModule = (() => {
  let filterStatus = 'all';
  let searchQuery = '';

  function render() {
    const bookings = getFilteredBookings();
    const stats = HotelData.stats;

    return `
      <div class="page-enter">
        <!-- Quick Stats -->
        <div class="stats-grid stagger-children" style="grid-template-columns: repeat(4, 1fr);">
          <div class="stat-card teal">
            <div class="stat-header"><div class="stat-icon">📅</div><span class="stat-label">Total</span></div>
            <div class="stat-value">${stats.totalBookings}</div>
          </div>
          <div class="stat-card green">
            <div class="stat-header"><div class="stat-icon">✅</div><span class="stat-label">Active</span></div>
            <div class="stat-value">${stats.activeBookings}</div>
          </div>
          <div class="stat-card gold">
            <div class="stat-header"><div class="stat-icon">📝</div><span class="stat-label">Pending</span></div>
            <div class="stat-value">${HotelData.bookings.filter(b => b.status === 'pending').length}</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-header"><div class="stat-icon">🏁</div><span class="stat-label">Completed</span></div>
            <div class="stat-value">${HotelData.bookings.filter(b => b.status === 'checked_out').length}</div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-search">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search by guest name or room..." value="${searchQuery}" oninput="BookingsModule.onSearch(this.value)">
          </div>
          <div class="filter-pills">
            <button class="filter-pill ${filterStatus === 'all' ? 'active' : ''}" onclick="BookingsModule.setFilter('all')">All</button>
            <button class="filter-pill ${filterStatus === 'confirmed' ? 'active' : ''}" onclick="BookingsModule.setFilter('confirmed')">Confirmed</button>
            <button class="filter-pill ${filterStatus === 'checked_in' ? 'active' : ''}" onclick="BookingsModule.setFilter('checked_in')">Checked In</button>
            <button class="filter-pill ${filterStatus === 'checked_out' ? 'active' : ''}" onclick="BookingsModule.setFilter('checked_out')">Checked Out</button>
            <button class="filter-pill ${filterStatus === 'cancelled' ? 'active' : ''}" onclick="BookingsModule.setFilter('cancelled')">Cancelled</button>
          </div>
          <button class="btn btn-primary" onclick="BookingsModule.openAddModal()">+ New Booking</button>
        </div>

        <!-- Bookings Table -->
        <div class="glass-card" style="padding:0; overflow:hidden;">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Nights</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${bookings.map(b => `
                  <tr>
                    <td><strong>${b.guestName}</strong></td>
                    <td>${b.roomNumber}</td>
                    <td><span class="text-secondary">${b.roomType}</span></td>
                    <td>${formatDate(b.checkIn)}</td>
                    <td>${formatDate(b.checkOut)}</td>
                    <td>${b.nights}</td>
                    <td><strong>₹${b.totalAmount.toLocaleString()}</strong></td>
                    <td><span class="status-badge ${b.status}">${formatStatus(b.status)}</span></td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-icon" onclick="BookingsModule.viewBooking('${b.id}')" title="View">👁️</button>
                        ${b.status === 'confirmed' || b.status === 'pending' ? `
                          <button class="btn-icon" onclick="BookingsModule.openEditModal('${b.id}')" title="Edit">✏️</button>
                          <button class="btn-icon" onclick="BookingsModule.cancelBooking('${b.id}')" title="Cancel">❌</button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
                ${bookings.length === 0 ? `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📅</div><h4>No bookings found</h4></div></td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function getFilteredBookings() {
    let bookings = HotelData.bookings;
    if (filterStatus !== 'all') {
      bookings = bookings.filter(b => b.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      bookings = bookings.filter(b =>
        b.guestName.toLowerCase().includes(q) ||
        b.roomNumber.toString().includes(q)
      );
    }
    return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function setFilter(s) { filterStatus = s; App.refreshPage(); }
  function onSearch(q) { searchQuery = q; App.refreshPage(); }

  function openAddModal() {
    const guests = HotelData.guests;
    const availableRooms = HotelData.rooms.filter(r => r.status === 'available');

    const guestOptions = guests.map(g => `<option value="${g.id}">${g.fullName} (${g.phone})</option>`).join('');
    const roomOptions = availableRooms.map(r => `<option value="${r.id}" data-price="${r.price}">${r.number} — ${r.typeName} (₹${r.price.toLocaleString()}/night)</option>`).join('');

    const today = new Date().toISOString().split('T')[0];

    App.openModal('Create New Booking', `
      <div class="form-row">
        <div class="form-group">
          <label for="book-guest">Guest</label>
          <select class="form-control" id="book-guest">
            <option value="">Select a guest...</option>
            ${guestOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="book-room">Room</label>
          <select class="form-control" id="book-room" onchange="BookingsModule.calcTotal()">
            <option value="">Select a room...</option>
            ${roomOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="book-checkin">Check-In Date</label>
          <input type="date" class="form-control" id="book-checkin" value="${today}" onchange="BookingsModule.calcTotal()">
        </div>
        <div class="form-group">
          <label for="book-checkout">Check-Out Date</label>
          <input type="date" class="form-control" id="book-checkout" onchange="BookingsModule.calcTotal()">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="book-adults">Adults</label>
          <input type="number" class="form-control" id="book-adults" value="1" min="1" max="6">
        </div>
        <div class="form-group">
          <label for="book-children">Children</label>
          <input type="number" class="form-control" id="book-children" value="0" min="0" max="4">
        </div>
      </div>
      <div class="form-group">
        <label for="book-requests">Special Requests</label>
        <textarea class="form-control" id="book-requests" placeholder="Any special requirements..."></textarea>
      </div>
      <div class="glass-card" style="margin-top:8px;padding:16px;">
        <div class="d-flex justify-between align-center">
          <span class="text-secondary">Estimated Total</span>
          <span id="book-total" style="font-size:1.4rem;font-weight:800;color:var(--gold);">₹0</span>
        </div>
        <div class="text-xs text-muted mt-2" id="book-calc-detail">Select room and dates to calculate</div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="BookingsModule.saveBooking()">Create Booking</button>
    `);
  }

  function calcTotal() {
    const roomSelect = document.getElementById('book-room');
    const checkIn = document.getElementById('book-checkin')?.value;
    const checkOut = document.getElementById('book-checkout')?.value;
    const totalEl = document.getElementById('book-total');
    const detailEl = document.getElementById('book-calc-detail');

    if (!roomSelect?.value || !checkIn || !checkOut) return;

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const price = parseInt(selectedOption.dataset.price);
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      if (totalEl) totalEl.textContent = '₹0';
      if (detailEl) detailEl.textContent = 'Check-out must be after check-in';
      return;
    }

    const total = nights * price;
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString()}`;
    if (detailEl) detailEl.textContent = `${nights} night${nights > 1 ? 's' : ''} × ₹${price.toLocaleString()}/night`;
  }

  function saveBooking(editId = null) {
    const guestId = document.getElementById('book-guest').value;
    const roomId = document.getElementById('book-room').value;
    const checkIn = document.getElementById('book-checkin').value;
    const checkOut = document.getElementById('book-checkout').value;
    const adults = parseInt(document.getElementById('book-adults').value);
    const children = parseInt(document.getElementById('book-children').value);
    const requests = document.getElementById('book-requests').value;

    if (!guestId || !roomId || !checkIn || !checkOut) {
      App.showToast('Please fill all required fields', 'error');
      return;
    }

    const guest = HotelData.getById(HotelData.KEYS.GUESTS, guestId);
    const room = HotelData.getById(HotelData.KEYS.ROOMS, roomId);
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      App.showToast('Check-out date must be after check-in date', 'error');
      return;
    }

    const bookingData = {
      guestId: guest.id,
      guestName: guest.fullName,
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.typeName,
      checkIn, checkOut, nights,
      ratePerNight: room.price,
      totalAmount: nights * room.price,
      adults, children,
      specialRequests: requests,
      status: 'confirmed'
    };

    if (editId) {
      HotelData.update(HotelData.KEYS.BOOKINGS, editId, bookingData);
      App.showToast('Booking updated successfully', 'success');
    } else {
      HotelData.add(HotelData.KEYS.BOOKINGS, {
        id: HotelData.generateId('book_'),
        ...bookingData,
        createdAt: new Date().toISOString()
      });
      // Mark room as reserved
      HotelData.update(HotelData.KEYS.ROOMS, room.id, { status: 'reserved' });
      HotelData.logActivity('Booking Created', `New booking for ${guest.fullName} — Room ${room.number}`, '📝');
      App.showToast(`Booking created for ${guest.fullName}`, 'success');
    }

    App.closeModal();
    App.refreshPage();
  }

  function openEditModal(id) {
    const b = HotelData.getById(HotelData.KEYS.BOOKINGS, id);
    if (!b) return;
    // Simplified: open add modal and pre-fill (for brevity, same form reuse)
    openAddModal();
    setTimeout(() => {
      document.getElementById('book-guest').value = b.guestId;
      document.getElementById('book-room').value = b.roomId;
      document.getElementById('book-checkin').value = b.checkIn;
      document.getElementById('book-checkout').value = b.checkOut;
      document.getElementById('book-adults').value = b.adults;
      document.getElementById('book-children').value = b.children;
      document.getElementById('book-requests').value = b.specialRequests || '';
      calcTotal();
      // Change button to update
      const footer = document.getElementById('modal-footer');
      footer.innerHTML = `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="BookingsModule.saveBooking('${id}')">Update Booking</button>
      `;
      document.getElementById('modal-title').textContent = 'Edit Booking';
    }, 50);
  }

  function viewBooking(id) {
    const b = HotelData.getById(HotelData.KEYS.BOOKINGS, id);
    if (!b) return;

    App.openModal('Booking Details', `
      <div class="booking-detail-grid">
        <div class="booking-detail-item">
          <div class="detail-label">Guest</div>
          <div class="detail-value">${b.guestName}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Room</div>
          <div class="detail-value">${b.roomNumber} (${b.roomType})</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Check-In</div>
          <div class="detail-value">${formatDate(b.checkIn)}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Check-Out</div>
          <div class="detail-value">${formatDate(b.checkOut)}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Nights</div>
          <div class="detail-value">${b.nights}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Rate/Night</div>
          <div class="detail-value">₹${b.ratePerNight.toLocaleString()}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Guests</div>
          <div class="detail-value">${b.adults} Adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} Child${b.children > 1 ? 'ren' : ''}` : ''}</div>
        </div>
        <div class="booking-detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value"><span class="status-badge ${b.status}">${formatStatus(b.status)}</span></div>
        </div>
      </div>
      ${b.specialRequests ? `<div class="booking-detail-item mt-3" style="width:100%;"><div class="detail-label">Special Requests</div><div class="detail-value">${b.specialRequests}</div></div>` : ''}
      <div class="glass-card mt-3" style="padding:16px;">
        <div class="d-flex justify-between align-center">
          <span class="text-lg font-semibold">Total Amount</span>
          <span style="font-size:1.5rem;font-weight:800;color:var(--gold);">₹${b.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    `, `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>`);
  }

  function cancelBooking(id) {
    const b = HotelData.getById(HotelData.KEYS.BOOKINGS, id);
    if (!b) return;

    App.openModal('Cancel Booking', `
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <h4>Cancel booking for ${b.guestName}?</h4>
        <p>Room ${b.roomNumber} · ${formatDate(b.checkIn)} — ${formatDate(b.checkOut)}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">Keep Booking</button>
          <button class="btn btn-danger" onclick="BookingsModule.doCancel('${id}')">Cancel Booking</button>
        </div>
      </div>
    `, '');
  }

  function doCancel(id) {
    const b = HotelData.getById(HotelData.KEYS.BOOKINGS, id);
    HotelData.update(HotelData.KEYS.BOOKINGS, id, { status: 'cancelled' });
    if (b) {
      HotelData.update(HotelData.KEYS.ROOMS, b.roomId, { status: 'available' });
      HotelData.logActivity('Booking Cancelled', `Booking for ${b.guestName} (Room ${b.roomNumber}) cancelled`, '❌');
    }
    App.showToast('Booking cancelled', 'success');
    App.closeModal();
    App.refreshPage();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatStatus(s) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return { render, setFilter, onSearch, openAddModal, openEditModal, calcTotal, saveBooking, viewBooking, cancelBooking, doCancel };
})();
