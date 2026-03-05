/**
 * Crafting system data: resources, recipes, items.
 */

// ─── RESOURCES ────────────────────────────────────────────────────────────────
export const RESOURCES = {
  wood:         { id: "wood",          name: "Wood",           emoji: "🪵", rarity: "common",    zones: ["dark_forest", "golden_plains", "town_center"] },
  stone:        { id: "stone",         name: "Stone",          emoji: "🪨", rarity: "common",    zones: ["iron_hills", "coastal_ruins"] },
  iron_ore:     { id: "iron_ore",      name: "Iron Ore",       emoji: "⚙️", rarity: "uncommon",  zones: ["iron_hills"] },
  gold_ore:     { id: "gold_ore",      name: "Gold Ore",       emoji: "✨", rarity: "rare",      zones: ["iron_hills"] },
  coal:         { id: "coal",          name: "Coal",           emoji: "⬛", rarity: "common",    zones: ["iron_hills"] },
  herb:         { id: "herb",          name: "Herb",           emoji: "🌿", rarity: "common",    zones: ["dark_forest", "golden_plains", "town_center"] },
  mushroom:     { id: "mushroom",      name: "Mushroom",       emoji: "🍄", rarity: "uncommon",  zones: ["dark_forest", "cursed_swamp"] },
  poison_herb:  { id: "poison_herb",   name: "Poison Herb",    emoji: "☠️", rarity: "uncommon",  zones: ["cursed_swamp"] },
  slime:        { id: "slime",         name: "Slime",          emoji: "🟢", rarity: "common",    zones: ["cursed_swamp"] },
  bone:         { id: "bone",          name: "Bone",           emoji: "🦴", rarity: "common",    zones: ["dark_forest", "cursed_swamp"] },
  leather:      { id: "leather",       name: "Leather",        emoji: "🟫", rarity: "common",    zones: ["golden_plains", "dark_forest"] },
  wheat:        { id: "wheat",         name: "Wheat",          emoji: "🌾", rarity: "common",    zones: ["golden_plains"] },
  sea_salt:     { id: "sea_salt",      name: "Sea Salt",       emoji: "🧂", rarity: "uncommon",  zones: ["coastal_ruins"] },
  pearl:        { id: "pearl",         name: "Pearl",          emoji: "🫧", rarity: "rare",      zones: ["coastal_ruins"] },
  ancient_relic:{ id: "ancient_relic", name: "Ancient Relic",  emoji: "🏺", rarity: "rare",      zones: ["coastal_ruins"] },
  fire_crystal: { id: "fire_crystal",  name: "Fire Crystal",   emoji: "🔥", rarity: "rare",      zones: ["volcanic_badlands"] },
  obsidian:     { id: "obsidian",      name: "Obsidian",       emoji: "🖤", rarity: "uncommon",  zones: ["volcanic_badlands"] },
  sulfur:       { id: "sulfur",        name: "Sulfur",         emoji: "💛", rarity: "common",    zones: ["volcanic_badlands"] },
  dragon_scale: { id: "dragon_scale",  name: "Dragon Scale",   emoji: "🐉", rarity: "legendary", zones: ["volcanic_badlands"] },
};

// ─── CRAFTING STATIONS ────────────────────────────────────────────────────────
export const CRAFTING_STATIONS = {
  forge:      { id: "forge",      name: "Forge",      emoji: "⚒️",  desc: "Smelt metals and craft weapons & armor." },
  alchemy:    { id: "alchemy",    name: "Alchemy Lab",emoji: "⚗️",  desc: "Brew potions, poisons, and elixirs." },
  workbench:  { id: "workbench",  name: "Workbench",  emoji: "🪵",  desc: "Craft tools, bows, and wooden items." },
  hand:       { id: "hand",       name: "By Hand",    emoji: "🤲",  desc: "Simple crafting, no station required." },
};

