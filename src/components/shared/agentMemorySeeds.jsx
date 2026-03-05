/**
 * agentMemorySeeds — Worldborn backstory scaffolding for AI agents in Vaelrath.
 *
 * Provides upbringing templates, formative memory tags, long-term drives,
 * and race-specific name pools. Used to seed agent personality and decision context.
 *
 * SCOPE: Data only. No simulation, no DB writes.
 */

// ─── UPBRINGING TEMPLATES ─────────────────────────────────────────────────────
// 10 templates covering the major post-Sundering life paths
export const UPBRINGINGS = {
  safehold_civic: {
    id: "safehold_civic",
    label: "Safehold Civic",
    description: "Raised within the walls of High Bastion under Accord rule. Orderly, literate, aware of trade and law.",
    zone_affinity: "high_bastion",
    faction_lean: "accord_wardens",
    stat_biases: { charisma: 1, intelligence: 1 },
    trait_tags: ["accord_loyal", "literate", "market_savvy"],
  },
  frontier_survivor: {
    id: "frontier_survivor",
    label: "Frontier Survivor",
    description: "Grew up on the contested edges of the Ashen March or Thornwild. Hardened, resourceful, distrustful of institutions.",
    zone_affinity: "the_ashen_march",
    faction_lean: null,
    stat_biases: { constitution: 2, wisdom: 1 },
    trait_tags: ["self_reliant", "distrustful", "wilderness_read"],
  },
  kharum_delver: {
    id: "kharum_delver",
    label: "Kharum Delver",
    description: "Born into the deep-shaft clans of the Kharum. Values iron, silence, and results over words.",
    zone_affinity: "kharum_deep",
    faction_lean: "ironbound_compact",
    stat_biases: { strength: 2, constitution: 1 },
    trait_tags: ["compact_bred", "pragmatic", "deep_listener"],
  },
  archive_apprentice: {
    id: "archive_apprentice",
    label: "Archive Apprentice",
    description: "Trained by the Archive Seekers to recover and interpret dominion-era knowledge from the Sunken Crown.",
    zone_affinity: "the_sunken_crown",
    faction_lean: "archive_seekers",
    stat_biases: { intelligence: 2, wisdom: 1 },
    trait_tags: ["lore_hungry", "ruin_diver", "cautious_scholar"],
  },
  remnant_ward: {
    id: "remnant_ward",
    label: "Verdant Remnant Ward",
    description: "Raised in the Thornwild by the Remnant. Knows the old wildways and the language of living things.",
    zone_affinity: "the_thornwild",
    faction_lean: "verdant_remnant",
    stat_biases: { wisdom: 2, dexterity: 1 },
    trait_tags: ["wildwise", "nature_bound", "accord_skeptic"],
  },
  greyfen_touched: {
    id: "greyfen_touched",
    label: "Greyfen Touched",
    description: "Survived childhood in the Greyfen Reach. Carries a quiet relationship with death and the Unquiet.",
    zone_affinity: "greyfen_reach",
    faction_lean: "grey_conclave",
    stat_biases: { intelligence: 1, wisdom: 2 },
    trait_tags: ["death_adjacent", "conclave_adjacent", "unnerving_calm"],
  },
  march_road_trader: {
    id: "march_road_trader",
    label: "March Road Trader",
    description: "Grew up on moving caravans along the Ashen March roads. Knows prices, people, and which inn doesn't water down the ale.",
    zone_affinity: "the_ashen_march",
    faction_lean: "ironmark_guild",
    stat_biases: { charisma: 2, dexterity: 1 },
    trait_tags: ["road_wise", "guild_adjacent", "price_memory"],
  },
  bastion_foundling: {
    id: "bastion_foundling",
    label: "Bastion Foundling",
    description: "Unknown origins, raised by the Accord's charity ward in High Bastion. Intensely curious about their own past.",
    zone_affinity: "high_bastion",
    faction_lean: "accord_wardens",
    stat_biases: { charisma: 1, constitution: 1 },
    trait_tags: ["origin_seeker", "accord_adjacent", "adaptive"],
  },
  cinder_exile: {
    id: "cinder_exile",
    label: "Cinder Vale Exile",
    description: "Cast out of their former life, they survived the Vale of Cinders. Changed by it. Speaks little of what they saw.",
    zone_affinity: "vale_of_cinders",
    faction_lean: null,
    stat_biases: { constitution: 2, strength: 1 },
    trait_tags: ["exile_born", "fire_scarred", "speaks_rarely"],
  },
  itinerant_scholar: {
    id: "itinerant_scholar",
    label: "Itinerant Scholar",
    description: "No fixed upbringing — studied at every waystation and safehold they passed through. Broad knowledge, shallow roots.",
    zone_affinity: null,
    faction_lean: null,
    stat_biases: { intelligence: 2 },
    trait_tags: ["rootless", "knowledge_collector", "neutral_observer"],
  },
};

