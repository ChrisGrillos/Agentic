/**
 * VAELRATH — Comprehensive Feats/Perks System (80+ feats)
 * Organized by tier: Starter (Level 1), Intermediate (Level 3-5), Advanced (Level 5+), Legendary (Level 10+)
 *
 * Each feat has:
 * - id, name, description
 * - prerequisites: { level, skills {}, statThresholds {}, race[] }
 * - tags: [combat, defense, utility, magic, social, survival, crafting]
 * - effectMetadata: numeric modifiers and flags for implementation
 */

// ─── TIER 1: STARTER FEATS ────────────────────────────────────────────────────

const STARTER_FEATS = [
  {
    id: "weapon_master_light",
    name: "Weapon Master (Light)",
    desc: "+2 damage with one-handed weapons. Precision strike expertise.",
    prerequisites: { level: 1, skills: { one_handed: 1 } },
    tags: ["combat", "damage", "starter"],
    effectMetadata: { damageBonus: 2, weaponTypes: ["one_handed"] },
  },
  {
    id: "careful_strike",
    name: "Careful Strike",
    desc: "Once per combat, reroll an attack. Tactical accuracy.",
    prerequisites: { level: 1, skills: { one_handed: 1 } },
    tags: ["combat", "accuracy", "starter"],
    effectMetadata: { rerollPerCombat: 1 },
  },
  {
    id: "thick_hide",
    name: "Thick Hide",
    desc: "+5% damage reduction. Natural durability.",
    prerequisites: { level: 1, statThresholds: { constitution: 12 } },
    tags: ["defense", "passive", "starter"],
    effectMetadata: { damageReduction: 0.05 },
  },
  {
    id: "quick_reflexes",
    name: "Quick Reflexes",
    desc: "+10% evasion and +2 initiative. Born to dodge.",
    prerequisites: { level: 1, skills: { evasion: 1 } },
    tags: ["defense", "speed", "starter"],
    effectMetadata: { evasionBonus: 0.1, initiativeBonus: 2 },
  },
  {
    id: "keen_observer",
    name: "Keen Observer",
    desc: "Perception checks gain +1. See what others miss.",
    prerequisites: { level: 1, skills: { perception: 1 } },
    tags: ["utility", "perception", "starter"],
    effectMetadata: { perceptionBonus: 1 },
  },
  {
    id: "tough_talker",
    name: "Tough Talker",
    desc: "Persuasion and Deception gain +1. Silver tongue.",
    prerequisites: { level: 1, skills: { persuasion: 1 } },
    tags: ["social", "charisma", "starter"],
    effectMetadata: { socialBonus: 1 },
  },
  {
    id: "field_medic",
    name: "Field Medic",
    desc: "Healing and potions restore 10% more HP. Practiced care.",
    prerequisites: { level: 1, skills: { healing: 1 } },
    tags: ["healing", "support", "starter"],
    effectMetadata: { healingBonus: 0.1 },
  },
  {
    id: "survivor",
    name: "Survivor",
    desc: "Gain advantage on survival checks. Hardened by travel.",
    prerequisites: { level: 1, skills: { survival: 1 } },
    tags: ["utility", "wilderness", "starter"],
    effectMetadata: { survivalBonus: 1 },
  },
  {
    id: "archer_stance",
    name: "Archer's Stance",
    desc: "+3 damage with ranged attacks. Focused aim.",
    prerequisites: { level: 1, skills: { archery: 1 } },
    tags: ["combat", "ranged", "starter"],
    effectMetadata: { rangedDamageBonus: 3 },
  },
  {
    id: "magic_initiate",
    name: "Magic Initiate",
    desc: "Learn one cantrip from research skill. First spark of magic.",
    prerequisites: { level: 1, skills: { arcana: 1 }, statThresholds: { intelligence: 11 } },
    tags: ["magic", "utility", "starter"],
    effectMetadata: { cantrips: 1 },
  },
  {
    id: "tactical_mind",
    name: "Tactical Mind",
    desc: "+1 to all skill checks when not in combat. Cunning preparation.",
    prerequisites: { level: 1, skills: { tactics: 1 } },
    tags: ["utility", "strategy", "starter"],
    effectMetadata: { outOfCombatBonus: 1 },
  },
  {
    id: "resourceful",
    name: "Resourceful",
    desc: "+15% resource gathering speed. Efficient harvesting.",
    prerequisites: { level: 1, skills: { gathering: 1 } },
    tags: ["crafting", "gathering", "starter"],
    effectMetadata: { gatheringBonus: 0.15 },
  },
  {
    id: "dual_wield_initiate",
    name: "Dual Wield Initiate",
    desc: "Reduces offhand penalty by 10%. Your offhand strikes land harder and truer.",
    prerequisites: { level: 1, skills: { dual_wielding: 1 } },
    tags: ["combat", "offensive", "starter"],
    effectMetadata: { offhandDamageBonus: 1 },
  },
  {
    id: "shield_discipline",
    name: "Shield Discipline",
    desc: "+5% block chance. Instinctive shield positioning under pressure.",
    prerequisites: { level: 1, skills: { shields: 1 } },
    tags: ["defense", "block", "starter"],
    effectMetadata: { armorBonus: 1, blockChanceBonus: 5 },
  },
  {
    id: "quick_cast",
    name: "Quick Cast",
    desc: "Spell energy costs reduced by 5%. Channel faster, waste less.",
    prerequisites: { level: 1, skills: { arcana: 1 }, statThresholds: { intelligence: 11 } },
    tags: ["magic", "efficiency", "starter"],
    effectMetadata: { spellCostReduction: 0.05 },
  },
  {
    id: "duelist_stance",
    name: "Duelist Stance",
    desc: "+3% parry chance and +2 accuracy. One blade, maximum precision.",
    prerequisites: { level: 1, skills: { parry: 1 } },
    tags: ["combat", "defense", "starter"],
    effectMetadata: { parryChanceBonus: 3, accuracyBonus: 2 },
  },
  {
    id: "heavy_hitter",
    name: "Heavy Hitter",
    desc: "+3 damage with two-handed weapons. Overwhelm foes with raw power.",
    prerequisites: { level: 1, skills: { two_handed: 1 } },
    tags: ["combat", "damage", "starter"],
    effectMetadata: { twoHandedDamageBonus: 3 },
  },
];