// ─── RECIPES ──────────────────────────────────────────────────────────────────
// skill_required: min crafting skill level
// specialization_bonus: if character has this spec, quality is higher
export const RECIPES = [
  // ── WEAPONS ──
  {
    id: "iron_sword",
    name: "Iron Sword",
    category: "weapon",
    emoji: "⚔️",
    station: "forge",
    ingredients: [{ id: "iron_ore", qty: 3 }, { id: "coal", qty: 1 }, { id: "wood", qty: 1 }],
    skill_required: 5,
    result: { attack_power: 15, durability: 80, rarity: "common" },
    specialization_bonus: "runesmith",
    description: "A sturdy iron blade. Reliable in battle.",
    xp_reward: 30,
  },
  {
    id: "steel_blade",
    name: "Steel Blade",
    category: "weapon",
    emoji: "🗡️",
    station: "forge",
    ingredients: [{ id: "iron_ore", qty: 5 }, { id: "coal", qty: 3 }],
    skill_required: 20,
    result: { attack_power: 28, durability: 120, rarity: "uncommon" },
    specialization_bonus: "runesmith",
    description: "A fine steel blade, tempered to perfection.",
    xp_reward: 60,
  },
  {
    id: "obsidian_dagger",
    name: "Obsidian Dagger",
    category: "weapon",
    emoji: "🗡️",
    station: "forge",
    ingredients: [{ id: "obsidian", qty: 2 }, { id: "leather", qty: 1 }],
    skill_required: 30,
    result: { attack_power: 22, critical_hit_chance: 15, durability: 60, rarity: "uncommon" },
    specialization_bonus: "engineer",
    description: "Razor-sharp volcanic glass. Lethal precision.",
    xp_reward: 75,
  },
  {
    id: "fire_staff",
    name: "Fire Staff",
    category: "weapon",
    emoji: "🔮",
    station: "forge",
    ingredients: [{ id: "fire_crystal", qty: 2 }, { id: "wood", qty: 3 }, { id: "ancient_relic", qty: 1 }],
    skill_required: 45,
    result: { magic_power: 40, attack_power: 10, durability: 90, rarity: "rare" },
    specialization_bonus: "runesmith",
    description: "A staff imbued with fire crystal energy.",
    xp_reward: 150,
  },
  {
    id: "hunters_bow",
    name: "Hunter's Bow",
    category: "weapon",
    emoji: "🏹",
    station: "workbench",
    ingredients: [{ id: "wood", qty: 4 }, { id: "leather", qty: 2 }],
    skill_required: 8,
    result: { attack_power: 18, evasion: 5, durability: 70, rarity: "common" },
    description: "A reliable recurve bow.",
    xp_reward: 35,
  },
  {
    id: "dragon_sword",
    name: "Dragonfire Blade",
    category: "weapon",
    emoji: "🐉",
    station: "forge",
    ingredients: [{ id: "dragon_scale", qty: 2 }, { id: "fire_crystal", qty: 3 }, { id: "gold_ore", qty: 2 }],
    skill_required: 70,
    result: { attack_power: 65, magic_power: 30, critical_hit_chance: 20, durability: 200, rarity: "legendary" },
    specialization_bonus: "runesmith",
    description: "Forged in dragonfire. Legendary in power.",
    xp_reward: 500,
  },

  // ── ARMOR ──
  {
    id: "leather_vest",
    name: "Leather Vest",
    category: "armor",
    emoji: "🥋",
    station: "workbench",
    ingredients: [{ id: "leather", qty: 4 }, { id: "bone", qty: 1 }],
    skill_required: 3,
    result: { defense: 12, evasion: 5, durability: 60, rarity: "common" },
    description: "Light protection for scouts and hunters.",
    xp_reward: 20,
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    category: "armor",
    emoji: "🛡️",
    station: "forge",
    ingredients: [{ id: "iron_ore", qty: 4 }, { id: "coal", qty: 2 }],
    skill_required: 12,
    result: { defense: 25, durability: 100, rarity: "common" },
    specialization_bonus: "runesmith",
    description: "A solid iron shield, standard issue.",
    xp_reward: 45,
  },
  {
    id: "obsidian_armor",
    name: "Obsidian Plate",
    category: "armor",
    emoji: "🖤",
    station: "forge",
    ingredients: [{ id: "obsidian", qty: 5 }, { id: "iron_ore", qty: 3 }, { id: "dragon_scale", qty: 1 }],
    skill_required: 55,
    result: { defense: 55, evasion: 8, durability: 180, rarity: "rare" },
    specialization_bonus: "runesmith",
    description: "Dark and nearly impenetrable volcanic plate.",
    xp_reward: 200,
  },
  {
    id: "pearl_robe",
    name: "Pearl Robe",
    category: "armor",
    emoji: "🫧",
    station: "workbench",
    ingredients: [{ id: "pearl", qty: 3 }, { id: "sea_salt", qty: 2 }, { id: "leather", qty: 2 }],
    skill_required: 35,
    result: { magic_power: 20, defense: 15, healing_power: 15, durability: 80, rarity: "uncommon" },
    description: "A shimmering robe that enhances magical ability.",
    xp_reward: 100,
  },

  // ── CONSUMABLES ──
  {
    id: "health_potion",
    name: "Health Potion",
    category: "consumable",
    emoji: "🧪",
    station: "alchemy",
    ingredients: [{ id: "herb", qty: 2 }, { id: "mushroom", qty: 1 }],
    skill_required: 1,
    result: { hp_restore: 35, durability: 1, rarity: "common" },
    specialization_bonus: "alchemist",
    description: "Restores 35 HP when consumed.",
    xp_reward: 15,
  },
  {
    id: "strong_health_potion",
    name: "Strong Health Potion",
    category: "consumable",
    emoji: "❤️‍🔥",
    station: "alchemy",
    ingredients: [{ id: "herb", qty: 4 }, { id: "mushroom", qty: 2 }, { id: "sea_salt", qty: 1 }],
    skill_required: 15,
    result: { hp_restore: 75, durability: 1, rarity: "uncommon" },
    specialization_bonus: "alchemist",
    description: "Restores 75 HP. More concentrated formula.",
    xp_reward: 40,
  },
  {
    id: "poison_vial",
    name: "Poison Vial",
    category: "consumable",
    emoji: "☠️",
    station: "alchemy",
    ingredients: [{ id: "poison_herb", qty: 2 }, { id: "slime", qty: 1 }],
    skill_required: 10,
    result: { debuff: "poison", magnitude: 10, duration: 4, durability: 1, rarity: "common" },
    specialization_bonus: "alchemist",
    description: "Apply to weapon or throw at enemy. Deals 10 dmg/round for 4 rounds.",
    xp_reward: 30,
  },
  {
    id: "strength_elixir",
    name: "Strength Elixir",
    category: "consumable",
    emoji: "💪",
    station: "alchemy",
    ingredients: [{ id: "herb", qty: 2 }, { id: "fire_crystal", qty: 1 }, { id: "wheat", qty: 2 }],
    skill_required: 25,
    result: { buff: "attack_power", magnitude: 20, duration: 5, durability: 1, rarity: "uncommon" },
    specialization_bonus: "alchemist",
    description: "+20 attack power for 5 rounds.",
    xp_reward: 60,
  },
  {
    id: "antidote",
    name: "Antidote",
    category: "consumable",
    emoji: "💊",
    station: "alchemy",
    ingredients: [{ id: "herb", qty: 2 }, { id: "sea_salt", qty: 1 }],
    skill_required: 5,
    result: { removes_debuff: true, durability: 1, rarity: "common" },
    specialization_bonus: "alchemist",
    description: "Removes one poison or disease debuff.",
    xp_reward: 20,
  },
  {
    id: "bread",
    name: "Bread",
    category: "consumable",
    emoji: "🍞",
    station: "hand",
    ingredients: [{ id: "wheat", qty: 3 }],
    skill_required: 1,
    result: { hp_restore: 15, durability: 1, rarity: "common" },
    description: "Simple food. Restores 15 HP.",
    xp_reward: 8,
  },

  // ── TOOLS ──
  {
    id: "mining_pick",
    name: "Mining Pick",
    category: "tool",
    emoji: "⛏️",
    station: "forge",
    ingredients: [{ id: "iron_ore", qty: 2 }, { id: "wood", qty: 2 }],
    skill_required: 5,
    result: { resource_bonus: "iron_ore", bonus_pct: 50, durability: 100, rarity: "common" },
    description: "+50% iron ore when mining.",
    xp_reward: 25,
  },
  {
    id: "herbalist_kit",
    name: "Herbalist Kit",
    category: "tool",
    emoji: "🌿",
    station: "workbench",
    ingredients: [{ id: "wood", qty: 2 }, { id: "leather", qty: 1 }, { id: "herb", qty: 2 }],
    skill_required: 5,
    result: { resource_bonus: "herb", bonus_pct: 50, durability: 80, rarity: "common" },
    description: "+50% herbs when gathering.",
    xp_reward: 25,
  },
  {
    id: "rune_inscription",
    name: "Rune Inscription",
    category: "tool",
    emoji: "🔮",
    station: "forge",
    ingredients: [{ id: "ancient_relic", qty: 1 }, { id: "gold_ore", qty: 2 }, { id: "fire_crystal", qty: 1 }],
    skill_required: 50,
    result: { enchant_bonus: 30, durability: 50, rarity: "rare" },
    specialization_bonus: "runesmith",
    description: "Apply to a weapon or armor for +30 to its primary stat.",
    xp_reward: 150,
  },
];

