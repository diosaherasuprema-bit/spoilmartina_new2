const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');

// ── PROTECTED IMAGE SERVING ───────────────────────────────────
// Images are only served to authenticated users who own the card

router.get('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    // Must be logged in
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify user owns this card
    const result = await pool.query(
      'SELECT id FROM user_cards WHERE user_id = $1 AND card_id = $2',
      [req.user.id, cardId]
    );

    if (!result.rows.length) {
      return res.status(403).json({ error: 'Card not in your collection' });
    }

    // Find image file
    const imgPath = path.join(__dirname, '../../public/img/cards', cardId + '.jpg');
    if (!fs.existsSync(imgPath)) {
      // Fallback to placeholder
      return res.sendFile(path.join(__dirname, '../../public/img/card-placeholder.jpg'));
    }

    // Serve with anti-download headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',           // inline not attachment
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'self'",
    });

    res.sendFile(imgPath);
  } catch (err) {
    console.error('Image serve error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

// Pack reveal images — only for users who just bought (session based)
router.get('/reveal/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { token } = req.query;

    if (!req.user && !token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const imgPath = path.join(__dirname, '../../public/img/cards', cardId + '.jpg');
    if (!fs.existsSync(imgPath)) {
      return res.sendFile(path.join(__dirname, '../../public/img/card-placeholder.jpg'));
    }

    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });

    res.sendFile(imgPath);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
