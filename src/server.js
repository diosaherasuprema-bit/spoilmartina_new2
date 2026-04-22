require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('./passport');
const pool = require('./db/pool');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── WEBHOOK NEEDS RAW BODY (before json middleware) ───────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions stored in PostgreSQL
app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'martina_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── STATIC FILES ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── ROUTES ───────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/album', require('./routes/album'));

// ── PAGES ─────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/drop-rates', (req, res) => res.sendFile(path.join(__dirname, '../public/drop-rates.html')));
app.get('/album', (req, res) => res.sendFile(path.join(__dirname, '../public/album.html')));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🦂 Martina Collection running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});
