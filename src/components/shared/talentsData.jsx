/**
 * VAELRATH — Talents / Feats System
 * 36 talents split into Tier 1 (beginner-safe) and advanced options
 */

// ─── TIER 1: BEGINNER-SAFE TALENTS ───────────────────────────────────────────

const TIER_1_TALENTS = [
  {
    id: "weapon_master_light",
    name: "Weapon Master (Light)",
    desc: "+2 damage with one-handed weapons. Encourages precision and swift strikes.",
    prerequisites: { level: 1, skills: { "one_handed": 1 } },
    tags: ["combat", "damage", "beginner"],
    effectMetadata: { damageBonus: 2, weaponTypes: ["one_handed"] },
  },
  {
    id: "careful_strike",
    name: "Careful Strike",
    desc: "Once per combat, reroll an attack. Beginner-friendly reliability.",
    prerequisites: { level: 1, skills: { "one_handed": 1 } },
    tags: ["combat", "accuracy", "beginner"],
    effectMetadata: { rerollPerCombat: 1 },
  },
  {
    id: "thick_hide",
    name: "Thick Hide",
    desc: "+5% damage reduction. Natural toughness and durability.",
    prerequisites: { level: 1, statThresholds: { constitution: 12 } },
    tags: ["defense", "passive", "beginner"],
    effectMetadata: { damageReduction: 0.05 },
  },
  {
    id: "quick_reflexes",
    name: "Quick Reflexes",
    desc: "Slight boost to evasion and initiative. Born to dodge.",
    prerequisites: { level: 1, skills: { "evasion": 1 } },
    tags: ["defense", "speed", "beginner"],
    effectMetadata: { evasionBonus: 0.1, initiativeBonus: 2 },
  },
  {
    id: "keen_observer",
    name: "Keen Observer",
    desc: "Perception checks gain +1 bonus. See what others miss.",
    prerequisites: { level: 1, skills: { "perception": 1 } },
    tags: ["utility", "perception", "beginner"],
    effectMetadata: { perceptionBonus: 1 },
  },
  {
    id: "tough_talker",
    name: "Tough Talker",
    desc: "Persuasion and Deception gain +1 bonus. Silver-tongued nature.",
    prerequisites: { level: 1, skills: { "persuasion": 1 } },
    tags: ["social", "charisma", "beginner"],
    effectMetadata: { socialBonus: 1 },
  },
  {
    id: "field_medic",
    name: "Field Medic",
    desc: "Healing spells and potions restore 10% more HP. Practiced care.",
    prerequisites: { level: 1, skills: { "healing": 1 } },
    tags: ["healing", "support", "beginner"],
    effectMetadata: { healingBonus: 0.1 },
  },
  {
    id: "survivor",
    name: "Survivor",
    desc: "Gain advantage on survival checks in wilderness. Hardened by travel.",
    prerequisites: { level: 1, skills: { "survival": 1 } },
    tags: ["utility", "wilderness", "beginner"],
    effectMetadata: { survivalBonus: 1 },
  },
];

// ─── TIER 2: INTERMEDIATE TALENTS ────────────────────────────────────────────

