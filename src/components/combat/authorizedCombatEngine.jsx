/**
 * AUTHORIZED COMBAT ENGINE — Single source of truth for combat initiation,
 * damage calculation, ability use, and death handling.
 *
 * ALL combat entry points (walk-onto, click, Tab+Enter, hotbar) MUST
 * route through initiateCombat() which validates via worldRules.
 *
 * This re-exports the pure math from combatEngine.jsx and adds the
 * authority/validation layer on top.
 */

import { canAttack, applyDeathPenalty, getRespawnLocation } from "@/components/shared/worldRules";
import { getZoneAt } from "@/components/shared/worldZones";

// ─── PURE COMBAT MATH ────────────────────────────────────────────────────────
// Import pure functions from combatEngine.jsx when needed.
// Keep this file focused on authority/validation layer only.

// ─── COMBAT INITIATION ──────────────────────────────────────────────────────

/**
 * Attempt to start combat. Validates through worldRules before allowing.
 *
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target entity
 * @param {boolean} combatModeActive - Is the attacker in combat mode?
 * @returns {{ success: boolean, reason: string|null }}
 */
export function initiateCombat(attacker, target, combatModeActive = true) {
  if (!attacker || !target) {
    return { success: false, reason: "invalid_entities" };
  }

  // Must be in combat mode to attack (Shadowbane-style)
  // Exception: auto-enter on monster aggro (walk-onto)
  const isMonster = target.type === "monster" || target.monster_type;
  if (!combatModeActive && !isMonster) {
    return { success: false, reason: "not_in_combat_mode" };
  }

  // Range check: must be adjacent or on same tile
  const dx = Math.abs((attacker.x || 0) - (target.x || 0));
  const dy = Math.abs((attacker.y || 0) - (target.y || 0));
  if (dx + dy > 1) {
    return { success: false, reason: "out_of_range" };
  }

  // Validate through world rules (PvP legality, zone checks)
  const attackCheck = canAttack(attacker, target, target.x, target.y);
  if (!attackCheck.allowed) {
    return { success: false, reason: attackCheck.reason };
  }

  return { success: true, reason: attackCheck.reason }; // reason may be "contested_zone_pvp" for warnings
}

// ─── ABILITY VALIDATION ──────────────────────────────────────────────────────

/**
 * Can the character use this ability right now?
 * Checks energy, cooldown, and combat state.
 */
export function canUseAbility(character, ability, cooldowns = {}) {
  if (!ability) return { usable: false, reason: "no_ability" };

  // Energy check
  const maxEn = 50 + ((character.stats?.wisdom || 10) * 2);
  const currentEnergy = character.energy ?? maxEn;
  if (ability.energy_cost && currentEnergy < ability.energy_cost) {
    return { usable: false, reason: "not_enough_energy" };
  }

  // Cooldown check
  const cdKey = ability.id;
  if (cooldowns[cdKey] && cooldowns[cdKey] > 0) {
    return { usable: false, reason: "on_cooldown", remainingRounds: cooldowns[cdKey] };
  }

  // Level check
  if (ability.unlocked_at_level && (character.level || 1) < ability.unlocked_at_level) {
    return { usable: false, reason: "level_locked" };
  }

  return { usable: true, reason: null };
}

/**
 * Apply an ability. Returns the energy cost and sets cooldown.
 * Does NOT calculate damage (that's calcAttackDamage's job).
 */
export function applyAbilityCost(character, ability, cooldowns = {}) {
  const maxEn = 50 + ((character.stats?.wisdom || 10) * 2);
  const currentEnergy = character.energy ?? maxEn;
  const newEnergy = Math.max(0, currentEnergy - (ability.energy_cost || 0));

  const newCooldowns = { ...cooldowns };
  if (ability.cooldown_rounds) {
    newCooldowns[ability.id] = ability.cooldown_rounds;
  }

  return {
    energy: newEnergy,
    cooldowns: newCooldowns,
  };
}

/**
 * Tick all cooldowns down by 1 round. Called at end of each combat round.
 */
