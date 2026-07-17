/* ═══════════════════════════════════════════════════════════════
   SEED SCRIPT — populates MongoDB with a default admin + demo data.
   Demo data logic is ported from the frontend's data.js seed.
   Run:  npm run seed
   ═══════════════════════════════════════════════════════════════ */
require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const models = require('./models');

function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard', basePrice: 2500 },
  { value: 'deluxe', label: 'Deluxe', basePrice: 4500 },
  { value: 'suite', label: 'Suite', basePrice: 8000 },
  { value: 'presidential', label: 'Presidential Suite', basePrice: 15000 },
  { value: 'family', label: 'Family Room', basePrice: 5500 },
  { value: 'single', label: 'Single', basePrice: 1800 }
];
const AMENITIES = ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Sea View', 'Jacuzzi', 'King Bed', 'Twin Beds', 'Kitchenette', 'Safe', 'Iron', 'Coffee Maker', 'Bathrobe', 'Workspace'];
const STAFF_ROLES = [
  { value: 'manager', label: 'Manager' }, { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' }, { value: 'room_service', label: 'Room Service' },
  { value: 'security', label: 'Security' }, { value: 'maintenance', label: 'Maintenance' },
  { value: 'concierge', label: 'Concierge' }, { value: 'chef', label: 'Chef' }
];

function buildDemo() {
  // ── Rooms ──
  const rooms = [];
  const floors = [1, 2, 3, 4, 5];
  const types = ['standard', 'standard', 'deluxe', 'deluxe', 'suite', 'family', 'single', 'presidential'];
  floors.forEach(floor => {
    for (let i = 1; i <= 6; i++) {
      const roomNum = floor * 100 + i;
      const type = types[(floor + i) % types.length];
      const typeInfo = ROOM_TYPES.find(t => t.value === type);
      const amenityCount = type === 'presidential' ? 10 : type === 'suite' ? 8 : type === 'deluxe' ? 6 : 4;
      const shuffled = [...AMENITIES].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, amenityCount);
      if (!selected.includes('WiFi')) selected[0] = 'WiFi';
      if (!selected.includes('AC')) selected[1] = 'AC';
      const statuses = ['available', 'available', 'available', 'occupied', 'reserved', 'maintenance'];
      rooms.push({
        id: generateId('room_'), number: roomNum, floor, type, typeName: typeInfo.label,
        price: typeInfo.basePrice + floor * 200,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        amenities: selected,
        maxGuests: type === 'family' ? 4 : (type === 'suite' || type === 'presidential') ? 3 : 2,
        createdAt: new Date().toISOString()
      });
    }
  });

  // ── Guests ──
  const guestNames = [
    { first: 'Arjun', last: 'Sharma', email: 'arjun.sharma@email.com', phone: '+91 98765 43210', nationality: 'Indian', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-4521' },
    { first: 'Priya', last: 'Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', nationality: 'Indian', idType: 'Passport', idNumber: 'K4829156' },
    { first: 'James', last: 'Wilson', email: 'james.wilson@email.com', phone: '+1 555 012 3456', nationality: 'American', idType: 'Passport', idNumber: 'US9283746' },
    { first: 'Ananya', last: 'Reddy', email: 'ananya.r@email.com', phone: '+91 76543 21098', nationality: 'Indian', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-7832' },
    { first: 'Hiroshi', last: 'Tanaka', email: 'h.tanaka@email.com', phone: '+81 90 1234 5678', nationality: 'Japanese', idType: 'Passport', idNumber: 'JP1827364' },
    { first: 'Sofia', last: 'Martinez', email: 'sofia.m@email.com', phone: '+34 612 345 678', nationality: 'Spanish', idType: 'Passport', idNumber: 'ES4738291' },
    { first: 'Rahul', last: 'Gupta', email: 'rahul.gupta@email.com', phone: '+91 99887 76655', nationality: 'Indian', idType: 'Driving License', idNumber: 'DL-0420211234567' },
    { first: 'Emily', last: 'Chen', email: 'emily.chen@email.com', phone: '+86 138 0013 8000', nationality: 'Chinese', idType: 'Passport', idNumber: 'CN8273645' },
    { first: 'Vikram', last: 'Singh', email: 'vikram.singh@email.com', phone: '+91 88776 65544', nationality: 'Indian', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-9012' },
    { first: 'Fatima', last: 'Al-Rashid', email: 'fatima.ar@email.com', phone: '+971 50 123 4567', nationality: 'Emirati', idType: 'Passport', idNumber: 'AE6354728' }
  ];
  const guests = guestNames.map(g => ({
    id: generateId('guest_'), firstName: g.first, lastName: g.last, fullName: `${g.first} ${g.last}`,
    email: g.email, phone: g.phone, nationality: g.nationality, idType: g.idType, idNumber: g.idNumber,
    totalStays: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date(Date.now() - Math.random() * 90 * 864e5).toISOString()
  }));

  // ── Bookings ──
  const today = new Date();
  const bookings = [];
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const reservedRooms = rooms.filter(r => r.status === 'reserved');

  occupiedRooms.forEach((room, i) => {
    const guest = guests[i % guests.length];
    const checkIn = new Date(today); checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 3));
    const checkOut = new Date(checkIn); checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 4) + 2);
    const nights = Math.ceil((checkOut - checkIn) / 864e5);
    bookings.push({
      id: generateId('book_'), guestId: guest.id, guestName: guest.fullName, roomId: room.id,
      roomNumber: room.number, roomType: room.typeName,
      checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0],
      nights, ratePerNight: room.price, totalAmount: nights * room.price, status: 'checked_in',
      adults: Math.floor(Math.random() * 2) + 1, children: Math.floor(Math.random() * 2), specialRequests: '',
      createdAt: new Date(checkIn.getTime() - 2 * 864e5).toISOString()
    });
  });
  reservedRooms.forEach((room, i) => {
    const guest = guests[(i + occupiedRooms.length) % guests.length];
    const checkIn = new Date(today); checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 5) + 1);
    const checkOut = new Date(checkIn); checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 1);
    const nights = Math.ceil((checkOut - checkIn) / 864e5);
    bookings.push({
      id: generateId('book_'), guestId: guest.id, guestName: guest.fullName, roomId: room.id,
      roomNumber: room.number, roomType: room.typeName,
      checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0],
      nights, ratePerNight: room.price, totalAmount: nights * room.price, status: 'confirmed',
      adults: Math.floor(Math.random() * 2) + 1, children: 0, specialRequests: '',
      createdAt: new Date().toISOString()
    });
  });
  for (let i = 0; i < 3; i++) {
    const guest = guests[(i + 5) % guests.length];
    const avRoom = rooms.filter(r => r.status === 'available')[i];
    if (!avRoom) continue;
    const checkIn = new Date(today); checkIn.setDate(checkIn.getDate() - 10 - i * 3);
    const checkOut = new Date(checkIn); checkOut.setDate(checkOut.getDate() + 2);
    bookings.push({
      id: generateId('book_'), guestId: guest.id, guestName: guest.fullName, roomId: avRoom.id,
      roomNumber: avRoom.number, roomType: avRoom.typeName,
      checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0],
      nights: 2, ratePerNight: avRoom.price, totalAmount: 2 * avRoom.price, status: 'checked_out',
      adults: 1, children: 0, specialRequests: '',
      createdAt: new Date(checkIn.getTime() - 5 * 864e5).toISOString()
    });
  }

  // ── Staff ──
  const staffMembers = [
    { firstName: 'Rajesh', lastName: 'Kumar', role: 'manager', email: 'rajesh.k@grandhotel.com', phone: '+91 98765 00001', shift: 'Day (8AM–4PM)' },
    { firstName: 'Meera', lastName: 'Nair', role: 'front_desk', email: 'meera.n@grandhotel.com', phone: '+91 98765 00002', shift: 'Day (8AM–4PM)' },
    { firstName: 'Suresh', lastName: 'Yadav', role: 'front_desk', email: 'suresh.y@grandhotel.com', phone: '+91 98765 00003', shift: 'Night (10PM–6AM)' },
    { firstName: 'Lakshmi', lastName: 'Devi', role: 'housekeeping', email: 'lakshmi.d@grandhotel.com', phone: '+91 98765 00004', shift: 'Day (8AM–4PM)' },
    { firstName: 'Arun', lastName: 'Pillai', role: 'chef', email: 'arun.p@grandhotel.com', phone: '+91 98765 00005', shift: 'Split (6AM–2PM, 5PM–10PM)' },
    { firstName: 'Deepa', lastName: 'Menon', role: 'concierge', email: 'deepa.m@grandhotel.com', phone: '+91 98765 00006', shift: 'Day (9AM–5PM)' },
    { firstName: 'Ravi', lastName: 'Tiwari', role: 'security', email: 'ravi.t@grandhotel.com', phone: '+91 98765 00007', shift: 'Night (10PM–6AM)' },
    { firstName: 'Pooja', lastName: 'Shah', role: 'room_service', email: 'pooja.s@grandhotel.com', phone: '+91 98765 00008', shift: 'Evening (2PM–10PM)' },
    { firstName: 'Karthik', lastName: 'Iyer', role: 'maintenance', email: 'karthik.i@grandhotel.com', phone: '+91 98765 00009', shift: 'Day (8AM–4PM)' }
  ];
  const staff = staffMembers.map(s => ({
    id: generateId('staff_'), firstName: s.firstName, lastName: s.lastName, fullName: `${s.firstName} ${s.lastName}`,
    role: s.role, roleName: STAFF_ROLES.find(r => r.value === s.role)?.label || s.role,
    email: s.email, phone: s.phone, shift: s.shift, status: 'active',
    joinDate: new Date(Date.now() - Math.random() * 365 * 864e5).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }));

  // ── Invoices ──
  const invoices = bookings.filter(b => b.status === 'checked_out').map(b => {
    const extras = [
      { desc: 'Room Service', amount: Math.floor(Math.random() * 2000) + 500 },
      { desc: 'Laundry', amount: Math.floor(Math.random() * 500) + 200 }
    ];
    const extrasTotal = extras.reduce((s, e) => s + e.amount, 0);
    return {
      id: generateId('inv_'), bookingId: b.id, guestName: b.guestName, roomNumber: b.roomNumber,
      roomCharges: b.totalAmount, extras, totalAmount: b.totalAmount + extrasTotal,
      paymentStatus: 'paid', paymentMethod: 'Card', createdAt: b.checkOut + 'T12:00:00.000Z'
    };
  });

  // ── Activity ──
  const activityDefs = [
    { action: 'Guest Checked In', details: 'Arjun Sharma checked into Room 201', icon: '🟢' },
    { action: 'Booking Created', details: 'New booking for Priya Patel — Suite 403', icon: '📝' },
    { action: 'Invoice Generated', details: 'Invoice #INV-001 for Room 102 — ₹12,400', icon: '🧾' },
    { action: 'Room Maintenance', details: 'Room 305 marked for maintenance', icon: '🔧' },
    { action: 'Guest Checked Out', details: 'Sofia Martinez checked out of Room 504', icon: '🔴' },
    { action: 'Staff Added', details: 'New housekeeping staff member added', icon: '👤' },
    { action: 'Booking Cancelled', details: 'Booking for Hiroshi Tanaka cancelled', icon: '❌' },
    { action: 'Payment Received', details: 'Payment of ₹8,500 received for Room 302', icon: '💰' }
  ];
  const activity = activityDefs.map((a, i) => ({
    id: generateId('act_'), ...a, timestamp: new Date(Date.now() - i * 45 * 60000).toISOString()
  }));

  return { rooms, guests, bookings, staff, invoices, activity };
}