// ── FURNITURE RECIPES (crafted via workbench/forge) ─────────────────────────
export const FURNITURE_RECIPES = [
  {
    id: "crafted_candle",        name: "Handmade Candle",     emoji: "🕯️",  category: "furniture",
    station: "hand",             skill_required: 1,           xp_reward: 5,
    ingredients: [{ id: "wood", qty: 1 }],
    result: { furniture_id: "candle", rarity: "common" },
    description: "A simple candle carved from wood and tallow.",
  },
  {
    id: "crafted_bookshelf",     name: "Carved Bookshelf",    emoji: "📚",  category: "furniture",
    station: "workbench",        skill_required: 8,           xp_reward: 30,
    ingredients: [{ id: "wood", qty: 5 }, { id: "iron_ore", qty: 1 }],
    result: { furniture_id: "bookshelf", rarity: "common" },
    description: "A sturdy oak bookshelf. Provides a study bonus.",
  },
  {
    id: "crafted_fireplace",     name: "Stone Fireplace",     emoji: "🔥",  category: "furniture",
    station: "forge",            skill_required: 15,          xp_reward: 60,
    ingredients: [{ id: "stone", qty: 8 }, { id: "iron_ore", qty: 2 }, { id: "coal", qty: 3 }],
    result: { furniture_id: "fireplace", rarity: "uncommon" },
    description: "A hand-built stone fireplace. Warms the home and restores HP on rest.",
  },
  {
    id: "crafted_chest",         name: "Oak Storage Chest",   emoji: "📦",  category: "furniture",
    station: "workbench",        skill_required: 5,           xp_reward: 20,
    ingredients: [{ id: "wood", qty: 4 }, { id: "iron_ore", qty: 1 }],
    result: { furniture_id: "chest", rarity: "common" },
    description: "A lockable storage chest. Expands home storage.",
  },
  {
    id: "crafted_vault",         name: "Iron Vault",          emoji: "🔒",  category: "furniture",
    station: "forge",            skill_required: 30,          xp_reward: 120,
    ingredients: [{ id: "iron_ore", qty: 8 }, { id: "gold_ore", qty: 2 }, { id: "coal", qty: 4 }],
    result: { furniture_id: "vault", rarity: "rare" },
    description: "A heavy iron vault for securing valuables.",
  },
  {
    id: "crafted_throne",        name: "Dragon-Bone Throne",  emoji: "👑",  category: "furniture",
    station: "workbench",        skill_required: 50,          xp_reward: 300,
    specialization_bonus: "engineer",
    ingredients: [{ id: "bone", qty: 10 }, { id: "dragon_scale", qty: 2 }, { id: "gold_ore", qty: 3 }],
    result: { furniture_id: "throne", rarity: "legendary" },
    description: "A throne of bone and dragonscale. Radiates power.",
  },
];

