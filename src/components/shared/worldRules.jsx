/**
 * WORLD RULES — Single source of truth for PvP legality, death penalties, and respawn.
 *
 * All combat initiation MUST validate through canAttack().
 * All death handling MUST route through applyDeathPenalty() + getRespawnLocation().
 *
 * Zone PvP types:
 *   safe       — No PvP allowed. High Bastion.
 *   contested  — PvP allowed but with reputation consequences.
 *   hostile    — Full PvP, no guards, no consequences.
 */

import { getZoneAt } from "@/components/shared/worldZones";

// ─── PVP RULES ────────────────────────────────────────────────────────────────

/**
 * Can attacker attack target at the given location?
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target (character, monster, NPC)
 * @param {number} x - Target's x position
 * @param {number} y - Target's y position
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canAttack(attacker, target, x, y) {
  if (!attacker || !target) {
    return { allowed: false, reason: "invalid_entities" };
  }

  // Dead entities can't attack or be attacked
  if ((attacker.hp || 0) <= 0) {
    return { allowed: false, reason: "attacker_dead" };
  }
  if (target.is_alive === false || (target.hp !== undefined && target.hp <= 0)) {
    return { allowed: false, reason: "target_dead" };
  }

  // Monsters are always attackable
  if (target.type === "monster" || target.monster_type) {
    return { allowed: true, reason: null };
  }

  // PvP: check zone rules
  const zone = getZoneAt(x, y);
  const pvpRule = zone?.pvp || "hostile";

  if (pvpRule === "safe") {
    return { allowed: false, reason: "safe_zone" };
  }

  if (pvpRule === "contested") {
    // Allowed but will have reputation consequences
    return { allowed: true, reason: "contested_zone_pvp" };
  }

  // hostile zone — full PvP
  return { allowed: true, reason: null };
}

/**
 * Check if initiating PvP in a contested zone would have rep consequences.
 */
export function getPvpConsequence(attackerZoneX, attackerZoneY) {
  const zone = getZoneAt(attackerZoneX, attackerZoneY);
  if (!zone) return "none";
  if (zone.pvp === "contested") return "reputation_loss";
  return "none";
}

/**
 * Check if a location is in a safe zone (no PvP).
 */
export function isSafeZone(x, y) {
  const zone = getZoneAt(x, y);
  if (!zone) return false;
  return zone.pvp === "safe";
}

// ─── DEATH & RESPAWN ──────────────────────────────────────────────────────────

/**
 * Respawn locations by zone. Defaults to High Bastion center.
 */
const RESPAWN_POINTS = {
  high_bastion:     { x: 30, y: 25, name: "High Bastion Shrine" },
  the_thornwild:    { x: 10, y: 13, name: "Thornbound Altar" },
  kharum_deep:      { x: 49, y: 12, name: "Oathbound Gate" },
  greyfen_reach:    { x: 10, y: 38, name: "The Drowned Hut" },
  the_ashen_march:  { x: 27, y: 10, name: "Ashfield Crossroads" },
  vale_of_cinders:  { x: 49, y: 35, name: "Cinder Watch" },
  the_sunken_crown: { x: 30, y: 42, name: "Vault Steps" },
};

const DEFAULT_RESPAWN = { x: 30, y: 25, name: "High Bastion Shrine" };

/**
 * Get respawn location for a character based on where they died.
 * @param {string|null} zoneId - Zone where death occurred
 * @returns {{ x: number, y: number, name: string }}
 */
export function getRespawnLocation(zoneId) {
  return RESPAWN_POINTS[zoneId] || DEFAULT_RESPAWN;
}

/**
 * Calculate death penalty. Returns updates to apply to character.
 * @param {Object} character - The dead character
 * @param {string|null} zoneId - Zone where death occurred
 * @param {string} killerType - "monster" | "player" | "environment"
 * @returns {Object} Updates to apply: { x, y, hp, gold, xp, ... }
 */
export function applyDeathPenalty(character, zoneId, killerType = "monster") {
  const respawn = getRespawnLocation(zoneId);
  const maxHp = character.max_hp || 100;

  // Base penalties
  let hpPercent = 0.50;     // Respawn at 50% HP
  let goldLossPercent = 0.10; // Lose 10% gold
  let xpLossPercent = 0.0;   // No XP loss by default

  // Harsher penalties in hostile zones
  const zone = zoneId ? getZoneAt(respawn.x, respawn.y) : null;
  const pvpRule = zone?.pvp || "hostile";

  if (killerType === "player") {
    // PvP death: harsher
    hpPercent = 0.30;
    goldLossPercent = 0.15;
  }

  if (pvpRule === "hostile") {
    goldLossPercent += 0.05;
    xpLossPercent = 0.02;
  }

  const newGold = Math.floor((character.gold || 0) * (1 - goldLossPercent));
  const newXp = Math.max(0, Math.floor((character.xp || 0) * (1 - xpLossPercent)));
  const newHp = Math.max(1, Math.floor(maxHp * hpPercent));

  return {
    x: respawn.x,
    y: respawn.y,
    hp: newHp,
    gold: newGold,
    xp: newXp,
    energy: 20, // Low energy on respawn
  };
}

// ─── ZONE TRANSITION RULES ──────────────────────────────────────────────────

/**
 * Check if entering a zone triggers any warnings or effects.
 */
export function getZoneEntryEffect(fromZoneId, toZoneId) {
  if (!toZoneId) return null;

  // Could extend with level requirements, faction requirements, etc.

  return {
    zoneId: toZoneId,
    warning: null,
  };
}

// ─── LOOT RULES ──────────────────────────────────────────────────────────────

/**
 * Who gets loot rights on a kill?
 * For now: killer gets everything. Future: party split, contribution tracking.
 */
export function getLootRights(killerId, participantIds) {
  return {
    primaryLooter: killerId,
    splitType: "winner_takes_all",
  };
}