/* User management — admin only (list, create, update role/active, delete, reset password) */
const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require an authenticated admin
router.use(protect, authorize('admin'));

// GET /api/users
router.get('/', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(u => u.toJSON()));
});

// POST /api/users  — create a new account
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'A user with that email already exists' });

  const user = await User.create({ name, email, password, role: role || 'staff' });
  res.status(201).json(user.toJSON());
});

// PATCH /api/users/:id  — update name/role/active
router.patch('/:id', async (req, res) => {
  const { name, role, active } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (active !== undefined) update.active = active;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.toJSON());
});

// PATCH /api/users/:id/password  — admin reset
router.patch('/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = newPassword;
  await user.save();
  res.json({ ok: true });
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ error: 'You cannot delete your own account' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

module.exports = router;
