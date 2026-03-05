const ZONE_DROPS = {
  dark_forest:       ["herb", "wood", "bone", "mushroom"],
  iron_hills:        ["iron_ore", "stone", "coal"],
  cursed_swamp:      ["poison_herb", "slime", "bone", "mushroom"],
  golden_plains:     ["wheat", "wood", "herb", "leather"],
  volcanic_badlands: ["fire_crystal", "obsidian", "sulfur"],
  coastal_ruins:     ["stone", "sea_salt", "ancient_relic"],
  town_center:       ["wood", "stone", "herb"],
};

const ZONE_COMMON_DROPS = {
  herb:         { id: "herb",         name: "Forest Herb",     emoji: "🌿", category: "resource" },
  wood:         { id: "wood",         name: "Wood",            emoji: "🪵", category: "resource" },
  stone:        { id: "stone",        name: "Stone",           emoji: "🪨", category: "resource" },
  leather:      { id: "leather",      name: "Leather Scrap",   emoji: "🟫", category: "resource" },
  bone:         { id: "bone",         name: "Bone Fragment",   emoji: "🦴", category: "resource" },
  iron_ore:     { id: "iron_ore",     name: "Iron Ore",        emoji: "⚫", category: "resource" },
  mushroom:     { id: "mushroom",     name: "Glowing Mushroom",emoji: "🍄", category: "resource" },
  coal:         { id: "coal",         name: "Coal",            emoji: "⬛", category: "resource" },
  wheat:        { id: "wheat",        name: "Wheat",           emoji: "🌾", category: "resource" },
  poison_herb:  { id: "poison_herb",  name: "Poison Herb",     emoji: "☠️", category: "resource" },
  slime:        { id: "slime",        name: "Slime",           emoji: "🟢", category: "resource" },
  fire_crystal: { id: "fire_crystal", name: "Fire Crystal",    emoji: "💎", category: "resource" },
  obsidian:     { id: "obsidian",     name: "Obsidian",        emoji: "🖤", category: "resource" },
  sulfur:       { id: "sulfur",       name: "Sulfur",          emoji: "🌋", category: "resource" },
  sea_salt:     { id: "sea_salt",     name: "Sea Salt",        emoji: "🧂", category: "resource" },
  ancient_relic:{ id: "ancient_relic",name: "Ancient Relic",   emoji: "🏺", category: "material" },
};

const UNCOMMON_DROPS = [
  { id: "health_potion",  name: "Health Potion",     emoji: "🧪", category: "consumable", heals: 40 },
  { id: "energy_potion",  name: "Energy Draught",    emoji: "⚗️", category: "consumable", restores_energy: 30 },
  { id: "iron_ingot",     name: "Iron Ingot",        emoji: "🔩", category: "material" },
  { id: "magic_dust",     name: "Magic Dust",        emoji: "✨", category: "material" },
  { id: "wolf_pelt",      name: "Wolf Pelt",         emoji: "🐾", category: "material" },
];

const RARE_DROPS = [
  { id: "short_sword",  name: "Iron Short Sword",   emoji: "🗡️",  category: "weapon",  rarity: "rare",  stats: { attack_power: 8 } },
  { id: "chain_helm",   name: "Chain Helm",          emoji: "⛑️",  category: "armor",   rarity: "rare",  stats: { defense: 6 } },
  { id: "hunters_bow",  name: "Hunter's Bow",        emoji: "🏹",  category: "weapon",  rarity: "rare",  stats: { attack_power: 7, evasion: 3 } },
  { id: "mage_robe",    name: "Mage's Robe",         emoji: "🥻",  category: "armor",   rarity: "rare",  stats: { magic_power: 10, defense: 2 } },
  { id: "shield_oak",   name: "Oak Shield",          emoji: "🛡️",  category: "armor",   rarity: "rare",  stats: { defense: 12 } },
];

const LEGENDARY_DROPS = [
  { id: "flame_blade",    name: "Flamebrand",        emoji: "🔥", category: "weapon", rarity: "legendary", stats: { attack_power: 25 }, description: "A sword wreathed in eternal flame." },
  { id: "shadow_cloak",   name: "Shadow Cloak",      emoji: "🌑", category: "armor",  rarity: "legendary", stats: { evasion: 25, defense: 8 }, description: "Renders the wearer a ghost." },
  { id: "dragon_heart",   name: "Dragon Heartstone", emoji: "💎", category: "trinket",rarity: "legendary", stats: { max_hp: 50, attack_power: 15 }, description: "Pulses with draconic power." },
  { id: "elder_staff",    name: "Elder Staff",       emoji: "🪄", category: "weapon", rarity: "legendary", stats: { magic_power: 35 }, description: "Wielded by an archmage of old." },
];

export function rollLoot(monster, zone) {
  const roll = Math.random();
  const level = monster?.level || 1;

  if (roll < 0.03) {
    // Legendary
    const item = LEGENDARY_DROPS[Math.floor(Math.random() * LEGENDARY_DROPS.length)];
    return { ...item, rarity: "legendary", qty: 1 };
  } else if (roll < 0.13) {
    // Rare
    const item = RARE_DROPS[Math.floor(Math.random() * RARE_DROPS.length)];
    return { ...item, rarity: "rare", qty: 1 };
  } else if (roll < 0.38) {
    // Uncommon
    const item = UNCOMMON_DROPS[Math.floor(Math.random() * UNCOMMON_DROPS.length)];
    return { ...item, rarity: "uncommon", qty: 1 };
  } else if (roll < 0.97) {
    // Zone-aware common drops
    const zoneId = zone?.id || "town_center";
    const zonePool = ZONE_DROPS[zoneId] || ["wood", "stone", "herb"];
    const dropId = zonePool[Math.floor(Math.random() * zonePool.length)];
    const item = ZONE_COMMON_DROPS[dropId] || ZONE_COMMON_DROPS["stone"];
    const qty = 1 + Math.floor(Math.random() * 2 + Math.floor(level / 5));
    return { ...item, rarity: "common", qty };
  }
  return null; // 3% nothing
}