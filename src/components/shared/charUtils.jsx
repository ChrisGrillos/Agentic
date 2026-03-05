/**
 * Character utility functions:
 * - calculateDerivedStats
 * - applyBuff / applyDebuff / tickEffects
 * - xpToNextLevel / levelUpUpdates
 * - combat helpers
 */

import { BASE_CLASSES } from "./classDefinitions";
import { getDerivedModifiers } from "./getDerivedModifiers";

// ─── DERIVED STATS ─────────────────────────────────────────────────────────────

export function calculateDerivedStats(character) {
  const stats = character.stats || {};
  const skills = character.skills || {};
  const effects = character.active_effects || [];
  const level = character.level || 1;

  const str = stats.strength || 10;
  const dex = stats.dexterity || 10;
  const int_ = stats.intelligence || 10;
  const wis = stats.wisdom || 10;
  const con = stats.constitution || 10;
  const cha = stats.charisma || 10;

  // Use new expanded skill IDs
  const healSkill   = skills.healing || skills.restoration || 0;
  const tradeSkill  = skills.trading || 0;
  const craftSkill  = skills.crafting || skills.smithing || 0;

  // Get skill/feat modifiers
  const mods = getDerivedModifiers(character);

  let derived = {
    attack_power:        Math.floor(str * 1.5 + dex * 0.5 + level * 1.5) + mods.meleeDamageBonus + mods.twoHandedDamageBonus,
    defense:             Math.floor(con * 1.2 + str * 0.3 + level * 0.8) + mods.defenseBonus,
    magic_power:         Math.floor(int_ * 1.5 + wis * 0.7 + (skills.arcana || 0) * 0.5) + mods.magicPowerBonus,
    critical_hit_chance: Math.min(75, Math.floor(dex * 0.8 + level * 0.3) + mods.critBonus + mods.rangedCritBonus),
    evasion:             Math.min(80, Math.floor(dex * 0.9) + mods.evasionBonus),
    movement_speed:      Math.min(20, Math.floor(5 + dex * 0.15 + level * 0.1)),
    trade_efficiency:    Math.floor(cha * 1.2 + tradeSkill * 0.5),
    craft_quality:       Math.floor((dex + int_) * 0.5 + craftSkill * 0.6),
    healing_power:       Math.floor(wis * 1.3 + healSkill * 0.5 + int_ * 0.2 + (mods.healingBonus * 100)),
    block_chance:        mods.blockChance,
    parry_chance:        mods.parryChance,
    damage_reduction:    mods.damageReduction,
    ranged_damage:       mods.rangedDamageBonus,
    stealth_rating:      mods.stealthRating,
  };

  // Apply passive bonuses from base class abilities
  const classId = character.base_class || character.class;
  const baseClass = BASE_CLASSES[classId];
  if (baseClass) {
    for (const ability of (baseClass.baseAbilities || [])) {
      if (ability.type === "passive" && (character.level || 1) >= ability.unlocked_at_level) {
        if (ability.id === "warrior_passive") derived.defense += ability.effect_magnitude;
        if (ability.id === "tracker") derived.evasion += ability.effect_magnitude;
        if (ability.id === "arcane_insight") derived.magic_power += ability.effect_magnitude;
        if (ability.id === "empathy") derived.healing_power += ability.effect_magnitude;
        if (ability.id === "haggle") derived.trade_efficiency += ability.effect_magnitude;
        if (ability.id === "crafters_touch") derived.craft_quality += ability.effect_magnitude;
      }
    }

    // Specialization stat bonuses feed into derived stats
    if (character.specialization && baseClass.specializations?.[character.specialization]) {
      const spec = baseClass.specializations[character.specialization];
      const sb = spec.statBonuses || {};
      derived.attack_power        += (sb.strength || 0) * 1.5;
      derived.defense             += (sb.constitution || 0) * 1.2 + (sb.strength || 0) * 0.3;
      derived.magic_power         += (sb.intelligence || 0) * 1.5;
      derived.healing_power       += (sb.wisdom || 0) * 1.3;
      derived.evasion             += (sb.dexterity || 0) * 0.9;
      derived.critical_hit_chance += (sb.dexterity || 0) * 0.5;
      derived.trade_efficiency    += (sb.charisma || 0) * 1.2;
    }
  }

  // Apply active effects
  for (const effect of effects) {
    if ((effect.rounds_remaining || 0) <= 0) continue;
    const statKey = effect.stat_affected;
    if (derived[statKey] !== undefined) {
      if (effect.is_percent) {
        derived[statKey] = Math.floor(derived[statKey] * (1 + (effect.magnitude || 0) / 100));
      } else {
        derived[statKey] += (effect.magnitude || 0);
      }
    }
  }

  // Equipment bonuses
  const eq = character.equipment || {};
  Object.values(eq).filter(Boolean).forEach(item => {
    if (item.stats) {
      Object.entries(item.stats).forEach(([stat, value]) => {
        derived[stat] = (derived[stat] || 0) + value;
      });
    }
  });

  // Floor all at 0
  for (const key of Object.keys(derived)) {
    derived[key] = Math.max(0, Math.round(derived[key]));
  }

  return derived;
}

