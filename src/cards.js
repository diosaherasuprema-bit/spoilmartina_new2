// ── CARD GENERATOR ───────────────────────────────────────────
// Generates a pack of 5 cards with correct drop rates
// Per pack: 4 random slots + 1 guaranteed rare or better

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

function randomRaritySlot() {
  // Standard slot: 70% common, 25% rare, 4% epic, 1% legendary
  const r = Math.random() * 100;
  if (r < 70) return 'common';
  if (r < 95) return 'rare';
  if (r < 99) return 'epic';
  return 'legendary';
}

function randomGuaranteedSlot() {
  // Guaranteed slot (5th card): at least rare
  // 94% rare, 5% epic, 1% legendary
  const r = Math.random() * 100;
  if (r < 94) return 'rare';
  if (r < 99) return 'epic';
  return 'legendary';
}

function pickCard(rarity) {
  const pool = CARDS[rarity];
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

function generatePack() {
  const cards = [];

  // 4 standard slots
  for (let i = 0; i < 4; i++) {
    const rarity = randomRaritySlot();
    cards.push(pickCard(rarity));
  }

  // 1 guaranteed rare or better slot
  const guaranteedRarity = randomGuaranteedSlot();
  cards.push(pickCard(guaranteedRarity));

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

module.exports = { generatePack, CARDS };
