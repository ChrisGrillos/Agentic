/**
 * VAELRATH — Race Definitions & Attribute Rolling System
 *
 * Six playable races. Stats are ROLLED (3d6 per stat with race bias),
 * not assigned by class. Class comes AFTER race + roll.
 *
 * Rolling rules:
 *   - Roll all 6 stats as a set (3d6 each, apply race bias, clamp to range)
 *   - Player gets 5 total rerolls
 *   - Accept early or use all rerolls
 *   - Race determines stat ranges and tendencies
 */

// ─── RACE DATA ────────────────────────────────────────────────────────────────

export const RACES = {
  human: {
    id: "human",
    name: "Human",
    emoji: "🧑",
    plural: "Humans",
    description: "Adaptable and politically fragmented. Found in every corner of Vaelrath. What they lack in natural gifts they make for in sheer determination.",
    lore: "Once the backbone of the Concordant Age, humans now scatter across every faction and frontier. Their ambition rebuilt High Bastion from the ashes.",
    heightLabel: "Average",
    statWeights: {
      strength:     0,
      dexterity:    0,
      intelligence: 0,
      wisdom:       0,
      constitution: 0,
      charisma:     0,
    },
    model: { heightScale: 1.0, bodyWidth: 1.0, accentColor: "#d4a040", skinTone: "#c4956a" },
    startingRegions: ["high_bastion", "the_ashen_march", "the_sunken_crown"],
    factionLean: ["bastion_compact", "ash_banner_hosts", "ember_throne"],
  },

  elf: {
    id: "elf",
    name: "Elf",
    emoji: "🧝",
    plural: "Elves",
    description: "Tall, slender, long-lived. Keepers of ancient memory. Graceful and sharp-minded, but slow to trust outsiders.",
    lore: "The Thornwild shelters what remains of the old elven courts. They remember the Concordant Age firsthand. That memory is both gift and burden.",
    heightLabel: "Tall & Slender",
    statWeights: {
      strength:     -1,
      dexterity:    2,
      intelligence: 1,
      wisdom:       1,
      constitution: -1,
      charisma:     0,
    },
    model: { heightScale: 1.12, bodyWidth: 0.85, accentColor: "#40d4d4", skinTone: "#e0d8c8" },
    startingRegions: ["the_thornwild"],
    factionLean: ["thornbound_circle", "veiled_synod"],
  },

  dwarf: {
    id: "dwarf",
    name: "Dwarf",
    emoji: "⛏️",
    plural: "Dwarves",
    description: "Stocky, enduring, oath-bound. Fortress-builders who prize stone, steel, and their word above all else.",
    lore: "Kharum Deep has never fallen. The Iron Oath dwarves held their gates through the Sundering and hold them still. They do not forget. They do not forgive.",
    heightLabel: "Short & Stocky",
    statWeights: {
      strength:     2,
      dexterity:    -1,
      intelligence: 0,
      wisdom:       0,
      constitution: 3,
      charisma:     -2,
    },
    model: { heightScale: 0.70, bodyWidth: 1.30, accentColor: "#d47040", skinTone: "#b89070" },
    startingRegions: ["kharum_deep"],
    factionLean: ["iron_oath"],
  },

  halfling: {
    id: "halfling",
    name: "Halfling",
    emoji: "🧒",
    plural: "Halflings",
    description: "Small, quick, sharp-tongued. Born traders and scouts. They survive by being where trouble isn't — or by talking their way out of it.",
    lore: "No halfling kingdom ever existed. They live between the cracks of other peoples' empires, running caravans, counting coin, and knowing every road worth knowing.",
    heightLabel: "Small & Quick",
    statWeights: {
      strength:     -2,
      dexterity:    3,
      intelligence: 0,
      wisdom:       0,
      constitution: -1,
      charisma:     1,
    },
    model: { heightScale: 0.58, bodyWidth: 0.90, accentColor: "#40d460", skinTone: "#d4b890" },
    startingRegions: ["high_bastion", "the_ashen_march"],
    factionLean: ["free_spears", "bastion_compact"],
  },

  orc: {
    id: "orc",
    name: "Orc",
    emoji: "👹",
    plural: "Orcs",
    description: "Martial, proud, contested. Strong beyond measure but fighting for legitimacy in a world that fears them.",
    lore: "The orcs were shock troops of the old empire — used, discarded, blamed. Now they build their own warbands on the frontiers and dare anyone to call them lesser.",
    heightLabel: "Tall & Broad",
    statWeights: {
      strength:     3,
      dexterity:    -1,
      intelligence: -2,
      wisdom:       -1,
      constitution: 2,
      charisma:     -2,
    },
    model: { heightScale: 1.20, bodyWidth: 1.25, accentColor: "#d44040", skinTone: "#5a7a50" },
    startingRegions: ["the_ashen_march", "greyfen_reach"],
    factionLean: ["ash_banner_hosts", "free_spears"],
  },

  half_giant: {
    id: "half_giant",
    name: "Half Giant",
    emoji: "🗿",
    plural: "Half Giants",
    description: "Rare, powerful, ancient bloodlines. Descended from something older than the Concordant Age. The ground shakes when they walk.",
    lore: "No one knows if the giants were born from the mountains or if the mountains grew around them. The half-blooded carry that power in diluted but still terrifying form.",
    heightLabel: "Massive",
    statWeights: {
      strength:     4,
      dexterity:    -3,
      intelligence: -3,
      wisdom:       -1,
      constitution: 3,
      charisma:     -3,
    },
    model: { heightScale: 1.40, bodyWidth: 1.45, accentColor: "#a040d4", skinTone: "#a09080" },
    startingRegions: ["kharum_deep", "vale_of_cinders"],
    factionLean: ["iron_oath", "ash_banner_hosts"],
  },
};

