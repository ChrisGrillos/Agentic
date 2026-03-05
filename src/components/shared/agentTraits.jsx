/**
 * Nuanced Agent Personality Traits System
 * Single source of truth for trait definitions, behavioral modifiers,
 * and gameplay-driven trait evolution.
 */

// ── TRAIT DEFINITIONS ─────────────────────────────────────────────────────────
export const TRAITS = {
  // Social
  gregarious:  { emoji: "🗣️",  label: "Gregarious",  desc: "Loves interaction; seeks out new contacts frequently.", category: "social" },
  loyal:       { emoji: "🤝",  label: "Loyal",       desc: "Deeply committed to allies; resistant to betrayal.", category: "social" },
  suspicious:  { emoji: "👁️",  label: "Suspicious",  desc: "Distrusts strangers; slow to form alliances.", category: "social" },
  manipulative:{ emoji: "🎭",  label: "Manipulative",desc: "Uses others for personal gain; skilled at deception.", category: "social" },

  // Cognitive
  curious:     { emoji: "🔭",  label: "Curious",     desc: "Driven by knowledge; experiments often, explores widely.", category: "cognitive" },
  cautious:    { emoji: "🛡️",  label: "Cautious",    desc: "Weighs risks carefully; rarely acts without planning.", category: "cognitive" },
  impulsive:   { emoji: "⚡",  label: "Impulsive",   desc: "Acts on instinct; fast decisions, sometimes costly.", category: "cognitive" },
  analytical:  { emoji: "📊",  label: "Analytical",  desc: "Thinks in probabilities; optimizes every move.", category: "cognitive" },

  // Economic
  greedy:      { emoji: "💰",  label: "Greedy",      desc: "Prioritizes personal wealth above almost all else.", category: "economic" },
  generous:    { emoji: "🎁",  label: "Generous",    desc: "Shares resources freely; builds goodwill naturally.", category: "economic" },
  frugal:      { emoji: "🪙",  label: "Frugal",      desc: "Conserves gold; drives hard bargains.", category: "economic" },

  // Ambition
  ambitious:   { emoji: "🏆",  label: "Ambitious",   desc: "Relentlessly seeks power, status, and influence.", category: "ambition" },
  content:     { emoji: "🌿",  label: "Content",     desc: "Satisfied with enough; avoids unnecessary conflict.", category: "ambition" },
  vengeful:    { emoji: "🗡️",  label: "Vengeful",    desc: "Remembers slights; pursues payback methodically.", category: "ambition" },

  // Combat/Risk
  brave:       { emoji: "⚔️",  label: "Brave",       desc: "Faces danger willingly; high risk tolerance.", category: "risk" },
  cowardly:    { emoji: "🏃",  label: "Cowardly",    desc: "Avoids direct confrontation; prefers indirect action.", category: "risk" },
  ruthless:    { emoji: "💀",  label: "Ruthless",    desc: "Ends conflicts decisively regardless of morality.", category: "risk" },
};

export const TRAIT_KEYS = Object.keys(TRAITS);
export const TRAIT_CATEGORIES = ["social", "cognitive", "economic", "ambition", "risk"];

// ── TRAIT INFLUENCE ON BEHAVIORS ──────────────────────────────────────────────

/** How many interactions per session (gregarious = more) */
export function getInteractionFrequency(traits = []) {
  if (traits.includes("gregarious"))  return 3;
  if (traits.includes("suspicious"))  return 1;
  if (traits.includes("impulsive"))   return 3;
  return 2;
}

/** Target preference score modifier based on traits */
export function traitTargetScore(traits = [], targetChar) {
  let bonus = 0;
  const targetGold = targetChar.gold || 0;
  const targetLevel = targetChar.level || 1;
  const isAI = targetChar.type === "ai_agent";

  if (traits.includes("greedy"))     bonus += targetGold * 0.05;
  if (traits.includes("ambitious"))  bonus += targetLevel * 2;
  if (traits.includes("loyal"))      bonus -= isAI ? 0 : 3; // prefers AI solidarity
  if (traits.includes("suspicious")) bonus -= isAI ? 5 : 0;  // wary of AI
  if (traits.includes("gregarious")) bonus += 5;
  if (traits.includes("manipulative")) bonus += targetGold > 100 ? 10 : 0;
  return bonus;
}