// ─── TIER 2: INTERMEDIATE FEATS ───────────────────────────────────────────────

const INTERMEDIATE_FEATS = [
  {
    id: "dual_wield_specialist",
    name: "Dual Wield Specialist",
    desc: "Fight with two weapons. Offhand attacks gain +2 damage.",
    prerequisites: { level: 3, skills: { dual_wielding: 2 }, statThresholds: { dexterity: 13 } },
    tags: ["combat", "offensive", "intermediate"],
    effectMetadata: { offhandDamageBonus: 2, allowsDualWield: true },
  },
  {
    id: "shield_expert",
    name: "Shield Expert",
    desc: "+2 armor when wielding a shield. Guard your allies.",
    prerequisites: { level: 3, skills: { shields: 2 }, statThresholds: { strength: 12 } },
    tags: ["defense", "intermediate"],
    effectMetadata: { armorBonus: 2 },
  },
  {
    id: "fast_hands",
    name: "Fast Hands",
    desc: "Gain extra action point in combat once per round.",
    prerequisites: { level: 3, skills: { sleight_of_hand: 2 }, statThresholds: { dexterity: 14 } },
    tags: ["combat", "speed", "intermediate"],
    effectMetadata: { extraActionPerRound: 1 },
  },
  {
    id: "night_eyes",
    name: "Night Eyes",
    desc: "See in dim light as bright. Navigate darkness.",
    prerequisites: { level: 3, skills: { stealth: 2, perception: 2 } },
    tags: ["utility", "perception", "intermediate"],
    effectMetadata: { darkvisionRange: 60 },
  },
  {
    id: "relentless",
    name: "Relentless",
    desc: "Once per combat, when reduced to 0 HP, gain 10 HP instead.",
    prerequisites: { level: 3, skills: { athletics: 2 }, statThresholds: { constitution: 14 } },
    tags: ["survival", "defensive", "intermediate"],
    effectMetadata: { secondWind: true, hpRestoration: 10 },
  },
  {
    id: "battle_trance",
    name: "Battle Trance",
    desc: "Enter focused state: +1 damage and accuracy for 3 rounds.",
    prerequisites: { level: 3, skills: { tactics: 2 } },
    tags: ["combat", "offensive", "intermediate"],
    effectMetadata: { damageBonus: 1, accuracyBonus: 1, duration: 3 },
  },
  {
    id: "road_warden",
    name: "Road Warden",
    desc: "Navigation and survival gain +2. Ranger competence.",
    prerequisites: { level: 3, skills: { navigation: 2, survival: 2 } },
    tags: ["utility", "wilderness", "intermediate"],
    effectMetadata: { navigationBonus: 2, survivalBonus: 2 },
  },
  {
    id: "packmaster",
    name: "Packmaster",
    desc: "Animal handling +2. Summon and bond with companions.",
    prerequisites: { level: 3, skills: { animal_handling: 2 } },
    tags: ["utility", "social", "intermediate"],
    effectMetadata: { animalHandlingBonus: 2, allowsCompanion: true },
  },
  {
    id: "two_handed_mastery",
    name: "Two-Handed Mastery",
    desc: "+4 damage with two-handed weapons. Devastating power.",
    prerequisites: { level: 3, skills: { two_handed: 2 }, statThresholds: { strength: 14 } },
    tags: ["combat", "damage", "intermediate"],
    effectMetadata: { twoHandedDamageBonus: 4 },
  },
  {
    id: "assassin_training",
    name: "Assassin Training",
    desc: "Stealth attacks gain +5 damage. Strike unseen.",
    prerequisites: { level: 3, skills: { stealth: 2, sleight_of_hand: 2 } },
    tags: ["combat", "stealth", "intermediate"],
    effectMetadata: { stealthDamageBonus: 5 },
  },
  {
    id: "spelunker",
    name: "Spelunker",
    desc: "Dungeon navigation +2. Mining and trap detection +1.",
    prerequisites: { level: 3, skills: { mining: 1, investigation: 2 } },
    tags: ["utility", "exploration", "intermediate"],
    effectMetadata: { dungeonBonus: 2, trapDetection: 1 },
  },
  {
    id: "master_trader",
    name: "Master Trader",
    desc: "Buy/sell prices swing 15% in your favor. Negotiation mastery.",
    prerequisites: { level: 3, skills: { trading: 2, appraisal: 2 } },
    tags: ["economic", "social", "intermediate"],
    effectMetadata: { tradeBonus: 0.15 },
  },
  {
    id: "forgemaster",
    name: "Forgemaster",
    desc: "Crafted weapons and armor gain +1 quality. Superior craftsmanship.",
    prerequisites: { level: 3, skills: { smithing: 2 }, statThresholds: { strength: 13 } },
    tags: ["crafting", "production", "intermediate"],
    effectMetadata: { smithingQuality: 1 },
  },
  {
    id: "herbalist",
    name: "Herbalist",
    desc: "Potion effectiveness +20%. Plant lore mastery.",
    prerequisites: { level: 3, skills: { alchemy: 2, foraging: 2 } },
    tags: ["crafting", "magic", "intermediate"],
    effectMetadata: { potionBonus: 0.2 },
  },
];

