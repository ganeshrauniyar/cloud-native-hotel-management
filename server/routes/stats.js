/* Stats — server-computed dashboard/admin summary (mirrors HotelData.stats) */
const express = require('express');
const models = require('../models');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/stats  — hotel operational stats
router.get('/', async (req, res, next) => {
  try {
    const [rooms, bookings, guests, invoices] = await Promise.all([
      models.Room.find().lean(),
      models.Booking.find().lean(),
      models.Guest.find().lean(),
      models.Invoice.find().lean()
    ]);
    const today = new Date().toISOString().split('T')[0];

    const totalRooms = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;
    const reserved = rooms.filter(r => r.status === 'reserved').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

    const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const pendingPayments = invoices
      .filter(i => i.paymentStatus === 'pending')
      .reduce((s, i) => s + (i.totalAmount || 0), 0);

    res.json({
      totalRooms, occupied, available, reserved, maintenance, occupancyRate,
      todayCheckIns: bookings.filter(b => b.checkIn === today && (b.status === 'confirmed' || b.status === 'checked_in')).length,
      todayCheckOuts: bookings.filter(b => b.checkOut === today && b.status === 'checked_in').length,
      totalGuests: guests.length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b => b.status === 'checked_in' || b.status === 'confirmed').length,
      totalRevenue, pendingPayments
    });
  } catch (e) { next(e); }
});

// GET /api/stats/admin  — includes user counts (admin overview)
router.get('/admin', async (req, res, next) => {
  try {
    const [users, rooms, bookings, staff] = await Promise.all([
      User.countDocuments(),
      models.Room.countDocuments(),
      models.Booking.countDocuments(),
      models.Staff.countDocuments()
    ]);
    res.json({ users, rooms, bookings, staff });
  } catch (e) { next(e); }
});

module.exports = router;
