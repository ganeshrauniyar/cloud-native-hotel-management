/* ═══════════════════════════════════════════════════════════════
   CHECK-IN / CHECK-OUT MODULE
   ═══════════════════════════════════════════════════════════════ */

const CheckInOutModule = (() => {
  let activeTab = 'checkin';

  function render() {
    const bookings = HotelData.bookings;
    const today = new Date().toISOString().split('T')[0];

    // Pending check-ins: confirmed bookings with checkIn <= today
    const pendingCheckIns = bookings.filter(b =>
      b.status === 'confirmed' && b.checkIn <= today
    );

    // Pending check-outs: checked_in bookings with checkOut <= today
    const pendingCheckOuts = bookings.filter(b =>
      b.status === 'checked_in' && b.checkOut <= today
    );

    // All currently checked in
    const allCheckedIn = bookings.filter(b => b.status === 'checked_in');

    return `
      <div class="page-enter">
        <!-- Quick Action Cards -->
        <div class="quick-actions-grid">
          <div class="quick-action-card check-in" onclick="CheckInOutModule.setTab('checkin')" style="${activeTab === 'checkin' ? 'border-color:rgba(16,185,129,0.4);box-shadow:0 4px 20px rgba(16,185,129,0.15);' : ''}">
            <div class="qa-icon">🟢</div>
            <div class="qa-title">Check In</div>
            <div class="qa-desc">${pendingCheckIns.length} pending arrival${pendingCheckIns.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="quick-action-card check-out" onclick="CheckInOutModule.setTab('checkout')" style="${activeTab === 'checkout' ? 'border-color:rgba(139,92,246,0.4);box-shadow:0 4px 20px rgba(139,92,246,0.15);' : ''}">
            <div class="qa-icon">🔴</div>
            <div class="qa-title">Check Out</div>
            <div class="qa-desc">${pendingCheckOuts.length} pending departure${pendingCheckOuts.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <!-- Tab Content -->
        ${activeTab === 'checkin' ? renderCheckInTab(pendingCheckIns) : renderCheckOutTab(pendingCheckOuts, allCheckedIn)}
      </div>
    `;
  }

  function renderCheckInTab(pendingCheckIns) {
    return `
      <div class="section-header">
        <h3>🟢 Pending Arrivals</h3>
        <span class="text-sm text-muted">${pendingCheckIns.length} booking${pendingCheckIns.length !== 1 ? 's' : ''} ready for check-in</span>
      </div>

      <div class="checkin-grid stagger-children">
        ${pendingCheckIns.map(b => `
          <div class="checkin-card">
            <div class="checkin-header">
              <div>
                <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">${b.guestName}</div>
                <div class="text-sm text-muted">Booking #${b.id.substring(0, 12)}</div>
              </div>
              <span class="status-badge confirmed">Confirmed</span>
            </div>
            <div class="checkin-dates">
              <div class="date-block">
                <div class="date-label">Check In</div>
                <div class="date-value">${formatDate(b.checkIn)}</div>
              </div>
              <span class="date-arrow">→</span>
              <div class="date-block">
                <div class="date-label">Check Out</div>
                <div class="date-value">${formatDate(b.checkOut)}</div>
              </div>
              <div class="date-block" style="margin-left:auto;">
                <div class="date-label">Nights</div>
                <div class="date-value">${b.nights}</div>
              </div>
            </div>
            <div class="d-flex justify-between align-center" style="margin-bottom:12px;">
              <span class="text-secondary">Room ${b.roomNumber} · ${b.roomType}</span>
              <span class="font-bold text-gold">₹${b.totalAmount.toLocaleString()}</span>
            </div>
            <button class="btn btn-teal" style="width:100%;" onclick="CheckInOutModule.doCheckIn('${b.id}')">
              🔑 Check In Guest
            </button>
          </div>
        `).join('')}
        ${pendingCheckIns.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">✨</div><h4>No pending arrivals</h4><p>All guests have been checked in</p></div>' : ''}
      </div>
    `;
  }

  function renderCheckOutTab(pendingCheckOuts, allCheckedIn) {
    return `
      <div class="section-header">
        <h3>🔴 Pending Departures (Today)</h3>
        <span class="text-sm text-muted">${pendingCheckOuts.length} departure${pendingCheckOuts.length !== 1 ? 's' : ''} due today</span>
      </div>

      <div class="checkin-grid stagger-children">
        ${pendingCheckOuts.map(b => `
          <div class="checkin-card">
            <div class="checkin-header">
              <div>
                <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">${b.guestName}</div>
                <div class="text-sm text-muted">Room ${b.roomNumber} · ${b.roomType}</div>
              </div>
              <span class="status-badge checked_in">Checked In</span>
            </div>
            <div class="checkin-dates">
              <div class="date-block">
                <div class="date-label">Stayed Since</div>
                <div class="date-value">${formatDate(b.checkIn)}</div>
              </div>
              <span class="date-arrow">→</span>
              <div class="date-block">
                <div class="date-label">Due Today</div>
                <div class="date-value">${formatDate(b.checkOut)}</div>
              </div>
            </div>
            <div class="d-flex justify-between align-center" style="margin-bottom:12px;">
              <span class="text-secondary">${b.nights} nights</span>
              <span class="font-bold text-gold">₹${b.totalAmount.toLocaleString()}</span>
            </div>
            <button class="btn btn-primary" style="width:100%;background:linear-gradient(135deg,#8b5cf6,#7c3aed);" onclick="CheckInOutModule.doCheckOut('${b.id}')">
              🏁 Check Out & Generate Invoice
            </button>
          </div>
        `).join('')}
        ${pendingCheckOuts.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🏖️</div><h4>No departures due today</h4></div>' : ''}
      </div>

      <!-- All Currently Checked In -->
      ${allCheckedIn.length > 0 ? `
        <div class="section-header mt-4">
          <h3>🏨 Currently Checked In</h3>
          <span class="text-sm text-muted">${allCheckedIn.length} guest${allCheckedIn.length !== 1 ? 's' : ''} in house</span>
        </div>
        <div class="glass-card" style="padding:0;overflow:hidden;">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr><th>Guest</th><th>Room</th><th>Check In</th><th>Check Out</th><th>Amount</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${allCheckedIn.map(b => `
                  <tr>
                    <td><strong>${b.guestName}</strong></td>
                    <td>${b.roomNumber} (${b.roomType})</td>
                    <td>${formatDate(b.checkIn)}</td>
                    <td>${formatDate(b.checkOut)}</td>
                    <td>₹${b.totalAmount.toLocaleString()}</td>
                    <td><button class="btn btn-sm btn-secondary" onclick="CheckInOutModule.doCheckOut('${b.id}')">Check Out</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
  }

  function setTab(tab) {
    activeTab = tab;
    App.refreshPage();
  }

  function doCheckIn(bookingId) {
    const booking = HotelData.getById(HotelData.KEYS.BOOKINGS, bookingId);
    if (!booking) return;

    // Update booking status
    HotelData.update(HotelData.KEYS.BOOKINGS, bookingId, { status: 'checked_in' });
    // Update room status
    HotelData.update(HotelData.KEYS.ROOMS, booking.roomId, { status: 'occupied' });
    // Update guest stay count
    const guest = HotelData.getById(HotelData.KEYS.GUESTS, booking.guestId);
    if (guest) {
      HotelData.update(HotelData.KEYS.GUESTS, booking.guestId, { totalStays: (guest.totalStays || 0) + 1 });
    }

    HotelData.logActivity('Guest Checked In', `${booking.guestName} checked into Room ${booking.roomNumber}`, '🟢');
    App.showToast(`${booking.guestName} checked in to Room ${booking.roomNumber}`, 'success');
    App.refreshPage();
  }

  function doCheckOut(bookingId) {
    quickCheckOut(bookingId);
  }

  function quickCheckOut(bookingId) {
    const booking = HotelData.getById(HotelData.KEYS.BOOKINGS, bookingId);
    if (!booking) return;

    // Update booking status
    HotelData.update(HotelData.KEYS.BOOKINGS, bookingId, { status: 'checked_out' });
    // Update room status
    HotelData.update(HotelData.KEYS.ROOMS, booking.roomId, { status: 'available' });

    // Auto-generate invoice
    const invoice = {
      id: HotelData.generateId('inv_'),
      bookingId: booking.id,
      guestName: booking.guestName,
      roomNumber: booking.roomNumber,
      roomCharges: booking.totalAmount,
      extras: [],
      totalAmount: booking.totalAmount,
      paymentStatus: 'pending',
      paymentMethod: '',
      createdAt: new Date().toISOString()
    };
    HotelData.add(HotelData.KEYS.INVOICES, invoice);

    HotelData.logActivity('Guest Checked Out', `${booking.guestName} checked out of Room ${booking.roomNumber}`, '🔴');
    HotelData.logActivity('Invoice Generated', `Invoice for ${booking.guestName} — ₹${booking.totalAmount.toLocaleString()}`, '🧾');
    App.showToast(`${booking.guestName} checked out. Invoice generated.`, 'success');
    App.refreshPage();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return { render, setTab, doCheckIn, doCheckOut, quickCheckOut };
})();