// ─── TIER 3: ADVANCED FEATS ──────────────────────────────────────────────────

const ADVANCED_FEATS = [
  {
    id: "lucky_break",
    name: "Lucky Break",
    desc: "Once per day, reroll any d20. Fate favors you.",
    prerequisites: { level: 5, statThresholds: { charisma: 14 } },
    tags: ["luck", "utility", "advanced"],
    effectMetadata: { luckyRerolls: 1, rechargePeriod: "daily" },
  },
  {
    id: "ambusher",
    name: "Ambusher",
    desc: "Attacks from stealth deal +3 damage. Shadow striker.",
    prerequisites: { level: 5, skills: { stealth: 3, archery: 2 } },
    tags: ["combat", "offensive", "advanced"],
    effectMetadata: { ambushDamageBonus: 3 },
  },
  {
    id: "iron_lungs",
    name: "Iron Lungs",
    desc: "Hold breath 10 minutes. Stamina +10%.",
    prerequisites: { level: 5, statThresholds: { constitution: 15 } },
    tags: ["utility", "survival", "advanced"],
    effectMetadata: { breathDuration: 600, staminaBonus: 0.1 },
  },
  {
    id: "ritual_adept",
    name: "Ritual Adept",
    desc: "Cast ritual spells without slots. Slow but free magic.",
    prerequisites: { level: 5, skills: { arcana: 3, research: 2 } },
    tags: ["magic", "casting", "advanced"],
    effectMetadata: { ritualCasting: true },
  },
  {
    id: "trader_instinct",
    name: "Trader's Instinct",
    desc: "Buy/sell prices swing 20% in your favor. Shrewd negotiation.",
    prerequisites: { level: 5, skills: { trading: 3, appraisal: 2 } },
    tags: ["economic", "social", "advanced"],
    effectMetadata: { tradeBonus: 0.2 },
  },
  {
    id: "inspiring_presence",
    name: "Inspiring Presence",
    desc: "Nearby allies gain +1 morale and +2 to one stat per turn.",
    prerequisites: { level: 5, skills: { leadership: 3 }, statThresholds: { charisma: 15 } },
    tags: ["social", "buff", "advanced"],
    effectMetadata: { alliesBonus: 1, morale: 1 },
  },
  {
    id: "precise_striker",
    name: "Precise Striker",
    desc: "Critical hit range expanded: 19-20. Find weaknesses.",
    prerequisites: { level: 5, skills: { one_handed: 3, investigation: 2 } },
    tags: ["combat", "offensive", "advanced"],
    effectMetadata: { criticalRangeBonus: 1 },
  },
  {
    id: "skirmisher",
    name: "Skirmisher",
    desc: "Movement doesn't trigger attacks of opportunity. Hit and fade.",
    prerequisites: { level: 5, skills: { acrobatics: 3 }, statThresholds: { dexterity: 15 } },
    tags: ["combat", "mobility", "advanced"],
    effectMetadata: { freeMovement: true },
  },
  {
    id: "steadfast_defender",
    name: "Steadfast Defender",
    desc: "Nearby allies gain +1 armor. Guardian instinct.",
    prerequisites: { level: 5, skills: { shields: 3 }, statThresholds: { strength: 15 } },
    tags: ["defense", "support", "advanced"],
    effectMetadata: { allyArmorBonus: 1 },
  },
  {
    id: "arcane_warrior",
    name: "Arcane Warrior",
    desc: "Cast spells while in armor. Blend magic and melee.",
    prerequisites: { level: 5, skills: { arcana: 3, heavy_armor: 2 }, race: ["human", "elf"] },
    tags: ["magic", "combat", "advanced"],
    effectMetadata: { armorCasting: true },
  },
  {
    id: "shadow_walker",
    name: "Shadow Walker",
    desc: "Stealth and evasion gain +2. Move unseen.",
    prerequisites: { level: 5, skills: { stealth: 3, acrobatics: 2 }, statThresholds: { dexterity: 15 } },
    tags: ["stealth", "mobility", "advanced"],
    effectMetadata: { stealthBonus: 2, evasionBonus: 2 },
  },
  {
    id: "master_crafter",
    name: "Master Crafter",
    desc: "Crafted items gain +1 quality. Create legendary gear.",
    prerequisites: { level: 5, skills: { crafting: 3, appraisal: 2 } },
    tags: ["crafting", "production", "advanced"],
    effectMetadata: { itemQualityBonus: 1 },
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    desc: "Once per combat, attack all adjacent enemies. Devastating spin.",
    prerequisites: { level: 5, skills: { two_handed: 2, tactics: 2 }, statThresholds: { strength: 15 } },
    tags: ["combat", "aoe", "advanced"],
    effectMetadata: { aoeDamageBonus: 1, affectsAll: true },
  },
  {
    id: "escape_artist",
    name: "Escape Artist",
    desc: "Automatically break free from stuns/slows. Elusive nature.",
    prerequisites: { level: 5, skills: { acrobatics: 3, sleight_of_hand: 3 } },
    tags: ["utility", "survival", "advanced"],
    effectMetadata: { ccImmunity: true },
  },
  {
    id: "monster_hunter",
    name: "Monster Hunter",
    desc: "Damage vs monsters +15%. Monster knowledge.",
    prerequisites: { level: 5, skills: { survival: 3, investigation: 2 } },
    tags: ["combat", "damage", "advanced"],
    effectMetadata: { monsterDamageBonus: 0.15 },
  },
];

