/**
 * LEGACY SHIM — pure combat math functions and backward-compat re-exports.
 */

// Re-export authority/validation functions
export {
  canUseAbility,
  tickCooldowns,
  handleDeath,
  initiateCombat,
} from "./authorizedCombatEngine";

/**
 * Core combat damage calculation — skill/feat modifiers are pre-applied
 * to attacker stats via getDerivedModifiers before reaching this function.
 *
 * The `attacker` object should already include skillMods from getDerivedModifiers.
 */
export function calcAttackDamage(attacker, defender, ability) {
  const base = ability.effect_magnitude || 100;
  const attackBonus = attacker.attack_power || 0;
  const defenseReduction = Math.max(0, defender.defense || 0);

  // Skill mods passed on attacker (set by CombatOverlay via getDerivedModifiers)
  const mods = attacker._skillMods || {};

  // Base damage
  let rawDamage = base + attackBonus - (defenseReduction * 0.5);

  // Apply melee/ranged skill bonuses
  const isRanged = (ability.name || "").match(/arrow|shot|bolt|throw|bow|ranged/i) ||
                   (ability.description || "").match(/ranged/i);
  if (isRanged) {
    rawDamage += (mods.rangedDamageBonus || 0);
  } else {
    rawDamage += (mods.meleeDamageBonus || 0);
    rawDamage += (mods.twoHandedDamageBonus || 0);
  }

  // Damage reduction from defender skills
  const dr = mods.damageReduction || 0; // only on defender path, but attacker can also have it
  // We don't reduce own damage — this is handled on the defender side

  // Block chance (defender blocks completely)
  const defMods = defender._skillMods || {};
  const blocked = Math.random() * 100 < (defMods.blockChance || 0);
  if (blocked) {
    return { dmg: 0, isCrit: false, evaded: false, blocked: true, parried: false, breakdown: mods.breakdown || [] };
  }

  // Parry chance (defender parries — 0 damage)
  const parried = Math.random() * 100 < (defMods.parryChance || 0);
  if (parried) {
    return { dmg: 0, isCrit: false, evaded: false, blocked: false, parried: true, breakdown: mods.breakdown || [] };
  }

  // Evasion check
  const totalEvasion = (defender.evasion || 0) + (defMods.evasionBonus || 0);
  const evaded = Math.random() * 100 < totalEvasion;
  if (evaded) {
    return { dmg: 0, isCrit: false, evaded: true, blocked: false, parried: false, breakdown: mods.breakdown || [] };
  }

  // Crit check — include skill crit bonuses
  const critChance = (attacker.critical_hit_chance || 0) + (mods.critBonus || 0) + (isRanged ? (mods.rangedCritBonus || 0) : 0);
  const isCrit = Math.random() * 100 < critChance;

  // Apply defender damage reduction
  const defDR = defMods.damageReduction || 0;
  const drMultiplier = Math.max(0.25, 1 - (defDR / 100));

  const dmg = Math.max(1, Math.floor(rawDamage * (isCrit ? 1.5 : 1) * drMultiplier));

  return { dmg, isCrit, evaded: false, blocked: false, parried: false, breakdown: mods.breakdown || [] };
}

export function resolveCombatRound(character, monster) {
  // Stub for backward compat
  return { success: true };
}

export function initializeCooldowns(character) {
  return {};
}

export function applyCooldown(cooldowns, abilityId, rounds) {
  return { ...cooldowns, [abilityId]: rounds };
}

export function calcRewards(monster) {
  return {
    xp: (monster.xp_reward || (monster.level || 1) * 20),
    gold: (monster.gold_reward || (monster.level || 1) * 8),
  };
}

export function applyVictoryRewards(character, rewards) {
  return {
    xp: (character.xp || 0) + rewards.xp,
    gold: (character.gold || 0) + rewards.gold,
  };
}

export function getLevelUpThreshold(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

export async function autoResolveCombat(character, monster) {
  // Stub for backward compat
  return { success: true };
}