export function tickCooldowns(cooldowns) {
  const updated = {};
  for (const [key, val] of Object.entries(cooldowns)) {
    if (val > 1) updated[key] = val - 1;
    // Drop entries that hit 0
  }
  return updated;
}

// ─── COMBAT ENERGY REGEN ─────────────────────────────────────────────────────

/**
 * In-combat energy regen per round. Lower than out-of-combat movement regen.
 */
export function combatEnergyRegen(character) {
  const wisdom = character.stats?.wisdom || 10;
  const maxEn = 50 + wisdom * 2;
  const current = character.energy ?? maxEn;
  const regen = 2 + Math.floor(wisdom / 5); // Slower regen in combat
  return Math.min(maxEn, current + regen);
}

// ─── DEATH HANDLING ──────────────────────────────────────────────────────────

/**
 * Handle character death. Returns all updates to apply.
 * This is the ONLY death handler. World.jsx onDefeat MUST use this.
 */
export function handleDeath(character, zoneId = null, killerType = "monster") {
  // Determine zone from character position if not provided
  const zone = zoneId || getZoneAt(character.x, character.y)?.id || null;

  // Apply death penalty (respawn location, HP, gold, XP losses)
  const penalty = applyDeathPenalty(character, zone, killerType);

  return {
    ...penalty,
    // Additional state resets on death
    active_effects: [], // Clear all buffs/debuffs
  };
}

// ─── BUFF/DEBUFF APPLICATION ─────────────────────────────────────────────────
// Single source — charUtils helpers delegate here.

/**
 * Apply a buff or debuff effect to a character.
 */
export function applyEffect(character, effect) {
  const effects = [...(character.active_effects || [])];

  // Check if same effect already exists (refresh duration)
  const existingIdx = effects.findIndex(e => e.id === effect.id);
  if (existingIdx >= 0) {
    effects[existingIdx] = { ...effects[existingIdx], ...effect, applied_at: Date.now() };
  } else {
    effects.push({ ...effect, applied_at: Date.now() });
  }

  return { active_effects: effects };
}

/**
 * Remove expired effects.
 */
export function tickEffects(character, roundsElapsed = 1) {
  const effects = (character.active_effects || []).filter(e => {
    if (!e.duration_rounds) return true; // Permanent effects
    const remaining = (e.duration_rounds || 0) - roundsElapsed;
    return remaining > 0;
  }).map(e => {
    if (e.duration_rounds) {
      return { ...e, duration_rounds: e.duration_rounds - roundsElapsed };
    }
    return e;
  });

  return { active_effects: effects };
}

// ─── DERIVED COMBAT STATS ────────────────────────────────────────────────────

/**
 * Get effective combat stats with all active buffs/debuffs applied.
 */
export function getEffectiveCombatStats(character, derived) {
  let attackPower = derived.attack_power || 10;
  let defense = derived.defense || 0;
  let evasion = derived.evasion || 0;
  let critChance = derived.critical_hit_chance || 5;

  for (const effect of character.active_effects || []) {
    if (effect.effect_type === "buff") {
      if (effect.stat === "attack" || effect.stat === "attack_power") attackPower += effect.effect_magnitude || 0;
      if (effect.stat === "defense") defense += effect.effect_magnitude || 0;
      if (effect.stat === "evasion") evasion += effect.effect_magnitude || 0;
      if (effect.stat === "crit") critChance += effect.effect_magnitude || 0;
    }
    if (effect.effect_type === "debuff") {
      if (effect.stat === "attack" || effect.stat === "attack_power") attackPower -= effect.effect_magnitude || 0;
      if (effect.stat === "defense") defense -= effect.effect_magnitude || 0;
      if (effect.stat === "evasion") evasion -= effect.effect_magnitude || 0;
    }
  }

  return {
    attack_power: Math.max(1, attackPower),
    defense: Math.max(0, defense),
    evasion: Math.max(0, Math.min(75, evasion)),
    critical_hit_chance: Math.max(0, Math.min(100, critChance)),
  };
}