// ─── FORMATIVE MEMORY TAGS ────────────────────────────────────────────────────
// 16 memory fragments that shape personality and decision weights
export const MEMORY_TAGS = [
  { id: "witnessed_sundering_ruin",    label: "Witnessed Sundering Ruin",    consequence: "Fears institutional collapse. Hoards stability." },
  { id: "saved_by_stranger",           label: "Saved by a Stranger",         consequence: "Trusts individuals. Distrusts crowds." },
  { id: "betrayed_by_ally",            label: "Betrayed by an Ally",         consequence: "Slow to trust. Remembers debts." },
  { id: "lost_family_to_greyfen",      label: "Lost Family to the Greyfen",  consequence: "Driven to understand the Unquiet. Grief-adjacent." },
  { id: "apprenticed_to_ironmark",     label: "Apprenticed to Ironmark",     consequence: "Understands trade value. Guild-adjacent loyalty." },
  { id: "survived_kharum_collapse",    label: "Survived Kharum Collapse",    consequence: "Values preparation. Distrust of unstable ground — literal and political." },
  { id: "found_dominion_artifact",     label: "Found a Dominion Artifact",   consequence: "Curious about the old world. May pursue it obsessively." },
  { id: "fled_a_burning_village",      label: "Fled a Burning Village",      consequence: "Low tolerance for injustice. Acts quickly in crisis." },
  { id: "raised_by_multiple_factions", label: "Raised Across Factions",      consequence: "Sees all sides. Poor faction loyalty. Good mediator." },
  { id: "first_kill_was_unquiet",      label: "First Kill Was the Unquiet",  consequence: "Untroubled by violence against undead. Wary of all decay." },
  { id: "owes_life_debt",             label: "Owes a Life Debt",            consequence: "Honor-bound to fulfil the debt. May override other goals." },
  { id: "held_a_secret_too_long",     label: "Held a Secret Too Long",      consequence: "Experienced in deception. Uncomfortable with full transparency." },
  { id: "won_against_odds",           label: "Won Against the Odds",        consequence: "Optimistic under pressure. Can underestimate threats." },
  { id: "exiled_from_home_zone",      label: "Exiled from Home Zone",       consequence: "Rootless drive to prove worth. Ambivalent about belonging." },
  { id: "witnessed_accord_injustice", label: "Witnessed Accord Injustice",  consequence: "Questions authority. May challenge rather than comply." },
  { id: "protected_the_weak",         label: "Protected the Weak",          consequence: "Protective instinct. Slower to abandon struggling allies." },
];

// ─── LONG-TERM DRIVES ─────────────────────────────────────────────────────────
// 12 motivations that shape an agent's long-horizon behavior
export const LONG_TERM_DRIVES = [
  { id: "restore_order",      label: "Restore the Accord's Order",   description: "Believes stability is the highest good. Works to strengthen institutions." },
  { id: "uncover_dominion",   label: "Uncover Dominion Secrets",     description: "Obsessed with recovering what was lost in the Sundering." },
  { id: "accumulate_power",   label: "Accumulate Power",             description: "Pragmatic self-interest. Faction loyalty is instrumental." },
  { id: "protect_the_wild",   label: "Protect the Thornwild",        description: "The old world must not be consumed by new empire." },
  { id: "master_crafts",      label: "Master the Ironmark Crafts",   description: "Perfection in making things. Legacy through creation." },
  { id: "understand_undead",  label: "Understand the Unquiet",       description: "The Greyfen holds answers. Must know — not fear." },
  { id: "avenge_loss",        label: "Avenge a Past Loss",           description: "A specific wrong drives all decisions. Consumes slowly." },
  { id: "prove_worth",        label: "Prove Worth to the World",     description: "Often born of exile or low birth. Recognition-seeking." },
  { id: "find_belonging",     label: "Find True Belonging",          description: "Rootless. Seeks a place or people to call home." },
  { id: "survive_at_all_cost",label: "Survive at All Cost",          description: "Threat-first reasoning. All alliances are conditional." },
  { id: "seek_knowledge",     label: "Seek All Knowledge",           description: "Archive Seeker disposition. Information is power and joy." },
  { id: "forge_new_accord",   label: "Forge a New Accord",           description: "The old charter is flawed. Build something better." },
];