const TIER_2_TALENTS = [
  {
    id: "dual_wield_specialist",
    name: "Dual Wield Specialist",
    desc: "Fight with two weapons. Offhand attacks gain +2 damage bonus.",
    prerequisites: { level: 3, skills: { "dual_wielding": 2 }, statThresholds: { dexterity: 13 } },
    tags: ["combat", "offensive", "intermediate"],
    effectMetadata: { offhandDamageBonus: 2, allowsDualWield: true },
  },
  {
    id: "shield_expert",
    name: "Shield Expert",
    desc: "+2 armor when wielding a shield. Guard your allies.",
    prerequisites: { level: 3, skills: { "shields": 2 }, statThresholds: { strength: 12 } },
    tags: ["defense", "intermediate"],
    effectMetadata: { armorBonus: 2 },
  },
  {
    id: "fast_hands",
    name: "Fast Hands",
    desc: "Gain extra action point in combat once per round. Quick fingers.",
    prerequisites: { level: 3, skills: { "sleight_of_hand": 2 }, statThresholds: { dexterity: 14 } },
    tags: ["combat", "speed", "intermediate"],
    effectMetadata: { extraActionPerRound: 1 },
  },
  {
    id: "night_eyes",
    name: "Night Eyes",
    desc: "See in dim light as if it were bright. Navigate darkness.",
    prerequisites: { level: 3, skills: { "stealth": 2, "perception": 2 } },
    tags: ["utility", "perception", "intermediate"],
    effectMetadata: { darkvisionRange: 60 },
  },
  {
    id: "relentless",
    name: "Relentless",
    desc: "Once per combat, when reduced to 0 HP, instead gain 10 HP. Refuse to fall.",
    prerequisites: { level: 3, skills: { "athletics": 2 }, statThresholds: { constitution: 14 } },
    tags: ["survival", "defensive", "intermediate"],
    effectMetadata: { secondWind: true, hpRestoration: 10 },
  },
  {
    id: "battle_trance",
    name: "Battle Trance",
    desc: "Enter focused combat state. +1 damage and accuracy for 3 rounds. Costs stamina.",
    prerequisites: { level: 3, skills: { "tactics": 2 } },
    tags: ["combat", "offensive", "intermediate"],
    effectMetadata: { damageBonus: 1, accuracyBonus: 1, duration: 3 },
  },
  {
    id: "road_warden",
    name: "Road Warden",
    desc: "Navigation and survival gain +2. Ranger-like competence.",
    prerequisites: { level: 3, skills: { "navigation": 2, "survival": 2 } },
    tags: ["utility", "wilderness", "intermediate"],
    effectMetadata: { navigationBonus: 2, survivalBonus: 2 },
  },
  {
    id: "packmaster",
    name: "Packmaster",
    desc: "Animal handling +2. Summon and bond with animal companions.",
    prerequisites: { level: 3, skills: { "animal_handling": 2 } },
    tags: ["utility", "social", "intermediate"],
    effectMetadata: { animalHandlingBonus: 2, allowsCompanion: true },
  },
];

// ─── TIER 3: ADVANCED TALENTS ────────────────────────────────────────────────