// ── GUILD ITEM RECIPES ────────────────────────────────────────────────────────
export const GUILD_RECIPES = [
  {
    id: "guild_banner_cloth",    name: "Guild Battle Banner", emoji: "🚩",  category: "guild_item",
    station: "workbench",        skill_required: 12,          xp_reward: 50,
    ingredients: [{ id: "leather", qty: 3 }, { id: "wood", qty: 2 }, { id: "iron_ore", qty: 1 }],
    result: { guild_bonus: "war_score_bonus", magnitude: 5, rarity: "uncommon" },
    description: "A battle banner carried into war. Grants +5 war score per raid.",
  },
  {
    id: "siege_ballista",        name: "Siege Ballista",      emoji: "🏹",  category: "guild_item",
    station: "forge",            skill_required: 40,          xp_reward: 200,
    specialization_bonus: "engineer",
    ingredients: [{ id: "wood", qty: 10 }, { id: "iron_ore", qty: 8 }, { id: "coal", qty: 5 }],
    result: { guild_bonus: "siege_power", magnitude: 25, rarity: "rare" },
    description: "A siege weapon. Dramatically increases raid victory chance.",
  },
  {
    id: "guild_treasury_lock",   name: "Treasury Vault Lock", emoji: "🔐",  category: "guild_item",
    station: "forge",            skill_required: 20,          xp_reward: 80,
    ingredients: [{ id: "iron_ore", qty: 5 }, { id: "gold_ore", qty: 1 }],
    result: { guild_bonus: "treasury_protection", magnitude: 50, rarity: "uncommon" },
    description: "A master lock for the guild treasury. Harder to raid.",
  },
];