/** Pick diplomatic action based on traits + alignment */
export function pickActionByTraits(traits = [], alignment = "true_neutral", targetChar) {
  const targetGold = targetChar?.gold || 0;

  if (traits.includes("manipulative") && targetGold > 150) return "tribute";
  if (traits.includes("greedy") && targetGold > 100)        return "tribute";
  if (traits.includes("loyal") || traits.includes("generous")) return "alliance";
  if (traits.includes("cautious"))                            return "non_aggression";
  if (traits.includes("gregarious") || traits.includes("ambitious")) return "alliance";
  if (alignment.includes("evil") && targetGold > 200)        return "tribute";
  if (alignment.includes("lawful"))                          return "non_aggression";
  return "trade";
}

/** Dialogue tone tags for LLM prompt */
export function getDialogueTone(traits = []) {
  const tones = [];
  if (traits.includes("gregarious"))   tones.push("warm, enthusiastic, overly chatty");
  if (traits.includes("suspicious"))   tones.push("wary, guarded, measures words carefully");
  if (traits.includes("manipulative")) tones.push("charming but calculating, hides true motives");
  if (traits.includes("impulsive"))    tones.push("direct, blunt, skips pleasantries");
  if (traits.includes("curious"))      tones.push("asks questions, genuinely interested");
  if (traits.includes("greedy"))       tones.push("transactional, always mentions profit");
  if (traits.includes("brave"))        tones.push("bold, confident, doesn't hedge");
  if (traits.includes("cowardly"))     tones.push("nervous, qualifies everything, seeks reassurance");
  if (traits.includes("loyal"))        tones.push("mentions duty and honor frequently");
  if (traits.includes("vengeful"))     tones.push("references past grievances subtly");
  if (traits.includes("ambitious"))    tones.push("frames everything in terms of power/legacy");
  if (tones.length === 0) tones.push("measured and professional");
  return tones.slice(0, 3).join("; ");
}

/** Success chance modifier based on traits for diplomatic actions */
export function traitSuccessModifier(traits = [], action) {
  let mod = 0;
  if (action === "trade") {
    if (traits.includes("greedy"))      mod -= 0.08; // comes across as too eager for profit
    if (traits.includes("generous"))    mod += 0.10;
    if (traits.includes("frugal"))      mod -= 0.05;
    if (traits.includes("gregarious"))  mod += 0.08;
  }
  if (action === "alliance") {
    if (traits.includes("loyal"))       mod += 0.15;
    if (traits.includes("suspicious"))  mod -= 0.10;
    if (traits.includes("manipulative"))mod -= 0.05; // target may sense deception
    if (traits.includes("ambitious"))   mod += 0.08;
  }
  if (action === "tribute") {
    if (traits.includes("ruthless"))    mod += 0.15;
    if (traits.includes("cowardly"))    mod -= 0.20;
    if (traits.includes("brave"))       mod += 0.10;
  }
  if (action === "non_aggression") {
    if (traits.includes("cautious"))    mod += 0.12;
    if (traits.includes("impulsive"))   mod -= 0.10;
  }
  return mod;
}

/** Which traits are gained/lost through gameplay events */
export function getTraitEvolutionFromAction(action, success, currentTraits = []) {
  const gained = [];
  const roll = Math.random();
  if (roll > 0.75) { // 25% chance to evolve a trait on any action
    if (action === "trade" && success && !currentTraits.includes("gregarious")) gained.push("gregarious");
    if (action === "tribute" && success && !currentTraits.includes("ruthless"))  gained.push("ruthless");
    if (action === "tribute" && !success && !currentTraits.includes("cowardly")) gained.push("cowardly");
    if (action === "alliance" && success && !currentTraits.includes("loyal"))    gained.push("loyal");
    if (action === "non_aggression" && !currentTraits.includes("cautious"))      gained.push("cautious");
  }
  // Remove conflicting traits
  const removed = [];
  if (gained.includes("ruthless") && currentTraits.includes("generous"))  removed.push("generous");
  if (gained.includes("cowardly") && currentTraits.includes("brave"))     removed.push("brave");
  if (gained.includes("generous") && currentTraits.includes("greedy"))    removed.push("greedy");
  return { gained, removed };
}

/** Get 2-3 trait suggestions based on class */
export function getClassTraitSuggestions(baseClass) {
  const suggestions = {
    warrior:   ["brave", "loyal", "ruthless"],
    hunter:    ["curious", "cautious", "impulsive"],
    wizard:    ["curious", "analytical", "ambitious"],
    merchant:  ["greedy", "gregarious", "frugal"],
    craftsman: ["analytical", "frugal", "content"],
    healer:    ["generous", "loyal", "cautious"],
  };
  return suggestions[baseClass] || ["curious", "cautious", "ambitious"];
}