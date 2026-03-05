/**
 * Faction system — Vaelrath lore.
 * Factions represent the power blocs and institutions that survived the Sundering.
 * Reputation ripple: gaining/losing rep with one faction cascades to allies and enemies.
 */

// ─── FACTIONS ─────────────────────────────────────────────────────────────────
export const FACTIONS = {
  accord_wardens: {
    id: "accord_wardens",
    name: "Accord Wardens",
    emoji: "🛡️",
    description: "Keepers of the post-Sundering peace charter. They hold High Bastion and enforce the Accord's writ of protection across the safe roads.",
    color: "text-blue-400",
    zone: "high_bastion",
    allies: ["ironmark_guild", "archive_seekers"],
    enemies: ["ironbound_compact", "grey_conclave"],
  },
  ironmark_guild: {
    id: "ironmark_guild",
    name: "Ironmark Guild",
    emoji: "⚒️",
    description: "Smiths, merchants, and craftworkers who rebuilt Vaelrath's trade networks after the Sundering. Their seal appears on every Accord-standard coin.",
    color: "text-yellow-500",
    zone: "high_bastion",
    allies: ["accord_wardens", "archive_seekers"],
    enemies: ["ironbound_compact"],
  },
  verdant_remnant: {
    id: "verdant_remnant",
    name: "Verdant Remnant",
    emoji: "🌿",
    description: "Keepers of the old wildways. They do not oppose the Accord, but they do not bow to it either. The Thornwild is theirs by right older than any charter.",
    color: "text-green-400",
    zone: "the_thornwild",
    allies: [],
    enemies: ["grey_conclave", "ironbound_compact"],
  },
  ironbound_compact: {
    id: "ironbound_compact",
    name: "Ironbound Compact",
    emoji: "⛏️",
    description: "Clans of the Kharum Deep who swear by iron and blood over parchment and promise. Brutal pragmatists who sell ore to anyone with coin — and loyalty to no one.",
    color: "text-gray-400",
    zone: "kharum_deep",
    allies: [],
    enemies: ["accord_wardens", "ironmark_guild", "verdant_remnant"],
  },
  grey_conclave: {
    id: "grey_conclave",
    name: "Grey Conclave",
    emoji: "💀",
    description: "Scholars of the Unquiet — those who study and, some say, cultivate the undead of the Greyfen Reach. Their motives are debated in every Bastion tavern.",
    color: "text-purple-400",
    zone: "greyfen_reach",
    allies: [],
    enemies: ["accord_wardens", "verdant_remnant"],
  },
  archive_seekers: {
    id: "archive_seekers",
    name: "Archive Seekers",
    emoji: "📜",
    description: "Scholars, ruin-divers, and lore-keepers obsessed with recovering dominion-era knowledge from the Sunken Crown. They trade information freely — for the right price.",
    color: "text-cyan-400",
    zone: "the_sunken_crown",
    allies: ["accord_wardens", "ironmark_guild"],
    enemies: [],
  },
};

// ─── ALL_FACTIONS LOOKUP ──────────────────────────────────────────────────────
// Combined lookup including future institutions
export const ALL_FACTIONS = { ...FACTIONS };

// ─── REPUTATION SYSTEM ───────────────────────────────────────────────────────
// -100 to +100 standing per faction
// < -50: Hostile  — can't trade, attacked on sight
// -50 to 0: Disliked — higher prices, limited quests
// 0 to 50: Neutral/Liked — standard interactions
// > 50: Honored — discounts, unique quests, faction titles

export const STANDING_THRESHOLDS = {
  hostile:  { max: -50,  label: "Hostile",  color: "text-red-600" },
  disliked: { max: 0,    label: "Disliked", color: "text-orange-500" },
  neutral:  { max: 25,   label: "Neutral",  color: "text-gray-400" },
  liked:    { max: 50,   label: "Liked",    color: "text-green-400" },
  honored:  { max: 100,  label: "Honored",  color: "text-amber-400" },
};

export function getFactionColor(standing) {
  if (standing < -50) return "text-red-600";
  if (standing < 0)   return "text-orange-500";
  if (standing <= 25) return "text-gray-400";
  if (standing <= 50) return "text-green-400";
  return "text-amber-400";
}

export function getFactionStatus(standing) {
  if (standing < -50) return "Hostile";
  if (standing < 0)   return "Disliked";
  if (standing === 0) return "Neutral";
  if (standing <= 25) return "Liked";
  if (standing <= 50) return "Respected";
  return "Honored";
}

export function calcPriceModifier(standing) {
  // Hostile: 1.5x; Neutral: 1.0x; Honored: 0.8x
  return Math.max(0.7, 1 - standing / 200);
}

/**
 * Apply a reputation change with ripple to allies (half) and enemies (inverse half).
 * Returns updated faction_standing object.
 */
export function changeFactionReputation(character, factionId, amount) {
  const faction = FACTIONS[factionId];
  const standings = { ...(character.faction_standing || {}) };

  const clamp = (v) => Math.max(-100, Math.min(100, v));

  // Primary change
  standings[factionId] = clamp((standings[factionId] || 0) + amount);

  // Ripple to allies (half gain)
  if (faction?.allies) {
    faction.allies.forEach(allyId => {
      standings[allyId] = clamp((standings[allyId] || 0) + Math.floor(amount * 0.5));
    });
  }

  // Ripple to enemies (half inverse)
  if (faction?.enemies) {
    faction.enemies.forEach(enemyId => {
      standings[enemyId] = clamp((standings[enemyId] || 0) - Math.floor(amount * 0.5));
    });
  }

  return { faction_standing: standings };
}

export function lockOutIfHostile(character, factionId) {
  const standing = (character.faction_standing || {})[factionId] || 0;
  return standing < -50;
}

export function getFactionById(id) {
  return ALL_FACTIONS[id] || null;
}