// ─── TIER 4: LEGENDARY FEATS ──────────────────────────────────────────────────

const LEGENDARY_FEATS = [
  {
    id: "war_god",
    name: "War God",
    desc: "All weapon damage +3. Combat prowess +10%. Legendary warrior.",
    prerequisites: { level: 10, skills: { one_handed: 4, two_handed: 4 }, statThresholds: { strength: 17 } },
    tags: ["combat", "legendary", "damage"],
    effectMetadata: { allWeaponDamageBonus: 3, combatBonus: 0.1 },
  },
  {
    id: "immortal",
    name: "Immortal",
    desc: "Once per week, cheat death. Respawn at nearest shrine with 50% HP.",
    prerequisites: { level: 10, statThresholds: { constitution: 17, wisdom: 15 } },
    tags: ["survival", "legendary", "resurrection"],
    effectMetadata: { deathSave: true, deathSaveCD: "weekly" },
  },
  {
    id: "spellweaver",
    name: "Spellweaver",
    desc: "All spells cost 20% less energy. Magic mastery.",
    prerequisites: { level: 10, skills: { arcana: 4, research: 3 }, statThresholds: { intelligence: 17 } },
    tags: ["magic", "legendary", "efficiency"],
    effectMetadata: { spellCostReduction: 0.2 },
  },
  {
    id: "dragonsoul",
    name: "Dragonsoul",
    desc: "Resistance to all elemental damage +30%. Draconic power.",
    prerequisites: { level: 10, statThresholds: { charisma: 15, intelligence: 15 } },
    tags: ["magic", "legendary", "defense"],
    effectMetadata: { elementalResistance: 0.3 },
  },
  {
    id: "king_of_thieves",
    name: "King of Thieves",
    desc: "Stealth and lockpicking +4. Steal from any chest. Master rogue.",
    prerequisites: { level: 10, skills: { stealth: 4, sleight_of_hand: 4 }, statThresholds: { dexterity: 17 } },
    tags: ["stealth", "legendary", "utility"],
    effectMetadata: { stealthMastery: 4, universalLockpick: true },
  },
  {
    id: "god_of_diplomacy",
    name: "God of Diplomacy",
    desc: "All NPCs grant 50% more rewards. Legendary charm.",
    prerequisites: { level: 10, skills: { persuasion: 4, diplomacy: 4 }, statThresholds: { charisma: 17 } },
    tags: ["social", "legendary", "reward"],
    effectMetadata: { npcRewardBonus: 0.5 },
  },
  {
    id: "plague_bearer",
    name: "Plague Bearer",
    desc: "All debuffs last 50% longer. Poison mastery.",
    prerequisites: { level: 10, skills: { alchemy: 4, arcana: 3 } },
    tags: ["magic", "legendary", "debuff"],
    effectMetadata: { debuffDurationBonus: 0.5 },
  },
  {
    id: "world_shaper",
    name: "World Shaper",
    desc: "Crafting speed +50%. All items gain +2 quality. Creative genius.",
    prerequisites: { level: 10, skills: { crafting: 4, smithing: 3 } },
    tags: ["crafting", "legendary", "production"],
    effectMetadata: { craftingSpeedBonus: 0.5, itemQualityBonus: 2 },
  },
];

