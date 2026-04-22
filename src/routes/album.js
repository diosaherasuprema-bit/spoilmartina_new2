const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ── GET USER ALBUM ────────────────────────────────────────────

router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const result = await pool.query(
      `SELECT card_id, rarity, card_name, obtained_at
       FROM user_cards
       WHERE user_id = $1
       ORDER BY obtained_at DESC`,
      [req.user.id]
    );

    res.json({ cards: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching album' });
  }
});

// ── GET ALBUM STATS ───────────────────────────────────────────

router.get('/stats', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const cardsRes = await pool.query(
      `SELECT rarity, COUNT(*) as count FROM user_cards WHERE user_id = $1 GROUP BY rarity`,
      [req.user.id]
    );
    const userRes = await pool.query(
      `SELECT packs_opened FROM users WHERE id = $1`,
      [req.user.id]
    );

    const stats = { common: 0, rare: 0, epic: 0, legendary: 0, total: 0, packs_opened: 0 };
    cardsRes.rows.forEach(row => {
      stats[row.rarity] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });
    stats.packs_opened = userRes.rows[0]?.packs_opened || 0;

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

module.exports = router;
