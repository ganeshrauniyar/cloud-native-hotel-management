/* ═══════════════════════════════════════════════════════════════
   DATA LAYER — API-backed (Express + MongoDB)
   Drop-in replacement for the old localStorage version.
   Keeps the SAME synchronous HotelData interface so every existing
   module (rooms, bookings, guests, staff, billing, checkinout,
   dashboard) works unchanged. An in-memory cache is hydrated from
   the server at startup; mutations write through to the API.
   ═══════════════════════════════════════════════════════════════ */

const HotelData = (() => {
  // ── Resource keys map to API endpoints ──
  const KEYS = {
    ROOMS: 'rooms',
    GUESTS: 'guests',
    BOOKINGS: 'bookings',
    STAFF: 'staff',
    INVOICES: 'invoices',
    ACTIVITY: 'activity'
  };

  // ── In-memory cache (hydrated from the API before the app renders) ──
  const cache = {
    rooms: [], guests: [], bookings: [], staff: [], invoices: [], activity: []
  };

  // ── Auth token helper ──
  function token() { return localStorage.getItem('hms_token') || ''; }

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` };
  }

  // ── Low-level fetch that handles auth failures globally ──
  async function api(method, path, body) {
    const res = await fetch(`/api${path}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      // Session expired → back to login
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      window.location.href = 'login.html';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      let msg = 'Request failed';
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  // Fire-and-forget write that keeps cache authoritative and surfaces errors as toasts.
  function push(promise) {
    promise.catch(err => {
      console.error(err);
      if (window.App && App.showToast) App.showToast(err.message || 'Sync failed', 'error');
    });
    return promise;
  }

  // ── ID generator (kept identical to the original) ──
  function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`;
  }

  // ── Synchronous cache accessors (same signatures as before) ──
  function getAll(key) { return cache[key] || []; }
  function getById(key, id) { return (cache[key] || []).find(i => i.id === id) || null; }

  function add(key, item) {
    cache[key].push(item);              // optimistic local update
    push(api('POST', `/${key}`, item)); // persist
    return item;
  }

  function update(key, id, updates) {
    const arr = cache[key];
    const idx = arr.findIndex(i => i.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() };
    push(api('PATCH', `/${key}/${id}`, updates));
    return arr[idx];
  }

  function remove(key, id) {
    cache[key] = cache[key].filter(i => i.id !== id);
    push(api('DELETE', `/${key}/${id}`));
  }

  // ── Activity log ──
  function logActivity(action, details, icon = '📋') {
    const entry = { id: generateId('act_'), action, details, icon, timestamp: new Date().toISOString() };
    cache.activity.unshift(entry);
    if (cache.activity.length > 50) cache.activity.length = 50;
    push(api('POST', '/activity', entry));
  }

  // ── Static reference data (unchanged from original) ──
  const ROOM_TYPES = [
    { value: 'standard', label: 'Standard', basePrice: 2500 },
    { value: 'deluxe', label: 'Deluxe', basePrice: 4500 },
    { value: 'suite', label: 'Suite', basePrice: 8000 },
    { value: 'presidential', label: 'Presidential Suite', basePrice: 15000 },
    { value: 'family', label: 'Family Room', basePrice: 5500 },
    { value: 'single', label: 'Single', basePrice: 1800 }
  ];
  const AMENITIES = ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Sea View', 'Jacuzzi', 'King Bed', 'Twin Beds', 'Kitchenette', 'Safe', 'Iron', 'Coffee Maker', 'Bathrobe', 'Workspace'];
  const ROOM_STATUSES = ['available', 'occupied', 'reserved', 'maintenance'];
  const STAFF_ROLES = [
    { value: 'manager', label: 'Manager', color: '#d4a853' },
    { value: 'front_desk', label: 'Front Desk', color: '#14b8a6' },
    { value: 'housekeeping', label: 'Housekeeping', color: '#8b5cf6' },
    { value: 'room_service', label: 'Room Service', color: '#f97316' },
    { value: 'security', label: 'Security', color: '#ef4444' },
    { value: 'maintenance', label: 'Maintenance', color: '#6366f1' },
    { value: 'concierge', label: 'Concierge', color: '#ec4899' },
    { value: 'chef', label: 'Chef', color: '#10b981' }
  ];
  const BOOKING_STATUSES = ['confirmed', 'pending', 'checked_in', 'checked_out', 'cancelled'];

  // ── Hydrate the cache from the API (called once on boot) ──
  async function hydrate() {
    const [rooms, guests, bookings, staff, invoices, activity] = await Promise.all([
      api('GET', '/rooms'), api('GET', '/guests'), api('GET', '/bookings'),
      api('GET', '/staff'), api('GET', '/invoices'), api('GET', '/activity')
    ]);
    cache.rooms = rooms;
    cache.guests = guests;
    cache.bookings = bookings;
    cache.staff = staff;
    cache.invoices = invoices;
    cache.activity = activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // ── Public API (identical shape to the original) ──
  return {
    KEYS, ROOM_TYPES, AMENITIES, ROOM_STATUSES, STAFF_ROLES, BOOKING_STATUSES,
    generateId, getAll, getById, add, update, remove, logActivity,
    hydrate,
    // seedData is now a no-op (server owns seeding) — kept so app.js call is safe
    seedData() {},

    get rooms() { return getAll(KEYS.ROOMS); },
    get guests() { return getAll(KEYS.GUESTS); },
    get bookings() { return getAll(KEYS.BOOKINGS); },
    get staff() { return getAll(KEYS.STAFF); },
    get invoices() { return getAll(KEYS.INVOICES); },
    get activity() { return getAll(KEYS.ACTIVITY); },

    get stats() {
      const rooms = getAll(KEYS.ROOMS);
      const bookings = getAll(KEYS.BOOKINGS);
      const guests = getAll(KEYS.GUESTS);
      const invoices = getAll(KEYS.INVOICES);
      const today = new Date().toISOString().split('T')[0];

      const totalRooms = rooms.length;
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      const available = rooms.filter(r => r.status === 'available').length;
      const reserved = rooms.filter(r => r.status === 'reserved').length;
      const maintenance = rooms.filter(r => r.status === 'maintenance').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

      const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
      const pendingPayments = invoices.filter(i => i.paymentStatus === 'pending').reduce((s, i) => s + i.totalAmount, 0);

      return {
        totalRooms, occupied, available, reserved, maintenance, occupancyRate,
        todayCheckIns: bookings.filter(b => b.checkIn === today && (b.status === 'confirmed' || b.status === 'checked_in')).length,
        todayCheckOuts: bookings.filter(b => b.checkOut === today && b.status === 'checked_in').length,
        totalGuests: guests.length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'checked_in' || b.status === 'confirmed').length,
        totalRevenue, pendingPayments
      };
    },

    // Reset now re-hydrates from server (data ownership moved to backend)
    async resetAll() { await hydrate(); }
  };
})();
