// ── FURNITURE CATALOG ─────────────────────────────────────────────────────────
export const FURNITURE = [
  // Decorations
  { id: "candle",       name: "Candle",          emoji: "🕯️",  type: "decoration", cost: 10,  bonus: null },
  { id: "bookshelf",    name: "Bookshelf",        emoji: "📚",  type: "decoration", cost: 30,  bonus: "+5% XP from research" },
  { id: "trophy_wolf",  name: "Wolf Trophy",      emoji: "🐺",  type: "trophy",     cost: 50,  bonus: "+2 intimidation" },
  { id: "fireplace",    name: "Fireplace",        emoji: "🔥",  type: "decoration", cost: 60,  bonus: "+10 HP restore/rest" },
  { id: "banner",       name: "Guild Banner",     emoji: "🚩",  type: "decoration", cost: 25,  bonus: null },
  { id: "rug",          name: "Fine Rug",         emoji: "🟫",  type: "decoration", cost: 20,  bonus: null },
  { id: "mirror",       name: "Magic Mirror",     emoji: "🪞",  type: "decoration", cost: 80,  bonus: "+5% gold from trading" },
  { id: "chest",        name: "Storage Chest",    emoji: "📦",  type: "storage",    cost: 40,  bonus: "+10 storage slots" },
  { id: "vault",        name: "Iron Vault",       emoji: "🔒",  type: "storage",    cost: 120, bonus: "+25 storage slots" },
  { id: "bed",          name: "Bed",              emoji: "🛏️",  type: "bed",        cost: 50,  bonus: "Full HP restore on rest" },
  { id: "throne",       name: "Throne",           emoji: "👑",  type: "decoration", cost: 200, bonus: "+10% leadership" },
  // Crafting stations
  { id: "small_forge",  name: "Small Forge",      emoji: "⚒️",  type: "crafting_station", cost: 150, bonus: "Forge in home", crafting_station: "forge" },
  { id: "alchemy_table",name: "Alchemy Table",    emoji: "⚗️",  type: "crafting_station", cost: 150, bonus: "Alchemy in home", crafting_station: "alchemy" },
  { id: "workbench_h",  name: "Workbench",        emoji: "🪵",  type: "crafting_station", cost: 100, bonus: "Workbench in home", crafting_station: "workbench" },
  // Pet furniture
  { id: "pet_bed",      name: "Pet Bed",          emoji: "🐾",  type: "decoration", cost: 30,  bonus: "+5 pet bond/day" },
  { id: "pet_bowl",     name: "Pet Food Bowl",    emoji: "🥣",  type: "decoration", cost: 15,  bonus: "Pet stays happy" },
];

// ── HOUSE TIERS ───────────────────────────────────────────────────────────────
export const HOUSE_TIERS = {
  hut:     { name: "Hut",     emoji: "🛖",  slots: 4,  cost: 100,  max_storage: 10 },
  cottage: { name: "Cottage", emoji: "🏠",  slots: 8,  cost: 300,  max_storage: 25 },
  house:   { name: "House",   emoji: "🏡",  slots: 12, cost: 800,  max_storage: 50 },
  manor:   { name: "Manor",   emoji: "🏰",  slots: 20, cost: 2000, max_storage: 100 },
  castle:  { name: "Castle",  emoji: "🏯",  slots: 30, cost: 5000, max_storage: 200 },
};

export const TIER_ORDER = ["hut", "cottage", "house", "manor", "castle"];