// ─── ALL FEATS ──────────────────────────────────────────────────────────────

export const ALL_FEATS = [
  ...STARTER_FEATS,
  ...INTERMEDIATE_FEATS,
  ...ADVANCED_FEATS,
  ...LEGENDARY_FEATS,
];

// ─── TIER EXPORTS ──────────────────────────────────────────────────────────────

export const STARTER_FEATS_ARRAY = STARTER_FEATS;
export const INTERMEDIATE_FEATS_ARRAY = INTERMEDIATE_FEATS;
export const ADVANCED_FEATS_ARRAY = ADVANCED_FEATS;
export const LEGENDARY_FEATS_ARRAY = LEGENDARY_FEATS;

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get a feat by ID
 */
export function getFeatById(featId) {
  return ALL_FEATS.find(f => f.id === featId);
}

/**
 * Get starter feats suitable for character creation
 */
export function getStarterFeats() {
  return STARTER_FEATS;
}

/**
 * Get feats available to a character based on their level and stats
 */
export function getAvailableFeats(character) {
  return ALL_FEATS.filter(feat => canSelectFeat(feat.id, character));
}

/**
 * Check if a character can select a specific feat
 */
export function canSelectFeat(featId, character) {
  const feat = getFeatById(featId);
  if (!feat) return false;

  const { prerequisites } = feat;
  if (!prerequisites) return true;

  // Check level
  if (prerequisites.level && (character.level || 1) < prerequisites.level) return false;

  // Check stat thresholds
  if (prerequisites.statThresholds) {
    for (const [stat, minVal] of Object.entries(prerequisites.statThresholds)) {
      if ((character.stats?.[stat] || 10) < minVal) return false;
    }
  }

  // Check required skills
  if (prerequisites.skills) {
    for (const [skillId, minRank] of Object.entries(prerequisites.skills)) {
      if ((character.skills?.[skillId] || 0) < minRank) return false;
    }
  }

  // Check race restrictions (if any)
  if (prerequisites.race && !prerequisites.race.includes(character.race)) return false;

  return true;
}

