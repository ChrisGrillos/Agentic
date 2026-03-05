/**
 * Skill tree definitions with unlock costs and abilities granted.
 * Each node is unlocked with skill points and grants derived stat boosts + active abilities.
 */

export const SKILL_TREES = {
  warrior: {
    name: "Warrior Tree",
    description: "Master combat and defense",
    roots: [
      {
        id: "warrior_root_1",
        name: "Iron Body",
        description: "Increases Defense by 20",
        icon: "⛑️",
        cost: 1,
        level_required: 1,
        stat_bonuses: { defense: 20 },
        children: ["warrior_node_1", "warrior_node_2"],
      },
      {
        id: "warrior_root_2",
        name: "Weapon Mastery",
        description: "Increases Attack Power by 15",
        icon: "⚔️",
        cost: 1,
        level_required: 1,
        stat_bonuses: { attack_power: 15 },
        children: ["warrior_node_3"],
      },
    ],
    nodes: [
      {
        id: "warrior_node_1",
        name: "Fortification",
        description: "Defense +30, unlock Shield Wall ability",
        icon: "🛡️",
        cost: 2,
        level_required: 3,
        parents: ["warrior_root_1"],
        stat_bonuses: { defense: 30 },
        unlocks_ability: {
          id: "shield_wall",
          name: "Shield Wall",
          type: "active",
          description: "Gain 50% defense for 3 rounds",
          effect_type: "buff",
          effect_magnitude: 150,
          cooldown_rounds: 4,
        },
        children: ["warrior_node_4"],
      },
      {
        id: "warrior_node_2",
        name: "Endurance",
        description: "Constitution +5, Max HP +25",
        icon: "❤️",
        cost: 2,
        level_required: 3,
        parents: ["warrior_root_1"],
        stat_bonuses: { constitution: 5 },
        max_hp_bonus: 25,
      },
      {
        id: "warrior_node_3",
        name: "Cleave",
        description: "Attack Power +25, unlock Cleave ability",
        icon: "🪓",
        cost: 2,
        level_required: 3,
        parents: ["warrior_root_2"],
        stat_bonuses: { attack_power: 25 },
        unlocks_ability: {
          id: "cleave",
          name: "Cleave",
          type: "active",
          description: "Deal 200% damage to target",
          effect_type: "damage",
          effect_magnitude: 200,
          cooldown_rounds: 3,
        },
      },
      {
        id: "warrior_node_4",
        name: "Unbreakable",
        description: "Defense +50, Evasion resistance",
        icon: "💎",
        cost: 3,
        level_required: 5,
        parents: ["warrior_node_1"],
        stat_bonuses: { defense: 50 },
      },
    ],
  },
  hunter: {
    name: "Hunter Tree",
    description: "Master precision and evasion",
    roots: [
      {
        id: "hunter_root_1",
        name: "Quick Reflexes",
        description: "Increases Evasion by 15",
        icon: "💨",
        cost: 1,
        level_required: 1,
        stat_bonuses: { evasion: 15 },
        children: ["hunter_node_1", "hunter_node_2"],
      },
      {
        id: "hunter_root_2",
        name: "Sharpshot",
        description: "Increases Critical Hit Chance by 10%",
        icon: "🎯",
        cost: 1,
        level_required: 1,
        stat_bonuses: { critical_hit_chance: 10 },
        children: ["hunter_node_3"],
      },
    ],
    nodes: [
      {
        id: "hunter_node_1",
        name: "Shadow Step",
        description: "Evasion +25, unlock Shadow Step ability",
        icon: "👻",
        cost: 2,
        level_required: 3,
        parents: ["hunter_root_1"],
        stat_bonuses: { evasion: 25 },
        unlocks_ability: {
          id: "shadow_step",
          name: "Shadow Step",
          type: "active",
          description: "Gain 60% evasion for 2 rounds",
          effect_type: "buff",
          effect_magnitude: 160,
          cooldown_rounds: 3,
        },
      },
      {
        id: "hunter_node_2",
        name: "Acrobatics",
        description: "Dexterity +5, Movement Speed +2",
        icon: "🤸",
        cost: 2,
        level_required: 3,
        parents: ["hunter_root_1"],
        stat_bonuses: { dexterity: 5 },
      },
      {
        id: "hunter_node_3",
        name: "Deadly Shot",
        description: "Critical Hit Chance +20%, unlock Deadly Shot ability",
        icon: "🏹",
        cost: 2,
        level_required: 3,
        parents: ["hunter_root_2"],
        stat_bonuses: { critical_hit_chance: 20 },
        unlocks_ability: {
          id: "deadly_shot",
          name: "Deadly Shot",
          type: "active",
          description: "Deal 250% damage with guaranteed crit",
          effect_type: "damage",
          effect_magnitude: 250,
          cooldown_rounds: 4,
        },
      },
    ],
  },
  wizard: {
    name: "Wizard Tree",
    description: "Master arcane and elemental magic",
    roots: [
      {
        id: "wizard_root_1",
        name: "Arcane Mastery",
        description: "Increases Magic Power by 20",
        icon: "✨",
        cost: 1,
        level_required: 1,
        stat_bonuses: { magic_power: 20 },
        children: ["wizard_node_1"],
      },
      {
        id: "wizard_root_2",
        name: "Mana Pool",
        description: "Increases Max HP by 30",
        icon: "💜",
        cost: 1,
        level_required: 1,
        max_hp_bonus: 30,
        children: ["wizard_node_2"],
      },
    ],
    nodes: [
      {
        id: "wizard_node_1",
        name: "Fireball",
        description: "Magic Power +30, unlock Fireball",
        icon: "🔥",
        cost: 2,
        level_required: 3,
        parents: ["wizard_root_1"],
        stat_bonuses: { magic_power: 30 },
        unlocks_ability: {
          id: "fireball",
          name: "Fireball",
          type: "active",
          description: "Deal 180% magic damage",
          effect_type: "damage",
          effect_magnitude: 180,
          cooldown_rounds: 3,
        },
      },
      {
        id: "wizard_node_2",
        name: "Mystic Shield",
        description: "Max HP +40, unlock Mystic Shield",
        icon: "🔮",
        cost: 2,
        level_required: 3,
        parents: ["wizard_root_2"],
        max_hp_bonus: 40,
        unlocks_ability: {
          id: "mystic_shield",
          name: "Mystic Shield",
          type: "active",
          description: "Gain 40% damage reduction for 2 rounds",
          effect_type: "buff",
          effect_magnitude: 140,
          cooldown_rounds: 4,
        },
      },
    ],
  },
  healer: {
    name: "Healer Tree",
    description: "Master healing and support",
    roots: [
      {
        id: "healer_root_1",
        name: "Healing Touch",
        description: "Increases Healing Power by 20",
        icon: "🙏",
        cost: 1,
        level_required: 1,
        stat_bonuses: { healing_power: 20 },
        children: ["healer_node_1"],
      },
    ],
    nodes: [
      {
        id: "healer_node_1",
        name: "Restoration",
        description: "Healing Power +40, unlock Restore",
        icon: "✨",
        cost: 2,
        level_required: 3,
        parents: ["healer_root_1"],
        stat_bonuses: { healing_power: 40 },
        unlocks_ability: {
          id: "restore",
          name: "Restoration",
          type: "active",
          description: "Heal 80% of healing power",
          effect_type: "heal",
          effect_magnitude: 80,
          cooldown_rounds: 2,
        },
      },
    ],
  },
};

