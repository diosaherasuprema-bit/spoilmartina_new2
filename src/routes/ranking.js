const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ── TOP COLLECTORS ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.twitter_username,
        u.twitter_display_name,
        u.email,
        u.packs_opened,
        COUNT(uc.id) as total_cards,
        SUM(CASE WHEN uc.rarity = 'legendary' THEN 1 ELSE 0 END) as legendaries,
        SUM(CASE WHEN uc.rarity = 'epic' THEN 1 ELSE 0 END) as epics,
        SUM(CASE WHEN uc.rarity = 'rare' THEN 1 ELSE 0 END) as rares
      FROM users u
      LEFT JOIN user_cards uc ON u.id = uc.user_id
      GROUP BY u.id
      HAVING COUNT(uc.id) > 0
      ORDER BY legendaries DESC, epics DESC, total_cards DESC
      LIMIT 20
    `);

    const collectors = result.rows.map((r, i) => ({
      rank: i + 1,
      name: r.twitter_display_name || r.twitter_username || maskEmail(r.email),
      packs_opened: r.packs_opened || 0,
      total_cards: parseInt(r.total_cards),
      legendaries: parseInt(r.legendaries) || 0,
      epics: parseInt(r.epics) || 0,
      rares: parseInt(r.rares) || 0,
    }));

    res.json({ collectors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching ranking' });
  }
});

function maskEmail(email) {
  if (!email) return 'Anonymous';
  const [user, domain] = email.split('@');
  return user.slice(0, 2) + '***@' + domain;
}

module.exports = router;
