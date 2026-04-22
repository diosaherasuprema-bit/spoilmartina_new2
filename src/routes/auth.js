const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

// ── TWITTER OAUTH ─────────────────────────────────────────────

router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/?error=twitter' }),
  (req, res) => {
    res.redirect('/?logged=1');
  }
);

// ── EMAIL REGISTER ─────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    req.login(result.rows[0], (err) => {
      if (err) return res.status(500).json({ error: 'Error de sesión' });
      res.json({ ok: true, user: { id: result.rows[0].id, email: result.rows[0].email } });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── EMAIL LOGIN ───────────────────────────────────────────────

router.post('/login', passport.authenticate('local', {
  failureMessage: true,
}), (req, res) => {
  res.json({ ok: true, user: { id: req.user.id, email: req.user.email, twitter: req.user.twitter_username } });
});

// ── LOGOUT ───────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// ── CURRENT USER ─────────────────────────────────────────────

router.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      twitter: req.user.twitter_username,
      displayName: req.user.twitter_display_name || req.user.email,
    }
  });
});

module.exports = router;