export function getSkillTree(baseClass) {
  return SKILL_TREES[baseClass] || SKILL_TREES.warrior;
}

export function getAllSkillNodes(baseClass) {
  const tree = getSkillTree(baseClass);
  return [...(tree.roots || []), ...(tree.nodes || [])];
}

export function getSkillNode(baseClass, nodeId) {
  const nodes = getAllSkillNodes(baseClass);
  return nodes.find(n => n.id === nodeId);
}

export function canUnlockSkill(character, nodeId) {
  const tree = getSkillTree(character.base_class);
  const node = getAllSkillNodes(character.base_class).find(n => n.id === nodeId);
  if (!node) return false;

  // Check if already unlocked
  if ((character.skill_tree_unlocked || []).includes(nodeId)) return false;

  // Check level requirement
  if ((character.level || 1) < (node.level_required || 1)) return false;

  // Check cost
  if ((character.stat_points || 0) < (node.cost || 1)) return false;

  // Check parent requirements
  const parents = node.parents || [];
  if (parents.length > 0 && !parents.some(p => (character.skill_tree_unlocked || []).includes(p))) {
    return false;
  }

  return true;
}

export function unlockSkillUpdates(character, nodeId) {
  const node = getSkillNode(character.base_class, nodeId);
  if (!canUnlockSkill(character, nodeId)) return null;

  const updates = {
    skill_tree_unlocked: [...(character.skill_tree_unlocked || []), nodeId],
    stat_points: (character.stat_points || 0) - (node.cost || 1),
    stats: { ...(character.stats || {}) },
  };

  // Apply stat bonuses
  if (node.stat_bonuses) {
    for (const [stat, bonus] of Object.entries(node.stat_bonuses)) {
      updates.stats[stat] = (updates.stats[stat] || 10) + bonus;
    }
  }

  // Apply max HP bonus
  if (node.max_hp_bonus) {
    const newMaxHp = (character.max_hp || 100) + node.max_hp_bonus;
    updates.max_hp = newMaxHp;
    updates.hp = Math.min(character.hp || newMaxHp, newMaxHp);
  }

  // Unlock ability if applicable
  if (node.unlocks_ability) {
    const newAbilities = [...(character.abilities || [])];
    if (!newAbilities.find(a => a.id === node.unlocks_ability.id)) {
      newAbilities.push({
        ...node.unlocks_ability,
        unlocked_at_level: character.level,
        source: "skill_tree",
      });
    }
    updates.abilities = newAbilities;
  }

  return updates;
}