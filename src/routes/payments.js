const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');
const { generatePack } = require('../cards');
const crypto = require('crypto');

const PACK_PRICE = parseInt(process.env.PACK_PRICE_EUR) || 1500; // cents

// ── CREATE CHECKOUT SESSION ───────────────────────────────────

router.post('/create-checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Martina Collection — Pack S01',
            description: '5 cards per pack · At least 1 Rare guaranteed 🦂',
            images: [`${process.env.APP_URL}/img/pack-cover.jpg`],
          },
          unit_amount: PACK_PRICE,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/pack-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/?cancelled=1`,
      metadata: {
        user_id: req.user ? String(req.user.id) : 'guest',
        app_session: req.sessionID,
      },
    });

    // Save pending purchase
    await pool.query(
      `INSERT INTO purchases (user_id, session_id, stripe_session_id, amount_cents, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [req.user ? req.user.id : null, req.sessionID, session.id, PACK_PRICE]
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

// ── WEBHOOK (Stripe calls this after payment) ─────────────────

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await handleSuccessfulPayment(session);
  }

  res.json({ received: true });
});

const { sendPackConfirmation } = require('../email');

async function handleSuccessfulPayment(stripeSession) {
  try {
    const userId = stripeSession.metadata.user_id !== 'guest'
      ? parseInt(stripeSession.metadata.user_id)
      : null;

    // Generate pack
    const packCards = generatePack();
    const token = crypto.randomBytes(32).toString('hex');

    // Get pack number for this user
    let packNumber = 1;
    if (userId) {
      const countRes = await pool.query(
        'UPDATE users SET packs_opened = packs_opened + 1 WHERE id = $1 RETURNING packs_opened',
        [userId]
      );
      packNumber = countRes.rows[0]?.packs_opened || 1;
    }

    // Update purchase
    await pool.query(
      `UPDATE purchases SET status='completed', pack_data=$1, stripe_payment_intent_id=$2, pack_number=$3
       WHERE stripe_session_id=$4`,
      [JSON.stringify(packCards), stripeSession.payment_intent, packNumber, stripeSession.id]
    );

    // Save cards to user album
    if (userId) {
      for (const card of packCards) {
        await pool.query(
          `INSERT INTO user_cards (user_id, card_id, rarity, card_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, card_id) DO NOTHING`,
          [userId, card.id, card.rarity, card.name]
        );
      }

      // Send confirmation email
      const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      const email = userRes.rows[0]?.email;
      if (email) {
        await sendPackConfirmation(email, packCards, packNumber);
      }
    }

    // Save guest pack token
    await pool.query(
      `INSERT INTO guest_packs (session_token, pack_data, purchase_id)
       SELECT $1, $2, id FROM purchases WHERE stripe_session_id=$3`,
      [token, JSON.stringify(packCards), stripeSession.id]
    );

    console.log(`Pack #${packNumber} generated for session ${stripeSession.id}`);
  } catch (err) {
    console.error('handleSuccessfulPayment error:', err);
  }
}

// ── SUCCESS PAGE — fetch pack ─────────────────────────────────

router.get('/pack-success', async (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../public/pack-success.html'));
});

router.get('/pack-data', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    const result = await pool.query(
      `SELECT p.pack_data, p.status, p.id
       FROM purchases p
       WHERE p.stripe_session_id = $1`,
      [session_id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Pack not found' });
    const purchase = result.rows[0];
    if (purchase.status !== 'completed') return res.status(402).json({ error: 'Payment not completed' });

    res.json({ cards: purchase.pack_data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching pack' });
  }
});

module.exports = router;
