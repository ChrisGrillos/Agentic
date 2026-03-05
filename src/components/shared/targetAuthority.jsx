/**
 * TARGET AUTHORITY — Single source of truth for target selection and locking.
 *
 * All input paths (click, Tab, walk-onto, hotbar) MUST route through
 * selectTarget / lockTarget / clearTarget.
 *
 * This module manages the canonical active target. No component should
 * maintain its own parallel target state.
 */

// ─── TARGET STATE ─────────────────────────────────────────────────────────────

/**
 * Create a target authority instance.
 * In React, wrap this in a context or pass through World.jsx state.
 *
 * Usage:
 *   const [activeTarget, setActiveTarget] = useState(null);
 *   const targetAuth = createTargetAuthority(setActiveTarget);
 *   targetAuth.selectTarget(monster);
 */
export function createTargetAuthority(setActiveTarget) {
  let _current = null;

  return {
    /**
     * Get current target (can be monster, player, NPC, or null).
     */
    get current() {
      return _current;
    },

    /**
     * Select a target. Validates it exists and is targetable.
     * Also locks the target (select = lock in this model).
     */
    selectTarget(entity) {
      if (!entity) {
        _current = null;
        setActiveTarget(null);
        return null;
      }

      if (!isTargetable(entity)) {
        return null;
      }

      _current = entity;
      setActiveTarget(entity);
      return entity;
    },

    /**
     * Lock current target (alias for select — kept for API compat).
     */
    lockTarget(entity) {
      return this.selectTarget(entity);
    },

    /**
     * Clear target.
     */
    clearTarget() {
      _current = null;
      setActiveTarget(null);
    },

    /**
     * Tab-cycle to next valid target from a list.
     */
    cycleTarget(entities, direction = 1) {
      const valid = entities.filter(isTargetable);
      if (valid.length === 0) return null;

      const currentIdx = _current ? valid.findIndex(e => e.id === _current.id) : -1;
      const nextIdx = (currentIdx + direction + valid.length) % valid.length;
      return this.selectTarget(valid[nextIdx]);
    },
  };
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

/**
 * Can this entity be targeted?
 */
export function isTargetable(entity) {
  if (!entity) return false;
  // Dead things can't be targeted
  if (entity.hp !== undefined && entity.hp <= 0) return false;
  if (entity.is_alive === false) return false;
  return true;
}

/**
 * Is the target hostile to the player?
 */
export function isHostile(entity) {
  if (!entity) return false;
  // Monsters are always hostile
  if (entity.type === "monster" || entity.monster_type) return true;
  // Players can be hostile in PvP zones (handled by worldRules)
  return false;
}

/**
 * Is the target friendly?
 */
export function isFriendly(entity) {
  if (!entity) return false;
  if (entity.type === "human" || entity.type === "agent") return true;
  if (entity.npc_type) return true;
  return false;
}

/**
 * Get target display info for TargetFrame.
 */
export function getTargetInfo(entity) {
  if (!entity) return null;

  return {
    name: entity.name || entity.monster_type || "Unknown",
    level: entity.level || 1,
    hp: entity.hp ?? 0,
    maxHp: entity.max_hp ?? entity.hp ?? 100,
    type: entity.type || (entity.monster_type ? "monster" : "unknown"),
    hostile: isHostile(entity),
    race: entity.race || null,
    class: entity.class || entity.monster_type || null,
  };
}

/**
 * Get zone rule summary for a given coordinate.
 * Returns info about zone safety, danger, and PvP rules.
 */
export function getZoneRuleSummary(x, y) {
  // Placeholder: returns safe by default, to be extended with worldRules
  return {
    isSafe: true,
    dangerLevel: 0,
    pvpAllowed: false,
    zone: null,
    emoji: "🛡️",
    label: "Safe",
    color: "text-green-400",
    bgColor: "bg-green-900/30",
    borderColor: "border-green-700",
  };
}

/**
 * Determine hostility class for UI styling.
 */
export function getHostilityClass(myCharacter, target, zone) {
  if (!target) return "neutral";
  
  // Self
  if (myCharacter && target.id === myCharacter.id) return "self";
  
  // Monsters are always hostile
  if (target.type === "monster" || target.monster_type) return "hostile";
  
  // Other players/agents are friendly by default (PvP flags handled elsewhere)
  if (target.type === "human" || target.type === "ai_agent" || target.npc_type) return "friendly";
  
  return "neutral";
}

/**
 * Can we engage (attack) this target?
 */
export function canEngage(myCharacter, target, x, y) {
  if (!myCharacter || !target) {
    return { legal: false, blockedBySafe: false };
  }
  
  // Can't attack self
  if (target.id === myCharacter.id) {
    return { legal: false, blockedBySafe: true };
  }
  
  // Monsters are always engageable
  if (target.type === "monster" || target.monster_type) {
    return { legal: true, blockedBySafe: false };
  }
  
  // PvP targets depend on zone rules (for now, return true in contested zones)
  return { legal: true, blockedBySafe: false };
}