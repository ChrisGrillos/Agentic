/**
 * VAELRATH — Skill & Feat Derived Modifiers
 *
 * Single function that reads a character's skills + feats and returns
 * combat/world modifiers used by the combat engine and derived stats.
 *
 * This is the ONLY place where skills/feats translate to numeric combat bonuses.
 */

import { getFeatById } from "./featsData";

/**
 * Returns an object of combat modifiers derived from skills and feats.
 * Used by combatEngine.calcAttackDamage and charUtils.calculateDerivedStats.
 *
 * @param {Object} character - Full character object with skills, feats, stats
 * @returns {Object} modifiers
 */
export function getDerivedModifiers(character) {
  const skills = character.skills || {};
  const feats = character.feats || [];
  const stats = character.stats || {};

  const mods = {
    // Melee modifiers
    meleeAttackBonus: 0,
    meleeDamageBonus: 0,
    twoHandedDamageBonus: 0,
    offhandDamageMultiplier: 0.5,   // base 50% offhand damage
    
    // Ranged modifiers
    rangedDamageBonus: 0,
    rangedCritBonus: 0,
    
    // Defense modifiers
    blockChance: 0,
    parryChance: 0,
    evasionBonus: 0,
    damageReduction: 0,
    defenseBonus: 0,

    // Magic modifiers
    magicPowerBonus: 0,
    healingBonus: 0,
    spellCostReduction: 0,

    // Accuracy
    accuracyBonus: 0,
    critBonus: 0,

    // Misc
    stealthRating: 0,

    // Breakdown for combat log
    breakdown: [],
  };

  // ─── SKILL-BASED MODIFIERS ──────────────────────────────────────────────────

  // One-Handed: +2 melee damage per rank
  const oneHand = skills.one_handed || 0;
  if (oneHand > 0) {
    mods.meleeDamageBonus += oneHand * 2;
    mods.breakdown.push(`One-Handed ${oneHand}: +${oneHand * 2} melee dmg`);
  }

  // Two-Handed: +3 damage per rank (higher ceiling than 1H)
  const twoHand = skills.two_handed || 0;
  if (twoHand > 0) {
    mods.twoHandedDamageBonus += twoHand * 3;
    mods.breakdown.push(`Two-Handed ${twoHand}: +${twoHand * 3} 2H dmg`);
  }

  // Dual Wield: each rank reduces offhand penalty by 8% (base 50% → up to 90%)
  const dualWield = skills.dual_wielding || 0;
  if (dualWield > 0) {
    const offhandBonus = Math.min(0.40, dualWield * 0.08);
    mods.offhandDamageMultiplier = 0.50 + offhandBonus;
    mods.breakdown.push(`Dual Wield ${dualWield}: offhand ${Math.round(mods.offhandDamageMultiplier * 100)}%`);
  }

  // Archery: +2 ranged damage, +2% crit per rank
  const archery = skills.archery || 0;
  if (archery > 0) {
    mods.rangedDamageBonus += archery * 2;
    mods.rangedCritBonus += archery * 2;
    mods.breakdown.push(`Archery ${archery}: +${archery * 2} ranged dmg, +${archery * 2}% crit`);
  }

  // Crossbow: +3 ranged damage per rank (slower but harder)
  const crossbow = skills.crossbow || 0;
  if (crossbow > 0) {
    mods.rangedDamageBonus += crossbow * 3;
    mods.breakdown.push(`Crossbow ${crossbow}: +${crossbow * 3} ranged dmg`);
  }

  // Shield: +3% block chance, +1 defense per rank
  const shield = skills.shields || 0;
  if (shield > 0) {
    mods.blockChance += shield * 3;
    mods.defenseBonus += shield * 1;
    mods.breakdown.push(`Shield ${shield}: +${shield * 3}% block, +${shield} def`);
  }

  // Parry: +4% parry chance per rank
  const parry = skills.parry || 0;
  if (parry > 0) {
    mods.parryChance += parry * 4;
    mods.breakdown.push(`Parry ${parry}: +${parry * 4}% parry`);
  }

  // Dodge: +2% evasion per rank
  const dodge = skills.dodge || 0;
  if (dodge > 0) {
    mods.evasionBonus += dodge * 2;
    mods.breakdown.push(`Dodge ${dodge}: +${dodge * 2}% evasion`);
  }

  // Heavy Armor: +2 damage reduction per rank
  const heavyArmor = skills.heavy_armor || 0;
  if (heavyArmor > 0) {
    mods.damageReduction += heavyArmor * 2;
    mods.defenseBonus += heavyArmor * 2;
    mods.breakdown.push(`Heavy Armor ${heavyArmor}: +${heavyArmor * 2} DR, +${heavyArmor * 2} def`);
  }

  // Light Armor: +1 defense, +1% evasion per rank
  const lightArmor = skills.light_armor || 0;
  if (lightArmor > 0) {
    mods.defenseBonus += lightArmor;
    mods.evasionBonus += lightArmor;
    mods.breakdown.push(`Light Armor ${lightArmor}: +${lightArmor} def, +${lightArmor}% evasion`);
  }

  // Tactics: +1% accuracy and +1% crit per rank
  const tactics = skills.tactics || 0;
  if (tactics > 0) {
    mods.accuracyBonus += tactics;
    mods.critBonus += tactics;
    mods.breakdown.push(`Tactics ${tactics}: +${tactics}% acc, +${tactics}% crit`);
  }

  // Elemental Magic: +3 magic power per rank
  const elemental = skills.elemental || 0;
  if (elemental > 0) {
    mods.magicPowerBonus += elemental * 3;
    mods.breakdown.push(`Elemental ${elemental}: +${elemental * 3} magic power`);
  }

  // Restoration: +5% healing per rank
  const restoration = skills.restoration || 0;
  if (restoration > 0) {
    mods.healingBonus += restoration * 0.05;
    mods.breakdown.push(`Restoration ${restoration}: +${restoration * 5}% healing`);
  }

  // Arcana: -3% spell energy cost per rank
  const arcana = skills.arcana || 0;
  if (arcana > 0) {
    mods.spellCostReduction += arcana * 0.03;
    mods.breakdown.push(`Arcana ${arcana}: -${arcana * 3}% spell cost`);
  }

  // Stealth: detection avoidance
  const stealth = skills.stealth || 0;
  if (stealth > 0) {
    mods.stealthRating += stealth * 5;
    mods.breakdown.push(`Stealth ${stealth}: ${stealth * 5} stealth rating`);
  }

  // Unarmed: +2 melee damage per rank
  const unarmed = skills.unarmed || 0;
  if (unarmed > 0) {
    mods.meleeDamageBonus += unarmed * 2;
    mods.breakdown.push(`Unarmed ${unarmed}: +${unarmed * 2} melee dmg`);
  }

  // Polearms: +2 melee damage per rank
  const polearms = skills.polearms || 0;
  if (polearms > 0) {
    mods.meleeDamageBonus += polearms * 2;
    mods.breakdown.push(`Polearms ${polearms}: +${polearms * 2} melee dmg`);
  }

  // Warding: +2 defense per rank
  const warding = skills.warding || 0;
  if (warding > 0) {
    mods.defenseBonus += warding * 2;
    mods.breakdown.push(`Warding ${warding}: +${warding * 2} def`);
  }

  // ─── FEAT-BASED MODIFIERS ──────────────────────────────────────────────────

  for (const featId of feats) {
    const feat = getFeatById(featId);
    if (!feat) continue;
    const em = feat.effectMetadata || {};

    if (em.damageBonus) {
      mods.meleeDamageBonus += em.damageBonus;
      mods.breakdown.push(`${feat.name}: +${em.damageBonus} dmg`);
    }
    if (em.offhandDamageBonus) {
      mods.meleeDamageBonus += em.offhandDamageBonus;
      mods.breakdown.push(`${feat.name}: +${em.offhandDamageBonus} offhand dmg`);
    }
    if (em.rangedDamageBonus) {
      mods.rangedDamageBonus += em.rangedDamageBonus;
      mods.breakdown.push(`${feat.name}: +${em.rangedDamageBonus} ranged dmg`);
    }
    if (em.twoHandedDamageBonus) {
      mods.twoHandedDamageBonus += em.twoHandedDamageBonus;
      mods.breakdown.push(`${feat.name}: +${em.twoHandedDamageBonus} 2H dmg`);
    }
    if (em.armorBonus) {
      mods.defenseBonus += em.armorBonus;
      mods.breakdown.push(`${feat.name}: +${em.armorBonus} armor`);
    }
    if (em.evasionBonus) {
      mods.evasionBonus += Math.round(em.evasionBonus * 100);
      mods.breakdown.push(`${feat.name}: +${Math.round(em.evasionBonus * 100)}% evasion`);
    }
    if (em.damageReduction) {
      mods.damageReduction += Math.round(em.damageReduction * 100);
      mods.breakdown.push(`${feat.name}: +${Math.round(em.damageReduction * 100)}% DR`);
    }
    if (em.criticalRangeBonus) {
      mods.critBonus += em.criticalRangeBonus * 5;
      mods.breakdown.push(`${feat.name}: +${em.criticalRangeBonus * 5}% crit`);
    }
    if (em.healingBonus) {
      mods.healingBonus += em.healingBonus;
      mods.breakdown.push(`${feat.name}: +${Math.round(em.healingBonus * 100)}% healing`);
    }
    if (em.spellCostReduction) {
      mods.spellCostReduction += em.spellCostReduction;
      mods.breakdown.push(`${feat.name}: -${Math.round(em.spellCostReduction * 100)}% spell cost`);
    }
    if (em.blockChanceBonus) {
      mods.blockChance += em.blockChanceBonus;
      mods.breakdown.push(`${feat.name}: +${em.blockChanceBonus}% block`);
    }
    if (em.parryChanceBonus) {
      mods.parryChance += em.parryChanceBonus;
      mods.breakdown.push(`${feat.name}: +${em.parryChanceBonus}% parry`);
    }
    if (em.accuracyBonus) {
      mods.accuracyBonus += em.accuracyBonus;
      mods.breakdown.push(`${feat.name}: +${em.accuracyBonus} accuracy`);
    }
  }

  return mods;
}