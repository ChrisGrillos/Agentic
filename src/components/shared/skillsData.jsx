/**
 * VAELRATH — Expanded Skills System (MMO-Ready)
 * ~45 skills across 3 categories: Combat, Magic, World
 *
 * Each skill: id, name, category, description, scalingNotes, affects
 */

// ─── COMBAT SKILLS ───────────────────────────────────────────────────────────

export const COMBAT_SKILLS = [
  { id: "one_handed",    name: "One-Handed",     linkedAttr: "strength",     desc: "Mastery of swords, axes, and maces wielded in one hand. Core melee discipline.",                    scalingNotes: "Scales damage with STR, unlocks precision strikes at higher ranks.",           affects: ["attack_power", "accuracy"] },
  { id: "two_handed",    name: "Two-Handed",     linkedAttr: "strength",     desc: "Command of greatswords, mauls, and war-axes. Devastating cleave attacks.",                          scalingNotes: "Bonus damage scales with STR. High ranks unlock sweeping blows.",               affects: ["attack_power", "cleave_damage"] },
  { id: "polearms",      name: "Polearms",       linkedAttr: "strength",     desc: "Spears, halberds, and pikes. Reach advantage and formation fighting.",                              scalingNotes: "STR scaling. Grants reach bonus at higher ranks.",                              affects: ["attack_power", "reach"] },
  { id: "dual_wielding", name: "Dual Wield",     linkedAttr: "dexterity",    desc: "Fighting with a weapon in each hand. Reduces offhand penalty and increases attack speed.",           scalingNotes: "DEX scaling. Each rank reduces offhand damage penalty by 8%.",                  affects: ["offhand_damage", "attack_speed"] },
  { id: "archery",       name: "Archery",        linkedAttr: "dexterity",    desc: "Longbows and shortbows. Precision ranged combat at distance.",                                       scalingNotes: "DEX scaling. Each rank adds +2% crit chance for ranged attacks.",               affects: ["ranged_damage", "critical_hit_chance"] },
  { id: "crossbow",      name: "Crossbow",       linkedAttr: "dexterity",    desc: "Heavy crossbows and repeaters. High damage, slower rate of fire.",                                   scalingNotes: "DEX scaling. Higher base damage per bolt than bows.",                           affects: ["ranged_damage", "armor_penetration"] },
  { id: "throwing",      name: "Throwing",       linkedAttr: "dexterity",    desc: "Thrown knives, axes, and grenades. Mid-range burst damage.",                                         scalingNotes: "DEX scaling. Ranks improve accuracy and damage falloff.",                       affects: ["ranged_damage", "accuracy"] },
  { id: "unarmed",       name: "Unarmed",        linkedAttr: "dexterity",    desc: "Fists, grappling, and martial arts. Fast attacks, low energy cost.",                                 scalingNotes: "DEX scaling. Ranks increase unarmed base damage significantly.",                affects: ["attack_power", "attack_speed"] },
  { id: "shields",       name: "Shield",         linkedAttr: "strength",     desc: "Shield blocking and bash techniques. Core defensive combat skill.",                                  scalingNotes: "STR scaling. Each rank adds +3% block chance and +1 damage reduction.",         affects: ["block_chance", "defense"] },
  { id: "parry",         name: "Parry",          linkedAttr: "dexterity",    desc: "Deflecting incoming melee attacks with your weapon. Rewards timing and finesse.",                     scalingNotes: "DEX scaling. Each rank adds +4% parry chance. Parried attacks deal 0 damage.",  affects: ["parry_chance", "defense"] },
  { id: "dodge",         name: "Dodge",          linkedAttr: "dexterity",    desc: "Reflexive movement to avoid attacks entirely. Light armor synergy.",                                 scalingNotes: "DEX scaling. Each rank adds +2% evasion.",                                      affects: ["evasion"] },
  { id: "heavy_armor",   name: "Heavy Armor",    linkedAttr: "constitution", desc: "Plate and full armor proficiency. Maximum physical damage reduction.",                               scalingNotes: "CON scaling. Reduces armor penalty and increases damage reduction.",            affects: ["defense", "damage_reduction"] },
  { id: "light_armor",   name: "Light Armor",    linkedAttr: "dexterity",    desc: "Leather, chain, and padded armor. Mobility with moderate protection.",                               scalingNotes: "DEX scaling. Preserves evasion while granting defense.",                        affects: ["defense", "evasion"] },
  { id: "tactics",       name: "Tactics",        linkedAttr: "intelligence", desc: "Battle strategy, positioning, and coordination. Improves all combat outcomes.",                      scalingNotes: "INT scaling. Broad +1% to hit and crit per rank.",                              affects: ["accuracy", "critical_hit_chance"] },
];

// ─── MAGIC SKILLS ────────────────────────────────────────────────────────────

