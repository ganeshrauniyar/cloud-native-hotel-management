/* ═══════════════════════════════════════════════════════════════
   GENERIC CRUD ROUTES for the six domain collections.
   Keyed on the frontend's string `id` field (not Mongo _id).
   Mounted at /api → /api/rooms, /api/guests, /api/bookings,
   /api/staff, /api/invoices, /api/activity
   All routes require authentication.
   ═══════════════════════════════════════════════════════════════ */
const express = require('express');
const models = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Map URL segment → Mongoose model
const RESOURCES = {
  rooms: models.Room,
  guests: models.Guest,
  bookings: models.Booking,
  staff: models.Staff,
  invoices: models.Invoice,
  activity: models.Activity
};

router.use(protect);

// Resolve :resource → model, or 404
router.param('resource', (req, res, next, resource) => {
  const model = RESOURCES[resource];
  if (!model) return res.status(404).json({ error: `Unknown resource: ${resource}` });
  req.Model = model;
  next();
});

// GET /api/:resource  — list all
router.get('/:resource', async (req, res, next) => {
  try {
    const docs = await req.Model.find().sort({ createdAt: -1 });
    res.json(docs.map(d => d.toJSON()));
  } catch (e) { next(e); }
});

// GET /api/:resource/:id
router.get('/:resource/:id', async (req, res, next) => {
  try {
    const doc = await req.Model.findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.toJSON());
  } catch (e) { next(e); }
});

// POST /api/:resource  — create (frontend supplies its own `id`)
router.post('/:resource', async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.id) return res.status(400).json({ error: 'Missing id' });
    const doc = await req.Model.create(payload);
    res.status(201).json(doc.toJSON());
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Duplicate id' });
    next(e);
  }
});

// PUT/PATCH /api/:resource/:id  — update by string id
async function updateHandler(req, res, next) {
  try {
    const updates = { ...req.body };
    delete updates.id; // never change the id
    const doc = await req.Model.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.toJSON());
  } catch (e) { next(e); }
}
router.put('/:resource/:id', updateHandler);
router.patch('/:resource/:id', updateHandler);

// DELETE /api/:resource/:id
router.delete('/:resource/:id', async (req, res, next) => {
  try {
    const doc = await req.Model.findOneAndDelete({ id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
