/**
 * VAELRATH — World Zones, Points of Interest, and Terrain
 * Single source of truth for map layout.
 *
 * World: Vaelrath
 * Catastrophe: The Sundering of the Vault
 * Old Age: The Concordant Age
 * Current Era: The Age of Ash and Banners
 */

export const MAP_W = 60;
export const MAP_H = 50;
export const TILE_SIZE = 20;

// ─── FACTIONS ─────────────────────────────────────────────────────────────────
export const FACTIONS = {
  bastion_compact:   { id: "bastion_compact",   name: "The Bastion Compact",    emoji: "🛡️", desc: "Defensive alliance of safeholds. Order through walls and law." },
  ash_banner_hosts:  { id: "ash_banner_hosts",  name: "The Ash Banner Hosts",   emoji: "🔥", desc: "Martial houses and frontier warbands. Strength earns standing." },
  veiled_synod:      { id: "veiled_synod",      name: "The Veiled Synod",       emoji: "👁️", desc: "Religious and scholarly power. Keepers of doctrine and secrets." },
  ember_throne:      { id: "ember_throne",      name: "The Ember Throne",       emoji: "👑", desc: "Imperial remnant claimant. Legitimacy through bloodline." },
  iron_oath:         { id: "iron_oath",         name: "The Iron Oath",          emoji: "⚒️", desc: "Dwarven fortress-keepers and road wardens. Oaths are binding." },
  free_spears:       { id: "free_spears",       name: "The Free Spears",        emoji: "⚔️", desc: "Mercenary companies. Coin over cause, but honor among sellswords." },
};

export const INSTITUTIONS = {
  lantern_creed:      { id: "lantern_creed",      name: "The Lantern Creed",       emoji: "🏮", desc: "Warding, mercy, civilized light against the dark." },
  vaultkeepers:       { id: "vaultkeepers",       name: "The Vaultkeepers",        emoji: "📜", desc: "Lore-preservers and relic wardens of the old age." },
  starwell_collegium: { id: "starwell_collegium", name: "The Starwell Collegium",  emoji: "⭐", desc: "Sanctioned arcane study. Magic through discipline." },
  thornbound_circle:  { id: "thornbound_circle",  name: "The Thornbound Circle",   emoji: "🌿", desc: "Wild magic, primal wards. Nature answers to no throne." },
};

// ─── ZONES ────────────────────────────────────────────────────────────────────
export const ZONES = [
  {
    id: "high_bastion",
    name: "High Bastion",
    emoji: "🏰",
    x: 22, y: 18, w: 16, h: 14,
    danger: 0,
    color: "#3d5c2e",
    pvp: "safe",
    faction: "bastion_compact",
    description: "The great safehold. Walls of grey stone ring markets, temples, and guild halls. Lantern light holds the dark at bay.",
    resources: ["wood", "stone", "herb"],
    encounter_types: ["npc_merchant", "npc_quest_giver", "festival"],
    zone_type: "safehold",
  },
  {
    id: "the_thornwild",
    name: "The Thornwild",
    emoji: "🌲",
    x: 3, y: 3, w: 14, h: 20,
    danger: 3,
    color: "#1a2e1a",
    pvp: "contested",
    faction: "thornbound_circle",
    description: "Ancient forest. Elven remnants and primal wardens keep watch. Wolves, goblins, and worse hunt beneath the canopy.",
    resources: ["wood", "herb", "mushroom", "bone"],
    encounter_types: ["goblin", "werewolf", "wolf", "herbalist_npc"],
    zone_type: "frontier",
  },
  {
    id: "kharum_deep",
    name: "Kharum Deep",
    emoji: "⛰️",
    x: 42, y: 3, w: 15, h: 18,
    danger: 4,
    color: "#3d3d3d",
    pvp: "contested",
    faction: "iron_oath",
    description: "Mountain holds and deep mines. The Iron Oath keeps the roads, but giants haunt the high passes and trolls guard the ore veins.",
    resources: ["iron_ore", "coal", "stone", "gold_ore"],
    encounter_types: ["troll", "orc", "mine_npc"],
    zone_type: "frontier",
  },
  {
    id: "greyfen_reach",
    name: "Greyfen Reach",
    emoji: "🌿",
    x: 3, y: 30, w: 14, h: 17,
    danger: 5,
    color: "#2a3d1a",
    pvp: "hostile",
    faction: null,
    description: "Wetlands and drowned ruins. Bandits, undead, and things older than memory. No faction claims this place — only survivors.",
    resources: ["poison_herb", "slime", "mushroom", "bone"],
    encounter_types: ["skeleton", "wraith", "vampire", "witch_npc"],
    zone_type: "frontier",
  },
  {
    id: "the_ashen_march",
    name: "The Ashen March",
    emoji: "🌾",
    x: 18, y: 3, w: 18, h: 14,
    danger: 1,
    color: "#4a5a20",
    pvp: "contested",
    faction: "ash_banner_hosts",
    description: "War-scarred plains. Fertile enough to fight over, dangerous enough to forge soldiers. The Ash Banner Hosts drill their companies here.",
    resources: ["wheat", "wood", "herb", "leather"],
    encounter_types: ["bandit", "farmer_npc", "wandering_trader"],
    zone_type: "frontier",
  },
  {
    id: "vale_of_cinders",
    name: "The Vale of Cinders",
    emoji: "🌋",
    x: 42, y: 28, w: 15, h: 19,
    danger: 7,
    color: "#5c1a00",
    pvp: "hostile",
    faction: null,
    description: "Burned land and relic danger. Cinder beasts prowl the scorched earth. Ruin Serpents nest in the caldera. Only the desperate or the mad come here.",
    resources: ["fire_crystal", "obsidian", "sulfur", "dragon_scale"],
    encounter_types: ["dragon", "basilisk", "fire_elemental_npc"],
    zone_type: "frontier",
  },
  {
    id: "the_sunken_crown",
    name: "The Sunken Crown",
    emoji: "🏛️",
    x: 22, y: 38, w: 16, h: 9,
    danger: 4,
    color: "#4a5a6e",
    pvp: "contested",
    faction: "ember_throne",
    description: "The fallen capital. Temple-basin of the old Concordant Age, now half-drowned and haunted. The Ember Throne claims it by right. No one holds it.",
    resources: ["ancient_relic", "sea_salt", "pearl", "stone"],
    encounter_types: ["kraken", "skeleton", "treasure_hunter_npc"],
    zone_type: "frontier",
  },
];

