/* ═══════════════════════════════════════════════════════════════
   ROOMS MODULE — Room Management CRUD
   ═══════════════════════════════════════════════════════════════ */

const RoomsModule = (() => {
  let currentFilter = 'all';
  let searchQuery = '';

  function render() {
    const rooms = getFilteredRooms();
    const stats = HotelData.stats;

    return `
      <div class="page-enter">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-search">
            <span class="search-icon">🔍</span>
            <input type="text" id="room-search" placeholder="Search by room number..." value="${searchQuery}" oninput="RoomsModule.onSearch(this.value)">
          </div>
          <div class="filter-pills">
            <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="RoomsModule.setFilter('all')">All (${stats.totalRooms})</button>
            <button class="filter-pill ${currentFilter === 'available' ? 'active' : ''}" onclick="RoomsModule.setFilter('available')">Available (${stats.available})</button>
            <button class="filter-pill ${currentFilter === 'occupied' ? 'active' : ''}" onclick="RoomsModule.setFilter('occupied')">Occupied (${stats.occupied})</button>
            <button class="filter-pill ${currentFilter === 'reserved' ? 'active' : ''}" onclick="RoomsModule.setFilter('reserved')">Reserved (${stats.reserved})</button>
            <button class="filter-pill ${currentFilter === 'maintenance' ? 'active' : ''}" onclick="RoomsModule.setFilter('maintenance')">Maintenance (${stats.maintenance})</button>
          </div>
          <button class="btn btn-primary" onclick="RoomsModule.openAddModal()">+ Add Room</button>
        </div>

        <!-- Rooms Grid -->
        <div class="rooms-grid stagger-children">
          ${rooms.map(room => renderRoomCard(room)).join('')}
          ${rooms.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🚪</div><h4>No rooms found</h4><p>Try adjusting your filters</p></div>' : ''}
        </div>
      </div>
    `;
  }

  function renderRoomCard(room) {
    const statusLabel = room.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Find current guest if occupied
    let guestInfo = '';
    if (room.status === 'occupied') {
      const booking = HotelData.bookings.find(b => b.roomId === room.id && b.status === 'checked_in');
      if (booking) guestInfo = `<strong>${booking.guestName}</strong> · ${booking.nights} nights`;
    }

    return `
      <div class="room-card status-${room.status}" onclick="RoomsModule.openEditModal('${room.id}')">
        <div class="room-card-header">
          <div>
            <div class="room-number">${room.number}</div>
            <div class="room-floor">Floor ${room.floor}</div>
          </div>
          <span class="status-badge ${room.status}">${statusLabel}</span>
        </div>
        <div class="room-card-body">
          <div class="room-type-label">${room.typeName}</div>
          <div class="room-price">₹${room.price.toLocaleString()} <span>/night</span></div>
          <div class="room-amenities">
            ${room.amenities.slice(0, 4).map(a => `<span class="room-amenity-tag">${a}</span>`).join('')}
            ${room.amenities.length > 4 ? `<span class="room-amenity-tag">+${room.amenities.length - 4}</span>` : ''}
          </div>
        </div>
        <div class="room-card-footer">
          <div class="room-guest-info">
            ${guestInfo || `Max ${room.maxGuests} guests`}
          </div>
          <div class="table-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="RoomsModule.openEditModal('${room.id}')" title="Edit">✏️</button>
            <button class="btn-icon" onclick="RoomsModule.confirmDelete('${room.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  function getFilteredRooms() {
    let rooms = HotelData.rooms;
    if (currentFilter !== 'all') {
      rooms = rooms.filter(r => r.status === currentFilter);
    }
    if (searchQuery) {
      rooms = rooms.filter(r => r.number.toString().includes(searchQuery) || r.typeName.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return rooms.sort((a, b) => a.number - b.number);
  }

  function setFilter(filter) {
    currentFilter = filter;
    App.refreshPage();
  }

  function onSearch(q) {
    searchQuery = q;
    App.refreshPage();
  }

  function openAddModal() {
    App.openModal('Add New Room', renderRoomForm(), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="RoomsModule.saveRoom()">Add Room</button>
    `);
  }

  function openEditModal(id) {
    const room = HotelData.getById(HotelData.KEYS.ROOMS, id);
    if (!room) return;
    App.openModal('Edit Room ' + room.number, renderRoomForm(room), `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="RoomsModule.saveRoom('${id}')">Save Changes</button>
    `);
  }

  function renderRoomForm(room = null) {
    const typeOptions = HotelData.ROOM_TYPES.map(t =>
      `<option value="${t.value}" ${room && room.type === t.value ? 'selected' : ''}>${t.label} (₹${t.basePrice})</option>`
    ).join('');

    const statusOptions = HotelData.ROOM_STATUSES.map(s =>
      `<option value="${s}" ${room && room.status === s ? 'selected' : ''}>${s.replace(/\b\w/g, l => l.toUpperCase())}</option>`
    ).join('');

    const amenitiesHtml = HotelData.AMENITIES.map(a => {
      const checked = room && room.amenities.includes(a);
      return `<label class="checkbox-pill ${checked ? 'selected' : ''}" onclick="this.classList.toggle('selected')">
        <input type="checkbox" value="${a}" ${checked ? 'checked' : ''}>
        ${a}
      </label>`;
    }).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label for="room-number">Room Number</label>
          <input type="number" class="form-control" id="room-number" placeholder="e.g. 201" value="${room ? room.number : ''}" ${room ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label for="room-floor">Floor</label>
          <input type="number" class="form-control" id="room-floor" placeholder="e.g. 2" value="${room ? room.floor : ''}" min="1" max="20">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="room-type">Room Type</label>
          <select class="form-control" id="room-type" onchange="RoomsModule.onTypeChange()">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label for="room-status">Status</label>
          <select class="form-control" id="room-status">${statusOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="room-price">Price per Night (₹)</label>
          <input type="number" class="form-control" id="room-price" placeholder="e.g. 4500" value="${room ? room.price : ''}">
        </div>
        <div class="form-group">
          <label for="room-max-guests">Max Guests</label>
          <input type="number" class="form-control" id="room-max-guests" placeholder="e.g. 2" value="${room ? room.maxGuests : 2}" min="1" max="8">
        </div>
      </div>
      <div class="form-group">
        <label>Amenities</label>
        <div class="checkbox-group" id="room-amenities">${amenitiesHtml}</div>
      </div>
    `;
  }

  function onTypeChange() {
    const typeVal = document.getElementById('room-type').value;
    const typeInfo = HotelData.ROOM_TYPES.find(t => t.value === typeVal);
    if (typeInfo) {
      document.getElementById('room-price').value = typeInfo.basePrice;
    }
  }

  function saveRoom(editId = null) {
    const number = parseInt(document.getElementById('room-number').value);
    const floor = parseInt(document.getElementById('room-floor').value);
    const type = document.getElementById('room-type').value;
    const status = document.getElementById('room-status').value;
    const price = parseInt(document.getElementById('room-price').value);
    const maxGuests = parseInt(document.getElementById('room-max-guests').value);
    const amenities = Array.from(document.querySelectorAll('#room-amenities input:checked')).map(cb => cb.value);
    const typeInfo = HotelData.ROOM_TYPES.find(t => t.value === type);

    if (!number || !floor || !price) {
      App.showToast('Please fill all required fields', 'error');
      return;
    }

    if (editId) {
      HotelData.update(HotelData.KEYS.ROOMS, editId, {
        floor, type, typeName: typeInfo.label, status, price, maxGuests, amenities
      });
      HotelData.logActivity('Room Updated', `Room ${number} details updated`, '✏️');
      App.showToast(`Room ${number} updated successfully`, 'success');
    } else {
      // Check duplicate
      if (HotelData.rooms.some(r => r.number === number)) {
        App.showToast(`Room ${number} already exists`, 'error');
        return;
      }
      HotelData.add(HotelData.KEYS.ROOMS, {
        id: HotelData.generateId('room_'),
        number, floor, type, typeName: typeInfo.label,
        price, status, amenities, maxGuests,
        createdAt: new Date().toISOString()
      });
      HotelData.logActivity('Room Added', `New ${typeInfo.label} room ${number} added`, '🚪');
      App.showToast(`Room ${number} added successfully`, 'success');
    }

    App.closeModal();
    App.refreshPage();
  }

  function confirmDelete(id) {
    const room = HotelData.getById(HotelData.KEYS.ROOMS, id);
    if (!room) return;

    if (room.status === 'occupied') {
      App.showToast('Cannot delete an occupied room', 'error');
      return;
    }

    App.openModal('Delete Room', `
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <h4>Delete Room ${room.number}?</h4>
        <p>This action cannot be undone. All bookings for this room will be affected.</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="RoomsModule.deleteRoom('${id}')">Delete</button>
        </div>
      </div>
    `, '');
  }

  function deleteRoom(id) {
    const room = HotelData.getById(HotelData.KEYS.ROOMS, id);
    HotelData.remove(HotelData.KEYS.ROOMS, id);
    HotelData.logActivity('Room Deleted', `Room ${room?.number} removed from system`, '🗑️');
    App.showToast(`Room ${room?.number} deleted`, 'success');
    App.closeModal();
    App.refreshPage();
  }

  return { render, setFilter, onSearch, openAddModal, openEditModal, onTypeChange, saveRoom, confirmDelete, deleteRoom };
})();
