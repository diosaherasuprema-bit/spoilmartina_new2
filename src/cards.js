// ── CARD GENERATOR ───────────────────────────────────────────
// Generates a pack of 5 cards with correct drop rates

const CARDS = {
  common: Array.from({ length: 25 }, (_, i) => ({
    id: `common_${i + 1}`,
    rarity: 'common',
    name: `Card #${String(i + 1).padStart(2, '0')}`,
  })),
  rare: Array.from({ length: 15 }, (_, i) => ({
    id: `rare_${i + 1}`,
    rarity: 'rare',
    name: `Rare Card #${String(i + 1).padStart(2, '0')}`,
  })),
  epic: Array.from({ length: 5 }, (_, i) => ({
    id: `epic_${i + 1}`,
    rarity: 'epic',
    name: `Epic Card #${String(i + 1).padStart(2, '0')}`,
  })),
  legendary: Array.from({ length: 5 }, (_, i) => ({
    id: `legendary_${i + 1}`,
    rarity: 'legendary',
    name: `Legendary #${String(i + 1).padStart(2, '0')} 🦂`,
  })),
};

function randomCard(excludeRarities = []) {
  const r = Math.random();
  let rarity;
  if (r < 0.70) rarity = 'common';
  else if (r < 0.95) rarity = 'rare';
  else if (r < 0.99) rarity = 'epic';
  else rarity = 'legendary';

  if (excludeRarities.includes(rarity)) {
    // Fallback to common if excluded
    rarity = 'common';
  }

  const pool = CARDS[rarity];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generatePack() {
  const cards = [];

  // 4 random cards
  for (let i = 0; i < 4; i++) {
    cards.push(randomCard());
  }

  // 5th card — guaranteed Rare or better
  const r = Math.random();
  let guaranteed;
  if (r < 0.01) guaranteed = 'legendary';
  else if (r < 0.05) guaranteed = 'epic';
  else guaranteed = 'rare';

  const guaranteedPool = CARDS[guaranteed];
  cards.push(guaranteedPool[Math.floor(Math.random() * guaranteedPool.length)]);

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

module.exports = { generatePack, CARDS };
