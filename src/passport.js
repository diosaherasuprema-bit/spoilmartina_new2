const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('./db/pool');

// ── SERIALIZE / DESERIALIZE ───────────────────────────────────

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

// ── TWITTER STRATEGY ──────────────────────────────────────────

if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_KEY !== 'TU_TWITTER_CONSUMER_KEY') {
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL,
  }, async (token, tokenSecret, profile, done) => {
    try {
      // Check if user exists
      let result = await pool.query('SELECT * FROM users WHERE twitter_id = $1', [profile.id]);

      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }

      // Create new user
      result = await pool.query(
        `INSERT INTO users (twitter_id, twitter_username, twitter_display_name)
         VALUES ($1, $2, $3) RETURNING *`,
        [profile.id, profile.username, profile.displayName]
      );

      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  }));
}

// ── LOCAL STRATEGY (email + password) ────────────────────────

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (!result.rows.length) return done(null, false, { message: 'Email no encontrado' });

      const user = result.rows[0];
      if (!user.password_hash) return done(null, false, { message: 'Usa login con Twitter' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return done(null, false, { message: 'Contraseña incorrecta' });

      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

module.exports = passport;
