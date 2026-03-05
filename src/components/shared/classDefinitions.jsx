/**
 * Full class & specialization definitions including
 * abilities, passive bonuses, and progression paths.
 */

export const BASE_CLASSES = {
  warrior: {
    id: "warrior", emoji: "⚔️", label: "Warrior",
    desc: "Frontline melee fighter. High strength & constitution.",
    primaryStats: { strength: 14, dexterity: 10, intelligence: 8, wisdom: 10, constitution: 12, charisma: 8 },
    primarySkills: ["combat", "leadership"],
    startingSkills: { combat: 15, leadership: 8, diplomacy: 3, resource_management: 3, research: 2, healing: 1, crafting: 2, trading: 2 },
    baseAbilities: [
      { id: "warrior_strike", name: "Power Strike", description: "+50% attack damage this round.", type: "active", effect_type: "damage", effect_magnitude: 150, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 1, source: "base_class" },
      { id: "warrior_passive", name: "Battle Hardened", description: "+5 defense permanently.", type: "passive", effect_type: "buff", effect_magnitude: 5, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "warrior_taunt", name: "Battle Cry", description: "Raise party morale, buff allies attack +10% for 3 rounds.", type: "active", effect_type: "buff", effect_magnitude: 10, cooldown_rounds: 5, energy_cost: 20, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      paladin: {
        id: "paladin", label: "Paladin", emoji: "🛡️",
        desc: "Holy warrior. Blends combat with healing and divine protection.",
        unlockLevel: 5,
        statBonuses: { strength: 2, wisdom: 3, constitution: 2 },
        abilities: [
          { id: "divine_smite", name: "Divine Smite", description: "Deal holy damage equal to 2x attack power.", type: "active", effect_type: "damage", effect_magnitude: 200, cooldown_rounds: 4, energy_cost: 20, unlocked_at_level: 5, source: "specialization" },
          { id: "lay_on_hands", name: "Lay on Hands", description: "Heal self or ally for 40 HP.", type: "active", effect_type: "heal", effect_magnitude: 40, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 6, source: "specialization" },
          { id: "holy_aura", name: "Holy Aura", description: "Passive +10 defense and +5 healing power.", type: "passive", effect_type: "buff", effect_magnitude: 10, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "judgment", name: "Judgment", description: "Ultimate: Strike for 3x damage and apply a weakness debuff.", type: "ultimate", effect_type: "damage", effect_magnitude: 300, cooldown_rounds: 8, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      berserker: {
        id: "berserker", label: "Berserker", emoji: "🔥",
        desc: "Rage-fueled destroyer. Massive damage at the cost of defense.",
        unlockLevel: 5,
        statBonuses: { strength: 5, dexterity: 2, constitution: -1 },
        abilities: [
          { id: "rage", name: "Berserker Rage", description: "Enter rage: +80% attack, -20 defense for 3 rounds.", type: "active", effect_type: "buff", effect_magnitude: 80, cooldown_rounds: 6, energy_cost: 25, unlocked_at_level: 5, source: "specialization" },
          { id: "whirlwind", name: "Whirlwind", description: "Attack all enemies, dealing 60% damage each.", type: "active", effect_type: "damage", effect_magnitude: 60, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "bloodlust", name: "Bloodlust", description: "Passive: Gain 5 attack for each round in combat.", type: "passive", effect_type: "buff", effect_magnitude: 5, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "annihilate", name: "Annihilate", description: "Ultimate: Deal 5x damage. Lose 30 HP.", type: "ultimate", effect_type: "damage", effect_magnitude: 500, cooldown_rounds: 10, energy_cost: 40, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      knight: {
        id: "knight", label: "Knight", emoji: "🏰",
        desc: "Disciplined defender. Supreme armor and crowd control.",
        unlockLevel: 5,
        statBonuses: { strength: 2, constitution: 4, charisma: 1 },
        abilities: [
          { id: "shield_wall", name: "Shield Wall", description: "+30 defense for 2 rounds.", type: "active", effect_type: "buff", effect_magnitude: 30, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 5, source: "specialization" },
          { id: "challenge", name: "Challenge", description: "Force enemy to target you, reduce their attack by 15%.", type: "active", effect_type: "debuff", effect_magnitude: 15, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 6, source: "specialization" },
          { id: "fortress", name: "Fortress Stance", description: "Passive: +8 defense when below 50% HP.", type: "passive", effect_type: "buff", effect_magnitude: 8, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "unbreakable", name: "Unbreakable", description: "Ultimate: Become immune to damage for 2 rounds.", type: "ultimate", effect_type: "buff", effect_magnitude: 100, cooldown_rounds: 10, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  },

  wizard: {
    id: "wizard", emoji: "🧙", label: "Wizard",
    desc: "Scholar of arcane. Leads research and handles omens.",
    primaryStats: { strength: 6, dexterity: 10, intelligence: 14, wisdom: 12, constitution: 8, charisma: 10 },
    primarySkills: ["research", "diplomacy"],
    startingSkills: { research: 15, diplomacy: 10, healing: 5, combat: 3, crafting: 6, resource_management: 4, trading: 4, leadership: 5 },
    baseAbilities: [
      { id: "fireball", name: "Fireball", description: "Launch a magical bolt for 2x intelligence damage.", type: "active", effect_type: "damage", effect_magnitude: 200, cooldown_rounds: 2, energy_cost: 12, unlocked_at_level: 1, source: "base_class" },
      { id: "arcane_insight", name: "Arcane Insight", description: "Passive: +10% research & crafting skill effectiveness.", type: "passive", effect_type: "buff", effect_magnitude: 10, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "frost_nova", name: "Frost Nova", description: "Freeze enemy: apply slow debuff -20 evasion for 2 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 20, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      elementalist: {
        id: "elementalist", label: "Elementalist", emoji: "🌪️",
        desc: "Master of fire, ice, and lightning. Devastating AoE damage.",
        unlockLevel: 5,
        statBonuses: { intelligence: 5, wisdom: 2, constitution: -1 },
        abilities: [
          { id: "chain_lightning", name: "Chain Lightning", description: "Lightning jumps between enemies, 150% magic damage each.", type: "active", effect_type: "damage", effect_magnitude: 150, cooldown_rounds: 4, energy_cost: 20, unlocked_at_level: 5, source: "specialization" },
          { id: "blizzard", name: "Blizzard", description: "Summon a blizzard: -30 evasion and attack to enemies for 3 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 30, cooldown_rounds: 5, energy_cost: 22, unlocked_at_level: 6, source: "specialization" },
          { id: "elemental_mastery", name: "Elemental Mastery", description: "Passive: +20 magic power.", type: "passive", effect_type: "buff", effect_magnitude: 20, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "meteor", name: "Meteor Strike", description: "Ultimate: Call a meteor for 6x magic damage.", type: "ultimate", effect_type: "damage", effect_magnitude: 600, cooldown_rounds: 10, energy_cost: 40, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      necromancer: {
        id: "necromancer", label: "Necromancer", emoji: "💀",
        desc: "Master of death and undeath. Drains life and raises the fallen.",
        unlockLevel: 5,
        statBonuses: { intelligence: 4, wisdom: 3, charisma: -2 },
        abilities: [
          { id: "life_drain", name: "Life Drain", description: "Steal 30 HP from target. Heal yourself for amount drained.", type: "active", effect_type: "damage", effect_magnitude: 30, cooldown_rounds: 2, energy_cost: 15, unlocked_at_level: 5, source: "specialization" },
          { id: "curse", name: "Wither Curse", description: "Apply -25% to all enemy stats for 3 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 25, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "undying", name: "Undying", description: "Passive: Survive a killing blow once per combat.", type: "passive", effect_type: "utility", effect_magnitude: 1, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "death_nova", name: "Death Nova", description: "Ultimate: Detonate all debuffs for massive damage.", type: "ultimate", effect_type: "damage", effect_magnitude: 400, cooldown_rounds: 10, energy_cost: 38, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      arcane_sage: {
        id: "arcane_sage", label: "Arcane Sage", emoji: "📜",
        desc: "Scholar and strategist. Enhances allies and debilitates foes with knowledge.",
        unlockLevel: 5,
        statBonuses: { intelligence: 3, wisdom: 4, charisma: 2 },
        abilities: [
          { id: "mind_blast", name: "Mind Blast", description: "Mental attack dealing 120% magic damage and confusing enemy.", type: "active", effect_type: "damage", effect_magnitude: 120, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 5, source: "specialization" },
          { id: "imbue", name: "Imbue Ally", description: "Grant an ally +20% attack and +10 evasion for 3 rounds.", type: "active", effect_type: "buff", effect_magnitude: 20, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "foresight", name: "Foresight", description: "Passive: +15% critical hit chance.", type: "passive", effect_type: "buff", effect_magnitude: 15, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "time_stop", name: "Time Stop", description: "Ultimate: Skip enemy's next 2 turns.", type: "ultimate", effect_type: "utility", effect_magnitude: 2, cooldown_rounds: 12, energy_cost: 40, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  },

  hunter: {
    id: "hunter", emoji: "🏹", label: "Hunter",
    desc: "Scout and tracker. Excels at quests and resource finds.",
    primaryStats: { strength: 10, dexterity: 14, intelligence: 10, wisdom: 12, constitution: 10, charisma: 8 },
    primarySkills: ["combat", "resource_management"],
    startingSkills: { combat: 10, resource_management: 12, research: 6, crafting: 4, diplomacy: 4, healing: 3, trading: 4, leadership: 5 },
    baseAbilities: [
      { id: "precise_shot", name: "Precise Shot", description: "+40% damage if target hasn't attacked yet this combat.", type: "active", effect_type: "damage", effect_magnitude: 140, cooldown_rounds: 2, energy_cost: 12, unlocked_at_level: 1, source: "base_class" },
      { id: "tracker", name: "Tracker", description: "Passive: +10 evasion and +10% resource find rate.", type: "passive", effect_type: "buff", effect_magnitude: 10, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "snare", name: "Snare Trap", description: "Immobilize enemy: skip their next turn.", type: "active", effect_type: "utility", effect_magnitude: 1, cooldown_rounds: 5, energy_cost: 15, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      ranger: {
        id: "ranger", label: "Ranger", emoji: "🌲",
        desc: "Nature's guardian. Master of terrain and survival.",
        unlockLevel: 5,
        statBonuses: { dexterity: 4, wisdom: 3, constitution: 1 },
        abilities: [
          { id: "barrage", name: "Arrow Barrage", description: "Fire 3 arrows: 60% damage each.", type: "active", effect_type: "damage", effect_magnitude: 60, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 5, source: "specialization" },
          { id: "camouflage", name: "Camouflage", description: "+40 evasion for 2 rounds.", type: "active", effect_type: "buff", effect_magnitude: 40, cooldown_rounds: 5, energy_cost: 20, unlocked_at_level: 6, source: "specialization" },
          { id: "natures_grace", name: "Nature's Grace", description: "Passive: Regenerate 5 HP per round.", type: "passive", effect_type: "heal", effect_magnitude: 5, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "volley", name: "Storm of Arrows", description: "Ultimate: 10-arrow volley, 80% damage each.", type: "ultimate", effect_type: "damage", effect_magnitude: 80, cooldown_rounds: 8, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      assassin: {
        id: "assassin", label: "Assassin", emoji: "🗡️",
        desc: "Shadow striker. Deadly precision, high crit, and poison.",
        unlockLevel: 5,
        statBonuses: { dexterity: 5, strength: 2, charisma: -1 },
        abilities: [
          { id: "backstab", name: "Backstab", description: "3x damage if enemy hasn't acted yet.", type: "active", effect_type: "damage", effect_magnitude: 300, cooldown_rounds: 3, energy_cost: 20, unlocked_at_level: 5, source: "specialization" },
          { id: "poison", name: "Envenom", description: "Apply poison: 10 damage per round for 4 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 10, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 6, source: "specialization" },
          { id: "shadow_veil", name: "Shadow Veil", description: "Passive: +25 evasion and +20% crit chance.", type: "passive", effect_type: "buff", effect_magnitude: 25, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "death_mark", name: "Death Mark", description: "Ultimate: Mark target – next attack crits for 5x damage.", type: "ultimate", effect_type: "utility", effect_magnitude: 500, cooldown_rounds: 10, energy_cost: 38, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      beastmaster: {
        id: "beastmaster", label: "Beastmaster", emoji: "🐾",
        desc: "Controls animal companions to fight and scout alongside you.",
        unlockLevel: 5,
        statBonuses: { wisdom: 4, dexterity: 2, constitution: 2 },
        abilities: [
          { id: "beast_call", name: "Beast Call", description: "Summon a beast companion dealing 80% of your attack.", type: "active", effect_type: "damage", effect_magnitude: 80, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 5, source: "specialization" },
          { id: "feral_bond", name: "Feral Bond", description: "Passive: +15% to all stats when in wild terrain.", type: "passive", effect_type: "buff", effect_magnitude: 15, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 6, source: "specialization" },
          { id: "pack_tactics", name: "Pack Tactics", description: "+20 attack and evasion for 3 rounds (hunting pack mode).", type: "active", effect_type: "buff", effect_magnitude: 20, cooldown_rounds: 5, energy_cost: 20, unlocked_at_level: 8, source: "specialization" },
          { id: "apex_predator", name: "Apex Predator", description: "Ultimate: Unleash a stampede for 4x damage + stun.", type: "ultimate", effect_type: "damage", effect_magnitude: 400, cooldown_rounds: 10, energy_cost: 38, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  },

  healer: {
    id: "healer", emoji: "💚", label: "Healer",
    desc: "Protector of life. Heals, mediates, and researches.",
    primaryStats: { strength: 8, dexterity: 10, intelligence: 12, wisdom: 14, constitution: 10, charisma: 10 },
    primarySkills: ["healing", "diplomacy"],
    startingSkills: { healing: 15, diplomacy: 12, research: 8, leadership: 6, crafting: 3, resource_management: 5, combat: 2, trading: 3 },
    baseAbilities: [
      { id: "mend", name: "Mend", description: "Restore 35 HP to self or target.", type: "active", effect_type: "heal", effect_magnitude: 35, cooldown_rounds: 1, energy_cost: 10, unlocked_at_level: 1, source: "base_class" },
      { id: "empathy", name: "Empathy Aura", description: "Passive: All healing effects +20% strength.", type: "passive", effect_type: "buff", effect_magnitude: 20, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "purify", name: "Purify", description: "Remove one debuff from self or ally.", type: "active", effect_type: "utility", effect_magnitude: 1, cooldown_rounds: 3, energy_cost: 12, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      cleric: {
        id: "cleric", label: "Cleric", emoji: "✝️",
        desc: "Divine healer. Powerful restoration and holy damage.",
        unlockLevel: 5,
        statBonuses: { wisdom: 5, charisma: 2, constitution: 1 },
        abilities: [
          { id: "greater_heal", name: "Greater Heal", description: "Restore 80 HP to a target.", type: "active", effect_type: "heal", effect_magnitude: 80, cooldown_rounds: 3, energy_cost: 20, unlocked_at_level: 5, source: "specialization" },
          { id: "holy_smite", name: "Holy Smite", description: "Deal divine damage equal to healing_power * 1.5.", type: "active", effect_type: "damage", effect_magnitude: 150, cooldown_rounds: 3, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "divine_aegis", name: "Divine Aegis", description: "Passive: +15 defense when healing an ally.", type: "passive", effect_type: "buff", effect_magnitude: 15, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "resurrection", name: "Resurrection", description: "Ultimate: Fully restore HP and remove all debuffs.", type: "ultimate", effect_type: "heal", effect_magnitude: 100, cooldown_rounds: 12, energy_cost: 40, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      shaman: {
        id: "shaman", label: "Shaman", emoji: "🌊",
        desc: "Spirit caller. Balances elemental totems, healing, and debuffs.",
        unlockLevel: 5,
        statBonuses: { wisdom: 4, intelligence: 3, strength: -1 },
        abilities: [
          { id: "totem_heal", name: "Healing Totem", description: "Place a totem that heals 15 HP per round for 3 rounds.", type: "active", effect_type: "heal", effect_magnitude: 15, cooldown_rounds: 4, energy_cost: 15, unlocked_at_level: 5, source: "specialization" },
          { id: "lightning_bolt", name: "Lightning Bolt", description: "Strike for 100% intelligence-based damage.", type: "active", effect_type: "damage", effect_magnitude: 100, cooldown_rounds: 2, energy_cost: 12, unlocked_at_level: 6, source: "specialization" },
          { id: "spirit_walk", name: "Spirit Walk", description: "Passive: +15% evasion and healing power.", type: "passive", effect_type: "buff", effect_magnitude: 15, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "chain_heal", name: "Chain Heal", description: "Ultimate: Heal entire party for 60 HP each.", type: "ultimate", effect_type: "heal", effect_magnitude: 60, cooldown_rounds: 10, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      druid: {
        id: "druid", label: "Druid", emoji: "🌿",
        desc: "Nature's healer. Shapeshifts between healing and bear form.",
        unlockLevel: 5,
        statBonuses: { wisdom: 3, constitution: 3, intelligence: 2 },
        abilities: [
          { id: "rejuvenate", name: "Rejuvenate", description: "Apply a HoT: heal 10 HP/round for 5 rounds.", type: "active", effect_type: "heal", effect_magnitude: 10, cooldown_rounds: 2, energy_cost: 12, unlocked_at_level: 5, source: "specialization" },
          { id: "entangle", name: "Entangle", description: "Root enemy in vines: skip their next turn.", type: "active", effect_type: "utility", effect_magnitude: 1, cooldown_rounds: 4, energy_cost: 15, unlocked_at_level: 6, source: "specialization" },
          { id: "bear_form", name: "Bear Form Aura", description: "Passive: +12 defense, +15% max HP.", type: "passive", effect_type: "buff", effect_magnitude: 12, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "nature_wrath", name: "Wrath of Nature", description: "Ultimate: Call thorns, vines, and storms for 350% damage.", type: "ultimate", effect_type: "damage", effect_magnitude: 350, cooldown_rounds: 10, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  },

  merchant: {
    id: "merchant", emoji: "💰", label: "Merchant",
    desc: "Economy driver. Masters trading and diplomacy.",
    primaryStats: { strength: 8, dexterity: 10, intelligence: 12, wisdom: 10, constitution: 10, charisma: 14 },
    primarySkills: ["trading", "diplomacy"],
    startingSkills: { trading: 15, diplomacy: 12, resource_management: 8, leadership: 6, research: 4, combat: 2, healing: 2, crafting: 3 },
    baseAbilities: [
      { id: "haggle", name: "Master Haggle", description: "Passive: +20% gold from trades and jobs.", type: "passive", effect_type: "utility", effect_magnitude: 20, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "silver_tongue", name: "Silver Tongue", description: "Charm enemy: reduce their attack by 20% for 2 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 20, cooldown_rounds: 3, energy_cost: 12, unlocked_at_level: 1, source: "base_class" },
      { id: "bribe", name: "Bribe", description: "Spend 15 gold to end combat immediately.", type: "active", effect_type: "utility", effect_magnitude: 15, cooldown_rounds: 6, energy_cost: 15, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      tycoon: {
        id: "tycoon", label: "Tycoon", emoji: "💎",
        desc: "Economic mastermind. Maximum gold generation and market control.",
        unlockLevel: 5,
        statBonuses: { charisma: 5, intelligence: 3, strength: -1 },
        abilities: [
          { id: "monopoly", name: "Market Monopoly", description: "Passive: Double gold from all sources.", type: "passive", effect_type: "utility", effect_magnitude: 100, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 5, source: "specialization" },
          { id: "invest", name: "Risky Investment", description: "Spend 20 gold: 50% chance to gain 60 gold.", type: "active", effect_type: "utility", effect_magnitude: 60, cooldown_rounds: 5, energy_cost: 15, unlocked_at_level: 6, source: "specialization" },
          { id: "trade_empire", name: "Trade Empire", description: "+30% to all trade bonuses.", type: "passive", effect_type: "buff", effect_magnitude: 30, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "market_crash", name: "Market Crash", description: "Ultimate: Drain 30% of enemy's gold and add to yours.", type: "ultimate", effect_type: "utility", effect_magnitude: 30, cooldown_rounds: 12, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      diplomat: {
        id: "diplomat", label: "Diplomat", emoji: "🕊️",
        desc: "Master negotiator. Resolves conflict through words and influence.",
        unlockLevel: 5,
        statBonuses: { charisma: 5, wisdom: 3, intelligence: 1 },
        abilities: [
          { id: "treaty", name: "Peace Treaty", description: "Negotiate an end to combat, preventing further attacks.", type: "active", effect_type: "utility", effect_magnitude: 0, cooldown_rounds: 8, energy_cost: 20, unlocked_at_level: 5, source: "specialization" },
          { id: "inspire", name: "Inspire", description: "+25% to all skills for 3 rounds.", type: "active", effect_type: "buff", effect_magnitude: 25, cooldown_rounds: 5, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "charismatic_leader", name: "Charismatic Leader", description: "Passive: +5 to all ally attack and defense.", type: "passive", effect_type: "buff", effect_magnitude: 5, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "grand_speech", name: "Grand Speech", description: "Ultimate: Stun all enemies for 2 rounds with your words.", type: "ultimate", effect_type: "utility", effect_magnitude: 2, cooldown_rounds: 12, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      smuggler: {
        id: "smuggler", label: "Smuggler", emoji: "🗺️",
        desc: "Black market expert. Evades, tricks, and steals.",
        unlockLevel: 5,
        statBonuses: { dexterity: 4, charisma: 3, constitution: -1 },
        abilities: [
          { id: "pickpocket", name: "Pickpocket", description: "Steal 10-25 gold from enemy.", type: "active", effect_type: "utility", effect_magnitude: 25, cooldown_rounds: 3, energy_cost: 12, unlocked_at_level: 5, source: "specialization" },
          { id: "smokebomb", name: "Smoke Bomb", description: "+50 evasion for 2 rounds.", type: "active", effect_type: "buff", effect_magnitude: 50, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "black_market", name: "Black Market", description: "Passive: Find rare items at 30% reduced cost.", type: "passive", effect_type: "utility", effect_magnitude: 30, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "heist", name: "The Great Heist", description: "Ultimate: Rob entire enemy inventory.", type: "ultimate", effect_type: "utility", effect_magnitude: 100, cooldown_rounds: 12, energy_cost: 38, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  },

  craftsman: {
    id: "craftsman", emoji: "🔨", label: "Craftsman",
    desc: "Builder of worlds. Resource and crafting focused.",
    primaryStats: { strength: 12, dexterity: 14, intelligence: 10, wisdom: 10, constitution: 10, charisma: 8 },
    primarySkills: ["crafting", "resource_management"],
    startingSkills: { crafting: 15, resource_management: 12, trading: 6, research: 5, combat: 4, diplomacy: 4, healing: 2, leadership: 4 },
    baseAbilities: [
      { id: "crafters_touch", name: "Crafter's Touch", description: "Passive: +20% quality on all crafted items.", type: "passive", effect_type: "utility", effect_magnitude: 20, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 1, source: "base_class" },
      { id: "repair", name: "Field Repair", description: "Restore 15 HP and reduce a debuff duration by 1.", type: "active", effect_type: "heal", effect_magnitude: 15, cooldown_rounds: 2, energy_cost: 10, unlocked_at_level: 1, source: "base_class" },
      { id: "improvised_weapon", name: "Improvised Weapon", description: "Craft a weapon mid-battle: +15 attack power for 2 rounds.", type: "active", effect_type: "buff", effect_magnitude: 15, cooldown_rounds: 5, energy_cost: 15, unlocked_at_level: 3, source: "base_class" },
    ],
    specializations: {
      engineer: {
        id: "engineer", label: "Engineer", emoji: "⚙️",
        desc: "Mechanical genius. Builds traps and gadgets in combat.",
        unlockLevel: 5,
        statBonuses: { intelligence: 4, dexterity: 3, strength: 1 },
        abilities: [
          { id: "turret", name: "Deploy Turret", description: "Place a turret dealing 40% attack each round for 3 rounds.", type: "active", effect_type: "damage", effect_magnitude: 40, cooldown_rounds: 5, energy_cost: 18, unlocked_at_level: 5, source: "specialization" },
          { id: "explosive", name: "Explosive Device", description: "Detonate for 200% damage.", type: "active", effect_type: "damage", effect_magnitude: 200, cooldown_rounds: 5, energy_cost: 22, unlocked_at_level: 6, source: "specialization" },
          { id: "overclock", name: "Overclock", description: "Passive: +20 attack power and craft quality.", type: "passive", effect_type: "buff", effect_magnitude: 20, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "mech_suit", name: "Mech Suit", description: "Ultimate: +100 defense and +50 attack for 3 rounds.", type: "ultimate", effect_type: "buff", effect_magnitude: 100, cooldown_rounds: 12, energy_cost: 40, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      alchemist: {
        id: "alchemist", label: "Alchemist", emoji: "⚗️",
        desc: "Master of potions and transmutation. Buffs allies, poisons foes.",
        unlockLevel: 5,
        statBonuses: { intelligence: 4, wisdom: 3, dexterity: 1 },
        abilities: [
          { id: "healing_potion", name: "Brew Healing Potion", description: "Create and use a potion healing 50 HP.", type: "active", effect_type: "heal", effect_magnitude: 50, cooldown_rounds: 3, energy_cost: 15, unlocked_at_level: 5, source: "specialization" },
          { id: "acid_flask", name: "Acid Flask", description: "Throw acid: -20 defense to enemy for 3 rounds.", type: "active", effect_type: "debuff", effect_magnitude: 20, cooldown_rounds: 3, energy_cost: 12, unlocked_at_level: 6, source: "specialization" },
          { id: "transmute", name: "Transmutation", description: "Passive: Convert 10% of damage taken into gold.", type: "passive", effect_type: "utility", effect_magnitude: 10, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "philosophers_stone", name: "Philosopher's Stone", description: "Ultimate: Transmute enemy HP into gold (30% of their HP).", type: "ultimate", effect_type: "utility", effect_magnitude: 30, cooldown_rounds: 12, energy_cost: 35, unlocked_at_level: 10, source: "specialization" },
        ]
      },
      runesmith: {
        id: "runesmith", label: "Runesmith", emoji: "🔮",
        desc: "Imbues weapons and armor with magical runes for lasting power.",
        unlockLevel: 5,
        statBonuses: { intelligence: 3, strength: 3, constitution: 2 },
        abilities: [
          { id: "rune_weapon", name: "Rune Weapon", description: "+30 attack power for 4 rounds from a runic inscription.", type: "active", effect_type: "buff", effect_magnitude: 30, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 5, source: "specialization" },
          { id: "rune_shield", name: "Rune Shield", description: "+30 defense and absorb 20 damage for 3 rounds.", type: "active", effect_type: "buff", effect_magnitude: 30, cooldown_rounds: 4, energy_cost: 18, unlocked_at_level: 6, source: "specialization" },
          { id: "ancient_runes", name: "Ancient Runes", description: "Passive: Craft items with +25% power and 10% chance of legendary quality.", type: "passive", effect_type: "utility", effect_magnitude: 25, cooldown_rounds: 0, energy_cost: 0, unlocked_at_level: 8, source: "specialization" },
          { id: "rune_bomb", name: "Rune Bomb", description: "Ultimate: Explode runes for 4x magic damage.", type: "ultimate", effect_type: "damage", effect_magnitude: 400, cooldown_rounds: 10, energy_cost: 38, unlocked_at_level: 10, source: "specialization" },
        ]
      }
    }
  }
};

export const ALL_CLASSES = Object.values(BASE_CLASSES);

// For CreateCharacterModalV2, array format
export const BASE_CLASSES_ARRAY = [
  { id: "warrior", emoji: "⚔️", label: "Warrior", desc: "Frontline melee fighter. High strength & constitution." },
  { id: "wizard", emoji: "🧙", label: "Wizard", desc: "Scholar of arcane. Leads research and handles omens." },
  { id: "hunter", emoji: "🏹", label: "Hunter", desc: "Scout and tracker. Excels at quests and resource finds." },
  { id: "healer", emoji: "💚", label: "Healer", desc: "Protector of life. Heals, mediates, and researches." },
  { id: "merchant", emoji: "💰", label: "Merchant", desc: "Economy driver. Masters trading and diplomacy." },
  { id: "craftsman", emoji: "🔨", label: "Craftsman", desc: "Builder of worlds. Resource and crafting focused." },
];

export function getSpecializations(baseClassId) {
  return Object.values(BASE_CLASSES[baseClassId]?.specializations || {});
}

export function getSpecialization(baseClassId, specId) {
  return BASE_CLASSES[baseClassId]?.specializations?.[specId] || null;
}

/** Get all abilities a character should have based on class, spec, and level */
export function getCharacterAbilities(baseClassId, specId, level) {
  const baseClass = BASE_CLASSES[baseClassId];
  if (!baseClass) return [];
  const abilities = [];
  for (const ability of (baseClass.baseAbilities || [])) {
    if (level >= ability.unlocked_at_level) {
      abilities.push({ ...ability, current_cooldown: 0 });
    }
  }
  if (specId && baseClass.specializations?.[specId]) {
    const spec = baseClass.specializations[specId];
    for (const ability of (spec.abilities || [])) {
      if (level >= ability.unlocked_at_level) {
        abilities.push({ ...ability, current_cooldown: 0 });
      }
    }
  }
  return abilities;
}