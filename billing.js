/* ═══════════════════════════════════════════════════════════════
   BILLING MODULE — Invoices & Payments
   ═══════════════════════════════════════════════════════════════ */

const BillingModule = (() => {
  let filterStatus = 'all';

  function render() {
    const invoices = getFilteredInvoices();
    const allInvoices = HotelData.invoices;
    const totalRevenue = allInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const paidAmount = allInvoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.totalAmount, 0);
    const pendingAmount = allInvoices.filter(i => i.paymentStatus === 'pending').reduce((s, i) => s + i.totalAmount, 0);

    return `
      <div class="page-enter">
        <!-- Stats -->
        <div class="stats-grid stagger-children" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card gold">
            <div class="stat-header"><div class="stat-icon">💰</div><span class="stat-label">Total Revenue</span></div>
            <div class="stat-value">₹${totalRevenue.toLocaleString()}</div>
            <div class="stat-sub">${allInvoices.length} invoices generated</div>
          </div>
          <div class="stat-card green">
            <div class="stat-header"><div class="stat-icon">✅</div><span class="stat-label">Collected</span></div>
            <div class="stat-value">₹${paidAmount.toLocaleString()}</div>
          </div>
          <div class="stat-card red">
            <div class="stat-header"><div class="stat-icon">⏳</div><span class="stat-label">Pending</span></div>
            <div class="stat-value">₹${pendingAmount.toLocaleString()}</div>
          </div>
        </div>

        <!-- Filter -->
        <div class="filter-bar">
          <div class="filter-pills">
            <button class="filter-pill ${filterStatus === 'all' ? 'active' : ''}" onclick="BillingModule.setFilter('all')">All</button>
            <button class="filter-pill ${filterStatus === 'paid' ? 'active' : ''}" onclick="BillingModule.setFilter('paid')">Paid</button>
            <button class="filter-pill ${filterStatus === 'pending' ? 'active' : ''}" onclick="BillingModule.setFilter('pending')">Pending</button>
          </div>
        </div>

        <!-- Invoices Table -->
        <div class="glass-card" style="padding:0;overflow:hidden;">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Room Charges</th>
                  <th>Extras</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map(inv => {
                  const extrasTotal = inv.extras.reduce((s, e) => s + e.amount, 0);
                  return `
                    <tr>
                      <td><span class="text-gold font-semibold">${inv.id.substring(0, 12).toUpperCase()}</span></td>
                      <td><strong>${inv.guestName}</strong></td>
                      <td>${inv.roomNumber}</td>
                      <td>₹${inv.roomCharges.toLocaleString()}</td>
                      <td>₹${extrasTotal.toLocaleString()}</td>
                      <td><strong>₹${inv.totalAmount.toLocaleString()}</strong></td>
                      <td><span class="status-badge ${inv.paymentStatus}">${inv.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span></td>
                      <td>
                        <div class="table-actions">
                          <button class="btn-icon" onclick="BillingModule.viewInvoice('${inv.id}')" title="View">👁️</button>
                          ${inv.paymentStatus === 'pending' ? `
                            <button class="btn-icon" onclick="BillingModule.addExtras('${inv.id}')" title="Add Charges">➕</button>
                            <button class="btn-icon" onclick="BillingModule.markPaid('${inv.id}')" title="Mark Paid">💳</button>
                          ` : ''}
                          <button class="btn-icon" onclick="BillingModule.printInvoice('${inv.id}')" title="Print">🖨️</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${invoices.length === 0 ? `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🧾</div><h4>No invoices found</h4></div></td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function getFilteredInvoices() {
    let invoices = HotelData.invoices;
    if (filterStatus !== 'all') {
      invoices = invoices.filter(i => i.paymentStatus === filterStatus);
    }
    return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function setFilter(s) { filterStatus = s; App.refreshPage(); }

  function viewInvoice(id) {
    const inv = HotelData.getById(HotelData.KEYS.INVOICES, id);
    if (!inv) return;
    const booking = HotelData.getById(HotelData.KEYS.BOOKINGS, inv.bookingId);
    const extrasTotal = inv.extras.reduce((s, e) => s + e.amount, 0);

    App.openModal('Invoice', `
      <div class="invoice-preview" id="invoice-print-area">
        <div class="d-flex justify-between align-center">
          <div>
            <div class="invoice-hotel-name">Grand Horizon</div>
            <div class="text-sm text-secondary">Premium Hotel & Resort</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-muted">Invoice</div>
            <div class="font-bold">#${inv.id.substring(0, 12).toUpperCase()}</div>
            <div class="text-xs text-muted">${new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="invoice-divider"></div>

        <div class="invoice-details-grid">
          <div>
            <div class="detail-label">Guest</div>
            <div class="detail-value">${inv.guestName}</div>
          </div>
          <div>
            <div class="detail-label">Room</div>
            <div class="detail-value">${inv.roomNumber}${booking ? ' (' + booking.roomType + ')' : ''}</div>
          </div>
          <div>
            <div class="detail-label">Check-In</div>
            <div class="detail-value">${booking ? formatDate(booking.checkIn) : '—'}</div>
          </div>
          <div>
            <div class="detail-label">Check-Out</div>
            <div class="detail-value">${booking ? formatDate(booking.checkOut) : '—'}</div>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr><th>Description</th><th class="text-right">Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Charges${booking ? ` (${booking.nights} nights × ₹${booking.ratePerNight.toLocaleString()})` : ''}</td>
              <td class="text-right">₹${inv.roomCharges.toLocaleString()}</td>
            </tr>
            ${inv.extras.map(e => `
              <tr>
                <td>${e.desc}</td>
                <td class="text-right">₹${e.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Grand Total</td>
              <td class="text-right">₹${inv.totalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="d-flex justify-between align-center mt-3">
          <span class="text-sm text-secondary">Payment Status</span>
          <span class="status-badge ${inv.paymentStatus}" style="font-size:0.82rem;">${inv.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}</span>
        </div>
        ${inv.paymentMethod ? `<div class="text-xs text-muted mt-2">Payment Method: ${inv.paymentMethod}</div>` : ''}
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="BillingModule.printInvoice('${inv.id}')">🖨️ Print</button>
    `);
  }

  function addExtras(id) {
    App.openModal('Add Extra Charges', `
      <div class="form-group">
        <label for="extra-desc">Description</label>
        <select class="form-control" id="extra-desc">
          <option value="Room Service">Room Service</option>
          <option value="Minibar">Minibar</option>
          <option value="Laundry">Laundry</option>
          <option value="Spa">Spa</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Damage Charges">Damage Charges</option>
          <option value="Late Checkout">Late Checkout</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label for="extra-amount">Amount (₹)</label>
        <input type="number" class="form-control" id="extra-amount" placeholder="e.g. 1500" min="1">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="BillingModule.saveExtra('${id}')">Add Charge</button>
    `);
  }

  function saveExtra(id) {
    const desc = document.getElementById('extra-desc').value;
    const amount = parseInt(document.getElementById('extra-amount').value);
    if (!amount || amount <= 0) {
      App.showToast('Please enter a valid amount', 'error');
      return;
    }

    const inv = HotelData.getById(HotelData.KEYS.INVOICES, id);
    if (!inv) return;

    const updatedExtras = [...inv.extras, { desc, amount }];
    const newTotal = inv.roomCharges + updatedExtras.reduce((s, e) => s + e.amount, 0);

    HotelData.update(HotelData.KEYS.INVOICES, id, {
      extras: updatedExtras,
      totalAmount: newTotal
    });

    HotelData.logActivity('Charge Added', `₹${amount.toLocaleString()} (${desc}) added to invoice for ${inv.guestName}`, '💰');
    App.showToast(`₹${amount.toLocaleString()} added to invoice`, 'success');
    App.closeModal();
    App.refreshPage();
  }

  function markPaid(id) {
    App.openModal('Confirm Payment', `
      <div class="form-group">
        <label for="pay-method">Payment Method</label>
        <select class="form-control" id="pay-method">
          <option value="Card">Credit/Debit Card</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Other">Other</option>
        </select>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="BillingModule.confirmPayment('${id}')">Confirm Payment</button>
    `);
  }

  function confirmPayment(id) {
    const method = document.getElementById('pay-method').value;
    const inv = HotelData.getById(HotelData.KEYS.INVOICES, id);

    HotelData.update(HotelData.KEYS.INVOICES, id, {
      paymentStatus: 'paid',
      paymentMethod: method
    });

    HotelData.logActivity('Payment Received', `₹${inv?.totalAmount.toLocaleString()} received from ${inv?.guestName} via ${method}`, '💰');
    App.showToast('Payment recorded successfully', 'success');
    App.closeModal();
    App.refreshPage();
  }

  function printInvoice(id) {
    const inv = HotelData.getById(HotelData.KEYS.INVOICES, id);
    if (!inv) return;
    const booking = HotelData.getById(HotelData.KEYS.BOOKINGS, inv.bookingId);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice — Grand Horizon</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 28px; color: #b8892f; margin: 0; }
          .subtitle { color: #666; font-size: 14px; }
          .divider { height: 1px; background: #ddd; margin: 20px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .label { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 0.5px; }
          .value { font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
          td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
          .total td { font-weight: 700; font-size: 16px; color: #b8892f; border: none; padding-top: 15px; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Grand Horizon</h1>
        <div class="subtitle">Premium Hotel & Resort · Invoice</div>
        <div class="divider"></div>
        <div class="grid">
          <div><div class="label">Invoice #</div><div class="value">${inv.id.substring(0, 12).toUpperCase()}</div></div>
          <div><div class="label">Date</div><div class="value">${new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
          <div><div class="label">Guest</div><div class="value">${inv.guestName}</div></div>
          <div><div class="label">Room</div><div class="value">${inv.roomNumber}</div></div>
        </div>
        <table>
          <thead><tr><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            <tr><td>Room Charges${booking ? ` (${booking.nights} nights)` : ''}</td><td class="text-right">₹${inv.roomCharges.toLocaleString()}</td></tr>
            ${inv.extras.map(e => `<tr><td>${e.desc}</td><td class="text-right">₹${e.amount.toLocaleString()}</td></tr>`).join('')}
            <tr class="total"><td>Grand Total</td><td class="text-right">₹${inv.totalAmount.toLocaleString()}</td></tr>
          </tbody>
        </table>
        <div>Payment Status: <strong>${inv.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</strong>${inv.paymentMethod ? ` · ${inv.paymentMethod}` : ''}</div>
        <div class="footer">Thank you for staying with Grand Horizon · We look forward to welcoming you again</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return { render, setFilter, viewInvoice, addExtras, saveExtra, markPaid, confirmPayment, printInvoice };
})();