export const MAGIC_SKILLS = [
  { id: "elemental",    name: "Elemental",    linkedAttr: "intelligence", desc: "Command of fire, ice, lightning, and earth. Raw magical destruction.",                               scalingNotes: "INT scaling. Each rank adds +3 magic power for elemental spells.",              affects: ["magic_power", "elemental_damage"] },
  { id: "restoration",  name: "Restoration",  linkedAttr: "wisdom",       desc: "Healing magic and cleansing curses. The cornerstone of support.",                                    scalingNotes: "WIS scaling. Each rank adds +5% healing effectiveness.",                        affects: ["healing_power"] },
  { id: "hexes",        name: "Hexes",        linkedAttr: "intelligence", desc: "Curses, debuffs, and damage-over-time afflictions. Weaken before the kill.",                          scalingNotes: "INT scaling. Increases debuff duration and potency.",                           affects: ["debuff_power", "debuff_duration"] },
  { id: "summoning",    name: "Summoning",    linkedAttr: "wisdom",       desc: "Calling forth creatures and spirits to fight alongside you.",                                         scalingNotes: "WIS scaling. Higher ranks summon stronger entities.",                           affects: ["summon_power"] },
  { id: "warding",      name: "Warding",      linkedAttr: "wisdom",       desc: "Magical barriers, shields, and protective enchantments.",                                            scalingNotes: "WIS scaling. Each rank adds +2 magic defense.",                                affects: ["magic_defense", "defense"] },
  { id: "enchanting",   name: "Enchanting",   linkedAttr: "intelligence", desc: "Infusing weapons and armor with magical properties. Craft enhancement.",                             scalingNotes: "INT scaling. Higher ranks produce more powerful enchantments.",                 affects: ["craft_quality", "magic_power"] },
  { id: "arcana",       name: "Arcana",       linkedAttr: "intelligence", desc: "Theoretical magic knowledge. Governs spell identification and ritual casting.",                      scalingNotes: "INT scaling. Reduces spell energy cost at higher ranks.",                       affects: ["spell_efficiency", "magic_power"] },
];

// ─── WORLD / CRAFT / TRADE SKILLS ────────────────────────────────────────────

export const WORLD_SKILLS = [
  { id: "mining",         name: "Mining",         linkedAttr: "strength",     desc: "Extracting ore, stone, and gems from the earth. Foundation of smithing.",                          scalingNotes: "STR scaling. Higher ranks yield rarer ores.",                                   affects: ["gather_yield"] },
  { id: "smithing",       name: "Smithing",       linkedAttr: "strength",     desc: "Forging weapons and armor at the anvil. The warrior's craft.",                                    scalingNotes: "STR scaling. Each rank improves item quality and unlocks recipes.",             affects: ["craft_quality"] },
  { id: "woodcutting",    name: "Woodcutting",    linkedAttr: "strength",     desc: "Harvesting timber and exotic woods. Essential for carpentry and bows.",                            scalingNotes: "STR scaling. Higher ranks yield rarer wood types.",                             affects: ["gather_yield"] },
  { id: "herbalism",      name: "Herbalism",      linkedAttr: "wisdom",       desc: "Identifying and gathering plants, fungi, and reagents in the wild.",                               scalingNotes: "WIS scaling. Unlocks rare herb locations at higher ranks.",                     affects: ["gather_yield", "alchemy_bonus"] },
  { id: "alchemy",        name: "Alchemy",        linkedAttr: "intelligence", desc: "Brewing potions, elixirs, and poisons from gathered reagents.",                                   scalingNotes: "INT scaling. Higher ranks produce more potent concoctions.",                    affects: ["potion_power", "craft_quality"] },
  { id: "cooking",        name: "Cooking",        linkedAttr: "wisdom",       desc: "Preparing food that grants temporary stat buffs and restores HP.",                                 scalingNotes: "WIS scaling. Higher ranks grant longer and stronger food buffs.",               affects: ["food_buff_power"] },
  { id: "fishing",        name: "Fishing",        linkedAttr: "wisdom",       desc: "Catching fish and aquatic resources. Patience rewarded.",                                          scalingNotes: "WIS scaling. Higher ranks catch rarer fish.",                                   affects: ["gather_yield"] },
  { id: "tracking",       name: "Tracking",       linkedAttr: "wisdom",       desc: "Following tracks, reading signs, and locating creatures or players.",                              scalingNotes: "WIS scaling. Improves detection range on minimap.",                             affects: ["detection_range"] },
  { id: "stealth",        name: "Stealth",        linkedAttr: "dexterity",    desc: "Moving unseen, hiding in shadows, and avoiding detection entirely.",                               scalingNotes: "DEX scaling. Each rank reduces detection radius by 5%.",                        affects: ["stealth_rating", "detection_avoidance"] },
  { id: "lockpicking",    name: "Lockpicking",    linkedAttr: "dexterity",    desc: "Opening locked chests, doors, and containers without keys.",                                      scalingNotes: "DEX scaling. Higher ranks open higher-tier locks.",                             affects: ["lockpick_success"] },
  { id: "persuasion",     name: "Persuasion",     linkedAttr: "charisma",     desc: "Convincing NPCs, negotiating better prices, and resolving conflicts peacefully.",                  scalingNotes: "CHA scaling. Better quest rewards and shop prices.",                            affects: ["trade_efficiency", "quest_reward_bonus"] },
  { id: "intimidation",   name: "Intimidation",   linkedAttr: "charisma",     desc: "Threatening enemies and NPCs to gain advantages or cause fear.",                                   scalingNotes: "CHA scaling. Can cause enemies to flee or hesitate in combat.",                 affects: ["fear_chance"] },
  { id: "trading",        name: "Trading",        linkedAttr: "charisma",     desc: "Buying low, selling high. Market mastery and price negotiation.",                                  scalingNotes: "CHA scaling. Each rank improves buy/sell margins.",                             affects: ["trade_efficiency"] },
  { id: "crafting",       name: "Crafting",       linkedAttr: "dexterity",    desc: "General item creation — furniture, tools, and components.",                                        scalingNotes: "DEX scaling. Broad crafting quality improvement.",                              affects: ["craft_quality"] },
  { id: "leadership",     name: "Leadership",     linkedAttr: "charisma",     desc: "Commanding followers, inspiring allies, and boosting group performance.",                          scalingNotes: "CHA scaling. Party-wide stat bonuses at high ranks.",                           affects: ["party_bonus"] },
  { id: "navigation",     name: "Navigation",     linkedAttr: "intelligence", desc: "Reading maps, finding paths, and reducing travel time between zones.",                            scalingNotes: "INT scaling. Faster movement speed on roads.",                                  affects: ["movement_speed"] },
  { id: "healing",        name: "Healing",        linkedAttr: "wisdom",       desc: "First aid, bandaging, and basic wound treatment without magic.",                                   scalingNotes: "WIS scaling. Increases non-magical healing amounts.",                           affects: ["healing_power"] },
  { id: "survival",       name: "Survival",       linkedAttr: "wisdom",       desc: "Thriving in harsh environments. Reduces death penalty and improves regen.",                        scalingNotes: "WIS scaling. Reduces death XP/gold loss.",                                      affects: ["death_penalty_reduction"] },
];