async function run() {
  await connectDB();

  // ── Default admin ──
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@grandhorizon.com').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: adminName, email: adminEmail, password: adminPass, role: 'admin' });
    console.log(`✅ Admin created → ${adminEmail} / ${adminPass}`);
  } else {
    console.log(`ℹ️  Admin already exists → ${adminEmail}`);
  }

  // ── Demo data (only if empty) ──
  const existing = await models.Room.countDocuments();
  if (existing > 0) {
    console.log('ℹ️  Demo data already present — skipping. (Use --force to reset.)');
  } else {
    const data = buildDemo();
    await models.Room.insertMany(data.rooms);
    await models.Guest.insertMany(data.guests);
    await models.Booking.insertMany(data.bookings);
    await models.Staff.insertMany(data.staff);
    await models.Invoice.insertMany(data.invoices);
    await models.Activity.insertMany(data.activity);
    console.log(`✅ Demo data seeded: ${data.rooms.length} rooms, ${data.guests.length} guests, ${data.bookings.length} bookings, ${data.staff.length} staff, ${data.invoices.length} invoices.`);
  }

  await mongoose.connection.close();
  console.log('🌙 Seed complete.');
  process.exit(0);
}

// Support `node server/seed.js --force` to wipe & reseed domain data
if (process.argv.includes('--force')) {
  (async () => {
    await connectDB();
    await Promise.all([
      models.Room.deleteMany({}), models.Guest.deleteMany({}), models.Booking.deleteMany({}),
      models.Staff.deleteMany({}), models.Invoice.deleteMany({}), models.Activity.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing domain data.');
    await mongoose.connection.close();
    await run();
  })();
} else {
  run();
}
