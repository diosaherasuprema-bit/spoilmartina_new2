-- Martina Collection — Database Schema
-- Run this in your Railway PostgreSQL console

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  twitter_id VARCHAR(100) UNIQUE,
  twitter_username VARCHAR(100),
  twitter_display_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SESSIONS (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session(expire);

-- PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_session_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'eur',
  status VARCHAR(50) DEFAULT 'pending',
  pack_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER CARDS (album)
CREATE TABLE IF NOT EXISTS user_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  card_name VARCHAR(200),
  obtained_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- GUEST ALBUMS (for non-logged users — stored by session)
CREATE TABLE IF NOT EXISTS guest_packs (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  pack_data JSONB NOT NULL,
  purchase_id INTEGER REFERENCES purchases(id),
  opened BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