/**
 * Get feat suggestions for character creation (class + race combo)
 */
export function getSuggestedStarterFeats(race, classId) {
  const suggestions = [];

  // Class-based suggestions
  const classPrefs = {
    warrior: ["weapon_master_light", "thick_hide", "shield_discipline", "heavy_hitter"],
    hunter: ["archer_stance", "quick_reflexes", "keen_observer"],
    healer: ["field_medic", "quick_cast", "survivor"],
    wizard: ["magic_initiate", "quick_cast", "tactical_mind"],
    merchant: ["tough_talker", "resourceful", "keen_observer"],
    craftsman: ["resourceful", "thick_hide", "quick_reflexes"],
  };

  // Race-based suggestions
  const racePrefs = {
    human: ["tactical_mind", "tough_talker", "duelist_stance"],
    elf: ["quick_reflexes", "magic_initiate", "archer_stance"],
    dwarf: ["thick_hide", "shield_discipline", "heavy_hitter"],
    halfling: ["quick_reflexes", "dual_wield_initiate", "resourceful"],
    orc: ["heavy_hitter", "thick_hide", "weapon_master_light"],
    half_giant: ["heavy_hitter", "thick_hide", "weapon_master_light"],
  };

  const combined = new Set([
    ...(classPrefs[classId] || []),
    ...(racePrefs[race] || []),
  ]);

  return Array.from(combined)
    .map(featId => getFeatById(featId))
    .filter(f => f !== undefined)
    .slice(0, 3);
}