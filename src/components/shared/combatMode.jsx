/**
 * COMBAT MODE — Explicit combat state management.
 *
 * Shadowbane-style: player must be in combat mode to attack.
 * Combat mode is toggled with C key or enters automatically on aggro.
 *
 * In React, wire this into World.jsx state:
 *   const [combatMode, setCombatMode] = useState(false);
 *   const combatModeAuth = createCombatModeAuthority(setCombatMode);
 */

export function createCombatModeAuthority(setCombatMode) {
  let _active = false;
  let _enteredAt = null;
  const _exitCooldown = 3000; // 3 seconds before can exit after last combat action

  return {
    get isActive() {
      return _active;
    },

    get enteredAt() {
      return _enteredAt;
    },

    /**
     * Toggle combat mode on/off.
     * Cannot exit if recently attacked (cooldown).
     */
    toggle() {
      if (_active) {
        return this.exit();
      }
      return this.enter();
    },

    /**
     * Enter combat mode explicitly.
     */
    enter() {
      if (_active) return true;
      _active = true;
      _enteredAt = Date.now();
      setCombatMode(true);
      return true;
    },

    /**
     * Exit combat mode. Fails if still in exit cooldown.
     */
    exit() {
      if (!_active) return true;

      // Check cooldown (can't exit right after attacking)
      if (_enteredAt && (Date.now() - _enteredAt) < _exitCooldown) {
        return false; // Too soon
      }

      _active = false;
      _enteredAt = null;
      setCombatMode(false);
      return true;
    },

    /**
     * Force exit (death, zone change, etc).
     */
    forceExit() {
      _active = false;
      _enteredAt = null;
      setCombatMode(false);
    },

    /**
     * Auto-enter on aggro (monster walks onto player, etc).
     */
    autoEnterOnAggro() {
      return this.enter();
    },

    /**
     * Reset the exit timer (called when combat action occurs).
     */
    refreshCombatTimer() {
      _enteredAt = Date.now();
    },
  };
}

// ─── COMBAT MODE CONSTANTS ──────────────────────────────────────────────

export const COMBAT_MODE = {
  ACTIVE: "active",
  PEACEFUL: "peaceful",
};

// ─── COMBAT MODE INDICATOR DATA ──────────────────────────────────────────────

export const COMBAT_MODE_DISPLAY = {
  active: {
    label: "COMBAT",
    color: "#ef4444",
    icon: "⚔️",
    bgClass: "bg-red-900/60",
    borderClass: "border-red-600",
  },
  inactive: {
    label: "PEACE",
    color: "#4ade80",
    icon: "🕊️",
    bgClass: "bg-green-900/30",
    borderClass: "border-green-700",
  },
};

export const COMBAT_MODE_UI = {
  active: {
    label: "COMBAT",
    indicator: "⚔️",
    color: "text-red-400",
    bg: "bg-red-900/60",
    border: "border-red-600",
    pulse: true,
  },
  peaceful: {
    label: "PEACE",
    indicator: "🕊️",
    color: "text-green-400",
    bg: "bg-green-900/30",
    border: "border-green-700",
    pulse: false,
  },
};