const TIER_3_TALENTS = [
  {
    id: "lucky_break",
    name: "Lucky Break",
    desc: "Once per day, reroll any one d20 roll. Fate smiles on you.",
    prerequisites: { level: 5, statThresholds: { charisma: 14 } },
    tags: ["luck", "utility", "advanced"],
    effectMetadata: { luckyRerolls: 1, rechargePeriod: "daily" },
  },
  {
    id: "ambusher",
    name: "Ambusher",
    desc: "Attacks from stealth deal +3 damage. Strike from the shadows.",
    prerequisites: { level: 5, skills: { "stealth": 3, "archery": 2 } },
    tags: ["combat", "offensive", "advanced"],
    effectMetadata: { ambushDamageBonus: 3 },
  },
  {
    id: "iron_lungs",
    name: "Iron Lungs",
    desc: "Hold breath for 10 minutes. Endurance runner. Stamina +10%.",
    prerequisites: { level: 5, statThresholds: { constitution: 15 } },
    tags: ["utility", "survival", "advanced"],
    effectMetadata: { breathDuration: 600, staminaBonus: 0.1 },
  },
  {
    id: "ritual_adept",
    name: "Ritual Adept",
    desc: "Cast ritual spells without expending spell slots. Slow but free magic.",
    prerequisites: { level: 5, skills: { "arcana": 3, "research": 2 } },
    tags: ["magic", "casting", "advanced"],
    effectMetadata: { ritualCasting: true },
  },
  {
    id: "trader_instinct",
    name: "Trader's Instinct",
    desc: "Buying and selling prices swing 20% in your favor. Negotiate mastery.",
    prerequisites: { level: 5, skills: { "trading": 3, "appraisal": 2 } },
    tags: ["economic", "social", "advanced"],
    effectMetadata: { tradeBonus: 0.2 },
  },
  {
    id: "inspiring_presence",
    name: "Inspiring Presence",
    desc: "Nearby allies gain +1 morale and +2 to one stat roll per turn. Lead.",
    prerequisites: { level: 5, skills: { "leadership": 3 }, statThresholds: { charisma: 15 } },
    tags: ["social", "buff", "advanced"],
    effectMetadata: { alliesBonus: 1, morale: 1 },
  },
  {
    id: "precise_striker",
    name: "Precise Striker",
    desc: "Critical hit range expanded: 19-20. Weakness finder.",
    prerequisites: { level: 5, skills: { "one_handed": 3, "investigation": 2 } },
    tags: ["combat", "offensive", "advanced"],
    effectMetadata: { criticalRangeBonus: 1 },
  },
  {
    id: "skirmisher",
    name: "Skirmisher",
    desc: "Movement doesn't trigger attacks of opportunity. Hit and fade.",
    prerequisites: { level: 5, skills: { "acrobatics": 3 }, statThresholds: { dexterity: 15 } },
    tags: ["combat", "mobility", "advanced"],
    effectMetadata: { freeMovement: true },
  },
  {
    id: "steadfast_defender",
    name: "Steadfast Defender",
    desc: "Protect nearby allies: they gain +1 armor. Bodyguard instinct.",
    prerequisites: { level: 5, skills: { "shields": 3 }, statThresholds: { strength: 15 } },
    tags: ["defense", "support", "advanced"],
    effectMetadata: { allyArmorBonus: 1 },
  },
  {
    id: "arcane_warrior",
    name: "Arcane Warrior",
    desc: "Spellcasting while in armor. Blend magic and melee.",
    prerequisites: { level: 5, skills: { "arcana": 3, "heavy_armor": 2 }, race: ["human", "elf"] },
    tags: ["magic", "combat", "advanced"],
    effectMetadata: { armorCasting: true },
  },
  {
    id: "shadow_walker",
    name: "Shadow Walker",
    desc: "Stealth and evasion skills gain +2. Move unseen.",
    prerequisites: { level: 5, skills: { "stealth": 3, "acrobatics": 2 }, statThresholds: { dexterity: 15 } },
    tags: ["stealth", "mobility", "advanced"],
    effectMetadata: { stealthBonus: 2, evasionBonus: 2 },
  },
  {
    id: "master_crafter",
    name: "Master Crafter",
    desc: "Crafted items gain +1 quality. Create legendary gear.",
    prerequisites: { level: 5, skills: { "crafting": 3, "appraisal": 2 } },
    tags: ["crafting", "production", "advanced"],
    effectMetadata: { itemQualityBonus: 1 },
  },
];

// ─── ALL TALENTS ──────────────────────────────────────────────────────────────

export const ALL_TALENTS = [...TIER_1_TALENTS, ...TIER_2_TALENTS, ...TIER_3_TALENTS];

export const TIER_1_TALENTS_ARRAY = TIER_1_TALENTS;
export const TIER_2_TALENTS_ARRAY = TIER_2_TALENTS;
export const TIER_3_TALENTS_ARRAY = TIER_3_TALENTS;

// ─── UTILITY ──────────────────────────────────────────────────────────────────

export function getTalentById(talentId) {
  return ALL_TALENTS.find(t => t.id === talentId);
}

/**
 * Get beginner-safe talents for character creation (Tier 1)
 */
export function getBeginnerTalents() {
  return TIER_1_TALENTS;
}

/**
 * Check if a talent's prerequisites are met
 */
export function canSelectTalent(talentId, character) {
  const talent = getTalentById(talentId);
  if (!talent) return false;

  const { prerequisites } = talent;
  if (!prerequisites) return true;

  // Check level
  if (prerequisites.level && character.level < prerequisites.level) return false;

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