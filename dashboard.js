/* ═══════════════════════════════════════════════════════════════
   DASHBOARD MODULE — Stats, Charts, Activity Feed
   ═══════════════════════════════════════════════════════════════ */

const DashboardModule = (() => {

  function render() {
    const stats = HotelData.stats;
    const activity = HotelData.activity;
    const bookings = HotelData.bookings;
    const rooms = HotelData.rooms;
    const today = new Date().toISOString().split('T')[0];

    // Today's arrivals and departures
    const arrivals = bookings.filter(b => b.checkIn === today && (b.status === 'confirmed'));
    const departures = bookings.filter(b => b.checkOut === today && b.status === 'checked_in');

    return `
      <div class="page-enter">
        <!-- Stats Cards -->
        <div class="stats-grid stagger-children">
          <div class="stat-card gold">
            <div class="stat-header">
              <div class="stat-icon">🛏️</div>
              <span class="stat-label">Occupancy Rate</span>
            </div>
            <div class="stat-value" data-count="${stats.occupancyRate}">0%</div>
            <div class="stat-sub">${stats.occupied} of ${stats.totalRooms} rooms occupied</div>
          </div>

          <div class="stat-card teal">
            <div class="stat-header">
              <div class="stat-icon">📅</div>
              <span class="stat-label">Active Bookings</span>
            </div>
            <div class="stat-value" data-count="${stats.activeBookings}">0</div>
            <div class="stat-sub">${stats.totalBookings} total bookings</div>
          </div>

          <div class="stat-card green">
            <div class="stat-header">
              <div class="stat-icon">👤</div>
              <span class="stat-label">Total Guests</span>
            </div>
            <div class="stat-value" data-count="${stats.totalGuests}">0</div>
            <div class="stat-sub">Registered in system</div>
          </div>

          <div class="stat-card purple">
            <div class="stat-header">
              <div class="stat-icon">💰</div>
              <span class="stat-label">Total Revenue</span>
            </div>
            <div class="stat-value" data-count="${stats.totalRevenue}" data-prefix="₹">₹0</div>
            <div class="stat-sub">₹${stats.pendingPayments.toLocaleString()} pending</div>
          </div>
        </div>

        <!-- Dashboard Grid: Chart + Activity -->
        <div class="dashboard-grid">
          <!-- Room Status Chart -->
          <div class="glass-card">
            <div class="section-header">
              <h3>Room Status Overview</h3>
            </div>
            <div class="chart-container">
              <div class="donut-chart" id="room-donut-chart">
                <svg viewBox="0 0 140 140">
                  ${renderDonutChart(stats)}
                </svg>
                <div class="donut-center">
                  <span class="donut-value">${stats.totalRooms}</span>
                  <span class="donut-label">Total Rooms</span>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot available"></span>
                  Available
                  <span class="legend-count">${stats.available}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot occupied"></span>
                  Occupied
                  <span class="legend-count">${stats.occupied}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot reserved"></span>
                  Reserved
                  <span class="legend-count">${stats.reserved}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot maintenance"></span>
                  Maintenance
                  <span class="legend-count">${stats.maintenance}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="glass-card">
            <div class="section-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="activity-list">
              ${activity.slice(0, 6).map(a => `
                <div class="activity-item">
                  <div class="activity-icon">${a.icon}</div>
                  <div class="activity-text">
                    <div class="activity-action">${a.action}</div>
                    <div class="activity-details">${a.details}</div>
                  </div>
                  <span class="activity-time">${formatTimeAgo(a.timestamp)}</span>
                </div>
              `).join('')}
              ${activity.length === 0 ? '<div class="empty-state"><p>No recent activity</p></div>' : ''}
            </div>
          </div>
        </div>

        <!-- Today's Check-ins & Check-outs -->
        <div class="dashboard-grid">
          <div class="glass-card">
            <div class="section-header">
              <h3>🟢 Today's Arrivals</h3>
              <span class="text-sm text-muted">${arrivals.length} expected</span>
            </div>
            ${arrivals.length > 0 ? `
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Type</th>
                      <th>Nights</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${arrivals.map(b => `
                      <tr>
                        <td><strong>${b.guestName}</strong></td>
                        <td>${b.roomNumber}</td>
                        <td>${b.roomType}</td>
                        <td>${b.nights}</td>
                        <td><span class="status-badge ${b.status}">${formatStatus(b.status)}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="empty-state"><div class="empty-icon">🏖️</div><h4>No arrivals today</h4><p>All quiet on the front desk</p></div>'}
          </div>

          <div class="glass-card">
            <div class="section-header">
              <h3>🔴 Today's Departures</h3>
              <span class="text-sm text-muted">${departures.length} expected</span>
            </div>
            ${departures.length > 0 ? `
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${departures.map(b => `
                      <tr>
                        <td><strong>${b.guestName}</strong></td>
                        <td>${b.roomNumber}</td>
                        <td><button class="btn btn-sm btn-teal" onclick="CheckInOutModule.quickCheckOut('${b.id}')">Check Out</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="empty-state"><div class="empty-icon">✨</div><h4>No departures today</h4><p>Everyone is staying!</p></div>'}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="glass-card dashboard-full">
          <div class="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="stats-grid" style="margin-bottom:0;">
            <button class="quick-action-card check-in" onclick="App.navigate('checkinout')">
              <div class="qa-icon">🔑</div>
              <div class="qa-title">Check In Guest</div>
              <div class="qa-desc">Process new arrivals</div>
            </button>
            <button class="quick-action-card" onclick="App.navigate('bookings'); setTimeout(()=>BookingsModule.openAddModal(),100)">
              <div class="qa-icon">📝</div>
              <div class="qa-title">New Booking</div>
              <div class="qa-desc">Create a reservation</div>
            </button>
            <button class="quick-action-card" onclick="App.navigate('rooms')">
              <div class="qa-icon">🚪</div>
              <div class="qa-title">Manage Rooms</div>
              <div class="qa-desc">View all ${stats.totalRooms} rooms</div>
            </button>
            <button class="quick-action-card check-out" onclick="App.navigate('billing')">
              <div class="qa-icon">🧾</div>
              <div class="qa-title">Generate Invoice</div>
              <div class="qa-desc">Billing & payments</div>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDonutChart(stats) {
    const total = stats.totalRooms || 1;
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const cx = 70, cy = 70;

    const segments = [
      { count: stats.available, color: '#10b981' },
      { count: stats.occupied, color: '#ef4444' },
      { count: stats.reserved, color: '#f59e0b' },
      { count: stats.maintenance, color: '#6366f1' }
    ];

    let offset = 0;
    return segments.map(seg => {
      const pct = seg.count / total;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const svg = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="14" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" stroke-linecap="round" opacity="0.85"/>`;
      offset += dash;
      return svg;
    }).join('');
  }

  function afterRender() {
    // Animate counters
    document.querySelectorAll('.stat-value[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      animateCounter(el, target, prefix);
    });
  }

  function animateCounter(el, target, prefix) {
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(target * eased);
      el.textContent = prefix + current.toLocaleString() + (prefix === '' && el.dataset.count && el.closest('.stat-card.gold') ? '%' : '');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatTimeAgo(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return { render, afterRender };
})();