// ─── POINTS OF INTEREST ───────────────────────────────────────────────────────
export const POINTS_OF_INTEREST = [
  // High Bastion (safehold)
  { id: "ironmark_forge",    x: 27, y: 22, emoji: "⚒️",  name: "Ironmark Forge",         zone: "high_bastion",     type: "crafting_station", station: "forge",     npcType: "blacksmith" },
  { id: "synod_apothecary",  x: 32, y: 24, emoji: "⚗️",  name: "Synod Apothecary",       zone: "high_bastion",     type: "crafting_station", station: "alchemy",   npcType: "alchemist" },
  { id: "carpenters_row",    x: 29, y: 29, emoji: "🪵",  name: "Carpenter's Row",        zone: "high_bastion",     type: "crafting_station", station: "workbench", npcType: "merchant" },
  { id: "banner_market",     x: 34, y: 20, emoji: "🏪",  name: "Banner Market",          zone: "high_bastion",     type: "shop",             npcType: "trader" },
  { id: "the_burnt_cup",     x: 24, y: 26, emoji: "🍺",  name: "The Burnt Cup",          zone: "high_bastion",     type: "rest",             hp_restore: 30, npcType: "merchant" },
  { id: "lantern_shrine",    x: 36, y: 28, emoji: "🏮",  name: "Lantern Creed Shrine",   zone: "high_bastion",     type: "heal_station",     npcType: "healer" },
  { id: "warden_barracks",   x: 26, y: 19, emoji: "🛡️",  name: "Warden Barracks",        zone: "high_bastion",     type: "npc",              npcType: "guard" },
  { id: "guild_hall",        x: 33, y: 28, emoji: "🏰",  name: "Hall of Guilds",         zone: "high_bastion",     type: "npc",              npcType: "quest_giver" },
  { id: "gate_north",        x: 30, y: 18, emoji: "🚪",  name: "North Gate",             zone: "high_bastion",     type: "npc",              npcType: "guard" },

  // The Thornwild
  { id: "thornbound_altar",  x: 7,  y: 14, emoji: "🗿",  name: "Thornbound Altar",       zone: "the_thornwild",    type: "mystery",       xp_bonus: 50,  npcType: "witch" },

  // Kharum Deep
  { id: "oathbound_mine",    x: 47, y: 8,  emoji: "⛏️",  name: "Oathbound Mine",         zone: "kharum_deep",      type: "resource_node", resource: "iron_ore" },

  // Vale of Cinders
  { id: "ruin_serpent_lair", x: 50, y: 38, emoji: "🐉",  name: "Ruin Serpent's Lair",    zone: "vale_of_cinders",  type: "boss_encounter" },

  // The Sunken Crown
  { id: "vault_of_echoes",   x: 28, y: 41, emoji: "🏛️",  name: "Vault of Echoes",        zone: "the_sunken_crown", type: "dungeon",       xp_bonus: 200 },

  // The Ashen March
  { id: "ashfield_farm",     x: 24, y: 7,  emoji: "🌾",  name: "Ashfield Homestead",     zone: "the_ashen_march",  type: "resource_node", resource: "wheat" },

  // Greyfen Reach
  { id: "drowned_hut",       x: 8,  y: 38, emoji: "🛖",  name: "The Drowned Hut",        zone: "greyfen_reach",    type: "mystery",       xp_bonus: 75,  npcType: "witch" },
];

// ─── TERRAIN ──────────────────────────────────────────────────────────────────
export const TERRAIN_COLORS = {
  grass:  "#2d5a27",
  forest: "#1a3d1a",
  water:  "#1a3d6e",
  stone:  "#4a4a4a",
  sand:   "#8b7355",
  lava:   "#8b2500",
  swamp:  "#2a3d1a",
  plains: "#4a5a20",
};

