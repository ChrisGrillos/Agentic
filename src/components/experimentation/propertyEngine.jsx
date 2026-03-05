/**
 * Modular Property-Based Experimentation Engine
 * 
 * Simulates chemical/physical reactions between resources using
 * their properties + conditions. Non-deterministic — real variance
 * means the library grows organically.
 */

// Property weight for outcome scoring
const PROP_KEYS = [
  "density","reactivity","volatility","solubility",
  "flammability","toxicity","conductivity","hardness",
  "luminescence","magical_affinity"
];

/** Merge property arrays from all input resources (weighted avg) */
function mergeProperties(inputs) {
  const merged = {};
  PROP_KEYS.forEach(k => {
    const vals = inputs.map(i => i.snapshot_properties?.[k] ?? 0);
    merged[k] = vals.reduce((a,b) => a+b, 0) / vals.length;
  });
  return merged;
}

/** Apply conditions as modifiers to merged properties */
function applyConditions(props, conditions) {
  const p = { ...props };
  const heat     = (conditions.heat     || 0) / 100;
  const pressure = (conditions.pressure || 0) / 100;
  const duration = (conditions.duration || 50) / 100;

  p.reactivity   = Math.min(100, p.reactivity   + heat * 40);
  p.volatility   = Math.min(100, p.volatility   + heat * 30);
  p.flammability = Math.min(100, p.flammability + heat * 25);
  p.hardness     = Math.min(100, p.hardness     + pressure * 30);
  p.density      = Math.min(100, p.density      + pressure * 20);
  p.solubility   = Math.max(0,   p.solubility   - heat * 15);
  // Catalyst boosts magical affinity
  if (conditions.catalyst) p.magical_affinity = Math.min(100, p.magical_affinity + 20);
  // Duration stabilizes
  p._stability = Math.max(10, 80 - p.volatility * 0.5 + duration * 20);
  return p;
}

/** Variance roll — injects randomness so outcomes differ each time */
function variance(base, range = 15) {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range * 2));
}

// ── OUTCOME CLASSIFIER ────────────────────────────────────────────────────────
/**
 * Returns { type, rarity, profile, tags, uses, effects }
 * type: "compound" | "alloy" | "elixir" | "crystal" | "gas" | "explosion" | "residue" | "arcane_substance"
 */
