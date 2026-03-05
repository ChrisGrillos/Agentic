/**
 * VAELRATH Combat System — Real-time action with cooldowns, target locking, and visual feedback
 * Integrates with character stats, skills, and derived stats.
 *
 * Core flow:
 * - Player locks target via click/Tab
 * - Player selects ability from hotbar (validates energy/cooldown)
 * - Damage calculated from stats + skills + active effects
 * - Visual feedback spawned: damage numbers, hit indicators, effect procs
 * - Cooldown ticks down; effects tick down each round
 */

import { calculateDerivedStats } from "@/components/shared/charUtils";
import { getSkillById } from "@/components/shared/skillsData";

// ─── DAMAGE CALCULATION ──────────────────────────────────────────────────────

/**
 * Calculate attack damage from attacker to target.
 * Factors in: base stats, skills, active effects, ability modifiers, RNG rolls.
 */
export function calculateAttackDamage(attacker, target, ability = null, skillId = null) {
  if (!attacker || !target) return 0;

  const attackerDerived = calculateDerivedStats(attacker);
  const targetDerived = calculateDerivedStats(target);

  let baseDamage = attackerDerived.attack_power || 10;

  // Apply ability modifier
  if (ability?.effect_magnitude) {
    baseDamage += ability.effect_magnitude;
  }

  // Apply skill bonus (scaled 0.5 per skill point)
  if (skillId) {
    const skillLevel = attacker.skills?.[skillId] || 0;
    baseDamage += Math.floor(skillLevel * 0.5);
  }

  // Apply active buff/debuff modifiers
  if (attacker.active_effects) {
    for (const effect of attacker.active_effects) {
      if (effect.effect_type === "buff" && effect.stat === "attack") {
        baseDamage += effect.effect_magnitude || 0;
      }
    }
  }

  // Randomize ±10%
  const variance = Math.random() * 0.2 - 0.1;
  let finalDamage = Math.max(1, Math.floor(baseDamage * (1 + variance)));

  // Apply target defense (reduces damage by 0.5x defense value)
  const defense = Math.max(0, targetDerived.defense || 0);
  finalDamage = Math.max(1, finalDamage - defense * 0.5);

  // Apply target debuffs that increase damage taken
  if (target.active_effects) {
    for (const effect of target.active_effects) {
      if (effect.effect_type === "debuff" && effect.stat === "defense") {
        finalDamage += effect.effect_magnitude || 0;
      }
    }
  }

  return finalDamage;
}

// ─── CRITICAL HITS ────────────────────────────────────────────────────────────

/**
 * Determine if an attack is a critical hit.
 * Base 5% chance; increased by derived stats and abilities.
 */
export function isAttackCritical(attacker, critChance = null) {
  const derived = calculateDerivedStats(attacker);
  const baseCrit = critChance ?? derived.critical_hit_chance ?? 5;
  return Math.random() * 100 < baseCrit;
}

// ─── EVASION / DODGE ────────────────────────────────────────────────────────

/**
 * Determine if target evades the attack.
 * Compared against attacker accuracy (inverse of evasion).
 */
export function doesTargetEvade(target, attackerAccuracy = 75) {
  const derived = calculateDerivedStats(target);
  const evasionChance = Math.min(80, derived.evasion ?? 0);
  return Math.random() * 100 < evasionChance;
}

// ─── ABILITY QUEUEING & EXECUTION ────────────────────────────────────────────

/**
 * Queue an ability cast.
 * Returns: { success, damage?, appliedEffects?, cooldownUpdates?, energyUsed? }
 */
export function executeAbility(attacker, target, ability, skillId = null) {
  if (!attacker || !target || !ability) {
    return { success: false, reason: "invalid_input" };
  }

  // Check if evaded
  if (doesTargetEvade(target)) {
    return {
      success: false,
      reason: "evaded",
      visual: { type: "miss", target, message: "Evaded!" },
    };
  }

  // Calculate damage
  const baseDamage = calculateAttackDamage(attacker, target, ability, skillId);
  const isCrit = isAttackCritical(attacker, calculateDerivedStats(attacker).critical_hit_chance);
  const finalDamage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;

  // Apply energy cost
  const maxEnergy = 50 + ((attacker.stats?.wisdom || 10) * 2);
  const energyCost = ability.energy_cost || 5;
  const newEnergy = Math.max(0, (attacker.energy ?? maxEnergy) - energyCost);

  // Update cooldown
  const newCooldown = ability.cooldown_rounds || 0;

  // Build effect metadata for visual feedback
  const visual = {
    type: isCrit ? "critical" : "hit",
    damage: finalDamage,
    target,
    message: isCrit ? `Critical Hit! ${finalDamage} damage` : `${finalDamage} damage`,
    emoji: isCrit ? "⚡" : "💥",
  };

  return {
    success: true,
    damage: finalDamage,
    isCrit,
    energyUsed: energyCost,
    newEnergy,
    cooldown: newCooldown,
    visual,
  };
}