// ─── XP & LEVELING ────────────────────────────────────────────────────────────

export function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function shouldLevelUp(character) {
  return (character.xp || 0) >= xpToNextLevel(character.level || 1);
}

/** Returns the updates object to apply on level-up */
export function levelUpUpdates(character) {
  const newLevel = (character.level || 1) + 1;
  const classId  = character.base_class || character.class;
  const stats    = { ...(character.stats || {}) };
  const gains    = CLASS_STAT_GAINS[classId] || { strength: 1 };

  for (const [stat, gain] of Object.entries(gains)) {
    stats[stat] = (stats[stat] || 10) + gain;
  }

  const newMaxHp = (character.max_hp || 100) + Math.floor((stats.constitution || 10) * 0.5) + 5;

  return {
    level: newLevel,
    xp: Math.max(0, (character.xp || 0) - xpToNextLevel(character.level || 1)),
    stats,
    max_hp: newMaxHp,
    hp: newMaxHp,
    stat_points: (character.stat_points || 0) + 3,
  };
}

const CLASS_STAT_GAINS = {
  warrior:   { strength: 1, constitution: 1 },
  hunter:    { dexterity: 1, wisdom: 1 },
  wizard:    { intelligence: 1, wisdom: 1 },
  healer:    { wisdom: 1, charisma: 1 },
  merchant:  { charisma: 1, intelligence: 1 },
  craftsman: { dexterity: 1, strength: 1 },
};

// ─── BUFF / DEBUFF MANAGEMENT ─────────────────────────────────────────────────

export function buildBuff({ id, name, emoji = "✨", stat_affected, magnitude, duration_rounds, source = "ability", is_percent = false }) {
  return {
    id: id || `buff_${Date.now()}`,
    name, emoji,
    type: "buff",
    stat_affected,
    magnitude: Math.abs(magnitude),
    is_percent,
    duration_rounds,
    rounds_remaining: duration_rounds,
    source,
  };
}

export function buildDebuff({ id, name, emoji = "💀", stat_affected, magnitude, duration_rounds, source = "ability", is_percent = false }) {
  return {
    id: id || `debuff_${Date.now()}`,
    name, emoji,
    type: "debuff",
    stat_affected,
    magnitude: -Math.abs(magnitude),
    is_percent,
    duration_rounds,
    rounds_remaining: duration_rounds,
    source,
  };
}

export function applyEffect(character, effect) {
  const existing = (character.active_effects || []).filter(e => e.id !== effect.id);
  return [...existing, effect];
}

export function tickEffects(activeEffects) {
  return (activeEffects || [])
    .map(e => ({ ...e, rounds_remaining: (e.rounds_remaining || 0) - 1 }))
    .filter(e => e.rounds_remaining > 0);
}

export function removeEffect(activeEffects, effectId) {
  return (activeEffects || []).filter(e => e.id !== effectId);
}

// ─── COMBAT HELPERS ───────────────────────────────────────────────────────────

/** Returns { damage, isCrit } using derived stats */
export function calcPlayerAttack(character) {
  const derived = calculateDerivedStats(character);
  const base    = derived.attack_power || 10;
  const critRoll = Math.random() * 100;
  const isCrit   = critRoll < (derived.critical_hit_chance || 5);
  const variance = 0.8 + Math.random() * 0.4;
  const damage   = Math.floor(base * variance * (isCrit ? 2 : 1));
  return { damage, isCrit };
}

/** Reduce incoming damage by defense stat */
export function applyDefenseReduction(incomingDamage, character) {
  const derived    = calculateDerivedStats(character);
  const def        = derived.defense || 0;
  const reduction  = Math.min(0.75, def / (def + 100));
  return Math.max(1, Math.floor(incomingDamage * (1 - reduction)));
}

/** Returns true if the attack is evaded */
export function checkEvasion(character) {
  const derived = calculateDerivedStats(character);
  return Math.random() * 100 < (derived.evasion || 0);
}