// ── PET SPECIES ───────────────────────────────────────────────────────────────
export const PET_SPECIES = {
  wolf:            { emoji: "🐺", name: "Wolf",           zone: "dark_forest",    tame_skill: 15, stats: { attack_bonus: 8, defense_bonus: 2, luck_bonus: 0 }, ability: "Pack Hunter: +10% combat when in wolf territory" },
  fox:             { emoji: "🦊", name: "Fox",            zone: "golden_plains",  tame_skill: 8,  stats: { attack_bonus: 3, defense_bonus: 1, luck_bonus: 8 }, ability: "Cunning: +8% gold found" },
  cat:             { emoji: "🐱", name: "Cat",            zone: "town_center",    tame_skill: 3,  stats: { attack_bonus: 1, defense_bonus: 0, luck_bonus: 5 }, ability: "Lucky Charm: minor gold bonus" },
  raven:           { emoji: "🐦‍⬛", name: "Raven",         zone: "dark_forest",    tame_skill: 12, stats: { attack_bonus: 2, defense_bonus: 0, luck_bonus: 10 }, ability: "Omen Reader: +10% XP from quests" },
  dragon_hatchling:{ emoji: "🐲", name: "Dragon Hatchling",zone:"volcanic_badlands",tame_skill: 60, stats: { attack_bonus: 20, defense_bonus: 10, luck_bonus: 5 }, ability: "Flame Breath: chance to deal 15 fire dmg" },
  bear_cub:        { emoji: "🐻", name: "Bear Cub",       zone: "iron_hills",     tame_skill: 20, stats: { attack_bonus: 5, defense_bonus: 12, luck_bonus: 0 }, ability: "Protector: absorbs 5 dmg per hit" },
  owl:             { emoji: "🦉", name: "Owl",            zone: "dark_forest",    tame_skill: 10, stats: { attack_bonus: 0, defense_bonus: 0, luck_bonus: 6 }, ability: "Night Vision: reveal hidden enemies" },
  rabbit:          { emoji: "🐰", name: "Rabbit",         zone: "golden_plains",  tame_skill: 2,  stats: { attack_bonus: 0, defense_bonus: 0, luck_bonus: 3 }, ability: "Forager: +5% herb yield" },
  snake:           { emoji: "🐍", name: "Snake",          zone: "cursed_swamp",   tame_skill: 25, stats: { attack_bonus: 8, defense_bonus: 1, luck_bonus: 2 }, ability: "Venom: 30% chance to poison enemy" },
  phoenix:         { emoji: "🔥", name: "Phoenix",        zone: "volcanic_badlands",tame_skill:80, stats: { attack_bonus: 15, defense_bonus: 5, luck_bonus: 15 }, ability: "Rebirth: revive with 30% HP once per day" },
};

// ── GUILD HALL TIERS ──────────────────────────────────────────────────────────
export const GUILD_HALL_TIERS = [
  { tier: 0, name: "None",      emoji: "",    members_needed: 0,  cost: { wood: 0,   stone: 0,   iron_ore: 0  }, desc: "No hall yet." },
  { tier: 1, name: "Camp",      emoji: "⛺",  members_needed: 2,  cost: { wood: 20,  stone: 5,   iron_ore: 0  }, desc: "A temporary camp. Basic meeting place." },
  { tier: 2, name: "Hall",      emoji: "🏚️",  members_needed: 5,  cost: { wood: 50,  stone: 30,  iron_ore: 10 }, desc: "A proper hall with shared storage and guild chat." },
  { tier: 3, name: "Keep",      emoji: "🏰",  members_needed: 10, cost: { wood: 100, stone: 100, iron_ore: 50 }, desc: "A fortified keep. Can claim territory and found a town." },
  { tier: 4, name: "Fortress",  emoji: "🏯",  members_needed: 20, cost: { wood: 200, stone: 300, iron_ore: 150, gold_ore: 20 }, desc: "A fortress capable of fielding armies and waging war." },
  { tier: 5, name: "Citadel",   emoji: "🗼",  members_needed: 50, cost: { wood: 500, stone: 800, iron_ore: 400, gold_ore: 100 }, desc: "The supreme military and civic center of the realm." },
];

// ── WAR TRIGGERS ──────────────────────────────────────────────────────────────
export const WAR_TRIGGERS = [
  { id: "resource_scarcity",  label: "Resource Scarcity",   desc: "The guild demands access to {zone} resources controlled by the enemy." },
  { id: "territorial_dispute",label: "Territorial Dispute",  desc: "Both guilds claim overlapping territory near {zone}." },
  { id: "honor_insult",       label: "Honor Insult",         desc: "A member was dishonored by agents of the enemy guild." },
  { id: "alliance_betrayal",  label: "Alliance Betrayal",    desc: "The enemy broke a previous alliance agreement." },
  { id: "conquest",           label: "Pure Conquest",        desc: "The guild seeks to expand its dominion by force." },
];