// ─── COOLDOWN MANAGEMENT ────────────────────────────────────────────────────

/**
 * Decrement all cooldowns by 1 round.
 */
export function tickCooldowns(cooldowns) {
  const updated = {};
  for (const [abilityId, remaining] of Object.entries(cooldowns)) {
    if (remaining > 1) updated[abilityId] = remaining - 1;
  }
  return updated;
}

/**
 * Get remaining cooldown for ability (returns 0 if ready).
 */
export function getAbilityCooldown(cooldowns, abilityId) {
  return cooldowns[abilityId] || 0;
}

/**
 * Check if ability is on cooldown.
 */
export function isAbilityOnCooldown(cooldowns, abilityId) {
  return (cooldowns[abilityId] || 0) > 0;
}

// ─── EFFECT MANAGEMENT ──────────────────────────────────────────────────────

/**
 * Apply a temporary buff or debuff.
 */
export function applyEffect(character, effect) {
  const effects = [...(character.active_effects || [])];
  const existingIdx = effects.findIndex(e => e.id === effect.id);

  if (existingIdx >= 0) {
    // Refresh duration
    effects[existingIdx] = { ...effects[existingIdx], ...effect, applied_at: Date.now() };
  } else {
    effects.push({ ...effect, applied_at: Date.now() });
  }

  return effects;
}

/**
 * Tick down effect durations.
 */
export function tickEffects(character, roundsElapsed = 1) {
  return (character.active_effects || [])
    .filter(e => !e.duration_rounds || (e.duration_rounds || 0) > roundsElapsed)
    .map(e => ({
      ...e,
      duration_rounds: e.duration_rounds ? e.duration_rounds - roundsElapsed : e.duration_rounds,
    }));
}

// ─── VISUAL FEEDBACK BUILDERS ────────────────────────────────────────────────

/**
 * Create a damage number visual at world position.
 * Returns: { type, damage, x, y, emoji, color, duration }
 */
export function createDamageNumberVisual(targetX, targetY, damage, isCrit = false) {
  return {
    type: "damage_number",
    x: targetX + (Math.random() - 0.5) * 2, // Scatter ±1 tile
    y: targetY + (Math.random() - 0.5) * 2,
    damage,
    emoji: isCrit ? "⚡" : "💥",
    color: isCrit ? "#ffff00" : "#ff6600",
    duration: 1000, // ms
  };
}

/**
 * Create a status effect visual (buff/debuff icon at character).
 */
export function createEffectVisual(targetX, targetY, effect) {
  return {
    type: "effect_icon",
    x: targetX,
    y: targetY,
    emoji: effect.emoji || "✨",
    name: effect.name,
    duration: 2000,
  };
}

/**
 * Create a miss visual.
 */
export function createMissVisual(targetX, targetY) {
  return {
    type: "miss",
    x: targetX,
    y: targetY,
    text: "MISS",
    color: "#999999",
    duration: 800,
  };
}

/**
 * Create a hit indicator (brief flash at target).
 */
export function createHitFlashVisual(targetX, targetY, isCrit = false) {
  return {
    type: "hit_flash",
    x: targetX,
    y: targetY,
    color: isCrit ? "#ffff00" : "#ff6600",
    intensity: isCrit ? 1.0 : 0.6,
    duration: 150,
  };
}

// ─── COMBAT ROUND EXECUTOR ──────────────────────────────────────────────────

/**
 * Execute one full combat round for a character.
 * - Apply ability
 * - Tick cooldowns, effects, energy
 * - Return all visual feedback
 */
export function executeCombatRound(attacker, target, ability, skillId = null, currentState = {}) {
  const visuals = [];
  const updates = {};

  // Execute ability
  const abilityResult = executeAbility(attacker, target, ability, skillId);

  if (!abilityResult.success) {
    if (abilityResult.reason === "evaded") {
      visuals.push(createMissVisual(target.x, target.y));
    }
    return { success: false, reason: abilityResult.reason, visuals };
  }

  // Add damage visual
  const damageVisual = createDamageNumberVisual(
    target.x,
    target.y,
    abilityResult.damage,
    abilityResult.isCrit
  );
  visuals.push(damageVisual);

  // Add hit flash
  const hitFlash = createHitFlashVisual(target.x, target.y, abilityResult.isCrit);
  visuals.push(hitFlash);

  // Update attacker state
  updates.attacker = {
    energy: abilityResult.newEnergy,
    cooldowns: {
      ...(currentState.cooldowns || {}),
      [ability.id]: abilityResult.cooldown,
    },
  };

  // Update target state (HP reduction)
  const newTargetHp = Math.max(0, (target.hp || target.max_hp) - abilityResult.damage);
  updates.target = {
    hp: newTargetHp,
    lastHitBy: attacker.id,
    lastHitTime: Date.now(),
  };

  return {
    success: true,
    damage: abilityResult.damage,
    isCrit: abilityResult.isCrit,
    visuals,
    updates,
  };
}