export const RACE_LIST = Object.values(RACES);
export const RACE_IDS  = Object.keys(RACES);

// ─── STAT NAMES ───────────────────────────────────────────────────────────────

export const STAT_NAMES = ["strength", "dexterity", "intelligence", "wisdom", "constitution", "charisma"];

export const STAT_LABELS = {
  strength:     { short: "STR", full: "Strength",     emoji: "💪" },
  dexterity:    { short: "DEX", full: "Dexterity",    emoji: "🏃" },
  intelligence: { short: "INT", full: "Intelligence", emoji: "🧠" },
  wisdom:       { short: "WIS", full: "Wisdom",       emoji: "👁️" },
  constitution: { short: "CON", full: "Constitution", emoji: "🛡️" },
  charisma:     { short: "CHA", full: "Charisma",     emoji: "✨" },
};

// ─── ROLLING FUNCTIONS ────────────────────────────────────────────────────────

/** Roll 3d6 → sum */
function roll3d6() {
  return (
    Math.floor(Math.random() * 6) + 1 +
    Math.floor(Math.random() * 6) + 1 +
    Math.floor(Math.random() * 6) + 1
  );
}

/** Roll a single stat for a given race using weighted tendencies. */
function rollStat(raceId, statName) {
  const race = RACES[raceId];
  if (!race) return 10;
  
  const weight = race.statWeights?.[statName] || 0;
  const base = roll3d6();
  
  // Apply weight as a modifier (can range from -3 to +4 total)
  // Weights shift the roll slightly but don't hard-lock outcomes
  const weighted = base + weight;
  
  // Clamp to reasonable bounds (3–18, the standard fantasy RPG range)
  return Math.max(3, Math.min(18, weighted));
}

/** Roll a full stat block for a race. Returns { strength, dexterity, ... } */
export function rollStats(raceId) {
  const stats = {};
  for (const stat of STAT_NAMES) {
    stats[stat] = rollStat(raceId, stat);
  }
  return stats;
}

/** Alias for rollStats (for API compat) */
export const rollStatsForRace = rollStats;

/** Get the total stat points in a roll (for quality display) */
export function statTotal(stats) {
  return STAT_NAMES.reduce((sum, s) => sum + (stats[s] || 0), 0);
}

/** Rate a roll quality: "poor" | "average" | "good" | "exceptional" */
export function rollQuality(stats) {
  const total = statTotal(stats);
  if (total >= 75) return "exceptional";
  if (total >= 65) return "good";
  if (total >= 55) return "average";
  return "poor";
}

/** Individual stat quality based on absolute thresholds (no race ranges) */
export function statQuality(raceId, statName, value) {
  if (value >= 16) return "exceptional";
  if (value >= 13) return "good";
  if (value >= 9)  return "average";
  return "poor";
}

// ─── CLASS FIT ────────────────────────────────────────────────────────────────

const CLASS_PRIMARY = {
  warrior:   ["strength", "constitution"],
  hunter:    ["dexterity", "wisdom"],
  healer:    ["wisdom", "intelligence"],
  wizard:    ["intelligence", "wisdom"],
  magician:  ["charisma", "intelligence"],
  merchant:  ["charisma", "intelligence"],
  craftsman: ["dexterity", "strength"],
  fighter:   ["strength", "constitution"],
};

/**
 * Evaluate how well a rolled stat block fits a class.
 * Returns "strong" | "viable" | "weak"
 */
export function classFit(stats, classId) {
  const primaries = CLASS_PRIMARY[classId];
  if (!primaries) return "viable";

  const avg = primaries.reduce((sum, s) => sum + (stats[s] || 10), 0) / primaries.length;

  if (avg >= 13) return "strong";
  if (avg >= 10) return "viable";
  return "weak";
}

export const CLASS_FIT_LABELS = {
  strong: { label: "Strong Fit", color: "#4ade80", emoji: "⚡" },
  viable: { label: "Viable",     color: "#facc15", emoji: "⚪" },
  weak:   { label: "Weak Fit",   color: "#f87171", emoji: "⚠️" },
};

// ─── MAX REROLLS ──────────────────────────────────────────────────────────────
export const MAX_REROLLS = 5;

/** Safely get race data by ID, defaulting to human */
export function getRace(raceId) {
  return RACES[raceId] || RACES.human;
}