/**
 * useInputController
 * Focus-aware input controller inspired by EverQuest + RuneScape.
 * - WASD / arrow key movement (held or tapped)
 * - Numpad 1-9 → ability hotkeys with cooldown tracking
 * - Target locking (click monster → locked target)
 * - Auto-attack loop against locked target
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MAP_W, MAP_H } from "@/components/shared/worldZones";
import { isPassable } from "@/components/shared/movementAuthority";

const MOVE_INTERVAL_MS = 180;

const WASD_DIRS = {
  w: [0, -1], arrowup: [0, -1],
  s: [0, 1],  arrowdown: [0, 1],
  a: [-1, 0], arrowleft: [-1, 0],
  d: [1, 0],  arrowright: [1, 0],
};

export default function useInputController({
  myCharacter,
  monsters,
  onMove,
  onStartCombat,
  abilities = [],
  enabled = true,
}) {
  const [lockedTarget, setLockedTarget] = useState(null);
  const [autoAttacking, setAutoAttacking] = useState(false);
  const [cooldowns, setCooldowns] = useState({});

  const charRef      = useRef(myCharacter);
  const monstersRef  = useRef(monsters);
  const heldKeys     = useRef(new Set());
  const moveTimerRef = useRef(null);
  const lockedRef    = useRef(null);
  const autoAtkRef   = useRef(false);
  const enabledRef   = useRef(enabled);

  charRef.current     = myCharacter;
  monstersRef.current = monsters;
  enabledRef.current  = enabled;

  const lockTarget = useCallback((monster) => {
    lockedRef.current = monster;
    setLockedTarget(monster);
  }, []);

  const stopAutoAttack = useCallback(() => {
    autoAtkRef.current = false;
    setAutoAttacking(false);
  }, []);

  const clearTarget = useCallback(() => {
    lockedRef.current = null;
    setLockedTarget(null);
    stopAutoAttack();
  }, [stopAutoAttack]);

  const startAutoAttack = useCallback(() => {
    if (!lockedRef.current) return;
    // If already auto-attacking, route a fresh combat call and return
    if (autoAtkRef.current) { stopAutoAttack(); return; }
    autoAtkRef.current = true;
    setAutoAttacking(true);
    if (onStartCombat) onStartCombat(lockedRef.current);
  }, [onStartCombat, stopAutoAttack]);

  const doStep = useCallback(() => {
    if (!enabledRef.current) return;
    const char = charRef.current;
    if (!char) return;
    for (const key of heldKeys.current) {
      const dir = WASD_DIRS[key];
      if (!dir) continue;
      const nx = char.x + dir[0];
      const ny = char.y + dir[1];
      if (!isPassable(nx, ny)) continue;
      const mon = monstersRef.current.find(m => m.is_alive && m.x === nx && m.y === ny);
      if (mon) {
        // Route through onStartCombat (authoritative path) — not directly startAutoAttack
        lockTarget(mon);
        if (onStartCombat) onStartCombat(mon);
        return;
      }
      if (onMove) onMove(nx, ny);
      return;
    }
  }, [onMove, lockTarget, onStartCombat]);

  const startMoveLoop = useCallback(() => {
    if (moveTimerRef.current) return;
    doStep();
    moveTimerRef.current = setInterval(doStep, MOVE_INTERVAL_MS);
  }, [doStep]);


  const stopMoveLoop = useCallback(() => {
    if (moveTimerRef.current) { clearInterval(moveTimerRef.current); moveTimerRef.current = null; }
  }, []);

  const fireAbility = useCallback((slotIndex) => {
    const ability = abilities[slotIndex];
    if (!ability) return;
    if ((cooldowns[ability.id] || 0) > 0) return;
    const cdMs = (ability.cooldown_rounds || 0) * 1500;
    if (cdMs > 0) setCooldowns(prev => ({ ...prev, [ability.id]: cdMs }));
    if (onStartCombat && lockedRef.current) onStartCombat(lockedRef.current, ability);
  }, [abilities, cooldowns, onStartCombat]);

  // Cooldown tick
  useEffect(() => {
    const id = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [aid, ms] of Object.entries(next)) {
          if (ms > 0) { next[aid] = Math.max(0, ms - 100); changed = true; }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (!enabledRef.current) return;

      const key = e.key.toLowerCase();
      if (key === "i") return;

      if (key === "escape") { clearTarget(); return; }

      if (key === "tab") {
        e.preventDefault();
        const char = charRef.current;
        if (!char) return;
        const alive = monstersRef.current.filter(m => m.is_alive);
        if (!alive.length) return;
        alive.sort((a, b) =>
          (Math.abs(a.x - char.x) + Math.abs(a.y - char.y)) -
          (Math.abs(b.x - char.x) + Math.abs(b.y - char.y))
        );
        const curIdx = lockedRef.current ? alive.findIndex(m => m.id === lockedRef.current.id) : -1;
        lockTarget(alive[(curIdx + 1) % alive.length]);
        return;
      }

      if (key === "enter" || key === " ") {
        e.preventDefault();
        startAutoAttack();
        return;
      }

      const numpad = key.match(/^numpad(\d)$/);
      const digit  = !numpad && key.match(/^(\d)$/);
      const slot   = numpad ? parseInt(numpad[1]) - 1 : digit ? parseInt(digit[1]) - 1 : -1;
      if (slot >= 0 && slot <= 8) { e.preventDefault(); fireAbility(slot); return; }

      if (WASD_DIRS[key]) { e.preventDefault(); heldKeys.current.add(key); startMoveLoop(); }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (WASD_DIRS[key]) {
        heldKeys.current.delete(key);
        if (heldKeys.current.size === 0) stopMoveLoop();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      stopMoveLoop();
      stopAutoAttack();
    };
  }, [fireAbility, lockTarget, clearTarget, startAutoAttack, startMoveLoop, stopMoveLoop, stopAutoAttack]);

  // Sync locked target from live monsters
  useEffect(() => {
    if (!lockedRef.current) return;
    const fresh = monsters.find(m => m.id === lockedRef.current.id);
    if (!fresh || !fresh.is_alive) clearTarget();
    else { lockedRef.current = fresh; setLockedTarget(fresh); }
  }, [monsters, clearTarget]);

  return { lockedTarget, lockTarget, clearTarget, autoAttacking, startAutoAttack, cooldowns };
}