function classifyOutcome(finalProps, inputs, conditions) {
  const r = finalProps.reactivity;
  const v = finalProps.volatility;
  const f = finalProps.flammability;
  const m = finalProps.magical_affinity;
  const h = finalProps.hardness;
  const sol = finalProps.solubility;
  const tox = finalProps.toxicity;
  const lum = finalProps.luminescence;
  const stab = finalProps._stability || 70;

  const tags = [];
  const uses = [];
  const effects = [];

  // ── Catastrophic outcomes first ──
  if (r > 80 && v > 70 && f > 65) {
    return {
      type: "explosion",
      rarity: "common",
      tags: ["hazard","volatile","dangerous"],
      uses: [],
      effects: ["destroys_container","stun_3_rounds","area_damage_15"],
      profile: finalProps,
      stability: Math.max(5, stab - 40),
    };
  }

  // ── Arcane substance ──
  if (m > 65) {
    tags.push("arcane","magical");
    effects.push(`magic_power_+${Math.floor(m/4)}`);
    uses.push("enchanting","spell_reagent");
    if (lum > 40) { tags.push("luminous"); effects.push("emit_light"); }
    return { type: "arcane_substance", rarity: m > 85 ? "legendary" : m > 70 ? "rare" : "uncommon", tags, uses, effects, profile: finalProps, stability: stab };
  }

  // ── Crystal ──
  if (h > 70 && sol < 20) {
    tags.push("crystal","mineral");
    uses.push("crafting_material","gemstone","tool_component");
    effects.push(`defense_+${Math.floor(h/8)}`);
    if (lum > 30) { tags.push("glowing"); effects.push("illuminate_area"); }
    return { type: "crystal", rarity: h > 90 ? "legendary" : h > 75 ? "rare" : "uncommon", tags, uses, effects, profile: finalProps, stability: stab };
  }

  // ── Alloy / Metal compound ──
  const allInputsMetal = inputs.every(i => (i.snapshot_properties?.hardness || 0) > 40);
  if (allInputsMetal || (h > 55 && conditions.heat > 40)) {
    tags.push("alloy","metal");
    uses.push("weapon_forging","armor_crafting","tool_making");
    effects.push(`attack_power_+${Math.floor(h/6)}`, `durability_+${Math.floor(h/4)}`);
    return { type: "alloy", rarity: h > 85 ? "legendary" : h > 65 ? "rare" : h > 50 ? "uncommon" : "common", tags, uses, effects, profile: finalProps, stability: stab };
  }

  // ── Elixir / Potion ──
  if (sol > 60 || conditions.container === "glass_vial") {
    const healing = Math.floor((100 - tox) / 3);
    tags.push("liquid","elixir");
    if (tox > 50) {
      tags.push("poison");
      uses.push("weapon_coating","trap_bait");
      effects.push(`poison_${Math.floor(tox/8)}_rounds`);
    } else {
      tags.push("healing");
      uses.push("consumable","trade_good");
      effects.push(`hp_restore_${healing}`);
    }
    if (m > 30) { effects.push(`mana_restore_${Math.floor(m/4)}`); }
    return { type: "elixir", rarity: tox > 70 || healing > 30 ? "rare" : "common", tags, uses, effects, profile: finalProps, stability: stab };
  }

  // ── Gas / Vapour ──
  if (v > 55 && conditions.heat > 50) {
    tags.push("gas","vapour");
    if (tox > 40) {
      uses.push("trap","area_denial");
      effects.push(`toxic_cloud_${Math.floor(tox/10)}_rounds`);
    } else {
      uses.push("signal_flare","atmosphere");
      effects.push(`obscure_vision`);
    }
    return { type: "gas", rarity: "uncommon", tags, uses, effects, profile: finalProps, stability: Math.max(5, stab - 20) };
  }

  // ── Residue / Partial discovery (failure state) ──
  if (stab < 30 || r > 70) {
    return {
      type: "residue",
      rarity: "common",
      tags: ["waste","unstable","partial"],
      uses: ["alchemical_waste","minor_reagent"],
      effects: ["degraded_output"],
      profile: finalProps,
      stability: stab,
    };
  }

  // ── Generic compound (fallback success) ──
  tags.push("compound");
  uses.push("crafting_material","trade_good");
  effects.push(`versatile_material`);
  const rarityScore = (m + h + (100-tox) + sol) / 4;
  return {
    type: "compound",
    rarity: rarityScore > 75 ? "rare" : rarityScore > 50 ? "uncommon" : "common",
    tags, uses, effects, profile: finalProps, stability: stab,
  };
}

// ── EMOJI + NAME GENERATOR ────────────────────────────────────────────────────
const TYPE_EMOJIS = {
  explosion: "💥", arcane_substance: "✨", crystal: "💎",
  alloy: "⚙️", elixir: "🧪", gas: "💨", residue: "🫙", compound: "⚗️"
};

const RARITY_PREFIX = {
  common: "", uncommon: "Refined ", rare: "Rare ", legendary: "Legendary "
};

const TYPE_SUFFIXES = {
  explosion: ["Detonation","Blast","Eruption"],
  arcane_substance: ["Essence","Resonance","Flux","Ether","Ichor"],
  crystal: ["Shard","Gem","Formation","Lattice","Fragment"],
  alloy: ["Alloy","Amalgam","Compound","Ingot","Blend"],
  elixir: ["Elixir","Tincture","Draught","Brew","Extract"],
  gas: ["Vapour","Miasma","Emanation","Fume"],
  residue: ["Slag","Residue","Sludge","Remnant"],
  compound: ["Compound","Substance","Mixture","Matter","Amalgamate"],
};

function generateName(type, inputs, conditions, rarity) {
  const suffixes = TYPE_SUFFIXES[type] || ["Substance"];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const prefix = RARITY_PREFIX[rarity] || "";
  // Use dominant input name as flavor
  const dominantInput = inputs.sort((a,b) => (b.qty||1)-(a.qty||1))[0];
  const nameBase = dominantInput?.resource_name?.split(" ")[0] || "Unknown";
  // Some types skip input name
  if (type === "explosion") return `${nameBase} Detonation`;
  if (type === "residue") return `${nameBase} Slag`;
  return `${prefix}${nameBase} ${suffix}`;
}