// ─── SKILL CATEGORIES ─────────────────────────────────────────────────────────

export const SKILL_CATEGORIES = {
  combat:      { label: "Combat",         skills: COMBAT_SKILLS },
  magic:       { label: "Magic",          skills: MAGIC_SKILLS },
  world_craft: { label: "World & Craft",  skills: WORLD_SKILLS },
};

// ─── UTILITY ──────────────────────────────────────────────────────────────────

export const ALL_SKILLS = [...COMBAT_SKILLS, ...MAGIC_SKILLS, ...WORLD_SKILLS];

export function getSkillById(skillId) {
  return ALL_SKILLS.find(s => s.id === skillId);
}

export function getSkillsByCategory(categoryId) {
  return SKILL_CATEGORIES[categoryId]?.skills || [];
}

export function getLinkedAttribute(skillId) {
  const skill = getSkillById(skillId);
  return skill?.linkedAttr || "wisdom";
}

// ─── CLASS + RACE RECOMMENDED SKILLS ──────────────────────────────────────────

const CLASS_RECOMMENDED = {
  warrior:   ["one_handed", "shields", "heavy_armor", "two_handed", "tactics"],
  hunter:    ["archery", "tracking", "stealth", "dodge", "light_armor"],
  healer:    ["restoration", "warding", "healing", "herbalism", "arcana"],
  wizard:    ["elemental", "arcana", "hexes", "enchanting", "warding"],
  merchant:  ["trading", "persuasion", "crafting", "leadership", "navigation"],
  craftsman: ["smithing", "mining", "crafting", "woodcutting", "alchemy"],
};

const RACE_RECOMMENDED = {
  human:      ["tactics", "persuasion"],
  elf:        ["archery", "arcana", "elemental"],
  dwarf:      ["mining", "smithing", "heavy_armor", "shields"],
  halfling:   ["stealth", "lockpicking", "dodge", "trading"],
  orc:        ["two_handed", "heavy_armor", "intimidation"],
  half_giant: ["two_handed", "unarmed", "heavy_armor"],
};

/**
 * Get recommended skill IDs for a class + race combo. Non-binding hints.
 */
export function getRecommendedSkills(classId, raceId) {
  const classRec = CLASS_RECOMMENDED[classId] || [];
  const raceRec = RACE_RECOMMENDED[raceId] || [];
  const combined = new Set([...classRec, ...raceRec]);
  return Array.from(combined);
}