// ─── NAME POOLS ───────────────────────────────────────────────────────────────
export const RACE_NAME_POOLS = {
  human: {
    given: ["Aldric", "Maren", "Tove", "Cassin", "Brek", "Elira", "Oswin", "Fara", "Gareth", "Sylla"],
    family: ["Ashmark", "Ferren", "Coldmere", "Duskwall", "Greymantle", "Ironshard", "Stoneward"],
  },
  elf: {
    given: ["Aeveth", "Sylvara", "Thalindor", "Caeldris", "Erevan", "Mirael", "Vaelith", "Solindra"],
    family: ["Morndawn", "Thornveil", "Ashwhisper", "Duskleaf", "Silvenmere", "Rootweave"],
  },
  dwarf: {
    given: ["Brok", "Thunda", "Gorrak", "Heldis", "Kazrik", "Brunda", "Vorris", "Ingeld"],
    family: ["Ironcore", "Deepstrike", "Hammerfen", "Stonecroft", "Cokegate", "Shaftborn"],
  },
  halfling: {
    given: ["Pip", "Merry", "Sable", "Cress", "Tobben", "Lila", "Finch", "Bramble", "Wren"],
    family: ["Thistlefoot", "Quickfen", "Dunbarrow", "Greenhollow", "Smallmere"],
  },
  orc: {
    given: ["Grakh", "Vorra", "Skeld", "Bruda", "Harag", "Zherak", "Morda", "Urgak"],
    family: ["Bonecrag", "Ashblood", "Ironjaw", "Felmoor", "Stonegrip", "Warcrest"],
  },
  half_giant: {
    given: ["Omund", "Thara", "Golvek", "Brannis", "Rudha", "Stokar", "Elva"],
    family: ["Ridgeborn", "Deepmantle", "Stoneshade", "Highmere", "Coldreach"],
  },
};

// ─── SEED GENERATOR ───────────────────────────────────────────────────────────
/**
 * generateWorldbornSeed(raceId, regionId?)
 * Returns a structured backstory seed for an AI agent.
 * Deterministic-ish: uses provided race/region to bias selections.
 */
export function generateWorldbornSeed(raceId = "human", regionId = null) {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Pick upbringing — prefer one that matches regionId or race defaults
  const matchingUpbringings = Object.values(UPBRINGINGS).filter(
    u => u.zone_affinity === regionId
  );
  const upbringing = rand(
    matchingUpbringings.length > 0 ? matchingUpbringings : Object.values(UPBRINGINGS)
  );

  // Pick 2 memory tags
  const shuffledMemories = [...MEMORY_TAGS].sort(() => Math.random() - 0.5);
  const memories = shuffledMemories.slice(0, 2);

  // Pick 1 long-term drive
  const drive = rand(LONG_TERM_DRIVES);

  // Pick a name
  const namePool = RACE_NAME_POOLS[raceId] || RACE_NAME_POOLS.human;
  const givenName = rand(namePool.given);
  const familyName = rand(namePool.family);

  return {
    name: `${givenName} ${familyName}`,
    race: raceId,
    upbringing,
    formative_memories: memories,
    drive,
    faction_lean: upbringing.faction_lean,
    stat_biases: upbringing.stat_biases,
    trait_tags: [
      ...upbringing.trait_tags,
      ...memories.map(m => m.id),
    ],
  };
}