// ── MAIN SIMULATION FUNCTION ──────────────────────────────────────────────────
/**
 * @param {Array} inputs   — [{ resource_id, resource_name, resource_emoji, qty, snapshot_properties }]
 * @param {Object} conditions — { heat, pressure, catalyst, duration, container }
 * @returns {Object} result — { success, outcome, failReason? }
 */
export function simulateExperiment(inputs, conditions) {
  if (!inputs || inputs.length < 2) {
    return { success: false, failReason: "Need at least 2 resources to experiment." };
  }

  // Merge + apply conditions
  const merged = mergeProperties(inputs);
  const final  = applyConditions(merged, conditions);

  // Apply variance to each property
  PROP_KEYS.forEach(k => { if (final[k] !== undefined) final[k] = variance(final[k], 12); });

  // Classify
  const outcome = classifyOutcome(final, inputs, conditions);

  // Residue = "failure" state — still returns a recipe card (partial discovery)
  const isFailure = outcome.type === "explosion" || outcome.type === "residue";

  const name = generateName(outcome.type, inputs, conditions, outcome.rarity);
  const emoji = TYPE_EMOJIS[outcome.type] || "⚗️";

  return {
    success: !isFailure,
    isPartial: outcome.type === "residue",
    isExplosion: outcome.type === "explosion",
    outcome: {
      name,
      emoji,
      type: outcome.type,
      rarity: outcome.rarity,
      description: "", // filled by LLM later
      properties: outcome.profile,
      effects: outcome.effects,
      uses: outcome.uses,
      tags: outcome.tags,
      stability: outcome.stability,
    },
    stabilityRating: outcome.stability,
  };
}

/** Determine if an AI agent should attempt this experiment based on skills/personality */
export function agentExperimentScore(agent, inputCount) {
  const craftSkill  = agent.skills?.crafting  || 1;
  const resSkill    = agent.skills?.research   || 1;
  const motivation  = (agent.agent_traits?.motivation || "").toLowerCase();
  let score = (craftSkill + resSkill) / 2;
  if (motivation.includes("research") || motivation.includes("knowledge") || motivation.includes("discover")) score += 20;
  if (agent.base_class === "craftsman" || agent.base_class === "wizard") score += 15;
  score += Math.random() * 20; // randomness
  return score;
}

export const PROPERTY_DESCRIPTIONS = {
  density:       "How compact/heavy the material is",
  reactivity:    "How readily it reacts with other materials",
  volatility:    "Tendency to change state or explode under stress",
  solubility:    "How well it dissolves in solvents",
  flammability:  "How easily it catches fire",
  toxicity:      "Potential harm to living organisms",
  conductivity:  "Ability to conduct heat or electricity",
  hardness:      "Resistance to deformation or scratching",
  luminescence:  "Emission of light",
  magical_affinity: "Resonance with arcane energies",
};

export const CONDITION_PRESETS = [
  { name: "Cold Mix",     heat: 0,  pressure: 10, duration: 60, catalyst: "",           emoji: "🧊" },
  { name: "Gentle Heat",  heat: 30, pressure: 20, duration: 50, catalyst: "",           emoji: "🔥" },
  { name: "High Forge",   heat: 85, pressure: 60, duration: 40, catalyst: "",           emoji: "⚒️" },
  { name: "Arcane Bath",  heat: 20, pressure: 10, duration: 70, catalyst: "moonstone",  emoji: "✨" },
  { name: "Pressure Seal",heat: 45, pressure: 90, duration: 80, catalyst: "",           emoji: "🔩" },
  { name: "Rapid Boil",   heat: 95, pressure: 30, duration: 20, catalyst: "",           emoji: "💨" },
  { name: "Slow Infusion",heat: 15, pressure: 5,  duration: 95, catalyst: "dragon_ash", emoji: "🕯️" },
];

export { PROP_KEYS, mergeProperties };