export function getTile(x, y) {
  if (x < 2 || y < 2 || x >= MAP_W - 2 || y >= MAP_H - 2) return "water";

  const zone = getZoneAt(x, y);
  if (zone) {
    if (zone.id === "the_thornwild")    return "forest";
    if (zone.id === "kharum_deep")      return "stone";
    if (zone.id === "greyfen_reach")    return "swamp";
    if (zone.id === "the_ashen_march")  return "plains";
    if (zone.id === "vale_of_cinders")  return "lava";
    if (zone.id === "the_sunken_crown") return "sand";
    return "grass";
  }

  const hash = (x * 73 + y * 31 + x * y * 7) % 100;
  if (hash < 5)  return "water";
  if (hash < 12) return "forest";
  if (hash < 17) return "stone";
  if (hash < 22) return "sand";
  return "grass";
}

export function getZoneAt(x, y) {
  return ZONES.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || null;
}

export function getPOIAt(x, y) {
  return POINTS_OF_INTEREST.find(p => p.x === x && p.y === y) || null;
}

export function getPOIsInZone(zoneId) {
  return POINTS_OF_INTEREST.filter(p => p.zone === zoneId);
}

// ─── ZONE PVP RULES ──────────────────────────────────────────────────────────
export function getZonePvpRule(x, y) {
  const zone = getZoneAt(x, y);
  if (!zone) return "hostile"; // wilderness = hostile by default
  return zone.pvp || "contested";
}

// ─── TRAVEL ───────────────────────────────────────────────────────────────────
export function calcTravelSteps(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function moveCost(x, y) {
  const tile = getTile(x, y);
  if (tile === "forest" || tile === "swamp") return 2;
  if (tile === "stone"  || tile === "lava")  return 3;
  return 1;
}

// ─── RANDOM ENCOUNTERS ────────────────────────────────────────────────────────
const ENCOUNTER_TEMPLATES = {
  goblin:              { type: "combat",  label: "Goblin Ambush!",          monster: "goblin",   xp: 30,  gold: 8   },
  orc:                 { type: "combat",  label: "Orc Warband!",            monster: "orc",      xp: 60,  gold: 20  },
  troll:               { type: "combat",  label: "Troll Guards the Path!",  monster: "troll",    xp: 90,  gold: 30  },
  skeleton:            { type: "combat",  label: "Restless Dead!",          monster: "skeleton", xp: 45,  gold: 12  },
  dragon:              { type: "combat",  label: "Ruin Serpent Sighted!",   monster: "dragon",   xp: 250, gold: 100 },
  wraith:              { type: "combat",  label: "Wraith Emerges!",         monster: "wraith",   xp: 75,  gold: 25  },
  werewolf:            { type: "combat",  label: "Beast in the Thornwild!", monster: "werewolf", xp: 80,  gold: 20  },
  wolf:                { type: "combat",  label: "Wolf Pack!",              monster: "goblin",   xp: 20,  gold: 5   },
  bandit:              { type: "combat",  label: "Frontier Bandits!",       monster: "orc",      xp: 40,  gold: 15  },
  basilisk:            { type: "combat",  label: "Cinder Beast!",           monster: "basilisk", xp: 120, gold: 40  },
  vampire:             { type: "combat",  label: "Night Stalker!",          monster: "vampire",  xp: 100, gold: 35  },
  kraken:              { type: "combat",  label: "Drowned Horror!",         monster: "kraken",   xp: 180, gold: 60  },
  npc_merchant:        { type: "npc",     label: "Free Spears Trader",      npc: "merchant",     gold_range: [10, 50] },
  npc_quest_giver:     { type: "npc",     label: "A Citizen Needs Aid",     npc: "quest_giver",  xp: 80  },
  herbalist_npc:       { type: "npc",     label: "Thornbound Herbalist",    npc: "herbalist",    resource: "herb" },
  mine_npc:            { type: "npc",     label: "Iron Oath Miner",         npc: "miner",        resource: "iron_ore" },
  wandering_trader:    { type: "npc",     label: "Caravan Trader",          npc: "trader",       gold_range: [5, 30] },
  farmer_npc:          { type: "npc",     label: "Ashfield Farmer",         npc: "farmer",       resource: "wheat" },
  festival:            { type: "event",   label: "Bastion Festival!",       xp: 40,  gold: 20 },
  treasure_hunter_npc: { type: "npc",     label: "Vaultkeeper Scout",       npc: "hunter",       xp: 50  },
  witch_npc:           { type: "npc",     label: "Fen Witch",               npc: "witch",        xp: 100 },
  fire_elemental_npc:  { type: "npc",     label: "Cinder Spirit",           npc: "spirit",       xp: 120 },
};

export function rollEncounter(zone) {
  if (!zone) return null;
  const roll = Math.random();
  if (roll > 0.35) return null;

  const types = zone.encounter_types || [];
  if (types.length === 0) return null;
  const picked = types[Math.floor(Math.random() * types.length)];
  return ENCOUNTER_TEMPLATES[picked] || null;
}