require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('./src/passport');
const pool = require('./src/db/pool');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'martina_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', require('./src/routes/auth'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/album', require('./src/routes/album'));
app.use('/api/image', require('./src/routes/images'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/drop-rates', (req, res) => res.sendFile(path.join(__dirname, 'public/drop-rates.html')));
app.get('/pack-success', (req, res) => res.sendFile(path.join(__dirname, 'public/pack-success.html')));
app.get('/album', (req, res) => res.sendFile(path.join(__dirname, 'public/album.html')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🦂 Martina Collection running on port ${PORT}`);
});
