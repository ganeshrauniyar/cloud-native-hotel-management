/* ═══════════════════════════════════════════════════════════════
   GRAND HORIZON HMS — Express Server
   Serves the frontend (this folder) + REST API (/api)
   ═══════════════════════════════════════════════════════════════ */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const crudRoutes = require('./routes/crud');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', crudRoutes); // /api/rooms, /guests, /bookings, /staff, /invoices, /activity

// ── Block access to backend/config paths ──
const BLOCKED = [/^\/server(\/|$)/, /^\/node_modules(\/|$)/, /^\/package(-lock)?\.json$/, /^\/Dockerfile$/, /^\/docker-compose/];
app.use((req, res, next) => {
  if (BLOCKED.some(re => re.test(req.path))) return res.status(404).send('Not found');
  next();
});

// ── Static Frontend (this "hotel mangement" folder) ──
// dotfiles:'ignore' keeps .env / .gitignore unreachable.
const siteDir = path.join(__dirname, '..');
app.use(express.static(siteDir, { dotfiles: 'ignore', index: false }));

// Root → login page
app.get('/', (req, res) => res.sendFile(path.join(siteDir, 'login.html')));

// Non-API GET fallback → dashboard shell (auth enforced client-side + on the API)
app.get(/^\/(?!api).*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(siteDir, 'index.html'));
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// ── Boot ──
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🏨 Grand Horizon HMS → http://localhost:${PORT}`));
});