export const ALL_RECIPES = [...RECIPES, ...FURNITURE_RECIPES, ...GUILD_RECIPES];

export function getRecipesByStation(stationId) {
  return ALL_RECIPES.filter(r => r.station === stationId);
}

export function getRecipesByCategory(category) {
  return RECIPES.filter(r => r.category === category);
}

export function canCraft(recipe, inventory, craftingSkill) {
  if (craftingSkill < recipe.skill_required) return { can: false, reason: `Need crafting skill ${recipe.skill_required}` };
  for (const ing of recipe.ingredients) {
    const inInv = (inventory || []).find(i => i.id === ing.id);
    if (!inInv || (inInv.qty || 0) < ing.qty) {
      return { can: false, reason: `Need ${ing.qty}x ${ing.id.replace(/_/g, " ")}` };
    }
  }
  return { can: true, reason: "" };
}

/**
 * Calculate quality tier based on skill vs requirement.
 * Returns: "poor" | "normal" | "fine" | "masterwork"
 */
export function calcQuality(craftingSkill, recipe, hasSpecBonus) {
  if (hasSpecBonus) return "masterwork";
  const ratio = craftingSkill / Math.max(recipe.skill_required, 1);
  if (ratio >= 3) return "fine";
  if (ratio >= 1.5) return "normal";
  return "poor";
}

/** Quality multipliers for numeric stat bonuses */
const QUALITY_MULT = { poor: 0.75, normal: 1.0, fine: 1.15, masterwork: 1.35 };

/** Apply crafting to inventory: remove ingredients, add result item. */
export function craftItem(recipe, inventory, hasSpecBonus, craftingSkill = 1) {
  let inv = [...(inventory || [])];

  // Remove ingredients
  for (const ing of recipe.ingredients) {
    const idx = inv.findIndex(i => i.id === ing.id);
    if (idx >= 0) {
      inv[idx] = { ...inv[idx], qty: inv[idx].qty - ing.qty };
      if (inv[idx].qty <= 0) inv.splice(idx, 1);
    }
  }

  // Quality modifier based on skill level and specialization
  const quality = calcQuality(craftingSkill, recipe, hasSpecBonus);
  const mult = QUALITY_MULT[quality] || 1.0;
  const result = { ...recipe.result };
  if (mult !== 1.0) {
    for (const key of Object.keys(result)) {
      if (typeof result[key] === "number" && !["durability", "duration"].includes(key)) {
        result[key] = Math.floor(result[key] * mult);
      }
    }
  }

  // Add crafted item to inventory
  const existingIdx = inv.findIndex(i => i.id === recipe.id && i.quality === quality);
  if (existingIdx >= 0 && recipe.category === "consumable") {
    inv[existingIdx] = { ...inv[existingIdx], qty: (inv[existingIdx].qty || 1) + 1 };
  } else {
    inv.push({
      id: recipe.id,
      name: recipe.name,
      emoji: recipe.emoji,
      category: recipe.category,
      quality,
      qty: 1,
      equipped: false,
      ...result,
    });
  }

  return inv;
}